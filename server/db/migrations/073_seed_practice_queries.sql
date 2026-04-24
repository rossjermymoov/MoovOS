-- 073: Seed 10 practice queries across real customers & shipments
--
-- Picks one real shipment per customer (up to 10) from the live shipments
-- table and creates queries at various lifecycle stages for inbox practice.
-- Nothing is sent — all emails are stored data only.

DO $$
DECLARE
  ship        RECORD;
  qid         UUID;
  cnt         INT := 0;
  v_type      TEXT;
  v_status    TEXT;
  v_trig      TEXT;
  v_subject   TEXT;
  v_desc      TEXT;
  v_body      TEXT;
  v_created   TIMESTAMPTZ;
  v_updated   TIMESTAMPTZ;
  v_attn      BOOLEAN;
  v_claim_amt NUMERIC;
  v_claim_ddl TIMESTAMPTZ;
BEGIN

  FOR ship IN (
    SELECT DISTINCT ON (s.customer_id)
      s.customer_id,
      c.business_name                               AS customer_name,
      COALESCE(c.primary_email, 'test@example.com') AS customer_email,
      s.tracking_codes[1]                           AS consignment_number,
      COALESCE(s.courier_code, 'dpd')               AS courier_code,
      COALESCE(s.courier_name, 'DPD')               AS courier_name,
      COALESCE(s.service_code, 'DPD-12')            AS service_code,
      COALESCE(s.service_name, 'Next Day')          AS service_name
    FROM shipments s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.tracking_codes IS NOT NULL
      AND array_length(s.tracking_codes, 1) > 0
    ORDER BY s.customer_id, s.created_at DESC
    LIMIT 10
  )
  LOOP
    cnt := cnt + 1;
    EXIT WHEN cnt > 10;

    -- Pre-compute everything so VALUES stays clean
    v_created   := NOW() - ((11 - cnt)::text || ' days')::INTERVAL;
    v_updated   := NOW() - ((11 - cnt)::text || ' hours')::INTERVAL;
    v_attn      := (cnt = 2 OR cnt = 5);
    v_claim_amt := NULL;
    v_claim_ddl := NULL;

    IF cnt = 1 THEN
      v_type    := 'whereabouts';    v_status := 'open';
      v_trig    := 'customer_email'; v_attn   := false;
      v_subject := 'Where is my parcel?';
      v_desc    := 'Customer asking for update — parcel showing in transit for 2 days with no movement.';
      v_body    := 'Hi, my parcel (ref: ' || ship.consignment_number || ') has been showing in transit for 2 days and has not arrived. Could you please look into this? Thanks';

    ELSIF cnt = 2 THEN
      v_type    := 'not_delivered';  v_status := 'awaiting_courier';
      v_trig    := 'customer_email'; v_attn   := true;
      v_subject := 'Parcel shows delivered but not received';
      v_desc    := 'Tracking shows delivered at 14:32 but customer reports non-receipt. GPS data requested from courier.';
      v_body    := 'Hello, tracking is showing my parcel as delivered yesterday at 2:32pm but I have not received anything. I was at home all day. Please investigate urgently.';

    ELSIF cnt = 3 THEN
      v_type    := 'damaged';        v_status := 'awaiting_customer_info';
      v_trig    := 'customer_email'; v_attn   := false;
      v_subject := 'Parcel arrived damaged';
      v_desc    := 'Parcel arrived with visible external damage. Contents (electronics) reported broken. Awaiting photos and invoice.';
      v_body    := 'My parcel arrived today in a terrible state — the outer box was completely crushed. The laptop inside is broken. Please advise on how to make a claim.';

    ELSIF cnt = 4 THEN
      v_type    := 'delay';          v_status := 'courier_investigating';
      v_trig    := 'automated_sla';  v_attn   := false;
      v_subject := 'Parcel is 3 days late';
      v_desc    := 'Next-day shipment now 3 days overdue. SLA breach auto-triggered. Courier investigating.';
      v_body    := 'This is not acceptable. I paid for next day delivery for a business event and the parcel is now 3 days late. Please investigate immediately.';

    ELSIF cnt = 5 THEN
      v_type    := 'other';          v_status := 'awaiting_courier';
      v_trig    := 'customer_email'; v_attn   := true;
      v_subject := 'Parcel missing for 2 weeks — urgent';
      v_desc    := 'No tracking movement for 14 days. Last scan at depot. Full trace investigation opened. Possible total loss.';
      v_body    := 'I am writing to report that a parcel sent to my customer has been missing for over two weeks. Last tracking was at your depot. This is causing serious issues. URGENT.';

    ELSIF cnt = 6 THEN
      v_type    := 'wrong_address';  v_status := 'awaiting_courier';
      v_trig    := 'customer_email'; v_attn   := false;
      v_subject := 'Parcel delivered to wrong address';
      v_desc    := 'Driver appears to have delivered to wrong address. Customer unable to locate parcel with neighbours.';
      v_body    := 'My parcel appears to have been delivered to the wrong address. No one at my address received it and none of my neighbours have it.';

    ELSIF cnt = 7 THEN
      v_type    := 'missing_items';  v_status := 'awaiting_customer_info';
      v_trig    := 'customer_email'; v_attn   := false;
      v_subject := 'Items missing from my delivery';
      v_desc    := 'Parcel arrived intact externally but 2 of 4 items missing from box. Awaiting goods description from customer.';
      v_body    := 'My delivery arrived today but two of the four items are missing from the box. The packaging looked intact from the outside.';

    ELSIF cnt = 8 THEN
      v_type    := 'failed_delivery'; v_status := 'open';
      v_trig    := 'customer_email';  v_attn   := false;
      v_subject := 'Delivery attempted — no card left';
      v_desc    := 'Customer reports courier made no attempt and left no card despite customer being home all day.';
      v_body    := 'Your driver apparently attempted delivery today but I was at home the entire time and there was no knock and no card was left. How can this be counted as an attempt?';

    ELSIF cnt = 9 THEN
      v_type    := 'returned';       v_status := 'awaiting_courier';
      v_trig    := 'customer_email'; v_attn   := false;
      v_subject := 'Parcel returned — I never refused it';
      v_desc    := 'Parcel unexpectedly returned to sender. Customer did not refuse delivery. Address was correct.';
      v_body    := 'I have been told my parcel has been returned. I absolutely did not refuse the delivery and the address was correct. Please re-despatch or advise.';

    ELSIF cnt = 10 THEN
      v_type    := 'other';          v_status := 'claim_submitted';
      v_trig    := 'customer_email'; v_attn   := false;
      v_subject := 'Lost parcel — formal claim required';
      v_desc    := 'Shipment confirmed lost after 21 days. Customer requesting formal claim for 340 GBP goods value.';
      v_body    := 'I need to formally report that a parcel containing goods worth 340 pounds has been confirmed lost. I would like to submit a formal claim. Please advise on the process.';
      v_claim_amt := 340.00;
      v_claim_ddl := NOW() + INTERVAL '9 days';
    END IF;

    -- ── Insert query ─────────────────────────────────────────────────────────
    INSERT INTO queries (
      consignment_number,
      customer_id,      customer_name,
      courier_code,     courier_name,
      service_code,     service_name,
      trigger,          query_type,     status,
      subject,          description,
      sender_email,     sender_matched,
      requires_attention,
      claim_amount,     claim_deadline_at,
      created_at,       updated_at
    ) VALUES (
      ship.consignment_number,
      ship.customer_id, ship.customer_name,
      ship.courier_code, ship.courier_name,
      ship.service_code, ship.service_name,
      v_trig::query_trigger,
      v_type::query_type,
      v_status::query_status,
      v_subject,        v_desc,
      ship.customer_email, true,
      v_attn,
      v_claim_amt,      v_claim_ddl,
      v_created,        v_updated
    )
    RETURNING id INTO qid;

    -- ── Inbound email (customer's original message) ───────────────────────────
    INSERT INTO query_emails (
      query_id, direction, subject, body_text,
      from_address, to_address,
      is_ai_draft, sent_at, received_at, created_at
    ) VALUES (
      qid, 'inbound_customer', v_subject, v_body,
      ship.customer_email, 'queries@moovparcel.co.uk',
      false, NULL, v_created, v_created
    );

    -- ── AI draft replies (queries 1, 5, 10 — pending approval) ───────────────
    IF cnt = 1 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, received_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'Thank you for contacting us regarding consignment ' || ship.consignment_number || '.' || chr(10) || chr(10) ||
        'We have raised this with ' || ship.courier_name || ' and requested an urgent update on the whereabouts of your parcel. We will come back to you within 24 hours.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        true, NULL, NULL, v_created + INTERVAL '2 hours');
    END IF;

    IF cnt = 5 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, received_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'We completely understand the urgency of this matter.' || chr(10) || chr(10) ||
        'We have immediately escalated a full trace investigation with ' || ship.courier_name || ' regarding consignment ' || ship.consignment_number || '. This has been marked as URGENT priority.' || chr(10) || chr(10) ||
        'We will update you within 48 hours. We sincerely apologise for the disruption this has caused.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        true, NULL, NULL, v_created + INTERVAL '2 hours');
    END IF;

    IF cnt = 10 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, received_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'We are sorry to hear your parcel has been confirmed lost. To submit your claim for consignment ' || ship.consignment_number || ' we need:' || chr(10) || chr(10) ||
        '1. A cost price invoice in PDF format (not a retail receipt)' || chr(10) ||
        '2. Photos of any packaging if available' || chr(10) ||
        '3. A brief written description of the missing items' || chr(10) || chr(10) ||
        'Please note: your deadline to submit is ' || TO_CHAR(NOW() + INTERVAL '9 days', 'DD Month YYYY') || '.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        true, NULL, NULL, v_created + INTERVAL '2 hours');
    END IF;

    -- ── Sent replies (queries 2, 3, 4, 6, 7, 8, 9 — already responded) ────────
    IF cnt = 2 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'We have contacted ' || ship.courier_name || ' and requested GPS delivery scan data and photo evidence for consignment ' || ship.consignment_number || '. We will update you within 24 hours.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        false, v_created + INTERVAL '3 hours', v_created + INTERVAL '3 hours');
    END IF;

    IF cnt = 3 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'To progress your damage claim we need:' || chr(10) || chr(10) ||
        '1. Photos of the outer packaging damage' || chr(10) ||
        '2. Photos of the damaged item' || chr(10) ||
        '3. A cost price invoice in PDF format' || chr(10) || chr(10) ||
        'Please reply with these at your earliest convenience.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        false, v_created + INTERVAL '3 hours', v_created + INTERVAL '3 hours');
    END IF;

    IF cnt = 4 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'We sincerely apologise for the delay to consignment ' || ship.consignment_number || '. We have escalated this as urgent with ' || ship.courier_name || ' and expect delivery within 24 hours.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        false, v_created + INTERVAL '3 hours', v_created + INTERVAL '3 hours');
    END IF;

    IF cnt = 6 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'We have raised an urgent misdirected delivery investigation with ' || ship.courier_name || ' for consignment ' || ship.consignment_number || '. The courier has been instructed to retrieve and redeliver to the correct address.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        false, v_created + INTERVAL '3 hours', v_created + INTERVAL '3 hours');
    END IF;

    IF cnt = 7 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'To investigate with ' || ship.courier_name || ' we need:' || chr(10) || chr(10) ||
        '1. Which specific items were missing' || chr(10) ||
        '2. Whether the packaging appeared to have been tampered with' || chr(10) || chr(10) ||
        'Please reply with this information and we will progress your query immediately.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        false, v_created + INTERVAL '3 hours', v_created + INTERVAL '3 hours');
    END IF;

    IF cnt = 8 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'We have reported this to ' || ship.courier_name || ' and requested a re-delivery for consignment ' || ship.consignment_number || '. You will receive a notification for your rescheduled delivery.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        false, v_created + INTERVAL '3 hours', v_created + INTERVAL '3 hours');
    END IF;

    IF cnt = 9 THEN
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, sent_at, created_at)
      VALUES (qid, 'outbound_customer', 'Re: ' || v_subject,
        'Dear ' || ship.customer_name || ',' || chr(10) || chr(10) ||
        'We have raised this with ' || ship.courier_name || ' and confirmed consignment ' || ship.consignment_number || ' should not have been returned. We are arranging re-despatch at the earliest opportunity.' || chr(10) || chr(10) ||
        'Kind regards' || chr(10) || 'Moov Parcel Team',
        'queries@moovparcel.co.uk', ship.customer_email,
        false, v_created + INTERVAL '3 hours', v_created + INTERVAL '3 hours');
    END IF;

    -- ── Attention flags + notifications ───────────────────────────────────────
    IF cnt = 2 THEN
      UPDATE queries SET
        requires_attention  = true,
        attention_reason    = 'Customer insists parcel not received but tracking shows GPS scan as delivered. Manual review needed.',
        attention_raised_at = v_created + INTERVAL '4 hours'
      WHERE id = qid;
      INSERT INTO query_notifications (query_id, notification_type, message, sent_in_app)
      VALUES (qid, 'attention_required', 'Customer insists parcel not received but GPS scan shows delivered. Manual review needed.', true);
    END IF;

    IF cnt = 5 THEN
      UPDATE queries SET
        requires_attention  = true,
        attention_reason    = 'Parcel missing for 14+ days — possible total loss. Escalation to formal claim likely required.',
        attention_raised_at = v_created + INTERVAL '4 hours'
      WHERE id = qid;
      INSERT INTO query_notifications (query_id, notification_type, message, sent_in_app)
      VALUES (qid, 'attention_required', 'Parcel missing for 14+ days — possible total loss. Escalation to formal claim likely required.', true);
    END IF;

    IF cnt = 10 THEN
      INSERT INTO query_notifications (query_id, notification_type, message, sent_in_app)
      VALUES (qid, 'claim_deadline', 'Claim deadline in 9 days for ' || ship.consignment_number || ' — documents not yet received from customer', true);
    END IF;

  END LOOP;
END;
$$;
