# Bina — Deployment (v0.1)

DoD §12 deploy requirement: **Vercel + managed Postgres _OR_ `docker compose up -d`.**

Sprint 7 only verified the build was CI-green and documented a path — nothing was
actually deployed live. **Sprint 8** (`.claude/sprint-backlog/sprint-8.md`) provisioned
a real production deployment on **Railway** and, in doing so, found and fixed two bugs
that had gone undetected since Sprint 0/7 because neither CI nor local dev exercises a
full Docker image build:

1. **`next@15.1.3` had a since-disclosed CRITICAL CVE** (CVE-2025-66478, plus three
   more) — Railway's deploy-time security scan blocked the build outright. Fixed by
   bumping to `15.1.11` (smallest safe patch in the same minor line).
2. **Both Dockerfiles' `deps` stage only copied `package.json` for `core`/`db` plus the
   app itself** — never for the other `@bina/*` workspace packages each app actually
   depends on (`compliance`, `groupement`, `notifications`, `scraper`, `tenders`).
   Without those `package.json` files present in the build context, pnpm can't link
   them into `node_modules`, so `tsc`/`next build` fails with "Cannot find module
   '@bina/...'" even though the `pnpm install` step itself reports success. **This is
   what the "known issue... Docker packaging-tooling gap" note below used to describe —
   it was never a tooling gap, just missing `COPY` lines.** Fixed in both
   `apps/web/Dockerfile` and `apps/worker/Dockerfile`.

## Verified path — Railway ✅ (production)

- **`web`** — Railpack builder (not the Dockerfile — Railway's own buildpack build,
  `pnpm --filter web build` / `pnpm --filter web start`), root directory left at repo
  root so the pnpm workspace install has full context. Public domain, `AUTH_URL` /
  `NEXT_PUBLIC_APP_URL` set via the `${{RAILWAY_PUBLIC_DOMAIN}}` template reference.
- **`worker`** — Dockerfile builder (`apps/worker/Dockerfile`, build context = repo
  root, **not** scoped to `apps/worker` — the Dockerfile's `COPY` paths assume root
  context, same as `docker-compose.yml`'s `context: .`). Runs the pg-boss job loop
  (`scraper.daily`, `alert.sweep`, `deadline.reminder`, `doc.expiry.sweep`,
  `groupement.archive`); `SCRAPER_ENABLED` defaults off until explicitly verified live.
- **Postgres** — Railway-managed plugin. Schema + RLS + demo seed applied once via a
  temporary TCP proxy (`railway tcp-proxy create --port 5432 --service Postgres`, run
  `pnpm --filter @bina/db setup`, then delete the proxy — Railway's private
  `postgres.railway.internal` hostname is only reachable from other Railway services,
  not from a local machine).

## Alternative — Vercel + managed Postgres

Still works if preferred over Railway. The production web build is the standard
Next.js build and is **green in CI on every push**
(`.github/workflows/ci.yml` → "Build web" runs `pnpm --filter web build`).

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
   (email no-ops when unset). Note: Vercel has no long-running process for the worker's
   pg-boss job loop — the scraper/alert/expiry jobs need a separate host (e.g. the
   Railway `worker` service above, or a cron-triggered serverless function per job).

## Local / self-host — Docker Compose

`docker compose up -d postgres` runs Postgres 16 (port via `BINA_DB_PORT`, default
5432) and is the database used for local dev, the seeded demo, and the E2E suite.

The web + worker app **images** build their dependency layer with **pnpm 9** (pinned in
`apps/web/Dockerfile` / `apps/worker/Dockerfile` via `corepack prepare pnpm@9.15.9`,
plus `onlyBuiltDependencies` in `pnpm-workspace.yaml`) so native deps
(argon2/sharp/esbuild) build instead of tripping pnpm 10's `ERR_PNPM_IGNORED_BUILDS`
gate. Both images now build cleanly end-to-end (see fix #2 above) — `docker compose up`
for the full stack is unblocked as of Sprint 8.
