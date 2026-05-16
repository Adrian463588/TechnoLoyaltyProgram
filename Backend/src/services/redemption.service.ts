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
import { tokenLedgerService } from "./token-ledger.service";
import { checkRedemptionEligibility } from "./loyalty.service";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError } from "@/errors/index";
import { CacheService } from "./cache.service";
import { CacheKeys } from "../utils/cache/cache-key.registry";

/**
 * Valid transitions for redemption request status.
 * Section 13 - Redemption Status Workflow.
 */
const VALID_TRANSITIONS: Record<RedemptionStatus, RedemptionStatus[]> = {
  DRAFT:                ["PENDING_VERIFICATION", "CANCELLED"],
  PENDING_VERIFICATION: ["VERIFIED", "REJECTED", "CANCELLED"],
  VERIFIED:             ["PURCHASED", "CANCELLED"],
  REJECTED:             [],
  PURCHASED:            ["PICKUP_SCHEDULED"],
  PICKUP_SCHEDULED:     ["COMPLETED"],
  COMPLETED:            [],
  CANCELLED:            [],
};

export class RedemptionService {
  /**
   * HC Admin: List all redemption requests with filtering.
   */
  async listAll(status?: RedemptionStatus): Promise<RedemptionRequest[]> {
    return prisma.redemptionRequest.findMany({
      where: status ? { status } : {},
      include: {
        mitra: { select: { id: true, name: true, email: true } },
        rewardItem: { select: { id: true, name: true, tokenCost: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  /**
   * HC Admin: Get detail of a specific request.
   */
  async getById(id: string): Promise<RedemptionRequest | null> {
    return prisma.redemptionRequest.findUnique({
      where: { id },
      include: {
        mitra: { select: { id: true, name: true, email: true } },
        rewardItem: { select: { id: true, name: true, tokenCost: true, description: true, imageUrl: true } },
        history: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  /**
   * Mitra: List own redemption requests.
   */
  async listByMitra(userId: string): Promise<RedemptionRequest[]> {
    return prisma.redemptionRequest.findMany({
      where: { mitraId: userId },
      include: {
        rewardItem: { select: { id: true, name: true, tokenCost: true } },
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
    const cached = await CacheService.get<{ isEligible: boolean; reasons: string[] }>(cacheKey);
    if (cached) return cached;

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

    const result = { isEligible: reasons.length === 0, reasons };
    await CacheService.set(cacheKey, result, 120);
    return result;
  }

  /**
   * Submits a new redemption request.

   * Section 13 - Redemption Guard.
   */
  async submitRequest(userId: string, rewardItemId: string): Promise<RedemptionRequest> {
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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create request
      const request = await tx.redemptionRequest.create({
        data: {
          mitraId: userId,
          rewardItemId,
          tokenCost: item.tokenCost,
          status: "PENDING_VERIFICATION",
        },
      });

      // 2. Append status history
      await tx.redemptionStatusHistory.create({
        data: {
          redemptionRequestId: request.id,
          previousStatus: "DRAFT",
          newStatus: "PENDING_VERIFICATION",
          changedBy: userId,
          note: "Initial submission",
        },
      });

      // 3. Audit — PRD §5.6 REDEMPTION_SUBMITTED required
      await logAudit({
        action: "REDEMPTION_SUBMITTED",
        actorId: userId,
        targetType: "RedemptionRequest",
        targetId: request.id,
        newValue: { rewardItemId, tokenCost: item.tokenCost, status: "PENDING_VERIFICATION" },
        tx,
      });

      return request;
    });

    await CacheService.invalidate({ type: "REDEMPTION_MUTATED", userId });
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

    await CacheService.invalidate({ type: "REDEMPTION_MUTATED", userId: request.mitraId });
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

    // Guard: COMPLETED requires all docs verified
    if (newStatus === "COMPLETED") {
      const docsOk = request.idCardVerified && request.ktpVerified && request.npwpVerified;
      const poaOk = request.powerOfAttorneyRequired ? request.powerOfAttorneyVerified : true;
      
      if (!docsOk || !poaOk) {
        throw new ValidationError("Cannot complete redemption: documents not fully verified.");
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // If moving to VERIFIED, debit tokens
      // Requirement 3.7, 3.8, 3.9: Must use authoritative DB state, never cached balance
      if (newStatus === "VERIFIED") {
        const currentBalance = await tokenLedgerService.getTokenBalanceForUpdate(request.mitraId, tx);
        if (currentBalance < request.tokenCost) {
          throw new ValidationError("Insufficient tokens at verification time");
        }

        await tokenLedgerRepository.appendTokenEvent({
          userId: request.mitraId,
          eventType: TokenEventType.REDEEMED,
          amount: -request.tokenCost,
          referenceId: request.id,
          performedBy: actorId,
          reason: `Redemption: ${request.rewardItem.name}`,
        }, tx);
      }

      const updated = await tx.redemptionRequest.update({
        where: { id: requestId },
        data: { status: newStatus },
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

    await CacheService.invalidate({ type: "REDEMPTION_MUTATED", userId: request.mitraId });
    if (newStatus === "VERIFIED") {
      await CacheService.invalidate({ type: "TOKEN_MUTATED", userId: request.mitraId });
    }

    return result;
  }
}

export const redemptionService = new RedemptionService();
