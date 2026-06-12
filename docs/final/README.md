# Bina v0.1 — End-to-End Walkthrough Videos

These recordings are the **Project Completion Gate** artifact (`.claude/CLAUDE.md`):
the full Playwright E2E suite (`pnpm test:e2e`, `video: "on"`) driving a real
browser through the complete v0.1 user journeys, in **French** and in
**Arabic / RTL**, against a seeded database (8 contractors, 40 tenders, 3
groupements).

Reproduce: `docker compose up -d postgres` → `pnpm --filter @bina/db setup`
(migrate + RLS + seed) → `pnpm --filter web test:e2e`. Demo accounts come from the
seed: `hassan.plomberie@demo.bina.ma / demo1234` (contractor) and
`admin@bina.ma / admin1234` (admin).

## Videos → scenarios → DoD (CLAUDE.md §12)

| Video | Journey | DoD §12 items demonstrated |
|---|---|---|
| `01-tender-radar-public.webm` | Public Tender Radar: landing → radar → status/full-text filters → reset → tender detail (deadline + lots + required trades) → switch to **AR/RTL** | Tender browse (public, filterable, SSR); Tender detail page |
| `02-contractor-journey-fr.webm` | Contractor signs in → dashboard (compliance score) → tender radar + filter + detail → **saved searches/alerts** → **tracked tenders** → **groupement** browse → **compliance vault + dossier builder** | Auth (login); Contractor profile/dashboard; Saved searches + alerts; Tender tracking; Groupement browse; Compliance vault; Dossier builder |
| `03-contractor-journey-ar-rtl.webm` | The contractor dashboard and tender radar rendered in **Arabic, right-to-left** (`dir="rtl"`, `lang="ar"`) | FR + AR + RTL complete |
| `04-admin-journey-fr.webm` | Admin signs in → **admin dashboard with live KPIs** (tenders indexed, active users 30 d, active groupements, alerts 7 d, verification queue) + scraper health → **tender management** (paginated) → **groupement moderation** → **FNBTP verification queue** (audit-logged verify) → **scraper health + CSV fallback import** | Admin dashboard (scraper health, tender counts, active groupements, KPIs); FNBTP verification queue; CSV scraper fallback |
| `05-admin-journey-ar-rtl.webm` | The admin dashboard rendered in **Arabic, right-to-left** | FR + AR + RTL complete (admin surface) |

## Cross-cutting guarantees exercised

- **RBAC / role isolation** — the admin journey only succeeds with the seeded
  `admin` account; the `(admin)` route group is gated server-side and every admin
  server action re-checks `role === "admin"`.
- **Deadlines everywhere** — the radar and detail views show the days-remaining
  countdown (red < 7 d, orange < 14 d).
- **RTL equal** — both contractor and admin surfaces are verified in Arabic/RTL.
- **Tenders are public** — the radar journey runs with no authentication.
