/**
 * seedCustomerRates.js
 * Reads server/data/prices.csv and seeds the customer_rates table.
 * Runs at server startup. Skips customers that already have rates.
 *
 * Matching strategy:
 *   1. Try hardcoded CSV_TO_MOOV map (csv_id → account_number) — fast and exact
 *   2. Fall back to normalised business_name fuzzy match
 *
 * After seeding rates, ensures customer_carrier_links are backfilled so
 * the pricing tab shows active carriers correctly.
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';
import { query, getClient } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Hardcoded CSV customer_id → MOOV account_number overrides (takes priority over name match)
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

/** Normalise a business name for fuzzy matching */
function normaliseName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\b(ltd|limited|plc|llp|inc|group|holdings?|co|uk|the|and|&)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function seedCustomerRates() {
  const { rows: countRows } = await query('SELECT COUNT(*) FROM customer_rates');
  console.log(`ℹ️  customer_rates has ${countRows[0].count} rows — checking for gaps…`);

  // Load all customers: id, account_number, business_name
  const { rows: customers } = await query('SELECT id, account_number, business_name FROM customers');
  const accountToUuid  = {};  // account_number → uuid
  const nameToUuid     = {};  // normalised name → uuid (for fuzzy fallback)

  for (const c of customers) {
    if (c.account_number) accountToUuid[c.account_number] = c.id;
    const norm = normaliseName(c.business_name);
    if (norm) nameToUuid[norm] = c.id;
  }

  // Read CSV — match each row to a customer UUID
  const csvPath = path.join(__dirname, '..', 'data', 'prices.csv');
  const rowsByCustomer = {};   // uuid → rows[]
  const unmatchedNames = new Set();

  await new Promise((resolve, reject) => {
    const rl = createInterface({ input: createReadStream(csvPath) });
    let header = true;
    rl.on('line', line => {
      if (header) { header = false; return; }
      const fields = parseCSVLine(line);
      if (fields.length < 13) return;

      const [csvCustId, csvCustName, courierId, courierCode, courierName,
             serviceId, serviceCode, serviceName,
             zoneId, zoneName, weightClassId, weightClassName, price] = fields;

      // 1. Try hardcoded map first
      let uuid = null;
      const moovAcct = CSV_TO_MOOV[csvCustId];
      if (moovAcct) uuid = accountToUuid[moovAcct];

      // 2. Fall back to name match
      if (!uuid) {
        const norm = normaliseName(csvCustName);
        uuid = nameToUuid[norm] || null;
      }

      if (!uuid) {
        unmatchedNames.add(csvCustName);
        return;
      }

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

  if (unmatchedNames.size > 0) {
    console.log(`⚠️  ${unmatchedNames.size} CSV customers could not be matched to the DB (skipped)`);
  }

  // Only seed customers that have no rates yet
  const { rows: existingRows } = await query('SELECT DISTINCT customer_id FROM customer_rates');
  const alreadySeeded = new Set(existingRows.map(r => r.customer_id));

  const toSeed = Object.entries(rowsByCustomer).filter(([uuid]) => !alreadySeeded.has(uuid));
  if (toSeed.length === 0) {
    console.log('ℹ️  All matched customers already have rate data');
  } else {
    console.log(`📦 Seeding rates for ${toSeed.length} customers…`);
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
              (customer_id, courier_id, courier_code, courier_name,
               service_id, service_code, service_name,
               zone_id, zone_name, weight_class_id, weight_class_name, price)
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

  // ── Backfill customer_carrier_links ───────────────────────────────────────
  // Ensure every customer with rate data has an active carrier link.
  // This runs every startup so it self-heals after any migration gaps.
  try {
    // Create master carrier_rate_cards for couriers that don't have one
    await query(`
      INSERT INTO carrier_rate_cards (courier_id, name, is_master, is_active)
      SELECT DISTINCT c.id, 'Master', true, true
      FROM customer_rates cr
      JOIN couriers c ON c.code = cr.courier_code
      WHERE NOT EXISTS (
        SELECT 1 FROM carrier_rate_cards crc2
        WHERE crc2.courier_id = c.id AND crc2.is_master = true
      )
    `);

    // Insert missing carrier links
    const { rowCount } = await query(`
      INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
      SELECT DISTINCT ON (cr.customer_id, c.id)
        cr.customer_id,
        c.id,
        (SELECT id FROM carrier_rate_cards WHERE courier_id = c.id AND is_master = true LIMIT 1)
      FROM customer_rates cr
      JOIN couriers c ON c.code = cr.courier_code
      ORDER BY cr.customer_id, c.id
      ON CONFLICT (customer_id, courier_id) DO NOTHING
    `);

    if (rowCount > 0) {
      console.log(`🔗 Backfilled ${rowCount} customer_carrier_links`);
    }
  } catch (err) {
    // Non-fatal — carrier links are a UI convenience, not core data
    console.warn('⚠️  carrier link backfill skipped:', err.message);
  }
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
