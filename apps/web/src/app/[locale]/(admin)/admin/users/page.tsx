import { db, getVerificationQueue } from "@bina/db";
import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { verifyFnbtpAction } from "./actions.js";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tFnbtp = await getTranslations("groupement");
  const dateLocale = locale === "ar" ? "ar-MA" : "fr-MA";

  const queue = await getVerificationQueue(db);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("verify.title")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t("verify.subtitle")}</p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-10 text-center">
          <ShieldCheck
            size={28}
            className="mx-auto text-[var(--color-ok)] mb-3"
            aria-hidden="true"
          />
          <p className="font-semibold text-[var(--color-foreground)]">{t("verify.empty")}</p>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("verify.emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {queue.map((c) => (
            <li
              key={c.contractorId}
              className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                  {c.companyName}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {c.fnbtpCategory ? tFnbtp(`fnbtp.${c.fnbtpCategory}`) : t("verify.noCategory")}
                  {c.fnbtpNumber ? ` · ${c.fnbtpNumber}` : ""}
                  {" · "}
                  {new Date(c.createdAt).toLocaleDateString(dateLocale, { dateStyle: "medium" })}
                </p>
              </div>
              <form action={verifyFnbtpAction} className="shrink-0">
                <input type="hidden" name="contractorId" value={c.contractorId} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                >
                  <ShieldCheck size={15} aria-hidden="true" />
                  {t("verify.confirm")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
