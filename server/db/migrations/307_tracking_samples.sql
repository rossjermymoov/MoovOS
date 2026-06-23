-- 307_tracking_samples.sql
-- Sample-driven tracking formats. Admins paste real sample tracking number(s)
-- per courier (one per line); the engine derives the validation shape from them
-- automatically — no regex writing required. Multiple samples cover variants
-- (e.g. the different Yodel formats routed via AGL).

ALTER TABLE courier_routing_rules
  ADD COLUMN IF NOT EXISTS tracking_samples TEXT;

UPDATE courier_routing_rules SET tracking_samples = '9753172394'         WHERE courier_code = 'dpd' AND tracking_samples IS NULL;
UPDATE courier_routing_rules SET tracking_samples = '1Z999AA10123456784' WHERE courier_code = 'ups' AND tracking_samples IS NULL;
