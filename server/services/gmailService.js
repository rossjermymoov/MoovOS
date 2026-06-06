/**
 * gmailService.js — Read-only Gmail OAuth2 wrapper
 * Scopes: gmail.readonly only. Never requests send permission.
 */

import { google } from 'googleapis';
import { query } from '../db/index.js';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getAuthedClient() {
  const row = await getConfig();
  if (!row?.refresh_token) throw new Error('Gmail not connected');

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token:  row.access_token,
    refresh_token: row.refresh_token,
    expiry_date:   row.token_expiry ? new Date(row.token_expiry).getTime() : undefined,
  });

  // Auto-refresh and persist new tokens
  oauth2Client.on('tokens', async (tokens) => {
    const updates = [];
    const vals = [];
    let idx = 1;
    if (tokens.access_token)  { updates.push(`access_token = $${idx++}`);  vals.push(tokens.access_token); }
    if (tokens.expiry_date)   { updates.push(`token_expiry = $${idx++}`);  vals.push(new Date(tokens.expiry_date)); }
    if (updates.length) {
      vals.push(1);
      await query(`UPDATE gmail_oauth_config SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, vals);
    }
  });

  return oauth2Client;
}

export async function getConfig() {
  const res = await query('SELECT * FROM gmail_oauth_config WHERE id = 1');
  return res.rows[0] || null;
}

export async function saveTokens(tokens, emailAddress) {
  await query(`
    UPDATE gmail_oauth_config SET
      access_token   = $1,
      refresh_token  = $2,
      token_expiry   = $3,
      email_address  = $4,
      connected_at   = NOW(),
      updated_at     = NOW()
    WHERE id = 1
  `, [
    tokens.access_token,
    tokens.refresh_token,
    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    emailAddress,
  ]);
}

export async function disconnect() {
  await query(`
    UPDATE gmail_oauth_config SET
      access_token = NULL, refresh_token = NULL, token_expiry = NULL,
      email_address = NULL, connected_at = NULL, last_history_id = NULL,
      updated_at = NOW()
    WHERE id = 1
  `);
}

export async function updateLastSync(historyId) {
  await query(`
    UPDATE gmail_oauth_config SET last_sync_at = NOW(), last_history_id = $1, updated_at = NOW() WHERE id = 1
  `, [historyId ? String(historyId) : null]);
}
