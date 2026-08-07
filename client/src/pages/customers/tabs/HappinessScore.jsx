import { useState, useEffect } from 'react';
import { Truck, AlertOctagon, MessageCircle } from 'lucide-react';

// ─── MoovOS colour tokens ─────────────────────────────────────────────────────
const T = {
  green:   { bg: 'rgba(0,200,83,0.10)',   text: '#059669', dot: '#00C853', bar: '#00C853'  },
  amber:   { bg: 'rgba(245,158,11,0.10)', text: '#D97706', dot: '#F59E0B', bar: '#F59E0B'  },
  red:     { bg: 'rgba(233,30,140,0.10)',  text: '#DC2626', dot: '#E91E8C', bar: '#E91E8C'  },
  pending: { bg: 'rgba(100,116,139,0.08)',text: '#64748B', dot: '#94A3B8', bar: '#CBD5E1'  },
};
const G = { text: '#64748B', muted: '#94A3B8', border: 'rgba(0,0,0,0.08)', card: '#FFFFFF' };

const colorOf = n => n >= 71 ? T.green : n >= 41 ? T.amber : n > 0 ? T.red : T.pending;
const labelOf = n => n >= 71 ? 'Healthy' : n >= 41 ? 'Fair' : n > 0 ? 'At risk' : 'Pending';

// ─── On-stop scoring from real data ──────────────────────────────────────────
function onStopScore(customer) {
  if (customer.is_on_stop) return { score: 15, detail: 'Currently on stop', live: true };
  return { score: 80, detail: 'Not on stop · History pending', live: false };
}

function MiniBar({ value, c, animated, pending }) {
  return (
    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      {pending
        ? <div style={{ height: '100%', width: '100%', background: 'repeating-linear-gradient(90deg, rgba(148,163,184,0.3) 0px, rgba(148,163,184,0.3) 8px, transparent 8px, transparent 16px)' }} />
        : <div style={{ height: '100%', borderRadius: 2, width: animated ? value + '%' : '0%', background: c.bar, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
      }
    </div>
  );
}

export default function HappinessScore({ customer = {} }) {
  const [override, setOverride] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, [customer.id]);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, [customer.id]);

  // On-stop is real; sentiment + delivery pending data connection
  const onStop   = onStopScore(customer);
  const sentiment  = { score: 50, detail: 'Awaiting ticket analysis',  live: false, pending: true };
  const delivery   = { score: 50, detail: 'Awaiting tracking data',     live: false, pending: true };

  // Composite: weight pillars, mark partial
  const composite = Math.round(sentiment.score * 0.4 + onStop.score * 0.3 + delivery.score * 0.3);
  const allLive   = onStop.live && !sentiment.pending && !delivery.pending;
  const c         = allLive ? colorOf(composite) : T.amber;
  const displayLabel = override
    ? ({ happy: 'Healthy', neutral: 'Fair', risk: 'At risk' }[override] + ' (override)')
    : allLive ? labelOf(composite) : 'Partial data';

  const pillars = [
    { Icon: MessageCircle, label: 'Sentiment',       score: sentiment.score,  detail: sentiment.detail,  live: sentiment.live,  pending: sentiment.pending,  c: T.pending },
    { Icon: AlertOctagon,  label: 'On-stop pattern', score: onStop.score,     detail: onStop.detail,     live: onStop.live,     pending: false,              c: colorOf(onStop.score) },
    { Icon: Truck,         label: 'Delivery',        score: delivery.score,   detail: delivery.detail,   live: delivery.live,   pending: delivery.pending,   c: T.pending },
  ];

  const customerName = customer.company_name || customer.name || 'This customer';

  return (
    <div style={{ padding: '20px 0', fontFamily: "'Inter', system-ui, sans-serif", color: '#0F172A' }}>

      <div style={{ background: G.card, borderRadius: 10, padding: '20px 22px', border: '1px solid ' + G.border }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 12, color: G.text, margin: '0 0 4px' }}>{customerName}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color: c.text, transition: 'color 0.4s' }}>
                {composite}
              </span>
              <span style={{ fontSize: 14, color: G.muted }}>/ 100</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.text, marginLeft: 4 }}>
                {displayLabel}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginBottom: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: onStop.live ? '#00C853' : '#F59E0B', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: G.muted }}>{onStop.live ? '1 of 3 pillars live' : 'Partial data'}</span>
            </div>
            <p style={{ fontSize: 11, color: G.muted, margin: 0 }}>2 pillars pending connection</p>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ flex: 40, background: 'rgba(233,30,140,0.18)' }} />
            <div style={{ flex: 30, background: 'rgba(245,158,11,0.18)' }} />
            <div style={{ flex: 30, background: 'rgba(0,200,83,0.18)' }} />
          </div>
          <div style={{ position: 'absolute', top: -3, left: 'calc(' + (animated ? composite : 0) + '% - 6px)', width: 12, height: 12, borderRadius: '50%', background: c.dot, border: '2px solid ' + G.card, transition: 'left 1.1s cubic-bezier(0.4,0,0.2,1)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: G.muted }}>0 — At risk</span>
            <span style={{ fontSize: 10, color: G.muted }}>40 — Fair</span>
            <span style={{ fontSize: 10, color: G.muted }}>70 — Healthy</span>
          </div>
        </div>

        {/* Pillars */}
        <div style={{ marginBottom: 18 }}>
          {pillars.map(({ Icon, label, score, detail, live, pending, c: pc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid ' + G.border }}>
              <Icon size={14} color={G.text} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#334155', width: 120, flexShrink: 0 }}>{label}</span>
              <MiniBar value={score} c={pc} animated={animated} pending={pending} />
              <span style={{ fontSize: 11, color: pending ? G.muted : pc.text, width: 200, textAlign: 'right', flexShrink: 0, fontStyle: pending ? 'italic' : 'normal' }}>
                {detail}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: pending ? G.muted : pc.text, width: 28, textAlign: 'right', flexShrink: 0 }}>
                {pending ? '—' : score}
              </span>
            </div>
          ))}
        </div>

        {/* Override */}
        <div style={{ borderTop: '1px solid ' + G.border, paddingTop: 14 }}>
          <p style={{ fontSize: 11, color: G.muted, margin: '0 0 8px' }}>Agent override — how does this customer actually feel?</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { key: 'happy',   label: 'Happy',   c: T.green },
              { key: 'neutral', label: 'Neutral',  c: T.amber },
              { key: 'risk',    label: 'At risk',  c: T.red   },
            ].map(({ key, label: lbl, c: bc }) => {
              const active = override === key;
              return (
                <button key={key}
                  onClick={() => setOverride(active ? null : key)}
                  style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, cursor: 'pointer', border: '1px solid ' + (active ? bc.dot : 'rgba(0,0,0,0.12)'), background: active ? bc.bg : 'transparent', color: active ? bc.text : G.text, fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}>
                  {lbl}
                </button>
              );
            })}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: G.muted }}>
              {override ? 'Override active · just now' : 'No override set'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
