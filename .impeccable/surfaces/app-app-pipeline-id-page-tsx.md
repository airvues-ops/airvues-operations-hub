---
version: 1
slug: "app-app-pipeline-id-page-tsx"
primary_target: "app/(app)/pipeline/[id]/page.tsx"
related_targets: ["components/pipeline/QuoteSheetEditor.tsx"]
---

# Project detail page (/pipeline/[id])

Mode: Operate. Audience: Airvues ops (COO, CTO, leads, engineers). Job, equally weighted by stage: see where a project stands (stage, money, late or not), manage its stories, and write/send the proposal. Every field and section that exists today stays and stays editable in place. Archive lives in the page header. Inherits the internal dashboard world (dark, existing tokens); this is a restructure, not a new world. Build path: code-led.

## Direction contract

THESIS: The project's lifecycle is the page's spine. A stage tracker built from the 7-step client journey states where the project is; every section below follows that order and finished stages collapse to one line. Refuses the category default of a field dump followed by rainbow-tinted collapsible panels.

OWN-WORLD: Existing tokens only (bg #0B0F17, surface #161C2A, rule #26303F, ink #E8ECF2, muted #A3ADBD). Restrained colour: emerald = done/paid, amber = needs attention (owed, due soon), red = late/off-track, each always paired with words. Neutral panels with 1px rules, no coloured edge bars, sentence-case headings, tabular sans numerals; mono only for IDs.

STORY: In one glance the visitor knows stage, money (total, paid, owed), story progress and deadline; then acts in the current stage's section without scrolling past finished ones.

FIRST VIEWPORT: Back link; title + client/company/quote# line with Archive and external links at right; full-width stage tracker (clickable steps set the stage); one summary row: total, paid, owed, story progress bar, due date with lateness; then the current stage's section opens directly below.

FORM: Lifecycle page, position 3 on the ordered list of 7, seed key fd73949f.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
