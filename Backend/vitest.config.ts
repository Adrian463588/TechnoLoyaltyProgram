import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Backend/vitest.config.ts
 * Unit test configuration for Backend domain services.
 */
export default defineConfig({
  test: {
    globals:     true,
    environment: "node",
    include:     ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include:  ["src/services/**", "src/policies/**"],
      exclude:  ["src/controllers/**", "src/api/**", "src/middleware/**"],
    },
  },
  resolve: {
    alias: {
      "@/services":    path.resolve(__dirname, "./src/services"),
      "@/controllers": path.resolve(__dirname, "./src/controllers"),
      "@/middleware":  path.resolve(__dirname, "./src/middleware"),
      "@/db":          path.resolve(__dirname, "./src/db"),
      "@/utils":       path.resolve(__dirname, "./src/utils"),
      "@/types":       path.resolve(__dirname, "./src/types"),
      "@/policies":    path.resolve(__dirname, "./src/policies"),
    },
  },
});
