import { describe, expect, test } from "vitest";
import { daysUntilDeadline, deriveTenderStatus } from "./status.js";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-06-10T12:00:00Z");

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
