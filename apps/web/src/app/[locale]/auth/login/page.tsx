import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LoginForm } from "./_form";

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-2xl font-semibold text-[var(--color-primary)]">بناء</span>
            <span className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
              Bina
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)]">{t("loginTagline")}</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">
            {t("login")}
          </h1>
          <LoginForm
            locale={locale}
            googleEnabled={Boolean(
              process.env["AUTH_GOOGLE_ID"] && process.env["AUTH_GOOGLE_SECRET"]
            )}
          />
        </div>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/auth/signup`}
            className="text-[var(--color-accent)] font-medium hover:underline"
          >
            {t("signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}
