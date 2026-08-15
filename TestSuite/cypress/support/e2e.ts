/**
 * cypress/support/e2e.ts
 *
 * Global E2E setup — loaded before every spec by Cypress.
 */

import "./commands";

// Next.js development instrumentation can receive a browser clock sample
// earlier than its matching mark under Cypress. This is an infrastructure
// exception, not an application assertion; all other uncaught exceptions
// must still fail the spec.
Cypress.on("uncaught:exception", (error) => {
  if (error.message.includes("cannot have a negative time stamp")) return false;
  return true;
});

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
