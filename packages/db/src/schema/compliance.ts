import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { contractorProfiles } from "./contractors.js";

export const docTypeEnum = pgEnum("doc_type", [
  "attestation_fiscale",
  "quitus_cnss",
  "assurance_decennale",
  "rc_pro",
  "registre_commerce",
  "statuts",
  "qualification_fnbtp",
  "reference_chantier",
  "other",
]);

export const docStatusEnum = pgEnum("doc_status", [
  "valid",
  "expiring_soon",
  "expired",
  "pending_renewal",
]);

export const complianceDocuments = pgTable("compliance_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractorId: uuid("contractor_id")
    .notNull()
    .references(() => contractorProfiles.id, { onDelete: "cascade" }),
  type: docTypeEnum("type").notNull(),
  fileKey: text("file_key").notNull(), // R2 private bucket key
  fileName: text("file_name").notNull(),
  fileSizeBytes: text("file_size_bytes"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: docStatusEnum("status").notNull().default("valid"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const complianceDocumentsRelations = relations(complianceDocuments, ({ one }) => ({
  contractor: one(contractorProfiles, {
    fields: [complianceDocuments.contractorId],
    references: [contractorProfiles.id],
  }),
}));
