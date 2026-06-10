import Link from "next/link";
import { SignUpForm } from "./_form";

type Props = { params: Promise<{ locale: string }> };

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-2xl font-semibold text-[var(--color-primary)]">بناء</span>
            <span className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
              Bina
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)]">La plateforme des PME BTP au Maroc</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">
            Créer un compte
          </h1>
          <SignUpForm />
        </div>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Déjà un compte ?{" "}
          <Link
            href={`/${locale}/auth/login`}
            className="text-[var(--color-accent)] font-medium hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
