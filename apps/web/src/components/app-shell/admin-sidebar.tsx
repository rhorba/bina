"use client";
import { cn } from "@/lib/utils.js";
import {
  Activity,
  ArrowLeft,
  FileText,
  HardHat,
  LayoutDashboard,
  LogOut,
  Users,
  Users2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

function buildAdminNavItems(locale: string): AdminNavItem[] {
  return [
    { href: `/${locale}/admin`, labelKey: "nav.dashboard", icon: LayoutDashboard },
    { href: `/${locale}/admin/tenders`, labelKey: "nav.tenders", icon: FileText },
    { href: `/${locale}/admin/users`, labelKey: "nav.users", icon: Users },
    { href: `/${locale}/admin/groupements`, labelKey: "nav.groupements", icon: Users2 },
    { href: `/${locale}/admin/scraper`, labelKey: "nav.scraper", icon: Activity },
  ];
}

type Props = { locale: string };

export function AdminSidebar({ locale }: Props) {
  const t = useTranslations("admin");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const navItems = buildAdminNavItems(locale);

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[var(--color-foreground)] text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <HardHat size={22} className="text-[var(--color-accent)]" />
          <div className="leading-none">
            <div className="font-bold text-base tracking-tight">Bina</div>
            <div className="text-xs text-white/40 font-medium">{tNav("admin")}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === `/${locale}/admin`
              ? pathname === `/${locale}/admin`
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} className="shrink-0 rtl:rotate-180" />
          {t("nav.backToApp")}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {tNav("logout")}
        </button>
      </div>
    </aside>
  );
}
