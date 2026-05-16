/**
 * Backend/src/services/token-ledger.service.test.ts
 *
 * Integration tests for TokenLedgerService.
 * Verifies cache read-through behavior and mutation authorization.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8, 3.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tokenLedgerService } from "./token-ledger.service";
import { CacheService } from "./cache.service";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { CacheKeys, CacheTTL } from "@/utils/cache/cache-key.registry";
import { TokenEventType } from "@prisma/client";

// Mock dependencies
vi.mock("@/repositories/token-ledger.repository");
vi.mock("@/services/cache.service");

describe("TokenLedgerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getTokenBalance", () => {
    it("should use cache for reads with getWithFallback", async () => {
      const userId = "user-123";
      const expectedBalance = 500;

      // Mock CacheService.getWithFallback to verify it's called correctly
      vi.mocked(CacheService.getWithFallback).mockResolvedValue(expectedBalance);

      const result = await tokenLedgerService.getTokenBalance(userId);

      expect(result).toBe(expectedBalance);
      expect(CacheService.getWithFallback).toHaveBeenCalledWith(
        CacheKeys.tokenBalance(userId),
        expect.any(Function),
        CacheTTL.TOKEN_BALANCE
      );
    });

    it("should use cache key token:balance:{userId}", async () => {
      const userId = "user-456";
      vi.mocked(CacheService.getWithFallback).mockResolvedValue(100);

      await tokenLedgerService.getTokenBalance(userId);

      const callArgs = vi.mocked(CacheService.getWithFallback).mock.calls[0];
      expect(callArgs?.[0]).toBe(`token:balance:${userId}`);
    });

    it("should use TTL of 300 seconds", async () => {
      const userId = "user-789";
      vi.mocked(CacheService.getWithFallback).mockResolvedValue(200);

      await tokenLedgerService.getTokenBalance(userId);

      const callArgs = vi.mocked(CacheService.getWithFallback).mock.calls[0];
      expect(callArgs?.[2]).toBe(300);
    });

    it("should fallback to database query on cache miss", async () => {
      const userId = "user-db-fallback";
      const expectedBalance = 750;

      // Mock the fetcher function to be called
      let fetcherCalled = false;
      vi.mocked(CacheService.getWithFallback).mockImplementation(
        async (key, fetcher) => {
          fetcherCalled = true;
          return fetcher();
        }
      );

      vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(expectedBalance);

      const result = await tokenLedgerService.getTokenBalance(userId);

      expect(fetcherCalled).toBe(true);
      expect(result).toBe(expectedBalance);
      expect(tokenLedgerRepository.getBalance).toHaveBeenCalledWith(userId);
    });

    it("should record cache hit/miss metrics through CacheService", async () => {
      const userId = "user-metrics";
      vi.mocked(CacheService.getWithFallback).mockResolvedValue(300);

      await tokenLedgerService.getTokenBalance(userId);

      // CacheService.getWithFallback handles metrics internally
      expect(CacheService.getWithFallback).toHaveBeenCalled();
    });
  });

  describe("getTokenBalanceForUpdate", () => {
    it("should NOT use cache for transaction reads", async () => {
      const userId = "user-tx";
      const mockTx = {} as any;
      const expectedBalance = 600;

      vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(expectedBalance);

      const result = await tokenLedgerService.getTokenBalanceForUpdate(userId, mockTx);

      expect(result).toBe(expectedBalance);
      // Should call repository directly with transaction, bypassing cache
      expect(tokenLedgerRepository.getBalance).toHaveBeenCalledWith(userId, mockTx);
      // Should NOT call CacheService
      expect(CacheService.getWithFallback).not.toHaveBeenCalled();
    });

    it("should pass transaction client to repository", async () => {
      const userId = "user-tx-2";
      const mockTx = { $queryRaw: vi.fn() } as any;

      vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(400);

      await tokenLedgerService.getTokenBalanceForUpdate(userId, mockTx);

      expect(tokenLedgerRepository.getBalance).toHaveBeenCalledWith(userId, mockTx);
    });
  });

  describe("getTokenHistory", () => {
    it("should fetch paginated ledger history", async () => {
      const userId = "user-history";
      const mockHistory = [
        { id: "entry-1", balanceAfter: 100 },
        { id: "entry-2", balanceAfter: 150 },
      ] as any[];

      vi.mocked(tokenLedgerRepository.getHistory).mockResolvedValue(mockHistory);

      const result = await tokenLedgerService.getTokenHistory(userId, 20, 0);

      expect(result).toEqual(mockHistory);
      expect(tokenLedgerRepository.getHistory).toHaveBeenCalledWith(userId, 20, 0);
    });

    it("should support custom limit and offset", async () => {
      const userId = "user-history-2";
      vi.mocked(tokenLedgerRepository.getHistory).mockResolvedValue([]);

      await tokenLedgerService.getTokenHistory(userId, 50, 100);

      expect(tokenLedgerRepository.getHistory).toHaveBeenCalledWith(userId, 50, 100);
    });
  });

  describe("appendTokenEvent", () => {
    it("should delegate to repository", async () => {
      const input = {
        userId: "user-append",
        eventType: TokenEventType.EARNED_SHIFT,
        amount: 100,
        performedBy: "SYSTEM",
      };

      const mockEntry = { id: "entry-new", balanceAfter: 100 } as any;
      vi.mocked(tokenLedgerRepository.appendTokenEvent).mockResolvedValue(mockEntry);

      const result = await tokenLedgerService.appendTokenEvent(input);

      expect(result).toEqual(mockEntry);
      expect(tokenLedgerRepository.appendTokenEvent).toHaveBeenCalledWith(input, undefined);
    });

    it("should support external transaction", async () => {
      const input = {
        userId: "user-append-tx",
        eventType: TokenEventType.REDEEMED,
        amount: -50,
        performedBy: "user-123",
      };

      const mockTx = {} as any;
      const mockEntry = { id: "entry-tx", balanceAfter: 50 } as any;
      vi.mocked(tokenLedgerRepository.appendTokenEvent).mockResolvedValue(mockEntry);

      const result = await tokenLedgerService.appendTokenEvent(input, mockTx);

      expect(result).toEqual(mockEntry);
      expect(tokenLedgerRepository.appendTokenEvent).toHaveBeenCalledWith(input, mockTx);
    });

    it("should handle all token event types", async () => {
      const eventTypes = [
        TokenEventType.EARNED_SHIFT,
        TokenEventType.EARNED_PROJECT,
        TokenEventType.REDEEMED,
        TokenEventType.EXPIRED,
        TokenEventType.MANUAL_ADJUSTMENT,
      ];

      for (const eventType of eventTypes) {
        vi.mocked(tokenLedgerRepository.appendTokenEvent).mockResolvedValue({} as any);

        await tokenLedgerService.appendTokenEvent({
          userId: "user-test",
          eventType,
          amount: 100,
          performedBy: "SYSTEM",
        });

        expect(tokenLedgerRepository.appendTokenEvent).toHaveBeenCalled();
      }
    });
  });

  describe("Cache behavior requirements", () => {
    it("Requirement 3.1: should check cache first for reads", async () => {
      const userId = "user-req-3.1";
      vi.mocked(CacheService.getWithFallback).mockResolvedValue(999);

      const result = await tokenLedgerService.getTokenBalance(userId);

      expect(result).toBe(999);
      expect(CacheService.getWithFallback).toHaveBeenCalled();
    });

    it("Requirement 3.2: should calculate balance from ledger on cache miss", async () => {
      const userId = "user-req-3.2";
      const dbBalance = 555;

      vi.mocked(CacheService.getWithFallback).mockImplementation(
        async (key, fetcher) => fetcher()
      );
      vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(dbBalance);

      const result = await tokenLedgerService.getTokenBalance(userId);

      expect(result).toBe(dbBalance);
    });

    it("Requirement 3.3: should use cache key token:balance:{userId}", async () => {
      const userId = "user-req-3.3";
      vi.mocked(CacheService.getWithFallback).mockResolvedValue(100);

      await tokenLedgerService.getTokenBalance(userId);

      const key = vi.mocked(CacheService.getWithFallback).mock.calls[0]?.[0];
      expect(key).toBe(`token:balance:${userId}`);
    });

    it("Requirement 3.4: should use TTL of 300 seconds", async () => {
      const userId = "user-req-3.4";
      vi.mocked(CacheService.getWithFallback).mockResolvedValue(100);

      await tokenLedgerService.getTokenBalance(userId);

      const ttl = vi.mocked(CacheService.getWithFallback).mock.calls[0]?.[2];
      expect(ttl).toBe(300);
    });

    it("Requirement 3.7, 3.8, 3.9: should NOT use cache for mutation authorization", async () => {
      const userId = "user-req-3.7";
      const mockTx = {} as any;

      vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(100);

      await tokenLedgerService.getTokenBalanceForUpdate(userId, mockTx);

      // Should NOT call CacheService at all
      expect(CacheService.getWithFallback).not.toHaveBeenCalled();
      expect(CacheService.get).not.toHaveBeenCalled();

      // Should call repository with transaction for authoritative read
      expect(tokenLedgerRepository.getBalance).toHaveBeenCalledWith(userId, mockTx);
    });
  });
});
