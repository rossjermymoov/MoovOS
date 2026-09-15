/**
 * Moov OS — Shipments API
 *
 * Provides endpoints for viewing all incoming webhooked parcels,
 * filtering/inspecting payload data, and generating simulation test shipments.
 */

import express from 'express';
import { query } from '../db/index.js';
import { processShipment, insertCharges } from '../services/pricingEngine.js';
import { processShipmentCreatedWebhook } from './billing.js';
import { createOrUpdateShipment } from './webhooks.js';

const router = express.Router();

// ─── GET /api/shipments ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      customer_id,
      courier,
      start_date,
      end_date,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = [];
    const params = [];

    if (customer_id) {
      params.push(customer_id);
      conditions.push(`s.customer_id = $${params.length}`);
    }

    if (courier) {
      params.push(courier);
      conditions.push(`s.courier ILIKE $${params.length}`);
    }

    if (start_date) {
      params.push(start_date);
      conditions.push(`s.created_at >= $${params.length}`);
    }

    if (end_date) {
      params.push(end_date);
      conditions.push(`s.created_at <= $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      const pIdx = params.length;
      conditions.push(`(
        s.reference ILIKE $${pIdx} OR
        s.reference_2 ILIKE $${pIdx} OR
        s.ship_to_name ILIKE $${pIdx} OR
        s.ship_to_postcode ILIKE $${pIdx} OR
        s.customer_name ILIKE $${pIdx} OR
        EXISTS (SELECT 1 FROM unnest(s.tracking_codes) tc WHERE tc ILIKE $${pIdx})
      )`);
    }

    // Exclude empty ghost records (no tracking codes, no customer, no destination postcode/name, no real reference)
    conditions.push(`NOT (
      (s.ship_to_postcode IS NULL OR s.ship_to_postcode = '')
      AND (s.ship_to_name IS NULL OR s.ship_to_name = '')
      AND (s.customer_id IS NULL)
      AND (s.reference IS NULL OR s.reference = 'REF' OR s.reference = '' OR s.reference = '—')
      AND (s.tracking_codes IS NULL OR s.tracking_codes = '{}' OR s.tracking_codes = '{""}')
    )`);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM shipments s ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    // Calculate aggregated KPI totals across all matching shipments safely
    let summaryStats = {
      total_shipments: total,
      awaiting_reconciliation: 0,
      total_revenue: 0,
      total_cost: 0,
      gross_margin: 0,
      gross_margin_pct: 0,
    };

    try {
      const statsRes = await query(
        `SELECT
          COUNT(DISTINCT s.id) AS total_shipments,
          COUNT(DISTINCT s.id) FILTER (WHERE ch.verified = false OR ch.id IS NULL) AS awaiting_reconciliation,
          COALESCE(SUM(ch.price), 0) AS total_revenue,
          COALESCE(SUM(ch.cost_price), 0) AS total_cost
        FROM shipments s
        LEFT JOIN charges ch ON ch.shipment_id = s.id
        ${whereClause}`,
        params
      );

      const rawStats = statsRes.rows[0] || {};
      const totalRev = parseFloat(rawStats.total_revenue || 0);
      const totalCost = parseFloat(rawStats.total_cost || 0);
      const grossMargin = totalRev - totalCost;
      const grossMarginPct = totalRev > 0 ? (grossMargin / totalRev) * 100 : 0;

      summaryStats = {
        total_shipments: parseInt(rawStats.total_shipments || total, 10),
        awaiting_reconciliation: parseInt(rawStats.awaiting_reconciliation || 0, 10),
        total_revenue: Math.round(totalRev * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        gross_margin: Math.round(grossMargin * 100) / 100,
        gross_margin_pct: Math.round(grossMarginPct * 10) / 10,
      };
    } catch (statErr) {
      console.warn('[shipments] Warning calculating summaryStats:', statErr.message);
    }

    const listParams = [...params, parseInt(limit, 10), offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const listRes = await query(
      `SELECT
        s.id,
        s.platform_shipment_id,
        s.event_type,
        s.customer_id,
        COALESCE(c.business_name, s.customer_name, s.customer_account, 'Unassigned') AS customer_display_name,
        COALESCE(c.account_number, s.customer_account) AS customer_account,
        s.courier,
        s.dc_service_id,
        s.service_name,
        s.ship_to_name,
        s.ship_to_postcode,
        s.ship_to_country_iso,
        s.reference,
        s.reference_2,
        s.parcel_count,
        s.total_weight_kg,
        s.collection_date,
        s.tracking_codes,
        s.cancelled,
        s.cancelled_at,
        s.created_at,
        s.raw_payload,
        (
          SELECT json_agg(json_build_object(
            'id', ch.id,
            'charge_type', ch.charge_type,
            'service_name', ch.service_name,
            'price', ch.price,
            'cost_price', ch.cost_price,
            'price_failure_reason', ch.price_failure_reason,
            'verified', ch.verified,
            'billed', ch.billed
          ))
          FROM charges ch
          WHERE ch.shipment_id = s.id
        ) AS charges
      FROM shipments s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    res.json({
      shipments: listRes.rows,
      summaryStats,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/shipments/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT
        s.*,
        COALESCE(c.business_name, s.customer_name, s.customer_account) AS customer_display_name,
        (
          SELECT json_agg(ch.*)
          FROM charges ch
          WHERE ch.shipment_id = s.id
        ) AS charges
      FROM shipments s
      LEFT JOIN customers c ON c.id = s.customer_id
      WHERE s.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/shipments/simulate-dpd-sample ──────────────────────────────────
/**
 * Injects test shipments based on the sample DPD invoice for a chosen customer.
 */
router.post('/simulate-dpd-sample', async (req, res, next) => {
  try {
    const { customer_id, custom_lines } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }

    const custRes = await query('SELECT id, business_name, account_number FROM customers WHERE id = $1', [customer_id]);
    if (!custRes.rows.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = custRes.rows[0];

    const sampleLines = custom_lines || [
      {
        consignment: '3768550431',
        parcelNo: '15503768550431',
        weight: 1.0,
        postcode: 'B19 3QP',
        country: 'GB',
        recipient: 'HEERA MALHI, 98-100 HOSPITAL STREET',
        ref: '8039',
        ref2: '56478738841932',
        service: 'DPD Next Day',
        dcServiceId: 'NXTDAY',
        costPrice: 3.76,
      },
      {
        consignment: '3768550577',
        parcelNo: '15503768550577',
        weight: 1.0,
        postcode: 'SW12 8DH',
        country: 'GB',
        recipient: "MORGAN O'FARRELL, 94 TANTALLON ROAD",
        ref: '8048',
        ref2: '56478745821516',
        service: 'DPD Next Day',
        dcServiceId: 'NXTDAY',
        costPrice: 3.76,
      },
      {
        consignment: '3768550729',
        parcelNo: '15503768550729',
        weight: 1.0,
        postcode: 'SW7 5DZ',
        country: 'GB',
        recipient: 'LEAH VON SIEMENS, 16 BROADWALK HOUSE',
        ref: '8062',
        ref2: '49034085761356',
        service: 'DPD Next Day',
        dcServiceId: 'NXTDAY',
        costPrice: 3.76,
      },
      {
        consignment: '3801421919',
        parcelNo: '15503801421919',
        weight: 2.0,
        postcode: 'SW1X 7DA',
        country: 'GB',
        recipient: 'LINA LAZAAR, 25 CHAPEL ST',
        ref: '8106',
        ref2: '55834646741324',
        service: 'DPD Next Day',
        dcServiceId: 'NXTDAY',
        costPrice: 3.76,
      },
      {
        consignment: '3801422304',
        parcelNo: '15503801422304',
        weight: 1.0,
        postcode: 'E5 9UB',
        country: 'GB',
        recipient: 'ILZE GIRNE, 10 PARADISE PARK',
        ref: '8109',
        ref2: '15652854038860',
        service: 'DPD Next Day',
        dcServiceId: 'NXTDAY',
        costPrice: 3.76,
      },
      {
        consignment: '4393671903',
        parcelNo: '15504393671903',
        weight: 10.5,
        postcode: '98105',
        country: 'US',
        recipient: 'ZEYNEP AKMAN, 4041 ROOSEVELT WAY NE',
        ref: '8069',
        ref2: '52001114849612',
        service: 'DPD Air Classic Express',
        dcServiceId: 'EXPRSS',
        costPrice: 67.85,
      },
      {
        consignment: '3948379168',
        parcelNo: '15503948379168',
        weight: 1.0,
        postcode: 'BT18 0PA',
        country: 'GB',
        recipient: 'BRENDA FRASER, 26A TUDOR OAKS',
        ref: '8222',
        ref2: '55907238150476',
        service: 'DPD Two Day',
        dcServiceId: '2DAY',
        costPrice: 7.85,
      },
    ];

    const insertedShipments = [];

    for (const item of sampleLines) {
      const platformId = Math.floor(100000000 + Math.random() * 900000000);

      // Create shipment record
      const shipRes = await query(
        `INSERT INTO shipments (
          platform_shipment_id,
          event_type,
          customer_id,
          customer_account,
          customer_name,
          courier,
          dc_service_id,
          service_name,
          ship_to_name,
          ship_to_postcode,
          ship_to_country_iso,
          reference,
          reference_2,
          parcel_count,
          total_weight_kg,
          collection_date,
          tracking_codes,
          raw_payload
        ) VALUES (
          $1, 'shipment.created', $2, $3, $4, 'DPD', $5, $6, $7, $8, $9, $10, $11, 1, $12, CURRENT_DATE, $13, $14
        )
        ON CONFLICT (platform_shipment_id) DO UPDATE SET
          customer_id = EXCLUDED.customer_id,
          tracking_codes = EXCLUDED.tracking_codes
        RETURNING *`,
        [
          platformId,
          customer.id,
          customer.account_number || 'CUST-TEST',
          customer.business_name,
          item.dcServiceId,
          item.service,
          item.recipient,
          item.postcode,
          item.country,
          item.ref,
          item.ref2,
          item.weight,
          [item.parcelNo, item.consignment],
          JSON.stringify({ simulated: true, original_item: item }),
        ]
      );

      const shipment = shipRes.rows[0];

      // Generate initial baseline charge row for reconciliation comparison
      const initialSellPrice = item.costPrice > 20 ? Math.round(item.costPrice * 1.3 * 100) / 100 : 5.25;

      await query(
        `INSERT INTO charges (
          shipment_id,
          customer_id,
          charge_type,
          order_id,
          parcel_qty,
          service_name,
          price,
          cost_price,
          price_auto,
          verified,
          billed
        ) VALUES ($1, $2, 'courier', $3, 1, $4, $5, $6, true, false, false)`,
        [
          shipment.id,
          customer.id,
          item.ref || item.parcelNo,
          item.service,
          initialSellPrice,
          item.costPrice,
        ]
      );

      insertedShipments.push(shipment);
    }

    res.status(201).json({
      success: true,
      count: insertedShipments.length,
      customer_name: customer.business_name,
      shipments: insertedShipments,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/shipments/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM charges WHERE shipment_id = $1', [id]);
    await query('DELETE FROM shipments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Shipment deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/shipments/purge-ghosts ─────────────────────────────────────────
router.post('/purge-ghosts', async (req, res, next) => {
  try {
    const deletedRes = await query(`
      DELETE FROM shipments
      WHERE (
        (ship_to_postcode IS NULL OR ship_to_postcode = '')
        AND (ship_to_name IS NULL OR ship_to_name = '')
        AND (customer_id IS NULL)
        AND (reference IS NULL OR reference = 'REF' OR reference = '' OR reference = '—')
        AND (tracking_codes IS NULL OR tracking_codes = '{}' OR tracking_codes = '{""}')
      )
      RETURNING id
    `);

    console.log(`[shipments] Purged ${deletedRes.rows.length} ghost shipments.`);
    res.json({ success: true, deleted: deletedRes.rows.length });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/shipments/reprocess-all & /reprice-all ──────────────────────────
router.post(['/reprocess-all', '/reprice-all'], async (req, res, next) => {
  try {
    // Clean up empty ghost rows that have no tracking, no reference, and no recipient
    await query(`
      DELETE FROM shipments
      WHERE (
        (ship_to_postcode IS NULL OR ship_to_postcode = '')
        AND (ship_to_name IS NULL OR ship_to_name = '')
        AND (customer_id IS NULL)
        AND (reference IS NULL OR reference = 'REF' OR reference = '' OR reference = '—')
        AND (tracking_codes IS NULL OR tracking_codes = '{}' OR tracking_codes = '{""}')
      )
    `).catch(() => {});

    // 1. Gather all raw payloads across tracking_events, charges, and shipments
    const [eventsPayloads, chargesPayloads, shipmentsPayloads] = await Promise.all([
      query(`SELECT raw_payload FROM tracking_events WHERE raw_payload IS NOT NULL ORDER BY id DESC LIMIT 1000`).catch(e => { console.error('Events payload fetch error:', e); return { rows: [] }; }),
      query(`SELECT raw_payload FROM charges WHERE raw_payload IS NOT NULL ORDER BY id DESC LIMIT 1000`).catch(e => { console.error('Charges payload fetch error:', e); return { rows: [] }; }),
      query(`SELECT raw_payload FROM shipments WHERE raw_payload IS NOT NULL ORDER BY id DESC LIMIT 1000`).catch(e => { console.error('Shipments payload fetch error:', e); return { rows: [] }; }),
    ]);

    const allPayloads = [
      ...shipmentsPayloads.rows.map(r => r.raw_payload),
      ...chargesPayloads.rows.map(r => r.raw_payload),
      ...eventsPayloads.rows.map(r => r.raw_payload),
    ].filter(Boolean);

    let repriced = 0;
    const processedKeys = new Set();
    const errors = [];

    for (const raw of allPayloads) {
      let p = raw;
      if (typeof p === 'string') {
        try { p = JSON.parse(p); } catch { continue; }
      }
      if (!p) continue;

      const unwrapped = (p.json && typeof p.json === 'object') ? p.json : p;
      const ship = unwrapped.shipment || unwrapped.request?.shipment || unwrapped;
      let reqShip = unwrapped.request?.shipment || {};
      if (typeof reqShip === 'string') {
        try { reqShip = JSON.parse(reqShip); } catch { reqShip = {}; }
      }

      const platformId = parseInt(ship.id || unwrapped.shipment_id || reqShip.id || unwrapped.request_log_id || unwrapped.request_log?.id, 10) || null;
      const ref = ship.reference || reqShip.reference || unwrapped.reference || null;
      const trackingCode = ship.create_label_parcels?.[0]?.tracking_code || unwrapped.response?.tracking_codes?.[0] || reqShip.billing?.tracking_code || unwrapped.tracking_update?.parcels?.[0]?.tracking_code || null;

      // Skip payloads that have no platform ID, no reference, and no tracking code
      if (!platformId && !ref && !trackingCode) {
        continue;
      }

      const dedupKey = platformId ? `id_${platformId}` : (trackingCode ? `tc_${trackingCode}` : `ref_${ref}`);
      if (processedKeys.has(dedupKey)) continue;
      processedKeys.add(dedupKey);

      try {
        const shipmentId = await processShipmentCreatedWebhook(p);
        if (shipmentId) repriced++;
      } catch (err) {
        errors.push({ key: dedupKey, error: err.message });
      }
    }

    res.json({ success: true, repriced, totalCandidates: processedKeys.size, errors });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/shipments/:id/reprice ──────────────────────────────────────────
router.post('/:id/reprice', async (req, res, next) => {
  try {
    const { id } = req.params;
    const shipRes = await query('SELECT * FROM shipments WHERE id = $1', [id]);
    if (!shipRes.rows.length) return res.status(404).json({ error: 'Shipment not found' });

    const shipRow = shipRes.rows[0];
    let payload = typeof shipRow.raw_payload === 'string' ? JSON.parse(shipRow.raw_payload) : shipRow.raw_payload;
    if (!payload) return res.status(400).json({ error: 'No raw payload available' });

    const shipmentId = await processShipmentCreatedWebhook(payload);
    
    // Fetch newly calculated charges
    const chargesRes = await query(`
      SELECT
        id, charge_type, service_name, price, cost_price, price_failure_reason, verified, billed, status
      FROM charges
      WHERE shipment_id = $1
      ORDER BY created_at ASC
    `, [shipRow.id]);

    res.json({ success: true, charges: chargesRes.rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/shipments/clear-simulated ───────────────────────────────────────
router.post('/clear-simulated', async (req, res, next) => {
  try {
    const simRes = await query("SELECT id FROM shipments WHERE raw_payload->>'simulated' = 'true'");
    const ids = simRes.rows.map(r => r.id);

    if (ids.length) {
      await query('DELETE FROM charges WHERE shipment_id = ANY($1)', [ids]);
      await query('DELETE FROM shipments WHERE id = ANY($1)', [ids]);
    }

    res.json({ success: true, count: ids.length });
  } catch (err) {
    next(err);
  }
});

export default router;
