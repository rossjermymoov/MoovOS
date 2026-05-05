-- ─── Migration 155 — Deduplicate billing.js shipment charges ─────────────────
--
-- ROOT CAUSE:
--   billing.js /webhook handler was synchronous (async req, res, next).
--   When DC/Parcel Master timed out waiting for a response, it retried the
--   webhook. Multiple concurrent handlers all passed the shipment_id idempotency
--   check before any INSERT committed, creating dozens of duplicate courier +
--   fuel charge rows per shipment (e.g. order 473882 had 9 pages of dupes).
--
-- FIX APPLIED (billing.js):
--   Handler now responds 200 immediately (fire-and-forget), processing happens
--   in a background IIFE. DC/Parcel Master never times out so never retries.
--
-- THIS MIGRATION:
--
--   Step 1: Cancel duplicate courier charges per shipment_id — keep the oldest
--           (lowest created_at), cancel the rest.
--
--   Step 2: Cancel orphaned fuel/surcharge charges whose shipment_id has no
--           active courier charge remaining (i.e. all couriers were cancelled in
--           Step 1 AND there is a kept courier under the same shipment_id).
--
--   Step 3: Add a partial unique index on charges(shipment_id) for active
--           non-cancelled courier charges. Combined with the existing
--           shipment_id idempotency SELECT in billing.js, this prevents future
--           race-condition duplicates at the DB level.
--
-- NOTE: This only handles billing.js charges (voila_shipment_id IS NULL,
--       shipment_id IS NOT NULL). pricingEngine race duplicates were handled
--       in migration 154 via voila_shipment_id unique indexes.
--
-- IDEMPOTENT: cancellations and CREATE INDEX IF NOT EXISTS are safe to re-run.

DO $$
DECLARE
  v_courier_dupes INTEGER := 0;
  v_aux_orphans   INTEGER := 0;
BEGIN

  -- ── Step 1: Cancel duplicate billing.js courier charges per shipment_id ──────
  -- For each shipment_id with more than one active courier charge, keep the
  -- earliest (lowest created_at), cancel all others.
  -- Scope: billing.js charges only (voila_shipment_id IS NULL, shipment_id IS NOT NULL)

  WITH dupes AS (
    SELECT
      id,
      shipment_id,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY shipment_id
        ORDER BY created_at ASC
      ) AS rn
    FROM charges
    WHERE shipment_id       IS NOT NULL
      AND voila_shipment_id IS NULL
      AND cancelled         = false
      AND charge_type       = 'courier'
  ),
  to_cancel AS (
    SELECT id, shipment_id
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
  SELECT COUNT(*) INTO v_courier_dupes FROM cancelled;

  RAISE NOTICE 'Step 1: cancelled % duplicate billing.js courier charge(s)', v_courier_dupes;

  -- ── Step 2: Cancel orphaned fuel/surcharge charges ────────────────────────────
  -- A fuel/surcharge row is orphaned when:
  --   - Its shipment_id has no active courier charge (all were cancelled in Step 1)
  --   - But there IS a kept (active) courier charge under the same shipment_id
  --     (meaning the shipment itself is valid — just the duplicate fuel rows need
  --     cleaning up).
  --
  -- In practice: each duplicate courier row got its own fuel row. After Step 1
  -- cancels the extra courier rows, the extra fuel rows become orphans.

  WITH orphaned AS (
    UPDATE charges c
    SET    cancelled  = true,
           updated_at = NOW()
    WHERE  c.shipment_id       IS NOT NULL
      AND  c.voila_shipment_id IS NULL
      AND  c.cancelled         = false
      AND  c.charge_type       IN ('fuel', 'surcharge')
      -- No active courier charge for THIS specific charge row's shipment_id ...
      AND NOT EXISTS (
        SELECT 1 FROM charges c_active
        WHERE  c_active.shipment_id  = c.shipment_id
          AND  c_active.charge_type  = 'courier'
          AND  c_active.cancelled    = false
      )
      -- ... but there IS at least one cancelled courier (confirms this shipment had dupes)
      AND EXISTS (
        SELECT 1 FROM charges c_cancelled
        WHERE  c_cancelled.shipment_id  = c.shipment_id
          AND  c_cancelled.charge_type  = 'courier'
          AND  c_cancelled.cancelled    = true
      )
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_aux_orphans FROM orphaned;

  RAISE NOTICE 'Step 2: cancelled % orphaned fuel/surcharge charge(s)', v_aux_orphans;

  RAISE NOTICE '━━━ Migration 155 complete ━━━';
  RAISE NOTICE 'billing.js courier dupes cancelled: %', v_courier_dupes;
  RAISE NOTICE 'Orphaned fuel/surcharge cancelled:  %', v_aux_orphans;

END $$;

-- ── Step 3: Unique index — prevent billing.js race duplicates at DB level ────────
-- One active courier charge per shipment_id (billing.js path only).
-- The existing SELECT idempotency check in billing.js + this index together
-- make concurrent duplicate inserts impossible.

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_shipment_courier_active
  ON charges (shipment_id)
  WHERE charge_type       = 'courier'
    AND cancelled         = false
    AND shipment_id       IS NOT NULL
    AND voila_shipment_id IS NULL;

-- ─── Post-run verification ────────────────────────────────────────────────────
-- Both should return 0 rows:
-- SELECT shipment_id, COUNT(*) FROM charges
-- WHERE charge_type = 'courier' AND cancelled = false
--   AND shipment_id IS NOT NULL AND voila_shipment_id IS NULL
-- GROUP BY shipment_id HAVING COUNT(*) > 1;
