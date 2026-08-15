# PLAN — Loyalty E2E Audit and Remediation

## Overview

Stabilize the Loyalty Program monorepo against `PRD.md`,
`PRD_Sprint_2_1_Loyalty_Program.md`, `AGENTS.md`, and `DESIGN.md`. The work is
organized as BMAD-inspired phases: specification, architecture, implementation,
review, and acceptance verification.

## Locked Decisions

- NPK/password is the supported login contract.
- Light mode is the default; dark mode is supported through shared design tokens.
- Techno downgrade penalty is 50%, rounded down.
- Tokens earned in year `N` expire on December 31 of `N+3`.
- Redemption statuses are `DRAFT`, `PENDING_VERIFICATION`, `VERIFIED`,
  `REJECTED`, `PURCHASED`, `PICKUP_SCHEDULED`, `COMPLETED`, and `CANCELLED`.
- Existing dirty and untracked user files are preserved.

## Work Packages

1. **Foundation:** local ports, health aliases, environment validation, safe
   errors/logging, security headers, scripts, and documentation alignment.
2. **Backend integrity:** append-only ledger, SUM balance, idempotency, atomic
   redemption approval, status migration, expiry/jobs, snapshots, token rules,
   notifications, and repository/service layering.
3. **Frontend reliability:** real data only, no synthetic fallbacks, shared
   navbar/dashboard/theme components, async states, accessibility, and stable
   selectors.
4. **Verification:** unit, real-database integration, role-based Cypress E2E,
   lint with zero warnings, typecheck, builds, and security review.

## Requirements Traceability Matrix

| Contract | Source baseline | Implementation evidence | Verification evidence |
|---|---|---|---|
| Login uses NPK + password; server RBAC remains authoritative | `PRD.md`, Sprint 2.1 AUTH-01, `AGENTS.md` | `Backend/src/api/auth.routes.ts`, `Frontend/src/app/(auth)/login/page.tsx`, `Frontend/src/proxy.ts` | Auth and cross-role Cypress specs |
| Local runtime is FE `3000`, API `8081`; both health aliases are public | `AGENTS.md`, `DESIGN.md` runtime contract | `Backend/src/app.ts`, `Frontend/src/app/api/health/route.ts`, `Frontend/src/proxy.ts` | HTTP 200 checks for all three local health URLs |
| Token balance is authoritative `SUM(TokenLedger.amount)` and ledger is append-only | Sprint 2.1 SPR21-REQ-04, `AGENTS.md` | `Backend/src/repositories/token-ledger.repository.ts`, append-only database trigger migration | Real-DB ledger integration test: rollback, SUM, UPDATE/DELETE rejection |
| Credit/debit/expiry/adjustment operations are idempotent and audited | Sprint 2.1 ledger and audit rules, `AGENTS.md` | Token-ledger idempotency keys, `Backend/src/services/audit.service.ts`, upload/redemption/evaluation services | Backend unit/integration tests and service guards |
| Redemption debit occurs only at HC approval after documents, stock, and TL confirmation | Sprint 2.1 redemption flow, `AGENTS.md` | `Backend/src/services/redemption.service.ts`, partner-status service, canonical status migration | Redemption service tests and role E2E coverage |
| Canonical fulfillment lifecycle includes `COMPLETED` | Sprint 2.1 status contract | `Backend/prisma/schema.prisma`, migration, redemption FSM, admin/employee UI status mapping | Typecheck, unit suite, admin/employee Cypress flows |
| Expiry uses earned year `N` → 31 December `N+3`; jobs are JobRun guarded | `AGENTS.md`, Sprint 2.1 expiry/job sections | `Backend/src/services/evaluation.service.ts`, `Backend/src/jobs/worker.ts` | Evaluation unit tests plus integration ledger contract |
| Reminder foundation and in-app notifications are domain-event backed | Sprint 2.1 SPR21-REQ-07 and OQ-NOTIFICATION-CHANNEL | `TOKEN_EXPIRY_REMINDER` audit event, notification repository/service, worker reminder job | Backend unit tests and notification API path |
| Snapshots and token rules are real admin APIs, not mock data | `PRD.md`, Sprint 2.1 HC requirements | snapshot/token-rule controllers, services, repositories/routes, admin snapshot page | Admin Cypress snapshot route and build/typecheck |
| Uploads credit validated source units; no target-balance fallback | Sprint 2.1 upload/ledger rules, `AGENTS.md` | `Backend/src/services/upload-processing.service.ts`, admin upload UI | Backend tests, validation paths, admin Cypress upload controls |
| UI is light-first with optional dark mode, token-driven, and has async states | `DESIGN.md`, `AGENTS.md` | `Frontend/src/components/providers.tsx`, shared navbar, route `loading.tsx`/`error.tsx` files, real API pages | Frontend unit tests, responsive-ready selectors, E2E route coverage |
| No stack traces, signatures, passwords, or secrets are exposed | `AGENTS.md`, security acceptance | error handler/auth logging, environment validation, env-only Cypress/seed passwords, security headers | Full lint/typecheck/build/E2E and manual response checks |

## Acceptance Gate

- `npm run dev:all` starts frontend on `3000` and backend on configured `8081`.
- `/health` and `/api/health` return HTTP 200.
- `npm run lint`, `npm run typecheck`, `npm run test:unit`,
  `npm run test:integration`, and `npm run test:e2e` pass.
- Token balance equals `SUM(TokenLedger.amount)` and duplicate debit/expiry is
  rejected or skipped idempotently.
- Redemption cannot debit before approval, cannot complete without documents,
  and requires active TL/Lead confirmation.
- No production-path mock/fallback business data remains.
- No stack traces, signature material, passwords, or secrets are exposed.

## Safety

No reset, clean, stash, force push, destructive data operation, or production
deployment is part of this plan. Database migrations are first verified against
an isolated test database.

## Accepted lint exception

The zero-warning lint gate remains mandatory. This remediation keeps legacy
`no-explicit-any` and unsafe TypeScript rules non-blocking while typed DTOs and
repository boundaries are completed. The exception is technical debt, not a
claim of strict type-safety compliance, and must be removed in a follow-up
change.
