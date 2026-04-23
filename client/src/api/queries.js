const BASE = '/api/queries';

// ─── Inbox ────────────────────────────────────────────────────────────────────

export async function fetchInbox(params = {}) {
  const qs = new URLSearchParams();
  if (params.status)        qs.set('status', params.status);
  if (params.courier)       qs.set('courier', params.courier);
  if (params.query_type)    qs.set('query_type', params.query_type);
  if (params.attention)     qs.set('attention', 'true');
  if (params.assigned_to)   qs.set('assigned_to', params.assigned_to);
  if (params.search)        qs.set('search', params.search);
  if (params.limit)         qs.set('limit', params.limit);
  if (params.offset)        qs.set('offset', params.offset);
  const r = await fetch(`${BASE}?${qs}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchStats() {
  const r = await fetch(`${BASE}/stats`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchUnmatched() {
  const r = await fetch(`${BASE}/unmatched`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchQuery(id) {
  const r = await fetch(`${BASE}/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createQuery(body) {
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateQuery(id, body) {
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function approveEmail(queryId, body) {
  const r = await fetch(`${BASE}/${queryId}/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function flagAttention(queryId, body) {
  const r = await fetch(`${BASE}/${queryId}/attention`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function mapSender(body) {
  const r = await fetch(`${BASE}/map-sender`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchSenderSuggestions(email) {
  const r = await fetch(`${BASE}/sender-suggestions?email=${encodeURIComponent(email)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
