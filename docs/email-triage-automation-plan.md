# Support Inbox Triage & Task Automation — Solution Approach

**Prepared for:** Chinthaka
**Subject:** Classifying and routing `service@moovparcel.co.uk` inbound email (WISMO / claims / billing / technical / other), in parallel with Freshdesk
**Status:** Draft for review

---

## 1. Executive Summary

Today, every inbound email to the support inbox becomes a Freshdesk ticket, manually
read and filed by an agent into one of 21 groups. This is the "lot of overlooking"
Chinthaka wants to reduce: a human reads and categorizes every single email before any
useful routing happens, and — for the largest single category, courier claims — a
human also manually opens a courier-emailed claim-form link and retypes information
the customer already gave over email.

The ask is to have MoovOS listen to the same inbox, classify each email by subject +
body using an LLM (WISMO / technical / claim / billing / sales / other), and route it:
WISMO-type emails into the existing WISMO flow, everything else into a Tasks-board
ticket in the correct space, and claims eventually into an automated courier
claim-form fill. Critically, **this runs alongside Freshdesk, not instead of it** —
Freshdesk keeps operating exactly as it does today, untouched, so MoovOS's routing
decisions can be compared against what the real team actually did with the same
emails before anything here is trusted to act live.

Most of the underlying machinery already exists — this is substantially a routing and
comparison-tooling exercise on top of WISMO's existing Gmail-poll → Gemini-triage
pipeline, not a new pipeline.

---

## 2. Business Context and Objective

- Support inbox `service@moovparcel.co.uk` currently feeds Freshdesk directly
  (email-to-ticket). Every email becomes a Freshdesk ticket, filed by hand into one of
  21 groups (mostly courier × issue-type combinations — see Section 4).
- Chinthaka wants MoovOS to independently watch the same inbox, classify each email,
  and decide: is this WISMO (where's my order), a claim, technical, billing, or
  something else — then route it accordingly, without touching or replacing Freshdesk
  yet.
- **WISMO-classified email** → handled by the existing WISMO automation (`queries`
  table, `courierAutomation.js`, QA Bay).
- **Claim-classified email** → for now, flagged and tracked; a later phase logs into
  the courier's claim-form link (received later, mid-thread) and fills it using data
  already collected from the customer, via browser automation, stopping short of
  auto-submit until trusted. **A claim frequently isn't a fresh email at all — it's a
  state change partway through an existing WISMO thread** (customer and courier were
  already coordinating on a delivery query, and the customer then asks for a claim).
  Claim detection needs to watch active WISMO conversations for this transition, not
  only classify brand-new inbound email (Section 6.2).
- **Everything else (billing / technical / sales / other)** → creates a Task on the
  existing Tasks board, in the correct space, rather than only existing as a Freshdesk
  ticket.
- **Purpose of this phase specifically: validation, not replacement.** Chinthaka wants
  to run MoovOS as a parallel platform and compare its classification/routing
  decisions against what Freshdesk/the team actually did with the same emails — i.e.
  prove MoovOS "acts exactly as we do in real life" before it's trusted to act
  instead of a human anywhere.
- Not sure yet whether urgency should be a per-email dashboard indicator or specific
  to claims — left as an open design question (Section 8), informed by Section 4's
  finding that Freshdesk's own priority field isn't reliable signal today.

---

## 3. What Already Exists (build on this, don't rebuild it)

MoovOS already has a working Gmail → Gemini → ticket pipeline for WISMO. This project
extends it, rather than starting from zero:

| Capability | Existing code | Reusable as-is? |
|---|---|---|
| Gmail polling (3 min interval, not push/webhook) | `server/services/gmailSync.js`, `startGmailSync()` in `server/index.js:150` | Yes — same poller can classify every email, not just WISMO-shaped ones |
| LLM triage w/ fallback chain (Gemini → Claude → regex) | `triageAndSummarize()` in `gmailSync.js:40-79`, `extractTriage()` in `server/services/geminiService.js:227` | Yes — already outputs a `ticket_type` of `query\|claim\|billing\|technical`; needs its taxonomy widened (Section 4) and its output wired to route to Tasks, not just `queries` |
| WISMO ticket handling | `queries` table, `courierAutomation.js`, `sendGateway.js`, QA Bay UI | Yes, unchanged — WISMO-classified email keeps flowing exactly as it does today |
| Generic work-item board with "spaces" | `tasks` / `task_config` (JSONB spaces config) / `task_links` (polymorphic link to customer/courier/query/parcel), `server/routes/tasks.js` | Yes — `POST /api/tasks` already accepts `links[]`; **no automated task creation exists anywhere today** — this is the actual new capability this project adds |
| Notification/alert pattern | `server/routes/notifications.js` (`notify()` helper, `red/amber/green/info` severity), `NotificationBell.jsx` | Yes — reuse for "needs attention" surfacing rather than inventing a new indicator |
| Autonomy kill-switch pattern | `workflowTrust.js`, `AUTOPILOT_LIVE_SEND_ENABLED` env var | Yes — same pattern should gate claim-form auto-submit later |
| Browser/portal automation | — | **None exists.** Puppeteer/Playwright automation for claim-form filling is new build, no pattern to extend |
| Freshdesk integration | None (only two disused legacy columns, `freshdesk_ticket_id`/`freshdesk_ticket_number`, on `queries`) | N/A — Freshdesk is a separate system this reads from via its own API for comparison, not integrated into MoovOS's DB |

---

## 4. Freshdesk Findings (real operational data)

Pulled live via the Freshdesk API (`moovparcel.freshdesk.com`), 952 tickets from the
last 30 days, aggregated by group/type/priority/status/source — no ticket bodies were
retained, only counts, to avoid holding customer PII unnecessarily.

### 4.1 Category volume (by Group — the field agents actually use)

| Group | Count | Share |
|---|---:|---:|
| Claims – DPD | 322 | 34% |
| Claims – DHL | 70 | 7% |
| Returns | 62 | 7% |
| Technical | 56 | 6% |
| Accounts | 56 | 6% |
| Delivery Enquiries – DPD | 48 | 5% |
| Collection Issues – DPD | 46 | 5% |
| Management Support | 46 | 5% |
| Onboarding | 40 | 4% |
| Delivery Enquiries – DHL | 32 | 3% |
| *(no group assigned)* | 30 | 3% |
| Claims – Yodel | 26 | 3% |
| Collection Issues – DHL | 26 | 3% |
| Supplies Request | 25 | 3% |
| 3rd/4th Party Collection | 24 | 3% |
| Customer Service (catch-all) | 21 | 2% |
| Delivery Enquiries – Yodel | 12 | 1% |
| Additional Charges Dispute | 6 | 1% |
| Claims – UPS | 3 | <1% |
| Delivery Enquiries – UPS | 1 | <1% |

**Claims are 44% of all volume (mostly DPD); WISMO-equivalent "Delivery Enquiries" is
only ~10%.** This reorders the priority Chinthaka's original framing implied — claim
automation is the higher-leverage build here, not WISMO (which already has its own
dedicated automation project).

### 4.2 Taxonomy Freshdesk already uses

Freshdesk's `ticket_type` dropdown (`Billing & Accounts`, `Customer Service`,
`Claim - <courier>`, `Collection Issues - <courier>`, `Delivery Enquiry - <courier>`,
`Moov Ninja Troubleshooting`, `Technical Support`, `Supplies Request`,
`Positive Feedback`, `Other`) is the closest thing to an existing target taxonomy for
MoovOS's classifier — richer than a flat wismo/technical/claim/billing split, and
already courier-specific for claims and delivery enquiries, matching how WISMO's own
routing already works.

**However, this field is essentially unused in practice — 918 of 952 tickets (96%)
have no `type` set.** Agents categorize by which Group they file the ticket into, not
by filling in the type dropdown. MoovOS's classifier should target the **Group**
taxonomy (Section 4.1) as its ground truth for comparison, not the `type` field.

### 4.3 Data quality realities that shape the design

- **Zero tickets (0/952) have any custom field populated.** All claim/parcel data
  (value, contents, tracking number) lives only in free-text subject/body — same
  problem WISMO Phase 1 already solved with its required-fields extraction. No
  shortcut available via structured Freshdesk data.
- **Priority is not reliable signal**: 87% of tickets are `Low`, only 9% `Urgent`,
  regardless of actual urgency — matches the WISMO project's own finding that
  "requires_attention" needs to be computed (dissatisfaction/SLA-based), not copied
  from an existing field. MoovOS should derive its own urgency signal rather than
  read Freshdesk's.
- **Subject lines are not a reliable classification signal alone** — samples include
  bare tracking numbers, "P1 Urgent," blank subjects, and forwarded invoice subjects
  with no consistent convention. Confirms classification must read full body content,
  consistent with how `triageAndSummarize()` already works.
- **35% of current ticket volume arrives via "MobiHelp"** (Freshdesk's mobile/widget
  SDK), only 62% via Email. **A Gmail-inbox listener structurally cannot see this
  35%** — a hard scope boundary for this project, not something to solve now. Worth
  keeping in mind when judging MoovOS's "coverage" during the comparison phase: it
  will only ever be comparable against the Email-sourced ~62% of Freshdesk tickets.

---

## 5. What Changes vs Today

| Area | Today | Target (this project) |
|---|---|---|
| Inbox classification | Human agent reads every email, files into a Freshdesk group | MoovOS independently classifies every email via LLM, in parallel |
| WISMO-type email | Already automated (separate project) | Unchanged — continues via existing WISMO flow |
| Claim-type email | Human manually opens a courier-emailed claim-form link and retypes customer-provided details | Phase 1: flagged/tracked only. Later phase: form pre-filled by browser automation from already-collected data, human reviews before submit |
| Billing/technical/sales/other email | Only exists as a Freshdesk ticket | Also creates a Task on the Tasks board, in the correct space, linked to the customer |
| Freshdesk | System of record for this inbox | **Unchanged, continues exactly as today** — MoovOS runs alongside it, does not touch it |
| Validation | None — no way to check automation accuracy before trusting it | New: a comparison mechanism scoring MoovOS's classification/routing against what Freshdesk/the team actually did (Section 6.4) |

---

## 6. Proposed Architecture

### 6.1 Component overview

1. **Shared Gmail listener (existing, extended)** — the same `gmailSync.js` poller
   WISMO already uses against `service@moovparcel.co.uk` also feeds this
   classification path. No second inbox connection, no second OAuth grant.
2. **Category classifier (extends existing triage)** — widens
   `triageAndSummarize()`'s output from 4 buckets (`query|claim|billing|technical`) to
   the real Group taxonomy in Section 4.1 (courier × issue-type granularity for claims
   and delivery enquiries, plus Returns/Onboarding/Supplies/Accounts/Management
   Support/Customer Service catch-all). WISMO-classified output continues into the
   existing `queries` table unchanged.
3. **Task router (new)** — for every non-WISMO classification, calls the existing
   `POST /api/tasks` with `links[]` set to the customer (and courier, if relevant),
   and `space` set from a classification→space mapping (config, mirroring how
   `task_config` already stores spaces as editable JSON — this mapping should live
   alongside it, not be hardcoded).
4. **Urgency scorer (new, small)** — since Freshdesk's own priority field isn't
   reliable ground truth (Section 4.3), compute urgency independently: keyword/SLA
   heuristics to start (e.g. "final notice," "suspended," repeated contact on the same
   thread), same spirit as `dissatisfactionEngine.js`'s existing sentiment check.
   Surfaced via the existing `NotificationBell` "needs attention" pattern — no new UI
   component required for this phase.
5. **Claim-form filler (new, later phase)** — Puppeteer-based. Confirmed for DPD (the
   dominant claims courier, Section 4.1): the courier emails a claim-form link
   mid-thread; opening it prompts for the **customer's own DPD account number** (not
   a single Moov-wide value — each customer has their own, and some have several,
   e.g. separate Ambient/Perishable accounts) and a simple **"I'm not a robot"
   checkbox** (no image challenge), then lands on the actual claim form. **The
   account number is already in the schema** — `shipments.customer_account` records
   which carrier account was used per shipment, so the filler resolves it
   unambiguously from the claim's consignment/tracking number rather than guessing
   which of a customer's accounts applies. The filler should drive the whole path:
   type the resolved account number, click the checkbox, then populate the form from
   data already collected in the thread — **parcel type, value, contents,
   description**, plus **attaching the commercial invoice** the customer supplied as
   proof of value (a file upload, not just text fields) — using the same
   required-field extraction WISMO Phase 1 already does for courier inquiries. Stops
   for human review before final submission (same QA Bay pattern as WISMO drafts),
   rather than auto-submitting. **Unconfirmed for other couriers** (DHL, Evri, UPS,
   Yodel) — treat DPD's flow as the template and verify each other courier's actual
   gate before assuming it matches (Section 8).
6. **Comparison/scoring job (new)** — see Section 6.4. This is the actual deliverable
   of this phase: proof MoovOS's classification matches reality before anything here
   is trusted to act instead of a human.

### 6.2 Flow (classification & routing, this phase)

```
Inbound email (service@moovparcel.co.uk) → Gmail poll (existing, 3 min)
  → Category classifier (Gemini, widened taxonomy)
  → WISMO? → existing WISMO flow, unchanged
  → Claim? → Task created (space: claims), linked to customer/courier,
             flagged for later claim-form automation, NOT auto-filled yet
  → Billing / Technical / Sales / Other? → Task created in matching space
  → Urgency scorer runs regardless of category → surfaced via NotificationBell
      if above threshold

Separately, on every reply within an ALREADY-OPEN WISMO thread:
  → Claim-intent detector (Gemini, same call pattern as dissatisfactionEngine.js)
      checks whether the customer is now asking to file a claim
  → If yes → thread reclassified claim, Task created/linked the same way as above,
             even though the ticket started life as a plain WISMO query

Freshdesk, in parallel: same email → ticket created exactly as today, untouched
Comparison job (async, delayed): once the Freshdesk ticket is filed/resolved,
  pull its actual Group + resolution via API, diff against MoovOS's classification,
  record agreement/disagreement
```

Claim-form fill (Phase 2, DPD first):
```
Courier claim-form link arrives mid-thread
  → Puppeteer opens link → types Moov's DPD account number → clicks "I'm not a
    robot" checkbox → reaches claim form
  → Fills parcel type / value / contents / description from data already collected
    in the thread; attaches the commercial invoice (file upload) the customer sent
    as value evidence
  → Stops for human review in QA Bay before submission (not auto-submitted)
```

### 6.3 Data model additions (indicative)

- New table, e.g. `inbox_classifications`: `gmail_message_id`, `raw_subject_hash` (not
  raw subject, to limit PII retention — TBD how much is actually needed, see Section
  8), `moovos_category`, `moovos_space`, `moovos_urgency`, `task_id` (nullable, FK to
  `tasks`), `query_id` (nullable, FK to `queries`, if routed to WISMO instead),
  `classified_at`.
- Extend that table (or a linked one) with the comparison outcome once available:
  `freshdesk_ticket_id`, `freshdesk_group`, `freshdesk_matched_at`, `agreement` (bool
  or category-match/mismatch detail).
- `task_config`-style JSON mapping: classifier category → Tasks-board `space` key,
  editable without a code change (same pattern already used for spaces themselves).
- No changes needed to `tasks`, `task_links`, or `queries` — both already support
  everything this phase needs.
- No new column needed for the account number — `shipments.customer_account` and
  `customer_carrier_links.account_number` (migrations 020, 120, 239) already store
  this per shipment/customer/courier. The filler just needs a lookup: claim's
  consignment number → `shipments` row → `customer_account`.

### 6.4 Comparison methodology — the actual point of this phase

Chinthaka's goal is explicitly "compare and see whether MoovOS acts exactly as we do
in real life" — this needs a defined matching mechanism, not just eyeballing two
systems side by side:

- **Matching key is unresolved and needs a quick technical check before Phase 1
  starts**: does the Freshdesk API expose the inbound email's Gmail `Message-ID`
  header anywhere on the ticket or its conversations? If yes, that's a clean 1:1 match
  against the `rfc_message_id`/Gmail message id MoovOS already captures. If not,
  matching falls back to requester email + subject (fuzzy, stripping `Re:`/`Fwd:`) +
  timestamp proximity — workable, but not exact, and worth knowing which case we're in
  before building the comparison job.
- Comparison should report, at minimum: **category agreement rate** (did MoovOS file
  this under the same Group Freshdesk ended up using), broken down by category (claims
  vs WISMO vs billing vs technical vs other), so weak spots are visible per-category
  rather than as one blended accuracy number.
- Given the MobiHelp gap (Section 4.3), the comparison is only meaningful against the
  Email-sourced subset of Freshdesk tickets — the reconciliation job should filter to
  `source == Email` before scoring, or the accuracy number will be silently capped
  around 62% no matter how good the classifier is.

---

## 7. Decisions Made So Far

| # | Question | Decision | Impact on design |
|---|---|---|---|
| 1 | Ingestion mechanism | MoovOS polls the same `service@moovparcel.co.uk` Gmail inbox directly (same mechanism WISMO already uses), not a Freshdesk webhook | No new OAuth grant, no Freshdesk-side changes needed to start |
| 2 | Relationship to Freshdesk | Freshdesk stays exactly as-is; MoovOS runs as a **parallel platform** for comparison, not a replacement | De-risks this phase entirely — nothing customer-facing or agent-facing changes; Freshdesk is the fallback/ground-truth source throughout |
| 3 | Claim-form mechanism (DPD, confirmed) | Courier emails a link mid-thread; opening it requires typing the **customer's own DPD account number** (per-customer, not Moov-wide — some customers have multiple) and clicking a plain **"I'm not a robot" checkbox** (no image challenge), then the actual claim form loads. Fields needed: parcel type, value, contents, description, plus a **commercial invoice file upload** as value evidence. Other couriers' flow not yet confirmed. | Puppeteer drives the whole path — account number entry, checkbox click, field fill, file upload — not just a simple link-and-fill. Account number is already in the schema (`shipments.customer_account`, resolved via the claim's consignment number), so no new storage needed. Needs file-upload handling in the automation. |
| 4 | Claim origin | A claim is frequently a **state change inside an already-open WISMO thread**, not a fresh email — customer and courier were mid-conversation on a delivery query when the customer asks to file a claim | Needs a claim-intent detector watching active WISMO threads (same call pattern as `dissatisfactionEngine.js`), not just classification of new inbound email (Section 6.2) |
| 5 | Freshdesk API access | Live API key obtained (`moovparcel.freshdesk.com`) | Used read-only for the Section 4 research; **the first key shared was already invalid, and the working replacement was pasted in plaintext in chat twice — recommend rotating it in Freshdesk once this phase's initial data pull is done** |

---

## 8. Remaining Open Questions

1. **Freshdesk↔MoovOS matching key** (Section 6.4) — needs a quick API check
   (does a ticket/conversation expose the original email's `Message-ID`?) before the
   comparison job can be built reliably.
2. **How much raw content to retain in `inbox_classifications`.** Storing full
   subject/body long-term duplicates PII already living in Gmail/Freshdesk; storing
   nothing makes debugging misclassifications hard. Needs a retention decision (e.g.
   redacted subject + a short excerpt, TTL'd) before this table is built, not decided
   ad hoc during implementation.
3. **Urgency indicator scope** — Chinthaka flagged this as unresolved: should urgency
   surface for every new email, or only for claims? Recommend starting with all
   categories (cheap, reuses `NotificationBell`) and narrowing later if it's noisy,
   rather than under-building and missing a genuinely urgent billing/technical case.
4. **How long shadow mode runs, and what "good enough" looks like** before any
   category graduates from "compare only" to "acts on its own" (e.g. auto-creating
   tasks without a human double-checking, or filling claim forms) — not yet defined;
   should mirror WISMO's own category-level trust-threshold pattern
   (`workflowTrust.js`) rather than inventing a new gating mechanism.
5. **Claim-form portal fragility** — since no browser automation exists in the repo
   today, and courier-side form markup can change without notice, this needs its own
   monitoring (e.g. alert on a fill failure) from day one of Phase 2, not added
   reactively after it breaks silently.
6. **Other couriers' claim-form gate is unconfirmed.** DPD's flow (account number +
   checkbox) is confirmed and should be treated as the template, but DHL/Evri/UPS/
   Yodel need their own actual claim-form link checked before assuming the same
   automation approach works — building only against DPD first (Phase 2) rather than
   all couriers at once avoids wrongly generalizing from one courier's flow.
7. **Where the commercial invoice attachment comes from isn't yet defined.** The
   filler needs to identify the right email attachment in the thread to upload as
   value evidence — if a customer sends multiple attachments, or none, the automation
   needs a defined fallback (flag for human) rather than guessing or submitting
   without proof of value.

---

## 9. Phased Rollout

1. **Phase 0 — Shadow classification only.** Widen the existing triage taxonomy
   (Section 6.1), route non-WISMO email into Tasks, compute urgency, surface via
   `NotificationBell`. Freshdesk untouched. No claim-form automation yet.
2. **Phase 1 — Comparison tooling.** Build the reconciliation job (Section 6.4),
   resolve the matching-key question first (Section 8.1), and produce a per-category
   agreement report. This is the actual proof point before anything is trusted
   further.
3. **Phase 2 — Claim-form draft-fill.** Puppeteer opens the one-off claim-form link
   and pre-fills it from already-collected data; stops for human review/submit,
   mirroring WISMO's QA Bay draft pattern. Monitored for silent fill failures from day
   one (Section 8.5).
4. **Phase 3 — Selective autonomy.** Once Phase 1's comparison data shows a category
   is consistently accurate, consider retiring the human double-check for that
   category specifically (e.g. auto-creating tasks without review) — gated the same
   way WISMO gates autopilot per category, not a single global switch. Claim
   auto-submit (vs. draft-fill) would be a distinct, later decision requiring its own
   sign-off, not bundled into this phase.

---

## 10. Risks

- **Comparison accuracy is capped by data this project can't see** — the 35%
  MobiHelp-sourced ticket volume is invisible to a Gmail-only listener (Section 4.3).
  Any accuracy figure reported must be scoped to "of Email-sourced tickets," or it
  will look worse than it is / mislead a go/no-go decision.
- **No structured ground truth exists in Freshdesk** (Section 4.3, zero custom fields
  populated) — the comparison job can only diff Group/category, not deeper fields
  like claim value or tracking number, since Freshdesk doesn't capture those either
  today.
- **Claim-form links are one-off and likely time-limited/single-use** — if the
  browser-automation step fails partway or is retried later, the link may already be
  dead. Needs a defined failure path (flag for human fallback) from Phase 2, not
  discovered after the first real failure.
- **Freshdesk API key exposure** — the working key was shared in this chat in
  plaintext; treat it as compromised and rotate it once initial research pulls are
  done, independent of this project's timeline.
- **Taxonomy drift** — Freshdesk's own Group list (Section 4.1) will change over time
  as the business does; the classifier's target taxonomy and the space-mapping config
  (Section 6.3) need to be easy to update without a deploy, same reasoning already
  applied to `task_config`.
- **Running two classification systems in parallel is itself a cost** (Gemini calls
  double up on volume already being triaged for other purposes) — worth keeping an
  eye on the existing 20 req/min Gemini free-tier constraint already noted in
  `replyInterpreter.js`, since this project adds call volume on top of WISMO's
  existing usage.

---
