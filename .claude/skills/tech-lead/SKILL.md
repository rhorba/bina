---
name: tech-lead
description: Architecture, ADRs, stack enforcement. Trigger on: "architecture", "ADR", "tech stack".
---
# Tech Lead — Bina

## Stack (FINAL — CLAUDE.md §5)
| Concern | Choice |
|---|---|
| Web | Next.js 15 App Router, TypeScript strict |
| DB | PostgreSQL 16 + Drizzle ORM + RLS (**standard postgres:16-alpine — NO pgvector needed**) |
| Auth | Auth.js v5 (email + Argon2id + Google OAuth) |
| Scraper | Playwright (headless Chromium) in `packages/scraper` |
| Tender matching | SQL full-text search + structured filters |
| Groupement | State machine in `packages/groupement` |
| Compliance | Doc vault in `packages/compliance` |
| Storage | R2 private (compliance docs) + R2 public (project photos) |
| Jobs | pg-boss: scraper (6am daily), alert.sweep (after scrape), doc.expiry.sweep (weekly) |
| Email | Resend |
| i18n | next-intl (fr/ar), RTL mandatory |

## Key ADRs

### ADR-01: Playwright for scraping marchespublics.gov.ma
The portal uses JavaScript rendering — Playwright headless browser is required.
Runs as a pg-boss job at 6am daily. Rate-limited (1 req/3s). Has a CSV fallback.
Scraper tests use captured HTML fixtures (no live network in CI).

### ADR-02: Standard postgres:16-alpine (no pgvector)
Tender matching is structured: specialty categories, regions, budget ranges, deadlines.
SQL filters + full-text search on title/description is sufficient. No vector embeddings needed.
This makes CI simpler (no pgvector image required).

### ADR-03: Two roles only (contractor / admin)
Bina is simpler than the other platforms. Contractors and admins. No buyer/seller dynamic.
Equipment suppliers are just contractors with `specialty = 'equipment_supplier'`.

### ADR-04: Tender data is public + SSR
Tender browse requires no authentication. SSR + 1-hour cache. This drives organic SEO
("Appel d'offres plomberie Casablanca 2026") and is the primary acquisition channel.

### ADR-05: Groupement mandataire enforced by UI + DB
Moroccan Code des marchés publics (Décret 2-12-349) requires one mandataire per groupement.
`groupement_members.role` is ENUM ('mandataire', 'cotraitant'). Unique constraint on
`(groupement_id, role='mandataire')` ensures only one mandataire per groupement.

## Data Flow
```
pg-boss 6am → Playwright scrapes marchespublics.gov.ma → parse tenders → upsert by externalId
Alert sweep (after scrape) → for each active SavedSearch → find new matching tenders → notify
Contractor creates groupement → invites partners by specialty → partners confirm → submit
Contractor uploads compliance doc → private R2 → expiry tracked → pg-boss weekly sweep → alerts
```
