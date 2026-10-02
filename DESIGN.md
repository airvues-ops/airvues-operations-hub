---
name: Airvues Ops
description: Internal operations dashboard for Airvues LLC. Dark, dense, numbers-first.
colors:
  bg: "#0B0F17"
  bg-elevated: "#131825"
  surface: "#161C2A"
  surface-2: "#1A2030"
  sidebar: "#0D121C"
  ink: "#E8ECF2"
  ink-strong: "#F8FAFC"
  ink-muted: "#A3ADBD"
  ink-faint: "#6B7585"
  rule: "#26303F"
  rule-soft: "#1A2030"
  rule-strong: "#34405A"
  navy: "#2B4257"
  emerald: "#22D3A8"
  emerald-soft: "rgba(34, 211, 168, 0.10)"
  amber: "#FBBF24"
  amber-soft: "rgba(251, 191, 36, 0.10)"
  red: "#FB7185"
  red-soft: "rgba(251, 113, 133, 0.10)"
  sky: "#7DD3FC"
  sky-soft: "rgba(125, 211, 252, 0.10)"
  violet: "#C4B5FD"
  violet-soft: "rgba(196, 181, 253, 0.10)"
  stage-draft: "#8B95A7"
  stage-awaiting-payment: "#F0ABFC"
  stage-auditing: "#FB923C"
  stage-cancelled: "#A8A29E"
typography:
  headline:
    fontFamily: "Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  stat:
    fontFamily: "Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "tnum"
  title:
    fontFamily: "Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  mono-id:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  card: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.emerald}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-destructive-idle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-destructive-armed:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.red}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  input:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  stage-section:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "10px 12px 10px 16px"
  stat-cell:
    backgroundColor: "{colors.surface}"
    padding: "12px 16px"
  chip-status:
    textColor: "{colors.emerald}"
    typography: "{typography.mono-id}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  nav-item-active:
    backgroundColor: "{colors.emerald-soft}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
---

# Design System: Airvues Ops

Scope: the internal dashboard under `app/(app)` and its shared components. The client portal (`app/portal`, its own `portal.css`, light ground) is a separate world described by PRODUCT.md; PRODUCT.md states the dark dashboard theme is explicitly not binding there. Nothing in this file applies to the portal. The login page (`app/(auth)/login`) is a brand expression inside this world (aurora blobs, grain, particle network) and its effects stay on that page.

## Overview

**Creative North Star: "The Night Ledger"**

A dark, dense working surface for people who come back to it many times a day: the COO checking money, leads moving stories, engineers logging work. Near-black ground, slightly lifted panels, hairline rules, and a small set of vivid semantic colours that only show up when something is done, owed, late, or client-visible. Text is small (13px body) because the screen holds a lot of it. Hierarchy comes from weight and ink tone, not size jumps.

The system is mid-migration. The project detail page (`/pipeline/[id]`) set the forward direction: neutral panels on 1px rules, sentence-case section titles, a lifecycle mark instead of a coloured rail, numbers in tabular sans. Older pages still use the shared `Section` component with a coloured left rail and an uppercase spaced title, plus `.eyebrow` labels. Treat those as legacy. New and reworked surfaces follow the StageSection pattern.

**Key Characteristics:**
- Dark tonal layering (bg, elevated, surface) with 1px rules; almost no shadow.
- Colour carries status only, and always sits next to a word that says the same thing.
- Manrope everywhere, tabular figures for numbers, JetBrains Mono only for IDs and machine strings.
- Dense: 11-13px working text, 6px/12px control padding, 12px gaps between panels.
- Collapsible sections that remember their state per viewer (localStorage).

## Colors

A cool near-black base with four vivid signal colours tuned to read against it.

### Primary
- **Signal Emerald** (`emerald`): done, paid, completed, and the primary action. Filled buttons (emerald fill, bg-coloured text), the active nav marker, the current and finished steps of the stage tracker, progress fills, the text selection colour, and focus rings on non-destructive controls. Its 10% soft variant tints selected rows and the active nav item.

### Secondary
- **Owed Amber** (`amber`): needs attention. Money owed, due soon, data that doesn't add up (the owed-mismatch note). Never used for decoration.
- **Late Rose** (`red`): late, off-track, destructive. Overdue labels, the off-track banner (on `red-soft`), the armed delete button and its focus ring.

### Tertiary
- **Client Sky** (`sky`): marks things the client can see (the client-visible marker on proposal fields) and in-flight states ("In progress" story chips, "Generating proposal…"). It is the one accent that means "visible outside" rather than good or bad.
- **Muted Violet** (`violet`): a minor category tone used by legacy Section rails and some chips. Not part of the forward status vocabulary.
- **Brand Navy** (`navy`): brand colour, used in the login aurora. Rare inside the dashboard.

### Neutral
- **Night Ground** (`bg`): page background.
- **Raised Night** (`bg-elevated`): inputs, hover fills, sticky table headers, row hover.
- **Panel Slate** (`surface`, `surface-2`): panels, stat cells, dropdown menus.
- **Sidebar Night** (`sidebar`): the left nav column.
- **Ink ramp** (`ink-strong`, `ink`, `ink-muted`, `ink-faint`): headings and values, body text, labels and secondary text, hints and placeholder dashes.
- **Rules** (`rule`, `rule-soft`, `rule-strong`): panel borders and dividers, row separators inside tables, empty step outlines and upcoming-stage marks.

### Named Rules
**The Paired Word Rule.** Every status colour sits beside a word that says the same thing ("3 days late", "Fully paid", "Done"). Colour confirms; it never carries meaning alone.

**The Four Meanings Rule.** Emerald = done/paid/go, amber = needs attention, red = late/off-track/destructive, sky = client-visible or in flight. A colour that isn't saying one of these stays neutral.

**The Deal Stage Palette (exception, 2026-10).** Deal stages (Quotes.Status) each own one colour, defined once in `DEAL_STAGES` (`components/pipeline/project-list.ts`): Draft #8B95A7, Awaiting approval #FBBF24, Signed #C4B5FD, Awaiting payment #F0ABFC, In progress #7DD3FC, Paid #22D3A8, Auditing #FB923C, Rejected #FB7185, Cancelled #A8A29E. Used for stage pills (colour text on a 12% tint, `stagePillStyle`), the stage dropdown swatches, and the Projects preview border (60% alpha). Always shown with the stage name. Don't reuse these hues for anything that isn't a deal stage.

## Typography

**Body Font:** Manrope (with -apple-system, system-ui)
**Mono Font:** JetBrains Mono (with ui-monospace)

**Character:** A geometric sans set small and tight, with a mono kept for machine text. Fraunces is loaded as `--font-display` in the root layout but no dashboard component uses it; it is not part of the working system.

### Hierarchy
- **Headline** (600, 20px, tight tracking): page titles via `PageHeader`.
- **Stat** (600, 18px, tabular): the headline numbers in stat rows.
- **Title** (600, 14px, sentence case): section titles in StageSection.
- **Body** (400, 13px, 1.5): the default page text, set on `html`.
- **Label** (400, 12px): stat labels, controls, table cells, buttons. The most used size.
- **Caption** (400, 11px): notes, consequence lines, helper text.
- **Mono ID** (400, 10px, JetBrains Mono): record IDs, emails in pickers, file sizes, timestamps.

### Named Rules
**The Tabular Sans Rule.** Numbers that line up (money, hours, counts, step numbers) use Manrope with tabular figures (`.tabnum`). Mono is for identifiers, not for numerals.

**The Sentence Case Rule.** Section titles, labels and buttons are sentence case at their natural tracking. Uppercase spaced labels are legacy (see Do's and Don'ts).

## Layout

Fixed sidebar plus a content column; mobile swaps the sidebar for `MobileNav`. Pages open with `PageHeader` (title, optional subtitle, right-aligned meta, bottom rule), then a vertical stack of panels separated by 12px. Inside panels, headers run 10px vertical by 16px left padding; stat cells are 12px by 16px.

Stat rows are a grid of cells on a 1px gap over the rule colour, so the gaps draw the dividers: 2 columns below md, 4 at md and up. The stage tracker is a 7-column grid; below sm only the current step shows its label.

Tables switch to stacked cards below md (`md:hidden` list, `hidden md:block` table). Long text in table cells clamps to 3 lines until focused for editing. Wide tables scroll horizontally inside their panel. Panels carry `scroll-mt-16` so in-page anchors clear the top bar.

Spacing follows the Tailwind 4px scale; the recurring steps are 6px (control padding), 12px (panel gaps, control horizontal padding), 16px (panel inner padding) and 24px (below page header).

## Elevation & Depth

Flat and tonal. Depth comes from stepping the ground (bg, bg-elevated, surface) and from 1px rules, not from shadows. Shadows appear only on floating layers: dropdown menus and pickers (`shadow-lg`), modals and drawers (`shadow-xl`/`shadow-2xl`). The legacy `shadow-card` token (a 1px dark drop) is barely used. Sticky table headers use the elevated ground with a light backdrop blur.

### Named Rules
**The Rule Not Shadow Rule.** Anything that sits in the page flow is separated by a 1px rule or a ground step. Shadow is reserved for things that float above the page.

## Shapes

Gentle, small radii. Controls are 6px (`md`), small chips and inline buttons 4px (`sm`). Forward panels (StageSection, ProjectOverview) are 8px (`lg`); legacy panels use the 10px `card` radius. Status marks, avatars, progress tracks and the stage tracker steps are full circles or pills. Borders are always 1px; the only thicker lines are the 2px stage-tracker connectors and the 2px active-nav marker.

## Components

### Buttons
- **Shape:** 6px radius, 6px by 12px padding, 12px text.
- **Primary:** emerald fill, bg-coloured text, semibold. Hover lightens to 85% emerald. Focus: 2px emerald ring at 60% with a 2px offset in the surface colour.
- **Quiet:** text-only in `ink-faint` or `ink-muted`, hover to `ink-strong` (Cancel, secondary actions).
- **Disabled:** 50-60% opacity, no hover.

### Destructive action (DeleteControl)
The one control for every delete and archive. Idle: a bordered quiet button (rule border, muted text, trash or archive icon) that turns red-tinted on hover. Click arms it inline: a question in `ink-strong`, an optional consequence line in `ink-faint` (max 52ch), a red confirm button (red at 15% fill, 40% border, red text) that takes focus, and a quiet Cancel. It disarms itself after 8 seconds. Errors render as an 11px red alert line. No native confirm dialogs.

### Chips
- **Status chips:** text in the status colour on its 15% tint, 4px radius, 10-11px medium. Completed = emerald, In progress = sky, and so on through the four meanings.
- **Selected list rows** in pickers tint with emerald at 10%.

### Cards / Containers
- **StageSection (forward):** surface ground, 1px rule border, 8px radius, 12px bottom margin. The header is one button: lifecycle mark, 14px sentence-case title in `ink-strong`, a 12.5px muted one-line summary that stays visible when folded, and a chevron that rotates when closed. Header actions show only when open. The body is separated by a 1px top rule. Open/closed state persists per viewer.
- **Lifecycle mark:** 20px circle. Done = emerald tint with a check; current = emerald ring with an emerald dot; upcoming = rule-strong outline. Each has screen-reader text.
- **Section (legacy):** 10px radius, a 3px coloured left rail, a coloured dot and an uppercase tracked 12px title. Kept on older pages; do not use it for new work.

### Stat row (ProjectOverview)
Label (12px muted), value (18px semibold tabular), optional note (12px muted, coloured only when it reports a status). Money pairs paid in emerald and owed in amber with a faint slash between them. Progress is a 6px rule-coloured track with an emerald fill and real progressbar semantics.

### Stage tracker (ProjectOverview)
Seven numbered circles joined by 2px connectors. Finished steps are filled emerald with a check, the current step has an emerald ring, upcoming steps are outlined. When the viewer can edit, every step is a button that moves the project there (hover fills with elevated ground, emerald focus ring). The current step is `aria-current="step"`. An off-track deal adds a red-soft banner above the tracker with the reason in words.

### Dropdowns (Combobox)
`components/ui/Combobox.tsx` is the dropdown: a button that opens a list, with type-to-filter (on by default above 7 options), ↑ ↓ / Enter / Esc, type-ahead when unsearchable, check on the current value, optional colour swatches. Use it instead of native `<select>` on new work. Don't wrap it in a `<label>` (the label re-clicks the button); put a visible caption beside it and pass `label` for the accessible name.

### Inputs / Fields
- **Style:** elevated ground, 1px rule border, 6px radius, 12px text, `color-scheme: dark`.
- **Focus:** border shifts to emerald; no glow.
- **Inline-edit cells:** transparent border at rest, rule border on hover, emerald border on focus.
- **Disabled:** 50% opacity.

### Story table (QuoteStoriesTable)
Name and description merged in one column. Descriptions and client notes clamp to 3 lines until focused. Rows split on `rule-soft`, hover to elevated ground, selected rows tint emerald at 5%. A bulk-action bar (emerald 5% ground, emerald 30% border) appears when rows are selected. Below md the table becomes a stacked card list.

### Navigation
Sidebar items: 13px, 6px by 10px padding, 6px radius. Rest = muted text with a faint icon; hover = strong text over 60% surface; active = strong text on emerald-soft, emerald icon, and a 2px emerald bar on the left edge. Group headings are currently 10px mono uppercase (legacy label style, see below).

## Do's and Don'ts

### Do:
- **Do** build new sections with StageSection: neutral surface panel, 1px rule, 8px radius, sentence-case 14px title, a one-line summary that survives folding.
- **Do** pair every status colour with words that say the same thing.
- **Do** keep emerald, amber, red and sky to their four meanings: done/paid/go, attention, late/destructive, client-visible.
- **Do** set money, counts and hours in Manrope with tabular figures; keep JetBrains Mono for IDs, emails and machine strings.
- **Do** route every delete and archive through DeleteControl.
- **Do** give every interactive element a visible focus ring (emerald at 60%, red for destructive).
- **Do** switch dense tables to stacked cards below md.

### Don't:
- **Don't** add coloured left rails or tone dots to section containers; that is the legacy Section look.
- **Don't** use uppercase letter-spaced eyebrow labels for new titles or labels.
- **Don't** use shadows on in-flow panels; shadows belong to menus, modals and drawers.
- **Don't** use Fraunces or any display face on dashboard surfaces.
- **Don't** carry this dark palette into the client portal; it has its own world.
- **Don't** use `window.confirm` or a custom modal for destructive actions.
