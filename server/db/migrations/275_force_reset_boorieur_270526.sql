-- Migration 275: Force-reset BOORIEUR-270526 for clean re-finalization
--
-- Previous migrations (272, 274) used WHERE finalized = true, so if the run
-- was in a non-finalized state at the moment they ran, the UPDATE was a no-op.
-- This migration removes all conditions and does a hard reset regardless of
-- current state, then deletes ALL finalized_billing_lines for the run so that
-- re-finalization starts from a completely clean slate.
--
-- ACTION REQUIRED AFTER DEPLOYING
-- ────────────────────────────────
-- 1. Open BOORIEUR-270526 reconciliation run.
-- 2. Click "Finalise Run".
-- 3. Download the customer CSV — each tracking number should appear once,
--    with correct base / fuel / named-surcharge breakdown.

-- ── 1. Delete ALL finalized_billing_lines for this run ────────────────────────
DELETE FROM finalized_billing_lines
WHERE run_id = (
  SELECT id FROM reconciliation_runs
  WHERE invoice_ref = 'BOORIEUR-270526'
  LIMIT 1
);

-- ── 2. Force un-finalize (no finalized = true guard) ─────────────────────────
UPDATE reconciliation_runs
SET    finalized    = false,
       finalized_at = NULL,
       finalized_by = NULL,
       status       = 'processing'
WHERE  invoice_ref = 'BOORIEUR-270526';
