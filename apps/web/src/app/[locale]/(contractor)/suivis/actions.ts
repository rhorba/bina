"use server";
import { getSession } from "@/auth/index.js";
import { withUserContext } from "@bina/db";
import { type TrackedTenderStatus, setTrackedStatus, untrackTender } from "@bina/tenders";
import { revalidatePath } from "next/cache";

const VALID_STATUSES: TrackedTenderStatus[] = [
  "watching",
  "bidding",
  "submitted",
  "won",
  "lost",
  "withdrawn",
];

export async function setTrackedStatusAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !id) return;
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as TrackedTenderStatus)) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await setTrackedStatus(tx, contractorId, id, status as TrackedTenderStatus);
  });
  revalidatePath("/", "layout");
}

export async function removeTrackedAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const tenderId = formData.get("tenderId");
  if (typeof tenderId !== "string" || !tenderId) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await untrackTender(tx, contractorId, tenderId);
  });
  revalidatePath("/", "layout");
}
