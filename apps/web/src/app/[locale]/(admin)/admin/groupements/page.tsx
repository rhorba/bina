import { db, getGroupementsOverview } from "@bina/db";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

const STATUS_COLOR: Record<string, string> = {
  forming: "var(--color-warning)",
  formed: "var(--color-primary)",
  submitting: "var(--color-primary)",
  submitted: "var(--color-primary)",
  won: "var(--color-ok)",
  lost: "var(--color-muted)",
  withdrawn: "var(--color-urgent)",
};

export default async function AdminGroupementsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tg = await getTranslations("groupement");
  const dateLocale = locale === "ar" ? "ar-MA" : "fr-MA";

  const rows = await getGroupementsOverview(db);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {t("groupementsModeration.title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {t("groupementsModeration.subtitle")}
        </p>
      </div>

      <div className="overflow-x-auto bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] text-xs">
              <th className="text-start font-medium px-4 py-2.5">
                {t("groupementsModeration.name")}
              </th>
              <th className="text-start font-medium px-4 py-2.5">
                {t("groupementsModeration.tender")}
              </th>
              <th className="text-start font-medium px-4 py-2.5">
                {t("groupementsModeration.status")}
              </th>
              <th className="text-end font-medium px-4 py-2.5">
                {t("groupementsModeration.members")}
              </th>
              <th className="text-end font-medium px-4 py-2.5">
                {t("groupementsModeration.createdAt")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--color-muted)]" colSpan={5}>
                  {t("groupementsModeration.empty")}
                </td>
              </tr>
            ) : (
              rows.map((g) => (
                <tr key={g.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/${locale}/groupements/${g.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {g.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)] max-w-[18rem] truncate">
                    {g.tenderTitle}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: STATUS_COLOR[g.status] ?? "var(--color-muted)" }}
                    >
                      {tg(`status.${g.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-end tabular-nums">{g.memberCount}</td>
                  <td className="px-4 py-2.5 text-end whitespace-nowrap text-[var(--color-muted)]">
                    {new Date(g.createdAt).toLocaleDateString(dateLocale, { dateStyle: "short" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
