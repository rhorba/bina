import { getSession } from "@/auth/index.js";
import { DeadlineChip, StatusChip } from "@/components/tender/chips.js";
import { type SearchParams, buildPageHref, parseTenderFilters } from "@/lib/tender-filters.js";
import { formatBudgetRange } from "@bina/core";
import { db } from "@bina/db";
import { listTenderRegions, listTenders } from "@bina/tenders";
import { Bell, Building2, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { TenderFilters } from "./_filters.js";

// Preserve the current filter querystring (minus pagination) so the radar's
// "save this search" link hands the same filters to the /alertes create form.
function saveSearchHref(locale: string, sp: SearchParams): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) p.append(key, v);
  }
  const qs = p.toString();
  return `/${locale}/alertes${qs ? `?${qs}` : ""}`;
}

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: `${t("radar")} — Bina` };
}

export default async function TendersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const filters = parseTenderFilters(sp);
  // Default browse view = active tenders only (the daily radar). Users can opt
  // into closed/awarded/cancelled via the status filter.
  const selectedStatus = filters.status ?? ["open", "closing_soon"];
  const queryFilters = { ...filters, status: selectedStatus };

  const [result, regions, t, tNav, tSpec, tAlerts, session] = await Promise.all([
    listTenders(db, queryFilters),
    listTenderRegions(db),
    getTranslations("tender"),
    getTranslations("nav"),
    getTranslations("specialty"),
    getTranslations("alerts"),
    getSession(),
  ]);

  const moneyLocale = locale === "ar" ? "ar" : "fr";
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{tNav("radar")}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {t("resultsCount", { count: result.total })}
          </p>
        </div>
        {session?.contractorId && (
          <Link
            href={saveSearchHref(locale, sp)}
            className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 px-4 py-2 transition"
          >
            <Bell size={15} />
            {tAlerts("saveCurrent")}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters sidebar */}
        <aside className="lg:sticky lg:top-4 self-start">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
              {t("filtersTitle")}
            </h2>
            <TenderFilters
              locale={locale}
              regions={regions}
              filters={filters}
              selectedStatus={selectedStatus}
            />
          </div>
        </aside>

        {/* Results */}
        <section>
          {result.tenders.length === 0 ? (
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-10 text-center">
              <p className="font-semibold text-[var(--color-foreground)]">{t("noResults")}</p>
              <p className="text-sm text-[var(--color-muted)] mt-1">{t("noResultsHint")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {result.tenders.map((tender) => {
                const active = tender.status === "open" || tender.status === "closing_soon";
                return (
                  <li key={tender.id}>
                    <Link
                      href={`/${locale}/tenders/${tender.id}`}
                      className="block bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)] transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-[var(--color-foreground)] leading-snug">
                          {tender.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusChip status={tender.status} />
                          {active && <DeadlineChip deadline={tender.submissionDeadline} />}
                        </div>
                      </div>

                      <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-sm text-[var(--color-muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 size={14} />
                          {tender.maitreDOuvrage}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {tender.region}
                        </span>
                        <span>{t(`type.${tender.type}`)}</span>
                        <span className="font-medium text-[var(--color-foreground)]">
                          {formatBudgetRange(
                            tender.estimatedBudgetMinCentimes ?? undefined,
                            tender.estimatedBudgetMaxCentimes ?? undefined,
                            moneyLocale
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-x-3 gap-y-1 mt-2 flex-wrap">
                        {tender.requiredSpecialties.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="text-xs font-medium bg-[var(--color-primary)]/8 text-[var(--color-primary)] px-2 py-0.5 rounded-full"
                          >
                            {tSpec(s)}
                          </span>
                        ))}
                        <span className="text-xs text-[var(--color-muted)] ms-auto">
                          {t("publishedAt")} {dateFormatter.format(tender.publishedAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {result.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1 mt-6">
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildPageHref(sp, p)}
                  className={
                    p === result.page
                      ? "min-w-9 text-center text-sm font-semibold rounded-lg px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : "min-w-9 text-center text-sm font-medium rounded-lg px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-bg)]"
                  }
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
