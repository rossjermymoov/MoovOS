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

  // Load rate card detail — we'll use the existing rate-cards endpoint via prospect
  // We need a direct endpoint for a single rate card. Add a route alias.
  const { data: rc, isLoading, error } = useQuery({
    queryKey: ['rate-card-detail', id],
    queryFn: () => apiFetch(`/api/pricing/rate-card/${id}`),
  });

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: api.staffList });

  // Initialise local state when rate card loads
  useEffect(() => {
    if (rc) {
      setRates((rc.rates || []).map(r => ({ ...r })));
      setIntlMarkup(rc.intl_markup_pct ?? '');
      setFuelMarkup(rc.fuel_markup_pct ?? '');
      setWeeklyParcels(rc.weekly_parcels ?? '');
      // Build volume mix from rate card or derive from service codes
      if (rc.volume_mix?.length) {
        setVolumeMix(rc.volume_mix.map(m => ({ ...m })));
      } else {
        const codes = [...new Set((rc.rates || []).filter(r => !r.is_international).map(r => r.service_code))];
        const even  = codes.length > 0 ? Math.floor(100 / codes.length) : 0;
        const rem   = codes.length > 0 ? 100 - even * codes.length : 0;
        setVolumeMix(codes.map((sc, i) => ({ service_code: sc, pct: i === 0 ? even + rem : even })));
      }
      setDirty(false);
    }
  }, [rc]);

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

  const domesticRates = rates.filter(r => !r.is_international);
  const intlRates     = rates.filter(r => r.is_international);

  // ── Projections ───────────────────────────────────────────────────────────

  const mixTotal = volumeMix.reduce((s, m) => s + parseFloat(m.pct || 0), 0);
  const projections = (() => {
    if (!weeklyParcels || mixTotal !== 100) return null;
    let rev = 0, cost = 0;
    volumeMix.forEach(m => {
      const qty = Math.round((m.pct / 100) * parseInt(weeklyParcels));
      const r = domesticRates.find(x => x.service_code === m.service_code);
      if (r) {
        rev  += parseFloat(r.price || 0) * qty;
        cost += parseFloat(r.cost_price || 0) * qty;
      }
    });
    const profit = rev - cost;
    return { rev, cost, profit, margin: rev > 0 ? profit / rev * 100 : 0 };
  })();

  // ── Service codes from domestic rates (for volume mix) ────────────────────

  const serviceCodes = [...new Set(domesticRates.map(r => r.service_code).filter(Boolean))];
  // Sync volume mix when service codes change
  useEffect(() => {
    if (!rc) return;
    setVolumeMix(prev => {
      const existing = new Map(prev.map(m => [m.service_code, m.pct]));
      const next = serviceCodes.map(sc => ({ service_code: sc, pct: existing.get(sc) ?? 0 }));
      return next;
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
            <label style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 7 }}>
              Intl markup %
              <input value={intlMarkup} onChange={e => { setIntlMarkup(e.target.value); markDirty(); }}
                disabled={!isEditable}
                style={{ ...inputStyle, width: 70, padding: '4px 8px' }} placeholder="—" />
            </label>
          </div>

          {/* Domestic rates */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Domestic Rates <span style={{ color: '#444', fontWeight: 400 }}>({domesticRates.length})</span>
              </div>
              {isEditable && (
                <button onClick={addDomesticRow}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px',
                    color: '#888', fontSize: 11, cursor: 'pointer' }}>
                  <Plus size={11} /> Add row
                </button>
              )}
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 0.9fr 0.9fr 70px 30px',
                padding: '7px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Service', 'Zone', 'Cost price', 'Sell (base)', 'Sell (sub)', 'Markup', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                ))}
              </div>

              {domesticRates.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#444', fontSize: 12 }}>
                  No domestic rates yet.{isEditable ? ' Click "Add row" to start.' : ''}
                </div>
              ) : (
                domesticRates.map((r, i) => {
                  const origIdx = rates.indexOf(r);
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 0.9fr 0.9fr 70px 30px',
                      padding: '5px 12px', alignItems: 'center',
                      borderBottom: i < domesticRates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      {/* Service */}
                      {isEditable
                        ? <input value={r.service_name || r.service_code || ''}
                            onChange={e => updateRate(origIdx, 'service_name', e.target.value)}
                            style={{ ...inputStyle, fontSize: 12 }} placeholder="Service name" />
                        : <div style={{ fontSize: 12, color: '#DDD', fontWeight: 600 }}>{r.service_name || r.service_code || '—'}</div>
                      }
                      {/* Zone */}
                      {isEditable
                        ? <input value={r.zone_name || ''}
                            onChange={e => updateRate(origIdx, 'zone_name', e.target.value)}
                            style={{ ...inputStyle, fontSize: 12 }} placeholder="Zone" />
                        : <div style={{ fontSize: 12, color: '#888' }}>{r.zone_name || '—'}</div>
                      }
                      {/* Cost price (read-only) */}
                      <div style={{ fontSize: 12, color: '#B39DDB', fontWeight: 600 }}>{gbp(r.cost_price)}</div>
                      {/* Sell base */}
                      {isEditable
                        ? <input value={r.price ?? ''}
                            onChange={e => updateRate(origIdx, 'price', e.target.value)}
                            style={{ ...inputStyle, fontSize: 12 }} placeholder="0.00" type="number" step="0.01" />
                        : <div style={{ fontSize: 12, color: '#DDD' }}>{gbp(r.price)}</div>
                      }
                      {/* Sell sub */}
                      {isEditable
                        ? <input value={r.price_sub ?? ''}
                            onChange={e => updateRate(origIdx, 'price_sub', e.target.value)}
                            style={{ ...inputStyle, fontSize: 12 }} placeholder="0.00" type="number" step="0.01" />
                        : <div style={{ fontSize: 12, color: '#DDD' }}>{gbp(r.price_sub)}</div>
                      }
                      {/* Markup */}
                      <MarkupChip sell={r.price} cost={r.cost_price} />
                      {/* Delete */}
                      {isEditable
                        ? <button onClick={() => removeRow(origIdx)}
                            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 3 }}>
                            <Trash2 size={12} />
                          </button>
                        : <div />
                      }
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* International rates */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                International Rates <span style={{ color: '#444', fontWeight: 400 }}>({intlRates.length})</span>
              </div>
              {isEditable && (
                <button onClick={addIntlRow}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px',
                    color: '#888', fontSize: 11, cursor: 'pointer' }}>
                  <Plus size={11} /> Add row
                </button>
              )}
            </div>

            {intlMarkup && (
              <div style={{ fontSize: 11, color: '#A78BFA', marginBottom: 8 }}>
                Markup of <strong>{intlMarkup}%</strong> applied across all international zones
              </div>
            )}

            {intlRates.length > 0 && (
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 0.9fr 0.9fr 70px 30px',
                  padding: '7px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Service', 'Zone', 'Cost price', 'Sell (base)', 'Sell (sub)', 'Markup', ''].map(h => (
                    <div key={h} style={{ fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                  ))}
                </div>
                {intlRates.map((r, i) => {
                  const origIdx = rates.indexOf(r);
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 0.9fr 0.9fr 70px 30px',
                      padding: '5px 12px', alignItems: 'center',
                      borderBottom: i < intlRates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      {isEditable
                        ? <input value={r.service_name || r.service_code || ''} onChange={e => updateRate(origIdx, 'service_name', e.target.value)} style={{ ...inputStyle, fontSize: 12 }} placeholder="Zone name" />
                        : <div style={{ fontSize: 12, color: '#DDD' }}>{r.service_name || r.service_code || '—'}</div>
                      }
                      {isEditable
                        ? <input value={r.zone_name || ''} onChange={e => updateRate(origIdx, 'zone_name', e.target.value)} style={{ ...inputStyle, fontSize: 12 }} placeholder="Region" />
                        : <div style={{ fontSize: 12, color: '#888' }}>{r.zone_name || '—'}</div>
                      }
                      <div style={{ fontSize: 12, color: '#B39DDB' }}>{gbp(r.cost_price)}</div>
                      {isEditable
                        ? <input value={r.price ?? ''} onChange={e => updateRate(origIdx, 'price', e.target.value)} style={{ ...inputStyle, fontSize: 12 }} placeholder="0.00" type="number" step="0.01" />
                        : <div style={{ fontSize: 12, color: '#DDD' }}>{gbp(r.price)}</div>
                      }
                      {isEditable
                        ? <input value={r.price_sub ?? ''} onChange={e => updateRate(origIdx, 'price_sub', e.target.value)} style={{ ...inputStyle, fontSize: 12 }} placeholder="0.00" type="number" step="0.01" />
                        : <div style={{ fontSize: 12, color: '#DDD' }}>{gbp(r.price_sub)}</div>
                      }
                      <MarkupChip sell={r.price} cost={r.cost_price} />
                      {isEditable
                        ? <button onClick={() => removeRow(origIdx)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 3 }}><Trash2 size={12} /></button>
                        : <div />
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Projections ────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Projections
            </div>

            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Est. weekly parcels</label>
            <input value={weeklyParcels} onChange={e => { setWeeklyParcels(e.target.value); markDirty(); }}
              type="number" min={0} disabled={!isEditable}
              style={{ ...inputStyle, marginBottom: 16 }} placeholder="e.g. 500" />

            {/* Volume mix */}
            {volumeMix.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Volume mix</span>
                  <span style={{ color: mixTotal === 100 ? '#34D399' : '#F59E0B', fontWeight: 700 }}>{mixTotal}%</span>
                </div>
                {volumeMix.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, fontSize: 11, color: '#AAA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.service_code}</div>
                    <input
                      type="number" min={0} max={100} value={m.pct}
                      onChange={e => {
                        setVolumeMix(prev => prev.map((x, j) => j === i ? { ...x, pct: parseFloat(e.target.value) || 0 } : x));
                        markDirty();
                      }}
                      disabled={!isEditable}
                      style={{ ...inputStyle, width: 56, padding: '4px 8px', fontSize: 12 }}
                    />
                    <span style={{ fontSize: 11, color: '#555' }}>%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Projection output */}
            {projections ? (
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
                  <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Profit / wk</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: projections.profit >= 0 ? '#00C853' : '#EF4444' }}>{gbp(projections.profit)}</div>
                  <div style={{ fontSize: 11, color: projections.profit >= 0 ? '#00C853' : '#EF4444', marginTop: 2 }}>{projections.margin.toFixed(1)}% margin</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#444', textAlign: 'center', padding: '12px 0' }}>
                {!weeklyParcels ? 'Enter weekly parcels to see projections' :
                 mixTotal !== 100 ? `Volume mix must total 100% (currently ${mixTotal}%)` :
                 'Add service codes to rates to calculate'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
