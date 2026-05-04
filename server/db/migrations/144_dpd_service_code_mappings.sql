-- ─── Migration 144 — DPD Invoice Service Code Mappings ──────────────────────
--
-- DPD invoices carry a numeric "Service Code" column that does NOT match the
-- suffix of our internal courier_services.service_code values (DPD-14, DPD-11,
-- DPD-19, etc.).  Without explicit mappings the reconciliation engine hits the
-- unknown_service_code gate and marks every DPD line as unmatched before any
-- price comparison runs.
--
-- Confirmed codes from DPD Standard Invoice CSV format:
--   2  → Next Day (NXTDAY)   → DPD-14 (DPD Next Day 10.30)
--            Europa confirmed as Next Day 10:30 at carrier cost rate
--   1  → Two Day  (2DAY)     → DPD-11 (DPD Two Day)
--   9  → Classic  (CLASIC)   → DPD-19 (DPD Classic Parcel)
--   0  → Express  (EXPRSS)   → DPD-80 (DPD Direct — best fit; verify per account)
--
-- All mappings are global (customer_id IS NULL) so they apply to every DPD
-- invoice run.  Customer-specific overrides can be added via the Reconciliation
-- → Service Code Mappings UI.
--
-- NOTE: If your DPD account uses Next Day standard (DPD-12) under code "2"
-- rather than Next Day 10:30 (DPD-14), update via the UI.

INSERT INTO courier_service_code_mappings
  (carrier_id, courier_code, service_id, surcharge_id, customer_id, is_active, notes)
SELECT
  cu.id,
  v.code,
  cs.id,
  NULL,
  NULL,
  true,
  v.note
FROM couriers cu
CROSS JOIN (VALUES
  ('2', 'DPD-14', 'DPD invoice code 2 = NXTDAY → DPD Next Day 10.30 (DPD-14). Seeded by migration 144. Adjust via UI if your account maps code 2 to DPD-12 instead.'),
  ('1', 'DPD-11', 'DPD invoice code 1 = 2DAY → DPD Two Day (DPD-11). Seeded by migration 144.'),
  ('9', 'DPD-19', 'DPD invoice code 9 = CLASIC → DPD Classic Parcel (DPD-19). Seeded by migration 144.'),
  ('0', 'DPD-80', 'DPD invoice code 0 = EXPRSS → DPD Direct (DPD-80). Seeded by migration 144. Verify against your DPD account.')
) AS v(code, svc_code, note)
JOIN courier_services cs ON cs.service_code = v.svc_code
WHERE (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD')
  AND NOT EXISTS (
    SELECT 1 FROM courier_service_code_mappings m
    WHERE m.carrier_id   = cu.id
      AND m.courier_code = v.code
      AND m.customer_id  IS NULL
  )
ORDER BY cu.id, v.code;
