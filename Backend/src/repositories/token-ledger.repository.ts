/**
 * Backend/src/repositories/token-ledger.repository.ts
 *
 * Atomic, append-only repository for token ledger operations.
 *
 * SOLID — SRP: handles only ledger-specific database transactions.
 * Security — Immutability: only supports insertions, never updates or deletes.
 */

import { prisma } from "@/db/prisma";
import { TokenEventType } from "@prisma/client";
import { DomainError } from "@/errors";

export interface AppendTokenEventInput {
  userId:      string;
  eventType:   TokenEventType;
  amount:      number;
  referenceId?: string;
  earnedYear?:  number;
  expiresAt?:   Date;
  reason?:      string;
  performedBy: string;
}

export class TokenLedgerRepository {
  /**
   * Appends a new event to the ledger and computes the balanceAfter snapshot.
   * Uses a database transaction and SELECT FOR UPDATE to prevent race conditions.
   *
   * @throws DomainError if balance becomes negative.
   */
  async appendTokenEvent(input: AppendTokenEventInput, externalTx?: any) {
    const operation = async (tx: any) => {
      // 1. Lock the User record to serialize transactions for this specific user.
      // This prevents race conditions when appending ledger entries concurrently.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
      
      // 2. Fetch current balance
      const lastEntry = await tx.tokenLedger.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = lastEntry?.balanceAfter ?? 0;
      const balanceAfter = currentBalance + input.amount;

      if (balanceAfter < 0) {
        throw new DomainError("INSUFFICIENT_TOKENS", "Token balance cannot go negative");
      }

      // Calculate expiry if not provided but earnedYear is present
      let expiresAt = input.expiresAt;
      if (!expiresAt && input.earnedYear && input.amount > 0) {
        expiresAt = new Date(input.earnedYear + 3, 11, 31, 23, 59, 59);
      }

      // 2. Insert new ledger row
      const newEntry = await tx.tokenLedger.create({
        data: {
          userId:      input.userId,
          eventType:   input.eventType,
          amount:      input.amount,
          balanceAfter,
          referenceId: input.referenceId ?? null,
          earnedYear:  input.earnedYear ?? null,
          expiresAt:   expiresAt ?? null,
          reason:      input.reason ?? null,
          performedBy: input.performedBy,
        },
      });

      return newEntry;
    };

    return externalTx ? operation(externalTx) : prisma.$transaction(operation);
  }

  /**
   * Gets current token balance for a user.
   */
  async getBalance(userId: string): Promise<number> {
    const lastEntry = await prisma.tokenLedger.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    });
    return lastEntry?.balanceAfter ?? 0;
  }

  /**
   * Gets paginated ledger history for a user.
   */
  async getHistory(userId: string, limit = 20, offset = 0) {
    return prisma.tokenLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}

export const tokenLedgerRepository = new TokenLedgerRepository();
