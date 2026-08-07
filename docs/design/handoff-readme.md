# Handoff: MoovOS UI redesign

## Overview

A full visual and interaction redesign of MoovOS — the operations system at
`rossjermymoov/MoovOS`. The brief was that the existing UI "looks like AI built it", and the
goal was an interface that reads as designed by a person: calmer, more legible, and
consistent across every screen.

The redesign covers the whole operator surface: Today, Customers (list, record with eight
tabs, new-customer wizard in two modes), Onboarding, Tracking, Queries and ticket detail,
Pricing, Carriers, Tasks (board / list / my tasks with a task drawer), and Settings.

Two things changed structurally, and they are the reason it no longer looks generated:

1. **The boxes went.** The original nested cards inside cards inside panels. Structure now
   comes from rules and whitespace.
2. **The colour zoo went.** The original used fifteen status colours across teal, green,
   amber, magenta, purple and blue, on a dark rail with light pages. There are now four
   status marks with fixed meanings, taken from Moov's own brand palette, on one light
   ground throughout.

## About the design files

The files in this bundle are **design references created in HTML** — working prototypes
showing intended look and behaviour, not production code to copy.

`MoovOS.dc.html` is a single self-contained prototype. Its markup is a template dialect and
its logic is one class; **do not port that structure**. The task is to recreate these
designs in the MoovOS codebase's existing environment — React function components under
`client/src/pages/**`, styled the way that codebase already styles things — using
`DESIGN_RULES.md` as the specification.

Open `MoovOS.dc.html` in a browser and click through it. It is fully interactive: navigation,
filters, search, pagination, wizards, modals, the task board and the task drawer all work.

## Fidelity

**High fidelity.** Final colours, typography, spacing and interaction behaviour. Recreate
pixel-for-pixel using the codebase's existing libraries. Every value is specified in
`DESIGN_RULES.md` — take them from there rather than measuring screenshots.

## Read this first

**`DESIGN_RULES.md` is the important file in this bundle.** It is the entire design system
in one page: five rules, the token set, the component patterns, and the behaviour rules.

Put it in the repo as `CLAUDE.md` or `docs/design-rules.md` and reference it from `CLAUDE.md`.
A screen built to those rules will match the rest of the product without review. A screen
built from a screenshot alone will drift back to badge soup within a month — that drift is
what made the original look AI-built in the first place.

## Screens

Each screen in the prototype maps to files already in the repo. The mapping lives in
`github.md` at the project root (`## Screen map`), and it was built by reading those files
rather than guessing.

| Screen | Repo files it was designed against |
| --- | --- |
| Shell (rail, top bar) | `components/layout/AppShell.jsx`, `Sidebar.jsx`, `TopBar.jsx` |
| Today | new — replaces the empty Dashboard placeholder in `App.jsx` |
| Customers list | `pages/customers/CustomerList.jsx`, `components/ui/StatusBadge.jsx` |
| Customer record (8 tabs) | `pages/customers/CustomerRecord.jsx` + its `tabs/` folder |
| New customer (both modes) | `pages/customers/CustomerNew.jsx`, `customers/CustomerAI.jsx` |
| Onboarding | `pages/onboarding/OnboardingBoard.jsx` |
| Tracking | `pages/tracking/TrackingPage.jsx` |
| Queries + ticket | `pages/queries/QueriesPage.jsx`, `TicketDetailPage.jsx` |
| Pricing | `pages/pricing/PricingPage.jsx`, `customers/tabs/CustomerPricingTab.jsx` |
| Carriers | `pages/carriers/CarrierManagement.jsx`, `carriers/AutomationRules.jsx` |
| Tasks | `pages/tasks/**` |
| Settings | `pages/settings/Switchboard.jsx` |

## What changed, screen by screen (the decisions worth keeping)

- **Today** is new. Four figures, each one a way in: the number and the screen it opens use
  the same predicate, so they can never disagree.
- **Customer record** gained the Financial and Happiness content that used to live on
  separate top-level screens. Finance and Reconciliation were removed from the rail.
- **Queries** shows the drafted reply beside the list, so approving is one click from the
  inbox. Draft content follows the selected ticket.
- **New customer** merged two separate wizards (manual and AI) into one screen with a How
  switch, because they end at the same record. Four steps, ledger down the left, collapsing
  to a horizontal strip below 1180px.
- **Pricing** follows the real model: carriers → services → rate cards, each card carrying
  its own structure from the carrier, with markup set per service.
- **Tasks** uses the same four status marks as everything else. The task drawer is a centred
  overlay split into work (left) and facts (right).
- **Settings** frames autopilot as earned trust: probation → autopilot with clean approvals
  counted, rather than an on/off switch.

## Assets

- **Fonts**: Archivo (Google Fonts), weights 400 and 800.
- **Icons**: Lucide, 14–17px, `currentColor`.
- **Carrier logos**: the real Voila CDN thumbnails resolved the way `courierLogos.js` does
  it, painted as CSS backgrounds. Do not redraw carrier marks.

## Files in this bundle

- `DESIGN_RULES.md` — the design system. Read first, put in the repo.
- `MoovOS.dc.html` — the interactive prototype of every screen.
- `MoovOS Today.dc.html` — a faithful recreation of the UI **before** the redesign, for
  comparison. Useful for showing the team what changed and why.

## One caution

The prototype's data is illustrative. 154 of the 163 customer accounts are generated names,
the document extraction always returns the same sample, and nothing persists. Wire these to
the real endpoints — the field names and validation rules in the prototype were taken from
the existing API modules, so they should line up.
