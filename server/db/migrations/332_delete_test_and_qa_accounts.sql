-- Migration 332: Delete test, QA, and dummy customer accounts
-- Removes all developer testing, QA, and dummy test accounts imported from Billing API.

DO $$
DECLARE
  v_test_dc_ids TEXT[] := ARRAY[
    'Cloud9',
    'DP1-0201',
    'Dep2-0006',
    'DD2-0003',
    'HOF-0008',
    'DF1-0004',
    'DP1-0011',
    '1233-0001',
    'DF1-0007',
    'DF1-0008',
    'DF1-0009',
    '1233-0002',
    'DP1-0014',
    'DF1-0010',
    'DP1-0016',
    'DP1-0017',
    'DDJ1-0001',
    'DP1-0019',
    'DP1-0021',
    'DP1-0024',
    'DP1-0025',
    'AJP1',
    'AJP2',
    'AJP3',
    'AJP4',
    'AJP5',
    'DP1-0027',
    'DP1-0028',
    'DP1-0029',
    'DP1-0030',
    'DF1-0012',
    'DF1-0013',
    'DF1-0014',
    'DQA1-0001',
    'MOOV-0054',
    'DF1-0015',
    'DP1-0034',
    'LQT',
    'DP1-0037',
    'DP1-0038',
    '1233-0003',
    'DQA1-0005',
    'DP1-0043',
    'DDK1-0002',
    'DQA1-0007',
    'DQA1-0009',
    'DQA1-0011',
    'DQA1-0014',
    'DQA1-0015',
    'Barry AI',
    'HOF-0007',
    'HOF-0003',
    'DD2-0002',
    'HOF-0002',
    'HOF-0001',
    'DP1-0001',
    'DP1-0044',
    'DP1-0045',
    'DP2-0001',
    'DDJ1-0002',
    'MOOV-0087',
    'DP1-0046',
    'MOOV-0090',
    'DQA1-0016',
    'DDJ1-0003',
    '123-0001',
    '123-0002',
    '123-0003',
    '123-0004',
    '11-0001',
    'DP1-0047',
    'DDJ1-0004',
    'DD2-0007',
    'DDJ1-0005',
    '123-0005',
    '123-0006',
    'DDJ1-0006',
    '123-0007',
    '123-0008',
    'DP1-0048',
    '123-0010',
    '123-0011',
    '123-0012',
    'HOF-0013',
    'MOOV-0142',
    'DDJ1-0007',
    'DQA1-0017',
    'MOOV-0148',
    'DP1-0051',
    'EFD1-0004',
    'MOOV-0168',
    'DQA1-0018',
    'QDP1-0001',
    'TDP1-0001',
    'DE22-0009',
    'DE22-0011',
    'QDP1-0003',
    'DP1-0053',
    'DE22-0015',
    'TDP1-0005',
    'TDP1-0007',
    'DP1-0003',
    'DP1-0054',
    'TDP1-0009',
    'MOOV-0211'
  ];
BEGIN
  -- Delete customer rates
  DELETE FROM customer_rates
  WHERE customer_id IN (
    SELECT id FROM customers
    WHERE dc_customer_id = ANY(v_test_dc_ids)
       OR account_number = ANY(v_test_dc_ids)
  );

  -- Delete carrier links
  DELETE FROM customer_carrier_links
  WHERE customer_id IN (
    SELECT id FROM customers
    WHERE dc_customer_id = ANY(v_test_dc_ids)
       OR account_number = ANY(v_test_dc_ids)
  );

  -- Delete test customers
  DELETE FROM customers
  WHERE dc_customer_id = ANY(v_test_dc_ids)
     OR account_number = ANY(v_test_dc_ids);
END $$;
