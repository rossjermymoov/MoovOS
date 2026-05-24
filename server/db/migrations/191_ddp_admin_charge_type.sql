-- ─── Migration 191 — DDP clearance admin fee charge type ────────────────────
--
-- Documents the 'ddp_admin' charge_type inserted by the reconciliation engine
-- for DDP (duty-paid) consignments.  No schema changes are needed — charge_type
-- is VARCHAR(100) so the value is unconstrained.
--
-- Fee rules applied at reconciliation time (reconciliationEngine.maybeInsertDdpAdminFee):
--
--   Destination Europe (EU27 + EEA + CH):  flat £2.50 per consignment
--   Destination Rest of World:             max(£12.50, 2.5% of declared goods value)
--
-- ROW break-even: £500 declared value (2.5% × £500 = £12.50).
--   Below £500  → flat £12.50 minimum
--   £500+       → 2.5% of goods value
--
-- Charge characteristics:
--   source     = 'ddp_admin_recon'
--   cost_price = 0    (Moov admin revenue — not a carrier pass-through cost)
--   sell_price = fee amount
--   verified   = true
--   status     = 'verified'
--
-- The engine is idempotent: it checks for an existing ddp_admin charge on the
-- shipment before inserting, so re-running a reconciliation will not create
-- duplicate fee rows.
--
-- pricing_logic_trace (JSONB) on the charge records:
--   goods_value, country_iso, region ('Europe'|'ROW'), fee_rule, service_code

COMMENT ON TABLE charges IS
  'All financial charges against customer accounts. '
  'charge_type values include: courier, fuel, surcharge, ddp_admin (DDP clearance admin fee).';
