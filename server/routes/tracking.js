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

  // In transit
  in_transit: 'in_transit', transit: 'in_transit', at_hub: 'in_transit',
  hub: 'in_transit', sorting: 'in_transit', sorted: 'in_transit',
  in_depot: 'in_transit', arrived_at_depot: 'in_transit',
  departed_depot: 'in_transit', on_its_way: 'in_transit',
  forwarded: 'in_transit', processed: 'in_transit',

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

// ─── POST /api/tracking/webhook ──────────────────────────────────────────────

router.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Empty payload' });

    // Support array or single event
    const events = Array.isArray(body) ? body : [body];
    const results = [];

    for (const event of events) {
      const consignment = pick(event,
        'consignment_number', 'consignmentNumber', 'tracking_number', 'trackingNumber',
        'tracking_code', 'trackingCode', 'reference', 'barcode', 'parcel_id', 'shipment_id', 'id'
      );
      if (!consignment) { results.push({ skipped: true, reason: 'no consignment number' }); continue; }

      const rawStatus   = pick(event, 'status', 'event_type', 'event_code', 'eventType', 'state', 'type');
      const status      = normaliseStatus(rawStatus);
      const description = pick(event, 'description', 'event_description', 'status_description',
                               'message', 'detail', 'text', 'statusDescription');
      const location    = pick(event, 'location', 'depot', 'hub', 'facility', 'scan_location', 'scanLocation');
      const eventAt     = pick(event, 'timestamp', 'event_time', 'eventTime', 'datetime',
                               'date_time', 'scanned_at', 'created_at') || new Date().toISOString();

      const courierName = pick(event, 'courier_name', 'courierName', 'courier', 'carrier', 'carrier_name');
      const courierCode = pick(event, 'courier_code', 'courierCode', 'carrier_code', 'carrierCode');
      const serviceName = pick(event, 'service', 'service_name', 'serviceName', 'product', 'service_type');

      const customerName    = pick(event, 'customer.name', 'customer_name', 'customerName', 'sender', 'sender_name', 'account_name');
      const customerAccount = pick(event, 'customer.account_number', 'account_number', 'accountNumber', 'moov_account', 'moovAccount');
      const recipientName   = pick(event, 'recipient.name', 'recipient_name', 'recipientName', 'consignee', 'delivery_name');
      const recipientPost   = pick(event, 'recipient.postcode', 'postcode', 'delivery_postcode', 'recipientPostcode', 'zip');
      const recipientAddr   = pick(event, 'recipient.address', 'address', 'delivery_address', 'recipientAddress');
      const weightKg        = pick(event, 'weight_kg', 'weightKg', 'weight', 'gross_weight');
      const estDelivery     = pick(event, 'estimated_delivery', 'estimatedDelivery', 'eta', 'due_date');
      const eventCode       = pick(event, 'event_code', 'eventCode', 'code', 'status_code');

      // Resolve customer_id from account number
      let customerId = null;
      if (customerAccount) {
        const cr = await query('SELECT id FROM customers WHERE account_number = $1', [customerAccount]);
        if (cr.rows.length) customerId = cr.rows[0].id;
      }

      // Upsert the parcel (update status + last event fields)
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

      // Insert tracking event
      await query(`
        INSERT INTO tracking_events
          (parcel_id, consignment_number, event_code, status, description, location, event_at, raw_payload)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [parcelId, consignment, eventCode, status, description, location, eventAt, JSON.stringify(event)]);

      results.push({ ok: true, consignment, status, parcel_id: parcelId });
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
