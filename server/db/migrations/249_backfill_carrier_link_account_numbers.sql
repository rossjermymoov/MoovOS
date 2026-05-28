-- ─── Migration 249 — Backfill customer_carrier_links.account_number ──────────
--
-- The fuel attribution in lookupCustomerByAccount() queries
-- customer_carrier_links.account_number first.  This column was never populated
-- at customer creation, so fuel rows stay anonymous for virtually every customer.
--
-- The data already exists: reconciliation_lines.carrier_account_no records the
-- carrier account number for every processed invoice line.  Where a line has a
-- customer_id (attributed via parcel pool), the (customer → account_no) mapping
-- is known.  We can back-fill customer_carrier_links from this history.
--
-- Strategy:
--   1. Count how often each account_no appears per (customer_id, carrier_id).
--      The most frequent one is canonical — handles any noise from test runs.
--   2. Only update rows where account_number IS NULL (never overwrites manual
--      entries already set by staff).
--   3. Only update customers with exactly ONE carrier link row per carrier.
--      Multi-account customers (e.g. Oriental Mart with two DPD accounts) are
--      skipped here to avoid mis-attribution — they need manual resolution.
--
-- IDEMPOTENT: WHERE account_number IS NULL means safe to re-run.

DO $$
DECLARE
  v_updated INTEGER;
BEGIN

  WITH account_counts AS (
    -- Frequency of each account_no per (customer, carrier)
    -- Join through reconciliation_runs to get carrier_id — more reliable than
    -- going through service_id, which is NULL on fuel / overhead rows.
    SELECT
      rl.customer_id,
      rr.carrier_id,
      rl.carrier_account_no,
      COUNT(*) AS cnt
    FROM   reconciliation_lines rl
    JOIN   reconciliation_runs  rr ON rr.id = rl.run_id
    WHERE  rl.customer_id           IS NOT NULL
      AND  rl.carrier_account_no    IS NOT NULL
      AND  TRIM(rl.carrier_account_no) <> ''
    GROUP  BY rl.customer_id, rr.carrier_id, rl.carrier_account_no
  ),

  best_account AS (
    -- Pick the most-used account_no per (customer, carrier)
    SELECT DISTINCT ON (customer_id, carrier_id)
      customer_id,
      carrier_id,
      carrier_account_no
    FROM   account_counts
    ORDER  BY customer_id, carrier_id, cnt DESC
  ),

  single_link AS (
    -- Only target customers with exactly one NULL carrier link per carrier.
    -- This safely skips multi-account customers where automated selection
    -- could pick the wrong row.
    SELECT customer_id, courier_id
    FROM   customer_carrier_links
    WHERE  account_number IS NULL
    GROUP  BY customer_id, courier_id
    HAVING COUNT(*) = 1
  )

  UPDATE customer_carrier_links ccl
  SET    account_number = ba.carrier_account_no,
         updated_at     = NOW()
  FROM   best_account ba
  JOIN   single_link  sl
         ON  sl.customer_id = ba.customer_id
         AND sl.courier_id  = ba.carrier_id
  WHERE  ccl.customer_id    = ba.customer_id
    AND  ccl.courier_id     = ba.carrier_id
    AND  ccl.account_number IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RAISE NOTICE 'Migration 249: backfilled account_number on % customer_carrier_links row(s)', v_updated;
  RAISE NOTICE 'Migration 249: multi-account customers (>1 NULL link per carrier) were skipped — set manually.';

END $$;
