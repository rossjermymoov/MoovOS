-- 060: HTML email template bodies
-- Beautiful, professional HTML emails for all customer query/claim communications.
-- Uses {{placeholder}} syntax for variable substitution at send time.
--
-- Available variables (all templates):
--   {{customer_name}}         {{consignment_number}}    {{courier_name}}
--   {{service_name}}          {{collection_date}}       {{destination_postcode}}
--   {{weight_kg}}             {{recipient_name}}        {{tracking_status}}
--   {{last_event_description}} {{last_event_date}}      {{agent_name}}
--   {{ticket_reference}}      {{moov_phone}}            {{moov_email}}
--
-- Template-specific variables noted per template below.

-- ─────────────────────────────────────────────────────────────────────────────
-- Shared CSS/design tokens (referenced in each template)
-- Primary: #1a1a2e  Accent: #e94560  Mid: #0f3460  Light: #f8f9fc
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Query Acknowledgement ─────────────────────────────────────────────────
UPDATE email_templates SET body_html = $HTML$
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:32px 40px;text-align:center;">
    <img src="https://moovparcel.co.uk/logo-white.png" alt="Moov Parcel" height="36" style="display:block;margin:0 auto 12px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Query Received</p>
  </td></tr>

  <!-- Status bar -->
  <tr><td style="background:#e94560;padding:12px 40px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
      🔍 &nbsp;We're on it — Ref: {{ticket_reference}}
    </p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">Hi {{customer_name}},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">Thank you for getting in touch. We've received your query and our team is already looking into this for you.</p>

    <!-- Parcel card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border-radius:8px;border-left:4px solid #e94560;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#e94560;letter-spacing:1px;text-transform:uppercase;">Parcel Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:6px;width:140px;">Consignment</td>
          <td style="font-size:13px;font-weight:700;color:#1a1a2e;padding-bottom:6px;">{{consignment_number}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:6px;">Service</td>
          <td style="font-size:13px;color:#1a1a2e;padding-bottom:6px;">{{service_name}} via {{courier_name}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:6px;">Recipient</td>
          <td style="font-size:13px;color:#1a1a2e;padding-bottom:6px;">{{recipient_name}}, {{destination_postcode}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:6px;">Collected</td>
          <td style="font-size:13px;color:#1a1a2e;padding-bottom:6px;">{{collection_date}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;">Last update</td>
          <td style="font-size:13px;color:#1a1a2e;">{{last_event_description}} — {{last_event_date}}</td>
        </tr>
      </table>
    </td></tr></table>

    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;"><strong>What happens next?</strong> We'll investigate this with {{courier_name}} and come back to you with an update as soon as we have one. We aim to respond within 1 business day.</p>
    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">If you have any additional information to share in the meantime, simply reply to this email.</p>
  </td></tr>

  <!-- Sign off -->
  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0;font-size:15px;color:#555;">Kind regards,</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8f9fc;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#aaa;">{{moov_phone}} &nbsp;|&nbsp; {{moov_email}} &nbsp;|&nbsp; moovparcel.co.uk</p>
    <p style="margin:0;font-size:11px;color:#ccc;">2 Infirmary Street, Leeds, LS1 2JP &nbsp;·&nbsp; Moov Logistics Solutions Ltd. Registered in England & Wales No. 15521657</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>
$HTML$ WHERE template_key = 'query_acknowledgement';


-- ── 2. Customer Information Request ──────────────────────────────────────────
-- Extra vars: {{query_type_description}}
UPDATE email_templates SET body_html = $HTML$
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:32px 40px;text-align:center;">
    <img src="https://moovparcel.co.uk/logo-white.png" alt="Moov Parcel" height="36" style="display:block;margin:0 auto 12px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Action Required</p>
  </td></tr>

  <tr><td style="background:#f59e0b;padding:12px 40px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
      📋 &nbsp;We need a few details from you — Ref: {{ticket_reference}}
    </p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">Hi {{customer_name}},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">We're progressing your query regarding consignment <strong>{{consignment_number}}</strong>. To ensure we can act as quickly as possible when {{courier_name}} requests further information, we'd like to collect a few details from you now.</p>

    <!-- Important note box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e6;border:1px solid #f59e0b;border-radius:8px;margin-bottom:28px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>⚠️ Please note:</strong> We are collecting this information in advance so we are ready to act quickly — this does not mean a formal claim has been raised at this stage. We will keep you updated at every step.
      </p>
    </td></tr></table>

    <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1a1a2e;">Please provide the following:</p>

    <!-- Checklist -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f2f5;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;font-size:16px;">1.</td>
          <td><p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">Goods Description</p><p style="margin:2px 0 0;font-size:13px;color:#888;">Brand name, size, colour and quantity of the item(s)</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f2f5;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;font-size:16px;">2.</td>
          <td><p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">Supplier Cost Invoice <span style="color:#e94560;">*PDF format only*</span></p><p style="margin:2px 0 0;font-size:13px;color:#888;">The courier pays out at supplier cost price, not the resale/retail price. Please ensure your invoice is from your supplier, not a sales invoice. Word, Excel and email attachments cannot be accepted.</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f2f5;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;font-size:16px;">3.</td>
          <td><p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">Photos</p><p style="margin:2px 0 0;font-size:13px;color:#888;">Photos of the external packaging and, if applicable, the contents (especially important for damaged items)</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f2f5;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;font-size:16px;">4.</td>
          <td><p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">Combined Weight</p><p style="margin:2px 0 0;font-size:13px;color:#888;">Total weight in kg of all items being claimed for</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0f2f5;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;font-size:16px;">5.</td>
          <td><p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">Number of Parcels</p><p style="margin:2px 0 0;font-size:13px;color:#888;">How many parcels are involved in this query?</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;font-size:16px;">6.</td>
          <td><p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">Brief Summary</p><p style="margin:2px 0 0;font-size:13px;color:#888;">A short description of what has happened — e.g. "parcel lost", "delivered damaged", "missing items"</p></td>
        </tr></table>
      </td></tr>
    </table>

    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">Simply reply to this email with the above and we'll take it from there. The sooner we have these, the faster we can move.</p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0;font-size:15px;color:#555;">Kind regards,</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>
  </td></tr>

  <tr><td style="background:#f8f9fc;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#aaa;">{{moov_phone}} &nbsp;|&nbsp; {{moov_email}} &nbsp;|&nbsp; moovparcel.co.uk</p>
    <p style="margin:0;font-size:11px;color:#ccc;">2 Infirmary Street, Leeds, LS1 2JP &nbsp;·&nbsp; Moov Logistics Solutions Ltd. Registered in England & Wales No. 15521657</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>
$HTML$ WHERE template_key = 'customer_info_request';


-- ── 3. Courier Escalated — Holding Update ────────────────────────────────────
UPDATE email_templates SET body_html = $HTML$
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:32px 40px;text-align:center;">
    <img src="https://moovparcel.co.uk/logo-white.png" alt="Moov Parcel" height="36" style="display:block;margin:0 auto 12px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Query Update</p>
  </td></tr>

  <tr><td style="background:#3b82f6;padding:12px 40px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
      📨 &nbsp;We've raised this with {{courier_name}} — Ref: {{ticket_reference}}
    </p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">Hi {{customer_name}},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">We wanted to update you on consignment <strong>{{consignment_number}}</strong>. We have now formally raised this with {{courier_name}} and are awaiting their response.</p>

    <!-- Timeline -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border-radius:8px;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#3b82f6;letter-spacing:1px;text-transform:uppercase;">What's happening</p>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:28px;vertical-align:top;">
            <div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#fff;">✓</div>
          </td>
          <td style="padding-left:10px;padding-bottom:14px;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">Query received</p>
            <p style="margin:2px 0 0;font-size:12px;color:#888;">We've logged your query and reviewed the tracking</p>
          </td>
        </tr>
        <tr>
          <td style="width:28px;vertical-align:top;">
            <div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#fff;">✓</div>
          </td>
          <td style="padding-left:10px;padding-bottom:14px;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">Raised with {{courier_name}}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#888;">We've formally escalated this — {{courier_name}} are investigating</p>
          </td>
        </tr>
        <tr>
          <td style="width:28px;vertical-align:top;">
            <div style="width:20px;height:20px;background:#e5e7eb;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#999;">3</div>
          </td>
          <td style="padding-left:10px;vertical-align:top;">
            <p style="margin:0;font-size:14px;color:#999;">Awaiting courier response</p>
            <p style="margin:2px 0 0;font-size:12px;color:#bbb;">We'll update you as soon as we hear back — usually within {{query_chase_days}} working days</p>
          </td>
        </tr>
      </table>
    </td></tr></table>

    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">You don't need to do anything right now. We'll be in touch as soon as {{courier_name}} comes back to us. If your situation changes or you have anything to add, just reply to this email.</p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0;font-size:15px;color:#555;">Kind regards,</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>
  </td></tr>

  <tr><td style="background:#f8f9fc;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#aaa;">{{moov_phone}} &nbsp;|&nbsp; {{moov_email}} &nbsp;|&nbsp; moovparcel.co.uk</p>
    <p style="margin:0;font-size:11px;color:#ccc;">2 Infirmary Street, Leeds, LS1 2JP &nbsp;·&nbsp; Moov Logistics Solutions Ltd. Registered in England & Wales No. 15521657</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>
$HTML$ WHERE template_key = 'courier_escalated_holding';


-- ── 4. Claim Documents Needed ─────────────────────────────────────────────────
-- Extra vars: {{claim_number}} {{claim_deadline_date}} {{days_until_deadline}} {{claim_amount}}
UPDATE email_templates SET body_html = $HTML$
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:32px 40px;text-align:center;">
    <img src="https://moovparcel.co.uk/logo-white.png" alt="Moov Parcel" height="36" style="display:block;margin:0 auto 12px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Claim Update — Action Required</p>
  </td></tr>

  <tr><td style="background:#e94560;padding:12px 40px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
      ⚠️ &nbsp;We need your documents to submit your claim — {{days_until_deadline}} days remaining
    </p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">Hi {{customer_name}},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">We're very sorry to let you know that {{courier_name}}'s investigation into consignment <strong>{{consignment_number}}</strong> has been unable to locate your parcel. We have now been assigned claim reference <strong>{{claim_number}}</strong> and are ready to submit your claim for <strong>£{{claim_amount}}</strong>.</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">To do this on your behalf, we just need one final document from you.</p>

    <!-- Deadline banner -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border:2px solid #e94560;border-radius:8px;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#e94560;">{{days_until_deadline}} days</p>
      <p style="margin:0;font-size:14px;color:#be123c;">Claim deadline: <strong>{{claim_deadline_date}}</strong></p>
      <p style="margin:8px 0 0;font-size:12px;color:#888;">We cannot submit after this date — the claim will be lost</p>
    </td></tr></table>

    <!-- What we need -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border-radius:8px;border-left:4px solid #e94560;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1a1a2e;">What we need from you:</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;">
          <p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">📄 Supplier cost invoice — PDF format</p>
          <p style="margin:4px 0 0;font-size:13px;color:#888;">Must be a supplier invoice (not a sales/retail invoice). Word, Excel and email files cannot be accepted. The claim will be processed at cost price: <strong>£{{claim_amount}}</strong></p>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <p style="margin:0;font-size:14px;color:#1a1a2e;font-weight:700;">✅ Confirmation of parcel count</p>
          <p style="margin:4px 0 0;font-size:13px;color:#888;">Please confirm how many parcels we are claiming for</p>
        </td></tr>
      </table>
    </td></tr></table>

    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">Once we receive these, we'll submit your claim immediately. {{courier_name}} may then take up to {{claim_processing_days}} working days to process it. We'll keep you updated throughout.</p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0;font-size:15px;color:#555;">Please accept our sincere apologies for this outcome. We will do everything we can to get this resolved for you as quickly as possible.</p>
    <br>
    <p style="margin:0;font-size:15px;color:#555;">Kind regards,</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>
  </td></tr>

  <tr><td style="background:#f8f9fc;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#aaa;">{{moov_phone}} &nbsp;|&nbsp; {{moov_email}} &nbsp;|&nbsp; moovparcel.co.uk</p>
    <p style="margin:0;font-size:11px;color:#ccc;">2 Infirmary Street, Leeds, LS1 2JP &nbsp;·&nbsp; Moov Logistics Solutions Ltd. Registered in England & Wales No. 15521657</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>
$HTML$ WHERE template_key = 'claim_documents_needed';


-- ── 5. Claim Document Reminder ────────────────────────────────────────────────
-- Extra vars: {{days_remaining}} {{claim_deadline_date}} {{claim_number}} {{claim_amount}}
UPDATE email_templates SET body_html = $HTML$
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:32px 40px;text-align:center;">
    <img src="https://moovparcel.co.uk/logo-white.png" alt="Moov Parcel" height="36" style="display:block;margin:0 auto 12px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Claim Reminder</p>
  </td></tr>

  <tr><td style="background:#f59e0b;padding:12px 40px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
      ⏰ &nbsp;Friendly reminder — {{days_remaining}} days left to submit your claim
    </p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">Hi {{customer_name}},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">We just wanted to follow up on your claim for consignment <strong>{{consignment_number}}</strong> (Ref: {{claim_number}}). We're still waiting for your supplier cost invoice in PDF format before we can submit this on your behalf.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e6;border:2px solid #f59e0b;border-radius:8px;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:#d97706;">{{days_remaining}}</p>
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:700;">days remaining</p>
      <p style="margin:6px 0 0;font-size:13px;color:#888;">Deadline: {{claim_deadline_date}} &nbsp;·&nbsp; Claim: £{{claim_amount}}</p>
    </td></tr></table>

    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">Once we receive your PDF invoice we will submit the claim immediately. If you have any questions or difficulty obtaining the document, please get in touch and we'll do our best to help.</p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0;font-size:15px;color:#555;">Kind regards,</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>
  </td></tr>

  <tr><td style="background:#f8f9fc;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#aaa;">{{moov_phone}} &nbsp;|&nbsp; {{moov_email}} &nbsp;|&nbsp; moovparcel.co.uk</p>
    <p style="margin:0;font-size:11px;color:#ccc;">2 Infirmary Street, Leeds, LS1 2JP &nbsp;·&nbsp; Moov Logistics Solutions Ltd. Registered in England & Wales No. 15521657</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>
$HTML$ WHERE template_key = 'claim_doc_reminder';


-- ── 6. Claim Submitted ────────────────────────────────────────────────────────
-- Extra vars: {{claim_number}} {{claim_amount}} {{claim_submitted_date}} {{claim_processing_days}}
UPDATE email_templates SET body_html = $HTML$
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:32px 40px;text-align:center;">
    <img src="https://moovparcel.co.uk/logo-white.png" alt="Moov Parcel" height="36" style="display:block;margin:0 auto 12px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Claim Submitted</p>
  </td></tr>

  <tr><td style="background:#10b981;padding:12px 40px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
      ✅ &nbsp;Your claim has been submitted to {{courier_name}}
    </p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">Hi {{customer_name}},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">We're pleased to confirm that we have submitted your claim to {{courier_name}} on your behalf.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;border-left:4px solid #10b981;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#10b981;letter-spacing:1px;text-transform:uppercase;">Claim Summary</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:8px;width:160px;">Consignment</td>
          <td style="font-size:13px;font-weight:700;color:#1a1a2e;padding-bottom:8px;">{{consignment_number}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:8px;">Claim Reference</td>
          <td style="font-size:13px;font-weight:700;color:#1a1a2e;padding-bottom:8px;">{{claim_number}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:8px;">Claim Amount</td>
          <td style="font-size:13px;font-weight:700;color:#1a1a2e;padding-bottom:8px;">£{{claim_amount}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;padding-bottom:8px;">Submitted</td>
          <td style="font-size:13px;color:#1a1a2e;padding-bottom:8px;">{{claim_submitted_date}}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;">Expected decision</td>
          <td style="font-size:13px;color:#1a1a2e;">Up to {{claim_processing_days}} working days</td>
        </tr>
      </table>
    </td></tr></table>

    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">{{courier_name}} will now review your claim and we'll notify you of their decision as soon as we hear back. You don't need to do anything further at this stage.</p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0;font-size:15px;color:#555;">Kind regards,</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>
  </td></tr>

  <tr><td style="background:#f8f9fc;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#aaa;">{{moov_phone}} &nbsp;|&nbsp; {{moov_email}} &nbsp;|&nbsp; moovparcel.co.uk</p>
    <p style="margin:0;font-size:11px;color:#ccc;">2 Infirmary Street, Leeds, LS1 2JP &nbsp;·&nbsp; Moov Logistics Solutions Ltd. Registered in England & Wales No. 15521657</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>
$HTML$ WHERE template_key = 'claim_submitted';


-- ── 7. Claim Approved ─────────────────────────────────────────────────────────
-- Extra vars: {{claim_number}} {{approved_amount}} {{claim_amount}}
UPDATE email_templates SET body_html = $HTML$
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:32px 40px;text-align:center;">
    <img src="https://moovparcel.co.uk/logo-white.png" alt="Moov Parcel" height="36" style="display:block;margin:0 auto 12px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Claim Approved</p>
  </td></tr>

  <tr><td style="background:#10b981;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:22px;">🎉</p>
    <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:0.5px;">Great news — your claim has been approved</p>
  </td></tr>

  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a2e;">Hi {{customer_name}},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">We have great news. {{courier_name}} have reviewed your claim for consignment <strong>{{consignment_number}}</strong> and have approved it.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin-bottom:28px;text-align:center;">
    <tr><td style="padding:28px 24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#888;">Approved claim amount</p>
      <p style="margin:0;font-size:40px;font-weight:700;color:#10b981;">£{{approved_amount}}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#888;">Ref: {{claim_number}}</p>
    </td></tr></table>

    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">A credit note for £{{approved_amount}} will be applied to your account. If you have any questions about this, please don't hesitate to get in touch. We're sorry again for the inconvenience this caused and appreciate your patience throughout the process.</p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0;font-size:15px;color:#555;">Kind regards,</p>
    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a2e;">{{agent_name}}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#888;">Moov Parcel Customer Support</p>
  </td></tr>

  <tr><td style="background:#f8f9fc;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#aaa;">{{moov_phone}} &nbsp;|&nbsp; {{moov_email}} &nbsp;|&nbsp; moovparcel.co.uk</p>
    <p style="margin:0;font-size:11px;color:#ccc;">2 Infirmary Street, Leeds, LS1 2JP &nbsp;·&nbsp; Moov Logistics Solutions Ltd. Registered in England & Wales No. 15521657</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>
$HTML$ WHERE template_key = 'claim_approved';
