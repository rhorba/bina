import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["src/**/*.ts"],
      // query/mutations are drizzle DB glue — covered by integration/E2E, not
      // unit tests (they need a live Postgres). index is a declarative barrel.
      // state-machine + membership are pure → fully unit-tested.
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts",
        "src/query.ts",
        "src/mutations.ts",
      ],
      // Sprint Exit Gate (.claude/CLAUDE.md): ≥80% — never lower, raise coverage instead.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
