/**
 * Backend/src/services/manual-adjustment.service.ts
 *
 * Provides manual token adjustment capabilities for HC Admins.
 */

import { TokenEventType, type TokenLedger } from "@prisma/client";
import { prisma } from "../db/prisma";
import { tokenLedgerRepository } from "../repositories/token-ledger.repository";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError } from "../errors/index";
import { cacheInvalidationService } from "../utils/cache/cache-invalidation.service";

export class ManualAdjustmentService {
  private async resolveUserId(identifier: string): Promise<string> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { npk: identifier },
          { email: identifier },
        ],
      },
      select: { id: true },
    });
    if (!user) throw new NotFoundError("User not found");
    return user.id;
  }

  /**
   * Adjusts tokens for a user manually.
   * Only HC Admin should be able to call this (enforced by route).
   */
  async adjustTokens(identifier: string, amount: number, reason: string, performedBy: string): Promise<TokenLedger> {
    if (amount === 0) {
      throw new ValidationError("Adjustment amount cannot be zero");
    }
    if (!reason || reason.trim() === "") {
      throw new ValidationError("A reason is required for manual adjustment");
    }

    const userId = await this.resolveUserId(identifier);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User not found");

      const currentBalance = await tokenLedgerRepository.getBalance(userId, tx);
      const balanceAfter = currentBalance + amount;

      if (balanceAfter < 0) {
        throw new ValidationError("Manual adjustment would result in a negative balance");
      }

      // 1. Append ledger event
      const entry = await tokenLedgerRepository.appendTokenEvent({
        userId,
        eventType: TokenEventType.MANUAL_ADJUSTMENT,
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

    await cacheInvalidationService.invalidateAfterCommit({ type: "TOKEN_MUTATED", userId });

    return result;
  }
}

export const manualAdjustmentService = new ManualAdjustmentService();
