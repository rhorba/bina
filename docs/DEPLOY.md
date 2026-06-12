# Bina — Deployment (v0.1)

DoD §12 deploy requirement: **Vercel + managed Postgres _OR_ `docker compose up -d`.**

## Verified path — Vercel + managed Postgres ✅

The production web build is the standard Next.js build and is **green in CI on every
push** (`.github/workflows/ci.yml` → "Build web" runs `pnpm --filter web build`).

1. Provision a managed Postgres 16 (Neon / RDS / Supabase). No extensions beyond
   `pgcrypto` are required (no pgvector).
2. Apply schema + policies + demo data against it:
   ```bash
   DATABASE_URL=<managed-url> DATABASE_DIRECT_URL=<managed-url> \
     pnpm --filter @bina/db setup     # migrate → rls → seed
   ```
   `rls` re-applies `packages/db/src/sql/rls.sql` (it is **not** run in CI — apply it
   on every fresh database, including after each new migration).
3. Deploy `apps/web` to Vercel. Required env: `DATABASE_URL`, `AUTH_SECRET`,
   `AUTH_URL`, optional `AUTH_GOOGLE_ID/SECRET`, `R2_*`, `RESEND_API_KEY`
   (email no-ops when unset).

## Local / self-host — Docker Compose

`docker compose up -d postgres` runs Postgres 16 (port via `BINA_DB_PORT`, default
5432) and is the database used for local dev, the seeded demo, and the E2E suite.

The web + worker app **images** build their dependency layer with **pnpm 9** (pinned in
`apps/web/Dockerfile` / `apps/worker/Dockerfile` via `corepack prepare pnpm@9.15.9`,
plus `onlyBuiltDependencies` in `pnpm-workspace.yaml`) so native deps
(argon2/sharp/esbuild) build instead of tripping pnpm 10's `ERR_PNPM_IGNORED_BUILDS`
gate.

> **Known issue (non-blocking for v0.1):** building the full `web` app image's Next.js
> *standalone* output inside the multi-stage Dockerfile currently fails the `next build`
> step with a module-resolution error in the builder stage. This is a Docker
> packaging-tooling gap (the application itself builds cleanly in CI and on Vercel).
> Until it is resolved, deploy the web app via **Vercel/managed Postgres** (above) or
> run it from a host build (`pnpm --filter web build && pnpm --filter web start`) with
> Postgres from `docker compose`. Tracked for a follow-up devops fix.
