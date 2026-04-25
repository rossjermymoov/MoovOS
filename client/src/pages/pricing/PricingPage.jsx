/**
 * PricingPage — Prospects, Rate Cards & Approval workflow
 */
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Building2, User, Mail, Phone,
  ChevronDown, ChevronUp, ChevronRight,
  Check, X, AlertCircle, ArrowLeft, ArrowRight,
  Send, FileText, Users, TrendingUp, Package,
  RefreshCw, Edit2, Eye,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ─── API helpers ──────────────────────────────────────────────────────────────

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
const pricingApi = {
  stats:        ()        => apiFetch('/api/pricing/stats'),
  prospects:    (p)       => apiFetch(`/api/pricing/prospects?${new URLSearchParams(p)}`),
  createProspect: (b)     => apiFetch('/api/pricing/prospects', { method: 'POST', body: b }),
  patchProspect: (id, b)  => apiFetch(`/api/pricing/prospects/${id}`, { method: 'PATCH', body: b }),
  categories:   ()        => apiFetch('/api/pricing/categories'),
  templates:    (p)       => apiFetch(`/api/pricing/templates?${new URLSearchParams(p)}`),
  rateCards:    (pid)     => apiFetch(`/api/pricing/prospects/${pid}/rate-cards`),
  createRateCard: (pid,b) => apiFetch(`/api/pricing/prospects/${pid}/rate-cards`, { method: 'POST', body: b }),
  updateRateCard: (id, b) => apiFetch(`/api/pricing/rate-cards/${id}`, { method: 'PUT', body: b }),
  submitApproval: (id, b) => apiFetch(`/api/pricing/rate-cards/${id}/submit-for-approval`, { method: 'POST', body: b }),
  pendingApprovals: ()    => apiFetch('/api/pricing/approvals/pending'),
  reviewApproval: (id, b) => apiFetch(`/api/pricing/approvals/${id}/review`, { method: 'POST', body: b }),
};
const staffApi = { list: () => apiFetch('/api/staff') };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const gbp  = (n) => n == null ? '—' : `£${parseFloat(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct  = (n) => n == null ? '—' : `${parseFloat(n).toFixed(1)}%`;
const fmtD = (dt) => { try { return format(parseISO(dt), 'd MMM yy'); } catch { return '—'; } };
const markupPct = (sell, cost) => {
  if (!sell || !cost || parseFloat(cost) === 0) return null;
  return ((parseFloat(sell) - parseFloat(cost)) / parseFloat(cost)) * 100;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  quote:            { label: 'Quote',           color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  pending_approval: { label: 'Pending Approval',color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)' },
  approved:         { label: 'Approved',         color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  sent:             { label: 'Sent',             color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  form_returned:    { label: 'Form Returned',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  onboarding:       { label: 'Onboarding',       color: '#34D399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)' },
  converted:        { label: 'Converted',        color: '#00C853', bg: 'rgba(0,200,83,0.12)',    border: 'rgba(0,200,83,0.3)' },
  lost:             { label: 'Lost',             color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
};

function StatusBadge({ status }) {
  const c = STATUS[status] || { label: status, color: '#888', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: c.bg,
      border: `1px solid ${c.border}`, color: c.color, borderRadius: 20,
      padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

// ─── KPI stat card ────────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#AAAAAA', tooltip, bg = 'rgba(255,255,255,0.04)' }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onMouseEnter={() => tooltip && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ position: 'relative', background: bg, border: `1px solid ${color}33`,
        borderRadius: 10, padding: '14px 18px', minWidth: 130, flex: 1,
        cursor: tooltip ? 'default' : undefined }}>
      <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {tooltip && open && tooltip.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#1A1B3A', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '10px 14px', minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>In Onboarding</div>
          {tooltip.map(t => (
            <div key={t.id} style={{ fontSize: 12, color: '#DDD', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontWeight: 700 }}>{t.company_name}</span>
              <span style={{ color: '#666', marginLeft: 6 }}>{t.contact_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COURIERS ─────────────────────────────────────────────────────────────────

const COURIERS = ['DPD', 'DHL', 'EVRI', 'UPS', 'ROYAL_MAIL'];
const COURIER_LABELS = { DPD: 'DPD', DHL: 'DHL', EVRI: 'Evri', UPS: 'UPS', ROYAL_MAIL: 'Royal Mail' };

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < current ? '#00C853' : i === current ? '#6366F1' : 'rgba(255,255,255,0.08)',
              border: `2px solid ${i < current ? '#00C853' : i === current ? '#818CF8' : 'rgba(255,255,255,0.12)'}`,
              fontSize: 12, fontWeight: 700, color: i <= current ? '#fff' : '#555',
            }}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === current ? '#A5B4FC' : '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#00C853' : 'rgba(255,255,255,0.08)', margin: '0 6px', marginBottom: 18 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Input / Select helpers ───────────────────────────────────────────────────

function Field({ label, error, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, padding: '8px 11px', color: '#fff', fontSize: 13, outline: 'none',
};
const selectStyle = { ...inputStyle };

// ─── Create Wizard Modal ───────────────────────────────────────────────────────

function CreateWizard({ onClose, onSuccess }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Step 1: Prospect details
  const [form1, setForm1] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', assigned_to: '' });
  // Step 2: Courier + template
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // Step 3: Rates
  const [rates, setRates] = useState([]);
  const [intlMarkup, setIntlMarkup] = useState('');
  const [fuelMarkup, setFuelMarkup] = useState('');
  // Step 4: Projections
  const [weeklyParcels, setWeeklyParcels] = useState('');
  const [volumeMix, setVolumeMix] = useState([]);
  const [prospectId, setProspectId] = useState(null);

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: staffApi.list });
  const { data: categories = [] } = useQuery({ queryKey: ['pricing-categories'], queryFn: pricingApi.categories });
  const { data: templates = [] } = useQuery({
    queryKey: ['pricing-templates', selectedCourier],
    queryFn: () => pricingApi.templates({ courier_code: selectedCourier, active: 'true' }),
    enabled: !!selectedCourier,
  });

  // When template selected, clone rates from it
  useEffect(() => {
    if (selectedTemplate) {
      const r = (selectedTemplate.rates || []).map(rt => ({ ...rt }));
      setRates(r);
      setFuelMarkup(selectedTemplate.fuel_markup_pct ?? '');
      // Build volume mix from unique service codes
      const codes = [...new Set(r.filter(x => !x.is_international).map(x => x.service_code))];
      const even = codes.length > 0 ? Math.floor(100 / codes.length) : 0;
      const rem  = codes.length > 0 ? 100 - even * codes.length : 0;
      setVolumeMix(codes.map((sc, i) => ({ service_code: sc, pct: i === 0 ? even + rem : even })));
    }
  }, [selectedTemplate]);

  const createProspectMut = useMutation({
    mutationFn: pricingApi.createProspect,
    onSuccess: (data) => setProspectId(data.id),
  });
  const createRCMut = useMutation({
    mutationFn: ({ pid, body }) => pricingApi.createRateCard(pid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-prospects'] });
      qc.invalidateQueries({ queryKey: ['pricing-stats'] });
      onSuccess?.();
    },
  });

  const validate1 = () => {
    const e = {};
    if (!form1.company_name.trim()) e.company_name = 'Required';
    if (!form1.contact_name.trim()) e.contact_name = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const goNext = async () => {
    if (step === 0) {
      if (!validate1()) return;
      // Create prospect now so we have an ID
      if (!prospectId) {
        const p = await createProspectMut.mutateAsync({
          company_name: form1.company_name.trim(),
          contact_name: form1.contact_name.trim(),
          contact_email: form1.contact_email || null,
          contact_phone: form1.contact_phone || null,
          assigned_to: form1.assigned_to || null,
        });
        setProspectId(p.id);
      }
      setStep(1);
    } else if (step === 1) {
      if (!selectedCourier) { setErrors({ courier: 'Select a courier' }); return; }
      if (!selectedTemplate) { setErrors({ template: 'Select a template' }); return; }
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      setErrors({});
      setStep(3);
    } else if (step === 3) {
      // Save rate card
      const pid = prospectId;
      await createRCMut.mutateAsync({
        pid,
        body: {
          template_id: selectedTemplate.id,
          courier_code: selectedCourier,
          courier_name: COURIER_LABELS[selectedCourier] || selectedCourier,
          rates,
          fuel_markup_pct: fuelMarkup ? parseFloat(fuelMarkup) : null,
          intl_markup_pct: intlMarkup ? parseFloat(intlMarkup) : null,
          weekly_parcels: weeklyParcels ? parseInt(weeklyParcels) : null,
          volume_mix: volumeMix,
        },
      });
    }
  };

  const goPrev = () => setStep(s => Math.max(0, s - 1));

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => String(t.category_id) === String(selectedCategory));

  const domesticRates = rates.filter(r => !r.is_international);
  const intlRates     = rates.filter(r => r.is_international);

  // Group domestic rates by service
  const serviceGroups = domesticRates.reduce((acc, r) => {
    if (!acc[r.service_code]) acc[r.service_code] = [];
    acc[r.service_code].push(r);
    return acc;
  }, {});

  const mixTotal = volumeMix.reduce((s, m) => s + parseFloat(m.pct || 0), 0);

  const STEP_LABELS = ['Company', 'Template', 'Rates', 'Projections'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#14152E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
        width: '100%', maxWidth: step === 2 ? 860 : 580, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Create Rate Card</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
          <StepIndicator current={step} steps={STEP_LABELS} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Step 0: Company & Contact ─────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>
                Enter the prospect's details. A prospect record will be created when you click Next.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="Company Name" required error={errors.company_name}>
                  <input style={inputStyle} value={form1.company_name}
                    onChange={e => setForm1(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Acme Logistics Ltd" />
                </Field>
                <Field label="Contact Name" required error={errors.contact_name}>
                  <input style={inputStyle} value={form1.contact_name}
                    onChange={e => setForm1(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Jane Smith" />
                </Field>
                <Field label="Contact Email">
                  <input style={inputStyle} type="email" value={form1.contact_email}
                    onChange={e => setForm1(p => ({ ...p, contact_email: e.target.value }))}
                    placeholder="jane@acme.com" />
                </Field>
                <Field label="Contact Phone">
                  <input style={inputStyle} value={form1.contact_phone}
                    onChange={e => setForm1(p => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="07700 900000" />
                </Field>
              </div>
              <Field label="Assign To">
                <select style={selectStyle} value={form1.assigned_to}
                  onChange={e => setForm1(p => ({ ...p, assigned_to: e.target.value }))}>
                  <option value="">— Unassigned —</option>
                  {staffList.filter?.(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* ── Step 1: Courier + Template ────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>
                Select a carrier and a rate card template to start from.
              </div>

              {/* Courier selector */}
              <Field label="Carrier" error={errors.courier}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COURIERS.map(c => (
                    <button key={c} onClick={() => { setSelectedCourier(c); setSelectedTemplate(null); setErrors({}); }}
                      style={{
                        padding: '7px 16px', borderRadius: 7, border: `1px solid ${selectedCourier === c ? '#6366F1' : 'rgba(255,255,255,0.12)'}`,
                        background: selectedCourier === c ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        color: selectedCourier === c ? '#A5B4FC' : '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      }}>
                      {COURIER_LABELS[c]}
                    </button>
                  ))}
                </div>
              </Field>

              {selectedCourier && (
                <>
                  {/* Category filter tabs */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
                    <button onClick={() => setSelectedCategory('all')}
                      style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        background: selectedCategory === 'all' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border: selectedCategory === 'all' ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.08)',
                        color: selectedCategory === 'all' ? '#A5B4FC' : '#666' }}>
                      All
                    </button>
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => setSelectedCategory(String(cat.id))}
                        style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                          background: selectedCategory === String(cat.id) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                          border: selectedCategory === String(cat.id) ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.08)',
                          color: selectedCategory === String(cat.id) ? '#A5B4FC' : '#666' }}>
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Template cards */}
                  {filteredTemplates.length === 0 ? (
                    <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
                      No templates found for {COURIER_LABELS[selectedCourier]} in this category.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {filteredTemplates.map(t => {
                        const sel = selectedTemplate?.id === t.id;
                        return (
                          <div key={t.id} onClick={() => setSelectedTemplate(t)}
                            style={{
                              border: `1px solid ${sel ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                              background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                              borderRadius: 9, padding: '12px 14px', cursor: 'pointer',
                            }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#A5B4FC' : '#DDD', marginBottom: 4 }}>{t.name}</div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              {t.category_name && (
                                <span style={{ fontSize: 10, color: '#6366F1', background: 'rgba(99,102,241,0.12)',
                                  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                                  {t.category_name}
                                </span>
                              )}
                              <span style={{ fontSize: 10, color: '#555' }}>
                                {(t.rates || []).filter(r => !r.is_international).length} domestic ·&nbsp;
                                {(t.rates || []).filter(r => r.is_international).length} intl rates
                              </span>
                            </div>
                            {t.description && (
                              <div style={{ fontSize: 11, color: '#666', marginTop: 5 }}>{t.description}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {errors.template && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 8 }}>{errors.template}</div>}
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Rate Editor ───────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#888' }}>
                  Edit sell prices for <span style={{ color: '#DDD', fontWeight: 700 }}>{selectedTemplate?.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#555' }}>Fuel markup %</span>
                  <input value={fuelMarkup} onChange={e => setFuelMarkup(e.target.value)}
                    style={{ ...inputStyle, width: 70, padding: '5px 8px', fontSize: 12 }} placeholder="—" />
                </div>
              </div>

              {/* Domestic rates table */}
              {domesticRates.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Domestic Rates
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                    {/* Table header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 90px 90px 90px 80px', gap: 0,
                      background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '7px 12px' }}>
                      {['Service', 'Zone', 'Cost', 'Sell (base)', 'Sell (sub)', 'Markup'].map(h => (
                        <div key={h} style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                      ))}
                    </div>
                    {domesticRates.map((r, idx) => {
                      const mu = markupPct(r.price, r.cost_price);
                      const muColor = mu == null ? '#555' : mu < 0 ? '#EF4444' : mu < 15 ? '#F59E0B' : '#34D399';
                      const origIdx = rates.indexOf(r);
                      return (
                        <div key={idx} style={{
                          display: 'grid', gridTemplateColumns: '1.4fr 1fr 90px 90px 90px 80px',
                          padding: '6px 12px', borderBottom: idx < domesticRates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          alignItems: 'center',
                        }}>
                          <div style={{ fontSize: 12, color: '#DDD', fontWeight: 600 }}>{r.service_name || r.service_code}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{r.zone_name}</div>
                          <div style={{ fontSize: 12, color: '#B39DDB' }}>{gbp(r.cost_price)}</div>
                          <input
                            value={r.price ?? ''}
                            onChange={e => setRates(prev => prev.map((x, i) => i === origIdx ? { ...x, price: e.target.value } : x))}
                            style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
                          />
                          <input
                            value={r.price_sub ?? ''}
                            onChange={e => setRates(prev => prev.map((x, i) => i === origIdx ? { ...x, price_sub: e.target.value } : x))}
                            style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
                          />
                          <div style={{ fontSize: 12, color: muColor, fontWeight: 700 }}>{mu != null ? `${mu.toFixed(1)}%` : '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* International rates */}
              {intlRates.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    International Rates
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#888' }}>Apply markup % across all {intlRates.length} international zones:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input value={intlMarkup} onChange={e => setIntlMarkup(e.target.value)}
                          style={{ ...inputStyle, width: 70, padding: '5px 8px', fontSize: 13 }} placeholder="0.0" />
                        <span style={{ color: '#888', fontSize: 13 }}>%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#555' }}>
                      {intlRates.slice(0, 3).map(r => r.zone_name).join(', ')}{intlRates.length > 3 ? ` +${intlRates.length - 3} more` : ''}
                    </div>
                  </div>
                </>
              )}

              {domesticRates.length === 0 && intlRates.length === 0 && (
                <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                  This template has no rates defined. You can still proceed and rates will be empty.
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Volume & Projections ─────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>
                Estimate weekly volumes to generate a projected revenue and margin.
              </div>

              <Field label="Estimated Weekly Parcels">
                <input value={weeklyParcels} onChange={e => setWeeklyParcels(e.target.value)}
                  type="number" min={0} style={{ ...inputStyle, maxWidth: 180 }} placeholder="e.g. 500" />
              </Field>

              {volumeMix.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Volume Mix <span style={{ fontWeight: 400, color: mixTotal === 100 ? '#34D399' : '#F59E0B' }}>({mixTotal}% total — must equal 100%)</span>
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                    {volumeMix.map((m, i) => {
                      const qty = weeklyParcels ? Math.round((m.pct / 100) * parseInt(weeklyParcels)) : null;
                      const matchRate = rates.find(r => r.service_code === m.service_code && !r.is_international);
                      return (
                        <div key={i} style={{
                          display: 'grid', gridTemplateColumns: '1.5fr 80px 80px 1fr',
                          padding: '8px 14px', borderBottom: i < volumeMix.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          alignItems: 'center',
                        }}>
                          <div style={{ fontSize: 13, color: '#DDD', fontWeight: 600 }}>{m.service_code}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number" min={0} max={100} value={m.pct}
                              onChange={e => setVolumeMix(prev => prev.map((x, j) => j === i ? { ...x, pct: parseFloat(e.target.value) || 0 } : x))}
                              style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, width: 56 }}
                            />
                            <span style={{ fontSize: 12, color: '#666' }}>%</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>{qty != null ? `~${qty.toLocaleString('en-GB')} pcls` : '—'}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{gbp(matchRate?.price)} sell · {gbp(matchRate?.cost_price)} cost</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Live projections */}
              {weeklyParcels > 0 && mixTotal === 100 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {(() => {
                    let rev = 0, cost = 0;
                    volumeMix.forEach(m => {
                      const qty = Math.round((m.pct / 100) * parseInt(weeklyParcels));
                      const r = rates.find(x => x.service_code === m.service_code && !x.is_international);
                      if (r) {
                        rev  += parseFloat(r.price || 0) * qty;
                        cost += parseFloat(r.cost_price || 0) * qty;
                      }
                    });
                    const profit = rev - cost;
                    const margin = rev > 0 ? (profit / rev * 100) : 0;
                    return (
                      <>
                        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9, padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Weekly Revenue</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#A5B4FC' }}>{gbp(rev)}</div>
                        </div>
                        <div style={{ background: 'rgba(179,157,219,0.06)', border: '1px solid rgba(179,157,219,0.2)', borderRadius: 9, padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Weekly Cost</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#B39DDB' }}>{gbp(cost)}</div>
                        </div>
                        <div style={{ background: profit >= 0 ? 'rgba(0,200,83,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${profit >= 0 ? 'rgba(0,200,83,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 9, padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Weekly Profit</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: profit >= 0 ? '#00C853' : '#EF4444' }}>{gbp(profit)}</div>
                          <div style={{ fontSize: 11, color: profit >= 0 ? '#00C853' : '#EF4444', marginTop: 2 }}>{margin.toFixed(1)}% margin</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              {weeklyParcels > 0 && mixTotal !== 100 && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#F59E0B' }}>
                  Volume mix must total 100% before projections can be calculated. Currently {mixTotal}%.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={step === 0 ? onClose : goPrev}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 16px',
              color: '#888', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            <ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button onClick={goNext}
            disabled={createProspectMut.isPending || createRCMut.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: step === 3 ? 'rgba(0,200,83,0.15)' : 'rgba(99,102,241,0.2)',
              border: `1px solid ${step === 3 ? 'rgba(0,200,83,0.4)' : '#6366F1'}`,
              borderRadius: 7, padding: '8px 20px',
              color: step === 3 ? '#00C853' : '#A5B4FC', fontSize: 13, cursor: 'pointer', fontWeight: 700,
              opacity: createProspectMut.isPending || createRCMut.isPending ? 0.6 : 1 }}>
            {createRCMut.isPending ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {step === 3 ? 'Save Rate Card' : 'Next'} {step < 3 ? <ArrowRight size={14} /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approval Banner ──────────────────────────────────────────────────────────

function ApprovalBanner({ approvals, onReview }) {
  const [open, setOpen] = useState(false);
  if (!approvals?.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)',
          borderRadius: 9, padding: '10px 16px',
        }}>
        <AlertCircle size={15} color="#FB923C" />
        <span style={{ fontSize: 13, color: '#FB923C', fontWeight: 700 }}>
          {approvals.length} rate card{approvals.length > 1 ? 's' : ''} awaiting your approval
        </span>
        <ChevronDown size={14} color="#FB923C" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <div style={{ border: '1px solid rgba(251,146,60,0.2)', borderTop: 'none', borderRadius: '0 0 9px 9px', overflow: 'hidden' }}>
          {approvals.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(251,146,60,0.04)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#DDD', fontWeight: 700 }}>{a.company_name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  {a.courier_code} · submitted by {a.requested_by_name} · {fmtD(a.requested_at)}
                </div>
              </div>
              {a.projected_weekly_revenue && (
                <div style={{ fontSize: 12, color: '#A5B4FC', fontWeight: 700 }}>{gbp(a.projected_weekly_revenue)}/wk</div>
              )}
              <button onClick={() => onReview(a)}
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid #6366F1', borderRadius: 6,
                  padding: '5px 14px', color: '#A5B4FC', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Review
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({ approval, onClose, onDone, staffList }) {
  const [comment, setComment] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const qc = useQueryClient();

  const reviewMut = useMutation({
    mutationFn: ({ status }) => pricingApi.reviewApproval(approval.id, { reviewed_by: reviewerId, status, comment }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing-approvals'] }); qc.invalidateQueries({ queryKey: ['pricing-stats'] }); onDone(); },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#14152E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: '100%', maxWidth: 480, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Review Rate Card</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#DDD', fontWeight: 700 }}>{approval.company_name}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            {approval.courier_code} · submitted by {approval.requested_by_name}
            {approval.projected_weekly_revenue && ` · ${gbp(approval.projected_weekly_revenue)}/wk projected`}
          </div>
        </div>
        <Field label="Reviewer (you)">
          <select style={selectStyle} value={reviewerId} onChange={e => setReviewerId(e.target.value)}>
            <option value="">— Select your name —</option>
            {staffList.filter(s => s.is_active && s.role !== 'user').map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
            ))}
          </select>
        </Field>
        <Field label="Comment (optional)">
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            style={{ ...inputStyle, height: 80, resize: 'vertical' }}
            placeholder="Any notes for the sales person..." />
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => reviewMut.mutate({ status: 'rejected' })} disabled={!reviewerId || reviewMut.isPending}
            style={{ flex: 1, padding: '9px 0', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 7, color: '#EF4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: !reviewerId ? 0.5 : 1 }}>
            <X size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Reject
          </button>
          <button onClick={() => reviewMut.mutate({ status: 'approved' })} disabled={!reviewerId || reviewMut.isPending}
            style={{ flex: 1, padding: '9px 0', background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.35)',
              borderRadius: 7, color: '#00C853', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: !reviewerId ? 0.5 : 1 }}>
            <Check size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Approve
          </button>
        </div>
        {reviewMut.error && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 8, textAlign: 'center' }}>{reviewMut.error.message}</div>}
      </div>
    </div>
  );
}

// ─── Prospect Row ─────────────────────────────────────────────────────────────

function ProspectRow({ prospect, onSubmitApproval, staffList }) {
  const [expanded, setExpanded] = useState(false);
  const [submitStaff, setSubmitStaff] = useState('');
  const qc = useQueryClient();

  const { data: rateCards = [], isLoading: rcLoading } = useQuery({
    queryKey: ['rate-cards', prospect.id],
    queryFn: () => pricingApi.rateCards(prospect.id),
    enabled: expanded,
  });

  const submitMut = useMutation({
    mutationFn: (rcId) => pricingApi.submitApproval(rcId, { requested_by: submitStaff }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing-prospects'] }); qc.invalidateQueries({ queryKey: ['pricing-approvals'] }); },
  });

  const rc = (prospect.rate_cards || rateCards || []);
  const couriers = [...new Set(rc.map(r => r.courier_code))].join(', ');
  const topRC = rc[0];

  return (
    <>
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 130px 120px 100px 110px 40px',
          padding: '10px 16px', alignItems: 'center', cursor: 'pointer',
          borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,0.05)',
          background: expanded ? 'rgba(99,102,241,0.05)' : 'transparent',
          transition: 'background 0.1s',
        }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#DDD' }}>{prospect.company_name}</div>
          <div style={{ fontSize: 11, color: '#666' }}>{prospect.contact_name}</div>
        </div>
        <div style={{ fontSize: 11, color: '#666' }}>{prospect.contact_email || '—'}</div>
        <div><StatusBadge status={prospect.status} /></div>
        <div style={{ fontSize: 12, color: '#888' }}>{couriers || '—'}</div>
        <div style={{ fontSize: 12, color: '#A5B4FC', fontWeight: 700 }}>
          {topRC?.projected_weekly_revenue ? gbp(topRC.projected_weekly_revenue) : '—'}
        </div>
        <div style={{ fontSize: 11, color: '#555' }}>{prospect.assigned_to_name || '—'}</div>
        <div style={{ color: '#555' }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
      </div>

      {expanded && (
        <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px 14px' }}>
          {rcLoading ? (
            <div style={{ color: '#555', fontSize: 12, padding: '8px 0' }}>Loading rate cards…</div>
          ) : rateCards.length === 0 ? (
            <div style={{ color: '#555', fontSize: 12 }}>No rate cards yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rateCards.map(rc => {
                const approvalStatus = rc.latest_approval?.status;
                return (
                  <div key={rc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#DDD', fontWeight: 600 }}>
                        {rc.courier_name || rc.courier_code}
                        {rc.template_name && <span style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>({rc.template_name})</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {(rc.rates || []).length} rates
                        {rc.weekly_parcels ? ` · ${rc.weekly_parcels.toLocaleString('en-GB')} parcels/wk` : ''}
                        {rc.projected_weekly_profit ? ` · ${gbp(rc.projected_weekly_profit)}/wk profit` : ''}
                      </div>
                    </div>
                    <StatusBadge status={rc.status} />
                    {rc.status === 'draft' && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select value={submitStaff} onChange={e => setSubmitStaff(e.target.value)}
                          style={{ ...selectStyle, padding: '4px 8px', fontSize: 11, width: 130 }}>
                          <option value="">Your name…</option>
                          {staffList.filter(s => s.is_active).map(s => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          ))}
                        </select>
                        <button onClick={() => submitMut.mutate(rc.id)} disabled={!submitStaff || submitMut.isPending}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.15)',
                            border: '1px solid #6366F1', borderRadius: 6, padding: '5px 12px',
                            color: '#A5B4FC', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            opacity: !submitStaff ? 0.5 : 1 }}>
                          <Send size={11} /> Submit
                        </button>
                      </div>
                    )}
                    {approvalStatus && (
                      <span style={{ fontSize: 11, color: approvalStatus === 'approved' ? '#34D399' : approvalStatus === 'rejected' ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                        {approvalStatus === 'approved' ? '✓ Approved' : approvalStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {prospect.contact_email && (
            <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 11, color: '#555' }}>
              {prospect.contact_email && <span><Mail size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{prospect.contact_email}</span>}
              {prospect.contact_phone && <span><Phone size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{prospect.contact_phone}</span>}
              <span>Added {fmtD(prospect.created_at)}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  const { data: stats } = useQuery({ queryKey: ['pricing-stats'], queryFn: pricingApi.stats, refetchInterval: 60_000 });
  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: staffApi.list });
  const { data: approvals = [] } = useQuery({ queryKey: ['pricing-approvals'], queryFn: pricingApi.pendingApprovals, refetchInterval: 30_000 });

  const { data: prospectsData, isLoading } = useQuery({
    queryKey: ['pricing-prospects', search, statusFilter],
    queryFn: () => pricingApi.prospects({ search, status: statusFilter, limit: 100 }),
    refetchInterval: 60_000,
  });
  const prospects = prospectsData?.prospects || [];

  const STATUS_FILTERS = [
    { value: '',                 label: 'All' },
    { value: 'quote',            label: 'Quote' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved',         label: 'Approved' },
    { value: 'sent',             label: 'Sent' },
    { value: 'form_returned',    label: 'Form Returned' },
    { value: 'onboarding',       label: 'Onboarding' },
    { value: 'converted',        label: 'Converted' },
    { value: 'lost',             label: 'Lost' },
  ];

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', fontFamily: 'system-ui, sans-serif', color: '#CCC' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>Pricing &amp; Rate Cards</h1>
          <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>Manage prospects, build rate cards, and track conversions</div>
        </div>
        <button onClick={() => setShowWizard(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,0.15)',
            border: '1px solid #6366F1', borderRadius: 8, padding: '9px 18px',
            color: '#A5B4FC', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={15} /> New Rate Card
        </button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Quotes Out"     value={stats?.quotes_out ?? '—'}     color="#F59E0B" />
        <StatCard label="Forms Sent"     value={stats?.forms_sent ?? '—'}     color="#A78BFA" />
        <StatCard label="Forms Returned" value={stats?.forms_returned ?? '—'} color="#60A5FA" />
        <StatCard
          label="In Onboarding"
          value={stats?.in_onboarding ?? '—'}
          color="#34D399"
          bg={stats?.in_onboarding > 0 ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.04)'}
          tooltip={stats?.onboarding_list}
        />
        <StatCard label="Converted" value={stats?.converted ?? '—'} color="#00C853" bg="rgba(0,200,83,0.05)" />
        <StatCard label="Lost"      value={stats?.lost ?? '—'}      color="#EF4444" />
      </div>

      {/* Pending approvals banner */}
      <ApprovalBanner approvals={approvals} onReview={a => setReviewTarget(a)} />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} color="#555" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company name…"
            style={{ ...inputStyle, paddingLeft: 30 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: statusFilter === f.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: statusFilter === f.value ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.08)',
                color: statusFilter === f.value ? '#A5B4FC' : '#666',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prospects table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 130px 120px 100px 110px 40px',
          padding: '8px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {['Company', 'Email', 'Status', 'Carrier(s)', 'Proj./wk', 'Assigned', ''].map(h => (
            <div key={h} style={{ fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#555', fontSize: 13 }}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />
            Loading prospects…
          </div>
        ) : prospects.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#444', fontSize: 14 }}>
            <Package size={28} color="#333" style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
            No prospects yet. Click <strong style={{ color: '#A5B4FC' }}>New Rate Card</strong> to get started.
          </div>
        ) : (
          prospects.map(p => (
            <ProspectRow key={p.id} prospect={p} staffList={staffList} />
          ))
        )}
      </div>

      {prospectsData?.total > prospects.length && (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 10 }}>
          Showing {prospects.length} of {prospectsData.total} prospects
        </div>
      )}

      {/* Wizard */}
      {showWizard && (
        <CreateWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false);
            qc.invalidateQueries({ queryKey: ['pricing-prospects'] });
            qc.invalidateQueries({ queryKey: ['pricing-stats'] });
          }}
        />
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          approval={reviewTarget}
          staffList={staffList}
          onClose={() => setReviewTarget(null)}
          onDone={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
