import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Mail, Clock, User,
  Inbox, RefreshCw, MessageSquare, FileText,
  Send, Edit2, Flag, Link2,
  AlertCircle, Package, Filter, Search, X, ExternalLink, Receipt,
  Phone, MapPin, Truck, Sparkles, ChevronDown, ChevronUp,
  PackageCheck, PackageX, RotateCcw, ShieldAlert, Store, SlidersHorizontal,
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

const _BUILD = '2026-05-21-v2'; // cache bust — queries detail redesign

const C = {
  bg:       '#070E1C',
  surface:  '#09122A',
  card:     '#0B1628',
  hover:    '#0F1E35',
  selected: '#122040',
  border:   'rgba(255,255,255,0.07)',
  green:    '#22C55E',
  amber:    '#F97316',
  red:      '#EF4444',
  blue:     '#3B82F6',
  text:     '#F0F4FC',
  sub:      '#8AABFF',
  muted:    '#3D5270',
  greenDim: 'rgba(34,197,94,0.12)',
  amberDim: 'rgba(249,115,22,0.12)',
  redDim:   'rgba(239,68,68,0.12)',
  blueDim:  'rgba(59,130,246,0.13)',
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

const PRIORITY_BAR = {
  urgent: C.red,
  high:   C.amber,
  medium: C.blue,
  low:    'rgba(125,133,144,0.4)',
};

const PRIORITY_LABEL = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };

// ─── Hover popup ──────────────────────────────────────────────────────────────

function TicketPopup({ q, pos, logoUrl, assigneeName }) {
  const priColor = q.priority === 'urgent' ? C.red
                 : q.priority === 'high'   ? C.amber
                 : q.priority === 'medium' ? C.blue
                 : C.muted;

  const left = Math.min(pos.x + 10, window.innerWidth - 370);
  const top  = Math.max(8, Math.min(pos.y - 8, window.innerHeight - 300));

  return (
    <div style={{
      position: 'fixed', left, top,
      width: 355,
      background: '#1E252D',
      border: '1px solid rgba(255,255,255,0.16)',
      borderRadius: 10,
      boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)',
      padding: '14px 16px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {/* Customer + ticket number */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 9 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{q.customer_name}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0, paddingTop: 2 }}>#{q.ticket_number}</span>
      </div>

      {/* Badges row: topic + status + priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {q.query_type && <TypeBadge type={q.query_type} />}
        <StatusBadge status={q.status} />
        {q.priority && q.priority !== 'medium' && (
          <span style={{ fontSize: 10, fontWeight: 700, color: priColor, background: `${priColor}18`,
            padding: '2px 8px', borderRadius: 4, border: `1px solid ${priColor}33`, textTransform: 'capitalize' }}>
            {PRIORITY_LABEL[q.priority]}
          </span>
        )}
      </div>

      {/* Consignment strip */}
      {q.consignment_number && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
          padding: '7px 10px', background: 'rgba(255,255,255,0.04)',
          borderRadius: 6, border: `1px solid ${C.border}` }}>
          {logoUrl && (
            <div style={{ width: 22, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', borderRadius: 3, flexShrink: 0, padding: 2 }}>
              <img src={logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.02em' }}>
            {q.consignment_number}
          </span>
          {q.courier_name && (
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 2 }}>{q.courier_name}</span>
          )}
        </div>
      )}

      {/* Subject */}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 8, lineHeight: 1.45 }}>
        {q.subject || '(no subject)'}
      </div>

      {/* Preview — up to 4 lines */}
      {q.latest_email_preview && (
        <div style={{ fontSize: 12, color: '#6B7784', lineHeight: 1.6, marginBottom: 10,
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {q.latest_email_preview}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <User size={11} color={C.muted} />
        <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{assigneeName || 'Unassigned'}</span>
        <Clock size={10} color={C.muted} />
        <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(q.created_at)}</span>
      </div>
    </div>
  );
}

function InboxRow({ q, onClick, staffList = [], onUpdate }) {
  const [statusSaving,   setStatusSaving]   = useState(false);
  const [assigneeSaving, setAssigneeSaving] = useState(false);
  const [popup,          setPopup]          = useState(null); // { x, y } | null
  const rowRef = useRef(null);

  const hasAttention   = q.requires_attention;
  const hasSlaBreached = q.sla_breached;
  const isClaim        = CLAIM_STATUSES.has(q.status);
  const unread         = parseInt(q.unread_emails) || 0;
  const hasNewReply    = q.has_new_reply;

  const barColor = hasAttention   ? '#EF4444'
                 : hasNewReply    ? '#3B82F6'
                 : hasSlaBreached ? '#F97316'
                 : PRIORITY_BAR[q.priority] || '#3B82F6';

  const logoUrl      = q.courier_code ? getCourierLogo(q.courier_code) : null;
  const statusCfg    = STATUS_CFG[q.status] || { label: q.status, color: C.muted };
  const assigneeName = staffList.find(s => s.id === q.assigned_to)?.full_name;

  async function handleStatusChange(e) {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === q.status) return;
    setStatusSaving(true);
    try { await updateQuery(q.id, { status: newStatus }); onUpdate?.(); }
    catch { /* silently ignore */ }
    finally { setStatusSaving(false); }
  }

  async function handleAssigneeChange(e) {
    e.stopPropagation();
    const newAssignee = e.target.value || null;
    if (newAssignee === (q.assigned_to || '')) return;
    setAssigneeSaving(true);
    try { await updateQuery(q.id, { assigned_to: newAssignee }); onUpdate?.(); }
    catch { /* silently ignore */ }
    finally { setAssigneeSaving(false); }
  }

  function handleMouseEnter() {
    const rect = rowRef.current?.getBoundingClientRect();
    if (rect) setPopup({ x: rect.right, y: rect.top });
  }

  return (
    <>
      <div
        ref={rowRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setPopup(null)}
        style={{
          display: 'flex', alignItems: 'stretch',
          cursor: 'pointer',
          borderBottom: `1px solid ${C.border}`,
          background: hasAttention ? `linear-gradient(90deg, rgba(239,68,68,0.07) 0%, transparent 340px)` : hasNewReply ? `rgba(59,130,246,0.04)` : 'transparent',
          transition: 'background 0.1s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = C.hover; }}
        onMouseOut={e => { e.currentTarget.style.background = hasAttention ? `linear-gradient(90deg, rgba(239,68,68,0.07) 0%, transparent 340px)` : hasNewReply ? `rgba(59,130,246,0.04)` : 'transparent'; }}
      >
        {/* Left accent bar */}
        <div style={{ width: 5, flexShrink: 0, background: barColor, borderRadius: '2px 0 0 2px' }} />

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0, padding: '12px 14px 11px 14px' }}>

          {/* Row 1: customer name · topic · consignment · ticket# */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, overflow: 'hidden' }}>
            <span style={{
              fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em',
              color: hasNewReply ? C.text : '#EEF2FA',
              flexShrink: 0, maxWidth: '36%',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {q.customer_name || '—'}
            </span>

            {q.query_type && (
              <>
                <span style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>·</span>
                <TypeBadge type={q.query_type} small />
              </>
            )}

            {q.consignment_number && (
              <>
                <span style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>·</span>
                <span style={{
                  fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
                  color: '#6A8BAA',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 6,
                  padding: '1px 6px',
                  flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}>
                  {q.consignment_number}
                </span>
              </>
            )}

            {logoUrl && (
              <img src={logoUrl} alt="" style={{ width: 16, height: 12, objectFit: 'contain', flexShrink: 0, opacity: 0.75 }} />
            )}

            {q.ticket_number && (
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0 }}>
                #{q.ticket_number}
              </span>
            )}
          </div>

          {/* Row 2: subject */}
          <div style={{
            fontSize: 13, fontWeight: hasNewReply ? 600 : 400,
            color: hasNewReply ? C.sub : '#5E6978',
            marginBottom: 5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {q.subject || '(no subject)'}
          </div>

          {/* Row 3–4: preview (2 lines) */}
          {q.latest_email_preview && (
            <div style={{
              fontSize: 12, color: '#4A5260', lineHeight: 1.55,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {q.latest_email_preview}
            </div>
          )}
        </div>

        {/* ── Right: controls + meta ── */}
        <div
          style={{ flexShrink: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-end', justifyContent: 'center',
            gap: 5, padding: '10px 14px 10px 10px', minWidth: 175 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Time + unread */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
            <span style={{ fontSize: 11, color: hasNewReply ? C.blue : C.muted, fontWeight: hasNewReply ? 700 : 400 }}>
              {timeAgo(q.latest_email_at || q.created_at)}
            </span>
            {unread > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, borderRadius: 9999,
                background: C.blue, color: '#fff', fontSize: 10, fontWeight: 800, padding: '0 5px' }}>
                {unread}
              </span>
            )}
          </div>

          {/* Status dropdown */}
          <div style={{ position: 'relative', width: '100%' }}>
            <select value={q.status || ''} onChange={handleStatusChange} disabled={statusSaving}
              style={{ width: '100%', appearance: 'none',
                background: `${statusCfg.color}18`, border: `1px solid ${statusCfg.color}44`,
                borderRadius: 5, color: statusCfg.color, fontSize: 11, fontWeight: 700,
                padding: '4px 22px 4px 8px', cursor: 'pointer', outline: 'none',
                opacity: statusSaving ? 0.6 : 1 }}>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#1C2128', color: '#E6EDF3', fontWeight: 400 }}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={11} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: statusCfg.color, pointerEvents: 'none' }} />
          </div>

          {/* Assignee dropdown */}
          <div style={{ position: 'relative', width: '100%' }}>
            <select value={q.assigned_to || ''} onChange={handleAssigneeChange} disabled={assigneeSaving}
              style={{ width: '100%', appearance: 'none',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                borderRadius: 5, color: assigneeName ? C.sub : C.muted,
                fontSize: 11, fontWeight: assigneeName ? 600 : 400,
                padding: '4px 22px 4px 8px', cursor: 'pointer', outline: 'none',
                opacity: assigneeSaving ? 0.6 : 1 }}>
              <option value="" style={{ background: '#1C2128', color: '#7D8590' }}>Unassigned</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#1C2128', color: '#E6EDF3' }}>{s.full_name}</option>
              ))}
            </select>
            <ChevronDown size={11} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          </div>

          {/* Alert chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {hasAttention && (
              <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.redDim,
                padding: '1px 6px', borderRadius: 3, border: `1px solid ${C.red}33` }}>⚠ ATTN</span>
            )}
            {hasNewReply && !hasAttention && (
              <span style={{ fontSize: 9, fontWeight: 700, color: C.blue,
                background: 'rgba(88,166,255,0.12)', padding: '1px 6px',
                borderRadius: 3, border: `1px solid ${C.blue}44` }}>↩ REPLY</span>
            )}
            {isClaim && (
              <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.redDim,
                padding: '1px 6px', borderRadius: 3, border: `1px solid ${C.red}33` }}>CLAIM</span>
            )}
            {q.sla_mins_remaining !== null && q.sla_mins_remaining !== undefined && (
              <SlaChip mins={parseFloat(q.sla_mins_remaining)} policyName={q.sla_policy_name} />
            )}
          </div>
        </div>
      </div>

      {/* Hover popup — rendered in-place but fixed-position so it escapes the list */}
      {popup && (
        <TicketPopup q={q} pos={popup} logoUrl={logoUrl} assigneeName={assigneeName} />
      )}
    </>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ email, onApprove, onEdit, approving, courierName, courierCode }) {
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState(email.body_text || '');
  const isDraft  = email.is_ai_draft && !email.sent_at && !email.ai_draft_approved_by;
  const isSent   = !!email.sent_at;
  const dir      = email.direction;
  const isNote   = dir === 'internal_note';
  const isInbound = dir === 'inbound_customer' || dir === 'inbound_courier';
  const isCourier = dir === 'inbound_courier' || dir === 'outbound_courier';

  let bubbleBg, bubbleBorderStyle, accentColor, bubbleRadius;
  if (isNote) {
    bubbleBg = 'rgba(210,153,34,0.08)';
    bubbleBorderStyle = `1px dashed ${C.amber}44`;
    accentColor = C.amber;
    bubbleRadius = 8;
  } else if (dir === 'inbound_customer') {
    bubbleBg = C.card;
    bubbleBorderStyle = `1px solid ${C.border}`;
    accentColor = C.blue;
    bubbleRadius = '2px 10px 10px 10px';
  } else if (dir === 'outbound_customer') {
    bubbleBg = isDraft ? `${C.green}08` : 'rgba(88,166,255,0.08)';
    bubbleBorderStyle = isDraft ? `1px solid ${C.green}33` : `1px solid ${C.blue}33`;
    accentColor = isDraft ? C.green : C.blue;
    bubbleRadius = '10px 2px 10px 10px';
  } else if (dir === 'inbound_courier') {
    bubbleBg = C.card;
    bubbleBorderStyle = `1px solid ${C.amber}33`;
    accentColor = C.amber;
    bubbleRadius = '2px 10px 10px 10px';
  } else {
    bubbleBg = 'rgba(210,153,34,0.08)';
    bubbleBorderStyle = `1px solid ${C.amber}33`;
    accentColor = C.amber;
    bubbleRadius = '10px 2px 10px 10px';
  }

  const logoUrl = isCourier && courierCode ? getCourierLogo(courierCode) : null;
  const senderLabel = isNote
    ? 'Internal Note'
    : dir === 'inbound_customer'  ? (email.from_address || 'Customer')
    : dir === 'outbound_customer' ? 'You → Customer'
    : dir === 'inbound_courier'   ? (courierName || 'Courier')
    :                               `You → ${courierName || 'Courier'}`;

  const align = isNote ? 'center' : isInbound ? 'flex-start' : 'flex-end';

  return (
    <div style={{ display: 'flex', justifyContent: align, marginBottom: 12 }}>
      <div style={{ maxWidth: isNote ? '100%' : '74%', minWidth: 180 }}>
        {/* Sender + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
          justifyContent: isNote || isInbound ? 'flex-start' : 'flex-end' }}>
          {logoUrl && <img src={logoUrl} alt="" style={{ width: 16, height: 11, objectFit: 'contain' }} />}
          <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>{senderLabel}</span>
          {isDraft && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim,
              padding: '1px 6px', borderRadius: 3, border: `1px solid ${C.green}33` }}>
              AI Draft
            </span>
          )}
          <span style={{ fontSize: 10, color: C.muted }}>
            {isSent ? fmtDate(email.sent_at) : fmtDate(email.received_at || email.created_at)}
          </span>
        </div>

        {/* Bubble */}
        <div style={{
          background: bubbleBg,
          border: isNote ? `1px dashed ${C.amber}44` : bubbleBorderStyle,
          borderLeft: isNote ? `3px solid ${C.amber}` : bubbleBorderStyle,
          borderRadius: bubbleRadius,
          overflow: 'hidden',
        }}>
          {email.subject && (
            <div style={{ padding: '7px 13px 6px', fontSize: 11, fontWeight: 700, color: C.sub,
              borderBottom: `1px solid ${C.border}` }}>
              {email.subject}
            </div>
          )}
          <div style={{ padding: '10px 13px' }}>
            {editMode ? (
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)} style={{
                width: '100%', minHeight: 120, background: C.surface,
                border: `1px solid ${C.green}44`, borderRadius: 5,
                color: C.text, fontSize: 12, padding: 9, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
              }} />
            ) : (
              <pre style={{
                margin: 0, fontSize: 12, color: C.sub, whiteSpace: 'pre-wrap',
                wordBreak: 'break-word', lineHeight: 1.65, maxHeight: 220,
                overflow: 'auto', fontFamily: 'inherit',
              }}>
                {email.body_text || '(no body)'}
              </pre>
            )}
          </div>

          {isDraft && (
            <div style={{ display: 'flex', gap: 8, padding: '8px 13px', borderTop: `1px solid ${C.border}` }}>
              {editMode ? (
                <>
                  <button onClick={() => { onEdit(email.id, editBody); setEditMode(false); }}
                    style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: C.green,
                      color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Send size={11} /> Save & Approve
                  </button>
                  <button onClick={() => { setEditMode(false); setEditBody(email.body_text || ''); }}
                    style={{ padding: '5px 10px', borderRadius: 5, border: `1px solid ${C.border}`,
                      background: 'transparent', color: C.muted, fontSize: 11, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onApprove(email.id, email.body_text)} disabled={approving}
                    style={{ padding: '5px 14px', borderRadius: 5, border: 'none', background: C.green,
                      color: '#000', fontSize: 11, fontWeight: 700, cursor: approving ? 'default' : 'pointer',
                      opacity: approving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Send size={11} />{approving ? 'Sending…' : 'Approve & Send'}
                  </button>
                  <button onClick={() => setEditMode(true)}
                    style={{ padding: '5px 10px', borderRadius: 5, border: `1px solid ${C.border}`,
                      background: 'transparent', color: C.muted, fontSize: 11, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Edit2 size={10} /> Edit
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Thread view ──────────────────────────────────────────────────────────────

function ThreadView({ emails, onApprove, onEdit, approving, courierName, courierCode }) {
  const [activeThread, setActiveThread] = useState('customer');
  const bottomRef = useRef(null);

  const customerEmails = emails.filter(e => e.direction === 'inbound_customer' || e.direction === 'outbound_customer');
  const courierEmails  = emails.filter(e => e.direction === 'inbound_courier'  || e.direction === 'outbound_courier');
  const internalNotes  = emails.filter(e => e.direction === 'internal_note');
  const logoUrl = courierCode ? getCourierLogo(courierCode) : null;

  const tabs = [
    { key: 'customer', label: 'Customer',               count: customerEmails.length, color: C.blue },
    { key: 'courier',  label: courierName || 'Courier',  count: courierEmails.length,  color: C.amber, logo: logoUrl },
    { key: 'notes',    label: 'Notes',                  count: internalNotes.length,  color: C.muted },
  ];

  const threadEmails = activeThread === 'customer' ? customerEmails
                     : activeThread === 'courier'  ? courierEmails
                     : internalNotes;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, emails.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Thread tab bar */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveThread(t.key)} style={{
            padding: '8px 16px', border: 'none',
            borderBottom: `2px solid ${activeThread === t.key ? t.color : 'transparent'}`,
            background: 'transparent',
            color: activeThread === t.key ? t.color : C.muted,
            fontSize: 11, fontWeight: activeThread === t.key ? 700 : 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.1s',
          }}>
            {t.logo && <img src={t.logo} alt="" style={{ width: 14, height: 10, objectFit: 'contain' }} />}
            {t.label}
            <span style={{
              fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: 'center',
              padding: '0 5px', borderRadius: 8,
              background: activeThread === t.key ? `${t.color}22` : C.card,
              color: activeThread === t.key ? t.color : C.muted,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 4px' }}>
        {threadEmails.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '40px 0' }}>
            No messages in this thread yet
          </div>
        ) : (
          [...threadEmails]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(email => (
              <MessageBubble key={email.id} email={email}
                onApprove={onApprove} onEdit={onEdit} approving={approving}
                courierName={courierName} courierCode={courierCode} />
            ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Compose bar ──────────────────────────────────────────────────────────────

function ComposeBar({ q, draft, setDraft, generateDraft }) {
  const [active, setActive] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (draft.customer && active === null) setActive('customer');
    else if (draft.courier && active === null) setActive('courier');
  }, [draft.customer, draft.courier]);

  const tabs = [
    { key: 'customer', label: 'Reply to Customer',                    icon: Mail,           color: C.blue,  has: !!draft.customer },
    { key: 'courier',  label: `Email ${q.courier_name || 'Courier'}`, icon: Truck,          color: C.amber, has: !!draft.courier  },
    { key: 'note',     label: 'Internal Note',                        icon: MessageSquare,  color: C.muted, has: false            },
  ];

  const current = active === 'customer' ? draft.customer : active === 'courier' ? draft.courier : null;
  const loading  = active === 'customer' ? draft.loadingCustomer : active === 'courier' ? draft.loadingCourier : false;
  const accent   = active === 'customer' ? C.blue : active === 'courier' ? C.amber : C.muted;

  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.surface }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: active ? `1px solid ${C.border}` : 'none' }}>
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setActive(a => a === t.key ? null : t.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '9px 8px', border: 'none',
              borderTop: `2px solid ${active === t.key ? t.color : 'transparent'}`,
              background: active === t.key ? `${t.color}10` : 'transparent',
              color: active === t.key ? t.color : C.muted,
              fontSize: 11, fontWeight: active === t.key ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.1s',
              borderRight: t.key !== 'note' ? `1px solid ${C.border}` : 'none',
            }}>
            <t.icon size={11} />
            {t.label}
            {t.has && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* Compose area */}
      {active && (
        <div style={{ padding: '10px 14px' }}>
          {active !== 'note' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
              padding: '4px 9px', borderRadius: 5, background: C.amberDim, border: `1px solid ${C.amber}33` }}>
              <AlertTriangle size={11} color={C.amber} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Simulation — no emails will be sent
              </span>
            </div>
          )}

          {active === 'note' ? (
            <>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Add an internal note visible only to your team…"
                style={{ width: '100%', boxSizing: 'border-box', background: C.card,
                  border: `1px solid ${C.amber}33`, borderRadius: 6, color: C.text,
                  fontSize: 12, padding: 10, resize: 'none', height: 90,
                  fontFamily: 'inherit', lineHeight: 1.55, outline: 'none', display: 'block' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => alert('SIMULATION MODE\n\nNotes will be saved in a future build.')}
                  style={{ padding: '5px 14px', borderRadius: 5, border: `1px solid ${C.muted}44`,
                    background: C.card, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Send size={11} /> Save Note (sim)
                </button>
              </div>
            </>
          ) : loading ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: C.muted, fontSize: 12 }}>
              <Sparkles size={14} style={{ display: 'block', margin: '0 auto 6px' }} />
              Generating AI draft…
            </div>
          ) : current ? (
            <>
              {current.subject && (
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>
                  Subject: <span style={{ color: C.sub }}>{current.subject}</span>
                </div>
              )}
              <textarea
                value={current.text}
                onChange={e => setDraft(d => ({ ...d, [active]: { ...d[active], text: e.target.value } }))}
                style={{ width: '100%', boxSizing: 'border-box', background: C.card,
                  border: `1px solid ${accent}33`, borderRadius: 6, color: C.text,
                  fontSize: 12, padding: 10, resize: 'none', height: 140,
                  fontFamily: 'inherit', lineHeight: 1.55, outline: 'none', display: 'block' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button onClick={() => generateDraft(active)} disabled={loading}
                  style={{ padding: '5px 10px', borderRadius: 5, border: `1px solid ${accent}44`,
                    background: 'transparent', color: accent, fontSize: 11, cursor: 'pointer' }}>
                  Regenerate
                </button>
                <button onClick={() => alert('SIMULATION MODE\n\nThis email has not been sent.')}
                  style={{ padding: '5px 14px', borderRadius: 5, border: `1px solid ${C.muted}44`,
                    background: C.card, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Send size={11} /> Send (sim only)
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '12px 0', textAlign: 'center' }}>
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
    </div>
  );
}

// ─── Query detail panel ───────────────────────────────────────────────────────

function QueryDetail({ queryId, onUpdated }) {
  const navigate = useNavigate();
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [approving,      setApproving]      = useState(false);
  const [attentionNote,  setAttentionNote]  = useState('');
  const [showFlag,       setShowFlag]       = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [parcel,         setParcel]         = useState(null);

  // Keep onUpdated in a ref so it never causes load() to re-run
  const onUpdatedRef = useRef(onUpdated);
  useEffect(() => { onUpdatedRef.current = onUpdated; }, [onUpdated]);
  const [trackingEvents, setTrackingEvents] = useState([]);
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
      onUpdatedRef.current?.();
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [queryId]); // onUpdated intentionally excluded — read via ref to prevent re-fire loop

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

      {/* ── Left column: header + conversation + compose ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: '14px 18px 12px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          {/* Row 1: back · customer name · type badge · status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
                padding: '2px 4px', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
              ←
            </button>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.text, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {q.customer_name}
            </span>
            <TypeBadge type={q.query_type} />
            <StatusBadge status={q.status} />
          </div>
          {/* Row 2: courier logo · consignment · parcel status · separator · ticket# */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl && (
              <div style={{ width: 26, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff', borderRadius: 3, padding: 2, flexShrink: 0 }}>
                <img src={logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            )}
            {q.consignment_number && (
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: C.text,
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '2px 8px', letterSpacing: '0.02em', flexShrink: 0 }}>
                {q.consignment_number}
              </span>
            )}
            {parcel?.status && (
              <span style={{ fontSize: 12, fontWeight: 600, color: parcelColor, textTransform: 'capitalize', flexShrink: 0 }}>
                {parcel.status.replace(/_/g, ' ')}
              </span>
            )}
            {q.consignment_number && <div style={{ width: 1, height: 14, background: C.border, flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>#{q.ticket_number || q.id}</span>
            {showPhoneCall && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                color: C.red, background: C.redDim, padding: '2px 8px', borderRadius: 4,
                border: `1px solid ${C.red}33`, flexShrink: 0 }}>
                <Phone size={10} /> Call needed
              </span>
            )}
            <div style={{ flex: 1 }} />
            {q.consignment_number && (
              <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(q.consignment_number)}`)}
                title="Full tracking page"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4,
                  border: `1px solid ${C.border}`, background: 'transparent', color: C.muted,
                  cursor: 'pointer', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                <ExternalLink size={10} /> Track
              </button>
            )}
          </div>
        </div>

        {/* Thread view — scrolls internally */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ThreadView
            emails={emails}
            onApprove={handleApprove}
            onEdit={handleEdit}
            approving={approving}
            courierName={q.courier_name}
            courierCode={q.courier_code}
          />
        </div>

        {/* Compose bar — sticks to bottom */}
        <ComposeBar q={q} draft={draft} setDraft={setDraft} generateDraft={generateDraft} />
      </div>

      {/* ── Right sidebar — always visible ── */}
      <div style={{ width: 272, flexShrink: 0, borderLeft: `1px solid ${C.border}`,
        background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

          {/* ── Ticket ── */}
          <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 10 }}>Ticket</div>

          {/* Status */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Status</div>
            <select value={q.status} onChange={handleStatusChange} disabled={statusUpdating}
              style={{ width: '100%', background: STATUS_CFG[q.status]?.bg || C.card,
                border: `1px solid ${(STATUS_CFG[q.status]?.color || C.muted) + '44'}`,
                borderRadius: 6, color: STATUS_CFG[q.status]?.color || C.text,
                fontSize: 11, padding: '5px 8px', cursor: 'pointer', fontWeight: 700, outline: 'none' }}>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#1C2128', color: '#E6EDF3', fontWeight: 400 }}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Assignee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${C.blue}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: C.blue, flexShrink: 0 }}>
                {(q.assignee_name || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: q.assignee_name ? C.sub : C.muted }}>
                {q.assignee_name || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Opened */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Opened</div>
            <div style={{ fontSize: 12, color: C.sub }}>{fmtDate(q.created_at)}</div>
          </div>

          {/* SLA */}
          {q.sla_mins_remaining !== null && q.sla_mins_remaining !== undefined && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>SLA</div>
              <SlaChip mins={parseFloat(q.sla_mins_remaining)} policyName={q.sla_policy_name} />
            </div>
          )}

          {/* Attention banner */}
          {showAttention && (
            <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 6, background: C.amberDim,
              border: `1px solid ${C.amber}33`, fontSize: 11, color: C.amber, lineHeight: 1.4 }}>
              ⚠ {q.attention_reason}
            </div>
          )}

          <div style={{ height: 1, background: C.border, margin: '12px 0' }} />

          {/* ── Parcel ── */}
          {(q.consignment_number || parcel) && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 10 }}>Parcel</div>

              {logoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#fff', borderRadius: 4, padding: 3, flexShrink: 0 }}>
                    <img src={logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: 12, color: C.sub }}>{q.courier_name}</span>
                </div>
              )}

              {q.consignment_number && (
                <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: C.text,
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                  padding: '5px 8px', marginBottom: 8, wordBreak: 'break-all' }}>
                  {q.consignment_number}
                </div>
              )}

              {[
                parcel?.status         && ['Status',       <span key="s" style={{ fontWeight: 700, color: parcelColor, textTransform: 'capitalize' }}>{parcel.status.replace(/_/g, ' ')}</span>],
                parcel?.recipient_postcode && ['Postcode',  parcel.recipient_postcode],
                parcel?.estimated_delivery && ['Est. delivery', new Date(parcel.estimated_delivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })],
                parcel?.delivered_at   && ['Delivered',    new Date(parcel.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
              ].filter(Boolean).map(([label, val], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>{label}</span>
                  <span style={{ fontSize: 12, color: C.sub }}>{val}</span>
                </div>
              ))}

              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
            </div>
          )}

          {/* ── Tracking mini-timeline ── */}
          {trackingEvents.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Tracking
                </div>
                {q.consignment_number && (
                  <button onClick={() => navigate(`/tracking?q=${encodeURIComponent(q.consignment_number)}`)}
                    style={{ background: 'none', border: 'none', color: C.blue, fontSize: 10,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, padding: 0 }}>
                    <ExternalLink size={9} /> Full view
                  </button>
                )}
              </div>
              {[...trackingEvents]
                .sort((a, b) => new Date(b.event_at || b.event_datetime || b.created_at) - new Date(a.event_at || a.event_datetime || a.created_at))
                .slice(0, 5)
                .map((ev, i) => {
                  const cfg = TRACK_STATUS[ev.status] || TRACK_STATUS.unknown;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                        background: i === 0 ? cfg.color : C.muted }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: i === 0 ? 700 : 400,
                          color: i === 0 ? C.text : C.sub, lineHeight: 1.3, marginBottom: 2 }}>
                          {ev.description || cfg.label}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted }}>
                          {timeAgo(ev.event_at || ev.event_datetime || ev.created_at)}
                          {ev.location && ` · ${ev.location}`}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
            </div>
          )}

          {/* ── Evidence ── */}
          {evidence.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 10 }}>Evidence ({evidence.length})</div>
              {evidence.slice(0, 3).map(ev => (
                <div key={ev.id} style={{ marginBottom: 7, padding: '6px 8px', background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, marginBottom: 2 }}>
                    {ev.evidence_type.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.value_text ? ev.value_text.slice(0, 50)
                      : ev.value_numeric != null ? `£${Number(ev.value_numeric).toFixed(2)}`
                      : ev.file_name || '—'}
                  </div>
                </div>
              ))}
              {evidence.length > 3 && <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>+{evidence.length - 3} more</div>}
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
            </div>
          )}

          {/* ── Alerts ── */}
          {notifications.filter(n => !n.read_at).length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 10 }}>
                Alerts ({notifications.filter(n => !n.read_at).length})
              </div>
              {notifications.filter(n => !n.read_at).slice(0, 3).map(n => (
                <div key={n.id} style={{ marginBottom: 7, padding: '6px 8px', background: C.amberDim,
                  border: `1px solid ${C.amber}33`, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, marginBottom: 2, textTransform: 'capitalize' }}>
                    {n.notification_type.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.4 }}>
                    {n.message?.slice(0, 80)}{n.message?.length > 80 ? '…' : ''}
                  </div>
                </div>
              ))}
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
            </div>
          )}

          {/* ── Flag attention ── */}
          {showFlag ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea placeholder="Why does this need attention?" value={attentionNote}
                onChange={e => setAttentionNote(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: C.card,
                  border: `1px solid ${C.red}44`, borderRadius: 6, color: C.text,
                  fontSize: 11, padding: 9, resize: 'vertical', minHeight: 56,
                  fontFamily: 'inherit', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleFlagAttention}
                  style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: 'none',
                    background: C.red, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Flag
                </button>
                <button onClick={() => setShowFlag(false)}
                  style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.muted, fontSize: 11, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowFlag(true)}
              style={{ width: '100%', padding: '7px 0', borderRadius: 6, border: `1px solid ${C.border}`,
                background: 'transparent', color: C.muted, fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Flag size={10} /> Flag for attention
            </button>
          )}

        </div>
      </div>

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

// ─── Right-side filter panel ──────────────────────────────────────────────────

const PRIORITY_OPTS = [
  { value: '',       label: 'Any priority' },
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'high',   label: '🟠 High' },
  { value: 'medium', label: '🔵 Medium' },
  { value: 'low',    label: '⚪ Low' },
];

const TYPE_OPTS = [
  { value: '',               label: 'Any type' },
  { value: 'whereabouts',    label: 'WISMO' },
  { value: 'not_delivered',  label: 'Not Delivered' },
  { value: 'damaged',        label: 'Damaged' },
  { value: 'missing_items',  label: 'Missing Items' },
  { value: 'failed_delivery',label: 'Failed Delivery' },
  { value: 'returned',       label: 'Returned' },
  { value: 'delay',          label: 'Delay' },
  { value: 'other',          label: 'Other' },
  { value: 'claim',          label: 'Claim' },
];

const GROUPS_OPTS = [
  '', 'Delivery Enquiries', 'Claims', 'Accounts', 'Technical', 'General',
];

const filterSelectStyle = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: `1px solid rgba(255,255,255,0.12)`,
  borderRadius: 6, color: '#E6EDF3', fontSize: 12,
  padding: '6px 10px', outline: 'none', cursor: 'pointer',
};

function FilterPanel({ filters, setFilters, staffList, onClose }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const panelFilters = ['assigned_to', 'query_type', 'priority', 'group_name', 'courier'];
  const hasActive = panelFilters.some(k => filters[k]);

  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: C.surface, borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <SlidersHorizontal size={12} style={{ color: C.muted, marginRight: 7 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>Filters</span>
        {hasActive && (
          <button onClick={() => panelFilters.forEach(k => set(k, ''))}
            style={{ fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer', marginRight: 6, fontWeight: 700 }}>
            Clear all
          </button>
        )}
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2 }}>
          <X size={13} />
        </button>
      </div>

      {/* Filter controls */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px' }}>

        {/* Assignee */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Assignee
          </label>
          <select value={filters.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={filterSelectStyle}>
            <option value="">Anyone</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>

        {/* Query type */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Query Type
          </label>
          <select value={filters.query_type} onChange={e => set('query_type', e.target.value)} style={filterSelectStyle}>
            {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Priority
          </label>
          <select value={filters.priority} onChange={e => set('priority', e.target.value)} style={filterSelectStyle}>
            {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Group */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Group
          </label>
          <select value={filters.group_name} onChange={e => set('group_name', e.target.value)} style={filterSelectStyle}>
            {GROUPS_OPTS.map(g => <option key={g} value={g}>{g || 'Any group'}</option>)}
          </select>
        </div>

        {/* Courier */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Courier Code
          </label>
          <input
            value={filters.courier}
            onChange={e => set('courier', e.target.value.toLowerCase())}
            placeholder="dpd, dhl, evri…"
            style={filterSelectStyle}
          />
        </div>

        {/* Active filter summary */}
        {hasActive && (
          <div style={{ marginTop: 8, padding: '8px 10px', background: `${C.blue}10`, border: `1px solid ${C.blue}30`, borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, marginBottom: 4 }}>ACTIVE FILTERS</div>
            {filters.assigned_to && staffList.find(s => s.id === filters.assigned_to) && (
              <div style={{ fontSize: 11, color: C.sub }}>
                Assignee: {staffList.find(s => s.id === filters.assigned_to)?.full_name}
              </div>
            )}
            {filters.query_type && <div style={{ fontSize: 11, color: C.sub }}>Type: {TYPE_OPTS.find(o => o.value === filters.query_type)?.label}</div>}
            {filters.priority && <div style={{ fontSize: 11, color: C.sub }}>Priority: {filters.priority}</div>}
            {filters.group_name && <div style={{ fontSize: 11, color: C.sub }}>Group: {filters.group_name}</div>}
            {filters.courier && <div style={{ fontSize: 11, color: C.sub }}>Courier: {filters.courier.toUpperCase()}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QueriesPage() {
  const navigate = useNavigate();
  const [queries,       setQueries]       = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [staffList,     setStaffList]     = useState([]);
  const [filters,       setFilters]       = useState({
    status: '', attention: false, pending_draft: false, search: '',
    assigned_to: '', query_type: '', priority: '', group_name: '', courier: '',
  });
  const [autoDrafting,  setAutoDrafting]  = useState(false);
  const [autoDraftResult, setAutoDraftResult] = useState(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
  }, [refreshKey]);

  useEffect(() => {
    api.get('/staff').then(r => setStaffList(r.data)).catch(() => {});
  }, []);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status)        params.status        = filters.status;
      if (filters.attention)     params.attention     = true;
      if (filters.pending_draft) params.pending_draft = true;
      if (filters.search)        params.search        = filters.search;
      if (filters.assigned_to) params.assigned_to = filters.assigned_to;
      if (filters.query_type)  params.query_type  = filters.query_type;
      if (filters.priority)    params.priority    = filters.priority;
      if (filters.group_name)  params.group_name  = filters.group_name;
      if (filters.courier)     params.courier     = filters.courier;
      const d = await fetchInbox(params);
      setQueries(d.queries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  useEffect(() => {
    if (refreshKey > 0) loadInbox();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const panelFilterCount = [filters.assigned_to, filters.query_type, filters.priority, filters.group_name, filters.courier].filter(Boolean).length;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, color: C.text, overflow: 'hidden' }}>

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

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 11px', borderRadius: 7, cursor: 'pointer',
            border: `1px solid ${showFilters || panelFilterCount > 0 ? C.blue : C.border}`,
            background: showFilters || panelFilterCount > 0 ? `${C.blue}15` : 'transparent',
            color: showFilters || panelFilterCount > 0 ? C.blue : C.muted,
            fontSize: 12, fontWeight: 600,
          }}
        >
          <SlidersHorizontal size={12} />
          Filters
          {panelFilterCount > 0 && (
            <span style={{ background: C.blue, color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 9, fontWeight: 800 }}>
              {panelFilterCount}
            </span>
          )}
        </button>

        {/* Auto-Draft All */}
        <button
          onClick={async () => {
            if (autoDrafting) return;
            setAutoDrafting(true);
            setAutoDraftResult(null);
            try {
              const r = await fetch('/api/queries/auto-draft-all', { method: 'POST' });
              const d = await r.json();
              setAutoDraftResult(d);
              refresh();
            } catch (e) {
              setAutoDraftResult({ error: e.message });
            } finally {
              setAutoDrafting(false);
            }
          }}
          disabled={autoDrafting}
          title="Auto-generate AI draft responses for all open tickets without a pending draft"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 11px', borderRadius: 7, cursor: autoDrafting ? 'not-allowed' : 'pointer',
            border: `1px solid ${autoDraftResult?.drafted > 0 ? C.green : autoDraftResult?.error ? C.red : `${C.blue}44`}`,
            background: autoDrafting ? `${C.blue}10` : autoDraftResult?.drafted > 0 ? `${C.green}12` : 'transparent',
            color: autoDraftResult?.drafted > 0 ? C.green : autoDraftResult?.error ? C.red : C.blue,
            fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          <Sparkles size={12} />
          {autoDrafting ? 'Drafting…'
            : autoDraftResult?.drafted > 0 ? `✓ ${autoDraftResult.drafted} drafted`
            : autoDraftResult?.error ? 'Error'
            : 'Auto-Draft All'}
        </button>

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
            active={!filters.attention && !filters.pending_draft && !filters.status}
            onClick={() => setFilters(f => ({ ...f, status: '', attention: false, pending_draft: false }))} />
          <KpiCard label="Needs Attention" value={stats?.requires_attention ?? '—'} color={C.red} icon={AlertTriangle} warn
            active={filters.attention}
            onClick={() => setFilters(f => ({ ...f, attention: !f.attention, pending_draft: false, status: '' }))} />
          <KpiCard label="SLA Breached" value={stats?.sla_breached ?? '—'} color={C.amber} icon={Clock} warn />
          <KpiCard label="To Verify" value={stats?.tickets_to_verify ?? '—'} color={C.green} icon={Sparkles} warn
            sub="AI drafts awaiting approval"
            active={filters.pending_draft}
            onClick={() => setFilters(f => ({ ...f, pending_draft: !f.pending_draft, attention: false, status: '' }))} />
          <KpiCard label="Claim Deadlines" value={stats?.claim_deadlines_7d ?? '—'} color={C.amber} icon={AlertCircle} warn sub="due in 7 days"
            active={filters.status === 'claim_raised' || filters.status === 'claim_submitted'}
            onClick={() => setFilters(f => ({ ...f, status: 'claim_raised', attention: false, pending_draft: false }))} />
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
          onClick={() => setFilters(p => ({ ...p, attention: !p.attention, pending_draft: false }))}>
          ⚠ Attention Only
        </FilterPill>
        <FilterPill color={C.green} active={filters.pending_draft}
          onClick={() => setFilters(p => ({ ...p, pending_draft: !p.pending_draft, attention: false }))}>
          ✦ To Verify
        </FilterPill>
      </div>

      {/* ── Body: list + filter panel ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Ticket list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 12 }}>Loading…</div>}
          {!loading && queries.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.sub, marginBottom: 6 }}>No queries match</div>
              <div style={{ fontSize: 12, color: C.muted }}>Try a different filter or check back later</div>
            </div>
          )}
          {(() => {
  const attention = queries.filter(q => q.requires_attention || q.has_new_reply);
  const normal    = queries.filter(q => !q.requires_attention && !q.has_new_reply);
  return (
    <>
      {attention.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 16px 5px', background: '#08111F' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2E4A6A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Needs attention · {attention.length}
            </span>
          </div>
          {attention.map(q => (
            <InboxRow key={q.id} q={q} onClick={() => navigate(`/queries/${q.id}`)} staffList={staffList} onUpdate={refresh} />
          ))}
        </>
      )}
      {normal.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 16px 5px', background: '#08111F' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2E4A6A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Open · {normal.length}
            </span>
          </div>
          {normal.map(q => (
            <InboxRow key={q.id} q={q} onClick={() => navigate(`/queries/${q.id}`)} staffList={staffList} onUpdate={refresh} />
          ))}
        </>
      )}
    </>
  );
})()}
        </div>

        {/* Right filter panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            staffList={staffList}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>

      {showUnmatched && <UnmatchedPanel onClose={() => setShowUnmatched(false)} />}
    </div>
  );
}
