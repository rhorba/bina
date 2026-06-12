### 2026-06-12 SPRINT_SNAPSHOT — Sprint 7 (FINAL / v0.1 ship)

- **Tests:** unit 247 passed (core 42 · notifications 26 · groupement 45 · compliance 38 · tenders 88 · scraper 8) / E2E 5 passed (public radar, contractor FR, contractor AR/RTL, admin FR, admin AR/RTL)
- **Coverage (≥80% gate, CI-enforced):** tenders 99.15 · scraper 100 · groupement 100 · compliance 100 · notifications 100/97.46 · core 100 — all green
- **Scraper parser tests:** PASS (fixture-based, 8 tests)
- **Groupement mandataire test:** PASS (membership 45 tests; one-mandataire unique index intact)
- **Compliance score test:** PASS (38 tests)
- **Role isolation:** PASS — `(admin)` layout role-gate + `authorized` callback + per-action `role === "admin"` re-check; admin verify + CSV import audit-logged; RLS recursion on groupement_members fixed (SECURITY DEFINER), `current_app_user_id()` empty-GUC crash fixed (NULLIF)
- **CI:** `completed / success` — runs 27401174820, 27402939425, 27403570436
- **main:** 35479a9 (3 Sprint 7 commits: ac190e5, 8453950, 35479a9)
- **DoD items:** 20/20 — admin dashboard (KPIs + scraper health + CSV fallback + FNBTP verification queue + groupement moderation) closes the last open item; deploy verified via Vercel + managed Postgres (CI-green next build) — see docs/DEPLOY.md
- **Project Completion Gate:** full Playwright E2E recorded → `docs/final/` (5 videos, FR + AR/RTL, scenario→DoD README)
- **Security hardening:** CSP + HSTS/X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy headers (next.config); compliance signed-URL 15-min TTLs unchanged
