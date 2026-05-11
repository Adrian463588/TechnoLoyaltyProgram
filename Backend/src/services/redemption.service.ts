import { prisma } from "@/db/prisma";
import { AuditService } from "./audit.service";
import { RedemptionStatusEnum } from "@/lib/validations";
import { z } from "zod";

type RedemptionStatus = z.infer<typeof RedemptionStatusEnum>;

export class RedemptionService {
  /**
   * Finite State Machine transitions allowed.
   */
  static VALID_TRANSITIONS: Record<RedemptionStatus, RedemptionStatus[]> = {
    DRAFT: ["PENDING_VERIFICATION", "CANCELLED"],
    PENDING_VERIFICATION: ["VERIFIED", "REJECTED", "CANCELLED"],
    VERIFIED: ["PURCHASED", "CANCELLED"],
    REJECTED: [], // Terminal
    PURCHASED: ["PICKUP_SCHEDULED", "COMPLETED", "CANCELLED"],
    PICKUP_SCHEDULED: ["COMPLETED", "CANCELLED"],
    COMPLETED: [], // Terminal
    CANCELLED: [], // Terminal
  };

  /**
   * Validates eligibility and creates a new redemption request.
   */
  static async createRequest(userId: string, rewardItemId: string) {
    // rewardItem uses isAvailable (not isActive)
    const item = await prisma.rewardItem.findUnique({ where: { id: rewardItemId } });
    if (!item || !item.isAvailable) throw new Error("Reward item is not available or does not exist.");

    // Use UserLoyaltyProfile.remainingTokens for balance check
    const profile = await prisma.userLoyaltyProfile.findUnique({ where: { userId } });
    const currentBalance = profile?.remainingTokens ?? 0;

    if (currentBalance < item.tokenCost) {
      throw new Error(`Insufficient tokens. Requires ${item.tokenCost}, but you have ${currentBalance}.`);
    }

    // Create the redemption request (uses rewardRedemptionRequest, tokensSpent)
    const request = await prisma.rewardRedemptionRequest.create({
      data: {
        userId,
        rewardItemId,
        tokensSpent: item.tokenCost,
        status: "PENDING_VERIFICATION",
      },
    });

    await AuditService.log({
      action: "REDEMPTION_CREATED",
      actorId: userId,
      targetType: "RewardRedemptionRequest",
      targetId: request.id,
      details: { rewardItemId, tokenCost: item.tokenCost },
    });

    return request;
  }

  /**
   * Updates the status of a redemption request.
   * Handles transactional token deductions if verified, or refunds if cancelled.
   */
  static async updateStatus(
    requestId: string,
    newStatus: RedemptionStatus,
    actorId: string,
    reason?: string
  ) {
    const request = await prisma.rewardRedemptionRequest.findUnique({
      where: { id: requestId },
      include: { item: true },
    });

    if (!request) throw new Error("Request not found");

    const currentStatus = request.status as RedemptionStatus;
    const allowedNextStatuses = this.VALID_TRANSITIONS[currentStatus];

    if (!allowedNextStatuses.includes(newStatus)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // If verifying, deduct tokens from UserLoyaltyProfile.remainingTokens
      if (newStatus === "VERIFIED") {
        await tx.tokenLedgerEntry.create({
          data: {
            userId: request.userId,
            amount: -request.tokensSpent, // Negative for deduction
            sourceType: "REDEMPTION",
            sourceId: requestId,
            periodId: "", // no period for redemptions — use a sentinel or require periodId
          },
        });
        await tx.userLoyaltyProfile.update({
          where: { userId: request.userId },
          data: { remainingTokens: { decrement: request.tokensSpent } },
        });
      }

      // If cancelling from a state that already deducted tokens, refund.
      if (newStatus === "CANCELLED" && ["VERIFIED", "PURCHASED", "PICKUP_SCHEDULED"].includes(currentStatus)) {
        await tx.tokenLedgerEntry.create({
          data: {
            userId: request.userId,
            amount: request.tokensSpent,
            sourceType: "REDEMPTION",
            sourceId: requestId,
            periodId: "",
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

      // Record the history entry using schema model (toStatus, not status)
      await tx.rewardRedemptionStatusHistory.create({
        data: {
          requestId,
          toStatus: newStatus,
          actorId,
          reason,
        },
      });

      // Audit Log
      const auditAction =
        newStatus === "VERIFIED" ? "REDEMPTION_VERIFIED"
        : newStatus === "REJECTED" ? "REDEMPTION_REJECTED"
        : "UPLOAD_STAGED"; // Fallback — should add REDEMPTION_STATUS_UPDATED to AuditAction if needed

      await AuditService.log({
        action: auditAction as "REDEMPTION_VERIFIED" | "REDEMPTION_REJECTED" | "UPLOAD_STAGED",
        actorId,
        targetType: "RewardRedemptionRequest",
        targetId: requestId,
        details: { previousStatus: currentStatus, newStatus, reason },
        tx,
      });

      return updatedRequest;
    });

    return result;
  }
}
