/**
 * gmailSync.js — Polls Gmail inbox and imports emails as tickets.
 * Read-only. Never sends or modifies Gmail messages.
 */

import { google } from 'googleapis';
// ─── AI summary via Claude Haiku ─────────────────────────────────────────────
async function generateSummary(subject, body) {
  const snippet = ((body || '')).slice(0, 500);
  const prompt = `You are summarising a support email for a parcel courier reseller's inbox.

Subject: ${subject || '(none)'}
Body: ${snippet}

Write 2 sentences max. Cover: what the issue is, who sent it (customer or courier), and how urgent or emotional it feels. Be direct and specific — mention tracking numbers, courier names, or key facts if present. Do not start with "The email" or "This email".`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (resp.ok) {
      const json = await resp.json();
      const text = (json.content?.[0]?.text || '').trim();
      if (text) return text;
    }
  } catch (e) {
    console.error('[Gmail sync] AI summary failed:', e.message);
  }

  // Fallback: rule-based
  const text = ((subject || '') + ' ' + (body || '')).toLowerCase().slice(0, 400);
  const intent =
    /missing|not arrived|not received|where is|lost/.test(text) ? 'Missing parcel' :
    /damaged|broken|smashed|crushed/.test(text)                  ? 'Damaged goods' :
    /wrong item|incorrect item/.test(text)                       ? 'Wrong item delivered' :
    /not delivered|failed delivery/.test(text)                   ? 'Failed delivery' :
    /returned|return to sender/.test(text)                       ? 'Parcel returned' :
    /claim|compensation|refund/.test(text)                       ? 'Claim / compensation' :
    /delay|late|overdue|still waiting/.test(text)                ? 'Delayed delivery' :
    /investigation|update on|progress|chasing/.test(text)        ? 'Courier update' :
    'General query';
  return intent;
}


import { getAuthedClient, getConfig, updateLastSync } from './gmailService.js';
import { query } from '../db/index.js';

function decodeBase64(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractHeader(headers, name) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain?.body?.data) return decodeBase64(plain.body.data);
    const html = payload.parts.find(p => p.mimeType === 'text/html');
    if (html?.body?.data) return decodeBase64(html.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }
  return '';
}

function parseFrom(fromHeader) {
  const match = fromHeader.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim().toLowerCase() };
  return { name: '', email: fromHeader.trim().toLowerCase() };
}

async function resolveCustomer(senderEmail) {
  let res = await query(`SELECT id, business_name FROM customers WHERE lower(primary_email) = $1 LIMIT 1`, [senderEmail.toLowerCase()]);
  if (res.rows[0]) return res.rows[0];
  res = await query(`SELECT id, business_name FROM customers WHERE lower(accounts_email) = $1 LIMIT 1`, [senderEmail.toLowerCase()]);
  if (res.rows[0]) return res.rows[0];
  const domain = senderEmail.split('@')[1];
  if (domain && !['gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.co.uk','icloud.com'].includes(domain)) {
    res = await query(`SELECT id, business_name FROM customers WHERE primary_email ILIKE $1 LIMIT 1`, [`%@${domain}`]);
    if (res.rows[0]) return res.rows[0];
  }
  return null;
}

async function upsertTicket(msg) {
  const { id: gmailMsgId, threadId: gmailThreadId, payload, internalDate } = msg;
  const headers    = payload?.headers || [];
  const subject    = extractHeader(headers, 'subject') || '(no subject)';
  const fromHeader = extractHeader(headers, 'from');
  const inReplyTo  = extractHeader(headers, 'in-reply-to');
  const body       = extractBody(payload) || '(no body)';
  const { name: senderName, email: senderEmail } = parseFrom(fromHeader);
  const receivedAt = internalDate ? new Date(parseInt(internalDate)) : new Date();

  if (!senderEmail) return { status: 'skipped', reason: 'no sender email' };

  // Skip if already imported
  const exists = await query(`SELECT id FROM query_emails WHERE gmail_message_id = $1 LIMIT 1`, [gmailMsgId]);
  if (exists.rows.length) return { status: 'skipped', reason: 'already imported' };

  const customer = await resolveCustomer(senderEmail);

  // Find existing open ticket for this Gmail thread
  let queryId = null;
  if (gmailThreadId) {
    const threadMatch = await query(
      `SELECT q.id FROM queries q
       JOIN query_emails qe ON qe.query_id = q.id
       WHERE qe.gmail_thread_id = $1
       AND q.status NOT IN ('resolved','resolved_claim_approved','resolved_claim_rejected')
       ORDER BY q.created_at DESC LIMIT 1`,
      [gmailThreadId]
    );
    if (threadMatch.rows[0]) queryId = threadMatch.rows[0].id;
  }

  if (!queryId) {
    const ticketRes = await query(`
      INSERT INTO queries (customer_id, customer_name, sender_email, sender_matched, subject, description, status, query_type, trigger, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'open', 'other', 'customer_email', $7, $7)
      RETURNING id
    `, [
      customer?.id || null,
      customer?.business_name || senderName || senderEmail,
      senderEmail,
      customer != null,
      subject,
      await generateSummary(subject, body),
      receivedAt,
    ]);
    queryId = ticketRes.rows[0].id;
  }

  await query(`
    INSERT INTO query_emails (query_id, direction, from_address, subject, body_text, received_at, gmail_message_id, gmail_thread_id, in_reply_to, is_ai_draft, sent_at)
    VALUES ($1, 'inbound_customer', $2, $3, $4, $5, $6, $7, $8, false, NULL)
  `, [queryId, senderEmail, subject, body.slice(0, 50000), receivedAt, gmailMsgId, gmailThreadId || null, inReplyTo || null]);

  await query(`UPDATE queries SET updated_at = NOW() WHERE id = $1`, [queryId]);
  return { status: 'imported', queryId };
}

// ─── Main sync — returns result summary ──────────────────────────────────────
export async function syncGmail() {
  const config = await getConfig();
  if (!config?.refresh_token) return { error: 'Gmail not connected' };

  const auth = await getAuthedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  let messageIds = [];
  let fetchMethod = 'incremental';

  if (config.last_history_id) {
    try {
      const histRes = await gmail.users.history.list({
        userId: 'me', startHistoryId: config.last_history_id,
        historyTypes: ['messageAdded'], labelId: 'INBOX',
      });
      const records = histRes.data.history || [];
      records.forEach(h => (h.messagesAdded || []).forEach(m => messageIds.push(m.message.id)));
    } catch (e) {
      config.last_history_id = null; // expired, fall through to full sync
    }
  }

  if (!config.last_history_id) {
    fetchMethod = 'full (last 7 days)';
    const since = Math.floor((Date.now() - 7 * 86400000) / 1000);
    const listRes = await gmail.users.messages.list({
      userId: 'me', labelIds: ['INBOX'], q: `after:${since}`, maxResults: 100,
    });
    messageIds = (listRes.data.messages || []).map(m => m.id);
  }

  const results = { fetched: messageIds.length, imported: 0, skipped: 0, errors: [], fetchMethod };

  for (const id of messageIds) {
    try {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
      const r = await upsertTicket(msgRes.data);
      if (r.status === 'imported') results.imported++;
      else results.skipped++;
    } catch (e) {
      console.error('[Gmail upsertTicket]', e.message);
      results.errors.push({ id, error: e.message });
    }
  }
  // If every message errored, surface the first error clearly
  if (results.errors.length > 0 && results.imported === 0) {
    results.first_error = results.errors[0]?.error;
  }

  const profileRes = await gmail.users.getProfile({ userId: 'me' });
  await updateLastSync(profileRes.data.historyId);

  // Backfill any tickets that are missing summaries
  await backfillSummaries();

  console.log(`[Gmail sync] ${fetchMethod} — fetched ${results.fetched}, imported ${results.imported}, skipped ${results.skipped}, errors ${results.errors.length}`);
  return results;
}

// ─── Backfill missing summaries on existing tickets ──────────────────────────
export async function backfillSummaries() {
  const res = await query(`
    SELECT q.id, q.subject, qe.body_text
    FROM queries q
    LEFT JOIN query_emails qe ON qe.query_id = q.id
      AND qe.direction = 'inbound_customer'
    WHERE q.description IS NULL
    ORDER BY q.created_at DESC
  `);

  const seen = new Set();
  for (const row of res.rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const summary = await generateSummary(row.subject, row.body_text);
    await query(`UPDATE queries SET description = $1 WHERE id = $2 AND description IS NULL`, [summary, row.id]);
  }
  if (seen.size) console.log(`[Gmail sync] Backfilled summaries for ${seen.size} tickets`);
}

export function startGmailSync(intervalMs = 3 * 60 * 1000) {
  syncGmail().catch(e => console.error('[Gmail sync] Startup error:', e.message));
  setInterval(() => syncGmail().catch(e => console.error('[Gmail sync] Interval error:', e.message)), intervalMs);
  console.log(`[Gmail sync] Polling every ${intervalMs / 60000} minutes`);
}
