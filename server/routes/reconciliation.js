/**
 * Moov OS — Reconciliation API
 *
 * POST /api/reconciliation/bulk-lookup
 *   Body: { courier: string, references: string[] }
 *   Looks up charges by order_id and returns cost/sell prices for comparison
 *   against a carrier invoice CSV.
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
        cu.id                   AS customer_id,
        cu.business_name        AS customer_name,
        cu.account_number       AS customer_account,
        -- Total cost across ALL charge types for this shipment (base + fuel + surcharges)
        COALESCE(c.cost_price, 0) + COALESCE((
          SELECT SUM(sc.cost_price)
          FROM charges sc
          WHERE sc.shipment_id = c.shipment_id
            AND sc.charge_type IN ('fuel', 'surcharge')
            AND sc.cancelled = false
        ), 0)                   AS total_cost_price,
        -- Total sell across ALL charge types for this shipment
        COALESCE(c.price, 0) + COALESCE((
          SELECT SUM(sc.price)
          FROM charges sc
          WHERE sc.shipment_id = c.shipment_id
            AND sc.charge_type IN ('fuel', 'surcharge')
            AND sc.cancelled = false
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
        total_cost_price:        row.total_cost_price  != null ? parseFloat(row.total_cost_price)  : null,
        total_sell_price:        row.total_sell_price  != null ? parseFloat(row.total_sell_price)  : null,
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

export default router;
