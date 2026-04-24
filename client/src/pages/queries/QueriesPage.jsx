import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle, Mail, Clock, CheckCircle, User,
  Inbox, RefreshCw, ChevronRight,
  MessageSquare, FileText, Send, Edit2, Flag, Link,
  AlertCircle, Package, Zap, Filter, Search, Plus, X,
} from 'lucide-react';
import {
  fetchInbox, fetchStats, fetchQuery, updateQuery,
  approveEmail, flagAttention, fetchUnmatched, mapSender,
  fetchSenderSuggestions,
} from '../../api/queries';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:      '#0A0B1E',
  surface: '#14162A',
  card:    '#1A1D35',
  hover:   '#20244A',
  border:  'rgba(255,255,255,0.07)',
  green:   '#00C853',
  amber:   '#FFC107',
  red:     '#E91E8C',
  blue:    '#00BCD4',
  text:    '#FFFFFF',
  muted:   '#AAAAAA',
  greenDim:  'rgba(0,200,83,0.12)',
  amberDim:  'rgba(255,193,7,0.12)',
  redDim:    'rgba(233,30,140,0.12)',
  blueDim:   'rgba(0,188,212,0.12)',
};

const STATUS_CFG = {
  open:                     { label: 'Open',               color: C.blue,   bg: C.blueDim },
  awaiting_customer_info:   { label: 'Awaiting Customer',  color: C.amber,  bg: C.amberDim },
  info_received:            { label: 'Info Received',       color: C.green,  bg: C.greenDim },
  awaiting_courier:         { label: 'Awaiting Courier',    color: C.amber,  bg: C.amberDim },
  courier_replied:          { label: 'Courier Replied',     color: C.green,  bg: C.greenDim },
  courier_investigating:    { label: 'Investigating',        color: C.amber,  bg: C.amberDim },
  claim_raised:             { label: 'Claim Raised',        color: C.red,    bg: C.redDim },
  awaiting_claim_docs:      { label: 'Awaiting Claim Docs', color: C.red,    bg: C.redDim },
  claim_submitted:          { label: 'Claim Submitted',     color: C.amber,  bg: C.amberDim },
  resolved:                 { label: 'Resolved',            color: C.green,  bg: C.greenDim },
  resolved_claim_approved:  { label: 'Claim Approved',      color: C.green,  bg: C.greenDim },
  resolved_claim_rejected:  { label: 'Claim Rejected',      color: C.red,    bg: C.redDim },
};

const TYPE_CFG = {
  whereabouts:   { label: 'Whereabouts',    color: C.blue },
  not_delivered: { label: 'Not Delivered',  color: C.red },
  wrong_address: { label: 'Wrong Address',  color: C.red },
  damaged:       { label: 'Damaged',        color: C.red },
  missing_items: { label: 'Missing Items',  color: C.red },
  failed_delivery: { label: 'Failed Delivery', color: C.amber },
  returned:      { label: 'Returned',       color: C.amber },
  delay:         { label: 'Delay',          color: C.amber },
  other:         { label: 'Other',          color: C.muted },
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Badge({ label, color, bg, small }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: small ? '2px 7px' : '3px 10px',
      borderRadius: 20,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      letterSpacing: '0.3px',
      background: bg || `${color}22`,
      color,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function StatusBadge({ status, small }) {
  const cfg = STATUS_CFG[status] || { label: status, color: C.muted, bg: 'rgba(170,170,170,0.1)' };
  return <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} small={small} />;
}

function TypeBadge({ type, small }) {
  const cfg = TYPE_CFG[type] || { label: type, color: C.muted };
  return <Badge label={cfg.label} color={cfg.color} small={small} />;
}

function Pill({ color, children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 20,
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        background: active ? `${color}22` : 'transparent',
        color: active ? color : C.muted,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
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

// ─── Dashboard KPI card ───────────────────────────────────────────────────────

function KpiCard({ label, value, color, sub, onClick, active, icon: Icon, warn }) {
  const isClickable = !!onClick;
  const col = warn && value > 0 ? color : value === 0 ? C.muted : color;
  return (
    <button
      onClick={onClick}
      style={{
        flex: '1 1 120px',
        minWidth: 100,
        background: active ? `${color}18` : C.card,
        border: `1px solid ${active ? color : value > 0 && warn ? `${color}44` : C.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: isClickable ? 'pointer' : 'default',
        textAlign: 'left',
        transition: 'all 0.15s',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        {Icon && <Icon size={12} style={{ color: col, flexShrink: 0 }} />}
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', lineHeight: 1 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: active ? color : value > 0 && warn ? color : C.text, lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </button>
  );
}

// ─── Inbox row ────────────────────────────────────────────────────────────────

function InboxRow({ q, selected, onClick }) {
  const hasAttention   = q.requires_attention;
  const hasSlaBreached = q.sla_breached;
  const hasDrafts      = q.pending_drafts > 0;
  const claimUrgent    = q.claim_days_remaining !== null && q.claim_days_remaining <= 3;

  const accent = hasAttention   ? C.red
               : hasSlaBreached ? C.amber
               : hasDrafts      ? C.green
               : C.border;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${selected ? C.green : accent}`,
        background: selected ? C.hover : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Row 1: consignment + flags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {q.consignment_number || 'No consignment'}
        </span>
        {hasAttention && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.red, background: C.redDim, padding: '2px 6px', borderRadius: 10 }}>
            ⚠ ATTENTION
          </span>
        )}
        {hasDrafts && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim, padding: '2px 6px', borderRadius: 10 }}>
            {q.pending_drafts} DRAFT{q.pending_drafts > 1 ? 'S' : ''}
          </span>
        )}
        {claimUrgent && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, background: C.amberDim, padding: '2px 6px', borderRadius: 10 }}>
            {q.claim_days_remaining}d LEFT
          </span>
        )}
      </div>

      {/* Row 2: customer + type + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: C.muted, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {q.customer_name}
        </span>
        <TypeBadge type={q.query_type} small />
        <StatusBadge status={q.status} small />
      </div>

      {/* Row 3: preview + age */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 11, color: C.muted, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic',
        }}>
          {q.latest_email_preview ? q.latest_email_preview.substring(0, 80) : q.subject || 'No messages yet'}
        </span>
        <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{timeAgo(q.latest_email_at || q.created_at)}</span>
      </div>

      {hasSlaBreached && (
        <div style={{ fontSize: 10, color: C.amber, fontWeight: 600 }}>
          ⏱ SLA breached — {q.courier_name}
        </div>
      )}
    </div>
  );
}

// ─── Email thread item ────────────────────────────────────────────────────────

function EmailItem({ email, onApprove, onEdit, approving }) {
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState(email.body_text || '');
  const isDraft = email.is_ai_draft && !email.sent_at && !email.ai_draft_approved_by;
  const isSent  = !!email.sent_at;
  const dir     = email.direction;

  const dirColor = dir === 'inbound_customer' ? C.blue : dir === 'outbound_customer' ? C.green : C.amber;
  const dirLabel = dir === 'inbound_customer' ? '← Customer' : dir === 'outbound_customer' ? '→ Customer' : dir === 'inbound_courier' ? '← Courier' : '→ Courier';

  return (
    <div style={{
      border: `1px solid ${isDraft ? `${C.green}55` : C.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: isDraft ? `${C.green}08` : C.card,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: dirColor, background: `${dirColor}22`, padding: '2px 8px', borderRadius: 10 }}>
          {dirLabel}
        </span>
        {isDraft && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim, padding: '2px 8px', borderRadius: 10 }}>
            🤖 AI DRAFT — PENDING APPROVAL
          </span>
        )}
        {isSent && <span style={{ fontSize: 10, color: C.muted }}>Sent {fmtDate(email.sent_at)}</span>}
        {!isSent && !isDraft && <span style={{ fontSize: 10, color: C.muted }}>Received {fmtDate(email.created_at)}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>
          {email.from_address || email.to_address}
        </span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {editMode ? (
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            style={{
              width: '100%', minHeight: 140, background: C.surface,
              border: `1px solid ${C.green}44`, borderRadius: 6,
              color: C.text, fontSize: 12, padding: 10, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        ) : (
          <pre style={{
            margin: 0, fontSize: 12, color: C.muted,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            lineHeight: 1.6, maxHeight: 220, overflow: 'auto',
          }}>
            {email.body_text || '(no body)'}
          </pre>
        )}
      </div>

      {isDraft && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {editMode ? (
            <>
              <button onClick={() => { onEdit(email.id, editBody); setEditMode(false); }}
                style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: C.green, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Save &amp; Approve
              </button>
              <button onClick={() => { setEditMode(false); setEditBody(email.body_text || ''); }}
                style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onApprove(email.id, email.body_text)} disabled={approving}
                style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: C.green, color: '#000', fontSize: 12, fontWeight: 700, cursor: approving ? 'default' : 'pointer', opacity: approving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={13} />{approving ? 'Sending…' : 'Approve & Send'}
              </button>
              <button onClick={() => setEditMode(true)}
                style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit2 size={12} /> Edit First
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Query detail panel ───────────────────────────────────────────────────────

function QueryDetail({ queryId, onClose, onUpdated }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('emails');
  const [approving, setApproving] = useState(false);
  const [attentionNote,       setAttentionNote]       = useState('');
  const [showAttentionInput,  setShowAttentionInput]  = useState(false);
  const [statusUpdating,      setStatusUpdating]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchQuery(queryId)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [queryId]);

  useEffect(() => { load(); }, [load]);

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
    try { await flagAttention(queryId, { reason: attentionNote }); setAttentionNote(''); setShowAttentionInput(false); await load(); onUpdated?.(); }
    catch (err) { alert(err.message); }
  }

  async function handleStatusChange(e) {
    setStatusUpdating(true);
    try { await updateQuery(queryId, { status: e.target.value }); await load(); onUpdated?.(); }
    catch (err) { alert(err.message); }
    finally { setStatusUpdating(false); }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
      Loading…
    </div>
  );
  if (!data) return null;

  const q = data.query || data;
  const emails        = data.emails        || [];
  const evidence      = data.evidence      || [];
  const notifications = data.notifications || [];
  const pendingDrafts = emails.filter(e => e.is_ai_draft && !e.sent_at && !e.ai_draft_approved_by);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', borderLeft: `1px solid ${C.border}` }}>
      {/* Detail header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{q.consignment_number}</span>
              <TypeBadge type={q.query_type} />
              <StatusBadge status={q.status} />
              {q.requires_attention && <Badge label="⚠ ATTENTION" color={C.red} bg={C.redDim} />}
              {q.autopilot_enabled  && <Badge label="⚡ AUTOPILOT" color={C.green} bg={C.greenDim} />}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{q.customer_name} · {q.courier_name} · {q.service_name}</div>
          </div>
          <select value={q.status} onChange={handleStatusChange} disabled={statusUpdating}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11, padding: '5px 8px', cursor: 'pointer' }}>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {q.claim_deadline_at && (
          <div style={{ marginTop: 8, padding: '7px 12px', borderRadius: 8, background: C.amberDim, border: `1px solid ${C.amber}44`, fontSize: 12, color: C.amber, fontWeight: 600 }}>
            ⏱ Claim deadline: {fmtDate(q.claim_deadline_at)}
            {q.claim_amount && ` · £${Number(q.claim_amount).toFixed(2)}`}
            {q.claim_number && ` · Ref: ${q.claim_number}`}
          </div>
        )}
        {q.requires_attention && q.attention_reason && (
          <div style={{ marginTop: 6, padding: '7px 12px', borderRadius: 8, background: C.redDim, border: `1px solid ${C.red}44`, fontSize: 12, color: C.red }}>
            ⚠ {q.attention_reason}
          </div>
        )}
        {pendingDrafts.length > 0 && (
          <div onClick={() => setTab('emails')} style={{ marginTop: 6, padding: '7px 12px', borderRadius: 8, background: C.greenDim, border: `1px solid ${C.green}44`, fontSize: 12, color: C.green, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={12} />
            {pendingDrafts.length} AI draft{pendingDrafts.length > 1 ? 's' : ''} waiting for approval
            <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {[
          { key: 'emails',   label: `Emails${emails.length ? ` (${emails.length})` : ''}`,           icon: Mail },
          { key: 'evidence', label: `Evidence${evidence.length ? ` (${evidence.length})` : ''}`,     icon: FileText },
          { key: 'info',     label: 'Info',                                                           icon: Package },
          { key: 'notes',    label: `Alerts${notifications.length ? ` (${notifications.length})` : ''}`, icon: AlertCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px 4px', border: 'none',
            borderBottom: `2px solid ${tab === key ? C.green : 'transparent'}`,
            background: 'transparent', color: tab === key ? C.green : C.muted,
            fontSize: 11, fontWeight: tab === key ? 700 : 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>

        {tab === 'emails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {emails.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>No messages yet</div>}
            {[...emails]
              .sort((a, b) => {
                const aD = a.is_ai_draft && !a.sent_at ? 0 : 1;
                const bD = b.is_ai_draft && !b.sent_at ? 0 : 1;
                if (aD !== bD) return aD - bD;
                return new Date(a.created_at) - new Date(b.created_at);
              })
              .map(email => (
                <EmailItem key={email.id} email={email} onApprove={handleApprove} onEdit={handleEdit} approving={approving} />
              ))
            }
            <div style={{ marginTop: 6 }}>
              {showAttentionInput ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea placeholder="Describe why this needs attention…" value={attentionNote} onChange={e => setAttentionNote(e.target.value)}
                    style={{ background: C.card, border: `1px solid ${C.red}44`, borderRadius: 8, color: C.text, fontSize: 12, padding: 10, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleFlagAttention} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Flag for Attention</button>
                    <button onClick={() => setShowAttentionInput(false)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAttentionInput(true)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flag size={12} /> Flag for Human Attention
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evidence.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>No evidence collected yet</div>}
            {evidence.map(ev => (
              <div key={ev.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueDim, padding: '2px 8px', borderRadius: 10 }}>
                    {ev.evidence_type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 10, color: C.muted }}>{fmtDate(ev.created_at)}</span>
                  {ev.is_courier_approved && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, marginLeft: 'auto' }}>✓ Courier Approved</span>}
                </div>
                {ev.value_text && <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{ev.value_text}</div>}
                {ev.value_numeric != null && <div style={{ fontSize: 12, color: C.text }}>{ev.value_unit === 'GBP' ? '£' : ''}{Number(ev.value_numeric).toFixed(2)}</div>}
                {ev.file_name && <div style={{ fontSize: 11, color: C.blue, marginTop: 4 }}>📎 {ev.file_name}</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Consignment',  q.consignment_number],
              ['Customer',     q.customer_name],
              ['Courier',      q.courier_name],
              ['Service',      q.service_name],
              ['Type',         q.query_type?.replace(/_/g, ' ')],
              ['Status',       q.status?.replace(/_/g, ' ')],
              ['Subject',      q.subject],
              ['Sender Email', q.sender_email],
              ['Created',      fmtDate(q.created_at)],
              ['First Reply',  q.first_response_at ? fmtDate(q.first_response_at) : '—'],
              ['Resolved',     q.resolved_at ? fmtDate(q.resolved_at) : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, width: 110, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: C.text }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>No alerts for this query</div>}
            {notifications.map(n => (
              <div key={n.id} style={{ background: C.card, border: `1px solid ${n.read_at ? C.border : `${C.amber}44`}`, borderRadius: 10, padding: '12px 14px', opacity: n.read_at ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.amber }}>{n.notification_type.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{fmtDate(n.created_at)}</span>
                  {n.read_at && <span style={{ fontSize: 10, color: C.green, marginLeft: 'auto' }}>Read</span>}
                </div>
                <div style={{ fontSize: 12, color: C.text }}>{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Unmatched emails modal ───────────────────────────────────────────────────

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ width: 580, maxHeight: '80vh', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.text }}>Unmatched Emails</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {mapping ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>Map: {mapping.email.from_address}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{mapping.email.subject}</div>
            </div>
            {mapping.suggestions.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Suggested Matches</div>
                {mapping.suggestions.map(s => (
                  <div key={s.id} onClick={() => doMap(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.business_name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{s.account_number}</div>
                    </div>
                    <Badge label="Match" color={C.green} bg={C.greenDim} small />
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setMapping(null)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer' }}>← Back</button>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading && <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading…</div>}
            {!loading && emails.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✉</div>
                <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>All emails matched</div>
              </div>
            )}
            {emails.map(em => (
              <div key={em.id} style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{em.from_address}</div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.subject}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{fmtDate(em.received_at)}</div>
                </div>
                <button onClick={() => startMap(em)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.blue, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Link size={11} /> Match
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

export default function QueriesPage() {
  const [queries,       setQueries]       = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedId,    setSelectedId]    = useState(null);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [filters,       setFilters]       = useState({ status: '', attention: false, search: '' });
  const searchRef = useRef();

  // Load stats
  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
  }, [refreshKey]);

  // Load inbox
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

  // Clicking a KPI card sets a filter
  function setKpiFilter(filter) {
    setFilters(f => ({ ...f, ...filter }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.text, overflow: 'hidden' }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0, flexWrap: 'wrap' }}>
        <AlertTriangle size={16} style={{ color: C.amber }} />
        <span style={{ fontSize: 16, fontWeight: 800, color: C.text, marginRight: 4 }}>Queries &amp; Claims</span>
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            ref={searchRef}
            placeholder="Search consignment, customer…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: '7px 10px 7px 30px', width: 210 }}
          />
        </div>

        <button onClick={() => setShowUnmatched(true)} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <User size={13} />
          {stats?.unmatched_emails > 0 && <span style={{ background: C.amber, color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{stats.unmatched_emails}</span>}
          Unmatched
        </button>

        <button onClick={refresh} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 6 }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Fixed KPI Dashboard Strip ──────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
          <KpiCard
            label="Open"
            value={stats?.total_open ?? '—'}
            color={C.blue}
            icon={Inbox}
            active={!filters.attention && !filters.status}
            onClick={() => setKpiFilter({ status: '', attention: false })}
          />
          <KpiCard
            label="Needs Attention"
            value={stats?.requires_attention ?? '—'}
            color={C.red}
            icon={AlertTriangle}
            warn
            active={filters.attention}
            onClick={() => setKpiFilter({ attention: !filters.attention })}
          />
          <KpiCard
            label="SLA Breached"
            value={stats?.sla_breached ?? '—'}
            color={C.amber}
            icon={Clock}
            warn
          />
          <KpiCard
            label="Pending Drafts"
            value={stats?.pending_drafts ?? '—'}
            color={C.green}
            icon={Mail}
            warn
            sub="awaiting approval"
          />
          <KpiCard
            label="Claim Deadlines"
            value={stats?.claim_deadlines_7d ?? '—'}
            color={C.amber}
            icon={AlertCircle}
            warn
            sub="due within 7 days"
            active={filters.status === 'claim_raised' || filters.status === 'claim_submitted'}
            onClick={() => setKpiFilter({ status: 'claim_raised', attention: false })}
          />
          <KpiCard
            label="Total Queries"
            value={stats?.total_queries ?? '—'}
            color={C.muted}
            icon={MessageSquare}
          />
        </div>

        {/* Claim deadline alerts — shown when there are upcoming deadlines */}
        {stats?.upcoming_claim_deadlines?.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stats.upcoming_claim_deadlines.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: d.days_remaining <= 3 ? C.redDim : C.amberDim, border: `1px solid ${d.days_remaining <= 3 ? C.red : C.amber}44`, borderRadius: 8, fontSize: 11 }}>
                <span style={{ fontWeight: 700, color: d.days_remaining <= 3 ? C.red : C.amber }}>{d.days_remaining}d</span>
                <span style={{ color: C.muted }}>{d.consignment_number} · {d.customer_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0, flexWrap: 'wrap' }}>
        <Filter size={12} style={{ color: C.muted, flexShrink: 0 }} />
        {STATUS_FILTERS.map(f => (
          <Pill key={f.value} color={C.blue} active={filters.status === f.value && !filters.attention} onClick={() => setFilters(p => ({ ...p, status: f.value, attention: false }))}>
            {f.label}
          </Pill>
        ))}
        <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
        <Pill color={C.red} active={filters.attention} onClick={() => setFilters(p => ({ ...p, attention: !p.attention }))}>
          ⚠ Attention Only
        </Pill>
      </div>

      {/* ── Main content: ticket list + detail panel ───────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Ticket list */}
        <div style={{
          width: selectedId ? 360 : '100%',
          maxWidth: selectedId ? 360 : undefined,
          flexShrink: 0,
          overflow: 'auto',
          transition: 'width 0.2s',
        }}>
          {loading && <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading…</div>}
          {!loading && queries.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>No queries match</div>
              <div style={{ fontSize: 12, color: C.muted }}>Try a different filter or search term</div>
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

        {/* Detail panel */}
        {selectedId && (
          <QueryDetail
            key={selectedId}
            queryId={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdated={refresh}
          />
        )}
      </div>

      {showUnmatched && <UnmatchedPanel onClose={() => setShowUnmatched(false)} />}
    </div>
  );
}
