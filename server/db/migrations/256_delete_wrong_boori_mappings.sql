-- Migration 256: Delete incorrect mapping rules created from Boori warning lines
-- These were created when warning lines (sell_surcharge_missing) were resolved
-- as map_to_surcharge with "Apply to all" — they would re-apply on re-import
-- and overwrite base freight sell prices with surcharge amounts again.
-- Safe to delete: these rules should not exist for sell_surcharge_missing lines.

DELETE FROM reconciliation_mappings
WHERE  resolution_type = 'map_to_surcharge'
  AND  created_at > NOW() - INTERVAL '2 hours'
  AND  created_from_line_id IN (
    SELECT id FROM reconciliation_lines
    WHERE  unmatched_reason = 'sell_surcharge_missing'
       OR  status = 'warning'
  );

-- Also reset any warning lines that were incorrectly corrected in the last 2 hours
UPDATE reconciliation_lines
SET    status                = 'warning',
       corrected_by          = NULL,
       corrected_sell_price  = NULL,
       corrected_cost_price  = NULL,
       resolved_by           = NULL,
       resolved_at           = NULL,
       resolution_notes      = NULL,
       mapping_id            = NULL
WHERE  unmatched_reason = 'sell_surcharge_missing'
  AND  status = 'corrected'
  AND  corrected_by = 'human'
  AND  resolved_at > NOW() - INTERVAL '2 hours';

-- Recount affected runs
UPDATE reconciliation_runs rr
SET    corrected_count = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'corrected'),
       warning_count   = (SELECT COUNT(*) FROM reconciliation_lines WHERE run_id = rr.id AND status = 'warning'),
       status          = 'needs_review'
WHERE  rr.id IN (
  SELECT DISTINCT run_id FROM reconciliation_lines
  WHERE  unmatched_reason = 'sell_surcharge_missing'
    AND  resolved_at > NOW() - INTERVAL '2 hours'
);
