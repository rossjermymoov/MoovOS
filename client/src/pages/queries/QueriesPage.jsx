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
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Design tokens — professional dark, not neon ──────────────────────────────

const _BUILD = '2026-05-23-filter-fixes'; // cache bust — fix claim deadline filter + sla breached clickable

const C = {
  bg:       '#F8FAFC',
  surface:  '#F8FAFC',
  card:     '#FFFFFF',
  hover:    '#F4F6FA',
  selected: '#EFF6FF',
  border:   'rgba(0,0,0,0.06)',
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

const STATUS_CFG = {
  open:                    { label: 'Open',              color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  awaiting_customer_info:  { label: 'Awaiting customer', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  info_received:           { label: 'Info received',     color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  drafting:                { label: 'Drafting',          color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  awaiting_courier:        { label: 'Awaiting courier',  color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  courier_replied:         { label: 'Courier replied',   color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  courier_investigating:   { label: 'Investigating',     color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  awaiting_customer:       { label: 'Awaiting customer', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  claim_raised:            { label: 'Claim raised',      color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
  awaiting_claim_docs:     { label: 'Awaiting docs',     color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
  claim_submitted:         { label: 'Claim submitted',   color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  resolved:                { label: 'Resolved',          color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  resolved_claim_approved: { label: 'Claim approved',    color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  resolved_claim_rejected: { label: 'Claim rejected',    color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
  escalated:               { label: 'Escalated',         color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
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
  const cfg = STATUS_CFG[status] || { label: status, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: small ? 10 : 11, fontWeight: 600,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 20,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type, small }) {
  const cfg = TYPE_CFG[type] || { label: type, color: C.muted };
  return <Badge label={cfg.label} color={cfg.color} small={small} />;
}

const GROUP_BADGE_CFG = {
  'Claims':    { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  'Billing':   { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  'Technical': { bg: '#F5F3FF', color: '#4C1D95', border: '#DDD6FE' },
  'Queries':   { bg: '#EFF6FF', color: '#1E3A8A', border: '#BFDBFE' },
};

function GroupBadge({ group }) {
  if (!group) return null;
  const cfg = GROUP_BADGE_CFG[group] || { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11, fontWeight: 600,
      padding: '3px 9px',
      borderRadius: 6,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{group}</span>
  );
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
  out_for_delivery:    { label: 'Out for Delivery',             color: '#D97706', bg: 'rgba(255,193,7,0.12)',    icon: Truck },
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
  unknown:             { label: 'Unknown',                      color: '#64748B', bg: 'rgba(0,0,0,0.05)',       icon: Package },
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
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.03))' }} />
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
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
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
      background: '#FFFFFF',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
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
          padding: '7px 10px', background: '#F1F5F9',
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
        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 10,
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {q.latest_email_preview}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10,
        borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <User size={11} color={C.muted} />
        <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{assigneeName || 'Unassigned'}</span>
        <Clock size={10} color={C.muted} />
        <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(q.created_at)}</span>
      </div>
    </div>
  );
}

// ─── AI summary helper ────────────────────────────────────────────────────────
function getAiSummary(q) {
  if (q.requires_attention && q.attention_reason)
    return { text: q.attention_reason.slice(0, 80), color: C.red };
  if (q.claim_deadline_at) {
    const days = Math.ceil((new Date(q.claim_deadline_at) - Date.now()) / 86400000);
    if (days <= 3)
      return { text: days <= 0 ? 'Claim deadline today' : `Claim deadline in ${days}d`, color: C.amber };
  }
  if (q.sla_breached)
    return { text: 'SLA overdue — needs response', color: C.red };
  // Use description as AI-generated intent summary when available
  if (q.description) {
    const angry = /angry|very angry/.test(q.description);
    const frustrated = /frustrated/.test(q.description);
    const color = angry ? C.red : frustrated ? C.amber : C.blue;
    return { text: q.description.slice(0, 80), color };
  }
  return { text: '', color: C.muted };
}


// ─── Type icon well ───────────────────────────────────────────────────────────
const TYPE_ICON_CFG = {
  whereabouts:    { Icon: Package,       bg: '#EFF6FF', color: '#2563EB' },
  not_delivered:  { Icon: PackageX,      bg: '#FEF2F2', color: '#DC2626' },
  wrong_address:  { Icon: MapPin,        bg: '#FFFBEB', color: '#D97706' },
  damaged:        { Icon: AlertTriangle, bg: '#FEF2F2', color: '#DC2626' },
  missing_items:  { Icon: PackageCheck,  bg: '#FFFBEB', color: '#D97706' },
  failed_delivery:{ Icon: Truck,         bg: '#FEF2F2', color: '#DC2626' },
  returned:       { Icon: RotateCcw,     bg: '#FFFBEB', color: '#D97706' },
  delay:          { Icon: Clock,         bg: '#EFF6FF', color: '#2563EB' },
  other:          { Icon: MessageSquare, bg: '#F8FAFC', color: '#94A3B8' },
};

function TypeIconWell({ type }) {
  const cfg = TYPE_ICON_CFG[type] || TYPE_ICON_CFG.other;
  const { Icon, bg, color } = cfg;
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} style={{ color }} strokeWidth={1.8} />
    </div>
  );
}

function rowAccentColor(q) {
  if (q.requires_attention) return '#EF4444';
  if (['claim_raised','awaiting_claim_docs','escalated','resolved_claim_rejected'].includes(q.status)) return '#EF4444';
  if (['awaiting_courier','courier_investigating','claim_submitted'].includes(q.status)) return '#F59E0B';
  if (['resolved','resolved_claim_approved'].includes(q.status)) return '#00C853';
  const d = (q.description || '').toLowerCase();
  if (/very angry|furious|outrageous|unacceptable/.test(d)) return '#EF4444';
  if (/frustrated|angry/.test(d)) return '#F59E0B';
  if (q.has_new_reply) return '#3B82F6';
  return 'rgba(0,0,0,0.10)';
}

// Render light markdown (**bold**) as clean JSX — strips the raw asterisks and
// maps emphasis to <strong>, no dangerouslySetInnerHTML.
function mdLite(text) {
  if (!text) return null;
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      /^\*\*[^*]+\*\*$/.test(part)
        ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
        : <span key={i}>{part.replace(/\*\*/g, '')}</span>
    );
}

function InboxRow({ q, onClick, staffList = [], onUpdate }) {
  const [hoverPos,   setHoverPos]   = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning,  setAssigning]  = useState(false);

  async function handleAssign(staffId) {
    setAssigning(true);
    setAssignOpen(false);
    try {
      await fetch(`/api/queries/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: staffId || null }),
      });
      onUpdate && onUpdate();
    } catch (e) { console.error('Assign failed', e); }
    finally { setAssigning(false); }
  }

  const logoUrl      = q.courier_code ? getCourierLogo(q.courier_code) : null;
  const statusCfg    = STATUS_CFG[q.status] || { label: q.status, color: C.muted, bg: 'rgba(148,163,184,0.1)' };
  const assigneeName = staffList.find(s => s.id === q.assigned_to)?.full_name;
  const initials     = assigneeName ? assigneeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : null;
  const unread       = parseInt(q.unread_emails) || 0;
  const hasNewReply  = q.has_new_reply;
  const aiSummary    = getAiSummary(q);
  const preview      = q.latest_email_preview || q.description || '';

  // Priority → left-edge indicator (red urgent / amber medium / blue standard)
  const priority     = (q.priority || '').toLowerCase();
  const isScreamer   = priority === 'urgent' || q.is_screamer === true;
  const priorityBar  = isScreamer ? '#EF4444' : priority === 'medium' ? '#F59E0B' : '#3B82F6';
  const happiness    = q.customer_happiness_score != null && !isNaN(parseInt(q.customer_happiness_score)) ? parseInt(q.customer_happiness_score) : null;
  const sentiment    = q.sentiment || (happiness == null ? null : happiness < 41 ? 'Frustrated customer' : happiness < 71 ? 'Neutral tone' : 'Positive');
  const ticketId     = q.ticket_number != null ? `Moov-${q.ticket_number}` : null;
  // Full AI summary for the hover card (getAiSummary truncates to 80 chars).
  const fullSummary  = q.description || q.attention_reason || preview || '';
  // Dynamic colour scheme for the hover card — red urgent / amber medium / blue standard.
  const cardUrgent   = isScreamer || q.sla_breached;
  const cardTone     = cardUrgent
    ? { header: 'text-red-600',   topBorder: 'border-t-4 border-t-red-500',   footer: '🚨 URGENT: Action Required.',                 footerCls: 'font-semibold text-red-600' }
    : priority === 'medium'
      ? { header: 'text-amber-600', topBorder: 'border-t-4 border-t-amber-500', footer: '⚠️ Medium priority, monitor closely.',         footerCls: 'text-amber-600' }
      : { header: 'text-blue-600',  topBorder: 'border-t-4 border-t-blue-400',  footer: '✓ Standard priority, no escalation flagged.', footerCls: 'text-slate-500' };

  // SLA label
  let slaLabel = null, slaColor = C.muted, slaType = '';
  if (q.claim_deadline_at) {
    const days = Math.ceil((new Date(q.claim_deadline_at) - Date.now()) / 86400000);
    slaLabel = days < 0 ? 'Claim overdue' : days === 0 ? 'Due today' : `${days}d left`;
    slaColor = days < 0 ? C.red : days < 3 ? C.amber : C.green;
    slaType  = 'Claim deadline';
  } else if (q.sla_breached) {
    slaLabel = 'Overdue'; slaColor = C.red; slaType = 'Response SLA';
  } else if (q.sla_mins_remaining != null) {
    const mins = parseFloat(q.sla_mins_remaining);
    if (mins < 0)    { slaLabel = 'Overdue';                                    slaColor = C.red;   }
    else if (mins < 240) { slaLabel = `${Math.round(mins / 60)}h left`;         slaColor = C.amber; }
    else             { slaLabel = 'On track';                                    slaColor = C.green; }
    slaType = 'First response';
  }

  // Activity
  const actTime  = q.latest_email_at || q.created_at;
  const actLabel = hasNewReply ? 'Customer replied'
                 : q.latest_email_at ? 'You replied'
                 : 'Opened';
  const actColor = hasNewReply ? C.blue : C.muted;

  return (
    <div
      onClick={onClick}
      onMouseLeave={() => { setHoverPos(null); setAssignOpen(false); }}
      className="relative overflow-visible hover:z-10"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 16px 16px 16px',
        border: `1px solid rgba(0,0,0,0.07)`,
        borderLeft: `4px solid ${priorityBar}`,
        borderRadius: 12,
        marginBottom: 8,
        cursor: 'pointer',
        background: C.card,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.12s ease, background 0.08s ease, transform 0.08s ease',
        position: 'relative',
      }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.background = C.hover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'; e.currentTarget.style.background = C.card; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Type icon */}
      <TypeIconWell type={q.query_type} />

      {/* Subject + customer + ticket id */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {(hasNewReply || unread > 0) && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          )}
          <span className={`truncate text-[15px] font-semibold ${
            ['resolved','resolved_claim_approved','resolved_claim_rejected'].includes(q.status)
              ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {q.subject || q.customer_name || '(no subject)'}
          </span>
          {isScreamer && (
            <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              Urgent
            </span>
          )}
          {q.courier_sla_breached && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
              <AlertTriangle size={11} /> Awaiting Courier — SLA Breached
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          {ticketId && <span className="font-mono text-xs text-slate-400">{ticketId}</span>}
          {ticketId && <span className="text-slate-300">·</span>}
          <span className="truncate">{q.customer_name}</span>
          {q.consignment_number && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-xs text-slate-400">{q.consignment_number}</span>
            </>
          )}
        </div>
      </div>

      {/* AI summary — relative group; hover reveals the floating insight card */}
      <div className="group relative flex w-[140px] shrink-0 justify-start" onClick={e => e.stopPropagation()}>
        <span className={`inline-flex cursor-default items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
          isScreamer ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-500'}`}>
          <Sparkles size={12} />
          {isScreamer ? 'Urgent risk' : 'AI summary'}
        </span>

        {/* Floating hover card — h-auto, colour adapts to priority/sentiment */}
        <div className={`hidden group-hover:block absolute z-50 right-0 top-8 h-auto min-w-[24rem] max-w-md rounded-xl border border-slate-100 bg-white px-4 pt-4 pb-4 text-left shadow-xl ${cardTone.topBorder}`}>
          <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${cardTone.header}`}>
            <Sparkles size={12} /> AI overview
          </div>
          <p className="whitespace-normal break-words text-sm leading-relaxed text-slate-700">
            {mdLite(fullSummary || 'No AI summary yet for this ticket.')}
          </p>
          {sentiment && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                cardUrgent || (happiness != null && happiness < 41) ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                {sentiment}{cardUrgent ? ' / high risk' : ''}
              </span>
            </div>
          )}
          <p className={`mt-3 whitespace-normal break-words text-xs leading-relaxed ${cardTone.footerCls}`}>
            {cardTone.footer}
          </p>
        </div>
      </div>

      {/* Group */}
      <div style={{ width: 88, flexShrink: 0 }}>
        <GroupBadge group={q.group_name} />
      </div>

      {/* Happiness score */}
      <div style={{ width: 52, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        {q.customer_happiness_score != null && !isNaN(parseInt(q.customer_happiness_score)) && (() => {
          const score = parseInt(q.customer_happiness_score);
          const isGreen = score >= 71;
          const isAmber = score >= 41 && score < 71;
          const bg    = isGreen ? 'rgba(0,200,83,0.10)'  : isAmber ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)';
          const color = isGreen ? '#059669'               : isAmber ? '#D97706'               : '#DC2626';
          const dot   = isGreen ? '#00C853'               : isAmber ? '#F59E0B'               : '#EF4444';
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
              {score}
            </span>
          );
        })()}
      </div>

      {/* Status */}
      <div style={{ width: 110, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 500, borderRadius: 20,
          padding: '3px 9px', display: 'inline-block', whiteSpace: 'nowrap',
          background: statusCfg.bg || `${statusCfg.color}18`,
          color: statusCfg.color,
        }}>
          {statusCfg.label}
        </span>
      </div>

      {/* SLA */}
      <div style={{ width: 100, flexShrink: 0 }}>
        {slaLabel && (
          <>
            <div style={{ fontSize: 12, fontWeight: 500, color: slaColor, lineHeight: 1.3 }}>{slaLabel}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{slaType}</div>
          </>
        )}
      </div>

      {/* Activity */}
      <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 12, color: actColor, fontWeight: hasNewReply ? 500 : 400 }}>{timeAgo(actTime)}</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{actLabel}</div>
      </div>

      {/* Avatar — click to assign */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          onClick={e => { e.stopPropagation(); setAssignOpen(v => !v); }}
          title={assigneeName ? `Assigned to ${assigneeName}` : 'Assign ticket'}
          style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: initials ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 500,
            color: initials ? '#4F46E5' : C.muted,
            cursor: 'pointer',
            outline: assignOpen ? '2px solid #6366F1' : 'none',
            transition: 'outline 0.1s',
          }}>
          {assigning ? '…' : (initials || <User size={12} color={C.muted} />)}
        </div>

        {assignOpen && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              right: 'auto',
              zIndex: 9999,
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.10)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: 180,
              padding: '4px 0',
            }}
            ref={el => {
              if (el) {
                const rect = el.previousSibling?.getBoundingClientRect?.() || {};
                el.style.top  = (rect.bottom + 4) + 'px';
                el.style.left = Math.min(rect.left, window.innerWidth - 190) + 'px';
              }
            }}
          >
            <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8' }}>
              Assign to
            </div>
            {staffList.map(s => (
              <div
                key={s.id}
                onClick={() => handleAssign(s.id)}
                style={{
                  padding: '7px 12px', fontSize: 13, color: s.id === q.assigned_to ? '#4F46E5' : '#0F172A',
                  background: s.id === q.assigned_to ? 'rgba(99,102,241,0.06)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseOver={e => { if (s.id !== q.assigned_to) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseOut={e => { if (s.id !== q.assigned_to) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#4F46E5', flexShrink: 0 }}>
                  {s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span>{s.full_name}</span>
                {s.id === q.assigned_to && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4F46E5' }}>✓</span>}
              </div>
            ))}
            {q.assigned_to && (
              <div
                onClick={() => handleAssign(null)}
                style={{ padding: '7px 12px', fontSize: 12, color: '#94A3B8', cursor: 'pointer', borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 2 }}
                onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                Unassign
              </div>
            )}
          </div>
        )}
      </div>

    </div>
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
    bubbleBg = isDraft ? '#F0FDF4' : '#EFF6FF';
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
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 12, paddingTop: 4 }}>Ticket</div>

          {/* Status */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Status</div>
            <select value={q.status} onChange={handleStatusChange} disabled={statusUpdating}
              style={{ width: '100%', background: STATUS_CFG[q.status]?.bg || C.card,
                border: `1px solid ${(STATUS_CFG[q.status]?.color || C.muted) + '44'}`,
                borderRadius: 6, color: STATUS_CFG[q.status]?.color || C.text,
                fontSize: 11, padding: '5px 8px', cursor: 'pointer', fontWeight: 700, outline: 'none' }}>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#FFFFFF', color: '#0F172A', fontWeight: 400 }}>{v.label}</option>
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
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: 12 }}>Parcel</div>

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
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                        background: i === 0 ? cfg.color : '#E2E8F0',
                        border: `2px solid ${i === 0 ? cfg.color + '44' : '#F1F5F9'}`,
                        boxShadow: i === 0 ? `0 0 0 3px ${cfg.color}22` : 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: i === 0 ? 600 : 400,
                          color: i === 0 ? '#0F172A' : '#64748B', lineHeight: 1.3, marginBottom: 2 }}>
                          {ev.description || cfg.label}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>
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
                    background: C.red, color: '#0F172A', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
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

// ── Dynamic group configuration ──────────────────────────────────────────────
// Foundation for the settings-driven groups: add a string here (or, later, load
// this array from /settings) and a colour-coded tab appears automatically.
const userDefinedGroups = ['Claims', 'Queries', 'Billing', 'Technical'];

const GROUP_COLORS = {
  Claims:    '#D97706',
  Queries:   '#2563EB',
  Billing:   '#059669',
  Technical: '#7C3AED',
};
const DEFAULT_GROUP_COLOR = '#0F172A';
const groupColor = (group) => GROUP_COLORS[group] || DEFAULT_GROUP_COLOR;

const GROUP_TABS = [
  { key: 'all', label: 'All', group: '' },
  ...userDefinedGroups.map(g => ({ key: g.toLowerCase(), label: g, group: g })),
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
  width: '100%', background: '#FFFFFF',
  border: `1px solid rgba(0,0,0,0.12)`,
  borderRadius: 6, color: '#0F172A', fontSize: 12,
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
  const { user } = useAuth();
  const [queries,       setQueries]       = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [staffList,     setStaffList]     = useState([]);
  const [filters,       setFilters]       = useState({
    status: '', attention: false, pending_draft: false, claim_deadline: false,
    sla_breached: false, search: '',
    assigned_to: '', query_type: '', priority: '', group_name: '', courier: '',
  });
  const [autoDrafting,  setAutoDrafting]  = useState(false);
  const [autoDraftResult, setAutoDraftResult] = useState(null);

  useEffect(() => {
    fetchStats(user?.id).then(setStats).catch(console.error);
  }, [refreshKey, user?.id]);

  // Active workspace derives from the assigned_to filter.
  const workspace = filters.assigned_to === 'unassigned' ? 'unassigned'
    : (user?.id && filters.assigned_to === user.id) ? 'mine'
    : 'all';
  const setWorkspace = (key) => setFilters(f => ({
    ...f,
    status: '',
    assigned_to: key === 'unassigned' ? 'unassigned' : key === 'mine' ? (user?.id || '') : '',
  }));

  useEffect(() => {
    api.get('/staff').then(r => setStaffList(r.data)).catch(() => {});
  }, []);

  const PAGE_SIZE = 50;

  const paramsFromFilters = useCallback(() => {
    const params = {};
    if (filters.status)          params.status              = filters.status;
    if (filters.attention)       params.attention           = true;
    if (filters.pending_draft)   params.pending_draft       = true;
    if (filters.claim_deadline)  params.claim_deadline_days = 7;
    if (filters.sla_breached)    params.sla_breached        = true;
    if (filters.search)          params.search              = filters.search;
    if (filters.assigned_to)     params.assigned_to         = filters.assigned_to;
    if (filters.query_type)      params.query_type          = filters.query_type;
    if (filters.priority)        params.priority            = filters.priority;
    if (filters.group_name)      params.group_name          = filters.group_name;
    if (filters.courier)         params.courier             = filters.courier;
    return params;
  }, [filters]);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchInbox({ ...paramsFromFilters(), limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      setQueries(d.queries || []);
      setTotal(d.total ?? (d.queries || []).length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [paramsFromFilters, page]);

  // Any filter change resets to the first page.
  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  useEffect(() => {
    if (refreshKey > 0) loadInbox();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pagination maths + a windowed list of page numbers.
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx   = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx     = Math.min(page * PAGE_SIZE, total);
  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const out = [1];
    const lo = Math.max(2, page - 1), hi = Math.min(totalPages - 1, page + 1);
    if (lo > 2) out.push('…');
    for (let i = lo; i <= hi; i++) out.push(i);
    if (hi < totalPages - 1) out.push('…');
    out.push(totalPages);
    return out;
  })();

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const panelFilterCount = [filters.assigned_to, filters.query_type, filters.priority, filters.group_name, filters.courier].filter(Boolean).length;

  // When "All Open" (no explicit status filter), always hide resolved tickets.
  const RESOLVED_STATUSES = new Set(['resolved', 'resolved_claim_approved', 'resolved_claim_rejected']);
  const displayQueries = filters.status
    ? queries
    : queries.filter(q => !RESOLVED_STATUSES.has(q.status));

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, color: C.text, overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `0.5px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>Queries</span>

        {/* Workspace switcher — Unassigned / Assigned to me / All open */}
        <div className="ml-2 inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { key: 'unassigned', label: 'Unassigned',      count: stats?.unassigned },
            { key: 'mine',       label: 'Assigned to me',  count: stats?.assigned_to_me },
            { key: 'all',        label: 'All open',        count: stats?.total_open },
          ].map(w => {
            const active = workspace === w.key;
            return (
              <button
                key={w.key}
                onClick={() => setWorkspace(w.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition
                  ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {w.label}
                {w.count != null && (
                  <span className={`rounded-full px-1.5 text-xs font-semibold
                    ${active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {w.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input
            placeholder="Search consignment, customer…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 8, color: C.text,
              fontSize: 12, padding: '7px 10px 7px 28px', width: 220, outline: 'none' }}
          />
        </div>
        {/* Sort indicator */}
        <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} style={{ cursor: 'pointer' }} onClick={refresh} />
          Last activity
        </span>
        {/* New query */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
          border: 'none', background: '#0F172A',
          color: '#F8FAFC', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.01em',
          transition: 'background 0.12s, box-shadow 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 400 }}>+</span> New query
        </button>
      </div>

      {/* ── KPI cards — active workload triage ─────────────────────────────── */}
      <div className="flex shrink-0 gap-3 bg-slate-50 px-[18px] pb-3 pt-3.5">
        {[
          { label: 'Unassigned',            value: stats?.unassigned,        tone: '#4F46E5', onClick: () => setWorkspace('unassigned'),                                                         active: workspace === 'unassigned' },
          { label: 'SLA breached / urgent', value: stats?.sla_breached,      tone: '#DC2626', onClick: () => setFilters(f => ({ ...f, sla_breached: !f.sla_breached, attention: false })),       active: filters.sla_breached },
          { label: 'Awaiting us',           value: stats?.awaiting_us,       tone: '#D97706', onClick: () => setFilters(f => ({ ...f, status: f.status === 'open' ? '' : 'open', attention: false })),                 active: filters.status === 'open' },
          { label: 'Awaiting customer',     value: stats?.awaiting_customer, tone: '#475569', onClick: () => setFilters(f => ({ ...f, status: f.status === 'awaiting_customer' ? '' : 'awaiting_customer', attention: false })), active: filters.status === 'awaiting_customer' },
        ].map(k => (
          <button
            key={k.label}
            onClick={k.onClick}
            className={`flex flex-1 flex-col items-start rounded-2xl border bg-white p-4 text-left transition hover:shadow-sm
              ${k.active ? 'border-slate-300 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
          >
            <span className="text-3xl font-semibold leading-none" style={{ color: (k.value ?? 0) > 0 ? k.tone : '#94A3B8' }}>
              {k.value ?? '—'}
            </span>
            <span className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">{k.label}</span>
          </button>
        ))}
      </div>

      {/* ── Group tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `0.5px solid ${C.border}`, background: C.bg, flexShrink: 0, padding: '0 18px', gap: 2 }}>
        {GROUP_TABS.map(t => {
          const isActive = t.group === '' ? !filters.group_name : filters.group_name === t.group;
          const color = groupColor(t.group);
          return (
            <button key={t.key} onClick={() => setFilters(f => ({ ...f, group_name: t.group, attention: false, status: '' }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', border: 'none', background: 'none',
                borderBottom: `2px solid ${isActive ? color : 'transparent'}`,
                color: isActive ? color : C.muted,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', marginBottom: -0.5, whiteSpace: 'nowrap',
                transition: 'color 0.1s',
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.color = C.sub; }}
              onMouseOut={e => { if (!isActive) e.currentTarget.style.color = C.muted; }}
            >
              {t.group !== '' && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0,
                  opacity: isActive ? 1 : 0.5 }} />
              )}
              {t.label}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {/* Status sub-filters as smaller pills */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '6px 0' }}>
          <FilterPill color={C.red} active={filters.attention}
            onClick={() => setFilters(p => ({ ...p, attention: !p.attention, pending_draft: false }))}>
            ⚠ Attention
          </FilterPill>
          <FilterPill color={C.green} active={filters.pending_draft}
            onClick={() => setFilters(p => ({ ...p, pending_draft: !p.pending_draft, attention: false }))}>
            ✦ To verify
          </FilterPill>
          <FilterPill color={C.blue} active={filters.status === 'resolved'}
            onClick={() => setFilters(p => ({ ...p, status: p.status === 'resolved' ? '' : 'resolved', attention: false }))}>
            Resolved
          </FilterPill>
        </div>
      </div>

      {/* ── Body: list + filter panel ────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/* Ticket list */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 12px 16px' }}>
          {loading && <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 12 }}>Loading…</div>}
          {!loading && displayQueries.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.sub, marginBottom: 6 }}>No queries match</div>
              <div style={{ fontSize: 12, color: C.muted }}>Try a different filter or check back later</div>
            </div>
          )}
          {!loading && displayQueries.length > 0 && (
            <>
              {/* Column headers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 16px 8px 16px' }}>
                <div style={{ width: 36, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Subject</div>
                <div style={{ width: 160, flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Summary</div>
                <div style={{ width: 88, flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Group</div>
                <div style={{ width: 52, flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Health</div>
                <div style={{ width: 110, flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</div>
                <div style={{ width: 100, flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>SLA</div>
                <div style={{ width: 80, flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Activity</div>
                <div style={{ width: 26, flexShrink: 0 }} />
              </div>
              {/* Rows sorted by last activity */}
              {[...displayQueries]
                .sort((a, b) => new Date(b.latest_email_at || b.created_at) - new Date(a.latest_email_at || a.created_at))
                .map(q => (
                  <InboxRow key={q.id} q={q} onClick={() => navigate(`/queries/${q.id}`)} staffList={staffList} onUpdate={refresh} />
                ))
              }
            </>
          )}
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

      {/* ── Pagination footer ──────────────────────────────────────────────── */}
      {total > 0 && (
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
          <span className="text-sm text-slate-500">
            Showing {startIdx}-{endIdx} of {total} entries
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600
                         transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {pageNumbers.map((n, i) =>
              n === '…' ? (
                <span key={`e${i}`} className="px-2 text-sm text-slate-400">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`min-w-[36px] rounded-lg border px-3 py-1.5 text-sm font-medium transition
                    ${n === page
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600
                         transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showUnmatched && <UnmatchedPanel onClose={() => setShowUnmatched(false)} />}
    </div>
  );
}
