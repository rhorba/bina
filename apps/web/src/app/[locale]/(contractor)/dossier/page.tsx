import { getSession } from "@/auth/index.js";
import {
  type ScorableDoc,
  computeComplianceScore,
  listDocuments,
  missingScoredDocTypes,
} from "@bina/compliance";
import { db } from "@bina/db";
import { AlertTriangle, FileText, FolderCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DocActions } from "./_doc-actions";
import { DocStatusChip } from "./_doc-status-chip";
import { UploadForm } from "./_upload-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

function scoreColor(score: number): string {
  if (score >= 80) return "var(--color-ok)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-urgent)";
}

export default async function DossierPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  const docs = await listDocuments(db, session.contractorId);

  const [t, tDoc] = await Promise.all([getTranslations("compliance"), getTranslations("docType")]);

  const score = computeComplianceScore(docs as ScorableDoc[]);
  const missing = missingScoredDocTypes(docs as ScorableDoc[]);
  const alerts = docs.filter((d) => d.status === "expiring_soon" || d.status === "expired");

  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/dossier/builder`}
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] rounded-lg px-4 py-2.5 transition"
        >
          <FolderCheck size={16} />
          {t("buildDossier")}
        </Link>
      </div>

      {/* Compliance score + completeness */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-6 flex items-center gap-5">
        <div
          className="shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold"
          style={{
            color: scoreColor(score),
            border: `4px solid ${scoreColor(score)}`,
          }}
        >
          {score}%
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[var(--color-foreground)]">{t("complianceScore")}</div>
          {missing.length === 0 ? (
            <p className="text-sm text-[var(--color-ok)] mt-1">{t("scoreComplete")}</p>
          ) : (
            <p className="text-sm text-[var(--color-muted)] mt-1">
              {t("scoreMissing")}{" "}
              <span className="text-[var(--color-foreground)]">
                {missing.map((m) => tDoc(m)).join(", ")}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Expiry alerts (15-day advance warning) */}
      {alerts.length > 0 && (
        <div className="bg-[var(--color-warning)]/8 border border-[var(--color-warning)]/30 rounded-[var(--radius-card)] p-4 mb-6">
          <div className="flex items-center gap-2 font-semibold text-sm text-[var(--color-foreground)] mb-2">
            <AlertTriangle size={16} className="text-[var(--color-warning)]" />
            {t("expiryAlerts")}
          </div>
          <ul className="space-y-1 text-sm text-[var(--color-muted)]">
            {alerts.map((d) => (
              <li key={d.id}>
                {tDoc(d.type)} —{" "}
                {d.status === "expired"
                  ? t("alertExpired")
                  : d.expiresAt
                    ? t("alertExpiring", { date: dateFormatter.format(d.expiresAt) })
                    : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Document list */}
      <div className="space-y-3 mb-8">
        {docs.length === 0 && (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
            {t("empty")}
          </div>
        )}
        {docs.map((doc) => {
          const canRenew = doc.status === "expiring_soon" || doc.status === "expired";
          return (
            <div
              key={doc.id}
              className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <FileText size={15} className="text-[var(--color-muted)] shrink-0" />
                  <span className="font-semibold text-sm text-[var(--color-foreground)]">
                    {tDoc(doc.type)}
                  </span>
                  <DocStatusChip status={doc.status} />
                </div>
                <p className="text-xs text-[var(--color-muted)] truncate">
                  {doc.fileName}
                  {doc.expiresAt && (
                    <>
                      {" · "}
                      {t("expiresOn", { date: dateFormatter.format(doc.expiresAt) })}
                    </>
                  )}
                </p>
              </div>
              <DocActions docId={doc.id} canRenew={canRenew} />
            </div>
          );
        })}
      </div>

      {/* Privacy note + disclaimer */}
      <p className="text-xs text-[var(--color-muted)] mb-4">{t("privacyNote")}</p>

      <UploadForm />
    </div>
  );
}
