import { describe, expect, test } from "vitest";
import { signInSchema, signUpSchema } from "./schemas/auth.js";
import { contractorProfileSchema, projectReferenceSchema } from "./schemas/contractor.js";
import {
  createGroupementSchema,
  inviteMemberSchema,
  updateGroupementStatusSchema,
} from "./schemas/groupement.js";
import { savedSearchSchema, tenderFiltersSchema } from "./schemas/tender.js";

const UUID = "00000000-0000-4000-8000-000000000000";

describe("auth schemas", () => {
  test("signUpSchema accepts a valid signup, optional phone", () => {
    const r = signUpSchema.safeParse({
      email: "hassan@demo.bina.ma",
      password: "demo1234",
      name: "Hassan",
      companyName: "Plomberie Hassan",
      phone: "+212 600-112233",
    });
    expect(r.success).toBe(true);
  });

  test("signUpSchema rejects bad email and short password", () => {
    expect(
      signUpSchema.safeParse({ email: "nope", password: "x", name: "Ab", companyName: "Co" })
        .success
    ).toBe(false);
    expect(
      signUpSchema.safeParse({ email: "a@b.co", password: "short", name: "Ab", companyName: "Co" })
        .success
    ).toBe(false);
  });

  test("signInSchema requires a non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("contractor schemas", () => {
  test("contractorProfileSchema accepts a valid profile", () => {
    const r = contractorProfileSchema.safeParse({
      companyName: "Plomberie Hassan",
      ice: "001234567890123",
      specialties: ["plomberie"],
      regions: ["Casablanca-Settat"],
      companySize: "tpe",
      fnbtpCategory: "deuxieme",
    });
    expect(r.success).toBe(true);
  });

  test("rejects empty specialties, bad ICE, unknown region", () => {
    expect(
      contractorProfileSchema.safeParse({
        companyName: "Co",
        specialties: [],
        regions: ["Casablanca-Settat"],
        companySize: "tpe",
      }).success
    ).toBe(false);
    expect(
      contractorProfileSchema.safeParse({
        companyName: "Co",
        ice: "123",
        specialties: ["plomberie"],
        regions: ["Casablanca-Settat"],
        companySize: "tpe",
      }).success
    ).toBe(false);
    expect(
      contractorProfileSchema.safeParse({
        companyName: "Co",
        specialties: ["plomberie"],
        regions: ["Nowhere"],
        companySize: "tpe",
      }).success
    ).toBe(false);
  });

  test("projectReferenceSchema coerces date and rejects future completion", () => {
    const ok = projectReferenceSchema.safeParse({
      title: "Lot plomberie — Résidence Al Manar",
      maitreDOuvrage: "Commune de Casablanca",
      completedAt: "2024-03-01",
      specialty: "plomberie",
    });
    expect(ok.success).toBe(true);

    const future = projectReferenceSchema.safeParse({
      title: "Projet futur",
      maitreDOuvrage: "Commune",
      completedAt: "2099-01-01",
      specialty: "plomberie",
    });
    expect(future.success).toBe(false);
  });
});

describe("groupement schemas", () => {
  test("createGroupementSchema needs a uuid tender + a specialty", () => {
    expect(
      createGroupementSchema.safeParse({
        tenderId: UUID,
        title: "Groupement stade Casa",
        neededSpecialties: ["electricite"],
      }).success
    ).toBe(true);
    expect(
      createGroupementSchema.safeParse({
        tenderId: "not-a-uuid",
        title: "Groupement stade Casa",
        neededSpecialties: ["electricite"],
      }).success
    ).toBe(false);
  });

  test("inviteMemberSchema + updateGroupementStatusSchema", () => {
    expect(
      inviteMemberSchema.safeParse({ groupementId: UUID, contractorId: UUID, specialty: "hvac" })
        .success
    ).toBe(true);
    expect(
      updateGroupementStatusSchema.safeParse({ groupementId: UUID, status: "formed" }).success
    ).toBe(true);
    expect(
      updateGroupementStatusSchema.safeParse({ groupementId: UUID, status: "bogus" }).success
    ).toBe(false);
  });
});

describe("tender schemas", () => {
  test("tenderFiltersSchema applies defaults and parses filters", () => {
    const r = tenderFiltersSchema.safeParse({
      specialties: ["plomberie"],
      regions: ["Casablanca-Settat"],
      budgetMin: 0,
      types: ["travaux"],
      status: ["open", "closing_soon"],
      search: "construction",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(1);
      expect(r.data.perPage).toBe(20);
    }
  });

  test("rejects an invalid specialty and over-long search", () => {
    expect(tenderFiltersSchema.safeParse({ specialties: ["welding"] }).success).toBe(false);
    expect(tenderFiltersSchema.safeParse({ search: "x".repeat(201) }).success).toBe(false);
  });

  test("savedSearchSchema requires a name and omits pagination", () => {
    const r = savedSearchSchema.safeParse({
      name: "Plomberie Casa 2–8M",
      filters: { specialties: ["plomberie"], regions: ["Casablanca-Settat"] },
    });
    expect(r.success).toBe(true);
    expect(savedSearchSchema.safeParse({ name: "", filters: {} }).success).toBe(false);
  });
});
