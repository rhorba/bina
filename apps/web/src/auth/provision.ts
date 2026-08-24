import { contractorProfiles, db, users, withUserContext } from "@bina/db";
import { eq } from "drizzle-orm";

export type ProvisionedIdentity = {
  id: string;
  role: string;
  contractorId?: string;
};

// Credentials users are provisioned at signup (users + contractor_profiles
// inserted together — see auth/signup/actions.ts). OAuth users never go
// through that flow, so without this they'd get a session whose id isn't
// backed by any DB row: contractorId stays undefined forever and every
// contractorId-gated page (profil, dossier, groupements...) silently bounces
// back to /dashboard with no explanation. Find-or-create by email so a
// credentials account and an OAuth account for the same address resolve to
// one user, never a duplicate.
export async function provisionOAuthUser(
  email: string,
  name: string | null | undefined
): Promise<ProvisionedIdentity | null> {
  const normalizedEmail = email.toLowerCase();
  let dbUser = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });

  if (!dbUser) {
    const [created] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        name: name ?? normalizedEmail,
        role: "contractor",
        isActive: true,
        emailVerified: true,
      })
      .returning();
    dbUser = created;

    if (dbUser) {
      const newUser = dbUser;
      await withUserContext(newUser.id, "contractor", async (tx) => {
        await tx.insert(contractorProfiles).values({
          userId: newUser.id,
          companyName: name ?? normalizedEmail,
          specialties: [],
          regions: [],
          companySize: "tpe",
          complianceScore: 0,
        });
      });
    }
  }

  if (!dbUser || !dbUser.isActive) return null;

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, dbUser.id));

  const profile = await db.query.contractorProfiles.findFirst({
    where: eq(contractorProfiles.userId, dbUser.id),
  });

  return { id: dbUser.id, role: dbUser.role, contractorId: profile?.id };
}
