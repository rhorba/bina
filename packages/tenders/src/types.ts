import type {
  FNBTPCategory,
  MaitreDOuvrageType,
  Money,
  TenderType,
  TradeSpecialty,
} from "@bina/core";

// Normalized tender produced by the scraper parser OR the CSV fallback import.
// Both paths feed the same upsertTender() — the portal-format knowledge stays here.

export type RawTenderLot = {
  lotNumber: number;
  lotTitle: string;
  estimatedBudgetCentimes?: Money;
  requiredSpecialties: TradeSpecialty[];
  description?: string;
};

export type RawTender = {
  externalId: string;
  title: string;
  maitreDOuvrage: string;
  maitreDOuvrageType: MaitreDOuvrageType;
  type: TenderType;
  region: string;
  estimatedBudgetMinCentimes?: Money;
  estimatedBudgetMaxCentimes?: Money;
  publishedAt: Date;
  submissionDeadline: Date;
  openingDate?: Date;
  requiredSpecialties: TradeSpecialty[];
  requiredFnbtpCategory?: FNBTPCategory;
  description?: string;
  dossierUrl?: string;
  lots: RawTenderLot[];
};

// Raw text fields as scraped from a portal tender page, before normalization.
export type ScrapedTenderFields = {
  externalId: string;
  title: string;
  maitreDOuvrage: string;
  procedureType?: string; // e.g. "Appel d'offres ouvert — Travaux"
  region?: string;
  estimatedBudget?: string; // e.g. "2 500 000,00 MAD"
  publishedAt: string; // "15/06/2026" or "15 juin 2026"
  submissionDeadline: string;
  openingDate?: string;
  description?: string;
  dossierUrl?: string;
  lots?: { lotNumber: number; lotTitle: string; estimatedBudget?: string }[];
};
