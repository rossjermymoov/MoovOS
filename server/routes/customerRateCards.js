/**
 * Customer Rate Cards API
 *
 * GET  /api/customer-rate-cards?courier_id=X        — list cards for courier
 * POST /api/customer-rate-cards                     — create blank card
 * POST /api/customer-rate-cards/:id/clone           — clone a card
 * PATCH /api/customer-rate-cards/:id                — update name/notes
 * DELETE /api/customer-rate-cards/:id               — delete non-master
 *
 * GET  /api/customer-rate-cards/:id/entries         — get entries for card
 * POST /api/customer-rate-cards/:id/entries         — add entry
 * PATCH /api/customer-rate-cards/entries/:entryId   — update price
 * DELETE /api/customer-rate-cards/entries/:entryId  — delete entry
 *
 * GET  /api/customer-rate-cards/assignment/:customerId/:courierId
 * POST /api/customer-rate-cards/assignment/:customerId/:courierId
 * DELETE /api/customer-rate-cards/assignment/:customerId/:courierId
 *
 * GET /api/customer-rate-cards/for-customer/:customerId — all couriers + their assigned cards
 */

import express from 'express';
import { query, getClient } from '../db/index.js';

const router = express.Router();

// ─── GET /for-customer/:customerId ──────────────────────────
// Returns all couriers that have customer_rate_cards,
// plus which card (if any) this customer is explicitly assigned to
router.get('/for-customer/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const result = await query(
      `SELECT
         c.id AS courier_id,
         c.name AS courier_name,
         c.code AS courier_code,
         crc.id AS master_card_id,
         crc.name AS master_card_name,
         a.rate_card_id AS assigned_card_id,
         ac.name AS assigned_card_name,
         json_agg(
           jsonb_build_object('id', all_cards.id, 'name', all_cards.name, 'is_master', all_cards.is_master)
           ORDER BY all_cards.is_master DESC, all_cards.name
         ) AS available_cards
       FROM couriers c
       JOIN customer_rate_cards crc ON crc.courier_id = c.id AND crc.is_master = true
       JOIN customer_rate_cards all_cards ON all_cards.courier_id = c.id
       LEFT JOIN customer_rate_card_assignments a
         ON a.courier_id = c.id AND a.customer_id = $1
       LEFT JOIN customer_rate_cards ac ON ac.id = a.rate_card_id
       GROUP BY c.id, crc.id, a.rate_card_id, ac.name
       ORDER BY c.name`,
      [customerId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── GET ?courier_id= ────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { courier_id } = req.query;
    const where  = courier_id ? 'WHERE crc.courier_id = $1' : '';
    const values = courier_id ? [courier_id] : [];

    const result = await query(
      `SELECT crc.*,
         c.name AS courier_name,
         c.code AS courier_code,
         COUNT(e.id)::int AS entry_count
       FROM customer_rate_cards crc
       JOIN couriers c ON c.id = crc.courier_id
       LEFT JOIN customer_rate_card_entries e ON e.rate_card_id = crc.id
       ${where}
       GROUP BY crc.id, c.id
       ORDER BY crc.courier_id, crc.is_master DESC, crc.name`,
      values
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── GET /:id/entries ────────────────────────────────────────
router.get('/:id/entries', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT e.*,
         cs.service_code, cs.name AS service_name, cs.service_type,
         c.code AS courier_code
       FROM customer_rate_card_entries e
       JOIN courier_services cs ON cs.id = e.service_id
       JOIN couriers c ON c.id = cs.courier_id
       WHERE e.rate_card_id = $1
       ORDER BY cs.sort_order NULLS LAST, cs.name, e.zone_name, e.weight_class_name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── POST / — create blank card ──────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { courier_id, name, notes } = req.body;
    if (!courier_id) return res.status(400).json({ error: 'courier_id required' });
    if (!name?.trim()) return res.status(400).json({ error: 'name required' });

    const r = await query(
      `INSERT INTO customer_rate_cards(courier_id, name, is_master, notes)
       VALUES ($1, $2, false, $3) RETURNING *`,
      [courier_id, name.trim(), notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── POST /:id/clone ─────────────────────────────────────────
router.post('/:id/clone', async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const src = await client.query(
      'SELECT * FROM customer_rate_cards WHERE id = $1', [req.params.id]
    );
    if (!src.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Rate card not found' }); }
    const source = src.rows[0];

    const { name, notes } = req.body;
    if (!name?.trim()) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'name required' }); }

    const newCard = await client.query(
      `INSERT INTO customer_rate_cards(courier_id, name, is_master, notes)
       VALUES ($1, $2, false, $3) RETURNING *`,
      [source.courier_id, name.trim(), notes || null]
    );
    const newId = newCard.rows[0].id;

    // Clone all entries
    await client.query(
      `INSERT INTO customer_rate_card_entries(rate_card_id, service_id, zone_name, weight_class_name, price)
       SELECT $2, service_id, zone_name, weight_class_name, price
       FROM customer_rate_card_entries WHERE rate_card_id = $1`,
      [source.id, newId]
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

// ─── PATCH /:id ───────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'notes'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    const sets   = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([, v]) => v)];
    const r = await query(
      `UPDATE customer_rate_cards SET ${sets} WHERE id = $1 RETURNING *`, values
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Rate card not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await query('SELECT is_master FROM customer_rate_cards WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Rate card not found' });
    if (r.rows[0].is_master) return res.status(400).json({ error: 'Cannot delete the Master rate card' });

    // Check no customers are assigned
    const assigned = await query(
      'SELECT COUNT(*)::int AS n FROM customer_rate_card_assignments WHERE rate_card_id = $1',
      [req.params.id]
    );
    if (assigned.rows[0].n > 0) {
      return res.status(400).json({
        error: `${assigned.rows[0].n} customer(s) are assigned to this rate card. Re-assign them first.`
      });
    }

    await query('DELETE FROM customer_rate_cards WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─── POST /:id/entries — add an entry ────────────────────────
router.post('/:id/entries', async (req, res, next) => {
  try {
    const { service_id, zone_name, weight_class_name, price } = req.body;
    if (!service_id || !zone_name || price == null) {
      return res.status(400).json({ error: 'service_id, zone_name, price required' });
    }
    const r = await query(
      `INSERT INTO customer_rate_card_entries(rate_card_id, service_id, zone_name, weight_class_name, price)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (rate_card_id, service_id, zone_name, weight_class_name)
       DO UPDATE SET price = EXCLUDED.price
       RETURNING *`,
      [req.params.id, service_id, zone_name, weight_class_name || 'Parcel', parseFloat(price)]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── PATCH /entries/:entryId — update price ──────────────────
router.patch('/entries/:entryId', async (req, res, next) => {
  try {
    const { price } = req.body;
    if (price == null) return res.status(400).json({ error: 'price required' });
    const r = await query(
      'UPDATE customer_rate_card_entries SET price = $1 WHERE id = $2 RETURNING *',
      [parseFloat(price), req.params.entryId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Entry not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /entries/:entryId ─────────────────────────────────
router.delete('/entries/:entryId', async (req, res, next) => {
  try {
    const r = await query('DELETE FROM customer_rate_card_entries WHERE id = $1 RETURNING id', [req.params.entryId]);
    if (!r.rows.length) return res.status(404).json({ error: 'Entry not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─── GET /assignment/:customerId/:courierId ───────────────────
router.get('/assignment/:customerId/:courierId', async (req, res, next) => {
  try {
    const { customerId, courierId } = req.params;
    const r = await query(
      `SELECT a.*, crc.name AS card_name, crc.is_master
       FROM customer_rate_card_assignments a
       JOIN customer_rate_cards crc ON crc.id = a.rate_card_id
       WHERE a.customer_id = $1 AND a.courier_id = $2`,
      [customerId, courierId]
    );
    // If no assignment, return the master
    if (!r.rows.length) {
      const master = await query(
        `SELECT id, name, is_master FROM customer_rate_cards
         WHERE courier_id = $1 AND is_master = true LIMIT 1`,
        [courierId]
      );
      return res.json({ assigned: false, master: master.rows[0] || null });
    }
    res.json({ assigned: true, ...r.rows[0] });
  } catch (err) { next(err); }
});

// ─── POST /assignment/:customerId/:courierId — upsert ────────
router.post('/assignment/:customerId/:courierId', async (req, res, next) => {
  try {
    const { customerId, courierId } = req.params;
    const { rate_card_id } = req.body;
    if (!rate_card_id) return res.status(400).json({ error: 'rate_card_id required' });

    const r = await query(
      `INSERT INTO customer_rate_card_assignments(customer_id, courier_id, rate_card_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (customer_id, courier_id) DO UPDATE SET rate_card_id = EXCLUDED.rate_card_id
       RETURNING *`,
      [customerId, courierId, rate_card_id]
    );
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /assignment/:customerId/:courierId — reset to master
router.delete('/assignment/:customerId/:courierId', async (req, res, next) => {
  try {
    const { customerId, courierId } = req.params;
    await query(
      'DELETE FROM customer_rate_card_assignments WHERE customer_id = $1 AND courier_id = $2',
      [customerId, courierId]
    );
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

export default router;
