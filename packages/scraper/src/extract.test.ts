import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTenderFields } from "@bina/tenders";
import { describe, expect, test } from "vitest";
import { extractTenderDetail, extractTenderList, hasNextPage, nextPageUrl } from "./extract.js";

// Fixtures captured from the portal structure — CI never hits the live site.
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");
const fixture = (name: string) => readFileSync(join(fixturesDir, name), "utf8");

describe("extractTenderList", () => {
  test("extracts references and absolute detail URLs", () => {
    const entries = extractTenderList(fixture("search-results.html"));
    expect(entries).toHaveLength(2); // corrupt row without ref is skipped
    expect(entries[0]?.externalId).toBe("MP-2026-000901");
    expect(entries[0]?.detailUrl).toMatch(/^https:\/\/www\.marchespublics\.gov\.ma\//);
  });

  test("skips rows missing a reference", () => {
    const entries = extractTenderList(fixture("search-results.html"));
    expect(entries.map((e) => e.externalId)).not.toContain("");
  });
});

describe("pagination", () => {
  test("detects a next page", () => {
    const html = fixture("search-results.html");
    expect(hasNextPage(html)).toBe(true);
    expect(nextPageUrl(html)).toContain("page=2");
  });

  test("stops on the last page", () => {
    const html = fixture("search-results-last-page.html");
    expect(hasNextPage(html)).toBe(false);
    expect(nextPageUrl(html)).toBeNull();
  });
});

describe("extractTenderDetail", () => {
  test("extracts all fields from a detail page", () => {
    const fields = extractTenderDetail(fixture("tender-detail.html"), "MP-2026-000901");

    expect(fields.title).toContain("plomberie");
    expect(fields.maitreDOuvrage).toBe("Commune de Salé");
    expect(fields.procedureType).toContain("Travaux");
    expect(fields.region).toBe("Rabat-Salé-Kénitra");
    expect(fields.estimatedBudget).toBe("1 200 000,00 MAD");
    expect(fields.publishedAt).toBe("01/06/2026");
    expect(fields.submissionDeadline).toBe("15/07/2026 10:00");
    expect(fields.dossierUrl).toMatch(/^https:\/\/www\.marchespublics\.gov\.ma\//);
    expect(fields.lots).toHaveLength(2);
    expect(fields.lots?.[1]).toMatchObject({
      lotNumber: 2,
      lotTitle: "Étanchéité des terrasses",
    });
  });

  test("extracted fields parse into a valid RawTender end-to-end", () => {
    const fields = extractTenderDetail(fixture("tender-detail.html"), "MP-2026-000901");
    const tender = parseTenderFields(fields);

    expect(tender.externalId).toBe("MP-2026-000901");
    expect(tender.type).toBe("travaux");
    expect(tender.maitreDOuvrageType).toBe("commune");
    expect(tender.region).toBe("Rabat-Salé-Kénitra");
    expect(tender.estimatedBudgetMinCentimes).toBe(120_000_000);
    expect(tender.requiredSpecialties).toContain("plomberie");
    expect(tender.lots).toHaveLength(2);
    expect(tender.lots[0]?.estimatedBudgetCentimes).toBe(90_000_000);
    expect(tender.lots[1]?.requiredSpecialties).toContain("peinture"); // étanchéité
    expect(tender.submissionDeadline.toISOString()).toBe("2026-07-15T10:00:00.000Z");
  });
});
