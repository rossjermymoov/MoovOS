/**
 * TicketDetailPage  —  /queries/:id
 *
 * Full-page ticket view. Three tabs in the main area:
 *   Customer Thread  — inbound/outbound emails with the customer
 *   Courier Thread   — outbound/inbound emails with the courier
 *   Notes            — internal notes
 *
 * Right sidebar:
 *   SLA countdown · Priority · Status · Assignee · Group
 *   Customer info
 *   Parcel tracking events (from consignment number)
 */

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, Clock, AlertTriangle, CheckCircle2, User, Users,
  Package, Truck, Mail, MessageSquare, FileText, Send, ChevronDown,
  Globe, MapPin, RotateCcw, Zap, RefreshCw, ExternalLink,
  Tag, Building2, Phone, PackageCheck, PackageX, Store, ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { getCourierLogo } from '../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });

// ─── Design tokens ────────────────────────────────────────────
const C = {
  bg:       '#0D1117',
  surface:  '#161B22',
  card:     '#1C2128',
  hover:    '#21262D',
  border:   'rgba(255,255,255,0.08)',
  green:    '#3FB950',
  amber:    '#D29922',
  red:      '#F85149',
  blue:     '#58A6FF',
  purple:   '#BC8CFF',
  text:     '#E6EDF3',
  sub:      '#C9D1D9',
  muted:    '#7D8590',
  greenDim: 'rgba(63,185,80,0.12)',
  amberDim: 'rgba(210,153,34,0.12)',
  redDim:   'rgba(248,81,73,0.12)',
  blueDim:  'rgba(88,166,255,0.12)',
};

// ─── Config maps ──────────────────────────────────────────────
const PRIORITY_CFG = {
  urgent: { label: 'Urgent',  color: C.red,    dot: '#F85149' },
  high:   { label: 'High',    color: C.amber,  dot: '#D29922' },
  medium: { label: 'Medium',  color: C.blue,   dot: '#58A6FF' },
  low:    { label: 'Low',     color: C.muted,  dot: '#7D8590' },
};

const STATUS_CFG = {
  open:                    { label: 'Open',              color: C.blue  },
  awaiting_customer_info:  { label: 'Awaiting Customer', color: C.amber },
  info_received:           { label: 'Info Received',     color: C.green },
  drafting:                { label: 'Drafting',          color: C.green },
  awaiting_courier:        { label: 'Awaiting Courier',  color: C.amber },
  courier_replied:         { label: 'Courier Replied',   color: C.green },
  courier_investigating:   { label: 'Investigating',     color: C.amber },
  awaiting_customer:       { label: 'Awaiting Customer', color: C.amber },
  claim_raised:            { label: 'Claim Raised',      color: C.red   },
  awaiting_claim_docs:     { label: 'Awaiting Docs',     color: C.red   },
  claim_submitted:         { label: 'Claim Submitted',   color: C.amber },
  resolved:                { label: 'Resolved',          color: C.green },
  resolved_claim_approved: { label: 'Claim Approved',    color: C.green },
  resolved_claim_rejected: { label: 'Claim Rejected',    color: C.red   },
  escalated:               { label: 'Escalated',         color: C.red   },
};

const GROUPS = [
  'Delivery Enquiries',
  'Claims',
  'Accounts',
  'Technical',
  'General',
];

// ─── Helpers ──────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  if (!ts) return '—';
  const secs = (Date.now() - new Date(ts)) / 1000;
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function SlaTimer({ sla_due_at, sla_breached, sla_mins_remaining }) {
  if (!sla_due_at) return null;
  const breached = sla_breached;
  const mins     = sla_mins_remaining;

  let label, color;
  if (breached) {
    label = 'SLA Breached';
    color = C.red;
  } else if (mins < 60) {
    label = `${Math.round(mins)}m remaining`;
    color = C.red;
  } else if (mins < 240) {
    label = `${Math.round(mins / 60)}h remaining`;
    color = C.amber;
  } else {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    label = m > 0 ? `${h}h ${m}m remaining` : `${h}h remaining`;
    color = C.green;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
      borderRadius: 7, background: `${color}12`, border: `1px solid ${color}30`,
      marginBottom: 12,
    }}>
      <Clock size={13} color={color} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>
        <div style={{ fontSize: 10, color: C.muted }}>Due {fmtDate(sla_due_at)}</div>
      </div>
    </div>
  );
}

// ─── Sidebar property row ─────────────────────────────────────
function PropRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <Icon size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
        {children}
      </div>
    </div>
  );
}

// ─── Inline select ────────────────────────────────────────────
function InlineSelect({ value, onChange, options, colorMap }) {
  const color = colorMap?.[value]?.color || C.text;
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'transparent', border: 'none', outline: 'none',
        color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        padding: 0, width: '100%', appearance: 'none',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ background: C.card, color: C.text }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Email bubble ─────────────────────────────────────────────
function EmailBubble({ email, courierCode }) {
  const [expanded, setExpanded] = useState(true);
  const isInbound  = email.direction.startsWith('inbound');
  const isCourier  = email.direction.includes('courier');
  const isDraft    = email.is_ai_draft && !email.sent_at;

  const bubbleColor = isDraft ? C.purple : isInbound ? C.surface : C.card;
  const borderColor = isDraft ? `${C.purple}40` : isInbound ? C.border : 'rgba(88,166,255,0.2)';

  // Courier logo — only show on courier thread emails
  const courierLogoUrl = isCourier && courierCode ? getCourierLogo(courierCode) : null;

  // Strip reply chains — show only first section
  const bodyLines   = (email.body_text || '').split('\n');
  const cutoff      = bodyLines.findIndex(l => l.startsWith('On ') && l.includes('wrote:'));
  const displayBody = cutoff > 0 ? bodyLines.slice(0, cutoff).join('\n').trim() : (email.body_text || '').trim();

  return (
    <div style={{
      marginBottom: 12,
      padding: '14px 16px',
      background: bubbleColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 9,
      position: 'relative',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: expanded ? 12 : 0, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        {/* Avatar / logo */}
        {courierLogoUrl ? (
          <div style={{
            width: 32, height: 22, borderRadius: 5, flexShrink: 0,
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2px 4px', border: `1px solid rgba(255,255,255,0.15)`,
          }}>
            <img src={courierLogoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: isInbound ? C.blue : C.green, opacity: 0.9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#000',
          }}>
            {(email.from_address || '?')[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            {email.from_address}
            {isDraft && (
              <span style={{ fontSize: 10, fontWeight: 700, color: C.purple, background: `${C.purple}20`, padding: '1px 7px', borderRadius: 4, border: `1px solid ${C.purple}40` }}>
                AI DRAFT
              </span>
            )}
            {!email.sent_at && !isDraft && (
              <span style={{ fontSize: 10, color: C.amber }}>unsent</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {email.direction === 'inbound_customer' && 'Customer → Moov Parcel'}
            {email.direction === 'outbound_customer' && 'Moov Parcel → Customer'}
            {email.direction === 'inbound_courier' && 'Courier → Moov Parcel'}
            {email.direction === 'outbound_courier' && 'Moov Parcel → Courier'}
            {email.direction === 'note' && 'Internal Note'}
            <span style={{ marginLeft: 8, color: C.muted }}>{timeAgo(email.created_at)}</span>
          </div>
        </div>
        <ChevronDown size={13} color={C.muted} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </div>

      {/* Body */}
      {expanded && (
        <pre style={{
          margin: 0, fontFamily: 'inherit', fontSize: 13, color: C.sub,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6,
        }}>
          {displayBody || <span style={{ color: C.muted, fontStyle: 'italic' }}>No message body</span>}
        </pre>
      )}
    </div>
  );
}

// ─── Reply composer ───────────────────────────────────────────
function ReplyComposer({ queryId, direction, placeholder, onSent }) {
  const [text, setText]         = useState('');
  const [sending, setSend]      = useState(false);
  const [generating, setGen]    = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const qc                      = useQueryClient();

  const target    = direction.includes('courier') ? 'courier' : 'customer';
  const accentCol = target === 'courier' ? C.amber : C.blue;

  async function generateDraft() {
    setGen(true);
    try {
      const r = await fetch(`/api/queries/${queryId}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      // draft text can come back as body_text or text
      const body = d.body_text || d.text || '';
      setText(body);
      setHasDraft(true);
      // reload ticket so the AI DRAFT email badge shows
      qc.invalidateQueries(['ticket', queryId]);
    } catch (e) {
      alert('Failed to generate draft: ' + e.message);
    } finally {
      setGen(false);
    }
  }

  async function send() {
    if (!text.trim()) return;
    setSend(true);
    try {
      await api.post(`/queries/${queryId}/emails`, {
        direction,
        body_text: text.trim(),
        from_address: 'service@moovparcel.co.uk',
      });
      setText('');
      setHasDraft(false);
      qc.invalidateQueries(['ticket', queryId]);
      onSent?.();
    } catch (e) {
      console.error('[ReplyComposer]', e);
    } finally {
      setSend(false);
    }
  }

  return (
    <div style={{ padding: '12px 0 0', borderTop: `1px solid ${C.border}`, marginTop: 8 }}>

      {/* Simulation banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
        padding: '5px 10px', borderRadius: 5,
        background: 'rgba(210,153,34,0.08)', border: `1px solid ${C.amber}22`,
      }}>
        <AlertTriangle size={10} color={C.amber} />
        <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          Simulation — no emails will be sent
        </span>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={generating ? 'Generating AI draft…' : placeholder}
        rows={5}
        disabled={generating}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: C.card,
          border: `1px solid ${hasDraft ? `${accentCol}44` : C.border}`,
          borderRadius: 8, padding: '10px 14px', color: C.text,
          fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none',
          fontFamily: 'inherit', opacity: generating ? 0.5 : 1,
        }}
        onFocus={e => e.target.style.borderColor = `${accentCol}60`}
        onBlur={e => e.target.style.borderColor = hasDraft ? `${accentCol}44` : C.border}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        {/* AI draft button */}
        <button
          onClick={generateDraft}
          disabled={generating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: generating ? 'rgba(188,140,255,0.08)' : 'rgba(188,140,255,0.12)',
            border: `1px solid rgba(188,140,255,0.3)`, borderRadius: 6,
            color: generating ? C.muted : C.purple,
            fontSize: 12, fontWeight: 600, padding: '7px 14px',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          <Sparkles size={12} />
          {generating ? 'Generating…' : hasDraft ? 'Regenerate' : 'AI Draft'}
        </button>

        {/* Send button */}
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: sending || !text.trim() ? `${accentCol}10` : `${accentCol}1A`,
            border: `1px solid ${accentCol}50`, borderRadius: 7,
            color: text.trim() ? accentCol : C.muted,
            fontSize: 13, fontWeight: 700, padding: '8px 20px',
            cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={13} />
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// ─── Thread panel ─────────────────────────────────────────────
function ThreadPanel({ emails, directions, queryId, replyDirection, replyPlaceholder, courierCode }) {
  const filtered = emails.filter(e => directions.includes(e.direction));

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 0' }}>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <Mail size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>No messages yet</div>
        </div>
      ) : (
        filtered.map(email => (
          <EmailBubble key={email.id} email={email} courierCode={courierCode} />
        ))
      )}
      {replyDirection && (
        <ReplyComposer
          queryId={queryId}
          direction={replyDirection}
          placeholder={replyPlaceholder}
        />
      )}
    </div>
  );
}

// ─── Tracking components (exact replica of QueriesPage) ───────
const TRACK_STATUS = {
  booked:              { label: 'Booked',                       color: '#00BCD4', bg: 'rgba(0,188,212,0.12)',    icon: Package },
  collected:           { label: 'Collected',                    color: '#2196F3', bg: 'rgba(33,150,243,0.12)',   icon: Package },
  at_depot:            { label: 'At Hub',                       color: '#5C6BC0', bg: 'rgba(92,107,192,0.12)',   icon: Package },
  in_transit:          { label: 'In Transit',                   color: '#7B2FBE', bg: 'rgba(123,47,190,0.12)',   icon: Truck },
  out_for_delivery:    { label: 'Out for Delivery',             color: '#FFC107', bg: 'rgba(255,193,7,0.12)',    icon: Truck },
  failed_delivery:     { label: 'Failed Attempt',               color: '#F44336', bg: 'rgba(244,67,54,0.12)',    icon: AlertTriangle },
  delivered:           { label: 'Delivered',                    color: '#00C853', bg: 'rgba(0,200,83,0.12)',     icon: PackageCheck },
  on_hold:             { label: 'On Hold',                      color: '#FF9800', bg: 'rgba(255,152,0,0.12)',    icon: Clock },
  exception:           { label: 'Address Issue',                color: '#F44336', bg: 'rgba(244,67,54,0.12)',    icon: AlertTriangle },
  returned:            { label: 'Return to Sender',             color: '#607D8B', bg: 'rgba(96,125,139,0.12)',   icon: RotateCcw },
  tracking_expired:    { label: 'Tracking Expired',             color: '#757575', bg: 'rgba(117,117,117,0.12)',  icon: Clock },
  cancelled:           { label: 'Cancelled',                    color: '#757575', bg: 'rgba(117,117,117,0.12)',  icon: AlertTriangle },
  awaiting_collection: { label: 'Awaiting Customer Collection', color: '#FF6F00', bg: 'rgba(255,111,0,0.12)',    icon: Store },
  damaged:             { label: 'Damaged',                      color: '#E91E8C', bg: 'rgba(233,30,140,0.12)',   icon: PackageX },
  customs_hold:        { label: 'Customs Hold',                 color: '#9C27B0', bg: 'rgba(156,39,176,0.12)',   icon: ShieldAlert },
  unknown:             { label: 'Unknown',                      color: '#555555', bg: 'rgba(255,255,255,0.05)',  icon: Package },
};

function TrackingStatusBadge({ status }) {
  const cfg = TRACK_STATUS[status] || TRACK_STATUS.unknown;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 9999,
      background: cfg.bg, border: `1px solid ${cfg.color}44`,
      color: cfg.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function TrackingTimeline({ events }) {
  if (!events?.length) return (
    <div style={{ padding: '28px 0', textAlign: 'center', color: '#7D8590', fontSize: 12, fontStyle: 'italic' }}>
      No tracking events yet
    </div>
  );
  return (
    <div style={{ position: 'relative' }}>
      {events.map((ev, i) => {
        const cfg    = TRACK_STATUS[ev.status] || TRACK_STATUS.unknown;
        const isLast = i === events.length - 1;
        return (
          <div key={ev.id || i} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: isLast ? 0 : 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: cfg.bg,
                border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 1, flexShrink: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 16,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.03))' }} />
              )}
            </div>
            <div style={{ flex: 1, paddingTop: 2, paddingBottom: isLast ? 0 : 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <TrackingStatusBadge status={ev.status} />
                <span style={{ fontSize: 11, color: '#7D8590' }}>{timeAgo(ev.event_at)}</span>
              </div>
              {ev.description && (
                <p style={{ fontSize: 13, color: '#C9D1D9', margin: '3px 0' }}>{ev.description}</p>
              )}
              {ev.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7D8590', marginTop: 2 }}>
                  <MapPin size={11} /> {ev.location}
                </span>
              )}
              <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>
                {new Date(ev.event_at).toLocaleString('en-GB')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tracking panel content ────────────────────────────────────
function TrackingPanel({ consignmentNumber }) {
  const { data: parcel, isLoading } = useQuery({
    queryKey: ['ticket-tracking', consignmentNumber],
    queryFn:  () => api.get(`/tracking/${encodeURIComponent(consignmentNumber)}`).then(r => r.data),
    enabled:  !!consignmentNumber,
    staleTime: 60_000,
  });

  if (!consignmentNumber) {
    return (
      <div style={{ padding: '12px 0', color: '#7D8590', fontSize: 12, fontStyle: 'italic' }}>
        No consignment number on this ticket
      </div>
    );
  }

  if (isLoading) return <div style={{ fontSize: 12, color: '#7D8590' }}>Loading tracking…</div>;

  if (!parcel) return <div style={{ fontSize: 12, color: '#7D8590' }}>No tracking data found</div>;

  const trackingEvents = parcel.events || [];

  return (
    <div>
      {/* Delivery address box */}
      {(parcel.recipient_name || parcel.recipient_address || parcel.recipient_postcode) && (
        <div style={{ marginBottom: 20, padding: 14, background: 'rgba(0,188,212,0.05)',
          borderRadius: 10, border: '1px solid rgba(0,188,212,0.18)' }}>
          <div style={{ fontSize: 10, color: '#00BCD4', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={10} /> Delivery Address
          </div>
          {parcel.recipient_name && (
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {parcel.recipient_name}
            </div>
          )}
          {parcel.recipient_address && (
            <div style={{ fontSize: 12, color: '#CCC', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {parcel.recipient_address}
            </div>
          )}
          {parcel.recipient_postcode && (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#CCC',
              marginTop: parcel.recipient_address ? 2 : 0 }}>
              {parcel.recipient_postcode}
            </div>
          )}
          {(parcel.estimated_delivery || parcel.delivered_at) && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {parcel.estimated_delivery && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#AAAAAA' }}>Estimated delivery</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFC107' }}>
                    {new Date(parcel.estimated_delivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
              {parcel.delivered_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#AAAAAA' }}>Delivered</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#00C853' }}>
                    {new Date(parcel.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Event history label */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase',
        letterSpacing: '0.06em', marginBottom: 16 }}>
        Event History ({trackingEvents.length})
      </div>

      {/* Timeline */}
      <TrackingTimeline events={trackingEvents} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const [tab, setTab]             = useState('customer');
  const [showTracking, setShowTracking] = useState(false);

  // Fetch ticket + emails
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn:  () => api.get(`/queries/${id}`).then(r => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Fetch staff list for assignee dropdown
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn:  () => api.get('/staff').then(r => r.data),
    staleTime: 300_000,
  });

  // PATCH mutation for sidebar fields
  const patch = useMutation({
    mutationFn: (body) => api.patch(`/queries/${id}`, body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['ticket', id]),
  });

  // Mark inbound emails as read on load
  useEffect(() => {
    if (ticket?.id) {
      api.post(`/queries/${ticket.id}/mark-read`).catch(() => {});
    }
  }, [ticket?.id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: C.muted }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
        Loading ticket…
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.red }}>
        <AlertTriangle size={32} style={{ marginBottom: 12 }} />
        <div>Ticket not found</div>
        <button onClick={() => navigate('/queries')} style={{ marginTop: 16, background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, padding: '8px 16px', cursor: 'pointer' }}>
          ← Back to tickets
        </button>
      </div>
    );
  }

  const emails   = ticket.emails || [];
  const priority = PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium;
  const status   = STATUS_CFG[ticket.status]     || { label: ticket.status, color: C.muted };

  const courierEmails   = emails.filter(e => e.direction.includes('courier'));
  const customerEmails  = emails.filter(e => !e.direction.includes('courier') && e.direction !== 'note');
  const noteEmails      = emails.filter(e => e.direction === 'note');

  const courierLogoUrl = ticket.courier_code ? getCourierLogo(ticket.courier_code) : null;

  const tabs = [
    { key: 'customer', label: 'Customer', count: customerEmails.length, icon: Mail },
    { key: 'courier',  label: ticket.courier_name || 'Courier', count: courierEmails.length,  icon: Truck, logo: courierLogoUrl },
    { key: 'notes',    label: 'Notes',    count: noteEmails.length,     icon: FileText },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: C.bg, overflow: 'hidden' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 20px',
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button
          onClick={() => navigate('/queries')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          <ArrowLeft size={14} /> All Tickets
        </button>

        <div style={{ width: 1, height: 16, background: C.border }} />

        {/* Ticket number */}
        {ticket.ticket_number && (
          <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: 'monospace' }}>
            #{ticket.ticket_number}
          </span>
        )}

        {/* Subject */}
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ticket.subject}
        </span>

        {/* Priority badge */}
        <span style={{ fontSize: 11, fontWeight: 700, color: priority.color, background: `${priority.color}18`, border: `1px solid ${priority.color}30`, padding: '3px 10px', borderRadius: 5, flexShrink: 0 }}>
          {priority.label}
        </span>

        {/* Status badge */}
        <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: `${status.color}18`, border: `1px solid ${status.color}30`, padding: '3px 10px', borderRadius: 5, flexShrink: 0 }}>
          {status.label}
        </span>

        {/* Freshdesk ref */}
        {ticket.freshdesk_ticket_number && (
          <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
            FD#{ticket.freshdesk_ticket_number}
          </span>
        )}

        {/* Tracking button */}
        {ticket.consignment_number && (
          <button
            onClick={() => setShowTracking(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 13px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${showTracking ? C.blue : `${C.blue}44`}`,
              background: showTracking ? `${C.blue}1A` : 'transparent',
              color: showTracking ? C.blue : C.muted,
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            <Truck size={12} />
            Track
          </button>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Main area ───────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 0, padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 16px',
                  background: 'none', border: 'none',
                  borderBottom: tab === t.key ? `2px solid ${C.blue}` : '2px solid transparent',
                  color: tab === t.key ? C.blue : C.muted,
                  fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
                  cursor: 'pointer', transition: 'color 0.15s',
                }}
              >
                {t.logo ? (
                  <div style={{ background: '#fff', borderRadius: 3, padding: '1px 4px', display: 'flex', alignItems: 'center' }}>
                    <img src={t.logo} alt="" style={{ height: 12, objectFit: 'contain', display: 'block' }} />
                  </div>
                ) : (
                  <t.icon size={13} />
                )}
                {t.label}
                {t.count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: tab === t.key ? C.blueDim : 'rgba(255,255,255,0.06)', color: tab === t.key ? C.blue : C.muted, padding: '1px 6px', borderRadius: 10 }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Thread panels */}
          {tab === 'customer' && (
            <ThreadPanel
              emails={emails}
              directions={['inbound_customer', 'outbound_customer']}
              queryId={id}
              replyDirection="outbound_customer"
              replyPlaceholder="Reply to customer…"
            />
          )}
          {tab === 'courier' && (
            <ThreadPanel
              emails={emails}
              directions={['inbound_courier', 'outbound_courier']}
              queryId={id}
              replyDirection="outbound_courier"
              replyPlaceholder="Message to courier (DPD, DHL, etc.)…"
              courierCode={ticket.courier_code}
            />
          )}
          {tab === 'notes' && (
            <ThreadPanel
              emails={emails}
              directions={['note']}
              queryId={id}
              replyDirection="note"
              replyPlaceholder="Add an internal note…"
            />
          )}
        </div>

        {/* ── Right sidebar ────────────────────────────────── */}
        <div style={{
          width: 300, flexShrink: 0,
          background: C.surface,
          borderLeft: `1px solid ${C.border}`,
          overflow: 'auto',
          padding: '16px 16px 40px',
        }}>

          {/* SLA timer */}
          <SlaTimer
            sla_due_at={ticket.sla_due_at}
            sla_breached={ticket.sla_breached}
            sla_mins_remaining={ticket.sla_mins_remaining}
          />

          {/* ── Ticket properties ── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Ticket
          </div>

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
            {ticket.assignee_name && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{ticket.assignee_name}</div>
            )}
          </PropRow>

          <PropRow icon={Clock} label="Created">
            <div style={{ fontSize: 12, color: C.sub }}>{fmtDate(ticket.created_at)}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{timeAgo(ticket.created_at)}</div>
          </PropRow>

          {ticket.query_type && (
            <PropRow icon={FileText} label="Type">
              <div style={{ fontSize: 12, color: C.sub, textTransform: 'capitalize' }}>
                {ticket.query_type.replace(/_/g, ' ')}
              </div>
            </PropRow>
          )}

          {/* ── Customer ── */}
          {(ticket.customer_name || ticket.sender_email) && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' }}>
                Customer
              </div>

              {ticket.customer_name && (
                <PropRow icon={Building2} label="Account">
                  <button
                    onClick={() => ticket.customer_id && navigate(`/customers/${ticket.customer_id}`)}
                    style={{ background: 'none', border: 'none', color: C.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  >
                    {ticket.customer_name}
                  </button>
                </PropRow>
              )}

              {ticket.sender_email && (
                <PropRow icon={Mail} label="Email">
                  <div style={{ fontSize: 12, color: C.sub, wordBreak: 'break-all' }}>{ticket.sender_email}</div>
                </PropRow>
              )}
            </>
          )}

          {/* ── Courier ── */}
          {ticket.courier_name && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' }}>
                Courier
              </div>
              <PropRow icon={Truck} label="Carrier">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getCourierLogo(ticket.courier_code) && (
                    <img src={getCourierLogo(ticket.courier_code)} alt="" style={{ height: 16, objectFit: 'contain' }} />
                  )}
                  <span style={{ fontSize: 13, color: C.sub }}>{ticket.courier_name}</span>
                </div>
              </PropRow>
              {ticket.service_name && (
                <PropRow icon={Package} label="Service">
                  <div style={{ fontSize: 12, color: C.sub }}>{ticket.service_name}</div>
                </PropRow>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── Tracking slide-in drawer ─────────────────────────── */}
      {/* Backdrop */}
      {showTracking && (
        <div
          onClick={() => setShowTracking(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 360,
        background: '#0A0E1A',
        borderLeft: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        transform: showTracking ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: showTracking ? '-8px 0 32px rgba(0,0,0,0.5)' : 'none',
      }}>
        {/* Drawer header */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: `1px solid rgba(255,255,255,0.08)`,
        }}>
          <Truck size={14} color={C.blue} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Consignment Tracking
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
              {ticket.consignment_number}
            </div>
          </div>
          {ticket.courier_code && getCourierLogo(ticket.courier_code) && (
            <div style={{ background: '#fff', borderRadius: 5, padding: '3px 6px', flexShrink: 0 }}>
              <img src={getCourierLogo(ticket.courier_code)} alt="" style={{ height: 18, objectFit: 'contain', display: 'block' }} />
            </div>
          )}
          <button
            onClick={() => setShowTracking(false)}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
          <TrackingPanel
            consignmentNumber={ticket.consignment_number}
            courierCode={ticket.courier_code}
          />
        </div>
      </div>
    </div>
  );
}
