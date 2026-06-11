// Drizzle write glue for the compliance vault. Excluded from unit coverage
// (needs a live Postgres). Authorization is enforced by the server action +
// RLS; these functions assume the caller is already scoped to the contractor.

import { type DB, complianceDocuments, contractorProfiles } from "@bina/db";
import { eq } from "drizzle-orm";
import { computeDocStatus } from "./expiry.js";
import { type ScorableDoc, computeComplianceScore } from "./score.js";

export type InsertDocumentInput = {
  contractorId: string;
  type: string;
  fileKey: string;
  fileName: string;
  fileSizeBytes?: string | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
};

export async function insertDocument(db: DB, input: InsertDocumentInput): Promise<{ id: string }> {
  const status = computeDocStatus(input.expiresAt ?? null);
  const [row] = await db
    .insert(complianceDocuments)
    .values({
      contractorId: input.contractorId,
      // biome-ignore lint/suspicious/noExplicitAny: enum widened to string at the action boundary
      type: input.type as any,
      fileKey: input.fileKey,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes ?? null,
      issuedAt: input.issuedAt ?? null,
      expiresAt: input.expiresAt ?? null,
      status,
    })
    .returning({ id: complianceDocuments.id });
  return { id: row?.id ?? "" };
}

export async function deleteDocument(
  db: DB,
  docId: string,
  contractorId: string
): Promise<{ fileKey: string; type: string } | null> {
  const [row] = await db
    .delete(complianceDocuments)
    .where(eq(complianceDocuments.id, docId))
    .returning({ fileKey: complianceDocuments.fileKey, type: complianceDocuments.type });
  // contractorId scoping is enforced by RLS; returned for the caller's audit log.
  void contractorId;
  return row ?? null;
}

export async function markPendingRenewal(db: DB, docId: string): Promise<void> {
  await db
    .update(complianceDocuments)
    .set({ status: "pending_renewal", updatedAt: new Date() })
    .where(eq(complianceDocuments.id, docId));
}

// Recompute and persist a contractor's complianceScore from their current vault.
// Called after every upload/delete/status change so the profile + groupement
// trust signal stay accurate.
export async function recomputeComplianceScore(db: DB, contractorId: string): Promise<number> {
  const docs = await db
    .select({ type: complianceDocuments.type, status: complianceDocuments.status })
    .from(complianceDocuments)
    .where(eq(complianceDocuments.contractorId, contractorId));
  const score = computeComplianceScore(docs as ScorableDoc[]);
  await db
    .update(contractorProfiles)
    .set({ complianceScore: score, updatedAt: new Date() })
    .where(eq(contractorProfiles.id, contractorId));
  return score;
}

// Recompute derived statuses for a contractor's docs (used by the expiry sweep).
export async function refreshDocStatuses(db: DB, contractorId: string): Promise<void> {
  const docs = await db
    .select({
      id: complianceDocuments.id,
      expiresAt: complianceDocuments.expiresAt,
      status: complianceDocuments.status,
    })
    .from(complianceDocuments)
    .where(eq(complianceDocuments.contractorId, contractorId));

  for (const d of docs) {
    if (d.status === "pending_renewal") continue;
    const next = computeDocStatus(d.expiresAt, new Date(), d.status);
    if (next !== d.status) {
      await db
        .update(complianceDocuments)
        .set({ status: next, updatedAt: new Date() })
        .where(eq(complianceDocuments.id, d.id));
    }
  }
}
