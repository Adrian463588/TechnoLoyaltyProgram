// Frontend/eslint.config.mjs
// ESLint v9 flat config for the Next.js 16 App Router frontend.
// Enforces no direct DB access, no-any, and consistent component patterns.

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs    from "eslint-config-next/typescript";

export default defineConfig([
  // ── Next.js recommended rules ─────────────────────────────────────────────
  ...nextVitals,
  ...nextTs,

  // ── Custom rules ──────────────────────────────────────────────────────────
  {
    rules: {
      // No any — SOLID principle: types document intent
      "@typescript-eslint/no-explicit-any":       "error",
      // DRY: unused vars with leading _ exempt (Next.js pattern)
      "@typescript-eslint/no-unused-vars":        ["error", { argsIgnorePattern: "^_" }],
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
      // Clean Code: no console.log in production components
      "no-console":                               ["warn", { allow: ["error", "warn"] }],
    },
  },

  // ── Ignore build artifacts ────────────────────────────────────────────────
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"]),
]);
