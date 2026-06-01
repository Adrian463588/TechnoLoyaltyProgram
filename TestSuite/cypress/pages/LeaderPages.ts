/**
 * cypress/pages/LeaderPages.ts
 *
 * Page Objects for all TEAM_LEADER routes:
 *   /leader/dashboard   — LeaderDashboardPage
 *   /leader/team        — LeaderTeamPage
 *   /leader/alerts      — LeaderAlertsPage
 *   /leader/redemptions — LeaderRedemptionsPage
 *   /leader/profile     — LeaderProfilePage
 */

import { routes } from "../support/routes";
import { sel } from "../support/selectors";

// ── Dashboard ─────────────────────────────────────────────────────────────
export class LeaderDashboardPage {
  visit() {
    cy.visit(routes.leader.dashboard);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.leader.dashboard);
    cy.get(sel.common.h1, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }
}

// ── Team ──────────────────────────────────────────────────────────────────
export class LeaderTeamPage {
  visit() {
    cy.visit(routes.leader.team);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.leader.team);
    cy.contains("h1", /team overview/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertSummaryCardsExist() {
    cy.contains(/Team Aggregate Tokens|Eligible for Rewards|Team Alerts/i).should("exist");
    return this;
  }

  assertTeamTableRendered() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.common.table).length > 0) {
        cy.get(sel.common.table).first().should("be.visible");
      } else {
        cy.contains(/no team members|empty/i).should("exist");
      }
    });
    return this;
  }
}

// ── Alerts ────────────────────────────────────────────────────────────────
export class LeaderAlertsPage {
  visit() {
    cy.visit(routes.leader.alerts);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.leader.alerts);
    cy.contains("h1", /team alerts/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertPendingOrAllClear() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.leader.confirmationRow).length > 0) {
        cy.get(sel.leader.confirmationRow).first().should("be.visible");
        cy.get(sel.leader.confirmActiveBtn).first().should("be.visible");
        cy.get(sel.leader.confirmResignedBtn).first().should("be.visible");
      } else {
        cy.contains(/all clear|no pending/i).should("be.visible");
      }
    });
    return this;
  }
}

// ── Redemptions ───────────────────────────────────────────────────────────
export class LeaderRedemptionsPage {
  visit() {
    cy.visit(routes.leader.redemptions);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.leader.redemptions);
    cy.contains("h1", /redemption/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertTableOrEmptyState() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.common.table).length > 0) {
        cy.get(sel.common.table).first().should("be.visible");
      } else {
        cy.contains(/no requests|empty/i).should("exist");
      }
    });
    return this;
  }
}

// ── Profile ───────────────────────────────────────────────────────────────
export class LeaderProfilePage {
  visit() {
    cy.visit(routes.leader.profile);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.leader.profile);
    cy.contains("h1", /account settings/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }
}
