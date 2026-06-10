# sessions
## SESSION_START — PROJECT INITIALIZED
Sprint: 0 — Ready to start
Status: Fresh project. Framework scaffolded. All S0 tasks pending.
Goal: `pnpm dev`, Auth (contractor/admin), postgres:16-alpine + RLS, role isolation proven.
**KEY DIFFERENCE from Mahara/Riaya/Mawsim**: NO pgvector — use postgres:16-alpine in Docker AND CI.
Playwright is in packages/scraper for marchespublics.gov.ma scraping — never runs in CI.
Next: S0-01 (workspace) → S0-07 (Auth.js) → S0-13 (Docker with postgres:16-alpine)

## SESSION_END — 2026-06-03 (Session 1)
Sprint: 0 — Partial
Completed: S0-01 (workspace), S0-02 (Next.js 15 config), S0-03 (packages/core), S0-04–S0-06 (packages/db + RLS), S0-07 (Auth.js v5), S0-08 (withRole factory), S0-09 (auth/config), S0-10 (next-intl fr/ar), S0-11 (Tailwind v4 tokens), S0-12 partial (locale layout)
Remaining: App shell sidebar/topbar, auth pages, API route, route group layouts, Docker, pg-boss worker, CI, role isolation tests, package stubs (scraper/tenders/groupement/compliance/notifications)
State saved in memory: sprint0-progress.md
