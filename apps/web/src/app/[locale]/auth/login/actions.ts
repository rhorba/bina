"use server";
import { signIn } from "@/auth/index.js";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";

export type LoginState = { error: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const locale = formData.get("locale") === "ar" ? "ar" : "fr";
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: `/${locale}/dashboard`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const t = await getTranslations({ locale, namespace: "auth.errors" });
      switch (error.type) {
        case "CredentialsSignin":
          return { error: t("invalidCredentials") };
        default:
          return { error: t("unknown") };
      }
    }
    throw error; // re-throw redirect
  }
  return null;
}
