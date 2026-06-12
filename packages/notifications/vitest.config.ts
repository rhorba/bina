import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["src/**/*.ts"],
      // templates.ts is pure → fully unit-tested. email (Resend IO), dispatch +
      // query + mutations (drizzle DB glue) need live Resend/Postgres → covered by
      // integration/E2E, not unit. index is a declarative barrel.
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts",
        "src/email.ts",
        "src/dispatch.ts",
        "src/query.ts",
        "src/mutations.ts",
      ],
      // Sprint Exit Gate (.claude/CLAUDE.md): ≥80% — never lower, raise coverage instead.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
