-- ──────────────────────────────────────────────────────────────────
-- 323 — Multi-Track Onboarding Architecture & Seeds
--
-- 1. Adds track_code column to template tasks & instance tasks
-- 2. Adds active_tracks array and collection_details JSONB to customer_onboarding
-- 3. Seeds DPD Moov Master, DPD Sub-Account, UPS, and Multi-Carrier templates
-- ──────────────────────────────────────────────────────────────────

-- 1. Schema additions
ALTER TABLE onboarding_template_tasks ADD COLUMN IF NOT EXISTS track_code TEXT DEFAULT 'core';
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS track_code TEXT DEFAULT 'core';

ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS active_tracks TEXT[] DEFAULT '{"core", "dpd_master", "golive"}';
ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS collection_details JSONB DEFAULT '{
  "preferred_window": "15:00 - 17:00",
  "daily_parcels": 25,
  "weekly_parcels": 125,
  "avg_weight_kg": 2.5,
  "dimensions_cm": "30x20x15",
  "product_type": "Retail & E-commerce Goods",
  "photos": [],
  "negotiation_status": "pending_depot",
  "negotiation_notes": ""
}'::jsonb;

-- 2. Seed Templates
DO $$
DECLARE
  t_master UUID;
  t_sub    UUID;
  t_ups    UUID;
  s_core   UUID;
  s_courier UUID;
  s_golive UUID;
BEGIN
  -- ========================================================
  -- A) DPD Moov Master Track (<150 pkts/wk)
  -- ========================================================
  IF NOT EXISTS (SELECT 1 FROM onboarding_templates WHERE code = 'dpd_moov_master') THEN
    INSERT INTO onboarding_templates (name, code, description, customer_type, is_default)
    VALUES ('DPD Moov Master (<150 pkts/wk)', 'dpd_moov_master',
            'Standard master account track for DPD customers sending under 150 parcels per week.', 'custom', TRUE)
    RETURNING id INTO t_master;

    -- Stage 1: Core Trunk (Intake & Verification)
    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_master, 'Intake & Verification', 'Initial review, credit check, Sensei transfer, and welcome comms', 0)
    RETURNING id INTO s_core;

    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_master, s_core, 'core', 'Review Jotform & Sales Responses Data', 'Verify company details, contact info, and volume profile from the intake form.', 0, 24),
      (t_master, s_core, 'core', 'Credit Check & Payment Terms', 'Run standard credit check and confirm credit limit / Direct Debit setup.', 1, 24),
      (t_master, s_core, 'core', 'Sensei Transfer & Moov Ninja Activation', 'Push customer profile to Sensei and trigger Moov Ninja portal invite.', 2, 24),
      (t_master, s_core, 'core', 'Send Welcome Email & Call Booking', 'Send the Moov Parcel welcome pack and onboarding call booking link.', 3, 24);

    -- Stage 2: Courier Branch (DPD Master Collection & Depot Setup)
    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_master, 'DPD Master Setup', 'Collection form compilation, depot negotiation, and label configuration', 1)
    RETURNING id INTO s_courier;

    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_master, s_courier, 'dpd_master', 'Compile DPD Collection Form', 'Extract parcel dimensions, average weights, product description, and photos into DPD master sheet.', 0, 24),
      (t_master, s_courier, 'dpd_master', 'DPD Collection Slot Negotiation', 'Liaise with DPD local depot to agree daily collection window (e.g. 15:00 - 17:00).', 1, 48),
      (t_master, s_courier, 'dpd_master', 'Moov Ninja DPD Master Label Config', 'Verify DPD service codes, routing rules, and label printer profile in Moov Ninja.', 2, 24);

    -- Stage 3: Go-Live Canopy (Launch & Post-Care)
    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_master, 'Go-Live & Post-Care', 'Confirmed go-live date, CS introduction, 1st day care, and billing activation', 2)
    RETURNING id INTO s_golive;

    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_master, s_golive, 'golive', 'Confirm Go-Live Date with Customer', 'Agree on official first dispatch day and notify all operational stakeholders.', 0, 24),
      (t_master, s_golive, 'golive', 'Send Customer Service Intro Email', 'Introduce the dedicated CS team, ticket escalation procedures, and support hours.', 1, 24),
      (t_master, s_golive, 'golive', 'First Day Go-Live Monitoring', 'Monitor first collection, scan rates, and ensure error-free dispatch.', 2, 24),
      (t_master, s_golive, 'golive', 'Alert Accounts Team for Billing Activation', 'Notify Finance to enable weekly invoicing cycle.', 3, 24),
      (t_master, s_golive, 'golive', 'First Invoice Verification & Check-in Call', 'Review first generated invoice for rate card accuracy and conduct 1-week check-in call.', 4, 168);
  END IF;

  -- ========================================================
  -- B) DPD Sub-Account Track (Dedicated Collection)
  -- ========================================================
  IF NOT EXISTS (SELECT 1 FROM onboarding_templates WHERE code = 'dpd_sub_account') THEN
    INSERT INTO onboarding_templates (name, code, description, customer_type)
    VALUES ('DPD Sub-Account (High Volume)', 'dpd_sub_account',
            'Dedicated DPD sub-account for larger volume senders with direct courier billing/collection.', 'custom')
    RETURNING id INTO t_sub;

    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_sub, 'Intake & Verification', 'Core verification and setup', 0) RETURNING id INTO s_core;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_sub, s_core, 'core', 'Review Intake Data & Credit Check', 'Validate volume profile and credit suitability.', 0, 24),
      (t_sub, s_core, 'core', 'Sensei Transfer & Ninja Account Creation', 'Provision core Moov OS / Sensei ID.', 1, 24),
      (t_sub, s_core, 'core', 'Send Welcome Email & Call Booking', 'Initial onboarding kick-off.', 2, 24);

    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_sub, 'DPD Sub-Account Provisioning', 'Direct sub-account request and dedicated collection', 1) RETURNING id INTO s_courier;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_sub, s_courier, 'dpd_sub', 'Request DPD Sub-Account Number from DPD', 'Submit formal request for dedicated sub-account code.', 0, 48),
      (t_sub, s_courier, 'dpd_sub', 'Link DPD Account in Carrier Links', 'Bind new DPD account number to customer rate card.', 1, 24),
      (t_sub, s_courier, 'dpd_sub', 'Schedule Dedicated Daily Driver Collection', 'Confirm driver round and collection time directly with depot.', 2, 48);

    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_sub, 'Go-Live & Post-Care', 'Launch and invoice handoff', 2) RETURNING id INTO s_golive;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_sub, s_golive, 'golive', 'Set Go-Live Date & Send CS Intro', 'Handover to Customer Service.', 0, 24),
      (t_sub, s_golive, 'golive', 'First Day Dispatch Monitoring', 'Check collection and manifests.', 1, 24),
      (t_sub, s_golive, 'golive', 'First Invoice Check & Check-in Call', 'Verify billing and client satisfaction.', 2, 168);
  END IF;

  -- ========================================================
  -- C) UPS Track
  -- ========================================================
  IF NOT EXISTS (SELECT 1 FROM onboarding_templates WHERE code = 'ups_track') THEN
    INSERT INTO onboarding_templates (name, code, description, customer_type)
    VALUES ('UPS Direct Track', 'ups_track',
            'Onboarding track for customers utilizing UPS domestic and international services.', 'custom')
    RETURNING id INTO t_ups;

    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_ups, 'Intake & Verification', 'Intake review', 0) RETURNING id INTO s_core;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_ups, s_core, 'core', 'Verify Company & Credit Check', 'Initial verification.', 0, 24),
      (t_ups, s_core, 'core', 'Sensei Transfer & Welcome Comms', 'Account provision.', 1, 24);

    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_ups, 'UPS Account Setup', 'UPS Account link and customs setup', 1) RETURNING id INTO s_courier;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_ups, s_courier, 'ups', 'Provision UPS Account Number & Link', 'Link UPS DC account number.', 0, 48),
      (t_ups, s_courier, 'ups', 'UPS Collection Schedule Setup', 'Arrange daily UPS collection.', 1, 48),
      (t_ups, s_courier, 'ups', 'Customs & Paperless Invoice Configuration', 'Setup commercial invoice templates for international.', 2, 24);

    INSERT INTO onboarding_template_stages (template_id, name, description, position)
    VALUES (t_ups, 'Go-Live & Post-Care', 'Launch', 2) RETURNING id INTO s_golive;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, track_code, title, description, position, target_duration_hours) VALUES
      (t_ups, s_golive, 'golive', 'Confirm Go-Live Date & CS Intro', 'Launch comms.', 0, 24),
      (t_ups, s_golive, 'golive', 'First Dispatch Monitoring & Billing Handover', 'Ensure smooth live volume.', 1, 24);
  END IF;
END $$;
