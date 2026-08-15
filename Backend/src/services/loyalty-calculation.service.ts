/**
 * Backend/src/services/loyalty-calculation.service.ts
 *
 * Service for computing token/tier dashboards and team visibility.
 * DB reads only — mutations go through UploadProcessingService or RedemptionService.
 *
 * SOLID — SRP: only calculates and reads loyalty data, no side effects.
 */

import { prisma } from "@/db/prisma";
import { membershipService } from "./membership.service";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { CacheService } from "./cache.service";
import { CacheKeys } from "@/utils/cache/cache-key.registry";
import { checkRedemptionEligibility } from "./loyalty.service";
import type {
  EmployeeDashboardData,
  TokenSummary,
} from "@/types/domain.types";

export interface TokenExpirySummary {
  userId: string;
  totalExpiring30Days: number;
  expiringByYear: Record<number, number>;
}

/**
 * Returns the token expiry summary for a specific employee.
 */
async function getTokenExpirySummary(userId: string): Promise<TokenExpirySummary> {
  const cacheKey = CacheKeys.tokenExpirySummary(userId);
  return CacheService.getWithFallback<TokenExpirySummary>(cacheKey, async () => {
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Group unexpired tokens by earnedYear (simplified logic, a true ledger might need a sum over active tokens)
    // For MVP purposes, this is a placeholder implementation using the DB
    const unexpiredEntries = await prisma.tokenLedger.findMany({
      where: {
        userId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      select: { amount: true, earnedYear: true, expiresAt: true },
    });

    let totalExpiring30Days = 0;
    const expiringByYear: Record<number, number> = {};

    for (const entry of unexpiredEntries) {
      if (entry.earnedYear) {
        expiringByYear[entry.earnedYear] = (expiringByYear[entry.earnedYear] || 0) + entry.amount;
      }
      if (entry.expiresAt && entry.expiresAt <= next30Days) {
        totalExpiring30Days += entry.amount;
      }
    }

    return {
      userId,
      totalExpiring30Days,
      expiringByYear,
    };
  });
}

/**
 * Returns the token summary for a specific employee.
 */
async function getTokenSummary(userId: string): Promise<TokenSummary> {
  const cacheKey = CacheKeys.tokenBalance(userId);
  return CacheService.getWithFallback<TokenSummary>(cacheKey, async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        division: true,
        membershipTier: true,
        partnerStatus: true,
      }
    });

    if (!user) throw new Error("User not found");

    const totalTokens = await tokenLedgerRepository.getBalance(userId);

    const leastExpensiveReward = await prisma.rewardItem.findFirst({
      where: { isActive: true },
      orderBy: { tokenCost: "asc" },
      select: { tokenCost: true, stock: true, isActive: true },
    });
    
    // Calculate cumulativeValue based on the current evaluation period
    const { start, end } = membershipService.getCurrentPeriodDates(user.division);
    
    const aggregation = await prisma.tokenLedger.aggregate({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
        eventType: { in: ["EARNED_SHIFT", "EARNED_PROJECT"] },
      },
      _sum: { amount: true },
    });

    const cumulativeValue = aggregation._sum.amount ?? 0;
    const calcResult = membershipService.calculateTier(user.division, cumulativeValue);
    const eligibility = leastExpensiveReward
      ? checkRedemptionEligibility({
          tokenBalance: totalTokens,
          rewardTokenCost: leastExpensiveReward.tokenCost,
          partnerStatus: user.partnerStatus,
          isItemActive: leastExpensiveReward.isActive,
          stock: leastExpensiveReward.stock,
        })
      : { isEligible: false, reasons: ["No active rewards are currently available."] };

    return {
      userId,
      totalTokens,
      currentTier: calcResult.tier,
      pointsToNextTier: calcResult.pointsToNext,
      nextTier: calcResult.nextTier,
      isEligibleForReward: eligibility.isEligible,
      eligibilityReasons: eligibility.reasons,
      memberStatus: user.partnerStatus,
      cumulativeValue, // Added for frontend progress bars
      periodEnd: end.toISOString(),
    };
  });
}

/**
 * Returns dashboard data for a specific employee.
 */
async function getEmployeeDashboard(userId: string): Promise<EmployeeDashboardData> {
  const cacheKey = CacheKeys.mitraDashboard(userId);
  return CacheService.getWithFallback<EmployeeDashboardData>(cacheKey, async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User not found");

    const tokenSummary = await getTokenSummary(userId);

    const [recentRedemptions, recentTransactions] = await Promise.all([
      prisma.redemptionRequest.findMany({
        where: { mitraId: userId },
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: {
          rewardItem: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        },
      }),
      tokenLedgerRepository.getHistory(userId, 10, 0),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        division: user.division,
        partnerStatus: user.partnerStatus,
        membershipTier: user.membershipTier,
      },
      tokenSummary,
      recentRedemptions: recentRedemptions.map((r) => ({
        id: r.id,
        mitraId: r.mitraId,
        rewardId: r.rewardItemId,
        rewardName: r.rewardItem.name,
        tokenCost: r.tokenCost,
        status: r.status,
        submittedAt: r.submittedAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        rejectionReason: r.rejectionReason,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        eventType: t.eventType,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        reason: t.reason,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  });
}

/** Namespace export for backward compatibility */
export const LoyaltyCalculationService = {
  getEmployeeDashboard,
  getTokenSummary,
  getTokenExpirySummary,
};
