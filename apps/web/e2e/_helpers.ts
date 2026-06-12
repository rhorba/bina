import { type Page, expect } from "@playwright/test";

// Sign in through the real credentials form and wait for the post-login redirect.
// Demo accounts come from the seed (packages/db/src/seed.ts).
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/fr/auth/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /Se connecter/i }).click();
  // loginAction redirects to /fr/dashboard on success.
  await page.waitForURL(/\/(fr|ar)\/dashboard/, { timeout: 30_000 });
}

export const DEMO = {
  contractor: { email: "hassan.plomberie@demo.bina.ma", password: "demo1234" },
  admin: { email: "admin@bina.ma", password: "admin1234" },
};

// Assert the document is right-to-left (Arabic locale).
export async function expectRtl(page: Page): Promise<void> {
  const html = page.locator("html");
  await expect(html).toHaveAttribute("dir", "rtl");
  await expect(html).toHaveAttribute("lang", "ar");
}
