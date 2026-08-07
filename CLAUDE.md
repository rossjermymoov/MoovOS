# MoovOS

Operations system for Moov. React (Vite) client in `client/`, Express + Postgres API in `server/`.

## Design system — read before touching any UI

**`docs/design-rules.md` is the design specification. Follow it for every screen.** It is the
whole system in one page: five rules, the token set, the component patterns, and the behaviour
rules. A screen built to those rules matches the rest of the product without review.

The design came from a Claude Design handoff (`docs/design/` holds the reference README, the
interactive prototype `prototype.html`, and the base modernist stylesheet). The prototype shows
intended look and behaviour — **do not port its markup**; rebuild each screen as ordinary React
function components under `client/src/pages/**`, using the design tokens.

### The five rules (summary — the detail is in docs/design-rules.md)

1. **No boxes.** Structure comes from 2px section rules and 1px hairlines and whitespace, never
   cards inside cards. **Zero border radius anywhere.** If it feels like it needs a card, give it
   more space instead.
2. **One status language.** Four marks, same meaning everywhere: filled green square = settled/on
   track; purple triangle = in progress/automated; filled magenta square = needs a person; hollow
   grey square = waiting on someone else. Status text is 11px uppercase `.09em` in the mark's
   colour. Never a pill or rounded badge.
3. **Colour means something.** Purple `#7B2FBE` = interactive & automation. Green `#00C853` =
   good/settled. Magenta `#E91E8C` = needs a human (the alarm colour — **never red**). Everything
   else is ink on grey. Never colour for decoration.
4. **Archivo, flush left, tabular numerals.** Headings 800 weight, negative tracking. Nothing
   centred. Money/time columns use `font-variant-numeric: tabular-nums`.
5. **Write like a colleague.** "Three tickets are past their SLA." Not "3 items require attention".
   No exclamation marks, no emoji, no "Oops".

### Using the tokens in code

`client/src/styles/moov-design.css` carries the tokens (`--color-*`, `--moov-*`, spacing, Archivo)
and a set of opt-in classes (`.moov-ds` root, `.ds-*` components) built to the rules above. It is
imported globally but scoped: a screen adopts the new system by rendering inside a `.moov-ds`
container. Existing screens are untouched until rebuilt, so migration is one screen at a time.

Take every colour, radius, font and spacing value from the tokens — never hard-code a hex the
tokens already carry, and never round a corner.
