-- ─── Migration 124 — Margin Tracking, Surcharge Detail & Customer Balances ────
--
-- 1. finalized_billing_lines:
--      • carrier_cost_total  — generated alias for carrier_total_amount (Buy Price)
--      • customer_charge_total — generated alias for sell_total_amount (Sell Price)
--      • surcharge_detail — JSONB storing per-surcharge-type Buy/Sell breakdown
--
-- 2. customers:
--      • real_time_balance — updated when external_booking recon lines are finalized
--      • ledger_balance    — updated by scheduled Xero sync (unpaid invoice totals)
--
-- 3. reconciliation_margin_view — aggregated Buy vs Sell per finalized run
--      Includes automation rate and margin % for profitability reporting.

-- ── finalized_billing_lines additions ─────────────────────────────────────────

ALTER TABLE finalized_billing_lines
  ADD COLUMN IF NOT EXISTS carrier_cost_total     NUMERIC(10,4)
    GENERATED ALWAYS AS (carrier_total_amount) STORED,
  ADD COLUMN IF NOT EXISTS customer_charge_total  NUMERIC(10,4)
    GENERATED ALWAYS AS (sell_total_amount) STORED,
  ADD COLUMN IF NOT EXISTS surcharge_detail       JSONB;

COMMENT ON COLUMN finalized_billing_lines.carrier_cost_total    IS 'Buy price (alias of carrier_total_amount) — what we paid the carrier';
COMMENT ON COLUMN finalized_billing_lines.customer_charge_total IS 'Sell price (alias of sell_total_amount) — what we charge the customer';
COMMENT ON COLUMN finalized_billing_lines.surcharge_detail      IS
  'JSONB array of per-surcharge-type Buy/Sell breakdown.
   Schema: [{ surcharge_id, surcharge_name, charge_type, sell_amount, cost_amount }]';

-- ── customers additions ────────────────────────────────────────────────────────

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS real_time_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ledger_balance     NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN customers.real_time_balance IS
  'Running total of charges not yet pushed to Xero, updated in real-time on
   label creation and finalization of external_booking recon lines.';
COMMENT ON COLUMN customers.ledger_balance IS
  'Sum of unpaid invoice totals pulled from Xero every 4-6 hours by the
   scheduled Xero balance sync job.';

-- ── reconciliation_margin_view ─────────────────────────────────────────────────

DROP VIEW IF EXISTS reconciliation_margin_view;

CREATE VIEW reconciliation_margin_view AS
SELECT
  rr.id                                                          AS run_id,
  rr.invoice_ref,
  rr.invoice_date,
  rr.finalized_at,
  c.name                                                         AS carrier_name,
  rr.automation_rate,

  -- Line counts
  COUNT(f.id)                                                    AS line_count,
  COUNT(f.id) FILTER (WHERE f.recon_status = 'matched')         AS matched_count,
  COUNT(f.id) FILTER (WHERE f.recon_status = 'corrected')       AS corrected_count,

  -- Buy side (carrier cost)
  ROUND(SUM(f.carrier_base_amount)::NUMERIC,      4)            AS total_buy_base,
  ROUND(SUM(f.carrier_fuel_amount)::NUMERIC,      4)            AS total_buy_fuel,
  ROUND(SUM(f.carrier_surcharge_amount)::NUMERIC, 4)            AS total_buy_surcharge,
  ROUND(SUM(f.carrier_total_amount)::NUMERIC,     4)            AS total_buy,

  -- Sell side (customer charge)
  ROUND(SUM(f.sell_base_amount)::NUMERIC,         4)            AS total_sell_base,
  ROUND(SUM(f.sell_fuel_amount)::NUMERIC,         4)            AS total_sell_fuel,
  ROUND(SUM(f.sell_surcharge_amount)::NUMERIC,    4)            AS total_sell_surcharge,
  ROUND(SUM(f.sell_total_amount)::NUMERIC,        4)            AS total_sell,

  -- Margin
  ROUND(SUM(f.margin_amount)::NUMERIC,            4)            AS total_margin,
  ROUND(
    SUM(f.margin_amount) / NULLIF(SUM(f.sell_total_amount), 0) * 100,
    2
  )                                                              AS margin_pct,

  -- Xero push state
  COUNT(f.id) FILTER (WHERE f.xero_pushed_at IS NOT NULL)       AS xero_pushed_count,
  COUNT(f.id) FILTER (WHERE f.xero_pushed_at IS NULL)           AS xero_unpushed_count

FROM   reconciliation_runs rr
LEFT JOIN finalized_billing_lines f ON f.run_id = rr.id
LEFT JOIN couriers c ON c.id = rr.carrier_id
WHERE  rr.finalized = true
GROUP  BY rr.id, rr.invoice_ref, rr.invoice_date,
          rr.finalized_at, c.name, rr.automation_rate;
