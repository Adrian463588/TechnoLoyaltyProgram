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
  const cached = await CacheService.get<TokenExpirySummary>(cacheKey);
  if (cached) return cached;

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

  const result = {
    userId,
    totalExpiring30Days,
    expiringByYear,
  };

  await CacheService.set(cacheKey, result);
  return result;
}

/**
 * Returns the token summary for a specific employee.
 */
async function getTokenSummary(userId: string): Promise<TokenSummary> {
  const cacheKey = CacheKeys.tokenBalance(userId);
  const cached = await CacheService.get<TokenSummary>(cacheKey);
  if (cached) return cached;

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

  const result: TokenSummary = {
    userId,
    totalTokens,
    currentTier: calcResult.tier,
    pointsToNextTier: calcResult.pointsToNext,
    nextTier: calcResult.nextTier,
    isEligibleForReward: totalTokens > 0, // Simplified guard
    memberStatus: user.partnerStatus,
    cumulativeValue, // Added for frontend progress bars
    periodEnd: end.toISOString(),
  };

  await CacheService.set(cacheKey, result);
  return result;
}

/**
 * Returns dashboard data for a specific employee.
 */
async function getEmployeeDashboard(userId: string): Promise<EmployeeDashboardData> {
  const cacheKey = CacheKeys.mitraDashboard(userId);
  const cached = await CacheService.get<EmployeeDashboardData>(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const tokenSummary = await getTokenSummary(userId);

  const recentRedemptions = await prisma.redemptionRequest.findMany({
    where: { mitraId: userId },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: {
      rewardItem: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
    },
  });

  const result: EmployeeDashboardData = {
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
  };

  await CacheService.set(cacheKey, result);
  return result;
}

/** Namespace export for backward compatibility */
export const LoyaltyCalculationService = {
  getEmployeeDashboard,
  getTokenSummary,
  getTokenExpirySummary,
};
