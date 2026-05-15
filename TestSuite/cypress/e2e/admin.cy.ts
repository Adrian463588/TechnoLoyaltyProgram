/**
 * TestSuite/cypress/e2e/admin.cy.ts
 * E2E Tests — Admin (HC PM) Flow
 *
 * Covers: dashboard, uploads, redemptions, manual adjustment, route guards.
 * Prerequisite: Backend on port 8080, seed user ADM001 / password123
 */

describe("Admin: Full HC PM Flow", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  // ── Dashboard ──────────────────────────────────────────────
  describe("Dashboard", () => {
    beforeEach(() => cy.visit("/admin/dashboard"));

    it("displays the admin dashboard heading", () => {
      cy.contains("h1", /control|dashboard|admin/i).should("be.visible");
    });

    it("renders upload nav link", () => {
      cy.get("a[href='/admin/uploads']").should("be.visible");
    });

    it("renders redemptions nav link", () => {
      cy.get("a[href='/admin/redemptions']").should("be.visible");
    });

    it("renders the Manual Token Adjustment form", () => {
      cy.get("[data-testid=adj-mitra-id]").should("exist");
      cy.get("[data-testid=submit-adjustment-btn]").should("exist");
    });
  });

  // ── Upload Flow ────────────────────────────────────────────
  describe("Upload Page", () => {
    beforeEach(() => cy.visit("/admin/uploads"));

    it("loads the upload page", () => {
      cy.url().should("include", "/admin/uploads");
    });

    it("displays the upload dropzone or form", () => {
      cy.get("[data-testid=upload-dropzone], [data-testid=upload-form]").should(
        "exist",
      );
    });
  });

  // ── Redemptions ────────────────────────────────────────────
  describe("Redemptions", () => {
    beforeEach(() => cy.visit("/admin/redemptions"));

    it("loads the redemptions page", () => {
      cy.url().should("include", "/admin/redemptions");
    });

    it("renders the redemptions table or empty state", () => {
      cy.get(
        "[data-testid=redemptions-table], [data-testid=redemptions-empty]",
      ).should("exist");
    });
  });

  // ── Manual Adjustment validation ───────────────────────────
  describe("Manual Adjustment", () => {
    beforeEach(() => cy.visit("/admin/dashboard"));

    it("shows validation errors on empty submit", () => {
      cy.get("[data-testid=submit-adjustment-btn]").click();
      cy.get("[id=adj-mitra-error]")
        .should("be.visible")
        .and("contain", "Mitra ID is required");
    });
  });

  // ── Route guards ───────────────────────────────────────────
  describe("Route guards", () => {
    it("allows admin to access /admin routes", () => {
      cy.visit("/admin/dashboard");
      cy.url().should("include", "/admin");
    });
  });
});

// ── Unauthenticated guard ────────────────────────────────────
describe("Admin: Unauthenticated Access", () => {
  beforeEach(() => cy.clearCookies());

  it("redirects /admin/dashboard to /login", () => {
    cy.visit("/admin/dashboard", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
