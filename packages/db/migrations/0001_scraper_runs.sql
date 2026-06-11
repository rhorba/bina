CREATE TYPE "public"."scrape_run_status" AS ENUM('running', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."scrape_source" AS ENUM('scraper', 'csv_import');--> statement-breakpoint
CREATE TABLE "scraper_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "scrape_source" NOT NULL,
	"status" "scrape_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"tenders_seen" integer DEFAULT 0 NOT NULL,
	"tenders_inserted" integer DEFAULT 0 NOT NULL,
	"tenders_updated" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"error_details" jsonb,
	"triggered_by" text
);
