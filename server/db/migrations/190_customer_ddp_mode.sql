-- ─── Migration 190 — Customer DDP mode flag ──────────────────────────────────
--
-- Adds a ddp_mode boolean to the customers table.
--
-- When ddp_mode = true the Reconciliation Engine will use the customer's
-- per-customer service code overrides (stored in courier_service_code_mappings
-- WHERE customer_id IS NOT NULL) to redirect standard invoice codes to their
-- DDP equivalents (e.g. "Air Express" → DPD-10DDP) for rate-card lookups.
--
-- The flag is purely a UI convenience — it is not read by the engine directly.
-- The engine always checks courier_service_code_mappings for per-customer
-- overrides. ddp_mode = true is the signal that ALL of that customer's
-- air-service overrides were created via the DDP toggle rather than manually.
--
-- courier_service_code_mappings already has customer_id (Migration 125).
-- No schema changes are needed to that table.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS ddp_mode BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN customers.ddp_mode IS
  'When true, this customer books exclusively on DDP (duty-paid) air services. '
  'Their courier_service_code_mappings entries redirect standard air invoice codes '
  '(e.g. Air Express, Air Classic) to the DDP rate-card variants (e.g. DPD-10DDP). '
  'Set via the DDP toggle on the customer settings page.';
