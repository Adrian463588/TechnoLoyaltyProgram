# Requirements Document: Redis/Memurai Caching Layer

**Product:** Berijalan Employee Loyalty Program Portal  
**Aligned With:** PRD Sprint 2.1 Loyalty Program Stabilization & Requirement Alignment  
**Document Version:** 2.1  
**Date:** May 15, 2026  
**Status:** Implementation Ready Draft

---

## 1. Introduction

This document defines the functional and non-functional requirements for implementing a Redis/Memurai caching layer in the Loyalty Program Portal backend.

The cache layer is introduced to improve read performance for frequently accessed data while preserving Sprint 2.1 correctness rules:

- Token ledger remains append-only.
- Token balance is derived from ledger entries, not trusted from client input.
- Redemption approval and token debit remain transaction-safe.
- Membership and reward mutations remain auditable.
- Redis/Memurai failure must never block core business flows.

Redis is the production cache target. Memurai may be used locally on Windows because it is Redis-compatible.

---

## 2. Glossary

| Term | Definition |
|---|---|
| Redis Cache | In-memory data store used for caching frequently accessed backend data. |
| Memurai | Redis-compatible cache option for local Windows development. |
| Cache Hit | Requested data is found in cache. |
| Cache Miss | Requested data is not found in cache and must be fetched from PostgreSQL. |
| TTL | Time-to-live in seconds before cached data expires. |
| Invalidation | Removing cache entries after a source-of-truth mutation. |
| Token Balance | Current derived token total for a Mitra, calculated from `token_ledger` sum. |
| Membership Tier | Mitra tier: `SAPHIRE`, `EMERALD`, `RUBY`, or `DIAMOND`. |
| Reward Catalog | Active reward item list shown to Mitra and managed by HC. |
| Graceful Degradation | Backend continues using PostgreSQL when Redis/Memurai is unavailable. |
| Audit Log | Required mutation log for token, redemption, membership, reward, and partner-status events. |

---

## 3. Scope

### 3.1 In Scope

The Redis/Memurai cache layer SHALL cover:

1. Token balance read cache.
2. Token expiry cohort summary read cache.
3. Membership tier and tier-progress read cache.
4. Reward catalog read cache.
5. Redemption eligibility read helper cache where safe.
6. Cache invalidation after token, membership, redemption, reward, upload, and partner-status mutations.
7. Cache metrics logging.
8. Redis/Memurai environment configuration.
9. Graceful fallback to PostgreSQL when cache is unavailable.

### 3.2 Out of Scope

The Redis/Memurai cache layer SHALL NOT:

1. Replace PostgreSQL as the source of truth.
2. Store canonical token ledger data.
3. Store canonical redemption status.
4. Store canonical membership history.
5. Store secrets, passwords, KTP numbers, NPWP numbers, or sensitive identity documents.
6. Implement business rules inside cache utilities.
7. Hardcode unconfirmed Techno downgrade/reset penalty logic.

---

## 4. Requirements

## Requirement 1: Redis/Memurai Connection Management

**User Story:**  
As a DevOps Engineer, I want configurable Redis/Memurai connection management so the backend can use caching in development, staging, and production safely.

### Acceptance Criteria

1. THE Redis_Client SHALL support environment-based configuration for development, staging, and production.
2. THE Redis_Client SHALL support Redis for production and Memurai for local Windows development through compatible Redis protocol configuration.
3. THE Redis_Client SHALL validate:
   - `REDIS_HOST`: string, max 255 characters.
   - `REDIS_PORT`: integer, 1–65535.
   - `REDIS_PASSWORD`: optional string, max 512 characters.
   - `REDIS_USE_TLS`: boolean.
   - `REDIS_CONNECTION_TIMEOUT`: integer, default 5000 milliseconds.
   - `REDIS_MAX_RETRIES`: integer, default 3.
4. WHEN connection startup fails because timeout exceeds 5000 milliseconds OR max 3 startup retries are reached, THE System SHALL log the failure and enter database-only mode.
5. THE Redis_Client SHALL support automatic reconnect with exponential backoff.
6. THE production Redis connection SHALL support TLS/SSL.
7. THE application process SHALL NOT terminate only because Redis/Memurai is unavailable.

---

## Requirement 2: Cache Utility Service

**User Story:**  
As a Backend Developer, I want a standardized cache service so all domain services use caching consistently.

### Acceptance Criteria

1. THE Cache_Service SHALL provide:
   - `get<T>(key)`
   - `set<T>(key, value, ttlSeconds)`
   - `delete(key)`
   - `exists(key)`
   - `deleteBatch(keys)`
   - `deleteByPattern(pattern)`
   - `getWithFallback(key, fetcher, ttlSeconds)`
2. THE Cache_Service SHALL automatically serialize and deserialize JSON values.
3. THE Cache_Service SHALL enforce TTL range:
   - Minimum: 1 second.
   - Maximum: 31,536,000 seconds.
4. THE Cache_Service SHALL reject invalid key patterns using a safe validation error.
5. WHEN a cache operation fails, THE Cache_Service SHALL log the failure and return a safe fallback result without throwing into user-facing API flow.
6. THE `deleteBatch` method SHALL process a maximum of 100 keys per call.
7. THE `deleteByPattern` method SHALL use scan-based deletion, not blocking `KEYS` in production.
8. THE Cache_Service SHALL never contain token, redemption, membership, or reward business logic.

---

## Requirement 3: Token Balance Caching

**User Story:**  
As a Mitra, I want fast token balance lookups so I can quickly view my loyalty standing.

### Acceptance Criteria

1. WHEN token balance is requested by authenticated Mitra, HC, or Team Leader with valid authorization, THE Token_Ledger_Service SHALL check cache first.
2. WHEN token balance is not in cache, THE Token_Ledger_Service SHALL calculate the balance from the append-only `token_ledger` sum and populate cache.
3. THE Token_Balance cache key SHALL follow `token:balance:{userId}`.
4. THE Token_Balance TTL SHALL be 300 seconds.
5. WHEN any token mutation occurs, THE System SHALL invalidate `token:balance:{userId}` after the database transaction commits.
6. Token mutation events requiring invalidation SHALL include:
   - `EARNED_SHIFT`
   - `EARNED_PROJECT`
   - `REDEEMED`
   - `EXPIRED`
   - `MANUAL_ADJUSTMENT`
   - `DOWNGRADE_PENALTY`
   - `RESET_PENALTY`
7. THE System SHALL NOT use cached balance as the source of truth for mutation authorization.
8. Redemption approval SHALL re-read/lock authoritative database state inside the transaction before deducting tokens.
9. IF Redis/Memurai fails OR cache read exceeds 5000 milliseconds, THEN THE System SHALL query PostgreSQL and return normal API response.

---

## Requirement 4: Token Expiry Cohort Caching

**User Story:**  
As a Mitra, I want to see token expiry information quickly so I know which token cohorts will expire.

### Acceptance Criteria

1. THE Token_Expiry summary SHALL be cacheable using key `token:expiry-summary:{userId}`.
2. THE Token_Expiry summary TTL SHALL be 300 seconds.
3. WHEN token credit, debit, expiry, manual adjustment, downgrade, or reset occurs, THE System SHALL invalidate `token:expiry-summary:{userId}`.
4. THE cached expiry summary SHALL be derived from database ledger data grouped by `earnedYear` and `expiresAt`.
5. THE expiry job SHALL remain idempotent and SHALL NOT depend on cached data to decide debits.
6. Expiry reminder generation SHALL read authoritative database data, not cache-only data.

---

## Requirement 5: Membership Tier and Progress Caching

**User Story:**  
As a Mitra, HC Admin, or Team Leader, I want faster membership tier and progress lookups so dashboards and summaries load quickly.

### Acceptance Criteria

1. WHEN membership tier is requested with valid authorization, THE Membership_Service SHALL return cached data if present.
2. WHEN cache is missing, THE Membership_Service SHALL fetch authoritative user membership data and calculated progress from PostgreSQL/domain calculators, then populate cache.
3. THE Membership_Tier cache key SHALL follow `membership:tier:{userId}`.
4. THE Membership_Progress cache key SHALL follow `membership:progress:{userId}`.
5. Membership cache TTL SHALL be 600 seconds.
6. WHEN membership data changes through upgrade, downgrade, reset, manual correction, division change, or scheduled evaluation, THE System SHALL invalidate:
   - `membership:tier:{userId}`
   - `membership:progress:{userId}`
   - `token:balance:{userId}` if token penalty/reset is applied.
7. WHEN monthly membership batch evaluation runs, THE Membership_Service SHALL invalidate affected users only when possible. Pattern invalidation `membership:*` MAY be used only for safe bulk refresh after batch jobs.
8. THE cache layer SHALL NOT mix Opcent/Tele slot rules with Techno project rules.
9. THE System SHALL NOT hardcode the unconfirmed Techno penalty. Use `TODO(OQ-TECHNO-PENALTY)` until stakeholder confirmation.

---

## Requirement 6: Reward Catalog Caching

**User Story:**  
As a Mitra, I want the reward catalog to load quickly so I can browse available rewards and understand eligibility.

### Acceptance Criteria

1. THE Reward_Catalog_Service SHALL cache active reward catalog data using key `reward:catalog:active`.
2. THE Reward_Catalog_Service MAY cache admin catalog views using key `reward:catalog:admin`.
3. THE active reward catalog TTL SHALL be 3600 seconds.
4. WHEN reward is created, updated, deactivated, restocked, or stock is deducted by approved redemption, THE System SHALL invalidate relevant reward catalog cache keys.
5. THE cached reward catalog SHALL NOT be used as the final source of truth for redemption approval.
6. Redemption approval SHALL validate reward active status, stock, partner status, redemption window, and token balance from authoritative database state.
7. IF cache invalidation fails, THE Reward_Catalog_Service SHALL log the failure and continue the database mutation.

---

## Requirement 7: Redemption Eligibility Cache Safety

**User Story:**  
As a Mitra, I want eligibility status to appear quickly, but the system must still prevent invalid redemption.

### Acceptance Criteria

1. THE System MAY cache read-only redemption eligibility preview using key `redemption:eligibility:{userId}` with TTL 120 seconds.
2. THE eligibility preview SHALL include reason labels such as insufficient tokens, inactive/resigned partner, reward unavailable, or outside redemption window.
3. THE eligibility preview SHALL be invalidated when:
   - Token balance changes.
   - Partner status changes.
   - Reward catalog changes.
   - Redemption window configuration changes.
4. THE cached eligibility preview SHALL be UX-only.
5. THE Redemption_Service SHALL always revalidate all guards server-side during redemption submission and approval.
6. THE System SHALL prevent double debit for the same approved redemption using database transaction and idempotency guard, not cache.

---

## Requirement 8: Cache Invalidation and Audit Logging

**User Story:**  
As a System Architect, I want robust cache invalidation so stale data is not served after important mutations.

### Acceptance Criteria

1. WHEN token mutation commits successfully, THE System SHALL invalidate related token, expiry, membership progress, and eligibility cache for the affected user.
2. WHEN membership mutation commits successfully, THE System SHALL invalidate membership and eligibility cache for the affected user.
3. WHEN reward catalog mutation commits successfully, THE System SHALL invalidate reward catalog and eligibility preview cache.
4. WHEN partner status changes, THE System SHALL invalidate membership, eligibility, team summary, and affected dashboard cache.
5. THE System SHALL write Audit_Log entries for cache invalidation triggered by admin/system mutations where audit is required by Sprint 2.1.
6. Cache invalidation SHALL happen after successful database commit, not before commit.
7. IF cache invalidation fails, THE mutation SHALL remain successful and the failure SHALL be logged with `CACHE_INVALIDATION_FAILED`.
8. For transactions spanning token debit and redemption approval, invalidation SHALL occur only after the transaction commits.

---

## Requirement 9: Cache Metrics and Observability

**User Story:**  
As a Performance Engineer, I want cache metrics so I can monitor effectiveness and failures.

### Acceptance Criteria

1. THE Cache_Metrics SHALL track cache hit rate within a 1-minute rolling window.
2. THE Cache_Metrics SHALL track cache miss rate within a 1-minute rolling window.
3. THE Cache_Metrics SHALL track average cache response time in milliseconds within a 1-minute rolling window.
4. THE Cache_Metrics SHALL track cache operation error count within a 1-minute rolling window.
5. THE metrics output SHALL be logged in JSON format with:
   - `cache_hit_rate`
   - `cache_miss_rate`
   - `average_response_time_ms`
   - `error_count`
   - `window_start`
   - `service_name`
6. Cache logs SHALL NOT include sensitive personal data.
7. Cache errors SHALL include safe metadata: key prefix, operation, duration, and error code.

---

## Requirement 10: Production Readiness

**User Story:**  
As a System Architect, I want production-ready caching so the system can handle higher read traffic without weakening correctness.

### Acceptance Criteria

1. THE `.env.example` SHALL document:
   - `REDIS_ENABLED`
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
   - `REDIS_USE_TLS`
   - `REDIS_CONNECTION_TIMEOUT`
   - `REDIS_MAX_RETRIES`
   - `REDIS_KEY_PREFIX`
   - `REDIS_DEFAULT_TTL`
2. THE System SHALL support `REDIS_ENABLED=false` for database-only mode.
3. THE System SHALL namespace keys per environment using `REDIS_KEY_PREFIX`, for example `loyalty:dev`.
4. THE System SHALL fail closed for authorization but fail open to database for cache availability.
5. THE System SHALL avoid blocking Redis commands in production.
6. THE System SHALL include cache integration tests with Redis-compatible service.
7. THE System SHALL include smoke tests for:
   - Redis connection.
   - Cache set/get/delete.
   - Fallback to database-only mode.
   - Invalidation after token mutation.
   - Invalidation after reward mutation.

---

## 5. Cache Key Registry

| Domain | Key Pattern | TTL | Invalidation Trigger |
|---|---:|---:|---|
| Token Balance | `token:balance:{userId}` | 300s | Any token ledger mutation for user |
| Token Expiry Summary | `token:expiry-summary:{userId}` | 300s | Token credit/debit/expiry/penalty/reset |
| Membership Tier | `membership:tier:{userId}` | 600s | Tier update, division update, scheduled evaluation |
| Membership Progress | `membership:progress:{userId}` | 600s | Claim approval/rejection, membership evaluation |
| Reward Catalog Active | `reward:catalog:active` | 3600s | Reward create/update/deactivate/stock deduction |
| Reward Catalog Admin | `reward:catalog:admin` | 600s | Reward create/update/deactivate/stock deduction |
| Redemption Eligibility Preview | `redemption:eligibility:{userId}` | 120s | Token, partner status, reward, redemption window change |
| Team Token Summary | `team:token-summary:{teamLeadId}` | 300s | Token mutation for team member, partner status change |
| Dashboard Summary | `dashboard:mitra:{userId}` | 120s | Token, membership, redemption, reward-related mutation |

---

## 6. Error Codes

| Code | Meaning |
|---|---|
| CACHE001 | Redis/Memurai connection failed |
| CACHE002 | Redis/Memurai operation timeout |
| CACHE003 | Cache operation failed |
| CACHE004 | Invalid cache key pattern |
| CACHE005 | Batch delete size exceeded |
| CACHE006 | Cache serialization failed |
| CACHE007 | Cache invalidation failed |
| CACHE008 | Cache disabled by configuration |

---

## 7. Definition of Done

This Redis/Memurai implementation is done only when:

- Redis can be disabled without breaking core backend flows.
- Token balance cache is never used as mutation truth.
- All token mutations invalidate balance and expiry summary.
- Reward catalog cache is invalidated after reward and stock mutation.
- Membership cache is invalidated after tier/progress changes.
- Cache invalidation failures are logged but do not break committed mutations.
- Cache metrics are emitted safely.
- Unit, integration, and smoke tests exist.
- `.env.example` is updated.
- Implementation follows Sprint 2.1 backend layering and audit rules.
