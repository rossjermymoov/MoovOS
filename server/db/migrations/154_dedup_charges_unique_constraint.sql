-- ─── Migration 154 — Deduplicate charges + add unique constraint ──────────────
--
-- ROOT CAUSE (two separate issues):
--
-- Issue A — Race condition:
--   The webhook idempotency gate does SELECT then INSERT as two separate
--   statements. Two concurrent handlers (e.g. backfill firing the same
--   shipment twice) both pass the SELECT check before either INSERT completes,
--   producing duplicate courier+fuel pairs within milliseconds of each other.
--   e.g. order 28916: two courier + two fuel rows all at 08:32:09.xxx
--
-- Issue B — Split-brain (billing.js + pricingEngine):
--   billing.js processes a shipment on day 1 (voila_shipment_id=NULL).
--   Later, voila-backfill re-processes the same shipment via pricingEngine
--   (voila_shipment_id set). The backfill idempotency only checks
--   voila_shipment_id, not order_id, so it doesn't see the billing.js charge
--   and creates a second set.
--
-- THIS MIGRATION:
--
--   Step 1: Cancel duplicate pricingEngine courier charges for the same
--           voila_shipment_id — keep the OLDEST, cancel the rest.
--           Also cancel their associated fuel/surcharge charges.
--
--   Step 2: Cancel pricingEngine charges (voila_shipment_id IS NOT NULL)
--           where a billing.js charge (voila_shipment_id IS NULL, shipment_id
--           IS NOT NULL) already exists for the same order_id.
--           billing.js charges are preferred: they have shipment_id set and
--           are visible to the reconciliation pool.
--
--   Step 3: Add a partial unique index on charges(voila_shipment_id) for
--           active (non-cancelled) courier charges. Combined with
--           ON CONFLICT DO NOTHING in insertCharges, this makes the race
--           condition impossible at the DB level going forward.
--
-- IDEMPOTENT: cancellations and CREATE INDEX IF NOT EXISTS are safe to re-run.

DO $$
DECLARE
  v_race_courier   INTEGER := 0;
  v_race_aux       INTEGER := 0;
  v_splitbrain     INTEGER := 0;
BEGIN

  -- ── Step 1: Cancel race-condition duplicate courier charges ───────────────
  -- For each voila_shipment_id with more than one active courier charge,
  -- keep the earliest (lowest created_at), cancel all others.

  WITH dupes AS (
    SELECT
      id,
      voila_shipment_id,
      shipment_id,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY voila_shipment_id
        ORDER BY created_at ASC
      ) AS rn
    FROM charges
    WHERE voila_shipment_id IS NOT NULL
      AND cancelled   = false
      AND charge_type = 'courier'
  ),
  to_cancel AS (
    SELECT id, voila_shipment_id, shipment_id
    FROM   dupes
    WHERE  rn > 1
  ),
  cancelled AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    FROM   to_cancel tc
    WHERE  c.id = tc.id
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_race_courier FROM cancelled;

  RAISE NOTICE 'Step 1: cancelled % race-condition duplicate courier charge(s)', v_race_courier;

  -- ── Step 1b: Cancel orphaned fuel/surcharge for those duplicates ──────────
  WITH orphaned AS (
    SELECT DISTINCT c_dup.shipment_id
    FROM   charges c_dup
    WHERE  c_dup.charge_type       = 'courier'
      AND  c_dup.cancelled         = true
      AND  c_dup.voila_shipment_id IS NOT NULL
      AND  c_dup.shipment_id       IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM charges c_keep
        WHERE  c_keep.voila_shipment_id = c_dup.voila_shipment_id
          AND  c_keep.charge_type       = 'courier'
          AND  c_keep.cancelled         = false
      )
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
    FROM   orphaned os
    WHERE  c.shipment_id = os.shipment_id
      AND  c.charge_type IN ('fuel', 'surcharge')
      AND  c.cancelled   = false
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_race_aux FROM aux;

  RAISE NOTICE 'Step 1b: cancelled % orphaned fuel/surcharge from race duplicates', v_race_aux;

  -- ── Step 2: Cancel split-brain pricingEngine charges ─────────────────────
  -- Where billing.js already created a charge for the same order_id,
  -- the pricingEngine (voila-backfill) charge is the intruder.
  -- billing.js charges: voila_shipment_id IS NULL, shipment_id IS NOT NULL.
  -- Cancel ALL charge types (courier, fuel, surcharge) for the pricingEngine
  -- shipment_id group — but only where the voila charge has no shipment_id
  -- (meaning it was never linked to a shipment record properly).

  WITH splitbrain AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    WHERE  c.voila_shipment_id IS NOT NULL
      AND  c.shipment_id       IS NULL
      AND  c.cancelled         = false
      -- A billing.js charge exists for the same order_id
      AND EXISTS (
        SELECT 1 FROM charges bjs
        WHERE  bjs.order_id          = c.order_id
          AND  bjs.voila_shipment_id IS NULL
          AND  bjs.shipment_id       IS NOT NULL
          AND  bjs.cancelled         = false
          AND  bjs.charge_type       = 'courier'
      )
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_splitbrain FROM splitbrain;

  RAISE NOTICE 'Step 2: cancelled % split-brain pricingEngine charge(s)', v_splitbrain;

  RAISE NOTICE '━━━ Migration 154 complete ━━━';
  RAISE NOTICE 'Race duplicates cancelled: % courier + % fuel/surcharge', v_race_courier, v_race_aux;
  RAISE NOTICE 'Split-brain duplicates cancelled: %', v_splitbrain;

END $$;

-- ── Step 3: Cancel duplicate fuel charges for same voila_shipment_id ─────────
-- Race condition also creates multiple fuel rows. Step 2 handles split-brain
-- cases (cancels all pricingEngine charges where billing.js charge exists).
-- This step catches any remaining fuel duplicates not covered by step 2.

DO $$
DECLARE
  v_fuel_dupes INTEGER := 0;
BEGIN
  WITH fuel_dupes AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY voila_shipment_id
        ORDER BY created_at ASC
      ) AS rn
    FROM charges
    WHERE voila_shipment_id IS NOT NULL
      AND cancelled   = false
      AND charge_type = 'fuel'
  ),
  cancelled AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    FROM   fuel_dupes fd
    WHERE  c.id = fd.id
      AND  fd.rn > 1
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_fuel_dupes FROM cancelled;

  RAISE NOTICE 'Step 3: cancelled % duplicate fuel charge(s)', v_fuel_dupes;
END $$;

-- ── Step 4: Unique indexes — prevent race condition at DB level going forward ──
-- One active courier charge + one active fuel charge per voila_shipment_id.
-- ON CONFLICT DO NOTHING in insertCharges silently rejects concurrent duplicates.

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_voila_courier_active
  ON charges (voila_shipment_id)
  WHERE charge_type = 'courier'
    AND cancelled   = false
    AND voila_shipment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_voila_fuel_active
  ON charges (voila_shipment_id)
  WHERE charge_type = 'fuel'
    AND cancelled   = false
    AND voila_shipment_id IS NOT NULL;

-- ─── Post-run verification ────────────────────────────────────────────────────
-- Both should return 0 rows:
-- SELECT voila_shipment_id, COUNT(*) FROM charges
-- WHERE charge_type = 'courier' AND cancelled = false AND voila_shipment_id IS NOT NULL
-- GROUP BY voila_shipment_id HAVING COUNT(*) > 1;
--
-- SELECT voila_shipment_id, COUNT(*) FROM charges
-- WHERE charge_type = 'fuel' AND cancelled = false AND voila_shipment_id IS NOT NULL
-- GROUP BY voila_shipment_id HAVING COUNT(*) > 1;
