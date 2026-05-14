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
import { checkRedemptionEligibility } from "./loyalty.service";
import type {
  EmployeeDashboardData,
  TokenSummary,
  RewardRequest,
} from "@/types/domain.types";
import { PartnerStatus } from "@prisma/client";

/**
 * Returns the token summary for a specific employee.
 */
async function getTokenSummary(userId: string): Promise<TokenSummary> {
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

  return {
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
}

/**
 * Returns dashboard data for a specific employee.
 */
async function getEmployeeDashboard(userId: string): Promise<EmployeeDashboardData> {
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
  };
}

/** Namespace export for backward compatibility */
export const LoyaltyCalculationService = {
  getEmployeeDashboard,
  getTokenSummary,
};
