import { describe, expect, test } from "vitest";
import { centimesToMad, formatBudgetRange, formatMAD, madToCentimes } from "./money.js";

describe("madToCentimes / centimesToMad", () => {
  test("converts MAD to integer centimes and back", () => {
    expect(madToCentimes(10.5)).toBe(1050);
    expect(madToCentimes(1_200_000)).toBe(120_000_000);
    expect(centimesToMad(1050)).toBe(10.5);
  });

  test("rounds to the nearest centime (no float drift)", () => {
    expect(madToCentimes(0.1 + 0.2)).toBe(30); // 0.30000000000000004 → 30
    expect(madToCentimes(99.999)).toBe(10000);
  });
});

describe("formatMAD", () => {
  test("formats centimes as a MAD currency string (fr + ar)", () => {
    const fr = formatMAD(120_000_000, "fr");
    const ar = formatMAD(120_000_000, "ar");
    expect(fr).toMatch(/\d/);
    expect(ar).toMatch(/[\d٠-٩]/); // latin or arabic-indic digits
    expect(fr).not.toBe(ar);
  });

  test("defaults to fr locale", () => {
    expect(formatMAD(50_000)).toMatch(/\d/);
  });
});

describe("formatBudgetRange", () => {
  test("min and max → range", () => {
    expect(formatBudgetRange(100_000, 500_000, "fr")).toContain("–");
  });

  test("min only → ≥", () => {
    expect(formatBudgetRange(100_000, undefined, "fr")).toContain("≥");
  });

  test("max only → ≤", () => {
    expect(formatBudgetRange(undefined, 500_000, "fr")).toContain("≤");
  });

  test("neither → locale-specific 'undefined' label", () => {
    expect(formatBudgetRange(undefined, undefined, "fr")).toBe("Non défini");
    expect(formatBudgetRange(undefined, undefined, "ar")).toBe("غير محدد");
  });
});
