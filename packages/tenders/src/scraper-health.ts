// Pure scraper-health derivation for the admin dashboard.
// The nightly scrape (non-negotiable #3) runs once every 24h at 06:00, so a
// healthy pipeline has a successful run within roughly the last day. This logic
// turns the latest scraper_runs row into a single traffic-light status — no DB
// access here so it stays unit-testable.

export type ScraperHealthStatus =
  | "never" // no run ever recorded
  | "running" // a run is currently in progress
  | "healthy" // last run succeeded recently
  | "degraded" // last run finished with some per-tender errors (partial)
  | "stale" // last run succeeded but too long ago (missed a nightly cycle)
  | "failed"; // last run failed outright

export type ScraperRunSummary = {
  status: "running" | "success" | "partial" | "failed";
  startedAt: Date;
  finishedAt: Date | null;
};

export type ScraperHealth = {
  status: ScraperHealthStatus;
  // hours since the run finished (or started, if still running / never finished)
  hoursSinceLastRun: number | null;
};

// A nightly run is "stale" once we are clearly past the next expected cycle.
// 26h gives a 2h grace window after the 24h cadence.
export const STALE_AFTER_HOURS = 26;

export function deriveScraperHealth(
  lastRun: ScraperRunSummary | null | undefined,
  now: Date = new Date()
): ScraperHealth {
  if (!lastRun) {
    return { status: "never", hoursSinceLastRun: null };
  }

  if (lastRun.status === "running") {
    const hours = hoursBetween(lastRun.startedAt, now);
    return { status: "running", hoursSinceLastRun: hours };
  }

  const reference = lastRun.finishedAt ?? lastRun.startedAt;
  const hoursSince = hoursBetween(reference, now);

  if (lastRun.status === "failed") {
    return { status: "failed", hoursSinceLastRun: hoursSince };
  }

  if (hoursSince > STALE_AFTER_HOURS) {
    return { status: "stale", hoursSinceLastRun: hoursSince };
  }

  if (lastRun.status === "partial") {
    return { status: "degraded", hoursSinceLastRun: hoursSince };
  }

  return { status: "healthy", hoursSinceLastRun: hoursSince };
}

function hoursBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / 3_600_000);
}
