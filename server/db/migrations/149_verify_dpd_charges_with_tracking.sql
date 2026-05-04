-- ─── Migration 149 — Mass-verify old DPD charges that have tracking codes ───
--
-- PROBLEM:
--   The reconciliation pool requires charges.verified = true.
--   Charges are verified when a tracking event fires in tracking.js
--   (upsertEvent sets verified=true on matching charges), or via
--   catchUpVerified() at server startup.
--
--   HOWEVER: purgeOldTrackingData() deletes parcels + tracking_events
--   older than 30 days every day. After 30 days, catchUpVerified()
--   can no longer find any matching tracking events and leaves old
--   DPD charges permanently unverified — locked out of the pool forever.
--
--   This is why reconciliation sticks at ~55%: only charges booked within
--   the past ~30 days are verified and in the pool. Everything older
--   falls to the external_booking path (postcode zone + rate card guess),
--   which coincidentally matches around 55% of lines.
--
-- FIX:
--   For DPD charges with a shipment record that has tracking_codes populated,
--   the consignment number was assigned by DPD (label was generated and
--   DPD accepted the booking). If DPD is invoicing for it, the parcel was
--   collected. billing.js only creates charges after receiving a DC webhook,
--   so the existence of a charge + tracking_codes on the shipment is strong
--   evidence of a genuine completed shipment.
--
--   We use a 3-day cutoff so that very recent charges still go through the
--   normal tracking-event verification path (giving tracking.js a chance
--   to fire first). Charges 3+ days old that DPD are billing for can
--   safely be considered verified.
--
-- SCOPE:
--   Only DPD charges are affected (courier ILIKE 'DPD').
--   Only unverified, non-cancelled courier charges.
--   Only charges whose shipment has tracking_codes populated.
--   Only charges older than 3 days (let recent ones verify normally).
--
-- IDEMPOTENT: SET verified = true is safe to re-run.

DO $$
DECLARE
  v_count INTEGER;
BEGIN

  UPDATE charges c
  SET    verified   = true,
         updated_at = NOW()
  FROM   shipments  s
  JOIN   couriers   cu ON (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD')
  WHERE  c.shipment_id  = s.id
    AND  c.verified     = false
    AND  c.cancelled    = false
    AND  c.charge_type  = 'courier'
    -- Only DPD shipments
    AND  s.courier ILIKE cu.code
    -- Tracking codes must be present (DPD assigned a consignment number → label generated)
    AND  s.tracking_codes IS NOT NULL
    AND  array_length(s.tracking_codes, 1) > 0
    -- Give recent charges 3 days to be verified normally via tracking events
    AND  c.created_at < NOW() - INTERVAL '3 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migration 149: verified % DPD charge(s) with existing tracking codes.', v_count;

END $$;

-- Also verify any DPD charges where the charge itself has a tracking_code column
-- populated (new-style pricingEngine.js charges) — same logic, same age gate.
DO $$
DECLARE
  v_count INTEGER;
BEGIN

  UPDATE charges c
  SET    verified   = true,
         updated_at = NOW()
  FROM   couriers cu
  WHERE  (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD')
    AND  c.verified    = false
    AND  c.cancelled   = false
    AND  c.charge_type = 'courier'
    AND  c.tracking_code IS NOT NULL
    -- Link to courier via courier_service_id if available
    AND EXISTS (
      SELECT 1 FROM courier_services cs
      WHERE  cs.id         = c.courier_service_id
        AND  cs.courier_id = cu.id
    )
    AND  c.created_at < NOW() - INTERVAL '3 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migration 149 (new-style): verified % DPD charge(s) with tracking_code on charge.', v_count;

END $$;
