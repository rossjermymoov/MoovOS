# Patch set 01 — Queries, Ticket detail, Surcharges

Three files, eight edits. All are exact find/replace against the current repo;
line numbers are where they sit today. Nothing here changes behaviour.

One of these is a real bug rather than a radius fix — see 1.1.

---

## 1. `client/src/pages/queries/QueriesPage.jsx`

### 1.1 — `TYPE_CFG` still holds the retired prototype palette (line ~66)

This is pre-retint colour, not drift from the redesign: `#7B2FBE` is the purple
that commit `fbdebae` replaced with brand green, `#E91E8C` is the old magenta,
and `#D97706` was never a Moov token at all. These hexes are invisible to the
token system, so they did not flip with the retint and they do not flip in dark
mode either.

Mapped to meaning rather than to the nearest hue: lost/damaged goods need a
person (red), delivery friction is a caution (amber), WISMO is informational.

**Find:**

```js
const TYPE_CFG = {
  whereabouts:    { label: 'WISMO',           color: '#7B2FBE' },
  not_delivered:  { label: 'Not Delivered',   color: '#E91E8C' },
  wrong_address:  { label: 'Wrong Address',   color: '#E91E8C' },
  damaged:        { label: 'Damaged',         color: '#E91E8C' },
  missing_items:  { label: 'Missing Items',   color: '#E91E8C' },
  failed_delivery:{ label: 'Failed Delivery', color: '#D97706' },
  returned:       { label: 'Returned',        color: '#D97706' },
  delay:          { label: 'Delay',           color: '#D97706' },
  other:          { label: 'Other',           color: 'var(--mv-ink-52)' },
};
```

**Replace with:**

```js
// Colour carries meaning, not category: red = needs a person, amber = caution,
// green = informational. Values resolve through tokens so they flip with theme.
const TYPE_CFG = {
  whereabouts:    { label: 'WISMO',           color: 'var(--mv-purple)' },
  not_delivered:  { label: 'Not Delivered',   color: 'var(--mv-magenta-deep)' },
  wrong_address:  { label: 'Wrong Address',   color: 'var(--mv-magenta-deep)' },
  damaged:        { label: 'Damaged',         color: 'var(--mv-magenta-deep)' },
  missing_items:  { label: 'Missing Items',   color: 'var(--mv-magenta-deep)' },
  failed_delivery:{ label: 'Failed Delivery', color: 'var(--mv-amber-deep)' },
  returned:       { label: 'Returned',        color: 'var(--mv-amber-deep)' },
  delay:          { label: 'Delay',           color: 'var(--mv-amber-deep)' },
  other:          { label: 'Other',           color: 'var(--mv-ink-52)' },
};
```

### 1.2 — `Badge` radius (line 85)

**Find:** `      borderRadius: 0,`
(inside `function Badge`, between `padding:` and `fontSize:`)

**Replace with:** `      borderRadius: 6,`

### 1.3 — `GroupBadge` radius (line 126)

**Find:** `      borderRadius: 0,`
(inside `function GroupBadge`, between `padding: '2px 7px',` and `background:`)

**Replace with:** `      borderRadius: 999,`

Group badges are short uppercase labels, so a pill reads better than a
rounded rectangle; type badges carry longer text and keep the 6px corner.
`TrackingStatusBadge` two functions down is already `borderRadius: 9999` — this
brings the other two in line with it.

---

## 2. `client/src/pages/queries/TicketDetailPage.jsx`

### 2.1 — compose tab bar (line 682)

**Find:**

```js
            borderRadius: 0,
```
(inside the `tabs.map` button style, after the `borderBottom:` line)

**Replace with:**

```js
            borderRadius: '8px 8px 0 0',
```

Top corners only — the active tab sits on a 2px bottom rule that must stay
flush with the border below it.

---

## 3. `client/src/pages/carriers/SurchargesTab.jsx`

### 3.1 — `inp` helper (line 77)

**Find:**

```js
const inp = (extra = {}) => ({
  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
  borderRadius: 0, color: 'var(--mv-ink)', fontSize: 13, padding: '6px 10px',
```

**Replace with:**

```js
const inp = (extra = {}) => ({
  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
  borderRadius: 8, color: 'var(--mv-ink)', fontSize: 13, padding: '6px 10px',
```

### 3.2 — `sel` helper (line 83)

**Find:**

```js
const sel = (extra = {}) => ({
  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
  borderRadius: 0, color: 'var(--mv-ink)', fontSize: 13, padding: '6px 10px',
```

**Replace with:**

```js
const sel = (extra = {}) => ({
  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
  borderRadius: 8, color: 'var(--mv-ink)', fontSize: 13, padding: '6px 10px',
```

### 3.3 + 3.4 — `ChipInput` wrapper and chips (lines 100, 102)

Both are on the two lines below, so this is one replacement.

**Find:**

```jsx
    <div style={{ border: '1px solid var(--mv-hairline-2)', borderRadius: 0, background: 'var(--mv-bg)', padding: '4px 8px', minHeight: 36, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)', borderRadius: 0, padding: '2px 8px', fontSize: 11, color: 'var(--mv-purple-700)', fontWeight: 600 }}>
```

**Replace with:**

```jsx
    <div style={{ border: '1px solid var(--mv-hairline-2)', borderRadius: 8, background: 'var(--mv-bg)', padding: '4px 8px', minHeight: 36, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)', borderRadius: 999, padding: '2px 8px', fontSize: 11, color: 'var(--mv-purple-700)', fontWeight: 600 }}>
```

The wrapper is a field, so it takes the 8px control radius; the chips inside it
are pills, matching `.mv-chip` in `moov-v2.css`.

---

## Left alone deliberately

- `pages/settings/XeroSettings.jsx` line 13 — `borderRadius: 0` on an `<svg>`.
  Not a surface.
- `pages/tracking/TrackingPage.jsx` lines 98, 848 — these are in the next patch
  set with the carrier-logo swatch and the filter control, which want looking
  at together.

## Verifying

After applying, check in both themes:

1. **Queries list** — type badges are no longer purple/pink from the old
   palette. WISMO reads green, damage-class reads red, delay-class reads amber.
   In dark mode all three should now shift with the theme; previously they
   stayed fixed.
2. **Ticket detail** — compose tabs have rounded top corners and still sit
   flush on the rule beneath.
3. **Surcharges tab** — rule builder inputs, selects and the country chip
   input all have soft corners; chips are pills.
