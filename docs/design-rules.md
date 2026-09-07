# MoovOS design rules

Paste this file into your repo (`CLAUDE.md`, or `docs/design-rules.md` referenced from it).
It is the whole design system in one page. A screen built to these rules will match the
rest of the product without anyone checking it.

---

## The five rules

**1. No boxes.**
Structure comes from rules and whitespace, not from cards inside cards. A 2px rule under a
section heading, 1px hairlines between rows, generous space between blocks. Zero border
radius anywhere. If something feels like it needs a card, it needs more space instead.

**2. One status language.**
Four marks, and they mean the same thing on every screen:

| Mark | Meaning | Colour |
| --- | --- | --- |
| Filled square | Settled, live, on track | brand green `#0F7A46` (dark mode `#1DFB9D`), text same |
| Triangle | In flight, in progress, automated | brand green `#0F7A46` (dark mode `#1DFB9D`) — same colour as settled; the shape is what distinguishes them |
| Filled square | Needs a person | brand red `#CD1D69` (dark mode `#DE6C9E`), text same |
| Hollow square | Waiting on someone else | grey, `color-mix(in srgb, ink 45%, transparent)` |

Status text is 11px, uppercase, `.09em` tracking, in the mark's own colour. Never a pill,
never a rounded badge, never a fifth colour.

**3. Colour means something or it isn't used.**
Brand green = interactive, automated, and settled/good (buttons, links, active nav, AI
drafts, and the "on track" mark — one hue, two meanings, told apart by the mark's shape).
Brand red = needs a human. Brand blue = secondary numeric values only (e.g. per-kg rates).
Everything else is ink on grey. Never colour something for decoration.

*(This reverses the project's original "never red" rule — as of the MOS-4 brand redesign,
red is the alarm colour, matching the real Moov Webapp brand palette. Magenta is retired.)*

**4. Archivo, flush left, tabular numerals.**
Headings 800 weight with negative tracking. Body 400. Section labels 9px uppercase at
`.15em`, weight 600, in the brand-green accent colour. Every column of money or time uses
`font-variant-numeric: tabular-nums` so figures line up. Nothing is centred — not headings,
not button labels, not hero copy.

**5. Write like a colleague, not a system.**
"Three tickets are past their SLA and one credit check is overdue." Not "3 items require
attention". Say what happened and what it means. Empty states say what would appear here.
Errors say what to do. No exclamation marks, no emoji, no "Oops".

---

## Tokens

```css
/* Light mode (default) */
--color-bg:        #F7F8FA;   /* page ground */
--color-surface:   #FFFFFF;   /* left rail, raised areas */
--color-text:      #171B2D;   /* ink */
--color-divider:   #DFE0EB;   /* 2px section rules */

--color-accent:    #0F7A46;   /* Moov brand green — interactive, automation */
--color-accent-600:#065F39;   /* pressed */
--color-accent-100:#E7F2EC;   /* tinted fill */
--color-on-accent: #FFFFFF;   /* text/icons on a solid --color-accent fill */

--moov-green:      #0F7A46;   /* fills, marks, bars */
--moov-green-deep: #065F39;   /* green text (contrast) */
--moov-magenta:    #CD1D69;   /* fills, marks, bars — brand red, the alarm colour */
--moov-magenta-deep:#CD1D69;  /* magenta text (contrast) */
--moov-teal:       #276E93;   /* per-kg rates only — brand blue */

/* Dark mode — set via [data-theme="dark"], toggled by ThemeContext */
--color-bg:        #12141D;
--color-surface:   #171B2D;
--color-text:      #FDFFFF;
--color-accent:    #1DFB9D;   /* neon in dark mode — pairs with --color-on-accent, not white */
--color-on-accent: #171B2D;
--moov-green:      #1DFB9D;
--moov-magenta:    #DE6C9E;
--moov-teal:       #73A1B9;

--radius-md: 0;               /* not negotiable */
font-family: Archivo;
```

Variable *names* above are historical (`--color-accent` etc. predate the MOS-4 brand
redesign) and were kept as-is so existing call sites didn't need touching — only the
*values* changed. Don't read anything semantic into the names; the token table above is
the source of truth for what each one means now.

Hairlines between rows: `1px solid color-mix(in srgb, var(--color-text) 12%, transparent)`.
Section rules: `2px solid var(--color-divider)`.
Muted text: `color-mix(in srgb, var(--color-text) 55%, transparent)`.

**Deep steps for text.** Green and red at full strength are for fills and marks. Any
text in those colours uses the `-deep` variant, or it fails contrast.

---

## Component patterns

**Left rail** — 238px, surface ground, 2px right rule. Wordmark MOOV in Archivo 800 30px
with a green square full stop. Nav items are flush-left labels with a 3px left border:
brand green when active (label goes 800 weight, faint ink tint behind), transparent otherwise.
Counts derive from data, never hardcoded.

**Page header** — brand green kicker (9px uppercase tracked), h1 33px Archivo 800 at -.025em,
one sentence of blurb in muted ink, actions right-aligned. Then a 2px rule.

**Figure strip** — a flex row under the header, each cell separated by a 1px vertical rule,
no boxes. Label 9px uppercase muted, value 31px Archivo 800 tabular, sub-line 11px muted.
Where a figure leads somewhere, the whole cell is clickable with a brand green uppercase
destination line ("Show me the 6 →") at 42% opacity, full on hover.

**Tables** — no card wrapper. Header row 9px uppercase muted with a 2px rule under. Rows
separated by hairlines, hover tints 4% ink and reveals a 3px brand green tick at the row start.
Money and dates right-aligned and tabular. A secondary line under a cell's main value
(contact under business name) at 11px muted.

**Editable money** — a field with a visible underline that darkens on hover and turns brand green
on focus, £ outside the field, right-aligned tabular figures, tidied to 2dp on blur (never
mid-keystroke). An overridden value goes brand green so edits are visible at a glance.

**Chips / pickers** — 1px bordered rectangles, ink fill when selected. Used for filters,
segmented choices, tier and priority pickers. Never a native `<select>`.

**Modals** — centred overlay, brand green 3px top rule, kicker + title + blurb header on surface
ground, body scrolls, footer states what will be recorded and against whom. Primary action
disabled with a reason in the footer until the form is valid.

**Buttons** — `.btn-primary` is a brand green fill, `.btn-secondary` is a 1px outlined rectangle.
Labels flush left. Destructive actions (place on stop) take a red outline, never a fill.

---

## Behaviour rules

- **Numbers derive from the data they describe.** If a figure says 6 and opens a filtered
  list, the figure and the filter must use the same predicate — they can never disagree.
- **Nothing is saved until the last step.** Wizards say so out loud.
- **A form that acts on a record shows the facts you need to decide** — placing an account
  on stop shows outstanding, credit limit and oldest overdue in the modal.
- **Every action that changes a record writes an activity line** naming who did it.
- **Uncertainty is surfaced, not hidden.** Where something was read from a document, the
  fields it was unsure about carry their own note.
- **Fresh entry starts empty.** Re-entering a wizard clears the last run.

---

## Don't

- Don't round a corner.
- Don't add a fifth status colour, or a sixth.
- Don't use a coloured pill or badge.
- Don't centre anything.
- Don't write "Oops", "Success!", or any sentence a person wouldn't say out loud.
- Don't add a card to separate two things — add space.
- Don't invent a colour. If none of the four fits, the answer is ink.
