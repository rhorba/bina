import { type DB, scraperRuns } from "@bina/db";
import { eq } from "drizzle-orm";
import { parseTenderCsv } from "./csv.js";
import { upsertTender } from "./upsert.js";

export type CsvImportRunResult = {
  runId: string;
  seen: number;
  inserted: number;
  updated: number;
  errors: { line?: number; externalId?: string; message: string }[];
};

// Admin CSV fallback (non-negotiable #10) — same upsert path as the scraper,
// logged to scraper_runs so the admin health view shows both sources.
export async function runCsvImport(
  db: DB,
  csvText: string,
  triggeredBy: string
): Promise<CsvImportRunResult> {
  const runRows = await db
    .insert(scraperRuns)
    .values({ source: "csv_import", status: "running", triggeredBy })
    .returning({ id: scraperRuns.id });
  const run = runRows[0];
  if (!run) throw new Error("runCsvImport: failed to create scraper_runs row");

  const parsed = parseTenderCsv(csvText);
  const errors: CsvImportRunResult["errors"] = parsed.errors.map((e) => ({
    line: e.line,
    message: e.message,
  }));

  let inserted = 0;
  let updated = 0;

  for (const raw of parsed.tenders) {
    try {
      const outcome = await upsertTender(db, raw);
      if (outcome === "created") inserted++;
      else updated++;
    } catch (err) {
      errors.push({
        externalId: raw.externalId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const seen = parsed.tenders.length + parsed.errors.length;
  await db
    .update(scraperRuns)
    .set({
      status: errors.length === 0 ? "success" : seen === errors.length ? "failed" : "partial",
      finishedAt: new Date(),
      tendersSeen: seen,
      tendersInserted: inserted,
      tendersUpdated: updated,
      errorCount: errors.length,
      errorDetails: errors.map((e) => ({
        externalId: e.externalId,
        message: e.line !== undefined ? `ligne ${e.line}: ${e.message}` : e.message,
      })),
    })
    .where(eq(scraperRuns.id, run.id));

  return { runId: run.id, seen, inserted, updated, errors };
}
