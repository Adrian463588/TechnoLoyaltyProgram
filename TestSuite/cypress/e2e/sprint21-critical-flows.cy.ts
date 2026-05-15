describe("Sprint 2.1 critical role journeys", () => {
  it("MITRA views dashboard and submits a redemption request from rewards", () => {
    cy.loginAsEmployee();
    cy.visit("/employee/dashboard");
    cy.get("[data-testid=employee-dashboard-heading]").should("be.visible");
    cy.get("[data-testid=employee-dashboard-total-tokens-value]").should("be.visible");

    cy.visit("/employee/rewards");
    cy.contains("h1", /rewards|catalog/i).should("be.visible");
    cy.get("body").then(($body) => {
      const redeemButtons = $body.find("[data-testid^=redeem-btn-]");
      if (redeemButtons.length === 0) {
        cy.contains(/no rewards|empty|unavailable/i).should("exist");
        return;
      }

      cy.get("[data-testid^=redeem-btn-]").first().click();
      cy.get("[data-testid=confirm-redeem-btn]").should("be.visible").click();
      cy.contains(/submitted|success|redeemed|request/i).should("be.visible");
    });
  });

  it("HC_PM validates manual adjustment and can record a seeded user adjustment", () => {
    cy.loginAsAdmin();
    cy.visit("/admin/dashboard");

    cy.get("[data-testid=submit-adjustment-btn]").click();
    cy.get("#adj-mitra-error").should("contain", "Mitra ID is required");
    cy.get("#adj-reason-error").should("contain", "Reason must be at least 10 characters");

    cy.get("#adj-mitra-id").clear();
    cy.get("#adj-mitra-id").type("34567");
    cy.get("#adj-amount").clear();
    cy.get("#adj-amount").type("10");
    cy.get("#adj-reason").clear();
    cy.get("#adj-reason").type("E2E audit-backed adjustment");
    cy.get("[data-testid=submit-adjustment-btn]").click();
    cy.contains(/adjustment recorded/i).should("be.visible");

    cy.visit("/admin/audit");
    cy.contains(/TOKEN_MANUAL_ADJUST|Manual|Audit Events/i).should("be.visible");
  });

  it("HC_PM opens redemption management and document verification when data exists", () => {
    cy.loginAsAdmin();
    cy.visit("/admin/redemptions");
    cy.contains("h1", /redemption/i).should("be.visible");

    cy.get("body").then(($body) => {
      const manageButtons = $body.find("[data-testid^=manage-btn-]");
      if (manageButtons.length === 0) {
        cy.contains(/no redemption|empty|requests/i).should("exist");
        return;
      }

      cy.get("[data-testid^=manage-btn-]").first().click();
      cy.get("[data-testid=verify-redemption-drawer]").should("be.visible");
      cy.get("[data-testid=approve-redemption-btn]").should("exist");
    });
  });

  it("TEAM_LEADER views team summary and handles pending partner confirmations", () => {
    cy.loginAsLeader();
    cy.visit("/leader/team");
    cy.get("[data-testid=leader-team-total-tokens]").should("exist");
    cy.get("[data-testid=leader-team-table]").should("exist");

    cy.visit("/leader/alerts");
    cy.contains("h1", /alerts|confirmation/i).should("be.visible");
    cy.get("body").then(($body) => {
      const activeButtons = $body.find("[data-testid=leader-confirm-active-btn]");
      if (activeButtons.length === 0) {
        cy.contains(/no pending|all clear|confirmation/i).should("exist");
        return;
      }

      cy.get("[data-testid=leader-confirm-active-btn]").first().click();
      cy.contains(/confirmed|success|active/i).should("be.visible");
    });
  });

  it("HC_PM validates admin upload file headers", () => {
    cy.loginAsAdmin();
    cy.visit("/admin/uploads");
    cy.get("[data-testid=upload-dropzone]").should("exist");

    cy.get("input[type=file]").selectFile(
      {
        contents: Cypress.Buffer.from("npk,name,email\n99999,E2E User,e2e@example.com\n"),
        fileName: "loyalty-e2e.csv",
        mimeType: "text/csv",
      },
      { force: true },
    );

    cy.get("[data-testid=upload-file-selected]").should("exist");
    cy.get("[data-testid=commit-btn]").should("exist");
  });
});
