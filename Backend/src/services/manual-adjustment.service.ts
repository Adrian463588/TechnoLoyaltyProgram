/**
 * Backend/src/services/manual-adjustment.service.ts
 *
 * Provides manual token adjustment capabilities for HC Admins.
 */

import { prisma } from "../db/prisma";
import { tokenLedgerRepository } from "../repositories/token-ledger.repository";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError } from "../errors/index";

export class ManualAdjustmentService {
  /**
   * Adjusts tokens for a user manually.
   * Only HC Admin should be able to call this (enforced by route).
   */
  async adjustTokens(userId: string, amount: number, reason: string, performedBy: string) {
    if (amount === 0) {
      throw new ValidationError("Adjustment amount cannot be zero");
    }
    if (!reason || reason.trim() === "") {
      throw new ValidationError("A reason is required for manual adjustment");
    }

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User not found");

      const currentBalance = await tokenLedgerRepository.getBalance(userId);
      const balanceAfter = currentBalance + amount;

      if (balanceAfter < 0) {
        throw new ValidationError("Manual adjustment would result in a negative balance");
      }

      // 1. Append ledger event
      const entry = await tokenLedgerRepository.appendTokenEvent({
        userId,
        eventType: "MANUAL_ADJUSTMENT",
        amount,
        reason,
        performedBy,
      }, tx);

      // 2. Audit
      await logAudit({
        action: "TOKEN_MANUAL_ADJUST",
        actorId: performedBy,
        targetType: "User",
        targetId: userId,
        previousValue: { balance: currentBalance },
        newValue: { balance: balanceAfter, adjustment: amount, reason },
        tx,
      });

      return entry;
    });
  }
}

export const manualAdjustmentService = new ManualAdjustmentService();
