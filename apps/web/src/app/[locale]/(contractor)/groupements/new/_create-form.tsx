"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { createGroupementAction } from "../actions";

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

type TenderOption = { id: string; title: string; region: string };

export function CreateGroupementForm({
  tenders,
  mySpecialties,
  preselectTenderId,
}: {
  tenders: TenderOption[];
  mySpecialties: string[];
  preselectTenderId?: string;
}) {
  const t = useTranslations("groupement");
  const tSpec = useTranslations("specialty");
  const tCommon = useTranslations("common");
  const [state, action, isPending] = useActionState(createGroupementAction, null);

  // The initiator must declare which trade THEY cover as mandataire.
  const mandataireOptions = mySpecialties.length > 0 ? mySpecialties : [...SPECIALTIES];

  return (
    <form
      action={action}
      className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 space-y-4"
    >
      <div>
        <label htmlFor="tenderId" className={labelClass}>
          {t("tender")} *
        </label>
        {tenders.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t("noOpenTenders")}</p>
        ) : (
          <select
            id="tenderId"
            name="tenderId"
            required
            defaultValue={preselectTenderId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              {t("selectTender")}
            </option>
            {tenders.map((tn) => (
              <option key={tn.id} value={tn.id}>
                {tn.title} — {tn.region}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>
          {t("groupementTitle")} *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={5}
          maxLength={300}
          placeholder={t("titlePlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="initiatorSpecialty" className={labelClass}>
            {t("yourTrade")} *
          </label>
          <select id="initiatorSpecialty" name="initiatorSpecialty" required className={inputClass}>
            {mandataireOptions.map((s) => (
              <option key={s} value={s}>
                {tSpec(s)}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t("youAreMandataire")}</p>
        </div>
        <div>
          <label htmlFor="targetBudgetMad" className={labelClass}>
            {t("targetBudget")}
          </label>
          <input
            id="targetBudgetMad"
            name="targetBudgetMad"
            type="number"
            min={1}
            step={1}
            placeholder="5 000 000"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>{t("neededSpecialties")} *</span>
        <p className="text-xs text-[var(--color-muted)] mb-2">{t("neededSpecialtiesHint")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPECIALTIES.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 text-sm text-[var(--color-foreground)] cursor-pointer"
            >
              <input
                type="checkbox"
                name="neededSpecialties"
                value={s}
                className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
              />
              {tSpec(s)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="workspaceNotes" className={labelClass}>
          {t("notes")}
        </label>
        <textarea
          id="workspaceNotes"
          name="workspaceNotes"
          rows={3}
          maxLength={2000}
          placeholder={t("notesPlaceholder")}
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--color-urgent)] bg-[var(--color-urgent)]/8 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || tenders.length === 0}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-6 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? tCommon("loading") : t("create")}
      </button>
    </form>
  );
}
