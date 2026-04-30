/**
 * Moov OS — Reconciliation Engine
 *
 * Automated courier invoice reconciliation engine.
 *
 * Full flow (per the architecture spec):
 *   Phase 1b  — Service Code Normalisation (hard gate)
 *   Pre-cond  — Build Verified Pool (once per run)
 *   Phase 2   — Safety Net check (tracking vs pool, account fallback)
 *   Phase 3   — Match & Compare (fuel aggregate + per-line delta)
 *   Phase 4a  — Mapping Engine (saved human resolutions)
 *   Phase 4b  — Correction Engine (pricing rules)
 *   Phase 5   — State assignment & persistence
 *
 * Entry point: processReconciliationRun(runId, carrierId, lines)
 *   lines = array of normalised invoice objects (see InvoiceLine typedef below)
 */

import { query } from '../db/index.js';

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} InvoiceLine
 * @property {string}  tracking_number
 * @property {string}  [account_number]
 * @property {string}  service_code          raw code from carrier CSV
 * @property {string}  [charge_type]         base | fuel | surcharge | adjustment
 * @property {number}  carrier_amount        what carrier billed (£)
 * @property {number}  [billed_weight_kg]    weight as billed by carrier
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n) { return Math.round(n * 100) / 100; }

// ─── Phase 1b: Service Code Normalisation ────────────────────────────────────
// Returns { serviceId, line } or throws with unmatched_reason

async function buildServiceCodeMap(carrierId) {
  const res = await query(
    `SELECT courier_code, service_id
     FROM   courier_service_code_mappings
     WHERE  carrier_id = $1 AND is_active = true`,
    [carrierId]
  );
  const map = {};
  for (const row of res.rows) {
    map[row.courier_code.trim().toUpperCase()] = row.service_id;
  }
  return map;
}

// ─── Pre-condition: Build Verified Pool ──────────────────────────────────────
// Single query, run once per job. Returns Set of tracking numbers.
// We also build a map of tracking_number → charge data for fast lookup.

async function buildVerifiedPool(carrierId) {
  // Pull all verified charges for this carrier, joined to shipments + tracking_codes
  const res = await query(`
    SELECT
      c.id              AS charge_id,
      c.order_id        AS reference,
      c.customer_id,
      c.cost_price      AS expected_cost,
      c.shipment_id,
      c.charge_type,
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
      AND  (s.courier ILIKE cu_carrier.code OR s.courier ILIKE cu_carrier.name)
  `, [carrierId]);

  // Build: tracking_number → array of charge records (multiple if return + outbound share a ref)
  const pool = new Map(); // key: tracking_number (upper), value: charge row[]

  for (const row of res.rows) {
    const codes = row.tracking_codes || [];
    for (const code of codes) {
      const key = String(code).trim().toUpperCase();
      if (!pool.has(key)) pool.set(key, []);
      pool.get(key).push(row);
    }
    // Also index by reference in case tracking_codes is empty
    if (row.reference) {
      const refKey = String(row.reference).trim().toUpperCase();
      if (!pool.has(refKey)) pool.set(refKey, []);
      if (!pool.get(refKey).find(r => r.charge_id === row.charge_id)) {
        pool.get(refKey).push(row);
      }
    }
  }

  return pool;
}

// ─── Phase 2: Account number → customer lookup (Safety Net) ──────────────────

async function lookupCustomerByAccount(accountNumber) {
  if (!accountNumber) return null;
  const acct = String(accountNumber).trim();

  // Primary: customer_carrier_links
  const res = await query(
    `SELECT cu.id AS customer_id, cu.business_name, cu.account_number AS customer_account
     FROM   customer_carrier_links ccl
     JOIN   customers              cu ON cu.id = ccl.customer_id
     WHERE  ccl.account_number = $1
     LIMIT  1`,
    [acct]
  );
  if (res.rows.length) return res.rows[0];

  // Fallback: customers.account_number / dc_customer_id
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

// Apply Mapping Engine rules to a line. Returns { applied, mappingId } or null.
function applyMappings(mappings, line, delta) {
  for (const m of mappings) {
    if (m.mapping_type === 'delta_acceptance') {
      // match_field = 'charge_type', match_value = charge type, resolution_value = max pct tolerance
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

    if (m.mapping_type === 'weight_adjustment') {
      // resolution_value = kg offset to add to our expected weight before recalculating
      // For now, flag as potentially correctable — full recalc would need pricing engine
      // This is handled at the correction engine level
    }
  }
  return null;
}

// ─── Phase 4b: Correction Engine ─────────────────────────────────────────────
// Check if customer has pricing rules AND those rules can explain the delta.

async function checkCorrectionEngine(customerId, serviceId, carrierId, line, delta) {
  if (!customerId || !serviceId) {
    return { corrected: false, reason: 'no_pricing_rules' };
  }

  // Does the customer have any active pricing rules for this service?
  const rulesRes = await query(
    `SELECT COUNT(*) AS cnt
     FROM   customer_rates
     WHERE  customer_id = $1
       AND  (
         TRIM(service_code) ILIKE (
           SELECT TRIM(service_code) FROM courier_services WHERE id = $2 LIMIT 1
         )
         OR service_code IS NULL
       )`,
    [customerId, serviceId]
  );
  const hasRules = parseInt(rulesRes.rows[0]?.cnt || 0) > 0;
  if (!hasRules) return { corrected: false, reason: 'no_pricing_rules' };

  // Try to explain the delta: recalculate expected cost using carrier's billed weight
  // if that produces a cost matching carrier_amount, delta is explained.
  if (line.billed_weight_kg && line.billed_weight_kg > 0 && delta !== 0) {
    // Look up the cost at carrier's billed weight using our weight bands
    const bandRes = await query(`
      SELECT wb.price_first, wb.price_subsequent, wb.cost_per_kg, wb.cost_per_kg_threshold_kg,
             wb.min_weight_kg, wb.max_weight_kg
      FROM   weight_bands      wb
      JOIN   zones             z  ON z.id  = wb.zone_id
      JOIN   courier_services  cs ON cs.id = z.courier_service_id
      WHERE  cs.id = $1
        AND  ($2 >= COALESCE(wb.min_weight_kg, 0))
        AND  ($2 <  COALESCE(wb.max_weight_kg, 99999))
      LIMIT  1
    `, [serviceId, line.billed_weight_kg]);

    if (bandRes.rows.length) {
      const band = bandRes.rows[0];
      let recalcCost = parseFloat(band.price_first || 0);
      // Per-kg overage above threshold
      if (band.cost_per_kg && band.cost_per_kg_threshold_kg &&
          line.billed_weight_kg > band.cost_per_kg_threshold_kg) {
        recalcCost += (line.billed_weight_kg - band.cost_per_kg_threshold_kg) *
                      parseFloat(band.cost_per_kg);
      }
      const recalcDelta = round2(line.carrier_amount - recalcCost);
      if (Math.abs(recalcDelta) < 0.02) {
        return { corrected: true, reason: 'pricing_rules' };
      }
    }
  }

  // Delta present but can't fully explain it
  return { corrected: false, reason: 'unexplained_delta' };
}

// ─── Fuel aggregate check ─────────────────────────────────────────────────────
// Fuel is never line-by-line. Check total fuel % of invoice total.
// Returns 'matched' or 'unmatched' for all fuel lines collectively.

function checkFuelAggregate(lines, expectedFuelTotal, tolerance = 5) {
  const fuelLines = lines.filter(l =>
    (l.charge_type || '').toLowerCase() === 'fuel'
  );
  if (fuelLines.length === 0) return { status: 'none', lines: [] };

  const carrierFuelTotal = fuelLines.reduce((s, l) => s + (parseFloat(l.carrier_amount) || 0), 0);
  const invoiceTotal     = lines.reduce((s, l) => s + (parseFloat(l.carrier_amount) || 0), 0);

  if (invoiceTotal === 0) return { status: 'matched', lines: fuelLines };

  const carrierFuelPct  = (carrierFuelTotal / invoiceTotal) * 100;
  const expectedFuelPct = expectedFuelTotal > 0
    ? (expectedFuelTotal / invoiceTotal) * 100
    : null;

  // If we can't calculate expected fuel %, use a simple absolute check
  const withinTolerance = expectedFuelPct !== null
    ? Math.abs(carrierFuelPct - expectedFuelPct) <= tolerance
    : Math.abs(carrierFuelTotal - expectedFuelTotal) < 1.00;

  return {
    status:          withinTolerance ? 'matched' : 'unmatched',
    carrier_total:   round2(carrierFuelTotal),
    expected_total:  round2(expectedFuelTotal),
    carrier_pct:     round2(carrierFuelPct),
    lines:           fuelLines,
  };
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

  // ── Update run status ──────────────────────────────────────────────────────
  await query(
    `UPDATE reconciliation_runs SET status = 'processing', total_lines = $2 WHERE id = $1`,
    [runId, lines.length]
  );

  // ── Phase 1b: Build service code map ──────────────────────────────────────
  const serviceCodeMap = await buildServiceCodeMap(carrierId);

  // ── Pre-condition: Build Verified Pool ────────────────────────────────────
  const pool = await buildVerifiedPool(carrierId);

  // ── Phase 4a: Load Mapping Engine rules ───────────────────────────────────
  const mappings = await loadMappings(carrierId);

  // ── Separate fuel lines (aggregate check) ────────────────────────────────
  const fuelLines    = lines.filter(l => (l.charge_type || '').toLowerCase() === 'fuel');
  const nonFuelLines = lines.filter(l => (l.charge_type || '').toLowerCase() !== 'fuel');

  // Counters
  let matched = 0, corrected = 0, unmatched = 0, ignored = 0;

  // ── Process non-fuel lines ────────────────────────────────────────────────
  for (const line of nonFuelLines) {
    const lineResult = await processLine(
      line, runId, carrierId, serviceCodeMap, pool, mappings
    );

    switch (lineResult.status) {
      case 'matched':   matched++;   break;
      case 'corrected': corrected++;  break;
      case 'unmatched': unmatched++;  break;
      case 'ignored':   ignored++;    break;
    }
  }

  // ── Fuel aggregate check ──────────────────────────────────────────────────
  // Sum expected fuel from our system for shipments we found in the pool
  let expectedFuelTotal = 0;
  for (const fuelLine of fuelLines) {
    const trackKey = String(fuelLine.tracking_number || '').trim().toUpperCase();
    const poolHits = pool.get(trackKey) || [];
    if (poolHits.length > 0) {
      const charge = poolHits[0];
      // Fetch fuel cost for this shipment
      const fuelRes = await query(
        `SELECT COALESCE(SUM(cost_price), 0) AS fuel_cost
         FROM   charges
         WHERE  shipment_id   = $1
           AND  charge_type   = 'fuel'
           AND  cancelled     = false`,
        [charge.shipment_id]
      );
      expectedFuelTotal += parseFloat(fuelRes.rows[0]?.fuel_cost || 0);
    }
  }

  const fuelCheck = checkFuelAggregate(lines, expectedFuelTotal);

  // Insert fuel lines with aggregate result
  for (const fuelLine of fuelLines) {
    const fuelStatus = fuelLines.length > 0 ? fuelCheck.status : 'matched';
    const trackKey = String(fuelLine.tracking_number || '').trim().toUpperCase();
    const poolHits = pool.get(trackKey) || [];
    const charge   = poolHits[0] || null;

    await query(`
      INSERT INTO reconciliation_lines
        (run_id, tracking_number, carrier_account_no, raw_service_code, charge_type,
         carrier_amount, carrier_billed_weight_kg, service_id, customer_id, charge_id,
         expected_amount, delta, status, source, is_fuel, corrected_by, unmatched_reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15,$16)
    `, [
      runId,
      fuelLine.tracking_number || null,
      fuelLine.account_number  || null,
      fuelLine.service_code    || null,
      'fuel',
      round2(parseFloat(fuelLine.carrier_amount) || 0),
      fuelLine.billed_weight_kg || null,
      null,
      charge?.customer_id || null,
      charge?.charge_id   || null,
      round2(expectedFuelTotal / Math.max(fuelLines.length, 1)),
      null,
      fuelStatus,
      'internal',
      fuelStatus === 'matched' ? null : null,
      fuelStatus === 'unmatched' ? 'fuel_aggregate_mismatch' : null,
    ]);

    if (fuelStatus === 'matched') matched++;
    else unmatched++;
  }

  // ── Calculate automation rate ─────────────────────────────────────────────
  const total = lines.length;
  const autoResolved = matched + corrected;
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
    `automation: ${automationRate}%`);

  return {
    run_id:          runId,
    status:          overallStatus,
    total:           total,
    matched:         matched,
    corrected:       corrected,
    unmatched:       unmatched,
    ignored:         ignored,
    automation_rate: automationRate,
    duration_ms:     Date.now() - startTime,
  };
}

// ─── Process a single non-fuel line ──────────────────────────────────────────

async function processLine(line, runId, carrierId, serviceCodeMap, pool, mappings) {
  const trackingNumber = String(line.tracking_number || '').trim();
  const trackKey       = trackingNumber.toUpperCase();
  const rawServiceCode = String(line.service_code   || '').trim();
  const carrierAmount  = round2(parseFloat(line.carrier_amount) || 0);

  // ── Phase 1b: Service code normalisation ──────────────────────────────────
  const mappedKey = rawServiceCode.toUpperCase();
  const serviceId = serviceCodeMap[mappedKey] || null;

  if (!serviceId) {
    // No mapping — hard gate, immediately Unmatched
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
    });
    return { status: 'unmatched' };
  }

  // ── Phase 2: Safety Net — is tracking number in Verified Pool? ────────────
  const poolHits = pool.get(trackKey) || [];

  if (poolHits.length === 0) {
    // Not in verified pool — try account number (External Booking path)
    const customer = await lookupCustomerByAccount(line.account_number);

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
        expected_amount:          null,
        delta:                    null,
        status:                   'unmatched',
        corrected_by:             null,
        unmatched_reason:         'no_account_mapping',
        source:                   'internal',
      });
      return { status: 'unmatched' };
    }

    // External booking — synthesise expected amount from customer's quoted pricing
    const expectedAmount = await synthesiseExternalExpected(customer.customer_id, serviceId, line.billed_weight_kg);

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
      expected_amount:          expectedAmount,
      delta:                    expectedAmount !== null ? round2(carrierAmount - expectedAmount) : null,
      status:                   'unmatched',   // always review external bookings initially
      corrected_by:             null,
      unmatched_reason:         'external_booking_review',
      source:                   'external_booking',
    });
    return { status: 'unmatched' };
  }

  // ── Phase 3: Match & Compare ──────────────────────────────────────────────
  // Use best matching pool hit (prefer same service_id)
  const charge = poolHits.find(h => {
    const svcCode = (h.dc_service_id || '').trim().toUpperCase();
    // match if service_code from carrier_services matches the pool hit's dc_service_id
    return true; // simplified — use first hit
  }) || poolHits[0];

  const expectedAmount = round2(parseFloat(charge.total_cost_price) || 0);
  const delta          = round2(carrierAmount - expectedAmount);

  // Attach for mapping engine use
  line._expected_amount = expectedAmount;

  // ── Exact match? ──────────────────────────────────────────────────────────
  if (Math.abs(delta) < 0.02) {
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
      expected_amount:          expectedAmount,
      delta:                    delta,
      status:                   'matched',
      corrected_by:             null,
      unmatched_reason:         null,
      source:                   'internal',
    });
    return { status: 'matched' };
  }

  // ── Phase 4a: Mapping Engine ──────────────────────────────────────────────
  const mappingResult = applyMappings(mappings, line, delta);
  if (mappingResult?.applied) {
    // Increment mapping applied_count
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
      expected_amount:          expectedAmount,
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
    charge.customer_id, serviceId, carrierId, line, delta
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
      expected_amount:          expectedAmount,
      delta:                    delta,
      status:                   'corrected',
      corrected_by:             'pricing_rules',
      unmatched_reason:         null,
      source:                   'internal',
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
    expected_amount:          expectedAmount,
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

  // Look up customer's sell price for this service at this weight
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
       mapping_id, is_fuel)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
  `, [
    runId,
    data.tracking_number          || null,
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
  ]);
}

// ─── Age Unmatched lines from previous runs ───────────────────────────────────
// Called at the start of each new run to flag lines that have appeared
// Unmatched across >= 2 runs.

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
