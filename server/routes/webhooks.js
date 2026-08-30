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

// ─── Helper: create or update a shipments record from a Voila webhook payload ──
//
// The new webhook path (webhooks.js → pricingEngine.js) previously did not create
// shipment records, so charges ended up with shipment_id = NULL. The reconciliation
// pool queries charges via INNER JOIN shipments, meaning those charges were completely
// invisible to reconciliation. This function mirrors what billing.js does for its
// older /api/billing/webhook path.
//
// It is called AFTER processShipment so we can pass the resolved customerId
// (taken from charges[0].customer_id) without duplicating resolution logic.
//
// Returns the UUID of the upserted shipment, or null if no platform_shipment_id.
async function createOrUpdateShipment(payload, customerId) {
  const ship = payload.shipment || payload;

  // Parse request_shipment JSON string → object for dc_service_id extraction
  let reqShip = {};
  try {
    if (payload.request?.shipment) {
      reqShip = typeof payload.request.shipment === 'string'
        ? JSON.parse(payload.request.shipment)
        : payload.request.shipment;
    } else if (ship.request_shipment) {
      reqShip = typeof ship.request_shipment === 'string'
        ? JSON.parse(ship.request_shipment)
        : ship.request_shipment;
    }
  } catch { /* leave empty */ }

  let respObj = {};
  if (payload.response) {
    try {
      respObj = typeof payload.response === 'string' ? JSON.parse(payload.response) : payload.response;
    } catch (_) {}
  }

  // platform_shipment_id must be a BIGINT — skip if unparseable
  const platformId = ship.id ? (parseInt(ship.id, 10) || null) : null;
  if (!platformId) {
    console.warn(`[webhooks] createOrUpdateShipment: no valid platform_shipment_id in payload — shipment record skipped`);
    return null;
  }

  const courier        = ship.courier || payload.request?.courier || 'DPD';
  const dcServiceId    =
    ship.dc_service_id ||
    ship.DC_service_ID ||
    reqShip.dc_service_id ||
    reqShip.DC_service_ID ||
    respObj.dc_service_id ||
    respObj.DC_service_ID ||
    payload.dc_service_id ||
    payload.DC_service_ID ||
    null;
  const serviceName    = ship.friendly_service_name || reqShip.courier?.friendly_service_name || null;
  const customerAccount= ship.account_number || reqShip.account_number || null;
  const customerName   = ship.account_name   || reqShip.account_name   || null;
  const reference      = ship.reference      || reqShip.reference      || null;
  const reference2     = ship.reference_2    || reqShip.reference_2    || null;
  const shipToPostcode = ship.ship_to_postcode || reqShip.ship_to?.postcode || null;
  const shipToName     = ship.ship_to_name   || reqShip.ship_to?.name     || null;
  const shipToCountry  = ship.ship_to_country_iso || reqShip.ship_to?.country_iso || 'GB';
  const parcelCount    = ship.parcel_count   || reqShip.parcels?.length || 1;
  const collectionDate = ship.collection_date ? ship.collection_date.split('T')[0].split(' ')[0] : null;

  // Tracking codes from create_label_parcels or response
  const clParcels    = ship.create_label_parcels || [];
  let trackingCodes = [...new Set(clParcels.map(p => p.tracking_code).filter(Boolean))];
  if (!trackingCodes.length && payload.response) {
    try {
      const respObj = typeof payload.response === 'string' ? JSON.parse(payload.response) : payload.response;
      if (Array.isArray(respObj.tracking_codes)) {
        trackingCodes = [...new Set(respObj.tracking_codes.filter(Boolean))];
      }
    } catch (_) {}
  }

  // Total weight from parcels
  let totalWeightKg = clParcels.length
    ? (clParcels.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0) || null)
    : null;
  if (!totalWeightKg && reqShip.parcels?.length) {
    totalWeightKg = reqShip.parcels.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0) || null;
  }

  try {
    const shipRes = await query(`
      INSERT INTO shipments (
        platform_shipment_id, event_type,
        customer_id, customer_account, customer_name,
        courier, dc_service_id, service_name,
        ship_to_name, ship_to_postcode, ship_to_country_iso,
        reference, reference_2,
        parcel_count, total_weight_kg, collection_date,
        tracking_codes, raw_payload
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (platform_shipment_id) DO UPDATE SET
        customer_id      = COALESCE(EXCLUDED.customer_id,      shipments.customer_id),
        customer_account = COALESCE(EXCLUDED.customer_account, shipments.customer_account),
        customer_name    = COALESCE(EXCLUDED.customer_name,    shipments.customer_name),
        service_name     = COALESCE(EXCLUDED.service_name,     shipments.service_name),
        tracking_codes   = COALESCE(EXCLUDED.tracking_codes,   shipments.tracking_codes),
        dc_service_id    = COALESCE(EXCLUDED.dc_service_id,    shipments.dc_service_id),
        ship_to_name     = COALESCE(EXCLUDED.ship_to_name,     shipments.ship_to_name),
        ship_to_postcode = COALESCE(EXCLUDED.ship_to_postcode, shipments.ship_to_postcode),
        collection_date  = COALESCE(EXCLUDED.collection_date,  shipments.collection_date),
        total_weight_kg  = COALESCE(EXCLUDED.total_weight_kg,  shipments.total_weight_kg),
        updated_at     = NOW()
      RETURNING id
    `, [
      platformId, 'shipment.created',
      customerId, customerAccount, customerName,
      courier, dcServiceId, serviceName,
      shipToName, shipToPostcode, shipToCountry,
      reference, reference2,
      parcelCount, totalWeightKg, collectionDate,
      trackingCodes.length ? trackingCodes : null,
      JSON.stringify(payload),
    ]);

    const shipmentId = shipRes.rows[0]?.id || null;
    console.log(`[webhooks] Shipment record ${shipmentId ? 'upserted' : 'failed'} for platform_id=${platformId}, tracking_codes=[${trackingCodes.join(',')}]`);
    return shipmentId;
  } catch (err) {
    console.error(`[webhooks] createOrUpdateShipment failed for platform_id=${platformId}:`, err.message);
    return null;
  }
}

const router = express.Router();

function authMiddleware(req, res, next) {
  // If no auth header is provided, permit the incoming webhook so unauthenticated carriers/senders work seamlessly
  const auth = req.headers['authorization'] || '';
  if (!auth) {
    return next();
  }
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (token && token !== WEBHOOK_TOKEN && process.env.REQUIRE_WEBHOOK_AUTH === 'true') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function extractPayload(req) {
  let raw = req.body;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch (_) {}
  }
  if (raw && raw.json) {
    if (typeof raw.json === 'string') {
      try { raw = JSON.parse(raw.json); } catch (_) {}
    } else {
      raw = raw.json;
    }
  }
  if (raw && !raw.shipment && raw.request?.shipment) {
    raw.shipment = raw.request.shipment;
  }
  return raw || {};
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/webhooks/shipment-created
// ─────────────────────────────────────────────────────────────────────────────

router.post('/shipment-created', authMiddleware, (req, res) => {
  const payload = extractPayload(req);

  if (!payload?.shipment) {
    return res.status(400).json({ error: 'Invalid payload: missing shipment object' });
  }

  // ── Respond immediately so caller never retries ────────────────────────────
  res.json({ status: 'accepted' });

  setImmediate(async () => {
    const voilaShipmentId = String(payload.shipment?.id || '');
    try {
      let charges = [];
      let errors = [];
      let customerId = null;

      try {
        const result = await processShipment(payload);
        charges = result.charges || [];
        errors = result.errors || [];
        customerId = charges[0]?.customer_id || null;
      } catch (procErr) {
        console.warn(`[webhooks] processShipment note for ${voilaShipmentId}:`, procErr.message);
        errors.push(procErr.message);
      }

      // If customer not resolved by pricingEngine, attempt fallback lookup in customers table
      if (!customerId) {
        const acct = payload.shipment?.account_number;
        const name = payload.shipment?.account_name;
        if (acct) {
          const cr = await query('SELECT id FROM customers WHERE account_number = $1 LIMIT 1', [acct]);
          if (cr.rows.length) customerId = cr.rows[0].id;
        }
        if (!customerId && name) {
          const cr = await query('SELECT id FROM customers WHERE LOWER(business_name) = LOWER($1) LIMIT 1', [name]);
          if (cr.rows.length) customerId = cr.rows[0].id;
        }
      }

      // ALWAYS create/update the shipment record!
      const shipmentId = await createOrUpdateShipment(payload, customerId);

      if (charges.length && shipmentId) {
        const inserted = await insertCharges(charges, shipmentId);
        console.log(`✅  Shipment ${voilaShipmentId}: ${inserted.length} charge(s) created, shipment_id=${shipmentId}`);
      } else {
        console.log(`ℹ️  Shipment ${voilaShipmentId}: recorded in shipments table (shipment_id=${shipmentId})`);
      }
      if (errors.length) console.warn('   Warnings:', errors);

    } catch (err) {
      console.error(`❌  Webhook background error (shipment ${voilaShipmentId}):`, err.message);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/webhooks/shipment-cancelled
// ─────────────────────────────────────────────────────────────────────────────

router.post('/shipment-cancelled', authMiddleware, async (req, res, next) => {
  try {
    const payload = extractPayload(req);
    const shipment = payload.shipment || payload;

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

    // Mark shipment record as cancelled
    if (shipmentId) {
      await query(
        `UPDATE shipments SET cancelled = true, cancelled_at = NOW(), updated_at = NOW() WHERE platform_shipment_id = $1`,
        [parseInt(shipmentId, 10) || 0]
      );
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

    // Create shipment record so reconciliation pool can find these charges
    const customerId = charges[0]?.customer_id || null;
    const backfillShipmentId = await createOrUpdateShipment(payload, customerId);

    const inserted = await insertCharges(charges, backfillShipmentId);

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

import { probeShipmentRaw, probeShipmentByReference, mapToWebhookPayload, fetchShipmentsByDateRange } from '../services/voilaClient.js';

router.get('/voila-probe', async (req, res, next) => {
  try {
    const { shipment_id, reference } = req.query;
    if (!shipment_id && !reference) {
      return res.status(400).json({ error: 'shipment_id or reference required' });
    }

    if (shipment_id) {
      const raw     = await probeShipmentRaw(shipment_id);
      const rawList = Array.isArray(raw) ? raw : (raw.shipments || (raw.id ? [raw] : []));
      const match   = rawList.find(s => String(s.id) === String(shipment_id)) || rawList[0];
      return res.json({ shipment_found: !!match, raw_response: raw, mapped_payload: match ? mapToWebhookPayload(match) : null });
    }

    // Try every plausible parameter name the Voila API might use for reference search
    const paramVariants = ['reference', 'q', 'search', 'order_reference', 'order_id', 'consignment'];
    const attempts = {};
    for (const param of paramVariants) {
      try {
        const r = await probeShipmentByReference(reference, param);
        const list = Array.isArray(r) ? r : (r.shipments || []);
        attempts[param] = { count: list.length, shipments: list.slice(0, 2) };
        if (list.length > 0) {
          // Found it — return full result with the winning param
          const match = list.find(s => s.reference === reference || s.reference_2 === reference) || list[0];
          return res.json({
            shipment_found:  true,
            winning_param:   param,
            raw_response:    r,
            mapped_payload:  mapToWebhookPayload(match),
            all_attempts:    attempts,
          });
        }
      } catch (e) {
        attempts[param] = { error: e.message };
      }
    }

    // Also fetch one page unfiltered so we can see what field names exist
    const sample = await probeShipmentByReference(null, null);
    const sampleList = Array.isArray(sample) ? sample : (sample.shipments || []);

    return res.json({
      shipment_found:   false,
      all_attempts:     attempts,
      sample_fields:    sampleList[0] ? Object.keys(sampleList[0]) : [],
      sample_shipment:  sampleList[0] || null,
    });

  } catch (err) {
    console.error('❌  voila-probe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/webhooks/voila-backfill
// Disaster-recovery: fetch ALL shipments from Voila API within a date range,
// price any that don't already have charges, and mark them verified.
// Body: { start: "2024-06-01T08:00:00", end: "2024-06-01T12:00:00" }
// ─────────────────────────────────────────────────────────────────────────────

router.post('/voila-backfill', authMiddleware, async (req, res, next) => {
  try {
    const { start, end } = req.body;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end datetime strings are required' });
    }

    // Respond immediately — processing is fire-and-forget.
    //
    // Fetching + processing thousands of shipments takes longer than Railway's
    // request timeout. We return 202 Accepted straight away and run the full
    // backfill asynchronously in the background. Progress is logged to the
    // Railway console — check there to confirm completion.
    res.status(202).json({
      status:  'started',
      message: `Backfill running in background for ${start} → ${end}. Check Railway logs for progress.`,
    });

    // ── Background processing ─────────────────────────────────────────────────
    setImmediate(async () => {
      try {
        console.log(`🔄  Voila bulk backfill: fetching shipments ${start} → ${end}`);

        const payloads = await fetchShipmentsByDateRange(start, end);
        console.log(`   Fetched ${payloads.length} shipment(s) from Voila API`);

        let created  = 0;
        let refreshed = 0;
        let failed   = 0;
        const errors = [];

        for (const payload of payloads) {
          const shipmentId = payload.shipment?.id;

          try {
            // ALWAYS upsert the shipment record, even if charges already exist.
            //
            // Critical for reconciliation pool: the pool indexes by
            // shipments.tracking_codes (DPD consignment numbers from create_label_parcels).
            // Historical charges have tracking_codes = NULL because create_label_parcels
            // may have been empty or the tracking_code extraction had a bug.
            // Without this upsert, the pool has no key to look up DPD consignment
            // numbers against, and every invoice line falls to the external_booking path.
            //
            // ON CONFLICT in createOrUpdateShipment uses COALESCE — safe to call
            // repeatedly, never overwrites a real tracking_codes with NULL.
            //
            // Two charge paths to check:
            //   A) pricingEngine.js path  → charges.voila_shipment_id = shipmentId (UUID)
            //   B) billing.js path        → shipments.platform_shipment_id = parseInt(shipmentId) (BIGINT)
            const numericPlatformId = parseInt(shipmentId, 10) || null;
            const existing = await query(
              `SELECT c.id, c.customer_id
               FROM   charges  c
               LEFT JOIN shipments s ON s.id = c.shipment_id
               WHERE  c.charge_type = 'courier'
                 AND  c.cancelled   = false
                 AND  (
                   c.voila_shipment_id = $1
                   OR (s.platform_shipment_id = $2 AND $2 IS NOT NULL)
                 )
               LIMIT 1`,
              [shipmentId, numericPlatformId]
            );

            if (existing.rows.length) {
              // Charges exist — refresh the shipment record (tracking_codes, etc.)
              // from the fresh Voila API payload. This populates any missing
              // tracking_codes so the reconciliation pool can index them.
              const existingCustomerId = existing.rows[0]?.customer_id || null;
              await createOrUpdateShipment(payload, existingCustomerId);
              refreshed++;
              continue;
            }

            // No charges yet — run full pricing pipeline and create everything.
            const { charges: newCharges, errors: priceErrors } = await processShipment(payload);
            if (!newCharges.length) {
              failed++;
              errors.push({ shipment_id: shipmentId, errors: priceErrors });
              continue;
            }

            const bulkCustomerId = newCharges[0]?.customer_id || null;
            const bulkShipmentId = await createOrUpdateShipment(payload, bulkCustomerId);

            const inserted = await insertCharges(newCharges, bulkShipmentId);
            const insertedIds = inserted.map(c => c.id);
            if (insertedIds.length) {
              await query(
                `UPDATE charges SET verified = true, status = 'verified', updated_at = NOW() WHERE id = ANY($1)`,
                [insertedIds]
              );
            }
            created += inserted.length;

          } catch (shipErr) {
            failed++;
            errors.push({ shipment_id: shipmentId, error: shipErr.message });
          }
        }

        console.log(
          `✅  Voila bulk backfill complete: ${payloads.length} fetched, ` +
          `${refreshed} shipment records refreshed, ${created} new charge(s) created, ${failed} failed`
        );
        if (errors.length) {
          console.warn('   Backfill errors (first 20):', JSON.stringify(errors.slice(0, 20)));
        }

      } catch (bgErr) {
        console.error('❌  voila-backfill background error:', bgErr.message);
      }
    });

  } catch (err) {
    console.error('❌  voila-backfill error:', err.message);
    next(err);
  }
});

export default router;
