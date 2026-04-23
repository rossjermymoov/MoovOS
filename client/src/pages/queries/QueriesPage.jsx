import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle, Mail, Clock, CheckCircle, XCircle, User,
  Inbox, BarChart2, RefreshCw, ChevronRight, Circle,
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
  purple:  '#7B2FBE',
  text:    '#FFFFFF',
  muted:   '#AAAAAA',
  greenDim:  'rgba(0,200,83,0.15)',
  amberDim:  'rgba(255,193,7,0.15)',
  redDim:    'rgba(233,30,140,0.15)',
  blueDim:   'rgba(0,188,212,0.15)',
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  open:                     { label: 'Open',               color: C.blue,   bg: C.blueDim },
  awaiting_customer_info:   { label: 'Awaiting Customer',  color: C.amber,  bg: C.amberDim },
  info_received:            { label: 'Info Received',       color: C.green,  bg: C.greenDim },
  awaiting_courier:         { label: 'Awaiting Courier',    color: C.amber,  bg: C.amberDim },
  courier_investigating:    { label: 'Investigating',        color: C.amber,  bg: C.amberDim },
  claim_raised:             { label: 'Claim Raised',        color: C.red,    bg: C.redDim },
  awaiting_claim_docs:      { label: 'Awaiting Claim Docs', color: C.red,    bg: C.redDim },
  claim_submitted:          { label: 'Claim Submitted',     color: C.amber,  bg: C.amberDim },
  resolved:                 { label: 'Resolved',            color: C.green,  bg: C.greenDim },
  resolved_claim_approved:  { label: 'Claim Approved',      color: C.green,  bg: C.greenDim },
  resolved_claim_rejected:  { label: 'Claim Rejected',      color: C.red,    bg: C.redDim },
};

const TYPE_CFG = {
  lost:       { label: 'Lost',         color: C.red },
  damaged:    { label: 'Damaged',      color: C.red },
  delayed:    { label: 'Delayed',      color: C.amber },
  exception:  { label: 'Exception',    color: C.amber },
  complaint:  { label: 'Complaint',    color: C.red },
  enquiry:    { label: 'Enquiry',      color: C.blue },
  returns:    { label: 'Returns',      color: C.amber },
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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{
      flex: '1 1 160px',
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '16px 20px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {Icon && <Icon size={15} style={{ color: color || C.muted }} />}
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || C.text, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Inbox row ────────────────────────────────────────────────────────────────

function InboxRow({ q, selected, onClick }) {
  const hasAttention  = q.requires_attention;
  const hasSlaBreached = q.sla_breached;
  const hasDrafts     = q.pending_drafts > 0;
  const claimUrgent   = q.claim_days_remaining !== null && q.claim_days_remaining <= 3;

  const accent = hasAttention  ? C.red
               : hasSlaBreached ? C.amber
               : hasDrafts      ? C.green
               : C.border;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${selected ? C.green : accent}`,
        background: selected ? C.hover : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Row 1: consignment + badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {q.consignment_number || 'No consignment'}
        </span>
        {hasAttention && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.red, background: C.redDim, padding: '2px 6px', borderRadius: 10 }}>
            ⚠ ATTENTION
          </span>
        )}
        {hasDrafts > 0 && (
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
          fontSize: 11,
          color: C.muted,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontStyle: 'italic',
        }}>
          {q.latest_email_preview ? q.latest_email_preview.substring(0, 80) : q.subject || 'No emails yet'}
        </span>
        <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{timeAgo(q.latest_email_at || q.created_at)}</span>
      </div>

      {/* Row 4: SLA indicator */}
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
  const [editBody, setEditBody]   = useState(email.body_text || '');
  const isDraft = email.is_ai_draft && !email.sent_at && !email.ai_draft_approved_by;
  const isSent  = !!email.sent_at;
  const dir     = email.direction;

  const dirColor = dir === 'inbound' ? C.blue : dir === 'outbound_customer' ? C.green : C.amber;
  const dirLabel = dir === 'inbound' ? 'Inbound' : dir === 'outbound_customer' ? '→ Customer' : '→ Courier';

  return (
    <div style={{
      border: `1px solid ${isDraft ? `${C.green}55` : C.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: isDraft ? `${C.green}08` : C.card,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: dirColor, background: `${dirColor}22`, padding: '2px 8px', borderRadius: 10 }}>
          {dirLabel}
        </span>
        {isDraft && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim, padding: '2px 8px', borderRadius: 10 }}>
            🤖 AI DRAFT — PENDING APPROVAL
          </span>
        )}
        {isSent && (
          <span style={{ fontSize: 10, color: C.muted }}>Sent {fmtDate(email.sent_at)}</span>
        )}
        {!isSent && !isDraft && (
          <span style={{ fontSize: 10, color: C.muted }}>Received {fmtDate(email.created_at)}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>
          {email.from_address || email.to_address}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        {editMode ? (
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            style={{
              width: '100%',
              minHeight: 140,
              background: C.surface,
              border: `1px solid ${C.green}44`,
              borderRadius: 6,
              color: C.text,
              fontSize: 12,
              padding: 10,
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <pre style={{
            margin: 0,
            fontSize: 12,
            color: C.muted,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            maxHeight: 200,
            overflow: 'auto',
          }}>
            {email.body_text || '(no plain text body)'}
          </pre>
        )}
      </div>

      {/* Draft actions */}
      {isDraft && (
        <div style={{
          display: 'flex', gap: 8, padding: '10px 14px',
          borderTop: `1px solid ${C.border}`,
          flexWrap: 'wrap',
        }}>
          {editMode ? (
            <>
              <button
                onClick={() => { onEdit(email.id, editBody); setEditMode(false); }}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none',
                  background: C.green, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Save &amp; Approve
              </button>
              <button
                onClick={() => { setEditMode(false); setEditBody(email.body_text || ''); }}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onApprove(email.id, email.body_text)}
                disabled={approving}
                style={{
                  padding: '7px 18px', borderRadius: 8, border: 'none',
                  background: C.green, color: '#000',
                  fontSize: 12, fontWeight: 700, cursor: approving ? 'default' : 'pointer',
                  opacity: approving ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Send size={13} />
                {approving ? 'Sending…' : 'Approve & Send'}
              </button>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.muted,
                  fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
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
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('emails');
  const [approving, setApproving] = useState(false);
  const [attentionNote, setAttentionNote] = useState('');
  const [showAttentionInput, setShowAttentionInput] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchQuery(queryId);
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [queryId]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(emailId, bodyText) {
    setApproving(true);
    try {
      await approveEmail(queryId, { email_id: emailId, action: 'approve', body_text: bodyText });
      await load();
      onUpdated?.();
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    } finally {
      setApproving(false);
    }
  }

  async function handleEdit(emailId, newBody) {
    setApproving(true);
    try {
      await approveEmail(queryId, { email_id: emailId, action: 'approve', body_text: newBody });
      await load();
      onUpdated?.();
    } catch (err) {
      alert('Failed to send: ' + err.message);
    } finally {
      setApproving(false);
    }
  }

  async function handleFlagAttention() {
    if (!attentionNote.trim()) return;
    try {
      await flagAttention(queryId, { reason: attentionNote });
      setAttentionNote('');
      setShowAttentionInput(false);
      await load();
      onUpdated?.();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStatusChange(e) {
    setStatusUpdating(true);
    try {
      await updateQuery(queryId, { status: e.target.value });
      await load();
      onUpdated?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
      Loading…
    </div>
  );

  if (!data) return null;

  const q = data.query;
  const emails = data.emails || [];
  const evidence = data.evidence || [];
  const notifications = data.notifications || [];
  const pendingDrafts = emails.filter(e => e.is_ai_draft && !e.sent_at && !e.ai_draft_approved_by);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
      {/* Detail header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{q.consignment_number}</span>
              <TypeBadge type={q.query_type} />
              <StatusBadge status={q.status} />
              {q.requires_attention && (
                <Badge label="⚠ NEEDS ATTENTION" color={C.red} bg={C.redDim} />
              )}
              {q.autopilot_enabled && (
                <Badge label="⚡ AUTOPILOT" color={C.green} bg={C.greenDim} />
              )}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {q.customer_name} · {q.courier_name} · {q.service_name}
            </div>
            {q.freshdesk_ticket_number && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                Freshdesk: #{q.freshdesk_ticket_number}
              </div>
            )}
          </div>

          {/* Status changer */}
          <select
            value={q.status}
            onChange={handleStatusChange}
            disabled={statusUpdating}
            style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 12, padding: '6px 10px', cursor: 'pointer',
            }}
          >
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4,
          }}><X size={18} /></button>
        </div>

        {/* Claim urgency bar */}
        {q.claim_deadline_at && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: C.amberDim,
            border: `1px solid ${C.amber}44`,
            fontSize: 12,
            color: C.amber,
            fontWeight: 600,
          }}>
            ⏱ Claim deadline: {fmtDate(q.claim_deadline_at)}
            {q.claim_amount && ` · Amount: £${Number(q.claim_amount).toFixed(2)}`}
            {q.claim_number && ` · Ref: ${q.claim_number}`}
          </div>
        )}

        {/* Attention reason */}
        {q.requires_attention && q.attention_reason && (
          <div style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: C.redDim,
            border: `1px solid ${C.red}44`,
            fontSize: 12,
            color: C.red,
          }}>
            ⚠ {q.attention_reason}
          </div>
        )}

        {/* Pending drafts banner */}
        {pendingDrafts.length > 0 && (
          <div
            onClick={() => setTab('emails')}
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: C.greenDim,
              border: `1px solid ${C.green}44`,
              fontSize: 12,
              color: C.green,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Zap size={13} />
            {pendingDrafts.length} AI draft{pendingDrafts.length > 1 ? 's' : ''} waiting for approval — click to review
            <ChevronRight size={13} style={{ marginLeft: 'auto' }} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}>
        {[
          { key: 'emails',    label: `Emails${emails.length ? ` (${emails.length})` : ''}`,           icon: Mail },
          { key: 'evidence',  label: `Evidence${evidence.length ? ` (${evidence.length})` : ''}`,     icon: FileText },
          { key: 'info',      label: 'Query Info',                                                    icon: Package },
          { key: 'notes',     label: `Alerts${notifications.length ? ` (${notifications.length})` : ''}`, icon: AlertCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              borderBottom: `2px solid ${tab === key ? C.green : 'transparent'}`,
              background: 'transparent',
              color: tab === key ? C.green : C.muted,
              fontSize: 12,
              fontWeight: tab === key ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>

        {/* ── EMAILS ── */}
        {tab === 'emails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {emails.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>
                No emails yet
              </div>
            )}
            {/* Show pending drafts first */}
            {[...emails]
              .sort((a, b) => {
                const aD = a.is_ai_draft && !a.sent_at ? 0 : 1;
                const bD = b.is_ai_draft && !b.sent_at ? 0 : 1;
                if (aD !== bD) return aD - bD;
                return new Date(a.created_at) - new Date(b.created_at);
              })
              .map(email => (
                <EmailItem
                  key={email.id}
                  email={email}
                  onApprove={handleApprove}
                  onEdit={handleEdit}
                  approving={approving}
                />
              ))
            }

            {/* Flag for attention */}
            <div style={{ marginTop: 8 }}>
              {showAttentionInput ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    placeholder="Describe why this needs attention…"
                    value={attentionNote}
                    onChange={e => setAttentionNote(e.target.value)}
                    style={{
                      background: C.card, border: `1px solid ${C.red}44`,
                      borderRadius: 8, color: C.text, fontSize: 12,
                      padding: 10, resize: 'vertical', minHeight: 70,
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleFlagAttention} style={{
                      padding: '7px 16px', borderRadius: 8, border: 'none',
                      background: C.red, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>Flag for Attention</button>
                    <button onClick={() => setShowAttentionInput(false)} style={{
                      padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                      background: 'transparent', color: C.muted, fontSize: 12, cursor: 'pointer',
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAttentionInput(true)} style={{
                  padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.muted, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Flag size={12} /> Flag for Human Attention
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── EVIDENCE ── */}
        {tab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evidence.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>
                No evidence collected yet
              </div>
            )}
            {evidence.map(ev => (
              <div key={ev.id} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueDim, padding: '2px 8px', borderRadius: 10 }}>
                    {ev.evidence_type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 10, color: C.muted }}>{fmtDate(ev.created_at)}</span>
                  {ev.is_courier_approved && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.green, marginLeft: 'auto' }}>✓ Courier Approved</span>
                  )}
                </div>
                {ev.value_text && <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{ev.value_text}</div>}
                {ev.value_numeric != null && (
                  <div style={{ fontSize: 12, color: C.text }}>
                    {ev.value_unit === 'GBP' ? '£' : ''}{Number(ev.value_numeric).toFixed(2)} {ev.value_unit !== 'GBP' ? ev.value_unit : ''}
                  </div>
                )}
                {ev.file_name && (
                  <div style={{ fontSize: 11, color: C.blue, marginTop: 4 }}>
                    📎 {ev.file_name} ({ev.file_format?.toUpperCase()})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── QUERY INFO ── */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Consignment',    q.consignment_number],
              ['Customer',       q.customer_name],
              ['Customer ID',    q.customer_id],
              ['Courier',        q.courier_name],
              ['Service',        q.service_name],
              ['Trigger',        q.trigger],
              ['Query Type',     q.query_type],
              ['Status',         q.status],
              ['Subject',        q.subject],
              ['Sender Email',   q.sender_email],
              ['Sender Matched', q.sender_matched ? 'Yes' : 'No'],
              ['Created',        fmtDate(q.created_at)],
              ['First Response', q.first_response_at ? fmtDate(q.first_response_at) : '—'],
              ['Resolved',       q.resolved_at ? fmtDate(q.resolved_at) : '—'],
              ['Freshdesk',      q.freshdesk_ticket_number || '—'],
              ['AI Confidence',  q.ai_confidence != null ? `${(q.ai_confidence * 100).toFixed(0)}%` : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', alignItems: 'baseline', gap: 12,
                padding: '8px 0', borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, width: 130, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: C.text }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── ALERTS / NOTIFICATIONS ── */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 40 }}>
                No notifications for this query
              </div>
            )}
            {notifications.map(n => (
              <div key={n.id} style={{
                background: C.card, border: `1px solid ${n.read_at ? C.border : `${C.amber}44`}`,
                borderRadius: 10, padding: '12px 14px',
                opacity: n.read_at ? 0.6 : 1,
              }}>
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

// ─── Stats dashboard ──────────────────────────────────────────────────────────

function StatsDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) return (
    <div style={{ padding: '20px 24px', color: C.muted, fontSize: 13 }}>Loading stats…</div>
  );

  const autopilotRate = stats.total_queries > 0
    ? Math.round((stats.autopilot_sent / stats.total_queries) * 100)
    : 0;

  const breachRate = stats.total_open > 0
    ? Math.round((stats.sla_breached / stats.total_open) * 100)
    : 0;

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Dashboard</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <StatCard label="Open Queries"     value={stats.total_open}       icon={Inbox}         color={C.blue}  />
        <StatCard label="Need Attention"   value={stats.requires_attention} icon={AlertTriangle} color={C.red}   />
        <StatCard label="SLA Breached"     value={stats.sla_breached}     icon={Clock}         color={C.amber} sub={`${breachRate}% of open`} />
        <StatCard label="Pending Drafts"   value={stats.pending_drafts}   icon={Mail}          color={C.green} />
        <StatCard label="Claim Deadlines"  value={stats.claim_deadlines_7d} icon={AlertCircle}  color={C.amber} sub="due within 7 days" />
        <StatCard label="AI Autopilot"     value={`${autopilotRate}%`}    icon={Zap}           color={C.green} sub={`${stats.autopilot_sent} auto-sent`} />
        <StatCard label="Unmatched Emails" value={stats.unmatched_emails} icon={User}          color={stats.unmatched_emails > 0 ? C.amber : C.muted} />
      </div>

      {/* Claim deadlines section */}
      {stats.upcoming_claim_deadlines && stats.upcoming_claim_deadlines.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⏱ Upcoming Claim Deadlines
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.upcoming_claim_deadlines.map(q => (
              <div key={q.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: C.card,
                border: `1px solid ${q.claim_days_remaining <= 3 ? `${C.red}44` : `${C.amber}33`}`,
                borderRadius: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{q.consignment_number}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{q.customer_name}</div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 800,
                  color: q.claim_days_remaining <= 3 ? C.red : C.amber,
                }}>
                  {q.claim_days_remaining}d left
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Unmatched emails panel ───────────────────────────────────────────────────

function UnmatchedPanel({ onClose }) {
  const [emails, setEmails]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [mapping,  setMapping] = useState(null); // { email, suggestions, selected }
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]    = useState('');

  useEffect(() => {
    fetchUnmatched().then(d => { setEmails(d.emails || []); setLoading(false); });
  }, []);

  async function startMap(email) {
    const sugs = await fetchSenderSuggestions(email.from_address);
    setMapping({ email, suggestions: sugs.suggestions || [], selected: null, search: '' });
  }

  async function doMap(customerId) {
    await mapSender({
      email_address: mapping.email.from_address,
      customer_id: customerId,
      unmatched_email_id: mapping.email.id,
    });
    setMapping(null);
    const d = await fetchUnmatched();
    setEmails(d.emails || []);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        width: 600, maxHeight: '80vh', background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 16,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.text }}>Unmatched Emails</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {mapping ? (
          /* Mapping view */
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Map: {mapping.email.from_address}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{mapping.email.subject}</div>
            </div>

            {mapping.suggestions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Suggested Matches
                </div>
                {mapping.suggestions.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  }}
                    onClick={() => doMap(s.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.business_name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{s.account_number} · {s.match_reason}</div>
                    </div>
                    <Badge label="Match" color={C.green} bg={C.greenDim} small />
                  </div>
                ))}
              </div>
            )}

            <input
              placeholder="Search customer name…"
              value={mapping.search || ''}
              onChange={e => setMapping(m => ({ ...m, search: e.target.value }))}
              style={{
                width: '100%', background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: 12, padding: '8px 12px',
                boxSizing: 'border-box',
              }}
            />
            <button onClick={() => setMapping(null)} style={{
              marginTop: 12, padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.muted, fontSize: 12, cursor: 'pointer',
            }}>← Back</button>
          </div>
        ) : (
          /* List view */
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading && <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading…</div>}
            {!loading && emails.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✉</div>
                <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>All emails matched</div>
              </div>
            )}
            {emails.map(em => (
              <div key={em.id} style={{
                padding: '12px 20px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                    {em.from_address}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {em.subject}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{fmtDate(em.received_at)}</div>
                </div>
                <button
                  onClick={() => startMap(em)}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    border: `1px solid ${C.border}`, background: 'transparent',
                    color: C.blue, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    flexShrink: 0,
                  }}
                >
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

export default function QueriesPage() {
  const [view,          setView]          = useState('inbox'); // 'inbox' | 'dashboard'
  const [queries,       setQueries]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedId,    setSelectedId]    = useState(null);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [filters,       setFilters]       = useState({
    status: '', attention: false, search: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const searchRef = useRef();

  // Derived active filter count for badge
  const activeFilters = [filters.status, filters.attention].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status)    params.status    = filters.status;
      if (filters.attention) params.attention  = true;
      if (filters.search)    params.search     = filters.search;
      const d = await fetchInbox(params);
      setQueries(d.queries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load, refreshKey]);

  function refresh() { setRefreshKey(k => k + 1); }

  // Status filter options
  const STATUS_FILTERS = [
    { value: '',         label: 'All' },
    { value: 'open',     label: 'Open' },
    { value: 'awaiting_customer_info', label: 'Awaiting Customer' },
    { value: 'awaiting_courier',       label: 'Awaiting Courier' },
    { value: 'claim_raised',           label: 'Claim Raised' },
    { value: 'resolved',               label: 'Resolved' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: C.bg, color: C.text,
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} style={{ color: C.amber }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Queries &amp; Claims</span>
        </div>

        {/* View switcher */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          <Pill color={C.blue} active={view === 'inbox'} onClick={() => setView('inbox')}>
            <Inbox size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Inbox
          </Pill>
          <Pill color={C.blue} active={view === 'dashboard'} onClick={() => setView('dashboard')}>
            <BarChart2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Dashboard
          </Pill>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        {view === 'inbox' && (
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              ref={searchRef}
              placeholder="Search consignment, customer…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: 12,
                padding: '7px 10px 7px 30px', width: 220,
              }}
            />
          </div>
        )}

        {/* Unmatched emails button */}
        <button
          onClick={() => setShowUnmatched(true)}
          style={{
            padding: '7px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: 'transparent',
            color: C.muted,
            fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <User size={13} /> Unmatched Emails
        </button>

        {/* Refresh */}
        <button onClick={refresh} style={{
          background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 6,
        }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filter bar (inbox only) */}
      {view === 'inbox' && (
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '8px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: C.bg,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <Filter size={12} style={{ color: C.muted, flexShrink: 0 }} />
          {STATUS_FILTERS.map(f => (
            <Pill
              key={f.value}
              color={C.blue}
              active={filters.status === f.value}
              onClick={() => setFilters(prev => ({ ...prev, status: f.value }))}
            >
              {f.label}
            </Pill>
          ))}
          <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
          <Pill
            color={C.red}
            active={filters.attention}
            onClick={() => setFilters(prev => ({ ...prev, attention: !prev.attention }))}
          >
            ⚠ Needs Attention
          </Pill>
        </div>
      )}

      {/* Body */}
      {view === 'dashboard' ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <StatsDashboard />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Inbox list */}
          <div style={{
            width: selectedId ? 360 : '100%',
            maxWidth: selectedId ? 360 : undefined,
            flexShrink: 0,
            borderRight: selectedId ? `1px solid ${C.border}` : 'none',
            overflow: 'auto',
            transition: 'width 0.2s',
          }}>
            {loading && (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading…</div>
            )}
            {!loading && queries.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Inbox is clear</div>
                <div style={{ fontSize: 12, color: C.muted }}>No queries match your current filters</div>
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
      )}

      {/* Unmatched modal */}
      {showUnmatched && <UnmatchedPanel onClose={() => setShowUnmatched(false)} />}
    </div>
  );
}
