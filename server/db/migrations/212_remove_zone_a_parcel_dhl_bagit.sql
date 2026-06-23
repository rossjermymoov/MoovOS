-- ─── Migration 212 — No-op (superseded by corrected 211) ────────────────────
--
-- Migration 211 was corrected before running to only delete
-- zone_name='Zone A' + weight_class_name='Parcel' rows for DHL Bag It.
-- This migration is a no-op kept only for sequence integrity.

DO $$ BEGIN
  RAISE NOTICE 'Migration 212: no-op.';
END $$;
