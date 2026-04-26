-- -----------------------------------------------------------------------------
-- Migration 103 — Add name column to weight_bands
--
-- Allows weight bands to be given a descriptive label (e.g. "Parcel",
-- "Light Packet", "Heavy Freight") instead of being identified only by
-- their numeric min/max bounds.  The name is optional — existing bands
-- remain valid with a NULL name.
-- -----------------------------------------------------------------------------

ALTER TABLE weight_bands
  ADD COLUMN IF NOT EXISTS name VARCHAR(100);
