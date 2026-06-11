"use client";
import { useTranslations } from "next-intl";
import { setTrackedStatusAction } from "./actions";

const STATUSES = ["watching", "bidding", "submitted", "won", "lost", "withdrawn"] as const;

// Status dropdown that auto-submits on change (progressively enhanced — the form
// still posts via the submit fallback if JS is off).
export function StatusForm({ id, current }: { id: string; current: string }) {
  const t = useTranslations("tender.trackingStatus");
  return (
    <form action={setTrackedStatusAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="text-xs underline">
          OK
        </button>
      </noscript>
    </form>
  );
}
