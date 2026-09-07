# WISMO Closed-Loop Automation — Solution Approach

**Prepared for:** Ross
**Subject:** Automating the customer ↔ courier query loop (all couriers)
**Status:** Draft for review

---

## 1. Executive Summary

Today the system triages a customer query, drafts a customer acknowledgement and a
courier inquiry, and stops — a human has to read, approve, and manually send both
emails, then manually relay the courier's reply back to the customer. Ross's ask is to
close that loop end to end: the system should sit in the middle of the conversation,
automatically acknowledging the customer, automatically raising the query with the
right courier contact, automatically reading the courier's reply, and automatically
answering the customer with it, looping this until the case resolves. A human only
gets pulled in when something falls outside SLA or the automated exchange stalls
(unclear reply, repeated back-and-forth, no response from the courier, etc.).

This is a scope expansion from "draft assistant" to "autonomous middleman with
exception handling," across all couriers at once rather than piloting on one.

---

## 2. Business Context and Objective

- Customer emails a query (e.g. "my parcel's gone missing").
- The system should immediately acknowledge the customer *and* raise a structured
  inquiry with the correct courier team (e.g. DPD Platinum) at the address defined in
  routing settings, without a human touching either email.
- When the courier replies, the system should interpret the reply, decide whether it
  answers the customer's question, and either (a) relay a customer-facing answer, or
  (b) push a follow-up question back to the courier, continuing the thread.
- A human ("QA Bay") is only needed when: the customer is **dissatisfied with the
  AI's answer**, or the case **breaches SLA** (confirmed by Ross as the two
  triggers for "human in the loop," with the expectation this definition will be
  revisited as the project matures), or the case belongs to a category that's
  excluded from autonomy (e.g. claims/complaints, per the existing Full Autopilot
  lockout).
- The customer must never be able to tell they're talking to an automated system —
  replies always read as if from a human. Moov will be transparent at a company
  level that automation is used to move emails back and forth with couriers and that
  responses are monitored, but individual messages are never flagged as AI-generated
  (confirmed by Ross).
- Scope: all couriers simultaneously, not a single-courier pilot.

---

## 3. What Changes vs Today

| Area | Today | Target |
|---|---|---|
| Customer ack | Drafted, needs approval | Sent automatically on triage |
| Courier inquiry | Drafted, needs approval | Sent automatically on triage |
| Courier reply | Manually read, manually relayed | Auto-ingested, auto-interpreted, auto-relayed |
| Follow-up questions | Not handled | Auto-generated and sent back to courier |
| Human role | Approves every message | Approves only exceptions (SLA breach, low confidence, stalled thread, excluded categories) |
| Scope | Draft-only, one send path unwired | Live send + live inbound read, all couriers |

---

## 4. Proposed Architecture

### 4.1 Component overview

1. **Triage (existing, Gemini)** — classifies courier + issue type from the inbound
   customer email. Unchanged in principle, but its output now drives a live send
   rather than a draft. The drafted courier inquiry must always include parcel
   description, contents, and value — per Sam, DPD/DHL/Yodel simply won't
   investigate without these, so a draft missing any of them shouldn't be sendable
   (see Section 9.2).
2. **Send Gateway (new)** — a single service both the approve endpoint and the new
   autonomous path call through. Wraps Gmail API / SendGrid, tags outbound mail with
   the **consignment number** as the primary matching key (corrected from the
   `[Ref: Moov-XXXX]` tag — see Section 9.3) while still including our internal ref
   for our own visibility, and logs every outbound message against the ticket. This
   replaces the TODO in `queries.js` ~line 1479 and gives autopilot and
   human-approved sends one shared, auditable code path.
3. **Courier Reply Listener (new)** — watches the mailbox(es) for inbound mail and
   resolves it to a ticket primarily by **consignment number**, since couriers don't
   preserve our ticket reference and DPD in particular tends to start a fresh email
   chain rather than reply within one (Section 9.3–9.4). This is the missing "read
   emails back from the couriers" half of the loop; nothing today ingests courier
   replies automatically.
4. **Reply Interpreter (Gemini)** — reads a courier's reply in the context of the
   original inquiry and decides one of three outcomes:
   - *Resolves the customer's question* → draft/send a customer-facing answer.
   - *Needs more info from the courier* → draft/send a follow-up to the courier,
     same thread.
   - *Ambiguous / doesn't address the question* → escalate to a human.
   Must also distinguish a genuine answer from a **generic non-answer** (Sam flags
   that DPD will send a copy-paste "unexpected issue" reply without actually
   investigating) — a generic reply should be treated as "needs more info," not
   "resolves," or the loop will falsely close out cases. Should also recognise and
   auto-handle DPD's standard **GDPR address-reconfirmation request** without
   escalating, since it's a known, expected courier behaviour rather than an
   exception.
5. **Loop Controller / State Machine (new)** — the actual "automated table tennis."
   Owns per-ticket state (awaiting courier / awaiting customer / awaiting human /
   resolved) and a single **whole-case SLA clock** (confirmed by Ross: escalation is
   time-based, not a count of exchanges — e.g. 48 hours from when the customer first
   raised the query, not 48 hours per reply). Every transition in this state machine
   is what decides whether the *next* action is auto-sent or handed to QA Bay.
6. **Autonomy Gate (extends `workflowTrust.js`)** — trust is earned **per
   courier+issue-type category as a whole** (confirmed by Ross): 20 consecutive clean
   cases of, say, "DPD missing parcel," unlocks autopilot for that category end to
   end, not per individual hop. Permanent claims/complaints lockout still applies.
   Once a category is in autopilot, the gate also owns **random spot checks** (Ross's
   ask): a small daily sample of autopiloted cases per category is pulled into QA Bay
   for a human to review after the fact, as an ongoing quality check rather than a
   pre-send approval.
7. **QA Bay (existing UI, extended)** — becomes the exception queue: SLA breaches,
   low-confidence interpretations, stalled threads, and locked-out categories land
   here instead of every message landing here.

### 4.2 Flow (happy path)

```
Customer email → Triage → [Autonomy Gate: send ack? send inquiry?]
   → Customer ack sent automatically
   → Courier inquiry sent automatically to routed address (e.g. DPD Platinum)
   → Loop Controller: state = awaiting courier reply, SLA clock starts
Courier reply arrives → Reply Listener (matched by consignment number) → Reply Interpreter
   → Resolves? → [Autonomy Gate] → Customer-facing answer sent → state = resolved
   → Generic non-answer? → treated as "needs more info," follow-up sent, not closed
   → Needs more info? → [Autonomy Gate] → Follow-up sent to courier → state = awaiting courier reply (loop, unbounded by count)
   → Doesn't match the conversation history / ambiguous? → escalate to QA Bay
No reply from courier:
   → 48h → first chase (light reminder tone)
   → 120h → second chase (firmer, "continuing to progress" tone)
   → beyond that → escalating chase, CC'ing further contacts each time (see Section 9.2)
Whole-case SLA clock expires at any point → escalate to QA Bay (Sam) regardless of gate
```

Note: the per-courier enquiry window (when to first contact the courier at all) and
the whole-case customer-facing SLA (when to escalate to a human) are **two different
clocks** — see Section 9.1 and the open question in Section 7 about reconciling
them.

### 4.3 Data model additions (indicative)

- `queries`: add `automation_state` (enum: triaged / awaiting_courier / awaiting_customer /
  awaiting_human / resolved / escalated), `sla_deadline` (set once, from the moment the
  customer's query is raised — not reset per exchange), `chase_stage` (0/1/2/3+ —
  tracks which chase tier we're at, since chasing escalates in tone and CC list
  beyond just a single reminder), `consignment_number` (the actual matching key —
  see Section 9.3), `courier_network_entry_date` (needed to calculate the
  per-courier enquiry window, which runs from network entry, not query date — see
  Section 9.1).
- `query_emails`: add `sent_by` (autopilot / human), `send_status`, `courier_message_id`
  (for threading/dedup on inbound), `required_fields_present` (bool — did the drafted
  courier inquiry include description/contents/value, per Section 9.2), `is_generic_reply`
  (flag set by the Reply Interpreter for copy-paste non-answers).
- `duplicate_of` (on `queries`, nullable, self-referencing) — for merging DPD's and
  customers' duplicate tickets against the same consignment number (Section 9.7).
- `workflowTrust.js` store: unchanged in shape — trust score stays per courier+issue-type
  category (not split per hop), per Ross's confirmation. Add a `spot_check_sample`
  flag/table so the daily random-sample job has somewhere to record which autopiloted
  tickets were pulled for review and their outcome.
- New `automation_settings` (per category or global): `claims_lockout_scope`
  (`full_lockout` / `final_step_only`), `spot_check_rate` (percentage or count),
  `spot_check_reviewers` (list, supports multiple people/rotation — though Sam wants
  to be the sole reviewer to start, see Section 9.5).
- `query_emails` (or a new `dissatisfaction_signals` table): record which of the two
  checks fired on an escalation — explicit complaint match, sentiment read, or both —
  so the false-positive rate on each can be measured separately once live.

---

## 5. Decisions from Ross

| # | Question | Ross's answer | Impact on design |
|---|---|---|---|
| 1 | Granularity of autonomy | Per courier+issue-type category, covering the whole conversation, not per hop. Also wants **random spot checks**: a daily sample of autopiloted tickets pulled for human review after the fact. | Autonomy Gate and `workflowTrust.js` stay category-scoped (simpler than per-hop). New: spot-check sampling job + QA Bay view for it. |
| 2 | Loop bound | Not exchange-count based. Time-based only — SLA breach is what triggers escalation. Sam will own the actual SLA values (days/hours). | Drop the bounded exchange counter from the Loop Controller; rely solely on the whole-case SLA clock. |
| 3 | SLA definition | Single clock for the **whole case**, from when the customer raises the query (e.g. 48h total, not 48h per reply). | `sla_deadline` set once at triage, never reset by follow-up exchanges. |
| 4 | Reply matching | Confirmed important: replies must be tied together via the `[Ref: Moov-XXXX]` tag so the thread makes sense. | Threading tag remains the primary match key, as designed. **⚠ Corrected by Sam in Section 9 — couriers actually key off the consignment number, not our ref tag. See Section 9.3.** |
| 5 | Multi-thread mailboxes | Ross doesn't have a definitive answer — believes couriers thread on their end and hasn't seen this happen, but wants it checked with Sam. In the meantime, his suggestion: the AI should sanity-check an incoming reply against the conversation history and flag it if it doesn't make sense in context. | Add a **consistency check** step to the Reply Interpreter (does this reply logically follow from the thread so far?) as a safety net, independent of whatever Sam confirms about courier-side threading. |
| 6 | Failure/no-response | Yes — auto-chase (reminder) before escalating to a human. Exact timing/wording of the chase to be defined by Sam. | Add an auto-chase step to the flow, timing configurable (owned by Sam), before the whole-case SLA escalates to QA Bay. |

### 5.1 Round 2 decisions

| # | Question | Ross's answer | Impact on design |
|---|---|---|---|
| 1 | Does "responses don't work" include a dissatisfied customer? | Yes. "Human in the loop" = dissatisfied customer **or** SLA breach — nothing else, for now. Ross expects this definition to be revisited multiple times as the project matures. | Escalation logic has exactly two triggers at this stage: a detected dissatisfaction signal from the customer, and SLA breach. Build this as a clearly isolated rule set so it's cheap to extend later, not hard-coded assumptions elsewhere. |
| 2 | Should the customer know it's automated? | Never, at the individual message level. Company-level messaging will say Moov uses automation to communicate with couriers and monitors it, but no reply is ever labeled as AI-generated. | Customer-facing copy must read as human-authored; no "this is an automated response" disclaimers on individual emails. Any transparency messaging lives at a company/policy level (e.g. T&Cs, FAQ), outside this system. |
| 3 | Claims/complaints lockout scope | Ross wasn't sure what was being asked — needs the question re-framed. | Carried forward as an open item (see Section 7), rephrased. |
| 4 | Auto-chase reminders | Reconfirmed: yes, wants auto-chasers. SLA for the chase itself will also be set with Sam. | Consistent with the Round 1 answer; no change, just reconfirmed. |
| 5 | Cost ceiling on Gemini calls | Yes, wants an actual £ figure per month. Wants it derived from current inbox/email volume rather than picked arbitrarily. | Add an action item (Section 7) to pull current ticket/email volume and estimate Gemini call costs under the new per-reply interpretation + consistency-check pattern, before proposing a ceiling. |
| 6 | Courier routing email reliability | Not reliable today. Sam is sourcing real templates/addresses from couriers, in progress. Ross's instruction: build the automation engine now against placeholder/test send targets, wire in real courier addresses as they're delivered ("build the engine first, put the fuel in later"). | Decouples Phase 1 from address readiness — see updated Phase 1 below. Send Gateway and courier config should be built so swapping a placeholder address for a real one is a config change, not a code change. |
| 7 | Misrouted/merged courier reply | Flag to a human to reconcile. Ross doesn't expect this to come up often in practice. | Reply Listener treats an unmatched/ambiguous ticket reference as an automatic escalation to QA Bay, not a silent drop. Low priority to harden further unless it's seen in practice. |

---

## 6. Phased Rollout

1. **Phase 1 — Send transport live, still human-approved.** Wire the Send Gateway
   into the existing approve endpoint only, built against placeholder/test send
   targets so it isn't blocked on courier addresses being ready (per Ross: build the
   engine first, add real addresses as Sam delivers them). Courier config should
   make swapping a placeholder for a real address a settings change, not a code
   change. No behavior change for QA Bay in this phase.
2. **Phase 2 — Inbound listener + Reply Interpreter, still draft-only.** Build the
   Courier Reply Listener and Interpreter, but land its output as a draft for QA Bay
   approval (same pattern as today), rather than auto-sending. This validates
   interpretation quality without risking a bad auto-send to a customer.
3. **Phase 3 — Loop Controller + Autonomy Gate live.** Turn on auto-send per the
   existing category-level trust-threshold logic (confirmed unchanged in shape by
   Ross), plus the whole-case SLA clock, auto-chase reminders, and the reply
   consistency check. Claims/complaints remain permanently gated to human review, as
   today. Turn on random spot-check sampling for categories once they're in
   autopilot.
4. **Phase 4 — All couriers.** Since Ross wants all couriers from day one, Phases 1–3
   should be built courier-agnostic from the start (routing table already supports
   this); Phase 4 is really "remove any single-courier test flag" rather than new
   build.

---

## 7. Remaining Open Questions

**Answered by Sam (see Section 9 for full detail):** per-courier chase cadence,
required fields for courier inquiries, reference/matching approach, courier
address/template ownership, spot-check volume, and current ticket volume are all now
answered. Two follow-ups fell out of her answers and need a quick clarification:

1. **DPD's enquiry window is stated two different ways** in Sam's answer — "up to 14
   days from network entry" in one line, "5 days" in another. Needs a quick check
   with Sam on which is correct (or whether both apply to different situations).
2. **Two SLA clocks need reconciling.** Ross's whole-case SLA (Section 5, decision 3)
   runs from when the customer raises the query. Sam's per-courier enquiry windows
   (Section 9.1) run from when the parcel enters the courier's network — a different
   start point. Need to confirm with Ross/Sam whether the courier-enquiry clock and
   the human-escalation clock are meant to be two genuinely separate things (likely),
   and if so, make sure that's reflected clearly in whatever Sam and Ross each see
   when they're told "the SLA."
3. Timeline for real courier routing addresses/templates being sourced, so Phase 3
   (autonomous send) isn't gated on a courier that hasn't been onboarded yet — still
   open, Sam confirmed she's compiling these but no date given.

**Still open with Ross:** none outstanding — see Round 3 decisions below.

---

### 7.1 Round 3 decisions

These came back as design preferences to build in as configurable options, rather
than fixed answers, so they still need a quick sign-off from Ross once he sees the
actual defaults/UI, but they're solid enough to design against now.

| # | Question | Decision | Impact on design |
|---|---|---|---|
| 5 | Claims/complaints lockout scope | Make it a configurable setting rather than a fixed rule: whoever administers the system can choose, per category, whether a claim/complaint locks the *entire* conversation to human approval, or only the final resolution/payout step. | Add a setting (e.g. on the category/courier config) with two modes: `full_lockout` / `final_step_only`. Autonomy Gate reads this per case instead of having the behaviour hard-coded. Needs a sensible default until someone sets it explicitly — recommend defaulting to `full_lockout` (safer) unless Ross says otherwise. |
| 6 | Spot-check sample size | No fixed percentage yet — make the sample rate configurable (e.g. "review N% of autopiloted cases per category per day," or a flat count). Also needs support for **multiple reviewers**, not just one person. **Sam has since sized this concretely — see Section 9.5: ~83 cases/week (~12/day) to start, and she wants to be the sole reviewer initially**, though the system should still support multiple/rotating reviewers as designed. | Add a `spot_check_rate` setting per category (percentage or count), plus a reviewer list/rotation rather than a single owner. QA Bay's exception queue and the spot-check queue should probably stay visually separate even if they share the same UI, since one is "something went wrong" and the other is "routine check," and mixing them risks the spot-check queue getting ignored. |
| 7 | Dissatisfaction signal | Both: explicit complaint language in the customer's reply *and* AI-read sentiment/tone. | Reply Interpreter needs two checks feeding the same escalation trigger: a keyword/phrase pattern for explicit complaints, and a sentiment read on tone. Either one firing escalates. Worth validating the sentiment check's false-positive rate before Phase 3, since normal frustrated-but-fine customer language could easily over-trigger it if it's too sensitive. |
| — | Cost ceiling action item | Confirmed — proceed with pulling current inbox volume to build the estimate. | No design impact; this is a data-gathering task, not a build task. Owner: whoever's compiling this doc (tracked as an action item below). |

**Action item:** pull current inbox volume (tickets/month, average exchanges per
ticket) so a realistic £/month Gemini cost estimate can be put in front of Ross to
set the ceiling he's asked for. Confirmed as the right next step — not yet done.

---

## 8. Risks

- **Auto-sending to real customers/couriers is a one-way door.** A bad interpretation
  auto-sent to a customer can't be recalled. Recommend Phase 2 (draft-only inbound)
  isn't skipped even under time pressure.
- **Courier reply parsing is the hardest, least controllable part.** Couriers won't
  all format replies the same way; email threading conventions vary. Interpretation
  quality here — not the outbound send — is the real risk to the "automated table
  tennis" working smoothly.
- **Category-level trust hides hop-level weakness.** Since trust is now confirmed to
  be earned per courier+issue-type as a whole rather than per hop, a category could
  reach autopilot on the strength of clean acks and inquiries while its
  courier-reply interpretation is actually shaky. The spot-check sampling Ross asked
  for is the main mitigation here, so it shouldn't be treated as a nice-to-have for
  a later phase.
- **Whole-case SLA with no exchange bound** means a case that's genuinely
  ping-ponging (courier keeps replying with something new, AI keeps following up)
  won't get pulled into QA Bay until the deadline hits, even if it's clearly not
  converging. Worth flagging to Ross/Sam as a possible gap once real volume is seen,
  even though the current instruction is time-based only.
- **"Dissatisfaction" isn't yet a defined signal.** It's now one of only two
  escalation triggers Ross wants, but nobody has defined what counts (explicit
  complaint text, sentiment score, keyword match). Building this vaguely risks
  either escalating too much (defeats the point of autopilot) or missing genuine
  dissatisfaction (defeats the point of having it as a safety trigger). This should
  be nailed down before Phase 3, not left to be inferred during implementation.
- **Cost ceiling can't be set without a volume baseline.** Ross wants a £/month
  figure but explicitly wants it derived from real inbox volume, not guessed. This
  is a blocking action item, not a design risk per se, but it will hold up sign-off
  on Phase 3 scope if not done early.
- **Reply consistency check is a new, unvalidated AI judgment call** (does this
  reply make sense given the thread history?), separate from the interpretation
  itself. It needs its own accuracy check before being trusted, since it's the
  fallback for the exact multi-thread/mismatched-reply scenario nobody has fully
  confirmed can't happen.
- **Sentiment-based dissatisfaction detection risks over-triggering.** Customers
  chasing a missing parcel are often already a bit terse or frustrated without being
  genuinely dissatisfied with the automated handling. If the sentiment check is
  tuned too sensitively, it could escalate a large share of normal cases and quietly
  defeat the point of autopilot. Recommend validating this against real historical
  replies before turning it on live, not just trusting the model's default read.
- **Configurable settings need sensible defaults before anyone sets them.** Both the
  claims/complaints lockout scope and the spot-check rate are now configurable
  rather than fixed, which is more flexible but means the system needs a safe
  out-of-the-box default (recommend `full_lockout` for claims/complaints) so nothing
  ships in a permissive state by accident before Ross has actually chosen a setting.
- **DPD's habit of starting new email chains fragments a single case across up to
  ~10 threads** (Sam's estimate). Consignment-number matching (Section 9.3) is the
  fix, but this means the Reply Listener cannot assume "one ticket = one email
  thread," and needs to actively merge inbound mail from unrelated threads onto the
  same case.
- **Volume and cost estimates will be inflated by duplicates** unless deduplication
  happens first — Sam flags that both DPD and customers regularly raise duplicate
  tickets for the same issue (Section 9.6). The 325/month WISMO figure and the
  claims figures both need a dedup pass before they're used to size Gemini costs or
  spot-check sample rates, or both will be set too high.

---

## 9. Answers from Sam

Sam's answers surfaced enough operational detail to materially change parts of the
design above (flagged inline where relevant), not just fill in configuration values.

### 9.1 Per-courier enquiry windows

This is a **different clock** from the whole-case customer SLA agreed with Ross
(Section 5, decision 3). The whole-case SLA is "how long from the customer raising
the query until we escalate to a human." This window is "how long we're allowed to
wait before we're required to first contact the courier at all" — and critically, it
runs from **the date the parcel enters the courier's network**, not from the date
the customer emailed us. These two clocks need to be reconciled — see Section 7.

| Courier | Official allowed window | Sam's practical recommendation |
|---|---|---|
| DHL | No fixed day requirement | Enquire within 48h — DHL is slow to reply, so waiting the "allowed" time isn't practical |
| DPD | Two figures given: 14 days (general) and 5 days (Sam's other note) — **needs clarifying with Sam, see Section 7** | — |
| Yodel | 14 days from network entry | Treat like DHL (48h) — courier is newer to us, trust not yet established |
| Evri | Believed ~10 days | Sam isn't confident in this figure — needs confirming |
| UPS | 8 days standard, 15 days international | Treat like DHL (48h) rather than waiting the full allowed window |
| International (any courier) | As above per courier | Still must enquire within the same window, but allow more time for the courier to investigate once raised |

Claim type/reason does not change any of these windows, per Sam.

### 9.2 Chase cadence (couriers gone quiet)

Sam's current manual process, which the automated chase policy should mirror:

1. **First chase — 48 hours after sending.** Light-touch reminder.
2. **Second chase — 120 hours after sending.** Firmer: notes we haven't heard back
   and need to keep progressing.
3. **Beyond that — Sam escalates indefinitely**, each contact going up a stage and
   CC'ing in more people, until she gets a response.

**Required fields:** DPD, Yodel, and DHL will not investigate at all unless the
enquiry includes (1) a description of the parcel, (2) its contents, and (3) its
value. A courier inquiry draft missing any of these is effectively guaranteed to
fail and waste a chase cycle, so this should be enforced before an inquiry is
allowed to send (see `required_fields_present` in Section 4.3).

### 9.3 Reply matching — correction to earlier design

**This corrects Round 1 decision #4 (Section 5).** It was assumed the
`[Ref: Moov-XXXX]` tag would be the reliable way to tie a courier's reply back to
the right ticket. Sam's answer: **couriers don't preserve our reference at all —
they key off the consignment number.** Our internal ticket number should stay on
our side (it's useful for us), but the system needs to match inbound courier mail
primarily by consignment number, not by our tag.

At the claims stage, DHL, DPD, and Yodel issue their own claims reference number,
but it's tied to the consignment number, so matching still works the same way.

One quirk to design around: DPD will sometimes ask us to reconfirm the full
delivery address mid-thread, citing GDPR. Sam suspects this is sometimes used as a
stalling tactic (it can arrive after the address was already confirmed earlier in
the same thread). Regardless of intent, this is a known, expected request — the
system should recognise it and respond automatically rather than treating it as an
exception requiring a human.

### 9.4 Courier addresses and templates — status

- Sam will compile and maintain these directly, since they change frequently.
- She's only fully confident in DPD's process today (documented in a PDF), and even
  that comes with caveats — new/unexpected sender addresses show up regularly.
- DPD frequently starts a **new email chain** rather than replying within an
  existing one, which is why a single case can end up spread across as many as ~10
  separate threads. Grouping by sender contact doesn't solve this either — DPD alone
  has too many different contacts in play (Sam raised 20+ claims enquiries to DPD in
  a single week). This reinforces why consignment-number matching (9.3) has to be
  the primary mechanism, not thread/contact-based grouping.

### 9.5 Spot-check capacity

Sam pulled her own performance data over 3 weeks to size this realistically rather
than guessing:

- She raises **55.33 delivery enquiries/week** on average that genuinely need
  chasing (excluding ones she can resolve with a quick check herself).
- Of those, **24.66/week on average become full claims** submissions.
- Current time cost: ~1h50m/week on enquiries, ~2h03m/week submitting claims, plus
  ~4h06m/week on customer back-and-forth (chasing evidence, handling pushback) —
  **~7h59m/week total** she estimates this automation could save her.
- Her recommendation for an initial spot-check target: **1.5× her current
  enquiry volume**, i.e. roughly **83 cases/week (~12/day)** to start, rather than
  jumping straight to double.
- She wants to be the **sole reviewer to start** — bringing someone else in means
  training them first, which she'd rather not take on yet. (The system should still
  support multiple reviewers per Round 3 decision #6, but the initial rollout is a
  team of one.)

### 9.6 Actual volume

- **Claims:** June 33, July 74, August 60, September (4 days in) 18. Recent 3-month
  average ≈ 56/month, trending upward.
- **WISMO enquiries overall:** 976 over the last 3 months ≈ 325/month.
- Both figures include an unknown amount of duplication — DPD duplicates emails
  rather than sending one, and customers duplicate tickets too (Section 9.7) — so
  the true unique-case volume is lower than these raw figures. **Needs a dedup pass
  before either number is used to size Gemini costs or spot-check rates** (see Risks
  above).

### 9.7 Other things Sam flagged ("anything we've missed")

- DPD duplicates tickets; customers duplicate tickets too.
- Customers often don't provide a consignment number — needs a defined fallback
  (hold the ticket pending the number, prompt the customer for it, etc.).
- Customers aren't always truthful about parcel contents/value/condition — full
  automation can't assume claim details are accurate; this may be a natural limit on
  how far claims specifically can be autopiloted versus WISMO enquiries.
- DPD will send a generic "unexpected issue" non-answer if they can get away with
  it, only giving a real reason once escalated — reinforces the need for the
  generic-reply detector in Section 4.1.
- **Possible future scope (not in current build):** automating with international
  delivery partners directly, since their tracking is often more accurate/current
  than DPD's own tracking for international parcels.
- **New issue subtype to account for:** DPD occasionally returns a parcel with no
  delivery attempt at all, usually due to a technical/processing error. This can be
  claimed for on both the outbound and inbound leg, but only once the parcel has
  actually been returned and received, and still requires full claims documentation.
  Worth a distinct workflow rather than folding it into standard "lost" or "damaged"
  handling.
