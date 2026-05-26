/**
 * Backend/src/services/membership-adjustment.service.ts
 *
 * Orchestration service for membership downgrade and reset.
 */

import { prisma } from "@/db/prisma";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { logAudit } from "@/services/audit.service";
import { calculateDowngrade, calculateReset, DowngradeTrigger, ResetTrigger } from "@/domain/membership/downgrade.domain";
import { MemberTierType } from "@prisma/client";
import { NotFoundError } from "@/errors";
import { cacheInvalidationService } from "@/utils/cache/cache-invalidation.service";

type MembershipAdjustmentResult =
  | {
      status: "PENDING";
      newTier: MemberTierType | "PENDING_STAKEHOLDER_CONFIRMATION";
      penaltyAmount: number | "PENDING_STAKEHOLDER_CONFIRMATION";
    }
  | {
      status: "APPLIED";
      newTier: MemberTierType;
      penaltyAmount: number;
    };

export class MembershipAdjustmentService {
  /**
   * Applies a downgrade penalty to a user's membership.
   */
  async downgradeMembership(
    userId: string,
    trigger: DowngradeTrigger,
    performedBy: string,
  ): Promise<MembershipAdjustmentResult> {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User not found");

      const currentBalance = await tokenLedgerRepository.getBalance(userId, tx);

      const { newTier, penaltyAmount } = calculateDowngrade(
        user.division,
        user.membershipTier,
        currentBalance,
        trigger
      );

      if (newTier === "PENDING_STAKEHOLDER_CONFIRMATION" || penaltyAmount === "PENDING_STAKEHOLDER_CONFIRMATION") {
        // Log audit but don't apply penalty yet
        await logAudit({
          action: "TIER_DOWNGRADE",
          actorId: performedBy,
          targetType: "User",
          targetId: userId,
          previousValue: { tier: user.membershipTier, balance: currentBalance },
          newValue: { tier: newTier, penalty: penaltyAmount },
          tx,
        });
        return { status: "PENDING" as const, newTier, penaltyAmount };
      }

      // 1. Deduct tokens via append-only ledger
      if (penaltyAmount > 0) {
        await tokenLedgerRepository.appendTokenEvent({
          userId,
          eventType: "DOWNGRADE_PENALTY",
          amount: -penaltyAmount,
          reason: `Downgrade triggered by: ${trigger}`,
          performedBy,
        }, tx);
      }

      const balanceAfter = currentBalance - penaltyAmount;

      // 2. Add history entry
      await tx.membershipHistory.create({
        data: {
          userId,
          previousTier: user.membershipTier,
          newTier,
          changeReason: `DOWNGRADE: ${trigger}`,
          triggeredBy: performedBy,
          tokenBalanceBefore: currentBalance,
          tokenBalanceAfter: balanceAfter,
        },
      });

      // 3. Update user tier
      await tx.user.update({
        where: { id: userId },
        data: { membershipTier: newTier },
      });

      // 4. Audit
      await logAudit({
        action: "TIER_DOWNGRADE",
        actorId: performedBy,
        targetType: "User",
        targetId: userId,
        previousValue: { tier: user.membershipTier, balance: currentBalance },
        newValue: { tier: newTier, balance: balanceAfter },
        tx,
      });

      return { status: "APPLIED" as const, newTier, penaltyAmount };
    });

    if (result.status === "APPLIED") {
      await cacheInvalidationService.invalidateAfterCommit({ 
        type: "MEMBERSHIP_MUTATED", 
        userId, 
        tokenPenaltyApplied: result.penaltyAmount > 0 
      });
    }

    return result;
  }

  /**
   * Applies an upgrade to a user's membership tier automatically.
   */
  async upgradeMembership(
    userId: string,
    newTier: MemberTierType,
    performedBy: string,
    txClient?: any
  ): Promise<{ status: "APPLIED"; newTier: MemberTierType }> {
    const runInTx = async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User not found");

      const currentBalance = await tokenLedgerRepository.getBalance(userId, tx);

      // Add history entry
      await tx.membershipHistory.create({
        data: {
          userId,
          previousTier: user.membershipTier,
          newTier,
          changeReason: `UPGRADE: Reached token threshold`,
          triggeredBy: performedBy,
          tokenBalanceBefore: currentBalance,
          tokenBalanceAfter: currentBalance, // Upgrades don't cost tokens
        },
      });

      // Update user tier
      await tx.user.update({
        where: { id: userId },
        data: { membershipTier: newTier },
      });

      // Audit
      await logAudit({
        action: "TIER_UPGRADE",
        actorId: performedBy,
        targetType: "User",
        targetId: userId,
        previousValue: { tier: user.membershipTier },
        newValue: { tier: newTier },
        tx,
      });

      return { status: "APPLIED" as const, newTier };
    };

    const result = txClient ? await runInTx(txClient) : await prisma.$transaction(runInTx);

    if (result.status === "APPLIED") {
      await cacheInvalidationService.invalidateAfterCommit({ 
        type: "MEMBERSHIP_MUTATED", 
        userId, 
        tokenPenaltyApplied: false
      });
    }

    return result;
  }

  /**
   * Applies a reset penalty to a user's membership.
   */
  async resetMembership(
    userId: string,
    trigger: ResetTrigger,
    performedBy: string,
  ): Promise<MembershipAdjustmentResult> {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User not found");

      const currentBalance = await tokenLedgerRepository.getBalance(userId, tx);

      const { newTier, penaltyAmount } = calculateReset(
        user.division,
        user.membershipTier,
        currentBalance,
        trigger
      );

      if (newTier === "PENDING_STAKEHOLDER_CONFIRMATION" || penaltyAmount === "PENDING_STAKEHOLDER_CONFIRMATION") {
        await logAudit({
          action: "TIER_RESET",
          actorId: performedBy,
          targetType: "User",
          targetId: userId,
          previousValue: { tier: user.membershipTier, balance: currentBalance },
          newValue: { tier: newTier, penalty: penaltyAmount },
          tx,
        });
        return { status: "PENDING" as const, newTier, penaltyAmount };
      }

      if (penaltyAmount > 0) {
        await tokenLedgerRepository.appendTokenEvent({
          userId,
          eventType: "RESET_PENALTY",
          amount: -penaltyAmount,
          reason: `Reset triggered by: ${trigger}`,
          performedBy,
        }, tx);
      }

      const balanceAfter = currentBalance - penaltyAmount;

      await tx.membershipHistory.create({
        data: {
          userId,
          previousTier: user.membershipTier,
          newTier,
          changeReason: `RESET: ${trigger}`,
          triggeredBy: performedBy,
          tokenBalanceBefore: currentBalance,
          tokenBalanceAfter: balanceAfter,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { membershipTier: newTier },
      });

      await logAudit({
        action: "TIER_RESET",
        actorId: performedBy,
        targetType: "User",
        targetId: userId,
        previousValue: { tier: user.membershipTier, balance: currentBalance },
        newValue: { tier: newTier, balance: balanceAfter },
        tx,
      });

      return { status: "APPLIED" as const, newTier, penaltyAmount };
    });

    if (result.status === "APPLIED") {
      await cacheInvalidationService.invalidateAfterCommit({ 
        type: "MEMBERSHIP_MUTATED", 
        userId, 
        tokenPenaltyApplied: result.penaltyAmount > 0 
      });
    }

    return result;
  }
}

export const membershipAdjustmentService = new MembershipAdjustmentService();
