/**
 * cypress/e2e/admin.cy.ts
 *
 * Spec: HC_PM (admin) role — full page coverage.
 *
 * Covers:
 * - Dashboard: heading, action center widget
 * - Uploads: heading, division select, dropzone, file input, commit button state
 * - Redemptions: heading, table exists, management view when data available
 * - Reward Catalog: heading, catalog or empty state
 * - Adjustments: heading, search input, mitra input
 * - Mitra Validation: heading, list or empty state
 * - Earning Period: heading, period summary
 * - Audit Log: heading, log table or empty state
 * - Snapshots: heading, no server error
 * - Profile: heading, profile menu accessible
 * - Route guard: HC_PM can access all admin routes
 * - Unauthenticated access redirected to login
 */

import {
  AdminDashboardPage,
  AdminUploadsPage,
  AdminRedemptionsPage,
  AdminRewardCatalogPage,
  AdminAdjustmentsPage,
  AdminMitraValidationPage,
  AdminEarningPeriodPage,
  AdminAuditPage,
  AdminSnapshotsPage,
  AdminProfilePage,
} from "../pages/AdminPages";
import { PortalShellPage } from "../pages/PortalShellPage";
import { routes } from "../support/routes";

const dashboard       = new AdminDashboardPage();
const uploads         = new AdminUploadsPage();
const redemptions     = new AdminRedemptionsPage();
const rewardCatalog   = new AdminRewardCatalogPage();
const adjustments     = new AdminAdjustmentsPage();
const mitraValidation = new AdminMitraValidationPage();
const earningPeriod   = new AdminEarningPeriodPage();
const audit           = new AdminAuditPage();
const snapshots       = new AdminSnapshotsPage();
const adminProfile    = new AdminProfilePage();
const shell           = new PortalShellPage();

describe("HC_PM — Dashboard", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads admin dashboard with heading", () => {
    dashboard.visit().assertLoaded();
  });

  it("shows action center widget", () => {
    dashboard.visit().assertLoaded().assertActionCenterExists();
  });
});

describe("HC_PM — Uploads", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads uploads page with heading", () => {
    uploads.visit().assertLoaded();
  });

  it("shows division select, dropzone and file input", () => {
    uploads.visit().assertLoaded().assertUploadControlsVisible();
  });

  it("commit button is disabled before a file is staged", () => {
    uploads.visit().assertLoaded().assertCommitButtonNotYetEnabled();
  });
});

describe("HC_PM — Redemptions", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads redemptions page with table", () => {
    redemptions.visit().assertLoaded().assertTableExists();
  });

  it("opens management drawer when a request exists", () => {
    redemptions.visit().assertLoaded().openFirstRedemptionIfAvailable();
  });
});

describe("HC_PM — Reward Catalog", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads reward catalog management page", () => {
    rewardCatalog.visit().assertLoaded();
  });

  it("shows catalog items or empty state", () => {
    rewardCatalog.visit().assertLoaded().assertCatalogOrEmpty();
  });
});

describe("HC_PM — Adjustments", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads manual token adjustment page", () => {
    adjustments.visit().assertLoaded();
  });

  it("shows search or mitra input field", () => {
    adjustments.visit().assertLoaded().assertMitraInputExists();
  });
});

describe("HC_PM — Mitra Validation", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads mitra validation page with heading", () => {
    mitraValidation.visit().assertLoaded();
  });

  it("shows mitra list or empty state", () => {
    mitraValidation.visit().assertLoaded().assertListOrEmpty();
  });
});

describe("HC_PM — Earning Period", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads earning period settings page", () => {
    earningPeriod.visit().assertLoaded();
  });

  it("shows period summary cards", () => {
    earningPeriod.visit().assertLoaded().assertPeriodSummaryExists();
  });
});

describe("HC_PM — Audit Log", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads audit log page with heading", () => {
    audit.visit().assertLoaded();
  });

  it("shows audit log table or empty state", () => {
    audit.visit().assertLoaded().assertLogTableOrEmpty();
  });
});

describe("HC_PM — Snapshots", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads snapshots page without server error", () => {
    snapshots.visit().assertLoaded();
  });
});

describe("HC_PM — Profile & navigation", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  it("loads admin profile settings page", () => {
    adminProfile.visit().assertLoaded();
  });

  it("can open the profile menu from the navbar", () => {
    adminProfile.visit();
    shell.openProfileMenu().assertProfileMenuVisible();
  });
});

describe("HC_PM — Route access (can access all admin routes)", () => {
  beforeEach(() => cy.loginAsRole("HC_PM"));

  const adminRoutes = [
    routes.admin.dashboard,
    routes.admin.uploads,
    routes.admin.redemptions,
    routes.admin.rewardCatalog,
    routes.admin.adjustments,
    routes.admin.mitraValidation,
    routes.admin.earningPeriod,
    routes.admin.audit,
    routes.admin.profile,
  ] as const;

  adminRoutes.forEach((path) => {
    it(`can access ${path}`, () => {
      cy.visit(path);
      cy.url().should("include", path);
      cy.assertNoServerError();
    });
  });
});

describe("HC_PM — Unauthenticated access", () => {
  it("redirects /admin/dashboard to /login when logged out", () => {
    shell.assertAnonymousRedirect(routes.admin.dashboard);
  });
});
