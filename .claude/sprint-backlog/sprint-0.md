# Sprint 0 — Scaffold + Auth + RBAC + RLS

**Goal**: `pnpm dev` works. Auth (2 roles). Postgres running. Role isolation proven.
Standard postgres:16-alpine — no pgvector needed.

**Duration**: 1–2 sessions | **Auto-handoff**: ENABLED

## Must
- [ ] S0-01 — pnpm workspace: `apps/web`, `packages/core|db|scraper|tenders|groupement|compliance|notifications` — **Tech Lead**
- [ ] S0-02 — `apps/web` Next.js 15 App Router + TypeScript strict + Biome — **Tech Lead**
- [ ] S0-03 — `packages/core`: `Money` type, `Role` enum (contractor/admin), RBAC, Zod, TradeSpecialty enum — **Tech Lead**
- [ ] S0-04 — `packages/db`: Drizzle config + `users` table — **DBA**
- [ ] S0-05 — RLS: `withUserContext` helper + policies — **DBA** → Security
- [ ] S0-06 — DB init: RLS-bound app role (standard postgres:16-alpine) — **DBA** → DevOps
- [ ] S0-07 — Auth.js v5: email+Argon2id + Google OAuth; session `{ userId, role, contractorId? }` — **Security**
- [ ] S0-08 — `withRole()` server action factory — **Backend Dev**
- [ ] S0-09 — Signup: create contractor user; login page — **Backend Dev**
- [ ] S0-10 — next-intl fr/ar + `[locale]` layout + `dir` switch — **Frontend Dev**
- [ ] S0-11 — Tailwind v4 + steel blue/orange tokens + shadcn/ui — **UI Designer**
- [ ] S0-12 — App shell: sidebar (Radar / Groupements / Dossier / Profil), top bar — **Frontend Dev**
- [ ] S0-13 — Docker Compose (postgres:16-alpine + web + worker + caddy) + .env.example — **DevOps**
- [ ] S0-14 — pg-boss worker: queues (scraper.daily, alert.sweep, doc.expiry.sweep, groupement.archive) — **DevOps**
- [ ] S0-15 — GitHub Actions CI: **postgres:16-alpine** (standard — no pgvector image needed) — **DevOps**
- [ ] S0-16 — Tester: role isolation; compliance doc 403 for other contractor — **Tester**
- [ ] S0-17 — Sprint 0 snapshot → ask for Sprint 1 approval

## DoD — Sprint 0
- [ ] `pnpm install`/`dev`/`build` pass; Docker works (postgres:16-alpine)
- [ ] Signup as contractor; login; protected routes 401 without session
- [ ] Role isolation test passes; FR/AR routing; `pnpm test`/`lint` clean
