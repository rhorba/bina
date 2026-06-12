// Deadline-reminder logic (pure). A daily sweep reminds a contractor about each
// tracked tender as its submission deadline approaches. To avoid daily spam — and
// without adding a "last reminded" column — we only fire at fixed day thresholds,
// so a tender crossing each threshold is reminded exactly once.

// Remind at 7 days, 3 days, and 1 day before the deadline.
export const DEADLINE_REMINDER_THRESHOLDS = [7, 3, 1] as const;

// Is a reminder due today for a tender with this many days remaining?
// (Day count comes from daysUntilDeadline in status.ts.)
export function deadlineReminderDue(daysRemaining: number): boolean {
  return (DEADLINE_REMINDER_THRESHOLDS as readonly number[]).includes(daysRemaining);
}
