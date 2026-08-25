"use client";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { loginAction } from "./actions";

type Props = { locale: string; googleEnabled: boolean };

export function LoginForm({ locale, googleEnabled }: Props) {
  const t = useTranslations("auth");
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5"
          >
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
            placeholder={t("emailPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5"
          >
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-[var(--color-urgent)] bg-[var(--color-urgent)]/8 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-mid)] text-[var(--color-primary-fg)] font-medium text-sm rounded-lg px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? t("loginPending") : t("login")}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-xs text-[var(--color-muted)] bg-[var(--color-surface)] px-2">
              {t("orContinueWith")}
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: `/${locale}/dashboard` })}
            className="w-full flex items-center justify-center gap-2.5 border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-bg)] transition"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
              />
            </svg>
            {t("google")}
          </button>
        </>
      )}
    </div>
  );
}
