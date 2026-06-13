-- 302_add_template_wrappers.sql
-- "Top-and-Tail" communication templates per courier. Hardcoded header/footer
-- boilerplate wraps Gemini's dynamic middle analysis when drafting outbound mail.
-- (Migration numbered 302 — 300/301 already taken by courier_routing + approvals.)

ALTER TABLE courier_routing_rules
  ADD COLUMN IF NOT EXISTS courier_header_template  TEXT DEFAULT 'Dear Carrier Team,',
  ADD COLUMN IF NOT EXISTS courier_footer_template  TEXT DEFAULT E'Many thanks,\nMoov Parcel Team',
  ADD COLUMN IF NOT EXISTS customer_header_template TEXT DEFAULT E'Hi {{customer_name}},\n\nHere is an operational update regarding your delivery:',
  ADD COLUMN IF NOT EXISTS customer_footer_template TEXT DEFAULT E'Kind regards,\nMoov Parcel Support Team';

-- Backfill existing rows (ADD COLUMN ... DEFAULT only fills new rows on some PG
-- versions when added together; set explicitly to be safe).
UPDATE courier_routing_rules SET
  courier_header_template  = COALESCE(courier_header_template,  'Dear Carrier Team,'),
  courier_footer_template  = COALESCE(courier_footer_template,  E'Many thanks,\nMoov Parcel Team'),
  customer_header_template = COALESCE(customer_header_template, E'Hi {{customer_name}},\n\nHere is an operational update regarding your delivery:'),
  customer_footer_template = COALESCE(customer_footer_template, E'Kind regards,\nMoov Parcel Support Team');
