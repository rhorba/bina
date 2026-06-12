// Daily deadline-reminder sweep (pg-boss deadline.reminder job). For every tracked
// tender whose submission deadline crosses a reminder threshold today (7/3/1 days),
// notify the contractor (in-app + best-effort email). DB/IO glue — excluded from
// unit coverage; the threshold logic (deadline.ts) is pure and unit-tested.

import { type DB, contractorProfiles, tenders, trackedTenders, users } from "@bina/db";
import { notify } from "@bina/notifications";
import { and, eq, inArray } from "drizzle-orm";
import { deadlineReminderDue } from "./deadline.js";
import { daysUntilDeadline } from "./status.js";

export type DeadlineReminderSummary = {
  trackedProcessed: number;
  remindersSent: number;
};

// Only tenders still biddable, and only tracking states where a reminder is useful
// (not already submitted/won/lost/withdrawn).
const ACTIVE_TENDER_STATUSES = ["open", "closing_soon"] as const;
const REMINDABLE_TRACK_STATUSES = ["watching", "bidding"] as const;

export async function runDeadlineReminderSweep(
  db: DB,
  now: Date = new Date()
): Promise<DeadlineReminderSummary> {
  const rows = await db
    .select({
      userId: contractorProfiles.userId,
      email: users.email,
      tenderId: tenders.id,
      title: tenders.title,
      deadline: tenders.submissionDeadline,
    })
    .from(trackedTenders)
    .innerJoin(tenders, eq(trackedTenders.tenderId, tenders.id))
    .innerJoin(contractorProfiles, eq(trackedTenders.contractorId, contractorProfiles.id))
    .innerJoin(users, eq(contractorProfiles.userId, users.id))
    .where(
      and(
        inArray(tenders.status, [...ACTIVE_TENDER_STATUSES]),
        inArray(trackedTenders.status, [...REMINDABLE_TRACK_STATUSES])
      )
    );

  let remindersSent = 0;
  for (const row of rows) {
    const days = daysUntilDeadline(row.deadline, now);
    if (!deadlineReminderDue(days)) continue;
    await notify(db, {
      userId: row.userId,
      email: row.email,
      kind: "tender_deadline",
      data: { tenderTitle: row.title, tenderId: row.tenderId, daysRemaining: days },
    });
    remindersSent++;
  }

  return { trackedProcessed: rows.length, remindersSent };
}
