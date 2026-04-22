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

// ─── Status normalisation ─────────────────────────────────────────────────────
// Maps any courier-specific status string → our canonical parcel_status enum

const STATUS_MAP = {
  // Booked / label created
  booked: 'booked', created: 'booked', label_created: 'booked',
  label_printed: 'booked', manifested: 'booked', registered: 'booked',

  // Collected
  collected: 'collected', collection: 'collected', picked_up: 'collected',
  collection_made: 'collected', collected_from_sender: 'collected',

  // In transit (on the road between facilities)
  in_transit: 'in_transit', transit: 'in_transit', on_its_way: 'in_transit',
  forwarded: 'in_transit', processed: 'in_transit', departed_depot: 'in_transit',
  despatched: 'in_transit', dispatched: 'in_transit',
  left_hub: 'in_transit', parcel_left_hub: 'in_transit', departed_hub: 'in_transit',
  left_depot: 'in_transit', departed_facility: 'in_transit', left_facility: 'in_transit',

  // At depot (physically at a hub / sorting facility)
  at_hub: 'at_depot', hub: 'at_depot', in_depot: 'at_depot',
  arrived_at_depot: 'at_depot', at_depot: 'at_depot',
  sorting: 'at_depot', sorted: 'at_depot', at_facility: 'at_depot',
  arrived_at_hub: 'at_depot', held_at_hub: 'at_depot',
  parcel_at_hub: 'at_depot', received_at_hub: 'at_depot',

  // Out for delivery
  out_for_delivery: 'out_for_delivery', out_for_del: 'out_for_delivery',
  on_vehicle: 'out_for_delivery', with_driver: 'out_for_delivery',
  loaded_on_van: 'out_for_delivery', with_courier: 'out_for_delivery',
  on_delivery_run: 'out_for_delivery',

  // Delivered
  delivered: 'delivered', delivery_complete: 'delivered',
  signed_for: 'delivered', parcel_delivered: 'delivered',
  delivered_to_neighbour: 'delivered', delivered_to_safe_place: 'delivered',

  // Failed delivery
  failed_delivery: 'failed_delivery', delivery_failed: 'failed_delivery',
  missed: 'failed_delivery', attempted: 'failed_delivery',
  not_home: 'failed_delivery', carded: 'failed_delivery',
  delivery_attempted: 'failed_delivery', unable_to_deliver: 'failed_delivery',

  // On hold
  on_hold: 'on_hold', held: 'on_hold', hold: 'on_hold',
  awaiting_collection: 'on_hold', collection_point: 'on_hold',
  awaiting_instructions: 'on_hold',

  // Customs hold
  customs_hold: 'customs_hold', customs: 'customs_hold',
  customs_clearance: 'customs_hold', held_at_customs: 'customs_hold',
  customs_delay: 'customs_hold', import_customs: 'customs_hold',

  // Exception
  exception: 'exception', damaged: 'exception', lost: 'exception',
  missing: 'exception', problem: 'exception', delay: 'exception',
  address_query: 'exception', undeliverable: 'exception',

  // Returned
  returned: 'returned', return: 'returned', rts: 'returned',
  return_to_sender: 'returned', returning: 'returned',
};

function normaliseStatus(raw) {
  if (!raw) return 'unknown';
  const key = String(raw).toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z_]/g, '');
  return STATUS_MAP[key] || 'in_transit';
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

function normalisePayload(body) {
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
          status:              ev.status || null,
          status_description:  ev.status_description || null,
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

async function upsertEvent(event, rawBody) {
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
      status             = EXCLUDED.status,
      status_description = EXCLUDED.status_description,
      last_location      = EXCLUDED.last_location,
      last_event_at      = EXCLUDED.last_event_at,
      delivered_at       = CASE WHEN EXCLUDED.status = 'delivered' THEN EXCLUDED.last_event_at ELSE parcels.delivered_at END,
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

  return { ok: true, consignment, status, parcel_id: parcelId };
}

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
    const counts = await query(`
      SELECT status, COUNT(*)::int AS count
      FROM parcels
      GROUP BY status
    `);

    const delivered_today = await query(`
      SELECT COUNT(*)::int AS count FROM parcels
      WHERE status = 'delivered'
        AND delivered_at >= CURRENT_DATE
    `);

    const by_courier = await query(`
      SELECT courier_name, courier_code, COUNT(*)::int AS count
      FROM parcels
      WHERE status NOT IN ('delivered','returned')
        AND courier_name IS NOT NULL
      GROUP BY courier_name, courier_code
      ORDER BY count DESC
    `);

    const statusMap = {};
    for (const r of counts.rows) statusMap[r.status] = r.count;

    res.json({
      by_status:     statusMap,
      delivered_today: delivered_today.rows[0].count,
      total_active:  Object.entries(statusMap)
        .filter(([s]) => !['delivered','returned'].includes(s))
        .reduce((a,[,c]) => a + c, 0),
      by_courier:    by_courier.rows,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/tracking ───────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const {
      search, status, courier_code,
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

export default router;
