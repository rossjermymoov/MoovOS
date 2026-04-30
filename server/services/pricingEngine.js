/**
 * Moov OS — Pricing Engine
 *
 * Given a full Voila shipment payload, calculates:
 *  - Zone matching
 *  - Weight (actual vs dimensional)
 *  - Cost price (courier rate cards)
 *  - Sell price (customer rate cards)
 *  - Fuel surcharge
 *  - Congestion surcharge
 *  - Rules engine charges
 *
 * Returns an array of charge objects ready to insert into the charges table.
 */

import { query } from '../db/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve a dot-notation path like "ship_to.country_iso" or "parcels[0].weight" against an object */
function resolvePath(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  return parts.reduce((curr, part) => (curr == null ? undefined : curr[part]), obj);
}

/** Evaluate a single condition against the payload */
function evalCondition(condition, payload) {
  const actual = resolvePath(payload, condition.json_field_path);
  const expected = condition.value;

  if (actual == null) return false;

  const actualStr  = String(actual).trim();
  const actualNum  = parseFloat(actual);

  switch (condition.operator) {
    case 'equals':                  return actualStr === expected;
    case 'not_equals':              return actualStr !== expected;
    case 'greater_than':            return actualNum > parseFloat(expected);
    case 'less_than':               return actualNum < parseFloat(expected);
    case 'greater_than_or_equal':   return actualNum >= parseFloat(expected);
    case 'less_than_or_equal':      return actualNum <= parseFloat(expected);
    case 'in':                      return expected.split(',').map(s => s.trim()).includes(actualStr);
    case 'not_in':                  return !expected.split(',').map(s => s.trim()).includes(actualStr);
    case 'starts_with':             return actualStr.startsWith(expected);
    case 'contains':                return actualStr.includes(expected);
    default:                        return false;
  }
}

/** Evaluate a full rule (all conditions) against the payload */
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

/** Extract postcode outward code (e.g. "SW1A 2AA" → "SW1A") */
function outcodeOf(postcode) {
  if (!postcode) return '';
  return postcode.trim().split(' ')[0].toUpperCase();
}

// ─── Zone matching ────────────────────────────────────────────────────────────

async function matchZone(serviceId, countryIso, postcode) {
  const outcode = outcodeOf(postcode);

  // Get all zones for this service with their country codes and postcode rules.
  // ORDER BY: zones with postcode rules (Remote, Excluded) first — they have
  // narrower scope and must be evaluated before catch-all country zones.
  // Without this, a Standard GB zone can be returned for a Remote postcode.
  const zones = await query(
    `SELECT z.id, z.name,
       array_agg(DISTINCT zcc.country_iso) FILTER (WHERE zcc.id IS NOT NULL) AS countries,
       json_agg(jsonb_build_object('prefix',zpr.postcode_prefix,'type',zpr.rule_type)) FILTER (WHERE zpr.id IS NOT NULL) AS postcode_rules
     FROM zones z
     LEFT JOIN zone_country_codes zcc ON zcc.zone_id = z.id
     LEFT JOIN zone_postcode_rules zpr ON zpr.zone_id = z.id
     WHERE z.courier_service_id = $1
     GROUP BY z.id
     ORDER BY (SELECT COUNT(*) FROM zone_postcode_rules WHERE zone_id = z.id) DESC`,
    [serviceId]
  );

  for (const zone of zones.rows) {
    const countries = zone.countries || [];
    const rules = zone.postcode_rules || [];

    // Country must match
    if (!countries.includes(countryIso)) continue;

    // Check postcode inclusion/exclusion rules
    const includeRules = rules.filter(r => r.type === 'include');
    const excludeRules = rules.filter(r => r.type === 'exclude');

    // If any exclude rule matches, skip
    if (excludeRules.some(r => outcode.startsWith(r.prefix))) continue;

    // If include rules exist, postcode must match one of them
    if (includeRules.length && !includeRules.some(r => outcode.startsWith(r.prefix))) continue;

    return zone;
  }

  return null;
}

// ─── Weight calculation ───────────────────────────────────────────────────────

async function calcWeight(serviceId, parcel) {
  const actualKg = parseFloat(parcel.weight) || 0;

  // Look up volumetric rule via courier_services → volumetric_rules
  const dimRule = await query(
    `SELECT vr.divisor
     FROM   courier_services cs
     JOIN   volumetric_rules  vr ON vr.id = cs.volumetric_rule_id
     WHERE  cs.id = $1`,
    [serviceId]
  );

  let dimKg = 0;
  if (dimRule.rows.length) {
    const dim_length = parseFloat(parcel.dim_length || parcel.length || 0);
    const dim_width  = parseFloat(parcel.dim_width  || parcel.width  || 0);
    const dim_height = parseFloat(parcel.dim_height || parcel.height || 0);
    if (dim_length > 0 && dim_width > 0 && dim_height > 0) {
      dimKg = (dim_length * dim_width * dim_height) / dimRule.rows[0].divisor;
    }
  }

  // Use whichever is higher — actual weight wins ties
  const chargedKg = dimKg > actualKg ? dimKg : actualKg;
  return { actualKg, dimKg: parseFloat(dimKg.toFixed(3)), chargedKg: parseFloat(chargedKg.toFixed(3)) };
}

// ─── Cost price lookup ────────────────────────────────────────────────────────

async function lookupCostPrice(serviceId, zoneId, weightKg, isFirstParcel) {
  const today = new Date().toISOString().split('T')[0];

  // Check custom rate cards first
  const custom = await query(
    `SELECT price_first, price_sub, cost_per_kg, cost_per_kg_threshold_kg
     FROM custom_cost_rate_cards
     WHERE courier_service_id = $1 AND zone_id = $2
       AND min_weight_kg < $3 AND max_weight_kg >= $3
       AND (active_from IS NULL OR active_from <= $4)
       AND (active_to   IS NULL OR active_to   >= $4)
     ORDER BY active_from DESC NULLS LAST, min_weight_kg DESC LIMIT 1`,
    [serviceId, zoneId, weightKg, today]
  );

  let priceFirst, priceSub, costPerKg, costPerKgThreshold;
  if (custom.rows.length) {
    const row = custom.rows[0];
    priceFirst         = parseFloat(row.price_first);
    priceSub           = row.price_sub           != null ? parseFloat(row.price_sub)           : null;
    costPerKg          = row.cost_per_kg          != null ? parseFloat(row.cost_per_kg)          : null;
    costPerKgThreshold = row.cost_per_kg_threshold_kg != null ? parseFloat(row.cost_per_kg_threshold_kg) : 30;
  } else {
    // Standard weight band
    const band = await query(
      `SELECT price_first, price_sub, cost_per_kg, cost_per_kg_threshold_kg
       FROM weight_bands
       WHERE zone_id = $1 AND min_weight_kg < $2 AND max_weight_kg >= $2
       ORDER BY min_weight_kg DESC LIMIT 1`,
      [zoneId, weightKg]
    );
    if (!band.rows.length) return null;
    const row = band.rows[0];
    priceFirst         = parseFloat(row.price_first);
    priceSub           = row.price_sub           != null ? parseFloat(row.price_sub)           : null;
    costPerKg          = row.cost_per_kg          != null ? parseFloat(row.cost_per_kg)          : null;
    costPerKgThreshold = row.cost_per_kg_threshold_kg != null ? parseFloat(row.cost_per_kg_threshold_kg) : 30;
  }

  // Base rate: first parcel uses price_first; subsequent parcels use price_sub (if set)
  let basePrice = isFirstParcel ? priceFirst : (priceSub ?? priceFirst);

  // Per-kg surcharge above threshold (e.g. DHL: fixed up to 30 kg, then £x/kg or part thereof)
  if (costPerKg != null && weightKg > costPerKgThreshold) {
    const kgsOver = Math.ceil(weightKg - costPerKgThreshold);
    basePrice += kgsOver * costPerKg;
  }

  return basePrice;
}

// ─── Sell price calculation ───────────────────────────────────────────────────

async function lookupSellPrice(customerId, serviceId, zoneId, weightKg, costPrice) {
  const pricing = await query(
    `SELECT pricing_method, fixed_price, markup_pct, margin_pct
     FROM customer_pricing
     WHERE customer_id = $1 AND courier_service_id = $2 AND zone_id = $3
       AND min_weight_kg < $4 AND max_weight_kg >= $4
     ORDER BY min_weight_kg DESC LIMIT 1`,
    [customerId, serviceId, zoneId, weightKg]
  );

  if (!pricing.rows.length) return null;
  const { pricing_method, fixed_price, markup_pct, margin_pct } = pricing.rows[0];

  switch (pricing_method) {
    case 'fixed':      return parseFloat(fixed_price);
    case 'markup_pct': return costPrice * (1 + parseFloat(markup_pct) / 100);
    case 'margin_pct': return costPrice / (1 - parseFloat(margin_pct) / 100);
    default:           return null;
  }
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function processShipment(payload) {
  const { shipment } = payload;
  const charges = [];
  const errors  = [];

  try {
    // 1. IDENTIFY CUSTOMER
    const dcId = shipment?.billing?.customer_dc_id || shipment?.account_number;
    if (!dcId) throw new Error('No customer DC ID in payload (billing.customer_dc_id or account_number)');

    const custRow = await query(
      'SELECT id, multi_box_pricing FROM customers WHERE dc_id = $1', [dcId]
    );
    if (!custRow.rows.length) throw new Error(`No customer found with dc_id = ${dcId}`);
    const { id: customerId, multi_box_pricing } = custRow.rows[0];

    // 2. IDENTIFY SERVICE
    const serviceCode = shipment?.courier?.service_code || shipment?.dc_service_id;
    if (!serviceCode) throw new Error('No service_code in payload');

    const svcRow = await query(
      'SELECT id, fuel_group_id FROM courier_services WHERE service_code = $1',
      [serviceCode]
    );
    if (!svcRow.rows.length) throw new Error(`No courier service found with code = ${serviceCode}`);
    const { id: serviceId, fuel_group_id: fuelGroupId } = svcRow.rows[0];

    // 3. MATCH ZONE
    const countryIso = shipment?.ship_to?.country_iso;
    const postcode   = shipment?.ship_to?.postcode;

    // ISO Guard: must be exactly 2 uppercase letters — no silent coercion.
    // Reject immediately so a bad payload never lands in the wrong zone.
    if (!countryIso || !/^[A-Z]{2}$/.test(countryIso)) {
      throw new Error(
        `Validation Error: ship_to.country_iso "${countryIso}" is not a valid 2-letter ISO code — ` +
        `expected format: "GB", "DE", "FR" etc. Shipment rejected.`
      );
    }

    // 3a. RESOLVE FUEL RATES (customer-specific, keyed to fuel group)
    // Cost %: fuel_groups.fuel_surcharge_pct  (carrier-side)
    // Sell %: customer_fuel_group_pricing.sell_pct  (customer-specific)
    //         fallback: fuel_groups.standard_sell_pct  (default sell %)
    let fuelCostPct = 0;
    let fuelSellPct = 0;
    if (fuelGroupId) {
      const fuelRes = await query(
        `SELECT fg.fuel_surcharge_pct                            AS cost_pct,
                COALESCE(cfgp.sell_pct, fg.standard_sell_pct, 0) AS sell_pct
         FROM   fuel_groups fg
         LEFT JOIN customer_fuel_group_pricing cfgp
                   ON cfgp.fuel_group_id = fg.id AND cfgp.customer_id = $2
         WHERE  fg.id = $1`,
        [fuelGroupId, customerId]
      );
      if (fuelRes.rows.length) {
        fuelCostPct = parseFloat(fuelRes.rows[0].cost_pct || 0);
        fuelSellPct = parseFloat(fuelRes.rows[0].sell_pct || 0);
        console.log(`[pricing] Fuel group ${fuelGroupId}: cost=${fuelCostPct}%, sell=${fuelSellPct}% (customer ${customerId})`);
      } else {
        console.warn(`[pricing] Fuel group ${fuelGroupId} not found — fuel charges will be 0`);
      }
    }

    const zone = await matchZone(serviceId, countryIso, postcode);
    if (!zone) throw new Error(`No zone matched for service ${serviceCode}, country ${countryIso}, postcode ${postcode}`);

    // 4. PROCESS PARCELS
    const parcels     = shipment.parcels || [];
    const totalParcels = parcels.length;
    const voilaId     = shipment.id;
    const orderId     = shipment.reference || shipment.reference_2 || String(voilaId);
    const trackingCode = shipment?.courier?.tracking_code || null;
    const despatchDate = shipment.collection_date ? new Date(shipment.collection_date) : null;

    const commonFields = {
      customer_id:        customerId,
      voila_shipment_id:  voilaId,
      order_id:           orderId,
      tracking_code:      trackingCode,
      courier_service_id: serviceId,
      zone_id:            zone.id,
      ship_to_postcode:   postcode,
      ship_to_country_iso: countryIso,
      ship_to_name:       shipment?.ship_to?.name,
      parcel_count:       totalParcels,
      despatch_date:      despatchDate,
      raw_payload:        JSON.stringify(payload),
    };

    for (let i = 0; i < parcels.length; i++) {
      const parcel      = parcels[i];
      const isFirst     = i === 0;
      const parcelNum   = i + 1;

      // Weight
      const { actualKg, dimKg, chargedKg } = await calcWeight(serviceId, parcel);

      // Cost: multi-box uses sub rate for all but first; override below if enabled
      let useFirst = isFirst;
      if (multi_box_pricing && !isFirst) useFirst = false; // sub rate improves margin

      const costPrice = await lookupCostPrice(serviceId, zone.id, chargedKg, useFirst);
      if (costPrice == null) {
        errors.push(`No cost price found for parcel ${parcelNum} (${chargedKg}kg)`);
        continue;
      }

      // Sell
      let sellPrice = await lookupSellPrice(customerId, serviceId, zone.id, chargedKg, costPrice);
      if (sellPrice == null) {
        // No customer pricing configured — use cost as fallback (0 margin)
        sellPrice = costPrice;
        errors.push(`No customer pricing found for parcel ${parcelNum} — using cost price`);
      }

      // Base rate charge
      charges.push({
        ...commonFields,
        charge_type:           'base_rate',
        parcel_number:         parcelNum,
        weight_actual_kg:      actualKg,
        weight_dimensional_kg: dimKg,
        weight_charged_kg:     chargedKg,
        cost_price:            costPrice,
        sell_price:            sellPrice,
        status:                'unverified',
      });

      // 7. FUEL SURCHARGE
      // Cost from fuel_groups.fuel_surcharge_pct (carrier rate).
      // Sell from customer_fuel_group_pricing.sell_pct → fuel_groups.standard_sell_pct.
      // Both resolved above via fuelCostPct / fuelSellPct.
      if (fuelCostPct > 0 || fuelSellPct > 0) {
        charges.push({
          ...commonFields,
          charge_type:   'fuel_surcharge',
          parcel_number: parcelNum,
          cost_price:    +(costPrice * fuelCostPct / 100).toFixed(2),
          sell_price:    +(sellPrice * fuelSellPct / 100).toFixed(2),
          status:        'unverified',
        });
      }
    }

    // 8. CONGESTION SURCHARGE (once per shipment, not per parcel)
    const outcode = outcodeOf(postcode);
    const congestion = await query(
      `SELECT fee FROM congestion_surcharges
       WHERE courier_service_id = $1 AND $2 LIKE postcode_prefix || '%'
       LIMIT 1`,
      [serviceId, outcode]
    );
    if (congestion.rows.length) {
      const fee = parseFloat(congestion.rows[0].fee);
      charges.push({
        ...commonFields,
        charge_type: 'congestion_surcharge',
        cost_price:  fee,
        sell_price:  fee,
        status:      'unverified',
      });
    }

    // 9. RULES ENGINE
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

      // Calculate charge amount
      const baseCharge = charges.find(c => c.charge_type === 'base_rate');
      const baseRate   = baseCharge ? parseFloat(baseCharge.cost_price) : 0;
      const chargedKg  = baseCharge ? parseFloat(baseCharge.weight_charged_kg || 0) : 0;
      const parcelCount = totalParcels;

      let chargeAmt = 0;
      switch (rule.charge_method) {
        case 'fixed':      chargeAmt = parseFloat(rule.charge_value); break;
        case 'percentage': chargeAmt = baseRate * parseFloat(rule.charge_value) / 100; break;
        case 'per_kg':     chargeAmt = chargedKg * parseFloat(rule.charge_value); break;
        case 'per_parcel': chargeAmt = parcelCount * parseFloat(rule.charge_value); break;
      }

      charges.push({
        ...commonFields,
        charge_type: rule.name,
        cost_price:  +chargeAmt.toFixed(2),
        sell_price:  +chargeAmt.toFixed(2),
        status:      'unverified',
      });
    }

    return { charges, errors };

  } catch (err) {
    throw err;
  }
}

/** Insert calculated charges into the database */
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
         parcel_count, raw_payload
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        c.customer_id, c.voila_shipment_id, c.order_id, c.tracking_code,
        c.courier_service_id, c.zone_id, c.charge_type, c.parcel_number || null,
        c.weight_actual_kg || null, c.weight_dimensional_kg || null, c.weight_charged_kg || null,
        c.cost_price, c.sell_price, c.status,
        c.despatch_date || null, c.ship_to_postcode || null, c.ship_to_country_iso || null, c.ship_to_name || null,
        c.parcel_count || null, c.raw_payload ? JSON.parse(c.raw_payload) : null,
      ]
    );
    if (result.rows.length) inserted.push(result.rows[0]);
  }
  return inserted;
}
