import { describe, expect, it } from "vitest";
import { type AlertFilters, type MatchableTender, tenderMatchesFilters } from "./match.js";

const NOW = new Date("2026-06-11T12:00:00Z");

function tender(overrides: Partial<MatchableTender> = {}): MatchableTender {
  return {
    title: "Construction d'un groupe scolaire à Casablanca",
    description: "Travaux de gros œuvre et second œuvre",
    maitreDOuvrage: "Commune de Casablanca",
    maitreDOuvrageType: "commune",
    type: "travaux",
    region: "Casablanca-Settat",
    status: "open",
    estimatedBudgetMinCentimes: 200_000_000, // 2M MAD
    estimatedBudgetMaxCentimes: 800_000_000, // 8M MAD
    submissionDeadline: new Date("2026-06-25T12:00:00Z"), // 14 days out
    requiredSpecialties: ["batiment", "second_oeuvre"],
    requiredFnbtpCategory: "deuxieme",
    ...overrides,
  };
}

describe("tenderMatchesFilters", () => {
  it("matches with no filters", () => {
    expect(tenderMatchesFilters(tender(), {}, NOW)).toBe(true);
  });

  describe("status", () => {
    it("matches when status is in the list", () => {
      expect(tenderMatchesFilters(tender(), { status: ["open", "closing_soon"] }, NOW)).toBe(true);
    });
    it("rejects when status not in the list", () => {
      expect(tenderMatchesFilters(tender({ status: "closed" }), { status: ["open"] }, NOW)).toBe(
        false
      );
    });
    it("ignores an empty status array", () => {
      expect(tenderMatchesFilters(tender(), { status: [] }, NOW)).toBe(true);
    });
  });

  describe("type", () => {
    it("matches an included type", () => {
      expect(tenderMatchesFilters(tender(), { types: ["travaux"] }, NOW)).toBe(true);
    });
    it("rejects an excluded type", () => {
      expect(tenderMatchesFilters(tender(), { types: ["services"] }, NOW)).toBe(false);
    });
  });

  describe("region", () => {
    it("matches an included region", () => {
      expect(tenderMatchesFilters(tender(), { regions: ["Casablanca-Settat"] }, NOW)).toBe(true);
    });
    it("rejects an excluded region", () => {
      expect(tenderMatchesFilters(tender(), { regions: ["Rabat-Salé-Kénitra"] }, NOW)).toBe(false);
    });
  });

  describe("maitreDOuvrageType", () => {
    it("matches", () => {
      expect(tenderMatchesFilters(tender(), { maitreDOuvrageTypes: ["commune"] }, NOW)).toBe(true);
    });
    it("rejects", () => {
      expect(tenderMatchesFilters(tender(), { maitreDOuvrageTypes: ["ministere"] }, NOW)).toBe(
        false
      );
    });
  });

  describe("specialties", () => {
    it("matches on any overlap", () => {
      expect(tenderMatchesFilters(tender(), { specialties: ["second_oeuvre", "hvac"] }, NOW)).toBe(
        true
      );
    });
    it("rejects with no overlap", () => {
      expect(tenderMatchesFilters(tender(), { specialties: ["electricite"] }, NOW)).toBe(false);
    });
  });

  describe("budget", () => {
    it("matches when ranges overlap", () => {
      expect(tenderMatchesFilters(tender(), { budgetMin: 500_000_000 }, NOW)).toBe(true);
      expect(tenderMatchesFilters(tender(), { budgetMax: 500_000_000 }, NOW)).toBe(true);
    });
    it("rejects when tender max is below budgetMin", () => {
      expect(tenderMatchesFilters(tender(), { budgetMin: 1_000_000_000 }, NOW)).toBe(false);
    });
    it("rejects when tender min is above budgetMax", () => {
      expect(tenderMatchesFilters(tender(), { budgetMax: 100_000_000 }, NOW)).toBe(false);
    });
    it("keeps tenders with no budget visible", () => {
      const t = tender({ estimatedBudgetMinCentimes: null, estimatedBudgetMaxCentimes: null });
      expect(tenderMatchesFilters(t, { budgetMin: 1_000_000_000 }, NOW)).toBe(true);
      expect(tenderMatchesFilters(t, { budgetMax: 1, budgetMin: 0 }, NOW)).toBe(true);
    });
  });

  describe("deadlineWithinDays", () => {
    it("matches within the window", () => {
      expect(tenderMatchesFilters(tender(), { deadlineWithinDays: 30 }, NOW)).toBe(true);
    });
    it("rejects beyond the window", () => {
      expect(tenderMatchesFilters(tender(), { deadlineWithinDays: 7 }, NOW)).toBe(false);
    });
    it("rejects already-passed deadlines", () => {
      const t = tender({ submissionDeadline: new Date("2026-06-01T12:00:00Z") });
      expect(tenderMatchesFilters(t, { deadlineWithinDays: 30 }, NOW)).toBe(false);
    });
    it("uses real now() by default", () => {
      const t = tender({ submissionDeadline: new Date(Date.now() + 3 * 86_400_000) });
      expect(tenderMatchesFilters(t, { deadlineWithinDays: 7 })).toBe(true);
    });
  });

  describe("fnbtpCategory", () => {
    it("matches the same category", () => {
      expect(tenderMatchesFilters(tender(), { fnbtpCategory: "deuxieme" }, NOW)).toBe(true);
    });
    it("rejects a different category", () => {
      expect(tenderMatchesFilters(tender(), { fnbtpCategory: "premiere" }, NOW)).toBe(false);
    });
    it("keeps tenders with no FNBTP requirement", () => {
      const t = tender({ requiredFnbtpCategory: null });
      expect(tenderMatchesFilters(t, { fnbtpCategory: "premiere" }, NOW)).toBe(true);
    });
  });

  describe("search", () => {
    it("matches a substring in the title", () => {
      expect(tenderMatchesFilters(tender(), { search: "groupe scolaire" }, NOW)).toBe(true);
    });
    it("is accent- and case-insensitive", () => {
      expect(tenderMatchesFilters(tender(), { search: "CASABLANCA" }, NOW)).toBe(true);
      expect(tenderMatchesFilters(tender(), { search: "second oeuvre" }, NOW)).toBe(true);
    });
    it("matches against the maître d'ouvrage", () => {
      expect(tenderMatchesFilters(tender(), { search: "commune de casa" }, NOW)).toBe(true);
    });
    it("rejects a non-match", () => {
      expect(tenderMatchesFilters(tender(), { search: "autoroute" }, NOW)).toBe(false);
    });
    it("handles a null description", () => {
      expect(tenderMatchesFilters(tender({ description: null }), { search: "groupe" }, NOW)).toBe(
        true
      );
    });
    it("ignores a whitespace-only search", () => {
      expect(tenderMatchesFilters(tender(), { search: "   " }, NOW)).toBe(true);
    });
  });

  it("requires ALL clauses to pass (AND semantics)", () => {
    const filters: AlertFilters = {
      specialties: ["batiment"],
      regions: ["Casablanca-Settat"],
      budgetMin: 300_000_000,
      status: ["open"],
    };
    expect(tenderMatchesFilters(tender(), filters, NOW)).toBe(true);
    expect(tenderMatchesFilters(tender({ region: "Fès-Meknès" }), filters, NOW)).toBe(false);
  });
});
