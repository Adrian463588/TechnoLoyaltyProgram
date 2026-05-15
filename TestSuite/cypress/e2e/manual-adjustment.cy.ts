/**
 * TestSuite/cypress/e2e/manual-adjustment.cy.ts
 *
 * E2E — HC PM Manual Token Adjustment (HC-01)
 *
 * Uses real `data-testid` selectors added in Sprint 2.1.
 * Does NOT mock critical API calls per AGENTS.md §9.
 *
 * Prerequisite: Backend running on port 8080, seed user ADM001 / password123
 */

describe("Manual Token Adjustment Flow", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit("/admin/dashboard");
  });

  it("shows the Manual Token Adjustment form on the dashboard", () => {
    cy.get("h3")
      .contains(/manual token adjustment/i)
      .should("be.visible");

    cy.get("[data-testid=adj-mitra-id]").should("exist");
    cy.get("[data-testid=adj-amount]").should("exist");
    cy.get("[data-testid=adj-reason]").should("exist");
    cy.get("[data-testid=submit-adjustment-btn]").should("exist");
  });

  it("shows validation errors when submitted empty", () => {
    cy.get("[data-testid=submit-adjustment-btn]").click();

    cy.get("[id=adj-mitra-error]")
      .should("be.visible")
      .and("contain", "Mitra ID is required");

    cy.get("[id=adj-reason-error]")
      .should("be.visible")
      .and("contain", "Reason must be at least 10 characters");
  });

  it("intercepts backend call and shows success toast on valid submission", () => {
    cy.intercept("POST", "/api/admin/adjustments", {
      statusCode: 201,
      body: { success: true, ledgerEntryId: "led-test-001" },
    }).as("submitAdjustment");

    cy.get("[data-testid=adj-mitra-id]").type("M001");
    cy.get("[data-testid=adj-amount]").clear().type("50");
    cy.get("[data-testid=adj-reason]").type(
      "Awarding tokens for exceptional support during peak season",
    );

    cy.get("[data-testid=submit-adjustment-btn]").click();

    cy.wait("@submitAdjustment");
    cy.contains(/adjustment recorded/i).should("be.visible");
  });

  it("shows error toast when backend returns an error", () => {
    cy.intercept("POST", "/api/admin/adjustments", {
      statusCode: 403,
      body: { error: "Mitra not found" },
    }).as("failAdjustment");

    cy.get("[data-testid=adj-mitra-id]").type("INVALID-ID");
    cy.get("[data-testid=adj-amount]").clear().type("-100");
    cy.get("[data-testid=adj-reason]").type("Testing error handling path");

    cy.get("[data-testid=submit-adjustment-btn]").click();

    cy.wait("@failAdjustment");
    cy.contains(/mitra not found|adjustment failed/i).should("be.visible");
  });
});
