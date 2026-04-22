/**
 * Carrier Rate Cards API
 *
 * GET  /api/carrier-rate-cards?courier_id=X       — list cards for courier
 * POST /api/carrier-rate-cards                    — create blank card
 * GET  /api/carrier-rate-cards/:id/bands          — all bands (service→zone tree)
 * PATCH /api/carrier-rate-cards/:id               — update name/date/notes
 * DELETE /api/carrier-rate-cards/:id              — delete non-master
 * POST /api/carrier-rate-cards/:id/clone          — clone card
 * POST /api/carrier-rate-cards/:id/apply-increase — clone + apply % uplift
 * POST /api/carrier-rate-cards/:id/activate       — force activate now
 * GET  /api/carrier-rate-cards/:id/export         — download CSV
 * POST /api/carrier-rate-cards/import             — create from CSV body
 * PATCH /api/carrier-rate-cards/bands/:bandId     — update a single band price
 * POST  /api/carrier-rate-cards/:id/bands         — add a band
 * DELETE /api/carrier-rate-cards/bands/:bandId    — delete a band
 */

import express from 'express';
import { query, getClient } from '../db/index.js';

const router = express.Router();

// ─── Helper: fetch a single card (with courier check) ────────
async function getCard(id) {
  const r = await query(
    `SELECT crc.*, c.name AS courier_name, c.code AS courier_code
     FROM carrier_rate_cards crc
     JOIN couriers c ON c.id = crc.courier_id
     WHERE crc.id = $1`,
    [id]
  );
  return r.rows[0] || null;
}

// ─── Auto-activation (call at startup + on interval) ─────────
export async function activateDueCarrierRateCards() {
  try {
    const due = await query(
      `SELECT id, courier_id, name FROM carrier_rate_cards
       WHERE is_active = false
         AND effective_date IS NOT NULL
         AND effective_date <= CURRENT_DATE
       ORDER BY courier_id, effective_date`
    );
    for (const card of due.rows) {
      // Deactivate other cards for this courier
      await query(
        `UPDATE carrier_rate_cards SET is_active = false, updated_at = NOW()
         WHERE courier_id = $1 AND id != $2 AND is_active = true AND is_master = false`,
        [card.courier_id, card.id]
      );
      // Activate this card
      await query(
        `UPDATE carrier_rate_cards SET is_active = true, updated_at = NOW() WHERE id = $1`,
        [card.id]
      );
      console.log(`✅ Carrier rate card "${card.name}" (id=${card.id}) auto-activated`);
    }
    if (due.rows.length === 0) {
      console.log('✅ Carrier rate card activation check: no cards due');
    }
  } catch (err) {
    console.error('❌ Carrier rate card auto-activation failed:', err.message);
  }
}

// ─── GET ?courier_id= ────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { courier_id } = req.query;
    const values = courier_id ? [courier_id] : [];
    const where  = courier_id ? 'WHERE crc.courier_id = $1' : '';

    const result = await query(
      `SELECT crc.*,
         c.name AS courier_name,
         c.code AS courier_code,
         COUNT(wb.id)::int AS band_count
       FROM carrier_rate_cards crc
       JOIN couriers c ON c.id = crc.courier_id
       LEFT JOIN zones z ON z.courier_service_id IN (
         SELECT id FROM courier_services WHERE courier_id = crc.courier_id
       )
       LEFT JOIN weight_bands wb ON wb.zone_id = z.id AND wb.carrier_rate_card_id = crc.id
       ${where}
       GROUP BY crc.id, c.id
       ORDER BY crc.courier_id, crc.is_master DESC, crc.effective_date NULLS FIRST, crc.created_at`,
      values
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── GET /:id/bands — full service→zone→band tree ────────────
router.get('/:id/bands', async (req, res, next) => {
  try {
    const card = await getCard(req.params.id);
    if (!card) return res.status(404).json({ error: 'Rate card not found' });

    const bands = await query(
      `SELECT
         cs.id AS service_id,
         cs.service_code,
         cs.name AS service_name,
         cs.service_type,
         z.id  AS zone_id,
         z.name AS zone_name,
         wb.id  AS band_id,
         wb.min_weight_kg,
         wb.max_weight_kg,
         wb.price_first,
         wb.price_sub
       FROM courier_services cs
       JOIN zones z ON z.courier_service_id = cs.id
       JOIN weight_bands wb ON wb.zone_id = z.id
       WHERE cs.courier_id = $1
         AND wb.carrier_rate_card_id = $2
       ORDER BY cs.sort_order NULLS LAST, cs.name, z.name,
                wb.min_weight_kg`,
      [card.courier_id, card.id]
    );

    // Group: service → zones → bands
    const serviceMap = {};
    for (const row of bands.rows) {
      if (!serviceMap[row.service_id]) {
        serviceMap[row.service_id] = {
          service_id:   row.service_id,
          service_code: row.service_code,
          service_name: row.service_name,
          service_type: row.service_type,
          zones: {},
        };
      }
      const svc = serviceMap[row.service_id];
      if (!svc.zones[row.zone_id]) {
        svc.zones[row.zone_id] = {
          zone_id:   row.zone_id,
          zone_name: row.zone_name,
          bands: [],
        };
      }
      svc.zones[row.zone_id].bands.push({
        band_id:       row.band_id,
        min_weight_kg: row.min_weight_kg,
        max_weight_kg: row.max_weight_kg,
        price_first:   row.price_first,
        price_sub:     row.price_sub,
      });
    }

    const services = Object.values(serviceMap).map(s => ({
      ...s,
      zones: Object.values(s.zones),
    }));

    res.json({ card, services });
  } catch (err) { next(err); }
});

// ─── POST / — create blank rate card ─────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { courier_id, name, effective_date, notes } = req.body;
    if (!courier_id) return res.status(400).json({ error: 'courier_id required' });
    if (!name?.trim()) return res.status(400).json({ error: 'name required' });

    const result = await query(
      `INSERT INTO carrier_rate_cards(courier_id, name, is_master, is_active, effective_date, notes)
       VALUES ($1, $2, false, $3, $4, $5) RETURNING *`,
      [
        courier_id,
        name.trim(),
        !effective_date || new Date(effective_date) <= new Date() ? true : false,
        effective_date || null,
        notes || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── PATCH /:id ───────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'effective_date', 'notes'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    const sets   = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([, v]) => v)];
    const r = await query(
      `UPDATE carrier_rate_cards SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Rate card not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const card = await getCard(req.params.id);
    if (!card) return res.status(404).json({ error: 'Rate card not found' });
    if (card.is_master) return res.status(400).json({ error: 'Cannot delete the Master rate card' });

    await query('DELETE FROM carrier_rate_cards WHERE id = $1', [req.params.id]);
    res.json({ deleted: true, id: parseInt(req.params.id) });
  } catch (err) { next(err); }
});

// ─── POST /:id/clone ─────────────────────────────────────────
router.post('/:id/clone', async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const card = await getCard(req.params.id);
    if (!card) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Rate card not found' }); }

    const { name, effective_date, notes } = req.body;
    if (!name?.trim()) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'name required' }); }

    const effDate = effective_date || null;
    const isActive = !effDate || new Date(effDate) <= new Date();

    // Create the new rate card
    const newCard = await client.query(
      `INSERT INTO carrier_rate_cards(courier_id, name, is_master, is_active, effective_date, notes)
       VALUES ($1, $2, false, $3, $4, $5) RETURNING *`,
      [card.courier_id, name.trim(), isActive, effDate, notes || null]
    );
    const newId = newCard.rows[0].id;

    // Clone all weight_bands from source card
    await client.query(
      `INSERT INTO weight_bands(zone_id, min_weight_kg, max_weight_kg, price_first, price_sub, carrier_rate_card_id)
       SELECT zone_id, min_weight_kg, max_weight_kg, price_first, price_sub, $2
       FROM weight_bands WHERE carrier_rate_card_id = $1`,
      [card.id, newId]
    );

    await client.query('COMMIT');
    res.status(201).json(newCard.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─── POST /:id/apply-increase — clone + % uplift ─────────────
router.post('/:id/apply-increase', async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const card = await getCard(req.params.id);
    if (!card) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Rate card not found' }); }

    const { name, pct, effective_date, notes } = req.body;
    if (!name?.trim())          { await client.query('ROLLBACK'); return res.status(400).json({ error: 'name required' }); }
    const increase = parseFloat(pct);
    if (isNaN(increase) || increase <= -100) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'pct must be a number > -100' }); }

    const multiplier = 1 + increase / 100;
    const effDate    = effective_date || null;
    const isActive   = !effDate || new Date(effDate) <= new Date();

    // Create new card
    const newCard = await client.query(
      `INSERT INTO carrier_rate_cards(courier_id, name, is_master, is_active, effective_date, notes)
       VALUES ($1, $2, false, $3, $4, $5) RETURNING *`,
      [card.courier_id, name.trim(), isActive, effDate, notes || `${increase > 0 ? '+' : ''}${increase}% from "${card.name}"`]
    );
    const newId = newCard.rows[0].id;

    // Clone bands with uplifted prices (round to 4dp)
    await client.query(
      `INSERT INTO weight_bands(zone_id, min_weight_kg, max_weight_kg, price_first, price_sub, carrier_rate_card_id)
       SELECT zone_id, min_weight_kg, max_weight_kg,
              ROUND(price_first * $3, 4),
              CASE WHEN price_sub IS NOT NULL THEN ROUND(price_sub * $3, 4) ELSE NULL END,
              $2
       FROM weight_bands WHERE carrier_rate_card_id = $1`,
      [card.id, newId, multiplier]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...newCard.rows[0], pct_applied: increase });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─── POST /:id/activate — force-activate a card now ──────────
router.post('/:id/activate', async (req, res, next) => {
  try {
    const card = await getCard(req.params.id);
    if (!card) return res.status(404).json({ error: 'Rate card not found' });
    if (card.is_master) return res.status(400).json({ error: 'Master is always active' });

    // Deactivate other non-master cards for this courier
    await query(
      `UPDATE carrier_rate_cards SET is_active = false, updated_at = NOW()
       WHERE courier_id = $1 AND id != $2 AND is_active = true AND is_master = false`,
      [card.courier_id, card.id]
    );
    const r = await query(
      `UPDATE carrier_rate_cards SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [card.id]
    );
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── GET /:id/export — CSV download ──────────────────────────
router.get('/:id/export', async (req, res, next) => {
  try {
    const card = await getCard(req.params.id);
    if (!card) return res.status(404).json({ error: 'Rate card not found' });

    const bands = await query(
      `SELECT cs.service_code, cs.name AS service_name, cs.service_type,
              z.name AS zone_name,
              wb.min_weight_kg, wb.max_weight_kg, wb.price_first, wb.price_sub
       FROM weight_bands wb
       JOIN zones z ON z.id = wb.zone_id
       JOIN courier_services cs ON cs.id = z.courier_service_id
       WHERE wb.carrier_rate_card_id = $1
       ORDER BY cs.sort_order NULLS LAST, cs.name, z.name, wb.min_weight_kg`,
      [card.id]
    );

    const header = 'service_code,service_name,service_type,zone_name,min_weight_kg,max_weight_kg,price_first,price_sub\n';
    const rows = bands.rows.map(b =>
      [
        b.service_code,
        `"${b.service_name.replace(/"/g, '""')}"`,
        b.service_type || '',
        `"${b.zone_name.replace(/"/g, '""')}"`,
        b.min_weight_kg,
        b.max_weight_kg,
        b.price_first,
        b.price_sub || '',
      ].join(',')
    ).join('\n');

    const filename = `${card.courier_code}_${card.name.replace(/[^a-z0-9]/gi, '_')}_rate_card.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(header + rows);
  } catch (err) { next(err); }
});

// ─── POST /import — create new card from CSV text body ───────
// Body: { courier_id, name, effective_date, notes, csv: "...raw csv string..." }
// CSV format: service_code,zone_name,min_weight_kg,max_weight_kg,price_first[,price_sub]
router.post('/import', async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { courier_id, name, effective_date, notes, csv } = req.body;
    if (!courier_id) return res.status(400).json({ error: 'courier_id required' });
    if (!name?.trim()) return res.status(400).json({ error: 'name required' });
    if (!csv?.trim()) return res.status(400).json({ error: 'csv required' });

    const effDate  = effective_date || null;
    const isActive = !effDate || new Date(effDate) <= new Date();

    // Create the new rate card
    const newCard = await client.query(
      `INSERT INTO carrier_rate_cards(courier_id, name, is_master, is_active, effective_date, notes)
       VALUES ($1, $2, false, $3, $4, $5) RETURNING *`,
      [courier_id, name.trim(), isActive, effDate, notes || null]
    );
    const newId = newCard.rows[0].id;

    // Parse CSV lines
    const lines = csv.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const header = lines[0].toLowerCase().replace(/\r/g, '');
    const isHeaderRow = header.startsWith('service_code') || header.startsWith('sc');
    const dataLines = isHeaderRow ? lines.slice(1) : lines;

    // Cache lookups
    const serviceCache = {};
    const zoneCache    = {};
    let imported = 0, skipped = 0;

    for (const line of dataLines) {
      // Simple CSV parse (handles quoted fields)
      const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g)
        ?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];

      const [service_code, zone_name_raw, min_kg, max_kg, price_first_raw, price_sub_raw] = cols;
      if (!service_code || !min_kg || !max_kg || !price_first_raw) { skipped++; continue; }

      const zone_name   = zone_name_raw || 'Standard';
      const price_first = parseFloat(price_first_raw);
      const price_sub   = price_sub_raw ? parseFloat(price_sub_raw) : null;
      const min_weight  = parseFloat(min_kg);
      const max_weight  = parseFloat(max_kg);

      if (isNaN(price_first) || isNaN(min_weight) || isNaN(max_weight)) { skipped++; continue; }

      // Resolve service
      const svcKey = service_code.trim().toUpperCase();
      if (!serviceCache[svcKey]) {
        const s = await client.query(
          `SELECT id FROM courier_services WHERE courier_id = $1 AND UPPER(service_code) = $2 LIMIT 1`,
          [courier_id, svcKey]
        );
        if (!s.rows.length) { skipped++; continue; }
        serviceCache[svcKey] = s.rows[0].id;
      }
      const service_id = serviceCache[svcKey];

      // Resolve or create zone
      const zoneKey = `${service_id}::${zone_name}`;
      if (!zoneCache[zoneKey]) {
        let z = await client.query(
          `SELECT id FROM zones WHERE courier_service_id = $1 AND name = $2 LIMIT 1`,
          [service_id, zone_name]
        );
        if (!z.rows.length) {
          z = await client.query(
            `INSERT INTO zones(courier_service_id, name) VALUES ($1, $2) RETURNING id`,
            [service_id, zone_name]
          );
        }
        zoneCache[zoneKey] = z.rows[0].id;
      }
      const zone_id = zoneCache[zoneKey];

      // Insert band
      await client.query(
        `INSERT INTO weight_bands(zone_id, min_weight_kg, max_weight_kg, price_first, price_sub, carrier_rate_card_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [zone_id, min_weight, max_weight, price_first, price_sub, newId]
      );
      imported++;
    }

    await client.query('COMMIT');
    res.status(201).json({ ...newCard.rows[0], imported, skipped });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─── PATCH /bands/:bandId — update a band's price ────────────
router.patch('/bands/:bandId', async (req, res, next) => {
  try {
    const { price_first, price_sub } = req.body;
    const updates = [];
    const values  = [];
    let i = 1;
    if (price_first != null) { updates.push(`price_first = $${i++}`); values.push(parseFloat(price_first)); }
    if (price_sub != null)   { updates.push(`price_sub = $${i++}`); values.push(price_sub === '' ? null : parseFloat(price_sub)); }
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    values.push(req.params.bandId);
    const r = await query(
      `UPDATE weight_bands SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Band not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── POST /:id/bands — add a band to a rate card ─────────────
router.post('/:id/bands', async (req, res, next) => {
  try {
    const { zone_id, min_weight_kg, max_weight_kg, price_first, price_sub } = req.body;
    if (!zone_id || min_weight_kg == null || max_weight_kg == null || price_first == null) {
      return res.status(400).json({ error: 'zone_id, min_weight_kg, max_weight_kg, price_first required' });
    }
    const r = await query(
      `INSERT INTO weight_bands(zone_id, min_weight_kg, max_weight_kg, price_first, price_sub, carrier_rate_card_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [zone_id, parseFloat(min_weight_kg), parseFloat(max_weight_kg),
       parseFloat(price_first), price_sub ? parseFloat(price_sub) : null, req.params.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /bands/:bandId ────────────────────────────────────
router.delete('/bands/:bandId', async (req, res, next) => {
  try {
    const r = await query('DELETE FROM weight_bands WHERE id = $1 RETURNING id', [req.params.bandId]);
    if (!r.rows.length) return res.status(404).json({ error: 'Band not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

export default router;
