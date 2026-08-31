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
import { fetchShipmentByReference, fetchShipmentById, requestTrackingUpdate } from '../services/voilaClient.js';
import { processShipment, insertCharges } from '../services/pricingEngine.js';
// upsertEvent and normalisePayload are defined later in this file and used by bulk runner below

const router = express.Router();

// ─── In-flight backfill guard ─────────────────────────────────────────────────
// Prevents concurrent tracking webhooks for the same consignment from each
// triggering their own backfill. First one wins; the rest skip silently.
// DB-level unique indexes (migration 154) are the final guard, but this stops
// the noise before it reaches the DB.
const backfillInFlight = new Set();

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
  tracking_expired: 'exception',
  cancelled: 'cancelled', cancellation: 'cancelled', voided: 'cancelled',

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
          _consignment:           consignment,
          // platform_shipment_id is the unique Voila/DC shipment ID (e.g. 249492859).
          // This is always unique per booking — unlike shipment.reference which is the
          // customer's sender ref and can be shared across multiple consolidated parcels
          // (e.g. two separate DPD bookings both using reference '472393').
          // The backfill guard MUST use platform ID to avoid silently skipping the second
          // booking when the first one already has a charge for the same reference.
          _platform_shipment_id:  shipment.id ? String(shipment.id) : null,
          _shipment_reference:    shipment.reference || null,
          _courier_name:       shipment.courier || null,
          _courier_code:       shipment.courier ? shipment.courier.toLowerCase() : null,
          _service_name:       shipment.friendly_service_name || null,
          _customer_name:      shipment.account_name || null,
          _customer_account:   shipment.account_number || null,
          _recipient_name:     shipment.ship_to_name || shipment.ship_to_company_name || shipment.recipient_name || tu.address_information?.name || null,
          _recipient_postcode: shipment.ship_to_postcode || tu.address_information?.postcode || shipment.postcode || null,
          _recipient_address:  shipment.ship_to_address
            || [shipment.ship_to_address_1, shipment.ship_to_address_2, shipment.ship_to_address_3, shipment.ship_to_city, shipment.ship_to_county].filter(Boolean).join(', ')
            || shipment.address
            || tu.address_information?.address
            || null,
          _weight_kg:          parcel.weight || parcel.weight_kg || parcel.actual_weight || parcel.gross_weight || parcel.declared_weight || shipment.weight || shipment.total_weight || null,
          _estimated_delivery: tu.expected_delivery || shipment.tracking_expected_delivery_date || null,
          _tracking_url:       parcel.tracking_url || parcel.trackingUrl || null,
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

  const shipmentReference    = event._shipment_reference    || pick(event, 'shipment_reference', 'order_reference');
  // Prefer numeric platform ID for dedup — more specific than reference (which may be shared)
  const platformShipmentId   = event._platform_shipment_id  || null;
  const platformShipmentInt  = platformShipmentId ? (parseInt(platformShipmentId, 10) || null) : null;

  const courierName    = event._courier_name    || pick(event, 'courier_name', 'courierName', 'courier', 'carrier', 'carrier_name');
  const courierCode    = event._courier_code    || pick(event, 'courier_code', 'courierCode', 'carrier_code', 'carrierCode');
  const serviceName    = event._service_name    || pick(event, 'service', 'service_name', 'serviceName', 'product', 'service_type');
  const customerName   = event._customer_name   || pick(event, 'customer.name', 'customer_name', 'customerName', 'sender', 'sender_name', 'account_name');
  const customerAccount= event._customer_account|| pick(event, 'customer.account_number', 'account_number', 'accountNumber', 'moov_account', 'moovAccount');
  const recipientName  = event._recipient_name  || pick(event, 'recipient.name', 'recipient_name', 'recipientName', 'consignee', 'delivery_name', 'ship_to_name');
  const recipientPost  = event._recipient_postcode || pick(event, 'recipient.postcode', 'postcode', 'delivery_postcode', 'recipientPostcode', 'zip', 'ship_to_postcode');
  const recipientAddr  = event._recipient_address  || pick(event, 'recipient.address', 'recipient.street', 'recipient_address', 'delivery_address', 'address', 'ship_to_address', 'street', 'address_1');
  const weightKg       = event._weight_kg       || pick(event, 'weight_kg', 'weightKg', 'weight', 'gross_weight', 'declared_weight', 'actual_weight', 'weight_actual_kg');
  const estDelivery    = event._estimated_delivery || pick(event, 'estimated_delivery', 'estimatedDelivery', 'eta', 'due_date');
  const trackingUrl    = event._tracking_url    || pick(event, 'tracking_url', 'trackingUrl', 'track_url', 'parcel_tracking_url');

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
       weight_kg, estimated_delivery, tracking_url,
       status, status_description, last_location, last_event_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
      tracking_url       = COALESCE(EXCLUDED.tracking_url,       parcels.tracking_url),
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
    trackingUrl || null,
    status, description, location, eventAt,
  ]);

  const parcelId = parcelRes.rows[0].id;

  // Deduplicate: skip event if the last recorded status for this parcel is the same.
  // This prevents flooding the timeline with repeated scans at the same stage
  // (e.g. five "collected" pings seconds apart from the same courier hub).
  //
  // Exception — at_depot (status 3): a parcel passes through multiple physical hubs
  // (collection depot → national hub → delivery depot) and each leg produces a status-3
  // scan. If two at_depot events are more than 1 hour apart they are almost certainly
  // different hubs, so we let them both through to give a meaningful journey view.
  const lastEvt = await query(
    `SELECT status, event_at FROM tracking_events
     WHERE parcel_id = $1
     ORDER BY event_at DESC, id DESC
     LIMIT 1`,
    [parcelId]
  );
  const lastStatus  = lastEvt.rows[0]?.status;
  const lastEventAt = lastEvt.rows[0]?.event_at;

  if (lastStatus && lastStatus === status) {
    // For at_depot allow through if the gap to the previous at_depot is > 1 hour
    if (status === 'at_depot' && lastEventAt) {
      const gapMs = new Date(eventAt) - new Date(lastEventAt);
      if (Math.abs(gapMs) > 60 * 60 * 1000) {
        // Different hub leg — fall through and insert
      } else {
        return { ok: true, consignment, status, parcel_id: parcelId, deduped: true };
      }
    } else {
      return { ok: true, consignment, status, parcel_id: parcelId, deduped: true };
    }
  }

  await query(`
    INSERT INTO tracking_events
      (parcel_id, consignment_number, event_code, status, description, location, event_at, raw_payload)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT DO NOTHING
  `, [parcelId, consignment, eventCode, status, description, location, eventAt,
      JSON.stringify(event._raw || event)]);

  // Auto-cancel: if the carrier has cancelled this booking, cancel the linked charge.
  // This fires when a cancellation tracking event arrives (status_code 12 from DPD,
  // or text "Cancelled" from Voila's tracking API) and no shipment.cancelled webhook
  // was received. Mirrors the billing webhook cancellation handler exactly.
  if (status === 'cancelled') {
    await query(`
      UPDATE charges
      SET    cancelled = true, updated_at = NOW()
      WHERE  cancelled = false
        AND  shipment_id IN (
               SELECT id FROM shipments
               WHERE  $1 = ANY(tracking_codes)
                 AND  (collection_date IS NULL OR collection_date >= CURRENT_DATE - INTERVAL '400 days')
             )
    `, [consignment]);

    await query(`
      UPDATE shipments
      SET    cancelled = true, cancelled_at = NOW(), updated_at = NOW()
      WHERE  $1 = ANY(tracking_codes)
        AND  cancelled = false
        AND  (collection_date IS NULL OR collection_date >= CURRENT_DATE - INTERVAL '400 days')
    `, [consignment]);

    return { ok: true, consignment, status: 'cancelled', parcel_id: parcelId, auto_cancelled: true };
  }

  // Auto-verify: if this event confirms physical movement, mark the linked charge verified.
  // The 400-day window is a belt-and-braces guard against tracking number recycling —
  // couriers recycle numbers every 6–12 months, so a tracking event more than 400 days
  // after a shipment's collection date almost certainly refers to a different parcel.
  if (VERIFIED_STATUSES.has(status)) {
    const verifyResult = await query(`
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

    // ── Layer 1 backfill ──────────────────────────────────────────────────────
    // If no charges were updated, the shipment-created webhook was likely missed.
    // Fire-and-forget: fetch from Voila API, price it, insert and immediately verify.
    // Non-blocking — the tracking webhook response is never delayed or failed.
    //
    // KEY: We use platformShipmentId (Voila's unique numeric shipment ID, e.g. 249492859)
    // as the dedup key wherever possible. shipment.reference is the customer's sender ref
    // and is NOT unique — two separate DPD bookings with the same sender ref (e.g. two
    // parcels consolidated under one DPD consignment) will share the same reference.
    // Using reference alone causes the second booking to be silently skipped when the
    // first booking's charge already exists for that reference.
    const backfillKey = platformShipmentId || shipmentReference;

    if (verifyResult.rowCount === 0 && backfillKey) {
      // ── Guard: only backfill if no charge already exists ─────────────────────
      // When a platform ID is available, check by voila_shipment_id / platform_shipment_id
      // only — not by order_id / reference, which may falsely match a different booking
      // that happens to share the same customer reference.
      let existingCharge;
      if (platformShipmentInt) {
        existingCharge = await query(`
          SELECT 1 FROM charges
          WHERE cancelled   = false
            AND charge_type = 'courier'
            AND (
              voila_shipment_id::text = $1
              OR shipment_id IN (
                SELECT id FROM shipments WHERE platform_shipment_id = $2
              )
            )
          LIMIT 1
        `, [String(platformShipmentInt), platformShipmentInt]);
      } else if (shipmentReference) {
        // No platform ID available — fall back to reference match (legacy path)
        const refStr = String(shipmentReference);
        existingCharge = await query(`
          SELECT 1 FROM charges
          WHERE cancelled   = false
            AND charge_type = 'courier'
            AND (
              order_id = $1
              OR voila_shipment_id::text = $1
              OR shipment_id IN (SELECT id FROM shipments WHERE platform_shipment_id::text = $1)
            )
          LIMIT 1
        `, [refStr]);
      } else {
        existingCharge = { rows: [] };
      }

      if (existingCharge.rows.length) {
        // Charge exists but tracking code not yet linked — not a missing shipment,
        // just a lookup miss. Don't backfill.
        console.log(`[tracking] charge exists for ${backfillKey} (consignment ${consignment}) — skipping backfill`);
      } else if (backfillInFlight.has(backfillKey)) {
        // A concurrent webhook for the same shipment is already backfilling.
        console.log(`[tracking] backfill already in flight for ${backfillKey} — skipping concurrent trigger`);
      } else {
        // Truly missing — no charge anywhere for this shipment. Backfill.
        backfillInFlight.add(backfillKey);
        ;(async () => {
          try {
            console.warn(`⚠️  Tracking backfill: no charges for consignment ${consignment} (key ${backfillKey}) — fetching from Voila API`);

            // Prefer fetching by platform ID (exact, unique) over reference (may match
            // the wrong shipment when two bookings share the same customer reference)
            const payload = platformShipmentInt
              ? await fetchShipmentById(String(platformShipmentInt))
              : await fetchShipmentByReference(String(shipmentReference));

            if (!payload) {
              console.warn(`   Backfill: Voila API returned no shipment for key ${backfillKey}`);
              return;
            }
            const { charges, errors } = await processShipment(payload);
            if (!charges.length) {
              console.warn(`   Backfill: processShipment produced no charges for ${backfillKey}`, errors);
              return;
            }
            const inserted = await insertCharges(charges);
            const insertedIds = inserted.map(c => c.id);
            if (insertedIds.length) {
              await query(
                `UPDATE charges SET verified = true, status = 'verified', updated_at = NOW() WHERE id = ANY($1)`,
                [insertedIds]
              );
            }
            console.log(`✅  Tracking backfill: created + verified ${inserted.length} charge(s) for ${backfillKey} (consignment ${consignment})`);
            if (errors.length) console.warn('   Backfill warnings:', errors);
          } catch (err) {
            console.error(`❌  Tracking backfill failed for ${backfillKey}:`, err.message);
          } finally {
            backfillInFlight.delete(backfillKey);
          }
        })();
      }
    }
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
        WHERE status = 'delivered'
          AND last_event_at >= CURRENT_DATE
          AND last_event_at <  CURRENT_DATE + INTERVAL '1 day'
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
      // Cast to date then add 1 day so 'YYYY-MM-DD' is treated as end-of-day inclusive
      conditions.push(`p.last_event_at < ($${idx++}::date + INTERVAL '1 day')`);
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
          p.recipient_name, p.recipient_postcode, p.recipient_address,
          p.status, p.status_description, p.last_location,
          p.last_event_at, p.estimated_delivery, p.delivered_at,
          p.weight_kg,
          p.created_at,
          COALESCE(c.ship_to_country_iso, s.ship_to_country_iso) AS charge_country_iso
        FROM parcels p
        LEFT JOIN LATERAL (
          SELECT ship_to_country_iso FROM charges
          WHERE voila_shipment_id = p.consignment_number
             OR order_id = p.consignment_number
             OR (raw_payload->'tracking_codes' IS NOT NULL AND raw_payload->'tracking_codes' ? p.consignment_number)
             OR raw_payload->>'consignment_number' = p.consignment_number
          LIMIT 1
        ) c ON true
        LEFT JOIN LATERAL (
          SELECT ship_to_country_iso FROM shipments
          WHERE p.consignment_number = ANY(tracking_codes)
          LIMIT 1
        ) s ON true
        ${where}
        ORDER BY p.last_event_at DESC NULLS LAST, p.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...values, parseInt(limit), parseInt(offset)]),

      query(`SELECT COUNT(*)::int AS total FROM parcels p ${where}`, values),
    ]);

    res.json({
      parcels: dataRes.rows.map(p => ({
        ...p,
        country_code: detectCountryCode(p, { ship_to_country_iso: p.charge_country_iso }),
      })),
      total:   countRes.rows[0].total,
      limit:   parseInt(limit),
      offset:  parseInt(offset),
    });
  } catch (err) { next(err); }
});

// ─── GET /api/tracking/:consignment ─────────────────────────────────────────

function detectCountryCode(parcel, charge) {
  if (charge?.ship_to_country_iso) return charge.ship_to_country_iso.toUpperCase();
  const addr = (parcel.recipient_address || '').toUpperCase();
  const postcode = (parcel.recipient_postcode || '').trim().toUpperCase();
  const service = (parcel.service_name || '').toUpperCase();

  if (/\b(USA|UNITED STATES|AMERICA)\b/.test(addr)) return 'US';
  if (/\b(AUSTRALIA|AUS)\b/.test(addr)) return 'AU';
  if (/\b(CANADA|CAN)\b/.test(addr)) return 'CA';
  if (/\b(GERMANY|DEUTSCHLAND)\b/.test(addr)) return 'DE';
  if (/\b(FRANCE)\b/.test(addr)) return 'FR';
  if (/\b(IRELAND|EIRE|REPUBLIC OF IRELAND)\b/.test(addr)) return 'IE';
  if (/\b(SPAIN|ESPANA)\b/.test(addr)) return 'ES';
  if (/\b(ITALY|ITALIA)\b/.test(addr)) return 'IT';
  if (/\b(NETHERLANDS|HOLLAND)\b/.test(addr)) return 'NL';
  if (/\b(BELGIUM|BELGIQUE)\b/.test(addr)) return 'BE';
  if (/\b(NEW ZEALAND)\b/.test(addr)) return 'NZ';
  if (/\b(SWITZERLAND|SCHWEIZ)\b/.test(addr)) return 'CH';

  if (/^\d{5}(-\d{4})?$/.test(postcode)) return 'US';
  if (/^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(postcode)) return 'GB';

  if (service.includes('INTL') || service.includes('INTERNATIONAL') || service.includes('AIR') || service.includes('EXPORT') || service.includes('GLOBAL')) {
    return 'INTL';
  }

  return 'GB';
}

router.get('/:consignment', async (req, res, next) => {
  try {
    const parcelRes = await query(
      'SELECT * FROM parcels WHERE consignment_number = $1',
      [req.params.consignment]
    );
    if (!parcelRes.rows.length) return res.status(404).json({ error: 'Parcel not found' });

    const parcel = parcelRes.rows[0];

    const eventsRes = await query(
      `SELECT id, event_code, status, description, location, event_at, raw_payload
       FROM tracking_events
       WHERE consignment_number = $1
       ORDER BY event_at DESC`,
      [req.params.consignment]
    );

    // Look up associated shipment record if available
    let shipmentRecord = null;
    try {
      const shipRes = await query(
        `SELECT id, tracking_codes, raw_payload, ship_to_address, ship_to_name, ship_to_postcode,
                ship_to_country_iso, weight, total_weight, declared_weight
         FROM shipments
         WHERE $1 = ANY(tracking_codes)
            OR reference = $1
            OR voila_shipment_id = $1
         LIMIT 1`,
        [req.params.consignment]
      );
      if (shipRes.rows.length) {
        shipmentRecord = shipRes.rows[0];
      }
    } catch {
      // Non-fatal if shipments query fails
    }

    // Look up associated charge if available
    let charge = null;
    try {
      const chargeRes = await query(
        `SELECT c.weight_actual_kg, c.weight_charged_kg, c.weight_dimensional_kg,
                c.ship_to_country_iso, c.ship_to_postcode, c.ship_to_name, c.ship_to_address,
                c.cost_price, c.sell_price, c.margin, c.despatch_date, c.raw_payload
         FROM charges c
         WHERE c.voila_shipment_id = $1
            OR c.order_id = $1
            OR (c.raw_payload->'tracking_codes' IS NOT NULL AND c.raw_payload->'tracking_codes' ? $1)
            OR c.raw_payload->>'consignment_number' = $1
            OR c.raw_payload->>'tracking_number' = $1
            OR c.raw_payload->'shipment'->>'reference' = $1
         LIMIT 1`,
        [req.params.consignment]
      );
      if (chargeRes.rows.length) {
        charge = chargeRes.rows[0];
      }
    } catch {
      // Non-fatal if charge lookup fails
    }

    // Extract dimensions and payload details
    const rawPayload = charge?.raw_payload || shipmentRecord?.raw_payload || {};
    const reqShip = rawPayload.request_shipment || rawPayload.shipment || {};
    const pArr = reqShip.parcels || [];
    const firstP = pArr[0] || {};
    const dimL = parseFloat(firstP.dim_length || firstP.length || rawPayload.dim_length) || null;
    const dimW = parseFloat(firstP.dim_width || firstP.width || rawPayload.dim_width) || null;
    const dimH = parseFloat(firstP.dim_height || firstP.height || rawPayload.dim_height) || null;

    // Determine volumetric divisor from courier rules
    const courierCode = (parcel.courier_code || charge?.courier_code || '').toLowerCase();
    const divisor = courierCode.includes('dpd') ? 4000 : 5000;

    let dimensionalWeightKg = charge?.weight_dimensional_kg ? Number(charge.weight_dimensional_kg) : null;
    if (!dimensionalWeightKg && dimL && dimW && dimH) {
      dimensionalWeightKg = Number(((dimL * dimW * dimH) / divisor).toFixed(2));
    }

    // Resolve recipient address from all sources
    const recipientAddress = parcel.recipient_address
      || charge?.ship_to_address
      || shipmentRecord?.ship_to_address
      || [reqShip.ship_to?.address_1, reqShip.ship_to?.address_2, reqShip.ship_to?.city, reqShip.ship_to?.county].filter(Boolean).join(', ')
      || [reqShip.address_line_1, reqShip.address_line_2, reqShip.city].filter(Boolean).join(', ')
      || null;

    const country_code = detectCountryCode(parcel, charge || shipmentRecord);
    const weight_kg = parcel.weight_kg != null
      ? parcel.weight_kg
      : (charge?.weight_actual_kg || shipmentRecord?.weight || shipmentRecord?.total_weight || parseFloat(firstP.weight) || null);
    const is_international = country_code !== 'GB' && country_code !== 'UK';

    // If delivered, filter out any redundant post-delivery technical noise
    let filteredEvents = eventsRes.rows;
    const deliveredIdx = filteredEvents.findIndex(e => String(e.status).toLowerCase() === 'delivered');
    if (deliveredIdx !== -1) {
      filteredEvents = filteredEvents.slice(deliveredIdx);
    }

    const rawWebhook = eventsRes.rows.find(e => e.raw_payload)?.raw_payload
      || shipmentRecord?.raw_payload
      || charge?.raw_payload
      || {
        parcel_record: parcel,
        latest_event: eventsRes.rows[0] || null,
        total_events: eventsRes.rows.length,
      };

    res.json({
      ...parcel,
      recipient_address: recipientAddress,
      weight_kg,
      dimensional_weight_kg: dimensionalWeightKg,
      dimensions: (dimL && dimW && dimH) ? { length: dimL, width: dimW, height: dimH, divisor } : null,
      country_code,
      is_international,
      raw_webhook: rawWebhook,
      charge_raw_payload: charge?.raw_payload || null,
      shipment_raw_payload: shipmentRecord?.raw_payload || null,
      events: filteredEvents,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/tracking/delete-before-today ───────────────────────────────────
router.post('/delete-before-today', async (req, res, next) => {
  try {
    const eRes = await query('DELETE FROM tracking_events WHERE created_at < CURRENT_DATE');
    const pRes = await query('DELETE FROM parcels WHERE created_at < CURRENT_DATE');
    console.log(`[tracking] Deleted tracking data before today: ${eRes.rowCount} events, ${pRes.rowCount} parcels`);
    res.json({ success: true, events_deleted: eRes.rowCount, parcels_deleted: pRes.rowCount });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/tracking/clear-all ─────────────────────────────────────────────
router.post('/clear-all', async (req, res, next) => {
  try {
    const eRes = await query('DELETE FROM tracking_events');
    const pRes = await query('DELETE FROM parcels');
    console.log(`[tracking] Purged all tracking data: ${eRes.rowCount} events, ${pRes.rowCount} parcels`);
    res.json({ success: true, events_deleted: eRes.rowCount, parcels_deleted: pRes.rowCount });
  } catch (err) {
    next(err);
  }
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

// ─── POST /api/tracking/backfill-verify ──────────────────────────────────────
//
// Finds all unverified charges from the last N days and:
//   1. Runs an immediate catch-up verify pass (verify any charges that already
//      have qualifying tracking events in the DB but weren't verified yet).
//   2. Returns a full list of shipments that remain unverified so the operator
//      can see exactly what's missing and take manual action if needed.
//
// Body: { days: 14 }  — optional, defaults to 14
//
// Called manually when the tracking webhook has been disabled or missed events.

router.post('/backfill-verify', async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.body?.days) || 14, 90); // cap at 90 days

    // ── Step 1: Aggressive catch-up verify ───────────────────────────────────
    // Verify any charge whose shipment already has a qualifying tracking event
    // in the parcels/tracking_events tables (these may pre-date the webhook gap).
    const verifyRes = await query(`
      UPDATE charges c
      SET    verified   = true,
             updated_at = NOW()
      FROM   shipments s
      WHERE  c.shipment_id = s.id
        AND  c.verified    = false
        AND  c.cancelled   = false
        AND  c.charge_type = 'courier'
        AND  c.created_at  >= NOW() - ($1 || ' days')::INTERVAL
        AND  s.tracking_codes IS NOT NULL
        AND  array_length(s.tracking_codes, 1) > 0
        AND  EXISTS (
          SELECT 1
          FROM   parcels p
          JOIN   tracking_events te ON te.parcel_id = p.id
          WHERE  p.consignment_number = ANY(s.tracking_codes)
            AND  te.status = ANY(ARRAY[
                   'in_transit','at_depot','out_for_delivery',
                   'delivered','failed_delivery','on_hold',
                   'awaiting_collection','customs_hold','exception','returned'
                 ]::parcel_status[])
        )
    `, [days]);

    const justVerified = verifyRes.rowCount || 0;

    // ── Step 2: List still-unverified shipments ───────────────────────────────
    // Everything that has a tracking code but still no qualifying event.
    const stillUnverifiedRes = await query(`
      SELECT
        c.id                                    AS charge_id,
        c.created_at,
        c.charge_type,
        cu.business_name                        AS customer_name,
        cu.account_number,
        s.id                                    AS shipment_id,
        s.tracking_codes,
        s.courier,
        s.despatch_date,
        -- Has any tracking event at all (even non-qualifying like 'booked')
        EXISTS (
          SELECT 1 FROM parcels p
          JOIN tracking_events te ON te.parcel_id = p.id
          WHERE p.consignment_number = ANY(s.tracking_codes)
        )                                       AS has_any_event
      FROM   charges    c
      JOIN   shipments  s  ON s.id  = c.shipment_id
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE  c.verified    = false
        AND  c.cancelled   = false
        AND  c.charge_type = 'courier'
        AND  c.created_at  >= NOW() - ($1 || ' days')::INTERVAL
        AND  s.tracking_codes IS NOT NULL
        AND  array_length(s.tracking_codes, 1) > 0
      ORDER  BY c.created_at DESC
    `, [days]);

    const unverified = stillUnverifiedRes.rows;

    console.log(
      `[tracking/backfill-verify] days=${days}: ` +
      `verified ${justVerified} charge(s), ${unverified.length} still unverified`
    );

    res.json({
      days_scanned:     days,
      just_verified:    justVerified,
      still_unverified: unverified.length,
      unverified_list:  unverified.map(r => ({
        charge_id:      r.charge_id,
        customer:       r.customer_name,
        account_number: r.account_number,
        shipment_id:    r.shipment_id,
        courier:        r.courier,
        tracking_codes: r.tracking_codes,
        despatch_date:  r.despatch_date,
        created_at:     r.created_at,
        has_any_event:  r.has_any_event,
      })),
    });
  } catch (err) { next(err); }
});

// ─── POST /api/tracking/test-tracking-request ────────────────────────────────
//
// Diagnostic endpoint — picks the single OLDEST unverified shipment that has
// Voila tracking credentials stored and calls the Voila tracking API synchronously.
// Returns the raw Voila response so the format can be inspected before wiring up
// the full bulk runner to process events from it.

router.post('/test-tracking-request', async (req, res, next) => {
  try {
    // Find the oldest unverified shipment with credentials
    const { rows } = await query(`
      SELECT
        s.id                            AS shipment_id,
        s.voila_tracking_request_id     AS track_req_id,
        s.voila_tracking_request_hash   AS track_req_hash,
        s.tracking_codes,
        s.courier,
        s.created_at,
        c.id                            AS charge_id,
        cu.business_name                AS customer_name
      FROM   shipments s
      JOIN   charges   c  ON c.shipment_id = s.id
                         AND c.charge_type  = 'courier'
                         AND c.verified     = false
                         AND c.cancelled    = false
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE  s.voila_tracking_request_id   IS NOT NULL
        AND  s.voila_tracking_request_hash IS NOT NULL
      ORDER  BY s.created_at ASC
      LIMIT  1
    `);

    if (!rows.length) {
      return res.json({ ok: false, message: 'No unverified shipments with Voila tracking credentials found.' });
    }

    const shipment = rows[0];

    console.log(
      `[test-tracking-request] Calling Voila for shipment ${shipment.shipment_id} ` +
      `(req_id=${shipment.track_req_id}, customer="${shipment.customer_name}", ` +
      `created=${shipment.created_at})`
    );

    const voilaResponse = await requestTrackingUpdate(
      shipment.track_req_id,
      shipment.track_req_hash
    );

    return res.json({
      ok: true,
      shipment: {
        shipment_id:    shipment.shipment_id,
        charge_id:      shipment.charge_id,
        customer:       shipment.customer_name,
        courier:        shipment.courier,
        tracking_codes: shipment.tracking_codes,
        created_at:     shipment.created_at,
        track_req_id:   shipment.track_req_id,
        track_req_hash: shipment.track_req_hash,
      },
      voila_response: voilaResponse,
    });

  } catch (err) {
    console.error('[test-tracking-request] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/tracking/bulk-tracking-update ──────────────────────────────────
//
// Calls the Voila on-demand tracking API for every unverified shipment that has
// voila_tracking_request_id + voila_tracking_request_hash stored.
//
// Runs in the background (responds immediately) and processes up to `limit`
// shipments per call (default 500, max 2500) with a configurable delay between
// each request to avoid hammering the Voila API.
//
// Body (all optional):
//   { limit: 500, delay_ms: 500, dry_run: false }
//
// Returns: { queued: N, message: "..." }
// Progress is logged to Railway logs.

router.post('/bulk-tracking-update', async (req, res, next) => {
  try {
    const limit   = Math.min(parseInt(req.body?.limit)    || 500,  2500);
    const delayMs = Math.min(parseInt(req.body?.delay_ms) || 500,  5000);
    const dryRun  = req.body?.dry_run === true;

    // Find all unverified shipments that have Voila tracking credentials stored
    const { rows: candidates } = await query(`
      SELECT
        s.id                            AS shipment_id,
        s.voila_tracking_request_id     AS track_req_id,
        s.voila_tracking_request_hash   AS track_req_hash,
        s.tracking_codes,
        s.courier,
        c.id                            AS charge_id,
        c.customer_id
      FROM   shipments s
      JOIN   charges   c ON c.shipment_id = s.id
                        AND c.charge_type  = 'courier'
                        AND c.verified     = false
                        AND c.cancelled    = false
      WHERE  s.voila_tracking_request_id   IS NOT NULL
        AND  s.voila_tracking_request_hash IS NOT NULL
      ORDER  BY s.created_at DESC
      LIMIT  $1
    `, [limit]);

    if (!candidates.length) {
      return res.json({
        queued:  0,
        message: 'No unverified shipments with Voila tracking credentials found.',
      });
    }

    res.json({
      queued:   candidates.length,
      dry_run:  dryRun,
      delay_ms: delayMs,
      message:  `Bulk tracking update running in background for ${candidates.length} shipment(s). Check Railway logs for progress.`,
    });

    // ── Background processing ─────────────────────────────────────────────────
    (async () => {
      let ok = 0, already = 0, failed = 0, noEvents = 0;
      const errors = [];

      for (const row of candidates) {
        try {
          if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

          if (dryRun) {
            console.log(`[bulk-tracking] DRY RUN: would request tracking for shipment ${row.shipment_id} (req_id=${row.track_req_id})`);
            ok++;
            continue;
          }

          // Call the Voila tracking API
          const trackingData = await requestTrackingUpdate(
            row.track_req_id,
            row.track_req_hash
          );

          // Feed the Voila response through the standard tracking event pipeline.
          // The API response has the same parcel/event structure as the tracking webhook,
          // so we wrap it in a synthetic tracking_update envelope and normalise it.
          const parcels = trackingData?.data?.parcels;
          if (!Array.isArray(parcels) || !parcels.length) {
            noEvents++;
            console.log(`[bulk-tracking] ⚠️  No parcels in response for shipment ${row.shipment_id}`);
            continue;
          }

          const syntheticPayload = {
            tracking_update: {
              parcels,
              expected_delivery: trackingData.data.expected_delivery || null,
            },
            shipment: {
              id:           String(trackingData.data.shipment_id || row.shipment_id),
              courier:      row.courier || null,
            },
          };

          const events = normalisePayload(syntheticPayload);
          let eventsStored = 0;
          let eventsVerified = 0;
          let eventsCancelled = 0;

          for (const ev of events) {
            const result = await upsertEvent(ev, null);
            if (result?.auto_cancelled) { eventsCancelled++; continue; }
            if (!result?.skipped && !result?.deduped) eventsStored++;
            if (result?.verified) eventsVerified++;
          }

          if (eventsVerified > 0) already += eventsVerified;

          if (eventsCancelled > 0) {
            ok++;
            console.log(`[bulk-tracking] 🚫 shipment ${row.shipment_id}: cancelled — charge auto-cancelled`);
          } else if (eventsStored > 0 || eventsVerified > 0) {
            ok++;
            console.log(
              `[bulk-tracking] ✅ shipment ${row.shipment_id}: ` +
              `${eventsStored} event(s) stored, ${eventsVerified} charge(s) verified`
            );
          } else {
            noEvents++;
            console.log(`[bulk-tracking] ⏳ shipment ${row.shipment_id}: only 'booked' status — nothing to verify yet`);
          }

        } catch (err) {
          failed++;
          errors.push({ shipment_id: row.shipment_id, error: err.message });
          console.error(`[bulk-tracking] ❌ Error for shipment ${row.shipment_id}:`, err.message);
        }
      }

      console.log(
        `[bulk-tracking] Complete: ${ok} requested, ${already} verified, ` +
        `${noEvents} no-events-yet, ${failed} errors`
      );
      if (errors.length) {
        console.warn('[bulk-tracking] First 20 errors:', JSON.stringify(errors.slice(0, 20)));
      }
    })().catch(err => console.error('[bulk-tracking] Unhandled background error:', err.message));

  } catch (err) { next(err); }
});

// ─── POST /api/tracking/refresh-stale ─────────────────────────────────────────
//
// Fetches the latest tracking from Voila for every parcel whose status has not
// advanced in the last N days and is not in a terminal state.
//
// This is the counterpart to bulk-tracking-update.  That endpoint targets
// *unverified charges* (parcels that have never been scanned).  This one
// targets parcels that WERE verified (e.g. reached "on_hold") but whose
// tracking webhook has since gone silent — they are stuck in a non-terminal
// status with a stale last_event_at.
//
// Body (all optional):
//   {
//     days:     7,    // treat parcels with last_event_at older than this as stale
//     limit:    500,  // max parcels to process per call (hard cap 2500)
//     delay_ms: 500,  // ms to wait between Voila API calls
//     dry_run:  false // if true, log candidates without calling the API
//   }
//
// Returns immediately: { queued: N, message: "..." }
// Progress is written to Railway logs.

router.post('/refresh-stale', async (req, res, next) => {
  try {
    const days    = Math.max(parseInt(req.body?.days)     || 7,    1);
    const limit   = Math.min(parseInt(req.body?.limit)    || 500,  2500);
    const delayMs = Math.min(parseInt(req.body?.delay_ms) || 500,  5000);
    const dryRun  = req.body?.dry_run === true;

    // Terminal statuses — parcels in these states are considered resolved and
    // should never be refreshed regardless of how old they are.
    const TERMINAL = `'delivered','returned','cancelled','tracking_expired'`;

    // Find stale non-terminal parcels that have Voila tracking credentials
    // stored on their linked shipment.  DISTINCT ON ensures each parcel
    // (consignment_number) appears only once even when multiple charge rows
    // exist for the same shipment.
    const { rows: candidates } = await query(`
      SELECT DISTINCT ON (p.consignment_number)
        p.id                             AS parcel_id,
        p.consignment_number,
        p.status                         AS current_status,
        p.last_event_at,
        s.id                             AS shipment_id,
        s.voila_tracking_request_id      AS track_req_id,
        s.voila_tracking_request_hash    AS track_req_hash,
        s.courier
      FROM   parcels  p
      JOIN   charges  ch ON ch.tracking_code = p.consignment_number
                        AND ch.charge_type   = 'courier'
                        AND ch.cancelled     = false
      JOIN   shipments s  ON s.id = ch.shipment_id
                        AND s.voila_tracking_request_id   IS NOT NULL
                        AND s.voila_tracking_request_hash IS NOT NULL
      WHERE  p.status NOT IN (${TERMINAL})
        AND  (
               p.last_event_at IS NULL
               OR p.last_event_at < NOW() - ($1 || ' days')::INTERVAL
             )
      ORDER  BY p.consignment_number, p.last_event_at ASC NULLS FIRST
      LIMIT  $2
    `, [days, limit]);

    if (!candidates.length) {
      return res.json({
        queued:  0,
        days,
        message: `No stale non-terminal parcels found (threshold: ${days} day(s)).`,
      });
    }

    res.json({
      queued:   candidates.length,
      days,
      dry_run:  dryRun,
      delay_ms: delayMs,
      message:  `Stale tracking refresh running in background for ${candidates.length} parcel(s) ` +
                `(>${days}d stale). Check Railway logs for progress.`,
    });

    // ── Background processing ─────────────────────────────────────────────────
    (async () => {
      let updated = 0, unchanged = 0, failed = 0, noData = 0;
      const errors = [];

      for (const row of candidates) {
        try {
          if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

          if (dryRun) {
            console.log(
              `[refresh-stale] DRY RUN: ${row.consignment_number} ` +
              `status=${row.current_status} last_event=${row.last_event_at?.toISOString() ?? 'null'}`
            );
            updated++;
            continue;
          }

          // Request the latest tracking snapshot from Voila
          const trackingData = await requestTrackingUpdate(
            row.track_req_id,
            row.track_req_hash
          );

          const parcels = trackingData?.data?.parcels;
          if (!Array.isArray(parcels) || !parcels.length) {
            noData++;
            console.log(`[refresh-stale] ⚠️  No parcel data returned for ${row.consignment_number}`);
            continue;
          }

          // Wrap in the synthetic envelope that normalisePayload expects
          const syntheticPayload = {
            tracking_update: {
              parcels,
              expected_delivery: trackingData.data.expected_delivery || null,
            },
            shipment: {
              id:      String(trackingData.data.shipment_id || row.shipment_id),
              courier: row.courier || null,
            },
          };

          const events = normalisePayload(syntheticPayload);
          let eventsStored = 0;

          for (const ev of events) {
            const result = await upsertEvent(ev, null);
            if (!result?.skipped && !result?.deduped && !result?.auto_cancelled) {
              eventsStored++;
            }
          }

          if (eventsStored > 0) {
            updated++;
            console.log(
              `[refresh-stale] ✅ ${row.consignment_number}: ` +
              `${eventsStored} new event(s) (was ${row.current_status})`
            );
          } else {
            unchanged++;
            console.log(
              `[refresh-stale] ⏳ ${row.consignment_number}: no new events — still ${row.current_status}`
            );
          }

        } catch (err) {
          failed++;
          errors.push({ consignment: row.consignment_number, error: err.message });
          console.error(`[refresh-stale] ❌ ${row.consignment_number}:`, err.message);
        }
      }

      console.log(
        `[refresh-stale] Complete — updated: ${updated}, unchanged: ${unchanged}, ` +
        `no_data: ${noData}, errors: ${failed}`
      );
      if (errors.length) {
        console.warn('[refresh-stale] First 20 errors:', JSON.stringify(errors.slice(0, 20)));
      }
    })().catch(err => console.error('[refresh-stale] Unhandled background error:', err.message));

  } catch (err) { next(err); }
});

export default router;
