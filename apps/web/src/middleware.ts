import { routing } from "@/i18n/routing.js";
import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERNS = [/^\/[a-z]{2}\/(dashboard|groupements|dossier|profil|alertes)(\/.*)?$/];

const ADMIN_PATTERNS = [/^\/[a-z]{2}\/admin(\/.*)?$/];

// Sprint 8 web-hang investigation: the full NextAuth `auth()` middleware wrapper
// hangs indefinitely on Railway's self-hosted edge runtime (`next start`), even
// with zero OAuth providers registered — confirmed by bisection: stripping the
// wrapper entirely dropped /fr from a 30s timeout/500 to a 361ms 200. `getToken`
// only decrypts the session cookie with AUTH_SECRET (no provider/adapter setup,
// no NextAuth instance construction), which is edge-safe and sidesteps whatever
// in the full wrapper's construction hangs here. Route protection only needs the
// decoded role, so this is a strict subset of what `auth()` provided.
async function middlewareImpl(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsSession =
    ADMIN_PATTERNS.some((p) => p.test(pathname)) ||
    PROTECTED_PATTERNS.some((p) => p.test(pathname));
  // secureCookie forced true to match authConfig's useSecureCookies (see
  // auth/config.ts) — both sides must agree on the cookie name regardless of
  // either's own https auto-detection.
  const token = needsSession
    ? await getToken({ req, secret: process.env["AUTH_SECRET"], secureCookie: true })
    : null;
  const session = token ? { user: { role: token["role"] as string | undefined } } : undefined;

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
