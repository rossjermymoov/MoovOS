-- -----------------------------------------------------------------------------
-- Migration 120 — Carrier account numbers on customer_carrier_links
--
-- Adds account_number to customer_carrier_links so each customer can have their
-- own carrier account number stored per carrier.
--
-- Key design decisions:
--   • Account number is SEPARATE from rate card — a customer on the master DHL
--     rate card still has their own DHL account number.
--   • One account number per customer per carrier (matches the UNIQUE constraint
--     on (customer_id, courier_id) that already exists on this table).
--   • Used by reconciliation to match invoice rows (column A = account number)
--     to the correct customer without requiring a shipment reference match.
--
-- Safe to re-run — ADD COLUMN IF NOT EXISTS.
-- -----------------------------------------------------------------------------

ALTER TABLE customer_carrier_links
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);

COMMENT ON COLUMN customer_carrier_links.account_number IS
  'Carrier-assigned account number for this customer (e.g. DHL contract number). '
  'Used for reconciliation — column A of DHL invoices identifies the customer.';
