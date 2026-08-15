# Specification — Loyalty E2E Audit and Remediation

## Objective

Make the current backend/frontend project runnable and maintainable while
preserving the approved business contract and proving the critical role flows
with fresh automated evidence.

## Requirements

- Use `8081` as the local backend default and expose compatible `/health` and
  `/api/health` endpoints.
- Keep login as `{ npk, password }`; enforce server-side RBAC and safe errors.
- Make TokenLedger append-only, authoritative by `SUM(amount)`, and idempotent.
- Credit only validated work; debit only in the atomic approved redemption flow.
- Use canonical redemption fulfillment statuses and require documents before
  `COMPLETED`.
- Implement real expiry (`N+3`), JobRun-guarded jobs, snapshots, token-rule
  administration, and in-app notification reads.
- Remove mock snapshots, mock team data, synthetic token fallbacks, and simulated
  claim behavior from production paths.
- Support light and dark themes from shared tokens; light is the default.
- Add real-database integration coverage and repair Cypress selectors/assertions.
- Reach zero lint warnings without weakening rules to hide violations.

## Edge Cases

- Two approval requests for one redemption must produce one debit.
- Rejection/cancellation must not refund a request that was never debited, and
  a refund must not be created twice.
- Expiry and membership jobs must safely skip an already completed JobRun.
- Resigned partners cannot be approved or completed.
- Missing/invalid upload headers, MIME types, rows, and partial transactions
  must fail without mutating committed data.
- Empty/error API responses must render explicit UI states rather than domain
  defaults.
- Existing legacy redemption rows must be migrated without a second debit.

## Verification Commands

```text
npm run lint
npm run typecheck
npm run build:backend
npm run build:frontend
npm run test:unit
npm run test:integration
CYPRESS_BASE_URL=http://localhost:3000 npm run test:e2e --prefix TestSuite
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .
```

## Iteration Budget and Gates

Use at most two build-review rounds per work package. Stop for human input if a
production deployment, destructive migration, missing credential, or new policy
not covered by this specification is required.

## Accepted lint exception

The zero-warning lint gate remains mandatory. Legacy `no-explicit-any` and
unsafe TypeScript rules are temporarily non-blocking while typed DTO and
repository-boundary cleanup continues. This is documented technical debt and
must not be presented as strict type-safety compliance.

## Definition of Done

All requirements above have code/test evidence, all configured quality gates
pass with fresh output, and remaining risks are explicitly documented rather
than marked as complete.
