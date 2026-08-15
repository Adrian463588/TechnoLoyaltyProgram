import { prisma } from "@/db/prisma";

export class NotificationRepository {
  async findRecentForUser(userId: string) {
    return Promise.all([
      prisma.tokenLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.redemptionRequest.findMany({
        where: { mitraId: userId },
        include: { rewardItem: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.auditLog.findMany({
        where: { targetUserId: userId, action: "TOKEN_EXPIRY_REMINDER" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, createdAt: true },
      }),
    ]);
  }
}

export const notificationRepository = new NotificationRepository();
