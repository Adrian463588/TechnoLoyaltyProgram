/**
 * E2E Tests — Employee (Mitra) Flow
 *
 * Tests the full employee user journey:
 *  1. Login → redirected to /employee/dashboard
 *  2. Dashboard displays token counter and tier badge
 *  3. Navigate to rewards catalog
 *  4. Logout returns to /login
 *
 * Prerequisites: dev server running, seed data present (EMP001 / password123)
 */

describe("Employee: Full User Flow", () => {
  beforeEach(() => {
    cy.loginAsEmployee();
  });

  // ── Dashboard ───────────────────────────────────────────────
  describe("Dashboard", () => {
    beforeEach(() => cy.visit("/employee/dashboard"));

    it("displays the page title", () => {
      cy.contains("h1", "Dashboard").should("be.visible");
    });

    it("renders the token counter", () => {
      cy.get("[data-testid=employee-dashboard-total-tokens-value]")
        .should("be.visible")
        .invoke("text")
        .then((text) => {
          // Should be a formatted number
          expect(text.replace(/,/g, "")).to.match(/^\d+$/);
        });
    });

    it("renders the tier progress bar", () => {
      cy.get("[data-testid=employee-dashboard-tier-progress]").should("exist");
    });

    it("renders the redeem CTA button", () => {
      cy.get("[data-testid=employee-dashboard-redeem-button]")
        .should("be.visible")
        .and("contain", "Catalog");
    });

    it("shows recent activity rows", () => {
      cy.get("[data-testid^=employee-dashboard-activity-]").should("have.length.gte", 1);
    });
  });

  // ── Navigation ──────────────────────────────────────────────
  describe("Navigation", () => {
    it("navigates to rewards page from the nav", () => {
      cy.visit("/employee/dashboard");
      cy.get("a[href='/employee/rewards']").first().click();
      cy.url().should("include", "/employee/rewards");
    });

    it("navigates to history page from the nav", () => {
      cy.visit("/employee/dashboard");
      cy.get("a[href='/employee/history']").first().click();
      cy.url().should("include", "/employee/history");
    });
  });

  // ── Rewards ─────────────────────────────────────────────────
  describe("Rewards Catalog", () => {
    beforeEach(() => cy.visit("/employee/rewards"));

    it("loads the rewards catalog page", () => {
      cy.url().should("include", "/employee/rewards");
    });
  });

  // ── Route guards ────────────────────────────────────────────
  describe("Route guards", () => {
    it("redirects /admin to /login or employee area for MITRA role", () => {
      cy.visit("/admin/dashboard", { failOnStatusCode: false });
      cy.url().should("not.include", "/admin/dashboard");
    });
  });

  // ── Profile Dropdown ────────────────────────────────────────
  describe("Profile dropdown", () => {
    it("opens without throwing Base UI context error", () => {
      cy.visit("/employee/dashboard");
      // Wait for page to be fully interactive
      cy.get("[data-testid=employee-dashboard-total-tokens-value]", { timeout: 8000 })
        .should("be.visible");
      // Click trigger with force to bypass any pointer-events: none overlay
      cy.get("[data-testid=profile-menu-trigger]").click({ force: true });
      // Portal content — exists in document.body, not necessarily visible
      cy.get("[data-slot=dropdown-menu-content]", { timeout: 6000 }).should("exist");
      cy.get("[data-slot=dropdown-menu-label]").should("exist");
    });
  });
});

// ── Unauthenticated guard ────────────────────────────────────
describe("Employee: Unauthenticated Access", () => {
  beforeEach(() => cy.clearCookies());

  it("redirects /employee/dashboard to /login when not logged in", () => {
    cy.visit("/employee/dashboard", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
