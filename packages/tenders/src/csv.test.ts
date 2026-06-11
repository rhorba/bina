import { describe, expect, test } from "vitest";
import { parseTenderCsv, splitCsvLine } from "./csv.js";

const HEADER =
  "external_id;title;maitre_d_ouvrage;type;region;budget_min_mad;budget_max_mad;published_at;submission_deadline;specialties;fnbtp_category;description;dossier_url";

describe("splitCsvLine", () => {
  test("splits simple fields", () => {
    expect(splitCsvLine("a;b;c", ";")).toEqual(["a", "b", "c"]);
  });

  test("handles quoted fields containing the delimiter", () => {
    expect(splitCsvLine('a;"b;avec point-virgule";c', ";")).toEqual([
      "a",
      "b;avec point-virgule",
      "c",
    ]);
  });

  test("unescapes doubled quotes", () => {
    expect(splitCsvLine('"dit ""bonjour""";x', ";")).toEqual(['dit "bonjour"', "x"]);
  });
});

describe("parseTenderCsv", () => {
  test("parses valid rows into RawTender", () => {
    const csv = [
      HEADER,
      `MP-2026-100001;Travaux d'électricité — Lycée Hassan II;Commune de Fès;travaux;Fès-Meknès;800000;1200000;01/06/2026;20/07/2026;electricite;deuxieme;Mise à niveau électrique;https://example.ma/d/1`,
    ].join("\n");

    const { tenders, errors } = parseTenderCsv(csv);
    expect(errors).toHaveLength(0);
    expect(tenders).toHaveLength(1);
    const t = tenders[0];
    expect(t?.externalId).toBe("MP-2026-100001");
    expect(t?.maitreDOuvrageType).toBe("commune");
    expect(t?.estimatedBudgetMinCentimes).toBe(80_000_000);
    expect(t?.estimatedBudgetMaxCentimes).toBe(120_000_000);
    expect(t?.requiredSpecialties).toEqual(["electricite"]);
    expect(t?.requiredFnbtpCategory).toBe("deuxieme");
  });

  test("infers specialties when column is empty", () => {
    const csv = [
      HEADER,
      "MP-2026-100002;Travaux de peinture et revêtement;Ministère de la Santé;travaux;Casablanca-Settat;;;01/06/2026;30/07/2026;;;;",
    ].join("\n");

    const { tenders } = parseTenderCsv(csv);
    expect(tenders[0]?.requiredSpecialties).toContain("peinture");
  });

  test("collects per-line errors without aborting the import", () => {
    const csv = [
      HEADER,
      "MP-2026-100003;Bon marché;Commune de Salé;travaux;Rabat;;;01/06/2026;15/07/2026;;;;",
      ";Sans identifiant;Commune de Salé;travaux;Rabat;;;01/06/2026;15/07/2026;;;;",
      "MP-2026-100004;Date cassée;Commune de Salé;travaux;Rabat;;;01/06/2026;jamais;;;;",
    ].join("\n");

    const { tenders, errors } = parseTenderCsv(csv);
    expect(tenders).toHaveLength(1);
    expect(errors).toHaveLength(2);
    expect(errors[0]?.line).toBe(3);
    expect(errors[1]?.line).toBe(4);
  });

  test("rejects a CSV missing required headers", () => {
    const { tenders, errors } = parseTenderCsv("title;region\nabc;Rabat");
    expect(tenders).toHaveLength(0);
    expect(errors[0]?.message).toContain("colonnes manquantes");
  });

  test("accepts comma-delimited files", () => {
    const csv = [
      HEADER.replaceAll(";", ","),
      `MP-2026-100005,Construction d'un dispensaire,Commune d'Agadir,travaux,Souss-Massa,,,01/06/2026,15/08/2026,batiment,,,'`,
    ].join("\n");
    const { tenders, errors } = parseTenderCsv(csv);
    expect(errors).toHaveLength(0);
    expect(tenders[0]?.requiredSpecialties).toEqual(["batiment"]);
  });
});
