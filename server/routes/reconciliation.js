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
        c.id                AS charge_id,
        c.order_id          AS reference,
        c.cost_price,
        c.price             AS sell_price,
        c.service_name,
        c.courier,
        c.collection_date,
        c.awaiting_reconciliation,
        c.verified,
        c.billed,
        c.cancelled,
        cu.id               AS customer_id,
        cu.business_name    AS customer_name,
        cu.account_number   AS customer_account
      FROM charges c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE c.order_id   = ANY($1)
        AND c.charge_type = 'courier'
        AND c.cancelled   = false
      ORDER BY c.order_id
    `, [refs]);

    // Build lookup map (reference → charge row)
    const chargeByRef = {};
    for (const row of result.rows) {
      chargeByRef[row.reference] = row;
    }

    // Partition into matched / unmatched
    const matched   = [];
    const unmatched = [];

    for (const ref of refs) {
      if (chargeByRef[ref]) {
        matched.push(chargeByRef[ref]);
      } else {
        unmatched.push(ref);
      }
    }

    return res.json({
      ok: true,
      matched,
      unmatched,
      total:          refs.length,
      matched_count:  matched.length,
      unmatched_count: unmatched.length,
    });
  } catch (err) {
    console.error('[reconciliation] bulk-lookup error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
