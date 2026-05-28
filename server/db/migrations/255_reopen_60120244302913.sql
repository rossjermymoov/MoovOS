-- Migration 255: Reset incorrectly-resolved line for tracking 60120244302913
-- This line was resolved with manual_price = £5.75 on a surcharge line,
-- which incorrectly set the base freight sell price instead of adding a surcharge.
-- Reset it back to unmatched so it can be re-resolved as map_to_surcharge.

UPDATE reconciliation_lines
SET    status                = 'unmatched',
       corrected_by          = NULL,
       corrected_sell_price  = NULL,
       corrected_cost_price  = NULL,
       charge_id             = NULL,
       mapping_id            = NULL,
       resolved_by           = NULL,
       resolved_at           = NULL,
       resolution_notes      = NULL,
       expected_amount       = NULL,
       delta                 = NULL
WHERE  tracking_number = '60120244302913'
  AND  status = 'corrected'
  AND  corrected_by = 'human';

-- Recount the affected run
UPDATE reconciliation_runs rr
SET    matched_count   = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'matched'),
       corrected_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'corrected'),
       unmatched_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'unmatched'),
       status          = 'needs_review'
WHERE  rr.id IN (
  SELECT DISTINCT run_id FROM reconciliation_lines WHERE tracking_number = '60120244302913'
);
