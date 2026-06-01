/**
 * cypress/e2e/employee.cy.ts
 *
 * Spec: MITRA (employee) role — full page coverage.
 *
 * Covers:
 * - Dashboard: heading, token value, tier progress, redeem CTA, activity area
 * - Dashboard → Rewards navigation via redeem button
 * - Rewards: page load, reward modal when available
 * - History: page load, table or empty state
 * - Documents: page load, document types visible
 * - Profile: page load, profile menu accessible
 * - Route guard: MITRA blocked from admin routes
 */

import {
  EmployeeDashboardPage,
  EmployeeRewardsPage,
  EmployeeHistoryPage,
  EmployeeDocumentsPage,
  EmployeeProfilePage,
} from "../pages/EmployeePages";
import { PortalShellPage } from "../pages/PortalShellPage";
import { routes } from "../support/routes";

const dashboard = new EmployeeDashboardPage();
const rewards   = new EmployeeRewardsPage();
const history   = new EmployeeHistoryPage();
const documents = new EmployeeDocumentsPage();
const profile   = new EmployeeProfilePage();
const shell     = new PortalShellPage();

describe("MITRA — Dashboard", () => {
  beforeEach(() => cy.loginAsRole("MITRA"));

  it("loads with visible heading", () => {
    dashboard.visit().assertLoaded();
  });

  it("displays a numeric token balance", () => {
    dashboard.visit().assertLoaded().assertTokenDisplayed();
  });

  it("shows the tier progress element", () => {
    dashboard.visit().assertLoaded().assertTierProgressExists();
  });

  it("has a visible redeem CTA button", () => {
    dashboard.visit().assertLoaded().assertRedeemButtonVisible();
  });

  it("renders activity area or empty state", () => {
    dashboard.visit().assertLoaded().assertActivityAreaRendered();
  });

  it("navigates to rewards page when redeem button is clicked", () => {
    dashboard.visit().assertLoaded().clickRedeemButton();
    cy.url().should("include", routes.employee.rewards);
  });
});

describe("MITRA — Rewards", () => {
  beforeEach(() => cy.loginAsRole("MITRA"));

  it("loads rewards catalog or locked state without server error", () => {
    rewards.visit().assertLoaded();
  });

  it("opens confirmation dialog for first available reward", () => {
    rewards.visit().assertLoaded().openFirstRewardIfAvailable();
  });
});

describe("MITRA — History", () => {
  beforeEach(() => cy.loginAsRole("MITRA"));

  it("loads history page with heading", () => {
    history.visit().assertLoaded();
  });

  it("shows table or empty state", () => {
    history.visit().assertLoaded().assertTableOrEmptyState();
  });
});

describe("MITRA — Documents", () => {
  beforeEach(() => cy.loginAsRole("MITRA"));

  it("loads documents page with correct content", () => {
    documents.visit().assertLoaded().assertNoServerError();
  });
});

describe("MITRA — Profile & navigation", () => {
  beforeEach(() => cy.loginAsRole("MITRA"));

  it("loads profile settings page", () => {
    profile.visit().assertLoaded();
  });

  it("can open the profile menu from the navbar", () => {
    profile.visit();
    shell.openProfileMenu().assertProfileMenuVisible();
  });
});

describe("MITRA — Route guards", () => {
  beforeEach(() => cy.loginAsRole("MITRA"));

  it("cannot access HC admin dashboard", () => {
    shell.assertRedirectedAwayFrom(routes.admin.dashboard);
  });

  it("cannot access leader team page", () => {
    shell.assertRedirectedAwayFrom(routes.leader.team);
  });
});

describe("MITRA — Unauthenticated access", () => {
  it("redirects /employee/dashboard to /login when logged out", () => {
    shell.assertAnonymousRedirect(routes.employee.dashboard);
  });
});
