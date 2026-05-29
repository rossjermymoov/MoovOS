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
    // Fire for any corrected line with surcharge_id set — covers both:
    //   • sell_surcharge_missing warnings (carrier billed a surcharge we never charged)
    //   • manually resolved map_to_surcharge lines (operator mapped an unmatched line to a surcharge)
    if (!line.surcharge_id) continue;
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

      // Idempotency: if the charge was already created at resolve time (map_to_surcharge),
      // charge_id on the line will point to a 'surcharge' charge — skip creation.
      if (line.charge_id) {
        const { rows: cTypeRows } = await query(
          `SELECT charge_type FROM charges WHERE id = $1 LIMIT 1`,
          [line.charge_id]
        );
        if (cTypeRows[0]?.charge_type === 'surcharge') {
          console.log(`[finalization] Surcharge charge already exists (id=${line.charge_id}), skipping creation for tracking=${line.tracking_number}`);
          continue;
        }
      }

      // Insert surcharge charge (explicit existence check — ON CONFLICT alone doesn't
      // prevent duplicates without a matching unique constraint on the table)
      const existRes = await query(`
        SELECT id FROM charges
        WHERE  customer_id  = $1
          AND  surcharge_id = $3
          AND  charge_type  = 'surcharge'
          AND  cancelled    = false
          AND  ($2::uuid IS NULL OR shipment_id = $2::uuid)
        LIMIT 1
      `, [line.customer_id, shipmentId, line.surcharge_id]);

      let chargeId = existRes.rows[0]?.id || null;
      if (!chargeId) {
        const chargeRes = await query(`
          INSERT INTO charges (
            customer_id, shipment_id, charge_type,
            surcharge_id, cost_price, sell_price, price,
            status, verified, despatch_date, source
          ) VALUES ($1,$2,'surcharge',$3,$4,$5,$5,'verified',true,$6,'recon_surcharge')
          RETURNING id
        `, [
          line.customer_id,
          shipmentId,
          line.surcharge_id,
          costAmt,
          sellAmt,
          despatchDate,
        ]);
        chargeId = chargeRes.rows[0]?.id || null;
      }

      if (chargeId) {
        // Back-populate charge_id on the recon line so subsequent reporting can trace it
        await query(
          `UPDATE reconciliation_lines SET charge_id = $1 WHERE id = $2`,
          [chargeId, line.id]
        );
        console.log(`[finalization] Surcharge charge linked: id=${chargeId} surcharge=${line.surcharge_id} sell=£${sellAmt} tracking=${line.tracking_number}`);
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
    parcel_count:            line.parcel_count || null,
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
  //
  // For map_to_surcharge lines, charge_id was updated at resolve time to point
  // to the newly created surcharge charge (not the original freight charge).
  // Using that surcharge charge for enrichment would set sell_base_amount to the
  // surcharge sell price and lose the real freight sell entirely.
  //
  // Fix: when the line has surcharge_id set (= map_to_surcharge resolved), find
  // the freight charge by joining from the surcharge charge's shipment_id.
  // corrected_sell_price on these lines = the surcharge sell, which is already
  // captured via the surcharge_detail subquery — don't apply it as sell_base.
  let enrichChargeId = line.charge_id;
  if (line.surcharge_id && line.charge_id) {
    try {
      const fcRes = await query(`
        SELECT c.id
        FROM   charges c
        JOIN   charges sc ON sc.shipment_id = c.shipment_id
        WHERE  sc.id           = $1
          AND  c.charge_type   = 'courier'
          AND  c.cancelled     = false
        ORDER  BY c.created_at DESC
        LIMIT  1
      `, [line.charge_id]);
      if (fcRes.rows.length) enrichChargeId = fcRes.rows[0].id;
    } catch (_) { /* non-fatal — fall back to line.charge_id */ }
  }

  if (enrichChargeId) {
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
      WHERE  c.id = $1  -- enrichChargeId (freight charge for surcharge lines, charge_id otherwise)
    `, [enrichChargeId]);

    if (enrichRes.rows.length) {
      const d = enrichRes.rows[0];
      // corrected_sell_price: recomputed at billed weight by the reconciliation engine
      // for corrected (mapping-adjusted) pool-matched lines. Takes priority over
      // the booking-time charges.price so the snapshot reflects the reconciled sell.
      //
      // For map_to_surcharge lines (surcharge_id set), corrected_sell_price is the
      // *surcharge* sell price — not the freight sell.  The surcharge sell is already
      // captured via the surcharge_detail subquery below (shipment's surcharge charges),
      // so we must NOT also apply it as sell_base here (that would double-count it and
      // push the freight sell to zero).  Only apply correctedSell for freight lines.
      const correctedSell = (line.corrected_sell_price != null && !line.surcharge_id)
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

  // ── Fallback: manually-corrected lines with no linked charge ─────────────
  //
  // manual_price and remap_service set corrected_sell_price but do NOT always
  // link a charge_id (external bookings, unmatched lines where the shipment was
  // not booked through Moov OS — common for reseller accounts like Boori EUR
  // whose DHL shipments originate elsewhere).
  //
  // In that case enrichChargeId is null, the block above never ran, and all sell
  // amounts remain at their initial zero defaults.  Apply the human's corrected
  // price here so the snapshot — and therefore the customer CSV — shows the
  // correct sell value rather than £0.00.
  //
  // corrected_sell_price for manual_price = base + fuel (resolve endpoint adds
  // the fuel surcharge % before storing).  We put the combined value into
  // sell_base_amount with sell_fuel_amount = 0 (no per-component breakdown
  // available without a shipment record).  The total is correct either way.
  if (snapshot.sell_base_amount === 0 && snapshot.sell_total_amount === 0 &&
      line.corrected_sell_price != null && !line.surcharge_id) {
    const correctedSell = round4(parseFloat(line.corrected_sell_price));
    if (correctedSell > 0) {
      snapshot.sell_base_amount  = correctedSell;
      snapshot.sell_total_amount = correctedSell;
      console.log(`[buildSnapshot] Applied corrected_sell_price=£${correctedSell} as sell_base for line ${line.id} (no charge_id) tracking=${line.tracking_number}`);
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
      parcel_count, weight_kg, service_name, service_code, despatch_date,
      carrier_base_amount, carrier_fuel_amount, carrier_surcharge_amount, carrier_total_amount,
      sell_base_amount, sell_fuel_amount, sell_surcharge_amount, sell_total_amount,
      surcharge_detail, recon_status, corrected_by, source
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
      $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
    )
    ON CONFLICT (reconciliation_line_id) DO NOTHING
  `, [
    runId, reconLineId, s.charge_id, s.customer_id, s.customer_name,
    s.tracking_number, s.order_reference, s.recipient_name, s.recipient_postcode,
    s.parcel_count || null, s.weight_kg, s.service_name, s.service_code, s.despatch_date,
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
    'Parcels',
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

    // Compute totals from the individual surcharge columns rather than the
    // snapshot sell_surcharge_amount / sell_total_amount fields.  Those fields
    // exclude reconciliation_excluded surcharges (e.g. Emergency Fuel Surcharge)
    // because they were designed for reconciliation comparison, not billing.
    // The CSV must show the full customer charge, so we sum every visible column.
    const namedSurchargeTotal = surchargeNamesSorted.reduce((sum, n) => sum + (surchargeMap[n] || 0), 0);
    const base = parseFloat(l.sell_base_amount || 0);
    const fuel = parseFloat(l.sell_fuel_amount || 0);
    const lineTotal = base + fuel + namedSurchargeTotal;

    return [
      l.tracking_number       || '',
      l.order_reference       || '',
      l.despatch_date ? new Date(l.despatch_date).toLocaleDateString('en-GB') : '',
      l.recipient_name        || '',
      l.recipient_postcode    || '',
      l.service_name          || '',
      l.parcel_count != null  ? l.parcel_count : '',
      l.weight_kg != null     ? parseFloat(l.weight_kg).toFixed(3) : '',
      base.toFixed(2),
      fuel.toFixed(2),
      ...surchargeNamesSorted.map(n => (surchargeMap[n] || 0).toFixed(2)),
      namedSurchargeTotal.toFixed(2),
      lineTotal.toFixed(2),
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
      parcelCount:    acc.parcelCount + (parseInt(l.parcel_count) || 0),
    };
  }, { base: 0, fuel: 0, surcharge: 0, total: 0, surchargeByName: {}, parcelCount: 0 });

  // Same logic as the per-row totals: sum from individual surcharge columns,
  // not from sell_surcharge_amount / sell_total_amount snapshot fields.
  const totalNamedSurcharge = surchargeNamesSorted.reduce((sum, n) => sum + (totals.surchargeByName[n] || 0), 0);
  const grandTotal = totals.base + totals.fuel + totalNamedSurcharge;

  rows.push([]); // blank separator
  rows.push([
    'TOTAL', '', '', '', '', '',
    totals.parcelCount > 0 ? totals.parcelCount : '',
    '',
    totals.base.toFixed(2),
    totals.fuel.toFixed(2),
    ...surchargeNamesSorted.map(n => (totals.surchargeByName[n] || 0).toFixed(2)),
    totalNamedSurcharge.toFixed(2),
    grandTotal.toFixed(2),
  ]);

  // Compute the Xero invoice number using the same logic as xero.js
  // so the CSV reference always matches what was (or will be) sent to Xero.
  const custName   = lines[0]?.customer_name || 'CUST';
  const custAbbrev = custName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const runDate    = run.invoice_date ? new Date(run.invoice_date) : new Date();
  const dd  = String(runDate.getDate()).padStart(2, '0');
  const mm  = String(runDate.getMonth() + 1).padStart(2, '0');
  const yy  = String(runDate.getFullYear()).slice(-2);
  const xeroInvoiceNumber = `${custAbbrev}-${dd}${mm}${yy}`;

  // Escape and join
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csvLines = [
    // Header block
    `"Moov OS — Carrier Invoice Reconciliation Export"`,
    `"Carrier: ${run.carrier_name || ''}"`,
    `"Invoice Number: ${xeroInvoiceNumber}"`,
    `"Customer: ${lines[0]?.customer_name || ''}"`,
    `"Generated: ${new Date().toLocaleString('en-GB')}"`,
    '',
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ];

  return csvLines.join('\r\n');
}

// ─── Re-snapshot a single customer within a finalized run ─────────────────────
//
// Deletes finalized_billing_lines for one customer in a run and re-builds them
// from the current state of the charges table.  Used after charge corrections
// (e.g. cancelled phantom surcharges, repriced multi-parcel charges) to refresh
// the snapshot without re-running the full reconciliation.
//
// The run must already be finalized.  Reconciliation_lines are not changed.

export async function reSnapshotCustomer(runId, customerId) {
  const runRes = await query(`SELECT * FROM reconciliation_runs WHERE id = $1`, [runId]);
  if (!runRes.rows.length) throw new Error('Run not found');
  const run = runRes.rows[0];
  if (!run.finalized) throw new Error('Run is not finalized — use the normal Finalize button instead');

  // Load this customer's matched/corrected lines
  const linesRes = await query(`
    SELECT rl.*
    FROM   reconciliation_lines rl
    WHERE  rl.run_id      = $1
      AND  rl.customer_id = $2
      AND  rl.status IN ('matched', 'corrected')
  `, [runId, customerId]);

  const lines = linesRes.rows;
  if (!lines.length) throw new Error('No matched or corrected lines found for this customer in this run');

  // Delete existing snapshots for this customer in this run
  const delRes = await query(
    `DELETE FROM finalized_billing_lines WHERE run_id = $1 AND customer_id = $2`,
    [runId, customerId]
  );
  const deleted = delRes.rowCount || 0;

  let inserted = 0;
  const errors = [];

  for (const line of lines) {
    try {
      const snapshot = await buildSnapshot(line, run);
      await insertSnapshot(runId, line.id, snapshot);
      inserted++;
    } catch (err) {
      errors.push({ line_id: line.id, tracking: line.tracking_number, error: err.message });
      console.error(`[re-snapshot-customer] Failed line ${line.id} (${line.tracking_number}):`, err.message);
    }
  }

  console.log(`[re-snapshot-customer] Run ${runId} / customer ${customerId}: deleted=${deleted} inserted=${inserted} errors=${errors.length}`);
  return { deleted, inserted, errors };
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
