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
  const c = STATUS[status] || { label: status, color: '#888', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: c.bg,
      border: `1px solid ${c.border}`, color: c.color, borderRadius: 20,
      padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#AAAAAA', tooltip, bg = 'rgba(255,255,255,0.04)' }) {
  const [open, setOpen] = useState(false);
  return (
    <div onMouseEnter={() => tooltip && setOpen(true)} onMouseLeave={() => setOpen(false)}
      style={{ position: 'relative', background: bg, border: `1px solid ${color}33`,
        borderRadius: 10, padding: '14px 18px', minWidth: 130, flex: 1 }}>
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

// ─── Input helpers ────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, padding: '8px 11px', color: '#fff', fontSize: 13, outline: 'none',
};
const selectStyle = { ...inputStyle };

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
              background: i < current ? '#00C853' : i === current ? '#6366F1' : 'rgba(255,255,255,0.08)',
              border: `2px solid ${i < current ? '#00C853' : i === current ? '#818CF8' : 'rgba(255,255,255,0.12)'}`,
              fontSize: 12, fontWeight: 700, color: i <= current ? '#fff' : '#555',
            }}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === current ? '#A5B4FC' : '#555', fontWeight: 600 }}>{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#00C853' : 'rgba(255,255,255,0.08)', margin: '0 8px', marginBottom: 18 }} />
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
      <div style={{ background: '#14152E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
        width: '100%', maxWidth: step === 1 ? 680 : 520, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>New Rate Card</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}>
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
              <div style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>
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
              <div style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>
                Select a carrier, then optionally pick a template to start from.
                You can edit all rates on the next screen.
              </div>

              <Field label="Carrier" error={errors.courier}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COURIERS.map(c => (
                    <button key={c} onClick={() => { setSelectedCourier(c); setSelectedTemplate(null); setErrors({}); }}
                      style={{
                        padding: '8px 18px', borderRadius: 8,
                        border: `1px solid ${selectedCourier === c ? '#6366F1' : 'rgba(255,255,255,0.12)'}`,
                        background: selectedCourier === c ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        color: selectedCourier === c ? '#A5B4FC' : '#888',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      }}>
                      {COURIER_LABELS[c]}
                    </button>
                  ))}
                </div>
              </Field>

              {selectedCourier && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Template <span style={{ color: '#444', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — start from scratch or pick one)</span>
                  </div>

                  {tplLoading ? (
                    <div style={{ color: '#555', fontSize: 13, padding: '16px 0' }}>Loading templates…</div>
                  ) : templates.length === 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 9, padding: '20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>No templates yet for {COURIER_LABELS[selectedCourier]}</div>
                      <div style={{ fontSize: 11, color: '#444' }}>You can build them in Carriers → Customer Rate Card Templates. For now, continue and set rates manually.</div>
                    </div>
                  ) : (
                    <>
                      {/* "Start from scratch" option */}
                      <div onClick={() => setSelectedTemplate(null)}
                        style={{
                          border: `1px solid ${selectedTemplate === null ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                          background: selectedTemplate === null ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                          borderRadius: 9, padding: '11px 14px', cursor: 'pointer', marginBottom: 8,
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: selectedTemplate === null ? '#A5B4FC' : '#666' }}>
                          Start from scratch
                        </div>
                        <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Empty rate table — fill in all prices manually</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {templates.map(t => {
                          const sel = selectedTemplate?.id === t.id;
                          return (
                            <div key={t.id} onClick={() => setSelectedTemplate(t)}
                              style={{
                                border: `1px solid ${sel ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                                background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                                borderRadius: 9, padding: '11px 14px', cursor: 'pointer',
                              }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#A5B4FC' : '#DDD', marginBottom: 3 }}>{t.name}</div>
                              <div style={{ fontSize: 11, color: '#555' }}>
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
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={step === 0 ? onClose : () => setStep(0)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 16px',
              color: '#888', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-approvals'] });
      qc.invalidateQueries({ queryKey: ['pricing-stats'] });
      onDone();
    },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#14152E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: '100%', maxWidth: 460, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Review Rate Card</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#DDD', fontWeight: 700 }}>{approval.company_name}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
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

// ─── Prospect Card ────────────────────────────────────────────────────────────

function ProspectRow({ prospect, staffList, navigate }) {
  const [expanded, setExpanded]     = useState(false);
  const [submitStaff, setSubmitStaff] = useState('');
  const [editing, setEditing]       = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [confirmDel, setConfirmDel] = useState(false);
  const qc = useQueryClient();

  const { data: rateCards = [], isLoading: rcLoading } = useQuery({
    queryKey: ['rate-cards', prospect.id],
    queryFn: () => pricingApi.rateCards(prospect.id),
    enabled: expanded,
  });

  const patchMut = useMutation({
    mutationFn: (body) => pricingApi.patchProspect(prospect.id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing-prospects'] }); setEditing(false); },
  });

  const deleteMut = useMutation({
    mutationFn: () => pricingApi.deleteProspect(prospect.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-prospects'] });
      qc.invalidateQueries({ queryKey: ['pricing-stats'] });
    },
  });

  const submitMut = useMutation({
    mutationFn: (rcId) => pricingApi.submitApproval(rcId, { requested_by: submitStaff }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-prospects'] });
      qc.invalidateQueries({ queryKey: ['pricing-approvals'] });
    },
  });

  const topRC    = (prospect.rate_cards || [])[0];
  const couriers = [...new Set((prospect.rate_cards || []).map(r => r.courier_code))].join(', ');

  const cardBase = {
    background: expanded ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.015)',
    border: `1px solid ${expanded ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 12, marginBottom: 8, overflow: 'hidden',
    transition: 'border-color 0.15s',
  };

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 8, fontWeight: 700, cursor: 'pointer', border: '1px solid',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={cardBase}>

      {/* ── Edit form ── */}
      {editing && (
        <div style={{ background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.18)', padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 14px', marginBottom: 12 }}>
            {[
              { key: 'company_name', label: 'Company Name' },
              { key: 'contact_name', label: 'Contact Name' },
              { key: 'contact_email', label: 'Email' },
              { key: 'contact_phone', label: 'Phone' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>{label}</label>
                <input value={editForm[key] ?? ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, padding: '8px 11px', color: '#fff', fontSize: 13, outline: 'none' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ ...btnBase, padding: '8px 18px', fontSize: 13, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#888' }}>Cancel</button>
            <button onClick={() => patchMut.mutate(editForm)} disabled={patchMut.isPending}
              style={{ ...btnBase, padding: '8px 20px', fontSize: 13, background: 'rgba(99,102,241,0.18)', borderColor: '#6366F1', color: '#A5B4FC' }}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {confirmDel && (
        <div style={{ background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: '#F87171' }}>
          <AlertCircle size={15} />
          <span>Delete <strong>{prospect.company_name}</strong>? This removes the prospect and all their rate cards.</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirmDel(false)} style={{ ...btnBase, padding: '7px 16px', fontSize: 12, background: 'none', borderColor: 'rgba(255,255,255,0.1)', color: '#666' }}>Cancel</button>
            <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
              style={{ ...btnBase, padding: '7px 18px', fontSize: 12, background: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.5)', color: '#EF4444' }}>
              Yes, Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Main row ── */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

          {/* Left: name + contact */}
          <div style={{ flex: '0 0 220px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#EEE', lineHeight: 1.2, marginBottom: 3 }}>{prospect.company_name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{prospect.contact_name}</div>
          </div>

          {/* Centre: meta chips */}
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={prospect.status} />
            {couriers && couriers.split(', ').map(c => (
              <span key={c} style={{ fontSize: 12, fontWeight: 700, color: '#888', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 10px' }}>{c}</span>
            ))}
            {topRC?.projected_weekly_revenue && (
              <span style={{ fontSize: 13, fontWeight: 800, color: '#A5B4FC', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '3px 10px' }}>
                {gbp(topRC.projected_weekly_revenue)}/wk
              </span>
            )}
            {prospect.assigned_to_name && (
              <span style={{ fontSize: 12, color: '#666' }}>→ {prospect.assigned_to_name}</span>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setEditForm({ company_name: prospect.company_name, contact_name: prospect.contact_name, contact_email: prospect.contact_email || '', contact_phone: prospect.contact_phone || '' }); setEditing(true); setConfirmDel(false); }}
              style={{ ...btnBase, padding: '8px 16px', fontSize: 12, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#AAA' }}>
              <Edit2 size={13} /> Edit
            </button>
            <button
              onClick={() => { setConfirmDel(true); setEditing(false); }}
              style={{ ...btnBase, padding: '8px 16px', fontSize: 12, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444' }}>
              <Trash2 size={13} /> Delete
            </button>
            <button
              onClick={() => setExpanded(p => !p)}
              style={{ ...btnBase, padding: '8px 12px', fontSize: 12, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#666' }}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Contact details strip */}
        {(prospect.contact_email || prospect.contact_phone) && (
          <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {prospect.contact_email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
                <Mail size={12} /> {prospect.contact_email}
              </span>
            )}
            {prospect.contact_phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
                <Phone size={12} /> {prospect.contact_phone}
              </span>
            )}
            <span style={{ fontSize: 12, color: '#444', marginLeft: 'auto' }}>Added {fmtD(prospect.created_at)}</span>
          </div>
        )}
      </div>

      {/* ── Rate cards (expanded) ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)', padding: '14px 20px 16px' }}>
          {rcLoading ? (
            <div style={{ color: '#555', fontSize: 13 }}>Loading rate cards…</div>
          ) : rateCards.length === 0 ? (
            <div style={{ color: '#555', fontSize: 13 }}>No rate cards yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rateCards.map(rc => {
                const approvalStatus = rc.latest_approval?.status;
                const rateCount = (rc.rates || []).length;
                return (
                  <div key={rc.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    {/* RC details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#DDD', marginBottom: 4 }}>
                        {rc.courier_name || rc.courier_code}
                        {rc.template_name && (
                          <span style={{ fontSize: 11, color: '#555', fontWeight: 400, marginLeft: 8 }}>({rc.template_name})</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#666' }}>
                        <span>{rateCount} rates</span>
                        {rc.weekly_parcels    && <span>{rc.weekly_parcels.toLocaleString('en-GB')} pcls/wk</span>}
                        {rc.projected_weekly_profit && <span style={{ color: '#34D399', fontWeight: 700 }}>{gbp(rc.projected_weekly_profit)}/wk profit</span>}
                      </div>
                    </div>

                    {/* Status + approval badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <StatusBadge status={rc.status} />
                      {approvalStatus && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                          background: approvalStatus === 'approved' ? 'rgba(52,211,153,0.12)' : approvalStatus === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)',
                          color:      approvalStatus === 'approved' ? '#34D399'                : approvalStatus === 'rejected' ? '#EF4444'                : '#F59E0B',
                          border:     `1px solid ${approvalStatus === 'approved' ? 'rgba(52,211,153,0.3)' : approvalStatus === 'rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.2)'}`,
                        }}>
                          {approvalStatus === 'approved' ? '✓ Approved' : approvalStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {(rc.status === 'draft' || rc.status === 'rejected') && (
                        <button onClick={() => navigate(`/pricing/rate-card/${rc.id}`)}
                          style={{ ...btnBase, padding: '9px 18px', fontSize: 13, background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: '#CCC' }}>
                          <Edit2 size={13} /> Edit Rates
                        </button>
                      )}
                      {rc.status !== 'draft' && (
                        <button onClick={() => navigate(`/pricing/rate-card/${rc.id}`)}
                          style={{ ...btnBase, padding: '9px 18px', fontSize: 13, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#666' }}>
                          View
                        </button>
                      )}
                      {rc.status === 'draft' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select value={submitStaff} onChange={e => setSubmitStaff(e.target.value)}
                            style={{ ...selectStyle, padding: '8px 10px', fontSize: 13, width: 150, borderRadius: 8 }}>
                            <option value="">Your name…</option>
                            {staffList.filter(s => s.is_active).map(s => (
                              <option key={s.id} value={s.id}>{s.full_name}</option>
                            ))}
                          </select>
                          <button onClick={() => submitMut.mutate(rc.id)} disabled={!submitStaff || submitMut.isPending}
                            style={{ ...btnBase, padding: '9px 20px', fontSize: 13, background: 'rgba(99,102,241,0.18)', borderColor: '#6366F1', color: '#A5B4FC', opacity: !submitStaff ? 0.4 : 1 }}>
                            <Send size={13} /> Submit for Approval
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
    <div style={{ padding: '24px 28px', minHeight: '100%', fontFamily: 'system-ui, sans-serif', color: '#CCC' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Title */}
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
        <StatCard label="Quotes Out"     value={stats?.quotes_out    ?? '—'} color="#F59E0B" />
        <StatCard label="Forms Sent"     value={stats?.forms_sent    ?? '—'} color="#A78BFA" />
        <StatCard label="Forms Returned" value={stats?.forms_returned ?? '—'} color="#60A5FA" />
        <StatCard label="In Onboarding"  value={stats?.in_onboarding ?? '—'} color="#34D399"
          bg={stats?.in_onboarding > 0 ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.04)'}
          tooltip={stats?.onboarding_list} />
        <StatCard label="Converted" value={stats?.converted ?? '—'} color="#00C853" bg="rgba(0,200,83,0.05)" />
        <StatCard label="Lost"      value={stats?.lost      ?? '—'} color="#EF4444" />
      </div>

      {/* Pending approvals */}
      <ApprovalBanner approvals={approvals} onReview={a => setReviewTarget(a)} />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} color="#555" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company…" style={{ ...inputStyle, paddingLeft: 30 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: statusFilter === f.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: statusFilter === f.value ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.08)',
                color: statusFilter === f.value ? '#A5B4FC' : '#666' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prospect list */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden', padding: 8 }}>
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#555', fontSize: 13 }}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />
            Loading…
          </div>
        ) : prospects.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#444', fontSize: 14 }}>
            <Package size={28} color="#333" style={{ display: 'block', margin: '0 auto 10px' }} />
            No prospects yet. Click <strong style={{ color: '#A5B4FC' }}>New Rate Card</strong> to get started.
          </div>
        ) : (
          prospects.map(p => <ProspectRow key={p.id} prospect={p} staffList={staffList} navigate={navigate} />)
        )}
      </div>

      {prospectsData?.total > prospects.length && (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 10 }}>
          Showing {prospects.length} of {prospectsData.total} prospects
        </div>
      )}

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
  );
}
