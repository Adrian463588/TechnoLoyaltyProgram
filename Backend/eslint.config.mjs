// Backend/eslint.config.mjs
// ESLint v9 flat config for the Express/Node.js backend.
// Enforces SOLID, Clean Code, and DRY principles via strict TypeScript rules.

import tsEslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tsEslint.config(
  // ── Strict TypeScript rules ───────────────────────────────────────────────
  ...tsEslint.configs.strictTypeChecked,

  // ── Project-level language options ───────────────────────────────────────
  {
    languageOptions: {
      parserOptions: {
        project:           "./tsconfig.json",
        tsconfigRootDir:   import.meta.dirname,
      },
    },
  },

  // ── Custom rules (SOLID / DRY / Clean Code) ───────────────────────────────
  {
    rules: {
      // S — Single Responsibility: no any hides intent
      "@typescript-eslint/no-explicit-any":              "error",
      // Clean Code: explicit return types on public API functions
      "@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
      // DRY: unused variables signal copy-paste without cleanup
      "@typescript-eslint/no-unused-vars":               ["error", { argsIgnorePattern: "^_" }],
      // No floating promises — all async must be awaited or handled
      "@typescript-eslint/no-floating-promises":         "error",
      // No misused promises (e.g. passing async fn to non-async slot)
      "@typescript-eslint/no-misused-promises":          "error",
      // No direct UI/framework imports in Backend (D — Dependency Inversion)
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["react", "react-dom", "next", "next/*"], message: "Backend must not import frontend/Next.js modules." },
          { group: ["@/components/*", "@/features/*", "@/hooks/*"], message: "Backend must not import frontend components." },
        ],
      }],
      // Clean Code: no console.log in production code — use structured logger
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // DRY: no duplicate imports
      "no-duplicate-imports": "error",
    },
  },

  // ── Ignore build output ───────────────────────────────────────────────────
  globalIgnores(["dist/**", "node_modules/**", "prisma/migrations/**"]),
);
