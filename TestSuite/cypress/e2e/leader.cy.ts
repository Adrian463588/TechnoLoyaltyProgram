/**
 * cypress/e2e/leader.cy.ts
 *
 * Spec: TEAM_LEADER role — full page coverage.
 *
 * Covers:
 * - Dashboard: heading, no server error
 * - Team overview: heading, summary cards, member table or empty state
 * - Alerts: heading, pending confirmation UI or all-clear state
 * - Redemptions: heading, table or empty state
 * - Profile: heading, profile menu access
 * - Route guards: TEAM_LEADER blocked from admin routes
 * - Unauthenticated access redirected to login
 */

import {
  LeaderDashboardPage,
  LeaderTeamPage,
  LeaderAlertsPage,
  LeaderRedemptionsPage,
  LeaderProfilePage,
} from "../pages/LeaderPages";
import { PortalShellPage } from "../pages/PortalShellPage";
import { routes } from "../support/routes";

const dashboard   = new LeaderDashboardPage();
const team        = new LeaderTeamPage();
const alerts      = new LeaderAlertsPage();
const redemptions = new LeaderRedemptionsPage();
const profile     = new LeaderProfilePage();
const shell       = new PortalShellPage();

describe("TEAM_LEADER — Dashboard", () => {
  beforeEach(() => cy.loginAsRole("TEAM_LEADER"));

  it("loads leader dashboard without server error", () => {
    dashboard.visit().assertLoaded();
  });
});

describe("TEAM_LEADER — Team Overview", () => {
  beforeEach(() => cy.loginAsRole("TEAM_LEADER"));

  it("loads team overview with heading", () => {
    team.visit().assertLoaded();
  });

  it("shows aggregate summary cards", () => {
    team.visit().assertLoaded().assertSummaryCardsExist();
  });

  it("renders team member table or empty state", () => {
    team.visit().assertLoaded().assertTeamTableRendered();
  });
});

describe("TEAM_LEADER — Alerts", () => {
  beforeEach(() => cy.loginAsRole("TEAM_LEADER"));

  it("loads alerts page with heading", () => {
    alerts.visit().assertLoaded();
  });

  it("shows pending confirmation controls or all-clear state", () => {
    alerts.visit().assertLoaded().assertPendingOrAllClear();
  });
});

describe("TEAM_LEADER — Redemptions", () => {
  beforeEach(() => cy.loginAsRole("TEAM_LEADER"));

  it("loads redemptions page with heading", () => {
    redemptions.visit().assertLoaded();
  });

  it("shows table or empty state", () => {
    redemptions.visit().assertLoaded().assertTableOrEmptyState();
  });
});

describe("TEAM_LEADER — Profile & navigation", () => {
  beforeEach(() => cy.loginAsRole("TEAM_LEADER"));

  it("loads profile settings page", () => {
    profile.visit().assertLoaded();
  });

  it("can open the profile menu from the navbar", () => {
    profile.visit();
    shell.openProfileMenu().assertProfileMenuVisible();
  });
});

describe("TEAM_LEADER — Route guards", () => {
  beforeEach(() => cy.loginAsRole("TEAM_LEADER"));

  it("cannot access HC admin dashboard", () => {
    shell.assertRedirectedAwayFrom(routes.admin.dashboard);
  });

  it("cannot access admin uploads page", () => {
    shell.assertRedirectedAwayFrom(routes.admin.uploads);
  });
});

describe("TEAM_LEADER — Unauthenticated access", () => {
  it("redirects /leader/team to /login when logged out", () => {
    shell.assertAnonymousRedirect(routes.leader.team);
  });
});
