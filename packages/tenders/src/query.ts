import type { TenderFiltersInput } from "@bina/core";
import { type DB, tenderLots, tenders } from "@bina/db";
import { type SQL, and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

export type TenderRow = typeof tenders.$inferSelect;
export type TenderLotRow = typeof tenderLots.$inferSelect;

export type TenderListResult = {
  tenders: TenderRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function buildConditions(filters: TenderFiltersInput): SQL[] {
  const conditions: SQL[] = [];

  if (filters.status?.length) {
    conditions.push(inArray(tenders.status, filters.status));
  }
  if (filters.types?.length) {
    conditions.push(inArray(tenders.type, filters.types));
  }
  if (filters.regions?.length) {
    conditions.push(inArray(tenders.region, filters.regions));
  }
  if (filters.maitreDOuvrageTypes?.length) {
    conditions.push(
      inArray(
        tenders.maitreDOuvrageType,
        filters.maitreDOuvrageTypes as (typeof tenders.$inferSelect)["maitreDOuvrageType"][]
      )
    );
  }
  if (filters.specialties?.length) {
    // jsonb array overlap: any required specialty matches any filter specialty
    conditions.push(
      sql`${tenders.requiredSpecialties} ?| array[${sql.join(
        filters.specialties.map((s) => sql`${s}`),
        sql`, `
      )}]`
    );
  }
  // Budget range overlap: tender range intersects [budgetMin, budgetMax].
  // Tenders without a budget stay visible (SMEs should not miss them).
  if (filters.budgetMin !== undefined) {
    conditions.push(
      sql`(${tenders.estimatedBudgetMaxCentimes} IS NULL OR ${gte(
        tenders.estimatedBudgetMaxCentimes,
        filters.budgetMin
      )})`
    );
  }
  if (filters.budgetMax !== undefined) {
    conditions.push(
      sql`(${tenders.estimatedBudgetMinCentimes} IS NULL OR ${lte(
        tenders.estimatedBudgetMinCentimes,
        filters.budgetMax
      )})`
    );
  }
  if (filters.deadlineWithinDays !== undefined) {
    conditions.push(
      sql`${tenders.submissionDeadline} <= now() + make_interval(days => ${filters.deadlineWithinDays})`
    );
    conditions.push(gte(tenders.submissionDeadline, sql`now()`));
  }
  if (filters.fnbtpCategory) {
    // A tender with no FNBTP requirement is open to everyone
    conditions.push(
      sql`(${tenders.requiredFnbtpCategory} IS NULL OR ${eq(
        tenders.requiredFnbtpCategory,
        filters.fnbtpCategory
      )})`
    );
  }
  if (filters.search?.trim()) {
    conditions.push(
      sql`to_tsvector('french', ${tenders.title} || ' ' || coalesce(${tenders.description}, '') || ' ' || ${tenders.maitreDOuvrage})
          @@ plainto_tsquery('french', ${filters.search.trim()})`
    );
  }

  return conditions;
}

// Public tender browse — powers the SSR /marches page and (Sprint 3) saved
// search matching against the live table.
export async function listTenders(db: DB, filters: TenderFiltersInput): Promise<TenderListResult> {
  const conditions = buildConditions(filters);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 20;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(tenders)
      .where(where)
      // Open tenders first, closest deadline first; closed/awarded sink down
      .orderBy(
        sql`CASE ${tenders.status} WHEN 'closing_soon' THEN 0 WHEN 'open' THEN 1 ELSE 2 END`,
        asc(tenders.submissionDeadline),
        desc(tenders.publishedAt)
      )
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(tenders).where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;
  return {
    tenders: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getTenderWithLots(
  db: DB,
  tenderId: string
): Promise<{ tender: TenderRow; lots: TenderLotRow[] } | null> {
  const rows = await db.select().from(tenders).where(eq(tenders.id, tenderId)).limit(1);
  const tender = rows[0];
  if (!tender) return null;

  const lots = await db
    .select()
    .from(tenderLots)
    .where(eq(tenderLots.tenderId, tenderId))
    .orderBy(asc(tenderLots.lotNumber));

  return { tender, lots };
}

// Distinct regions present in the tenders table — drives the region filter UI.
export async function listTenderRegions(db: DB): Promise<string[]> {
  const rows = await db
    .selectDistinct({ region: tenders.region })
    .from(tenders)
    .orderBy(asc(tenders.region));
  return rows.map((r) => r.region);
}
