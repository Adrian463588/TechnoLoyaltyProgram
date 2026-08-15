import { NotFoundError } from "@/errors";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { adminFoundationRepository } from "@/repositories/admin-foundation.repository";
import { logAudit } from "@/services/audit.service";
import type { PartnershipStatus } from "@prisma/client";

export class AdminFoundationService {
  async listAuditLogs(limit: number, offset: number) {
    const [logs, total] = await adminFoundationRepository.listAuditLogs(limit, offset);
    return {
      total,
      limit,
      offset,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        actorId: log.actorId,
        actorName: log.actorId === "SYSTEM" ? "System" : log.actorId,
        actorNpk: log.actorId,
        targetId: log.targetEntityId,
        targetType: log.targetEntityType,
        details: log.newValue ?? log.previousValue ?? {},
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  async listMitraUsers(limit: number, offset: number) {
    const [users, total] = await adminFoundationRepository.listMitraUsers(limit, offset);
    const usersWithTokens = await Promise.all(
      users.map(async (user) => ({
        ...user,
        tokens: await tokenLedgerRepository.getBalance(user.id),
      })),
    );
    return { total, limit, offset, users: usersWithTokens };
  }

  async updateUserStatus(userId: string, status: PartnershipStatus, actorId: string) {
    const existing = await adminFoundationRepository.findUserById(userId);
    if (!existing) throw new NotFoundError("User", userId);

    const updated = await adminFoundationRepository.updatePartnerStatus(userId, status);
    await logAudit({
      action: "PARTNER_STATUS_UPDATED",
      actorId,
      targetType: "User",
      targetId: userId,
      previousValue: { name: existing.name, status: existing.partnerStatus },
      newValue: { status: updated.partnerStatus },
    });

    return updated;
  }

  async findUsersByNpk(npks: string[]) {
    return adminFoundationRepository.findUsersByNpk(npks);
  }
}

export const adminFoundationService = new AdminFoundationService();
