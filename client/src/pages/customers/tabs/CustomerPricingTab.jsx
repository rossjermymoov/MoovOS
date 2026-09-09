/**
 * CustomerPricingTab — rebuilt to PRICING_TAB.md on the moov.css design system.
 * Presentation only: every query, mutation and endpoint is preserved from the
 * previous implementation. Section order: coverage strip · carriers · per-carrier
 * config · billing modes · service selection · rate cards (accordion, one open).
 */
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Plus, Check, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import axios from 'axios';
import { getCourierLogo } from '../../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });
const gbp = (n) => `£${parseFloat(n || 0).toFixed(2)}`;
const fix2 = (n) => (n == null || n === '' ? '' : parseFloat(n).toFixed(2));

/* ── NL search (unchanged) ─────────────────────────────────── */
function parseNLQuery(query) {
  const q = query.toLowerCase();
  let weightKg = null;
  const weightMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms|kilo|kilos)\b/);
  if (weightMatch) weightKg = parseFloat(weightMatch[1]);
  else { const g = q.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/); if (g) weightKg = parseFloat(g[1]) / 1000; }
  let zoneTerm = q
    .replace(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms|kilo|kilos|g|gram|grams)\b/g, '')
    .replace(/\b(tell|me|the|price|for|to|from|a|an|find|get|what|is|how|much|does|it|cost|package|parcel|shipment|shipping|send|sending|weight)\b/g, '')
    .replace(/\s+/g, ' ').trim();
  if (!zoneTerm) zoneTerm = null;
  return { weightKg, zoneTerm };
}
function weightClassCoversKg(weightClassName, weightKg) {
  if (weightKg == null) return false;
  let s = weightClassName.toUpperCase().replace(/\s/g, '');
  s = s.replace(/KILOGRAMS$/, '').replace(/KILOGRAM$/, '').replace(/KGS$/, '').replace(/KG$/, '').replace(/K$/, '');
  const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (range) { const lo = parseFloat(range[1]), hi = parseFloat(range[2]); return weightKg > lo && weightKg <= hi; }
  const plus = s.match(/^(\d+(?:\.\d+)?)\+$/) || s.match(/^OVER(\d+(?:\.\d+)?)$/);
  if (plus) return weightKg > parseFloat(plus[1]);
  const under = s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)$/);
  if (under) return weightKg < parseFloat(under[1]);
  const upto = s.match(/^(?:UPTO|MAX)(\d+(?:\.\d+)?)$/);
  if (upto) return weightKg <= parseFloat(upto[1]);
  const bare = s.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return weightKg <= parseFloat(bare[1]);
  return false;
}
function wcSortKey(wc) {
  const s = wc.toUpperCase().replace(/\s/g, '').replace(/KILOGRAMS?$|KGS?$|K$/, '');
  const bare = s.match(/^(\d+(?:\.\d+)?)$/); if (bare) return parseFloat(bare[1]);
  const range = s.match(/^(\d+(?:\.\d+)?)-/); if (range) return parseFloat(range[1]);
  const upto = s.match(/^(?:UPTO|MAX)(\d+(?:\.\d+)?)$/); if (upto) return parseFloat(upto[1]);
  return Infinity;
}
const titleCase = (s) => (s || '').replace(/\b\w/g, c => c.toUpperCase());

/* ── Editable rate cell (.rcell) — underline, £ lives in the head ─── */
function RateNum({ value, color = 'var(--mv-ink)', weight = 600, onCommit, disabled, createHint }) {
  const [v, setV] = useState(fix2(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { setV(fix2(value)); }, [value]);
  const empty = value == null || value === '';
  if (disabled) return <span className="mv-num" style={{ display: 'block', textAlign: 'right', color: 'var(--mv-ink-45)', fontSize: 12.5, padding: '2px 0' }}>—</span>;
  return (
    <input
      value={v}
      onChange={e => setV(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const t = v.trim();
        if (t === '') { if (!empty) onCommit(null); else setV(''); return; }
        const p = parseFloat(t);
        if (isNaN(p) || p < 0) { setV(fix2(value)); return; }
        setV(p.toFixed(2)); onCommit(p);
      }}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setV(fix2(value)); e.currentTarget.blur(); } }}
      placeholder="—"
      title={empty && createHint ? createHint : undefined}
      className="mv-num"
      style={{
        width: '100%', minWidth: 46, textAlign: 'right', background: 'transparent', outline: 'none',
        border: 'none', borderBottom: `1px ${empty ? 'dashed' : 'solid'} ${focused ? 'var(--mv-purple)' : (empty ? 'var(--mv-hairline-2)' : 'transparent')}`,
        fontFamily: 'var(--mv-font)', fontVariantNumeric: 'tabular-nums', fontSize: 12.5,
        color: empty ? 'var(--mv-ink-45)' : color, fontWeight: empty ? 400 : weight, padding: '2px 0',
      }}
    />
  );
}

/* ── Money / percent field (.mv-money) — £/% outside, underline ─── */
function MoneyField({ value, override, isPct, onSave, placeholder = 'std' }) {
  const has = override != null && override !== '';
  const [v, setV] = useState(has ? fix2(override) : '');
  const [focused, setFocused] = useState(false);
  useEffect(() => { setV(has ? fix2(override) : ''); }, [override]);
  const glyph = isPct ? '%' : '£';
  return (
    <div className="mv-money" style={{ borderBottomColor: focused ? 'var(--mv-purple)' : 'var(--mv-hairline-2)' }}>
      {!isPct && <span>£</span>}
      <input
        value={v}
        onChange={e => setV(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const t = v.trim();
          if (t === '') { if (has) onSave(null); return; }
          const p = parseFloat(t); if (isNaN(p) || p < 0) { setV(has ? fix2(override) : ''); return; }
          setV(p.toFixed(2)); onSave(p);
        }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setV(has ? fix2(override) : ''); e.currentTarget.blur(); } }}
        placeholder={value != null ? fix2(value) : placeholder}
        style={{ color: has ? 'var(--mv-purple)' : 'var(--mv-ink-62)', fontWeight: has ? 700 : 400 }}
      />
      {isPct && <span style={{ marginLeft: 2 }}>%</span>}
    </div>
  );
}

/* ── 0 · Coverage strip ────────────────────────────────────── */
function CoverageStrip({ servicesOn, totalServices, liveCarriers, ratesPriced, ratesQuoted, notPriced }) {
  const kpis = [
    { label: 'Services on', value: `${servicesOn} of ${totalServices}`, sub: `across ${liveCarriers} live carrier${liveCarriers === 1 ? '' : 's'}` },
    { label: 'Rates priced', value: ratesPriced.toLocaleString('en-GB'), sub: ratesQuoted != null ? `of ${ratesQuoted.toLocaleString('en-GB')} quoted` : 'across live services' },
    { label: 'Not yet priced', value: notPriced == null ? '—' : (notPriced === 0 ? 'None' : notPriced.toLocaleString('en-GB')), attention: !!notPriced, sub: notPriced ? 'zones a booking would fall through' : 'every quoted zone is priced' },
    { label: 'Blended margin', value: '—', sub: 'tier target' },
  ];
  return (
    <div className="mv-kpis" style={{ marginBottom: 28 }}>
      {kpis.map(k => (
        <div className="mv-kpi" key={k.label}>
          <div className="mv-kpi-label">{k.label}</div>
          <div className={'mv-kpi-value' + (k.attention ? ' is-attention' : '')} style={{ fontSize: 27 }}>{k.value}</div>
          <div className="mv-kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── 1 · Carrier tiles ─────────────────────────────────────── */
function CarrierTiles({ carriers, customerId }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: ({ courier_id, active }) => active
      ? api.delete(`/customer-carrier-links/${customerId}/${courier_id}`)
      : api.post(`/customer-carrier-links/${customerId}`, { courier_id }),
    onSuccess: () => qc.invalidateQueries(['customer-carrier-links', customerId]),
  });
  if (!carriers.length) return null;
  return (
    <div style={{ marginBottom: 30 }}>
      <div className="mv-section" style={{ marginBottom: 0 }}>Carriers</div>
      <div className="mv-rule" style={{ margin: '10px 0 14px' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {carriers.map(carrier => {
          const on = carrier.active;
          const logo = getCourierLogo(carrier.courier_code);
          const svcCount = carrier.service_count ?? carrier.services_count ?? null;
          const state = on
            ? (svcCount != null ? { text: `${svcCount} service${svcCount === 1 ? '' : 's'}`, color: svcCount > 0 ? 'var(--mv-green-deep)' : 'var(--mv-magenta-deep)' } : { text: 'on', color: 'var(--mv-green-deep)' })
            : ((carrier.available_cards?.length || 0) > 0 ? { text: 'off', color: 'var(--mv-ink-45)' } : { text: 'not configured', color: 'var(--mv-ink-45)' });
          return (
            <button key={carrier.courier_id} onClick={() => toggle.mutate({ courier_id: carrier.courier_id, active: on })}
              title={`${carrier.courier_name} — click to ${on ? 'turn off' : 'turn on'}`}
              style={{
                width: 158, textAlign: 'left', padding: '15px 15px 16px', cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${on ? 'var(--mv-divider)' : 'var(--mv-hairline)'}`, background: on ? 'rgba(32,30,29,.04)' : 'transparent',
              }}>
              <div style={{ width: 104, height: 20, marginBottom: 12, opacity: on ? 1 : 0.34, filter: on ? 'none' : 'grayscale(1)',
                background: logo ? `url(${logo}) left center / contain no-repeat` : 'none' }} />
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-.01em', color: on ? 'var(--mv-ink)' : 'var(--mv-ink-45)' }}>{carrier.courier_name}</div>
              <div className="mv-state-label" style={{ marginTop: 7, color: state.color }}>{state.text}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 2 · Per-carrier config ────────────────────────────────── */
function CarrierAccountRow({ account, customerId }) {
  const qc = useQueryClient();
  const [labelVal, setLabelVal] = useState(account.label || '');
  const [acctVal, setAcctVal] = useState(account.account_number || '');
  async function savePatch(u) { try { await api.patch(`/customer-carrier-links/${customerId}/link/${account.link_id}`, u); qc.invalidateQueries(['customer-carrier-links', customerId]); } catch (e) { console.error(e); } }
  async function removeAccount() { if (!window.confirm('Remove this account?')) return; await api.delete(`/customer-carrier-links/${customerId}/link/${account.link_id}`); qc.invalidateQueries(['customer-carrier-links', customerId]); }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
      <input value={labelVal} onChange={e => setLabelVal(e.target.value)} onBlur={() => { if (labelVal !== (account.label || '')) savePatch({ label: labelVal }); }} placeholder="Label"
        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', fontFamily: 'inherit', fontSize: 12.5, color: 'var(--mv-ink)', padding: '2px 0' }} />
      <input value={acctVal} onChange={e => setAcctVal(e.target.value)} onBlur={() => { if (acctVal !== (account.account_number || '')) savePatch({ account_number: acctVal }); }} placeholder="Account no."
        className="mv-num" style={{ width: 120, textAlign: 'right', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'monospace', fontSize: 12.5, color: 'var(--mv-teal-deep)', padding: '2px 0' }} />
      <button onClick={removeAccount} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', display: 'flex' }}><X size={13} /></button>
    </div>
  );
}

function FuelGroupRow({ fg, customerId }) {
  const qc = useQueryClient();
  const setFuel = useMutation({
    mutationFn: ({ sell_pct }) => sell_pct === null
      ? api.delete(`/customer-carrier-links/${customerId}/fuel/${fg.id}`)
      : api.put(`/customer-carrier-links/${customerId}/fuel/${fg.id}`, { sell_pct }),
    onSuccess: () => qc.invalidateQueries(['customer-carrier-links', customerId]),
  });
  const cell = { padding: '9px 0', borderTop: '1px solid var(--mv-hairline)' };
  return (
    <>
      <div style={{ ...cell, fontSize: 12.5 }}>{fg.name}</div>
      <div style={{ ...cell, textAlign: 'right' }} className="mv-num mv-cell-dim">{fg.standard_sell_pct != null ? `${parseFloat(fg.standard_sell_pct).toFixed(2)}%` : '—'}</div>
      <div style={{ ...cell }}><MoneyField value={fg.standard_sell_pct} override={fg.customer_pct} isPct onSave={(v) => setFuel.mutate({ sell_pct: v })} /></div>
    </>
  );
}

function SurchargeOverrideRow({ surcharge, override, customerId, onChanged }) {
  const qc = useQueryClient();
  const upsert = useMutation({
    mutationFn: (body) => api.post(`/surcharges/customer-overrides/${customerId}`, { surcharge_id: surcharge.id, ...body }),
    onSuccess: () => { qc.invalidateQueries(['surcharge-overrides', customerId]); onChanged?.(); },
  });
  const isPct = surcharge.calc_type === 'percentage';
  const cell = { padding: '9px 0', borderTop: '1px solid var(--mv-hairline)' };
  return (
    <>
      <div style={{ ...cell, fontSize: 12.5 }}>{surcharge.name}{isPct ? <span className="mv-cell-dim"> · percent</span> : ''}</div>
      <div style={{ ...cell }}><MoneyField value={surcharge.cost_price ?? surcharge.default_value} override={override?.cost_price_override ?? null} isPct={isPct} onSave={(v) => upsert.mutate({ cost_price_override: v })} /></div>
      <div style={{ ...cell }}><MoneyField value={surcharge.default_value} override={override?.override_value ?? null} isPct={isPct} onSave={(v) => upsert.mutate({ override_value: v })} /></div>
    </>
  );
}

function PerCarrierBlock({ carrier, customerId, allOverrides, onOverridesChange }) {
  const qc = useQueryClient();
  const [addingAccount, setAddingAccount] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAcctNo, setNewAcctNo] = useState('');
  const logo = getCourierLogo(carrier.courier_code);
  const hasFuel = carrier.fuel_groups?.length > 0;

  const { data: surcharges = [] } = useQuery({
    queryKey: ['surcharges', carrier.courier_id],
    queryFn: () => api.get(`/surcharges?courier_id=${carrier.courier_id}`).then(r => r.data),
    staleTime: 0, refetchOnWindowFocus: true,
  });
  const changeCard = useMutation({
    mutationFn: (cardId) => api.patch(`/customer-carrier-links/${customerId}/${carrier.courier_id}`, { carrier_rate_card_id: cardId }),
    onSuccess: () => qc.invalidateQueries(['customer-carrier-links', customerId]),
  });
  async function addAccount() {
    if (!newAcctNo.trim() && !newLabel.trim()) return;
    await api.post(`/customer-carrier-links/${customerId}`, { courier_id: carrier.courier_id, account_number: newAcctNo.trim() || null, label: newLabel.trim() || null });
    qc.invalidateQueries(['customer-carrier-links', customerId]); setNewLabel(''); setNewAcctNo(''); setAddingAccount(false);
  }

  const cards = carrier.available_cards || [];
  const colhead = { fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)' };
  const colheadR = { ...colhead, textAlign: 'right' };

  return (
    <div style={{ marginBottom: 34 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 78, height: 18, opacity: 1, background: logo ? `url(${logo}) left center / contain no-repeat` : 'none' }} />
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>{carrier.courier_name}</span>
        <span className="mv-state mv-state--settled"><span className="mv-mark mv-mark--settled" /><span className="mv-state-label">On</span></span>
      </div>
      {cards.length > 0 && (
        <div className="mv-chips" style={{ marginTop: 12 }}>
          <span className="mv-filter-label">Rate card</span>
          {cards.map(card => (
            <button key={card.id} className={'mv-chip' + (String(card.id) === String(carrier.active_card_id) ? ' is-on' : '')} onClick={() => changeCard.mutate(card.id)}>{card.name}{card.is_master ? ' · master' : ''}</button>
          ))}
        </div>
      )}
      <div className="mv-rule" style={{ margin: '14px 0 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr 1.3fr', gap: 40, marginTop: 18, alignItems: 'start' }}>
        {/* Accounts */}
        <div>
          <div style={{ ...colhead, marginBottom: 0 }}>Accounts</div>
          {(carrier.accounts || []).map(a => <CarrierAccountRow key={a.link_id} account={a} customerId={customerId} />)}
          {addingAccount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8 }}>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label" autoFocus style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--mv-hairline-2)', outline: 'none', fontFamily: 'inherit', fontSize: 12.5, padding: '2px 0' }} onKeyDown={e => { if (e.key === 'Enter') addAccount(); if (e.key === 'Escape') setAddingAccount(false); }} />
              <input value={newAcctNo} onChange={e => setNewAcctNo(e.target.value)} placeholder="Account no." className="mv-num" style={{ width: 110, textAlign: 'right', background: 'transparent', border: 'none', borderBottom: '1px solid var(--mv-hairline-2)', outline: 'none', fontFamily: 'monospace', fontSize: 12.5, color: 'var(--mv-teal-deep)', padding: '2px 0' }} onKeyDown={e => { if (e.key === 'Enter') addAccount(); if (e.key === 'Escape') setAddingAccount(false); }} />
              <button onClick={addAccount} className="mv-btn mv-btn--sm" style={{ padding: '0 8px' }}><Check size={12} /></button>
            </div>
          ) : (
            <button onClick={() => setAddingAccount(true)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mv-purple)', fontSize: 11.5, fontWeight: 600, padding: '10px 0 0', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}><Plus size={12} /> Add an account</button>
          )}
        </div>

        {/* Fuel groups */}
        <div>
          {hasFuel ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', columnGap: 16 }}>
              <div style={colhead}>Group</div><div style={colheadR}>Standard</div><div style={colheadR}>Theirs</div>
              {carrier.fuel_groups.map(fg => <FuelGroupRow key={fg.id} fg={fg} customerId={customerId} />)}
              <p className="mv-blurb" style={{ gridColumn: '1 / -1', fontSize: 11, marginTop: 10 }}>Blank means they pay the standard rate.</p>
            </div>
          ) : (<><div style={{ ...colhead, marginBottom: 0 }}>Fuel groups</div><p className="mv-blurb" style={{ marginTop: 8 }}>No fuel groups on this carrier.</p></>)}
        </div>

        {/* Surcharge overrides */}
        <div>
          {surcharges.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', columnGap: 16 }}>
              <div style={colhead}>Surcharge</div><div style={colheadR}>Cost</div><div style={colheadR}>Sell</div>
              {surcharges.map(s => <SurchargeOverrideRow key={s.id} surcharge={s} override={allOverrides.find(o => o.surcharge_id === s.id)} customerId={customerId} onChanged={onOverridesChange} />)}
              <p className="mv-blurb" style={{ gridColumn: '1 / -1', fontSize: 11, marginTop: 10 }}>Sell overrides the standard schedule; purple means edited.</p>
            </div>
          ) : (<><div style={{ ...colhead, marginBottom: 0 }}>Surcharge overrides</div><p className="mv-blurb" style={{ marginTop: 8 }}>No surcharges on this carrier.</p></>)}
        </div>
      </div>
    </div>
  );
}

/* ── 3 · Billing modes ─────────────────────────────────────── */
function BillingRow({ title, active, busy, onToggle, sentence, offLabel, onLabel, children }) {
  return (
    <div style={{ padding: '16px 0', borderTop: '1px solid var(--mv-hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800 }}>{title}</span>
            <span className={`mv-state mv-state--${active ? 'settled' : 'waiting'}`}><span className={`mv-mark mv-mark--${active ? 'settled' : 'waiting'}`} /><span className="mv-state-label">{active ? 'On' : 'Off'}</span></span>
          </div>
          <p className="mv-blurb" style={{ margin: '4px 0 0', maxWidth: 640 }}>{sentence}</p>
          <div style={{ marginTop: 8, display: 'flex', gap: 18 }}>
            <span style={{ fontSize: 11.5, color: active ? 'var(--mv-ink-45)' : 'var(--mv-ink)', fontWeight: active ? 400 : 700 }}>{offLabel}</span>
            <span style={{ fontSize: 11.5, color: active ? 'var(--mv-green-deep)' : 'var(--mv-ink-45)', fontWeight: active ? 700 : 400 }}>{onLabel}</span>
          </div>
        </div>
        <div className={'mv-switch' + (active ? ' is-on' : '')} onClick={busy ? undefined : onToggle} style={{ opacity: busy ? 0.5 : 1, flexShrink: 0 }}><span /></div>
      </div>
      {children}
    </div>
  );
}

function BillingModes({ customer }) {
  const qc = useQueryClient();
  const [ddp, setDdp] = useState(!!customer.ddp_mode);
  const [comp, setComp] = useState(!!customer.reconciliation_flexible_parcel_count);
  const [mode, setMode] = useState(customer.parcel_pricing_mode || 'sub');
  const [busy, setBusy] = useState('');
  useEffect(() => { setDdp(!!customer.ddp_mode); }, [customer.ddp_mode]);
  useEffect(() => { setComp(!!customer.reconciliation_flexible_parcel_count); }, [customer.reconciliation_flexible_parcel_count]);
  useEffect(() => { setMode(customer.parcel_pricing_mode || 'sub'); }, [customer.parcel_pricing_mode]);

  const { data: overridesData } = useQuery({ queryKey: ['service-code-overrides', customer.id], queryFn: () => api.get(`/customers/${customer.id}/service-code-overrides`).then(r => r.data) });
  const overrides = overridesData?.overrides || [];

  async function toggleDdp() { const nv = !ddp; setDdp(nv); setBusy('ddp'); try { await api.put(`/customers/${customer.id}/ddp-mode`, { enabled: nv }); qc.invalidateQueries(['customer', customer.id]); qc.invalidateQueries(['service-code-overrides', customer.id]); } catch (e) { setDdp(!nv); } finally { setBusy(''); } }
  async function toggleComp() { const nv = !comp; setComp(nv); setBusy('comp'); try { await api.put(`/customers/${customer.id}/companion-parcel-billing`, { enabled: nv }); qc.invalidateQueries(['customer', customer.id]); } catch (e) { setComp(!nv); } finally { setBusy(''); } }
  async function toggleMode() { const next = mode === 'multi' ? 'sub' : 'multi'; setMode(next); setBusy('mode'); try { await api.put(`/customers/${customer.id}/parcel-pricing-mode`, { mode: next }); qc.invalidateQueries(['customer', customer.id]); } catch (e) { setMode(mode); } finally { setBusy(''); } }

  return (
    <div style={{ marginBottom: 34 }}>
      <div className="mv-section" style={{ marginBottom: 0 }}>How their shipments are billed</div>
      <BillingRow title="DDP mode" active={ddp} busy={busy === 'ddp'} onToggle={toggleDdp}
        sentence="This customer books exclusively on DDP (duty-paid) air services. When on, reconciliation uses DDP rate-card variants instead of standard air rates."
        offLabel="Off — standard air rates" onLabel="On — DDP variants">
        {ddp && overrides.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {overrides.map(ov => (
              <span key={ov.id} className="mv-chip" style={{ cursor: 'default', gap: 6, display: 'inline-flex', alignItems: 'center' }}>
                <span className="mv-cell-dim">{ov.carrier_name}</span><span className="mv-num" style={{ fontFamily: 'monospace' }}>{ov.courier_code} → {ov.service_code}</span>
                <button onClick={async () => { await api.delete(`/customers/${customer.id}/service-code-overrides/${ov.id}`); qc.invalidateQueries(['service-code-overrides', customer.id]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', display: 'flex', padding: 0 }}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </BillingRow>
      <BillingRow title="Companion parcel billing" active={comp} busy={busy === 'comp'} onToggle={toggleComp}
        sentence="This customer books multiple parcels under the same reference on the same day. When on, reconciliation matches companion charges to the master consignment automatically."
        offLabel="Off — match each parcel" onLabel="On — match companions" />
      <BillingRow title="Multi-parcel pricing" active={mode === 'multi'} busy={busy === 'mode'} onToggle={toggleMode}
        sentence={mode === 'multi' ? 'All parcels on a multi-parcel shipment are charged at the sub rate.' : 'Standard: 1st parcel at the main rate, 2nd+ at the sub rate (if set).'}
        offLabel="Off — flat / first+sub" onLabel="On — all at sub rate" />
    </div>
  );
}

/* ── 4 · Service selection ─────────────────────────────────── */
function ServiceSelection({ customerId, activeCourierIds, onOpenService }) {
  const qc = useQueryClient();
  const { data: allServices = [] } = useQuery({ queryKey: ['all-carrier-services'], queryFn: () => api.get('/carriers/services').then(r => r.data) });
  const { data: selected = [] } = useQuery({ queryKey: ['customer-services', customerId], queryFn: () => api.get(`/customers/${customerId}/services`).then(r => r.data) });
  const selectedIds = new Set(selected.map(s => s.courier_service_id));
  const addSvc = useMutation({ mutationFn: (id) => api.post(`/customers/${customerId}/services`, { courier_service_id: id }), onSuccess: () => qc.invalidateQueries(['customer-services', customerId]) });
  const delSvc = useMutation({ mutationFn: (id) => api.delete(`/customers/${customerId}/services/${id}`), onSuccess: () => qc.invalidateQueries(['customer-services', customerId]) });

  const filtered = activeCourierIds.size > 0 ? allServices.filter(s => activeCourierIds.has(s.courier_id)) : allServices;
  const byCourier = {};
  for (const s of filtered) { const cn = s.courier_name || 'Unknown'; if (!byCourier[cn]) byCourier[cn] = { code: s.courier_code, services: [] }; byCourier[cn].services.push(s); }
  const couriers = Object.entries(byCourier);
  if (!couriers.length) return null;

  return (
    <div style={{ marginBottom: 34 }}>
      <div className="mv-section" style={{ marginBottom: 0 }}>Service selection</div>
      <div className="mv-rule" style={{ margin: '10px 0 0' }} />
      {couriers.map(([name, { code, services }]) => {
        const count = services.filter(s => selectedIds.has(s.id)).length;
        return (
          <div key={name} style={{ padding: '16px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 60, height: 16, background: getCourierLogo(code) ? `url(${getCourierLogo(code)}) left center / contain no-repeat` : 'none' }} />
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>{name}</span>
              <span className="mv-num" style={{ fontSize: 11.5, color: count ? 'var(--mv-green-deep)' : 'var(--mv-ink-45)' }}>{count}/{services.length}</span>
              <span style={{ flex: 1 }} />
              <button className="mv-chip" onClick={() => services.forEach(s => { if (!selectedIds.has(s.id)) addSvc.mutate(s.id); })}>All</button>
              <button className="mv-chip" onClick={() => services.forEach(s => { if (selectedIds.has(s.id)) delSvc.mutate(s.id); })}>None</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 40px' }}>
              {services.map(svc => {
                const on = selectedIds.has(svc.id);
                return (
                  <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => on ? delSvc.mutate(svc.id) : addSvc.mutate(svc.id)} title={on ? 'Remove' : 'Add'}
                      style={{ width: 15, height: 15, flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${on ? 'var(--mv-purple)' : 'var(--mv-hairline-2)'}`, background: on ? 'var(--mv-purple)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      {on && <Check size={10} color="#fff" strokeWidth={3} />}
                    </button>
                    <button onClick={() => onOpenService(svc.service_code)} style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: on ? 'var(--mv-ink)' : 'var(--mv-ink-62)', fontWeight: on ? 600 : 400, flex: 1, textAlign: 'left', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.name}</button>
                    <span className="mv-num mv-cell-dim" style={{ fontSize: 11 }}>{svc.service_code}</span>
                    {svc.service_type === 'international' && <span className="mv-state-label" style={{ color: 'var(--mv-teal-deep)', border: '1px solid var(--mv-hairline-2)', padding: '1px 5px' }}>INTL</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 5 · Rate cards (accordion, one open) ──────────────────── */
function CoverageBar({ pct }) {
  const colour = pct >= 100 ? 'var(--mv-green)' : pct > 85 ? 'var(--mv-purple)' : 'var(--mv-magenta)';
  return <div style={{ width: 74, height: 3, background: 'rgba(32,30,29,.13)', flexShrink: 0 }}><div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: colour }} /></div>;
}

function DomesticBody({ service, customerId, templateZones, templateLoading, onRateUpdate, onPerKgUpdate, onRateCreated }) {
  const [markup, setMarkup] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const qc = useQueryClient();

  const rateMap = {}; const rateByZone = {};
  for (const r of service.rates) { rateMap[`${r.zone_name}::${r.weight_class_name}`] = r; if (!rateByZone[r.zone_name]) rateByZone[r.zone_name] = r; }
  const source = templateZones.length ? templateZones : service.rates.map(r => ({ zone_name: r.zone_name, weight_class_name: r.weight_class_name }));
  const zones = [...new Set(source.map(z => z.zone_name))];
  const bands = [...new Set(source.map(z => z.weight_class_name))].sort((a, b) => wcSortKey(a) - wcSortKey(b));
  const multiWeight = bands.length > 1;

  async function applyMarkup() {
    const pct = parseFloat(markup);
    if (isNaN(pct) || pct < 0) return;
    setApplying(true); setApplyResult(null);
    try {
      const res = await api.post(`/customer-rates/${customerId}/apply-markup`, {
        service_code: service.service_code, service_id: service.service_id, service_name: service.service_name,
        courier_id: service.courier_id || 0, courier_code: service.courier_code || '', courier_name: service.courier_name || '',
        carrier_rate_card_id: service.active_card_id || service.carrier_rate_card_id, markup_pct: pct,
      });
      setApplyResult({ n: res.data.inserted }); qc.invalidateQueries(['customer-rates', customerId]); onRateCreated?.();
    } catch (e) { setApplyResult({ error: e.response?.data?.error || 'Failed to apply markup' }); }
    finally { setApplying(false); }
  }

  const createRate = async (zone, band, price) => {
    await api.post(`/customer-rates/${customerId}`, {
      courier_id: service.courier_id || 0, courier_code: service.courier_code || '', courier_name: service.courier_name || '',
      service_id: service.service_id, service_code: service.service_code, service_name: service.service_name,
      zone_name: zone, weight_class_name: band, price,
    });
    onRateCreated?.();
  };

  const colheadBand = { fontSize: 10, fontWeight: 600, textAlign: 'left', paddingBottom: 4, borderLeft: '1px solid var(--mv-hairline)', paddingLeft: 12 };
  const tierHead = { fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', textAlign: 'right', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)', paddingLeft: 10, whiteSpace: 'nowrap' };

  return (
    <div style={{ paddingTop: 4 }}>
      {/* markup bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="mv-kpi-label" style={{ marginBottom: 0 }}>Markup on carrier cost</span>
        <div className="mv-money" style={{ width: 90 }}><input value={markup} onChange={e => { setMarkup(e.target.value); setApplyResult(null); }} onKeyDown={e => { if (e.key === 'Enter') applyMarkup(); }} placeholder="30" style={{ textAlign: 'right', color: 'var(--mv-purple)', fontWeight: 700 }} /><span>%</span></div>
        <button className="mv-btn mv-btn--sm mv-btn--primary" onClick={applyMarkup} disabled={applying || !markup}>{applying ? 'Applying…' : 'Apply to every zone'}</button>
        {applyResult?.n != null && <span className="mv-state-label" style={{ color: 'var(--mv-green-deep)' }}>{applyResult.n} rates rewritten at {markup}% over cost</span>}
        {applyResult?.error && <span className="mv-state-label" style={{ color: 'var(--mv-magenta-deep)' }}>{applyResult.error}</span>}
      </div>
      {/* legend */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
        <span className="mv-state-label" style={{ display: 'inline-flex', alignItems: 'center' }}><span style={{ width: 7, height: 7, background: 'var(--mv-ink)', display: 'inline-block', marginRight: 5 }} />1st parcel</span>
        <span className="mv-state-label" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--mv-ink-45)' }}><span style={{ width: 7, height: 7, background: 'var(--mv-ink-45)', display: 'inline-block', marginRight: 5 }} />2nd onward</span>
        <span className="mv-state-label" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--mv-teal-deep)' }}><span style={{ width: 7, height: 7, background: 'var(--mv-teal)', display: 'inline-block', marginRight: 5 }} />per kg over top band</span>
      </div>

      {templateLoading ? <div className="mv-blurb">Loading zones…</div> : zones.length === 0 ? <div className="mv-blurb">No zone template for this service.</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ textAlign: 'left', verticalAlign: 'bottom', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)', paddingRight: 16 }}>Zone</th>
                {bands.map(b => <th key={b} colSpan={3} style={colheadBand}>{b}</th>)}
              </tr>
              <tr>
                {bands.map(b => ([
                  <th key={b + '1'} style={{ ...tierHead, borderLeft: '1px solid var(--mv-hairline)' }}>1st £</th>,
                  <th key={b + '2'} style={tierHead}>2+ £</th>,
                  <th key={b + 'k'} style={tierHead}>£/kg</th>,
                ]))}
              </tr>
            </thead>
            <tbody>
              {zones.map(zone => (
                <tr key={zone} style={{ borderBottom: '1px solid var(--mv-hairline)' }}>
                  <td className="mv-cell-strong" style={{ padding: '10px 16px 10px 0', whiteSpace: 'nowrap' }}>{zone}</td>
                  {bands.map(b => {
                    const rate = rateMap[`${zone}::${b}`] || (!multiWeight ? rateByZone[zone] : null);
                    const first = { borderLeft: '1px solid var(--mv-hairline)', paddingLeft: 12, padding: '8px 0 8px 12px' };
                    const rest = { padding: '8px 0 8px 10px' };
                    return ([
                      <td key={b + '1'} style={first}>
                        {rate
                          ? <RateNum value={rate.price} color="var(--mv-ink)" weight={600} onCommit={(v) => v != null && onRateUpdate(rate.id, v)} />
                          : <RateNum value={null} createHint="Type to price this zone" onCommit={(v) => v != null && createRate(zone, b, v)} />}
                      </td>,
                      <td key={b + '2'} style={rest}>
                        {rate ? <RateNum value={rate.price_sub} color="var(--mv-ink-62)" weight={400} onCommit={(v) => onRateUpdate(rate.id, v, true)} /> : <RateNum value={null} disabled />}
                      </td>,
                      <td key={b + 'k'} style={rest}>
                        {rate ? <RateNum value={rate.per_kg_rate} color="var(--mv-teal-deep)" weight={600} onCommit={(v) => onPerKgUpdate(rate.id, v)} /> : <RateNum value={null} disabled />}
                      </td>,
                    ]);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mv-blurb" style={{ fontSize: 11, marginTop: 12 }}>Type in any cell to set a price. Dashed cells are zones the carrier quotes and we have not priced — a booking there falls through to manual.</p>
    </div>
  );
}

function InternationalBody({ service, customerId, onRateUpdate, onPerKgUpdate }) {
  const [searchText, setSearchText] = useState('');
  const [parsed, setParsed] = useState({ weightKg: null, zoneTerm: null });
  const searchRef = useRef(null);
  useEffect(() => { const t = setTimeout(() => { if (searchText.trim()) setParsed(parseNLQuery(searchText)); else setParsed({ weightKg: null, zoneTerm: null }); }, 200); return () => clearTimeout(t); }, [searchText]);

  const rates = service.rates || [];
  const totalZones = [...new Set(rates.map(r => r.zone_name))].length;
  const hasSearch = searchText.trim().length > 0;
  function isMatch(rate) {
    if (!hasSearch) return false;
    const { weightKg, zoneTerm } = parsed;
    const zoneOk = zoneTerm ? rate.zone_name.toLowerCase().includes(zoneTerm) : true;
    const weightOk = weightKg != null ? weightClassCoversKg(rate.weight_class_name, weightKg) : true;
    if (zoneTerm && weightKg != null) return zoneOk && weightOk;
    if (zoneTerm) return zoneOk;
    if (weightKg != null) return weightOk;
    return false;
  }
  const matched = hasSearch ? rates.filter(isMatch) : rates;
  const exact = hasSearch && matched.length === 1 ? matched[0] : null;
  const shown = matched.slice(0, 14);

  return (
    <div style={{ paddingTop: 4 }}>
      <p className="mv-blurb" style={{ marginTop: 0 }}>This service quotes {rates.length.toLocaleString('en-GB')} rates across {totalZones} destinations. Search for the one you need rather than scrolling for it.</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 30, margin: '14px 0 18px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: 280 }}>
          <div className="mv-search" style={{ width: '100%', height: 36 }}>
            <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
            <input ref={searchRef} value={searchText} onChange={e => setSearchText(e.target.value)} placeholder={'e.g. "1kg to Jamaica"'} />
            {searchText && <button onClick={() => setSearchText('')} className="mv-search-clear" title="Clear search"><X size={13} /></button>}
          </div>
          {hasSearch && (parsed.zoneTerm || parsed.weightKg != null) && (
            <div className="mv-kpi-label" style={{ marginTop: 8 }}>{parsed.zoneTerm ? `Destination ${titleCase(parsed.zoneTerm)}` : ''}{parsed.zoneTerm && parsed.weightKg != null ? ' · ' : ''}{parsed.weightKg != null ? `Weight ${parsed.weightKg} kg` : ''}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', minWidth: 200 }}>
          {!hasSearch && <div><div className="mv-num" style={{ fontWeight: 800, fontSize: 24 }}>{rates.length.toLocaleString('en-GB')}</div><div className="mv-kpi-label">rates on this service</div></div>}
          {hasSearch && matched.length === 0 && <div><div style={{ fontWeight: 800, fontSize: 22, color: 'var(--mv-magenta-deep)' }}>None</div><div className="mv-kpi-label">try a country name on its own</div></div>}
          {exact && (
            <div>
              <div className="mv-kicker">{titleCase(exact.zone_name)} · {exact.weight_class_name}</div>
              {exact.price != null
                ? <><div className="mv-num" style={{ fontWeight: 800, fontSize: 38, color: 'var(--mv-green-deep)', lineHeight: 1 }}>{gbp(exact.price)}</div><div className="mv-kpi-label" style={{ marginTop: 4 }}>first parcel · edit it below</div></>
                : <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--mv-magenta-deep)' }}>Not priced</div>}
            </div>
          )}
        </div>
      </div>

      {(hasSearch ? matched.length > 0 : rates.length > 0) && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)' }}>Destination</th>
                <th style={{ textAlign: 'left', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)' }}>Weight class</th>
                <th style={{ textAlign: 'right', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)' }}>1st £</th>
                <th style={{ textAlign: 'right', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)' }}>2+ £</th>
                <th style={{ textAlign: 'right', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', paddingBottom: 8, borderBottom: '2px solid var(--mv-divider)' }}>£/kg</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(rate => (
                <tr key={rate.id} style={{ borderBottom: '1px solid var(--mv-hairline)' }}>
                  <td className="mv-cell-strong" style={{ padding: '9px 12px 9px 0' }}>{rate.zone_name}</td>
                  <td className="mv-cell-dim" style={{ padding: '9px 12px 9px 0' }}>{rate.weight_class_name}</td>
                  <td style={{ padding: '9px 0 9px 10px' }}><RateNum value={rate.price} color="var(--mv-ink)" weight={600} onCommit={(v) => v != null && onRateUpdate(rate.id, v)} /></td>
                  <td style={{ padding: '9px 0 9px 10px' }}><RateNum value={rate.price_sub} color="var(--mv-ink-62)" weight={400} onCommit={(v) => onRateUpdate(rate.id, v, true)} /></td>
                  <td style={{ padding: '9px 0 9px 10px' }}><RateNum value={rate.per_kg_rate} color="var(--mv-teal-deep)" weight={600} onCommit={(v) => onPerKgUpdate(rate.id, v)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!hasSearch && rates.length > 14 && <p className="mv-blurb" style={{ fontSize: 11, marginTop: 10 }}>Showing the first 14 of {rates.length.toLocaleString('en-GB')} rates. Search to jump to one.</p>}
        </div>
      )}
    </div>
  );
}

function RateCardService({ service, customerId, openCode, setOpenCode, onRateUpdate, onPerKgUpdate, onRateCreated }) {
  const isIntl = service.service_type === 'international';
  const open = openCode === service.service_code;

  const { data: templateZones = [], isLoading: templateLoading } = useQuery({
    queryKey: ['rate-zone-template', service.service_code],
    queryFn: () => api.get(`/customer-rates/zones/${encodeURIComponent(service.service_code)}`).then(r => r.data),
    enabled: open && !isIntl, staleTime: 120_000,
  });

  const priced = service.rates.length;
  const quoted = isIntl ? service.rate_count : (templateZones.length || service.rate_count || priced);
  const pct = quoted > 0 ? Math.round((priced / quoted) * 100) : (priced > 0 ? 100 : 0);
  const zoneCount = isIntl ? [...new Set(service.rates.map(r => r.zone_name))].length : (templateZones.length ? [...new Set(templateZones.map(z => z.zone_name))].length : [...new Set(service.rates.map(r => r.zone_name))].length);
  const bandCount = [...new Set((templateZones.length ? templateZones : service.rates).map(z => z.weight_class_name))].length;
  const flat = !isIntl && bandCount <= 1;

  return (
    <div style={{ borderTop: '1px solid var(--mv-hairline)' }}>
      <div onClick={() => setOpenCode(open ? null : service.service_code)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', cursor: 'pointer' }}>
        {open ? <ChevronDown size={13} style={{ flexShrink: 0, color: 'var(--mv-purple)' }} /> : <ChevronRight size={13} style={{ flexShrink: 0, color: 'var(--mv-ink-45)' }} />}
        <span style={{ fontWeight: 800, fontSize: 13.5, color: open ? 'var(--mv-purple)' : 'var(--mv-ink)', flexShrink: 0 }}>{service.service_name}</span>
        {isIntl ? <span className="mv-state-label" style={{ color: 'var(--mv-teal-deep)', border: '1px solid var(--mv-hairline-2)', padding: '1px 5px', flexShrink: 0 }}>INTL</span>
          : flat ? <span className="mv-state-label" style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }}>Flat fee</span> : null}
        <span className="mv-cell-dim" style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zoneCount} zone{zoneCount === 1 ? '' : 's'} · {bandCount} weight class{bandCount === 1 ? '' : 'es'}</span>
        <CoverageBar pct={pct} />
        <span className="mv-num" style={{ fontSize: 11.5, color: pct >= 100 ? 'var(--mv-green-deep)' : pct > 85 ? 'var(--mv-purple)' : 'var(--mv-magenta-deep)', flexShrink: 0 }}>{priced}/{quoted || priced}</span>
        <span className="mv-num mv-cell-dim pc-code" style={{ fontSize: 11, flexShrink: 0 }}>{service.service_code}</span>
      </div>
      {open && (
        <div style={{ padding: '4px 0 20px 23px' }}>
          {isIntl
            ? <InternationalBody service={service} customerId={customerId} onRateUpdate={onRateUpdate} onPerKgUpdate={onPerKgUpdate} />
            : <DomesticBody service={service} customerId={customerId} templateZones={templateZones} templateLoading={templateLoading} onRateUpdate={onRateUpdate} onPerKgUpdate={onPerKgUpdate} onRateCreated={onRateCreated} />}
        </div>
      )}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export default function CustomerPricingTab({ customer }) {
  const qc = useQueryClient();
  const [openCode, setOpenCode] = useState(null);

  const { data: carriers = [] } = useQuery({ queryKey: ['customer-carrier-links', customer.id], queryFn: () => api.get(`/customer-carrier-links/${customer.id}`).then(r => r.data) });
  const { data: surchargeOverrides = [] } = useQuery({ queryKey: ['surcharge-overrides', customer.id], queryFn: () => api.get(`/surcharges/customer-overrides/${customer.id}`).then(r => r.data) });
  const { data: rateData, isLoading: ratesLoading } = useQuery({ queryKey: ['customer-rates', customer.id], queryFn: () => api.get(`/customer-rates/${customer.id}`).then(r => r.data) });
  const { data: selectedServices = [] } = useQuery({ queryKey: ['customer-services', customer.id], queryFn: () => api.get(`/customers/${customer.id}/services`).then(r => r.data) });
  const { data: allCarrierServices = [] } = useQuery({ queryKey: ['all-carrier-services'], queryFn: () => api.get('/carriers/services').then(r => r.data) });

  const activeCarriers = carriers.filter(c => c.active);
  const activeCourierIds = new Set(activeCarriers.map(c => c.courier_id));
  const activeCourierCodes = new Set(activeCarriers.map(c => c.courier_code));
  const selectedCodes = new Set(selectedServices.map(s => s.service_code).filter(Boolean));
  const allServicesMeta = Object.fromEntries(allCarrierServices.map(s => [s.service_code, s]));
  const rateServiceMap = Object.fromEntries((rateData?.services || []).map(s => [s.service_code, s]));

  let visibleServices;
  if (selectedCodes.size > 0) {
    visibleServices = selectedServices.filter(s => { const meta = allServicesMeta[s.service_code]; if (!meta) return false; return activeCourierIds.size === 0 || activeCourierIds.has(meta.courier_id); })
      .map(s => rateServiceMap[s.service_code] || (() => { const meta = allServicesMeta[s.service_code]; const carrier = activeCarriers.find(c => c.courier_id === meta?.courier_id); return { service_id: s.courier_service_id, service_code: s.service_code, service_name: meta?.name || s.service_code, courier_id: meta?.courier_id || 0, courier_code: carrier?.courier_code || '', courier_name: meta?.courier_name || carrier?.courier_name || '', service_type: meta?.service_type || 'domestic', rate_count: 0, rates: [], active_card_id: carrier?.active_card_id }; })());
  } else if (selectedServices.length > 0) {
    visibleServices = [];
  } else {
    visibleServices = (rateData?.services || []).filter(s => activeCourierCodes.size === 0 || activeCourierCodes.has(s.courier_code));
  }
  // attach active_card_id per service for markup
  const cardByCode = Object.fromEntries(activeCarriers.filter(c => c.active_card_id).map(c => [c.courier_code, c.active_card_id]));
  visibleServices = visibleServices.map(s => ({ ...s, active_card_id: s.active_card_id || cardByCode[s.courier_code] }));

  const byCourier = {};
  for (const s of visibleServices) { if (!byCourier[s.courier_name]) byCourier[s.courier_name] = []; byCourier[s.courier_name].push(s); }

  const visibleRates = visibleServices.reduce((a, s) => a + (s.rate_count || 0), 0);
  const totalServices = (activeCourierIds.size > 0 ? allCarrierServices.filter(s => activeCourierIds.has(s.courier_id)) : allCarrierServices).length;

  async function handlePriceUpdate(rateId, price, isSub = false) {
    if (isSub) await api.patch(`/customer-rates/rate/${rateId}`, { price_sub: price });
    else await api.patch(`/customer-rates/rate/${rateId}`, { price });
    qc.invalidateQueries(['customer-rates', customer.id]);
  }
  async function handlePerKgUpdate(rateId, perKgRate) { await api.patch(`/customer-rates/rate/${rateId}`, { per_kg_rate: perKgRate }); qc.invalidateQueries(['customer-rates', customer.id]); }
  const refreshRates = () => qc.invalidateQueries(['customer-rates', customer.id]);

  return (
    <div className="mv-pricing">
      <style>{`@media (max-width: 1180px){.mv-pricing .pc-code{display:none}}`}</style>

      <CoverageStrip servicesOn={selectedCodes.size > 0 ? selectedCodes.size : visibleServices.length} totalServices={totalServices} liveCarriers={activeCarriers.length} ratesPriced={visibleServices.reduce((a, s) => a + (s.rates?.length || 0), 0)} ratesQuoted={null} notPriced={null} />

      <CarrierTiles carriers={carriers} customerId={customer.id} />

      {activeCarriers.map(carrier => (
        <PerCarrierBlock key={carrier.courier_id} carrier={carrier} customerId={customer.id} allOverrides={surchargeOverrides} onOverridesChange={() => qc.invalidateQueries(['surcharge-overrides', customer.id])} />
      ))}

      <BillingModes customer={customer} />

      <ServiceSelection customerId={customer.id} activeCourierIds={activeCourierIds} onOpenService={setOpenCode} />

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="mv-section" style={{ marginBottom: 0 }}>Rate cards</div>
          <span className="mv-num" style={{ fontSize: 11.5, color: 'var(--mv-ink-52)' }}>{visibleServices.length} service{visibleServices.length === 1 ? '' : 's'}{visibleRates > 0 ? ` · ${visibleRates.toLocaleString('en-GB')} rates` : ''}</span>
        </div>
        <div className="mv-rule" style={{ margin: '10px 0 0' }} />
        {ratesLoading && <div className="mv-blurb" style={{ marginTop: 12 }}>Loading rates…</div>}
        {!ratesLoading && visibleServices.length === 0 && <div className="mv-blurb" style={{ marginTop: 12 }}>No services selected — choose services above to price them.</div>}
        {Object.entries(byCourier).map(([courierName, svcs]) => {
          const on = svcs.filter(s => (s.rates?.length || 0) > 0).length;
          const liveCard = activeCarriers.find(c => c.courier_name === courierName)?.available_cards?.find(cc => String(cc.id) === String(activeCarriers.find(c => c.courier_name === courierName)?.active_card_id));
          return (
            <div key={courierName} style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 13.5 }}>{courierName}</span>
                <span className="mv-cell-dim" style={{ fontSize: 11.5 }}>{on} of {svcs.length} service{svcs.length === 1 ? '' : 's'} on{liveCard ? ` · ${liveCard.name}` : ''}</span>
              </div>
              <div style={{ marginTop: 6 }}>
                {svcs.map(svc => (
                  <RateCardService key={svc.service_code} service={svc} customerId={customer.id} openCode={openCode} setOpenCode={setOpenCode} onRateUpdate={handlePriceUpdate} onPerKgUpdate={handlePerKgUpdate} onRateCreated={refreshRates} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
