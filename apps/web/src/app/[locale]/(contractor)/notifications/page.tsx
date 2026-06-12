import { getSession } from "@/auth/index.js";
import { db } from "@bina/db";
import { type NotificationRow, listNotifications } from "@bina/notifications";
import {
  Bell,
  BellOff,
  CalendarClock,
  Check,
  CheckCheck,
  FileWarning,
  Search,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllReadAction, markNotificationReadAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

// Icon per notification channel (mirrors the DB notification_type enum).
const ICONS: Record<string, typeof Bell> = {
  new_tender_match: Search,
  tender_deadline: CalendarClock,
  groupement_invite: Users,
  groupement_update: Users,
  doc_expiry: FileWarning,
  system: Bell,
};

// Locale-aware relative time ("il y a 3 h" / "منذ 3 ساعات"), no extra deps.
function relativeTime(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "fr", { numeric: "auto" });
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diffMs / min), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);

  const rows: NotificationRow[] = await listNotifications(db, session.userId, 40);
  const hasUnread = rows.some((r) => !r.isRead);

  const t = await getTranslations("notifications");

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>
        </div>
        {hasUnread && (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline rounded-md focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
            >
              <CheckCheck size={16} aria-hidden="true" />
              {t("markAllRead")}
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-10 text-center">
          <BellOff
            size={28}
            className="mx-auto text-[var(--color-muted)] mb-3"
            aria-hidden="true"
          />
          <p className="font-semibold text-[var(--color-foreground)]">{t("empty")}</p>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label={t("title")}>
          {rows.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const body = (
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`mt-0.5 shrink-0 rounded-lg p-2 ${
                    n.isRead
                      ? "bg-[var(--color-bg)] text-[var(--color-muted)]"
                      : "bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-[var(--color-foreground)] leading-snug">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-sm text-[var(--color-muted)] mt-0.5 truncate">{n.body}</p>
                  )}
                  <time
                    dateTime={new Date(n.createdAt).toISOString()}
                    className="text-xs text-[var(--color-muted)] mt-1 block"
                  >
                    {relativeTime(new Date(n.createdAt), locale)}
                  </time>
                </div>
                {!n.isRead && (
                  <span
                    className="mt-1.5 shrink-0 size-2 rounded-full bg-[var(--color-accent)]"
                    aria-label={t("unread")}
                  />
                )}
              </div>
            );

            return (
              <li
                key={n.id}
                className={`rounded-[var(--radius-card)] border p-4 transition ${
                  n.isRead
                    ? "bg-[var(--color-surface)] border-[var(--color-border)]"
                    : "bg-[var(--color-surface)] border-[var(--color-accent)]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  {n.linkUrl ? (
                    <Link
                      href={`/${locale}${n.linkUrl}`}
                      className="flex-1 min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex-1 min-w-0">{body}</div>
                  )}
                  {!n.isRead && (
                    <form action={markNotificationReadAction} className="shrink-0">
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        title={t("markRead")}
                        aria-label={t("markRead")}
                        className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-valid)] hover:bg-[var(--color-valid)]/8 transition focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                      >
                        <Check size={15} aria-hidden="true" />
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
