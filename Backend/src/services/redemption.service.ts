/**
 * Backend/src/services/redemption.service.ts
 *
 * Redemption domain service — FSM-based status transitions,
 * token deductions, and audit logging.
 *
 * SOLID — SRP: manages redemption lifecycle only.
 */

import type { RewardRedemptionRequest, RedemptionStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError } from "@/errors/index";
import { PeriodRepository } from "@/repositories/period.repository";

const periodRepo = new PeriodRepository(prisma);

/** Valid FSM transitions for redemption status */
const VALID_TRANSITIONS: Record<RedemptionStatus, RedemptionStatus[]> = {
  DRAFT: ["PENDING_VERIFICATION", "CANCELLED"],
  PENDING_VERIFICATION: ["VERIFIED", "REJECTED", "CANCELLED"],
  VERIFIED: ["PURCHASED", "CANCELLED"],
  REJECTED: [],
  PURCHASED: ["PICKUP_SCHEDULED", "COMPLETED", "CANCELLED"],
  PICKUP_SCHEDULED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const RedemptionService = {

  /** HC_PM: list all redemption requests */
  async listAll(): Promise<RewardRedemptionRequest[]> {
    return prisma.rewardRedemptionRequest.findMany({
      include: {
        user: { select: { id: true, name: true, npk: true } },
        item: { select: { id: true, name: true, tokenCost: true } },
        history: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Get a single redemption request by ID */
  async getById(requestId: string): Promise<RewardRedemptionRequest | null> {
    return prisma.rewardRedemptionRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, npk: true } },
        item: { select: { id: true, name: true, tokenCost: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  /** Employee: list own redemption history */
  async listByUser(userId: string): Promise<RewardRedemptionRequest[]> {
    return prisma.rewardRedemptionRequest.findMany({
      where: { userId },
      include: {
        item: { select: { id: true, name: true, tokenCost: true } },
        history: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Creates a new redemption request.
   * Validates token balance and item availability before creating.
   * @throws ValidationError if insufficient tokens or item not redeemable.
   */
  async createRequest(
    userId: string,
    rewardItemId: string,
    ipAddress?: string,
  ): Promise<RewardRedemptionRequest> {
    const item = await prisma.rewardItem.findUnique({
      where: { id: rewardItemId },
    });

    if (!item) {
      throw new NotFoundError("Reward item", rewardItemId);
    }

    if (!item.isAvailable) {
      throw new ValidationError("This reward item is not currently available");
    }

    const profile = await prisma.userLoyaltyProfile.findUnique({ where: { userId } });
    const currentBalance = profile?.remainingTokens ?? 0;

    if (currentBalance < item.tokenCost) {
      throw new ValidationError(
        `Insufficient tokens. Requires ${String(item.tokenCost)}, but you have ${String(currentBalance)}.`,
        { required: item.tokenCost, available: currentBalance },
      );
    }

    const request = await prisma.rewardRedemptionRequest.create({
      data: {
        userId,
        rewardItemId,
        tokensSpent: item.tokenCost,
        status: "PENDING_VERIFICATION",
      },
    });

    await logAudit({
      action: "REDEMPTION_CREATED",
      actorId: userId,
      targetType: "RewardRedemptionRequest",
      targetId: request.id,
      details: { rewardItemId, tokensSpent: item.tokenCost },
      ipAddress,
    });

    return request;
  },

  /**
   * Updates the status of a redemption request (FSM transition).
   * Handles transactional token deductions (VERIFIED) or refunds (CANCELLED).
   * @throws NotFoundError if request does not exist.
   * @throws ValidationError if status transition is invalid or no active period.
   */
  async updateStatus(
    requestId: string,
    newStatus: RedemptionStatus,
    actorId: string,
    reason?: string,
    ipAddress?: string,
  ): Promise<RewardRedemptionRequest> {
    const request = await prisma.rewardRedemptionRequest.findUnique({
      where: { id: requestId },
      include: { item: true },
    });

    if (!request) {
      throw new NotFoundError("Redemption request", requestId);
    }

    const currentStatus = request.status;
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus];

    if (!allowedNextStatuses.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        { currentStatus, newStatus, allowedStatuses: allowedNextStatuses },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // VERIFIED: deduct tokens — requires active period for ledger entry
      if (newStatus === "VERIFIED") {
        const activePeriod = await periodRepo.findActive();
        if (!activePeriod) {
          throw new ValidationError(
            "No active earning period found. Cannot process token deduction.",
          );
        }

        await tx.tokenLedgerEntry.create({
          data: {
            userId: request.userId,
            amount: -request.tokensSpent,
            sourceType: "REDEMPTION",
            sourceId: requestId,
            periodId: activePeriod.id,
          },
        });

        await tx.userLoyaltyProfile.update({
          where: { userId: request.userId },
          data: { remainingTokens: { decrement: request.tokensSpent } },
        });
      }

      // CANCELLED from a post-deduction state: refund tokens
      if (
        newStatus === "CANCELLED" &&
        (["VERIFIED", "PURCHASED", "PICKUP_SCHEDULED"] as RedemptionStatus[]).includes(
          currentStatus,
        )
      ) {
        const activePeriod = await periodRepo.findActive();
        if (!activePeriod) {
          throw new ValidationError(
            "No active earning period found. Cannot process token refund.",
          );
        }

        await tx.tokenLedgerEntry.create({
          data: {
            userId: request.userId,
            amount: request.tokensSpent, // Positive = refund
            sourceType: "REDEMPTION",
            sourceId: requestId,
            periodId: activePeriod.id,
          },
        });

        await tx.userLoyaltyProfile.update({
          where: { userId: request.userId },
          data: { remainingTokens: { increment: request.tokensSpent } },
        });
      }

      const updatedRequest = await tx.rewardRedemptionRequest.update({
        where: { id: requestId },
        data: { status: newStatus },
      });

      await tx.rewardRedemptionStatusHistory.create({
        data: { requestId, toStatus: newStatus, actorId, reason: reason ?? null },
      });

      const auditAction: import("@/services/audit.service").AuditAction =
        newStatus === "VERIFIED"
          ? "REDEMPTION_VERIFIED"
          : newStatus === "REJECTED"
            ? "REDEMPTION_REJECTED"
            : "REDEMPTION_STATUS_UPDATED";

      await logAudit({
        action: auditAction,
        actorId,
        targetType: "RewardRedemptionRequest",
        targetId: requestId,
        details: { previousStatus: currentStatus, newStatus, reason },
        ipAddress,
        tx,
      });

      return updatedRequest;
    });

    return result;
  },
};
