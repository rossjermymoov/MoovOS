/**
 * voilaClient.js — Voila (heyvoila.io) API client
 *
 * Fetches full shipment data from the Voila API when a webhook was missed.
 * Auth: HTTP Basic with DC_API_USER / DC_API_TOKEN env vars
 * Base: https://app.heyvoila.io/api
 */

const VOILA_BASE  = 'https://app.heyvoila.io/api';
const VOILA_USER  = process.env.DC_API_USER;
const VOILA_TOKEN = process.env.DC_API_TOKEN;

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
      id:                    String(s.id),
      account_number:        s.account_number   || null,
      account_name:          s.account_name     || null,
      courier:               s.courier          || rs.courier?.friendly_service_name || null,
      friendly_service_name: s.friendly_service_name || rs.courier?.friendly_service_name || null,
      reference:             s.reference,
      reference_2:           s.reference_2      || null,
      ship_to_postcode:      s.ship_to_postcode,
      ship_to_name:          s.ship_to_name,
      ship_to_company_name:  s.ship_to_company_name || null,
      ship_to_country_iso:   s.ship_to_country_iso,
      collection_date:       s.collection_date,
      parcel_count:          s.parcel_count      || 1,
      cancelled:             s.cancelled         || false,
      create_label_parcels:  s.create_label_parcels || [],
    },
    request_shipment: typeof s.request_shipment === 'string'
      ? s.request_shipment
      : JSON.stringify(s.request_shipment || {}),
  };
}

// ─── Fetch by Voila shipment ID ───────────────────────────────────────────────
export async function fetchShipmentById(voilaId) {
  const data = await voilaGet('/shipments.json', { id: voilaId });
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

// ─── Fetch by reference + tracking code (handles shared-reference consolidations) ──
// When two bookings share the same sender reference (e.g. consolidated DPD parcels),
// this picks the correct one by matching the tracking code in create_label_parcels.
// Returns null if no shipment has that tracking code.
export async function fetchShipmentByReferenceAndTracking(reference, trackingCode) {
  const data = await voilaGet('/shipments.json', { reference });
  const list = Array.isArray(data) ? data : (data.shipments || [data]);
  // Find the shipment whose create_label_parcels contains the specific tracking code
  const match = list.find(s =>
    (s.create_label_parcels || []).some(p => p.tracking_code === trackingCode)
  );
  // Fall back to any reference match if tracking code not found in parcels
  // (handles edge case where tracking code is on the shipment level)
  const fallback = match || list.find(s => s.reference === reference || s.reference_2 === reference);
  return fallback ? mapToWebhookPayload(fallback) : null;
}

// ─── Fetch by date range (paginated) ─────────────────────────────────────────
// Used for disaster-recovery bulk backfill when a webhook outage is detected.
// startDate / endDate: ISO 8601 strings e.g. '2024-06-01T08:00:00'
// Returns an array of mapped webhook payloads (all pages combined).
export async function fetchShipmentsByDateRange(startDate, endDate, { onProgress } = {}) {
  const PAGE_SIZE = 50;
  let page = 1;
  const allPayloads = [];

  while (true) {
    const data = await voilaGet('/shipments.json', {
      startDateFilter: startDate,
      endDateFilter:   endDate,
      page,
      per_page:        PAGE_SIZE,
    });

    const list = Array.isArray(data) ? data : (data.shipments || []);
    if (!list.length) break;

    for (const s of list) {
      allPayloads.push(mapToWebhookPayload(s));
    }

    if (onProgress) onProgress({ page, fetched: allPayloads.length });

    // Stop if we got fewer results than a full page (last page)
    if (list.length < PAGE_SIZE) break;
    page++;
  }

  return allPayloads;
}

// ─── Probe: return raw API response (diagnostics only) ───────────────────────
export async function probeShipmentRaw(voilaId) {
  return voilaGet('/shipments.json', { id: voilaId });
}

export async function probeShipmentByReference(reference, paramName = 'reference') {
  const params = reference && paramName ? { [paramName]: reference } : {};
  return voilaGet('/shipments.json', params);
}

// ─── Request tracking update for a single shipment ───────────────────────────
//
// Calls the Voila on-demand tracking endpoint.  The tracking_request_id and
// tracking_request_hash come from the original shipment.created webhook response
// and are stored on the shipments row (added in migration 236).
//
// Endpoint: POST https://app.heyvoila.io/api/couriers/v1/get-tracking
// Body: { tracking_request_id, tracking_request_hash }
//
// Returns the raw JSON response from Voila (tracking events / status data).
export async function requestTrackingUpdate(trackingRequestId, trackingRequestHash) {
  if (!trackingRequestId || !trackingRequestHash) {
    throw new Error('trackingRequestId and trackingRequestHash are both required');
  }
  if (!VOILA_USER || !VOILA_TOKEN) {
    throw new Error('DC_API_USER / DC_API_TOKEN env vars not set');
  }

  // Note: tracking endpoint uses api-user / api-token headers, not Basic Auth
  const url = `${VOILA_BASE}/couriers/v1/get-tracking`;
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'api-user':     VOILA_USER,
      'api-token':    VOILA_TOKEN,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify({
      tracking_request_id:   trackingRequestId,
      tracking_request_hash: trackingRequestHash,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voila tracking API ${res.status}: ${body.slice(0, 300)}`);
  }

  return res.json();
}
