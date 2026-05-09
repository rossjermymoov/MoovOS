-- ─── Migration 168 — corrected sell/cost price on reconciliation_lines ──────────
--
-- WHY:
--   When the carrier invoices a shipment at a different weight (or amount) than
--   what was booked, the reconciliation engine marks the line as 'corrected'.
--   Previously, the billing preview used the ORIGINAL charge's sell_price (set at
--   booking time at the DECLARED weight) as OUR SELL — which, after OUR COST was
--   correctly set to carrier_amount (the actual billed amount at the CORRECTED
--   weight), produced NEGATIVE MARGIN on every corrected line.
--
--   The fix: when the engine processes a corrected pool-matched line it now looks
--   up the customer's sell rate at the BILLED weight and stores it here.
--   At finalization, these corrected values are written back to the charges table
--   so the finance table reflects the permanently reconciled cost and margin.
--
-- COLUMNS:
--   corrected_sell_price  — what we will charge the customer, recomputed at the
--                           carrier's billed weight from the customer rate card.
--                           NULL for matched lines (no correction needed) and for
--                           carrier_direct lines (sell was already computed at
--                           billed weight when the charge was first created).
--
--   corrected_cost_price  — the carrier's actual billed amount for this line
--                           (= carrier_amount). Stored here so finalization can
--                           write it back to charges.cost_price in a single pass
--                           without re-reading reconciliation_lines.carrier_amount.
--                           NULL for matched lines (cost_price ≈ carrier_amount).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS.

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS corrected_sell_price NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS corrected_cost_price NUMERIC(10,4);

-- Index for finalization write-back query (finds all lines with corrections for a run)
CREATE INDEX IF NOT EXISTS idx_recon_lines_corrected_sell
  ON reconciliation_lines (run_id, charge_id)
  WHERE corrected_sell_price IS NOT NULL;
