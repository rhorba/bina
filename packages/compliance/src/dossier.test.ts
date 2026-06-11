import { describe, expect, it } from "vitest";
import {
  DOSSIER_DISCLAIMER,
  type DossierVaultDoc,
  buildDossierChecklist,
  requiredDocsForTender,
} from "./dossier.js";

const FIVE_M = 5_000_000 * 100; // 5M MAD in centimes

describe("requiredDocsForTender", () => {
  it("always requires the four administrative core docs", () => {
    const docs = requiredDocsForTender({ type: "services" });
    const required = docs.filter((d) => d.required).map((d) => d.docType);
    expect(required).toContain("attestation_fiscale");
    expect(required).toContain("quitus_cnss");
    expect(required).toContain("registre_commerce");
    expect(required).toContain("statuts");
  });

  it("requires assurance_decennale for travaux and conception_realisation", () => {
    for (const type of ["travaux", "conception_realisation"]) {
      const docs = requiredDocsForTender({ type });
      const dec = docs.find((d) => d.docType === "assurance_decennale");
      expect(dec).toEqual({ docType: "assurance_decennale", required: true });
    }
  });

  it("recommends rc_pro (not decennale) for non-works tenders", () => {
    const docs = requiredDocsForTender({ type: "fournitures" });
    expect(docs.find((d) => d.docType === "assurance_decennale")).toBeUndefined();
    expect(docs.find((d) => d.docType === "rc_pro")).toEqual({
      docType: "rc_pro",
      required: false,
    });
  });

  it("requires qualification_fnbtp when the tender demands a category", () => {
    const docs = requiredDocsForTender({ type: "travaux", requiredFNBTPCategory: "premiere" });
    expect(docs.find((d) => d.docType === "qualification_fnbtp")).toEqual({
      docType: "qualification_fnbtp",
      required: true,
    });
  });

  it("does not require FNBTP for non_qualifie or unset", () => {
    expect(
      requiredDocsForTender({ type: "travaux", requiredFNBTPCategory: "non_qualifie" }).find(
        (d) => d.docType === "qualification_fnbtp"
      )
    ).toBeUndefined();
    expect(
      requiredDocsForTender({ type: "travaux", requiredFNBTPCategory: null }).find(
        (d) => d.docType === "qualification_fnbtp"
      )
    ).toBeUndefined();
  });

  it("recommends references at/above the 5M MAD threshold only", () => {
    expect(
      requiredDocsForTender({ type: "travaux", estimatedBudgetMax: FIVE_M }).find(
        (d) => d.docType === "reference_chantier"
      )
    ).toEqual({ docType: "reference_chantier", required: false });
    expect(
      requiredDocsForTender({ type: "travaux", estimatedBudgetMax: FIVE_M - 1 }).find(
        (d) => d.docType === "reference_chantier"
      )
    ).toBeUndefined();
  });
});

describe("buildDossierChecklist", () => {
  const tender = { type: "travaux", requiredFNBTPCategory: "premiere", estimatedBudgetMax: FIVE_M };

  it("marks have / expiring / missing per doc and carries the disclaimer", () => {
    const vault: DossierVaultDoc[] = [
      { type: "attestation_fiscale", status: "valid" },
      { type: "quitus_cnss", status: "expiring_soon" },
      { type: "registre_commerce", status: "pending_renewal" },
      // statuts, assurance_decennale, qualification_fnbtp missing
    ];
    const checklist = buildDossierChecklist(tender, vault);

    const byType = Object.fromEntries(checklist.items.map((i) => [i.docType, i.state]));
    expect(byType.attestation_fiscale).toBe("have");
    expect(byType.quitus_cnss).toBe("expiring");
    expect(byType.registre_commerce).toBe("expiring"); // pending_renewal = present-but-warned
    expect(byType.statuts).toBe("missing");

    expect(checklist.disclaimer).toBe(DOSSIER_DISCLAIMER);
    expect(checklist.disclaimer).toContain("Bina ne certifie pas la conformité");
  });

  it("is incomplete and lists missing mandatory docs", () => {
    const checklist = buildDossierChecklist(tender, []);
    expect(checklist.complete).toBe(false);
    expect(checklist.missingRequired).toContain("attestation_fiscale");
    expect(checklist.missingRequired).toContain("qualification_fnbtp");
  });

  it("is complete when every mandatory doc is present (expiring still counts)", () => {
    const vault: DossierVaultDoc[] = [
      { type: "attestation_fiscale", status: "valid" },
      { type: "quitus_cnss", status: "valid" },
      { type: "registre_commerce", status: "valid" },
      { type: "statuts", status: "expiring_soon" },
      { type: "assurance_decennale", status: "valid" },
      { type: "qualification_fnbtp", status: "valid" },
    ];
    const checklist = buildDossierChecklist(tender, vault);
    expect(checklist.complete).toBe(true);
    expect(checklist.missingRequired).toEqual([]);
  });

  it("does not block completion on a missing recommended doc", () => {
    // reference_chantier is recommended (required:false) for this 5M tender.
    const vault: DossierVaultDoc[] = [
      { type: "attestation_fiscale", status: "valid" },
      { type: "quitus_cnss", status: "valid" },
      { type: "registre_commerce", status: "valid" },
      { type: "statuts", status: "valid" },
      { type: "assurance_decennale", status: "valid" },
      { type: "qualification_fnbtp", status: "valid" },
    ];
    const checklist = buildDossierChecklist(tender, vault);
    const ref = checklist.items.find((i) => i.docType === "reference_chantier");
    expect(ref?.state).toBe("missing");
    expect(ref?.required).toBe(false);
    expect(checklist.complete).toBe(true);
  });
});
