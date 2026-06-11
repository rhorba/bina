import { type DB, contractorProfiles, groupementMembers, groupements, tenders } from "@bina/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export type GroupementRow = typeof groupements.$inferSelect;
export type GroupementMemberRow = typeof groupementMembers.$inferSelect;

// A member enriched with the contractor's public profile fields — the workspace
// member list and partner-trust signals (company, compliance score, FNBTP).
export type GroupementMemberWithContractor = GroupementMemberRow & {
  companyName: string;
  complianceScore: number;
  fnbtpCategory: string | null;
};

export type GroupementListItem = GroupementRow & {
  tenderTitle: string;
  tenderRegion: string;
  submissionDeadline: Date;
  memberCount: number;
};

export type GroupementDetail = {
  groupement: GroupementRow;
  tenderTitle: string;
  tenderRegion: string;
  submissionDeadline: Date;
  members: GroupementMemberWithContractor[];
};

// Browse open groupements seeking partners. `forming` only by default — these are
// the ones a contractor can still join. Optionally filter by a needed specialty.
export async function listOpenGroupements(
  db: DB,
  opts: { specialty?: string } = {}
): Promise<GroupementListItem[]> {
  const conditions = [eq(groupements.status, "forming")];
  if (opts.specialty) {
    // jsonb array contains the specialty
    conditions.push(sql`${groupements.neededSpecialties} ? ${opts.specialty}`);
  }

  const rows = await db
    .select({
      groupement: groupements,
      tenderTitle: tenders.title,
      tenderRegion: tenders.region,
      submissionDeadline: tenders.submissionDeadline,
      memberCount: sql<number>`(
        SELECT count(*)::int FROM ${groupementMembers} gm
        WHERE gm.groupement_id = ${groupements.id}
          AND gm.status IN ('invited', 'confirmed')
      )`,
    })
    .from(groupements)
    .innerJoin(tenders, eq(groupements.tenderId, tenders.id))
    .where(and(...conditions))
    .orderBy(desc(groupements.createdAt));

  return rows.map((r) => ({
    ...r.groupement,
    tenderTitle: r.tenderTitle,
    tenderRegion: r.tenderRegion,
    submissionDeadline: r.submissionDeadline,
    memberCount: r.memberCount,
  }));
}

// Groupements the contractor participates in (active membership), any status —
// drives "Mes groupements".
export async function listMyGroupements(
  db: DB,
  contractorId: string
): Promise<GroupementListItem[]> {
  const myGroupementIds = db
    .select({ id: groupementMembers.groupementId })
    .from(groupementMembers)
    .where(
      and(
        eq(groupementMembers.contractorId, contractorId),
        inArray(groupementMembers.status, ["invited", "confirmed"])
      )
    );

  const rows = await db
    .select({
      groupement: groupements,
      tenderTitle: tenders.title,
      tenderRegion: tenders.region,
      submissionDeadline: tenders.submissionDeadline,
      memberCount: sql<number>`(
        SELECT count(*)::int FROM ${groupementMembers} gm
        WHERE gm.groupement_id = ${groupements.id}
          AND gm.status IN ('invited', 'confirmed')
      )`,
    })
    .from(groupements)
    .innerJoin(tenders, eq(groupements.tenderId, tenders.id))
    .where(inArray(groupements.id, myGroupementIds))
    .orderBy(desc(groupements.updatedAt));

  return rows.map((r) => ({
    ...r.groupement,
    tenderTitle: r.tenderTitle,
    tenderRegion: r.tenderRegion,
    submissionDeadline: r.submissionDeadline,
    memberCount: r.memberCount,
  }));
}

export async function getGroupementMembers(
  db: DB,
  groupementId: string
): Promise<GroupementMemberWithContractor[]> {
  const rows = await db
    .select({
      member: groupementMembers,
      companyName: contractorProfiles.companyName,
      complianceScore: contractorProfiles.complianceScore,
      fnbtpCategory: contractorProfiles.fnbtpCategory,
    })
    .from(groupementMembers)
    .innerJoin(contractorProfiles, eq(groupementMembers.contractorId, contractorProfiles.id))
    .where(eq(groupementMembers.groupementId, groupementId))
    .orderBy(desc(groupementMembers.role)); // mandataire sorts before cotraitant

  return rows.map((r) => ({
    ...r.member,
    companyName: r.companyName,
    complianceScore: r.complianceScore,
    fnbtpCategory: r.fnbtpCategory,
  }));
}

// Full workspace view: groupement + tender + enriched members.
export async function getGroupementDetail(
  db: DB,
  groupementId: string
): Promise<GroupementDetail | undefined> {
  const [row] = await db
    .select({
      groupement: groupements,
      tenderTitle: tenders.title,
      tenderRegion: tenders.region,
      submissionDeadline: tenders.submissionDeadline,
    })
    .from(groupements)
    .innerJoin(tenders, eq(groupements.tenderId, tenders.id))
    .where(eq(groupements.id, groupementId))
    .limit(1);

  if (!row) return undefined;

  const members = await getGroupementMembers(db, groupementId);
  return {
    groupement: row.groupement,
    tenderTitle: row.tenderTitle,
    tenderRegion: row.tenderRegion,
    submissionDeadline: row.submissionDeadline,
    members,
  };
}
