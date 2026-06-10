import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { contractorProfiles } from "./contractors.js";
import { tenders } from "./tenders.js";

export const trackedTenderStatusEnum = pgEnum("tracked_tender_status", [
  "watching",
  "bidding",
  "submitted",
  "won",
  "lost",
  "withdrawn",
]);

export const trackedTenders = pgTable(
  "tracked_tenders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractorId: uuid("contractor_id")
      .notNull()
      .references(() => contractorProfiles.id, { onDelete: "cascade" }),
    tenderId: uuid("tender_id")
      .notNull()
      .references(() => tenders.id, { onDelete: "cascade" }),
    status: trackedTenderStatusEnum("status").notNull().default("watching"),
    dossierSubmittedAt: timestamp("dossier_submitted_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tracked_tenders_contractor_idx").on(t.contractorId),
    index("tracked_tenders_tender_idx").on(t.tenderId),
  ]
);

export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractorId: uuid("contractor_id")
    .notNull()
    .references(() => contractorProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull().default({}),
  alertEnabled: boolean("alert_enabled").notNull().default(true),
  lastAlertAt: timestamp("last_alert_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trackedTendersRelations = relations(trackedTenders, ({ one }) => ({
  contractor: one(contractorProfiles, {
    fields: [trackedTenders.contractorId],
    references: [contractorProfiles.id],
  }),
  tender: one(tenders, {
    fields: [trackedTenders.tenderId],
    references: [tenders.id],
  }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  contractor: one(contractorProfiles, {
    fields: [savedSearches.contractorId],
    references: [contractorProfiles.id],
  }),
}));
