// Compliance score 0–100 — document completeness, shown on the contractor
// profile and as a groupement partner-trust signal.
//
// Weighted by how critical each document is to a public-procurement dossier.
// A valid doc earns its full weight; an `expiring_soon` doc earns half (it still
// counts, but the firm must renew it). Expired/missing docs earn nothing.
//
// Bina NEVER certifies compliance — this score measures vault completeness only.

import type { DocStatus } from "./expiry.js";

export type DocType =
  | "attestation_fiscale"
  | "quitus_cnss"
  | "assurance_decennale"
  | "rc_pro"
  | "registre_commerce"
  | "statuts"
  | "qualification_fnbtp"
  | "reference_chantier"
  | "other";

export type ScorableDoc = { type: DocType | string; status: DocStatus | string };

// Weights sum to 100. attestation_fiscale + quitus_cnss are the critical pair.
export const SCORE_WEIGHTS: Record<string, number> = {
  attestation_fiscale: 25,
  quitus_cnss: 25,
  registre_commerce: 15,
  assurance_decennale: 15,
  qualification_fnbtp: 10,
  rc_pro: 5,
  statuts: 5,
};

// The doc types that contribute to the base score (reference_chantier / other are
// bonus material, not part of completeness).
export const SCORED_DOC_TYPES = Object.keys(SCORE_WEIGHTS);

export function computeComplianceScore(docs: ScorableDoc[]): number {
  let score = 0;
  for (const [type, weight] of Object.entries(SCORE_WEIGHTS)) {
    const valid = docs.some((d) => d.type === type && d.status === "valid");
    if (valid) {
      score += weight;
      continue;
    }
    const expiringSoon = docs.some((d) => d.type === type && d.status === "expiring_soon");
    if (expiringSoon) score += weight * 0.5;
  }
  return Math.min(100, Math.round(score));
}

// Scored doc types the contractor has no valid/expiring_soon document for — the
// "what's still missing" list shown under the score.
export function missingScoredDocTypes(docs: ScorableDoc[]): string[] {
  return SCORED_DOC_TYPES.filter(
    (type) =>
      !docs.some((d) => d.type === type && (d.status === "valid" || d.status === "expiring_soon"))
  );
}
