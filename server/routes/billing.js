/**
 * Moov OS — Billing API
 *
 * POST /api/billing/webhook          — ingest shipment.created / shipment.cancelled
 * GET  /api/billing/charges          — paginated charges list with filters
 * GET  /api/billing/charges/stats    — summary counts and totals
 * PATCH /api/billing/charges/:id     — update billed / verified / cancelled flags
 * DELETE /api/billing/charges/:id    — soft-delete (cancel) a charge
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(obj, ...keys) {
  for (const k of keys) {
    const val = k.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj);
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return null;
}

function safeJson(str) {
  if (!str || typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch { return null; }
}

// ─── Rate card lookup ─────────────────────────────────────────────────────────
// Tries to find a matching customer rate for a given service + weight.
// Returns { price, zone_name, weight_class_name, rate_id } or null.

async function lookupRate(customerId, serviceCode, serviceName, weightKg) {
  if (!customerId) return null;

  // Find matching service in customer_rates — try by service_code first, then name
  const rateRes = await query(`
    SELECT
      cr.id, cr.price, cr.zone_name, cr.weight_class_name,
      cr.service_code, cr.service_name
    FROM customer_rates cr
    WHERE cr.customer_id = $1
      AND (
        cr.service_code ILIKE $2
        OR cr.service_name ILIKE $3
        OR cr.service_name ILIKE $4
      )
    ORDER BY cr.zone_name, cr.weight_class_name
  `, [customerId, serviceCode || '', serviceName || '', `%${(serviceName||'').split(' ').slice(0,3).join(' ')}%`]);

  if (!rateRes.rows.length) return null;

  const rates = rateRes.rows;

  // Filter by weight band if we have a weight
  if (weightKg != null) {
    const matching = rates.filter(r => coversWeight(r.weight_class_name, weightKg));
    if (matching.length === 1) {
      return { price: parseFloat(matching[0].price), zone_name: matching[0].zone_name,
               weight_class_name: matching[0].weight_class_name, rate_id: matching[0].id };
    }
    if (matching.length > 1) {
      // Multiple zone matches — use first, flag as auto
      return { price: parseFloat(matching[0].price), zone_name: matching[0].zone_name,
               weight_class_name: matching[0].weight_class_name, rate_id: matching[0].id };
    }
  }

  // No weight match — if only one rate exists for this service, use it
  if (rates.length === 1) {
    return { price: parseFloat(rates[0].price), zone_name: rates[0].zone_name,
             weight_class_name: rates[0].weight_class_name, rate_id: rates[0].id };
  }

  return null; // ambiguous — manual pricing needed
}

function coversWeight(weightClassName, weightKg) {
  if (!weightClassName) return false;
  const s = weightClassName.toUpperCase().replace(/\s/g, '');
  const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)KG?$/);
  if (range) {
    const lo = parseFloat(range[1]), hi = parseFloat(range[2]);
    return weightKg > lo && weightKg <= hi;
  }
  const plus = s.match(/^(\d+(?:\.\d+)?)\+KG?$/) || s.match(/^OVER(\d+(?:\.\d+)?)KG?$/);
  if (plus) return weightKg > parseFloat(plus[1]);
  const under = s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)KG?$/);
  if (under) return weightKg < parseFloat(under[1]);
  return false;
}

// ─── POST /api/billing/webhook ────────────────────────────────────────────────

router.post('/webhook', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Empty payload' });

    // Unwrap platform wrapper
    const payload = (body.json && typeof body.json === 'object') ? body.json : body;
    const eventType = payload.event_type || 'shipment.created';

    // ── Cancellation ──────────────────────────────────────────────────────────
    if (eventType === 'shipment.cancelled' || eventType === 'shipment.deleted') {
      const shipment = payload.shipment || {};
      const platformId = shipment.id;
      if (!platformId) return res.json({ ok: true, action: 'skipped', reason: 'no shipment id' });

      await query(`
        UPDATE shipments
        SET cancelled = true, cancelled_at = NOW(), updated_at = NOW()
        WHERE platform_shipment_id = $1
      `, [platformId]);

      await query(`
        UPDATE charges
        SET cancelled = true, updated_at = NOW()
        WHERE shipment_id = (
          SELECT id FROM shipments WHERE platform_shipment_id = $1
        )
      `, [platformId]);

      return res.json({ ok: true, action: 'cancelled', platform_shipment_id: platformId });
    }

    // ── Created ───────────────────────────────────────────────────────────────
    const shipment    = payload.shipment    || {};
    const request     = payload.request     || {};
    const reqShipment = request.shipment    || {};
    const responseParsed = safeJson(payload.response) || {};
    const billingResp = responseParsed.billing || {};

    const platformId     = shipment.id;
    const accountNumber  = shipment.account_number || reqShipment.account_number;
    const accountName    = shipment.account_name   || reqShipment.account_name;
    const courier        = shipment.courier        || reqShipment.courier;
    const serviceName    = shipment.friendly_service_name || reqShipment.friendly_service_name;
    const dcServiceId    = reqShipment.dc_service_id || shipment.dc_service_id;
    const reference      = shipment.reference      || reqShipment.reference;
    const reference2     = shipment.reference_2    || reqShipment.reference_2;
    const parcelCount    = shipment.parcel_count   || (reqShipment.parcels || []).length || 1;
    const shipToPostcode = shipment.ship_to_postcode;
    const shipToName     = shipment.ship_to_name;
    const shipToCountry  = shipment.ship_to_country_iso;
    const collectionDate = shipment.collection_date ? shipment.collection_date.split('T')[0] : null;

    // Total weight across all parcels
    const createParcels = shipment.create_label_parcels || [];
    const totalWeightKg = createParcels.length
      ? createParcels.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0)
      : parseFloat(reqShipment._summed_total_weight) || null;
    const weightPerParcel = parcelCount > 0 && totalWeightKg ? totalWeightKg / parcelCount : totalWeightKg;

    // Tracking codes
    const trackingCodes = createParcels.length
      ? createParcels.map(p => p.tracking_code).filter(Boolean)
      : (responseParsed.tracking_codes || []);

    // Courier costs (what Moov pays) per parcel
    const courierCosts = billingResp.shipping || [];
    const totalCostPrice = courierCosts.reduce((s, c) => s + (parseFloat(c) || 0), 0);

    // Resolve customer
    let customerId = null;
    if (accountNumber) {
      const cr = await query('SELECT id FROM customers WHERE account_number = $1', [accountNumber]);
      if (cr.rows.length) customerId = cr.rows[0].id;
    }

    // Upsert shipment
    const shipRes = await query(`
      INSERT INTO shipments
        (platform_shipment_id, event_type,
         customer_id, customer_account, customer_name,
         courier, dc_service_id, service_name,
         ship_to_name, ship_to_postcode, ship_to_country_iso,
         reference, reference_2,
         parcel_count, total_weight_kg, collection_date, tracking_codes,
         raw_payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (platform_shipment_id) DO UPDATE SET
        customer_id        = COALESCE(EXCLUDED.customer_id, shipments.customer_id),
        customer_account   = COALESCE(EXCLUDED.customer_account, shipments.customer_account),
        service_name       = COALESCE(EXCLUDED.service_name, shipments.service_name),
        tracking_codes     = COALESCE(EXCLUDED.tracking_codes, shipments.tracking_codes),
        updated_at         = NOW()
      RETURNING id
    `, [
      platformId || null, eventType,
      customerId, accountNumber, accountName,
      courier, dcServiceId, serviceName,
      shipToName, shipToPostcode, shipToCountry,
      reference, reference2,
      parcelCount, totalWeightKg || null, collectionDate,
      trackingCodes.length ? trackingCodes : null,
      JSON.stringify(payload),
    ]);

    const shipmentId = shipRes.rows[0].id;

    // Skip creating a charge if one already exists for this shipment
    const existingCharge = await query(
      'SELECT id FROM charges WHERE shipment_id = $1 AND charge_type = $2',
      [shipmentId, 'courier']
    );
    if (existingCharge.rows.length) {
      return res.json({ ok: true, action: 'duplicate', shipment_id: shipmentId });
    }

    // Look up rate card
    const rate = await lookupRate(customerId, dcServiceId, serviceName, weightPerParcel);
    const unitPrice  = rate ? rate.price : null;
    const totalPrice = unitPrice != null ? parseFloat((unitPrice * parcelCount).toFixed(2)) : null;

    // Insert charge
    const chargeRes = await query(`
      INSERT INTO charges
        (shipment_id, customer_id, charge_type,
         order_id, parcel_qty, service_name,
         price, cost_price,
         zone_name, weight_class_name, rate_id, price_auto)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
    `, [
      shipmentId, customerId, 'courier',
      reference, parcelCount, serviceName,
      totalPrice,
      totalCostPrice > 0 ? parseFloat(totalCostPrice.toFixed(2)) : null,
      rate?.zone_name || null,
      rate?.weight_class_name || null,
      rate?.rate_id || null,
      rate != null,
    ]);

    res.json({
      ok: true,
      action: 'created',
      shipment_id: shipmentId,
      charge_id:   chargeRes.rows[0].id,
      price:       totalPrice,
      price_auto:  rate != null,
    });

  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/stats ──────────────────────────────────────────

router.get('/charges/stats', async (req, res, next) => {
  try {
    const { customer_id, date_from, date_to } = req.query;
    const conds = ["c.charge_type = 'courier'", 'c.cancelled = false'];
    const vals  = [];
    let   idx   = 1;
    if (customer_id) { conds.push(`c.customer_id = $${idx++}`); vals.push(customer_id); }
    if (date_from)   { conds.push(`c.created_at >= $${idx++}`); vals.push(date_from); }
    if (date_to)     { conds.push(`c.created_at <  $${idx++}`); vals.push(date_to); }
    const where = `WHERE ${conds.join(' AND ')}`;

    const r = await query(`
      SELECT
        COUNT(*)::int                              AS total_charges,
        SUM(CASE WHEN c.price IS NULL THEN 1 ELSE 0 END)::int AS unpriced,
        SUM(CASE WHEN c.billed  THEN 1 ELSE 0 END)::int AS billed,
        SUM(CASE WHEN NOT c.billed AND c.price IS NOT NULL THEN 1 ELSE 0 END)::int AS pending,
        COALESCE(SUM(c.price), 0)::numeric(12,2)  AS total_value,
        COALESCE(SUM(CASE WHEN NOT c.billed THEN c.price ELSE 0 END), 0)::numeric(12,2) AS unbilled_value
      FROM charges c
      ${where}
    `, vals);

    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges ─────────────────────────────────────────────────

router.get('/charges', async (req, res, next) => {
  try {
    const {
      charge_type = 'courier',
      customer_id, search,
      billed, cancelled,
      date_from, date_to,
      limit = 50, offset = 0,
    } = req.query;

    const conds = [`c.charge_type = $1`];
    const vals  = [charge_type];
    let   idx   = 2;

    if (customer_id) { conds.push(`c.customer_id = $${idx++}`); vals.push(customer_id); }
    if (billed  !== undefined) { conds.push(`c.billed = $${idx++}`); vals.push(billed === 'true'); }
    if (cancelled !== undefined) { conds.push(`c.cancelled = $${idx++}`); vals.push(cancelled === 'true'); }
    else { conds.push('c.cancelled = false'); }
    if (date_from) { conds.push(`c.created_at >= $${idx++}`); vals.push(date_from); }
    if (date_to)   { conds.push(`c.created_at <  $${idx++}`); vals.push(date_to); }
    if (search) {
      conds.push(`(
        cu.name ILIKE $${idx} OR cu.account_number ILIKE $${idx} OR
        c.order_id ILIKE $${idx} OR c.service_name ILIKE $${idx}
      )`);
      vals.push(`%${search}%`);
      idx++;
    }

    const where = `WHERE ${conds.join(' AND ')}`;

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT
          c.id, c.created_at, c.order_id, c.parcel_qty, c.service_name,
          c.price, c.vat_amount, c.cost_price,
          c.zone_name, c.weight_class_name, c.price_auto,
          c.billed, c.verified, c.cancelled, c.charge_type,
          cu.name  AS customer_name,
          cu.account_number AS customer_account,
          cu.id    AS customer_id,
          s.courier, s.ship_to_postcode, s.ship_to_name,
          s.reference, s.reference_2, s.tracking_codes, s.parcel_count
        FROM charges c
        LEFT JOIN customers cu ON cu.id = c.customer_id
        LEFT JOIN shipments  s  ON s.id  = c.shipment_id
        ${where}
        ORDER BY c.created_at DESC
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...vals, parseInt(limit), parseInt(offset)]),

      query(`
        SELECT COUNT(*)::int AS total FROM charges c
        LEFT JOIN customers cu ON cu.id = c.customer_id
        ${where}
      `, vals),
    ]);

    res.json({
      charges: dataRes.rows,
      total:   countRes.rows[0].total,
      limit:   parseInt(limit),
      offset:  parseInt(offset),
    });
  } catch (err) { next(err); }
});

// ─── PATCH /api/billing/charges/:id ─────────────────────────────────────────

router.patch('/charges/:id', async (req, res, next) => {
  try {
    const { billed, verified, cancelled, price } = req.body;
    const sets = [];
    const vals = [];
    let idx = 1;

    if (billed    !== undefined) { sets.push(`billed = $${idx++}`);    vals.push(billed); }
    if (verified  !== undefined) { sets.push(`verified = $${idx++}`);  vals.push(verified); }
    if (cancelled !== undefined) { sets.push(`cancelled = $${idx++}`); vals.push(cancelled); }
    if (price     !== undefined) { sets.push(`price = $${idx++}`);     vals.push(price); }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push(`updated_at = NOW()`);

    const r = await query(
      `UPDATE charges SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...vals, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /api/billing/charges/:id ─────────────────────────────────────────

router.delete('/charges/:id', async (req, res, next) => {
  try {
    await query(
      `UPDATE charges SET cancelled = true, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
