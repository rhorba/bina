"use server";
import { getSession } from "@/auth/index.js";
import {
  buildFileKey,
  deleteDocument,
  deleteObject,
  generateSignedUrl,
  getDocument,
  insertDocument,
  markPendingRenewal,
  putObject,
  recomputeComplianceScore,
  validateUpload,
} from "@bina/compliance";
import { auditLogs, withUserContext } from "@bina/db";
import { revalidatePath } from "next/cache";

export type DocFormState = { error?: string; success?: boolean } | null;

const DOC_TYPES = [
  "attestation_fiscale",
  "quitus_cnss",
  "assurance_decennale",
  "rc_pro",
  "registre_commerce",
  "statuts",
  "qualification_fnbtp",
  "reference_chantier",
  "other",
] as const;

function parseDate(raw: FormDataEntryValue | null): Date | null {
  if (typeof raw !== "string" || !raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Upload a compliance document: validate → R2 (private) → DB row → audit → rescore.
export async function uploadDocumentAction(
  _prev: DocFormState,
  formData: FormData
): Promise<DocFormState> {
  const session = await getSession();
  if (!session || !session.contractorId) return { error: "Non autorisé." };
  const contractorId = session.contractorId;

  const type = formData.get("type");
  if (typeof type !== "string" || !(DOC_TYPES as readonly string[]).includes(type)) {
    return { error: "Type de document invalide." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Fichier requis." };
  }

  const valid = validateUpload(file.type, file.size);
  if (!valid.ok) {
    if (valid.reason === "size") return { error: "Fichier trop volumineux (max 5 Mo)." };
    if (valid.reason === "type") return { error: "Format non supporté (PDF, JPEG ou PNG)." };
    return { error: "Fichier vide." };
  }

  const fileKey = buildFileKey(contractorId, type, file.type);
  const buffer = Buffer.from(await file.arrayBuffer());
  // R2 put is best-effort: in dev/CI (no R2 creds) it no-ops; the vault still
  // records metadata so the UI works. Authorization is enforced below + by RLS.
  await putObject(fileKey, buffer, file.type);

  const issuedAt = parseDate(formData.get("issuedAt"));
  const expiresAt = parseDate(formData.get("expiresAt"));

  await withUserContext(session.userId, session.role, async (tx) => {
    const { id } = await insertDocument(tx, {
      contractorId,
      type,
      fileKey,
      fileName: file.name.slice(0, 255),
      fileSizeBytes: String(file.size),
      issuedAt,
      expiresAt,
    });
    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "compliance_document",
      entityId: id,
      action: "upload",
      after: { type, fileName: file.name, expiresAt },
    });
    await recomputeComplianceScore(tx, contractorId);
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !session.contractorId) return;
  const contractorId = session.contractorId;

  const docId = formData.get("docId");
  if (typeof docId !== "string" || !docId) return;

  let removedKey: string | null = null;
  await withUserContext(session.userId, session.role, async (tx) => {
    const removed = await deleteDocument(tx, docId, contractorId); // RLS scopes to owner
    if (!removed) return;
    removedKey = removed.fileKey;
    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "compliance_document",
      entityId: docId,
      action: "delete",
      before: { type: removed.type },
    });
    await recomputeComplianceScore(tx, contractorId);
  });

  // Drop the bytes only after the DB row is gone (best-effort).
  if (removedKey) await deleteObject(removedKey);
  revalidatePath("/", "layout");
}

// Mint a 15-min signed URL for a document and audit the access (Bina rule #1).
// Returns the URL; the client opens it in a new tab. RLS guarantees the caller
// can only read their own doc (admin can read any).
export async function downloadDocumentAction(
  docId: string
): Promise<{ url?: string; error?: string }> {
  const session = await getSession();
  if (!session || !session.contractorId) return { error: "Non autorisé." };

  return withUserContext(session.userId, session.role, async (tx) => {
    const doc = await getDocument(tx, docId); // RLS: only own doc (or admin)
    if (!doc) return { error: "Document introuvable." };

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "compliance_document",
      entityId: doc.id,
      action: "download",
      after: { type: doc.type },
    });

    const url = await generateSignedUrl(doc.fileKey);
    if (!url) return { error: "Stockage non configuré (R2)." };
    return { url };
  });
}

export async function markRenewalAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !session.contractorId) return;
  const contractorId = session.contractorId;

  const docId = formData.get("docId");
  if (typeof docId !== "string" || !docId) return;

  await withUserContext(session.userId, session.role, async (tx) => {
    await markPendingRenewal(tx, docId); // RLS scopes to owner
    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "compliance_document",
      entityId: docId,
      action: "update",
      after: { status: "pending_renewal" },
    });
    await recomputeComplianceScore(tx, contractorId);
  });
  revalidatePath("/", "layout");
}
