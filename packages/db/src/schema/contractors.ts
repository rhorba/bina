import { relations } from "drizzle-orm";
import {
  bigint,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const companySizeEnum = pgEnum("company_size", ["micro", "tpe", "pme", "eti"]);

export const fnbtpCategoryEnum = pgEnum("fnbtp_category", [
  "premiere",
  "deuxieme",
  "troisieme",
  "non_qualifie",
]);

export const tradeSpecialtyEnum = pgEnum("trade_specialty", [
  "genie_civil",
  "batiment",
  "second_oeuvre",
  "plomberie",
  "electricite",
  "courants_faibles",
  "hvac",
  "charpente",
  "peinture",
  "architecture",
  "bureau_etudes",
  "routes",
  "hydraulique",
  "equipment_supplier",
  "other",
]);

export const contractorProfiles = pgTable("contractor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  ice: text("ice"), // 15-digit ICE number
  rc: text("rc"),
  specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
  regions: jsonb("regions").$type<string[]>().notNull().default([]),
  companySize: companySizeEnum("company_size").notNull().default("tpe"),
  employeeCount: integer("employee_count"),
  maxContractValueCentimes: bigint("max_contract_value_centimes", { mode: "number" }), // MAD centimes
  fnbtpCategory: fnbtpCategoryEnum("fnbtp_category"),
  fnbtpNumber: text("fnbtp_number"),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  completedTenders: integer("completed_tenders").notNull().default(0),
  complianceScore: integer("compliance_score").notNull().default(0), // 0–100
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contractorProfilesRelations = relations(contractorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [contractorProfiles.userId],
    references: [users.id],
  }),
}));
