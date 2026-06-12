import { db, getAdminKpis, getRecentScraperRuns } from "@bina/db";
import { deriveScraperHealth } from "@bina/tenders";
import { Activity, Bell, FileText, ShieldCheck, Users2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ScraperHealthBadge } from "../_components/scraper-health-badge.js";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("admin");

  const [kpis, runs] = await Promise.all([getAdminKpis(db), getRecentScraperRuns(db, 1)]);
  const health = deriveScraperHealth(runs[0] ?? null);

  const cards = [
    { key: "tendersIndexed", value: kpis.tendersIndexed, icon: FileText, href: "tenders" },
    { key: "activeUsers30d", value: kpis.activeUsers30d, icon: Users2, href: "users" },
    { key: "activeGroupements", value: kpis.activeGroupements, icon: Users2, href: "groupements" },
    { key: "alertsSent7d", value: kpis.alertsSent7d, icon: Bell, href: null },
    { key: "verificationQueue", value: kpis.verificationQueue, icon: ShieldCheck, href: "users" },
  ] as const;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          const baseClass =
            "bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 block";
          const content = (
            <div key={c.key} className="contents">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[var(--color-foreground)]">{c.value}</span>
                <Icon size={18} className="text-[var(--color-muted)]" aria-hidden="true" />
              </div>
              <div className="text-xs text-[var(--color-muted)] mt-1">{t(`kpi.${c.key}`)}</div>
            </div>
          );
          return c.href ? (
            <Link
              key={c.key}
              href={`/${locale}/admin/${c.href}`}
              className={`${baseClass} hover:border-[var(--color-primary-mid)] transition`}
            >
              {content}
            </Link>
          ) : (
            <div key={c.key} className={baseClass}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Scraper health */}
      <Link
        href={`/${locale}/admin/scraper`}
        className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 flex items-center gap-4 hover:border-[var(--color-primary-mid)] transition"
      >
        <Activity size={22} className="text-[var(--color-muted)] shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--color-foreground)]">
            {t("scraperTitle")}
          </div>
          <p className="text-sm text-[var(--color-muted)]">{t(`scraperStatus.${health.status}`)}</p>
        </div>
        <ScraperHealthBadge status={health.status} />
      </Link>
    </div>
  );
}
