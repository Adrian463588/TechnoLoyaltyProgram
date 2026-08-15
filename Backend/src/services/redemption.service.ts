/**
 * Redemption lifecycle service.
 *
 * The request is created without a debit. HC approval (`PURCHASED`) is the
 * only redemption transition that debits the append-only token ledger, and
 * the stock update, debit, status update, history, and audit event share one
 * database transaction.
 */

import { prisma } from "@/db/prisma";
import { Prisma, DivisionType, RedemptionStatus, TokenEventType, type RedemptionRequest } from "@prisma/client";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { checkRedemptionEligibility } from "./loyalty.service";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError } from "@/errors/index";
import { CacheService } from "./cache.service";
import { cacheInvalidationService } from "../utils/cache/cache-invalidation.service";
import { CacheKeys } from "../utils/cache/cache-key.registry";

const listInclude = {
  mitra: {
    select: {
      id: true,
      name: true,
      email: true,
      npk: true,
      division: true,
      partnerStatus: true,
      documents: true,
    },
  },
  rewardItem: { select: { id: true, name: true, tokenCost: true } },
} as const;

const detailInclude = {
  mitra: {
    select: {
      id: true,
      name: true,
      email: true,
      npk: true,
      division: true,
      partnerStatus: true,
      documents: true,
    },
  },
  rewardItem: {
    select: { id: true, name: true, tokenCost: true, description: true, imageUrl: true, stock: true },
  },
  history: { orderBy: { createdAt: "asc" as const } },
  partnerConfirmations: { orderBy: { createdAt: "desc" as const } },
} as const;

type RedemptionListItem = Prisma.RedemptionRequestGetPayload<{ include: typeof listInclude }>;
type RedemptionDetail = Prisma.RedemptionRequestGetPayload<{ include: typeof detailInclude }>;

const VALID_TRANSITIONS: Record<RedemptionStatus, RedemptionStatus[]> = {
  DRAFT: [RedemptionStatus.PENDING_VERIFICATION, RedemptionStatus.CANCELLED],
  PENDING_VERIFICATION: [RedemptionStatus.VERIFIED, RedemptionStatus.REJECTED, RedemptionStatus.CANCELLED],
  VERIFIED: [RedemptionStatus.PURCHASED, RedemptionStatus.REJECTED, RedemptionStatus.CANCELLED],
  REJECTED: [],
  PURCHASED: [RedemptionStatus.PICKUP_SCHEDULED],
  PICKUP_SCHEDULED: [RedemptionStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

function documentsComplete(request: Pick<RedemptionRequest, "idCardVerified" | "ktpVerified" | "npwpVerified" | "powerOfAttorneyRequired"> & { powerOfAttorneyVerified: boolean | null | undefined }): boolean {
  return request.idCardVerified &&
    request.ktpVerified &&
    request.npwpVerified &&
    (!request.powerOfAttorneyRequired || request.powerOfAttorneyVerified === true);
}

export class RedemptionService {
  async listByDivision(
    division: string,
    params: { status?: RedemptionStatus; limit?: number; offset?: number } = {},
  ): Promise<{ requests: RedemptionListItem[]; total: number }> {
    const { status, limit = 100, offset = 0 } = params;
    const where: Prisma.RedemptionRequestWhereInput = {
      mitra: { division: division as DivisionType },
      ...(status ? { status } : {}),
    };
    const [requests, total] = await Promise.all([
      prisma.redemptionRequest.findMany({ where, include: listInclude, orderBy: { submittedAt: "desc" }, take: limit, skip: offset }),
      prisma.redemptionRequest.count({ where }),
    ]);
    return { requests, total };
  }

  async listAll(
    params: { status?: RedemptionStatus; limit?: number; offset?: number } = {},
  ): Promise<{ requests: RedemptionListItem[]; total: number }> {
    const { status, limit = 100, offset = 0 } = params;
    const where: Prisma.RedemptionRequestWhereInput = status ? { status } : {};
    const [requests, total] = await Promise.all([
      prisma.redemptionRequest.findMany({ where, include: listInclude, orderBy: { submittedAt: "desc" }, take: limit, skip: offset }),
      prisma.redemptionRequest.count({ where }),
    ]);
    return { requests, total };
  }

  async getById(id: string): Promise<RedemptionDetail | null> {
    return prisma.redemptionRequest.findUnique({ where: { id }, include: detailInclude });
  }

  async listByMitra(userId: string): Promise<Array<RedemptionListItem>> {
    return prisma.redemptionRequest.findMany({
      where: { mitraId: userId },
      include: listInclude,
      orderBy: { submittedAt: "desc" },
    });
  }

  async getEligibilityPreview(userId: string): Promise<{ isEligible: boolean; reasons: string[] }> {
    const cacheKey = CacheKeys.redemptionEligibility(userId);
    return CacheService.getWithFallback(cacheKey, async () => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User", userId);

      const [tokenBalance, cheapestReward] = await Promise.all([
        tokenLedgerRepository.getBalance(userId),
        prisma.rewardItem.findFirst({ where: { isActive: true }, orderBy: { tokenCost: "asc" } }),
      ]);
      const reasons: string[] = [];
      if (user.partnerStatus !== "ACTIVE") reasons.push("Only active partners are eligible for redemption.");
      if (!cheapestReward) reasons.push("No active rewards are currently available.");
      if (cheapestReward && tokenBalance < cheapestReward.tokenCost) {
        reasons.push(`Earn ${(cheapestReward.tokenCost - tokenBalance).toLocaleString()} more tokens to unlock the least expensive reward.`);
      }
      return { isEligible: reasons.length === 0, reasons };
    }, 120);
  }

  async submitRequest(
    userId: string,
    rewardItemId: string,
    options?: { isRepresented?: boolean; powerOfAttorneyUrl?: string },
    idempotencyKey?: string,
  ): Promise<RedemptionRequest> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User", userId);
    const item = await prisma.rewardItem.findUnique({ where: { id: rewardItemId } });
    if (!item) throw new NotFoundError("RewardItem", rewardItemId);

    if (idempotencyKey) {
      const existing = await prisma.redemptionRequest.findUnique({ where: { idempotencyKey } });
      if (existing) {
        if (existing.mitraId !== userId) throw new ValidationError("Idempotency key belongs to another user.");
        return existing;
      }
    }

    const tokenBalance = await tokenLedgerRepository.getBalance(userId);
    const eligibility = checkRedemptionEligibility({
      tokenBalance,
      rewardTokenCost: item.tokenCost,
      partnerStatus: user.partnerStatus,
      isItemActive: item.isActive,
      stock: item.stock,
    });
    if (!eligibility.isEligible) throw new ValidationError(eligibility.reasons.join(" "));
    if (options?.isRepresented && !options.powerOfAttorneyUrl) {
      throw new ValidationError("Power of Attorney document is required when using a representative.");
    }

    const result = await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        const existing = await tx.redemptionRequest.findUnique({ where: { idempotencyKey } });
        if (existing) return existing;
      }

      const request = await tx.redemptionRequest.create({
        data: {
          mitraId: userId,
          rewardItemId,
          tokenCost: item.tokenCost,
          status: RedemptionStatus.PENDING_VERIFICATION,
          isRepresented: options?.isRepresented ?? false,
          powerOfAttorneyUrl: options?.powerOfAttorneyUrl ?? null,
          powerOfAttorneyRequired: options?.isRepresented ?? false,
          idempotencyKey: idempotencyKey ?? null,
        },
      });

      await tx.redemptionStatusHistory.create({
        data: {
          redemptionRequestId: request.id,
          previousStatus: RedemptionStatus.PENDING_VERIFICATION,
          newStatus: RedemptionStatus.PENDING_VERIFICATION,
          changedBy: userId,
          note: options?.isRepresented ? "Initial submission (representative pickup)" : "Initial submission",
        },
      });
      await logAudit({
        action: "REDEMPTION_SUBMITTED",
        actorId: userId,
        targetType: "RedemptionRequest",
        targetId: request.id,
        newValue: { rewardItemId, tokenCost: item.tokenCost, status: request.status },
        tx,
      });
      return request;
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REDEMPTION_MUTATED", userId });
    return result;
  }

  async verifyDocuments(
    requestId: string,
    input: { idCardVerified: boolean; ktpVerified: boolean; npwpVerified: boolean; powerOfAttorneyVerified?: boolean | undefined },
    actorId: string,
  ): Promise<RedemptionRequest> {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "RedemptionRequest" WHERE id = ${requestId} FOR UPDATE`;
      const request = await tx.redemptionRequest.findUnique({ where: { id: requestId } });
      if (!request) throw new NotFoundError("RedemptionRequest", requestId);
      const verifiableStatuses: RedemptionStatus[] = [RedemptionStatus.PENDING_VERIFICATION, RedemptionStatus.VERIFIED];
      if (!verifiableStatuses.includes(request.status)) {
        throw new ValidationError(`Documents cannot be updated from ${request.status}.`);
      }

      const complete = documentsComplete({ ...request, ...input });
      const nextStatus = complete ? RedemptionStatus.VERIFIED : request.status;
      const updated = await tx.redemptionRequest.update({
        where: { id: requestId },
        data: {
          idCardVerified: input.idCardVerified,
          ktpVerified: input.ktpVerified,
          npwpVerified: input.npwpVerified,
          ...(input.powerOfAttorneyVerified !== undefined ? { powerOfAttorneyVerified: input.powerOfAttorneyVerified } : {}),
          ...(complete ? { status: nextStatus, verifiedBy: actorId, verifiedAt: new Date() } : {}),
        },
      });

      await logAudit({
        action: "REDEMPTION_DOCUMENTS_VERIFIED",
        actorId,
        targetType: "RedemptionRequest",
        targetId: requestId,
        previousValue: { idCardVerified: request.idCardVerified, ktpVerified: request.ktpVerified, npwpVerified: request.npwpVerified, status: request.status },
        newValue: { ...input, status: nextStatus },
        tx,
      });
      if (request.status !== nextStatus) {
        await tx.redemptionStatusHistory.create({
          data: { redemptionRequestId: requestId, previousStatus: request.status, newStatus: nextStatus, changedBy: actorId, note: "All required documents verified" },
        });
        await logAudit({
          action: "REDEMPTION_STATUS_CHANGED",
          actorId,
          targetType: "RedemptionRequest",
          targetId: requestId,
          previousValue: { status: request.status },
          newValue: { status: nextStatus },
          tx,
        });
      }
      return updated;
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REDEMPTION_MUTATED", userId: result.mitraId });
    return result;
  }

  async transitionStatus(
    requestId: string,
    newStatus: RedemptionStatus,
    actorId: string,
    note?: string,
  ): Promise<RedemptionRequest> {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "RedemptionRequest" WHERE id = ${requestId} FOR UPDATE`;
      const request = await tx.redemptionRequest.findUnique({
        where: { id: requestId },
        include: { rewardItem: true, mitra: { select: { partnerStatus: true } } },
      });
      if (!request) throw new NotFoundError("RedemptionRequest", requestId);

      const allowed = VALID_TRANSITIONS[request.status];
      if (!allowed.includes(newStatus)) throw new ValidationError(`Invalid transition from ${request.status} to ${newStatus}`);
      if (newStatus === RedemptionStatus.REJECTED && !note?.trim()) {
        throw new ValidationError("A rejection reason is required.");
      }
      if (newStatus === RedemptionStatus.VERIFIED && !documentsComplete(request)) {
        throw new ValidationError("All required documents must be verified before approval.");
      }

      let debitCreated = false;
      if (newStatus === RedemptionStatus.PURCHASED) {
        if (!documentsComplete(request)) throw new ValidationError("All required documents must be verified before purchase.");
        if (request.mitra.partnerStatus !== "ACTIVE") throw new ValidationError("Mitra is not active.");

        const confirmation = await tx.partnerStatusConfirmation.findFirst({
          where: { redemptionRequestId: requestId, status: "CONFIRMED_ACTIVE" },
          orderBy: { confirmedAt: "desc" },
        });
        if (!confirmation) throw new ValidationError("Active Team Leader confirmation is required before purchase.");

        await tx.$queryRaw`SELECT id FROM "RewardItem" WHERE id = ${request.rewardItemId} FOR UPDATE`;
        const reward = await tx.rewardItem.findUnique({ where: { id: request.rewardItemId } });
        if (!reward) throw new NotFoundError("RewardItem", request.rewardItemId);
        if (reward.stock !== null) {
          const stockUpdate = await tx.rewardItem.updateMany({
            where: { id: reward.id, stock: { gt: 0 } },
            data: { stock: { decrement: 1 } },
          });
          if (stockUpdate.count !== 1) throw new ValidationError(`Reward item "${reward.name}" is out of stock.`);
        }

        const existingDebit = await tx.tokenLedger.findFirst({
          where: { userId: request.mitraId, referenceId: requestId, eventType: TokenEventType.REDEEMED, amount: { lt: 0 } },
        });
        if (!existingDebit) {
          await tokenLedgerRepository.deductTokensFIFO({
            userId: request.mitraId,
            eventType: TokenEventType.REDEEMED,
            amount: request.tokenCost,
            referenceId: requestId,
            performedBy: actorId,
            reason: `Redemption approval: ${reward.name}`,
            idempotencyKey: `redemption:${requestId}:debit`,
          }, tx);
          debitCreated = true;
          await logAudit({
            action: "TOKEN_DEBITED",
            actorId,
            targetType: "TokenLedger",
            targetId: requestId,
            newValue: { amount: request.tokenCost, referenceId: requestId, reason: "redemption approval" },
            tx,
          });
        }
      }

      const updateData: Prisma.RedemptionRequestUpdateInput = { status: newStatus };
      if (newStatus === RedemptionStatus.REJECTED) updateData.rejectionReason = note?.trim() ?? null;
      if (newStatus === RedemptionStatus.PURCHASED) {
        updateData.verifiedBy = actorId;
        updateData.verifiedAt = new Date();
      }
      if (newStatus === RedemptionStatus.PICKUP_SCHEDULED) updateData.pickupScheduledAt = new Date();
      if (newStatus === RedemptionStatus.COMPLETED) updateData.completedAt = new Date();

      const updated = await tx.redemptionRequest.update({
        where: { id: requestId },
        data: updateData,
      });
      await tx.redemptionStatusHistory.create({
        data: { redemptionRequestId: requestId, previousStatus: request.status, newStatus, changedBy: actorId, note: note ?? null },
      });
      await logAudit({
        action: newStatus === RedemptionStatus.PURCHASED ? "REDEMPTION_APPROVED" : "REDEMPTION_STATUS_CHANGED",
        actorId,
        targetType: "RedemptionRequest",
        targetId: requestId,
        previousValue: { status: request.status },
        newValue: { status: newStatus, note: note ?? null, debitCreated },
        tx,
      });
      return updated;
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REDEMPTION_MUTATED", userId: result.mitraId });
    if (newStatus === RedemptionStatus.PURCHASED) {
      await cacheInvalidationService.invalidateAfterCommit({ type: "TOKEN_MUTATED", userId: result.mitraId });
      await cacheInvalidationService.invalidateAfterCommit({ type: "REWARD_STOCK_MUTATED" });
    }
    return result;
  }
}

export const redemptionService = new RedemptionService();
