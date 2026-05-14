/**
 * Backend/src/services/evaluation.service.ts
 *
 * Scheduled jobs for membership evaluation and token expiry.
 * SOLID — SRP: handles only automated evaluation logic.
 */

import { prisma } from "@/db/prisma";
import { Division, TokenEventType, MembershipTier, PartnerStatus } from "@prisma/client";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { membershipService } from "./membership.service";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";

export class EvaluationService {
  /**
   * Evaluates membership downgrade and reset conditions monthly.
   * Runs on the 1st of each month.
   */
  async runMonthlyMembershipEvaluation() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Idempotency: check if already run this month
    const alreadyRun = await prisma.auditLog.findFirst({
      where: {
        action: "SCHEDULED_MEMBERSHIP_EVALUATION",
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth, 1, 23, 59, 59),
        },
      },
    });

    if (alreadyRun) {
      return { skipped: true, message: "Already run for this month" };
    }

    const activeMitras = await prisma.user.findMany({
      where: {
        partnerStatus: PartnerStatus.ACTIVE,
        division: { in: [Division.OPCENT, Division.TELE] },
      },
    });

    const results = {
      evaluated: 0,
      downgraded: 0,
      reset: 0,
      skipped: 0,
    };

    // Define the last 3 months' boundaries
    const months = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({ start, end });
    }

    for (const mitra of activeMitras) {
      results.evaluated++;

      let inactiveMonths = 0;
      for (const month of months) {
        const claimCount = await prisma.shiftClaim.count({
          where: {
            mitraId: mitra.id,
            shiftDate: { gte: month.start, lte: month.end },
            status: "APPROVED",
          },
        });
        if (claimCount === 0) inactiveMonths++;
      }

      if (inactiveMonths >= 3) {
        const currentBalance = await tokenLedgerRepository.getBalance(mitra.id);
        
        // Decide between DOWNGRADE and RESET based on availability (placeholder logic)
        // If they had ZERO claims at all (not even pending/rejected), we'll consider it a RESET
        const totalAttempts = await prisma.shiftClaim.count({
          where: {
            mitraId: mitra.id,
            shiftDate: { gte: months[2].start, lte: months[0].end },
          }
        });

        const isReset = totalAttempts === 0;

        await prisma.$transaction(async (tx) => {
          let newTier: MembershipTier = MembershipTier.SAPHIRE;
          let penaltyAmount = currentBalance;
          let eventType = TokenEventType.RESET_PENALTY;

          if (!isReset) {
            // Apply Downgrade (Tier - 1, 50% penalty)
            const tierOrder = LOYALTY_POLICIES.TIER_ORDER;
            const currentIdx = tierOrder.indexOf(mitra.membershipTier);
            newTier = currentIdx > 0 ? tierOrder[currentIdx - 1] as MembershipTier : MembershipTier.SAPHIRE;
            penaltyAmount = Math.floor(currentBalance * 0.5);
            eventType = TokenEventType.DOWNGRADE_PENALTY;
          }

          if (penaltyAmount > 0 || mitra.membershipTier !== newTier) {
            await tx.tokenLedger.create({
              data: {
                userId:      mitra.id,
                eventType:   eventType,
                amount:      -penaltyAmount,
                balanceAfter: currentBalance - penaltyAmount,
                reason:      isReset ? "3 months total unavailability" : "3 months of inactivity",
                performedBy: "SYSTEM",
              },
            });

            await tx.membershipHistory.create({
              data: {
                userId:             mitra.id,
                previousTier:       mitra.membershipTier,
                newTier:            newTier,
                changeReason:       isReset ? "RESET" : "DOWNGRADE",
                triggeredBy:        "SYSTEM",
                tokenBalanceBefore: currentBalance,
                tokenBalanceAfter:  currentBalance - penaltyAmount,
              },
            });

            await tx.user.update({
              where: { id: mitra.id },
              data: { membershipTier: newTier },
            });

            if (isReset) results.reset++; else results.downgraded++;
          } else {
            results.skipped++;
          }
        });
      } else {
        results.skipped++;
      }
    }

    // Log the job completion
    await prisma.auditLog.create({
      data: {
        actorId: "SYSTEM",
        action: "SCHEDULED_MEMBERSHIP_EVALUATION",
        newValue: results,
      },
    });

    return results;
  }

  /**
   * Processes token expiry based on a 4-year lifecycle.
   * Tokens earned in Year N expire on Dec 31 of Year (N+3).
   */
  async runTokenExpiryJob() {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Only run on Dec 31 or if explicitly triggered
    // For safety, we'll allow it to run any time but only target cohorts that have passed their expiresAt
    
    const activeUsers = await prisma.user.findMany({
      where: { partnerStatus: { in: [PartnerStatus.ACTIVE, PartnerStatus.INACTIVE] } },
      select: { id: true }
    });

    const results = {
      processedUsers: 0,
      expiredTokens: 0,
      entriesCreated: 0,
    };

    for (const user of activeUsers) {
      results.processedUsers++;

      // Find all credit entries that have expired but haven't been accounted for in an EXPIRED event
      // We look for cohorts (earnedYear) where expiresAt <= today
      const expiredCohorts = await prisma.tokenLedger.groupBy({
        by: ["earnedYear"],
        where: {
          userId: user.id,
          expiresAt: { lte: today },
          earnedYear: { not: null },
        },
        _sum: { amount: true },
      });

      for (const cohort of expiredCohorts) {
        if (!cohort.earnedYear || !cohort._sum.amount) continue;

        const year = cohort.earnedYear;
        const totalEarnedInCohort = cohort._sum.amount;

        // Check if we already created an EXPIRED entry for this user and cohort
        const alreadyExpired = await prisma.tokenLedger.aggregate({
          where: {
            userId: user.id,
            eventType: TokenEventType.EXPIRED,
            reason: { contains: `Cohort ${year}` },
          },
          _sum: { amount: true },
        });

        const previouslyExpiredAmount = Math.abs(alreadyExpired._sum.amount ?? 0);
        
        // Find how many debits have consumed this cohort (FIFO assumption)
        // Total debits since the beginning of time
        const totalDebits = await prisma.tokenLedger.aggregate({
          where: {
            userId: user.id,
            amount: { lt: 0 },
            eventType: { not: TokenEventType.EXPIRED },
          },
          _sum: { amount: true },
        });

        const totalDebitsAmount = Math.abs(totalDebits._sum.amount ?? 0);

        // Calculate credits from years BEFORE this one
        const previousCredits = await prisma.tokenLedger.aggregate({
          where: {
            userId: user.id,
            amount: { gt: 0 },
            earnedYear: { lt: year },
          },
          _sum: { amount: true },
        });

        const previousCreditsAmount = previousCredits._sum.amount ?? 0;

        // Tokens from this cohort that were already consumed by debits:
        // debits_available_for_this_cohort = max(0, total_debits - previous_credits)
        const debitsConsumedFromThisCohort = Math.max(0, totalDebitsAmount - previousCreditsAmount);
        
        // remaining_in_cohort = total_earned - debits_consumed - already_expired
        const remainingInCohort = Math.max(0, totalEarnedInCohort - debitsConsumedFromThisCohort - previouslyExpiredAmount);

        if (remainingInCohort > 0) {
          const currentBalance = await tokenLedgerRepository.getBalance(user.id);
          
          await prisma.$transaction(async (tx) => {
            await tx.tokenLedger.create({
              data: {
                userId:      user.id,
                eventType:   TokenEventType.EXPIRED,
                amount:      -remainingInCohort,
                balanceAfter: currentBalance - remainingInCohort,
                reason:      `Token expired (Cohort ${year})`,
                performedBy: "SYSTEM",
                earnedYear:  year,
              },
            });
          });

          results.expiredTokens += remainingInCohort;
          results.entriesCreated++;
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: "SYSTEM",
        action: "SCHEDULED_TOKEN_EXPIRY",
        newValue: results,
      },
    });

    return results;
  }
}

export const evaluationService = new EvaluationService();
