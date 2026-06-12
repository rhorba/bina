import type { ScraperHealthStatus } from "@bina/tenders";
import { getTranslations } from "next-intl/server";

// Traffic-light colour per derived scraper-health status.
const COLOR: Record<ScraperHealthStatus, string> = {
  healthy: "var(--color-ok)",
  running: "var(--color-primary)",
  degraded: "var(--color-warning)",
  stale: "var(--color-warning)",
  failed: "var(--color-urgent)",
  never: "var(--color-muted)",
};

export async function ScraperHealthBadge({ status }: { status: ScraperHealthStatus }) {
  const t = await getTranslations("admin");
  const color = COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
      style={{ color, backgroundColor: "var(--color-bg)", border: `1px solid ${color}` }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {t(`scraperHealthLabel.${status}`)}
    </span>
  );
}
