// Expiry tracking for compliance documents.
// Status ladder: valid → expiring_soon (≤15 days) → expired.
// `pending_renewal` is a user-set flag (the firm declares "I'm renewing this")
// and is preserved as-is by the sweep — it is never auto-computed here.

export type DocStatus = "valid" | "expiring_soon" | "expired" | "pending_renewal";

// 15-day advance warning (Bina rule: deadlines/expiries are the primary signal).
export const DOC_EXPIRY_WARNING_DAYS = 15;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Whole calendar days until expiry. Negative = already expired. `null` when the
// document has no expiry date (e.g. statuts, registre de commerce — perpetual).
export function daysUntilExpiry(
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): number | null {
  if (!expiresAt) return null;
  return Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_DAY);
}

export function isExpired(expiresAt: Date | null | undefined, now: Date = new Date()): boolean {
  const days = daysUntilExpiry(expiresAt, now);
  return days !== null && days <= 0;
}

export function isExpiringSoon(
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  const days = daysUntilExpiry(expiresAt, now);
  return days !== null && days > 0 && days <= DOC_EXPIRY_WARNING_DAYS;
}

// Compute the derived status of a document from its expiry date. A doc the user
// has flagged `pending_renewal` keeps that status (caller passes the current
// stored status as `current`).
export function computeDocStatus(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
  current?: DocStatus
): DocStatus {
  if (current === "pending_renewal") return "pending_renewal";
  if (!expiresAt) return "valid"; // perpetual document
  if (isExpired(expiresAt, now)) return "expired";
  if (isExpiringSoon(expiresAt, now)) return "expiring_soon";
  return "valid";
}

// Documents whose status warrants a 15-day-advance notification.
export function needsExpiryAlert(
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  return isExpiringSoon(expiresAt, now);
}
