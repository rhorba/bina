"use client";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteDocumentAction, downloadDocumentAction, markRenewalAction } from "./actions";

// Per-document action row: secure download (mints a 15-min signed URL via the
// server action + audit, then opens it), mark-as-renewing, and delete.
export function DocActions({ docId, canRenew }: { docId: string; canRenew: boolean }) {
  const t = useTranslations("compliance");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDownload() {
    setError(null);
    startTransition(async () => {
      const res = await downloadDocumentAction(docId);
      if (res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        setError(res.error ?? t("downloadUnavailable"));
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={onDownload}
        disabled={isPending}
        title={t("download")}
        className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 transition disabled:opacity-60"
      >
        {t("download")}
      </button>
      {canRenew && (
        <form action={markRenewalAction}>
          <input type="hidden" name="docId" value={docId} />
          <button
            type="submit"
            title={t("markRenewal")}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-[var(--color-warning)] hover:bg-[var(--color-warning)]/8 transition"
          >
            {t("markRenewal")}
          </button>
        </form>
      )}
      <form action={deleteDocumentAction}>
        <input type="hidden" name="docId" value={docId} />
        <button
          type="submit"
          title={tCommon("delete")}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-urgent)] hover:bg-[var(--color-urgent)]/8 transition"
        >
          {tCommon("delete")}
        </button>
      </form>
      {error && <span className="text-xs text-[var(--color-urgent)]">{error}</span>}
    </div>
  );
}
