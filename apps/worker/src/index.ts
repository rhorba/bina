import { runDailyScrape } from "@bina/scraper";
import PgBoss from "pg-boss";
import { CRON_SCHEDULES, QUEUES } from "./queues.js";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const boss = new PgBoss(DATABASE_URL);

boss.on("error", (err) => {
  console.error("[pg-boss] error:", err);
});

async function registerWorkers() {
  // scraper.daily — nightly scrape + status refresh (CSV fallback is manual, admin-side)
  await boss.work(QUEUES.SCRAPER_DAILY, async (jobs) => {
    for (const job of jobs) {
      console.log("[scraper.daily] job received:", job.id);
      const result = await runDailyScrape();
      console.log(
        `[scraper.daily] done — run ${result.runId}: ${result.scraped} scraped, ` +
          `${result.inserted} new, ${result.updated} updated, ${result.errors} errors`
      );
    }
  });

  // alert.sweep — Sprint 3
  await boss.work(QUEUES.ALERT_SWEEP, async (jobs) => {
    console.log("[alert.sweep] jobs received:", jobs.map((j) => j.id).join(", "));
    // TODO Sprint 3: import and run alert sweep
  });

  // doc.expiry.sweep — Sprint 5
  await boss.work(QUEUES.DOC_EXPIRY_SWEEP, async (jobs) => {
    console.log("[doc.expiry.sweep] jobs received:", jobs.map((j) => j.id).join(", "));
    // TODO Sprint 5: import and run expiry sweep
  });

  // groupement.archive — Sprint 4
  await boss.work(QUEUES.GROUPEMENT_ARCHIVE, async (jobs) => {
    console.log("[groupement.archive] jobs received:", jobs.map((j) => j.id).join(", "));
    // TODO Sprint 4: archive stale groupements
  });
}

async function registerCronJobs() {
  for (const [queue, cron] of Object.entries(CRON_SCHEDULES)) {
    await boss.schedule(queue, cron, {});
    console.log(`[pg-boss] scheduled ${queue} → ${cron}`);
  }
}

async function main() {
  await boss.start();
  console.log("[pg-boss] started");

  await registerWorkers();
  await registerCronJobs();

  console.log("[worker] ready — listening for jobs");
}

main().catch((err) => {
  console.error("[worker] fatal error:", err);
  process.exit(1);
});
