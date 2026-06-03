# Loyalty TestSuite - Cypress E2E

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
│   ├── e2e/           # Test specs (role-based)
│   │   ├── auth-role-routing.cy.ts
│   │   ├── employee.cy.ts
│   │   ├── leader.cy.ts
│   │   ├── admin.cy.ts
│   │   └── chatbot.cy.ts
│   ├── pages/         # Page Object Models (POM)
│   │   ├── LoginPage.ts
│   │   ├── EmployeeDashboardPage.ts
│   │   ├── LeaderDashboardPage.ts
│   │   ├── AdminDashboardPage.ts
│   │   ├── PortalShellPage.ts
│   │   └── ChatbotWidgetPage.ts
│   ├── fixtures/      # Static test data (JSON)
│   └── support/
│       ├── commands.ts
│       ├── routes.ts
│       ├── selectors.ts
│       ├── users.ts
│       └── e2e.ts
└── cypress.config.ts
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run against the deployed default URL
npm run test:e2e

# 3. Or run against a local/staging environment
CYPRESS_BASE_URL=http://localhost:3000 npm run test:e2e

# 4. Open Cypress UI
npm run test:e2e:open
```

## Test Users (seed data required)

| Role | NPK | Password |
|------|-----|----------|
| MITRA | 34567 | password123 |
| TEAM_LEADER | 23456 | password123 |
| HC_PM | 12345 | password123 |

Override with:

```bash
CYPRESS_EMPLOYEE_NPK=34567 CYPRESS_EMPLOYEE_PASSWORD=password123 npm run test:e2e
CYPRESS_LEADER_NPK=23456 CYPRESS_LEADER_PASSWORD=password123 npm run test:e2e
CYPRESS_ADMIN_NPK=12345 CYPRESS_ADMIN_PASSWORD=password123 npm run test:e2e
```

## POM Rules

- Specs should call page object methods instead of raw selectors.
- Shared route constants live in `cypress/support/routes.ts`.
- Shared stable selectors live in `cypress/support/selectors.ts`.
- Role credentials live in `cypress/support/users.ts`.
- Avoid destructive production mutations in E2E specs; prefer safe page-load, validation, and non-committing assertions.

## ESLint Rules

- `cypress/no-unnecessary-waiting` — **error**: no `cy.wait(number)`
- `cypress/unsafe-to-chain-command` — **error**: no unsafe chaining
- `@typescript-eslint/no-explicit-any` — **error**: no `any` in test helpers

```bash
npm run lint
```
