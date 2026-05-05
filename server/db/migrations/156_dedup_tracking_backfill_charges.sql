-- ─── Migration 156 — Deduplicate tracking-backfill charges ───────────────────
--
-- ROOT CAUSE:
--   Multiple tracking webhooks arrive simultaneously for the same consignment.
--   The backfill check (verifyResult.rowCount === 0) passes for all concurrent
--   handlers before any backfill completes, so each one fetches from the Voila
--   API and calls insertCharges, creating duplicate courier + fuel rows.
--
--   The unique index on voila_shipment_id (migration 154) blocks duplicate
--   courier rows via ON CONFLICT DO NOTHING, but fuel rows were still slipping
--   through due to a race between index enforcement and concurrent inserts.
--
-- FIX APPLIED (tracking.js):
--   Added a backfillInFlight Set. First concurrent handler wins; the rest
--   skip silently. DB-level unique indexes remain as the final backstop.
--
-- THIS MIGRATION:
--   Re-runs the voila_shipment_id dedup from migration 154 to catch any
--   tracking-backfill duplicates created after migration 154 was applied.
--
--   Step 1: Cancel duplicate courier charges per voila_shipment_id (keep oldest)
--   Step 2: Cancel orphaned fuel/surcharge from those cancelled couriers
--   Step 3: Cancel duplicate fuel charges per voila_shipment_id (keep oldest)
--
-- IDEMPOTENT: safe to re-run — cancels only rows with rn > 1.

DO $$
DECLARE
  v_courier_dupes INTEGER := 0;
  v_aux_orphans   INTEGER := 0;
  v_fuel_dupes    INTEGER := 0;
BEGIN

  -- ── Step 1: Cancel duplicate courier charges per voila_shipment_id ───────────
  WITH dupes AS (
    SELECT
      id,
      voila_shipment_id,
      shipment_id,
      ROW_NUMBER() OVER (
        PARTITION BY voila_shipment_id
        ORDER BY created_at ASC
      ) AS rn
    FROM charges
    WHERE voila_shipment_id IS NOT NULL
      AND cancelled   = false
      AND charge_type = 'courier'
  ),
  cancelled AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    FROM   dupes d
    WHERE  c.id = d.id
      AND  d.rn > 1
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_courier_dupes FROM cancelled;

  RAISE NOTICE 'Step 1: cancelled % duplicate courier charge(s)', v_courier_dupes;

  -- ── Step 2: Cancel orphaned fuel/surcharge from cancelled courier dupes ───────
  WITH orphaned AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    WHERE  c.voila_shipment_id IS NOT NULL
      AND  c.cancelled         = false
      AND  c.charge_type       IN ('fuel', 'surcharge')
      AND NOT EXISTS (
        SELECT 1 FROM charges c_active
        WHERE  c_active.voila_shipment_id = c.voila_shipment_id
          AND  c_active.charge_type       = 'courier'
          AND  c_active.cancelled         = false
      )
      AND EXISTS (
        SELECT 1 FROM charges c_cancelled
        WHERE  c_cancelled.voila_shipment_id = c.voila_shipment_id
          AND  c_cancelled.charge_type       = 'courier'
          AND  c_cancelled.cancelled         = true
      )
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_aux_orphans FROM orphaned;

  RAISE NOTICE 'Step 2: cancelled % orphaned fuel/surcharge charge(s)', v_aux_orphans;

  -- ── Step 3: Cancel duplicate fuel charges per voila_shipment_id ──────────────
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

  RAISE NOTICE '━━━ Migration 156 complete ━━━';
  RAISE NOTICE 'Courier dupes cancelled: %', v_courier_dupes;
  RAISE NOTICE 'Orphaned fuel/surcharge cancelled: %', v_aux_orphans;
  RAISE NOTICE 'Fuel dupes cancelled: %', v_fuel_dupes;

END $$;
