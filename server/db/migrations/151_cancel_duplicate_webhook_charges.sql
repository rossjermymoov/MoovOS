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
--   For each voila_shipment_id that has more than one courier charge,
--   keep the OLDEST charge set (lowest id = first inserted = most likely correct)
--   and cancel all later duplicates.
--
-- SCOPE: only courier charges with voila_shipment_id IS NOT NULL.
-- IDEMPOTENT: SET cancelled = true WHERE cancelled = false is safe to re-run.

DO $$
DECLARE
  v_shipments_affected INTEGER := 0;
  v_courier_cancelled  INTEGER := 0;
  v_aux_cancelled      INTEGER := 0;
BEGIN

  -- ── Step 1: Find voila_shipment_ids with multiple active courier charges ──
  -- Keep the earliest (min id). Cancel all others.

  WITH keepers AS (
    SELECT voila_shipment_id, MIN(id) AS keep_id
    FROM   charges
    WHERE  voila_shipment_id IS NOT NULL
      AND  cancelled         = false
      AND  charge_type       = 'courier'
    GROUP  BY voila_shipment_id
    HAVING COUNT(*) > 1
  ),
  cancelled_courier AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    FROM   keepers k
    WHERE  c.voila_shipment_id = k.voila_shipment_id
      AND  c.charge_type       = 'courier'
      AND  c.cancelled         = false
      AND  c.id               <> k.keep_id
    RETURNING c.id, c.shipment_id
  )
  SELECT COUNT(DISTINCT voila_shipment_id) INTO v_shipments_affected
  FROM (
    SELECT c.voila_shipment_id
    FROM   cancelled_courier cc
    JOIN   charges c ON c.id = cc.id
  ) t;

  RAISE NOTICE 'Step 1: % shipment(s) had duplicate courier charges', v_shipments_affected;

  -- ── Step 2: Re-derive cancelled courier count ─────────────────────────────
  SELECT COUNT(*) INTO v_courier_cancelled
  FROM charges c
  JOIN (
    SELECT voila_shipment_id, MIN(id) AS keep_id
    FROM   charges
    WHERE  voila_shipment_id IS NOT NULL
      AND  charge_type       = 'courier'
    GROUP  BY voila_shipment_id
    HAVING COUNT(*) > 1
  ) k ON k.voila_shipment_id = c.voila_shipment_id
  WHERE c.charge_type = 'courier'
    AND c.cancelled   = true
    AND c.id         <> k.keep_id;

  -- ── Step 3: Cancel orphaned fuel/surcharge charges ───────────────────────
  -- Fuel and surcharge charges share the same shipment_id as their courier charge.
  -- For any shipment_id where the courier charge is now cancelled, also cancel
  -- the associated fuel/surcharge charges (they belong to the duplicate set).
  --
  -- Guard: only cancel if the shipment_id is linked to a CANCELLED courier charge
  -- AND there is still an ACTIVE courier charge for the same voila_shipment_id
  -- (i.e. the keeper is on a different shipment record).

  WITH orphaned_shipments AS (
    SELECT DISTINCT c_dup.shipment_id
    FROM   charges c_dup
    WHERE  c_dup.charge_type       = 'courier'
      AND  c_dup.cancelled         = true
      AND  c_dup.voila_shipment_id IS NOT NULL
      -- The keeper courier charge exists on a different id (same voila_shipment_id)
      AND EXISTS (
        SELECT 1 FROM charges c_keep
        WHERE  c_keep.voila_shipment_id = c_dup.voila_shipment_id
          AND  c_keep.charge_type       = 'courier'
          AND  c_keep.cancelled         = false
          AND  c_keep.id               <> c_dup.id
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

  RAISE NOTICE 'Step 3: cancelled % orphaned fuel/surcharge charge(s)', v_aux_cancelled;

  -- ── Summary ────────────────────────────────────────────────────────────────
  RAISE NOTICE '━━━ Migration 151 complete ━━━';
  RAISE NOTICE 'Shipments de-duped: %', v_shipments_affected;
  RAISE NOTICE 'Duplicate charges cancelled: % courier + % fuel/surcharge', v_courier_cancelled, v_aux_cancelled;
  RAISE NOTICE 'Oldest charge set (lowest id) retained per voila_shipment_id.';

END $$;

-- ─── Post-run verification ────────────────────────────────────────────────────
--
-- Confirm no voila_shipment_id has more than one active courier charge:
-- SELECT voila_shipment_id, COUNT(*) AS active_courier_charges
-- FROM   charges
-- WHERE  voila_shipment_id IS NOT NULL
--   AND  cancelled = false
--   AND  charge_type = 'courier'
-- GROUP  BY voila_shipment_id
-- HAVING COUNT(*) > 1;
--
-- Should return 0 rows.
