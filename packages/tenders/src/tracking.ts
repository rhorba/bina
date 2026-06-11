import { type DB, tenders, trackedTenders } from "@bina/db";
import { and, asc, eq } from "drizzle-orm";
import type { TenderRow } from "./query.js";

export type TrackedTenderStatus =
  | "watching"
  | "bidding"
  | "submitted"
  | "won"
  | "lost"
  | "withdrawn";

export type TrackedTenderRow = typeof trackedTenders.$inferSelect;

export type TrackedTenderWithTender = {
  tracked: TrackedTenderRow;
  tender: TenderRow;
};

// Contractor's tracked tenders joined to the tender, soonest deadline first —
// drives the tracking dashboard / deadline countdown view.
export async function listTrackedTenders(
  db: DB,
  contractorId: string
): Promise<TrackedTenderWithTender[]> {
  const rows = await db
    .select({ tracked: trackedTenders, tender: tenders })
    .from(trackedTenders)
    .innerJoin(tenders, eq(trackedTenders.tenderId, tenders.id))
    .where(eq(trackedTenders.contractorId, contractorId))
    .orderBy(asc(tenders.submissionDeadline));
  return rows;
}

// Is this tender already tracked by the contractor? (toggle state on detail page)
export async function getTrackedTender(
  db: DB,
  contractorId: string,
  tenderId: string
): Promise<TrackedTenderRow | undefined> {
  const [row] = await db
    .select()
    .from(trackedTenders)
    .where(
      and(eq(trackedTenders.contractorId, contractorId), eq(trackedTenders.tenderId, tenderId))
    )
    .limit(1);
  return row;
}

// Start tracking. Idempotent: a duplicate (contractor, tender) is ignored.
export async function trackTender(db: DB, contractorId: string, tenderId: string): Promise<void> {
  const existing = await getTrackedTender(db, contractorId, tenderId);
  if (existing) return;
  await db.insert(trackedTenders).values({ contractorId, tenderId, status: "watching" });
}

export async function untrackTender(db: DB, contractorId: string, tenderId: string): Promise<void> {
  await db
    .delete(trackedTenders)
    .where(
      and(eq(trackedTenders.contractorId, contractorId), eq(trackedTenders.tenderId, tenderId))
    );
}

export async function setTrackedStatus(
  db: DB,
  contractorId: string,
  id: string,
  status: TrackedTenderStatus
): Promise<void> {
  const patch: Partial<TrackedTenderRow> = { status, updatedAt: new Date() };
  if (status === "submitted") patch.dossierSubmittedAt = new Date();
  await db
    .update(trackedTenders)
    .set(patch)
    .where(and(eq(trackedTenders.id, id), eq(trackedTenders.contractorId, contractorId)));
}
