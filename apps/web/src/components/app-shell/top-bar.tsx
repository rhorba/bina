"use client";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  locale: string;
  title?: string;
};

const LOCALE_LABELS: Record<string, string> = {
  fr: "FR",
  ar: "ع",
};

const ALTERNATE_LOCALE: Record<string, string> = {
  fr: "ar",
  ar: "fr",
};

export function TopBar({ locale, title }: Props) {
  const router = useRouter();
  const altLocale = ALTERNATE_LOCALE[locale] ?? "fr";

  function switchLocale() {
    // Replace the locale prefix in the current URL
    if (typeof window !== "undefined") {
      const current = window.location.pathname;
      const newPath = current.replace(/^\/(fr|ar)/, `/${altLocale}`);
      router.push(newPath);
    }
  }

  return (
    <header className="h-14 shrink-0 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5">
      {/* Left: page title */}
      <div className="text-sm font-semibold text-[var(--color-foreground)] truncate">
        {title ?? "Bina"}
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
          href={`/${locale}/alertes`}
          className="relative p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg)] transition"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </Link>
      </div>
    </header>
  );
}
