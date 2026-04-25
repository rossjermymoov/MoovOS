/**
 * Xero OAuth 2.0 integration
 *
 * Endpoints:
 *   GET  /api/xero/status                      — connection status
 *   GET  /api/xero/connect                     — redirect to Xero auth
 *   GET  /api/xero/callback                    — OAuth callback
 *   DELETE /api/xero/disconnect                — remove stored tokens
 *   GET  /api/xero/contacts/search?q=          — search Xero contacts
 *   PUT  /api/xero/customers/:id/link          — link customer to Xero contact
 *   DELETE /api/xero/customers/:id/link        — unlink customer
 *   POST /api/xero/customers/auto-match        — auto-match all unlinked customers
 *   GET  /api/xero/customers/match-status      — list all customers with link status
 *   POST /api/xero/invoices/:id/push           — push invoice to Xero
 *   POST /api/xero/invoices/sync-payments      — sync payment status from Xero
 *
 * Required env vars:
 *   XERO_CLIENT_ID
 *   XERO_CLIENT_SECRET
 *   XERO_REDIRECT_URI   (e.g. https://your-backend.up.railway.app/api/xero/callback)
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

const XERO_AUTH_URL   = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL  = 'https://identity.xero.com/connect/token';
const XERO_CONN_URL   = 'https://api.xero.com/connections';
const XERO_API_BASE   = 'https://api.xero.com/api.xro/2.0';

const SCOPES = [
  'openid',
  'offline_access',
  'accounting.contacts',
  'accounting.transactions',
].join(' ');

// ─── Token helpers ────────────────────────────────────────────────────────────

async function getStoredToken() {
  const result = await query('SELECT * FROM xero_tokens ORDER BY id DESC LIMIT 1');
  return result.rows[0] || null;
}

async function refreshXeroToken(token) {
  const credentials = Buffer.from(
    `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
  ).toString('base64');

  const resp = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: token.refresh_token,
    }).toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Xero token refresh failed: ${err}`);
  }

  const data = await resp.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await query(
    `UPDATE xero_tokens
     SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
     WHERE id = $4`,
    [data.access_token, data.refresh_token, expiresAt, token.id]
  );

  return { ...token, access_token: data.access_token, expires_at: expiresAt };
}

async function getValidToken() {
  const token = await getStoredToken();
  if (!token) throw new Error('Not connected to Xero');

  const now = new Date();
  const expiresAt = new Date(token.expires_at);

  // Refresh if expiring within 5 minutes
  if (expiresAt - now < 5 * 60 * 1000) {
    return await refreshXeroToken(token);
  }

  return token;
}

// Generic authenticated Xero API call
async function xeroRequest(method, path, body = null) {
  const token = await getValidToken();

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Xero-tenant-id': token.tenant_id,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(`${XERO_API_BASE}${path}`, opts);

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Xero API error ${resp.status}: ${err}`);
  }

  return resp.json();
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

// GET /api/xero/status
router.get('/status', async (req, res, next) => {
  try {
    const token = await getStoredToken();
    if (!token) return res.json({ connected: false });

    const expired = new Date(token.expires_at) < new Date();
    res.json({
      connected:   true,
      tenant_name: token.tenant_name,
      tenant_id:   token.tenant_id,
      expires_at:  token.expires_at,
      needs_refresh: expired,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/xero/connect
router.get('/connect', (req, res) => {
  const state = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.XERO_CLIENT_ID,
    redirect_uri:  process.env.XERO_REDIRECT_URI,
    scope:         SCOPES,
    state,
  });
  res.redirect(`${XERO_AUTH_URL}?${params.toString()}`);
});

// GET /api/xero/callback
router.get('/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) return res.redirect(`/settings/xero?error=${encodeURIComponent(error)}`);
    if (!code) return res.redirect('/settings/xero?error=no_code');

    const credentials = Buffer.from(
      `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
    ).toString('base64');

    // Exchange code for tokens
    const tokenResp = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      console.error('[xero] token exchange failed:', err);
      return res.redirect('/settings/xero?error=token_exchange_failed');
    }

    const tokenData = await tokenResp.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Get connected tenant
    const connResp = await fetch(XERO_CONN_URL, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Accept': 'application/json' },
    });
    const connections = await connResp.json();
    const tenant = connections[0] || {};

    // Upsert token (delete old, insert new)
    await query('DELETE FROM xero_tokens');
    await query(
      `INSERT INTO xero_tokens (access_token, refresh_token, tenant_id, tenant_name, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tokenData.access_token, tokenData.refresh_token, tenant.tenantId, tenant.tenantName, expiresAt]
    );

    res.redirect('/settings/xero?connected=1');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/xero/disconnect
router.delete('/disconnect', async (req, res, next) => {
  try {
    await query('DELETE FROM xero_tokens');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Contacts ─────────────────────────────────────────────────────────────────

// GET /api/xero/contacts/search?q=
router.get('/contacts/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ contacts: [] });

    const data = await xeroRequest('GET', `/Contacts?searchTerm=${encodeURIComponent(q)}&includeArchived=false`);
    const contacts = (data.Contacts || []).map(c => ({
      id:    c.ContactID,
      name:  c.Name,
      email: c.EmailAddress || null,
      status: c.ContactStatus,
    }));
    res.json({ contacts });
  } catch (err) {
    next(err);
  }
});

// ─── Customer linking ─────────────────────────────────────────────────────────

// GET /api/xero/customers/match-status
router.get('/customers/match-status', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, company_name, xero_contact_id
       FROM customers
       ORDER BY company_name ASC`
    );
    res.json({ customers: result.rows });
  } catch (err) {
    next(err);
  }
});

// PUT /api/xero/customers/:id/link
router.put('/customers/:id/link', async (req, res, next) => {
  try {
    const { xero_contact_id, xero_contact_name } = req.body;
    if (!xero_contact_id) return res.status(400).json({ error: 'xero_contact_id required' });

    await query(
      `UPDATE customers SET xero_contact_id = $1 WHERE id = $2`,
      [xero_contact_id, req.params.id]
    );
    res.json({ ok: true, xero_contact_id, xero_contact_name });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/xero/customers/:id/link
router.delete('/customers/:id/link', async (req, res, next) => {
  try {
    await query(`UPDATE customers SET xero_contact_id = NULL WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/xero/customers/auto-match
// Fetches all Xero contacts and fuzzy-matches against unlinked MoovOS customers by name
router.post('/customers/auto-match', async (req, res, next) => {
  try {
    // Get all Xero contacts (up to 1000 — enough for most orgs)
    const data = await xeroRequest('GET', '/Contacts?includeArchived=false&pageSize=1000');
    const xeroContacts = data.Contacts || [];

    // Get all unlinked MoovOS customers
    const { rows: customers } = await query(
      `SELECT id, company_name FROM customers WHERE xero_contact_id IS NULL ORDER BY company_name`
    );

    const suggestions = [];
    const matched = [];

    for (const cust of customers) {
      const name = (cust.company_name || '').toLowerCase().trim();

      // Score each Xero contact
      let best = null;
      let bestScore = 0;

      for (const xc of xeroContacts) {
        const xcName = (xc.Name || '').toLowerCase().trim();
        const score  = nameMatchScore(name, xcName);
        if (score > bestScore) {
          bestScore = score;
          best = xc;
        }
      }

      if (best && bestScore >= 0.8) {
        // High confidence — auto-apply
        await query(
          `UPDATE customers SET xero_contact_id = $1 WHERE id = $2`,
          [best.ContactID, cust.id]
        );
        matched.push({ customer_id: cust.id, customer_name: cust.company_name, xero_name: best.Name, score: bestScore });
      } else if (best && bestScore >= 0.5) {
        // Medium confidence — suggest but don't auto-apply
        suggestions.push({
          customer_id:   cust.id,
          customer_name: cust.company_name,
          xero_id:       best.ContactID,
          xero_name:     best.Name,
          score:         bestScore,
        });
      }
    }

    res.json({ matched, suggestions });
  } catch (err) {
    next(err);
  }
});

// Simple name match scorer: returns 0–1
function nameMatchScore(a, b) {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) {
    const longer  = Math.max(a.length, b.length);
    const shorter = Math.min(a.length, b.length);
    return shorter / longer;
  }
  // Word overlap
  const wordsA = new Set(a.split(/\W+/).filter(w => w.length > 2));
  const wordsB = new Set(b.split(/\W+/).filter(w => w.length > 2));
  const common = [...wordsA].filter(w => wordsB.has(w)).length;
  const total  = new Set([...wordsA, ...wordsB]).size;
  return total > 0 ? common / total : 0;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

// POST /api/xero/invoices/:id/push
router.post('/invoices/:id/push', async (req, res, next) => {
  try {
    const invId = parseInt(req.params.id);

    // Load invoice + customer + line items
    const { rows: invRows } = await query(
      `SELECT i.*, c.company_name, c.xero_contact_id
       FROM invoices i
       JOIN customers c ON c.id = i.customer_id
       WHERE i.id = $1`,
      [invId]
    );
    if (!invRows.length) return res.status(404).json({ error: 'Invoice not found' });
    const inv = invRows[0];

    if (!inv.xero_contact_id) {
      return res.status(400).json({ error: 'Customer not linked to a Xero contact' });
    }

    const { rows: lines } = await query(
      `SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id`,
      [invId]
    );

    // Map line items to Xero format
    const lineItems = lines.map(l => ({
      Description: l.description,
      Quantity:    l.quantity,
      UnitAmount:  parseFloat(l.unit_price),
      AccountCode: process.env.XERO_ACCOUNT_CODE || '200',  // Sales account
      TaxType:     inv.vat_enabled ? 'OUTPUT2' : 'NONE',
    }));

    // If no line items, create a single summary line
    if (!lineItems.length) {
      lineItems.push({
        Description: `Parcel delivery services — ${inv.billing_period_start} to ${inv.billing_period_end}`,
        Quantity:    1,
        UnitAmount:  parseFloat(inv.total),
        AccountCode: process.env.XERO_ACCOUNT_CODE || '200',
        TaxType:     'NONE',
      });
    }

    const xeroInvoice = {
      Type:          'ACCREC',
      Contact:       { ContactID: inv.xero_contact_id },
      Date:          inv.generated_at ? inv.generated_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      DueDate:       dueDateFromGenerated(inv.generated_at),
      InvoiceNumber: inv.invoice_number,
      LineItems:     lineItems,
      Status:        'AUTHORISED',
      Reference:     `MoovOS ${inv.invoice_number}`,
    };

    let data;
    if (inv.xero_invoice_id) {
      // Update existing
      data = await xeroRequest('POST', `/Invoices/${inv.xero_invoice_id}`, { Invoices: [xeroInvoice] });
    } else {
      // Create new
      data = await xeroRequest('POST', '/Invoices', { Invoices: [xeroInvoice] });
    }

    const xeroId = data.Invoices?.[0]?.InvoiceID;
    if (xeroId) {
      await query(`UPDATE invoices SET xero_invoice_id = $1 WHERE id = $2`, [xeroId, invId]);
    }

    res.json({ ok: true, xero_invoice_id: xeroId });
  } catch (err) {
    next(err);
  }
});

// POST /api/xero/invoices/sync-payments
// Checks all invoices with a xero_invoice_id and updates status to 'paid' if Xero says PAID
router.post('/invoices/sync-payments', async (req, res, next) => {
  try {
    const { rows: invoices } = await query(
      `SELECT id, xero_invoice_id, status FROM invoices WHERE xero_invoice_id IS NOT NULL AND status != 'paid'`
    );

    if (!invoices.length) return res.json({ updated: 0, checked: 0 });

    // Fetch statuses from Xero in one request using IDs filter
    const ids = invoices.map(i => i.xero_invoice_id).join(',');
    const data = await xeroRequest('GET', `/Invoices?IDs=${encodeURIComponent(ids)}`);
    const xeroInvoices = data.Invoices || [];

    let updated = 0;
    for (const xi of xeroInvoices) {
      if (xi.Status === 'PAID') {
        const local = invoices.find(i => i.xero_invoice_id === xi.InvoiceID);
        if (local) {
          await query(`UPDATE invoices SET status = 'paid' WHERE id = $1`, [local.id]);
          updated++;
        }
      }
    }

    res.json({ updated, checked: xeroInvoices.length });
  } catch (err) {
    next(err);
  }
});

function dueDateFromGenerated(generatedAt) {
  const d = generatedAt ? new Date(generatedAt) : new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export default router;
