import { getSession } from "@/auth/index.js";
import { contractorProfiles, db } from "@bina/db";
import { eq } from "drizzle-orm";
import { ExternalLink, FolderOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "./_form";

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  const profile = await db.query.contractorProfiles.findFirst({
    where: eq(contractorProfiles.id, session.contractorId),
  });
  if (!profile) redirect(`/${locale}/dashboard`);

  const t = await getTranslations("profile");

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{profile.companyName}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/${locale}/profil/references`}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 hover:bg-[var(--color-surface)] transition"
          >
            <FolderOpen size={15} />
            {t("references")}
          </Link>
          <Link
            href={`/${locale}/entreprises/${profile.id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 hover:bg-[var(--color-surface)] transition"
          >
            <ExternalLink size={15} />
            Profil public
          </Link>
        </div>
      </div>

      <ProfileForm
        profile={{
          companyName: profile.companyName,
          ice: profile.ice,
          rc: profile.rc,
          specialties: profile.specialties,
          regions: profile.regions,
          companySize: profile.companySize,
          employeeCount: profile.employeeCount,
          maxContractValueCentimes: profile.maxContractValueCentimes,
          fnbtpCategory: profile.fnbtpCategory,
          fnbtpNumber: profile.fnbtpNumber,
        }}
      />
    </div>
  );
}
