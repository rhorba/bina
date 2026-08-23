# Bina pitch deck

`bina-pitch-deck.pptx` — 16-slide French pitch deck built from this repo's own
`CLAUDE.md` (§1 market data, §2 positioning, §3 modules, §12 DoD status, §13 roadmap)
and the `ui-designer` skill's design tokens (steel blue / construction orange). No
fabricated traction or revenue numbers — v0.1 is presented as code-complete/DoD-met,
not as having live users yet.

`build_pitch.py` regenerates it via `python-pptx` (`pip install python-pptx`, then
`python build_pitch.py` from this folder). Edit the slide content/copy directly in the
script — each slide is built from an explicit content list near the top of its
section, not pulled from a template file.

No visual render/critic pass (`design-loop` skill) was run against this version — no
PowerPoint/LibreOffice was available in the environment that built it. Recommended
before using this deck externally: open it once, skim for layout/overflow issues, and
run it through `design-loop` if anything looks off.
