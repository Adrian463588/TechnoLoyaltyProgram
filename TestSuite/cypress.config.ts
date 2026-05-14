import { defineConfig } from "cypress";

/**
 * TestSuite/cypress.config.ts
 *
 * Cypress E2E configuration.
 * baseUrl is controlled via CYPRESS_BASE_URL env variable for CI/CD flexibility.
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

    setupNodeEvents(_on, _config) {
      // Node event plugins (e.g. code coverage) go here
    },
  },
});
