/**
 * Moov OS — Webhook Endpoints
 * Receives shipment-created, shipment-cancelled, and shipment-verified events from Voila.
 *
 * Layer 1 backfill (shipment-verified):
 *   If a tracking/verified event arrives but we have no charge record, we immediately
 *   call the Voila API to fetch the full shipment and create charges — recovering from
 *   a missed shipment-created webhook automatically.
 */

import express from 'express';
import { query } from '../db/index.js';
import { processShipment, insertCharges } from '../services/pricingEngine.js';
import { fetchShipmentById } from '../services/voilaClient.js';

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

    let whereClause, whereValues;
    if (shipmentId) {
      whereClause = 'voila_shipment_id = $1';
      whereValues = [shipmentId];
    } else {
      whereClause = 'order_id = $1';
      whereValues = [orderId];
    }

    const result = await query(
      `DELETE FROM charges WHERE ${whereClause} AND status != 'invoiced' RETURNING id, invoice_id`,
      whereValues
    );

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
//
// Layer 1 backfill: if we have no charge record for this shipment, immediately
// call the Voila API to fetch and create it rather than silently doing nothing.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/shipment-verified', authMiddleware, async (req, res, next) => {
  try {
    const { shipment_id, order_id } = req.body;

    if (!shipment_id && !order_id) {
      return res.status(400).json({ error: 'shipment_id or order_id is required' });
    }

    const whereClause = shipment_id ? 'voila_shipment_id = $1' : 'order_id = $1';
    const whereValue  = shipment_id || order_id;

    // ── Step 1: Try to verify existing charges ────────────────────────────────
    const verifyResult = await query(
      `UPDATE charges SET verified = true, status = 'verified', updated_at = NOW()
       WHERE ${whereClause} AND verified = false AND cancelled = false
       RETURNING id`,
      [whereValue]
    );

    if (verifyResult.rows.length > 0) {
      console.log(`✅  Verified: ${verifyResult.rows.length} charge(s) for shipment ${whereValue}`);
      return res.json({ status: 'ok', charges_verified: verifyResult.rows.length, backfilled: false });
    }

    // ── Step 2: No charges found — attempt Layer 1 API backfill ──────────────
    // The shipment-created webhook was likely missed. Fetch from Voila API,
    // run through processShipment, insert charges, then mark verified.
    console.warn(`⚠️  shipment-verified: no charges found for ${whereValue} — attempting Voila API backfill`);

    if (!shipment_id) {
      // Without a Voila shipment ID we can't call the API — log and move on
      console.warn(`   No shipment_id in payload, cannot backfill by order_id only`);
      return res.json({ status: 'ok', charges_verified: 0, backfilled: false, note: 'no_shipment_id_for_backfill' });
    }

    let payload;
    try {
      payload = await fetchShipmentById(shipment_id);
    } catch (apiErr) {
      console.error(`   Voila API backfill failed for shipment ${shipment_id}:`, apiErr.message);
      return res.json({ status: 'ok', charges_verified: 0, backfilled: false, backfill_error: apiErr.message });
    }

    if (!payload) {
      console.warn(`   Voila API returned no shipment for ID ${shipment_id}`);
      return res.json({ status: 'ok', charges_verified: 0, backfilled: false, note: 'not_found_in_voila' });
    }

    // Run through the same pricing pipeline as a normal webhook
    const { charges, errors } = await processShipment(payload);

    if (!charges.length) {
      console.warn(`   Backfill: processShipment produced no charges for ${shipment_id}`, errors);
      return res.json({ status: 'ok', charges_verified: 0, backfilled: false, backfill_errors: errors });
    }

    const inserted = await insertCharges(charges);

    // Immediately mark the freshly inserted charges as verified
    const insertedIds = inserted.map(c => c.id);
    if (insertedIds.length) {
      await query(
        `UPDATE charges SET verified = true, status = 'verified', updated_at = NOW()
         WHERE id = ANY($1)`,
        [insertedIds]
      );
    }

    console.log(`✅  Backfill: created + verified ${inserted.length} charge(s) for shipment ${shipment_id} (missed webhook recovered)`);
    if (errors.length) console.warn('   Backfill warnings:', errors);

    return res.json({
      status:           'ok',
      charges_verified: inserted.length,
      backfilled:       true,
      charges_created:  inserted.length,
      warnings:         errors,
    });

  } catch (err) {
    console.error('❌  shipment-verified error:', err.message);
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/webhooks/voila-probe?shipment_id=<id>
// Diagnostic: fetch a raw Voila API response and show what processShipment
// would receive — use this to verify the API mapping before going live.
// ─────────────────────────────────────────────────────────────────────────────

import { probeShipmentRaw, probeShipmentByReference, mapToWebhookPayload } from '../services/voilaClient.js';

router.get('/voila-probe', async (req, res, next) => {
  try {
    const { shipment_id, reference } = req.query;
    if (!shipment_id && !reference) {
      return res.status(400).json({ error: 'shipment_id or reference required' });
    }

    // Call Voila API directly — no DB lookup needed
    const raw     = shipment_id
      ? await probeShipmentRaw(shipment_id)
      : await probeShipmentByReference(reference);

    const rawList = Array.isArray(raw) ? raw : (raw.shipments || (raw.id ? [raw] : []));
    const match   = shipment_id
      ? rawList.find(s => String(s.id) === String(shipment_id)) || rawList[0]
      : rawList.find(s => s.reference === reference || s.reference_2 === reference) || rawList[0];

    res.json({
      shipment_found:  !!match,
      raw_response:    raw,
      mapped_payload:  match ? mapToWebhookPayload(match) : null,
    });
  } catch (err) {
    console.error('❌  voila-probe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
