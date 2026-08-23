import { signInSchema } from "@bina/core";
import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Google is optional (DEPLOY.md) — email/password works standalone. Registering
// it with empty-string credentials still wires it into every auth() call
// (including middleware, on every request), which is needless overhead and risk
// when it's never going to be used. Only include it when real credentials exist.
const googleClientId = process.env["AUTH_GOOGLE_ID"];
const googleClientSecret = process.env["AUTH_GOOGLE_SECRET"];
const providers: Provider[] = [];
if (googleClientId && googleClientSecret) {
  providers.push(Google({ clientId: googleClientId, clientSecret: googleClientSecret }));
}

export const authConfig: NextAuthConfig = {
  providers: [
    ...providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = signInSchema.safeParse(credentials);
        if (!result.success) return null;

        // Resolved in auth/index.ts where DB is available
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/fr/auth/login",
    error: "/fr/auth/error",
    verifyRequest: "/fr/auth/verify",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isContractorRoute =
        nextUrl.pathname.includes("/(contractor)") ||
        nextUrl.pathname.match(/\/[a-z]{2}\/(dashboard|groupements|dossier|profil|alertes)/);
      const isAdminRoute =
        nextUrl.pathname.includes("/(admin)") || nextUrl.pathname.match(/\/[a-z]{2}\/admin/);

      if (isAdminRoute) {
        return isLoggedIn && auth?.user?.role === "admin";
      }
      if (isContractorRoute) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token["userId"] = user.id;
        token["role"] = (user as { role?: string }).role ?? "contractor";
        token["contractorId"] = (user as { contractorId?: string }).contractorId;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token["userId"] as string;
        (session.user as { role?: string }).role = token["role"] as string;
        (session.user as { contractorId?: string }).contractorId = token["contractorId"] as
          | string
          | undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
  // Railway terminates TLS at its edge and proxies to the container over
  // plain HTTP — Auth.js's own protocol auto-detection for the signIn()
  // server-action path doesn't reliably see that as secure, so it can write
  // the session cookie under the unprefixed name while middleware's
  // getToken() (which does see https correctly) looks for the
  // __Secure-prefixed name. Forcing this explicitly makes both sides agree,
  // regardless of what either side's auto-detection concludes. The public
  // URL is always HTTPS (Railway subdomain, no non-TLS entry point).
  useSecureCookies: true,
};
