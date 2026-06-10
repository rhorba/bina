// Sprint 2: Playwright scraper for marchespublics.gov.ma
// Rate-limited: 1 request per 3 seconds. Runs nightly at 6am via pg-boss.
// CSV manual import fallback must always exist.

export type ScrapeResult = {
  scraped: number;
  inserted: number;
  updated: number;
  errors: number;
};

export async function runDailyScrape(): Promise<ScrapeResult> {
  throw new Error("Scraper not implemented — Sprint 2");
}
