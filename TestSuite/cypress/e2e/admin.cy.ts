/**
 * TestSuite/cypress/e2e/admin.cy.ts
 * E2E Tests — Admin (HC PM) Flow
 *
 * Tests admin dashboard access, upload page visibility,
 * redemption management, and role-based guards.
 *
 * Prerequisites: dev server running, seed data (ADM001 / password123)
 */

// ── Authenticated flows ──────────────────────────────────────
describe("Admin: Full HC PM Flow", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  // ── Dashboard ─────────────────────────────────────────────
  describe("Dashboard", () => {
    beforeEach(() => cy.visit("/admin/dashboard"));

    it("displays the admin dashboard heading", () => {
      cy.contains("h1", /control|dashboard/i).should("be.visible");
    });

    it("renders the upload nav link", () => {
      cy.get("a[href='/admin/uploads']").should("be.visible");
    });

    it("renders the redemptions nav link", () => {
      cy.get("a[href='/admin/redemptions']").should("be.visible");
    });
  });

  // ── Upload Flow ───────────────────────────────────────────
  describe("Upload Page", () => {
    beforeEach(() => cy.visit("/admin/uploads"));

    it("loads the upload page successfully", () => {
      cy.url().should("include", "/admin/uploads");
    });

    it("displays the upload dropzone or form", () => {
      cy.get("[data-testid=upload-dropzone], [data-testid=upload-form]")
        .should("exist");
    });
  });

  // ── Redemptions ───────────────────────────────────────────
  describe("Redemptions", () => {
    beforeEach(() => cy.visit("/admin/redemptions"));

    it("loads the redemptions page", () => {
      cy.url().should("include", "/admin/redemptions");
    });
  });

  // ── Route guards ──────────────────────────────────────────
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

  it("redirects /admin/dashboard to /login when not logged in", () => {
    cy.visit("/admin/dashboard", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
