import { describe, expect, it } from "vitest";
import { DEADLINE_REMINDER_THRESHOLDS, deadlineReminderDue } from "./deadline.js";

describe("deadlineReminderDue", () => {
  it("fires only at the 7/3/1-day thresholds", () => {
    expect(deadlineReminderDue(7)).toBe(true);
    expect(deadlineReminderDue(3)).toBe(true);
    expect(deadlineReminderDue(1)).toBe(true);
  });

  it("does not fire on non-threshold days", () => {
    for (const d of [10, 6, 5, 4, 2, 0, -1]) {
      expect(deadlineReminderDue(d)).toBe(false);
    }
  });

  it("exposes the thresholds in descending order", () => {
    expect([...DEADLINE_REMINDER_THRESHOLDS]).toEqual([7, 3, 1]);
  });
});
