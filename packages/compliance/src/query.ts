// Drizzle read glue for the compliance vault. Excluded from unit coverage
// (needs a live Postgres) — exercised by integration/E2E. RLS already restricts
// compliance_documents to the owning contractor + admin.

import { type DB, complianceDocuments } from "@bina/db";
import { desc, eq } from "drizzle-orm";

export type ComplianceDocRow = typeof complianceDocuments.$inferSelect;

export async function listDocuments(db: DB, contractorId: string): Promise<ComplianceDocRow[]> {
  return db
    .select()
    .from(complianceDocuments)
    .where(eq(complianceDocuments.contractorId, contractorId))
    .orderBy(desc(complianceDocuments.uploadedAt));
}

export async function getDocument(db: DB, docId: string): Promise<ComplianceDocRow | undefined> {
  const [row] = await db
    .select()
    .from(complianceDocuments)
    .where(eq(complianceDocuments.id, docId))
    .limit(1);
  return row;
}
