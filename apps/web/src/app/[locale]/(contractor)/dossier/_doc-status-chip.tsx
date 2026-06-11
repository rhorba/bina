import { getTranslations } from "next-intl/server";

type DocStatus = "valid" | "expiring_soon" | "expired" | "pending_renewal";

const STATUS_COLOR: Record<DocStatus, string> = {
  valid: "var(--color-ok)",
  expiring_soon: "var(--color-warning)",
  expired: "var(--color-urgent)",
  pending_renewal: "var(--color-primary)",
};

// Traffic-light status pill for a compliance document (CLAUDE.md §9 compliance
// status = traffic-light). Color-coded; label translated FR/AR.
export async function DocStatusChip({ status }: { status: DocStatus }) {
  const t = await getTranslations("compliance");
  const color = STATUS_COLOR[status] ?? "var(--color-muted)";
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color, backgroundColor: "var(--color-surface)", border: `1px solid ${color}` }}
    >
      {t(`status.${status}`)}
    </span>
  );
}
