-- -----------------------------------------------------------------------------
-- Migration 119 — Fill missing zone_country_codes for DPD international services
--
-- Root cause: migration 004 inserted zone_country_codes for the "core" country
-- list but omitted ~60 zones (American Samoa, USA, island territories, etc.).
-- Zones with NO zone_country_codes entries match every country via the billing
-- engine's catch-all rule, causing American Samoa (first alphabetically) to be
-- selected for US shipments.
--
-- This migration inserts the missing mappings for ALL DPD international services:
--   DPD-10, DPD-10DDP, DPD-60, DPD-60DDP, DPD-19DDP, DPD-39DDP, DPD-80, DPD-20
--
-- Safe to re-run — ON CONFLICT (zone_id, country_iso) DO NOTHING.
-- -----------------------------------------------------------------------------

BEGIN;

-- ── Master country name → ISO code lookup ─────────────────────────────────────
-- Every zone name that appears in DPD international services, mapped to its
-- ISO 3166-1 alpha-2 code. Where DPD uses non-standard names (typos, aliases,
-- grouped territories) the most appropriate standard code is used.

WITH country_map(zone_name, country_iso) AS (VALUES
  ('Afghanistan',                    'AF'),
  ('Albania',                        'AL'),
  ('Algeria',                        'DZ'),
  ('American Samoa',                 'AS'),
  ('Andorra',                        'AD'),
  ('Angola',                         'AO'),
  ('Anguilla',                       'AI'),
  ('Antigua',                        'AG'),
  ('Barbuda',                        'AG'),  -- Antigua & Barbuda share AG
  ('Argentina',                      'AR'),
  ('Armenia',                        'AM'),
  ('Aruba',                          'AW'),
  ('Australia',                      'AU'),
  ('Austria',                        'AT'),
  ('Azerbaijan',                     'AZ'),
  ('Bahamas',                        'BS'),
  ('Bahrain',                        'BH'),
  ('Bangladesh',                     'BD'),
  ('Barbados',                       'BB'),
  ('Belgium',                        'BE'),
  ('Belize',                         'BZ'),
  ('Benin',                          'BJ'),
  ('Bermuda',                        'BM'),
  ('Bhutan',                         'BT'),
  ('Bolivia',                        'BO'),
  ('Bosnia',                         'BA'),
  ('Botswana',                       'BW'),
  ('Brazil',                         'BR'),
  ('British Virgin Islands',         'VG'),
  ('Brunei',                         'BN'),
  ('Bulgaria',                       'BG'),
  ('Burkina Faso',                   'BF'),
  ('Cambodia',                       'KH'),
  ('Cameroon',                       'CM'),
  ('Canada',                         'CA'),
  ('Canary Islands',                 'IC'),  -- DPD uses IC (informal) for Canary Islands
  ('Cayman Islands',                 'KY'),
  ('Central African Republic',       'CF'),
  ('Chad',                           'TD'),
  ('Chile',                          'CL'),
  ('China',                          'CN'),
  ('Colombia',                       'CO'),
  ('Congo Democratic Republic',      'CD'),
  ('Congo Republic of',              'CG'),
  ('Costa Rica',                     'CR'),
  ('Croatia',                        'HR'),
  ('Cyprus',                         'CY'),
  ('Czech Republic',                 'CZ'),
  ('Denmark',                        'DK'),
  ('Djibouti',                       'DJ'),
  ('Dominica',                       'DM'),
  ('Dominican Republic',             'DO'),
  ('East Timor',                     'TL'),
  ('Ecuador',                        'EC'),
  ('Egypt',                          'EG'),
  ('El Salvador',                    'SV'),
  ('Eqatorial Guinea',               'GQ'),  -- DPD typo for "Equatorial Guinea"
  ('Estonia',                        'EE'),
  ('Ethiopia',                       'ET'),
  ('Faroe Islands',                  'FO'),
  ('Fiji',                           'FJ'),
  ('Finland',                        'FI'),
  ('France',                         'FR'),
  ('French Guiana',                  'GF'),
  ('French Polynesia/Tahiti',        'PF'),
  ('Tahiti',                         'PF'),  -- DPD alias for French Polynesia
  ('Gabon',                          'GA'),
  ('Gambia',                         'GM'),
  ('Georgia',                        'GE'),
  ('Germany',                        'DE'),
  ('Ghana',                          'GH'),
  ('Gibraltar',                      'GI'),
  ('Greece',                         'GR'),
  ('Greenland',                      'GL'),
  ('Grenada',                        'GD'),
  ('Guadeloupe/St Barthelemy/St Ma', 'GP'),  -- grouped French Caribbean territories
  ('Guam',                           'GU'),
  ('Guatemala',                      'GT'),
  ('Guinea',                         'GN'),
  ('Guyana',                         'GY'),
  ('Haiti',                          'HT'),
  ('Honduras',                       'HN'),
  ('Hong Kong',                      'HK'),
  ('Hungary',                        'HU'),
  ('Iceland',                        'IS'),
  ('India',                          'IN'),
  ('Indonesia',                      'ID'),
  ('Iraq',                           'IQ'),
  ('Israel',                         'IL'),
  ('Italy',                          'IT'),
  ('Jamaica',                        'JM'),
  ('Japan',                          'JP'),
  ('Jordan',                         'JO'),
  ('Kazakhstan',                     'KZ'),
  ('Kenya',                          'KE'),
  ('Korea South',                    'KR'),
  ('South Korea',                    'KR'),  -- DPD alias
  ('Kuwait',                         'KW'),
  ('Kyrgystan',                      'KG'),  -- DPD typo for "Kyrgyzstan"
  ('Laos',                           'LA'),
  ('Latvia',                         'LV'),
  ('Lebanon',                        'LB'),
  ('Lesotho',                        'LS'),
  ('Liberia',                        'LR'),
  ('Libya',                          'LY'),
  ('Liechtenstein',                  'LI'),
  ('Lithuania',                      'LT'),
  ('Luxembourg',                     'LU'),
  ('Macau',                          'MO'),
  ('Macedonia',                      'MK'),
  ('Madagascar',                     'MG'),
  ('Malawi',                         'MW'),
  ('Malaysia',                       'MY'),
  ('Maldives',                       'MV'),
  ('Malta',                          'MT'),
  ('Marshall Islands',               'MH'),
  ('Martinique',                     'MQ'),
  ('Mauritius',                      'MU'),
  ('Mayotte',                        'YT'),
  ('Mexico',                         'MX'),
  ('Moldova',                        'MD'),
  ('Monaco',                         'MC'),
  ('Mongolia',                       'MN'),
  ('Montenegro',                     'ME'),
  ('Montserrat',                     'MS'),
  ('Morocco',                        'MA'),
  ('Mozambique',                     'MZ'),
  ('Namibia',                        'NA'),
  ('Nepal',                          'NP'),
  ('Netherlands',                    'NL'),
  ('New Caledonia',                  'NC'),
  ('New Zealand',                    'NZ'),
  ('Nicaragua',                      'NI'),
  ('Nigeria',                        'NG'),
  ('Norway',                         'NO'),
  ('Oman',                           'OM'),
  ('Pakistan',                       'PK'),
  ('Panama',                         'PA'),
  ('Papua New Guinea',               'PG'),
  ('Paraguay',                       'PY'),
  ('Peru',                           'PE'),
  ('Philippines',                    'PH'),
  ('Poland',                         'PL'),
  ('Portugal',                       'PT'),
  ('Qatar',                          'QA'),
  ('Republic of Kosovo',             'XK'),
  ('Reunion Island',                 'RE'),
  ('Romania',                        'RO'),
  ('Rwanda',                         'RW'),
  ('Saipan',                         'MP'),  -- Northern Mariana Islands
  ('San Marino',                     'SM'),
  ('Saudi Arabia',                   'SA'),
  ('Senegal',                        'SN'),
  ('Serbia',                         'RS'),
  ('Seychelles',                     'SC'),
  ('Singapore',                      'SG'),
  ('Slovakia',                       'SK'),
  ('Slovenia',                       'SI'),
  ('South Africa',                   'ZA'),
  ('Spain',                          'ES'),
  ('Sri Lanka',                      'LK'),
  ('St Kitts & Nevis',               'KN'),
  ('St Lucia',                       'LC'),
  ('St Pierre & Miquilon',           'PM'),
  ('St Vincent',                     'VC'),
  ('Suriname',                       'SR'),
  ('Swaziland',                      'SZ'),
  ('Sweden',                         'SE'),
  ('Switzerland',                    'CH'),
  ('Taiwan',                         'TW'),
  ('Tajikistan',                     'TJ'),
  ('Tanzania',                       'TZ'),
  ('Thailand',                       'TH'),
  ('Togo',                           'TG'),
  ('Trinidad',                       'TT'),
  ('Tunisia',                        'TN'),
  ('Turkey',                         'TR'),
  ('Turkmenistan',                   'TM'),
  ('Turks & Caicos Islands',         'TC'),
  ('UAE',                            'AE'),  -- DPD alias for United Arab Emirates
  ('United Arab Emirates',           'AE'),
  ('Uganda',                         'UG'),
  ('United States',                  'US'),  -- used by DPD-80, DPD-20
  ('USA',                            'US'),  -- used by DPD-10, DPD-60, DPD-60DDP
  ('Uruguay',                        'UY'),
  ('Uzbekistan',                     'UZ'),
  ('Vanuatu',                        'VU'),
  ('Vatican City',                   'VA'),
  ('Vietnam',                        'VN'),
  ('Wallis & Futuna Islands',        'WF'),
  ('Yemen',                          'YE'),
  ('Zambia',                         'ZM'),
  ('Zimbabwe',                       'ZW')
)
INSERT INTO zone_country_codes (zone_id, country_iso)
SELECT z.id, cm.country_iso
FROM   country_map cm
JOIN   zones            z  ON z.name = cm.zone_name
JOIN   courier_services cs ON cs.id = z.courier_service_id
JOIN   couriers         c  ON c.id  = cs.courier_id
WHERE  c.code = 'DPD'
  AND  cs.service_code IN (
    'DPD-10', 'DPD-10DDP',
    'DPD-19DDP', 'DPD-39DDP',
    'DPD-60', 'DPD-60DDP',
    'DPD-80', 'DPD-20'
  )
ON CONFLICT (zone_id, country_iso) DO NOTHING;

DO $$
DECLARE
  v_inserted INT;
BEGIN
  SELECT COUNT(*) INTO v_inserted
  FROM zone_country_codes zcc
  JOIN zones z ON z.id = zcc.zone_id
  JOIN courier_services cs ON cs.id = z.courier_service_id
  JOIN couriers c ON c.id = cs.courier_id
  WHERE c.code = 'DPD'
    AND cs.service_code IN ('DPD-10','DPD-10DDP','DPD-60','DPD-60DDP','DPD-80','DPD-20','DPD-19DDP','DPD-39DDP');

  RAISE NOTICE 'Migration 119 complete — DPD international zone_country_codes total: %', v_inserted;
END $$;

COMMIT;
