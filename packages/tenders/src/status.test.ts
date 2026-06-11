import type { DB } from "@bina/db";
import { describe, expect, test } from "vitest";
import { daysUntilDeadline, deriveTenderStatus, refreshTenderStatuses } from "./status.js";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-06-10T12:00:00Z");

// Minimal drizzle stub: each db.update(...).set(...).where(...).returning()
// chain resolves to the next batch of rows. Lets us unit-test the sweep's
// counting logic without a live Postgres.
function stubDb(batches: { id: string }[][]): DB {
  let call = 0;
  const chain = (rows: { id: string }[]) => ({
    set: () => chain(rows),
    where: () => chain(rows),
    returning: () => Promise.resolve(rows),
  });
  return { update: () => chain(batches[call++] ?? []) } as unknown as DB;
}

describe("deriveTenderStatus", () => {
  test("closed when deadline passed", () => {
    expect(deriveTenderStatus(new Date(now.getTime() - 1), now)).toBe("closed");
  });

  test("closing_soon within 7 days", () => {
    expect(deriveTenderStatus(new Date(now.getTime() + 3 * DAY), now)).toBe("closing_soon");
    expect(deriveTenderStatus(new Date(now.getTime() + 7 * DAY), now)).toBe("closing_soon");
  });

  test("open beyond 7 days", () => {
    expect(deriveTenderStatus(new Date(now.getTime() + 8 * DAY), now)).toBe("open");
  });
});

describe("daysUntilDeadline", () => {
  test("rounds up partial days", () => {
    expect(daysUntilDeadline(new Date(now.getTime() + 1.5 * DAY), now)).toBe(2);
  });

  test("negative when past", () => {
    expect(daysUntilDeadline(new Date(now.getTime() - 2 * DAY), now)).toBe(-2);
  });
});

describe("refreshTenderStatuses", () => {
  test("returns total rows moved (closed + closing_soon)", async () => {
    const moved = await refreshTenderStatuses(
      stubDb([[{ id: "a" }], [{ id: "b" }, { id: "c" }]]),
      now
    );
    expect(moved).toBe(3);
  });

  test("returns 0 when nothing crossed a threshold", async () => {
    expect(await refreshTenderStatuses(stubDb([[], []]), now)).toBe(0);
  });
});
