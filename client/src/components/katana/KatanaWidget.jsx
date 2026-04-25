/**
 * KatanaWidget — floating AI assistant chat widget
 * Fixed bottom-right, amber/gold Katana branding.
 * Sends natural-language questions to /api/katana/chat which
 * uses Anthropic tool-use + live DB queries to answer anything
 * about customers, pricing, tickets, invoices, etc.
 */

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RefreshCw, ChevronDown, Mic, MicOff } from 'lucide-react';

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0D0E24',
  surface:   '#13152E',
  card:      '#1A1D3D',
  border:    'rgba(255,255,255,0.07)',
  amber:     '#F59E0B',
  amberDim:  'rgba(245,158,11,0.12)',
  amberGlow: 'rgba(245,158,11,0.25)',
  text:      '#F0F0FF',
  muted:     '#8888AA',
  userBg:    'rgba(245,158,11,0.15)',
  userBorder:'rgba(245,158,11,0.35)',
};

// ─── Katana sword SVG icon ────────────────────────────────────────────────────
function KatanaIcon({ size = 22, color = '#F59E0B' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21L12 12M12 12L19 5M12 12L15 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 5L21 3" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M14 10L16 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <circle cx="5" cy="19" r="1.5" fill={color} opacity="0.7"/>
    </svg>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%', background: C.amber,
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
      padding: '0 4px',
    }}>
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${C.amber}, #D97706)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 8, marginTop: 2, boxShadow: `0 0 8px ${C.amberGlow}`,
        }}>
          <KatanaIcon size={14} color="#0D0E24" />
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '9px 13px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
        background: isUser ? C.userBg : C.card,
        border: `1px solid ${isUser ? C.userBorder : C.border}`,
        fontSize: 13,
        lineHeight: 1.55,
        color: C.text,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Voice-to-text hook ───────────────────────────────────────────────────────
// Single-shot mode: tap mic → speak → stops automatically → text is appended.
// Tap again to add more. Much more reliable than continuous mode.
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

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'How much does eHealth Pharmacy owe us?',
  'What\'s the DPD Next Day price for Crytek?',
  'Show me open tickets needing attention',
  'Which customers are on stop?',
  'How many shipments this month?',
];

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
      // Build history in Anthropic format (exclude latest user msg — sent separately)
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const r = await fetch('/api/katana/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError('Katana encountered an error. Please try again.');
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
      {/* Keyframe animation injected once */}
      <style>{`
        @keyframes katana-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes katana-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
        }
        @keyframes katana-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 24, zIndex: 9998,
          width: 400, height: 560,
          background: C.bg,
          border: `1px solid rgba(245,158,11,0.2)`,
          borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)`,
          animation: 'katana-slide-up 0.2s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: `linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))`,
            borderBottom: `1px solid rgba(245,158,11,0.15)`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.amber}, #D97706)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${C.amberGlow}`,
              flexShrink: 0,
            }}>
              <KatanaIcon size={18} color="#0D0E24" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.amber, letterSpacing: '0.03em' }}>
                KATANA
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                Ask me anything about Moov Parcel
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.muted, padding: 6, borderRadius: 6,
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >
                  <RefreshCw size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.muted, padding: 6, borderRadius: 6,
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 12px 8px',
            scrollbarWidth: 'thin',
            scrollbarColor: `${C.border} transparent`,
          }}>
            {messages.length === 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, textAlign: 'center' }}>
                  Try asking...
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12.5,
                        color: C.muted,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
                        e.currentTarget.style.color = C.text;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.color = C.muted;
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
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10, padding: '0 4px' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.amber}, #D97706)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 8, marginTop: 2,
                }}>
                  <KatanaIcon size={14} color="#0D0E24" />
                </div>
                <div style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: '4px 14px 14px 14px',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <div style={{
                margin: '6px 4px', padding: '8px 12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, fontSize: 12, color: '#FCA5A5',
              }}>
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '10px 12px 12px',
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              background: C.card,
              border: `1px solid rgba(245,158,11,0.2)`,
              borderRadius: 10,
              padding: '8px 8px 8px 12px',
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.45)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'}
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
                  color: C.text, fontSize: 13, lineHeight: 1.5,
                  resize: 'none', maxHeight: 100, overflowY: 'auto',
                  fontFamily: 'inherit',
                  scrollbarWidth: 'none',
                }}
              />
              {/* Mic button */}
              <button
                onClick={speech.toggle}
                title={speech.listening ? 'Stop listening' : 'Dictate question (en-GB)'}
                style={{
                  background: speech.listening ? C.amber : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 7, cursor: 'pointer',
                  width: 32, height: 32, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  animation: speech.listening ? 'katana-pulse 1s ease-in-out infinite' : 'none',
                }}
              >
                {speech.listening
                  ? <MicOff size={13} color="#0D0E24" />
                  : <Mic size={13} color={C.muted} />
                }
              </button>
              {/* Send button */}
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading
                    ? `linear-gradient(135deg, ${C.amber}, #D97706)`
                    : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 7, cursor: input.trim() && !loading ? 'pointer' : 'default',
                  width: 32, height: 32, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  boxShadow: input.trim() && !loading ? `0 0 12px ${C.amberGlow}` : 'none',
                }}
              >
                <Send size={14} color={input.trim() && !loading ? '#0D0E24' : C.muted} />
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 6, textAlign: 'center' }}>
              Enter to send · Shift+Enter for new line · Mic to dictate
            </div>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Open Katana"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%',
          background: open
            ? C.surface
            : `linear-gradient(135deg, ${C.amber}, #D97706)`,
          border: open ? `1px solid rgba(245,158,11,0.3)` : 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open
            ? `0 4px 20px rgba(0,0,0,0.4)`
            : `0 4px 20px rgba(245,158,11,0.4), 0 0 0 0 rgba(245,158,11,0.4)`,
          animation: !open ? 'katana-pulse 3s ease-in-out infinite' : 'none',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
      >
        {open
          ? <X size={20} color={C.amber} />
          : <KatanaIcon size={24} color="#0D0E24" />
        }
      </button>
    </>
  );
}
