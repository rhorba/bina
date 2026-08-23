import { runDocExpirySweep } from "@bina/compliance";
import { db } from "@bina/db";
import { runDailyScrape } from "@bina/scraper";
import { runAlertSweep, runDeadlineReminderSweep } from "@bina/tenders";
import PgBoss from "pg-boss";
import { CRON_SCHEDULES, QUEUES } from "./queues.js";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const boss = new PgBoss(DATABASE_URL);

// Kill-switch for the live scraper (marchespublics.gov.ma). Defaults OFF — a fresh
// deploy must not start hitting the real government site until explicitly verified
// end-to-end (Sprint 8, S8-09/S8-12). Never gates the admin CSV fallback import, which
// is a separate manual path. Set SCRAPER_ENABLED=true once verified.
const SCRAPER_ENABLED = process.env["SCRAPER_ENABLED"] === "true";

boss.on("error", (err) => {
  console.error("[pg-boss] error:", err);
});

// pg-boss v10 requires each queue to exist (via createQueue) before .work() or
// .schedule() can reference it — unlike earlier versions, neither call creates
// the queue implicitly. Idempotent: safe to call on every worker startup.
async function ensureQueuesExist() {
  for (const queue of Object.values(QUEUES)) {
    await boss.createQueue(queue);
  }
}

async function registerWorkers() {
  // scraper.daily — nightly scrape + status refresh (CSV fallback is manual, admin-side)
  await boss.work(QUEUES.SCRAPER_DAILY, async (jobs) => {
    for (const job of jobs) {
      if (!SCRAPER_ENABLED) {
        console.log(
          `[scraper.daily] job ${job.id} skipped — SCRAPER_ENABLED is not "true" (CSV fallback unaffected)`
        );
        continue;
      }
      console.log("[scraper.daily] job received:", job.id);
      const result = await runDailyScrape();
      console.log(
        `[scraper.daily] done — run ${result.runId}: ${result.scraped} scraped, ` +
          `${result.inserted} new, ${result.updated} updated, ${result.errors} errors`
      );
    }
  });

  // alert.sweep — daily 7am: match new tenders to saved searches → notifications
  await boss.work(QUEUES.ALERT_SWEEP, async (jobs) => {
    for (const job of jobs) {
      console.log("[alert.sweep] job received:", job.id);
      const result = await runAlertSweep(db);
      console.log(
        `[alert.sweep] done — ${result.searchesProcessed} searches, ` +
          `${result.newMatches} new matches, ${result.notificationsCreated} notifications`
      );
    }
  });

  // deadline.reminder — daily 7:30am: remind on tracked tenders at 7/3/1 days left
  await boss.work(QUEUES.DEADLINE_REMINDER, async (jobs) => {
    for (const job of jobs) {
      console.log("[deadline.reminder] job received:", job.id);
      const result = await runDeadlineReminderSweep(db);
      console.log(
        `[deadline.reminder] done — ${result.trackedProcessed} tracked, ` +
          `${result.remindersSent} reminders`
      );
    }
  });

  // doc.expiry.sweep — daily 8am: refresh doc statuses + notify on 15-day-advance
  // expiry (in-app + best-effort email). Bina rule #1: expiries are a primary signal.
  await boss.work(QUEUES.DOC_EXPIRY_SWEEP, async (jobs) => {
    for (const job of jobs) {
      console.log("[doc.expiry.sweep] job received:", job.id);
      const result = await runDocExpirySweep(db);
      console.log(
        `[doc.expiry.sweep] done — ${result.contractorsProcessed} contractors, ` +
          `${result.alerts} expiry alerts`
      );
    }
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

  await ensureQueuesExist();
  await registerWorkers();
  await registerCronJobs();

  console.log("[worker] ready — listening for jobs");
}

main().catch((err) => {
  console.error("[worker] fatal error:", err);
  process.exit(1);
});
