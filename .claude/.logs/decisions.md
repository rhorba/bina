# decisions
## ADR-01: Playwright for marchespublics.gov.ma (JS-rendered portal)
Portal requires a real browser. Playwright headless Chromium in packages/scraper.
Rate-limited 1 req/3s. Runs 6am daily via pg-boss. CSV fallback for admin.
Tests use captured HTML fixtures — NEVER hit live portal in CI.

## ADR-02: No pgvector (postgres:16-alpine is sufficient)
Tender matching is fully structured: specialty enum, region enum, budget range, deadline.
SQL filters + full-text search on title covers all needs. Much simpler setup.

## ADR-03: 2 roles only (contractor / admin)
Simplest possible RBAC. Equipment suppliers are contractors with specialty=equipment_supplier.

## ADR-04: Tender data is public + SSR
Public procurement data. SSR + cache. No login required. Primary SEO acquisition channel.
("Appel d'offres plomberie Casablanca 2026" → Bina appears in Google)

## ADR-05: Groupement mandataire enforced at DB level
Moroccan procurement law (Décret 2-12-349): one mandataire per groupement.
UNIQUE INDEX on (groupement_id) WHERE role='mandataire' AND status='confirmed'.
