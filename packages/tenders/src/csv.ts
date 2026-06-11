import type { FNBTPCategory, TradeSpecialty } from "@bina/core";
import { inferSpecialties } from "./specialty-keywords.js";
import { parseBudgetMAD, parseFrenchDate, parseMaitreDOuvrageType, parseTenderType } from "./parser.js";
import type { RawTender } from "./types.js";

// CSV fallback import (non-negotiable #10): if the portal changes structure,
// an admin can upload a CSV export. Same RawTender output → same upsert path.
//
// Expected header (semicolon OR comma separated):
// external_id;title;maitre_d_ouvrage;type;region;budget_min_mad;budget_max_mad;
// published_at;submission_deadline;specialties;fnbtp_category;description;dossier_url

export type CsvImportResult = {
  tenders: RawTender[];
  errors: { line: number; message: string }[];
};

const REQUIRED_HEADERS = ["external_id", "title", "maitre_d_ouvrage", "published_at", "submission_deadline"];

const VALID_SPECIALTIES = new Set<string>([
  "genie_civil", "batiment", "second_oeuvre", "plomberie", "electricite",
  "courants_faibles", "hvac", "charpente", "peinture", "architecture",
  "bureau_etudes", "routes", "hydraulique", "equipment_supplier", "other",
]);

const VALID_FNBTP = new Set<string>(["premiere", "deuxieme", "troisieme", "non_qualifie"]);

// Minimal RFC-4180-ish line splitter with quoted-field support.
export function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export function parseTenderCsv(text: string): CsvImportResult {
  const lines = text
    .replace(/^﻿/, "") // strip BOM
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  const errors: CsvImportResult["errors"] = [];
  const result: RawTender[] = [];

  const headerLine = lines[0];
  if (!headerLine) {
    return { tenders: [], errors: [{ line: 0, message: "fichier vide" }] };
  }

  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = splitCsvLine(headerLine, delimiter).map((h) => h.toLowerCase());

  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { tenders: [], errors: [{ line: 1, message: `colonnes manquantes: ${missing.join(", ")}` }] };
  }

  const col = (fields: string[], name: string): string => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (fields[idx] ?? "") : "";
  };

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    if (!line) continue;
    const fields = splitCsvLine(line, delimiter);

    try {
      const externalId = col(fields, "external_id");
      const title = col(fields, "title");
      const maitreDOuvrage = col(fields, "maitre_d_ouvrage");
      if (!externalId || !title || !maitreDOuvrage) {
        throw new Error("external_id, title et maitre_d_ouvrage sont obligatoires");
      }

      const publishedAt = parseFrenchDate(col(fields, "published_at"));
      if (!publishedAt) throw new Error(`date de publication invalide: ${col(fields, "published_at")}`);

      const submissionDeadline = parseFrenchDate(col(fields, "submission_deadline"));
      if (!submissionDeadline)
        throw new Error(`date limite invalide: ${col(fields, "submission_deadline")}`);

      const budgetMin = col(fields, "budget_min_mad")
        ? parseBudgetMAD(col(fields, "budget_min_mad"))
        : null;
      const budgetMax = col(fields, "budget_max_mad")
        ? parseBudgetMAD(col(fields, "budget_max_mad"))
        : null;

      const specialtiesRaw = col(fields, "specialties");
      const explicitSpecialties = specialtiesRaw
        ? specialtiesRaw
            .split(/[|,]/)
            .map((s) => s.trim())
            .filter((s) => VALID_SPECIALTIES.has(s))
        : [];

      const fnbtpRaw = col(fields, "fnbtp_category").toLowerCase();
      const description = col(fields, "description") || undefined;

      result.push({
        externalId,
        title,
        maitreDOuvrage,
        maitreDOuvrageType: parseMaitreDOuvrageType(maitreDOuvrage),
        type: parseTenderType(col(fields, "type"), title),
        region: col(fields, "region") || "Non précisée",
        estimatedBudgetMinCentimes: budgetMin ?? undefined,
        estimatedBudgetMaxCentimes: budgetMax ?? budgetMin ?? undefined,
        publishedAt,
        submissionDeadline,
        requiredSpecialties:
          explicitSpecialties.length > 0
            ? (explicitSpecialties as TradeSpecialty[])
            : inferSpecialties(`${title} ${description ?? ""}`),
        requiredFnbtpCategory: VALID_FNBTP.has(fnbtpRaw) ? (fnbtpRaw as FNBTPCategory) : undefined,
        description,
        dossierUrl: col(fields, "dossier_url") || undefined,
        lots: [],
      });
    } catch (err) {
      errors.push({ line: lineNumber, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { tenders: result, errors };
}
