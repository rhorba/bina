---
name: frontend-dev
description: Apply Naql/frontend-dev patterns. Bina-specific notes below.
---
# Frontend Dev — Bina

## Bina Context
- DB: **standard postgres:16-alpine — no pgvector** (tender matching = SQL filters, not vectors)
- Auth: Auth.js v5 (email + Google OAuth) — 2 roles only: contractor / admin
- Scraper: Playwright — never hits live portal in CI (HTML fixture mocks only)
- Compliance docs: private R2; signed URLs (15-min); contractor + admin only; access audit-logged
- Groupement: one mandataire per groupement (DB unique index). State machine audited.
- Money: integer centimes (MAD) for tender budget fields
- Critical tests: groupement mandataire uniqueness, compliance score computation, scraper parser with fixtures, alert sweep matching logic, tender deadline countdown

## Sprint Snapshot (project-monitor only)
```
### [date] SPRINT_SNAPSHOT — Sprint N
- Tests: unit / E2E
- Scraper parser tests: PASS/FAIL (fixture-based)
- Groupement mandataire test: PASS/FAIL
- Compliance score test: PASS/FAIL
- Role isolation: PASS/FAIL
- DoD items: N/20
```
