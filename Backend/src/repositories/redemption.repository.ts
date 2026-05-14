/**
 * Backend/src/repositories/redemption.repository.ts
 *
 * Data access layer for RewardRedemptionRequest entities.
 */

import type {
  PrismaClient,
  RewardRedemptionRequest,
  RedemptionStatus,
} from "@prisma/client";

export type RedemptionWithRelations = RewardRedemptionRequest & {
  user: { id: string; name: string; npk: string };
  item: { id: string; name: string; tokenCost: number; imageUrl: string | null };
  history: Array<{
    id: string;
    toStatus: RedemptionStatus;
    actorId: string;
    reason: string | null;
    createdAt: Date;
  }>;
};

export class RedemptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<RedemptionWithRelations[]> {
    return this.prisma.rewardRedemptionRequest.findMany({
      include: {
        user: { select: { id: true, name: true, npk: true } },
        item: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(requestId: string): Promise<RedemptionWithRelations | null> {
    return this.prisma.rewardRedemptionRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, npk: true } },
        item: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async findByUserId(userId: string): Promise<RedemptionWithRelations[]> {
    return this.prisma.rewardRedemptionRequest.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, npk: true } },
        item: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    userId: string;
    rewardItemId: string;
    tokensSpent: number;
    status: RedemptionStatus;
  }): Promise<RewardRedemptionRequest> {
    return this.prisma.rewardRedemptionRequest.create({ data });
  }
}
