"use client";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { type DocFormState, uploadDocumentAction } from "./actions";

const DOC_TYPES = [
  "attestation_fiscale",
  "quitus_cnss",
  "assurance_decennale",
  "rc_pro",
  "registre_commerce",
  "statuts",
  "qualification_fnbtp",
  "reference_chantier",
  "other",
] as const;

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition";
const labelClass = "block text-sm font-medium text-[var(--color-foreground)] mb-1.5";

export function UploadForm() {
  const t = useTranslations("compliance");
  const tDoc = useTranslations("docType");
  const tCommon = useTranslations("common");
  const [state, action, isPending] = useActionState<DocFormState, FormData>(
    uploadDocumentAction,
    null
  );
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
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("addDocument")}</h2>

      <div>
        <label htmlFor="type" className={labelClass}>
          {t("documentType")} *
        </label>
        <select
          id="type"
          name="type"
          required
          className={inputClass}
          defaultValue="attestation_fiscale"
        >
          {DOC_TYPES.map((d) => (
            <option key={d} value={d}>
              {tDoc(d)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="file" className={labelClass}>
          {t("file")} *
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png"
          className={inputClass}
        />
        <p className="text-xs text-[var(--color-muted)] mt-1">{t("fileHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="issuedAt" className={labelClass}>
            {t("issuedAt")}
          </label>
          <input id="issuedAt" name="issuedAt" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="expiresAt" className={labelClass}>
            {t("expiresAt")}
          </label>
          <input id="expiresAt" name="expiresAt" type="date" className={inputClass} />
          <p className="text-xs text-[var(--color-muted)] mt-1">{t("expiresAtHint")}</p>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--color-urgent)] bg-[var(--color-urgent)]/8 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-[var(--color-ok)] bg-[var(--color-ok)]/8 px-3 py-2 rounded-lg">
          {t("uploaded")}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-6 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? tCommon("loading") : t("upload")}
      </button>
    </form>
  );
}
