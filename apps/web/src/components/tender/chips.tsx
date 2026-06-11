import { daysUntil, deadlineUrgency } from "@/lib/utils.js";
import { getTranslations } from "next-intl/server";

type TenderStatus = "open" | "closing_soon" | "closed" | "awarded" | "cancelled";

const STATUS_COLOR: Record<TenderStatus, string> = {
  open: "var(--color-ok)",
  closing_soon: "var(--color-warning)",
  closed: "var(--color-muted)",
  awarded: "var(--color-primary)",
  cancelled: "var(--color-urgent)",
};

// Status pill — always shown, color-coded per tender lifecycle state.
export async function StatusChip({ status }: { status: TenderStatus }) {
  const t = await getTranslations("tender");
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color, backgroundColor: "var(--color-surface)", border: `1px solid ${color}` }}
    >
      {t(`status.${status}`)}
    </span>
  );
}

// Deadline countdown chip. Red < 7 days, orange < 14 days (CLAUDE.md §10/non-negotiable #7).
// Only meaningful for open/closing_soon tenders.
export async function DeadlineChip({ deadline }: { deadline: Date }) {
  const t = await getTranslations("tender");
  const days = daysUntil(deadline);

  let label: string;
  let color: string;

  if (days < 0) {
    label = t("expired");
    color = "var(--color-muted)";
  } else if (days === 0) {
    label = t("today");
    color = "var(--color-urgent)";
  } else {
    const urgency = deadlineUrgency(days);
    color =
      urgency === "critical"
        ? "var(--color-urgent)"
        : urgency === "warning"
          ? "var(--color-warning)"
          : "var(--color-muted)";
    label = urgency === "critical" ? t("urgent", { n: days }) : t("daysLeft", { n: days });
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color, backgroundColor: "var(--color-surface)", border: `1px solid ${color}` }}
    >
      <span aria-hidden>⏱</span>
      {label}
    </span>
  );
}
