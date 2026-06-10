import { getSession } from "@/auth/index.js";
import { contractorProfiles, db } from "@bina/db";
import { eq } from "drizzle-orm";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

const COMING_SOON = [
  { href: "tenders", icon: "🔍", label: "Radar marchés", sprint: "Sprint 2" },
  { href: "alertes", icon: "🔔", label: "Mes alertes", sprint: "Sprint 3" },
  { href: "groupements", icon: "🤝", label: "Groupements", sprint: "Sprint 4" },
  { href: "dossier", icon: "📋", label: "Mon dossier", sprint: "Sprint 5" },
];

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();

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
          Bienvenue{companyName ? `, ${companyName}` : ""}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Votre espace Bina — les fonctionnalités arrivent sprint par sprint.
        </p>
      </div>

      {/* Compliance score */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Complétude du dossier réglementaire
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
      <div className="grid grid-cols-2 gap-4">
        {COMING_SOON.map((f) => (
          <Link
            key={f.href}
            href={`/${locale}/${f.href}`}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 hover:border-[var(--color-primary-mid)] hover:shadow-sm transition group"
          >
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="font-semibold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
              {f.label}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">{f.sprint}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
