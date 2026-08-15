import { prisma } from "@/db/prisma";
import type { Prisma } from "@prisma/client";

const summaryMemberSelect = {
  id: true,
  name: true,
  npk: true,
  division: true,
  membershipTier: true,
  partnerStatus: true,
} satisfies Prisma.UserSelect;

const detailMemberSelect = {
  id: true,
  name: true,
  npk: true,
  division: true,
  membershipTier: true,
  partnerStatus: true,
  teamLeadId: true,
} satisfies Prisma.UserSelect;

export type TeamSummaryMember = Prisma.UserGetPayload<{
  select: typeof summaryMemberSelect;
}>;

export type TeamMemberDetail = Prisma.UserGetPayload<{
  select: typeof detailMemberSelect;
}>;

export class TeamLeaderRepository {
  async findActiveTeamMemberTiers(teamLeadId: string): Promise<Array<{ id: string; membershipTier: TeamSummaryMember["membershipTier"] }>> {
    return prisma.user.findMany({
      where: {
        teamLeadId,
        partnerStatus: { not: "RESIGNED" },
      },
      select: {
        id: true,
        membershipTier: true,
      },
    });
  }

  async findTeamMembers(teamLeadId: string): Promise<TeamSummaryMember[]> {
    return prisma.user.findMany({
      where: {
        teamLeadId,
        partnerStatus: { not: "RESIGNED" },
      },
      select: summaryMemberSelect,
      orderBy: { name: "asc" },
    });
  }

  async sumTokenLedger(userIds: string[]): Promise<number> {
    if (userIds.length === 0) return 0;

    const aggregate = await prisma.tokenLedger.aggregate({
      where: { userId: { in: userIds } },
      _sum: { amount: true },
    });
    return aggregate._sum.amount ?? 0;
  }

  async findMember(memberId: string): Promise<TeamMemberDetail | null> {
    return prisma.user.findUnique({
      where: { id: memberId },
      select: detailMemberSelect,
    });
  }

  async countTokenLedger(memberId: string): Promise<number> {
    return prisma.tokenLedger.count({ where: { userId: memberId } });
  }
}

export const teamLeaderRepository = new TeamLeaderRepository();
