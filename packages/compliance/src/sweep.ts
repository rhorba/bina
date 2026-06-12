// Weekly document-expiry sweep (pg-boss doc.expiry.sweep job). For every
// contractor's vault: refresh the derived statuses, then raise a 15-day-advance
// doc_expiry notification (in-app + best-effort email) for each document that is
// expiring soon or already expired. DB/IO glue — excluded from unit coverage; the
// pure helpers it relies on (daysUntilExpiry / needsExpiryAlert / labels) ARE
// unit-tested.

import {
  type DB,
  complianceDocuments,
  contractorProfiles,
  users,
} from "@bina/db";
import { notify } from "@bina/notifications";
import { eq } from "drizzle-orm";
import { DOC_TYPE_LABELS_FR } from "./labels.js";
import { daysUntilExpiry } from "./expiry.js";
import { refreshDocStatuses } from "./mutations.js";

export type DocExpiryAlert = {
  contractorId: string;
  userId: string;
  docType: string;
  daysRemaining: number;
};

export type DocExpirySweepSummary = {
  contractorsProcessed: number;
  alerts: number;
};

// Statuses that warrant an alert. `valid` is fine; `pending_renewal` means the
// firm already knows and is acting — don't nag them.
const ALERTABLE = ["expiring_soon", "expired"] as const;

export async function runDocExpirySweep(
  db: DB,
  now: Date = new Date()
): Promise<DocExpirySweepSummary> {
  // Distinct contractors that own at least one document.
  const owners = await db
    .selectDistinct({
      contractorId: complianceDocuments.contractorId,
      userId: contractorProfiles.userId,
      email: users.email,
    })
    .from(complianceDocuments)
    .innerJoin(contractorProfiles, eq(complianceDocuments.contractorId, contractorProfiles.id))
    .innerJoin(users, eq(contractorProfiles.userId, users.id));

  let alerts = 0;

  for (const owner of owners) {
    // Recompute derived statuses first so the alert reflects today's reality.
    await refreshDocStatuses(db, owner.contractorId);

    const docs = await db
      .select({
        type: complianceDocuments.type,
        expiresAt: complianceDocuments.expiresAt,
        status: complianceDocuments.status,
      })
      .from(complianceDocuments)
      .where(eq(complianceDocuments.contractorId, owner.contractorId));

    for (const doc of docs) {
      if (!(ALERTABLE as readonly string[]).includes(doc.status)) continue;
      const days = daysUntilExpiry(doc.expiresAt, now) ?? 0;
      await notify(db, {
        userId: owner.userId,
        email: owner.email,
        kind: "doc_expiry",
        data: {
          docTypeLabel: DOC_TYPE_LABELS_FR[doc.type] ?? doc.type,
          docExpiresInDays: days,
        },
      });
      alerts++;
    }
  }

  return { contractorsProcessed: owners.length, alerts };
}
