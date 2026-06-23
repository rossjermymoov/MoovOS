-- 306_tracking_formats.sql
-- Per-courier tracking-number formats. The automation validates any candidate
-- consignment against the matching courier's pattern (defence against junk like
-- phone numbers / words being treated as tracking), and shows admins an example.
--
-- Patterns are case-insensitive regex tested against a normalised (spaces
-- stripped, upper-cased; DPD '1550' prefix dropped) candidate.

ALTER TABLE courier_routing_rules
  ADD COLUMN IF NOT EXISTS tracking_pattern TEXT,
  ADD COLUMN IF NOT EXISTS tracking_example VARCHAR(120);

-- Seed the well-known formats. Evri/Yodel left NULL on purpose — confirm their
-- real shapes via GET /api/queries/tracking-shapes, then set them in Settings.
UPDATE courier_routing_rules SET
  tracking_pattern = '^(1550)?\d{10}[A-Z]?$',
  tracking_example = '4366834818  (or 15504366834818)'
WHERE courier_code = 'dpd';

UPDATE courier_routing_rules SET
  tracking_pattern = '^1Z[A-Z0-9]{16}$',
  tracking_example = '1Z999AA10123456784'
WHERE courier_code = 'ups';
