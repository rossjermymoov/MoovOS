/**
 * AiUsageSettings — /settings/ai-usage
 *
 * What uses AI tokens, how much is left, and whether AI is actually working —
 * for a chosen period (7 / 30 / 90 days or this month): totals, a daily chart,
 * breakdowns by feature and by model, and the last 25 calls.
 * Built after Gemini ran out of prepaid credits for weeks unnoticed: every AI
 * feature fell back to keyword rules silently. Admins can set a monthly token
 * limit (pause or warn), record the prepaid balance to see an estimate of what's
 * left, and switch individual AI features off.
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

const nf = new Intl.NumberFormat('en-GB');
const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 });
const money = (v, cur) => v == null ? '—' : new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: cur || 'GBP', minimumFractionDigits: 2, maximumFractionDigits: v > 0 && v < 0.01 ? 4 : 2,
}).format(v);
const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fmtMs = (ms) => ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
const fmtClock = (t) => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtTime = (t) => t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const S = {
  h1:     { fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--mv-ink)', margin: 0 },
  h2:     { fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--mv-ink)', margin: 0 },
  sub:    { fontSize: 13, color: 'var(--mv-ink-52)', lineHeight: 1.55, margin: '4px 0 0' },
  label:  { fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--mv-ink-45)' },
  section:{ borderTop: '2px solid var(--mv-ink)', paddingTop: 16, marginTop: 36 },
  input:  { width: '100%', boxSizing: 'border-box', background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline)',
            borderRadius: 'var(--v2-r-8, 8px)', color: 'var(--mv-ink)', fontSize: 13, padding: '8px 11px', outline: 'none',
            fontVariantNumeric: 'tabular-nums' },
  num:    { fontVariantNumeric: 'tabular-nums' },
};

// ── Status line (four-mark language) ─────────────────────────────────────────
const HEALTH_MARK = { ok: 'settled', failing: 'attention', paused: 'attention', idle: 'waiting' };

function HealthLine({ health }) {
  if (!health) return null;
  const kind = HEALTH_MARK[health.status] || 'waiting';
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
      <span className={`mv-mark mv-mark--${kind}`} style={{ marginTop: 6 }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: kind === 'attention' ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)' }}>{health.message}</div>
        {health.since && <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>Since {fmtTime(health.since)}</div>}
        {health.status === 'ok' && health.last_success_at && <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>Last successful call {fmtTime(health.last_success_at)}</div>}
      </div>
    </div>
  );
}

// ── Headline figures ─────────────────────────────────────────────────────────
function Figure({ label, value, note, alarm }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={S.label}>{label}</div>
      <div style={{ ...S.num, fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6,
        color: alarm ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)' }}>{value}</div>
      {note && <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 4, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

// Monthly limit meter: purple fill (automation), magenta once reached; a tick
// marks the warning level.
function LimitMeter({ limit, warnPercent }) {
  const pct = Math.min(1, limit.percent || 0);
  const fill = limit.state === 'reached' ? 'var(--mv-magenta)' : 'var(--mv-purple)';
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ position: 'relative', height: 8, background: 'var(--mv-hairline)', borderRadius: 999 }}
        role="meter" aria-valuemin={0} aria-valuemax={limit.tokens} aria-valuenow={limit.used}
        aria-label={`${nf.format(limit.used)} of ${nf.format(limit.tokens)} tokens used this month`}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: fill, borderRadius: 999 }} />
        <div title={`Warning at ${warnPercent}%`} style={{ position: 'absolute', left: `${warnPercent}%`, top: -3, width: 2, height: 14, background: 'var(--mv-ink-45)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 6, ...S.num }}>
        <span>{Math.round((limit.percent || 0) * 100)}% of the monthly limit used</span>
        <span>Warning at {warnPercent}%</span>
      </div>
    </div>
  );
}

// ── Segmented control (range, chart metric, breakdown view) ─────────────────
function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'inline-flex', gap: 2, padding: 2, background: 'var(--mv-bg)',
      border: '1px solid var(--mv-hairline)', borderRadius: 'var(--v2-r-8, 8px)' }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} aria-pressed={value === o.key}
          style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px', border: 'none', cursor: 'pointer',
            borderRadius: 'calc(var(--v2-r-8, 8px) - 2px)',
            background: value === o.key ? 'var(--mv-surface)' : 'transparent',
            color: value === o.key ? 'var(--mv-ink)' : 'var(--mv-ink-52)',
            boxShadow: value === o.key ? '0 1px 2px color-mix(in srgb, var(--mv-ink) 10%, transparent)' : 'none' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Daily chart: one measure at a time (never two scales on one axis), hover
//    tooltip with all three, failure marks, table view ───────────────────────
const METRICS = {
  tokens: { label: 'Tokens', value: d => d.tokens, fmt: v => nf.format(v) },
  calls:  { label: 'Calls',  value: d => d.calls,  fmt: v => nf.format(v) },
  cost:   { label: 'Cost',   value: d => d.cost || 0 },
};

function DailyChart({ daily, priced, currency }) {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const [metric, setMetric] = useState('tokens');
  const m = metric === 'cost' && !priced ? METRICS.tokens : METRICS[metric];
  const fmtV = metric === 'cost' && priced ? (v => money(v, currency)) : m.fmt;
  const max = Math.max(...daily.map(m.value), 0);
  const H = 150;
  const many = daily.length > 45;
  const metricOptions = [{ key: 'tokens', label: 'Tokens' }, { key: 'calls', label: 'Calls' }, ...(priced ? [{ key: 'cost', label: 'Cost' }] : [])];

  const toolbar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Segmented label="Chart measure" value={metric} onChange={setMetric} options={metricOptions} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--mv-ink-52)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, background: 'var(--mv-magenta)' }} /> Some calls failed</span>
        <button onClick={() => setAsTable(t => !t)} style={linkBtn}>{asTable ? 'Show as chart' : 'Show as table'}</button>
      </span>
    </div>
  );

  if (asTable) {
    return (
      <div>
        {toolbar}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 10 }}>
          <thead><tr>{['Day', 'Calls', 'Failed', 'Tokens', ...(priced ? ['Est. cost'] : [])].map((h, i) => (
            <th key={h} style={{ ...S.label, textAlign: i ? 'right' : 'left', padding: '6px 0', borderBottom: '1px solid var(--mv-hairline)' }}>{h}</th>))}</tr></thead>
          <tbody>{daily.slice().reverse().map(d => (
            <tr key={d.day} style={{ borderBottom: '1px solid var(--mv-hairline)' }}>
              <td style={{ padding: '6px 0' }}>{fmtDay(d.day)}</td>
              <td style={{ textAlign: 'right', ...S.num }}>{nf.format(d.calls)}</td>
              <td style={{ textAlign: 'right', ...S.num, color: d.failures ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-52)' }}>{nf.format(d.failures)}</td>
              <td style={{ textAlign: 'right', ...S.num }}>{nf.format(d.tokens)}</td>
              {priced && <td style={{ textAlign: 'right', ...S.num }}>{money(d.cost, currency)}</td>}
            </tr>))}</tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      {toolbar}
      <div style={{ position: 'relative', marginTop: 30 }} onMouseLeave={() => setHover(null)}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTop: '1px dashed var(--mv-hairline)' }} />
        <span style={{ position: 'absolute', left: 0, top: -16, fontSize: 11, color: 'var(--mv-ink-45)', ...S.num }}>
          {max > 0 ? `${fmtV(max)} peak` : `No ${m.label.toLowerCase()} in this period`}
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: many ? 2 : 6, height: H, borderBottom: '1px solid var(--mv-ink-45)' }}
          role="img" aria-label={`${m.label} per day; peak ${fmtV(max)}`}>
          {daily.map((d, i) => {
            const v = m.value(d);
            return (
              <div key={d.day} onMouseEnter={() => setHover(i)}
                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch' }}>
                {d.failures > 0 && <span style={{ alignSelf: 'center', width: many ? 4 : 6, height: many ? 4 : 6, background: 'var(--mv-magenta)', marginBottom: 3 }} />}
                <div style={{ height: v && max ? Math.max(2, (v / max) * (H - 12)) : 0, borderRadius: many ? '2px 2px 0 0' : '4px 4px 0 0',
                  // Softened fill: full-strength brand colour over many bars glares, in dark mode especially.
                  background: hover === i ? 'var(--mv-purple)' : 'color-mix(in srgb, var(--mv-purple) 72%, var(--mv-surface))' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--mv-ink-45)', marginTop: 6 }}>
          <span>{fmtDay(daily[0]?.day)}</span>
          {daily.length > 14 && <span>{fmtDay(daily[Math.floor(daily.length / 2)]?.day)}</span>}
          <span>Today</span>
        </div>
        {hover != null && daily[hover] && (
          <div style={{ position: 'absolute', bottom: H + 8, left: `${((hover + 0.5) / daily.length) * 100}%`,
            transform: `translateX(${hover > daily.length * 0.7 ? '-100%' : hover < daily.length * 0.3 ? '0' : '-50%'})`,
            background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', borderRadius: 'var(--v2-r-8, 8px)',
            padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 2,
            boxShadow: '0 4px 12px color-mix(in srgb, var(--mv-ink) 12%, transparent)' }}>
            <div style={{ fontWeight: 700, color: 'var(--mv-ink)' }}>{fmtDay(daily[hover].day)}</div>
            <div style={{ color: 'var(--mv-ink-62)', ...S.num }}>{nf.format(daily[hover].calls)} calls · {nf.format(daily[hover].tokens)} tokens</div>
            {priced && <div style={{ color: 'var(--mv-ink-62)', ...S.num }}>{money(daily[hover].cost, currency)} estimated</div>}
            {daily[hover].failures > 0 && <div style={{ color: 'var(--mv-magenta-deep)', ...S.num }}>{nf.format(daily[hover].failures)} failed</div>}
          </div>
        )}
      </div>
    </div>
  );
}

const linkBtn = { fontSize: 12, fontWeight: 600, color: 'var(--mv-purple)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' };

// ── On/off switch ────────────────────────────────────────────────────────────
function Switch({ on, onChange, label, disabled }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} disabled={disabled}
      style={{ width: 36, height: 20, borderRadius: 999, border: 'none', padding: 2, cursor: disabled ? 'default' : 'pointer',
        background: on ? 'var(--mv-purple)' : 'var(--mv-hairline-2)', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'background .12s', opacity: disabled ? 0.6 : 1 }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--mv-surface)' }} />
    </button>
  );
}

// ── Breakdown tables ─────────────────────────────────────────────────────────
const th = { ...S.label, padding: '8px 0', whiteSpace: 'nowrap' };
const cell = { fontSize: 13, ...S.num, textAlign: 'right' };

function ShareBar({ share }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={`${(share * 100).toFixed(1)}% of tokens in this period`}>
      <div style={{ flex: 1, height: 6, background: 'var(--mv-hairline)', borderRadius: 999 }}>
        <div style={{ width: `${share * 100}%`, height: '100%', background: 'var(--mv-purple)', borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--mv-ink-52)', width: 34, textAlign: 'right', ...S.num }}>{Math.round(share * 100)}%</span>
    </div>
  );
}

function Failed({ n }) {
  return <span style={{ ...cell, color: n ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-45)', fontWeight: n ? 700 : 400 }}>{nf.format(n)}</span>;
}

function Tokens({ r }) {
  return <span style={cell} title={`${nf.format(r.tokens_in)} in · ${nf.format(r.tokens_out)} out`}>{compact.format(r.tokens_in)} / {compact.format(r.tokens_out)}</span>;
}

const FEATURE_COLS = 'minmax(200px, 2.2fr) 56px 56px 120px 76px 76px minmax(90px, 1fr) 40px';

function FeatureTable({ features, priced, currency, onToggle, saving }) {
  return (
    <div role="table" aria-label="AI use by feature">
      <div role="row" style={{ display: 'grid', gridTemplateColumns: FEATURE_COLS, gap: 14, borderBottom: '1px solid var(--mv-ink-45)' }}>
        <span style={th}>Feature</span>
        <span style={{ ...th, textAlign: 'right' }}>Calls</span>
        <span style={{ ...th, textAlign: 'right' }}>Failed</span>
        <span style={{ ...th, textAlign: 'right' }}>Tokens in/out</span>
        <span style={{ ...th, textAlign: 'right' }}>Avg time</span>
        <span style={{ ...th, textAlign: 'right' }}>Est. cost</span>
        <span style={th}>Share</span>
        <span style={{ ...th, textAlign: 'right' }}>On</span>
      </div>
      {features.map(f => (
        <div role="row" key={f.key} style={{ display: 'grid', gridTemplateColumns: FEATURE_COLS, gap: 14, alignItems: 'center',
          padding: '10px 0', borderBottom: '1px solid var(--mv-hairline)', opacity: f.enabled ? 1 : 0.6 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)' }}>{f.label}{!f.enabled && <span style={{ ...S.label, marginLeft: 8 }}>Off</span>}</div>
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2, lineHeight: 1.4 }}>{f.description}</div>
          </div>
          <span style={cell}>{nf.format(f.calls)}</span>
          <Failed n={f.failures} />
          <Tokens r={f} />
          <span style={{ ...cell, color: 'var(--mv-ink-62)' }}>{fmtMs(f.avg_ms)}</span>
          <span style={{ ...cell, color: priced ? 'var(--mv-ink)' : 'var(--mv-ink-45)' }}>{priced ? money(f.cost, currency) : '—'}</span>
          <ShareBar share={f.share} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Switch on={f.enabled} label={`AI for ${f.label}`} disabled={saving} onChange={on => onToggle(f, on)} />
          </div>
        </div>
      ))}
    </div>
  );
}

const MODEL_COLS = 'minmax(200px, 2.2fr) 56px 56px 120px 76px 76px minmax(90px, 1fr)';

function ModelTable({ models, priced, currency }) {
  if (!models.length) return <p style={{ ...S.sub, padding: '12px 0' }}>No AI calls in this period.</p>;
  return (
    <div role="table" aria-label="AI use by model">
      <div role="row" style={{ display: 'grid', gridTemplateColumns: MODEL_COLS, gap: 14, borderBottom: '1px solid var(--mv-ink-45)' }}>
        <span style={th}>Model</span>
        <span style={{ ...th, textAlign: 'right' }}>Calls</span>
        <span style={{ ...th, textAlign: 'right' }}>Failed</span>
        <span style={{ ...th, textAlign: 'right' }}>Tokens in/out</span>
        <span style={{ ...th, textAlign: 'right' }}>Avg time</span>
        <span style={{ ...th, textAlign: 'right' }}>Est. cost</span>
        <span style={th}>Share</span>
      </div>
      {models.map(m => (
        <div role="row" key={`${m.provider}/${m.model}`} style={{ display: 'grid', gridTemplateColumns: MODEL_COLS, gap: 14, alignItems: 'center',
          padding: '10px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)' }}>{m.model}</div>
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2, textTransform: 'capitalize' }}>{m.provider}{m.provider !== 'gemini' ? ' (fallback)' : ''}</div>
          </div>
          <span style={cell}>{nf.format(m.calls)}</span>
          <Failed n={m.failures} />
          <Tokens r={m} />
          <span style={{ ...cell, color: 'var(--mv-ink-62)' }}>{fmtMs(m.avg_ms)}</span>
          <span style={{ ...cell, color: priced ? 'var(--mv-ink)' : 'var(--mv-ink-45)' }}>{priced ? money(m.cost, currency) : '—'}</span>
          <ShareBar share={m.share} />
        </div>
      ))}
    </div>
  );
}

// ── Recent calls feed ───────────────────────────────────────────────────────
const FEED_COLS = '140px minmax(150px, 1.6fr) minmax(120px, 1fr) 120px 66px 76px minmax(120px, 1.3fr)';

function RecentFeed({ recent, features, priced, currency }) {
  const [all, setAll] = useState(false);
  const label = k => features.find(f => f.key === k)?.label || k;
  const shown = all ? recent : recent.slice(0, 10);
  if (!recent.length) return <p style={{ ...S.sub, padding: '12px 0' }}>No AI calls recorded yet.</p>;
  return (
    <div role="table" aria-label="Last 25 AI calls">
      <div role="row" style={{ display: 'grid', gridTemplateColumns: FEED_COLS, gap: 14, borderBottom: '1px solid var(--mv-ink-45)' }}>
        <span style={th}>When</span><span style={th}>Feature</span><span style={th}>Model</span>
        <span style={{ ...th, textAlign: 'right' }}>Tokens in/out</span><span style={{ ...th, textAlign: 'right' }}>Time</span>
        <span style={{ ...th, textAlign: 'right' }}>Est. cost</span><span style={th}>Result</span>
      </div>
      {shown.map(e => {
        const kind = e.blocked ? 'waiting' : e.ok ? 'settled' : 'attention';
        const result = e.blocked ? 'Not sent' : e.ok ? 'OK' : `Failed${e.http_status ? ` (${e.http_status})` : ''}`;
        return (
          <div role="row" key={e.id} style={{ display: 'grid', gridTemplateColumns: FEED_COLS, gap: 14, alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid var(--mv-hairline)', fontSize: 13 }}>
            <span style={{ color: 'var(--mv-ink-62)', ...S.num }}>{fmtClock(e.created_at)}</span>
            <span style={{ color: 'var(--mv-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label(e.feature)}</span>
            <span style={{ color: 'var(--mv-ink-62)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.model || '—'}</span>
            <Tokens r={e} />
            <span style={{ ...cell, color: 'var(--mv-ink-62)' }}>{fmtMs(e.duration_ms)}</span>
            <span style={{ ...cell, color: priced ? 'var(--mv-ink)' : 'var(--mv-ink-45)' }}>{priced && e.ok ? money(e.cost, currency) : '—'}</span>
            <span className={`mv-state mv-state--${kind}`} title={e.explanation || ''} style={{ minWidth: 0 }}>
              <span className={`mv-mark mv-mark--${kind}`} />
              <span className="mv-state-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result}</span>
            </span>
          </div>
        );
      })}
      {recent.length > 10 && (
        <button onClick={() => setAll(a => !a)} style={{ ...linkBtn, marginTop: 10 }}>
          {all ? 'Show fewer' : `Show all ${recent.length}`}
        </button>
      )}
    </div>
  );
}

// ── Limits & pricing form (staged; nothing changes until Save) ──────────────
function toForm(s) {
  return {
    monthly_token_limit: s.monthly_token_limit ?? '',
    warn_percent:        s.warn_percent ?? 80,
    pause_at_limit:      s.pause_at_limit ?? true,
    price_input_per_m:   s.price_input_per_m ?? '',
    price_output_per_m:  s.price_output_per_m ?? '',
    currency:            s.currency || 'GBP',
    credit_balance:      s.credit_balance ?? '',
  };
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={S.label}>{label}</span>
      <div style={{ marginTop: 6 }}>{children}</div>
      {hint && <span style={{ display: 'block', fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 5, lineHeight: 1.45 }}>{hint}</span>}
    </label>
  );
}

function LimitsForm({ settings, credit, onSave, saving, error }) {
  const initial = useMemo(() => toForm(settings), [settings]);
  const [f, setF] = useState(initial);
  useEffect(() => { setF(initial); }, [initial]);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <Field label="Monthly token limit" hint="Leave blank for no limit. Resets on the 1st of each month.">
          <input type="number" min="0" step="10000" value={f.monthly_token_limit} placeholder="No limit"
            onChange={e => set('monthly_token_limit', e.target.value)} style={S.input} />
        </Field>
        <Field label="Warn at" hint="Shows a warning here once this share of the limit is used.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" min="1" max="100" value={f.warn_percent} onChange={e => set('warn_percent', e.target.value)} style={{ ...S.input, width: 90 }} />
            <span style={{ fontSize: 13, color: 'var(--mv-ink-62)' }}>% of the limit</span>
          </div>
        </Field>
        <Field label="When the limit is reached">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--mv-ink)' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="radio" checked={f.pause_at_limit} onChange={() => set('pause_at_limit', true)} style={{ marginTop: 3 }} />
              <span>Pause AI. Emails are sorted by keywords until next month.</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="radio" checked={!f.pause_at_limit} onChange={() => set('pause_at_limit', false)} style={{ marginTop: 3 }} />
              <span>Keep running and only warn.</span>
            </label>
          </div>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 24 }}>
        <Field label="Price per 1M input tokens" hint="From your Gemini pricing page. Needed to show costs.">
          <input type="number" min="0" step="0.01" value={f.price_input_per_m} placeholder="e.g. 0.30" onChange={e => set('price_input_per_m', e.target.value)} style={S.input} />
        </Field>
        <Field label="Price per 1M output tokens" hint="Output includes the model's thinking tokens.">
          <input type="number" min="0" step="0.01" value={f.price_output_per_m} placeholder="e.g. 2.50" onChange={e => set('price_output_per_m', e.target.value)} style={S.input} />
        </Field>
        <Field label="Currency">
          <input value={f.currency} maxLength={3} onChange={e => set('currency', e.target.value.toUpperCase())} style={{ ...S.input, width: 90 }} />
        </Field>
        <Field label="Prepaid credit balance"
          hint={settings.credit_balance_set_at
            ? `Recorded ${fmtTime(settings.credit_balance_set_at)}. Enter the balance from AI Studio after each top-up.`
            : 'Enter the balance shown in Google AI Studio to see an estimate of what is left.'}>
          <input type="number" min="0" step="0.01" value={f.credit_balance} placeholder="Not recorded" onChange={e => set('credit_balance', e.target.value)} style={S.input} />
        </Field>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22 }}>
        <button onClick={() => onSave({ ...f, warn_percent: Number(f.warn_percent) })} disabled={!dirty || saving}
          style={{ background: dirty ? 'var(--mv-purple)' : 'var(--mv-hairline-2)', color: dirty ? 'var(--mv-on-brand)' : 'var(--mv-ink-52)',
            border: 'none', borderRadius: 'var(--v2-r-8, 8px)', padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: dirty ? 'pointer' : 'default' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {dirty && !saving && <button onClick={() => setF(initial)} style={{ ...linkBtn, color: 'var(--mv-ink-52)' }}>Cancel</button>}
        {error && <span role="alert" style={{ fontSize: 13, color: 'var(--mv-magenta-deep)' }}>{error}</span>}
        {credit && !dirty && <span style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>Estimates use your prices; your AI Studio bill is the final figure.</span>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
const RANGE_OPTIONS = [
  { key: '7d', label: 'Last 7 days' }, { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' }, { key: 'month', label: 'This month' },
];

export default function AiUsageSettings() {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [range, setRange] = useState(() => {
    try { return localStorage.getItem('moov.aiUsage.range') || '30d'; } catch { return '30d'; }
  });
  const changeRange = (r) => { setRange(r); try { localStorage.setItem('moov.aiUsage.range', r); } catch { /* keep in memory */ } };
  const [view, setView] = useState('feature');

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['ai-usage', range],
    queryFn: () => api.get('/ai-usage', { params: { range } }).then(r => r.data),
    refetchInterval: 60_000,
    placeholderData: prev => prev,
  });

  const save = useMutation({
    mutationFn: body => api.put('/ai-usage/settings', body, { params: { range } }).then(r => r.data),
    onSuccess: d => { setError(''); qc.setQueryData(['ai-usage', range], d); qc.invalidateQueries({ queryKey: ['ai-usage'] }); },
    onError: e => setError(e.response?.data?.error || 'Could not save. Try again.'),
  });

  function toggleFeature(f, on) {
    if (!on && !window.confirm(`Switch off AI for "${f.label}"? MoovOS will use its non-AI fallback for this until you switch it back on.`)) return;
    const disabled = new Set(data.settings.disabled_features || []);
    if (on) disabled.delete(f.key); else disabled.add(f.key);
    save.mutate({ disabled_features: [...disabled] });
  }

  const cur = data?.settings?.currency || 'GBP';
  const t = data?.totals;
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long' });

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <SettingsNav />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={S.h1}>AI usage</h1>
          <p style={S.sub}>What uses AI, what it costs and whether it's working. Counted by MoovOS from each call; your Google AI Studio bill is the final word.</p>
        </div>
        <Segmented label="Period" value={range} onChange={changeRange} options={RANGE_OPTIONS} />
      </div>

      {isLoading && <p style={{ ...S.sub, marginTop: 24 }}>Loading…</p>}
      {isError && !data && <p role="alert" style={{ ...S.sub, marginTop: 24, color: 'var(--mv-magenta-deep)' }}>Usage could not be loaded.</p>}

      {data && (
        <div style={{ opacity: isFetching && data.range?.key !== range ? 0.6 : 1, transition: 'opacity .15s' }}>
          <div style={{ marginTop: 16 }}><HealthLine health={data.health} /></div>

          {/* ── Period totals ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 24, marginTop: 22 }}>
            <Figure label="AI calls" value={nf.format(t.calls)}
              alarm={t.failures > 0 && t.failure_rate >= 0.5}
              note={t.failures ? `${nf.format(t.failures)} failed (${Math.round(t.failure_rate * 100)}%)` : 'None failed'} />
            <Figure label="Tokens" value={compact.format(t.tokens)}
              note={`${compact.format(t.tokens_in)} in · ${compact.format(t.tokens_out)} out`} />
            <Figure label="Estimated cost" value={data.priced ? money(t.cost, cur) : '—'}
              note={data.priced ? (t.calls ? `About ${money(t.cost / t.calls * 1000, cur)} per 1,000 calls` : 'At the prices set below.') : 'Add your prices below to see costs.'} />
            <Figure label="Average response time" value={fmtMs(t.avg_ms)}
              note="Successful calls only." />
          </div>

          {/* ── Daily ── */}
          <div style={{ ...S.section, marginTop: 28 }}>
            <h2 style={S.h2}>By day</h2>
            <div style={{ marginTop: 14 }}><DailyChart daily={data.daily} priced={data.priced} currency={cur} /></div>
          </div>

          {/* ── Breakdown ── */}
          <div style={S.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={S.h2}>Where it goes</h2>
                <p style={S.sub}>{view === 'feature'
                  ? 'Switching a feature off makes MoovOS use its non-AI fallback for it, such as keyword sorting.'
                  : 'Costs use the Gemini prices set below for every model.'}</p>
              </div>
              <Segmented label="Breakdown" value={view} onChange={setView}
                options={[{ key: 'feature', label: `By feature (${data.features.filter(f => f.calls).length})` }, { key: 'model', label: `By model (${data.models.length})` }]} />
            </div>
            <div style={{ marginTop: 12 }}>
              {view === 'feature'
                ? <FeatureTable features={data.features} priced={data.priced} currency={cur} onToggle={toggleFeature} saving={save.isPending} />
                : <ModelTable models={data.models} priced={data.priced} currency={cur} />}
            </div>
          </div>

          {/* ── Recent calls ── */}
          <div style={S.section}>
            <h2 style={S.h2}>Recent calls</h2>
            <p style={S.sub}>The latest AI calls, newest first. Hover over a failed call to see why.</p>
            <div style={{ marginTop: 12 }}>
              <RecentFeed recent={data.recent} features={data.features} priced={data.priced} currency={cur} />
            </div>
          </div>

          {/* ── Budget (always this calendar month) ── */}
          <div style={S.section}>
            <h2 style={S.h2}>Budget for {monthName}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 24, marginTop: 16 }}>
              <Figure label="Used this month" value={compact.format(data.month.tokens)}
                note={data.priced ? `${money(data.month.cost, cur)} estimated` : 'tokens'} />
              <Figure label="Left this month"
                value={data.limit ? compact.format(data.limit.left) : 'No limit'}
                alarm={data.limit?.state === 'reached'}
                note={data.limit ? `of ${nf.format(data.limit.tokens)} tokens${data.limit.state === 'reached' ? '. Limit reached.' : data.limit.state === 'warning' ? '. Nearing the limit.' : ''}` : 'Set a monthly limit below.'} />
              <Figure label="Credit left (estimate)"
                value={data.credit ? money(data.credit.left, cur) : '—'}
                alarm={data.credit && data.credit.left <= 0}
                note={data.credit
                  ? `${money(data.credit.balance, cur)} recorded ${fmtTime(data.credit.set_at)}, less ${money(data.credit.spent, cur)} used since.`
                  : data.priced ? 'Record your AI Studio balance below.' : 'Needs prices and a recorded balance.'} />
            </div>
            {data.limit && <LimitMeter limit={data.limit} warnPercent={data.settings.warn_percent} />}
          </div>

          {/* ── Limits ── */}
          <div style={S.section}>
            <h2 style={S.h2}>Limits and pricing</h2>
            <div style={{ marginTop: 16 }}>
              <LimitsForm settings={data.settings} credit={data.credit} onSave={body => save.mutate(body)} saving={save.isPending} error={error} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
