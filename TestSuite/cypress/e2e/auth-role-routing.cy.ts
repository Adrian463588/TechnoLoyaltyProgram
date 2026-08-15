/**
 * cypress/e2e/auth-role-routing.cy.ts
 *
 * Spec: Authentication flows and role-based route guards.
 *
 * Covers:
 * - Login page renders and validates correctly
 * - Demo dock fills credentials
 * - Wrong credentials shows error
 * - Each role is routed to its correct home after login
 * - Anonymous users are redirected to /login from any protected route
 * - MITRA is blocked from admin routes
 * - TEAM_LEADER is blocked from admin routes
 */

import { LoginPage } from "../pages/LoginPage";
import { PortalShellPage } from "../pages/PortalShellPage";
import { routes } from "../support/routes";
import { getDefaultNpk } from "../support/users";

const login = new LoginPage();
const shell = new PortalShellPage();

// ── Login form ─────────────────────────────────────────────────────────────
describe("Login page", () => {
  beforeEach(() => {
    login.visit();
  });

  it("renders the NPK, password and submit fields", () => {
    login.assertLoaded();
  });

  it("shows validation errors on empty submit", () => {
    login.submit().assertInvalidSubmitErrors();
  });

  it("shows an error alert for wrong credentials", () => {
    login.fillNpk("00000").fillPassword("wrongpass").submit().assertLoginError();
  });

  it("demo dock fills employee NPK when account is selected", () => {
    const employeeNpk = getDefaultNpk("MITRA");
    login.openDemoDock().selectDemoAccount("Alice (Emerald)");
    login.assertNpkValue(employeeNpk);
  });
});

// ── Role-based routing ─────────────────────────────────────────────────────
describe("Role routing after login", () => {
  it("routes MITRA to /employee/dashboard", () => {
    cy.loginAsRole("MITRA");
    shell.assertRoleHome("MITRA");
  });

  it("routes TEAM_LEADER to /leader/dashboard", () => {
    cy.loginAsRole("TEAM_LEADER");
    shell.assertRoleHome("TEAM_LEADER");
  });

  it("routes HC_PM to /admin/dashboard", () => {
    cy.loginAsRole("HC_PM");
    shell.assertRoleHome("HC_PM");
  });
});

// ── Anonymous access ───────────────────────────────────────────────────────
describe("Anonymous access → redirected to login", () => {
  const protectedRoutes = [
    routes.employee.dashboard,
    routes.leader.team,
    routes.admin.dashboard,
    routes.admin.redemptions,
  ];

  protectedRoutes.forEach((path) => {
    it(`redirects ${path} to /login`, () => {
      shell.assertAnonymousRedirect(path);
    });
  });
});

// ── Cross-role blocking ────────────────────────────────────────────────────
describe("Cross-role access blocking", () => {
  it("MITRA cannot access /admin routes", () => {
    cy.loginAsRole("MITRA");
    shell.assertRedirectedAwayFrom(routes.admin.dashboard);
  });

  it("MITRA cannot access /leader routes", () => {
    cy.loginAsRole("MITRA");
    shell.assertRedirectedAwayFrom(routes.leader.team);
  });

  it("TEAM_LEADER cannot access /admin routes", () => {
    cy.loginAsRole("TEAM_LEADER");
    shell.assertRedirectedAwayFrom(routes.admin.dashboard);
  });
});
