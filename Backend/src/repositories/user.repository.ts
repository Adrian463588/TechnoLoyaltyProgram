/**
 * Backend/src/repositories/user.repository.ts
 *
 * Data access layer for User entities.
 * Services call repository methods — not Prisma directly.
 *
 * SOLID — SRP: only data access, no business logic.
 */

import {
  PrismaClient,
  User,
  UserRole,
  DivisionType,
  MemberTierType,
} from "@prisma/client";

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async upsertByEmail(
    email: string,
    data: { name: string; division: DivisionType; role?: UserRole },
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: data.name,
        passwordHash: "changeme",
        role: data.role ?? "MITRA",
        division: data.division,
      },
      update: { name: data.name },
    });
  }

  async getTeamLeadId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamLeadId: true },
    });
    return user?.teamLeadId ?? null;
  }

  async getSubordinates(teamLeadId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { teamLeadId },
    });
  }
}
