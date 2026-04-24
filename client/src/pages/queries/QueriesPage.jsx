import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Mail, Clock, User,
  Inbox, RefreshCw, MessageSquare, FileText,
  Send, Edit2, Flag, Link2,
  AlertCircle, Package, Filter, Search, X, ExternalLink, Receipt,
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

// ─── Inbox list row ───────────────────────────────────────────────────────────

const CLAIM_STATUSES = new Set(['claim_raised','awaiting_claim_docs','claim_submitted','resolved_claim_approved','resolved_claim_rejected']);

function InboxRow({ q, selected, onClick }) {
  const hasAttention   = q.requires_attention;
  const hasSlaBreached = q.sla_breached;
  const isClaim        = CLAIM_STATUSES.has(q.status);

  const accentColor = hasAttention   ? C.red
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
        background: selected ? C.selected : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.hover; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Customer name — large and prominent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          flex: 1, fontSize: 15, fontWeight: 700, color: C.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {q.customer_name || 'Unknown Customer'}
        </span>
        <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>
          {timeAgo(q.latest_email_at || q.created_at)}
        </span>
      </div>

      {/* Subject */}
      <div style={{
        fontSize: 12, color: C.sub,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {q.subject || q.consignment_number || 'No subject'}
      </div>

      {/* Status badge + attention/SLA flag + query/claim icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusBadge status={q.status} small />
        {hasAttention && (
          <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.redDim,
            padding: '1px 6px', borderRadius: 3, border: `1px solid ${C.red}33` }}>
            ⚠ ATTENTION
          </span>
        )}
        {!hasAttention && hasSlaBreached && (
          <span style={{ fontSize: 9, fontWeight: 700, color: C.amber, background: C.amberDim,
            padding: '1px 6px', borderRadius: 3, border: `1px solid ${C.amber}33` }}>
            ⏱ SLA
          </span>
        )}
        <div style={{ flex: 1 }} />
        {/* Query (filled orange triangle) or Claim (red receipt icon) */}
        {isClaim ? (
          <Receipt size={20} color={C.red} strokeWidth={1.5} title="Claim" />
        ) : (
          <AlertTriangle size={22} fill={C.amber} color={C.amber} strokeWidth={0} title="Query" />
        )}
      </div>

      {/* Email preview */}
      {q.latest_email_preview && (
        <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {q.latest_email_preview.substring(0, 85)}
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

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchQuery(queryId)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [queryId]);

  useEffect(() => { load(); }, [load]);

  // Fetch live parcel status when we know the consignment number
  useEffect(() => {
    if (!data) return;
    const q = data.query || data;
    if (!q.consignment_number) return;
    api.get(`/tracking/${encodeURIComponent(q.consignment_number)}`)
      .then(r => setParcel(r.data?.parcel || null))
      .catch(() => setParcel(null));
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

  const PARCEL_STATUS_COLOR = {
    delivered: C.green, returned: C.amber, failed_delivery: C.amber,
    exception: C.red, on_hold: C.amber, customs_hold: C.amber,
    in_transit: C.blue, out_for_delivery: C.blue, collected: C.blue,
    booked: C.muted, unknown: C.muted,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
      {/* Detail header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Customer name — large */}
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 2, lineHeight: 1.2 }}>
              {q.customer_name}
            </div>
            {/* Subject */}
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 6, lineHeight: 1.3 }}>
              {q.subject}
            </div>
            {/* Meta row: courier logo, consignment link, type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {logoUrl && (
                <img src={logoUrl} alt="" style={{ width: 24, height: 16, objectFit: 'contain', flexShrink: 0 }} />
              )}
              {q.consignment_number && (
                <button
                  onClick={() => navigate(`/tracking?q=${encodeURIComponent(q.consignment_number)}`)}
                  title="Open in tracking"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4,
                    border: `1px solid ${C.border}`, background: 'transparent', color: C.blue, fontSize: 11,
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace' }}>
                  {q.consignment_number}
                  <ExternalLink size={10} />
                </button>
              )}
              <TypeBadge type={q.query_type} small />
            </div>
          </div>
          {/* Status select */}
          <select value={q.status} onChange={handleStatusChange} disabled={statusUpdating}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
              fontSize: 11, padding: '5px 8px', cursor: 'pointer', flexShrink: 0 }}>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Parcel info bar: live status + delivery address */}
        {parcel && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 6, overflow: 'hidden' }}>
            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderBottom: parcel.recipient_address || parcel.recipient_name || parcel.recipient_postcode ? `1px solid ${C.border}` : 'none' }}>
              <Package size={12} style={{ color: PARCEL_STATUS_COLOR[parcel.status] || C.muted, flexShrink: 0 }} />
              <span style={{ color: PARCEL_STATUS_COLOR[parcel.status] || C.muted, fontWeight: 600, textTransform: 'capitalize' }}>
                {parcel.status?.replace(/_/g, ' ')}
              </span>
              {parcel.last_location && <span style={{ color: C.muted }}>· {parcel.last_location}</span>}
              {parcel.last_event_at && <span style={{ color: C.muted, marginLeft: 'auto', fontSize: 10 }}>{fmtDate(parcel.last_event_at)}</span>}
            </div>
            {/* Delivery address row */}
            {(parcel.recipient_name || parcel.recipient_address || parcel.recipient_postcode) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 11px', fontSize: 11 }}>
                <span style={{ color: C.muted, fontWeight: 600, flexShrink: 0, paddingTop: 1 }}>Delivering to</span>
                <div style={{ color: C.sub, lineHeight: 1.5 }}>
                  {parcel.recipient_name && <span style={{ fontWeight: 600, color: C.text }}>{parcel.recipient_name}</span>}
                  {parcel.recipient_address && <span style={{ color: C.muted }}>{parcel.recipient_name ? ' · ' : ''}{parcel.recipient_address}</span>}
                  {parcel.recipient_postcode && <span style={{ color: C.sub, fontWeight: 600 }}>{parcel.recipient_address || parcel.recipient_name ? ' · ' : ''}{parcel.recipient_postcode}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alert banners */}
        {q.requires_attention && q.attention_reason && (
          <div style={{ padding: '7px 11px', borderRadius: 6, background: C.redDim, border: `1px solid ${C.red}33`, fontSize: 11, color: C.red, marginBottom: 4 }}>
            ⚠ {q.attention_reason}
          </div>
        )}
        {pendingDrafts.length > 0 && (
          <div onClick={() => setTab('emails')} style={{ padding: '7px 11px', borderRadius: 6, background: C.greenDim,
            border: `1px solid ${C.green}33`, fontSize: 11, color: C.green, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={11} />
            {pendingDrafts.length} AI draft{pendingDrafts.length > 1 ? 's' : ''} waiting for approval
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {[
          { key: 'emails',   label: `Emails (${emails.length})`,             icon: Mail },
          { key: 'evidence', label: `Evidence (${evidence.length})`,         icon: FileText },
          { key: 'info',     label: 'Info',                                  icon: Package },
          { key: 'notes',    label: `Alerts (${notifications.length})`,      icon: AlertCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px 4px', border: 'none',
            borderBottom: `2px solid ${tab === key ? C.blue : 'transparent'}`,
            background: 'transparent', color: tab === key ? C.blue : C.muted,
            fontSize: 11, fontWeight: tab === key ? 700 : 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <Icon size={11} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>

        {tab === 'emails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <EmailThreads
              emails={emails}
              onApprove={handleApprove}
              onEdit={handleEdit}
              approving={approving}
              courierName={q.courier_name}
              courierCode={q.courier_code}
            />
            <div style={{ marginTop: 4 }}>
              {showFlag ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea placeholder="Why does this need attention?" value={attentionNote} onChange={e => setAttentionNote(e.target.value)}
                    style={{ background: C.card, border: `1px solid ${C.red}44`, borderRadius: 6, color: C.text, fontSize: 12, padding: 10, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleFlagAttention}
                      style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: C.red, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Flag for Attention
                    </button>
                    <button onClick={() => setShowFlag(false)}
                      style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowFlag(true)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Flag size={11} /> Flag for attention
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
    try {
      const r = await fetch('/api/queries/seed-now', { method: 'POST' });
      const j = await r.json();
      if (j.error) {
        setState('error');
        setMsg(j.error + (j.detail ? ' — ' + j.detail : ''));
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
