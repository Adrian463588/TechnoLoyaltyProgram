/**
 * Backend/src/repositories/user.repository.ts
 *
 * Data access layer for User and UserLoyaltyProfile entities.
 * Services call repository methods — not Prisma directly.
 *
 * SOLID — SRP: only data access, no business logic.
 */

import type {
  PrismaClient,
  User,
  UserLoyaltyProfile,
  RoleType,
  DivisionType,
  MemberTierType,
} from "@prisma/client";

export interface TeamMemberRow {
  id: string;
  name: string;
  npk: string;
  division: { name: string; type: DivisionType } | null;
  loyaltyProfile: {
    totalTokens: number;
    currentTier: MemberTierType;
    memberStatus: string;
  } | null;
}

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async findByNpk(npk: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { npk } });
  }

  async findByNpkWithPassword(
    npk: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    return this.prisma.user.findUnique({ where: { npk } });
  }

  async upsertByNpk(
    npk: string,
    data: { name: string; email: string; role?: RoleType; divisionId?: string },
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { npk },
      create: {
        npk,
        name: data.name,
        email: data.email,
        passwordHash: "changeme",
        role: data.role ?? "MITRA",
        ...(data.divisionId && { divisionId: data.divisionId }),
      },
      update: { name: data.name },
    });
  }

  async getLoyaltyProfile(userId: string): Promise<UserLoyaltyProfile | null> {
    return this.prisma.userLoyaltyProfile.findUnique({ where: { userId } });
  }

  async getTeamId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });
    return user?.teamId ?? null;
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
    return this.prisma.user.findMany({
      where: { teamId, role: "MITRA" },
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
  }
}
