"use server";
import { signIn } from "@/auth/index.js";
import { hashPassword } from "@/lib/password.js";
import { signUpSchema } from "@bina/core";
import { contractorProfiles, db, users, withUserContext } from "@bina/db";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

export type SignUpState = { error: string } | null;

export async function signUpAction(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const locale = formData.get("locale") === "ar" ? "ar" : "fr";
  const t = await getTranslations({ locale, namespace: "auth.errors" });

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    phone: (formData.get("phone") as string) || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? t("unknown") };
  }

  const { email, password, name, companyName, phone } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (existing) {
    return { error: t("emailTaken") };
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      phone: phone ?? null,
      role: "contractor",
      isActive: true,
      emailVerified: false,
    })
    .returning();

  if (!user) {
    return { error: t("unknown") };
  }

  // RLS: contractor_profiles INSERT requires app.current_user_id = user_id
  await withUserContext(user.id, "contractor", async (tx) => {
    await tx.insert(contractorProfiles).values({
      userId: user.id,
      companyName,
      specialties: [],
      regions: [],
      companySize: "tpe",
      complianceScore: 0,
    });
  });

  // throws NEXT_REDIRECT — must not be caught
  await signIn("credentials", {
    email,
    password,
    redirectTo: `/${locale}/dashboard`,
  });

  return null;
}
