import Link from "next/link";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PublicLayout({ children, params }: Props) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-5">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 font-bold text-[var(--color-primary)]"
          >
            <span className="text-lg">بناء</span>
            <span>Bina</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/auth/login`}
              className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            >
              Se connecter
            </Link>
            <Link
              href={`/${locale}/auth/signup`}
              className="text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-lg px-4 py-2 hover:bg-[var(--color-primary-mid)] transition"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="py-6 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-5 text-center text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} Bina — بناء · Plateforme BTP Maroc
        </div>
      </footer>
    </div>
  );
}
