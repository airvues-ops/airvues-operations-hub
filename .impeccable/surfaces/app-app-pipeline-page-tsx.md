---
version: 1
slug: "app-app-pipeline-page-tsx"
primary_target: "app/(app)/pipeline/page.tsx"
related_targets: ["components/pipeline/PipelineDashboard.tsx"]
---

# Projects list (/pipeline)

Mode: Operate. Audience: Airvues ops. Main job (user, 2026-10-02): find a project and open it; secondary: confirm its state at a glance and change its deal stage. Inherits the dashboard world in DESIGN.md (StageSection-era patterns, restrained colour, tabular sans, sentence case). Every existing filter, sort, grouping and stage tab stays reachable. Build path: code-led.

## Direction contract

THESIS: A scan-and-confirm list. Each project is one two-line row (name + value; client/account + stage + one flag), and the selected project's state shows in a preview pane beside it, so you confirm you have the right one before opening. Refuses the 14-column spreadsheet that hid the money off-screen.

OWN-WORLD: DESIGN.md tokens: bg #0B0F17, surface #161C2A, 1px rules, ink scale; stage pills in sentence case with words, emerald done/paid, amber waiting/due soon, red late/lost, sky in progress. Manrope, tabular numerals; no uppercase eyebrows.

STORY: The visitor sees how much is waiting and late, narrows by stage tab or search, arrows through rows watching the preview, and presses Enter or Open to go to the project page.

FIRST VIEWPORT: Title with a clickable summary line (awaiting approval, late, active value) and New proposal at right; stage tabs with correct counts; one toolbar row (search, Filters toggle with active count, sort, group); two-column body: list (left, fluid) and sticky preview (right, ~400px) with journey dots, money, deadline, deal stage select and Open project as the primary action. Below lg the pane disappears and a tap opens the project.

FORM: List + preview pane, position 5 on the ordered list of 7, seed key 8ebe6019.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
