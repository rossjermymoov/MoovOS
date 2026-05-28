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

// Granular scopes required for apps created on/after March 2, 2026
const SCOPES = [
  'openid', 'profile', 'email',     // required for user identity
  'offline_access',                  // required for refresh tokens
  'accounting.contacts.read',        // search + read Xero contacts
  'accounting.invoices.read',        // read invoice payment status
  'accounting.invoices',             // create + update invoices
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

// GET /api/xero/debug — shows config without redirecting (remove once working)
router.get('/debug', (req, res) => {
  const clientId      = process.env.XERO_CLIENT_ID;
  const clientSecret  = process.env.XERO_CLIENT_SECRET;
  const redirectUri   = process.env.XERO_REDIRECT_URI;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId || 'NOT_SET',
    redirect_uri:  redirectUri || 'NOT_SET',
    scope:         SCOPES,
    state:         'debug',
  });

  res.json({
    client_id_set:     !!clientId,
    client_id_prefix:  clientId ? clientId.slice(0, 8) + '…' : null,
    client_secret_set: !!clientSecret,
    redirect_uri:      redirectUri || 'NOT_SET',
    scopes:            SCOPES,
    auth_url:          `${XERO_AUTH_URL}?${params.toString()}`,
  });
});

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
// Returns all customers with link status + pre-computed Xero suggestions for unlinked ones.
// Also backfills xero_contact_name for linked customers that only have a UUID stored.
router.get('/customers/match-status', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, business_name, xero_contact_id, xero_contact_name
       FROM customers
       ORDER BY business_name ASC`
    );
    const customers = result.rows;

    const suggestions = {}; // customer_id → { xero_id, xero_name, score }
    const unlinked  = customers.filter(c => !c.xero_contact_id);
    // Linked customers that are missing a human-readable name (UUID-only)
    const needsName = customers.filter(c => c.xero_contact_id && !c.xero_contact_name);

    if (unlinked.length > 0 || needsName.length > 0) {
      try {
        const data = await xeroRequest('GET', '/Contacts?includeArchived=false&pageSize=1000');
        const xeroContacts = data.Contacts || [];

        // Build a quick lookup: ContactID → Name
        const contactById = {};
        for (const xc of xeroContacts) {
          contactById[xc.ContactID] = xc.Name;
        }

        // ── Backfill names for already-linked customers with no stored name ──
        for (const cust of needsName) {
          const name = contactById[cust.xero_contact_id];
          if (name) {
            await query(
              `UPDATE customers SET xero_contact_name = $1 WHERE id = $2`,
              [name, cust.id]
            );
            // Update in-memory so the response is accurate immediately
            cust.xero_contact_name = name;
          }
        }

        // ── Suggestions for unlinked customers ───────────────────────────────
        for (const cust of unlinked) {
          const name = (cust.business_name || '').toLowerCase().trim();
          let best = null, bestScore = 0;
          for (const xc of xeroContacts) {
            const score = nameMatchScore(name, (xc.Name || '').toLowerCase().trim());
            if (score > bestScore) { bestScore = score; best = xc; }
          }
          if (best && bestScore >= 0.4) {
            suggestions[cust.id] = { xero_id: best.ContactID, xero_name: best.Name, score: Math.round(bestScore * 100) };
          }
        }
      } catch (e) {
        // Xero may be disconnected — suggestions simply won't be included
        console.warn('[match-status] Could not fetch Xero contacts:', e.message);
      }
    }

    res.json({ customers, suggestions });
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
      `UPDATE customers SET xero_contact_id = $1, xero_contact_name = $2 WHERE id = $3`,
      [xero_contact_id, xero_contact_name || null, req.params.id]
    );
    res.json({ ok: true, xero_contact_id, xero_contact_name });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/xero/customers/:id/link
router.delete('/customers/:id/link', async (req, res, next) => {
  try {
    await query(`UPDATE customers SET xero_contact_id = NULL, xero_contact_name = NULL WHERE id = $1`, [req.params.id]);
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
      `SELECT id, business_name FROM customers WHERE xero_contact_id IS NULL ORDER BY business_name`
    );

    const suggestions = [];
    const matched = [];

    for (const cust of customers) {
      const name = (cust.business_name || '').toLowerCase().trim();

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
          `UPDATE customers SET xero_contact_id = $1, xero_contact_name = $2 WHERE id = $3`,
          [best.ContactID, best.Name, cust.id]
        );
        matched.push({ customer_id: cust.id, customer_name: cust.business_name, xero_name: best.Name, score: bestScore });
      } else if (best && bestScore >= 0.5) {
        // Medium confidence — suggest but don't auto-apply
        suggestions.push({
          customer_id:   cust.id,
          customer_name: cust.business_name,
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

// Strip common company suffixes so "Acme Ltd" and "Acme Limited" core-match
const COMPANY_SUFFIXES = /\b(limited|ltd|plc|llp|llc|inc|incorporated|co|company|group|holdings|services|solutions|enterprises|trading|international)\b\.?/gi;

function normaliseName(s) {
  return s
    .replace(COMPANY_SUFFIXES, '')   // drop suffixes
    .replace(/[^a-z0-9\s]/g, '')     // drop punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Name match scorer: returns 0–1
// Handles company suffix variants (Ltd/Limited/PLC etc) before scoring.
function nameMatchScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const na = normaliseName(a);
  const nb = normaliseName(b);

  // Exact match after stripping suffixes → very high confidence
  if (na.length > 0 && na === nb) return 0.97;

  // One normalised form contains the other (e.g. "Acme" vs "Acme Logistics")
  if (na.length > 0 && nb.length > 0 && (na.includes(nb) || nb.includes(na))) {
    const longer  = Math.max(na.length, nb.length);
    const shorter = Math.min(na.length, nb.length);
    // Floor at 0.78 — containment is a strong signal even when lengths differ
    return Math.max(0.78, shorter / longer);
  }

  // Fallback: word overlap on normalised names
  // Use length > 1 so short words (e.g. single letters) are included
  const wordsA = new Set(na.split(/\s+/).filter(w => w.length > 1));
  const wordsB = new Set(nb.split(/\s+/).filter(w => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const common = [...wordsA].filter(w => wordsB.has(w)).length;
  const total  = new Set([...wordsA, ...wordsB]).size;
  return total > 0 ? common / total : 0;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

// POST /api/xero/invoices/:id/push
// ─── Credit status ────────────────────────────────────────────────────────────

// Xero returns dates as /Date(ms+offset)/ — parse to YYYY-MM-DD
function parseXeroDate(d) {
  if (!d) return null;
  const m = String(d).match(/\/Date\((\d+)([+-]\d+)?\)\//);
  if (m) return new Date(parseInt(m[1])).toISOString().split('T')[0];
  return String(d).slice(0, 10); // already ISO-ish
}

// GET /api/xero/customers/:id/credit-status
// Returns live credit exposure: Xero outstanding invoices + MoovOS unbilled charges vs credit limit
router.get('/customers/:id/credit-status', async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // Customer record
    const { rows } = await query(
      `SELECT id, business_name, credit_limit, xero_contact_id, is_on_stop, account_status
       FROM customers WHERE id = $1`,
      [customerId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
    const customer = rows[0];

    const creditLimit = parseFloat(customer.credit_limit) || 0;

    // MoovOS unbilled charges (not yet on any invoice, not cancelled)
    const { rows: unbilledRows } = await query(
      `SELECT COALESCE(SUM(price), 0)::numeric(12,2) AS total,
              COUNT(*)::int AS count
       FROM charges
       WHERE customer_id = $1
         AND verified = TRUE
         AND billed = FALSE
         AND cancelled = FALSE
         AND price IS NOT NULL`,
      [customerId]
    );
    const moovosUnbilled     = parseFloat(unbilledRows[0]?.total || 0);
    const moovosUnbilledCount = unbilledRows[0]?.count || 0;

    // Xero outstanding invoices (AUTHORISED = approved but unpaid)
    let xeroOutstanding = 0;
    let xeroInvoices    = [];
    let xeroConnected   = false;

    if (customer.xero_contact_id) {
      try {
        const token = await getStoredToken();
        if (token) {
          xeroConnected = true;
          const data = await xeroRequest(
            'GET',
            `/Invoices?ContactIDs=${customer.xero_contact_id}&Statuses=AUTHORISED&order=DueDate+ASC`
          );
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          xeroInvoices = (data.Invoices || []).map(inv => {
            const dueDateStr = parseXeroDate(inv.DueDate);
            const isOverdue  = dueDateStr ? new Date(dueDateStr) < today : false;
            return {
              id:          inv.InvoiceID,
              number:      inv.InvoiceNumber,
              date:        parseXeroDate(inv.Date),
              due_date:    dueDateStr,
              amount_due:  parseFloat(inv.AmountDue || 0),
              total:       parseFloat(inv.Total || 0),
              is_overdue:  isOverdue,
            };
          });

          xeroOutstanding = xeroInvoices.reduce((s, inv) => s + inv.amount_due, 0);
        }
      } catch (e) {
        console.warn('[xero] credit-status: Xero unavailable —', e.message);
      }
    }

    // Reconciled but not yet pushed to Xero
    // These are finalized lines that have been invoiced internally but haven't
    // been pushed to Xero yet — they represent committed revenue not yet in Xero.
    const { rows: reconRows } = await query(
      `SELECT COALESCE(SUM(sell_total_amount), 0)::numeric(12,2) AS total,
              COUNT(*)::int AS count
       FROM finalized_billing_lines
       WHERE customer_id      = $1
         AND xero_pushed_at   IS NULL`,
      [customerId]
    );
    const reconNotInvoiced      = parseFloat(reconRows[0]?.total || 0);
    const reconNotInvoicedCount = reconRows[0]?.count || 0;

    const totalExposure   = xeroOutstanding + moovosUnbilled + reconNotInvoiced;
    const utilisationPct  = creditLimit > 0 ? (totalExposure / creditLimit) * 100 : 0;
    const creditStatus    = utilisationPct >= 100 ? 'over_limit'
                          : utilisationPct >= 90  ? 'warning'
                          : 'ok';

    res.json({
      credit_limit:                    creditLimit,
      xero_outstanding:                Math.round(xeroOutstanding  * 100) / 100,
      moovos_unbilled:                 Math.round(moovosUnbilled   * 100) / 100,
      moovos_unbilled_count:           moovosUnbilledCount,
      reconciled_not_yet_invoiced:     Math.round(reconNotInvoiced * 100) / 100,
      reconciled_not_yet_invoiced_count: reconNotInvoicedCount,
      total_exposure:                  Math.round(totalExposure    * 100) / 100,
      utilisation_pct:                 Math.round(utilisationPct   * 10)  / 10,
      credit_status:                   creditStatus,
      xero_connected:                  xeroConnected,
      xero_linked:                     !!customer.xero_contact_id,
      is_on_stop:                      customer.is_on_stop,
      invoices:                        xeroInvoices,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

router.post('/invoices/:id/push', async (req, res, next) => {
  try {
    const invId = parseInt(req.params.id);

    // Load invoice + customer + line items
    const { rows: invRows } = await query(
      `SELECT i.*, c.business_name, c.xero_contact_id
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
      `SELECT ili.*, s.ship_to_country_iso
       FROM invoice_line_items ili
       LEFT JOIN charges ch ON ch.id = ili.charge_id
       LEFT JOIN shipments s ON s.id = ch.shipment_id
       WHERE ili.invoice_id = $1 ORDER BY ili.id`,
      [invId]
    );

    // Load nominal codes from billing settings
    const xeroSettingsRes = await query(`SELECT xero_domestic_account_code, xero_international_account_code FROM billing_settings WHERE id = 1`);
    const xeroSettings = xeroSettingsRes.rows[0] || {};
    const fallbackCode      = process.env.XERO_ACCOUNT_CODE || '200';
    const domesticCode      = xeroSettings.xero_domestic_account_code     || fallbackCode;
    const internationalCode = xeroSettings.xero_international_account_code || fallbackCode;

    // Map line items — domestic (GB→GB) gets OUTPUT2 + domestic code, international gets NONE + international code
    const lineItems = lines.map(l => {
      const isDomestic = l.ship_to_country_iso === 'GB';
      return {
        Description: l.description,
        Quantity:    l.quantity,
        UnitAmount:  parseFloat(l.unit_price),
        AccountCode: isDomestic ? domesticCode : internationalCode,
        TaxType:     isDomestic ? 'OUTPUT2' : 'NONE',
      };
    });

    // If no line items, create a single summary line (fall back to customer vat_enabled flag)
    if (!lineItems.length) {
      lineItems.push({
        Description: `Parcel delivery services — ${inv.billing_period_start} to ${inv.billing_period_end}`,
        Quantity:    1,
        UnitAmount:  parseFloat(inv.total),
        AccountCode: domesticCode,
        TaxType:     inv.vat_enabled ? 'OUTPUT2' : 'NONE',
      });
    }

    const xeroInvoice = {
      Type:          'ACCREC',
      Contact:       { ContactID: inv.xero_contact_id },
      Date:          inv.generated_at ? inv.generated_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      DueDate:       dueDateFromGenerated(inv.generated_at),
      InvoiceNumber: inv.invoice_number,
      LineItems:     lineItems,
      Status:        'DRAFT',
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

// ─── POST /api/xero/reconciliation-runs/:runId/push ──────────────────────────
// Push Xero invoices for all customers in a finalized reconciliation run.
// One invoice per customer. Xero Reference = "MoovOS Recon Run #<runId> — <invoice_ref>".
// Body: { customer_id? } — if supplied, push only that customer.
//
// Returns: { pushed: [], skipped: [], errors: [] }

router.post('/reconciliation-runs/:runId/push', async (req, res, next) => {
  try {
    const runId      = parseInt(req.params.runId);
    const filterCust = req.body?.customer_id || null;

    // Load run
    const runRes = await query(
      `SELECT rr.*, c.name AS carrier_name
       FROM   reconciliation_runs rr
       LEFT JOIN couriers c ON c.id = rr.carrier_id
       WHERE  rr.id = $1`,
      [runId]
    );
    if (!runRes.rows.length) return res.status(404).json({ error: 'Run not found' });
    const run = runRes.rows[0];
    if (!run.finalized) {
      return res.status(422).json({ error: 'Run must be finalized before pushing to Xero' });
    }

    // Load finalized lines, grouped by customer
    const params = [runId];
    let custFilter = '';
    if (filterCust) {
      params.push(filterCust);
      custFilter = `AND f.customer_id = $${params.length}`;
    }

    const linesRes = await query(`
      SELECT
        f.*,
        cu.xero_contact_id,
        cu.business_name        AS xero_customer_name,
        cu.payment_terms_days   AS payment_terms_days
      FROM   finalized_billing_lines f
      LEFT JOIN customers cu ON cu.id = f.customer_id
      WHERE  f.run_id = $1 ${custFilter}
      ORDER  BY f.customer_id, f.despatch_date, f.tracking_number
    `, params);

    // Group by customer
    const byCustomer = new Map();
    for (const line of linesRes.rows) {
      const key = String(line.customer_id);
      if (!byCustomer.has(key)) {
        byCustomer.set(key, {
          customer_id:        line.customer_id,
          customer_name:      line.xero_customer_name || line.customer_name,
          xero_contact_id:    line.xero_contact_id,
          payment_terms_days: parseInt(line.payment_terms_days || 7),
          lines:              [],
        });
      }
      byCustomer.get(key).lines.push(line);
    }

    const pushed   = [];
    const skipped  = [];
    const errors   = [];
    const today    = new Date().toISOString().split('T')[0];

    // Load nominal codes from billing settings
    const settingsRes = await query(`SELECT xero_domestic_account_code, xero_international_account_code FROM billing_settings WHERE id = 1`);
    const settings = settingsRes.rows[0] || {};
    const fallbackCode     = process.env.XERO_ACCOUNT_CODE || '200';
    const domesticCode     = settings.xero_domestic_account_code     || fallbackCode;
    const internationalCode = settings.xero_international_account_code || fallbackCode;

    // Enrich finalized lines with ship_to_country_iso via charges → shipments
    const lineIds = linesRes.rows.map(l => l.id);
    let countryByLineId = {};
    if (lineIds.length > 0) {
      const countryRes = await query(`
        SELECT fbl.id AS line_id, s.ship_to_country_iso
        FROM finalized_billing_lines fbl
        JOIN charges ch ON ch.id = fbl.charge_id
        JOIN shipments s ON s.id = ch.shipment_id
        WHERE fbl.id = ANY($1::int[])
      `, [lineIds]);
      for (const row of countryRes.rows) {
        countryByLineId[row.line_id] = row.ship_to_country_iso;
      }
    }

    for (const [, cust] of byCustomer) {
      if (!cust.xero_contact_id) {
        skipped.push({
          customer_id:   cust.customer_id,
          customer_name: cust.customer_name,
          reason:        'Not linked to a Xero contact',
        });
        continue;
      }

      try {
        // Build summary line items:
        //   - One freight line per service type (base only, not fuel)
        //   - One fuel line totalled across all services
        //   - One line per named surcharge (GEC, Long Length, etc.) totalled across all services
        const summaryGroups = {};

        for (const l of cust.lines) {
          const destCountry = countryByLineId[l.id] || null;
          const isDomestic  = destCountry === 'GB';
          const accountCode = isDomestic ? domesticCode : internationalCode;
          const taxType     = isDomestic ? 'OUTPUT2' : 'NONE';
          const serviceName = l.service_name || 'Parcel Delivery';

          // Freight — base sell only, one line per service name
          const baseAmt = parseFloat(l.sell_base_amount || 0);
          if (baseAmt !== 0) {
            const freightKey = `freight|${isDomestic}|${serviceName}`;
            if (!summaryGroups[freightKey]) {
              summaryGroups[freightKey] = {
                sortOrder: 0, description: serviceName, count: 0, total: 0, accountCode, taxType,
              };
            }
            summaryGroups[freightKey].count++;
            summaryGroups[freightKey].total += baseAmt;
          }

          // Fuel — combined total across all services (one line)
          const fuelAmt = parseFloat(l.sell_fuel_amount || 0);
          if (fuelAmt > 0) {
            if (!summaryGroups['fuel']) {
              summaryGroups['fuel'] = {
                sortOrder: 2, description: 'Fuel Surcharge', count: 0, total: 0, accountCode, taxType,
              };
            }
            summaryGroups['fuel'].count++;
            summaryGroups['fuel'].total += fuelAmt;
          }

          // Named surcharges — from surcharge_detail JSONB, one line per surcharge name
          const detail = l.surcharge_detail
            ? (Array.isArray(l.surcharge_detail)
                ? l.surcharge_detail
                : JSON.parse(l.surcharge_detail))
            : [];

          for (const s of detail) {
            if (s.charge_type !== 'surcharge') continue; // fuel entries already handled above
            const sAmt = parseFloat(s.sell_amount || 0);
            if (sAmt <= 0) continue;
            const sName = s.surcharge_name || 'Additional Surcharges';
            const surchargeKey = `surcharge|${sName}`;
            if (!summaryGroups[surchargeKey]) {
              summaryGroups[surchargeKey] = {
                sortOrder: 1, description: sName, count: 0, total: 0, accountCode, taxType,
              };
            }
            summaryGroups[surchargeKey].count++;
            summaryGroups[surchargeKey].total += sAmt;
          }
        }

        const lineItems = Object.values(summaryGroups)
          .filter(g => g.total > 0)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(g => ({
            Description: `${g.description} — ${g.count} ${g.count === 1 ? 'parcel' : 'parcels'}`,
            Quantity:    1,
            UnitAmount:  Math.round(g.total * 100) / 100,
            AccountCode: g.accountCode,
            TaxType:     g.taxType,
          }));

        // Deduplicate: collapse pure-zero lines
        const nonZeroLines = lineItems.filter(l => l.UnitAmount !== 0);
        const itemsToSend  = nonZeroLines.length > 0 ? nonZeroLines : lineItems;

        // Due date from customer payment terms (default 7 days)
        const custDueDate = new Date(today);
        custDueDate.setDate(custDueDate.getDate() + cust.payment_terms_days);
        const custDueDateStr = custDueDate.toISOString().split('T')[0];

        // Invoice number: abbreviated customer name + DDMMYY from run invoice date
        const custAbbrev = (cust.customer_name || '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 10);
        const runDate = run.invoice_date ? new Date(run.invoice_date) : new Date(today);
        const dd = String(runDate.getDate()).padStart(2, '0');
        const mm = String(runDate.getMonth() + 1).padStart(2, '0');
        const yy = String(runDate.getFullYear()).slice(-2);
        const invoiceNumber = `${custAbbrev}-${dd}${mm}${yy}`;

        const xeroInvoice = {
          Type:          'ACCREC',
          Contact:       { ContactID: cust.xero_contact_id },
          Date:          today,
          DueDate:       custDueDateStr,
          LineItems:     itemsToSend,
          Status:        'DRAFT',
          InvoiceNumber: invoiceNumber,
        };

        const data = await xeroRequest('POST', '/Invoices', { Invoices: [xeroInvoice] });
        const xeroInvoiceId = data.Invoices?.[0]?.InvoiceID;

        if (xeroInvoiceId) {
          // Update all finalized lines for this customer/run with the Xero invoice ID
          await query(`
            UPDATE finalized_billing_lines
            SET xero_invoice_id = $1, xero_pushed_at = NOW()
            WHERE run_id = $2 AND customer_id = $3
          `, [xeroInvoiceId, runId, cust.customer_id]);

          pushed.push({
            customer_id:    cust.customer_id,
            customer_name:  cust.customer_name,
            xero_invoice_id: xeroInvoiceId,
            line_count:     cust.lines.length,
            total:          cust.lines.reduce((s, l) => s + parseFloat(l.sell_total_amount || 0), 0).toFixed(2),
          });
        } else {
          throw new Error('Xero did not return an InvoiceID');
        }
      } catch (err) {
        console.error(`[xero/recon-push] Customer ${cust.customer_name} error:`, err.message);
        errors.push({
          customer_id:   cust.customer_id,
          customer_name: cust.customer_name,
          error:         err.message,
        });

        // Store error against the finalized lines so UI can display it
        await query(`
          UPDATE finalized_billing_lines
          SET xero_push_error = $1
          WHERE run_id = $2 AND customer_id = $3
        `, [err.message.slice(0, 500), runId, cust.customer_id]);
      }
    }

    return res.json({ ok: true, pushed, skipped, errors });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/xero/sync-ledger-balances ──────────────────────────────────────
// Pull unpaid invoice totals from Xero for ALL linked customers and store in
// customers.ledger_balance.  Called by a scheduled task every 4-6 hours.
// Can also be triggered manually from the UI.
//
// Returns: { updated: number, errors: number, customers: [{ id, name, balance }] }

router.post('/sync-ledger-balances', async (req, res, next) => {
  try {
    const token = await getStoredToken();
    if (!token) return res.status(400).json({ error: 'Xero is not connected' });

    // All customers that are linked to a Xero contact
    const { rows: linkedCustomers } = await query(
      `SELECT id, business_name, xero_contact_id
       FROM customers
       WHERE xero_contact_id IS NOT NULL
         AND account_status != 'deleted'
       ORDER BY business_name`
    );

    if (!linkedCustomers.length) {
      return res.json({ updated: 0, errors: 0, customers: [] });
    }

    // Fetch all AUTHORISED invoices from Xero in one call.
    // Xero allows filtering by ContactIDs (comma-separated, max 500).
    const contactIds = linkedCustomers.map(c => c.xero_contact_id);
    const batchSize  = 100; // Xero ContactIDs filter limit per request

    // Map xero_contact_id → outstanding balance
    const balanceByContact = {};

    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batch = contactIds.slice(i, i + batchSize);
      try {
        const data = await xeroRequest(
          'GET',
          `/Invoices?ContactIDs=${batch.join(',')}&Statuses=AUTHORISED&summaryOnly=true`
        );
        for (const inv of (data.Invoices || [])) {
          const cid = inv.Contact?.ContactID;
          if (!cid) continue;
          balanceByContact[cid] = (balanceByContact[cid] || 0) + parseFloat(inv.AmountDue || 0);
        }
      } catch (batchErr) {
        console.error('[xero/sync-ledger-balances] batch error:', batchErr.message);
        // Continue — other batches may succeed
      }
    }

    let updated = 0;
    let errors  = 0;
    const updatedCustomers = [];

    for (const cust of linkedCustomers) {
      const balance = balanceByContact[cust.xero_contact_id] || 0;
      try {
        await query(
          `UPDATE customers SET ledger_balance = $1 WHERE id = $2`,
          [Math.round(balance * 100) / 100, cust.id]
        );
        updated++;
        updatedCustomers.push({
          id:      cust.id,
          name:    cust.business_name,
          balance: Math.round(balance * 100) / 100,
        });
      } catch (err) {
        console.error(`[xero/sync-ledger-balances] update failed for ${cust.business_name}:`, err.message);
        errors++;
      }
    }

    console.log(`[xero/sync-ledger-balances] Synced ${updated} customers, ${errors} errors`);

    return res.json({
      ok:        true,
      updated,
      errors,
      synced_at: new Date().toISOString(),
      customers: updatedCustomers,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
