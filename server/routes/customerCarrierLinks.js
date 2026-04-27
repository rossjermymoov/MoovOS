/**
 * Customer Carrier Links API
 *
 * Manages which carriers a customer is linked to and which rate card they use.
 * Also exposes fuel group pricing per customer.
 *
 * GET    /api/customer-carrier-links/:customerId
 *   Returns all couriers in the system with:
 *   - active: true/false (whether customer has a link)
 *   - carrier_rate_card_id + rate_card_name (their active card, or master default)
 *   - available_rate_cards[] (all cards for that courier)
 *   - fuel_groups[] (with cost %, standard_sell_pct, customer sell_pct if set)
 *
 * POST   /api/customer-carrier-links/:customerId
 *   body: { courier_id }
 *   Activates a carrier for the customer using the master rate card.
 *
 * PATCH  /api/customer-carrier-links/:customerId/:courierId
 *   body: { carrier_rate_card_id }
 *   Changes the rate card for an active carrier link.
 *
 * DELETE /api/customer-carrier-links/:customerId/:courierId
 *   Removes the carrier link (deactivates carrier for customer).
 *
 * PUT    /api/customer-carrier-links/:customerId/fuel/:fuelGroupId
 *   body: { sell_pct }
 *   Upserts a customer-specific fuel % for a fuel group.
 *
 * DELETE /api/customer-carrier-links/:customerId/fuel/:fuelGroupId
 *   Removes the customer fuel override (revert to standard_sell_pct).
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── GET /:customerId ─────────────────────────────────────────────────────────
// All couriers, with active flag and fuel group pricing details.

router.get('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    // All couriers with their master rate card and any existing customer link
    const carriersRes = await query(`
      SELECT
        c.id           AS courier_id,
        c.name         AS courier_name,
        c.code         AS courier_code,
        mc.id          AS master_card_id,
        mc.name        AS master_card_name,
        ccl.id             AS link_id,
        ccl.carrier_rate_card_id AS active_card_id,
        ccl.account_number AS account_number,
        arc.name           AS active_card_name,
        json_agg(
          jsonb_build_object('id', ac.id, 'name', ac.name, 'is_master', ac.is_master)
          ORDER BY ac.is_master DESC, ac.name
        ) FILTER (WHERE ac.id IS NOT NULL) AS available_cards
      FROM couriers c
      LEFT JOIN carrier_rate_cards mc  ON mc.courier_id = c.id AND mc.is_master = true
      LEFT JOIN carrier_rate_cards ac  ON ac.courier_id = c.id
      LEFT JOIN customer_carrier_links ccl
             ON ccl.courier_id = c.id AND ccl.customer_id = $1
      LEFT JOIN carrier_rate_cards arc ON arc.id = ccl.carrier_rate_card_id
      GROUP BY c.id, c.name, c.code, mc.id, mc.name, ccl.id, ccl.carrier_rate_card_id, arc.name
      ORDER BY c.name
    `, [customerId]);

    // Fuel groups for all couriers, with cost % and standard sell %
    const fuelRes = await query(`
      SELECT
        fg.id,
        fg.courier_id,
        fg.name,
        fg.fuel_surcharge_pct  AS cost_pct,
        fg.standard_sell_pct,
        cfgp.sell_pct          AS customer_pct,
        cfgp.id                AS customer_pricing_id
      FROM fuel_groups fg
      LEFT JOIN customer_fuel_group_pricing cfgp
             ON cfgp.fuel_group_id = fg.id AND cfgp.customer_id = $1
      ORDER BY fg.courier_id, fg.name
    `, [customerId]);

    // Index fuel groups by courier_id
    const fuelByCourier = {};
    for (const fg of fuelRes.rows) {
      if (!fuelByCourier[fg.courier_id]) fuelByCourier[fg.courier_id] = [];
      fuelByCourier[fg.courier_id].push(fg);
    }

    const result = carriersRes.rows.map(row => ({
      courier_id:    row.courier_id,
      courier_name:  row.courier_name,
      courier_code:  row.courier_code,
      active:        !!row.link_id,
      account_number:   row.account_number ?? null,
      master_card_id:   row.master_card_id,
      master_card_name: row.master_card_name,
      active_card_id:   row.active_card_id ?? row.master_card_id,
      active_card_name: row.active_card_name ?? row.master_card_name,
      available_cards:  row.available_cards ?? [],
      fuel_groups:      fuelByCourier[row.courier_id] ?? [],
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// ─── POST /:customerId — activate a carrier ───────────────────────────────────

router.post('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { courier_id } = req.body;
    if (!courier_id) return res.status(400).json({ error: 'courier_id required' });

    // Find master card for this courier — create one if it doesn't exist yet
    let masterRes = await query(
      'SELECT id FROM carrier_rate_cards WHERE courier_id = $1 AND is_master = true LIMIT 1',
      [courier_id]
    );
    if (!masterRes.rows.length) {
      masterRes = await query(
        'INSERT INTO carrier_rate_cards (courier_id, name, is_master, is_active) VALUES ($1, $2, true, true) RETURNING *',
        [courier_id, 'Master']
      );
    }

    const { rows } = await query(`
      INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (customer_id, courier_id) DO NOTHING
      RETURNING *
    `, [customerId, courier_id, masterRes.rows[0].id]);

    res.status(201).json(rows[0] ?? { already_active: true });
  } catch (err) { next(err); }
});

// ─── PATCH /:customerId/:courierId — change rate card and/or account number ──

router.patch('/:customerId/:courierId', async (req, res, next) => {
  try {
    const { customerId, courierId } = req.params;
    const { carrier_rate_card_id, account_number } = req.body;

    if (carrier_rate_card_id == null && account_number === undefined) {
      return res.status(400).json({ error: 'carrier_rate_card_id or account_number required' });
    }

    // Build SET clause dynamically — only update what was provided
    const sets   = ['updated_at = NOW()'];
    const params = [customerId, courierId];

    if (carrier_rate_card_id != null) {
      params.push(carrier_rate_card_id);
      sets.push(`carrier_rate_card_id = $${params.length}`);
    }
    if (account_number !== undefined) {
      // Empty string → NULL (clear the account number)
      params.push(account_number === '' ? null : account_number.trim());
      sets.push(`account_number = $${params.length}`);
    }

    const { rows } = await query(`
      UPDATE customer_carrier_links
      SET ${sets.join(', ')}
      WHERE customer_id = $1 AND courier_id = $2
      RETURNING *
    `, params);

    if (!rows.length) return res.status(404).json({ error: 'Carrier link not found — activate carrier first' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /:customerId/:courierId — deactivate carrier ─────────────────────

router.delete('/:customerId/:courierId', async (req, res, next) => {
  try {
    await query(
      'DELETE FROM customer_carrier_links WHERE customer_id = $1 AND courier_id = $2',
      [req.params.customerId, req.params.courierId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── PUT /:customerId/fuel/:fuelGroupId — set customer fuel % ────────────────

router.put('/:customerId/fuel/:fuelGroupId', async (req, res, next) => {
  try {
    const { customerId, fuelGroupId } = req.params;
    const { sell_pct } = req.body;
    if (sell_pct == null) return res.status(400).json({ error: 'sell_pct required' });

    const { rows } = await query(`
      INSERT INTO customer_fuel_group_pricing (customer_id, fuel_group_id, sell_pct)
      VALUES ($1, $2, $3)
      ON CONFLICT (customer_id, fuel_group_id)
      DO UPDATE SET sell_pct = $3, updated_at = NOW()
      RETURNING *
    `, [customerId, fuelGroupId, parseFloat(sell_pct)]);

    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /:customerId/fuel/:fuelGroupId — remove customer fuel override ───

router.delete('/:customerId/fuel/:fuelGroupId', async (req, res, next) => {
  try {
    await query(
      'DELETE FROM customer_fuel_group_pricing WHERE customer_id = $1 AND fuel_group_id = $2',
      [req.params.customerId, req.params.fuelGroupId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
