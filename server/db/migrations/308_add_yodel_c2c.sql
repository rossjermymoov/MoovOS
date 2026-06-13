-- 308_add_yodel_c2c.sql
-- New courier: Yodel C2C. Inherits the default Top-and-Tail templates on insert;
-- emails + tracking samples are filled in via Settings → Comms Templates.

INSERT INTO courier_routing_rules (courier_code, courier_name)
VALUES ('yodel_c2c', 'Yodel C2C')
ON CONFLICT (courier_code) DO NOTHING;
