import express from 'express';
import { getAuthUrl, exchangeCodeForTokens, saveTokens, getConfig, disconnect, createOAuthClient } from '../services/gmailService.js';
import { syncGmail } from '../services/gmailSync.js';
import { google } from 'googleapis';

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    const config = await getConfig();
    const connected = !!(config?.refresh_token);
    res.json({ connected, email_address: connected ? config.email_address : null, last_sync_at: connected ? config.last_sync_at : null });
  } catch (err) { next(err); }
});

router.get('/auth', (req, res) => {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET not set' });
  }
  res.redirect(getAuthUrl());
});

router.get('/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;
    if (error) return res.redirect('/settings/gmail?error=' + encodeURIComponent(error));
    if (!code)  return res.redirect('/settings/gmail?error=no_code');
    const tokens = await exchangeCodeForTokens(code);
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    await saveTokens(tokens, profile.data.emailAddress);
    res.redirect('/settings/gmail?connected=1');
  } catch (err) { next(err); }
});

// Returns actual sync results including counts and any errors
router.post('/sync', async (req, res, next) => {
  try {
    const result = await syncGmail();
    res.json(result);
  } catch (err) {
    console.error('[Gmail sync route]', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint — lists raw Gmail messages without importing
router.get('/debug', async (req, res, next) => {
  try {
    const config = await getConfig();
    if (!config?.refresh_token) return res.json({ connected: false });
    const { getAuthedClient } = await import('../services/gmailService.js');
    const auth  = await getAuthedClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const since = Math.floor((Date.now() - 7 * 86400000) / 1000);
    const listRes = await gmail.users.messages.list({ userId: 'me', labelIds: ['INBOX'], q: `after:${since}`, maxResults: 10 });
    const messages = listRes.data.messages || [];
    const previews = await Promise.all(messages.slice(0, 5).map(async m => {
      const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
      const h = msg.data.payload?.headers || [];
      return {
        id: m.id, threadId: m.threadId,
        subject: h.find(x => x.name === 'Subject')?.value,
        from:    h.find(x => x.name === 'From')?.value,
        date:    h.find(x => x.name === 'Date')?.value,
      };
    }));
    res.json({ total_in_inbox_last_7d: messages.length, sample: previews, last_history_id: config.last_history_id, last_sync_at: config.last_sync_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/disconnect', async (req, res, next) => {
  try { await disconnect(); res.json({ ok: true }); }
  catch (err) { next(err); }
});

export default router;
