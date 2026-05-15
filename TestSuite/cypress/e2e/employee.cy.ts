/**
 * TestSuite/cypress/e2e/employee.cy.ts
 * E2E Tests — Employee (Mitra) Flow
 *
 * Uses Page Object Model for clean, readable specs.
 * All selectors are driven by data-testid on the Glassmorphism UI.
 *
 * Prerequisites: dev server running, seed data (EMP001 / password123)
 */

import { EmployeeDashboardPage } from "../pages/EmployeeDashboardPage";

const dashboard = new EmployeeDashboardPage();

// ── Authenticated flows ──────────────────────────────────────
describe("Employee: Full User Flow", () => {
  beforeEach(() => {
    cy.loginAsEmployee();
  });

  // ── Dashboard ─────────────────────────────────────────────
  describe("Dashboard", () => {
    beforeEach(() => { dashboard.visit(); });

    it("displays the page heading", () => {
      dashboard.assertHeadingVisible();
    });

    it("renders and animates the token counter", () => {
      dashboard.assertTokenCounterVisible();
    });

    it("renders the tier progress bar", () => {
      dashboard.assertTierProgressExists();
    });

    it("renders the redeem CTA button with correct label", () => {
      dashboard.assertRedeemButtonVisible();
    });

    it("shows at least one recent activity row", () => {
      dashboard.assertActivityRowsExist(1);
    });
  });

  // ── Navigation ────────────────────────────────────────────
  describe("Navigation", () => {
    it("navigates to rewards page from nav link", () => {
      dashboard.visit();
      cy.get("a[href='/employee/rewards']").first().click();
      cy.url().should("include", "/employee/rewards");
    });

    it("navigates to history page from nav link", () => {
      dashboard.visit();
      cy.get("a[href='/employee/history']").first().click();
      cy.url().should("include", "/employee/history");
    });
  });

  // ── Rewards Catalog ───────────────────────────────────────
  describe("Rewards Catalog", () => {
    beforeEach(() => cy.visit("/employee/rewards"));

    it("loads the rewards catalog page", () => {
      cy.url().should("include", "/employee/rewards");
    });
  });

  // ── Route guards ──────────────────────────────────────────
  describe("Route guards", () => {
    it("blocks MITRA from accessing /admin/dashboard", () => {
      cy.visit("/admin/dashboard", { failOnStatusCode: false });
      cy.url().should("not.include", "/admin/dashboard");
    });
  });

  // ── Profile Dropdown ──────────────────────────────────────
  describe("Profile dropdown", () => {
    it("opens without throwing Base UI context error", () => {
      dashboard.visit().openProfileDropdown();
      cy.get('[data-slot="dropdown-menu-content"]').should("be.visible");
      cy.contains("Alice Optel").should("be.visible");
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
