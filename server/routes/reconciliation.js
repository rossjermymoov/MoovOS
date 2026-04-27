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

const router = express.Router();

// ─── POST /bulk-lookup ────────────────────────────────────────────────────────

router.post('/bulk-lookup', async (req, res) => {
  try {
    const { courier, references } = req.body;

    if (!Array.isArray(references) || references.length === 0) {
      return res.status(400).json({ error: 'references must be a non-empty array' });
    }
    if (references.length > 2000) {
      return res.status(400).json({ error: 'Too many references — max 2000 per request' });
    }

    // Normalise references — trim whitespace
    const refs = references.map(r => String(r).trim()).filter(Boolean);

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
        s.parcel_count,
        s.total_weight_kg       AS declared_weight_kg,
        -- Does this customer/service use weight bands at all?
        -- False = flat-rate (any weight → same price, never flag weight diff).
        -- Match: service_code ILIKE dc_service_id  (primary, mirrors billing engine)
        --        OR service_name ILIKE c.service_name (fallback for null dc_service_id).
        -- ILIKE + explicit NULL guards avoid the LOWER(NULL)=NULL silent-false trap.
        (
          SELECT EXISTS(
            SELECT 1 FROM customer_rates cr
            WHERE cr.customer_id = c.customer_id
              AND cr.max_weight_kg IS NOT NULL
              AND (
                (s.dc_service_id IS NOT NULL
                  AND TRIM(cr.service_code) ILIKE TRIM(s.dc_service_id))
                OR
                (c.service_name IS NOT NULL AND cr.service_name IS NOT NULL
                  AND TRIM(cr.service_name) ILIKE TRIM(c.service_name))
              )
          )
        )                       AS has_weight_bands,
        -- The ceiling of this customer's highest weight band for the service.
        -- If DHL invoices above this value the shipment was billed outside its booked band.
        -- We take MAX so a 45 kg declared weight on a 0-30 kg rate card returns 30,
        -- making billed(45) > ceiling(30) correctly flag.
        (
          SELECT MAX(cr.max_weight_kg)
          FROM customer_rates cr
          WHERE cr.customer_id = c.customer_id
            AND cr.max_weight_kg IS NOT NULL
            AND (
              (s.dc_service_id IS NOT NULL
                AND TRIM(cr.service_code) ILIKE TRIM(s.dc_service_id))
              OR
              (c.service_name IS NOT NULL AND cr.service_name IS NOT NULL
                AND TRIM(cr.service_name) ILIKE TRIM(c.service_name))
            )
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
        -- Total sell = base sell + all non-courier sell prices (including EPS).
        COALESCE(c.price, 0)
        + COALESCE((
            SELECT SUM(sc.price)
            FROM   charges sc
            WHERE  sc.shipment_id = c.shipment_id
              AND  sc.charge_type IN ('fuel', 'surcharge')
              AND  sc.cancelled   = false
          ), 0)                 AS total_sell_price
      FROM charges c
      LEFT JOIN shipments s  ON s.id  = c.shipment_id
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE c.order_id   = ANY($1)
        AND c.charge_type = 'courier'
        AND c.cancelled   = false
      ORDER BY c.order_id, c.created_at
    `, [refs]);

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
          charges:          [],
        };
      }
      groupByRef[row.reference].charges.push({
        charge_id:               row.charge_id,
        base_cost_price:         row.base_cost_price   != null ? parseFloat(row.base_cost_price)   : null,
        base_sell_price:         row.base_sell_price   != null ? parseFloat(row.base_sell_price)   : null,
        fuel_cost_price:         row.fuel_cost_price    != null ? parseFloat(row.fuel_cost_price)   : 0,
        hgv_cost_price:          row.hgv_cost_price     != null ? parseFloat(row.hgv_cost_price)    : 0,
        total_cost_price:        row.total_cost_price   != null ? parseFloat(row.total_cost_price)  : null,
        total_sell_price:        row.total_sell_price   != null ? parseFloat(row.total_sell_price)  : null,
        parcel_count:            row.parcel_count        != null ? parseInt(row.parcel_count, 10)    : 1,
        declared_weight_kg:      row.declared_weight_kg  != null ? parseFloat(row.declared_weight_kg)  : null,
        has_weight_bands:        row.has_weight_bands    === true || row.has_weight_bands === 't',
        band_max_weight_kg:      row.band_max_weight_kg  != null ? parseFloat(row.band_max_weight_kg)  : null,
        service_name:            row.service_name,
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

    return res.json({
      ok: true,
      matched,
      unmatched,
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
      SELECT service_code, service_name, min_weight_kg, max_weight_kg
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

export default router;
