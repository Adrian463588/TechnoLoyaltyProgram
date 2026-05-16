import { describe, it, expect } from "vitest";
import {
  CacheTTL,
  CacheKeys,
  getTTLForKey,
  getKeysForInvalidationEvent,
  containsPattern,
  type CacheInvalidationEvent,
} from "./cache-key.registry";

/**
 * Unit tests for Cache Key Registry
 * Validates: Requirements 2.3
 */
describe("cache-key.registry", () => {
  // =============================================================================
  // CacheTTL Tests
  // =============================================================================
  describe("CacheTTL", () => {
    it("should have all TTL values within valid range (1-31536000)", () => {
      const MIN_TTL = 1;
      const MAX_TTL = 31536000;

      const ttlValues = Object.values(CacheTTL);
      for (const ttl of ttlValues) {
        expect(ttl).toBeGreaterThanOrEqual(MIN_TTL);
        expect(ttl).toBeLessThanOrEqual(MAX_TTL);
      }
    });

    it("should have TOKEN_BALANCE as 300 (5 minutes)", () => {
      expect(CacheTTL.TOKEN_BALANCE).toBe(300);
    });

    it("should have TOKEN_EXPIRY_SUMMARY as 300 (5 minutes)", () => {
      expect(CacheTTL.TOKEN_EXPIRY_SUMMARY).toBe(300);
    });

    it("should have MEMBERSHIP_TIER as 600 (10 minutes)", () => {
      expect(CacheTTL.MEMBERSHIP_TIER).toBe(600);
    });

    it("should have MEMBERSHIP_PROGRESS as 600 (10 minutes)", () => {
      expect(CacheTTL.MEMBERSHIP_PROGRESS).toBe(600);
    });

    it("should have REWARD_CATALOG_ACTIVE as 3600 (1 hour)", () => {
      expect(CacheTTL.REWARD_CATALOG_ACTIVE).toBe(3600);
    });

    it("should have REWARD_CATALOG_ADMIN as 600 (10 minutes)", () => {
      expect(CacheTTL.REWARD_CATALOG_ADMIN).toBe(600);
    });

    it("should have REDEMPTION_ELIGIBILITY as 120 (2 minutes)", () => {
      expect(CacheTTL.REDEMPTION_ELIGIBILITY).toBe(120);
    });

    it("should have TEAM_TOKEN_SUMMARY as 300 (5 minutes)", () => {
      expect(CacheTTL.TEAM_TOKEN_SUMMARY).toBe(300);
    });

    it("should have MITRA_DASHBOARD as 120 (2 minutes)", () => {
      expect(CacheTTL.MITRA_DASHBOARD).toBe(120);
    });
  });

  // =============================================================================
  // CacheKeys Tests - Key Format Validation
  // =============================================================================
  describe("CacheKeys - key format validation", () => {
    const keyFormatRegex = /^([a-z]+):([a-z-]+):(.+)$/;

    it("tokenBalance should follow format domain:subdomain:{userId}", () => {
      const key = CacheKeys.tokenBalance("user123");
      expect(key).toMatch(keyFormatRegex);
      expect(key).toBe("token:balance:user123");
    });

    it("tokenExpirySummary should follow format domain:subdomain:{userId}", () => {
      const key = CacheKeys.tokenExpirySummary("user456");
      expect(key).toMatch(keyFormatRegex);
      expect(key).toBe("token:expiry-summary:user456");
    });

    it("membershipTier should follow format domain:subdomain:{userId}", () => {
      const key = CacheKeys.membershipTier("user789");
      expect(key).toMatch(keyFormatRegex);
      expect(key).toBe("membership:tier:user789");
    });

    it("membershipProgress should follow format domain:subdomain:{userId}", () => {
      const key = CacheKeys.membershipProgress("user101");
      expect(key).toMatch(keyFormatRegex);
      expect(key).toBe("membership:progress:user101");
    });

    it("redemptionEligibility should follow format domain:subdomain:{userId}", () => {
      const key = CacheKeys.redemptionEligibility("user202");
      expect(key).toMatch(keyFormatRegex);
      expect(key).toBe("redemption:eligibility:user202");
    });

    it("teamTokenSummary should follow format domain:subdomain:{teamLeadId}", () => {
      const key = CacheKeys.teamTokenSummary("lead303");
      expect(key).toMatch(keyFormatRegex);
      expect(key).toBe("team:token-summary:lead303");
    });

    it("mitraDashboard should follow format domain:subdomain:{userId}", () => {
      const key = CacheKeys.mitraDashboard("user404");
      expect(key).toMatch(keyFormatRegex);
      expect(key).toBe("dashboard:mitra:user404");
    });

    it("rewardCatalogActive should be global key without userId", () => {
      const key = CacheKeys.rewardCatalogActive();
      expect(key).toBe("reward:catalog:active");
    });

    it("rewardCatalogAdmin should be global key without userId", () => {
      const key = CacheKeys.rewardCatalogAdmin();
      expect(key).toBe("reward:catalog:admin");
    });

    it("should handle various userId formats (UUID, email, numeric)", () => {
      expect(CacheKeys.tokenBalance("550e8400-e29b-41d4-a716-446655440000")).toBe(
        "token:balance:550e8400-e29b-41d4-a716-446655440000"
      );
      expect(CacheKeys.tokenBalance("12345")).toBe("token:balance:12345");
      expect(CacheKeys.tokenBalance("abc-def-123")).toBe("token:balance:abc-def-123");
    });
  });

  // =============================================================================
  // getTTLForKey Tests
  // =============================================================================
  describe("getTTLForKey", () => {
    it("should return correct TTL for token balance key", () => {
      expect(getTTLForKey("token:balance:user123")).toBe(CacheTTL.TOKEN_BALANCE);
    });

    it("should return correct TTL for token expiry summary key", () => {
      expect(getTTLForKey("token:expiry-summary:user123")).toBe(CacheTTL.TOKEN_EXPIRY_SUMMARY);
    });

    it("should return correct TTL for membership tier key", () => {
      expect(getTTLForKey("membership:tier:user123")).toBe(CacheTTL.MEMBERSHIP_TIER);
    });

    it("should return correct TTL for membership progress key", () => {
      expect(getTTLForKey("membership:progress:user123")).toBe(CacheTTL.MEMBERSHIP_PROGRESS);
    });

    it("should return correct TTL for active reward catalog key", () => {
      expect(getTTLForKey("reward:catalog:active")).toBe(CacheTTL.REWARD_CATALOG_ACTIVE);
    });

    it("should return correct TTL for admin reward catalog key", () => {
      expect(getTTLForKey("reward:catalog:admin")).toBe(CacheTTL.REWARD_CATALOG_ADMIN);
    });

    it("should return correct TTL for redemption eligibility key", () => {
      expect(getTTLForKey("redemption:eligibility:user123")).toBe(
        CacheTTL.REDEMPTION_ELIGIBILITY
      );
    });

    it("should return correct TTL for team token summary key", () => {
      expect(getTTLForKey("team:token-summary:lead123")).toBe(CacheTTL.TEAM_TOKEN_SUMMARY);
    });

    it("should return correct TTL for mitra dashboard key", () => {
      expect(getTTLForKey("dashboard:mitra:user123")).toBe(CacheTTL.MITRA_DASHBOARD);
    });

    it("should return default TTL for unknown key patterns", () => {
      expect(getTTLForKey("unknown:key:123")).toBe(300);
    });
  });

  // =============================================================================
  // getKeysForInvalidationEvent Tests
  // =============================================================================
  describe("getKeysForInvalidationEvent", () => {
    describe("TOKEN_MUTATED event", () => {
      it("should return correct keys for TOKEN_MUTATED without teamLeadId", () => {
        const event: CacheInvalidationEvent = {
          type: "TOKEN_MUTATED",
          userId: "user123",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("token:balance:user123");
        expect(keys).toContain("token:expiry-summary:user123");
        expect(keys).toContain("membership:progress:user123");
        expect(keys).toContain("redemption:eligibility:user123");
        expect(keys).toContain("dashboard:mitra:user123");
        expect(keys).toHaveLength(5);
      });

      it("should include team token summary when teamLeadId is provided", () => {
        const event: CacheInvalidationEvent = {
          type: "TOKEN_MUTATED",
          userId: "user123",
          teamLeadId: "lead456",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("token:balance:user123");
        expect(keys).toContain("team:token-summary:lead456");
        expect(keys).toHaveLength(6);
      });
    });

    describe("MEMBERSHIP_MUTATED event", () => {
      it("should return correct keys for MEMBERSHIP_MUTATED without penalty", () => {
        const event: CacheInvalidationEvent = {
          type: "MEMBERSHIP_MUTATED",
          userId: "user123",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("membership:tier:user123");
        expect(keys).toContain("membership:progress:user123");
        expect(keys).toContain("redemption:eligibility:user123");
        expect(keys).toContain("dashboard:mitra:user123");
        expect(keys).toHaveLength(4);
      });

      it("should include token keys when tokenPenaltyApplied is true", () => {
        const event: CacheInvalidationEvent = {
          type: "MEMBERSHIP_MUTATED",
          userId: "user123",
          tokenPenaltyApplied: true,
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("membership:tier:user123");
        expect(keys).toContain("membership:progress:user123");
        expect(keys).toContain("redemption:eligibility:user123");
        expect(keys).toContain("dashboard:mitra:user123");
        expect(keys).toContain("token:balance:user123");
        expect(keys).toContain("token:expiry-summary:user123");
        expect(keys).toHaveLength(6);
      });
    });

    describe("REWARD_CATALOG_MUTATED event", () => {
      it("should return reward catalog keys and eligibility pattern", () => {
        const event: CacheInvalidationEvent = {
          type: "REWARD_CATALOG_MUTATED",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("reward:catalog:active");
        expect(keys).toContain("reward:catalog:admin");
        expect(keys).toContain("redemption:eligibility:*");
        expect(keys).toHaveLength(3);
      });

      it("should indicate pattern in keys", () => {
        const event: CacheInvalidationEvent = {
          type: "REWARD_CATALOG_MUTATED",
        };

        const keys = getKeysForInvalidationEvent(event);
        expect(containsPattern(keys)).toBe(true);
      });
    });

    describe("REWARD_STOCK_MUTATED event", () => {
      it("should return catalog keys with specific user eligibility when userIds provided", () => {
        const event: CacheInvalidationEvent = {
          type: "REWARD_STOCK_MUTATED",
          userIdsToInvalidate: ["user1", "user2"],
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("reward:catalog:active");
        expect(keys).toContain("reward:catalog:admin");
        expect(keys).toContain("redemption:eligibility:user1");
        expect(keys).toContain("redemption:eligibility:user2");
        expect(keys).toHaveLength(4);
      });

      it("should return eligibility pattern when no userIds provided", () => {
        const event: CacheInvalidationEvent = {
          type: "REWARD_STOCK_MUTATED",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("reward:catalog:active");
        expect(keys).toContain("reward:catalog:admin");
        expect(keys).toContain("redemption:eligibility:*");
        expect(keys).toHaveLength(3);
      });

      it("should return eligibility pattern when userIds is empty array", () => {
        const event: CacheInvalidationEvent = {
          type: "REWARD_STOCK_MUTATED",
          userIdsToInvalidate: [],
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("redemption:eligibility:*");
      });
    });

    describe("PARTNER_STATUS_MUTATED event", () => {
      it("should return correct keys for PARTNER_STATUS_MUTATED without teamLeadId", () => {
        const event: CacheInvalidationEvent = {
          type: "PARTNER_STATUS_MUTATED",
          userId: "user123",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("redemption:eligibility:user123");
        expect(keys).toContain("dashboard:mitra:user123");
        expect(keys).toContain("membership:tier:user123");
        expect(keys).toHaveLength(3);
      });

      it("should include team token summary when teamLeadId is provided", () => {
        const event: CacheInvalidationEvent = {
          type: "PARTNER_STATUS_MUTATED",
          userId: "user123",
          teamLeadId: "lead456",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("redemption:eligibility:user123");
        expect(keys).toContain("dashboard:mitra:user123");
        expect(keys).toContain("membership:tier:user123");
        expect(keys).toContain("team:token-summary:lead456");
        expect(keys).toHaveLength(4);
      });
    });

    describe("REDEMPTION_MUTATED event", () => {
      it("should return correct keys for REDEMPTION_MUTATED", () => {
        const event: CacheInvalidationEvent = {
          type: "REDEMPTION_MUTATED",
          userId: "user123",
        };

        const keys = getKeysForInvalidationEvent(event);

        expect(keys).toContain("dashboard:mitra:user123");
        expect(keys).toContain("redemption:eligibility:user123");
        expect(keys).toHaveLength(2);
      });
    });

    describe("MONTHLY_MEMBERSHIP_EVALUATION event", () => {
      it("should return all keys for each affected user", () => {
        const event: CacheInvalidationEvent = {
          type: "MONTHLY_MEMBERSHIP_EVALUATION",
          affectedUserIds: ["user1", "user2"],
        };

        const keys = getKeysForInvalidationEvent(event);

        // Should have 6 keys per user (2 users * 6 keys = 12)
        expect(keys).toHaveLength(12);

        // Check user1 keys
        expect(keys).toContain("membership:tier:user1");
        expect(keys).toContain("membership:progress:user1");
        expect(keys).toContain("token:balance:user1");
        expect(keys).toContain("token:expiry-summary:user1");
        expect(keys).toContain("redemption:eligibility:user1");
        expect(keys).toContain("dashboard:mitra:user1");

        // Check user2 keys
        expect(keys).toContain("membership:tier:user2");
        expect(keys).toContain("membership:progress:user2");
        expect(keys).toContain("token:balance:user2");
        expect(keys).toContain("token:expiry-summary:user2");
        expect(keys).toContain("redemption:eligibility:user2");
        expect(keys).toContain("dashboard:mitra:user2");
      });

      it("should handle empty affectedUserIds", () => {
        const event: CacheInvalidationEvent = {
          type: "MONTHLY_MEMBERSHIP_EVALUATION",
          affectedUserIds: [],
        };

        const keys = getKeysForInvalidationEvent(event);
        expect(keys).toHaveLength(0);
      });
    });
  });

  // =============================================================================
  // containsPattern Tests
  // =============================================================================
  describe("containsPattern", () => {
    it("should return true when keys contain wildcard pattern", () => {
      const keys = ["reward:catalog:active", "redemption:eligibility:*"];
      expect(containsPattern(keys)).toBe(true);
    });

    it("should return false when keys contain no wildcard pattern", () => {
      const keys = ["token:balance:user123", "token:expiry-summary:user123"];
      expect(containsPattern(keys)).toBe(false);
    });

    it("should return false for empty array", () => {
      expect(containsPattern([])).toBe(false);
    });
  });
});