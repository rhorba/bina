/**
 * Applies sql/rls.sql (idempotent) — run AFTER migrations, as superuser.
 * Run: pnpm --filter @bina/db rls
 */
import "./load-env.js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const url =
  process.env["DATABASE_DIRECT_URL"] ??
  process.env["DATABASE_URL"] ??
  "postgresql://bina:bina_dev@localhost:5432/bina";

// onnotice: silence "policy does not exist, skipping" NOTICEs from the
// idempotent DROP POLICY IF EXISTS statements
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const rls = readFileSync(resolve(here, "sql/rls.sql"), "utf8");
  await sql.unsafe(rls);
  console.log("✅ RLS policies applied");
} finally {
  await sql.end();
}
