/**
 * Moov OS — Webhook Endpoints
 * Receives shipment-created and shipment-cancelled events from Voila
 */

import express from 'express';
import { query } from '../db/index.js';
import { processShipment, insertCharges } from '../services/pricingEngine.js';

const router = express.Router();

const WEBHOOK_TOKEN = 'M00VH00K5';

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/webhooks/shipment-created
// ─────────────────────────────────────────────────────────────────────────────

router.post('/shipment-created', authMiddleware, async (req, res, next) => {
  try {
    const payload = req.body;

    if (!payload?.shipment) {
      return res.status(400).json({ error: 'Invalid payload: missing shipment object' });
    }

    const { charges, errors } = await processShipment(payload);

    if (!charges.length) {
      console.warn('⚠️  Webhook: no charges produced', errors);
      return res.status(422).json({ status: 'no_charges', errors });
    }

    const inserted = await insertCharges(charges);

    console.log(`✅  Shipment ${payload.shipment?.id}: ${inserted.length} charge(s) created`);
    if (errors.length) console.warn('   Warnings:', errors);

    res.json({ status: 'ok', charges_created: inserted.length, warnings: errors });

  } catch (err) {
    console.error('❌  Webhook error:', err.message);
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/webhooks/shipment-cancelled
// ─────────────────────────────────────────────────────────────────────────────

router.post('/shipment-cancelled', authMiddleware, async (req, res, next) => {
  try {
    const { shipment } = req.body;

    if (!shipment) {
      return res.status(400).json({ error: 'Invalid payload: missing shipment object' });
    }

    const shipmentId = shipment.id;
    const orderId    = shipment.reference;

    if (!shipmentId && !orderId) {
      return res.status(400).json({ error: 'Cannot identify shipment: no id or reference' });
    }

    // Find charges linked to this shipment
    let whereClause, whereValues;
    if (shipmentId) {
      whereClause = 'voila_shipment_id = $1';
      whereValues = [shipmentId];
    } else {
      whereClause = 'order_id = $1';
      whereValues = [orderId];
    }

    // Remove charges that aren't already invoiced
    const result = await query(
      `DELETE FROM charges WHERE ${whereClause} AND status != 'invoiced' RETURNING id, invoice_id`,
      whereValues
    );

    // If any were on a draft invoice, recalculate the invoice total
    const affectedInvoices = [...new Set(result.rows.map(r => r.invoice_id).filter(Boolean))];
    for (const invoiceId of affectedInvoices) {
      await query(
        `UPDATE invoices SET
           subtotal   = COALESCE((SELECT SUM(total) FROM invoice_line_items WHERE invoice_id = $1), 0),
           total      = COALESCE((SELECT SUM(total) FROM invoice_line_items WHERE invoice_id = $1), 0),
           updated_at = NOW()
         WHERE id = $1 AND status = 'draft'`,
        [invoiceId]
      );
    }

    console.log(`✅  Cancellation: ${result.rows.length} charge(s) removed for shipment ${shipmentId || orderId}`);
    res.json({ status: 'ok', charges_removed: result.rows.length });

  } catch (err) {
    console.error('❌  Cancellation webhook error:', err.message);
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/webhooks/shipment-verified  (carrier scan)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/shipment-verified', authMiddleware, async (req, res, next) => {
  try {
    const { shipment_id, order_id } = req.body;

    if (!shipment_id && !order_id) {
      return res.status(400).json({ error: 'shipment_id or order_id is required' });
    }

    const whereClause = shipment_id ? 'voila_shipment_id = $1' : 'order_id = $1';
    const whereValue  = shipment_id || order_id;

    const result = await query(
      `UPDATE charges SET status = 'verified', updated_at = NOW()
       WHERE ${whereClause} AND status = 'unverified'
       RETURNING id`,
      [whereValue]
    );

    res.json({ status: 'ok', charges_verified: result.rows.length });

  } catch (err) { next(err); }
});

export default router;
