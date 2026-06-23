/**
 * Customer Carrier Links API
 *
 * Manages which carriers a customer is linked to and which rate card they use.
 * Supports multiple accounts per carrier (e.g. Oriental Mart has a Perishable
 * and a Standard DPD account — both at the same rate, different account numbers).
 *
 * GET    /api/customer-carrier-links/:customerId
 *   Returns all couriers in the system.  Each courier that has at least one link
 *   has active=true.  Accounts are returned as an array so multi-account customers
 *   show all rows.
 *
 * POST   /api/customer-carrier-links/:customerId
 *   body: { courier_id, account_number?, label?, carrier_rate_card_id? }
 *   Adds a carrier link (new account).  Always inserts a new row — use this for
 *   both first activation and adding a second account for the same carrier.
 *
 * PATCH  /api/customer-carrier-links/:customerId/link/:linkId
 *   body: { carrier_rate_card_id?, account_number?, label? }
 *   Updates a specific link by its row ID.
 *
 * DELETE /api/customer-carrier-links/:customerId/link/:linkId
 *   Removes a specific link by its row ID.
 *
 * Legacy PATCH  /api/customer-carrier-links/:customerId/:courierId
 *   Still supported for backwards compat — updates the first link for that courier.
 *
 * Legacy DELETE /api/customer-carrier-links/:customerId/:courierId
 *   Still supported — deletes ALL links for that courier (full deactivation).
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
// All couriers with active flag, accounts array, and fuel group pricing.

router.get('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    // All couriers with master rate card info
    const carriersRes = await query(`
      SELECT
        c.id     AS courier_id,
        c.name   AS courier_name,
        c.code   AS courier_code,
        mc.id    AS master_card_id,
        mc.name  AS master_card_name,
        json_agg(
          jsonb_build_object('id', ac.id, 'name', ac.name, 'is_master', ac.is_master)
          ORDER BY ac.is_master DESC, ac.name
        ) FILTER (WHERE ac.id IS NOT NULL) AS available_cards
      FROM couriers c
      LEFT JOIN carrier_rate_cards mc ON mc.courier_id = c.id AND mc.is_master = true
      LEFT JOIN carrier_rate_cards ac ON ac.courier_id = c.id
      GROUP BY c.id, c.name, c.code, mc.id, mc.name
      ORDER BY c.name
    `);

    // All carrier link rows for this customer (may be multiple per courier)
    const linksRes = await query(`
      SELECT
        ccl.id                  AS link_id,
        ccl.courier_id,
        ccl.carrier_rate_card_id,
        ccl.account_number,
        ccl.label,
        arc.name                AS active_card_name
      FROM   customer_carrier_links ccl
      LEFT   JOIN carrier_rate_cards arc ON arc.id = ccl.carrier_rate_card_id
      WHERE  ccl.customer_id = $1
      ORDER  BY ccl.courier_id, ccl.id
    `, [customerId]);

    // Index links by courier_id → array
    const linksByCourier = {};
    for (const link of linksRes.rows) {
      if (!linksByCourier[link.courier_id]) linksByCourier[link.courier_id] = [];
      linksByCourier[link.courier_id].push({
        link_id:             link.link_id,
        carrier_rate_card_id: link.carrier_rate_card_id,
        active_card_name:    link.active_card_name,
        account_number:      link.account_number ?? null,
        label:               link.label ?? null,
      });
    }

    // Fuel groups
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

    const fuelByCourier = {};
    for (const fg of fuelRes.rows) {
      if (!fuelByCourier[fg.courier_id]) fuelByCourier[fg.courier_id] = [];
      fuelByCourier[fg.courier_id].push(fg);
    }

    const result = carriersRes.rows.map(row => {
      const accounts = linksByCourier[row.courier_id] ?? [];
      // Derive legacy-compatible fields from first account (for components that
      // haven't been updated to use the accounts array yet)
      const firstAccount = accounts[0] ?? null;
      return {
        courier_id:       row.courier_id,
        courier_name:     row.courier_name,
        courier_code:     row.courier_code,
        active:           accounts.length > 0,
        // Legacy single-account fields (first account, for backwards compat)
        link_id:          firstAccount?.link_id ?? null,
        account_number:   firstAccount?.account_number ?? null,
        active_card_id:   firstAccount?.carrier_rate_card_id ?? row.master_card_id,
        active_card_name: firstAccount?.active_card_name ?? row.master_card_name,
        // Multi-account: full list
        accounts,
        master_card_id:   row.master_card_id,
        master_card_name: row.master_card_name,
        available_cards:  row.available_cards ?? [],
        fuel_groups:      fuelByCourier[row.courier_id] ?? [],
      };
    });

    res.json(result);
  } catch (err) { next(err); }
});

// ─── POST /:customerId — add a carrier link (new or additional account) ───────

router.post('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { courier_id, account_number, label, carrier_rate_card_id } = req.body;
    if (!courier_id) return res.status(400).json({ error: 'courier_id required' });

    // Resolve rate card: use provided ID, or find/create master
    let cardId = carrier_rate_card_id;
    if (!cardId) {
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
      cardId = masterRes.rows[0].id;
    }

    const { rows } = await query(`
      INSERT INTO customer_carrier_links
        (customer_id, courier_id, carrier_rate_card_id, account_number, label)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      customerId,
      courier_id,
      cardId,
      account_number?.trim() || null,
      label?.trim() || null,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ─── PATCH /:customerId/link/:linkId — update specific link by ID ─────────────

router.patch('/:customerId/link/:linkId', async (req, res, next) => {
  try {
    const { customerId, linkId } = req.params;
    const { carrier_rate_card_id, account_number, label } = req.body;

    if (carrier_rate_card_id == null && account_number === undefined && label === undefined) {
      return res.status(400).json({ error: 'carrier_rate_card_id, account_number, or label required' });
    }

    const sets   = ['updated_at = NOW()'];
    const params = [customerId, parseInt(linkId)];

    if (carrier_rate_card_id != null) {
      params.push(carrier_rate_card_id);
      sets.push(`carrier_rate_card_id = $${params.length}`);
    }
    if (account_number !== undefined) {
      params.push(account_number === '' ? null : account_number.trim());
      sets.push(`account_number = $${params.length}`);
    }
    if (label !== undefined) {
      params.push(label === '' ? null : label.trim());
      sets.push(`label = $${params.length}`);
    }

    const { rows } = await query(`
      UPDATE customer_carrier_links
      SET ${sets.join(', ')}
      WHERE customer_id = $1 AND id = $2
      RETURNING *
    `, params);

    if (!rows.length) return res.status(404).json({ error: 'Link not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /:customerId/link/:linkId — remove specific link by ID ────────────

router.delete('/:customerId/link/:linkId', async (req, res, next) => {
  try {
    const { customerId, linkId } = req.params;
    const result = await query(
      'DELETE FROM customer_carrier_links WHERE customer_id = $1 AND id = $2',
      [customerId, parseInt(linkId)]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Link not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── Legacy PATCH /:customerId/:courierId — update first link for carrier ─────

router.patch('/:customerId/:courierId', async (req, res, next) => {
  try {
    const { customerId, courierId } = req.params;
    // Guard: don't confuse with /link/:linkId or /fuel/:fuelGroupId routes
    if (courierId === 'link' || courierId === 'fuel') return next();

    const { carrier_rate_card_id, account_number } = req.body;

    if (carrier_rate_card_id == null && account_number === undefined) {
      return res.status(400).json({ error: 'carrier_rate_card_id or account_number required' });
    }

    const sets   = ['updated_at = NOW()'];
    const params = [customerId, courierId];

    if (carrier_rate_card_id != null) {
      params.push(carrier_rate_card_id);
      sets.push(`carrier_rate_card_id = $${params.length}`);
    }
    if (account_number !== undefined) {
      params.push(account_number === '' ? null : account_number.trim());
      sets.push(`account_number = $${params.length}`);
    }

    const { rows } = await query(`
      UPDATE customer_carrier_links
      SET ${sets.join(', ')}
      WHERE id = (
        SELECT id FROM customer_carrier_links
        WHERE customer_id = $1 AND courier_id = $2
        ORDER BY id ASC
        LIMIT 1
      )
      RETURNING *
    `, params);

    if (!rows.length) return res.status(404).json({ error: 'Carrier link not found — activate carrier first' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─── Legacy DELETE /:customerId/:courierId — remove all links for carrier ─────

router.delete('/:customerId/:courierId', async (req, res, next) => {
  try {
    const { customerId, courierId } = req.params;
    if (courierId === 'link' || courierId === 'fuel') return next();
    await query(
      'DELETE FROM customer_carrier_links WHERE customer_id = $1 AND courier_id = $2',
      [customerId, courierId]
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
