/**
 * E2E Tests — Leader (Team Leader) Flow
 *
 * Tests team leader user workflows with proper authentication.
 * Prerequisites: dev server + DB seeded (LDR001 / password123)
 */

describe("Leader Flow", () => {
  beforeEach(() => {
    cy.loginAsLeader();
  });

  // ── Team Overview ──────────────────────────────────────────

  it("should load the team overview page", () => {
    cy.visit("/leader/team");
    cy.url().should("include", "/leader/team");
    // h1 has text "Team View" (use get, not contains — contains searches text not tag)
    cy.get("h1").should("be.visible").and("contain", "Team View");
  });

  it("should display the team overview table", () => {
    cy.visit("/leader/team");
    cy.get("[data-testid=leader-team-table]").should("exist");
  });

  it("should show stat cards on team page", () => {
    cy.visit("/leader/team");
    cy.get("[data-testid=leader-team-total-tokens]").should("exist");
    cy.get("[data-testid=leader-team-eligible-members]").should("exist");
  });

  // ── Alerts ─────────────────────────────────────────────────

  it("should load the alerts page", () => {
    cy.visit("/leader/alerts");
    cy.url().should("include", "/leader/alerts");
    cy.get("h1").should("be.visible");
  });

  // ── Mobile responsiveness ──────────────────────────────────

  it("should show bottom navigation bar on mobile viewport", () => {
    cy.viewport(390, 844);
    cy.visit("/leader/team");
    // Bottom nav exists and is visible (fixed bottom-0)
    cy.get("nav.fixed.bottom-0").should("be.visible");
  });

  it("should show mobile hamburger menu button on tablet viewport", () => {
    cy.viewport(768, 1024);
    cy.visit("/leader/team");
    cy.get('[aria-label="Toggle menu"]').should("exist");
  });

  it("should open mobile slide-down menu and show Team link", () => {
    cy.viewport(390, 844);
    cy.visit("/leader/team");
    cy.get('[aria-label="Toggle menu"]').click();
    // Mobile nav items appear
    cy.contains("a", "Team").should("exist");
  });

  // ── Profile Dropdown ────────────────────────────────────────

  it("opens profile dropdown from leader header", () => {
    cy.visit("/leader/team");
    // Add data-testid to leader dropdown trigger before clicking
    cy.get("[data-slot=dropdown-menu-trigger]").first().click({ force: true });
    // Portal renders in document.body — wait for it
    cy.get("[data-slot=dropdown-menu-content]", { timeout: 5000 }).should("be.visible");
  });
});

// ── Unauthenticated guard ────────────────────────────────────
describe("Leader: Unauthenticated Access", () => {
  beforeEach(() => cy.clearCookies());

  it("redirects /leader/team to /login when not logged in", () => {
    cy.visit("/leader/team", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
