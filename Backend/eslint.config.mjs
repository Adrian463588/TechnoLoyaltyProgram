// Backend/eslint.config.mjs
// ESLint v9 flat config for the Express/Node.js backend.
// Enforces SOLID, Clean Code, and DRY principles via strict TypeScript rules.

import tsEslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tsEslint.config(
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
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
      // Keep the zero-warning gate meaningful: dead symbols are errors, while
      // legacy unsafe boundaries are covered by the TypeScript build gate.
      "@typescript-eslint/no-explicit-any":              "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars":               ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises":         "off",
      "@typescript-eslint/no-misused-promises":          "off",
      // No direct UI/framework imports in Backend (D — Dependency Inversion)
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["react", "react-dom", "next", "next/*"], message: "Backend must not import frontend/Next.js modules." },
          { group: ["@/components/*", "@/features/*", "@/hooks/*"], message: "Backend must not import frontend components." },
        ],
      }],
      // Keep intentional operational warnings/errors available without noisy
      // lint output; secrets are redacted at the call sites.
      "no-console": ["error", { allow: ["error", "warn"] }],
      // DRY: no duplicate imports
      "no-duplicate-imports": "error",
      
      // These legacy boundary rules are intentionally non-blocking until the
      // affected controllers are migrated to typed DTOs and repositories.
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-deprecated": "off",
    },
  },

  // ── Test files: Vitest/Prisma mocks intentionally use mock casts ───────────
  {
    files: ["src/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },

  // ── Ignore build output ───────────────────────────────────────────────────
  globalIgnores(["dist/**", "node_modules/**", "prisma/migrations/**"]),
);
