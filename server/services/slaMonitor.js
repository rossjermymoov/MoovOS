/**
 * slaMonitor.js — "Screaming" SLA escalation to Google Chat (#cs-alerts).
 *
 * Scans open tickets whose courier SLA clock has blown and that haven't yet been
 * escalated, then posts a rich cardsV2 alert to the Google Chat incoming webhook
 * (GOOGLE_CHAT_WEBHOOK_URL). Marks google_chat_escalated so each ticket screams
 * once. The UI separately shifts the card red via courier_sla_breached.
 *
 * No-ops cleanly when the webhook env var is absent.
 */

import { query } from '../db/index.js';

const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;
const APP_BASE = process.env.PUBLIC_APP_URL || 'https://moovos-production.up.railway.app';

function fmtSince(ts) {
  if (!ts) return 'unknown';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function buildCard(t) {
  const since = fmtSince(t.courier_sent_at || t.courier_sla_expires_at);
  return {
    cardsV2: [{
      cardId: `moov-sla-breach-${t.ticket_number}`,
      card: {
        header: {
          title: `⏳ SLA BREACH — Moov-${t.ticket_number}`,
          subtitle: `${t.courier_name || 'Courier'} · Awaiting reply ${since} past SLA`,
        },
        sections: [
          {
            header: 'Ticket summary',
            widgets: [
              { decoratedText: { topLabel: 'Customer',    text: t.customer_name || '—' } },
              { decoratedText: { topLabel: 'Consignment', text: t.consignment_number || '—' } },
              { decoratedText: { topLabel: 'Priority',    text: String(t.priority || 'medium').toUpperCase() } },
              { textParagraph: { text: `<b>Summary:</b> ${(t.description || 'No summary.').slice(0, 400)}` } },
              { decoratedText: { startIcon: { knownIcon: 'CLOCK' }, text: `Stagnant for <b>${since}</b> past the SLA window.` } },
            ],
          },
          {
            widgets: [{
              buttonList: { buttons: [
                { text: '🔄 Fire Auto-Remind Email',
                  onClick: { openLink: { url: `${APP_BASE}/api/queries/${t.id}/auto-remind` } } },
                { text: 'Open Ticket',
                  onClick: { openLink: { url: `${APP_BASE}/queries/${t.id}` } } },
              ]},
            }],
          },
        ],
      },
    }],
  };
}

// Resolve which sla_configs row governs a ticket: urgent priority → 'urgent';
// else a courier-specific group if configured (e.g. dpd_queries / dhl_chases);
// else 'default'.
function resolveSlaGroup(ticket, configs) {
  if (String(ticket.priority || '').toLowerCase() === 'urgent' && configs.urgent) return 'urgent';
  const cc = String(ticket.courier_code || '').toLowerCase();
  for (const suffix of ['_queries', '_chases']) {
    if (cc && configs[`${cc}${suffix}`]) return `${cc}${suffix}`;
  }
  return 'default';
}

export async function runSlaScreamScan() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!webhook) return { skipped: 'no GOOGLE_CHAT_WEBHOOK_URL' };

  // Load the configurable thresholds (from the Switchboard).
  const cfgRows = await query(`SELECT * FROM sla_configs`);
  const configs = Object.fromEntries(cfgRows.rows.map(c => [c.workflow_group, c]));

  // Candidates: awaiting a courier reply, not yet escalated. We compute the
  // breach from the per-group response_target_minutes vs when we contacted the
  // courier (latest sent outbound_courier), falling back to courier_sla_expires_at.
  const due = await query(`
    SELECT q.id, q.ticket_number, q.customer_name, q.courier_name, q.courier_code,
           q.consignment_number, q.priority, q.description, q.courier_sla_expires_at,
           (SELECT MAX(sent_at) FROM query_emails
             WHERE query_id = q.id AND direction = 'outbound_courier' AND sent_at IS NOT NULL) AS courier_sent_at
    FROM queries q
    WHERE COALESCE(q.google_chat_escalated, false) = false
      AND q.last_courier_response_at IS NULL
      AND q.internal_automation_state = 'awaiting_courier_response'
      AND q.status NOT IN ${RESOLVED}
    ORDER BY q.updated_at ASC
    LIMIT 50
  `);

  let screamed = 0;
  for (const t of due.rows) {
    // Threshold check
    const group = resolveSlaGroup(t, configs);
    const cfg   = configs[group] || configs.default;
    if (cfg && cfg.scream_to_google_chat === false) continue;   // muted for this group
    const targetMin = cfg?.response_target_minutes ?? null;

    let breached = false;
    if (t.courier_sent_at && targetMin != null) {
      const elapsedMin = (Date.now() - new Date(t.courier_sent_at).getTime()) / 60000;
      breached = elapsedMin > targetMin;
    } else if (t.courier_sla_expires_at) {
      breached = new Date(t.courier_sla_expires_at) < new Date();   // fallback
    }
    if (!breached) continue;

    try {
      const resp = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCard(t)),
      });
      if (resp.ok) {
        await query(`UPDATE queries SET google_chat_escalated = true, updated_at = NOW() WHERE id = $1`, [t.id]);
        screamed++;
      } else {
        console.warn('[SLA] Google Chat post failed:', resp.status, await resp.text());
      }
    } catch (e) { console.warn('[SLA] Google Chat error:', e.message); }
  }
  if (screamed) console.log(`[SLA] 🔔 screamed ${screamed} breached ticket(s) to Google Chat`);
  return { screamed, scanned: due.rows.length };
}
