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
import { processReconciliationRun, ageUnmatchedLines, reprocessMappedLines } from '../services/reconciliationEngine.js';
import { finalizeRun, getCustomerSummaries, generateCustomerCSV, getMarginReport } from '../services/finalizationService.js';
import { fetchShipmentById, fetchShipmentByReference, fetchShipmentByReferenceAndTracking, probeShipmentRaw } from '../services/voilaClient.js';
import { processShipment, insertCharges } from '../services/pricingEngine.js';

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
        s.full_name AS created_by_name,
        CASE
          WHEN (SELECT COUNT(DISTINCT rl.customer_id)
                FROM reconciliation_lines rl
                WHERE rl.run_id = rr.id AND rl.customer_id IS NOT NULL) = 1
          THEN (SELECT cust.business_name
                FROM reconciliation_lines rl
                JOIN customers cust ON cust.id = rl.customer_id
                WHERE rl.run_id = rr.id AND rl.customer_id IS NOT NULL
                LIMIT 1)
          WHEN (SELECT COUNT(DISTINCT rl.customer_id)
                FROM reconciliation_lines rl
                WHERE rl.run_id = rr.id AND rl.customer_id IS NOT NULL) > 1
          THEN 'Mixed'
          ELSE NULL
        END AS customer_display
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
    const { carrier_id, invoice_ref, invoice_date, lines, notes, force } = req.body;

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

    // Duplicate detection — warn (don't block) if a run for the same carrier + invoice_ref
    // already exists. The caller can bypass with force=true.
    if (invoice_ref && !force) {
      const dupRes = await query(`
        SELECT rr.id, rr.status, rr.total_lines, rr.created_at, rr.invoice_date,
               c.name AS carrier_name
        FROM   reconciliation_runs rr
        JOIN   couriers c ON c.id = rr.carrier_id
        WHERE  rr.carrier_id  = $1
          AND  TRIM(LOWER(rr.invoice_ref)) = TRIM(LOWER($2))
          AND  rr.status NOT IN ('failed')
        ORDER  BY rr.created_at DESC
        LIMIT  1
      `, [parseInt(carrier_id), invoice_ref]);
      if (dupRes.rows.length) {
        const dup = dupRes.rows[0];
        return res.status(409).json({
          duplicate:    true,
          existing_run: {
            id:           dup.id,
            status:       dup.status,
            total_lines:  dup.total_lines,
            created_at:   dup.created_at,
            invoice_date: dup.invoice_date,
            carrier_name: dup.carrier_name,
          },
          message: `A run for invoice "${invoice_ref}" already exists (Run #${dup.id}, ${dup.status}).`,
        });
      }
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
    const { status, aged, tracking, limit = 200, offset = 0 } = req.query;
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
    // Partial tracking number search — matches any substring of the consignment number
    // regardless of prefix (e.g. "601234" matches "601234567890" and "1234567890601234").
    // Designed so operators can search by partial DHL or DPD numbers without knowing
    // the exact prefix format stored in the DB.
    if (tracking && String(tracking).trim()) {
      params.push(`%${String(tracking).trim()}%`);
      conditions.push(`rl.tracking_number ILIKE $${params.length}`);
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
        cs_sug.service_code  AS suggested_service_code,
        rm.mapping_type     AS mapping_type_applied,
        rm.resolution_type  AS mapping_resolution_type,
        rm.resolution_value AS mapping_resolution_value,
        rm.match_field      AS mapping_match_field,
        rm.match_value      AS mapping_match_value,
        -- Declared weight: prefer direct charge link (matched lines), then
        -- tracking-code lookup (unmatched/corrected), then shipment total weight
        COALESCE(
          ch_direct.weight_charged_kg,
          ch_lookup.weight_charged_kg,
          sh.total_weight_kg
        ) AS declared_weight_kg
      FROM   reconciliation_lines rl
      LEFT JOIN courier_services      cs     ON cs.id     = rl.service_id
      LEFT JOIN courier_services      cs_sug ON cs_sug.id = rl.suggested_service_id
      LEFT JOIN customers             cu     ON cu.id      = rl.customer_id
      LEFT JOIN staff                 s      ON s.id       = rl.resolved_by
      LEFT JOIN reconciliation_mappings rm   ON rm.id      = rl.mapping_id
      -- Direct charge join for matched lines (charge_id is populated)
      LEFT JOIN charges ch_direct ON ch_direct.id = rl.charge_id
      -- Shipment weight from the matched charge's shipment
      LEFT JOIN shipments sh      ON sh.id  = ch_direct.shipment_id
      -- Fallback: find a charge by tracking code (case-insensitive) for unmatched lines
      LEFT JOIN LATERAL (
        SELECT weight_charged_kg
        FROM   charges
        WHERE  UPPER(tracking_code) = UPPER(rl.tracking_number)
          AND  rl.charge_id IS NULL
        ORDER  BY created_at DESC
        LIMIT  1
      ) ch_lookup ON true
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

    // Mark line as resolved.
    // Zero out the delta — the human has accepted the carrier's charge as correct.
    // expected_amount is set to carrier_amount so the Corrected tab shows £0.00 delta.
    await query(`
      UPDATE reconciliation_lines
      SET    status           = 'corrected',
             corrected_by     = 'human',
             resolved_by      = $2,
             resolved_at      = NOW(),
             resolution_notes = $3,
             expected_amount  = carrier_amount,
             delta            = 0
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
    // Supports:
    //   - map_to_service:   resolution_value = service_id (integer)
    //   - map_to_surcharge: resolution_value = surcharge_id (UUID)
    // Supports customer_id = null (global) or a specific UUID (customer-specific rule).
    // Uses manual upsert to handle partial unique indexes correctly with NULLs.
    if (scope === 'always' && line.unmatched_reason === 'unknown_service_code' && resolution_value) {
      const custId = customer_id || null;
      const isSurchargeMapping = resolution_type === 'map_to_surcharge';

      const existingMapping = await query(`
        SELECT id FROM courier_service_code_mappings
        WHERE  carrier_id   = $1
          AND  courier_code = $2
          AND  ($3::uuid IS NULL AND customer_id IS NULL
                OR customer_id = $3::uuid)
      `, [line.carrier_id, line.raw_service_code, custId]);

      if (existingMapping.rows.length) {
        if (isSurchargeMapping) {
          await query(`
            UPDATE courier_service_code_mappings
            SET    service_id = NULL, surcharge_id = $1, is_active = true
            WHERE  id = $2
          `, [resolution_value, existingMapping.rows[0].id]);
        } else {
          await query(`
            UPDATE courier_service_code_mappings
            SET    service_id = $1, surcharge_id = NULL, is_active = true
            WHERE  id = $2
          `, [parseInt(resolution_value), existingMapping.rows[0].id]);
        }
      } else {
        if (isSurchargeMapping) {
          await query(`
            INSERT INTO courier_service_code_mappings
              (carrier_id, courier_code, service_id, surcharge_id, customer_id, created_by, created_from_run_id)
            VALUES ($1,$2,NULL,$3,$4,$5,$6)
          `, [
            line.carrier_id,
            line.raw_service_code,
            resolution_value,
            custId,
            req.user?.id || null,
            line.run_id,
          ]);
        } else {
          await query(`
            INSERT INTO courier_service_code_mappings
              (carrier_id, courier_code, service_id, surcharge_id, customer_id, created_by, created_from_run_id)
            VALUES ($1,$2,$3,NULL,$4,$5,$6)
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
    }

    // If scope = 'always' and a surcharge mapping was saved, bulk-apply it to all
    // other unmatched lines in this run that share the same raw_service_code.
    // This mirrors the bulk-map-service-codes behaviour for service mappings.
    let bulkApplied = 0;
    if (scope === 'always' && resolution_type === 'map_to_surcharge' && line.raw_service_code) {
      const bulkRes = await query(`
        UPDATE reconciliation_lines
        SET    status       = 'corrected',
               corrected_by = 'surcharge_mapping',
               resolved_at  = NOW()
        WHERE  run_id           = $1
          AND  raw_service_code = $2
          AND  status           = 'unmatched'
          AND  id              <> $3
        RETURNING id
      `, [line.run_id, line.raw_service_code, lineId]);
      bulkApplied = bulkRes.rowCount || 0;
      if (bulkApplied > 0) {
        console.log(`[reconciliation/resolve] Surcharge rule bulk-applied to ${bulkApplied} additional line(s) in run ${line.run_id}`);
      }
    }

    // Recount run stats from DB — handles both single-resolve and bulk-apply cases.
    // Also recalculates automation_rate so it stays live as humans resolve lines.
    await query(`
      UPDATE reconciliation_runs rr
      SET    matched_count   = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'matched'),
             corrected_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'corrected'),
             unmatched_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'unmatched'),
             automation_rate = CASE WHEN rr.total_lines > 0 THEN
               ROUND(
                 (SELECT COUNT(*)::numeric FROM reconciliation_lines WHERE run_id = rr.id AND status IN ('matched','corrected'))
                 / rr.total_lines * 100, 2
               )
             ELSE 0 END,
             status = CASE
               WHEN (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'unmatched') > 0
               THEN 'needs_review' ELSE 'complete' END
      WHERE  id = $1
    `, [line.run_id]);

    return res.json({ resolved: true, mapping_id: mappingId, bulk_applied: bulkApplied });
  } catch (err) {
    console.error('[reconciliation/resolve] POST error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reconciliation/runs/:id/bulk-map-service-codes ─────────────────
// Save multiple service code mappings at once and immediately apply them to all
// matching unmatched lines in this run. Designed for the "Map Unknown Codes"
// banner that groups lines by raw_service_code so the user can map them in bulk.
//
// Body: { mappings: [{ raw_service_code, service_id, customer_id? }] }
// Each mapping is saved as a global permanent rule (customer_id = null) unless
// customer_id is provided.

router.post('/runs/:id/bulk-map-service-codes', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);
    const { mappings = [] } = req.body;

    if (!mappings.length) return res.status(400).json({ error: 'mappings array is required' });

    // Fetch run to get carrier_id
    const runRes = await query('SELECT carrier_id FROM reconciliation_runs WHERE id = $1', [runId]);
    if (!runRes.rows.length) return res.status(404).json({ error: 'Run not found' });
    const carrierId = runRes.rows[0].carrier_id;

    let totalUpdated = 0;
    const results = [];

    for (const m of mappings) {
      const { raw_service_code, service_id, customer_id = null } = m;
      if (!raw_service_code || !service_id) continue;

      const custId = customer_id || null;

      // 1. Upsert courier_service_code_mappings (manual upsert for partial index safety)
      const existing = await query(`
        SELECT id FROM courier_service_code_mappings
        WHERE  carrier_id   = $1
          AND  courier_code = $2
          AND  ($3::uuid IS NULL AND customer_id IS NULL
                OR customer_id = $3::uuid)
      `, [carrierId, raw_service_code, custId]);

      if (existing.rows.length) {
        await query(
          'UPDATE courier_service_code_mappings SET service_id = $1, is_active = true WHERE id = $2',
          [parseInt(service_id), existing.rows[0].id]
        );
      } else {
        await query(`
          INSERT INTO courier_service_code_mappings
            (carrier_id, courier_code, service_id, customer_id, created_by, created_from_run_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [carrierId, raw_service_code, parseInt(service_id), custId, req.user?.id || null, runId]);
      }

      // 2. Re-process affected lines through the engine:
      //    pool lookup → cost comparison → carrier_direct auto-create on pool MISS.
      //    Never blind-stamp as 'corrected' — we need real expected_amount / delta.
      const reprocessResult = await reprocessMappedLines(runId, raw_service_code, parseInt(service_id), carrierId);

      const count = reprocessResult.matched + reprocessResult.unmatched + (reprocessResult.carrier_direct_created || 0);
      totalUpdated += count;
      results.push({ raw_service_code, service_id, lines_updated: count, ...reprocessResult });
    }

    // 3. Recount and update run stats from DB (most accurate).
    // Recalculates automation_rate so it stays live as lines are resolved.
    await query(`
      UPDATE reconciliation_runs rr
      SET    matched_count   = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'matched'),
             corrected_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status IN ('corrected')),
             unmatched_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'unmatched'),
             automation_rate = CASE WHEN rr.total_lines > 0 THEN
               ROUND(
                 (SELECT COUNT(*)::numeric FROM reconciliation_lines WHERE run_id = rr.id AND status IN ('matched','corrected'))
                 / rr.total_lines * 100, 2
               )
             ELSE 0 END,
             status = CASE
               WHEN (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'unmatched') > 0
               THEN 'needs_review' ELSE 'complete' END
      WHERE  id = $1
    `, [runId]);

    return res.json({ applied: true, total_lines_updated: totalUpdated, results });
  } catch (err) {
    console.error('[reconciliation/bulk-map] POST error:', err);
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

// ─── GET /api/reconciliation/runs/:id/carrier-direct-errors ──────────────────
// Diagnostic: for a given run, break down carrier_direct errors and unmatched
// lines by type. Helps identify why pool-miss lines have no expected price.

router.get('/runs/:id/carrier-direct-errors', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);
    if (!runId) return res.status(400).json({ error: 'runId required' });

    // Summary counts by unmatched_reason across ALL unmatched lines
    const summary = await query(`
      SELECT
        COALESCE(unmatched_reason, 'unknown') AS reason,
        source,
        COUNT(*)                              AS count,
        MIN(carrier_amount)                   AS min_carrier,
        MAX(carrier_amount)                   AS max_carrier,
        SUM(carrier_amount)                   AS total_carrier
      FROM   reconciliation_lines
      WHERE  run_id = $1
        AND  status = 'unmatched'
      GROUP  BY reason, source
      ORDER  BY count DESC
    `, [runId]);

    // Sample lines for each carrier_direct error type (first 5 per reason)
    const samples = await query(`
      SELECT DISTINCT ON (unmatched_reason, raw_service_code)
        tracking_number,
        raw_service_code,
        unmatched_reason,
        carrier_amount,
        carrier_billed_weight_kg,
        ship_to_postcode,
        ship_to_country,
        carrier_account_no,
        source
      FROM   reconciliation_lines
      WHERE  run_id = $1
        AND  source = 'carrier_direct'
        AND  status = 'unmatched'
      ORDER  BY unmatched_reason, raw_service_code, carrier_amount DESC
      LIMIT  20
    `, [runId]);

    // Check zone availability for DPD domestic services used in this run
    const zoneCheck = await query(`
      SELECT
        cs.service_code,
        z.id    AS zone_id,
        z.name  AS zone_name,
        COUNT(DISTINCT zcc.country_iso) FILTER (WHERE zcc.country_iso IS NOT NULL) AS country_code_count,
        BOOL_OR(zcc.country_iso = 'GB') AS has_gb,
        COUNT(wb.id)                    AS weight_band_count
      FROM   zones z
      JOIN   courier_services cs ON cs.id = z.courier_service_id
      JOIN   couriers c          ON c.id  = cs.courier_id
      LEFT JOIN zone_country_codes zcc ON zcc.zone_id = z.id
      LEFT JOIN weight_bands wb        ON wb.zone_id  = z.id
      WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD%')
      GROUP  BY cs.service_code, z.id, z.name
      ORDER  BY cs.service_code, z.name
    `, []);

    return res.json({
      run_id:    runId,
      summary:   summary.rows,
      samples:   samples.rows,
      zone_check: zoneCheck.rows,
    });
  } catch (err) {
    console.error('[reconciliation/carrier-direct-errors] GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/reconciliation/runs/:id ──────────────────────────────────────
// Hard-delete a reconciliation run and all its data.
// Order: finalized_billing_lines (no CASCADE) → run (cascades to recon lines).

router.delete('/runs/:id', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);

    const runCheck = await query('SELECT id, invoice_ref, finalized FROM reconciliation_runs WHERE id = $1', [runId]);
    if (!runCheck.rows.length) return res.status(404).json({ error: 'Run not found' });

    // Delete finalized billing lines first (FK has no CASCADE)
    const fblRes = await query('DELETE FROM finalized_billing_lines WHERE run_id = $1', [runId]);

    // Delete the run — reconciliation_lines cascade
    await query('DELETE FROM reconciliation_runs WHERE id = $1', [runId]);

    console.log(`[reconciliation] Run ${runId} (ref: ${runCheck.rows[0].invoice_ref}) deleted — ${fblRes.rowCount} finalized lines removed`);
    return res.json({ deleted: true, run_id: runId, finalized_lines_removed: fblRes.rowCount });
  } catch (err) {
    console.error('[reconciliation/runs] DELETE error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CSV COLUMN PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/reconciliation/csv-profiles ─────────────────────────────────────
// List saved column profiles for a carrier.
// Query: carrier_id (required)

router.get('/csv-profiles', async (req, res) => {
  try {
    const { carrier_id } = req.query;
    if (!carrier_id) return res.status(400).json({ error: 'carrier_id is required' });

    const cidInt = parseInt(carrier_id);

    const [profileResult, surchargeResult] = await Promise.all([
      query(`
        SELECT p.*, c.name AS carrier_name
        FROM   carrier_csv_profiles p
        JOIN   couriers c ON c.id = p.carrier_id
        WHERE  p.carrier_id = $1
        ORDER  BY p.is_default DESC, p.updated_at DESC
      `, [cidInt]),
      // Auto-derive surcharge_columns from the surcharges table.
      // Each surcharge with csv_column set becomes a { col, surcharge_id } entry —
      // this is the source of truth, replacing the manually-maintained JSON array.
      query(`
        SELECT id AS surcharge_id, csv_column AS col, name, code
        FROM   surcharges
        WHERE  courier_id = $1
          AND  csv_column IS NOT NULL
          AND  active = true
        ORDER  BY name
      `, [cidInt]),
    ]);

    // Merge auto-derived surcharge_columns into every profile's column_map.
    // The surcharges table is authoritative; any manually-stored surcharge_columns
    // in the profile JSON are replaced with the live data.
    const derivedSurchargeColumns = surchargeResult.rows.map(r => ({
      col:          r.col,
      surcharge_id: r.surcharge_id,
    }));

    const profiles = profileResult.rows.map(p => ({
      ...p,
      column_map: {
        ...(p.column_map || {}),
        surcharge_columns: derivedSurchargeColumns,
      },
    }));

    return res.json(profiles);
  } catch (err) {
    console.error('[reconciliation/csv-profiles] GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reconciliation/csv-profiles ────────────────────────────────────
// Create (or upsert by name) a column profile.
// Body: { carrier_id, profile_name, column_map, is_default? }

router.post('/csv-profiles', async (req, res) => {
  try {
    const { carrier_id, profile_name, column_map, is_default = false } = req.body;
    if (!carrier_id)    return res.status(400).json({ error: 'carrier_id is required' });
    if (!profile_name)  return res.status(400).json({ error: 'profile_name is required' });
    if (!column_map)    return res.status(400).json({ error: 'column_map is required' });

    const cidInt = parseInt(carrier_id);

    // If setting as default, clear existing default for this carrier first
    if (is_default) {
      await query(
        'UPDATE carrier_csv_profiles SET is_default = false WHERE carrier_id = $1 AND is_default = true',
        [cidInt]
      );
    }

    const result = await query(`
      INSERT INTO carrier_csv_profiles
        (carrier_id, profile_name, column_map, is_default, created_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (carrier_id, profile_name)
      DO UPDATE SET
        column_map = EXCLUDED.column_map,
        is_default = EXCLUDED.is_default,
        updated_at = NOW()
      RETURNING *
    `, [cidInt, profile_name.trim(), JSON.stringify(column_map), is_default, req.user?.id || null]);

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[reconciliation/csv-profiles] POST error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/reconciliation/csv-profiles/:id ─────────────────────────────────
// Update a profile's name, column_map, or default flag.

router.put('/csv-profiles/:id', async (req, res) => {
  try {
    const { profile_name, column_map, is_default } = req.body;
    const profId = parseInt(req.params.id);

    const existing = await query('SELECT * FROM carrier_csv_profiles WHERE id = $1', [profId]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Profile not found' });
    const prof = existing.rows[0];

    // Clear existing default if we're promoting this one
    if (is_default === true) {
      await query(
        'UPDATE carrier_csv_profiles SET is_default = false WHERE carrier_id = $1 AND is_default = true AND id <> $2',
        [prof.carrier_id, profId]
      );
    }

    const result = await query(`
      UPDATE carrier_csv_profiles
      SET
        profile_name = COALESCE($1, profile_name),
        column_map   = COALESCE($2, column_map),
        is_default   = COALESCE($3, is_default),
        updated_at   = NOW()
      WHERE id = $4
      RETURNING *
    `, [
      profile_name ? profile_name.trim() : null,
      column_map   ? JSON.stringify(column_map) : null,
      is_default   !== undefined ? is_default : null,
      profId,
    ]);

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[reconciliation/csv-profiles] PUT error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/reconciliation/csv-profiles/:id ──────────────────────────────

router.delete('/csv-profiles/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM carrier_csv_profiles WHERE id = $1 RETURNING id',
      [parseInt(req.params.id)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found' });
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[reconciliation/csv-profiles] DELETE error:', err);
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

// ─── GET /api/reconciliation/surcharges ───────────────────────────────────────
// List active surcharges for a carrier (for surcharge code mapping dropdown).

router.get('/surcharges', async (req, res) => {
  try {
    const { carrier_id } = req.query;
    if (!carrier_id) return res.status(400).json({ error: 'carrier_id is required' });

    const result = await query(`
      SELECT s.id, s.code, s.name, s.calc_type, s.default_value,
             s.reconciliation_excluded
      FROM   surcharges s
      WHERE  s.courier_id = $1
        AND  s.active     = true
      ORDER  BY s.name
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

// ─── GET /api/reconciliation/totals ──────────────────────────────────────────
// Aggregate financial totals across all runs (revenue, carrier cost, margin)
// plus a count of runs that are ready to finalize.
// Source: reconciliation_lines for all matched/corrected lines (works whether
// or not a run is finalized — uses corrected_sell_price / carrier_amount).

router.get('/totals', async (req, res) => {
  try {
    // Use the same logic as /customers/preview but across ALL runs:
    // freight sell (corrected_sell_price or booking price) + fuel & surcharge
    // charges from the charges table — this matches what each run detail page
    // shows per-customer and gives fully accurate revenue/cost figures without
    // needing runs to be finalized first.
    const totalsResult = await query(`
      SELECT
        ROUND(
          COALESCE(SUM(
            COALESCE(rl.corrected_sell_price, base.sell_price, base.price, 0)
            + COALESCE((
                SELECT SUM(sc.price)
                FROM   charges sc
                WHERE  sc.shipment_id  = base.shipment_id
                  AND  sc.charge_type IN ('fuel', 'surcharge')
                  AND  sc.cancelled    = false
              ), 0)
          ), 0)::numeric, 2
        ) AS total_revenue,
        ROUND(
          COALESCE(SUM(
            COALESCE(base.cost_price, 0)
            + COALESCE((
                SELECT SUM(sc.cost_price)
                FROM   charges sc
                WHERE  sc.shipment_id  = base.shipment_id
                  AND  sc.charge_type IN ('fuel', 'surcharge')
                  AND  sc.cancelled    = false
              ), 0)
          ), 0)::numeric, 2
        ) AS total_carrier_cost
      FROM   reconciliation_lines rl
      LEFT JOIN charges base
             ON base.id          = rl.charge_id
            AND base.charge_type = 'courier'
            AND base.cancelled   = false
      WHERE  rl.status  IN ('matched', 'corrected')
        AND  rl.is_fuel  = false
    `);

    const finalizableResult = await query(`
      SELECT COUNT(*)::int AS finalizable_count
      FROM reconciliation_runs
      WHERE finalized      = false
        AND unmatched_count = 0
        AND status IN ('complete', 'needs_review')
    `);

    const { total_revenue, total_carrier_cost } = totalsResult.rows[0];
    const rev  = parseFloat(total_revenue)      || 0;
    const cost = parseFloat(total_carrier_cost) || 0;

    return res.json({
      total_revenue:       rev,
      total_carrier_cost:  cost,
      total_margin:        Math.round((rev - cost) * 100) / 100,
      finalizable_count:   finalizableResult.rows[0].finalizable_count,
    });
  } catch (err) {
    console.error('[reconciliation/totals] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reconciliation/finalize-all ────────────────────────────────────
// Finalize every run that is ready (unmatched_count=0, not yet finalized,
// status complete or needs_review). Calls finalizeRun for each in sequence.

router.post('/finalize-all', async (req, res) => {
  try {
    const readyRuns = await query(`
      SELECT id FROM reconciliation_runs
      WHERE finalized      = false
        AND unmatched_count = 0
        AND status IN ('complete', 'needs_review')
      ORDER BY id
    `);

    if (readyRuns.rows.length === 0) {
      return res.json({ ok: true, finalized: [], message: 'No runs ready to finalize' });
    }

    const finalized = [];
    const errors    = [];

    for (const row of readyRuns.rows) {
      try {
        await finalizeRun(row.id, req.user?.id || null);
        finalized.push(row.id);
      } catch (err) {
        errors.push({ run_id: row.id, error: err.message });
      }
    }

    return res.json({ ok: true, finalized, errors });
  } catch (err) {
    console.error('[reconciliation/finalize-all] error:', err.message);
    return res.status(500).json({ error: err.message });
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

// ─── GET /api/reconciliation/runs/:id/debug-sell ─────────────────────────────
// Temporary diagnostic: for the first 10 matched freight lines in a run, show
// all the data that computeCorrectedSell uses so we can see why sell = cost.

router.get('/runs/:id/debug-sell', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);
    const result = await query(`
      SELECT
        rl.id                         AS line_id,
        rl.tracking_number,
        rl.status,
        rl.source,
        rl.corrected_by,
        rl.carrier_amount,
        rl.carrier_billed_weight_kg,
        rl.corrected_sell_price,
        rl.corrected_cost_price,
        -- Direct from the line (not via charge JOIN)
        rl.charge_id,
        rl.customer_id                AS line_customer_id,
        rl.service_id                 AS line_service_id,
        -- From the charge (only populated when charge_id is not null)
        ch.zone_id                    AS charge_zone_id,
        ch.cost_price                 AS charge_cost,
        ch.sell_price                 AS charge_sell_price,
        ch.price                      AS charge_price,
        COALESCE(ch.sell_price, ch.price) AS effective_charge_sell,
        -- From the shipment
        s.total_weight_kg             AS declared_weight_kg,
        -- Zone name
        z.name                        AS zone_name,
        -- Service code from courier_services
        cs.service_code,
        -- Rate card: how many entries exist for this customer+service
        (SELECT COUNT(*) FROM customer_rates cr
         WHERE  cr.customer_id = rl.customer_id
           AND  cr.service_code ILIKE cs.service_code) AS rate_card_row_count,
        -- Rate card: zone names available for this customer+service
        (SELECT string_agg(DISTINCT cr.zone_name, ', ' ORDER BY cr.zone_name)
         FROM   customer_rates cr
         WHERE  cr.customer_id = rl.customer_id
           AND  cr.service_code ILIKE cs.service_code) AS rate_card_zones
      FROM   reconciliation_lines rl
      LEFT JOIN charges ch   ON ch.id  = rl.charge_id
      LEFT JOIN shipments s  ON s.id   = ch.shipment_id
      LEFT JOIN zones z      ON z.id   = ch.zone_id
      LEFT JOIN courier_services cs ON cs.id = rl.service_id
      WHERE  rl.run_id      = $1
        AND  rl.status      IN ('matched', 'corrected')
        AND  rl.surcharge_id IS NULL
      ORDER  BY rl.id
      LIMIT  10
    `, [runId]);
    return res.json({ run_id: runId, lines: result.rows });
  } catch (err) {
    console.error('[reconciliation/debug-sell] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/debug-surcharge-coverage ───────────────
// Diagnostic: shows which freight lines have NO surcharge sub-rows, grouped by
// source and service code, so we can see why some lines are missing GEC/fuel.

router.get('/runs/:id/debug-surcharge-coverage', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);

    // Overall counts: freight lines with and without surcharge sub-rows
    const summary = await query(`
      SELECT
        rl.source,
        cs.service_code,
        COUNT(DISTINCT rl.tracking_number) AS freight_lines,
        COUNT(DISTINCT sub.tracking_number) AS lines_with_surcharges,
        COUNT(DISTINCT rl.tracking_number) - COUNT(DISTINCT sub.tracking_number) AS lines_without_surcharges
      FROM reconciliation_lines rl
      LEFT JOIN courier_services cs ON cs.id = rl.service_id
      LEFT JOIN (
        SELECT DISTINCT tracking_number
        FROM   reconciliation_lines
        WHERE  run_id = $1 AND surcharge_id IS NOT NULL
      ) sub ON sub.tracking_number = rl.tracking_number
      WHERE rl.run_id = $1
        AND rl.surcharge_id IS NULL
        AND rl.status NOT IN ('unmatched', 'carrier_overhead')
      GROUP BY rl.source, cs.service_code
      ORDER BY freight_lines DESC
    `, [runId]);

    // Sample 5 freight lines that have NO surcharge sub-rows — show their corrected_sell_price and source
    const samples = await query(`
      SELECT
        rl.tracking_number,
        rl.source,
        rl.status,
        rl.corrected_sell_price,
        rl.corrected_cost_price,
        rl.carrier_amount,
        cs.service_code,
        rl.charge_id
      FROM reconciliation_lines rl
      LEFT JOIN courier_services cs ON cs.id = rl.service_id
      WHERE rl.run_id = $1
        AND rl.surcharge_id IS NULL
        AND rl.status NOT IN ('unmatched', 'carrier_overhead')
        AND rl.tracking_number NOT IN (
          SELECT DISTINCT tracking_number
          FROM   reconciliation_lines
          WHERE  run_id = $1 AND surcharge_id IS NOT NULL
        )
      ORDER BY rl.id
      LIMIT 5
    `, [runId]);

    return res.json({ run_id: runId, summary: summary.rows, samples_without_surcharges: samples.rows });
  } catch (err) {
    console.error('[reconciliation/debug-surcharge-coverage] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/customers/preview ──────────────────────
// Pre-finalization customer billing preview — aggregated sell totals per customer
// using live reconciliation_lines + charges table (no finalized_billing_lines needed).

router.get('/runs/:id/customers/preview', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);
    const result = await query(`
      -- Full sell = freight sell + fuel surcharge + standing surcharges from charges table.
      -- corrected_sell_price covers only the freight (base rate at billed weight).
      -- Fuel and surcharge charge rows are separate and must be added, mirroring
      -- what buildSnapshot does at finalization time.
      SELECT
        rl.customer_id,
        cu.business_name                                                                    AS customer_name,
        COUNT(*)::int                                                                       AS line_count,
        -- total_base: freight sell only (corrected at billed weight, or booking-time price)
        SUM(COALESCE(rl.corrected_sell_price, base.sell_price, base.price, 0))             AS total_base,
        -- total_fuel: fuel surcharge sell for each linked shipment
        SUM(COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = base.shipment_id
            AND  sc.charge_type = 'fuel'
            AND  sc.cancelled   = false
        ), 0))                                                                              AS total_fuel,
        -- total_surcharge: non-fuel surcharge sell (e.g. handling fee, GC charge)
        SUM(COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = base.shipment_id
            AND  sc.charge_type = 'surcharge'
            AND  sc.cancelled   = false
        ), 0))                                                                              AS total_surcharge,
        0                                                                                   AS total_recon_surcharge,
        -- total_sell: sum of all three components
        SUM(
          COALESCE(rl.corrected_sell_price, base.sell_price, base.price, 0)
          + COALESCE((
              SELECT SUM(sc.price)
              FROM   charges sc
              WHERE  sc.shipment_id = base.shipment_id
                AND  sc.charge_type IN ('fuel', 'surcharge')
                AND  sc.cancelled   = false
            ), 0)
        )                                                                                   AS total_sell,
        -- Cost: use total_cost_price (base + fuel + surcharge charges) to match Finance page.
        -- carrier_amount on the freight line only covers base for carriers like DPD where
        -- fuel and carriage overhead rows are billed separately and auto-corrected with no
        -- customer_id — summing carrier_amount alone gives an overstated margin.
        SUM(
          COALESCE(base.cost_price, 0)
          + COALESCE((
              SELECT SUM(sc.cost_price)
              FROM   charges sc
              WHERE  sc.shipment_id = base.shipment_id
                AND  sc.charge_type IN ('fuel','surcharge')
                AND  sc.cancelled   = false
            ), 0)
        )                                                                                   AS total_our_cost
      FROM   reconciliation_lines rl
      LEFT JOIN customers cu   ON cu.id   = rl.customer_id
      LEFT JOIN charges   base ON base.id = rl.charge_id AND base.charge_type = 'courier' AND base.cancelled = false
      WHERE  rl.run_id = $1
        AND  rl.status IN ('matched', 'corrected')
        AND  rl.is_fuel = false
      GROUP  BY rl.customer_id, cu.business_name
      ORDER  BY cu.business_name
    `, [runId]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[reconciliation/customers/preview] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/customers/preview/lines ────────────────
// Per-line detail for one customer — used in the pre-finalization drill-down.
// Returns every matched/corrected non-fuel line with sell price breakdown.

router.get('/runs/:id/customers/preview/lines', async (req, res) => {
  try {
    const runId      = parseInt(req.params.id);
    // customer_id may be:
    //   absent / undefined  → no filter (return all lines)
    //   'null' or ''        → filter for lines where customer_id IS NULL (unattributed group)
    //   a UUID string       → filter for that specific customer
    const rawCustId  = req.query.customer_id;
    const params     = [runId];
    let   custFilter = '';
    if (rawCustId !== undefined) {
      const isUnattributed = !rawCustId || rawCustId === 'null';
      if (isUnattributed) {
        custFilter = `AND rl.customer_id IS NULL`;
      } else {
        params.push(rawCustId);
        custFilter = `AND rl.customer_id = $${params.length}`;
      }
    }

    const result = await query(`
      SELECT
        rl.id,
        rl.tracking_number,
        rl.shipment_date,
        rl.carrier_amount,
        rl.expected_amount,
        rl.status,
        rl.corrected_by,
        rl.charge_type,
        rl.parcel_count,
        rl.carrier_billed_weight_kg,
        cs.name                                                          AS service_name,
        -- sell_base: freight only (corrected at billed weight, or booking-time price)
        COALESCE(rl.corrected_sell_price, base.sell_price, base.price, 0) AS sell_base,
        -- sell_fuel: fuel surcharge sell for this shipment
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = base.shipment_id
            AND  sc.charge_type = 'fuel'
            AND  sc.cancelled   = false
        ), 0)                                                            AS sell_fuel,
        -- sell_surcharge: non-fuel surcharge sell (handling, GC, etc.)
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = base.shipment_id
            AND  sc.charge_type = 'surcharge'
            AND  sc.cancelled   = false
        ), 0)                                                            AS sell_surcharge,
        -- sell_total: full amount billed to customer
        COALESCE(rl.corrected_sell_price, base.sell_price, base.price, 0)
        + COALESCE((
            SELECT SUM(sc.price)
            FROM   charges sc
            WHERE  sc.shipment_id = base.shipment_id
              AND  sc.charge_type IN ('fuel', 'surcharge')
              AND  sc.cancelled   = false
          ), 0)                                                          AS sell_total,
        -- Cost: total_cost_price = base + fuel + surcharge charges.
        -- Matches Finance page; avoids the DPD separate_fuel_rows inflation where
        -- carrier_amount only covers the freight line, not overhead auto-corrected rows.
        COALESCE(base.cost_price, 0)
        + COALESCE((
            SELECT SUM(sc.cost_price)
            FROM   charges sc
            WHERE  sc.shipment_id = base.shipment_id
              AND  sc.charge_type IN ('fuel','surcharge')
              AND  sc.cancelled   = false
          ), 0)                                                          AS cost_total
      FROM   reconciliation_lines rl
      LEFT JOIN courier_services cs   ON cs.id  = rl.service_id
      LEFT JOIN charges          base ON base.id = rl.charge_id AND base.charge_type = 'courier' AND base.cancelled = false
      WHERE  rl.run_id = $1
        AND  rl.status IN ('matched', 'corrected')
        AND  rl.is_fuel = false
        AND  rl.surcharge_id IS NULL
        ${custFilter}
      ORDER  BY rl.shipment_date ASC NULLS LAST, rl.tracking_number
    `, params);

    return res.json(result.rows);
  } catch (err) {
    console.error('[reconciliation/customers/preview/lines] error:', err.message);
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

// ─── GET /api/reconciliation/runs/:id/export/preview-csv ────────────────────
// Pre-finalization billing CSV for one customer.
// Same format as /export/csv but sourced from reconciliation_lines + charges
// so it can be downloaded before the run is finalized.
// Query param: customer_id (required)

router.get('/runs/:id/export/preview-csv', async (req, res) => {
  try {
    const runId      = parseInt(req.params.id);
    const { customer_id } = req.query;
    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });

    // Run metadata
    const runRes = await query(
      `SELECT rr.*, co.name AS carrier_name
       FROM   reconciliation_runs rr
       LEFT JOIN couriers co ON co.id = rr.carrier_id
       WHERE  rr.id = $1`, [runId]
    );
    if (!runRes.rows.length) return res.status(404).json({ error: 'Run not found' });
    const run = runRes.rows[0];

    // Lines joined to charges for full billing detail
    const linesRes = await query(`
      SELECT
        rl.tracking_number,
        rl.shipment_date,
        rl.charge_type,
        rl.parcel_count,
        rl.carrier_billed_weight_kg,
        rl.surcharge_id,
        rl.status,
        cs.name                                                   AS service_name,
        cu.business_name                                          AS customer_name,
        -- Sell amounts: base from recon line (corrected) or charge price
        COALESCE(rl.corrected_sell_price, ch.price, rl.carrier_amount) AS sell_base,
        -- Fuel sell: direct from charges table (same shipment, charge_type='fuel')
        -- This is correct for DPD separate_fuel_rows mode where fuel overhead rows
        -- are NOT tagged is_fuel=true in reconciliation_lines.
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = ch.shipment_id
            AND  sc.charge_type = 'fuel'
            AND  sc.cancelled   = false
        ), 0)                                                     AS sell_fuel,
        -- Surcharge sell total: direct from charges table (standing charges, GEC etc.)
        COALESCE((
          SELECT SUM(sc.price)
          FROM   charges sc
          WHERE  sc.shipment_id = ch.shipment_id
            AND  sc.charge_type = 'surcharge'
            AND  sc.cancelled   = false
            AND  NOT EXISTS (
              SELECT 1 FROM surcharges sx
              WHERE sx.id = sc.surcharge_id AND sx.reconciliation_excluded = true
            )
        ), 0)                                                     AS sell_surcharge_total,
        -- Charge metadata
        ch.order_id                                               AS order_reference,
        -- Recipient name: charges table → shipments table → recon line (CSV extract)
        COALESCE(ch.ship_to_name, sh.ship_to_name, rl.ship_to_name) AS recipient_name,
        -- Postcode: charges table → shipments table → recon line (CSV extract)
        COALESCE(ch.ship_to_postcode, sh.ship_to_postcode, rl.ship_to_postcode) AS postcode,
        COALESCE(rl.carrier_billed_weight_kg, sh.total_weight_kg) AS weight_kg
      FROM   reconciliation_lines rl
      LEFT JOIN courier_services cs  ON cs.id  = rl.service_id
      LEFT JOIN customers        cu  ON cu.id  = rl.customer_id
      LEFT JOIN charges          ch  ON ch.id  = rl.charge_id AND ch.charge_type = 'courier' AND ch.cancelled = false
      LEFT JOIN shipments        sh  ON sh.id  = ch.shipment_id
      WHERE  rl.run_id      = $1
        AND  rl.customer_id = $2
        AND  rl.status      IN ('matched', 'corrected')
        AND  rl.is_fuel     = false
        AND  rl.surcharge_id IS NULL
      ORDER  BY rl.shipment_date ASC NULLS LAST, rl.tracking_number, rl.charge_type
    `, [runId, customer_id]);

    const allLines = linesRes.rows;
    if (!allLines.length) return res.status(404).json({ error: 'No matched/corrected lines for this customer' });

    const esc = v => { const s = String(v == null ? '' : v); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };

    const headers = [
      'Tracking Number', 'Order Reference', 'Despatch Date',
      'Recipient Name', 'Postcode', 'Service', 'Weight (kg)',
      'Base Charge (£)', 'Fuel Charge (£)',
      'Total Surcharges (£)', 'Line Total (£)', 'Status',
    ];

    let totalBase = 0, totalFuel = 0, totalSurch = 0;

    const rows = allLines.map(l => {
      const base  = parseFloat(l.sell_base         || 0);
      const fuel  = parseFloat(l.sell_fuel         || 0);
      const surch = parseFloat(l.sell_surcharge_total || 0);
      const total = base + fuel + surch;
      totalBase  += base; totalFuel += fuel; totalSurch += surch;
      return [
        l.tracking_number   || '',
        l.order_reference   || '',
        l.shipment_date ? new Date(l.shipment_date).toLocaleDateString('en-GB') : '',
        l.recipient_name    || '',
        l.postcode          || '',
        l.service_name      || '',
        l.weight_kg != null ? parseFloat(l.weight_kg).toFixed(3) : '',
        base.toFixed(2),
        fuel.toFixed(2),
        surch.toFixed(2),
        total.toFixed(2),
        l.status            || '',
      ];
    });

    rows.push([]);
    rows.push(['TOTAL', '', '', '', '', '', '',
      totalBase.toFixed(2), totalFuel.toFixed(2),
      totalSurch.toFixed(2),
      (totalBase + totalFuel + totalSurch).toFixed(2), '',
    ]);

    const custName = (allLines[0]?.customer_name || 'customer').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="preview_run_${runId}_${custName}.csv"`);
    return res.send([
      `"Moov OS — Billing Preview (Pre-Finalization)"`,
      `"Carrier: ${run.carrier_name || ''}"`,
      `"Invoice Ref: ${run.invoice_ref || ''}"`,
      `"Run ID: ${run.id}"`,
      `"Customer: ${allLines[0]?.customer_name || ''}"`,
      `"Generated: ${new Date().toLocaleString('en-GB')}"`,
      '',
      headers.map(esc).join(','),
      ...rows.map(r => r.map(esc).join(',')),
    ].join('\r\n'));

  } catch (err) {
    console.error('[reconciliation/export/preview-csv] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/cancelled-credit-request ───────────────
// Generates a CSV of all cancelled_booking_invoiced lines for this run,
// formatted as a DPD credit request that can be sent directly to the carrier.
// Fields: Account No, Tracking No, Collection Date, Recipient, Postcode,
//         Parcels, Amount Charged (£), Our Reference, Customer, Reason

router.get('/runs/:id/cancelled-credit-request', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);
    if (isNaN(runId)) return res.status(400).json({ error: 'Invalid run id' });

    const { rows } = await query(`
      SELECT
        rl.carrier_account_no,
        rl.tracking_number,
        COALESCE(s.collection_date, rl.shipment_date)  AS collection_date,
        rl.ship_to_name,
        rl.ship_to_postcode,
        COALESCE(rl.parcel_count, 1)                   AS parcel_count,
        rl.carrier_amount,
        s.reference                                    AS shipment_reference,
        cu.business_name                               AS customer_name,
        rr.invoice_ref
      FROM   reconciliation_lines rl
      JOIN   reconciliation_runs rr ON rr.id = rl.run_id
      LEFT JOIN charges ch ON ch.id = rl.charge_id
      LEFT JOIN shipments s  ON s.id  = ch.shipment_id
      LEFT JOIN customers cu ON cu.id = rl.customer_id
      WHERE  rl.run_id            = $1
      AND    rl.unmatched_reason  = 'cancelled_booking_invoiced'
      ORDER  BY rl.tracking_number
    `, [runId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'No cancelled-booking lines found for this run' });
    }

    const invoiceRef = rows[0].invoice_ref || runId;
    const filename   = `dpd_credit_request_${invoiceRef}.csv`;

    // CSV header + rows
    const escape = v => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';

    const header = [
      'Account No', 'Tracking Number', 'Collection Date', 'Recipient Name',
      'Recipient Postcode', 'Parcels', 'Amount Charged (GBP)',
      'Our Reference', 'Customer', 'Reason'
    ];
    const csvLines = [
      header.map(escape).join(','),
      ...rows.map(r => [
        r.carrier_account_no || '',
        r.tracking_number,
        fmt(r.collection_date),
        r.ship_to_name || '',
        r.ship_to_postcode || '',
        r.parcel_count,
        parseFloat(r.carrier_amount).toFixed(2),
        r.shipment_reference || '',
        r.customer_name || '',
        'Cancelled booking — credit requested',
      ].map(escape).join(',')),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvLines.join('\r\n'));
  } catch (err) {
    console.error('[reconciliation/cancelled-credit-request] error:', err.message);
    res.status(500).json({ error: err.message });
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

// ─── GET /api/reconciliation/pool-diagnostic ─────────────────────────────────
// Diagnostic: check whether a specific tracking number / consignment number
// would be found in the Verified Pool for a given carrier.
// Useful for debugging without running a full reconciliation.
//
// Query params: carrier_id (required), tracking_number (required)

router.get('/pool-diagnostic', async (req, res) => {
  try {
    const { carrier_id, tracking_number } = req.query;
    if (!carrier_id || !tracking_number) {
      return res.status(400).json({ error: 'carrier_id and tracking_number are required' });
    }

    const trackKey  = String(tracking_number).trim().toUpperCase();
    const carrierId = parseInt(carrier_id);

    // Build variants to search for (mirrors poolLookup logic).
    // "600..." numbers need slice(3) not slice(2) to avoid a leading "0".
    const variants = [trackKey];
    if (trackKey.startsWith('600') && trackKey.length > 5) {
      variants.push(trackKey.slice(3));   // "600123456789" → "123456789"
      variants.push(trackKey.slice(2));   // "600123456789" → "0123456789" (fallback)
    } else if (trackKey.startsWith('60') && trackKey.length > 4) {
      variants.push(trackKey.slice(2));   // "601234567890" → "1234567890"
    } else {
      variants.push('60' + trackKey);     // bare → add "60" prefix
    }

    // 1. Check shipments table directly
    const shipmentRes = await query(`
      SELECT
        s.id           AS shipment_id,
        s.courier,
        s.dc_service_id,
        s.tracking_codes,
        s.created_at
      FROM   shipments s
      WHERE  (
        s.dc_service_id = ANY($1)
        OR EXISTS (
          SELECT 1 FROM unnest(s.tracking_codes) tc
          WHERE UPPER(tc) = ANY($1)
        )
      )
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [variants]);

    // 2. Check if those shipments have verified courier charges
    const chargeRes = await query(`
      SELECT
        c.id              AS charge_id,
        c.cost_price      AS expected_cost,
        c.verified,
        c.cancelled,
        c.charge_type,
        s.courier,
        s.dc_service_id,
        s.tracking_codes
      FROM   charges   c
      JOIN   shipments s ON s.id = c.shipment_id
      JOIN   couriers  cu ON cu.id = $2
      WHERE  (
        s.dc_service_id = ANY($1)
        OR EXISTS (
          SELECT 1 FROM unnest(s.tracking_codes) tc
          WHERE UPPER(tc) = ANY($1)
        )
      )
        AND c.charge_type = 'courier'
      ORDER BY c.created_at DESC
      LIMIT 10
    `, [variants, carrierId]);

    // 3. Check pool query as-is (does it include verified=true + carrier match + gate)
    const poolRes = await query(`
      SELECT
        c.id              AS charge_id,
        c.cost_price      AS expected_cost,
        c.verified,
        c.cancelled,
        c.charge_type,
        s.courier,
        s.dc_service_id,
        s.tracking_codes,
        cu_carrier.code   AS carrier_code,
        cu_carrier.name   AS carrier_name
      FROM   charges      c
      JOIN   shipments    s          ON s.id           = c.shipment_id
      JOIN   couriers     cu_carrier ON cu_carrier.id  = $2
      LEFT JOIN customers cu         ON cu.id          = c.customer_id
      WHERE  (
        s.dc_service_id = ANY($1)
        OR EXISTS (
          SELECT 1 FROM unnest(s.tracking_codes) tc
          WHERE UPPER(tc) = ANY($1)
        )
      )
        AND c.charge_type = 'courier'
      LIMIT 10
    `, [variants, carrierId]);

    return res.json({
      searched_for:         tracking_number,
      variants_tried:       variants,
      shipments_found:      shipmentRes.rows,
      all_charges_found:    chargeRes.rows,
      pool_eligible_charges: poolRes.rows,
      diagnosis: (() => {
        if (shipmentRes.rows.length === 0) return 'NOT_IN_DB: No shipment found with this tracking number or dc_service_id';
        if (chargeRes.rows.length === 0) return 'NO_COURIER_CHARGE: Shipment exists but no courier charge found';
        // Only look at non-cancelled charges for verification check
        const activeCourier = chargeRes.rows.filter(r => !r.cancelled && r.charge_type === 'courier');
        if (activeCourier.length === 0) return `ALL_CANCELLED: ${chargeRes.rows.length} charge(s) found but all are cancelled`;
        const notVerified = activeCourier.filter(r => !r.verified);
        if (notVerified.length === activeCourier.length) return `NOT_VERIFIED: ${notVerified.length} active charge(s) found but none are verified`;
        const poolHits = poolRes.rows.filter(r => r.verified && !r.cancelled);
        if (poolHits.length > 0) return `IN_POOL: charge ${poolHits[0].charge_id} — expected_cost=£${poolHits[0].expected_cost} — shipments.courier="${poolHits[0].courier}" matches carrier code="${poolHits[0].carrier_code}"`;
        return `CARRIER_MISMATCH: Verified charge exists but failed carrier filter. shipments.courier="${activeCourier[0]?.courier}" vs carrier code="${chargeRes.rows[0]?.courier}"`;
      })(),
    });
  } catch (err) {
    console.error('[reconciliation/pool-diagnostic] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/pool-courier-gap ────────────────────────────────
//
// Gap 2 diagnostic: finds every distinct shipments.courier string that does NOT
// match any carrier via the strict exact-match rule used in buildVerifiedPool.
//
// A charge whose shipment has a non-matching courier string will be invisible
// to the reconciliation pool — the engine won't find it and will treat the
// invoice line as carrier-direct (creating a duplicate charge).
//
// Returns:
//   unmatched_couriers  — distinct s.courier values with no carrier match,
//                         how many active verified courier charges each has,
//                         and the closest carrier by name for quick triage.
//   matched_couriers    — courier strings that DO match (for reference).
//   total_invisible_charges — total active verified courier charges that won't
//                             appear in any carrier's reconciliation pool.

router.get('/pool-courier-gap', async (req, res) => {
  try {
    const result = await query(`
      WITH carrier_strings AS (
        -- All code/name/alias strings from the couriers table (what the pool matches against)
        SELECT id AS carrier_id, code AS match_str, name AS carrier_name FROM couriers
        UNION ALL
        SELECT id, name AS match_str, name AS carrier_name FROM couriers
        UNION ALL
        SELECT id, unnest(aliases) AS match_str, name AS carrier_name FROM couriers WHERE array_length(aliases, 1) > 0
      ),
      shipment_courier_counts AS (
        -- Distinct courier strings on shipments that have active verified courier charges
        SELECT
          s.courier                                         AS courier_str,
          COUNT(DISTINCT c.id)                              AS active_charge_count,
          COUNT(DISTINCT c.customer_id)                     AS customer_count,
          MIN(c.created_at)                                 AS oldest_charge,
          MAX(c.created_at)                                 AS newest_charge
        FROM   charges   c
        JOIN   shipments s ON s.id = c.shipment_id
        WHERE  c.charge_type = 'courier'
          AND  c.cancelled   = false
          AND  c.verified    = true
          AND  s.courier     IS NOT NULL
          AND  s.courier     != ''
        GROUP BY s.courier
      ),
      matched AS (
        SELECT DISTINCT scc.courier_str
        FROM   shipment_courier_counts scc
        JOIN   carrier_strings         cs ON LOWER(scc.courier_str) = LOWER(cs.match_str)
      )
      SELECT
        scc.courier_str,
        scc.active_charge_count,
        scc.customer_count,
        scc.oldest_charge,
        scc.newest_charge,
        CASE WHEN m.courier_str IS NOT NULL THEN true ELSE false END AS matches_carrier,
        (
          -- Nearest carrier name by trigram similarity (best-effort hint)
          SELECT name FROM couriers
          ORDER BY similarity(LOWER(couriers.name), LOWER(scc.courier_str)) DESC
          LIMIT 1
        ) AS closest_carrier_name
      FROM   shipment_courier_counts scc
      LEFT JOIN matched m ON m.courier_str = scc.courier_str
      ORDER BY matches_carrier ASC, scc.active_charge_count DESC
    `);

    const matched   = result.rows.filter(r => r.matches_carrier);
    const unmatched = result.rows.filter(r => !r.matches_carrier);
    const totalInvisible = unmatched.reduce((s, r) => s + parseInt(r.active_charge_count || 0), 0);

    return res.json({
      summary: {
        total_invisible_charges: totalInvisible,
        unmatched_courier_strings: unmatched.length,
        matched_courier_strings:   matched.length,
      },
      unmatched_couriers: unmatched.map(r => ({
        courier_str:         r.courier_str,
        active_charge_count: parseInt(r.active_charge_count),
        customer_count:      parseInt(r.customer_count),
        oldest_charge:       r.oldest_charge,
        newest_charge:       r.newest_charge,
        closest_carrier:     r.closest_carrier_name,
      })),
      matched_couriers: matched.map(r => ({
        courier_str:         r.courier_str,
        active_charge_count: parseInt(r.active_charge_count),
      })),
    });
  } catch (err) {
    console.error('[reconciliation/pool-courier-gap] error:', err.message);
    // pg_trgm extension may not be installed — retry without similarity()
    if (err.message.includes('similarity') || err.message.includes('pg_trgm')) {
      try {
        const fallback = await query(`
          WITH carrier_strings AS (
            SELECT id AS carrier_id, code AS match_str FROM couriers
            UNION ALL
            SELECT id, name AS match_str FROM couriers
            UNION ALL
            SELECT id, unnest(aliases) AS match_str FROM couriers WHERE array_length(aliases, 1) > 0
          ),
          shipment_courier_counts AS (
            SELECT
              s.courier                  AS courier_str,
              COUNT(DISTINCT c.id)       AS active_charge_count,
              COUNT(DISTINCT c.customer_id) AS customer_count,
              MIN(c.created_at)          AS oldest_charge,
              MAX(c.created_at)          AS newest_charge
            FROM   charges   c
            JOIN   shipments s ON s.id = c.shipment_id
            WHERE  c.charge_type = 'courier'
              AND  c.cancelled   = false
              AND  c.verified    = true
              AND  s.courier     IS NOT NULL
              AND  s.courier     != ''
            GROUP BY s.courier
          ),
          matched AS (
            SELECT DISTINCT scc.courier_str
            FROM   shipment_courier_counts scc
            JOIN   carrier_strings         cs ON LOWER(scc.courier_str) = LOWER(cs.match_str)
          )
          SELECT
            scc.courier_str,
            scc.active_charge_count,
            scc.customer_count,
            scc.oldest_charge,
            scc.newest_charge,
            CASE WHEN m.courier_str IS NOT NULL THEN true ELSE false END AS matches_carrier
          FROM   shipment_courier_counts scc
          LEFT JOIN matched m ON m.courier_str = scc.courier_str
          ORDER BY matches_carrier ASC, scc.active_charge_count DESC
        `);

        const matched2   = fallback.rows.filter(r => r.matches_carrier);
        const unmatched2 = fallback.rows.filter(r => !r.matches_carrier);
        const totalInvisible2 = unmatched2.reduce((s, r) => s + parseInt(r.active_charge_count || 0), 0);

        return res.json({
          summary: {
            total_invisible_charges:   totalInvisible2,
            unmatched_courier_strings: unmatched2.length,
            matched_courier_strings:   matched2.length,
            note: 'pg_trgm not installed — closest_carrier_name omitted',
          },
          unmatched_couriers: unmatched2.map(r => ({
            courier_str:         r.courier_str,
            active_charge_count: parseInt(r.active_charge_count),
            customer_count:      parseInt(r.customer_count),
            oldest_charge:       r.oldest_charge,
            newest_charge:       r.newest_charge,
          })),
          matched_couriers: matched2.map(r => ({
            courier_str:         r.courier_str,
            active_charge_count: parseInt(r.active_charge_count),
          })),
        });
      } catch (err2) {
        return res.status(500).json({ error: err2.message });
      }
    }
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/lines/:lineId/trace ────────────────────
// Returns a step-by-step decision trace for a single reconciliation line.
// Shows exactly what the engine found in the pool, what the rate card said,
// how expected was computed, and why the status was assigned.
router.get('/runs/:id/lines/:lineId/trace', async (req, res) => {
  try {
    const runId  = parseInt(req.params.id);
    const lineId = parseInt(req.params.lineId);

    // ── Step 1: Load the stored line ─────────────────────────────────────────
    const lineRes = await query(`
      SELECT
        rl.*,
        cs.name          AS service_name,
        cs.service_code  AS service_code_internal,
        cu.business_name AS customer_name
      FROM   reconciliation_lines rl
      LEFT JOIN courier_services cs ON cs.id = rl.service_id
      LEFT JOIN customers        cu ON cu.id = rl.customer_id
      WHERE  rl.id = $1 AND rl.run_id = $2
    `, [lineId, runId]);

    if (!lineRes.rows.length) {
      return res.status(404).json({ error: 'Line not found' });
    }
    const line = lineRes.rows[0];

    // ── Step 2: Load the linked charge + shipment ─────────────────────────────
    let chargeInfo = null;
    if (line.charge_id) {
      const cRes = await query(`
        SELECT
          c.id, c.cost_price, c.verified, c.cancelled, c.zone_name, c.charge_type,
          s.tracking_codes, s.dc_service_id, s.parcel_count, s.total_weight_kg,
          s.courier, s.reference
        FROM   charges   c
        JOIN   shipments s ON s.id = c.shipment_id
        WHERE  c.id = $1
      `, [line.charge_id]);
      if (cRes.rows.length) chargeInfo = cRes.rows[0];
    }

    // ── Step 3: Load the weight band(s) that apply ───────────────────────────
    let bandInfo = null;
    let subFallback = null;
    if (line.service_id && line.carrier_billed_weight_kg) {
      const zoneRes = chargeInfo?.zone_name
        ? await query(
            `SELECT z.id FROM zones z
             JOIN courier_services cs ON cs.id = z.courier_service_id
             WHERE cs.id = $1 AND z.name ILIKE $2 LIMIT 1`,
            [line.service_id, chargeInfo.zone_name]
          )
        : { rows: [] };
      const zoneId = zoneRes.rows[0]?.id || null;

      const bandQ = zoneId
        ? await query(
            `SELECT wb.id, wb.price_first, wb.price_sub, wb.cost_per_kg,
                    wb.min_weight_kg, wb.max_weight_kg, z.name AS zone_name
             FROM   weight_bands wb
             JOIN   zones z ON z.id = wb.zone_id
             WHERE  z.courier_service_id = $1
               AND  wb.zone_id = $2
               AND  wb.max_weight_kg IS NOT NULL
               AND  $3 >  COALESCE(wb.min_weight_kg, 0)
               AND  $3 <= wb.max_weight_kg
             ORDER BY wb.min_weight_kg DESC LIMIT 1`,
            [line.service_id, zoneId, line.carrier_billed_weight_kg]
          )
        : { rows: [] };
      bandInfo = bandQ.rows[0] || null;

      // Sub-rate fallback across the zone
      if (bandInfo && bandInfo.price_sub == null && zoneId) {
        const subQ = await query(
          `SELECT MIN(wb.price_sub) AS price_sub
           FROM   weight_bands wb
           JOIN   zones z ON z.id = wb.zone_id
           WHERE  z.courier_service_id = $1
             AND  wb.zone_id = $2
             AND  wb.price_sub IS NOT NULL`,
          [line.service_id, zoneId]
        );
        if (subQ.rows[0]?.price_sub != null) {
          subFallback = parseFloat(subQ.rows[0].price_sub);
        }
      }
    }

    // ── Step 4: Reconstruct expected calculation ──────────────────────────────
    const storedCostPrice  = parseFloat(chargeInfo?.cost_price || 0);
    const carrierAmount    = parseFloat(line.carrier_amount || 0);
    const expectedAmount   = parseFloat(line.expected_amount || 0);
    const delta            = parseFloat(line.delta || 0);
    const priceSub         = bandInfo?.price_sub != null
      ? parseFloat(bandInfo.price_sub)
      : subFallback;
    const priceFirst       = bandInfo ? parseFloat(bandInfo.price_first || 0) : null;

    // ── Build trace steps ─────────────────────────────────────────────────────
    const steps = [];

    // Pool lookup
    steps.push({
      phase: 'Pool Lookup',
      result: line.charge_id ? 'HIT' : 'MISS',
      detail: line.charge_id
        ? `Found charge #${line.charge_id} — stored cost_price=£${storedCostPrice.toFixed(2)}, zone="${chargeInfo?.zone_name || '?'}", verified=${chargeInfo?.verified}`
        : `No verified charge found for tracking "${line.tracking_number}" with this carrier`,
    });

    if (line.charge_id) {
      // Service code
      steps.push({
        phase: 'Service Code',
        result: line.service_id ? 'RESOLVED' : 'UNKNOWN',
        detail: line.service_id
          ? `Raw code "${line.raw_service_code}" → service #${line.service_id} (${line.service_code_internal || line.service_name || '?'})`
          : `Raw code "${line.raw_service_code}" not mapped — no reconciliation possible until mapped`,
      });

      // Weight band
      if (bandInfo) {
        steps.push({
          phase: 'Rate Card Lookup',
          result: 'FOUND',
          detail: `Billed weight ${line.carrier_billed_weight_kg}kg → band [${bandInfo.min_weight_kg ?? 0}–${bandInfo.max_weight_kg}kg], zone="${bandInfo.zone_name}", price_first=£${parseFloat(bandInfo.price_first).toFixed(2)}, price_sub=${bandInfo.price_sub != null ? '£' + parseFloat(bandInfo.price_sub).toFixed(2) : 'null' + (subFallback != null ? ` (zone fallback: £${subFallback.toFixed(2)})` : ' (not configured)')}`,
        });
      } else if (line.carrier_billed_weight_kg) {
        steps.push({
          phase: 'Rate Card Lookup',
          result: 'NO_BAND',
          detail: `No weight band found for ${line.carrier_billed_weight_kg}kg — cannot recompute expected from rate card`,
        });
      }

      // Expected calculation
      const parcelCount = chargeInfo?.parcel_count || 1;
      // ── Display expected from the rate card (bandInfo from step 3), not from
      // stored expected_amount. stored expected_amount can be null/0 when zone_id
      // was missing at run time — that's a DB artifact, not the current truth.
      // The rate card lookup in step 3 is always fresh and authoritative.
      let rateCardDisplay = null;
      let rateCardExplain;
      if (parcelCount > 1 && priceFirst != null && priceSub != null) {
        // Multi-parcel: DPD all-sub = n × price_sub; standard = first + (n-1) × sub
        const allAtSub = false; // trace doesn't currently know parcel_pricing; use standard formula for display
        rateCardDisplay = Math.round((priceFirst + (parcelCount - 1) * priceSub) * 100) / 100;
        rateCardExplain = `Multi-parcel (${parcelCount} parcels): rate card = £${priceFirst.toFixed(2)} + ${parcelCount - 1} × £${priceSub.toFixed(2)} = £${rateCardDisplay.toFixed(2)}`;
        if (expectedAmount > 0 && Math.abs(rateCardDisplay - expectedAmount) > 0.02) {
          rateCardExplain += ` — stored expected=£${expectedAmount.toFixed(2)} differs (may use all-sub pricing)`;
        }
      } else if (parcelCount > 1) {
        rateCardDisplay = priceFirst;
        rateCardExplain = `Multi-parcel (${parcelCount} parcels) but price_sub not found — using price_first=£${priceFirst != null ? priceFirst.toFixed(2) : '?'}`;
      } else if (priceFirst != null) {
        rateCardDisplay = priceFirst;
        rateCardExplain = `Single parcel — rate card price_first=£${priceFirst.toFixed(2)}, zone="${bandInfo?.zone_name || '?'}"`;
        if (expectedAmount > 0 && Math.abs(priceFirst - expectedAmount) > 0.02) {
          rateCardExplain += ` — stored expected=£${expectedAmount.toFixed(2)} differs (run with different rate card version)`;
        }
      } else {
        rateCardDisplay = null;
        rateCardExplain = `Rate card lookup produced no result for this service/weight/zone`;
      }
      const displayExpected = rateCardDisplay != null ? rateCardDisplay : expectedAmount;
      steps.push({ phase: 'Expected Calculation', result: `£${displayExpected != null ? displayExpected.toFixed(2) : '?'}`, detail: rateCardExplain });

      // Delta
      steps.push({
        phase: 'Delta',
        result: `£${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`,
        detail: `Carrier £${carrierAmount.toFixed(2)} − Expected £${displayExpected != null ? displayExpected.toFixed(2) : '?'} = £${delta.toFixed(2)}`,
      });

      // Status decision
      const absD = Math.abs(delta);
      let statusExplain;
      if (absD < 0.02) {
        statusExplain = 'Delta < £0.02 → Price is King rule → MATCHED';
      } else if (line.corrected_by === 'pricing_rules') {
        statusExplain = `Delta £${delta.toFixed(2)} → Correction Engine: rate card explains carrier charge → CORRECTED (pricing_rules). The stored cost_price (£${storedCostPrice.toFixed(2)}) was wrong at booking — carrier billed correctly.`;
      } else if (line.corrected_by === 'column_surcharge') {
        statusExplain = `Delta £${delta.toFixed(2)} explained by column surcharges → CORRECTED (column_surcharge)`;
      } else if (line.corrected_by === 'mapping') {
        statusExplain = `Delta £${delta.toFixed(2)} explained by saved mapping → CORRECTED (mapping)`;
      } else if (line.corrected_by === 'carrier_undercharge') {
        statusExplain = `Delta £${delta.toFixed(2)} — carrier billed LESS than expected (undercharge) → auto-accepted, no review needed → CORRECTED (carrier_undercharge)`;
      } else if (line.status === 'unmatched') {
        statusExplain = `Delta £${delta.toFixed(2)} — neither rate card nor saved mapping explains it → UNMATCHED (${line.unmatched_reason || 'unknown'})`;
      } else {
        statusExplain = `Status: ${line.status}, corrected_by: ${line.corrected_by || 'none'}`;
      }
      steps.push({ phase: 'Status Decision', result: line.status.toUpperCase(), detail: statusExplain });

      // Correction metadata if present
      if (line.correction_metadata) {
        steps.push({
          phase: 'Correction Metadata',
          result: 'STORED',
          detail: JSON.stringify(line.correction_metadata),
        });
      }
    }

    return res.json({
      line_id:      lineId,
      run_id:       runId,
      tracking:     line.tracking_number,
      status:       line.status,
      corrected_by: line.corrected_by,
      charge:       chargeInfo,
      band:         bandInfo,
      sub_fallback: subFallback,
      steps,
    });
  } catch (err) {
    console.error('[reconciliation/trace] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/shipment-lookup?tracking=<number> ───────────────
// Diagnostic: find a shipment and its charges regardless of verified/pool status.
// Used to investigate why a tracking number is missing from the reconciliation pool.
router.get('/shipment-lookup', async (req, res) => {
  try {
    const raw = (req.query.tracking || '').trim();
    if (!raw) return res.status(400).json({ error: 'tracking parameter required' });

    // Build variant list to search against dc_service_id and tracking_codes
    const variants = [raw];
    const up = raw.toUpperCase();
    if (up.startsWith('600') && up.length > 5) {
      variants.push(up.slice(3));   // "600123456789" → "123456789"
      variants.push(up.slice(2));   // fallback
      variants.push(up);
    } else if (up.startsWith('60') && up.length > 4) {
      variants.push(up.slice(2));   // "60123456789" → "123456789"
      variants.push(up);
    } else {
      variants.push('60' + up);     // bare → add "60" prefix
      variants.push('600' + up);    // bare → add "600" prefix
    }
    const uniqueVariants = [...new Set(variants.map(v => v.toUpperCase()))];

    // Search shipments — no courier gate, no verified gate.
    // Also searches by charges.order_id so operators can look up by customer reference.
    const shipRes = await query(`
      SELECT DISTINCT
        s.id,
        s.courier,
        s.dc_service_id,
        s.tracking_codes,
        s.total_weight_kg,
        s.parcel_count,
        s.created_at,
        s.reference,
        s.ship_to_postcode
      FROM shipments s
      LEFT JOIN charges c ON c.shipment_id = s.id
      WHERE s.dc_service_id = ANY($1)
         OR s.dc_service_id ILIKE ANY($2)
         OR s.tracking_codes && $1
         OR s.reference ILIKE ANY($2)
         OR c.order_id   ILIKE ANY($2)
      ORDER BY s.created_at DESC
      LIMIT 20
    `, [uniqueVariants, uniqueVariants.map(v => v)]);

    // For each shipment found, get its charges
    const results = [];
    for (const ship of shipRes.rows) {
      const chargeRes = await query(`
        SELECT
          c.id,
          c.charge_type,
          c.status,
          c.verified,
          c.cancelled,
          c.cost_price,
          COALESCE(c.sell_price, c.price) AS sell_price,
          c.zone_name,
          c.recon_corrected,
          c.source,
          c.created_at,
          cs.name              AS service_name,
          cs.service_code      AS service_code,
          cu.business_name     AS customer_name,
          cu.account_number
        FROM charges c
        LEFT JOIN customers       cu ON cu.id = c.customer_id
        LEFT JOIN courier_services cs ON cs.id = c.courier_service_id
        WHERE c.shipment_id = $1
        ORDER BY c.charge_type, c.created_at
      `, [ship.id]);

      // total_cost_price = what the reconciliation engine uses as expected_amount:
      // base courier cost_price + SUM of fuel/surcharge cost_prices (non-cancelled).
      const baseCourier = chargeRes.rows.find(c => c.charge_type === 'courier' && !c.cancelled);
      const surchargeSum = chargeRes.rows
        .filter(c => ['fuel', 'surcharge'].includes(c.charge_type) && !c.cancelled)
        .reduce((s, c) => s + (parseFloat(c.cost_price) || 0), 0);
      const totalCostPrice = baseCourier
        ? Math.round(((parseFloat(baseCourier.cost_price) || 0) + surchargeSum) * 100) / 100
        : null;

      results.push({
        shipment: {
          id:               ship.id,
          courier:          ship.courier,
          dc_service_id:    ship.dc_service_id,
          tracking_codes:   ship.tracking_codes || [],
          total_weight_kg:  ship.total_weight_kg,
          parcel_count:     ship.parcel_count,
          reference:        ship.reference,
          ship_to_postcode: ship.ship_to_postcode,
          created_at:       ship.created_at,
        },
        total_cost_price: totalCostPrice,
        charges: chargeRes.rows.map(c => ({
          id:              c.id,
          charge_type:     c.charge_type,
          status:          c.status,
          verified:        c.verified,
          cancelled:       c.cancelled,
          cost_price:      c.cost_price,
          sell_price:      c.sell_price,
          zone_name:       c.zone_name,
          service_name:    c.service_name,
          service_code:    c.service_code,
          source:          c.source,
          recon_corrected: c.recon_corrected,
          customer_name:   c.customer_name,
          account_number:  c.account_number,
          created_at:      c.created_at,
        })),
        pool_eligible: chargeRes.rows.some(c =>
          c.charge_type === 'courier' && c.verified === true && c.cancelled === false
        ),
        pool_blockers: [
          ...(!chargeRes.rows.some(c => c.charge_type === 'courier') ? ['No courier charge exists'] : []),
          ...(chargeRes.rows.some(c => c.charge_type === 'courier' && c.verified === false && c.cancelled === false)
            ? ['Courier charge exists but verified = false'] : []),
          ...(chargeRes.rows.some(c => c.charge_type === 'courier' && c.cancelled === true)
            ? ['Courier charge is cancelled'] : []),
          ...(!ship.dc_service_id && (!ship.tracking_codes || ship.tracking_codes.length === 0)
            ? ['Shipment has no dc_service_id and no tracking_codes — pool lookup cannot find it'] : []),
        ],
      });
    }

    return res.json({
      tracking_searched: raw,
      variants_tried: uniqueVariants,
      shipments_found: results.length,
      results,
    });
  } catch (err) {
    console.error('[reconciliation/shipment-lookup] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/carrier-pool-sample ─────────────────────────────
// Shows sample pool entries for a carrier — reveals what format tracking_codes
// and references are stored in so you can verify the CSV column mapping is right.
//
// Query params:
//   carrier_id   (required) — couriers.id
//   limit        (optional, default 20)
//   customer     (optional) — partial match on customers.business_name to filter
//
// Returns the first N verified DPD charges with their tracking_codes/dc_service_id
// so you can see exactly what the pool would index them under.

router.get('/carrier-pool-sample', async (req, res) => {
  try {
    const carrierId = parseInt(req.query.carrier_id);
    if (!carrierId) return res.status(400).json({ error: 'carrier_id required' });

    const limit    = Math.min(parseInt(req.query.limit) || 20, 100);
    const customer = (req.query.customer || '').trim();

    const sampleRes = await query(`
      SELECT
        c.id                     AS charge_id,
        c.order_id               AS reference,
        c.cost_price             AS expected_cost,
        c.verified,
        c.cancelled,
        cu.business_name         AS customer_name,
        cu.account_number        AS customer_account,
        s.courier,
        s.dc_service_id,
        s.tracking_codes,
        s.reference              AS shipment_reference,
        s.reference_2,
        s.created_at
      FROM   charges      c
      JOIN   shipments    s          ON s.id          = c.shipment_id
      JOIN   couriers     cu_carrier ON cu_carrier.id = $1
      LEFT JOIN customers cu         ON cu.id         = c.customer_id
      WHERE  c.charge_type  = 'courier'
        AND  c.cancelled    = false
        AND  (
          s.courier ILIKE cu_carrier.code
          OR s.courier ILIKE cu_carrier.name
          OR s.courier ILIKE '%' || cu_carrier.code || '%'
          OR cu_carrier.code ILIKE '%' || s.courier || '%'
          OR s.courier ILIKE '%' || cu_carrier.name || '%'
          OR cu_carrier.name ILIKE '%' || s.courier || '%'
        )
        ${customer ? `AND cu.business_name ILIKE '%' || $3 || '%'` : ''}
      ORDER BY c.created_at DESC
      LIMIT $2
    `, customer ? [carrierId, limit, customer] : [carrierId, limit]);

    // Also show overall pool stats
    const statsRes = await query(`
      SELECT
        COUNT(*)                                       AS total_charges,
        COUNT(*) FILTER (WHERE c.verified = true)      AS verified_charges,
        COUNT(*) FILTER (WHERE
          (s.tracking_codes IS NOT NULL AND array_length(s.tracking_codes, 1) > 0)
          OR s.dc_service_id IS NOT NULL
        )                                              AS gate_passed,
        COUNT(*) FILTER (WHERE
          c.verified = true
          AND (
            (s.tracking_codes IS NOT NULL AND array_length(s.tracking_codes, 1) > 0)
            OR s.dc_service_id IS NOT NULL
          )
        )                                              AS pool_eligible,
        COUNT(DISTINCT cu.id)                          AS unique_customers
      FROM   charges      c
      JOIN   shipments    s          ON s.id          = c.shipment_id
      JOIN   couriers     cu_carrier ON cu_carrier.id = $1
      LEFT JOIN customers cu         ON cu.id         = c.customer_id
      WHERE  c.charge_type  = 'courier'
        AND  c.cancelled    = false
        AND  (
          s.courier ILIKE cu_carrier.code
          OR s.courier ILIKE cu_carrier.name
          OR s.courier ILIKE '%' || cu_carrier.code || '%'
          OR cu_carrier.code ILIKE '%' || s.courier || '%'
          OR s.courier ILIKE '%' || cu_carrier.name || '%'
          OR cu_carrier.name ILIKE '%' || s.courier || '%'
        )
    `, [carrierId]);

    return res.json({
      carrier_id:  carrierId,
      pool_stats:  statsRes.rows[0],
      sample:      sampleRes.rows,
      note: 'tracking_codes = what the pool indexes. The CSV tracking_number column value must match one of these for a pool hit.',
    });
  } catch (err) {
    console.error('[reconciliation/carrier-pool-sample] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/runs/:id/tracking-probe ─────────────────────────
// For a completed run, shows:
//   1. The tracking_numbers that came in from the CSV (from reconciliation_lines)
//   2. Whether each one would be found in the DB (shipments.tracking_codes or dc_service_id)
//   3. The unmatched_reason breakdown for the run
//
// Use this immediately after a failed run to understand WHY lines didn't match.

router.get('/runs/:id/tracking-probe', async (req, res) => {
  try {
    const runId = parseInt(req.params.id);

    // Get run info
    const runRes = await query(
      `SELECT rr.id, rr.carrier_id, rr.status, cu.name AS carrier_name, cu.code AS carrier_code
       FROM reconciliation_runs rr
       JOIN couriers cu ON cu.id = rr.carrier_id
       WHERE rr.id = $1`,
      [runId]
    );
    if (!runRes.rows.length) return res.status(404).json({ error: 'Run not found' });
    const run = runRes.rows[0];

    // Breakdown by status and unmatched_reason
    const summaryRes = await query(`
      SELECT
        status,
        unmatched_reason,
        source,
        COUNT(*) AS line_count,
        COUNT(*) FILTER (WHERE tracking_number IS NULL OR tracking_number = '') AS blank_tracking
      FROM reconciliation_lines
      WHERE run_id = $1
      GROUP BY status, unmatched_reason, source
      ORDER BY line_count DESC
    `, [runId]);

    // Sample of lines with blank tracking numbers (the core problem)
    const blankTrackingRes = await query(`
      SELECT id, tracking_number, raw_service_code, carrier_amount, status, unmatched_reason, carrier_account_no
      FROM reconciliation_lines
      WHERE run_id = $1
        AND (tracking_number IS NULL OR tracking_number = '')
      LIMIT 10
    `, [runId]);

    // Sample of lines WITH tracking numbers that still didn't match
    const missedWithTrackingRes = await query(`
      SELECT id, tracking_number, raw_service_code, carrier_amount, status, unmatched_reason, carrier_account_no
      FROM reconciliation_lines
      WHERE run_id = $1
        AND tracking_number IS NOT NULL AND tracking_number <> ''
        AND status = 'unmatched'
      LIMIT 10
    `, [runId]);

    // For a sample of unmatched tracking numbers, check if they exist in shipments at all
    const sampleTrackNums = missedWithTrackingRes.rows
      .map(r => r.tracking_number)
      .filter(Boolean)
      .slice(0, 5);

    let shipmentLookup = [];
    if (sampleTrackNums.length > 0) {
      const allVariants = [];
      for (const tn of sampleTrackNums) {
        const up = tn.toUpperCase();
        allVariants.push(up);
        if (!up.startsWith('60')) allVariants.push('60' + up);
      }
      const lookupRes = await query(`
        SELECT
          s.id          AS shipment_id,
          s.courier,
          s.dc_service_id,
          s.tracking_codes,
          s.reference,
          c.verified,
          c.cancelled,
          cu.business_name AS customer_name
        FROM shipments s
        LEFT JOIN charges  c  ON c.shipment_id = s.id AND c.charge_type = 'courier'
        LEFT JOIN customers cu ON cu.id = c.customer_id
        WHERE s.dc_service_id = ANY($1)
           OR s.tracking_codes && $1
        LIMIT 20
      `, [allVariants]);
      shipmentLookup = lookupRes.rows;
    }

    return res.json({
      run,
      status_breakdown:          summaryRes.rows,
      blank_tracking_sample:     blankTrackingRes.rows,
      unmatched_with_tracking:   missedWithTrackingRes.rows,
      db_lookup_for_unmatched:   shipmentLookup,
      diagnosis_hints: {
        blank_tracking_count:    blankTrackingRes.rows.length,
        note_if_blank_tracking:  'If most lines have blank tracking_number, the CSV column mapped to tracking_number is wrong (e.g. Senders Ref is empty). Fix: map tracking_number to the Consignment column.',
        note_if_not_in_db:       'If tracking numbers are present but db_lookup_for_unmatched is empty, the DPD consignment numbers are not stored in shipments.tracking_codes. Check billing webhook create_label_parcels payload.',
        note_if_not_verified:    'If shipments exist but verified=false, the shipment-verified event has not fired. The pool only includes verified=true charges.',
      },
    });
  } catch (err) {
    console.error('[reconciliation/tracking-probe] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/consignment-trace ───────────────────────────────
// Full engine simulation for a single DPD (or any carrier) consignment number.
// Mirrors the reconciliation engine's exact decision path so you can trace why
// a specific parcel matched or didn't.
//
// Query params:
//   tracking        (required) — the raw consignment number from the CSV
//   carrier_id      (required) — couriers.id for the carrier
//   carrier_amount  (optional) — what the carrier billed (£) for comparison
//   raw_service_code (optional) — service code from the CSV (e.g. "9" for DPD Classic)

router.get('/consignment-trace', async (req, res) => {
  try {
    const { tracking, carrier_id, carrier_amount, raw_service_code } = req.query;
    if (!tracking || !carrier_id) {
      return res.status(400).json({ error: 'tracking and carrier_id are required' });
    }

    const carrierAmt  = carrier_amount ? parseFloat(carrier_amount) : null;
    const rawCode     = (raw_service_code || '').trim().toUpperCase();
    const trackKey    = tracking.trim().toUpperCase();
    const carrierId   = parseInt(carrier_id, 10);

    // Validate carrier_id early — parseInt of a non-numeric string (e.g. UUID)
    // gives NaN, which would silently produce a false CARRIER_MISMATCH verdict.
    if (isNaN(carrierId)) {
      return res.status(400).json({
        error: `carrier_id "${carrier_id}" is not a valid integer. Pass the numeric couriers.id (e.g. carrier_id=3).`,
        hint:  'Find the correct carrier_id by calling GET /api/reconciliation/carriers',
      });
    }

    const steps = [];

    // ── Step 1: Find shipment ────────────────────────────────────────────────
    // Mirror poolLookup variants: try exact, plus "60"-prefix variants
    const variants = [trackKey];
    if (trackKey.startsWith('600') && trackKey.length > 5) {
      variants.push(trackKey.slice(3), trackKey.slice(2));
    } else if (trackKey.startsWith('60') && trackKey.length > 4) {
      variants.push(trackKey.slice(2));
    } else {
      variants.push('60' + trackKey);
    }

    const shipRes = await query(`
      SELECT
        s.id                AS shipment_id,
        s.courier,
        s.dc_service_id,
        s.tracking_codes,
        s.reference,
        s.reference_2,
        s.total_weight_kg,
        s.parcel_count,
        s.ship_to_postcode,
        s.created_at,
        cu.business_name    AS customer_name,
        cu.id               AS customer_id,
        cu.account_number   AS customer_account
      FROM   shipments    s
      LEFT JOIN charges   c  ON c.shipment_id = s.id AND c.charge_type = 'courier' AND c.cancelled = false
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE  s.tracking_codes && $1
          OR s.dc_service_id = ANY($1)
      ORDER BY s.created_at DESC
      LIMIT 3
    `, [variants]);

    if (shipRes.rows.length === 0) {
      steps.push({
        phase: '1 — Shipment Lookup',
        result: 'NOT_FOUND',
        detail: `No shipment in DB has tracking_codes containing "${tracking}" (or variants: ${variants.join(', ')}). The consignment number is not in our OMS.`,
      });
      return res.json({ tracking, steps, verdict: 'NOT_IN_DB' });
    }

    const shipment = shipRes.rows[0];
    steps.push({
      phase: '1 — Shipment Lookup',
      result: 'FOUND',
      detail: `Shipment #${shipment.shipment_id} — courier="${shipment.courier}", customer="${shipment.customer_name || 'unknown'}", reference="${shipment.reference}", tracking_codes=${JSON.stringify(shipment.tracking_codes)}, weight=${shipment.total_weight_kg}kg, parcels=${shipment.parcel_count}`,
    });

    // ── Step 2: Carrier match ────────────────────────────────────────────────
    const carrierRes = await query(
      `SELECT id, code, name FROM couriers WHERE id = $1`, [carrierId]
    );
    if (!carrierRes.rows.length) {
      return res.status(400).json({
        error: `No carrier found with id=${carrierId}. Check couriers table or call GET /api/reconciliation/carriers for valid IDs.`,
      });
    }
    const carrier = carrierRes.rows[0];
    const courierVal = (shipment.courier || '').toLowerCase();
    const cCode = (carrier?.code || '').toLowerCase();
    const cName = (carrier?.name || '').toLowerCase();
    const carrierMatches = cCode && (
      courierVal.includes(cCode) || cCode.includes(courierVal) ||
      courierVal.includes(cName) || cName.includes(courierVal)
    );
    steps.push({
      phase: '2 — Carrier Match',
      result: carrierMatches ? 'MATCH' : 'MISMATCH',
      detail: carrierMatches
        ? `shipments.courier="${shipment.courier}" matches carrier code="${carrier?.code}" / name="${carrier?.name}"`
        : `PROBLEM: shipments.courier="${shipment.courier}" does NOT match carrier code="${carrier?.code}" / name="${carrier?.name}" — this shipment will never enter the pool for this carrier`,
    });

    // ── Step 3: Verified charge ──────────────────────────────────────────────
    const chargeRes = await query(`
      SELECT
        c.id                   AS charge_id,
        c.cost_price,
        c.verified,
        c.cancelled,
        c.zone_name,
        c.order_id,
        c.charge_type
      FROM   charges   c
      JOIN   shipments s ON s.id = c.shipment_id
      WHERE  (s.tracking_codes && $1 OR s.dc_service_id = ANY($1))
        AND  c.charge_type = 'courier'
        AND  c.cancelled = false
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [variants]);

    if (chargeRes.rows.length === 0) {
      steps.push({
        phase: '3 — Charge Lookup',
        result: 'NO_CHARGE',
        detail: 'No courier charge record exists for this shipment. The billing webhook may not have fired, or charges were cancelled.',
      });
      return res.json({ tracking, shipment, steps, verdict: 'NO_CHARGE' });
    }

    const charge = chargeRes.rows.find(c => c.verified) || chargeRes.rows[0];
    if (!charge.verified) {
      steps.push({
        phase: '3 — Charge Lookup',
        result: 'NOT_VERIFIED',
        detail: `Charge #${charge.charge_id} exists (cost_price=£${charge.cost_price}) but verified=false. The pool only includes verified charges. The shipment-verified webhook event has not fired for this shipment yet.`,
      });
    } else {
      steps.push({
        phase: '3 — Charge Lookup',
        result: 'VERIFIED',
        detail: `Charge #${charge.charge_id} — verified=true, cost_price=£${charge.cost_price}, zone="${charge.zone_name}", order_id="${charge.order_id}"`,
      });
    }

    // ── Step 4: Pool gate ────────────────────────────────────────────────────
    const hasTrackingCodes = shipment.tracking_codes && shipment.tracking_codes.length > 0;
    const hasDcServiceId   = !!shipment.dc_service_id;
    const gatePass = hasTrackingCodes || hasDcServiceId;
    steps.push({
      phase: '4 — Pool Gate',
      result: gatePass ? (charge.verified ? 'IN_POOL' : 'GATE_PASSED_BUT_NOT_VERIFIED') : 'BLOCKED',
      detail: gatePass
        ? `Gate passed — tracking_codes=${JSON.stringify(shipment.tracking_codes)}, dc_service_id="${shipment.dc_service_id}". ${charge.verified ? 'Charge is verified → this shipment IS in the pool.' : 'Charge is NOT verified → not in pool.'}`
        : `PROBLEM: shipments.tracking_codes is empty AND dc_service_id is null — pool gate blocks this shipment from ever entering the pool.`,
    });

    if (!charge.verified) {
      return res.json({ tracking, shipment, charge, steps, verdict: 'NOT_VERIFIED_BLOCKED' });
    }

    // ── Step 5: Service code mapping ─────────────────────────────────────────
    let serviceId = null;
    let serviceName = null;
    if (rawCode) {
      const svcRes = await query(`
        SELECT cscm.service_id, cs.name AS service_name, cs.service_code
        FROM   courier_service_code_mappings cscm
        JOIN   courier_services             cs ON cs.id = cscm.service_id
        JOIN   couriers                     cu ON cu.id = cs.courier_id
        WHERE  UPPER(cscm.raw_code) = $1
          AND  cu.id = $2
          AND  cscm.service_id IS NOT NULL
        LIMIT 1
      `, [rawCode, carrierId]);
      if (svcRes.rows.length) {
        serviceId   = svcRes.rows[0].service_id;
        serviceName = svcRes.rows[0].service_name;
        steps.push({
          phase: '5 — Service Code Mapping',
          result: 'MAPPED',
          detail: `Raw code "${rawCode}" → service #${serviceId} (${serviceName} / ${svcRes.rows[0].service_code})`,
        });
      } else {
        steps.push({
          phase: '5 — Service Code Mapping',
          result: 'NOT_MAPPED',
          detail: `Raw code "${rawCode}" has no entry in courier_service_code_mappings for this carrier. The engine will mark this line "unmatched" with reason "unknown_service_code" until it is mapped.`,
        });
      }
    } else {
      steps.push({ phase: '5 — Service Code Mapping', result: 'SKIPPED', detail: 'raw_service_code not provided — cannot check mapping' });
    }

    // ── Step 6: Expected cost comparison ─────────────────────────────────────
    const storedCostPrice = parseFloat(charge.cost_price || 0);
    if (carrierAmt !== null) {
      const delta = Math.round((carrierAmt - storedCostPrice) * 100) / 100;
      const matched = Math.abs(delta) <= 0.01;
      steps.push({
        phase: '6 — Cost Comparison',
        result: matched ? 'MATCH' : 'DELTA',
        detail: matched
          ? `Carrier £${carrierAmt.toFixed(2)} vs stored cost_price £${storedCostPrice.toFixed(2)} — delta £${delta.toFixed(2)} ≤ £0.01 → WOULD MATCH once pool lookup works`
          : `Carrier £${carrierAmt.toFixed(2)} vs stored cost_price £${storedCostPrice.toFixed(2)} — delta £${delta >= 0 ? '+' : ''}${delta.toFixed(2)} → outside ±£0.01 tolerance`,
      });
    } else {
      steps.push({
        phase: '6 — Cost Comparison',
        result: 'SKIPPED',
        detail: `carrier_amount not provided. Stored cost_price=£${storedCostPrice.toFixed(2)}. Pass carrier_amount=X to see the delta calculation.`,
      });
    }

    // ── Verdict ───────────────────────────────────────────────────────────────
    let verdict = 'UNKNOWN';
    if (!gatePass)                     verdict = 'BLOCKED_BY_POOL_GATE';
    else if (!charge.verified)         verdict = 'NOT_VERIFIED';
    else if (!carrierMatches)          verdict = 'CARRIER_MISMATCH';
    else if (serviceId === null && rawCode) verdict = 'SERVICE_CODE_NOT_MAPPED';
    else if (carrierAmt !== null && Math.abs(carrierAmt - storedCostPrice) <= 0.01) verdict = 'WILL_MATCH';
    else if (carrierAmt !== null)      verdict = 'COST_DELTA';
    else                               verdict = 'POOL_LOOKUP_SHOULD_WORK';

    return res.json({
      tracking,
      carrier_amount_provided: carrierAmt,
      shipment,
      charge,
      steps,
      verdict,
      verdict_note: {
        WILL_MATCH:            'Once re-uploaded with the fixed profile (consignment column), this line will be MATCHED automatically.',
        COST_DELTA:            'Pool lookup should work but carrier amount ≠ stored cost_price. The engine will attempt correction via rate card and saved mappings.',
        NOT_VERIFIED:          'Charge exists but is not verified. The shipment-verified webhook event must fire before this shipment enters the pool.',
        CARRIER_MISMATCH:      'The courier name stored in shipments doesn\'t match the carrier being reconciled. Check shipments.courier vs couriers.code/name.',
        SERVICE_CODE_NOT_MAPPED: 'Pool lookup would work but the service code from the CSV isn\'t mapped. Add a service code mapping first.',
        BLOCKED_BY_POOL_GATE:  'No tracking_codes AND no dc_service_id — the Voila webhook did not store tracking information for this shipment.',
        POOL_LOOKUP_SHOULD_WORK: 'Charge is verified and pool gate passes. Should match on next upload.',
      }[verdict] || '',
    });

  } catch (err) {
    console.error('[reconciliation/consignment-trace] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/raw-trace/:tracking ─────────────────────────────
//
// Zero-config deep trace for a single consignment number.
// Auto-detects the carrier from shipments.courier — no carrier_id needed.
// Returns raw DB data exactly as stored: charge records, pool eligibility,
// the exact maths, and Gap 2 (courier name visibility check).
//
// Usage (paste in browser):
//   /api/reconciliation/raw-trace/2313756977?amount=21.70
//
// Query params:
//   amount   (optional) — carrier invoice amount for delta calculation

router.get('/raw-trace/:tracking', async (req, res) => {
  try {
    const tracking   = (req.params.tracking || '').trim();
    const carrierAmt = req.query.amount ? parseFloat(req.query.amount) : null;

    if (!tracking) return res.status(400).json({ error: 'tracking number is required' });

    const trackKey = tracking.toUpperCase();
    const variants = [trackKey];
    if (trackKey.startsWith('600') && trackKey.length > 5) {
      variants.push(trackKey.slice(3), trackKey.slice(2));
    } else if (trackKey.startsWith('60') && trackKey.length > 4) {
      variants.push(trackKey.slice(2));
    } else {
      variants.push('60' + trackKey);
    }

    // ── Step 1: shipment lookup ───────────────────────────────────────────────
    const shipRes = await query(`
      SELECT
        s.id              AS shipment_id,
        s.courier,
        s.dc_service_id,
        s.tracking_codes,
        s.reference,
        s.total_weight_kg,
        s.parcel_count,
        s.ship_to_postcode,
        s.created_at
      FROM shipments s
      WHERE EXISTS (
        SELECT 1 FROM unnest(s.tracking_codes) tc WHERE UPPER(tc) = ANY($1)
      ) OR s.dc_service_id = ANY($1)
      ORDER BY s.created_at DESC
      LIMIT 3
    `, [variants]);

    if (shipRes.rows.length === 0) {
      return res.json({
        tracking,
        variants_searched: variants,
        verdict: 'NOT_IN_DB',
        note: 'No shipment found with this tracking number. It is not in our OMS — pool miss by definition.',
        shipment: null,
        charges: [],
        pool: null,
        maths: null,
      });
    }

    const shipment = shipRes.rows[0];

    // ── Step 2: all charge records for this shipment ──────────────────────────
    const chargeRes = await query(`
      SELECT
        c.id              AS charge_id,
        c.charge_type,
        c.cost_price,
        c.verified,
        c.cancelled,
        c.source,
        c.zone_id,
        c.courier_service_id,
        c.created_at,
        c.customer_id,
        cu.business_name  AS customer_name,
        COALESCE(c.cost_price, 0)
          + COALESCE((
              SELECT SUM(sc.cost_price)
              FROM   charges sc
              WHERE  sc.shipment_id = c.shipment_id
                AND  sc.charge_type IN ('fuel','surcharge')
                AND  sc.cancelled   = false
            ), 0)         AS total_cost_price
      FROM   charges c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE  c.shipment_id = $1
      ORDER BY c.charge_type, c.created_at DESC
    `, [shipment.shipment_id]);

    // ── Step 3: carrier match check ───────────────────────────────────────────
    const carrierRes = await query(`
      SELECT id, code, name, aliases
      FROM   couriers
      WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
         OR  LOWER($1) = LOWER(code) OR LOWER($1) = LOWER(name)
         OR  EXISTS (SELECT 1 FROM unnest(aliases) a WHERE LOWER(a) = LOWER($1))
      ORDER BY id
      LIMIT 5
    `, [shipment.courier || '']);

    const courierLower = (shipment.courier || '').toLowerCase();
    let matchedCarrier = null;
    let matchedVia     = null;
    for (const c of carrierRes.rows) {
      if ((c.code || '').toLowerCase() === courierLower)   { matchedCarrier = c; matchedVia = 'code';  break; }
      if ((c.name || '').toLowerCase() === courierLower)   { matchedCarrier = c; matchedVia = 'name';  break; }
      if ((c.aliases || []).some(a => a.toLowerCase() === courierLower)) { matchedCarrier = c; matchedVia = 'alias'; break; }
    }

    const courierCharge = chargeRes.rows.find(r => r.charge_type === 'courier' && !r.cancelled);
    const hasTrackingGate = (shipment.tracking_codes && shipment.tracking_codes.length > 0)
      || !!shipment.dc_service_id;

    let poolResult;
    if (!courierCharge)        poolResult = 'NO_COURIER_CHARGE';
    else if (!courierCharge.verified) poolResult = 'NOT_VERIFIED';
    else if (!matchedCarrier)  poolResult = 'CARRIER_MISMATCH';
    else if (!hasTrackingGate) poolResult = 'NO_TRACKING_GATE';
    else                       poolResult = 'IN_POOL';

    // ── Step 4: the maths ─────────────────────────────────────────────────────
    let maths = null;
    if (courierCharge) {
      const expectedBase   = Math.round(parseFloat(courierCharge.cost_price        || 0) * 100) / 100;
      const totalCostPrice = Math.round(parseFloat(courierCharge.total_cost_price  || 0) * 100) / 100;
      maths = {
        cost_price_base:   expectedBase,
        total_cost_price:  totalCostPrice,
        note_separate_fuel_rows: 'DPD uses separate_fuel_rows=true — engine compares carrier_amount vs cost_price (base only). Fuel/carriage rows are auto-accepted separately.',
        carrier_amount_provided: carrierAmt,
      };
      if (carrierAmt !== null) {
        const deltaVsBase  = Math.round((carrierAmt - expectedBase)   * 100) / 100;
        const deltaVsTotal = Math.round((carrierAmt - totalCostPrice) * 100) / 100;
        maths.delta_vs_cost_price_base  = deltaVsBase;
        maths.delta_vs_total_cost_price = deltaVsTotal;
        maths.required_col_surcharge_total = deltaVsBase;
        maths.interpretation = deltaVsBase > 0
          ? `Carrier charged £${deltaVsBase.toFixed(2)} more than stored base cost. For this to match, surcharge_amounts must sum to £${deltaVsBase.toFixed(2)}.`
          : deltaVsBase < 0
          ? `Carrier charged £${Math.abs(deltaVsBase).toFixed(2)} LESS than stored base cost. Possible overpayment or wrong cost_price.`
          : 'Carrier amount = stored base cost. Should be matched (if in pool).';
      }
    }

    // ── Profile: what surcharge_columns are stored in the DPD profile ────────
    const profileRes = await query(`
      SELECT p.column_map
      FROM   carrier_csv_profiles p
      JOIN   couriers cu ON cu.id = p.carrier_id
      WHERE  (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD%')
        AND  p.profile_name = 'DPD Standard Invoice'
      LIMIT 1
    `);

    let profileSurchargeColumns = null;
    let profileExcludedColumns  = null;

    if (profileRes.rows.length > 0) {
      const cm = profileRes.rows[0].column_map;
      profileSurchargeColumns = cm.surcharge_columns || [];
      profileExcludedColumns  = cm.excluded_columns  || [];
    }

    // Simulate what findRowKey() does for each surcharge column.
    // We don't have the actual CSV row here, but we can show what col values
    // are stored and what the fuzzy suffix-strip produces — so the operator
    // can see immediately if the stored col name can never match a CSV header.
    const stripSuffix = s => s.replace(/\s+(charge|charges|fee|fees|surcharge|surcharges)$/i, '').trim();
    const surchargeColAnalysis = Array.isArray(profileSurchargeColumns)
      ? profileSurchargeColumns.map(entry => ({
          stored_col:         entry.col,
          surcharge_id:       entry.surcharge_id,
          normalized:         (entry.col || '').toLowerCase().trim(),
          suffix_stripped:    stripSuffix((entry.col || '').toLowerCase().trim()),
          note: !entry.col
            ? 'EMPTY — col is blank, will never extract anything'
            : !entry.surcharge_id
            ? 'NO_SURCHARGE_ID — surcharge_id is missing, amount extracted but ignored'
            : 'OK — will match exact col name or any CSV header that suffix-strips to the same value',
        }))
      : [];

    // ── Latest reconciliation line for this tracking number ──────────────────
    // Shows exactly what the engine stored: expected_amount, delta, status,
    // and correction_metadata (which contains col_surcharge_total if > 0,
    // and raw_col_values showing unmapped monetary columns).
    const lineRes = await query(`
      SELECT
        rl.id,
        rl.status,
        rl.carrier_amount,
        rl.expected_amount,
        rl.delta,
        rl.unmatched_reason,
        rl.corrected_by,
        rl.correction_metadata,
        rl.raw_service_code,
        rl.charge_type,
        rl.created_at,
        rr.id         AS run_id,
        rr.created_at AS run_created_at,
        rr.invoice_ref
      FROM   reconciliation_lines rl
      JOIN   reconciliation_runs  rr ON rr.id = rl.run_id
      WHERE  rl.tracking_number = $1
      ORDER  BY rl.created_at DESC
      LIMIT  5
    `, [tracking]);

    // ── Gap 2: courier name visibility ────────────────────────────────────────
    const gapRes = await query(`
      WITH carrier_strings AS (
        SELECT code AS match_str FROM couriers
        UNION ALL SELECT name FROM couriers
        UNION ALL SELECT unnest(aliases) FROM couriers WHERE array_length(aliases,1)>0
      ),
      scc AS (
        SELECT s.courier AS courier_str, COUNT(DISTINCT c.id) AS n
        FROM charges c JOIN shipments s ON s.id=c.shipment_id
        WHERE c.charge_type='courier' AND c.cancelled=false AND c.verified=true
          AND s.courier IS NOT NULL AND s.courier!=''
        GROUP BY s.courier
      )
      SELECT scc.courier_str, scc.n,
             EXISTS(SELECT 1 FROM carrier_strings cs WHERE LOWER(cs.match_str)=LOWER(scc.courier_str)) AS matches
      FROM scc ORDER BY matches ASC, scc.n DESC
    `);
    const gap2Unmatched = gapRes.rows.filter(r => !r.matches);

    return res.json({
      tracking,
      variants_searched: variants,
      shipment: {
        shipment_id:    shipment.shipment_id,
        courier:        shipment.courier,
        tracking_codes: shipment.tracking_codes,
        dc_service_id:  shipment.dc_service_id,
        reference:      shipment.reference,
        weight_kg:      shipment.total_weight_kg,
        parcel_count:   shipment.parcel_count,
        postcode:       shipment.ship_to_postcode,
        created_at:     shipment.created_at,
      },
      charges: chargeRes.rows.map(c => ({
        charge_id:         c.charge_id,
        charge_type:       c.charge_type,
        cost_price:        c.cost_price,
        total_cost_price:  c.total_cost_price,
        zone_id:           c.zone_id,
        verified:          c.verified,
        cancelled:         c.cancelled,
        source:            c.source,
        customer:          c.customer_name,
        customer_id:       c.customer_id,
        created_at:        c.created_at,
      })),
      pool: {
        result:           poolResult,
        matched_carrier:  matchedCarrier ? { id: matchedCarrier.id, code: matchedCarrier.code, name: matchedCarrier.name } : null,
        matched_via:      matchedVia,
        carriers_checked: carrierRes.rows.map(c => ({ id: c.id, code: c.code, name: c.name, aliases: c.aliases })),
        note: {
          IN_POOL:           'Charge is verified and carrier matches — this consignment WILL be found in the pool on next upload.',
          NOT_VERIFIED:      'Courier charge exists but verified=false. Pool only includes verified=true charges.',
          CARRIER_MISMATCH:  `shipments.courier="${shipment.courier}" does not match any carrier code/name/alias. This charge is invisible to the pool.`,
          NO_COURIER_CHARGE: 'No active courier charge exists for this shipment.',
          NO_TRACKING_GATE:  'Charge is verified but tracking_codes is empty and dc_service_id is null — cannot index into pool by tracking number.',
        }[poolResult] || '',
      },
      maths,
      latest_recon_lines: lineRes.rows.map(l => ({
        run_id:              l.run_id,
        run_created_at:      l.run_created_at,
        invoice_ref:         l.invoice_ref,
        line_id:             l.id,
        status:              l.status,
        carrier_amount:      l.carrier_amount,
        expected_amount:     l.expected_amount,
        delta:               l.delta,
        unmatched_reason:    l.unmatched_reason,
        corrected_by:        l.corrected_by,
        raw_service_code:    l.raw_service_code,
        charge_type:         l.charge_type,
        correction_metadata: l.correction_metadata,
        col_surcharge_total_in_metadata: l.correction_metadata?.col_surcharge_total ?? null,
        raw_col_values_in_metadata:      l.correction_metadata?.raw_col_values ?? null,
        created_at:          l.created_at,
      })),
      profile_surcharge_columns: surchargeColAnalysis,
      profile_excluded_columns:  profileExcludedColumns,
      profile_note: surchargeColAnalysis.length === 0
        ? 'NO SURCHARGE COLUMNS CONFIGURED — profile.surcharge_columns is empty. No column amounts will ever be extracted. This is why colSurchargeTotal = 0.'
        : `${surchargeColAnalysis.length} surcharge column(s) configured. Check stored_col vs your CSV headers — they must match exactly or the suffix-stripped form must match.`,
      gap2_unmatched_couriers: gap2Unmatched.map(r => ({ courier: r.courier_str, active_verified_charges: r.n })),
      gap2_note: gap2Unmatched.length === 0
        ? 'All courier strings match a carrier — no pool visibility gaps.'
        : `${gap2Unmatched.length} courier string(s) are invisible to all carrier pools — ${gap2Unmatched.reduce((s,r)=>s+parseInt(r.n),0)} affected charges.`,
    });

  } catch (err) {
    console.error('[reconciliation/raw-trace] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// COURIER QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/reconciliation/queries ────────────────────────────────────────
// Raise a new courier query from a reconciliation line.
router.post('/queries', async (req, res) => {
  try {
    const {
      run_id, reconciliation_line_id, carrier_id, invoice_ref, tracking_number,
      query_type, carrier_charged, expected_charged, details, charge_ids = [],
    } = req.body;

    if (!carrier_id || !query_type) {
      return res.status(400).json({ error: 'carrier_id and query_type are required' });
    }

    const result = await query(`
      INSERT INTO courier_queries
        (run_id, reconciliation_line_id, carrier_id, invoice_ref, tracking_number,
         query_type, carrier_charged, expected_charged, details, status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open',NOW(),NOW())
      RETURNING *
    `, [
      run_id || null, reconciliation_line_id || null, carrier_id,
      invoice_ref || null, tracking_number || null,
      query_type, carrier_charged || null, expected_charged || null,
      details || null,
    ]);
    const cq = result.rows[0];

    // Link associated OMS charges
    if (charge_ids.length > 0) {
      for (const cid of charge_ids) {
        await query(
          `INSERT INTO courier_query_charges (query_id, charge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [cq.id, cid]
        );
      }
    }

    return res.status(201).json(cq);
  } catch (err) {
    console.error('[courier-queries/create] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/queries ─────────────────────────────────────────
// List courier queries. Optional filters: carrier_id, run_id, status.
router.get('/queries', async (req, res) => {
  try {
    const { carrier_id, run_id, status, limit = 100, offset = 0 } = req.query;
    const params = [];
    const conditions = [];

    if (carrier_id) { params.push(parseInt(carrier_id)); conditions.push(`cq.carrier_id = $${params.length}`); }
    if (run_id)     { params.push(parseInt(run_id));     conditions.push(`cq.run_id = $${params.length}`); }
    if (status)     { params.push(status);               conditions.push(`cq.status = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT
        cq.*,
        cu.name        AS carrier_name,
        cu.code        AS carrier_code,
        rr.invoice_ref AS run_invoice_ref
      FROM   courier_queries cq
      LEFT JOIN couriers              cu ON cu.id = cq.carrier_id
      LEFT JOIN reconciliation_runs   rr ON rr.id = cq.run_id
      ${where}
      ORDER  BY cq.created_at DESC
      LIMIT  $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, -2);
    const countRes = await query(
      `SELECT COUNT(*) FROM courier_queries cq ${where}`,
      countParams
    );

    return res.json({ queries: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    console.error('[courier-queries/list] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/reconciliation/queries/:id ───────────────────────────────────
// Update query status, carrier reference, or credit amount.
router.patch('/queries/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, carrier_reference, credit_amount, resolution_notes, details } = req.body;

    const fields = [];
    const vals   = [];

    if (status !== undefined) {
      fields.push(`status = $${vals.length + 1}`);
      vals.push(status);
      if (status === 'raised') {
        fields.push(`raised_at = NOW()`);
      }
      if (['credited','rejected','written_off'].includes(status)) {
        fields.push(`resolved_at = NOW()`);
      }
    }
    if (carrier_reference !== undefined) { fields.push(`carrier_reference = $${vals.length + 1}`); vals.push(carrier_reference); }
    if (credit_amount     !== undefined) { fields.push(`credit_amount = $${vals.length + 1}`);     vals.push(credit_amount); }
    if (resolution_notes  !== undefined) { fields.push(`resolution_notes = $${vals.length + 1}`);  vals.push(resolution_notes); }
    if (details           !== undefined) { fields.push(`details = $${vals.length + 1}`);           vals.push(details); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at = NOW()`);
    vals.push(id);

    const result = await query(
      `UPDATE courier_queries SET ${fields.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Query not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[courier-queries/update] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/queries/summary ─────────────────────────────────
// Summary stats for the queries dashboard — total open, total disputed, total credited.
router.get('/queries/summary', async (req, res) => {
  try {
    const { carrier_id } = req.query;
    const params = carrier_id ? [parseInt(carrier_id)] : [];
    const where  = carrier_id ? 'WHERE carrier_id = $1' : '';

    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open')                    AS open_count,
        COUNT(*) FILTER (WHERE status = 'raised')                  AS raised_count,
        COUNT(*) FILTER (WHERE status = 'acknowledged')            AS acknowledged_count,
        COUNT(*) FILTER (WHERE status NOT IN ('credited','rejected','written_off')) AS active_count,
        COUNT(*) FILTER (WHERE status = 'credited')                AS credited_count,
        COALESCE(SUM(disputed_amount) FILTER (
          WHERE status NOT IN ('credited','rejected','written_off')
        ), 0)                                                       AS total_disputed,
        COALESCE(SUM(credit_amount)   FILTER (WHERE status = 'credited'), 0) AS total_credited
      FROM courier_queries ${where}
    `, params);

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[courier-queries/summary] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reconciliation/backfill-shipment ───────────────────────────────
// Manual recovery for shipments whose shipment-created webhook was never fired.
//
// Preferred: Body: { reference: '472393', tracking_number: '2313467491' }
//   Searches DC by sender reference, picks the shipment whose create_label_parcels
//   contains the specific tracking code. Handles consolidated shipments where two
//   bookings share the same sender reference.
//
// Fallback: Body: { voila_shipment_id: 249492859 }
//   Direct ID lookup — only works if DC API supports ?id= parameter.
//
// Returns: { created: number, charge_ids: [], warnings: [], shipment_ref: string }
router.post('/backfill-shipment', async (req, res) => {
  try {
    const { reference, tracking_number, voila_shipment_id } = req.body || {};

    if (!reference && !tracking_number && !voila_shipment_id) {
      return res.status(400).json({ error: 'Provide either reference + tracking_number, or voila_shipment_id' });
    }

    // ── Dedup guard ───────────────────────────────────────────────────────────
    // Check if charges already exist for this tracking code to avoid duplicates.
    if (tracking_number) {
      const existing = await query(`
        SELECT c.id FROM charges c
        JOIN   shipments s ON s.id = c.shipment_id
        WHERE  c.cancelled   = false
          AND  c.charge_type = 'courier'
          AND  $1 = ANY(s.tracking_codes)
        LIMIT 1
      `, [String(tracking_number)]);
      if (existing.rows.length) {
        return res.status(409).json({
          error: 'Charges already exist for this tracking number — backfill not needed',
          existing_charge_ids: existing.rows.map(r => r.id),
        });
      }
    }

    // ── Fetch from Voila API ──────────────────────────────────────────────────
    let payload = null;

    if (reference && tracking_number) {
      // Primary path: search by sender reference, pick the right shipment by
      // matching tracking code — handles shared-reference consolidations
      payload = await fetchShipmentByReferenceAndTracking(
        String(reference).trim(),
        String(tracking_number).trim()
      );
    } else if (reference) {
      payload = await fetchShipmentByReference(String(reference).trim());
    } else if (voila_shipment_id) {
      payload = await fetchShipmentById(String(voila_shipment_id).trim());
    }

    if (!payload) {
      return res.status(404).json({
        error: 'Voila API returned no matching shipment. Check the sender reference is correct.',
        tried: { reference, tracking_number, voila_shipment_id },
      });
    }

    // ── Price and insert ──────────────────────────────────────────────────────
    const { charges, errors } = await processShipment(payload);
    if (!charges.length) {
      return res.status(422).json({
        error: 'Pricing engine produced no charges for this shipment',
        warnings: errors,
        shipment_ref: payload.shipment?.reference || null,
      });
    }

    const inserted = await insertCharges(charges);
    const insertedIds = inserted.map(c => c.id);

    if (insertedIds.length) {
      await query(
        `UPDATE charges SET verified = true, status = 'verified', updated_at = NOW() WHERE id = ANY($1)`,
        [insertedIds]
      );
    }

    console.log(`✅  Manual backfill: created + verified ${inserted.length} charge(s) for ref=${reference} tracking=${tracking_number}`);

    return res.json({
      created:      inserted.length,
      charge_ids:   insertedIds,
      warnings:     errors,
      shipment_ref: payload.shipment?.reference || null,
    });
  } catch (err) {
    console.error('[backfill-shipment] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/origin-analysis ─────────────────────────────────
// Extracts ship_from postcodes from raw_payload across all shipments.
// Groups by customer account and postcode, returns volumes and postcode districts.
// Used for rate negotiation / courier tender preparation.
router.get('/origin-analysis', async (req, res) => {
  try {
    // Extract ship_from.postcode from raw_payload JSON for shipments that have it.
    // Also try request_shipment JSON string (stored on the billing.js / webhooks path).
    // Group by customer account name and postcode district (first part of postcode).
    const result = await query(`
      WITH extracted AS (
        SELECT
          -- Customer name from charges or shipment customer_account
          COALESCE(
            (SELECT cu.business_name FROM customers cu WHERE cu.id = s.customer_id LIMIT 1),
            s.customer_account,
            'Unknown'
          ) AS customer_name,

          -- Full postcode from raw_payload.shipment.ship_from... or request_shipment
          TRIM(UPPER(COALESCE(
            -- webhooks.js path: raw_payload->shipment->... doesn't store ship_from postcode
            -- billing.js path: raw_payload->'request_shipment' is a JSON string
            (
              SELECT rsp->>'postcode'
              FROM   jsonb_path_query(
                       CASE
                         WHEN jsonb_typeof(s.raw_payload->'request_shipment') = 'string'
                         THEN (s.raw_payload->>'request_shipment')::jsonb
                         ELSE s.raw_payload->'request_shipment'
                       END,
                       '$.ship_from'
                     ) AS rsp
              LIMIT 1
            )
          ))) AS origin_postcode,

          s.collection_date,
          COALESCE(s.parcel_count, 1) AS parcel_count
        FROM shipments s
        WHERE s.raw_payload IS NOT NULL
          AND s.cancelled = false
      )
      SELECT
        customer_name,
        origin_postcode,
        -- Postcode district = everything up to the space (e.g. LU2 from LU2 9NH)
        REGEXP_REPLACE(origin_postcode, '\\s.*$', '') AS postcode_district,
        COUNT(*)::int                                  AS shipment_count,
        SUM(parcel_count)::int                         AS parcel_count,
        MIN(collection_date)                           AS first_seen,
        MAX(collection_date)                           AS last_seen
      FROM extracted
      WHERE origin_postcode IS NOT NULL
        AND origin_postcode != ''
        AND LENGTH(origin_postcode) >= 5
      GROUP BY customer_name, origin_postcode
      ORDER BY shipment_count DESC
    `);

    // Also compute totals per postcode district across all customers
    const byDistrict = {};
    for (const row of result.rows) {
      const d = row.postcode_district;
      if (!byDistrict[d]) byDistrict[d] = { postcode_district: d, shipment_count: 0, parcel_count: 0, customers: [] };
      byDistrict[d].shipment_count += row.shipment_count;
      byDistrict[d].parcel_count   += row.parcel_count;
      if (!byDistrict[d].customers.includes(row.customer_name)) {
        byDistrict[d].customers.push(row.customer_name);
      }
    }

    return res.json({
      by_customer_postcode: result.rows,
      by_district: Object.values(byDistrict).sort((a, b) => b.shipment_count - a.shipment_count),
      total_shipments: result.rows.reduce((s, r) => s + r.shipment_count, 0),
      total_parcels:   result.rows.reduce((s, r) => s + r.parcel_count, 0),
    });
  } catch (err) {
    console.error('[origin-analysis] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/probe-shipment ───────────────────────────────────
// Diagnostic: fetches raw Voila API data for a shipment ID without creating anything.
// Lets operators verify a shipment exists in DC before triggering backfill.
router.get('/probe-shipment', async (req, res) => {
  try {
    const { voila_shipment_id } = req.query;
    if (!voila_shipment_id) return res.status(400).json({ error: 'voila_shipment_id is required' });
    const raw = await probeShipmentRaw(voila_shipment_id);
    return res.json(raw);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reconciliation/ping ─────────────────────────────────────────────
router.get('/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ─── GET /api/reconciliation/customer-volume ──────────────────────────────────
// One-off export: shipment volumes per customer, using the customer's registered
// postcode as the origin. Covers ALL billing charges (all carriers).
// Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD to filter by shipment collection_date.
router.get('/customer-volume', async (req, res) => {
  try {
    const { from, to } = req.query;
    const conditions = [
      `c.cancelled = false`,
      `c.charge_type = 'courier'`,
      `cu.postcode IS NOT NULL`,
      `cu.postcode NOT IN ('TBC', '', 'N/A', 'tbc', 'n/a')`,
      `LENGTH(TRIM(cu.postcode)) >= 5`,
    ];
    const params = [];
    if (from) { params.push(from); conditions.push(`s.collection_date >= $${params.length}`); }
    if (to)   { params.push(to);   conditions.push(`s.collection_date <= $${params.length}`); }

    const result = await query(`
      SELECT
        cu.account_number,
        cu.business_name,
        TRIM(UPPER(cu.postcode))                                           AS postcode,
        -- UK postcode district = everything except the last 3 chars (inward code).
        -- Works whether or not the postcode has a space (e.g. "M12 6JR" or "M126JR").
        TRIM(SUBSTRING(TRIM(UPPER(cu.postcode)), 1, LENGTH(TRIM(UPPER(cu.postcode))) - 3)) AS postcode_district,
        COUNT(DISTINCT s.id)::int                                          AS shipment_count,
        SUM(COALESCE(s.parcel_count, 1))::int                              AS parcel_count,
        MIN(s.collection_date)                                             AS first_seen,
        MAX(s.collection_date)                                             AS last_seen
      FROM customers cu
      JOIN charges   c ON c.customer_id = cu.id
      JOIN shipments s ON s.id          = c.shipment_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY cu.id, cu.account_number, cu.business_name, cu.postcode
      ORDER BY shipment_count DESC
    `, params);

    // Aggregate by postcode district
    const byDistrict = {};
    for (const row of result.rows) {
      const d = row.postcode_district;
      if (!byDistrict[d]) byDistrict[d] = { postcode_district: d, shipment_count: 0, parcel_count: 0, postcodes: new Set() };
      byDistrict[d].shipment_count += row.shipment_count;
      byDistrict[d].parcel_count   += row.parcel_count;
      byDistrict[d].postcodes.add(row.postcode);
    }
    const districtList = Object.values(byDistrict)
      .map(d => ({ ...d, postcodes: [...d.postcodes] }))
      .sort((a, b) => b.shipment_count - a.shipment_count);

    return res.json({
      by_customer:     result.rows,
      by_district:     districtList,
      total_shipments: result.rows.reduce((s, r) => s + r.shipment_count, 0),
      total_parcels:   result.rows.reduce((s, r) => s + r.parcel_count,   0),
    });
  } catch (err) {
    console.error('[customer-volume] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
