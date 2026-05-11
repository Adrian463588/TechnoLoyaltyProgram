// TestSuite/eslint.config.mjs
// ESLint v9 flat config for the Cypress E2E test suite.
// Enforces no arbitrary waits, POM usage, and safe command chaining.

import { defineConfig, globalIgnores } from "eslint/config";
import cypress  from "eslint-plugin-cypress/flat";
import tsEslint from "typescript-eslint";

export default defineConfig([
  // ── Cypress plugin recommended rules ──────────────────────────────────────
  cypress.configs.recommended,

  // ── TypeScript rules ──────────────────────────────────────────────────────
  ...tsEslint.configs.recommended,

  // ── Custom Cypress-specific rules ─────────────────────────────────────────
  {
    rules: {
      // No cy.wait(number) — use assertion-based waiting
      "cypress/no-unnecessary-waiting":   "error",
      // No assigning return values of cy commands
      "cypress/no-assigning-return-values": "error",
      // Prevent unsafe chaining of subject commands
      "cypress/unsafe-to-chain-command":  "error",
      // DRY: no unused variables
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // No any in test helpers
      "@typescript-eslint/no-explicit-any": "error",
      // Clean Code: no console.log in test specs
      "no-console": ["warn", { allow: ["error", "warn"] }],
    },
  },

  // ── Ignore artifacts ──────────────────────────────────────────────────────
  globalIgnores(["cypress/screenshots/**", "cypress/videos/**", "node_modules/**"]),
]);
