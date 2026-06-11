"use client";
import { cn } from "@/lib/utils.js";
import {
  Bell,
  ClipboardList,
  FolderCheck,
  HardHat,
  LayoutDashboard,
  LogOut,
  Search,
  User,
  Users,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

function buildNavItems(locale: string): NavItem[] {
  return [
    { href: `/${locale}/dashboard`, labelKey: "dashboard", icon: LayoutDashboard },
    { href: `/${locale}/tenders`, labelKey: "radar", icon: Search },
    { href: `/${locale}/groupements`, labelKey: "groupements", icon: Users },
    { href: `/${locale}/dossier`, labelKey: "compliance", icon: FolderCheck },
    { href: `/${locale}/alertes`, labelKey: "savedSearches", icon: Bell },
    { href: `/${locale}/suivis`, labelKey: "tracking", icon: ClipboardList },
    { href: `/${locale}/profil`, labelKey: "profile", icon: User },
  ];
}

type Props = {
  locale: string;
  userName?: string;
  companyName?: string;
};

export function Sidebar({ locale, userName, companyName }: Props) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const navItems = buildNavItems(locale);

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5">
          <HardHat size={22} className="text-[var(--color-accent)]" />
          <div className="leading-none">
            <div className="font-bold text-base tracking-tight">Bina</div>
            <div className="text-xs text-white/50 font-medium">بناء</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {(userName || companyName) && (
          <div className="px-3 py-2 mb-1">
            {companyName && (
              <div className="text-xs font-semibold text-white/90 truncate">{companyName}</div>
            )}
            {userName && <div className="text-xs text-white/50 truncate">{userName}</div>}
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/8 hover:text-white transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
