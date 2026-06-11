import { getSession } from "@/auth/index.js";
import { DeadlineChip, StatusChip } from "@/components/tender/chips.js";
import { formatBudgetRange } from "@bina/core";
import { db } from "@bina/db";
import { listTrackedTenders } from "@bina/tenders";
import { Building2, ClipboardList, MapPin, Search, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusForm } from "./_status-form";
import { removeTrackedAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function TrackingPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  const rows = await listTrackedTenders(db, session.contractorId);

  const [t, tTender, tCommon] = await Promise.all([
    getTranslations("tracking"),
    getTranslations("tender"),
    getTranslations("common"),
  ]);

  const moneyLocale = locale === "ar" ? "ar" : "fr";

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-10 text-center">
          <ClipboardList size={28} className="mx-auto text-[var(--color-muted)] mb-3" />
          <p className="font-semibold text-[var(--color-foreground)]">{t("empty")}</p>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("emptyHint")}</p>
          <Link
            href={`/${locale}/tenders`}
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            <Search size={15} />
            {tTender("backToList")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ tracked, tender }) => {
            const active = tender.status === "open" || tender.status === "closing_soon";
            return (
              <li
                key={tracked.id}
                className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/${locale}/tenders/${tender.id}`}
                    className="font-semibold text-[var(--color-foreground)] leading-snug hover:text-[var(--color-primary)] transition min-w-0"
                  >
                    {tender.title}
                  </Link>
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
                  <span className="font-medium text-[var(--color-foreground)]">
                    {formatBudgetRange(
                      tender.estimatedBudgetMinCentimes ?? undefined,
                      tender.estimatedBudgetMaxCentimes ?? undefined,
                      moneyLocale
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted)]">{t("status")}</span>
                  <StatusForm id={tracked.id} current={tracked.status} />
                  <form action={removeTrackedAction} className="ms-auto">
                    <input type="hidden" name="tenderId" value={tender.id} />
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
