import { describe, expect, test } from "vitest";
import {
  TenderParseError,
  detectLots,
  parseBudgetMAD,
  parseFrenchDate,
  parseMaitreDOuvrageType,
  parseTenderFields,
  parseTenderType,
} from "./parser.js";

describe("parseFrenchDate", () => {
  test("parses dd/mm/yyyy", () => {
    const date = parseFrenchDate("15/07/2026");
    expect(date?.getUTCFullYear()).toBe(2026);
    expect(date?.getUTCMonth()).toBe(6);
    expect(date?.getUTCDate()).toBe(15);
  });

  test("parses dd/mm/yyyy hh:mm", () => {
    const date = parseFrenchDate("03/09/2026 10:30");
    expect(date?.getUTCHours()).toBe(10);
    expect(date?.getUTCMinutes()).toBe(30);
  });

  test("parses textual French month with accents", () => {
    const date = parseFrenchDate("1er février 2026");
    expect(date?.getUTCMonth()).toBe(1);
    expect(date?.getUTCDate()).toBe(1);
  });

  test("parses août", () => {
    expect(parseFrenchDate("20 août 2026")?.getUTCMonth()).toBe(7);
  });

  test("rejects garbage", () => {
    expect(parseFrenchDate("pas une date")).toBeNull();
    expect(parseFrenchDate("")).toBeNull();
  });
});

describe("parseBudgetMAD", () => {
  test("parses French-formatted MAD with spaces and decimal comma", () => {
    expect(parseBudgetMAD("2 500 000,00 MAD")).toBe(250_000_000); // 2.5M MAD in centimes
  });

  test("parses dot thousand separators", () => {
    expect(parseBudgetMAD("1.250.000,50 DH")).toBe(125_000_050);
  });

  test("parses plain numbers", () => {
    expect(parseBudgetMAD("500000")).toBe(50_000_000);
  });

  test("rejects empty and zero", () => {
    expect(parseBudgetMAD("MAD")).toBeNull();
    expect(parseBudgetMAD("0,00 MAD")).toBeNull();
  });
});

describe("parseTenderType", () => {
  test("detects travaux by default", () => {
    expect(parseTenderType("Appel d'offres ouvert", "Construction d'une école")).toBe("travaux");
  });

  test("detects fournitures", () => {
    expect(parseTenderType(undefined, "Fourniture de matériel informatique")).toBe("fournitures");
  });

  test("detects services via études", () => {
    expect(parseTenderType(undefined, "Étude technique de la rocade")).toBe("services");
  });

  test("detects conception-réalisation", () => {
    expect(parseTenderType(undefined, "Conception et réalisation d'un complexe sportif")).toBe(
      "conception_realisation"
    );
  });
});

describe("parseMaitreDOuvrageType", () => {
  test("commune", () => {
    expect(parseMaitreDOuvrageType("Commune de Témara")).toBe("commune");
  });
  test("ministère", () => {
    expect(parseMaitreDOuvrageType("Ministère de l'Équipement et de l'Eau")).toBe("ministere");
  });
  test("établissement public", () => {
    expect(parseMaitreDOuvrageType("Office National des Chemins de Fer")).toBe(
      "etablissement_public"
    );
    expect(parseMaitreDOuvrageType("Agence Urbaine de Casablanca")).toBe("etablissement_public");
  });
  test("privé fallback", () => {
    expect(parseMaitreDOuvrageType("Société Immobilière Atlas SARL")).toBe("prive");
  });
});

describe("detectLots", () => {
  test("extracts numbered lots", () => {
    const lots = detectLots(
      "Travaux d'aménagement — Lot n° 1 : Gros œuvre; Lot n° 2 : Électricité; Lot n° 3 : Plomberie"
    );
    expect(lots).toHaveLength(3);
    expect(lots[1]).toMatchObject({ lotNumber: 2, lotTitle: "Électricité" });
  });

  test("deduplicates repeated lot numbers", () => {
    const lots = detectLots("Lot n°1 : Peinture. Lot n°1 : Peinture.");
    expect(lots).toHaveLength(1);
  });

  test("returns empty for single-lot tenders", () => {
    expect(detectLots("Construction d'un pont")).toHaveLength(0);
  });
});

describe("parseTenderFields", () => {
  const base = {
    externalId: "MP-2026-000777",
    title: "Travaux de plomberie et sanitaire — École primaire Al Amal",
    maitreDOuvrage: "Commune de Salé",
    publishedAt: "01/06/2026",
    submissionDeadline: "15/07/2026 10:00",
  };

  test("produces a normalized RawTender", () => {
    const tender = parseTenderFields({
      ...base,
      procedureType: "Appel d'offres ouvert — Travaux",
      region: "Rabat-Salé-Kénitra",
      estimatedBudget: "1 200 000,00 MAD",
      dossierUrl: "https://www.marchespublics.gov.ma/dossier/777",
    });

    expect(tender.externalId).toBe("MP-2026-000777");
    expect(tender.type).toBe("travaux");
    expect(tender.maitreDOuvrageType).toBe("commune");
    expect(tender.requiredSpecialties).toContain("plomberie");
    expect(tender.estimatedBudgetMinCentimes).toBe(120_000_000);
    expect(tender.submissionDeadline.getUTCDate()).toBe(15);
  });

  test("detects lots from description when no explicit lots", () => {
    const tender = parseTenderFields({
      ...base,
      description: "Lot n° 1 : Plomberie; Lot n° 2 : Électricité",
    });
    expect(tender.lots).toHaveLength(2);
    expect(tender.lots[1]?.requiredSpecialties).toContain("electricite");
  });

  test("prefers explicit lots over detection", () => {
    const tender = parseTenderFields({
      ...base,
      description: "Lot n° 9 : Faux",
      lots: [{ lotNumber: 1, lotTitle: "Climatisation", estimatedBudget: "300 000 MAD" }],
    });
    expect(tender.lots).toHaveLength(1);
    expect(tender.lots[0]?.requiredSpecialties).toContain("hvac");
    expect(tender.lots[0]?.estimatedBudgetCentimes).toBe(30_000_000);
  });

  test("throws TenderParseError on bad deadline", () => {
    expect(() => parseTenderFields({ ...base, submissionDeadline: "bientôt" })).toThrow(
      TenderParseError
    );
  });
});
