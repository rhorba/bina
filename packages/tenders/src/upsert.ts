import { type DB, tenderLots, tenders } from "@bina/db";
import { eq } from "drizzle-orm";
import { deriveTenderStatus } from "./status.js";
import type { RawTender } from "./types.js";

export type UpsertOutcome = "created" | "updated";

// Idempotent upsert keyed on externalId — shared by the nightly scraper and
// the CSV fallback import. Lots are replaced wholesale (the portal is the
// source of truth; no user data hangs off tender_lots).
export async function upsertTender(db: DB, raw: RawTender): Promise<UpsertOutcome> {
  const now = new Date();
  const status = deriveTenderStatus(raw.submissionDeadline, now);

  const existing = await db
    .select({ id: tenders.id, status: tenders.status })
    .from(tenders)
    .where(eq(tenders.externalId, raw.externalId))
    .limit(1);

  const values = {
    title: raw.title,
    maitreDOuvrage: raw.maitreDOuvrage,
    maitreDOuvrageType: raw.maitreDOuvrageType,
    type: raw.type,
    region: raw.region,
    estimatedBudgetMinCentimes: raw.estimatedBudgetMinCentimes ?? null,
    estimatedBudgetMaxCentimes: raw.estimatedBudgetMaxCentimes ?? null,
    publishedAt: raw.publishedAt,
    submissionDeadline: raw.submissionDeadline,
    openingDate: raw.openingDate ?? null,
    requiredSpecialties: raw.requiredSpecialties,
    requiredFnbtpCategory: raw.requiredFnbtpCategory ?? null,
    description: raw.description ?? null,
    dossierUrl: raw.dossierUrl ?? null,
    scrapedAt: now,
    updatedAt: now,
  };

  const first = existing[0];
  let tenderId: string;
  let outcome: UpsertOutcome;

  if (first) {
    // Keep manually-set terminal statuses (awarded/cancelled)
    const keepStatus = first.status === "awarded" || first.status === "cancelled";
    await db
      .update(tenders)
      .set(keepStatus ? values : { ...values, status })
      .where(eq(tenders.id, first.id));
    tenderId = first.id;
    outcome = "updated";
  } else {
    const inserted = await db
      .insert(tenders)
      .values({ ...values, externalId: raw.externalId, status })
      .returning({ id: tenders.id });
    const row = inserted[0];
    if (!row) throw new Error(`upsertTender: insert returned no row for ${raw.externalId}`);
    tenderId = row.id;
    outcome = "created";
  }

  await db.delete(tenderLots).where(eq(tenderLots.tenderId, tenderId));
  if (raw.lots.length > 0) {
    await db.insert(tenderLots).values(
      raw.lots.map((lot) => ({
        tenderId,
        lotNumber: lot.lotNumber,
        lotTitle: lot.lotTitle,
        estimatedBudgetCentimes: lot.estimatedBudgetCentimes ?? null,
        requiredSpecialties: lot.requiredSpecialties,
        description: lot.description ?? null,
      }))
    );
  }

  return outcome;
}
