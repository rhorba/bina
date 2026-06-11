"use client";
import { useTranslations } from "next-intl";
import { transitionStatusAction } from "../actions";

// Mandataire/system status advancement. Each allowed next status is a button;
// `formed` is disabled until all needed specialties are covered (missing list).
export function StatusTransitions({
  groupementId,
  allowed,
  missing,
}: {
  groupementId: string;
  allowed: string[];
  missing: string[];
}) {
  const t = useTranslations("groupement");
  if (allowed.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">{t("noTransitions")}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allowed.map((to) => {
          const blocked = to === "formed" && missing.length > 0;
          return (
            <form key={to} action={transitionStatusAction}>
              <input type="hidden" name="groupementId" value={groupementId} />
              <input type="hidden" name="status" value={to} />
              <button
                type="submit"
                disabled={blocked}
                title={blocked ? t("formBlocked") : undefined}
                className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-fg)] transition disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--color-primary)]"
              >
                {t(`advanceTo.${to}`)}
              </button>
            </form>
          );
        })}
      </div>
      {missing.length > 0 && allowed.includes("formed") && (
        <p className="text-xs text-[var(--color-warning)]">
          {t("formBlocked")} ({missing.length})
        </p>
      )}
    </div>
  );
}
