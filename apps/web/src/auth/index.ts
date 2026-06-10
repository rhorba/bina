import { verifyPassword } from "@/lib/password.js";
import { signInSchema } from "@bina/core";
import { contractorProfiles, db, users } from "@bina/db";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "./config.js";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        const { email, password } = result.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

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
