/**
 * TicketDetailPage — /queries/:id
 * Moov OS 2.4 — complete rewrite, clean Linear/Vercel aesthetic
 */

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, CheckCircle2, Mail, MessageSquare, Truck,
  Send, RefreshCw, ExternalLink, Sparkles, Edit2,
  AlertTriangle, Clock,
} from 'lucide-react';
import { getCourierLogo } from '../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });

// ── Design tokens ─────────────────────────────────────────────────────────────
// Values now point at the app-wide mv- design tokens (client/src/styles/moov.css)
// instead of hardcoded hex, so this screen follows light/dark theme switching.
const C = {
  bg:       'var(--mv-bg)',
  card:     'var(--mv-surface)',
  border:   'var(--mv-hairline)',
  green:    'var(--mv-green-deep)',
  amber:    'var(--mv-amber-deep)',
  red:      'var(--mv-magenta-deep)',
  blue:     'var(--mv-teal)',
  text:     'var(--mv-ink)',
  sub:      'var(--mv-ink-78)',
  muted:    'var(--mv-ink-45)',
  greenDim: 'var(--mv-purple-100)',
  amberDim: 'var(--mv-amber-100)',
  redDim:   'var(--mv-magenta-100)',
  blueDim:  'var(--mv-teal-100)',
};

// ── Status / priority config ──────────────────────────────────────────────────
const STATUS_CFG = {
  open:                    { label: 'Open',              color: C.blue,  bg: C.blueDim  },
  awaiting_customer_info:  { label: 'Awaiting customer', color: C.amber, bg: C.amberDim },
  info_received:           { label: 'Info received',     color: C.green, bg: C.greenDim },
  drafting:                { label: 'Drafting',          color: C.green, bg: C.greenDim },
  awaiting_courier:        { label: 'Awaiting courier',  color: C.amber, bg: C.amberDim },
  courier_replied:         { label: 'Courier replied',   color: C.green, bg: C.greenDim },
  courier_investigating:   { label: 'Investigating',     color: C.amber, bg: C.amberDim },
  awaiting_customer:       { label: 'Awaiting customer', color: C.amber, bg: C.amberDim },
  claim_raised:            { label: 'Claim raised',      color: C.red,   bg: C.redDim   },
  awaiting_claim_docs:     { label: 'Awaiting docs',     color: C.red,   bg: C.redDim   },
  claim_submitted:         { label: 'Claim submitted',   color: C.amber, bg: C.amberDim },
  resolved:                { label: 'Resolved',          color: C.green, bg: C.greenDim },
  resolved_claim_approved: { label: 'Claim approved',    color: C.green, bg: C.greenDim },
  resolved_claim_rejected: { label: 'Claim rejected',    color: C.red,   bg: C.redDim   },
  escalated:               { label: 'Escalated',         color: C.red,   bg: C.redDim   },
};

const PRIORITY_CFG = {
  urgent: { label: 'Urgent', color: C.red   },
  high:   { label: 'High',   color: C.amber },
  medium: { label: 'Medium', color: C.blue  },
  low:    { label: 'Low',    color: C.muted },
};

const GROUPS = ['Claims', 'Queries', 'Billing', 'Technical'];

// Map a ticket's state to a premium, contextual badge style (Freshdesk-like).
//  Green = resolved/closed · Red = urgent/escalated/SLA-breached · Amber =
//  needs attention/awaiting · Blue = normal/open.
// Badge colour driven strictly by the priority spectrum (matching the queue's
// left-hand indicator strip), with completed tickets overriding to green.
//   Closed/Resolved → green · Urgent → red · High → amber · Medium → yellow · Low → blue
// Returns an inline style object (mv- tokens) instead of Tailwind color
// classes, plus any non-color classes (e.g. font-bold) to keep on the element.
function ticketBadgeStyle(ticket) {
  const s = (ticket?.status || '').toLowerCase();
  const p = (ticket?.priority || '').toLowerCase();
  if (['resolved', 'resolved_claim_approved', 'resolved_claim_rejected', 'closed'].includes(s))
    return { style: { background: 'var(--mv-purple-100)', color: 'var(--mv-green-deep)', borderColor: 'var(--mv-purple-200)' }, cls: '' };
  if (p === 'urgent') return { style: { background: 'var(--mv-magenta-100)', color: 'var(--mv-magenta-deep)', borderColor: 'var(--mv-magenta-200)' }, cls: 'font-bold' };
  if (p === 'high')   return { style: { background: 'var(--mv-amber-100)', color: 'var(--mv-amber-deep)', borderColor: 'var(--mv-amber-200)' }, cls: 'font-bold' };
  // "medium" has no dedicated token in the mv- system (only urgent/high/low map
  // cleanly onto magenta/amber/teal) — reusing the amber tint here, one shade
  // lighter in weight than "high", is a judgement call (see report).
  if (p === 'medium') return { style: { background: 'var(--mv-amber-100)', color: 'var(--mv-amber-deep)', borderColor: 'var(--mv-amber-200)' }, cls: 'font-bold' };
  return { style: { background: 'var(--mv-teal-100)', color: 'var(--mv-teal)', borderColor: 'var(--mv-teal-200)' }, cls: '' }; // low / default
}

// Dynamic SLA countdown string from courier_sla_expires_at.
// Returns null when no SLA clock is set on the ticket.
function slaCountdownString(ticket) {
  if (!ticket?.courier_sla_expires_at) return null;
  const diffMs = new Date(ticket.courier_sla_expires_at).getTime() - Date.now();
  if (diffMs > 0) {
    const hours   = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `⏳ ${hours}h ${minutes}m remaining`;
  }
  const hoursOver = Math.floor(-diffMs / 3600000);
  return `🚨 SLA BREACHED (${hoursOver}h ago)`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(ts) {
  if (!ts) return '—';
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Voice input hook ──────────────────────────────────────────────────────────
function useSpeechInput(setText) {
  const [listening, setListening] = useState(false);
  function toggle() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser.'); return; }
    setListening(true);
    const rec = new SR();
    rec.lang = 'en-GB'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = e => {
      const t = e.results[0]?.[0]?.transcript || '';
      if (t) setText(p => p ? p + ' ' + t : t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }
  return { listening, toggle };
}

// ── Sidebar card ──────────────────────────────────────────────────────────────
function SbSection({ title, action, children }) {
  return (
    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--mv-hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', margin: 0 }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function SbRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '5px 0' }}>
      <span style={{ fontSize: 11.5, color: 'var(--mv-ink-45)', fontWeight: 500, width: 90, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--mv-ink)', fontWeight: 500, flex: 1, textAlign: 'right', lineHeight: 1.4 }}>{children}</span>
    </div>
  );
}

// ── Inline select (for sidebar fields) ───────────────────────────────────────
// Note: the dropdown-chevron icon is a literal data-URI SVG, so its stroke
// colour can't reference a CSS custom property — it stays a fixed hex that
// approximates var(--mv-ink-45) in light mode (a known light-mode-only spot).
function InlineSelect({ value, onChange, options, colorMap, fill = false }) {
  const color = colorMap?.[value]?.color || 'var(--mv-ink)';
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', maxWidth: fill ? 'none' : 170, background: 'var(--mv-surface)',
        border: '1px solid var(--mv-hairline)', borderRadius: 6, outline: 'none',
        color, fontSize: 12, fontWeight: 500, cursor: 'pointer',
        padding: '5px 26px 5px 9px', textAlign: 'left', appearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}
          style={{ background: C.card, color: C.text, fontWeight: 400 }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── SLA chip ──────────────────────────────────────────────────────────────────
function SlaValue({ sla_due_at, sla_breached, sla_mins_remaining }) {
  if (!sla_due_at) return <span style={{ fontSize: 11, color: C.muted }}>—</span>;
  const mins = sla_mins_remaining;
  let label, color;
  if (sla_breached)    { label = 'Overdue'; color = C.red; }
  else if (mins < 60)  { label = `${Math.round(mins)}m left`; color = C.red; }
  else if (mins < 240) { label = `${Math.round(mins / 60)}h left`; color = C.amber; }
  else {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    label = m > 0 ? `${h}h ${m}m left` : `${h}h left`;
    color = C.green;
  }
  return <span style={{ fontSize: 11, fontWeight: 500, color }}>{label}</span>;
}

// ── Tracking mini-timeline ────────────────────────────────────────────────────
function TrackingTimeline({ events }) {
  if (!events?.length) return (
    <div style={{ fontSize: 11, color: C.muted, padding: '4px 0', fontStyle: 'italic' }}>No tracking events yet</div>
  );
  const recent = [...events]
    .sort((a, b) => new Date(b.event_at) - new Date(a.event_at))
    .slice(0, 6);
  return (
    <div style={{ position: 'relative', paddingLeft: 22 }}>
      {/* Vertical connecting line */}
      <div style={{
        position: 'absolute', left: 5, top: 7,
        width: 1.5, height: `calc(100% - 14px)`,
        background: 'linear-gradient(to bottom, var(--mv-purple), var(--mv-green) 40%, color-mix(in srgb, var(--mv-ink) 12%, var(--mv-surface)))',
        borderRadius: 2,
      }} />
      {recent.map((ev, i) => (
        <div key={ev.id || i} style={{ position: 'relative', marginBottom: i < recent.length - 1 ? 13 : 0 }}>
          {/* Dot */}
          <div style={{
            position: 'absolute', left: -22, top: 2,
            width: 12, height: 12, borderRadius: '50%',
            background: i === 0 ? 'var(--mv-purple)' : i === 1 ? 'var(--mv-green)' : 'color-mix(in srgb, var(--mv-ink) 12%, var(--mv-surface))',
            border: '2px solid var(--mv-surface)',
            boxShadow: i === 0 ? '0 0 0 2.5px var(--mv-purple-200)' : i === 1 ? '0 0 0 2px var(--mv-purple-100)' : 'none',
          }} />
          <div style={{ fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'var(--mv-ink)' : 'var(--mv-ink-62)', lineHeight: 1.3 }}>
            {ev.description || ev.status?.replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--mv-ink-45)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {timeAgo(ev.event_at)}{ev.location ? ` · ${ev.location}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tidy a plain-text body for display (used only when no HTML body exists):
// drop leftover [cid:...] image placeholders and collapse blank-line runs.
function stripCidTokens(body) {
  return (body || '')
    .replace(/\r\n/g, '\n')
    .replace(/\[cid:[^\]]+\]/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Keep only the NEW message text — cut at the first quoted-history marker
// (">" lines, "On <date> … wrote:", Outlook "From:/Sent:/To:" header blocks,
// or divider lines). Never returns blank; falls back to the full body.
function trimQuotedText(body) {
  const lines = (body || '').replace(/\r\n/g, '\n').split('\n');
  const isQuoteStart = (raw, i) => {
    const t = raw.trim();
    if (/^>{1,}/.test(t)) return true;
    if (/^On\b.+\bwrote:$/.test(t)) return true;
    if (/^_{10,}$/.test(t)) return true;
    if (/^-{2,}\s*(Original|Forwarded) Message\s*-{2,}/i.test(t)) return true;
    if (/^From:\s?\S/i.test(t)) {
      const ahead = lines.slice(i + 1, i + 6).map(l => l.trim());
      if (ahead.some(l => /^(Sent|Date|To|Cc|Subject):/i.test(l))) return true;
    }
    return false;
  };
  let cut = -1;
  for (let i = 1; i < lines.length; i++) { if (isQuoteStart(lines[i], i)) { cut = i; break; } }
  if (cut < 1) return (body || '').trim();
  const main = lines.slice(0, cut).join('\n').trim();
  return main || (body || '').trim();
}

// Keep only the NEW message of an HTML email — remove Gmail/Apple/Outlook
// quoted-reply containers and any trailing "From: …" header block. Runs in the
// browser via DOMParser; never returns blank.
function trimQuotedHtml(html) {
  try {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const body = doc.body;
    if (!body) return html;
    body.querySelectorAll(
      '.gmail_quote, .gmail_quote_container, blockquote[type="cite"], ' +
      '#divRplyFwdMsg, #appendonsend, #x_appendonsend, #mail-editor-reference-message-container'
    ).forEach(n => n.remove());
    // Outlook desktop wraps the reply in a divider div (border-top). Remove it
    // and everything after it.
    for (const div of body.querySelectorAll('div')) {
      const s = (div.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase();
      if (s.includes('border-top:solid') || s.includes('border-top:1pt') || s.includes('border-top:1px')) {
        let n = div; while (n) { const next = n.nextSibling; n.remove(); n = next; }
        break;
      }
    }
    // Fallback: a block whose text is a quoted "From: … Sent: …" header.
    for (const el of body.querySelectorAll('div, p, table')) {
      const t = (el.textContent || '').trim();
      if (/^From:\s/i.test(t) && /(Sent|Date|To|Subject):/i.test(t)) {
        let n = el; while (n) { const next = n.nextSibling; n.remove(); n = next; }
        break;
      }
    }
    const out = body.innerHTML.trim();
    return out || html;
  } catch { return html; }
}

// Renders an email's HTML body inside a Shadow DOM. The host element grows to
// its content naturally (no height is ever measured, so it cannot clip), while
// the shadow root isolates the email's CSS from the rest of the app. Scripts
// inserted via innerHTML never execute; we also strip inline event handlers and
// javascript: URLs as a safety net.
function EmailHtml({ html }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const safe = trimQuotedHtml(html || '')
      .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*script[^>]*>/gi, '')
      .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
      .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
    root.innerHTML =
      `<style>:host{display:block}` +
      `img{max-width:100%!important;height:auto}table{max-width:100%!important}` +
      `a{color:var(--mv-teal)}*{word-break:break-word;overflow-wrap:break-word}</style>` +
      `<div style="font:13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--mv-ink-78)">${safe}</div>`;
  }, [html]);
  return <div ref={hostRef} />;
}

// ── Thread item ───────────────────────────────────────────────────────────────
function ThreadItem({ email, queryId, courierName, courierCode, onApproved }) {
  const [editMode,   setEditMode]   = useState(false);
  const [editBody,   setEditBody]   = useState(email.body_text || '');
  const [approving,  setApproving]  = useState(false);
  const [reviseMode, setReviseMode] = useState(false);
  const [reviseText, setReviseText] = useState('');
  const [revising,   setRevising]   = useState(false);
  const reviseRef = useRef('');
  const qc = useQueryClient();

  const speech = useSpeechInput(v => {
    if (typeof v === 'function') {
      setReviseText(p => { const n = v(p); reviseRef.current = n; return n; });
    } else { reviseRef.current = v; setReviseText(v); }
  });

  const dir       = email.direction;
  const isDraft   = email.is_ai_draft && !email.sent_at && !email.ai_draft_approved_by;
  const isCourier = dir === 'inbound_courier' || dir === 'outbound_courier';
  const isNote    = dir === 'note';
  const isOut     = dir === 'outbound_customer' || dir === 'outbound_courier';

  const logoUrl = isCourier && courierCode ? getCourierLogo(courierCode) : null;

  // Card background + accent per direction
  const cardBg = isNote             ? 'color-mix(in srgb, var(--mv-amber) 5%, transparent)'
    : dir === 'inbound_customer'     ? 'var(--mv-surface)'
    : dir === 'outbound_customer'    ? 'color-mix(in srgb, var(--mv-teal) 3%, transparent)'
    : dir === 'inbound_courier'      ? 'color-mix(in srgb, var(--mv-amber) 6%, transparent)'
    :                                  'color-mix(in srgb, var(--mv-amber) 3%, transparent)';

  const cardBorderLeft = isNote             ? '3px solid color-mix(in srgb, var(--mv-amber) 45%, transparent)'
    : dir === 'inbound_customer'             ? '3px solid color-mix(in srgb, var(--mv-teal) 35%, transparent)'
    : dir === 'inbound_courier'              ? '3px solid color-mix(in srgb, var(--mv-amber) 50%, transparent)'
    :                                          'none';

  // Avatar colour
  const avBg = isNote    ? 'var(--mv-amber-100)'
    : isOut              ? 'var(--mv-purple-100)'
    : isCourier          ? 'var(--mv-amber-100)'
    :                      'var(--mv-teal-100)';
  const avColor = isNote ? C.amber
    : isOut              ? 'var(--mv-purple)'
    : isCourier          ? C.amber
    :                      C.blue;
  const avInitial = isNote ? '—'
    : isOut              ? 'Y'
    : isCourier          ? (courierName?.[0]?.toUpperCase() || 'C')
    : (email.from_address?.[0]?.toUpperCase() || '?');

  const senderLabel = isNote             ? 'Internal note'
    : dir === 'inbound_customer'         ? (email.from_address || 'Customer')
    : dir === 'outbound_customer'        ? 'You → Customer'
    : dir === 'inbound_courier'          ? (courierName || 'Courier')
    :                                      `You → ${courierName || 'Courier'}`;

  // Full stored body; splitMessage() separates the new content from quoted history.
  const displayBody = (email.body_text || '').trim();

  const ts = email.sent_at || email.received_at || email.created_at;

  async function doApprove(body) {
    setApproving(true);
    try {
      await api.patch(`/queries/${queryId}/emails/${email.id}/approve`, {
        body_text: body ?? email.body_text,
      });
      qc.invalidateQueries(['ticket', queryId]);
      onApproved?.();
    } catch (e) { alert('Approval failed: ' + (e.response?.data?.error || e.message)); }
    finally { setApproving(false); }
  }

  async function discardDraft() {
    if (!window.confirm('Discard this AI draft? You can then type a manual reply.')) return;
    try {
      await api.delete(`/queries/${queryId}/emails/${email.id}`);
      qc.invalidateQueries(['ticket', queryId]);
    } catch (e) { alert('Discard failed: ' + (e.response?.data?.error || e.message)); }
  }

  async function submitRevision() {
    const fb = reviseRef.current.trim();
    if (!fb || revising) return;
    setRevising(true);
    try {
      const r = await fetch(`/api/queries/${queryId}/refine-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_id: email.id, prompt: fb }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Server error'); }
      setReviseMode(false); reviseRef.current = ''; setReviseText('');
      qc.invalidateQueries(['ticket', queryId]);
    } catch (e) { alert('Revision failed: ' + e.message); }
    finally { setRevising(false); }
  }

  // Prefer the rendered HTML body; fall back to plain text when absent.
  // Either way, show only the new message — strip the quoted reply history.
  const plainFallback = stripCidTokens(trimQuotedText(displayBody));
  const isInbound = dir.startsWith('inbound');
  const stepBadge = isNote
    ? { label: 'Note',     style: { background: 'var(--mv-amber-100)', color: 'var(--mv-amber-deep)' } }
    : isInbound
      ? { label: 'Inbound',  style: { background: 'var(--mv-teal-100)', color: 'var(--mv-teal)' } }
      : { label: 'Outbound', style: { background: 'var(--mv-bg)', color: 'var(--mv-ink-62)' } };
  const rowClass = (!isInbound && !isNote)
    ? 'my-4 rounded-2xl border px-6 py-8'
    : 'border-b py-10 last:border-b-0';
  const rowStyle = { borderColor: 'var(--mv-hairline)', ...((!isInbound && !isNote) ? { background: 'var(--mv-bg)' } : {}) };

  // The server returns `body` already parsed down to just the new message.
  // Fall back to client-side trimming for older payloads.
  const bodyText = (email.body && email.body.trim()) ? email.body.trim() : plainFallback;

  const dirBadge = isNote ? { label: 'Note', bg: 'var(--mv-amber-100)', color: 'var(--mv-amber-deep)', border: 'var(--mv-amber-200)' }
    : dir === 'inbound_customer'  ? { label: 'Inbound', bg: 'var(--mv-teal-100)', color: 'var(--mv-teal)', border: 'var(--mv-teal-200)' }
    : dir === 'outbound_customer' ? { label: 'Sent', bg: 'var(--mv-purple-100)', color: 'var(--mv-green-deep)', border: 'var(--mv-purple-200)' }
    : dir === 'inbound_courier'   ? { label: 'Courier', bg: 'var(--mv-amber-100)', color: 'var(--mv-amber-deep)', border: 'var(--mv-amber-200)' }
    :                               { label: 'To courier', bg: 'var(--mv-purple-100)', color: 'var(--mv-green-deep)', border: 'var(--mv-purple-200)' };

  return (
    <article className={`w-full max-w-none ${rowClass}`} style={rowStyle}>

      {/* Minimalist header */}
      <header className="mb-5 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ background: logoUrl ? 'var(--mv-surface)' : avBg, border: logoUrl ? `1px solid ${C.border}` : 'none' }}
        >
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: '100%', objectFit: 'contain', padding: 4 }} />
            : <span className="text-sm font-semibold" style={{ color: avColor }}>{avInitial}</span>
          }
        </div>
        {/* Sender info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold" style={{ color: 'var(--mv-ink)' }}>{senderLabel}</span>
            {isDraft && (
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--mv-purple-100)', color: 'var(--mv-green-deep)' }}>AI draft</span>
            )}
          </div>
          {email.from_address && !isOut && (
            <p className="truncate text-xs" style={{ color: 'var(--mv-ink-45)' }}>{email.from_address}</p>
          )}
        </div>
        {/* Direction badge + timestamp */}
        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" style={stepBadge.style}>
          {stepBadge.label}
        </span>
        <time className="shrink-0 text-xs" style={{ color: 'var(--mv-ink-45)' }}>{fmtDate(ts)}</time>
      </header>

      {/* Body — full width, no fixed height, no inner scroll */}
      <div className="w-full max-w-none">
        {editMode ? (
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            style={{
              width: '100%', minHeight: 120, background: 'var(--mv-bg)',
              border: '1px solid var(--mv-hairline)', borderRadius: 8,
              color: 'var(--mv-ink-78)', fontSize: 13, padding: 10, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', lineHeight: 1.65,
            }}
          />
        ) : email.html_body ? (
          <div className="prose prose-slate max-w-none">
            <EmailHtml html={email.html_body} />
          </div>
        ) : (
          <pre className="m-0 h-auto w-full max-w-none whitespace-pre-wrap break-words font-sans text-base leading-relaxed" style={{ color: 'var(--mv-ink)' }}>
            {bodyText || <span className="italic" style={{ color: 'var(--mv-ink-45)' }}>No content</span>}
          </pre>
        )}

        {/* AI draft actions */}
        {isDraft && (
          <div style={{ marginTop: 14 }}>
            {reviseMode ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={reviseText}
                  onChange={e => { reviseRef.current = e.target.value; setReviseText(e.target.value); }}
                  autoFocus rows={2}
                  placeholder="What would you like to change or teach the AI? (e.g., make it shorter, add specific instructions…)"
                  style={{
                    flex: 1, background: C.card, border: `0.5px solid ${C.border}`,
                    borderRadius: 8, padding: '8px 10px', fontSize: 12, color: C.text,
                    lineHeight: 1.55, resize: 'none', outline: 'none', fontFamily: 'inherit',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitRevision(); } }}
                />
                <button onClick={speech.toggle} style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `0.5px solid ${C.border}`,
                  background: speech.listening ? C.blue : C.card,
                  color: speech.listening ? 'var(--mv-on-brand)' : C.muted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
                  </svg>
                </button>
                <button onClick={submitRevision} disabled={revising || !reviseText.trim()} style={{
                  padding: '0 14px', height: 32, borderRadius: 8, border: 'none',
                  background: C.blue, color: 'var(--mv-on-brand)', fontSize: 12, fontWeight: 500,
                  cursor: (revising || !reviseText.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (revising || !reviseText.trim()) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {revising ? <RefreshCw size={11} /> : <Send size={11} />}
                  {revising ? 'Rewriting…' : 'Rewrite'}
                </button>
                <button onClick={() => setReviseMode(false)} style={{
                  padding: '0 12px', height: 32, borderRadius: 8,
                  border: `0.5px solid ${C.border}`, background: 'transparent',
                  color: C.muted, fontSize: 12, cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            ) : editMode ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { doApprove(editBody); setEditMode(false); }} disabled={approving} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: C.green, color: 'var(--mv-on-brand)', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <CheckCircle2 size={11} /> {approving ? 'Saving…' : 'Approve & send'}
                </button>
                <button onClick={() => { setEditMode(false); setEditBody(email.body_text || ''); }} style={{
                  padding: '6px 12px', borderRadius: 8, border: `0.5px solid ${C.border}`,
                  background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => doApprove()} disabled={approving} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: C.green, color: 'var(--mv-on-brand)', fontSize: 12, fontWeight: 500,
                  opacity: approving ? 0.6 : 1, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <CheckCircle2 size={11} /> {approving ? 'Sending…' : 'Approve & send'}
                </button>
                <button onClick={() => setReviseMode(true)} style={{
                  padding: '6px 12px', borderRadius: 8, border: `0.5px solid ${C.border}`,
                  background: 'transparent', color: C.sub, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Sparkles size={11} /> Refine
                </button>
                <button onClick={() => setEditMode(true)} style={{
                  padding: '6px 12px', borderRadius: 8, border: `0.5px solid ${C.border}`,
                  background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Edit2 size={11} /> Edit
                </button>
                <button onClick={discardDraft} style={{
                  padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--mv-magenta-200)',
                  background: 'transparent', color: 'var(--mv-magenta)', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto',
                }}>
                  🗑️ Discard Draft
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Compose bar ───────────────────────────────────────────────────────────────
function ComposeBar({ queryId, courierName, onSent }) {
  const [active,     setActive]  = useState(null);
  const [text,       setText]    = useState('');
  const [sending,    setSending] = useState(false);
  const [generating, setGen]     = useState(false);
  const [drafted,    setDrafted] = useState(false);
  const qc = useQueryClient();

  const tabs = [
    { key: 'customer', label: 'Reply to customer',            icon: Mail,          dir: 'outbound_customer' },
    { key: 'courier',  label: `Chase ${courierName || 'courier'}`, icon: Truck,    dir: 'outbound_courier'  },
    { key: 'note',     label: 'Internal note',                icon: MessageSquare, dir: 'note'              },
  ];
  const activeCfg = tabs.find(t => t.key === active);

  function switchTab(key) { setActive(a => a === key ? null : key); setText(''); setDrafted(false); }

  async function generateDraft() {
    if (!active || active === 'note') return;
    setGen(true);
    try {
      const r = await fetch(`/api/queries/${queryId}/generate-draft`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: active }),
      });
      if (!r.ok) throw new Error(await r.text());
      setDrafted(true); qc.invalidateQueries(['ticket', queryId]);
    } catch (e) { alert('Failed: ' + e.message); }
    finally { setGen(false); }
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/queries/${queryId}/emails`, {
        direction: activeCfg.dir,
        body_text: text.trim(),
        from_address: activeCfg.dir === 'note' ? 'internal' : 'service@moovparcel.co.uk',
      });
      setText(''); setDrafted(false);
      qc.invalidateQueries(['ticket', queryId]);
      onSent?.();
    } catch (e) { alert('Send failed: ' + (e.response?.data?.error || e.message)); }
    finally { setSending(false); }
  }

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid var(--mv-divider)', background: 'var(--mv-surface)' }}>
      {/* Premium tab bar */}
      <div style={{ display: 'flex', padding: '10px 16px 0', gap: 2, borderBottom: '1px solid var(--mv-hairline)', background: 'var(--mv-surface)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)} style={{
            padding: '6px 12px',
            border: active === t.key ? '1px solid var(--mv-hairline)' : 'none',
            borderBottom: active === t.key ? '2px solid var(--mv-ink)' : '2px solid transparent',
            borderRadius: 0,
            background: 'transparent',
            color: active === t.key ? 'var(--mv-ink)' : 'var(--mv-ink-45)',
            fontSize: 12.5, fontWeight: active === t.key ? 700 : 500,
            cursor: 'pointer', marginBottom: 0,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.1s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { if (active !== t.key) e.currentTarget.style.color = 'var(--mv-ink-52)'; }}
            onMouseLeave={e => { if (active !== t.key) e.currentTarget.style.color = 'var(--mv-ink-45)'; }}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Compose area */}
      {active && (
        <div style={{ padding: '14px 20px' }}>
          {drafted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10,
              padding: '7px 10px', borderRadius: 8, background: C.greenDim,
              fontSize: 12, color: C.green, fontWeight: 500,
            }}>
              <CheckCircle2 size={12} />
              AI draft generated — scroll up to review and approve
            </div>
          )}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              active === 'customer' ? 'Write a reply…'
              : active === 'courier' ? `Message to ${courierName || 'courier'}…`
              : 'Internal note — visible to your team only…'
            }
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.card, border: `0.5px solid ${C.border}`,
              borderRadius: 8, padding: '10px 12px', color: C.text,
              fontSize: 13, lineHeight: 1.65, resize: 'none', outline: 'none',
              fontFamily: 'inherit', display: 'block',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) send(); }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {active !== 'note' && (
                <button onClick={generateDraft} disabled={generating} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                  borderRadius: 6, border: '1px solid var(--mv-hairline)', background: 'var(--mv-surface)',
                  color: generating ? 'var(--mv-ink-45)' : 'var(--mv-purple)', fontSize: 12,
                  cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                  <Sparkles size={12} />
                  {generating ? 'Generating…' : drafted ? 'Regenerate' : 'AI draft'}
                </button>
              )}
              <button style={{
                padding: '5px 11px', borderRadius: 6,
                border: '1px solid var(--mv-hairline)', background: 'var(--mv-surface)',
                color: 'var(--mv-ink-52)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Template
              </button>
            </div>
            <button onClick={send} disabled={sending || !text.trim()} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px',
              borderRadius: 7, border: 'none',
              background: text.trim() ? 'var(--mv-ink)' : 'color-mix(in srgb, var(--mv-ink) 22%, var(--mv-surface))',
              color: 'var(--mv-on-brand)', fontSize: 12, fontWeight: 600,
              cursor: sending || !text.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              <Send size={12} />
              {sending ? 'Sending…' : active === 'note' ? 'Save note' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const messagesRef = useRef(null);
  const [convTab, setConvTab] = useState('customer');  // 'customer' | 'courier'

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn:  () => api.get(`/queries/${id}`).then(r => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn:  () => api.get('/staff').then(r => r.data),
    staleTime: 300_000,
  });

  const consignment = ticket?.consignment_number;
  const { data: trackingData } = useQuery({
    queryKey: ['ticket-tracking', consignment],
    queryFn:  () => api.get(`/tracking/${encodeURIComponent(consignment)}`).then(r => r.data),
    enabled:  !!consignment,
    staleTime: 60_000,
  });

  const patch = useMutation({
    mutationFn: body => api.patch(`/queries/${id}`, body).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries(['ticket', id]),
  });

  // Mark emails read on open
  useEffect(() => {
    if (ticket?.id) api.post(`/queries/${ticket.id}/mark-read`).catch(() => {});
  }, [ticket?.id]);

  // Tick once a minute so the SLA countdown in the meta shelf stays live.
  const [, setSlaTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlaTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Newest reply sits at the TOP → open scrolled to the top so the latest message
  // is the first thing you see. Re-runs catch late-rendering HTML/images that
  // would otherwise nudge the scroll position.
  const emails = ticket?.emails || [];
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const toTop = () => el.scrollTo({ top: 0, behavior: 'auto' });
    toTop();
    const t1 = setTimeout(toTop, 300);
    const t2 = setTimeout(toTop, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [emails.length]);

  // ── Loading / error states ─────────────────────────────────────────────────

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: C.muted, gap: 10 }}>
      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
      Loading…
    </div>
  );

  if (error || !ticket) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <AlertTriangle size={24} color={C.red} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.red, marginBottom: 14 }}>Ticket not found</div>
      <button onClick={() => navigate('/queries')} style={{
        background: 'none', border: `0.5px solid ${C.border}`, borderRadius: 8,
        color: C.muted, padding: '7px 14px', cursor: 'pointer', fontSize: 13,
      }}>
        ← Back to queries
      </button>
    </div>
  );

  // ── Derived values ─────────────────────────────────────────────────────────

  const status      = STATUS_CFG[ticket.status] || { label: ticket.status, color: C.muted, bg: 'transparent' };
  const slaText     = slaCountdownString(ticket);
  const courierLogo = ticket.courier_code ? getCourierLogo(ticket.courier_code) : null;
  const trackEvents = trackingData?.events || trackingData?.parcel?.events || [];
  const parcel      = trackingData?.parcel || null;

  // Newest → oldest so the latest reply is at the top of the thread.
  const allEmails = [...emails].sort((a, b) =>
    new Date(b.sent_at || b.received_at || b.created_at) -
    new Date(a.sent_at || a.received_at || a.created_at)
  );

  // Split timeline — customers never see courier correspondence and vice versa.
  const isCourierDir = e => String(e.direction || '').includes('courier');
  const customerEmails = allEmails.filter(e => !isCourierDir(e));
  const courierEmails  = allEmails.filter(e => isCourierDir(e));
  // Courier lane only shows when a courier is genuinely involved — a courier is
  // assigned OR courier correspondence already exists. Billing/Technical and pure
  // account matters (e.g. "on stop") render as a clean internal CRM view with no
  // courier track, even if mis-grouped.
  const courierInvolved = Boolean(ticket?.courier_code) || courierEmails.length > 0;
  const showCourierTab = !['Billing', 'Technical'].includes(ticket?.group_name) && courierInvolved;
  const effectiveTab   = showCourierTab ? convTab : 'customer';
  const visibleEmails  = effectiveTab === 'courier' ? courierEmails : customerEmails;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0 }}>

        {/* ── Unified Command Banner ──────────────────────────────────────── */}
        <div className="flex w-full items-center justify-between border-b p-6" style={{ borderColor: 'var(--mv-divider)', background: 'var(--mv-surface)' }}>
          {/* Left — back + identity */}
          <div className="flex min-w-0 items-center">
            <button
              onClick={() => navigate('/queries')}
              className="mr-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-colors"
              style={{ borderColor: 'var(--mv-hairline)', background: 'var(--mv-bg)', color: 'var(--mv-ink-52)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--mv-ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--mv-ink-52)'; }}
            >
              ❮ Back to Queue
            </button>
            <span
              className={`mr-3 inline-flex shrink-0 items-center rounded-md border px-3 py-1 text-sm font-bold tracking-wide ${ticketBadgeStyle(ticket).cls}`}
              style={ticketBadgeStyle(ticket).style}
            >
              Moov-{ticket.ticket_number}
            </span>
            <span className="truncate text-xl font-black tracking-tight" style={{ color: 'var(--mv-ink)' }}>
              {ticket.customer_name || ticket.subject || 'Ticket'}
            </span>
          </div>

          {/* Right — resolution control */}
          <button
            onClick={() => patch.mutate({ status: 'resolved' })}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
            style={{ background: 'var(--mv-green)', color: 'var(--mv-on-brand)', boxShadow: '0 1px 2px 0 color-mix(in srgb, var(--mv-green) 30%, transparent)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--mv-green-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--mv-green)'; }}
          >
            ✓ Mark as Resolved
          </button>
        </div>

        {/* ── Streamlined Meta Control Shelf ──────────────────────────────── */}
        <div className="flex items-center gap-6 border-b px-6 py-3.5 text-sm font-medium" style={{ borderColor: 'var(--mv-divider)', background: 'var(--mv-bg)', color: 'var(--mv-ink-62)' }}>
          {/* Assigned To */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--mv-ink-45)' }}>Assigned</span>
            <InlineSelect
              value={ticket.assigned_to || ''}
              onChange={v => patch.mutate({ assigned_to: v || null })}
              options={[
                { value: '', label: '— Unassigned —' },
                ...staffList.map(s => ({ value: s.id, label: s.full_name || s.name })),
              ]}
            />
          </div>

          {/* Group */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--mv-ink-45)' }}>Group</span>
            <InlineSelect
              value={ticket.group_name || ''}
              onChange={v => patch.mutate({ group_name: v || null })}
              options={[{ value: '', label: '— None —' }, ...GROUPS.map(g => ({ value: g, label: g }))]}
            />
          </div>

          {/* Priority — high-visibility colour-coded badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--mv-ink-45)' }}>Priority</span>
            <span
              className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${ticketBadgeStyle(ticket).cls}`}
              style={ticketBadgeStyle(ticket).style}
            >
              {(PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium).label}
            </span>
          </div>

          {/* SLA Target — live countdown, eye-catching highlight box */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--mv-ink-45)' }}>SLA Target</span>
            {slaText ? (
              <span
                className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-bold tabular-nums ${ticket.courier_sla_breached ? 'animate-pulse' : ''}`}
                style={ticket.courier_sla_breached
                  ? { borderColor: 'var(--mv-magenta-200)', background: 'var(--mv-magenta-100)', color: 'var(--mv-magenta-deep)' }
                  : { borderColor: 'var(--mv-purple-200)', background: 'var(--mv-purple-100)', color: 'var(--mv-green-deep)' }}
              >
                {slaText}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: 'var(--mv-hairline)', background: 'var(--mv-surface)', color: 'var(--mv-ink-45)' }}>
                No SLA set
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: parallel dual-track conversation + compose ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden', background: 'var(--mv-bg)' }}>

          {/* Two lanes, side by side: Customer Face (Track A) + Courier Face (Track B).
              Billing/Technical tickets hide the courier lane for a clean CRM view. */}
          <div className={`grid min-h-0 flex-1 gap-0 overflow-hidden ${showCourierTab ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

            {/* Track A — Customer Face */}
            <div className="flex min-h-0 flex-col border-r" style={{ borderColor: 'var(--mv-divider)', background: 'var(--mv-surface)' }}>
              <div className="flex shrink-0 items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--mv-hairline)' }}>
                <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--mv-teal)' }}>👤 Customer comms</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'var(--mv-teal-100)', color: 'var(--mv-teal)' }}>{customerEmails.length}</span>
              </div>
              <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto p-6">
                {customerEmails.length === 0 ? (
                  <div className="py-12 text-center text-sm" style={{ color: 'var(--mv-ink-45)' }}>No customer messages yet</div>
                ) : customerEmails.map(email => (
                  <ThreadItem
                    key={email.id} email={email} queryId={id}
                    courierName={ticket.courier_name} courierCode={ticket.courier_code}
                    onApproved={() => qc.invalidateQueries(['ticket', id])}
                  />
                ))}
              </div>
            </div>

            {/* Track B — Courier Face */}
            {showCourierTab && (
              <div className="flex min-h-0 flex-col" style={{ background: 'var(--mv-surface)' }}>
                <div className="flex shrink-0 items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--mv-hairline)' }}>
                  <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--mv-amber-deep)' }}>
                    🚚 Courier comms{ticket.courier_name ? ` · ${ticket.courier_name}` : ''}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'var(--mv-amber-100)', color: 'var(--mv-amber-deep)' }}>{courierEmails.length}</span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                  {courierEmails.length === 0 ? (
                    <div className="py-12 text-center text-sm" style={{ color: 'var(--mv-ink-45)' }}>No courier correspondence yet</div>
                  ) : courierEmails.map(email => (
                    <ThreadItem
                      key={email.id} email={email} queryId={id}
                      courierName={ticket.courier_name} courierCode={ticket.courier_code}
                      onApproved={() => qc.invalidateQueries(['ticket', id])}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compose */}
          <ComposeBar
            queryId={id}
            courierName={ticket.courier_name}
            onSent={() => qc.invalidateQueries(['ticket', id])}
          />
        </div>

        {/* ── Right sidebar ── */}
        <div style={{
          width: 264, flexShrink: 0, background: 'var(--mv-surface)',
          borderLeft: '1px solid var(--mv-divider)',
          overflowY: 'auto', padding: 0,
        }}>

          {/* SLA + Assignment now live in the top header — sidebar is parcel/customer/claim only. */}

          {/* 1. Parcel — always shown */}
          <SbSection title="Parcel" action={
            consignment ? (
              <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(consignment)}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                  color: 'var(--mv-purple)', background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)',
                  borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}>
                <ExternalLink size={10} /> Track
              </button>
            ) : null
          }>
            {consignment ? (
              <>
                {/* Carrier + parcel status */}
                {(courierLogo || ticket.courier_name) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {courierLogo && (
                      <div style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--mv-hairline)',
                        background: 'var(--mv-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0 }}>
                        <img src={courierLogo} alt="" style={{ width: '100%', objectFit: 'contain', padding: 3 }} />
                      </div>
                    )}
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mv-ink)' }}>{ticket.courier_name}</span>
                    {parcel?.status && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                        color: parcel.status === 'delivered' ? 'var(--mv-green-deep)' : 'var(--mv-amber-deep)',
                        background: parcel.status === 'delivered' ? 'var(--mv-purple-100)' : 'var(--mv-amber-100)',
                        padding: '2px 8px', borderRadius: 20, border: '1px solid transparent', flexShrink: 0 }}>
                        {parcel.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                )}
                {/* Consignment chip */}
                <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--mv-ink)',
                  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline)', borderRadius: 8,
                  padding: '8px 12px', marginBottom: 10, letterSpacing: '0.03em',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{consignment}</span>
                  <span style={{ fontSize: 10, color: 'var(--mv-ink-45)', fontWeight: 400, cursor: 'pointer' }}
                    onClick={() => navigator.clipboard?.writeText(consignment)}
                    title="Copy to clipboard">copy</span>
                </div>
                {ticket.service_name && (
                  <SbRow label="Service">
                    <span style={{ fontSize: 12, color: C.sub }}>{ticket.service_name}</span>
                  </SbRow>
                )}
                {parcel?.recipient_postcode && (
                  <SbRow label="Postcode">
                    <span style={{ fontSize: 12, color: C.sub }}>{parcel.recipient_postcode}</span>
                  </SbRow>
                )}
                {parcel?.delivered_at && (
                  <SbRow label="Delivered">
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mv-green-deep)' }}>
                      {new Date(parcel.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </SbRow>
                )}
                {/* Tracking timeline — appears automatically when events exist */}
                {trackEvents.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--mv-hairline)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--mv-ink-45)', marginBottom: 12 }}>
                      {trackEvents.length} event{trackEvents.length !== 1 ? 's' : ''}
                    </p>
                    <TrackingTimeline events={trackEvents} />
                  </div>
                )}
                {trackEvents.length === 0 && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--mv-bg)',
                    borderRadius: 7, border: '1px solid var(--mv-hairline)', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--mv-ink-45)', margin: 0 }}>No tracking events yet</p>
                  </div>
                )}
              </>
            ) : (
              /* No consignment linked */
              <div style={{ padding: '16px 12px', background: 'var(--mv-bg)', borderRadius: 10,
                border: '1px dashed var(--mv-hairline)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--mv-ink-45)', margin: '0 0 3px' }}>No parcel linked</p>
                <p style={{ fontSize: 11, color: 'var(--mv-ink-45)', margin: 0 }}>No consignment number on this ticket</p>
              </div>
            )}
          </SbSection>

          {/* 2. Customer */}
          {(ticket.customer_name || ticket.sender_email) && (
            <SbSection title="Customer">
              {/* Avatar + name card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                padding: '10px 12px', background: 'var(--mv-bg)', borderRadius: 10, border: '1px solid var(--mv-hairline)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mv-teal-100)',
                  border: '2px solid var(--mv-teal-200)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: 'var(--mv-teal)', flexShrink: 0, letterSpacing: '-0.02em' }}>
                  {(ticket.customer_name || ticket.sender_email || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.customer_name || ticket.sender_email}
                  </p>
                  {ticket.customer_name && ticket.sender_email && (
                    <p style={{ fontSize: 11, color: 'var(--mv-ink-45)', margin: '2px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.sender_email}
                    </p>
                  )}
                </div>
              </div>
              {ticket.customer_id && (
                <button onClick={() => navigate(`/customers/${ticket.customer_id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 5, padding: '7px 0', borderRadius: 8, border: '1px solid var(--mv-purple-200)',
                    background: 'var(--mv-purple-100)', color: 'var(--mv-purple)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer' }}>
                  View account →
                </button>
              )}
            </SbSection>
          )}

          {/* 3. Claim — only shown when this is a Claims ticket */}
          {(ticket.group_name === 'Claims' || ticket.claim_number || ticket.claim_amount) && (
          <SbSection title="Claim">
            {/* Alert when no formal claim yet */}
            {!ticket.claim_number && (
              <div style={{ background: 'var(--mv-amber-100)', border: '1px solid var(--mv-amber-200)', borderRadius: 10,
                padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 14 14">
                    <path d="M7 2v4.5M7 9.5v.5" style={{ stroke: 'var(--mv-amber-deep)' }} strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="7" cy="7" r="6" style={{ stroke: 'var(--mv-amber-deep)' }} strokeWidth="1.4"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: 'var(--mv-amber-deep)' }}>No claim raised yet</span>
                </div>
                {ticket.claim_amount && (
                  <p style={{ fontSize: 11.5, color: 'var(--mv-amber-deep)', margin: 0, lineHeight: 1.5 }}>
                    Indicated value: <strong>£{Number(ticket.claim_amount).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}
            {ticket.claim_number && <SbRow label="Claim no.">
              <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{ticket.claim_number}</span>
            </SbRow>}
            <SbRow label="Amount">
              <span style={{ fontSize: 12, color: ticket.claim_amount ? 'var(--mv-ink)' : C.muted, fontWeight: ticket.claim_amount ? 700 : 400 }}>
                {ticket.claim_amount ? `£${Number(ticket.claim_amount).toFixed(2)}` : '—'}
              </span>
            </SbRow>
            <SbRow label="Evidence">
              {(ticket.evidence_count > 0) ? (
                <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>
                  {ticket.evidence_count} {ticket.evidence_count === 1 ? 'file' : 'files'}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: C.muted }}>None yet</span>
              )}
            </SbRow>
            {!ticket.claim_number && (
              <button style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 9,
                fontSize: 12.5, fontWeight: 700, color: 'var(--mv-amber-deep)', background: 'var(--mv-amber-100)',
                border: '1.5px solid var(--mv-amber-200)', cursor: 'pointer' }}>
                + Raise Formal Claim
              </button>
            )}
          </SbSection>
          )}

          {/* Assignment moved to the top command bar; tracking lives in the Parcel section. */}

        </div>
      </div>
    </div>
  );
}
