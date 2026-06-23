-- 304_default_template_profile.sql
-- Generic "Default / House style" template profile. Acts as the base layer for
-- the Top-and-Tail templates: courier-specific rows override it per-field, and it
-- itself falls back to the built-in defaults. Gives every ticket a branded
-- header/footer even when no courier is detected.
--
-- The template columns inherit their migration-302 DEFAULT values on insert.

INSERT INTO courier_routing_rules (courier_code, courier_name)
VALUES ('default', 'Default / House style')
ON CONFLICT (courier_code) DO NOTHING;
