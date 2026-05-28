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
import { computeGhostCharge, insertCharges, lookupCarrierBandCost, lookupCustomerSellPrice, matchZone } from './pricingEngine.js';
import { requestTrackingUpdate } from './voilaClient.js';
import { normalisePayload, upsertEvent } from '../routes/tracking.js';

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

// ─── DDP Clearance Admin Fee ──────────────────────────────────────────────────
//
// Charged once per DDP consignment at reconciliation time.
//   Europe  (EU27 + EEA + CH): flat £2.50
//   Rest of World:              max(£12.50, 2.5% of declared goods value)
//
// Break-even for ROW: £500 declared value (2.5% × £500 = £12.50 = minimum).
// Below £500 → flat £12.50.  At or above £500 → 2.5%.

const EUROPEAN_ISOS = new Set([
  // EU27
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
  'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
  // EEA (non-EU) + Switzerland
  'IS','LI','NO','CH',
]);

function calcDdpAdminFee(countryIso, goodsValue) {
  if (EUROPEAN_ISOS.has(String(countryIso || '').toUpperCase())) return 2.50;
  const pct = round2((parseFloat(goodsValue) || 0) * 0.025);
  return Math.max(12.50, pct);
}

/**
 * Insert a DDP clearance admin reconciliation line for a reconciled DDP consignment.
 *
 * IMPORTANT: This does NOT insert a charge row. The charge is created at
 * Finalize Run time (finalizationService.js) so the charges table stays clean
 * until the operator explicitly finalizes the run.
 *
 * Fires only when:
 *   1. The effective service code ends in 'DDP'
 *   2. The shipment has customer_id
 *   3. total_declared_value > 0 (goods value is on record)
 *   4. No ddp_admin recon line already exists for this run + tracking number
 *
 * The reconciliation line has:
 *   source             = 'ddp_admin'
 *   status             = 'corrected'
 *   carrier_amount     = 0  (Moov's own fee — not billed by the carrier)
 *   corrected_sell_price = fee amount
 *   corrected_cost_price = 0
 *   charge_id          = null (populated by finalization service when charge is created)
 */
async function insertDdpAdminReconLine(runId, trackingNumber, charge, effectiveServiceId, countryIso, shipmentDate, serviceIdToCodeMap) {
  if (!charge?.customer_id) return null;

  const serviceCode = serviceIdToCodeMap[effectiveServiceId];
  if (!serviceCode || !serviceCode.toUpperCase().endsWith('DDP')) return null;

  const goodsValue = parseFloat(charge.total_declared_value) || 0;
  if (goodsValue <= 0) {
    console.log(
      `[recon engine] DDP admin fee SKIP: tracking=${trackingNumber} ` +
      `service=${serviceCode} — no declared goods value on record`
    );
    return null;
  }

  // Guard: don't double-insert on re-run of the same invoice
  const existing = await query(
    `SELECT id FROM reconciliation_lines
     WHERE run_id = $1 AND tracking_number = $2 AND source = 'ddp_admin' LIMIT 1`,
    [runId, trackingNumber]
  );
  if (existing.rows.length > 0) {
    console.log(
      `[recon engine] DDP admin fee SKIP: tracking=${trackingNumber} ` +
      `— recon line already exists for this run (id=${existing.rows[0].id})`
    );
    return null;
  }

  const iso    = String(countryIso || '').toUpperCase();
  const region = EUROPEAN_ISOS.has(iso) ? 'Europe' : 'ROW';
  const fee    = calcDdpAdminFee(iso, goodsValue);
  const meta   = {
    goods_value:  goodsValue,
    country_iso:  countryIso || null,
    region,
    fee_rule:     region === 'Europe'
      ? 'flat_2.50'
      : `max(12.50, ${goodsValue}*2.5%=${round2(goodsValue * 0.025)})`,
    service_code: serviceCode,
  };

  await insertLine(runId, {
    tracking_number:          trackingNumber,
    carrier_account_no:       null,
    raw_service_code:         serviceCode,
    charge_type:              'base',
    carrier_amount:           0,
    carrier_billed_weight_kg: null,
    service_id:               effectiveServiceId,
    customer_id:              charge.customer_id,
    charge_id:                null,      // populated by finalization service
    expected_amount:          0,
    delta:                    0,
    status:                   'corrected',
    corrected_by:             'ddp_admin',
    unmatched_reason:         null,
    source:                   'ddp_admin',
    shipment_date:            shipmentDate || null,
    corrected_sell_price:     fee,
    corrected_cost_price:     0,
    correction_metadata:      meta,
  });

  console.log(
    `[recon engine] DDP admin fee queued: tracking=${trackingNumber} customer=${charge.customer_id} ` +
    `service=${serviceCode} country=${countryIso} region=${region} ` +
    `goods=£${goodsValue} fee=£${fee} — charge will be created at Finalize Run`
  );

  return fee;
}

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
 * Returns { serviceMap, surchargeMap, serviceIdToCodeMap } for this carrier.
 *
 * serviceMap:       { [RAW_CODE_UPPER]: service_id }   — delivery service mappings
 * surchargeMap:     { [RAW_CODE_UPPER]: surcharge_id } — surcharge mappings
 * serviceIdToCodeMap: { [service_id]: service_code }   — reverse map, used to
 *                     look up the service_code string for corrected sell lookups
 *
 * TWO-LAYER LOOKUP:
 *   Layer 1 — Explicit mappings from courier_service_code_mappings (highest priority)
 *   Layer 2 — Implied mappings derived from courier_services.service_code suffix
 */
async function buildServiceCodeMap(carrierId) {
  const serviceMap         = {};
  const surchargeMap       = {};
  const serviceIdToCodeMap = {};  // id → service_code string

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

    // Always populate reverse map (no priority needed — one code per id)
    serviceIdToCodeMap[row.service_id] = code;
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

  // ── Customer-specific overrides (applied post pool-hit, highest priority) ─
  // When a customer has a per-customer mapping for a courier code (e.g. DDP
  // customers where "Air Express" must route to the DDP-10DDP rate card rather
  // than the standard DPD-10 rate card), the engine applies the override after
  // it knows which customer owns the shipment (from the pool hit).
  // Stored in { [customerId]: { [CODE_UPPER]: service_id } }
  const customerServiceOverrides = {};
  const custMappings = await query(
    `SELECT courier_code, service_id, customer_id::text AS customer_id
     FROM   courier_service_code_mappings
     WHERE  carrier_id = $1 AND is_active = true AND customer_id IS NOT NULL`,
    [carrierId]
  );
  for (const row of custMappings.rows) {
    if (!row.service_id) continue;   // surcharge overrides per-customer not currently supported
    const custId = row.customer_id;
    const key    = row.courier_code.trim().toUpperCase();
    if (!customerServiceOverrides[custId]) customerServiceOverrides[custId] = {};
    customerServiceOverrides[custId][key] = row.service_id;
  }
  if (custMappings.rows.length > 0) {
    console.log(
      `[recon engine] Customer service code overrides for carrier ${carrierId}: ` +
      `${custMappings.rows.length} entries across ${Object.keys(customerServiceOverrides).length} customer(s)`
    );
  }

  const surchargeCount = Object.keys(surchargeMap).length;
  const impliedCount   = Object.keys(serviceMap).length - (explicit.rows.filter(r => r.service_id).length);
  console.log(`[recon engine] Code map for carrier ${carrierId}: ${explicit.rows.length} explicit (${surchargeCount} surcharge) + ${impliedCount} implied service entries`);

  return { serviceMap, surchargeMap, serviceIdToCodeMap, customerServiceOverrides };
}

// ─── Sell-surcharge presence check ───────────────────────────────────────────
//
// When the carrier bills a surcharge (e.g. NI Clearance Charge), we auto-accept
// the cost side. But if the sell-side surcharge charge was never created on the
// shipment (e.g. because the rule was broken at booking time), the customer will
// be under-billed. This function checks whether the sell-side charge exists and
// returns the pool hit (charge row) so the caller can store customer_id / charge_id.
//
// Returns { sellMissing: bool, customerId: string|null, chargeId: string|null }
async function checkSellSurcharge(trackKey, surchargeId, pool) {
  const poolHits = poolLookup(pool, trackKey);
  if (poolHits.length === 0) return { sellMissing: false, customerId: null, chargeId: null };

  const charge      = poolHits[0];
  const shipmentId  = charge.shipment_id;
  const customerId  = charge.customer_id;
  const chargeId    = charge.charge_id;

  const res = await query(
    `SELECT 1 FROM charges
     WHERE  shipment_id = $1
       AND  surcharge_id = $2
       AND  cancelled    = false
     LIMIT 1`,
    [shipmentId, surchargeId]
  );

  const sellMissing = res.rows.length === 0;
  if (sellMissing) {
    console.log(`[recon engine] WARN sell_surcharge_missing: tracking=${trackKey} surcharge=${surchargeId} shipment=${shipmentId}`);
  }
  return { sellMissing, customerId, chargeId };
}

// ─── Corrected sell price helper ──────────────────────────────────────────────
//
// For pool-matched lines where the carrier billed at a different amount than
// expected, recompute the customer sell price at the carrier's billed weight.
// This is what the customer will be charged at finalization.
//
// Returns null if lookup fails (missing zone, missing rate card, etc.).
// In that case the billing preview falls back to the original charges.sell_price
// and finalization skips the write-back for sell.

async function computeCorrectedSell(charge, serviceId, billedWeightKg, parcelCount, serviceIdToCodeMap) {
  if (!charge?.customer_id || !serviceId || !(billedWeightKg > 0)) {
    console.log(`[recon engine] correctedSell SKIP: customer=${charge?.customer_id} serviceId=${serviceId} weight=${billedWeightKg} — missing prerequisite`);
    return null;
  }

  const serviceCode = serviceIdToCodeMap[serviceId];
  if (!serviceCode) {
    console.log(`[recon engine] correctedSell SKIP: serviceId=${serviceId} not in serviceIdToCodeMap (keys: ${Object.keys(serviceIdToCodeMap).join(',')})`);
    return null;
  }

  if (!charge.zone_id) {
    console.log(`[recon engine] correctedSell SKIP: charge ${charge.charge_id} has no zone_id — customer=${charge.customer_id} service=${serviceCode}`);
    return null;
  }

  // Fetch zone name + fallback service code in one round-trip
  const [zoneRes, svcRes] = await Promise.all([
    query(`SELECT name FROM zones WHERE id = $1`, [charge.zone_id]),
    query(
      `SELECT fb.service_code AS rate_fallback_service_code
       FROM   courier_services cs
       LEFT JOIN courier_services fb ON fb.id = cs.rate_fallback_service_id
       WHERE  cs.id = $1`,
      [serviceId]
    ),
  ]);
  if (!zoneRes.rows.length) {
    console.log(`[recon engine] correctedSell SKIP: zone_id=${charge.zone_id} not found in zones table — charge=${charge.charge_id}`);
    return null;
  }
  const zoneName              = zoneRes.rows[0].name;
  const fallbackServiceCode   = svcRes.rows[0]?.rate_fallback_service_code || null;

  // Per-parcel weight for band lookup (multi-parcel DPD: total / N → per-parcel band)
  const n           = Math.max(parseInt(parcelCount) || 1, 1);
  const perParcelKg = n > 1 ? Math.round((billedWeightKg / n) * 1000) / 1000 : billedWeightKg;

  const sellResult = await lookupCustomerSellPrice(charge.customer_id, serviceCode, perParcelKg, zoneName, fallbackServiceCode);
  if (!sellResult) {
    console.log(`[recon engine] correctedSell MISS: no customer_rates row — customer=${charge.customer_id} service="${serviceCode}" zone="${zoneName}" weight=${perParcelKg}kg`);
    return null;
  }

  // For all_sub carriers (DPD): parcel 1 = price_first, parcels 2..N = price_sub each.
  // This matches how billing.js and the finance page compute it at booking time.
  // Single-parcel or non-all_sub: totalSell = sellPrice × n (n=1 in most cases).
  let totalSell;
  if (n > 1 && sellResult.sellSub != null) {
    totalSell = round2(sellResult.sellPrice + sellResult.sellSub * (n - 1));
  } else {
    totalSell = round2(sellResult.sellPrice * n);
  }
  console.log(
    `[recon engine] correctedSell: customer=${charge.customer_id} service=${serviceCode}` +
    `${sellResult.resolvedCode !== serviceCode ? ` (fallback: ${sellResult.resolvedCode})` : ''} ` +
    `zone="${zoneName}" weight=${billedWeightKg}kg (per_parcel=${perParcelKg}kg × ${n}) ` +
    `price_first=£${sellResult.sellPrice} price_sub=${sellResult.sellSub != null ? `£${sellResult.sellSub}` : 'n/a'} ` +
    `→ total_sell=£${totalSell}`
  );
  return totalSell;
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
      s.total_weight_kg        AS declared_weight_kg,
      s.parcel_count           AS shipment_parcel_count,
      s.total_declared_value,
      s.collection_date,
      s.ship_to_postcode,
      cu.reconciliation_flexible_parcel_count,
      cu.account_number AS customer_account,
      c.created_at,
      -- rate_per_parcel: normalised per-parcel base cost regardless of how cost_price was stored.
      -- For charges created with wrong parcel_qty, cost_price = per-parcel rate and
      -- shipment_parcel_count = 1 → rate_per_parcel = cost_price.
      -- For correctly-stored charges, cost_price = total → rate_per_parcel = total / n.
      -- Multiplying rate_per_parcel × invoice_parcel_count gives the correct expected total
      -- for DPD all-sub regardless of which format was stored.
      ROUND(c.cost_price::numeric / GREATEST(COALESCE(s.parcel_count, 1), 1), 4) AS rate_per_parcel,
      -- stored_sell_price: what we booked to charge the customer at booking time.
      -- Used as fallback freightSellPrice for percentage surcharges when
      -- computeCorrectedSell returns null (e.g. missing zone, no rate card row).
      COALESCE(c.sell_price, c.price) AS stored_sell_price,
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
  // Secondary index for carrier-side auto-consolidation: customer + collection date → charge[]
  // Used when DPD bills multiple individually-booked single-parcel shipments under one tracking.
  const customerDatePool = new Map();

  function addToPool(key, row) {
    if (!pool.has(key)) pool.set(key, []);
    const bucket = pool.get(key);
    if (!bucket.find(r => r.charge_id === row.charge_id)) bucket.push(row);
  }

  function addToCustomerDatePool(row) {
    if (!row.customer_id || !row.collection_date) return;
    const dateStr = new Date(row.collection_date).toISOString().slice(0, 10); // YYYY-MM-DD
    const cdKey   = `${row.customer_id}|${dateStr}`;
    if (!customerDatePool.has(cdKey)) customerDatePool.set(cdKey, []);
    const bucket = customerDatePool.get(cdKey);
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

    // ── Index by customer + collection date (carrier auto-consolidation) ──
    addToCustomerDatePool(row);
  }

  const poolSize = pool.size;
  console.log(`[recon engine] Verified pool built: ${poolSize} unique keys from ${res.rows.length} charge records (${customerDatePool.size} customer-date buckets)`);
  if (poolSize === 0) {
    console.warn(`[recon engine] WARNING: pool is EMPTY — carrier name/code may not match shipments.courier, or no verified shipments have dc_service_id/tracking_codes`);
  }

  // ── Cancelled booking pool ──────────────────────────────────────────────────
  // Loads tracking numbers from CANCELLED shipments so the engine can identify
  // the correct customer when DPD invoices a label that was cancelled in the OMS
  // (DPD has no cancellation API — labels can travel even after OMS cancellation).
  // Only tracking keys NOT already in the active pool are added, so active entries
  // always take precedence.
  const cancelledRes = await query(`
    SELECT
      c.id              AS charge_id,
      c.customer_id,
      c.shipment_id,
      COALESCE(
        s.tracking_codes,
        CASE WHEN c.tracking_code IS NOT NULL THEN ARRAY[c.tracking_code] ELSE NULL END
      )                 AS tracking_codes,
      s.ship_to_postcode,
      s.collection_date
    FROM   charges   c
    LEFT JOIN shipments s ON s.id = c.shipment_id
    JOIN      couriers  cu_carrier ON cu_carrier.id = $1
    WHERE  c.cancelled   = true
      AND  c.charge_type = 'courier'
      AND  s.cancelled   = true
      AND (
        LOWER(s.courier) = LOWER(cu_carrier.code)
        OR LOWER(s.courier) = LOWER(cu_carrier.name)
        OR EXISTS (SELECT 1 FROM unnest(cu_carrier.aliases) alias WHERE LOWER(alias) = LOWER(s.courier))
        OR EXISTS (SELECT 1 FROM courier_services cs2 WHERE cs2.id = c.courier_service_id AND cs2.courier_id = $1)
      )
      AND s.tracking_codes IS NOT NULL
      AND array_length(s.tracking_codes, 1) > 0
  `, [carrierId]);

  const cancelledPool = new Map();
  for (const row of cancelledRes.rows) {
    const codes = row.tracking_codes || [];
    for (const code of codes) {
      const key = String(code).trim().toUpperCase();
      // Only add to cancelled pool if NOT already in the active pool
      if (!pool.has(key)) {
        if (!cancelledPool.has(key)) cancelledPool.set(key, []);
        const bucket = cancelledPool.get(key);
        if (!bucket.find(r => r.charge_id === row.charge_id)) bucket.push(row);
      }
    }
  }
  console.log(`[recon engine] Cancelled booking pool built: ${cancelledPool.size} unique keys from ${cancelledRes.rows.length} cancelled charge records`);

  return { pool, poolSize, customerDatePool, cancelledPool };
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

  // Sell: price_first for parcel 1 + price_sub for parcels 2..N (all_sub carriers).
  // Mirrors how billing.js computes sell at booking time.
  // IMPORTANT: never fall back to cost price when no customer rate exists — instead
  // set sell = null so the charge is flagged as pricing_error and the recon line
  // is marked unmatched/no_rate for operator review.
  const hasSellRate    = pricing.sell_price != null;
  const baseSellFirst  = pricing.sell_price;   // null when no customer_rates row
  const totalSellPrice = hasSellRate
    ? ((isAllSub && parcelCount > 1 && pricing.sell_sub != null)
        ? round2(baseSellFirst + pricing.sell_sub * (parcelCount - 1))
        : round2(baseSellFirst * parcelCount))
    : null;  // null → charge flagged pricing_error; recon line → unmatched/no_rate

  // ── Full diagnostic trace ─────────────────────────────────────────────────
  console.log(
    `[carrier-direct] TRACE tracking=${trackingNumber} ` +
    `| items=${parcelCount} | weight=${kg}kg (per_parcel=${perParcelKg}kg) ` +
    `| zone_id=${pricing.zone_id} zone="${pricing.zone_name}" band="${pricing.band_label}" ` +
    `| price_first=£${pricing.cost_price} price_sub=£${pricing.cost_sub ?? 'n/a'} ` +
    `| per_parcel_rate=£${perParcelRate} (${isAllSub && parcelCount > 1 ? 'all_sub → price_sub' : 'price_first'}) ` +
    `| total_cost=£${totalCostPrice} carrier=£${carrierAmount}`
  );

  // ── Create a proper shipment record from invoice data ────────────────────
  // Carrier-direct charges represent real shipments booked outside the OMS.
  // We create a full shipment row so Finance shows name, postcode, reference,
  // and tracking — identical to any webhook-created shipment.
  // We look up by tracking_codes rather than platform_shipment_id because
  // platform_shipment_id is a BIGINT column and cannot hold text keys.
  let cdShipmentId = null;
  try {
    // Check if a carrier_direct shipment already exists for this tracking
    const existingShip = await query(
      `SELECT id FROM shipments
       WHERE  $1 = ANY(tracking_codes)
         AND  event_type = 'carrier_direct'
       LIMIT  1`,
      [trackingNumber]
    );
    if (existingShip.rows.length) {
      cdShipmentId = existingShip.rows[0].id;
      console.log(`[carrier-direct] reused existing shipment id=${cdShipmentId} for tracking=${trackingNumber}`);
    } else {
      const cdShipRes = await query(`
        INSERT INTO shipments (
          event_type,
          customer_id, courier, service_name,
          reference, parcel_count, tracking_codes,
          ship_to_name, ship_to_postcode, ship_to_country_iso,
          collection_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        'carrier_direct',
        customer.customer_id,
        'DPD',
        rawServiceCode        || null,
        line.sender_ref       || null,
        parcelCount > 1 ? parcelCount : null,
        [trackingNumber],
        line.recipient_name   || null,
        postcode              || null,
        countryIso            || 'GB',
        line.shipment_date    || null,
      ]);
      cdShipmentId = cdShipRes.rows[0]?.id || null;
      console.log(`[carrier-direct] created shipment id=${cdShipmentId} for tracking=${trackingNumber}`);
    }
  } catch (shipErr) {
    // Non-fatal — charge can be created without a shipment row.
    console.warn(`[carrier-direct] shipment insert failed for ${trackingNumber}: ${shipErr.message} — continuing without shipment record`);
  }

  // ── Insert the carrier-direct charge ─────────────────────────────────────
  // - charge_type = 'courier' so it appears in Finance and pool on next runs.
  // - verified = true so it passes buildVerifiedPool's gate.
  // - source = 'carrier_direct' — filterable in Finance table.
  const newCharges = await insertCharges([{
    customer_id:         customer.customer_id,
    voila_shipment_id:   null,
    order_id:            line.sender_ref    || null,  // customer's order reference
    tracking_code:       trackingNumber,
    courier_service_id:  serviceId,
    zone_id:             pricing.zone_id,
    charge_type:         'courier',
    weight_charged_kg:   kg,
    cost_price:          totalCostPrice,
    sell_price:          totalSellPrice,          // null when no customer rate → pricing_error
    status:              hasSellRate ? 'verified' : 'pricing_error',
    ship_to_postcode:    postcode              || null,
    ship_to_country_iso: countryIso           || null,
    ship_to_name:        line.recipient_name  || null,
    shipment_id:         cdShipmentId,
    source:              'carrier_direct',
    raw_payload:         JSON.stringify({
      carrier_direct: true, run_id: runId,
      parcel_count: parcelCount, per_parcel_rate: perParcelRate,
      zone_id: pricing.zone_id, zone_name: pricing.zone_name,
      band_label: pricing.band_label,
      rate_basis: isAllSub && parcelCount > 1 ? 'price_sub' : 'price_first',
    }),
  }], cdShipmentId);

  // insertCharges uses ON CONFLICT DO NOTHING — if a carrier_direct charge was
  // already created for this tracking number in a prior run, the INSERT returns
  // 0 rows. Look up the existing charge so charge_id is always linked correctly.
  let insertedId = newCharges[0]?.id || null;
  if (!insertedId) {
    const existing = await query(
      `SELECT id FROM charges
       WHERE  tracking_code       = $1
         AND  courier_service_id  = $2
         AND  source              = 'carrier_direct'
         AND  cancelled           = false
       ORDER  BY created_at DESC
       LIMIT  1`,
      [trackingNumber, serviceId]
    );
    insertedId = existing.rows[0]?.id || null;
    if (insertedId) {
      console.log(`[carrier-direct] reused existing charge id=${insertedId} for tracking=${trackingNumber}`);
    }
  }

  const cdParcels  = parcelCount > 1 ? parcelCount : 1;
  const rollup     = await buildSurchargeRollup(
    line.surcharge_amounts, ctx.surchargeById, carrierAmount, cdParcels, ctx.globallyExcludedColumns,
    customer.customer_id, ctx.costOverrideCache, serviceId
  );
  const totalCarrierFull = round2(carrierAmount + rollup.addCarrierAmt);

  // ── Carrier-Direct surcharge pass-through ─────────────────────────────────
  // For pool-hit lines, surcharges with cost_price=0 (e.g. Insurance Liability)
  // are zero because the base cost_price already includes that premium.
  // For carrier_direct lines, the ghost rate is the standard (non-insurance) rate,
  // so cost_price=0 surcharges that DPD DID bill (carrier_amt > 0) represent
  // legitimate costs that were NOT in the ghost rate.  Absorb them into expected
  // so the line doesn't flag a spurious overage.
  let passThrough = 0;
  for (const item of rollup.items) {
    if (item.expectedCost === 0 && item.carrierAmt > 0) {
      passThrough = round2(passThrough + item.carrierAmt);
      console.log(
        `[carrier-direct] pass-through surcharge "${item.name}" ` +
        `carrier_amt=£${item.carrierAmt} absorbed into expected (cost_price=0)`
      );
    }
  }
  const totalExpectedFull = round2(totalCostPrice + rollup.addExpectedCost + passThrough);
  const delta   = round2(totalCarrierFull - totalExpectedFull);
  const isMatch = Math.abs(delta) < 0.02;

  // (trace log moved below, after cdStatus is computed)

  let cdMeta = null;
  if (!isMatch) {
    const rawCols = (line.raw_col_values && Object.keys(line.raw_col_values).length > 0) ? line.raw_col_values : null;
    if (rawCols) cdMeta = { raw_col_values: rawCols };
  }
  const addSell   = hasSellRate
    ? await resolveSurchargeSells(rollup.items, totalSellPrice, cdParcels, ctx.surchargeOverrideCache, customer.customer_id, serviceId)
    : 0;
  const finalSell = hasSellRate ? round2(totalSellPrice + addSell) : null;
  const sMeta     = surchargeMeta(rollup.items);
  const combinedMeta = (cdMeta || sMeta) ? { ...cdMeta, ...sMeta } : null;

  // When no customer rate exists: flag unmatched/no_rate so the operator knows
  // a rate card entry is missing.  The ghost charge is created as pricing_error
  // so it is visible in Finance but not invoiced at cost.
  const cdStatus      = !hasSellRate ? 'unmatched' : (isMatch ? 'matched' : 'corrected');
  const cdCorrectedBy = !hasSellRate ? null        : (isMatch ? null       : 'carrier_direct');
  const cdReason      = !hasSellRate ? 'no_rate'   : null;

  console.log(
    `[carrier-direct] charge id=${insertedId}: ` +
    `expected=£${totalExpectedFull} carrier=£${totalCarrierFull} delta=£${delta} sell=${finalSell != null ? `£${finalSell}` : 'NO_RATE'} → ${cdStatus}`
  );

  await insertLine(runId, {
    tracking_number:          trackingNumber,
    carrier_account_no:       line.account_number    || null,
    raw_service_code:         rawServiceCode,
    charge_type:              line.charge_type       || 'base',
    carrier_amount:           totalCarrierFull,
    carrier_billed_weight_kg: kg,
    service_id:               serviceId,
    customer_id:              customer.customer_id,
    charge_id:                insertedId,
    expected_amount:          totalExpectedFull,
    delta,
    status:                   cdStatus,
    corrected_by:             cdCorrectedBy,
    unmatched_reason:         cdReason,
    source:                   'carrier_direct',
    shipment_date:            line.shipment_date     || null,
    ship_to_postcode:         postcode               || null,
    ship_to_country:          countryIso             || 'GB',
    parcel_count:             parcelCount > 1 ? parcelCount : null,
    correction_metadata:      combinedMeta,
    corrected_sell_price:     finalSell,
    corrected_cost_price:     totalCarrierFull,
  });

  return { status: cdStatus };
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
  const { serviceMap: serviceCodeMap, surchargeMap, serviceIdToCodeMap, customerServiceOverrides } = await buildServiceCodeMap(carrierId);

  // ── Pre-condition: Build Verified Pool ────────────────────────────────────
  const { pool, poolSize, customerDatePool, cancelledPool } = await buildVerifiedPool(carrierId);

  await query(
    `UPDATE reconciliation_runs SET pool_size = $2 WHERE id = $1`,
    [runId, poolSize]
  );

  // ── Phase 4a: Load Mapping Engine rules ───────────────────────────────────
  const mappings = await loadMappings(carrierId);

  // ── Load surcharge definitions for CSV-column surcharge line production ───
  const surchargeById = await loadCarrierSurcharges(carrierId);

  // ── Load globally excluded CSV column names ───────────────────────────────
  // If ANY carrier has a surcharge with reconciliation_excluded=true for a given
  // csv_column, that column is excluded on ALL carriers. This means you only need
  // to flag e.g. "Carriage" on DPD's surcharge definition — Europa (and any other
  // carrier billing a "Carriage" CSV column) will also exclude it automatically.
  const globalExclRes = await query(
    `SELECT DISTINCT csv_column
     FROM   surcharges
     WHERE  reconciliation_excluded = true AND csv_column IS NOT NULL AND csv_column <> ''`
  );
  const globallyExcludedColumns = new Set(globalExclRes.rows.map(r => r.csv_column.trim().toLowerCase()));
  if (globallyExcludedColumns.size > 0) {
    console.log(`[recon engine] Globally excluded CSV columns: ${[...globallyExcludedColumns].join(', ')}`);
  }

  // ── Run-scoped caches ──────────────────────────────────────────────────────
  const _custCache    = new Map();
  // surcharge override cache: `${customerId}:${surchargeId}` → sell price (number|null)
  const _surchargeOverrideCache = new Map();
  // cost override cache: `${customerId}:${surchargeId}` → cost price (number|null)
  const _costOverrideCache = new Map();
  // Set of all tracking numbers present in the carrier invoice (UPPER).
  // Used by auto-consolidation to avoid treating a tracking that has its own
  // carrier invoice line as an "unaccounted companion" for another line.
  const allInvoiceTrackings = new Set(
    lines.map(l => String(l.tracking_number || '').trim().toUpperCase()).filter(Boolean)
  );
  const ctx = {
    separateFuelRows,
    parcelPricing,
    serviceIdToCodeMap,
    customerServiceOverrides,
    surchargeById,
    globallyExcludedColumns,
    surchargeOverrideCache: _surchargeOverrideCache,
    costOverrideCache:      _costOverrideCache,
    customerDatePool,
    cancelledPool,
    allInvoiceTrackings,
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
    // Strip trailing '*' — DPD appends it to international tracking numbers in their
    // invoice CSV as an indicator flag; it is NOT part of the actual tracking number
    // stored in the OMS, so pool lookups would fail without normalising it away.
    const rawKey = String(line.tracking_number).trim().toUpperCase();
    const key    = rawKey.replace(/\*+$/, '');
    if (key !== rawKey) line.tracking_number = line.tracking_number.replace(/\*+$/, '');
    if (!trackingGroups.has(key)) trackingGroups.set(key, []);
    trackingGroups.get(key).push(line);
  }

  const multiParcelGroups = [...trackingGroups.values()].filter(g => g.length > 1);
  if (multiParcelGroups.length > 0) {
    console.log(`[recon engine] Run ${runId}: ${multiParcelGroups.length} multi-parcel tracking group(s) detected`);
  }

  // Counters
  let matched = 0, corrected = 0, unmatched = 0, ignored = 0, warnings = 0;

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

    for (let gi = 0; gi < results.length; gi++) {
      const res                  = results[gi];
      const [trackKey, group]    = batch[gi];
      if (res.status === 'fulfilled') {
        for (const r of res.value) {
          switch (r.status) {
            case 'matched':   matched++;   break;
            case 'corrected': corrected++; break;
            case 'unmatched': unmatched++; break;
            case 'warning':   warnings++;  break;
            case 'ignored':   ignored++;   break;
          }
        }
      } else {
        // Processing error — ensure every line in the group gets a DB row so
        // total_lines always equals actual inserted rows.  An unrecovered group
        // error (null-deref, DB failure, etc.) must never silently drop lines.
        console.error(
          `[recon engine] Run ${runId}: group processing error for tracking=${trackKey}:`,
          res.reason?.message, res.reason?.stack?.split('\n')[1]?.trim()
        );
        for (const line of group) {
          try {
            await insertLine(runId, {
              tracking_number:     String(line.tracking_number || '').trim(),
              carrier_account_no:  line.account_number || null,
              raw_service_code:    line.service_code   || null,
              charge_type:         line.charge_type    || 'base',
              carrier_amount:      round2(parseFloat(line.carrier_amount) || 0),
              service_id:          null,
              customer_id:         null,
              charge_id:           null,
              expected_amount:     null,
              delta:               null,
              status:              'unmatched',
              corrected_by:        null,
              unmatched_reason:    'processing_error',
              source:              'internal',
            });
          } catch (insertErr) {
            console.error(`[recon engine] Run ${runId}: failed to insert error fallback for ${line.tracking_number}:`, insertErr.message);
          }
          unmatched++;
        }
      }
    }
  }

  // ── Pre-tag: refresh live tracking for cancelled shipment candidates ─────
  // Before deciding shipped vs. unshipped, pull fresh tracking events from
  // Voila for any cancelled shipments that are candidates for tagging. This
  // catches parcels that DPD collected despite an OMS cancellation — their
  // scan events may not have arrived via webhook if the shipment was cancelled
  // before DPD's first update, so we fetch explicitly here.
  try {
    const { rows: cancelledCandidates } = await query(`
      SELECT DISTINCT
        s.id                            AS shipment_id,
        s.voila_tracking_request_id     AS track_req_id,
        s.voila_tracking_request_hash   AS track_req_hash,
        s.courier,
        rl.tracking_number
      FROM   reconciliation_lines rl
      JOIN   shipments s ON s.tracking_codes @> ARRAY[rl.tracking_number::text]
                       AND s.cancelled = true
                       AND s.voila_tracking_request_id   IS NOT NULL
                       AND s.voila_tracking_request_hash IS NOT NULL
      WHERE  rl.run_id           = $1
        AND  rl.status           = 'unmatched'
        AND  rl.unmatched_reason IN ('no_account_mapping', 'cancelled_booking_invoiced')
    `, [runId]);

    for (const cand of cancelledCandidates) {
      try {
        const trackingData = await requestTrackingUpdate(cand.track_req_id, cand.track_req_hash);
        const parcels = trackingData?.data?.parcels;
        if (!Array.isArray(parcels) || !parcels.length) continue;

        const syntheticPayload = {
          tracking_update: {
            parcels,
            expected_delivery: trackingData.data.expected_delivery || null,
          },
          shipment: { id: String(cand.shipment_id), courier: cand.courier || null },
        };
        const events = normalisePayload(syntheticPayload);
        for (const ev of events) {
          await upsertEvent(ev, null);
        }
        console.log(`[recon engine] Refreshed tracking for cancelled shipment tracking=${cand.tracking_number}`);
      } catch (trackErr) {
        console.warn(`[recon engine] Tracking refresh failed for ${cand.tracking_number}: ${trackErr.message}`);
      }
    }
  } catch (err) {
    console.error(`[recon engine] Cancelled tracking refresh error: ${err.message}`);
  }

  // ── Post-process: tag cancelled-shipment lines ───────────────────────────
  // Carrier invoice lines that match a cancelled OMS shipment need to be split
  // into two categories so operators know what action to take:
  //   cancelled_shipped   → parcel was actually collected by DPD despite the
  //                         OMS cancellation; we should bill the customer.
  //   cancelled_unshipped → DPD never physically scanned the parcel; we
  //                         should dispute the charge with the carrier.
  //
  // Source lines: both 'no_account_mapping' (cancelled charge not in pool)
  // and 'cancelled_booking_invoiced' (matched directly via cancelled pool).
  //
  // "Was shipped" is determined by tracking_events — any scan event with a
  // status other than 'booked' proves DPD physically handled the parcel.
  // A 'booked' event is just label creation and does not confirm collection.
  try {
    const cancelledTagRes = await query(`
      WITH target_lines AS (
        SELECT rl.id, rl.tracking_number
        FROM   reconciliation_lines rl
        WHERE  rl.run_id           = $1
          AND  rl.status           = 'unmatched'
          AND  rl.unmatched_reason IN ('no_account_mapping', 'cancelled_booking_invoiced')
      ),
      cancelled_matches AS (
        SELECT DISTINCT ON (ul.id) ul.id AS line_id,
               -- Any tracking event beyond 'booked' means DPD physically
               -- handled the parcel (at_depot, in_transit, delivered, etc.)
               EXISTS (
                 SELECT 1 FROM tracking_events te
                 WHERE  te.consignment_number = ul.tracking_number
                   AND  te.status NOT IN ('booked', 'unknown')
               ) AS was_shipped
        FROM   target_lines ul
        JOIN   shipments s ON s.tracking_codes @> ARRAY[ul.tracking_number::text]
                          AND s.cancelled = true
      )
      UPDATE reconciliation_lines rl
      SET    unmatched_reason = CASE
               WHEN cm.was_shipped THEN 'cancelled_shipped'
               ELSE                     'cancelled_unshipped'
             END
      FROM   cancelled_matches cm
      WHERE  rl.id = cm.line_id
    `, [runId]);
    if (cancelledTagRes.rowCount > 0) {
      console.log(`[recon engine] Run ${runId}: tagged ${cancelledTagRes.rowCount} line(s) as cancelled_shipped/cancelled_unshipped`);
    }
  } catch (err) {
    console.error(`[recon engine] Run ${runId}: cancelled-shipment tagging failed:`, err.message);
  }

  // ── Post-process: price cancelled_shipped lines from the cancelled charge ─
  // A cancelled_shipped line means DPD collected the parcel despite the OMS
  // cancellation — we should bill the customer for it. The cancelled charge
  // already holds cost_price (what we pay DPD) and sell_price/price (what
  // we charge the customer). Use these to populate expected_amount and
  // corrected_sell_price so the line moves out of unmatched into
  // matched (if carrier == expected) or corrected (if there's a delta).
  try {
    const shippedRes = await query(`
      WITH shipped_lines AS (
        SELECT rl.id, rl.tracking_number, rl.carrier_amount
        FROM   reconciliation_lines rl
        WHERE  rl.run_id           = $1
          AND  rl.status           = 'unmatched'
          AND  rl.unmatched_reason = 'cancelled_shipped'
      ),
      charge_data AS (
        SELECT DISTINCT ON (sl.id)
          sl.id             AS line_id,
          sl.carrier_amount,
          c.id              AS charge_id,
          c.cost_price,
          COALESCE(c.sell_price, c.price) AS sell_price
        FROM   shipped_lines sl
        JOIN   shipments s  ON s.tracking_codes @> ARRAY[sl.tracking_number::text]
                           AND s.cancelled = true
        JOIN   charges c    ON c.shipment_id = s.id
                           AND c.charge_type = 'courier'
        ORDER  BY sl.id, c.created_at DESC
      )
      UPDATE reconciliation_lines rl
      SET    expected_amount      = cd.cost_price,
             delta                = ROUND((cd.carrier_amount - cd.cost_price)::numeric, 2),
             status               = CASE
               WHEN ABS(cd.carrier_amount - cd.cost_price) < 0.02 THEN 'matched'
               ELSE 'corrected'
             END,
             corrected_by         = 'cancelled_shipped',
             corrected_sell_price = cd.sell_price,
             charge_id            = cd.charge_id,
             unmatched_reason     = NULL
      FROM   charge_data cd
      WHERE  rl.id = cd.line_id
      RETURNING rl.tracking_number, rl.status, rl.expected_amount, rl.corrected_sell_price
    `, [runId]);
    if (shippedRes.rowCount > 0) {
      console.log(`[recon engine] Run ${runId}: priced ${shippedRes.rowCount} cancelled_shipped line(s) from cancelled charges`);
      shippedRes.rows.forEach(r =>
        console.log(`  tracking=${r.tracking_number} status=${r.status} expected=£${r.expected_amount} sell=£${r.corrected_sell_price}`)
      );
    }
  } catch (err) {
    console.error(`[recon engine] Run ${runId}: cancelled_shipped pricing failed:`, err.message);
  }

  // ── Finalise run — derive counts from actual DB rows ─────────────────────
  // Use subqueries against reconciliation_lines rather than in-memory counters.
  // With the rollup architecture there are no separate surcharge rows — each
  // shipment produces exactly one reconciliation_line, so all rows count equally.
  const finalRes = await query(`
    UPDATE reconciliation_runs rr
    SET matched_count   = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = $1 AND status = 'matched'),
        corrected_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = $1 AND status = 'corrected'),
        unmatched_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = $1 AND status = 'unmatched'),
        warning_count   = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = $1 AND status = 'warning'),
        ignored_count   = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = $1 AND status = 'ignored'),
        automation_rate = CASE WHEN rr.total_lines > 0 THEN
          ROUND(
            (SELECT COUNT(*)::numeric FROM reconciliation_lines WHERE run_id = $1 AND status IN ('matched','corrected','warning') AND source != 'ddp_admin')
            / rr.total_lines * 100, 2
          )
        ELSE 0 END,
        status          = CASE
          WHEN (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = $1 AND status IN ('unmatched','warning')) > 0
          THEN 'needs_review' ELSE 'complete' END,
        completed_at    = NOW()
    WHERE  rr.id = $1
    RETURNING matched_count, corrected_count, unmatched_count, warning_count, ignored_count, automation_rate, status
  `, [runId]);

  const fin = finalRes.rows[0] || {};
  const dbMatched    = parseInt(fin.matched_count)   || 0;
  const dbCorrected  = parseInt(fin.corrected_count) || 0;
  const dbUnmatched  = parseInt(fin.unmatched_count) || 0;
  const dbWarnings   = parseInt(fin.warning_count)   || 0;
  const dbIgnored    = parseInt(fin.ignored_count)   || 0;
  const overallStatus = fin.status || ((dbUnmatched + dbWarnings) > 0 ? 'needs_review' : 'complete');
  const automationRate = parseFloat(fin.automation_rate) || 0;

  console.log(`[recon engine] Run ${runId} complete in ${Date.now() - startTime}ms — ` +
    `${dbMatched} matched, ${dbCorrected} corrected, ${dbUnmatched} unmatched, ${dbWarnings} warnings, ${dbIgnored} ignored, ` +
    `${skippedCount} aggregate skipped, automation: ${automationRate}% (in-memory: ${matched}m/${corrected}c/${unmatched}u/${warnings}w)`);

  return {
    run_id:          runId,
    status:          overallStatus,
    total:           reconcilableLines.length,
    matched:         dbMatched,
    corrected:       dbCorrected,
    unmatched:       dbUnmatched,
    warnings:        dbWarnings,
    ignored:         dbIgnored,
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

/**
 * Load all active surcharges for a carrier into a map keyed by surcharge UUID.
 * Used to resolve cost_price and default_value (sell) for CSV-column surcharge lines.
 */
async function loadCarrierSurcharges(carrierId) {
  const res = await query(
    `SELECT id, code, name, cost_price, default_value, calc_type, charge_per, csv_column, reconciliation_excluded
     FROM   surcharges
     WHERE  courier_id = $1 AND active = true`,
    [carrierId]
  );
  const byId = {};
  for (const row of res.rows) byId[row.id] = row;
  console.log(`[recon engine] Loaded ${res.rows.length} surcharge definition(s) for carrier ${carrierId}`);
  return byId;
}

// ─── Surcharge Rollup ─────────────────────────────────────────────────────────
// One shipment = one reconciliation line.
// Surcharge amounts are rolled into the freight line totals rather than
// producing separate rows.  buildSurchargeRollup computes carrier
// amounts and expected costs; resolveSurchargeSells (async) adds sell prices
// once the freight sell is known.

/**
 * @param {Object}      surchargeAmounts   { [surcharge_id]: amount }
 * @param {Object}      surchargeById      preloaded map
 * @param {number}      freightCarrierAmt  carrier's freight-only amount (percentage base)
 * @param {number}      invoiceParcels     for per-parcel flat surcharges
 * @param {Set}         globallyExcludedColumns
 * @returns {{ addCarrierAmt, addExpectedCost, items }}
 */
async function buildSurchargeRollup(surchargeAmounts, surchargeById, freightCarrierAmt, invoiceParcels, globallyExcludedColumns, customerId = null, costOverrideCache = null, serviceId = null) {
  if (!surchargeAmounts || !Object.keys(surchargeAmounts).length) {
    return { addCarrierAmt: 0, addExpectedCost: 0, items: [] };
  }

  const items = [];
  for (const [surchargeId, rawAmount] of Object.entries(surchargeAmounts)) {
    const surcharge = surchargeById[surchargeId];
    if (!surcharge) {
      console.warn(`[recon engine] surcharge_amounts has id ${surchargeId} but no matching surcharge definition — skipping`);
      continue;
    }
    const colKey     = (surcharge.csv_column || '').trim().toLowerCase();
    const isAbsorbed = surcharge.reconciliation_excluded || (colKey && globallyExcludedColumns.has(colKey));
    const carrierAmt = round2(parseFloat(rawAmount) || 0);
    if (carrierAmt <= 0) continue;
    items.push({ surchargeId, surcharge, carrierAmt, isAbsorbed });
  }

  const addCarrierAmt = round2(items.reduce((s, i) => s + i.carrierAmt, 0));

  let addExpectedCost = 0;
  for (const item of items) {
    const { surcharge, surchargeId, carrierAmt, isAbsorbed } = item;
    if (isAbsorbed) {
      item.expectedCost = carrierAmt;
    } else {
      const isPercent = surcharge.calc_type === 'percentage';
      const perParcel  = surcharge.charge_per === 'parcel';
      let costRate     = parseFloat(surcharge.cost_price) || 0;
      // Apply per-customer cost override if provided
      if (customerId && costOverrideCache) {
        const cacheKey = `${customerId}:${surchargeId}`;
        let overrideCost;
        if (costOverrideCache.has(cacheKey)) {
          overrideCost = costOverrideCache.get(cacheKey);
        } else {
          const ovRes = await query(
            `SELECT cost_price_override FROM customer_surcharge_overrides
             WHERE  surcharge_id = $1 AND customer_id = $2 AND active = true LIMIT 1`,
            [surchargeId, customerId]
          );
          overrideCost = ovRes.rows[0]?.cost_price_override ?? null;
          costOverrideCache.set(cacheKey, overrideCost !== null ? parseFloat(overrideCost) : null);
        }
        if (overrideCost !== null) {
          costRate = overrideCost;
        }
      }
      if (isPercent && freightCarrierAmt > 0) {
        // For percentage-based surcharges (fuel), use the service's fuel group rate
        // (fuel_groups.fuel_surcharge_pct) rather than the flat surcharge cost_price,
        // so international services (18%) don't inherit the domestic rate (3.72%).
        if (serviceId) {
          const fgCostRes = await query(
            `SELECT fg.fuel_surcharge_pct AS cost_pct
             FROM   courier_services cs
             JOIN   fuel_groups fg ON fg.id = cs.fuel_group_id
             WHERE  cs.id = $1 LIMIT 1`,
            [serviceId]
          );
          if (fgCostRes.rows[0]?.cost_pct != null) {
            const fgPct = parseFloat(fgCostRes.rows[0].cost_pct);
            if (fgPct > 0) costRate = fgPct;
          }
        }
        const otherTotal = items.filter(i => i.surchargeId !== surchargeId).reduce((s, i) => s + i.carrierAmt, 0);
        item.expectedCost = round2((freightCarrierAmt + otherTotal) * costRate / 100);
      } else {
        // For flat-rate surcharges: if the carrier charged an exact multiple of our
        // cost rate, trust the carrier's implied count rather than our static
        // charge_per definition.  This handles post-booking surcharges like OOG where
        // DPD applies the charge per affected parcel but our surcharge record has
        // charge_per='shipment' (meaning we expected it once).
        // e.g. OOG cost_price=£6, carrier charged £12 → implied count 2 → expectedCost = £12
        const staticExpected = round2(costRate * (perParcel ? invoiceParcels : 1));
        if (costRate > 0 && carrierAmt > 0) {
          const impliedCount = Math.round(carrierAmt / costRate);
          const remainder    = Math.abs(carrierAmt - round2(impliedCount * costRate));
          item.expectedCost  = remainder < 0.02 ? carrierAmt : staticExpected;
        } else {
          item.expectedCost = staticExpected;
        }
      }
    }
    addExpectedCost += item.expectedCost;
  }

  return { addCarrierAmt, addExpectedCost: round2(addExpectedCost), items };
}

/**
 * Resolve sell prices for rollup items (async — DB lookups for fuel group + overrides).
 * Mutates item.sellPrice in place and returns the total sell addition.
 */
async function resolveSurchargeSells(items, freightSellPrice, invoiceParcels, overrideCache, customerId, serviceId) {
  if (!items.length) return 0;
  let addSellAmt = 0;
  for (const item of items) {
    if (item.isAbsorbed) { item.sellPrice = 0; continue; }
    const { surcharge, surchargeId } = item;
    const isPercent = surcharge.calc_type === 'percentage';
    const perParcel  = surcharge.charge_per === 'parcel';

    let rawDefault = parseFloat(surcharge.default_value) || 0;
    if (isPercent && serviceId) {
      const fgRes = await query(
        `SELECT COALESCE(cfgp.sell_pct, fg.standard_sell_pct) AS sell_pct
         FROM   courier_services cs
         JOIN   fuel_groups fg ON fg.id = cs.fuel_group_id
         LEFT JOIN customer_fuel_group_pricing cfgp
                   ON cfgp.fuel_group_id = fg.id AND cfgp.customer_id = $2
         WHERE  cs.id = $1`,
        [serviceId, customerId]
      );
      if (fgRes.rows[0]?.sell_pct != null) {
        const fp = parseFloat(fgRes.rows[0].sell_pct);
        if (fp > 0) rawDefault = fp;
      }
    }

    let sellPrice = isPercent && freightSellPrice != null && freightSellPrice > 0
      ? round2(freightSellPrice * rawDefault / 100)
      : round2(rawDefault * (perParcel ? invoiceParcels : 1));

    if (customerId) {
      const cacheKey = `${customerId}:${surchargeId}`;
      if (overrideCache.has(cacheKey)) {
        const cached = overrideCache.get(cacheKey);
        if (cached !== null) {
          sellPrice = isPercent && freightSellPrice != null && freightSellPrice > 0
            ? round2(freightSellPrice * cached / 100)
            : round2(cached * (perParcel ? invoiceParcels : 1));
        }
      } else {
        const ovRes = await query(
          `SELECT override_value FROM customer_surcharge_overrides
           WHERE  surcharge_id = $1 AND customer_id = $2 AND active = true LIMIT 1`,
          [surchargeId, customerId]
        );
        const ov = ovRes.rows[0]?.override_value ?? null;
        overrideCache.set(cacheKey, ov !== null ? parseFloat(ov) : null);
        if (ov !== null) {
          const pct = parseFloat(ov);
          sellPrice = isPercent && freightSellPrice != null && freightSellPrice > 0
            ? round2(freightSellPrice * pct / 100)
            : round2(pct * (perParcel ? invoiceParcels : 1));
        }
      }
    }

    item.sellPrice = sellPrice;
    addSellAmt += sellPrice;
    console.log(`[recon engine] Surcharge rollup: "${surcharge.name}" carrier=£${item.carrierAmt} expected=£${item.expectedCost} sell=£${sellPrice}`);
  }
  return round2(addSellAmt);
}

/** Build correction_metadata surcharge block from rollup items. */
function surchargeMeta(items) {
  if (!items.length) return null;
  return {
    surcharges: items.map(i => ({
      name:          i.surcharge.name,
      csv_column:    i.surcharge.csv_column || null,
      carrier_amt:   i.carrierAmt,
      expected_cost: i.expectedCost,
      sell_price:    i.sellPrice ?? null,
      absorbed:      i.isAbsorbed,
    })),
  };
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
    const rawCode    = String(line.service_code || '').trim();
    const lineTrack  = String(line.tracking_number || '').trim();
    const surchargeId = surchargeMap[rawCode.toUpperCase()];
    console.log(`[recon engine] Raw code "${rawCode}" (mixed group, tracking=${lineTrack}) — matched surcharge, auto-correcting`);

    const { sellMissing, customerId, chargeId } = await checkSellSurcharge(lineTrack.toUpperCase(), surchargeId, pool);

    await insertLine(runId, {
      tracking_number:          lineTrack,
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawCode,
      charge_type:              line.charge_type || 'surcharge',
      carrier_amount:           round2(parseFloat(line.carrier_amount) || 0),
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               null,
      customer_id:              customerId || null,
      charge_id:                chargeId   || null,
      expected_amount:          null,
      delta:                    null,
      status:                   sellMissing ? 'warning' : 'corrected',
      corrected_by:             'surcharge_mapping',
      unmatched_reason:         sellMissing ? 'sell_surcharge_missing' : null,
      surcharge_id:             surchargeId || null,
      source:                   'internal',
      suggested_service_id:     null,
    });
    results.push({ status: sellMissing ? 'warning' : 'corrected' });
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

  // Customer-specific service code override for multi-parcel groups.
  const grpCustOverride    = ctx.customerServiceOverrides?.[String(charge.customer_id)]?.[mappedKey];
  const grpEffServiceId    = grpCustOverride ?? serviceId;
  if (grpCustOverride) {
    console.log(
      `[recon engine] multi-parcel customer override: customer=${charge.customer_id} ` +
      `code="${mappedKey}" → svc=${grpEffServiceId}`
    );
  }

  // ── DDP clearance admin fee (per consignment, idempotent) ─────────────────
  // Stores a reconciliation line only — actual charge is created at Finalize Run.
  await insertDdpAdminReconLine(
    runId, trackKey, charge, grpEffServiceId,
    firstLine.ship_to_country, firstLine.shipment_date, ctx.serviceIdToCodeMap
  );

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
  const expectedBase      = round2(parseFloat(charge.total_cost_price) || 0);
  const groupSurchargeMap = Object.fromEntries(
    sumGroupColumnSurcharges(group).breakdown.map(({ surcharge_id, amount }) => [surcharge_id, amount])
  );
  const groupParcels = freightLines.reduce((s, l) => s + (parseInt(l.parcel_count) || 1), 0);
  const rollup       = await buildSurchargeRollup(
    groupSurchargeMap, ctx.surchargeById, totalCarrierAmount, groupParcels, ctx.globallyExcludedColumns,
    charge.customer_id, ctx.costOverrideCache, serviceId
  );
  const totalCarrierFull  = round2(totalCarrierAmount + rollup.addCarrierAmt);
  const totalExpectedFull = round2(expectedBase        + rollup.addExpectedCost);
  const delta             = round2(totalCarrierFull    - totalExpectedFull);

  firstLine._expected_amount = totalExpectedFull;

  let groupStatus     = 'unmatched';
  let correctedBy     = null;
  let mappingId       = null;
  let unmatchedReason = null;

  if (Math.abs(delta) < 0.02) {
    groupStatus = 'matched';
  } else if (delta < -0.02) {
    groupStatus = 'corrected';
    correctedBy = 'carrier_undercharge';
  } else {
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
      groupStatus     = 'unmatched';
      unmatchedReason = 'price_mismatch';
    }
  }

  let groupFreightSell = null;
  if (groupStatus !== 'unmatched') {
    const groupBilledKg = parseFloat(firstLine.billed_weight_kg) || parseFloat(charge.declared_weight_kg) || 0;
    if (groupBilledKg > 0) {
      groupFreightSell = await computeCorrectedSell(charge, grpEffServiceId, groupBilledKg, groupParcels, ctx.serviceIdToCodeMap);
    }
  }
  const addSell   = await resolveSurchargeSells(rollup.items, groupFreightSell, groupParcels, ctx.surchargeOverrideCache, charge.customer_id, grpEffServiceId);
  const totalSell = groupFreightSell != null ? round2(groupFreightSell + addSell) : null;
  const sMeta     = surchargeMeta(rollup.items);

  await insertLine(runId, {
    tracking_number:          String(firstLine.tracking_number || '').trim(),
    carrier_account_no:       firstLine.account_number || null,
    raw_service_code:         rawServiceCode,
    charge_type:              firstLine.charge_type || 'base',
    carrier_amount:           totalCarrierFull,
    carrier_billed_weight_kg: firstLine.billed_weight_kg || null,
    service_id:               grpEffServiceId,
    customer_id:              charge.customer_id,
    charge_id:                charge.charge_id,
    expected_amount:          totalExpectedFull,
    delta,
    status:                   groupStatus,
    corrected_by:             correctedBy,
    unmatched_reason:         unmatchedReason,
    source:                   'internal',
    shipment_date:            firstLine.shipment_date || null,
    mapping_id:               mappingId,
    parcel_count:             groupParcels > 1 ? groupParcels : null,
    corrected_sell_price:     totalSell,
    corrected_cost_price:     groupStatus !== 'unmatched' ? totalCarrierFull : null,
    correction_metadata:      sMeta,
  });

  return [...results, { status: groupStatus }];
}

// ─── Process a single line ────────────────────────────────────────────────────

async function processLine(line, runId, carrierId, serviceCodeMap, surchargeMap, pool, mappings, ctx) {
  const trackingNumber = String(line.tracking_number || '').trim();
  const trackKey       = trackingNumber.toUpperCase();
  const rawServiceCode = String(line.service_code   || '').trim();
  const carrierAmount  = round2(parseFloat(line.carrier_amount) || 0);

  // ── Phase 1b: Service code normalisation ──────────────────────────────────
  const mappedKey = rawServiceCode.toUpperCase();
  const serviceId = serviceCodeMap[mappedKey] || null;

  // ── Surcharge mapping check ───────────────────────────────────────────────
  // If the raw carrier code maps to a known surcharge, auto-correct the cost
  // side. Also check whether the sell-side surcharge charge was ever created —
  // if not, flag as 'warning' so operators know the customer wasn't billed.
  if (!serviceId && surchargeMap[mappedKey]) {
    const surchargeId = surchargeMap[mappedKey];
    console.log(`[recon engine] Raw code "${rawServiceCode}" — matched surcharge ${surchargeId}`);

    const { sellMissing, customerId, chargeId } = await checkSellSurcharge(trackKey, surchargeId, pool);

    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type || 'surcharge',
      carrier_amount:           carrierAmount,
      carrier_billed_weight_kg: line.billed_weight_kg || null,
      service_id:               null,
      customer_id:              customerId || null,
      charge_id:                chargeId   || null,
      expected_amount:          null,
      delta:                    null,
      status:                   sellMissing ? 'warning' : 'corrected',
      corrected_by:             'surcharge_mapping',
      unmatched_reason:         sellMissing ? 'sell_surcharge_missing' : null,
      surcharge_id:             surchargeId || null,
      source:                   'internal',
      suggested_service_id:     null,
    });
    return { status: sellMissing ? 'warning' : 'corrected' };
  }

  if (!serviceId) {
    // ── Carrier overhead (separate_fuel_rows mode) ────────────────────────
    // DPD (and similar) bill fuel, carriage, and energy as separate invoice
    // rows with full-description service codes ("Fuel and Energy Charge" etc.).
    // These are already accounted for in charges.total_cost_price, so we
    // auto-accept them rather than blocking on unknown_service_code.
    //
    // IMPORTANT: only auto-accept as overhead when the tracking number has NO
    // hit in the verified pool.  If the pool DOES contain this tracking, the
    // line is a real charge whose service code is simply not yet mapped — we
    // surface it as unknown_service_code so the operator sees it and can add
    // the mapping.  Silently accepting a real shipment as carrier_overhead
    // hides the charge, assigns no customer, and leaves revenue unrecovered.
    if (ctx.separateFuelRows) {
      const overheadPoolHits = poolLookup(pool, trackKey);
      if (overheadPoolHits.length > 0) {
        // Real shipment — service code unmapped but shipment IS in our pool.
        // Surface as unknown_service_code so the operator adds the mapping.
        console.log(
          `[recon engine] WARN: ${trackKey} svc_code="${rawServiceCode}" is unmapped ` +
          `but tracking IS in verified pool — surfacing as unknown_service_code (not carrier_overhead)`
        );
        await insertLine(runId, {
          tracking_number:          trackingNumber,
          carrier_account_no:       line.account_number    || null,
          raw_service_code:         rawServiceCode,
          charge_type:              line.charge_type || 'base',
          carrier_amount:           carrierAmount,
          carrier_billed_weight_kg: line.billed_weight_kg  || null,
          service_id:               null,
          customer_id:              null,
          charge_id:                null,
          expected_amount:          null,
          delta:                    null,
          status:                   'unmatched',
          corrected_by:             null,
          unmatched_reason:         'unknown_service_code',
          source:                   'internal',
          shipment_date:            line.shipment_date     || null,
          suggested_service_id:     null,
        });
        return { status: 'unmatched' };
      }
      // No pool hit → genuinely an overhead/fuel row (e.g. DPD Fuel & Energy
      // per-shipment surcharge).  Safe to auto-accept.
      // IMPORTANT: still attribute to the correct customer so fuel lines appear
      // on their invoice — even for ghost/carrier_direct freight rows that weren't
      // in the pool.  Look up customer by DPD account number.
      const fuelCustomer = await lookupCustomerByAccount(line.account_number);
      // Also try to link to the ghost charge for this tracking number so the
      // fuel line is visible in the Finance view alongside the freight charge.
      let fuelChargeId = null;
      if (fuelCustomer) {
        const fuelChargeRes = await query(
          `SELECT id FROM charges
           WHERE  tracking_code = $1
             AND  customer_id   = $2
             AND  source        = 'carrier_direct'
             AND  cancelled     = false
           ORDER  BY created_at DESC
           LIMIT  1`,
          [trackingNumber, fuelCustomer.customer_id]
        );
        fuelChargeId = fuelChargeRes.rows[0]?.id || null;
      }
      await insertLine(runId, {
        tracking_number:          trackingNumber,
        carrier_account_no:       line.account_number    || null,
        raw_service_code:         rawServiceCode,
        charge_type:              'fuel',
        carrier_amount:           carrierAmount,
        carrier_billed_weight_kg: line.billed_weight_kg  || null,
        service_id:               null,
        customer_id:              fuelCustomer?.customer_id || null,
        charge_id:                fuelChargeId,
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
    // ── DPD hash-continuation row ─────────────────────────────────────────────
    // DPD splits consignments above a threshold across multiple invoice rows.
    // The continuation row uses "TRACKING#" as its identifier (e.g. 4366832341#).
    // There is no matching shipment in the OMS for this pseudo-tracking.
    // Resolve it by stripping the trailing # and looking up the base consignment.
    if (trackKey.endsWith('#')) {
      const baseTrackKey = trackKey.slice(0, -1);
      const basePoolHits = poolLookup(pool, baseTrackKey);

      if (basePoolHits.length > 0) {
        const baseCharge       = basePoolHits[0];
        const totalExpected    = round2(parseFloat(baseCharge.expected_cost) || 0);

        // Find how much DPD actually charged on the base row so we know what's
        // left to account for on this # continuation row.
        // We use carrier_amount (what DPD billed) NOT expected_amount (what we expect)
        // because expected_amount is the same value for both rows (full charge total),
        // which would make remainingExpected = 0 and misclassify the hash row.
        const baseReconRes  = await query(
          `SELECT carrier_amount FROM reconciliation_lines WHERE run_id = $1 AND tracking_number = $2 LIMIT 1`,
          [runId, baseTrackKey]
        );
        const baseAccounted    = round2(parseFloat(baseReconRes.rows[0]?.carrier_amount) || 0);
        const remainingExpected = (totalExpected > 0 && baseAccounted > 0)
          ? round2(totalExpected - baseAccounted)
          : carrierAmount; // fallback: accept at face value

        const hashDelta  = round2(carrierAmount - remainingExpected);
        const isHashMatch = Math.abs(hashDelta) < 0.02;

        console.log(
          `[recon engine] HASH CONTINUATION: ${trackingNumber} → base=${baseTrackKey} ` +
          `carrier=£${carrierAmount} total_expected=£${totalExpected} base_accounted=£${baseAccounted} ` +
          `remaining=£${remainingExpected} delta=£${hashDelta} → ${isHashMatch ? 'MATCHED' : 'MISMATCH'}`
        );

        await insertLine(runId, {
          tracking_number:          trackingNumber,
          carrier_account_no:       line.account_number     || null,
          raw_service_code:         rawServiceCode,
          charge_type:              line.charge_type        || 'base',
          carrier_amount:           carrierAmount,
          carrier_billed_weight_kg: line.billed_weight_kg   || null,
          service_id:               serviceId,
          customer_id:              baseCharge.customer_id,
          charge_id:                baseCharge.charge_id,
          expected_amount:          remainingExpected,
          delta:                    hashDelta,
          status:                   isHashMatch ? 'matched' : 'unmatched',
          unmatched_reason:         isHashMatch ? null : 'price_mismatch',
          corrected_by:             null,
          source:                   'internal',
          shipment_date:            line.shipment_date      || null,
          ship_to_postcode:         line.delivery_postcode  || null,
          ship_to_name:             line.recipient_name     || null,
          ship_to_country:          line.ship_to_country    || null,
          parcel_count:             line.parcel_count       || null,
          correction_metadata:      { hash_continuation_of: baseTrackKey },
        });
        return { status: isHashMatch ? 'matched' : 'unmatched' };
      }
      // Base tracking also not in pool — fall through to standard no_account_mapping.
    }

    // ── Cancelled booking check ───────────────────────────────────────────────
    // Before falling through to carrier_direct, check whether this tracking
    // belongs to a CANCELLED OMS shipment. DPD has no cancellation API, so a
    // label can be physically collected and invoiced even after Moov marks the
    // booking cancelled. If we find a cancelled match we know the customer and
    // can flag it for manual review without creating phantom billing data.
    const cancelledHits = poolLookup(ctx.cancelledPool, trackKey);
    if (cancelledHits.length > 0) {
      const cancelledCharge = cancelledHits[0];
      console.log(
        `[recon engine] CANCELLED BOOKING INVOICED: tracking=${trackingNumber} ` +
        `customer=${cancelledCharge.customer_id} cancelled_charge=${cancelledCharge.charge_id} ` +
        `carrier_amount=£${carrierAmount}`
      );
      await insertLine(runId, {
        tracking_number:          trackingNumber,
        carrier_account_no:       line.account_number     || null,
        raw_service_code:         rawServiceCode,
        charge_type:              line.charge_type        || 'base',
        carrier_amount:           carrierAmount,
        carrier_billed_weight_kg: line.billed_weight_kg   || null,
        service_id:               serviceId,
        customer_id:              cancelledCharge.customer_id,
        charge_id:                cancelledCharge.charge_id,
        expected_amount:          null,
        delta:                    null,
        status:                   'unmatched',
        corrected_by:             null,
        unmatched_reason:         'cancelled_booking_invoiced',
        source:                   'internal',
        shipment_date:            line.shipment_date      || null,
        ship_to_postcode:         line.delivery_postcode  || null,
        ship_to_name:             line.recipient_name     || null,
        ship_to_country:          line.ship_to_country    || null,
        parcel_count:             line.parcel_count       || null,
      });
      return { status: 'unmatched' };
    }

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
        ship_to_name:             line.recipient_name   || null,
        ship_to_country:          line.ship_to_country   || null,
      });
      return { status: 'unmatched' };
    }

    // Carrier-Direct Rule — we know the customer but have no OMS charge.
    // This is a real-world shipment (return, ad-hoc send, etc.) booked directly
    // with the carrier. Price it from our rate cards and create a charge so it
    // is fully accounted for and billed (source='carrier_direct').
    // Apply any customer-specific service code override before pricing.
    const cdCustOverride = ctx.customerServiceOverrides?.[String(customer.customer_id)]?.[mappedKey];
    const cdServiceId    = cdCustOverride ?? serviceId;
    if (cdCustOverride) {
      console.log(
        `[recon engine] carrier-direct customer override: customer=${customer.customer_id} ` +
        `code="${mappedKey}" → svc=${cdServiceId}`
      );
    }
    return handleCarrierDirect({
      serviceId: cdServiceId,
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
  // Named CSV-column surcharges (surcharge_amounts) are rolled up into this single
  // shipment line via buildSurchargeRollup — no separate rows are produced.
  const charge       = poolHits[0];

  // ── Parcel count mismatch guard ───────────────────────────────────────────
  // If the carrier has invoiced MORE parcels than the booking recorded, every
  // downstream amount (expected, carrier, corrected sell) is meaningless.
  // Flag immediately as unmatched so the operator can dispute the invoice
  // rather than silently accepting an overbill as "carrier_undercharge".
  //
  // bookedParcelCount comes from shipments.parcel_count via the pool query.
  // invoiceParcelCount comes from the carrier CSV items/parcel_count column.
  //
  // We only trigger on overbilling (invoice > booking) because underbilling
  // is uncommon for DPD and carrier-side splits are rarer, whereas overbilling
  // by parcel count is a direct financial loss that must be surfaced.
  const invoiceParcelCount = line.parcel_count || 1;
  const bookedParcelCount  = parseInt(charge.shipment_parcel_count) || 1;
  if (invoiceParcelCount > bookedParcelCount && !charge.reconciliation_flexible_parcel_count) {
    // ── Carrier auto-consolidation check ─────────────────────────────────────
    // DPD sometimes consolidates multiple individually-booked single-parcel
    // shipments onto one invoice line (one master tracking, parcel_count=N).
    // Detect this by looking up companion charges from the same customer on
    // the same collection date that are NOT already billed on their own invoice
    // line. If we find enough companions, handle them via insertCompanionLines
    // (same path as Europa) rather than flagging a dispute.
    // How many companion parcels do we need to account for the difference?
    const extraNeeded = invoiceParcelCount - bookedParcelCount;
    const autoCompanions = [];
    if (
      extraNeeded > 0 &&
      charge.collection_date &&
      ctx.customerDatePool &&
      ctx.allInvoiceTrackings
    ) {
      const dateStr = new Date(charge.collection_date).toISOString().slice(0, 10);
      const cdKey   = `${charge.customer_id}|${dateStr}`;
      const cdHits  = ctx.customerDatePool.get(cdKey) || [];
      const masterTrackUpper = trackKey; // already upper
      const masterPostcode   = (charge.ship_to_postcode || '').trim().toUpperCase();
      for (const hit of cdHits) {
        if (hit.charge_id === charge.charge_id) continue;        // skip master
        if (hit.customer_id !== charge.customer_id)  continue;   // same customer only
        // Postcode guard: if master has a postcode, companion must match to avoid
        // false matches from same-day shipments going to different destinations
        if (masterPostcode) {
          const hitPostcode = (hit.ship_to_postcode || '').trim().toUpperCase();
          if (hitPostcode && hitPostcode !== masterPostcode) continue;
        }
        // Skip if this companion's tracking has its own carrier invoice line
        const hitTracks = (hit.tracking_codes || []).map(t => String(t).trim().toUpperCase());
        const hasOwnInvoiceLine = hitTracks.some(t => ctx.allInvoiceTrackings.has(t) && t !== masterTrackUpper);
        if (hasOwnInvoiceLine) continue;
        autoCompanions.push(hit);
        if (autoCompanions.length >= extraNeeded) break;
      }
    }

    if (autoCompanions.length > 0) {
      console.log(
        `[recon engine] AUTO-CONSOLIDATION: tracking=${trackingNumber} invoice_parcels=${invoiceParcelCount} ` +
        `booked_parcels=${bookedParcelCount} → found ${autoCompanions.length} companion(s) by customer+date`
      );
      // Fall through to normal matching for the master line; companions inserted after.
      // We stash them on charge so the post-match companion insertion can pick them up.
      charge._autoCompanions = autoCompanions;
    } else {
      console.warn(
        `[recon engine] PARCEL COUNT MISMATCH: tracking=${trackingNumber} ` +
        `invoice_parcels=${invoiceParcelCount} booked_parcels=${bookedParcelCount} ` +
        `carrier=£${carrierAmount} — no companions found, flagging as unmatched for operator dispute`
      );
      await insertLine(runId, {
        tracking_number:          trackingNumber,
        carrier_account_no:       line.account_number     || null,
        raw_service_code:         rawServiceCode,
        charge_type:              line.charge_type         || 'base',
        carrier_amount:           carrierAmount,
        carrier_billed_weight_kg: parseFloat(line.billed_weight_kg) || null,
        service_id:               serviceId,
        customer_id:              charge.customer_id,
        charge_id:                charge.charge_id,
        expected_amount:          null,
        delta:                    null,
        status:                   'unmatched',
        corrected_by:             null,
        unmatched_reason:         'parcel_count_mismatch',
        source:                   'internal',
        shipment_date:            line.shipment_date       || null,
        ship_to_postcode:         line.delivery_postcode   || null,
        ship_to_country:          line.ship_to_country     || 'GB',
        parcel_count:             invoiceParcelCount,
        correction_metadata:      {
          invoice_parcel_count: invoiceParcelCount,
          booked_parcel_count:  bookedParcelCount,
        },
      });
      return { status: 'unmatched' };
    }
  }

  // ── Companion parcel lookup ───────────────────────────────────────────────────
  // Two paths:
  // 1. Europa / reconciliation_flexible_parcel_count: customer books multi-parcel
  //    consignment upfront; companions share the same order reference.
  // 2. DPD auto-consolidation: customer books individual parcels; DPD groups them
  //    on collection — companions pre-identified by the parcel_count_mismatch block
  //    above and stashed on charge._autoCompanions.
  const companionCharges = charge._autoCompanions?.length > 0
    ? charge._autoCompanions
    : [];

  if (
    companionCharges.length === 0 &&
    charge.reconciliation_flexible_parcel_count &&
    invoiceParcelCount > 1 &&
    charge.reference
  ) {
    const refKey    = String(charge.reference).trim().toUpperCase();
    const refHits   = pool.get(refKey) || [];
    // Use invoice shipment_date if available; fall back to master charge's collection_date.
    // One of these must be present — if neither is, skip companion matching entirely
    // rather than accepting all pool hits regardless of date.
    const refDate = line.shipment_date
      ? new Date(line.shipment_date)
      : (charge.collection_date ? new Date(charge.collection_date) : null);
    for (const hit of refHits) {
      if (hit.charge_id === charge.charge_id)   continue; // skip master itself
      if (hit.customer_id !== charge.customer_id) continue; // must be same customer
      if (!refDate) continue; // cannot validate date — skip companion to avoid false matches
      const hitDate = hit.collection_date ? new Date(hit.collection_date) : null;
      if (!hitDate) continue; // hit has no date — skip
      const diffMs = Math.abs(hitDate - refDate);
      if (diffMs > 2 * 24 * 60 * 60 * 1000) continue;   // within ±2 days
      companionCharges.push(hit);
      if (companionCharges.length >= invoiceParcelCount - 1) break; // cap at invoice count - 1
    }
    if (companionCharges.length > 0) {
      console.log(
        `[recon engine] COMPANION PARCEL: master=${trackingNumber} ref=${charge.reference} ` +
        `found ${companionCharges.length} companion charge(s) to reconcile`
      );
    }
  }

  // ── Apply customer service code override (after pool hit resolves customerId) ─
  const poolCustOverrideMap = ctx.customerServiceOverrides?.[String(charge.customer_id)];
  const poolCustOverride    = poolCustOverrideMap?.[mappedKey];
  const effectiveServiceId  = poolCustOverride ?? serviceId;
  if (poolCustOverride) {
    console.log(
      `[recon engine] Customer service override: customer=${charge.customer_id} ` +
      `code="${mappedKey}" global_svc=${serviceId} → override_svc=${effectiveServiceId}`
    );
  }

  // ── DDP clearance admin fee (per consignment, idempotent) ─────────────────
  // Stores a reconciliation line only — actual charge is created at Finalize Run.
  await insertDdpAdminReconLine(
    runId, trackingNumber, charge, effectiveServiceId,
    line.ship_to_country, line.shipment_date, ctx.serviceIdToCodeMap
  );

  // separate_fuel_rows: carrier bills fuel/carriage/energy as separate invoice
  // rows, so the freight row's carrier_amount = base only. Compare against
  // cost_price (base) not total_cost_price (base + fuel). Overhead rows are
  // already auto-accepted above via the carrier_overhead path.
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
      if (!chargeZoneId && line.delivery_postcode && effectiveServiceId) {
        const resolvedZone = await matchZone(
          effectiveServiceId,
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

      if (perParcelWeightKg > 0 && chargeZoneId && effectiveServiceId) {
        const bandResult = await lookupCarrierBandCost(effectiveServiceId, perParcelWeightKg, chargeZoneId);
        if (bandResult) {
          // Only recompute using rate card when price_sub (costSub) is explicitly configured.
          // price_first is the single-parcel / first-parcel rate and MUST NOT be multiplied by
          // N parcels — that would produce an inflated expected (e.g. £15.07 × 3 = £45.21
          // instead of the correct £4.15 × 3 = £12.45).  When price_sub is null in the weight
          // band, fall through so expectedBase falls back to baseFromDb (stored cost_price).
          if (bandResult.costSub != null) {
            rateCardExpected = round2(bandResult.costSub * invoiceParcelCount);
            console.log(
              `[recon engine] all_sub rate-card recompute: tracking=${trackingNumber} ` +
              `zone=${chargeZoneId} weight=${invoiceWeightKg}kg (per_parcel=${perParcelWeightKg}kg) ` +
              `price_sub=£${bandResult.costSub} × ${invoiceParcelCount} = £${rateCardExpected} ` +
              `(stored cost_price=£${baseFromDb})`
            );
          } else {
            console.log(
              `[recon engine] all_sub rate-card recompute SKIPPED: tracking=${trackingNumber} ` +
              `zone=${chargeZoneId} weight=${perParcelWeightKg}kg — price_sub not set on band, ` +
              `falling back to stored cost_price=£${baseFromDb}`
            );
          }
        }
      }

      // Scale up cost_price ONLY when the carrier invoiced more parcels than we booked
      // (companion-parcel overbill: cost_price stored for bookedParcelCount parcels, carrier
      // charged for invoiceParcelCount). When invoice count matches the booked count, the
      // stored cost_price already represents the full consignment total — multiply by 1.
      const overBilledFactor = (invoiceParcelCount > bookedParcelCount && bookedParcelCount > 0)
        ? invoiceParcelCount / bookedParcelCount
        : 1;
      expectedBase = rateCardExpected != null ? rateCardExpected : round2(baseFromDb * overBilledFactor);
    } else {
      // Single-parcel or no all_sub mode — trust stored cost_price directly.
      expectedBase = baseFromDb;
    }
  } else {
    expectedBase = round2(parseFloat(charge.total_cost_price) || 0);
  }
  const fullExpected    = round2(expectedBase);
  line._expected_amount = fullExpected;

  // Roll up all named CSV-column surcharges into the single shipment line.
  const invoiceParcels = parseInt(line.parcel_count) || 1;
  const rollup         = await buildSurchargeRollup(
    line.surcharge_amounts, ctx.surchargeById, carrierAmount, invoiceParcels, ctx.globallyExcludedColumns,
    charge.customer_id, ctx.costOverrideCache, effectiveServiceId
  );
  const totalCarrier  = round2(carrierAmount + rollup.addCarrierAmt);
  const totalExpected = round2(fullExpected  + rollup.addExpectedCost);
  const delta         = round2(totalCarrier  - totalExpected);

  if (Math.abs(delta) < 0.02) {
    const billedKg    = parseFloat(line.billed_weight_kg) || parseFloat(charge.declared_weight_kg) || 0;
    if (!parseFloat(line.billed_weight_kg) && billedKg > 0) {
      console.log(`[recon engine] matchedSell: no invoice weight for ${trackingNumber} — using declared_weight_kg=${billedKg}kg`);
    }
    const freightSell = billedKg > 0
      ? await computeCorrectedSell(charge, effectiveServiceId, billedKg, invoiceParcels, ctx.serviceIdToCodeMap)
      : null;
    const addSell  = await resolveSurchargeSells(rollup.items, freightSell, invoiceParcels, ctx.surchargeOverrideCache, charge.customer_id, effectiveServiceId);
    const totalSell = freightSell != null ? round2(freightSell + addSell) : null;
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           totalCarrier,
      carrier_billed_weight_kg: billedKg || null,
      service_id:               effectiveServiceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          totalExpected,
      delta,
      status:                   'matched',
      corrected_by:             null,
      unmatched_reason:         null,
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
      parcel_count:             invoiceParcels > 1 ? invoiceParcels : null,
      corrected_sell_price:     totalSell,
      corrected_cost_price:     totalCarrier,
      correction_metadata:      surchargeMeta(rollup.items),
    });
    if (companionCharges.length > 0) {
      await insertCompanionLines(runId, companionCharges, trackingNumber, rawServiceCode, line, effectiveServiceId);
    }
    return { status: 'matched' };
  }

  // Phase 3b: Undercharge Rule — carrier billed LESS than expected.
  // Per policy: never downgrade a charge. We flag this for visibility only.
  // The charges table is left untouched so the customer is billed at the
  // original (higher) booked price. corrected_sell_price is left null
  // so the UI clearly shows this has NOT been repriced downward.
  if (delta < -0.02) {
    const billedKg = parseFloat(line.billed_weight_kg) || parseFloat(charge.declared_weight_kg) || 0;
    console.log(`[recon engine] UNDERCHARGE: tracking=${trackingNumber} carrier=£${totalCarrier} expected=£${totalExpected} delta=£${delta} — flagged only, charge NOT downgraded`);
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           totalCarrier,
      carrier_billed_weight_kg: billedKg || null,
      service_id:               effectiveServiceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          totalExpected,
      delta,
      status:                   'corrected',
      corrected_by:             'carrier_undercharge',
      unmatched_reason:         null,
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
      parcel_count:             invoiceParcels > 1 ? invoiceParcels : null,
      corrected_sell_price:     null,  // never downgrade
      corrected_cost_price:     null,  // never downgrade
      correction_metadata:      surchargeMeta(rollup.items),
    });
    if (companionCharges.length > 0) {
      await insertCompanionLines(runId, companionCharges, trackingNumber, rawServiceCode, line, effectiveServiceId);
    }
    return { status: 'corrected' };
  }

  // Phase 3c: Weight Correction — carrier billed at a HIGHER weight than declared.
  // When the carrier re-weighs and finds the parcel heavier than booked, they bill
  // at the actual weight. We accept this as correct, re-price cost and sell at the
  // actual weight, and update the charges record so the customer is billed correctly.
  // This only fires for upward corrections (billedKg > declaredKg). Downward
  // discrepancies are handled by the undercharge rule above and are never applied.
  {
    const declaredKg = parseFloat(charge.declared_weight_kg) || 0;
    const billedKg   = parseFloat(line.billed_weight_kg)     || 0;

    if (billedKg > 0 && declaredKg > 0 && billedKg > declaredKg + 0.09) {
      console.log(`[recon engine] WEIGHT CORRECTION: tracking=${trackingNumber} declared=${declaredKg}kg billed=${billedKg}kg — repricing`);

      // ── Zone resolution ────────────────────────────────────────────────────
      // For international shipments the charge may have no zone_id if the
      // booking didn't save one. Try to resolve from the invoice delivery
      // country / postcode exactly as the all_sub recompute does.
      let resolvedZoneId = charge.zone_id || null;
      if (!resolvedZoneId && effectiveServiceId) {
        const country  = line.ship_to_country   || null;
        const postcode = line.delivery_postcode  || '';
        if (country || postcode) {
          const z = await matchZone(effectiveServiceId, country || 'GB', postcode);
          if (z) {
            resolvedZoneId = z.id;
            console.log(
              `[recon engine] WEIGHT CORRECTION: resolved zone from country="${country}" ` +
              `postcode="${postcode}" → zone_id=${resolvedZoneId} for tracking=${trackingNumber}`
            );
          }
        }
      }

      // Use a charge object with the resolved zone so computeCorrectedSell
      // doesn't bail out on a missing zone_id.
      const chargeForSell = resolvedZoneId !== charge.zone_id
        ? { ...charge, zone_id: resolvedZoneId }
        : charge;

      const newCostResult = await lookupCarrierBandCost(effectiveServiceId, billedKg, resolvedZoneId);
      const newSell       = await computeCorrectedSell(chargeForSell, effectiveServiceId, billedKg, invoiceParcels, ctx.serviceIdToCodeMap);
      const newCost       = newCostResult ? newCostResult.cost : null;

      if (newCost !== null) {
        if (newSell === null) {
          // Cost band found but no customer sell rate — do NOT silently mark as
          // corrected with the wrong price. Surface as unmatched so the operator
          // can see the sell lookup failed and fix the rate card.
          console.warn(
            `[recon engine] WEIGHT CORRECTION PARTIAL: tracking=${trackingNumber} ` +
            `cost repriced to £${newCost} at ${billedKg}kg but customer sell lookup failed ` +
            `(customer=${charge.customer_id} zone_id=${resolvedZoneId}) — flagging unmatched`
          );
          await insertLine(runId, {
            tracking_number:          trackingNumber,
            carrier_account_no:       line.account_number    || null,
            raw_service_code:         rawServiceCode,
            charge_type:              line.charge_type       || 'base',
            carrier_amount:           totalCarrier,
            carrier_billed_weight_kg: billedKg,
            service_id:               effectiveServiceId,
            customer_id:              charge.customer_id,
            charge_id:                charge.charge_id,
            expected_amount:          totalExpected,
            delta,
            status:                   'unmatched',
            corrected_by:             null,
            unmatched_reason:         'weight_sell_lookup_failed',
            source:                   'internal',
            shipment_date:            line.shipment_date     || null,
            ship_to_postcode:         line.delivery_postcode || null,
            ship_to_name:             line.recipient_name   || null,
            ship_to_country:          line.ship_to_country   || null,
            correction_metadata:      {
              declared_weight_kg: declaredKg,
              billed_weight_kg:   billedKg,
              weight_diff_kg:     round2(billedKg - declaredKg),
              new_cost_price:     newCost,
              sell_lookup_failed: true,
            },
          });
          return { status: 'unmatched' };
        }

        // ── Carrier amount verification ──────────────────────────────────────
        // A weight correction is only valid when the carrier billed at or below
        // what our rate card says for the new (billed) weight. If the carrier
        // billed MORE than that, the extra amount is unexplained and cannot be
        // silently accepted — it must go through the mapping engine and, if
        // still unexplained, surface as unmatched for operator review.
        //
        // Same-band rule: when old_cost === new_cost the weight change is
        // informational only (the rate band didn't change). If the carrier
        // still billed more than our expected cost, that's a price discrepancy
        // unrelated to weight — always fall through so it's properly surfaced.
        const newExpectedFull = round2(newCost + rollup.addExpectedCost);
        const weightDelta     = round2(totalCarrier - newExpectedFull);
        const oldCost         = round2(parseFloat(charge.expected_cost) || 0);
        const sameBand        = Math.abs(newCost - oldCost) < 0.01;

        if (weightDelta > 0.02) {
          // Carrier billed MORE than our rate at the new weight.
          // Stash weight context on the line so the mapping engine and
          // unmatched insertLine can include it for operator visibility.
          console.log(
            `[recon engine] WEIGHT CORRECTION OVERCHARGE: tracking=${trackingNumber} ` +
            `declared=${declaredKg}kg → billed=${billedKg}kg ` +
            `(${sameBand ? 'SAME BAND — cost unchanged' : `band changed £${oldCost}→£${newCost}`}) ` +
            `carrier=£${totalCarrier} expected_at_billed_weight=£${newExpectedFull} ` +
            `over=£${weightDelta} — falling through to mapping/unmatched`
          );
          line._weight_context = {
            declared_weight_kg: declaredKg,
            billed_weight_kg:   billedKg,
            weight_diff_kg:     round2(billedKg - declaredKg),
            old_cost_price:     oldCost,
            new_cost_price:     newCost,
            band_label:         newCostResult.bandLabel || null,
            resolved_zone_id:   resolvedZoneId,
            same_band:          sameBand,
            weight_overcharge:  weightDelta,
          };
          // Fall through to Phase 4a (mapping engine) / Phase 4 (unmatched).
        } else {
          // Carrier billed at or below our expected rate at the new weight.
          // Accept as a valid weight correction.
          //
          // Skip the charges DB update when the band didn't change (newCost ===
          // oldCost): the cost_price is already correct — no write needed.
          if (!sameBand) {
            await query(`
              UPDATE charges
              SET weight_charged_kg = $1,
                  cost_price        = $2,
                  price             = $3
              WHERE id = $4
            `, [billedKg, newCost, newSell, charge.charge_id]);

            // Recalculate fuel and cost-percentage surcharge charges for the same
            // shipment. The fuel charge was created at booking time at the original
            // weight/price. Now the base freight has changed we must update it so
            // the sell CSV shows the correct fuel amount.
            try {
              const fuelPctRes = await query(`
                SELECT fg.fuel_surcharge_pct                              AS cost_pct,
                       COALESCE(cfgp.sell_pct, fg.standard_sell_pct, 0)  AS sell_pct
                FROM   courier_services cs
                JOIN   fuel_groups fg
                       ON fg.id = cs.fuel_group_id
                LEFT JOIN customer_fuel_group_pricing cfgp
                       ON cfgp.fuel_group_id = fg.id
                      AND cfgp.customer_id   = $2
                WHERE  cs.id = $1
              `, [effectiveServiceId, charge.customer_id]);

              if (fuelPctRes.rows.length) {
                const fuelCostPct = parseFloat(fuelPctRes.rows[0].cost_pct || 0);
                const fuelSellPct = parseFloat(fuelPctRes.rows[0].sell_pct || 0);

                if (fuelSellPct > 0 || fuelCostPct > 0) {
                  const newFuelSell = round2(newSell * fuelSellPct / 100);
                  const newFuelCost = round2(newCost * fuelCostPct / 100);

                  const fuelUpdRes = await query(`
                    UPDATE charges
                    SET price      = $1,
                        cost_price = $2
                    WHERE shipment_id = (SELECT shipment_id FROM charges WHERE id = $3)
                      AND charge_type = 'fuel'
                      AND cancelled   = false
                  `, [newFuelSell, newFuelCost, charge.charge_id]);

                  if (fuelUpdRes.rowCount > 0) {
                    console.log(
                      `[recon engine] WEIGHT CORRECTION: fuel charge updated for tracking=${trackingNumber} ` +
                      `sell_pct=${fuelSellPct}% → £${newFuelSell}, cost_pct=${fuelCostPct}% → £${newFuelCost}`
                    );
                  }
                }
              }
            } catch (fuelErr) {
              console.warn(`[recon engine] WEIGHT CORRECTION: fuel charge update failed for tracking=${trackingNumber}:`, fuelErr.message);
            }
          }

          const addSell   = await resolveSurchargeSells(rollup.items, newSell, invoiceParcels, ctx.surchargeOverrideCache, charge.customer_id, effectiveServiceId);
          const totalSell = round2(newSell + addSell);

          console.log(
            `[recon engine] WEIGHT CORRECTION applied: tracking=${trackingNumber} ` +
            `declared=${declaredKg}kg → actual=${billedKg}kg ` +
            `(${sameBand ? 'same band' : `£${oldCost}→£${newCost}`}), ` +
            `carrier=£${totalCarrier} ≈ expected=£${newExpectedFull}`
          );

          await insertLine(runId, {
            tracking_number:          trackingNumber,
            carrier_account_no:       line.account_number    || null,
            raw_service_code:         rawServiceCode,
            charge_type:              line.charge_type       || 'base',
            carrier_amount:           totalCarrier,
            carrier_billed_weight_kg: billedKg,
            service_id:               effectiveServiceId,
            customer_id:              charge.customer_id,
            charge_id:                charge.charge_id,
            expected_amount:          newExpectedFull,
            delta:                    round2(totalCarrier - newExpectedFull),
            status:                   'corrected',
            corrected_by:             'weight_correction',
            unmatched_reason:         null,
            source:                   'internal',
            shipment_date:            line.shipment_date     || null,
            ship_to_postcode:         line.delivery_postcode || null,
            ship_to_name:             line.recipient_name   || null,
            ship_to_country:          line.ship_to_country   || null,
            parcel_count:             invoiceParcels > 1 ? invoiceParcels : null,
            corrected_cost_price:     newExpectedFull,
            corrected_sell_price:     totalSell,
            correction_metadata:      {
              declared_weight_kg: declaredKg,
              billed_weight_kg:   billedKg,
              weight_diff_kg:     round2(billedKg - declaredKg),
              old_cost_price:     oldCost,
              new_cost_price:     newCost,
              band_label:         newCostResult.bandLabel || null,
              same_band:          sameBand,
              resolved_zone_id:   resolvedZoneId,
              ...surchargeMeta(rollup.items) || {},
            },
          });
          if (companionCharges.length > 0) {
            await insertCompanionLines(runId, companionCharges, trackingNumber, rawServiceCode, line, effectiveServiceId);
          }
          return { status: 'corrected' };
        }
      }

      // No carrier cost band found for the actual weight — fall through to unmatched.
      console.log(`[recon engine] WEIGHT CORRECTION: no carrier rate band for ${billedKg}kg on service ${serviceId} zone ${resolvedZoneId} — falling through to unmatched`);
    }
  }

  // Phase 4a: Mapping Engine
  const mappingResult = applyMappings(mappings, line, delta);
  if (mappingResult?.applied) {
    await query(
      `UPDATE reconciliation_mappings SET applied_count = applied_count + 1, last_applied_at = NOW() WHERE id = $1`,
      [mappingResult.mappingId]
    );
    const billedKg    = parseFloat(line.billed_weight_kg) || parseFloat(charge.declared_weight_kg) || 0;
    const freightSell = billedKg > 0
      ? await computeCorrectedSell(charge, effectiveServiceId, billedKg, invoiceParcels, ctx.serviceIdToCodeMap)
      : null;
    const addSell   = await resolveSurchargeSells(rollup.items, freightSell, invoiceParcels, ctx.surchargeOverrideCache, charge.customer_id, effectiveServiceId);
    const totalSell  = freightSell != null ? round2(freightSell + addSell) : null;
    await insertLine(runId, {
      tracking_number:          trackingNumber,
      carrier_account_no:       line.account_number    || null,
      raw_service_code:         rawServiceCode,
      charge_type:              line.charge_type       || 'base',
      carrier_amount:           totalCarrier,
      carrier_billed_weight_kg: billedKg || null,
      service_id:               effectiveServiceId,
      customer_id:              charge.customer_id,
      charge_id:                charge.charge_id,
      expected_amount:          totalExpected,
      delta,
      status:                   'corrected',
      corrected_by:             'mapping',
      unmatched_reason:         null,
      source:                   'internal',
      shipment_date:            line.shipment_date     || null,
      ship_to_postcode:         line.delivery_postcode || null,
      ship_to_country:          line.ship_to_country   || null,
      parcel_count:             invoiceParcels > 1 ? invoiceParcels : null,
      mapping_id:               mappingResult.mappingId,
      corrected_sell_price:     totalSell,
      corrected_cost_price:     totalCarrier,
      correction_metadata:      { ...surchargeMeta(rollup.items), ...line._weight_context || {} },
    });
    if (companionCharges.length > 0) {
      await insertCompanionLines(runId, companionCharges, trackingNumber, rawServiceCode, line, effectiveServiceId);
    }
    return { status: 'corrected' };
  }

  // RED — unexplained price difference
  console.log(`[recon engine] UNMATCHED: tracking=${trackingNumber} carrier=£${totalCarrier} expected=£${totalExpected} delta=£${delta}`);
  const rawColMeta   = (line.raw_col_values && Object.keys(line.raw_col_values).length > 0) ? { raw_col_values: line.raw_col_values } : null;
  const sMeta        = surchargeMeta(rollup.items);
  const wCtx         = line._weight_context || null;
  const combinedMeta = (rawColMeta || sMeta || wCtx) ? { ...rawColMeta, ...sMeta, ...wCtx } : null;
  await insertLine(runId, {
    tracking_number:          trackingNumber,
    carrier_account_no:       line.account_number    || null,
    raw_service_code:         rawServiceCode,
    charge_type:              line.charge_type       || 'base',
    carrier_amount:           totalCarrier,
    carrier_billed_weight_kg: line.billed_weight_kg  || null,
    service_id:               effectiveServiceId,
    customer_id:              charge.customer_id,
    charge_id:                charge.charge_id,
    expected_amount:          totalExpected,
    delta,
    status:                   'unmatched',
    corrected_by:             null,
    unmatched_reason:         'price_mismatch',
    source:                   'internal',
    shipment_date:            line.shipment_date     || null,
    ship_to_postcode:         line.delivery_postcode || null,
    ship_to_country:          line.ship_to_country   || null,
    parcel_count:             line.parcel_count      || null,
    correction_metadata:      combinedMeta,
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
       ship_to_postcode, ship_to_country, parcel_count,
       corrected_sell_price, corrected_cost_price, surcharge_id, ship_to_name)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
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
    data.corrected_sell_price     ?? null,
    data.corrected_cost_price     ?? null,
    data.surcharge_id             || null,
    data.ship_to_name             || null,
  ]);
}

// ─── Insert companion parcel reconciliation lines ─────────────────────────────
//
// Called after a master parcel line is successfully reconciled.
// Companion parcels were shipped under the same reference on the same day but
// billed by the carrier under the master tracking number only.
// Each companion gets a zero-carrier-amount reconciliation line so the charge
// is closed out without double-counting the carrier invoice total.

async function insertCompanionLines(runId, companionCharges, masterTracking, rawServiceCode, line, effectiveServiceId) {
  for (const companion of companionCharges) {
    const companionExpected = round2(parseFloat(companion.total_cost_price) || 0);
    const companionSell     = round2(parseFloat(companion.stored_sell_price) || 0);
    console.log(
      `[recon engine] COMPANION PARCEL: inserting line for charge=${companion.charge_id} ` +
      `customer=${companion.customer_id} expected=£${companionExpected} under master=${masterTracking}`
    );
    await insertLine(runId, {
      tracking_number:      masterTracking,
      carrier_account_no:   line.account_number || null,
      raw_service_code:     rawServiceCode,
      charge_type:          'courier',
      carrier_amount:       0,
      service_id:           effectiveServiceId,
      customer_id:          companion.customer_id,
      charge_id:            companion.charge_id,
      expected_amount:      companionExpected,
      delta:                0,
      status:               'matched',
      corrected_by:         null,
      source:               'companion_parcel',
      shipment_date:        line.shipment_date    || null,
      ship_to_postcode:     line.delivery_postcode || null,
      ship_to_country:      line.ship_to_country  || null,
      corrected_sell_price: companionSell || null,
      corrected_cost_price: companionExpected,
      correction_metadata:  { master_tracking: masterTracking },
    });
  }
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
          // NOTE: query above selects ship_to_postcode (not delivery_postcode).
          if (!chargeZoneId && line.ship_to_postcode && serviceId) {
            const resolvedZone = await matchZone(
              serviceId,
              line.ship_to_country || 'GB',
              line.ship_to_postcode
            );
            if (resolvedZone) chargeZoneId = resolvedZone.id;
          }

          let rateCardExpected    = null;

          if (perParcelWeightKg > 0 && chargeZoneId && serviceId) {
            const bandResult = await lookupCarrierBandCost(serviceId, perParcelWeightKg, chargeZoneId);
            if (bandResult && bandResult.costSub != null) {
              // Only recompute if price_sub is configured — never multiply price_first × N.
              rateCardExpected = round2(bandResult.costSub * invoiceParcelCount);
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
          const rmpHasSell = pricing.sell_price != null;
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
            sell_price:          pricing.sell_price ?? null,       // never fall back to cost_price
            status:              rmpHasSell ? 'verified' : 'pricing_error',
            ship_to_postcode:    postcode,
            ship_to_country_iso: country,
            source:              'carrier_direct',
            raw_payload:         JSON.stringify({ recon_auto_created: true, run_id: runId }),
          }]);

          const insertedId  = newCharges[0]?.id || null;
          const expected    = round2(pricing.cost_price);
          const delta       = round2(carrierAmount - expected);
          const isMatch     = Math.abs(delta) < 0.02;
          const rmpStatus   = !rmpHasSell ? 'unmatched' : (isMatch ? 'matched' : 'corrected');
          const rmpReason   = !rmpHasSell ? 'no_rate'   : null;
          const rmpCorrBy   = !rmpHasSell ? null        : (isMatch ? null : 'carrier_direct');

          await query(`
            UPDATE reconciliation_lines
            SET  status           = $1,
                 service_id       = $2,
                 customer_id      = $3,
                 charge_id        = $4,
                 expected_amount  = $5,
                 delta            = $6,
                 unmatched_reason = $9,
                 source           = 'carrier_direct',
                 corrected_by     = $7,
                 resolved_at      = NULL,
                 resolved_by      = NULL
            WHERE id = $8
          `, [
            rmpStatus,
            serviceId,
            customer.customer_id,
            insertedId,
            expected,
            delta,
            rmpCorrBy,
            line.line_id,
            rmpReason,
          ]);

          carrier_direct_created++;
          if (rmpStatus === 'matched') matched++; else unmatched++;
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
