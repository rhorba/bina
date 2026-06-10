import { signInSchema } from "@bina/core";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env["AUTH_GOOGLE_ID"] ?? "",
      clientSecret: process.env["AUTH_GOOGLE_SECRET"] ?? "",
    }),
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
};
