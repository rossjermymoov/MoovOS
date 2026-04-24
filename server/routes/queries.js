/**
 * Moov OS — Queries & Claims Inbox
 *
 * Handles the full lifecycle of customer queries and claims:
 * inbound email processing, AI draft approval, courier communication,
 * email sender mapping, and real-time dashboard statistics.
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries
// Inbox list — supports filtering, sorting, pagination
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const {
      status, courier_code, customer_id, query_type, trigger,
      requires_attention, sender_matched,
      search,
      date_from, date_to,
      sort = 'updated_at', order = 'desc',
      limit = 50, offset = 0,
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      conditions.push(`status = ANY($${idx++}::query_status[])`);
      values.push(statuses);
    }
    if (courier_code) {
      conditions.push(`courier_code = $${idx++}`);
      values.push(courier_code);
    }
    if (customer_id) {
      conditions.push(`customer_id = $${idx++}`);
      values.push(customer_id);
    }
    if (query_type) {
      conditions.push(`query_type = $${idx++}::query_type`);
      values.push(query_type);
    }
    if (trigger) {
      conditions.push(`trigger = $${idx++}::query_trigger`);
      values.push(trigger);
    }
    if (requires_attention === 'true') {
      conditions.push(`requires_attention = true`);
    }
    if (sender_matched === 'false') {
      conditions.push(`sender_matched = false`);
    }
    if (date_from) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(date_to);
    }
    if (search) {
      conditions.push(`(
        consignment_number ILIKE $${idx}  OR
        customer_name      ILIKE $${idx}  OR
        subject            ILIKE $${idx}  OR
        claim_number       ILIKE $${idx}  OR
        sender_email       ILIKE $${idx}
      )`);
      values.push(`%${search}%`);
      idx++;
    }

    const validSorts = ['created_at', 'updated_at', 'latest_email_at', 'claim_days_remaining', 'age_days'];
    const sortCol = validSorts.includes(sort) ? sort : 'updated_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Attention-required rows always float to the top
    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT *,
          LEFT(latest_email_preview, 120) AS latest_email_preview
        FROM queries_inbox_view
        ${where}
        ORDER BY requires_attention DESC, ${sortCol} ${sortDir} NULLS LAST
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, parseInt(limit), parseInt(offset)]),
      query(`SELECT COUNT(*)::int AS total FROM queries_inbox_view ${where}`, values),
    ]);

    res.set('Cache-Control', 'no-store');
    res.json({
      queries: dataRes.rows,
      total:   countRes.rows[0].total,
      limit:   parseInt(limit),
      offset:  parseInt(offset),
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/debug  — diagnostic
// POST /api/queries/seed-now — force-seed 10 practice queries right now
// ─────────────────────────────────────────────────────────────────────────────

router.get('/debug', async (req, res, next) => {
  try {
    const [queryCount, customerCount, migrations, enumValues, viewTest, columns, sampleParcels] = await Promise.all([
      query(`SELECT COUNT(*)::int AS n FROM queries`),
      query(`SELECT COUNT(*)::int AS n FROM customers WHERE primary_email IS NOT NULL`),
      query(`SELECT filename, run_at FROM _migrations WHERE filename LIKE '07%' ORDER BY filename`),
      query(`SELECT unnest(enum_range(NULL::query_status))::text AS v`),
      query(`SELECT COUNT(*)::int AS n FROM queries_inbox_view`),
      query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'queries' ORDER BY ordinal_position`),
      query(`SELECT DISTINCT ON (p.customer_id)
               p.consignment_number, p.courier_code, p.courier_name, p.service_name,
               p.status AS parcel_status, p.last_event_at,
               c.id AS customer_id, c.business_name, c.primary_email
             FROM parcels p
             JOIN customers c ON p.customer_id = c.id
             WHERE c.primary_email IS NOT NULL AND p.consignment_number IS NOT NULL
             ORDER BY p.customer_id, p.last_event_at DESC NULLS LAST
             LIMIT 12`),
    ]);
    res.json({
      queries_count:        queryCount.rows[0].n,
      customers_with_email: customerCount.rows[0].n,
      migrations_run:       migrations.rows,
      query_status_values:  enumValues.rows.map(r => r.v),
      inbox_view_count:     viewTest.rows[0].n,
      queries_columns:      columns.rows.map(r => r.column_name),
      sample_parcels:       sampleParcels.rows,
    });
  } catch (err) { next(err); }
});

router.get('/seed-now', async (req, res, next) => seedNowHandler(req, res, next));
router.post('/seed-now', async (req, res, next) => seedNowHandler(req, res, next));
async function seedNowHandler(req, res, next) {
  try {
    // 12 hardcoded scenarios using real parcels and customers from the live DB
    // Each has a distinct tone so the AI can practise reading customer sentiment
    const SEEDS = [
      {
        consignment_number: '1760776790',
        customer_id: '006249c4-a38f-4ad4-aa19-7447cf3cce4a',
        business_name: 'Westcare Ltd',
        primary_email: 'lee@westcare.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-nd', service_name: 'DPD Domestic Parcel Next Day',
        type: 'not_delivered', status: 'awaiting_courier', attention: true, daysAgo: 5,
        subject: `DPD tracking shows delivered — ref ${1760776790} — we have not received this`,
        body: `Hi Moov team,\n\nI'm chasing consignment 1760776790 which DPD are claiming was delivered yesterday at 11:54. Nobody at our premises received it and we've checked with every member of staff.\n\nWe have CCTV covering the entrance and there is no footage of a DPD driver or van at any point yesterday morning. I've attached a still to this email.\n\nThis shipment contained care equipment worth over £800. I need this investigated as a matter of urgency — if DPD can't produce a GPS delivery confirmation or signature I'll be expecting a full replacement or refund.\n\nPlease come back to me by end of day.\n\nLee\nWestcare Ltd`,
      },
      {
        consignment_number: '2313715868',
        customer_id: '0d1da410-7cb0-4fa2-92a7-98a512b0440f',
        business_name: 'Capatex Limited',
        primary_email: 'neil.pike@capatex.com',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-nd', service_name: 'DPD Domestic Parcel Next Day',
        type: 'whereabouts', status: 'open', attention: false, daysAgo: 3,
        subject: `Quick one — where has 2313715868 got to?`,
        body: `Hi,\n\nHope you're well. Just a quick check-in on this one — tracking shows it was collected a few days ago but hasn't updated since. We're not in a massive rush but our customer is starting to ask questions so just wanted to check nothing has gone sideways.\n\nConsignment is 2313715868, DPD next day.\n\nCheers\nNeil\nCapatex Limited`,
      },
      {
        consignment_number: '60120241549129',
        customer_id: '0d9db960-ecee-4815-a687-c2d5105a4013',
        business_name: 'Perex Group Ltd',
        primary_email: 'info@perex.co.uk',
        courier_code: 'dhlparcelukcloud', courier_name: 'DHL',
        service_code: 'dhl-parcel', service_name: 'DHL Parcel UK Parcel',
        type: 'delay', status: 'courier_investigating', attention: false, daysAgo: 7,
        subject: `Still waiting — 60120241549129 — I emailed about this last week`,
        body: `Hello,\n\nI contacted you last week about this shipment and received no response, so I'm following up again.\n\nConsignment 60120241549129 was booked with DHL over a week ago. The tracking has never moved past the initial booking confirmation. No collection, no depot scan, nothing.\n\nI need to know:\n1. Was this parcel actually collected?\n2. If so, where is it now?\n3. If not, why not and when will it be?\n\nThis is holding up a project for one of our clients. Please treat this as urgent.\n\nPerex Group`,
      },
      {
        consignment_number: '2313434059',
        customer_id: '12760b23-fddd-45be-ab14-9031b6241ed3',
        business_name: 'E-Health Pharmacy Ltd',
        primary_email: 'hello@thehealthpharmacy.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-epak-nd', service_name: 'DPD Domestic Expresspak Next Day',
        type: 'damaged', status: 'awaiting_customer_info', attention: false, daysAgo: 4,
        subject: `Damaged pharmaceutical shipment — 2313434059 — urgent documentation required`,
        body: `Dear Moov Parcel team,\n\nI am writing to formally report that consignment 2313434059, delivered today, arrived in an unacceptable condition. The outer packaging was significantly crushed on one corner and two of the internal blister packs were cracked, rendering the contents non-dispensable.\n\nAs a registered pharmacy we are required to dispose of any damaged pharmaceutical goods in accordance with MHRA guidelines, which represents both a cost and a regulatory obligation for us.\n\nI have photographed the damage to the outer box, the internal packaging and the affected products. Please advise on the claims process and what supporting documentation you require from us. We will need reimbursement for the destroyed stock.\n\nKind regards\nE-Health Pharmacy Ltd`,
      },
      {
        consignment_number: '60120241551513',
        customer_id: '1b42c791-27e5-4f7d-9d6a-8f524bcad6b3',
        business_name: 'Boori (Europe) LTD',
        primary_email: 'kevin@boori.co.uk',
        courier_code: 'dhlparcelukcloud', courier_name: 'DHL',
        service_code: 'dhl-parcel', service_name: 'DHL Parcel UK Parcel',
        type: 'whereabouts', status: 'open', attention: false, daysAgo: 2,
        subject: `60120241551513 — nursery furniture delivery, customer has a baby due Friday`,
        body: `Hi Moov,\n\nI'm hoping you can help with this one — it's a bit time-sensitive. Consignment 60120241551513 is a nursery cot set being delivered to one of our retail customers. Their end customer is due to give birth on Friday and the family are understandably very anxious to have it there before then.\n\nTracking hasn't updated since it was booked with DHL. Can you check where it is in the network and give me an honest assessment of whether it'll make it by Thursday?\n\nIf it won't, I need to know now so I can arrange an alternative. Really appreciate your help on this.\n\nKevin\nBoori Europe`,
      },
      {
        consignment_number: '2313706054',
        customer_id: '1ef19209-0b4f-48cb-a254-bf5ea7b6b79f',
        business_name: 'Techworknetwork LTD',
        primary_email: 'exploregadgets.ebay@gmail.com',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-sat', service_name: 'DPD Domestic Parcel Saturday',
        type: 'failed_delivery', status: 'open', attention: false, daysAgo: 3,
        subject: `Saturday delivery 2313706054 — driver never showed, I paid a premium for this`,
        body: `Right,\n\nI specifically booked and paid for Saturday delivery on consignment 2313706054 so that someone would be home to receive it. I cleared my entire Saturday and waited in all day.\n\nNo driver. No card. No notification. Nothing.\n\nI checked the DPD app and it says "delivery attempted" at 09:12 — that is categorically false. I was sitting in my kitchen with a clear view of the front door from 8am. There was no knock, no van outside, no nothing.\n\nI want a full explanation of what happened and I want this redelivered. If it can't be Saturday again then I want a refund of the Saturday premium I paid. This isn't good enough.\n\nTechworknetwork`,
      },
      {
        consignment_number: '2313742633',
        customer_id: '1f00d1e5-d315-4513-8dbe-5bb68a2af662',
        business_name: 'TMK Trading Ltd t/a Nexus Modelling Supplies',
        primary_email: 'sales@nexusmodels.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-epak-nd', service_name: 'DPD Domestic Expresspak Next Day',
        type: 'missing_items', status: 'awaiting_customer_info', attention: false, daysAgo: 6,
        subject: `2313742633 — package arrived but 3 model kits missing`,
        body: `Hello,\n\nWe received consignment 2313742633 yesterday and on opening found that three items from the order are missing. The box itself was sealed and showed no signs of tampering — the packing tape looked intact — so we're a little baffled as to how this has happened.\n\nThe missing items are:\n- 2x Tamiya 1:35 Tiger I (late production) kit\n- 1x Vallejo Model Air paint set (71 colours)\n\nTotal value of missing stock is approximately £94.\n\nWe're not trying to cause any trouble — these things happen — but we do need to get this resolved as they're customer orders. Can you advise on next steps?\n\nMany thanks\nNexus Modelling Supplies`,
      },
      {
        consignment_number: '1760355119',
        customer_id: '20bd42ff-a6ed-4108-bfe2-a730cd504a7e',
        business_name: 'Empire Printing & Embroidery Ltd',
        primary_email: 'andrew@empireclothing.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-epak-nd', service_name: 'DPD Domestic Expresspak Next Day',
        type: 'wrong_address', status: 'awaiting_courier', attention: true, daysAgo: 1,
        subject: `URGENT — 1760355119 out for delivery to wrong address RIGHT NOW`,
        body: `URGENT — please call me.\n\nConsignment 1760355119 is currently showing as out for delivery but the DPD app is showing it going to our old unit address (Unit 4) — we moved to Unit 12 eight months ago and updated our address with you at the time.\n\nThe driver is already out. If they deliver to Unit 4 the parcel will almost certainly be left outside an empty unit or taken by whoever is there now.\n\nThis is time-sensitive printed workwear for a corporate client event tomorrow morning. If it goes to the wrong address and we can't recover it in time I'll be in serious trouble with the client.\n\nPlease contact DPD depot NOW to redirect the driver.\n\nAndrew\nEmpire Printing & Embroidery\n07XXX XXXXXX`,
      },
      {
        consignment_number: '60120241563530',
        customer_id: '246eb53e-53f2-472c-b659-9bdd4c3bbc1e',
        business_name: 'EZZTECH',
        primary_email: 'info@ezztech.co.uk',
        courier_code: 'dhlparcelukcloud', courier_name: 'DHL',
        service_code: 'dhl-parcel', service_name: 'DHL Parcel UK Parcel',
        type: 'returned', status: 'awaiting_courier', attention: true, daysAgo: 8,
        subject: `60120241563530 — returned to sender WITHOUT a single delivery attempt`,
        body: `I am absolutely furious.\n\nConsignment 60120241563530 has been returned to sender. DHL have not made a single delivery attempt — there is nothing in the tracking history showing a visit to our address, no card was left, and nobody at our office received any notification.\n\nThis was tech stock worth over £1,200 that we needed urgently for a client install. Because of this failure we have had to source emergency replacements at a much higher cost and tell a client their project is delayed.\n\nI want:\n1. A full explanation of why this was returned without any attempt\n2. The parcel redirected back to us immediately\n3. Compensation for the additional costs we've incurred\n\nIf this isn't resolved satisfactorily I will be moving our account and leaving reviews accordingly.\n\nEZZTECH`,
      },
      {
        consignment_number: '2313194575',
        customer_id: '4211d418-561a-4b86-94ab-4825c9f3a80d',
        business_name: 'Crytec Limited',
        primary_email: 'sales@crytec-power.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-nd', service_name: 'DPD Domestic Parcel Next Day',
        type: 'not_delivered', status: 'claim_raised', attention: true, daysAgo: 10,
        subject: `2313194575 — 10 days, no parcel, raising formal claim`,
        body: `This is my fourth email about consignment 2313194575.\n\nDPD's tracking has shown "delivered" for 10 days. The goods have not been delivered. I have told you this three times. Each time I've been told it's being investigated. Nothing has happened.\n\nI am done waiting. I am formally raising a compensation claim for the full value of the shipment (£340 + VAT). I will be attaching invoices.\n\nIf this is not acknowledged and a resolution offered within 48 hours I will be escalating to my bank for a chargeback, reporting to Trading Standards, and leaving detailed reviews on Google and Trustpilot.\n\nThis has been a disgraceful experience from start to finish.\n\nCrytec Limited`,
      },
      {
        consignment_number: '2313743878',
        customer_id: '450beb4c-7c4a-4a33-a3b4-675009b76579',
        business_name: 'Raycom Ltd',
        primary_email: 'andy@raycom.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-epak-nd', service_name: 'DPD Domestic Expresspak Next Day',
        type: 'other', status: 'claim_submitted', attention: false, daysAgo: 14,
        subject: `Formal claim — consignment 2313743878 — 14 days unresolved`,
        body: `Dear Moov Parcel,\n\nAs discussed in our previous correspondence, I am formally submitting a compensation claim in respect of consignment 2313743878, which has now been unresolved for 14 days.\n\nI attach:\n- Original invoice for goods (£567.00 + VAT)\n- Screenshots of all tracking activity\n- Correspondence log dating from first contact\n\nI expect a response within 5 working days. Should this not be forthcoming, I will instruct our solicitor to write to you formally.\n\nI have no interest in further explanations or apologies — I want the money back.\n\nAndy\nRaycom Ltd`,
      },
      {
        consignment_number: '2313279073',
        customer_id: '4699da0a-1dd3-4255-aaa8-670261687f04',
        business_name: 'Carnivore Cartel Ltd',
        primary_email: 'info@carnivorecartel.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-nd', service_name: 'DPD Domestic Parcel Next Day',
        type: 'damaged', status: 'awaiting_courier', attention: false, daysAgo: 2,
        subject: `2313279073 — arrived looking like it had been sat on. Meat ruined.`,
        body: `Hi Moov team,\n\nNot gonna lie, this one made me laugh but also cry a little bit.\n\nConsignment 2313279073 arrived this morning and the box looked like someone had used it as a seat. Completely crushed on one side. Inside, three of the vacuum-sealed packs of dry-aged beef had burst — blood everywhere, meat exposed to air.\n\nAs you can imagine for a perishable food business that's a total write-off. We can't sell contaminated or air-exposed meat, so the whole lot had to go in the bin. Roughly £180 worth.\n\nWe've taken photos of the box and the contents if that helps your claim with DPD. Happy to send them over. Any idea how long the process usually takes? We're a small business so £180 hits us harder than it might sound.\n\nThanks in advance\nCarnivore Cartel`,
      },
    ];

    const log = [];

    // Step 1: clear everything
    try {
      await query(`TRUNCATE queries CASCADE`);
      log.push({ step: 'truncate', ok: true });
    } catch (e) {
      // TRUNCATE failed — try row-by-row delete instead
      log.push({ step: 'truncate', ok: false, error: e.message });
      try {
        await query(`DELETE FROM query_emails`);
        await query(`DELETE FROM query_notifications`);
        await query(`DELETE FROM query_evidence`);
        await query(`DELETE FROM queries`);
        log.push({ step: 'manual_delete', ok: true });
      } catch (e2) {
        return res.status(500).json({ step: 'clear', error: e2.message, log });
      }
    }

    // Step 2: check what enum values are actually in the DB
    const [qtEnums, qsEnums, edEnums] = await Promise.all([
      query(`SELECT unnest(enum_range(NULL::query_type))::text AS v`),
      query(`SELECT unnest(enum_range(NULL::query_status))::text AS v`),
      query(`SELECT unnest(enum_range(NULL::email_direction))::text AS v`),
    ]);
    const validTypes     = new Set(qtEnums.rows.map(r => r.v));
    const validStatuses  = new Set(qsEnums.rows.map(r => r.v));
    const validDirs      = new Set(edEnums.rows.map(r => r.v));
    log.push({ step: 'enums', query_types: [...validTypes], query_statuses: [...validStatuses], email_directions: [...validDirs] });

    // Step 3: look up customer IDs live (don't rely on hardcoded UUIDs)
    const emailToCustomer = {};
    const emails = SEEDS.map(s => s.primary_email);
    const custRes = await query(
      `SELECT id, primary_email FROM customers WHERE primary_email = ANY($1::varchar[])`,
      [emails]
    );
    for (const r of custRes.rows) emailToCustomer[r.primary_email] = r.id;
    log.push({ step: 'lookup_customers', found: custRes.rows.length, emails: Object.keys(emailToCustomer) });

    const inserted = [];
    for (const s of SEEDS) {
      const createdAt = new Date(Date.now() - s.daysAgo * 86400000).toISOString();
      const consNum = s.consignment_number;
      // Use live customer ID, fall back to hardcoded if lookup missed it
      const customerId = emailToCustomer[s.primary_email] || s.customer_id;

      // Validate enum values before hitting the DB
      if (!validTypes.has(s.type)) {
        inserted.push({ consignment: consNum, error: `query_type '${s.type}' not in enum: [${[...validTypes].join(', ')}]` });
        continue;
      }
      if (!validStatuses.has(s.status)) {
        inserted.push({ consignment: consNum, error: `query_status '${s.status}' not in enum: [${[...validStatuses].join(', ')}]` });
        continue;
      }

      let qid;
      try {
        const qRes = await query(`
          INSERT INTO queries (
            consignment_number, customer_id, customer_name,
            courier_code, courier_name, service_code, service_name,
            trigger, query_type, status,
            subject, description,
            sender_email, sender_matched, requires_attention,
            created_at, updated_at
          ) VALUES (
            $1::varchar, $2::uuid, $3::varchar,
            $4::varchar, $5::varchar, $6::varchar, $7::varchar,
            'customer_email'::query_trigger, $8::query_type, $9::query_status,
            $10::varchar, $11::text,
            $12::varchar, true, $13::boolean,
            $14::timestamptz, $14::timestamptz
          )
          RETURNING id
        `, [consNum, customerId, s.business_name,
            s.courier_code, s.courier_name, s.service_code, s.service_name,
            s.type, s.status,
            s.subject, s.body,
            s.primary_email, s.attention, createdAt]);
        qid = qRes.rows[0]?.id;
      } catch (e) {
        inserted.push({ consignment: consNum, error: e.message });
        continue;
      }

      if (!qid) { inserted.push({ skipped: true, consignment: consNum }); continue; }

      await query(`
        INSERT INTO query_emails (
          query_id, direction, subject, body_text,
          from_address, to_address, is_ai_draft, received_at, created_at
        ) VALUES (
          $1::uuid, 'inbound_customer'::email_direction, $2::varchar, $3::text,
          $4::varchar, 'queries@moovparcel.co.uk', false, $5::timestamptz, $5::timestamptz
        )
      `, [qid, s.subject, s.body, s.primary_email, createdAt]);

      inserted.push({ id: qid, consignment: consNum, customer: s.business_name, status: s.status });
    }

    res.json({ seeded: inserted.filter(i => i.id).length, log, queries: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message, detail: err.detail || null });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/stats
// Dashboard statistics for the queries module
// ─────────────────────────────────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;

    const [overview, byStatus, byType, claimDeadlines, unmatched] = await Promise.all([

      // All key counts in one pass over the inbox view
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ${RESOLVED})                         AS total_open,
          COUNT(*) FILTER (WHERE requires_attention = true
                             AND status NOT IN ${RESOLVED})                          AS requires_attention,
          COUNT(*) FILTER (WHERE sla_breached = true)                              AS sla_breached,
          COALESCE(SUM(pending_drafts) FILTER (WHERE status NOT IN ${RESOLVED}), 0) AS pending_drafts,
          COUNT(*) FILTER (
            WHERE claim_deadline_at IS NOT NULL
              AND claim_deadline_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
              AND status NOT IN ${RESOLVED}
          )                                                                          AS claim_deadlines_7d,
          COUNT(*)                                                                   AS total_queries
        FROM queries_inbox_view
      `),

      // By status (open only)
      query(`
        SELECT status, COUNT(*)::int AS count
        FROM queries
        WHERE status NOT IN ${RESOLVED}
        GROUP BY status ORDER BY count DESC
      `),

      // By query type (open only)
      query(`
        SELECT query_type, COUNT(*)::int AS count
        FROM queries
        WHERE status NOT IN ${RESOLVED}
        GROUP BY query_type ORDER BY count DESC
      `),

      // Upcoming claim deadlines (next 14 days)
      query(`
        SELECT id, consignment_number, customer_name,
               claim_deadline_at,
               CEIL(EXTRACT(EPOCH FROM (claim_deadline_at - NOW())) / 86400)::int AS days_remaining
        FROM queries
        WHERE claim_deadline_at IS NOT NULL
          AND claim_deadline_at > NOW()
          AND claim_deadline_at < NOW() + INTERVAL '14 days'
          AND status NOT IN ${RESOLVED}
        ORDER BY claim_deadline_at ASC
        LIMIT 10
      `),

      // Unmatched emails
      query(`SELECT COUNT(*)::int AS count FROM unmatched_emails WHERE resolved = false`),
    ]);

    const o = overview.rows[0];
    res.json({
      total_open:               parseInt(o.total_open)            || 0,
      requires_attention:       parseInt(o.requires_attention)    || 0,
      sla_breached:             parseInt(o.sla_breached)          || 0,
      pending_drafts:           parseInt(o.pending_drafts)        || 0,
      claim_deadlines_7d:       parseInt(o.claim_deadlines_7d)    || 0,
      autopilot_sent:           0,                                        // future
      total_queries:            parseInt(o.total_queries)         || 0,
      unmatched_emails:         parseInt(unmatched.rows[0].count) || 0,
      upcoming_claim_deadlines: claimDeadlines.rows,
      by_status:                byStatus.rows,
      by_type:                  byType.rows,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/unmatched
// Emails that couldn't be matched to a customer — for the mapping tool
// ─────────────────────────────────────────────────────────────────────────────

router.get('/unmatched', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT * FROM unmatched_emails
        WHERE resolved = false
        ORDER BY received_at DESC
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), parseInt(offset)]),
      query(`SELECT COUNT(*)::int AS total FROM unmatched_emails WHERE resolved = false`),
    ]);
    res.json({ emails: dataRes.rows, total: countRes.rows[0].total });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/sender-suggestions
// Suggest customer matches for an unknown email address
// IMPORTANT: must be defined BEFORE /:id to avoid being swallowed by the param route
// ─────────────────────────────────────────────────────────────────────────────

router.get('/sender-suggestions', async (req, res, next) => {
  try {
    const { email, domain } = req.query;
    if (!email && !domain) return res.status(400).json({ error: 'email or domain required' });

    const emailDomain = domain || email?.split('@')[1];

    const result = await query(`
      SELECT c.id, c.business_name, c.account_number, c.primary_email,
             CASE
               WHEN c.primary_email = $1 THEN 3
               WHEN c.primary_email ILIKE '%' || $2 || '%' THEN 2
               WHEN EXISTS (
                 SELECT 1 FROM customer_contacts cc
                 WHERE cc.customer_id = c.id AND cc.email ILIKE '%' || $2 || '%'
               ) THEN 1
               ELSE 0
             END AS match_score
      FROM customers c
      WHERE c.account_status = 'active'
        AND (
          c.primary_email = $1
          OR c.primary_email ILIKE '%' || $2 || '%'
          OR EXISTS (
            SELECT 1 FROM customer_contacts cc
            WHERE cc.customer_id = c.id AND cc.email ILIKE '%' || $2 || '%'
          )
        )
      ORDER BY match_score DESC, c.business_name ASC
      LIMIT 10
    `, [email || '', emailDomain || '']);

    res.json({ suggestions: result.rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/:id
// Single query with full email thread, evidence, and notifications
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const [queryRes, emailsRes, evidenceRes, notificationsRes] = await Promise.all([
      query(`SELECT * FROM queries_inbox_view WHERE id = $1`, [req.params.id]),
      query(`
        SELECT id, direction, subject, body_text, body_html,
               from_address, to_address, cc_address,
               is_ai_draft, ai_draft_approved_by, ai_draft_approved_at, ai_draft_edited,
               sent_at, received_at, created_at
        FROM query_emails
        WHERE query_id = $1
        ORDER BY created_at ASC
      `, [req.params.id]),
      query(`
        SELECT id, evidence_type, value_text, value_numeric, value_unit,
               file_name, file_format, file_url, provided_by_name, provided_by_email,
               is_courier_approved, created_at
        FROM query_evidence
        WHERE query_id = $1
        ORDER BY created_at ASC
      `, [req.params.id]),
      query(`
        SELECT id, notification_type, message, read_at, created_at
        FROM query_notifications
        WHERE query_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `, [req.params.id]),
    ]);

    if (!queryRes.rows.length) return res.status(404).json({ error: 'Query not found' });

    res.json({
      ...queryRes.rows[0],
      emails:        emailsRes.rows,
      evidence:      evidenceRes.rows,
      notifications: notificationsRes.rows,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries
// Create a query (manual or automated trigger)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const {
      parcel_id, consignment_number, customer_id, customer_name,
      courier_code, courier_name, service_code, service_name,
      trigger, query_type, subject, description,
      sender_email, freshdesk_ticket_id, freshdesk_ticket_number,
      created_by,
    } = req.body;

    // Look up courier contact config for email addresses
    const courierConfig = await query(
      `SELECT query_email, claims_email FROM courier_query_config WHERE courier_code = $1`,
      [courier_code]
    );
    const courierEmail = courierConfig.rows[0]?.query_email || null;

    // Look up SLA
    const slaRes = await query(
      `SELECT sla_hours FROM service_slas WHERE service_code = $1 AND courier_code = $2`,
      [service_code, courier_code]
    );
    const slaHours = slaRes.rows[0]?.sla_hours || null;

    const result = await query(`
      INSERT INTO queries (
        parcel_id, consignment_number, customer_id, customer_name,
        courier_code, courier_name, service_code, service_name,
        trigger, query_type, subject, description,
        courier_email, sla_hours,
        sender_email, sender_matched,
        freshdesk_ticket_id, freshdesk_ticket_number,
        created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *
    `, [
      parcel_id, consignment_number, customer_id, customer_name,
      courier_code, courier_name, service_code, service_name,
      trigger, query_type || 'other', subject, description,
      courierEmail, slaHours,
      sender_email, !!customer_id,
      freshdesk_ticket_id, freshdesk_ticket_number,
      created_by || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/queries/:id
// Update query — status change, assign, resolve, flag for attention
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = [
      'status', 'query_type', 'subject', 'assigned_to',
      'requires_attention', 'attention_reason',
      'courier_reference', 'claim_number', 'claim_deadline_at',
      'claim_amount', 'approved_amount', 'resolution_notes',
      'autopilot_enabled', 'freshdesk_ticket_number',
    ];

    const updates = [];
    const values  = [];
    let   idx     = 1;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = $${idx++}`);
        values.push(req.body[key]);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    // Auto-set resolved_at when status flips to resolved
    if (req.body.status && ['resolved','resolved_claim_approved','resolved_claim_rejected'].includes(req.body.status)) {
      updates.push(`resolved_at = NOW()`);
      if (req.body.resolved_by) {
        updates.push(`resolved_by = $${idx++}`);
        values.push(req.body.resolved_by);
      }
    }

    // Auto-clear attention flag if manually resolved
    if (req.body.requires_attention === false) {
      updates.push(`attention_raised_at = NULL`);
    }
    if (req.body.requires_attention === true) {
      updates.push(`attention_raised_at = NOW()`);
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await query(
      `UPDATE queries SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Query not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/:id/emails
// Approve an AI draft and mark as sent, OR log an inbound/manual email
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/emails', async (req, res, next) => {
  try {
    const {
      direction, subject, body_text, body_html,
      from_address, to_address, cc_address,
      is_ai_draft = false,
      approved_by,       // staff UUID — set when approving a draft
      edited = false,
      gmail_message_id, gmail_thread_id, in_reply_to,
      received_at,
    } = req.body;

    const sent_at = direction?.startsWith('outbound') ? new Date().toISOString() : null;

    const result = await query(`
      INSERT INTO query_emails (
        query_id, direction, subject, body_text, body_html,
        from_address, to_address, cc_address,
        is_ai_draft, ai_draft_approved_by, ai_draft_approved_at, ai_draft_edited,
        sent_at, received_at,
        gmail_message_id, gmail_thread_id, in_reply_to
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `, [
      req.params.id, direction, subject, body_text, body_html,
      from_address, to_address, cc_address,
      is_ai_draft,
      approved_by || null,
      approved_by ? new Date().toISOString() : null,
      edited,
      sent_at, received_at || null,
      gmail_message_id || null, gmail_thread_id || null, in_reply_to || null,
    ]);

    // Record first response time if this is the first outbound email
    if (sent_at) {
      await query(`
        UPDATE queries
        SET
          first_response_at = COALESCE(first_response_at, NOW()),
          first_response_mins = COALESCE(first_response_mins,
            CEIL(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::int
          ),
          updated_at = NOW()
        WHERE id = $1
      `, [req.params.id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/:id/generate-draft
// Generate an AI draft reply — either to the customer or to the courier
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/generate-draft', async (req, res, next) => {
  try {
    const { target } = req.body; // 'customer' | 'courier'
    if (!['customer', 'courier'].includes(target)) {
      return res.status(400).json({ error: "target must be 'customer' or 'courier'" });
    }

    const [queryRes, emailsRes] = await Promise.all([
      query(`SELECT * FROM queries_inbox_view WHERE id = $1`, [req.params.id]),
      query(`SELECT direction, subject, body_text, from_address, to_address, created_at
             FROM query_emails WHERE query_id = $1 ORDER BY created_at ASC`, [req.params.id]),
    ]);

    if (!queryRes.rows.length) return res.status(404).json({ error: 'Query not found' });
    const q = queryRes.rows[0];
    const emails = emailsRes.rows;

    const emailThread = emails
      .map(e => `[${e.direction.replace(/_/g, ' ')}]\nFrom: ${e.from_address}\nSubject: ${e.subject}\n\n${e.body_text}`)
      .join('\n\n---\n\n');

    const isCustomer = target === 'customer';

    const systemPrompt = isCustomer
      ? `You are a customer service agent for Moov Parcel, a UK parcel reseller using couriers like DPD and DHL. Write professional, empathetic emails in British English. Be solution-focused. Sign off as "Moov Parcel Support Team". Do not use American spellings.`
      : `You are a customer service agent writing to a courier company on behalf of Moov Parcel, a UK parcel reseller. Write professional, firm but polite emails in British English requesting investigation or action. Be concise and specific.`;

    const queryTypeLabel = q.query_type?.replace(/_/g, ' ') || 'query';
    const statusLabel    = q.status?.replace(/_/g, ' ') || '';

    const userPrompt = isCustomer
      ? `Write a customer acknowledgement email for this ${queryTypeLabel} query.

Customer: ${q.customer_name}
Consignment: ${q.consignment_number}
Courier: ${q.courier_name}
Current status: ${statusLabel}

Email thread:
${emailThread}

Instructions:
- Acknowledge receipt of their message warmly
- Confirm you are investigating with ${q.courier_name}
- Give a realistic timeframe (1-2 working days unless urgent)
- Do not make promises you cannot keep
- Keep it concise — under 200 words
- Then on a new line, output ONLY this JSON (no markdown, no code block): {"phone_call_recommended":true/false,"urgency_reason":"brief reason or null"}`
      : `Write an email to ${q.courier_name} to chase/raise this ${queryTypeLabel} issue.

Consignment: ${q.consignment_number}
Our customer: ${q.customer_name}
Issue type: ${queryTypeLabel}
Current status: ${statusLabel}

Customer's email thread:
${emailThread}

Instructions:
- State the consignment number prominently
- Explain the issue clearly and professionally
- Request specific action (investigation / GPS proof / redelivery etc)
- Ask for a response within 24 hours
- Keep it under 200 words
- Then on a new line, output ONLY this JSON (no markdown, no code block): {"phone_call_recommended":true/false,"urgency_reason":"brief reason or null"}`;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const aiJson    = await aiResp.json();
    const fullText  = aiJson.content?.[0]?.text || '';

    // Split draft text from trailing JSON block
    let draftText = fullText.trim();
    let phoneCallRecommended = false;
    let urgencyReason = null;

    const jsonMatch = draftText.match(/\{"phone_call_recommended"\s*:\s*(true|false)[^}]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        phoneCallRecommended = parsed.phone_call_recommended === true;
        urgencyReason = parsed.urgency_reason || null;
        draftText = draftText.slice(0, draftText.lastIndexOf(jsonMatch[0])).trim();
      } catch { /* ignore parse errors */ }
    }

    // Save as AI draft in query_emails
    const direction  = isCustomer ? 'outbound_customer' : 'outbound_courier';
    const subject    = isCustomer ? `Re: ${q.subject}` : `Query — Consignment ${q.consignment_number} [${q.courier_name}]`;
    const toAddress  = isCustomer ? (q.sender_email || null) : null;

    const savedEmail = await query(`
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, created_at)
      VALUES ($1, $2::email_direction, $3::varchar, $4::text, 'queries@moovparcel.co.uk'::varchar, $5, true, NOW())
      RETURNING id
    `, [req.params.id, direction, subject, draftText, toAddress]);

    // If phone call recommended: raise attention and save notification
    if (phoneCallRecommended) {
      const msg = `📞 PHONE CALL RECOMMENDED${urgencyReason ? ': ' + urgencyReason : ''}`;
      await query(`
        UPDATE queries SET requires_attention = true, attention_reason = $1,
          attention_raised_at = NOW(), updated_at = NOW() WHERE id = $2
      `, [msg, req.params.id]);
      await query(`
        INSERT INTO query_notifications (query_id, notification_type, message)
        VALUES ($1, 'attention_required'::notification_type, $2)
      `, [req.params.id, msg]);
    }

    res.json({
      draft_id:              savedEmail.rows[0]?.id,
      draft_text:            draftText,
      subject,
      phone_call_recommended: phoneCallRecommended,
      urgency_reason:         urgencyReason,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/:id/attention
// Flag a query for human attention (called by AI or automation)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/attention', async (req, res, next) => {
  try {
    const { reason, notification_type = 'attention_required' } = req.body;

    await query(`
      UPDATE queries
      SET requires_attention = true,
          attention_reason   = $1,
          attention_raised_at = NOW(),
          updated_at         = NOW()
      WHERE id = $2
    `, [reason, req.params.id]);

    // Log notification
    await query(`
      INSERT INTO query_notifications (query_id, notification_type, message)
      VALUES ($1, $2::notification_type, $3)
    `, [req.params.id, notification_type, reason]);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/map-sender
// Map an unknown email sender to a customer record
// ─────────────────────────────────────────────────────────────────────────────

router.post('/map-sender', async (req, res, next) => {
  try {
    const { email_address, customer_id, matched_by, notes, unmatched_email_id } = req.body;

    if (!email_address || !customer_id) {
      return res.status(400).json({ error: 'email_address and customer_id are required' });
    }

    const domain = email_address.split('@')[1] || null;

    // Save the mapping
    await query(`
      INSERT INTO email_sender_mappings
        (email_address, email_domain, customer_id, match_type, matched_by, is_verified, notes)
      VALUES ($1, $2, $3, 'manual', $4, true, $5)
      ON CONFLICT (email_address, customer_id) DO UPDATE SET
        is_verified = true,
        matched_by  = EXCLUDED.matched_by,
        matched_at  = NOW(),
        notes       = COALESCE(EXCLUDED.notes, email_sender_mappings.notes)
    `, [email_address, domain, customer_id, matched_by || null, notes || null]);

    // If this resolves an unmatched email, mark it done
    if (unmatched_email_id) {
      await query(`
        UPDATE unmatched_emails
        SET resolved = true, resolved_at = NOW(), resolved_by = $1
        WHERE id = $2
      `, [matched_by || null, unmatched_email_id]);
    }

    // Update any open queries from this sender that have no customer
    await query(`
      UPDATE queries
      SET customer_id = $1, sender_matched = true, updated_at = NOW()
      WHERE sender_email = $2 AND (customer_id IS NULL OR sender_matched = false)
    `, [customer_id, email_address]);

    res.json({ ok: true, domain });
  } catch (err) { next(err); }
});

export default router;
