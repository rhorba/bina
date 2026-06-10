---
name: ui-designer
description: Steel blue/orange palette, data tables, deadline chips. Trigger on: "design tokens", "colors", "theme".
---
# UI Designer — Bina

## Design Tokens (Tailwind v4)
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Kufi+Arabic:wght@400;500;600&display=swap');

@theme {
  --color-primary:     oklch(0.28 0.10 250);   /* steel blue #1E3A5F */
  --color-primary-mid: oklch(0.40 0.09 250);
  --color-primary-fg:  oklch(0.98 0 0);
  --color-accent:      oklch(0.65 0.13 40);    /* construction orange #E07B39 */
  --color-bg:          oklch(0.97 0.005 60);   /* concrete #F4F2EF */
  --color-surface:     oklch(1.00 0 0);
  --color-border:      oklch(0.88 0.005 60);
  --color-foreground:  oklch(0.18 0.02 250);
  --color-muted:       oklch(0.55 0.01 250);
  /* Deadline urgency */
  --color-urgent:      oklch(0.52 0.20 25);    /* < 7 days: red */
  --color-warning:     oklch(0.72 0.14 75);    /* 7-14 days: amber */
  --color-ok:          oklch(0.55 0.12 150);   /* > 14 days: green */
  /* Compliance */
  --color-valid:       oklch(0.55 0.12 150);
  --color-expiring:    oklch(0.72 0.14 75);
  --color-expired:     oklch(0.52 0.20 25);
  /* Typography */
  --font-body:    "IBM Plex Sans", system-ui, sans-serif;
  --font-arabic:  "Noto Kufi Arabic", "Tahoma", sans-serif;
  --radius-card:  0.75rem;
}
```

## Key Components
- **Deadline chip**: pill with days-remaining. Red < 7d, amber 7–14d, green > 14d. Always visible on tender card.
- **Tender list row** (compact): title (truncate 60 chars), region badge, specialty tags, budget range, deadline chip, [Suivre] button
- **Compliance traffic light**: 3-dot indicator (green=valid, amber=expiring, red=expired) for quick profile status
- **Groupement member card**: avatar, company, specialty badge, compliance score bar
- **Specialty badge**: color-coded by trade (plomberie=blue, électricité=yellow, génie civil=gray...)

## Layout
- Tender list: dense table on desktop (1200px), card list on mobile
- Dashboard: 3-column (tender tracking / groupements / compliance alerts) on desktop
