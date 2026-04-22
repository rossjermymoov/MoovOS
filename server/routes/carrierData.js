/**
 * Moov OS — Carrier Reference Data API
 *
 * Manages DC platform reference data: weight classes and zone definitions.
 * These are imported from the DC CSV exports and used by the billing engine
 * for numeric weight matching and zone-based postcode lookups.
 *
 * POST /api/carrier-data/import/weight-classes  — upsert weight class rows
 * POST /api/carrier-data/import/zones           — upsert zone rows
 * GET  /api/carrier-data/weight-classes         — list weight classes (by service)
 * GET  /api/carrier-data/zones                  — list zones (by service)
 * GET  /api/carrier-data/zone-lookup            — resolve postcode → zone name
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── POST /api/carrier-data/import/weight-classes ─────────────────────────────
// Body: { rows: [ { dc_weight_class_id, weight_class_name, courier_code,
//                   service_code, service_name, min_weight, max_weight,
//                   max_cubic_volume? } ] }
// Upserts all rows; returns { ok, inserted, updated }.

router.post('/import/weight-classes', async (req, res, next) => {
  try {
    const rows = req.body?.rows;
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ error: 'rows array required' });
    }

    let inserted = 0, updated = 0;

    for (const r of rows) {
      const id       = parseInt(r.dc_weight_class_id || r.weight_class_id, 10);
      const minW     = parseFloat(r.min_weight  ?? r.min_weight_kg  ?? 0);
      const maxW     = parseFloat(r.max_weight  ?? r.max_weight_kg  ?? 0);
      const cubic    = r.max_cubic_volume ? parseFloat(r.max_cubic_volume) : null;

      if (!id || isNaN(minW) || isNaN(maxW)) continue;

      const result = await query(`
        INSERT INTO dc_weight_classes
          (dc_weight_class_id, weight_class_name, courier_code, service_code,
           service_name, min_weight_kg, max_weight_kg, max_cubic_volume, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
        ON CONFLICT (dc_weight_class_id) DO UPDATE SET
          weight_class_name = EXCLUDED.weight_class_name,
          courier_code      = EXCLUDED.courier_code,
          service_code      = EXCLUDED.service_code,
          service_name      = EXCLUDED.service_name,
          min_weight_kg     = EXCLUDED.min_weight_kg,
          max_weight_kg     = EXCLUDED.max_weight_kg,
          max_cubic_volume  = EXCLUDED.max_cubic_volume,
          updated_at        = NOW()
        RETURNING (xmax = 0) AS is_insert
      `, [
        id,
        r.weight_class_name || null,
        r.courier_code || '',
        r.service_code || '',
        r.service_name || null,
        minW, maxW, cubic,
      ]);

      if (result.rows[0]?.is_insert) inserted++; else updated++;
    }

    // Back-fill customer_rates that now have a matching dc_weight_class_id
    await query(`
      UPDATE customer_rates cr
      SET
        min_weight_kg      = wc.min_weight_kg,
        max_weight_kg      = wc.max_weight_kg,
        dc_weight_class_id = wc.dc_weight_class_id
      FROM dc_weight_classes wc
      WHERE cr.service_code      = wc.service_code
        AND cr.weight_class_name = wc.weight_class_name
        AND cr.min_weight_kg     IS NULL
    `);

    res.json({ ok: true, inserted, updated });
  } catch (err) { next(err); }
});

// ─── POST /api/carrier-data/import/zones ──────────────────────────────────────
// Body: { rows: [ { dc_zone_id, zone_name, courier_code, service_code,
//                   service_name, iso, included_post_codes, excluded_post_codes } ] }
// Upserts on (dc_zone_id, iso).

router.post('/import/zones', async (req, res, next) => {
  try {
    const rows = req.body?.rows;
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ error: 'rows array required' });
    }

    let inserted = 0, updated = 0;

    for (const r of rows) {
      const dcZoneId = parseInt(r.dc_zone_id || r.zone_id, 10);
      const iso      = (r.iso || '').trim().toUpperCase();

      if (!dcZoneId || !iso) continue;

      // Parse comma-separated postcode lists into arrays, trimming each entry
      const parsePostcodes = (raw) => {
        if (!raw) return null;
        const arr = String(raw).split(',').map(p => p.trim()).filter(Boolean);
        return arr.length ? arr : null;
      };

      const included = parsePostcodes(r.included_post_codes ?? r.included_postcodes);
      const excluded = parsePostcodes(r.excluded_post_codes ?? r.excluded_postcodes);

      const result = await query(`
        INSERT INTO dc_zones
          (dc_zone_id, zone_name, courier_code, service_code, service_name,
           iso, included_postcodes, excluded_postcodes, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
        ON CONFLICT (dc_zone_id, iso) DO UPDATE SET
          zone_name          = EXCLUDED.zone_name,
          courier_code       = EXCLUDED.courier_code,
          service_code       = EXCLUDED.service_code,
          service_name       = EXCLUDED.service_name,
          included_postcodes = EXCLUDED.included_postcodes,
          excluded_postcodes = EXCLUDED.excluded_postcodes,
          updated_at         = NOW()
        RETURNING (xmax = 0) AS is_insert
      `, [
        dcZoneId,
        r.zone_name || '',
        r.courier_code || '',
        r.service_code || '',
        r.service_name || null,
        iso,
        included,
        excluded,
      ]);

      if (result.rows[0]?.is_insert) inserted++; else updated++;
    }

    res.json({ ok: true, inserted, updated });
  } catch (err) { next(err); }
});

// ─── GET /api/carrier-data/weight-classes ────────────────────────────────────
// ?service_code=DPD-12&courier_code=DPD
// Returns all weight bands for a service, ordered by min weight.

router.get('/weight-classes', async (req, res, next) => {
  try {
    const { service_code, courier_code } = req.query;
    const conditions = [];
    const params = [];

    if (service_code) { params.push(service_code); conditions.push(`service_code = $${params.length}`); }
    if (courier_code) { params.push(courier_code); conditions.push(`courier_code = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT * FROM dc_weight_classes ${where} ORDER BY service_code, min_weight_kg`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── GET /api/carrier-data/zones ─────────────────────────────────────────────
// ?service_code=DPD-12&courier_code=DPD
// Returns all zone definitions for a service.

router.get('/zones', async (req, res, next) => {
  try {
    const { service_code, courier_code } = req.query;
    const conditions = [];
    const params = [];

    if (service_code) { params.push(service_code); conditions.push(`service_code = $${params.length}`); }
    if (courier_code) { params.push(courier_code); conditions.push(`courier_code = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT * FROM dc_zones ${where} ORDER BY zone_name, iso`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── GET /api/carrier-data/zone-lookup ────────────────────────────────────────
// ?service_code=DPD-12&postcode=FK21&iso=GB
//
// Resolves a destination postcode area to a zone name.
// Priority: zones with included_postcodes matched first (specific zones like
// Highlands), then zones with only excluded_postcodes (catch-all like Mainland).

router.get('/zone-lookup', async (req, res, next) => {
  try {
    const { service_code, postcode, iso = 'GB' } = req.query;
    if (!service_code || !postcode) {
      return res.status(400).json({ error: 'service_code and postcode required' });
    }

    // Normalise postcode: extract the area prefix (e.g. "FK21 3HJ" → "FK21", "B1 1AB" → "B1")
    const area = postcode.trim().toUpperCase().split(/\s/)[0];

    // Load all zones for this service + ISO
    const zonesRes = await query(`
      SELECT zone_name, included_postcodes, excluded_postcodes
      FROM dc_zones
      WHERE service_code = $1 AND iso = $2
    `, [service_code, iso.toUpperCase()]);

    const zones = zonesRes.rows;

    // Step 1: check zones that have an explicit included_postcodes list
    for (const z of zones) {
      if (z.included_postcodes?.length) {
        if (z.included_postcodes.includes(area)) {
          return res.json({ zone_name: z.zone_name, matched_by: 'included_postcodes' });
        }
      }
    }

    // Step 2: check catch-all zones (included = null, excluded = list of postcodes to skip)
    for (const z of zones) {
      if (!z.included_postcodes?.length) {
        const excluded = z.excluded_postcodes || [];
        if (!excluded.includes(area)) {
          return res.json({ zone_name: z.zone_name, matched_by: 'excluded_postcodes' });
        }
      }
    }

    // No match found
    res.json({ zone_name: null, matched_by: null });
  } catch (err) { next(err); }
});

// ─── GET /api/carrier-data/services ──────────────────────────────────────────
// Returns distinct courier/service combinations that have DC data imported.

router.get('/services', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT DISTINCT courier_code, service_code, service_name
      FROM dc_weight_classes
      ORDER BY courier_code, service_name
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

export default router;
