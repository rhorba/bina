// @bina/scraper — Playwright scraper for marchespublics.gov.ma.
// Rate-limited 1 req/3s, nightly at 6am via pg-boss, idempotent upserts.
// CSV fallback lives in @bina/tenders (runCsvImport) — same upsert path.

import { db } from "@bina/db";
import { refreshTenderStatuses } from "@bina/tenders";
import { type ScrapeOptions, type ScrapeResult, scrapeMarchesPublics } from "./scrape.js";

export { extractTenderDetail, extractTenderList, hasNextPage, nextPageUrl } from "./extract.js";
export { MAX_PAGES, PORTAL, RATE_LIMIT_MS } from "./portal.js";
export { type ScrapeOptions, type ScrapeResult, scrapeMarchesPublics } from "./scrape.js";

// Entry point for the pg-boss 'scraper.daily' job.
export async function runDailyScrape(options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const result = await scrapeMarchesPublics(db, options);
  // Deadlines moved overnight even for tenders the scrape didn't touch
  await refreshTenderStatuses(db);
  return result;
}
