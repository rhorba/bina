import { routing } from "@/i18n/routing.js";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERNS = [/^\/[a-z]{2}\/(dashboard|groupements|dossier|profil|alertes)(\/.*)?$/];

const ADMIN_PATTERNS = [/^\/[a-z]{2}\/admin(\/.*)?$/];

// TEMP DIAGNOSTIC (Sprint 8 web-hang investigation): auth() wrapper bypassed to
// isolate whether the hang is inside NextAuth's edge middleware or next-intl.
// Revert to `export default auth(async function middleware(...` once resolved.
async function middlewareImpl(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = undefined as { user?: { role?: string } } | undefined;

  if (ADMIN_PATTERNS.some((p) => p.test(pathname))) {
    if (!session?.user || session.user.role !== "admin") {
      const loginUrl = new URL(`/${pathname.split("/")[1]}/auth/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (PROTECTED_PATTERNS.some((p) => p.test(pathname))) {
    if (!session?.user) {
      const locale = pathname.split("/")[1] ?? "fr";
      const loginUrl = new URL(`/${locale}/auth/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export default middlewareImpl;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
