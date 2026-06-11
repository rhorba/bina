import { describe, expect, it } from "vitest";
import {
  SCORED_DOC_TYPES,
  SCORE_WEIGHTS,
  type ScorableDoc,
  computeComplianceScore,
  missingScoredDocTypes,
} from "./score.js";

const valid = (type: string): ScorableDoc => ({ type, status: "valid" });
const expiring = (type: string): ScorableDoc => ({ type, status: "expiring_soon" });
const expired = (type: string): ScorableDoc => ({ type, status: "expired" });

describe("SCORE_WEIGHTS", () => {
  it("sums to exactly 100", () => {
    const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});

describe("computeComplianceScore", () => {
  it("is 0 for an empty vault", () => {
    expect(computeComplianceScore([])).toBe(0);
  });

  it("is 100 when every scored doc is valid", () => {
    const docs = SCORED_DOC_TYPES.map(valid);
    expect(computeComplianceScore(docs)).toBe(100);
  });

  it("awards full weight per valid critical doc", () => {
    expect(computeComplianceScore([valid("attestation_fiscale")])).toBe(25);
    expect(computeComplianceScore([valid("attestation_fiscale"), valid("quitus_cnss")])).toBe(50);
  });

  it("awards half weight for an expiring_soon doc", () => {
    // attestation 25 valid + cnss 25 expiring → 25 + 12.5 = 37.5 → rounds to 38
    expect(computeComplianceScore([valid("attestation_fiscale"), expiring("quitus_cnss")])).toBe(
      38
    );
  });

  it("awards nothing for expired or non-scored docs", () => {
    expect(computeComplianceScore([expired("attestation_fiscale")])).toBe(0);
    expect(computeComplianceScore([valid("reference_chantier"), valid("other")])).toBe(0);
  });

  it("never exceeds 100 even with duplicate valid docs", () => {
    const docs = [...SCORED_DOC_TYPES.map(valid), valid("attestation_fiscale")];
    expect(computeComplianceScore(docs)).toBe(100);
  });

  it("prefers a valid doc over an expiring duplicate of the same type", () => {
    expect(
      computeComplianceScore([valid("attestation_fiscale"), expiring("attestation_fiscale")])
    ).toBe(25);
  });
});

describe("missingScoredDocTypes", () => {
  it("lists every scored type for an empty vault", () => {
    expect(missingScoredDocTypes([])).toEqual(SCORED_DOC_TYPES);
  });

  it("excludes types covered by a valid or expiring doc", () => {
    const docs = [valid("attestation_fiscale"), expiring("quitus_cnss")];
    const missing = missingScoredDocTypes(docs);
    expect(missing).not.toContain("attestation_fiscale");
    expect(missing).not.toContain("quitus_cnss");
    expect(missing).toContain("statuts");
  });

  it("still counts a type as missing when its only doc is expired", () => {
    expect(missingScoredDocTypes([expired("statuts")])).toContain("statuts");
  });
});
