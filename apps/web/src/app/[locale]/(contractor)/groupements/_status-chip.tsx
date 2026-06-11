import type { GroupementStatus } from "@bina/groupement";
import { getTranslations } from "next-intl/server";

const STATUS_COLOR: Record<GroupementStatus, string> = {
  forming: "var(--color-warning)",
  formed: "var(--color-primary)",
  submitting: "var(--color-accent)",
  submitted: "var(--color-accent)",
  won: "var(--color-ok)",
  lost: "var(--color-urgent)",
  withdrawn: "var(--color-muted)",
};

// Groupement lifecycle pill — color-coded per Décret 2-12-349 workflow state.
export async function GroupementStatusChip({ status }: { status: GroupementStatus }) {
  const t = await getTranslations("groupement");
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ color, backgroundColor: "var(--color-surface)", border: `1px solid ${color}` }}
    >
      {t(`status.${status}`)}
    </span>
  );
}
