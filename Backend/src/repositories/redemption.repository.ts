/**
 * Backend/src/repositories/redemption.repository.ts
 *
 * Data access layer for RedemptionRequest entities.
 */

import {
  PrismaClient,
  RedemptionRequest,
  RedemptionStatus,
} from "@prisma/client";

export class RedemptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.redemptionRequest.findMany({
      include: {
        mitra: { select: { id: true, name: true, email: true } },
        rewardItem: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(requestId: string) {
    return this.prisma.redemptionRequest.findUnique({
      where: { id: requestId },
      include: {
        mitra: { select: { id: true, name: true, email: true } },
        rewardItem: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async findByMitraId(mitraId: string) {
    return this.prisma.redemptionRequest.findMany({
      where: { mitraId },
      include: {
        rewardItem: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
