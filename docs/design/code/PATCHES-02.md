# Patch set 02 — everything the stylesheet cannot reach

Patch set 01 covered Queries, Ticket detail and Surcharges. Section 14 of
`moov-v2.css` now reaches the ~25 hand-rolled inline panels without any JSX
edit, because none of them declare `border-radius`.

What remains is the genuinely unreachable set: properties declared inline with
a value the stylesheet cannot override, and hardcoded colours that never moved
onto the token system. Six files, eleven edits.

---

## 1. `client/src/pages/tracking/TrackingPage.jsx`

### 1.1 — carrier logo swatch (line 98)

Hardcoded white behind a carrier logo. In dark mode this is a white square on
a navy panel.

**Find:**

```js
          width: 20, height: 20, borderRadius: 0, background: '#fff',
```

**Replace with:**

```js
          width: 20, height: 20, borderRadius: 5, background: 'var(--mv-surface)',
```

Carrier logos are usually dark-on-transparent, so on the dark surface they may
now need the swatch to stay light. If a logo disappears, use
`background: '#fff'` deliberately with a comment rather than reverting the
radius — the white is correct for logo legibility, it just should not be
implicit.

### 1.2 — filter control (line 848)

**Find:**

```js
  background: 'var(--mv-bg)', fontFamily: 'inherit', borderRadius: 0, cursor: 'pointer',
```

**Replace with:**

```js
  background: 'var(--mv-bg)', fontFamily: 'inherit', borderRadius: 8, cursor: 'pointer',
```

---

## 2. `client/src/pages/shipments/ShipmentsPage.jsx`

Two modals built by hand instead of with `.ds-modal`. Both hardcode `#fff`, so
both are currently white-on-white in dark mode — the more serious of the two
problems here.

### 2.1 — first modal (line 659)

**Find:**

```js
            background: '#fff', width: 560, border: '2px solid var(--mv-divider)',
```

**Replace with:**

```js
            background: 'var(--mv-surface)', width: 560, border: '1px solid var(--mv-divider)',
            borderRadius: 16, borderTop: '2px solid var(--mv-purple)', overflow: 'hidden',
```

### 2.2 — second modal (line 715)

**Find:**

```js
            background: '#fff', width: 780, maxHeight: '88vh', border: '2px solid var(--mv-divider)',
```

**Replace with:**

```js
            background: 'var(--mv-surface)', width: 780, maxHeight: '88vh', border: '1px solid var(--mv-divider)',
            borderRadius: 16, borderTop: '2px solid var(--mv-purple)', overflow: 'hidden',
```

The accent top rule is what `.ds-modal` uses to signal "this is a modal, not a
panel". Worth migrating these two to `.ds-modal-scrim` + `.ds-modal` properly
when you next touch the file — the inline version will drift again.

---

## 3. `client/src/pages/reconciliation/RunDetailPage.jsx`

Four instances of `#0d1117` — a dark value baked in regardless of theme. This
is the only genuine colour drift in the repo besides QueriesPage's `TYPE_CFG`.
It reads as near-black in light mode, where the surrounding surface is white.

Two of the four are a code/log block where a permanently dark ground is a
legitimate choice (it is a terminal), and two are a swatch. Treating them
differently:

### 3.1 — log block (line 1550)

**Find:**

```js
        background: '#0d1117', border: '1px solid var(--mv-hairline)',
```

**Replace with:**

```js
        background: '#0d1117', border: '1px solid var(--mv-hairline)',
        borderRadius: 12, overflow: 'hidden',
```

Intentionally keeping the dark ground — it is a log viewer. Only adding the
radius so it matches the panels around it.

### 3.2 — log block, second instance (line 2623)

Same edit as 3.1. The line is identical, so apply to both occurrences.

### 3.3 — swatch and dot (lines 1682, 1694)

**Find:**

```js
            background: '#0D1117',
```

**Replace with:**

```js
            background: 'var(--mv-ink)',
```

**Find:**

```js
            width: 10, height: 10, background: '#0D1117',
```

**Replace with:**

```js
            width: 10, height: 10, borderRadius: 999, background: 'var(--mv-ink)',
```

These two are a legend swatch and its dot, not a terminal — they should track
the ink token so they invert with the theme.

---

## 4. `client/src/pages/finance/FinancePage.jsx`

### 4.1 — carrier logo chip (line 1989)

**Find:**

```jsx
<div style={{ width: 20, height: 20, borderRadius: 4, background: '#fff', flexShrink: 0, overflow: 'hidden', border: '1px solid color-mix(in srgb, var(--mv-ink) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
```

**Replace with:**

```jsx
<div style={{ width: 20, height: 20, borderRadius: 5, background: '#fff', flexShrink: 0, overflow: 'hidden', border: '1px solid color-mix(in srgb, var(--mv-ink) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
```

Keeping `#fff` here deliberately — same logo-legibility reason as 1.1, and it
already has a radius, so this is a 4→5 nudge for consistency only. Skip it if
you would rather not touch the file.

---

## 5. `client/src/pages/settings/XeroSettings.jsx`

### 5.1 — Xero brand button (line 266)

**Find:**

```js
            background: '#13B5EA', color: '#FFF', borderRadius: 8,
```

**Leave as is.** `#13B5EA` is Xero's brand blue on a third-party connect
button — it should not be tokenised, and it already has the right radius.

Line 13's `borderRadius: 0` on the `<svg>` is also correct as is.

---

## 6. `client/src/pages/carriers/` — nine tab underlines

`borderBottom: '2px solid var(--mv-purple)'` appears in `ServiceDetail`,
`RulesEngine`, `VolumetricTab`, `CarrierDetail`, `WeightBandsTable`,
`CustomerRcTemplatesTab`, `CarrierManagement`, `CarrierRateCardsTab`,
`FuelGroupsTab`.

**No edit.** These are active-tab underlines. Rounding them detaches the tab
from the rule it sits on. Noted so the omission is visible rather than missed —
`moov-v2.css` section 14 has the same note.

---

## Applying the whole package

```
1. add moov-v2.css + the one import line          → every class-based screen
2. swap ThemeToggle.jsx and TodayPage.jsx         → new chrome + 1c Today
3. apply PATCHES-01.md  (3 files,  8 edits)       → Queries, Tickets, Surcharges
4. apply PATCHES-02.md  (4 files, 11 edits)       → Tracking, Shipments,
                                                     RunDetail, Finance
```

After step 1 the app already looks like direction 1c. Steps 3 and 4 close the
remaining square corners and fix the two real colour bugs (`TYPE_CFG`, the
`#fff` modals).

## What is still pre-redesign after all four steps

Nothing visually square — but eight screens remain on raw inline layout, so
their *spacing* is still the old rhythm even though colour and corners are
right. In inline-style weight: `RunDetailPage` (599) · `FinancePage` (338) ·
`QueriesPage` (333) · `ReconciliationTab` (290) · `ReconciliationPage` (204) ·
`RateCardEditor` (173) · `CustomerRecord` (144) · `PricingPage` (142).

Migrating those means wrapping each in `.moov-ds` and replacing inline
containers with `.v2-panel` — a real piece of work per screen, and the point at
which you would want me to do them one at a time against the running app
rather than as a patch file.
