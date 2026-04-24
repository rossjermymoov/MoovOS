/**
 * CustomerSimPage — Query Simulation Sandbox
 *
 * Simulates the full query lifecycle from both sides:
 *   - "I am the Customer" — reply as inbound_customer
 *   - "I am DPD Platinum" — reply as inbound_courier
 *
 * Nothing is emailed. All replies post directly to query_emails.
 */

import { useState, useEffect, useRef } from 'react';
import { Send, User, Truck, Mail, RefreshCw, Inbox, ChevronDown } from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:        '#F0F4FF',
  white:     '#FFFFFF',
  border:    '#DDE3F0',
  text:      '#1A1D2E',
  muted:     '#6B7280',
  blue:      '#2563EB',
  blueDim:   '#EFF6FF',
  green:     '#16A34A',
  greenDim:  '#F0FDF4',
  red:       '#DC2626',
  amber:     '#D97706',
  amberDim:  '#FFFBEB',
  purple:    '#7C3AED',
  purpleDim: '#F5F3FF',
};

// Personas
const PERSONAS = {
  customer: {
    label:      'I am the Customer',
    icon:       User,
    color:      C.blue,
    dim:        C.blueDim,
    direction:  'inbound_customer',
    fromSuffix: null, // uses query.sender_email
  },
  courier: {
    label:   'I am DPD Platinum',
    icon:    Truck,
    color:   C.purple,
    dim:     C.purpleDim,
    direction: 'inbound_courier',
    fromAddr:  'platinum@dpd.co.uk',
    toAddr:    'queries@moovparcel.co.uk',
  },
};

// Direction display
const DIR = {
  inbound_customer:  { label: '← Customer',      color: C.blue,   align: 'flex-end',   bubble: C.blue,   bubbleText: '#fff' },
  outbound_customer: { label: '→ To customer',    color: C.green,  align: 'flex-start', bubble: C.white,  bubbleText: C.text },
  inbound_courier:   { label: '← DPD Platinum',   color: C.purple, align: 'flex-end',   bubble: C.purple, bubbleText: '#fff' },
  outbound_courier:  { label: '→ To DPD',         color: C.amber,  align: 'flex-start', bubble: C.white,  bubbleText: C.text },
};

function fmtDateTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Email bubble ─────────────────────────────────────────────────────────────

function EmailBubble({ email }) {
  const d        = DIR[email.direction] || { label: email.direction, color: C.muted, align: 'flex-start', bubble: C.white, bubbleText: C.text };
  const isDraft  = email.is_ai_draft && !email.sent_at;
  const isRight  = d.align === 'flex-end';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: d.align, marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: d.color, fontWeight: 600 }}>{d.label}</span>
        {isDraft && (
          <span style={{ fontSize: 10, background: '#FEF3C7', color: C.amber, padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>AI DRAFT</span>
        )}
        <span>· {fmtDateTime(email.sent_at || email.received_at || email.created_at)}</span>
      </div>
      <div style={{
        maxWidth: '75%',
        background: d.bubble,
        color: d.bubbleText,
        borderRadius: isRight ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        padding: '11px 15px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        border: d.bubble === C.white ? `1px solid ${C.border}` : 'none',
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {email.body_text}
      </div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{email.from_address}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CustomerSimPage() {
  const [queries,    setQueries]    = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [query,      setQuery]      = useState(null);
  const [emails,     setEmails]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [sending,    setSending]    = useState(false);
  const [replyText,  setReplyText]  = useState('');
  const [sent,       setSent]       = useState(false);
  const [persona,    setPersona]    = useState('customer'); // 'customer' | 'courier'
  const threadRef = useRef(null);

  const p = PERSONAS[persona];
  const Icon = p.icon;

  // Load all queries for dropdown
  useEffect(() => {
    fetch('/api/queries?limit=200')
      .then(r => r.json())
      .then(d => setQueries(d.queries || []))
      .catch(console.error);
  }, []);

  // Load selected query + emails when selection changes
  useEffect(() => {
    if (!selectedId) { setQuery(null); setEmails([]); return; }
    setLoading(true);
    setSent(false);
    setReplyText('');
    fetch(`/api/queries/${selectedId}`)
      .then(r => r.json())
      .then(d => {
        setQuery(d);
        const sorted = [...(d.emails || [])].sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );
        setEmails(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId]);

  // Scroll thread to bottom on new messages
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [emails]);

  async function sendReply() {
    if (!replyText.trim() || !query) return;
    setSending(true);
    try {
      const subjectLine = query.subject?.startsWith('Re:') ? query.subject : `Re: ${query.subject}`;

      let fromAddress, toAddress;
      if (persona === 'customer') {
        fromAddress = query.sender_email || 'customer@example.com';
        toAddress   = 'queries@moovparcel.co.uk';
      } else {
        // Courier replying back to Moov
        fromAddress = 'platinum@dpd.co.uk';
        toAddress   = 'queries@moovparcel.co.uk';
      }

      const resp = await fetch(`/api/queries/${selectedId}/emails`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction:    p.direction,
          from_address: fromAddress,
          to_address:   toAddress,
          subject:      subjectLine,
          body_text:    replyText.trim(),
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      // Reload thread
      const refreshed = await fetch(`/api/queries/${selectedId}`).then(r => r.json());
      setQuery(refreshed);
      setEmails([...(refreshed.emails || [])].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      ));
      setReplyText('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      alert('Failed to send: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          <Icon size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Query Simulation Sandbox</div>
          <div style={{ fontSize: 12, color: C.muted }}>Simulate the full query lifecycle — customer, Moov, and courier</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, background: '#FEF3C7', color: C.amber, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
            ⚡ SANDBOX — no real emails sent
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>

        {/* Persona switcher + query selector */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

          {/* Persona toggle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Who are you in this conversation?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(PERSONAS).map(([key, cfg]) => {
                const PIcon = cfg.icon;
                const active = persona === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setPersona(key); setReplyText(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 10,
                      border: `2px solid ${active ? cfg.color : C.border}`,
                      background: active ? cfg.dim : 'transparent',
                      color: active ? cfg.color : C.muted,
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <PIcon size={15} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select a query thread
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 36px 10px 14px',
                  borderRadius: 9, border: `1px solid ${C.border}`,
                  background: C.bg, color: C.text, fontSize: 14,
                  outline: 'none', cursor: 'pointer', appearance: 'none',
                }}
              >
                <option value="">— Choose a query —</option>
                {queries.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.customer_name} · {q.subject} · {q.consignment_number} [{q.status?.replace(/_/g, ' ')}]
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            <RefreshCw size={18} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13 }}>Loading thread…</div>
          </div>
        )}

        {/* Thread + reply */}
        {query && !loading && (
          <>
            {/* Query info bar */}
            <div style={{
              background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
              padding: '14px 20px', marginBottom: 16,
              display: 'flex', gap: 28, flexWrap: 'wrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              {[
                { label: 'Customer',     val: query.customer_name },
                { label: 'Email',        val: query.sender_email || 'unknown',  color: C.blue },
                { label: 'Consignment',  val: query.consignment_number,          mono: true },
                { label: 'Courier',      val: query.courier_name || 'DPD' },
                { label: 'Status',       val: query.status?.replace(/_/g, ' '), color: C.amber },
              ].map(({ label, val, color, mono }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: color || C.text, fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Workflow guide */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              marginBottom: 16, fontSize: 11, fontWeight: 600,
            }}>
              {[
                { label: 'Customer → Moov',    dir: 'inbound_customer',  color: C.blue },
                { label: '→' },
                { label: 'Moov → Courier',     dir: 'outbound_courier',  color: C.amber },
                { label: '→' },
                { label: 'Courier → Moov',     dir: 'inbound_courier',   color: C.purple },
                { label: '→' },
                { label: 'Moov → Customer',    dir: 'outbound_customer', color: C.green },
              ].map((item, i) =>
                item.label === '→' ? (
                  <span key={i} style={{ color: C.muted, padding: '0 6px' }}>→</span>
                ) : (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: `${item.color}18`,
                    color: item.color,
                  }}>{item.label}</span>
                )
              )}
            </div>

            {/* Email thread */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

              {/* Thread header */}
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Inbox size={14} color={C.muted} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{query.subject}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{emails.length} message{emails.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Messages */}
              <div ref={threadRef} style={{ padding: '20px 24px', maxHeight: 440, overflowY: 'auto' }}>
                {emails.length === 0 ? (
                  <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 32 }}>No messages yet</div>
                ) : (
                  emails.map(e => <EmailBubble key={e.id} email={e} />)
                )}
              </div>

              {/* Reply box */}
              <div style={{
                padding: '16px 20px',
                borderTop: `1px solid ${C.border}`,
                background: p.dim,
                borderTop: `2px solid ${p.color}22`,
              }}>
                {/* Who is replying */}
                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={11} />
                  {persona === 'customer'
                    ? `Replying as: ${query.customer_name} (${query.sender_email || 'customer'})`
                    : `Replying as: DPD Platinum (platinum@dpd.co.uk → queries@moovparcel.co.uk)`
                  }
                </div>

                {/* Hint text for courier */}
                {persona === 'courier' && (
                  <div style={{ fontSize: 12, color: C.muted, background: C.amberDim, border: `1px solid ${C.amber}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                    💡 Tip: Write as DPD responding to Moov's investigation request. E.g. GPS data, delivery photo results, or trace updates.
                  </div>
                )}

                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={
                    persona === 'customer'
                      ? 'Type your reply as the customer…'
                      : 'Type DPD\'s response to Moov\'s query…'
                  }
                  rows={4}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(); }}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 10, border: `1px solid ${C.border}`,
                    background: C.white, color: C.text,
                    fontSize: 14, lineHeight: 1.6, resize: 'vertical',
                    outline: 'none', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>⌘↩ to send</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {sent && (
                      <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Added to thread</span>
                    )}
                    <button
                      onClick={sendReply}
                      disabled={sending || !replyText.trim()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 20px', borderRadius: 9,
                        background: sending || !replyText.trim() ? '#CBD5E1' : p.color,
                        color: '#fff', border: 'none',
                        fontSize: 13, fontWeight: 700,
                        cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <Send size={13} />
                      {sending ? 'Sending…' : persona === 'customer' ? 'Send as Customer' : 'Send as DPD Platinum'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!query && !loading && (
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: 48, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Mail size={36} color={C.border} style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Select a query to get started</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Pick a role above, then choose a query to simulate the full email workflow</div>
          </div>
        )}
      </div>
    </div>
  );
}
