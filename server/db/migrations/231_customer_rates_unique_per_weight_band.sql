-- ─── Migration 231 — Allow multiple weight bands per zone in customer_rates ───
--
-- Migration 224 enforced UNIQUE (customer_id, service_id, zone_name).
-- This made sense when every service had a single "Parcel" weight class,
-- but domestic services (DPD, Yodel, etc.) have multiple weight bands per zone
-- (e.g. 0-2KG, 2-5KG, 10KG+).  With the old constraint every second weight-band
-- entry silently overwrote the first via ON CONFLICT DO UPDATE.
--
-- Fix: widen the unique key to include weight_class_name so each
-- (customer, service, zone, weight_band) combination gets its own row.

DO $$
BEGIN
  -- Drop the too-narrow constraint added in migration 224
  ALTER TABLE customer_rates
    DROP CONSTRAINT IF EXISTS customer_rates_unique_zone;

  -- New constraint: one price per customer × service × zone × weight band
  ALTER TABLE customer_rates
    ADD CONSTRAINT customer_rates_unique_zone
    UNIQUE (customer_id, service_id, zone_name, weight_class_name);

  RAISE NOTICE 'Migration 231: unique constraint widened to (customer_id, service_id, zone_name, weight_class_name).';
END $$;
