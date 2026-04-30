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
 *   - Shipment metadata (tracking, recipient, postcode, weight) — from shipments table
 *
 * Once written, finalized_billing_lines rows are never updated (except for
 * xero_invoice_id, xero_pushed_at, and csv_exported_at tracking fields).
 */

import { query } from '../db/index.js';

function round4(n) { return Math.round(n * 10000) / 10000; }

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * finalizeRun
 *
 * @param {number} runId   — reconciliation_runs.id
 * @param {number|null} staffId — staff.id who triggered finalization
 * @returns {Promise<{ lines_finalized: number, customers: number }>}
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

  for (const line of lines) {
    try {
      const snapshot = await buildSnapshot(line, run);
      await insertSnapshot(runId, line.id, snapshot);
      finalized++;
    } catch (err) {
      console.error(`[finalization] Failed to snapshot line ${line.id}:`, err.message);
      // Continue — don't fail the whole run for one bad line
    }
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

  console.log(`[finalization] Run ${runId} finalized: ${finalized} lines, ${customers} customers`);

  return { lines_finalized: finalized, customers };
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
    customer_name:           null,
    order_reference:         null,
    recipient_name:          null,
    recipient_postcode:      null,
    weight_kg:               line.carrier_billed_weight_kg || null,
    service_name:            null,
    service_code:            null,
    despatch_date:           null,
  };

  // ── Enrich from our charges table + shipments ─────────────────────────────
  if (line.charge_id) {
    const enrichRes = await query(`
      SELECT
        c.order_id                         AS order_reference,
        c.price                            AS sell_base,
        c.cost_price                       AS cost_base,
        cu.business_name                   AS customer_name,
        s.ship_to_name                     AS recipient_name,
        s.ship_to_postcode                 AS postcode,
        s.total_weight_kg                  AS weight_kg,
        s.dc_service_id                    AS service_code,
        s.despatch_date,
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
      const sellBase      = round4(parseFloat(d.sell_base       || 0));
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
      recon_status, corrected_by, source
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
      $14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
    )
    ON CONFLICT (reconciliation_line_id) DO NOTHING
  `, [
    runId, reconLineId, s.charge_id, s.customer_id, s.customer_name,
    s.tracking_number, s.order_reference, s.recipient_name, s.recipient_postcode,
    s.weight_kg, s.service_name, s.service_code, s.despatch_date,
    s.carrier_base_amount, s.carrier_fuel_amount, s.carrier_surcharge_amount, s.carrier_total_amount,
    s.sell_base_amount, s.sell_fuel_amount, s.sell_surcharge_amount, s.sell_total_amount,
    s.recon_status, s.corrected_by, s.source,
  ]);
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
      MAX(f.xero_pushed_at)             AS xero_pushed_at
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
    WHERE  f.run_id     = $1
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

  // Build CSV
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
    'Surcharges (£)',
    'Line Total (£)',
    'Status',
  ];

  const rows = lines.map(l => [
    l.tracking_number       || '',
    l.order_reference       || '',
    l.despatch_date ? new Date(l.despatch_date).toLocaleDateString('en-GB') : '',
    l.recipient_name        || '',
    l.recipient_postcode    || '',
    l.service_name          || '',
    l.weight_kg != null     ? parseFloat(l.weight_kg).toFixed(3) : '',
    parseFloat(l.sell_base_amount      || 0).toFixed(2),
    parseFloat(l.sell_fuel_amount      || 0).toFixed(2),
    parseFloat(l.sell_surcharge_amount || 0).toFixed(2),
    parseFloat(l.sell_total_amount     || 0).toFixed(2),
    l.recon_status          || '',
  ]);

  // Summary totals row
  const totals = lines.reduce((acc, l) => ({
    base:      acc.base      + parseFloat(l.sell_base_amount      || 0),
    fuel:      acc.fuel      + parseFloat(l.sell_fuel_amount      || 0),
    surcharge: acc.surcharge + parseFloat(l.sell_surcharge_amount || 0),
    total:     acc.total     + parseFloat(l.sell_total_amount     || 0),
  }), { base: 0, fuel: 0, surcharge: 0, total: 0 });

  rows.push([]); // blank separator
  rows.push([
    'TOTAL', '', '', '', '', '', '',
    totals.base.toFixed(2),
    totals.fuel.toFixed(2),
    totals.surcharge.toFixed(2),
    totals.total.toFixed(2),
    '',
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
