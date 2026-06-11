import { getSession } from "@/auth/index.js";
import { DeadlineChip, StatusChip } from "@/components/tender/chips.js";
import { formatBudgetRange, formatMAD } from "@bina/core";
import { db } from "@bina/db";
import { getTenderWithLots, getTrackedTender } from "@bina/tenders";
import {
  ArrowLeft,
  BookmarkCheck,
  BookmarkPlus,
  Building2,
  Calendar,
  Download,
  FileText,
  MapPin,
  Medal,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trackTenderAction, untrackTenderAction } from "./actions";

type Props = { params: Promise<{ locale: string; id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Bina" };
  const res = await getTenderWithLots(db, id);
  return { title: res ? `${res.tender.title} — Bina` : "Bina" };
}

export default async function TenderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const res = await getTenderWithLots(db, id);
  if (!res) notFound();
  const { tender, lots } = res;

  const [t, tSpec, tComp, session] = await Promise.all([
    getTranslations("tender"),
    getTranslations("specialty"),
    getTranslations("compliance"),
    getSession(),
  ]);

  const isContractor = session?.role === "contractor" && Boolean(session.contractorId);
  const tracked = isContractor
    ? Boolean(await getTrackedTender(db, session.contractorId as string, id))
    : false;

  const moneyLocale = locale === "ar" ? "ar" : "fr";
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const active = tender.status === "open" || tender.status === "closing_soon";

  const metaRow = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-2 py-2 border-b border-[var(--color-border)] last:border-0">
      <span className="text-[var(--color-muted)] mt-0.5 shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-[var(--color-muted)]">{label}</div>
        <div className="text-sm font-medium text-[var(--color-foreground)]">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <Link
        href={`/${locale}/tenders`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] mb-5"
      >
        <ArrowLeft size={15} className="rtl:rotate-180" />
        {t("backToList")}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] leading-tight">
          {tender.title}
        </h1>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusChip status={tender.status} />
          {active && <DeadlineChip deadline={tender.submissionDeadline} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        {/* Main */}
        <div className="space-y-6 order-2 md:order-1">
          {tender.description && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
                {t("descriptionLabel")}
              </h2>
              <p className="text-sm text-[var(--color-foreground)] whitespace-pre-line leading-relaxed">
                {tender.description}
              </p>
            </section>
          )}

          {/* Required specialties + FNBTP */}
          <section>
            <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
              {t("requiredSpecialties")}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {tender.requiredSpecialties.length === 0 && (
                <span className="text-sm text-[var(--color-muted)]">—</span>
              )}
              {tender.requiredSpecialties.map((s) => (
                <span
                  key={s}
                  className="text-xs font-medium bg-[var(--color-primary)]/8 text-[var(--color-primary)] px-2.5 py-1 rounded-full"
                >
                  {tSpec(s)}
                </span>
              ))}
            </div>
            {tender.requiredFnbtpCategory && (
              <div className="flex items-center gap-1.5 mt-3 text-sm text-[var(--color-foreground)]">
                <Medal size={15} className="text-[var(--color-accent)]" />
                {t("requiredFnbtp")}:{" "}
                <span className="font-medium">
                  {tComp(`fnbtpCategory.${tender.requiredFnbtpCategory}`)}
                </span>
              </div>
            )}
          </section>

          {/* Lots */}
          {lots.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
                {t("lots")} ({lots.length})
              </h2>
              <div className="space-y-2">
                {lots.map((lot) => (
                  <div
                    key={lot.id}
                    className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-sm text-[var(--color-foreground)]">
                        {t("lot")} {lot.lotNumber} — {lot.lotTitle}
                      </div>
                      {lot.estimatedBudgetCentimes !== null && (
                        <div className="text-sm font-medium text-[var(--color-foreground)] shrink-0">
                          {formatMAD(lot.estimatedBudgetCentimes, moneyLocale)}
                        </div>
                      )}
                    </div>
                    {lot.requiredSpecialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lot.requiredSpecialties.map((s) => (
                          <span
                            key={s}
                            className="text-xs text-[var(--color-muted)] border border-[var(--color-border)] px-2 py-0.5 rounded-full"
                          >
                            {tSpec(s)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar meta */}
        <aside className="order-1 md:order-2">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
            {metaRow(
              <Building2 size={15} />,
              t("maitreDOuvrage"),
              <>
                {tender.maitreDOuvrage}
                <span className="block text-xs text-[var(--color-muted)] font-normal">
                  {t(`maitreDOuvrageType.${tender.maitreDOuvrageType}`)}
                </span>
              </>
            )}
            {metaRow(<MapPin size={15} />, t("region"), tender.region)}
            {metaRow(<FileText size={15} />, t("typeLabel"), t(`type.${tender.type}`))}
            {metaRow(
              <span className="text-sm">MAD</span>,
              t("budget"),
              formatBudgetRange(
                tender.estimatedBudgetMinCentimes ?? undefined,
                tender.estimatedBudgetMaxCentimes ?? undefined,
                moneyLocale
              )
            )}
            {metaRow(
              <Calendar size={15} />,
              t("deadline"),
              dateFormatter.format(tender.submissionDeadline)
            )}
            {tender.openingDate &&
              metaRow(
                <Calendar size={15} />,
                t("openingDate"),
                dateFormatter.format(tender.openingDate)
              )}
            {metaRow(
              <Calendar size={15} />,
              t("publishedAt"),
              dateFormatter.format(tender.publishedAt)
            )}

            {tender.dossierUrl && (
              <a
                href={tender.dossierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-[var(--color-primary-mid)] transition"
              >
                <Download size={15} />
                {t("download")}
              </a>
            )}
          </div>

          {/* Track toggle for logged-in contractors; acquisition CTA otherwise */}
          {isContractor ? (
            tracked ? (
              <form action={untrackTenderAction} className="mt-3">
                <input type="hidden" name="tenderId" value={tender.id} />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-ok)]/10 text-[var(--color-ok)] border border-[var(--color-ok)] text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-[var(--color-ok)]/15 transition"
                >
                  <BookmarkCheck size={16} />
                  {t("untrack")}
                </button>
              </form>
            ) : (
              <form action={trackTenderAction} className="mt-3">
                <input type="hidden" name="tenderId" value={tender.id} />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:opacity-90 transition"
                >
                  <BookmarkPlus size={16} />
                  {t("track")}
                </button>
              </form>
            )
          ) : (
            <div className="mt-3 bg-[var(--color-primary)]/5 rounded-[var(--radius-card)] border border-[var(--color-primary)]/20 p-4 text-center">
              <p className="text-sm text-[var(--color-foreground)] mb-3">{t("createGroupement")}</p>
              <Link
                href={`/${locale}/auth/signup`}
                className="inline-block bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition"
              >
                {t("track")}
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
