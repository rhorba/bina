"use server";
import { getSession } from "@/auth/index.js";
import { createGroupementSchema, inviteMemberSchema } from "@bina/core";
import { auditLogs, withUserContext } from "@bina/db";
import {
  type GroupementStatus,
  createGroupement,
  inviteCotraitant,
  leaveGroupement,
  respondToInvite,
  setMemberShare,
  transitionGroupementStatus,
  updateWorkspaceNotes,
} from "@bina/groupement";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type GroupementFormState = { error?: string; success?: boolean } | null;

const VALID_STATUSES: GroupementStatus[] = [
  "forming",
  "formed",
  "submitting",
  "submitted",
  "won",
  "lost",
  "withdrawn",
];

// Create a groupement for a tender. The initiator is inserted as the single
// mandataire (Décret 2-12-349). On success, redirect to the workspace.
export async function createGroupementAction(
  _prev: GroupementFormState,
  formData: FormData
): Promise<GroupementFormState> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) {
    return { error: "Non autorisé." };
  }
  const contractorId = session.contractorId;

  const initiatorSpecialty = formData.get("initiatorSpecialty");
  if (typeof initiatorSpecialty !== "string" || !initiatorSpecialty) {
    return { error: "Spécialité du mandataire requise." };
  }

  const targetBudgetMad = formData.get("targetBudgetMad");
  const parsed = createGroupementSchema.safeParse({
    tenderId: formData.get("tenderId"),
    lotId: (formData.get("lotId") as string)?.trim() || undefined,
    title: formData.get("title"),
    // form input is in MAD — stored as integer centimes
    targetBudget:
      targetBudgetMad === null || targetBudgetMad === ""
        ? undefined
        : Math.round(Number(targetBudgetMad) * 100),
    neededSpecialties: formData.getAll("neededSpecialties").filter(Boolean),
    workspaceNotes: (formData.get("workspaceNotes") as string)?.trim() || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }

  let groupementId = "";
  await withUserContext(session.userId, session.role, async (tx) => {
    const res = await createGroupement(tx, contractorId, initiatorSpecialty, parsed.data);
    groupementId = res.groupementId;
    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "groupement",
      entityId: groupementId,
      action: "create",
      after: { title: parsed.data.title, tenderId: parsed.data.tenderId },
    });
  });

  // redirect throws — must run outside the try/withUserContext callback
  redirect(`/groupements/${groupementId}`);
}

export async function inviteCotraitantAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;

  const parsed = inviteMemberSchema.safeParse({
    groupementId: formData.get("groupementId"),
    contractorId: formData.get("contractorId"),
    specialty: formData.get("specialty"),
    estimatedShare: estShareToCentimes(formData.get("estimatedShareMad")),
  });
  if (!parsed.success) return;
  const { groupementId, contractorId, specialty, estimatedShare } = parsed.data;

  await withUserContext(session.userId, session.role, async (tx) => {
    const res = await inviteCotraitant(tx, groupementId, contractorId, specialty, estimatedShare);
    if (res.ok) {
      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: "groupement",
        entityId: groupementId,
        action: "update",
        after: { invited: contractorId, specialty },
      });
    }
  });
  revalidatePath("/", "layout");
}

// Browse → join: a contractor requests to join a forming groupement by declaring
// the trade they would cover. Creates an `invited` cotraitant row (self-insert,
// RLS-allowed); the mandataire then confirms via manageMemberAction.
export async function requestJoinAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const groupementId = formData.get("groupementId");
  const specialty = formData.get("specialty");
  if (typeof groupementId !== "string" || !groupementId) return;
  if (typeof specialty !== "string" || !specialty) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    const res = await inviteCotraitant(tx, groupementId, contractorId, specialty);
    if (res.ok) {
      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: "groupement",
        entityId: groupementId,
        action: "update",
        after: { requestedJoin: contractorId, specialty },
      });
    }
  });
  revalidatePath("/", "layout");
}

// The mandataire confirms or declines a pending member (a join request, or any
// invited row). Reuses respondToInvite for the target member's invited→confirmed.
export async function manageMemberAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;

  const groupementId = formData.get("groupementId");
  const memberContractorId = formData.get("memberContractorId");
  const accept = formData.get("accept") === "true";
  if (typeof groupementId !== "string" || !groupementId) return;
  if (typeof memberContractorId !== "string" || !memberContractorId) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await respondToInvite(tx, groupementId, memberContractorId, accept);
    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "groupement",
      entityId: groupementId,
      action: accept ? "join" : "update",
      after: { member: memberContractorId, decision: accept ? "confirmed" : "declined" },
    });
  });
  revalidatePath("/", "layout");
}

export async function respondToInviteAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const groupementId = formData.get("groupementId");
  const accept = formData.get("accept") === "true";
  if (typeof groupementId !== "string" || !groupementId) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await respondToInvite(tx, groupementId, contractorId, accept);
    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "groupement",
      entityId: groupementId,
      action: accept ? "join" : "update",
      after: { contractorId, response: accept ? "confirmed" : "declined" },
    });
  });
  revalidatePath("/", "layout");
}

export async function leaveGroupementAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const groupementId = formData.get("groupementId");
  if (typeof groupementId !== "string" || !groupementId) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    const res = await leaveGroupement(tx, groupementId, contractorId);
    if (res.ok) {
      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: "groupement",
        entityId: groupementId,
        action: "leave",
        before: { contractorId },
      });
    }
  });
  revalidatePath("/", "layout");
}

export async function transitionStatusAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;
  const contractorId = session.contractorId;

  const groupementId = formData.get("groupementId");
  const to = formData.get("status");
  if (typeof groupementId !== "string" || !groupementId) return;
  if (typeof to !== "string" || !VALID_STATUSES.includes(to as GroupementStatus)) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    const res = await transitionGroupementStatus(
      tx,
      groupementId,
      to as GroupementStatus,
      contractorId
    );
    if (res.ok) {
      await tx.insert(auditLogs).values({
        actorUserId: session.userId,
        entity: "groupement",
        entityId: groupementId,
        action: to === "submitted" ? "submit" : "update",
        before: { status: res.from },
        after: { status: res.to },
      });
    }
  });
  revalidatePath("/", "layout");
}

export async function updateNotesAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;

  const groupementId = formData.get("groupementId");
  const notes = formData.get("notes");
  if (typeof groupementId !== "string" || !groupementId) return;
  if (typeof notes !== "string") return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await updateWorkspaceNotes(tx, groupementId, notes.slice(0, 2000));
  });
  revalidatePath("/", "layout");
}

export async function setMemberShareAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) return;

  const groupementId = formData.get("groupementId");
  const memberContractorId = formData.get("memberContractorId");
  if (typeof groupementId !== "string" || !groupementId) return;
  if (typeof memberContractorId !== "string" || !memberContractorId) return;
  const share = estShareToCentimes(formData.get("shareMad"));

  await withUserContext(session.userId, session.role, async (tx) => {
    await setMemberShare(tx, groupementId, memberContractorId, share ?? null);
  });
  revalidatePath("/", "layout");
}

function estShareToCentimes(raw: FormDataEntryValue | null): number | undefined {
  if (raw === null || raw === "" || typeof raw !== "string") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100);
}
