import { expect, test } from "@playwright/test";

// Sprint 2 — full detailed browser scenario for the public Tender Radar.
// Recorded to video (playwright.config: video "on") for the Sprint Exit Gate.
// Requires a seeded DB (40 tenders) reachable by the dev server on :3010.

test.describe("Tender Radar — public browse & detail (FR + AR/RTL)", () => {
  test("contractor explores tenders, filters, opens a detail, switches language", async ({
    page,
  }) => {
    // 1. Landing page → hero + CTA into the radar
    await page.goto("/fr");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page
      .getByRole("link", { name: /Radar des marchés/i })
      .first()
      .click();

    // 2. Tender radar loads with the active-tenders default view
    await expect(page).toHaveURL(/\/fr\/tenders/);
    await expect(page.getByRole("heading", { name: /Radar des marchés/i })).toBeVisible();
    const resultCount = page.getByText(/marché\(s\)/);
    await expect(resultCount).toBeVisible();

    // 3. At least one tender row is shown
    const firstTender = page.locator('a[href*="/fr/tenders/"]').first();
    await expect(firstTender).toBeVisible();

    // 4. Filter by status = "Attribué" (awarded) and submit the GET form
    await page.getByRole("checkbox", { name: /Attribué/i }).check();
    await page.getByRole("button", { name: /Filtrer/i }).click();
    await expect(page).toHaveURL(/status=awarded/);

    // 5. Full-text search
    await page.getByPlaceholder(/Rechercher/i).fill("construction");
    await page.getByRole("button", { name: /Filtrer/i }).click();
    await expect(page).toHaveURL(/search=construction/);

    // 6. Reset filters, then open a tender detail page
    await page.getByRole("link", { name: /Réinitialiser/i }).click();
    await expect(page).toHaveURL(/\/fr\/tenders$/);
    await page.locator('a[href*="/fr/tenders/"]').first().click();
    await expect(page).toHaveURL(/\/fr\/tenders\/[0-9a-f-]{36}/);

    // 7. Detail page shows structured data: deadline meta + required specialties + back link
    await expect(page.getByText(/Dépôt avant le/i)).toBeVisible();
    await expect(page.getByText(/Spécialités requises/i)).toBeVisible();
    await page.getByRole("link", { name: /Retour aux marchés/i }).click();
    await expect(page).toHaveURL(/\/fr\/tenders$/);

    // 8. Arabic + RTL — the same radar renders right-to-left
    await page.goto("/ar/tenders");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "ar");
  });
});
