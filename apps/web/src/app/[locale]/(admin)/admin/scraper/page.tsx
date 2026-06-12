import { db, getRecentScraperRuns } from "@bina/db";
import { deriveScraperHealth } from "@bina/tenders";
import { getTranslations } from "next-intl/server";
import { ScraperHealthBadge } from "../../_components/scraper-health-badge.js";
import { CsvImportForm } from "./_csv-import-form.js";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

const RUN_STATUS_COLOR: Record<string, string> = {
  success: "var(--color-ok)",
  partial: "var(--color-warning)",
  failed: "var(--color-urgent)",
  running: "var(--color-primary)",
};

export default async function ScraperAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const dateLocale = locale === "ar" ? "ar-MA" : "fr-MA";

  const runs = await getRecentScraperRuns(db, 15);
  const health = deriveScraperHealth(runs[0] ?? null);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("scraperTitle")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("scraperSubtitle")}</p>
      </div>

      {/* Health banner */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[var(--color-foreground)]">
            marchespublics.gov.ma
          </div>
          <p className="text-sm text-[var(--color-muted)]">{t(`scraperStatus.${health.status}`)}</p>
        </div>
        <ScraperHealthBadge status={health.status} />
      </div>

      {/* Recent runs */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
          {t("runs.title")}
        </h2>
        <div className="overflow-x-auto bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] text-xs">
                <th className="text-start font-medium px-4 py-2.5">{t("runs.startedAt")}</th>
                <th className="text-start font-medium px-4 py-2.5">{t("runs.source")}</th>
                <th className="text-start font-medium px-4 py-2.5">{t("runs.status")}</th>
                <th className="text-end font-medium px-4 py-2.5">{t("runs.seen")}</th>
                <th className="text-end font-medium px-4 py-2.5">{t("runs.inserted")}</th>
                <th className="text-end font-medium px-4 py-2.5">{t("runs.updated")}</th>
                <th className="text-end font-medium px-4 py-2.5">{t("runs.errors")}</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[var(--color-muted)]" colSpan={7}>
                    {t("runs.empty")}
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5 whitespace-nowrap text-[var(--color-foreground)]">
                      {new Date(r.startedAt).toLocaleString(dateLocale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-muted)]">
                      {t(`runs.sources.${r.source}`)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: RUN_STATUS_COLOR[r.status] ?? "var(--color-muted)" }}
                      >
                        {t(`runs.statuses.${r.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-end tabular-nums">{r.tendersSeen}</td>
                    <td className="px-4 py-2.5 text-end tabular-nums">{r.tendersInserted}</td>
                    <td className="px-4 py-2.5 text-end tabular-nums">{r.tendersUpdated}</td>
                    <td className="px-4 py-2.5 text-end tabular-nums">{r.errorCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CSV fallback import */}
      <section className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-1">
          {t("csv.title")}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-4">{t("csv.subtitle")}</p>
        <CsvImportForm />
      </section>
    </div>
  );
}
