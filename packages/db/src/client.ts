import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString =
  process.env["DATABASE_URL"] ?? "postgresql://bina_app:bina_secret@localhost:5432/bina";

// RLS-aware client: call withUserContext() before each request
const sql = postgres(connectionString, { max: 10 });

export const db = drizzle(sql, { schema });

export type DB = typeof db;

// Set the current user context for RLS on each request.
// Must be called at the start of every server action / API handler.
export async function withUserContext<T>(
  userId: string,
  role: "contractor" | "admin",
  fn: (db: DB) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(
      `SELECT set_config('app.current_user_id', '${userId.replace(/'/g, "''")}', true)`
    );
    await tx.execute(`SELECT set_config('app.current_user_role', '${role}', true)`);
    return fn(tx as unknown as DB);
  });
}
