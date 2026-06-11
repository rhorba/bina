import { getSession } from "@/auth/index.js";
import { contractorProfiles, db } from "@bina/db";
import { listTenders } from "@bina/tenders";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGroupementForm } from "./_create-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tenderId?: string }>;
};

export default async function NewGroupementPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tenderId } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (!session.contractorId) redirect(`/${locale}/dashboard`);

  const [profile, openTenders, t] = await Promise.all([
    db.query.contractorProfiles.findFirst({
      where: eq(contractorProfiles.id, session.contractorId),
      columns: { specialties: true },
    }),
    listTenders(db, { status: ["open", "closing_soon"], page: 1, perPage: 100 }),
    getTranslations("groupement"),
  ]);

  const mySpecialties = profile?.specialties ?? [];
  const tenderOptions = openTenders.tenders.map((tn) => ({
    id: tn.id,
    title: tn.title,
    region: tn.region,
  }));

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/groupements`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition mb-4"
      >
        <ArrowLeft size={15} />
        {t("backToList")}
      </Link>
      <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-1">{t("createTitle")}</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">{t("createSubtitle")}</p>

      <CreateGroupementForm
        tenders={tenderOptions}
        mySpecialties={mySpecialties}
        preselectTenderId={tenderId}
      />
    </div>
  );
}
