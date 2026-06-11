<bina-framework>
Operate inside the Bina specialist-team framework (.claude/CLAUDE.md + root CLAUDE.md). Apply it to THIS task automatically — do not wait to be told.

1. AUTONOMOUS MODE — On any design choice, pick the BALANCED option, state "Proceeding with BALANCED: …", and continue. Proceed through specialist handoffs without pausing for approval.

2. ROUTE TO A SPECIALIST — INVOKE the matching specialist skill via the Skill tool for every task; applying its rules inline is NOT sufficient, the Skill MUST actually be called (before writing that task's code/output): orchestrator=routing · dba=schema/RLS/migrations · backend-dev=server actions/API · frontend-dev=pages/RTL/tables · tender-engine=scraper/parsing/filter+alert matching · groupement-engine=state machine/Moroccan procurement law · compliance-engineer=doc vault/expiry/dossier · security-engineer=auth/PII/role isolation · tester & test-architect=vitest/playwright · ui/ux-designer · content-editor=FR/AR · devops/deployment · tech-lead=architecture/ADRs. A task spanning multiple domains invokes each relevant skill.

3. AUTO-HANDOFF (REAL Skill calls) — After ANY code change, the `tester` skill is a MANDATORY auto-handoff and MUST be invoked via the Skill tool, every time (vitest/playwright). Scraper work → tender-engine + tester (fixture-mocked HTML). Compliance upload → compliance-engineer + security-engineer. Groupement state → groupement-engine. Sprint all-green → project-monitor snapshot. Inline lens-application does not satisfy this — call the Skill.

4. NON-NEGOTIABLES — Honor the 10 Bina rules: compliance docs = private R2 + 15-min signed URLs + audit log (contractor/admin only); tenders are public → SSR + cacheable; scraper 1 req/3 s, nightly only, CSV fallback always; exactly one mandataire per groupement; never certify compliance; no money flows through Bina; deadline countdown everywhere (red <7 d, orange <14 d); RTL equal; FNBTP category gates eligibility. Apply the YAGNI gate — build only what DoD §12 needs; everything else → v0.2 backlog.

5. STOP ONLY FOR — (a) a blocker (portal structure changed / scraper broken / Playwright dep fails), (b) a scope gap not in CLAUDE.md, (c) a DB schema breaking change, (d) a security/compliance PII risk, (e) a sprint boundary. Otherwise keep going.

6. SPRINT EXIT GATE — At every sprint boundary, before moving on, run the mandatory gate (.claude/CLAUDE.md "Sprint Exit Gate"): (i) write+run tests to ≥80% coverage (`pnpm test:coverage`, threshold 80%, never lower it — the 80% gate also runs in CI); (ii) commit and `git push origin main` to GitHub `rhorba/bina` — push DIRECTLY to main, NO PRs and NO feature branches; (iii) monitor CI (`gh run watch <id> --exit-status`) and fix+re-push until it is `completed / success` — a push is not done while CI is red; (iv) save a session checkpoint and end (see #7). Report coverage %, pushed commit, and green CI.

CI IS SACRED — after ANY push to main, watch the GitHub Actions run and resolve every failure (lint, build, tests, coverage) until the whole pipeline is green. Never leave CI red.

7. SESSION CHECKPOINT — At every sprint boundary AND whenever the user signals they want to quit/stop the conversation: first save the current session state (update the sprint-progress memory + write a `session-state` handoff — sprint #, what's done this session, exact next step, active branch, open blockers, env gotchas), then end the session cleanly so the next one resumes. Checkpoint first, then stop.

8. PROJECT COMPLETION GATE — The detailed Playwright E2E browser video is recorded ONLY once, after ALL sprints are finished (v0.1 ship), NOT each sprint: run the full E2E suite (`pnpm test:e2e`, video on) walking the complete v0.1 journeys in FR and AR/RTL, and save the recordings to `docs/final/` with a scenario→DoD README.
</bina-framework>
