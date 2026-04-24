-- 073: Seed 10 practice queries across real customers & shipments
--
-- Picks one real shipment per customer (up to 10) from the live shipments
-- table and creates queries at various lifecycle stages so the inbox can
-- be used for training and workflow practice.
--
-- Nothing is sent — all emails are stored data only.

DO $$
DECLARE
  ship   RECORD;
  qid    UUID;
  i      INT := 0;

  -- Scenario arrays indexed by i (1-10)
  qt     TEXT[] := ARRAY[
    'whereabouts','not_delivered','damaged','delay',
    'other','wrong_address','missing_items',
    'failed_delivery','returned','other'
  ];
  qs     TEXT[] := ARRAY[
    'open','awaiting_courier','awaiting_customer_info','courier_investigating',
    'claim_raised','awaiting_courier','awaiting_customer_info',
    'open','awaiting_courier','claim_submitted'
  ];
  trig   TEXT[] := ARRAY[
    'customer_email','customer_email','customer_email','automated_sla',
    'customer_email','customer_email','customer_email',
    'customer_email','customer_email','customer_email'
  ];

BEGIN
  FOR ship IN (
    SELECT DISTINCT ON (s.customer_id)
      s.customer_id,
      c.business_name                              AS customer_name,
      COALESCE(c.primary_email, 'noreply@test.com') AS customer_email,
      s.tracking_codes[1]                          AS consignment_number,
      COALESCE(s.courier_code, 'dpd')              AS courier_code,
      COALESCE(s.courier_name, 'DPD')              AS courier_name,
      COALESCE(s.service_code, 'DPD-12')           AS service_code,
      COALESCE(s.service_name, 'Next Day')         AS service_name
    FROM shipments s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.tracking_codes IS NOT NULL
      AND array_length(s.tracking_codes, 1) > 0
    ORDER BY s.customer_id, s.created_at DESC
    LIMIT 10
  )
  LOOP
    i := i + 1;
    EXIT WHEN i > 10;

    -- ── Insert query ─────────────────────────────────────────────────────────
    INSERT INTO queries (
      consignment_number,
      customer_id,    customer_name,
      courier_code,   courier_name,
      service_code,   service_name,
      trigger,        query_type,     status,
      subject,
      description,
      sender_email,   sender_matched,
      requires_attention,
      claim_amount,   claim_deadline_at,
      created_at,     updated_at
    ) VALUES (
      ship.consignment_number,
      ship.customer_id, ship.customer_name,
      ship.courier_code, ship.courier_name,
      ship.service_code, ship.service_name,
      trig[i]::query_trigger,
      qt[i]::query_type,
      qs[i]::query_status,

      -- subjects
      CASE i
        WHEN 1  THEN 'Where is my parcel?'
        WHEN 2  THEN 'Parcel shows delivered but not received'
        WHEN 3  THEN 'Parcel arrived damaged'
        WHEN 4  THEN 'Parcel is 3 days late'
        WHEN 5  THEN 'Parcel missing for 2 weeks — urgent'
        WHEN 6  THEN 'Parcel delivered to wrong address'
        WHEN 7  THEN 'Items missing from my delivery'
        WHEN 8  THEN 'Delivery attempted — no card left'
        WHEN 9  THEN 'Parcel returned — I never refused it'
        WHEN 10 THEN 'Lost parcel — formal claim required'
      END,

      -- descriptions
      CASE i
        WHEN 1  THEN 'Customer asking for update — parcel showing in transit for 2 days with no movement.'
        WHEN 2  THEN 'Tracking shows delivered at 14:32 but customer reports non-receipt. GPS data requested from courier.'
        WHEN 3  THEN 'Parcel arrived with visible external damage. Contents (electronics) reported broken. Awaiting photos and invoice.'
        WHEN 4  THEN 'Next-day shipment now 3 days overdue. SLA breach auto-triggered. Courier investigating.'
        WHEN 5  THEN 'No tracking movement for 14 days. Last scan at depot. Full trace investigation opened. Possible total loss.'
        WHEN 6  THEN 'Driver appears to have delivered to wrong address. Customer unable to locate parcel with neighbours.'
        WHEN 7  THEN 'Parcel arrived intact externally but 2 of 4 items missing from box. Awaiting goods description from customer.'
        WHEN 8  THEN 'Customer reports courier made no attempt and left no card despite customer being home all day.'
        WHEN 9  THEN 'Parcel unexpectedly returned to sender. Customer did not refuse delivery. Address was correct.'
        WHEN 10 THEN 'Shipment confirmed lost after 21 days. Customer requesting formal claim for £340 goods value.'
      END,

      ship.customer_email, true,

      -- requires_attention
      i IN (2, 5),

      -- claim fields
      CASE WHEN i = 10 THEN 340.00 ELSE NULL END,
      CASE WHEN i = 10 THEN NOW() + INTERVAL '9 days' ELSE NULL END,

      -- age queries realistically (oldest = 10 days ago, newest = today)
      NOW() - ((11 - i)::text || ' days')::INTERVAL,
      NOW() - ((11 - i)::text || ' hours')::INTERVAL
    )
    RETURNING id INTO qid;

    -- ── Inbound email (customer's original message) ───────────────────────────
    INSERT INTO query_emails (
      query_id, direction, subject, body_text,
      from_address, to_address,
      is_ai_draft, sent_at, received_at, created_at
    ) VALUES (
      qid, 'inbound_customer',
      CASE i
        WHEN 1  THEN 'Where is my parcel?'
        WHEN 2  THEN 'Parcel shows delivered but not received'
        WHEN 3  THEN 'Parcel arrived damaged'
        WHEN 4  THEN 'Parcel is 3 days late — I need it urgently'
        WHEN 5  THEN 'URGENT — Parcel missing for 2 weeks'
        WHEN 6  THEN 'Parcel delivered to wrong address'
        WHEN 7  THEN 'Items missing from my delivery'
        WHEN 8  THEN 'Delivery attempted with no card left'
        WHEN 9  THEN 'Parcel returned — I never refused it'
        WHEN 10 THEN 'Lost parcel — I want to make a claim'
      END,
      CASE i
        WHEN 1 THEN 'Hi, my parcel (ref: ' || ship.consignment_number || ') has been showing "in transit" for 2 days and hasn''t arrived. Could you please look into this? Thanks'
        WHEN 2 THEN 'Hello, your tracking is showing my parcel as delivered yesterday at 2:32pm but I haven''t received anything. I was at home all day. Please investigate urgently — I need these goods.'
        WHEN 3 THEN 'My parcel arrived today in a terrible state — the outer box was completely crushed. The laptop inside is broken. Please advise on next steps for a claim.'
        WHEN 4 THEN 'This is not acceptable. I paid for next day delivery for a business event and the parcel is now 3 days late. Please investigate immediately.'
        WHEN 5 THEN 'I am writing to report that a parcel sent to my customer has been missing for over two weeks. Last tracking was at your depot. This is causing serious issues for my business. URGENT.'
        WHEN 6 THEN 'My parcel appears to have been delivered to the wrong address. The tracking says delivered but no one at my address received it and none of my neighbours have it.'
        WHEN 7 THEN 'My delivery arrived today but two of the four items are missing from the box. The packaging looked intact. Could you please help me understand what has happened?'
        WHEN 8 THEN 'Your driver apparently attempted delivery today but I was at home the entire time and there was no knock and no card was left. How can this be counted as an attempt?'
        WHEN 9 THEN 'I''ve just been told my parcel has been returned. I absolutely did not refuse the delivery and the address was correct. Please re-despatch or advise.'
        WHEN 10 THEN 'I need to formally report that a parcel containing £340 of goods has been confirmed lost. I would like to submit a claim. Please send me the claim form and advise next steps.'
      END,
      ship.customer_email, 'queries@moovparcel.co.uk',
      false, NULL,
      NOW() - ((11 - i)::text || ' days')::INTERVAL,
      NOW() - ((11 - i)::text || ' days')::INTERVAL
    );

    -- ── AI draft replies (awaiting approval in inbox) ─────────────────────────
    -- Queries 1, 5, 10 have AI-drafted outbound replies not yet approved
    IF i IN (1, 5, 10) THEN
      INSERT INTO query_emails (
        query_id, direction, subject, body_text,
        from_address, to_address,
        is_ai_draft, sent_at, received_at, created_at
      ) VALUES (
        qid, 'outbound_customer',
        'Re: ' || CASE i
          WHEN 1  THEN 'Where is my parcel?'
          WHEN 5  THEN 'URGENT — Parcel missing for 2 weeks'
          WHEN 10 THEN 'Lost parcel — I want to make a claim'
        END,
        CASE i
          WHEN 1 THEN
'Dear ' || ship.customer_name || ',

Thank you for contacting us regarding consignment ' || ship.consignment_number || '.

We have raised this with ' || ship.courier_name || ' and requested an urgent update on the whereabouts of your parcel. We will come back to you within 24 hours.

Apologies for the inconvenience.

Kind regards
Moov Parcel Team'
          WHEN 5 THEN
'Dear ' || ship.customer_name || ',

Thank you for contacting us. We completely understand the urgency of this matter.

We have immediately escalated a full trace investigation with ' || ship.courier_name || ' regarding consignment ' || ship.consignment_number || '. This has been marked as URGENT priority.

We will update you within 48 hours. We sincerely apologise for the disruption this has caused to your business.

Kind regards
Moov Parcel Team'
          WHEN 10 THEN
'Dear ' || ship.customer_name || ',

We are very sorry to hear your parcel has been confirmed lost. We have initiated the claims process for consignment ' || ship.consignment_number || '.

To proceed we will need:
1. A cost price invoice in PDF format (not a retail receipt)
2. Photos of any remaining packaging if available
3. A brief written description of the missing items

Please note: the deadline for submitting your claim is ' || TO_CHAR(NOW() + INTERVAL '9 days', 'DD Month YYYY') || '. Documents received after this date cannot be accepted by the courier.

Kind regards
Moov Parcel Team'
        END,
        'queries@moovparcel.co.uk', ship.customer_email,
        true,  -- is_ai_draft = awaiting approval
        NULL,  -- not yet sent
        NULL,
        NOW() - ((11 - i)::text || ' days')::INTERVAL + INTERVAL '2 hours'
      );
    END IF;

    -- ── Sent replies (queries already in progress) ────────────────────────────
    -- Queries 2,3,4,6,7,8,9 have a first reply already sent
    IF i IN (2, 3, 4, 6, 7, 8, 9) THEN
      INSERT INTO query_emails (
        query_id, direction, subject, body_text,
        from_address, to_address,
        is_ai_draft, sent_at, created_at
      ) VALUES (
        qid, 'outbound_customer',
        'Re: ' || CASE i
          WHEN 2 THEN 'Parcel shows delivered but not received'
          WHEN 3 THEN 'Parcel arrived damaged'
          WHEN 4 THEN 'Parcel is 3 days late'
          WHEN 6 THEN 'Parcel delivered to wrong address'
          WHEN 7 THEN 'Items missing from my delivery'
          WHEN 8 THEN 'Delivery attempted — no card left'
          WHEN 9 THEN 'Parcel returned — I never refused it'
        END,
        CASE i
          WHEN 2 THEN
'Dear ' || ship.customer_name || ',

Thank you for letting us know. We are treating this as a priority matter.

We have contacted ' || ship.courier_name || ' and requested GPS delivery scan data and photo evidence for consignment ' || ship.consignment_number || '. We will update you within 24 hours.

Kind regards
Moov Parcel Team'
          WHEN 3 THEN
'Dear ' || ship.customer_name || ',

We are sorry to hear your parcel arrived damaged. To progress your claim we need the following:

1. Photos of the outer packaging damage
2. Photos of the damaged item
3. A cost price invoice in PDF format

Please reply with these at your earliest convenience.

Kind regards
Moov Parcel Team'
          WHEN 4 THEN
'Dear ' || ship.customer_name || ',

We sincerely apologise for the delay to consignment ' || ship.consignment_number || '. We have escalated this as urgent with ' || ship.courier_name || '.

The courier has confirmed the parcel is being located and we expect delivery within 24 hours. We will keep you updated.

Kind regards
Moov Parcel Team'
          WHEN 6 THEN
'Dear ' || ship.customer_name || ',

Thank you for reporting this. We have raised an urgent misdirected delivery investigation with ' || ship.courier_name || ' for consignment ' || ship.consignment_number || '.

The courier has been instructed to retrieve the parcel and redeliver to the correct address. We will update you within 24 hours.

Kind regards
Moov Parcel Team'
          WHEN 7 THEN
'Dear ' || ship.customer_name || ',

Thank you for contacting us. We are sorry to hear items were missing from your delivery.

To investigate with ' || ship.courier_name || ' we need:
1. Which specific items were missing
2. Whether the packaging appeared to have been tampered with

Please reply with this information and we will progress your query immediately.

Kind regards
Moov Parcel Team'
          WHEN 8 THEN
'Dear ' || ship.customer_name || ',

Thank you for letting us know. We have reported this to ' || ship.courier_name || ' and requested a re-delivery for consignment ' || ship.consignment_number || '.

You will receive a delivery notification for your rescheduled delivery. We apologise for the inconvenience.

Kind regards
Moov Parcel Team'
          WHEN 9 THEN
'Dear ' || ship.customer_name || ',

We apologise for the confusion with your return. We have raised this with ' || ship.courier_name || ' and confirmed consignment ' || ship.consignment_number || ' should not have been returned.

We are arranging re-despatch at the earliest opportunity and will update you shortly.

Kind regards
Moov Parcel Team'
        END,
        'queries@moovparcel.co.uk', ship.customer_email,
        false,
        NOW() - ((11 - i)::text || ' days')::INTERVAL + INTERVAL '3 hours',
        NOW() - ((11 - i)::text || ' days')::INTERVAL + INTERVAL '3 hours'
      );
    END IF;

    -- ── Claim deadline notification for query 10 ──────────────────────────────
    IF i = 10 THEN
      INSERT INTO query_notifications (query_id, notification_type, message, sent_in_app)
      VALUES (
        qid, 'claim_deadline',
        'Claim deadline in 9 days for ' || ship.consignment_number || ' — documents not yet received from customer',
        true
      );
    END IF;

    -- ── Attention notifications for queries 2 and 5 ───────────────────────────
    IF i = 2 THEN
      UPDATE queries SET
        requires_attention  = true,
        attention_reason    = 'Customer insists parcel not received but tracking shows GPS scan as delivered. Manual review needed.',
        attention_raised_at = NOW() - ((11 - i)::text || ' days')::INTERVAL + INTERVAL '4 hours'
      WHERE id = qid;

      INSERT INTO query_notifications (query_id, notification_type, message, sent_in_app)
      VALUES (qid, 'attention_required',
        'Customer insists parcel not received but tracking shows GPS scan as delivered. Manual review needed.', true);
    END IF;

    IF i = 5 THEN
      UPDATE queries SET
        requires_attention  = true,
        attention_reason    = 'Parcel missing for 14+ days with no depot scan. Possible total loss — escalation to formal claim likely required.',
        attention_raised_at = NOW() - ((11 - i)::text || ' days')::INTERVAL + INTERVAL '4 hours'
      WHERE id = qid;

      INSERT INTO query_notifications (query_id, notification_type, message, sent_in_app)
      VALUES (qid, 'attention_required',
        'Parcel missing for 14+ days with no depot scan. Possible total loss — escalation to formal claim likely required.', true);
    END IF;

  END LOOP;
END;
$$;
