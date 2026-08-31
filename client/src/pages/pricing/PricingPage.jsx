/**
 * PricingPage — Prospects, Rate Cards & Approval workflow
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Mail, Phone,
  ChevronDown, ChevronUp,
  Check, X, AlertCircle, ArrowLeft, ArrowRight,
  Send, Package, RefreshCw, Edit2, Trash2,
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
  stats:           ()       => apiFetch('/api/pricing/stats'),
  prospects:       (p)      => apiFetch(`/api/pricing/prospects?${new URLSearchParams(p)}`),
  createProspect:  (b)      => apiFetch('/api/pricing/prospects', { method: 'POST', body: b }),
  templates:       (p)      => apiFetch(`/api/pricing/templates?${new URLSearchParams(p)}`),
  createRateCard:  (pid, b) => apiFetch(`/api/pricing/prospects/${pid}/rate-cards`, { method: 'POST', body: b }),
  rateCards:       (pid)    => apiFetch(`/api/pricing/prospects/${pid}/rate-cards`),
  patchProspect:   (id, b)  => apiFetch(`/api/pricing/prospects/${id}`, { method: 'PATCH', body: b }),
  deleteProspect:  (id)     => apiFetch(`/api/pricing/prospects/${id}`, { method: 'DELETE' }),
  submitApproval:  (id, b)  => apiFetch(`/api/pricing/rate-cards/${id}/submit-for-approval`, { method: 'POST', body: b }),
  pendingApprovals:()       => apiFetch('/api/pricing/approvals/pending'),
  reviewApproval:  (id, b)  => apiFetch(`/api/pricing/approvals/${id}/review`, { method: 'POST', body: b }),
};
const staffApi = { list: () => apiFetch('/api/staff') };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const gbp  = (n) => n == null ? '—' : `£${parseFloat(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtD = (dt) => { try { return format(parseISO(dt), 'd MMM yy'); } catch { return '—'; } };

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  quote:            { label: 'Quote',            color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  pending_approval: { label: 'Pending Approval', color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)' },
  approved:         { label: 'Approved',          color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  sent:             { label: 'Sent',              color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  form_returned:    { label: 'Form Returned',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  onboarding:       { label: 'Onboarding',        color: '#34D399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)' },
  converted:        { label: 'Converted',         color: '#00C853', bg: 'rgba(0,200,83,0.12)',    border: 'rgba(0,200,83,0.3)' },
  lost:             { label: 'Lost',              color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
};

function StatusBadge({ status }) {
  const c = STATUS[status] || { label: status, color: '#64748B', bg: 'rgba(0,0,0,0.06)', border: 'rgba(0,0,0,0.08)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: c.bg,
      border: `1px solid ${c.border}`, color: c.color, borderRadius: 20,
      padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#64748B', tooltip, bg = 'rgba(0,0,0,0.03)' }) {
  const [open, setOpen] = useState(false);
  return (
    <div onMouseEnter={() => tooltip && setOpen(true)} onMouseLeave={() => setOpen(false)}
      style={{ position: 'relative', background: bg, border: `1px solid ${color}33`,
        borderRadius: 10, padding: '14px 18px', minWidth: 130, flex: 1 }}>
      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {tooltip && open && tooltip.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#1A1B3A', border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 8, padding: '10px 14px', minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>In Onboarding</div>
          {tooltip.map(t => (
            <div key={t.id} style={{ fontSize: 12, color: '#334155', padding: '3px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontWeight: 700 }}>{t.company_name}</span>
              <span style={{ color: '#64748B', marginLeft: 6 }}>{t.contact_name}</span>
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

// ─── Input helpers ────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: 7, padding: '8px 11px', color: '#0F172A', fontSize: 13, outline: 'none',
};
const selectStyle = { ...inputStyle };

function Field({ label, error, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

// ─── Step indicator (2 steps) ─────────────────────────────────────────────────

function StepIndicator({ current }) {
  const steps = ['Prospect', 'Template'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < current ? '#00C853' : i === current ? '#6366F1' : 'rgba(0,0,0,0.08)',
              border: `2px solid ${i < current ? '#00C853' : i === current ? '#818CF8' : 'rgba(0,0,0,0.10)'}`,
              fontSize: 12, fontWeight: 700, color: i <= current ? '#fff' : '#475569',
            }}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === current ? '#A5B4FC' : '#475569', fontWeight: 600 }}>{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#00C853' : 'rgba(0,0,0,0.08)', margin: '0 8px', marginBottom: 18 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Create Wizard (2 steps) ──────────────────────────────────────────────────

function CreateWizard({ onClose, onCreated }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Step 0 fields
  const [form, setForm] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', assigned_to: '' });
  // Step 1 fields
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: staffApi.list });
  const { data: templates = [], isLoading: tplLoading } = useQuery({
    queryKey: ['pricing-templates', selectedCourier],
    queryFn: () => pricingApi.templates({ courier_code: selectedCourier, active: 'true' }),
    enabled: !!selectedCourier,
  });

  const createProspectMut = useMutation({ mutationFn: pricingApi.createProspect });
  const createRCMut = useMutation({
    mutationFn: ({ pid, body }) => pricingApi.createRateCard(pid, body),
    onSuccess: (rc, { pid }) => {
      qc.invalidateQueries({ queryKey: ['pricing-prospects'] });
      qc.invalidateQueries({ queryKey: ['pricing-stats'] });
      onCreated(pid, rc.id);
    },
  });

  const validate0 = () => {
    const e = {};
    if (!form.company_name.trim()) e.company_name = 'Required';
    if (!form.contact_name.trim())  e.contact_name = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!validate0()) return;
      setStep(1);
    } else {
      if (!selectedCourier) { setErrors({ courier: 'Select a carrier' }); return; }
      // Create prospect then rate card
      const prospect = await createProspectMut.mutateAsync({
        company_name:  form.company_name.trim(),
        contact_name:  form.contact_name.trim(),
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        assigned_to:   form.assigned_to || null,
      });
      await createRCMut.mutateAsync({
        pid: prospect.id,
        body: {
          template_id:  selectedTemplate?.id || null,
          courier_code: selectedCourier,
          courier_name: COURIER_LABELS[selectedCourier] || selectedCourier,
          rates:        selectedTemplate?.rates || [],
          surcharge_markups: selectedTemplate?.surcharge_markups || [],
          fuel_markup_pct: selectedTemplate?.fuel_markup_pct || null,
        },
      });
    }
  };

  const busy = createProspectMut.isPending || createRCMut.isPending;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#14152E', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14,
        width: '100%', maxWidth: step === 1 ? 680 : 520, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>New Rate Card</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
          <StepIndicator current={step} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Step 0: Prospect ─────────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}>
                Who is this rate card for?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="Company Name" required error={errors.company_name}>
                  <input style={inputStyle} value={form.company_name}
                    onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Acme Logistics Ltd" autoFocus />
                </Field>
                <Field label="Contact Name" required error={errors.contact_name}>
                  <input style={inputStyle} value={form.contact_name}
                    onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Jane Smith" />
                </Field>
                <Field label="Contact Email">
                  <input style={inputStyle} type="email" value={form.contact_email}
                    onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                    placeholder="jane@acme.com" />
                </Field>
                <Field label="Contact Phone">
                  <input style={inputStyle} value={form.contact_phone}
                    onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="07700 900000" />
                </Field>
              </div>
              <Field label="Assign To">
                <select style={selectStyle} value={form.assigned_to}
                  onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}>
                  <option value="">— Unassigned —</option>
                  {staffList.filter?.(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* ── Step 1: Carrier + Template ────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}>
                Select a carrier, then optionally pick a template to start from.
                You can edit all rates on the next screen.
              </div>

              <Field label="Carrier" error={errors.courier}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COURIERS.map(c => (
                    <button key={c} onClick={() => { setSelectedCourier(c); setSelectedTemplate(null); setErrors({}); }}
                      style={{
                        padding: '8px 18px', borderRadius: 8,
                        border: `1px solid ${selectedCourier === c ? '#6366F1' : 'rgba(0,0,0,0.10)'}`,
                        background: selectedCourier === c ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.03)',
                        color: selectedCourier === c ? '#A5B4FC' : '#64748B',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      }}>
                      {COURIER_LABELS[c]}
                    </button>
                  ))}
                </div>
              </Field>

              {selectedCourier && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Template <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — start from scratch or pick one)</span>
                  </div>

                  {tplLoading ? (
                    <div style={{ color: '#64748B', fontSize: 13, padding: '16px 0' }}>Loading templates…</div>
                  ) : templates.length === 0 ? (
                    <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: 9, padding: '20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>No templates yet for {COURIER_LABELS[selectedCourier]}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>You can build them in Carriers → Customer Rate Card Templates. For now, continue and set rates manually.</div>
                    </div>
                  ) : (
                    <>
                      {/* "Start from scratch" option */}
                      <div onClick={() => setSelectedTemplate(null)}
                        style={{
                          border: `1px solid ${selectedTemplate === null ? '#6366F1' : 'rgba(0,0,0,0.08)'}`,
                          background: selectedTemplate === null ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.02)',
                          borderRadius: 9, padding: '11px 14px', cursor: 'pointer', marginBottom: 8,
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: selectedTemplate === null ? '#A5B4FC' : '#666' }}>
                          Start from scratch
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Empty rate table — fill in all prices manually</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {templates.map(t => {
                          const sel = selectedTemplate?.id === t.id;
                          return (
                            <div key={t.id} onClick={() => setSelectedTemplate(t)}
                              style={{
                                border: `1px solid ${sel ? '#6366F1' : 'rgba(0,0,0,0.08)'}`,
                                background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.03)',
                                borderRadius: 9, padding: '11px 14px', cursor: 'pointer',
                              }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#A5B4FC' : '#334155', marginBottom: 3 }}>{t.name}</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>
                                {(t.rates || []).filter(r => !r.is_international).length} domestic ·&nbsp;
                                {(t.rates || []).filter(r => r.is_international).length} intl rates
                              </div>
                              {t.category_name && (
                                <span style={{ fontSize: 10, color: '#6366F1', background: 'rgba(99,102,241,0.1)',
                                  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '1px 7px',
                                  fontWeight: 700, marginTop: 4, display: 'inline-block' }}>
                                  {t.category_name}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {(createProspectMut.error || createRCMut.error) && (
                <div style={{ fontSize: 12, color: '#EF4444', marginTop: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '8px 12px' }}>
                  {createProspectMut.error?.message || createRCMut.error?.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={step === 0 ? onClose : () => setStep(0)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.08)', borderRadius: 7, padding: '8px 16px',
              color: '#64748B', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            <ArrowLeft size={14} />{step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button onClick={handleNext} disabled={busy}
            style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: step === 1 ? 'rgba(0,200,83,0.12)' : 'rgba(99,102,241,0.2)',
              border: `1px solid ${step === 1 ? 'rgba(0,200,83,0.4)' : '#6366F1'}`,
              borderRadius: 7, padding: '8px 20px',
              color: step === 1 ? '#00C853' : '#A5B4FC',
              fontSize: 13, cursor: 'pointer', fontWeight: 700, opacity: busy ? 0.6 : 1 }}>
            {busy ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {step === 0 ? <><span>Next</span><ArrowRight size={14} /></> : <><span>Open Rate Editor</span><ArrowRight size={14} /></>}
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
      <div onClick={() => setOpen(p => !p)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)',
          borderRadius: open ? '9px 9px 0 0' : 9, padding: '10px 16px' }}>
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
              borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'rgba(251,146,60,0.04)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>{a.company_name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-approvals'] });
      qc.invalidateQueries({ queryKey: ['pricing-stats'] });
      onDone();
    },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#14152E', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, width: '100%', maxWidth: 460, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Review Rate Card</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#334155', fontWeight: 700 }}>{approval.company_name}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
            {approval.courier_code} · submitted by {approval.requested_by_name}
            {approval.projected_weekly_revenue ? ` · ${gbp(approval.projected_weekly_revenue)}/wk` : ''}
          </div>
        </div>
        <Field label="Reviewer (you)">
          <select style={selectStyle} value={reviewerId} onChange={e => setReviewerId(e.target.value)}>
            <option value="">— Select your name —</option>
            {staffList.filter(s => s.is_active).map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
            ))}
          </select>
        </Field>
        <Field label="Comment (optional)">
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            style={{ ...inputStyle, height: 80, resize: 'vertical' }}
            placeholder="Any notes for the sales person…" />
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

function ProspectRow({ prospect, staffList, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['pricing-cards', prospect.id],
    queryFn: () => pricingApi.rateCards(prospect.id),
    enabled: expanded,
  });

  return (
    <div style={{ border: '1px solid var(--mv-hairline-2)', background: 'var(--mv-bg)', marginBottom: 8 }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', transition: 'background .08s' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--mv-ink)' }}>{prospect.company_name}</span>
            <StatusBadge status={prospect.status} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 3, display: 'flex', gap: 16 }}>
            {prospect.contact_name && <span>{prospect.contact_name}</span>}
            {prospect.email && <span>{prospect.email}</span>}
            {prospect.assigned_staff_name && <span>Rep: {prospect.assigned_staff_name}</span>}
          </div>
        </div>

        <div className="mv-num" style={{ fontSize: 11.5, color: 'var(--mv-ink-52)' }}>
          {fmtD(prospect.created_at)}
        </div>

        <button className="mv-icon-btn" style={{ border: 'none', background: 'transparent' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--mv-hairline-2)', background: 'var(--mv-surface)' }}>
          {isLoading ? (
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>Loading rate cards…</div>
          ) : cards.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>No rate cards generated for this prospect.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.map(rc => (
                <div key={rc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mv-num" style={{ fontWeight: 700, fontSize: 13, color: 'var(--mv-ink)' }}>Card #{rc.id.slice(0, 8)}</span>
                      <StatusBadge status={rc.status} />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', marginTop: 2 }}>
                      Couriers: {rc.couriers?.join(', ') || 'DPD'}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/pricing/rate-card/${rc.id}`)} className="mv-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                    <Edit2 size={12} /> Edit Rates →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
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
    { value: '', label: 'All' },
    { value: 'quote', label: 'Quote' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'sent', label: 'Sent' },
    { value: 'form_returned', label: 'Form Returned' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'converted', label: 'Converted' },
    { value: 'lost', label: 'Lost' },
  ];

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="mv-head">
          <div>
            <div className="mv-kicker">Commercial &amp; Tariffs</div>
            <h1 className="mv-title">Pricing &amp; Rate Cards</h1>
            <p className="mv-blurb">
              Prospect rate modelling, cost-plus margin simulation, volumetric surcharge calculations, and workflow approvals.
            </p>
          </div>
          <div className="mv-actions">
            <button onClick={() => setShowWizard(true)} className="mv-btn-primary">
              <Plus size={14} /> New Rate Card
            </button>
          </div>
        </div>

        <div className="mv-rule" />

        {/* ── KPI Strip ──────────────────────────────────── */}
        <div className="mv-kpis">
          <div className="mv-kpi">
            <div className="mv-kpi-label">Quotes Out</div>
            <div className="mv-kpi-value mv-num">{(stats?.quotes_out ?? 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Active proposals</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Forms Sent</div>
            <div className="mv-kpi-value mv-num">{(stats?.forms_sent ?? 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Awaiting customer signature</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">In Onboarding</div>
            <div className="mv-kpi-value mv-num is-flight">{(stats?.in_onboarding ?? 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Setting up carrier accounts</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Converted</div>
            <div className="mv-kpi-value mv-num is-settled">{(stats?.converted ?? 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Live trading clients</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Lost</div>
            <div className="mv-kpi-value mv-num">{(stats?.lost ?? 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Declined proposals</div>
          </div>
        </div>

        {/* ── Approvals Banner ───────────────────────────────────── */}
        <ApprovalBanner approvals={approvals} onReview={a => setReviewTarget(a)} />

        {/* ── Filter Toolbar ─────────────────────────────────────── */}
        <div className="mv-chips" style={{ marginTop: 20 }}>
          <span className="mv-filter-label">Stage</span>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`mv-chip ${statusFilter === f.value ? 'is-on' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}

          <span style={{ flex: 1 }} />

          <div className="mv-search" style={{ width: 260, height: 34 }}>
            <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company…"
            />
            {search && (
              <button onClick={() => setSearch('')} className="mv-search-clear" title="Clear search">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Prospect List ──────────────────────────────────────── */}
        <div style={{ marginTop: 18 }}>
          {isLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-52)' }}>Loading commercial records…</div>
          ) : prospects.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-52)' }}>
              No prospect records match your filter criteria.
            </div>
          ) : (
            prospects.map(p => <ProspectRow key={p.id} prospect={p} staffList={staffList} navigate={navigate} />)
          )}
        </div>

        {showWizard && (
          <CreateWizard
            onClose={() => setShowWizard(false)}
            onCreated={(prospectId, rcId) => {
              setShowWizard(false);
              navigate(`/pricing/rate-card/${rcId}`);
            }}
          />
        )}

        {reviewTarget && (
          <ReviewModal
            approval={reviewTarget}
            staffList={staffList}
            onClose={() => setReviewTarget(null)}
            onDone={() => setReviewTarget(null)}
          />
        )}
      </div>
    </div>
  );
}
