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
  bg:       '#F8FAFC',  // crisp slate
  card:     '#FFFFFF',
  border:   'rgba(0,0,0,0.08)',
  green:    '#166534',
  amber:    '#92400E',
  red:      '#991B1B',
  blue:     '#1E40AF',
  text:     '#0F172A',
  sub:      '#334155',
  muted:    '#94A3B8',
  greenDim: '#DCFCE7',
  amberDim: '#FEF3C7',
  redDim:   '#FEE2E2',
  blueDim:  '#EFF6FF',
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
function InlineSelect({ value, onChange, options, colorMap }) {
  const color = colorMap?.[value]?.color || C.sub;
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'transparent', border: 'none', outline: 'none',
        color, fontSize: 11, fontWeight: 500, cursor: 'pointer',
        padding: 0, textAlign: 'right', appearance: 'none', maxWidth: 130,
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
      const r = await fetch(`/api/queries/${queryId}/revise-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_id: email.id, feedback: fb }),
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
                <button onClick={submitRevision} disabled={revising} style={{
                  padding: '0 14px', height: 32, borderRadius: 8, border: 'none',
                  background: C.blue, color: '#fff', fontSize: 12, fontWeight: 500,
                  cursor: revising ? 'not-allowed' : 'pointer',
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

  // Chronological order (newest at the bottom) → smoothly scroll to the latest
  // message the moment the thread loads. Re-runs catch late-rendering HTML/images.
  const emails = ticket?.emails || [];
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const toBottom = () => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    toBottom();
    const t1 = setTimeout(toBottom, 300);
    const t2 = setTimeout(toBottom, 900);
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
  const courierLogo = ticket.courier_code ? getCourierLogo(ticket.courier_code) : null;
  const trackEvents = trackingData?.events || trackingData?.parcel?.events || [];
  const parcel      = trackingData?.parcel || null;

  // Single merged chronological thread
  // Chronological (oldest → newest) so each reply sits directly beneath the
  // message it answers; the server already orders them, this is a safety net.
  const allEmails = [...emails].sort((a, b) =>
    new Date(a.sent_at || a.received_at || a.created_at) -
    new Date(b.sent_at || b.received_at || b.created_at)
  );

  // Split timeline — customers never see courier correspondence and vice versa.
  const isCourierDir = e => String(e.direction || '').includes('courier');
  const customerEmails = allEmails.filter(e => !isCourierDir(e));
  const courierEmails  = allEmails.filter(e => isCourierDir(e));
  // Courier tabs only make sense for parcel-led work (Queries/Claims). Billing &
  // Technical tickets render as a clean internal CRM view with no courier track.
  const showCourierTab = !['Billing', 'Technical'].includes(ticket?.group_name);
  const effectiveTab   = showCourierTab ? convTab : 'customer';
  const visibleEmails  = effectiveTab === 'courier' ? courierEmails : customerEmails;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0 }}>

        {/* Dark breadcrumb bar */}
        <div style={{ background: '#1A1C20', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => navigate('/queries')} style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none',
            border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: 0, fontSize: 12, fontFamily: 'inherit',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
          >
            <ArrowLeft size={12} /> Queries
          </button>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
          {ticket.customer_name && <>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{ticket.customer_name}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
          </>}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 340 }}>
            #{ticket.ticket_number} — {ticket.subject || 'No subject'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {consignment && (
              <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(consignment)}`)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                color: 'rgba(255,255,255,0.55)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <ExternalLink size={11} /> Track
              </button>
            )}
            <button onClick={() => patch.mutate({ status: 'resolved' })} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px',
              borderRadius: 7, border: 'none', background: '#10B981',
              color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <CheckCircle2 size={12} /> Resolve
            </button>
          </div>
        </div>

        {/* Title strip */}
        <div style={{ background: C.card, borderBottom: `1px solid #E2E8F0`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ticket.subject || ticket.customer_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: status.bg, color: status.color, border: `1px solid ${status.border || status.bg}` }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.color, display: 'inline-block' }} />
                {status.label}
              </span>
              {ticket.requires_attention && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>⚠ Needs attention</span>
              )}
              {ticket.group_name && (
                <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC', borderRadius: 20, padding: '2px 9px', border: '1px solid #E2E8F0' }}>{ticket.group_name}</span>
              )}
              {consignment && (
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748B', background: '#F8FAFC', padding: '2px 7px', borderRadius: 5, border: '1px solid #E2E8F0' }}>{consignment}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: thread + compose ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden', background: '#F8FAFC' }}>

          {/* Split-timeline tabs — only for parcel-led tickets (Queries/Claims).
              Billing/Technical hide the courier track for a clean CRM view. */}
          {showCourierTab && (
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-8 pt-4">
            {[
              { key: 'customer', label: 'Customer Conversation', count: customerEmails.length, active: 'border-blue-500 text-blue-700',  badge: 'bg-blue-50 text-blue-700' },
              { key: 'courier',  label: 'Courier Correspondence', count: courierEmails.length,  active: 'border-amber-500 text-amber-700', badge: 'bg-amber-50 text-amber-700' },
            ].map(t => {
              const on = convTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setConvTab(t.key)}
                  className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition
                    ${on ? t.active : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  {t.label}
                  <span className={`rounded-full px-2 text-xs font-semibold ${on ? t.badge : 'bg-slate-100 text-slate-500'}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
          )}

          {/* Thread */}
          <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto bg-white p-8">
            {visibleEmails.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: C.muted, alignSelf: 'center', width: '100%' }}>
                <Mail size={24} style={{ marginBottom: 10, opacity: 0.2, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13 }}>
                  {convTab === 'courier' ? 'No courier correspondence yet' : 'No customer messages yet'}
                </div>
              </div>
            ) : visibleEmails.map(email => (
              <ThreadItem
                key={email.id}
                email={email}
                queryId={id}
                courierName={ticket.courier_name}
                courierCode={ticket.courier_code}
                onApproved={() => qc.invalidateQueries(['ticket', id])}
              />
            ))}
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
          width: 264, flexShrink: 0, background: '#fff',
          borderLeft: '1px solid #E2E8F0',
          overflowY: 'auto', padding: 0,
        }}>

          {/* 1. SLA */}
          <SbSection title="SLA">
            {/* SLA urgency chip */}
            {ticket.sla_breached ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9,
                padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444',
                  boxShadow: '0 0 0 3px #FEE2E2', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>SLA Overdue</span>
              </div>
            ) : ticket.sla_mins_remaining != null && ticket.sla_mins_remaining < 240 ? (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9,
                padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
                  boxShadow: '0 0 0 3px #FEF3C7', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>SLA At Risk</span>
              </div>
            ) : ticket.sla_mins_remaining != null ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9,
                padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981',
                  boxShadow: '0 0 0 3px #D1FAE5', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>SLA On Track</span>
              </div>
            ) : null}
            <SbRow label="Opened">
              <span style={{ fontSize: 12, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{timeAgo(ticket.created_at)}</span>
            </SbRow>
            <SbRow label="Resolution">
              <SlaValue
                sla_due_at={ticket.sla_due_at}
                sla_breached={ticket.sla_breached}
                sla_mins_remaining={ticket.sla_mins_remaining}
              />
            </SbRow>
            {ticket.claim_deadline_at && (() => {
              const days = Math.ceil((new Date(ticket.claim_deadline_at) - Date.now()) / 86400000);
              const col  = days < 0 ? C.red : days < 3 ? C.amber : C.green;
              return (
                <SbRow label="Claim deadline">
                  <span style={{ fontSize: 11, fontWeight: 500, color: col }}>
                    {days < 0 ? 'Overdue' : days === 0 ? 'Today' : `${days}d left`}
                  </span>
                </SbRow>
              );
            })()}
          </SbSection>

          {/* 2. Parcel — always shown */}
          <SbSection title="Parcel" action={
            consignment ? (
              <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(consignment)}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                  color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE',
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
                      <div style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E2E8F0',
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0 }}>
                        <img src={courierLogo} alt="" style={{ width: '100%', objectFit: 'contain', padding: 3 }} />
                      </div>
                    )}
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{ticket.courier_name}</span>
                    {parcel?.status && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                        color: parcel.status === 'delivered' ? '#166534' : '#92400E',
                        background: parcel.status === 'delivered' ? '#F0FDF4' : '#FFFBEB',
                        padding: '2px 8px', borderRadius: 20, border: '1px solid transparent', flexShrink: 0 }}>
                        {parcel.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                )}
                {/* Consignment chip */}
                <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: '#0F172A',
                  background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                  padding: '8px 12px', marginBottom: 10, letterSpacing: '0.03em',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{consignment}</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 400, cursor: 'pointer' }}
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
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>
                      {new Date(parcel.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </SbRow>
                )}
                {/* Tracking timeline — appears automatically when events exist */}
                {trackEvents.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
                      {trackEvents.length} event{trackEvents.length !== 1 ? 's' : ''}
                    </p>
                    <TrackingTimeline events={trackEvents} />
                  </div>
                )}
                {trackEvents.length === 0 && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#F8FAFC',
                    borderRadius: 7, border: '1px solid #F1F5F9', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#CBD5E1', margin: 0 }}>No tracking events yet</p>
                  </div>
                )}
              </>
            ) : (
              /* No consignment linked */
              <div style={{ padding: '16px 12px', background: '#F8FAFC', borderRadius: 10,
                border: '1px dashed #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', margin: '0 0 3px' }}>No parcel linked</p>
                <p style={{ fontSize: 11, color: '#CBD5E1', margin: 0 }}>No consignment number on this ticket</p>
              </div>
            )}
          </SbSection>

          {/* 3. Customer */}
          {(ticket.customer_name || ticket.sender_email) && (
            <SbSection title="Customer">
              {/* Avatar + name card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DBEAFE',
                  border: '2px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#1D4ED8', flexShrink: 0, letterSpacing: '-0.02em' }}>
                  {(ticket.customer_name || ticket.sender_email || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.customer_name || ticket.sender_email}
                  </p>
                  {ticket.customer_name && ticket.sender_email && (
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.sender_email}
                    </p>
                  )}
                </div>
              </div>
              {ticket.customer_id && (
                <button onClick={() => navigate(`/customers/${ticket.customer_id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 5, padding: '7px 0', borderRadius: 8, border: '1px solid #C7D2FE',
                    background: '#EEF2FF', color: '#4338CA', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer' }}>
                  View account →
                </button>
              )}
            </SbSection>
          )}

          {/* 4. Claim — only shown when this is a Claims ticket */}
          {(ticket.group_name === 'Claims' || ticket.claim_number || ticket.claim_amount) && (
          <SbSection title="Claim">
            {/* Alert when no formal claim yet */}
            {!ticket.claim_number && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10,
                padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 14 14">
                    <path d="M7 2v4.5M7 9.5v.5" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="7" cy="7" r="6" stroke="#C2410C" strokeWidth="1.4"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: '#C2410C' }}>No claim raised yet</span>
                </div>
                {ticket.claim_amount && (
                  <p style={{ fontSize: 11.5, color: '#9A3412', margin: 0, lineHeight: 1.5 }}>
                    Indicated value: <strong>£{Number(ticket.claim_amount).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}
            {ticket.claim_number && <SbRow label="Claim no.">
              <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{ticket.claim_number}</span>
            </SbRow>}
            <SbRow label="Amount">
              <span style={{ fontSize: 12, color: ticket.claim_amount ? '#0F172A' : C.muted, fontWeight: ticket.claim_amount ? 700 : 400 }}>
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
                fontSize: 12.5, fontWeight: 700, color: '#C2410C', background: '#FFF7ED',
                border: '1.5px solid #FED7AA', cursor: 'pointer' }}>
                + Raise Formal Claim
              </button>
            )}
          </SbSection>
          )}

          {/* Attention warning */}
          {ticket.requires_attention && ticket.attention_reason && (
            <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: C.amberDim, fontSize: 11, color: C.amber, lineHeight: 1.45 }}>
              ⚠ {ticket.attention_reason}
            </div>
          )}

          {/* 5. Assignment */}
          <SbSection title="Assignment">
            <SbRow label="Assigned to">
              <InlineSelect
                value={ticket.assigned_to || ''}
                onChange={v => patch.mutate({ assigned_to: v || null })}
                options={[
                  { value: '', label: '— Unassigned —' },
                  ...staffList.map(s => ({ value: s.id, label: s.full_name || s.name })),
                ]}
              />
            </SbRow>
            <SbRow label="Group">
              <InlineSelect
                value={ticket.group_name || ''}
                onChange={v => patch.mutate({ group_name: v || null })}
                options={[{ value: '', label: '— None —' }, ...GROUPS.map(g => ({ value: g, label: g }))]}
              />
            </SbRow>
            <SbRow label="Status">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                  background: STATUS_CFG[ticket.status]?.bg || '#F8FAFC',
                  color: STATUS_CFG[ticket.status]?.color || C.muted,
                  border: `1px solid ${STATUS_CFG[ticket.status]?.border || '#E2E8F0'}` }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%',
                    background: STATUS_CFG[ticket.status]?.color || C.muted }} />
                  {STATUS_CFG[ticket.status]?.label || ticket.status}
                </span>
                <InlineSelect
                  value={ticket.status}
                  onChange={v => patch.mutate({ status: v })}
                  options={Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: '✎' }))}
                />
              </div>
            </SbRow>
            <SbRow label="Priority">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600,
                  color: PRIORITY_CFG[ticket.priority || 'medium']?.color || C.muted }}>
                  {PRIORITY_CFG[ticket.priority || 'medium']?.label || ticket.priority}
                </span>
                <InlineSelect
                  value={ticket.priority || 'medium'}
                  onChange={v => patch.mutate({ priority: v })}
                  options={Object.entries(PRIORITY_CFG).map(([k, v]) => ({ value: k, label: '✎' }))}
                  colorMap={PRIORITY_CFG}
                />
              </div>
            </SbRow>
          </SbSection>

          {/* Tracking timeline */}
          {trackEvents.length > 0 && (
            <SbSection title={`Tracking · ${trackEvents.length} events`}>
              <TrackingTimeline events={trackEvents} />
            </SbSection>
          )}

        </div>
      </div>
    </div>
  );
}
