/**
 * cypress/pages/AdminPages.ts
 *
 * Page Objects for all HC_PM (admin) routes:
 *   /admin/dashboard        — AdminDashboardPage
 *   /admin/uploads          — AdminUploadsPage
 *   /admin/redemptions      — AdminRedemptionsPage
 *   /admin/reward-catalog   — AdminRewardCatalogPage
 *   /admin/adjustments      — AdminAdjustmentsPage
 *   /admin/mitra-validation — AdminMitraValidationPage
 *   /admin/earning-period   — AdminEarningPeriodPage
 *   /admin/audit            — AdminAuditPage
 *   /admin/snapshots        — AdminSnapshotsPage
 *   /admin/profile          — AdminProfilePage
 */

import { routes } from "../support/routes";
import { sel } from "../support/selectors";

// ── Dashboard ─────────────────────────────────────────────────────────────
export class AdminDashboardPage {
  visit() {
    cy.visit(routes.admin.dashboard);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.dashboard);
    cy.contains("h1", /admin dashboard/i, { timeout: 15_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertActionCenterExists() {
    cy.contains(/Action Center|Redemption Queue/i).should("exist");
    return this;
  }
}

// ── Uploads ───────────────────────────────────────────────────────────────
export class AdminUploadsPage {
  visit() {
    cy.visit(routes.admin.uploads);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.uploads);
    cy.contains("h1", /upload/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertUploadControlsVisible() {
    cy.get(sel.admin.divisionSelect, { timeout: 8_000 }).should("exist");
    cy.get(sel.admin.uploadDropzone).should("exist");
    cy.get(sel.admin.fileInput).should("exist");
    return this;
  }

  assertCommitButtonNotYetEnabled() {
    // Commit button is only enabled after a valid file is staged
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.admin.commitBtn).length > 0) {
        cy.get(sel.admin.commitBtn).should("be.disabled");
      }
    });
    return this;
  }
}

// ── Redemptions ───────────────────────────────────────────────────────────
export class AdminRedemptionsPage {
  visit() {
    cy.visit(routes.admin.redemptions);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.redemptions);
    cy.contains("h1", /redemption/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertTableExists() {
    cy.get(sel.admin.redemptionsTable, { timeout: 10_000 }).should("exist");
    return this;
  }

  /**
   * If the management button exists, click it and assert the drawer opens.
   * Otherwise, assert an empty / no-results state.
   */
  openFirstRedemptionIfAvailable() {
    cy.get(sel.common.body).then(($body) => {
      const actionBtn = "button[title='Track & Manage']";
      if ($body.find(actionBtn).length > 0) {
        cy.get(actionBtn).first().should("have.attr", "data-hydrated", "true").click();
        cy.contains(/Redemption Review Center/i, { timeout: 8_000 }).should("be.visible");
      } else {
        cy.contains(/no requests|empty|results/i).should("exist");
      }
    });
    return this;
  }
}

// ── Reward Catalog ────────────────────────────────────────────────────────
export class AdminRewardCatalogPage {
  visit() {
    cy.visit(routes.admin.rewardCatalog);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.rewardCatalog);
    cy.contains("h1", /reward catalog/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertCatalogOrEmpty() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find("[data-testid^=reward-card-]").length > 0 || $body.find("table").length > 0) {
        cy.contains(/reward|catalog/i).should("be.visible");
      } else {
        cy.contains(/no rewards|empty/i).should("exist");
      }
    });
    return this;
  }
}

// ── Adjustments ───────────────────────────────────────────────────────────
export class AdminAdjustmentsPage {
  visit() {
    cy.visit(routes.admin.adjustments);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.adjustments);
    cy.contains("h1", /adjustment|token/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertSearchInputExists() {
    cy.contains(/Search mitra|Mitra Name|Token/i).should("exist");
    return this;
  }

  assertMitraInputExists() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.admin.adjMitraInput).length > 0) {
        cy.get(sel.admin.adjMitraInput).should("be.visible");
      } else {
        cy.get("input[placeholder*='Search' i], input[placeholder*='Mitra' i]")
          .should("exist")
          .and("be.visible");
      }
    });
    return this;
  }
}

// ── Mitra Validation ──────────────────────────────────────────────────────
export class AdminMitraValidationPage {
  visit() {
    cy.visit(routes.admin.mitraValidation);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.mitraValidation);
    cy.contains("h1", /mitra|validation|status/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertListOrEmpty() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.common.table).length > 0) {
        cy.get(sel.common.table).first().should("be.visible");
      } else {
        cy.contains(/no data|empty|search/i).should("exist");
      }
    });
    return this;
  }
}

// ── Earning Period ────────────────────────────────────────────────────────
export class AdminEarningPeriodPage {
  visit() {
    cy.visit(routes.admin.earningPeriod);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.earningPeriod);
    cy.contains("h1", /earning|period|cycle/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertPeriodSummaryExists() {
    cy.contains(/EARNING PERIOD|CLAIM PERIOD|COLLECTION POINT/i).should("exist");
    return this;
  }
}

// ── Audit Log ─────────────────────────────────────────────────────────────
export class AdminAuditPage {
  visit() {
    cy.visit(routes.admin.audit);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.audit);
    cy.contains("h1", /audit/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }

  assertLogTableOrEmpty() {
    cy.get(sel.common.body).then(($body) => {
      if ($body.find(sel.common.table).length > 0) {
        cy.get(sel.common.table).first().should("be.visible");
      } else {
        cy.contains(/no audit|empty/i).should("exist");
      }
    });
    return this;
  }
}

// ── Snapshots ─────────────────────────────────────────────────────────────
export class AdminSnapshotsPage {
  visit() {
    cy.visit(routes.admin.snapshots);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.snapshots);
    cy.get(sel.common.h1, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }
}

// ── Profile ───────────────────────────────────────────────────────────────
export class AdminProfilePage {
  visit() {
    cy.visit(routes.admin.profile);
    return this;
  }

  assertLoaded() {
    cy.url().should("include", routes.admin.profile);
    cy.contains("h1", /account settings/i, { timeout: 10_000 }).should("be.visible");
    cy.assertNoServerError();
    return this;
  }
}
