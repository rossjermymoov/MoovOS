/**
 * Moov OS — Billing API
 *
 * POST /api/billing/webhook          — ingest shipment.created / shipment.cancelled
 * GET  /api/billing/charges          — paginated charges list with filters
 * GET  /api/billing/charges/stats    — summary counts and totals
 * PATCH /api/billing/charges/:id     — update billed / verified / cancelled flags
 * DELETE /api/billing/charges/:id    — soft-delete (cancel) a charge
 */

import express from 'express';
import { createHash } from 'crypto';
import { query } from '../db/index.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(obj, ...keys) {
  for (const k of keys) {
    const val = k.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj);
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return null;
}

function safeJson(str) {
  if (!str || typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch { return null; }
}

// ─── Tracking hash ────────────────────────────────────────────────────────────
// Belt-and-braces guard against tracking number recycling (couriers recycle
// numbers every 6–12 months).  We store a hash of (tracking_code + collection_date)
// so that a future duplicate tracking number on a different date is distinguishable.
// Format: SHA256(lower(code) + ':' + YYYY-MM-DD)  →  64-char hex string.
function computeTrackingHash(trackingCode, collectionDate) {
  if (!trackingCode) return null;
  const code = String(trackingCode).toLowerCase();
  const date = collectionDate ? String(collectionDate).slice(0, 10) : '';
  return createHash('sha256').update(`${code}:${date}`).digest('hex');
}

// Unwrap the platform envelope — handles body.json as object OR string
function unwrapPayload(body) {
  if (!body) return {};
  if (body.json) {
    if (typeof body.json === 'object') return body.json;
    const parsed = safeJson(body.json);
    if (parsed && typeof parsed === 'object') return parsed;
  }
  return body;
}

// Extract the request-shipment sub-document from any known payload shape.
// Tries every path: request.shipment (object or string), request_shipment (string or object).
function extractReqShipment(payload) {
  const candidates = [
    typeof payload.request?.shipment === 'object' ? payload.request.shipment : null,
    safeJson(payload.request?.shipment),
    safeJson(payload.request_shipment),
    typeof payload.request_shipment === 'object' ? payload.request_shipment : null,
  ];
  return candidates.find(c => c && typeof c === 'object') || {};
}

// Pull dc_service_id + service name + weight + account from payload — checks all known locations
function extractShipmentFields(payload) {
  const ship     = payload.shipment || {};
  const reqShip  = extractReqShipment(payload);
  const billing  = reqShip.billing || ship.billing || payload.billing || {};

  const accountNumber = ship.account_number
    || reqShip.account_number
    || payload.account_number
    || null;

  // customer_dc_id: set by API-connected customers (e.g. Europa) in the billing block
  // This is their identifier within the DC platform, not a Moov account number.
  const customerDcId = billing.customer_dc_id
    || reqShip.customer_dc_id
    || ship.customer_dc_id
    || null;

  const dcServiceId = reqShip.dc_service_id
    || ship.dc_service_id
    || payload.dc_service_id
    || null;

  const serviceName = ship.friendly_service_name
    || reqShip.friendly_service_name
    || reqShip.courier?.friendly_service_name
    || ship.service_name
    || null;

  const createParcels = ship.create_label_parcels || [];
  let totalWeightKg = createParcels.length
    ? createParcels.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0)
    : null;
  if (!totalWeightKg) {
    const reqParcels = reqShip.parcels || [];
    totalWeightKg = reqParcels.length
      ? reqParcels.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0)
      : parseFloat(reqShip._summed_total_weight) || null;
  }

  const parcelCount = ship.parcel_count
    || (reqShip.parcels || []).length
    || createParcels.length
    || 1;

  return { accountNumber, customerDcId, dcServiceId, serviceName, totalWeightKg, parcelCount, reqShip };
}

// ─── Rate card lookup ─────────────────────────────────────────────────────────
// Returns { rate: { price, cost_price?, zone_name, weight_class_name, rate_id }, reason: null }
// on success, or { rate: null, reason: 'Human-readable string' } on failure.
//
// Priority:
//   1. customer_service_pricing (new model) — carrier cost price + markup % or fixed fee
//   2. customer_rates (legacy) — explicit per-band sell prices

// rateCoversWeight — uses numeric bounds (from dc_weight_classes import) when
// available, falls back to text-band parsing via coversWeight().
function rateCoversWeight(rate, weightKg) {
  const minKg = parseFloat(rate.min_weight_kg);
  const maxKg = parseFloat(rate.max_weight_kg);
  if (!isNaN(minKg) && !isNaN(maxKg)) {
    // Numeric bounds: weight > min AND weight <= max (matching DC's own logic)
    return weightKg > minKg && weightKg <= maxKg;
  }
  // Fall back to text parsing for legacy rate rows without numeric bounds
  return coversWeight(rate.weight_class_name, weightKg);
}

// ── New model: customer_service_pricing ───────────────────────────────────────
// weight_bands columns: id, zone_id, carrier_rate_card_id, min_weight_kg,
//   max_weight_kg, price_first, price_sub  (no weight_class_name, no 'price')
async function lookupViaServicePricing(customerId, serviceCode, serviceName, weightKg) {
  const res = await query(`
    SELECT
      csp.pricing_type, csp.markup_pct, csp.fixed_fee,
      wb.price_first  AS cost_price,
      wb.price_sub    AS cost_price_sub,
      wb.min_weight_kg, wb.max_weight_kg,
      z.name          AS zone_name,
      wb.id           AS band_id
    FROM customer_service_pricing csp
    JOIN carrier_rate_cards crc ON crc.id = csp.carrier_rate_card_id
    JOIN courier_services   cs  ON cs.id  = csp.service_id
    JOIN zones              z   ON z.courier_service_id = cs.id
    JOIN weight_bands       wb  ON wb.zone_id = z.id
                                AND wb.carrier_rate_card_id = crc.id
    WHERE csp.customer_id = $1
      AND (
        cs.service_code ILIKE $2
        OR cs.name       ILIKE $3
        OR cs.name       ILIKE $4
      )
    ORDER BY z.name, wb.min_weight_kg NULLS LAST
  `, [customerId, serviceCode || '', serviceName || '', `%${(serviceName||'').split(' ').slice(0,3).join(' ')}%`]);

  if (!res.rows.length) return null; // no new-model pricing → fall through to legacy

  const rows = res.rows;

  const applyPricing = (row) => {
    const cost = parseFloat(row.cost_price || 0);
    if (row.pricing_type === 'fixed_fee') return cost + parseFloat(row.fixed_fee || 0);
    return cost * (1 + parseFloat(row.markup_pct || 0) / 100);
  };

  const bandLabel = (r) => r.min_weight_kg != null
    ? `${r.min_weight_kg}–${r.max_weight_kg} kg`
    : 'All weights';

  if (weightKg != null) {
    const matching = rows.filter(r => rateCoversWeight(r, weightKg));
    if (matching.length >= 1) {
      const r = matching[0];
      return { rate: {
        price: Math.round(applyPricing(r) * 10000) / 10000,
        cost_price: parseFloat(r.cost_price || 0),
        zone_name: r.zone_name,
        weight_class_name: bandLabel(r),
        rate_id: r.band_id,
        pricing_type: r.pricing_type,
        markup_pct: r.markup_pct,
        fixed_fee: r.fixed_fee,
      }, reason: null };
    }
    return { rate: null, reason: `No weight band covers ${Math.round(weightKg * 1000) / 1000} kg` };
  }

  // No weight — if there's exactly one band (or one catch-all) use it
  if (rows.length === 1) {
    const r = rows[0];
    return { rate: {
      price: Math.round(applyPricing(r) * 10000) / 10000,
      cost_price: parseFloat(r.cost_price || 0),
      zone_name: r.zone_name,
      weight_class_name: bandLabel(r),
      rate_id: r.band_id,
      pricing_type: r.pricing_type,
    }, reason: null };
  }

  return { rate: null, reason: 'Multiple weight bands — no parcel weight to select one' };
}

// ── Legacy model: customer_rates ──────────────────────────────────────────────
async function lookupViaCustomerRates(customerId, serviceCode, serviceName, weightKg) {
  const rateRes = await query(`
    SELECT
      cr.id, cr.price, cr.zone_name, cr.weight_class_name,
      cr.service_code, cr.service_name,
      cr.min_weight_kg, cr.max_weight_kg
    FROM customer_rates cr
    WHERE cr.customer_id = $1
      AND (
        cr.service_code ILIKE $2
        OR cr.service_name ILIKE $3
        OR cr.service_name ILIKE $4
      )
    ORDER BY cr.zone_name, cr.min_weight_kg NULLS LAST, cr.weight_class_name
  `, [customerId, serviceCode || '', serviceName || '', `%${(serviceName||'').split(' ').slice(0,3).join(' ')}%`]);

  if (!rateRes.rows.length) {
    const any = await query(
      'SELECT COUNT(*)::int AS cnt FROM customer_rates WHERE customer_id = $1',
      [customerId]
    );
    const reason = any.rows[0].cnt === 0
      ? 'No pricing set up for customer'
      : `Service not matched (${serviceCode || serviceName || 'unknown'})`;
    return { rate: null, reason };
  }

  const rates = rateRes.rows;

  if (weightKg != null) {
    const matching = rates.filter(r => rateCoversWeight(r, weightKg));
    if (matching.length >= 1) {
      return { rate: { price: parseFloat(matching[0].price), zone_name: matching[0].zone_name,
                       weight_class_name: matching[0].weight_class_name, rate_id: matching[0].id }, reason: null };
    }
    // Last resort: if all bands have non-numeric names (e.g. "Parcel", "Standard")
    // and there's exactly one row for the service, treat it as a catch-all — the
    // carrier's weight limit is baked into the service itself, not the band name.
    const allNonNumeric = rates.every(r => {
      const s = normaliseWeightBand(r.weight_class_name);
      return !s || !/\d/.test(s); // no digits → catch-all name like "Parcel"
    });
    if (allNonNumeric && rates.length === 1) {
      const r = rates[0];
      return { rate: { price: parseFloat(r.price), zone_name: r.zone_name,
                       weight_class_name: r.weight_class_name, rate_id: r.id }, reason: null };
    }
    // Diagnose
    const hasNumericBounds = rates.some(r => r.min_weight_kg != null);
    const hasUnrecognised  = !hasNumericBounds && rates.some(r => {
      const s = normaliseWeightBand(r.weight_class_name);
      return s && /\d/.test(s)   // has digits but matches no known pattern
                && !s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/)
                && !s.match(/^(\d+(?:\.\d+)?)\+$/)
                && !s.match(/^OVER(\d+(?:\.\d+)?)$/)
                && !s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)$/)
                && !s.match(/^(?:UPTO|MAX)(\d+(?:\.\d+)?)$/)
                && !s.match(/^(\d+(?:\.\d+)?)$/);
    });
    const reason = hasUnrecognised
      ? 'Unrecognised weight band format'
      : `No weight band covers ${Math.round(weightKg * 1000) / 1000} kg`;
    return { rate: null, reason };
  }

  if (rates.length === 1) {
    return { rate: { price: parseFloat(rates[0].price), zone_name: rates[0].zone_name,
                     weight_class_name: rates[0].weight_class_name, rate_id: rates[0].id }, reason: null };
  }

  return { rate: null, reason: 'Multiple rates — no parcel weight to select band' };
}

// ── Main lookup — tries new model first, falls back to legacy ─────────────────
async function lookupRateWithReason(customerId, serviceCode, serviceName, weightKg) {
  if (!customerId) return { rate: null, reason: 'No matching customer' };

  // 1. Try new markup/fee model
  const newResult = await lookupViaServicePricing(customerId, serviceCode, serviceName, weightKg);
  if (newResult !== null) return newResult;

  // 2. Fall back to legacy per-band customer_rates
  return lookupViaCustomerRates(customerId, serviceCode, serviceName, weightKg);
}

// Backwards-compat shim used by the debug endpoint
async function lookupRate(customerId, serviceCode, serviceName, weightKg) {
  const { rate } = await lookupRateWithReason(customerId, serviceCode, serviceName, weightKg);
  return rate;
}

function normaliseWeightBand(rawName) {
  // Uppercase + strip all whitespace, then strip the unit suffix in order from
  // longest to shortest so "KILOGRAMS" doesn't leave a trailing "S" etc.
  // Returns a pure-numeric / operator string, e.g. "UPTO30", "0-30", "30+"
  let s = (rawName || '').toUpperCase().replace(/\s/g, '');
  s = s.replace(/KILOGRAMS$/, '')
       .replace(/KILOGRAM$/, '')
       .replace(/KGS$/, '')
       .replace(/KG$/, '')
       .replace(/K$/, '');
  return s;
}

function coversWeight(weightClassName, weightKg) {
  if (!weightClassName) return false;
  const s = normaliseWeightBand(weightClassName);

  // Range: "0-30", "1-2.5"
  const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (range) {
    const lo = parseFloat(range[1]), hi = parseFloat(range[2]);
    return weightKg > lo && weightKg <= hi;
  }

  // Minimum (open upper bound): "5+", "OVER5"
  const plus = s.match(/^(\d+(?:\.\d+)?)\+$/) || s.match(/^OVER(\d+(?:\.\d+)?)$/);
  if (plus) return weightKg > parseFloat(plus[1]);

  // Maximum exclusive: "UNDER5", "<5"
  const under = s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)$/);
  if (under) return weightKg < parseFloat(under[1]);

  // Maximum inclusive: "UPTO30", "MAX30"
  // Covers "up to 30 kilograms", "upto30kg", "max 30 kg" etc.
  const upto = s.match(/^(?:UPTO|MAX)(\d+(?:\.\d+)?)$/);
  if (upto) return weightKg <= parseFloat(upto[1]);

  // Bare number: "30" — interpret as an upper bound (weight must be ≤ X)
  const bare = s.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return weightKg <= parseFloat(bare[1]);

  return false;
}

// ─── POST /api/billing/webhook ────────────────────────────────────────────────

router.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Empty payload' });

    // Unwrap platform wrapper (handles body.json as object or string)
    const payload = unwrapPayload(body);
    const eventType = payload.event_type || payload.event || payload.type || '';

    // ── Guard: only process shipment lifecycle events ─────────────────────────
    // Tracking webhooks (event_type = 'tracking.update', 'parcel.tracking', etc.)
    // must go to /api/tracking/webhook — not here.
    const SHIPMENT_EVENTS = new Set([
      'shipment.created', 'shipment.cancelled', 'shipment.deleted', 'shipment.updated',
    ]);
    const TRACKING_KEYWORDS = ['tracking', 'parcel.scan', 'delivery_update', 'status_update'];
    const lowerEvent = eventType.toLowerCase();
    const isTrackingEvent = TRACKING_KEYWORDS.some(k => lowerEvent.includes(k));

    if (isTrackingEvent) {
      return res.json({ ok: true, action: 'skipped', reason: `tracking event "${eventType}" ignored — use /api/tracking/webhook` });
    }

    // If there's an explicit event_type we don't recognise as a shipment event, skip it
    if (eventType && !SHIPMENT_EVENTS.has(eventType)) {
      return res.json({ ok: true, action: 'skipped', reason: `unrecognised event_type "${eventType}"` });
    }

    // ── Cancellation ──────────────────────────────────────────────────────────
    if (eventType === 'shipment.cancelled' || eventType === 'shipment.deleted') {
      const shipment = payload.shipment || {};
      const platformId = shipment.id;
      if (!platformId) return res.json({ ok: true, action: 'skipped', reason: 'no shipment id' });

      await query(`
        UPDATE shipments
        SET cancelled = true, cancelled_at = NOW(), updated_at = NOW()
        WHERE platform_shipment_id = $1
      `, [platformId]);

      await query(`
        UPDATE charges
        SET cancelled = true, updated_at = NOW()
        WHERE shipment_id = (
          SELECT id FROM shipments WHERE platform_shipment_id = $1
        )
      `, [platformId]);

      return res.json({ ok: true, action: 'cancelled', platform_shipment_id: platformId });
    }

    // ── Created ───────────────────────────────────────────────────────────────
    const shipment       = payload.shipment || {};
    const responseParsed = safeJson(payload.response) || {};
    const billingResp    = responseParsed.billing || {};

    // Use consolidated extractor — handles all known payload shapes
    const { accountNumber, customerDcId, dcServiceId, serviceName, totalWeightKg, parcelCount, reqShip: reqShipment }
      = extractShipmentFields(payload);

    const platformId     = shipment.id;
    const accountName    = shipment.account_name   || reqShipment.account_name;
    const courier        = shipment.courier        || reqShipment.courier;
    const reference      = shipment.reference      || reqShipment.reference;
    const reference2     = shipment.reference_2    || reqShipment.reference_2;
    const shipToPostcode = shipment.ship_to_postcode;
    const shipToName     = shipment.ship_to_name;
    const shipToCountry  = shipment.ship_to_country_iso;
    const collectionDate = shipment.collection_date ? shipment.collection_date.split('T')[0] : null;

    const weightPerParcel = parcelCount > 0 && totalWeightKg ? totalWeightKg / parcelCount : totalWeightKg;

    // Tracking codes
    const createParcels = shipment.create_label_parcels || [];
    const trackingCodes = createParcels.length
      ? createParcels.map(p => p.tracking_code).filter(Boolean)
      : (responseParsed.tracking_codes || []);

    // Tracking hash — primary tracking code + collection date
    // Belt-and-braces guard against courier recycling tracking numbers (every 6–12 months)
    const primaryTrackingCode = trackingCodes[0] || null;
    const trackingHashVal = computeTrackingHash(primaryTrackingCode, collectionDate);

    // Courier costs (what Moov pays) per parcel
    const courierCosts = billingResp.shipping || [];
    const totalCostPrice = courierCosts.reduce((s, c) => s + (parseFloat(c) || 0), 0);

    // Resolve customer:
    //  1. account_number → customers.account_number   (standard webhook customers)
    //  2. account_number → customers.dc_customer_id   (if acct number happens to be a DC ID)
    //  3. customerDcId  → customers.dc_customer_id    (API customers like Europa — from billing.customer_dc_id)
    let customerId = null;
    if (accountNumber) {
      const cr = await query('SELECT id FROM customers WHERE account_number = $1', [accountNumber]);
      if (cr.rows.length) {
        customerId = cr.rows[0].id;
      } else {
        const cr2 = await query('SELECT id FROM customers WHERE dc_customer_id = $1', [accountNumber]);
        if (cr2.rows.length) customerId = cr2.rows[0].id;
      }
    }
    if (!customerId && customerDcId) {
      const cr3 = await query('SELECT id FROM customers WHERE dc_customer_id = $1', [customerDcId]);
      if (cr3.rows.length) customerId = cr3.rows[0].id;
    }

    // Effective account identifier to store — prefer accountNumber, fall back to customerDcId
    // so the relink-customers endpoint can find unlinked shipments later.
    const effectiveAccount = accountNumber || customerDcId || null;

    // Upsert shipment
    const shipRes = await query(`
      INSERT INTO shipments
        (platform_shipment_id, event_type,
         customer_id, customer_account, customer_name,
         courier, dc_service_id, service_name,
         ship_to_name, ship_to_postcode, ship_to_country_iso,
         reference, reference_2,
         parcel_count, total_weight_kg, collection_date, tracking_codes,
         tracking_hash,
         raw_payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (platform_shipment_id) DO UPDATE SET
        customer_id        = COALESCE(EXCLUDED.customer_id, shipments.customer_id),
        customer_account   = COALESCE(EXCLUDED.customer_account, shipments.customer_account),
        service_name       = COALESCE(EXCLUDED.service_name, shipments.service_name),
        tracking_codes     = COALESCE(EXCLUDED.tracking_codes, shipments.tracking_codes),
        tracking_hash      = COALESCE(EXCLUDED.tracking_hash, shipments.tracking_hash),
        updated_at         = NOW()
      RETURNING id
    `, [
      platformId || null, eventType,
      customerId, effectiveAccount, accountName,
      courier, dcServiceId, serviceName,
      shipToName, shipToPostcode, shipToCountry,
      reference, reference2,
      parcelCount, totalWeightKg || null, collectionDate,
      trackingCodes.length ? trackingCodes : null,
      trackingHashVal,
      JSON.stringify(payload),
    ]);

    const shipmentId = shipRes.rows[0].id;

    // Skip creating a charge if one already exists for this shipment
    const existingCharge = await query(
      'SELECT id FROM charges WHERE shipment_id = $1 AND charge_type = $2',
      [shipmentId, 'courier']
    );
    if (existingCharge.rows.length) {
      return res.json({ ok: true, action: 'duplicate', shipment_id: shipmentId });
    }

    // Look up rate card
    const { rate, reason: priceFailReason } = await lookupRateWithReason(customerId, dcServiceId, serviceName, weightPerParcel);
    const unitPrice  = rate ? rate.price : null;
    const totalPrice = unitPrice != null ? parseFloat((unitPrice * parcelCount).toFixed(2)) : null;

    // Insert charge
    const chargeRes = await query(`
      INSERT INTO charges
        (shipment_id, customer_id, charge_type,
         order_id, parcel_qty, service_name,
         price, cost_price,
         zone_name, weight_class_name, rate_id, price_auto,
         price_failure_reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id
    `, [
      shipmentId, customerId, 'courier',
      reference, parcelCount, serviceName,
      totalPrice,
      totalCostPrice > 0 ? parseFloat(totalCostPrice.toFixed(2)) : null,
      rate?.zone_name || null,
      rate?.weight_class_name || null,
      rate?.rate_id || null,
      rate != null,
      rate ? null : priceFailReason,
    ]);

    res.json({
      ok: true,
      action: 'created',
      shipment_id: shipmentId,
      charge_id:   chargeRes.rows[0].id,
      price:       totalPrice,
      price_auto:  rate != null,
    });

  } catch (err) { next(err); }
});

// ─── POST /api/billing/purge-tracking-events ─────────────────────────────────
// Remove charges + shipments that were created by tracking webhooks
// (not by shipment.created). Identified by event_type != 'shipment.created'
// or by raw_payload containing no request_shipment / no dc_service_id signal.

router.post('/purge-tracking-events', async (req, res, next) => {
  try {
    // Delete charges where the linked shipment has an event_type that is not a shipment lifecycle event
    const result = await query(`
      WITH bad_shipments AS (
        SELECT s.id
        FROM shipments s
        WHERE s.event_type IS NOT NULL
          AND s.event_type NOT IN ('shipment.created', 'shipment.updated', 'shipment.cancelled', 'shipment.deleted', '')
      ),
      deleted_charges AS (
        DELETE FROM charges
        WHERE shipment_id IN (SELECT id FROM bad_shipments)
        RETURNING id
      ),
      deleted_shipments AS (
        DELETE FROM shipments
        WHERE id IN (SELECT id FROM bad_shipments)
        RETURNING id
      )
      SELECT
        (SELECT COUNT(*) FROM deleted_charges)  AS charges_deleted,
        (SELECT COUNT(*) FROM deleted_shipments) AS shipments_deleted
    `);

    const { charges_deleted, shipments_deleted } = result.rows[0];
    res.json({ ok: true, charges_deleted: parseInt(charges_deleted), shipments_deleted: parseInt(shipments_deleted) });
  } catch (err) { next(err); }
});

// ─── POST /api/billing/relink-customers ──────────────────────────────────────
// For every shipment where customer_id is NULL, re-attempt customer resolution
// using the stored customer_account field — trying account_number first, then
// dc_customer_id as a fallback (for API-connected customers like Europa).
// Also back-fills the linked charges table.

router.post('/relink-customers', async (req, res, next) => {
  try {
    const unlinked = await query(`
      SELECT s.id AS shipment_id, s.customer_account,
             c.id AS charge_id
      FROM shipments s
      LEFT JOIN charges c ON c.shipment_id = s.id
      WHERE s.customer_id IS NULL
        AND s.customer_account IS NOT NULL
      ORDER BY s.created_at ASC
    `);

    let linked = 0;
    let not_found = 0;

    for (const row of unlinked.rows) {
      const acct = row.customer_account;

      // Try account_number first
      let cr = await query('SELECT id FROM customers WHERE account_number = $1', [acct]);
      let customerId = cr.rows[0]?.id || null;

      // Fall back to dc_customer_id
      if (!customerId) {
        const cr2 = await query('SELECT id FROM customers WHERE dc_customer_id = $1', [acct]);
        customerId = cr2.rows[0]?.id || null;
      }

      if (!customerId) { not_found++; continue; }

      await query(
        `UPDATE shipments SET customer_id = $1, updated_at = NOW() WHERE id = $2 AND customer_id IS NULL`,
        [customerId, row.shipment_id]
      );
      if (row.charge_id) {
        await query(
          `UPDATE charges SET customer_id = $1, updated_at = NOW() WHERE id = $2 AND customer_id IS NULL`,
          [customerId, row.charge_id]
        );
      }
      linked++;
    }

    res.json({ ok: true, total_unlinked: unlinked.rows.length, linked, not_found });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/aged-alerts ────────────────────────────────────
// Verified, unbilled charges older than :days days, excluding manual-billing customers.

router.get('/charges/aged-alerts', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '14');
    const r = await query(`
      SELECT
        c.id, c.created_at, c.order_id, c.parcel_qty, c.service_name,
        c.price, c.vat_amount, c.verified,
        cu.id   AS customer_id,
        cu.business_name AS customer_name,
        cu.account_number AS customer_account,
        s.courier, s.ship_to_postcode, s.reference, s.tracking_codes,
        EXTRACT(DAY FROM NOW() - c.created_at)::int AS age_days
      FROM charges c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN shipments  s  ON s.id  = c.shipment_id
      WHERE c.verified  = true
        AND c.billed    = false
        AND c.cancelled = false
        AND c.created_at < NOW() - ($1 || ' days')::INTERVAL
        AND (cu.manual_billing IS NULL OR cu.manual_billing = false)
      ORDER BY c.created_at ASC
    `, [days]);

    res.json({ alerts: r.rows, days, count: r.rows.length });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/stats ──────────────────────────────────────────

router.get('/charges/stats', async (req, res, next) => {
  try {
    const { customer_id, date_from, date_to } = req.query;
    const conds = ["c.charge_type = 'courier'", 'c.cancelled = false'];
    const vals  = [];
    let   idx   = 1;
    if (customer_id) { conds.push(`c.customer_id = $${idx++}`); vals.push(customer_id); }
    if (date_from)   { conds.push(`c.created_at >= $${idx++}`); vals.push(date_from); }
    if (date_to)     { conds.push(`c.created_at <  $${idx++}`); vals.push(date_to); }
    const where = `WHERE ${conds.join(' AND ')}`;

    const r = await query(`
      SELECT
        COUNT(*)::int                              AS total_charges,
        SUM(CASE WHEN c.price IS NULL THEN 1 ELSE 0 END)::int AS unpriced,
        SUM(CASE WHEN c.billed  THEN 1 ELSE 0 END)::int AS billed,
        SUM(CASE WHEN NOT c.billed AND c.price IS NOT NULL THEN 1 ELSE 0 END)::int AS pending,
        COALESCE(SUM(c.price), 0)::numeric(12,2)  AS total_value,
        COALESCE(SUM(CASE WHEN NOT c.billed THEN c.price ELSE 0 END), 0)::numeric(12,2) AS unbilled_value
      FROM charges c
      ${where}
    `, vals);

    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges ─────────────────────────────────────────────────

router.get('/charges', async (req, res, next) => {
  try {
    const {
      charge_type = 'courier',
      customer_id, search,
      billed, verified, cancelled,
      date_from, date_to,
      limit = 50, offset = 0,
    } = req.query;

    const conds = [`c.charge_type = $1`];
    const vals  = [charge_type];
    let   idx   = 2;

    if (customer_id) { conds.push(`c.customer_id = $${idx++}`); vals.push(customer_id); }
    if (billed   !== undefined) { conds.push(`c.billed    = $${idx++}`); vals.push(billed   === 'true'); }
    if (verified !== undefined) { conds.push(`c.verified  = $${idx++}`); vals.push(verified === 'true'); }
    if (cancelled !== undefined) { conds.push(`c.cancelled = $${idx++}`); vals.push(cancelled === 'true'); }
    else { conds.push('c.cancelled = false'); }
    if (date_from) { conds.push(`c.created_at >= $${idx++}`); vals.push(date_from); }
    if (date_to)   { conds.push(`c.created_at <  $${idx++}`); vals.push(date_to); }
    if (search) {
      conds.push(`(
        cu.business_name ILIKE $${idx} OR cu.account_number ILIKE $${idx} OR
        c.order_id ILIKE $${idx} OR c.service_name ILIKE $${idx}
      )`);
      vals.push(`%${search}%`);
      idx++;
    }

    const where = `WHERE ${conds.join(' AND ')}`;

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT
          c.id, c.created_at, c.order_id, c.parcel_qty, c.service_name,
          c.price, c.vat_amount, c.cost_price,
          c.zone_name, c.weight_class_name, c.price_auto,
          c.price_failure_reason,
          c.billed, c.verified, c.cancelled, c.charge_type,
          cu.business_name  AS customer_name,
          cu.account_number AS customer_account,
          cu.id    AS customer_id,
          s.courier, s.ship_to_postcode, s.ship_to_name,
          s.reference, s.reference_2, s.tracking_codes, s.parcel_count
        FROM charges c
        LEFT JOIN customers cu ON cu.id = c.customer_id
        LEFT JOIN shipments  s  ON s.id  = c.shipment_id
        ${where}
        ORDER BY c.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...vals, parseInt(limit), parseInt(offset)]),

      query(`
        SELECT COUNT(*)::int AS total FROM charges c
        LEFT JOIN customers cu ON cu.id = c.customer_id
        ${where}
      `, vals),
    ]);

    res.json({
      charges: dataRes.rows,
      total:   countRes.rows[0].total,
      limit:   parseInt(limit),
      offset:  parseInt(offset),
    });
  } catch (err) { next(err); }
});

// ─── POST /api/billing/batch-reprice ─────────────────────────────────────────
// Re-price every unpriced charge by re-parsing its raw_payload.
// Returns a summary: { total, priced, skipped, errors, no_customer, no_rate }

router.post('/batch-reprice', async (req, res, next) => {
  try {
    const charges = await query(`
      SELECT c.id AS charge_id, c.customer_id, c.parcel_qty,
             s.id AS shipment_id,
             s.dc_service_id, s.service_name AS s_service_name,
             s.total_weight_kg, s.parcel_count,
             s.customer_account, s.raw_payload
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.price IS NULL
        AND c.cancelled = false
      ORDER BY c.created_at ASC
    `);

    const summary = {
      total:       charges.rows.length,
      priced:      0,
      no_customer: 0,
      no_rate:     0,
      errors:      0,
    };

    for (const row of charges.rows) {
      try {
        // Re-parse raw_payload using consolidated extractor
        const rawPayload = typeof row.raw_payload === 'string'
          ? safeJson(row.raw_payload) || {}
          : (row.raw_payload || {});
        const innerPayload = unwrapPayload(rawPayload);
        const extracted = extractShipmentFields(innerPayload);

        // Resolve customer: account_number → dc_customer_id → billing.customer_dc_id
        let customerId = row.customer_id;
        if (!customerId) {
          const acctNum = row.customer_account || extracted.accountNumber;
          if (acctNum) {
            const cr = await query('SELECT id FROM customers WHERE account_number = $1', [acctNum]);
            if (cr.rows.length) {
              customerId = cr.rows[0].id;
            } else {
              const cr2 = await query('SELECT id FROM customers WHERE dc_customer_id = $1', [acctNum]);
              if (cr2.rows.length) customerId = cr2.rows[0].id;
            }
          }
          // Also try the explicit customerDcId from billing block (Europa-style API customers)
          if (!customerId && extracted.customerDcId) {
            const cr3 = await query('SELECT id FROM customers WHERE dc_customer_id = $1', [extracted.customerDcId]);
            if (cr3.rows.length) customerId = cr3.rows[0].id;
          }
        }

        if (!customerId) {
          summary.no_customer++;
          await query(`UPDATE charges SET price_failure_reason = $1, updated_at = NOW() WHERE id = $2`,
            ['No matching customer', row.charge_id]);
          continue;
        }

        const dcServiceId = row.dc_service_id || extracted.dcServiceId;
        const serviceName = row.s_service_name || extracted.serviceName;

        // Weight — stored column first, then from payload
        let totalWt = parseFloat(row.total_weight_kg) || extracted.totalWeightKg || null;
        const parcelQty = row.parcel_qty || row.parcel_count || extracted.parcelCount || 1;
        const weightPerParcel = parcelQty > 0 && totalWt ? totalWt / parcelQty : totalWt;

        // Back-fill customer + service fields on shipment/charge if missing
        if (!row.customer_id && customerId) {
          await query(`
            UPDATE shipments
            SET customer_id   = $1,
                dc_service_id = COALESCE(dc_service_id, $2),
                service_name  = COALESCE(service_name,  $3),
                updated_at    = NOW()
            WHERE id = $4
          `, [customerId, dcServiceId || null, serviceName || null, row.shipment_id]);
          await query(
            `UPDATE charges SET customer_id = $1, updated_at = NOW() WHERE id = $2`,
            [customerId, row.charge_id]
          );
        }

        // Look up rate with reason
        const { rate, reason: failReason } = await lookupRateWithReason(customerId, dcServiceId, serviceName, weightPerParcel);
        if (!rate) {
          summary.no_rate++;
          await query(`UPDATE charges SET price_failure_reason = $1, updated_at = NOW() WHERE id = $2`,
            [failReason, row.charge_id]);
          continue;
        }

        const totalPrice = parseFloat((rate.price * parcelQty).toFixed(2));

        await query(`
          UPDATE charges
          SET price                 = $1,
              zone_name             = $2,
              weight_class_name     = $3,
              rate_id               = $4,
              price_auto            = true,
              price_failure_reason  = NULL,
              updated_at            = NOW()
          WHERE id = $5
        `, [totalPrice, rate.zone_name, rate.weight_class_name, rate.rate_id, row.charge_id]);

        summary.priced++;
      } catch (err) {
        summary.errors++;
      }
    }

    res.json(summary);
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/:id/debug ──────────────────────────────────────
// Step-by-step trace of why a charge did or did not get a price.

router.get('/charges/:id/debug', async (req, res, next) => {
  try {
    const { id } = req.params;

    const r = await query(`
      SELECT
        c.id, c.customer_id, c.service_name AS c_service_name,
        c.zone_name, c.weight_class_name,
        c.price, c.price_auto, c.rate_id, c.order_id, c.parcel_qty,
        s.platform_shipment_id,
        s.customer_account, s.customer_name AS s_customer_name,
        s.courier, s.dc_service_id, s.service_name AS s_service_name,
        s.total_weight_kg, s.parcel_count,
        s.raw_payload
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.id = $1
    `, [id]);

    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    const row = r.rows[0];

    const trace = {
      charge_id: id,
      order_id: row.order_id,
      stored_price: row.price,
      stored_price_auto: row.price_auto,
      stored_zone: row.zone_name,
      stored_weight_class: row.weight_class_name,
      steps: [],
    };

    // Step 1: Payload extraction
    const payload = (typeof row.raw_payload === 'string')
      ? safeJson(row.raw_payload) || {}
      : (row.raw_payload || {});
    const shipment    = payload.shipment    || {};
    const request     = payload.request     || {};
    // request_shipment may arrive as a top-level stringified JSON field
    const reqShipment = request.shipment || safeJson(payload.request_shipment) || {};

    const accountNumber = shipment.account_number || reqShipment.account_number;
    const dcServiceId   = reqShipment.dc_service_id || shipment.dc_service_id || row.dc_service_id;
    const serviceName   = shipment.friendly_service_name || reqShipment.friendly_service_name || row.s_service_name;
    const parcelCount   = shipment.parcel_count || (reqShipment.parcels || []).length || row.parcel_qty || 1;

    const createParcels = shipment.create_label_parcels || [];
    let totalWeightKg = createParcels.length
      ? createParcels.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0)
      : parseFloat(reqShipment._summed_total_weight) || null;
    if (!totalWeightKg && row.total_weight_kg) totalWeightKg = parseFloat(row.total_weight_kg);
    const weightPerParcel = parcelCount > 0 && totalWeightKg ? totalWeightKg / parcelCount : totalWeightKg;

    trace.steps.push({
      step: 1,
      title: 'Webhook payload extraction',
      account_number: accountNumber || null,
      dc_service_id: dcServiceId || null,
      service_name: serviceName || null,
      parcel_count: parcelCount,
      total_weight_kg: totalWeightKg,
      weight_per_parcel_kg: weightPerParcel != null ? Math.round(weightPerParcel * 1000) / 1000 : null,
    });

    // Step 2: Customer resolution — try account_number then dc_customer_id
    let customerId = null;
    let customerName = null;
    let resolvedVia = null;
    if (accountNumber) {
      const cr = await query(
        'SELECT id, business_name FROM customers WHERE account_number = $1',
        [accountNumber]
      );
      if (cr.rows.length) {
        customerId   = cr.rows[0].id;
        customerName = cr.rows[0].business_name;
        resolvedVia  = 'account_number';
      } else {
        // API customers send their DC customer ID (e.g. "Europa") as the account identifier
        const cr2 = await query(
          'SELECT id, business_name FROM customers WHERE dc_customer_id = $1',
          [accountNumber]
        );
        if (cr2.rows.length) {
          customerId   = cr2.rows[0].id;
          customerName = cr2.rows[0].business_name;
          resolvedVia  = 'dc_customer_id';
        }
      }
    }
    // Fall back to stored customer_id if payload resolution failed
    if (!customerId && row.customer_id) customerId = row.customer_id;

    trace.steps.push({
      step: 2,
      title: 'Customer resolution',
      account_number_used: accountNumber || null,
      customer_found: !!customerId,
      customer_id: customerId,
      customer_name: customerName,
      resolved_via: resolvedVia,
      note: !accountNumber
        ? 'No account_number in webhook payload'
        : !customerId
          ? `No customer matched account_number or dc_customer_id "${accountNumber}"`
          : null,
    });

    if (!customerId) {
      trace.conclusion = {
        priced: false,
        reason: 'Customer not resolved — account_number missing from webhook payload or not matched in the customers table',
        fix: 'Ensure the customer\'s Account Number field in Moov OS matches the account_number sent in the webhook',
      };
      return res.json(trace);
    }

    // Step 3: Service match in customer_rates
    const partialName = `%${(serviceName || '').split(' ').slice(0, 3).join(' ')}%`;
    const rateRes = await query(`
      SELECT cr.id, cr.price, cr.zone_name, cr.weight_class_name,
             cr.service_code, cr.service_name
      FROM customer_rates cr
      WHERE cr.customer_id = $1
        AND (
          cr.service_code ILIKE $2
          OR cr.service_name ILIKE $3
          OR cr.service_name ILIKE $4
        )
      ORDER BY cr.zone_name, cr.weight_class_name
    `, [customerId, dcServiceId || '', serviceName || '', partialName]);

    // Also count total rates for this customer (for context)
    const totalRates = await query(
      'SELECT COUNT(*)::int AS cnt FROM customer_rates WHERE customer_id = $1',
      [customerId]
    );

    trace.steps.push({
      step: 3,
      title: 'customer_rates service match',
      query: {
        customer_id: customerId,
        service_code_ilike: dcServiceId || '',
        service_name_ilike: serviceName || '',
        service_name_partial_ilike: partialName,
      },
      total_rates_for_customer: totalRates.rows[0].cnt,
      rows_matched: rateRes.rows.length,
      rows: rateRes.rows.map(r => ({
        id: r.id,
        service_code: r.service_code,
        service_name: r.service_name,
        zone_name: r.zone_name,
        weight_class_name: r.weight_class_name,
        price: r.price,
      })),
    });

    if (!rateRes.rows.length) {
      trace.conclusion = {
        priced: false,
        reason: `No customer_rates rows matched for this customer. Service code "${dcServiceId}", service name "${serviceName}".`,
        fix: totalRates.rows[0].cnt === 0
          ? 'No pricing set up at all for this customer — add rates in the customer\'s Pricing tab'
          : `Rates exist but none match the service. Check that service_code or service_name in customer_rates matches "${dcServiceId}" / "${serviceName}"`,
      };
      return res.json(trace);
    }

    // Step 4: Weight band matching
    const weightChecks = rateRes.rows.map(r => {
      if (!r.weight_class_name) {
        return { ...r, covers_weight: false, note: 'No weight class name on this rate row' };
      }
      if (weightPerParcel == null) {
        return { ...r, covers_weight: false, note: 'No parcel weight available in webhook to match against' };
      }

      const s = r.weight_class_name.toUpperCase().replace(/\s/g, '');
      const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)KG?$/);
      const plus  = s.match(/^(\d+(?:\.\d+)?)\+KG?$/) || s.match(/^OVER(\d+(?:\.\d+)?)KG?$/);
      const under = s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)KG?$/);

      let covers = false;
      let note   = '';

      if (range) {
        const lo = parseFloat(range[1]), hi = parseFloat(range[2]);
        covers = weightPerParcel > lo && weightPerParcel <= hi;
        note   = `Range ${lo}–${hi} kg, parcel is ${weightPerParcel} kg → ${covers ? '✓ MATCH' : '✗ no match'}`;
      } else if (plus) {
        const min = parseFloat(plus[1]);
        covers = weightPerParcel > min;
        note   = `Over ${min} kg, parcel is ${weightPerParcel} kg → ${covers ? '✓ MATCH' : '✗ no match'}`;
      } else if (under) {
        const max = parseFloat(under[1]);
        covers = weightPerParcel < max;
        note   = `Under ${max} kg, parcel is ${weightPerParcel} kg → ${covers ? '✓ MATCH' : '✗ no match'}`;
      } else {
        note = `⚠ Unrecognised format "${r.weight_class_name}" — expected e.g. "0-1KG", "OVER5KG", "UNDER2KG"`;
      }

      return {
        rate_id: r.id,
        zone_name: r.zone_name,
        weight_class_name: r.weight_class_name,
        price: r.price,
        covers_weight: covers,
        note,
      };
    });

    const matching = weightChecks.filter(w => w.covers_weight);

    trace.steps.push({
      step: 4,
      title: 'Weight band matching',
      weight_per_parcel_kg: weightPerParcel,
      checks: weightChecks,
      matching_count: matching.length,
    });

    // Conclusion
    if (matching.length >= 1) {
      trace.conclusion = {
        priced: true,
        price: parseFloat(matching[0].price),
        zone_name: matching[0].zone_name,
        weight_class_name: matching[0].weight_class_name,
        note: matching.length > 1
          ? `${matching.length} bands matched — used first (${matching[0].zone_name})`
          : 'Single exact band match',
      };
    } else if (weightPerParcel == null && rateRes.rows.length === 1) {
      trace.conclusion = {
        priced: true,
        price: parseFloat(rateRes.rows[0].price),
        zone_name: rateRes.rows[0].zone_name,
        weight_class_name: rateRes.rows[0].weight_class_name,
        note: 'No weight in webhook but only one rate row — used it directly',
      };
    } else {
      const hasUnrecognised = weightChecks.some(c => c.note?.includes('Unrecognised'));
      const noWeight        = weightPerParcel == null;
      trace.conclusion = {
        priced: false,
        reason: hasUnrecognised
          ? `Weight class name format not parseable — coversWeight() returned false for all rows`
          : noWeight
            ? `No parcel weight in webhook and ${rateRes.rows.length} rate rows — ambiguous, cannot auto-select`
            : `No weight band covers ${weightPerParcel} kg`,
        fix: hasUnrecognised
          ? 'Update weight_class_name values in customer_rates to use format like "0-1KG", "1-2KG", "OVER5KG"'
          : noWeight
            ? 'Parcel weight not sent in webhook payload; set the price manually or check webhook parcel weight field'
            : `Check that a rate band exists that covers ${weightPerParcel} kg`,
      };
    }

    return res.json(trace);
  } catch (err) { next(err); }
});

// ─── POST /api/billing/charges/:id/reprice ────────────────────────────────────
// Re-run lookupRate with current data; if a rate is found, update the charge.

router.post('/charges/:id/reprice', async (req, res, next) => {
  try {
    const { id } = req.params;

    const r = await query(`
      SELECT c.customer_id, c.parcel_qty,
             s.dc_service_id, s.service_name AS s_service_name,
             s.total_weight_kg, s.parcel_count,
             s.customer_account, s.raw_payload
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.id = $1
    `, [id]);

    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    const row = r.rows[0];

    // Re-parse raw_payload for fields that may have been null when the shipment was first ingested
    // (e.g. before the request_shipment parsing fix was deployed)
    const rawPayload    = typeof row.raw_payload === 'string' ? safeJson(row.raw_payload) || {} : (row.raw_payload || {});
    const innerPayload  = unwrapPayload(rawPayload);
    const extracted     = extractShipmentFields(innerPayload);

    // Resolve customer — use stored id or re-derive; try account_number then dc_customer_id
    let customerId = row.customer_id;
    if (!customerId) {
      const acctNum = row.customer_account || extracted.accountNumber;
      if (acctNum) {
        const cr = await query('SELECT id FROM customers WHERE account_number = $1', [acctNum]);
        if (cr.rows.length) {
          customerId = cr.rows[0].id;
        } else {
          const cr2 = await query('SELECT id FROM customers WHERE dc_customer_id = $1', [acctNum]);
          if (cr2.rows.length) customerId = cr2.rows[0].id;
        }
      }
    }

    const dcServiceId = row.dc_service_id || extracted.dcServiceId;
    const serviceName = row.s_service_name || extracted.serviceName;
    let totalWt       = parseFloat(row.total_weight_kg) || extracted.totalWeightKg || null;
    const parcelQty   = row.parcel_qty || row.parcel_count || extracted.parcelCount || 1;
    const weightPerParcel = parcelQty > 0 && totalWt ? totalWt / parcelQty : totalWt;

    // If we derived a customer from raw payload but it wasn't stored, back-fill the shipment row
    if (!row.customer_id && customerId) {
      await query(`UPDATE shipments SET customer_id = $1, updated_at = NOW()
                   WHERE id = (SELECT shipment_id FROM charges WHERE id = $2)`, [customerId, id]);
      await query(`UPDATE charges SET customer_id = $1, updated_at = NOW() WHERE id = $2`, [customerId, id]);
    }

    const { rate, reason: failReason } = await lookupRateWithReason(customerId, dcServiceId, serviceName, weightPerParcel);
    if (!rate) {
      await query(`UPDATE charges SET price_failure_reason = $1, updated_at = NOW() WHERE id = $2`,
        [failReason, id]);
      return res.json({ ok: false, message: failReason || 'No matching rate found' });
    }

    const totalPrice = parseFloat((rate.price * parcelQty).toFixed(2));

    await query(`
      UPDATE charges
      SET price                = $1,
          zone_name            = $2,
          weight_class_name    = $3,
          rate_id              = $4,
          price_auto           = true,
          price_failure_reason = NULL,
          updated_at           = NOW()
      WHERE id = $5
    `, [totalPrice, rate.zone_name, rate.weight_class_name, rate.rate_id, id]);

    res.json({
      ok: true,
      price: totalPrice,
      zone_name: rate.zone_name,
      weight_class_name: rate.weight_class_name,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/:id/payload ────────────────────────────────────
// Returns the raw webhook JSON that created this charge's shipment.

router.get('/charges/:id/payload', async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await query(`
      SELECT s.raw_payload, s.platform_shipment_id, s.created_at
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.id = $1
    `, [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    const row = r.rows[0];
    const payload = typeof row.raw_payload === 'string'
      ? safeJson(row.raw_payload)
      : row.raw_payload;
    res.json({
      platform_shipment_id: row.platform_shipment_id,
      received_at: row.created_at,
      payload,
    });
  } catch (err) { next(err); }
});

// ─── PATCH /api/billing/charges/:id ─────────────────────────────────────────

router.patch('/charges/:id', async (req, res, next) => {
  try {
    const { billed, verified, cancelled, price } = req.body;
    const sets = [];
    const vals = [];
    let idx = 1;

    if (billed    !== undefined) { sets.push(`billed = $${idx++}`);    vals.push(billed); }
    if (verified  !== undefined) { sets.push(`verified = $${idx++}`);  vals.push(verified); }
    if (cancelled !== undefined) { sets.push(`cancelled = $${idx++}`); vals.push(cancelled); }
    if (price     !== undefined) { sets.push(`price = $${idx++}`);     vals.push(price); }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push(`updated_at = NOW()`);

    const r = await query(
      `UPDATE charges SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...vals, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /api/billing/charges/:id ─────────────────────────────────────────

router.delete('/charges/:id', async (req, res, next) => {
  try {
    await query(
      `UPDATE charges SET cancelled = true, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
