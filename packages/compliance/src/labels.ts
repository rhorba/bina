// FR doc-type labels for server-side contexts that have no request locale
// (the weekly expiry sweep emails default to French, the platform primary).
// The UI uses the next-intl `docType` namespace; this is the worker-side twin.

export const DOC_TYPE_LABELS_FR: Record<string, string> = {
  attestation_fiscale: "Attestation fiscale",
  quitus_cnss: "Quitus CNSS",
  assurance_decennale: "Assurance décennale",
  rc_pro: "RC Pro",
  registre_commerce: "Registre de commerce",
  statuts: "Statuts de société",
  qualification_fnbtp: "Qualification FNBTP",
  reference_chantier: "Référence chantier",
  other: "Document",
};

// Human label for a doc type; falls back to the raw key for unknown types.
export function docTypeLabelFr(type: string): string {
  return DOC_TYPE_LABELS_FR[type] ?? type;
}
