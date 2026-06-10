import { z } from "zod";
import { MOROCCAN_REGIONS } from "../types.js";

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

const moroccanRegionEnum = z.enum(MOROCCAN_REGIONS);

const fnbtpCategoryEnum = z.enum(["premiere", "deuxieme", "troisieme", "non_qualifie"]);

const companySizeEnum = z.enum(["micro", "tpe", "pme", "eti"]);

export const contractorProfileSchema = z.object({
  companyName: z.string().min(2).max(200),
  ice: z
    .string()
    .regex(/^\d{15}$/, "ICE must be 15 digits")
    .optional(),
  rc: z.string().max(50).optional(),
  specialties: z.array(tradeSpecialtyEnum).min(1, "At least one specialty required"),
  regions: z.array(moroccanRegionEnum).min(1, "At least one region required"),
  companySize: companySizeEnum,
  employeeCount: z.number().int().positive().max(10000).optional(),
  maxContractValueMAD: z.number().int().positive().optional(), // centimes
  fnbtpCategory: fnbtpCategoryEnum.optional(),
  fnbtpNumber: z.string().max(50).optional(),
});

export type ContractorProfileInput = z.infer<typeof contractorProfileSchema>;

export const projectReferenceSchema = z.object({
  title: z.string().min(3).max(200),
  maitreDOuvrage: z.string().min(2).max(200),
  contractValueCentimes: z
    .number()
    .int()
    .positive()
    .max(100_000_000_000) // 1 billion MAD — sanity cap
    .optional(),
  completedAt: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now(), "Completion date cannot be in the future"),
  specialty: tradeSpecialtyEnum,
  description: z.string().max(2000).optional(),
});

export type ProjectReferenceInput = z.infer<typeof projectReferenceSchema>;
