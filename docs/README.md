# Bina — Sprint & Project Artifacts (`docs/`)

Per the **Sprint Exit Gate** and **Project Completion Gate** (`.claude/CLAUDE.md`):

## Every sprint (Sprint Exit Gate)

1. **≥ 80% code coverage** — written and run via `pnpm test:coverage`
   (per-package `vitest run --coverage`, threshold 80%; never lower the threshold —
   add tests). The HTML report lives at each package's `coverage/` (gitignored); the
   text summary is saved to the sprint folder below.
2. **GitHub push** — the sprint branch + coverage summary are pushed to
   `https://github.com/rhorba/bina` (user `rhorba`, project `bina`) and its PR into
   `main` is opened/updated.
3. **Session checkpoint** — session state is saved (sprint-progress memory +
   `session-state` handoff) and the session ends cleanly so the next one resumes.
   Also triggered whenever the user wants to quit the conversation.

## Once, after ALL sprints (Project Completion Gate — v0.1 ship)

- **Detailed E2E browser video(s)** — `pnpm test:e2e` runs the full Playwright suite
  (`apps/web/e2e/`) with video recording on, walking the complete v0.1 user journeys
  in FR and AR/RTL. The recordings are saved to `docs/final/`. **The video is NOT
  recorded per sprint** — only at project completion.

## Layout

```
docs/
  README.md                ← this file
  sprint-<N>/
    coverage-summary.txt    ← text-summary output of pnpm test:coverage
  final/                    ← produced once, after all sprints
    README.md               ← maps each video to scenarios + DoD §12 items
    e2e-<journey>.webm      ← Playwright videos of the full v0.1 journeys
```

## Commands

```bash
# Per sprint — coverage (must be ≥80%) + push
pnpm test:coverage | tee docs/sprint-<N>/coverage-summary.txt
git push origin <sprint-branch>      # → rhorba/bina, update PR into main

# Once, at v0.1 ship — record the full browser journey videos
pnpm test:e2e                        # video on; writes apps/web/test-results/**/video.webm
#   cp apps/web/test-results/**/video.webm docs/final/e2e-<journey>.webm
```
