// Sprint 5: document vault, expiry tracking, dossier builder
// All compliance docs stored in private R2.
// Signed URLs (15-min expiry). Every access audit-logged.
// Bina NEVER certifies compliance — organises documents only.

export const DOC_EXPIRY_WARNING_DAYS = 15;

export function isExpiringSoon(expiresAt: Date): boolean {
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return daysLeft > 0 && daysLeft <= DOC_EXPIRY_WARNING_DAYS;
}

export function computeComplianceScore(docs: { type: string }[]): number {
  const REQUIRED_DOCS = [
    "attestation_fiscale",
    "quitus_cnss",
    "assurance_decennale",
    "registre_commerce",
    "statuts",
  ];
  const uploaded = new Set(docs.map((d) => d.type));
  const present = REQUIRED_DOCS.filter((t) => uploaded.has(t)).length;
  return Math.round((present / REQUIRED_DOCS.length) * 100);
}

export async function generateSignedUrl(
  _fileKey: string,
  _expiresInSeconds = 900
): Promise<string> {
  throw new Error("R2 signed URL not implemented — Sprint 5");
}
