/**
 * RateCardEditor — Full-page rate card editing view.
 * Route: /pricing/rate-card/:id
 *
 * Shows:
 *  - Domestic rate table (cost price read-only, sell price editable, markup % live)
 *  - International markup % field
 *  - Fuel markup %
 *  - Volume mix + weekly projections
 *  - Submit for approval
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Send, RefreshCw, Plus, Trash2, Check, X, AlertCircle,
  ChevronDown, ChevronRight, FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ─── API ──────────────────────────────────────────────────────────────────────

const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const api = {
  getRateCard:    (id)     => apiFetch(`/api/pricing/rate-cards-detail/${id}`),
  updateRateCard: (id, b)  => apiFetch(`/api/pricing/rate-cards/${id}`, { method: 'PUT', body: b }),
  submitApproval: (id, b)  => apiFetch(`/api/pricing/rate-cards/${id}/submit-for-approval`, { method: 'POST', body: b }),
  getProspect:    (id)     => apiFetch(`/api/pricing/prospects/${id}`),
  staffList:      ()       => apiFetch('/api/staff'),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const gbp  = (n) => n == null ? '—' : `£${parseFloat(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num  = (v) => v === '' || v == null ? null : parseFloat(v);

function markupPct(sell, cost) {
  if (!sell || !cost || parseFloat(cost) === 0) return null;
  return ((parseFloat(sell) - parseFloat(cost)) / parseFloat(cost)) * 100;
}

function MarkupChip({ sell, cost }) {
  const mu = markupPct(sell, cost);
  if (mu == null) return <span style={{ color: 'var(--mv-ink-62)', fontSize: 12 }}>—</span>;
  const color = mu < 0 ? 'var(--mv-magenta)' : mu < 15 ? 'var(--mv-amber-deep)' : 'var(--mv-green)';
  return <span style={{ fontSize: 12, color, fontWeight: 700 }}>{mu.toFixed(1)}%</span>;
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'color-mix(in srgb, var(--mv-ink) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
  borderRadius: 6, padding: '5px 9px', color: 'var(--mv-ink)', fontSize: 12, outline: 'none',
};

const STATUS_COLOR = {
  draft:            'var(--mv-ink-52)',
  pending_approval: 'var(--mv-amber-deep)',
  approved:         'var(--mv-teal)',
  rejected:         'var(--mv-magenta)',
  sent:             'var(--mv-purple)',
};

const STATUS_LABEL = {
  draft:            'Draft',
  pending_approval: 'Pending Approval',
  approved:         'Approved',
  rejected:         'Rejected',
  sent:             'Sent',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RateCardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [rates, setRates] = useState([]);
  const [intlMarkup, setIntlMarkup] = useState('');
  const [fuelMarkup, setFuelMarkup] = useState('');
  const [surchargeMarkups, setSurchargeMarkups] = useState([]);
  const [weeklyParcels, setWeeklyParcels] = useState('');
  const [dirty, setDirty] = useState(false);
  const [submitStaff, setSubmitStaff] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [openSvcs,     setOpenSvcs]     = useState(new Set());
  const [openIntlSvcs, setOpenIntlSvcs] = useState(new Set());
  const [domesticPct,  setDomesticPct]  = useState(95);

  const { data: rc, isLoading, error } = useQuery({
    queryKey: ['rate-card-detail', id],
    queryFn: () => apiFetch(`/api/pricing/rate-card/${id}`),
  });

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: api.staffList });

  // International averages — learns as more shipments arrive via webhook
  const { data: intlAvg } = useQuery({
    queryKey: ['intl-averages', rc?.courier_code],
    queryFn: () => apiFetch(`/api/pricing/intl-averages?courier_code=${encodeURIComponent(rc.courier_code)}`),
    enabled: !!rc?.courier_code,
    staleTime: 5 * 60 * 1000,
  });

  // Initialise local state when rate card loads
  useEffect(() => {
    if (!rc) return;
    setRates((rc.rates || []).map(r => ({ ...r })));
    setIntlMarkup(rc.intl_markup_pct ?? '');
    setFuelMarkup(rc.fuel_markup_pct ?? '');
    setSurchargeMarkups((rc.surcharge_markups || []).map(s => ({ ...s })));
    setWeeklyParcels(rc.weekly_parcels ?? '');
    setDomesticPct(rc.domestic_pct ?? 95);
    setDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rc?.id]);

  const updateMut = useMutation({
    mutationFn: () => api.updateRateCard(id, {
      rates,
      surcharge_markups: surchargeMarkups,
      intl_markup_pct:   num(intlMarkup),
      fuel_markup_pct:   num(fuelMarkup),
      weekly_parcels:    weeklyParcels ? parseInt(weeklyParcels) : null,
      domestic_pct:      domesticPct,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rate-card-detail', id] });
      setDirty(false);
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 2500);
    },
  });

  const submitMut = useMutation({
    mutationFn: () => api.submitApproval(id, { requested_by: submitStaff }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rate-card-detail', id] });
      qc.invalidateQueries({ queryKey: ['pricing-prospects'] });
      setShowSubmit(false);
    },
  });

  const markDirty = () => setDirty(true);

  // ── Rate row helpers ──────────────────────────────────────────────────────

  const updateRate = (idx, field, value) => {
    setRates(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    markDirty();
  };

  const addDomesticRow = () => {
    setRates(prev => [...prev, { service_code: '', service_name: '', zone_name: '', price: '', price_sub: '', cost_price: null, is_international: false }]);
    markDirty();
  };

  const addIntlRow = () => {
    setRates(prev => [...prev, { service_code: '', service_name: '', zone_name: '', price: '', price_sub: '', cost_price: null, is_international: true }]);
    markDirty();
  };

  const removeRow = (idx) => {
    setRates(prev => prev.filter((_, i) => i !== idx));
    markDirty();
  };

  // Apply markup % to a single zone → auto-set sell price
  const applyMarkupToRate = (idx, pct) => {
    setRates(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const cost = parseFloat(r.cost_price);
      const mkp  = parseFloat(pct);
      const newPrice = (!isNaN(cost) && !isNaN(mkp)) ? (cost * (1 + mkp / 100)).toFixed(2) : r.price;
      return { ...r, markup_pct: pct, price: newPrice };
    }));
    markDirty();
  };

  // Apply global intl markup % to every international zone
  const applyGlobalIntlMarkup = () => {
    const pct = parseFloat(intlMarkup);
    if (isNaN(pct)) return;
    setRates(prev => prev.map(r => {
      if (!r.is_international) return r;
      const cost = parseFloat(r.cost_price);
      const newPrice = !isNaN(cost) ? (cost * (1 + pct / 100)).toFixed(2) : r.price;
      return { ...r, markup_pct: pct, price: newPrice };
    }));
    markDirty();
  };

  const toggleSvc     = (k) => setOpenSvcs(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleIntlSvc = (k) => setOpenIntlSvcs(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const domesticRates = rates.filter(r => !r.is_international);
  const intlRates     = rates.filter(r => r.is_international);

  const groupByCode = (rows) => Object.values(rows.reduce((acc, r) => {
    const k = r.service_code || r.service_name || '?';
    if (!acc[k]) acc[k] = { service_code: r.service_code, service_name: r.service_name, zones: [] };
    acc[k].zones.push(r);
    return acc;
  }, {}));
  const domesticServices = groupByCode(domesticRates);
  const intlServices     = groupByCode(intlRates);

  // ── Projections ───────────────────────────────────────────────────────────
  // Domestic/international split (slider, default 95% domestic).
  // Domestic: weighted average margin from rates already entered in this rate card.
  //   - 80% weight on the primary mainland Next Day service margin
  //   - 20% weight on the average margin of all other domestic rates
  //   Applied to the primary rate's carrier cost price to get projected sell.
  // International: average revenue/cost per parcel from actual charges (learns over time).

  const [showDebug, setShowDebug] = useState(false);

  // Find the primary mainland domestic rate.
  // Priority: known primary service codes → Mainland zone → lowest numbered zone.
  const PRIMARY_CODES = ['DPD-12', 'DHLPCUK-220', 'UPS-EXPRESS', 'FEDEX-IE', 'RM-24', 'YODEL-24'];
  const isMainland = (z) => !z || /mainland/i.test(z) || /^zone\s*1$/i.test(z) || /^zone\s*a$/i.test(z);
  const pickMainland = (code) => {
    const rows = domesticRates.filter(r => r.service_code === code);
    if (!rows.length) return null;
    return rows.find(r => isMainland(r.zone_name))
      || rows.slice().sort((a, b) => {
           const na = parseInt((a.zone_name || '').match(/\d+/)?.[0] ?? '9999');
           const nb = parseInt((b.zone_name || '').match(/\d+/)?.[0] ?? '9999');
           return na - nb;
         })[0];
  };
  const primaryRate = (() => {
    for (const code of PRIMARY_CODES) {
      const r = pickMainland(code);
      if (r) return r;
    }
    const firstCode = [...new Set(domesticRates.map(r => r.service_code).filter(Boolean))].sort()[0];
    return firstCode ? pickMainland(firstCode) : null;
  })();

  // Margin % for a single rate row: (sell - cost) / sell × 100
  const marginOf = (r) => {
    const sell = parseFloat(r.price);
    const cost = parseFloat(r.cost_price);
    return sell > 0 && cost != null ? (sell - cost) / sell * 100 : null;
  };

  const projections = (() => {
    if (!weeklyParcels || !primaryRate?.cost_price) return null;
    const total       = parseInt(weeklyParcels);
    const domParcels  = Math.round(total * domesticPct / 100);
    const intlParcels = total - domParcels;

    // ── Weighted margin from rate card prices ─────────────────────────────
    // Group by service_code — one mainland-representative row per service type.
    // This prevents zone variants (Highlands, Islands, Saturday, etc.) from
    // diluting the average with their low/negative margins.
    const serviceCodes = [...new Set(domesticRates.map(r => r.service_code).filter(Boolean))];
    const serviceMargins = serviceCodes
      .map(code => {
        const rep = pickMainland(code);
        return rep && parseFloat(rep.price) > 0 && parseFloat(rep.cost_price) > 0
          ? { code, margin: marginOf(rep) }
          : null;
      })
      .filter(Boolean);

    const mainlandMargin = marginOf(primaryRate);

    // Compare service types (Next Day vs 10:30 vs Saturday) — not 8 zone variants each
    const otherServiceMargins = serviceMargins.filter(s => s.code !== primaryRate?.service_code);
    const otherAvgMargin = otherServiceMargins.length > 0
      ? otherServiceMargins.reduce((s, m) => s + m.margin, 0) / otherServiceMargins.length
      : mainlandMargin ?? 20; // fallback if only one service type

    // If primary rate has no sell price yet, fall back to other services' average
    const weightedMargin = mainlandMargin != null
      ? 0.80 * mainlandMargin + 0.20 * otherAvgMargin
      : otherAvgMargin;

    // ── Domestic leg ──────────────────────────────────────────────────────
    const domCostRate = parseFloat(primaryRate.cost_price);
    const domSellEntered = parseFloat(primaryRate.price);
    // Use the actual sell price from the rate card if set; only fall back to
    // deriving from weighted margin if no sell price has been entered yet.
    const domSellRate = domSellEntered > 0
      ? domSellEntered
      : (weightedMargin < 99 ? domCostRate / (1 - weightedMargin / 100) : domCostRate * 2);
    const domRev    = domSellRate * domParcels;
    const domCost   = domCostRate * domParcels;
    const domProfit = domRev - domCost;

    // ── International leg ─────────────────────────────────────────────────
    const avgSell    = parseFloat(intlAvg?.avg_sell  || 0);
    const avgCost    = parseFloat(intlAvg?.avg_cost  || 0);
    const intlRev    = avgSell * intlParcels;
    const intlCost   = avgCost * intlParcels;
    const intlProfit = intlRev - intlCost;

    const totalRev    = domRev    + intlRev;
    const totalCost   = domCost   + intlCost;
    const totalProfit = domProfit + intlProfit;

    return {
      rev: totalRev, cost: totalCost, profit: totalProfit,
      margin: totalRev > 0 ? totalProfit / totalRev * 100 : 0,
      dom: {
        parcels: domParcels, rev: domRev, cost: domCost, profit: domProfit,
        sell_rate: domSellRate, cost_rate: domCostRate,
        weighted_margin: weightedMargin,
        mainland_margin: mainlandMargin,
        other_avg_margin: otherAvgMargin,
        service_count: serviceMargins.length,
        other_service_count: otherServiceMargins.length,
      },
      intl: {
        parcels: intlParcels, rev: intlRev, cost: intlCost, profit: intlProfit,
        avg_sell: avgSell, avg_cost: avgCost, sample_count: intlAvg?.sample_count ?? 0,
      },
    };
  })();

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--mv-ink-52)', fontFamily: 'system-ui, sans-serif' }}>
        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        Loading rate card…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !rc) {
    return (
      <div style={{ padding: 32, color: 'var(--mv-magenta)', fontFamily: 'system-ui, sans-serif' }}>
        <AlertCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        {error?.message || 'Rate card not found'}
      </div>
    );
  }

  const isEditable = rc.status === 'draft' || rc.status === 'rejected';
  const statusColor = STATUS_COLOR[rc.status] || 'var(--mv-ink-52)';

  return (
    <div style={{ padding: '20px 28px', minHeight: '100%', fontFamily: 'system-ui, sans-serif', color: 'var(--mv-ink-78)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/pricing')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, var(--mv-ink) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)', borderRadius: 7, padding: '7px 14px',
              color: 'var(--mv-ink-52)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--mv-ink)' }}>
                {rc.prospect_company || 'Rate Card'}
              </h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: statusColor,
                background: `color-mix(in srgb, ${statusColor} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${statusColor} 27%, transparent)`,
                borderRadius: 20, padding: '2px 10px' }}>
                {STATUS_LABEL[rc.status] || rc.status}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>
              {rc.courier_name || rc.courier_code}
              {rc.template_name ? ` · template: ${rc.template_name}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {savedMsg && (
            <span style={{ fontSize: 12, color: 'var(--mv-green)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={12} /> {savedMsg}
            </span>
          )}
          {isEditable && (
            <>
              <button onClick={() => updateMut.mutate()} disabled={!dirty || updateMut.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6,
                  background: dirty ? 'var(--mv-purple-100)' : 'color-mix(in srgb, var(--mv-ink) 3%, transparent)',
                  border: `1px solid ${dirty ? 'var(--mv-purple)' : 'color-mix(in srgb, var(--mv-ink) 8%, transparent)'}`,
                  borderRadius: 7, padding: '8px 16px',
                  color: dirty ? 'var(--mv-purple)' : 'var(--mv-ink-62)',
                  fontSize: 13, cursor: dirty ? 'pointer' : 'default', fontWeight: 700 }}>
                {updateMut.isPending ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                Save
              </button>
              <button onClick={() => setShowSubmit(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)',
                  borderRadius: 7, padding: '8px 16px',
                  color: 'var(--mv-green)', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                <Send size={13} /> Submit for Approval
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submit panel */}
      {showSubmit && isEditable && (
        <div style={{ marginBottom: 16, background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)',
          borderRadius: 9, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--mv-ink-52)' }}>Submit as:</span>
          <select value={submitStaff} onChange={e => setSubmitStaff(e.target.value)}
            style={{ background: 'color-mix(in srgb, var(--mv-ink) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 10%, transparent)',
              borderRadius: 6, padding: '6px 10px', color: 'var(--mv-ink)', fontSize: 13, outline: 'none', minWidth: 180 }}>
            <option value="">— Your name —</option>
            {staffList.filter(s => s.is_active).map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <button onClick={() => submitMut.mutate()} disabled={!submitStaff || submitMut.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple)',
              borderRadius: 7, padding: '7px 16px', color: 'var(--mv-green)',
              fontSize: 13, cursor: 'pointer', fontWeight: 700, opacity: !submitStaff ? 0.5 : 1 }}>
            {submitMut.isPending ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
            Confirm
          </button>
          <button onClick={() => setShowSubmit(false)}
            style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 4 }}>
            <X size={15} />
          </button>
          {submitMut.error && <span style={{ fontSize: 12, color: 'var(--mv-magenta)' }}>{submitMut.error.message}</span>}
        </div>
      )}

      {/* Rejected note */}
      {rc.status === 'rejected' && rc.latest_approval?.comment && (
        <div style={{ marginBottom: 16, background: 'var(--mv-magenta-100)', border: '1px solid var(--mv-magenta-200)',
          borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--mv-magenta)' }}>
          <strong>Rejected:</strong> {rc.latest_approval.comment}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* ── Left: Rates ────────────────────────────────────────────────────── */}
        <div>

          {/* ── Surcharge Overrides ───────────────────────────────────────── */}
          <div style={{ marginBottom: 16, background: 'color-mix(in srgb, var(--mv-ink) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 7%, transparent)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--mv-ink) 3%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 7%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Surcharge Overrides
              </span>
              {isEditable && (
                <button onClick={() => { setSurchargeMarkups(p => [...p, { surcharge_name: '', markup_pct: '' }]); markDirty(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--mv-purple-100)',
                    border: '1px solid var(--mv-purple-200)', borderRadius: 6, padding: '4px 10px',
                    color: 'var(--mv-purple)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={11} /> Add Surcharge
                </button>
              )}
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Fuel markup — always visible, with warning if blank */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: '0 0 160px', fontSize: 12, color: 'var(--mv-ink-52)', fontWeight: 600 }}>Fuel surcharge markup</div>
                <div style={{ position: 'relative', flex: '0 0 90px' }}>
                  <input value={fuelMarkup} onChange={e => { setFuelMarkup(e.target.value); markDirty(); }}
                    disabled={!isEditable} type="number" step="0.1" placeholder="e.g. 5"
                    style={{ ...inputStyle, width: '100%', padding: '5px 28px 5px 9px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                      borderColor: fuelMarkup === '' || fuelMarkup == null ? 'var(--mv-amber-200)' : 'color-mix(in srgb, var(--mv-ink) 8%, transparent)',
                      background: fuelMarkup === '' || fuelMarkup == null ? 'var(--mv-amber-100)' : 'color-mix(in srgb, var(--mv-ink) 6%, transparent)' }} />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--mv-ink-52)', pointerEvents: 'none' }}>%</span>
                </div>
                {(fuelMarkup === '' || fuelMarkup == null) && (
                  <span style={{ fontSize: 11, color: 'var(--mv-amber-deep)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> Enter a fuel markup % — leave blank to pass cost through at zero margin
                  </span>
                )}
              </div>

              {/* Dynamic surcharge markup rows */}
              {surchargeMarkups.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isEditable ? (
                    <input value={s.surcharge_name} placeholder="Surcharge name (e.g. Remote Area)"
                      onChange={e => { setSurchargeMarkups(p => p.map((x, j) => j === i ? { ...x, surcharge_name: e.target.value } : x)); markDirty(); }}
                      style={{ ...inputStyle, flex: '0 0 160px', padding: '5px 9px', fontSize: 12 }} />
                  ) : (
                    <div style={{ flex: '0 0 160px', fontSize: 12, color: 'var(--mv-ink-52)', fontWeight: 600 }}>{s.surcharge_name || '—'}</div>
                  )}
                  <div style={{ position: 'relative', flex: '0 0 90px' }}>
                    <input value={s.markup_pct ?? ''} type="number" step="0.1" placeholder="0"
                      disabled={!isEditable}
                      onChange={e => { setSurchargeMarkups(p => p.map((x, j) => j === i ? { ...x, markup_pct: e.target.value } : x)); markDirty(); }}
                      style={{ ...inputStyle, width: '100%', padding: '5px 28px 5px 9px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }} />
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--mv-ink-52)', pointerEvents: 'none' }}>%</span>
                  </div>
                  {isEditable && (
                    <button onClick={() => { setSurchargeMarkups(p => p.filter((_, j) => j !== i)); markDirty(); }}
                      style={{ background: 'none', border: 'none', color: 'var(--mv-ink-62)', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}

              {surchargeMarkups.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--mv-ink-62)', fontStyle: 'italic' }}>
                  No additional surcharge overrides — click Add Surcharge to define markups for remote area, out of area, residential, etc.
                </div>
              )}
            </div>
          </div>

          {/* ── DOMESTIC SERVICES ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Domestic Services <span style={{ color: 'var(--mv-ink-62)', fontWeight: 400, textTransform: 'none' }}>({domesticServices.length} services · {domesticRates.length} zones)</span>
            </div>
            {domesticServices.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mv-ink-62)', fontSize: 12, fontStyle: 'italic',
                border: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)', borderRadius: 9 }}>
                No domestic rates yet.
              </div>
            )}
            {domesticServices.map(svc => {
              const svcOpen = openSvcs.has(svc.service_code);
              const allPriced = svc.zones.every(z => z.price);
              return (
                <div key={svc.service_code} style={{ border: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                  <div onClick={() => toggleSvc(svc.service_code)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      cursor: 'pointer', background: svcOpen ? 'color-mix(in srgb, var(--mv-ink) 3%, transparent)' : 'transparent' }}>
                    {svcOpen ? <ChevronDown size={13} color="var(--mv-ink-52)"/> : <ChevronRight size={13} color="var(--mv-ink-52)"/>}
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--mv-ink)', flex: 1 }}>{svc.service_name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--mv-green)', background: 'var(--mv-purple-100)', padding: '1px 8px', borderRadius: 9999 }}>{svc.service_code}</span>
                    {allPriced && <span style={{ fontSize: 10, color: 'var(--mv-green)', background: 'var(--mv-purple-100)', padding: '1px 7px', borderRadius: 9999 }}>✓ priced</span>}
                    <span style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{svc.zones.length} zone{svc.zones.length !== 1 ? 's' : ''}</span>
                  </div>
                  {svcOpen && (
                    <div style={{ borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)', padding: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
                            <th style={{ textAlign: 'left',  padding: '4px 8px', color: 'var(--mv-ink-52)', fontWeight: 600, fontSize: 11 }}>Zone</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--mv-purple)', fontWeight: 600, fontSize: 11 }}>Cost (1st)</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--mv-purple)', fontWeight: 700, fontSize: 11 }}>Markup %</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--mv-green)', fontWeight: 600, fontSize: 11 }}>Sell (1st)</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--mv-amber-deep)', fontWeight: 600, fontSize: 11 }}>Sell (sub)</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--mv-ink-52)',    fontWeight: 600, fontSize: 11 }}>Margin</th>
                            <th style={{ width: 28 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {svc.zones.map(r => {
                            const origIdx = rates.indexOf(r);
                            return (
                              <tr key={origIdx} style={{ borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 3%, transparent)' }}>
                                <td style={{ padding: '5px 8px', color: 'var(--mv-ink-52)' }}>{r.zone_name || '—'}</td>
                                <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--mv-purple)', fontFamily: 'monospace' }}>{gbp(r.cost_price)}</td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                  {isEditable ? (
                                    <input value={r.markup_pct ?? ''} type="number" step="0.1" placeholder="—"
                                      onChange={e => applyMarkupToRate(origIdx, e.target.value)}
                                      style={{ width: 64, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                        color: 'var(--mv-purple)', fontWeight: 700, background: 'var(--mv-purple-100)',
                                        border: '1px solid var(--mv-purple-200)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                  ) : <span style={{ color: 'var(--mv-purple)', fontFamily: 'monospace' }}>{r.markup_pct != null ? `${r.markup_pct}%` : '—'}</span>}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                  {isEditable ? (
                                    <input value={r.price ?? ''} type="number" step="0.01" placeholder="0.00"
                                      onChange={e => updateRate(origIdx, 'price', e.target.value)}
                                      style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                        color: 'var(--mv-green)', fontWeight: 700, background: 'var(--mv-purple-100)',
                                        border: '1px solid var(--mv-purple-200)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                  ) : <span style={{ color: 'var(--mv-green)', fontFamily: 'monospace', fontWeight: 700 }}>{gbp(r.price)}</span>}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                  {isEditable ? (
                                    <input value={r.price_sub ?? ''} type="number" step="0.01" placeholder="0.00"
                                      onChange={e => updateRate(origIdx, 'price_sub', e.target.value)}
                                      style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                        color: 'var(--mv-amber-deep)', background: 'var(--mv-amber-100)',
                                        border: '1px solid var(--mv-amber-200)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                  ) : <span style={{ color: 'var(--mv-amber-deep)', fontFamily: 'monospace' }}>{gbp(r.price_sub)}</span>}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}><MarkupChip sell={r.price} cost={r.cost_price} /></td>
                                <td style={{ padding: '5px 8px' }}>
                                  {isEditable && (
                                    <button onClick={() => removeRow(origIdx)}
                                      style={{ background: 'none', border: 'none', color: 'var(--mv-ink-62)', cursor: 'pointer', padding: 3 }}>
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── INTERNATIONAL SERVICES ─────────────────────────────────────────── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              International Services <span style={{ color: 'var(--mv-ink-62)', fontWeight: 400, textTransform: 'none' }}>({intlServices.length} services · {intlRates.length} zones)</span>
            </div>


            {intlServices.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mv-ink-62)', fontSize: 12, fontStyle: 'italic',
                border: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)', borderRadius: 9 }}>
                No international rates.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {intlServices.map(svc => {
                const svcOpen = openIntlSvcs.has(svc.service_code);
                const filledZones = svc.zones.filter(z => z.markup_pct || z.price).length;
                return (
                  <div key={svc.service_code} style={{ border: '1px solid var(--mv-purple-200)', borderRadius: 10,
                    background: 'color-mix(in srgb, var(--mv-purple) 4%, transparent)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--mv-ink)', flex: 1 }}>{svc.service_name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--mv-purple)', background: 'var(--mv-purple-100)', padding: '1px 7px', borderRadius: 9999 }}>{svc.service_code}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginBottom: 10 }}>
                        {svc.zones.length} zone{svc.zones.length !== 1 ? 's' : ''}
                        {filledZones > 0 && <span style={{ color: 'var(--mv-green)', marginLeft: 8 }}>· {filledZones} priced</span>}
                      </div>

                      {/* Single markup % — applies to all zones in this service */}
                      {isEditable && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <input
                            type="number" step="0.1" placeholder="Markup %"
                            defaultValue={svc.zones[0]?.markup_pct ?? ''}
                            onBlur={e => {
                              const pct = e.target.value;
                              if (!pct) return;
                              setRates(prev => prev.map(r => {
                                if (r.service_code !== svc.service_code || !r.is_international) return r;
                                const cost = parseFloat(r.cost_price);
                                const mkp  = parseFloat(pct);
                                return { ...r, markup_pct: pct, price: !isNaN(cost) && !isNaN(mkp) ? (cost * (1 + mkp / 100)).toFixed(2) : r.price };
                              }));
                              markDirty();
                            }}
                            style={{ width: 80, textAlign: 'right', fontFamily: 'monospace', fontSize: 13,
                              color: 'var(--mv-purple)', fontWeight: 700, background: 'var(--mv-purple-100)',
                              border: '1px solid var(--mv-purple-200)', borderRadius: 8, padding: '5px 10px', outline: 'none' }} />
                          <span style={{ fontSize: 13, color: 'var(--mv-purple)', fontWeight: 700 }}>%</span>
                          <span style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>all zones</span>
                        </div>
                      )}

                      <button onClick={() => toggleIntlSvc(svc.service_code)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px',
                          borderRadius: 9999, fontSize: 11, fontWeight: 700,
                          background: svcOpen ? 'var(--mv-purple-200)' : 'var(--mv-purple-100)',
                          color: 'var(--mv-purple)', border: '1px solid var(--mv-purple-200)', cursor: 'pointer' }}>
                        <FileText size={11}/> {svcOpen ? 'Hide Rates' : 'Edit Rates'}
                      </button>
                    </div>
                    {svcOpen && (
                      <div style={{ borderTop: '1px solid var(--mv-purple-200)', padding: '10px 14px', maxHeight: 340, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
                              <th style={{ textAlign: 'left',  padding: '4px 6px', color: 'var(--mv-ink-52)', fontWeight: 600, fontSize: 10 }}>Zone</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: 'var(--mv-purple)', fontWeight: 600, fontSize: 10 }}>Cost</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: 'var(--mv-purple)', fontWeight: 700, fontSize: 10 }}>Markup %</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: 'var(--mv-green)', fontWeight: 600, fontSize: 10 }}>Sell</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: 'var(--mv-ink-52)',    fontWeight: 600, fontSize: 10 }}>Margin</th>
                              <th style={{ width: 24 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {svc.zones.map(r => {
                              const origIdx = rates.indexOf(r);
                              return (
                                <tr key={origIdx} style={{ borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 3%, transparent)' }}>
                                  <td style={{ padding: '4px 6px', color: 'var(--mv-ink-52)', fontSize: 11, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.zone_name || '—'}</td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--mv-purple)', fontFamily: 'monospace', fontSize: 11 }}>{gbp(r.cost_price)}</td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                    {isEditable ? (
                                      <input value={r.markup_pct ?? ''} type="number" step="0.1" placeholder="%"
                                        onChange={e => applyMarkupToRate(origIdx, e.target.value)}
                                        style={{ width: 56, textAlign: 'right', fontFamily: 'monospace', fontSize: 11,
                                          color: 'var(--mv-purple)', fontWeight: 700, background: 'var(--mv-purple-100)',
                                          border: '1px solid var(--mv-purple-200)', borderRadius: 9999, padding: '2px 6px', outline: 'none' }} />
                                    ) : <span style={{ color: 'var(--mv-purple)', fontFamily: 'monospace', fontWeight: 700 }}>{r.markup_pct != null ? `${r.markup_pct}%` : '—'}</span>}
                                  </td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                    {isEditable ? (
                                      <input value={r.price ?? ''} type="number" step="0.01" placeholder="0.00"
                                        onChange={e => updateRate(origIdx, 'price', e.target.value)}
                                        style={{ width: 60, textAlign: 'right', fontFamily: 'monospace', fontSize: 11,
                                          color: 'var(--mv-green)', background: 'var(--mv-purple-100)',
                                          border: '1px solid var(--mv-purple-200)', borderRadius: 9999, padding: '2px 6px', outline: 'none' }} />
                                    ) : <span style={{ color: 'var(--mv-green)', fontFamily: 'monospace' }}>{gbp(r.price)}</span>}
                                  </td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right' }}><MarkupChip sell={r.price} cost={r.cost_price} /></td>
                                  <td style={{ padding: '4px 6px' }}>
                                    {isEditable && (
                                      <button onClick={() => removeRow(origIdx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--mv-ink-62)', cursor: 'pointer', padding: 2 }}>
                                        <Trash2 size={10} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: Projections ────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'color-mix(in srgb, var(--mv-ink) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Projections
            </div>

            {/* Projection output — shown at top */}
            {projections ? (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Revenue / wk</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--mv-purple)' }}>{gbp(projections.rev)}</div>
                  </div>
                  <div style={{ background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Cost / wk</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--mv-purple)' }}>{gbp(projections.cost)}</div>
                  </div>
                  <div style={{ background: projections.profit >= 0 ? 'var(--mv-purple-100)' : 'var(--mv-magenta-100)',
                    border: `1px solid ${projections.profit >= 0 ? 'var(--mv-purple-200)' : 'var(--mv-magenta-200)'}`,
                    borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Profit / wk</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: projections.profit >= 0 ? 'var(--mv-green)' : 'var(--mv-magenta)' }}>{gbp(projections.profit)}</div>
                        <div style={{ fontSize: 11, color: projections.profit >= 0 ? 'var(--mv-green)' : 'var(--mv-magenta)', marginTop: 2 }}>{projections.margin.toFixed(1)}% margin</div>
                      </div>
                      <button
                        onClick={() => setShowDebug(d => !d)}
                        title="Show calculation"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
                          borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          background: showDebug ? 'var(--mv-amber-100)' : 'color-mix(in srgb, var(--mv-ink) 6%, transparent)',
                          border: `1px solid ${showDebug ? 'var(--mv-amber-200)' : 'color-mix(in srgb, var(--mv-ink) 8%, transparent)'}`,
                          color: showDebug ? 'var(--mv-amber-deep)' : 'var(--mv-ink-62)', marginTop: 2 }}>
                        {showDebug ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                        Debug
                      </button>
                    </div>
                  </div>
                </div>

                {/* Debug: show both domestic and international assumptions */}
                {showDebug && projections && (
                  <div style={{ marginTop: 10, background: 'color-mix(in srgb, var(--mv-amber) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-amber) 15%, transparent)', borderRadius: 8, overflow: 'hidden', fontSize: 11 }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid color-mix(in srgb, var(--mv-amber) 10%, transparent)', fontSize: 10, color: 'var(--mv-amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Projection assumptions
                    </div>
                    {/* Domestic leg */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 4%, transparent)' }}>
                      <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        Domestic — {projections.dom.parcels.toLocaleString()} parcels ({domesticPct}%)
                        <span style={{ color: 'var(--mv-ink-52)', fontWeight: 400, textTransform: 'none' }}>
                          {projections.dom.service_count} service type{projections.dom.service_count !== 1 ? 's' : ''} used
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                        {[
                          { label: 'Service',       val: primaryRate.service_name || primaryRate.service_code },
                          { label: 'Zone',          val: primaryRate.zone_name || 'Mainland', mono: true },
                          { label: 'Carrier cost',  val: gbp(projections.dom.cost_rate), mono: true, color: 'var(--mv-purple)' },
                        ].map(({ label, val, mono, color }) => (
                          <div key={label}>
                            <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', marginBottom: 2 }}>{label}</div>
                            <div style={{ color: color || 'var(--mv-ink-78)', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 600 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {/* Margin weighting breakdown */}
                      <div style={{ background: 'color-mix(in srgb, var(--mv-ink) 3%, transparent)', borderRadius: 6, padding: '6px 10px', fontSize: 10 }}>
                        <div style={{ color: 'var(--mv-ink-52)', marginBottom: 4, fontWeight: 600 }}>Margin weighting</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ color: 'var(--mv-purple)' }}>
                            80% × mainland {projections.dom.mainland_margin != null ? `${projections.dom.mainland_margin.toFixed(1)}%` : 'no price set'}
                          </span>
                          <span style={{ color: 'var(--mv-ink-52)' }}>+</span>
                          <span style={{ color: 'var(--mv-ink-52)' }}>
                            20% × other services ({projections.dom.other_service_count}) {projections.dom.other_avg_margin.toFixed(1)}%
                          </span>
                          <span style={{ color: 'var(--mv-ink-52)' }}>=</span>
                          <span style={{ color: 'var(--mv-green)', fontWeight: 700 }}>
                            {projections.dom.weighted_margin.toFixed(1)}% weighted margin
                          </span>
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
                          <span>Projected sell: <span style={{ color: 'var(--mv-green)', fontFamily: 'monospace', fontWeight: 700 }}>{gbp(projections.dom.sell_rate)}</span>/parcel</span>
                          <span>Dom profit: <span style={{ fontFamily: 'monospace', fontWeight: 700,
                            color: projections.dom.profit >= 0 ? 'var(--mv-green)' : 'var(--mv-magenta)' }}>{gbp(projections.dom.profit)}</span></span>
                        </div>
                      </div>
                    </div>
                    {/* International leg */}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        International — {projections.intl.parcels.toLocaleString()} parcels ({100 - domesticPct}%)
                        {projections.intl.sample_count < 10 && (
                          <span style={{ background: 'color-mix(in srgb, var(--mv-amber) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-amber) 30%, transparent)', borderRadius: 99, padding: '1px 6px', color: 'var(--mv-amber)', fontSize: 9, fontWeight: 700, textTransform: 'none' }}>
                            {projections.intl.sample_count === 0 ? 'No data yet' : `${projections.intl.sample_count} charges`}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {[
                          { label: 'Avg sell/parcel', val: projections.intl.avg_sell > 0 ? gbp(projections.intl.avg_sell) : '—', mono: true, color: 'var(--mv-green)' },
                          { label: 'Avg cost/parcel', val: projections.intl.avg_cost > 0 ? gbp(projections.intl.avg_cost) : '—', mono: true, color: 'var(--mv-purple)' },
                          { label: 'Intl profit',     val: projections.intl.rev > 0 ? gbp(projections.intl.profit) : '—', mono: true,
                            color: projections.intl.profit >= 0 ? 'var(--mv-green)' : 'var(--mv-magenta)' },
                        ].map(({ label, val, mono, color }) => (
                          <div key={label}>
                            <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', marginBottom: 2 }}>{label}</div>
                            <div style={{ color: color || 'var(--mv-ink-78)', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 600 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--mv-ink-62)', textAlign: 'center', padding: '10px 0 16px',
                background: 'color-mix(in srgb, var(--mv-ink) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 4%, transparent)', borderRadius: 8, marginBottom: 16 }}>
                {!weeklyParcels ? 'Enter weekly parcels below to see projection' :
                 !primaryRate?.cost_price ? 'Add domestic rates with cost prices to calculate' :
                 'Set sell prices on domestic rates to project margin'}
              </div>
            )}

            <label style={{ fontSize: 12, color: 'var(--mv-ink-52)', display: 'block', marginBottom: 4 }}>Est. weekly parcels</label>
            <input value={weeklyParcels} onChange={e => { setWeeklyParcels(e.target.value); markDirty(); }}
              type="number" min={0} disabled={!isEditable}
              style={{ ...inputStyle, marginBottom: 12 }} placeholder="e.g. 500" />

            {/* Domestic / International split slider */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>Domestic / International split</label>
                <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>
                  <span style={{ color: 'var(--mv-purple)' }}>{domesticPct}% dom</span>
                  <span style={{ color: 'var(--mv-ink-52)', margin: '0 4px' }}>·</span>
                  <span style={{ color: 'var(--mv-purple)' }}>{100 - domesticPct}% intl</span>
                </span>
              </div>
              <input
                type="range" min={50} max={100} step={1} value={domesticPct}
                onChange={e => { setDomesticPct(parseInt(e.target.value)); markDirty(); }}
                disabled={!isEditable}
                style={{ width: '100%', accentColor: 'var(--mv-purple)', cursor: isEditable ? 'pointer' : 'default' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--mv-ink-62)', marginTop: 2 }}>
                <span>50% dom</span><span>100% dom</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
