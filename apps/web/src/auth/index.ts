import { verifyPassword } from "@/lib/password.js";
import { signInSchema } from "@bina/core";
import { contractorProfiles, db, users } from "@bina/db";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "./config.js";
import { provisionOAuthUser } from "./provision.js";

// Same conditional-registration rule as auth/config.ts: only wire up Google when
// real credentials exist. An unconditionally-registered Google() with empty-string
// credentials previously caused every auth()-wrapped middleware request to hang
// (see commit 36dfe7c / 6541c30) — this full DB-backed instance had the identical
// pattern, unfixed, and every signIn()/getSession() call here went through it.
const googleClientId = process.env["AUTH_GOOGLE_ID"];
const googleClientSecret = process.env["AUTH_GOOGLE_SECRET"];
const oauthProviders: Provider[] = [];
if (googleClientId && googleClientSecret) {
  oauthProviders.push(Google({ clientId: googleClientId, clientSecret: googleClientSecret }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      const identity = await provisionOAuthUser(user.email, user.name);
      if (!identity) return false;

      // Mutating `user` here is what the jwt callback (auth/config.ts) reads
      // from its `user` argument on this same initial sign-in — there's no
      // adapter, so this is the only hand-off point from Google's transient
      // profile id to our own DB identity.
      user.id = identity.id;
      (user as { role?: string }).role = identity.role;
      (user as { contractorId?: string }).contractorId = identity.contractorId;

      return true;
    },
  },
  providers: [
    ...oauthProviders,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = signInSchema.safeParse(credentials);
        if (!result.success) return null;

        const { email, password } = result.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // Track last login for the admin "active users (30d)" KPI.
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

        const profile = await db.query.contractorProfiles.findFirst({
          where: eq(contractorProfiles.userId, user.id),
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          contractorId: profile?.id,
        };
      },
    }),
  ],
});

export type AuthSession = {
  userId: string;
  email: string;
  role: "contractor" | "admin";
  contractorId?: string;
};

export async function getSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    role: ((session.user as { role?: string }).role ?? "contractor") as "contractor" | "admin",
    contractorId: (session.user as { contractorId?: string }).contractorId,
  };
}
