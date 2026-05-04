-- ─── Migration 151 — Cancel duplicate charges caused by webhook retries ────────
--
-- ROOT CAUSE:
--   The shipment-created webhook handler processed charges synchronously before
--   responding. When Voila's webhook timeout elapsed, Voila retried the webhook.
--   Each retry created a full duplicate set of charges (courier + fuel + surcharge)
--   for the same voila_shipment_id.
--
-- FIX APPLIED (webhooks.js):
--   Handler now responds 200 immediately and processes in the background.
--   Idempotency gate checks for existing charges before processing.
--
-- THIS MIGRATION:
--   For each voila_shipment_id that has more than one active courier charge,
--   keep the OLDEST charge set (earliest created_at = first inserted = correct)
--   and cancel all later duplicates.
--
-- NOTE: charges.id is UUID — MIN(id) is not valid in PostgreSQL.
--       We use MIN(created_at) to identify the keeper row, then resolve
--       to the specific id via a subquery.
--
-- IDEMPOTENT: SET cancelled = true WHERE cancelled = false is safe to re-run.

DO $$
DECLARE
  v_shipments_affected INTEGER := 0;
  v_courier_cancelled  INTEGER := 0;
  v_aux_cancelled      INTEGER := 0;
BEGIN

  -- ── Step 1: Cancel duplicate courier charges ──────────────────────────────
  -- For each voila_shipment_id with multiple active courier charges,
  -- identify the earliest created_at as the keeper, cancel all others.
  -- When created_at ties (rare), we keep an arbitrary one — any is fine.

  WITH dupes AS (
    SELECT
      id,
      voila_shipment_id,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY voila_shipment_id
        ORDER BY created_at ASC
      ) AS rn
    FROM charges
    WHERE voila_shipment_id IS NOT NULL
      AND cancelled         = false
      AND charge_type       = 'courier'
  ),
  to_cancel AS (
    SELECT id, voila_shipment_id
    FROM   dupes
    WHERE  rn > 1   -- everything except the oldest row
  ),
  cancelled AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    FROM   to_cancel tc
    WHERE  c.id = tc.id
    RETURNING c.id, c.voila_shipment_id
  )
  SELECT
    COUNT(DISTINCT voila_shipment_id),
    COUNT(*)
  INTO v_shipments_affected, v_courier_cancelled
  FROM cancelled;

  RAISE NOTICE 'Step 1: cancelled % duplicate courier charge(s) across % shipment(s)',
    v_courier_cancelled, v_shipments_affected;

  -- ── Step 2: Cancel orphaned fuel/surcharge charges ────────────────────────
  -- For any shipment_id now linked only to a CANCELLED courier charge (i.e. it
  -- belonged to a duplicate set), also cancel the associated fuel/surcharge
  -- charges so the total_cost_price subquery is not polluted.
  --
  -- Guard: the same voila_shipment_id must still have an ACTIVE courier charge
  -- elsewhere (the keeper), confirming this is a genuine duplicate set.

  WITH orphaned_shipments AS (
    SELECT DISTINCT c_dup.shipment_id
    FROM   charges c_dup
    WHERE  c_dup.charge_type       = 'courier'
      AND  c_dup.cancelled         = true
      AND  c_dup.voila_shipment_id IS NOT NULL
      AND  c_dup.shipment_id       IS NOT NULL
      -- A keeper exists for the same voila_shipment_id
      AND EXISTS (
        SELECT 1 FROM charges c_keep
        WHERE  c_keep.voila_shipment_id = c_dup.voila_shipment_id
          AND  c_keep.charge_type       = 'courier'
          AND  c_keep.cancelled         = false
      )
      -- The shipment_id itself has no active courier charge (orphaned)
      AND NOT EXISTS (
        SELECT 1 FROM charges c_active
        WHERE  c_active.shipment_id  = c_dup.shipment_id
          AND  c_active.charge_type  = 'courier'
          AND  c_active.cancelled    = false
      )
  ),
  aux AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    FROM   orphaned_shipments os
    WHERE  c.shipment_id = os.shipment_id
      AND  c.charge_type IN ('fuel', 'surcharge')
      AND  c.cancelled   = false
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_aux_cancelled FROM aux;

  RAISE NOTICE 'Step 2: cancelled % orphaned fuel/surcharge charge(s)', v_aux_cancelled;

  -- ── Summary ────────────────────────────────────────────────────────────────
  RAISE NOTICE '━━━ Migration 151 complete ━━━';
  RAISE NOTICE 'Shipments de-duped: %', v_shipments_affected;
  RAISE NOTICE 'Charges cancelled: % courier + % fuel/surcharge',
    v_courier_cancelled, v_aux_cancelled;

END $$;

-- ─── Post-run verification ────────────────────────────────────────────────────
--
-- Should return 0 rows if all duplicates are resolved:
-- SELECT voila_shipment_id, COUNT(*) AS active_courier_charges
-- FROM   charges
-- WHERE  voila_shipment_id IS NOT NULL
--   AND  cancelled   = false
--   AND  charge_type = 'courier'
-- GROUP  BY voila_shipment_id
-- HAVING COUNT(*) > 1;
