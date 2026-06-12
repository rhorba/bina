import { StatusChip } from "@/components/tender/chips.js";
import { formatMAD } from "@bina/core";
import { db } from "@bina/db";
import { listTenders } from "@bina/tenders";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminTendersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const t = await getTranslations("admin");
  const moneyLocale = locale === "ar" ? "ar" : "fr";
  const dateLocale = locale === "ar" ? "ar-MA" : "fr-MA";

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const { tenders, total, totalPages } = await listTenders(db, { page, perPage: 25 });

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {t("tendersAdmin.title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {t("tendersAdmin.count", { n: total })}
        </p>
      </div>

      <div className="overflow-x-auto bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] text-xs">
              <th className="text-start font-medium px-4 py-2.5">{t("tendersAdmin.title2")}</th>
              <th className="text-start font-medium px-4 py-2.5">{t("tendersAdmin.region")}</th>
              <th className="text-start font-medium px-4 py-2.5">{t("tendersAdmin.budget")}</th>
              <th className="text-start font-medium px-4 py-2.5">{t("tendersAdmin.deadline")}</th>
              <th className="text-start font-medium px-4 py-2.5">{t("tendersAdmin.status")}</th>
            </tr>
          </thead>
          <tbody>
            {tenders.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--color-muted)]" colSpan={5}>
                  {t("tendersAdmin.empty")}
                </td>
              </tr>
            ) : (
              tenders.map((tender) => (
                <tr key={tender.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-2.5 max-w-[22rem]">
                    <Link
                      href={`/${locale}/tenders/${tender.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline line-clamp-1"
                    >
                      {tender.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)] whitespace-nowrap">
                    {tender.region}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)] whitespace-nowrap">
                    {tender.estimatedBudgetMaxCentimes
                      ? formatMAD(tender.estimatedBudgetMaxCentimes, moneyLocale)
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)] whitespace-nowrap">
                    {new Date(tender.submissionDeadline).toLocaleDateString(dateLocale, {
                      dateStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusChip status={tender.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href={`/${locale}/admin/tenders?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-md px-3 py-1.5 border border-[var(--color-border)] ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "hover:border-[var(--color-primary-mid)]"
            }`}
          >
            {t("tendersAdmin.prev")}
          </Link>
          <span className="text-[var(--color-muted)]">
            {t("tendersAdmin.pageOf", { page, totalPages })}
          </span>
          <Link
            href={`/${locale}/admin/tenders?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`rounded-md px-3 py-1.5 border border-[var(--color-border)] ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:border-[var(--color-primary-mid)]"
            }`}
          >
            {t("tendersAdmin.next")}
          </Link>
        </div>
      )}
    </div>
  );
}
