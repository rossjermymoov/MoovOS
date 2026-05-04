/**
 * voilaClient.js — Voila (heyvoila.io) API client
 *
 * Provides fetchShipment(voilaId) and fetchShipmentByReference(ref) to
 * retrieve full shipment data from the Voila API when a webhook was missed.
 *
 * Auth: HTTP Basic, credentials from env vars DC_API_USER / DC_API_TOKEN
 * Base: https://app.heyvoila.io/api
 */

const VOILA_BASE     = 'https://app.heyvoila.io/api';
const VOILA_USER     = process.env.DC_API_USER;
const VOILA_TOKEN    = process.env.DC_API_TOKEN;

function basicAuth() {
  if (!VOILA_USER || !VOILA_TOKEN) {
    throw new Error('DC_API_USER / DC_API_TOKEN env vars not set');
  }
  return 'Basic ' + Buffer.from(`${VOILA_USER}:${VOILA_TOKEN}`).toString('base64');
}

async function voilaGet(path, params = {}) {
  const url = new URL(`${VOILA_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': basicAuth(),
      'Accept':        'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voila API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

// ─── Map raw Voila API shipment → processShipment webhook payload ─────────────
// Mirrors the shape built in ingest_pws_shipments.js so processShipment works
// identically whether the data came from a webhook or an API backfill.
export function mapToWebhookPayload(s) {
  let rs = {};
  try {
    rs = typeof s.request_shipment === 'string'
      ? JSON.parse(s.request_shipment)
      : (s.request_shipment || {});
  } catch { /* leave rs as {} */ }

  return {
    event_type: 'shipment.created',
    shipment: {
      id:                   String(s.id),
      account_number:       s.account_number  || null,
      account_name:         s.account_name    || null,
      courier:              s.courier         || rs.courier?.friendly_service_name || null,
      friendly_service_name: s.friendly_service_name || rs.courier?.friendly_service_name || null,
      reference:            s.reference,
      reference_2:          s.reference_2     || null,
      ship_to_postcode:     s.ship_to_postcode,
      ship_to_name:         s.ship_to_name,
      ship_to_company_name: s.ship_to_company_name || null,
      ship_to_country_iso:  s.ship_to_country_iso,
      collection_date:      s.collection_date,
      parcel_count:         s.parcel_count    || 1,
      cancelled:            s.cancelled       || false,
      create_label_parcels: s.create_label_parcels || [],
    },
    request_shipment: typeof s.request_shipment === 'string'
      ? s.request_shipment
      : JSON.stringify(s.request_shipment || {}),
  };
}

// ─── Fetch a single shipment by Voila ID ─────────────────────────────────────
export async function fetchShipmentById(voilaId) {
  // Try direct ID filter first
  const data = await voilaGet('/shipments.json', { id: voilaId });
  // API may return array or object — normalise
  const list = Array.isArray(data) ? data : (data.shipments || [data]);
  const match = list.find(s => String(s.id) === String(voilaId));
  return match ? mapToWebhookPayload(match) : null;
}

// ─── Fetch by order reference ─────────────────────────────────────────────────
export async function fetchShipmentByReference(reference) {
  const data = await voilaGet('/shipments.json', { reference });
  const list = Array.isArray(data) ? data : (data.shipments || [data]);
  const match = list.find(s => s.reference === reference || s.reference_2 === reference);
  return match ? mapToWebhookPayload(match) : null;
}

// ─── Fetch by order reference (direct API call, no DB lookup needed) ─────────
export async function fetchShipmentByReference(reference) {
  const data = await voilaGet('/shipments.json', { reference });
  const list = Array.isArray(data) ? data : (data.shipments || [data]);
  const match = list.find(s => s.reference === reference || s.reference_2 === reference);
  return match ? mapToWebhookPayload(match) : null;
}

// ─── Probe: returns raw API response for a given ID or reference ─────────────
export async function probeShipmentRaw(voilaId) {
  return voilaGet('/shipments.json', { id: voilaId });
}

export async function probeShipmentByReference(reference) {
  return voilaGet('/shipments.json', { reference });
}
