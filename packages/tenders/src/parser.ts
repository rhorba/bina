import type { MaitreDOuvrageType, Money, TenderType } from "@bina/core";
import { madToCentimes } from "@bina/core";
import { inferSpecialties, normalizeText } from "./specialty-keywords.js";
import type { RawTender, ScrapedTenderFields } from "./types.js";

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

// Accepts "15/07/2026", "15/07/2026 10:00" and "15 juillet 2026".
export function parseFrenchDate(input: string): Date | null {
  const trimmed = input.trim();

  const numeric = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2})[:h](\d{2}))?/);
  if (numeric) {
    const [, day, month, year, hour, minute] = numeric;
    const date = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        hour ? Number(hour) : 12,
        minute ? Number(minute) : 0
      )
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const textual = normalizeText(trimmed).match(/^(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/);
  if (textual) {
    const [, day, monthName, year] = textual;
    const month = FRENCH_MONTHS[monthName ?? ""];
    if (month === undefined) return null;
    return new Date(Date.UTC(Number(year), month, Number(day), 12, 0));
  }

  return null;
}

// "2 500 000,00 MAD" / "2.500.000,00 DH" / "2500000" → centimes.
export function parseBudgetMAD(input: string): Money | null {
  const cleaned = input
    .replace(/(mad|dhs?|dirhams?)/gi, "")
    .replace(/[\s ]/g, "") // includes non-breaking spaces
    .trim();
  if (!cleaned) return null;

  // French decimal comma; dots may be thousand separators
  const normalized = cleaned.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value) || value <= 0) return null;
  return madToCentimes(value);
}

// The portal labels procedures like "Appel d'offres ouvert — Travaux".
export function parseTenderType(procedureType: string | undefined, title: string): TenderType {
  const text = normalizeText(`${procedureType ?? ""} ${title}`);
  if (text.includes("conception") && text.includes("realisation")) return "conception_realisation";
  if (text.includes("fourniture") || text.includes("acquisition")) return "fournitures";
  if (
    text.includes("etude") ||
    text.includes("service") ||
    text.includes("gardiennage") ||
    text.includes("nettoyage") ||
    text.includes("maitrise d'oeuvre")
  )
    return "services";
  return "travaux";
}

export function parseMaitreDOuvrageType(maitreDOuvrage: string): MaitreDOuvrageType {
  const text = normalizeText(maitreDOuvrage);
  if (text.includes("commune") || text.includes("ville de") || text.includes("arrondissement"))
    return "commune";
  if (text.includes("ministere") || text.includes("haut commissariat")) return "ministere";
  if (
    text.includes("office") ||
    text.includes("agence") ||
    text.includes("etablissement") ||
    text.includes("universite") ||
    text.includes("societe nationale") ||
    text.includes("onee") ||
    text.includes("oncf")
  )
    return "etablissement_public";
  return "prive";
}

// "Lot n° 2 : Électricité" patterns inside title or description.
const LOT_PATTERN = /lots?\s*n[°o]?\s*(\d+)\s*[:\-–]\s*([^;.\n]+)/gi;

export function detectLots(text: string): { lotNumber: number; lotTitle: string }[] {
  const lots: { lotNumber: number; lotTitle: string }[] = [];
  for (const match of text.matchAll(LOT_PATTERN)) {
    const lotNumber = Number(match[1]);
    const lotTitle = (match[2] ?? "").trim();
    if (lotNumber > 0 && lotTitle && !lots.some((l) => l.lotNumber === lotNumber)) {
      lots.push({ lotNumber, lotTitle });
    }
  }
  return lots;
}

export class TenderParseError extends Error {
  constructor(
    public readonly externalId: string,
    message: string
  ) {
    super(`tender ${externalId}: ${message}`);
    this.name = "TenderParseError";
  }
}

// Normalize raw scraped fields into a RawTender ready for upsert.
export function parseTenderFields(fields: ScrapedTenderFields): RawTender {
  if (!fields.externalId.trim()) throw new TenderParseError("?", "missing externalId");
  if (!fields.title.trim()) throw new TenderParseError(fields.externalId, "missing title");

  const publishedAt = parseFrenchDate(fields.publishedAt);
  if (!publishedAt)
    throw new TenderParseError(fields.externalId, `bad publishedAt: ${fields.publishedAt}`);

  const submissionDeadline = parseFrenchDate(fields.submissionDeadline);
  if (!submissionDeadline)
    throw new TenderParseError(fields.externalId, `bad deadline: ${fields.submissionDeadline}`);

  const openingDate = fields.openingDate
    ? (parseFrenchDate(fields.openingDate) ?? undefined)
    : undefined;
  const budget = fields.estimatedBudget ? parseBudgetMAD(fields.estimatedBudget) : null;

  const fullText = `${fields.title} ${fields.description ?? ""}`;
  const explicitLots = fields.lots ?? [];
  const detectedLots = explicitLots.length > 0 ? [] : detectLots(fullText);

  const lots = [
    ...explicitLots.map((lot) => ({
      lotNumber: lot.lotNumber,
      lotTitle: lot.lotTitle.trim(),
      estimatedBudgetCentimes: lot.estimatedBudget
        ? (parseBudgetMAD(lot.estimatedBudget) ?? undefined)
        : undefined,
      requiredSpecialties: inferSpecialties(lot.lotTitle),
    })),
    ...detectedLots.map((lot) => ({
      lotNumber: lot.lotNumber,
      lotTitle: lot.lotTitle,
      requiredSpecialties: inferSpecialties(lot.lotTitle),
    })),
  ].sort((a, b) => a.lotNumber - b.lotNumber);

  return {
    externalId: fields.externalId.trim(),
    title: fields.title.trim(),
    maitreDOuvrage: fields.maitreDOuvrage.trim(),
    maitreDOuvrageType: parseMaitreDOuvrageType(fields.maitreDOuvrage),
    type: parseTenderType(fields.procedureType, fields.title),
    region: fields.region?.trim() || "Non précisée",
    estimatedBudgetMinCentimes: budget ?? undefined,
    estimatedBudgetMaxCentimes: budget ?? undefined,
    publishedAt,
    submissionDeadline,
    openingDate,
    requiredSpecialties: inferSpecialties(fullText),
    description: fields.description?.trim() || undefined,
    dossierUrl: fields.dossierUrl,
    lots,
  };
}
