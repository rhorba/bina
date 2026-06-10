# Bina — بناء

**Trouvez les marchés. Formez votre équipe. Gagner ensemble.**
_Find the tenders. Form your team. Win together._

Bina is Morocco's first platform built for construction SMEs — tender intelligence
from marchespublics.gov.ma, consortium (groupement) formation, and compliance
management — for the World Cup 2030 construction supercycle.

---

## The Problem We Solve

- **550 billion MAD** in construction investments 2024–2030 (Bati.ma / Médias24)
- **380 billion MAD** public investment in Loi de Finances 2026 — historically highest
- **1.24 million workers** in BTP (6% of GDP, +4.1% growth in 2026)
- World Cup 2030 economic impact: **2.8 billion euros** + **335,000 jobs**
- But: 6 large groups capture most big contracts; SMEs face 3 blockers:
  1. marchespublics.gov.ma is unusable (200+ tenders/week, no smart filtering)
  2. Large contracts require groupements that don't self-assemble
  3. Compliance dossiers take days to assemble per bid

Bina solves all three.

---

## Quick Start

```bash
git clone https://github.com/rhorba/bina.git && cd bina
cp .env.example .env
pnpm install
docker compose up -d postgres   # standard postgres:16-alpine — NO pgvector needed
pnpm db:migrate
pnpm db:seed
pnpm dev   # http://localhost:3000
```

**Demo login**: hassan.plomberie@demo.bina.ma / demo1234

---

## Architecture

```
bina/
├── apps/web/
│   ├── (public)/       Tender browse (SSR, no auth — SEO-optimized)
│   ├── (contractor)/   Contractor dashboard
│   └── (admin)/        Admin dashboard
└── packages/
    ├── core/           Money, RBAC, TradeSpecialty enum
    ├── db/             Drizzle + RLS (postgres:16-alpine — no pgvector)
    ├── scraper/        Playwright scraper for marchespublics.gov.ma
    ├── tenders/        Parser, filter matching, alert sweep
    ├── groupement/     State machine + Moroccan procurement law rules
    ├── compliance/     Document vault, expiry, dossier builder
    └── notifications/  In-app + Resend email
```

---

## Key Differences from Other Frameworks in This Portfolio

| | Mahara | Riaya | Kasb | Mawsim | **Bina** |
|---|---|---|---|---|---|
| DB | pgvector | pgvector | postgres | pgvector | **postgres:16-alpine only** |
| Scraping | No | No | No | No | **Yes (Playwright)** |
| Roles | 3 | 4 | 3 | 4 | **2 only** |
| Payments | Yes | Yes | No | Yes | **No (SaaS only)** |
| Public data | No | No | Price board | Price board | **Tender browse (SEO)** |
| Unique package | matching | booking+verify | credit+pwa | market+logistics | **scraper+groupement** |

---

## Scraper Notes

The scraper uses Playwright to parse marchespublics.gov.ma (public government data).
- Runs nightly at 6am via pg-boss
- Rate limited: 1 request / 3 seconds
- CI tests use captured HTML fixtures — scraper never runs in CI
- Admin can manually import CSV if scraper breaks

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres URL (RLS-bound app role) |
| `AUTH_SECRET` | 32-byte random |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` | Transactional email |
| `R2_PRIVATE_*` | Cloudflare R2 private (compliance docs) |
| `R2_PUBLIC_*` | Cloudflare R2 public (project photos) |
| `SCRAPER_ENABLED` | `true` in prod / `false` in CI |

---

v0.1 — Built with Claude Code · Powered by data from HCP, Médias24, Bati.ma, FNBTP
