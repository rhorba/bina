import type { SavedSearchInput } from "@bina/core";
import { type DB, savedSearches } from "@bina/db";
import { and, desc, eq } from "drizzle-orm";

export type SavedSearchRow = typeof savedSearches.$inferSelect;

// All saved searches for a contractor, newest first. Powers /alertes.
export async function listSavedSearches(db: DB, contractorId: string): Promise<SavedSearchRow[]> {
  return db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.contractorId, contractorId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function createSavedSearch(
  db: DB,
  contractorId: string,
  input: SavedSearchInput
): Promise<SavedSearchRow | undefined> {
  const [row] = await db
    .insert(savedSearches)
    .values({
      contractorId,
      name: input.name,
      filters: input.filters,
      alertEnabled: input.alertEnabled,
    })
    .returning();
  return row;
}

// Toggle alerting on/off. Ownership is enforced here and by RLS.
export async function setSavedSearchAlert(
  db: DB,
  contractorId: string,
  id: string,
  alertEnabled: boolean
): Promise<void> {
  await db
    .update(savedSearches)
    .set({ alertEnabled, updatedAt: new Date() })
    .where(and(eq(savedSearches.id, id), eq(savedSearches.contractorId, contractorId)));
}

export async function deleteSavedSearch(db: DB, contractorId: string, id: string): Promise<void> {
  await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.contractorId, contractorId)));
}
