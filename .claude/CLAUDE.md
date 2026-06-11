# Bina — Claude Code Team Framework

> Read `../CLAUDE.md` for full business rules, data model, and tech stack.
> This file governs HOW the AI team works.

---

## Autonomous Mode (default)

- **Design choices**: Always pick 🟡 **BALANCED**.
- **Specialist handoffs**: Proceed automatically.
- **Testing**: After ANY code task, auto-invoke Tester.

### Stop only for
1. Blocker (marchespublics.gov.ma structure changed, scraper broken, Playwright dep fails)
2. Scope gap not in `../CLAUDE.md`
3. DB schema breaking change
4. Security/compliance doc PII risk
5. Sprint boundary

---

## Specialist Skill Invocation (NON-NEGOTIABLE — applies to ALL sprints, ALL sessions)

**For every task, invoke the matching specialist skill via the Skill tool — applying the
specialist's rules inline is NOT sufficient, the Skill MUST actually be called.**

- Match the task to its specialist and call it through the Skill tool BEFORE writing the
  code/output for that task:
  - `dba` — schema, RLS, migrations
  - `backend-dev` — server actions, API routes
  - `frontend-dev` — pages, RTL, data tables, components
  - `tender-engine` — scraper, parsing, filter + alert matching
  - `groupement-engine` — state machine, workspace, Moroccan procurement law
  - `compliance-engineer` — document vault, expiry, dossier builder
  - `security-engineer` — auth, PII, role isolation
  - `content-editor` — FR/AR translations, BTP/procurement vocabulary
  - `ui-designer` / `ux-designer` — tokens, wireframes, contractor UX
  - `tester` / `test-architect` — vitest/playwright, adversarial cases
  - `devops-devsecops` — Docker, CI, secrets
  - `deployment` — Vercel + Docker verify
  - `tech-lead` — architecture, ADRs, stack enforcement
  - `orchestrator` — session start, routing across multiple specialists
- A task spanning multiple domains invokes each relevant skill (e.g. a new page touching the
  DB invokes `dba`, then `backend-dev`, then `frontend-dev`).
- **After ANY code change, the `tester` skill is a MANDATORY auto-handoff — it MUST be
  invoked via the Skill tool, every time.** Domain auto-handoffs from the table below also
  fire as real Skill calls (scraper → `tender-engine` + `tester`; compliance upload →
  `compliance-engineer` + `security-engineer`; groupement state → `groupement-engine`;
  sprint all-green → `project-monitor`).
- This rule never lapses across sessions or sprints — it is enforced on every prompt via the
  `UserPromptSubmit` hook (`.claude/framework-directive.md`).

---

## Sprint System

| Sprint | Goal |
|---|---|
| **Sprint 0** | Scaffold + Auth + RBAC + RLS + Docker |
| **Sprint 1** | Data model + Contractor profiles + Project references + demo seed |
| **Sprint 2** | Tender scraper + tender browse (public SSR) + tender detail |
| **Sprint 3** | Saved searches + alert engine + tender tracking dashboard |
| **Sprint 4** | Groupement system (create + browse + join + workspace) |
| **Sprint 5** | Compliance vault + document expiry + dossier builder |
| **Sprint 6** | Notifications + email + i18n FR/AR + RTL + a11y |
| **Sprint 7** | Admin dashboard + security hardening + deploy → v0.1 ship |

---

## Auto-Handoff Protocol

| When | Auto-trigger |
|---|---|
| Backend/Frontend DONE | → Tester |
| Scraper work | → Tender Engine + Tester (scraper tests use mocked HTML) |
| Groupement state machine | → Groupement Engine |
| Compliance doc upload | → Compliance Engineer + Security |
| Alert sweep | → Tender Engine + Backend |
| All sprint tests PASS | → Deployment check |
| Sprint all-green | → Project Monitor: snapshot |

---

## Specialist Skills

| Specialist | Trigger |
|---|---|
| Orchestrator | Session start, routing |
| Project Manager | Scope, risks |
| Scrum Master | Sprint planning |
| Tech Lead | ADRs, stack |
| DBA | Schema, RLS, migrations (standard postgres:16-alpine) |
| Backend Dev | Server actions, API routes |
| Frontend Dev | All web pages, RTL, data tables |
| Tender Engine | Scraper, parsing, filter matching, alert sweep |
| Groupement Engine | State machine, workspace logic, Moroccan procurement law |
| Compliance Engineer | Document vault, expiry, dossier builder, R2 private |
| Tester | Vitest, Playwright |
| Test Architect | Adversarial, scraper mocks, groupement edge cases |
| Security Engineer | Auth, compliance docs PII, role isolation |
| DevOps/DevSecOps | Docker (standard postgres:16-alpine), CI, secrets |
| Deployment | Vercel + Docker verify |
| UX Designer | Wireframes, contractor UX, mobile-friendly |
| UI Designer | Steel blue/orange tokens, data tables, deadline chips |
| Content Editor | FR/AR, BTP vocabulary, procurement terminology |
| Project Monitor | Logs, KPIs, snapshots |

---

## Bina-Specific Non-Negotiables

1. **Compliance documents are sensitive PII** — attestation fiscale + CNSS quitus contain company financial data. Private R2 bucket. Signed URLs (15-min expiry). Contractor + admin only. Every access audit-logged.
2. **Tender data is public — treat it that way** — marchespublics.gov.ma is public data. No auth required to browse tenders. SSR + cached for SEO. This is the acquisition hook.
3. **Scraper is rate-limited** — 1 request per 3 seconds. Runs nightly at 6am only. Has a CSV manual import fallback in case the portal changes structure. Never scrape more than once per day.
4. **Groupement mandataire is legally required** — Moroccan procurement law requires one mandataire (responsible lead) per groupement. Every groupement must designate one. UI must enforce this.
5. **Bina never certifies compliance** — the platform organizes documents but never guarantees a contractor IS compliant. Clear disclaimer on dossier builder output.
6. **No money flows through Bina** — SaaS subscription tool only. No procurement intermediary role. No commission on tender wins.
7. **Deadlines are the primary urgency signal** — every tender view shows days-remaining countdown. Red when < 7 days. Orange when < 14 days.
8. **RTL equal** — Arabic-speaking contractors are a major segment.
9. **FNBTP category determines tender eligibility** — many tenders require specific FNBTP qualification categories. Filter + alert logic must respect this.
10. **Scraper fallback** — if marchespublics.gov.ma structure changes, admin can manually import a CSV export. Never fully dependent on scraper.

---

## Sprint Exit Gate (MANDATORY — run at the end of every sprint, before moving on)

No sprint is "done" until ALL of the following pass. This is in addition to the
per-task auto-handoff to Tester.

1. **≥ 80% code coverage — written AND run, AND enforced in CI.** Add/extend tests
   until coverage is ≥ 80% (lines & statements), then prove it: `pnpm test:coverage`
   (per-package `vitest run --coverage`, threshold 80%). If a package is below 80%,
   write the missing tests — **never lower the threshold**. The 80% gate also runs in
   GitHub Actions (`.github/workflows/ci.yml`), so a push below 80% fails CI.
2. **Push DIRECTLY to `main` — no PRs, no feature branches.** Work on `main`, commit
   the sprint work, and `git push origin main` to **`rhorba/bina`** (remote `origin` =
   `https://github.com/rhorba/bina.git`; GitHub user `rhorba`, project `bina`). Do not
   create branches and do not open pull requests.
3. **CI must be all green — monitor and fix until it is.** After every push, monitor
   the run (`gh run watch <id> --exit-status`). If anything fails, diagnose, fix, and
   re-push — repeat until the run is `completed / success`. A push is not "done" while
   CI is red.
4. **Session checkpoint → end the session.** Save the current session state so the
   next session resumes seamlessly: update the sprint-progress memory + write a
   `session-state` handoff (sprint #, what's done this session, exact next step,
   active branch, open blockers, env gotchas). Then end the session cleanly. Do this
   at every sprint boundary **and** whenever the user signals they want to quit /
   stop the conversation — checkpoint first, then stop.

> Stop at the sprint boundary (per Autonomous Mode stop condition #5) to run this
> gate. Report coverage % and the pushed commit, confirm CI is green, then checkpoint.

---

## Project Completion Gate (run ONCE, after ALL sprints are finished — v0.1 ship)

The detailed browser video is recorded **only when every sprint is done**, not each
sprint:

- **Record detailed E2E browser video(s) → `docs/`.** Run the full Playwright E2E
  suite with video on (`pnpm test:e2e`, config sets `video: "on"`). The suite must
  walk the complete v0.1 user journeys end-to-end (tender radar → filters → detail →
  saved searches/alerts → groupement → compliance vault/dossier → admin), in FR and
  in AR/RTL. Save the recordings to `docs/final/` with a `README.md` mapping each
  video to the scenarios and DoD items (§12) it demonstrates.

---

## YAGNI Gate
```
"Does Bina v0.1 need this for the DoD (../CLAUDE.md §12)?"
  YES → Build it   |   NO → v0.2 backlog only
```

## 3-Option Pattern (always pick 🟡 BALANCED)
```
🟢 SIMPLE | 🟡 BALANCED ← SELECTED | 🔴 COMPREHENSIVE
→ "Proceeding with 🟡 BALANCED approach: [description]"
```
