/**
 * Append-only token ledger repository.
 *
 * `amount` is the source of truth. `balanceAfter` is retained only as an
 * audit snapshot and is never used to calculate a balance.
 */

import { prisma } from "@/db/prisma";
import { Prisma, TokenEventType, type TokenLedger } from "@prisma/client";
import { DomainError } from "@/errors";
import { CacheService } from "@/services/cache.service";
import { CacheKeys } from "@/utils/cache/cache-key.registry";

export interface AppendTokenEventInput {
  userId: string;
  eventType: TokenEventType;
  amount: number;
  referenceId?: string;
  earnedYear?: number;
  expiresAt?: Date;
  reason?: string;
  performedBy: string;
  idempotencyKey?: string;
}

function expiryForEarnedYear(earnedYear: number): Date {
  // Tokens earned in year N expire on 31 December N+3.
  return new Date(Date.UTC(earnedYear + 3, 11, 31, 23, 59, 59, 999));
}

export class TokenLedgerRepository {
  async appendTokenEvent(
    input: AppendTokenEventInput,
    externalTx?: Prisma.TransactionClient,
  ): Promise<TokenLedger> {
    if (!Number.isInteger(input.amount) || input.amount === 0) {
      throw new DomainError("INVALID_TOKEN_EVENT", "Token event amount must be a non-zero integer");
    }

    const operation = async (tx: Prisma.TransactionClient): Promise<TokenLedger> => {
      if (input.idempotencyKey) {
        const existing = await tx.tokenLedger.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing) return existing;
      }

      // Serialise ledger writes for one account. The database trigger in the
      // migration also rejects UPDATE/DELETE on TokenLedger.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;

      const aggregate = await tx.tokenLedger.aggregate({
        where: { userId: input.userId },
        _sum: { amount: true },
      });
      const currentBalance = aggregate._sum.amount ?? 0;
      const balanceAfter = currentBalance + input.amount;
      if (balanceAfter < 0) {
        throw new DomainError("INSUFFICIENT_TOKENS", "Token balance cannot go negative");
      }

      const earnedYear = input.earnedYear;
      const expiresAt = input.expiresAt ??
        (input.amount > 0 && earnedYear !== undefined ? expiryForEarnedYear(earnedYear) : undefined);

      return tx.tokenLedger.create({
        data: {
          userId: input.userId,
          eventType: input.eventType,
          amount: input.amount,
          balanceAfter,
          referenceId: input.referenceId ?? null,
          earnedYear: earnedYear ?? null,
          expiresAt: expiresAt ?? null,
          reason: input.reason ?? null,
          performedBy: input.performedBy,
          idempotencyKey: input.idempotencyKey ?? null,
        },
      });
    };

    return externalTx ? operation(externalTx) : prisma.$transaction(operation);
  }

  async deductTokensFIFO(
    input: {
      userId: string;
      amount: number;
      eventType: TokenEventType;
      referenceId?: string;
      performedBy: string;
      reason?: string;
      idempotencyKey?: string;
    },
    externalTx: Prisma.TransactionClient,
  ): Promise<TokenLedger[]> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new DomainError("INVALID_TOKEN_DEDUCTION", "Token deduction must be a positive integer");
    }

    const tx = externalTx;
    const prefix = input.idempotencyKey ? `${input.idempotencyKey}:` : null;
    if (prefix) {
      const existing = await tx.tokenLedger.findMany({
        where: { userId: input.userId, idempotencyKey: { startsWith: prefix } },
        orderBy: { createdAt: "asc" },
      });
      if (existing.length > 0) return existing;
    }

    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
    const currentBalance = await this.getBalance(input.userId, tx);
    if (currentBalance < input.amount) {
      throw new DomainError("INSUFFICIENT_TOKENS", `Insufficient total balance: ${currentBalance}`);
    }

    const rawCohorts = await tx.tokenLedger.groupBy({
      by: ["earnedYear"],
      where: { userId: input.userId },
      _sum: { amount: true },
      orderBy: { earnedYear: "asc" },
    });
    const cohorts = rawCohorts
      .map((cohort) => ({ year: cohort.earnedYear, balance: cohort._sum.amount ?? 0 }))
      .filter((cohort) => cohort.balance > 0);

    let remaining = input.amount;
    let runningBalance = currentBalance;
    const entries: TokenLedger[] = [];

    for (const cohort of cohorts) {
      if (remaining <= 0) break;
      const consumed = Math.min(remaining, cohort.balance);
      const earnedYear = cohort.year ?? undefined;
      runningBalance -= consumed;
      remaining -= consumed;

      const idempotencyKey = prefix
        ? `${prefix}${earnedYear ?? "unknown"}`
        : undefined;
      const entry = await tx.tokenLedger.create({
        data: {
          userId: input.userId,
          eventType: input.eventType,
          amount: -consumed,
          balanceAfter: runningBalance,
          referenceId: input.referenceId ?? null,
          earnedYear: earnedYear ?? null,
          expiresAt: earnedYear !== undefined ? expiryForEarnedYear(earnedYear) : null,
          performedBy: input.performedBy,
          reason: `${input.reason ?? "Token deduction"} (Cohort ${earnedYear ?? "Unknown"})`,
          idempotencyKey: idempotencyKey ?? null,
        },
      });
      entries.push(entry);
    }

    if (remaining > 0) {
      throw new DomainError("LEDGER_COHORT_MISMATCH", "Token cohorts could not cover the requested deduction");
    }
    return entries;
  }

  async getBalance(
    userId: string,
    client: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<number> {
    const fetchBalance = async (): Promise<number> => {
      const aggregate = await client.tokenLedger.aggregate({
        where: { userId },
        _sum: { amount: true },
      });
      return aggregate._sum.amount ?? 0;
    };

    if (client !== prisma) return fetchBalance();
    return CacheService.getWithFallback(CacheKeys.tokenBalance(userId), fetchBalance);
  }

  async getHistory(userId: string, limit = 20, offset = 0): Promise<TokenLedger[]> {
    return prisma.tokenLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async countHistory(userId: string): Promise<number> {
    return prisma.tokenLedger.count({ where: { userId } });
  }

  async getExpirySummary(
    userId: string,
    client: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<Array<{ earnedYear: number | null; expiresAt: Date | null; amount: number }>> {
    const cohorts = await client.tokenLedger.groupBy({
      by: ["earnedYear", "expiresAt"],
      where: { userId },
      _sum: { amount: true },
      orderBy: [{ expiresAt: "asc" }, { earnedYear: "asc" }],
    });

    return cohorts
      .filter((cohort) => (cohort._sum.amount ?? 0) > 0)
      .map((cohort) => ({
        earnedYear: cohort.earnedYear,
        expiresAt: cohort.expiresAt,
        amount: cohort._sum.amount ?? 0,
      }));
  }
}

export const tokenLedgerRepository = new TokenLedgerRepository();
