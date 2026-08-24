import { expect, test } from "@playwright/test";
import { DEMO, login } from "./_helpers.js";

// Sidebar/TopBar (app-shell) mobile off-canvas drawer — sidebar.tsx,
// top-bar.tsx, mobile-nav-context.tsx. Runs at a phone viewport since the
// shared "chromium" project defaults to desktop.
test.describe("Mobile nav drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger opens the drawer, nav link navigates and auto-closes it", async ({ page }) => {
    await login(page, DEMO.contractor.email, DEMO.contractor.password);

    const drawer = page.getByRole("link", { name: /Radar des marchés/i });
    const menuButton = page.getByRole("button", { name: /Ouvrir le menu/i });

    // Closed by default on a phone viewport.
    await expect(drawer).not.toBeInViewport();

    await menuButton.click();
    await expect(drawer).toBeInViewport();

    // Navigating via a drawer link both routes and closes the drawer.
    await drawer.click();
    await expect(page).toHaveURL(/\/fr\/tenders$/);
    await expect(page.getByRole("heading", { name: /Radar des marchés/i })).toBeVisible();
    await expect(drawer).not.toBeInViewport();
  });

  test("tapping the backdrop closes the drawer", async ({ page }) => {
    await login(page, DEMO.contractor.email, DEMO.contractor.password);

    await page.getByRole("button", { name: /Ouvrir le menu/i }).click();
    const drawer = page.getByRole("link", { name: /Mon profil/i });
    await expect(drawer).toBeInViewport();

    // Backdrop is the fixed full-screen overlay behind the drawer — click far
    // enough from the (280px-wide) drawer that it's the backdrop, not nav.
    await page.mouse.click(370, 400);
    await expect(drawer).not.toBeInViewport();
  });
});
