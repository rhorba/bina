# Sprint 1 — Data Model + Profiles + Demo Seed

**Duration**: 1–2 sessions | **Depends on**: Sprint 0

## Must
- [ ] S1-01 — DBA: full schema — `contractor_profiles`, `compliance_documents`, `tenders`, `tender_lots`, `saved_searches`, `tracked_tenders`, `groupements`, `groupement_members` (with mandataire unique index), `project_references`, `notifications`, `scraper_logs`, `audit_logs` — all with RLS — **DBA** → Security
- [ ] S1-02 — Security: review RLS — compliance docs: contractor + admin only; groupement workspace: members + admin — **Security**
- [ ] S1-03 — Backend: contractor profile CRUD (specialties, regions, FNBTP, capacity) — **Backend Dev**
- [ ] S1-04 — Frontend: contractor profile create/edit page — **Frontend Dev**
- [ ] S1-05 — Frontend: public contractor directory (name, specialties, regions, compliance score, references count) — **Frontend Dev**
- [ ] S1-06 — Backend: project reference CRUD (upload, list) — **Backend Dev**
- [ ] S1-07 — DBA + Backend: demo seed (8 contractors, 40 tenders, 3 groupements, price/status variety) — **DBA**
- [ ] S1-08 — Content Editor: FR/AR for specialty labels, FNBTP categories, tender types, regions — **Content Editor**
- [ ] S1-09 — Tester: role isolation; compliance doc 403; groupement workspace members-only — **Tester**
- [ ] S1-10 — Sprint 1 snapshot → ask for Sprint 2

---

# Sprint 2 — Tender Scraper + Browse (SSR) + Detail

**Duration**: 2 sessions | **Depends on**: Sprint 1

## Must
- [ ] S2-01 — Tender Engine: Playwright scraper (`packages/scraper`) with HTML fixture mocks for CI — **Tender Engine**
- [ ] S2-02 — Tender Engine: `parseTenderHTML()` parser + specialty keyword mapping — **Tender Engine**
- [ ] S2-03 — Backend: `scraper.daily` pg-boss job (6am, rate-limited, upsert by externalId) — **Backend Dev**
- [ ] S2-04 — Backend: CSV manual import for admin (fallback) — **Backend Dev**
- [ ] S2-05 — Frontend: public tender browse page — SSR, filter by specialty/region/budget/type/deadline (no auth) — **Frontend Dev**
- [ ] S2-06 — Frontend: tender detail page (SSR) — deadline chip, lots, required specialties, download link — **Frontend Dev**
- [ ] S2-07 — Frontend: tender list row (compact: title, region, deadline chip, budget, specialty tags) — **Frontend Dev**
- [ ] S2-08 — Content Editor: FR/AR for tender statuses, deadline urgency copy — **Content Editor**
- [ ] S2-09 — Tester: scraper parser with HTML fixtures, upsert idempotency, public browse SSR — **Tester**
- [ ] S2-10 — Sprint 2 snapshot → ask for Sprint 3

---

# Sprint 3 — Saved Searches + Alert Engine + Tender Tracking

**Duration**: 1–2 sessions | **Depends on**: Sprint 2

## Must
- [ ] S3-01 — Backend: saved search CRUD (contractor's filter profiles + alert toggle) — **Backend Dev**
- [ ] S3-02 — Tender Engine: `alert.sweep` pg-boss job (runs after scraper; matches new tenders to saved searches) — **Tender Engine**
- [ ] S3-03 — Frontend: saved search builder UI (specialty + region + budget + deadline filter; name + save) — **Frontend Dev**
- [ ] S3-04 — Frontend: tracking dashboard (tracked tenders with status: watching/bidding/submitted/won/lost) — **Frontend Dev**
- [ ] S3-05 — Backend: tracked tender CRUD + status update — **Backend Dev**
- [ ] S3-06 — Backend: deadline reminder emails (pg-boss: tenders closing in 3 days for tracked tenders) — **Backend Dev**
- [ ] S3-07 — Tester: alert sweep matching logic, deadline reminder job idempotency — **Tester**
- [ ] S3-08 — Sprint 3 snapshot → ask for Sprint 4

---

# Sprint 4 — Groupement System

**Duration**: 2 sessions | **Depends on**: Sprint 3

## Must
- [ ] S4-01 — Groupement Engine: state machine + mandataire enforcement (DB unique index) — **Groupement Engine**
- [ ] S4-02 — Backend: groupement CRUD (create, invite, accept, decline, withdraw) — **Backend Dev**
- [ ] S4-03 — Frontend: groupement creation form (tender, needed specialties, description) — **Frontend Dev**
- [ ] S4-04 — Frontend: groupement browse — "looking for my specialty" filtered list — **Frontend Dev**
- [ ] S4-05 — Frontend: groupement workspace (member list + compliance scores + shared notes + deadline) — **Frontend Dev**
- [ ] S4-06 — Backend: match suggestion — when scraper finds multi-specialty tender → notify relevant contractors — **Backend Dev** → Groupement Engine
- [ ] S4-07 — pg-boss: groupement.archive sweep (30-day inactivity → archive forming groupements) — **Backend Dev**
- [ ] S4-08 — Content Editor: FR/AR for groupement statuses, mandataire/cotraitant, legal note — **Content Editor**
- [ ] S4-09 — Tester: mandataire uniqueness test, workspace members-only access, state machine — **Tester**
- [ ] S4-10 — Sprint 4 snapshot → ask for Sprint 5

---

# Sprint 5 — Compliance Vault + Document Expiry + Dossier Builder

**Duration**: 2 sessions | **Depends on**: Sprint 4

## Must
- [ ] S5-01 — Compliance Engineer: document vault upload (private R2, consent, audit log) — **Compliance Engineer** → Security
- [ ] S5-02 — Compliance Engineer: `computeComplianceScore()` — **Compliance Engineer**
- [ ] S5-03 — Compliance Engineer: `buildDossierChecklist()` + dossier PDF (with disclaimer) — **Compliance Engineer**
- [ ] S5-04 — Backend: `getDocumentSignedUrl()` (contractor + admin only, 15-min expiry, audit log) — **Backend Dev** → Security
- [ ] S5-05 — pg-boss: `doc.expiry.sweep` (weekly; recompute statuses; create notifications for expiring_soon) — **Backend Dev**
- [ ] S5-06 — Frontend: compliance vault UI (doc list + status traffic lights + upload form) — **Frontend Dev**
- [ ] S5-07 — Frontend: dossier builder UI (select tender → checklist → generate PDF) — **Frontend Dev**
- [ ] S5-08 — Tester: compliance score math, signed URL 403 for other contractor, expiry sweep, dossier checklist — **Tester**
- [ ] S5-09 — Sprint 5 snapshot → ask for Sprint 6

---

# Sprint 6 — Notifications + Email + i18n + RTL + a11y

**Duration**: 1–2 sessions | **Depends on**: Sprint 5

## Must
- [ ] S6-01 — Backend: in-app notifications (new tender alert, groupement invite, doc expiry, deadline reminder) — **Backend Dev**
- [ ] S6-02 — Frontend: notification bell + list panel — **Frontend Dev**
- [ ] S6-03 — Backend: Resend email (tender alert digest, deadline reminder, groupement invite, doc expiry warning) — **Backend Dev**
- [ ] S6-04 — Content Editor: complete fr.json + ar.json sweep — zero gaps — **Content Editor**
- [ ] S6-05 — Frontend: i18n audit (grep hardcoded strings) + RTL audit (logical Tailwind everywhere) — **Frontend Dev**
- [ ] S6-06 — Frontend: a11y — focus states, labels, contrast, keyboard nav — **Frontend Dev**
- [ ] S6-07 — Tester: i18n parity test, RTL E2E, notification delivery — **Tester**
- [ ] S6-08 — Sprint 6 snapshot → ask for Sprint 7

---

# Sprint 7 — Admin Dashboard + Security + Deploy → v0.1 SHIP

**Duration**: 1–2 sessions | **Depends on**: Sprint 6

## Must
- [ ] S7-01 — Frontend: admin dashboard — KPIs (tenders indexed, DAU, alerts sent, groupements active, compliance uploads) — **Frontend Dev**
- [ ] S7-02 — Frontend: admin scraper health monitor — last run, tenders added, errors — **Frontend Dev**
- [ ] S7-03 — Frontend: admin CSV tender import — **Frontend Dev**
- [ ] S7-04 — Security: adversarial tests — compliance doc 403, groupement workspace members-only, admin endpoint contractor 403 — **Security**
- [ ] S7-05 — Security: auth hardening — rate-limit, Google OAuth redirect, CSP headers — **Security**
- [ ] S7-06 — Security: compliance doc audit log coverage — every signed URL generates audit row — **Security**
- [ ] S7-07 — Tech Lead: performance — tender browse SSR cached, images via R2 CDN — **Tech Lead**
- [ ] S7-08 — DevOps: deploy path A (Vercel + Neon postgres) + B (`docker compose up -d`) — **DevOps**
- [ ] S7-09 — Deployment: verify both paths; public tender browse no auth; compliance doc 403 in prod — **Deployment**
- [ ] S7-10 — Tester: full regression + scraper fixtures + groupement + compliance + E2E critical paths — **Tester**
- [ ] S7-11 — README + .env.example complete — **Project Manager**
- [ ] S7-12 — Final DoD: all 20 items ✅ — **Project Monitor** → v0.1 SHIPPED

## DoD — Sprint 7 (= v0.1 SHIPPED)
- [ ] Tender browse: public, SSR, no auth, deadline chips correct
- [ ] Scraper: runs via pg-boss at 6am; CSV fallback in admin
- [ ] Alert sweep: new tenders → matching saved searches → notifications + email
- [ ] Groupement: one mandataire enforced; workspace members-only; state machine audited
- [ ] Compliance docs: private R2; signed URLs audited; score computed correctly
- [ ] Dossier PDF: includes legal disclaimer
- [ ] Role isolation adversarial tests green
- [ ] FR + AR + RTL complete; i18n parity test passes
- [ ] `pnpm build` 0 errors; `pnpm test` green; `pnpm lint` clean; gitleaks passes
