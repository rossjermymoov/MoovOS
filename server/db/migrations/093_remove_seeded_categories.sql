-- Migration 093: Remove the example rate card categories that were seeded in 092.
-- These were placeholder examples; categories will be created manually by the team.
DELETE FROM rate_card_categories
WHERE name IN ('Standard', 'High Volume', 'Low Volume', 'Drop to Shop', 'International', 'Bespoke');
