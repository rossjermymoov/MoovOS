# MoovOS redesign — wire-in package

Design direction **1c "Command Console"**. Light and dark both ship; the user
chooses via the existing `ThemeToggle`, which keeps using your `ThemeContext`
and `localStorage` persistence.

No new colours. Every value resolves through the `--mv-*` / `--color-*`
properties already in `moov.css` and `moov-design.css`, so the brand retint
(`fbdebae`) and the dark token block keep working untouched. The one rule this
direction retires is **"zero radius, ever"** — that was the Windows-98 read.

## Install

```js
// main.jsx (or wherever the sheets are imported) — v2 goes LAST
import './styles/moov.css';
import './styles/moov-design.css';
import './styles/moov-v2.css';   // ← add
```

Then copy the files below over their counterparts. Paths in this package
mirror the repo exactly, so it can be dropped on top of `client/`.

Order matters: the layer uses source order plus specificity to defeat
`.moov-ds *{border-radius:0!important}`. You do **not** edit
`moov-design.css`.

## What's in the package

| File | Action | Why |
| --- | --- | --- |
| `styles/moov-v2.css` | **new** | the whole direction; additive |
| `components/ui/ThemeToggle.jsx` | replace | pill switch, same `useTheme()` contract |
| `pages/today/TodayPage.jsx` | replace | only screen whose **layout** changes |
| `pages/queries/QueriesPage.jsx` | replace | 2 × `borderRadius: 0` → pill badges |
| `pages/queries/TicketDetailPage.jsx` | replace | tab radius |
| `pages/carriers/SurchargesTab.jsx` | replace | 4 × `borderRadius: 0` on inputs/chips |
| `pages/tracking/TrackingPage.jsx` | replace | logo plate + select radius |
| `pages/shipments/ShipmentsPage.jsx` | replace | 2 modals were `#fff` — **white in dark mode**; now tokenised |
| `pages/reconciliation/RunDetailPage.jsx` | replace | 4 × hardcoded `#0d1117` → `--v2-code-bg` |

Every edit in those six page files is a value swap on an existing line. No
logic, props, queries or endpoints changed anywhere. `TodayPage` keeps
identical query keys, endpoints and `staleTime` — only presentation moved.

## How the other ~45 screens get redesigned

Two mechanisms, no per-file work:

**1. Class inheritance.** Most of the app is on `.mv-*` / `.ds-*`, so buttons,
chips, tabs, inputs, tables, KPI strips, banners, modals, status marks, the
rail and the topbar all restyle from the stylesheet.

**2. The `0b` neutraliser layer.** An author `!important` declaration outranks
a *normal inline* style. So the rules in section `0b` of `moov-v2.css` fix
square corners on controls and tables even on screens that set
`borderRadius: 0` inline — without editing them. This is what lands the
redesign on Finance, ReconciliationTab, RateCardEditor, CustomerRecord and
Pricing while they're still un-migrated.

Dense numeric grids are deliberately **excluded** from that layer — rate
matrices, weight bands and money cells keep flush edges. A rounded input in
every cell of a 40-row matrix is unreadable. Exclusion selectors are listed at
the top of section `0b` if you need to add to them.

## What the layer cannot reach

One thing only: **panels hand-built in inline styles.** CSS can't match on an
inline border value, so a `<div style={{border:'2px solid var(--mv-divider)'}}>`
acting as a panel stays square until it becomes a `.v2-panel`. These screens
will look correct in colour, type and controls, but their containers stay
pre-redesign:

| Screen | Inline styles | Container state |
| --- | --- | --- |
| `reconciliation/RunDetailPage` | 599 | patched for colour; panels still square |
| `finance/FinancePage` | 338 | panels still square |
| `queries/QueriesPage` | 333 | patched for badges; panels still square |
| `finance/ReconciliationTab` | 290 | panels still square |
| `reconciliation/ReconciliationPage` | 204 | panels still square |
| `pricing/RateCardEditor` | 173 | panels still square (grids intentionally flush) |
| `customers/CustomerRecord` | 144 | panels still square |
| `pricing/PricingPage` | 142 | panels still square |

Migrating one is mechanical: wrap the screen in `.moov-ds`, then swap each
hand-built container for `.v2-panel`. Worth doing in the order above.

**Out of scope entirely:** `pages/tasks/tasksMockup.html`,
`moov-os-queries.html`, `moov-os-ticket-detail.html` — standalone HTML outside
the React app.

## New classes

Use these instead of inline containers when building or migrating.

- `.v2-panel` — the surface primitive. `--flush` (no padding, for tables),
  `--alert` / `--brand` / `--quiet` (2px top rule), `.is-clickable` (hover lift)
- `.v2-tile` — nested block inside a panel; `--alert`, `--brand`
- `.v2-grid` — `--figures` (auto-fit 200px), `--tiles` (auto-fit 320px)
- `.v2-table-wrap` — surface + radius + horizontal scroll around a table
- `tr.is-attention` / `tr.is-waiting` — persistent row mark, so the alarm
  survives hover instead of living only in text colour

## New tokens

| Token | Value | Note |
| --- | --- | --- |
| `--v2-r-sm` / `-md` / `-lg` / `-pill` | 8 / 12 / 16 / 999px | the radius scale |
| `--v2-lift`, `--v2-lift-hover`, `--v2-lift-modal` | shadows | all `none` in dark; a shadow on `#171B2D` over `#12141D` reads as dirt |
| `--v2-logo-plate` | `#FFFFFF` | plate behind courier logos — light in both themes, since carrier logos are drawn for white |
| `--v2-code-bg` | `#0D1117` | payload/JSON viewers, dark in both themes like a code block |

## Three decisions worth your eye

1. **`--v2-code-bg` stays dark in light mode.** Those four `#0d1117` panels in
   RunDetail were flagged as drift, but a machine-output viewer reading as a
   code block is defensible. I tokenised rather than "fixed" it — change the
   one token if you disagree.
2. **`.mv-kpis` becomes a wrapping grid**, not a fixed flex row. Figures now
   stack on narrow viewports instead of squashing. Say the word if any screen
   needed one row.
3. **2px section rules drop to 1px.** Panel edges already separate; both reads
   as noise. Revert in the `.mv-rule` / `.ds-rule` block.
