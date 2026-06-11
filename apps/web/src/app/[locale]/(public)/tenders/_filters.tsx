import type { TenderFiltersInput } from "@bina/core";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

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

const TYPES = ["travaux", "fournitures", "services", "conception_realisation"] as const;
const MO_TYPES = ["commune", "ministere", "etablissement_public", "prive"] as const;
const STATUSES = ["open", "closing_soon", "closed", "awarded", "cancelled"] as const;
const FNBTP = ["premiere", "deuxieme", "troisieme"] as const;
const DEADLINE_BUCKETS = [7, 14, 30, 90] as const;

type Props = {
  locale: string;
  regions: string[];
  filters: TenderFiltersInput;
  selectedStatus: string[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-[var(--color-border)] pt-3 mt-3 first:border-0 first:mt-0 first:pt-0">
      <legend className="text-xs font-semibold text-[var(--color-foreground)] mb-2">{title}</legend>
      {children}
    </fieldset>
  );
}

export async function TenderFilters({ locale, regions, filters, selectedStatus }: Props) {
  const t = await getTranslations("tender");
  const tSpec = await getTranslations("specialty");
  const tCommon = await getTranslations("common");
  const tComp = await getTranslations("compliance");
  const tProfile = await getTranslations("profile");

  const checkbox = (name: string, value: string, label: string, checked: boolean) => (
    <label
      key={`${name}-${value}`}
      className="flex items-center gap-2 text-sm text-[var(--color-foreground)] py-0.5 cursor-pointer"
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="accent-[var(--color-primary)]"
      />
      {label}
    </label>
  );

  return (
    <form method="get" className="space-y-1">
      <div className="mb-3">
        <input
          type="search"
          name="search"
          defaultValue={filters.search ?? ""}
          placeholder={tCommon("search")}
          className="w-full text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        />
      </div>

      <Section title={t("statusLabel")}>
        {STATUSES.map((s) => checkbox("status", s, t(`status.${s}`), selectedStatus.includes(s)))}
      </Section>

      <Section title={t("typeLabel")}>
        {TYPES.map((ty) =>
          checkbox("types", ty, t(`type.${ty}`), filters.types?.includes(ty) ?? false)
        )}
      </Section>

      <Section title={tProfile("specialties")}>
        {SPECIALTIES.map((s) =>
          checkbox("specialties", s, tSpec(s), filters.specialties?.includes(s) ?? false)
        )}
      </Section>

      <Section title={t("maitreDOuvrage")}>
        {MO_TYPES.map((m) =>
          checkbox(
            "maitreDOuvrageTypes",
            m,
            t(`maitreDOuvrageType.${m}`),
            filters.maitreDOuvrageTypes?.includes(m) ?? false
          )
        )}
      </Section>

      {regions.length > 0 && (
        <Section title={t("region")}>
          <div className="max-h-44 overflow-y-auto pr-1">
            {regions.map((r) => checkbox("regions", r, r, filters.regions?.includes(r) ?? false))}
          </div>
        </Section>
      )}

      <Section title={t("budget")}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="budgetMin"
            min={0}
            defaultValue={filters.budgetMin !== undefined ? filters.budgetMin / 100 : ""}
            placeholder="Min"
            className="w-full text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5"
          />
          <span className="text-[var(--color-muted)]">–</span>
          <input
            type="number"
            name="budgetMax"
            min={0}
            defaultValue={filters.budgetMax !== undefined ? filters.budgetMax / 100 : ""}
            placeholder="Max"
            className="w-full text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5"
          />
        </div>
        <p className="text-[11px] text-[var(--color-muted)] mt-1">{tCommon("currency")}</p>
      </Section>

      <Section title={t("deadlineFilterLabel")}>
        <select
          name="deadlineWithinDays"
          defaultValue={filters.deadlineWithinDays ?? ""}
          className="w-full text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5"
        >
          <option value="">{tCommon("all")}</option>
          {DEADLINE_BUCKETS.map((d) => (
            <option key={d} value={d}>
              {t("daysLeft", { n: d })}
            </option>
          ))}
        </select>
      </Section>

      <Section title={t("requiredFnbtp")}>
        <select
          name="fnbtpCategory"
          defaultValue={filters.fnbtpCategory ?? ""}
          className="w-full text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5"
        >
          <option value="">{tCommon("all")}</option>
          {FNBTP.map((c) => (
            <option key={c} value={c}>
              {tComp(`fnbtpCategory.${c}`)}
            </option>
          ))}
        </select>
      </Section>

      <div className="flex items-center gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[var(--color-primary-mid)] transition"
        >
          {tCommon("filter")}
        </button>
        <Link
          href={`/${locale}/tenders`}
          className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] px-3 py-2"
        >
          {tCommon("reset")}
        </Link>
      </div>
    </form>
  );
}
