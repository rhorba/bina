import { describe, expect, it } from "vitest";
import { DOC_TYPE_LABELS_FR, docTypeLabelFr } from "./labels.js";

describe("docTypeLabelFr", () => {
  it("maps known doc types to FR labels", () => {
    expect(docTypeLabelFr("attestation_fiscale")).toBe("Attestation fiscale");
    expect(docTypeLabelFr("quitus_cnss")).toBe("Quitus CNSS");
    expect(docTypeLabelFr("qualification_fnbtp")).toBe("Qualification FNBTP");
  });

  it("falls back to the raw key for unknown types", () => {
    expect(docTypeLabelFr("mystery")).toBe("mystery");
  });

  it("covers every doc_type enum value", () => {
    const enumValues = [
      "attestation_fiscale",
      "quitus_cnss",
      "assurance_decennale",
      "rc_pro",
      "registre_commerce",
      "statuts",
      "qualification_fnbtp",
      "reference_chantier",
      "other",
    ];
    for (const v of enumValues) {
      expect(DOC_TYPE_LABELS_FR[v]).toBeTruthy();
    }
  });
});
