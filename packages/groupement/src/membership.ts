// Pure groupement-membership rules — Moroccan procurement law (Décret 2-12-349).
// Mirrors the DB partial unique index `one_mandataire_per_groupement`
// (role = 'mandataire' AND status IN ('invited','confirmed')) so the same
// invariant is enforced and unit-testable without a database.

export type MemberRole = "mandataire" | "cotraitant";
export type MemberStatus = "invited" | "confirmed" | "declined" | "left";

export type MemberLike = {
  contractorId: string;
  specialty: string;
  role: MemberRole;
  status: MemberStatus;
};

// A member "counts" toward the groupement (and toward the mandataire slot) while
// invited or confirmed. Declined / left members free their slot.
export const ACTIVE_MEMBER_STATUSES: readonly MemberStatus[] = ["invited", "confirmed"];

export function isActiveMember(m: MemberLike): boolean {
  return ACTIVE_MEMBER_STATUSES.includes(m.status);
}

export function activeMembers(members: MemberLike[]): MemberLike[] {
  return members.filter(isActiveMember);
}

// The single active mandataire, if any.
export function findActiveMandataire(members: MemberLike[]): MemberLike | undefined {
  return members.find((m) => m.role === "mandataire" && isActiveMember(m));
}

export function hasActiveMandataire(members: MemberLike[]): boolean {
  return findActiveMandataire(members) !== undefined;
}

export function isMandataire(members: MemberLike[], contractorId: string): boolean {
  const m = findActiveMandataire(members);
  return m?.contractorId === contractorId;
}

export type MandataireCheck = { ok: true } | { ok: false; reason: string };

// Décret 2-12-349: exactly one mandataire. Reject a member set that would
// create a second active mandataire (the DB index also rejects it as a backstop).
export function validateSingleMandataire(members: MemberLike[]): MandataireCheck {
  const active = members.filter((m) => m.role === "mandataire" && isActiveMember(m));
  if (active.length > 1) return { ok: false, reason: "multiple_mandataires" };
  return { ok: true };
}

// Would adding/keeping a mandataire member be allowed given the current set?
export function canAssignMandataire(members: MemberLike[]): boolean {
  return !hasActiveMandataire(members);
}

// Is this contractor already an active member (prevents duplicate invites/joins)?
export function isAlreadyMember(members: MemberLike[], contractorId: string): boolean {
  return members.some((m) => m.contractorId === contractorId && isActiveMember(m));
}

// Specialties currently covered by confirmed members.
export function coveredSpecialties(members: MemberLike[]): string[] {
  return [...new Set(members.filter((m) => m.status === "confirmed").map((m) => m.specialty))];
}

// Needed specialties still uncovered by confirmed members — drives "still looking for".
export function missingSpecialties(neededSpecialties: string[], members: MemberLike[]): string[] {
  const covered = new Set(coveredSpecialties(members));
  return neededSpecialties.filter((s) => !covered.has(s));
}

// forming → formed is allowed only once every needed specialty is covered by a
// confirmed member AND a mandataire is in place.
export function canFormGroupement(
  neededSpecialties: string[],
  members: MemberLike[]
): TransitionReadiness {
  if (!hasActiveMandataire(members)) return { ready: false, reason: "no_mandataire" };
  const missing = missingSpecialties(neededSpecialties, members);
  if (missing.length > 0) return { ready: false, reason: "specialties_missing", missing };
  return { ready: true };
}

export type TransitionReadiness =
  | { ready: true }
  | { ready: false; reason: string; missing?: string[] };
