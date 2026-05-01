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
 * Two-pass cost lookup:
 *   Pass 1 — weight fits inside a finite band  (max IS NOT NULL, weight <= max)
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
//   weight > COALESCE(min_weight_kg, 0)  (exclusive lower)
//   weight <= max_weight_kg              (inclusive upper)
//   max_weight_kg IS NOT NULL            (finite bands only — open-ended bands block Pass 2 if included)
//
// Pass 2 — weight exceeds every ceiling:
//   Finds the band with the highest finite max, then:
//   cost = price_first + (weight - max) × cost_per_kg
//
// Returns { cost, pass, overageKg, bandLabel } or null if no band configured.

async function lookupCarrierBandCost(serviceId, weightKg, zoneId) {
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
//   weight > COALESCE(min_weight_kg, 0)  (exclusive lower)
//   weight <= max_weight_kg              (inclusive upper, Pass 1 — finite bands only)
//
// If no finite band matches, tries open-ended bands (max IS NULL) as a catch-all.
// Per-kg overage (per_kg_rate / per_kg_threshold_kg) is applied on top when present.
//
// Returns { sellPrice, sellSub, pass, overageKg, bandLabel } or null.

async function lookupCustomerSellPrice(customerId, serviceCode, weightKg, zoneName) {
  if (!customerId || !serviceCode || !(weightKg > 0)) return null;

  // Pass 1 — finite band
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
  `, [customerId, serviceCode, zoneName, weightKg]);

  if (p1.rows.length) {
    const r = p1.rows[0];
    let sellPrice = round2(parseFloat(r.price || 0));
    let overageKg = null;

    // Per-kg overage above threshold (e.g. customer rate: £X + £Y/kg above 30kg)
    if (r.per_kg_rate != null && r.per_kg_threshold_kg != null && weightKg > parseFloat(r.per_kg_threshold_kg)) {
      overageKg  = round2(weightKg - parseFloat(r.per_kg_threshold_kg));
      sellPrice  = round2(sellPrice + overageKg * parseFloat(r.per_kg_rate));
    }

    return {
      sellPrice,
      sellSub:   r.price_sub != null ? round2(parseFloat(r.price_sub)) : null,
      pass:      1,
      overageKg,
      bandLabel: `${r.min_weight_kg ?? 0}–${r.max_weight_kg}kg`,
    };
  }

  // Pass 2-equivalent — open-ended top band (max IS NULL)
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
  `, [customerId, serviceCode, zoneName, weightKg]);

  if (p2.rows.length) {
    const r = p2.rows[0];
    let sellPrice = round2(parseFloat(r.price || 0));
    let overageKg = null;

    if (r.per_kg_rate != null && r.per_kg_threshold_kg != null && weightKg > parseFloat(r.per_kg_threshold_kg)) {
      overageKg  = round2(weightKg - parseFloat(r.per_kg_threshold_kg));
      sellPrice  = round2(sellPrice + overageKg * parseFloat(r.per_kg_rate));
    }

    return {
      sellPrice,
      sellSub:   r.price_sub != null ? round2(parseFloat(r.price_sub)) : null,
      pass:      2,
      overageKg,
      bandLabel: `>${r.min_weight_kg ?? 0}kg (open-ended)`,
    };
  }

  return null;
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function processShipment(payload) {
  const { shipment } = payload;
  const charges = [];
  const errors  = [];

  try {
    // ── 1. IDENTIFY CUSTOMER ──────────────────────────────────────────────────
    const dcId = shipment?.billing?.customer_dc_id || shipment?.account_number;
    if (!dcId) throw new Error('No customer DC ID in payload (billing.customer_dc_id or account_number)');

    const custRow = await query(
      'SELECT id, multi_box_pricing FROM customers WHERE dc_id = $1', [dcId]
    );
    if (!custRow.rows.length) throw new Error(`No customer found with dc_id = ${dcId}`);
    const { id: customerId, multi_box_pricing } = custRow.rows[0];

    // ── 2. IDENTIFY SERVICE ───────────────────────────────────────────────────
    const serviceCode = shipment?.courier?.service_code || shipment?.dc_service_id;
    if (!serviceCode) throw new Error('No service_code in payload');

    const svcRow = await query(
      'SELECT id, service_code, fuel_group_id FROM courier_services WHERE service_code = $1',
      [serviceCode]
    );
    if (!svcRow.rows.length) throw new Error(`No courier service found with code = ${serviceCode}`);
    const { id: serviceId, fuel_group_id: fuelGroupId } = svcRow.rows[0];

    // ── 3. MATCH ZONE ─────────────────────────────────────────────────────────
    // A missing zone is NOT a throw — charges are created with status='pricing_error'
    // and NULL prices so the failure is visible in the UI.
    const countryIso = shipment?.ship_to?.country_iso;
    const postcode   = shipment?.ship_to?.postcode;

    if (!countryIso || !/^[A-Z]{2}$/.test(countryIso)) {
      throw new Error(
        `Validation Error: ship_to.country_iso "${countryIso}" is not a valid 2-letter ISO code.`
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
    const parcels      = shipment.parcels || [];
    const totalParcels = parcels.length;
    const voilaId      = shipment.id;
    const orderId      = shipment.reference || shipment.reference_2 || String(voilaId);
    const trackingCode = shipment?.courier?.tracking_code || null;
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
      ship_to_name:        shipment?.ship_to?.name,
      parcel_count:        totalParcels,
      despatch_date:       despatchDate,
      raw_payload:         JSON.stringify(payload),
    };

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
      const sellResult = (zone && costResult)
        ? await lookupCustomerSellPrice(customerId, serviceCode, chargedKg, zone.name)
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
      const useFirstParcel = isFirst || !multi_box_pricing;
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
        zone:               zone.name,
        fuel_group:         fuelGroupName,
        parcel_number:      parcelNum,
        is_first_parcel:    isFirst,
      };

      console.log(
        `[pricing] ✓ Parcel ${parcelNum}: ${chargedKg}kg (${weightBasis})` +
        ` cost=£${baseCost}+£${fuelCost}fuel=£${totalCost}` +
        ` sell=£${baseSell}+£${fuelSell}fuel=£${totalSell}` +
        ` profit=£${profit}`
      );

      // ── Base rate charge ───────────────────────────────────────────────────
      charges.push({
        ...commonFields,
        charge_type:           'courier',
        parcel_number:         parcelNum,
        weight_actual_kg:      physicalKg,
        weight_dimensional_kg: volumetricKg,
        weight_charged_kg:     chargedKg,
        cost_price:            baseCost,
        sell_price:            baseSell,
        status:                'unverified',
        pricing_logic_trace,
      });

      // ── Fuel surcharge (separate line, only when pricing succeeded) ────────
      if (fuelCostPct > 0 || fuelSellPct > 0) {
        charges.push({
          ...commonFields,
          charge_type:   'fuel',
          parcel_number: parcelNum,
          cost_price:    fuelCost,
          sell_price:    fuelSell,
          status:        'unverified',
        });
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

export async function insertCharges(charges) {
  const inserted = [];
  for (const c of charges) {
    const result = await query(
      `INSERT INTO charges (
         customer_id, voila_shipment_id, order_id, tracking_code,
         courier_service_id, zone_id, charge_type, parcel_number,
         weight_actual_kg, weight_dimensional_kg, weight_charged_kg,
         cost_price, sell_price, status,
         despatch_date, ship_to_postcode, ship_to_country_iso, ship_to_name,
         parcel_count, raw_payload, pricing_logic_trace
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        c.customer_id, c.voila_shipment_id, c.order_id, c.tracking_code,
        c.courier_service_id, c.zone_id, c.charge_type, c.parcel_number || null,
        c.weight_actual_kg      || null,
        c.weight_dimensional_kg || null,
        c.weight_charged_kg     || null,
        c.cost_price, c.sell_price, c.status,
        c.despatch_date         || null,
        c.ship_to_postcode      || null,
        c.ship_to_country_iso   || null,
        c.ship_to_name          || null,
        c.parcel_count          || null,
        c.raw_payload ? JSON.parse(c.raw_payload) : null,
        c.pricing_logic_trace   ? JSON.stringify(c.pricing_logic_trace) : null,
      ]
    );
    if (result.rows.length) inserted.push(result.rows[0]);
  }
  return inserted;
}

// ─── Trace example helper (for verification) ─────────────────────────────────
// Returns a dry-run trace for any weight without touching the DB.
// Call via: GET /api/pricing/trace?serviceCode=DHL-220&customerId=X&weightKg=1.5&postcode=LS1+1AA

export async function getTrace(serviceCode, customerId, physicalKg, dims, postcode, countryIso = 'GB') {
  const svcRow = await query(
    `SELECT id, service_code, fuel_group_id, volumetric_divisor FROM courier_services WHERE service_code = $1`,
    [serviceCode]
  );
  if (!svcRow.rows.length) return { error: `No service: ${serviceCode}` };
  const svc       = svcRow.rows[0];
  const serviceId = svc.id;
  const divisor   = parseInt(svc.volumetric_divisor || 0);

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

  // Sell — hard stop if null
  const sellResult = await lookupCustomerSellPrice(customerId, serviceCode, chargedKg, zone.name);
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
