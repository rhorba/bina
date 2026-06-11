"use server";
import { getSession } from "@/auth/index.js";
import { savedSearchSchema } from "@bina/core";
import { withUserContext } from "@bina/db";
import { createSavedSearch, deleteSavedSearch, setSavedSearchAlert } from "@bina/tenders";
import { revalidatePath } from "next/cache";

export type AlertFormState = { error?: string; success?: boolean } | null;

export async function createSavedSearchAction(
  _prev: AlertFormState,
  formData: FormData
): Promise<AlertFormState> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) {
    return { error: "Non autorisé." };
  }
  const contractorId = session.contractorId;

  let filters: unknown = {};
  const filtersRaw = formData.get("filters");
  if (typeof filtersRaw === "string" && filtersRaw.trim()) {
    try {
      filters = JSON.parse(filtersRaw);
    } catch {
      return { error: "Filtres invalides." };
    }
  }

  const parsed = savedSearchSchema.safeParse({
    name: formData.get("name"),
    filters,
    alertEnabled: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }

  await withUserContext(session.userId, session.role, async (tx) => {
    await createSavedSearch(tx, contractorId, parsed.data);
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleAlertAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const id = formData.get("id");
  const enabled = formData.get("enabled");
  if (typeof id !== "string" || !id) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await setSavedSearchAlert(tx, contractorId, id, enabled === "true");
  });
  revalidatePath("/", "layout");
}

export async function deleteSavedSearchAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await deleteSavedSearch(tx, contractorId, id);
  });
  revalidatePath("/", "layout");
}
