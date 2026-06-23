-- Migration 254: Upsert admin staff account for rossjermy@gmail.com
-- Temporary password: Moov2026!  (change after first login)

INSERT INTO staff (full_name, email, role, is_active, is_admin, password_hash)
VALUES (
  'Ross Jermy',
  'rossjermy@gmail.com',
  'admin',
  true,
  true,
  '$2b$10$TTO9iBcvlQ0j5NGwnt6kEeAygf/NgqUio28epNQS1Fvip6Da4Dley'
)
ON CONFLICT (email) DO UPDATE SET
  is_active     = true,
  is_admin      = true,
  password_hash = '$2b$10$TTO9iBcvlQ0j5NGwnt6kEeAygf/NgqUio28epNQS1Fvip6Da4Dley';
