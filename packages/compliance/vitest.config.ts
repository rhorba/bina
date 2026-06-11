import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["src/**/*.ts"],
      // expiry + score + dossier are pure → fully unit-tested. storage (R2 IO),
      // query/mutations (drizzle DB glue) need live R2/Postgres → covered by
      // integration/E2E, not unit. index is a declarative barrel.
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts",
        "src/storage.ts",
        "src/query.ts",
        "src/mutations.ts",
      ],
      // Sprint Exit Gate (.claude/CLAUDE.md): ≥80% — never lower, raise coverage instead.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
