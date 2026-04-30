/**
 * Moov OS — Reconciliation API
 *
 * POST /api/reconciliation/bulk-lookup
 *   Body: { courier: string, references: string[] }
 *   Looks up charges by order_id and returns cost/sell prices for comparison
 *   against a carrier invoice CSV.
 *
 * GET  /api/reconciliation/service-mappings?courier=DHL
 * POST /api/reconciliation/service-mappings
 *   Body: { courier, invoice_name, internal_name, notes? }
 * DELETE /api/reconciliation/service-mappings/:id
 */

import express from 'express';
import { query } from '../db/index.js';
import { processReconciliationRun, ageUnmatchedLines } from '../services/reconciliationEngine.js';
import { finalizeRun, getCustomerSummaries, generateCustomerCSV, getMarginReport } from '../services/finalizationService.js';

const router = express.Router();

// ─── POST /bulk-lookup ────────────────────────────────────────────────────────

router.post('/bulk-lookup', async (req, res) => {
  try {
    const { courier, references, tracking_numbers, account_numbers } = req.body;

    if (!Array.isArray(references) || references.length === 0) {
      return res.status(400).json({ error: 'references must be a non-empty array' });
    }
    if (references.length > 2000) {
      return res.status(400).json({ error: 'Too many references — max 2000 per request' });
    }

    // Normalise references — trim whitespace
    const refs = references.map(r => String(r).trim()).filter(Boolean);

    // Tracking numbers (consignment numbers from CSV column C) — optional, used as primary key
    const trackingNums = Array.isArray(tracking_numbers)
      ? tracking_numbers.map(t => String(t).trim()).filter(Boolean)
      : [];

    // DHL account numbers (column A) — optional, used to identify customer for
    // unmatched rows (returns, adjustments) that have no matching shipment reference.
    const acctNums = Array.isArray(account_numbers)
      ? account_numbers.map(a => String(a).trim()).filter(Boolean)
      : [];

    // Look up charges whose order_id matches any of the references.
    // order_id on charges stores the customer-facing shipment reference (e.g. MP-XXXXXXXX).
    const result = await query(`
      SELECT
        c.id                    AS charge_id,
        c.order_id              AS reference,
        c.cost_price            AS base_cost_price,
        c.price                 AS base_sell_price,
        c.service_name,
        c.awaiting_reconciliation,
        c.verified,
        c.billed,
        s.courier,
        s.collection_date,
        -- parcel_count: prefer shipments.parcel_count (set by webhook, always correct)
        -- over charges.parcel_qty (often left at default 1).
        COALESCE(s.parcel_count, c.parcel_qty, 1) AS parcel_count,
        s.total_weight_kg       AS declared_weight_kg,
        s.dc_service_id,
        s.tracking_codes,
        -- Does this customer/service use weight bands at all?
        -- Match exclusively by dc_service_id = customer_rates.service_code.
        -- service_name is a display label and must never be used for matching.
        (
          SELECT EXISTS(
            SELECT 1 FROM customer_rates cr
            WHERE cr.customer_id = c.customer_id
              AND cr.max_weight_kg IS NOT NULL
              AND s.dc_service_id IS NOT NULL
              AND TRIM(cr.service_code) ILIKE TRIM(s.dc_service_id)
          )
        )                       AS has_weight_bands,
        -- The ceiling of this customer's highest weight band for the service.
        (
          SELECT MAX(cr.max_weight_kg)
          FROM customer_rates cr
          WHERE cr.customer_id = c.customer_id
            AND cr.max_weight_kg IS NOT NULL
            AND s.dc_service_id IS NOT NULL
            AND TRIM(cr.service_code) ILIKE TRIM(s.dc_service_id)
        )                       AS band_max_weight_kg,
        cu.id                   AS customer_id,
        cu.business_name        AS customer_name,
        cu.account_number       AS customer_account,
        -- Fuel cost component only (for fuel surcharge reconciliation)
        COALESCE((
          SELECT SUM(sc.cost_price)
          FROM charges sc
          WHERE sc.shipment_id = c.shipment_id
            AND sc.charge_type = 'fuel'
            AND sc.cancelled = false
        ), 0)                   AS fuel_cost_price,
        -- HGV cost component (billing engine sets cost_price = parcel_count × rate)
        COALESCE((
          SELECT SUM(sc.cost_price)
          FROM charges sc
          WHERE sc.shipment_id = c.shipment_id
            AND sc.charge_type = 'surcharge'
            AND sc.cancelled = false
            AND UPPER(sc.service_name) LIKE '%HGV%'
        ), 0)                   AS hgv_cost_price,
        -- Fuel sell component (what we charge the customer for fuel — may differ from cost)
        -- Excludes charges whose linked surcharge is marked reconciliation_excluded=true.
        -- (reconciliation_excluded lives on the surcharges table, not on charges directly.)
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = c.shipment_id
            AND  sc.charge_type = 'fuel'
            AND  sc.cancelled   = false
            AND  NOT EXISTS (
              SELECT 1 FROM surcharges sx_re
              WHERE sx_re.id = sc.surcharge_id
                AND sx_re.reconciliation_excluded = true
            )
        ), 0)                   AS fuel_sell_price,
        -- HGV sell component (what we charge the customer for HGV surcharge)
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = c.shipment_id
            AND  sc.charge_type = 'surcharge'
            AND  sc.cancelled   = false
            AND  UPPER(sc.service_name) LIKE '%HGV%'
            AND  NOT EXISTS (
              SELECT 1 FROM surcharges sx_re
              WHERE sx_re.id = sc.surcharge_id
                AND sx_re.reconciliation_excluded = true
            )
        ), 0)                   AS hgv_sell_price,
        -- EPS / emergency fuel surcharge sell component (non-HGV surcharges)
        -- Excludes reconciliation_excluded rows — the billing engine creates a marked duplicate
        -- EPS row (reconciliation_excluded=true on the surcharges table) which would
        -- double-count EPS (e.g. 30p instead of 15p).
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = c.shipment_id
            AND  sc.charge_type = 'surcharge'
            AND  sc.cancelled   = false
            AND  UPPER(sc.service_name) NOT LIKE '%HGV%'
            AND  NOT EXISTS (
              SELECT 1 FROM surcharges sx_re
              WHERE sx_re.id = sc.surcharge_id
                AND sx_re.reconciliation_excluded = true
            )
        ), 0)                   AS eps_sell_price,
        -- Total cost = base freight + all non-courier charge cost_prices.
        -- Surcharges we don't pay the carrier (e.g. EPS) have cost_price = 0
        -- on the charge row, so they naturally contribute nothing here.
        -- No exclusion flags needed — the data model handles it.
        COALESCE(c.cost_price, 0)
        + COALESCE((
            SELECT SUM(sc.cost_price)
            FROM   charges sc
            WHERE  sc.shipment_id = c.shipment_id
              AND  sc.charge_type IN ('fuel', 'surcharge')
              AND  sc.cancelled   = false
          ), 0)                 AS total_cost_price,
        -- Total sell = base sell + fuel + HGV + EPS.
        -- Excludes charges whose linked surcharge has reconciliation_excluded=true —
        -- the billing engine creates a duplicate EPS row (different name, same surcharge_id)
        -- which would otherwise double the EPS component (30p instead of 15p).
        COALESCE(c.price, 0)
        + COALESCE((
            SELECT SUM(sc.price)
            FROM   charges sc
            WHERE  sc.shipment_id = c.shipment_id
              AND  sc.charge_type IN ('fuel', 'surcharge')
              AND  sc.cancelled   = false
              AND  NOT EXISTS (
                SELECT 1 FROM surcharges sx_re
                WHERE sx_re.id = sc.surcharge_id
                  AND sx_re.reconciliation_excluded = true
              )
          ), 0)                 AS total_sell_price
      FROM charges c
      LEFT JOIN shipments s  ON s.reference = c.order_id
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE (
        c.order_id = ANY($1)
        OR c.order_id IN (
          SELECT st.reference FROM shipments st
          WHERE $2::text[] <> '{}'
            AND st.tracking_codes && $2::text[]
        )
      )
        AND c.charge_type = 'courier'
        AND c.cancelled   = false
      ORDER BY c.order_id, c.created_at
    `, [refs, trackingNums]);

    // DEBUG — log parcel_qty for any row where it's > 1 so we can confirm it's coming through
    const multiParcel = result.rows.filter(r => r.parcel_count > 1);
    if (multiParcel.length) {
      console.log('[recon debug] multi-parcel charges:', multiParcel.map(r => ({ ref: r.reference, parcel_count: r.parcel_count })));
    } else {
      console.log('[recon debug] all parcel_count values:', result.rows.map(r => r.parcel_count));
    }

    // Group charges by reference — a reference can appear more than once when a
    // return shipment shares the same order_id as its outbound.
    // Returns typically appear on the NEXT invoice, so we return all charges and
    // let the client pick the best-matching one per invoice line.
    const groupByRef = {};
    for (const row of result.rows) {
      if (!groupByRef[row.reference]) {
        groupByRef[row.reference] = {
          reference:        row.reference,
          customer_name:    row.customer_name,
          customer_account: row.customer_account,
          customer_id:      row.customer_id,
          courier:          row.courier,
          tracking_codes:   row.tracking_codes || [],
          charges:          [],
        };
      }
      groupByRef[row.reference].charges.push({
        charge_id:               row.charge_id,
        base_cost_price:         row.base_cost_price   != null ? parseFloat(row.base_cost_price)   : null,
        base_sell_price:         row.base_sell_price   != null ? parseFloat(row.base_sell_price)   : null,
        fuel_cost_price:         row.fuel_cost_price    != null ? parseFloat(row.fuel_cost_price)   : 0,
        hgv_cost_price:          row.hgv_cost_price     != null ? parseFloat(row.hgv_cost_price)    : 0,
        fuel_sell_price:         row.fuel_sell_price    != null ? parseFloat(row.fuel_sell_price)   : 0,
        hgv_sell_price:          row.hgv_sell_price     != null ? parseFloat(row.hgv_sell_price)    : 0,
        eps_sell_price:          row.eps_sell_price     != null ? parseFloat(row.eps_sell_price)    : 0,
        total_cost_price:        row.total_cost_price   != null ? parseFloat(row.total_cost_price)  : null,
        total_sell_price:        row.total_sell_price   != null ? parseFloat(row.total_sell_price)  : null,
        parcel_count:            row.parcel_count        != null ? parseInt(row.parcel_count, 10)    : 1,
        declared_weight_kg:      row.declared_weight_kg  != null ? parseFloat(row.declared_weight_kg)  : null,
        has_weight_bands:        row.has_weight_bands    === true || row.has_weight_bands === 't',
        band_max_weight_kg:      row.band_max_weight_kg  != null ? parseFloat(row.band_max_weight_kg)  : null,
        service_name:            row.service_name,
        dc_service_id:           row.dc_service_id   || null,
        collection_date:         row.collection_date,
        verified:                row.verified,
        billed:                  row.billed,
        awaiting_reconciliation: row.awaiting_reconciliation,
      });
    }

    for (const g of Object.values(groupByRef)) {
      g.charge_count = g.charges.length;
      g.has_return   = g.charge_count > 1;
    }

    // Partition into matched / unmatched
    const matched   = [];
    const unmatched = [];

    for (const ref of refs) {
      if (groupByRef[ref]) {
        matched.push(groupByRef[ref]);
      } else {
        unmatched.push(ref);
      }
    }

    // ── Account number → customer lookup ─────────────────────────────────────
    // For invoice rows that have no matching shipment (e.g. DHL returns, credit
    // notes), look up the customer by the DHL account number from column A.
    // The DHL account number is stored in customers.account_number OR
    // customers.dc_customer_id depending on how the customer was onboarded.
    let customers_by_account = {};
    if (acctNums.length > 0) {
      // Look up by carrier account number stored on customer_carrier_links.
      // This is the preferred lookup — DHL account numbers are set per customer
      // per carrier via the carrier section in CustomerPricingTab.
      const custRes = await query(`
        SELECT cu.id   AS customer_id,
               cu.business_name AS customer_name,
               ccl.account_number AS lookup_key
        FROM customer_carrier_links ccl
        JOIN customers cu ON cu.id = ccl.customer_id
        WHERE ccl.account_number = ANY($1)
      `, [acctNums]);

      for (const row of custRes.rows) {
        if (row.lookup_key) {
          customers_by_account[row.lookup_key] = {
            customer_id:   row.customer_id,
            customer_name: row.customer_name,
          };
        }
      }

      // Fallback: also try customers.account_number / dc_customer_id for
      // customers that haven't had carrier account numbers set yet.
      const unmapped = acctNums.filter(a => !customers_by_account[a]);
      if (unmapped.length > 0) {
        const fallbackRes = await query(`
          SELECT id AS customer_id, business_name AS customer_name,
                 COALESCE(account_number, dc_customer_id) AS lookup_key
          FROM customers
          WHERE account_number = ANY($1)
             OR dc_customer_id = ANY($1)
        `, [unmapped]);
        for (const row of fallbackRes.rows) {
          if (row.lookup_key && !customers_by_account[row.lookup_key]) {
            customers_by_account[row.lookup_key] = {
              customer_id:   row.customer_id,
              customer_name: row.customer_name,
            };
          }
        }
      }
    }

    // ── Fetch charges for all customers on this invoice ──────────────────────
    // Return rows have a DHL-assigned reference that doesn't exist as an
    // order_id in our DB. The charge lives under the return booking's own
    // MP- reference (not on the invoice). We fetch all unmatched courier charges
    // for EVERY customer we identified on this invoice — both those matched by
    // shipment reference AND those identified by account number — so the frontend
    // can find return charges by exact service code match.
    //
    // Critically: we do NOT restrict to customers_by_account. A customer like PWS
    // may be identified from matched outbound rows (localAccountMap on the frontend)
    // without having their DHL account number stored in the DB. We still need their
    // charges. Use all customer_ids from matched groups.
    let charges_by_customer = {};
    {
      const custIds = [...new Set([
        ...matched.map(g => g.customer_id),
        ...Object.values(customers_by_account).map(c => c.customer_id),
      ].filter(Boolean))];
      if (custIds.length > 0) {
        const extraRes = await query(`
          SELECT
            c.id              AS charge_id,
            c.order_id        AS reference,
            c.customer_id,
            c.service_name,
            c.cost_price      AS base_cost_price,
            COALESCE(c.cost_price, 0) + COALESCE((
              SELECT SUM(sc.cost_price)
              FROM charges sc
              WHERE sc.shipment_id = c.shipment_id
                AND sc.charge_type IN ('fuel','surcharge')
                AND sc.cancelled = false
            ), 0)             AS total_cost_price,
            COALESCE(s.parcel_count, c.parcel_qty, 1) AS parcel_count,
            s.dc_service_id
          FROM charges c
          LEFT JOIN shipments s ON s.reference = c.order_id
          WHERE c.customer_id = ANY($1::uuid[])
            AND c.charge_type = 'courier'
            AND c.cancelled   = false
          ORDER BY c.created_at DESC
          LIMIT 200
        `, [custIds]);

        console.log(`[recon] charges_by_customer query returned ${extraRes.rows.length} rows for ${custIds.length} customers`);
        for (const row of extraRes.rows) {
          console.log(`[recon]   cid=${row.customer_id} ref=${row.reference} service_name="${row.service_name}" cost=${row.base_cost_price}`);
          const cid = String(row.customer_id);
          if (!charges_by_customer[cid]) charges_by_customer[cid] = [];
          charges_by_customer[cid].push({
            charge_id:        row.charge_id,
            reference:        row.reference,
            service_name:     row.service_name,
            dc_service_id:    row.dc_service_id    || null,
            base_cost_price:  row.base_cost_price  != null ? parseFloat(row.base_cost_price)  : null,
            total_cost_price: row.total_cost_price  != null ? parseFloat(row.total_cost_price) : null,
            parcel_count:     row.parcel_count       != null ? parseInt(row.parcel_count, 10)   : 1,
          });
        }
      }
    }

    // ── Carrier cost price lookup ─────────────────────────────────────────────
    // For unmatched return rows we need the carrier's cost price (what we pay DHL)
    // to compare against the invoice — separate from the customer sell price.
    // Query weight_bands for all services so the frontend can use cost_price
    // for the reconciliation comparison and sell_price for the customer bill.
    // Flat base rates for return row lookup (minimum price_first per service code).
    const flatCostRes = await query(`
      SELECT cs.service_code, MIN(wb.price_first) AS cost_price
      FROM weight_bands wb
      JOIN zones z             ON z.id  = wb.zone_id
      JOIN courier_services cs ON cs.id = z.courier_service_id
      WHERE wb.price_first IS NOT NULL AND wb.price_first > 0
      GROUP BY cs.service_code
    `);
    const carrier_service_costs = {};
    for (const row of flatCostRes.rows) {
      if (row.service_code) {
        carrier_service_costs[row.service_code.trim().toUpperCase()] = parseFloat(row.cost_price);
      }
    }

    // Per-kg rates per service + zone, keyed by service_code.
    // Each entry is an array of { zone_base_price, cost_per_kg, threshold_kg } so the
    // frontend can match the correct zone rate against bc.base_cost_price rather than
    // using MAX() which would pick the wrong (highest) zone rate.
    const perKgRes = await query(`
      SELECT cs.service_code,
             MIN(wb_flat.price_first)           AS zone_base_price,
             MAX(wb_pkg.cost_per_kg)            AS cost_per_kg,
             MAX(wb_pkg.cost_per_kg_threshold_kg) AS cost_per_kg_threshold_kg
      FROM courier_services cs
      JOIN zones z             ON z.courier_service_id = cs.id
      JOIN weight_bands wb_pkg ON wb_pkg.zone_id = z.id
                               AND wb_pkg.cost_per_kg IS NOT NULL
                               AND wb_pkg.cost_per_kg > 0
      JOIN weight_bands wb_flat ON wb_flat.zone_id = z.id
                                AND wb_flat.price_first IS NOT NULL
                                AND wb_flat.price_first > 0
      GROUP BY cs.service_code, z.id
    `);
    const carrier_per_kg_rates = {};
    for (const row of perKgRes.rows) {
      if (!row.service_code || row.cost_per_kg == null) continue;
      const code = row.service_code.trim().toUpperCase();
      if (!carrier_per_kg_rates[code]) carrier_per_kg_rates[code] = [];
      carrier_per_kg_rates[code].push({
        zone_base_price: parseFloat(row.zone_base_price),
        cost_per_kg:     parseFloat(row.cost_per_kg),
        threshold_kg:    parseFloat(row.cost_per_kg_threshold_kg || 30),
      });
    }

    // ── Customer rate lookup ──────────────────────────────────────────────────
    // For unmatched invoice rows (returns, extras not booked in the system),
    // fetch each identified customer's sell prices from customer_rates so the
    // frontend can use them for comparison and billing without needing a charge row.
    // Keyed: { [customer_id]: { [service_code]: { price, price_sub, service_name } } }
    const customer_rates_by_customer = {};
    const allCustIdsForRates = [...new Set([
      ...matched.map(g => g.customer_id),
      ...Object.values(customers_by_account).map(c => c.customer_id),
    ].filter(Boolean))];

    if (allCustIdsForRates.length > 0) {
      // DISTINCT ON picks ONE row per (customer_id, service_code).
      // Many customers have duplicate rate rows with null weight bands — the ordering
      // must put the row that has per_kg_rate set FIRST so DISTINCT ON keeps it.
      // per_kg_rate DESC NULLS LAST: non-null rates bubble to the top.
      // max_weight_kg ASC NULLS LAST: secondary sort to pick lowest band when no per_kg.
      const ratesRes = await query(`
        SELECT DISTINCT ON (customer_id, service_code)
          customer_id, service_code, service_name, price, price_sub,
          per_kg_rate, per_kg_threshold_kg
        FROM customer_rates
        WHERE customer_id = ANY($1::uuid[])
          AND price IS NOT NULL
        ORDER BY customer_id, service_code,
                 per_kg_rate DESC NULLS LAST,
                 max_weight_kg ASC NULLS LAST
      `, [allCustIdsForRates]);

      // Debug: log per_kg_rate values to confirm the right row is being picked
      const pkgRows = ratesRes.rows.filter(r => r.per_kg_rate != null);
      if (pkgRows.length) {
        console.log('[recon] customer per_kg_rates found:', pkgRows.map(r =>
          `cid=${r.customer_id} svc=${r.service_code} per_kg=${r.per_kg_rate} thresh=${r.per_kg_threshold_kg}`
        ));
      } else {
        console.log('[recon] no customer per_kg_rates found for any matched customer');
      }

      for (const row of ratesRes.rows) {
        const cid  = String(row.customer_id);
        const code = (row.service_code || '').trim().toUpperCase();
        if (!customer_rates_by_customer[cid]) customer_rates_by_customer[cid] = {};
        customer_rates_by_customer[cid][code] = {
          service_name:        row.service_name,
          price:               row.price               != null ? parseFloat(row.price)               : null,
          price_sub:           row.price_sub           != null ? parseFloat(row.price_sub)           : null,
          per_kg_rate:         row.per_kg_rate         != null ? parseFloat(row.per_kg_rate)         : null,
          per_kg_threshold_kg: row.per_kg_threshold_kg != null ? parseFloat(row.per_kg_threshold_kg) : null,
        };
      }
    }

    return res.json({
      ok: true,
      matched,
      unmatched,
      customers_by_account,
      charges_by_customer,
      carrier_service_costs,
      carrier_per_kg_rates,
      customer_rates_by_customer,
      total:           refs.length,
      matched_count:   matched.length,
      unmatched_count: unmatched.length,
    });
  } catch (err) {
    console.error('[reconciliation] bulk-lookup error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /debug/:reference ────────────────────────────────────────────────────
// Diagnostic endpoint — shows exactly what the DB contains for a shipment so
// we can see why band lookup or cost totals might not match expectations.
// Usage: /api/reconciliation/debug/MP-0000037027

router.get('/debug/:reference', async (req, res) => {
  try {
    const ref = req.params.reference.trim();

    // 1. The charge row itself
    const chargeRes = await query(`
      SELECT c.id, c.order_id, c.charge_type, c.service_name,
             c.cost_price, c.price, c.customer_id, c.shipment_id,
             s.dc_service_id, s.total_weight_kg, s.courier
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.order_id = $1 AND c.charge_type = 'courier' AND c.cancelled = false
    `, [ref]);

    if (!chargeRes.rows.length) {
      return res.json({ error: 'No courier charge found for this reference', reference: ref });
    }

    const charge = chargeRes.rows[0];

    // 2. All customer_rates rows for this customer
    const ratesRes = await query(`
      SELECT service_code, service_name, min_weight_kg, max_weight_kg,
             per_kg_rate, per_kg_threshold_kg, price, price_sub
      FROM customer_rates
      WHERE customer_id = $1
      ORDER BY service_code, min_weight_kg
    `, [charge.customer_id]);

    // 3. All charge rows for this shipment (fuel, surcharges)
    const allChargesRes = await query(`
      SELECT sc.id, sc.charge_type, sc.service_name, sc.cost_price, sc.price,
             sc.surcharge_id, sc.cancelled,
             sx.name AS surcharge_name, sx.reconciliation_excluded
      FROM charges sc
      LEFT JOIN surcharges sx ON sx.id = sc.surcharge_id
      WHERE sc.shipment_id = $1
      ORDER BY sc.charge_type, sc.created_at
    `, [charge.shipment_id]);

    // 4. ILIKE match check — does service_code match dc_service_id?
    const ilikeRes = await query(`
      SELECT service_code, service_name, max_weight_kg,
             TRIM(service_code) ILIKE TRIM($2) AS code_matches,
             TRIM(service_name) ILIKE TRIM($3) AS name_matches
      FROM customer_rates
      WHERE customer_id = $1 AND max_weight_kg IS NOT NULL
    `, [charge.customer_id, charge.dc_service_id || '', charge.service_name || '']);

    return res.json({
      reference: ref,
      charge: {
        customer_id:   charge.customer_id,
        shipment_id:   charge.shipment_id,
        service_name:  charge.service_name,
        dc_service_id: charge.dc_service_id,
        total_weight_kg: charge.total_weight_kg,
        cost_price:    charge.cost_price,
      },
      customer_rates: ratesRes.rows,
      all_charges:    allChargesRes.rows,
      ilike_check:    ilikeRes.rows,
    });
  } catch (err) {
    console.error('[reconciliation] debug error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /carrier-service-rates ───────────────────────────────────────────────
// Returns the cost price for specific carrier services (e.g. return service code "1").
// Used by the reconciliation client to compare invoice values for return rows.
// Query params: courier (required), service_code (optional — omit for all services)
// Returns: [{ service_code, service_name, price_first }]

router.get('/carrier-service-rates', async (req, res) => {
  try {
    const { courier, service_code } = req.query;
    if (!courier) return res.status(400).json({ error: 'courier is required' });

    const params = [courier];
    let serviceFilter = '';
    if (service_code) {
      params.push(service_code.trim());
      serviceFilter = `AND cs.service_code = $${params.length}`;
    }

    const result = await query(`
      SELECT
        cs.service_code,
        cs.name              AS service_name,
        MIN(wb.price_first)  AS price_first
      FROM courier_services cs
      JOIN zones             z  ON z.courier_service_id = cs.id
      JOIN weight_bands      wb ON wb.zone_id = z.id
      JOIN carrier_rate_cards rc ON rc.id = wb.carrier_rate_card_id
      JOIN couriers          cu ON cu.id = cs.courier_id
      WHERE (cu.code ILIKE $1 OR cu.name ILIKE $1)
        AND rc.is_active = true
        AND wb.price_first IS NOT NULL
        AND wb.price_first > 0
        ${serviceFilter}
      GROUP BY cs.service_code, cs.name
      ORDER BY cs.service_code
    `, params);

    return res.json(result.rows.map(r => ({
      service_code:  r.service_code,
      service_name:  r.service_name,
      price_first:   r.price_first != null ? parseFloat(r.price_first) : null,
    })));
  } catch (err) {
    console.error('[reconciliation] carrier-service-rates error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Service name mappings ────────────────────────────────────────────────────
// Maps carrier invoice service names (e.g. "HomeServe Sign Mand") to human-readable
// internal names (e.g. "DHL Next Day"). Stored per courier.

// GET /api/reconciliation/service-mappings?courier=DHL
router.get('/service-mappings', async (req, res) => {
  try {
    const { courier } = req.query;
    const rows = courier
      ? await query(
          'SELECT * FROM reconciliation_service_mappings WHERE courier = $1 ORDER BY invoice_name',
          [courier]
        )
      : await query(
          'SELECT * FROM reconciliation_service_mappings ORDER BY courier, invoice_name'
        );
    return res.json(rows.rows);
  } catch (err) {
    console.error('[reconciliation] service-mappings GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/reconciliation/service-mappings
router.post('/service-mappings', async (req, res) => {
  try {
    const { courier, invoice_name, internal_name, notes } = req.body;
    if (!courier)       return res.status(400).json({ error: 'courier is required' });
    if (!invoice_name)  return res.status(400).json({ error: 'invoice_name is required' });
    if (!internal_name) return res.status(400).json({ error: 'internal_name is required' });

    const result = await query(
      `INSERT INTO reconciliation_service_mappings (courier, invoice_name, internal_name, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (courier, invoice_name)
       DO UPDATE SET internal_name = EXCLUDED.internal_name,
                     notes         = EXCLUDED.notes,
                     updated_at    = NOW()
       RETURNING *`,
      [courier.trim(), invoice_name.trim(), internal_name.trim(), notes?.trim() || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[reconciliation] service-mappings POST error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reconciliation/service-mappings/:id
router.delete('/service-mappings/:id', async (req, res) => {
  try {
    await query('DELETE FROM reconciliation_service_mappings WHERE id = $1', [req.params.id]);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[reconciliation] service-mappings DELETE error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATED RECONCILIATION ENGINE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/reconciliation/runs ─────────────────────────────────────────────
// List all reconciliation runs, newest first.

router.get('/runs', async (req, res) => {
  try {
    const { carrier_id, limit = 50, offset = 0 } = req.query;
    const params = [];
    let where = '';
    if (carrier_id) {
      params.push(parseInt(carrier_id));
      where = `WHERE rr.carrier_id = $${params.length}`;
    }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT
        rr.*,
        c.name AS carrier_name,
        c.code AS carrier_code,
        s.full_name AS created_by_name
      FROM   reconciliation_runs rr
      LEFT JOIN couriers c ON c.id = rr.carrier_id
      LEFT JOIN staff    s ON s.id = rr.created_by
      ${where}
      ORDER  BY rr.created_at DESC
      LIMIT  $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countRes = await query(
      `SELECT COUNT(*) FROM reconciliation_runs rr ${where}`,
      carrier_id ? [parseInt(carrier_id)] : []
    );

    return res.json({
      runs:  result.rows,
      total: parseInt(countRes.rows[0].count),
    });
  } catch (err) {
    console.error('[reconciliation/runs] GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reconciliation/runs ────────────────────────────────────────────
// Start a new reconciliation run. Accepts parsed invoice lines as JSON.
// Body: { carrier_id, invoice_ref?, invoice_date?, lines: InvoiceLine[] }

router.post('/runs', async (req, res) => {
  try {
    const { carrier_id, invoice_ref, invoice_date, lines, notes } = req.body;

    if (!carrier_id) return res.status(400).json({ error: 'carrier_id is required' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'lines must be a non-empty array' });
    }
    if (lines.length > 10000) {
      return res.status(400).json({ error: 'Maximum 10,000 lines per run' });
    }

    // Validate carrier exists
    const carrierRes = await query('SELECT id FROM couriers WHERE id = $1', [carrier_id]);
    if (!carrierRes.rows.length) {
      return res.status(400).json({ error: 'Carrier not found' });
    }

    // Age any previously unresolved Unmatched lines from prior runs
    const aged = await ageUnmatchedLines(parseInt(carrier_id));
    if (aged > 0) console.log(`[reconciliation] Aged ${aged} unresolved lines for carrier ${carrier_id}`);

    // Create the run record
    const runRes = await query(`
      INSERT INTO reconciliation_runs
        (carrier_id, invoice_ref, invoice_date, status, total_lines, notes, created_by)
      VALUES ($1, $2, $3, 'processing', $4, $5, $6)
      RETURNING id
    `, [
      parseInt(carrier_id),
      invoice_ref  || null,
      invoice_date || null,
      lines.length,
      notes        || null,
      req.user?.id || null,
    ]);

    const runId = runRes.rows[0].id;

    // Return immediately — process async
    res.status(202).json({
      run_id:  runId,
      status:  'processing',
      message: `Run ${runId} started — ${lines.length} lines being processed`,
    });

    // Process in background
    processReconciliationRun(runId, parseInt(carrier_id), lines).catch(err => {
      console.error(`[reconciliation] Run ${runId} failed:`, err.message);
      query(
        `UPDATE reconciliation_runs SET status = 'failed', completed_at = NOW() WHERE id = $1`,
        [runId]
      );
    });
  } catch (err) {
    console.error('[reconciliation/runs] POST error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id ─────────────────────────────────────────
// Get a single run with its summary stats.

router.get('/runs/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT rr.*, c.name AS carrier_name, c.code AS carrier_code,
             s.full_name AS created_by_name
      FROM   reconciliation_runs rr
      LEFT JOIN couriers c ON c.id = rr.carrier_id
      LEFT JOIN staff    s ON s.id = rr.created_by
      WHERE  rr.id = $1
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Run not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[reconciliation/runs/:id] GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/lines ───────────────────────────────────
// Get lines for a run. Supports filtering by status.

router.get('/runs/:id/lines', async (req, res) => {
  try {
    const { status, aged, limit = 200, offset = 0 } = req.query;
    const runId = parseInt(req.params.id);
    const params = [runId];
    const conditions = ['rl.run_id = $1'];

    if (status) {
      params.push(status);
      conditions.push(`rl.status = $${params.length}`);
    }
    if (aged === 'true') {
      conditions.push('rl.aged = true');
    }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT
        rl.*,
        cs.name              AS service_name,
        cs.service_code      AS service_code_internal,
        cu.business_name     AS customer_name,
        s.full_name          AS resolved_by_name,
        cs_sug.name         AS suggested_service_name,
        cs_sug.service_code  AS suggested_service_code
      FROM   reconciliation_lines rl
      LEFT JOIN courier_services cs     ON cs.id     = rl.service_id
      LEFT JOIN courier_services cs_sug ON cs_sug.id = rl.suggested_service_id
      LEFT JOIN customers        cu     ON cu.id      = rl.customer_id
      LEFT JOIN staff             s     ON s.id       = rl.resolved_by
      WHERE  ${conditions.join(' AND ')}
      ORDER  BY rl.aged DESC, rl.carrier_amount DESC
      LIMIT  $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, -2);
    const countRes = await query(
      `SELECT COUNT(*) FROM reconciliation_lines rl WHERE ${conditions.join(' AND ')}`,
      countParams
    );

    return res.json({
      lines: result.rows,
      total: parseInt(countRes.rows[0].count),
    });
  } catch (err) {
    console.error('[reconciliation/runs/:id/lines] GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reconciliation/runs/:id/lines/:lineId/resolve ──────────────────
// Human resolution of an Unmatched line.
// Body: { resolution_type, resolution_value, scope: 'once'|'always', notes? }

router.post('/runs/:id/lines/:lineId/resolve', async (req, res) => {
  try {
    const lineId = parseInt(req.params.lineId);
    const { resolution_type, resolution_value, scope = 'once', notes, mapping_type, customer_id } = req.body;

    if (!resolution_type) return res.status(400).json({ error: 'resolution_type is required' });
    if (!resolution_value) return res.status(400).json({ error: 'resolution_value is required' });
    if (!['once', 'always'].includes(scope)) {
      return res.status(400).json({ error: 'scope must be once or always' });
    }

    // Fetch the line to validate + get context
    const lineRes = await query(
      `SELECT rl.*, rr.carrier_id
       FROM   reconciliation_lines rl
       JOIN   reconciliation_runs  rr ON rr.id = rl.run_id
       WHERE  rl.id = $1`,
      [lineId]
    );
    if (!lineRes.rows.length) return res.status(404).json({ error: 'Line not found' });

    const line = lineRes.rows[0];
    if (line.status !== 'unmatched') {
      return res.status(400).json({ error: 'Line is not Unmatched — cannot resolve' });
    }

    // Mark line as resolved
    await query(`
      UPDATE reconciliation_lines
      SET    status         = 'corrected',
             corrected_by   = 'human',
             resolved_by    = $2,
             resolved_at    = NOW(),
             resolution_notes = $3
      WHERE  id = $1
    `, [lineId, req.user?.id || null, notes || null]);

    // If scope = 'always', save a mapping rule
    let mappingId = null;
    if (scope === 'always' && mapping_type) {
      const mRes = await query(`
        INSERT INTO reconciliation_mappings
          (mapping_type, carrier_id, match_field, match_value,
           resolution_type, resolution_value, customer_id,
           created_from_line_id, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        mapping_type,
        line.carrier_id,
        line.unmatched_reason === 'delta_acceptance' ? 'charge_type' : 'raw_service_code',
        line.raw_service_code || line.charge_type || '*',
        resolution_type,
        resolution_value,
        line.customer_id || null,
        lineId,
        req.user?.id || null,
      ]);
      mappingId = mRes.rows[0]?.id || null;
    }

    // If this was an unknown_service_code, save to courier_service_code_mappings.
    // Supports customer_id = null (global) or a specific UUID (customer-specific rule).
    // Uses manual upsert to handle partial unique indexes correctly with NULLs.
    if (scope === 'always' && line.unmatched_reason === 'unknown_service_code' && resolution_value) {
      const custId = customer_id || null;

      const existingMapping = await query(`
        SELECT id FROM courier_service_code_mappings
        WHERE  carrier_id   = $1
          AND  courier_code = $2
          AND  ($3::uuid IS NULL AND customer_id IS NULL
                OR customer_id = $3::uuid)
      `, [line.carrier_id, line.raw_service_code, custId]);

      if (existingMapping.rows.length) {
        await query(`
          UPDATE courier_service_code_mappings
          SET    service_id = $1, is_active = true
          WHERE  id = $2
        `, [parseInt(resolution_value), existingMapping.rows[0].id]);
      } else {
        await query(`
          INSERT INTO courier_service_code_mappings
            (carrier_id, courier_code, service_id, customer_id, created_by, created_from_run_id)
          VALUES ($1,$2,$3,$4,$5,$6)
        `, [
          line.carrier_id,
          line.raw_service_code,
          parseInt(resolution_value),
          custId,
          req.user?.id || null,
          line.run_id,
        ]);
      }
    }

    // Update run stats
    await query(`
      UPDATE reconciliation_runs
      SET unmatched_count  = unmatched_count - 1,
          corrected_count  = corrected_count + 1
      WHERE id = $1
    `, [line.run_id]);

    return res.json({ resolved: true, mapping_id: mappingId });
  } catch (err) {
    console.error('[reconciliation/resolve] POST error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/service-code-mappings ────────────────────────────
// List all courier service code mappings (for management UI).

router.get('/service-code-mappings', async (req, res) => {
  try {
    const { carrier_id } = req.query;
    const params = [];
    let where = '';
    if (carrier_id) {
      params.push(parseInt(carrier_id));
      where = 'WHERE m.carrier_id = $1';
    }

    const result = await query(`
      SELECT m.*, c.name AS carrier_name, cs.name AS service_name, cs.service_code
      FROM   courier_service_code_mappings m
      LEFT JOIN couriers         c  ON c.id  = m.carrier_id
      LEFT JOIN courier_services cs ON cs.id = m.service_id
      ${where}
      ORDER  BY c.name, m.courier_code
    `, params);

    return res.json(result.rows);
  } catch (err) {
    console.error('[reconciliation/service-code-mappings] GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reconciliation/service-code-mappings ───────────────────────────
// Supports customer_id = null (global) or a specific UUID (customer-specific).
// Uses a manual upsert because partial unique indexes don't play well with
// ON CONFLICT column lists when NULLs are involved.

router.post('/service-code-mappings', async (req, res) => {
  try {
    const { carrier_id, courier_code, service_id, notes, customer_id } = req.body;
    if (!carrier_id)   return res.status(400).json({ error: 'carrier_id is required' });
    if (!courier_code) return res.status(400).json({ error: 'courier_code is required' });
    if (!service_id)   return res.status(400).json({ error: 'service_id is required' });

    const normCode     = courier_code.trim().toUpperCase();
    const carrierIdInt = parseInt(carrier_id);
    const serviceIdInt = parseInt(service_id);
    const custId       = customer_id || null;

    // Check for an existing row matching the same (carrier, code, customer scope)
    const existing = await query(`
      SELECT id FROM courier_service_code_mappings
      WHERE  carrier_id   = $1
        AND  courier_code = $2
        AND  ($3::uuid IS NULL AND customer_id IS NULL
              OR customer_id = $3::uuid)
    `, [carrierIdInt, normCode, custId]);

    let result;
    if (existing.rows.length) {
      result = await query(`
        UPDATE courier_service_code_mappings
        SET    service_id = $1, notes = $2, is_active = true
        WHERE  id = $3
        RETURNING *
      `, [serviceIdInt, notes || null, existing.rows[0].id]);
    } else {
      result = await query(`
        INSERT INTO courier_service_code_mappings
          (carrier_id, courier_code, service_id, notes, customer_id, created_by)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
      `, [carrierIdInt, normCode, serviceIdInt, notes || null, custId, req.user?.id || null]);
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[reconciliation/service-code-mappings] POST error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/reconciliation/service-code-mappings/:id ────────────────────
router.delete('/service-code-mappings/:id', async (req, res) => {
  try {
    await query(
      `UPDATE courier_service_code_mappings SET is_active = false WHERE id = $1`,
      [req.params.id]
    );
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[reconciliation/service-code-mappings] DELETE error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/learned-mappings ─────────────────────────────────
router.get('/learned-mappings', async (req, res) => {
  try {
    const { carrier_id } = req.query;
    const params = [];
    let where = 'WHERE m.is_active = true';
    if (carrier_id) {
      params.push(parseInt(carrier_id));
      where += ` AND m.carrier_id = $${params.length}`;
    }

    const result = await query(`
      SELECT m.*, c.name AS carrier_name, cu.business_name AS customer_name
      FROM   reconciliation_mappings m
      LEFT JOIN couriers  c  ON c.id  = m.carrier_id
      LEFT JOIN customers cu ON cu.id = m.customer_id
      ${where}
      ORDER BY m.applied_count DESC, m.created_at DESC
    `, params);

    return res.json(result.rows);
  } catch (err) {
    console.error('[reconciliation/learned-mappings] GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/reconciliation/learned-mappings/:id ─────────────────────────
router.delete('/learned-mappings/:id', async (req, res) => {
  try {
    await query(
      `UPDATE reconciliation_mappings SET is_active = false WHERE id = $1`,
      [req.params.id]
    );
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[reconciliation/learned-mappings] DELETE error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/couriers ────────────────────────────────────────
// List all couriers (for run creation dropdown).

router.get('/couriers', async (req, res) => {
  try {
    const result = await query(`SELECT id, name, code FROM couriers ORDER BY name`);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/courier-services ─────────────────────────────────
// List services for a carrier (for service code mapping dropdown).

router.get('/courier-services', async (req, res) => {
  try {
    const { carrier_id } = req.query;
    if (!carrier_id) return res.status(400).json({ error: 'carrier_id is required' });

    const result = await query(`
      SELECT cs.id, cs.name, cs.service_code
      FROM   courier_services cs
      WHERE  cs.courier_id = $1
      ORDER  BY cs.name
    `, [parseInt(carrier_id)]);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FINALIZATION + POST-RECONCILIATION
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/reconciliation/runs/:id/finalize ───────────────────────────────
// Finalize a run: copy all Matched + Corrected lines into finalized_billing_lines.
// Blocked if any Unmatched lines remain (must resolve first).

router.post('/runs/:id/finalize', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);
    const result = await finalizeRun(runId, req.user?.id || null);
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[reconciliation/finalize] error:', err.message);
    const status = err.message.includes('Unmatched') ? 422 : 500;
    return res.status(status).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/customers ───────────────────────────────
// Customer summary for a finalized run — aggregated sell totals per customer.

router.get('/runs/:id/customers', async (req, res) => {
  try {
    const summaries = await getCustomerSummaries(parseInt(req.params.id));
    return res.json(summaries);
  } catch (err) {
    console.error('[reconciliation/customers] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/finalized-lines ────────────────────────
// Finalized line detail for one customer (or all if no customer_id).

router.get('/runs/:id/finalized-lines', async (req, res) => {
  try {
    const { customer_id, limit = 500, offset = 0 } = req.query;
    const runId = parseInt(req.params.id);
    const params = [runId];
    let where = 'f.run_id = $1';
    if (customer_id) {
      params.push(customer_id);
      where += ` AND f.customer_id = $${params.length}`;
    }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT f.*
      FROM   finalized_billing_lines f
      WHERE  ${where}
      ORDER  BY f.despatch_date ASC, f.tracking_number
      LIMIT  $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countRes = await query(
      `SELECT COUNT(*) FROM finalized_billing_lines f WHERE ${where}`,
      params.slice(0, -2)
    );

    return res.json({ lines: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    console.error('[reconciliation/finalized-lines] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/export/csv ─────────────────────────────
// Generate and download an itemized CSV for one customer.
// Query param: customer_id (required)

router.get('/runs/:id/export/csv', async (req, res) => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });

    const csv = await generateCustomerCSV(parseInt(req.params.id), customer_id);

    // Get customer name for the filename
    const custRes = await query(`SELECT business_name FROM customers WHERE id = $1`, [customer_id]);
    const custName = (custRes.rows[0]?.business_name || 'customer').replace(/[^a-z0-9]/gi, '_');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="recon_run_${req.params.id}_${custName}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('[reconciliation/export/csv] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/margin-report ────────────────────────────────────
// Aggregated Buy vs Sell per finalized run.
// Query params: carrier_id (optional), limit, offset

router.get('/margin-report', async (req, res) => {
  try {
    const { carrier_id, limit = 20, offset = 0 } = req.query;
    const report = await getMarginReport({
      carrierId: carrier_id ? parseInt(carrier_id) : undefined,
      limit:     parseInt(limit),
      offset:    parseInt(offset),
    });
    return res.json(report);
  } catch (err) {
    console.error('[reconciliation/margin-report] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
