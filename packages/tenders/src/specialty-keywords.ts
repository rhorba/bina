import type { TradeSpecialty } from "@bina/core";

// Keyword → specialty mapping for tender titles/descriptions from
// marchespublics.gov.ma. Keywords are matched accent-insensitively on
// normalized text. Order matters only for readability — all matches are kept.
const SPECIALTY_KEYWORDS: Record<Exclude<TradeSpecialty, "other">, string[]> = {
  genie_civil: ["genie civil", "terrassement", "ouvrage d'art", "ouvrages d'art", "fondations"],
  batiment: ["construction", "gros oeuvre", "batiment", "edifice", "rehabilitation"],
  second_oeuvre: ["second oeuvre", "amenagement", "finition", "faux plafond", "platrerie"],
  plomberie: ["plomberie", "sanitaire", "tuyauterie"],
  electricite: [
    "electricite",
    "electrique",
    "courants forts",
    "eclairage public",
    "moyenne tension",
    "basse tension",
  ],
  courants_faibles: [
    "courants faibles",
    "reseau informatique",
    "videosurveillance",
    "telephonie",
    "fibre optique",
  ],
  hvac: ["climatisation", "ventilation", "chauffage", "cvc", "froid"],
  charpente: ["charpente", "menuiserie", "ebenisterie"],
  peinture: ["peinture", "revetement", "etancheite", "carrelage"],
  architecture: ["architecte", "architectural", "maitrise d'oeuvre architecturale"],
  bureau_etudes: [
    "etude technique",
    "etudes techniques",
    "bureau d'etudes",
    "assistance technique",
    "controle technique",
    "suivi des travaux",
  ],
  routes: ["voirie", "vrd", "route", "routier", "chaussee", "asphalte", "signalisation"],
  hydraulique: [
    "assainissement",
    "eau potable",
    "hydraulique",
    "adduction",
    "forage",
    "irrigation",
    "station d'epuration",
  ],
  equipment_supplier: [
    "fourniture de materiaux",
    "fourniture et pose",
    "acquisition de materiel",
    "equipements",
  ],
};

// Lowercase + strip accents so "Électricité" matches "electricite".
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function inferSpecialties(text: string): TradeSpecialty[] {
  const normalized = normalizeText(text);
  const matches: TradeSpecialty[] = [];
  for (const [specialty, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      matches.push(specialty as TradeSpecialty);
    }
  }
  return matches.length > 0 ? matches : ["other"];
}
