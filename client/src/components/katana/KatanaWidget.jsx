/**
 * KatanaWidget — floating AI assistant chat widget
 * Styled strictly to docs/design-rules.md and moov.css:
 * Zero radius, Moov purple (#7B2FBE), Archivo typography, sharp structural rules.
 */

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RefreshCw, ChevronDown, Mic, MicOff } from 'lucide-react';

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'How much does eHealth Pharmacy owe us?',
  'What\'s the DPD Next Day price for Crytek?',
  'Show me open tickets needing attention',
  'Which customers are on stop?',
  'How many shipments this month?',
];

// ─── Voice-to-text hook ───────────────────────────────────────────────────────
function useSpeechInput(setText) {
  const [listening, setListening] = useState(false);

  function toggle() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser. Please use Chrome or Edge.'); return; }
    setListening(true);
    const rec = new SR();
    rec.lang = 'en-GB';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript) setText(prev => prev ? prev + ' ' + transcript : transcript);
    };
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }

  return { listening, toggle };
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 5, height: 5, borderRadius: 0, background: 'var(--mv-purple)',
            animation: `katana-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
      padding: '0 2px',
    }}>
      {!isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: 0, flexShrink: 0,
          background: 'var(--mv-purple)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 8, marginTop: 2,
        }}>
          <Sparkles size={13} color="#FFFFFF" />
        </div>
      )}
      <div style={{
        maxWidth: '82%',
        padding: '9px 12px',
        borderRadius: 0,
        background: isUser ? 'var(--mv-purple-100)' : 'var(--mv-surface)',
        border: `1px solid ${isUser ? 'var(--mv-purple-200)' : 'var(--mv-hairline)'}`,
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--mv-ink)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function KatanaWidget() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState([]);   // { role: 'user'|'assistant', content: string }
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const speech    = useSpeechInput(setInput);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const r = await fetch('/api/katana/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError('Could not reach Katana. Please check your connection.');
      console.error('[KatanaWidget]', e);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  return (
    <>
      <style>{`
        @keyframes katana-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes katana-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 78, right: 24, zIndex: 9998,
          width: 410, height: 560,
          background: 'var(--mv-bg)',
          border: '2px solid var(--mv-divider)',
          borderRadius: 0,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 32px rgba(32,30,29,0.18)',
          animation: 'katana-slide-up 0.15s ease-out',
          overflow: 'hidden',
          fontFamily: 'var(--mv-font)',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--mv-surface)',
            borderBottom: '2px solid var(--mv-divider)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 0,
              background: 'var(--mv-purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles size={14} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--mv-purple)' }}>
                AI ASSISTANT
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--mv-ink)', letterSpacing: '-.01em' }}>
                Katana
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="mv-icon-btn"
                  style={{ width: 28, height: 28 }}
                >
                  <RefreshCw size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="mv-icon-btn"
                style={{ width: 28, height: 28 }}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
          }}>
            {messages.length === 0 && (
              <div style={{ padding: '6px 0' }}>
                <div className="mv-section--muted" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Suggested queries
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      style={{
                        background: 'var(--mv-surface)',
                        border: '1px solid var(--mv-hairline-2)',
                        borderRadius: 0,
                        padding: '8px 12px',
                        fontSize: 12.5,
                        color: 'var(--mv-ink-78)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.12s, color 0.12s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--mv-purple)';
                        e.currentTarget.style.color = 'var(--mv-ink)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--mv-hairline-2)';
                        e.currentTarget.style.color = 'var(--mv-ink-78)';
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10, padding: '0 2px' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 0, flexShrink: 0,
                  background: 'var(--mv-purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 8, marginTop: 2,
                }}>
                  <Sparkles size={13} color="#FFFFFF" />
                </div>
                <div style={{
                  background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline)',
                  borderRadius: 0,
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <div style={{
                margin: '6px 0', padding: '8px 12px',
                background: 'rgba(233,30,140,0.06)',
                border: '1px solid var(--mv-magenta)',
                borderRadius: 0, fontSize: 12, color: 'var(--mv-magenta-deep)',
              }}>
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '10px 14px 12px',
            borderTop: '2px solid var(--mv-divider)',
            background: 'var(--mv-surface)',
          }}>
            <div style={{
              display: 'flex', gap: 6, alignItems: 'flex-end',
              background: 'var(--mv-bg)',
              border: '1px solid var(--mv-hairline-2)',
              borderRadius: 0,
              padding: '6px 8px',
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--mv-purple)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--mv-hairline-2)'}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={speech.listening ? 'Listening… speak now' : 'Ask Katana anything…'}
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--mv-ink)', fontSize: 12.5, lineHeight: 1.45,
                  resize: 'none', maxHeight: 90, overflowY: 'auto',
                  fontFamily: 'inherit',
                  padding: '2px 0',
                }}
              />
              {/* Mic button */}
              <button
                onClick={speech.toggle}
                title={speech.listening ? 'Stop listening' : 'Dictate question (en-GB)'}
                style={{
                  background: speech.listening ? 'var(--mv-purple)' : 'transparent',
                  border: 'none', borderRadius: 0, cursor: 'pointer',
                  width: 28, height: 28, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: speech.listening ? '#FFFFFF' : 'var(--mv-ink-52)',
                }}
              >
                {speech.listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              {/* Send button */}
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? 'var(--mv-purple)' : 'rgba(32,30,29,0.08)',
                  border: 'none', borderRadius: 0,
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  width: 28, height: 28, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: input.trim() && !loading ? '#FFFFFF' : 'var(--mv-ink-45)',
                  transition: 'background 0.12s',
                }}
              >
                <Send size={13} />
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--mv-ink-45)', marginTop: 5, textAlign: 'center' }}>
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Open Katana AI"
        style={{
          position: 'fixed', bottom: 22, right: 24, zIndex: 9999,
          width: 44, height: 44, borderRadius: 0,
          background: open ? 'var(--mv-surface)' : 'var(--mv-purple)',
          border: open ? '1px solid var(--mv-ink)' : '1px solid var(--mv-purple-600)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(32,30,29,0.18)',
          transition: 'background 0.12s, border-color 0.12s',
        }}
      >
        {open
          ? <X size={18} color="var(--mv-ink)" />
          : <Sparkles size={19} color="#FFFFFF" />
        }
      </button>
    </>
  );
}
