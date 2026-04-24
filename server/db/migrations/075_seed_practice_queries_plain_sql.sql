-- 075: Seed practice queries — plain SQL, no PL/pgSQL
--
-- Previous attempts (073, 074) used DO $$ blocks. This migration uses
-- plain CTEs to avoid any PL/pgSQL execution issues.
-- Each CTE creates one query + its inbound email in a single statement.
-- Skips seeding if 5+ queries already exist.

-- ── Query 1: Whereabouts / Open ──────────────────────────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    created_at, updated_at
  )
  SELECT
    '15000000001',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'whereabouts'::query_type,
    'open'::query_status,
    'Where is my parcel?',
    'Customer asking for update — parcel showing in transit for 2 days with no movement.',
    c.primary_email, true, false,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, received_at, created_at)
SELECT
  nq.id,
  'inbound_customer'::email_direction,
  'Where is my parcel?',
  'Hi, my parcel (ref: 15000000001) has been showing in transit for 2 days and has not arrived. Could you please look into this? Thanks',
  nq.sender_email,
  'queries@moovparcel.co.uk',
  false,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 2: Not Delivered / Awaiting Courier (attention) ────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    attention_reason, attention_raised_at,
    created_at, updated_at
  )
  SELECT
    '15000000002',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'not_delivered'::query_type,
    'awaiting_courier'::query_status,
    'Parcel shows delivered but not received',
    'Tracking shows delivered at 14:32 but customer reports non-receipt. GPS data requested from courier.',
    c.primary_email, true, true,
    'Customer insists parcel not received but tracking shows GPS scan as delivered. Manual review needed.',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 1
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
SELECT
  nq.id,
  'outbound_customer'::email_direction,
  'Re: Parcel shows delivered but not received',
  'Dear ' || nq.customer_name || E',\n\nWe have contacted DPD and requested GPS delivery scan data and photo evidence for consignment 15000000002. We will update you within 24 hours.\n\nKind regards\nMoov Parcel Team',
  'queries@moovparcel.co.uk',
  nq.sender_email,
  false,
  NOW() - INTERVAL '9 days' + INTERVAL '3 hours',
  NOW() - INTERVAL '9 days' + INTERVAL '3 hours'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 3: Damaged / Awaiting Customer Info ─────────────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    created_at, updated_at
  )
  SELECT
    '15000000003',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'damaged'::query_type,
    'awaiting_customer_info'::query_status,
    'Parcel arrived damaged',
    'Parcel arrived with visible external damage. Contents (electronics) reported broken. Awaiting photos and invoice.',
    c.primary_email, true, false,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 2
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
SELECT
  nq.id,
  'outbound_customer'::email_direction,
  'Re: Parcel arrived damaged',
  'Dear ' || nq.customer_name || E',\n\nTo progress your damage claim we need:\n\n1. Photos of the outer packaging damage\n2. Photos of the damaged item\n3. A cost price invoice in PDF format\n\nPlease reply with these at your earliest convenience.\n\nKind regards\nMoov Parcel Team',
  'queries@moovparcel.co.uk',
  nq.sender_email,
  false,
  NOW() - INTERVAL '8 days' + INTERVAL '3 hours',
  NOW() - INTERVAL '8 days' + INTERVAL '3 hours'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 4: Missing Items / Awaiting Customer Info ───────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    created_at, updated_at
  )
  SELECT
    '15000000004',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'missing_items'::query_type,
    'awaiting_customer_info'::query_status,
    'Items missing from my delivery',
    'Parcel arrived intact externally but 2 of 4 items missing. Awaiting goods description from customer.',
    c.primary_email, true, false,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 3
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, received_at, created_at)
SELECT
  nq.id,
  'inbound_customer'::email_direction,
  'Items missing from my delivery',
  'My delivery arrived today but two of the four items are missing from the box. The packaging looked intact from the outside.',
  nq.sender_email,
  'queries@moovparcel.co.uk',
  false,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 5: Parcel missing 2 weeks / Awaiting Courier (attention) ────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    attention_reason, attention_raised_at,
    created_at, updated_at
  )
  SELECT
    '15000000005',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'other'::query_type,
    'awaiting_courier'::query_status,
    'Parcel missing for 2 weeks — urgent',
    'No tracking movement for 14 days. Last scan at depot. Full trace investigation opened. Possible total loss.',
    c.primary_email, true, true,
    'Parcel missing for 14+ days — possible total loss. Escalation to formal claim likely required.',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 4
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, received_at, created_at)
SELECT
  nq.id,
  'inbound_customer'::email_direction,
  'Parcel missing for 2 weeks — urgent',
  'I am writing to report that a parcel sent to my customer has been missing for over two weeks. Last tracking was at your depot. This is causing serious issues. URGENT.',
  nq.sender_email,
  'queries@moovparcel.co.uk',
  false,
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 6: Wrong address / Awaiting Courier ─────────────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    created_at, updated_at
  )
  SELECT
    '15000000006',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'wrong_address'::query_type,
    'awaiting_courier'::query_status,
    'Parcel delivered to wrong address',
    'Driver appears to have delivered to wrong address. Customer unable to locate parcel with neighbours.',
    c.primary_email, true, false,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 5
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
SELECT
  nq.id,
  'outbound_customer'::email_direction,
  'Re: Parcel delivered to wrong address',
  'Dear ' || nq.customer_name || E',\n\nWe have raised an urgent misdirected delivery investigation with DPD for consignment 15000000006. The courier has been instructed to retrieve and redeliver to the correct address.\n\nKind regards\nMoov Parcel Team',
  'queries@moovparcel.co.uk',
  nq.sender_email,
  false,
  NOW() - INTERVAL '5 days' + INTERVAL '3 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '3 hours'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 7: Delay / Courier Investigating ────────────────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    created_at, updated_at
  )
  SELECT
    '15000000007',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'automated_sla'::query_trigger,
    'delay'::query_type,
    'courier_investigating'::query_status,
    'Parcel is 3 days late',
    'Next-day shipment now 3 days overdue. SLA breach auto-triggered. Courier investigating.',
    c.primary_email, true, false,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 6
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
SELECT
  nq.id,
  'outbound_customer'::email_direction,
  'Re: Parcel is 3 days late',
  'Dear ' || nq.customer_name || E',\n\nWe sincerely apologise for the delay to consignment 15000000007. We have escalated this as urgent with DPD and expect delivery within 24 hours.\n\nKind regards\nMoov Parcel Team',
  'queries@moovparcel.co.uk',
  nq.sender_email,
  false,
  NOW() - INTERVAL '4 days' + INTERVAL '3 hours',
  NOW() - INTERVAL '4 days' + INTERVAL '3 hours'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 8: Failed delivery / Open ──────────────────────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    created_at, updated_at
  )
  SELECT
    '15000000008',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'failed_delivery'::query_type,
    'open'::query_status,
    'Delivery attempted — no card left',
    'Customer reports courier made no attempt and left no card despite being home all day.',
    c.primary_email, true, false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 7
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, received_at, created_at)
SELECT
  nq.id,
  'inbound_customer'::email_direction,
  'Delivery attempted — no card left',
  'Your driver apparently attempted delivery today but I was at home the entire time and there was no knock and no card was left. How can this be counted as an attempt?',
  nq.sender_email,
  'queries@moovparcel.co.uk',
  false,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 9: Returned / Awaiting Courier ─────────────────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    created_at, updated_at
  )
  SELECT
    '15000000009',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'returned'::query_type,
    'awaiting_courier'::query_status,
    'Parcel returned — I never refused it',
    'Parcel unexpectedly returned to sender. Customer did not refuse delivery. Address was correct.',
    c.primary_email, true, false,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 hours'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 8
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
SELECT
  nq.id,
  'outbound_customer'::email_direction,
  'Re: Parcel returned — I never refused it',
  'Dear ' || nq.customer_name || E',\n\nWe have raised this with DPD and confirmed consignment 15000000009 should not have been returned. We are arranging re-despatch at the earliest opportunity.\n\nKind regards\nMoov Parcel Team',
  'queries@moovparcel.co.uk',
  nq.sender_email,
  false,
  NOW() - INTERVAL '2 days' + INTERVAL '3 hours',
  NOW() - INTERVAL '2 days' + INTERVAL '3 hours'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;

-- ── Query 10: Lost / Claim Submitted (with deadline) ─────────────────────────
WITH skip_check AS (
  SELECT COUNT(*) AS n FROM queries
),
new_query AS (
  INSERT INTO queries (
    consignment_number, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    trigger, query_type, status,
    subject, description,
    sender_email, sender_matched, requires_attention,
    claim_amount, claim_deadline_at,
    created_at, updated_at
  )
  SELECT
    '15000000010',
    c.id, c.business_name,
    'dpd', 'DPD', 'DPD-12', 'DPD Next Day',
    'customer_email'::query_trigger,
    'other'::query_type,
    'claim_submitted'::query_status,
    'Lost parcel — formal claim required',
    'Shipment confirmed lost after 21 days. Customer requesting formal claim for £340 goods value.',
    c.primary_email, true, false,
    340.00, NOW() + INTERVAL '9 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 hour'
  FROM customers c
  WHERE c.primary_email IS NOT NULL
  ORDER BY c.account_number
  LIMIT 1 OFFSET 9
  RETURNING id, sender_email, customer_name
)
INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, received_at, created_at)
SELECT
  nq.id,
  'inbound_customer'::email_direction,
  'Lost parcel — formal claim required',
  'I need to formally report that a parcel containing goods worth £340 has been confirmed lost. I would like to submit a formal claim. Please advise on the process.',
  nq.sender_email,
  'queries@moovparcel.co.uk',
  false,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
FROM new_query nq
WHERE (SELECT n FROM skip_check) < 5;
