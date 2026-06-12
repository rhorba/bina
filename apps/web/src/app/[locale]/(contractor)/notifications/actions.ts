"use server";
import { getSession } from "@/auth/index.js";
import { db } from "@bina/db";
import { markAllRead, markRead } from "@bina/notifications";
import { revalidatePath } from "next/cache";

// Mark a single notification read. Scoped to the caller's userId so a contractor
// can only ever flip their own rows (also enforced by the notifications_update RLS).
export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await markRead(db, id, session.userId);
  revalidatePath("/", "layout");
}

// Mark every unread notification read.
export async function markAllReadAction(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await markAllRead(db, session.userId);
  revalidatePath("/", "layout");
}
