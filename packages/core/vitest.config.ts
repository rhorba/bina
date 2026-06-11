import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/types.ts"],
      // Sprint Exit Gate (.claude/CLAUDE.md): ≥80% — never lower, raise coverage instead.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
