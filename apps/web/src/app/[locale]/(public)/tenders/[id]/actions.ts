"use server";
import { getSession } from "@/auth/index.js";
import { withUserContext } from "@bina/db";
import { trackTender, untrackTender } from "@bina/tenders";
import { revalidatePath } from "next/cache";

export async function trackTenderAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const tenderId = formData.get("tenderId");
  if (typeof tenderId !== "string" || !tenderId) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await trackTender(tx, contractorId, tenderId);
  });
  revalidatePath("/", "layout");
}

export async function untrackTenderAction(formData: FormData): Promise<void> {
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
