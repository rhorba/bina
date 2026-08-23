"use server";
import { signIn } from "@/auth/index.js";
import { AuthError } from "next-auth";

export type LoginState = { error: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/fr/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "E-mail ou mot de passe incorrect." };
        default:
          return { error: "Une erreur est survenue. Réessayez." };
      }
    }
    throw error; // re-throw redirect
  }
  return null;
}
