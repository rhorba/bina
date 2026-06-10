import { getSession } from "@/auth/index.js";
import { Sidebar } from "@/components/app-shell/sidebar.js";
import { TopBar } from "@/components/app-shell/top-bar.js";
import { contractorProfiles, db } from "@bina/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// Auth-gated: must never be prerendered (build-time render has no session
// and would bake a redirect-to-login into the static HTML).
export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ContractorLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/auth/login`);
  }

  let companyName: string | undefined;
  if (session.contractorId) {
    const profile = await db.query.contractorProfiles.findFirst({
      where: eq(contractorProfiles.id, session.contractorId),
      columns: { companyName: true },
    });
    companyName = profile?.companyName;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar locale={locale} userName={session.email} companyName={companyName} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar locale={locale} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] p-6">{children}</main>
      </div>
    </div>
  );
}
