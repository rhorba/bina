// Admin dashboard queries (Sprint 7). Cross-table aggregates that power the
// platform KPI grid, the FNBTP verification queue, and the scraper-health view.
// Reads use the plain `db` (admin layout already gates on role === "admin");
// the verify mutation runs under withUserContext so RLS + audit see the admin.
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";
import type { DB } from "../client.js";
import { auditLogs } from "../schema/audit.js";
import { contractorProfiles } from "../schema/contractors.js";
import { groupementMembers, groupements } from "../schema/groupements.js";
import { notifications } from "../schema/notifications.js";
import { scraperRuns } from "../schema/scraper.js";
import { tenders } from "../schema/tenders.js";
import { users } from "../schema/users.js";

export type AdminKpis = {
  tendersIndexed: number;
  activeUsers30d: number;
  activeGroupements: number;
  alertsSent7d: number;
  verificationQueue: number;
};

const DAY_MS = 86_400_000;
// groupement_status values that are not yet concluded
const ACTIVE_GROUPEMENT_STATUSES = ["forming", "formed", "submitting", "submitted"] as const;

// A contractor is "pending verification" when it declared a real FNBTP category
// but no admin has confirmed it yet.
const pendingVerificationWhere = and(
  isNull(contractorProfiles.fnbtpVerifiedAt),
  isNotNull(contractorProfiles.fnbtpCategory),
  ne(contractorProfiles.fnbtpCategory, "non_qualifie")
);

export async function getAdminKpis(db: DB, now: Date = new Date()): Promise<AdminKpis> {
  const since30d = new Date(now.getTime() - 30 * DAY_MS);
  const since7d = new Date(now.getTime() - 7 * DAY_MS);

  const [tendersRow] = await db.select({ n: count() }).from(tenders);

  const [usersRow] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.isActive, true), gte(users.lastLoginAt, since30d)));

  const [groupementsRow] = await db
    .select({ n: count() })
    .from(groupements)
    .where(inArray(groupements.status, [...ACTIVE_GROUPEMENT_STATUSES]));

  const [alertsRow] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.type, "new_tender_match"), gte(notifications.createdAt, since7d)));

  const [queueRow] = await db
    .select({ n: count() })
    .from(contractorProfiles)
    .where(pendingVerificationWhere);

  return {
    tendersIndexed: tendersRow?.n ?? 0,
    activeUsers30d: usersRow?.n ?? 0,
    activeGroupements: groupementsRow?.n ?? 0,
    alertsSent7d: alertsRow?.n ?? 0,
    verificationQueue: queueRow?.n ?? 0,
  };
}

export type VerificationQueueItem = {
  contractorId: string;
  companyName: string;
  fnbtpCategory: string | null;
  fnbtpNumber: string | null;
  createdAt: Date;
};

// Contractors that declared an FNBTP category but have not been admin-verified.
export async function getVerificationQueue(db: DB): Promise<VerificationQueueItem[]> {
  return db
    .select({
      contractorId: contractorProfiles.id,
      companyName: contractorProfiles.companyName,
      fnbtpCategory: contractorProfiles.fnbtpCategory,
      fnbtpNumber: contractorProfiles.fnbtpNumber,
      createdAt: contractorProfiles.createdAt,
    })
    .from(contractorProfiles)
    .where(pendingVerificationWhere)
    .orderBy(desc(contractorProfiles.createdAt));
}

// Latest scraper / CSV-import runs, newest first — feeds the scraper-health view.
export async function getRecentScraperRuns(db: DB, limit = 10) {
  return db.select().from(scraperRuns).orderBy(desc(scraperRuns.startedAt)).limit(limit);
}

export type AdminGroupementRow = {
  id: string;
  title: string;
  status: string;
  tenderTitle: string;
  memberCount: number;
  createdAt: Date;
};

// All groupements (any status) for the admin moderation view, newest first.
export async function getGroupementsOverview(db: DB, limit = 50): Promise<AdminGroupementRow[]> {
  const rows = await db
    .select({
      id: groupements.id,
      title: groupements.title,
      status: groupements.status,
      tenderTitle: tenders.title,
      createdAt: groupements.createdAt,
      memberCount: sql<number>`(
        SELECT count(*)::int FROM ${groupementMembers} gm
        WHERE gm.groupement_id = ${groupements.id}
          AND gm.status IN ('invited', 'confirmed')
      )`,
    })
    .from(groupements)
    .innerJoin(tenders, eq(groupements.tenderId, tenders.id))
    .orderBy(desc(groupements.createdAt))
    .limit(limit);
  return rows;
}

// Admin confirms a contractor's declared FNBTP qualification. Audit-logged.
export async function setFnbtpVerified(
  db: DB,
  contractorId: string,
  adminUserId: string,
  now: Date = new Date()
): Promise<void> {
  const before = await db.query.contractorProfiles.findFirst({
    where: eq(contractorProfiles.id, contractorId),
    columns: { fnbtpVerifiedAt: true, fnbtpCategory: true },
  });

  await db
    .update(contractorProfiles)
    .set({ fnbtpVerifiedAt: now, updatedAt: now })
    .where(eq(contractorProfiles.id, contractorId));

  await db.insert(auditLogs).values({
    actorUserId: adminUserId,
    entity: "contractor_profile",
    entityId: contractorId,
    action: "update",
    before: before ?? null,
    after: { fnbtpVerifiedAt: now },
    at: now,
  });
}
