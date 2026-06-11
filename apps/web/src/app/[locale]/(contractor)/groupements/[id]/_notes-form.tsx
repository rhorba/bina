"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { updateNotesAction } from "../actions";

// Shared workspace notes — last-write-wins (groupement-engine spec). Members edit.
export function NotesForm({ groupementId, initial }: { groupementId: string; initial: string }) {
  const t = useTranslations("groupement");
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;

  return (
    <form action={updateNotesAction} className="space-y-2">
      <input type="hidden" name="groupementId" value={groupementId} />
      <textarea
        name="notes"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder={t("notesPlaceholder")}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
      />
      <button
        type="submit"
        disabled={!dirty}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-5 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t("saveNotes")}
      </button>
    </form>
  );
}
