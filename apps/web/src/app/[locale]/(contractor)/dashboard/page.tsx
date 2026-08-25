import { getSession } from "@/auth/index.js";
import { contractorProfiles, db } from "@bina/db";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (session?.role === "admin") {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations("dashboard");

  const FEATURES = [
    { href: "tenders", icon: "🔍", label: t("featureTenders"), hint: t("featureTendersHint") },
    { href: "alertes", icon: "🔔", label: t("featureAlerts"), hint: t("featureAlertsHint") },
    {
      href: "groupements",
      icon: "🤝",
      label: t("featureGroupements"),
      hint: t("featureGroupementsHint"),
    },
    { href: "dossier", icon: "📋", label: t("featureDossier"), hint: t("featureDossierHint") },
  ];

  let companyName: string | undefined;
  let complianceScore = 0;
  if (session?.contractorId) {
    const profile = await db.query.contractorProfiles.findFirst({
      where: eq(contractorProfiles.id, session.contractorId),
      columns: { companyName: true, complianceScore: true },
    });
    companyName = profile?.companyName;
    complianceScore = profile?.complianceScore ?? 0;
  }

  return (
    <div className="max-w-3xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {companyName ? t("welcomeWithCompany", { name: companyName }) : t("welcome")}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
      </div>

      {/* Compliance score */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            {t("complianceCompleteness")}
          </span>
          <span
            className="text-sm font-bold"
            style={{
              color:
                complianceScore >= 80
                  ? "var(--color-ok)"
                  : complianceScore >= 50
                    ? "var(--color-warning)"
                    : "var(--color-urgent)",
            }}
          >
            {complianceScore}%
          </span>
        </div>
        <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${complianceScore}%`,
              backgroundColor:
                complianceScore >= 80
                  ? "var(--color-ok)"
                  : complianceScore >= 50
                    ? "var(--color-warning)"
                    : "var(--color-urgent)",
            }}
          />
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={`/${locale}/${f.href}`}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 sm:p-5 hover:border-[var(--color-primary-mid)] hover:shadow-sm transition group"
          >
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="font-semibold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
              {f.label}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">{f.hint}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
