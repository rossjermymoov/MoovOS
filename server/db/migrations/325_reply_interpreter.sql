-- 325_reply_interpreter.sql
-- WISMO Phase 2 (MOS-3): Courier Reply Interpreter. Classifies an inbound courier
-- reply before deciding what to draft, instead of always translating it straight
-- to the customer. generic_reply_patterns follows the same free-text, ops-editable
-- precedent as courier_routing_rules.tracking_samples.

ALTER TABLE query_emails
  ADD COLUMN IF NOT EXISTS reply_classification TEXT
    CHECK (reply_classification IN
      ('resolved','needs_more_info','generic_non_answer','gdpr_address_request','ambiguous'));

ALTER TABLE courier_routing_rules
  ADD COLUMN IF NOT EXISTS generic_reply_patterns TEXT;

UPDATE courier_routing_rules
   SET generic_reply_patterns = 'unexpected issue' || E'\n' || 'we are investigating this for you'
 WHERE courier_code = 'dpd' AND generic_reply_patterns IS NULL;
