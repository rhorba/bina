import { type DB, scraperRuns } from "@bina/db";
import { parseTenderFields, upsertTender } from "@bina/tenders";
import { eq } from "drizzle-orm";
import { chromium } from "playwright";
import { extractTenderDetail, extractTenderList, nextPageUrl } from "./extract.js";
import { MAX_PAGES, PORTAL, RATE_LIMIT_MS } from "./portal.js";

export type ScrapeResult = {
  runId: string;
  scraped: number;
  inserted: number;
  updated: number;
  errors: number;
};

export type ScrapeOptions = {
  maxPages?: number;
  rateLimitMs?: number;
  // Test seam: replaces Playwright navigation with a fixture loader.
  fetchPage?: (url: string) => Promise<string>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Nightly scrape (pg-boss 'scraper.daily', 06:00). Idempotent: upserts by
// externalId. Rate-limited to 1 request / 3 seconds (non-negotiable #3).
export async function scrapeMarchesPublics(
  db: DB,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const maxPages = options.maxPages ?? MAX_PAGES;
  const rateLimitMs = options.rateLimitMs ?? RATE_LIMIT_MS;

  const runRows = await db
    .insert(scraperRuns)
    .values({ source: "scraper", status: "running" })
    .returning({ id: scraperRuns.id });
  const run = runRows[0];
  if (!run) throw new Error("scrapeMarchesPublics: failed to create scraper_runs row");

  let scraped = 0;
  let inserted = 0;
  let updated = 0;
  const errorDetails: { externalId?: string; message: string }[] = [];

  const browser = options.fetchPage ? null : await chromium.launch({ headless: true });

  const fetchPage =
    options.fetchPage ??
    (async (url: string): Promise<string> => {
      if (!browser) throw new Error("browser not started");
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        return await page.content();
      } finally {
        await page.close();
      }
    });

  try {
    let pageUrl: string | null = PORTAL.searchUrl;
    let pageCount = 0;

    while (pageUrl && pageCount < maxPages) {
      pageCount++;
      const listHtml = await fetchPage(pageUrl);
      const entries = extractTenderList(listHtml);

      for (const entry of entries) {
        await sleep(rateLimitMs);
        try {
          const detailHtml = await fetchPage(entry.detailUrl);
          const fields = extractTenderDetail(detailHtml, entry.externalId);
          const raw = parseTenderFields(fields);
          const outcome = await upsertTender(db, raw);
          scraped++;
          if (outcome === "created") inserted++;
          else updated++;
        } catch (err) {
          errorDetails.push({
            externalId: entry.externalId,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }

      pageUrl = nextPageUrl(listHtml);
      if (pageUrl) await sleep(rateLimitMs);
    }

    const status = errorDetails.length === 0 ? "success" : scraped === 0 ? "failed" : "partial";

    await db
      .update(scraperRuns)
      .set({
        status,
        finishedAt: new Date(),
        tendersSeen: scraped + errorDetails.length,
        tendersInserted: inserted,
        tendersUpdated: updated,
        errorCount: errorDetails.length,
        errorDetails: errorDetails.length > 0 ? errorDetails : null,
      })
      .where(eq(scraperRuns.id, run.id));

    return { runId: run.id, scraped, inserted, updated, errors: errorDetails.length };
  } catch (err) {
    // Run-level failure (portal unreachable, structure changed…) — flag it so
    // the admin dashboard surfaces "scraper broken, use CSV fallback".
    await db
      .update(scraperRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        tendersSeen: scraped + errorDetails.length,
        tendersInserted: inserted,
        tendersUpdated: updated,
        errorCount: errorDetails.length + 1,
        errorDetails: [
          ...errorDetails,
          { message: err instanceof Error ? err.message : String(err) },
        ],
      })
      .where(eq(scraperRuns.id, run.id));
    throw err;
  } finally {
    await browser?.close();
  }
}
