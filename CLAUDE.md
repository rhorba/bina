# Bina — بناء — Claude Code Project Bible

> This is the root business document. All specialists read this first.
> `.claude/CLAUDE.md` governs HOW the team works.
>
> **Bina** (بناء — "construction") is Morocco's construction SME platform — tender
> intelligence, consortium formation, and compliance management — built for the 1.24
> million workers and thousands of SMEs powering the 550 billion MAD construction
> supercycle triggered by the World Cup 2030 and record public investment.

---

## §1 — The Problem (grounded in 2025/2026 data)

Morocco's construction sector is booming — but SMEs are locked out:

- **550 billion MAD** in cumulative construction investments 2024–2030
- **380 billion MAD** in public investment budgeted in Loi de Finances 2026 — historically the highest ever
- BTP sector: **6% of GDP**, **1.24 million workers** (11.5% of national employment)
- Sector growth: **+4.1% in 2026**, +3.8% AAGR forecast 2026–2029
- **World Cup 2030**: 2.8 billion euros economic impact projected + 335,000 jobs
- Rail alone: **96 billion MAD** planned to 2030 (TGV + 150 trains + 40 new stations)
- BAD loan: 3.8 billion MAD for World Cup infrastructure, with additional 7 billion MAD pipeline

**The structural problem**: 6 large groups — TGCC, SGTM, Jet Contractors, Somagec, Sogea Maroc, Bymaro — capture most large contracts. Morocco's thousands of construction SMEs (which employ the vast majority of the 1.24 million workers) face three systemic blockers:

1. **marchespublics.gov.ma is unusable for SMEs**: The public procurement portal has 200+ new tenders weekly. SMEs spend 10–15 hours/week monitoring it manually, miss relevant tenders, and can't filter intelligently by their trade, region, or capacity.

2. **Large contracts require groupements (consortiums)**: A plumbing firm can't bid on a 50M MAD stadium fit-out alone — but there's no mechanism to find a complementary electrical firm + carpentry firm + HVAC firm to form a winning consortium together.

3. **Compliance dossiers block SMEs**: Every tender requires a heavy dossier (attestation fiscale, quitus CNSS, déclaration sur l'honneur, assurance décennale, références). SMEs spend days assembling these for every bid, with documents scattered across administrations.

**Bina solves all three** — the first platform built specifically for Morocco's construction SMEs in the World Cup era.

---

## §2 — Project Identity

**Name**: Bina
**Domain**: bina.ma
**Tagline (FR)**: "Trouvez les marchés. Formez votre équipe. Gagner ensemble."
**Tagline (AR)**: "اعثر على المناقصات. شكّل فريقك. انجح معاً."
**Type**: B2B SaaS platform (construction SMEs + compliance management + tender aggregation).
**Audience**:
  - **Construction SMEs** (TPE/PME BTP): plumbers, electricians, carpenters, painters,
    tilers, HVAC engineers, scaffolders, steelworkers, masonry firms — 1 to 50 employees.
    Also architecture firms and engineering offices (bureaux d'études).
  - **Equipment suppliers**: firms wanting to position themselves as material/equipment
    providers to SMEs working on specific projects.
  - **Platform Admin**: Internal — tender data quality, groupement moderation, KPIs.
**Language**: French primary (`fr`), Arabic (`ar`), RTL mandatory.
**Tone**: Practical, professional, peer-to-peer. Fellow contractor energy — not startup
  hype, not government portal stuffiness. "Bina" is both the platform name and the
  Darija word for construction — everyone in the sector will understand it immediately.

### Positioning
> "marchespublics.gov.ma tells you what exists. Bina tells you what you can win —
> and connects you with the partners to win it."

---

## §3 — Core Features (v0.1 scope)

### Module A — Tender Radar (Veille Marchés)
The acquisition engine. Replaces 10–15 hours/week of manual monitoring.

- **Aggregated tender feed**: scrape + parse marchespublics.gov.ma (public data)
  → structured database of active tenders with deadline, estimated budget, région,
  maître d'ouvrage (client), lot details, required trades
- **Smart filtering**: filter by trade specialty (plomberie, électricité, génie civil,
  second œuvre...), région, budget range (< 1M MAD / 1–5M / 5–20M / > 20M),
  type (travaux / fournitures / services), maître d'ouvrage type (commune, ministère,
  établissement public, privé)
- **Saved searches + alerts**: save a filter profile → email/in-app notification when
  matching tender is published ("Nouvelle AO: plomberie, Casablanca, budget 2–8M MAD")
- **Deadline tracker**: personal dashboard of tracked tenders with days-remaining countdown
- **Tender detail page**: structured view of the AO — lot details, required documents,
  evaluation criteria, download link to original dossier
- **Lot-splitting detection**: flag tenders that are split into lots where an SME could
  win one lot rather than the whole contract

### Module B — Groupement Builder (Team Formation)
The differentiator — nothing like this exists in Morocco.

- **Groupement posts**: SME posts "Je cherche un partenaire électricité pour AO [X],
  budget estimé ma part: 3M MAD, délai: 6 mois — qui est intéressé?"
- **Trade directory**: browse verified SMEs by specialty + région + capacity (références)
- **Match suggestions**: when a tender is posted to the radar that exceeds a user's
  declared capacity → "This tender requires 5 trades. You cover plomberie.
  3 registered firms cover the other lots. Form a groupement?"
- **Groupement workspace**: once formed, shared document space, task assignment, bid
  contribution tracking, communication thread
- **Groupement status**: en formation → constitué → candidature déposée → résultat
- **References visibility**: SME profile shows completed projects (reference certificates)
  — critical for groupement partner selection

### Module C — Compliance Kit (Dossier Réglementaire)
Reduce the compliance burden from days to minutes.

- **Document vault**: upload and store key compliance documents:
  - Attestation fiscale (DGI) — auto-expiry alert
  - Quitus CNSS — auto-expiry alert
  - Assurance décennale / RC Pro
  - Registre de Commerce (RC)
  - Statuts de société
  - Références chantiers (completed project certificates)
  - Qualification FNBTP (Fédération Nationale du BTP)
- **Auto-expiry alerts**: "Votre attestation fiscale expire dans 15 jours. Voici le lien
  pour la renouveler: [DGI link]"
- **Dossier builder**: select a tender → one-click generate the required submission
  dossier by pulling relevant documents from the vault (with checklist of missing docs)
- **FNBTP qualification tracker**: track qualification level (1ère, 2ème, 3ème catégorie)
  and which tenders it qualifies for
- **Compliance score**: profile completeness indicator visible to groupement partners
  ("Dossier complet à 85% — il manque la qualification FNBTP")

### Module D — Project References & Portfolio
- Upload completed project references (maître d'ouvrage, montant, type de travaux, photos)
- References are public on the SME profile → groupement partners can evaluate
- Auto-populate reference section in bid dossiers
- Certification badges: "Référencé Commune de Casablanca", "Marché public > 5M MAD"

### Module E — Admin Dashboard
- Tender data quality monitoring (scraper health, parsing accuracy)
- Groupement moderation (flag inactive / fake groupements)
- Platform KPIs: tenders indexed, daily active users, groupements formed, alerts sent
- SME verification queue (FNBTP qualification check)

### Cross-cutting (v0.1, non-negotiable)
- **Auth + RBAC** (contractor / admin)
- **Bilingual FR/AR + RTL**
- **Tender scraper** as a pg-boss job (daily, respects robots.txt, handles pagination)
- Audit log on groupement transitions

---

## §4 — Out of Scope (v0.1)

| Deferred | Feature |
|---|---|
| **v0.2** | Mobile app (React Native) |
| **v0.2** | Real Crédit Agricole du Maroc financing integration |
| **v0.2** | AI-powered bid writing assistant |
| **v0.2** | Subcontractor marketplace (find workers, not firms) |
| **v0.2** | Material/equipment marketplace |
| **v0.2** | CRM for client relationship management |
| **v0.2** | Direct DGI/CNSS API for real-time compliance verification |
| **v0.3** | Export + international tender monitoring (BERD, BAD, IDA) |
| **out** | Payment processing between contractors (we don't transact money) |

---

## §5 — Tech Stack (FINAL)

| Concern | Choice | Why |
|---|---|---|
| Web | Next.js 15 App Router, TypeScript strict | SSR for public tender pages (SEO) |
| Styling | Tailwind v4 + shadcn/ui | |
| DB | PostgreSQL 16 + Drizzle ORM + RLS | Standard; NO pgvector (tender matching is structured, not semantic) |
| Auth | Auth.js v5 (email + password + Google OAuth) | B2B context; email is standard |
| Money | Integer centimes (MAD) for budget fields | Tender budgets, compliance fees |
| Tender scraper | Playwright (headless) + `packages/scraper` | marchespublics.gov.ma requires JS rendering |
| Scraper scheduler | pg-boss (daily scrape job at 6am) | |
| Tender matching | SQL full-text search + structured filters (no pgvector) | Tender matching is by category/region/budget — no semantic embedding needed |
| Groupement state machine | `packages/groupement` | Similar to deal/booking patterns |
| Alerts | pg-boss (daily sweep: new tenders → matching user profiles → notifications) | |
| Document storage | Cloudflare R2 (private bucket for compliance docs) | |
| Email | Resend (tender alerts, deadline reminders) | |
| i18n | next-intl (fr/ar), RTL mandatory | |
| Testing | Vitest + Playwright | Playwright dual-use: E2E tests + scraper |
| Container | Docker Compose (postgres + web + worker + caddy) | Standard postgres:16-alpine (no pgvector) |
| PM | pnpm workspaces | |
| Linting | Biome | |
| CI | GitHub Actions (standard postgres:16-alpine) | |

> **SCRAPER NOTE**: marchespublics.gov.ma is a public government portal. Scraping
> public procurement data is legal and in the public interest (CNDP does not apply
> to public government data). The scraper uses Playwright, respects rate limits
> (1 request/3 seconds), and runs nightly at 6am. A fallback manual import (CSV)
> must always exist in case the portal changes structure.

---

## §6 — Data Model (core entities)

```typescript
// packages/core/src/types.ts

type Money = number  // integer centimes (MAD). NEVER a float.

type Role = 'contractor' | 'admin'

type TradeSpecialty =
  | 'genie_civil'         // Génie civil / Terrassement
  | 'batiment'            // Bâtiment (gros œuvre)
  | 'second_oeuvre'       // Second œuvre (finitions)
  | 'plomberie'           // Plomberie / Sanitaire
  | 'electricite'         // Électricité / Courants forts
  | 'courants_faibles'    // Courants faibles / Réseaux
  | 'hvac'                // Climatisation / Ventilation
  | 'charpente'           // Charpente / Menuiserie
  | 'peinture'            // Peinture / Revêtements
  | 'architecture'        // Architecture
  | 'bureau_etudes'       // Bureau d'études / Ingénierie
  | 'routes'              // Routes / VRD
  | 'hydraulique'         // Travaux hydrauliques
  | 'equipment_supplier'  // Fournisseur de matériaux
  | 'other'

type TenderType = 'travaux' | 'fournitures' | 'services' | 'conception_realisation'

type TenderStatus = 'open' | 'closing_soon' | 'closed' | 'awarded' | 'cancelled'

type CompanySize = 'micro' | 'tpe' | 'pme' | 'eti'  // < 10 / 10-49 / 50-249 / 250+

type FNBTPCategory = 'premiere' | 'deuxieme' | 'troisieme' | 'non_qualifie'

type User = {
  id: string; email: string; name: string; role: Role
  phone?: string; city?: string; region?: string
  isActive: boolean; emailVerified: boolean; createdAt: Date
}

type ContractorProfile = {
  id: string; userId: string
  companyName: string
  ice?: string; rc?: string
  specialties: TradeSpecialty[]
  regions: string[]                   // regions where they operate
  companySize: CompanySize
  employeeCount?: number
  maxContractValueMAD?: Money         // declared capacity
  fnbtpCategory?: FNBTPCategory
  fnbtpNumber?: string
  avgRating: number; reviewCount: number; completedTenders: number
  complianceScore: number             // 0-100: document completeness
  createdAt: Date; updatedAt: Date
}

type ComplianceDocument = {
  id: string; contractorId: string
  type: DocType
  fileKey: string                     // R2 private key
  issuedAt?: Date; expiresAt?: Date
  status: 'valid' | 'expiring_soon' | 'expired' | 'pending_renewal'
  uploadedAt: Date; updatedAt: Date
}

type DocType =
  | 'attestation_fiscale'
  | 'quitus_cnss'
  | 'assurance_decennale'
  | 'rc_pro'
  | 'registre_commerce'
  | 'statuts'
  | 'qualification_fnbtp'
  | 'reference_chantier'
  | 'other'

type Tender = {
  id: string
  externalId: string                  // marchespublics.gov.ma ID (dedup key)
  title: string
  maitreDOuvrage: string              // contracting authority
  maitreDOuvrageType: 'commune' | 'ministere' | 'etablissement_public' | 'prive'
  type: TenderType
  region: string
  estimatedBudgetMin?: Money          // centimes
  estimatedBudgetMax?: Money
  publishedAt: Date
  submissionDeadline: Date
  openingDate?: Date
  lots: TenderLot[]
  requiredSpecialties: TradeSpecialty[]
  requiredFNBTPCategory?: FNBTPCategory
  description?: string
  dossierUrl?: string                 // link to original on portal
  status: TenderStatus
  scrapedAt: Date; updatedAt: Date
}

type TenderLot = {
  id: string; tenderId: string
  lotNumber: number; lotTitle: string
  estimatedBudget?: Money
  requiredSpecialties: TradeSpecialty[]
  description?: string
}

type SavedSearch = {
  id: string; contractorId: string
  name: string
  filters: TenderFilters
  alertEnabled: boolean
  lastAlertAt?: Date
  createdAt: Date
}

type TenderFilters = {
  specialties?: TradeSpecialty[]
  regions?: string[]
  budgetMin?: Money; budgetMax?: Money
  types?: TenderType[]
  maitreDOuvrageTypes?: string[]
  deadlineWithinDays?: number
}

type TrackedTender = {
  id: string; contractorId: string; tenderId: string
  status: 'watching' | 'bidding' | 'submitted' | 'won' | 'lost' | 'withdrawn'
  dossierSubmittedAt?: Date; notes?: string
  createdAt: Date
}

type GroupementStatus =
  | 'forming'           // seeking partners
  | 'formed'            // all partners confirmed
  | 'submitting'        // dossier being prepared
  | 'submitted'         // bid submitted
  | 'won' | 'lost' | 'withdrawn'

type Groupement = {
  id: string
  tenderId: string; lotId?: string
  initiatorId: string                 // contractor who created it
  members: GroupementMember[]
  title: string
  targetBudget?: Money
  status: GroupementStatus
  neededSpecialties: TradeSpecialty[] // still looking for
  workspaceNotes?: string
  submittedAt?: Date
  createdAt: Date; updatedAt: Date
}

type GroupementMember = {
  id: string; groupementId: string; contractorId: string
  specialty: TradeSpecialty
  estimatedShare?: Money              // their portion of the contract
  role: 'mandataire' | 'cotraitant'  // Moroccan groupement law: one mandataire (leader)
  status: 'invited' | 'confirmed' | 'declined' | 'left'
  joinedAt?: Date
}

type ProjectReference = {
  id: string; contractorId: string
  title: string
  maitreDOuvrage: string
  contractValue?: Money
  completedAt: Date
  specialty: TradeSpecialty
  description?: string
  photoKeys: string[]                 // R2 public
  certificateKey?: string             // R2 private (official reference letter)
  createdAt: Date
}

type AuditLog = {
  id: string; actorUserId: string
  entity: string; entityId: string
  action: 'create' | 'update' | 'join' | 'leave' | 'submit' | 'upload'
  before?: unknown; after?: unknown; at: Date
}
```

---

## §7 — Roles & Permissions

| Capability | contractor | admin |
|---|---|---|
| Browse tenders (public) | ✅ | ✅ |
| Save searches + alerts | ✅ | ✅ |
| Track tenders | ✅ (own) | ✅ |
| Create groupement | ✅ | ✅ |
| Join / leave groupement | ✅ | ✅ |
| View groupement workspace | members only | ✅ |
| Upload compliance docs | ✅ (own) | ✅ |
| View own compliance docs | ✅ | ✅ |
| Generate bid dossier | ✅ (own) | ✅ |
| View other contractor profile | public fields only | ✅ |
| View tender data | ✅ | ✅ |
| Manage tender data | — | ✅ |
| View platform KPIs | — | ✅ |

---

## §8 — Seed / Demo Data

- 8 contractor profiles (plomberie/Casa, électricité/Rabat, génie civil/Tanger,
  second œuvre/Marrakech, architecture/Casa, bureau d'études/Agadir, HVAC/Fès,
  routes/Meknès) — varied compliance scores (40%–95%)
- 40 realistic tenders scraped/mock from marchespublics.gov.ma (mix of regions, types, budgets)
  — 5 closing this week, 10 open, 15 closed with awards, 10 cancelled
- 3 active groupements (1 forming/seeking partners, 1 formed/submitting, 1 won)
- Price range: 500K MAD to 150M MAD (realistic spread)
- Demo: hassan.plomberie@demo.bina.ma / demo1234 (plumber, Casablanca, compliance 72%)

---

## §9 — Design Identity

- **Aesthetic**: Industrial precision meets Moroccan craftsmanship. Steel blue + warm orange +
  concrete gray. Clean data tables, status chips, deadline countdowns. Professional — this
  is a tool for serious contractors, not a consumer app.
- **Colors**: Steel blue primary (#1E3A5F) — trust, precision, infrastructure.
  Construction orange accent (#E07B39) — energy, building, Morocco.
  Concrete gray surfaces (#F4F2EF). Green = won/valid. Red = expired/deadline.
- **Typography**: "IBM Plex Sans" (technical precision, used in many B2B tools). "Noto Kufi Arabic" for AR.
- **Data density**: contractors want to see many tenders at once — compact list view with
  key data (title, budget, deadline, region) visible without opening each row.
- **Deadline urgency**: red/orange chip for "closing in X days" — the most important signal.
- **Compliance status**: traffic-light system (green/amber/red) — instantly visible on profile.

---

## §10 — UX Principles

1. **Tender radar is the daily habit**: contractors check it every morning like email — it must load fast and feel actionable
2. **Deadlines are sacred**: everywhere a tender appears, the deadline countdown is visible
3. **Groupement = trust building**: profiles must be rich enough that contractors feel safe partnering
4. **Compliance anxiety is real**: make document status one tap away, with clear "fix this" actions
5. **No useless features**: contractors are busy — every feature must save real time or win real money
6. **Mobile-friendly** (not mobile-first): contractors use desktop in the office; phones on-site
7. **RTL equal**: many Moroccan contractors prefer Arabic

---

## §11 — Legal & Financial Integrity

1. **Tender data is public**: marchespublics.gov.ma data is public government procurement data.
   Aggregating it for SMEs is legal and in the public interest. CNDP does not apply.
2. **Compliance documents are sensitive**: attestation fiscale, CNSS quitus contain company
   financial data — stored in private R2, served via signed URLs, contractor + admin only.
3. **Groupement law (Code des marchés publics Décret 2-12-349)**: groupement mandataire and
   cotraitant roles are legally defined in Moroccan procurement law. Bina's groupement
   structure must reflect this (one mandataire per groupement).
4. **Bina takes no margin on tenders**: Bina is a SaaS subscription tool, not a procurement
   agent or intermediary. The platform never touches contract money.
5. **No false compliance guarantees**: Bina helps organize compliance documents but never
   certifies that a contractor IS compliant — that's the maître d'ouvrage's role.

---

## §12 — Definition of Done (v0.1 — 20 items)

- [ ] Auth: signup/login for contractor + admin; email verification
- [ ] Contractor profile: create, edit, specialties, regions, capacity, FNBTP
- [ ] Tender data: scraper populates DB with real/mock data (40+ tenders)
- [ ] Tender browse: public, filterable (specialty/region/budget/type/deadline), SSR
- [ ] Tender detail page: structured view + deadline + lots + download link
- [ ] Saved searches + alert profiles (filter → save → receive email on match)
- [ ] Tender tracking: contractor tracks a tender with status (watching/bidding/submitted)
- [ ] Groupement create: post a groupement request for a tender with needed specialties
- [ ] Groupement browse: find groupements seeking my specialty
- [ ] Groupement join/leave + member status management
- [ ] Groupement workspace: shared notes + member list + contribution tracking
- [ ] Compliance vault: upload docs (CIN, CNSS, fiscale, assurance) to private R2
- [ ] Document expiry tracking + alerts (15-day advance warning)
- [ ] Compliance score: profile completeness 0–100% displayed
- [ ] Dossier builder: select tender → auto-generate required doc list + pull from vault
- [ ] Project references: upload completed projects (public profile)
- [ ] Notifications: in-app for new matching tenders, groupement invites, doc expiry
- [ ] Email: tender alerts, deadline reminders, groupement invites (Resend)
- [ ] Admin dashboard: scraper health, tender counts, active groupements, KPIs
- [ ] FR + AR + RTL complete; `pnpm build` 0 errors; `pnpm test` green; `pnpm lint` clean
- [ ] Deploy: Vercel + managed Postgres OR `docker compose up -d`

---

## §13 — Sprint Roadmap

| Sprint | Goal |
|---|---|
| **Sprint 0** | Scaffold + Auth + RBAC + RLS + Docker |
| **Sprint 1** | Data model + Contractor profiles + Project references + demo seed |
| **Sprint 2** | Tender scraper + tender browse (public SSR) + tender detail |
| **Sprint 3** | Saved searches + alert engine + tender tracking dashboard |
| **Sprint 4** | Groupement system (create + browse + join + workspace) |
| **Sprint 5** | Compliance vault + document expiry + dossier builder |
| **Sprint 6** | Notifications + email + i18n FR/AR + RTL + a11y |
| **Sprint 7** | Admin dashboard + security hardening + deploy → v0.1 ship |

---

## §14 — Repository Structure

```
bina/
├── CLAUDE.md
├── .claude/
├── apps/
│   └── web/
│       └── src/app/
│           ├── [locale]/(public)/     ← Tender browse (SSR, no auth)
│           ├── [locale]/(contractor)/ ← Contractor dashboard
│           └── [locale]/(admin)/      ← Admin dashboard
└── packages/
    ├── core/          ← Money, Role, RBAC, Zod schemas
    ├── db/            ← Drizzle schema, migrations, RLS, seed
    ├── scraper/       ← Playwright scraper for marchespublics.gov.ma
    ├── tenders/       ← Tender parsing, filtering, alert matching
    ├── groupement/    ← Groupement state machine + workspace logic
    ├── compliance/    ← Document vault, expiry, dossier builder
    └── notifications/ ← In-app + Resend email alerts
```

---

## §15 — Auth & Access Model

- **Auth.js v5**: email+password (Argon2id) + Google OAuth
- Session: `{ userId, role, contractorId? }` — role server-side only
- Two roles: contractor / admin
- `withRole(session, allowedRoles, handler)` factory
- Compliance documents: private R2; signed URLs (15-min expiry); contractor + admin only; every access audit-logged
- Groupement workspace: members only + admin
- Admin provisioned via seed or direct DB only
