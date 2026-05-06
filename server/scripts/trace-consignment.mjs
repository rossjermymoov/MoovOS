/**
 * trace-consignment.mjs
 *
 * Deep diagnostic for a single DPD consignment number.
 * Answers all three of the user's questions:
 *   1. What is total_cost_price and zone_id for this tracking number?
 *   2. What is the exact delta vs carrier invoice amount?
 *   3. Did the engine find this charge in the verifiedPool? If not, why?
 *
 * Also runs:
 *   Gap 1 check — is the unique index on carrier_direct in place?
 *   Gap 2 check — any courier strings that don't match any carrier?
 *
 * Usage (from /server directory):
 *   node scripts/trace-consignment.mjs <tracking_number> [carrier_amount]
 *
 * Example:
 *   node scripts/trace-consignment.mjs 2313756977 21.70
 *
 * Requires DATABASE_URL in environment (or .env file in /server):
 *   DATABASE_URL=postgresql://... node scripts/trace-consignment.mjs 2313756977
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 3,
  connectionTimeoutMillis: 5000,
});

const q = (text, params) => pool.query(text, params);

function hr(char = '─', width = 70) { console.log(char.repeat(width)); }
function section(title) { hr(); console.log(`  ${title}`); hr(); }

async function main() {
  const tracking     = process.argv[2];
  const carrierAmt   = process.argv[3] ? parseFloat(process.argv[3]) : null;

  if (!tracking) {
    console.error('Usage: node scripts/trace-consignment.mjs <tracking_number> [carrier_amount]');
    process.exit(1);
  }

  const trackKey = tracking.trim().toUpperCase();

  // Build variants the same way poolLookup and consignment-trace do
  const variants = [trackKey];
  if (trackKey.startsWith('600') && trackKey.length > 5) {
    variants.push(trackKey.slice(3), trackKey.slice(2));
  } else if (trackKey.startsWith('60') && trackKey.length > 4) {
    variants.push(trackKey.slice(2));
  } else {
    variants.push('60' + trackKey);
  }

  console.log('\n');
  section(`DEEP TRACE — consignment: ${tracking}`);
  console.log(`  Variants searched: ${variants.join(', ')}\n`);

  // ─── Step 1: Shipment lookup ────────────────────────────────────────────────
  section('STEP 1 — Shipment Lookup');

  const shipRes = await q(`
    SELECT
      s.id              AS shipment_id,
      s.courier,
      s.dc_service_id,
      s.tracking_codes,
      s.reference,
      s.reference_2,
      s.total_weight_kg,
      s.parcel_count,
      s.ship_to_postcode,
      s.created_at
    FROM shipments s
    WHERE EXISTS (
      SELECT 1 FROM unnest(s.tracking_codes) tc WHERE UPPER(tc) = ANY($1)
    )
       OR s.dc_service_id = ANY($1)
    ORDER BY s.created_at DESC
    LIMIT 5
  `, [variants]);

  if (shipRes.rows.length === 0) {
    console.log('  ❌  NOT IN DB — no shipment found with this tracking number');
    console.log('      The consignment number is not in shipments.tracking_codes or dc_service_id.');
    console.log('      This is a POOL MISS by definition — no charge to compare against.\n');
    await gap2Check();
    await pool.end();
    return;
  }

  for (const s of shipRes.rows) {
    console.log(`  ✅  Shipment ID:      ${s.shipment_id}`);
    console.log(`      courier:          "${s.courier}"`);
    console.log(`      tracking_codes:   ${JSON.stringify(s.tracking_codes)}`);
    console.log(`      dc_service_id:    ${s.dc_service_id || '(null)'}`);
    console.log(`      reference:        ${s.reference || '(null)'}`);
    console.log(`      weight_kg:        ${s.total_weight_kg}`);
    console.log(`      parcel_count:     ${s.parcel_count}`);
    console.log(`      postcode:         ${s.ship_to_postcode || '(null)'}`);
    console.log(`      created_at:       ${s.created_at}`);
    console.log('');
  }

  const shipment = shipRes.rows[0];

  // ─── Step 2: Charge records ─────────────────────────────────────────────────
  section('STEP 2 — Charge Records (all types)');

  const chargeRes = await q(`
    SELECT
      c.id              AS charge_id,
      c.charge_type,
      c.cost_price,
      c.sell_price,
      c.verified,
      c.cancelled,
      c.source,
      c.zone_id,
      c.courier_service_id,
      c.created_at,
      c.customer_id,
      cu.business_name  AS customer_name,
      -- total_cost_price: base + all fuel/surcharge child charges
      COALESCE(c.cost_price, 0)
        + COALESCE((
            SELECT SUM(sc.cost_price)
            FROM   charges sc
            WHERE  sc.shipment_id = c.shipment_id
              AND  sc.charge_type IN ('fuel','surcharge')
              AND  sc.cancelled   = false
          ), 0)         AS total_cost_price
    FROM   charges c
    LEFT JOIN customers cu ON cu.id = c.customer_id
    WHERE  c.shipment_id = $1
    ORDER BY c.charge_type, c.created_at DESC
  `, [shipment.shipment_id]);

  if (chargeRes.rows.length === 0) {
    console.log('  ❌  NO CHARGES — shipment exists but has no charge records at all');
  }

  for (const c of chargeRes.rows) {
    const status = c.cancelled ? '🚫 CANCELLED' : (c.verified ? '✅ verified' : '⚠️  NOT verified');
    console.log(`  charge_id:        ${c.charge_id}`);
    console.log(`  type:             ${c.charge_type}`);
    console.log(`  status:           ${status}`);
    console.log(`  source:           ${c.source || '(null)'}`);
    console.log(`  customer:         ${c.customer_name || '(unknown)'} (id=${c.customer_id})`);
    console.log(`  cost_price:       £${Number(c.cost_price || 0).toFixed(2)}`);
    console.log(`  total_cost_price: £${Number(c.total_cost_price || 0).toFixed(2)}  ← engine uses this`);
    console.log(`  zone_id:          ${c.zone_id || '(null)'}`);
    console.log(`  courier_service:  ${c.courier_service_id || '(null)'}`);
    console.log(`  created_at:       ${c.created_at}`);
    console.log('');
  }

  // ─── Step 3: Pool eligibility ───────────────────────────────────────────────
  section('STEP 3 — Pool Eligibility');

  // Find DPD carrier
  const dpdRes = await q(`
    SELECT id, code, name, aliases
    FROM   couriers
    WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
    ORDER BY id
    LIMIT 5
  `);

  console.log('  DPD carrier records:');
  for (const c of dpdRes.rows) {
    console.log(`    id=${c.id}  code="${c.code}"  name="${c.name}"  aliases=${JSON.stringify(c.aliases)}`);
  }
  console.log('');

  const courierLower = (shipment.courier || '').toLowerCase();
  let poolPass = false;
  let poolFailReason = null;

  for (const carrier of dpdRes.rows) {
    const codeMatch = (carrier.code || '').toLowerCase() === courierLower;
    const nameMatch = (carrier.name || '').toLowerCase() === courierLower;
    const aliasMatch = (carrier.aliases || []).some(a => a.toLowerCase() === courierLower);
    if (codeMatch || nameMatch || aliasMatch) {
      poolPass = true;
      console.log(`  ✅  Carrier match: shipments.courier="${shipment.courier}" matches courier id=${carrier.id}`);
      console.log(`      (via ${codeMatch ? 'code' : nameMatch ? 'name' : 'alias'})`);
      break;
    }
  }

  if (!poolPass) {
    poolFailReason = `shipments.courier="${shipment.courier}" does NOT match any DPD carrier code/name/alias`;
    console.log(`  ❌  CARRIER MISMATCH: ${poolFailReason}`);
  }

  console.log('');

  // Check verification gate
  const courierCharge = chargeRes.rows.find(r => r.charge_type === 'courier' && !r.cancelled);
  if (!courierCharge) {
    console.log('  ❌  POOL MISS REASON: No active (non-cancelled) courier charge exists');
  } else if (!courierCharge.verified) {
    console.log('  ❌  POOL MISS REASON: Courier charge exists but verified=false');
  } else if (!poolPass) {
    console.log('  ❌  POOL MISS REASON: Carrier name mismatch (see above)');
  } else {
    const hasTrackingGate = (shipment.tracking_codes && shipment.tracking_codes.length > 0)
      || shipment.dc_service_id;
    if (!hasTrackingGate) {
      console.log('  ❌  POOL MISS REASON: tracking_codes is empty AND dc_service_id is null');
    } else {
      console.log('  ✅  POOL HIT — this charge WOULD be in the verified pool');
    }
  }
  console.log('');

  // ─── Step 4: The Maths ─────────────────────────────────────────────────────
  section('STEP 4 — The Maths');

  if (courierCharge) {
    const expectedBase     = Number(courierCharge.cost_price || 0);
    const totalCostPrice   = Number(courierCharge.total_cost_price || 0);

    console.log('  Engine uses (separate_fuel_rows=true for DPD):');
    console.log(`    expectedBase (cost_price)   = £${expectedBase.toFixed(2)}`);
    console.log(`    total_cost_price             = £${totalCostPrice.toFixed(2)}`);
    console.log('');

    if (carrierAmt !== null) {
      const delta = Math.round((carrierAmt - expectedBase) * 100) / 100;
      const deltaWithFuel = Math.round((carrierAmt - totalCostPrice) * 100) / 100;
      console.log(`  Carrier invoice amount:        £${carrierAmt.toFixed(2)}`);
      console.log(`  Delta (vs base cost_price):    £${delta.toFixed(2)}`);
      console.log(`  Delta (vs total_cost_price):   £${deltaWithFuel.toFixed(2)}`);
      console.log('');
      console.log('  For the engine to produce delta=0:');
      console.log(`    colSurchargeTotal must equal £${delta.toFixed(2)}`);
      console.log('  If delta is still showing, check:');
      console.log('    a) Is the profile surcharge_columns configured with the correct surcharge UUID?');
      console.log('    b) Is the column name in the profile matching the CSV header (case/suffix)?');
      console.log('    c) Is the charge a POOL HIT? (Pool misses skip colSurchargeTotal entirely)');
    } else {
      console.log('  (Pass carrier_amount as 2nd arg to see exact delta calculation)');
    }
  }

  // ─── Step 5: Gap 2 — Courier name diagnostic ──────────────────────────────
  await gap2Check();

  // ─── Step 6: Gap 1 — Unique index check ───────────────────────────────────
  section('GAP 1 — Unique Index Check (migration 158)');

  const idxRes = await q(`
    SELECT indexname, indexdef
    FROM   pg_indexes
    WHERE  tablename = 'charges'
      AND  indexname LIKE '%carrier_direct%'
  `);

  if (idxRes.rows.length === 0) {
    console.log('  ⚠️  No carrier_direct unique index found — migration 158 may not have run');
  } else {
    for (const idx of idxRes.rows) {
      console.log(`  ✅  ${idx.indexname}`);
      console.log(`      ${idx.indexdef}`);
    }
  }
  console.log('');

  await pool.end();
}

async function gap2Check() {
  section('GAP 2 — Courier Name Diagnostic (pool visibility)');

  const res = await q(`
    WITH carrier_strings AS (
      SELECT id AS carrier_id, code AS match_str, name AS carrier_name FROM couriers
      UNION ALL
      SELECT id, name AS match_str, name AS carrier_name FROM couriers
      UNION ALL
      SELECT id, unnest(aliases) AS match_str, name AS carrier_name
      FROM   couriers WHERE array_length(aliases, 1) > 0
    ),
    shipment_courier_counts AS (
      SELECT
        s.courier                   AS courier_str,
        COUNT(DISTINCT c.id)        AS active_charge_count,
        COUNT(DISTINCT c.customer_id) AS customer_count
      FROM   charges   c
      JOIN   shipments s ON s.id = c.shipment_id
      WHERE  c.charge_type = 'courier'
        AND  c.cancelled   = false
        AND  c.verified    = true
        AND  s.courier     IS NOT NULL
        AND  s.courier     != ''
      GROUP BY s.courier
    ),
    matched AS (
      SELECT DISTINCT scc.courier_str
      FROM   shipment_courier_counts scc
      JOIN   carrier_strings cs ON LOWER(scc.courier_str) = LOWER(cs.match_str)
    )
    SELECT
      scc.courier_str,
      scc.active_charge_count,
      scc.customer_count,
      CASE WHEN m.courier_str IS NOT NULL THEN true ELSE false END AS matches_carrier
    FROM   shipment_courier_counts scc
    LEFT JOIN matched m ON m.courier_str = scc.courier_str
    ORDER BY matches_carrier ASC, scc.active_charge_count DESC
  `);

  const unmatched = res.rows.filter(r => !r.matches_carrier);
  const matched   = res.rows.filter(r => r.matches_carrier);

  const totalInvisible = unmatched.reduce((s, r) => s + parseInt(r.active_charge_count || 0), 0);

  console.log(`  Matched courier strings:   ${matched.length}`);
  console.log(`  Unmatched courier strings: ${unmatched.length}`);
  console.log(`  Total invisible charges:   ${totalInvisible}`);
  console.log('');

  if (unmatched.length === 0) {
    console.log('  ✅  All courier strings match a carrier — no pool visibility gaps');
  } else {
    console.log('  ❌  INVISIBLE COURIER STRINGS:');
    for (const r of unmatched) {
      console.log(`      courier="${r.courier_str}"  charges=${r.active_charge_count}  customers=${r.customer_count}`);
    }
    console.log('');
    console.log('  These charges will never appear in any carrier\'s reconciliation pool.');
    console.log('  Fix: add the courier string as an alias on the correct couriers row.');
    console.log('  e.g.:  UPDATE couriers SET aliases = aliases || \'{DPD Local}\' WHERE code = \'DPD\';');
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
