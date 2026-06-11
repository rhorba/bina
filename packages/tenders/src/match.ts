import type { SavedSearchInput } from "@bina/core";

// Saved-search filters = tender filters without pagination.
export type AlertFilters = SavedSearchInput["filters"];

// Minimal tender shape the matcher needs. A DB TenderRow is assignable to this,
// but keeping it explicit lets the predicate be unit-tested without Postgres.
export type MatchableTender = {
  title: string;
  description?: string | null;
  maitreDOuvrage: string;
  maitreDOuvrageType: string;
  type: string;
  region: string;
  status: string;
  estimatedBudgetMinCentimes?: number | null;
  estimatedBudgetMaxCentimes?: number | null;
  submissionDeadline: Date;
  requiredSpecialties: string[];
  requiredFnbtpCategory?: string | null;
};

// U+0300-U+036F combining marks. After NFD normalization these are standalone
// combining characters we deliberately want to strip \u2014 matching them as a class is
// the intent, so the misleading-character-class rule is suppressed here.
// biome-ignore lint/suspicious/noMisleadingCharacterClass: stripping NFD combining marks is intentional
const DIACRITICS = /[\u0300-\u036f]/g;

// Accent-insensitive, case-insensitive normalization for the free-text search.
// Mirrors (loosely) the Postgres french-config full-text match used by listTenders.
function normalize(s: string): string {
  return (
    s
      .toLowerCase()
      // French ligatures so "oeuvre" matches "œuvre"
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .normalize("NFD")
      // strip combining diacritical marks (U+0300-U+036F)
      .replace(DIACRITICS, "")
  );
}

// Pure predicate: does a tender satisfy every clause of a saved-search filter?
// This is the in-memory twin of buildConditions() in query.ts and is the unit
// of logic the alert sweep relies on. Empty/undefined clauses are skipped (the
// tender is not excluded), exactly like the SQL builder.
export function tenderMatchesFilters(
  tender: MatchableTender,
  filters: AlertFilters,
  now: Date = new Date()
): boolean {
  if (filters.status?.length && !filters.status.includes(tender.status as never)) {
    return false;
  }
  if (filters.types?.length && !filters.types.includes(tender.type as never)) {
    return false;
  }
  if (filters.regions?.length && !filters.regions.includes(tender.region)) {
    return false;
  }
  if (
    filters.maitreDOuvrageTypes?.length &&
    !filters.maitreDOuvrageTypes.includes(tender.maitreDOuvrageType as never)
  ) {
    return false;
  }
  if (filters.specialties?.length) {
    const overlap = tender.requiredSpecialties.some((s) =>
      (filters.specialties as string[]).includes(s)
    );
    if (!overlap) return false;
  }
  // Budget range overlap. Tenders with no budget stay visible (SMEs must not
  // miss them) — same rule as the SQL query.
  if (filters.budgetMin !== undefined) {
    const max = tender.estimatedBudgetMaxCentimes;
    if (max != null && max < filters.budgetMin) return false;
  }
  if (filters.budgetMax !== undefined) {
    const min = tender.estimatedBudgetMinCentimes;
    if (min != null && min > filters.budgetMax) return false;
  }
  if (filters.deadlineWithinDays !== undefined) {
    const limit = new Date(now.getTime() + filters.deadlineWithinDays * 86_400_000);
    if (tender.submissionDeadline < now || tender.submissionDeadline > limit) {
      return false;
    }
  }
  if (filters.fnbtpCategory) {
    // A tender with no FNBTP requirement is open to everyone.
    const req = tender.requiredFnbtpCategory;
    if (req != null && req !== filters.fnbtpCategory) return false;
  }
  if (filters.search?.trim()) {
    const haystack = normalize(
      `${tender.title} ${tender.description ?? ""} ${tender.maitreDOuvrage}`
    );
    const needle = normalize(filters.search.trim());
    if (!haystack.includes(needle)) return false;
  }
  return true;
}
