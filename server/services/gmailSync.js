/**
 * gmailSync.js — Polls Gmail inbox and imports emails as tickets.
 * Read-only. Never sends or modifies Gmail messages.
 */

import { google } from 'googleapis';
import { getAuthedClient, getConfig, updateLastSync } from './gmailService.js';
import { query } from '../db/index.js';

// ─── Parse a raw Gmail message into usable fields ─────────────────────────────
function decodeBase64(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractHeader(headers, name) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function extractBody(payload) {
  if (!payload) return '';

  // Direct body
  if (payload.body?.data) return decodeBase64(payload.body.data);

  // Multipart — prefer text/plain, fall back to text/html
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain?.body?.data) return decodeBase64(plain.body.data);
    const html = payload.parts.find(p => p.mimeType === 'text/html');
    if (html?.body?.data) {
      return decodeBase64(html.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    // Recurse into nested multipart
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

// ─── Find or create a customer match from sender email ────────────────────────
async function resolveCustomer(senderEmail, senderName) {
  // 1. Direct match on primary_email
  let res = await query(
    `SELECT id, company_name FROM customers WHERE lower(primary_email) = $1 LIMIT 1`,
    [senderEmail.toLowerCase()]
  );
  if (res.rows[0]) return res.rows[0];

  // 2. Match on accounts_email
  res = await query(
    `SELECT id, company_name FROM customers WHERE lower(accounts_email) = $1 LIMIT 1`,
    [senderEmail.toLowerCase()]
  );
  if (res.rows[0]) return res.rows[0];

  // 3. Domain match — find a customer whose primary_email shares the domain
  const domain = senderEmail.split('@')[1];
  if (domain && !['gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.co.uk','icloud.com'].includes(domain)) {
    res = await query(
      `SELECT id, company_name FROM customers WHERE primary_email ILIKE $1 LIMIT 1`,
      [`%@${domain}`]
    );
    if (res.rows[0]) return res.rows[0];
  }

  return null;
}

// ─── Create or append to a ticket ─────────────────────────────────────────────
async function upsertTicket(msg, auth) {
  const { id: gmailMsgId, threadId: gmailThreadId, payload, internalDate } = msg;
  const headers    = payload?.headers || [];
  const subject    = extractHeader(headers, 'subject') || '(no subject)';
  const fromHeader = extractHeader(headers, 'from');
  const messageId  = extractHeader(headers, 'message-id');
  const inReplyTo  = extractHeader(headers, 'in-reply-to');
  const body       = extractBody(payload);
  const { name: senderName, email: senderEmail } = parseFrom(fromHeader);
  const receivedAt = internalDate ? new Date(parseInt(internalDate)) : new Date();

  // Skip if already imported
  const exists = await query(
    `SELECT id FROM query_emails WHERE gmail_message_id = $1 LIMIT 1`,
    [gmailMsgId]
  );
  if (exists.rows.length) return;

  const customer = await resolveCustomer(senderEmail, senderName);

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

  // Create new ticket if no existing thread match
  if (!queryId) {
    const ticketRes = await query(`
      INSERT INTO queries (
        customer_id, customer_name, sender_email, sender_matched,
        subject, status, query_type, trigger
      ) VALUES ($1, $2, $3, $4, $5, 'open', 'other', 'customer_email')
      RETURNING id
    `, [
      customer?.id || null,
      customer?.company_name || senderName || senderEmail,
      senderEmail,
      customer != null,
      subject,
    ]);
    queryId = ticketRes.rows[0].id;
  }

  // Insert email — columns match query_emails schema exactly
  await query(`
    INSERT INTO query_emails (
      query_id, direction, from_address,
      subject, body_text, received_at,
      gmail_message_id, gmail_thread_id, in_reply_to,
      is_ai_draft, sent_at
    ) VALUES ($1,'inbound_customer',$2,$3,$4,$5,$6,$7,$8,false,NULL)
  `, [
    queryId, senderEmail,
    subject, body.slice(0, 50000), receivedAt,
    gmailMsgId, gmailThreadId, inReplyTo || null,
  ]);

  // Update query latest activity
  await query(
    `UPDATE queries SET updated_at = NOW() WHERE id = $1`,
    [queryId]
  );
}

// ─── Main sync function ───────────────────────────────────────────────────────
export async function syncGmail() {
  const config = await getConfig();
  if (!config?.refresh_token) return; // not connected

  let auth;
  try { auth = await getAuthedClient(); }
  catch (e) { console.error('[Gmail sync] Auth error:', e.message); return; }

  const gmail = google.gmail({ version: 'v1', auth });

  try {
    let messageIds = [];

    if (config.last_history_id) {
      // Incremental sync via historyId
      try {
        const histRes = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: config.last_history_id,
          historyTypes: ['messageAdded'],
          labelId: 'INBOX',
        });
        const records = histRes.data.history || [];
        records.forEach(h => {
          (h.messagesAdded || []).forEach(m => messageIds.push(m.message.id));
        });
      } catch (e) {
        // historyId expired — fall back to full sync
        console.log('[Gmail sync] historyId expired, falling back to full sync');
        config.last_history_id = null;
      }
    }

    if (!config.last_history_id) {
      // First sync — get last 7 days from INBOX
      const since = Math.floor((Date.now() - 7 * 86400000) / 1000);
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        q: `after:${since}`,
        maxResults: 100,
      });
      messageIds = (listRes.data.messages || []).map(m => m.id);
    }

    // Fetch and upsert each message
    for (const id of messageIds) {
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'full',
        });
        await upsertTicket(msgRes.data, auth);
      } catch (e) {
        console.error(`[Gmail sync] Error processing message ${id}:`, e.message);
      }
    }

    // Save new historyId
    const profileRes = await gmail.users.getProfile({ userId: 'me' });
    await updateLastSync(profileRes.data.historyId);

    if (messageIds.length) {
      console.log(`[Gmail sync] Imported/checked ${messageIds.length} messages`);
    }
  } catch (e) {
    console.error('[Gmail sync] Sync error:', e.message);
  }
}

export function startGmailSync(intervalMs = 3 * 60 * 1000) {
  syncGmail(); // run immediately on start
  setInterval(syncGmail, intervalMs);
  console.log(`[Gmail sync] Polling every ${intervalMs / 60000} minutes`);
}
