import { getSession } from "@/auth/index.js";
import { AdminSidebar } from "@/components/app-shell/admin-sidebar.js";
import { TopBar } from "@/components/app-shell/top-bar.js";
import { redirect } from "next/navigation";

// Auth-gated: must never be prerendered (build-time render has no session
// and would bake a redirect-to-login into the static HTML).
export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar locale={locale} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar locale={locale} title="Administration" />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] p-6">{children}</main>
      </div>
    </div>
  );
}
