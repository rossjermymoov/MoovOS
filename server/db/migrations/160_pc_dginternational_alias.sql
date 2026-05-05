-- ─── Migration 160 — Pro Carrier alias: DGInternational ─────────────────────
--
-- The Voila / DC webhook writes shipments.courier = 'DGInternational' for
-- Pro Carrier shipments.  couriers.code = 'PC', so the strict exact-match in
-- buildVerifiedPool never found these 96 charges.
--
-- Fix: add 'DGInternational' to Pro Carrier's aliases array.
-- buildVerifiedPool already checks unnest(aliases) since migration 159.
--
-- IDEMPOTENT: safe to re-run.

UPDATE couriers
SET    aliases = array_append(aliases, 'DGInternational')
WHERE  code = 'PC'
  AND  NOT ('DGInternational' = ANY(aliases));
