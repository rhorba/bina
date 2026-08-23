"use server";
import { signIn } from "@/auth/index.js";
import { AuthError } from "next-auth";

export type LoginState = { error: string } | { success: true } | null;

// redirect: false + a client-side hard navigation (see _form.tsx) instead of
// signIn's built-in redirectTo — redirectTo embeds the target page's RSC
// payload in this same response, which can render before the session cookie
// just set by signIn() is visible to that embedded render, bouncing the user
// straight back to login. A fresh browser-initiated request always carries
// the already-committed cookie.
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
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
    throw error;
  }
  return { success: true };
}
