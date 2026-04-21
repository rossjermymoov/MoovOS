import { healthScoreColor, accountStatusColor, tierColor } from '../../design/tokens';

// Uniform pill — same height/shape for every status badge
function Pill({ bg, border, color, dot, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 22, padding: '0 9px', borderRadius: 11,
      background: bg, border: `1px solid ${border || color}`,
      fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap', lineHeight: 1,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

export function HealthBadge({ score }) {
  const c = healthScoreColor[score] || healthScoreColor.green;
  return <Pill bg={c.bg} border={c.border} color={c.text} dot label={c.label} />;
}

export function AccountStatusBadge({ status }) {
  const c = accountStatusColor[status] || accountStatusColor.active;
  return <Pill bg={c.bg} border={c.bg} color={c.text} dot label={c.label} />;
}

export function TierBadge({ tier }) {
  const c = tierColor[tier] || tierColor.bronze;
  return <Pill bg={c.bg} border={c.bg} color={c.text} label={tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '—'} />;
}

export function CreditUtilisationBar({ pct = 0 }) {
  const color = pct >= 100 ? '#E91E8C' : pct >= 90 ? '#E91E8C' : pct >= 80 ? '#FFC107' : '#00C853';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
        {pct?.toFixed(0)}%
      </span>
    </div>
  );
}
