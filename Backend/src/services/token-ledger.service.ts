/**
 * Backend/src/services/token-ledger.service.ts
 *
 * Token Ledger Service — Orchestrates token balance reads with caching
 * and token mutation operations.
 *
 * SOLID — SRP: manages token ledger operations and cache coordination.
 * Architecture: Service layer handles orchestration, repository handles DB.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { Prisma, TokenEventType, type TokenLedger } from "@prisma/client";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { CacheService } from "@/services/cache.service";
import { CacheKeys, CacheTTL } from "@/utils/cache/cache-key.registry";

export class TokenLedgerService {
  /**
   * Gets current token balance for a user with read-through cache.
   *
   * Requirement 3.1, 3.2, 3.3, 3.4:
   * - Uses cache key: token:balance:{userId}
   * - TTL: 300 seconds
   * - Fallback to database query if cache miss or error
   * - Records cache hit/miss metrics
   *
   * @param userId - The user ID
   * @returns Current token balance
   */
  async getTokenBalance(userId: string): Promise<number> {
    return CacheService.getWithFallback(
      CacheKeys.tokenBalance(userId),
      () => tokenLedgerRepository.getBalance(userId),
      CacheTTL.TOKEN_BALANCE
    );
  }

  /**
   * Gets token balance for a user within a transaction (authoritative read).
   *
   * Requirement 3.7, 3.8, 3.9:
   * - MUST NOT use cached balance for mutation authorization
   * - Must query DB in transaction for authoritative state
   * - Used for token debit/approval checks
   *
   * @param userId - The user ID
   * @param tx - Prisma transaction client
   * @returns Current token balance from database
   */
  async getTokenBalanceForUpdate(userId: string, tx: Prisma.TransactionClient): Promise<number> {
    return tokenLedgerRepository.getBalance(userId, tx);
  }

  /**
   * Gets paginated ledger history for a user.
   *
   * @param userId - The user ID
   * @param limit - Number of entries to return (default 20)
   * @param offset - Number of entries to skip (default 0)
   * @returns Array of token ledger entries
   */
  async getTokenHistory(userId: string, limit = 20, offset = 0): Promise<TokenLedger[]> {
    return tokenLedgerRepository.getHistory(userId, limit, offset);
  }

  /**
   * Gets token expiry summary with read-through cache.
   *
   * Requirement 4.1, 4.2, 4.3, 4.4, 4.5, 4.6:
   * - Uses cache key: token:expiry-summary:{userId}
   * - TTL: 300 seconds
   * - Returns cohorts grouped by earnedYear and expiresAt
   * - Invalidated on token credit/debit/expiry/penalty/reset
   * - Fallback to database query if cache miss or error
   *
   * @param userId - The user ID
   * @returns Array of expiry cohorts with amount and expiry date
   */
  async getTokenExpirySummary(
    userId: string
  ): Promise<Array<{ earnedYear: number | null; expiresAt: Date | null; amount: number }>> {
    return CacheService.getWithFallback(
      CacheKeys.tokenExpirySummary(userId),
      () => tokenLedgerRepository.getExpirySummary(userId),
      CacheTTL.TOKEN_EXPIRY_SUMMARY
    );
  }

  /**
   * Appends a token event to the ledger.
   *
   * This is the primary method for recording token mutations.
   * Cache invalidation happens automatically after successful append.
   *
   * @param input - Token event input
   * @param externalTx - Optional external transaction
   * @returns The created token ledger entry
   */
  async appendTokenEvent(
    input: {
      userId: string;
      eventType: TokenEventType;
      amount: number;
      referenceId?: string;
      earnedYear?: number;
      expiresAt?: Date;
      reason?: string;
      performedBy: string;
    },
    externalTx?: Prisma.TransactionClient
  ): Promise<TokenLedger> {
    return tokenLedgerRepository.appendTokenEvent(input, externalTx);
  }
}

export const tokenLedgerService = new TokenLedgerService();
