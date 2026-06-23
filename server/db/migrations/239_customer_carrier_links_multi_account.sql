-- Migration 239: Allow multiple DPD account numbers per customer
-- Previously unique on (customer_id, courier_id) — blocked Oriental Mart having
-- both an Ambient and a Perishable DPD account against the same customer record.
-- New constraint: unique per account_number (non-null) only, so the same DPD
-- account can't be mapped to two different customers, but one customer can have
-- as many DPD accounts as needed.

ALTER TABLE customer_carrier_links
  DROP CONSTRAINT IF EXISTS customer_carrier_links_customer_id_courier_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS ccl_unique_account_number
  ON customer_carrier_links (account_number)
  WHERE account_number IS NOT NULL;
