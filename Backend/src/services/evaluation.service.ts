/**
 * Backend/src/services/evaluation.service.ts
 *
 * Scheduled jobs for membership evaluation and token expiry.
 *
 * SOLID — SRP: handles only automated evaluation logic.
 * AGENTS.md §8: Every scheduled job MUST use a JobRun guard (idempotent).
 *               Token ledger entries MUST go through tokenLedgerRepository.
 */

import { prisma } from "@/db/prisma";
import { DivisionType, MemberTierType, PartnershipStatus, TokenEventType } from "@prisma/client";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";
import { cacheInvalidationService } from "@/utils/cache/cache-invalidation.service";

// ── helpers ──────────────────────────────────────────────────────────────────

function buildPeriodKey(year: number, month: number): string {
  return `${String(year)}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Acquires a JobRun guard. Returns null if already run, throws on DB error.
 * Caller must call `finishJobRun(id, ...)` after work is done.
 */
async function acquireJobRun(
  jobName: string,
  periodKey: string,
): Promise<string | null> {
  const existing = await prisma.jobRun.findUnique({
    where: { jobName_periodKey: { jobName, periodKey } },
  });

  if (existing) return null; // already run — skip

  const run = await prisma.jobRun.create({
    data: { jobName, periodKey, status: "RUNNING" },
  });
  return run.id;
}

async function finishJobRun(
  runId: string,
  status: "SUCCESS" | "FAILED",
  summary: object,
): Promise<void> {
  await prisma.jobRun.update({
    where: { id: runId },
    data: { status, summary, finishedAt: new Date() },
  });
}

// ── EvaluationService ────────────────────────────────────────────────────────

export class EvaluationService {
  /**
   * Evaluates membership downgrade and reset conditions monthly.
   * Runs on the 1st of each month.
   * Division filter: OPCENT and TELE only (slot-based evaluation).
   */
  async runMonthlyMembershipEvaluation(): Promise<{ skipped: boolean; message: string } | { evaluated: number; downgraded: number; reset: number; skipped: number }> {
    const today = new Date();
    const periodKey = buildPeriodKey(today.getFullYear(), today.getMonth());
    const JOB_NAME = "membership-evaluation";

    const runId = await acquireJobRun(JOB_NAME, periodKey);
    if (!runId) {
      return { skipped: true, message: `Already run for period ${periodKey}` };
    }

    const results = { evaluated: 0, downgraded: 0, reset: 0, skipped: 0 };

    try {
      const activeMitras = await prisma.user.findMany({
        where: {
          partnerStatus: PartnershipStatus.ACTIVE,
          division: { in: [DivisionType.OPCENT, DivisionType.TELE] },
        },
      });

      // Define the last 3 months' boundaries
      const months: Array<{ start: Date; end: Date }> = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
        });
      }

      for (const mitra of activeMitras) {
        results.evaluated++;

        let inactiveMonths = 0;
        for (const month of months) {
          const claimCount = await prisma.shiftClaim.count({
            where: {
              mitraId:   mitra.id,
              shiftDate: { gte: month.start, lte: month.end },
              status:    "APPROVED",
            },
          });
          if (claimCount === 0) inactiveMonths++;
        }

        if (inactiveMonths >= 3) {
          const currentBalance = await tokenLedgerRepository.getBalance(mitra.id);

          // Determine DOWNGRADE vs RESET by whether they had any claim attempts at all
          const totalAttempts = await prisma.shiftClaim.count({
            where: {
              mitraId:   mitra.id,
              shiftDate: { gte: months[2]?.start ?? today, lte: months[0]?.end ?? today },
            },
          });
          const isReset = totalAttempts === 0;

          const { newTier, penaltyAmount } = await prisma.$transaction(async (tx) => {
            let newTier: MemberTierType = MemberTierType.SAPHIRE;
            let penaltyAmount = currentBalance; // RESET: full balance
            let eventType: TokenEventType = TokenEventType.RESET_PENALTY;

            if (!isReset) {
              // DOWNGRADE: tier - 1, 50% penalty
              const tierOrder = LOYALTY_POLICIES.TIER_ORDER;
              const currentIdx = tierOrder.indexOf(mitra.membershipTier);
              newTier = currentIdx > 0
                ? (tierOrder[currentIdx - 1] as MemberTierType)
                : MemberTierType.SAPHIRE;
              penaltyAmount = Math.floor(currentBalance * 0.5);
              eventType = TokenEventType.DOWNGRADE_PENALTY;
            }

            if (penaltyAmount > 0 || mitra.membershipTier !== newTier) {
              // Use repository to maintain append-only guarantee
              await tokenLedgerRepository.appendTokenEvent(
                {
                  userId:      mitra.id,
                  eventType,
                  amount:      -penaltyAmount,
                  reason:      isReset
                    ? "3 months total unavailability"
                    : "3 months of inactivity",
                  performedBy: "SYSTEM",
                },
                tx,
              );

              await tx.membershipHistory.create({
                data: {
                  userId:             mitra.id,
                  previousTier:       mitra.membershipTier,
                  newTier,
                  changeReason:       isReset ? "RESET" : "DOWNGRADE",
                  triggeredBy:        "SYSTEM",
                  tokenBalanceBefore: currentBalance,
                  tokenBalanceAfter:  currentBalance - penaltyAmount,
                },
              });

              await tx.user.update({
                where: { id: mitra.id },
                data:  { membershipTier: newTier },
              });

              await tx.auditLog.create({
                data: {
                  actorId:         "SYSTEM",
                  action:          isReset ? "MEMBERSHIP_RESET" : "MEMBERSHIP_DOWNGRADED",
                  targetUserId:    mitra.id,
                  targetEntityType: "User",
                  targetEntityId:  mitra.id,
                  previousValue:   { tier: mitra.membershipTier, balance: currentBalance },
                  newValue:        { tier: newTier, balance: currentBalance - penaltyAmount },
                },
              });

              if (isReset) results.reset++; else results.downgraded++;
            } else {
              results.skipped++;
            }

            return { newTier, penaltyAmount };
          });

          // Post-commit cache invalidation
          if (mitra.membershipTier !== newTier) {
            await cacheInvalidationService.invalidateAfterCommit({ type: "MEMBERSHIP_MUTATED", userId: mitra.id });
          }
          if (penaltyAmount > 0) {
            await cacheInvalidationService.invalidateAfterCommit({ type: "TOKEN_MUTATED", userId: mitra.id });
          }
        } else {
          results.skipped++;
        }
      }

      await finishJobRun(runId, "SUCCESS", results);
      return results;
    } catch (err) {
      await finishJobRun(runId, "FAILED", { error: String(err) });
      throw err;
    }
  }

  /**
   * Processes token expiry based on a 5-year lifecycle.
   * Tokens earned in Year N expire on Dec 31 of Year (N+4).
   *
   * AGENTS.md §8: Uses JobRun guard + tokenLedgerRepository for append-only writes.
   */
  async runTokenExpiryJob(forceYear?: number): Promise<{ skipped: boolean; message: string } | { processedUsers: number; expiredTokens: number; entriesCreated: number }> {
    const today = new Date();
    const targetYear = forceYear ?? today.getFullYear();
    const periodKey  = `${String(targetYear)}-token-expiry`;
    const JOB_NAME   = "token-expiry";

    const runId = await acquireJobRun(JOB_NAME, periodKey);
    if (!runId) {
      return { skipped: true, message: `Token expiry already run for period ${periodKey}` };
    }

    const results = { processedUsers: 0, expiredTokens: 0, entriesCreated: 0 };

    try {
      const activeUsers = await prisma.user.findMany({
        where: { partnerStatus: { in: [PartnershipStatus.ACTIVE, PartnershipStatus.INACTIVE] } },
        select: { id: true },
      });

      for (const user of activeUsers) {
        results.processedUsers++;

        // Find cohorts where all tokens have expired (expiresAt <= today)
        const expiredCohorts = await prisma.tokenLedger.groupBy({
          by: ["earnedYear"],
          where: {
            userId:     user.id,
            expiresAt:  { lte: today },
            earnedYear: { not: null },
          },
          _sum: { amount: true },
        });

        for (const cohort of expiredCohorts) {
          if (!cohort.earnedYear || !cohort._sum.amount) continue;

          const year               = cohort.earnedYear;
          const totalEarnedInCohort = cohort._sum.amount;

          // Check if EXPIRED entry already exists for this cohort (idempotency within cohort)
          const alreadyExpired = await prisma.tokenLedger.aggregate({
            where: {
              userId:    user.id,
              eventType: TokenEventType.EXPIRED,
              reason:    { contains: `Cohort ${String(year)}` },
            },
            _sum: { amount: true },
          });

          const previouslyExpiredAmount = Math.abs(alreadyExpired._sum.amount ?? 0);

          // FIFO: calculate how many debits consumed tokens from earlier cohorts
          const totalDebits = await prisma.tokenLedger.aggregate({
            where: {
              userId:    user.id,
              amount:    { lt: 0 },
              eventType: { not: TokenEventType.EXPIRED },
            },
            _sum: { amount: true },
          });

          const previousCredits = await prisma.tokenLedger.aggregate({
            where: {
              userId:    user.id,
              amount:    { gt: 0 },
              earnedYear: { lt: year },
            },
            _sum: { amount: true },
          });

          const totalDebitsAmount       = Math.abs(totalDebits._sum.amount ?? 0);
          const previousCreditsAmount   = previousCredits._sum.amount ?? 0;
          const debitsConsumedFromCohort = Math.max(0, totalDebitsAmount - previousCreditsAmount);
          const remainingInCohort       = Math.max(
            0,
            totalEarnedInCohort - debitsConsumedFromCohort - previouslyExpiredAmount,
          );

          if (remainingInCohort > 0) {
            // AGENTS.md: use repository, not raw prisma.tokenLedger.create
            await tokenLedgerRepository.appendTokenEvent({
              userId:      user.id,
              eventType:   TokenEventType.EXPIRED,
              amount:      -remainingInCohort,
              reason:      `Token expired (Cohort ${String(year)})`,
              performedBy: "SYSTEM",
              earnedYear:  year,
            });

            await prisma.auditLog.create({
              data: {
                actorId:         "SYSTEM",
                action:          "TOKEN_EXPIRED",
                targetUserId:    user.id,
                previousValue:   { cohort: year },
                newValue:        { expired: remainingInCohort },
              },
            });

            // Post-commit cache invalidation (no transaction wrapped around the ledger insertion here directly except inside the repository)
            await cacheInvalidationService.invalidateAfterCommit({ type: "TOKEN_MUTATED", userId: user.id });

            results.expiredTokens  += remainingInCohort;
            results.entriesCreated += 1;
          }
        }
      }

      await finishJobRun(runId, "SUCCESS", results);
      return results;
    } catch (err) {
      await finishJobRun(runId, "FAILED", { error: String(err) });
      throw err;
    }
  }
}

export const evaluationService = new EvaluationService();
