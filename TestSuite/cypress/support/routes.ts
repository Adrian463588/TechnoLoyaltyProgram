/**
 * cypress/support/routes.ts
 *
 * Canonical frontend route paths.
 * Derive all cy.visit() calls from this object — never hardcode strings in specs.
 */

export const routes = {
  login: "/login",

  employee: {
    dashboard: "/employee/dashboard",
    rewards:   "/employee/rewards",
    history:   "/employee/history",
    documents: "/employee/documents",
    profile:   "/employee/profile",
  },

  leader: {
    dashboard:  "/leader/dashboard",
    team:       "/leader/team",
    alerts:     "/leader/alerts",
    redemptions:"/leader/redemptions",
    profile:    "/leader/profile",
  },

  admin: {
    dashboard:       "/admin/dashboard",
    uploads:         "/admin/uploads",
    redemptions:     "/admin/redemptions",
    rewardCatalog:   "/admin/reward-catalog",
    adjustments:     "/admin/adjustments",
    mitraValidation: "/admin/mitra-validation",
    earningPeriod:   "/admin/earning-period",
    audit:           "/admin/audit",
    snapshots:       "/admin/snapshots",
    profile:         "/admin/profile",
  },
} as const;
