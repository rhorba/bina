import type { CreateGroupementInput } from "@bina/core";
import { type DB, groupementMembers, groupements } from "@bina/db";
import { and, eq } from "drizzle-orm";
import { type MemberLike, canFormGroupement, isMandataire } from "./membership.js";
import { type GroupementStatus, assertTransition } from "./state-machine.js";

export type CreateGroupementResult = { groupementId: string };

// Create a groupement for a tender. The initiator is inserted as the single
// mandataire (confirmed) — Décret 2-12-349 requires exactly one. The DB partial
// unique index `one_mandataire_per_groupement` is the final backstop.
export async function createGroupement(
  db: DB,
  initiatorContractorId: string,
  initiatorSpecialty: string,
  input: CreateGroupementInput
): Promise<CreateGroupementResult> {
  const [g] = await db
    .insert(groupements)
    .values({
      tenderId: input.tenderId,
      lotId: input.lotId ?? null,
      initiatorId: initiatorContractorId,
      title: input.title,
      targetBudgetCentimes: input.targetBudget ?? null,
      status: "forming",
      neededSpecialties: input.neededSpecialties,
      workspaceNotes: input.workspaceNotes ?? null,
    })
    .returning({ id: groupements.id });

  const groupementId = g?.id ?? "";

  await db.insert(groupementMembers).values({
    groupementId,
    contractorId: initiatorContractorId,
    specialty: initiatorSpecialty,
    role: "mandataire",
    status: "confirmed",
    joinedAt: new Date(),
  });

  return { groupementId };
}

async function loadMembers(db: DB, groupementId: string): Promise<MemberLike[]> {
  const rows = await db
    .select({
      contractorId: groupementMembers.contractorId,
      specialty: groupementMembers.specialty,
      role: groupementMembers.role,
      status: groupementMembers.status,
    })
    .from(groupementMembers)
    .where(eq(groupementMembers.groupementId, groupementId));
  return rows as MemberLike[];
}

export type InviteResult = { ok: boolean; reason?: string };

// Invite a contractor as a cotraitant (cotraitants only — the sole mandataire is
// the initiator). Idempotent against active duplicates.
export async function inviteCotraitant(
  db: DB,
  groupementId: string,
  contractorId: string,
  specialty: string,
  estimatedShareCentimes?: number
): Promise<InviteResult> {
  const members = await loadMembers(db, groupementId);
  if (members.some((m) => m.contractorId === contractorId && isActive(m.status))) {
    return { ok: false, reason: "already_member" };
  }
  await db.insert(groupementMembers).values({
    groupementId,
    contractorId,
    specialty,
    role: "cotraitant",
    status: "invited",
    estimatedShareCentimes: estimatedShareCentimes ?? null,
  });
  return { ok: true };
}

function isActive(status: string): boolean {
  return status === "invited" || status === "confirmed";
}

// A cotraitant responds to their invite. accept → confirmed (+ joinedAt);
// otherwise → declined.
export async function respondToInvite(
  db: DB,
  groupementId: string,
  contractorId: string,
  accept: boolean
): Promise<void> {
  await db
    .update(groupementMembers)
    .set(accept ? { status: "confirmed", joinedAt: new Date() } : { status: "declined" })
    .where(
      and(
        eq(groupementMembers.groupementId, groupementId),
        eq(groupementMembers.contractorId, contractorId),
        eq(groupementMembers.status, "invited")
      )
    );
}

export type LeaveResult = { ok: boolean; reason?: string };

// A cotraitant leaves. The mandataire cannot leave (it would orphan the
// groupement) — they must withdraw the whole groupement instead.
export async function leaveGroupement(
  db: DB,
  groupementId: string,
  contractorId: string
): Promise<LeaveResult> {
  const members = await loadMembers(db, groupementId);
  if (isMandataire(members, contractorId)) {
    return { ok: false, reason: "mandataire_cannot_leave" };
  }
  await db
    .update(groupementMembers)
    .set({ status: "left" })
    .where(
      and(
        eq(groupementMembers.groupementId, groupementId),
        eq(groupementMembers.contractorId, contractorId)
      )
    );
  return { ok: true };
}

// Update a confirmed member's contribution share (centimes).
export async function setMemberShare(
  db: DB,
  groupementId: string,
  memberContractorId: string,
  shareCentimes: number | null
): Promise<void> {
  await db
    .update(groupementMembers)
    .set({ estimatedShareCentimes: shareCentimes })
    .where(
      and(
        eq(groupementMembers.groupementId, groupementId),
        eq(groupementMembers.contractorId, memberContractorId)
      )
    );
}

export async function updateWorkspaceNotes(
  db: DB,
  groupementId: string,
  notes: string
): Promise<void> {
  await db
    .update(groupements)
    .set({ workspaceNotes: notes, updatedAt: new Date() })
    .where(eq(groupements.id, groupementId));
}

export type TransitionResult =
  | { ok: true; from: GroupementStatus; to: GroupementStatus }
  | { ok: false; reason: string; missing?: string[] };

// Move the groupement to a new status. Validates the state machine (only the
// mandataire may drive forming→…→submitted), and for forming→formed requires
// every needed specialty covered by a confirmed member. Sets submittedAt on
// reaching `submitted`.
export async function transitionGroupementStatus(
  db: DB,
  groupementId: string,
  to: GroupementStatus,
  actingContractorId: string
): Promise<TransitionResult> {
  const [g] = await db
    .select({ status: groupements.status, needed: groupements.neededSpecialties })
    .from(groupements)
    .where(eq(groupements.id, groupementId))
    .limit(1);
  if (!g) return { ok: false, reason: "not_found" };

  const from = g.status as GroupementStatus;
  const members = await loadMembers(db, groupementId);
  const actorIsMandataire = isMandataire(members, actingContractorId);

  try {
    assertTransition(from, to, actorIsMandataire);
  } catch {
    return { ok: false, reason: from === to ? "same_status" : "invalid_transition" };
  }

  if (to === "formed") {
    const guard = canFormGroupement(g.needed ?? [], members);
    if (!guard.ready) return { ok: false, reason: guard.reason, missing: guard.missing };
  }

  await db
    .update(groupements)
    .set({
      status: to,
      updatedAt: new Date(),
      ...(to === "submitted" ? { submittedAt: new Date() } : {}),
    })
    .where(eq(groupements.id, groupementId));

  return { ok: true, from, to };
}
