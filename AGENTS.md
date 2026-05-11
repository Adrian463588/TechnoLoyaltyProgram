<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# AGENTS.md

## Purpose

This document defines how AI coding agents and human engineers should plan, build, review, and evolve the Berijalan Employee Loyalty Program Portal. It sets delivery standards for a production-grade Next.js application with strong product alignment, clear ownership boundaries, and maintainable engineering practices.

## Product Context

The system is an internal loyalty portal for employees in the Optel and Techno divisions. It manages monthly loyalty data ingestion, token calculation, tier logic, reward catalog access, redeem-day validation, and fulfillment tracking.

The product has three primary user roles:

- **Mitra (Employee):** checks points, tier progress, and reward eligibility.
- **HC PM (Admin):** uploads data, runs processing, verifies redemptions, and manages operational workflows.
- **Team Leader:** monitors team progress and reward readiness.

## Build Principles

- Build for clarity before decoration.
- Prefer simple, auditable workflows over clever abstractions.
- Keep business rules explicit, testable, and versionable.
- Optimize the first session for understanding total points, tier, and reward eligibility.
- Protect data integrity at every ingestion and redemption step.
- Ship interfaces that are accessible, responsive, and easy for internal users to learn.

## Required Stack

The website must use the following stack unless there is an approved architecture decision record stating otherwise:

- **Framework:** Next.js (latest stable, App Router)
- **Language:** TypeScript with strict mode enabled
- **Database:** PostgreSQL
- **ORM:** Prisma or Drizzle (choose one and stay consistent)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form with Zod validation
- **Auth:** NextAuth, Auth.js, or internal SSO-compatible session layer depending on infrastructure
- **Tables and data grids:** TanStack Table where needed
- **State strategy:** server state first; client state only when necessary
- **Testing:** Vitest or Jest for unit tests, Playwright for end-to-end flows
- **Package Manager:** pnpm preferred

## Architecture Rules

### 1. App Structure

Use Next.js App Router and keep the codebase modular.

Recommended structure:

```text
src/
  app/
    (public)/
    (employee)/
    (leader)/
    (admin)/
    api/
  components/
    ui/
    shared/
    dashboard/
    rewards/
    uploads/
  features/
    auth/
    loyalty-engine/
    redemptions/
    uploads/
    users/
    tiers/
    snapshots/
  lib/
    auth/
    db/
    permissions/
    validations/
    utils/
  server/
    services/
    repositories/
    policies/
  types/
```

Rules:

- Keep reusable presentational primitives in `components/ui`.
- Keep domain logic in `features` or `server/services`, not in page components.
- Use route groups to separate employee, leader, and admin experiences.
- Avoid mixing database access directly into client components.

### 2. Server-First Data Flow

Default to server components, server actions, and route handlers where appropriate.

Guidelines:

- Fetch secure loyalty data on the server by default.
- Use client components only for interactivity that truly requires browser state.
- Keep mutation logic server-side.
- Revalidate caches intentionally after uploads, rule runs, and redemption updates.

### 3. Domain Boundaries

The following business capabilities should remain clearly separated:

- Authentication and authorization
- Employee profile and role mapping
- Monthly uploads
- Loyalty calculation engine
- Period and snapshot management
- Reward catalog
- Redemption workflow
- Team visibility
- Audit logging

Do not collapse these into one generic service layer.

## Coding Standards

### TypeScript

- Enable `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` when practical.
- Do not use `any` unless there is a documented temporary exception.
- Model domain concepts with explicit types: `Division`, `Period`, `RewardRequestStatus`, `PartnershipStatus`, and similar enums or unions.
- Prefer type-safe schemas shared between frontend validation and backend validation.

### React and Next.js

- Keep components small and focused.
- Prefer composition over prop-heavy monolith components.
- Do not fetch the same data in multiple nested components.
- Use loading, empty, and error states for every important async view.
- Avoid unnecessary client-side global state.

### Styling

- Use Tailwind utility classes consistently.
- Use shadcn/ui as the base design system.
- Keep visual style clean, professional, and dashboard-oriented.
- Prioritize readability of key metrics over decorative UI.
- Build mobile-first and test at common breakpoints.
- Support light and dark mode only if requested by stakeholders; otherwise optimize for a clear internal dashboard theme.

### Accessibility

- All actions must be keyboard reachable.
- Every form control must have a visible label.
- Use semantic headings and landmarks.
- Ensure contrast is sufficient for all data displays and status chips.
- Avoid conveying status by color alone.

## Product UX Priorities

### First-Use Experience

A first-time employee user should be able to answer these questions within seconds of login:

1. How many tokens do I have?
2. What tier am I in?
3. Can I redeem anything right now?

Design the dashboard to expose these answers above the fold.

### Repeated Use

The product should encourage repeat usage through:

- visible point growth,
- clear tier progress,
- reward discovery,
- team progress visibility for leaders,
- and status transparency when a reset, downgrade, or ineligibility rule applies.

### Operational Efficiency

Admin workflows must minimize repetitive manual work. File validation, processing feedback, and exception handling should be explicit so HC PM can trust the system.

## Business Logic Guidance

### 1. Division-Specific Logic

Support both divisions in a unified product while keeping calculation logic isolated by policy:

- **Optel:** slot-based earning inputs
- **Techno:** sprint-based earning inputs

Do not hardcode mixed formulas inside UI components.

### 2. Fixed Periods

The system must respect two earning periods:

- **P1:** December 16 to June 15
- **P2:** June 16 to December 15

Agents must treat these dates as core policy rules, not editable UI content, unless the product team explicitly introduces a configurable rule framework.

### 3. Snapshots and Cut-Offs

At period cut-off, the platform must preserve a reliable snapshot used for redemption logic and audit history.

Engineering rules:

- snapshot creation must be idempotent,
- snapshot data must be traceable to source records,
- later uploads must not mutate historical snapshots silently.

### 4. Reset and Downgrade Logic

Reset and downgrade rules are sensitive policy logic and must live in well-tested domain modules.

Rules for implementation:

- never bury reset logic in UI event handlers,
- provide reason codes or explanation outputs,
- log when and why a reset or downgrade happened,
- make rule evaluation testable with fixtures.

### 5. Redemption Validation

Before a request is verified, the system must confirm:

- user has enough tokens,
- partnership status is active,
- user is not resigned,
- redeem timing is valid,
- item is currently redeemable.

Keep validation logic shared between UI messaging and backend enforcement.

## Data Model Expectations

Minimum core entities:

- `User`
- `Role`
- `Division`
- `MonthlyUpload`
- `UploadRow` or import staging records
- `TokenLedger`
- `PeriodSnapshot`
- `RewardItem`
- `RewardRequest`
- `RewardRequestStatusHistory`
- `AuditLog`

Implementation rules:

- Use immutable history records for audit-sensitive workflows.
- Prefer append-only event history for status transitions.
- Add timestamps to all operational entities.
- Include actor identity on admin-generated events.

## File Upload Standards

Monthly file ingestion is mission critical. Agents must build for correctness before convenience.

Requirements:

- validate template structure before import,
- separate parsing, validation, staging, and commit steps,
- show row-level issues to admins,
- support safe retry behavior,
- never partially commit a broken batch without explicit policy,
- store original file metadata for traceability.

Recommended pipeline:

1. Upload file.
2. Parse into staging rows.
3. Validate headers and row schema.
4. Run business rule prechecks.
5. Show preview and errors.
6. Confirm commit.
7. Execute processing and log results.

## Security and Permissions

Agents must treat this as an internal system with sensitive employee and operational data.

Rules:

- enforce role checks in server code, not only in navigation,
- do not expose admin-only fields to unauthorized clients,
- sanitize file uploads and validate MIME plus content shape,
- protect all mutation endpoints against unauthorized access,
- log privileged actions,
- avoid leaking personal data in client logs or error messages.

## Testing Standards

### Unit Tests

Write unit tests for:

- token calculation logic,
- period assignment,
- reset and downgrade rules,
- redemption eligibility checks,
- upload validators and mappers.

### Integration Tests

Write integration tests for:

- monthly upload processing,
- snapshot generation,
- role-based data access,
- redemption state transitions.

### End-to-End Tests

Write Playwright tests for:

- employee login to dashboard visibility,
- admin upload flow,
- reward redemption request flow,
- team leader visibility flow,
- rejection and validation error scenarios.

### Testing Rule

No pull request should merge if policy-critical flows lack automated coverage.

## Observability and Auditability

Agents should implement baseline operational visibility.

Minimum expectations:

- structured server logs for admin actions,
- traceable upload processing results,
- audit records for rule-triggered changes,
- status history for reward requests,
- actionable error messages for failed imports and failed validations.

## Performance Expectations

- Keep employee dashboard fast and focused.
- Paginate or virtualize large admin tables where needed.
- Avoid loading heavy charting or table logic on routes that do not need them.
- Prefer indexed database access for user, ledger, and request lookups.
- Cache read-heavy dashboard queries carefully, but never cache sensitive data across users.

## Delivery Workflow for Agents

### 1. Before Coding

- Read the PRD first.
- Confirm the target role and user journey being implemented.
- Identify affected business rules.
- List acceptance criteria before touching code.

### 2. During Coding

- Implement server-side permission checks first.
- Build domain logic before polishing UI.
- Add tests for policy-sensitive behavior.
- Keep commits scoped to one concern.

### 3. Before Opening a PR

- Run lint, typecheck, and tests.
- Check empty, loading, and error states.
- Verify responsive behavior.
- Verify role boundaries manually.
- Confirm audit logging for admin mutations.

## Definition of Done

A feature is only done when:

- product behavior matches the PRD,
- business rules are implemented and tested,
- role permissions are enforced server-side,
- loading, empty, and error states exist,
- accessibility basics are covered,
- analytics or logs are added where operationally needed,
- and documentation is updated if logic or workflows changed.

## Pull Request Expectations

Every PR should include:

- a clear summary,
- linked requirement or user story,
- screenshots or recordings for UI changes,
- test evidence,
- migration notes if schema changed,
- and rollout considerations if operational behavior changed.

## Anti-Patterns to Avoid

Do not:

- put token formulas directly in UI components,
- hide important rule failures behind generic error messages,
- rely only on client-side validation for redemption or uploads,
- mix admin and employee concerns in the same route tree without clear guards,
- create generic “god services” for all loyalty behavior,
- skip audit logs for manual admin actions,
- or ship dashboard widgets that do not map to real user decisions.

## Suggested Initial Build Order

1. Authentication and role-based route protection
2. User and role model setup
3. Monthly upload pipeline and staging
4. Loyalty engine and ledger generation
5. Employee dashboard
6. Reward catalog and redemption flow
7. Team leader views
8. Snapshot and audit history
9. Operational refinements and analytics

## Collaboration Note

When product rules are ambiguous, agents should preserve flexibility in the architecture but avoid inventing policy. Open questions should be surfaced quickly, especially for token formulas, downgrade conditions, reset criteria, and fulfillment SLAs.
