/**
 * sendGateway.js — WISMO Automation Phase 1: the single, shared path for
 * actually sending a query_emails row via the Gmail API.
 *
 * Sends via Gmail (not SendGrid) so a reply lands in the SAME thread the
 * customer/courier already sees in their inbox, using the connected support
 * mailbox's OAuth token (gmailService.js). Every outcome — success or failure
 * — is written back onto the row so a failed send never silently looks sent
 * and never gets retried into a duplicate.
 */

import { google } from 'googleapis';
import { query } from '../db/index.js';
import { getAuthedClient } from './gmailService.js';

const SUPPORT_FROM = 'service@moovparcel.co.uk';

function stripHeaderInjection(s) {
  return String(s || '').replace(/[\r\n]+/g, ' ').trim();
}

// RFC 2047-encode a subject if it contains any non-ASCII characters.
function encodeSubject(s) {
  return /[^\x00-\x7F]/.test(s) ? `=?UTF-8?B?${Buffer.from(s, 'utf-8').toString('base64')}?=` : s;
}

// Send one query_emails row for real. Idempotent: a row already marked sent is
// returned as-is rather than sent twice. Throws on failure (after recording
// send_status='failed' + send_error) so the caller can keep the draft in QA Bay.
export async function sendQueryEmail(emailId, { sentBy = 'human' } = {}) {
  const row = (await query(`SELECT * FROM query_emails WHERE id = $1`, [emailId])).rows[0];
  if (!row) throw new Error('Email not found');
  if (row.sent_at || row.send_status === 'sent') return { alreadySent: true, row };

  const ticket = (await query(
    `SELECT sender_email, ticket_number, courier_code FROM queries WHERE id = $1`,
    [row.query_id],
  )).rows[0];

  const to = row.to_address || (row.direction === 'outbound_customer' ? ticket?.sender_email : null);
  if (!to) {
    const reason = row.direction === 'outbound_courier'
      ? `No courier address configured for '${ticket?.courier_code || 'unknown'}' — set it in Settings → Comms Templates.`
      : 'No recipient address resolvable for this draft.';
    await query(`UPDATE query_emails SET send_status = 'failed', send_error = $2 WHERE id = $1`, [emailId, reason]);
    throw new Error(reason);
  }

  // Threading — only when the parent inbound message captured an RFC Message-Id.
  // Rows sent before this shipped (or replying to a message with no captured
  // header) simply start a fresh Gmail thread — no retroactive backfill.
  let threadId, inReplyToHeader;
  if (row.reply_to_message_id) {
    const parent = (await query(
      `SELECT gmail_thread_id, rfc_message_id FROM query_emails WHERE id = $1`,
      [row.reply_to_message_id],
    )).rows[0];
    if (parent?.rfc_message_id) {
      threadId = parent.gmail_thread_id || undefined;
      inReplyToHeader = parent.rfc_message_id;
    }
  }

  const headers = [
    `From: ${SUPPORT_FROM}`,
    `To: ${stripHeaderInjection(to)}`,
    `Subject: ${encodeSubject(stripHeaderInjection(row.subject || '(no subject)'))}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
  ];
  if (inReplyToHeader) {
    headers.push(`In-Reply-To: ${stripHeaderInjection(inReplyToHeader)}`);
    headers.push(`References: ${stripHeaderInjection(inReplyToHeader)}`);
  }

  const raw = Buffer
    .from(headers.join('\r\n') + '\r\n\r\n' + (row.body_text || ''), 'utf-8')
    .toString('base64url');

  try {
    const auth  = await getAuthedClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const resp  = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, ...(threadId ? { threadId } : {}) },
    });
    await query(
      `UPDATE query_emails
          SET gmail_message_id = $2, gmail_thread_id = $3,
              send_status = 'sent', send_error = NULL, sent_by = $4
        WHERE id = $1`,
      [emailId, resp.data.id, resp.data.threadId, sentBy],
    );
    return { sent: true, gmail_message_id: resp.data.id };
  } catch (e) {
    await query(`UPDATE query_emails SET send_status = 'failed', send_error = $2 WHERE id = $1`, [emailId, e.message]);
    throw e;
  }
}
