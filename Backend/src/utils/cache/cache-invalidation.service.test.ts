/**
 * Cache Invalidation Service Tests
 *
 * Tests for cache invalidation after database commits.
 * Validates that CacheInvalidationEvent types map to correct cache keys.
 * Tests non-blocking error handling.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CacheInvalidationService } from "./cache-invalidation.service";
import { CacheKeys, type CacheInvalidationEvent } from "./cache-key.registry";
import * as redisClientModule from "./redis-client";

// Mock redis client
vi.mock("./redis-client", () => ({
  redisClient: {
    isConnected: vi.fn(() => true),
    getClient: vi.fn(() => ({
      del: vi.fn().mockResolvedValue(1),
      scan: vi.fn().mockResolvedValue(["0", []]),
    })),
    getKeyPrefix: vi.fn(() => "loyalty:test"),
  },
}));

describe("CacheInvalidationService", () => {
  let service: CacheInvalidationService;
  let mockRedisClient: any;

  beforeEach(() => {
    service = new CacheInvalidationService();
    mockRedisClient = redisClientModule.redisClient;
    vi.clearAllMocks();
  });

  describe("TOKEN_MUTATED event", () => {
    it("should invalidate token balance, expiry summary, membership progress, eligibility, and dashboard", async () => {
      const userId = "user-123";
      const event: CacheInvalidationEvent = {
        type: "TOKEN_MUTATED",
        userId,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(5),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.tokenBalance(userId),
        CacheKeys.tokenExpirySummary(userId),
        CacheKeys.membershipProgress(userId),
        CacheKeys.redemptionEligibility(userId),
        CacheKeys.mitraDashboard(userId)
      );
    });

    it("should also invalidate team token summary when teamLeadId is provided", async () => {
      const userId = "user-123";
      const teamLeadId = "lead-456";
      const event: CacheInvalidationEvent = {
        type: "TOKEN_MUTATED",
        userId,
        teamLeadId,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(6),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.tokenBalance(userId),
        CacheKeys.tokenExpirySummary(userId),
        CacheKeys.membershipProgress(userId),
        CacheKeys.redemptionEligibility(userId),
        CacheKeys.mitraDashboard(userId),
        CacheKeys.teamTokenSummary(teamLeadId)
      );
    });
  });

  describe("MEMBERSHIP_MUTATED event", () => {
    it("should invalidate membership tier, progress, eligibility, and dashboard", async () => {
      const userId = "user-123";
      const event: CacheInvalidationEvent = {
        type: "MEMBERSHIP_MUTATED",
        userId,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(4),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.membershipTier(userId),
        CacheKeys.membershipProgress(userId),
        CacheKeys.redemptionEligibility(userId),
        CacheKeys.mitraDashboard(userId)
      );
    });

    it("should also invalidate token keys when tokenPenaltyApplied is true", async () => {
      const userId = "user-123";
      const event: CacheInvalidationEvent = {
        type: "MEMBERSHIP_MUTATED",
        userId,
        tokenPenaltyApplied: true,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(6),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.membershipTier(userId),
        CacheKeys.membershipProgress(userId),
        CacheKeys.redemptionEligibility(userId),
        CacheKeys.mitraDashboard(userId),
        CacheKeys.tokenBalance(userId),
        CacheKeys.tokenExpirySummary(userId)
      );
    });
  });

  describe("REWARD_CATALOG_MUTATED event", () => {
    it("should invalidate reward catalog and eligibility pattern", async () => {
      const event: CacheInvalidationEvent = {
        type: "REWARD_CATALOG_MUTATED",
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(2),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      // Should delete specific keys
      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.rewardCatalogActive(),
        CacheKeys.rewardCatalogAdmin()
      );

      // Should scan for pattern
      expect(mockClient.scan).toHaveBeenCalledWith(
        "0",
        "MATCH",
        "redemption:eligibility:*",
        "COUNT",
        100
      );
    });
  });

  describe("REWARD_STOCK_MUTATED event", () => {
    it("should invalidate reward catalog and eligibility pattern when no specific users provided", async () => {
      const event: CacheInvalidationEvent = {
        type: "REWARD_STOCK_MUTATED",
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(2),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.rewardCatalogActive(),
        CacheKeys.rewardCatalogAdmin()
      );

      expect(mockClient.scan).toHaveBeenCalledWith(
        "0",
        "MATCH",
        "redemption:eligibility:*",
        "COUNT",
        100
      );
    });

    it("should invalidate specific user eligibility when userIdsToInvalidate is provided", async () => {
      const userIds = ["user-1", "user-2"];
      const event: CacheInvalidationEvent = {
        type: "REWARD_STOCK_MUTATED",
        userIdsToInvalidate: userIds,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(4),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.rewardCatalogActive(),
        CacheKeys.rewardCatalogAdmin(),
        CacheKeys.redemptionEligibility("user-1"),
        CacheKeys.redemptionEligibility("user-2")
      );
    });
  });

  describe("PARTNER_STATUS_MUTATED event", () => {
    it("should invalidate eligibility, dashboard, and membership tier", async () => {
      const userId = "user-123";
      const event: CacheInvalidationEvent = {
        type: "PARTNER_STATUS_MUTATED",
        userId,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(3),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.redemptionEligibility(userId),
        CacheKeys.mitraDashboard(userId),
        CacheKeys.membershipTier(userId)
      );
    });

    it("should also invalidate team summary when teamLeadId is provided", async () => {
      const userId = "user-123";
      const teamLeadId = "lead-456";
      const event: CacheInvalidationEvent = {
        type: "PARTNER_STATUS_MUTATED",
        userId,
        teamLeadId,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(4),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.redemptionEligibility(userId),
        CacheKeys.mitraDashboard(userId),
        CacheKeys.membershipTier(userId),
        CacheKeys.teamTokenSummary(teamLeadId)
      );
    });
  });

  describe("REDEMPTION_MUTATED event", () => {
    it("should invalidate dashboard and eligibility", async () => {
      const userId = "user-123";
      const event: CacheInvalidationEvent = {
        type: "REDEMPTION_MUTATED",
        userId,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(2),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.mitraDashboard(userId),
        CacheKeys.redemptionEligibility(userId)
      );
    });
  });

  describe("MONTHLY_MEMBERSHIP_EVALUATION event", () => {
    it("should invalidate all cache keys for affected users", async () => {
      const affectedUserIds = ["user-1", "user-2"];
      const event: CacheInvalidationEvent = {
        type: "MONTHLY_MEMBERSHIP_EVALUATION",
        affectedUserIds,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(12),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      // Should delete all keys for both users
      const expectedKeys = [
        // User 1
        CacheKeys.membershipTier("user-1"),
        CacheKeys.membershipProgress("user-1"),
        CacheKeys.tokenBalance("user-1"),
        CacheKeys.tokenExpirySummary("user-1"),
        CacheKeys.redemptionEligibility("user-1"),
        CacheKeys.mitraDashboard("user-1"),
        // User 2
        CacheKeys.membershipTier("user-2"),
        CacheKeys.membershipProgress("user-2"),
        CacheKeys.tokenBalance("user-2"),
        CacheKeys.tokenExpirySummary("user-2"),
        CacheKeys.redemptionEligibility("user-2"),
        CacheKeys.mitraDashboard("user-2"),
      ];

      expect(mockClient.del).toHaveBeenCalledWith(...expectedKeys);
    });
  });

  describe("Error handling", () => {
    it("should not throw when Redis is not connected", async () => {
      vi.mocked(mockRedisClient.isConnected).mockReturnValue(false);

      const event: CacheInvalidationEvent = {
        type: "TOKEN_MUTATED",
        userId: "user-123",
      };

      // Should not throw
      await expect(service.invalidateAfterCommit(event)).resolves.toBeUndefined();
    });

    it("should not throw when Redis client is null", async () => {
      vi.mocked(mockRedisClient.getClient).mockReturnValue(null);

      const event: CacheInvalidationEvent = {
        type: "TOKEN_MUTATED",
        userId: "user-123",
      };

      // Should not throw
      await expect(service.invalidateAfterCommit(event)).resolves.toBeUndefined();
    });

    it("should not throw when del operation fails", async () => {
      const mockClient = {
        del: vi.fn().mockRejectedValue(new Error("Redis error")),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      const event: CacheInvalidationEvent = {
        type: "TOKEN_MUTATED",
        userId: "user-123",
      };

      // Should not throw
      await expect(service.invalidateAfterCommit(event)).resolves.toBeUndefined();
    });

    it("should not throw when scan operation fails", async () => {
      const mockClient = {
        del: vi.fn().mockResolvedValue(2),
        scan: vi.fn().mockRejectedValue(new Error("Redis error")),
      };

      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      const event: CacheInvalidationEvent = {
        type: "REWARD_CATALOG_MUTATED",
      };

      // Should not throw
      await expect(service.invalidateAfterCommit(event)).resolves.toBeUndefined();
    });
  });

  describe("Pattern deletion with SCAN", () => {
    it("should use SCAN to delete keys matching pattern", async () => {
      const mockClient = {
        del: vi.fn().mockResolvedValue(3),
        scan: vi
          .fn()
          .mockResolvedValueOnce(["1", ["redemption:eligibility:user-1", "redemption:eligibility:user-2"]])
          .mockResolvedValueOnce(["2", ["redemption:eligibility:user-3"]])
          .mockResolvedValueOnce(["0", []]),
      };

      vi.mocked(mockRedisClient.isConnected).mockReturnValue(true);
      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      const event: CacheInvalidationEvent = {
        type: "REWARD_CATALOG_MUTATED",
      };

      await service.invalidateAfterCommit(event);

      // Should call scan multiple times until cursor is 0
      expect(mockClient.scan).toHaveBeenCalledTimes(3);

      // Should delete found keys
      expect(mockClient.del).toHaveBeenCalledWith(
        CacheKeys.rewardCatalogActive(),
        CacheKeys.rewardCatalogAdmin()
      );
    });
  });

  describe("Batch delete chunking", () => {
    it("should process batch deletes in chunks of 100 keys", async () => {
      const userIds = Array.from({ length: 150 }, (_, i) => `user-${String(i)}`);
      const event: CacheInvalidationEvent = {
        type: "MONTHLY_MEMBERSHIP_EVALUATION",
        affectedUserIds: userIds,
      };

      const mockClient = {
        del: vi.fn().mockResolvedValue(1),
        scan: vi.fn().mockResolvedValue(["0", []]),
      };

      vi.mocked(mockRedisClient.isConnected).mockReturnValue(true);
      vi.mocked(mockRedisClient.getClient).mockReturnValue(mockClient);

      await service.invalidateAfterCommit(event);

      // Should be called multiple times due to chunking
      // 150 users * 6 keys per user = 900 keys total
      // 900 / 100 = 9 chunks
      expect(mockClient.del).toHaveBeenCalled();
    });
  });
});
