# Sprint 8 — Production Deploy (Go Live)

**Duration**: 1–2 sessions | **Depends on**: Sprint 7 (v0.1 ship — code-complete, 20/20 DoD, CI green)

## Context — what Sprint 7 actually delivered vs. what's still open

`docs/DEPLOY.md` documents a deploy **path**, and `docs/progress/sprint-7-snapshot.md` records
it as "deploy verified via Vercel + managed Postgres (CI-green next build)." That means: the
production build passes in CI. It does **not** mean bina is running anywhere with a public URL.
**No live deployment exists yet.** This sprint closes that gap for real.

Two gaps found while reading the deploy path that DEPLOY.md doesn't mention:

1. **`apps/worker/Dockerfile` has no Chromium/Playwright install.** It's a plain `node:22-alpine`
   image. `@bina/scraper` depends on `playwright` (`packages/scraper/package.json`) to drive a
   real headless browser against marchespublics.gov.ma. E2E tests never caught this because they
   run against captured HTML fixtures, never a real browser — so the worker would crash on its
   first real `scraper.daily` run in production.
2. **`SCRAPER_ENABLED` is dead config.** It's documented in `.env.example` ("true in prod / false
   in CI") but never read anywhere in `apps/worker` or `packages/scraper`. Either wire it up as a
   real kill-switch or drop it from the docs — leaving it as-is is misleading.

Also carried over from DEPLOY.md: the **web app's Docker standalone build is broken** (module
resolution error in the multi-stage build's builder stage) — tracked as non-blocking because
Vercel and CI both build the app fine without Docker. Decision below (S8-02) is to sidestep it
rather than fix it now — YAGNI: Railway's Nixpacks builder doesn't need the Dockerfile at all.

## Must
- [ ] S8-01 — DevOps: fix `apps/worker/Dockerfile` — switch to a Playwright-compatible base
      (`mcr.microsoft.com/playwright:v1.49.1-jammy` or Debian slim + `playwright install
      --with-deps chromium`); alpine/musl is not reliably supported by Playwright's bundled
      Chromium — **DevOps/DevSecOps**
- [ ] S8-02 — Deployment: choose Railway build method — **BALANCED: Nixpacks (auto-detected
      pnpm/Node build), not the broken web Dockerfile** — confirms via `pnpm --filter web build`
      + `pnpm --filter web start`, the same path already green in CI and on Vercel. Log the
      Docker standalone fix as a v0.2 backlog item, not a blocker — **Deployment**
- [ ] S8-03 — Deployment: provision Railway project — Postgres plugin (16.x) + `web` service +
      `worker` service, both pointed at this repo/branch `main` — **Deployment** (needs user's
      Railway account)
- [ ] S8-04 — DBA: apply `pnpm --filter @bina/db setup` (migrate → RLS → seed) against the
      Railway Postgres instance — confirm `rls.sql` is re-applied (DEPLOY.md: not run in CI,
      must run manually on every fresh DB) — **DBA**
- [ ] S8-05 — DevOps: set required env vars on both Railway services — `DATABASE_URL`,
      `AUTH_SECRET` (fresh `openssl rand -base64 32`, not the CI test value), `AUTH_URL` (live
      origin), `NEXT_PUBLIC_APP_URL`, `NODE_ENV=production` — **DevOps/DevSecOps**
- [ ] S8-06 — Deployment: wire external accounts — Cloudflare R2 (2 buckets: `bina-compliance`
      private, `bina-public` public + custom domain/public URL), Resend (verified sender domain
      or accept `onboarding@resend.dev` limits for launch) — **Deployment** (needs user's
      Cloudflare + Resend accounts)
- [ ] S8-07 — Security: decide Google OAuth now vs. defer — email+password already works
      standalone; `AUTH_GOOGLE_ID/SECRET` are optional per DEPLOY.md — **Security Engineer**
      (needs user decision + Google Cloud console access if yes)
- [ ] S8-08 — DevOps: domain — point `bina.ma` at Railway if owned and ready, otherwise ship on
      the Railway-provided subdomain and defer the domain cutover — **DevOps/DevSecOps** (needs
      user's DNS access if using the real domain)
- [ ] S8-09 — Backend: wire `SCRAPER_ENABLED` as a real guard in `apps/worker/src/index.ts`
      around the `scraper.daily` handler (skip + log if `"true"` isn't set) so a fresh prod
      deploy doesn't start scraping a live government site before it's verified end-to-end —
      **Backend Dev**
- [ ] S8-10 — Security: verify security headers (CSP/HSTS/X-Frame-Options/nosniff/
      Referrer-Policy/Permissions-Policy) actually present on live response headers, not just
      declared in `next.config.ts` — **Security Engineer**
- [ ] S8-11 — Deployment: confirm `worker` service is running continuously and pg-boss has
      registered all 5 cron schedules (`scraper.daily` 6am, `alert.sweep` 7am,
      `deadline.reminder` 7:30am, `doc.expiry.sweep` 8am, `groupement.archive` weekly) — check
      worker logs for registration, not just "container started" — **Deployment**
- [ ] S8-12 — Tester: live smoke test against the production URL — signup, login, public tender
      browse loads, one manual scraper run triggered by hand (not waiting for 6am) and verified
      in the DB — **Tester**
- [ ] S8-13 — Project Monitor: Sprint 8 snapshot — record the live URL, confirm DoD §12's deploy
      item is now genuinely live (not just CI-buildable), update `docs/DEPLOY.md` with the actual
      production path taken — **Project Monitor**

## Needs from you before S8-03 can start
- [ ] Confirm you're logged into Railway in Chrome (or share account details) so I can provision
      via browser automation
- [ ] Cloudflare account with R2 enabled — logged in, or credentials to create the 2 buckets +
      API token
- [ ] Resend account — logged in, or accept `onboarding@resend.dev` (limited: delivers only to
      your own Resend account owner email) for initial launch
- [ ] Google OAuth: set up now, or defer to v0.2 (email/password works without it)
- [ ] Domain: is `bina.ma` actually registered/available to point at Railway, or ship on a
      Railway subdomain for now?

---
