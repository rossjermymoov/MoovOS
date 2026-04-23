/**
 * Moov OS — Tracking API
 *
 * POST /api/tracking/webhook          — ingest a tracking event
 * GET  /api/tracking                  — paginated parcel list with filters
 * GET  /api/tracking/stats            — summary counts by status
 * GET  /api/tracking/:consignment     — single parcel + full event timeline
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── Statuses that confirm physical movement (trigger charge verification) ────
// "above collected" — parcel has been scanned in transit or beyond

const VERIFIED_STATUSES = new Set([
  'in_transit', 'at_depot', 'out_for_delivery',
  'delivered', 'failed_delivery', 'on_hold',
  'awaiting_collection', 'customs_hold', 'exception', 'returned',
]);

// ─── Status normalisation ─────────────────────────────────────────────────────
// Maps any courier-specific status string → our canonical parcel_status enum

const STATUS_MAP = {
  // ── DPD numeric status codes (authoritative — map these first) ────────────
  '1':  'booked',              // Booked
  '2':  'collected',           // Collected
  '3':  'at_depot',            // At Hub
  '4':  'in_transit',          // In Transit
  '5':  'out_for_delivery',    // Out for Delivery
  '6':  'failed_delivery',     // Failed Attempt
  '7':  'delivered',           // Delivered
  '8':  'on_hold',             // On Hold
  '9':  'exception',           // Address Issue
  '10': 'returned',            // Return to Sender
  '11': 'tracking_expired',    // Tracking Expired
  '12': 'cancelled',           // Cancelled
  '13': 'awaiting_collection', // Awaiting Customer Collection
  '16': 'damaged',             // Damaged
  '18': 'customs_hold',        // Customs Hold

  // ── Booked / label created ────────────────────────────────────────────────
  booked: 'booked', created: 'booked', label_created: 'booked',
  label_printed: 'booked', manifested: 'booked', registered: 'booked',

  // ── Collected ─────────────────────────────────────────────────────────────
  collected: 'collected', collection: 'collected', picked_up: 'collected',
  collection_made: 'collected', collected_from_sender: 'collected',

  // ── In transit ────────────────────────────────────────────────────────────
  in_transit: 'in_transit', transit: 'in_transit', on_its_way: 'in_transit',
  forwarded: 'in_transit', processed: 'in_transit', departed_depot: 'in_transit',
  despatched: 'in_transit', dispatched: 'in_transit',
  left_hub: 'in_transit', parcel_left_hub: 'in_transit', departed_hub: 'in_transit',
  left_depot: 'in_transit', departed_facility: 'in_transit', left_facility: 'in_transit',

  // ── At depot ──────────────────────────────────────────────────────────────
  at_hub: 'at_depot', hub: 'at_depot', in_depot: 'at_depot',
  arrived_at_depot: 'at_depot', at_depot: 'at_depot',
  sorting: 'at_depot', sorted: 'at_depot', at_facility: 'at_depot',
  arrived_at_hub: 'at_depot', held_at_hub: 'at_depot',
  parcel_at_hub: 'at_depot', received_at_hub: 'at_depot',

  // ── Out for delivery ──────────────────────────────────────────────────────
  out_for_delivery: 'out_for_delivery', out_for_del: 'out_for_delivery',
  on_vehicle: 'out_for_delivery', with_driver: 'out_for_delivery',
  loaded_on_van: 'out_for_delivery', with_courier: 'out_for_delivery',
  on_delivery_run: 'out_for_delivery',

  // ── Delivered ─────────────────────────────────────────────────────────────
  delivered: 'delivered', delivery_complete: 'delivered',
  signed_for: 'delivered', parcel_delivered: 'delivered',
  delivered_to_neighbour: 'delivered', delivered_to_safe_place: 'delivered',

  // ── Failed delivery ───────────────────────────────────────────────────────
  failed_delivery: 'failed_delivery', delivery_failed: 'failed_delivery',
  missed: 'failed_delivery', attempted: 'failed_delivery',
  not_home: 'failed_delivery', carded: 'failed_delivery',
  delivery_attempted: 'failed_delivery', unable_to_deliver: 'failed_delivery',

  // ── On hold ───────────────────────────────────────────────────────────────
  on_hold: 'on_hold', held: 'on_hold', hold: 'on_hold',
  awaiting_instructions: 'on_hold', dispatch_guide: 'on_hold',
  in_dispatch_guide: 'on_hold',

  // ── Awaiting collection ───────────────────────────────────────────────────
  awaiting_collection: 'awaiting_collection',
  collection_point: 'awaiting_collection',
  ready_for_collection: 'awaiting_collection',
  available_for_collection: 'awaiting_collection',
  at_collection_point: 'awaiting_collection',
  held_at_parcelshop: 'awaiting_collection',
  parcel_shop: 'awaiting_collection',
  at_parcelshop: 'awaiting_collection',
  held_for_collection: 'awaiting_collection',
  collect_from_depot: 'awaiting_collection',

  // ── Customs hold ──────────────────────────────────────────────────────────
  customs_hold: 'customs_hold', customs: 'customs_hold',
  customs_clearance: 'customs_hold', held_at_customs: 'customs_hold',
  customs_delay: 'customs_hold', import_customs: 'customs_hold',

  // ── Exception ─────────────────────────────────────────────────────────────
  exception: 'exception', damaged: 'exception', lost: 'exception',
  missing: 'exception', problem: 'exception', delay: 'exception',
  address_query: 'exception', address_issue: 'exception', undeliverable: 'exception',
  tracking_expired: 'exception', cancelled: 'exception',

  // ── Returned ──────────────────────────────────────────────────────────────
  returned: 'returned', return: 'returned', rts: 'returned',
  return_to_sender: 'returned', returning: 'returned',
};

function normaliseStatus(raw) {
  if (!raw) return 'unknown';
  // Numeric DPD codes arrive as integers or strings — try exact match first
  const exact = STATUS_MAP[String(raw)];
  if (exact) return exact;
  // Normalise text-based status strings
  const key = String(raw).toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z_]/g, '');
  return STATUS_MAP[key] || 'unknown';
}

// ─── Flexible payload field extraction ───────────────────────────────────────
// Tries multiple field name variants so we can accept any courier format.

function pick(obj, ...keys) {
  for (const k of keys) {
    const val = k.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj);
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return null;
}

// ─── Normalise a raw payload into a flat array of processable events ──────────
// Supports:
//   A) Shipment-platform format: { json: { tracking_update: { parcels: [...] }, shipment: {...} } }
//   B) Simple flat object or array of flat objects

export function normalisePayload(body) {
  // Unwrap platform wrapper — some services POST { json: {...}, verify: false, ... }
  const payload = (body.json && typeof body.json === 'object') ? body.json : body;

  // Format A: nested tracking_update.parcels
  if (payload.tracking_update && Array.isArray(payload.tracking_update.parcels)) {
    const tu       = payload.tracking_update;
    const shipment = payload.shipment || {};
    const events   = [];

    for (const parcel of tu.parcels) {
      const consignment = parcel.tracking_code || parcel.trackingCode;
      if (!consignment) continue;

      const trackingEvents = parcel.tracking_events || parcel.trackingEvents || [{}];

      // Sort events oldest→newest so the last upsert reflects the latest status
      const sorted = [...trackingEvents].sort((a, b) => {
        const ta = new Date(a.update_date || a.timestamp || 0).getTime();
        const tb = new Date(b.update_date || b.timestamp || 0).getTime();
        return ta - tb;
      });

      for (const ev of sorted) {
        events.push({
          _consignment:        consignment,
          _courier_name:       shipment.courier || null,
          _courier_code:       shipment.courier ? shipment.courier.toLowerCase() : null,
          _service_name:       shipment.friendly_service_name || null,
          _customer_name:      shipment.account_name || null,
          _customer_account:   shipment.account_number || null,
          _recipient_name:     shipment.ship_to_name || shipment.ship_to_company_name || null,
          _recipient_postcode: shipment.ship_to_postcode || tu.address_information?.postcode || null,
          _recipient_address:  shipment.ship_to_address || null,
          _weight_kg:          parcel.weight || null,
          _estimated_delivery: tu.expected_delivery || shipment.tracking_expected_delivery_date || null,
          _raw:                ev,
          // Dispatch Cloud sends the numeric code in status_code (1-18)
          // and the verbatim courier description in status / status_description.
          // Use status_code for normalisation; fall back to status text if absent.
          status:              ev.status_code != null ? String(ev.status_code) : (ev.status || null),
          status_description:  ev.status_description || ev.status || null,
          location:            null,
          timestamp:           ev.update_date || null,
          event_code:          ev.update_id != null ? String(ev.update_id) : null,
        });
      }
    }
    return events;
  }

  // Format B: simple flat event(s)
  return Array.isArray(payload) ? payload : [payload];
}

// ─── Shared upsert logic ─────────────────────────────────────────────────────

export async function upsertEvent(event, rawBody) {
  const consignment = event._consignment || pick(event,
    'consignment_number', 'consignmentNumber', 'tracking_number', 'trackingNumber',
    'tracking_code', 'trackingCode', 'reference', 'barcode', 'parcel_id', 'shipment_id', 'id'
  );
  if (!consignment) return { skipped: true, reason: 'no consignment number' };

  const rawStatus   = event.status || pick(event, 'event_type', 'event_code', 'eventType', 'state', 'type');
  const status      = normaliseStatus(rawStatus);
  const description = event.status_description || pick(event,
    'description', 'event_description', 'message', 'detail', 'text', 'statusDescription');
  const location    = event.location || pick(event, 'depot', 'hub', 'facility', 'scan_location', 'scanLocation');
  const eventAt     = event.timestamp || pick(event,
    'event_time', 'eventTime', 'datetime', 'date_time', 'scanned_at', 'created_at') || new Date().toISOString();
  const eventCode   = event.event_code || pick(event, 'eventCode', 'code', 'status_code', 'update_id');

  const courierName    = event._courier_name    || pick(event, 'courier_name', 'courierName', 'courier', 'carrier', 'carrier_name');
  const courierCode    = event._courier_code    || pick(event, 'courier_code', 'courierCode', 'carrier_code', 'carrierCode');
  const serviceName    = event._service_name    || pick(event, 'service', 'service_name', 'serviceName', 'product', 'service_type');
  const customerName   = event._customer_name   || pick(event, 'customer.name', 'customer_name', 'customerName', 'sender', 'sender_name', 'account_name');
  const customerAccount= event._customer_account|| pick(event, 'customer.account_number', 'account_number', 'accountNumber', 'moov_account', 'moovAccount');
  const recipientName  = event._recipient_name  || pick(event, 'recipient.name', 'recipient_name', 'recipientName', 'consignee', 'delivery_name');
  const recipientPost  = event._recipient_postcode || pick(event, 'recipient.postcode', 'postcode', 'delivery_postcode', 'recipientPostcode', 'zip');
  const recipientAddr  = event._recipient_address  || pick(event, 'recipient.address', 'address', 'delivery_address', 'recipientAddress');
  const weightKg       = event._weight_kg       || pick(event, 'weight_kg', 'weightKg', 'weight', 'gross_weight');
  const estDelivery    = event._estimated_delivery || pick(event, 'estimated_delivery', 'estimatedDelivery', 'eta', 'due_date');

  // Resolve customer_id from account number
  let customerId = null;
  if (customerAccount) {
    const cr = await query('SELECT id FROM customers WHERE account_number = $1', [customerAccount]);
    if (cr.rows.length) customerId = cr.rows[0].id;
  }

  // Upsert the parcel
  const parcelRes = await query(`
    INSERT INTO parcels
      (consignment_number, courier_name, courier_code, service_name,
       customer_id, customer_name, customer_account,
       recipient_name, recipient_postcode, recipient_address,
       weight_kg, estimated_delivery,
       status, status_description, last_location, last_event_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    ON CONFLICT (consignment_number) DO UPDATE SET
      courier_name       = COALESCE(EXCLUDED.courier_name,       parcels.courier_name),
      courier_code       = COALESCE(EXCLUDED.courier_code,       parcels.courier_code),
      service_name       = COALESCE(EXCLUDED.service_name,       parcels.service_name),
      customer_id        = COALESCE(EXCLUDED.customer_id,        parcels.customer_id),
      customer_name      = COALESCE(EXCLUDED.customer_name,      parcels.customer_name),
      customer_account   = COALESCE(EXCLUDED.customer_account,   parcels.customer_account),
      recipient_name     = COALESCE(EXCLUDED.recipient_name,     parcels.recipient_name),
      recipient_postcode = COALESCE(EXCLUDED.recipient_postcode, parcels.recipient_postcode),
      recipient_address  = COALESCE(EXCLUDED.recipient_address,  parcels.recipient_address),
      weight_kg          = COALESCE(EXCLUDED.weight_kg,          parcels.weight_kg),
      estimated_delivery = COALESCE(EXCLUDED.estimated_delivery, parcels.estimated_delivery),
      -- Only advance status/location if this event is newer than what we already have.
      -- delivered is terminal — once a parcel is delivered it cannot regress to any
      -- other status regardless of subsequent events (DC sometimes sends a stale
      -- out_for_delivery scan after the delivered scan for multi-parcel shipments).
      status             = CASE
                             WHEN parcels.status = 'delivered'   THEN parcels.status
                             WHEN EXCLUDED.last_event_at IS NULL THEN parcels.status
                             WHEN parcels.last_event_at IS NULL  THEN EXCLUDED.status
                             WHEN EXCLUDED.last_event_at >= parcels.last_event_at THEN EXCLUDED.status
                             ELSE parcels.status
                           END,
      status_description = CASE
                             WHEN parcels.status = 'delivered'   THEN parcels.status_description
                             WHEN EXCLUDED.last_event_at IS NULL THEN parcels.status_description
                             WHEN parcels.last_event_at IS NULL  THEN EXCLUDED.status_description
                             WHEN EXCLUDED.last_event_at >= parcels.last_event_at THEN EXCLUDED.status_description
                             ELSE parcels.status_description
                           END,
      last_location      = CASE
                             WHEN EXCLUDED.last_event_at IS NULL THEN parcels.last_location
                             WHEN parcels.last_event_at IS NULL  THEN EXCLUDED.last_location
                             WHEN EXCLUDED.last_event_at >= parcels.last_event_at THEN EXCLUDED.last_location
                             ELSE parcels.last_location
                           END,
      last_event_at      = GREATEST(EXCLUDED.last_event_at, parcels.last_event_at),
      delivered_at       = CASE WHEN EXCLUDED.status = 'delivered' AND EXCLUDED.last_event_at >= COALESCE(parcels.last_event_at, '-infinity') THEN EXCLUDED.last_event_at ELSE parcels.delivered_at END,
      updated_at         = NOW()
    RETURNING id
  `, [
    consignment, courierName, courierCode, serviceName,
    customerId, customerName, customerAccount,
    recipientName, recipientPost, recipientAddr,
    weightKg ? parseFloat(weightKg) : null,
    estDelivery || null,
    status, description, location, eventAt,
  ]);

  const parcelId = parcelRes.rows[0].id;

  // Deduplicate: skip event if the last recorded status for this parcel is the same.
  // This prevents flooding the timeline with repeated scans at the same stage
  // (e.g. five "collected" pings seconds apart from the same courier hub).
  const lastEvt = await query(
    `SELECT status FROM tracking_events
     WHERE parcel_id = $1
     ORDER BY event_at DESC, id DESC
     LIMIT 1`,
    [parcelId]
  );
  const lastStatus = lastEvt.rows[0]?.status;

  if (lastStatus && lastStatus === status) {
    return { ok: true, consignment, status, parcel_id: parcelId, deduped: true };
  }

  await query(`
    INSERT INTO tracking_events
      (parcel_id, consignment_number, event_code, status, description, location, event_at, raw_payload)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT DO NOTHING
  `, [parcelId, consignment, eventCode, status, description, location, eventAt,
      JSON.stringify(event._raw || event)]);

  // Auto-verify: if this event confirms physical movement, mark the linked charge verified.
  // The 400-day window is a belt-and-braces guard against tracking number recycling —
  // couriers recycle numbers every 6–12 months, so a tracking event more than 400 days
  // after a shipment's collection date almost certainly refers to a different parcel.
  if (VERIFIED_STATUSES.has(status)) {
    await query(`
      UPDATE charges
      SET verified = true, updated_at = NOW()
      WHERE verified = false
        AND cancelled = false
        AND shipment_id IN (
          SELECT id FROM shipments
          WHERE $1 = ANY(tracking_codes)
            AND (
              collection_date IS NULL
              OR collection_date >= CURRENT_DATE - INTERVAL '400 days'
            )
        )
    `, [consignment]);
  }

  return { ok: true, consignment, status, parcel_id: parcelId };
}

// ─── Catch-up: verify charges that already have qualifying tracking events ────
// Called at server startup to retroactively verify any charges missed before
// this logic was deployed.

export async function catchUpVerified() {
  try {
    const result = await query(`
      UPDATE charges c
      SET verified = true, updated_at = NOW()
      FROM shipments s
      WHERE c.shipment_id = s.id
        AND c.verified    = false
        AND c.cancelled   = false
        AND s.tracking_codes IS NOT NULL
        AND (
          s.collection_date IS NULL
          OR s.collection_date >= CURRENT_DATE - INTERVAL '400 days'
        )
        AND EXISTS (
          SELECT 1
          FROM parcels p
          JOIN tracking_events te ON te.parcel_id = p.id
          WHERE p.consignment_number = ANY(s.tracking_codes)
            AND te.status = ANY(ARRAY[
              'in_transit','at_depot','out_for_delivery',
              'delivered','failed_delivery','on_hold',
              'awaiting_collection','customs_hold','exception','returned'
            ]::parcel_status[])
        )
    `);
    if (result.rowCount > 0) {
      console.log(`✓ Catch-up: verified ${result.rowCount} existing charge(s)`);
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.warn('⚠ catchUpVerified failed (non-fatal):', err.message);
  }
}

// ─── POST /api/tracking/fix-stale ────────────────────────────────────────────
// Manual trigger: fixes parcels stuck as out_for_delivery.
//
// Step 1 — overwrite fix: finds parcels that have a delivered event in
//   tracking_events but a non-delivered status on the parcels row (caused by DC
//   sending a stale OFD scan after the delivered scan). Resets them to delivered.
//
// Step 2 — DC API pull: for remaining stuck OFD parcels with no delivered event,
//   calls the DC get-tracking API (requires DC_API_USER + DC_API_TOKEN env vars)
//   and processes the response as if it were a fresh webhook.

router.post('/fix-stale', async (req, res, next) => {
  try {
    const results = { overwrite_fixed: 0, dc_refreshed: 0, dc_errors: [], genuinely_stuck: 0 };

    // ── Step 1: overwrite fix ─────────────────────────────────────────────────
    const overwriteRes = await query(`
      UPDATE parcels p
      SET
        status             = 'delivered',
        status_description = d.description,
        last_event_at      = d.event_at,
        delivered_at       = COALESCE(p.delivered_at, d.event_at),
        updated_at         = NOW()
      FROM (
        SELECT DISTINCT ON (parcel_id)
          parcel_id, description, event_at
        FROM tracking_events
        WHERE status = 'delivered'
        ORDER BY parcel_id, event_at DESC
      ) d
      WHERE p.id = d.parcel_id
        AND p.status != 'delivered'
      RETURNING p.id
    `);
    results.overwrite_fixed = overwriteRes.rowCount;

    // ── Step 2: DC API pull for parcels with no delivered event at all ─────────
    const { rows: stuck } = await query(`
      SELECT DISTINCT ON (p.id)
        p.id, p.consignment_number, p.last_event_at,
        s.platform_shipment_id,
        (s.raw_payload->'shipment'->>'request_log_id')::bigint AS dc_request_log_id
      FROM parcels p
      LEFT JOIN shipments s ON s.tracking_codes @> ARRAY[p.consignment_number]::text[]
      WHERE p.status = 'out_for_delivery'
        AND p.last_event_at < NOW() - INTERVAL '6 hours'
        AND NOT EXISTS (
          SELECT 1 FROM tracking_events te
          WHERE te.parcel_id = p.id AND te.status = 'delivered'
        )
      ORDER BY p.id, s.updated_at DESC NULLS LAST
    `);

    const DC_USER  = process.env.DC_API_USER;
    const DC_TOKEN = process.env.DC_API_TOKEN;

    for (const parcel of stuck) {
      if (!DC_USER || !DC_TOKEN) { results.genuinely_stuck++; continue; }
      if (!parcel.dc_request_log_id) { results.genuinely_stuck++; continue; }

      try {
        const dcRes = await fetch('https://app.heyvoila.io/api/couriers/v1/get-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-user': DC_USER,
            'api-token': DC_TOKEN,
          },
          body: JSON.stringify({
            tracking_request_id:   parcel.dc_request_log_id,
            tracking_request_hash: parcel.platform_shipment_id,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (!dcRes.ok) {
          results.dc_errors.push({ consignment: parcel.consignment_number, status: dcRes.status });
          continue;
        }

        const dcData = await dcRes.json();
        const body   = dcData?.json ? dcData : { json: dcData };
        const events = normalisePayload(body);

        if (events.length) {
          for (const ev of events) await upsertEvent(ev, body);
          results.dc_refreshed++;
        } else {
          results.genuinely_stuck++;
        }
      } catch (err) {
        results.dc_errors.push({ consignment: parcel.consignment_number, error: err.message });
      }

      // Polite rate-limit — don't hammer the DC API
      await new Promise(r => setTimeout(r, 150));
    }

    res.json({ ok: true, stuck_found: stuck.length, ...results });
  } catch (err) { next(err); }
});

// ─── POST /api/tracking/webhook ──────────────────────────────────────────────

router.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Empty payload' });

    const events  = normalisePayload(body);
    const results = [];

    for (const event of events) {
      results.push(await upsertEvent(event, body));
    }

    res.json({ received: results.length, results });
  } catch (err) { next(err); }
});

// ─── GET /api/tracking/stats ─────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const [counts, delivered_today, by_courier, by_customer] = await Promise.all([
      query(`
        SELECT status, COUNT(*)::int AS count
        FROM parcels GROUP BY status
      `),
      query(`
        SELECT COUNT(*)::int AS count FROM parcels
        WHERE status = 'delivered' AND delivered_at >= CURRENT_DATE
      `),
      query(`
        SELECT courier_name, courier_code, COUNT(*)::int AS count
        FROM parcels
        WHERE courier_name IS NOT NULL
        GROUP BY courier_name, courier_code
        ORDER BY count DESC
      `),
      query(`
        SELECT DISTINCT ON (p.customer_id)
          p.customer_id AS id,
          p.customer_name AS name,
          p.customer_account AS account_number
        FROM parcels p
        WHERE p.customer_id IS NOT NULL AND p.customer_name IS NOT NULL
        ORDER BY p.customer_id, p.customer_name
      `),
    ]);

    const statusMap = {};
    for (const r of counts.rows) statusMap[r.status] = r.count;

    res.json({
      by_status:      statusMap,
      delivered_today: delivered_today.rows[0].count,
      total_active:   Object.entries(statusMap)
        .filter(([s]) => !['delivered','returned','cancelled','tracking_expired'].includes(s))
        .reduce((a,[,c]) => a + c, 0),
      by_courier:     by_courier.rows,
      by_customer:    by_customer.rows,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/tracking ───────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const {
      search, status, courier_code, customer_id,
      date_from, date_to,
      limit = 50, offset = 0,
    } = req.query;

    const conditions = [];
    const values     = [];
    let   idx        = 1;

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      conditions.push(`p.status = ANY($${idx++}::parcel_status[])`);
      values.push(statuses);
    }
    if (courier_code) {
      conditions.push(`p.courier_code ILIKE $${idx++}`);
      values.push(courier_code);
    }
    if (customer_id) {
      conditions.push(`p.customer_id = $${idx++}`);
      values.push(customer_id);
    }
    if (date_from) {
      conditions.push(`p.last_event_at >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`p.last_event_at <= $${idx++}`);
      values.push(date_to);
    }
    if (search) {
      conditions.push(`(
        p.consignment_number ILIKE $${idx}   OR
        p.customer_name      ILIKE $${idx}   OR
        p.recipient_name     ILIKE $${idx}   OR
        p.recipient_postcode ILIKE $${idx}   OR
        p.courier_name       ILIKE $${idx}
      )`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT
          p.id, p.consignment_number,
          p.courier_name, p.courier_code, p.service_name,
          p.customer_name, p.customer_account,
          p.recipient_name, p.recipient_postcode,
          p.status, p.status_description, p.last_location,
          p.last_event_at, p.estimated_delivery, p.delivered_at,
          p.weight_kg,
          p.created_at
        FROM parcels p
        ${where}
        ORDER BY p.last_event_at DESC NULLS LAST, p.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...values, parseInt(limit), parseInt(offset)]),

      query(`SELECT COUNT(*)::int AS total FROM parcels p ${where}`, values),
    ]);

    res.json({
      parcels: dataRes.rows,
      total:   countRes.rows[0].total,
      limit:   parseInt(limit),
      offset:  parseInt(offset),
    });
  } catch (err) { next(err); }
});

// ─── GET /api/tracking/:consignment ─────────────────────────────────────────

router.get('/:consignment', async (req, res, next) => {
  try {
    const parcelRes = await query(
      'SELECT * FROM parcels WHERE consignment_number = $1',
      [req.params.consignment]
    );
    if (!parcelRes.rows.length) return res.status(404).json({ error: 'Parcel not found' });

    const eventsRes = await query(
      `SELECT id, event_code, status, description, location, event_at
       FROM tracking_events
       WHERE consignment_number = $1
       ORDER BY event_at DESC`,
      [req.params.consignment]
    );

    res.json({ ...parcelRes.rows[0], events: eventsRes.rows });
  } catch (err) { next(err); }
});

// ─── 30-day purge ─────────────────────────────────────────────────────────────
// Tracking data is operational only — PII is no longer needed after 30 days.
// tracking_events cascade-delete when their parcel is deleted.

export async function purgeOldTrackingData() {
  try {
    const result = await query(`
      DELETE FROM parcels
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);
    if (result.rowCount > 0) {
      console.log(`🗑  Purged ${result.rowCount} parcel record(s) older than 30 days`);
    }
  } catch (err) {
    console.warn('⚠ purgeOldTrackingData failed (non-fatal):', err.message);
  }
}

export default router;
