import { z } from "zod";

const tradeSpecialtyEnum = z.enum([
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

export const tenderFiltersSchema = z.object({
  specialties: z.array(tradeSpecialtyEnum).optional(),
  regions: z.array(z.string()).optional(),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  types: z
    .array(z.enum(["travaux", "fournitures", "services", "conception_realisation"]))
    .optional(),
  maitreDOuvrageTypes: z
    .array(z.enum(["commune", "ministere", "etablissement_public", "prive"]))
    .optional(),
  deadlineWithinDays: z.number().int().positive().max(365).optional(),
  fnbtpCategory: z.enum(["premiere", "deuxieme", "troisieme", "non_qualifie"]).optional(),
  status: z.array(z.enum(["open", "closing_soon", "closed", "awarded", "cancelled"])).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
});

export const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: tenderFiltersSchema.omit({ page: true, perPage: true }),
  alertEnabled: z.boolean().default(true),
});

export type TenderFiltersInput = z.infer<typeof tenderFiltersSchema>;
export type SavedSearchInput = z.infer<typeof savedSearchSchema>;
