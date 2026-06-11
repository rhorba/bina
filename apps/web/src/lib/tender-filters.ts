import { type TenderFiltersInput, tenderFiltersSchema } from "@bina/core";

export type SearchParams = Record<string, string | string[] | undefined>;

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function toInt(v: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === undefined || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

// Parse URL search params (from the SSR browse form, method=GET) into validated
// tender filters. Budget inputs are in MAD and converted to centimes here.
export function parseTenderFilters(sp: SearchParams): TenderFiltersInput {
  const budgetMinMad = toInt(sp["budgetMin"]);
  const budgetMaxMad = toInt(sp["budgetMax"]);
  const search = Array.isArray(sp["search"]) ? sp["search"][0] : sp["search"];

  const candidate = {
    specialties: toArray(sp["specialties"]),
    regions: toArray(sp["regions"]),
    types: toArray(sp["types"]),
    maitreDOuvrageTypes: toArray(sp["maitreDOuvrageTypes"]),
    status: toArray(sp["status"]),
    budgetMin: budgetMinMad !== undefined ? budgetMinMad * 100 : undefined,
    budgetMax: budgetMaxMad !== undefined ? budgetMaxMad * 100 : undefined,
    deadlineWithinDays: toInt(sp["deadlineWithinDays"]),
    fnbtpCategory:
      (Array.isArray(sp["fnbtpCategory"]) ? sp["fnbtpCategory"][0] : sp["fnbtpCategory"]) ||
      undefined,
    search: search?.trim() || undefined,
    page: toInt(sp["page"]) ?? 1,
    perPage: 20,
  };

  // Drop empty arrays so the query builder skips them entirely.
  const cleaned = Object.fromEntries(
    Object.entries(candidate).filter(([, v]) => !(Array.isArray(v) && v.length === 0))
  );

  const parsed = tenderFiltersSchema.safeParse(cleaned);
  if (!parsed.success) {
    // Bad params (e.g. tampered URL) → fall back to an unfiltered first page.
    return tenderFiltersSchema.parse({ page: 1, perPage: 20 });
  }
  return parsed.data;
}

// Rebuild a query string preserving current filters but overriding `page`.
// Used by pagination links so filters survive page navigation.
export function buildPageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page" || value === undefined) continue;
    for (const v of toArray(value)) params.append(key, v);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}
