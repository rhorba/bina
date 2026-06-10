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
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

function buildAdminNavItems(locale: string): AdminNavItem[] {
  return [
    { href: `/${locale}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/${locale}/admin/tenders`, label: "Appels d'offres", icon: FileText },
    { href: `/${locale}/admin/users`, label: "Utilisateurs", icon: Users },
    { href: `/${locale}/admin/groupements`, label: "Groupements", icon: Users2 },
    { href: `/${locale}/admin/scraper`, label: "Scraper", icon: Activity },
  ];
}

type Props = { locale: string };

export function AdminSidebar({ locale }: Props) {
  const t = useTranslations("nav");
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
            <div className="text-xs text-white/40 font-medium">Administration</div>
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
              {item.label}
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
          <ArrowLeft size={18} className="shrink-0" />
          Retour à l'app
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
