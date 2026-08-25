import Link from "next/link";
import "@/app/globals.css";

// Root-level fallback for any route that doesn't match a page under [locale]/...
// (e.g. a mistyped URL). The root layout deliberately renders no <html>/<body>
// (that's [locale]/layout.tsx's job), so when Next.js's App Router bubbles a
// notFound() up past a locale segment that never rendered, this is the nearest
// layout left standing — it must provide the full document shell itself or the
// page ships without <html>/<body>, which crashes hydration client-side.
export default function RootNotFound() {
  return (
    <html lang="fr">
      <head />
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-semibold text-[var(--color-muted)]">404</p>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Page introuvable · الصفحة غير موجودة
          </h1>
          <div className="flex gap-4 mt-2">
            <Link href="/fr" className="text-sm font-medium text-[var(--color-primary)]">
              Retour à l&apos;accueil
            </Link>
            <Link href="/ar" className="text-sm font-medium text-[var(--color-primary)]">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
