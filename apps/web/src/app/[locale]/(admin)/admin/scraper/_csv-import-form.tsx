"use client";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type CsvImportState, importCsvAction } from "./actions.js";

const KNOWN_ERRORS = new Set(["forbidden", "noFile", "tooLarge"]);

export function CsvImportForm() {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState<CsvImportState, FormData>(importCsvAction, null);

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor="csv">
        {t("csv.label")}
      </label>
      <input
        id="csv"
        name="csv"
        type="file"
        accept=".csv,text/csv"
        required
        className="block w-full text-sm text-[var(--color-muted)] file:me-3 file:rounded-md file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
      />
      <p className="text-xs text-[var(--color-muted)]">{t("csv.hint")}</p>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
      >
        <Upload size={16} aria-hidden="true" />
        {pending ? t("csv.importing") : t("csv.import")}
      </button>

      {state?.ok === true && (
        <output className="block text-sm font-medium text-[var(--color-ok)] bg-[var(--color-ok)]/10 rounded-md px-3 py-2">
          {t("csv.success", {
            inserted: state.result.inserted,
            updated: state.result.updated,
            errors: state.result.errors.length,
          })}
        </output>
      )}
      {state?.ok === false && (
        <p
          role="alert"
          className="text-sm font-medium text-[var(--color-urgent)] bg-[var(--color-urgent)]/10 rounded-md px-3 py-2"
        >
          {KNOWN_ERRORS.has(state.error) ? t(`csv.errors.${state.error}`) : t("csv.errors.unknown")}
        </p>
      )}
    </form>
  );
}
