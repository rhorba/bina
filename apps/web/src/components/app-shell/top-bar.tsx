"use client";
import { Bell, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMobileNav } from "./mobile-nav-context.js";

type Props = {
  locale: string;
  title?: string;
  unreadCount?: number;
};

const LOCALE_LABELS: Record<string, string> = {
  fr: "FR",
  ar: "ع",
};

const ALTERNATE_LOCALE: Record<string, string> = {
  fr: "ar",
  ar: "fr",
};

export function TopBar({ locale, title, unreadCount = 0 }: Props) {
  const router = useRouter();
  const t = useTranslations("nav");
  const { toggle } = useMobileNav();
  const altLocale = ALTERNATE_LOCALE[locale] ?? "fr";
  const hasUnread = unreadCount > 0;
  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  function switchLocale() {
    // Replace the locale prefix in the current URL
    if (typeof window !== "undefined") {
      const current = window.location.pathname;
      const newPath = current.replace(/^\/(fr|ar)/, `/${altLocale}`);
      router.push(newPath);
    }
  }

  return (
    <header className="h-14 shrink-0 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-5">
      {/* Left: mobile menu toggle + page title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={toggle}
          aria-label={t("openMenu")}
          className="lg:hidden -ms-2 p-2.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg)] transition"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="text-sm font-semibold text-[var(--color-foreground)] truncate">
          {title ?? "Bina"}
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Locale switcher */}
        <button
          type="button"
          onClick={switchLocale}
          className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2 py-1 transition"
          title={`Passer en ${altLocale === "ar" ? "عربي" : "Français"}`}
        >
          {LOCALE_LABELS[altLocale]}
        </button>

        {/* Notifications */}
        <Link
          href={`/${locale}/notifications`}
          className="relative p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg)] transition focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
          aria-label={hasUnread ? `Notifications (${unreadCount})` : "Notifications"}
        >
          <Bell size={18} aria-hidden="true" />
          {hasUnread && (
            <span
              className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary-fg)] text-[10px] font-bold leading-none"
              aria-hidden="true"
            >
              {badge}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
