import { getTranslations } from "next-intl/server";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

const KNOWN_ERRORS = ["Configuration", "AccessDenied", "Verification"] as const;

export default async function AuthErrorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });
  const key = KNOWN_ERRORS.find((e) => e === error) ?? "Default";
  const message = t(`errors.${key}`);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--color-urgent)]/10 flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--color-urgent)]"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">
            {t("authErrorTitle")}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mb-6">{message}</p>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-block bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-5 py-2.5 hover:bg-[var(--color-primary-mid)] transition"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
