import { ForbiddenError, NotFoundError } from "@/errors";
import { CacheService } from "@/services/cache.service";
import { LoyaltyCalculationService } from "@/services/loyalty-calculation.service";
import { redemptionService } from "@/services/redemption.service";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { teamLeaderRepository } from "@/repositories/team-leader.repository";
import { CacheKeys } from "@/utils/cache/cache-key.registry";
import type { SessionUser } from "@/types/api.types";

const EMPTY_TIER_DISTRIBUTION = {
  SAPHIRE: 0,
  EMERALD: 0,
  RUBY: 0,
  DIAMOND: 0,
} as const;

export class TeamLeaderService {
  async getDashboard(user: SessionUser) {
    const members = await teamLeaderRepository.findActiveTeamMemberTiers(user.id);
    const memberIds = members.map((member) => member.id);
    const [teamTotalTokens, redemptions] = await Promise.all([
      teamLeaderRepository.sumTokenLedger(memberIds),
      user.division
        ? redemptionService.listByDivision(user.division, { limit: 5 })
        : Promise.resolve({ requests: [], total: 0 }),
    ]);

    const teamTierDistribution = { ...EMPTY_TIER_DISTRIBUTION };
    for (const member of members) {
      if (member.membershipTier in teamTierDistribution) {
        teamTierDistribution[member.membershipTier] += 1;
      }
    }

    return {
      teamTotalTokens,
      teamTierDistribution,
      recentRedemptions: redemptions.requests.map((request) => ({
        id: request.id,
        status: request.status,
        createdAt: request.submittedAt.toISOString(),
        mitra: {
          name: request.mitra.name,
          division: request.mitra.division,
        },
        item: {
          name: request.rewardItem.name,
          tokenCost: request.tokenCost,
        },
      })),
      memberCount: members.length,
    };
  }

  async getTeamSummary(teamLeadId: string) {
    const cacheKey = CacheKeys.teamTokenSummary(teamLeadId);
    return CacheService.getWithFallback(cacheKey, async () => {
      const members = await teamLeaderRepository.findTeamMembers(teamLeadId);
      const summaries = await Promise.all(
        members.map(async (member) => ({
          ...member,
          currentBalance: await tokenLedgerRepository.getBalance(member.id),
        })),
      );

      return { teamLeadId, members: summaries, count: summaries.length };
    });
  }

  async getMemberDetail(
    requester: SessionUser,
    memberId: string,
    pagination: { limit: number; offset: number },
  ) {
    const member = await teamLeaderRepository.findMember(memberId);
    if (!member) throw new NotFoundError("User", memberId);

    if (requester.role === "TEAM_LEADER" && member.teamLeadId !== requester.id) {
      throw new ForbiddenError("You can only view your own team members.");
    }

    const tokenSummary = await LoyaltyCalculationService.getTokenSummary(member.id);
    const [history, total] = await Promise.all([
      tokenLedgerRepository.getHistory(member.id, pagination.limit, pagination.offset),
      teamLeaderRepository.countTokenLedger(member.id),
    ]);

    return {
      member: {
        ...member,
        totalTokens: tokenSummary.totalTokens,
      },
      tokenSummary,
      ledger: history,
      total,
    };
  }
}

export const teamLeaderService = new TeamLeaderService();
