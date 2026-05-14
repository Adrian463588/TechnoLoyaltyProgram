/**
 * TestSuite/cypress/support/e2e.ts
 * Global E2E setup — loaded before every spec.
 */

import "./commands";

// Suppress specific framework errors that are known non-issues
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("ResizeObserver loop") ||
    err.message.includes("hydration") ||
    err.message.includes("Hydration")
  ) {
    return false; // don't fail the test
  }
});

export {};
