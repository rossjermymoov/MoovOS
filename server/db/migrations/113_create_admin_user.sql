-- Migration 113: Ensure an admin account exists for initial setup
-- Email: admin@moov.co.uk  |  Password: MoovAdmin1!
-- Change the password immediately after first login via Settings → Staff.

INSERT INTO staff (full_name, email, role, is_active, is_admin, page_permissions, password_hash)
VALUES (
  'Admin',
  'admin@moov.co.uk',
  'director',
  true,
  true,
  ARRAY['dashboard','customers','pricing','tracking','finance','queries','customer_sim','carriers','reports','knowledge','settings'],
  '$2b$12$liEgzuI9OL.3wbHCjbIFwegUvCphCYCIVF4Py4FxuAH8OvpTqER9.'
)
ON CONFLICT (email) DO UPDATE
  SET password_hash    = EXCLUDED.password_hash,
      is_admin         = true,
      is_active        = true,
      page_permissions = EXCLUDED.page_permissions;
