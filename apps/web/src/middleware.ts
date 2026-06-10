import { authConfig } from "@/auth/config.js";
import { routing } from "@/i18n/routing.js";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

// Edge-safe NextAuth instance: authConfig has no DB or argon2 imports.
// The full instance (with Credentials authorize) lives in @/auth/index.ts
// and must never be imported from middleware.
const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERNS = [/^\/[a-z]{2}\/(dashboard|groupements|dossier|profil|alertes)(\/.*)?$/];

const ADMIN_PATTERNS = [/^\/[a-z]{2}\/admin(\/.*)?$/];

export default auth(async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = (req as { auth?: { user?: { role?: string } } }).auth;

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
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
