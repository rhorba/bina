import { getSession } from "@/auth/index.js";
import { formatMAD } from "@bina/core";
import { db, projectReferences } from "@bina/db";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReferenceForm } from "./_form";
import { deleteReferenceAction } from "./actions";

type Props = { params: Promise<{ locale: string }> };

export default async function ReferencesPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  const references = await db.query.projectReferences.findMany({
    where: eq(projectReferences.contractorId, session.contractorId),
    orderBy: [desc(projectReferences.completedAt)],
  });

  const t = await getTranslations("references");
  const tSpec = await getTranslations("specialty");
  const tCommon = await getTranslations("common");
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/${locale}/profil`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition mb-2"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {tCommon("back")}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
      </div>

      <div className="space-y-3 mb-8">
        {references.length === 0 && (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
            {t("empty")}
          </div>
        )}
        {references.map((ref) => (
          <div
            key={ref.id}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-semibold text-sm text-[var(--color-foreground)]">
                  {ref.title}
                </h2>
                <span className="text-xs font-medium bg-[var(--color-primary)]/8 text-[var(--color-primary)] px-2 py-0.5 rounded-full">
                  {tSpec(ref.specialty)}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                {ref.maitreDOuvrage} — {dateFormatter.format(ref.completedAt)}
                {ref.contractValueCentimes !== null && (
                  <>
                    {" · "}
                    <span className="font-medium text-[var(--color-foreground)]">
                      {formatMAD(ref.contractValueCentimes, locale === "ar" ? "ar" : "fr")}
                    </span>
                  </>
                )}
              </p>
              {ref.description && (
                <p className="text-xs text-[var(--color-muted)] mt-2">{ref.description}</p>
              )}
            </div>
            <form action={deleteReferenceAction} className="shrink-0">
              <input type="hidden" name="referenceId" value={ref.id} />
              <button
                type="submit"
                title={tCommon("delete")}
                className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-urgent)] hover:bg-[var(--color-urgent)]/8 transition"
              >
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        ))}
      </div>

      <ReferenceForm />
    </div>
  );
}
