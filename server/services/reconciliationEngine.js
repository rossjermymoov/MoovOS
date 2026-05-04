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
import { matchZone } from './pricingEngine.js';

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
 *
 * A pool miss for a known consignment means either:
 *   (a) the charge is not yet verified — fix the verification path
 *   (b) the tracking number format in the DB differs from the invoice — fix the data
 *   (c) the shipment was genuinely not in our system — UNMATCHED is correct
 *
 * The order-reference fallback (indexed separately) still applies.
 */
function poolLookup(pool, trackKey) {
  const hits = pool.get(trackKey);
  return (hits && hits.length) ? hits : [];
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
      -- zone_id: STRICT — direct integer link only.
      -- No ILIKE zone_name fallback.  If zone_id is NULL on a charge, the
      -- reconciliation engine will surface it as 'data_error_no_zone' so the
      -- operator can fix the underlying data rather than silently guessing.
      -- Every charge MUST have zone_id set at creation time.
      c.zone_id,
      -- tracking_codes: from shipment record (old-style) OR single tracking_code
      -- stored on the charge itself (new-style, extracted from create_label_parcels).
      COALESCE(
        s.tracking_codes,
        CASE WHEN c.tracking_code IS NOT NULL THEN ARRAY[c.tracking_code] ELSE NULL END
      )                 AS tracking_codes,
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
    -- LEFT JOIN so that charges without a shipment record are still included.
    -- This is a safety net: webhooks.js now creates shipment records, and
    -- migration 148 backfills existing ones. Without this, a missed shipment
    -- record silently makes a charge invisible to reconciliation.
    LEFT JOIN shipments    s  ON s.id = c.shipment_id
    JOIN      couriers     cu_carrier ON cu_carrier.id = $1
    LEFT JOIN customers    cu ON cu.id = c.customer_id
    WHERE  c.verified      = true
      AND  c.cancelled     = false
      AND  c.charge_type   = 'courier'
      -- Carrier matching:
      --   Old-style: match via shipments.courier (contains variants handle naming differences)
      --   New-style: match via courier_service_id → courier_services.courier_id
      --   Both must be accepted so old and new charges work correctly.
      AND (
        -- Old-style charges (billing.js path, shipment record exists)
        s.courier ILIKE cu_carrier.code
        OR s.courier ILIKE cu_carrier.name
        OR s.courier ILIKE '%' || cu_carrier.code || '%'
        OR cu_carrier.code ILIKE '%' || s.courier || '%'
        OR s.courier ILIKE '%' || cu_carrier.name || '%'
        OR cu_carrier.name ILIKE '%' || s.courier || '%'
        -- New-style charges (webhooks.js / pricingEngine.js path, courier_service_id set)
        OR EXISTS (
          SELECT 1 FROM courier_services cs2
          WHERE  cs2.id = c.courier_service_id AND cs2.courier_id = $1
        )
      )
      -- Verification gate: only shipments the carrier has collected.
      -- Old-style: shipment has tracking_codes or dc_service_id.
      -- New-style: charge has a tracking_code (from create_label_parcels) or
      --   voila_shipment_id (created via Voila webhook — carrier collected it).
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
    // Tracking numbers are immutable strings.  The DB value must match the
    // invoice value exactly (same prefix, same length, same format).
    // If they differ, fix the data — do not paper over it with prefix variants.
    const codes = row.tracking_codes || [];
    for (const code of codes) {
      const key = String(code).trim().toUpperCase();
      addToPool(key, row);
    }

    // ── Index by dc_service_id — EXACT MATCH ONLY ────────────────────────
    // For DHL shipments managed via DeliveryConnect, the consignment number
    // from the PWS invoice is stored in dc_service_id (not tracking_codes).
    // This is the PRIMARY lookup key for DHL reconciliation.
    // No prefix normalisation — the stored dc_service_id must match the invoice.
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

  // Zone-id diagnostic — strict mode.
  // Every charge MUST have zone_id set.  If zone_id is null the engine will
  // emit 'data_error_no_zone' when that consignment appears on an invoice.
  // Fix: update the charge record to set the correct zone_id.
  const nullZoneRows = res.rows.filter(r => !r.zone_id);
  if (nullZoneRows.length > 0) {
    console.warn(
      `[recon engine] DATA_ERROR: ${nullZoneRows.length}/${res.rows.length} pool charge(s) have zone_id=NULL.` +
      ` These will surface as data_error_no_zone on the invoice — fix the zone_id on these charges.`
    );
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
// Called when Phase 3 finds an unexplained delta after the rate card comparison.
// Re-checks using the billed weight from the CSV — if the rate card (weight_bands)
// explains the carrier's charge (e.g. overage), mark as Corrected.

// originalExpectedCost — the stored charges.cost_price (passed by caller so metadata can
// record what we expected before the carrier invoice revealed the true cost).
// chargeId — when provided, sets recon_corrected on the charge for future run flagging.
async function checkCorrectionEngine(customerId, serviceId, carrierId, zoneId, line, delta, chargeId, originalExpectedCost, ctx) {
  if (!serviceId || !(line.billed_weight_kg > 0)) {
    return { corrected: false, reason: 'no_service_id_or_weight' };
  }

  const result = await ctx.bandLookup(serviceId, line.billed_weight_kg, zoneId);
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

  // ── Run-scoped lookup caches ───────────────────────────────────────────────
  // Carrier invoices repeat the same zone + weight combos many times. Caching
  // eliminates redundant DB round-trips — the primary source of per-line latency.
  const _bandCache    = new Map();
  const _custCache    = new Map();
  const _zoneCache    = new Map();
  const _subRateCache = new Map();

  const ctx = {
    async bandLookup(serviceId, weightKg, zoneId) {
      const key = `${serviceId}:${zoneId ?? ''}:${weightKg}`;
      if (_bandCache.has(key)) return _bandCache.get(key);
      const r = await lookupCarrierBandCost(serviceId, weightKg, zoneId);
      _bandCache.set(key, r);
      return r;
    },
    async customerLookup(accountNumber) {
      if (!accountNumber) return null;
      const k = String(accountNumber).trim();
      if (_custCache.has(k)) return _custCache.get(k);
      const r = await lookupCustomerByAccount(k);
      _custCache.set(k, r);
      return r;
    },
    async zoneLookup(serviceId, country, postcode) {
      const key = `${serviceId}:${country ?? ''}:${postcode ?? ''}`;
      if (_zoneCache.has(key)) return _zoneCache.get(key);
      const r = await matchZone(serviceId, country, postcode);
      _zoneCache.set(key, r);
      return r;
    },
    async subRateLookup(serviceId, zoneId) {
      const key = `${serviceId}:${zoneId}`;
      if (_subRateCache.has(key)) return _subRateCache.get(key);
      // When zoneId is known, pin to that zone. When null, take the minimum
      // price_sub across all zones for this service (same zone-free fallback
      // philosophy as lookupCarrierBandCost).
      const subRes = zoneId
        ? await query(
            `SELECT MIN(wb.price_sub) AS price_sub
             FROM   weight_bands wb JOIN zones z ON z.id = wb.zone_id
             WHERE  z.courier_service_id = $1 AND wb.zone_id = $2 AND wb.price_sub IS NOT NULL`,
            [serviceId, zoneId]
          )
        : await query(
            `SELECT MIN(wb.price_sub) AS price_sub
             FROM   weight_bands wb JOIN zones z ON z.id = wb.zone_id
             WHERE  z.courier_service_id = $1 AND wb.price_sub IS NOT NULL`,
            [serviceId]
          );
      const priceSub = (subRes.rows.length && subRes.rows[0].price_sub != null)
        ? round2(parseFloat(subRes.rows[0].price_sub)) : null;
      _subRateCache.set(key, priceSub);
      return priceSub;
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

  // ── Process tracking groups — parallel batches ────────────────────────────
  // Sequential processing with ~4ms DB latency per line adds up fast (500 lines =
  // 2+ seconds minimum before any work is done). Batching groups into concurrent
  // Promise.allSettled calls uses the DB connection pool efficiently.
  const BATCH_SIZE  = 40; // concurrent groups per batch
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
        // Can't insert placeholder here (no trackKey easily available); count only.
      }
    }
  }

  // ── Calculate automation rate ─────────────────────────────────────────────
  const total          = reconcilableLines.length;
  const autoResolved   = matched + corrected;
  const automationRate = total > 0 ? round2((autoResolved / total) * 100) : 0;

  // ── Log cache stats ───────────────────────────────────────────────────────
  console.log(`[recon engine] Run ${runId} cache stats — bands: ${_bandCache.size} keys, customers: ${_custCache.size} keys, zones: ${_zoneCache.size} keys`);

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

async function processTrackingGroup(group, trackKey, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx) {
  // Single-line shortcut
  if (group.length === 1) {
    const result = await processLine(group[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
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
    const r = await processLine(baseLines[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
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
    const r = await processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
    results.push(r);
  }

  // If all base lines turned out to be orphans, we're done.
  if (freightLines.length === 0) return results;

  // If only one freight line remains after splitting, use the single-line path.
  if (freightLines.length === 1) {
    const r = await processLine(freightLines[0], runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx);
    return [...results, r];
  }

  // Compare the SUM of true freight lines only (not orphan/unmapped-surcharge lines).
  // Surcharge lines (from surchargeMap) and orphan lines have already been separated.
  const totalCarrierAmount = round2(
    freightLines.reduce((s, l) => s + (parseFloat(l.carrier_amount) || 0), 0)
  );

  // ── Multi-parcel expected cost — from the carrier rate card (first principles) ──
  // All expected amounts are computed from weight_bands using service_id + zone + weight.
  // charges.cost_price is never used — it comes from the billing API / webhook.
  //
  // DHL puts the per-parcel weight on each invoice line — we use firstLine.billed_weight_kg
  // directly (not divided by group size) to find the correct weight band.
  let expectedBase;
  const perParcelWeight = round2(parseFloat(firstLine.billed_weight_kg) || 0);
  // charge.zone_id may be null if charges.zone_name had no match in zones after ILIKE.
  // Fall through to zone-free band lookup in that case — same behaviour as processLine.
  if (perParcelWeight > 0 && serviceId) {
    const bandResult = await ctx.bandLookup(serviceId, perParcelWeight, charge.zone_id || null);
    if (bandResult && bandResult.pass === 1) {
      // Resolve price_sub: use the matched band's value, or fall back to any
      // configured price_sub in the same zone. DHL charges one flat sub rate
      // regardless of weight tier — it may only be entered on one band in the UI.
      let priceSub = bandResult.price_sub;
      if (priceSub == null) {
        priceSub = await ctx.subRateLookup(serviceId, charge.zone_id);
        if (priceSub != null) {
          console.log(
            `[recon engine] Multi-parcel: price_sub not on matched band ` +
            `(service=${serviceId}, ${perParcelWeight}kg) — using zone fallback sub=£${priceSub}`
          );
        }
      }

      if (priceSub != null) {
        // Have a sub rate (from matched band or zone fallback) — recompute expected.
        const recomputed = round2(bandResult.cost + (freightLines.length - 1) * priceSub);
        console.log(
          `[recon engine] Multi-parcel expected (${freightLines.length} freight parcels, ${perParcelWeight}kg/parcel):` +
          ` first=£${bandResult.cost} sub=£${priceSub} → expected=£${recomputed}`
        );
        expectedBase = recomputed;
      } else {
        // No sub rate anywhere in this zone — expectedBase stays null.
        // The null-guard below will insert all freight lines as 'no_rate_card' unmatched.
        console.warn(
          `[recon engine] Multi-parcel (${freightLines.length} freight parcels): ` +
          `price_sub not configured in any band for zone ${charge.zone_id} — ` +
          `marking as no_rate_card. Set price_sub on at least one weight band.`
        );
      }
    }
  }
  // If no rate card result available (zone not configured, or price_sub missing),
  // do NOT fall back to charges.cost_price — that value comes from the billing API
  // / webhook and must never be used for reconciliation comparison.
  // Instead, mark all freight lines unmatched so the operator can investigate.
  if (expectedBase == null) {
    for (const line of freightLines) {
      await insertLine(runId, {
        tracking_number:          String(line.tracking_number || '').trim(),
        carrier_account_no:       line.account_number    || null,
        raw_service_code:         rawServiceCode,
        charge_type:              line.charge_type       || 'base',
        carrier_amount:           round2(parseFloat(line.carrier_amount) || 0),
        carrier_billed_weight_kg: line.billed_weight_kg  || null,
        service_id:               serviceId,
        customer_id:              charge.customer_id,
        charge_id:                charge.charge_id,
        expected_amount:          null,
        delta:                    null,
        status:                   'unmatched',
        corrected_by:             null,
        unmatched_reason:         'no_rate_card',
        source:                   'internal',
        shipment_date:            line.shipment_date     || null,
        ship_to_postcode:         line.delivery_postcode || null,
        ship_to_country:          line.ship_to_country   || null,
      });
    }
    return [...results, ...freightLines.map(() => ({ status: 'unmatched' }))];
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
      shipment_date:            line.shipment_date || null,
      mapping_id:               mappingId,
      correction_metadata:      colSurchargeMeta,  // null when no column surcharges; audit trail when present
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
    const customer = await ctx.customerLookup(line.account_number);

    // Pool MISS — no charge record in the OMS for this tracking number.
    //
    // We do NOT attempt a zone-free rate card estimate here. Without a zone we
    // cannot pin the correct weight band, so any figure we compute would be a
    // guess rather than a verified comparison. Marking a line as "matched" or
    // "unmatched" based on an unzoned estimate misleads the operator.
    //
    // Instead we record the line with expected_amount = null and route it to
    // manual review.  Two sub-cases:
    //   • customer found via account_number → source = 'external_booking',
    //     unmatched_reason = 'external_booking_review' (amber, reviewable)
    //   • no customer found                → source = 'internal',
    //     unmatched_reason = 'no_account_mapping' (amber, needs account mapped)

    if (!customer) {
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

    // External booking — shipment booked directly with carrier, no OMS record.
    // Attempt to resolve zone from delivery postcode (captured from carrier CSV) so
    // we can compute expected from the rate card and potentially auto-match.
    // If zone resolution fails, expected stays null and operator reviews manually.
    let externalExpected = null;
    const extWeightKg    = round2(parseFloat(line.billed_weight_kg) || 0);
    if (serviceId && extWeightKg > 0 && (line.delivery_postcode || line.ship_to_country)) {
      const zone = await ctx.zoneLookup(serviceId, line.ship_to_country || 'GB', line.delivery_postcode || '');
      if (zone) {
        const band = await ctx.bandLookup(serviceId, extWeightKg, zone.id);
        if (band) externalExpected = band.cost;
      }
    }
    const externalDelta  = externalExpected !== null ? round2(carrierAmount - externalExpected) : null;
    const externalStatus = externalExpected !== null && Math.abs(externalDelta) < 0.02
      ? 'matched' : 'unmatched';
    const externalReason = externalStatus === 'matched' ? null
      : (externalExpected !== null ? 'price_mismatch' : 'external_booking_review');

    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg  || null,
      service_id:               serviceId,
      customer_id:              customer.customer_id,
      charge_id:                null,
      expected_amount:          externalExpected,
      delta:                    externalDelta,
      status:                   externalStatus,
      corrected_by:             null,
      unmatched_reason:         externalReason,
      source:                   'external_booking',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
    });
    return { status: externalStatus };
  }

  // ── Phase 3: Match & Compare ──────────────────────────────────────────────
  // Rule: compare base carrier amount against rate card price_first ONLY.
  //
  // charges.cost_price (charge.expected_cost) is populated from the billing API /
  // webhook and MUST NOT be used — every expected amount is built from first
  // principles: service_id + zone_id + billed_weight_kg → weight_bands.price_first.
  //
  // The pool record gives us zone_id (where the parcel was delivered) and
  // customer/shipment linkage — that is all we use from it price-wise.
  //
  // Multi-parcel single-line invoices (line.parcel_count > 1):
  //   The carrier bills the whole shipment on one CSV line. Sub-parcel cost is
  //   PART OF THE BASE FREIGHT — it is NOT an additive surcharge. We recompute
  //   expectedBase from the rate card: price_first + (parcel_count−1) × price_sub.
  //   Column surcharges are zeroed out for this path to prevent double-counting.
  //
  // Single-parcel lines:
  //   Column surcharges (named per-shipment surcharges baked into carrier_amount,
  //   e.g. IOD, long-length) are added to expected so the delta reflects only
  //   unexplained discrepancies.
  const charge            = poolHits[0];
  const parcelCount       = Math.max(1, parseInt(line.parcel_count) || 1);
  const perParcelWeightKg = round2(parseFloat(line.billed_weight_kg) || 0);
  const allAtSub          = (line.parcel_pricing || '') === 'all_sub';

  // ── STRICT zone_id enforcement ────────────────────────────────────────────
  // Every charge MUST have zone_id set as a direct integer link.
  // If zone_id is null, the rate card band cannot be correctly pinned — any
  // expected amount we produce would be a guess.  Surface as DATA_ERROR so the
  // operator can fix the charge record rather than silently misreconciling.
  if (!charge.zone_id) {
    console.error(
      `[recon engine] DATA_ERROR: charge ${charge.charge_id} (tracking=${trackingNumber}) has zone_id=null.` +
      ` Fix zone_id on this charge — no zone-free fallback is applied.`
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
      expected_amount:          null,
      delta:                    null,
      status:                   'unmatched',
      corrected_by:             null,
      unmatched_reason:         'data_error_no_zone',
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
    });
    return { status: 'unmatched' };
  }

  // Base expected — always from rate card, always zone-pinned (zone_id guaranteed non-null above).
  let expectedAmount        = null;
  let effectiveColSurcharge = colSurchargeTotal;  // default: include named surcharges

  if (serviceId && perParcelWeightKg > 0) {
    const singleBand = await ctx.bandLookup(serviceId, perParcelWeightKg, charge.zone_id);
    if (singleBand) expectedAmount = singleBand.cost;
  }

  if (parcelCount > 1 && serviceId) {
    // Single invoice line for a multi-parcel shipment.
    //
    // Standard carriers (DHL): first parcel at base rate + (n-1) parcels at sub-rate.
    //   expected = price_first + (parcel_count − 1) × price_sub
    //
    // DPD-style carriers (parcel_pricing === 'all_sub'): ALL parcels at sub-rate.
    //   expected = items × price_sub   ← the DPD "items" column is the parcel count.
    //   No fallback to single-parcel rate — if the math doesn't match the invoice,
    //   the line is UNMATCHED so the operator can see the error clearly.
    if (perParcelWeightKg > 0) {
      const bandResult = await ctx.bandLookup(serviceId, perParcelWeightKg, charge.zone_id);
      if (bandResult && bandResult.pass === 1) {
        let priceSub = bandResult.price_sub;
        if (priceSub == null) {
          priceSub = await ctx.subRateLookup(serviceId, charge.zone_id);
        }
        if (priceSub != null) {
          let recomputed;
          if (allAtSub) {
            // DPD: ALL parcels (including first) at sub-rate — items × price_sub
            recomputed = round2(parcelCount * priceSub);
            console.log(
              `[recon engine] DPD multi-parcel (${parcelCount} items, ${perParcelWeightKg}kg/parcel):` +
              ` ${parcelCount} × £${priceSub} = expected £${recomputed}`
            );
          } else {
            // Standard (DHL): first at price_first, rest at price_sub
            recomputed = round2(bandResult.cost + (parcelCount - 1) * priceSub);
            console.log(
              `[recon engine] Multi-parcel single-line (${parcelCount} parcels, ${perParcelWeightKg}kg/parcel):` +
              ` first=£${bandResult.cost} sub=£${priceSub} → expected=£${recomputed}`
            );
          }
          expectedAmount        = recomputed;
          effectiveColSurcharge = 0;   // sub-parcel is base, not a surcharge add-on
        }
      }
    }
  }

  // No rate card configured for this service/zone — cannot compare.
  // Mark unmatched so the operator can investigate rather than showing a
  // misleading delta based on billing API cost_price.
  if (expectedAmount === null) {
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number     || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type        || 'base',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg   || null,
      service_id:               serviceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          null,
      delta:                    null,
      status:                   'unmatched',
      corrected_by:             null,
      unmatched_reason:         'no_rate_card',
      source:                   'internal',
      shipment_date:            line.shipment_date      || null,
      ship_to_postcode:         line.delivery_postcode  || null,
      ship_to_country:          line.ship_to_country    || null,
    });
    return { status: 'unmatched' };
  }

  const fullExpected = round2(expectedAmount + effectiveColSurcharge);
  const delta        = round2(carrierAmount - fullExpected);

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
      const bResult = await ctx.bandLookup(serviceId, billedWeight, charge.zone_id);
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
        correction_metadata:      effectiveColSurcharge > 0
          ? { col_surcharge_total: effectiveColSurcharge, col_surcharges: colSurchargeBreakdown }
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
      ...(effectiveColSurcharge > 0 && { col_surcharge_total: effectiveColSurcharge, col_surcharges: colSurchargeBreakdown }),
    };
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
      corrected_by:             'pricing_rules',
      unmatched_reason:         null,
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
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
      mapping_id:               mappingResult.mappingId,
    });
    return { status: 'corrected' };
  }

  // ── Phase 4b bypass — DPD all_sub multi-parcel mismatch ─────────────────
  // When expected was computed as items × price_sub and doesn't match the
  // carrier invoice, that is a transparent data mismatch — not a pricing
  // ambiguity the correction engine can resolve.
  // The correction engine MUST NOT run here: it would find single-parcel
  // price_first, compare it to the carrier amount, and silently hide the
  // discrepancy as "corrected" — masking the real problem (wrong parcel count
  // or wrong price_sub value in the rate card).
  // UNMATCHED with reason 'multi_parcel_mismatch' is the correct outcome.
  if (allAtSub && parcelCount > 1) {
    console.log(
      `[recon engine] DPD multi-parcel mismatch: ${parcelCount} items × price_sub=£${round2(expectedAmount / parcelCount)} = expected £${expectedAmount}` +
      ` vs carrier £${carrierAmount} (delta £${delta}) — UNMATCHED (multi_parcel_mismatch)`
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
      status:                   'unmatched',
      corrected_by:             null,
      unmatched_reason:         'multi_parcel_mismatch',
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
    });
    return { status: 'unmatched' };
  }

  // ── Phase 4b: Correction Engine ───────────────────────────────────────────
  const correction = await checkCorrectionEngine(
    charge.customer_id, serviceId, carrierId, charge.zone_id, line, delta, charge.charge_id, fullExpected, ctx
  );

  if (correction.corrected) {
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
      corrected_by:             'pricing_rules',
      unmatched_reason:         null,
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
      correction_metadata:      correction.correction_metadata || null,
    });
    return { status: 'corrected' };
  }

  // ── Unmatched ─────────────────────────────────────────────────────────────
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
    unmatched_reason:         correction.reason,
    source:                   'internal',
    shipment_date:            line.shipment_date     || null,
    ship_to_postcode:         line.delivery_postcode || null,
    ship_to_country:          line.ship_to_country   || null,
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
       mapping_id, is_fuel, suggested_service_id, correction_metadata, shipment_date,
       ship_to_postcode, ship_to_country)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
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
  ]);
}

// ─── Reprocess lines after a service code mapping is saved ───────────────────
//
// Called by bulk-map-service-codes after the user maps an unknown_service_code.
// Re-runs the core pool-lookup + cost comparison for every affected line in the
// run so they get proper matched/unmatched/external_booking status rather than
// being blindly stamped "corrected".
//
// For each line:
//   • Pool HIT  → expected = cost_price, delta computed, status = matched / unmatched
//   • Pool MISS → customer lookup via account_number
//       – customer found  → external_booking, expected = null (no zone, no estimate)
//       – no customer     → unmatched / no_account_mapping
//
// Returns { matched, unmatched, external_booking } counts.

export async function reprocessMappedLines(runId, rawServiceCode, serviceId, carrierId) {
  // Load all unknown_service_code lines in this run that have the newly mapped code
  const linesRes = await query(`
    SELECT
      id              AS line_id,
      tracking_number,
      carrier_amount,
      carrier_billed_weight_kg AS billed_weight_kg,
      carrier_account_no       AS account_number,
      parcel_count,
      correction_metadata
    FROM reconciliation_lines
    WHERE run_id             = $1
      AND raw_service_code   = $2
      AND status             = 'unmatched'
      AND unmatched_reason   = 'unknown_service_code'
  `, [runId, rawServiceCode]);

  if (!linesRes.rows.length) return { matched: 0, unmatched: 0, external_booking: 0 };

  const { pool } = await buildVerifiedPool(carrierId);

  let matched = 0, unmatched = 0, external_booking = 0;

  for (const line of linesRes.rows) {
    const trackKey      = String(line.tracking_number || '').trim().toUpperCase();
    const carrierAmount = round2(parseFloat(line.carrier_amount) || 0);
    const poolHits      = trackKey ? poolLookup(pool, trackKey) : [];

    if (poolHits.length > 0) {
      // ── Pool HIT: compare carrier_amount against rate card price_first ──────
      // charges.cost_price (charge.expected_cost) is from the billing API / webhook
      // and must never be used. Build expected from first principles: zone + weight.
      const charge    = poolHits[0];
      const weightKg  = round2(parseFloat(line.billed_weight_kg) || 0);
      let expectedCost = null;
      // Use zone-free fallback when zone_id is null — same behaviour as processLine.
      if (weightKg > 0) {
        const band = await lookupCarrierBandCost(serviceId, weightKg, charge.zone_id || null);
        if (band) expectedCost = band.cost;
      }
      const delta   = expectedCost !== null ? round2(carrierAmount - expectedCost) : null;
      const isMatch = expectedCost !== null && Math.abs(delta) < 0.02;

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
        isMatch ? null : (expectedCost === null ? 'no_rate_card' : 'price_mismatch'),
        line.line_id,
      ]);

      if (isMatch) matched++; else unmatched++;

    } else {
      // ── Pool MISS: external booking or unknown account ───────────────────────
      const customer = await lookupCustomerByAccount(line.account_number);

      if (customer) {
        await query(`
          UPDATE reconciliation_lines
          SET  status           = 'unmatched',
               service_id       = $1,
               customer_id      = $2,
               charge_id        = NULL,
               expected_amount  = NULL,
               delta            = NULL,
               unmatched_reason = 'external_booking_review',
               source           = 'external_booking',
               corrected_by     = NULL,
               resolved_at      = NULL,
               resolved_by      = NULL
          WHERE id = $3
        `, [serviceId, customer.customer_id, line.line_id]);
        external_booking++;
      } else {
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
      }
    }
  }

  console.log(`[recon engine] reprocessMappedLines run=${runId} code="${rawServiceCode}": matched=${matched} external_booking=${external_booking} unmatched=${unmatched}`);
  return { matched, unmatched, external_booking };
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
