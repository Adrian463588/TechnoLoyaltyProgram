/**
 * TestSuite/cypress/pages/LeaderDashboardPage.ts
 *
 * Page Object Model for the Leader Team Dashboard.
 * Centralizes all selectors — update here once when UI changes.
 *
 * SOLID — SRP: only encapsulates selector/navigation logic.
 * DRY: selectors defined once, used in multiple specs.
 */

export class LeaderDashboardPage {
  // ── Navigation ────────────────────────────────────────────────────────────
  visit() {
    return cy.visit("/leader/team");
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  getHeading() {
    return cy.contains("h1", /team|leader|dashboard/i);
  }

  getTeamTable(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid=leader-team-table]");
  }

  getMemberRows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid^=leader-team-member]");
  }

  getStatsSection(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid=leader-team-stats]");
  }
}
