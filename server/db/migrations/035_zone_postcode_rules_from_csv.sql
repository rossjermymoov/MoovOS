-- 035_zone_postcode_rules_from_csv.sql
-- Replace all zone postcode rules with authoritative data from zones CSV.
-- Matches zones by service_code (exact) and zone name (case-insensitive).

DO $$
DECLARE
  v_zone_id INTEGER;
  v_count   INTEGER := 0;
BEGIN

  -- 1CEN / Channel Islands (5 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '1CEN'
    AND LOWER(z.name) = LOWER('Channel Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['IM', 'TR21', 'TR22', 'TR23', 'TR25']) p;
    v_count := v_count + 1;
  END IF;

  -- 1CEP / Channel Islands (5 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '1CEP'
    AND LOWER(z.name) = LOWER('Channel Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['TR21', 'TR22', 'TR23', 'TR24', 'TR25']) p;
    v_count := v_count + 1;
  END IF;

  -- 2VMP / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '2VMP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- 2VMP / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '2VMP'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- 2VN / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '2VN'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- 2VN / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '2VN'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- 2VP / Cross Border (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '2VP'
    AND LOWER(z.name) = LOWER('Cross Border');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- 2VP / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE '2VP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- AGL-1CEN / Channel Islands (8 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'AGL-1CEN'
    AND LOWER(z.name) = LOWER('Channel Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB', 'GY', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'YO']) p;
    v_count := v_count + 1;
  END IF;

  -- AGL-2VMN / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'AGL-2VMN'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- AGL-2VMN / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'AGL-2VMN'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- AGL-2VMNNI / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'AGL-2VMNNI'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- AGL-2VSN / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'AGL-2VSN'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- AGL-2VSN / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'AGL-2VSN'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- AGL-2VSNNI / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'AGL-2VSNNI'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PC48 / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PC48'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PC48 / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PC48'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PCBI / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PCBI'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PCBI / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PCBI'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PCBILB / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PCBILB'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PCBILB / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PCBILB'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PCSU / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PCSU'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DG-PCSU / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DG-PCSU'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DHL-NDPER / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHL-NDPER'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHL-NDPER / Zone B (269 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHL-NDPER'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHL-NDPER / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHL-NDPER'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHL-NDPER / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHL-NDPER'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-222 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-222'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-222 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-222'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-222 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-222'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-222 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-222'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-225 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-225'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-225 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-225'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-225 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-225'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-225 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-225'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-226 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-226'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-226 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-226'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-226 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-226'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-226 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-226'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-250 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-250'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-250 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-250'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-250 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-250'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-250 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-250'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-260 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-260'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-260 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-260'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-260 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-260'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-260 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-260'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-3 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-3'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-3 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-3'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-3 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-3'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-3 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-3'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-48 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-48'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-48 / Zone B (269 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-48'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-48 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-48'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-48 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-48'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-5 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-5'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-5 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-5'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-5 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-5'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK-5 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK-5'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK1K-220 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK1K-220'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK1K-220 / Zone B (269 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK1K-220'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK1K-220 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK1K-220'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPCUK1K-220 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPCUK1K-220'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUK-72 / Out of Area (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUK-72'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-210 / Mainland (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-210'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-210 / Zone B (269 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-210'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-210 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-210'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-210 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-210'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-220 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-220'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-220 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-220'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-220 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-220'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-220 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-220'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-240 / Zone A (0 incl, 269 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-240'
    AND LOWER(z.name) = LOWER('Zone A');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB39', 'AB4', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB5', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB6', 'AB7', 'AB8', 'AB9', 'BT', 'DD', 'DG', 'EH', 'FK', 'G', 'GY', 'HS', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA28', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA3', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA4', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA5', 'PA6', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA7', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA8', 'PA9', 'PH1', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH2', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH3', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9', 'TD', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-240 / Zone B (79 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-240'
    AND LOWER(z.name) = LOWER('Zone B');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB1', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB2', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB3', 'AB30', 'AB39', 'AB4', 'AB5', 'AB6', 'AB7', 'AB8', 'AB9', 'DD', 'DG', 'EH', 'FK', 'G', 'KA1', 'KA10', 'KA11', 'KA12', 'KA13', 'KA14', 'KA15', 'KA16', 'KA17', 'KA18', 'KA19', 'KA2', 'KA20', 'KA21', 'KA22', 'KA23', 'KA24', 'KA25', 'KA26', 'KA3', 'KA4', 'KA5', 'KA6', 'KA7', 'KA8', 'KA9', 'KY', 'ML', 'PA1', 'PA10', 'PA11', 'PA12', 'PA13', 'PA14', 'PA15', 'PA16', 'PA17', 'PA18', 'PA19', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PH1', 'PH2', 'PH3', 'TD']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-240 / Zone C (137 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-240'
    AND LOWER(z.name) = LOWER('Zone C');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB40', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PH10', 'PH11', 'PH12', 'PH13', 'PH14', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH4', 'PH40', 'PH41', 'PH49', 'PH5', 'PH50', 'PH6', 'PH7', 'PH8', 'PH9']) p;
    v_count := v_count + 1;
  END IF;

  -- DHLPUKC-240 / Zone D (53 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DHLPUKC-240'
    AND LOWER(z.name) = LOWER('Zone D');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'HS', 'IM', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV51', 'IV55', 'IV56', 'JE', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-01 / Mainland (0 incl, 177 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-01'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB36', 'AB37', 'AB38', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11 / Channel Islands (9 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11'
    AND LOWER(z.name) = LOWER('Channel Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GG', 'GY1', 'GY3', 'JE', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11 / Isle of Man (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11'
    AND LOWER(z.name) = LOWER('Isle of Man');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['IM']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11 / Mainland (0 incl, 211 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'GG', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11 / Northern Ireland (1 incl, 1 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['IM']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11 / Scottish Highlands (209 incl, 1 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11'
    AND LOWER(z.name) = LOWER('Scottish Highlands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['IM']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11 / Scottish Islands (208 incl, 1 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11'
    AND LOWER(z.name) = LOWER('Scottish Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['IM']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11OOG / Channel Islands (5 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11OOG'
    AND LOWER(z.name) = LOWER('Channel Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['TR21', 'TR22', 'TR23', 'TR24', 'TR25']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11OOG / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11OOG'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11OOG / Scottish Highlands (103 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11OOG'
    AND LOWER(z.name) = LOWER('Scottish Highlands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV5', 'IV52', 'IV53', 'IV54', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-11OOG / Scottish Islands (64 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-11OOG'
    AND LOWER(z.name) = LOWER('Scottish Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV50', 'IV51', 'IV55', 'IV56', 'KA27', 'KA28', 'KW15', 'KW16', 'KW17', 'PA20', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH42', 'PH43', 'PH44', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-12 / Highlands and Islands (200 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-12'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-12 / Mainland (0 incl, 200 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-12'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-12 / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-12'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-12OFF / DPD Offshore (174 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-12OFF'
    AND LOWER(z.name) = LOWER('DPD Offshore');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'GY', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-13 / Mainland (0 incl, 173 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-13'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-14 / Mainland (0 incl, 173 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-14'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-16 / Mainland (0 incl, 177 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-16'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB36', 'AB37', 'AB38', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HD2', 'HS1', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-17 / Mainland (0 incl, 173 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-17'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-2DAYOFF / Offshore (3 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-2DAYOFF'
    AND LOWER(z.name) = LOWER('Offshore');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['GY', 'IM', 'JE']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-32 / Highlands and Islands (200 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-32'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-32 / Mainland (0 incl, 200 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-32'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-32 / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-32'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-5000 / Mainland (0 incl, 179 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-5000'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB36', 'AB37', 'AB38', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'GY', 'HD2', 'HS1', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'JE', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22.TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-5000TWO / Mainland (0 incl, 208 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-5000TWO'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-5000TWO / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-5000TWO'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-5000TWO / Scottish Highlands (208 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-5000TWO'
    AND LOWER(z.name) = LOWER('Scottish Highlands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-5000TWO / Scottish Islands (208 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-5000TWO'
    AND LOWER(z.name) = LOWER('Scottish Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-DROP5KND / Mainland (0 incl, 3 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-DROP5KND'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['BT', 'GG', 'JE']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-NIAR / N Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-NIAR'
    AND LOWER(z.name) = LOWER('N Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD-NIAR5K / N Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD-NIAR5K'
    AND LOWER(z.name) = LOWER('N Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD11-DROP / Highlands and Islands (209 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD11-DROP'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD11-DROP / Isle of Man (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD11-DROP'
    AND LOWER(z.name) = LOWER('Isle of Man');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['IM']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD11-DROP / Mainland (0 incl, 209 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD11-DROP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD11-DROP / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD11-DROP'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD12-DROP / Highlands and Islands (209 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD12-DROP'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- DPD12-DROP / Mainland (0 incl, 209 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'DPD12-DROP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-24NPC2C / Mainland (0 incl, 215 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-24NPC2C'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-24NPP / Mainland (0 incl, 216 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-24NPP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-24PC2C / Mainland (0 incl, 215 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-24PC2C'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-24PP / Mainland (0 incl, 216 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-24PP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48NPC2C / Highlands and Islands (215 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48NPC2C'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48NPC2C / Mainland (0 incl, 215 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48NPC2C'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48NPC2C / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48NPC2C'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48NPP / Mainland (0 incl, 216 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48NPP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48NPP / Offshore (216 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48NPP'
    AND LOWER(z.name) = LOWER('Offshore');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48NPPAK / Mainland (0 incl, 216 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48NPPAK'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48NPPAK / Offshore (216 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48NPPAK'
    AND LOWER(z.name) = LOWER('Offshore');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48PC2C / Highlands and Islands (215 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48PC2C'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48PC2C / Mainland (0 incl, 215 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48PC2C'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48PC2C / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48PC2C'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48POST / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48POST'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48POSTC2C / Highlands and Islands (215 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48POSTC2C'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48POSTC2C / Mainland (0 incl, 215 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48POSTC2C'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48POSTC2C / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48POSTC2C'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48PP / Mainland (0 incl, 216 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48PP'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48PP / Offshore (216 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48PP'
    AND LOWER(z.name) = LOWER('Offshore');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48PPAK / Mainland (0 incl, 216 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48PPAK'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- EVRI-48PPAK / Offshore (216 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'EVRI-48PPAK'
    AND LOWER(z.name) = LOWER('Offshore');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB37', 'AB38', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB46', 'AB47', 'AB48', 'AB49', 'AB50', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6. HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV57', 'IV58', 'IV59', 'IV6', 'IV60', 'IV61', 'IV62', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW0', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA50', 'PA51', 'PA52', 'PA53', 'PA54', 'PA55', 'PA56', 'PA57', 'PA58', 'PA59', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH15', 'PH16', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH27', 'PH28', 'PH29', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH45', 'PH46', 'PH47', 'PH48', 'PH49', 'PH50']) p;
    v_count := v_count + 1;
  END IF;

  -- Testy Service 1 / Mainland (0 incl, 1 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'Testy Service 1'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- Testy Service 1 / OOA (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'Testy Service 1'
    AND LOWER(z.name) = LOWER('OOA');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- UPS-11 / Highlands and Islands (172 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'UPS-11'
    AND LOWER(z.name) = LOWER('Highlands and Islands');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- UPS-11 / Mainland (0 incl, 172 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'UPS-11'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- UPS-11 / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'UPS-11'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- UPS-65UK / Mainland (0 incl, 172 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'UPS-65UK'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['BT', 'FK17', 'FK18', 'FK19', 'FK20', 'FK21', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV20', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV29', 'IV3', 'IV30', 'IV31', 'IV32', 'IV33', 'IV34', 'IV35', 'IV36', 'IV37', 'IV38', 'IV39', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV50', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'KA27', 'KA28', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA39', 'PA40', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- UPS-NI / Northern Ireland (1 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'UPS-NI'
    AND LOWER(z.name) = LOWER('Northern Ireland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['BT']) p;
    v_count := v_count + 1;
  END IF;

  -- YOD-C2CPS / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'YOD-C2CPS'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- YOD-C2CPS / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'YOD-C2CPS'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- YODC2C / Mainland (0 incl, 206 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'YODC2C'
    AND LOWER(z.name) = LOWER('Mainland');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'exclude' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  -- YODC2C / Out of Area (206 incl, 0 excl)
  SELECT z.id INTO v_zone_id
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.service_code ILIKE 'YODC2C'
    AND LOWER(z.name) = LOWER('Out of Area');
  IF v_zone_id IS NOT NULL THEN
    DELETE FROM zone_postcode_rules WHERE zone_id = v_zone_id;
    INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      SELECT v_zone_id, p, 'include' FROM unnest(ARRAY['1V20', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25', 'AB30', 'AB31', 'AB32', 'AB33', 'AB34', 'AB35', 'AB36', 'AB38', 'AB39', 'AB41', 'AB42', 'AB43', 'AB44', 'AB45', 'AB51', 'AB52', 'AB53', 'AB54', 'AB55', 'AB56', 'AB88', 'AB99', 'BT', 'FK18', 'FK19', 'FK20', 'HS1', 'HS2', 'HS3', 'HS4', 'HS5', 'HS6', 'HS7', 'HS8', 'HS9', 'IM', 'IV1', 'IV10', 'IV11', 'IV12', 'IV13', 'IV14', 'IV15', 'IV16', 'IV17', 'IV18', 'IV19', 'IV2', 'IV21', 'IV22', 'IV23', 'IV24', 'IV25', 'IV26', 'IV27', 'IV28', 'IV3', 'IV30', 'IV31', 'IV32', 'IV36', 'IV4', 'IV40', 'IV41', 'IV42', 'IV43', 'IV44', 'IV45', 'IV46', 'IV47', 'IV48', 'IV49', 'IV5', 'IV51', 'IV52', 'IV53', 'IV54', 'IV55', 'IV56', 'IV6', 'IV63', 'IV7', 'IV8', 'IV9', 'K28', 'KA27', 'KW1', 'KW10', 'KW11', 'KW12', 'KW13', 'KW14', 'KW15', 'KW16', 'KW17', 'KW2', 'KW3', 'KW4', 'KW5', 'KW6', 'KW7', 'KW8', 'KW9', 'PA20', 'PA21', 'PA22', 'PA23', 'PA24', 'PA25', 'PA26', 'PA27', 'PA28', 'PA29', 'PA30', 'PA31', 'PA32', 'PA33', 'PA34', 'PA35', 'PA36', 'PA37', 'PA38', 'PA41', 'PA42', 'PA43', 'PA44', 'PA45', 'PA46', 'PA47', 'PA48', 'PA49', 'PA60', 'PA61', 'PA62', 'PA63', 'PA64', 'PA65', 'PA66', 'PA67', 'PA68', 'PA69', 'PA70', 'PA71', 'PA72', 'PA73', 'PA74', 'PA75', 'PA76', 'PA77', 'PA78', 'PA80', 'PH17', 'PH18', 'PH19', 'PH20', 'PH21', 'PH22', 'PH23', 'PH24', 'PH25', 'PH26', 'PH30', 'PH31', 'PH32', 'PH33', 'PH34', 'PH35', 'PH36', 'PH37', 'PH38', 'PH39', 'PH40', 'PH41', 'PH42', 'PH43', 'PH44', 'PH49', 'PH50', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41', 'ZE1', 'ZE2', 'ZE3']) p;
    v_count := v_count + 1;
  END IF;

  RAISE NOTICE '035_zone_postcode_rules: updated % zones (21077 total rules)', v_count;
END $$;