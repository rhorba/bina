import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Playwright E2E specs live in e2e/ and are run by `pnpm test:e2e`, not Vitest.
    exclude: ["**/node_modules/**", "**/.next/**", "e2e/**", "playwright.config.ts"],
  },
});
