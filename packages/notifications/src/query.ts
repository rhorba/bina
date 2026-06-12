// Read glue for the notification bell + page. DB layer (needs live Postgres) —
// excluded from unit coverage; exercised by integration/E2E. RLS restricts rows
// to user_id = self OR admin, so these queries are already scoped.

import { type DB, notifications } from "@bina/db";
import { and, count, desc, eq } from "drizzle-orm";

export type NotificationRow = typeof notifications.$inferSelect;

// Most recent notifications for a user (newest first), capped for the dropdown/page.
export async function listNotifications(
  db: DB,
  userId: string,
  limit = 30
): Promise<NotificationRow[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// Unread count for the bell badge.
export async function unreadCount(db: DB, userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return row?.n ?? 0;
}
