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
import { normalisePayload as normaliseTrackingPayload, upsertEvent as upsertTrackingEvent } from './tracking.js';

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

/**
 * Extract additional shipment fields (dimensions, values, hs_codes, ship_from)
 * from the raw payload for surcharge rule evaluation and storage.
 */
function extractAdditionalShipmentFields(payload) {
  const ship        = payload.shipment || {};
  const reqShip     = extractReqShipment(payload);
  const parcels     = reqShip.parcels || [];
  const firstParcel = parcels[0] || {};
  const clParcels   = ship.create_label_parcels || [];
  const firstCl     = clParcels[0] || {};

  // Ship from country
  const shipFromCountryIso = (reqShip.ship_from || {}).country_iso || null;

  // Dimensions — from request_shipment parcels (in cm)
  const dimLength = parseFloat(firstParcel.dim_length) || null;
  const dimWidth  = parseFloat(firstParcel.dim_width)  || null;
  const dimHeight = parseFloat(firstParcel.dim_height) || null;

  // Per-parcel weight (from create_label_parcels, already in kg)
  const parcelWeightKg = parseFloat(firstCl.weight) || parseFloat(firstParcel._summed_item_weights) || null;

  // Declared values and HS codes — from items across all parcels
  let totalDeclaredValue  = 0;
  let parcelDeclaredValue = 0;
  const hsCodes = new Set();
  for (const parcel of parcels) {
    const items = parcel.items || [];
    let parcelVal = 0;
    for (const item of items) {
      const itemVal = parseFloat(item.value) || 0;
      const qty     = parseInt(item.quantity) || 1;
      parcelVal += itemVal * qty;
      if (item.hs_code) hsCodes.add(String(item.hs_code).trim());
    }
    totalDeclaredValue  += parcelVal;
    if (!parcelDeclaredValue) parcelDeclaredValue = parcelVal; // first parcel
  }
  // Fallback: use create_label_parcels value field
  if (!totalDeclaredValue && firstCl.value) {
    totalDeclaredValue  = parseFloat(firstCl.value) || 0;
    parcelDeclaredValue = totalDeclaredValue;
  }

  return {
    shipFromCountryIso,
    dimLength, dimWidth, dimHeight,
    parcelWeightKg,
    totalDeclaredValue:  totalDeclaredValue  || null,
    parcelDeclaredValue: parcelDeclaredValue || null,
    hsCodes: hsCodes.size ? [...hsCodes] : null,
  };
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
  // NULL/NULL bounds = no weight constraint on this band.
  // The band name (e.g. "Parcel") is just a label — it means any weight qualifies
  // and the zone (resolved from postcode) is the only differentiator.
  if (rate.min_weight_kg == null && rate.max_weight_kg == null) return true;
  // Fall back to text parsing for legacy rate rows that have a name-encoded range
  return coversWeight(rate.weight_class_name, weightKg);
}

// zoneForPostcode — resolve zone name from service code + destination postcode.
//
// Match is on service_code ONLY. Never looks at service name.
//
// Outward code matching:
//   - Exact:      pr.postcode_prefix = outward  (e.g. "IV1" = "IV1")
//   - Letter-only prefix: outward LIKE prefix||'%' where prefix is [A-Z]+ only
//     (e.g. "IM" matches "IM1", "IM2" etc. — Isle of Man)
//
// Zone resolution order:
//   1. Include rule matches this outward code → that zone
//   2. No include match → catch-all: a zone that does NOT exclude this postcode.
//      Covers two cases:
//        a) Zone has exclude rules but this code isn't in them (classic Mainland)
//        b) Zone has no postcode rules at all (implicit catch-all)
//      Zones with any rules are preferred over bare zones.
async function zoneForPostcode(serviceCode, postcode) {
  if (!postcode || !serviceCode) return null;

  const outward = postcode.trim().toUpperCase().split(/\s+/)[0];

  const MATCH_CLAUSE = `(
    pr.postcode_prefix = $2
    OR ($2 LIKE pr.postcode_prefix || '%' AND pr.postcode_prefix ~ '^[A-Z]+$')
  )`;

  // 1. Explicit include rule
  const inclRes = await query(`
    SELECT z.name AS zone_name
    FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    JOIN zone_postcode_rules pr ON pr.zone_id = z.id
    WHERE cs.service_code ILIKE $1
      AND pr.rule_type = 'include'
      AND ${MATCH_CLAUSE}
    LIMIT 1
  `, [serviceCode, outward]);
  if (inclRes.rows.length) return inclRes.rows[0].zone_name;

  // 2. Catch-all zone — not explicitly excluded, no include-list (so not a named zone)
  const EXCL_MATCH = MATCH_CLAUSE.replace(/pr\./g, 'pr3.');
  const catchRes = await query(`
    SELECT z.name AS zone_name
    FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code ILIKE $1
      AND NOT EXISTS (
        SELECT 1 FROM zone_postcode_rules pr4
        WHERE pr4.zone_id = z.id AND pr4.rule_type = 'include'
      )
      AND NOT EXISTS (
        SELECT 1 FROM zone_postcode_rules pr3
        WHERE pr3.zone_id = z.id AND pr3.rule_type = 'exclude'
          AND ${EXCL_MATCH}
      )
    ORDER BY
      (EXISTS (SELECT 1 FROM zone_postcode_rules prx WHERE prx.zone_id = z.id)) DESC
    LIMIT 1
  `, [serviceCode, outward]);
  if (catchRes.rows.length) return catchRes.rows[0].zone_name;

  return null;
}

// ─── Shared zone-match helper ─────────────────────────────────────────────────
// Given a resolved zone name and an array of rows (each with zone_name),
// returns the subset whose zone_name matches (case-insensitive substring).
function filterByZoneName(rows, zoneName) {
  const zl = zoneName.toLowerCase();
  return rows.filter(r =>
    r.zone_name.toLowerCase().includes(zl) || zl.includes(r.zone_name.toLowerCase())
  );
}

// ── New model: customer_service_pricing → carrier rate card weight bands ──────
// Match: customer + service_code only. No service name.
async function lookupViaServicePricing(customerId, serviceCode, weightKg, postcode) {
  if (!serviceCode) return null;

  const res = await query(`
    SELECT
      csp.pricing_type, csp.markup_pct, csp.fixed_fee,
      wb.price_first  AS cost_price,
      wb.min_weight_kg, wb.max_weight_kg,
      z.name          AS zone_name,
      cs.service_code AS svc_code,
      wb.id           AS band_id
    FROM customer_service_pricing csp
    JOIN carrier_rate_cards crc ON crc.id = csp.carrier_rate_card_id
    JOIN courier_services   cs  ON cs.id  = csp.service_id
    JOIN zones              z   ON z.courier_service_id = cs.id
    JOIN weight_bands       wb  ON wb.zone_id = z.id
                                AND wb.carrier_rate_card_id = crc.id
    WHERE csp.customer_id = $1
      AND cs.service_code ILIKE $2
    ORDER BY z.name, wb.min_weight_kg NULLS LAST
  `, [customerId, serviceCode]);

  if (!res.rows.length) return null;

  const rows = res.rows;

  const applyPricing = (row) => {
    const cost = parseFloat(row.cost_price || 0);
    if (row.pricing_type === 'fixed_fee') return cost + parseFloat(row.fixed_fee || 0);
    return cost * (1 + parseFloat(row.markup_pct || 0) / 100);
  };

  const buildRate = (r) => ({
    price:             Math.round(applyPricing(r) * 10000) / 10000,
    cost_price:        parseFloat(r.cost_price || 0),
    zone_name:         r.zone_name,
    weight_class_name: r.min_weight_kg != null ? `${r.min_weight_kg}–${r.max_weight_kg} kg` : 'All weights',
    pricing_type:      r.pricing_type,
    markup_pct:        r.markup_pct,
    fixed_fee:         r.fixed_fee,
  });

  // ── Step 1: zone from postcode ────────────────────────────────────────────
  const distinctZones = [...new Set(rows.map(r => r.zone_name))];
  let zoneRows;

  if (distinctZones.length === 1) {
    zoneRows = rows;
  } else {
    const zoneName = await zoneForPostcode(serviceCode, postcode);
    if (!zoneName) return { rate: null, reason: `No matching zone for postcode "${postcode || 'none'}"` };
    zoneRows = filterByZoneName(rows, zoneName);
    if (!zoneRows.length) return { rate: null, reason: `No matching zone for postcode "${postcode}"` };
  }

  // ── Step 2: weight band within zone ──────────────────────────────────────
  if (weightKg != null) {
    const band = zoneRows.find(r => rateCoversWeight(r, weightKg));
    if (!band) return { rate: null, reason: `No weight band covers ${weightKg} kg in zone "${zoneRows[0].zone_name}"` };
    return { rate: buildRate(band), reason: null };
  }

  return { rate: buildRate(zoneRows[0]), reason: null };
}

// ── Legacy model: customer_rates ──────────────────────────────────────────────
// Match: customer + service_code only. No service name.
async function lookupViaCustomerRates(customerId, serviceCode, weightKg, postcode) {
  if (!serviceCode) return { rate: null, reason: 'No service code — cannot price' };

  const rateRes = await query(`
    SELECT
      cr.id, cr.price, cr.zone_name, cr.weight_class_name,
      cr.service_code, cr.min_weight_kg, cr.max_weight_kg
    FROM customer_rates cr
    WHERE cr.customer_id = $1
      AND cr.service_code ILIKE $2
    ORDER BY cr.zone_name, cr.min_weight_kg NULLS LAST, cr.weight_class_name
  `, [customerId, serviceCode]);

  if (!rateRes.rows.length) {
    const any = await query(
      'SELECT COUNT(*)::int AS cnt FROM customer_rates WHERE customer_id = $1',
      [customerId]
    );
    return {
      rate: null,
      reason: any.rows[0].cnt === 0
        ? 'No pricing set up for this customer'
        : `Service code "${serviceCode}" not found in customer rates`,
    };
  }

  const rates = rateRes.rows;

  // ── Step 1: zone from postcode ────────────────────────────────────────────
  const distinctZones = [...new Set(rates.map(r => r.zone_name))];
  let zoneRows;

  if (distinctZones.length === 1) {
    zoneRows = rates;
  } else {
    const zoneName = await zoneForPostcode(serviceCode, postcode);
    if (!zoneName) return { rate: null, reason: `No matching zone for postcode "${postcode || 'none'}"` };
    zoneRows = filterByZoneName(rates, zoneName);
    if (!zoneRows.length) return { rate: null, reason: `No matching zone for postcode "${postcode}"` };
  }

  // ── Step 2: weight band within zone ──────────────────────────────────────
  if (weightKg != null) {
    const band = zoneRows.find(r => rateCoversWeight(r, weightKg));
    if (!band) return { rate: null, reason: `No weight band covers ${weightKg} kg in zone "${zoneRows[0].zone_name}"` };
    return { rate: { price: parseFloat(band.price), zone_name: band.zone_name,
                     weight_class_name: band.weight_class_name }, reason: null };
  }

  return { rate: { price: parseFloat(zoneRows[0].price), zone_name: zoneRows[0].zone_name,
                   weight_class_name: zoneRows[0].weight_class_name }, reason: null };
}

// ── Main lookup — tries new model first, falls back to legacy ─────────────────
// serviceName is accepted for backwards-compat but NEVER used for matching.
async function lookupRateWithReason(customerId, serviceCode, _serviceName, weightKg, postcode) {
  if (!customerId) return { rate: null, reason: 'No matching customer' };
  if (!serviceCode) return { rate: null, reason: 'No service code' };

  const newResult = await lookupViaServicePricing(customerId, serviceCode, weightKg, postcode);
  if (newResult !== null) return newResult;

  return lookupViaCustomerRates(customerId, serviceCode, weightKg, postcode);
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

// ─── Surcharge engine ─────────────────────────────────────────────────────────

/**
 * Test a single filter condition against shipment data.
 */
function testCondition(f, data) {
  const raw = data[f.field];
  const val = raw != null ? String(raw) : '';
  switch (f.op) {
    case 'eq':      return val.toLowerCase() === String(f.value || '').toLowerCase();
    case 'not_eq':  return val.toLowerCase() !== String(f.value || '').toLowerCase();
    case 'in': {
      const arr = Array.isArray(f.value)
        ? f.value.map(v => String(v).toLowerCase())
        : String(f.value || '').split(',').map(s => s.trim().toLowerCase());
      return arr.includes(val.toLowerCase());
    }
    case 'not_in': {
      const arr = Array.isArray(f.value)
        ? f.value.map(v => String(v).toLowerCase())
        : String(f.value || '').split(',').map(s => s.trim().toLowerCase());
      return !arr.includes(val.toLowerCase());
    }
    case 'gt':       return parseFloat(val) > parseFloat(f.value);
    case 'lt':       return parseFloat(val) < parseFloat(f.value);
    case 'gte':      return parseFloat(val) >= parseFloat(f.value);
    case 'lte':      return parseFloat(val) <= parseFloat(f.value);
    case 'contains': return val.toLowerCase().includes(String(f.value || '').toLowerCase());
    default:         return true;
  }
}

/**
 * Evaluate a rule against shipment data.
 * Supports:
 *   rule.logic         — 'AND' (all conditions) | 'OR' (any condition). Default AND.
 *   rule.service_codes — restrict to specific service codes (empty = all services).
 *   rule.filters       — array of { field, op, value } conditions.
 */
function evaluateSurchargeFilters(rule, data) {
  const filters      = Array.isArray(rule.filters)       ? rule.filters       : [];
  const serviceCodes = Array.isArray(rule.service_codes) ? rule.service_codes : [];
  const logic        = (rule.logic || 'AND').toUpperCase();

  // Service code gate: if rule is scoped to specific services, check it first
  if (serviceCodes.length > 0) {
    const dcSvc = (data.dc_service_id || '').toLowerCase();
    const match = serviceCodes.some(sc => sc.toLowerCase() === dcSvc);
    if (!match) return false;
  }

  // No conditions → always fires (for this service if scoped, or for all)
  if (filters.length === 0) return true;

  if (logic === 'OR') {
    return filters.some(f => testCondition(f, data));
  }
  // Default AND
  return filters.every(f => testCondition(f, data));
}

/**
 * Evaluate all active surcharge rules for the courier and create
 * surcharge charge rows for any that match the shipment.
 */
async function applySurcharges(shipmentId, customerId, basePrice, shipmentData) {
  try {
    if (!shipmentId || !customerId || !shipmentData.courier) return;

    // Only auto-apply surcharges marked as 'always' — 'reconciliation' ones are added manually
    const { rows: surcharges } = await query(`
      SELECT s.*,
             COALESCE((
               SELECT json_agg(r ORDER BY r.created_at)
               FROM surcharge_rules r
               WHERE r.surcharge_id = s.id AND r.active = true
             ), '[]'::json) AS rules
      FROM surcharges s
      JOIN couriers c ON c.id = s.courier_id
      WHERE s.active = true
        AND LOWER(c.code) = LOWER($1)
        AND (s.applies_when = 'always' OR s.applies_when IS NULL)
        AND (s.effective_date IS NULL OR s.effective_date <= CURRENT_DATE)
    `, [shipmentData.courier]);

    for (const surcharge of surcharges) {
      const rules = Array.isArray(surcharge.rules) ? surcharge.rules : [];
      if (!rules.length) continue;

      // Any rule match fires the surcharge (OR across rules)
      let matched = false;
      for (const rule of rules) {
        if (evaluateSurchargeFilters(rule, shipmentData)) { matched = true; break; }
      }
      if (!matched) continue;

      // Idempotency: skip if surcharge charge already exists
      const { rows: existing } = await query(
        'SELECT id FROM charges WHERE shipment_id=$1 AND surcharge_id=$2',
        [shipmentId, surcharge.id]
      );
      if (existing.length) continue;

      // Customer override takes precedence over default
      const { rows: overrides } = await query(
        `SELECT override_value FROM customer_surcharge_overrides
         WHERE customer_id=$1 AND surcharge_id=$2 AND active=true`,
        [customerId, surcharge.id]
      );
      const effectiveValue = overrides.length
        ? parseFloat(overrides[0].override_value)
        : parseFloat(surcharge.default_value);

      // Calculate price based on calc_type and charge_per
      let price;
      if (surcharge.calc_type === 'percentage') {
        // Percentage of base rate (fuel-style)
        price = parseFloat(((parseFloat(basePrice) || 0) * effectiveValue / 100).toFixed(4));
      } else if (surcharge.charge_per === 'parcel') {
        // Flat per parcel — multiply by parcel count
        price = parseFloat((effectiveValue * (shipmentData.parcel_count || 1)).toFixed(4));
      } else {
        // Flat per shipment
        price = effectiveValue;
      }

      await query(`
        INSERT INTO charges
          (shipment_id, customer_id, charge_type, service_name, price, price_auto, surcharge_id, parcel_qty)
        VALUES ($1, $2, 'surcharge', $3, $4, true, $5, 1)
      `, [shipmentId, customerId, surcharge.name, price, surcharge.id]);
    }
  } catch (err) {
    console.error('[applySurcharges] error:', err.message);
  }
}

// ─── POST /api/billing/webhook ────────────────────────────────────────────────

router.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Empty payload' });

    // Unwrap platform wrapper (handles body.json as object or string)
    const payload = unwrapPayload(body);
    const eventType = payload.event_type || payload.event || payload.type || '';

    // ── shipment.tracked — process as a tracking update ──────────────────────
    // Parcel Master sends ALL event types to this URL, including tracking updates.
    // Route them through the same tracking logic used by /api/tracking/webhook.
    if (eventType === 'shipment.tracked') {
      const events  = normaliseTrackingPayload(body);
      const results = [];
      for (const event of events) {
        results.push(await upsertTrackingEvent(event, body));
      }
      return res.json({ ok: true, action: 'tracking_processed', count: results.length, results });
    }

    // ── Guard: only process recognised shipment lifecycle events ──────────────
    const SHIPMENT_EVENTS = new Set([
      'shipment.created', 'shipment.cancelled', 'shipment.deleted', 'shipment.updated',
    ]);
    const TRACKING_KEYWORDS = ['tracking', 'parcel.scan', 'delivery_update', 'status_update'];
    const lowerEvent = eventType.toLowerCase();
    const isOtherTrackingEvent = TRACKING_KEYWORDS.some(k => lowerEvent.includes(k));

    if (isOtherTrackingEvent) {
      // Other tracking-style events — process as tracking, not billing
      const events  = normaliseTrackingPayload(body);
      const results = [];
      for (const event of events) {
        results.push(await upsertTrackingEvent(event, body));
      }
      return res.json({ ok: true, action: 'tracking_processed', count: results.length });
    }

    // Anything else unrecognised — skip cleanly
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
    //  1. account_number → customers.account_number
    //  2. account_number → customers.dc_customer_id
    //  3. customerDcId  → customers.dc_customer_id
    //  4. accountName   → customers.business_name (exact, then partial)
    //  5. accountName   → customers.billing_aliases (short-name aliases)
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
    if (!customerId && accountName) {
      const cr4 = await query(
        `SELECT id FROM customers WHERE LOWER(business_name) = LOWER($1)`,
        [accountName.trim()]
      );
      if (cr4.rows.length) customerId = cr4.rows[0].id;
    }
    if (!customerId && accountName) {
      const cr4b = await query(
        `SELECT id FROM customers WHERE LOWER(business_name) ILIKE $1 ORDER BY LENGTH(business_name) ASC LIMIT 1`,
        [`%${accountName.trim()}%`]
      );
      if (cr4b.rows.length) customerId = cr4b.rows[0].id;
    }
    if (!customerId && accountName) {
      try {
        const cr5 = await query(
          `SELECT id FROM customers WHERE EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER($1)) LIMIT 1`,
          [accountName.trim().toLowerCase()]
        );
        if (cr5.rows.length) customerId = cr5.rows[0].id;
      } catch (_) { /* billing_aliases column not yet migrated */ }
    }

    // Effective account identifier to store — prefer accountNumber, fall back to customerDcId
    // so the relink-customers endpoint can find unlinked shipments later.
    const effectiveAccount = accountNumber || customerDcId || null;

    // Extract additional fields for dimension/value/hs_code surcharge rule filtering
    const addl = extractAdditionalShipmentFields(payload);

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
         ship_from_country_iso,
         dim_length_cm, dim_width_cm, dim_height_cm, parcel_weight_kg,
         total_declared_value, parcel_declared_value, hs_codes,
         raw_payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
      ON CONFLICT (platform_shipment_id) DO UPDATE SET
        customer_id           = COALESCE(EXCLUDED.customer_id, shipments.customer_id),
        customer_account      = COALESCE(EXCLUDED.customer_account, shipments.customer_account),
        service_name          = COALESCE(EXCLUDED.service_name, shipments.service_name),
        tracking_codes        = COALESCE(EXCLUDED.tracking_codes, shipments.tracking_codes),
        tracking_hash         = COALESCE(EXCLUDED.tracking_hash, shipments.tracking_hash),
        ship_from_country_iso = COALESCE(EXCLUDED.ship_from_country_iso, shipments.ship_from_country_iso),
        dim_length_cm         = COALESCE(EXCLUDED.dim_length_cm, shipments.dim_length_cm),
        dim_width_cm          = COALESCE(EXCLUDED.dim_width_cm, shipments.dim_width_cm),
        dim_height_cm         = COALESCE(EXCLUDED.dim_height_cm, shipments.dim_height_cm),
        parcel_weight_kg      = COALESCE(EXCLUDED.parcel_weight_kg, shipments.parcel_weight_kg),
        total_declared_value  = COALESCE(EXCLUDED.total_declared_value, shipments.total_declared_value),
        parcel_declared_value = COALESCE(EXCLUDED.parcel_declared_value, shipments.parcel_declared_value),
        hs_codes              = COALESCE(EXCLUDED.hs_codes, shipments.hs_codes),
        updated_at            = NOW()
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
      addl.shipFromCountryIso,
      addl.dimLength, addl.dimWidth, addl.dimHeight, addl.parcelWeightKg,
      addl.totalDeclaredValue, addl.parcelDeclaredValue,
      addl.hsCodes,
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

    // Look up rate card — pass destination postcode for zone resolution on flat-rate services
    const { rate, reason: priceFailReason } = await lookupRateWithReason(customerId, dcServiceId, serviceName, weightPerParcel, shipToPostcode);
    const unitPrice  = rate ? rate.price : null;
    const totalPrice = unitPrice != null ? parseFloat((unitPrice * parcelCount).toFixed(2)) : null;

    // Insert charge — rate_id is UUID on the charges table so we leave it null;
    // zone_name + weight_class_name carry the human-readable pricing reference.
    const chargeRes = await query(`
      INSERT INTO charges
        (shipment_id, customer_id, charge_type,
         order_id, parcel_qty, service_name,
         price, cost_price,
         zone_name, weight_class_name, price_auto,
         price_failure_reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
    `, [
      shipmentId, customerId, 'courier',
      reference, parcelCount, serviceName,
      totalPrice,
      totalCostPrice > 0 ? parseFloat(totalCostPrice.toFixed(2)) : null,
      rate?.zone_name || null,
      rate?.weight_class_name || null,
      rate != null,
      rate ? null : priceFailReason,
    ]);

    // Apply surcharges (fuel, clearance, congestion, etc.) — non-blocking
    await applySurcharges(shipmentId, customerId, totalPrice, {
      courier,
      dc_service_id:          dcServiceId,
      service_name:           serviceName,
      ship_from_country_iso:  addl.shipFromCountryIso,
      ship_to_country_iso:    shipToCountry,
      ship_to_postcode:       shipToPostcode,
      parcel_count:           parcelCount,
      total_weight_kg:        totalWeightKg,
      parcel_weight_kg:       addl.parcelWeightKg,
      dim_length_cm:          addl.dimLength,
      dim_width_cm:           addl.dimWidth,
      dim_height_cm:          addl.dimHeight,
      total_declared_value:   addl.totalDeclaredValue,
      parcel_declared_value:  addl.parcelDeclaredValue,
    });

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
    // Include shipments where customer_account OR customer_name is set
    // so that API-integrated customers (e.g. Europa) whose webhooks carry
    // no account_number but DO carry account_name are also picked up.
    const unlinked = await query(`
      SELECT s.id AS shipment_id, s.customer_account, s.customer_name,
             c.id AS charge_id
      FROM shipments s
      LEFT JOIN charges c ON c.shipment_id = s.id
      WHERE s.customer_id IS NULL
        AND (s.customer_account IS NOT NULL OR s.customer_name IS NOT NULL)
      ORDER BY s.created_at ASC
    `);

    let linked = 0;
    let not_found = 0;

    for (const row of unlinked.rows) {
      const acct = row.customer_account;
      const name = row.customer_name;
      let customerId = null;

      // 1. account_number exact match
      if (acct) {
        const cr = await query('SELECT id FROM customers WHERE account_number = $1', [acct]);
        customerId = cr.rows[0]?.id || null;
      }

      // 2. dc_customer_id match (API customers like Europa send their DC ID as account)
      if (!customerId && acct) {
        const cr2 = await query('SELECT id FROM customers WHERE dc_customer_id = $1', [acct]);
        customerId = cr2.rows[0]?.id || null;
      }

      // 3. Match by account_name against business_name (for customers whose webhook
      //    carries no account number — Europa sends account_name but no account_number)
      if (!customerId && name) {
        const cr3 = await query(
          `SELECT id FROM customers WHERE LOWER(business_name) = LOWER($1)`,
          [name.trim()]
        );
        customerId = cr3.rows[0]?.id || null;
      }

      // 4. Partial name match
      if (!customerId && name) {
        const cr4 = await query(
          `SELECT id FROM customers WHERE LOWER(business_name) ILIKE $1 ORDER BY LENGTH(business_name) ASC LIMIT 1`,
          [`%${name.trim()}%`]
        );
        customerId = cr4.rows[0]?.id || null;
      }

      // 5. Billing alias lookup (e.g. webhook sends "Europa" but customer is "Europa Worldwide Ltd")
      try {
        if (!customerId && name) {
          const cr5 = await query(
            `SELECT id FROM customers WHERE EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER($1)) LIMIT 1`,
            [name.trim().toLowerCase()]
          );
          customerId = cr5.rows[0]?.id || null;
        }
        if (!customerId && acct) {
          const cr5b = await query(
            `SELECT id FROM customers WHERE EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER($1)) LIMIT 1`,
            [acct.trim().toLowerCase()]
          );
          customerId = cr5b.rows[0]?.id || null;
        }
      } catch (_) { /* billing_aliases column not yet migrated */ }

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
             s.customer_account, s.ship_to_postcode, s.raw_payload
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

        // Look up rate with reason — pass postcode for zone resolution on flat-rate services
        const { rate, reason: failReason } = await lookupRateWithReason(customerId, dcServiceId, serviceName, weightPerParcel, row.ship_to_postcode);
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
              price_auto            = true,
              price_failure_reason  = NULL,
              updated_at            = NOW()
          WHERE id = $4
        `, [totalPrice, rate.zone_name, rate.weight_class_name, row.charge_id]);

        summary.priced++;
      } catch (err) {
        summary.errors++;
      }
    }

    res.json(summary);
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/:id/debug ──────────────────────────────────────
// Full step-by-step trace using the SAME functions as the live billing engine.
// Every field extracted, every DB lookup attempted, every decision explained.

router.get('/charges/:id/debug', async (req, res, next) => {
  try {
    const { id } = req.params;

    const r = await query(`
      SELECT
        c.id, c.customer_id, c.service_name AS c_service_name,
        c.zone_name, c.weight_class_name,
        c.price, c.price_auto, c.rate_id, c.order_id, c.parcel_qty,
        c.price_failure_reason,
        s.platform_shipment_id,
        s.customer_account, s.customer_name AS s_customer_name,
        s.courier, s.dc_service_id, s.service_name AS s_service_name,
        s.total_weight_kg, s.parcel_count, s.parcel_weight_kg,
        s.ship_to_postcode, s.ship_to_country_iso,
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
      stored: {
        price: row.price,
        price_auto: row.price_auto,
        zone: row.zone_name,
        weight_class: row.weight_class_name,
        failure_reason: row.price_failure_reason,
        postcode: row.ship_to_postcode,
        country_iso: row.ship_to_country_iso,
        customer_account: row.customer_account,
        customer_name: row.s_customer_name,
      },
      steps: [],
    };

    // ── Step 1: Extract fields from raw payload (same as live webhook) ────────
    const rawPayload   = typeof row.raw_payload === 'string' ? safeJson(row.raw_payload) || {} : (row.raw_payload || {});
    const innerPayload = unwrapPayload(rawPayload);
    const extracted    = extractShipmentFields(innerPayload);

    const dcServiceId     = row.dc_service_id   || extracted.dcServiceId;
    const serviceName     = row.s_service_name  || extracted.serviceName;
    const parcelQty       = row.parcel_count     || row.parcel_qty || extracted.parcelCount || 1;
    const totalWeightKg   = parseFloat(row.total_weight_kg) || extracted.totalWeightKg || null;
    // Use stored parcel_weight_kg (migration 039) if available, else derive from total
    const weightPerParcel = parseFloat(row.parcel_weight_kg) ||
      (parcelQty > 0 && totalWeightKg ? totalWeightKg / parcelQty : totalWeightKg) || null;
    const postcode        = row.ship_to_postcode || null;
    const outward         = postcode ? postcode.trim().toUpperCase().split(/\s+/)[0] : null;

    trace.steps.push({
      step: 1,
      title: 'Field extraction',
      account_number:    extracted.accountNumber,
      customer_dc_id:    extracted.customerDcId,
      dc_service_id:     dcServiceId,
      service_name:      serviceName,
      parcel_count:      parcelQty,
      total_weight_kg:   totalWeightKg,
      weight_per_parcel: weightPerParcel != null ? Math.round(weightPerParcel * 1000) / 1000 : null,
      postcode:          postcode,
      outward_code:      outward,
    });

    // ── Step 2: Customer resolution (same 4-step logic as live webhook) ───────
    const { accountNumber, customerDcId } = extracted;
    let customerId   = row.customer_id || null;
    let customerName = null;
    let resolvedVia  = customerId ? 'stored_on_charge' : null;
    const custSteps  = [];

    if (!customerId && accountNumber) {
      const c1 = await query('SELECT id, business_name, account_number, dc_customer_id FROM customers WHERE account_number = $1', [accountNumber]);
      custSteps.push({ tried: `account_number = '${accountNumber}'`, found: c1.rows.length > 0, row: c1.rows[0] || null });
      if (c1.rows.length) { customerId = c1.rows[0].id; customerName = c1.rows[0].business_name; resolvedVia = 'account_number'; }
    }
    if (!customerId && accountNumber) {
      const c2 = await query('SELECT id, business_name, account_number, dc_customer_id FROM customers WHERE dc_customer_id = $1', [accountNumber]);
      custSteps.push({ tried: `dc_customer_id = '${accountNumber}'`, found: c2.rows.length > 0, row: c2.rows[0] || null });
      if (c2.rows.length) { customerId = c2.rows[0].id; customerName = c2.rows[0].business_name; resolvedVia = 'dc_customer_id_via_account_number'; }
    }
    if (!customerId && customerDcId) {
      const c3 = await query('SELECT id, business_name, account_number, dc_customer_id FROM customers WHERE dc_customer_id = $1', [customerDcId]);
      custSteps.push({ tried: `dc_customer_id = '${customerDcId}'  (from billing block)`, found: c3.rows.length > 0, row: c3.rows[0] || null });
      if (c3.rows.length) { customerId = c3.rows[0].id; customerName = c3.rows[0].business_name; resolvedVia = 'customer_dc_id_billing_block'; }
    }
    if (!customerId && row.s_customer_name) {
      const c4 = await query(`SELECT id, business_name, account_number, dc_customer_id FROM customers WHERE LOWER(business_name) = LOWER($1)`, [row.s_customer_name.trim()]);
      custSteps.push({ tried: `business_name = '${row.s_customer_name}'`, found: c4.rows.length > 0, row: c4.rows[0] || null });
      if (c4.rows.length) { customerId = c4.rows[0].id; customerName = c4.rows[0].business_name; resolvedVia = 'business_name_exact'; }
    }
    if (!customerId && row.s_customer_name) {
      const c5 = await query(`SELECT id, business_name, account_number, dc_customer_id FROM customers WHERE LOWER(business_name) ILIKE $1 ORDER BY LENGTH(business_name) ASC LIMIT 1`, [`%${row.s_customer_name.trim()}%`]);
      custSteps.push({ tried: `business_name ILIKE '%${row.s_customer_name}%'`, found: c5.rows.length > 0, row: c5.rows[0] || null });
      if (c5.rows.length) { customerId = c5.rows[0].id; customerName = c5.rows[0].business_name; resolvedVia = 'business_name_partial'; }
    }
    if (!customerId && row.s_customer_name) {
      try {
        const c6 = await query(`SELECT id, business_name FROM customers WHERE EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER($1)) LIMIT 1`, [row.s_customer_name.trim().toLowerCase()]);
        custSteps.push({ tried: `billing_aliases @> ['${row.s_customer_name.toLowerCase()}']`, found: c6.rows.length > 0, row: c6.rows[0] || null });
        if (c6.rows.length) { customerId = c6.rows[0].id; customerName = c6.rows[0].business_name; resolvedVia = 'billing_alias'; }
      } catch (_) {
        custSteps.push({ tried: `billing_aliases (column not yet migrated)`, found: false, row: null });
      }
    }

    if (customerId && !customerName) {
      const cn = await query('SELECT business_name FROM customers WHERE id = $1', [customerId]);
      if (cn.rows.length) customerName = cn.rows[0].business_name;
    }

    trace.steps.push({
      step: 2,
      title: 'Customer resolution',
      resolved: !!customerId,
      customer_id: customerId,
      customer_name: customerName,
      resolved_via: resolvedVia,
      lookup_attempts: custSteps,
    });

    if (!customerId) {
      trace.conclusion = {
        priced: false,
        reason: 'No customer matched',
        what_was_tried: custSteps,
        fix: 'Set account_number or dc_customer_id on the customer record to match what the webhook sends, OR ensure business_name exactly matches the account_name in the webhook.',
      };
      return res.json(trace);
    }

    // ── Step 3a: New-model pricing (customer_service_pricing → weight_bands) ─────
    // This is the FIRST path the live engine tries — if it finds a result here,
    // the legacy customer_rates path never runs.
    const newModelRes = await lookupViaServicePricing(customerId, dcServiceId, weightPerParcel, postcode);
    const newModelRows = await query(`
      SELECT
        csp.pricing_type, csp.markup_pct, csp.fixed_fee,
        wb.price_first AS cost_price, wb.min_weight_kg, wb.max_weight_kg,
        z.name AS zone_name, cs.service_code AS svc_code
      FROM customer_service_pricing csp
      JOIN carrier_rate_cards crc ON crc.id = csp.carrier_rate_card_id
      JOIN courier_services   cs  ON cs.id  = csp.service_id
      JOIN zones              z   ON z.courier_service_id = cs.id
      JOIN weight_bands       wb  ON wb.zone_id = z.id AND wb.carrier_rate_card_id = crc.id
      WHERE csp.customer_id = $1
        AND cs.service_code ILIKE $2
      ORDER BY z.name, wb.min_weight_kg NULLS LAST
    `, [customerId, dcServiceId || '']);

    trace.steps.push({
      step: '3a',
      title: 'New-model pricing (customer_service_pricing)',
      pricing_model_found: newModelRows.rows.length > 0,
      bands_in_db: newModelRows.rows.map(r => ({
        zone: r.zone_name, range: `${r.min_weight_kg ?? '—'}–${r.max_weight_kg ?? '—'} kg`,
        cost_price: r.cost_price, pricing_type: r.pricing_type,
        markup_pct: r.markup_pct, fixed_fee: r.fixed_fee,
      })),
      result: newModelRes === null ? 'NOT_USED — no new-model pricing found, will check legacy customer_rates'
        : newModelRes.rate ? `MATCH — £${newModelRes.rate.price} (${newModelRes.rate.zone_name}, ${newModelRes.rate.weight_class_name})`
        : `NO_MATCH — ${newModelRes.reason}`,
      will_use_new_model: newModelRes !== null,
    });

    // If the new model resolved a price, we can project the conclusion now.
    // The legacy steps below still run for diagnostic visibility.
    const newModelWinner = newModelRes?.rate || null;

    // ── Step 3: Legacy service match (customer_rates — service code only) ────
    const [rateRes, allSvcRes] = await Promise.all([
      query(`
        SELECT cr.id, cr.price, cr.zone_name, cr.weight_class_name,
               cr.service_code, cr.min_weight_kg, cr.max_weight_kg
        FROM customer_rates cr
        WHERE cr.customer_id = $1
          AND cr.service_code ILIKE $2
        ORDER BY cr.zone_name, cr.min_weight_kg NULLS LAST, cr.weight_class_name
      `, [customerId, dcServiceId || '']),
      query(`
        SELECT DISTINCT service_code, COUNT(*) AS rate_count
        FROM customer_rates WHERE customer_id = $1
        GROUP BY service_code ORDER BY service_code
      `, [customerId]),
    ]);

    trace.steps.push({
      step: 3,
      title: 'Legacy fallback — customer_rates',
      will_skip_legacy: !!newModelWinner,
      note: newModelWinner ? '⚠ New model resolved — legacy shown for reference only.' : 'New model found nothing — legacy used.',
      searched_for: { service_code: dcServiceId },
      // field names matched to what the debug UI reads (matched_rows / matched_rates)
      matched_rows:   rateRes.rows.length,
      matched_rates:  rateRes.rows.map(r => ({
        id: r.id, service_code: r.service_code, service_name: r.service_name,
        zone_name: r.zone_name, weight_class_name: r.weight_class_name,
        min_weight_kg: r.min_weight_kg, max_weight_kg: r.max_weight_kg, price: r.price,
      })),
      all_services_on_customer: allSvcRes.rows,
    });

    // Only bail out early if NEITHER model found anything — the new-model winner bypasses legacy entirely.
    if (!rateRes.rows.length && !newModelWinner) {
      trace.conclusion = {
        priced: false,
        reason: `No rates matched. Webhook sent service_code="${dcServiceId}", service_name="${serviceName}". Neither new-model (customer_service_pricing) nor legacy (customer_rates) has an entry for this service.`,
        available_services: allSvcRes.rows,
        fix: newModelRows.rows.length > 0
          ? 'New-model pricing exists but weight band matching failed — check band min/max_weight_kg values match expected weights.'
          : 'Add a pricing entry for this service: either configure customer_service_pricing (recommended) or add a row to customer_rates.',
      };
      return res.json(trace);
    }

    // ── Step 4: Zone → Weight (mirrors the live engine exactly) ──────────────
    // Step 1 of engine: resolve zone from postcode.
    // Step 2 of engine: find weight band within that zone.
    // Only two failure modes: no matching zone, no matching weight band.
    const legacyRates = rateRes.rows;
    let legacyZone = null;
    let legacyZoneRows = [];
    let legacyBand = null;
    let legacyError = null;

    if (!newModelWinner && legacyRates.length > 0) {
      const distinctLegacyZones = [...new Set(legacyRates.map(r => r.zone_name))];
      if (distinctLegacyZones.length === 1) {
        legacyZone = distinctLegacyZones[0];
        legacyZoneRows = legacyRates;
      } else {
        legacyZone = await zoneForPostcode(legacyRates[0].service_code, postcode);
        if (!legacyZone) {
          legacyError = `No matching zone for postcode "${postcode || 'none'}"`;
        } else {
          const zl = legacyZone.toLowerCase();
          legacyZoneRows = legacyRates.filter(r =>
            r.zone_name.toLowerCase().includes(zl) || zl.includes(r.zone_name.toLowerCase())
          );
          if (!legacyZoneRows.length) legacyError = `No matching zone for postcode "${postcode}"`;
        }
      }
      if (!legacyError && legacyZoneRows.length > 0) {
        legacyBand = legacyZoneRows.find(r => rateCoversWeight(r, weightPerParcel));
        if (!legacyBand) legacyError = `No weight band covers ${weightPerParcel} kg in zone "${legacyZone}"`;
      }
    }

    trace.steps.push({
      step: 4,
      title: 'Zone → Weight resolution (legacy)',
      skipped: !!newModelWinner,
      weight_per_parcel_kg: weightPerParcel,
      zone_resolved: legacyZone,
      zone_rows: legacyZoneRows.map(r => ({
        zone_name: r.zone_name,
        weight_class_name: r.weight_class_name,
        min_weight_kg: r.min_weight_kg,
        max_weight_kg: r.max_weight_kg,
        price: r.price,
        covers: rateCoversWeight(r, weightPerParcel),
      })),
      selected_band: legacyBand ? {
        zone: legacyBand.zone_name,
        weight_class: legacyBand.weight_class_name,
        price: legacyBand.price,
      } : null,
      error: legacyError || null,
    });

    // ── Conclusion ────────────────────────────────────────────────────────────
    if (newModelWinner) {
      trace.conclusion = {
        priced: true,
        price: newModelWinner.price,
        zone_name: newModelWinner.zone_name,
        weight_class_name: newModelWinner.weight_class_name,
        method: 'new_model (customer_service_pricing → carrier rate card)',
        pricing_type: newModelWinner.pricing_type,
      };
    } else if (legacyBand) {
      trace.conclusion = {
        priced: true,
        price: parseFloat(legacyBand.price),
        zone_name: legacyBand.zone_name,
        weight_class_name: legacyBand.weight_class_name,
        method: 'legacy (customer_rates)',
      };
    } else {
      trace.conclusion = {
        priced: false,
        reason: legacyError || (legacyRates.length === 0
          ? `Service "${dcServiceId}" not found in customer_rates`
          : 'No rate resolved'),
        fix: legacyError?.includes('zone')
          ? 'Check postcode rules are configured on the zone for this service.'
          : 'Check weight bands cover the parcel weight (min_weight_kg / max_weight_kg).',
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
             s.total_weight_kg, s.parcel_count, s.parcel_weight_kg,
             s.customer_account, s.ship_to_postcode, s.raw_payload
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
    const totalWt     = parseFloat(row.total_weight_kg) || extracted.totalWeightKg || null;
    const parcelQty   = row.parcel_qty || row.parcel_count || extracted.parcelCount || 1;
    // Use dedicated parcel_weight_kg column (migration 039) if available, else derive from total
    const weightPerParcel = parseFloat(row.parcel_weight_kg) ||
      (parcelQty > 0 && totalWt ? totalWt / parcelQty : totalWt) || null;

    // If we derived a customer from raw payload but it wasn't stored, back-fill the shipment row
    if (!row.customer_id && customerId) {
      await query(`UPDATE shipments SET customer_id = $1, updated_at = NOW()
                   WHERE id = (SELECT shipment_id FROM charges WHERE id = $2)`, [customerId, id]);
      await query(`UPDATE charges SET customer_id = $1, updated_at = NOW() WHERE id = $2`, [customerId, id]);
    }

    const { rate, reason: failReason } = await lookupRateWithReason(customerId, dcServiceId, serviceName, weightPerParcel, row.ship_to_postcode);
    if (!rate) {
      await query(`UPDATE charges SET price_failure_reason = $1, updated_at = NOW() WHERE id = $2`,
        [failReason, id]);
      return res.json({ ok: false, message: failReason || 'No matching rate found' });
    }

    const totalPrice = parseFloat((rate.price * parcelQty).toFixed(2));

    // rate_id on charges is UUID — we don't store the raw row id (integer).
    // zone_name + weight_class_name are the human-readable references that matter.
    await query(`
      UPDATE charges
      SET price                = $1,
          zone_name            = $2,
          weight_class_name    = $3,
          price_auto           = true,
          price_failure_reason = NULL,
          updated_at           = NOW()
      WHERE id = $4
    `, [totalPrice, rate.zone_name, rate.weight_class_name, id]);

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
