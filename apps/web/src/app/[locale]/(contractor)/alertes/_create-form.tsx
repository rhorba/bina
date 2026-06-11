"use client";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { type AlertFormState, createSavedSearchAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition";

// `filtersJson` is the current radar filter set serialized by the page (server),
// carried through as a hidden field so the saved search captures exactly it.
export function CreateAlertForm({ filtersJson }: { filtersJson: string }) {
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const [state, action, isPending] = useActionState<AlertFormState, FormData>(
    createSavedSearchAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="filters" value={filtersJson} />
      <div className="flex-1">
        <label
          htmlFor="alert-name"
          className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5"
        >
          {t("name")} *
        </label>
        <input
          id="alert-name"
          name="name"
          type="text"
          required
          minLength={1}
          maxLength={100}
          placeholder={t("namePlaceholder")}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-6 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isPending ? tCommon("loading") : t("save")}
      </button>
      {state?.error && <p className="text-sm text-[var(--color-urgent)] w-full">{state.error}</p>}
    </form>
  );
}
