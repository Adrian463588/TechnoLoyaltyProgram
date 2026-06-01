/**
 * cypress/pages/EmployeePages.ts
 *
 * Page Objects for all MITRA (employee) routes:
 *   /employee/dashboard  — DashboardPage
 *   /employee/rewards    — RewardsPage
 *   /employee/history    — HistoryPage
 *   /employee/documents  — DocumentsPage
 *   /employee/profile    — ProfilePage (employee variant)
 */

import { routes } from "../support/routes";
import { sel } from "../support/selectors";

// ── Dashboard ────────────────────────────────────────────────────────────
export class EmployeeDashboardPage {
  visit() {
    cy.visit(routes.employee.dashboard);
    return this;
  }

  assertLoaded() {
    cy.get(sel.employee.dashboardHeading, { timeout: 15_000 }).should("be.visible");
    return this;
  }

  assertTokenDisplayed() {
    cy.get(sel.employee.tokenValue, { timeout: 10_000 }).should("be.visible");
    cy.get(sel.employee.tokenValue)
      .invoke("text")
      .then((text) =>
        expect(text.replace(/,/g, "").trim()).to.match(/^\d+$/)
      );
    return this;
  }

  assertTierProgressExists() {
    cy.get(sel.employee.tierProgress).should("exist");
    return this;
  }

  assertRedeemButtonVisible() {
    cy.get(sel.employee.redeemButton, { timeout: 10_000 }).should("be.visible");
    return this;
  }

  assertActivityAreaRendered() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.employee.activityRow).length > 0) {
        cy.get(sel.employee.activityRow).first().should("be.visible");
      } else {
        cy.contains(/no transactions|no activity|history|token/i).should("exist");
      }
    });
    return this;
  }

  clickRedeemButton() {
    cy.get(sel.employee.redeemButton).click();
    cy.url({ timeout: 10_000 }).should("include", routes.employee.rewards);
    return this;
  }
}

// ── Rewards ──────────────────────────────────────────────────────────────
export class EmployeeRewardsPage {
  visit() {
    cy.visit(routes.employee.rewards);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.employee.rewards);
    cy.assertNoServerError();
    cy.contains(/rewards|catalog|redemption|locked|token/i, { timeout: 10_000 }).should("exist");
    return this;
  }

  /**
   * If redeemable reward cards exist, opens the first one and asserts the
   * confirmation modal.  If none exist, asserts an empty / locked state message.
   */
  openFirstRewardIfAvailable() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.employee.rewardCard).length > 0) {
        cy.get(sel.employee.rewardCard).first().click();
        cy.get(sel.common.dialog, { timeout: 8_000 }).should("be.visible");
      } else {
        cy.contains(/no rewards|empty|unavailable|locked|token/i).should("exist");
      }
    });
    return this;
  }

  /**
   * Safe redemption: only clicks confirm if the modal is open and button
   * is enabled.  Does NOT mutate data when the button is disabled.
   */
  safeConfirmRedemption() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.employee.confirmRedeemBtn).length > 0) {
        cy.get(sel.employee.confirmRedeemBtn)
          .should("be.visible")
          .and("not.be.disabled")
          .click();
        cy.get(sel.employee.doneBtn, { timeout: 15_000 }).should("be.visible");
      }
    });
    return this;
  }
}

// ── History ───────────────────────────────────────────────────────────────
export class EmployeeHistoryPage {
  visit() {
    cy.visit(routes.employee.history);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.employee.history);
    cy.contains("h1", /history/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertTableOrEmptyState() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.common.table).length > 0) {
        cy.get(sel.common.table).first().should("be.visible");
      } else {
        cy.contains(/no history|no transactions|empty/i).should("exist");
      }
    });
    return this;
  }
}

// ── Documents ─────────────────────────────────────────────────────────────
export class EmployeeDocumentsPage {
  visit() {
    cy.visit(routes.employee.documents);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.employee.documents);
    cy.contains("h1", /document/i, { timeout: 10_000 }).should("be.visible");
    cy.contains(/ID Card Mitra|KTP|NPWP/i).should("exist");
    return this;
  }

  assertNoServerError() {
    cy.assertNoServerError();
    return this;
  }
}

// ── Profile (employee) ────────────────────────────────────────────────────
export class EmployeeProfilePage {
  visit() {
    cy.visit(routes.employee.profile);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.employee.profile);
    cy.contains("h1", /account settings/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }
}
