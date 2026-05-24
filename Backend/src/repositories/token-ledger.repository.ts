/**
 * Backend/src/repositories/token-ledger.repository.ts
 *
 * Atomic, append-only repository for token ledger operations.
 *
 * SOLID — SRP: handles only ledger-specific database transactions.
 * Security — Immutability: only supports insertions, never updates or deletes.
 */

import { prisma } from "@/db/prisma";
import { Prisma, TokenEventType, type TokenLedger } from "@prisma/client";
import { DomainError } from "@/errors";
import { CacheService } from "@/services/cache.service";
import { CacheKeys } from "@/utils/cache/cache-key.registry";

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
  async appendTokenEvent(
    input: AppendTokenEventInput,
    externalTx?: Prisma.TransactionClient,
  ): Promise<TokenLedger> {
    const operation = async (tx: Prisma.TransactionClient): Promise<TokenLedger> => {
      // 1. Lock the User record to serialize transactions for this specific user.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
      
      const lastEntry = await tx.tokenLedger.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
      });

      const currentBalance = lastEntry?.balanceAfter ?? 0;
      const balanceAfter = currentBalance + input.amount;

      if (balanceAfter < 0) {
        throw new DomainError("INSUFFICIENT_TOKENS", "Token balance cannot go negative");
      }

      let expiresAt = input.expiresAt;
      if (!expiresAt && input.earnedYear && input.amount > 0) {
        // Requirement Update: Tokens earned in Year N expire on Dec 31 of Year (N+4)
        expiresAt = new Date(input.earnedYear + 4, 11, 31, 23, 59, 59);
      }

      return tx.tokenLedger.create({
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
    };

    return (externalTx ? operation(externalTx) : prisma.$transaction(operation));
  }

  /**
   * Deducts tokens using FIFO (First In First Out) across annual cohorts.
   * Splits the deduction into multiple entries if it spans multiple years.
   */
  async deductTokensFIFO(
    input: {
      userId: string;
      amount: number; // Positive number representing the deduction (will be negated)
      eventType: TokenEventType;
      referenceId?: string;
      performedBy: string;
      reason?: string;
    },
    externalTx: Prisma.TransactionClient
  ): Promise<TokenLedger[]> {
    const tx = externalTx;
    const { userId, amount: totalToDeduct, eventType, referenceId, performedBy, reason } = input;

    // 1. Ensure sufficient total balance
    const currentTotalBalance = await this.getBalance(userId, tx);
    if (currentTotalBalance < totalToDeduct) {
      throw new DomainError("INSUFFICIENT_TOKENS", `Insufficient total balance: ${currentTotalBalance}`);
    }

    // 2. Get balances per cohort (Credit - Debit per year)
    const rawCohorts = await tx.tokenLedger.groupBy({
      by: ["earnedYear"],
      where: { userId },
      _sum: { amount: true },
      orderBy: { earnedYear: "asc" },
    });

    const cohorts = rawCohorts
      .map(c => ({ year: c.earnedYear, balance: c._sum.amount ?? 0 }))
      .filter(c => c.balance > 0);

    let remainingDeduction = totalToDeduct;
    const createdEntries: TokenLedger[] = [];
    let runningBalance = currentTotalBalance;

    // 3. Deduct from oldest cohorts first
    for (const cohort of cohorts) {
      if (remainingDeduction <= 0) break;

      const consume = Math.min(remainingDeduction, cohort.balance);
      const earnedYear = cohort.year ?? undefined;
      
      // Calculate expiresAt based on original earnedYear
      const expiresAt = earnedYear ? new Date(earnedYear + 4, 11, 31, 23, 59, 59) : undefined;

      runningBalance -= consume;
      remainingDeduction -= consume;

      const entry = await tx.tokenLedger.create({
        data: {
          userId,
          eventType,
          amount: -consume,
          balanceAfter: runningBalance,
          referenceId,
          earnedYear,
          expiresAt,
          performedBy,
          reason: `${reason || "Token deduction"} (Cohort ${earnedYear || "Unknown"})`,
        }
      });
      createdEntries.push(entry);
    }

    // 4. Handle edge case: deduction exceeding cohorts (should be prevented by getBalance check but safety first)
    if (remainingDeduction > 0) {
       const entry = await tx.tokenLedger.create({
        data: {
          userId,
          eventType,
          amount: -remainingDeduction,
          balanceAfter: runningBalance - remainingDeduction,
          referenceId,
          performedBy,
          reason: `${reason || "Token deduction"} (Residual)`,
        }
      });
      createdEntries.push(entry);
    }

    return createdEntries;
  }

  /**
   * Gets current token balance for a user.
   */
  async getBalance(userId: string, client: Prisma.TransactionClient | typeof prisma = prisma): Promise<number> {
    const fetchBalance = async (): Promise<number> => {
      const lastEntry = await client.tokenLedger.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { balanceAfter: true },
      });
      return lastEntry?.balanceAfter ?? 0;
    };

    // If we're inside a transaction, bypass the cache (authoritative read)
    if (client !== prisma) {
      return fetchBalance();
    }

    // Otherwise, use read-through caching
    return CacheService.getWithFallback(
      CacheKeys.tokenBalance(userId),
      fetchBalance
    );
  }

  /**
   * Gets paginated ledger history for a user.
   */
  async getHistory(userId: string, limit = 20, offset = 0): Promise<TokenLedger[]> {
    return prisma.tokenLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Gets total number of ledger entries for a user.
   */
  async countHistory(userId: string): Promise<number> {
    return prisma.tokenLedger.count({
      where: { userId },
    });
  }

  /**
   * Gets token expiry summary grouped by earnedYear and expiresAt.
   *
   * Requirement 4.1, 4.2, 4.3, 4.4:
   * - Returns cohorts of tokens grouped by earnedYear and expiresAt
   * - Includes amount and expiry date for each cohort
   * - Used for displaying token expiry information to Mitra
   *
   * @param userId - The user ID
   * @returns Array of expiry cohorts with amount and expiry date
   */
  async getExpirySummary(
    userId: string,
    client: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Array<{ earnedYear: number | null; expiresAt: Date | null; amount: number }>> {
    const cohorts = await client.tokenLedger.groupBy({
      by: ["earnedYear", "expiresAt"],
      where: {
        userId,
      },
      _sum: {
        amount: true,
      },
      orderBy: [
        { expiresAt: "asc" },
        { earnedYear: "asc" },
      ],
    });

    return cohorts
      .filter((cohort) => cohort._sum.amount && cohort._sum.amount > 0)
      .map((cohort) => ({
        earnedYear: cohort.earnedYear,
        expiresAt: cohort.expiresAt,
        amount: cohort._sum.amount || 0,
      }));
  }
}

export const tokenLedgerRepository = new TokenLedgerRepository();
