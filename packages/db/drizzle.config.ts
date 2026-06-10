import "./src/load-env.js";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Glob (not the index barrel): drizzle-kit's CJS loader can't resolve
  // the .js ESM import extensions used in index.ts re-exports.
  schema: "./src/schema/!(index)*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
  verbose: true,
  strict: true,
});
