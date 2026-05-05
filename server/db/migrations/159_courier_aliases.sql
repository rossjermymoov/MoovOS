-- ─── Migration 159 — courier aliases ─────────────────────────────────────────
--
-- Problem:
--   The Voila / DC webhook writes shipments.courier using whatever string the
--   carrier API returns.  These strings don't always match couriers.code or
--   couriers.name exactly, so buildVerifiedPool's strict exact-match filter
--   silently excludes those charges from the reconciliation pool.
--
--   Confirmed mismatches (from /api/reconciliation/pool-courier-gap):
--     'DHLParcelUKCloud' → should match couriers WHERE code = 'DHL'   (440 charges)
--     'UPSv2'           → should match couriers WHERE code = 'UPS'    (4 charges)
--     'DGInternational' → no matching carrier record yet               (96 charges — PENDING)
--
-- Fix:
--   Add couriers.aliases TEXT[] — an array of known webhook variant strings.
--   buildVerifiedPool is updated to also check s.courier = ANY(aliases).
--   Existing shipment records are NOT modified — the alias lives on the carrier,
--   not the shipment, so future webhook variants can be added without touching history.
--
-- DGInternational is intentionally NOT aliased here — it has no matching carrier
-- record in this database.  A separate migration will be written once the carrier
-- is identified by the operator.
--
-- IDEMPOTENT: safe to re-run.

ALTER TABLE couriers ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT '{}';

-- DHL: webhook writes 'DHLParcelUKCloud'
UPDATE couriers
SET    aliases = ARRAY['DHLParcelUKCloud']
WHERE  code = 'DHL'
  AND  NOT ('DHLParcelUKCloud' = ANY(aliases));

-- UPS: webhook writes 'UPSv2'
UPDATE couriers
SET    aliases = ARRAY['UPSv2']
WHERE  code = 'UPS'
  AND  NOT ('UPSv2' = ANY(aliases));
