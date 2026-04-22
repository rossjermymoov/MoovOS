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

// ─── GET /api/billing/charges/aged-alerts ────────────────────────────────────
// Verified, unbilled charges older than :days days, excluding manual-billing customers.

router.get('/charges/aged-alerts', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '14');
    const r = await query(`
      SELECT
        c.id, c.created_at, c.order_id, c.parcel_qty, c.service_name,
        c.price, c.vat_amount, c.verified,
        cu.id   AS customer_id,
        cu.business_name AS customer_name,
        cu.account_number AS customer_account,
        s.courier, s.ship_to_postcode, s.reference, s.tracking_codes,
        EXTRACT(DAY FROM NOW() - c.created_at)::int AS age_days
      FROM charges c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN shipments  s  ON s.id  = c.shipment_id
      WHERE c.verified  = true
        AND c.billed    = false
        AND c.cancelled = false
        AND c.created_at < NOW() - ($1 || ' days')::INTERVAL
        AND (cu.manual_billing IS NULL OR cu.manual_billing = false)
      ORDER BY c.created_at ASC
    `, [days]);

    res.json({ alerts: r.rows, days, count: r.rows.length });
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
      billed, verified, cancelled,
      date_from, date_to,
      limit = 50, offset = 0,
    } = req.query;

    const conds = [`c.charge_type = $1`];
    const vals  = [charge_type];
    let   idx   = 2;

    if (customer_id) { conds.push(`c.customer_id = $${idx++}`); vals.push(customer_id); }
    if (billed   !== undefined) { conds.push(`c.billed    = $${idx++}`); vals.push(billed   === 'true'); }
    if (verified !== undefined) { conds.push(`c.verified  = $${idx++}`); vals.push(verified === 'true'); }
    if (cancelled !== undefined) { conds.push(`c.cancelled = $${idx++}`); vals.push(cancelled === 'true'); }
    else { conds.push('c.cancelled = false'); }
    if (date_from) { conds.push(`c.created_at >= $${idx++}`); vals.push(date_from); }
    if (date_to)   { conds.push(`c.created_at <  $${idx++}`); vals.push(date_to); }
    if (search) {
      conds.push(`(
        cu.business_name ILIKE $${idx} OR cu.account_number ILIKE $${idx} OR
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
          cu.business_name  AS customer_name,
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

// ─── GET /api/billing/charges/:id/debug ──────────────────────────────────────
// Step-by-step trace of why a charge did or did not get a price.

router.get('/charges/:id/debug', async (req, res, next) => {
  try {
    const { id } = req.params;

    const r = await query(`
      SELECT
        c.id, c.customer_id, c.service_name AS c_service_name,
        c.zone_name, c.weight_class_name,
        c.price, c.price_auto, c.rate_id, c.order_id, c.parcel_qty,
        s.platform_shipment_id,
        s.customer_account, s.customer_name AS s_customer_name,
        s.courier, s.dc_service_id, s.service_name AS s_service_name,
        s.total_weight_kg, s.parcel_count,
        s.raw_payload
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.id = $1
    `, [id]);

    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    const row = r.rows[0];

    const trace = {
      charge_id: id,
      order_id: row.order_id,
      stored_price: row.price,
      stored_price_auto: row.price_auto,
      stored_zone: row.zone_name,
      stored_weight_class: row.weight_class_name,
      steps: [],
    };

    // Step 1: Payload extraction
    const payload = (typeof row.raw_payload === 'string')
      ? safeJson(row.raw_payload) || {}
      : (row.raw_payload || {});
    const shipment    = payload.shipment    || {};
    const request     = payload.request     || {};
    const reqShipment = request.shipment    || {};

    const accountNumber = shipment.account_number || reqShipment.account_number;
    const dcServiceId   = reqShipment.dc_service_id || shipment.dc_service_id || row.dc_service_id;
    const serviceName   = shipment.friendly_service_name || reqShipment.friendly_service_name || row.s_service_name;
    const parcelCount   = shipment.parcel_count || (reqShipment.parcels || []).length || row.parcel_qty || 1;

    const createParcels = shipment.create_label_parcels || [];
    let totalWeightKg = createParcels.length
      ? createParcels.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0)
      : parseFloat(reqShipment._summed_total_weight) || null;
    if (!totalWeightKg && row.total_weight_kg) totalWeightKg = parseFloat(row.total_weight_kg);
    const weightPerParcel = parcelCount > 0 && totalWeightKg ? totalWeightKg / parcelCount : totalWeightKg;

    trace.steps.push({
      step: 1,
      title: 'Webhook payload extraction',
      account_number: accountNumber || null,
      dc_service_id: dcServiceId || null,
      service_name: serviceName || null,
      parcel_count: parcelCount,
      total_weight_kg: totalWeightKg,
      weight_per_parcel_kg: weightPerParcel != null ? Math.round(weightPerParcel * 1000) / 1000 : null,
    });

    // Step 2: Customer resolution
    let customerId = null;
    let customerName = null;
    if (accountNumber) {
      const cr = await query(
        'SELECT id, business_name FROM customers WHERE account_number = $1',
        [accountNumber]
      );
      if (cr.rows.length) {
        customerId  = cr.rows[0].id;
        customerName = cr.rows[0].business_name;
      }
    }
    // Fall back to stored customer_id if payload resolution failed
    if (!customerId && row.customer_id) customerId = row.customer_id;

    trace.steps.push({
      step: 2,
      title: 'Customer resolution',
      account_number_used: accountNumber || null,
      customer_found: !!customerId,
      customer_id: customerId,
      customer_name: customerName,
      note: !accountNumber
        ? 'No account_number in webhook payload'
        : !customerId
          ? `No customer matched account_number "${accountNumber}"`
          : null,
    });

    if (!customerId) {
      trace.conclusion = {
        priced: false,
        reason: 'Customer not resolved — account_number missing from webhook payload or not matched in the customers table',
        fix: 'Ensure the customer\'s Account Number field in Moov OS matches the account_number sent in the webhook',
      };
      return res.json(trace);
    }

    // Step 3: Service match in customer_rates
    const partialName = `%${(serviceName || '').split(' ').slice(0, 3).join(' ')}%`;
    const rateRes = await query(`
      SELECT cr.id, cr.price, cr.zone_name, cr.weight_class_name,
             cr.service_code, cr.service_name
      FROM customer_rates cr
      WHERE cr.customer_id = $1
        AND (
          cr.service_code ILIKE $2
          OR cr.service_name ILIKE $3
          OR cr.service_name ILIKE $4
        )
      ORDER BY cr.zone_name, cr.weight_class_name
    `, [customerId, dcServiceId || '', serviceName || '', partialName]);

    // Also count total rates for this customer (for context)
    const totalRates = await query(
      'SELECT COUNT(*)::int AS cnt FROM customer_rates WHERE customer_id = $1',
      [customerId]
    );

    trace.steps.push({
      step: 3,
      title: 'customer_rates service match',
      query: {
        customer_id: customerId,
        service_code_ilike: dcServiceId || '',
        service_name_ilike: serviceName || '',
        service_name_partial_ilike: partialName,
      },
      total_rates_for_customer: totalRates.rows[0].cnt,
      rows_matched: rateRes.rows.length,
      rows: rateRes.rows.map(r => ({
        id: r.id,
        service_code: r.service_code,
        service_name: r.service_name,
        zone_name: r.zone_name,
        weight_class_name: r.weight_class_name,
        price: r.price,
      })),
    });

    if (!rateRes.rows.length) {
      trace.conclusion = {
        priced: false,
        reason: `No customer_rates rows matched for this customer. Service code "${dcServiceId}", service name "${serviceName}".`,
        fix: totalRates.rows[0].cnt === 0
          ? 'No pricing set up at all for this customer — add rates in the customer\'s Pricing tab'
          : `Rates exist but none match the service. Check that service_code or service_name in customer_rates matches "${dcServiceId}" / "${serviceName}"`,
      };
      return res.json(trace);
    }

    // Step 4: Weight band matching
    const weightChecks = rateRes.rows.map(r => {
      if (!r.weight_class_name) {
        return { ...r, covers_weight: false, note: 'No weight class name on this rate row' };
      }
      if (weightPerParcel == null) {
        return { ...r, covers_weight: false, note: 'No parcel weight available in webhook to match against' };
      }

      const s = r.weight_class_name.toUpperCase().replace(/\s/g, '');
      const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)KG?$/);
      const plus  = s.match(/^(\d+(?:\.\d+)?)\+KG?$/) || s.match(/^OVER(\d+(?:\.\d+)?)KG?$/);
      const under = s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)KG?$/);

      let covers = false;
      let note   = '';

      if (range) {
        const lo = parseFloat(range[1]), hi = parseFloat(range[2]);
        covers = weightPerParcel > lo && weightPerParcel <= hi;
        note   = `Range ${lo}–${hi} kg, parcel is ${weightPerParcel} kg → ${covers ? '✓ MATCH' : '✗ no match'}`;
      } else if (plus) {
        const min = parseFloat(plus[1]);
        covers = weightPerParcel > min;
        note   = `Over ${min} kg, parcel is ${weightPerParcel} kg → ${covers ? '✓ MATCH' : '✗ no match'}`;
      } else if (under) {
        const max = parseFloat(under[1]);
        covers = weightPerParcel < max;
        note   = `Under ${max} kg, parcel is ${weightPerParcel} kg → ${covers ? '✓ MATCH' : '✗ no match'}`;
      } else {
        note = `⚠ Unrecognised format "${r.weight_class_name}" — expected e.g. "0-1KG", "OVER5KG", "UNDER2KG"`;
      }

      return {
        rate_id: r.id,
        zone_name: r.zone_name,
        weight_class_name: r.weight_class_name,
        price: r.price,
        covers_weight: covers,
        note,
      };
    });

    const matching = weightChecks.filter(w => w.covers_weight);

    trace.steps.push({
      step: 4,
      title: 'Weight band matching',
      weight_per_parcel_kg: weightPerParcel,
      checks: weightChecks,
      matching_count: matching.length,
    });

    // Conclusion
    if (matching.length >= 1) {
      trace.conclusion = {
        priced: true,
        price: parseFloat(matching[0].price),
        zone_name: matching[0].zone_name,
        weight_class_name: matching[0].weight_class_name,
        note: matching.length > 1
          ? `${matching.length} bands matched — used first (${matching[0].zone_name})`
          : 'Single exact band match',
      };
    } else if (weightPerParcel == null && rateRes.rows.length === 1) {
      trace.conclusion = {
        priced: true,
        price: parseFloat(rateRes.rows[0].price),
        zone_name: rateRes.rows[0].zone_name,
        weight_class_name: rateRes.rows[0].weight_class_name,
        note: 'No weight in webhook but only one rate row — used it directly',
      };
    } else {
      const hasUnrecognised = weightChecks.some(c => c.note?.includes('Unrecognised'));
      const noWeight        = weightPerParcel == null;
      trace.conclusion = {
        priced: false,
        reason: hasUnrecognised
          ? `Weight class name format not parseable — coversWeight() returned false for all rows`
          : noWeight
            ? `No parcel weight in webhook and ${rateRes.rows.length} rate rows — ambiguous, cannot auto-select`
            : `No weight band covers ${weightPerParcel} kg`,
        fix: hasUnrecognised
          ? 'Update weight_class_name values in customer_rates to use format like "0-1KG", "1-2KG", "OVER5KG"'
          : noWeight
            ? 'Parcel weight not sent in webhook payload; set the price manually or check webhook parcel weight field'
            : `Check that a rate band exists that covers ${weightPerParcel} kg`,
      };
    }

    return res.json(trace);
  } catch (err) { next(err); }
});

// ─── POST /api/billing/charges/:id/reprice ────────────────────────────────────
// Re-run lookupRate with current data; if a rate is found, update the charge.

router.post('/charges/:id/reprice', async (req, res, next) => {
  try {
    const { id } = req.params;

    const r = await query(`
      SELECT c.customer_id, c.parcel_qty,
             s.dc_service_id, s.service_name AS s_service_name,
             s.total_weight_kg, s.parcel_count
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.id = $1
    `, [id]);

    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    const row = r.rows[0];

    const customerId  = row.customer_id;
    const dcServiceId = row.dc_service_id;
    const serviceName = row.s_service_name;
    const parcelQty   = row.parcel_qty || row.parcel_count || 1;
    const totalWt     = parseFloat(row.total_weight_kg) || null;
    const weightPerParcel = parcelQty > 0 && totalWt ? totalWt / parcelQty : totalWt;

    const rate = await lookupRate(customerId, dcServiceId, serviceName, weightPerParcel);
    if (!rate) {
      return res.json({ ok: false, message: 'No matching rate found — run debug to see why' });
    }

    const totalPrice = parseFloat((rate.price * parcelQty).toFixed(2));

    await query(`
      UPDATE charges
      SET price = $1, zone_name = $2, weight_class_name = $3,
          rate_id = $4, price_auto = true, updated_at = NOW()
      WHERE id = $5
    `, [totalPrice, rate.zone_name, rate.weight_class_name, rate.rate_id, id]);

    res.json({
      ok: true,
      price: totalPrice,
      zone_name: rate.zone_name,
      weight_class_name: rate.weight_class_name,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/billing/charges/:id/payload ────────────────────────────────────
// Returns the raw webhook JSON that created this charge's shipment.

router.get('/charges/:id/payload', async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await query(`
      SELECT s.raw_payload, s.platform_shipment_id, s.created_at
      FROM charges c
      LEFT JOIN shipments s ON s.id = c.shipment_id
      WHERE c.id = $1
    `, [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Charge not found' });
    const row = r.rows[0];
    const payload = typeof row.raw_payload === 'string'
      ? safeJson(row.raw_payload)
      : row.raw_payload;
    res.json({
      platform_shipment_id: row.platform_shipment_id,
      received_at: row.created_at,
      payload,
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
