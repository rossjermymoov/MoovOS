/**
 * Katana AI Agent — server routes
 *
 * GET    /api/katana/sources          — list knowledge sources
 * POST   /api/katana/sources          — create source (text or url)
 * PATCH  /api/katana/sources/:id      — update (toggle active, edit content)
 * DELETE /api/katana/sources/:id      — delete source
 * POST   /api/katana/sources/:id/sync — re-fetch URL content
 * POST   /api/katana/chat             — main chat endpoint (Anthropic tool-use + live DB)
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL   = 'claude-haiku-4-5-20251001';

// ─── DB schema description for Katana's system prompt ────────────────────────
const DB_SCHEMA = `
DATABASE SCHEMA (PostgreSQL — read-only access):

━━━ CARRIER PRICING (what Moov Parcel PAYS couriers) ━━━

TABLE couriers
  id int PK, code varchar (e.g. 'DPD', 'DHL', 'EVRI'), name varchar

TABLE courier_services
  id int PK, courier_id int FK→couriers, service_code varchar, name varchar
  Examples: 'DPD Next Day', 'DPD Two Day', 'DHL Express', 'Evri Standard'

TABLE zones
  id int PK, courier_service_id int FK→courier_services, name varchar
  Examples: 'Mainland', 'Highlands', 'Northern Ireland', 'Europe Zone 1'

TABLE weight_bands  ← THIS IS THE CARRIER COST PRICE TABLE
  id int PK, zone_id int FK→zones,
  min_weight_kg numeric, max_weight_kg numeric,
  price_first numeric(£) — cost per first parcel (what Moov pays the courier),
  price_sub numeric(£)   — cost per additional parcel in same consignment

  IMPORTANT: price_first = what MOOV PARCEL PAYS the courier.
  To find carrier costs, JOIN: weight_bands → zones → courier_services → couriers

  EXAMPLE query for "how much do we pay DPD for Next Day?":
  SELECT c.name, cs.name as service, z.name as zone, wb.min_weight_kg, wb.max_weight_kg, wb.price_first
  FROM weight_bands wb
  JOIN zones z ON z.id = wb.zone_id
  JOIN courier_services cs ON cs.id = z.courier_service_id
  JOIN couriers c ON c.id = cs.courier_id
  WHERE c.code ILIKE 'dpd' AND cs.name ILIKE '%next%day%'
  ORDER BY z.name, wb.min_weight_kg

━━━ CUSTOMER PRICING (what customers PAY Moov Parcel) ━━━

TABLE customer_rates
  id int PK, customer_id uuid FK→customers, courier_code, courier_name,
  service_code, service_name, zone_name, weight_class_name,
  price numeric(£) — what the CUSTOMER pays Moov Parcel for this service/zone/weight

  IMPORTANT: customer_rates.price = what the CUSTOMER pays us (our sell price).
  This is different from weight_bands.price_first (what WE pay the courier).

━━━ CUSTOMERS & ACCOUNTS ━━━

TABLE customers
  id uuid PK, business_name text, account_number varchar (format MOS-00001),
  tier enum(bronze/silver/gold/enterprise), account_status enum(active/on_stop/suspended/churned),
  credit_limit numeric(£), outstanding_balance numeric(£), payment_terms_days int,
  is_on_stop bool, health_score enum(green/amber/red), primary_email, phone_number,
  registered_address, postcode, date_onboarded timestamptz

TABLE customer_contacts
  id uuid PK, customer_id uuid FK→customers, full_name, email, phone, role,
  flag enum(main/finance/both/none)

━━━ BILLING & INVOICING ━━━

TABLE shipments
  id uuid PK, customer_id uuid FK→customers, customer_name, customer_account,
  courier, service_name, ship_to_name, ship_to_postcode, ship_to_country_iso,
  tracking_codes text[], total_weight_kg numeric, collection_date date,
  cancelled bool, created_at timestamptz

TABLE charges
  id uuid PK, shipment_id uuid FK→shipments, customer_id uuid FK→customers,
  charge_type enum(courier/surcharge/picking/packaging/return/rule/ad_hoc),
  service_name, price numeric(£), cost_price numeric(£), vat_amount numeric(£),
  invoice_id uuid FK→invoices

TABLE invoices
  id uuid PK, customer_id uuid FK→customers,
  status enum(draft/issued/paid/overdue/written_off),
  total_net numeric(£), total_vat numeric(£), total_gross numeric(£),
  amount_paid numeric(£), balance_due numeric(£),
  due_date date, issued_at timestamptz, paid_at timestamptz

━━━ SUPPORT TICKETS ━━━

TABLE queries
  id uuid PK, customer_id uuid FK→customers, ticket_number varchar,
  subject text, status enum(open/in_progress/waiting_on_customer/resolved/closed),
  query_type enum(whereabouts/not_delivered/damaged/missing_items/failed_delivery/returned/delay/claim/other),
  priority enum(low/medium/high/urgent), courier_code, consignment_number,
  requires_attention bool, assigned_to uuid FK→staff, created_at timestamptz

TABLE query_emails
  id uuid PK, query_id uuid FK→queries, direction enum(inbound/outbound),
  subject, body_text, from_address, to_address, sent_at timestamptz,
  is_ai_draft bool, ai_draft_approved_by uuid FK→staff

━━━ STAFF & COURIERS ━━━

TABLE staff
  id uuid PK, full_name, email,
  role enum(sales/account_management/onboarding/finance/cs/manager/director), is_active bool

TABLE courier_contacts
  id int PK, courier_id int FK→couriers, courier_name, name, email, phone, role, service_name

TABLE tracking_events
  id int PK, consignment_number, courier_code, status_code, status_description,
  event_timestamp timestamptz, location

USEFUL JOINS:
  weight_bands → carrier cost: wb JOIN zones z ON z.id=wb.zone_id JOIN courier_services cs ON cs.id=z.courier_service_id JOIN couriers c ON c.id=cs.courier_id
  charges → invoices: charges.invoice_id = invoices.id
  charges → customers: charges.customer_id = customers.id
  shipments → customers: shipments.customer_id = customers.id
  queries → customers: queries.customer_id = customers.id
`;

// ─── Build system prompt ──────────────────────────────────────────────────────
function buildSystemPrompt(knowledgeSources) {
  const knowledgeBlock = knowledgeSources.length
    ? `\n\nKNOWLEDGE BASE (policies & guidelines):\n${knowledgeSources.map(s => `### ${s.title}\n${s.raw_content}`).join('\n\n')}`
    : '';

  return `You are Katana, the intelligent AI assistant for Moov Parcel — a UK-based parcel courier reseller.
You help the internal team answer questions about customers, pricing, tickets, tracking, balances, and operations.

You have access to a run_query tool that lets you run read-only SELECT queries against the live database.
Use it whenever you need to look up real data to answer a question accurately.

${DB_SCHEMA}${knowledgeBlock}

RULES:
- Only run SELECT queries. Never INSERT, UPDATE, DELETE, DROP, or ALTER.
- Always format money as £X.XX (pounds sterling).
- Use UK English and UK date format (DD/MM/YYYY).
- Be concise and direct — the team is busy.
- If a question is ambiguous, make a reasonable assumption and state it.
- If a query returns no results, say so clearly.
- When showing tables of data, keep them tight and readable.
- You know everything about the business from the database. Never say you don't have access to data — use run_query to find it.`;
}

// ─── Anthropic tool-use loop ──────────────────────────────────────────────────
async function runKatanaChat(messages, knowledgeSources) {
  const tools = [
    {
      name: 'run_query',
      description: 'Run a read-only SELECT SQL query against the Moov Parcel PostgreSQL database. Returns rows as JSON. Always use this to look up live data.',
      input_schema: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'A valid PostgreSQL SELECT query. Must start with SELECT. Limit results to 50 rows max.',
          },
          description: {
            type: 'string',
            description: 'Brief description of what this query is fetching (for logging).',
          },
        },
        required: ['sql'],
      },
    },
  ];

  const systemPrompt = buildSystemPrompt(knowledgeSources);

  let currentMessages = [...messages];

  // Agentic loop — keep going until Anthropic stops using tools
  for (let i = 0; i < 8; i++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        tools,
        messages: currentMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const data = await response.json();

    if (data.stop_reason === 'end_turn') {
      // Extract text from response
      const text = data.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');
      return text;
    }

    if (data.stop_reason === 'tool_use') {
      // Execute all tool calls
      const toolUseBlocks = data.content.filter(b => b.type === 'tool_use');
      const toolResults = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === 'run_query') {
          let result;
          try {
            const sql = toolUse.input.sql.trim();
            // Safety: only allow SELECT
            if (!/^SELECT\b/i.test(sql)) {
              result = { error: 'Only SELECT queries are permitted.' };
            } else {
              const { rows } = await query(sql + (sql.toLowerCase().includes('limit') ? '' : ' LIMIT 50'));
              result = { rows, count: rows.length };
            }
          } catch (e) {
            result = { error: e.message };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }
      }

      // Add assistant message + tool results and loop
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: data.content },
        { role: 'user', content: toolResults },
      ];
    } else {
      // Unexpected stop reason
      const text = (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');
      return text || 'No response generated.';
    }
  }

  return 'I reached the maximum number of steps. Please try a more specific question.';
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/katana/sources
router.get('/sources', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM katana_knowledge_sources ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/katana/sources
router.post('/sources', async (req, res) => {
  const { title, source_type, url, raw_content, category } = req.body;
  try {
    let content = raw_content || null;
    let synced_at = null;

    // If URL source, fetch and extract content now
    if (source_type === 'url' && url) {
      try {
        const fetched = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MoovParcel/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        const html = await fetched.text();
        // Strip HTML tags
        content = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 20000); // cap at 20k chars
        synced_at = new Date().toISOString();
      } catch (fetchErr) {
        content = `[Could not fetch URL: ${fetchErr.message}]`;
      }
    }

    const { rows } = await query(
      `INSERT INTO katana_knowledge_sources (title, source_type, url, raw_content, category, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, source_type, url || null, content, category || null, synced_at]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/katana/sources/:id
router.patch('/sources/:id', async (req, res) => {
  const { id } = req.params;
  const { title, raw_content, category, is_active } = req.body;
  try {
    const fields = [];
    const vals = [];
    let n = 1;
    if (title       !== undefined) { fields.push(`title = $${n++}`);       vals.push(title); }
    if (raw_content !== undefined) { fields.push(`raw_content = $${n++}`); vals.push(raw_content); }
    if (category    !== undefined) { fields.push(`category = $${n++}`);    vals.push(category); }
    if (is_active   !== undefined) { fields.push(`is_active = $${n++}`);   vals.push(is_active); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(id);
    const { rows } = await query(
      `UPDATE katana_knowledge_sources SET ${fields.join(', ')} WHERE id = $${n} RETURNING *`,
      vals
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/katana/sources/:id
router.delete('/sources/:id', async (req, res) => {
  try {
    await query('DELETE FROM katana_knowledge_sources WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/katana/sources/:id/sync  — re-fetch URL content
router.post('/sources/:id/sync', async (req, res) => {
  try {
    const { rows: [source] } = await query(
      'SELECT * FROM katana_knowledge_sources WHERE id = $1', [req.params.id]
    );
    if (!source || source.source_type !== 'url' || !source.url) {
      return res.status(400).json({ error: 'Not a URL source' });
    }
    const fetched = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MoovParcel/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await fetched.text();
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 20000);
    const { rows } = await query(
      `UPDATE katana_knowledge_sources SET raw_content = $1, last_synced_at = NOW() WHERE id = $2 RETURNING *`,
      [content, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/katana/chat
router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    // Load active knowledge sources
    const { rows: sources } = await query(
      `SELECT title, raw_content FROM katana_knowledge_sources WHERE is_active = true AND raw_content IS NOT NULL`
    );

    // Trim history to last 10 messages to avoid context overflow.
    // Tool-use intermediate content is handled server-side; the client only
    // stores plain text turns, so each entry is small — but cap it anyway.
    const trimmedHistory = history.slice(-10);

    // Build message list for Anthropic
    const messages = [
      ...trimmedHistory,
      { role: 'user', content: message },
    ];

    const reply = await runKatanaChat(messages, sources);

    res.json({ reply });
  } catch (e) {
    console.error('[Katana chat error]', e.message);
    // Return a user-friendly message so the widget shows something meaningful
    // rather than just "oops something went wrong"
    const friendly = e.message?.includes('Anthropic API error')
      ? 'I had trouble reaching the AI service. Please try again in a moment.'
      : e.message?.includes('context_length_exceeded') || e.message?.includes('too long')
      ? 'That conversation got too long for me to process. Try clearing the chat and asking again.'
      : 'Something went wrong on my end. Please try again.';
    res.status(500).json({ error: friendly, detail: e.message });
  }
});

export default router;
