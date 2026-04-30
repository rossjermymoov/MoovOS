-- ─── Migration 126 — Carrier CSV Column Profiles ─────────────────────────────
--
-- Stores saved column mappings for each carrier's invoice CSV format.
-- Carriers can change their file layout over time, so multiple profiles
-- per carrier are supported (e.g. "DHL Standard", "DHL Weekly Express").
--
-- column_map is a JSONB object mapping our internal field names to the
-- CSV column header names the user selected:
--   {
--     "tracking_number":  "Consignment No",
--     "account_number":   "Account",
--     "service_code":     "Service Code",
--     "charge_type":      "",
--     "carrier_amount":   "Nett Amount",
--     "billed_weight_kg": "Weight (Kg)",
--     "invoice_ref":      "Invoice Number",
--     "invoice_date":     "Invoice Date",
--     "parcel_count":     "No of Items"
--   }
--
-- is_default: the profile to auto-apply when the carrier is selected.
--   At most one profile per carrier can be the default — enforced by
--   a partial unique index.

CREATE TABLE IF NOT EXISTS carrier_csv_profiles (
  id           SERIAL       PRIMARY KEY,
  carrier_id   INTEGER      NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  profile_name VARCHAR(100) NOT NULL,
  column_map   JSONB        NOT NULL,
  is_default   BOOLEAN      NOT NULL DEFAULT false,
  created_by   UUID         REFERENCES staff(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (carrier_id, profile_name)
);

-- Only one default per carrier
CREATE UNIQUE INDEX IF NOT EXISTS idx_csv_profiles_default
  ON carrier_csv_profiles (carrier_id)
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_csv_profiles_carrier
  ON carrier_csv_profiles (carrier_id);

COMMENT ON TABLE carrier_csv_profiles IS
  'Saved CSV column mappings per carrier. Each row is a named profile that
   maps our internal field names to the column headers in that carrier''s
   invoice file. Profiles can be loaded in the upload wizard so users do
   not have to re-map columns on every run.';
