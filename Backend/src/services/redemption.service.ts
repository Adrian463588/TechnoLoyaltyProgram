/**
 * Backend/src/services/redemption.service.ts
 *
 * Redemption domain service — FSM-based status transitions,
 * token deductions, and audit logging.
 *
 * SOLID — SRP: manages redemption lifecycle only.
 */

import { prisma } from "@/db/prisma";
import { Prisma, RedemptionStatus, TokenEventType, type RedemptionRequest } from "@prisma/client";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { checkRedemptionEligibility } from "./loyalty.service";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError } from "@/errors/index";
import { CacheService } from "./cache.service";
import { cacheInvalidationService } from "../utils/cache/cache-invalidation.service";
import { CacheKeys } from "../utils/cache/cache-key.registry";

/**
 * Valid transitions for redemption request status.
 * Section 13 - Redemption Status Workflow.
 */
const VALID_TRANSITIONS: Record<RedemptionStatus, RedemptionStatus[]> = {
  REQUESTED: ["REVIEWED", "REJECTED", "CANCELLED"],
  REVIEWED:  ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED:  [],
  REJECTED:  [],
  CANCELLED: [],
};

export class RedemptionService {
  /**
   * HC Admin: List all redemption requests with filtering and pagination.
   */
  async listAll(params: { status?: RedemptionStatus; limit?: number; offset?: number } = {}) {
    const { status, limit = 100, offset = 0 } = params;
    const where = status ? { status } : {};

    const [requests, total] = await Promise.all([
      prisma.redemptionRequest.findMany({
        where,
        include: {
          mitra: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              npk: true,
              division: true,
              documents: true
            } 
          },
          rewardItem: { select: { id: true, name: true, tokenCost: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.redemptionRequest.count({ where })
    ]);

    return { requests, total };
  }

  /**
   * HC Admin: Get detail of a specific request.
   */
  async getById(id: string) {
    return prisma.redemptionRequest.findUnique({
      where: { id },
      include: {
        mitra: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            npk: true,
            documents: true
          } 
        },
        rewardItem: { select: { id: true, name: true, tokenCost: true, description: true, imageUrl: true } },
        history: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  /**
   * Mitra: List own redemption requests.
   */
  async listByMitra(userId: string): Promise<any[]> {
    return prisma.redemptionRequest.findMany({
      where: { mitraId: userId },
      include: {
        rewardItem: { select: { id: true, name: true, tokenCost: true } },
        mitra: { select: { documents: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  /**
   * Gets UX-only eligibility preview.
   * Requirement 12.1, 12.3: UX-only cache. Server revalidates on submit.
   */
  async getEligibilityPreview(userId: string): Promise<{ isEligible: boolean; reasons: string[] }> {
    const cacheKey = CacheKeys.redemptionEligibility(userId);
    return CacheService.getWithFallback<{ isEligible: boolean; reasons: string[] }>(
      cacheKey,
      async () => {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError("User", userId);

        const tokenBalance = await tokenLedgerRepository.getBalance(userId);

        // Simplified general guard: must be ACTIVE partner and have enough for the cheapest reward or an arbitrary threshold (e.g. 2000).
        // The exact check depends on the catalog, but generally we check if partnerStatus is ACTIVE.
        const reasons: string[] = [];
        if (user.partnerStatus !== "ACTIVE") {
          reasons.push("Only active partners are eligible for redemption.");
        }
        
        // As a simple generic check, assume a base threshold of 2000 tokens for the dashboard preview
        if (tokenBalance < 2000) {
          reasons.push(`Earn ${(2000 - tokenBalance).toLocaleString()} more tokens to unlock rewards.`);
        }

        return { isEligible: reasons.length === 0, reasons };
      },
      120 // 2 minutes TTL
    );
  }

  /**
   * Submits a new redemption request.

   * Section 13 - Redemption Guard.
   */
  async submitRequest(userId: string, rewardItemId: string, options?: { isRepresented?: boolean, powerOfAttorneyUrl?: string }): Promise<RedemptionRequest> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User", userId);

    const item = await prisma.rewardItem.findUnique({ where: { id: rewardItemId } });
    if (!item) throw new NotFoundError("RewardItem", rewardItemId);

    const tokenBalance = await tokenLedgerRepository.getBalance(userId);

    const eligibility = checkRedemptionEligibility({
      tokenBalance,
      rewardTokenCost: item.tokenCost,
      partnerStatus: user.partnerStatus,
      isItemActive: item.isActive,
      stock: item.stock,
    });

    if (!eligibility.isEligible) {
      throw new ValidationError(eligibility.reasons.join(", "));
    }

    if (options?.isRepresented && !options?.powerOfAttorneyUrl) {
      throw new ValidationError("Power of Attorney document is required when using a representative.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create request
      const request = await tx.redemptionRequest.create({
        data: {
          mitraId: userId,
          rewardItemId,
          tokenCost: item.tokenCost,
          status: "REQUESTED",
          isRepresented: options?.isRepresented ?? false,
          powerOfAttorneyUrl: options?.powerOfAttorneyUrl ?? null,
          powerOfAttorneyRequired: options?.isRepresented ?? false,
        },
      });

      // 2. Deduct tokens using FIFO across cohorts
      await tokenLedgerRepository.deductTokensFIFO({
        userId,
        eventType: TokenEventType.REDEEMED,
        amount: item.tokenCost,
        referenceId: request.id,
        performedBy: userId,
        reason: `Redemption: ${item.name}`,
      }, tx);

      // 3. Append status history
      await tx.redemptionStatusHistory.create({
        data: {
          redemptionRequestId: request.id,
          previousStatus: "REQUESTED",
          newStatus: "REQUESTED",
          changedBy: userId,
          note: options?.isRepresented ? "Initial submission (Representative pickup)" : "Initial submission",
        },
      });

      // 4. Audit — PRD §5.6 REDEMPTION_SUBMITTED required
      await logAudit({
        action: "REDEMPTION_SUBMITTED",
        actorId: userId,
        targetType: "RedemptionRequest",
        targetId: request.id,
        newValue: { rewardItemId, tokenCost: item.tokenCost, status: "REQUESTED" },
        tx,
      });

      return request;
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REDEMPTION_MUTATED", userId });
    await cacheInvalidationService.invalidateAfterCommit({ type: "TOKEN_MUTATED", userId });
    return result;
  }

  /**
   * HC Admin: Verify documents for a redemption request.
   */
  async verifyDocuments(requestId: string, input: {
    idCardVerified: boolean; 
    ktpVerified: boolean; 
    npwpVerified: boolean;
    powerOfAttorneyVerified?: boolean | undefined; 
  }, actorId: string): Promise<RedemptionRequest> {
    const request = await prisma.redemptionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundError("RedemptionRequest", requestId);

    const updateData: Prisma.RedemptionRequestUpdateInput = {
      idCardVerified: input.idCardVerified,
      ktpVerified: input.ktpVerified,
      npwpVerified: input.npwpVerified,
      updatedAt: new Date(),
    };
    if (input.powerOfAttorneyVerified !== undefined) {
      updateData.powerOfAttorneyVerified = input.powerOfAttorneyVerified;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.redemptionRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      await logAudit({
        action: "REDEMPTION_DOCUMENTS_VERIFIED",
        actorId,
        targetType: "RedemptionRequest",
        targetId: requestId,
        previousValue: {
          idCardVerified: request.idCardVerified,
          ktpVerified: request.ktpVerified,
          npwpVerified: request.npwpVerified,
          powerOfAttorneyVerified: request.powerOfAttorneyVerified,
        },
        newValue: input,
        tx,
      });

      return updated;
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REDEMPTION_MUTATED", userId: request.mitraId });
    return result;
  }

  /**
   * HC Admin updates redemption status.
   */
  async transitionStatus(
    requestId: string,
    newStatus: RedemptionStatus,
    actorId: string,
    note?: string,
  ): Promise<RedemptionRequest> {
    const request = await prisma.redemptionRequest.findUnique({
      where: { id: requestId },
      include: { rewardItem: true }
    });

    if (!request) throw new NotFoundError("RedemptionRequest", requestId);

    const currentStatus = request.status;
    const allowed = VALID_TRANSITIONS[currentStatus];

    if (!allowed.includes(newStatus)) {
      throw new ValidationError(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Refund tokens if REJECTED or CANCELLED from a state that already deducted them
      if (["REJECTED", "CANCELLED"].includes(newStatus)) {
        // Find original deductions for this request to restore cohorts accurately
        const deductions = await tx.tokenLedger.findMany({
          where: { 
            referenceId: requestId,
            amount: { lt: 0 },
            eventType: TokenEventType.REDEEMED
          }
        });

        for (const d of deductions) {
          await tokenLedgerRepository.appendTokenEvent({
            userId: request.mitraId,
            eventType: TokenEventType.MANUAL_ADJUSTMENT,
            amount: Math.abs(d.amount),
            referenceId: requestId,
            earnedYear: d.earnedYear ?? undefined,
            expiresAt: d.expiresAt ?? undefined,
            performedBy: actorId,
            reason: `Refund: Redemption ${newStatus.toLowerCase()} (${request.rewardItem.name}) - Restoring cohort ${d.earnedYear || 'Unknown'}`,
          }, tx);
        }
      }

      // ── New Simplification Logic ──
      // If moving from REQUESTED to REVIEWED, we assume the HC admin has verified the documents
      // as part of the "Konfirmasi" action in the Document Review phase.
      const updateData: Prisma.RedemptionRequestUpdateInput = { 
        status: newStatus 
      };

      if (newStatus === "REJECTED") {
        updateData.rejectionReason = note && note.trim() !== "" ? note : "Dokumen tidak sesuai standar atau data tidak valid.";
      }
      
      if (currentStatus === "REQUESTED" && newStatus === "REVIEWED") {
        updateData.idCardVerified = true;
        updateData.ktpVerified = true;
        updateData.npwpVerified = true;
        if (request.powerOfAttorneyRequired) {
          updateData.powerOfAttorneyVerified = true;
        }
      }

      const updated = await tx.redemptionRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      await tx.redemptionStatusHistory.create({
        data: {
          redemptionRequestId: requestId,
          previousStatus: currentStatus,
          newStatus,
          changedBy: actorId,
          note: note ?? null,
        },
      });

      // ── Reward Stock Reduction ──
      // Requirement 13.2: Decrease stock ONLY when status becomes ACCEPTED.
      if (newStatus === "ACCEPTED") {
        // Fetch fresh item with lock inside transaction to prevent race conditions
        const item = await tx.rewardItem.findUnique({
          where: { id: request.rewardItemId },
        });

        if (!item) throw new NotFoundError("RewardItem", request.rewardItemId);

        if (item.stock !== null) {
          if (item.stock <= 0) {
            throw new ValidationError(`Reward item "${item.name}" is out of stock.`);
          }
          await tx.rewardItem.update({
            where: { id: item.id },
            data: { stock: { decrement: 1 } },
          });
        }
      }

      // Audit — PRD §5.6 REDEMPTION_STATUS_CHANGED required
      await logAudit({
        action: "REDEMPTION_STATUS_CHANGED",
        actorId,
        targetType: "RedemptionRequest",
        targetId: requestId,
        previousValue: { status: currentStatus },
        newValue: { status: newStatus, note: note ?? null },
        tx,
      });

      return updated;
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REDEMPTION_MUTATED", userId: request.mitraId });
    
    if (newStatus === "ACCEPTED") {
      await cacheInvalidationService.invalidateAfterCommit({ type: "REWARD_STOCK_MUTATED" });
    }

    if (["REJECTED", "CANCELLED"].includes(newStatus)) {
      await cacheInvalidationService.invalidateAfterCommit({ type: "TOKEN_MUTATED", userId: request.mitraId });
    }

    return result;
  }
}

export const redemptionService = new RedemptionService();
