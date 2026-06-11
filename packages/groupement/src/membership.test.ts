import { describe, expect, it } from "vitest";
import {
  ACTIVE_MEMBER_STATUSES,
  type MemberLike,
  activeMembers,
  canAssignMandataire,
  canFormGroupement,
  coveredSpecialties,
  findActiveMandataire,
  hasActiveMandataire,
  isActiveMember,
  isAlreadyMember,
  isMandataire,
  missingSpecialties,
  validateSingleMandataire,
} from "./membership.js";

const m = (over: Partial<MemberLike>): MemberLike => ({
  contractorId: "c1",
  specialty: "plomberie",
  role: "cotraitant",
  status: "confirmed",
  ...over,
});

describe("active membership", () => {
  it("treats invited and confirmed as active, declined/left as inactive", () => {
    expect(ACTIVE_MEMBER_STATUSES).toEqual(["invited", "confirmed"]);
    expect(isActiveMember(m({ status: "invited" }))).toBe(true);
    expect(isActiveMember(m({ status: "confirmed" }))).toBe(true);
    expect(isActiveMember(m({ status: "declined" }))).toBe(false);
    expect(isActiveMember(m({ status: "left" }))).toBe(false);
  });

  it("filters to active members", () => {
    const members = [
      m({ contractorId: "a", status: "confirmed" }),
      m({ contractorId: "b", status: "left" }),
      m({ contractorId: "c", status: "invited" }),
    ];
    expect(activeMembers(members).map((x) => x.contractorId)).toEqual(["a", "c"]);
  });
});

describe("mandataire identity", () => {
  const members = [
    m({ contractorId: "lead", role: "mandataire", status: "confirmed", specialty: "batiment" }),
    m({ contractorId: "elec", role: "cotraitant", status: "confirmed", specialty: "electricite" }),
  ];

  it("finds the active mandataire", () => {
    expect(findActiveMandataire(members)?.contractorId).toBe("lead");
    expect(hasActiveMandataire(members)).toBe(true);
  });

  it("ignores a mandataire who has left (slot is free)", () => {
    const left = [m({ contractorId: "lead", role: "mandataire", status: "left" })];
    expect(findActiveMandataire(left)).toBeUndefined();
    expect(hasActiveMandataire(left)).toBe(false);
    expect(canAssignMandataire(left)).toBe(true);
  });

  it("blocks assigning a second mandataire while one is active", () => {
    expect(canAssignMandataire(members)).toBe(false);
  });

  it("identifies the mandataire contractor", () => {
    expect(isMandataire(members, "lead")).toBe(true);
    expect(isMandataire(members, "elec")).toBe(false);
    expect(isMandataire(members, "ghost")).toBe(false);
  });
});

describe("validateSingleMandataire (Décret 2-12-349)", () => {
  it("accepts exactly one active mandataire", () => {
    expect(
      validateSingleMandataire([
        m({ contractorId: "lead", role: "mandataire", status: "confirmed" }),
        m({ contractorId: "x", role: "cotraitant", status: "confirmed" }),
      ])
    ).toEqual({ ok: true });
  });

  it("accepts zero active mandataires (forming, not yet assigned)", () => {
    expect(validateSingleMandataire([m({ role: "cotraitant" })])).toEqual({ ok: true });
  });

  it("rejects two active mandataires", () => {
    expect(
      validateSingleMandataire([
        m({ contractorId: "a", role: "mandataire", status: "confirmed" }),
        m({ contractorId: "b", role: "mandataire", status: "invited" }),
      ])
    ).toEqual({ ok: false, reason: "multiple_mandataires" });
  });

  it("does not count a declined former mandataire as a conflict", () => {
    expect(
      validateSingleMandataire([
        m({ contractorId: "a", role: "mandataire", status: "confirmed" }),
        m({ contractorId: "b", role: "mandataire", status: "declined" }),
      ])
    ).toEqual({ ok: true });
  });
});

describe("duplicate membership", () => {
  const members = [
    m({ contractorId: "a", status: "confirmed" }),
    m({ contractorId: "b", status: "left" }),
  ];
  it("detects an existing active member", () => {
    expect(isAlreadyMember(members, "a")).toBe(true);
  });
  it("allows re-inviting a contractor who left", () => {
    expect(isAlreadyMember(members, "b")).toBe(false);
  });
  it("returns false for an unknown contractor", () => {
    expect(isAlreadyMember(members, "z")).toBe(false);
  });
});

describe("specialty coverage", () => {
  const members = [
    m({ contractorId: "lead", role: "mandataire", status: "confirmed", specialty: "batiment" }),
    m({ contractorId: "elec", status: "confirmed", specialty: "electricite" }),
    m({ contractorId: "hvac", status: "invited", specialty: "hvac" }), // invited ≠ covered
    m({ contractorId: "dup", status: "confirmed", specialty: "batiment" }),
  ];

  it("counts only confirmed specialties, de-duplicated", () => {
    expect(coveredSpecialties(members).sort()).toEqual(["batiment", "electricite"]);
  });

  it("reports needed specialties not yet confirmed", () => {
    expect(
      missingSpecialties(["batiment", "electricite", "hvac", "plomberie"], members).sort()
    ).toEqual(["hvac", "plomberie"]);
  });

  it("reports nothing missing when all needed are confirmed", () => {
    expect(missingSpecialties(["batiment", "electricite"], members)).toEqual([]);
  });
});

describe("canFormGroupement", () => {
  it("is ready when a mandataire is in place and all needed specialties confirmed", () => {
    const members = [
      m({ contractorId: "lead", role: "mandataire", status: "confirmed", specialty: "batiment" }),
      m({ contractorId: "elec", status: "confirmed", specialty: "electricite" }),
    ];
    expect(canFormGroupement(["batiment", "electricite"], members)).toEqual({ ready: true });
  });

  it("is not ready without a mandataire", () => {
    const members = [m({ contractorId: "elec", status: "confirmed", specialty: "electricite" })];
    expect(canFormGroupement(["electricite"], members)).toEqual({
      ready: false,
      reason: "no_mandataire",
    });
  });

  it("is not ready while specialties are missing, and reports which", () => {
    const members = [
      m({ contractorId: "lead", role: "mandataire", status: "confirmed", specialty: "batiment" }),
    ];
    expect(canFormGroupement(["batiment", "electricite"], members)).toEqual({
      ready: false,
      reason: "specialties_missing",
      missing: ["electricite"],
    });
  });
});

// Models the browse → request-to-join → mandataire-confirm flow: a self-join
// request inserts an `invited` cotraitant, which must NOT create a second
// mandataire, must stay "missing" until confirmed, then block formation until then.
describe("request-to-join → confirm flow invariants", () => {
  const base = [
    m({ contractorId: "lead", role: "mandataire", status: "confirmed", specialty: "batiment" }),
  ];
  const afterRequest = [
    ...base,
    m({ contractorId: "elec", role: "cotraitant", status: "invited", specialty: "electricite" }),
  ];
  const afterConfirm = [
    ...base,
    m({ contractorId: "elec", role: "cotraitant", status: "confirmed", specialty: "electricite" }),
  ];

  it("a pending join request keeps a single mandataire", () => {
    expect(validateSingleMandataire(afterRequest)).toEqual({ ok: true });
  });

  it("counts the requester as an active member (prevents duplicate requests)", () => {
    expect(isAlreadyMember(afterRequest, "elec")).toBe(true);
  });

  it("does not cover the specialty until the mandataire confirms", () => {
    expect(coveredSpecialties(afterRequest)).toEqual(["batiment"]);
    expect(missingSpecialties(["batiment", "electricite"], afterRequest)).toEqual(["electricite"]);
    expect(canFormGroupement(["batiment", "electricite"], afterRequest)).toEqual({
      ready: false,
      reason: "specialties_missing",
      missing: ["electricite"],
    });
  });

  it("covers the specialty and allows formation once confirmed", () => {
    expect(coveredSpecialties(afterConfirm).sort()).toEqual(["batiment", "electricite"]);
    expect(canFormGroupement(["batiment", "electricite"], afterConfirm)).toEqual({ ready: true });
  });
});
