import { expect, test } from "@playwright/test";
import { DEMO, expectRtl, login } from "./_helpers.js";

// Project Completion Gate (v0.1) — full contractor journey, recorded to video.
// Covers DoD §12: auth, dashboard, tender radar, saved searches/alerts, tender
// tracking, groupements, compliance vault/dossier — in FR, with an AR/RTL pass.
// Requires the seeded DB (8 contractors, 40 tenders, 3 groupements) on :3010.

test.describe("Contractor journey — radar → alerts → groupement → dossier", () => {
  test("hassan signs in and walks the full contractor workflow (FR)", async ({ page }) => {
    // 1. Auth — credentials login
    await login(page, DEMO.contractor.email, DEMO.contractor.password);
    await expect(page.getByRole("heading", { name: /Bienvenue/i })).toBeVisible();

    // 2. Compliance score is surfaced on the dashboard
    await expect(page.getByText(/dossier réglementaire/i).first()).toBeVisible();

    // 3. Tender radar — the daily-habit acquisition surface
    await page.goto("/fr/tenders");
    await expect(page.getByRole("heading", { name: /Radar des marchés/i })).toBeVisible();
    await expect(page.locator('a[href*="/fr/tenders/"]').first()).toBeVisible();

    // 4. Filter by region/specialty via the GET filter form, then reset
    await page.getByPlaceholder(/Rechercher/i).fill("construction");
    await page.getByRole("button", { name: /Filtrer/i }).click();
    await expect(page).toHaveURL(/search=construction/);
    await page.getByRole("link", { name: /Réinitialiser/i }).click();
    await expect(page).toHaveURL(/\/fr\/tenders$/);

    // 5. Open a tender detail — structured view + deadline countdown
    await page.locator('a[href*="/fr/tenders/"]').first().click();
    await expect(page).toHaveURL(/\/fr\/tenders\/[0-9a-f-]{36}/);
    await expect(page.getByText(/Dépôt avant le/i)).toBeVisible();

    // 6. Saved searches / alerts
    await page.goto("/fr/alertes");
    await expect(page.getByRole("heading", { name: /Mes alertes/i })).toBeVisible();

    // 7. Tracked tenders dashboard
    await page.goto("/fr/suivis");
    await expect(page.getByRole("heading", { name: /Mes marchés suivis/i })).toBeVisible();

    // 8. Groupement browse — find partners / consortiums
    await page.goto("/fr/groupements");
    await expect(page.getByRole("heading", { name: /Groupements/i }).first()).toBeVisible();

    // 9. Compliance vault + dossier builder
    await page.goto("/fr/dossier");
    await expect(page.getByRole("heading", { name: /dossier réglementaire/i })).toBeVisible();
  });

  test("the contractor dashboard renders in Arabic / RTL", async ({ page }) => {
    await login(page, DEMO.contractor.email, DEMO.contractor.password);
    await page.goto("/ar/dashboard");
    await expectRtl(page);
    await page.goto("/ar/tenders");
    await expectRtl(page);
  });
});
