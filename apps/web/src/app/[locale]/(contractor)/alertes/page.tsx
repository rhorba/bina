import { getSession } from "@/auth/index.js";
import { type SearchParams, parseTenderFilters } from "@/lib/tender-filters.js";
import type { SavedSearchInput } from "@bina/core";
import { db } from "@bina/db";
import { listSavedSearches } from "@bina/tenders";
import { Bell, BellOff, Search, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateAlertForm } from "./_create-form";
import { FilterSummary } from "./_filter-summary";
import { deleteSavedSearchAction, toggleAlertAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

type Filters = SavedSearchInput["filters"];

// Rebuild a /tenders browse querystring from a stored filter set (centimes → MAD).
function filtersToQuery(filters: Filters): string {
  const p = new URLSearchParams();
  for (const s of filters.specialties ?? []) p.append("specialties", s);
  for (const r of filters.regions ?? []) p.append("regions", r);
  for (const t of filters.types ?? []) p.append("types", t);
  for (const m of filters.maitreDOuvrageTypes ?? []) p.append("maitreDOuvrageTypes", m);
  for (const st of filters.status ?? []) p.append("status", st);
  if (filters.budgetMin !== undefined)
    p.set("budgetMin", String(Math.round(filters.budgetMin / 100)));
  if (filters.budgetMax !== undefined)
    p.set("budgetMax", String(Math.round(filters.budgetMax / 100)));
  if (filters.deadlineWithinDays !== undefined)
    p.set("deadlineWithinDays", String(filters.deadlineWithinDays));
  if (filters.fnbtpCategory) p.set("fnbtpCategory", filters.fnbtpCategory);
  if (filters.search?.trim()) p.set("search", filters.search.trim());
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

function hasAnyFilter(f: Filters): boolean {
  return Boolean(
    f.specialties?.length ||
      f.regions?.length ||
      f.types?.length ||
      f.maitreDOuvrageTypes?.length ||
      f.status?.length ||
      f.budgetMin !== undefined ||
      f.budgetMax !== undefined ||
      f.deadlineWithinDays !== undefined ||
      f.fnbtpCategory ||
      f.search?.trim()
  );
}

export default async function AlertsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  // Filters carried in from the radar "save this search" link, if any.
  const { page: _p, perPage: _pp, ...incoming } = parseTenderFilters(sp);
  const showCreate = hasAnyFilter(incoming);

  const searches = await listSavedSearches(db, session.contractorId);

  const t = await getTranslations("alerts");
  const tCommon = await getTranslations("common");
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
      </div>

      {/* Create-from-current-filters (only when arriving from the radar) */}
      {showCreate && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-primary)]/40 p-5 mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
            {t("createTitle")}
          </h2>
          <div className="mb-4">
            <FilterSummary filters={incoming} locale={locale} />
          </div>
          <CreateAlertForm filtersJson={JSON.stringify(incoming)} />
        </div>
      )}

      {/* Existing saved searches */}
      {searches.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-10 text-center">
          <Bell size={28} className="mx-auto text-[var(--color-muted)] mb-3" />
          <p className="font-semibold text-[var(--color-foreground)]">{t("empty")}</p>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("emptyHint")}</p>
          <Link
            href={`/${locale}/tenders`}
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            <Search size={15} />
            {t("goToRadar")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {searches.map((s) => {
            const filters = s.filters as Filters;
            return (
              <li
                key={s.id}
                className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--color-foreground)] truncate">
                      {s.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      {t("createdAt")} {dateFormatter.format(s.createdAt)}
                      {" · "}
                      {s.lastAlertAt
                        ? `${t("lastAlert")} ${dateFormatter.format(s.lastAlertAt)}`
                        : t("neverAlerted")}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      color: s.alertEnabled ? "var(--color-ok)" : "var(--color-muted)",
                      border: `1px solid ${s.alertEnabled ? "var(--color-ok)" : "var(--color-border)"}`,
                    }}
                  >
                    {s.alertEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                    {s.alertEnabled ? t("alertsOn") : t("alertsOff")}
                  </span>
                </div>

                <div className="mb-3">
                  <FilterSummary filters={filters} locale={locale} />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/${locale}/tenders${filtersToQuery(filters)}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    <Search size={14} />
                    {t("viewResults")}
                  </Link>
                  <form action={toggleAlertAction} className="ms-auto">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="enabled" value={s.alertEnabled ? "false" : "true"} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition px-2 py-1"
                    >
                      {s.alertEnabled ? <BellOff size={14} /> : <Bell size={14} />}
                      {s.alertEnabled ? t("disable") : t("enable")}
                    </button>
                  </form>
                  <form action={deleteSavedSearchAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      title={tCommon("delete")}
                      className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-urgent)] hover:bg-[var(--color-urgent)]/8 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
