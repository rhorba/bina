"use client";
import { MOROCCAN_REGIONS } from "@bina/core";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { updateProfileAction } from "./actions";

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

const COMPANY_SIZES = ["micro", "tpe", "pme", "eti"] as const;
const FNBTP_CATEGORIES = ["premiere", "deuxieme", "troisieme", "non_qualifie"] as const;

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition";

const labelClass = "block text-sm font-medium text-[var(--color-foreground)] mb-1.5";

const sectionClass =
  "bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 space-y-4";

export type ProfileFormValues = {
  companyName: string;
  ice: string | null;
  rc: string | null;
  specialties: string[];
  regions: string[];
  companySize: string;
  employeeCount: number | null;
  maxContractValueCentimes: number | null;
  fnbtpCategory: string | null;
  fnbtpNumber: string | null;
};

export function ProfileForm({ profile }: { profile: ProfileFormValues }) {
  const t = useTranslations("profile");
  const tSpec = useTranslations("specialty");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tComp = useTranslations("compliance");
  const [state, action, isPending] = useActionState(updateProfileAction, null);

  return (
    <form action={action} className="space-y-6">
      {/* Company info */}
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("companyInfo")}</h2>
        <div>
          <label htmlFor="companyName" className={labelClass}>
            {tAuth("companyName")} *
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            defaultValue={profile.companyName}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ice" className={labelClass}>
              {t("ice")}
            </label>
            <input
              id="ice"
              name="ice"
              type="text"
              pattern="\d{15}"
              title="15 chiffres"
              defaultValue={profile.ice ?? ""}
              placeholder="001234567891234"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rc" className={labelClass}>
              {t("rc")}
            </label>
            <input
              id="rc"
              name="rc"
              type="text"
              defaultValue={profile.rc ?? ""}
              placeholder="RC-CASA-123456"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          {t("specialties")} *
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPECIALTIES.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 text-sm text-[var(--color-foreground)] px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg)] cursor-pointer"
            >
              <input
                type="checkbox"
                name="specialties"
                value={s}
                defaultChecked={profile.specialties.includes(s)}
                className="accent-[var(--color-primary)]"
              />
              {tSpec(s)}
            </label>
          ))}
        </div>
      </section>

      {/* Regions */}
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("regions")} *</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MOROCCAN_REGIONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 text-sm text-[var(--color-foreground)] px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg)] cursor-pointer"
            >
              <input
                type="checkbox"
                name="regions"
                value={r}
                defaultChecked={profile.regions.includes(r)}
                className="accent-[var(--color-primary)]"
              />
              {r}
            </label>
          ))}
        </div>
      </section>

      {/* Capacity */}
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("capacity")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="companySize" className={labelClass}>
              {t("capacity")} *
            </label>
            <select
              id="companySize"
              name="companySize"
              required
              defaultValue={profile.companySize}
              className={inputClass}
            >
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {t(`companySize.${size}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="employeeCount" className={labelClass}>
              {t("employeeCount")}
            </label>
            <input
              id="employeeCount"
              name="employeeCount"
              type="number"
              min={1}
              max={10000}
              defaultValue={profile.employeeCount ?? ""}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="maxContractValueMAD" className={labelClass}>
            {t("maxContractValue")}
          </label>
          <input
            id="maxContractValueMAD"
            name="maxContractValueMAD"
            type="number"
            min={1}
            step={1}
            defaultValue={
              profile.maxContractValueCentimes === null
                ? ""
                : Math.round(profile.maxContractValueCentimes / 100)
            }
            placeholder="5 000 000"
            className={inputClass}
          />
        </div>
      </section>

      {/* FNBTP */}
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("fnbtp")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fnbtpCategory" className={labelClass}>
              {t("fnbtp")}
            </label>
            <select
              id="fnbtpCategory"
              name="fnbtpCategory"
              defaultValue={profile.fnbtpCategory ?? ""}
              className={inputClass}
            >
              <option value="">—</option>
              {FNBTP_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tComp(`fnbtpCategory.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fnbtpNumber" className={labelClass}>
              N° FNBTP
            </label>
            <input
              id="fnbtpNumber"
              name="fnbtpNumber"
              type="text"
              defaultValue={profile.fnbtpNumber ?? ""}
              placeholder="FNBTP-2-04512"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {state?.error && (
        <p className="text-sm text-[var(--color-urgent)] bg-[var(--color-urgent)]/8 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-[var(--color-ok)] bg-[var(--color-ok)]/8 px-3 py-2 rounded-lg">
          {t("saved")}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-6 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? tCommon("loading") : t("save")}
      </button>
    </form>
  );
}
