import { describe, expect, test } from "vitest";
import { inferSpecialties, normalizeText } from "./specialty-keywords.js";

describe("normalizeText", () => {
  test("lowercases and strips accents", () => {
    expect(normalizeText("Électricité — Bâtiment")).toBe("electricite — batiment");
  });
});

describe("inferSpecialties", () => {
  test("matches accented keywords", () => {
    expect(inferSpecialties("Travaux d'électricité et d'éclairage public")).toContain(
      "electricite"
    );
  });

  test("matches multiple specialties", () => {
    const result = inferSpecialties("Construction d'un centre: plomberie, climatisation, voirie");
    expect(result).toEqual(expect.arrayContaining(["plomberie", "hvac", "routes"]));
  });

  test("VRD maps to routes", () => {
    expect(inferSpecialties("Travaux de VRD — tranche 2")).toContain("routes");
  });

  test("assainissement maps to hydraulique", () => {
    expect(inferSpecialties("Réseau d'assainissement liquide")).toContain("hydraulique");
  });

  test("falls back to other", () => {
    expect(inferSpecialties("Prestations diverses")).toEqual(["other"]);
  });
});
