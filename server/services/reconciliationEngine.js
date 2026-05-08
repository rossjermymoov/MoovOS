/**
 * Moov OS — Reconciliation Engine  (Bucket and Bill)
 *
 * Architecture: Trust the Charge.
 *
 *   expected_amount = charges.total_cost_price
 *     (base cost_price + sum of fuel/surcharge charges for the same shipment)
 *
 * This value was set correctly at booking time by pricingEngine / billing.js
 * and is the single source of truth for what we expect to pay the carrier.
 * The engine no longer re-derives expected from weight_bands — doing so was
 * duplicating logic that already ran at booking time and introduced a second
 * source of truth that silently diverged.
 *
 * Three outcomes per line:
 *   GREEN  (matched)           |carrier_amount − expected| < £0.02
 *   AMBER  (corrected/mapping) Phase 4a mapping rule explains the delta
 *   RED    (unmatched)         everything else → price_mismatch
 *
 * No fallbacks.  No ILIKE price lookups.  No zone-free band estimates.
 * If data is missing or wrong, the line surfaces as RED so the operator
 * can fix the underlying data rather than having the engine paper over it.
 *
 * Entry point: processReconciliationRun(runId, carrierId, lines)
 *   lines = array of normalised invoice objects (see InvoiceLine typedef below)
 *
 * DHL-specific notes:
 *   • Per-parcel lines: tracking_number present, charge_type = 'base' (or blank)
 *   • Multi-parcel shipments: multiple lines share the same tracking_number.
 *     Engine groups them and compares the SUM against charges.total_cost_price.
 *   • Aggregate lines: tracking_number is EMPTY. Filtered out before processing.
 *
 * DPD-specific notes:
 *   • One invoice line per consignment (H row). parcel_count = items column.
 *   • charges.total_cost_price already includes fuel (billed inside Revenue column).
 *   • parcel_pricing = 'all_sub' is metadata only — no rate card recomputation.
 */

import { query } from '../db/index.js';
import { computeGhostCharge, insertCharges, lookupCarrierBandCost, matchZone } from './pricingEngine.js';

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} InvoiceLine
 * @property {string}  tracking_number       empty string for aggregate lines
 * @property {string}  [account_number]
 * @property {string}  service_code          raw code from carrier CSV
 * @property {string}  [charge_type]         base | fuel | surcharge | adjustment
 * @property {number}  carrier_amount        what carrier billed (£)
 * @property {number}  [billed_weight_kg]    weight as billed by carrier
 * @property {number}  [parcel_count]        items in shipment (DHL column J)
 * @property {Object}  [surcharge_amounts]   { [surcharge_id]: amount } from CSV column mappings
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n) { return Math.round(n * 100) / 100; }

/**
 * Pool lookup — strict exact-match only.
 *
 * Tracking numbers are immutable strings.  The value in the carrier invoice
 * CSV must match the value stored in the OMS exactly — same prefix, same
 * length, same format.  If the DB stores "601234567890" and the invoice has
 * "1234567890" (or vice versa), that is a DATA inconsistency that must be
 * fixed in the database, not patched by silent prefix stripping here.
 */
function poolLookup(pool, trackKey) {
  const hits = pool.get(trackKey);
  return (hits && hits.length) ? hits : [];
}

// ─── Carrier Profile Options ─────────────────────────────────────────────────

/**
 * Fetch the default CSV profile options for a carrier.
 *
 * separate_fuel_rows (bool, default false):
 *   Some carriers (DPD) bill fuel, carriage, and energy as separate invoice
 *   rows rather than bundling them into the freight row amount.
 *   When true:
 *     • Freight lines are compared against charges.cost_price (base only),
 *       not total_cost_price (base + fuel).
 *     • Rows with no service mapping (fuel, carriage, global energy) are
 *       auto-accepted as carrier_overhead instead of blocked as unknown_service_code.
 */
async function getCarrierProfileOptions(carrierId) {
  const res = await query(
    `SELECT column_map FROM carrier_csv_profiles WHERE carrier_id = $1 AND is_default = true LIMIT 1`,
    [carrierId]
  );
  const map = res.rows[0]?.column_map || {};
  return {
    separateFuelRows: Boolean(map.separate_fuel_rows),
    parcelPricing:    map.parcel_pricing || null,   // 'all_sub' for DPD
  };
}

// ─── Phase 1b: Service Code Normalisation ────────────────────────────────────

/**
 * Returns { serviceMap, surchargeMap } for this carrier.
 *
 * serviceMap:  { [RAW_CODE_UPPER]: service_id }   — delivery service mappings
 * surchargeMap: { [RAW_CODE_UPPER]: surcharge_id } — surcharge mappings
 *
 * TWO-LAYER LOOKUP:
 *   Layer 1 — Explicit mappings from courier_service_code_mappings (highest priority)
 *   Layer 2 — Implied mappings derived from courier_services.service_code suffix
 */
async function buildServiceCodeMap(carrierId) {
  const serviceMap   = {};
  const surchargeMap = {};

  // ── Layer 2 first (lower priority) — implied from service_code suffix ────
  const svcs = await query(
    `SELECT id AS service_id, service_code
     FROM   courier_services
     WHERE  courier_id = $1 AND service_code IS NOT NULL`,
    [carrierId]
  );
  for (const row of svcs.rows) {
    const code    = row.service_code.trim();
    const codeUp  = code.toUpperCase();
    const parts   = code.split('-');
    const suffix  = parts[parts.length - 1].trim().toUpperCase();

    if (!serviceMap[codeUp]) serviceMap[codeUp] = row.service_id;
    if (suffix && suffix !== codeUp && !serviceMap[suffix]) serviceMap[suffix] = row.service_id;
  }

  // ── Layer 1 (higher priority) — explicit saved rules ─────────────────────
  const explicit = await query(
    `SELECT courier_code, service_id, surcharge_id
     FROM   courier_service_code_mappings
     WHERE  carrier_id = $1 AND is_active = true AND customer_id IS NULL`,
    [carrierId]
  );
  for (const row of explicit.rows) {
    const key = row.courier_code.trim().toUpperCase();
    if (row.surcharge_id) {
      delete serviceMap[key];
      surchargeMap[key] = row.surcharge_id;
    } else if (row.service_id) {
      serviceMap[key] = row.service_id;
    }
  }

  const surchargeCount = Object.keys(surchargeMap).length;
  const impliedCount   = Object.keys(serviceMap).length - (explicit.rows.filter(r => r.service_id).length);
  console.log(`[recon engine] Code map for carrier ${carrierId}: ${explicit.rows.length} explicit (${surchargeCount} surcharge) + ${impliedCount} implied service entries`);

  return { serviceMap, surchargeMap };
}

// ─── Pre-condition: Build Verified Pool ──────────────────────────────────────
//
// Single query, run once per job.
// Returns Map: tracking_number (upper) → charge row[]
//
// VERIFICATION GATE:
//   Only shipments that have been physically collected by the carrier are
//   eligible for reconciliation. A shipment is considered "despatched" when
//   it has at least one entry in tracking_codes (the carrier has assigned a
//   tracking number — this happens at collection/scan).

async function buildVerifiedPool(carrierId) {
  const res = await query(`
    SELECT
      c.id              AS charge_id,
      c.order_id        AS reference,
      c.customer_id,
      c.cost_price      AS expected_cost,
      c.recon_corrected,
      c.shipment_id,
      c.charge_type,
      c.zone_id,
      COALESCE(
        s.tracking_codes,
        CASE WHEN c.tracking_code IS NOT NULL THEN ARRAY[c.tracking_code] ELSE NULL END
      )                 AS tracking_codes,
      s.dc_service_id,
      s.total_weight_kg AS declared_weight_kg,
      s.parcel_count    AS shipment_parcel_count,
      cu.account_number AS customer_account,
      -- rate_per_parcel: normalised per-parcel base cost regardless of how cost_price was stored.
      -- For charges created with wrong parcel_qty, cost_price = per-parcel rate and
      -- shipment_parcel_count = 1 → rate_per_parcel = cost_price.
      -- For correctly-stored charges, cost_price = total → rate_per_parcel = total / n.
      -- Multiplying rate_per_parcel × invoice_parcel_count gives the correct expected total
      -- for DPD all-sub regardless of which format was stored.
      ROUND(c.cost_price::numeric / GREATEST(COALESCE(s.parcel_count, 1), 1), 4) AS rate_per_parcel,
      -- total_cost_price: base courier cost + all fuel/surcharge charges for this shipment.
      -- This is the single source of truth for what we expect to pay the carrier.
      -- Set correctly at booking time by pricingEngine / billing.js.
      COALESCE(c.cost_price, 0)
        + COALESCE((
            SELECT SUM(sc.cost_price)
            FROM   charges sc
            WHERE  sc.shipment_id = c.shipment_id
              AND  sc.charge_type IN ('fuel','surcharge')
              AND  sc.cancelled   = false
          ), 0)         AS total_cost_price
    FROM   charges      c
    LEFT JOIN shipments    s  ON s.id = c.shipment_id
    JOIN      couriers     cu_carrier ON cu_carrier.id = $1
    LEFT JOIN customers    cu ON cu.id = c.customer_id
    WHERE  c.verified      = true
      AND  c.cancelled     = false
      AND  c.charge_type   = 'courier'
      AND (
        -- Strict carrier matching — exact case-insensitive match on code/name,
        -- known webhook variant aliases, or the charge's courier_service_id.
        --
        -- couriers.aliases holds webhook variant strings that differ from code/name
        -- (e.g. 'DHLParcelUKCloud' for code='DHL').  Add new variants there rather
        -- than adding fuzzy wildcards here.
        LOWER(s.courier) = LOWER(cu_carrier.code)
        OR LOWER(s.courier) = LOWER(cu_carrier.name)
        OR EXISTS (
          SELECT 1 FROM unnest(cu_carrier.aliases) alias
          WHERE  LOWER(alias) = LOWER(s.courier)
        )
        OR EXISTS (
          SELECT 1 FROM courier_services cs2
          WHERE  cs2.id = c.courier_service_id AND cs2.courier_id = $1
        )
      )
      AND (
        (s.tracking_codes IS NOT NULL AND array_length(s.tracking_codes, 1) > 0)
        OR s.dc_service_id    IS NOT NULL
        OR c.tracking_code    IS NOT NULL
        OR c.voila_shipment_id IS NOT NULL
      )
  `, [carrierId]);

  const pool = new Map();

  function addToPool(key, row) {
    if (!pool.has(key)) pool.set(key, []);
    const bucket = pool.get(key);
    if (!bucket.find(r => r.charge_id === row.charge_id)) bucket.push(row);
  }

  for (const row of res.rows) {
    // ── Index by tracking_codes — EXACT MATCH ONLY ────────────────────────
    const codes = row.tracking_codes || [];
    for (const code of codes) {
      const key = String(code).trim().toUpperCase();
      addToPool(key, row);
    }

    // ── Index by dc_service_id — EXACT MATCH ONLY ────────────────────────
    if (row.dc_service_id) {
      const dcKey = String(row.dc_service_id).trim().toUpperCase();
      addToPool(dcKey, row);
    }

    // ── Index by order reference ──────────────────────────────────────────
    if (row.reference) {
      const refKey = String(row.reference).trim().toUpperCase();
      addToPool(refKey, row);
    }
  }

  const poolSize = pool.size;
  console.log(`[recon engine] Verified pool built: ${poolSize} unique keys from ${res.rows.length} charge records`);
  if (poolSize === 0) {
    console.warn(`[recon engine] WARNING: pool is EMPTY — carrier name/code may not match shipments.courier, or no verified shipments have dc_service_id/tracking_codes`);
  }

  return { pool, poolSize };
}

// ─── Phase 2: Account number → customer lookup ────────────────────────────────

async function lookupCustomerByAccount(accountNumber) {
  if (!accountNumber) return null;
  const acct = String(accountNumber).trim();

  const res = await query(
    `SELECT cu.id AS customer_id, cu.business_name, cu.account_number AS customer_account
     FROM   customer_carrier_links ccl
     JOIN   customers              cu ON cu.id = ccl.customer_id
     WHERE  ccl.account_number = $1
     LIMIT  1`,
    [acct]
  );
  if (res.rows.length) return res.rows[0];

  const fallback = await query(
    `SELECT id AS customer_id, business_name,
            COALESCE(account_number, dc_customer_id) AS customer_account
     FROM   customers
     WHERE  account_number = $1 OR dc_customer_id = $1
     LIMIT  1`,
    [acct]
  );
  return fallback.rows[0] || null;
}

// ─── Phase 4a: Load Mapping Engine rules ─────────────────────────────────────

async function loadMappings(carrierId) {
  const res = await query(
    `SELECT * FROM reconciliation_mappings
     WHERE  carrier_id = $1 AND is_active = true
     ORDER  BY created_at`,
    [carrierId]
  );
  return res.rows;
}

function applyMappings(mappings, line, delta) {
  for (const m of mappings) {
    if (m.mapping_type === 'delta_acceptance') {
      const chargeTypeMatch = !m.match_value || m.match_value === '*' ||
        (line.charge_type || 'base').toLowerCase() === m.match_value.toLowerCase();
      if (!chargeTypeMatch) continue;

      const tolerancePct = parseFloat(m.resolution_value) || 0;
      const expected = line._expected_amount || 0;
      if (expected === 0) continue;

      const deltaPct = Math.abs(delta / expected) * 100;
      if (deltaPct <= tolerancePct) {
        return { applied: true, mappingId: m.id };
      }
    }
  }
  return null;
}

// ─── Aggregate helpers ────────────────────────────────────────────────────────

/**
 * Sum expected fuel costs for all shipments matched in this run.
 */
async function calculateExpectedFuelTotal(pool, matchedTrackingKeys) {
  let total = 0;
  const seenShipments = new Set();

  for (const trackKey of matchedTrackingKeys) {
    const poolHits = poolLookup(pool, trackKey);
    if (poolHits.length === 0) continue;
    const charge = poolHits[0];
    if (seenShipments.has(charge.shipment_id)) continue;
    seenShipments.add(charge.shipment_id);

    const fuelRes = await query(
      `SELECT COALESCE(SUM(cost_price), 0) AS fuel_cost
       FROM   charges
       WHERE  shipment_id = $1
         AND  charge_type = 'fuel'
         AND  cancelled   = false`,
      [charge.shipment_id]
    );
    total += parseFloat(fuelRes.rows[0]?.fuel_cost || 0);
  }
  return round2(total);
}

/**
 * Look up the HGV (or comparable aggregate) surcharge rate per parcel for this carrier.
 */
async function fetchCarrierHGVRate(carrierId) {
  const res = await query(`
    SELECT ROUND(c.cost_price::numeric / GREATEST(COALESCE(s.parcel_count, 1), 1), 4) AS rate_per_parcel
    FROM   charges    c
    JOIN   shipments  s  ON s.id = c.shipment_id
    JOIN   couriers   cu ON (
             s.courier ILIKE cu.code OR s.courier ILIKE cu.name
           )
    WHERE  cu.id          = $1
      AND  c.charge_type  = 'surcharge'
      AND  c.cancelled    = false
      AND  UPPER(c.service_name) LIKE '%HGV%'
      AND  c.cost_price   > 0
    ORDER  BY c.created_at DESC
    LIMIT  1
  `, [carrierId]);

  const rate = parseFloat(res.rows[0]?.rate_per_parcel || 0);
  if (rate > 0) console.log(`[recon engine] HGV rate for carrier ${carrierId}: £${rate}/parcel`);
  return rate;
}

// ─── Phase 3a: Process aggregate line (fuel or HGV) ──────────────────────────

async function processAggregateLine(line, runId, carrierId, expectedFuelTotal, hgvRatePerParcel, totalParcelCount) {
  const carrierAmount = round2(parseFloat(line.carrier_amount) || 0);
  const chargeType    = (line.charge_type  || '').toLowerCase();
  const serviceCode   = (line.service_code || '').toLowerCase();

  const isFuelLine = chargeType.includes('fuel') || serviceCode.includes('fuel');

  let expectedAmount  = null;
  let status          = 'unmatched';
  let unmatchedReason = 'aggregate_mismatch';

  if (isFuelLine) {
    expectedAmount = expectedFuelTotal;
    const delta    = round2(carrierAmount - expectedAmount);
    if (Math.abs(delta) <= 1.00) {
      status = 'matched';
    } else {
      unmatchedReason = 'fuel_aggregate_mismatch';
    }
    console.log(`[recon engine] Fuel aggregate: carrier=£${carrierAmount} expected=£${expectedAmount} delta=£${delta} → ${status}`);

  } else {
    if (hgvRatePerParcel > 0) {
      expectedAmount = round2(totalParcelCount * hgvRatePerParcel);
      const delta    = round2(carrierAmount - expectedAmount);
      if (Math.abs(delta) < 0.02) {
        status = 'matched';
      } else {
        unmatchedReason = 'hgv_aggregate_mismatch';
      }
      console.log(`[recon engine] HGV aggregate: ${totalParcelCount} parcels × £${hgvRatePerParcel} = £${expectedAmount}, carrier=£${carrierAmount} → ${status}`);
    } else {
      unmatchedReason = 'no_hgv_rate';
      console.log(`[recon engine] HGV aggregate: no rate on file for carrier ${carrierId} — unmatched`);
    }
  }

  await insertLine(runId, {
    tracking_number:          null,
    carrier_account_no:       line.account_number || null,
    raw_service_code:         line.service_code   || null,
    charge_type:              chargeType || 'surcharge',
    carrier_amount:           carrierAmount,
    carrier_billed_weight_kg: null,
    service_id:               null,
    customer_id:              null,
    charge_id:                null,
    expected_amount:          expectedAmount,
    delta:                    expectedAmount !== null ? round2(carrierAmount - expectedAmount) : null,
    status,
    corrected_by:             null,
    unmatched_reason:         status === 'unmatched' ? unmatchedReason : null,
    source:                   'internal',
    is_fuel:                  isFuelLine,
  });

  return { status };
}

// ─── Carrier-Direct Rule ──────────────────────────────────────────────────────
//
// Called when a carrier invoice line has no matching OMS charge record (pool
// MISS) but we CAN identify the customer via their carrier account number.
//
// These are real-world shipments — returns, ad-hoc sends, or manual bookings
// made directly with the carrier without going through the Moov OS platform.
// We price them from our rate cards so the margin is always known, and tag them
// source='carrier_direct' so they are clearly distinguished from platform-booked
// charges and can be filtered in the Finance table.
//
// Flow:
//   1. Call computeGhostCharge — zone + band lookup using invoice service/weight/postcode.
//   2. Insert a charge row tagged source='carrier_direct' (charge_type='courier',
//      verified=true) so it appears in Finance and reconciliation pool on future runs.
//   3. Compare the computed cost_price against the carrier_amount.
//      GREEN (|delta| < £0.02) → status = 'matched'
//      AMBER (delta exists)    → status = 'corrected', corrected_by = 'carrier_direct'
//   4. If pricing fails (no zone, no band, weight = 0) → RED with
//      unmatched_reason = 'carrier_direct_error_<reason>' for operator review.

async function handleCarrierDirect({
  serviceId, customer, trackingNumber, carrierAmount,
  weightKg, postcode, countryIso,
  rawServiceCode, runId, line, ctx,
}) {
  const kg = parseFloat(weightKg) || 0;

  // Parcel count: always take from the invoice line.
  // For all_sub carriers (DPD) every parcel — including the first — is billed
  // at price_sub. We need the actual item count to compute the correct expected.
  // For non-all_sub carriers the invoice normally has 1 line per parcel anyway,
  // so parcelCount=1 is correct for those single-line rows.
  const parcelCount = (line.parcel_count || 1) > 1 ? (line.parcel_count || 1) : 1;

  console.log(
    `[carrier-direct] tracking=${trackingNumber} ` +
    `customer=${customer.customer_id} items=${parcelCount} weight=${kg}kg ` +
    `postcode=${postcode ?? 'null'} country=${countryIso ?? 'null'} ` +
    `parcelPricing=${ctx?.parcelPricing ?? 'standard'}`
  );

  if (kg <= 0) {
    // No weight data from invoice — cannot price without weight.
    console.warn(`[recon engine] Carrier-Direct skipped (weight=0): ${trackingNumber}`);
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: null,
      service_id:               serviceId,
      customer_id:              customer.customer_id,
      charge_id:                null,
      expected_amount:          null,
      delta:                    null,
      status:                   'unmatched',
      corrected_by:             null,
      unmatched_reason:         'carrier_direct_error_no_weight',
      source:                   'carrier_direct',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         postcode               || null,
      ship_to_country:          countryIso             || null,
      parcel_count:             parcelCount > 1 ? parcelCount : null,
    });
    return { status: 'unmatched' };
  }

  // For all_sub carriers (DPD) pass the per-parcel weight to the band lookup so
  // the weight threshold is evaluated against individual parcels, not the full
  // consignment weight. A 2×17.5 kg shipment should hit the 20 kg band, not the
  // 35 kg band (which may not exist and returns no_cost_band).
  const isAllSub    = ctx?.parcelPricing === 'all_sub';
  const perParcelKg = (isAllSub && parcelCount > 1) ? round2(kg / parcelCount) : kg;

  const pricing = await computeGhostCharge(
    serviceId,
    customer.customer_id,
    perParcelKg,   // per-parcel weight for band lookup
    postcode,
    countryIso || 'GB'
  );

  if (pricing.error) {
    console.warn(`[recon engine] Carrier-Direct pricing failed for ${trackingNumber}: ${pricing.error} — ${pricing.detail} (perParcelKg=${perParcelKg}kg, totalKg=${kg}kg, parcels=${parcelCount})`);
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: kg || null,
      service_id:               serviceId,
      customer_id:              customer.customer_id,
      charge_id:                null,
      expected_amount:          null,
      delta:                    null,
      status:                   'unmatched',
      corrected_by:             null,
      unmatched_reason:         `carrier_direct_error_${pricing.error}`,
      source:                   'carrier_direct',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         postcode               || null,
      ship_to_country:          countryIso             || null,
      parcel_count:             parcelCount > 1 ? parcelCount : null,
    });
    return { status: 'unmatched' };
  }

  // ── Rate selection ─────────────────────────────────────────────────────────
  // For all_sub carriers (DPD): every parcel — including the first — is billed
  // at price_sub, not price_first. computeGhostCharge now returns both.
  //   • cost_price = price_first  (single-parcel base rate, looked up using perParcelKg)
  //   • cost_sub   = price_sub    (per-parcel rate when all_sub; null otherwise)
  //
  // Rule:
  //   parcelCount > 1 AND all_sub AND cost_sub is not null → use cost_sub × N
  //   otherwise                                            → use cost_price × N
  // (isAllSub is defined above, before computeGhostCharge, so perParcelKg could be computed)
  const perParcelRate = (isAllSub && parcelCount > 1 && pricing.cost_sub != null)
    ? pricing.cost_sub   // price_sub × N
    : pricing.cost_price; // price_first (× N for non-all_sub, or × 1 for single parcel)

  const totalCostPrice = round2(perParcelRate * parcelCount);
  const totalSellPrice = round2((pricing.sell_price ?? perParcelRate) * parcelCount);

  // ── Full diagnostic trace ─────────────────────────────────────────────────
  console.log(
    `[carrier-direct] TRACE tracking=${trackingNumber} ` +
    `| items=${parcelCount} | weight=${kg}kg (per_parcel=${perParcelKg}kg) ` +
    `| zone_id=${pricing.zone_id} zone="${pricing.zone_name}" band="${pricing.band_label}" ` +
    `| price_first=£${pricing.cost_price} price_sub=£${pricing.cost_sub ?? 'n/a'} ` +
    `| per_parcel_rate=£${perParcelRate} (${isAllSub && parcelCount > 1 ? 'all_sub → price_sub' : 'price_first'}) ` +
    `| total_cost=£${totalCostPrice} carrier=£${carrierAmount}`
  );

  // ── Insert the carrier-direct charge ─────────────────────────────────────
  // - charge_type = 'courier' so it appears in Finance and pool on next runs.
  // - verified = true so it passes buildVerifiedPool's gate.
  // - source = 'carrier_direct' — filterable in Finance table.
  const newCharges = await insertCharges([{
    customer_id:         customer.customer_id,
    voila_shipment_id:   null,
    order_id:            null,
    tracking_code:       trackingNumber,
    courier_service_id:  serviceId,
    zone_id:             pricing.zone_id,
    charge_type:         'courier',
    weight_charged_kg:   kg,
    cost_price:          totalCostPrice,
    sell_price:          totalSellPrice,
    status:              'verified',
    ship_to_postcode:    postcode    || null,
    ship_to_country_iso: countryIso || null,
    source:              'carrier_direct',
    raw_payload:         JSON.stringify({
      carrier_direct: true, run_id: runId,
      parcel_count: parcelCount, per_parcel_rate: perParcelRate,
      zone_id: pricing.zone_id, zone_name: pricing.zone_name,
      band_label: pricing.band_label,
      rate_basis: isAllSub && parcelCount > 1 ? 'price_sub' : 'price_first',
    }),
  }]);

  const insertedId     = newCharges[0]?.id || null;
  const expectedAmount = totalCostPrice;
  const delta          = round2(carrierAmount - expectedAmount);
  const isMatch        = Math.abs(delta) < 0.02;

  console.log(
    `[carrier-direct] charge inserted id=${insertedId}: ` +
    `expected=£${expectedAmount} carrier=£${carrierAmount} delta=£${delta} → ${isMatch ? 'MATCHED' : 'CORRECTED'}`
  );

  await insertLine(runId, {
    tracking_number:          trackingNumber,
    carrier_account_no:       line.account_number    || null,
    raw_service_code:         rawServiceCode,
    charge_type:              line.charge_type       || 'base',
    carrier_amount:           carrierAmount,
    carrier_billed_weight_kg: kg,
    service_id:               serviceId,
    customer_id:              customer.customer_id,
    charge_id:                insertedId,
    expected_amount:          expectedAmount,
    delta:                    delta,
    status:                   isMatch ? 'matched' : 'corrected',
    corrected_by:             isMatch ? null : 'carrier_direct',
    unmatched_reason:         null,
    source:                   'carrier_direct',
    shipment_date:            line.shipment_date     || null,
    ship_to_postcode:         postcode               || null,
    ship_to_country:          countryIso             || null,
    parcel_count:             parcelCount > 1 ? parcelCount : null,
  });

  return { status: isMatch ? 'matched' : 'corrected' };
}

// ─── Main engine entry point ──────────────────────────────────────────────────

/**
 * processReconciliationRun
 *
 * @param {number}        runId     — pre-created reconciliation_runs.id
 * @param {number}        carrierId — couriers.id
 * @param {InvoiceLine[]} lines     — parsed invoice lines
 * @returns {Promise<Object>}        run summary stats
 */
export async function processReconciliationRun(runId, carrierId, lines) {
  const startTime = Date.now();

  // Load carrier profile options (e.g. separate_fuel_rows for DPD)
  const { separateFuelRows, parcelPricing } = await getCarrierProfileOptions(carrierId);
  if (separateFuelRows) {
    console.log(`[recon engine] Run ${runId}: separate_fuel_rows=true — freight lines compared against base cost_price only; overhead rows auto-accepted`);
  }
  if (parcelPricing) {
    console.log(`[recon engine] Run ${runId}: parcel_pricing=${parcelPricing} — all-sub carrier: carrier_direct charges use n×price_sub; pool hits use stored total cost_price`);
  }

  const reconcilableLines = lines.filter(l => String(l.tracking_number || '').trim());
  const skippedCount      = lines.length - reconcilableLines.length;
  if (skippedCount > 0) {
    console.log(`[recon engine] Run ${runId}: skipping ${skippedCount} line(s) with no consignment number (fuel/HGV aggregate rows)`);
  }

  await query(
    `UPDATE reconciliation_runs SET status = 'processing', total_lines = $2 WHERE id = $1`,
    [runId, reconcilableLines.length]
  );

  // ── Phase 1b: Build service code map ──────────────────────────────────────
  const { serviceMap: serviceCodeMap, surchargeMap } = await buildServiceCodeMap(carrierId);

  // ── Pre-condition: Build Verified Pool ────────────────────────────────────
  const { pool, poolSize } = await buildVerifiedPool(carrierId);

  await query(
    `UPDATE reconciliation_runs SET pool_size = $2 WHERE id = $1`,
    [runId, poolSize]
  );

  // ── Phase 4a: Load Mapping Engine rules ───────────────────────────────────
  const mappings = await loadMappings(carrierId);

  // ── Run-scoped customer lookup cache ──────────────────────────────────────
  const _custCache = new Map();
  const ctx = {
    separateFuelRows,
    parcelPricing,
    async customerLookup(accountNumber) {
      if (!accountNumber) return null;
      const k = String(accountNumber).trim();
      if (_custCache.has(k)) return _custCache.get(k);
      const r = await lookupCustomerByAccount(k);
      _custCache.set(k, r);
      return r;
    },
  };

  // Diagnostic: log first 3 reconcilable lines
  console.log(`[recon engine] Run ${runId}: ${reconcilableLines.length} reconcilable lines (${skippedCount} aggregate skipped)`);
  reconcilableLines.slice(0, 3).forEach((l, i) => {
    console.log(`[recon engine]   line[${i}]: tracking_number=${JSON.stringify(l.tracking_number)} service_code=${JSON.stringify(l.service_code)} carrier_amount=${JSON.stringify(l.carrier_amount)}`);
  });

  // ── Group lines by tracking number (multi-parcel support) ───────────────
  // DHL bills each parcel as a separate line under the same tracking number.
  // We compare the SUM of per-parcel carrier amounts against the single
  // charge record's total_cost_price.
  const trackingGroups = new Map();
  for (const line of reconcilableLines) {
    const key = String(line.tracking_number).trim().toUpperCase();
    if (!trackingGroups.has(key)) trackingGroups.set(key, []);
    trackingGroups.get(key).push(line);
  }

  const multiParcelGroups = [...trackingGroups.values()].filter(g => g.length > 1);
  if (multiParcelGroups.length > 0) {
    console.log(`[recon engine] Run ${runId}: ${multiParcelGroups.length} multi-parcel tracking group(s) detected`);
  }

  // Counters
  let matched = 0, corrected = 0, unmatched = 0, ignored = 0;

  // ── Process tracking groups — parallel batches ────────────────────────────
  const BATCH_SIZE  = 40;
  const groupsArray = [...trackingGroups.entries()];

  for (let i = 0; i < groupsArray.length; i += BATCH_SIZE) {
    const batch = groupsArray.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(([trackKey, group]) =>
        processTrackingGroup(group, trackKey, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx)
      )
    );

    for (const res of results) {
      if (res.status === 'fulfilled') {
        for (const r of res.value) {
          switch (r.status) {
            case 'matched':   matched++;   break;
            case 'corrected': corrected++; break;
            case 'unmatched': unmatched++; break;
            case 'ignored':   ignored++;   break;
          }
        }
      } else {
        console.error(`[recon engine] Run ${runId}: group processing error:`, res.reason?.message);
        unmatched++;
      }
    }
  }

  // ── Calculate automation rate ─────────────────────────────────────────────
  const total          = reconcilableLines.length;
  const autoResolved   = matched + corrected;
  const automationRate = total > 0 ? round2((autoResolved / total) * 100) : 0;

  // ── Finalise run ──────────────────────────────────────────────────────────
  const overallStatus = unmatched > 0 ? 'needs_review' : 'complete';

  await query(`
    UPDATE reconciliation_runs
    SET status          = $2,
        matched_count   = $3,
        corrected_count = $4,
        unmatched_count = $5,
        ignored_count   = $6,
        automation_rate = $7,
        completed_at    = NOW()
    WHERE id = $1
  `, [runId, overallStatus, matched, corrected, unmatched, ignored, automationRate]);

  console.log(`[recon engine] Run ${runId} complete in ${Date.now() - startTime}ms — ` +
    `${matched} matched, ${corrected} corrected, ${unmatched} unmatched, ` +
    `${skippedCount} aggregate skipped, automation: ${automationRate}%`);

  return {
    run_id:          runId,
    status:          overallStatus,
    total:           total,
    matched:         matched,
    corrected:       corrected,
    unmatched:       unmatched,
    ignored:         ignored,
    automation_rate: automationRate,
    pool_size:       poolSize,
    duration_ms:     Date.now() - startTime,
  };
}

// ─── Process a group of lines sharing the same tracking number ────────────────

/**
 * Sum surcharge_amounts from all lines in a group.
 * Returns { total, breakdown: [{ surcharge_id, amount }] }
 */
function sumGroupColumnSurcharges(lines) {
  const byId = {};
  for (const line of lines) {
    if (!line.surcharge_amounts) continue;
    for (const [surchargeId, raw] of Object.entries(line.surcharge_amounts)) {
      const amt = round2(parseFloat(raw) || 0);
      if (amt <= 0) continue;
      byId[surchargeId] = round2((byId[surchargeId] || 0) + amt);
    }
  }
  const breakdown = Object.entries(byId).map(([surcharge_id, amount]) => ({ surcharge_id, amount }));
  const total = round2(breakdown.reduce((s, r) => s + r.amount, 0));
  return { total, breakdown };
}

async function processTrackingGroup(group, trackKey, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx) {
  // Single-line shortcut
  if (group.length === 1) {
    const result = await processLine(group[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
    return [result];
  }

  // ── Multi-parcel group ────────────────────────────────────────────────────
  // Split known surcharge-mapped lines out first so they don't inflate the
  // freight total. Each surcharge line is auto-corrected immediately.
  const surchargeLines = group.filter(l => surchargeMap[String(l.service_code || '').trim().toUpperCase()]);
  const baseLines      = group.filter(l => !surchargeMap[String(l.service_code || '').trim().toUpperCase()]);
  const results        = [];

  for (const line of surchargeLines) {
    const rawCode = String(line.service_code || '').trim();
    console.log(`[recon engine] Raw code "${rawCode}" (mixed group, tracking=${String(line.tracking_number || '').trim()}) — matched surcharge, auto-correcting`);
    await insertLine(runId, {
      tracking_number:          String(line.tracking_number || '').trim(),
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawCode,
      charge_type:              line.charge_type || 'surcharge',
      carrier_amount:           round2(parseFloat(line.carrier_amount) || 0),
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               null,
      customer_id:              null,
      charge_id:                null,
      expected_amount:          null,
      delta:                    null,
      status:                   'corrected',
      corrected_by:             'surcharge_mapping',
      unmatched_reason:         null,
      source:                   'internal',
      suggested_service_id:     null,
    });
    results.push({ status: 'corrected' });
  }

  if (baseLines.length === 0) return results;
  if (baseLines.length === 1) {
    const r = await processLine(baseLines[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
    return [...results, r];
  }

  // ── Continue with just the base/freight lines ─────────────────────────────
  const firstLine      = baseLines[0];
  const rawServiceCode = String(firstLine.service_code || '').trim();
  const mappedKey      = rawServiceCode.toUpperCase();
  const serviceId      = serviceCodeMap[mappedKey] || null;

  // ── Separate freight lines from unmapped orphan surcharge lines ───────────
  const freightLines = baseLines.filter(
    l => String(l.service_code || '').trim().toUpperCase() === mappedKey
  );
  const orphanLines  = baseLines.filter(
    l => String(l.service_code || '').trim().toUpperCase() !== mappedKey
  );
  if (orphanLines.length > 0) {
    console.log(
      `[recon engine] Tracking group ${trackKey}: ${orphanLines.length} line(s) have different service codes ` +
      `from freight code "${rawServiceCode}" — treating as unmapped surcharges, processing individually`
    );
  }

  if (!serviceId) {
    // Unknown service code — all lines in group go unmatched (hard gate).
    for (const line of group) {
      await insertLine(runId, {
        tracking_number:          String(line.tracking_number || '').trim(),
        carrier_account_no:       line.account_number || null,
        raw_service_code:         rawServiceCode,
        charge_type:              line.charge_type || 'base',
        carrier_amount:           round2(parseFloat(line.carrier_amount) || 0),
        carrier_billed_weight_kg: line.billed_weight_kg || null,
        service_id:               null,
        customer_id:              null,
        charge_id:                null,
        expected_amount:          null,
        delta:                    null,
        status:                   'unmatched',
        corrected_by:             null,
        unmatched_reason:         'unknown_service_code',
        source:                   'internal',
        suggested_service_id:     null,
      });
    }
    return [...results, ...baseLines.map(() => ({ status: 'unmatched' }))];
  }

  const poolHits = poolLookup(pool, trackKey);

  if (poolHits.length === 0) {
    // Not in verified pool — process each base line individually.
    for (const line of baseLines) {
      const r = await processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
      results.push(r);
    }
    return results;
  }

  // ── Pool HIT — aggregate comparison (freight lines only) ─────────────────
  const charge = poolHits[0];

  // Process orphan lines individually.
  for (const line of orphanLines) {
    const r = await processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
    results.push(r);
  }

  if (freightLines.length === 0) return results;
  if (freightLines.length === 1) {
    const r = await processLine(freightLines[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
    return [...results, r];
  }

  // Sum carrier amounts across all freight lines.
  const totalCarrierAmount = round2(
    freightLines.reduce((s, l) => s + (parseFloat(l.carrier_amount) || 0), 0)
  );

  // ── Bucket and Bill comparison ─────────────────────────────────────────────
  // expected = what we booked the shipment for (set at booking time by billing.js)
  // column surcharges = named per-shipment surcharges baked into carrier_amount
  //   that are mapped via the CSV profile's surcharge_columns
  const expectedBase   = round2(parseFloat(charge.total_cost_price) || 0);
  const { total: colSurchargeTotal, breakdown: colSurchargeBreakdown } = sumGroupColumnSurcharges(group);
  const fullExpected   = round2(expectedBase + colSurchargeTotal);
  const delta          = round2(totalCarrierAmount - fullExpected);

  firstLine._expected_amount = fullExpected;

  let groupStatus     = 'unmatched';
  let correctedBy     = null;
  let mappingId       = null;
  let unmatchedReason = null;

  if (Math.abs(delta) < 0.02) {
    // GREEN — carrier charged within £0.01 of what we booked.
    groupStatus = 'matched';

  } else {
    // Phase 4a — Mapping Engine
    const mappingResult = applyMappings(mappings, firstLine, delta);
    if (mappingResult?.applied) {
      await query(
        `UPDATE reconciliation_mappings SET applied_count = applied_count + 1, last_applied_at = NOW() WHERE id = $1`,
        [mappingResult.mappingId]
      );
      groupStatus = 'corrected';
      correctedBy = 'mapping';
      mappingId   = mappingResult.mappingId;

    } else {
      // RED — unexplained delta.
      groupStatus     = 'unmatched';
      unmatchedReason = 'price_mismatch';
    }
  }

  const colSurchargeMeta = colSurchargeTotal > 0
    ? { col_surcharge_total: colSurchargeTotal, col_surcharges: colSurchargeBreakdown }
    : null;

  for (const line of freightLines) {
    await insertLine(runId, {
      tracking_number:          String(line.tracking_number || '').trim(),
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'base',
      carrier_amount:           round2(parseFloat(line.carrier_amount) || 0),
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               serviceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          fullExpected,
      delta:                    delta,
      status:                   groupStatus,
      corrected_by:             correctedBy,
      unmatched_reason:         unmatchedReason,
      source:                   'internal',
      shipment_date:            line.shipment_date || null,
      mapping_id:               mappingId,
      correction_metadata:      colSurchargeMeta,
    });
  }

  return [...results, ...freightLines.map(() => ({ status: groupStatus }))];
}

// ─── Process a single line ────────────────────────────────────────────────────

async function processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx) {
  const trackingNumber = String(line.tracking_number || '').trim();
  const trackKey       = trackingNumber.toUpperCase();
  const rawServiceCode = String(line.service_code   || '').trim();
  const carrierAmount  = round2(parseFloat(line.carrier_amount) || 0);

  const { total: colSurchargeTotal, breakdown: colSurchargeBreakdown } = sumGroupColumnSurcharges([line]);

  // ── Phase 1b: Service code normalisation ──────────────────────────────────
  const mappedKey = rawServiceCode.toUpperCase();
  const serviceId = serviceCodeMap[mappedKey] || null;

  // ── Surcharge mapping check ───────────────────────────────────────────────
  // If the raw carrier code maps to a known surcharge, auto-correct immediately.
  if (!serviceId && surchargeMap[mappedKey]) {
    const surchargeId = surchargeMap[mappedKey];
    console.log(`[recon engine] Raw code "${rawServiceCode}" — matched surcharge ${surchargeId}`);
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'surcharge',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               null,
      customer_id:              null,
      charge_id:                null,
      expected_amount:          null,
      delta:                    null,
      status:                   'corrected',
      corrected_by:             'surcharge_mapping',
      unmatched_reason:         null,
      source:                   'internal',
      suggested_service_id:     null,
    });
    return { status: 'corrected' };
  }

  if (!serviceId) {
    // ── Carrier overhead (separate_fuel_rows mode) ────────────────────────
    // DPD (and similar) bill fuel, carriage, and energy as separate invoice
    // rows with full-description service codes ("Fuel and Energy Charge" etc.).
    // These are already accounted for in charges.total_cost_price, so we
    // auto-accept them rather than blocking on unknown_service_code.
    if (ctx.separateFuelRows) {
      await insertLine(runId, {
        tracking_number:          trackingNumber,
        carrier_account_no:       line.account_number    || null,
        raw_service_code:         rawServiceCode,
        charge_type:              'fuel',
        carrier_amount:           carrierAmount,
        carrier_billed_weight_kg: line.billed_weight_kg  || null,
        service_id:               null,
        customer_id:              null,
        charge_id:                null,
        expected_amount:          null,
        delta:                    null,
        status:                   'corrected',
        corrected_by:             'carrier_overhead',
        unmatched_reason:         null,
        source:                   'internal',
        shipment_date:            line.shipment_date     || null,
        suggested_service_id:     null,
      });
      return { status: 'corrected' };
    }

    // Unknown service code — hard gate. Operator must map this code first.
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               null,
      customer_id:              null,
      charge_id:                null,
      expected_amount:          null,
      delta:                    null,
      status:                   'unmatched',
      corrected_by:             null,
      unmatched_reason:         'unknown_service_code',
      source:                   'internal',
      suggested_service_id:     null,
    });
    return { status: 'unmatched' };
  }

  // ── Phase 2: Pool lookup ──────────────────────────────────────────────────
  const poolHits = poolLookup(pool, trackKey);
  if (!poolHits.length) {
    console.log(`[recon engine] Pool MISS: "${trackKey}" — not found in pool (${pool.size} keys). Will try account lookup.`);
  }

  if (poolHits.length === 0) {
    // Pool MISS — no charge record in the OMS for this tracking number.
    // Could be a return shipment, a customer booking made directly with the
    // carrier, or any other "outside the platform" scenario.
    const customer = await ctx.customerLookup(line.account_number);

    if (!customer) {
      // Unknown account — cannot attribute the charge. RED.
      await insertLine(runId, {
        tracking_number:          trackingNumber,
        carrier_account_no:       line.account_number    || null,
        raw_service_code:         rawServiceCode,
        charge_type:              line.charge_type       || 'base',
        carrier_amount:           carrierAmount,
        carrier_billed_weight_kg: line.billed_weight_kg  || null,
        service_id:               serviceId,
        customer_id:              null,
        charge_id:                null,
        expected_amount:          null,
        delta:                    null,
        status:                   'unmatched',
        corrected_by:             null,
        unmatched_reason:         'no_account_mapping',
        source:                   'internal',
        shipment_date:            line.shipment_date     || null,
        ship_to_postcode:         line.delivery_postcode || null,
        ship_to_country:          line.ship_to_country   || null,
      });
      return { status: 'unmatched' };
    }

    // Carrier-Direct Rule — we know the customer but have no OMS charge.
    // This is a real-world shipment (return, ad-hoc send, etc.) booked directly
    // with the carrier. Price it from our rate cards and create a charge so it
    // is fully accounted for and billed (source='carrier_direct').
    return handleCarrierDirect({
      serviceId,
      customer,
      trackingNumber,
      carrierAmount,
      weightKg:    line.billed_weight_kg  || 0,
      postcode:    line.delivery_postcode || null,
      countryIso:  line.ship_to_country   || 'GB',
      rawServiceCode,
      runId,
      line,
      ctx,
    });
  }

  // ── Phase 3: Bucket and Bill comparison ───────────────────────────────────
  //
  // expected = charge.total_cost_price
  //   = cost_price (base courier charge set at booking time by billing.js)
  //   + SUM of fuel/surcharge charges for this shipment
  //
  // This is what we booked the shipment for. We trust it completely.
  // No weight band re-derivation. No zone lookup. No rate card comparison.
  //
  // column surcharges (colSurchargeTotal) = named per-shipment surcharges
  //   extracted from the carrier CSV via surcharge_columns profile config.
  //   These are baked into carrier_amount by the carrier but tracked separately
  //   in our charges, so we add them to expected for an apples-to-apples delta.
  const charge       = poolHits[0];
  // separate_fuel_rows: carrier bills fuel/carriage/energy as separate invoice
  // rows, so the freight row's carrier_amount = base only. Compare against
  // cost_price (base) not total_cost_price (base + fuel). Overhead rows are
  // already auto-accepted above via the carrier_overhead path.
  const invoiceParcelCount   = line.parcel_count || 1;
  let expectedBase;
  if (ctx.separateFuelRows) {
    const baseFromDb = round2(parseFloat(charge.expected_cost) || 0);
    if (ctx.parcelPricing === 'all_sub' && invoiceParcelCount > 1) {
      // DPD all-sub multi-parcel: recompute expected from the rate card using the zone
      // already stored on the charge and the invoice billed weight.
      //
      // Historical charges (before billing.js task #212) stored cost_price = price_first
      // (single-parcel rate) instead of N × price_sub. The rate_per_parcel normalisation
      // guard cannot correct this — dividing price_first by N then multiplying back gives
      // price_first again, not N × price_sub.
      //
      // The rate card is authoritative: for all_sub carriers every parcel including the
      // first is billed at price_sub. Looking up price_sub from the stored zone_id and
      // invoice weight gives the correct expected total regardless of how cost_price was
      // stored. Falls back to stored cost_price only if zone or band data is missing.
      const invoiceWeightKg   = parseFloat(line.billed_weight_kg) || 0;
      // Use per-parcel weight for the band lookup: a 2×17.5 kg shipment should
      // hit the 20 kg band, not the 35 kg band (which may have no entry → no_cost_band).
      const perParcelWeightKg = invoiceParcelCount > 1 ? round2(invoiceWeightKg / invoiceParcelCount) : invoiceWeightKg;
      let chargeZoneId        = charge.zone_id || null;

      // Zone fallback: if zone_id was not stored on the charge (older shipments),
      // resolve it from the invoice delivery postcode so the rate-card recompute
      // can still run. Requires delivery_postcode to be mapped in the CSV profile
      // (migration 166 adds 'delivery_postcode': 'delivery' to the DPD profile).
      if (!chargeZoneId && line.delivery_postcode && serviceId) {
        const resolvedZone = await matchZone(
          serviceId,
          line.ship_to_country || 'GB',
          line.delivery_postcode
        );
        if (resolvedZone) {
          chargeZoneId = resolvedZone.id;
          console.log(
            `[recon engine] Zone resolved from postcode ${line.delivery_postcode} → zone_id=${chargeZoneId} ` +
            `(charge had no zone_id) for tracking=${trackingNumber}`
          );
        }
      }

      let rateCardExpected    = null;

      if (perParcelWeightKg > 0 && chargeZoneId && serviceId) {
        const bandResult = await lookupCarrierBandCost(serviceId, perParcelWeightKg, chargeZoneId);
        if (bandResult) {
          // Prefer price_sub; fall back to price_first if price_sub is null in the rate card.
          const perParcelRate = bandResult.costSub ?? bandResult.cost;
          rateCardExpected = round2(perParcelRate * invoiceParcelCount);
          console.log(
            `[recon engine] all_sub rate-card recompute: tracking=${trackingNumber} ` +
            `zone=${chargeZoneId} weight=${invoiceWeightKg}kg (per_parcel=${perParcelWeightKg}kg) ` +
            `rate=£${perParcelRate} (${bandResult.costSub != null ? 'price_sub' : 'price_first fallback'}) ` +
            `× ${invoiceParcelCount} = £${rateCardExpected} (stored cost_price=£${baseFromDb})`
          );
        }
      }

      expectedBase = rateCardExpected != null ? rateCardExpected : baseFromDb;
    } else {
      // Single-parcel or no all_sub mode — trust stored cost_price directly.
      expectedBase = baseFromDb;
    }
  } else {
    expectedBase = round2(parseFloat(charge.total_cost_price) || 0);
  }
  const fullExpected = round2(expectedBase + colSurchargeTotal);
  const delta        = round2(carrierAmount - fullExpected);

  line._expected_amount = fullExpected;

  if (Math.abs(delta) < 0.02) {
    // GREEN — carrier charged within £0.01 of what we booked.
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg  || null,
      service_id:               serviceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          fullExpected,
      delta:                    delta,
      status:                   'matched',
      corrected_by:             null,
      unmatched_reason:         null,
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
      parcel_count:             line.parcel_count      || null,
      correction_metadata:      colSurchargeTotal > 0
        ? { col_surcharge_total: colSurchargeTotal, col_surcharges: colSurchargeBreakdown }
        : null,
    });
    return { status: 'matched' };
  }

  // ── Phase 4a: Mapping Engine ──────────────────────────────────────────────
  const mappingResult = applyMappings(mappings, line, delta);
  if (mappingResult?.applied) {
    await query(
      `UPDATE reconciliation_mappings SET applied_count = applied_count + 1, last_applied_at = NOW() WHERE id = $1`,
      [mappingResult.mappingId]
    );
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg  || null,
      service_id:               serviceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          fullExpected,
      delta:                    delta,
      status:                   'corrected',
      corrected_by:             'mapping',
      unmatched_reason:         null,
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
      parcel_count:             line.parcel_count      || null,
      mapping_id:               mappingResult.mappingId,
    });
    return { status: 'corrected' };
  }

  // ── RED — unexplained price difference ────────────────────────────────────
  // The carrier charged a different amount than what we booked.
  // The delta is real and must be reviewed by the operator.
  console.log(
    `[recon engine] UNMATCHED: tracking=${trackingNumber} ` +
    `carrier=£${carrierAmount} expected=£${fullExpected} delta=£${delta}`
  );

  // Store any unmapped CSV column values in correction_metadata so the UI can
  // show the operator exactly which column is causing the delta (e.g. "Oversized/Overweight: £6.00").
  const rawColMeta = (line.raw_col_values && Object.keys(line.raw_col_values).length > 0)
    ? { raw_col_values: line.raw_col_values }
    : null;

  await insertLine(runId, {
    tracking_number:          trackingNumber,
    carrier_account_no:       line.account_number    || null,
    raw_service_code:         rawServiceCode,
    charge_type:              line.charge_type       || 'base',
    carrier_amount:           carrierAmount,
    carrier_billed_weight_kg: line.billed_weight_kg  || null,
    service_id:               serviceId,
    customer_id:              charge.customer_id,
    charge_id:                charge.charge_id,
    expected_amount:          fullExpected,
    delta:                    delta,
    status:                   'unmatched',
    corrected_by:             null,
    unmatched_reason:         'price_mismatch',
    source:                   'internal',
    shipment_date:            line.shipment_date     || null,
    ship_to_postcode:         line.delivery_postcode || null,
    ship_to_country:          line.ship_to_country   || null,
    parcel_count:             line.parcel_count      || null,
    correction_metadata:      rawColMeta,
  });
  return { status: 'unmatched' };
}

// ─── Insert reconciliation line ───────────────────────────────────────────────

async function insertLine(runId, data) {
  await query(`
    INSERT INTO reconciliation_lines
      (run_id, tracking_number, carrier_account_no, raw_service_code, charge_type,
       carrier_amount, carrier_billed_weight_kg, service_id, customer_id, charge_id,
       expected_amount, delta, status, corrected_by, unmatched_reason, source,
       mapping_id, is_fuel, suggested_service_id, correction_metadata, shipment_date,
       ship_to_postcode, ship_to_country, parcel_count)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
  `, [
    runId,
    data.tracking_number          ?? null,
    data.carrier_account_no       || null,
    data.raw_service_code         || null,
    data.charge_type              || 'base',
    data.carrier_amount           ?? null,
    data.carrier_billed_weight_kg || null,
    data.service_id               || null,
    data.customer_id              || null,
    data.charge_id                || null,
    data.expected_amount          ?? null,
    data.delta                    ?? null,
    data.status,
    data.corrected_by             || null,
    data.unmatched_reason         || null,
    data.source                   || 'internal',
    data.mapping_id               || null,
    data.is_fuel                  || false,
    data.suggested_service_id     || null,
    data.correction_metadata      ? JSON.stringify(data.correction_metadata) : null,
    data.shipment_date            || null,
    data.ship_to_postcode         || null,
    data.ship_to_country          || null,
    data.parcel_count             || null,
  ]);
}

// ─── Reprocess lines after a service code mapping is saved ───────────────────
//
// Called by bulk-map-service-codes after the user maps an unknown_service_code.
// Re-runs the pool-lookup + cost comparison for every affected line in the run.
//
// Bucket and Bill: expected = charge.total_cost_price (same as processLine).

export async function reprocessMappedLines(runId, rawServiceCode, serviceId, carrierId) {
  const { separateFuelRows, parcelPricing } = await getCarrierProfileOptions(carrierId);

  const linesRes = await query(`
    SELECT
      id              AS line_id,
      tracking_number,
      carrier_amount,
      carrier_billed_weight_kg AS billed_weight_kg,
      carrier_account_no       AS account_number,
      parcel_count,
      correction_metadata,
      ship_to_postcode,
      ship_to_country
    FROM reconciliation_lines
    WHERE run_id             = $1
      AND raw_service_code   = $2
      AND status             = 'unmatched'
      AND unmatched_reason   = 'unknown_service_code'
  `, [runId, rawServiceCode]);

  if (!linesRes.rows.length) return { matched: 0, unmatched: 0, carrier_direct_created: 0 };

  const { pool } = await buildVerifiedPool(carrierId);

  let matched = 0, unmatched = 0, carrier_direct_created = 0;

  for (const line of linesRes.rows) {
    const trackKey      = String(line.tracking_number || '').trim().toUpperCase();
    const carrierAmount = round2(parseFloat(line.carrier_amount) || 0);
    const poolHits      = trackKey ? poolLookup(pool, trackKey) : [];

    if (poolHits.length > 0) {
      // ── Pool HIT: Bucket and Bill — trust the charge ──────────────────────
      const charge             = poolHits[0];
      const invoiceParcelCount = line.parcel_count || 1;
      let expectedCost;
      if (separateFuelRows) {
        const baseFromDb = round2(parseFloat(charge.expected_cost) || 0);
        if (parcelPricing === 'all_sub' && invoiceParcelCount > 1) {
          // Same rate-card recompute as processLine — see comment there for rationale.
          const invoiceWeightKg   = parseFloat(line.billed_weight_kg) || 0;
          const perParcelWeightKg = invoiceParcelCount > 1 ? round2(invoiceWeightKg / invoiceParcelCount) : invoiceWeightKg;
          let chargeZoneId        = charge.zone_id || null;

          // Zone fallback (same logic as processLine) — resolve from postcode
          // when zone_id is null on the charge.
          if (!chargeZoneId && line.delivery_postcode && serviceId) {
            const resolvedZone = await matchZone(
              serviceId,
              line.ship_to_country || 'GB',
              line.delivery_postcode
            );
            if (resolvedZone) chargeZoneId = resolvedZone.id;
          }

          let rateCardExpected    = null;

          if (perParcelWeightKg > 0 && chargeZoneId && serviceId) {
            const bandResult = await lookupCarrierBandCost(serviceId, perParcelWeightKg, chargeZoneId);
            if (bandResult) {
              const perParcelRate = bandResult.costSub ?? bandResult.cost;
              rateCardExpected = round2(perParcelRate * invoiceParcelCount);
            }
          }
          expectedCost = rateCardExpected != null ? rateCardExpected : baseFromDb;
        } else {
          expectedCost = baseFromDb;
        }
      } else {
        expectedCost = round2(parseFloat(charge.total_cost_price) || 0);
      }
      const delta   = round2(carrierAmount - expectedCost);
      const isMatch = Math.abs(delta) < 0.02;

      await query(`
        UPDATE reconciliation_lines
        SET  status          = $1,
             service_id      = $2,
             customer_id     = $3,
             charge_id       = $4,
             expected_amount = $5,
             delta           = $6,
             unmatched_reason = $7,
             source           = 'internal',
             corrected_by     = NULL,
             resolved_at      = NULL,
             resolved_by      = NULL
        WHERE id = $8
      `, [
        isMatch ? 'matched' : 'unmatched',
        serviceId,
        charge.customer_id,
        charge.charge_id,
        expectedCost,
        delta,
        isMatch ? null : 'price_mismatch',
        line.line_id,
      ]);

      if (isMatch) matched++; else unmatched++;

    } else {
      // ── Pool MISS ─────────────────────────────────────────────────────────
      const customer = await lookupCustomerByAccount(line.account_number);

      if (!customer) {
        // Unknown account — cannot attribute.
        await query(`
          UPDATE reconciliation_lines
          SET  status           = 'unmatched',
               service_id       = $1,
               customer_id      = NULL,
               charge_id        = NULL,
               expected_amount  = NULL,
               delta            = NULL,
               unmatched_reason = 'no_account_mapping',
               source           = 'internal',
               corrected_by     = NULL,
               resolved_at      = NULL,
               resolved_by      = NULL
          WHERE id = $2
        `, [serviceId, line.line_id]);
        unmatched++;
        continue;
      }

      // Ghost Charge Rule — auto-create charge via pricingEngine.
      const kg       = parseFloat(line.billed_weight_kg) || 0;
      const postcode = line.ship_to_postcode || null;
      const country  = line.ship_to_country  || 'GB';

      if (kg > 0) {
        const pricing = await computeGhostCharge(serviceId, customer.customer_id, kg, postcode, country);

        if (!pricing.error) {
          const newCharges = await insertCharges([{
            customer_id:         customer.customer_id,
            voila_shipment_id:   null,
            order_id:            null,
            tracking_code:       trackKey,
            courier_service_id:  serviceId,
            zone_id:             pricing.zone_id,
            charge_type:         'courier',
            weight_charged_kg:   kg,
            cost_price:          pricing.cost_price,
            sell_price:          pricing.sell_price ?? pricing.cost_price,
            status:              'verified',
            ship_to_postcode:    postcode,
            ship_to_country_iso: country,
            source:              'carrier_direct',
            raw_payload:         JSON.stringify({ recon_auto_created: true, run_id: runId }),
          }]);

          const insertedId  = newCharges[0]?.id || null;
          const expected    = round2(pricing.cost_price);
          const delta       = round2(carrierAmount - expected);
          const isMatch     = Math.abs(delta) < 0.02;

          await query(`
            UPDATE reconciliation_lines
            SET  status           = $1,
                 service_id       = $2,
                 customer_id      = $3,
                 charge_id        = $4,
                 expected_amount  = $5,
                 delta            = $6,
                 unmatched_reason = NULL,
                 source           = 'carrier_direct',
                 corrected_by     = $7,
                 resolved_at      = NULL,
                 resolved_by      = NULL
            WHERE id = $8
          `, [
            isMatch ? 'matched' : 'corrected',
            serviceId,
            customer.customer_id,
            insertedId,
            expected,
            delta,
            isMatch ? null : 'carrier_direct',
            line.line_id,
          ]);

          carrier_direct_created++;
          if (isMatch) matched++; else unmatched++;
          continue;
        }

        console.warn(`[recon engine] reprocessMappedLines carrier_direct pricing failed for ${trackKey}: ${pricing.error}`);
      }

      // Ghost charge unavailable (no weight or pricing error) — leave as unmatched.
      await query(`
        UPDATE reconciliation_lines
        SET  status           = 'unmatched',
             service_id       = $1,
             customer_id      = $2,
             charge_id        = NULL,
             expected_amount  = NULL,
             delta            = NULL,
             unmatched_reason = $3,
             source           = 'carrier_direct',
             corrected_by     = NULL,
             resolved_at      = NULL,
             resolved_by      = NULL
        WHERE id = $4
      `, [
        serviceId,
        customer.customer_id,
        kg > 0 ? 'carrier_direct_error_no_zone' : 'carrier_direct_error_no_weight',
        line.line_id,
      ]);
      unmatched++;
    }
  }

  console.log(`[recon engine] reprocessMappedLines run=${runId} code="${rawServiceCode}": matched=${matched} carrier_direct_created=${carrier_direct_created} unmatched=${unmatched}`);
  return { matched, unmatched, carrier_direct_created };
}

// ─── Age Unmatched lines from previous runs ───────────────────────────────────

export async function ageUnmatchedLines(carrierId) {
  const res = await query(`
    UPDATE reconciliation_lines rl
    SET    aged = true
    FROM   reconciliation_runs rr
    WHERE  rr.id           = rl.run_id
      AND  rr.carrier_id   = $1
      AND  rl.status       = 'unmatched'
      AND  rl.aged         = false
      AND  rl.tracking_number IN (
        SELECT rl2.tracking_number
        FROM   reconciliation_lines rl2
        JOIN   reconciliation_runs  rr2 ON rr2.id = rl2.run_id
        WHERE  rr2.carrier_id = $1
          AND  rl2.status     = 'unmatched'
          AND  rl2.resolved_at IS NULL
        GROUP  BY rl2.tracking_number
        HAVING COUNT(DISTINCT rr2.id) >= 2
      )
    RETURNING rl.id
  `, [carrierId]);

  return res.rowCount || 0;
}
