import { prisma } from "@/db/prisma";
import type { PartnershipStatus, Prisma } from "@prisma/client";

const mitraSelect = {
  id: true,
  name: true,
  npk: true,
  email: true,
  division: true,
  role: true,
  membershipTier: true,
  partnerStatus: true,
} satisfies Prisma.UserSelect;

const safeUserSelect = {
  id: true,
  name: true,
  npk: true,
  email: true,
  division: true,
  role: true,
  membershipTier: true,
  partnerStatus: true,
} satisfies Prisma.UserSelect;

export class AdminFoundationRepository {
  async listAuditLogs(limit: number, offset: number) {
    return Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count(),
    ]);
  }

  async listMitraUsers(limit: number, offset: number) {
    const where = { role: "MITRA" } satisfies Prisma.UserWhereInput;
    return Promise.all([
      prisma.user.findMany({
        where,
        select: mitraSelect,
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);
  }

  async findUserById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  }

  async updatePartnerStatus(userId: string, status: PartnershipStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { partnerStatus: status },
      select: safeUserSelect,
    });
  }

  async findUsersByNpk(npks: string[]) {
    if (npks.length === 0) return [];
    return prisma.user.findMany({
      where: { npk: { in: npks } },
      select: { npk: true, division: true },
    });
  }
}

export const adminFoundationRepository = new AdminFoundationRepository();
