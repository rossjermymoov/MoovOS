/**
 * Gmail OAuth routes — read-only inbox sync
 *
 * GET  /api/gmail/status      — connection status
 * GET  /api/gmail/auth        — start OAuth flow (redirect to Google)
 * GET  /api/gmail/callback    — OAuth callback (Google redirects here)
 * POST /api/gmail/sync        — trigger manual sync
 * DELETE /api/gmail/disconnect — remove tokens
 */

import express from 'express';
import { getAuthUrl, exchangeCodeForTokens, saveTokens, getConfig, disconnect } from '../services/gmailService.js';
import { syncGmail } from '../services/gmailSync.js';
import { google } from 'googleapis';
import { createOAuthClient } from '../services/gmailService.js';

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    const config = await getConfig();
    const connected = !!(config?.refresh_token);
    res.json({
      connected,
      email_address: connected ? config.email_address : null,
      last_sync_at:  connected ? config.last_sync_at  : null,
      enabled:       config?.enabled ?? false,
    });
  } catch (err) { next(err); }
});

router.get('/auth', (req, res) => {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables are not set.' });
  }
  const url = getAuthUrl();
  res.redirect(url);
});

router.get('/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;
    if (error) return res.redirect('/settings/gmail?error=' + encodeURIComponent(error));
    if (!code)  return res.redirect('/settings/gmail?error=no_code');

    const tokens = await exchangeCodeForTokens(code);

    // Get the Gmail address for this token
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailAddress = profile.data.emailAddress;

    await saveTokens(tokens, emailAddress);
    res.redirect('/settings/gmail?connected=1');
  } catch (err) { next(err); }
});

router.post('/sync', async (req, res, next) => {
  try {
    await syncGmail();
    res.json({ ok: true });
  } catch (err) {
    console.error('[Gmail sync route] Error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/disconnect', async (req, res, next) => {
  try {
    await disconnect();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
