-- ============================================================
-- Moov OS — Migration 002: Seed Staff
-- ============================================================

INSERT INTO staff (full_name, email, role, is_active) VALUES
  ('Richard Clarke',  'richard.clarke@moov.co.uk',  'sales',              true),
  ('Ray Doyle',       'ray.doyle@moov.co.uk',        'sales',              true),
  ('Grace Hartley',   'grace.hartley@moov.co.uk',    'account_management', true),
  ('Ross Sterling',   'ross.sterling@moov.co.uk',    'onboarding',         true)
ON CONFLICT (email) DO NOTHING;
