/**
 * TicketDetailPage  —  /queries/:id
 *
 * Conversation bubble layout:
 *   Left column: header + thread (3 tabs) + unified compose bar
 *   Right sidebar: ticket info + parcel tracking (always visible)
 *
 * All real functionality preserved: AI draft gen/approval/revision,
 * voice input, manual send, React Query, PATCH mutations.
 */

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, Clock, AlertTriangle, CheckCircle2, User, Users,
  Package, Truck, Mail, MessageSquare, FileText, Send,
  MapPin, RotateCcw, RefreshCw, ExternalLink,
  Tag, Building2, PackageCheck, PackageX, Store, ShieldAlert,
  Sparkles, Edit2,
} from 'lucide-react';
import { getCourierLogo } from '../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#080F1C',
  header:   '#09122A',
  surface:  '#0D1827',
  card:     '#111F32',
  hover:    '#152035',
  border:   'rgba(255,255,255,0.07)',
  green:    '#22C55E',
  amber:    '#F97316',
  red:      '#EF4444',
  blue:     '#3B82F6',
  purple:   '#A855F7',
  text:     '#F0F4FC',
  sub:      '#8AABFF',
  muted:    '#3D5270',
  greenDim: 'rgba(34,197,94,0.12)',
  amberDim: 'rgba(249,115,22,0.12)',
  redDim:   'rgba(239,68,68,0.12)',
  blueDim:  'rgba(59,130,246,0.13)',
};

// ─── Config maps ──────────────────────────────────────────────────────────────
const PRIORITY_CFG = {
  urgent: { label: 'Urgent',  color: C.red   },
  high:   { label: 'High',    color: C.amber },
  medium: { label: 'Medium',  color: C.blue  },
  low:    { label: 'Low',     color: C.muted },
};

const STATUS_CFG = {
  open:                    { label: 'Open',              color: C.blue,  bg: C.blueDim  },
  awaiting_customer_info:  { label: 'Awaiting Customer', color: C.amber, bg: C.amberDim },
  info_received:           { label: 'Info Received',     color: C.green, bg: C.greenDim },
  drafting:                { label: 'Drafting',          color: C.green, bg: C.greenDim },
  awaiting_courier:        { label: 'Awaiting Courier',  color: C.amber, bg: C.amberDim },
  courier_replied:         { label: 'Courier Replied',   color: C.green, bg: C.greenDim },
  courier_investigating:   { label: 'Investigating',     color: C.amber, bg: C.amberDim },
  awaiting_customer:       { label: 'Awaiting Customer', color: C.amber, bg: C.amberDim },
  claim_raised:            { label: 'Claim Raised',      color: C.red,   bg: C.redDim   },
  awaiting_claim_docs:     { label: 'Awaiting Docs',     color: C.red,   bg: C.redDim   },
  claim_submitted:         { label: 'Claim Submitted',   color: C.amber, bg: C.amberDim },
  resolved:                { label: 'Resolved',          color: C.green, bg: C.greenDim },
  resolved_claim_approved: { label: 'Claim Approved',    color: C.green, bg: C.greenDim },
  resolved_claim_rejected: { label: 'Claim Rejected',    color: C.red,   bg: C.redDim   },
  escalated:               { label: 'Escalated',         color: C.red,   bg: C.redDim   },
};

const GROUPS = ['Delivery Enquiries', 'Claims', 'Accounts', 'Technical', 'General'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  if (!ts) return '—';
  const secs = (Date.now() - new Date(ts)) / 1000;
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function SlaChip({ sla_due_at, sla_breached, sla_mins_remaining }) {
  if (!sla_due_at) return null;
  const mins = sla_mins_remaining;
  let label, color, bg;
  if (sla_breached) {
    label = 'SLA Breached'; color = C.red; bg = C.redDim;
  } else if (mins < 60) {
    label = `${Math.round(mins)}m left`; color = C.red; bg = C.redDim;
  } else if (mins < 240) {
    label = `${Math.round(mins / 60)}h left`; color = C.amber; bg = C.amberDim;
  } else {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    label = m > 0 ? `${h}h ${m}m left` : `${h}h left`; color = C.green; bg = C.greenDim;
  }
  return (
    <span title={fmtDate(sla_due_at)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 5,
      background: bg, border: `1px solid ${color}33`,
      fontSize: 10, fontWeight: 700, color,
    }}>
      <Clock size={9} /> {label}
    </span>
  );
}

function PropRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
      <Icon size={12} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
        {children}
      </div>
    </div>
  );
}

function InlineSelect({ value, onChange, options, colorMap }) {
  const color = colorMap?.[value]?.color || C.text;
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} style={{
      background: 'transparent', border: 'none', outline: 'none',
      color, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      padding: 0, width: '100%', appearance: 'none',
    }}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ background: C.card, color: C.text }}>{opt.label}</option>
      ))}
    </select>
  );
}

// ─── Voice-to-text hook ───────────────────────────────────────────────────────
function useSpeechInput(setText) {
  const [listening, setListening] = useState(false);
  function toggle() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported. Use Chrome or Edge.'); return; }
    setListening(true);
    const rec = new SR();
    rec.lang = 'en-GB'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript || '';
      if (t) setText(prev => prev ? prev + ' ' + t : t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }
  return { listening, toggle };
}

// ─── Tracking ─────────────────────────────────────────────────────────────────
const TRACK_STATUS = {
  booked:              { label: 'Booked',           color: '#00BCD4', bg: 'rgba(0,188,212,0.12)',    icon: Package },
  collected:           { label: 'Collected',         color: '#2196F3', bg: 'rgba(33,150,243,0.12)',   icon: Package },
  at_depot:            { label: 'At Hub',             color: '#5C6BC0', bg: 'rgba(92,107,192,0.12)',   icon: Package },
  in_transit:          { label: 'In Transit',         color: '#7B2FBE', bg: 'rgba(123,47,190,0.12)',   icon: Truck },
  out_for_delivery:    { label: 'Out for Delivery',   color: '#FFC107', bg: 'rgba(255,193,7,0.12)',    icon: Truck },
  failed_delivery:     { label: 'Failed Attempt',     color: '#F44336', bg: 'rgba(244,67,54,0.12)',    icon: AlertTriangle },
  delivered:           { label: 'Delivered',          color: '#00C853', bg: 'rgba(0,200,83,0.12)',     icon: PackageCheck },
  on_hold:             { label: 'On Hold',            color: '#FF9800', bg: 'rgba(255,152,0,0.12)',    icon: Clock },
  exception:           { label: 'Address Issue',      color: '#F44336', bg: 'rgba(244,67,54,0.12)',    icon: AlertTriangle },
  returned:            { label: 'Return to Sender',   color: '#607D8B', bg: 'rgba(96,125,139,0.12)',   icon: RotateCcw },
  tracking_expired:    { label: 'Tracking Expired',   color: '#757575', bg: 'rgba(117,117,117,0.12)',  icon: Clock },
  cancelled:           { label: 'Cancelled',          color: '#757575', bg: 'rgba(117,117,117,0.12)',  icon: AlertTriangle },
  awaiting_collection: { label: 'Awaiting Collection',color: '#FF6F00', bg: 'rgba(255,111,0,0.12)',    icon: Store },
  damaged:             { label: 'Damaged',            color: '#E91E8C', bg: 'rgba(233,30,140,0.12)',   icon: PackageX },
  customs_hold:        { label: 'Customs Hold',       color: '#9C27B0', bg: 'rgba(156,39,176,0.12)',   icon: ShieldAlert },
  unknown:             { label: 'Unknown',            color: '#555555', bg: 'rgba(255,255,255,0.05)',  icon: Package },
};

function TrackingMiniTimeline({ events }) {
  if (!events?.length) return (
    <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '6px 0' }}>No tracking events</div>
  );
  const recent = [...events].sort((a, b) => new Date(b.event_at) - new Date(a.event_at)).slice(0, 5);
  return (
    <div>
      {recent.map((ev, i) => {
        const cfg = TRACK_STATUS[ev.status] || TRACK_STATUS.unknown;
        const isLast = i === recent.length - 1;
        return (
          <div key={ev.id || i} style={{ display: 'flex', gap: 9, paddingBottom: isLast ? 0 : 12, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 2 }} />
              {!isLast && <div style={{ width: 1, flex: 1, minHeight: 10, background: C.border, marginTop: 3 }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
              {ev.description && <div style={{ fontSize: 10, color: C.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.description}</div>}
              <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{timeAgo(ev.event_at)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ email, queryId, courierName, courierCode, approving, onApproved }) {
  const [expanded,    setExpanded]    = useState(true);
  const [editMode,    setEditMode]    = useState(false);
  const [editBody,    setEditBody]    = useState(email.body_text || '');
  const [localApproving, setLocalApp] = useState(false);
  const [reviseMode,  setReviseMode]  = useState(false);
  const [reviseText,  setReviseText]  = useState('');
  const reviseRef = useRef('');
  const [revising,    setRevising]    = useState(false);
  const qc = useQueryClient();

  function updateRevise(val) {
    if (typeof val === 'function') {
      setReviseText(prev => { const next = val(prev); reviseRef.current = next; return next; });
    } else {
      reviseRef.current = val; setReviseText(val);
    }
  }
  const speech = useSpeechInput(updateRevise);

  const dir       = email.direction;
  const isDraft   = email.is_ai_draft && !email.sent_at && !email.ai_draft_approved_by;
  const isInbound = dir === 'inbound_customer' || dir === 'inbound_courier';
  const isCourier = dir === 'inbound_courier'  || dir === 'outbound_courier';
  const isNote    = dir === 'note';

  // Bubble styling
  let bubbleBg, bubbleBorderStyle, accentColor, bubbleRadius, maxW, align;
  if (isNote) {
    bubbleBg = 'rgba(234,179,8,0.07)';
    bubbleBorderStyle = `1px solid rgba(234,179,8,0.18)`;
    accentColor = '#EAB308';
    bubbleRadius = 8;
    align = 'center';
    maxW = '100%';
  } else if (dir === 'inbound_customer') {
    bubbleBg = '#111F32';
    bubbleBorderStyle = `1px solid rgba(255,255,255,0.07)`;
    accentColor = C.blue;
    bubbleRadius = '2px 10px 10px 10px';
    align = 'left';
    maxW = '76%';
  } else if (dir === 'outbound_customer') {
    bubbleBg = isDraft ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.13)';
    bubbleBorderStyle = isDraft ? `1px solid rgba(34,197,94,0.25)` : `1px solid rgba(59,130,246,0.2)`;
    accentColor = isDraft ? C.green : C.blue;
    bubbleRadius = '10px 2px 10px 10px';
    align = 'right';
    maxW = '76%';
  } else if (dir === 'inbound_courier') {
    bubbleBg = '#111F32';
    bubbleBorderStyle = `1px solid rgba(249,115,22,0.2)`;
    accentColor = C.amber;
    bubbleRadius = '2px 10px 10px 10px';
    align = 'left';
    maxW = '76%';
  } else {
    bubbleBg = 'rgba(249,115,22,0.10)';
    bubbleBorderStyle = `1px solid rgba(249,115,22,0.18)`;
    accentColor = C.amber;
    bubbleRadius = '10px 2px 10px 10px';
    align = 'right';
    maxW = '76%';
  }

  const logoUrl = isCourier && courierCode ? getCourierLogo(courierCode) : null;
  const senderLabel = isNote
    ? 'Internal Note'
    : dir === 'inbound_customer'  ? (email.from_address || 'Customer')
    : dir === 'outbound_customer' ? 'You → Customer'
    : dir === 'inbound_courier'   ? (courierName || 'Courier')
    :                               `You → ${courierName || 'Courier'}`;

  const bodyLines = (email.body_text || '').split('\n');
  const cutoff = bodyLines.findIndex(l => l.startsWith('On ') && l.includes('wrote:'));
  const displayBody = cutoff > 0
    ? bodyLines.slice(0, cutoff).join('\n').trim()
    : (email.body_text || '').trim();

  async function doApprove(bodyOverride) {
    setLocalApp(true);
    try {
      await api.patch(`/queries/${queryId}/emails/${email.id}/approve`, {
        body_text: bodyOverride ?? email.body_text,
      });
      qc.invalidateQueries(['ticket', queryId]);
      onApproved?.();
    } catch (e) {
      alert('Approval failed: ' + (e.response?.data?.error || e.message));
    } finally { setLocalApp(false); }
  }

  async function submitRevision() {
    const feedback = reviseRef.current.trim();
    if (!feedback || revising) return;
    setRevising(true);
    try {
      const resp = await fetch(`/api/queries/${queryId}/revise-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_id: email.id, feedback }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${resp.status}`);
      }
      setReviseMode(false); reviseRef.current = ''; setReviseText('');
      qc.invalidateQueries(['ticket', queryId]);
    } catch (e) {
      alert('Revision failed: ' + e.message);
    } finally { setRevising(false); }
  }

  const busy = localApproving || approving;

  return (
    <div style={{ display: 'flex', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start', marginBottom: 10 }}>
      <div style={{ maxWidth: maxW, minWidth: isNote ? 0 : 200, width: isNote ? '100%' : undefined }}>

        {/* Sender + time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3,
          justifyContent: isNote ? 'center' : (isInbound ? 'flex-start' : 'flex-end'),
        }}>
          {logoUrl && <img src={logoUrl} alt="" style={{ width: 14, height: 10, objectFit: 'contain' }} />}
          <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>{senderLabel}</span>
          {isDraft && (
            <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.greenDim,
              padding: '1px 5px', borderRadius: 3, border: `1px solid ${C.green}33` }}>
              AI Draft
            </span>
          )}
          <span style={{ fontSize: 10, color: C.muted }}>
            {email.sent_at ? fmtDate(email.sent_at) : fmtDate(email.received_at || email.created_at)}
          </span>
        </div>

        {/* Bubble */}
        <div style={{
          background: bubbleBg,
          border: bubbleBorderStyle,
          borderLeft: isNote ? `3px solid rgba(234,179,8,0.5)` : undefined,
          borderRadius: bubbleRadius,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
          onClick={() => setExpanded(e => !e)}
        >
          {email.subject && !isNote && (
            <div style={{ padding: '6px 12px 5px', fontSize: 10, fontWeight: 700, color: C.muted,
              borderBottom: `1px solid ${C.border}` }}>
              {email.subject}
            </div>
          )}

          {expanded && (
            <div style={{ padding: isNote ? '8px 12px' : '10px 12px' }}
              onClick={e => editMode && e.stopPropagation()}
            >
              {editMode ? (
                <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: '100%', minHeight: 110, background: C.surface,
                    border: `1px solid ${C.green}44`, borderRadius: 5,
                    color: C.text, fontSize: 12, padding: 8, resize: 'vertical',
                    fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              ) : (
                <pre style={{
                  margin: 0, fontSize: 12, color: C.sub, whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word', lineHeight: 1.65, maxHeight: 200,
                  overflow: 'auto', fontFamily: 'inherit',
                }}>
                  {displayBody || <span style={{ color: C.muted, fontStyle: 'italic' }}>No body</span>}
                </pre>
              )}
            </div>
          )}

          {/* AI draft action bar */}
          {isDraft && expanded && (
            <div style={{ borderTop: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>

              {/* Revise panel */}
              {reviseMode && (
                <div style={{ padding: '10px 12px', background: 'rgba(210,153,34,0.04)', borderBottom: `1px solid ${C.amber}22` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, marginBottom: 6 }}>
                    Tell Katana why you'd change this
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
                    <textarea
                      value={reviseText}
                      onChange={e => updateRevise(e.target.value)}
                      placeholder="e.g. Too formal, customer is upset — be more apologetic…"
                      rows={2}
                      autoFocus
                      style={{
                        flex: 1, background: C.card, border: `1px solid ${C.amber}33`,
                        borderRadius: 5, padding: '6px 8px', color: C.text,
                        fontSize: 11, lineHeight: 1.5, resize: 'none',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitRevision(); } }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button onClick={speech.toggle} title={speech.listening ? 'Listening…' : 'Dictate'}
                        style={{
                          width: 28, height: 28, borderRadius: 5, border: 'none',
                          background: speech.listening ? C.amber : `${C.amber}18`,
                          color: speech.listening ? '#000' : C.amber,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="22"/>
                        </svg>
                      </button>
                      <button onClick={submitRevision} disabled={revising} title="Send (Enter)"
                        style={{
                          width: 28, height: 28, borderRadius: 5, border: 'none',
                          background: revising ? `${C.amber}18` : C.amber,
                          color: revising ? C.muted : '#000',
                          cursor: revising ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {revising
                          ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Send size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Approve / Edit / Revise buttons */}
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'wrap' }}>
                {editMode ? (
                  <>
                    <button onClick={() => { doApprove(editBody); setEditMode(false); }} disabled={busy}
                      style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: C.green,
                        color: '#000', fontSize: 11, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={11} /> {busy ? 'Saving…' : 'Save & Approve'}
                    </button>
                    <button onClick={() => { setEditMode(false); setEditBody(email.body_text || ''); }}
                      style={{ padding: '5px 10px', borderRadius: 5, border: `1px solid ${C.border}`,
                        background: 'transparent', color: C.muted, fontSize: 11, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => doApprove()} disabled={busy}
                      style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: C.green,
                        color: '#000', fontSize: 11, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                        opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={11} /> {busy ? 'Sending…' : 'Approve & Send'}
                    </button>
                    <button onClick={() => { setReviseMode(r => !r); reviseRef.current = ''; setReviseText(''); }}
                      style={{ padding: '5px 10px', borderRadius: 5,
                        border: `1px solid ${C.amber}44`, background: reviseMode ? `${C.amber}10` : 'transparent',
                        color: C.amber, fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={11} /> {reviseMode ? 'Cancel' : 'Ask Katana to revise'}
                    </button>
                    <button onClick={() => setEditMode(true)}
                      style={{ padding: '5px 10px', borderRadius: 5,
                        border: `1px solid ${C.border}`, background: 'transparent',
                        color: C.muted, fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Edit2 size={10} /> Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Thread area (tabs + messages) ───────────────────────────────────────────
function ThreadArea({ emails, queryId, courierName, courierCode, approving, onApproved }) {
  const [tab, setTab] = useState('customer');
  const messagesRef = useRef(null);

  const customerEmails = emails.filter(e => e.direction === 'inbound_customer' || e.direction === 'outbound_customer');
  const courierEmails  = emails.filter(e => e.direction === 'inbound_courier'  || e.direction === 'outbound_courier');
  const noteEmails     = emails.filter(e => e.direction === 'note');
  const logoUrl = courierCode ? getCourierLogo(courierCode) : null;

  const tabs = [
    { key: 'customer', label: 'Customer',               count: customerEmails.length, color: C.blue },
    { key: 'courier',  label: courierName || 'Courier',  count: courierEmails.length,  color: C.amber, logo: logoUrl },
    { key: 'notes',    label: 'Notes',                  count: noteEmails.length,     color: C.muted },
  ];

  const visible = tab === 'customer' ? customerEmails
                : tab === 'courier'  ? courierEmails
                : noteEmails;

  // Scroll to bottom of messages when tab changes or new message arrives.
  // Using scrollTop directly — scrollIntoView bubbles up the DOM and can
  // scroll the window if the messages div has no overflow, breaking the layout.
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [tab, emails.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 16px', border: 'none',
            borderBottom: `2px solid ${tab === t.key ? t.color : 'transparent'}`,
            background: 'transparent',
            color: tab === t.key ? t.color : C.muted,
            fontSize: 12, fontWeight: tab === t.key ? 700 : 400,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.1s',
          }}>
            {t.logo ? (
              <div style={{ background: '#fff', borderRadius: 2, padding: '1px 3px', display: 'flex', alignItems: 'center' }}>
                <img src={t.logo} alt="" style={{ height: 11, objectFit: 'contain' }} />
              </div>
            ) : null}
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                background: tab === t.key ? `${t.color}22` : C.card,
                color: tab === t.key ? t.color : C.muted,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 6px' }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: C.muted }}>
            <Mail size={28} style={{ marginBottom: 10, opacity: 0.25 }} />
            <div style={{ fontSize: 13 }}>No messages in this thread yet</div>
          </div>
        ) : (
          [...visible]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(email => (
              <MessageBubble
                key={email.id}
                email={email}
                queryId={queryId}
                courierName={courierName}
                courierCode={courierCode}
                approving={approving}
                onApproved={onApproved}
              />
            ))
        )}
      </div>
    </div>
  );
}

// ─── Unified compose bar ──────────────────────────────────────────────────────
function UnifiedComposeBar({ queryId, courierName, onSent }) {
  const [active,    setActive]    = useState(null); // null | 'customer' | 'courier' | 'note'
  const [text,      setText]      = useState('');
  const [sending,   setSending]   = useState(false);
  const [generating, setGen]      = useState(false);
  const [drafted,   setDrafted]   = useState(false);
  const qc = useQueryClient();

  const tabs = [
    { key: 'customer', label: 'Reply to Customer',                icon: Mail,          color: C.blue,  dir: 'outbound_customer' },
    { key: 'courier',  label: `Email ${courierName || 'Courier'}`, icon: Truck,         color: C.amber, dir: 'outbound_courier'  },
    { key: 'note',     label: 'Internal Note',                    icon: MessageSquare, color: C.muted, dir: 'note'              },
  ];

  const activeCfg = tabs.find(t => t.key === active);
  const accent    = activeCfg?.color || C.blue;

  function switchTab(key) {
    setActive(a => a === key ? null : key);
    setText(''); setDrafted(false);
  }

  async function generateDraft() {
    if (!active || active === 'note') return;
    setGen(true);
    try {
      const r = await fetch(`/api/queries/${queryId}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: active }),
      });
      if (!r.ok) throw new Error(await r.text());
      setDrafted(true);
      qc.invalidateQueries(['ticket', queryId]);
    } catch (e) {
      alert('Failed to generate draft: ' + e.message);
    } finally { setGen(false); }
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
    } catch (e) {
      alert('Send failed: ' + (e.response?.data?.error || e.message));
    } finally { setSending(false); }
  }

  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: '#080F1E' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: active ? `1px solid ${C.border}` : 'none' }}>
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => switchTab(t.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 6px', border: 'none',
              borderTop: `2px solid ${active === t.key ? t.color : 'transparent'}`,
              background: active === t.key ? `${t.color}10` : 'transparent',
              color: active === t.key ? t.color : C.muted,
              fontSize: 11, fontWeight: active === t.key ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.1s',
              borderRight: t.key !== 'note' ? `1px solid ${C.border}` : 'none',
            }}>
            <t.icon size={11} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Compose area */}
      {active && (
        <div style={{ padding: '10px 14px 12px' }}>
          {/* AI draft confirmation banner */}
          {drafted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10,
              padding: '7px 10px', borderRadius: 6,
              background: 'rgba(63,185,80,0.08)', border: `1px solid ${C.green}33`,
              fontSize: 11, color: C.green, fontWeight: 600 }}>
              <CheckCircle2 size={12} />
              Katana draft generated — scroll up to review and approve
            </div>
          )}

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              active === 'customer' ? 'Reply to customer…'
              : active === 'courier'  ? 'Message to courier…'
              : 'Add an internal note (visible to team only)…'
            }
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 7, padding: '9px 12px', color: C.text,
              fontSize: 12, lineHeight: 1.6, resize: 'none', outline: 'none',
              fontFamily: 'inherit', display: 'block',
            }}
            onFocus={e => e.target.style.borderColor = `${accent}55`}
            onBlur={e => e.target.style.borderColor = C.border}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) send(); }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            {/* AI draft button (only for customer/courier) */}
            {active !== 'note' ? (
              <button onClick={generateDraft} disabled={generating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: generating ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)', borderRadius: 5,
                  color: generating ? C.muted : '#C4B5FD',
                  fontSize: 11, fontWeight: 600, padding: '5px 12px',
                  cursor: generating ? 'not-allowed' : 'pointer',
                }}>
                <Sparkles size={11} />
                {generating ? 'Generating…' : drafted ? 'Regenerate Draft' : 'Katana Draft'}
              </button>
            ) : <div />}

            {/* Send button */}
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: sending || !text.trim() ? `${accent}10` : `${accent}1A`,
                border: `1px solid ${accent}55`, borderRadius: 6,
                color: text.trim() ? '#3B82F6' : C.muted,
                fontSize: 12, fontWeight: 700, padding: '6px 18px',
                cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.1s',
              }}>
              <Send size={12} />
              {sending ? 'Sending…' : active === 'note' ? 'Save Note' : 'Send'}
            </button>
          </div>
          {active !== 'note' && (
            <div style={{ fontSize: 9, color: C.muted, marginTop: 5 }}>
              ⌘+Enter to send · Or use Katana Draft above — it saves to the thread for your review
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  // Fetch ticket + emails
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn:  () => api.get(`/queries/${id}`).then(r => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Fetch staff list
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn:  () => api.get('/staff').then(r => r.data),
    staleTime: 300_000,
  });

  // Fetch tracking if consignment present
  const consignment = ticket?.consignment_number;
  const { data: trackingData } = useQuery({
    queryKey: ['ticket-tracking', consignment],
    queryFn:  () => api.get(`/tracking/${encodeURIComponent(consignment)}`).then(r => r.data),
    enabled:  !!consignment,
    staleTime: 60_000,
  });

  // PATCH mutation for sidebar fields
  const patch = useMutation({
    mutationFn: (body) => api.patch(`/queries/${id}`, body).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries(['ticket', id]),
  });

  const [approving, setApproving] = useState(false);

  // Mark emails as read on load
  useEffect(() => {
    if (ticket?.id) {
      api.post(`/queries/${ticket.id}/mark-read`).catch(() => {});
    }
  }, [ticket?.id]);

  async function handleApproved() {
    qc.invalidateQueries(['ticket', id]);
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: C.muted }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
        Loading ticket…
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.red }}>
        <AlertTriangle size={28} style={{ marginBottom: 10 }} />
        <div>Ticket not found</div>
        <button onClick={() => navigate('/queries')} style={{
          marginTop: 14, background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 6, color: C.muted, padding: '7px 14px', cursor: 'pointer',
        }}>
          ← Back to tickets
        </button>
      </div>
    );
  }

  const emails       = ticket.emails || [];
  const priority     = PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium;
  const status       = STATUS_CFG[ticket.status]    || { label: ticket.status, color: C.muted };
  const courierLogo  = ticket.courier_code ? getCourierLogo(ticket.courier_code) : null;
  const trackEvents  = (trackingData?.events || trackingData?.parcel?.events || []);
  const parcel       = trackingData?.parcel || trackingData || null;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, background: C.header, borderBottom: `1px solid ${C.border}` }}>
        {/* Row 1: back · customer name · type badge · status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 8px' }}>
          <button onClick={() => navigate('/queries')} style={{
            width: 26, height: 26, borderRadius: 6, border: 'none',
            background: 'rgba(255,255,255,0.06)', color: C.sub,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <ArrowLeft size={13} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-0.02em',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ticket.customer_name || ticket.subject}
          </span>
          {ticket.query_type && (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.amber,
              background: C.amberDim, border: `1px solid ${C.amber}33`,
              padding: '3px 10px', borderRadius: 5, flexShrink: 0,
              textTransform: 'capitalize', letterSpacing: '0.01em' }}>
              {ticket.query_type.replace(/_/g, ' ')}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: status.color,
            background: `${status.color}18`, border: `1px solid ${status.color}33`,
            padding: '3px 10px', borderRadius: 5, flexShrink: 0, marginLeft: 'auto' }}>
            {status.label}
          </span>
        </div>
        {/* Row 2: courier logo · consignment · parcel status · divider · ticket# */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 10px', paddingLeft: 52 }}>
          {courierLogo && (
            <div style={{ background: '#fff', borderRadius: 3, padding: '2px 5px', display: 'flex', alignItems: 'center', height: 18 }}>
              <img src={courierLogo} alt="" style={{ height: 12, objectFit: 'contain' }} />
            </div>
          )}
          {consignment && (
            <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '2px 8px', color: '#6A8BAA', letterSpacing: '0.03em' }}>
              {consignment}
            </span>
          )}
          {parcel?.status && (() => {
            const ps = TRACK_STATUS[parcel.status] || TRACK_STATUS.unknown;
            return (
              <span style={{ fontSize: 12, fontWeight: 700, color: ps.color }}>{ps.label}</span>
            );
          })()}
          {(consignment || courierLogo) && ticket.ticket_number && (
            <div style={{ width: 1, height: 12, background: C.border, marginLeft: 2 }} />
          )}
          {ticket.ticket_number && (
            <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', fontWeight: 700 }}>
              #{ticket.ticket_number}
            </span>
          )}
          {ticket.requires_attention && (
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: C.red,
              background: C.redDim, border: `1px solid ${C.red}33`,
              padding: '2px 7px', borderRadius: 4 }}>⚠ NEEDS ATTENTION</span>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: thread + compose ───────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <ThreadArea
            emails={emails}
            queryId={id}
            courierName={ticket.courier_name}
            courierCode={ticket.courier_code}
            approving={approving}
            onApproved={handleApproved}
          />
          <UnifiedComposeBar
            queryId={id}
            courierName={ticket.courier_name}
            onSent={() => qc.invalidateQueries(['ticket', id])}
          />
        </div>

        {/* ── Right sidebar ─────────────────────────────────────── */}
        <div style={{
          width: 196, flexShrink: 0,
          background: C.bg, borderLeft: `1px solid ${C.border}`,
          overflowY: 'auto', padding: '14px 14px 32px',
        }}>
          {/* SLA */}
          <SlaChip
            sla_due_at={ticket.sla_due_at}
            sla_breached={ticket.sla_breached}
            sla_mins_remaining={ticket.sla_mins_remaining}
          />
          {ticket.sla_due_at && <div style={{ marginBottom: 12 }} />}

          {/* Ticket section */}
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1E3A5A', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 8 }}>Ticket</div>

          <PropRow icon={AlertTriangle} label="Priority">
            <InlineSelect
              value={ticket.priority || 'medium'}
              onChange={v => patch.mutate({ priority: v })}
              options={Object.entries(PRIORITY_CFG).map(([k, v]) => ({ value: k, label: v.label }))}
              colorMap={PRIORITY_CFG}
            />
          </PropRow>

          <PropRow icon={Tag} label="Status">
            <InlineSelect
              value={ticket.status}
              onChange={v => patch.mutate({ status: v })}
              options={Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))}
              colorMap={STATUS_CFG}
            />
          </PropRow>

          <PropRow icon={Users} label="Group">
            <InlineSelect
              value={ticket.group_name || ''}
              onChange={v => patch.mutate({ group_name: v || null })}
              options={[{ value: '', label: '— Unassigned —' }, ...GROUPS.map(g => ({ value: g, label: g }))]}
            />
          </PropRow>

          <PropRow icon={User} label="Assignee">
            <InlineSelect
              value={ticket.assigned_to || ''}
              onChange={v => patch.mutate({ assigned_to: v || null })}
              options={[
                { value: '', label: '— Unassigned —' },
                ...staffList.map(s => ({ value: s.id, label: s.full_name || s.name })),
              ]}
            />
          </PropRow>

          <PropRow icon={Clock} label="Opened">
            <div style={{ fontSize: 11, color: C.sub }}>{fmtDate(ticket.created_at)}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{timeAgo(ticket.created_at)}</div>
          </PropRow>

          {ticket.query_type && (
            <PropRow icon={FileText} label="Type">
              <div style={{ fontSize: 11, color: C.sub, textTransform: 'capitalize' }}>
                {ticket.query_type.replace(/_/g, ' ')}
              </div>
            </PropRow>
          )}

          {/* Attention */}
          {ticket.requires_attention && ticket.attention_reason && (
            <div style={{ margin: '10px 0', padding: '8px 10px', borderRadius: 6,
              background: C.amberDim, border: `1px solid ${C.amber}33`,
              fontSize: 11, color: C.amber, lineHeight: 1.45 }}>
              ⚠ {ticket.attention_reason}
            </div>
          )}

          {/* Customer section */}
          {(ticket.customer_name || ticket.sender_email) && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1E3A5A', textTransform: 'uppercase',
                letterSpacing: '0.08em', margin: '14px 0 8px' }}>Customer</div>

              {ticket.customer_name && (
                <PropRow icon={Building2} label="Account">
                  <button
                    onClick={() => ticket.customer_id && navigate(`/customers/${ticket.customer_id}`)}
                    style={{ background: 'none', border: 'none', color: C.blue, fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                    {ticket.customer_name}
                  </button>
                </PropRow>
              )}

              {ticket.sender_email && (
                <PropRow icon={Mail} label="Email">
                  <div style={{ fontSize: 11, color: C.sub, wordBreak: 'break-all' }}>{ticket.sender_email}</div>
                </PropRow>
              )}
            </>
          )}

          {/* Parcel + tracking section */}
          {consignment && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1E3A5A', textTransform: 'uppercase',
                letterSpacing: '0.08em', margin: '14px 0 8px' }}>
                Parcel
                <a
                  href={`/tracking?q=${encodeURIComponent(consignment)}`}
                  onClick={e => { e.preventDefault(); navigate(`/tracking?q=${encodeURIComponent(consignment)}`); }}
                  style={{ marginLeft: 6, color: C.blue, fontSize: 9, cursor: 'pointer', textDecoration: 'none' }}>
                  <ExternalLink size={9} style={{ display: 'inline' }} />
                </a>
              </div>

              {courierLogo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#fff', borderRadius: 3, padding: 2, flexShrink: 0 }}>
                    <img src={courierLogo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.sub }}>{ticket.courier_name}</span>
                </div>
              )}

              <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: C.text,
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '4px 8px', marginBottom: 8, wordBreak: 'break-all' }}>
                {consignment}
              </div>

              {parcel?.status && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Status</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'capitalize' }}>
                    {parcel.status.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {parcel?.recipient_postcode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Postcode</span>
                  <span style={{ fontSize: 11, color: C.sub }}>{parcel.recipient_postcode}</span>
                </div>
              )}
              {parcel?.estimated_delivery && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Est. delivery</span>
                  <span style={{ fontSize: 11, color: C.sub }}>
                    {new Date(parcel.estimated_delivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
              {parcel?.delivered_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Delivered</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>
                    {new Date(parcel.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}

              {/* Mini tracking timeline */}
              {trackEvents.length > 0 && (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#1E3A5A', textTransform: 'uppercase',
                    letterSpacing: '0.08em', margin: '12px 0 8px' }}>
                    Tracking ({trackEvents.length} events)
                  </div>
                  <TrackingMiniTimeline events={trackEvents} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
