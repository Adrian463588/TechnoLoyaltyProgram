/**
 * TestSuite/cypress/e2e/leader.cy.ts
 * E2E Tests — Team Leader Flow
 *
 * Tests leader dashboard, team visibility, and role guards.
 *
 * Prerequisites: dev server running, seed data (LDR001 / password123)
 */

// ── Authenticated flows ──────────────────────────────────────
describe("Leader: Full Team Leader Flow", () => {
  beforeEach(() => {
    cy.loginAsLeader();
  });

  // ── Dashboard ─────────────────────────────────────────────
  describe("Dashboard", () => {
    beforeEach(() => cy.visit("/leader/team"));

    it("displays the leader dashboard heading", () => {
      cy.contains("h1", /team|leader|dashboard/i).should("be.visible");
    });

    it("renders team member rows or stats", () => {
      cy.get(
        "[data-testid^=leader-team-member], [data-testid=leader-team-table]"
      ).should("exist");
    });
  });

  // ── Route guards ──────────────────────────────────────────
  describe("Route guards", () => {
    it("blocks leader from /admin routes", () => {
      cy.visit("/admin/dashboard", { failOnStatusCode: false });
      cy.url().should("not.include", "/admin/dashboard");
    });
  });
});

// ── Unauthenticated guard ────────────────────────────────────
describe("Leader: Unauthenticated Access", () => {
  beforeEach(() => cy.clearCookies());

  it("redirects /leader/dashboard to /login when not logged in", () => {
    cy.visit("/leader/team", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
