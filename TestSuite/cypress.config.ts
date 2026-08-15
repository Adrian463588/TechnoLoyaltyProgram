import { defineConfig } from "cypress";

/**
 * TestSuite/cypress.config.ts
 *
 * Cypress E2E configuration.
 * Local is the safe default. Deployments must opt in with CYPRESS_BASE_URL.
 */
export default defineConfig({
  e2e: {
    // ── Base URL ────────────────────────────────────────────────────────────
    // Override with: CYPRESS_BASE_URL=https://staging.example.com cypress run
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3000",

    // ── Test file locations ─────────────────────────────────────────────────
    supportFile:       "cypress/support/e2e.ts",
    specPattern:       "cypress/e2e/**/*.cy.{ts,tsx}",
    screenshotsFolder: "cypress/screenshots",
    fixturesFolder:    "cypress/fixtures",

    // ── Timeouts ────────────────────────────────────────────────────────────
    defaultCommandTimeout: 10_000,
    requestTimeout:        15_000,
    responseTimeout:       15_000,

    // ── Viewport ────────────────────────────────────────────────────────────
    viewportWidth:  1280,
    viewportHeight: 900,

    // ── Reporting ───────────────────────────────────────────────────────────
    video:                  false,   // Enable on CI for debugging
    screenshotOnRunFailure: true,
    allowCypressEnv: false,

    setupNodeEvents(_on, config) {
      // Node event plugins (e.g. code coverage) go here
      return config;
    },
  },
});
