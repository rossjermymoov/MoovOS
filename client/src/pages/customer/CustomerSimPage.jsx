/**
 * CustomerSimPage — Query Simulation Sandbox
 *
 * Lets staff pretend to be a customer to test the query workflow end-to-end.
 * Select a customer/query from the dropdown, read the existing thread,
 * then reply as the customer to trigger the inbound email flow.
 *
 * Nothing is actually emailed — all replies go straight into query_emails
 * with direction = 'inbound_customer'.
 */

import { useState, useEffect, useRef } from 'react';
import { Send, User, Mail, RefreshCw, ArrowLeft, Inbox } from 'lucide-react';

const C = {
  bg:      '#F0F4FF',
  white:   '#FFFFFF',
  border:  '#DDE3F0',
  text:    '#1A1D2E',
  muted:   '#6B7280',
  blue:    '#2563EB',
  blueDim: '#EFF6FF',
  green:   '#16A34A',
  greenDim:'#F0FDF4',
  red:     '#DC2626',
  amber:   '#D97706',
};

const DIR_LABEL = {
  inbound_customer:  '← From customer',
  outbound_customer: '→ From Moov',
  inbound_courier:   '← From courier',
  outbound_courier:  '→ To courier',
};

function fmtDateTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Email bubble ─────────────────────────────────────────────────────────────

function EmailBubble({ email }) {
  const isInbound  = email.direction === 'inbound_customer';
  const isDraft    = email.is_ai_draft && !email.sent_at;
  const fromLabel  = DIR_LABEL[email.direction] || email.direction;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isInbound ? 'flex-end' : 'flex-start',
      marginBottom: 16,
    }}>
      <div style={{
        fontSize: 11,
        color: C.muted,
        marginBottom: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        {fromLabel}
        {isDraft && (
          <span style={{ fontSize: 10, background: '#FEF3C7', color: C.amber, padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
            AI DRAFT
          </span>
        )}
        <span>· {fmtDateTime(email.sent_at || email.received_at || email.created_at)}</span>
      </div>
      <div style={{
        maxWidth: '78%',
        background: isInbound ? C.blue : C.white,
        color: isInbound ? '#fff' : C.text,
        borderRadius: isInbound ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: isInbound ? 'none' : `1px solid ${C.border}`,
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {email.body_text}
      </div>
      {email.from_address && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
          {email.from_address}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CustomerSimPage() {
  const [queries,       setQueries]       = useState([]);
  const [selectedId,    setSelectedId]    = useState('');
  const [query,         setQuery]         = useState(null);
  const [emails,        setEmails]        = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [sending,       setSending]       = useState(false);
  const [replyText,     setReplyText]     = useState('');
  const [sent,          setSent]          = useState(false);
  const threadRef = useRef(null);

  // Load all queries for dropdown
  useEffect(() => {
    fetch('/api/queries?limit=100')
      .then(r => r.json())
      .then(d => setQueries(d.queries || []))
      .catch(console.error);
  }, []);

  // Load selected query + its emails
  useEffect(() => {
    if (!selectedId) { setQuery(null); setEmails([]); return; }
    setLoading(true);
    setSent(false);
    setReplyText('');
    fetch(`/api/queries/${selectedId}`)
      .then(r => r.json())
      .then(d => {
        setQuery(d);
        // Sort oldest first for chat-style display
        const sorted = [...(d.emails || [])].sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );
        setEmails(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId]);

  // Auto-scroll thread to bottom when new emails arrive
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [emails]);

  async function sendReply() {
    if (!replyText.trim() || !query) return;
    setSending(true);
    try {
      const subjectLine = query.subject?.startsWith('Re:')
        ? query.subject
        : `Re: ${query.subject}`;

      const resp = await fetch(`/api/queries/${selectedId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction:    'inbound_customer',
          from_address: query.sender_email || 'customer@example.com',
          to_address:   'queries@moovparcel.co.uk',
          subject:      subjectLine,
          body_text:    replyText.trim(),
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      // Reload thread to show new message
      const refreshed = await fetch(`/api/queries/${selectedId}`).then(r => r.json());
      const sorted = [...(refreshed.emails || [])].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );
      setEmails(sorted);
      setQuery(refreshed);
      setReplyText('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      alert('Failed to send: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Customer Simulation</div>
          <div style={{ fontSize: 12, color: C.muted }}>Reply as a customer to test the query workflow</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, background: '#FEF3C7', color: C.amber, padding: '4px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.4px' }}>
            ⚡ SANDBOX — no real emails sent
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px' }}>

        {/* Query selector */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Select a query to reply to
          </label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 9,
              border: `1px solid ${C.border}`,
              background: C.bg,
              color: C.text,
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">— Choose a customer query —</option>
            {queries.map(q => (
              <option key={q.id} value={q.id}>
                {q.customer_name} · {q.subject} · {q.consignment_number} [{q.status?.replace(/_/g, ' ')}]
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 14 }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div>Loading thread…</div>
          </div>
        )}

        {/* Thread + reply */}
        {query && !loading && (
          <>
            {/* Query info bar */}
            <div style={{
              background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
              padding: '14px 20px', marginBottom: 16,
              display: 'flex', gap: 24, flexWrap: 'wrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{query.customer_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 13, color: C.blue }}>{query.sender_email || 'unknown'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Consignment</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'monospace' }}>{query.consignment_number}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Status</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>{query.status?.replace(/_/g, ' ')}</div>
              </div>
            </div>

            {/* Email thread */}
            <div style={{
              background: C.white,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}>
              {/* Thread header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Inbox size={14} color={C.muted} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{query.subject}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{emails.length} message{emails.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Messages */}
              <div
                ref={threadRef}
                style={{ padding: '20px 24px', maxHeight: 460, overflowY: 'auto' }}
              >
                {emails.length === 0 ? (
                  <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 32 }}>No messages yet</div>
                ) : (
                  emails.map(e => <EmailBubble key={e.id} email={e} />)
                )}
              </div>

              {/* Reply box */}
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, background: C.blueDim }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <User size={11} /> Replying as: {query.customer_name} ({query.sender_email || 'customer'})
                </div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply as the customer…"
                  rows={4}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(); }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    color: C.text,
                    fontSize: 14,
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>⌘↩ to send</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {sent && (
                      <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Reply sent to inbox</span>
                    )}
                    <button
                      onClick={sendReply}
                      disabled={sending || !replyText.trim()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 20px', borderRadius: 9,
                        background: sending || !replyText.trim() ? '#CBD5E1' : C.blue,
                        color: '#fff',
                        border: 'none',
                        fontSize: 13, fontWeight: 700,
                        cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <Send size={13} />
                      {sending ? 'Sending…' : 'Send as Customer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!query && !loading && (
          <div style={{
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 48, textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <Mail size={36} color={C.border} style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: C.muted, marginBottom: 6 }}>No query selected</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Pick a query from the dropdown above to simulate a customer reply</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
