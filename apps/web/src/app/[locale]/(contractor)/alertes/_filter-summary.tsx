import { type SavedSearchInput, formatBudgetRange } from "@bina/core";
import { getTranslations } from "next-intl/server";

type Filters = SavedSearchInput["filters"];

// Human-readable chip summary of a saved-search filter set. Reused by the
// create-form preview and each saved-search card.
export async function FilterSummary({ filters, locale }: { filters: Filters; locale: string }) {
  const [tSpec, tTender, tAlerts, tCompliance] = await Promise.all([
    getTranslations("specialty"),
    getTranslations("tender"),
    getTranslations("alerts"),
    getTranslations("compliance"),
  ]);

  const chips: string[] = [];

  for (const s of filters.specialties ?? []) chips.push(tSpec(s));
  for (const r of filters.regions ?? []) chips.push(r);
  for (const ty of filters.types ?? []) chips.push(tTender(`type.${ty}`));
  for (const m of filters.maitreDOuvrageTypes ?? []) chips.push(tTender(`maitreDOuvrageType.${m}`));
  for (const st of filters.status ?? []) chips.push(tTender(`status.${st}`));

  if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
    chips.push(
      formatBudgetRange(filters.budgetMin, filters.budgetMax, locale === "ar" ? "ar" : "fr")
    );
  }
  if (filters.deadlineWithinDays !== undefined) {
    chips.push(`${tTender("deadlineFilterLabel")}: ${filters.deadlineWithinDays}j`);
  }
  if (filters.fnbtpCategory) {
    chips.push(tCompliance(`fnbtpCategory.${filters.fnbtpCategory}`));
  }
  if (filters.search?.trim()) {
    chips.push(`« ${filters.search.trim()} »`);
  }

  if (chips.length === 0) {
    return <span className="text-xs text-[var(--color-muted)]">{tAlerts("noFilters")}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span
          key={c}
          className="text-xs font-medium bg-[var(--color-primary)]/8 text-[var(--color-primary)] px-2 py-0.5 rounded-full"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
