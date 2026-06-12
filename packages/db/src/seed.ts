/**
 * Bina demo seed — Sprint 1 (§8 of CLAUDE.md).
 *
 * 8 contractor profiles, 40 realistic tenders, 3 groupements,
 * project references, compliance documents, tracking data.
 *
 * Idempotent: wipes all tables and re-inserts. Dates are relative to
 * "now" so deadline buckets (closing this week / open / closed) stay true.
 *
 * Run: pnpm --filter @bina/db seed
 */
import "./load-env.js";
import argon2 from "argon2";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import {
  auditLogs,
  complianceDocuments,
  contractorProfiles,
  groupementMembers,
  groupements,
  notifications,
  projectReferences,
  savedSearches,
  tenderLots,
  tenders,
  trackedTenders,
  users,
} from "./schema/index.js";

/** MAD → integer centimes. NEVER store floats. */
const MAD = (mad: number) => Math.round(mad * 100);
/** Date offset from now in days (negative = past). */
const days = (n: number) => new Date(Date.now() + n * 86_400_000);
const daysAgo = (n: number) => days(-n);

const PORTAL_URL =
  "https://www.marchespublics.gov.ma/index.php?page=entreprise.EntrepriseDetailsConsultation&refConsultation=";

// Superuser connection: the seed TRUNCATEs tables and bypasses RLS —
// the runtime bina_app role can do neither.
const connectionString =
  process.env["DATABASE_DIRECT_URL"] ??
  process.env["DATABASE_URL"] ??
  "postgresql://bina:bina_dev@localhost:5432/bina";
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log("🌱 Seeding Bina demo data...");

  await db.execute(sql`
    TRUNCATE TABLE
      audit_logs, notifications, tracked_tenders, saved_searches,
      groupement_members, groupements, compliance_documents,
      project_references, tender_lots, tenders,
      contractor_profiles, sessions, accounts, verification_tokens, users
    CASCADE
  `);

  // ---------------------------------------------------------------- users
  const demoHash = await argon2.hash("demo1234", {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
  const adminHash = await argon2.hash("admin1234", {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const userRows = await db
    .insert(users)
    .values([
      {
        email: "hassan.plomberie@demo.bina.ma",
        name: "Hassan Benjelloun",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234501",
        city: "Casablanca",
        region: "Casablanca-Settat",
        emailVerified: true,
        lastLoginAt: daysAgo(1),
      },
      {
        email: "samira.elec@demo.bina.ma",
        name: "Samira El Fassi",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234502",
        city: "Rabat",
        region: "Rabat-Salé-Kénitra",
        emailVerified: true,
        lastLoginAt: daysAgo(3),
      },
      {
        email: "youssef.gc@demo.bina.ma",
        name: "Youssef Tahiri",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234503",
        city: "Tanger",
        region: "Tanger-Tétouan-Al Hoceïma",
        emailVerified: true,
        lastLoginAt: daysAgo(10),
      },
      {
        email: "khadija.finitions@demo.bina.ma",
        name: "Khadija Amrani",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234504",
        city: "Marrakech",
        region: "Marrakech-Safi",
        emailVerified: true,
        lastLoginAt: daysAgo(28),
      },
      {
        email: "omar.archi@demo.bina.ma",
        name: "Omar Berrada",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234505",
        city: "Casablanca",
        region: "Casablanca-Settat",
        emailVerified: true,
        lastLoginAt: daysAgo(2),
      },
      {
        email: "nadia.etudes@demo.bina.ma",
        name: "Nadia Ouazzani",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234506",
        city: "Agadir",
        region: "Souss-Massa",
        emailVerified: true,
      },
      {
        email: "karim.hvac@demo.bina.ma",
        name: "Karim Squalli",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234507",
        city: "Fès",
        region: "Fès-Meknès",
        emailVerified: true,
      },
      {
        email: "rachid.routes@demo.bina.ma",
        name: "Rachid Bouhaddou",
        passwordHash: demoHash,
        role: "contractor" as const,
        phone: "+212661234508",
        city: "Meknès",
        region: "Fès-Meknès",
        emailVerified: true,
      },
      {
        email: "admin@bina.ma",
        name: "Admin Bina",
        passwordHash: adminHash,
        role: "admin" as const,
        emailVerified: true,
        lastLoginAt: daysAgo(0),
      },
    ])
    .returning({ id: users.id, email: users.email });

  const userId = (email: string) => {
    const u = userRows.find((r) => r.email === email);
    if (!u) throw new Error(`seed: user ${email} not found`);
    return u.id;
  };

  // ----------------------------------------------------- contractor profiles
  const profileRows = await db
    .insert(contractorProfiles)
    .values([
      {
        userId: userId("hassan.plomberie@demo.bina.ma"),
        companyName: "Benjelloun Plomberie SARL",
        ice: "001523698745218",
        rc: "RC-CASA-185236",
        specialties: ["plomberie", "second_oeuvre"],
        regions: ["Casablanca-Settat", "Rabat-Salé-Kénitra"],
        companySize: "tpe" as const,
        employeeCount: 18,
        maxContractValueCentimes: MAD(8_000_000),
        fnbtpCategory: "deuxieme" as const,
        fnbtpNumber: "FNBTP-2-04512",
        avgRating: "4.30",
        reviewCount: 12,
        completedTenders: 9,
        complianceScore: 72,
      },
      {
        userId: userId("samira.elec@demo.bina.ma"),
        companyName: "El Fassi Électricité & Réseaux",
        ice: "001874512369852",
        rc: "RC-RABAT-94371",
        specialties: ["electricite", "courants_faibles"],
        regions: ["Rabat-Salé-Kénitra", "Casablanca-Settat"],
        companySize: "pme" as const,
        employeeCount: 64,
        maxContractValueCentimes: MAD(25_000_000),
        fnbtpCategory: "premiere" as const,
        fnbtpNumber: "FNBTP-1-01287",
        avgRating: "4.70",
        reviewCount: 23,
        completedTenders: 17,
        complianceScore: 95,
      },
      {
        userId: userId("youssef.gc@demo.bina.ma"),
        companyName: "Tahiri Génie Civil",
        ice: "002145896325714",
        rc: "RC-TANGER-31528",
        specialties: ["genie_civil", "batiment"],
        regions: ["Tanger-Tétouan-Al Hoceïma", "L'Oriental"],
        companySize: "pme" as const,
        employeeCount: 120,
        maxContractValueCentimes: MAD(60_000_000),
        fnbtpCategory: "premiere" as const,
        fnbtpNumber: "FNBTP-1-00964",
        avgRating: "4.50",
        reviewCount: 19,
        completedTenders: 14,
        complianceScore: 88,
      },
      {
        userId: userId("khadija.finitions@demo.bina.ma"),
        companyName: "Amrani Finitions & Décor",
        ice: "001936574821456",
        rc: "RC-MARRAKECH-77140",
        specialties: ["second_oeuvre", "peinture"],
        regions: ["Marrakech-Safi"],
        companySize: "tpe" as const,
        employeeCount: 11,
        maxContractValueCentimes: MAD(3_500_000),
        fnbtpCategory: "troisieme" as const,
        fnbtpNumber: "FNBTP-3-08823",
        avgRating: "4.10",
        reviewCount: 7,
        completedTenders: 5,
        complianceScore: 55,
      },
      {
        userId: userId("omar.archi@demo.bina.ma"),
        companyName: "Atelier Berrada Architecture",
        ice: "002587413698521",
        rc: "RC-CASA-203314",
        specialties: ["architecture"],
        regions: ["Casablanca-Settat", "Marrakech-Safi", "Rabat-Salé-Kénitra"],
        companySize: "micro" as const,
        employeeCount: 6,
        maxContractValueCentimes: MAD(2_000_000),
        avgRating: "4.80",
        reviewCount: 15,
        completedTenders: 11,
        complianceScore: 81,
      },
      {
        userId: userId("nadia.etudes@demo.bina.ma"),
        companyName: "Ouazzani Ingénierie (BET)",
        ice: "001478523697415",
        rc: "RC-AGADIR-45209",
        specialties: ["bureau_etudes", "hydraulique"],
        regions: ["Souss-Massa", "Guelmim-Oued Noun", "Marrakech-Safi"],
        companySize: "tpe" as const,
        employeeCount: 14,
        maxContractValueCentimes: MAD(5_000_000),
        avgRating: "4.60",
        reviewCount: 10,
        completedTenders: 8,
        complianceScore: 90,
      },
      {
        userId: userId("karim.hvac@demo.bina.ma"),
        companyName: "Squalli Climatisation",
        ice: "002698541237854",
        rc: "RC-FES-61832",
        specialties: ["hvac"],
        regions: ["Fès-Meknès", "Rabat-Salé-Kénitra"],
        companySize: "tpe" as const,
        employeeCount: 22,
        maxContractValueCentimes: MAD(10_000_000),
        fnbtpCategory: "deuxieme" as const,
        fnbtpNumber: "FNBTP-2-05741",
        avgRating: "3.90",
        reviewCount: 5,
        completedTenders: 4,
        complianceScore: 40,
      },
      {
        userId: userId("rachid.routes@demo.bina.ma"),
        companyName: "Bouhaddou Travaux Routiers",
        ice: "001596328741259",
        rc: "RC-MEKNES-28475",
        specialties: ["routes", "genie_civil"],
        regions: ["Fès-Meknès", "Béni Mellal-Khénifra", "Drâa-Tafilalet"],
        companySize: "pme" as const,
        employeeCount: 85,
        maxContractValueCentimes: MAD(40_000_000),
        fnbtpCategory: "premiere" as const,
        fnbtpNumber: "FNBTP-1-01573",
        avgRating: "4.40",
        reviewCount: 16,
        completedTenders: 12,
        complianceScore: 78,
      },
    ])
    .returning({ id: contractorProfiles.id, companyName: contractorProfiles.companyName });

  const [hassan, samira, youssef, khadija, omar, nadia, karim, rachid] = profileRows.map(
    (p) => p.id
  );

  // ------------------------------------------------------ compliance documents
  await db.insert(complianceDocuments).values([
    // Hassan — 72%: solid core docs, CNSS expiring soon, no FNBTP cert uploaded
    {
      contractorId: hassan,
      type: "attestation_fiscale",
      fileKey: "demo/hassan/attestation-fiscale.pdf",
      fileName: "attestation_fiscale_2026.pdf",
      issuedAt: days(-320),
      expiresAt: days(45),
      status: "valid",
    },
    {
      contractorId: hassan,
      type: "quitus_cnss",
      fileKey: "demo/hassan/quitus-cnss.pdf",
      fileName: "quitus_cnss_T1_2026.pdf",
      issuedAt: days(-78),
      expiresAt: days(12),
      status: "expiring_soon",
    },
    {
      contractorId: hassan,
      type: "assurance_decennale",
      fileKey: "demo/hassan/decennale.pdf",
      fileName: "assurance_decennale_2026.pdf",
      issuedAt: days(-160),
      expiresAt: days(205),
      status: "valid",
    },
    {
      contractorId: hassan,
      type: "registre_commerce",
      fileKey: "demo/hassan/rc.pdf",
      fileName: "registre_commerce.pdf",
      issuedAt: days(-900),
      status: "valid",
    },
    {
      contractorId: hassan,
      type: "statuts",
      fileKey: "demo/hassan/statuts.pdf",
      fileName: "statuts_sarl.pdf",
      issuedAt: days(-1800),
      status: "valid",
    },
    // Samira — 95%: everything valid
    {
      contractorId: samira,
      type: "attestation_fiscale",
      fileKey: "demo/samira/attestation-fiscale.pdf",
      fileName: "attestation_fiscale_2026.pdf",
      issuedAt: days(-60),
      expiresAt: days(305),
      status: "valid",
    },
    {
      contractorId: samira,
      type: "quitus_cnss",
      fileKey: "demo/samira/quitus-cnss.pdf",
      fileName: "quitus_cnss_T2_2026.pdf",
      issuedAt: days(-20),
      expiresAt: days(70),
      status: "valid",
    },
    {
      contractorId: samira,
      type: "assurance_decennale",
      fileKey: "demo/samira/decennale.pdf",
      fileName: "assurance_decennale_2026.pdf",
      issuedAt: days(-100),
      expiresAt: days(265),
      status: "valid",
    },
    {
      contractorId: samira,
      type: "rc_pro",
      fileKey: "demo/samira/rc-pro.pdf",
      fileName: "rc_pro_2026.pdf",
      issuedAt: days(-100),
      expiresAt: days(265),
      status: "valid",
    },
    {
      contractorId: samira,
      type: "registre_commerce",
      fileKey: "demo/samira/rc.pdf",
      fileName: "registre_commerce.pdf",
      issuedAt: days(-1500),
      status: "valid",
    },
    {
      contractorId: samira,
      type: "statuts",
      fileKey: "demo/samira/statuts.pdf",
      fileName: "statuts.pdf",
      issuedAt: days(-2400),
      status: "valid",
    },
    {
      contractorId: samira,
      type: "qualification_fnbtp",
      fileKey: "demo/samira/fnbtp.pdf",
      fileName: "qualification_fnbtp_cat1.pdf",
      issuedAt: days(-400),
      expiresAt: days(330),
      status: "valid",
    },
    // Youssef — 88%
    {
      contractorId: youssef,
      type: "attestation_fiscale",
      fileKey: "demo/youssef/attestation-fiscale.pdf",
      fileName: "attestation_fiscale_2026.pdf",
      issuedAt: days(-90),
      expiresAt: days(275),
      status: "valid",
    },
    {
      contractorId: youssef,
      type: "quitus_cnss",
      fileKey: "demo/youssef/quitus-cnss.pdf",
      fileName: "quitus_cnss_2026.pdf",
      issuedAt: days(-30),
      expiresAt: days(60),
      status: "valid",
    },
    {
      contractorId: youssef,
      type: "assurance_decennale",
      fileKey: "demo/youssef/decennale.pdf",
      fileName: "decennale_2026.pdf",
      issuedAt: days(-200),
      expiresAt: days(165),
      status: "valid",
    },
    {
      contractorId: youssef,
      type: "registre_commerce",
      fileKey: "demo/youssef/rc.pdf",
      fileName: "rc.pdf",
      issuedAt: days(-2000),
      status: "valid",
    },
    {
      contractorId: youssef,
      type: "qualification_fnbtp",
      fileKey: "demo/youssef/fnbtp.pdf",
      fileName: "fnbtp_cat1.pdf",
      issuedAt: days(-500),
      expiresAt: days(230),
      status: "valid",
    },
    // Khadija — 55%: fiscale expired
    {
      contractorId: khadija,
      type: "attestation_fiscale",
      fileKey: "demo/khadija/attestation-fiscale.pdf",
      fileName: "attestation_fiscale_2025.pdf",
      issuedAt: days(-420),
      expiresAt: days(-55),
      status: "expired",
    },
    {
      contractorId: khadija,
      type: "quitus_cnss",
      fileKey: "demo/khadija/quitus-cnss.pdf",
      fileName: "quitus_cnss_2026.pdf",
      issuedAt: days(-40),
      expiresAt: days(50),
      status: "valid",
    },
    {
      contractorId: khadija,
      type: "registre_commerce",
      fileKey: "demo/khadija/rc.pdf",
      fileName: "rc.pdf",
      issuedAt: days(-1100),
      status: "valid",
    },
    // Omar — 81%
    {
      contractorId: omar,
      type: "attestation_fiscale",
      fileKey: "demo/omar/attestation-fiscale.pdf",
      fileName: "attestation_fiscale_2026.pdf",
      issuedAt: days(-150),
      expiresAt: days(215),
      status: "valid",
    },
    {
      contractorId: omar,
      type: "quitus_cnss",
      fileKey: "demo/omar/quitus-cnss.pdf",
      fileName: "quitus_cnss_2026.pdf",
      issuedAt: days(-25),
      expiresAt: days(65),
      status: "valid",
    },
    {
      contractorId: omar,
      type: "rc_pro",
      fileKey: "demo/omar/rc-pro.pdf",
      fileName: "rc_pro_2026.pdf",
      issuedAt: days(-180),
      expiresAt: days(185),
      status: "valid",
    },
    {
      contractorId: omar,
      type: "registre_commerce",
      fileKey: "demo/omar/rc.pdf",
      fileName: "rc.pdf",
      issuedAt: days(-2600),
      status: "valid",
    },
    // Nadia — 90%
    {
      contractorId: nadia,
      type: "attestation_fiscale",
      fileKey: "demo/nadia/attestation-fiscale.pdf",
      fileName: "attestation_fiscale_2026.pdf",
      issuedAt: days(-70),
      expiresAt: days(295),
      status: "valid",
    },
    {
      contractorId: nadia,
      type: "quitus_cnss",
      fileKey: "demo/nadia/quitus-cnss.pdf",
      fileName: "quitus_cnss_2026.pdf",
      issuedAt: days(-15),
      expiresAt: days(75),
      status: "valid",
    },
    {
      contractorId: nadia,
      type: "rc_pro",
      fileKey: "demo/nadia/rc-pro.pdf",
      fileName: "rc_pro_2026.pdf",
      issuedAt: days(-120),
      expiresAt: days(245),
      status: "valid",
    },
    {
      contractorId: nadia,
      type: "registre_commerce",
      fileKey: "demo/nadia/rc.pdf",
      fileName: "rc.pdf",
      issuedAt: days(-1700),
      status: "valid",
    },
    {
      contractorId: nadia,
      type: "statuts",
      fileKey: "demo/nadia/statuts.pdf",
      fileName: "statuts.pdf",
      issuedAt: days(-1700),
      status: "valid",
    },
    // Karim — 40%: minimal, CNSS expired
    {
      contractorId: karim,
      type: "quitus_cnss",
      fileKey: "demo/karim/quitus-cnss.pdf",
      fileName: "quitus_cnss_2025.pdf",
      issuedAt: days(-300),
      expiresAt: days(-120),
      status: "expired",
    },
    {
      contractorId: karim,
      type: "registre_commerce",
      fileKey: "demo/karim/rc.pdf",
      fileName: "rc.pdf",
      issuedAt: days(-1300),
      status: "valid",
    },
    // Rachid — 78%
    {
      contractorId: rachid,
      type: "attestation_fiscale",
      fileKey: "demo/rachid/attestation-fiscale.pdf",
      fileName: "attestation_fiscale_2026.pdf",
      issuedAt: days(-110),
      expiresAt: days(255),
      status: "valid",
    },
    {
      contractorId: rachid,
      type: "quitus_cnss",
      fileKey: "demo/rachid/quitus-cnss.pdf",
      fileName: "quitus_cnss_2026.pdf",
      issuedAt: days(-35),
      expiresAt: days(55),
      status: "valid",
    },
    {
      contractorId: rachid,
      type: "assurance_decennale",
      fileKey: "demo/rachid/decennale.pdf",
      fileName: "decennale_2026.pdf",
      issuedAt: days(-250),
      expiresAt: days(115),
      status: "valid",
    },
    {
      contractorId: rachid,
      type: "qualification_fnbtp",
      fileKey: "demo/rachid/fnbtp.pdf",
      fileName: "fnbtp_cat1.pdf",
      issuedAt: days(-600),
      expiresAt: days(130),
      status: "valid",
    },
  ]);

  // -------------------------------------------------------- project references
  await db.insert(projectReferences).values([
    {
      contractorId: hassan,
      title: "Réseau sanitaire — Résidence Al Manar (120 logements)",
      maitreDOuvrage: "Promoteur Al Manar Immobilier",
      contractValueCentimes: MAD(2_400_000),
      completedAt: days(-260),
      specialty: "plomberie",
      description: "Plomberie complète et sanitaires de 120 logements sur 6 immeubles.",
      photoKeys: ["demo/refs/hassan-almanar-1.jpg"],
    },
    {
      contractorId: hassan,
      title: "Rénovation sanitaire — Lycée Mohammed V, Casablanca",
      maitreDOuvrage: "AREF Casablanca-Settat",
      contractValueCentimes: MAD(850_000),
      completedAt: days(-540),
      specialty: "plomberie",
      description: "Remplacement complet des blocs sanitaires (14 blocs).",
      photoKeys: [],
      certificateKey: "demo/refs/hassan-lycee-cert.pdf",
    },
    {
      contractorId: hassan,
      title: "Lot plomberie — Centre commercial Marina Shopping",
      maitreDOuvrage: "Marina Développement SA",
      contractValueCentimes: MAD(4_100_000),
      completedAt: days(-820),
      specialty: "plomberie",
      description: "Lot plomberie/protection incendie, surface 18 000 m².",
      photoKeys: ["demo/refs/hassan-marina-1.jpg", "demo/refs/hassan-marina-2.jpg"],
    },
    {
      contractorId: samira,
      title: "Électrification — Gare routière de Salé",
      maitreDOuvrage: "Commune de Salé",
      contractValueCentimes: MAD(6_700_000),
      completedAt: days(-310),
      specialty: "electricite",
      description: "Courants forts + éclairage public du site, poste de transformation.",
      photoKeys: ["demo/refs/samira-gare-1.jpg"],
      certificateKey: "demo/refs/samira-gare-cert.pdf",
    },
    {
      contractorId: samira,
      title: "Courants faibles — Siège régional Bank Al-Maghrib Rabat",
      maitreDOuvrage: "Bank Al-Maghrib",
      contractValueCentimes: MAD(3_900_000),
      completedAt: days(-650),
      specialty: "courants_faibles",
      description: "Réseaux informatiques, contrôle d'accès, vidéosurveillance.",
      photoKeys: [],
    },
    {
      contractorId: youssef,
      title: "Gros œuvre — École supérieure de technologie, Tanger",
      maitreDOuvrage: "Université Abdelmalek Essaâdi",
      contractValueCentimes: MAD(28_500_000),
      completedAt: days(-400),
      specialty: "genie_civil",
      description: "Terrassement + gros œuvre de 3 bâtiments R+4.",
      photoKeys: ["demo/refs/youssef-est-1.jpg"],
      certificateKey: "demo/refs/youssef-est-cert.pdf",
    },
    {
      contractorId: youssef,
      title: "Ouvrages d'art — Rocade portuaire Tanger Med",
      maitreDOuvrage: "TMSA",
      contractValueCentimes: MAD(45_000_000),
      completedAt: days(-980),
      specialty: "genie_civil",
      description: "2 passages supérieurs + murs de soutènement.",
      photoKeys: ["demo/refs/youssef-tmed-1.jpg"],
    },
    {
      contractorId: khadija,
      title: "Peinture & revêtements — Hôtel Atlas Médina (180 chambres)",
      maitreDOuvrage: "Groupe Atlas Hospitality",
      contractValueCentimes: MAD(1_650_000),
      completedAt: days(-220),
      specialty: "peinture",
      description: "Peinture décorative, tadelakt et revêtements muraux.",
      photoKeys: ["demo/refs/khadija-atlas-1.jpg"],
    },
    {
      contractorId: khadija,
      title: "Second œuvre — Centre culturel Les Kasbahs, Marrakech",
      maitreDOuvrage: "Commune de Marrakech",
      contractValueCentimes: MAD(2_900_000),
      completedAt: days(-590),
      specialty: "second_oeuvre",
      description: "Faux plafonds, menuiserie intérieure, peinture.",
      photoKeys: [],
      certificateKey: "demo/refs/khadija-kasbahs-cert.pdf",
    },
    {
      contractorId: omar,
      title: "Conception — Groupe scolaire privé Les Oliviers",
      maitreDOuvrage: "Fondation Les Oliviers",
      contractValueCentimes: MAD(950_000),
      completedAt: days(-350),
      specialty: "architecture",
      description: "Conception architecturale + suivi de chantier, 4 200 m².",
      photoKeys: ["demo/refs/omar-oliviers-1.jpg"],
    },
    {
      contractorId: omar,
      title: "Réhabilitation — Immeuble art déco, boulevard Mohammed V",
      maitreDOuvrage: "Casa Patrimoine",
      contractValueCentimes: MAD(1_200_000),
      completedAt: days(-700),
      specialty: "architecture",
      description: "Études de réhabilitation d'un immeuble classé.",
      photoKeys: ["demo/refs/omar-artdeco-1.jpg"],
    },
    {
      contractorId: nadia,
      title: "Études — Station de traitement des eaux, Taroudant",
      maitreDOuvrage: "ONEE — Branche Eau",
      contractValueCentimes: MAD(1_800_000),
      completedAt: days(-280),
      specialty: "bureau_etudes",
      description: "Études d'exécution et suivi, capacité 12 000 m³/j.",
      photoKeys: [],
      certificateKey: "demo/refs/nadia-step-cert.pdf",
    },
    {
      contractorId: nadia,
      title: "Maîtrise d'œuvre — Périmètre irrigué du Souss aval",
      maitreDOuvrage: "ORMVA Souss-Massa",
      contractValueCentimes: MAD(2_300_000),
      completedAt: days(-620),
      specialty: "hydraulique",
      description: "Études et supervision de la modernisation du réseau d'irrigation.",
      photoKeys: [],
    },
    {
      contractorId: karim,
      title: "CVC — Clinique Al Kawtar, Fès",
      maitreDOuvrage: "Clinique Al Kawtar SA",
      contractValueCentimes: MAD(3_200_000),
      completedAt: days(-330),
      specialty: "hvac",
      description: "Climatisation et traitement d'air (blocs opératoires inclus).",
      photoKeys: ["demo/refs/karim-clinique-1.jpg"],
    },
    {
      contractorId: rachid,
      title: "Dédoublement RP 7037 — Province d'El Hajeb (14 km)",
      maitreDOuvrage: "Direction Provinciale de l'Équipement El Hajeb",
      contractValueCentimes: MAD(32_000_000),
      completedAt: days(-450),
      specialty: "routes",
      description: "Élargissement et renforcement de chaussée sur 14 km.",
      photoKeys: ["demo/refs/rachid-rp7037-1.jpg"],
      certificateKey: "demo/refs/rachid-rp7037-cert.pdf",
    },
    {
      contractorId: rachid,
      title: "Voirie & VRD — Lotissement Riad Meknès",
      maitreDOuvrage: "Al Omrane Meknès",
      contractValueCentimes: MAD(12_500_000),
      completedAt: days(-780),
      specialty: "routes",
      description: "Voirie, assainissement et réseaux divers, 28 ha.",
      photoKeys: [],
    },
  ]);

  // ---------------------------------------------------------------- tenders
  type TenderSeed = typeof tenders.$inferInsert;
  const T = (
    ref: number,
    title: string,
    mo: string,
    moType: TenderSeed["maitreDOuvrageType"],
    type: TenderSeed["type"],
    region: string,
    budgetMinMAD: number | null,
    budgetMaxMAD: number | null,
    publishedDays: number,
    deadlineDays: number,
    specialties: string[],
    status: TenderSeed["status"],
    extra?: Partial<TenderSeed>
  ): TenderSeed => ({
    externalId: `MP-2026-${String(ref).padStart(6, "0")}`,
    title,
    maitreDOuvrage: mo,
    maitreDOuvrageType: moType,
    type,
    region,
    estimatedBudgetMinCentimes: budgetMinMAD === null ? null : MAD(budgetMinMAD),
    estimatedBudgetMaxCentimes: budgetMaxMAD === null ? null : MAD(budgetMaxMAD),
    publishedAt: days(publishedDays),
    submissionDeadline: days(deadlineDays),
    openingDate: days(deadlineDays + 1),
    requiredSpecialties: specialties,
    description: null,
    dossierUrl: `${PORTAL_URL}${700000 + ref}`,
    status,
    scrapedAt: days(-1),
    ...extra,
  });

  const tenderRows = await db
    .insert(tenders)
    .values([
      // ---- 5 closing this week (closing_soon)
      T(
        101,
        "Construction d'un centre de santé de proximité — Témara",
        "Commune de Témara",
        "commune",
        "travaux",
        "Rabat-Salé-Kénitra",
        4_000_000,
        6_000_000,
        -25,
        3,
        ["batiment", "second_oeuvre", "plomberie", "electricite"],
        "closing_soon",
        {
          requiredFnbtpCategory: "deuxieme",
          description:
            "Construction d'un centre de santé de proximité R+1 (1 450 m²) : gros œuvre, second œuvre, lots techniques.",
        }
      ),
      T(
        102,
        "Travaux d'électrification rurale — Province de Taounate (tranche 3)",
        "ONEE — Branche Électricité",
        "etablissement_public",
        "travaux",
        "Fès-Meknès",
        8_000_000,
        12_000_000,
        -30,
        4,
        ["electricite"],
        "closing_soon",
        { requiredFnbtpCategory: "premiere" }
      ),
      T(
        103,
        "Fourniture de matériaux pour terrains d'entraînement CDM 2030 — Casablanca",
        "Ministère de l'Éducation Nationale, du Préscolaire et des Sports",
        "ministere",
        "fournitures",
        "Casablanca-Settat",
        2_000_000,
        3_000_000,
        -20,
        5,
        ["equipment_supplier"],
        "closing_soon"
      ),
      T(
        104,
        "Réhabilitation du réseau d'assainissement — Quartiers Tabriquet et Bettana, Salé",
        "Commune de Salé",
        "commune",
        "travaux",
        "Rabat-Salé-Kénitra",
        15_000_000,
        20_000_000,
        -35,
        6,
        ["hydraulique", "genie_civil"],
        "closing_soon",
        { requiredFnbtpCategory: "premiere" }
      ),
      T(
        105,
        "Études techniques — Ligne BHNS Marrakech (12 km)",
        "Commune de Marrakech",
        "commune",
        "services",
        "Marrakech-Safi",
        1_000_000,
        2_000_000,
        -28,
        6,
        ["bureau_etudes"],
        "closing_soon"
      ),

      // ---- 10 open
      T(
        106,
        "Aménagement du complexe sportif Mohammed V — lots second œuvre et techniques",
        "SONARGES",
        "etablissement_public",
        "travaux",
        "Casablanca-Settat",
        80_000_000,
        150_000_000,
        -10,
        35,
        ["plomberie", "electricite", "hvac", "peinture", "charpente"],
        "open",
        {
          requiredFnbtpCategory: "deuxieme",
          description:
            "Mise à niveau CDM 2030 du complexe Mohammed V : 5 lots séparés (plomberie/sanitaires, électricité, CVC, peinture/revêtements, menuiserie). Les soumissionnaires peuvent candidater par lot. Groupements autorisés (un mandataire requis).",
        }
      ),
      T(
        107,
        "Construction de la gare LGV Kénitra Nord — travaux de bâtiment",
        "ONCF",
        "etablissement_public",
        "travaux",
        "Rabat-Salé-Kénitra",
        60_000_000,
        90_000_000,
        -15,
        40,
        ["batiment", "genie_civil", "charpente"],
        "open",
        { requiredFnbtpCategory: "premiere" }
      ),
      T(
        108,
        "Lot plomberie sanitaire — Extension de l'hôpital provincial de Settat",
        "Ministère de la Santé et de la Protection Sociale",
        "ministere",
        "travaux",
        "Casablanca-Settat",
        3_000_000,
        5_000_000,
        -8,
        25,
        ["plomberie"],
        "open",
        {
          requiredFnbtpCategory: "deuxieme",
          description:
            "Lot n°4 : plomberie, sanitaires et fluides médicaux de l'extension (90 lits).",
        }
      ),
      T(
        109,
        "Construction d'un groupe scolaire à Aïn Aouda (18 classes)",
        "AREF Rabat-Salé-Kénitra",
        "etablissement_public",
        "travaux",
        "Rabat-Salé-Kénitra",
        9_000_000,
        13_000_000,
        -12,
        30,
        ["batiment", "second_oeuvre", "electricite", "plomberie"],
        "open",
        { requiredFnbtpCategory: "deuxieme" }
      ),
      T(
        110,
        "Élargissement de la RN 8 — section Imouzzer-Ifrane (22 km)",
        "Ministère de l'Équipement et de l'Eau",
        "ministere",
        "travaux",
        "Fès-Meknès",
        35_000_000,
        50_000_000,
        -18,
        45,
        ["routes", "genie_civil"],
        "open",
        { requiredFnbtpCategory: "premiere" }
      ),
      T(
        111,
        "CVC et désenfumage — Hôtel 5* Taghazout Bay",
        "Société d'Aménagement Taghazout Bay",
        "prive",
        "travaux",
        "Souss-Massa",
        6_000_000,
        9_000_000,
        -6,
        20,
        ["hvac"],
        "open"
      ),
      T(
        112,
        "Restauration de la mosquée Bab Berdieyinne — Meknès",
        "Ministère des Habous et des Affaires Islamiques",
        "ministere",
        "travaux",
        "Fès-Meknès",
        4_000_000,
        7_000_000,
        -14,
        38,
        ["batiment", "charpente", "peinture"],
        "open"
      ),
      T(
        113,
        "Dragage et maintenance des quais — Port de Tan-Tan",
        "Agence Nationale des Ports",
        "etablissement_public",
        "travaux",
        "Guelmim-Oued Noun",
        18_000_000,
        26_000_000,
        -9,
        42,
        ["genie_civil", "hydraulique"],
        "open",
        { requiredFnbtpCategory: "premiere" }
      ),
      T(
        114,
        "Station de traitement des eaux usées — Ouarzazate (extension)",
        "ONEE — Branche Eau",
        "etablissement_public",
        "travaux",
        "Drâa-Tafilalet",
        22_000_000,
        30_000_000,
        -11,
        50,
        ["hydraulique", "genie_civil", "electricite"],
        "open",
        { requiredFnbtpCategory: "premiere" }
      ),
      T(
        115,
        "Lot électricité — Programme 1 200 logements sociaux Lahraouiyine",
        "Al Omrane Casablanca-Settat",
        "etablissement_public",
        "travaux",
        "Casablanca-Settat",
        7_000_000,
        10_000_000,
        -7,
        28,
        ["electricite"],
        "open",
        { requiredFnbtpCategory: "deuxieme" }
      ),

      // ---- 15 closed with awards (awarded)
      T(
        116,
        "Construction du pont sur l'oued Martil — Tétouan",
        "Ministère de l'Équipement et de l'Eau",
        "ministere",
        "travaux",
        "Tanger-Tétouan-Al Hoceïma",
        40_000_000,
        55_000_000,
        -180,
        -90,
        ["genie_civil"],
        "awarded"
      ),
      T(
        117,
        "Aménagement de la corniche d'Al Hoceïma — phase 2",
        "Commune d'Al Hoceïma",
        "commune",
        "travaux",
        "Tanger-Tétouan-Al Hoceïma",
        12_000_000,
        16_000_000,
        -160,
        -85,
        ["genie_civil", "second_oeuvre"],
        "awarded"
      ),
      T(
        118,
        "Lot CVC — Centre hospitalier universitaire d'Agadir",
        "Ministère de la Santé et de la Protection Sociale",
        "ministere",
        "travaux",
        "Souss-Massa",
        14_000_000,
        18_000_000,
        -200,
        -110,
        ["hvac"],
        "awarded"
      ),
      T(
        119,
        "Éclairage public LED — Ville de Mohammedia",
        "Commune de Mohammedia",
        "commune",
        "travaux",
        "Casablanca-Settat",
        5_000_000,
        8_000_000,
        -150,
        -75,
        ["electricite"],
        "awarded"
      ),
      T(
        120,
        "Construction d'une médiathèque — Oujda",
        "Commune d'Oujda",
        "commune",
        "travaux",
        "L'Oriental",
        8_000_000,
        11_000_000,
        -190,
        -100,
        ["batiment", "second_oeuvre"],
        "awarded"
      ),
      T(
        121,
        "Voirie et VRD — Zone industrielle Aïn Johra",
        "MEDZ",
        "etablissement_public",
        "travaux",
        "Rabat-Salé-Kénitra",
        25_000_000,
        32_000_000,
        -170,
        -95,
        ["routes", "genie_civil"],
        "awarded"
      ),
      T(
        122,
        "Études d'impact — Barrage Sidi Abbou",
        "Ministère de l'Équipement et de l'Eau",
        "ministere",
        "services",
        "Fès-Meknès",
        1_500_000,
        2_500_000,
        -140,
        -70,
        ["bureau_etudes"],
        "awarded"
      ),
      T(
        123,
        "Réhabilitation des abattoirs municipaux — Safi",
        "Commune de Safi",
        "commune",
        "travaux",
        "Marrakech-Safi",
        6_000_000,
        9_000_000,
        -155,
        -80,
        ["batiment", "plomberie", "electricite"],
        "awarded"
      ),
      T(
        124,
        "Fourniture et pose de mobilier urbain — Tanger",
        "Commune de Tanger",
        "commune",
        "fournitures",
        "Tanger-Tétouan-Al Hoceïma",
        2_500_000,
        4_000_000,
        -130,
        -65,
        ["equipment_supplier"],
        "awarded"
      ),
      T(
        125,
        "Lot peinture et revêtements — Palais des congrès de Laâyoune",
        "Conseil Régional Laâyoune-Sakia El Hamra",
        "etablissement_public",
        "travaux",
        "Laâyoune-Sakia El Hamra",
        3_000_000,
        4_500_000,
        -145,
        -72,
        ["peinture", "second_oeuvre"],
        "awarded"
      ),
      T(
        126,
        "Adduction d'eau potable — Douars de la province de Khénifra",
        "ONEE — Branche Eau",
        "etablissement_public",
        "travaux",
        "Béni Mellal-Khénifra",
        16_000_000,
        22_000_000,
        -210,
        -120,
        ["hydraulique"],
        "awarded"
      ),
      T(
        127,
        "Construction d'un marché de gros — Beni Mellal",
        "Commune de Beni Mellal",
        "commune",
        "travaux",
        "Béni Mellal-Khénifra",
        10_000_000,
        14_000_000,
        -175,
        -92,
        ["batiment", "genie_civil"],
        "awarded"
      ),
      T(
        128,
        "Maîtrise d'œuvre — Réaménagement de la place Jemaa el-Fna",
        "Commune de Marrakech",
        "commune",
        "services",
        "Marrakech-Safi",
        800_000,
        1_500_000,
        -165,
        -88,
        ["architecture", "bureau_etudes"],
        "awarded"
      ),
      T(
        129,
        "Lot menuiserie bois — Bibliothèque nationale annexe Rabat",
        "Ministère de la Culture",
        "ministere",
        "travaux",
        "Rabat-Salé-Kénitra",
        2_000_000,
        3_200_000,
        -158,
        -82,
        ["charpente"],
        "awarded"
      ),
      T(
        130,
        "Travaux de protection contre les inondations — Oued Souss",
        "Agence du Bassin Hydraulique Souss-Massa",
        "etablissement_public",
        "travaux",
        "Souss-Massa",
        30_000_000,
        42_000_000,
        -220,
        -130,
        ["hydraulique", "genie_civil"],
        "awarded"
      ),

      // ---- 10 cancelled
      T(
        131,
        "Construction d'une piscine couverte olympique — Kénitra",
        "Commune de Kénitra",
        "commune",
        "travaux",
        "Rabat-Salé-Kénitra",
        20_000_000,
        28_000_000,
        -120,
        -50,
        ["batiment", "genie_civil", "hvac"],
        "cancelled"
      ),
      T(
        132,
        "Fourniture d'engins de chantier — Province d'Errachidia",
        "Conseil Provincial d'Errachidia",
        "etablissement_public",
        "fournitures",
        "Drâa-Tafilalet",
        5_000_000,
        7_500_000,
        -110,
        -45,
        ["equipment_supplier"],
        "cancelled"
      ),
      T(
        133,
        "Aménagement paysager — Corniche de Dakhla",
        "Commune de Dakhla",
        "commune",
        "travaux",
        "Dakhla-Oued Ed-Dahab",
        4_000_000,
        6_000_000,
        -100,
        -40,
        ["second_oeuvre"],
        "cancelled"
      ),
      T(
        134,
        "Réfection de l'étanchéité — Faculté des sciences de Fès",
        "Université Sidi Mohamed Ben Abdellah",
        "etablissement_public",
        "travaux",
        "Fès-Meknès",
        1_200_000,
        2_000_000,
        -95,
        -38,
        ["second_oeuvre"],
        "cancelled"
      ),
      T(
        135,
        "Études géotechniques — Extension du port de Nador West Med",
        "Nador West Med SA",
        "etablissement_public",
        "services",
        "L'Oriental",
        2_000_000,
        3_500_000,
        -105,
        -42,
        ["bureau_etudes"],
        "cancelled"
      ),
      T(
        136,
        "Construction de logements de fonction — Gendarmerie Royale Khémisset",
        "Administration de la Défense Nationale",
        "ministere",
        "travaux",
        "Rabat-Salé-Kénitra",
        7_000_000,
        9_500_000,
        -115,
        -48,
        ["batiment", "second_oeuvre"],
        "cancelled"
      ),
      T(
        137,
        "Lot courants faibles — Cité des métiers et des compétences Souss-Massa",
        "OFPPT",
        "etablissement_public",
        "travaux",
        "Souss-Massa",
        3_500_000,
        5_000_000,
        -90,
        -35,
        ["courants_faibles"],
        "cancelled"
      ),
      T(
        138,
        "Rénovation de l'éclairage du stade d'honneur — Oujda",
        "Commune d'Oujda",
        "commune",
        "travaux",
        "L'Oriental",
        2_800_000,
        4_200_000,
        -85,
        -32,
        ["electricite"],
        "cancelled"
      ),
      T(
        139,
        "Fourniture de canalisations PEHD — ORMVA du Tafilalet",
        "ORMVA du Tafilalet",
        "etablissement_public",
        "fournitures",
        "Drâa-Tafilalet",
        1_800_000,
        2_600_000,
        -80,
        -30,
        ["equipment_supplier"],
        "cancelled"
      ),
      T(
        140,
        "Travaux de signalisation routière — Réseau routier de Guelmim",
        "Direction Provinciale de l'Équipement Guelmim",
        "ministere",
        "travaux",
        "Guelmim-Oued Noun",
        900_000,
        1_400_000,
        -75,
        -28,
        ["routes"],
        "cancelled"
      ),
    ])
    .returning({ id: tenders.id, externalId: tenders.externalId });

  const tenderId = (ref: number) => {
    const ext = `MP-2026-${String(ref).padStart(6, "0")}`;
    const t = tenderRows.find((r) => r.externalId === ext);
    if (!t) throw new Error(`seed: tender ${ext} not found`);
    return t.id;
  };

  // Lots for the complexe sportif (groupement target) and the groupe scolaire
  const lotRows = await db
    .insert(tenderLots)
    .values([
      {
        tenderId: tenderId(106),
        lotNumber: 1,
        lotTitle: "Lot 1 — Plomberie, sanitaires et protection incendie",
        estimatedBudgetCentimes: MAD(18_000_000),
        requiredSpecialties: ["plomberie"],
      },
      {
        tenderId: tenderId(106),
        lotNumber: 2,
        lotTitle: "Lot 2 — Électricité courants forts et éclairage sportif",
        estimatedBudgetCentimes: MAD(35_000_000),
        requiredSpecialties: ["electricite"],
      },
      {
        tenderId: tenderId(106),
        lotNumber: 3,
        lotTitle: "Lot 3 — CVC et désenfumage",
        estimatedBudgetCentimes: MAD(28_000_000),
        requiredSpecialties: ["hvac"],
      },
      {
        tenderId: tenderId(106),
        lotNumber: 4,
        lotTitle: "Lot 4 — Peinture et revêtements",
        estimatedBudgetCentimes: MAD(12_000_000),
        requiredSpecialties: ["peinture"],
      },
      {
        tenderId: tenderId(106),
        lotNumber: 5,
        lotTitle: "Lot 5 — Menuiserie et agencement",
        estimatedBudgetCentimes: MAD(15_000_000),
        requiredSpecialties: ["charpente"],
      },
      {
        tenderId: tenderId(109),
        lotNumber: 1,
        lotTitle: "Lot 1 — Gros œuvre et second œuvre",
        estimatedBudgetCentimes: MAD(8_500_000),
        requiredSpecialties: ["batiment", "second_oeuvre"],
      },
      {
        tenderId: tenderId(109),
        lotNumber: 2,
        lotTitle: "Lot 2 — Lots techniques (électricité + plomberie)",
        estimatedBudgetCentimes: MAD(3_500_000),
        requiredSpecialties: ["electricite", "plomberie"],
      },
    ])
    .returning({
      id: tenderLots.id,
      lotNumber: tenderLots.lotNumber,
      tenderId: tenderLots.tenderId,
    });

  const complexeLot1 = lotRows.find((l) => l.tenderId === tenderId(106) && l.lotNumber === 1);

  // ------------------------------------------------------------- groupements
  const groupementRows = await db
    .insert(groupements)
    .values([
      {
        tenderId: tenderId(106),
        lotId: complexeLot1?.id ?? null,
        initiatorId: hassan,
        title: "Groupement lots techniques — Complexe Mohammed V",
        targetBudgetCentimes: MAD(81_000_000),
        status: "forming" as const,
        neededSpecialties: ["hvac", "charpente"],
        workspaceNotes:
          "Objectif : couvrir les lots 1, 2, 3 et 5. Plomberie (mandataire) et électricité confirmées. Il nous manque CVC et menuiserie.",
      },
      {
        tenderId: tenderId(110),
        initiatorId: youssef,
        title: "Groupement RN 8 — Tahiri / Bouhaddou / Ouazzani",
        targetBudgetCentimes: MAD(42_000_000),
        status: "submitting" as const,
        neededSpecialties: [],
        workspaceNotes:
          "Dossier administratif complet. Reste le mémoire technique (Nadia) et le planning d'exécution avant dépôt.",
      },
      {
        tenderId: tenderId(123),
        initiatorId: samira,
        title: "Groupement abattoirs Safi — El Fassi / Amrani",
        targetBudgetCentimes: MAD(7_500_000),
        status: "won" as const,
        neededSpecialties: [],
        workspaceNotes: "Marché attribué. Ordre de service reçu — démarrage des travaux planifié.",
        submittedAt: days(-95),
      },
    ])
    .returning({ id: groupements.id, status: groupements.status });

  const [gForming, gSubmitting, gWon] = groupementRows.map((g) => g.id);

  await db.insert(groupementMembers).values([
    // Forming — Hassan mandataire, Samira confirmed, Karim invited (HVAC)
    {
      groupementId: gForming,
      contractorId: hassan,
      specialty: "plomberie",
      estimatedShareCentimes: MAD(18_000_000),
      role: "mandataire" as const,
      status: "confirmed" as const,
      joinedAt: days(-5),
    },
    {
      groupementId: gForming,
      contractorId: samira,
      specialty: "electricite",
      estimatedShareCentimes: MAD(35_000_000),
      role: "cotraitant" as const,
      status: "confirmed" as const,
      joinedAt: days(-3),
    },
    {
      groupementId: gForming,
      contractorId: karim,
      specialty: "hvac",
      estimatedShareCentimes: MAD(28_000_000),
      role: "cotraitant" as const,
      status: "invited" as const,
    },
    // Submitting — Youssef mandataire
    {
      groupementId: gSubmitting,
      contractorId: youssef,
      specialty: "genie_civil",
      estimatedShareCentimes: MAD(20_000_000),
      role: "mandataire" as const,
      status: "confirmed" as const,
      joinedAt: days(-16),
    },
    {
      groupementId: gSubmitting,
      contractorId: rachid,
      specialty: "routes",
      estimatedShareCentimes: MAD(19_000_000),
      role: "cotraitant" as const,
      status: "confirmed" as const,
      joinedAt: days(-14),
    },
    {
      groupementId: gSubmitting,
      contractorId: nadia,
      specialty: "bureau_etudes",
      estimatedShareCentimes: MAD(3_000_000),
      role: "cotraitant" as const,
      status: "confirmed" as const,
      joinedAt: days(-13),
    },
    // Won — Samira mandataire
    {
      groupementId: gWon,
      contractorId: samira,
      specialty: "electricite",
      estimatedShareCentimes: MAD(2_500_000),
      role: "mandataire" as const,
      status: "confirmed" as const,
      joinedAt: days(-120),
    },
    {
      groupementId: gWon,
      contractorId: khadija,
      specialty: "second_oeuvre",
      estimatedShareCentimes: MAD(2_000_000),
      role: "cotraitant" as const,
      status: "confirmed" as const,
      joinedAt: days(-118),
    },
  ]);

  // --------------------------------------------------- tracking + saved search
  await db.insert(trackedTenders).values([
    {
      contractorId: hassan,
      tenderId: tenderId(108),
      status: "bidding" as const,
      notes: "Dossier en préparation — vérifier le quitus CNSS avant dépôt.",
    },
    {
      contractorId: hassan,
      tenderId: tenderId(106),
      status: "watching" as const,
      notes: "Via groupement lots techniques.",
    },
    { contractorId: hassan, tenderId: tenderId(101), status: "watching" as const },
    {
      contractorId: hassan,
      tenderId: tenderId(123),
      status: "lost" as const,
      notes: "Perdu — offre 8% au-dessus de l'attributaire.",
    },
    { contractorId: samira, tenderId: tenderId(115), status: "bidding" as const },
    {
      contractorId: samira,
      tenderId: tenderId(102),
      status: "submitted" as const,
      dossierSubmittedAt: days(-2),
    },
    {
      contractorId: youssef,
      tenderId: tenderId(110),
      status: "bidding" as const,
      notes: "Groupement avec Bouhaddou + Ouazzani.",
    },
    { contractorId: rachid, tenderId: tenderId(110), status: "bidding" as const },
  ]);

  await db.insert(savedSearches).values([
    {
      contractorId: hassan,
      name: "Plomberie Casablanca 1–10M",
      filters: {
        specialties: ["plomberie"],
        regions: ["Casablanca-Settat"],
        budgetMin: MAD(1_000_000),
        budgetMax: MAD(10_000_000),
        types: ["travaux"],
      },
      alertEnabled: true,
      lastAlertAt: days(-1),
    },
    {
      contractorId: samira,
      name: "Électricité Rabat-Casa",
      filters: {
        specialties: ["electricite", "courants_faibles"],
        regions: ["Rabat-Salé-Kénitra", "Casablanca-Settat"],
      },
      alertEnabled: true,
    },
  ]);

  // ------------------------------------------------------------ notifications
  await db.insert(notifications).values([
    {
      userId: userId("hassan.plomberie@demo.bina.ma"),
      type: "new_tender_match" as const,
      title: "Nouvel AO : plomberie à Settat",
      body: "Lot plomberie sanitaire — Extension de l'hôpital provincial de Settat (3–5M MAD). Date limite dans 25 jours.",
      linkUrl: "/tenders",
      isRead: false,
    },
    {
      userId: userId("hassan.plomberie@demo.bina.ma"),
      type: "doc_expiry" as const,
      title: "Quitus CNSS expire dans 12 jours",
      body: "Votre quitus CNSS expire bientôt. Renouvelez-le pour garder votre dossier complet.",
      linkUrl: "/compliance",
      isRead: false,
    },
    {
      userId: userId("karim.hvac@demo.bina.ma"),
      type: "groupement_invite" as const,
      title: "Invitation groupement — Complexe Mohammed V",
      body: "Benjelloun Plomberie SARL vous invite à rejoindre le groupement lots techniques (lot CVC, ~28M MAD).",
      linkUrl: "/groupements",
      isRead: false,
    },
  ]);

  // ---------------------------------------------------------------- audit log
  await db.insert(auditLogs).values([
    {
      actorUserId: userId("hassan.plomberie@demo.bina.ma"),
      entity: "groupement",
      entityId: gForming,
      action: "create" as const,
      after: { status: "forming" },
      at: days(-5),
    },
    {
      actorUserId: userId("samira.elec@demo.bina.ma"),
      entity: "groupement",
      entityId: gForming,
      action: "join" as const,
      after: { role: "cotraitant", specialty: "electricite" },
      at: days(-3),
    },
    {
      actorUserId: userId("youssef.gc@demo.bina.ma"),
      entity: "groupement",
      entityId: gSubmitting,
      action: "create" as const,
      after: { status: "forming" },
      at: days(-16),
    },
    {
      actorUserId: userId("hassan.plomberie@demo.bina.ma"),
      entity: "compliance_document",
      entityId: hassan,
      action: "upload" as const,
      after: { type: "quitus_cnss" },
      at: days(-78),
    },
  ]);

  console.log("✅ Seed complete:");
  console.log(`   ${userRows.length} users (8 contractors + 1 admin)`);
  console.log(`   ${profileRows.length} contractor profiles`);
  console.log(
    `   ${tenderRows.length} tenders (5 closing soon, 10 open, 15 awarded, 10 cancelled)`
  );
  console.log(`   ${lotRows.length} tender lots, ${groupementRows.length} groupements`);
  console.log("   Demo login: hassan.plomberie@demo.bina.ma / demo1234");
  console.log("   Admin login: admin@bina.ma / admin1234");
}

main()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seed failed:", err);
    await client.end();
    process.exit(1);
  });
