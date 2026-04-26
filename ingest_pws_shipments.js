#!/usr/bin/env node
/**
 * ingest_pws_shipments.js
 *
 * Ingests PWS Leeds Ltd DHL shipments from Voila API data into MoovOS billing
 * via POST /api/billing/webhook with event_type: 'shipment.created'.
 *
 * Source: /tmp/pws_all_shipments.json (fetched from Voila API)
 * Target: http://localhost:5000/api/billing/webhook
 *
 * Skips Premier 24 shipments (MP-0000036015, MP-0000035979) — these are
 * returns that are never booked on the MoovOS system.
 */

const fs   = require('fs');
const http = require('http');

const WEBHOOK_URL = 'http://localhost:5000/api/billing/webhook';
const DATA_FILE   = '/tmp/pws_all_shipments.json';

// Premier 24 references to skip (returns — not booked in system)
const SKIP_REFS = new Set(['MP-0000036015', 'MP-0000035979']);

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data    = JSON.stringify(body);
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || 80,
      path:     parsed.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(options, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const shipments = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // Filter to invoice shipments only — skip Premier 24 returns
  const toIngest = shipments.filter(s => !SKIP_REFS.has(s.reference));

  console.log(`Found ${shipments.length} total shipments, ingesting ${toIngest.length} (skipping ${SKIP_REFS.size} Premier 24 returns)`);
  console.log('---');

  const results = { created: 0, duplicate: 0, error: 0, skipped: 0 };
  const errors  = [];

  for (const s of toIngest) {
    const rs = JSON.parse(s.request_shipment);

    // Build the webhook payload matching the shape the billing handler expects
    const payload = {
      event_type: 'shipment.created',
      shipment: {
        id:                   String(s.id),
        account_number:       s.account_number || null,
        account_name:         s.account_name   || null,
        courier:              s.courier        || rs.courier?.friendly_service_name || null,
        friendly_service_name: s.friendly_service_name || rs.courier?.friendly_service_name || null,
        reference:            s.reference,
        reference_2:          s.reference_2    || null,
        ship_to_postcode:     s.ship_to_postcode,
        ship_to_name:         s.ship_to_name,
        ship_to_company_name: s.ship_to_company_name || null,
        ship_to_country_iso:  s.ship_to_country_iso,
        collection_date:      s.collection_date,
        parcel_count:         s.parcel_count || 1,
        cancelled:            s.cancelled || false,
        create_label_parcels: s.create_label_parcels || [],
      },
      // Include request_shipment as string so extractReqShipment can parse it
      request_shipment: s.request_shipment,
    };

    try {
      const resp = await post(WEBHOOK_URL, payload);

      if (resp.status === 200 && resp.body?.ok) {
        const action = resp.body.action || 'unknown';
        if (action === 'created') {
          results.created++;
          console.log(`✅ ${s.reference} | ${s.ship_to_postcode} | ${s.friendly_service_name} — created (charge_id: ${resp.body.charge_id || '?'})`);
        } else if (action === 'duplicate') {
          results.duplicate++;
          console.log(`⚠️  ${s.reference} | already exists — skipped`);
        } else {
          results.skipped++;
          console.log(`ℹ️  ${s.reference} | action: ${action} — ${resp.body.reason || ''}`);
        }
      } else {
        results.error++;
        const msg = resp.body?.error || JSON.stringify(resp.body);
        console.log(`❌ ${s.reference} | HTTP ${resp.status} — ${msg}`);
        errors.push({ reference: s.reference, status: resp.status, error: msg });
      }
    } catch (err) {
      results.error++;
      console.log(`❌ ${s.reference} | Request failed — ${err.message}`);
      errors.push({ reference: s.reference, error: err.message });
    }

    // Small delay to avoid hammering the server
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('---');
  console.log(`Results: ${results.created} created | ${results.duplicate} duplicate | ${results.skipped} skipped | ${results.error} errors`);

  if (errors.length) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  ${e.reference}: ${e.error}`));
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
