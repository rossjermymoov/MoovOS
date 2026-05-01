/**
 * Moov OS — Reconciliation Engine
 *
 * Automated courier invoice reconciliation engine.
 *
 * Full flow (per the architecture spec):
 *   Phase 1b  — Service Code Normalisation (hard gate)
 *   Pre-cond  — Build Verified Pool (once per run)
 *   Phase 2   — Safety Net check (tracking vs pool, account fallback)
 *   Phase 3   — Match & Compare (multi-parcel grouping + per-line delta)
 *   Phase 3a  — Aggregate line check (fuel total + HGV surcharge)
 *   Phase 4a  — Mapping Engine (saved human resolutions)
 *   Phase 4b  — Correction Engine (pricing rules)
 *   Phase 5   — State assignment & persistence
 *
 * Entry point: processReconciliationRun(runId, carrierId, lines)
 *   lines = array of normalised invoice objects (see InvoiceLine typedef below)
 *
 * DHL-specific notes:
 *   • Per-parcel lines: tracking_number present, charge_type = 'base' (or blank)
 *   • Multi-parcel shipments: multiple lines share the same tracking_number
 *     (first parcel + sub-parcel). Engine groups them and compares the SUM
 *     against the single charge record's base cost_price.
 *   • Aggregate lines: tracking_number is EMPTY. Appear at bottom of DHL CSV.
 *     - charge_type = 'fuel'     → compare against sum of expected fuel costs
 *     - anything else            → treated as HGV/surcharge aggregate:
 *       expected = total_parcel_count × carrier_hgv_rate_per_parcel
 */

import { query } from '../db/index.js';

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
 * Pool lookup with carrier prefix normalisation.
 *
 * DHL PWS invoices include a "60" prefix on every consignment number (e.g.
 * "601234567890") that may not be present in our OMS tracking_codes (e.g.
 * "1234567890"). We try the exact key first, then fall back to:
 *   • stripping the leading "60"  — CSV has "60..." but DB has "..."
 *   • adding a "60" prefix         — DB has "60..." but CSV sent shorter form
 *
 * Matching is always by the EXACT string from column C — this function just
 * bridges the carrier prefix gap transparently.
 */
function poolLookup(pool, trackKey) {
  let hits = pool.get(trackKey);
  if (hits && hits.length) return hits;

  // Try without "60" prefix (CSV had it, DB doesn't)
  if (trackKey.startsWith('60') && trackKey.length > 4) {
    hits = pool.get(trackKey.slice(2));
    if (hits && hits.length) return hits;
  }

  // Try with "60" prefix added (DB had it, CSV was shorter)
  if (!trackKey.startsWith('60')) {
    hits = pool.get('60' + trackKey);
    if (hits && hits.length) return hits;
  }

  return [];
}

// ─── Phase 1b: Service Code Normalisation ────────────────────────────────────

/**
 * Build the global service code map for this carrier.
 *
 * TWO-LAYER LOOKUP:
 *
 * Layer 1 — Explicit mappings from courier_service_code_mappings
 *   (saved by the user, highest priority)
 *
 * Layer 2 — Implied mappings derived from courier_services.service_code
 *   Carriers typically send a numeric/short code that is the suffix of our
 *   internal service code. Examples:
 *     carrier sends "220"  →  our service_code is "DHL-220"   →  service_id 220
 *     carrier sends "1"    →  our service_code is "DHL-1"     →  return service
 *     carrier sends "PARCEL" → our service_code is "DPD-PARCEL" → service_id X
 *
 *   The implied code is the part of service_code AFTER the last hyphen.
 *   Explicit mappings always win over implied ones.
 *
 * Only global mappings (customer_id IS NULL) are loaded here; customer-specific
 * mappings are checked per-line after the customer is known.
 */
/**
 * Returns { serviceMap, surchargeMap } for this carrier.
 *
 * serviceMap:  { [RAW_CODE_UPPER]: service_id }   — delivery service mappings
 * surchargeMap: { [RAW_CODE_UPPER]: surcharge_id } — surcharge mappings
 *
 * A raw carrier code can map to EITHER a service OR a surcharge, never both.
 * When a surcharge mapping exists, Phase 1b marks the line as corrected
 * immediately (the carrier charge is a known named surcharge — no price-comparison).
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
      // Surcharge mapping — remove from service map if it was implied there
      delete serviceMap[key];
      surchargeMap[key] = row.surcharge_id;
    } else if (row.service_id) {
      serviceMap[key] = row.service_id; // overwrites implied
    }
  }

  const surchargeCount = Object.keys(surchargeMap).length;
  const impliedCount   = Object.keys(serviceMap).length - (explicit.rows.filter(r => r.service_id).length);
  console.log(`[recon engine] Code map for carrier ${carrierId}: ${explicit.rows.length} explicit (${surchargeCount} surcharge) + ${impliedCount} implied service entries`);

  return { serviceMap, surchargeMap };
}

/**
 * Smart suggestion: if a tracking number is in the Verified Pool, use the
 * pool record's dc_service_id to find the courier_services.id that the
 * unknown raw code most likely maps to.
 *
 * Matching strategy (tried in order):
 *   1. Pool dc_service_id exact-match against service_code
 *   2. Pool dc_service_id ends-with service_code (e.g. "dhl-pcuk-220" → "DHL-220")
 *   3. Raw carrier code suffix-match (e.g. "220" → service_code ending in "-220")
 *
 * Returns { id, name, service_code } or null.
 */
async function getSuggestedServiceFromPool(trackKey, pool, carrierId, rawCode = '') {
  const poolHits = poolLookup(pool, trackKey);

  // Method 1 & 2 — use dc_service_id from the pool record
  if (poolHits.length > 0) {
    const dcServiceId = (poolHits[0].dc_service_id || '').trim();
    if (dcServiceId) {
      const res = await query(
        `SELECT id, name, service_code
         FROM   courier_services
         WHERE  courier_id = $1
           AND (
             TRIM(service_code) ILIKE TRIM($2)
             OR TRIM($2)        ILIKE '%' || TRIM(service_code)
           )
         ORDER BY
           CASE WHEN TRIM(service_code) ILIKE TRIM($2) THEN 0 ELSE 1 END
         LIMIT 1`,
        [carrierId, dcServiceId]
      );
      if (res.rows[0]) return res.rows[0];
    }
  }

  // Method 3 — match raw carrier code against service_code suffix
  // "220" → service_code ending in "-220" (e.g. DHL-220, DHL-PCUK-220)
  if (rawCode) {
    const res = await query(
      `SELECT id, name, service_code
       FROM   courier_services
       WHERE  courier_id = $1
         AND (
           TRIM(service_code) ILIKE TRIM($2)
           OR service_code    ILIKE '%-' || $2
         )
       LIMIT 1`,
      [carrierId, rawCode]
    );
    if (res.rows[0]) return res.rows[0];
  }

  return null;
}

// ─── Pre-condition: Build Verified Pool ──────────────────────────────────────
// Single query, run once per job.
// Returns Map: tracking_number (upper) → charge row[]
//
// VERIFICATION GATE:
//   Only shipments that have been physically collected by the carrier are
//   eligible for reconciliation. A shipment is considered "despatched" when
//   it has at least one entry in tracking_codes (the carrier has assigned a
//   tracking number — this happens at collection/scan).
//
//   Shipments in our system that haven't been picked up yet will have an
//   empty or null tracking_codes array and are therefore excluded from the
//   pool. The carrier will never invoice for a shipment they haven't
//   collected, so this keeps the pool in sync with what can actually appear
//   on a carrier invoice.

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
      (
        SELECT z_lkp.id
        FROM   zones           z_lkp
        JOIN   courier_services cs_lkp ON cs_lkp.id = z_lkp.courier_service_id
        WHERE  z_lkp.name    = c.zone_name
          AND  cs_lkp.courier_id = $1
        LIMIT  1
      )                 AS zone_id,
      s.tracking_codes,
      s.dc_service_id,
      s.total_weight_kg AS declared_weight_kg,
      cu.account_number AS customer_account,
      COALESCE(c.cost_price, 0)
        + COALESCE((
            SELECT SUM(sc.cost_price)
            FROM   charges sc
            WHERE  sc.shipment_id = c.shipment_id
              AND  sc.charge_type IN ('fuel','surcharge')
              AND  sc.cancelled   = false
          ), 0)         AS total_cost_price
    FROM   charges      c
    JOIN   shipments    s  ON s.id = c.shipment_id
    JOIN   couriers     cu_carrier ON cu_carrier.id = $1
    LEFT JOIN customers cu ON cu.id = c.customer_id
    WHERE  c.verified      = true
      AND  c.cancelled     = false
      AND  c.charge_type   = 'courier'
      -- Carrier matching: use contains variants so "DHL" matches "DHL Parcel UK"
      -- and vice versa. Pure ILIKE equality fails when our couriers.name/code
      -- doesn't exactly mirror what DeliveryConnect stored in shipments.courier.
      AND (
        s.courier ILIKE cu_carrier.code
        OR s.courier ILIKE cu_carrier.name
        OR s.courier ILIKE '%' || cu_carrier.code || '%'
        OR cu_carrier.code ILIKE '%' || s.courier || '%'
        OR s.courier ILIKE '%' || cu_carrier.name || '%'
        OR cu_carrier.name ILIKE '%' || s.courier || '%'
      )
      -- Verification gate: only shipments the carrier has collected.
      -- A shipment is considered despatched if it has tracking codes OR a
      -- dc_service_id (the DeliveryConnect consignment reference). For DHL,
      -- the consignment number lives in dc_service_id; tracking_codes may be
      -- empty until DC posts a tracking event back.
      AND (
        (s.tracking_codes IS NOT NULL AND array_length(s.tracking_codes, 1) > 0)
        OR s.dc_service_id IS NOT NULL
      )
  `, [carrierId]);

  const pool = new Map();

  function addToPool(key, row) {
    if (!pool.has(key)) pool.set(key, []);
    const bucket = pool.get(key);
    if (!bucket.find(r => r.charge_id === row.charge_id)) bucket.push(row);
  }

  for (const row of res.rows) {
    // ── Index by tracking_codes ───────────────────────────────────────────
    const codes = row.tracking_codes || [];
    for (const code of codes) {
      const key = String(code).trim().toUpperCase();
      addToPool(key, row);
      // "60" prefix variants (DHL PWS vs OMS format bridge)
      if (key.startsWith('60') && key.length > 4) {
        addToPool(key.slice(2), row);
      } else {
        addToPool('60' + key, row);
      }
    }

    // ── Index by dc_service_id ────────────────────────────────────────────
    // For DHL shipments managed via DeliveryConnect, the consignment number
    // from the PWS invoice is stored in dc_service_id (not tracking_codes).
    // This is the PRIMARY lookup key for DHL reconciliation.
    if (row.dc_service_id) {
      const dcKey = String(row.dc_service_id).trim().toUpperCase();
      addToPool(dcKey, row);
      if (dcKey.startsWith('60') && dcKey.length > 4) {
        addToPool(dcKey.slice(2), row);
      } else {
        addToPool('60' + dcKey, row);
      }
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
    console.warn(`[recon engine] WARNING: pool is EMPTY — carrier name/code may not match shipments.courier, or no DHL shipments have dc_service_id/tracking_codes`);
  }

  return { pool, poolSize };
}

// ─── Phase 2: Account number → customer lookup (Safety Net) ──────────────────

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

// ─── Carrier Rate Card Lookup ─────────────────────────────────────────────────
//
// Single authoritative function for "what should the carrier charge for this
// service at this weight?" — used by both Phase 3 (external bookings) and
// Phase 4b (correction engine for pool hits where cost_price may be wrong).
//
// TWO-PASS logic:
//   Pass 1 — weight falls within a band's min/max range (normal case)
//   Pass 2 — weight EXCEEDS the top band's max_weight_kg (overage case)
//             Formula: Base Price + ((Actual Weight - Max Weight) * Overage Rate)
//
// Returns the expected carrier cost in £, or null if no band is configured.

async function lookupCarrierBandCost(serviceId, weightKg, zoneId) {
  if (!serviceId || !(weightKg > 0)) return null;

  // zoneId is preferred — pins the lookup to the correct zone so we never
  // accidentally use a band from Ireland / International / etc.
  // When zoneId is null (pool miss — e.g. return shipments with no OMS charge
  // record), we fall back to a zone-free lookup. Return services (DHL-1) have
  // the same flat rate across all zones, so this is safe for flat-rate services.
  // For zone-priced services the result may not be zone-accurate, but it's better
  // than returning null and leaving the line perpetually unmatched.
  if (!zoneId) {
    console.warn(`[recon engine] lookupCarrierBandCost called without zoneId for service ${serviceId} — zone-free fallback`);
  }

  // Pass 1: exact band — weight sits WITHIN a band's finite ceiling.
  //
  // CRITICAL: wb.max_weight_kg IS NOT NULL is mandatory here.
  // Without it, COALESCE(null, 99999) causes the open-ended band to match
  // ANY weight (e.g. 43kg < 99999 = true), returning just price_first with
  // no overage and blocking Pass 2 entirely.
  //
  // Boundary convention (consistent with pricingEngine):
  //   min is EXCLUSIVE  →  $2 >  COALESCE(min, 0)
  //   max is INCLUSIVE  →  $2 <= max
  //
  // $3 = zoneId — hard-pins the lookup to the correct zone when available.
  // wb.id is returned so callers can detect band changes (intra-band vs cross-band weight shifts).
  const exactRes = zoneId
    ? await query(`
        SELECT wb.id AS band_id, wb.price_first, wb.price_sub, wb.cost_per_kg, wb.min_weight_kg, wb.max_weight_kg
        FROM   weight_bands     wb
        JOIN   zones            z  ON z.id  = wb.zone_id
        JOIN   courier_services cs ON cs.id = z.courier_service_id
        WHERE  cs.id = $1
          AND  z.id  = $3                          -- strict zone pin
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 >  COALESCE(wb.min_weight_kg, 0)
          AND  $2 <= wb.max_weight_kg
        ORDER BY wb.min_weight_kg DESC
        LIMIT  1
      `, [serviceId, weightKg, zoneId])
    : await query(`
        SELECT wb.id AS band_id, wb.price_first, wb.price_sub, wb.cost_per_kg, wb.min_weight_kg, wb.max_weight_kg
        FROM   weight_bands     wb
        JOIN   zones            z  ON z.id  = wb.zone_id
        JOIN   courier_services cs ON cs.id = z.courier_service_id
        WHERE  cs.id = $1
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 >  COALESCE(wb.min_weight_kg, 0)
          AND  $2 <= wb.max_weight_kg
        ORDER BY wb.price_first ASC               -- lowest band price when zone unknown
        LIMIT  1
      `, [serviceId, weightKg]);

  if (exactRes.rows.length) {
    const b = exactRes.rows[0];
    return {
      cost:      round2(parseFloat(b.price_first || 0)),
      price_sub: b.price_sub != null ? round2(parseFloat(b.price_sub)) : null,
      pass: 1, overageKg: null, bandId: b.band_id,
    };
  }

  // Pass 2: weight EXCEEDS every defined band ceiling — apply top-out overage.
  //
  // Logic ("Top-Out"):
  //   1. Find the band with the highest FINITE max_weight_kg (the ceiling band).
  //      e.g. for DHL 220 Mainland: max = 30kg, price_first = £4.36, cost_per_kg = £0.30
  //   2. Excess = actual weight − band ceiling  (e.g. 43 − 30 = 13kg)
  //   3. Cost   = price_first + (excess × cost_per_kg)  (e.g. £4.36 + 13×£0.30 = £8.26)
  //   4. If within £0.01 of the carrier invoice → CORRECTED.
  //
  // Zone is pinned via $3 when available — same zone as Pass 1 so both passes use
  // identical data. NULL-max (open-ended) bands are excluded — they have no finite
  // ceiling so there is nothing to measure excess against.
  const topRes = zoneId
    ? await query(`
        SELECT wb.id AS band_id, wb.price_first, wb.cost_per_kg, wb.min_weight_kg, wb.max_weight_kg
        FROM   weight_bands     wb
        JOIN   zones            z  ON z.id  = wb.zone_id
        JOIN   courier_services cs ON cs.id = z.courier_service_id
        WHERE  cs.id = $1
          AND  z.id  = $3                   -- strict zone pin
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 > wb.max_weight_kg
        ORDER BY wb.max_weight_kg DESC
        LIMIT  1
      `, [serviceId, weightKg, zoneId])
    : await query(`
        SELECT wb.id AS band_id, wb.price_first, wb.cost_per_kg, wb.min_weight_kg, wb.max_weight_kg
        FROM   weight_bands     wb
        JOIN   zones            z  ON z.id  = wb.zone_id
        JOIN   courier_services cs ON cs.id = z.courier_service_id
        WHERE  cs.id = $1
          AND  wb.max_weight_kg IS NOT NULL
          AND  $2 > wb.max_weight_kg
        ORDER BY wb.max_weight_kg DESC
        LIMIT  1
      `, [serviceId, weightKg]);

  if (topRes.rows.length) {
    const b = topRes.rows[0];
    const overageRate = parseFloat(b.cost_per_kg || 0);
    if (!overageRate) return null; // band has no per-kg rate — overage cannot be calculated

    // Defensive: max_weight_kg MUST be a real finite number (guaranteed by IS NOT NULL above,
    // but parseFloat(null/undefined/NaN) would produce NaN and break the math)
    const bandMax = parseFloat(b.max_weight_kg);
    if (!isFinite(bandMax) || bandMax <= 0) return null;

    const overageKg = round2(weightKg - bandMax);
    const cost      = round2(parseFloat(b.price_first || 0) + overageKg * overageRate);

    console.log(
      `[recon engine] Top-out overage: ${weightKg}kg > ceiling ${bandMax}kg` +
      ` — £${b.price_first} + (${overageKg}kg × £${overageRate}) = £${cost}`
    );
    return { cost, pass: 2, overageKg, bandId: b.band_id };
  }

  return null;
}

// ─── Phase 4b: Correction Engine ─────────────────────────────────────────────
//
// Called when Phase 3 finds a delta between carrier_amount and the stored
// charges.cost_price. Recalculates from the carrier rate card (weight_bands)
// using the actual billed weight from the CSV. If the rate card explains the
// carrier's charge, mark as Corrected.

// originalExpectedCost — the stored charges.cost_price (passed by caller so metadata can
// record what we expected before the carrier invoice revealed the true cost).
// chargeId — when provided, sets recon_corrected on the charge for future run flagging.
async function checkCorrectionEngine(customerId, serviceId, carrierId, zoneId, line, delta, chargeId, originalExpectedCost) {
  if (!serviceId || !(line.billed_weight_kg > 0)) {
    return { corrected: false, reason: 'no_service_id_or_weight' };
  }

  const result = await lookupCarrierBandCost(serviceId, line.billed_weight_kg, zoneId);
  if (result === null) {
    return { corrected: false, reason: 'no_carrier_band' };
  }

  const { cost: newCalculatedCost, pass, overageKg } = result;
  const recalcDelta = round2(line.carrier_amount - newCalculatedCost);
  console.log(
    `[recon engine] Correction check: carrier=£${line.carrier_amount} band_cost=£${newCalculatedCost}` +
    ` (pass ${pass}) delta=£${recalcDelta} service=${serviceId} zone=${zoneId} weight=${line.billed_weight_kg}kg`
  );

  if (Math.abs(recalcDelta) <= 0.01) {
    // Determine the specific correction reason
    let correction_reason;
    if (pass === 2) {
      correction_reason = 'weight_overage';
    } else if (originalExpectedCost != null && Math.abs(newCalculatedCost - parseFloat(originalExpectedCost)) > 0.01) {
      correction_reason = 'rate_adjustment';
    } else {
      correction_reason = 'pricing_rules';
    }

    // Build audit metadata
    const correction_metadata = {
      original_expected_cost: originalExpectedCost != null ? round2(parseFloat(originalExpectedCost)) : null,
      new_calculated_cost:    newCalculatedCost,
      correction_reason,
      weight_delta:           overageKg,   // kg over ceiling (null for Pass 1)
      billed_weight_kg:       line.billed_weight_kg,
    };

    // Persist flag so future runs also surface this charge as 'corrected'
    if (chargeId) {
      try {
        await query(`UPDATE charges SET recon_corrected = TRUE WHERE id = $1`, [chargeId]);
      } catch (e) {
        console.warn(`[recon engine] Failed to set recon_corrected on charge ${chargeId}:`, e.message);
      }
    }

    return { corrected: true, reason: 'pricing_rules', correction_metadata };
  }

  return { corrected: false, reason: 'unexplained_delta' };
}

// ─── Aggregate helpers ────────────────────────────────────────────────────────

/**
 * Sum expected fuel costs for all shipments matched in this run.
 * Called once after regular lines are processed, using the set of tracking keys
 * that were successfully matched/corrected.
 */
async function calculateExpectedFuelTotal(pool, matchedTrackingKeys) {
  let total = 0;
  // Deduplicate by shipment_id so multi-line tracking groups don't double-count
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
 * Derives the rate from existing charge records: HGV cost_price / parcel_count.
 * Falls back to 0 if no HGV charges exist yet for this carrier.
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

  // Identify fuel aggregate lines by charge_type OR service_code containing "fuel"
  // (mirrors the fuelIsAggregated detection above — must be consistent).
  const isFuelLine = chargeType.includes('fuel') || serviceCode.includes('fuel');

  let expectedAmount  = null;
  let status          = 'unmatched';
  let unmatchedReason = 'aggregate_mismatch';

  if (isFuelLine) {
    // Fuel aggregate: compare carrier total vs sum of our fuel costs for matched shipments
    expectedAmount = expectedFuelTotal;
    const delta    = round2(carrierAmount - expectedAmount);
    // Allow £1.00 tolerance — fuel percentages can drift slightly
    if (Math.abs(delta) <= 1.00) {
      status = 'matched';
    } else {
      unmatchedReason = 'fuel_aggregate_mismatch';
    }
    console.log(`[recon engine] Fuel aggregate: carrier=£${carrierAmount} expected=£${expectedAmount} delta=£${delta} → ${status}`);

  } else {
    // HGV / other aggregate surcharge
    if (hgvRatePerParcel > 0) {
      expectedAmount = round2(totalParcelCount * hgvRatePerParcel);
      const delta    = round2(carrierAmount - expectedAmount);
      // Tight tolerance — HGV is formulaic (count × rate)
      if (Math.abs(delta) < 0.02) {
        status = 'matched';
      } else {
        unmatchedReason = 'hgv_aggregate_mismatch';
      }
      console.log(`[recon engine] HGV aggregate: ${totalParcelCount} parcels × £${hgvRatePerParcel} = £${expectedAmount}, carrier=£${carrierAmount} → ${status}`);
    } else {
      // No HGV rate on file — flag for human review
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

  // ── Filter: discard lines with no consignment number ─────────────────────
  // Carrier invoices (e.g. DHL) append aggregate rows for fuel and HGV
  // surcharges at the bottom — these have an empty tracking_number/consignment
  // column and cannot be individually reconciled. Skip them entirely so they
  // don't pollute the line count, matched/unmatched counters, or automation %.
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

  // Persist pool size immediately so the UI can show it even before the run completes.
  await query(
    `UPDATE reconciliation_runs SET pool_size = $2 WHERE id = $1`,
    [runId, poolSize]
  );

  // ── Phase 4a: Load Mapping Engine rules ───────────────────────────────────
  const mappings = await loadMappings(carrierId);

  // Diagnostic: log first 3 reconcilable lines
  console.log(`[recon engine] Run ${runId}: ${reconcilableLines.length} reconcilable lines (${skippedCount} aggregate skipped)`);
  reconcilableLines.slice(0, 3).forEach((l, i) => {
    console.log(`[recon engine]   line[${i}]: tracking_number=${JSON.stringify(l.tracking_number)} service_code=${JSON.stringify(l.service_code)} carrier_amount=${JSON.stringify(l.carrier_amount)}`);
  });

  // ── Group lines by tracking number (multi-parcel support) ───────────────
  // DHL bills each parcel as a separate line under the same tracking number.
  // We compare the SUM of per-parcel carrier amounts against the single
  // charge record's base cost_price.
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

  // ── Process lines (grouped by tracking number) ────────────────────────────
  for (const [trackKey, group] of trackingGroups) {
    try {
      const groupResults = await processTrackingGroup(
        group, trackKey, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings
      );

      for (const r of groupResults) {
        switch (r.status) {
          case 'matched':   matched++;   break;
          case 'corrected': corrected++; break;
          case 'unmatched': unmatched++; break;
          case 'ignored':   ignored++;   break;
        }
      }
    } catch (lineErr) {
      console.error(`[recon engine] Run ${runId}: ERROR processing tracking group "${trackKey}":`, lineErr.message);
      unmatched++;
      // Insert a placeholder so it appears in All Lines
      try {
        await query(`INSERT INTO reconciliation_lines (run_id, tracking_number, status, unmatched_reason, source, carrier_amount, charge_type)
          VALUES ($1,$2,'unmatched','processing_error','internal',0,'base')`, [runId, trackKey]);
      } catch (_) { /* ignore insert failure */ }
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
// Single-line groups go through the same logic as before.
// Multi-line groups (multi-parcel shipments) aggregate carrier amounts and
// compare the SUM against the base cost_price (fuel is billed separately as an
// aggregate line for carriers like DHL — so base-only comparison is correct).

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

async function processTrackingGroup(group, trackKey, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings) {
  // Single-line shortcut
  if (group.length === 1) {
    const result = await processLine(group[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings);
    return [result];
  }

  // ── Multi-parcel group ────────────────────────────────────────────────────
  // ── Split mixed-code groups into surcharge lines vs base/freight lines ─────
  // DHL sometimes puts congestion surcharge lines under the SAME tracking number
  // as the base freight lines. If we include them in the aggregate comparison,
  // the total carrier amount exceeds our expected_cost (which is base-only),
  // producing a false delta. Split them out first and auto-correct them, then
  // compare only the freight lines against expected.
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

  // If ALL lines in the group were surcharge lines, we're done.
  if (baseLines.length === 0) return results;

  // If there's only one base line left after splitting, use the single-line path.
  if (baseLines.length === 1) {
    const r = await processLine(baseLines[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings);
    return [...results, r];
  }

  // ── Continue with just the base/freight lines ─────────────────────────────
  const firstLine      = baseLines[0];
  const rawServiceCode = String(firstLine.service_code || '').trim();
  const mappedKey      = rawServiceCode.toUpperCase();
  const serviceId      = serviceCodeMap[mappedKey] || null;

  // ── Separate true freight lines from unmapped surcharge lines ───────────────
  // In DHL invoices, all parcel lines for the same consignment share the same
  // service code (e.g. "220"). Lines with a DIFFERENT service code under the same
  // tracking number are surcharges that haven't been mapped yet (not in surchargeMap).
  // Including them as "parcels" inflates baseLines.length and produces a silly-high
  // expected amount (e.g. first + 4×sub when only 2 parcels exist).
  //
  // Separation rules:
  //   - freightLines: lines where service_code matches the primary freight code (rawServiceCode)
  //   - orphanLines:  lines with a different service code — unmapped surcharges
  //
  // If ALL base lines have the same code (no orphans), the split is a no-op.
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
    // Unknown service code — hard gate; all lines in group go unmatched.
    // Attempt smart suggestion from pool for every line in the group.
    const suggestion = await getSuggestedServiceFromPool(trackKey, pool, carrierId, rawServiceCode);
    if (suggestion) {
      console.log(`[recon engine] Unknown code "${rawServiceCode}" (multi-parcel) — pool suggests service_id=${suggestion.id} (${suggestion.service_code})`);
    }
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
        suggested_service_id:     suggestion?.id || null,
      });
    }
    return [...results, ...baseLines.map(() => ({ status: 'unmatched' }))];
  }

  const poolHits = poolLookup(pool, trackKey);

  if (poolHits.length === 0) {
    // Not in verified pool — process each base line individually
    // (external booking path, or account-number lookup).
    // Orphan lines (unmapped surcharges) are also processed here since without
    // a pool hit we have no expected cost to compare against.
    for (const line of baseLines) {
      const r = await processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings);
      results.push(r);
    }
    return results;
  }

  // ── Aggregate comparison (freight lines only) ─────────────────────────────
  const charge = poolHits[0];

  // Process orphan lines (unmapped surcharges with a different service code)
  // individually — they each need their own lookup or correction engine pass.
  for (const line of orphanLines) {
    const r = await processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings);
    results.push(r);
  }

  // If all base lines turned out to be orphans, we're done.
  if (freightLines.length === 0) return results;

  // If only one freight line remains after splitting, use the single-line path.
  if (freightLines.length === 1) {
    const r = await processLine(freightLines[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings);
    return [...results, r];
  }

  // Compare the SUM of true freight lines only (not orphan/unmapped-surcharge lines).
  // Surcharge lines (from surchargeMap) and orphan lines have already been separated.
  const totalCarrierAmount = round2(
    freightLines.reduce((s, l) => s + (parseFloat(l.carrier_amount) || 0), 0)
  );

  // ── Multi-parcel expected cost — recompute from the carrier rate card ──────
  // charges.cost_price (stored at booking) is often wrong for multi-parcel
  // shipments when weight_bands.price_sub is not configured: the billing engine
  // falls back to first_rate × parcel_count instead of first_rate + (n−1) × sub_rate.
  // Recomputing here avoids both false "corrected" statuses and "sky-high" expected
  // amounts in the UI.
  //
  // IMPORTANT: Only use the recomputed value when price_sub IS configured in the
  // rate card. If price_sub is null, using first_rate as sub_rate gives a wrong
  // (inflated) expected — fall back to stored cost_price instead.
  //
  // DHL puts the per-parcel weight on each invoice line — we use firstLine.billed_weight_kg
  // directly (not divided by group size) to find the correct weight band.
  let expectedBase;
  const perParcelWeight = round2(parseFloat(firstLine.billed_weight_kg) || 0);
  if (perParcelWeight > 0 && serviceId && charge.zone_id) {
    const bandResult = await lookupCarrierBandCost(serviceId, perParcelWeight, charge.zone_id);
    if (bandResult && bandResult.pass === 1) {
      if (bandResult.price_sub != null) {
        // Have a configured sub rate — can correctly compute multi-parcel expected.
        const recomputed = round2(bandResult.cost + (freightLines.length - 1) * bandResult.price_sub);
        console.log(
          `[recon engine] Multi-parcel expected (${freightLines.length} freight parcels, ${perParcelWeight}kg/parcel):` +
          ` first=£${bandResult.cost} sub=£${bandResult.price_sub} → expected=£${recomputed}` +
          ` (stored cost_price=£${round2(parseFloat(charge.expected_cost) || 0)})`
        );
        expectedBase = recomputed;
      } else {
        // price_sub not configured — using first_rate as sub_rate would over-estimate.
        // Fall back to stored cost_price and log so the rate card can be corrected.
        console.warn(
          `[recon engine] Multi-parcel (${freightLines.length} freight parcels): ` +
          `price_sub not set for band (service=${serviceId}, weight=${perParcelWeight}kg, zone=${charge.zone_id}) — ` +
          `falling back to stored cost_price=£${round2(parseFloat(charge.expected_cost) || 0)}. ` +
          `Configure price_sub in the carrier rate card to fix this.`
        );
      }
    }
  }
  // Fall back to stored cost_price if rate card lookup unavailable or price_sub missing.
  if (expectedBase == null) {
    expectedBase = round2(parseFloat(charge.expected_cost) || 0);
  }

  // ── Column surcharge accounting ───────────────────────────────────────────────
  // DHL (and other carriers) bake named per-shipment surcharges (long length,
  // book-in, IOD, etc.) into the same invoice-line carrier_amount as the freight
  // charge — they are NOT separate CSV rows. When the carrier CSV profile has
  // surcharge_columns configured, mapToInvoiceLine extracts those amounts into
  // line.surcharge_amounts. We add them to expected so the delta reflects ONLY
  // unexplained discrepancies, not known named surcharges.
  const { total: colSurchargeTotal, breakdown: colSurchargeBreakdown } = sumGroupColumnSurcharges(group);
  const fullExpected = round2(expectedBase + colSurchargeTotal);

  const delta = round2(totalCarrierAmount - fullExpected);

  // Attach full expected (freight + known surcharges) for the Mapping Engine
  firstLine._expected_amount = fullExpected;

  let groupStatus = 'unmatched';
  let correctedBy = null;
  let mappingId   = null;
  let unmatchedReason = null;

  if (Math.abs(delta) < 0.02) {
    // PRICE IS KING — carrier charged within £0.01 of what we expected → MATCHED.
    // Column surcharge detail is stored in correction_metadata for the audit trail
    // but never elevates the status to 'corrected'. If the money matches, it's green.
    groupStatus = 'matched';
    correctedBy = null;

  } else {
    // Try Mapping Engine
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
      // Try Correction Engine (use aggregate line as proxy)
      const proxyLine = {
        ...firstLine,
        carrier_amount:   totalCarrierAmount,
        billed_weight_kg: firstLine.billed_weight_kg,
      };
      const correction = await checkCorrectionEngine(
        charge.customer_id, serviceId, carrierId, charge.zone_id, proxyLine, delta, charge.charge_id, expectedBase
      );
      if (correction.corrected) {
        groupStatus = 'corrected';
        correctedBy = 'pricing_rules';
      } else {
        groupStatus     = 'unmatched';
        unmatchedReason = correction.reason;
      }
    }
  }

  // Insert one reconciliation_line per true freight line.
  // Store the group-level expected + delta on every line so the UI shows the
  // full picture. expected_amount = freight base + column surcharges so that delta
  // = 0 when carrier charged exactly what we expected (freight + known surcharges).
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
      mapping_id:               mappingId,
      correction_metadata:      colSurchargeMeta,  // null when no column surcharges; audit trail when present
    });
  }

  return [...results, ...freightLines.map(() => ({ status: groupStatus }))];
}

// ─── Process a single line ────────────────────────────────────────────────────

async function processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings) {
  const trackingNumber = String(line.tracking_number || '').trim();
  const trackKey       = trackingNumber.toUpperCase();
  const rawServiceCode = String(line.service_code   || '').trim();
  const carrierAmount  = round2(parseFloat(line.carrier_amount) || 0);

  // Column surcharges baked into this line's carrier_amount — used throughout
  // Phase 3 to compute the true freight delta (carrier billed = freight + surcharges).
  const { total: colSurchargeTotal, breakdown: colSurchargeBreakdown } = sumGroupColumnSurcharges([line]);

  // ── Phase 1b: Service code normalisation ──────────────────────────────────
  const mappedKey = rawServiceCode.toUpperCase();
  const serviceId = serviceCodeMap[mappedKey] || null;

  // ── Surcharge mapping check — before the hard unknown-code gate ───────────
  // If the raw carrier code is mapped to a known surcharge, auto-correct immediately.
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
    // Smart suggestion: use tracking number to find the likely correct service
    // from the Verified Pool (the pool already has the dc_service_id we use).
    const suggestion = await getSuggestedServiceFromPool(trackKey, pool, carrierId, rawServiceCode);
    if (suggestion) {
      console.log(`[recon engine] Unknown code "${rawServiceCode}" — pool suggests service_id=${suggestion.id} (${suggestion.service_code})`);
    }

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
      suggested_service_id:     suggestion?.id || null,
    });
    return { status: 'unmatched' };
  }

  // ── Phase 2: Safety Net — is tracking number in Verified Pool? ────────────
  // poolLookup also tries "60" prefix variants and dc_service_id keys.
  const poolHits = poolLookup(pool, trackKey);
  if (!poolHits.length) {
    console.log(`[recon engine] Pool MISS: "${trackKey}" — not found in pool (${pool.size} keys). Will try account lookup.`);
  }

  if (poolHits.length === 0) {
    const customer = await lookupCustomerByAccount(line.account_number);

    // Pool MISS: no charge record, so no zone_id is available.
    // lookupCarrierBandCost requires a zone — without it we can't do a
    // zone-pinned rate card check, so expectedCarrierCost will be null
    // and rateMatches will be false (correct — we can't verify without zone).
    const bandResult          = await lookupCarrierBandCost(serviceId, line.billed_weight_kg, null);
    const expectedCarrierCost = bandResult?.cost ?? null;
    // Include column surcharges in expected so the delta reflects unexplained discrepancies only
    const fullExpectedCarrierCost = expectedCarrierCost != null
      ? round2(expectedCarrierCost + colSurchargeTotal)
      : null;
    const carrierDelta = fullExpectedCarrierCost !== null
      ? round2(carrierAmount - fullExpectedCarrierCost)
      : null;
    const rateMatches = carrierDelta !== null && Math.abs(carrierDelta) <= 0.01;

    if (!customer) {
      await insertLine(runId, {
        tracking_number:          trackingNumber,
        carrier_account_no:       line.account_number || null,
        raw_service_code:         rawServiceCode,
        charge_type:              line.charge_type || 'base',
        carrier_amount:           carrierAmount,
        carrier_billed_weight_kg: line.billed_weight_kg || null,
        service_id:               serviceId,
        customer_id:              null,
        charge_id:                null,
        expected_amount:          fullExpectedCarrierCost,
        delta:                    carrierDelta,
        status:                   rateMatches ? 'matched' : 'unmatched',
        corrected_by:             null,
        unmatched_reason:         rateMatches ? null : 'no_account_mapping',
        source:                   'internal',
      });
      return { status: rateMatches ? 'matched' : 'unmatched' };
    }

    // External booking — shipment was booked directly with carrier (not via MoovOS).
    // Compare carrier invoice against the carrier rate card. If it matches the
    // agreed cost price, mark as Matched. Sell price is irrelevant here.
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               serviceId,
      customer_id:              customer.customer_id,
      charge_id:                null,
      expected_amount:          fullExpectedCarrierCost,
      delta:                    carrierDelta,
      status:                   rateMatches ? 'matched' : 'unmatched',
      corrected_by:             null,
      unmatched_reason:         rateMatches ? null : 'external_booking_review',
      source:                   'external_booking',
    });
    return { status: rateMatches ? 'matched' : 'unmatched' };
  }

  // ── Phase 3: Match & Compare ──────────────────────────────────────────────
  // Rule: compare against base cost_price ONLY (charges.cost_price).
  // Fuel and HGV surcharges are verified separately via the aggregate line
  // checks — they are NEVER included in per-shipment comparisons.
  //
  // Column surcharges (named per-shipment surcharges baked into carrier_amount):
  // fullExpected = expectedFreight + colSurchargeTotal, so that delta reflects
  // only unexplained discrepancies. When delta ≈ 0 thanks to surcharges, the
  // line is marked corrected/column_surcharge rather than matched.
  const charge = poolHits[0];
  const expectedAmount = round2(parseFloat(charge.expected_cost) || 0);
  const fullExpected   = round2(expectedAmount + colSurchargeTotal);
  const delta          = round2(carrierAmount - fullExpected);

  line._expected_amount = fullExpected;

  if (Math.abs(delta) < 0.02) {
    // ── PRICE IS KING rule ────────────────────────────────────────────────────
    //
    // If the carrier charged within £0.01 of what we expected, the row is GREEN
    // (Matched). No weight-band comparisons, no tier-change analysis, no declared
    // vs billed weight gymnastics.
    //
    // ONE exception: if the billed weight triggered the Pass 2 overage formula
    // (weight exceeds every defined band ceiling), the carrier applied a
    // structurally different billing path. Flag as Corrected even at delta = 0
    // so the Corrections Report captures it.
    //
    // Band changes (declared and billed weights in different tiers but same price)
    // are NOT flagged — if the money matches, the tier is irrelevant.

    const billedWeight = parseFloat(line.billed_weight_kg) || null;

    let isCorrection       = false;
    let correctionReason   = null;
    let weightDeltaForMeta = null;

    if (billedWeight != null && charge.zone_id) {
      const bResult = await lookupCarrierBandCost(serviceId, billedWeight, charge.zone_id);
      if (bResult && bResult.pass === 2) {
        isCorrection       = true;
        correctionReason   = 'weight_overage';
        weightDeltaForMeta = bResult.overageKg;
        console.log(
          `[recon engine] Zero-delta Pass 2 override: billed ${billedWeight}kg triggered` +
          ` overage (+${bResult.overageKg}kg above ceiling) → CORRECTED`
        );
      }
    }

    if (!isCorrection) {
      // PRICE IS KING — carrier charged within £0.01 of what we expected → MATCHED.
      // Column surcharge amounts (if any) are stored in correction_metadata for the
      // audit trail but do NOT change the status to 'corrected'. Green = green.
      await insertLine(runId, {
        tracking_number:          trackingNumber,
        carrier_account_no:       line.account_number || null,
        raw_service_code:         rawServiceCode,
        charge_type:              line.charge_type || 'base',
        carrier_amount:           carrierAmount,
        carrier_billed_weight_kg: line.billed_weight_kg || null,
        service_id:               serviceId,
        customer_id:              charge.customer_id,
        charge_id:                charge.charge_id,
        expected_amount:          fullExpected,
        delta:                    delta,
        status:                   'matched',
        corrected_by:             null,
        unmatched_reason:         null,
        source:                   'internal',
        correction_metadata:      colSurchargeTotal > 0
          ? { col_surcharge_total: colSurchargeTotal, col_surcharges: colSurchargeBreakdown }
          : null,
      });
      return { status: 'matched' };
    }

    // True correction — write the flag and metadata so the Corrections Report
    // has full detail even when the cost delta is zero.
    if (charge.charge_id) {
      try {
        await query(`UPDATE charges SET recon_corrected = TRUE WHERE id = $1`, [charge.charge_id]);
      } catch (e) {
        console.warn(`[recon engine] Failed to set recon_corrected on charge ${charge.charge_id}:`, e.message);
      }
    }
    const correction_metadata = {
      original_expected_cost: expectedAmount,
      new_calculated_cost:    expectedAmount,
      correction_reason:      correctionReason,
      weight_delta:           weightDeltaForMeta,
      billed_weight_kg:       billedWeight,
      ...(colSurchargeTotal > 0 && { col_surcharge_total: colSurchargeTotal, col_surcharges: colSurchargeBreakdown }),
    };
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               serviceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          fullExpected,
      delta:                    delta,
      status:                   'corrected',
      corrected_by:             'pricing_rules',
      unmatched_reason:         null,
      source:                   'internal',
      correction_metadata,
    });
    return { status: 'corrected' };
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
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               serviceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          fullExpected,
      delta:                    delta,
      status:                   'corrected',
      corrected_by:             'mapping',
      unmatched_reason:         null,
      source:                   'internal',
      mapping_id:               mappingResult.mappingId,
    });
    return { status: 'corrected' };
  }

  // ── Phase 4b: Correction Engine ───────────────────────────────────────────
  const correction = await checkCorrectionEngine(
    charge.customer_id, serviceId, carrierId, charge.zone_id, line, delta, charge.charge_id, fullExpected
  );

  if (correction.corrected) {
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               serviceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          fullExpected,
      delta:                    delta,
      status:                   'corrected',
      corrected_by:             'pricing_rules',
      unmatched_reason:         null,
      source:                   'internal',
      correction_metadata:      correction.correction_metadata || null,
    });
    return { status: 'corrected' };
  }

  // ── Unmatched ─────────────────────────────────────────────────────────────
  await insertLine(runId, {
    tracking_number:          trackingNumber,
    carrier_account_no:       line.account_number || null,
    raw_service_code:         rawServiceCode,
    charge_type:              line.charge_type || 'base',
    carrier_amount:           carrierAmount,
    carrier_billed_weight_kg: line.billed_weight_kg || null,
    service_id:               serviceId,
    customer_id:              charge.customer_id,
    charge_id:                charge.charge_id,
    expected_amount:          fullExpected,
    delta:                    delta,
    status:                   'unmatched',
    corrected_by:             null,
    unmatched_reason:         correction.reason,
    source:                   'internal',
  });
  return { status: 'unmatched' };
}

// ─── Synthesise expected amount for external bookings ────────────────────────

async function synthesiseExternalExpected(customerId, serviceId, weightKg) {
  if (!weightKg || !customerId) return null;

  const serviceRes = await query(
    `SELECT service_code FROM courier_services WHERE id = $1 LIMIT 1`,
    [serviceId]
  );
  if (!serviceRes.rows.length) return null;

  const svcCode = serviceRes.rows[0].service_code;

  const rateRes = await query(
    `SELECT price, price_sub, per_kg_rate, per_kg_threshold_kg
     FROM   customer_rates
     WHERE  customer_id = $1
       AND  TRIM(service_code) ILIKE TRIM($2)
       AND  ($3 >= COALESCE(min_weight_kg, 0))
       AND  ($3 <  COALESCE(max_weight_kg, 99999))
     ORDER  BY min_weight_kg ASC NULLS LAST
     LIMIT  1`,
    [customerId, svcCode, weightKg]
  );
  if (!rateRes.rows.length) return null;

  const rate = rateRes.rows[0];
  let expected = parseFloat(rate.price || 0);
  if (rate.per_kg_rate && rate.per_kg_threshold_kg && weightKg > rate.per_kg_threshold_kg) {
    expected += (weightKg - rate.per_kg_threshold_kg) * parseFloat(rate.per_kg_rate);
  }
  return round2(expected);
}

// ─── Insert reconciliation line ───────────────────────────────────────────────

async function insertLine(runId, data) {
  await query(`
    INSERT INTO reconciliation_lines
      (run_id, tracking_number, carrier_account_no, raw_service_code, charge_type,
       carrier_amount, carrier_billed_weight_kg, service_id, customer_id, charge_id,
       expected_amount, delta, status, corrected_by, unmatched_reason, source,
       mapping_id, is_fuel, suggested_service_id, correction_metadata)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
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
  ]);
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
