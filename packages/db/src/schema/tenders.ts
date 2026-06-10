import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const tenderTypeEnum = pgEnum("tender_type", [
  "travaux",
  "fournitures",
  "services",
  "conception_realisation",
]);

export const tenderStatusEnum = pgEnum("tender_status", [
  "open",
  "closing_soon",
  "closed",
  "awarded",
  "cancelled",
]);

export const maitreDOuvrageTypeEnum = pgEnum("maitre_d_ouvrage_type", [
  "commune",
  "ministere",
  "etablissement_public",
  "prive",
]);

export const tenders = pgTable(
  "tenders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull().unique(), // marchespublics.gov.ma dedup key
    title: text("title").notNull(),
    maitreDOuvrage: text("maitre_d_ouvrage").notNull(),
    maitreDOuvrageType: maitreDOuvrageTypeEnum("maitre_d_ouvrage_type").notNull(),
    type: tenderTypeEnum("type").notNull(),
    region: text("region").notNull(),
    estimatedBudgetMinCentimes: bigint("estimated_budget_min_centimes", { mode: "number" }),
    estimatedBudgetMaxCentimes: bigint("estimated_budget_max_centimes", { mode: "number" }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    submissionDeadline: timestamp("submission_deadline", { withTimezone: true }).notNull(),
    openingDate: timestamp("opening_date", { withTimezone: true }),
    requiredSpecialties: jsonb("required_specialties").$type<string[]>().notNull().default([]),
    requiredFnbtpCategory: text("required_fnbtp_category"),
    description: text("description"),
    dossierUrl: text("dossier_url"),
    status: tenderStatusEnum("status").notNull().default("open"),
    searchVector: text("search_vector"), // updated by DB trigger
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tenders_status_deadline_idx").on(t.status, t.submissionDeadline),
    index("tenders_region_idx").on(t.region),
    index("tenders_type_idx").on(t.type),
    index("tenders_published_at_idx").on(t.publishedAt),
    index("tenders_search_idx").using(
      "gin",
      sql`to_tsvector('french', ${t.title} || ' ' || coalesce(${t.description}, ''))`
    ),
  ]
);

export const tenderLots = pgTable("tender_lots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id")
    .notNull()
    .references(() => tenders.id, { onDelete: "cascade" }),
  lotNumber: integer("lot_number").notNull(),
  lotTitle: text("lot_title").notNull(),
  estimatedBudgetCentimes: bigint("estimated_budget_centimes", { mode: "number" }),
  requiredSpecialties: jsonb("required_specialties").$type<string[]>().notNull().default([]),
  description: text("description"),
});

export const tendersRelations = relations(tenders, ({ many }) => ({
  lots: many(tenderLots),
}));

export const tenderLotsRelations = relations(tenderLots, ({ one }) => ({
  tender: one(tenders, { fields: [tenderLots.tenderId], references: [tenders.id] }),
}));
