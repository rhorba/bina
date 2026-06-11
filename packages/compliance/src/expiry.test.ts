import { describe, expect, it } from "vitest";
import {
  DOC_EXPIRY_WARNING_DAYS,
  computeDocStatus,
  daysUntilExpiry,
  isExpired,
  isExpiringSoon,
  needsExpiryAlert,
} from "./expiry.js";

const NOW = new Date("2026-06-11T12:00:00Z");
const inDays = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

describe("daysUntilExpiry", () => {
  it("returns null when there is no expiry date", () => {
    expect(daysUntilExpiry(null, NOW)).toBeNull();
    expect(daysUntilExpiry(undefined, NOW)).toBeNull();
  });

  it("counts whole days remaining (rounds up)", () => {
    expect(daysUntilExpiry(inDays(10), NOW)).toBe(10);
    expect(daysUntilExpiry(inDays(0.5), NOW)).toBe(1);
  });

  it("returns a non-positive value for past dates", () => {
    expect(daysUntilExpiry(inDays(-3), NOW)).toBe(-3);
  });

  it("uses the current time by default", () => {
    expect(daysUntilExpiry(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))).toBeGreaterThan(0);
  });
});

describe("isExpired", () => {
  it("is true for past / today, false for future, false when no date", () => {
    expect(isExpired(inDays(-1), NOW)).toBe(true);
    expect(isExpired(inDays(0), NOW)).toBe(true); // 0 days left = expired
    expect(isExpired(inDays(5), NOW)).toBe(false);
    expect(isExpired(null, NOW)).toBe(false);
  });
});

describe("isExpiringSoon", () => {
  it("is true strictly within the 15-day window", () => {
    expect(isExpiringSoon(inDays(1), NOW)).toBe(true);
    expect(isExpiringSoon(inDays(DOC_EXPIRY_WARNING_DAYS), NOW)).toBe(true);
  });

  it("is false beyond the window, when already expired, or when no date", () => {
    expect(isExpiringSoon(inDays(DOC_EXPIRY_WARNING_DAYS + 1), NOW)).toBe(false);
    expect(isExpiringSoon(inDays(-1), NOW)).toBe(false);
    expect(isExpiringSoon(null, NOW)).toBe(false);
  });
});

describe("computeDocStatus", () => {
  it("returns valid for perpetual (no expiry) documents", () => {
    expect(computeDocStatus(null, NOW)).toBe("valid");
  });

  it("returns valid well before expiry", () => {
    expect(computeDocStatus(inDays(60), NOW)).toBe("valid");
  });

  it("returns expiring_soon inside the window", () => {
    expect(computeDocStatus(inDays(10), NOW)).toBe("expiring_soon");
  });

  it("returns expired in the past", () => {
    expect(computeDocStatus(inDays(-1), NOW)).toBe("expired");
  });

  it("preserves a user-set pending_renewal regardless of date", () => {
    expect(computeDocStatus(inDays(-1), NOW, "pending_renewal")).toBe("pending_renewal");
    expect(computeDocStatus(inDays(60), NOW, "pending_renewal")).toBe("pending_renewal");
  });

  it("ignores non-pending current status and recomputes from the date", () => {
    expect(computeDocStatus(inDays(60), NOW, "expired")).toBe("valid");
  });
});

describe("needsExpiryAlert", () => {
  it("fires only for expiring_soon documents", () => {
    expect(needsExpiryAlert(inDays(5), NOW)).toBe(true);
    expect(needsExpiryAlert(inDays(60), NOW)).toBe(false);
    expect(needsExpiryAlert(inDays(-1), NOW)).toBe(false);
    expect(needsExpiryAlert(null, NOW)).toBe(false);
  });
});
