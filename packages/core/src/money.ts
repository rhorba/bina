import type { Money } from "./types.js";

// Convert MAD (float) to centimes (integer). Use only at system boundaries.
export function madToCentimes(mad: number): Money {
  return Math.round(mad * 100);
}

// Convert centimes to MAD float for display only.
export function centimesToMad(centimes: Money): number {
  return centimes / 100;
}

// Format centimes as a human-readable MAD string.
export function formatMAD(centimes: Money, locale: "fr" | "ar" = "fr"): string {
  const mad = centimesToMad(centimes);
  return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(mad);
}

// Format budget range for display.
export function formatBudgetRange(min?: Money, max?: Money, locale: "fr" | "ar" = "fr"): string {
  if (min !== undefined && max !== undefined) {
    return `${formatMAD(min, locale)} – ${formatMAD(max, locale)}`;
  }
  if (min !== undefined) return `≥ ${formatMAD(min, locale)}`;
  if (max !== undefined) return `≤ ${formatMAD(max, locale)}`;
  return locale === "ar" ? "غير محدد" : "Non défini";
}
