# Loyalty TestSuite — Cypress E2E

Standalone Cypress E2E test suite for the Berijalan Employee Loyalty Program Portal.

## Tech Stack

| Tool | Version |
|------|---------|
| Cypress | ^15 |
| TypeScript | ^5 |
| ESLint | 9 + eslint-plugin-cypress |

## Directory Structure

```
TestSuite/
├── cypress/
│   ├── e2e/           ← Test specs (role-based)
│   │   ├── auth.cy.ts
│   │   ├── employee.cy.ts
│   │   ├── leader.cy.ts
│   │   └── admin.cy.ts
│   ├── pages/         ← Page Object Models (POM)
│   │   ├── LoginPage.ts
│   │   ├── EmployeeDashboardPage.ts
│   │   ├── LeaderDashboardPage.ts
│   │   └── AdminDashboardPage.ts
│   ├── fixtures/      ← Static test data (JSON)
│   └── support/
│       ├── commands.ts   ← Custom cy.* commands
│       └── e2e.ts        ← Global hooks
└── cypress.config.ts
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Make sure Frontend dev server is running
# (in Frontend/) npm run dev

# 3. Run headless
npm run test:e2e

# 4. Open Cypress UI
npm run test:e2e:open

# 5. Against a different environment
CYPRESS_BASE_URL=https://staging.example.com npm run test:e2e
```

## Test Users (seed data required)

| Role | NPK | Password |
|------|-----|----------|
| MITRA | EMP001 | password123 |
| TEAM_LEADER | LDR001 | password123 |
| HC_PM | ADM001 | password123 |

## ESLint Rules

- `cypress/no-unnecessary-waiting` — **error**: no `cy.wait(number)`
- `cypress/unsafe-to-chain-command` — **error**: no unsafe chaining
- `@typescript-eslint/no-explicit-any` — **error**: no `any` in test helpers

```bash
npm run lint
```
