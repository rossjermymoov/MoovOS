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
  bg:       '#E3DDD5',  // warm beige — sidebar cards, compose tab bar
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
function SbCard({ title, children }) {
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
      {title && (
        <div style={{
          fontSize: 10, fontWeight: 500, color: C.muted,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function SbRow({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', gap: 8, padding: '4px 0',
    }}>
      <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ minWidth: 0, textAlign: 'right' }}>{children}</div>
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
  if (!events?.length) return <div style={{ fontSize: 11, color: C.muted }}>No events yet</div>;
  const recent = [...events]
    .sort((a, b) => new Date(b.event_at) - new Date(a.event_at))
    .slice(0, 5);
  return (
    <div>
      {recent.map((ev, i) => (
        <div key={ev.id || i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 3,
            background: i === 0 ? C.blue : C.muted,
          }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: i === 0 ? 500 : 400, color: i === 0 ? C.text : C.sub, lineHeight: 1.4 }}>
              {ev.description || ev.status?.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
              {timeAgo(ev.event_at)}{ev.location ? ` · ${ev.location}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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
  const avBg = isNote    ? 'rgba(234,179,8,0.10)'
    : isOut              ? 'rgba(99,102,241,0.10)'
    : isCourier          ? 'rgba(146,64,14,0.08)'
    :                      'rgba(30,64,175,0.08)';
  const avColor = isNote ? C.amber
    : isOut              ? '#4F46E5'
    : isCourier          ? C.amber
    :                      C.blue;
  const avInitial = isNote ? '—'
    : isOut              ? 'Y'
    : isCourier          ? (courierName?.[0]?.toUpperCase() || 'C')
    :                      'C';

  const senderLabel = isNote             ? 'Internal note'
    : dir === 'inbound_customer'         ? (email.from_address || 'Customer')
    : dir === 'outbound_customer'        ? 'You → Customer'
    : dir === 'inbound_courier'          ? (courierName || 'Courier')
    :                                      `You → ${courierName || 'Courier'}`;

  // Strip quoted reply text
  const bodyLines  = (email.body_text || '').split('\n');
  const cutoff     = bodyLines.findIndex(l => l.startsWith('On ') && l.includes('wrote:'));
  const displayBody = cutoff > 0
    ? bodyLines.slice(0, cutoff).join('\n').trim()
    : (email.body_text || '').trim();

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

  return (
    <div style={{
      display: 'flex', gap: 14,
      padding: '14px 16px',
      background: cardBg,
      border: `0.5px solid ${C.border}`,
      borderLeft: cardBorderLeft,
      borderRadius: 10,
    }}>

      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: logoUrl ? '#fff' : avBg,
        border: `0.5px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {logoUrl
          ? <img src={logoUrl} alt="" style={{ width: '100%', objectFit: 'contain', padding: 4 }} />
          : <span style={{ fontSize: 11, fontWeight: 500, color: avColor }}>{avInitial}</span>
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Courier logo chip — shown on any courier direction */}
            {isCourier && logoUrl && (
              <div style={{
                width: 22, height: 22, borderRadius: 5,
                border: `0.5px solid ${C.border}`, background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
              }}>
                <img src={logoUrl} alt={courierName || ''} style={{ width: '100%', objectFit: 'contain', padding: 2 }} />
              </div>
            )}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
              {senderLabel}
            </span>
            {isDraft && (
              <span style={{
                fontSize: 10, fontWeight: 500, color: C.green,
                background: C.greenDim, borderRadius: 20, padding: '2px 8px',
              }}>
                AI draft
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 16 }}>{fmtDate(ts)}</span>
        </div>

        {/* Body */}
        {editMode ? (
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            style={{
              width: '100%', minHeight: 120, background: C.card,
              border: `0.5px solid ${C.border}`, borderRadius: 8,
              color: C.text, fontSize: 13, padding: 10, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', lineHeight: 1.65,
            }}
          />
        ) : (
          <pre style={{
            margin: 0, fontSize: 13, color: C.sub, whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', lineHeight: 1.7, fontFamily: 'inherit',
            borderLeft: isNote ? `3px solid rgba(234,179,8,0.4)` : 'none',
            paddingLeft: isNote ? 10 : 0,
          }}>
            {displayBody || <span style={{ color: C.muted, fontStyle: 'italic' }}>No content</span>}
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
                  placeholder="Tell it what to change… e.g. 'be more apologetic, mention the deadline'"
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
    <div style={{ flexShrink: 0, borderTop: `0.5px solid ${C.border}`, background: C.card }}>
      {/* Tabs — beige background, active tab pops white */}
      <div style={{ display: 'flex', background: C.bg, borderBottom: `0.5px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)} style={{
            padding: '9px 14px', border: 'none',
            borderBottom: `2px solid ${active === t.key ? C.text : 'transparent'}`,
            background: active === t.key ? C.card : 'transparent',
            color: active === t.key ? C.text : C.muted,
            fontSize: 12, fontWeight: active === t.key ? 500 : 400,
            cursor: 'pointer', marginBottom: -0.5,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.1s',
          }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {active !== 'note' && (
                <button onClick={generateDraft} disabled={generating} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                  borderRadius: 6, border: `0.5px solid ${C.border}`, background: 'transparent',
                  color: C.sub, fontSize: 12, cursor: generating ? 'not-allowed' : 'pointer',
                }}>
                  <Sparkles size={12} />
                  {generating ? 'Generating…' : drafted ? 'Regenerate' : 'AI draft'}
                </button>
              )}
              <button style={{
                padding: '5px 10px', borderRadius: 6,
                border: 'none', background: C.blueDim,
                color: C.blue, fontSize: 12, cursor: 'pointer',
              }}>
                Use template
              </button>
            </div>
            <button onClick={send} disabled={sending || !text.trim()} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px',
              borderRadius: 8, border: 'none',
              background: text.trim() ? C.text : C.muted,
              color: '#fff', fontSize: 13, fontWeight: 500,
              cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
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

  // Scroll to bottom when emails load
  const emails = ticket?.emails || [];
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
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
  const allEmails = [...emails].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: '12px 20px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <button onClick={() => navigate('/queries')} style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none',
            border: 'none', color: C.muted, cursor: 'pointer', padding: 0, fontSize: 13,
          }}
            onMouseEnter={e => e.currentTarget.style.color = C.sub}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >
            <ArrowLeft size={13} /> Queries
          </button>
          <span style={{ color: C.muted, fontSize: 13 }}>›</span>
          <span style={{ fontSize: 13, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
            {ticket.customer_name || ticket.subject}
          </span>
        </div>

        {/* Title + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: C.text, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ticket.subject || ticket.customer_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: status.color, background: status.bg, borderRadius: 20, padding: '3px 10px' }}>
                {status.label}
              </span>
              {ticket.group_name && (
                <span style={{ fontSize: 11, color: C.muted, background: 'rgba(0,0,0,0.04)', borderRadius: 20, padding: '3px 9px' }}>
                  {ticket.group_name}
                </span>
              )}
              {ticket.customer_name && (
                <span style={{ fontSize: 12, color: C.sub }}>{ticket.customer_name}</span>
              )}
              {courierLogo && (
                <div style={{ width: 26, height: 26, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={courierLogo} alt="" style={{ width: '100%', objectFit: 'contain', padding: 4 }} />
                </div>
              )}
              {consignment && (
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{consignment}</span>
              )}
              {ticket.requires_attention && (
                <span style={{ fontSize: 11, fontWeight: 500, color: C.red, background: C.redDim, borderRadius: 20, padding: '3px 9px' }}>
                  ⚠ Needs attention
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            {consignment && (
              <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(consignment)}`)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 8, border: `0.5px solid ${C.border}`, background: 'transparent',
                color: C.muted, fontSize: 12, cursor: 'pointer',
              }}>
                <ExternalLink size={12} /> Track
              </button>
            )}
            <button onClick={() => patch.mutate({ status: 'resolved' })} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
              borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.bg,
              color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
              <CheckCircle2 size={13} /> Resolve
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: thread + compose ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: C.card }}>

          {/* Thread */}
          <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allEmails.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: C.muted, alignSelf: 'center', width: '100%' }}>
                <Mail size={24} style={{ marginBottom: 10, opacity: 0.2, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13 }}>No messages yet</div>
              </div>
            ) : allEmails.map(email => (
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
          width: 224, flexShrink: 0, background: C.card,
          borderLeft: `0.5px solid ${C.border}`,
          overflowY: 'auto', padding: '14px 12px 32px',
        }}>

          {/* 1. SLA */}
          <SbCard title="SLA">
            <SbRow label="Created">
              <span style={{ fontSize: 11, color: C.sub }}>{timeAgo(ticket.created_at)}</span>
            </SbRow>
            <SbRow label="First response">
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
          </SbCard>

          {/* 2. Parcel */}
          {consignment && (
            <SbCard title="Parcel">
              {courierLogo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, border: `0.5px solid ${C.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={courierLogo} alt="" style={{ width: '100%', objectFit: 'contain', padding: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, color: C.sub }}>{ticket.courier_name}</span>
                </div>
              )}
              <SbRow label="Tracking">
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.text }}>{consignment}</span>
              </SbRow>
              {ticket.service_name && (
                <SbRow label="Service">
                  <span style={{ fontSize: 11, color: C.sub }}>{ticket.service_name}</span>
                </SbRow>
              )}
              {parcel?.status && (
                <SbRow label="Status">
                  <span style={{ fontSize: 11, color: C.sub, textTransform: 'capitalize' }}>
                    {parcel.status.replace(/_/g, ' ')}
                  </span>
                </SbRow>
              )}
              {parcel?.recipient_postcode && (
                <SbRow label="Postcode">
                  <span style={{ fontSize: 11, color: C.sub }}>{parcel.recipient_postcode}</span>
                </SbRow>
              )}
              {parcel?.delivered_at && (
                <SbRow label="Delivered">
                  <span style={{ fontSize: 11, fontWeight: 500, color: C.green }}>
                    {new Date(parcel.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </SbRow>
              )}
              <div style={{ marginTop: 8 }}>
                <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(consignment)}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.blue, fontSize: 11, cursor: 'pointer', padding: 0 }}>
                  <ExternalLink size={10} /> View tracking
                </button>
              </div>
            </SbCard>
          )}

          {/* 3. Customer */}
          {(ticket.customer_name || ticket.sender_email) && (
            <SbCard title="Customer">
              {ticket.customer_name && (
                <SbRow label="Account">
                  <button onClick={() => ticket.customer_id && navigate(`/customers/${ticket.customer_id}`)}
                    style={{ background: 'none', border: 'none', color: C.blue, fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                    {ticket.customer_name}
                  </button>
                </SbRow>
              )}
              {ticket.sender_email && (
                <SbRow label="Contact">
                  <span style={{ fontSize: 11, color: C.sub, wordBreak: 'break-all' }}>{ticket.sender_email}</span>
                </SbRow>
              )}
            </SbCard>
          )}

          {/* 4. Claim */}
          <SbCard title="Claim">
            <SbRow label="Claim no.">
              <span style={{ fontSize: 11, color: ticket.claim_number ? C.text : C.muted }}>
                {ticket.claim_number || 'Not yet raised'}
              </span>
            </SbRow>
            <SbRow label="Claim amount">
              <span style={{ fontSize: 11, color: ticket.claim_amount ? C.text : C.muted }}>
                {ticket.claim_amount ? `£${Number(ticket.claim_amount).toFixed(2)}` : '—'}
              </span>
            </SbRow>
            <SbRow label="Evidence">
              {(ticket.evidence_count > 0) ? (
                <span style={{ fontSize: 11, fontWeight: 500, color: C.green }}>
                  {ticket.evidence_count} {ticket.evidence_count === 1 ? 'file' : 'files'}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: C.muted }}>None yet</span>
              )}
            </SbRow>
          </SbCard>

          {/* Attention warning */}
          {ticket.requires_attention && ticket.attention_reason && (
            <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: C.amberDim, fontSize: 11, color: C.amber, lineHeight: 1.45 }}>
              ⚠ {ticket.attention_reason}
            </div>
          )}

          {/* 5. Assignment */}
          <SbCard title="Assignment">
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
              <InlineSelect
                value={ticket.status}
                onChange={v => patch.mutate({ status: v })}
                options={Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))}
                colorMap={STATUS_CFG}
              />
            </SbRow>
            <SbRow label="Priority">
              <InlineSelect
                value={ticket.priority || 'medium'}
                onChange={v => patch.mutate({ priority: v })}
                options={Object.entries(PRIORITY_CFG).map(([k, v]) => ({ value: k, label: v.label }))}
                colorMap={PRIORITY_CFG}
              />
            </SbRow>
          </SbCard>

          {/* Tracking timeline */}
          {trackEvents.length > 0 && (
            <SbCard title={`Tracking · ${trackEvents.length} events`}>
              <TrackingTimeline events={trackEvents} />
            </SbCard>
          )}

        </div>
      </div>
    </div>
  );
}
