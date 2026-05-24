-- ─── Migration 203 — Keep dc_customer_id in sync with account_number ─────────
--
-- dc_customer_id is always the same as account_number (the Moov account number
-- IS the DC webhook identifier for every customer). Rather than managing them
-- separately, this migration:
--
--   1. Backfills all existing customers so dc_customer_id = account_number.
--   2. Adds a BEFORE INSERT OR UPDATE trigger that keeps them in sync going
--      forward — no application code needed.
--
-- The trigger is named trg_customer_dc_id_sync so it fires alphabetically
-- after trg_customer_account_number (which sets the account number on INSERT),
-- ensuring it always sees the final account_number value.

-- ── Step 1: Backfill ─────────────────────────────────────────────────────────
UPDATE customers
SET    dc_customer_id = account_number
WHERE  dc_customer_id IS DISTINCT FROM account_number;

-- ── Step 2: Trigger function ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_customer_dc_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.dc_customer_id := NEW.account_number;
  RETURN NEW;
END;
$$;

-- ── Step 3: Trigger ───────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_customer_dc_id_sync ON customers;

CREATE TRIGGER trg_customer_dc_id_sync
BEFORE INSERT OR UPDATE OF account_number ON customers
FOR EACH ROW EXECUTE FUNCTION sync_customer_dc_id();
