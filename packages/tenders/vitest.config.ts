import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["src/**/*.ts"],
      // query/upsert/csv-import are drizzle DB glue — covered by integration/E2E,
      // not unit tests (they need a live Postgres). index/types are declarative.
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts",
        "src/types.ts",
        "src/query.ts",
        "src/upsert.ts",
        "src/csv-import.ts",
        // Sprint 3 DB glue — covered by integration/E2E, not unit tests.
        "src/alert.ts",
        "src/saved-searches.ts",
        "src/tracking.ts",
        // Sprint 6 deadline-reminder sweep is DB glue; deadline.ts (pure) is tested.
        "src/deadline-sweep.ts",
      ],
      // Sprint Exit Gate (.claude/CLAUDE.md): ≥80% — never lower, raise coverage instead.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
