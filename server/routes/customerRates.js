/**
 * Customer Rates API
 *
 * GET    /api/customer-rates/:customerId              — all rates grouped by courier → service
 * PATCH  /api/customer-rates/rate/:rateId             — update a single rate's price and/or price_sub
 * DELETE /api/customer-rates/rate/:rateId             — delete a single rate row
 * POST   /api/customer-rates/:customerId              — add a new rate row for a customer
 * POST   /api/customer-rates/:customerId/sub-rates    — bulk apply sub rates by service_code + zone_name
 * POST   /api/customer-rates/:customerId/apply-markup — bulk delete + re-insert all zones at markup % from carrier card
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── PATCH /rate/:rateId — update price, price_sub, and/or per_kg fields ──────
router.patch('/rate/:rateId', async (req, res, next) => {
  try {
    const { rateId } = req.params;
    const { price, price_sub, per_kg_rate, per_kg_threshold_kg } = req.body;

    if (price == null && price_sub === undefined && per_kg_rate === undefined && per_kg_threshold_kg === undefined) {
      return res.status(400).json({ error: 'price, price_sub, per_kg_rate, or per_kg_threshold_kg is required' });
    }

    const sets   = [];
    const values = [];

    if (price != null) {
      values.push(parseFloat(price));
      sets.push(`price = $${values.length}`);
    }
    if (price_sub !== undefined) {
      // Allow explicit null to clear a sub price
      values.push(price_sub === null ? null : parseFloat(price_sub));
      sets.push(`price_sub = $${values.length}`);
    }
    if (per_kg_rate !== undefined) {
      // Allow explicit null to clear per-kg rate
      values.push(per_kg_rate === null ? null : parseFloat(per_kg_rate));
      sets.push(`per_kg_rate = $${values.length}`);
    }
    if (per_kg_threshold_kg !== undefined) {
      values.push(per_kg_threshold_kg === null ? null : parseFloat(per_kg_threshold_kg));
      sets.push(`per_kg_threshold_kg = $${values.length}`);
    }

    values.push(rateId);
    const result = await query(
      `UPDATE customer_rates SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rate not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /rate/:rateId — remove a rate row ─────────────────
router.delete('/rate/:rateId', async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM customer_rates WHERE id = $1 RETURNING id`,
      [req.params.rateId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rate not found' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) { next(err); }
});

// ─── POST /:customerId — add a new rate ───────────────────────
router.post('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const {
      courier_id = 0, courier_code = '', courier_name = '',
      service_id, service_code = '', service_name = '',
      zone_name, weight_class_name = 'Parcel',
      price, price_sub = null,
    } = req.body;

    if (!service_id || !zone_name || price == null) {
      return res.status(400).json({ error: 'service_id, zone_name, and price are required' });
    }

    // Normalise weight_class_name to lowercase so that uppercase variants (e.g.
    // "0-0.5KG" from old client code) never create duplicate rows.  The unique
    // constraint on (customer_id, service_id, zone_name, weight_class_name) is
    // case-sensitive, so without this normalisation an uppercase submission would
    // create a phantom duplicate alongside any existing lowercase row.
    const normWeightClassName = typeof weight_class_name === 'string'
      ? weight_class_name.toLowerCase()
      : weight_class_name;

    // Resolve numeric weight bounds for this band.
    //
    // Strategy (first match wins):
    //   1. dc_weight_classes — for bands stored in the old DC platform name format
    //   2. weight_bands table — for services whose zones/bands are defined in the
    //      carrier rate card (domestic DPD, Yodel, etc.)
    //   3. Parse weight_class_name directly — bandLabel() format is "0-2KG", "2-5KG",
    //      "10KG+" etc., so we can extract bounds reliably when neither table matches.
    //
    // Without numeric bounds, rateCoversWeight() treats every row as a catch-all and
    // the billing engine can pick the wrong (more expensive) band.

    let resolvedMin = null;
    let resolvedMax = null;

    // 1. dc_weight_classes
    const wcRes = await query(
      `SELECT min_weight_kg, max_weight_kg
       FROM dc_weight_classes
       WHERE service_code = $1 AND weight_class_name = $2
       LIMIT 1`,
      [service_code, normWeightClassName]
    );
    if (wcRes.rows[0]) {
      resolvedMin = wcRes.rows[0].min_weight_kg;
      resolvedMax = wcRes.rows[0].max_weight_kg;
    }

    // 2. weight_bands for this service + zone
    if (resolvedMin == null && resolvedMax == null && zone_name) {
      const wbRes = await query(
        `SELECT wb.min_weight_kg, wb.max_weight_kg
         FROM weight_bands wb
         JOIN zones z             ON z.id  = wb.zone_id
         JOIN courier_services cs ON cs.id = z.courier_service_id
         WHERE cs.service_code ILIKE $1
           AND z.name          ILIKE $2
           AND (
             -- Match by wb.name (e.g. 'Medium Bagit', 'Parcel', 'Small Bagit')
             (wb.name IS NOT NULL AND wb.name NOT IN ('None','') AND wb.name ILIKE $3)
             OR
             -- Match by numeric bounds derived from the bandLabel name (e.g. '0-2KG')
             (wb.min_weight_kg IS NOT NULL AND wb.max_weight_kg IS NOT NULL AND
              CONCAT(
                CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
                     THEN floor(wb.min_weight_kg)::int::text
                     ELSE round(wb.min_weight_kg::numeric,1)::text END,
                '-',
                CASE WHEN wb.max_weight_kg = floor(wb.max_weight_kg)
                     THEN floor(wb.max_weight_kg)::int::text
                     ELSE round(wb.max_weight_kg::numeric,1)::text END,
                'KG'
              ) ILIKE $3)
             OR
             (wb.max_weight_kg IS NULL AND
              CONCAT(
                CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
                     THEN floor(wb.min_weight_kg)::int::text
                     ELSE round(wb.min_weight_kg::numeric,1)::text END,
                'KG+'
              ) ILIKE $3)
           )
         LIMIT 1`,
        [service_code, zone_name, normWeightClassName]
      );
      if (wbRes.rows[0]) {
        resolvedMin = wbRes.rows[0].min_weight_kg;
        resolvedMax = wbRes.rows[0].max_weight_kg;
      }
    }

    // 3. Parse bandLabel format directly: "0-2kg", "2-5kg", "10kg+"
    if (resolvedMin == null && resolvedMax == null) {
      const rangeMatch = normWeightClassName.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)kg$/i);
      const openMatch  = normWeightClassName.match(/^(\d+(?:\.\d+)?)kg\+$/i);
      if (rangeMatch) {
        resolvedMin = parseFloat(rangeMatch[1]);
        resolvedMax = parseFloat(rangeMatch[2]);
      } else if (openMatch) {
        resolvedMin = parseFloat(openMatch[1]);
        resolvedMax = null; // open-ended upper band
      }
    }

    const result = await query(`
      INSERT INTO customer_rates
        (customer_id, courier_id, courier_code, courier_name,
         service_id, service_code, service_name,
         zone_name, weight_class_name,
         min_weight_kg, max_weight_kg,
         price, price_sub)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
      DO UPDATE SET
        price             = EXCLUDED.price,
        price_sub         = EXCLUDED.price_sub,
        min_weight_kg     = COALESCE(customer_rates.min_weight_kg, EXCLUDED.min_weight_kg),
        max_weight_kg     = COALESCE(customer_rates.max_weight_kg, EXCLUDED.max_weight_kg)
      RETURNING *
    `, [customerId, courier_id, courier_code, courier_name,
        service_id, service_code, service_name,
        zone_name, normWeightClassName,
        resolvedMin ?? null, resolvedMax ?? null,
        parseFloat(price),
        price_sub != null ? parseFloat(price_sub) : null]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── POST /:customerId/apply-markup — bulk delete + re-insert from carrier ────
//
// The "Apply to all zones" operation.  Runs as a single DB transaction:
//   1. Delete ALL existing customer_rates rows for (customer, service_code).
//   2. Walk every (zone, weight_band) in the carrier rate card and insert a new row
//      with price = carrier_price_first × (1 + markup_pct / 100).
//
// Body: {
//   service_code          — e.g. "DPD-60DDP"
//   service_id            — legacy billing ID (stored in customer_rates.service_id)
//   service_name          — display name
//   courier_id            — couriers.id for this service
//   courier_code          — e.g. "DPD"
//   courier_name          — e.g. "DPD"
//   carrier_rate_card_id  — which carrier_rate_cards row to source prices from
//   markup_pct            — e.g. 10 (meaning 10 %)
// }
// Returns: { deleted, inserted, zones, weight_classes }
router.post('/:customerId/apply-markup', async (req, res, next) => {
  const client = await (await import('../db/index.js')).getClient();
  try {
    const { customerId } = req.params;
    const {
      service_code, service_id, service_name,
      courier_id = 0, courier_code = '', courier_name = '',
      carrier_rate_card_id,
      markup_pct,
    } = req.body;

    if (!service_code || !service_id || carrier_rate_card_id == null || markup_pct == null) {
      return res.status(400).json({ error: 'service_code, service_id, carrier_rate_card_id, and markup_pct are required' });
    }

    const pct = parseFloat(markup_pct);
    if (isNaN(pct) || pct < 0) {
      return res.status(400).json({ error: 'markup_pct must be a non-negative number' });
    }
    const multiplier = 1 + pct / 100;

    // Fetch all (zone, band) pairs from the carrier rate card for this service.
    // Band name: use wb.name when meaningful, otherwise compute from min/max (same
    // logic as GET /zones/:serviceCode so labels stay consistent everywhere).
    const bandsRes = await client.query(`
      SELECT
        z.name  AS zone_name,
        CASE
          WHEN wb.name IS NOT NULL AND wb.name NOT IN ('None', '') THEN wb.name
          WHEN wb.max_weight_kg IS NOT NULL THEN
            (CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
                  THEN floor(wb.min_weight_kg)::int::text
                  ELSE round(wb.min_weight_kg::numeric, 1)::text END)
            || '-' ||
            (CASE WHEN wb.max_weight_kg = floor(wb.max_weight_kg)
                  THEN floor(wb.max_weight_kg)::int::text
                  ELSE round(wb.max_weight_kg::numeric, 1)::text END)
            || 'kg'
          ELSE
            (CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
                  THEN floor(wb.min_weight_kg)::int::text
                  ELSE round(wb.min_weight_kg::numeric, 1)::text END)
            || 'kg+'
        END                   AS weight_class_name,
        wb.min_weight_kg,
        wb.max_weight_kg,
        wb.price_first,
        wb.price_sub
      FROM courier_services cs
      JOIN zones       z  ON z.courier_service_id = cs.id
      JOIN weight_bands wb ON wb.zone_id = z.id
      WHERE cs.service_code ILIKE $1
        AND wb.carrier_rate_card_id = $2
      ORDER BY z.name, wb.min_weight_kg
    `, [service_code, carrier_rate_card_id]);

    if (!bandsRes.rows.length) {
      return res.status(404).json({ error: `No carrier bands found for ${service_code} on rate card ${carrier_rate_card_id}` });
    }

    await client.query('BEGIN');

    // 1. Delete all existing customer rates for this service
    const delRes = await client.query(
      `DELETE FROM customer_rates WHERE customer_id = $1 AND service_code = $2`,
      [customerId, service_code]
    );
    const deleted = delRes.rowCount;

    // 2. Bulk-insert new rates
    let inserted = 0;
    for (const band of bandsRes.rows) {
      const sellPrice = parseFloat((parseFloat(band.price_first) * multiplier).toFixed(2));
      const sellSub   = band.price_sub != null
        ? parseFloat((parseFloat(band.price_sub) * multiplier).toFixed(2))
        : null;

      await client.query(`
        INSERT INTO customer_rates
          (customer_id, courier_id, courier_code, courier_name,
           service_id, service_code, service_name,
           zone_name, weight_class_name,
           min_weight_kg, max_weight_kg,
           price, price_sub)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
        DO UPDATE SET
          price         = EXCLUDED.price,
          price_sub     = EXCLUDED.price_sub,
          min_weight_kg = COALESCE(customer_rates.min_weight_kg, EXCLUDED.min_weight_kg),
          max_weight_kg = COALESCE(customer_rates.max_weight_kg, EXCLUDED.max_weight_kg)
      `, [
        customerId,
        courier_id, courier_code, courier_name,
        service_id, service_code, service_name,
        band.zone_name, band.weight_class_name,
        band.min_weight_kg, band.max_weight_kg,
        sellPrice, sellSub,
      ]);
      inserted++;
    }

    await client.query('COMMIT');

    const zones         = new Set(bandsRes.rows.map(b => b.zone_name)).size;
    const weight_classes = new Set(bandsRes.rows.map(b => b.weight_class_name)).size;

    res.json({ deleted, inserted, zones, weight_classes });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// ─── POST /:customerId/sub-rates — bulk apply sub rates ───────
//
// Accepts an array of { service_code, zone_name, price_sub } objects.
// Updates matching customer_rates rows for this customer.
// Useful when loading sub rates from a rate card PDF or CSV.
//
// Body: { rates: [ { service_code, zone_name, price_sub } ] }
// Returns: { updated, not_found }
router.post('/:customerId/sub-rates', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { rates } = req.body;

    if (!Array.isArray(rates) || !rates.length) {
      return res.status(400).json({ error: 'rates array required' });
    }

    let updated = 0;
    const not_found = [];

    for (const row of rates) {
      const { service_code, zone_name, price_sub } = row;
      if (!service_code || !zone_name || price_sub == null) continue;

      const result = await query(
        `UPDATE customer_rates
         SET price_sub = $1
         WHERE customer_id = $2
           AND service_code = $3
           AND zone_name    = $4
         RETURNING id`,
        [parseFloat(price_sub), customerId, service_code, zone_name]
      );

      if (result.rows.length) {
        updated += result.rows.length;
      } else {
        not_found.push({ service_code, zone_name });
      }
    }

    res.json({ updated, not_found });
  } catch (err) { next(err); }
});

// ─── GET /zones/:serviceCode — zone/weight-band template ─────
// Returns the distinct (zone_name, weight_class_name) pairs for a service.
// Primary source: existing customer_rates rows across ALL customers (used when
// the service already has rates set up for at least one customer).
// Fallback: zones table (linked via courier_services) with a default "Parcel"
// weight class — used for brand-new services that have never had customer rates.
// Must be declared BEFORE /:customerId so Express does not treat "zones" as an id.
router.get('/zones/:serviceCode', async (req, res, next) => {
  try {
    const { serviceCode } = req.params;

    // Primary: weight_bands table — the authoritative source for domestic services.
    // Each zone can have multiple bands (2KG, 5KG, 10KG…) stored here.
    // Returns one row per (zone, band). Uses wb.name when meaningful (not null/'None'/empty),
    // otherwise falls back to the computed bandLabel format ("0-2KG", "2-5KG", "10KG+").
    // This ensures the template label matches what gets stored in customer_rates, so the
    // POST resolution logic can always resolve min/max bounds from the band name.
    // Groups across all carrier rate cards so the template is card-agnostic.
    const weightBandResult = await query(`
      SELECT
        z.name AS zone_name,
        CASE
          WHEN MAX(wb.name) IS NOT NULL AND MAX(wb.name) NOT IN ('None', '') THEN MAX(wb.name)
          WHEN wb.max_weight_kg IS NOT NULL THEN
            (CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
                  THEN floor(wb.min_weight_kg)::int::text
                  ELSE round(wb.min_weight_kg::numeric, 1)::text END)
            || '-' ||
            (CASE WHEN wb.max_weight_kg = floor(wb.max_weight_kg)
                  THEN floor(wb.max_weight_kg)::int::text
                  ELSE round(wb.max_weight_kg::numeric, 1)::text END)
            || 'kg'
          ELSE
            (CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
                  THEN floor(wb.min_weight_kg)::int::text
                  ELSE round(wb.min_weight_kg::numeric, 1)::text END)
            || 'kg+'
        END                               AS weight_class_name,
        BOOL_OR(wb.price_sub IS NOT NULL) AS has_sub_price,
        MIN(wb.min_weight_kg)             AS sort_weight
      FROM courier_services cs
      JOIN zones      z  ON z.courier_service_id = cs.id
      JOIN weight_bands wb ON wb.zone_id = z.id
      WHERE cs.service_code ILIKE $1
      GROUP BY z.name, wb.min_weight_kg, wb.max_weight_kg
      ORDER BY z.name, MIN(wb.min_weight_kg)
    `, [serviceCode]);

    if (weightBandResult.rows.length > 0) {
      return res.json(weightBandResult.rows.map(({ sort_weight, ...rest }) => rest));
    }

    // Secondary: existing customer_rates for this service (any customer).
    // Used for international services where zones are stored directly in
    // customer_rates — no weight_bands table entries exist for these.
    const ratesResult = await query(`
      SELECT   zone_name, weight_class_name,
               BOOL_OR(price_sub IS NOT NULL) AS has_sub_price
      FROM     customer_rates
      WHERE    service_code ILIKE $1
      GROUP BY zone_name, weight_class_name
      ORDER BY zone_name, weight_class_name
    `, [serviceCode]);

    if (ratesResult.rows.length > 0) {
      return res.json(ratesResult.rows);
    }

    // Fallback: zones defined for this service in the zones table.
    // These are the zones the user added via Carriers → service → Zones.
    // Weight class defaults to "Parcel" since no rate history exists yet.
    const zonesResult = await query(`
      SELECT   z.name AS zone_name,
               'Parcel' AS weight_class_name,
               false    AS has_sub_price
      FROM     zones z
      JOIN     courier_services cs ON cs.id = z.courier_service_id
      WHERE    cs.service_code ILIKE $1
      ORDER BY z.name
    `, [serviceCode]);

    res.json(zonesResult.rows);
  } catch (err) { next(err); }
});

// ─── GET /:customerId — rates grouped by courier → service ────
router.get('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    // Service summary with rate counts + service_type from courier_services.
    // JOIN to couriers to get the *current* canonical courier name — the stored
    // cr.courier_name can be stale (set at row-creation time) and may differ between
    // services added at different points, causing them to split into separate groups.
    const summaryRes = await query(`
      SELECT
        cr.courier_id,
        COALESCE(c.code,  cr.courier_code) AS courier_code,
        COALESCE(c.name,  cr.courier_name) AS courier_name,
        cr.service_id, cr.service_code, cr.service_name,
        COUNT(*) AS rate_count,
        COALESCE(cs.service_type::text, 'domestic') AS service_type,
        BOOL_OR(cr.price_sub IS NOT NULL) AS has_sub_rates
      FROM customer_rates cr
      LEFT JOIN courier_services cs  ON cs.service_code = cr.service_code
      LEFT JOIN couriers          c  ON c.id = cs.courier_id
      WHERE cr.customer_id = $1
      GROUP BY cr.courier_id,
               COALESCE(c.code,  cr.courier_code),
               COALESCE(c.name,  cr.courier_name),
               cr.service_id, cr.service_code, cr.service_name, cs.service_type
      ORDER BY COALESCE(c.name, cr.courier_name), cr.service_name
    `, [customerId]);

    // Also include services the customer has selected (customer_services) but hasn't
    // priced yet — so they appear in the UI with 0 rates, ready for markup application.
    // Only fetches services NOT already covered by customer_rates above.
    const existingCodes = new Set(summaryRes.rows.map(r => r.service_code));
    const unPricedRes = await query(`
      SELECT
        co.id   AS courier_id,
        co.code AS courier_code,
        co.name AS courier_name,
        -- Fall back to courier_services.id as the legacy service_id when no rates exist
        COALESCE(
          (SELECT cr2.service_id FROM customer_rates cr2
           WHERE cr2.service_code = cs.service_code LIMIT 1),
          cs.id
        ) AS service_id,
        cs.service_code,
        cs.name         AS service_name,
        0               AS rate_count,
        cs.service_type::text AS service_type,
        false           AS has_sub_rates
      FROM customer_services cust_svc
      JOIN courier_services cs ON cs.id = cust_svc.courier_service_id
      JOIN couriers         co ON co.id = cs.courier_id
      WHERE cust_svc.customer_id = $1
        AND cs.service_type = 'international'
      ORDER BY co.name, cs.name
    `, [customerId]);

    // Merge: add unpriced services that aren't already represented
    const allSummaryRows = [
      ...summaryRes.rows,
      ...unPricedRes.rows.filter(r => !existingCodes.has(r.service_code)),
    ];

    // All rate rows (include id, price_sub for edit/delete)
    // Sort weight bands numerically by extracting the leading number from the
    // weight_class_name (e.g. "2KG"→2, "5KG"→5, "10KG"→10) so that "2KG" sorts
    // before "5KG" before "10KG", rather than alphabetically ("10KG" first).
    const ratesRes = await query(`
      SELECT id, service_id, zone_name, weight_class_name, price, price_sub,
             per_kg_rate, per_kg_threshold_kg
      FROM customer_rates
      WHERE customer_id = $1
      ORDER BY
        zone_name,
        CASE
          WHEN weight_class_name ~ '^[0-9]' THEN
            (regexp_replace(weight_class_name, '[^0-9.].*$', '', ''))::numeric
          ELSE NULL
        END NULLS LAST,
        weight_class_name
    `, [customerId]);

    // Group rates by service_id
    const ratesByService = {};
    for (const row of ratesRes.rows) {
      if (!ratesByService[row.service_id]) ratesByService[row.service_id] = [];
      ratesByService[row.service_id].push({
        id:                  row.id,
        zone_name:           row.zone_name,
        weight_class_name:   row.weight_class_name,
        price:               row.price,
        price_sub:           row.price_sub,
        per_kg_rate:         row.per_kg_rate,
        per_kg_threshold_kg: row.per_kg_threshold_kg,
      });
    }

    const services = allSummaryRows.map(s => ({
      courier_id:    s.courier_id,
      courier_code:  s.courier_code,
      courier_name:  s.courier_name,
      service_id:    s.service_id,
      service_code:  s.service_code,
      service_name:  s.service_name,
      service_type:  s.service_type,
      rate_count:    parseInt(s.rate_count),
      has_sub_rates: s.has_sub_rates,
      rates:         ratesByService[s.service_id] || [],
    }));

    res.json({
      services,
      total_rates: services.reduce((a, s) => a + s.rate_count, 0),
    });
  } catch (err) { next(err); }
});

export default router;
