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
const C = {
  bg:       'var(--mv-bg)',
  surface:  'var(--mv-surface)',
  card:     'var(--mv-surface)',
  border:   'var(--mv-hairline-2)',
  green:    '#00C853',
  amber:    '#D97706',
  red:      '#E91E8C',
  blue:     '#7B2FBE',
  text:     'var(--mv-ink)',
  sub:      'var(--mv-ink-62)',
  muted:    'var(--mv-ink-52)',
  greenDim: 'rgba(0,200,83,0.1)',
  amberDim: 'rgba(217,119,6,0.1)',
  redDim:   'rgba(233,30,140,0.1)',
  blueDim:  'rgba(123,47,190,0.1)',
};

// ── Status / priority config ──────────────────────────────────────────────────
const STATUS_CFG = {
  open:                    { label: 'Open',              kind: 'flight' },
  awaiting_customer_info:  { label: 'Awaiting Customer', kind: 'waiting' },
  info_received:           { label: 'Info Received',     kind: 'settled' },
  drafting:                { label: 'Drafting',          kind: 'flight' },
  awaiting_courier:        { label: 'Awaiting Courier',  kind: 'waiting' },
  courier_replied:         { label: 'Courier Replied',   kind: 'settled' },
  courier_investigating:   { label: 'Investigating',     kind: 'flight' },
  awaiting_customer:       { label: 'Awaiting Customer', kind: 'waiting' },
  claim_raised:            { label: 'Claim Raised',      kind: 'attention' },
  awaiting_claim_docs:     { label: 'Awaiting Docs',     kind: 'attention' },
  claim_submitted:         { label: 'Claim Submitted',   kind: 'waiting' },
  resolved:                { label: 'Resolved',          kind: 'settled' },
  resolved_claim_approved: { label: 'Claim Approved',    kind: 'settled' },
  resolved_claim_rejected: { label: 'Claim Rejected',    kind: 'attention' },
  escalated:               { label: 'Escalated',         kind: 'attention' },
};

const PRIORITY_CFG = {
  urgent: { label: 'Urgent', color: '#E91E8C' },
  high:   { label: 'High',   color: '#D97706' },
  medium: { label: 'Medium', color: '#7B2FBE' },
  low:    { label: 'Low',    color: 'var(--mv-ink-52)' },
};

const GROUPS = ['Claims', 'Queries', 'Billing', 'Technical'];

function ticketBadgeClasses(ticket) {
  const p = (ticket?.priority || '').toLowerCase();
  if (p === 'urgent') return 'border-[var(--mv-magenta)] bg-[rgba(233,30,140,0.1)] text-[var(--mv-magenta-deep)]';
  if (p === 'high')   return 'border-[#D97706] bg-[rgba(217,119,6,0.1)] text-[#D97706]';
  if (p === 'medium') return 'border-[var(--mv-purple)] bg-[rgba(123,47,190,0.1)] text-[var(--mv-purple)]';
  return 'border-[var(--mv-hairline-2)] bg-[var(--mv-bg)] text-[var(--mv-ink-52)]';
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
    <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', margin: 0 }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function SbRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '5px 0' }}>
      <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500, width: 90, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#1E293B', fontWeight: 500, flex: 1, textAlign: 'right', lineHeight: 1.4 }}>{children}</span>
    </div>
  );
}

// ── Inline select (for sidebar fields) ───────────────────────────────────────
function InlineSelect({ value, onChange, options, colorMap, fill = false }) {
  const color = colorMap?.[value]?.color || '#1E293B';
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', maxWidth: fill ? 'none' : 170, background: '#fff',
        border: '1px solid #E2E8F0', borderRadius: 6, outline: 'none',
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
        background: 'linear-gradient(to bottom, #6366F1, #10B981 40%, #E2E8F0)',
        borderRadius: 2,
      }} />
      {recent.map((ev, i) => (
        <div key={ev.id || i} style={{ position: 'relative', marginBottom: i < recent.length - 1 ? 13 : 0 }}>
          {/* Dot */}
          <div style={{
            position: 'absolute', left: -22, top: 2,
            width: 12, height: 12, borderRadius: '50%',
            background: i === 0 ? '#6366F1' : i === 1 ? '#10B981' : '#E2E8F0',
            border: `2px solid #fff`,
            boxShadow: i === 0 ? '0 0 0 2.5px #C7D2FE' : i === 1 ? '0 0 0 2px #D1FAE5' : 'none',
          }} />
          <div style={{ fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#0F172A' : '#475569', lineHeight: 1.3 }}>
            {ev.description || ev.status?.replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
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
      `a{color:#1d4ed8}*{word-break:break-word;overflow-wrap:break-word}</style>` +
      `<div style="font:13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155">${safe}</div>`;
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
  const cardBg = isNote             ? 'rgba(234,179,8,0.05)'
    : dir === 'inbound_customer'     ? '#FFFFFF'
    : dir === 'outbound_customer'    ? 'rgba(30,64,175,0.03)'
    : dir === 'inbound_courier'      ? 'rgba(217,119,6,0.06)'
    :                                  'rgba(217,119,6,0.03)';

  const cardBorderLeft = isNote             ? '3px solid rgba(234,179,8,0.45)'
    : dir === 'inbound_customer'             ? '3px solid rgba(30,64,175,0.35)'
    : dir === 'inbound_courier'              ? '3px solid rgba(217,119,6,0.50)'
    :                                          'none';

  // Avatar colour
  const avBg = isNote    ? '#FEF9C3'
    : isOut              ? '#EDE9FE'
    : isCourier          ? '#FEF3C7'
    :                      '#DBEAFE';
  const avColor = isNote ? C.amber
    : isOut              ? '#4F46E5'
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
    ? { label: 'Note',     cls: 'bg-amber-50 text-amber-700' }
    : isInbound
      ? { label: 'Inbound',  cls: 'bg-blue-50 text-blue-700' }
      : { label: 'Outbound', cls: 'bg-slate-100 text-slate-600' };
  const rowClass = (!isInbound && !isNote)
    ? 'my-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-6 py-8'
    : 'border-b border-slate-100 py-10 last:border-b-0';

  // The server returns `body` already parsed down to just the new message.
  // Fall back to client-side trimming for older payloads.
  const bodyText = (email.body && email.body.trim()) ? email.body.trim() : plainFallback;

  const dirBadge = isNote ? { label: 'Note', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' }
    : dir === 'inbound_customer'  ? { label: 'Inbound', bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' }
    : dir === 'outbound_customer' ? { label: 'Sent', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' }
    : dir === 'inbound_courier'   ? { label: 'Courier', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' }
    :                               { label: 'To courier', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' };

  return (
    <article className={`w-full max-w-none ${rowClass}`}>

      {/* Minimalist header */}
      <header className="mb-5 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ background: logoUrl ? '#fff' : avBg, border: logoUrl ? `1px solid ${C.border}` : 'none' }}
        >
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: '100%', objectFit: 'contain', padding: 4 }} />
            : <span className="text-sm font-semibold" style={{ color: avColor }}>{avInitial}</span>
          }
        </div>
        {/* Sender info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-800">{senderLabel}</span>
            {isDraft && (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">AI draft</span>
            )}
          </div>
          {email.from_address && !isOut && (
            <p className="truncate text-xs text-slate-400">{email.from_address}</p>
          )}
        </div>
        {/* Direction badge + timestamp */}
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${stepBadge.cls}`}>
          {stepBadge.label}
        </span>
        <time className="shrink-0 text-xs text-slate-400">{fmtDate(ts)}</time>
      </header>

      {/* Body — full width, no fixed height, no inner scroll */}
      <div className="w-full max-w-none">
        {editMode ? (
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            style={{
              width: '100%', minHeight: 120, background: '#FAFAFA',
              border: '1px solid #E2E8F0', borderRadius: 8,
              color: '#334155', fontSize: 13, padding: 10, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', lineHeight: 1.65,
            }}
          />
        ) : email.html_body ? (
          <div className="prose prose-slate max-w-none">
            <EmailHtml html={email.html_body} />
          </div>
        ) : (
          <pre className="m-0 h-auto w-full max-w-none whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-slate-800">
            {bodyText || <span className="italic text-slate-400">No content</span>}
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
                  color: speech.listening ? '#fff' : C.muted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
                  </svg>
                </button>
                <button onClick={submitRevision} disabled={revising || !reviseText.trim()} style={{
                  padding: '0 14px', height: 32, borderRadius: 8, border: 'none',
                  background: C.blue, color: '#fff', fontSize: 12, fontWeight: 500,
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
                  background: C.green, color: '#fff', fontSize: 12, fontWeight: 500,
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
                  background: C.green, color: '#fff', fontSize: 12, fontWeight: 500,
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
                  padding: '6px 12px', borderRadius: 8, border: '0.5px solid #FCA5A5',
                  background: 'transparent', color: '#DC2626', fontSize: 12, cursor: 'pointer',
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
    <div style={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', background: '#fff' }}>
      {/* Premium tab bar */}
      <div style={{ display: 'flex', padding: '10px 16px 0', gap: 2, borderBottom: '1px solid #E2E8F0', background: '#fff' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)} style={{
            padding: '6px 12px',
            border: active === t.key ? '1px solid #E2E8F0' : 'none',
            borderBottom: active === t.key ? '2px solid #0F172A' : '2px solid transparent',
            borderRadius: 0,
            background: 'transparent',
            color: active === t.key ? '#0F172A' : '#94A3B8',
            fontSize: 12.5, fontWeight: active === t.key ? 700 : 500,
            cursor: 'pointer', marginBottom: 0,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.1s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { if (active !== t.key) e.currentTarget.style.color = '#64748B'; }}
            onMouseLeave={e => { if (active !== t.key) e.currentTarget.style.color = '#94A3B8'; }}
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
                  borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff',
                  color: generating ? '#94A3B8' : '#6366F1', fontSize: 12,
                  cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                  <Sparkles size={12} />
                  {generating ? 'Generating…' : drafted ? 'Regenerate' : 'AI draft'}
                </button>
              )}
              <button style={{
                padding: '5px 11px', borderRadius: 6,
                border: '1px solid #E2E8F0', background: '#fff',
                color: '#64748B', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Template
              </button>
            </div>
            <button onClick={send} disabled={sending || !text.trim()} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px',
              borderRadius: 7, border: 'none',
              background: text.trim() ? '#0F172A' : '#CBD5E1',
              color: '#fff', fontSize: 12, fontWeight: 600,
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
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--mv-bg)', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0 }}>

        {/* ── Unified Command Banner ──────────────────────────────────────── */}
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--mv-hairline-2)', background: 'var(--mv-surface)', padding: '16px 24px' }}>
          {/* Left — back + identity */}
          <div style={{ display: 'flex', minWidth: 0, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/queries')}
              className="mv-btn-ghost"
              style={{ marginRight: 16 }}
            >
              ❮ Back to Queue
            </button>
            <span className="mv-num" style={{
              marginRight: 12, display: 'inline-flex', flexShrink: 0, alignItems: 'center',
              border: '1px solid var(--mv-hairline-2)', background: 'var(--mv-bg)', padding: '4px 8px',
              fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--mv-ink)'
            }}>
              #M-{ticket.ticket_number}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 18, fontWeight: 800, color: 'var(--mv-ink)' }}>
              {ticket.customer_name || ticket.subject || 'Ticket'}
            </span>
          </div>

          {/* Right — resolution control */}
          <button
            onClick={() => patch.mutate({ status: 'resolved' })}
            className="mv-btn-primary"
          >
            ✓ Mark as Resolved
          </button>
        </div>

        {/* ── Streamlined Meta Control Shelf ──────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, borderBottom: '1px solid var(--mv-hairline-2)', background: 'var(--mv-bg)', padding: '10px 24px', fontSize: 12.5, color: 'var(--mv-ink-62)' }}>
          {/* Assigned To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mv-ink-52)' }}>Assigned</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mv-ink-52)' }}>Group</span>
            <InlineSelect
              value={ticket.group_name || ''}
              onChange={v => patch.mutate({ group_name: v || null })}
              options={[{ value: '', label: '— None —' }, ...GROUPS.map(g => ({ value: g, label: g }))]}
            />
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mv-ink-52)' }}>Priority</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', border: '1px solid var(--mv-hairline-2)', background: 'var(--mv-surface)',
              padding: '3px 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
            }}>
              {(PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium).label}
            </span>
          </div>

          {/* SLA Target */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mv-ink-52)' }}>SLA Target</span>
            {slaText ? (
              <span className={`mv-state ${ticket.courier_sla_breached ? 'mv-state--attention' : 'mv-state--settled'}`} style={{ border: '1px solid var(--mv-hairline-2)', padding: '4px 10px' }}>
                <span className={`mv-mark ${ticket.courier_sla_breached ? 'mv-mark--attention' : 'mv-mark--settled'}`} />
                <span className="mv-state-label mv-num">{slaText}</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--mv-hairline-2)', background: 'var(--mv-surface)', padding: '4px 10px', fontSize: 12, color: 'var(--mv-ink-52)' }}>
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

          {/* Two lanes, side by side: Customer Face (Track A) + Courier Face (Track B) */}
          <div className={`grid min-h-0 flex-1 gap-0 overflow-hidden ${showCourierTab ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

            {/* Track A — Customer Face */}
            <div style={{ display: 'flex', minHeight: 0, flexDirection: 'column', borderRight: '1px solid var(--mv-hairline-2)', background: 'var(--mv-surface)' }}>
              <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--mv-hairline-2)', padding: '12px 20px', background: 'var(--mv-bg)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mv-purple)' }}>👤 Customer Comms</span>
                <span className="mv-num" style={{ border: '1px solid var(--mv-purple)', background: 'rgba(123,47,190,0.1)', padding: '1px 6px', fontSize: 11, fontWeight: 800, color: 'var(--mv-purple)' }}>{customerEmails.length}</span>
              </div>
              <div ref={messagesRef} style={{ minHeight: 0, flex: 1, overflowY: 'auto', padding: 24 }}>
                {customerEmails.length === 0 ? (
                  <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--mv-ink-52)' }}>No customer messages yet</div>
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
              <div style={{ display: 'flex', minHeight: 0, flexDirection: 'column', background: 'var(--mv-surface)' }}>
                <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--mv-hairline-2)', padding: '12px 20px', background: 'var(--mv-bg)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D97706' }}>
                    🚚 Courier Comms{ticket.courier_name ? ` · ${ticket.courier_name}` : ''}
                  </span>
                  <span className="mv-num" style={{ border: '1px solid #D97706', background: 'rgba(217,119,6,0.1)', padding: '1px 6px', fontSize: 11, fontWeight: 800, color: '#D97706' }}>{courierEmails.length}</span>
                </div>
                <div style={{ minHeight: 0, flex: 1, overflowY: 'auto', padding: 24 }}>
                  {courierEmails.length === 0 ? (
                    <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--mv-ink-52)' }}>No courier correspondence yet</div>
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
          width: 280, flexShrink: 0, background: 'var(--mv-surface)',
          borderLeft: '1px solid var(--mv-hairline-2)',
          overflowY: 'auto', padding: 0,
        }}>

          {/* 1. Parcel — always shown */}
          <SbSection title="Parcel" action={
            consignment ? (
              <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(consignment)}`)}
                className="mv-btn-ghost" style={{ padding: '2px 7px', fontSize: 11 }}>
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
                      <div style={{ width: 28, height: 28, border: '1px solid var(--mv-hairline-2)',
                        background: 'var(--mv-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0 }}>
                        <img src={courierLogo} alt="" style={{ width: '100%', objectFit: 'contain', padding: 3 }} />
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--mv-ink)' }}>{ticket.courier_name}</span>
                    {parcel?.status && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                        color: parcel.status === 'delivered' ? 'var(--mv-green-deep)' : '#D97706',
                        background: parcel.status === 'delivered' ? 'rgba(0,200,83,0.1)' : 'rgba(217,119,6,0.1)',
                        padding: '2px 6px', border: '1px solid var(--mv-hairline-2)', flexShrink: 0 }}>
                        {parcel.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                )}
                {/* Consignment chip */}
                <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: 'var(--mv-ink)',
                  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
                  padding: '8px 12px', marginBottom: 10, letterSpacing: '0.03em',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{consignment}</span>
                  <span style={{ fontSize: 10, color: 'var(--mv-ink-52)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigator.clipboard?.writeText(consignment)}
                    title="Copy to clipboard">COPY</span>
                </div>
                {ticket.service_name && (
                  <SbRow label="Service">
                    <span style={{ fontSize: 12, color: 'var(--mv-ink-62)' }}>{ticket.service_name}</span>
                  </SbRow>
                )}
                {parcel?.recipient_postcode && (
                  <SbRow label="Postcode">
                    <span style={{ fontSize: 12, color: 'var(--mv-ink-62)' }}>{parcel.recipient_postcode}</span>
                  </SbRow>
                )}
                {parcel?.delivered_at && (
                  <SbRow label="Delivered">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mv-green)' }}>
                      {new Date(parcel.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </SbRow>
                )}
                {/* Tracking timeline */}
                {trackEvents.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--mv-hairline-2)' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--mv-ink-52)', marginBottom: 12 }}>
                      {trackEvents.length} event{trackEvents.length !== 1 ? 's' : ''}
                    </p>
                    <TrackingTimeline events={trackEvents} />
                  </div>
                )}
                {trackEvents.length === 0 && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--mv-bg)',
                    border: '1px solid var(--mv-hairline-2)', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--mv-ink-52)', margin: 0 }}>No tracking events yet</p>
                  </div>
                )}
              </>
            ) : (
              /* No consignment linked */
              <div style={{ padding: '16px 12px', background: 'var(--mv-bg)',
                border: '1px dashed var(--mv-hairline-2)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--mv-ink)', margin: '0 0 3px' }}>No parcel linked</p>
                <p style={{ fontSize: 11, color: 'var(--mv-ink-52)', margin: 0 }}>No consignment number on this ticket</p>
              </div>
            )}
          </SbSection>

          {/* 2. Customer */}
          {(ticket.customer_name || ticket.sender_email) && (
            <SbSection title="Customer">
              {/* Avatar + name card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                padding: '10px 12px', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)' }}>
                <div style={{ width: 32, height: 32, background: 'rgba(123,47,190,0.12)',
                  border: '1px solid var(--mv-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: 'var(--mv-purple)', flexShrink: 0 }}>
                  {(ticket.customer_name || ticket.sender_email || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--mv-ink)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.customer_name || ticket.sender_email}
                  </p>
                  {ticket.customer_name && ticket.sender_email && (
                    <p style={{ fontSize: 11, color: 'var(--mv-ink-52)', margin: '2px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.sender_email}
                    </p>
                  )}
                </div>
              </div>
              {ticket.customer_id && (
                <button onClick={() => navigate(`/customers/${ticket.customer_id}`)}
                  className="mv-btn-ghost"
                  style={{ width: '100%', fontSize: 12 }}>
                  View Account →
                </button>
              )}
            </SbSection>
          )}

          {/* 3. Claim — only shown when this is a Claims ticket */}
          {(ticket.group_name === 'Claims' || ticket.claim_number || ticket.claim_amount) && (
          <SbSection title="Claim">
            {/* Alert when no formal claim yet */}
            {!ticket.claim_number && (
              <div style={{ background: 'rgba(233,30,140,0.08)', border: '1px solid var(--mv-magenta)',
                padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: 'var(--mv-magenta-deep)' }}>No claim raised yet</span>
                </div>
                {ticket.claim_amount && (
                  <p style={{ fontSize: 11.5, color: 'var(--mv-ink)', margin: 0, lineHeight: 1.5 }}>
                    Indicated value: <strong className="mv-num">£{Number(ticket.claim_amount).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}
            {ticket.claim_number && <SbRow label="Claim no.">
              <span className="mv-num" style={{ fontSize: 12, color: 'var(--mv-ink)', fontWeight: 800 }}>{ticket.claim_number}</span>
            </SbRow>}
            <SbRow label="Amount">
              <span className="mv-num" style={{ fontSize: 12, color: ticket.claim_amount ? 'var(--mv-ink)' : 'var(--mv-ink-52)', fontWeight: ticket.claim_amount ? 800 : 400 }}>
                {ticket.claim_amount ? `£${Number(ticket.claim_amount).toFixed(2)}` : '—'}
              </span>
            </SbRow>
            <SbRow label="Evidence">
              {(ticket.evidence_count > 0) ? (
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--mv-green)' }}>
                  {ticket.evidence_count} {ticket.evidence_count === 1 ? 'file' : 'files'}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>None yet</span>
              )}
            </SbRow>
            {!ticket.claim_number && (
              <button className="mv-btn-primary" style={{ width: '100%', marginTop: 12, fontSize: 12 }}>
                + Raise Formal Claim
              </button>
            )}
          </SbSection>
          )}
        </div>
      </div>
    </div>
  );
}
