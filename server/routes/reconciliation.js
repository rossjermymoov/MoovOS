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
        -- Weight band boundaries used when this charge was priced.
        -- Joined via s.dc_service_id (service code string) → customer_rates.service_code,
        -- which is more reliable than matching by service_name text.
        -- Used in reconciliation to flag weight discrepancies only when the carrier's
        -- billed weight falls OUTSIDE the band (i.e. a different rate would apply).
        (
          SELECT cr.min_weight_kg
          FROM customer_rates cr
          WHERE cr.customer_id = c.customer_id
            AND LOWER(cr.service_code) = LOWER(s.dc_service_id)
            AND s.total_weight_kg > COALESCE(cr.min_weight_kg, 0)
            AND s.total_weight_kg <= cr.max_weight_kg
            AND cr.min_weight_kg IS NOT NULL
          LIMIT 1
        )                       AS band_min_weight_kg,
        (
          SELECT cr.max_weight_kg
          FROM customer_rates cr
          WHERE cr.customer_id = c.customer_id
            AND LOWER(cr.service_code) = LOWER(s.dc_service_id)
            AND s.total_weight_kg > COALESCE(cr.min_weight_kg, 0)
            AND s.total_weight_kg <= cr.max_weight_kg
            AND cr.min_weight_kg IS NOT NULL
          LIMIT 1
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
        -- Total cost across ALL charge types for this shipment (base + fuel + surcharges)
        -- Surcharges marked reconciliation_excluded=true are omitted — these are charges
        -- we apply to the customer but do not expect the carrier to bill us for.
        COALESCE(c.cost_price, 0) + COALESCE((
          SELECT SUM(sc.cost_price)
          FROM charges sc
          LEFT JOIN surcharges sx ON sx.id = sc.surcharge_id
          WHERE sc.shipment_id = c.shipment_id
            AND sc.charge_type IN ('fuel', 'surcharge')
            AND sc.cancelled = false
            AND (sx.id IS NULL OR sx.reconciliation_excluded = false)
        ), 0)                   AS total_cost_price,
        -- Total sell across ALL charge types for this shipment
        COALESCE(c.price, 0) + COALESCE((
          SELECT SUM(sc.price)
          FROM charges sc
          LEFT JOIN surcharges sx ON sx.id = sc.surcharge_id
          WHERE sc.shipment_id = c.shipment_id
            AND sc.charge_type IN ('fuel', 'surcharge')
            AND sc.cancelled = false
            AND (sx.id IS NULL OR sx.reconciliation_excluded = false)
        ), 0)                   AS total_sell_price
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
        total_cost_price:        row.total_cost_price   != null ? parseFloat(row.total_cost_price)  : null,
        total_sell_price:        row.total_sell_price   != null ? parseFloat(row.total_sell_price)  : null,
        parcel_count:            row.parcel_count        != null ? parseInt(row.parcel_count, 10)    : 1,
        declared_weight_kg:      row.declared_weight_kg  != null ? parseFloat(row.declared_weight_kg)  : null,
        band_min_weight_kg:      row.band_min_weight_kg  != null ? parseFloat(row.band_min_weight_kg)  : null,
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
