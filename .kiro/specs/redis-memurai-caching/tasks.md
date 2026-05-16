# Implementation Plan: Redis/Memurai Caching Layer

## Overview

Implement a Redis/Memurai caching layer for the Loyalty Program Portal to improve read performance while preserving Sprint 2.1 correctness rules. The caching layer must fail gracefully to database-only mode when Redis is unavailable.

## Tasks

- [x] 1. Set up cache module structure
  - [x] 1.1 Create `Backend/src/utils/cache/` directory structure
  - [x] 1.2 Create `index.ts` barrel export file
  - _Requirements: 2.1, 2.2_

- [x] 2. Implement cache configuration
  - [x] 2.1 Create `cache.config.ts` with Zod schema validation
    - Validate REDIS_ENABLED, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USE_TLS, REDIS_CONNECTION_TIMEOUT, REDIS_MAX_RETRIES, REDIS_KEY_PREFIX, REDIS_DEFAULT_TTL
    - Use environment variables with safe defaults
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 2.2 Write unit tests for cache config
    - Test validation of valid configs
    - Test rejection of invalid host, port, TTL
    - _Requirements: 1.3_

- [x] 3. Implement Redis client singleton
  - [x] 3.1 Create `redis-client.ts` with IRedisClient interface
    - Single shared Redis client for backend process
    - Support enabled/disabled modes
    - Handle connection/disconnection
    - Exponential backoff retry logic
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_

  - [x] 3.2 Handle connection failures gracefully
    - Log CACHE001 on connection failure
    - Continue in database-only mode when Redis unavailable
    - _Requirements: 1.4_

  - [x] 3.3 Write unit tests for Redis client
    - Test connect/disconnect behavior
    - Test isConnected/isEnabled states
    - _Requirements: 1.5_

- [x] 4. Implement cache key registry
  - [x] 4.1 Create `cache-key.registry.ts`
    - Define CacheTTL constants for each domain
    - Define CacheKeys factory functions
    - Use safe key format: `token:balance:{userId}`, etc.
    - Never include email, KTP, NPWP in keys
    - _Requirements: 3.3, 4.1, 5.3, 5.4, 6.1, 7.1_

  - [x] 4.2 Define cache invalidation events
    - Create CacheInvalidationEvent union type
    - Map events to affected cache keys
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 4.3 Write unit tests for cache key registry
    - Test TTL constants are within valid range
    - Test key generation follows format
    - _Requirements: 2.3_

- [x] 5. Implement cache service with graceful fallback
  - [x] 5.1 Create `cache.service.ts` with ICacheService interface
    - Implement get, set, delete, exists, deleteBatch, deleteByPattern, getWithFallback
    - JSON serialization/deserialization
    - Non-blocking error handling (log and continue)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 5.2 Implement getWithFallback pattern
    - Try cache first, fallback to fetcher on miss/error
    - Record hit/miss metrics
    - Write to cache after successful fetch
    - _Requirements: 2.1, 2.5_

  - [x] 5.3 Create `cache-errors.ts` with error codes
    - CACHE001-CACHE008 error codes
    - _Requirements: 6.1_

  - [x] 5.4 Write unit tests for cache service
    - Test JSON serialization/deserialization
    - Test TTL validation (min 1, max 31536000)
    - Test getWithFallback behavior
    - Test deleteBatch max 100 keys
    - _Requirements: 2.3, 2.6, 2.7_

- [x] 6. Implement cache metrics
  - [x] 6.1 Create `cache-metrics.ts`
    - Track hit rate, miss rate, response time, error count
    - 1-minute rolling window
    - Safe JSON log output (no sensitive data)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 6.2 Write unit tests for cache metrics
    - Test rolling window calculation
    - Test safe log format (no sensitive data)
    - _Requirements: 9.5, 9.6, 9.7_

- [x] 7. Implement cache invalidation service
  - [x] 7.1 Create `cache-invalidation.service.ts` or integrate into CacheService
    - Map CacheInvalidationEvent to affected keys
    - Implement invalidation for each event type
    - Non-blocking (log CACHE007 on failure, continue)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 7.2 Write unit tests for cache invalidation
    - Test TOKEN_MUTATED invalidates correct keys
    - Test MEMBERSHIP_MUTATED invalidates correct keys
    - Test REWARD_CATALOG_MUTATED invalidates correct keys
    - Test partner status and redemption events
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8. Checkpoint - Core cache module complete
  - Verify all core cache utilities are implemented and unit tested
  - Ensure all unit tests pass

- [x] 9. Integrate cache into Token Ledger Service
  - [x] 9.1 Update `token-ledger.service.ts` to use cache for reads
    - Add cache read for getTokenBalance with getWithFallback
    - Use token:balance:{userId} key, 300s TTL
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 9.2 Add post-commit invalidation to token mutations
    - After credit, debit, expiry, manual adjustment, penalty
    - Invalidate token balance, expiry summary, eligibility, dashboard
    - _Requirements: 3.5, 3.6_

  - [x] 9.3 Ensure mutations use authoritative DB state
    - Token balance for approval/debit must query PostgreSQL in transaction
    - Never use cached balance for mutation authorization
    - _Requirements: 3.7, 3.8, 3.9_

  - [x] 9.4 Implement token expiry summary caching
    - Cache key: token:expiry-summary:{userId}, 300s TTL
    - Invalidate on token credit/debit/expiry/penalty/reset
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 9.5 Write integration tests for token cache
    - Test cache miss → DB → cache flow
    - Test invalidation after token mutation
    - Test Redis unavailable → database fallback
    - _Requirements: 3.9_

- [x] 10. Integrate cache into Membership Service
  - [x] 10.1 Update `membership.service.ts` to use cache
    - Cache membership tier with key membership:tier:{userId}
    - Cache membership progress with key membership:progress:{userId}
    - 600s TTL for both
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.2 Add post-commit invalidation for membership mutations
    - After upgrade, downgrade, reset, manual correction, division change
    - Invalidate membership tier, progress, eligibility
    - _Requirements: 5.6, 5.7_

  - [x] 10.3 Handle token penalty/reset invalidation
    - If downgrade/reset penalty applied, also invalidate token balance
    - _Requirements: 5.6_

  - [x] 10.4 Write integration tests for membership cache
    - Test cache miss → DB → cache flow
    - Test invalidation after membership mutation
    - _Requirements: 5.6_

- [x] 11. Integrate cache into Reward Catalog Service
  - [x] 11.1 Update `reward-catalog.service.ts` to use cache
    - Cache active catalog with key reward:catalog:active (3600s TTL)
    - Cache admin catalog with key reward:catalog:admin (600s TTL)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.2 Add post-commit invalidation for reward mutations
    - After create, update, deactivate, restock, stock deduction
    - Invalidate reward catalog and eligibility previews
    - _Requirements: 6.4_

  - [x] 11.3 Ensure redemption approval validates against DB
    - Never use cached catalog for final approval
    - Re-validate active status, stock from PostgreSQL
    - _Requirements: 6.5_

  - [x] 11.4 Write integration tests for reward catalog cache
    - Test cache miss → DB → cache flow
    - Test invalidation after reward mutation
    - _Requirements: 6.4_

- [x] 12. Implement redemption eligibility preview cache
  - [x] 12.1 Add eligibility preview cache to redemption service
    - Cache key: redemption:eligibility:{userId}
    - TTL: 120 seconds
    - Include reason labels
    - _Requirements: 7.1, 7.2_

  - [x] 12.2 Invalidate eligibility on related mutations
    - Invalidate on token, partner status, reward, redemption window changes
    - _Requirements: 7.3_

  - [x] 12.3 Mark eligibility as UX-only
    - Document that final redemption uses server-side validation
    - _Requirements: 7.4, 7.5_

  - [x] 12.4 Write integration tests for eligibility cache
    - Test cache invalidation on token mutation
    - Test cache invalidation on partner status change
    - _Requirements: 7.3_

- [x] 13. Integrate cache into Team Leader dashboard
  - [x] 13.1 Add team token summary caching
    - Cache key: team:token-summary:{teamLeadId}, 300s TTL
    - _Requirements: 8.4_

  - [x] 13.2 Add Mitra dashboard caching
    - Cache key: dashboard:mitra:{userId}, 120s TTL
    - _Requirements: 8.4_

  - [x] 13.3 Write integration tests for dashboard cache
    - Test invalidation on token mutation
    - Test invalidation on partner status change
    - _Requirements: 8.4_

- [x] 14. Update environment configuration
  - [x] 14.1 Update `.env.example` with Redis configuration
    - Add all required Redis environment variables
    - Include production example with TLS
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 15. Checkpoint - Service integration complete
  - Verify all service integrations are implemented and integration tested
  - Ensure all integration tests pass

- [x] 16. Add smoke tests
  - [x] 16.1 Create smoke tests for cache module
    - Test Redis connection
    - Test cache set/get/delete
    - Test fallback to database-only mode
    - Test invalidation after token mutation
    - Test invalidation after reward mutation
    - _Requirements: 10.7_

- [x] 17. Run quality gates
  - [x] 17.1 Run `pnpm lint`
  - [x] 17.2 Run `pnpm typecheck`
  - [x] 17.3 Run `npm test:unit`
  - [x] 17.4 Run `pnpm test:integration` (or unit test suite which includes integrations)

- [x] 18. Final checkpoint - Implementation complete
  - Verify all tests pass
  - Confirm no regressions in existing Sprint 2.1 flows
  - Confirm cache gracefully degrades when Redis unavailable

## Notes

- Each task references specific requirements for traceability
- Cache invalidation happens AFTER successful database commit (post-commit pattern)
- TokenLedger remains append-only - no UPDATE/DELETE on token_ledger table
- All mutations must write AuditLog entries per Sprint 2.1 rules
- Redemption approval always revalidates against authoritative PostgreSQL state
- Redis failure is non-blocking - application continues in database-only mode

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 6, "tasks": ["5.4", "6.2", "7.1"] },
    { "id": 7, "tasks": ["7.2", "8"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3", "9.4"] },
    { "id": 9, "tasks": ["9.5", "10.1", "10.2", "10.3"] },
    { "id": 10, "tasks": ["10.4", "11.1", "11.2", "11.3"] },
    { "id": 11, "tasks": ["11.4", "12.1", "12.2", "12.3"] },
    { "id": 12, "tasks": ["12.4", "13.1", "13.2"] },
    { "id": 13, "tasks": ["13.3", "14.1", "15"] },
    { "id": 14, "tasks": ["16.1"] },
    { "id": 15, "tasks": ["17.1", "17.2", "17.3", "17.4"] },
    { "id": 16, "tasks": ["18"] }
  ]
}
```
