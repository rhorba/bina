"use server";
import { getSession } from "@/auth/index.js";
import { projectReferenceSchema } from "@bina/core";
import { auditLogs, projectReferences, withUserContext } from "@bina/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ReferenceFormState = { error?: string; success?: boolean } | null;

export async function createReferenceAction(
  _prev: ReferenceFormState,
  formData: FormData
): Promise<ReferenceFormState> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) {
    return { error: "Non autorisé." };
  }
  const contractorId = session.contractorId;

  const contractValueMAD = formData.get("contractValueMAD");

  const parsed = projectReferenceSchema.safeParse({
    title: formData.get("title"),
    maitreDOuvrage: formData.get("maitreDOuvrage"),
    // form input is in MAD — stored as integer centimes
    contractValueCentimes:
      contractValueMAD === null || contractValueMAD === ""
        ? undefined
        : Math.round(Number(contractValueMAD) * 100),
    completedAt: formData.get("completedAt"),
    specialty: formData.get("specialty"),
    description: (formData.get("description") as string)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  await withUserContext(session.userId, session.role, async (tx) => {
    const [created] = await tx
      .insert(projectReferences)
      .values({
        contractorId,
        title: data.title,
        maitreDOuvrage: data.maitreDOuvrage,
        contractValueCentimes: data.contractValueCentimes ?? null,
        completedAt: data.completedAt,
        specialty: data.specialty,
        description: data.description ?? null,
        photoKeys: [],
      })
      .returning({ id: projectReferences.id });

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "project_reference",
      entityId: created?.id ?? "",
      action: "create",
      after: { title: data.title, maitreDOuvrage: data.maitreDOuvrage },
    });
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteReferenceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const referenceId = formData.get("referenceId");
  if (typeof referenceId !== "string" || !referenceId) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    // ownership enforced both here and by RLS
    const deleted = await tx
      .delete(projectReferences)
      .where(
        and(eq(projectReferences.id, referenceId), eq(projectReferences.contractorId, contractorId))
      )
      .returning({ id: projectReferences.id, title: projectReferences.title });

    if (deleted.length > 0) {
      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: "project_reference",
        entityId: referenceId,
        action: "delete",
        before: { title: deleted[0]?.title },
      });
    }
  });

  revalidatePath("/", "layout");
}
