import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="max-w-4xl mx-auto px-5 py-20 text-center">
      {/* Hero */}
      <div className="inline-flex items-center gap-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
        550 milliards MAD d'investissements BTP 2024–2030
      </div>

      <h1 className="text-4xl font-bold text-[var(--color-foreground)] leading-tight mb-4">
        Trouvez les marchés.
        <br />
        <span className="text-[var(--color-primary)]">Formez votre équipe.</span>
        <br />
        Gagnez ensemble.
      </h1>

      <p className="text-lg text-[var(--color-muted)] max-w-2xl mx-auto mb-10">
        Bina agrège les appels d'offres de marchespublics.gov.ma, vous aide à former des
        groupements, et organise votre dossier réglementaire — spécialement conçu pour les PME BTP
        marocaines.
      </p>

      <div className="flex items-center justify-center gap-4 mb-16">
        <Link
          href={`/${locale}/auth/signup`}
          className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold rounded-lg px-6 py-3 hover:bg-[var(--color-primary-mid)] transition text-sm"
        >
          Commencer gratuitement
        </Link>
        <Link
          href={`/${locale}/auth/login`}
          className="border border-[var(--color-border)] text-[var(--color-foreground)] font-semibold rounded-lg px-6 py-3 hover:bg-[var(--color-bg)] transition text-sm"
        >
          Se connecter
        </Link>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
        {[
          {
            icon: "🔍",
            title: "Radar des marchés",
            desc: "200+ appels d'offres/semaine filtrés par spécialité, région et budget. Alertes email automatiques.",
          },
          {
            icon: "🤝",
            title: "Groupements BTP",
            desc: "Trouvez des partenaires complémentaires pour les marchés qui exigent plusieurs corps de métier.",
          },
          {
            icon: "📋",
            title: "Dossier réglementaire",
            desc: "Attestation fiscale, quitus CNSS, qualification FNBTP — organisés, avec alertes d'expiration.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5"
          >
            <div className="text-2xl mb-3">{f.icon}</div>
            <div className="font-semibold text-[var(--color-foreground)] mb-1.5">{f.title}</div>
            <div className="text-sm text-[var(--color-muted)]">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
