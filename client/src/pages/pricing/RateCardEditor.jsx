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
  if (mu == null) return <span style={{ color: '#444', fontSize: 12 }}>—</span>;
  const color = mu < 0 ? '#EF4444' : mu < 15 ? '#F59E0B' : '#34D399';
  return <span style={{ fontSize: 12, color, fontWeight: 700 }}>{mu.toFixed(1)}%</span>;
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '5px 9px', color: '#fff', fontSize: 12, outline: 'none',
};

const STATUS_COLOR = {
  draft:            '#888',
  pending_approval: '#FB923C',
  approved:         '#60A5FA',
  rejected:         '#EF4444',
  sent:             '#A78BFA',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RateCardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [rates, setRates] = useState([]);
  const [intlMarkup, setIntlMarkup] = useState('');
  const [fuelMarkup, setFuelMarkup] = useState('');
  const [weeklyParcels, setWeeklyParcels] = useState('');
  const [volumeMix, setVolumeMix] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [submitStaff, setSubmitStaff] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [openSvcs,     setOpenSvcs]     = useState(new Set());
  const [openIntlSvcs, setOpenIntlSvcs] = useState(new Set());
  const [mixLoading,   setMixLoading]   = useState(false);
  const [mixMeta,      setMixMeta]      = useState(null); // { customer_count, weekly_avg_min, weekly_avg_max }

  const { data: rc, isLoading, error } = useQuery({
    queryKey: ['rate-card-detail', id],
    queryFn: () => apiFetch(`/api/pricing/rate-card/${id}`),
  });

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: api.staffList });

  // Build a service_code → service_name map from rate card rates
  const svcNameMap = Object.fromEntries(
    (rc?.rates || []).filter(r => r.service_name && r.service_code)
      .map(r => [r.service_code, r.service_name])
  );

  // Apply volume snapshot: filter to codes present in this rate card, re-normalise to 100%
  const applySnapshot = (snapshotRows, domesticCodes) => {
    const filtered = snapshotRows.filter(s => domesticCodes.includes(s.service_code));
    // For codes in the rate card but NOT in snapshot, append with pct=0
    const inSnapshot = new Set(filtered.map(s => s.service_code));
    const missing = domesticCodes.filter(c => !inSnapshot.has(c));

    const total = filtered.reduce((s, r) => s + parseFloat(r.pct), 0);
    const normalised = filtered.map(r => ({
      service_code: r.service_code,
      service_name: r.service_name || svcNameMap[r.service_code] || r.service_code,
      pct: total > 0 ? Math.round(parseFloat(r.pct) / total * 100) : 0,
    }));
    // Fix rounding so it sums exactly to 100
    const sum = normalised.reduce((s, r) => s + r.pct, 0);
    if (normalised.length > 0) normalised[0].pct += (100 - sum);

    return [
      ...normalised,
      ...missing.map(c => ({ service_code: c, service_name: svcNameMap[c] || c, pct: 0 })),
    ];
  };

  // Load mix from similar customers — called on initial load and when weeklyParcels changes
  const loadSimilarMix = async (vol, courierCode, domesticCodes) => {
    if (!courierCode || !domesticCodes.length || !vol || parseInt(vol) <= 0) return;
    setMixLoading(true);
    try {
      const result = await apiFetch(
        `/api/pricing/similar-customer-mix?courier_code=${encodeURIComponent(courierCode)}&weekly_volume=${parseInt(vol)}`
      );
      if (result?.mix?.length) {
        setVolumeMix(applySnapshot(result.mix, domesticCodes));
        setMixMeta(result.meta || null);
        setDirty(true);
      }
    } catch (e) { /* silently ignore — keep existing mix */ }
    finally { setMixLoading(false); }
  };

  // Initialise local state when rate card loads
  useEffect(() => {
    if (!rc) return;
    setRates((rc.rates || []).map(r => ({ ...r })));
    setIntlMarkup(rc.intl_markup_pct ?? '');
    setFuelMarkup(rc.fuel_markup_pct ?? '');
    setWeeklyParcels(rc.weekly_parcels ?? '');

    const domesticCodes = [...new Set((rc.rates || []).filter(r => !r.is_international).map(r => r.service_code).filter(Boolean))];

    if (rc.volume_mix?.length) {
      // Saved mix — enrich with service names if missing
      setVolumeMix(rc.volume_mix.map(m => ({
        ...m,
        service_name: m.service_name || svcNameMap[m.service_code] || m.service_code,
      })));
    } else if (rc.weekly_parcels) {
      // No saved mix but we have a target volume — auto-load similar customer mix
      loadSimilarMix(rc.weekly_parcels, rc.courier_code, domesticCodes);
    }
    setDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rc?.id]);

  // Auto-refresh mix when weeklyParcels changes (debounced 600ms)
  useEffect(() => {
    if (!rc?.courier_code || !weeklyParcels || parseInt(weeklyParcels) <= 0) return;
    const domesticCodes = [...new Set((rc.rates || []).filter(r => !r.is_international).map(r => r.service_code).filter(Boolean))];
    const timer = setTimeout(() => loadSimilarMix(weeklyParcels, rc.courier_code, domesticCodes), 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyParcels]);

  const updateMut = useMutation({
    mutationFn: () => api.updateRateCard(id, {
      rates,
      intl_markup_pct: num(intlMarkup),
      fuel_markup_pct: num(fuelMarkup),
      weekly_parcels:  weeklyParcels ? parseInt(weeklyParcels) : null,
      volume_mix: volumeMix,
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

  const [showDebug, setShowDebug] = useState(false);

  const mixTotal = volumeMix.reduce((s, m) => s + parseFloat(m.pct || 0), 0);

  // For a given service code, pick the base rate zone.
  // Priority: lowest numeric zone (Zone 1 < Zone 2 … < Zone 8), then alphabetic.
  // This ensures DPD Zone 1 (£3.76) is always used rather than a random zone from array order.
  const pickBaseRate = (serviceCode) => {
    const matching = domesticRates.filter(x => x.service_code === serviceCode);
    if (!matching.length) return null;
    return matching.slice().sort((a, b) => {
      const numA = parseInt((a.zone_name || '').match(/\d+/)?.[0] ?? '9999');
      const numB = parseInt((b.zone_name || '').match(/\d+/)?.[0] ?? '9999');
      if (numA !== numB) return numA - numB;
      return (a.zone_name || '').localeCompare(b.zone_name || '');
    })[0];
  };

  const projections = (() => {
    if (!weeklyParcels || mixTotal !== 100) return null;
    let rev = 0, cost = 0;
    const lines = [];
    volumeMix.forEach(m => {
      const qty  = Math.round((m.pct / 100) * parseInt(weeklyParcels));
      // Use base rate zone (Zone 1 / numerically lowest) for this service
      const r    = pickBaseRate(m.service_code);
      const sell = parseFloat(r?.price      || 0);
      const cst  = parseFloat(r?.cost_price || 0);
      const lineRev    = sell * qty;
      const lineCost   = cst  * qty;
      const lineProfit = lineRev - lineCost;
      if (r) {
        rev  += lineRev;
        cost += lineCost;
      }
      lines.push({
        service_code: m.service_code,
        service_name: m.service_name || m.service_code,
        pct:          m.pct,
        qty,
        sell:         r ? sell : null,
        cost_price:   r ? cst  : null,
        zone_name:    r?.zone_name || null,
        zone_count:   domesticRates.filter(x => x.service_code === m.service_code).length,
        rev:          r ? lineRev    : null,
        cost:         r ? lineCost   : null,
        profit:       r ? lineProfit : null,
        margin:       lineRev > 0 ? (lineProfit / lineRev) * 100 : null,
        matched:      !!r,
      });
    });
    const profit = rev - cost;
    return { rev, cost, profit, margin: rev > 0 ? profit / rev * 100 : 0, lines };
  })();

  // ── Service codes from domestic rates (for volume mix) ────────────────────

  const serviceCodes = [...new Set(domesticRates.map(r => r.service_code).filter(Boolean))];
  // Sync volume mix when service codes change (preserve existing pcts + names)
  useEffect(() => {
    if (!rc) return;
    setVolumeMix(prev => {
      const existing = new Map(prev.map(m => [m.service_code, m]));
      return serviceCodes.map(sc => ({
        service_code: sc,
        service_name: existing.get(sc)?.service_name || svcNameMap[sc] || sc,
        pct: existing.get(sc)?.pct ?? 0,
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(serviceCodes)]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#555', fontFamily: 'system-ui, sans-serif' }}>
        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        Loading rate card…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !rc) {
    return (
      <div style={{ padding: 32, color: '#EF4444', fontFamily: 'system-ui, sans-serif' }}>
        <AlertCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        {error?.message || 'Rate card not found'}
      </div>
    );
  }

  const isEditable = rc.status === 'draft' || rc.status === 'rejected';
  const statusColor = STATUS_COLOR[rc.status] || '#888';

  return (
    <div style={{ padding: '20px 28px', minHeight: '100%', fontFamily: 'system-ui, sans-serif', color: '#CCC' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/pricing')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 14px',
              color: '#888', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>
                {rc.prospect_company || 'Rate Card'}
              </h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: statusColor,
                background: `${statusColor}18`, border: `1px solid ${statusColor}44`,
                borderRadius: 20, padding: '2px 10px' }}>
                {rc.status?.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
              {rc.courier_name || rc.courier_code}
              {rc.template_name ? ` · template: ${rc.template_name}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {savedMsg && (
            <span style={{ fontSize: 12, color: '#34D399', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={12} /> {savedMsg}
            </span>
          )}
          {isEditable && (
            <>
              <button onClick={() => updateMut.mutate()} disabled={!dirty || updateMut.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6,
                  background: dirty ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${dirty ? '#6366F1' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 7, padding: '8px 16px',
                  color: dirty ? '#A5B4FC' : '#555',
                  fontSize: 13, cursor: dirty ? 'pointer' : 'default', fontWeight: 700 }}>
                {updateMut.isPending ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                Save
              </button>
              <button onClick={() => setShowSubmit(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.35)',
                  borderRadius: 7, padding: '8px 16px',
                  color: '#00C853', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                <Send size={13} /> Submit for Approval
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submit panel */}
      {showSubmit && isEditable && (
        <div style={{ marginBottom: 16, background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)',
          borderRadius: 9, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#AAA' }}>Submit as:</span>
          <select value={submitStaff} onChange={e => setSubmitStaff(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 13, outline: 'none', minWidth: 180 }}>
            <option value="">— Your name —</option>
            {staffList.filter(s => s.is_active).map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <button onClick={() => submitMut.mutate()} disabled={!submitStaff || submitMut.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)',
              borderRadius: 7, padding: '7px 16px', color: '#00C853',
              fontSize: 13, cursor: 'pointer', fontWeight: 700, opacity: !submitStaff ? 0.5 : 1 }}>
            {submitMut.isPending ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
            Confirm
          </button>
          <button onClick={() => setShowSubmit(false)}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
            <X size={15} />
          </button>
          {submitMut.error && <span style={{ fontSize: 12, color: '#EF4444' }}>{submitMut.error.message}</span>}
        </div>
      )}

      {/* Rejected note */}
      {rc.status === 'rejected' && rc.latest_approval?.comment && (
        <div style={{ marginBottom: 16, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#F87171' }}>
          <strong>Rejected:</strong> {rc.latest_approval.comment}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* ── Left: Rates ────────────────────────────────────────────────────── */}
        <div>

          {/* Global overrides row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '11px 16px' }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Overrides</div>
            <label style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 7 }}>
              Fuel markup %
              <input value={fuelMarkup} onChange={e => { setFuelMarkup(e.target.value); markDirty(); }}
                disabled={!isEditable}
                style={{ ...inputStyle, width: 70, padding: '4px 8px' }} placeholder="—" />
            </label>
          </div>

          {/* ── DOMESTIC SERVICES ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00C853', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Domestic Services <span style={{ color: '#444', fontWeight: 400, textTransform: 'none' }}>({domesticServices.length} services · {domesticRates.length} zones)</span>
            </div>
            {domesticServices.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: 12, fontStyle: 'italic',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9 }}>
                No domestic rates yet.
              </div>
            )}
            {domesticServices.map(svc => {
              const svcOpen = openSvcs.has(svc.service_code);
              const allPriced = svc.zones.every(z => z.price);
              return (
                <div key={svc.service_code} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                  <div onClick={() => toggleSvc(svc.service_code)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      cursor: 'pointer', background: svcOpen ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    {svcOpen ? <ChevronDown size={13} color="#AAAAAA"/> : <ChevronRight size={13} color="#AAAAAA"/>}
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#fff', flex: 1 }}>{svc.service_name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#00C853', background: 'rgba(0,200,83,0.08)', padding: '1px 8px', borderRadius: 9999 }}>{svc.service_code}</span>
                    {allPriced && <span style={{ fontSize: 10, color: '#34D399', background: 'rgba(52,211,153,0.1)', padding: '1px 7px', borderRadius: 9999 }}>✓ priced</span>}
                    <span style={{ fontSize: 11, color: '#555' }}>{svc.zones.length} zone{svc.zones.length !== 1 ? 's' : ''}</span>
                  </div>
                  {svcOpen && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ textAlign: 'left',  padding: '4px 8px', color: '#555', fontWeight: 600, fontSize: 11 }}>Zone</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: '#B39DDB', fontWeight: 600, fontSize: 11 }}>Cost (1st)</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: '#A5B4FC', fontWeight: 700, fontSize: 11 }}>Markup %</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: '#00C853', fontWeight: 600, fontSize: 11 }}>Sell (1st)</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: '#FFC107', fontWeight: 600, fontSize: 11 }}>Sell (sub)</th>
                            <th style={{ textAlign: 'right', padding: '4px 8px', color: '#888',    fontWeight: 600, fontSize: 11 }}>Margin</th>
                            <th style={{ width: 28 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {svc.zones.map(r => {
                            const origIdx = rates.indexOf(r);
                            return (
                              <tr key={origIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '5px 8px', color: '#AAAAAA' }}>{r.zone_name || '—'}</td>
                                <td style={{ padding: '5px 8px', textAlign: 'right', color: '#B39DDB', fontFamily: 'monospace' }}>{gbp(r.cost_price)}</td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                  {isEditable ? (
                                    <input value={r.markup_pct ?? ''} type="number" step="0.1" placeholder="—"
                                      onChange={e => applyMarkupToRate(origIdx, e.target.value)}
                                      style={{ width: 64, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                        color: '#A5B4FC', fontWeight: 700, background: 'rgba(99,102,241,0.08)',
                                        border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                  ) : <span style={{ color: '#A5B4FC', fontFamily: 'monospace' }}>{r.markup_pct != null ? `${r.markup_pct}%` : '—'}</span>}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                  {isEditable ? (
                                    <input value={r.price ?? ''} type="number" step="0.01" placeholder="0.00"
                                      onChange={e => updateRate(origIdx, 'price', e.target.value)}
                                      style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                        color: '#00C853', fontWeight: 700, background: 'rgba(0,200,83,0.08)',
                                        border: '1px solid rgba(0,200,83,0.3)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                  ) : <span style={{ color: '#00C853', fontFamily: 'monospace', fontWeight: 700 }}>{gbp(r.price)}</span>}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                  {isEditable ? (
                                    <input value={r.price_sub ?? ''} type="number" step="0.01" placeholder="0.00"
                                      onChange={e => updateRate(origIdx, 'price_sub', e.target.value)}
                                      style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                        color: '#FFC107', background: 'rgba(255,193,7,0.08)',
                                        border: '1px solid rgba(255,193,7,0.3)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                  ) : <span style={{ color: '#FFC107', fontFamily: 'monospace' }}>{gbp(r.price_sub)}</span>}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right' }}><MarkupChip sell={r.price} cost={r.cost_price} /></td>
                                <td style={{ padding: '5px 8px' }}>
                                  {isEditable && (
                                    <button onClick={() => removeRow(origIdx)}
                                      style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 3 }}>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              International Services <span style={{ color: '#444', fontWeight: 400, textTransform: 'none' }}>({intlServices.length} services · {intlRates.length} zones)</span>
            </div>


            {intlServices.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: 12, fontStyle: 'italic',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9 }}>
                No international rates.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {intlServices.map(svc => {
                const svcOpen = openIntlSvcs.has(svc.service_code);
                const filledZones = svc.zones.filter(z => z.markup_pct || z.price).length;
                return (
                  <div key={svc.service_code} style={{ border: '1px solid rgba(123,47,190,0.2)', borderRadius: 10,
                    background: 'rgba(123,47,190,0.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#fff', flex: 1 }}>{svc.service_name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#7B2FBE', background: 'rgba(123,47,190,0.12)', padding: '1px 7px', borderRadius: 9999 }}>{svc.service_code}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
                        {svc.zones.length} zone{svc.zones.length !== 1 ? 's' : ''}
                        {filledZones > 0 && <span style={{ color: '#00C853', marginLeft: 8 }}>· {filledZones} priced</span>}
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
                              color: '#C084FC', fontWeight: 700, background: 'rgba(123,47,190,0.12)',
                              border: '1px solid rgba(123,47,190,0.45)', borderRadius: 8, padding: '5px 10px', outline: 'none' }} />
                          <span style={{ fontSize: 13, color: '#7B2FBE', fontWeight: 700 }}>%</span>
                          <span style={{ fontSize: 11, color: '#555' }}>all zones</span>
                        </div>
                      )}

                      <button onClick={() => toggleIntlSvc(svc.service_code)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px',
                          borderRadius: 9999, fontSize: 11, fontWeight: 700,
                          background: svcOpen ? 'rgba(123,47,190,0.2)' : 'rgba(123,47,190,0.12)',
                          color: '#9B59E8', border: '1px solid rgba(123,47,190,0.3)', cursor: 'pointer' }}>
                        <FileText size={11}/> {svcOpen ? 'Hide Rates' : 'Edit Rates'}
                      </button>
                    </div>
                    {svcOpen && (
                      <div style={{ borderTop: '1px solid rgba(123,47,190,0.15)', padding: '10px 14px', maxHeight: 340, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <th style={{ textAlign: 'left',  padding: '4px 6px', color: '#555', fontWeight: 600, fontSize: 10 }}>Zone</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: '#B39DDB', fontWeight: 600, fontSize: 10 }}>Cost</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: '#A5B4FC', fontWeight: 700, fontSize: 10 }}>Markup %</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: '#00C853', fontWeight: 600, fontSize: 10 }}>Sell</th>
                              <th style={{ textAlign: 'right', padding: '4px 6px', color: '#888',    fontWeight: 600, fontSize: 10 }}>Margin</th>
                              <th style={{ width: 24 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {svc.zones.map(r => {
                              const origIdx = rates.indexOf(r);
                              return (
                                <tr key={origIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '4px 6px', color: '#AAAAAA', fontSize: 11, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.zone_name || '—'}</td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right', color: '#B39DDB', fontFamily: 'monospace', fontSize: 11 }}>{gbp(r.cost_price)}</td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                    {isEditable ? (
                                      <input value={r.markup_pct ?? ''} type="number" step="0.1" placeholder="%"
                                        onChange={e => applyMarkupToRate(origIdx, e.target.value)}
                                        style={{ width: 56, textAlign: 'right', fontFamily: 'monospace', fontSize: 11,
                                          color: '#A5B4FC', fontWeight: 700, background: 'rgba(99,102,241,0.1)',
                                          border: '1px solid rgba(99,102,241,0.4)', borderRadius: 9999, padding: '2px 6px', outline: 'none' }} />
                                    ) : <span style={{ color: '#A5B4FC', fontFamily: 'monospace', fontWeight: 700 }}>{r.markup_pct != null ? `${r.markup_pct}%` : '—'}</span>}
                                  </td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                    {isEditable ? (
                                      <input value={r.price ?? ''} type="number" step="0.01" placeholder="0.00"
                                        onChange={e => updateRate(origIdx, 'price', e.target.value)}
                                        style={{ width: 60, textAlign: 'right', fontFamily: 'monospace', fontSize: 11,
                                          color: '#00C853', background: 'rgba(0,200,83,0.08)',
                                          border: '1px solid rgba(0,200,83,0.25)', borderRadius: 9999, padding: '2px 6px', outline: 'none' }} />
                                    ) : <span style={{ color: '#00C853', fontFamily: 'monospace' }}>{gbp(r.price)}</span>}
                                  </td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right' }}><MarkupChip sell={r.price} cost={r.cost_price} /></td>
                                  <td style={{ padding: '4px 6px' }}>
                                    {isEditable && (
                                      <button onClick={() => removeRow(origIdx)}
                                        style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 2 }}>
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
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Projections
            </div>

            {/* Projection output — shown at top */}
            {projections ? (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Revenue / wk</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#A5B4FC' }}>{gbp(projections.rev)}</div>
                  </div>
                  <div style={{ background: 'rgba(179,157,219,0.06)', border: '1px solid rgba(179,157,219,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Cost / wk</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#B39DDB' }}>{gbp(projections.cost)}</div>
                  </div>
                  <div style={{ background: projections.profit >= 0 ? 'rgba(0,200,83,0.07)' : 'rgba(239,68,68,0.07)',
                    border: `1px solid ${projections.profit >= 0 ? 'rgba(0,200,83,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Profit / wk</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: projections.profit >= 0 ? '#00C853' : '#EF4444' }}>{gbp(projections.profit)}</div>
                        <div style={{ fontSize: 11, color: projections.profit >= 0 ? '#00C853' : '#EF4444', marginTop: 2 }}>{projections.margin.toFixed(1)}% margin</div>
                      </div>
                      <button
                        onClick={() => setShowDebug(d => !d)}
                        title="Show calculation breakdown"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
                          borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          background: showDebug ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${showDebug ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: showDebug ? '#F59E0B' : '#555', marginTop: 2 }}>
                        {showDebug ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                        Debug
                      </button>
                    </div>
                  </div>
                </div>

                {/* Debug breakdown */}
                {showDebug && (
                  <div style={{ marginTop: 10, background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(245,158,11,0.1)', fontSize: 10, color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Calculation Breakdown — Zone 1 (lowest zone) per service
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                            <th style={{ padding: '5px 8px', textAlign: 'left',  color: '#666', fontWeight: 600 }}>Service</th>
                            <th style={{ padding: '5px 6px', textAlign: 'left',  color: '#666', fontWeight: 600 }}>Zone used</th>
                            <th style={{ padding: '5px 6px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Mix</th>
                            <th style={{ padding: '5px 6px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Qty</th>
                            <th style={{ padding: '5px 6px', textAlign: 'right', color: '#B39DDB', fontWeight: 600 }}>Cost</th>
                            <th style={{ padding: '5px 6px', textAlign: 'right', color: '#00C853', fontWeight: 600 }}>Sell</th>
                            <th style={{ padding: '5px 6px', textAlign: 'right', color: '#A5B4FC', fontWeight: 600 }}>Rev</th>
                            <th style={{ padding: '5px 6px', textAlign: 'right', color: '#34D399', fontWeight: 600 }}>Profit</th>
                            <th style={{ padding: '5px 6px', textAlign: 'right', color: '#888',    fontWeight: 600 }}>Mgn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projections.lines.map((ln, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)',
                              opacity: ln.matched ? 1 : 0.4 }}>
                              <td style={{ padding: '4px 8px', color: ln.matched ? '#CCC' : '#555', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ln.service_name}
                                {!ln.matched && <span style={{ marginLeft: 4, color: '#EF4444', fontSize: 9 }}>no rate</span>}
                              </td>
                              <td style={{ padding: '4px 6px' }}>
                                {ln.zone_name
                                  ? <span style={{ fontSize: 10, color: '#F59E0B', fontFamily: 'monospace',
                                      background: 'rgba(245,158,11,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                                      {ln.zone_name}
                                      {ln.zone_count > 1 && <span style={{ color: '#555', marginLeft: 3 }}>/{ln.zone_count}</span>}
                                    </span>
                                  : <span style={{ color: '#444', fontSize: 10 }}>—</span>}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#888',    fontFamily: 'monospace' }}>{ln.pct}%</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#AAA',    fontFamily: 'monospace' }}>{ln.qty.toLocaleString()}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#B39DDB', fontFamily: 'monospace' }}>{ln.cost_price != null ? gbp(ln.cost_price) : '—'}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#00C853', fontFamily: 'monospace', fontWeight: 700 }}>{ln.sell != null ? gbp(ln.sell) : '—'}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#A5B4FC', fontFamily: 'monospace' }}>{ln.rev != null ? gbp(ln.rev) : '—'}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace',
                                color: ln.profit == null ? '#555' : ln.profit >= 0 ? '#34D399' : '#EF4444' }}>
                                {ln.profit != null ? gbp(ln.profit) : '—'}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace',
                                color: ln.margin == null ? '#555' : ln.margin < 0 ? '#EF4444' : ln.margin < 15 ? '#F59E0B' : '#34D399' }}>
                                {ln.margin != null ? `${ln.margin.toFixed(1)}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                            <td colSpan={6} style={{ padding: '5px 8px', fontSize: 10, color: '#666', fontStyle: 'italic' }}>
                              Lowest numbered zone per service · {parseInt(weeklyParcels).toLocaleString()} parcels/wk
                            </td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', color: '#A5B4FC', fontFamily: 'monospace', fontWeight: 700 }}>{gbp(projections.rev)}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                              color: projections.profit >= 0 ? '#34D399' : '#EF4444' }}>{gbp(projections.profit)}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                              color: projections.margin < 0 ? '#EF4444' : projections.margin < 15 ? '#F59E0B' : '#34D399' }}>
                              {projections.margin.toFixed(1)}%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div style={{ padding: '6px 10px', fontSize: 10, color: '#555', borderTop: '1px solid rgba(245,158,11,0.08)' }}>
                      Zone column shows which zone was matched and how many zones exist (e.g. Zone 1/8). 🟠 No rate = excluded from totals.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#444', textAlign: 'center', padding: '10px 0 16px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 16 }}>
                {!weeklyParcels ? 'Enter weekly parcels below' :
                 mixTotal !== 100 ? `Mix must total 100% (${mixTotal}%)` :
                 'Add rates to calculate'}
              </div>
            )}

            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Est. weekly parcels</label>
            <input value={weeklyParcels} onChange={e => { setWeeklyParcels(e.target.value); markDirty(); }}
              type="number" min={0} disabled={!isEditable}
              style={{ ...inputStyle, marginBottom: 16 }} placeholder="e.g. 500" />

            {/* Volume mix */}
            {volumeMix.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Volume mix
                    {mixLoading && <RefreshCw size={10} style={{ color: '#555', animation: 'spin 1s linear infinite' }} />}
                  </span>
                  <span style={{ color: mixTotal === 100 ? '#34D399' : '#F59E0B', fontWeight: 700 }}>{mixTotal}%</span>
                </div>
                {/* Source: similar customers */}
                {mixMeta && (
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 99, padding: '2px 8px', color: '#6366F1', fontWeight: 600 }}>
                      {mixMeta.customer_count === 0
                        ? 'No similar customers found — adjust manually'
                        : `Based on ${mixMeta.customer_count} similar customer${mixMeta.customer_count === 1 ? '' : 's'} · avg ${mixMeta.weekly_avg_min}–${mixMeta.weekly_avg_max}/wk`}
                    </span>
                  </div>
                )}
                {volumeMix.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#CCC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {m.service_name || m.service_code}
                      </div>
                      {m.service_name && m.service_name !== m.service_code && (
                        <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', marginTop: 1 }}>{m.service_code}</div>
                      )}
                    </div>
                    <input
                      type="number" min={0} max={100} value={m.pct}
                      onChange={e => {
                        setVolumeMix(prev => prev.map((x, j) => j === i ? { ...x, pct: parseFloat(e.target.value) || 0 } : x));
                        markDirty();
                      }}
                      disabled={!isEditable}
                      style={{ ...inputStyle, width: 56, padding: '4px 8px', fontSize: 12, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, color: '#555' }}>%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
