import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Mail, Clock, User,
  Inbox, RefreshCw, MessageSquare, FileText,
  Send, Edit2, Flag, Link2,
  AlertCircle, Package, Filter, Search, X, ExternalLink, Receipt,
  Phone, MapPin, Truck, Sparkles, ChevronDown, ChevronUp,
  PackageCheck, PackageX, RotateCcw, ShieldAlert, Store,
} from 'lucide-react';
import {
  fetchInbox, fetchStats, fetchQuery, updateQuery,
  approveEmail, flagAttention, fetchUnmatched, mapSender,
  fetchSenderSuggestions,
} from '../../api/queries';
import { getCourierLogo } from '../../utils/courierLogos';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Design tokens — professional dark, not neon ──────────────────────────────

const C = {
  bg:       '#0D1117',
  surface:  '#161B22',
  card:     '#1C2128',
  hover:    '#21262D',
  selected: '#1F2937',
  border:   'rgba(255,255,255,0.08)',
  green:    '#3FB950',
  amber:    '#D29922',
  red:      '#F85149',
  blue:     '#58A6FF',
  text:     '#E6EDF3',
  sub:      '#C9D1D9',
  muted:    '#7D8590',
  greenDim: 'rgba(63,185,80,0.12)',
  amberDim: 'rgba(210,153,34,0.12)',
  redDim:   'rgba(248,81,73,0.12)',
  blueDim:  'rgba(88,166,255,0.12)',
};

const STATUS_CFG = {
  open:                    { label: 'Open',              color: C.blue,  bg: C.blueDim },
  awaiting_customer_info:  { label: 'Awaiting Customer', color: C.amber, bg: C.amberDim },
  info_received:           { label: 'Info Received',     color: C.green, bg: C.greenDim },
  drafting:                { label: 'Drafting',          color: C.green, bg: C.greenDim },
  awaiting_courier:        { label: 'Awaiting Courier',  color: C.amber, bg: C.amberDim },
  courier_replied:         { label: 'Courier Replied',   color: C.green, bg: C.greenDim },
  courier_investigating:   { label: 'Investigating',     color: C.amber, bg: C.amberDim },
  awaiting_customer:       { label: 'Awaiting Customer', color: C.amber, bg: C.amberDim },
  claim_raised:            { label: 'Claim Raised',      color: C.red,   bg: C.redDim },
  awaiting_claim_docs:     { label: 'Awaiting Docs',     color: C.red,   bg: C.redDim },
  claim_submitted:         { label: 'Claim Submitted',   color: C.amber, bg: C.amberDim },
  resolved:                { label: 'Resolved',          color: C.green, bg: C.greenDim },
  resolved_claim_approved: { label: 'Claim Approved',    color: C.green, bg: C.greenDim },
  resolved_claim_rejected: { label: 'Claim Rejected',    color: C.red,   bg: C.redDim },
  escalated:               { label: 'Escalated',         color: C.red,   bg: C.redDim },
};

const TYPE_CFG = {
  whereabouts:    { label: 'WISMO',           color: C.blue },
  not_delivered:  { label: 'Not Delivered',   color: C.red },
  wrong_address:  { label: 'Wrong Address',   color: C.red },
  damaged:        { label: 'Damaged',         color: C.red },
  missing_items:  { label: 'Missing Items',   color: C.red },
  failed_delivery:{ label: 'Failed Delivery', color: C.amber },
  returned:       { label: 'Returned',        color: C.amber },
  delay:          { label: 'Delay',           color: C.amber },
  other:          { label: 'Other',           color: C.muted },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ label, color, bg, small }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: small ? '2px 7px' : '3px 10px',
      borderRadius: 4,
      fontSize: small ? 10 : 11,
      fontWeight: 600,
      background: bg || `${color}22`,
      color,
      whiteSpace: 'nowrap',
      border: `1px solid ${color}33`,
    }}>{label}</span>
  );
}

function StatusBadge({ status, small }) {
  const cfg = STATUS_CFG[status] || { label: status, color: C.muted, bg: 'rgba(125,133,144,0.1)' };
  return <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} small={small} />;
}

function TypeBadge({ type, small }) {
  const cfg = TYPE_CFG[type] || { label: type, color: C.muted };
  return <Badge label={cfg.label} color={cfg.color} small={small} />;
}

function timeAgo(ts) {
  if (!ts) return '—';
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60)    return 'just now';
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Tracking timeline — carbon copy of TrackingPage STATUS + EventTimeline ───

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
      padding: '3px 9px',
      borderRadius: 9999,
      background: cfg.bg,
      border: `1px solid ${cfg.color}44`,
      color: cfg.color,
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function TrackingTimeline({ events }) {
  if (!events?.length) return (
    <div style={{ padding: '28px 0', textAlign: 'center', color: C.muted, fontSize: 12, fontStyle: 'italic' }}>
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
                <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(ev.event_at)}</span>
              </div>
              {ev.description && (
                <p style={{ fontSize: 13, color: C.sub, margin: '3px 0' }}>{ev.description}</p>
              )}
              {ev.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, marginTop: 2 }}>
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

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, sub, onClick, active, icon: Icon, warn }) {
  const col = warn && value > 0 ? color : value === 0 ? C.muted : color;
  return (
    <button onClick={onClick} style={{
      flex: '1 1 110px', minWidth: 90,
      background: active ? `${color}14` : C.card,
      border: `1px solid ${active ? color : value > 0 && warn ? `${color}40` : C.border}`,
      borderRadius: 8, padding: '12px 14px',
      cursor: onClick ? 'pointer' : 'default',
      textAlign: 'left', transition: 'all 0.15s', outline: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        {Icon && <Icon size={11} style={{ color: col, flexShrink: 0 }} />}
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: active ? color : value > 0 && warn ? color : C.text, lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </button>
  );
}

// ─── SLA timer helpers ────────────────────────────────────────────────────────

function formatSlaTime(mins) {
  if (mins === null || mins === undefined) return null;
  const abs = Math.abs(mins);
  const breached = mins < 0;
  let label;
  if (abs < 60)        label = `${Math.round(abs)}m`;
  else if (abs < 1440) label = `${Math.floor(abs / 60)}h ${Math.round(abs % 60)}m`;
  else                 label = `${Math.floor(abs / 1440)}d ${Math.floor((abs % 1440) / 60)}h`;
  return { label, breached };
}

function SlaChip({ mins, policyName }) {
  if (mins === null || mins === undefined) return null;
  const info = formatSlaTime(mins);
  if (!info) return null;

  // Colour bands: green > 25% time unused, amber < 25% or < 4h, red breached
  const color = info.breached ? C.red : mins < 240 ? C.amber : C.green;
  const bg    = info.breached ? C.redDim : mins < 240 ? C.amberDim : 'rgba(0,200,83,0.1)';

  return (
    <span title={policyName || 'SLA'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 9, fontWeight: 700, color,
      background: bg, padding: '1px 6px',
      borderRadius: 3, border: `1px solid ${color}33`,
      whiteSpace: 'nowrap',
    }}>
      ⏱ {info.breached ? '−' : ''}{info.label}
    </span>
  );
}

// ─── Inbox list row ───────────────────────────────────────────────────────────

const CLAIM_STATUSES = new Set(['claim_raised','awaiting_claim_docs','claim_submitted','resolved_claim_approved','resolved_claim_rejected']);

function InboxRow({ q, selected, onClick }) {
  const hasAttention   = q.requires_attention;
  const hasSlaBreached = q.sla_breached;
  const isClaim        = CLAIM_STATUSES.has(q.status);
  const unread         = parseInt(q.unread_emails) || 0;
  const hasNewReply    = q.has_new_reply;

  // Left accent: attention > new reply > sla breach > selected > neutral
  const accentColor = hasAttention  ? C.red
                    : hasNewReply   ? C.blue
                    : hasSlaBreached ? C.amber
                    : 'transparent';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 5,
        padding: '12px 14px 12px 12px',
        cursor: 'pointer',
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${selected ? C.blue : accentColor}`,
        background: selected
          ? C.selected
          : hasNewReply && !selected
            ? 'rgba(41,121,255,0.04)'
            : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.hover; }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.background =
          hasNewReply ? 'rgba(41,121,255,0.04)' : 'transparent';
      }}
    >
      {/* Row 1: customer name + timestamp + unread badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          flex: 1, fontSize: 15,
          fontWeight: hasNewReply ? 800 : 700,
          color: hasNewReply ? C.text : C.sub,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {q.customer_name || 'Unknown Customer'}
        </span>
        <span style={{
          fontSize: 10, flexShrink: 0,
          color: hasNewReply ? C.blue : C.muted,
          fontWeight: hasNewReply ? 700 : 400,
        }}>
          {timeAgo(q.latest_email_at || q.created_at)}
        </span>
        {/* Unread count badge */}
        {unread > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 18, height: 18, borderRadius: 9999,
            background: C.blue, color: '#fff',
            fontSize: 10, fontWeight: 800, padding: '0 5px', flexShrink: 0,
          }}>
            {unread}
          </span>
        )}
      </div>

      {/* Row 2: subject */}
      <div style={{
        fontSize: 12,
        color: hasNewReply ? C.text : C.sub,
        fontWeight: hasNewReply ? 600 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {q.subject || q.consignment_number || 'No subject'}
      </div>

      {/* Row 3: status + attention + SLA + type icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap' }}>
        <StatusBadge status={q.status} small />
        {hasAttention && (
          <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.redDim,
            padding: '1px 6px', borderRadius: 3, border: `1px solid ${C.red}33` }}>
            ⚠ ATTENTION
          </span>
        )}
        {hasNewReply && !hasAttention && (
          <span style={{ fontSize: 9, fontWeight: 700, color: C.blue,
            background: 'rgba(41,121,255,0.12)', padding: '1px 6px',
            borderRadius: 3, border: `1px solid ${C.blue}44` }}>
            ↩ NEW REPLY
          </span>
        )}
        {/* SLA timer — show if we have remaining time data */}
        {!hasAttention && q.sla_mins_remaining !== null && q.sla_mins_remaining !== undefined && (
          <SlaChip mins={parseFloat(q.sla_mins_remaining)} policyName={q.sla_policy_name} />
        )}
        <div style={{ flex: 1 }} />
        {isClaim ? (
          <Receipt size={20} color={C.red} strokeWidth={1.5} title="Claim" />
        ) : (
          <AlertTriangle size={22} fill={C.amber} color={C.amber} strokeWidth={0} title="Query" />
        )}
      </div>

      {/* Row 4: email preview */}
      {q.latest_email_preview && (
        <div style={{
          fontSize: 11,
          color: hasNewReply ? C.sub : C.muted,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {q.latest_email_preview.substring(0, 90)}
        </div>
      )}
    </div>
  );
}

// ─── Email thread item ────────────────────────────────────────────────────────

function EmailItem({ email, onApprove, onEdit, approving, courierName, courierCode }) {
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState(email.body_text || '');
  const isDraft = email.is_ai_draft && !email.sent_at && !email.ai_draft_approved_by;
  const isSent  = !!email.sent_at;
  const dir     = email.direction;

  const isCustomerThread = dir === 'inbound_customer' || dir === 'outbound_customer';
  const isCourierThread  = dir === 'inbound_courier'  || dir === 'outbound_courier';
  const isNote           = dir === 'internal_note';

  let threadColor, threadLabel, logo;
  if (dir === 'inbound_customer')  { threadColor = C.blue;  threadLabel = 'From Customer'; }
  else if (dir === 'outbound_customer') { threadColor = C.green; threadLabel = 'To Customer'; }
  else if (dir === 'inbound_courier')   { threadColor = C.amber; threadLabel = `From ${courierName || 'Courier'}`; logo = courierCode; }
  else if (dir === 'outbound_courier')  { threadColor = C.amber; threadLabel = `To ${courierName || 'Courier'}`; logo = courierCode; }
  else { threadColor = C.muted; threadLabel = 'Internal Note'; }

  const logoUrl = logo ? getCourierLogo(logo) : null;

  return (
    <div style={{
      border: `1px solid ${isDraft ? `${C.green}44` : C.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      background: isDraft ? `${C.green}06` : isNote ? 'rgba(210,153,34,0.04)' : C.card,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 13px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap',
      }}>
        {logoUrl && (
          <img src={logoUrl} alt="" style={{ width: 20, height: 14, objectFit: 'contain', flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 10, fontWeight: 700, color: threadColor, background: `${threadColor}18`,
          padding: '2px 8px', borderRadius: 4, border: `1px solid ${threadColor}33` }}>
          {threadLabel}
        </span>
        {isDraft && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim,
            padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.green}33` }}>
            AI Draft — Pending Approval
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>
          {email.from_address || email.to_address}
        </span>
        <span style={{ fontSize: 10, color: C.muted }}>
          {isSent ? `Sent ${fmtDate(email.sent_at)}` : `${fmtDate(email.received_at || email.created_at)}`}
        </span>
      </div>

      {/* Subject */}
      {email.subject && (
        <div style={{ padding: '6px 13px 0', fontSize: 12, fontWeight: 600, color: C.sub }}>
          {email.subject}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '10px 13px' }}>
        {editMode ? (
          <textarea value={editBody} onChange={e => setEditBody(e.target.value)} style={{
            width: '100%', minHeight: 130, background: C.surface,
            border: `1px solid ${C.green}44`, borderRadius: 6,
            color: C.text, fontSize: 12, padding: 10, resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }} />
        ) : (
          <pre style={{
            margin: 0, fontSize: 12, color: C.sub,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            lineHeight: 1.65, maxHeight: 240, overflow: 'auto',
          }}>
            {email.body_text || '(no body)'}
          </pre>
        )}
      </div>

      {isDraft && (
        <div style={{ display: 'flex', gap: 8, padding: '9px 13px', borderTop: `1px solid ${C.border}` }}>
          {editMode ? (
            <>
              <button onClick={() => { onEdit(email.id, editBody); setEditMode(false); }}
                style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: C.green, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Save &amp; Approve
              </button>
              <button onClick={() => { setEditMode(false); setEditBody(email.body_text || ''); }}
                style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onApprove(email.id, email.body_text)} disabled={approving}
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: C.green, color: '#000', fontSize: 12, fontWeight: 700, cursor: approving ? 'default' : 'pointer', opacity: approving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={12} />{approving ? 'Sending…' : 'Approve & Send'}
              </button>
              <button onClick={() => setEditMode(true)}
                style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Edit2 size={11} /> Edit first
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Thread tab — groups emails into Customer / Courier threads ───────────────

function EmailThreads({ emails, onApprove, onEdit, approving, courierName, courierCode }) {
  const [activeThread, setActiveThread] = useState('customer');

  const customerEmails = emails.filter(e => e.direction === 'inbound_customer' || e.direction === 'outbound_customer');
  const courierEmails  = emails.filter(e => e.direction === 'inbound_courier'  || e.direction === 'outbound_courier');
  const internalNotes  = emails.filter(e => e.direction === 'internal_note');

  const tabs = [
    { key: 'customer', label: `Customer (${customerEmails.length})`, color: C.blue },
    { key: 'courier',  label: `${courierName || 'Courier'} (${courierEmails.length})`, color: C.amber },
    ...(internalNotes.length > 0 ? [{ key: 'internal', label: `Notes (${internalNotes.length})`, color: C.muted }] : []),
  ];

  const logoUrl = courierCode ? getCourierLogo(courierCode) : null;

  const threadEmails = activeThread === 'customer' ? customerEmails
                     : activeThread === 'courier'  ? courierEmails
                     : internalNotes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Thread switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: C.surface, borderRadius: 8, padding: 3, alignSelf: 'flex-start', border: `1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveThread(t.key)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: activeThread === t.key ? C.card : 'transparent',
            color: activeThread === t.key ? t.color : C.muted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.1s',
          }}>
            {t.key === 'courier' && logoUrl && (
              <img src={logoUrl} alt="" style={{ width: 16, height: 11, objectFit: 'contain' }} />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Emails */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {threadEmails.length === 0 && (
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '30px 0' }}>
            No messages in this thread yet
          </div>
        )}
        {[...threadEmails]
          .sort((a, b) => {
            const aD = a.is_ai_draft && !a.sent_at ? 0 : 1;
            const bD = b.is_ai_draft && !b.sent_at ? 0 : 1;
            if (aD !== bD) return aD - bD;
            return new Date(a.created_at) - new Date(b.created_at);
          })
          .map(email => (
            <EmailItem key={email.id} email={email} onApprove={onApprove} onEdit={onEdit}
              approving={approving} courierName={courierName} courierCode={courierCode} />
          ))
        }
      </div>
    </div>
  );
}

// ─── Draft footer — fixed bottom compose bar ──────────────────────────────────

function DraftFooter({ q, draft, setDraft, generateDraft }) {
  const [active, setActive] = useState(null); // null | 'customer' | 'courier'

  // Auto-open when a draft arrives
  useEffect(() => {
    if (draft.customer && active === null) setActive('customer');
    else if (draft.courier && active === null) setActive('courier');
  }, [draft.customer, draft.courier]);

  const current = active ? draft[active] : null;
  const loading  = active === 'customer' ? draft.loadingCustomer : draft.loadingCourier;
  const accent   = active === 'customer' ? C.blue : C.amber;
  const label    = active === 'customer' ? `Reply to ${q.sender_email || q.customer_name}` : `Email ${q.courier_name || 'Courier'}`;

  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.surface }}>

      {/* Compose area — expands upward when a panel is active */}
      {active && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
          {/* Simulation banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            padding: '4px 9px', borderRadius: 5, background: 'rgba(210,153,34,0.12)',
            border: `1px solid ${C.amber}33` }}>
            <AlertTriangle size={11} color={C.amber} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: 'uppercase',
              letterSpacing: '0.4px' }}>Simulation — no emails will be sent</span>
          </div>
          {current?.subject && (
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>
              Subject: <span style={{ color: C.sub }}>{current.subject}</span>
            </div>
          )}
          {loading ? (
            <div style={{ padding: '18px 0', textAlign: 'center', color: C.muted, fontSize: 12 }}>
              <Sparkles size={14} style={{ marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
              Generating AI draft…
            </div>
          ) : current ? (
            <>
              <textarea
                value={current.text}
                onChange={e => setDraft(d => ({ ...d, [active]: { ...d[active], text: e.target.value } }))}
                style={{ width: '100%', boxSizing: 'border-box', background: C.card,
                  border: `1px solid ${accent}33`, borderRadius: 6, color: C.text, fontSize: 12,
                  padding: 10, resize: 'none', height: 160, fontFamily: 'inherit',
                  lineHeight: 1.55, outline: 'none', display: 'block' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button onClick={() => generateDraft(active)} disabled={loading}
                  style={{ padding: '5px 10px', borderRadius: 5, border: `1px solid ${accent}44`,
                    background: 'transparent', color: accent, fontSize: 11, cursor: 'pointer' }}>
                  Regenerate
                </button>
                <button
                  onClick={() => alert('SIMULATION MODE\n\nThis email has not been sent. Real sending is not yet connected.')}
                  style={{ padding: '5px 14px', borderRadius: 5, border: `1px solid ${C.muted}44`,
                    background: C.card, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Send size={11} /> Send (sim only)
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '14px 0', textAlign: 'center' }}>
              <button onClick={() => generateDraft(active)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                  borderRadius: 6, border: `1px solid ${accent}55`, background: `${accent}14`,
                  color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Sparkles size={13} /> Generate AI Draft
              </button>
            </div>
          )}
        </div>
      )}

      {/* Button bar — always visible */}
      <div style={{ display: 'flex', gap: 0 }}>
        {[
          { key: 'customer', label: 'Reply to Customer', icon: Mail, color: C.blue,
            has: !!draft.customer, loading: draft.loadingCustomer },
          { key: 'courier',  label: `Email ${q.courier_name || 'Courier'}`, icon: Truck, color: C.amber,
            has: !!draft.courier, loading: draft.loadingCourier },
        ].map(btn => (
          <button key={btn.key}
            onClick={() => setActive(a => a === btn.key ? null : btn.key)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 12px', border: 'none', borderRight: btn.key === 'customer' ? `1px solid ${C.border}` : 'none',
              background: active === btn.key ? `${btn.color}15` : 'transparent',
              color: active === btn.key ? btn.color : C.muted,
              fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
              borderTop: active === btn.key ? `2px solid ${btn.color}` : '2px solid transparent',
            }}>
            <btn.icon size={11} />
            {btn.label}
            {btn.has && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: btn.color, flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Query detail panel ───────────────────────────────────────────────────────

function QueryDetail({ queryId, onUpdated }) {
  const navigate = useNavigate();
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState('emails');
  const [approving,      setApproving]      = useState(false);
  const [attentionNote,  setAttentionNote]  = useState('');
  const [showFlag,       setShowFlag]       = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [parcel,         setParcel]         = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [showTracking,   setShowTracking]   = useState(false);
  const [draft,          setDraft]          = useState({ customer: null, courier: null, loadingCustomer: false, loadingCourier: false });
  const [phoneCall,      setPhoneCall]      = useState(null); // { reason, target }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchQuery(queryId);
      setData(d);
      // Mark all inbound emails read, then immediately refresh the inbox list
      // so the unread badge on the left card clears in real time.
      await fetch(`/api/queries/${queryId}/mark-read`, { method: 'PATCH' }).catch(() => {});
      onUpdated?.();
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [queryId, onUpdated]);

  useEffect(() => { load(); }, [load]);

  // Fetch live parcel status + tracking events
  useEffect(() => {
    if (!data) return;
    const q = data.query || data;
    if (!q.consignment_number) return;
    api.get(`/tracking/${encodeURIComponent(q.consignment_number)}`)
      .then(r => {
        const d = r.data;
        const parcelObj = d?.parcel || d || null;
        setParcel(parcelObj);
        // Events may be on the parcel obj or at the top level
        setTrackingEvents(parcelObj?.events || d?.events || []);
      })
      .catch(() => { setParcel(null); setTrackingEvents([]); });
  }, [data]);

  async function handleApprove(emailId, bodyText) {
    setApproving(true);
    try { await approveEmail(queryId, { email_id: emailId, action: 'approve', body_text: bodyText }); await load(); onUpdated?.(); }
    catch (err) { alert('Failed: ' + err.message); }
    finally { setApproving(false); }
  }

  async function handleEdit(emailId, newBody) {
    setApproving(true);
    try { await approveEmail(queryId, { email_id: emailId, action: 'approve', body_text: newBody }); await load(); onUpdated?.(); }
    catch (err) { alert('Failed: ' + err.message); }
    finally { setApproving(false); }
  }

  async function handleFlagAttention() {
    if (!attentionNote.trim()) return;
    try { await flagAttention(queryId, { reason: attentionNote }); setAttentionNote(''); setShowFlag(false); await load(); onUpdated?.(); }
    catch (err) { alert(err.message); }
  }

  async function handleStatusChange(e) {
    setStatusUpdating(true);
    try { await updateQuery(queryId, { status: e.target.value }); await load(); onUpdated?.(); }
    catch (err) { alert(err.message); }
    finally { setStatusUpdating(false); }
  }

  async function generateDraft(target) {
    const key = target === 'customer' ? 'loadingCustomer' : 'loadingCourier';
    setDraft(d => ({ ...d, [key]: true }));
    try {
      const r = await fetch(`/api/queries/${queryId}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const j = await r.json();
      if (j.error) { alert('AI error: ' + j.error); return; }
      setDraft(d => ({ ...d, [target]: { text: j.draft_text, subject: j.subject, id: j.draft_id } }));
      if (j.phone_call_recommended) {
        setPhoneCall({ reason: j.urgency_reason, target });
        await load(); // reload to show attention flag
        onUpdated?.();
      }
    } catch (e) {
      alert('Failed to generate draft: ' + e.message);
    } finally {
      setDraft(d => ({ ...d, [key]: false }));
    }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13 }}>
      Loading…
    </div>
  );
  if (!data) return null;

  const q            = data.query || data;
  const emails       = data.emails        || [];
  const evidence     = data.evidence      || [];
  const notifications= data.notifications || [];
  const pendingDrafts= emails.filter(e => e.is_ai_draft && !e.sent_at && !e.ai_draft_approved_by);

  const logoUrl = q.courier_code ? getCourierLogo(q.courier_code) : null;

  const PSC = { // parcel status colours
    delivered: C.green, returned: C.amber, failed_delivery: C.amber,
    exception: C.red, on_hold: C.amber, customs_hold: C.amber,
    in_transit: C.blue, out_for_delivery: C.blue, collected: C.blue,
    booked: C.muted, unknown: C.muted,
  };
  const parcelColor = PSC[parcel?.status] || C.muted;
  const showPhoneCall = phoneCall || (q.requires_attention && q.attention_reason?.includes('PHONE'));
  const showAttention = q.requires_attention && q.attention_reason && !q.attention_reason.includes('PHONE');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minWidth: 0, overflow: 'hidden' }}>
    {/* Left column: all detail content */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>

        {/* Block 1: customer name + subject + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                {q.customer_name}
              </div>
              {/* Unread badge — shows on open, clears once mark-read fires */}
              {(() => {
                const n = emails.filter(e =>
                  (e.direction === 'inbound_customer' || e.direction === 'inbound_courier') &&
                  !e.read_at && !e.is_ai_draft
                ).length;
                return n > 0 ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, color: C.blue,
                    background: 'rgba(41,121,255,0.12)', padding: '2px 8px',
                    borderRadius: 20, border: `1px solid ${C.blue}44`, flexShrink: 0,
                  }}>
                    <Mail size={9} /> {n} unread
                  </span>
                ) : null;
              })()}
            </div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {q.subject}
            </div>
          </div>
          <select value={q.status} onChange={handleStatusChange} disabled={statusUpdating}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text,
              fontSize: 12, padding: '6px 10px', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Block 2: info strip — consignment · courier · type · parcel status · phone · buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 13px', background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
          {logoUrl && (
            <div style={{ width: 28, height: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: '#fff', borderRadius: 4, flexShrink: 0, padding: 2 }}>
              <img src={logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          )}
          {q.consignment_number && (
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '0.02em' }}>
              {q.consignment_number}
            </span>
          )}
          <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
            letterSpacing: '0.5px', flexShrink: 0 }}>Reported</span>
          <TypeBadge type={q.query_type} />

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: C.border, flexShrink: 0 }} />

          {/* Parcel status + postcode */}
          {parcel && (
            <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.5px', flexShrink: 0 }}>Courier</span>
          )}
          {parcel && (
            <span style={{ fontSize: 13, fontWeight: 700, color: parcelColor, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {parcel.status?.replace(/_/g, ' ')}
            </span>
          )}
          {parcel?.recipient_postcode && (
            <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
              {parcel.recipient_postcode}
            </span>
          )}
          {parcel?.last_event_at && (
            <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
              {fmtDate(parcel.last_event_at)}
            </span>
          )}

          {/* Phone call chip */}
          {showPhoneCall && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
              color: C.red, background: C.redDim, padding: '3px 8px', borderRadius: 5,
              border: `1px solid ${C.red}33`, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Phone size={11} /> Phone call
            </span>
          )}
          {showAttention && !showPhoneCall && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
              color: C.amber, background: C.amberDim, padding: '3px 8px', borderRadius: 5,
              border: `1px solid ${C.amber}33`, whiteSpace: 'nowrap', flexShrink: 0 }}>
              ⚠ Attention
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Action buttons */}
          <button onClick={() => setShowTracking(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 5,
              border: `1px solid ${showTracking ? C.blue : C.blue + '44'}`,
              background: showTracking ? `${C.blue}22` : `${C.blue}0D`,
              color: C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Truck size={11} /> {showTracking ? 'Hide' : 'Track'}
          </button>
          <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(q.consignment_number)}`)}
            title="Full tracking page"
            style={{ display: 'flex', alignItems: 'center', padding: '5px 7px', borderRadius: 5,
              border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' }}>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {[
          { key: 'emails',   label: `Emails (${emails.length})`,        icon: Mail },
          { key: 'evidence', label: `Evidence (${evidence.length})`,    icon: FileText },
          { key: 'info',     label: 'Info',                             icon: Package },
          { key: 'notes',    label: `Alerts (${notifications.length})`, icon: AlertCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '9px 4px', border: 'none',
            borderBottom: `2px solid ${tab === key ? C.blue : 'transparent'}`,
            background: 'transparent', color: tab === key ? C.blue : C.muted,
            fontSize: 11, fontWeight: tab === key ? 700 : 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <Icon size={11} />{label}
          </button>
        ))}
      </div>

      {/* ── Tab content (only scroll zone) ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {tab === 'emails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <EmailThreads
              emails={emails}
              onApprove={handleApprove}
              onEdit={handleEdit}
              approving={approving}
              courierName={q.courier_name}
              courierCode={q.courier_code}
            />
            {/* Flag for attention */}
            <div style={{ paddingTop: 4 }}>
              {showFlag ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea placeholder="Why does this need attention?" value={attentionNote}
                    onChange={e => setAttentionNote(e.target.value)}
                    style={{ background: C.card, border: `1px solid ${C.red}44`, borderRadius: 6,
                      color: C.text, fontSize: 12, padding: 10, resize: 'vertical', minHeight: 56,
                      fontFamily: 'inherit', outline: 'none' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleFlagAttention}
                      style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: C.red,
                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Flag
                    </button>
                    <button onClick={() => setShowFlag(false)}
                      style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                        background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowFlag(true)}
                  style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.muted, fontSize: 11, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flag size={10} /> Flag for attention
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evidence.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>No evidence collected yet</div>}
            {evidence.map(ev => (
              <div key={ev.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '11px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.blueDim, padding: '2px 7px', borderRadius: 4, border: `1px solid ${C.blue}33` }}>
                    {ev.evidence_type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 10, color: C.muted }}>{fmtDate(ev.created_at)}</span>
                  {ev.is_courier_approved && <span style={{ fontSize: 10, fontWeight: 600, color: C.green, marginLeft: 'auto' }}>✓ Courier Approved</span>}
                </div>
                {ev.value_text && <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{ev.value_text}</div>}
                {ev.value_numeric != null && <div style={{ fontSize: 12, color: C.sub }}>£{Number(ev.value_numeric).toFixed(2)}</div>}
                {ev.file_name && <div style={{ fontSize: 11, color: C.blue, marginTop: 4 }}>📎 {ev.file_name}</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'info' && (
          <div>
            {[
              ['Consignment', q.consignment_number],
              ['Customer',    q.customer_name],
              ['Courier',     q.courier_name],
              ['Service',     q.service_name],
              ['Type',        TYPE_CFG[q.query_type]?.label || q.query_type],
              ['Status',      STATUS_CFG[q.status]?.label  || q.status],
              ['Sender',      q.sender_email],
              ['Created',     fmtDate(q.created_at)],
              ['First Reply', q.first_response_at ? fmtDate(q.first_response_at) : '—'],
              ['Resolved',    q.resolved_at ? fmtDate(q.resolved_at) : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, width: 100, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: C.sub }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>No alerts for this query</div>}
            {notifications.map(n => (
              <div key={n.id} style={{ background: C.card, border: `1px solid ${n.read_at ? C.border : `${C.amber}44`}`, borderRadius: 8, padding: '11px 13px', opacity: n.read_at ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.amber }}>{n.notification_type.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{fmtDate(n.created_at)}</span>
                  {n.read_at && <span style={{ fontSize: 10, color: C.green, marginLeft: 'auto' }}>Read</span>}
                </div>
                <div style={{ fontSize: 12, color: C.sub }}>{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <DraftFooter
        q={q}
        draft={draft}
        setDraft={setDraft}
        generateDraft={generateDraft}
      />
    </div>
      {showTracking && (
        <div style={{
          width: 300, flexShrink: 0,
          borderLeft: `1px solid ${C.border}`,
          background: '#0A0E1A',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.08)`,
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#AAAAAA', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 3 }}>Consignment</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                {q.consignment_number}
              </div>
            </div>
            <button onClick={() => setShowTracking(false)}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px' }}>
            {/* Delivery address box */}
            {parcel && (parcel.recipient_name || parcel.recipient_address || parcel.recipient_postcode) && (
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
        </div>
      )}

    </div>
  );
}

// ─── Unmatched emails panel ───────────────────────────────────────────────────

function UnmatchedPanel({ onClose }) {
  const [emails,  setEmails]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState(null);

  useEffect(() => {
    fetchUnmatched().then(d => { setEmails(d.emails || []); setLoading(false); });
  }, []);

  async function startMap(email) {
    const sugs = await fetchSenderSuggestions(email.from_address);
    setMapping({ email, suggestions: sugs.suggestions || [] });
  }

  async function doMap(customerId) {
    await mapSender({ email_address: mapping.email.from_address, customer_id: customerId, unmatched_email_id: mapping.email.id });
    setMapping(null);
    const d = await fetchUnmatched();
    setEmails(d.emails || []);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ width: 560, maxHeight: '80vh', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '13px 17px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.text }}>Unmatched Emails</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {mapping ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Map: {mapping.email.from_address}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{mapping.email.subject}</div>
            </div>
            {mapping.suggestions.map(s => (
              <div key={s.id} onClick={() => doMap(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, marginBottom: 6, cursor: 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.business_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.account_number}</div>
                </div>
                <Badge label="Match" color={C.green} bg={C.greenDim} small />
              </div>
            ))}
            <button onClick={() => setMapping(null)} style={{ marginTop: 4, padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer' }}>← Back</button>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading && <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading…</div>}
            {!loading && emails.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginTop: 8 }}>All emails matched</div>
              </div>
            )}
            {emails.map(em => (
              <div key={em.id} style={{ padding: '11px 17px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{em.from_address}</div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.subject}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{fmtDate(em.received_at)}</div>
                </div>
                <button onClick={() => startMap(em)} style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.blue, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Link2 size={11} /> Match
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Seed button (dev tool) ───────────────────────────────────────────────────

function SeedButton({ onDone }) {
  const [state, setState] = useState('idle'); // idle | loading | ok | error
  const [msg,   setMsg]   = useState('');

  async function run() {
    setState('loading');
    setMsg('');
    try {
      const r = await fetch('/api/queries/seed-now', { method: 'POST' });
      const j = await r.json();
      if (j.error) {
        setState('error');
        setMsg(j.error + (j.detail ? ' — ' + j.detail : ''));
      } else if (!j.seeded || j.seeded === 0) {
        // Inserts silently failed — surface the first per-row error
        setState('error');
        const firstErr = j.queries?.find(q => q.error);
        const errText  = firstErr
          ? `${firstErr.consignment}: ${firstErr.error}`
          : `Seeded 0 — check Railway logs`;
        setMsg(errText);
        console.error('[seed] full response:', j);
      } else {
        setState('ok');
        setMsg(`Seeded ${j.seeded} tickets`);
        setTimeout(() => { setState('idle'); onDone?.(); }, 2000);
      }
    } catch (e) {
      setState('error');
      setMsg(e.message);
    }
  }

  const bg    = state === 'ok' ? C.green : state === 'error' ? C.red : C.card;
  const label = state === 'loading' ? 'Seeding…' : state === 'ok' ? msg : state === 'error' ? '⚠ ' + msg : 'Re-seed';

  return (
    <button onClick={run} disabled={state === 'loading'} title="Wipe and re-seed practice tickets"
      style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${C.border}`,
        background: bg, color: state === 'idle' ? C.muted : '#fff', fontSize: 11,
        cursor: state === 'loading' ? 'default' : 'pointer', maxWidth: state === 'error' ? 280 : 'auto',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '',                       label: 'All Open' },
  { value: 'open',                   label: 'Open' },
  { value: 'awaiting_courier',       label: 'Awaiting Courier' },
  { value: 'awaiting_customer_info', label: 'Awaiting Customer' },
  { value: 'courier_investigating',  label: 'Investigating' },
  { value: 'claim_raised',           label: 'Claim Raised' },
  { value: 'claim_submitted',        label: 'Claim Submitted' },
  { value: 'resolved',               label: 'Resolved' },
];

function FilterPill({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 11px', borderRadius: 20,
      border: `1px solid ${active ? color : C.border}`,
      background: active ? `${color}18` : 'transparent',
      color: active ? color : C.muted,
      fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
      whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QueriesPage() {
  const [queries,       setQueries]       = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedId,    setSelectedId]    = useState(null);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [filters,       setFilters]       = useState({ status: '', attention: false, search: '' });

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
  }, [refreshKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status)    params.status    = filters.status;
      if (filters.attention) params.attention  = true;
      if (filters.search)    params.search     = filters.search;
      const d = await fetchInbox(params);
      setQueries(d.queries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load, refreshKey]);

  function refresh() { setRefreshKey(k => k + 1); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.text, overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <MessageSquare size={15} style={{ color: C.blue }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Queries &amp; Claims</span>
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            placeholder="Search consignment, customer…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text,
              fontSize: 12, padding: '6px 10px 6px 28px', width: 200, outline: 'none' }}
          />
        </div>

        <button onClick={() => setShowUnmatched(true)} style={{ padding: '6px 11px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <User size={12} />
          {stats?.unmatched_emails > 0 && (
            <span style={{ background: C.amber, color: '#000', borderRadius: 10, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>
              {stats.unmatched_emails}
            </span>
          )}
          Unmatched
        </button>

        <button onClick={refresh} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 5 }}>
          <RefreshCw size={14} />
        </button>

        <SeedButton onDone={refresh} />
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '10px 18px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          <KpiCard label="Open" value={stats?.total_open ?? '—'} color={C.blue} icon={Inbox}
            active={!filters.attention && !filters.status}
            onClick={() => setFilters(f => ({ ...f, status: '', attention: false }))} />
          <KpiCard label="Needs Attention" value={stats?.requires_attention ?? '—'} color={C.red} icon={AlertTriangle} warn
            active={filters.attention}
            onClick={() => setFilters(f => ({ ...f, attention: !f.attention }))} />
          <KpiCard label="SLA Breached" value={stats?.sla_breached ?? '—'} color={C.amber} icon={Clock} warn />
          <KpiCard label="Pending Drafts" value={stats?.pending_drafts ?? '—'} color={C.green} icon={Mail} warn sub="awaiting approval" />
          <KpiCard label="Claim Deadlines" value={stats?.claim_deadlines_7d ?? '—'} color={C.amber} icon={AlertCircle} warn sub="due in 7 days"
            active={filters.status === 'claim_raised' || filters.status === 'claim_submitted'}
            onClick={() => setFilters(f => ({ ...f, status: 'claim_raised', attention: false }))} />
          <KpiCard label="Total" value={stats?.total_queries ?? '—'} color={C.muted} icon={MessageSquare} />
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '7px 18px', borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0, flexWrap: 'wrap' }}>
        <Filter size={11} style={{ color: C.muted, flexShrink: 0 }} />
        {STATUS_FILTERS.map(f => (
          <FilterPill key={f.value} color={C.blue}
            active={filters.status === f.value && !filters.attention}
            onClick={() => setFilters(p => ({ ...p, status: f.value, attention: false }))}>
            {f.label}
          </FilterPill>
        ))}
        <div style={{ width: 1, height: 14, background: C.border, flexShrink: 0, margin: '0 2px' }} />
        <FilterPill color={C.red} active={filters.attention}
          onClick={() => setFilters(p => ({ ...p, attention: !p.attention }))}>
          ⚠ Attention Only
        </FilterPill>
      </div>

      {/* ── Main split layout ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left — inbox list (fixed 340px) */}
        <div style={{ width: 340, flexShrink: 0, overflow: 'auto', borderRight: `1px solid ${C.border}` }}>
          {loading && <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 12 }}>Loading…</div>}
          {!loading && queries.length === 0 && (
            <div style={{ padding: 50, textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 4 }}>No queries match</div>
              <div style={{ fontSize: 11, color: C.muted }}>Try a different filter</div>
            </div>
          )}
          {queries.map(q => (
            <InboxRow
              key={q.id}
              q={q}
              selected={q.id === selectedId}
              onClick={() => setSelectedId(id => id === q.id ? null : q.id)}
            />
          ))}
        </div>

        {/* Right — detail panel (always visible) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.bg }}>
          {selectedId ? (
            <QueryDetail key={selectedId} queryId={selectedId} onUpdated={refresh} />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, gap: 10 }}>
              <MessageSquare size={32} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}>Select a query to view the conversation</div>
            </div>
          )}
        </div>

      </div>

      {showUnmatched && <UnmatchedPanel onClose={() => setShowUnmatched(false)} />}
    </div>
  );
}
