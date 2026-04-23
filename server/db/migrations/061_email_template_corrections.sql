-- 061: Correct email template sign-offs and service name display
--
-- Changes:
--   1. Sign-off: remove individual agent name — sign off as "The Moov Parcel Team"
--   2. Service display: was "{{service_name}} via {{courier_name}}" which could
--      produce "Next Day via DPD" — now just {{service_name}} since the service
--      name stored on the parcel already includes the courier (e.g. "DPD Next Day")

-- Fix service name display in the parcel details card
UPDATE email_templates
SET body_html = REPLACE(body_html,
  '{{service_name}} via {{courier_name}}',
  '{{service_name}}'
)
WHERE body_html LIKE '%{{service_name}} via {{courier_name}}%';

-- Fix sign-off: remove individual agent name, sign as team
-- Pattern 1: the two-line name + role sign-off
UPDATE email_templates
SET body_html = REPLACE(body_html,
  '<p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>',
  '<p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">The Moov Parcel Team</p>'
)
WHERE body_html LIKE '%{{agent_name}}%';

-- Fix sign-off in claim_approved (uses same pattern but different surrounding text)
UPDATE email_templates
SET body_html = REPLACE(body_html,
  '<p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>',
  '<p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">The Moov Parcel Team</p>'
)
WHERE template_key = 'claim_approved'
  AND body_html LIKE '%{{agent_name}}%';

-- Catch any remaining {{agent_name}} references (belt and braces)
UPDATE email_templates
SET body_html = REPLACE(body_html, '{{agent_name}}', 'The Moov Parcel Team')
WHERE body_html LIKE '%{{agent_name}}%';

-- Also update subject templates — remove agent_name from subjects if present
UPDATE email_templates
SET subject_template = REPLACE(subject_template, '{{agent_name}}', 'The Moov Parcel Team')
WHERE subject_template LIKE '%{{agent_name}}%';
