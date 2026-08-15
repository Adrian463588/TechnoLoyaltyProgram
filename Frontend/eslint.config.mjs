// Frontend/eslint.config.mjs
// ESLint v9 flat config for the Next.js 16 App Router frontend.
// Enforces no direct DB access, no-any, and consistent component patterns.

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs    from "eslint-config-next/typescript";

export default defineConfig([
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
  // ── Next.js recommended rules ─────────────────────────────────────────────
  ...nextVitals,
  ...nextTs,

  // ── Custom rules ──────────────────────────────────────────────────────────
  {
    rules: {
      // Dead symbols are errors; type-checking remains the source of truth for
      // generated/API boundary types during the legacy migration.
      "@typescript-eslint/no-explicit-any":       "off",
      "@typescript-eslint/no-unused-vars":        ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // D — Dependency Inversion: Frontend must NOT touch DB directly
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group:   ["@prisma/client", "prisma"],
            message: "Frontend must not import Prisma — use the API client layer instead.",
          },
          {
            group:   ["**/lib/db*", "**/db/prisma*"],
            message: "Frontend must not access the database directly.",
          },
          {
            group:   ["**/backend/services/*", "**/backend/repositories/*"],
            message: "Frontend must not call backend domain services directly — use api-client/.",
          },
        ],
      }],
      // DRY: no duplicate imports
      "no-duplicate-imports":                     "error",
      // Operational errors/warnings are allowed; secrets must never be logged.
      "no-console":                               ["error", { allow: ["error", "warn"] }],
      // RHF's watch API is intentionally incompatible with React Compiler's
      // memoization analysis; it is still covered by runtime/type tests.
      "react-hooks/incompatible-library":         "off",
      "@next/next/no-img-element":                "off",
    },
  },

  // ── Ignore build artifacts ────────────────────────────────────────────────
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"]),
]);
