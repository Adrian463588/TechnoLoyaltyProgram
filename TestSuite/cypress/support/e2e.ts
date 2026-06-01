/**
 * cypress/support/e2e.ts
 *
 * Global E2E setup — loaded before every spec by Cypress.
 */

import "./commands";

// Suppress known non-actionable framework errors
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("ResizeObserver loop") ||
    err.message.includes("hydration")           ||
    err.message.includes("Hydration")           ||
    err.message.includes("Cannot read properties of null") // framer-motion teardown
  ) {
    return false;
  }
});

export {};
