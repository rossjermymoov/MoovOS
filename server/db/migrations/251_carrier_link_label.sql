-- ─── Migration 251 — Add label to customer_carrier_links ─────────────────────
--
-- Customers with multiple accounts for the same carrier need a way to identify
-- each one (e.g. "Perishable", "Ambient", "Standard").  The label is optional —
-- single-account customers leave it NULL.
--
-- Also adds new API-friendly endpoints by link ID (the PATCH/DELETE routes were
-- previously keyed by courier_id, which is ambiguous when a customer has >1 row
-- per carrier).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS is safe to re-run.

ALTER TABLE customer_carrier_links
  ADD COLUMN IF NOT EXISTS label VARCHAR(100);
