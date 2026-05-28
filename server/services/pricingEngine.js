/**
 * Moov OS — Pricing Engine  (Webhook / Charge Creation)
 *
 * "Gospel" flow per charge:
 *   1. Weight        — max(physical, volumetric) using service.volumetric_divisor
 *   2. Cost price    — lookupCarrierBandCost (two-pass; same logic as reconciliation engine)
 *   3. Sell price    — lookupCustomerSellPrice (same exclusive-lower-bound boundary convention)
 *   4. Dual fuel     — carrier_fuel_pct applied to cost; customer_fuel_pct applied to sell
 *   5. Trace         — pricing_logic_trace JSONB stored on every base-rate charge
 *
 * Band boundary convention (consistent with reconciliation engine and billing.js):
 *   lower bound  EXCLUSIVE  →  weight  >  COALESCE(min_weight_kg, 0)
 *   upper bound  INCLUSIVE  →  weight  <= max_weight_kg
 *
 * If weight is EXACTLY on a band boundary it stays in the CURRENT (lower) band.
 * e.g. a 1–1.5kg band: exactly 1.5kg uses this band, not the next one.
 *
 * Two-pass cost lookup:
 *   Pass 1 — weight fits within a finite band  (weight > min, weight <= max)
 *   Pass 2 — weight exceeds every ceiling band  →  price_first + overageKg × cost_per_kg
 */

import { query } from '../db/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n) { return Math.round(n * 100) / 100; }

/** Resolve a dot-notation path like "ship_to.country_iso" or "parcels[0].weight" */
function resolvePath(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  return parts.reduce((curr, part) => (curr == null ? undefined : curr[part]), obj);
}

function evalCondition(condition, payload) {
  const actual   = resolvePath(payload, condition.json_field_path);
  const expected = condition.value;
  if (actual == null) return false;
  const actualStr = String(actual).trim();
  const actualNum = parseFloat(actual);
  switch (condition.operator) {
    case 'equals':                return actualStr === expected;
    case 'not_equals':            return actualStr !== expected;
    case 'greater_than':          return actualNum > parseFloat(expected);
    case 'less_than':             return actualNum < parseFloat(expected);
    case 'greater_than_or_equal': return actualNum >= parseFloat(expected);
    case 'less_than_or_equal':    return actualNum <= parseFloat(expected);
    case 'in':                    return expected.split(',').map(s => s.trim()).includes(actualStr);
    case 'not_in':                return !expected.split(',').map(s => s.trim()).includes(actualStr);
    case 'starts_with':           return actualStr.startsWith(expected);
    case 'contains':              return actualStr.includes(expected);
    default:                      return false;
  }
}

function evalRule(conditions, payload) {
  if (!conditions.length) return false;
  let result = evalCondition(conditions[0], payload);
  for (let i = 1; i < conditions.length; i++) {
    const c = conditions[i];
    const val = evalCondition(c, payload);
    result = c.logic_operator === 'OR' ? (result || val) : (result && val);
  }
  return result;
}

function outcodeOf(postcode) {
  if (!postcode) return '';
  return postcode.trim().split(' ')[0].toUpperCase();
}

// ─── Zone matching — strict, no catch-alls ───────────────────────────────────
//
// Resolution rules (in priority order):
//   1. Zone MUST have an explicit zone_country_codes entry for the destination
//      country.  Zones with no country codes are never used.
//   2. If ANY zone for this service+country has 'include' postcode rules the
//      service is treated as postcode-routed.  In that mode:
//        • The outcode MUST match an include rule in exactly one zone.
//        • Zones that have no include rules are NOT used as catch-alls.
//   3. If NO zone has include rules (international / country-only services)
//      a country-code match alone is sufficient.
//   4. 'exclude' rules always skip a zone regardless of includes.
//
// Zones are queried with those that have the most include rules first so the
// most-specific match wins.
//
// EXPORTED — billing.js diagnostic calls this same function so diagnostic
// and live engine are guaranteed identical behaviour.

export async function matchZone(serviceId, countryIso, postcode) {
  const outcode = outcodeOf(postcode);

  const zones = await query(
    `SELECT z.id, z.name,
       array_agg(DISTINCT zcc.country_iso) FILTER (WHERE zcc.id IS NOT NULL) AS countries,
       json_agg(jsonb_build_object('prefix', zpr.postcode_prefix, 'type', zpr.rule_type))
         FILTER (WHERE zpr.id IS NOT NULL) AS postcode_rules
     FROM zones z
     LEFT JOIN zone_country_codes zcc ON zcc.zone_id = z.id
     LEFT JOIN zone_postcode_rules zpr ON zpr.zone_id = z.id
     WHERE z.courier_service_id = $1
     GROUP BY z.id
     ORDER BY (
       SELECT COUNT(*) FROM zone_postcode_rules
       WHERE zone_id = z.id AND rule_type = 'include'
     ) DESC, z.name`,
    [serviceId]
  );

  // Only consider zones that explicitly list the destination country.
  const compatZones = zones.rows.filter(z => (z.countries || []).includes(countryIso));

  for (const zone of compatZones) {
    const rules        = zone.postcode_rules || [];
    const includeRules = rules.filter(r => r.type === 'include');
    const excludeRules = rules.filter(r => r.type === 'exclude');

    // Exclusions always win — checked first regardless of rule type.
    if (excludeRules.some(r => outcode.startsWith(r.prefix))) continue;

    if (includeRules.length > 0) {
      // Zone has explicit include rules: outcode MUST match one.
      // e.g. "Highlands zone" lists IV, KW, HS, PA, etc.
      if (!includeRules.some(r => outcode.startsWith(r.prefix))) continue;
      return zone;                                     // ← explicit include match
    }

    // Zone has NO include rules.
    // Two valid patterns reach here:
    //   • Exclude-only zone ("Mainland UK — everywhere except Highlands"):
    //     the outcode wasn't excluded above, so it belongs here.
    //   • No-rule zone (international service — country code is the only selector).
    // Both are valid matches — return the zone.
    return zone;                                       // ← exclude-only or country-only match
  }

  return null;
}

// Convenience wrapper: resolves serviceId from a service code string and
// returns the matched zone NAME (string) or null.
// Used by billing.js diagnostic so both paths call the same matchZone logic.
export async function resolveZoneNameByServiceCode(serviceCode, countryIso, postcode) {
  if (!serviceCode || !countryIso) return null;
  const svcRes = await query(
    'SELECT id FROM courier_services WHERE service_code ILIKE $1 LIMIT 1',
    [serviceCode]
  );
  if (!svcRes.rows.length) return null;
  const zone = await matchZone(svcRes.rows[0].id, countryIso || 'GB', postcode);
  return zone ? zone.name : null;
}

// ─── Step 1: Weight ───────────────────────────────────────────────────────────
// Returns physical_kg, volumetric_kg, charged_kg, and the divisor used.
// Both weights are stored in the trace so the reason for the chosen weight
// is always auditable.

async function calcWeight(serviceId, parcel) {
  const physicalKg = round2(parseFloat(parcel.weight) || 0);

  const svcRes = await query(
    `SELECT volumetric_divisor FROM courier_services WHERE id = $1`,
    [serviceId]
  );
  const divisor = svcRes.rows.length
    ? parseInt(svcRes.rows[0].volumetric_divisor || 0, 10)
    : 0;

  let volumetricKg = 0;
  if (divisor > 0) {
    const l = parseFloat(parcel.dim_length || parcel.length || 0);
    const w = parseFloat(parcel.dim_width  || parcel.width  || 0);
    const h = parseFloat(parcel.dim_height || parcel.height || 0);
    if (l > 0 && w > 0 && h > 0) {
      volumetricKg = round2((l * w * h) / divisor);
    }
  }

  const chargedKg   = volumetricKg > physicalKg ? volumetricKg : physicalKg;
  const weightBasis = volumetricKg > physicalKg ? 'volumetric' : 'physical';

  return {
    physicalKg,
    volumetricKg,
    chargedKg,
    volumetricDivisor: divisor || null,
    weightBasis,
  };
}

// ─── Step 2: Cost price — two-pass carrier band lookup ────────────────────────
//
// Mirrors reconciliationEngine.lookupCarrierBandCost exactly.
//
// Pass 1 — weight sits within a band's finite ceiling:
//   weight >  COALESCE(min_weight_kg, 0)  (exclusive lower)
//   weight <= max_weight_kg               (inclusive upper — on boundary → stays in this band)
//   max_weight_kg IS NOT NULL             (finite bands only — open-ended bands block Pass 2 if included)
//
// Pass 2 — weight exceeds every ceiling:
//   Finds the band with the highest finite max, then:
//   cost = price_first + (weight - max) × cost_per_kg
//
// Returns { cost, pass, overageKg, bandLabel } or null if no band configured.

export async function lookupCarrierBandCost(serviceId, weightKg, zoneId) {
  if (!serviceId || !(weightKg > 0)) return null;

  // Pass 1
  const p1 = zoneId
    ? await query(`
        SELECT wb.id, wb.price_first, wb.price_sub,
               wb.cost_per_kg, wb.min_weight_kg, wb.max_weight_kg
        FROM   weight_bands wb
        JOIN   zones z ON z.id = wb.zone_id
        WHERE  z.courier_service_id = $1
          AND  z.id = $3
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 >  COALESCE(wb.min_weight_kg, 0)
          AND  $2 <= wb.max_weight_kg
        ORDER  BY wb.min_weight_kg DESC
        LIMIT  1
      `, [serviceId, weightKg, zoneId])
    : await query(`
        SELECT wb.id, wb.price_first, wb.price_sub,
               wb.cost_per_kg, wb.min_weight_kg, wb.max_weight_kg
        FROM   weight_bands wb
        JOIN   zones z ON z.id = wb.zone_id
        WHERE  z.courier_service_id = $1
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 >  COALESCE(wb.min_weight_kg, 0)
          AND  $2 <= wb.max_weight_kg
        ORDER  BY wb.price_first ASC
        LIMIT  1
      `, [serviceId, weightKg]);

  if (p1.rows.length) {
    const b = p1.rows[0];
    return {
      cost:       round2(parseFloat(b.price_first || 0)),
      costSub:    b.price_sub != null ? round2(parseFloat(b.price_sub)) : null,
      pass:       1,
      overageKg:  null,
      bandLabel:  `${b.min_weight_kg ?? 0}–${b.max_weight_kg}kg`,
    };
  }

  // Pass 2 — ceiling band overage
  const p2 = zoneId
    ? await query(`
        SELECT wb.id, wb.price_first, wb.cost_per_kg, wb.max_weight_kg
        FROM   weight_bands wb
        JOIN   zones z ON z.id = wb.zone_id
        WHERE  z.courier_service_id = $1
          AND  z.id = $3
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 > wb.max_weight_kg
        ORDER  BY wb.max_weight_kg DESC
        LIMIT  1
      `, [serviceId, weightKg, zoneId])
    : await query(`
        SELECT wb.id, wb.price_first, wb.cost_per_kg, wb.max_weight_kg
        FROM   weight_bands wb
        JOIN   zones z ON z.id = wb.zone_id
        WHERE  z.courier_service_id = $1
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 > wb.max_weight_kg
        ORDER  BY wb.max_weight_kg DESC
        LIMIT  1
      `, [serviceId, weightKg]);

  if (p2.rows.length) {
    const b           = p2.rows[0];
    const overageRate = parseFloat(b.cost_per_kg || 0);
    const bandMax     = parseFloat(b.max_weight_kg);
    if (!overageRate || !isFinite(bandMax)) return null;

    const overageKg = round2(weightKg - bandMax);
    const cost      = round2(parseFloat(b.price_first || 0) + overageKg * overageRate);
    console.log(
      `[pricing] Cost Pass 2 overage: ${weightKg}kg > ceiling ${bandMax}kg` +
      ` — £${b.price_first} + (${overageKg}kg × £${overageRate}) = £${cost}`
    );
    return {
      cost,
      costSub:   null,
      pass:      2,
      overageKg,
      bandLabel: `>${bandMax}kg (overage @ £${overageRate}/kg)`,
    };
  }

  return null;
}

// ─── Step 3: Sell price — customer rate card ──────────────────────────────────
//
// Reads customer_rates (the same table billing.js uses for reprice).
// Identical boundary convention to lookupCarrierBandCost:
//   weight >  COALESCE(min_weight_kg, 0)  (exclusive lower)
//   weight <= max_weight_kg               (inclusive upper — on boundary → stays in this band)
//
// If no finite band matches, tries open-ended bands (max IS NULL) as a catch-all.
// Per-kg overage (per_kg_rate / per_kg_threshold_kg) is applied on top when present.
//
// Returns { sellPrice, sellSub, pass, overageKg, bandLabel } or null.

export async function lookupCustomerSellPrice(customerId, serviceCode, weightKg, zoneName, fallbackServiceCode = null) {
  if (!customerId || !serviceCode || !(weightKg > 0)) return null;

  // ── Internal helper: try one service_code against both band passes ──────────
  async function tryServiceCode(code) {
    // Pass 1 — finite band (weight falls within a bounded range)
    const p1 = await query(`
      SELECT id, price, price_sub, per_kg_rate, per_kg_threshold_kg,
             min_weight_kg, max_weight_kg
      FROM   customer_rates
      WHERE  customer_id  = $1
        AND  service_code ILIKE $2
        AND  zone_name    ILIKE $3
        AND  max_weight_kg IS NOT NULL
        AND  $4 >  COALESCE(min_weight_kg, 0)
        AND  $4 <= max_weight_kg
      ORDER  BY min_weight_kg DESC
      LIMIT  1
    `, [customerId, code, zoneName, weightKg]);

    if (p1.rows.length) {
      const r = p1.rows[0];
      // Preserve null: price=null means "not configured" (different from price=0).
      // all_sub DPD rate cards often leave price null for bands used only as sub-rate.
      let sellPrice = r.price != null ? round2(parseFloat(r.price)) : null;
      let overageKg = null;
      if (sellPrice != null && r.per_kg_rate != null && r.per_kg_threshold_kg != null && weightKg > parseFloat(r.per_kg_threshold_kg)) {
        overageKg = round2(weightKg - parseFloat(r.per_kg_threshold_kg));
        sellPrice = round2(sellPrice + overageKg * parseFloat(r.per_kg_rate));
      }
      return {
        sellPrice,
        sellSub:       r.price_sub != null ? round2(parseFloat(r.price_sub)) : null,
        pass:          1,
        overageKg,
        bandLabel:     `${r.min_weight_kg ?? 0}–${r.max_weight_kg}kg`,
        resolvedCode:  code,
      };
    }

    // Pass 2 — open-ended top band (max IS NULL)
    const p2 = await query(`
      SELECT id, price, price_sub, per_kg_rate, per_kg_threshold_kg,
             min_weight_kg, max_weight_kg
      FROM   customer_rates
      WHERE  customer_id  = $1
        AND  service_code ILIKE $2
        AND  zone_name    ILIKE $3
        AND  max_weight_kg IS NULL
        AND  $4 > COALESCE(min_weight_kg, 0)
      ORDER  BY min_weight_kg DESC NULLS LAST
      LIMIT  1
    `, [customerId, code, zoneName, weightKg]);

    if (p2.rows.length) {
      const r = p2.rows[0];
      // Preserve null: price=null means "not configured" (different from price=0).
      let sellPrice = r.price != null ? round2(parseFloat(r.price)) : null;
      let overageKg = null;
      if (sellPrice != null && r.per_kg_rate != null && r.per_kg_threshold_kg != null && weightKg > parseFloat(r.per_kg_threshold_kg)) {
        overageKg = round2(weightKg - parseFloat(r.per_kg_threshold_kg));
        sellPrice = round2(sellPrice + overageKg * parseFloat(r.per_kg_rate));
      }
      return {
        sellPrice,
        sellSub:       r.price_sub != null ? round2(parseFloat(r.price_sub)) : null,
        pass:          2,
        overageKg,
        bandLabel:     `>${r.min_weight_kg ?? 0}kg (open-ended)`,
        resolvedCode:  code,
      };
    }

    return null;
  }

  // ── Primary lookup ─────────────────────────────────────────────────────────
  const primary = await tryServiceCode(serviceCode);
  if (primary) return primary;

  // ── Fallback lookup ────────────────────────────────────────────────────────
  // If the primary service has no rate card for this customer/zone/weight, retry
  // using the fallback service code (e.g. DDP variant → standard variant).
  // This allows a single rate card to cover both DDP and non-DDP variants of
  // the same service without duplicating every zone/weight-band row.
  if (fallbackServiceCode && fallbackServiceCode !== serviceCode) {
    const fallback = await tryServiceCode(fallbackServiceCode);
    if (fallback) {
      console.log(
        `[pricing] sell fallback: no rate for "${serviceCode}" → used fallback "${fallbackServiceCode}" ` +
        `(customer=${customerId} zone="${zoneName}" weight=${weightKg}kg)`
      );
      return fallback;
    }
  }

  return null;
}

// ─── Main engine ──────────────────────────────────────────────────────────────

// ─── Payload normaliser ───────────────────────────────────────────────────────
// processShipment was originally written for DC webhook format where
// shipment.courier is an object, shipment.ship_to is nested, and parcels live
// in shipment.parcels.  The Voila API (mapToWebhookPayload) produces a flat
// format: shipment.courier is a string, shipment.ship_to_country_iso etc. are
// top-level, parcels come from create_label_parcels, and the service code is
// buried in request_shipment.dc_service_id.
//
// This function normalises both into a single shape so the rest of the engine
// doesn't need branching throughout.

function normaliseShipmentPayload(payload) {
  const ship = payload.shipment || {};

  // Parse request_shipment JSON string for extra fields (dc_service_id, weight, dims)
  let reqShip = {};
  try {
    reqShip = typeof payload.request_shipment === 'string'
      ? JSON.parse(payload.request_shipment)
      : (payload.request_shipment || {});
  } catch { /* leave empty */ }

  // ── Service code ─────────────────────────────────────────────────────────
  // DC webhook: shipment.courier = { service_code: 'DPD-12', ... }
  // Voila API:  service code in request_shipment.dc_service_id or
  //             shipment.dc_service_id (if already flat)
  const serviceCode =
    (typeof ship.courier === 'object' ? ship.courier?.service_code : null) ||
    ship.dc_service_id ||
    reqShip.dc_service_id ||
    reqShip.courier?.service_code ||
    null;

  // ── Destination ──────────────────────────────────────────────────────────
  // DC webhook: shipment.ship_to = { country_iso, postcode, name }
  // Voila API:  shipment.ship_to_country_iso, shipment.ship_to_postcode etc.
  const countryIso =
    ship.ship_to?.country_iso ||
    ship.ship_to_country_iso  ||
    reqShip.ship_to_country_iso ||
    'GB';

  const postcode =
    ship.ship_to?.postcode ||
    ship.ship_to_postcode  ||
    reqShip.ship_to_postcode ||
    null;

  const shipToName =
    ship.ship_to?.name ||
    ship.ship_to_name  ||
    ship.ship_to_company_name ||
    null;

  // ── Parcels ───────────────────────────────────────────────────────────────
  // DC webhook: shipment.parcels = [{ weight, dim_length, ... }]
  // Voila API:  shipment.create_label_parcels = [{ weight, tracking_code, ... }]
  //             OR fallback to total_weight_kg / parcel_count if no per-parcel data
  let parcels = [];

  if (Array.isArray(ship.parcels) && ship.parcels.length) {
    parcels = ship.parcels;
  } else if (Array.isArray(ship.create_label_parcels) && ship.create_label_parcels.length) {
    // create_label_parcels may have weight; fall back to total_weight / count
    const totalWeightKg = parseFloat(ship.total_weight_kg || reqShip.total_weight_kg || 0);
    const parcelCount   = ship.parcel_count || ship.create_label_parcels.length || 1;
    const perParcelKg   = parcelCount > 0 ? totalWeightKg / parcelCount : totalWeightKg;

    parcels = ship.create_label_parcels.map((clp) => ({
      weight:     parseFloat(clp.weight || clp.weight_kg || perParcelKg) || perParcelKg,
      dim_length: parseFloat(clp.dim_length || clp.length || reqShip.dim_length || 0) || 0,
      dim_width:  parseFloat(clp.dim_width  || clp.width  || reqShip.dim_width  || 0) || 0,
      dim_height: parseFloat(clp.dim_height || clp.height || reqShip.dim_height || 0) || 0,
      tracking_code: clp.tracking_code || null,
    }));
  } else {
    // Last resort: single synthetic parcel from shipment-level weight
    const totalWeightKg = parseFloat(ship.total_weight_kg || reqShip.total_weight_kg || 0);
    const parcelCount   = parseInt(ship.parcel_count || 1, 10);
    const perParcelKg   = parcelCount > 0 ? totalWeightKg / parcelCount : totalWeightKg;
    for (let i = 0; i < parcelCount; i++) {
      parcels.push({
        weight:     perParcelKg,
        dim_length: parseFloat(reqShip.dim_length || 0),
        dim_width:  parseFloat(reqShip.dim_width  || 0),
        dim_height: parseFloat(reqShip.dim_height || 0),
        tracking_code: null,
      });
    }
  }

  return { serviceCode, countryIso, postcode, shipToName, parcels };
}

export async function processShipment(payload) {
  const { shipment } = payload;
  const charges = [];
  const errors  = [];

  // Normalise payload fields — handles both DC webhook and Voila API formats.
  const norm = normaliseShipmentPayload(payload);

  try {
    // ── 1. IDENTIFY CUSTOMER ──────────────────────────────────────────────────
    // Multi-step cascade matching billing.js behaviour so both webhook paths
    // resolve the same customer regardless of which ID field is populated.
    //
    // Voila API payloads (mapToWebhookPayload) expose:
    //   shipment.account_number — the MOOV-XXXX style account number
    //   shipment.account_name   — the business name
    //
    // DC webhook payloads may also have:
    //   shipment.billing.customer_dc_id — numeric DC customer ID
    //
    // customers table has: account_number, dc_customer_id, dc_id, billing_aliases,
    // business_name. We try each in turn and take the first match.
    const accountNumber = (shipment?.account_number || '').trim();
    const customerDcId  = shipment?.billing?.customer_dc_id || null;
    const accountName   = (shipment?.account_name || shipment?.ship_to_company_name || '').trim();

    let customerId        = null;
    let multi_box_pricing = null;

    const pickCustomer = (row) => {
      customerId        = row.id;
      multi_box_pricing = row.multi_box_pricing;
    };

    // Step 1: account_number → customers.account_number
    if (accountNumber) {
      const r = await query(
        'SELECT id, multi_box_pricing FROM customers WHERE account_number = $1 LIMIT 1',
        [accountNumber]
      );
      if (r.rows.length) pickCustomer(r.rows[0]);
    }

    // Step 2: account_number → customers.dc_customer_id (legacy numeric DC ID stored as text)
    if (!customerId && accountNumber) {
      const r = await query(
        'SELECT id, multi_box_pricing FROM customers WHERE dc_customer_id = $1 LIMIT 1',
        [accountNumber]
      );
      if (r.rows.length) pickCustomer(r.rows[0]);
    }

    // Step 3: account_number → customers.dc_id (alternate DC ID field)
    if (!customerId && accountNumber) {
      const r = await query(
        'SELECT id, multi_box_pricing FROM customers WHERE dc_id = $1 LIMIT 1',
        [accountNumber]
      );
      if (r.rows.length) pickCustomer(r.rows[0]);
    }

    // Step 4: account_number → customers.billing_aliases array
    if (!customerId && accountNumber) {
      try {
        const r = await query(
          `SELECT id, multi_box_pricing FROM customers
           WHERE EXISTS (
             SELECT 1 FROM unnest(billing_aliases) a
             WHERE LOWER(a) = LOWER($1)
           ) LIMIT 1`,
          [accountNumber]
        );
        if (r.rows.length) pickCustomer(r.rows[0]);
      } catch (_) { /* billing_aliases column may not exist on all installs */ }
    }

    // Step 5: customerDcId → customers.dc_customer_id / dc_id
    if (!customerId && customerDcId) {
      const r = await query(
        `SELECT id, multi_box_pricing FROM customers
         WHERE dc_customer_id = $1 OR dc_id = $1 LIMIT 1`,
        [String(customerDcId)]
      );
      if (r.rows.length) pickCustomer(r.rows[0]);
    }

    // Step 6: accountName → customers.business_name (exact then partial)
    if (!customerId && accountName) {
      const r = await query(
        'SELECT id, multi_box_pricing FROM customers WHERE LOWER(business_name) = LOWER($1) LIMIT 1',
        [accountName]
      );
      if (r.rows.length) pickCustomer(r.rows[0]);
    }
    if (!customerId && accountName) {
      const r = await query(
        `SELECT id, multi_box_pricing FROM customers
         WHERE LOWER(business_name) LIKE LOWER($1) LIMIT 1`,
        [`%${accountName}%`]
      );
      if (r.rows.length) pickCustomer(r.rows[0]);
    }

    if (!customerId) {
      throw new Error(
        `No customer found for account_number="${accountNumber}", ` +
        `dc_id="${customerDcId || ''}", name="${accountName}"`
      );
    }

    // ── 2. IDENTIFY SERVICE ───────────────────────────────────────────────────
    const serviceCode = norm.serviceCode;
    if (!serviceCode) throw new Error('No service_code in payload — checked shipment.courier.service_code, shipment.dc_service_id, and request_shipment.dc_service_id');

    const svcRow = await query(
      `SELECT cs.id, cs.service_code, cs.fuel_group_id, cs.charges_per_parcel, cs.all_sub_parcel_pricing,
              fb.service_code AS rate_fallback_service_code
       FROM   courier_services cs
       LEFT JOIN courier_services fb ON fb.id = cs.rate_fallback_service_id
       WHERE  cs.service_code = $1`,
      [serviceCode]
    );
    if (!svcRow.rows.length) throw new Error(`No courier service found with code = ${serviceCode}`);
    const {
      id: serviceId,
      fuel_group_id: fuelGroupId,
      charges_per_parcel: chargesPerParcel,
      all_sub_parcel_pricing: allSubParcelPricing,
      rate_fallback_service_code: rateFallbackServiceCode,
    } = svcRow.rows[0];

    // ── 3. MATCH ZONE ─────────────────────────────────────────────────────────
    // A missing zone is NOT a throw — charges are created with status='pricing_error'
    // and NULL prices so the failure is visible in the UI.
    const countryIso = norm.countryIso;
    const postcode   = norm.postcode;

    if (!countryIso || !/^[A-Z]{2}$/.test(countryIso)) {
      throw new Error(
        `Validation Error: country_iso "${countryIso}" is not a valid 2-letter ISO code.`
      );
    }

    const zone = await matchZone(serviceId, countryIso, postcode);
    if (!zone) {
      console.warn(`[pricing] ⚠ No zone for service ${serviceCode}, country ${countryIso}, postcode ${postcode} — charges will be pricing_error`);
    }

    // ── 4. DUAL FUEL RATES ────────────────────────────────────────────────────
    // carrier_fuel_pct  → applied to base COST  (what we pay the carrier)
    // customer_fuel_pct → applied to base SELL  (what the customer pays us)
    // Both come from the fuel_group assigned to this service.
    let fuelCostPct = 0;
    let fuelSellPct = 0;
    let fuelGroupName = null;

    if (fuelGroupId) {
      const fuelRes = await query(
        `SELECT fg.name                                           AS fuel_group_name,
                fg.fuel_surcharge_pct                            AS cost_pct,
                COALESCE(cfgp.sell_pct, fg.standard_sell_pct, 0) AS sell_pct
         FROM   fuel_groups fg
         LEFT JOIN customer_fuel_group_pricing cfgp
                   ON cfgp.fuel_group_id = fg.id AND cfgp.customer_id = $2
         WHERE  fg.id = $1`,
        [fuelGroupId, customerId]
      );
      if (fuelRes.rows.length) {
        fuelGroupName = fuelRes.rows[0].fuel_group_name;
        fuelCostPct   = round2(parseFloat(fuelRes.rows[0].cost_pct || 0));
        fuelSellPct   = round2(parseFloat(fuelRes.rows[0].sell_pct || 0));
        console.log(
          `[pricing] Fuel "${fuelGroupName}" — cost: ${fuelCostPct}%, sell: ${fuelSellPct}% (customer ${customerId})`
        );
      }
    }

    // ── 5. PROCESS PARCELS ────────────────────────────────────────────────────
    const parcels      = norm.parcels;
    const totalParcels = parcels.length || shipment.parcel_count || 1;
    const voilaId      = shipment.id;
    const orderId      = shipment.reference || shipment.reference_2 || String(voilaId);
    // First tracking code from create_label_parcels (or from normalised parcel objects)
    const clParcels    = shipment.create_label_parcels || [];
    const trackingCode =
      clParcels.map(p => p.tracking_code).filter(Boolean)[0] ||
      parcels.map(p => p.tracking_code).filter(Boolean)[0] ||
      null;
    const despatchDate = shipment.collection_date ? new Date(shipment.collection_date) : null;

    const commonFields = {
      customer_id:         customerId,
      voila_shipment_id:   voilaId,
      order_id:            orderId,
      tracking_code:       trackingCode,
      courier_service_id:  serviceId,
      zone_id:             zone?.id || null,
      ship_to_postcode:    postcode,
      ship_to_country_iso: countryIso,
      ship_to_name:        norm.shipToName,
      parcel_count:        totalParcels,
      despatch_date:       despatchDate,
      raw_payload:         JSON.stringify(payload),
    };

    // ── Per-parcel pricing results staging ────────────────────────────────────
    // We always price each parcel individually (correct for weight-banded billing).
    // If chargesPerParcel = false (default), results are consolidated into ONE
    // courier charge + ONE fuel charge at the end so the reconciliation pool
    // matches a single invoice line per consignment (DPD behaviour).
    // If chargesPerParcel = true, each parcel gets its own charge row.
    const parcelResults = [];

    for (let i = 0; i < parcels.length; i++) {
      const parcel    = parcels[i];
      const isFirst   = i === 0;
      const parcelNum = i + 1;

      // ── Step 1: Weight ─────────────────────────────────────────────────────
      const weightResult = await calcWeight(serviceId, parcel);
      const { physicalKg, volumetricKg, chargedKg, volumetricDivisor, weightBasis } = weightResult;

      // ── Step 2: Cost price (two-pass carrier band) ─────────────────────────
      // Only attempt if zone was resolved — null zone means pricing_error below.
      const costResult = zone
        ? await lookupCarrierBandCost(serviceId, chargedKg, zone.id)
        : null;

      // ── Step 3: Sell price (customer rate card) ────────────────────────────
      // Only attempt if zone AND cost were resolved.
      // rateFallbackServiceCode allows DDP ↔ standard service sharing a rate card.
      const sellResult = (zone && costResult)
        ? await lookupCustomerSellPrice(customerId, serviceCode, chargedKg, zone.name, rateFallbackServiceCode || null)
        : null;

      // ── Hard stop: any missing step → pricing_error, NULL prices ──────────
      // No fallbacks. No baseSell = baseCost. No || 0.
      if (!zone || !costResult || !sellResult) {
        const errorStep = !zone       ? 'no_zone_matched'
                        : !costResult ? 'no_cost_band'
                        :               'no_sell_price';
        const errorDetail = !zone
          ? `No zone for service ${serviceCode}, country ${countryIso}, postcode ${postcode}`
          : !costResult
            ? `No carrier band for ${chargedKg}kg in zone "${zone.name}"`
            : `No customer rate for ${chargedKg}kg in zone "${zone.name}", service "${serviceCode}"`;

        console.warn(`[pricing] ✗ Parcel ${parcelNum}: ${errorDetail}`);
        errors.push(`Parcel ${parcelNum}: pricing_error (${errorStep}) — ${errorDetail}`);

        // Always emit per-parcel for errors — visibility matters
        charges.push({
          ...commonFields,
          charge_type:           'courier',
          parcel_number:         parcelNum,
          weight_actual_kg:      physicalKg,
          weight_dimensional_kg: volumetricKg,
          weight_charged_kg:     chargedKg,
          cost_price:            null,
          sell_price:            null,
          status:                'pricing_error',
          pricing_logic_trace: {
            error:              errorStep,
            error_detail:       errorDetail,
            physical_kg:        physicalKg,
            volumetric_kg:      volumetricKg,
            volumetric_divisor: volumetricDivisor,
            charged_kg:         chargedKg,
            weight_basis:       weightBasis,
            zone_attempted:     zone?.name || null,
            country:            countryIso,
            postcode,
            service:            serviceCode,
            parcel_number:      parcelNum,
          },
        });
        continue;
      }

      // ── Step 4: Dual fuel ──────────────────────────────────────────────────
      // For carriers with all_sub_parcel_pricing (e.g. DPD), every parcel in a
      // multi-parcel shipment — including the first — is billed at price_sub.
      // Standard carriers use price_first for parcel 1, price_sub for the rest.
      // Customers with multi_box_pricing=true use the same all-sub model at the
      // customer level: 1 parcel → price_first; 2+ parcels → ALL at price_sub.
      const forceSubRate = (allSubParcelPricing || multi_box_pricing) && totalParcels > 1;
      const useFirstParcel = forceSubRate ? false : (isFirst || !multi_box_pricing);
      const baseCost = useFirstParcel
        ? costResult.cost
        : (costResult.costSub ?? costResult.cost);
      const baseSell = useFirstParcel
        ? sellResult.sellPrice
        : (sellResult.sellSub ?? sellResult.sellPrice);

      const fuelCost = fuelCostPct > 0 ? round2(baseCost * fuelCostPct / 100) : 0;
      const fuelSell = fuelSellPct > 0 ? round2(baseSell * fuelSellPct / 100) : 0;

      const totalCost = round2(baseCost + fuelCost);
      const totalSell = round2(baseSell + fuelSell);
      const profit    = round2(totalSell - totalCost);

      // ── Step 5: Pricing logic trace ────────────────────────────────────────
      const pricing_logic_trace = {
        // Weight
        physical_kg:        physicalKg,
        volumetric_kg:      volumetricKg,
        volumetric_divisor: volumetricDivisor,
        charged_kg:         chargedKg,
        weight_basis:       weightBasis,
        // Cost
        cost_pass:          costResult.pass,
        cost_band:          costResult.bandLabel,
        cost_overage_kg:    costResult.overageKg,
        base_cost:          baseCost,
        fuel_cost_pct:      fuelCostPct,
        fuel_cost:          fuelCost,
        total_cost:         totalCost,
        // Sell
        sell_band:          sellResult.bandLabel,
        sell_pass:          sellResult.pass,
        sell_overage_kg:    sellResult.overageKg,
        base_sell:          baseSell,
        fuel_sell_pct:      fuelSellPct,
        fuel_sell:          fuelSell,
        total_sell:         totalSell,
        // P&L
        profit,
        margin_pct:         totalSell > 0 ? round2((profit / totalSell) * 100) : 0,
        // Meta
        zone:                    zone.name,
        fuel_group:              fuelGroupName,
        parcel_number:           parcelNum,
        is_first_parcel:         isFirst,
        all_sub_parcel_pricing:  allSubParcelPricing || false,
        force_sub_rate:          forceSubRate,
      };

      console.log(
        `[pricing] ✓ Parcel ${parcelNum}: ${chargedKg}kg (${weightBasis})` +
        ` cost=£${baseCost}+£${fuelCost}fuel=£${totalCost}` +
        ` sell=£${baseSell}+£${fuelSell}fuel=£${totalSell}` +
        ` profit=£${profit}`
      );

      parcelResults.push({
        parcelNum,
        physicalKg, volumetricKg, chargedKg,
        baseCost, baseSell,
        fuelCost, fuelSell,
        pricing_logic_trace,
      });
    }

    // ── Emit courier + fuel charges ────────────────────────────────────────────
    if (chargesPerParcel || parcels.length <= 1) {
      // One charge row per parcel (e.g. DHL per-parcel invoicing, or single-parcel shipment)
      for (const r of parcelResults) {
        charges.push({
          ...commonFields,
          charge_type:           'courier',
          parcel_number:         r.parcelNum,
          weight_actual_kg:      r.physicalKg,
          weight_dimensional_kg: r.volumetricKg,
          weight_charged_kg:     r.chargedKg,
          cost_price:            r.baseCost,
          sell_price:            r.baseSell,
          status:                'unverified',
          pricing_logic_trace:   r.pricing_logic_trace,
        });
        if (fuelCostPct > 0 || fuelSellPct > 0) {
          charges.push({
            ...commonFields,
            charge_type:   'fuel',
            parcel_number: r.parcelNum,
            cost_price:    r.fuelCost,
            sell_price:    r.fuelSell,
            status:        'unverified',
          });
        }
      }
    } else {
      // Consolidate: one courier charge + one fuel charge for the whole shipment.
      // Each parcel was priced individually (correct weight-band lookup), results summed.
      // This matches how DPD (and most carriers) issue a single invoice line per consignment.
      const totalBaseCost = round2(parcelResults.reduce((s, r) => s + r.baseCost, 0));
      const totalBaseSell = round2(parcelResults.reduce((s, r) => s + r.baseSell, 0));
      const totalFuelCost = round2(parcelResults.reduce((s, r) => s + r.fuelCost, 0));
      const totalFuelSell = round2(parcelResults.reduce((s, r) => s + r.fuelSell, 0));
      const totalPhysical = round2(parcelResults.reduce((s, r) => s + r.physicalKg, 0));
      const totalVolumetric = round2(parcelResults.reduce((s, r) => s + r.volumetricKg, 0));
      const totalCharged  = round2(parcelResults.reduce((s, r) => s + r.chargedKg, 0));

      if (parcelResults.length > 0) {
        console.log(
          `[pricing] ✓ Consolidated ${parcelResults.length} parcels:` +
          ` total charged ${totalCharged}kg` +
          ` cost=£${totalBaseCost}+£${totalFuelCost}fuel` +
          ` sell=£${totalBaseSell}+£${totalFuelSell}fuel`
        );

        charges.push({
          ...commonFields,
          charge_type:           'courier',
          parcel_number:         null,  // consolidated — not a single parcel
          weight_actual_kg:      totalPhysical,
          weight_dimensional_kg: totalVolumetric,
          weight_charged_kg:     totalCharged,
          cost_price:            totalBaseCost,
          sell_price:            totalBaseSell,
          status:                'unverified',
          pricing_logic_trace: {
            consolidated:    true,
            parcel_count:    parcelResults.length,
            total_cost:      round2(totalBaseCost + totalFuelCost),
            total_sell:      round2(totalBaseSell + totalFuelSell),
            parcels:         parcelResults.map(r => r.pricing_logic_trace),
          },
        });

        if (fuelCostPct > 0 || fuelSellPct > 0) {
          charges.push({
            ...commonFields,
            charge_type:   'fuel',
            parcel_number: null,
            cost_price:    totalFuelCost,
            sell_price:    totalFuelSell,
            status:        'unverified',
          });
        }
      }
    }

    // ── Congestion surcharge (once per shipment) ───────────────────────────────
    const outcode = outcodeOf(postcode);
    const congestion = await query(
      `SELECT fee FROM congestion_surcharges
       WHERE courier_service_id = $1 AND $2 LIKE postcode_prefix || '%'
       LIMIT 1`,
      [serviceId, outcode]
    );
    if (congestion.rows.length) {
      const fee = round2(parseFloat(congestion.rows[0].fee));
      charges.push({ ...commonFields, charge_type: 'congestion_surcharge', cost_price: fee, sell_price: fee, status: 'unverified' });
    }

    // ── Rules engine ───────────────────────────────────────────────────────────
    const rules = await query(
      `SELECT r.*, json_agg(jsonb_build_object(
         'logic_operator',c.logic_operator,'json_field_path',c.json_field_path,
         'operator',c.operator,'value',c.value
       ) ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL) AS conditions
       FROM rules_engine_rules r
       LEFT JOIN rules_engine_conditions c ON c.rule_id = r.id
       WHERE r.is_active = true AND (r.courier_service_id IS NULL OR r.courier_service_id = $1)
       GROUP BY r.id`,
      [serviceId]
    );

    for (const rule of rules.rows) {
      const conditions = rule.conditions || [];
      if (!evalRule(conditions, shipment)) continue;

      const baseCharge  = charges.find(c => c.charge_type === 'courier');
      const baseRate    = baseCharge ? parseFloat(baseCharge.cost_price) : 0;
      const chargedKg   = baseCharge ? parseFloat(baseCharge.weight_charged_kg || 0) : 0;

      let chargeAmt = 0;
      switch (rule.charge_method) {
        case 'fixed':      chargeAmt = parseFloat(rule.charge_value); break;
        case 'percentage': chargeAmt = baseRate * parseFloat(rule.charge_value) / 100; break;
        case 'per_kg':     chargeAmt = chargedKg * parseFloat(rule.charge_value); break;
        case 'per_parcel': chargeAmt = totalParcels * parseFloat(rule.charge_value); break;
      }

      charges.push({
        ...commonFields,
        charge_type: rule.name,
        cost_price:  round2(chargeAmt),
        sell_price:  round2(chargeAmt),
        status:      'unverified',
      });
    }

    return { charges, errors };

  } catch (err) {
    throw err;
  }
}

// ─── Insert calculated charges ────────────────────────────────────────────────

// shipmentId — optional UUID from the shipments table.
// When provided (from webhooks.js after creating the shipment record),
// every charge is linked to that shipment so the reconciliation pool
// can find them via its JOIN shipments query.
export async function insertCharges(charges, shipmentId = null) {
  const inserted = [];
  for (const c of charges) {
    const effectiveShipmentId = shipmentId || c.shipment_id || null;
    const result = await query(
      `INSERT INTO charges (
         customer_id, voila_shipment_id, order_id, tracking_code,
         courier_service_id, zone_id, charge_type, parcel_number,
         weight_actual_kg, weight_dimensional_kg, weight_charged_kg,
         cost_price, sell_price, price, status,
         despatch_date, ship_to_postcode, ship_to_country_iso, ship_to_name,
         parcel_count, raw_payload, pricing_logic_trace, shipment_id, source
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        c.customer_id, c.voila_shipment_id, c.order_id, c.tracking_code,
        c.courier_service_id, c.zone_id, c.charge_type, c.parcel_number || null,
        c.weight_actual_kg      || null,
        c.weight_dimensional_kg || null,
        c.weight_charged_kg     || null,
        c.cost_price, c.sell_price,
        c.sell_price,            // price = sell_price — legacy column read by UI + billing engine
        c.status,
        c.despatch_date         || null,
        c.ship_to_postcode      || null,
        c.ship_to_country_iso   || null,
        c.ship_to_name          || null,
        c.parcel_count          || null,
        c.raw_payload ? JSON.parse(c.raw_payload) : null,
        c.pricing_logic_trace   ? JSON.stringify(c.pricing_logic_trace) : null,
        effectiveShipmentId,
        c.source                || null,
      ]
    );
    if (result.rows.length) inserted.push(result.rows[0]);
  }
  return inserted;
}

// ─── Carrier-Direct pricing helper ───────────────────────────────────────────
//
// Used by reconciliationEngine when a carrier invoice line has no matching
// OMS charge record (pool MISS with a known customer account).  These are real
// shipments booked directly with the carrier (returns, ad-hoc sends, etc.).
//
// Returns { service_code, zone_id, zone_name, cost_price, sell_price }
//      or { error: string, detail?: string } on failure.
//
// Does NOT insert anything — caller (reconciliationEngine.handleCarrierDirect)
// owns the charge + line insertion so the recon context is preserved.

export async function computeGhostCharge(serviceId, customerId, weightKg, postcode, countryIso = 'GB') {
  if (!serviceId) return { error: 'invalid_params', detail: 'serviceId required' };
  const kg = parseFloat(weightKg) || 0;

  // Get service details (we need service_code string for customer rate lookup)
  const svcRes = await query(
    `SELECT service_code FROM courier_services WHERE id = $1`,
    [serviceId]
  );
  if (!svcRes.rows.length) return { error: 'service_not_found', detail: `service_id=${serviceId}` };
  const serviceCode = svcRes.rows[0].service_code;

  // Zone — strict match, same function as live pricing engine
  const zone = await matchZone(serviceId, countryIso || 'GB', postcode);
  if (!zone) {
    return {
      error: 'no_zone_matched',
      detail: `service=${serviceCode} country=${countryIso} postcode=${postcode}`,
    };
  }

  // Cost price — carrier band lookup (Pass 1 then Pass 2 overage)
  const costResult = await lookupCarrierBandCost(serviceId, kg, zone.id);
  if (!costResult) {
    return {
      error: 'no_cost_band',
      detail: `${kg}kg in zone "${zone.name}"`,
    };
  }

  // Fallback service code — if this service has a rate_fallback_service_id configured,
  // lookupCustomerSellPrice will retry with the fallback's service_code when the
  // primary lookup finds no rate. This covers DDP ↔ standard variants sharing one
  // rate card (e.g. "International Express DDP" falls back to "International Express").
  const fallbackRes = await query(`
    SELECT cs2.service_code AS fallback_code
    FROM   courier_services cs
    JOIN   courier_services cs2 ON cs2.id = cs.rate_fallback_service_id
    WHERE  cs.id = $1
  `, [serviceId]);
  const fallbackServiceCode = fallbackRes.rows[0]?.fallback_code || null;

  // Sell price — customer rate card (best-effort; null if no rate card configured)
  const sellResult = customerId
    ? await lookupCustomerSellPrice(customerId, serviceCode, kg, zone.name, fallbackServiceCode)
    : null;

  return {
    service_code:          serviceCode,
    zone_id:               zone.id,
    zone_name:             zone.name,
    cost_price:            costResult.cost,         // price_first — single-parcel / first-parcel rate
    cost_sub:              costResult.costSub,      // price_sub   — per-parcel rate for all_sub carriers; null if not set
    band_label:            costResult.bandLabel,    // e.g. "0–2kg" — for trace/diagnostics
    sell_price:            sellResult?.sellPrice ?? null,   // null = price not configured on rate card
    sell_sub:              sellResult?.sellSub   ?? null,  // price_sub sell — for all_sub multi-parcel sell calc
    fallback_service_code: fallbackServiceCode,            // propagated for use in correctedSell helpers
  };
}

// ─── Trace example helper (for verification) ─────────────────────────────────
// Returns a dry-run trace for any weight without touching the DB.
// Call via: GET /api/pricing/trace?serviceCode=DHL-220&customerId=X&weightKg=1.5&postcode=LS1+1AA

export async function getTrace(serviceCode, customerId, physicalKg, dims, postcode, countryIso = 'GB') {
  const svcRow = await query(
    `SELECT cs.id, cs.service_code, cs.fuel_group_id, cs.volumetric_divisor,
            fb.service_code AS rate_fallback_service_code
     FROM   courier_services cs
     LEFT JOIN courier_services fb ON fb.id = cs.rate_fallback_service_id
     WHERE  cs.service_code = $1`,
    [serviceCode]
  );
  if (!svcRow.rows.length) return { error: `No service: ${serviceCode}` };
  const svc                    = svcRow.rows[0];
  const serviceId              = svc.id;
  const divisor                = parseInt(svc.volumetric_divisor || 0);
  const traceRateFallbackCode  = svc.rate_fallback_service_code || null;

  // Volumetric
  let volumetricKg = 0;
  if (divisor > 0 && dims?.l && dims?.w && dims?.h) {
    volumetricKg = round2((dims.l * dims.w * dims.h) / divisor);
  }
  const chargedKg   = Math.max(physicalKg, volumetricKg);
  const weightBasis = volumetricKg > physicalKg ? 'volumetric' : 'physical';

  // Zone — strict match, same function as live engine
  const zone = await matchZone(serviceId, countryIso, postcode);
  if (!zone) return {
    error: 'no_zone_matched',
    error_detail: `No zone matched for service ${serviceCode}, country ${countryIso}, postcode ${postcode}`,
    input: { serviceCode, customerId, physicalKg, dims, chargedKg, weightBasis, volumetricDivisor: divisor || null, zone: null },
  };

  // Cost — hard stop if null
  const costResult = await lookupCarrierBandCost(serviceId, chargedKg, zone.id);
  if (!costResult) return {
    error: 'no_cost_band',
    error_detail: `No carrier band for ${chargedKg}kg in zone "${zone.name}"`,
    input: { serviceCode, customerId, physicalKg, dims, chargedKg, weightBasis, volumetricDivisor: divisor || null, zone: zone.name },
  };

  // Sell — hard stop if null; pass fallback so trace matches live pricing
  const sellResult = await lookupCustomerSellPrice(customerId, serviceCode, chargedKg, zone.name, traceRateFallbackCode);
  if (!sellResult) return {
    error: 'no_sell_price',
    error_detail: `No customer rate for ${chargedKg}kg in zone "${zone.name}", service "${serviceCode}", customer ${customerId}`,
    input: { serviceCode, customerId, physicalKg, dims, chargedKg, weightBasis, volumetricDivisor: divisor || null, zone: zone.name },
    cost: { pass: costResult.pass, band: costResult.bandLabel, base_cost: costResult.cost },
  };

  // Fuel
  let fuelCostPct = 0, fuelSellPct = 0, fuelGroupName = null;
  if (svc.fuel_group_id) {
    const fr = await query(
      `SELECT fg.name, fg.fuel_surcharge_pct AS cost_pct,
              COALESCE(cfgp.sell_pct, fg.standard_sell_pct, 0) AS sell_pct
       FROM fuel_groups fg
       LEFT JOIN customer_fuel_group_pricing cfgp ON cfgp.fuel_group_id = fg.id AND cfgp.customer_id = $2
       WHERE fg.id = $1`,
      [svc.fuel_group_id, customerId]
    );
    if (fr.rows.length) {
      fuelGroupName = fr.rows[0].name;
      fuelCostPct   = round2(parseFloat(fr.rows[0].cost_pct || 0));
      fuelSellPct   = round2(parseFloat(fr.rows[0].sell_pct || 0));
    }
  }

  const baseCost  = costResult.cost;
  const baseSell  = sellResult.sellPrice;
  const fuelCost  = fuelCostPct > 0 ? round2(baseCost * fuelCostPct / 100) : 0;
  const fuelSell  = fuelSellPct > 0 ? round2(baseSell * fuelSellPct / 100) : 0;
  const totalCost = round2(baseCost + fuelCost);
  const totalSell = round2(baseSell + fuelSell);
  const profit    = round2(totalSell - totalCost);

  return {
    input: { serviceCode, customerId, physicalKg, dims, chargedKg, weightBasis, volumetricDivisor: divisor || null, zone: zone.name },
    cost:  { pass: costResult.pass, band: costResult.bandLabel, overageKg: costResult.overageKg, base_cost: baseCost, fuel_cost_pct: fuelCostPct, fuel_cost: fuelCost, total_cost: totalCost },
    sell:  { pass: sellResult.pass, band: sellResult.bandLabel, overageKg: sellResult.overageKg, base_sell: baseSell, fuel_sell_pct: fuelSellPct, fuel_sell: fuelSell, total_sell: totalSell },
    profit,
    margin_pct: totalSell > 0 ? round2((profit / totalSell) * 100) : null,
    fuel_group: fuelGroupName,
  };
}
