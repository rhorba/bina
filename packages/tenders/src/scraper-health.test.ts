import { describe, expect, it } from "vitest";
import {
  STALE_AFTER_HOURS,
  type ScraperRunSummary,
  deriveScraperHealth,
} from "./scraper-health.js";

const NOW = new Date("2026-06-12T09:00:00Z");

function run(overrides: Partial<ScraperRunSummary> = {}): ScraperRunSummary {
  return {
    status: "success",
    startedAt: new Date("2026-06-12T06:00:00Z"),
    finishedAt: new Date("2026-06-12T06:10:00Z"),
    ...overrides,
  };
}

describe("deriveScraperHealth", () => {
  it("returns 'never' when there is no run", () => {
    expect(deriveScraperHealth(null, NOW)).toEqual({ status: "never", hoursSinceLastRun: null });
    expect(deriveScraperHealth(undefined, NOW).status).toBe("never");
  });

  it("returns 'running' for an in-progress run, timed from startedAt", () => {
    const health = deriveScraperHealth(
      run({ status: "running", startedAt: new Date("2026-06-12T08:30:00Z"), finishedAt: null }),
      NOW
    );
    expect(health.status).toBe("running");
    expect(health.hoursSinceLastRun).toBeCloseTo(0.5, 5);
  });

  it("returns 'healthy' for a recent successful run", () => {
    const health = deriveScraperHealth(run(), NOW);
    expect(health.status).toBe("healthy");
    expect(health.hoursSinceLastRun).toBeCloseTo(2.833, 2);
  });

  it("returns 'failed' when the last run failed, regardless of recency", () => {
    expect(deriveScraperHealth(run({ status: "failed" }), NOW).status).toBe("failed");
  });

  it("returns 'degraded' for a recent partial run", () => {
    expect(deriveScraperHealth(run({ status: "partial" }), NOW).status).toBe("degraded");
  });

  it("returns 'stale' when a successful run is older than the stale window", () => {
    const old = new Date(NOW.getTime() - (STALE_AFTER_HOURS + 1) * 3_600_000);
    const health = deriveScraperHealth(run({ startedAt: old, finishedAt: old }), NOW);
    expect(health.status).toBe("stale");
    expect(health.hoursSinceLastRun).toBeCloseTo(STALE_AFTER_HOURS + 1, 5);
  });

  it("staleness takes precedence over a partial status", () => {
    const old = new Date(NOW.getTime() - (STALE_AFTER_HOURS + 5) * 3_600_000);
    expect(
      deriveScraperHealth(run({ status: "partial", startedAt: old, finishedAt: old }), NOW).status
    ).toBe("stale");
  });

  it("falls back to startedAt when finishedAt is null on a finished status", () => {
    const health = deriveScraperHealth(
      run({ status: "success", startedAt: new Date("2026-06-12T07:00:00Z"), finishedAt: null }),
      NOW
    );
    expect(health.status).toBe("healthy");
    expect(health.hoursSinceLastRun).toBeCloseTo(2, 5);
  });

  it("never reports a negative age (clock skew clamps to 0)", () => {
    const future = new Date(NOW.getTime() + 3_600_000);
    expect(
      deriveScraperHealth(run({ startedAt: future, finishedAt: future }), NOW).hoursSinceLastRun
    ).toBe(0);
  });

  it("defaults `now` to the current time when omitted", () => {
    const health = deriveScraperHealth(run({ finishedAt: new Date() }));
    expect(health.status).toBe("healthy");
  });
});
