import { healthScoreColor, accountStatusColor, tierColor } from '../../design/tokens';

export function HealthBadge({ score }) {
  const c = healthScoreColor[score] || healthScoreColor.green;
  return (
    <span
      className="status-badge"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.text, display: 'inline-block', marginRight: 6 }} />
      {c.label}
    </span>
  );
}

export function AccountStatusBadge({ status }) {
  const c = accountStatusColor[status] || accountStatusColor.active;
  return (
    <span className="status-badge" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

export function TierBadge({ tier }) {
  const c = tierColor[tier] || tierColor.bronze;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        textTransform: 'capitalize',
      }}
    >
      {tier}
    </span>
  );
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
