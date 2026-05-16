/**
 * Cache Key Registry
 *
 * Defines TTL constants and factory functions for all cache keys.
 * Keys follow safe format: domain:subdomain:{userId} - never include email, KTP, NPWP.
 *
 * Requirements: 3.3, 4.1, 5.3, 5.4, 6.1, 7.1
 */

/**
 * Cache TTL values in seconds for each domain
 */
export const CacheTTL = {
  /** Token balance cache - 5 minutes */
  TOKEN_BALANCE: 300,
  /** Token expiry summary cache - 5 minutes */
  TOKEN_EXPIRY_SUMMARY: 300,
  /** Membership tier cache - 10 minutes */
  MEMBERSHIP_TIER: 600,
  /** Membership progress cache - 10 minutes */
  MEMBERSHIP_PROGRESS: 600,
  /** Active reward catalog cache - 1 hour */
  REWARD_CATALOG_ACTIVE: 3600,
  /** Admin reward catalog cache - 10 minutes */
  REWARD_CATALOG_ADMIN: 600,
  /** Redemption eligibility preview cache - 2 minutes */
  REDEMPTION_ELIGIBILITY: 120,
  /** Team token summary cache - 5 minutes */
  TEAM_TOKEN_SUMMARY: 300,
  /** Mitra dashboard cache - 2 minutes */
  MITRA_DASHBOARD: 120,
} as const;

/**
 * Cache key type
 */
export type CacheKey = string;

/**
 * Cache key pattern type (supports wildcards for deleteByPattern)
 */
export type CacheKeyPattern = string;

/**
 * CacheKeys factory functions
 * Safe key format: domain:subdomain:{userId}
 * Never include email, KTP, NPWP, or any sensitive PII in keys
 */
export const CacheKeys = {
  /**
   * Token balance key
   * Format: token:balance:{userId}
   */
  tokenBalance: (userId: string): CacheKey => `token:balance:${userId}`,

  /**
   * Token expiry summary key
   * Format: token:expiry-summary:{userId}
   */
  tokenExpirySummary: (userId: string): CacheKey => `token:expiry-summary:${userId}`,

  /**
   * Membership tier key
   * Format: membership:tier:{userId}
   */
  membershipTier: (userId: string): CacheKey => `membership:tier:${userId}`,

  /**
   * Membership progress key
   * Format: membership:progress:{userId}
   */
  membershipProgress: (userId: string): CacheKey => `membership:progress:${userId}`,

  /**
   * Active reward catalog key (global, no userId)
   * Format: reward:catalog:active
   */
  rewardCatalogActive: (): CacheKey => `reward:catalog:active`,

  /**
   * Admin reward catalog key (global, no userId)
   * Format: reward:catalog:admin
   */
  rewardCatalogAdmin: (): CacheKey => `reward:catalog:admin`,

  /**
   * Redemption eligibility preview key
   * Format: redemption:eligibility:{userId}
   */
  redemptionEligibility: (userId: string): CacheKey => `redemption:eligibility:${userId}`,

  /**
   * Team token summary key
   * Format: team:token-summary:{teamLeadId}
   */
  teamTokenSummary: (teamLeadId: string): CacheKey => `team:token-summary:${teamLeadId}`,

  /**
   * Mitra dashboard key
   * Format: dashboard:mitra:{userId}
   */
  mitraDashboard: (userId: string): CacheKey => `dashboard:mitra:${userId}`,
} as const;

/**
 * Get TTL for a given cache key type
 */
export function getTTLForKey(key: CacheKey): number {
  if (key.startsWith("token:balance:")) return CacheTTL.TOKEN_BALANCE;
  if (key.startsWith("token:expiry-summary:")) return CacheTTL.TOKEN_EXPIRY_SUMMARY;
  if (key.startsWith("membership:tier:")) return CacheTTL.MEMBERSHIP_TIER;
  if (key.startsWith("membership:progress:")) return CacheTTL.MEMBERSHIP_PROGRESS;
  if (key === "reward:catalog:active") return CacheTTL.REWARD_CATALOG_ACTIVE;
  if (key === "reward:catalog:admin") return CacheTTL.REWARD_CATALOG_ADMIN;
  if (key.startsWith("redemption:eligibility:")) return CacheTTL.REDEMPTION_ELIGIBILITY;
  if (key.startsWith("team:token-summary:")) return CacheTTL.TEAM_TOKEN_SUMMARY;
  if (key.startsWith("dashboard:mitra:")) return CacheTTL.MITRA_DASHBOARD;

  // Default TTL if key doesn't match known patterns
  return 300;
}

/**
 * Type-safe cache key generators
 */
export type CacheKeyGenerators = typeof CacheKeys;

/**
 * TTL constants type
 */
export type CacheTTLValues = typeof CacheTTL;

// =============================================================================
// Cache Invalidation Events
// =============================================================================

/**
 * Cache invalidation event types
 * These events trigger cache invalidation after successful database commits
 */
export type CacheInvalidationEvent =
  | { type: "TOKEN_MUTATED"; userId: string; teamLeadId?: string }
  | { type: "MEMBERSHIP_MUTATED"; userId: string; tokenPenaltyApplied?: boolean }
  | { type: "REWARD_CATALOG_MUTATED" }
  | { type: "REWARD_STOCK_MUTATED"; userIdsToInvalidate?: string[] }
  | { type: "PARTNER_STATUS_MUTATED"; userId: string; teamLeadId?: string }
  | { type: "REDEMPTION_MUTATED"; userId: string }
  | { type: "MONTHLY_MEMBERSHIP_EVALUATION"; affectedUserIds: string[] };

/**
 * Get cache keys affected by a cache invalidation event
 *
 * @param event - The cache invalidation event
 * @returns Array of cache keys to invalidate
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function getKeysForInvalidationEvent(event: CacheInvalidationEvent): CacheKey[] {
  switch (event.type) {
    case "TOKEN_MUTATED": {
      const keys: CacheKey[] = [
        CacheKeys.tokenBalance(event.userId),
        CacheKeys.tokenExpirySummary(event.userId),
        CacheKeys.membershipProgress(event.userId),
        CacheKeys.redemptionEligibility(event.userId),
        CacheKeys.mitraDashboard(event.userId),
      ];

      // Invalidate team token summary if teamLeadId is provided
      if (event.teamLeadId) {
        keys.push(CacheKeys.teamTokenSummary(event.teamLeadId));
      }

      return keys;
    }

    case "MEMBERSHIP_MUTATED": {
      const keys: CacheKey[] = [
        CacheKeys.membershipTier(event.userId),
        CacheKeys.membershipProgress(event.userId),
        CacheKeys.redemptionEligibility(event.userId),
        CacheKeys.mitraDashboard(event.userId),
      ];

      // Also invalidate token keys if penalty/reset was applied
      if (event.tokenPenaltyApplied) {
        keys.push(CacheKeys.tokenBalance(event.userId));
        keys.push(CacheKeys.tokenExpirySummary(event.userId));
      }

      return keys;
    }

    case "REWARD_CATALOG_MUTATED": {
      return [
        CacheKeys.rewardCatalogActive(),
        CacheKeys.rewardCatalogAdmin(),
        // Use pattern for eligibility since any reward change affects all users
        "redemption:eligibility:*",
      ];
    }

    case "REWARD_STOCK_MUTATED": {
      const keys: CacheKey[] = [
        CacheKeys.rewardCatalogActive(),
        CacheKeys.rewardCatalogAdmin(),
      ];

      // Invalidate specific user eligibility if known
      if (event.userIdsToInvalidate && event.userIdsToInvalidate.length > 0) {
        for (const userId of event.userIdsToInvalidate) {
          keys.push(CacheKeys.redemptionEligibility(userId));
        }
      } else {
        // Otherwise invalidate all eligibility previews
        keys.push("redemption:eligibility:*");
      }

      return keys;
    }

    case "PARTNER_STATUS_MUTATED": {
      const keys: CacheKey[] = [
        CacheKeys.redemptionEligibility(event.userId),
        CacheKeys.mitraDashboard(event.userId),
        CacheKeys.membershipTier(event.userId),
      ];

      // Also invalidate team summary if teamLeadId is provided
      if (event.teamLeadId) {
        keys.push(CacheKeys.teamTokenSummary(event.teamLeadId));
      }

      return keys;
    }

    case "REDEMPTION_MUTATED": {
      return [
        CacheKeys.mitraDashboard(event.userId),
        CacheKeys.redemptionEligibility(event.userId),
      ];
    }

    case "MONTHLY_MEMBERSHIP_EVALUATION": {
      const keys: CacheKey[] = [];

      for (const userId of event.affectedUserIds) {
        keys.push(CacheKeys.membershipTier(userId));
        keys.push(CacheKeys.membershipProgress(userId));
        keys.push(CacheKeys.tokenBalance(userId));
        keys.push(CacheKeys.tokenExpirySummary(userId));
        keys.push(CacheKeys.redemptionEligibility(userId));
        keys.push(CacheKeys.mitraDashboard(userId));
      }

      return keys;
    }

    default:
      // Type-safe exhaustive check - should never reach here
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = event;
      return [];
  }
}

/**
 * Check if the returned keys contain a pattern (wildcard) vs specific keys
 */
export function containsPattern(keys: CacheKey[]): boolean {
  return keys.some((key) => key.includes("*"));
}