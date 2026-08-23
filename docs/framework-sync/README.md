# Framework sync — CTS → Bina (2026-08-23)

`merge_skills.py` is the script used once to adapt Bina onto the full CTS specialist
framework (commit `1687148`). It merged each shared skill's full generic CTS content
into Bina's existing `.claude/skills/*/SKILL.md` overlay files (which had only ever
had a short Bina-specific note, never the actual generic instructions) and copied in
the 7 specialists CTS has that Bina didn't (`design-loop`, `content-marketer`,
`copywriter`, `creative-intelligence`, `digital-marketer`, `software-architect`,
`system-designer`).

It expects a sibling checkout of `rhorba/CTS` and this repo side by side (as
`cts-repo/` and `bina-repo/`) — kept here as a record of what was done and a
starting point if CTS gets new specialists again in the future, not meant to be run
as-is without adjusting those paths.
