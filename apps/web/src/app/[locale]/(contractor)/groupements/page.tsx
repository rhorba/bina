import { getSession } from "@/auth/index.js";
import { DeadlineChip } from "@/components/tender/chips.js";
import { db } from "@bina/db";
import { type GroupementListItem, listMyGroupements, listOpenGroupements } from "@bina/groupement";
import { Building2, MapPin, Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupementStatusChip } from "./_status-chip";

export const dynamic = "force-dynamic";

const SPECIALTIES = [
  "genie_civil",
  "batiment",
  "second_oeuvre",
  "plomberie",
  "electricite",
  "courants_faibles",
  "hvac",
  "charpente",
  "peinture",
  "architecture",
  "bureau_etudes",
  "routes",
  "hydraulique",
  "equipment_supplier",
  "other",
] as const;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ specialty?: string }>;
};

export default async function GroupementsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { specialty } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  const [mine, open, t, tSpec] = await Promise.all([
    listMyGroupements(db, session.contractorId),
    listOpenGroupements(db, specialty ? { specialty } : {}),
    getTranslations("groupement"),
    getTranslations("specialty"),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/groupements/new`}
          className="inline-flex items-center gap-1.5 shrink-0 bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-4 py-2.5 transition"
        >
          <Plus size={16} />
          {t("create")}
        </Link>
      </div>

      {/* Mes groupements */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">{t("mine")}</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
            {t("mineEmpty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {mine.map((g) => (
              <GroupementCard key={g.id} g={g} locale={locale} tSpec={tSpec} joinable={false} />
            ))}
          </ul>
        )}
      </section>

      {/* Groupements ouverts */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("open")}</h2>
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="specialty" className="text-xs text-[var(--color-muted)]">
              {t("filterSpecialty")}
            </label>
            <select
              id="specialty"
              name="specialty"
              defaultValue={specialty ?? ""}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">{t("allSpecialties")}</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {tSpec(s)}
                </option>
              ))}
            </select>
            <button type="submit" className="text-sm font-medium text-[var(--color-primary)]">
              {t("filter")}
            </button>
          </form>
        </div>
        {open.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
            {t("openEmpty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {open.map((g) => (
              <GroupementCard key={g.id} g={g} locale={locale} tSpec={tSpec} joinable={true} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function GroupementCard({
  g,
  locale,
  tSpec,
  joinable,
}: {
  g: GroupementListItem;
  locale: string;
  tSpec: (key: string) => string;
  joinable: boolean;
}) {
  const t = await getTranslations("groupement");
  const active = g.status === "forming";
  return (
    <li className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/${locale}/groupements/${g.id}`}
          className="font-semibold text-[var(--color-foreground)] leading-snug hover:text-[var(--color-primary)] transition min-w-0"
        >
          {g.title}
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <GroupementStatusChip status={g.status} />
          {active && <DeadlineChip deadline={g.submissionDeadline} />}
        </div>
      </div>

      <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-sm text-[var(--color-muted)] flex-wrap">
        <span className="flex items-center gap-1 min-w-0">
          <Building2 size={14} className="shrink-0" />
          <span className="truncate">{g.tenderTitle}</span>
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {g.tenderRegion}
        </span>
        <span className="flex items-center gap-1">
          <Users size={14} />
          {g.memberCount}
        </span>
      </div>

      {g.neededSpecialties.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <span className="text-xs text-[var(--color-muted)]">{t("seeking")}:</span>
          {g.neededSpecialties.map((s) => (
            <span
              key={s}
              className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
            >
              {tSpec(s)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
        <Link
          href={`/${locale}/groupements/${g.id}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {joinable ? t("viewAndJoin") : t("openWorkspace")} →
        </Link>
      </div>
    </li>
  );
}
