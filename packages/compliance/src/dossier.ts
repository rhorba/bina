// Dossier builder — for a given tender, work out which compliance documents the
// submission requires, then check them against the contractor's vault. Output is
// a checklist (have / expiring / missing) the contractor uses to assemble their
// bid dossier in minutes instead of days.
//
// Bina NEVER certifies compliance: the output always carries the disclaimer.

import type { DocStatus } from "./expiry.js";
import type { DocType } from "./score.js";

// Verbatim disclaimer required on every dossier output (Bina rule #5, never
// certify compliance — the maître d'ouvrage verifies conformity, not Bina).
export const DOSSIER_DISCLAIMER =
  "Ce document est un outil de préparation. Bina ne certifie pas la conformité — " +
  "la vérification reste la responsabilité du maître d'ouvrage conformément au Code des marchés publics.";

// Minimal tender shape the builder needs (avoids a hard dep on the full type).
export type DossierTenderInput = {
  type: "travaux" | "fournitures" | "services" | "conception_realisation" | string;
  requiredFNBTPCategory?: string | null;
  estimatedBudgetMax?: number | null; // centimes
};

export type DossierVaultDoc = { type: DocType | string; status: DocStatus | string };

export type DossierItemState = "have" | "expiring" | "missing";

export type DossierItem = {
  docType: string;
  required: boolean; // true = mandatory, false = recommended
  state: DossierItemState;
};

export type DossierChecklist = {
  items: DossierItem[];
  missingRequired: string[];
  complete: boolean; // every required doc is have/expiring
  disclaimer: string;
};

// Reference threshold: tenders above 5M MAD effectively require a track record
// (reference_chantier) to be competitive — flagged as recommended, not mandatory.
const REFERENCE_BUDGET_THRESHOLD_CENTIMES = 5_000_000 * 100;

// Determine the documents a tender's dossier requires. `required: true` items are
// mandatory; `required: false` are recommended (still surfaced, never block).
export function requiredDocsForTender(
  tender: DossierTenderInput
): { docType: DocType; required: boolean }[] {
  const docs: { docType: DocType; required: boolean }[] = [
    // Administrative core — mandatory for every public tender.
    { docType: "attestation_fiscale", required: true },
    { docType: "quitus_cnss", required: true },
    { docType: "registre_commerce", required: true },
    { docType: "statuts", required: true },
  ];

  const isWorks = tender.type === "travaux" || tender.type === "conception_realisation";

  // Décennale insurance is mandatory for construction works.
  if (isWorks) {
    docs.push({ docType: "assurance_decennale", required: true });
  } else {
    // For fournitures/services, civil-liability insurance is the relevant cover.
    docs.push({ docType: "rc_pro", required: false });
  }

  // FNBTP qualification is mandatory when the tender demands a category.
  if (tender.requiredFNBTPCategory && tender.requiredFNBTPCategory !== "non_qualifie") {
    docs.push({ docType: "qualification_fnbtp", required: true });
  }

  // Large works → references strongly recommended.
  if (
    typeof tender.estimatedBudgetMax === "number" &&
    tender.estimatedBudgetMax >= REFERENCE_BUDGET_THRESHOLD_CENTIMES
  ) {
    docs.push({ docType: "reference_chantier", required: false });
  }

  return docs;
}

function stateForDoc(vault: DossierVaultDoc[], docType: string): DossierItemState {
  const matches = vault.filter((d) => d.type === docType);
  if (matches.some((d) => d.status === "valid")) return "have";
  if (matches.some((d) => d.status === "expiring_soon" || d.status === "pending_renewal"))
    return "expiring";
  return "missing";
}

// Build the dossier checklist: required + recommended docs cross-referenced with
// the contractor's vault. `complete` is true only when no MANDATORY doc is missing
// (expiring counts as present-but-warned).
export function buildDossierChecklist(
  tender: DossierTenderInput,
  vault: DossierVaultDoc[]
): DossierChecklist {
  const required = requiredDocsForTender(tender);
  const items: DossierItem[] = required.map((r) => ({
    docType: r.docType,
    required: r.required,
    state: stateForDoc(vault, r.docType),
  }));

  const missingRequired = items
    .filter((i) => i.required && i.state === "missing")
    .map((i) => i.docType);

  return {
    items,
    missingRequired,
    complete: missingRequired.length === 0,
    disclaimer: DOSSIER_DISCLAIMER,
  };
}
