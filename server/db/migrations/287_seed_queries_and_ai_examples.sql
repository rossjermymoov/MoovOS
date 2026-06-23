-- Migration 287: Seed 10 realistic queries + email threads + AI learning examples
--
-- Seeds the queries inbox with representative data across all four groups
-- (Claims, Queries, Billing, Technical) at various lifecycle stages.
-- Also seeds query_emails threads for 4 of the queries, plus ai_response_drafts
-- and ai_response_feedback rows to bootstrap the AI learning layer.
--
-- All customer/staff lookups are done by name/email so this is safe to run
-- against any DB that has the standard customer and staff seed data.
-- If a customer is not found, customer_id is left NULL — display still works
-- from the denormalised customer_name column.

BEGIN;

DO $$
DECLARE
  -- Staff IDs (looked up by email)
  v_grace   UUID;
  v_richard UUID;
  v_ray     UUID;
  v_ross    UUID;

  -- Customer IDs (looked up by name — nullable, so NULL is safe)
  v_boori      UUID;
  v_kammac     UUID;
  v_wine_buffs UUID;
  v_barry      UUID;
  v_cranswick  UUID;
  v_work_wear  UUID;
  v_hof        UUID;
  v_london_grow UUID;
  v_fight_outlet UUID;
  v_europa     UUID;

  -- Query IDs
  q_boori         UUID := gen_random_uuid();
  q_kammac        UUID := gen_random_uuid();
  q_wine_buffs    UUID := gen_random_uuid();
  q_barry         UUID := gen_random_uuid();
  q_cranswick     UUID := gen_random_uuid();
  q_work_wear     UUID := gen_random_uuid();
  q_hof           UUID := gen_random_uuid();
  q_london_grow   UUID := gen_random_uuid();
  q_fight_outlet  UUID := gen_random_uuid();
  q_europa        UUID := gen_random_uuid();

  -- Draft IDs
  d_boori    UUID := gen_random_uuid();
  d_kammac   UUID := gen_random_uuid();

BEGIN

  -- ── Resolve staff IDs ──────────────────────────────────────────────────────
  SELECT id INTO v_grace   FROM staff WHERE email = 'grace.hartley@moov.co.uk'   LIMIT 1;
  SELECT id INTO v_richard FROM staff WHERE email = 'richard.clarke@moov.co.uk'  LIMIT 1;
  SELECT id INTO v_ray     FROM staff WHERE email = 'ray.doyle@moov.co.uk'        LIMIT 1;
  SELECT id INTO v_ross    FROM staff WHERE email = 'ross.sterling@moov.co.uk'   LIMIT 1;

  -- ── Resolve customer IDs ───────────────────────────────────────────────────
  SELECT id INTO v_boori       FROM customers WHERE business_name ILIKE '%boori%'         LIMIT 1;
  SELECT id INTO v_kammac      FROM customers WHERE business_name ILIKE '%kammac%'        LIMIT 1;
  SELECT id INTO v_wine_buffs  FROM customers WHERE business_name ILIKE '%wine buffs%'    LIMIT 1;
  SELECT id INTO v_barry       FROM customers WHERE business_name ILIKE '%barry carter%'  LIMIT 1;
  SELECT id INTO v_cranswick   FROM customers WHERE business_name ILIKE '%cranswick%'     LIMIT 1;
  SELECT id INTO v_work_wear   FROM customers WHERE business_name ILIKE '%work%n%wear%' OR business_name ILIKE '%work and wear%' LIMIT 1;
  SELECT id INTO v_hof         FROM customers WHERE business_name ILIKE '%house of fraser%' OR account_number ILIKE 'HOF%' LIMIT 1;
  SELECT id INTO v_london_grow FROM customers WHERE business_name ILIKE '%london grow%'   LIMIT 1;
  SELECT id INTO v_fight_outlet FROM customers WHERE business_name ILIKE '%fight outlet%' LIMIT 1;
  SELECT id INTO v_europa      FROM customers WHERE business_name ILIKE '%europa%' OR business_name ILIKE '%bessette%' LIMIT 1;

  -- ── 10 Queries ────────────────────────────────────────────────────────────

  -- 1. Boori — DHL damaged goods — Courier investigating / claim raised
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    courier_email, assigned_to, ai_confidence,
    claim_id, last_chased_at, courier_chased_at,
    claim_deadline_at, claim_amount,
    created_at, updated_at
  ) VALUES (
    q_boori, v_boori, 'Boori (Europe) Ltd',
    'DHL', 'DHL', 'DHLPCUK', 'DHL Parcel UK',
    '4652548311', 'customer_email', 'damaged', 'courier_investigating',
    'Damaged goods on arrival — consignment 4652548311',
    'Customer reports two items arrived with significant damage to outer packaging and goods. Photos provided. Cost invoice received 02/06/2026.',
    'platinum@dpd.co.uk', v_grace, 0.87,
    NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '16 days',
    NOW() + INTERVAL '9 days', 320.00,
    NOW() - INTERVAL '19 days', NOW() - INTERVAL '12 minutes'
  );

  -- 2. Kammac — DPD lost parcel — Awaiting courier
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    courier_email, assigned_to, ai_confidence,
    last_chased_at, courier_chased_at,
    claim_deadline_at,
    created_at, updated_at
  ) VALUES (
    q_kammac, v_kammac, 'Kammac Ltd',
    'DPD', 'DPD', 'DPD-12', 'DPD Next Day',
    '1959339902', 'customer_email', 'whereabouts', 'awaiting_courier',
    'Parcel lost in transit — consignment 1959339902',
    'Parcel booked 3 weeks ago. No tracking updates since collection. Customer has chased twice.',
    'platinum@dpd.co.uk', v_grace, 0.91,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 days',
    NOW() + INTERVAL '14 days',
    NOW() - INTERVAL '21 days', NOW() - INTERVAL '1 hour'
  );

  -- 3. Wine Buffs — Evri wrong address — Open (unassigned)
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    assigned_to, ai_confidence,
    created_at, updated_at
  ) VALUES (
    q_wine_buffs, v_wine_buffs, 'Wine Buffs Ltd',
    'Evri', 'Evri', 'EVRI-STD', 'Evri Standard',
    'H8123740221', 'customer_email', 'wrong_address', 'open',
    'Wrong delivery address — parcel delivered to neighbour',
    'Parcel marked as delivered but customer has not received it. Tracking shows delivered to a neighbour. Customer requesting investigation.',
    NULL, 0.76,
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'
  );

  -- 4. Barry Carter — DPD no tracking updates — Awaiting customer
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    courier_email, assigned_to, ai_confidence,
    last_chased_at,
    created_at, updated_at
  ) VALUES (
    q_barry, v_barry, 'Barry Carter Ltd',
    'DPD', 'DPD', 'DPD-12', 'DPD Next Day',
    '2313018277', 'customer_email', 'whereabouts', 'awaiting_customer',
    'No tracking updates for 4 days — consignment 2313018277',
    'Parcel collected but no tracking scans in 4 days. Asked customer for cost invoice and photos in case claim needed.',
    'platinum@dpd.co.uk', v_richard, 0.83,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'
  );

  -- 5. Cranswick — DPD failed delivery — Awaiting courier
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    courier_email, assigned_to, ai_confidence,
    courier_chased_at,
    created_at, updated_at
  ) VALUES (
    q_cranswick, v_cranswick, 'Cranswick Plc',
    'DPD', 'DPD', 'DPD-12', 'DPD Next Day',
    '1571832049', 'automated_status', 'failed_delivery', 'awaiting_courier',
    'Failed delivery — no card left, no rebook',
    'Courier attempted delivery but no card was left and no rebook was offered. Customer out of pocket for missed delivery.',
    'platinum@dpd.co.uk', v_ray, 0.79,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '9 days', NOW() - INTERVAL '3 days'
  );

  -- 6. Work N Wear — Royal Mail returned — Awaiting courier
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    assigned_to, ai_confidence,
    courier_chased_at,
    created_at, updated_at
  ) VALUES (
    q_work_wear, v_work_wear, 'Work N Wear',
    'RoyalMail', 'Royal Mail', 'RM48', 'Royal Mail 48',
    'BJ238400192GB', 'automated_status', 'returned', 'awaiting_courier',
    'Parcel returned to sender unexpectedly',
    'Parcel returned to Moov warehouse marked "addressee gone away". Customer confirms address was correct.',
    v_ray, 0.68,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days'
  );

  -- 7. HOF — UPS delay — Awaiting customer
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    assigned_to, ai_confidence,
    created_at, updated_at
  ) VALUES (
    q_hof, v_hof, 'House of Fraser',
    'UPS', 'UPS', 'UPS-11', 'UPS Standard',
    '1ZX893W80395', 'customer_email', 'delay', 'awaiting_customer',
    'Parcel delayed — no ETA provided by UPS',
    'Parcel now 5 days overdue. UPS tracking shows "in transit" with no further scans. Response sent to customer advising we are investigating.',
    v_richard, 0.88,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
  );

  -- 8. London Grow — DPD damaged — Escalated (claim raised)
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    courier_email, assigned_to, ai_confidence,
    claim_deadline_at, claim_amount,
    last_chased_at, courier_chased_at,
    created_at, updated_at
  ) VALUES (
    q_london_grow, v_london_grow, 'London Grow',
    'DPD', 'DPD', 'DPD-12', 'DPD Next Day',
    '1780039358', 'customer_email', 'damaged', 'claim_raised',
    'Damaged delivery — grow light broken in transit',
    'High-value grow light received smashed. Declared value £480. Customer provided cost invoice and photos. Formal claim submitted to DPD.',
    'platinum@dpd.co.uk', v_grace, 0.92,
    NOW() + INTERVAL '6 days', 480.00,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days'
  );

  -- 9. Fight Outlet — DPD missing items — Resolved
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    courier_email, assigned_to, ai_confidence,
    resolved_at, resolved_by, resolution_notes,
    created_at, updated_at
  ) VALUES (
    q_fight_outlet, v_fight_outlet, 'Fight Outlet',
    'DPD', 'DPD', 'DPD-12', 'DPD Next Day',
    '1779731010', 'customer_email', 'missing_items', 'resolved',
    'Missing items from multi-parcel shipment',
    'Three-parcel shipment — only two parcels delivered. Third parcel located at DPD depot and re-delivered.',
    'platinum@dpd.co.uk', v_richard, 0.94,
    NOW() - INTERVAL '2 days', v_richard,
    'Third parcel found at DPD Hull depot. Re-delivered successfully. Customer confirmed receipt.',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'
  );

  -- 10. Europa/Bessette — Evri whereabouts — Open (new today)
  INSERT INTO queries (
    id, customer_id, customer_name,
    courier_code, courier_name, service_code, service_name,
    consignment_number, trigger, query_type, status, subject, description,
    assigned_to, ai_confidence,
    created_at, updated_at
  ) VALUES (
    q_europa, v_europa, 'Bessette Courier Ltd',
    'Evri', 'Evri', 'EVRI-STD', 'Evri Standard',
    'H9004712839', 'customer_email', 'whereabouts', 'open',
    'Whereabouts query — parcel not received after 3 days',
    'Customer placed order 5 days ago. Tracking shows collected but no further updates. Customer asking for ETA.',
    NULL, NULL,
    NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'
  );

  -- ── Email threads for 4 queries ──────────────────────────────────────────

  -- Boori thread (3 emails)
  INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, sent_at, received_at, is_ai_draft, created_at) VALUES
  (q_boori, 'inbound_customer',
   'Damaged delivery — consignment 4652548311',
   E'Hi,\n\nWe received a delivery from DHL yesterday and two of the items arrived with significant damage to the outer packaging and the goods inside. Consignment 4652548311.\n\nPlease can you help us raise this with the courier as we need to make a claim. I have attached photos.\n\nThanks,\nBoori Warehouse Team',
   'warehouse@boori.co.uk', 'queries@moovparcel.co.uk',
   NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days',
   false, NOW() - INTERVAL '19 days'),

  (q_boori, 'outbound_customer',
   'RE: Damaged delivery — consignment 4652548311',
   E'Hi,\n\nThank you for getting in touch and for sending the photos across.\n\nWe have logged this as a formal query and are contacting DHL on your behalf today. Before we can submit a compensation claim, we will need a cost invoice showing the purchase price of the damaged goods — could you send this across when you have a chance?\n\nWe will keep you updated as this progresses.\n\nKind regards,\nGrace\nMoov Parcel',
   'queries@moovparcel.co.uk', 'warehouse@boori.co.uk',
   NOW() - INTERVAL '18 days', NULL,
   true, NOW() - INTERVAL '18 days'),

  (q_boori, 'inbound_customer',
   'RE: Damaged delivery — consignment 4652548311',
   E'Hi Grace,\n\nJust following up — has there been any response from DHL? We still haven''t heard anything and we are getting close to the claim deadline.\n\nI have attached the cost invoice as requested.\n\nThanks,\nBoori Warehouse',
   'warehouse@boori.co.uk', 'queries@moovparcel.co.uk',
   NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '12 minutes',
   false, NOW() - INTERVAL '12 minutes');

  -- Kammac thread (3 emails)
  INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, sent_at, received_at, is_ai_draft, created_at) VALUES
  (q_kammac, 'inbound_customer',
   'Lost parcel — tracking number 1959339902',
   E'Hi,\n\nWe booked a DPD parcel 3 weeks ago (consignment 1959339902) and it still hasn''t been delivered. Tracking has shown no updates since collection.\n\nCan you please investigate urgently as this is a time-sensitive shipment.\n\nRegards,\nKammac Operations',
   'ops@kammac.co.uk', 'queries@moovparcel.co.uk',
   NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days',
   false, NOW() - INTERVAL '21 days'),

  (q_kammac, 'outbound_courier',
   'Lost Parcel Investigation — Consignment 1959339902 — Account Kammac',
   E'Dear DPD Platinum Team,\n\nWe are writing to report a missing parcel on behalf of our customer Kammac Ltd.\n\nConsignment number: 1959339902\nCollection date: ' || TO_CHAR(NOW() - INTERVAL '21 days', 'DD Mon YYYY') || E'\nLast scan: Collection\n\nThere have been no tracking updates since collection 21 days ago. Please can you investigate and provide a status update as a matter of urgency.\n\nKind regards,\nMoov Parcel',
   'queries@moovparcel.co.uk', 'platinum@dpd.co.uk',
   NOW() - INTERVAL '12 days', NULL,
   false, NOW() - INTERVAL '12 days'),

  (q_kammac, 'outbound_customer',
   'RE: Lost parcel — tracking number 1959339902',
   E'Hi,\n\nThank you for your patience. We have escalated this directly to the DPD Platinum team and are awaiting their investigation response, which we expect within the next 2–3 working days.\n\nShould DPD be unable to locate the parcel, we will initiate a formal claim process on your behalf. We will keep you updated.\n\nKind regards,\nGrace\nMoov Parcel',
   'queries@moovparcel.co.uk', 'ops@kammac.co.uk',
   NOW() - INTERVAL '1 day', NULL,
   true, NOW() - INTERVAL '1 day');

  -- Fight Outlet thread (2 emails — resolved)
  INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, sent_at, received_at, is_ai_draft, created_at) VALUES
  (q_fight_outlet, 'inbound_customer',
   'Missing parcel from multi-parcel shipment',
   E'Hi,\n\nWe sent a 3-parcel shipment on DPD last week. We have received two of the three parcels but the third (the heaviest one) is nowhere to be found.\n\nCan you look into this please?\n\nThanks,\nFight Outlet',
   'warehouse@fightoutlet.co.uk', 'queries@moovparcel.co.uk',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days',
   false, NOW() - INTERVAL '10 days'),

  (q_fight_outlet, 'outbound_customer',
   'RE: Missing parcel from multi-parcel shipment — found and re-delivering',
   E'Hi,\n\nGreat news — we have located your missing parcel at the DPD Hull depot. It was held due to an address query at the depot.\n\nDPD have confirmed it will be re-delivered tomorrow before 17:00. We are sorry for the inconvenience caused.\n\nKind regards,\nRichard\nMoov Parcel',
   'queries@moovparcel.co.uk', 'warehouse@fightoutlet.co.uk',
   NOW() - INTERVAL '2 days', NULL,
   true, NOW() - INTERVAL '2 days');

  -- Barry Carter thread (2 emails)
  INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, sent_at, received_at, is_ai_draft, created_at) VALUES
  (q_barry, 'inbound_customer',
   'No tracking updates for parcel 2313018277',
   E'Hi,\n\nOur parcel 2313018277 was collected by DPD 7 days ago but has not moved since. Can you please investigate?\n\nThanks',
   'accounts@barrycarter.co.uk', 'queries@moovparcel.co.uk',
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days',
   false, NOW() - INTERVAL '7 days'),

  (q_barry, 'outbound_customer',
   'RE: No tracking updates for parcel 2313018277',
   E'Hi,\n\nThank you for getting in touch. We have raised this with DPD and are investigating the whereabouts of your parcel.\n\nWhile we do so, could you please send us the following so we are prepared if a claim is needed:\n• A cost invoice for the goods\n• Photos of the packaging if available\n\nWe will update you as soon as we have a response from DPD.\n\nKind regards,\nRichard\nMoov Parcel',
   'queries@moovparcel.co.uk', 'accounts@barrycarter.co.uk',
   NOW() - INTERVAL '1 day', NULL,
   true, NOW() - INTERVAL '1 day');

  -- ── AI response drafts + feedback (Boori and Fight Outlet) ───────────────

  -- Boori — draft that was approved as-is
  INSERT INTO ai_response_drafts (
    id, query_id, model_provider, model_name, prompt_version,
    intent, intent_confidence, urgency,
    entities_extracted, generation_context,
    draft_text, tokens_input, tokens_output, cost_pence,
    created_at
  ) VALUES (
    d_boori, q_boori, 'anthropic', 'claude-sonnet-4-6', 1,
    'damage_claim_followup', 0.87, 'high',
    '{"tracking_number": "4652548311", "courier": "DHL", "days_waiting": 19, "claim_deadline_days": 9, "has_cost_invoice": true}'::jsonb,
    '{"thread_summary": "Customer reported damaged goods 19 days ago. Cost invoice just received. Courier chased 16 days ago, no response.", "style_patterns_used": ["always_acknowledge_deadline", "confirm_next_action", "empathetic_but_brief"], "example_ids_used": []}'::jsonb,
    E'Hi,\n\nThank you for sending across the cost invoice — we have this on file and will include it with your claim submission to DHL.\n\nI can confirm we are chasing DHL for an update on their investigation. Given you are now 9 days from the claim deadline, we will escalate this today and request a response by end of week.\n\nWe will keep you updated as soon as we hear back.\n\nKind regards,\nMoov Parcel',
    1840, 112, 0.34,
    NOW() - INTERVAL '18 days'
  );

  INSERT INTO ai_response_feedback (
    id, draft_id, query_id, staff_id,
    action, sent_text, was_auto_sent, customer_replied,
    created_at
  ) VALUES (
    gen_random_uuid(), d_boori, q_boori, v_grace,
    'approved',
    E'Hi,\n\nThank you for sending across the cost invoice — we have this on file and will include it with your claim submission to DHL.\n\nI can confirm we are chasing DHL for an update on their investigation. Given you are now 9 days from the claim deadline, we will escalate this today and request a response by end of week.\n\nWe will keep you updated as soon as we hear back.\n\nKind regards,\nMoov Parcel',
    false, true,
    NOW() - INTERVAL '18 days'
  );

  -- Fight Outlet — draft that was edited (staff added depot name and redelivery date)
  INSERT INTO ai_response_drafts (
    id, query_id, model_provider, model_name, prompt_version,
    intent, intent_confidence, urgency,
    entities_extracted, generation_context,
    draft_text, tokens_input, tokens_output, cost_pence,
    created_at
  ) VALUES (
    d_kammac, q_fight_outlet, 'anthropic', 'claude-sonnet-4-6', 1,
    'missing_parcel_located', 0.94, 'normal',
    '{"tracking_number": "1779731010", "courier": "DPD", "parcel_count": 3, "missing_parcel_count": 1}'::jsonb,
    '{"thread_summary": "Multi-parcel shipment, one parcel missing. DPD confirmed parcel located at depot.", "style_patterns_used": ["lead_with_good_news", "include_redelivery_date"], "example_ids_used": []}'::jsonb,
    E'Hi,\n\nGreat news — we have located your missing parcel at a DPD depot. It was held due to a query at the depot.\n\nDPD have confirmed it will be re-delivered shortly. We are sorry for the inconvenience caused.\n\nKind regards,\nMoov Parcel',
    1620, 89, 0.27,
    NOW() - INTERVAL '2 days'
  );

  INSERT INTO ai_response_feedback (
    id, draft_id, query_id, staff_id,
    action, sent_text,
    edit_diff,
    was_auto_sent, customer_replied, resolved_after_send,
    created_at
  ) VALUES (
    gen_random_uuid(), d_kammac, q_fight_outlet, v_richard,
    'edited',
    E'Hi,\n\nGreat news — we have located your missing parcel at the DPD Hull depot. It was held due to an address query at the depot.\n\nDPD have confirmed it will be re-delivered tomorrow before 17:00. We are sorry for the inconvenience caused.\n\nKind regards,\nRichard\nMoov Parcel',
    '{"changed_phrases": [{"from": "a DPD depot", "to": "the DPD Hull depot"}, {"from": "a query at the depot", "to": "an address query at the depot"}, {"from": "re-delivered shortly", "to": "re-delivered tomorrow before 17:00"}, {"from": "Moov Parcel", "to": "Richard\\nMoov Parcel"}]}'::jsonb,
    false, true, true,
    NOW() - INTERVAL '2 days'
  );

  -- ── Seed one ai_style_pattern extracted from the fight outlet edit ─────────
  INSERT INTO ai_style_patterns (
    id, pattern_type, group_name, intent,
    pattern_description,
    example_before, example_after,
    source_feedback_ids, occurrence_count, confidence_score,
    is_active, is_auto_generated,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    'always_include', 'Claims', 'missing_parcel_located',
    'When a parcel has been located at a depot, always name the specific depot and provide the confirmed redelivery date and time window. Do not use vague language like "re-delivered shortly" or "a DPD depot".',
    'DPD have confirmed it will be re-delivered shortly at a DPD depot.',
    'DPD have confirmed it will be re-delivered tomorrow before 17:00 at the DPD Hull depot.',
    ARRAY[gen_random_uuid()], 1, 0.72,
    true, true,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  );

  RAISE NOTICE 'Migration 287 complete — 10 queries, 10 email threads, 2 AI drafts, 2 feedback records, 1 style pattern seeded.';

END $$;

COMMIT;
