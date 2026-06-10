// Core domain types for Bina. Money is always integer centimes (MAD).

export type Money = number; // integer centimes — NEVER a float

export type Role = "contractor" | "admin";

export type TradeSpecialty =
  | "genie_civil"
  | "batiment"
  | "second_oeuvre"
  | "plomberie"
  | "electricite"
  | "courants_faibles"
  | "hvac"
  | "charpente"
  | "peinture"
  | "architecture"
  | "bureau_etudes"
  | "routes"
  | "hydraulique"
  | "equipment_supplier"
  | "other";

export type TenderType = "travaux" | "fournitures" | "services" | "conception_realisation";

export type TenderStatus = "open" | "closing_soon" | "closed" | "awarded" | "cancelled";

export type CompanySize = "micro" | "tpe" | "pme" | "eti";

export type FNBTPCategory = "premiere" | "deuxieme" | "troisieme" | "non_qualifie";

export type MaitreDOuvrageType = "commune" | "ministere" | "etablissement_public" | "prive";

export type DocType =
  | "attestation_fiscale"
  | "quitus_cnss"
  | "assurance_decennale"
  | "rc_pro"
  | "registre_commerce"
  | "statuts"
  | "qualification_fnbtp"
  | "reference_chantier"
  | "other";

export type DocStatus = "valid" | "expiring_soon" | "expired" | "pending_renewal";

export type GroupementStatus =
  | "forming"
  | "formed"
  | "submitting"
  | "submitted"
  | "won"
  | "lost"
  | "withdrawn";

export type GroupementMemberRole = "mandataire" | "cotraitant";

export type GroupementMemberStatus = "invited" | "confirmed" | "declined" | "left";

export type TrackedTenderStatus =
  | "watching"
  | "bidding"
  | "submitted"
  | "won"
  | "lost"
  | "withdrawn";

export type AuditAction = "create" | "update" | "join" | "leave" | "submit" | "upload";

export type TenderFilters = {
  specialties?: TradeSpecialty[];
  regions?: string[];
  budgetMin?: Money;
  budgetMax?: Money;
  types?: TenderType[];
  maitreDOuvrageTypes?: MaitreDOuvrageType[];
  deadlineWithinDays?: number;
  fnbtpCategory?: FNBTPCategory;
  status?: TenderStatus[];
};

export type Session = {
  userId: string;
  role: Role;
  contractorId?: string;
  email: string;
};

// Moroccan regions (12 regions since 2015 regionalization)
export const MOROCCAN_REGIONS = [
  "Tanger-Tétouan-Al Hoceïma",
  "L'Oriental",
  "Fès-Meknès",
  "Rabat-Salé-Kénitra",
  "Béni Mellal-Khénifra",
  "Casablanca-Settat",
  "Marrakech-Safi",
  "Drâa-Tafilalet",
  "Souss-Massa",
  "Guelmim-Oued Noun",
  "Laâyoune-Sakia El Hamra",
  "Dakhla-Oued Ed-Dahab",
] as const;

export type MoroccanRegion = (typeof MOROCCAN_REGIONS)[number];

export const TRADE_SPECIALTY_LABELS: Record<TradeSpecialty, { fr: string; ar: string }> = {
  genie_civil: { fr: "Génie civil", ar: "الهندسة المدنية" },
  batiment: { fr: "Bâtiment / Gros œuvre", ar: "البناء / الهيكل الأساسي" },
  second_oeuvre: { fr: "Second œuvre / Finitions", ar: "الأعمال الثانوية / التشطيبات" },
  plomberie: { fr: "Plomberie / Sanitaire", ar: "السباكة / الصحي" },
  electricite: { fr: "Électricité / Courants forts", ar: "الكهرباء / التيارات القوية" },
  courants_faibles: { fr: "Courants faibles / Réseaux", ar: "التيارات الضعيفة / الشبكات" },
  hvac: { fr: "Climatisation / Ventilation", ar: "التكييف / التهوية" },
  charpente: { fr: "Charpente / Menuiserie", ar: "النجارة / الهياكل الخشبية" },
  peinture: { fr: "Peinture / Revêtements", ar: "الدهانات / التغليف" },
  architecture: { fr: "Architecture", ar: "الهندسة المعمارية" },
  bureau_etudes: { fr: "Bureau d'études / Ingénierie", ar: "مكتب الدراسات / الهندسة" },
  routes: { fr: "Routes / VRD", ar: "الطرق / شبكات التوزيع" },
  hydraulique: { fr: "Travaux hydrauliques", ar: "الأشغال الهيدروليكية" },
  equipment_supplier: { fr: "Fournisseur de matériaux", ar: "مورد مواد البناء" },
  other: { fr: "Autre", ar: "أخرى" },
};
