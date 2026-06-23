-- ─── Migration 228 — Add is_test_account flag to customers ──────────────────
--
-- Marks a customer as a test/developer account. When set:
--   - All incoming shipment charges are created at £0 (price=0, cost_price=0)
--   - Surcharges are skipped entirely
--   - Multiple Moov IDs / DCIDs can be added as billing_aliases to route
--     all test traffic to this single account
--
-- The billing_aliases column (migration 033) already handles multi-ID routing.
-- This flag only controls the zero-charge behaviour.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN customers.is_test_account IS
  'When true, all charges created for this customer are forced to £0. Used for internal test/developer accounts.';
