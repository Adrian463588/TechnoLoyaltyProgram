/**
 * Backend/src/repositories/period.repository.ts
 *
 * Data access layer for EarningPeriod entities.
 * Used by services that need to validate or attach period IDs.
 */

import type { PrismaClient, EarningPeriod } from "@prisma/client";

export class PeriodRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActive(): Promise<EarningPeriod | null> {
    return this.prisma.earningPeriod.findFirst({
      where: { isActive: true },
    });
  }

  async findById(periodId: string): Promise<EarningPeriod | null> {
    return this.prisma.earningPeriod.findUnique({
      where: { id: periodId },
    });
  }

  async findAll(): Promise<EarningPeriod[]> {
    return this.prisma.earningPeriod.findMany({
      orderBy: { startDate: "desc" },
    });
  }
}
