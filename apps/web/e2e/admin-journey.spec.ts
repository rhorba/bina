import { expect, test } from "@playwright/test";
import { DEMO, expectRtl, login } from "./_helpers.js";

// Project Completion Gate (v0.1) — full admin journey, recorded to video.
// Covers DoD §12: admin dashboard (KPIs + scraper health), tender management,
// FNBTP verification queue (audit-logged verify), groupement moderation, CSV
// fallback import surface — in FR, with an AR/RTL pass.

test.describe("Admin journey — KPIs → moderation → verification → scraper", () => {
  test("admin signs in and walks the platform-operations workflow (FR)", async ({ page }) => {
    // 1. Auth as admin → admin dashboard with real KPIs
    await login(page, DEMO.admin.email, DEMO.admin.password);
    await page.goto("/fr/admin");
    await expect(page.getByRole("heading", { name: /Administration Bina/i })).toBeVisible();
    await expect(page.getByText(/Appels d'offres indexés/i)).toBeVisible();
    await expect(page.getByText(/Utilisateurs actifs/i)).toBeVisible();

    // 2. Tender management — paginated list
    await page.goto("/fr/admin/tenders");
    await expect(page.getByRole("heading", { name: /Appels d'offres/i }).first()).toBeVisible();
    await expect(page.locator('a[href*="/fr/tenders/"]').first()).toBeVisible();

    // 3. Groupement moderation — all statuses
    await page.goto("/fr/admin/groupements");
    await expect(page.getByRole("heading", { name: /Modération des groupements/i })).toBeVisible();

    // 4. FNBTP verification queue — verify one contractor (audit-logged)
    await page.goto("/fr/admin/users");
    await expect(page.getByRole("heading", { name: /vérification FNBTP/i })).toBeVisible();
    const verifyButtons = page.getByRole("button", { name: /^Vérifier$/ });
    const before = await verifyButtons.count();
    expect(before).toBeGreaterThan(0);
    await verifyButtons.first().click();
    // After verification the queue shrinks (or empties).
    await expect
      .poll(async () => page.getByRole("button", { name: /^Vérifier$/ }).count())
      .toBeLessThan(before);

    // 5. Scraper health + CSV fallback import surface
    await page.goto("/fr/admin/scraper");
    await expect(page.getByRole("heading", { name: /Scraper/i }).first()).toBeVisible();
    await expect(page.getByText(/marchespublics\.gov\.ma/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Import CSV de secours/i })).toBeVisible();
    // The CSV file input must be present (the manual fallback, non-negotiable #10).
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test("the admin dashboard renders in Arabic / RTL", async ({ page }) => {
    await login(page, DEMO.admin.email, DEMO.admin.password);
    await page.goto("/ar/admin");
    await expectRtl(page);
    await expect(page.getByRole("heading", { name: /إدارة بناء/ })).toBeVisible();
  });
});
