"use client";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { createReferenceAction } from "./actions";

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

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition";

const labelClass = "block text-sm font-medium text-[var(--color-foreground)] mb-1.5";

export function ReferenceForm() {
  const t = useTranslations("references");
  const tSpec = useTranslations("specialty");
  const tCommon = useTranslations("common");
  const [state, action, isPending] = useActionState(createReferenceAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 space-y-4"
    >
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("add")}</h2>

      <div>
        <label htmlFor="title" className={labelClass}>
          {t("projectTitle")} *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={200}
          placeholder={t("projectTitlePlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="maitreDOuvrage" className={labelClass}>
            {t("maitreDOuvrage")} *
          </label>
          <input
            id="maitreDOuvrage"
            name="maitreDOuvrage"
            type="text"
            required
            minLength={2}
            maxLength={200}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="specialty" className={labelClass}>
            {t("specialty")} *
          </label>
          <select id="specialty" name="specialty" required className={inputClass}>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {tSpec(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="contractValueMAD" className={labelClass}>
            {t("contractValue")}
          </label>
          <input
            id="contractValueMAD"
            name="contractValueMAD"
            type="number"
            min={1}
            step={1}
            placeholder="2 500 000"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="completedAt" className={labelClass}>
            {t("completedAt")} *
          </label>
          <input id="completedAt" name="completedAt" type="date" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--color-urgent)] bg-[var(--color-urgent)]/8 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-[var(--color-ok)] bg-[var(--color-ok)]/8 px-3 py-2 rounded-lg">
          {t("added")}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-6 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? tCommon("loading") : tCommon("save")}
      </button>
    </form>
  );
}
