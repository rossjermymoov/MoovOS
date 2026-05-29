-- Migration 263: Link carrier_direct freight charges that have shipment_id = NULL
-- to their corresponding shipments (matched by tracking_code).
--
-- Root cause: before the task-69 fix, the shipment fallback lookup inside
-- processLine was filtered with AND event_type = 'carrier_direct', which
-- silently missed OMS-originated shipments. Charges were created with
-- shipment_id = NULL, so createCarrierDirectSurcharges was never called,
-- meaning fuel and GEC charges were never inserted for those shipments.
--
-- This migration links those charges to their shipments so that the
-- backfill-carrier-direct-surcharges endpoint (and its pre-pass) can create
-- the missing fuel/GEC charges on the next run.
--
-- Safe to re-run (WHERE clause restricts to shipment_id IS NULL, so already-
-- linked charges are never touched).

UPDATE charges c
SET    shipment_id = (
  SELECT s.id
  FROM   shipments s
  WHERE  c.tracking_code = ANY(s.tracking_codes)
  ORDER  BY s.created_at DESC
  LIMIT  1
),
       updated_at = NOW()
WHERE  c.charge_type   = 'courier'
  AND  c.source        = 'carrier_direct'
  AND  c.shipment_id   IS NULL
  AND  c.cancelled     = false
  AND  c.tracking_code IS NOT NULL
  AND  EXISTS (
    SELECT 1 FROM shipments s2
    WHERE  c.tracking_code = ANY(s2.tracking_codes)
  );
