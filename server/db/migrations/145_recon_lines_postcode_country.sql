-- ─── Migration 145 — Add postcode and country to reconciliation_lines ────────
--
-- Delivery postcode and country are captured from the carrier CSV so the
-- reconciliation engine can:
--   1. Resolve the correct zone from the postcode (Highland, NI, Channel Islands,
--      Mainland, etc.) for external bookings and any line where the pool charge
--      has no zone_id.
--   2. Route international lines to the correct service tier.
--   3. Give operators visibility of where each parcel was going without having
--      to cross-reference the original carrier invoice.
--
-- Both columns are nullable — DHL and other carriers that don't include a
-- delivery postcode column in their CSV will simply leave them NULL.

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS ship_to_postcode VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS ship_to_country  VARCHAR(5)   NULL;

COMMENT ON COLUMN reconciliation_lines.ship_to_postcode IS
  'Delivery postcode extracted from the carrier CSV. Used to resolve zone for '
  'external bookings and as a display field in the RunDetailPage line grid.';

COMMENT ON COLUMN reconciliation_lines.ship_to_country IS
  'Destination country ISO code (e.g. GB, IE, DE) from the carrier CSV. '
  'Used to route international lines and verify zone selection.';

-- Index to support "show all lines for a given postcode district" queries
-- (useful for reviewing Highland / NI / Channel Islands clusters).
CREATE INDEX IF NOT EXISTS idx_recon_lines_postcode
  ON reconciliation_lines (ship_to_postcode)
  WHERE ship_to_postcode IS NOT NULL;
