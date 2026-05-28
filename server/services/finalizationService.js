/**
 * Moov OS — Finalization Service
 *
 * Called when a Reconciliation Run is marked 'finalized'.
 * Copies all Matched and Corrected reconciliation lines into the
 * finalized_billing_lines table as an immutable snapshot.
 *
 * The snapshot captures:
 *   - Carrier cost breakdown (base / fuel / surcharges) — from recon line + charges table
 *   - Customer sell breakdown (base / fuel / surcharges) — from our charges table
 *   - Per-surcharge-type Buy/Sell breakdown — stored as JSONB in surcharge_detail
 *   - Shipment metadata (tracking, recipient, postcode, weight) — from shipments table
 *
 * Once written, finalized_billing_lines rows are never updated (except for
 * xero_invoice_id, xero_pushed_at, and csv_exported_at tracking fields).
 *
 * External booking catch-up:
 *   For source = 'external_booking' lines (bookings not made through Moov OS),
 *   we update customers.real_time_balance by adding the sell_total_amount so the
 *   exposure calculation stays accurate even before Xero is updated.
 */

import { query } from '../db/index.js';

function round4(n) { return Math.round(n * 10000) / 10000; }

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * finalizeRun
 *
 * @param {number} runId   — reconciliation_runs.id
 * @param {number|null} staffId — staff.id who triggered finalization
 * @returns {Promise<{ lines_finalized: number, customers: number, external_balance_updates: number }>}
 */
export async function finalizeRun(runId, staffId = null) {
  // Guard: check run exists and is not already finalized
  const runRes = await query(
    `SELECT * FROM reconciliation_runs WHERE id = $1`,
    [runId]
  );
  if (!runRes.rows.length) throw new Error('Run not found');
  const run = runRes.rows[0];
  if (run.finalized) throw new Error('Run is already finalized');
  if (run.unmatched_count > 0) {
    throw new Error(`Cannot finalize: ${run.unmatched_count} Unmatched line(s) remain. Resolve or dismiss them first.`);
  }

  // ── Load all matched + corrected lines for this run ───────────────────────
  const linesRes = await query(`
    SELECT rl.*
    FROM   reconciliation_lines rl
    WHERE  rl.run_id = $1
      AND  rl.status IN ('matched', 'corrected')
  `, [runId]);

  const lines = linesRes.rows;
  if (!lines.length) {
    throw new Error('No matched or corrected lines to finalize');
  }

  let finalized = 0;
  let externalBalanceUpdates = 0;

  // ── Step 0: Insert pending DDP admin charges ──────────────────────────────
  //
  // ddp_admin reconciliation lines were created by the engine without a charge_id
  // (the engine never writes to the charges table — that's our job here at finalize
  // time). We insert the charge now and back-populate charge_id on the recon line
  // so buildSnapshot can enrich from the charges table normally.
  // ── Step 0.5: Create surcharge charges for resolved sell_surcharge_missing lines ──
  //
  // When a carrier bills a surcharge that has no sell-side equivalent (sell_surcharge_missing
  // warning lines), the operator resolves them as map_to_surcharge and sets corrected_sell_price.
  // We now create an actual charges record (charge_type='surcharge') so that:
  //   1. buildSnapshot picks it up via the sell_surcharge subquery on the freight line.
  //   2. The customer CSV export shows the surcharge as a named line-item column.
  //   3. The customer is actually billed for it.
  //
  // We look up the shipment via the freight line (same tracking, surcharge_id IS NULL, has charge_id)
  // rather than the tracking_codes array, which is more reliable for DPD-style prefixed numbers.
  for (const line of lines) {
    if (line.unmatched_reason !== 'sell_surcharge_missing' || !line.surcharge_id) continue;
    if (line.status !== 'corrected' || !line.corrected_sell_price) continue;

    try {
      const sellAmt = round4(parseFloat(line.corrected_sell_price) || 0);
      const costAmt = round4(parseFloat(line.carrier_amount) || 0);
      if (sellAmt <= 0) continue;

      // Find shipment_id from the freight counterpart line (same run + tracking, no surcharge_id)
      const freightRes = await query(`
        SELECT ch.shipment_id, ch.customer_id, sh.despatch_date
        FROM   reconciliation_lines rl2
        JOIN   charges ch ON ch.id = rl2.charge_id
        LEFT JOIN shipments sh ON sh.id = ch.shipment_id
        WHERE  rl2.run_id           = $1
          AND  rl2.tracking_number  = $2
          AND  rl2.surcharge_id    IS NULL
          AND  rl2.charge_id       IS NOT NULL
        LIMIT 1
      `, [line.run_id, line.tracking_number]);

      const shipmentId  = freightRes.rows[0]?.shipment_id  || null;
      const despatchDate = freightRes.rows[0]?.despatch_date || line.shipment_date || null;

      // Insert surcharge charge (idempotent — ON CONFLICT skips duplicates)
      const chargeRes = await query(`
        INSERT INTO charges (
          customer_id, shipment_id, charge_type,
          surcharge_id, cost_price, sell_price, price,
          status, verified, despatch_date, source
        ) VALUES ($1,$2,'surcharge', $3,$4,$5,$5, 'verified',true,$6,'recon_surcharge')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        line.customer_id,
        shipmentId,
        line.surcharge_id,
        costAmt,
        sellAmt,
        despatchDate,
      ]);

      const chargeId = chargeRes.rows[0]?.id || null;
      if (chargeId) {
        // Back-populate charge_id on the recon line so subsequent reporting can trace it
        await query(
          `UPDATE reconciliation_lines SET charge_id = $1 WHERE id = $2`,
          [chargeId, line.id]
        );
        console.log(`[finalization] Surcharge charge created: id=${chargeId} surcharge=${line.surcharge_id} sell=£${sellAmt} tracking=${line.tracking_number}`);
      }
    } catch (surchargeErr) {
      console.error(`[finalization] Surcharge charge creation failed for tracking=${line.tracking_number}:`, surchargeErr.message);
      // Non-fatal — continue
    }
  }

  for (const line of lines) {
    if (line.source !== 'ddp_admin' || line.charge_id) continue;

    try {
      // Resolve shipment_id from tracking number
      const shipRes = await query(
        `SELECT s.id FROM shipments s WHERE $1 = ANY(s.tracking_codes) LIMIT 1`,
        [line.tracking_number]
      );
      const shipmentId = shipRes.rows[0]?.id || null;

      const fee = round4(parseFloat(line.corrected_sell_price) || 0);
      if (fee <= 0) continue;  // skip zero-fee lines (shouldn't happen but guard anyway)

      // Insert charge (idempotent — ON CONFLICT DO NOTHING)
      const chargeRes = await query(`
        INSERT INTO charges (
          customer_id, shipment_id, charge_type,
          cost_price, sell_price, price,
          status, verified, despatch_date,
          pricing_logic_trace, source
        ) VALUES ($1,$2,'ddp_admin', 0,$3,$3, 'verified',true,$4, $5,'ddp_admin_finalized')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        line.customer_id,
        shipmentId,
        fee,
        line.shipment_date || null,
        line.correction_metadata || null,
      ]);

      let chargeId = chargeRes.rows[0]?.id || null;

      // If ON CONFLICT fired, find the existing charge
      if (!chargeId && shipmentId) {
        const existingRes = await query(
          `SELECT id FROM charges WHERE shipment_id = $1 AND charge_type = 'ddp_admin' AND cancelled = false LIMIT 1`,
          [shipmentId]
        );
        chargeId = existingRes.rows[0]?.id || null;
      }

      if (chargeId) {
        // Back-populate so buildSnapshot can enrich from the charges table
        line.charge_id = chargeId;
        await query(
          `UPDATE reconciliation_lines SET charge_id = $1 WHERE id = $2`,
          [chargeId, line.id]
        );
        console.log(`[finalization] DDP admin charge created: id=${chargeId} customer=${line.customer_id} fee=£${fee} tracking=${line.tracking_number}`);
      }
    } catch (ddpErr) {
      console.error(`[finalization] DDP admin charge failed for tracking=${line.tracking_number}:`, ddpErr.message);
      // Non-fatal — continue without the ddp_admin line
    }
  }

  for (const line of lines) {
    try {
      const snapshot = await buildSnapshot(line, run);
      await insertSnapshot(runId, line.id, snapshot);
      finalized++;

      // ── External Booking Catch-up ────────────────────────────────────────
      // For shipments booked outside Moov OS we have no charge record in our
      // DB, so the real_time_balance was never incremented at label creation.
      // We add the sell_total_amount now so Total Exposure stays accurate.
      if (line.source === 'external_booking' && snapshot.sell_total_amount > 0) {
        try {
          await query(`
            UPDATE customers
            SET    real_time_balance = real_time_balance + $2
            WHERE  id = $1
          `, [snapshot.customer_id, snapshot.sell_total_amount]);
          externalBalanceUpdates++;
        } catch (balErr) {
          console.error(`[finalization] Failed to update real_time_balance for customer ${snapshot.customer_id}:`, balErr.message);
        }
      }

    } catch (err) {
      console.error(`[finalization] Failed to snapshot line ${line.id}:`, err.message);
      // Continue — don't fail the whole run for one bad line
    }
  }

  // ── Write reconciled cost + sell back to charges ──────────────────────────
  //
  // For corrected pool-matched lines the reconciliation engine computed:
  //   corrected_cost_price = carrier_amount          (actual billed cost)
  //   corrected_sell_price = customer rate at billed weight (actual sell)
  //
  // We now write these back to the charges table so the finance table and
  // any downstream reports reflect the permanently reconciled figures.
  //   - cost_price → corrected_cost_price (what the carrier actually billed)
  //   - sell_price → corrected_sell_price (customer rate at billed weight)
  //   - price      → corrected_sell_price (legacy sell column mirrors sell_price)
  //   - recon_corrected → true (guard against double-finalization)
  //
  // Only applies to lines that have corrected values AND a linked charge.
  // Matched lines (cost ≈ expected, sell unchanged) are not touched.
  // Carrier-direct charges already have correct cost/sell from creation time.
  try {
    const writeBackRes = await query(`
      UPDATE charges c
      SET    cost_price      = rl.corrected_cost_price,
             sell_price      = rl.corrected_sell_price,
             price           = rl.corrected_sell_price,
             recon_corrected = true,
             updated_at      = NOW()
      FROM   reconciliation_lines rl
      WHERE  rl.run_id               = $1
        AND  rl.charge_id            = c.id
        AND  rl.corrected_sell_price IS NOT NULL
        AND  rl.corrected_cost_price IS NOT NULL
        AND  rl.surcharge_id         IS NULL      -- exclude CSV-column surcharge lines
        AND  c.recon_corrected       = false
    `, [runId]);
    const wbCount = writeBackRes.rowCount || 0;
    if (wbCount > 0) {
      console.log(`[finalization] Run ${runId}: wrote reconciled cost/sell back to ${wbCount} charge(s)`);
    }
  } catch (wbErr) {
    console.error(`[finalization] Run ${runId}: charge write-back failed (non-fatal):`, wbErr.message);
    // Non-fatal — finalization continues; charges retain booking-time values
  }

  // ── Mark run as finalized ─────────────────────────────────────────────────
  await query(`
    UPDATE reconciliation_runs
    SET finalized    = true,
        finalized_at = NOW(),
        finalized_by = $2,
        status       = 'complete'
    WHERE id = $1
  `, [runId, staffId]);

  // ── Count distinct customers ──────────────────────────────────────────────
  const custRes = await query(
    `SELECT COUNT(DISTINCT customer_id) AS cnt FROM finalized_billing_lines WHERE run_id = $1`,
    [runId]
  );
  const customers = parseInt(custRes.rows[0]?.cnt || 0);

  console.log(
    `[finalization] Run ${runId} finalized: ${finalized} lines, ${customers} customers, ` +
    `${externalBalanceUpdates} external balance update(s)`
  );

  return { lines_finalized: finalized, customers, external_balance_updates: externalBalanceUpdates };
}

// ─── Build snapshot for a single reconciliation line ─────────────────────────

async function buildSnapshot(line, run) {
  // Start with what we know from the reconciliation line itself
  const snapshot = {
    charge_id:               line.charge_id || null,
    customer_id:             line.customer_id,
    tracking_number:         line.tracking_number,
    recon_status:            line.status,
    corrected_by:            line.corrected_by || null,
    source:                  line.source || 'internal',
    // Carrier amounts: use carrier_amount from the recon line (split fuel separately)
    carrier_base_amount:     line.is_fuel ? 0 : round4(parseFloat(line.carrier_amount) || 0),
    carrier_fuel_amount:     line.is_fuel ? round4(parseFloat(line.carrier_amount) || 0) : 0,
    carrier_surcharge_amount: 0,
    carrier_total_amount:    round4(parseFloat(line.carrier_amount) || 0),
    // Defaults — overridden below if we find the charge record
    sell_base_amount:        0,
    sell_fuel_amount:        0,
    sell_surcharge_amount:   0,
    sell_total_amount:       0,
    surcharge_detail:        null,
    customer_name:           null,
    order_reference:         null,
    recipient_name:          null,
    recipient_postcode:      null,
    weight_kg:               line.carrier_billed_weight_kg || null,
    service_name:            null,
    service_code:            null,
    // Use the per-row shipment date from the CSV as the initial despatch_date.
    // For internal bookings (charge_id present), this is overridden below by
    // shipments.despatch_date from the charge enrichment query.
    // For external bookings and OMS-missed lines (charge_id null), this is the
    // only source of a despatch date — it comes from the DPD "Date" column etc.
    despatch_date:           line.shipment_date || null,
  };

  // ── Enrich from our charges table + shipments ─────────────────────────────
  if (line.charge_id) {
    const enrichRes = await query(`
      SELECT
        c.shipment_id,
        c.order_id                         AS order_reference,
        c.price                            AS sell_base,
        c.cost_price                       AS cost_base,
        cu.business_name                   AS customer_name,
        s.ship_to_name                     AS recipient_name,
        s.ship_to_postcode                 AS postcode,
        s.total_weight_kg                  AS weight_kg,
        s.dc_service_id                    AS service_code,
        s.collection_date                  AS despatch_date,
        cs.name                            AS service_name,
        -- Fuel sell (for this shipment, excluding recon-excluded surcharges)
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = c.shipment_id
            AND  sc.charge_type = 'fuel'
            AND  sc.cancelled   = false
            AND  NOT EXISTS (
              SELECT 1 FROM surcharges sx
              WHERE sx.id = sc.surcharge_id
                AND sx.reconciliation_excluded = true
            )
        ), 0)                              AS sell_fuel,
        -- Surcharge sell (non-fuel, non-recon-excluded)
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = c.shipment_id
            AND  sc.charge_type = 'surcharge'
            AND  sc.cancelled   = false
            AND  NOT EXISTS (
              SELECT 1 FROM surcharges sx
              WHERE sx.id = sc.surcharge_id
                AND sx.reconciliation_excluded = true
            )
        ), 0)                             AS sell_surcharge,
        -- Fuel cost (what we paid carrier for fuel for this shipment)
        COALESCE((
          SELECT SUM(sc.cost_price)
          FROM   charges sc
          WHERE  sc.shipment_id = c.shipment_id
            AND  sc.charge_type = 'fuel'
            AND  sc.cancelled   = false
        ), 0)                             AS cost_fuel,
        -- Surcharge cost
        COALESCE((
          SELECT SUM(sc.cost_price)
          FROM   charges sc
          WHERE  sc.shipment_id = c.shipment_id
            AND  sc.charge_type = 'surcharge'
            AND  sc.cancelled   = false
        ), 0)                             AS cost_surcharge
      FROM   charges         c
      LEFT JOIN customers    cu ON cu.id = c.customer_id
      LEFT JOIN shipments     s ON s.id  = c.shipment_id
      LEFT JOIN courier_services cs ON cs.id = (
        SELECT id FROM courier_services WHERE service_code ILIKE s.dc_service_id LIMIT 1
      )
      WHERE  c.id = $1
    `, [line.charge_id]);

    if (enrichRes.rows.length) {
      const d = enrichRes.rows[0];
      // corrected_sell_price: recomputed at billed weight by the reconciliation engine
      // for corrected (mapping-adjusted) pool-matched lines. Takes priority over
      // the booking-time charges.price so the snapshot reflects the reconciled sell.
      const correctedSell = line.corrected_sell_price != null
        ? round4(parseFloat(line.corrected_sell_price))
        : null;
      const sellBase      = correctedSell ?? round4(parseFloat(d.sell_base || 0));
      const sellFuel      = round4(parseFloat(d.sell_fuel       || 0));
      const sellSurcharge = round4(parseFloat(d.sell_surcharge  || 0));

      Object.assign(snapshot, {
        customer_name:           d.customer_name           || null,
        order_reference:         d.order_reference         || null,
        recipient_name:          d.recipient_name          || null,
        recipient_postcode:      d.postcode                || null,
        weight_kg:               d.weight_kg ? round4(parseFloat(d.weight_kg)) : snapshot.weight_kg,
        service_name:            d.service_name            || null,
        service_code:            d.service_code            || null,
        despatch_date:           d.despatch_date           || null,

        sell_base_amount:        sellBase,
        sell_fuel_amount:        sellFuel,
        sell_surcharge_amount:   sellSurcharge,
        sell_total_amount:       round4(sellBase + sellFuel + sellSurcharge),

        // Refine carrier amounts using actual charge cost_price where available
        carrier_base_amount:     line.is_fuel ? 0 : round4(parseFloat(line.carrier_amount) || 0),
        carrier_fuel_amount:     line.is_fuel ? round4(parseFloat(line.carrier_amount) || 0)
                                             : round4(parseFloat(d.cost_fuel || 0)),
        carrier_surcharge_amount: round4(parseFloat(d.cost_surcharge || 0)),
        carrier_total_amount:    round4(parseFloat(line.carrier_amount) || 0),
      });

      // ── Per-surcharge-type detail (JSONB) ──────────────────────────────
      // Fetch each individual surcharge charge row for this shipment so we can
      // store a named breakdown (e.g. Long Length, Remote Area, etc.) for both
      // Buy and Sell sides.  reconciliation_excluded surcharges are included in
      // the detail record but flagged — they contribute to the raw cost/sell
      // figures even though they were excluded from the recon comparison.
      if (d.shipment_id) {
        const surchargeRes = await query(`
          SELECT
            sc.id                        AS charge_id,
            sx.id                        AS surcharge_id,
            sx.name                      AS surcharge_name,
            sc.charge_type,
            sc.price                     AS sell_amount,
            sc.cost_price                AS cost_amount,
            sx.reconciliation_excluded   AS recon_excluded
          FROM charges sc
          LEFT JOIN surcharges sx ON sx.id = sc.surcharge_id
          WHERE sc.shipment_id = $1
            AND sc.charge_type IN ('fuel', 'surcharge')
            AND sc.cancelled = false
          ORDER BY sc.charge_type, sx.name
        `, [d.shipment_id]);

        if (surchargeRes.rows.length) {
          snapshot.surcharge_detail = surchargeRes.rows.map(r => ({
            surcharge_id:    r.surcharge_id   || null,
            surcharge_name:  r.surcharge_name || r.charge_type,
            charge_type:     r.charge_type,
            sell_amount:     round4(parseFloat(r.sell_amount  || 0)),
            cost_amount:     round4(parseFloat(r.cost_amount  || 0)),
            recon_excluded:  r.recon_excluded || false,
          }));
        }
      }
    }
  }

  // If we still don't have a customer_name, fetch it directly
  if (!snapshot.customer_name && snapshot.customer_id) {
    const cRes = await query(
      `SELECT business_name FROM customers WHERE id = $1`,
      [snapshot.customer_id]
    );
    snapshot.customer_name = cRes.rows[0]?.business_name || null;
  }

  return snapshot;
}

// ─── Insert snapshot row ──────────────────────────────────────────────────────

async function insertSnapshot(runId, reconLineId, s) {
  await query(`
    INSERT INTO finalized_billing_lines (
      run_id, reconciliation_line_id, charge_id, customer_id, customer_name,
      tracking_number, order_reference, recipient_name, recipient_postcode,
      weight_kg, service_name, service_code, despatch_date,
      carrier_base_amount, carrier_fuel_amount, carrier_surcharge_amount, carrier_total_amount,
      sell_base_amount, sell_fuel_amount, sell_surcharge_amount, sell_total_amount,
      surcharge_detail, recon_status, corrected_by, source
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
      $14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
    )
    ON CONFLICT (reconciliation_line_id) DO NOTHING
  `, [
    runId, reconLineId, s.charge_id, s.customer_id, s.customer_name,
    s.tracking_number, s.order_reference, s.recipient_name, s.recipient_postcode,
    s.weight_kg, s.service_name, s.service_code, s.despatch_date,
    s.carrier_base_amount, s.carrier_fuel_amount, s.carrier_surcharge_amount, s.carrier_total_amount,
    s.sell_base_amount, s.sell_fuel_amount, s.sell_surcharge_amount, s.sell_total_amount,
    s.surcharge_detail ? JSON.stringify(s.surcharge_detail) : null,
    s.recon_status, s.corrected_by, s.source,
  ]);
}

// ─── Re-snapshot: recovery for finalized runs with empty billing lines ────────
//
// Re-runs only the INSERT step for a run that is already finalized but has
// missing rows in finalized_billing_lines (e.g. DB error silently swallowed
// during original finalization). Uses ON CONFLICT DO NOTHING so safe to repeat.

export async function reSnapshot(runId) {
  const runRes = await query(`SELECT * FROM reconciliation_runs WHERE id = $1`, [runId]);
  if (!runRes.rows.length) throw new Error('Run not found');
  const run = runRes.rows[0];
  if (!run.finalized) throw new Error('Run is not finalized — use the normal Finalize button instead');

  const linesRes = await query(`
    SELECT rl.*
    FROM   reconciliation_lines rl
    WHERE  rl.run_id = $1
      AND  rl.status IN ('matched', 'corrected')
  `, [runId]);

  const lines = linesRes.rows;
  if (!lines.length) throw new Error('No matched or corrected lines found for this run');

  let inserted = 0;
  let skipped  = 0;
  const errors = [];

  for (const line of lines) {
    try {
      const snapshot = await buildSnapshot(line, run);
      const before = await query(
        `SELECT id FROM finalized_billing_lines WHERE reconciliation_line_id = $1`, [line.id]
      );
      if (before.rows.length) {
        skipped++;
        continue;
      }
      await insertSnapshot(runId, line.id, snapshot);
      inserted++;
    } catch (err) {
      errors.push({ line_id: line.id, tracking: line.tracking_number, error: err.message });
      console.error(`[re-snapshot] Failed line ${line.id} (${line.tracking_number}):`, err.message);
    }
  }

  console.log(`[re-snapshot] Run ${runId}: inserted=${inserted} skipped=${skipped} errors=${errors.length}`);
  return { inserted, skipped, errors };
}

// ─── Customer summary for a finalized run ─────────────────────────────────────

export async function getCustomerSummaries(runId) {
  const res = await query(`
    SELECT
      f.customer_id,
      f.customer_name,
      cu.xero_contact_id,
      COUNT(*)                          AS line_count,
      SUM(f.sell_base_amount)           AS total_base,
      SUM(f.sell_fuel_amount)           AS total_fuel,
      SUM(f.sell_surcharge_amount)      AS total_surcharge,
      SUM(f.sell_total_amount)          AS total_sell,
      SUM(f.carrier_total_amount)       AS total_carrier_cost,
      SUM(f.margin_amount)              AS total_margin,
      COUNT(*) FILTER (WHERE f.xero_pushed_at IS NOT NULL) AS xero_pushed_count,
      MAX(f.xero_invoice_id)            AS xero_invoice_id,
      MAX(f.xero_pushed_at)             AS xero_pushed_at,
      MAX(f.xero_push_error)            AS xero_push_error
    FROM   finalized_billing_lines f
    LEFT JOIN customers cu ON cu.id = f.customer_id
    WHERE  f.run_id = $1
    GROUP  BY f.customer_id, f.customer_name, cu.xero_contact_id
    ORDER  BY f.customer_name
  `, [runId]);

  return res.rows.map(r => ({
    ...r,
    total_base:         round4(parseFloat(r.total_base || 0)),
    total_fuel:         round4(parseFloat(r.total_fuel || 0)),
    total_surcharge:    round4(parseFloat(r.total_surcharge || 0)),
    total_sell:         round4(parseFloat(r.total_sell || 0)),
    total_carrier_cost: round4(parseFloat(r.total_carrier_cost || 0)),
    total_margin:       round4(parseFloat(r.total_margin || 0)),
    line_count:         parseInt(r.line_count || 0),
    xero_pushed_count:  parseInt(r.xero_pushed_count || 0),
    xero_linked:        !!r.xero_contact_id,
  }));
}

// ─── Generate customer CSV ────────────────────────────────────────────────────

export async function generateCustomerCSV(runId, customerId) {
  // Fetch run metadata
  const runRes = await query(
    `SELECT rr.*, c.name AS carrier_name
     FROM   reconciliation_runs rr
     LEFT JOIN couriers c ON c.id = rr.carrier_id
     WHERE  rr.id = $1`,
    [runId]
  );
  if (!runRes.rows.length) throw new Error('Run not found');
  const run = runRes.rows[0];

  // Fetch lines for this customer
  const linesRes = await query(`
    SELECT f.*
    FROM   finalized_billing_lines f
    WHERE  f.run_id      = $1
      AND  f.customer_id = $2
    ORDER  BY f.despatch_date ASC, f.tracking_number ASC
  `, [runId, customerId]);

  const lines = linesRes.rows;
  if (!lines.length) throw new Error('No finalized lines found for this customer in this run');

  // Update CSV export timestamp
  await query(`
    UPDATE finalized_billing_lines
    SET csv_exported_at = NOW()
    WHERE run_id = $1 AND customer_id = $2
  `, [runId, customerId]);

  // Collect all distinct surcharge names across this customer's lines so we
  // can produce individual surcharge columns in the CSV.
  const surchargeNames = new Set();
  for (const l of lines) {
    const detail = Array.isArray(l.surcharge_detail)
      ? l.surcharge_detail
      : (l.surcharge_detail ? JSON.parse(l.surcharge_detail) : []);
    for (const s of detail) {
      if (s.charge_type === 'surcharge') surchargeNames.add(s.surcharge_name);
    }
  }
  const surchargeNamesSorted = [...surchargeNames].sort();

  const headers = [
    'Tracking Number',
    'Order Reference',
    'Despatch Date',
    'Recipient Name',
    'Postcode',
    'Service',
    'Weight (kg)',
    'Base Charge (£)',
    'Fuel Charge (£)',
    ...surchargeNamesSorted.map(n => `${n} (£)`),
    'Total Surcharges (£)',
    'Line Total (£)',
  ];

  const rows = lines.map(l => {
    const detail = Array.isArray(l.surcharge_detail)
      ? l.surcharge_detail
      : (l.surcharge_detail ? JSON.parse(l.surcharge_detail) : []);

    // Build per-named-surcharge sell amounts
    const surchargeMap = {};
    for (const s of detail) {
      if (s.charge_type === 'surcharge') {
        surchargeMap[s.surcharge_name] = (surchargeMap[s.surcharge_name] || 0) + (s.sell_amount || 0);
      }
    }

    return [
      l.tracking_number       || '',
      l.order_reference       || '',
      l.despatch_date ? new Date(l.despatch_date).toLocaleDateString('en-GB') : '',
      l.recipient_name        || '',
      l.recipient_postcode    || '',
      l.service_name          || '',
      l.weight_kg != null     ? parseFloat(l.weight_kg).toFixed(3) : '',
      parseFloat(l.sell_base_amount      || 0).toFixed(2),
      parseFloat(l.sell_fuel_amount      || 0).toFixed(2),
      ...surchargeNamesSorted.map(n => (surchargeMap[n] || 0).toFixed(2)),
      parseFloat(l.sell_surcharge_amount || 0).toFixed(2),
      parseFloat(l.sell_total_amount     || 0).toFixed(2),
    ];
  });

  // Summary totals row
  const totals = lines.reduce((acc, l) => {
    const detail = Array.isArray(l.surcharge_detail)
      ? l.surcharge_detail
      : (l.surcharge_detail ? JSON.parse(l.surcharge_detail) : []);
    const surchargeMap = {};
    for (const s of detail) {
      if (s.charge_type === 'surcharge') {
        surchargeMap[s.surcharge_name] = (surchargeMap[s.surcharge_name] || 0) + (s.sell_amount || 0);
      }
    }
    for (const n of surchargeNamesSorted) {
      acc.surchargeByName[n] = (acc.surchargeByName[n] || 0) + (surchargeMap[n] || 0);
    }
    return {
      base:           acc.base      + parseFloat(l.sell_base_amount      || 0),
      fuel:           acc.fuel      + parseFloat(l.sell_fuel_amount      || 0),
      surcharge:      acc.surcharge + parseFloat(l.sell_surcharge_amount || 0),
      total:          acc.total     + parseFloat(l.sell_total_amount     || 0),
      surchargeByName: acc.surchargeByName,
    };
  }, { base: 0, fuel: 0, surcharge: 0, total: 0, surchargeByName: {} });

  rows.push([]); // blank separator
  rows.push([
    'TOTAL', '', '', '', '', '', '',
    totals.base.toFixed(2),
    totals.fuel.toFixed(2),
    ...surchargeNamesSorted.map(n => (totals.surchargeByName[n] || 0).toFixed(2)),
    totals.surcharge.toFixed(2),
    totals.total.toFixed(2),
  ]);

  // Escape and join
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csvLines = [
    // Header block
    `"Moov OS — Carrier Invoice Reconciliation Export"`,
    `"Carrier: ${run.carrier_name || ''}"`,
    `"Invoice Ref: ${run.invoice_ref || ''}"`,
    `"Run ID: ${run.id}"`,
    `"Customer: ${lines[0]?.customer_name || ''}"`,
    `"Generated: ${new Date().toLocaleString('en-GB')}"`,
    '',
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ];

  return csvLines.join('\r\n');
}

// ─── Margin report for all finalized runs ─────────────────────────────────────

export async function getMarginReport({ carrierId, limit = 20, offset = 0 } = {}) {
  const params = [];
  const where = carrierId ? `WHERE rr.carrier_id = $${params.push(carrierId)}` : '';

  const res = await query(`
    SELECT *
    FROM   reconciliation_margin_view rr
    ${where}
    ORDER  BY rr.finalized_at DESC
    LIMIT  $${params.push(limit)} OFFSET $${params.push(offset)}
  `, params);

  const countRes = await query(`
    SELECT COUNT(*) AS total
    FROM   reconciliation_margin_view
    ${where ? where.replace(/rr\./g, '') : ''}
  `, carrierId ? [carrierId] : []);

  return {
    rows:  res.rows,
    total: parseInt(countRes.rows[0]?.total || 0),
  };
}
