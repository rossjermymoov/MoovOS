-- ──────────────────────────────────────────────────────────────────
-- 315 — New customers default to 'onboarding' + 3 test customers
--
-- 1. Every newly-created customer now starts in the 'onboarding' state
--    (they are flipped to 'active' when their onboarding completes).
-- 2. Seeds three FAKE customers — each snapshotted from a different
--    template and nudged into a different SLA state so the board and the
--    customer Onboarding tab can be tested immediately.
--
-- Safe to re-run: each seed block is guarded by business_name.
-- To remove the test data later:
--   DELETE FROM customers WHERE business_name LIKE '%(TEST)';
-- ──────────────────────────────────────────────────────────────────

-- ─── 1. Default new customers to onboarding ─────────────────────────
ALTER TABLE customers ALTER COLUMN account_status SET DEFAULT 'onboarding';

-- ─── 2. Seed three test customers with live onboarding plans ────────
DO $$
DECLARE
  v_cust  UUID;
  v_tmpl  UUID;
  v_tname TEXT;
  v_onb   UUID;
  v_t1    UUID;
BEGIN
  -- ========================================================
  -- A) Northwind Drinks (TEST) — Standard API — OVERDUE (red)
  -- ========================================================
  IF NOT EXISTS (SELECT 1 FROM customers WHERE business_name = 'Northwind Drinks (TEST)') THEN
    INSERT INTO customers (business_name, address_line_1, city, county, postcode, country,
                           phone_number, primary_email, tier, account_status)
    VALUES ('Northwind Drinks (TEST)', '12 Canal Wharf', 'Leeds', 'West Yorkshire', 'LS11 5AA',
            'United Kingdom', '0113 496 0001', 'ops@northwind-test.co.uk', 'silver', 'onboarding')
    RETURNING id INTO v_cust;

    SELECT id, name INTO v_tmpl, v_tname FROM onboarding_templates WHERE code = 'standard_api';
    IF v_tmpl IS NOT NULL THEN
      INSERT INTO customer_onboarding (customer_id, template_id, template_name, started_at)
      VALUES (v_cust, v_tmpl, v_tname, NOW() - INTERVAL '4 days') RETURNING id INTO v_onb;

      INSERT INTO onboarding_stages (onboarding_id, name, description, position)
        SELECT v_onb, name, description, position FROM onboarding_template_stages WHERE template_id = v_tmpl;

      INSERT INTO onboarding_tasks
        (onboarding_id, stage_id, template_task_id, title, description, position,
         assignee_id, is_required, target_duration_hours, due_at, comms_template_id, auto_send_comms)
      SELECT v_onb, ins.id, tt.id, tt.title, tt.description, tt.position,
             tt.default_assignee_id, tt.is_required, tt.target_duration_hours,
             NOW() - INTERVAL '4 days' + (COALESCE(tt.target_duration_hours, 24) || ' hours')::interval,
             tt.comms_template_id, tt.auto_send_comms
      FROM onboarding_template_tasks tt
      JOIN onboarding_template_stages ts ON ts.id = tt.stage_id
      JOIN onboarding_stages ins ON ins.onboarding_id = v_onb AND ins.position = ts.position
      WHERE tt.template_id = v_tmpl;

      -- Complete all Verification (stage 0) tasks.
      UPDATE onboarding_tasks SET status = 'complete',
             started_at = NOW() - INTERVAL '4 days', completed_at = NOW() - INTERVAL '3 days'
      WHERE onboarding_id = v_onb
        AND stage_id IN (SELECT id FROM onboarding_stages WHERE onboarding_id = v_onb AND position = 0);
      UPDATE onboarding_stages SET started_at = NOW() - INTERVAL '4 days', completed_at = NOW() - INTERVAL '3 days'
      WHERE onboarding_id = v_onb AND position = 0;

      -- Put the first stage-1 task in progress and OVERDUE.
      SELECT t.id INTO v_t1 FROM onboarding_tasks t
        JOIN onboarding_stages s ON s.id = t.stage_id
        WHERE t.onboarding_id = v_onb AND s.position = 1 ORDER BY t.position LIMIT 1;
      UPDATE onboarding_tasks SET status = 'in_progress',
             started_at = NOW() - INTERVAL '2 days', due_at = NOW() - INTERVAL '8 hours'
      WHERE id = v_t1;
      UPDATE onboarding_stages SET started_at = NOW() - INTERVAL '2 days'
      WHERE onboarding_id = v_onb AND position = 1;
    END IF;
  END IF;

  -- ========================================================
  -- B) Pennine Pet Supplies (TEST) — DPD Drop Shop — DUE SOON (amber)
  -- ========================================================
  IF NOT EXISTS (SELECT 1 FROM customers WHERE business_name = 'Pennine Pet Supplies (TEST)') THEN
    INSERT INTO customers (business_name, address_line_1, city, county, postcode, country,
                           phone_number, primary_email, tier, account_status)
    VALUES ('Pennine Pet Supplies (TEST)', '5 Market Street', 'Huddersfield', 'West Yorkshire', 'HD1 2AB',
            'United Kingdom', '01484 496 002', 'hello@pennine-test.co.uk', 'bronze', 'onboarding')
    RETURNING id INTO v_cust;

    SELECT id, name INTO v_tmpl, v_tname FROM onboarding_templates WHERE code = 'dpd_drop_shop';
    IF v_tmpl IS NOT NULL THEN
      INSERT INTO customer_onboarding (customer_id, template_id, template_name, started_at)
      VALUES (v_cust, v_tmpl, v_tname, NOW() - INTERVAL '1 day') RETURNING id INTO v_onb;

      INSERT INTO onboarding_stages (onboarding_id, name, description, position)
        SELECT v_onb, name, description, position FROM onboarding_template_stages WHERE template_id = v_tmpl;

      INSERT INTO onboarding_tasks
        (onboarding_id, stage_id, template_task_id, title, description, position,
         assignee_id, is_required, target_duration_hours, due_at, comms_template_id, auto_send_comms)
      SELECT v_onb, ins.id, tt.id, tt.title, tt.description, tt.position,
             tt.default_assignee_id, tt.is_required, tt.target_duration_hours,
             NOW() + (COALESCE(tt.target_duration_hours, 24) || ' hours')::interval,
             tt.comms_template_id, tt.auto_send_comms
      FROM onboarding_template_tasks tt
      JOIN onboarding_template_stages ts ON ts.id = tt.stage_id
      JOIN onboarding_stages ins ON ins.onboarding_id = v_onb AND ins.position = ts.position
      WHERE tt.template_id = v_tmpl;

      -- Complete the first Verification task; make the next one due soon (<24h).
      SELECT t.id INTO v_t1 FROM onboarding_tasks t
        JOIN onboarding_stages s ON s.id = t.stage_id
        WHERE t.onboarding_id = v_onb AND s.position = 0 ORDER BY t.position LIMIT 1;
      UPDATE onboarding_tasks SET status = 'complete',
             started_at = NOW() - INTERVAL '20 hours', completed_at = NOW() - INTERVAL '2 hours'
      WHERE id = v_t1;
      UPDATE onboarding_stages SET started_at = NOW() - INTERVAL '20 hours'
      WHERE onboarding_id = v_onb AND position = 0;

      SELECT t.id INTO v_t1 FROM onboarding_tasks t
        JOIN onboarding_stages s ON s.id = t.stage_id
        WHERE t.onboarding_id = v_onb AND s.position = 0 AND t.status <> 'complete'
        ORDER BY t.position LIMIT 1;
      UPDATE onboarding_tasks SET status = 'in_progress', started_at = NOW() - INTERVAL '2 hours',
             due_at = NOW() + INTERVAL '10 hours'
      WHERE id = v_t1;
    END IF;
  END IF;

  -- ========================================================
  -- C) Calder Crafts (TEST) — Non-API — ON TRACK (cyan)
  -- ========================================================
  IF NOT EXISTS (SELECT 1 FROM customers WHERE business_name = 'Calder Crafts (TEST)') THEN
    INSERT INTO customers (business_name, address_line_1, city, county, postcode, country,
                           phone_number, primary_email, tier, account_status)
    VALUES ('Calder Crafts (TEST)', '7 Riverside Mill', 'Hebden Bridge', 'West Yorkshire', 'HX7 8AD',
            'United Kingdom', '01422 496 003', 'studio@calder-test.co.uk', 'bronze', 'onboarding')
    RETURNING id INTO v_cust;

    SELECT id, name INTO v_tmpl, v_tname FROM onboarding_templates WHERE code = 'non_api';
    IF v_tmpl IS NOT NULL THEN
      INSERT INTO customer_onboarding (customer_id, template_id, template_name, started_at)
      VALUES (v_cust, v_tmpl, v_tname, NOW() - INTERVAL '3 hours') RETURNING id INTO v_onb;

      INSERT INTO onboarding_stages (onboarding_id, name, description, position)
        SELECT v_onb, name, description, position FROM onboarding_template_stages WHERE template_id = v_tmpl;

      INSERT INTO onboarding_tasks
        (onboarding_id, stage_id, template_task_id, title, description, position,
         assignee_id, is_required, target_duration_hours, due_at, comms_template_id, auto_send_comms)
      SELECT v_onb, ins.id, tt.id, tt.title, tt.description, tt.position,
             tt.default_assignee_id, tt.is_required, tt.target_duration_hours,
             NOW() + (COALESCE(tt.target_duration_hours, 24) || ' hours')::interval,
             tt.comms_template_id, tt.auto_send_comms
      FROM onboarding_template_tasks tt
      JOIN onboarding_template_stages ts ON ts.id = tt.stage_id
      JOIN onboarding_stages ins ON ins.onboarding_id = v_onb AND ins.position = ts.position
      WHERE tt.template_id = v_tmpl;
      -- Left entirely not-started → comfortably on track.
    END IF;
  END IF;
END $$;
