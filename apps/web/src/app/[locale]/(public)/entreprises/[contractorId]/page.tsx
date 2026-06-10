import { formatMAD } from "@bina/core";
import { contractorProfiles, db, projectReferences, users } from "@bina/db";
import { desc, eq } from "drizzle-orm";
import { Building2, MapPin, Medal, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string; contractorId: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props) {
  const { contractorId } = await params;
  if (!UUID_RE.test(contractorId)) return { title: "Bina" };
  const profile = await db.query.contractorProfiles.findFirst({
    where: eq(contractorProfiles.id, contractorId),
    columns: { companyName: true },
  });
  return { title: profile ? `${profile.companyName} — Bina` : "Bina" };
}

export default async function PublicContractorPage({ params }: Props) {
  const { locale, contractorId } = await params;
  if (!UUID_RE.test(contractorId)) notFound();

  const profile = await db.query.contractorProfiles.findFirst({
    where: eq(contractorProfiles.id, contractorId),
  });
  if (!profile) notFound();

  // Public page: only non-sensitive fields are rendered (CLAUDE.md §7).
  const [user, references] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, profile.userId),
      columns: { city: true },
    }),
    db.query.projectReferences.findMany({
      where: eq(projectReferences.contractorId, contractorId),
      orderBy: [desc(projectReferences.completedAt)],
    }),
  ]);

  const t = await getTranslations("publicProfile");
  const tSpec = await getTranslations("specialty");
  const tProfile = await getTranslations("profile");
  const tComp = await getTranslations("compliance");
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    year: "numeric",
    month: "long",
  });

  const scoreColor =
    profile.complianceScore >= 80
      ? "var(--color-ok)"
      : profile.complianceScore >= 50
        ? "var(--color-warning)"
        : "var(--color-urgent)";

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/8 flex items-center justify-center shrink-0">
            <Building2 size={26} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {profile.companyName}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-[var(--color-muted)] flex-wrap">
              {user?.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {user.city}
                </span>
              )}
              <span>{tProfile(`companySize.${profile.companySize}`)}</span>
              {profile.completedTenders > 0 && (
                <span>{t("completedTenders", { count: profile.completedTenders })}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.specialties.map((s) => (
                <span
                  key={s}
                  className="text-xs font-medium bg-[var(--color-primary)]/8 text-[var(--color-primary)] px-2.5 py-1 rounded-full"
                >
                  {tSpec(s)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance + FNBTP badges */}
        <div className="shrink-0 space-y-2 text-right rtl:text-left">
          <div
            className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg"
            style={{ color: scoreColor, backgroundColor: "var(--color-surface)" }}
          >
            <ShieldCheck size={16} />
            {t("complianceScore", { score: profile.complianceScore })}
          </div>
          {profile.fnbtpCategory && (
            <div className="flex items-center justify-end rtl:justify-start gap-1.5 text-xs font-medium text-[var(--color-muted)]">
              <Medal size={14} className="text-[var(--color-accent)]" />
              FNBTP — {tComp(`fnbtpCategory.${profile.fnbtpCategory}`)}
            </div>
          )}
        </div>
      </div>

      {/* Regions */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
          {tProfile("regions")}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {profile.regions.map((r) => (
            <span
              key={r}
              className="text-xs text-[var(--color-muted)] border border-[var(--color-border)] px-2.5 py-1 rounded-full"
            >
              {r}
            </span>
          ))}
          {profile.regions.length === 0 && (
            <span className="text-sm text-[var(--color-muted)]">—</span>
          )}
        </div>
      </section>

      {/* References */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
          {tProfile("references")} ({references.length})
        </h2>
        {references.length === 0 && (
          <p className="text-sm text-[var(--color-muted)]">{tProfile("noReferences")}</p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-sm text-[var(--color-foreground)]">
                  {ref.title}
                </h3>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                {ref.maitreDOuvrage} — {dateFormatter.format(ref.completedAt)}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-medium bg-[var(--color-primary)]/8 text-[var(--color-primary)] px-2 py-0.5 rounded-full">
                  {tSpec(ref.specialty)}
                </span>
                {ref.contractValueCentimes !== null && (
                  <span className="text-xs font-medium text-[var(--color-foreground)]">
                    {formatMAD(ref.contractValueCentimes, locale === "ar" ? "ar" : "fr")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
