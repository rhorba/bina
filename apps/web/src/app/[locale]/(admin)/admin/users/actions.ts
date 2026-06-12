"use server";
import { getSession } from "@/auth/index.js";
import { setFnbtpVerified, withUserContext } from "@bina/db";
import { revalidatePath } from "next/cache";

// Admin confirms a contractor's declared FNBTP qualification. Audit-logged
// inside setFnbtpVerified. Admin-only — enforced here and by the (admin) layout.
export async function verifyFnbtpAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const contractorId = formData.get("contractorId");
  if (typeof contractorId !== "string" || !contractorId) return;

  await withUserContext(session.userId, "admin", (tx) =>
    setFnbtpVerified(tx, contractorId, session.userId)
  );
  revalidatePath("/", "layout");
}
