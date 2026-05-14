# AGENTS.md — Berijalan Employee Loyalty Program Portal
> Engineering Playbook for AI Coding Agents & Human Engineers
> Version: 2.0 · Date: May 14, 2026
> Stack: Next.js App Router · TypeScript · PostgreSQL · Prisma · Tailwind · shadcn/ui

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Product Context](#2-product-context)
3. [Monorepo Directory Structure](#3-monorepo-directory-structure)
   - [Frontend](#31-frontend-apps-web)
   - [Backend](#32-backend-apps-api)
   - [TestSuite](#33-testsuite-apps-test)
4. [Required Tech Stack](#4-required-tech-stack)
5. [Architecture Rules](#5-architecture-rules)
6. [Business Logic Rules](#6-business-logic-rules)
7. [Coding Standards](#7-coding-standards)
8. [Design System Integration](#8-design-system-integration)
9. [Security & Permissions](#9-security--permissions)
10. [Testing Standards](#10-testing-standards)
11. [Observability & Auditability](#11-observability--auditability)
12. [Performance Expectations](#12-performance-expectations)
13. [Delivery Workflow for Agents](#13-delivery-workflow-for-agents)
14. [Definition of Done](#14-definition-of-done)
15. [Pull Request Standards](#15-pull-request-standards)
16. [Anti-Patterns to Avoid](#16-anti-patterns-to-avoid)
17. [AI Agent Guardrails](#17-ai-agent-guardrails)

---

## 1. Purpose & Scope

This document is the **single authoritative playbook** for every AI coding agent and human engineer contributing to the Berijalan Employee Loyalty Program Portal. It defines:

- how to structure code across Frontend, Backend, and TestSuite workspaces,
- what business rules are non-negotiable,
- what patterns are required and which are prohibited,
- how agents must behave before, during, and after implementing a feature.

**Mandatory reading order before writing a single line of code:**

```
1. PRD.md              → Product requirements, user stories, acceptance criteria
2. DESIGN.md           → Visual system, glassmorphism tokens, micro-interaction spec
3. AGENTS.md (this)    → Engineering playbook, directory rules, coding standards
```

> Read the relevant `node_modules/next/dist/docs/` guide before generating any Next.js code. This project targets the latest stable App Router — APIs and conventions differ from older training data.

---

## 2. Product Context

### System Summary

An internal web portal that rewards employees (*Mitra*) in the Optel, Tele, and Techno divisions for extra shifts or completed projects. Contributions are converted to tokens, which accumulate and are redeemable for physical rewards through an auditable approval workflow.

### Three User Roles

| Role | What They Do |
|------|-------------|
| **Mitra (Employee)** | Checks token balance, tier progress, reward eligibility; submits redemption requests |
| **HC PM (Admin)** | Uploads monthly data, validates claims, manages redemptions, configures rules |
| **Team Leader** | Monitors team-level token and tier progress; supports shift claim validation |

### Two Division Earning Models

| Division | Earning Unit | Evaluation Cycle |
|----------|-------------|-----------------|
| Opcent & Tele | Slots taken | Annual (by Dec 15) |
| Techno Center | Projects completed | Every 6 months |

> **Critical:** These two earning models must never share calculation code. Isolate them in separate modules behind a common interface.

### Membership Tiers (Both Divisions)

| Tier | Opcent/Tele (slots/yr) | Techno (projects/6mo) | Health Benefit |
|------|----------------------|----------------------|----------------|
| Saphire | 0 (default) | 0 (default) | None |
| Emerald | 430 | 25 | FIT |
| Ruby | 860 | 50 | FIT |
| Diamond | 1,300 | 75 | CLASSY |

### Fixed Earning Periods

```
P1: December 16 → June 15
P2: June 16 → December 15
```

These dates are **immutable policy constants** — never read them from a UI config or editable database field unless the product team issues a formal Architecture Decision Record (ADR).

---

## 3. Monorepo Directory Structure

The project uses a **monorepo with three isolated workspaces**: `apps/web` (Frontend), `apps/api` (Backend), and `apps/test` (TestSuite). Shared types, utilities, and Prisma schema live in `packages/`.

```
LoyaltyProgram/
├── Backend/                        ← Backend (Express.js + Prisma)
├── Frontend/                       ← Frontend (Next.js App Router)
├── TestSuite/                      ← TestSuite (Cypress E2E + Vitest)
├── AGENTS.md                       ← Engineering playbook
├── DESIGN.md                       ← Design system & tokens
├── PRD.md                          ← Product requirements
├── README.md                       ← Project overview
└── .gitignore
```

---

### 3.1 Frontend — `Frontend/`

The Next.js application responsible for all user-facing rendering. Server components fetch data; client components handle only interactive UI state.

```
Frontend/
├── src/
│   ├── app/                        ← Next.js Routing & Layouts
│   ├── components/                 ← UI components (ui, shared, dashboard, rewards)
│   ├── features/                   ← Domain-scoped client logic
│   ├── hooks/                      ← Custom React hooks
│   ├── lib/                        ← Shared utilities & configurations
│   ├── styles/                     ← Global CSS & Tailwind styles
│   ├── types/                      ← Frontend-specific types
│   ├── test/                       ← Frontend unit tests
│   └── middleware.ts               ← Route protection & role guards
├── public/                         ← Static assets
├── tsconfig.json
└── package.json
```

**Frontend Rules:**

- Every `page.tsx` must have a sibling `loading.tsx` that renders a skeleton screen.
- `components/ui/` contains only stateless presentational primitives — no data fetching.
- `features/` contains client-side hooks and actions scoped to one domain — no cross-domain imports.
- Server components fetch data directly via the `api-client` or server actions — never through client-side fetch in a server component.
- Role guard lives in `app/(role)/layout.tsx` — never duplicated inside individual pages.
- The `middleware.ts` handles unauthenticated redirects before React renders anything.

---

### 3.2 Backend — `Backend/`

The backend workspace owns all business logic, database access, and mutation endpoints. It exposes a type-safe REST or RPC API consumed by the Frontend.

```
Backend/
├── src/
│   ├── api/                        ← Route definitions
│   ├── controllers/                ← Request handlers
│   ├── services/                   ← Business logic & orchestration
│   ├── repositories/               ← Data access (Prisma)
│   ├── policies/                   ← Authorization & business rules
│   ├── db/                         ← Prisma client singleton
│   ├── errors/                     ← Custom error classes
│   ├── middleware/                 ← Express middlewares (auth, validation)
│   ├── types/                      ← Shared domain types
│   ├── utils/                      ← Shared utility functions
│   └── app.ts                      ← Application entry point
├── prisma/                         ← Database schema & migrations
├── prisma.config.ts                ← Prisma adapter configuration
├── tsconfig.json
└── package.json
```

**Backend Rules:**

- `routes/` are thin — they validate input (Zod), call one service method, and return a response. No business logic in route handlers.
- `services/` orchestrate: call repositories, apply domain rules, emit audit logs.
- `repositories/` contain only Prisma queries — no conditional business logic.
- `domain/` modules are pure functions — no database calls, no HTTP, no framework imports.
- `token-ledger.repository.ts` must never issue an `UPDATE` or `DELETE` on `TokenLedger` rows. Every balance change is a new insert.
- Every admin-triggered mutation calls `audit.service.ts` before returning a response.
- Scheduled jobs in `schedulers/` must be idempotent — guard against double-execution with a run-log check.

---

### 3.3 TestSuite — `TestSuite/`

All automated tests live in one dedicated workspace. This keeps the Frontend and Backend free of test-infrastructure dependencies and enables a single test pipeline.

```
TestSuite/
├── cypress/                        ← Cypress E2E test files
│   ├── e2e/                        ← Test specifications
│   ├── support/                    ← Custom commands & global setup
│   └── pages/                      ← Page Object Models (POM)
├── fixtures/                       ← Test data (CSV, JSON)
├── vitest/                         ← Vitest unit & integration tests
├── cypress.config.ts               ← Cypress configuration
├── vitest.config.ts                ← Vitest configuration
└── package.json
```

**TestSuite Rules:**

- `unit/` — Pure function tests only. No database, no HTTP, no file I/O. Run in under 5 seconds total.
- `integration/` — Use a dedicated test database seeded before each suite. Never run against production.
- `e2e/` — Cypress tests run against a locally running full-stack environment (`pnpm dev`). Never mock the API in E2E tests — test the real stack.
- Every policy-critical flow (downgrade, reset, redemption guard, expiry) must have unit test coverage before the feature PR is merged.
- Test fixtures live in `fixtures/` beside the tests that use them — never inline large data structures in test files.
- Idempotency is tested explicitly: every scheduled job test includes a "run twice, same result" assertion.

---

## 4. Required Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js (App Router, latest stable) | Read `node_modules/next/dist/docs/` before coding |
| Language | TypeScript (`strict: true`) | No `any` without documented exception |
| Database | PostgreSQL | Indexed on userId, ledger date, status fields |
| ORM | Prisma **or** Drizzle (choose once) | Prisma recommended for migration tooling |
| Styling | Tailwind CSS | Tokens from `DESIGN.md` Section 14 |
| UI Components | shadcn/ui | Wrapped in `packages/ui` — never import shadcn directly in page files |
| Forms | React Hook Form + Zod | Zod schemas shared between frontend and backend |
| Auth | NextAuth / Auth.js | Email provider + optional SSO |
| Tables | TanStack Table | Admin data grids; paginated server-side |
| Unit Tests | Vitest | All tests in `apps/test/unit/` |
| E2E Tests | Cypress | All tests in `apps/test/e2e/` |
| Package Manager | pnpm | Workspaces via `pnpm-workspace.yaml` |
| Monorepo Orchestration | Turborepo | `turbo.json` defines pipeline |

---

## 5. Architecture Rules

### 5.1 Strict Layer Separation

```
Request → Route Handler → Middleware (auth + validate) → Service → Repository → Database
                                                       ↘ Domain Module (pure logic)
```

- **Route handlers** validate input schema and delegate to one service. No raw Prisma in routes.
- **Services** orchestrate: call domain logic, call repositories, write audit logs.
- **Repositories** speak only to the database. No HTTP calls, no business conditions.
- **Domain modules** are pure TypeScript functions. No imports from `@prisma/client`, `next`, or any framework.
- **Frontend components** never import from `server/`, `repositories/`, or `domain/` directly.

### 5.2 Server-First Data Flow

- Default to React Server Components (RSC) for all data display.
- Use Server Actions for all mutations from the Frontend.
- Use Client Components (`'use client'`) only when browser state is genuinely needed (animations, interactive forms, real-time polling).
- Never fetch sensitive loyalty data on the client without a server-enforced role check.

### 5.3 Append-Only Ledger (Non-Negotiable)

The `TokenLedger` table is the financial source of truth. Violations of this rule corrupt the audit trail.

```
ALLOWED:   INSERT INTO token_ledger ...
FORBIDDEN: UPDATE token_ledger SET amount = ...
FORBIDDEN: DELETE FROM token_ledger WHERE ...
```

Balance = `SUM(amount)` over all ledger rows for a user. Always compute from the ledger, never from a cached `balance` column on the `User` table (unless a performance snapshot column is added with explicit ADR approval and double-write logic).

### 5.4 Domain Boundary Isolation

These business capabilities must not be collapsed into shared god services:

| Domain | Owner Module |
|--------|-------------|
| Authentication & authorization | `features/auth/` |
| Employee profile & role | `server/services/user.service.ts` |
| Token calculation (Opcent) | `domain/token-engine/opcent/` |
| Token calculation (Techno) | `domain/token-engine/techno/` |
| Membership tier logic | `domain/membership/` |
| Redemption workflow | `domain/redemptions/` |
| File upload pipeline | `domain/uploads/` |
| Scheduled evaluation jobs | `server/schedulers/` |
| Audit logging | `server/services/audit.service.ts` |

### 5.5 Idempotent Scheduled Jobs

Both scheduled jobs must pass idempotency tests before they are considered done.

```typescript
// Pattern: every job run logs its execution
// Before running, check if already executed for this period
const alreadyRan = await db.jobRunLog.findFirst({
  where: { jobName, periodKey }   // periodKey = 'YYYY-MM' or 'YYYY-HN'
});

if (alreadyRan) {
  logger.info({ jobName, periodKey }, 'Job already executed for this period — skipping');
  return { skipped: true };
}
```

---

## 6. Business Logic Rules

> These rules come directly from `PRD.md`. Do not interpret, approximate, or invent alternatives.

### 6.1 Earning Period Logic

```typescript
// Backend/src/services/period.service.ts
export function getPeriodsForYear(year: number): [PeriodInfo, PeriodInfo] {
  // P1: Dec 16 (Year-1) -> Jun 15 (Year)
  // P2: Jun 16 (Year) -> Dec 15 (Year)
}
```

### 6.2 Token-to-Slot Conversion (Opcent/Tele Only)

```
1 Slot = 1 Token
```

Used exclusively for membership tier calculation. Do not apply this conversion to Techno.

### 6.3 Opcent/Tele Tier Thresholds

```typescript
export const OPCENT_TELE_THRESHOLDS = {
  SAPHIRE: 0,
  EMERALD: 430,
  RUBY:    860,
  DIAMOND: 1300,
} as const;
```

### 6.4 Techno Tier Thresholds

```typescript
export const TECHNO_THRESHOLDS = {
  SAPHIRE: 0,
  EMERALD: 25,
  RUBY:    50,
  DIAMOND: 75,
} as const;
```

### 6.5 Downgrade & Reset Rules

```typescript
// Opcent / Tele
const OPCENT_DOWNGRADE = {
  trigger: 'no_slots_3_consecutive_months_inactive',
  tokenPenalty: 0.50,   // multiply current balance by 0.50 (floor)
  tierChange: 'ONE_LEVEL_DOWN',
};

const OPCENT_RESET = {
  trigger: 'no_slots_3_consecutive_months_fully_unavailable',
  tokenPenalty: 1.00,   // balance becomes 0
  tierChange: 'RESET_TO_SAPHIRE',
};

// Techno
const TECHNO_DOWNGRADE_RESET = {
  trigger: 'rejected_3_projects_within_6_month_window',
  tokenPenalty: 'PENDING_STAKEHOLDER_CONFIRMATION', // ← OQ-01
  tierChange: 'PENDING_STAKEHOLDER_CONFIRMATION',
};
```

> OQ-01 is an open question in `PRD.md` Section 11. Do not invent a rule. Use a feature flag and stub the Techno penalty until confirmed.

### 6.6 Token Expiry

```typescript
// Token earned in year N expires on Dec 31 of year (N + 3)
function computeExpiryDate(earnedYear: number): Date {
  return new Date(earnedYear + 3, 11, 31, 23, 59, 59); // Dec 31, 23:59:59
}

// Notification thresholds: 90, 30, and 7 days before expiry
export const EXPIRY_NOTIFICATION_DAYS = [90, 30, 7] as const;
```

### 6.7 Redemption Eligibility — Five Guards (All Must Pass)

```typescript
async function assertRedemptionEligible(
  user: User,
  item: RewardItem,
  currentBalance: number,
): Promise<void> {
  if (user.partnerStatus !== 'ACTIVE')   throw new DomainError('PARTNER_NOT_ACTIVE');
  if (currentBalance < item.tokenCost)   throw new DomainError('INSUFFICIENT_TOKENS');
  if (!item.isActive)                    throw new DomainError('ITEM_INACTIVE');
  if (!isWithinRedemptionWindow())       throw new DomainError('OUTSIDE_REDEMPTION_WINDOW');
  if (item.stock !== null && item.stock <= 0) throw new DomainError('OUT_OF_STOCK');
}
```

This logic is implemented in `Backend/src/services/redemption.service.ts`. It is used by both the Frontend (via Server Actions) and the Backend API to ensure consistent rule enforcement.

### 6.8 Redemption Status Machine

```
DRAFT → PENDING_VERIFICATION → VERIFIED → PURCHASED → PICKUP_SCHEDULED → COMPLETED
                             ↘ REJECTED
PENDING_VERIFICATION → CANCELLED
VERIFIED → CANCELLED
```

Any transition not in this map must throw `ValidationError`. This logic lives in `Backend/src/services/redemption.service.ts`.

---

## 7. Coding Standards

### TypeScript

```jsonc
// tsconfig.json (both Frontend/ and Backend/)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- Never use `any`. Use `unknown` + type narrowing, or open a PR comment if a temporary exception is needed.
- All domain concepts use explicit union types or enums: `Division`, `MembershipTier`, `PartnerStatus`, `RedemptionStatus`, `TokenEventType`.
- Zod schemas defined in `Backend/src/types/` (or shared `common/` types) are used between Frontend form validation and Backend request validation — no duplication.
- Every function that can fail returns a `Result<T, DomainError>` type or throws a typed `DomainError` — never a raw `Error` with a string message.

### React & Next.js

- Server components are the default. Add `'use client'` only when justified with a comment.
- One data-fetching call per route — never fetch the same data in nested components.
- Every async view must have three states: loading (skeleton), empty (empty state illustration), error (error boundary with retry).
- Do not use `useEffect` for data fetching — use Server Components or React Query if client-side polling is genuinely needed.
- `loading.tsx` is required in every route folder that fetches data.

### Error Handling

```typescript
// Domain error — typed and catchable
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// Usage in route handler
try {
  const result = await redemptionService.submit(input);
  return Response.json({ success: true, data: result });
} catch (err) {
  if (err instanceof DomainError) {
    return Response.json({ success: false, code: err.code, message: err.message }, { status: 422 });
  }
  logger.error({ err }, 'Unexpected error in redemption submit');
  return Response.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 });
}
```

---

## 8. Design System Integration

All visual output must follow `DESIGN.md`. Agents generating UI components must read DESIGN.md before writing any JSX or CSS.

### Quick Tokens Reference

```css
/* Core colors — use CSS custom properties, not hardcoded hex */
--color-bg-base:       #1E2938;
--color-accent:        #6BCE53;   /* CTA, success, active */
--color-accent-hover:  #57B241;
--color-text-primary:  #F8FAFC;
--color-text-secondary:#94A3B8;
--color-border-glass:  rgba(255, 255, 255, 0.10);

/* Glass card recipe — apply as a compound class, not inline */
.glass-card {
  background: rgba(45, 55, 72, 0.25);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
}
```

### Mandatory UI Rules

- Every `page.tsx` that renders metrics must use the `BentoGrid` layout component.
- Skeleton screens use `.skeleton` with shimmer animation — no spinners in content areas.
- CTA buttons use `btn-primary` (green) exclusively — green is never used decoratively.
- Status chips include both a colored dot and a text label — color is never the only signal.
- All breadcrumbs use the `Breadcrumb` shared component — no custom inline breadcrumb markup.
- Hover transitions use spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` at 250ms.

---

## 9. Security & Permissions

### Enforcement Model

```
Layer 1: middleware.ts         → Redirect unauthenticated users before React renders
Layer 2: layout.tsx (route)    → Server-side role check; redirect wrong roles
Layer 3: server action / route → Re-check session + role before every mutation
Layer 4: repository / domain   → Ownership check (user can only access own data)
```

All four layers must be present. Passing Layer 1 does not exempt a request from Layer 3.

### Rules

- Never expose admin-only fields in API responses returned to Mitra or Team Leader roles.
- Personal data (full name, email, KTP reference) must never appear in:
  - client-side `console.log` calls
  - error response bodies sent to the client
  - URL query parameters
- All manual token adjustments, tier overrides, and redemption status changes must create an `AuditLog` entry before the function returns.
- File uploads must validate MIME type **and** parse the file header — do not trust the Content-Type header alone.
- All mutation endpoints must be protected against CSRF (handled by NextAuth/Next.js framework defaults — verify this is active).

---

## 10. Testing Standards

### Coverage Requirements by Feature Type

| Feature Type | Unit | Integration | E2E |
|-------------|------|-------------|-----|
| Token calculation (Opcent/Tele) | Required | Required | — |
| Token calculation (Techno) | Required | Required | — |
| Membership downgrade/reset | Required | Required | — |
| Token expiry scheduler | Required | Required | — |
| Redemption eligibility guards | Required | Required | Required |
| Upload pipeline (parse → validate → commit) | Required | Required | Required |
| Role-based data access | — | Required | Required |
| Full redemption workflow | — | Required | Required |
| Admin manual adjustment | Required | — | Required |

### Unit Test Rules

```typescript
// Structure: Arrange → Act → Assert, no more than 20 lines per test
// Fixtures in separate files, imported — not defined inline

describe('calculateMembershipTier (Opcent/Tele)', () => {
  it('returns SAPHIRE when slots = 0', () => {
    expect(calculateMembershipTier({ slots: 0 })).toBe('SAPHIRE');
  });

  it('returns EMERALD at exactly 430 slots (boundary)', () => {
    expect(calculateMembershipTier({ slots: 430 })).toBe('EMERALD');
  });

  it('returns EMERALD at 429 slots (boundary - 1)', () => {
    expect(calculateMembershipTier({ slots: 429 })).toBe('SAPHIRE');
  });
});
```

### Integration Test Rules

- Use a dedicated test PostgreSQL database, seeded before each suite via a `seed.ts` script.
- Wrap each test in a transaction and roll back after — never leave test data in the DB.
- Test the full service layer, not individual repository queries.

### Cypress E2E Rules

- Never mock the API — test the real running stack.
- Use `cy.task()` to seed test data via the database directly (not via the UI).
- Every E2E spec must clean up its test data in an `afterEach` hook.
- Test IDs use `data-testid` attributes — never CSS class selectors or text content.

```typescript
// Good
cy.get('[data-testid="token-balance-hero"]').should('contain', '1,200');

// Bad — brittle
cy.get('.text-metric-hero').should('contain', '1,200');
```

### PR Merge Gate

> **No PR merges if a policy-critical flow lacks automated test coverage.**

Policy-critical flows: downgrade, reset, expiry, redemption eligibility, role-based data access, upload commit pipeline.

---

## 11. Observability & Auditability

### Structured Logging

Use a structured JSON logger (e.g., Pino). Every log entry must include:

```typescript
logger.info({
  actorId: session.userId,
  action: 'REDEMPTION_APPROVED',
  targetUserId: redemption.mitraId,
  redemptionId: redemption.id,
  tokenDeducted: item.tokenCost,
}, 'Redemption approved by HC admin');
```

### Required Audit Events

| Event | Logged When |
|-------|------------|
| `TOKEN_CREDITED` | Shift/project claim approved |
| `TOKEN_DEBITED` | Redemption deducted |
| `TOKEN_EXPIRED` | Expiry job fires for a user |
| `TOKEN_MANUAL_ADJUST` | HC makes a manual adjustment |
| `TIER_UPGRADED` | Threshold crossed |
| `TIER_DOWNGRADED` | Inactivity rule fires |
| `TIER_RESET` | Full reset rule fires |
| `REDEMPTION_STATUS_CHANGED` | Any status transition |
| `UPLOAD_COMMITTED` | Monthly upload committed to live data |
| `PARTNER_STATUS_CHANGED` | Active → Resigned or reverse |

All events are written to the `AuditLog` entity (see PRD.md Section 5).

---

## 12. Performance Expectations

| Metric | Target | Method |
|--------|--------|--------|
| Dashboard LCP (Mitra) | < 2 seconds | RSC + skeleton, no blocking client fetches |
| Token balance query | < 200ms | Indexed `userId` on `TokenLedger` |
| Admin table (100 rows) | < 1 second | Server-side pagination; TanStack Table |
| Upload validation (1,000 rows) | < 5 seconds | Streaming parse; row-level error batching |
| Scheduled job (1,000 users) | < 60 seconds | Batched queries; no N+1 |

### Database Index Requirements

```sql
-- Required indexes (add to Prisma schema with @@index)
TokenLedger:          userId, createdAt, earnedYear, expiresAt
RedemptionRequest:    mitraId, status, createdAt
ShiftClaim:           mitraId, shiftDate, status
ProjectClaim:         mitraId, completedAt, status
AuditLog:             actorId, action, createdAt
User:                 email (unique), division, membershipTier
```

---

## 13. Delivery Workflow for Agents

### Before Writing Code

1. Read `PRD.md` → confirm target user story and acceptance criteria.
2. Read `DESIGN.md` → confirm design tokens and component patterns if building UI.
3. Read `AGENTS.md` → confirm directory placement, layer rules, and coding standards.
4. List the affected domain modules, repositories, and routes.
5. Identify open questions from `PRD.md` Section 11 — **do not invent policy to fill gaps**.
6. Write the test cases before or alongside the implementation.

### During Coding

- Implement server-side permission checks first — before any UI rendering logic.
- Build domain logic functions before the service that calls them.
- Add a skeleton screen before adding the data-fetching server component.
- Keep commits scoped to one concern: one commit per domain module, one per route, one per component.
- If an open question blocks you, add a clearly marked `// TODO(OQ-XX):` comment and a feature flag stub — do not make up a rule.

### Before Opening a PR

- [ ] Run `pnpm lint` — zero warnings.
- [ ] Run `pnpm typecheck` — zero errors.
- [ ] Run `pnpm test:unit` — all pass.
- [ ] Run `pnpm test:integration` — all pass.
- [ ] Manually verify: loading state, empty state, error state for every async view.
- [ ] Manually verify: role boundaries (open the route as the wrong role, expect redirect).
- [ ] Confirm audit log entries appear for every admin mutation.
- [ ] Confirm responsive behavior at 375px, 768px, and 1280px.

---

## 14. Definition of Done

A feature is **only done** when every checkbox below is ticked:

- [ ] Product behavior matches the PRD acceptance criteria exactly.
- [ ] Business rules are implemented in the correct domain module — not in UI or route handlers.
- [ ] Server-side role and ownership checks are in place.
- [ ] Loading, empty, and error states exist and are visible.
- [ ] Skeleton screen renders before data arrives.
- [ ] Accessibility: keyboard navigation works, labels exist, contrast passes.
- [ ] Unit tests cover all boundary values and error paths.
- [ ] Integration or E2E tests cover the happy path and key failure paths.
- [ ] Audit log entries are created for any admin-triggered mutation.
- [ ] Structured log statements added for server-side errors and key events.
- [ ] `DESIGN.md` tokens are used — no hardcoded hex values in components.
- [ ] Documentation updated if a business rule or workflow changed.

---

## 15. Pull Request Standards

Every PR must include:

```markdown
## Summary
<!-- One paragraph: what this PR does and why -->

## Linked Requirement
<!-- e.g. PRD.md US-03: Employee Redeems a Reward -->

## Changes
<!-- Bullet list: what files changed and why -->

## Test Evidence
<!-- Screenshots of test output or Cypress recording link -->

## Screenshots / Recordings
<!-- Required for any UI change -->

## Migration Notes
<!-- Required if Prisma schema changed: list new tables, columns, indexes -->

## Rollout Considerations
<!-- Any feature flags, data backfill, or scheduled job changes -->

## Checklist
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No hardcoded business rules in UI components
- [ ] Audit logging confirmed for admin mutations
- [ ] Role boundaries manually verified
- [ ] Responsive behavior checked at 375 / 768 / 1280px
```

---

## 16. Anti-Patterns to Avoid

These are explicit prohibitions. Violating them in a PR will require a mandatory revision.

| Anti-Pattern | Why It Is Prohibited |
|-------------|---------------------|
| Token threshold values hardcoded in a React component | Breaks testability; duplicates the source of truth |
| `any` type used without a documented exception comment | Undermines type safety in business-critical code |
| `UPDATE TokenLedger SET ...` | Corrupts the audit trail |
| Business logic inside a route handler | Untestable; bypasses the domain layer |
| Role check only in client-side navigation | Server endpoints remain unprotected |
| Redemption eligibility checked only on the client | Users can bypass guards via API |
| Generic `catch (e) { return 'Something went wrong' }` | Hides root cause; prevents debugging |
| Fetching the same data in parent and child components | Duplicated DB round-trips; inconsistent state |
| Spinner instead of skeleton screen in content areas | Degrades perceived performance |
| Inlining a feature-flag decision in more than one place | Flags must be checked in one service, not scattered |
| Inventing a policy to fill an open question | Policy must come from stakeholders — see PRD OQ list |
| Skipping `AuditLog` for a manual admin mutation | Breaks auditability; data integrity violation |

---

## 17. AI Agent Guardrails

When generating code for this project, AI agents must follow these additional constraints:

### Read Before Generate

```
Before generating any file in apps/web:    read DESIGN.md + this AGENTS.md Section 3.1
Before generating any file in apps/api:    read PRD.md Section 6 + this AGENTS.md Section 3.2
Before generating any file in apps/test:   read PRD.md Section 8 + this AGENTS.md Section 3.3
Before generating a domain module:         read PRD.md Section 6 in full
```

### Never Invent Policy

If a business rule is marked as an open question in `PRD.md` Section 11:

```typescript
// ✅ Correct: stub with a feature flag and TODO
const TECHNO_DOWNGRADE_PENALTY = process.env.TECHNO_PENALTY_RATE
  ? parseFloat(process.env.TECHNO_PENALTY_RATE)
  : null; // TODO(OQ-01): confirm with stakeholders

// ❌ Wrong: assume it's the same as Opcent/Tele
const TECHNO_DOWNGRADE_PENALTY = 0.50; // invented — no PRD backing
```

### Placement Checklist for Every Generated File

| File type | Must go in |
|-----------|-----------|
| Page component | `Frontend/src/app/(role)/route/page.tsx` |
| Skeleton screen | `Frontend/src/app/(role)/route/loading.tsx` |
| Shared UI primitive | `Frontend/src/components/ui/` |
| Domain-specific component | `Frontend/src/components/[domain]/` |
| Client hook | `Frontend/src/features/[domain]/hooks/` |
| Server action | `Frontend/src/features/[domain]/actions/` or `Backend/src/api/` |
| Pure business logic | `Backend/src/services/` or `Backend/src/utils/` |
| Database query | `Backend/src/repositories/` |
| Orchestration | `Backend/src/services/` |
| Unit test | `TestSuite/vitest/unit/` |
| Integration test | `TestSuite/vitest/integration/` |
| Cypress E2E test | `TestSuite/cypress/e2e/` |
| Shared type / enum | `Backend/src/types/` |
| Shared Zod schema | `Backend/src/types/` |

### Token for Generating a New Feature End-to-End

```
Generate a full feature for [FEATURE NAME] following this sequence:

1. Backend/src/types/        → Domain types + Zod schema
2. Backend/src/services/     → Pure business logic function
3. TestSuite/vitest/unit/    → Unit tests for the business logic
4. Backend/src/repositories/ → Prisma repository function
5. Backend/src/services/     → Service orchestrating logic + repo + audit
6. Backend/src/api/          → Thin route handler (validate → service → respond)
7. TestSuite/vitest/int/     → Integration test for the service
8. Frontend/src/features/    → Client hook or server action
9. Frontend/src/components/  → UI component (skeleton first, then data version)
10. Frontend/src/app/(role)/ → Page component + loading.tsx
11. TestSuite/cypress/e2e/   → Cypress spec for the user journey
```

---

*This document is the engineering constitution for the Berijalan Loyalty Portal. When architecture is ambiguous, default to simplicity, auditability, and explicit business rules. When policy is ambiguous, surface it — never invent it.*

---

**End of AGENTS.md**
