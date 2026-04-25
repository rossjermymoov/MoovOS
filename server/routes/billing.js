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

// coversWeightOrUnknown — like coversWeight() but returns null (not false) when
// the weight_class_name is genuinely unparseable.  This lets callers distinguish
// "out of range" (false) from "flat-rate / no pattern" (null).
function coversWeightOrUnknown(weightClassName, weightKg) {
  if (!weightClassName) return null;
  const s = normaliseWeightBand(weightClassName);

  const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (range) { const lo = parseFloat(range[1]), hi = parseFloat(range[2]); return weightKg > lo && weightKg <= hi; }

  const plus = s.match(/^(\d+(?:\.\d+)?)\+$/) || s.match(/^OVER(\d+(?:\.\d+)?)$/);
  if (plus) return weightKg > parseFloat(plus[1]);

  const under = s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)$/);
  if (under) return weightKg < parseFloat(under[1]);

  const upto = s.match(/^(?:UPTO|MAX)(\d+(?:\.\d+)?)$/);
  if (upto) return weightKg <= parseFloat(upto[1]);

  // Bare number — e.g. "5KG" normalises to "5", interpreted as an upper bound.
  // This is the standard Moov weight class naming convention: "5KG" = up to 5 kg.
  const bare = s.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return weightKg <= parseFloat(bare[1]);

  return null; // e.g. "Parcel", "Small" — genuinely unparseable, caller treats as flat-rate
}

// extractUpperBound — pull a numeric upper limit out of a weight_class_name.
// Returns null if not parseable.
function extractUpperBound(weightClassName) {
  if (!weightClassName) return null;
  const s = normaliseWeightBand(weightClassName);
  const bare  = s.match(/^(\d+(?:\.\d+)?)$/);
  if (bare)  return parseFloat(bare[1]);
  const upto  = s.match(/^(?:UPTO|MAX)(\d+(?:\.\d+)?)$/);
  if (upto)  return parseFloat(upto[1]);
  const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (range) return parseFloat(range[2]);
  return null;
}

// rateCoversWeight — uses numeric bounds when present, then falls back to
// weight_class_name text parsing.  Only treats a band as "covers any weight"
// (flat-rate) if BOTH bounds are NULL AND the name is genuinely unparseable.
function rateCoversWeight(rate, weightKg) {
  const minKg = parseFloat(rate.min_weight_kg);
  const maxKg = parseFloat(rate.max_weight_kg);
  if (!isNaN(minKg) && !isNaN(maxKg)) {
    return weightKg > minKg && weightKg <= maxKg;
  }
  // Numeric bounds absent — try weight_class_name text (e.g. "5KG" = up to 5 kg).
  // Returns null only for truly unparseable names like "Parcel".
  const named = coversWeightOrUnknown(rate.weight_class_name, weightKg);
  if (named !== null) return named;
  // Genuinely unparseable name with no numeric bounds = flat-rate, any weight qualifies.
  return rate.min_weight_kg == null && rate.max_weight_kg == null;
}

// Return the effective upper-weight-bound of a band.
// Used when multiple bands match to pick the tightest fit (smallest max wins).
function bandMaxKg(rate) {
  const maxKg = parseFloat(rate.max_weight_kg);
  if (!isNaN(maxKg)) return maxKg;
  // No numeric bound — extract from weight_class_name (e.g. "5KG" → 5)
  const fromName = extractUpperBound(rate.weight_class_name);
  if (fromName !== null) return fromName;
  return Infinity; // flat-rate band — sorts last (lowest priority)
}

// zoneForPostcode — resolve zone name from service code + destination postcode.
//
// Uses dc_zones as the primary source — this is the carrier rate card data
// imported directly from DespatchCloud and covers all legacy services.
// Falls back to the zones/zone_postcode_rules tables for new-model services
// that haven't been imported into dc_zones.
//
// Outward code matching (same logic in both sources):
//   - Exact:   outward = element  (e.g. "IV1")
//   - Prefix:  outward LIKE element||'%' where element is letters-only
//              (e.g. "IV" matches "IV1", "IV2", etc.)
//
// Zone resolution order:
//   1. dc_zones — included_postcodes match → that zone
//   2. dc_zones — no included list AND outward not in excluded_postcodes → catch-all (Mainland)
//   3. zones/zone_postcode_rules — include rule match (new-model services)
//   4. zones/zone_postcode_rules — catch-all (has excludes, this postcode not excluded)
//   5. zones/zone_postcode_rules — universal zone (no rules at all)
async function zoneForPostcode(serviceCode, postcode) {
  if (!postcode || !serviceCode) return null;

  const outward = postcode.trim().toUpperCase().split(/\s+/)[0];

  // Helper: does an array column contain a match for this outward code?
  // Exact match OR letter-only prefix (e.g. "IV" matches "IV1", "IV2")
  const ARRAY_MATCH = `EXISTS (
    SELECT 1 FROM unnest($2::text[]) p
    WHERE p = $3 OR ($3 LIKE p || '%' AND p ~ '^[A-Z]+$')
  )`;

  // ── 1. dc_zones: explicit include ─────────────────────────────────────────
  const dcInclRes = await query(`
    SELECT zone_name
    FROM dc_zones
    WHERE service_code ILIKE $1
      AND included_postcodes IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM unnest(included_postcodes) p
        WHERE p = $2 OR ($2 LIKE p || '%' AND p ~ '^[A-Z]+$')
      )
    LIMIT 1
  `, [serviceCode, outward]);
  if (dcInclRes.rows.length) return dcInclRes.rows[0].zone_name;

  // ── 2. dc_zones: catch-all (no include list, outward not excluded) ────────
  const dcCatchRes = await query(`
    SELECT zone_name
    FROM dc_zones
    WHERE service_code ILIKE $1
      AND included_postcodes IS NULL
      AND (
        excluded_postcodes IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(excluded_postcodes) p
          WHERE p = $2 OR ($2 LIKE p || '%' AND p ~ '^[A-Z]+$')
        )
      )
    LIMIT 1
  `, [serviceCode, outward]);
  if (dcCatchRes.rows.length) return dcCatchRes.rows[0].zone_name;

  // ── 3–5. zones/zone_postcode_rules (new-model services) ──────────────────
  const MATCH_CLAUSE = `(
    pr.postcode_prefix = $2
    OR ($2 LIKE pr.postcode_prefix || '%' AND pr.postcode_prefix ~ '^[A-Z]+$')
  )`;

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

  const EXCL_MATCH = MATCH_CLAUSE.replace(/pr\./g, 'pr3.');
  const catchRes = await query(`
    SELECT z.name AS zone_name
    FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code ILIKE $1
      AND EXISTS (
        SELECT 1 FROM zone_postcode_rules pr2
        WHERE pr2.zone_id = z.id AND pr2.rule_type = 'exclude'
      )
      AND NOT EXISTS (
        SELECT 1 FROM zone_postcode_rules pr3
        WHERE pr3.zone_id = z.id AND pr3.rule_type = 'exclude'
          AND ${EXCL_MATCH}
      )
    LIMIT 1
  `, [serviceCode, outward]);
  if (catchRes.rows.length) return catchRes.rows[0].zone_name;

  const univRes = await query(`
    SELECT z.name AS zone_name
    FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code ILIKE $1
      AND NOT EXISTS (
        SELECT 1 FROM zone_postcode_rules pr
        WHERE pr.zone_id = z.id
      )
    ORDER BY z.name
    LIMIT 1
  `, [serviceCode]);
  if (univRes.rows.length) return univRes.rows[0].zone_name;

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
      wb.price_sub    AS cost_price_sub,
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

  const applyMarkup = (cost, row) => {
    if (row.pricing_type === 'fixed_fee') return parseFloat(cost || 0) + parseFloat(row.fixed_fee || 0);
    return parseFloat(cost || 0) * (1 + parseFloat(row.markup_pct || 0) / 100);
  };

  const buildRate = (r) => ({
    price:             Math.round(applyMarkup(r.cost_price, r) * 10000) / 10000,
    // price_sub: sell price for each subsequent parcel (same markup applied to cost_price_sub)
    price_sub:         r.cost_price_sub != null
                         ? Math.round(applyMarkup(r.cost_price_sub, r) * 10000) / 10000
                         : null,
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
    const band = zoneRows.filter(r => rateCoversWeight(r, weightKg)).sort((a, b) => bandMaxKg(a) - bandMaxKg(b))[0];
    if (!band) return { rate: null, reason: `No weight band covers ${weightKg} kg in zone "${zoneRows[0].zone_name}"` };
    return { rate: buildRate(band), reason: null };
  }

  return { rate: buildRate(zoneRows[0]), reason: null };
}

// ── Legacy model: customer_rates ──────────────────────────────────────────────
// Match: customer + service_code only. No service name.
//
// Pricing flow:
//   1. dc_weight_classes (carrier rate card) → weight band name for this weight.
//      No match → error: 'no matching weight band'
//   2. Postcode → zone name. Single-zone services skip this lookup.
//      No match → error: 'no matching zone'
//   3. customer_rates: customer + service + zone + band name → sell price.
//      No match → error: 'no matching price'
//
// No guessing, no fallbacks. Every failure mode returns a specific error.
async function lookupViaCustomerRates(customerId, serviceCode, weightKg, postcode) {
  if (!serviceCode) return { rate: null, reason: 'no matching weight band' };

  // ── Step 1: weight band from carrier rate card ───────────────────────────────
  const wcRes = await query(`
    SELECT weight_class_name
    FROM dc_weight_classes
    WHERE service_code ILIKE $1
      AND min_weight_kg < $2
      AND max_weight_kg >= $2
    ORDER BY max_weight_kg ASC
    LIMIT 1
  `, [serviceCode, weightKg ?? 0]);

  if (!wcRes.rows.length) {
    return { rate: null, reason: 'no matching weight band' };
  }
  const weightClassName = wcRes.rows[0].weight_class_name;

  // ── Step 2: zone from postcode ───────────────────────────────────────────────
  const zonesRes = await query(`
    SELECT DISTINCT zone_name
    FROM customer_rates
    WHERE customer_id = $1 AND service_code ILIKE $2
  `, [customerId, serviceCode]);

  if (!zonesRes.rows.length) {
    return { rate: null, reason: 'no matching price' };
  }

  const distinctZones = zonesRes.rows.map(r => r.zone_name);
  let zoneName;
  if (distinctZones.length === 1) {
    zoneName = distinctZones[0];
  } else {
    const resolved = await zoneForPostcode(serviceCode, postcode);
    if (!resolved) return { rate: null, reason: 'no matching zone' };
    zoneName = resolved;
  }

  // ── Step 3: sell price from customer rate card ───────────────────────────────
  const priceRes = await query(`
    SELECT id, price, price_sub, zone_name, weight_class_name
    FROM customer_rates
    WHERE customer_id       = $1
      AND service_code ILIKE $2
      AND zone_name    ILIKE $3
      AND weight_class_name = $4
    LIMIT 1
  `, [customerId, serviceCode, zoneName, weightClassName]);

  if (!priceRes.rows.length) {
    return { rate: null, reason: 'no matching price' };
  }

  // ── Step 4: carrier cost from weight_bands (master rate card) ────────────────
  const costRes = await query(`
    SELECT wb.price_first AS carrier_cost, wb.price_sub AS carrier_cost_sub
    FROM weight_bands wb
    JOIN zones z              ON z.id  = wb.zone_id
    JOIN courier_services cs  ON cs.id = z.courier_service_id
    JOIN carrier_rate_cards crc ON crc.id = wb.carrier_rate_card_id
    WHERE cs.service_code ILIKE $1
      AND z.name           ILIKE $2
      AND crc.is_master         = true
      AND wb.min_weight_kg      < $3
      AND wb.max_weight_kg      >= $3
    ORDER BY wb.max_weight_kg ASC
    LIMIT 1
  `, [serviceCode, zoneName, weightKg ?? 0]);

  const carrierCost    = costRes.rows.length ? parseFloat(costRes.rows[0].carrier_cost) : null;
  const carrierCostSub = costRes.rows.length && costRes.rows[0].carrier_cost_sub != null
    ? parseFloat(costRes.rows[0].carrier_cost_sub)
    : null;

  const rateRow = priceRes.rows[0];
  return {
    rate: {
      price:             parseFloat(rateRow.price),
      price_sub:         rateRow.price_sub != null ? parseFloat(rateRow.price_sub) : null,
      zone_name:         rateRow.zone_name,
      weight_class_name: rateRow.weight_class_name,
      cost_price:        carrierCost,
      cost_price_sub:    carrierCostSub,
    },
    reason: null,
  };
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
async function applySurcharges(shipmentId, customerId, basePrice, shipmentData, carrierSurchargeCostTotal = 0) {
  try {
    if (!shipmentId || !customerId) return;

    // Step 1: resolve the courier_id for this shipment.
    // Use the service code (dc_service_id) first — it's structured and accurate.
    // Fall back to the raw courier text field if no service code is available.
    let courierId = null;

    if (shipmentData.dc_service_id) {
      const { rows: svcRows } = await query(
        'SELECT courier_id FROM courier_services WHERE service_code ILIKE $1 LIMIT 1',
        [shipmentData.dc_service_id]
      );
      if (svcRows.length) courierId = svcRows[0].courier_id;
    }

    if (!courierId && shipmentData.courier) {
      const { rows: cRows } = await query(
        `SELECT id FROM couriers WHERE LOWER(code) = LOWER($1) OR LOWER($1) LIKE '%' || LOWER(code) || '%' LIMIT 1`,
        [shipmentData.courier]
      );
      if (cRows.length) courierId = cRows[0].id;
    }

    if (!courierId) return; // can't resolve carrier — skip surcharges

    // Step 2: fetch all active auto-apply surcharges for this carrier
    const { rows: surcharges } = await query(`
      SELECT s.*,
             COALESCE((
               SELECT json_agg(r ORDER BY r.created_at)
               FROM surcharge_rules r
               WHERE r.surcharge_id = s.id AND r.active = true
             ), '[]'::json) AS rules
      FROM surcharges s
      WHERE s.active = true
        AND s.courier_id = $1
        AND (s.applies_when = 'always' OR s.applies_when IS NULL)
        AND (s.effective_date IS NULL OR s.effective_date <= CURRENT_DATE)
    `, [courierId]);

    for (const surcharge of surcharges) {
      const rules = Array.isArray(surcharge.rules) ? surcharge.rules : [];

      // No rules + applies_when='always' → fires on every shipment for this courier.
      // Rules with no filter conditions also fire unconditionally (evaluateSurchargeFilters returns true).
      // Only skip if there are rules and NONE of them match.
      let matched = false;
      if (!rules.length) {
        // No rules configured → applies to all shipments for this courier
        matched = true;
      } else {
        // Any rule match fires the surcharge (OR across rules)
        for (const rule of rules) {
          if (evaluateSurchargeFilters(rule, shipmentData)) { matched = true; break; }
        }
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
        price = parseFloat(((parseFloat(basePrice) || 0) * effectiveValue / 100).toFixed(2));
      } else if (surcharge.charge_per === 'parcel') {
        // Flat per parcel — multiply by parcel count
        price = parseFloat((effectiveValue * (shipmentData.parcel_count || 1)).toFixed(2));
      } else {
        // Flat per shipment
        price = effectiveValue;
      }

      // Carrier cost = default_value (the base rate before any customer markup).
      // For pass-through surcharges this equals the sell price; for marked-up ones it's lower.
      const carrierSurchargePrice = parseFloat(surcharge.default_value || 0);
      let carrierSurchargeCost;
      if (surcharge.calc_type === 'percentage') {
        carrierSurchargeCost = parseFloat(((parseFloat(basePrice) || 0) * carrierSurchargePrice / 100).toFixed(2));
      } else if (surcharge.charge_per === 'parcel') {
        carrierSurchargeCost = parseFloat((carrierSurchargePrice * (shipmentData.parcel_count || 1)).toFixed(2));
      } else {
        carrierSurchargeCost = carrierSurchargePrice;
      }

      await query(`
        INSERT INTO charges
          (shipment_id, customer_id, charge_type, service_name, price, cost_price, price_auto, surcharge_id, parcel_qty)
        VALUES ($1, $2, 'surcharge', $3, $4, $5, true, $6, 1)
      `, [shipmentId, customerId, surcharge.name, price, carrierSurchargeCost, surcharge.id]);
    }

    // ── Fuel group charge ─────────────────────────────────────────────────────
    // If the service has a fuel_group_id set, apply the customer's fuel sell %
    // (from customer_fuel_group_pricing, falling back to standard_sell_pct).
    if (shipmentData.dc_service_id) {
      const fuelRes = await query(`
        SELECT
          fg.id                  AS fuel_group_id,
          fg.name                AS fuel_group_name,
          fg.standard_sell_pct,
          fg.fuel_surcharge_pct  AS carrier_pct,
          cfgp.sell_pct          AS customer_sell_pct
        FROM courier_services cs
        JOIN fuel_groups fg ON fg.id = cs.fuel_group_id
        LEFT JOIN customer_fuel_group_pricing cfgp
               ON cfgp.fuel_group_id = fg.id AND cfgp.customer_id = $2
        WHERE cs.service_code ILIKE $1
        LIMIT 1
      `, [shipmentData.dc_service_id, customerId]);

      if (fuelRes.rows.length) {
        const fg = fuelRes.rows[0];
        const sellPct    = parseFloat(fg.customer_sell_pct ?? fg.standard_sell_pct ?? 0);
        const carrierPct = parseFloat(fg.carrier_pct ?? 0);

        if (sellPct > 0) {
          // Idempotency: one fuel charge per shipment — check by charge_type='fuel'
          const { rows: existingFuel } = await query(
            `SELECT id FROM charges WHERE shipment_id=$1 AND charge_type='fuel'`,
            [shipmentId]
          );

          if (!existingFuel.length) {
            const baseCost    = parseFloat(basePrice) || 0;
            const fuelPrice   = parseFloat((baseCost * sellPct    / 100).toFixed(2));
            const fuelCost    = carrierPct > 0 ? parseFloat((baseCost * carrierPct / 100).toFixed(2)) : null;
            await query(`
              INSERT INTO charges
                (shipment_id, customer_id, charge_type, service_name, price, cost_price, price_auto, parcel_qty)
              VALUES ($1, $2, 'fuel', $3, $4, $5, true, 1)
            `, [shipmentId, customerId, `${fg.fuel_group_name} Fuel`, fuelPrice, fuelCost]);
          }
        }
      }
    }

  } catch (err) {
    console.error('[applySurcharges] error:', err.message);
  }
}

// ─── calcTotal — applies sub-parcel or multi-parcel pricing ──────────────────
// mode 'sub'   (default): price + (qty-1) × price_sub
// mode 'multi':           qty × price_sub  (all boxes at the cheaper rate)
// No price_sub or qty=1:  price × qty  (unchanged)
function calcTotal(rate, qty, mode = 'sub') {
  const n = Math.max(1, parseInt(qty) || 1);
  if (rate.price_sub != null && n > 1) {
    return mode === 'multi'
      ? n * rate.price_sub
      : rate.price + (n - 1) * rate.price_sub;
  }
  return rate.price * n;
}

// Fetch a customer's parcel pricing mode ('sub' | 'multi')
async function getParcelPricingMode(customerId) {
  if (!customerId) return 'sub';
  try {
    const { rows } = await query(
      `SELECT parcel_pricing_mode FROM customers WHERE id = $1`,
      [customerId]
    );
    return rows[0]?.parcel_pricing_mode || 'sub';
  } catch { return 'sub'; }
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

    // ── Intercept: DC tracking payloads with no event_type ───────────────────
    // Dispatch Cloud sends tracking webhooks without an event_type field. They
    // are identified by the tracking_update.parcels structure in the payload.
    // Without this guard they fall through to shipment creation, creating bogus
    // charges and returning action:created instead of updating parcel status.
    const unwrapped = (body.json && typeof body.json === 'object') ? body.json : body;
    const isTrackingPayload =
      (unwrapped.tracking_update && Array.isArray(unwrapped.tracking_update.parcels)) ||
      (payload.tracking_update   && Array.isArray(payload.tracking_update.parcels));

    if (isTrackingPayload) {
      console.log('[billing/webhook] DC tracking payload (no event_type) — forwarding to tracking handler');
      const events  = normaliseTrackingPayload(body);
      const results = [];
      for (const event of events) {
        results.push(await upsertTrackingEvent(event, body));
      }
      return res.json({ ok: true, action: 'tracking_forwarded', processed: results.length, results });
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
    // payload.response may arrive as a pre-parsed object or as a JSON string —
    // handle both so billing.shipping (carrier cost) is always readable.
    const responseParsed = (typeof payload.response === 'object' && payload.response !== null
      ? payload.response
      : safeJson(payload.response)) || {};
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

    // Carrier surcharge cost — from DC billing block (used by applySurcharges until surcharge cost calc moves to rate cards)
    const dcSurchargeCosts          = Array.isArray(billingResp.surcharges) ? billingResp.surcharges : (billingResp.surcharges != null ? [billingResp.surcharges] : []);
    const totalCarrierSurchargeCost = dcSurchargeCosts.reduce((s, c) => s + (parseFloat(c) || 0), 0);

    // Resolve customer:
    //  1. account_number → customers.account_number
    //  2. account_number → customers.dc_customer_id
    //  3. account_number → customers.billing_aliases  (e.g. HOF-0012 stored as alias)
    //  4. customerDcId  → customers.dc_customer_id
    //  5. accountName   → customers.business_name (exact, then partial)
    //  6. accountName   → customers.billing_aliases
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
    // Check billing_aliases against account_number (e.g. legacy HOF- codes stored as aliases)
    if (!customerId && accountNumber) {
      try {
        const crA = await query(
          `SELECT id FROM customers WHERE EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER($1)) LIMIT 1`,
          [accountNumber.trim().toLowerCase()]
        );
        if (crA.rows.length) customerId = crA.rows[0].id;
      } catch (_) {}
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
      } catch (_) {}
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
    const pricingMode = rate ? await getParcelPricingMode(customerId) : 'sub';
    const unitPrice   = rate ? rate.price : null;
    const totalPrice  = unitPrice != null
      ? parseFloat(calcTotal(rate, parcelCount, pricingMode).toFixed(2))
      : null;

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
      rate?.cost_price != null ? (() => {
        const n = Math.max(1, parseInt(parcelCount) || 1);
        const costTotal = rate.cost_price_sub != null && n > 1
          ? rate.cost_price + (n - 1) * rate.cost_price_sub
          : rate.cost_price * n;
        return parseFloat(costTotal.toFixed(2));
      })() : null,
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
    }, totalCarrierSurchargeCost);

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

// ─── GET /api/billing/charges/customer-perf ──────────────────────────────────────────

router.get('/charges/customer-perf', async (req, res, next) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Helper to get stats for a date range
    const getStats = async (fromDate) => {
      const res = await query(`
        SELECT
          COUNT(*)::int AS charges,
          COALESCE(SUM(c.price), 0)::numeric(12,2) AS revenue,
          COALESCE(SUM(c.cost_price), 0)::numeric(12,2) AS cost,
          COALESCE(SUM(c.price) - SUM(c.cost_price), 0)::numeric(12,2) AS profit,
          COALESCE(SUM(c.parcel_qty), COUNT(*))::int AS parcels
        FROM charges c
        WHERE c.customer_id = $1
          AND c.charge_type = 'courier'
          AND c.cancelled = false
          AND c.created_at >= $2
      `, [customerId, fromDate]);
      return res.rows[0] || { charges: 0, revenue: 0, cost: 0, profit: 0, parcels: 0 };
    };

    // Get all-time stats (no date filter)
    const allRes = await query(`
      SELECT
        COUNT(*)::int AS charges,
        COALESCE(SUM(c.price), 0)::numeric(12,2) AS revenue,
        COALESCE(SUM(c.cost_price), 0)::numeric(12,2) AS cost,
        COALESCE(SUM(c.price) - SUM(c.cost_price), 0)::numeric(12,2) AS profit,
        COALESCE(SUM(c.parcel_qty), COUNT(*))::int AS parcels
      FROM charges c
      WHERE c.customer_id = $1
        AND c.charge_type = 'courier'
        AND c.cancelled = false
    `, [customerId]);
    const allStats = allRes.rows[0] || { charges: 0, revenue: 0, cost: 0, profit: 0, parcels: 0 };

    // Get daily breakdown for last 30 days
    const dailyRes = await query(`
      SELECT
        DATE_TRUNC('day', c.created_at)::date AS date,
        COALESCE(SUM(c.price), 0)::numeric(12,2) AS revenue,
        COALESCE(SUM(c.cost_price), 0)::numeric(12,2) AS cost,
        COALESCE(SUM(c.price) - SUM(c.cost_price), 0)::numeric(12,2) AS profit,
        COUNT(*)::int AS charges
      FROM charges c
      WHERE c.customer_id = $1
        AND c.charge_type = 'courier'
        AND c.cancelled = false
        AND c.created_at >= $2
      GROUP BY DATE_TRUNC('day', c.created_at)
      ORDER BY date DESC
    `, [customerId, thirtyDaysAgo]);

    // Get breakdown by courier/service
    const byServiceRes = await query(`
      SELECT
        c.service_name,
        COUNT(*)::int AS charges,
        COALESCE(SUM(c.price), 0)::numeric(12,2) AS revenue,
        COALESCE(SUM(c.cost_price), 0)::numeric(12,2) AS cost,
        COALESCE(SUM(c.price) - SUM(c.cost_price), 0)::numeric(12,2) AS profit
      FROM charges c
      WHERE c.customer_id = $1
        AND c.charge_type = 'courier'
        AND c.cancelled = false
      GROUP BY c.service_name
      ORDER BY revenue DESC
    `, [customerId]);

    const last7 = await getStats(sevenDaysAgo);
    const last30 = await getStats(thirtyDaysAgo);

    res.json({
      last7,
      last30,
      all: allStats,
      daily: dailyRes.rows,
      by_courier: byServiceRes.rows,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/stats ──────────────────────────────────────────

router.get('/charges/stats', async (req, res, next) => {
  try {
    const { customer_id, unassigned, date_from, date_to } = req.query;

    // Courier-only conditions (for charge counts / total value)
    const courierConds = ["c.charge_type = 'courier'", 'c.cancelled = false'];
    // All-charge conditions (for profit — includes surcharge + fuel lines)
    const allConds     = ['c.cancelled = false'];
    const vals  = [];
    let   idx   = 1;

    if (unassigned === 'true') {
      courierConds.push(`c.customer_id IS NULL`);
      allConds.push(`c.customer_id IS NULL`);
    } else if (customer_id) {
      courierConds.push(`c.customer_id = $${idx}`);
      allConds.push(`c.customer_id = $${idx}`);
      idx++; vals.push(customer_id);
    }
    if (date_from) {
      courierConds.push(`c.created_at >= $${idx}`);
      allConds.push(`c.created_at >= $${idx}`);
      idx++; vals.push(date_from);
    }
    if (date_to) {
      courierConds.push(`c.created_at < $${idx}`);
      allConds.push(`c.created_at < $${idx}`);
      idx++; vals.push(date_to);
    }

    const courierWhere = `WHERE ${courierConds.join(' AND ')}`;
    const allWhere     = `WHERE ${allConds.join(' AND ')}`;

    const r = await query(`
      WITH courier_stats AS (
        SELECT
          COUNT(*)::int                                                              AS total_charges,
          SUM(CASE WHEN c.price IS NULL THEN 1 ELSE 0 END)::int                    AS unpriced,
          SUM(CASE WHEN c.billed  THEN 1 ELSE 0 END)::int                          AS billed,
          SUM(CASE WHEN NOT c.billed AND c.price IS NOT NULL THEN 1 ELSE 0 END)::int AS pending,
          SUM(CASE WHEN c.awaiting_reconciliation AND NOT c.billed THEN 1 ELSE 0 END)::int AS awaiting_reconciliation,
          COALESCE(SUM(c.price), 0)::numeric(12,2)                                 AS total_value,
          COALESCE(SUM(CASE WHEN NOT c.billed THEN c.price ELSE 0 END), 0)::numeric(12,2) AS unbilled_value
        FROM charges c
        ${courierWhere}
      ),
      profit_stats AS (
        SELECT
          COALESCE(SUM(c.price),      0)::numeric(12,2) AS gross_sell,
          COALESCE(SUM(c.cost_price), 0)::numeric(12,2) AS gross_cost
        FROM charges c
        ${allWhere}
        AND c.price      IS NOT NULL
        AND c.cost_price IS NOT NULL
      )
      SELECT
        cs.*,
        ps.gross_sell,
        ps.gross_cost,
        (ps.gross_sell - ps.gross_cost)::numeric(12,2)                         AS profit,
        CASE WHEN ps.gross_sell > 0
             THEN ROUND((ps.gross_sell - ps.gross_cost) / ps.gross_sell * 100, 1)
             ELSE 0
        END::numeric(6,1)                                                       AS profit_pct
      FROM courier_stats cs, profit_stats ps
    `, vals);

    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges ─────────────────────────────────────────────────

router.get('/charges', async (req, res, next) => {
  try {
    const {
      charge_type = 'courier',
      customer_id, unassigned, search,
      billed, verified, cancelled,
      date_from, date_to,
      parcel_type,   // 'single' | 'multi' | '' (all)
      unpriced,      // 'true' = price IS NULL
      limit = 50, offset = 0,
    } = req.query;

    const conds = [`c.charge_type = $1`];
    const vals  = [charge_type];
    let   idx   = 2;

    if (unassigned === 'true') { conds.push(`c.customer_id IS NULL`); }
    else if (customer_id) { conds.push(`c.customer_id = $${idx++}`); vals.push(customer_id); }
    if (billed   !== undefined) { conds.push(`c.billed    = $${idx++}`); vals.push(billed   === 'true'); }
    if (verified !== undefined) { conds.push(`c.verified  = $${idx++}`); vals.push(verified === 'true'); }
    if (cancelled !== undefined) { conds.push(`c.cancelled = $${idx++}`); vals.push(cancelled === 'true'); }
    else if (unassigned !== 'true') { conds.push('c.cancelled = false'); } // unassigned view shows all
    if (date_from) { conds.push(`c.created_at >= $${idx++}`); vals.push(date_from); }
    if (date_to)   { conds.push(`c.created_at <  $${idx++}`); vals.push(date_to); }
    if (parcel_type === 'single') { conds.push(`c.parcel_qty = 1`); }
    if (parcel_type === 'multi')  { conds.push(`c.parcel_qty > 1`); }
    if (unpriced === 'true')      { conds.push(`c.price IS NULL`); }
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
          s.id     AS shipment_id,
          s.courier, s.ship_to_postcode, s.ship_to_name,
          s.reference, s.reference_2, s.tracking_codes, s.parcel_count,
          COALESCE((
            SELECT SUM(sc.price) FROM charges sc
            WHERE sc.shipment_id = c.shipment_id
              AND sc.charge_type IN ('surcharge','fuel')
              AND sc.cancelled = false
          ), 0)::numeric(10,4) AS surcharge_total,
          COALESCE((
            SELECT COUNT(*)::int FROM charges sc
            WHERE sc.shipment_id = c.shipment_id
              AND sc.charge_type IN ('surcharge','fuel')
              AND sc.cancelled = false
          ), 0) AS surcharge_count,
          COALESCE((
            SELECT json_agg(json_build_object(
              'type',       sc.charge_type,
              'name',       sc.service_name,
              'price',      sc.price,
              'cost_price', sc.cost_price
            ) ORDER BY sc.charge_type DESC, sc.created_at)
            FROM charges sc
            WHERE sc.shipment_id = c.shipment_id
              AND sc.charge_type IN ('surcharge','fuel')
              AND sc.cancelled = false
          ), '[]'::json) AS charge_lines
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

        const pricingMode = await getParcelPricingMode(customerId);
        const totalPrice  = parseFloat(calcTotal(rate, parcelQty, pricingMode).toFixed(2));

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

// ─── POST /api/billing/remove-surcharge-by-name ──────────────────────────────
// Removes surcharge charge rows whose service_name matches a pattern.
// Used to clean up incorrectly-applied surcharges (e.g. cost-side fuel
// surcharges that were auto-applied when they should be reconciliation-only).
// Body: { name_contains: 'Fuel and Energy' }   — case-insensitive substring match
// Optional: { customer_id: UUID }              — scope to one customer

router.post('/remove-surcharge-by-name', async (req, res, next) => {
  try {
    const { name_contains, customer_id } = req.body;
    if (!name_contains) return res.status(400).json({ error: 'name_contains required' });

    const conds = [`charge_type = 'surcharge'`, `service_name ILIKE $1`, `cancelled = false`];
    const vals  = [`%${name_contains}%`];
    if (customer_id) { conds.push(`customer_id = $2`); vals.push(customer_id); }

    // Soft-cancel rather than hard delete so history is preserved
    const r = await query(`
      UPDATE charges
      SET cancelled = true, updated_at = NOW()
      WHERE ${conds.join(' AND ')}
      RETURNING id
    `, vals);

    res.json({ ok: true, cancelled: r.rows.length, name_contains });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/shipments/:shipmentId/charges ──────────────────────────
// Returns surcharge + fuel charges for one shipment. Used by Finance page hover tooltip.

router.get('/shipments/:shipmentId/charges', async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const { rows } = await query(`
      SELECT id, charge_type, service_name AS name, price
      FROM charges
      WHERE shipment_id = $1
        AND charge_type IN ('surcharge', 'fuel')
        AND cancelled = false
      ORDER BY charge_type, created_at
    `, [shipmentId]);
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── POST /api/billing/batch-apply-surcharges ────────────────────────────────
// Re-run applySurcharges on all existing courier charges.
// Safe to call multiple times — applySurcharges is idempotent (skips if
// the surcharge charge already exists for that shipment).
// Optional query param: ?customer_id=UUID to scope to one customer.

router.post('/batch-apply-surcharges', async (req, res, next) => {
  try {
    const { customer_id, courier_code } = req.query;

    // Fetch all non-cancelled courier charges with their shipment data
    const conds = [`c.charge_type = 'courier'`, `c.cancelled = false`, `c.price IS NOT NULL`, `s.courier IS NOT NULL`];
    const vals  = [];
    if (customer_id) { vals.push(customer_id); conds.push(`c.customer_id = $${vals.length}`); }
    if (courier_code) { vals.push(courier_code); conds.push(`(LOWER(s.courier) = LOWER($${vals.length}) OR LOWER(s.courier) LIKE '%' || LOWER($${vals.length}) || '%')`); }

    const { rows } = await query(`
      SELECT
        c.id AS charge_id,
        c.shipment_id,
        c.customer_id,
        c.price AS base_price,
        s.courier,
        s.dc_service_id,
        s.service_name,
        s.ship_from_country_iso,
        s.ship_to_country_iso,
        s.ship_to_postcode,
        s.parcel_count,
        s.total_weight_kg,
        s.parcel_weight_kg,
        s.dim_length_cm,
        s.dim_width_cm,
        s.dim_height_cm,
        s.total_declared_value,
        s.parcel_declared_value
      FROM charges c
      JOIN shipments s ON s.id = c.shipment_id
      WHERE ${conds.join(' AND ')}
      ORDER BY c.created_at ASC
    `, vals);

    let applied    = 0;
    let skipped    = 0;
    let errors     = 0;
    let firstError = null;

    for (const row of rows) {
      try {
        const before = await query(
          `SELECT COUNT(*)::int AS cnt FROM charges WHERE shipment_id = $1 AND charge_type IN ('surcharge','fuel') AND cancelled = false`,
          [row.shipment_id]
        );

        await applySurcharges(row.shipment_id, row.customer_id, parseFloat(row.base_price || 0), {
          courier:               row.courier,
          dc_service_id:         row.dc_service_id,
          service_name:          row.service_name,
          ship_from_country_iso: row.ship_from_country_iso,
          ship_to_country_iso:   row.ship_to_country_iso,
          ship_to_postcode:      row.ship_to_postcode,
          parcel_count:          row.parcel_count || 1,
          total_weight_kg:       row.total_weight_kg,
          parcel_weight_kg:      row.parcel_weight_kg,
          dim_length_cm:         row.dim_length_cm,
          dim_width_cm:          row.dim_width_cm,
          dim_height_cm:         row.dim_height_cm,
          total_declared_value:  row.total_declared_value,
          parcel_declared_value: row.parcel_declared_value,
        });

        const after = await query(
          `SELECT COUNT(*)::int AS cnt FROM charges WHERE shipment_id = $1 AND charge_type IN ('surcharge','fuel') AND cancelled = false`,
          [row.shipment_id]
        );

        if (after.rows[0].cnt > before.rows[0].cnt) applied++;
        else skipped++;

      } catch (err) {
        errors++;
        if (!firstError) firstError = err.message;
        console.error(`[batch-apply-surcharges] shipment ${row.shipment_id}:`, err.message);
      }
    }

    res.json({ ok: true, total_charges: rows.length, surcharges_applied: applied, already_had_surcharges: skipped, errors, first_error: firstError });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/surcharge-debug/:shipmentId ────────────────────────────
// Shows exactly why surcharges did/didn't fire for a shipment.
// Compares shipment.courier against couriers.code and lists matching surcharges.

router.get('/surcharge-debug/:shipmentId', async (req, res, next) => {
  try {
    const { shipmentId } = req.params;

    // Get the shipment
    const { rows: shipRows } = await query(
      `SELECT id, courier, dc_service_id, service_name, ship_to_postcode,
              total_weight_kg, parcel_count, customer_id
       FROM shipments WHERE id = $1`,
      [shipmentId]
    );
    if (!shipRows.length) return res.status(404).json({ error: 'Shipment not found' });
    const ship = shipRows[0];

    // Show all couriers in the DB and whether they match
    const { rows: couriers } = await query(`SELECT id, code, name FROM couriers ORDER BY name`);
    const courierMatch = couriers.map(c => ({
      ...c,
      matches: c.code.toLowerCase() === (ship.courier || '').toLowerCase(),
    }));

    // Fetch the surcharges that WOULD be found with this courier string
    const { rows: matchingSurcharges } = await query(`
      SELECT s.id, s.code, s.name, s.applies_when, s.active,
             c.code AS courier_code,
             LOWER(c.code) = LOWER($1) AS code_match,
             COALESCE((
               SELECT json_agg(r ORDER BY r.created_at)
               FROM surcharge_rules r
               WHERE r.surcharge_id = s.id AND r.active = true
             ), '[]'::json) AS rules
      FROM surcharges s
      JOIN couriers c ON c.id = s.courier_id
      ORDER BY c.name, s.name
    `, [ship.courier]);

    const willFire = matchingSurcharges.filter(s =>
      s.active && s.code_match && (s.applies_when === 'always' || s.applies_when === null)
    );
    const wonFire = matchingSurcharges.filter(s =>
      !s.code_match || !s.active || (s.applies_when !== 'always' && s.applies_when !== null)
    );

    // Check existing surcharge charges on this shipment
    const { rows: existingCharges } = await query(
      `SELECT c.id, c.charge_type, c.service_name, c.price, c.surcharge_id, c.cancelled
       FROM charges c
       WHERE c.shipment_id = $1 AND c.charge_type IN ('surcharge', 'fuel')
       ORDER BY c.created_at`,
      [shipmentId]
    );

    res.json({
      shipment: {
        id:           ship.id,
        courier:      ship.courier,
        dc_service_id: ship.dc_service_id,
        postcode:     ship.ship_to_postcode,
        weight_kg:    ship.total_weight_kg,
        parcel_count: ship.parcel_count,
        customer_id:  ship.customer_id,
      },
      courier_match_analysis: {
        shipment_courier_value: ship.courier,
        couriers_in_db: courierMatch,
        note: 'The billing engine matches: LOWER(couriers.code) = LOWER(shipments.courier)',
      },
      surcharges: {
        will_fire:  willFire,
        wont_fire:  wonFire,
      },
      existing_surcharge_charges: existingCharges,
    });
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
      customer_found: !!customerId,
      customer_name: customerName,
    });

    if (!customerId) {
      trace.conclusion = { priced: false, reason: 'No customer matched' };
      return res.json(trace);
    }

    // ── Step 3: Rate card search ───────────────────────────────────────────────
    // Title: "<service_code> / <service_name>"
    // Shows every zone and weight band in the customer's rate card for this service,
    // with a ✓/✗ indicating whether this shipment matches each one.
    const serviceTitle = [dcServiceId, serviceName].filter(Boolean).join(' / ') || 'Unknown service';

    // All customer_rates rows for this customer + service
    const allRatesRes = await query(`
      SELECT DISTINCT cr.zone_name, cr.weight_class_name, cr.price, cr.price_sub
      FROM customer_rates cr
      WHERE cr.customer_id = $1 AND cr.service_code ILIKE $2
      ORDER BY cr.zone_name, cr.weight_class_name
    `, [customerId, dcServiceId || '']);

    if (!allRatesRes.rows.length) {
      trace.steps.push({
        step: 3,
        title: serviceTitle,
        error: 'no matching price — no customer_rates rows for this service',
        zones: [],
        weight_bands: [],
      });
      trace.conclusion = { priced: false, reason: 'no matching price' };
      return res.json(trace);
    }

    // Resolve weight band from carrier rate card (dc_weight_classes)
    const wcRes = await query(`
      SELECT weight_class_name, min_weight_kg, max_weight_kg
      FROM dc_weight_classes
      WHERE service_code ILIKE $1
        AND min_weight_kg < $2 AND max_weight_kg >= $2
      ORDER BY max_weight_kg ASC LIMIT 1
    `, [dcServiceId || '', weightPerParcel ?? 0]);
    const resolvedBand = wcRes.rows.length ? wcRes.rows[0].weight_class_name : null;

    // All distinct weight bands in dc_weight_classes for this service
    const allBandsRes = await query(`
      SELECT DISTINCT weight_class_name, min_weight_kg, max_weight_kg
      FROM dc_weight_classes
      WHERE service_code ILIKE $1
      ORDER BY min_weight_kg ASC NULLS LAST
    `, [dcServiceId || '']);

    // Resolve zone from postcode
    const distinctZones = [...new Set(allRatesRes.rows.map(r => r.zone_name))];
    let resolvedZone = null;
    if (distinctZones.length === 1) {
      resolvedZone = distinctZones[0];
    } else {
      resolvedZone = await zoneForPostcode(dcServiceId, postcode);
    }

    // Build zone checks (✓/✗)
    const zoneChecks = distinctZones.map(z => ({
      zone_name: z,
      matched: z === resolvedZone,
    }));

    // Build weight band checks (✓/✗) — use bands from dc_weight_classes
    const bandChecks = allBandsRes.rows.map(b => ({
      weight_class_name: b.weight_class_name,
      min_weight_kg: b.min_weight_kg != null ? parseFloat(b.min_weight_kg) : null,
      max_weight_kg: b.max_weight_kg != null ? parseFloat(b.max_weight_kg) : null,
      matched: b.weight_class_name === resolvedBand,
    }));

    trace.steps.push({
      step: 3,
      title: serviceTitle,
      zones: zoneChecks,
      weight_bands: bandChecks,
      resolved_zone: resolvedZone,
      resolved_band: resolvedBand,
    });

    if (!resolvedBand) {
      trace.conclusion = { priced: false, reason: 'no matching weight band' };
      return res.json(trace);
    }
    if (!resolvedZone) {
      trace.conclusion = { priced: false, reason: 'no matching zone' };
      return res.json(trace);
    }

    // ── Step 4: Base price ─────────────────────────────────────────────────────
    const priceRes = await query(`
      SELECT price, price_sub, zone_name, weight_class_name
      FROM customer_rates
      WHERE customer_id = $1
        AND service_code ILIKE $2
        AND zone_name ILIKE $3
        AND weight_class_name = $4
      LIMIT 1
    `, [customerId, dcServiceId || '', resolvedZone, resolvedBand]);

    if (!priceRes.rows.length) {
      trace.steps.push({
        step: 4,
        title: 'Base price',
        error: 'no matching price',
      });
      trace.conclusion = { priced: false, reason: 'no matching price' };
      return res.json(trace);
    }

    const priceRow    = priceRes.rows[0];
    const priceFirst  = parseFloat(priceRow.price);
    const priceSub    = priceRow.price_sub != null ? parseFloat(priceRow.price_sub) : null;
    const pricingMode = await getParcelPricingMode(customerId);
    const totalBase   = parseFloat(calcTotal({ price: priceFirst, price_sub: priceSub }, parcelQty, pricingMode).toFixed(2));

    trace.steps.push({
      step: 4,
      title: 'Base price',
      zone: resolvedZone,
      weight_band: resolvedBand,
      price_per_parcel: priceFirst,
      price_sub: priceSub,
      parcel_count: parcelQty,
      pricing_mode: pricingMode,
      total_base: totalBase,
    });

    // ── Step 5: Surcharges ─────────────────────────────────────────────────────
    // Simulate applySurcharges — same logic but diagnostic-only, no DB inserts.
    let courierId = null;
    const svcCourierRes = await query(
      'SELECT courier_id FROM courier_services WHERE service_code ILIKE $1 LIMIT 1',
      [dcServiceId || '']
    );
    if (svcCourierRes.rows.length) courierId = svcCourierRes.rows[0].courier_id;

    const surchargeLines = [];
    let totalSurcharges  = 0;
    let fuelResult       = null;

    if (courierId) {
      const { rows: surcharges } = await query(`
        SELECT s.*,
               COALESCE((
                 SELECT json_agg(r ORDER BY r.created_at)
                 FROM surcharge_rules r
                 WHERE r.surcharge_id = s.id AND r.active = true
               ), '[]'::json) AS rules
        FROM surcharges s
        WHERE s.active = true
          AND s.courier_id = $1
          AND (s.applies_when = 'always' OR s.applies_when IS NULL)
          AND (s.effective_date IS NULL OR s.effective_date <= CURRENT_DATE)
      `, [courierId]);

      const shipmentData = {
        dc_service_id: dcServiceId,
        parcel_count:  parcelQty,
        weight_kg:     weightPerParcel,
        postcode,
        zone_name:     resolvedZone,
      };

      for (const surcharge of surcharges) {
        const rules = Array.isArray(surcharge.rules) ? surcharge.rules : [];
        let matched = false;
        let matchReason = '';

        if (!rules.length) {
          matched = true;
          matchReason = 'applies to all shipments';
        } else {
          for (const rule of rules) {
            if (evaluateSurchargeFilters(rule, shipmentData)) { matched = true; break; }
          }
          matchReason = matched ? 'filter rule matched' : 'no filter rules matched';
        }

        // Customer override
        const { rows: overrides } = await query(
          `SELECT override_value FROM customer_surcharge_overrides
           WHERE customer_id=$1 AND surcharge_id=$2 AND active=true`,
          [customerId, surcharge.id]
        );
        const effectiveValue = overrides.length
          ? parseFloat(overrides[0].override_value)
          : parseFloat(surcharge.default_value);
        const valueSource = overrides.length ? 'customer override' : 'standard rate';

        let price = 0;
        let calcDesc = '';
        if (surcharge.calc_type === 'percentage') {
          price    = parseFloat(((totalBase || 0) * effectiveValue / 100).toFixed(2));
          calcDesc = `${effectiveValue}% of £${totalBase.toFixed(2)}`;
        } else if (surcharge.charge_per === 'parcel') {
          price    = parseFloat((effectiveValue * (parcelQty || 1)).toFixed(2));
          calcDesc = `£${effectiveValue.toFixed(2)} × ${parcelQty} parcel${parcelQty !== 1 ? 's' : ''}`;
        } else {
          price    = parseFloat(effectiveValue.toFixed(2));
          calcDesc = `£${effectiveValue.toFixed(2)} flat`;
        }

        if (matched) totalSurcharges += price;

        surchargeLines.push({
          name:         surcharge.name,
          matched,
          reason:       matchReason,
          value_source: matched ? valueSource : undefined,
          calc:         matched ? calcDesc    : undefined,
          price:        matched ? price       : undefined,
        });
      }

      // Fuel surcharge
      const fuelRes = await query(`
        SELECT
          fg.name            AS fuel_group_name,
          fg.standard_sell_pct,
          cfgp.sell_pct      AS customer_sell_pct
        FROM courier_services cs
        JOIN fuel_groups fg ON fg.id = cs.fuel_group_id
        LEFT JOIN customer_fuel_group_pricing cfgp
               ON cfgp.fuel_group_id = fg.id AND cfgp.customer_id = $2
        WHERE cs.service_code ILIKE $1
        LIMIT 1
      `, [dcServiceId || '', customerId]);

      if (fuelRes.rows.length) {
        const fg      = fuelRes.rows[0];
        const sellPct = parseFloat(fg.customer_sell_pct ?? fg.standard_sell_pct ?? 0);
        if (sellPct > 0) {
          const fuelPrice = parseFloat(((totalBase || 0) * sellPct / 100).toFixed(2));
          fuelResult = {
            fuel_group: fg.fuel_group_name,
            rate_type:  fg.customer_sell_pct != null ? 'customer-specific' : 'standard',
            pct:        sellPct,
            base:       totalBase,
            price:      fuelPrice,
          };
          totalSurcharges += fuelPrice;
        }
      }
    }

    trace.steps.push({
      step: 5,
      title: 'Surcharges',
      surcharges: surchargeLines,
      fuel: fuelResult,
      total_surcharges: parseFloat(totalSurcharges.toFixed(2)),
    });

    // ── Conclusion ─────────────────────────────────────────────────────────────
    const grandTotal = parseFloat((totalBase + totalSurcharges).toFixed(2));
    const conclusionLines = [
      ...surchargeLines.filter(s => s.matched).map(s => ({ name: s.name, price: s.price })),
      ...(fuelResult ? [{ name: `${fuelResult.fuel_group} Fuel (${fuelResult.pct}%)`, price: fuelResult.price }] : []),
    ];

    trace.conclusion = {
      priced:           true,
      base_price:       totalBase,
      surcharge_lines:  conclusionLines,
      total:            grandTotal,
      zone_name:        resolvedZone,
      weight_class_name: resolvedBand,
    };

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

    const pricingMode = await getParcelPricingMode(row.customer_id);
    const totalPrice  = parseFloat(calcTotal(rate, parcelQty, pricingMode).toFixed(2));

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

// ─── GET /api/billing/settings ───────────────────────────────────────────────

router.get('/settings', async (req, res, next) => {
  try {
    const r = await query(`SELECT * FROM billing_settings WHERE id = 1`);
    res.json(r.rows[0] || {});
  } catch (err) { next(err); }
});

// ─── PUT /api/billing/settings ────────────────────────────────────────────────

router.put('/settings', async (req, res, next) => {
  try {
    const {
      billing_day_of_week,
      billing_hour,
      billing_minute,
      fortnightly_parity,
      monthly_billing_date,
      enabled,
    } = req.body;

    const r = await query(`
      UPDATE billing_settings SET
        billing_day_of_week  = COALESCE($1, billing_day_of_week),
        billing_hour         = COALESCE($2, billing_hour),
        billing_minute       = COALESCE($3, billing_minute),
        fortnightly_parity   = COALESCE($4, fortnightly_parity),
        monthly_billing_date = COALESCE($5, monthly_billing_date),
        enabled              = COALESCE($6, enabled),
        updated_at           = NOW()
      WHERE id = 1
      RETURNING *
    `, [
      billing_day_of_week  ?? null,
      billing_hour         ?? null,
      billing_minute       ?? null,
      fortnightly_parity   ?? null,
      monthly_billing_date ?? null,
      enabled              ?? null,
    ]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── POST /api/billing/run-cycle ─────────────────────────────────────────────
// Moves verified, unbilled charges to awaiting_reconciliation for all customers
// whose billing cycle is due on the given date (defaults to today).
// Called automatically by the Saturday midnight scheduled job.
// Can also be triggered manually for testing.
//
// Billing cycle rules:
//   weekly      → runs every Saturday
//   fortnightly → runs every other Saturday (based on weeks since epoch)
//   monthly     → runs on the 1st of each month (or nearest Saturday if desired)

// Exported so index.js scheduler can call it directly without going through HTTP
export async function runBillingCycle(runDate = new Date(), { fortnightlyParity = 0 } = {}) {
  const weeksSinceEpoch   = Math.floor(runDate.getTime() / (7 * 24 * 3600 * 1000));
  const isFortnightlyWeek = (weeksSinceEpoch % 2) === fortnightlyParity;
  const dayOfWeek         = runDate.getDay();

  // Fetch billing settings to get the configured billing day
  const settingsRes = await query(`SELECT * FROM billing_settings WHERE id = 1`);
  const settings = settingsRes.rows[0] || {};
  const billingDay = settings.billing_day_of_week ?? 6;

  const dueCycles = [];
  if (dayOfWeek === billingDay) {
    dueCycles.push('weekly');
    if (isFortnightlyWeek) dueCycles.push('fortnightly');
  }
  if (runDate.getDate() === (settings.monthly_billing_date ?? 1)) {
    dueCycles.push('monthly');
  }

  if (dueCycles.length === 0) {
    return { ok: true, message: 'No billing cycles due today', due_cycles: [], customers_processed: 0, charges_queued: 0 };
  }

  const custRes = await query(`
    SELECT id, account_number, business_name, billing_cycle
    FROM customers
    WHERE billing_cycle = ANY($1) AND account_status = 'active'
  `, [dueCycles]);

  let totalCharged = 0;
  const results = [];

  for (const customer of custRes.rows) {
    const upd = await query(`
      UPDATE charges
      SET awaiting_reconciliation = true, updated_at = NOW()
      WHERE customer_id           = $1
        AND verified               = true
        AND billed                 = false
        AND awaiting_reconciliation = false
        AND cancelled              = false
    `, [customer.id]);

    totalCharged += upd.rowCount;
    if (upd.rowCount > 0) {
      results.push({ customer_id: customer.id, account: customer.account_number, name: customer.business_name, charges_queued: upd.rowCount });
    }
  }

  return {
    ok:                  true,
    run_date:            runDate.toISOString().split('T')[0],
    due_cycles:          dueCycles,
    customers_processed: custRes.rows.length,
    charges_queued:      totalCharged,
    details:             results,
  };
}

router.post('/billing/run-cycle', async (req, res, next) => {
  try {
    const runDate = req.body?.date ? new Date(req.body.date) : new Date();
    const result  = await runBillingCycle(runDate);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── GET /api/billing/invoices ────────────────────────────────────────────────

router.get('/invoices', async (req, res, next) => {
  try {
    const { customer_id, status, date_from, date_to, limit = 50, offset = 0 } = req.query;
    const conds = [];
    const vals  = [];
    let   idx   = 1;

    if (customer_id) { conds.push(`i.customer_id = $${idx++}`); vals.push(customer_id); }
    if (status)      { conds.push(`i.status = $${idx++}`);      vals.push(status); }
    if (date_from)   { conds.push(`i.created_at >= $${idx++}`); vals.push(date_from); }
    if (date_to)     { conds.push(`i.created_at <  $${idx++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*)::int FROM invoices i ${where}`, vals);
    const rows = await query(`
      SELECT i.*, c.business_name, c.account_number
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      ${where}
      ORDER BY i.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...vals, parseInt(limit), parseInt(offset)]);

    res.json({ total: countRes.rows[0].count, invoices: rows.rows });
  } catch (err) { next(err); }
});

// ─── POST /api/billing/invoices ───────────────────────────────────────────────
// Creates an invoice from a customer's awaiting_reconciliation charges.
// Assigns the next sequential invoice number: {account_number}-{00001}.

router.post('/invoices', async (req, res, next) => {
  try {
    const { customer_id, period_start, period_end } = req.body;
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' });

    // Load customer
    const custRes = await query(`SELECT id, account_number, business_name, billing_cycle FROM customers WHERE id = $1`, [customer_id]);
    if (!custRes.rows.length) return res.status(404).json({ error: 'Customer not found' });
    const customer = custRes.rows[0];

    // Get charges to invoice — awaiting_reconciliation, not yet billed
    const chargeFilter = period_start && period_end
      ? `AND c.created_at >= $2 AND c.created_at < $3`
      : '';
    const chargeVals = period_start && period_end
      ? [customer_id, period_start, period_end]
      : [customer_id];

    const chargesRes = await query(`
      SELECT id, charge_type, price, cost_price, order_id, parcel_qty, service_name
      FROM charges
      WHERE customer_id             = $1
        AND awaiting_reconciliation = true
        AND billed                  = false
        AND cancelled               = false
        ${chargeFilter}
    `, chargeVals);

    if (!chargesRes.rows.length) {
      return res.status(400).json({ error: 'No awaiting_reconciliation charges found for this customer' });
    }

    const charges = chargesRes.rows;

    // Calculate totals
    const subtotal  = charges.reduce((s, c) => s + parseFloat(c.price      || 0), 0);
    const costTotal = charges.reduce((s, c) => s + parseFloat(c.cost_price || 0), 0);
    const vatTotal  = parseFloat((subtotal * 0.20).toFixed(2));
    const total     = parseFloat((subtotal + vatTotal).toFixed(2));
    const profit    = parseFloat((subtotal - costTotal).toFixed(2));
    const profitPct = subtotal > 0 ? parseFloat((profit / subtotal * 100).toFixed(1)) : 0;

    // Get next invoice sequence number (atomic increment)
    const seqRes = await query(`
      INSERT INTO invoice_sequences (customer_id, next_seq) VALUES ($1, 2)
      ON CONFLICT (customer_id) DO UPDATE
        SET next_seq = invoice_sequences.next_seq + 1
      RETURNING next_seq - 1 AS seq
    `, [customer_id]);
    const seq = seqRes.rows[0].seq;
    const invoiceNumber = `${customer.account_number}-${String(seq).padStart(5, '0')}`;

    // Create invoice
    const invRes = await query(`
      INSERT INTO invoices
        (customer_id, account_number, customer_name, invoice_number,
         period_start, period_end,
         subtotal, vat_total, total, cost_total, profit, profit_pct,
         billing_cycle, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'awaiting_reconciliation')
      RETURNING *
    `, [
      customer_id, customer.account_number, customer.business_name, invoiceNumber,
      period_start || null, period_end || null,
      subtotal.toFixed(2), vatTotal.toFixed(2), total.toFixed(2),
      costTotal.toFixed(2), profit.toFixed(2), profitPct,
      customer.billing_cycle,
    ]);
    const invoice = invRes.rows[0];

    // Link charges to invoice and mark billed
    const chargeIds = charges.map(c => c.id);
    await query(`
      UPDATE charges
      SET invoice_id = $1,
          billed     = true,
          updated_at = NOW()
      WHERE id = ANY($2)
    `, [invoice.id, chargeIds]);

    res.json({ ok: true, invoice, charges_billed: chargeIds.length });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/invoices/:id/csv ───────────────────────────────────────
// Returns CSV backing data for an invoice: order_id, qty, service, price

router.get('/invoices/:id/csv', async (req, res, next) => {
  try {
    const invRes = await query(`SELECT * FROM invoices WHERE id = $1`, [req.params.id]);
    if (!invRes.rows.length) return res.status(404).json({ error: 'Invoice not found' });
    const invoice = invRes.rows[0];

    const chargesRes = await query(`
      SELECT order_id, parcel_qty, service_name, charge_type, price, cost_price, created_at
      FROM charges
      WHERE invoice_id = $1 AND cancelled = false
      ORDER BY created_at ASC, charge_type ASC
    `, [req.params.id]);

    const lines = ['Order ID,Quantity,Service,Net Price (£),VAT (£),Gross Price (£)'];
    for (const c of chargesRes.rows) {
      const net   = parseFloat(c.price || 0);
      const vat   = parseFloat((net * 0.20).toFixed(2));
      const gross = parseFloat((net + vat).toFixed(2));
      lines.push([
        c.order_id || '',
        c.parcel_qty || 1,
        c.service_name || c.charge_type,
        net.toFixed(2),
        vat.toFixed(2),
        gross.toFixed(2),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

export default router;
