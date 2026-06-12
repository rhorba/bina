// Write glue for notification read-state. DB layer — excluded from unit coverage.
// RLS scopes rows to user_id = self OR admin; we add an explicit userId clause so
// a user can only ever flip their own notifications even outside an RLS context.

import { type DB, notifications } from "@bina/db";
import { and, eq } from "drizzle-orm";

// Mark a single notification read (scoped to its owner).
export async function markRead(db: DB, notificationId: string, userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

// Mark every unread notification for a user read.
export async function markAllRead(db: DB, userId: string): Promise<number> {
  const rows = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .returning({ id: notifications.id });
  return rows.length;
}
