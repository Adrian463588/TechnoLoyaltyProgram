/**
 * TestSuite/cypress/e2e/leader.cy.ts
 * E2E Tests — Team Leader Flow
 *
 * Covers: team view, partner confirmations, stat cards, route guards.
 * Prerequisite: Backend on port 8080, seed user LDR001 / password123
 */

describe("Leader: Full Team Leader Flow", () => {
  beforeEach(() => {
    cy.loginAsLeader();
  });

  // ── Team View ──────────────────────────────────────────────
  describe("Team View", () => {
    beforeEach(() => cy.visit("/leader/team"));

    it("displays the team view heading", () => {
      cy.contains("h1", /team|leader|dashboard/i).should("be.visible");
    });

    it("renders team member table or empty state", () => {
      cy.get(
        "[data-testid=leader-team-table], [data-testid=leader-team-empty]",
      ).should("exist");
    });

    it("renders team stat cards", () => {
      cy.get("[data-testid=leader-team-total-tokens]").should("exist");
      cy.get("[data-testid=leader-team-eligible-members]").should("exist");
      cy.get("[data-testid=leader-team-alerts-count]").should("exist");
    });

    it("renders View Detail actions for each row", () => {
      cy.get("body").then(($body) => {
        if ($body.find("[data-testid=leader-team-table-row]").length > 0) {
          cy.get("[data-testid=leader-team-table-action-view]")
            .first()
            .should("be.visible");
        }
      });
    });
  });

  // ── Partner Confirmations (TL-01) ──────────────────────────
  describe("Alerts / Partner Confirmations", () => {
    beforeEach(() => cy.visit("/leader/alerts"));

    it("loads the alerts page", () => {
      cy.url().should("include", "/leader/alerts");
    });

    it("renders pending confirmation count badge or all-clear state", () => {
      cy.get(
        "[data-testid=leader-confirmation-row], .text-foreground",
      ).should("exist");
    });

    it("can confirm a partner as Active via intercept", () => {
      cy.intercept(
        "POST",
        "/api/leader/partner-confirmations/*/confirm",
        { statusCode: 200, body: { success: true } },
      ).as("confirmStatus");

      cy.get("body").then(($body) => {
        if ($body.find("[data-testid=leader-confirm-active-btn]").length > 0) {
          cy.get("[data-testid=leader-confirm-active-btn]").first().click();
          cy.wait("@confirmStatus");
          cy.contains(/status confirmed/i).should("be.visible");
        } else {
          cy.log("No pending confirmations — skipping confirm action test");
        }
      });
    });
  });

  // ── Route guards ───────────────────────────────────────────
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

  it("redirects /leader/team to /login", () => {
    cy.visit("/leader/team", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
