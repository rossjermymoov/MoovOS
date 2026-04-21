/**
 * seedCustomerRates.js
 * Reads server/data/prices.csv and seeds the customer_rates table.
 * Runs at server startup, skipped if table already has data.
 * Mapping from CSV customer_id → MOOV account_number is hardcoded here.
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';
import { query, getClient } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// CSV customer_id → MOOV account_number (matched by name)
const CSV_TO_MOOV = {
  '1644': 'MOOV-0001', '1658': 'MOOV-0004', '1669': 'MOOV-0007', '1670': 'MOOV-0008',
  '1683': 'MOOV-0010', '1689': 'MOOV-0012', '1690': 'MOOV-0013', '1693': 'MOOV-0015',
  '1699': 'MOOV-0016', '1701': 'MOOV-0017', '1703': 'MOOV-0018', '1722': 'MOOV-0022',
  '1723': 'MOOV-0023', '1730': 'MOOV-0026', '1741': 'MOOV-0028', '1752': 'MOOV-0030',
  '1755': 'MOOV-0031', '1756': 'MOOV-0032', '1777': 'MOOV-0035', '1803': 'MOOV-0037',
  '1818': 'MOOV-0040', '1828': 'MOOV-0043', '1837': 'MOOV-0047', '1872': 'MOOV-0058',
  '1881': 'MOOV-0059', '1906': 'MOOV-0061', '1907': 'MOOV-0062', '1908': 'MOOV-0063',
  '1938': 'MOOV-0068', '1941': 'MOOV-0069', '1944': 'MOOV-0071', '1960': 'MOOV-0072',
  '1964': 'MOOV-0074', '1982': 'MOOV-0076', '1985': 'MOOV-0079', '1997': 'MOOV-0081',
  '2002': 'MOOV-0083', '2003': 'MOOV-0084', '2014': 'MOOV-0085', '2036': 'MOOV-0088',
  '2047': 'MOOV-0091', '2056': 'MOOV-0093', '2058': 'MOOV-0094', '2061': 'MOOV-0097',
  '2062': 'MOOV-0098', '2125': 'MOOV-0102', '2128': 'MOOV-0103', '1629': 'MOOV-0104',
  '2135': 'MOOV-0105', '2187': 'MOOV-0106', '2226': 'MOOV-0108', '2235': 'MOOV-0109',
  '2236': 'MOOV-0110', '2250': 'MOOV-0111', '2303': 'MOOV-0112', '2255': 'MOOV-0113',
  '2266': 'MOOV-0114', '2268': 'MOOV-0115', '2284': 'MOOV-0116', '2286': 'MOOV-0117',
  '2299': 'MOOV-0118', '2304': 'MOOV-0119', '2315': 'MOOV-0120', '2320': 'MOOV-0121',
  '2326': 'MOOV-0122', '2347': 'MOOV-0123', '2348': 'MOOV-0124', '2351': 'MOOV-0125',
  '2352': 'MOOV-0126', '2353': 'MOOV-0127', '2357': 'MOOV-0128', '2358': 'MOOV-0129',
  '2363': 'MOOV-0130', '2364': 'MOOV-0131', '2448': 'MOOV-0134', '2454': 'MOOV-0135',
  '2462': 'MOOV-0136', '2588': 'MOOV-0139', '2589': 'MOOV-0140', '2595': 'MOOV-0141',
  '2600': 'MOOV-0143', '2605': 'MOOV-0144', '2607': 'MOOV-0145', '2615': 'MOOV-0146',
  '2616': 'MOOV-0147', '2641': 'MOOV-0149', '2662': 'MOOV-0150', '2663': 'MOOV-0151',
  '2670': 'MOOV-0153', '2671': 'MOOV-0154', '2672': 'MOOV-0155', '2713': 'MOOV-0156',
  '2714': 'MOOV-0157', '2717': 'MOOV-0158', '2737': 'MOOV-0160', '2745': 'MOOV-0161',
  '2752': 'MOOV-0162', '2769': 'MOOV-0164', '2770': 'MOOV-0165', '2772': 'MOOV-0166',
  '2786': 'MOOV-0169', '2823': 'MOOV-0171',
};

const BATCH_SIZE = 500;

export async function seedCustomerRates() {
  // Check total — used for logging only, not for skipping
  const { rows: countRows } = await query('SELECT COUNT(*) FROM customer_rates');
  console.log(`ℹ️  customer_rates currently has ${countRows[0].count} rows — checking per customer for gaps…`);

  console.log('📦 Seeding customer_rates from prices.csv…');

  // Load customer UUID lookup: account_number → uuid
  const { rows: customers } = await query('SELECT id, account_number FROM customers');
  const accountToUuid = {};
  for (const c of customers) accountToUuid[c.account_number] = c.id;

  // Read CSV line by line into buckets per customer
  const csvPath = path.join(__dirname, '..', 'data', 'prices.csv');
  const rowsByCustomer = {}; // uuid → [row, ...]

  await new Promise((resolve, reject) => {
    const rl = createInterface({ input: createReadStream(csvPath) });
    let header = true;
    rl.on('line', line => {
      if (header) { header = false; return; }
      // CSV: customer_id,customer_name,courier_id,courier_code,courier_name,service_id,service_code,service_name,zone_id,zone_name,weight_class_id,weight_class_name,price
      const parts = line.split(',');
      // Handle quoted fields
      const fields = parseCSVLine(line);
      if (fields.length < 13) return;

      const [csvCustId, , courierId, courierCode, courierName, serviceId, serviceCode, serviceName, zoneId, zoneName, weightClassId, weightClassName, price] = fields;

      const moovAcct = CSV_TO_MOOV[csvCustId];
      if (!moovAcct) return; // not a MOOV customer
      const uuid = accountToUuid[moovAcct];
      if (!uuid) return; // customer not in DB yet

      if (!rowsByCustomer[uuid]) rowsByCustomer[uuid] = [];
      rowsByCustomer[uuid].push([
        uuid,
        parseInt(courierId), courierCode, courierName,
        parseInt(serviceId), serviceCode, serviceName,
        parseInt(zoneId), zoneName,
        parseInt(weightClassId), weightClassName,
        parseFloat(price),
      ]);
    });
    rl.on('close', resolve);
    rl.on('error', reject);
  });

  // Fetch which customers already have rates
  const { rows: existingRows } = await query(
    'SELECT DISTINCT customer_id FROM customer_rates'
  );
  const alreadySeeded = new Set(existingRows.map(r => r.customer_id));

  const toSeed = Object.entries(rowsByCustomer).filter(([uuid]) => !alreadySeeded.has(uuid));
  if (toSeed.length === 0) {
    console.log('ℹ️  All customers already have rate data — skipping');
    return;
  }
  console.log(`📦 Seeding rates for ${toSeed.length} customers with missing data…`);

  // One transaction per customer so a large customer failing doesn't affect others
  let totalInserted = 0;
  for (const [uuid, rows] of toSeed) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const values = [];
        const placeholders = batch.map((row, idx) => {
          const base = idx * 12;
          values.push(...row);
          return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12})`;
        });
        await client.query(`
          INSERT INTO customer_rates
            (customer_id, courier_id, courier_code, courier_name, service_id, service_code, service_name, zone_id, zone_name, weight_class_id, weight_class_name, price)
          VALUES ${placeholders.join(',')}
          ON CONFLICT (customer_id, service_id, zone_name, weight_class_name) DO NOTHING
        `, values);
        totalInserted += batch.length;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to seed rates for customer ${uuid}:`, err.message);
    } finally {
      client.release();
    }
  }
  console.log(`✅ Seeded ${totalInserted.toLocaleString()} rate rows for ${toSeed.length} customers`);
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim().replace(/^"|"$/g, ''));
  return fields;
}
