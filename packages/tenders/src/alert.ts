import { type DB, contractorProfiles, notifications, savedSearches, tenders } from "@bina/db";
import { and, eq, gt, inArray } from "drizzle-orm";
import { type AlertFilters, type MatchableTender, tenderMatchesFilters } from "./match.js";

export type TenderMatchResult = {
  contractorId: string;
  userId: string;
  savedSearchId: string;
  tenderId: string;
  matchedAt: Date;
};

export type AlertSweepSummary = {
  searchesProcessed: number;
  newMatches: number;
  notificationsCreated: number;
  matches: TenderMatchResult[];
};

// Active tenders only — alerts are about opportunities you can still bid on.
const ACTIVE_STATUSES = ["open", "closing_soon"] as const;

// Daily alert sweep (pg-boss alert.sweep job, 7am after the 6am scrape).
//
// For each saved search with alerts on, find active tenders that appeared since
// the search last fired (scrapedAt > lastAlertAt) and satisfy the saved filter,
// raise an in-app notification per (search, tender), and advance lastAlertAt.
// The pure tenderMatchesFilters() predicate does the actual matching so the
// logic is unit-tested without Postgres; this function is the DB glue.
export async function runAlertSweep(db: DB, now: Date = new Date()): Promise<AlertSweepSummary> {
  const searches = await db
    .select({
      id: savedSearches.id,
      contractorId: savedSearches.contractorId,
      userId: contractorProfiles.userId,
      filters: savedSearches.filters,
      lastAlertAt: savedSearches.lastAlertAt,
    })
    .from(savedSearches)
    .innerJoin(contractorProfiles, eq(savedSearches.contractorId, contractorProfiles.id))
    .where(eq(savedSearches.alertEnabled, true));

  const matches: TenderMatchResult[] = [];
  let notificationsCreated = 0;

  for (const search of searches) {
    // Only tenders scraped since this search last fired are "new" to it.
    const since = search.lastAlertAt ?? new Date(0);
    const candidates = await db
      .select()
      .from(tenders)
      .where(and(inArray(tenders.status, [...ACTIVE_STATUSES]), gt(tenders.scrapedAt, since)));

    const filters = search.filters as AlertFilters;
    const hits = candidates.filter((t) =>
      tenderMatchesFilters(t as unknown as MatchableTender, filters, now)
    );

    for (const tender of hits) {
      matches.push({
        contractorId: search.contractorId,
        userId: search.userId,
        savedSearchId: search.id,
        tenderId: tender.id,
        matchedAt: now,
      });

      await db.insert(notifications).values({
        userId: search.userId,
        type: "new_tender_match",
        title: tender.title,
        body: `${tender.maitreDOuvrage} — ${tender.region}`,
        linkUrl: `/tenders/${tender.id}`,
        metadata: { savedSearchId: search.id, tenderId: tender.id },
      });
      notificationsCreated++;
    }

    await db
      .update(savedSearches)
      .set({ lastAlertAt: now, updatedAt: now })
      .where(eq(savedSearches.id, search.id));
  }

  return {
    searchesProcessed: searches.length,
    newMatches: matches.length,
    notificationsCreated,
    matches,
  };
}
