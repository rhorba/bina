import { relations } from "drizzle-orm";
import { bigint, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { contractorProfiles } from "./contractors.js";

export const projectReferences = pgTable("project_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractorId: uuid("contractor_id")
    .notNull()
    .references(() => contractorProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  maitreDOuvrage: text("maitre_d_ouvrage").notNull(),
  contractValueCentimes: bigint("contract_value_centimes", { mode: "number" }),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  specialty: text("specialty").notNull(),
  description: text("description"),
  photoKeys: jsonb("photo_keys").$type<string[]>().notNull().default([]),
  certificateKey: text("certificate_key"), // R2 private key
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectReferencesRelations = relations(projectReferences, ({ one }) => ({
  contractor: one(contractorProfiles, {
    fields: [projectReferences.contractorId],
    references: [contractorProfiles.id],
  }),
}));
