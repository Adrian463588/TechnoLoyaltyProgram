/**
 * E2E Tests — Admin (HC_PM) Flow
 *
 * Tests admin user workflows:
 *  1. Login → redirected to /admin/dashboard
 *  2. Dashboard renders key metrics
 *  3. Upload page: drag-drop area visible, file upload triggers client-side parse
 *  4. Redemptions list: visible and filterable
 *
 * Prerequisites: dev server running, seed data present (ADM001 / password123)
 */

describe("Admin: Full User Flow", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  // ── Dashboard ───────────────────────────────────────────────
  describe("Dashboard", () => {
    beforeEach(() => cy.visit("/admin/dashboard"));

    it("loads admin dashboard", () => {
      cy.url().should("include", "/admin");
    });

    it("renders total employees stat card", () => {
      cy.get("[data-testid=stat-card]").should("have.length.gte", 1);
    });
  });

  // ── Uploads ─────────────────────────────────────────────────
  describe("Upload Page", () => {
    beforeEach(() => cy.visit("/admin/uploads"));

    it("displays the file upload dropzone", () => {
      cy.get("[data-testid=upload-dropzone]").should("be.visible");
    });

    it("uploads an Optel CSV fixture and shows file preview", () => {
      cy.get("[data-testid=upload-dropzone]").should("be.visible");

      // Select a division first
      cy.get("[data-testid=division-select]").click();
      cy.contains("[role=option]", "Optel").click();

      // Use the hidden file input
      cy.get("[data-testid=file-input]").selectFile(
        { contents: "cypress/fixtures/optel-sample.csv", mimeType: "text/csv" },
        { action: "select", force: true }
      );

      // Client-side parsing then shows the preview panel — allow more time
      cy.get("[data-testid=upload-file-selected]", { timeout: 15000 }).should("exist");
    });
  });

  // ── Redemptions ─────────────────────────────────────────────
  describe("Redemptions Page", () => {
    beforeEach(() => cy.visit("/admin/redemptions"));

    it("loads the redemptions list page", () => {
      cy.url().should("include", "/admin/redemptions");
    });

    it("renders the redemptions table header", () => {
      cy.get("table thead tr").should("exist");
    });

    it("shows status filter dropdown", () => {
      cy.get("[data-testid=redemption-status-filter]").should("exist");
    });
  });

  // ── Route guards ────────────────────────────────────────────
  describe("Route guards", () => {
    it("can access /leader routes (HC_PM has leader+ access)", () => {
      cy.visit("/leader/team", { failOnStatusCode: false });
      cy.url().should("include", "/leader");
    });
  });
});

// ── Unauthenticated ──────────────────────────────────────────
describe("Admin: Unauthenticated Access", () => {
  beforeEach(() => cy.clearCookies());

  it("redirects /admin/dashboard to /login", () => {
    cy.visit("/admin/dashboard", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });

  it("redirects /admin/uploads to /login", () => {
    cy.visit("/admin/uploads", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
