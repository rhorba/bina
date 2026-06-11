import type { TenderStatus } from "@bina/core";
import { type DB, tenders } from "@bina/db";
import { and, inArray, lt, sql } from "drizzle-orm";

export const CLOSING_SOON_DAYS = 7;

// Lifecycle derived from the deadline. 'awarded' and 'cancelled' are set by
// scraping the award notice / admin action — never derived here.
export function deriveTenderStatus(submissionDeadline: Date, now = new Date()): TenderStatus {
  if (submissionDeadline.getTime() <= now.getTime()) return "closed";
  const msLeft = submissionDeadline.getTime() - now.getTime();
  if (msLeft <= CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000) return "closing_soon";
  return "open";
}

export function daysUntilDeadline(submissionDeadline: Date, now = new Date()): number {
  return Math.ceil((submissionDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

// Nightly sweep: move open → closing_soon → closed as deadlines approach.
// Leaves awarded/cancelled untouched.
export async function refreshTenderStatuses(db: DB, now = new Date()): Promise<number> {
  const closingSoonCutoff = new Date(now.getTime() + CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000);

  const closed = await db
    .update(tenders)
    .set({ status: "closed", updatedAt: now })
    .where(
      and(inArray(tenders.status, ["open", "closing_soon"]), lt(tenders.submissionDeadline, now))
    )
    .returning({ id: tenders.id });

  const closingSoon = await db
    .update(tenders)
    .set({ status: "closing_soon", updatedAt: now })
    .where(
      and(
        inArray(tenders.status, ["open"]),
        lt(tenders.submissionDeadline, closingSoonCutoff),
        sql`${tenders.submissionDeadline} >= ${now}`
      )
    )
    .returning({ id: tenders.id });

  return closed.length + closingSoon.length;
}
