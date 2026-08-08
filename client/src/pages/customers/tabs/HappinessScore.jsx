/**
 * HappinessScore — the Happiness tab, rebuilt on the moov.css design system.
 * One number, three signals, and the reason behind each. On-stop is live;
 * sentiment and delivery await their data connection. Logic unchanged.
 */
import { useState, useEffect } from 'react';

// score → mark kind (green when healthy, magenta when it needs a person)
const kindOf = n => n >= 71 ? 'settled' : n > 0 ? 'attention' : 'waiting';
const colourOf = n => n >= 71 ? 'var(--mv-green-deep)' : n > 0 ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-45)';
const barClassOf = n => n >= 71 ? '' : 'is-over';
const labelOf = n => n >= 71 ? 'Healthy' : n >= 41 ? 'Fair' : n > 0 ? 'At risk' : 'Pending';

function onStopScore(customer) {
  if (customer.is_on_stop) return { score: 15, detail: 'Currently on stop', live: true };
  return { score: 80, detail: 'Not on stop · history pending', live: false };
}

function Signal({ label, score, detail, pending, source }) {
  const colour = pending ? 'var(--mv-ink-45)' : colourOf(score);
  return (
    <div style={{ padding: '0 22px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-.01em' }}>{label}</span>
        <span className="mv-num" style={{ fontWeight: 800, fontSize: 16, color: colour }}>{pending ? '—' : score}</span>
      </div>
      <div className="mv-bar" style={{ width: '100%', height: 4, margin: '10px 0 12px' }}>
        {pending
          ? <span style={{ width: '100%', background: 'rgba(32,30,29,.12)' }} />
          : <span className={barClassOf(score)} style={{ width: `${score}%` }} />}
      </div>
      <p className="mv-blurb" style={{ marginTop: 0 }}>{detail}</p>
      <div className="mv-kpi-label" style={{ marginTop: 10, color: pending ? 'var(--mv-ink-45)' : 'var(--mv-purple)' }}>{source}</div>
    </div>
  );
}

export default function HappinessScore({ customer = {} }) {
  const [override, setOverride] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, [customer.id]);

  const onStop    = onStopScore(customer);
  const sentiment = { score: 50, detail: 'Awaiting ticket analysis', live: false, pending: true };
  const delivery  = { score: 50, detail: 'Awaiting tracking data', live: false, pending: true };

  const composite = Math.round(sentiment.score * 0.4 + onStop.score * 0.3 + delivery.score * 0.3);
  const allLive   = onStop.live && !sentiment.pending && !delivery.pending;
  const displayLabel = override
    ? ({ happy: 'Healthy', neutral: 'Fair', risk: 'At risk' }[override] + ' (override)')
    : allLive ? labelOf(composite) : 'Partial data';

  const signals = [
    { label: 'Sentiment',       score: sentiment.score, detail: sentiment.detail, pending: true,  source: 'Pending — ticket analysis' },
    { label: 'On-stop pattern', score: onStop.score,    detail: onStop.detail,    pending: false, source: onStop.live ? 'Live from account events' : 'Live from account events' },
    { label: 'Delivery',        score: delivery.score,  detail: delivery.detail,  pending: true,  source: 'Pending — tracking' },
  ];

  return (
    <div>
      {/* Big score + explanation */}
      <div className="mv-section">Happiness score</div>
      <div className="mv-rule" style={{ marginBottom: 18 }} />
      <div style={{ display: 'flex', gap: 34, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 30 }}>
        <div style={{ fontWeight: 800, fontSize: 64, lineHeight: 0.9, letterSpacing: '-.04em', color: 'var(--mv-purple)', fontVariantNumeric: 'tabular-nums' }}>{composite}</div>
        <div style={{ flex: 1, minWidth: 260, maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="mv-state-label" style={{ color: 'var(--mv-ink-62)' }}>{displayLabel}</span>
            <span className="mv-kpi-label" style={{ marginBottom: 0 }}>· {onStop.live ? '1 of 3 signals live' : 'partial data'} · 2 pending connection</span>
          </div>
          <p className="mv-blurb" style={{ marginTop: 0 }}>
            One number, three signals, and the reason behind each. On-stop is live from account events; sentiment and delivery light up once their data is connected.
          </p>
        </div>
      </div>

      {/* Three signals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '2px solid var(--mv-divider)', paddingTop: 24 }}>
        {signals.map((s, i) => (
          <div key={s.label} style={{ borderLeft: i === 0 ? 'none' : '1px solid var(--mv-hairline)', paddingLeft: i === 0 ? 0 : undefined }}>
            <Signal {...s} />
          </div>
        ))}
      </div>

      {/* Agent override */}
      <div style={{ borderTop: '1px solid var(--mv-hairline)', marginTop: 26, paddingTop: 16 }}>
        <div className="mv-kpi-label" style={{ marginBottom: 8 }}>Agent override — how does this customer actually feel?</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { key: 'happy',   label: 'Happy' },
            { key: 'neutral', label: 'Neutral' },
            { key: 'risk',    label: 'At risk' },
          ].map(({ key, label }) => {
            const active = override === key;
            return (
              <button key={key} className={'mv-chip' + (active ? ' is-on' : '')} onClick={() => setOverride(active ? null : key)}>{label}</button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mv-ink-45)' }}>{override ? 'Override active · just now' : 'No override set'}</span>
        </div>
      </div>
    </div>
  );
}
