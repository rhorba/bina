import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { contractorProfiles } from "./contractors.js";
import { tenderLots, tenders } from "./tenders.js";

export const groupementStatusEnum = pgEnum("groupement_status", [
  "forming",
  "formed",
  "submitting",
  "submitted",
  "won",
  "lost",
  "withdrawn",
]);

export const groupementMemberRoleEnum = pgEnum("groupement_member_role", [
  "mandataire",
  "cotraitant",
]);

export const groupementMemberStatusEnum = pgEnum("groupement_member_status", [
  "invited",
  "confirmed",
  "declined",
  "left",
]);

export const groupements = pgTable("groupements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id")
    .notNull()
    .references(() => tenders.id, { onDelete: "restrict" }),
  lotId: uuid("lot_id").references(() => tenderLots.id, { onDelete: "set null" }),
  initiatorId: uuid("initiator_id")
    .notNull()
    .references(() => contractorProfiles.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  targetBudgetCentimes: bigint("target_budget_centimes", { mode: "number" }),
  status: groupementStatusEnum("status").notNull().default("forming"),
  neededSpecialties: jsonb("needed_specialties").$type<string[]>().notNull().default([]),
  workspaceNotes: text("workspace_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupementMembers = pgTable(
  "groupement_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupementId: uuid("groupement_id")
      .notNull()
      .references(() => groupements.id, { onDelete: "cascade" }),
    contractorId: uuid("contractor_id")
      .notNull()
      .references(() => contractorProfiles.id, { onDelete: "restrict" }),
    specialty: text("specialty").notNull(),
    estimatedShareCentimes: bigint("estimated_share_centimes", { mode: "number" }),
    role: groupementMemberRoleEnum("role").notNull(),
    status: groupementMemberStatusEnum("status").notNull().default("invited"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Moroccan procurement law (Décret 2-12-349): only ONE active mandataire
    // per groupement. Partial index so a mandataire who declined/left can be replaced.
    uniqueIndex("one_mandataire_per_groupement")
      .on(t.groupementId)
      .where(sql`${t.role} = 'mandataire' AND ${t.status} IN ('invited', 'confirmed')`),
    index("groupement_members_groupement_idx").on(t.groupementId),
    index("groupement_members_contractor_idx").on(t.contractorId),
  ]
);

export const groupementsRelations = relations(groupements, ({ one, many }) => ({
  tender: one(tenders, { fields: [groupements.tenderId], references: [tenders.id] }),
  lot: one(tenderLots, { fields: [groupements.lotId], references: [tenderLots.id] }),
  initiator: one(contractorProfiles, {
    fields: [groupements.initiatorId],
    references: [contractorProfiles.id],
  }),
  members: many(groupementMembers),
}));

export const groupementMembersRelations = relations(groupementMembers, ({ one }) => ({
  groupement: one(groupements, {
    fields: [groupementMembers.groupementId],
    references: [groupements.id],
  }),
  contractor: one(contractorProfiles, {
    fields: [groupementMembers.contractorId],
    references: [contractorProfiles.id],
  }),
}));
