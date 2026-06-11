import { getSession } from "@/auth/index.js";
import { type DossierVaultDoc, buildDossierChecklist, listDocuments } from "@bina/compliance";
import { db } from "@bina/db";
import { getTenderWithLots, listTrackedTenders } from "@bina/tenders";
import { ArrowLeft, CheckCircle2, Circle, Clock, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tenderId?: string }>;
};

export default async function DossierBuilderPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tenderId } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  const [t, tDoc] = await Promise.all([getTranslations("compliance"), getTranslations("docType")]);

  const tracked = await listTrackedTenders(db, session.contractorId);

  const selected = tenderId ? await getTenderWithLots(db, tenderId) : null;
  const docs = selected ? await listDocuments(db, session.contractorId) : [];

  const checklist = selected
    ? buildDossierChecklist(
        {
          type: selected.tender.type,
          requiredFNBTPCategory: selected.tender.requiredFnbtpCategory,
          estimatedBudgetMax: selected.tender.estimatedBudgetMaxCentimes,
        },
        docs as DossierVaultDoc[]
      )
    : null;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/${locale}/dossier`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition mb-2"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("backToVault")}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("builderTitle")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("builderSubtitle")}</p>
      </div>

      {/* Tender picker — drawn from the contractor's tracked tenders */}
      <form
        method="get"
        className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-6"
      >
        <label
          htmlFor="tenderId"
          className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5"
        >
          {t("selectTender")}
        </label>
        {tracked.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t("noTrackedTenders")}{" "}
            <Link
              href={`/${locale}/tenders`}
              className="text-[var(--color-primary)] hover:underline"
            >
              {t("browseTenders")}
            </Link>
          </p>
        ) : (
          <div className="flex gap-2">
            <select
              id="tenderId"
              name="tenderId"
              defaultValue={tenderId ?? ""}
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
            >
              <option value="" disabled>
                {t("selectTenderPlaceholder")}
              </option>
              {tracked.map(({ tender }) => (
                <option key={tender.id} value={tender.id}>
                  {tender.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-5 py-2.5 transition"
            >
              {t("generate")}
            </button>
          </div>
        )}
      </form>

      {/* Checklist */}
      {selected && checklist && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-6">
          <h2 className="font-semibold text-[var(--color-foreground)] mb-1">
            {selected.tender.title}
          </h2>
          <p className="text-xs text-[var(--color-muted)] mb-4">{selected.tender.maitreDOuvrage}</p>

          {checklist.complete ? (
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-ok)] mb-4">
              <CheckCircle2 size={16} />
              {t("dossierComplete")}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-warning)] mb-4">
              <Info size={16} />
              {t("dossierIncomplete", { n: checklist.missingRequired.length })}
            </div>
          )}

          <ul className="divide-y divide-[var(--color-border)]">
            {checklist.items.map((item) => (
              <li key={item.docType} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  {item.state === "have" ? (
                    <CheckCircle2 size={16} className="text-[var(--color-ok)] shrink-0" />
                  ) : item.state === "expiring" ? (
                    <Clock size={16} className="text-[var(--color-warning)] shrink-0" />
                  ) : (
                    <Circle size={16} className="text-[var(--color-muted)] shrink-0" />
                  )}
                  <span className="text-sm text-[var(--color-foreground)]">
                    {tDoc(item.docType)}
                  </span>
                  {!item.required && (
                    <span className="text-xs text-[var(--color-muted)]">({t("recommended")})</span>
                  )}
                </div>
                <span className="text-xs font-medium shrink-0 text-[var(--color-muted)]">
                  {item.state === "have"
                    ? t("itemHave")
                    : item.state === "expiring"
                      ? t("itemExpiring")
                      : t("itemMissing")}
                </span>
              </li>
            ))}
          </ul>

          {checklist.missingRequired.length > 0 && (
            <Link
              href={`/${locale}/dossier`}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {t("uploadMissing")}
            </Link>
          )}
        </div>
      )}

      {/* Disclaimer — Bina never certifies compliance (rule #5, verbatim) */}
      {checklist && (
        <p className="text-xs text-[var(--color-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3">
          {checklist.disclaimer}
        </p>
      )}
    </div>
  );
}
