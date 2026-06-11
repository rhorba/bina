import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const scrapeSourceEnum = pgEnum("scrape_source", ["scraper", "csv_import"]);

export const scrapeRunStatusEnum = pgEnum("scrape_run_status", [
  "running",
  "success",
  "partial", // finished but with errors on some tenders
  "failed",
]);

// One row per scraper run or CSV import — powers the admin scraper-health view.
export const scraperRuns = pgTable("scraper_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: scrapeSourceEnum("source").notNull(),
  status: scrapeRunStatusEnum("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  tendersSeen: integer("tenders_seen").notNull().default(0),
  tendersInserted: integer("tenders_inserted").notNull().default(0),
  tendersUpdated: integer("tenders_updated").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  errorDetails: jsonb("error_details").$type<{ externalId?: string; message: string }[]>(),
  triggeredBy: text("triggered_by"), // user id for CSV imports; null for cron
});
