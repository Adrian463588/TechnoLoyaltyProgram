# AGENTS.md — Loyalty Program Portal

> Sprint 2.1 engineering guide for AI coding agents.  
> Keep this file concise. Product rules live in `PRD_Sprint_2_1_Loyalty_Program.md`. Visual rules live in `DESIGN.md`.

---

## 1. Mission

Sprint 2.1 goal: fix backend and frontend issues, then align the product with the latest Loyalty Program system requirements.

Core business flow:

```txt
Mitra takes shift/project
→ data is validated
→ token is credited
→ Mitra redeems reward
→ HC validates redemption
→ HC confirms active/resigned status with TL/Lead
→ reward is processed
→ token is deducted
→ expired token is handled automatically
```

Roles:

- `MITRA`: view balance, token history, expiry, membership, rewards, and redemption status.
- `HC`: manage token rules, rewards, expiry, manual adjustments, redemptions, uploads, and audit logs.
- `TEAM_LEADER`: confirm partner active/resigned status and view team token/membership summary.

---

## 2. Read Before Coding

Before changing code:

1. Read the relevant requirement in `PRD_Sprint_2_1_Loyalty_Program.md`.
2. Read `DESIGN.md` before editing UI.
3. Identify affected route, service, repository, schema, and tests.
4. Do not invent missing policy. Use `TODO(OQ-...)` and safe feature flags.
5. Keep changes small and testable.

---

## 3. Token-Saving Commands for AI Agents

Use these commands to reduce context and token waste:

```txt
LOW TOKEN MODE:
- Do not summarize files unless asked.
- Do not paste full files.
- Show only changed functions or unified diffs.
- Prefer bullet patch plans over long explanations.
- Ask only when blocked by missing business policy.
- Reuse existing project patterns before proposing new abstractions.
- Do not regenerate PRD/DESIGN content in code answers.
```

Use this implementation prompt:

```txt
Work only on requirement: [REQ-ID].
Return only:
1. Root cause
2. Patch summary
3. Files changed
4. Tests run
5. Remaining TODOs
No full-file output unless necessary.
```

Use this bugfix prompt:

```txt
Fix [ISSUE-ID].
Constraints:
- Thin route/controller.
- Zod validation.
- Server-side RBAC.
- Service handles orchestration.
- Repository handles DB only.
- Domain logic is pure TypeScript.
- Audit log for admin/system mutation.
- TokenLedger append-only.
Output a minimal patch plan first.
```

---

## 4. Repository Layout

```txt
LoyaltyProgram/
├── Frontend/      # Next.js App Router UI
├── Backend/       # API, services, repositories, Prisma/database
├── TestSuite/     # Unit, integration, E2E tests
├── PRD_Sprint_2_1_Loyalty_Program.md
├── DESIGN.md
├── AGENTS.md
└── README.md
```

Placement rules:

| Work type | Location |
|---|---|
| Page route | `Frontend/src/app/(role)/.../page.tsx` |
| Loading UI | `Frontend/src/app/(role)/.../loading.tsx` |
| Domain component | `Frontend/src/components/[domain]/` |
| Client hook | `Frontend/src/features/[domain]/hooks/` |
| API/controller | `Backend/src/api/` or `Backend/src/controllers/` |
| Service | `Backend/src/services/` |
| Repository | `Backend/src/repositories/` |
| Domain logic | `Backend/src/domain/` |
| Validation schema | `Backend/src/validations/` or `Backend/src/types/` |
| Unit test | `TestSuite/vitest/unit/` |
| Integration test | `TestSuite/vitest/integration/` |
| E2E test | `TestSuite/cypress/e2e/` or `TestSuite/playwright/` |

---

## 5. Architecture Rules

Use strict layering:

```txt
Request
→ Route / Controller
→ Auth + Validation Middleware
→ Service
→ Domain Policy / Calculator
→ Repository
→ Database
```

Rules:

- Route handlers validate input and call one service.
- No Prisma/database calls in route handlers.
- Services orchestrate domain logic, repositories, transactions, and audit logs.
- Repositories only access database.
- Domain modules must be pure TypeScript.
- Frontend must not import backend services or repositories.
- Prefer Server Components for data display.
- Use Client Components only for forms, browser state, animation, or interaction.

---

## 6. Non-Negotiable Business Rules

### Token Ledger

`TokenLedger` is append-only.

Allowed:

```sql
INSERT INTO token_ledger ...
```

Forbidden:

```sql
UPDATE token_ledger SET ...
DELETE FROM token_ledger WHERE ...
```

Balance rule:

```txt
balance = SUM(token_ledger.amount)
```

Never trust token balance from client input.

### Audit Log Required For

- Token credited.
- Token debited.
- Token expired.
- Manual token adjustment.
- Membership upgraded.
- Membership downgraded.
- Membership reset.
- Redemption status changed.
- Upload committed.
- Partner status confirmed or changed.
- Reward item created, edited, or deactivated.

### Division Rules

- Opcent and Tele use slot-based yearly evaluation.
- Techno uses project-based 6-month evaluation.
- Keep both calculators separate behind a shared interface.
- Do not hardcode Techno downgrade/reset penalty until confirmed.

Correct pattern:

```ts
const technoPenaltyRate = process.env.TECHNO_PENALTY_RATE
  ? Number(process.env.TECHNO_PENALTY_RATE)
  : null; // TODO(OQ-TECHNO-PENALTY): confirm with stakeholders
```

---

## 7. Frontend Rules

- Every data route must have `loading.tsx`.
- Use skeleton loading, not spinner-only UI.
- Every async view needs loading, empty, and error states.
- Use `DESIGN.md` tokens. Do not hardcode random colors.
- Phase 1 is dark mode only.
- Use bento grid dashboard layout.
- Use glassmorphism card style.
- Token number must be visually prominent.
- Role guards live in route layouts/middleware and server actions, not only inside page components.
- Add `data-testid` only for stable E2E selectors.
- Meet WCAG 2.1 AA.

---

## 8. Backend Rules

- Validate mutation payloads with Zod.
- Use typed domain errors.
- Do not throw raw string errors.
- Do not expose stack traces or internal error details.
- Do not expose admin-only fields to Mitra or Team Leader.
- Redemption eligibility must be rechecked on the server.
- File uploads must validate MIME type and parsed file header.
- Scheduled jobs must be idempotent.
- Every scheduled job needs a `JobRun` guard.

Idempotency pattern:

```ts
const existingRun = await jobRunRepository.findByPeriod(jobName, periodKey);
if (existingRun) return { skipped: true };
```

---

## 9. Testing Rules

Policy-critical flows require tests:

- Token calculation.
- Token credit.
- Token debit.
- Token expiry.
- Manual token adjustment.
- Membership upgrade/downgrade/reset.
- Redemption eligibility.
- Redemption approval/rejection.
- Role-based access.
- Upload validation and commit.
- Scheduled job idempotency.

Test levels:

- Unit: pure domain functions only.
- Integration: service + repository + test database.
- E2E: real user role flow. Do not mock critical APIs.

E2E selectors:

- Prefer user-facing roles/text.
- Use `data-testid` only for stable domain selectors.
- Do not select by CSS class.

---

## 10. Sprint 2.1 Fix Workflow

For every issue:

1. Reproduce the issue.
2. Link it to PRD requirement or bug ID.
3. Identify root cause.
4. Patch smallest safe layer.
5. Add or update tests for critical behavior.
6. Run relevant quality gates.
7. Document remaining risks.

Severity handling:

| Severity | Meaning | Action |
|---|---|---|
| S0 | Login, token correctness, redemption correctness, or data integrity broken | Fix immediately |
| S1 | Role flow, admin mutation, upload, or membership calculation broken | Fix before sprint close |
| S2 | UI state, validation message, responsive issue | Fix when in touched scope |
| S3 | Cosmetic only | Defer unless very low risk |

---

## 11. Commands

Run before marking work done:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
```

For UI or user-flow changes:

```bash
pnpm test:e2e
```

Do not claim tests passed unless they were actually run.

---

## 12. Definition of Done

A task is done only when:

- It matches a PRD requirement or issue ID.
- Business rules are not in UI components.
- Server-side role checks exist.
- Validation exists for mutations.
- Audit logs exist for required mutations.
- TokenLedger remains append-only.
- Async UI has loading, empty, and error states.
- Accessibility and responsive behavior are checked.
- Tests are added or updated for critical behavior.
- Quality gates pass or failures are documented honestly.

---

## 13. Anti-Patterns

Do not:

- Invent business policy.
- Hardcode token thresholds in React components.
- Update or delete token ledger rows.
- Put business logic in route handlers.
- Rely only on client-side role checks.
- Check redemption eligibility only on the client.
- Hide errors with generic catch blocks.
- Use `any` without a documented reason.
- Fetch the same data repeatedly in parent and child components.
- Use spinner-only loading for data-heavy pages.
- Skip audit logs for admin mutations.
- Mock critical APIs in E2E tests.
- Paste full files into AI chat when a diff is enough.

---

## 14. PR Template

```md
## Summary

## Linked Requirement / Issue

## Root Cause

## Changes

## Test Evidence

## Screenshots / Recordings

## Migration Notes

## Rollout Notes

## Checklist
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E added/updated for critical flows
- [ ] Server-side RBAC verified
- [ ] Zod validation added/updated
- [ ] Audit logging confirmed
- [ ] TokenLedger append-only behavior preserved
- [ ] Responsive behavior checked at 375px, 768px, 1280px
- [ ] No invented policy
```
