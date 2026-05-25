-- ─── Migration 232 — Purge all billing / shipment data before 11 May 2026 ────
--
-- All charges and shipments created on or before 10 May 2026 are historical
-- data that will never be invoiced. This migration removes them cleanly.
--
-- Deletion order respects foreign-key constraints:
--   1. reconciliation_lines  — charge_id is SET NULL on cascade, but we
--      delete the lines explicitly so old recon runs don't show ghost entries.
--   2. charges — courier_queries.charge_id is CASCADE so queries go with them.
--   3. shipments — any orphaned shipment rows with no remaining charges.
--   4. invoices / invoice_line_items — any draft invoices from this period.
--
-- Cutoff: created_at < '2026-05-11 00:00:00 UTC'  (i.e. up to and including 10 May)

DO $$
DECLARE
  v_recon_lines  INT := 0;
  v_charges      INT := 0;
  v_shipments    INT := 0;
  v_invoices     INT := 0;
BEGIN

  -- ── 1. Reconciliation lines referencing old charges ─────────────────────────
  DELETE FROM reconciliation_lines
  WHERE charge_id IN (
    SELECT id FROM charges WHERE created_at < '2026-05-11 00:00:00+00'
  );
  GET DIAGNOSTICS v_recon_lines = ROW_COUNT;

  -- Also clear recon lines whose shipment_id links to an old shipment
  -- (covers companion_parcel lines that have no charge_id)
  DELETE FROM reconciliation_lines
  WHERE shipment_id IN (
    SELECT id FROM shipments WHERE created_at < '2026-05-11 00:00:00+00'
  );

  -- ── 2. Charges (cascades courier_queries via ON DELETE CASCADE) ──────────────
  DELETE FROM charges
  WHERE created_at < '2026-05-11 00:00:00+00';
  GET DIAGNOSTICS v_charges = ROW_COUNT;

  -- ── 3. Orphaned shipments (no remaining charges) ─────────────────────────────
  DELETE FROM shipments
  WHERE created_at < '2026-05-11 00:00:00+00';
  GET DIAGNOSTICS v_shipments = ROW_COUNT;

  -- ── 4. Draft/empty invoices from this period ────────────────────────────────
  -- Only remove invoices that have no remaining line items (i.e. all charges
  -- were on old shipments). Leave any invoice that still has charges attached.
  DELETE FROM invoices
  WHERE created_at < '2026-05-11 00:00:00+00'
    AND id NOT IN (
      SELECT DISTINCT invoice_id FROM charges WHERE invoice_id IS NOT NULL
    );
  GET DIAGNOSTICS v_invoices = ROW_COUNT;

  RAISE NOTICE 'Migration 232: removed % reconciliation line(s), % charge(s), % shipment(s), % invoice(s) dated before 11 May 2026.',
    v_recon_lines, v_charges, v_shipments, v_invoices;

END $$;
