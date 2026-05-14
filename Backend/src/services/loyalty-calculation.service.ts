/**
 * Backend/src/services/loyalty-calculation.service.ts
 *
 * Service for computing token/tier dashboards and team visibility.
 * DB reads only — mutations go through UploadProcessingService or RedemptionService.
 *
 * SOLID — SRP: only calculates and reads loyalty data, no side effects.
 */

import { prisma } from "@/db/prisma";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";
import { logAudit } from "./audit.service";
import { ForbiddenError, NotFoundError, ValidationError } from "@/errors/index";
import { PeriodRepository } from "@/repositories/period.repository";
import type {
  TeamMemberSummary,
  EmployeeDashboardData,
  TokenSummary,
  MemberStatus,
} from "@/types/domain.types";

const periodRepo = new PeriodRepository(prisma);

/**
 * Returns the token summary for a specific employee.
 */
async function getTokenSummary(userId: string): Promise<TokenSummary> {
  const profile = await prisma.userLoyaltyProfile.findUnique({
    where: { userId },
  });

  const totalTokens = profile?.totalTokens ?? 0;
  const remainingTokens = profile?.remainingTokens ?? 0;
  const currentTier = LOYALTY_POLICIES.calculateTier(totalTokens);
  const tierOrder = LOYALTY_POLICIES.TIER_ORDER;
  const thresholds = LOYALTY_POLICIES.TIER_THRESHOLDS;

  const currentIdx = tierOrder.indexOf(currentTier);
  const nextTier = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;
  const pointsToNextTier = nextTier ? Math.max(0, thresholds[nextTier] - totalTokens) : 0;
  const totalForNextTier = nextTier ? thresholds[nextTier] : thresholds[currentTier];

  // Fetch active period from DB — no hardcoded dates
  const activePeriod = await prisma.earningPeriod.findFirst({
    where: { isActive: true },
  });

  return {
    userId,
    totalTokens,
    remainingTokens,
    currentTier,
    pointsToNextTier,
    totalForNextTier,
    isEligibleForReward: totalTokens >= LOYALTY_POLICIES.REDEMPTION_THRESHOLD,
    activePeriod: activePeriod?.name ?? "N/A",
    activePeriodStart: activePeriod?.startDate.toISOString() ?? "",
    activePeriodEnd: activePeriod?.endDate.toISOString() ?? "",
    memberStatus: (profile?.memberStatus ?? "ACTIVE") as MemberStatus,
  };
}

/**
 * Returns dashboard data for a specific employee.
 * Includes token summary, tier, and recent redemptions.
 */
async function getEmployeeDashboard(userId: string): Promise<EmployeeDashboardData> {
  const profile = await prisma.userLoyaltyProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, npk: true, email: true, divisionId: true } },
    },
  });

  const tokenSummary = await getTokenSummary(userId);

  const recentRedemptions = await prisma.rewardRedemptionRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      item: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
    },
  });

  const user = profile?.user;

  // Fetch division type for the user
  const divisionRecord = user?.divisionId
    ? await prisma.division.findUnique({ where: { id: user.divisionId }, select: { type: true } })
    : null;

  return {
    user: {
      id: user?.id ?? userId,
      name: user?.name ?? "Unknown",
      npk: user?.npk ?? "",
      division: divisionRecord?.type ?? "OPTEL",
    },
    tokenSummary,
    recentRedemptions: recentRedemptions.map((r) => ({
      id: r.id,
      userId: r.userId,
      rewardId: r.rewardItemId,
      rewardName: r.item.name,
      tokensSpent: r.tokensSpent,
      status: r.status,
      requestedAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      rejectReason: r.rejectReason,
    })),
  };
}

/**
 * Returns a summary of all team members for a leader.
 * @throws ForbiddenError if leader has no team assigned.
 */
async function getTeamSummary(leaderId: string): Promise<TeamMemberSummary[]> {
  const leader = await prisma.user.findUnique({
    where: { id: leaderId },
    select: { teamId: true },
  });

  if (!leader?.teamId) {
    throw new ForbiddenError("You are not assigned to a team");
  }

  const members = await prisma.user.findMany({
    where: { teamId: leader.teamId, role: "MITRA" },
    select: {
      id: true,
      name: true,
      npk: true,
      division: { select: { name: true, type: true } },
      loyaltyProfile: {
        select: { totalTokens: true, currentTier: true, memberStatus: true },
      },
    },
  });

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    npk: m.npk,
    division: m.division?.type ?? "OPTEL",
    tokens: m.loyaltyProfile?.totalTokens ?? 0,
    tier: m.loyaltyProfile?.currentTier ?? "BRONZE",
    memberStatus: (m.loyaltyProfile?.memberStatus ?? "ACTIVE") as MemberStatus,
  }));
}

/**
 * Returns dashboard data for a specific team member.
 * Verifies that the member belongs to the leader's team.
 * @throws ForbiddenError if leader has no team or member is not in the team.
 * @throws NotFoundError if the member does not exist.
 */
async function getTeamMemberDetail(
  leaderId: string,
  memberId: string,
): Promise<EmployeeDashboardData> {
  // Verify leader has a team
  const leader = await prisma.user.findUnique({
    where: { id: leaderId },
    select: { teamId: true },
  });

  if (!leader?.teamId) {
    throw new ForbiddenError("You are not assigned to a team");
  }

  // Verify member exists
  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { teamId: true },
  });

  if (!member) {
    throw new NotFoundError("Employee", memberId);
  }

  // Verify member belongs to leader's team
  if (member.teamId !== leader.teamId) {
    throw new ForbiddenError("This employee is not in your team");
  }

  return getEmployeeDashboard(memberId);
}

/**
 * Calculate and issue tokens for a user based on their division metrics.
 * Transactional: Ledger, DivisionMetric, and LoyaltyProfile are kept in sync.
 * @throws ValidationError if periodId is empty or no active period exists.
 */
async function issueTokensForPeriod(
  userId: string,
  periodId: string,
  divisionType: "OPTEL" | "TECHNO",
  rawMetrics: Record<string, number | string>,
  actorId: string,
  sourceId?: string,
): Promise<{ success: boolean; earnedTokens: number }> {
  // Validate periodId is not empty
  if (!periodId || periodId.trim() === "") {
    throw new ValidationError("periodId is required to issue tokens");
  }

  // Validate the period exists
  const period = await periodRepo.findById(periodId);
  if (!period) {
    throw new NotFoundError("EarningPeriod", periodId);
  }

  let earnedTokens = 0;

  if (divisionType === "OPTEL") {
    const slots = Number(rawMetrics["totalSlots"] ?? rawMetrics["slots"] ?? 0);
    earnedTokens = slots * LOYALTY_POLICIES.OPTEL_CONVERSION.PER_SLOT_VALUE;
  } else {
    const sprints = Number(rawMetrics["sprintBalance"] ?? 0);
    const rejections = Number(rawMetrics["projectRejections"] ?? 0);
    const effectiveSprints = Math.max(0, sprints - rejections);
    earnedTokens = effectiveSprints * LOYALTY_POLICIES.TECHNO_CONVERSION.PER_SPRINT_VALUE;
  }

  if (earnedTokens <= 0) {
    return { success: true, earnedTokens: 0 };
  }

  await prisma.$transaction(async (tx) => {
    const entry = await tx.tokenLedgerEntry.create({
      data: {
        userId,
        amount: earnedTokens,
        sourceType: divisionType === "OPTEL" ? "UPLOAD_OPTEL" : "UPLOAD_TECHNO",
        sourceId: sourceId ?? null,
        periodId,
      },
    });

    const profile = await tx.userLoyaltyProfile.upsert({
      where: { userId },
      create: { userId, totalTokens: earnedTokens, remainingTokens: earnedTokens },
      update: {
        totalTokens: { increment: earnedTokens },
        remainingTokens: { increment: earnedTokens },
      },
    });

    const newTotalTokens = profile.totalTokens + earnedTokens;
    const newTier = LOYALTY_POLICIES.calculateTier(newTotalTokens);
    if (profile.currentTier !== newTier) {
      await tx.userLoyaltyProfile.update({
        where: { id: profile.id },
        data: {
          currentTier: newTier,
          isEligible: newTotalTokens >= LOYALTY_POLICIES.REDEMPTION_THRESHOLD,
        },
      });
    }

    const existingMetric = await tx.userDivisionMetric.findFirst({
      where: { profileId: profile.id, divisionType },
    });

    if (existingMetric) {
      await tx.userDivisionMetric.update({
        where: { id: existingMetric.id },
        data:
          divisionType === "OPTEL"
            ? {
                totalSlots: { increment: Number(rawMetrics["totalSlots"] ?? rawMetrics["slots"] ?? 0) },
                regularSlots: { increment: Number(rawMetrics["regularSlots"] ?? 0) },
              }
            : {
                sprintBalance: { increment: Number(rawMetrics["sprintBalance"] ?? 0) },
                projectRejections: { increment: Number(rawMetrics["projectRejections"] ?? 0) },
              },
      });
    } else {
      await tx.userDivisionMetric.create({
        data: {
          profileId: profile.id,
          divisionType,
          ...(divisionType === "OPTEL"
            ? {
                totalSlots: Number(rawMetrics["totalSlots"] ?? rawMetrics["slots"] ?? 0),
                regularSlots: Number(rawMetrics["regularSlots"] ?? 0),
              }
            : {
                sprintBalance: Number(rawMetrics["sprintBalance"] ?? 0),
                projectRejections: Number(rawMetrics["projectRejections"] ?? 0),
              }),
        },
      });
    }

    await logAudit({
      action: "TOKENS_ISSUED",
      actorId,
      targetType: "TokenLedgerEntry",
      targetId: entry.id,
      details: { earnedTokens, divisionType, newTier },
      tx,
    });
  });

  return { success: true, earnedTokens };
}

/** Namespace export for backward compatibility */
export const LoyaltyCalculationService = {
  getEmployeeDashboard,
  getTokenSummary,
  getTeamSummary,
  getTeamMemberDetail,
  issueTokensForPeriod,
};
