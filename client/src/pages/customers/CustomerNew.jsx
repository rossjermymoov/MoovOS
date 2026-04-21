import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Building2, Users, Settings, UserPlus } from 'lucide-react';
import { customersApi } from '../../api/customers';
import { staffApi } from '../../api/staff';

// ─── Step config ─────────────────────────────────────────────
const STEPS = [
  { key: 'business',  label: 'Business Details', icon: Building2 },
  { key: 'staff',     label: 'Assign Staff',      icon: Users },
  { key: 'account',   label: 'Account Setup',     icon: Settings },
  { key: 'contact',   label: 'First Contact',     icon: UserPlus },
];

const TIERS = [
  { value: 'bronze',     label: 'Bronze',     desc: 'Low volume, higher margin target' },
  { value: 'silver',     label: 'Silver',     desc: 'Mid-tier accounts' },
  { value: 'gold',       label: 'Gold',       desc: 'High-value accounts' },
  { value: 'enterprise', label: 'Enterprise', desc: 'High volume, negotiated rates' },
];

const PAYMENT_TERMS = [
  { value: 7,  label: '7 days',  note: 'Standard' },
  { value: 14, label: '14 days', note: 'Manager approval required' },
  { value: 28, label: '28 days', note: 'Manager approval required' },
  { value: 30, label: 'Net 30',  note: 'Director approval required' },
];

const EMPTY_FORM = {
  // Step 1 — Business Details
  business_name: '',
  registered_address: '',
  postcode: '',
  phone_number: '',
  primary_email: '',
  company_reg_number: '',
  // Step 2 — Staff
  salesperson_id: '',
  account_manager_id: '',
  onboarding_person_id: '',
  // Step 3 — Account Setup
  tier: 'bronze',
  credit_limit: '',
  payment_terms_days: 7,
  // Step 4 — First Contact
  contact_full_name: '',
  contact_job_title: '',
  contact_phone: '',
  contact_email: '',
  contact_is_main: true,
  contact_is_finance: false,
};

// ─── Validation ──────────────────────────────────────────────
function validate(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.business_name.trim())      errors.business_name = 'Business name is required';
    if (!form.registered_address.trim()) errors.registered_address = 'Address is required';
    if (!form.postcode.trim())           errors.postcode = 'Postcode is required';
    if (!form.phone_number.trim())       errors.phone_number = 'Phone number is required';
    if (!form.primary_email.trim())      errors.primary_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.primary_email)) errors.primary_email = 'Enter a valid email';
  }
  if (step === 2) {
    if (!form.credit_limit || isNaN(form.credit_limit) || parseFloat(form.credit_limit) < 0)
      errors.credit_limit = 'Enter a valid credit limit';
  }
  if (step === 3) {
    if (!form.contact_full_name.trim()) errors.contact_full_name = 'Contact name is required';
    if (!form.contact_email.trim())     errors.contact_email = 'Contact email is required';
    else if (!/\S+@\S+\.\S+/.test(form.contact_email)) errors.contact_email = 'Enter a valid email';
  }
  return errors;
}

// ─── Main component ──────────────────────────────────────────
export default function CustomerNew() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [done, setDone]     = useState(false);
  const [newCustomer, setNewCustomer] = useState(null);

  // Staff queries
  const { data: salespeople = [] } = useQuery({ queryKey: ['staff', 'sales'],              queryFn: () => staffApi.list('sales') });
  const { data: accountManagers = [] } = useQuery({ queryKey: ['staff', 'account_management'], queryFn: () => staffApi.list('account_management') });
  const { data: onboarders = [] } = useQuery({ queryKey: ['staff', 'onboarding'],          queryFn: () => staffApi.list('onboarding') });

  const createCustomer = useMutation({
    mutationFn: async () => {
      // 1. Create customer
      const customer = await customersApi.create({
        business_name:        form.business_name,
        registered_address:   form.registered_address,
        postcode:             form.postcode,
        phone_number:         form.phone_number,
        primary_email:        form.primary_email,
        company_reg_number:   form.company_reg_number || undefined,
        salesperson_id:       form.salesperson_id || undefined,
        account_manager_id:   form.account_manager_id || undefined,
        onboarding_person_id: form.onboarding_person_id || undefined,
        tier:                 form.tier,
        credit_limit:         parseFloat(form.credit_limit) || 0,
        payment_terms_days:   form.payment_terms_days,
      });
      // 2. Add first contact
      if (form.contact_full_name) {
        await customersApi.addContact(customer.id, {
          full_name:          form.contact_full_name,
          job_title:          form.contact_job_title || undefined,
          phone_number:       form.contact_phone || undefined,
          email_address:      form.contact_email,
          is_main_contact:    form.contact_is_main,
          is_finance_contact: form.contact_is_finance,
        });
      }
      return customer;
    },
    onSuccess: (customer) => {
      setNewCustomer(customer);
      setDone(true);
    },
  });

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  function next() {
    const errs = validate(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (step === STEPS.length - 1) {
      createCustomer.mutate();
    } else {
      setErrors({});
      setStep(s => s + 1);
    }
  }

  function back() {
    setErrors({});
    setStep(s => s - 1);
  }

  if (done && newCustomer) return <SuccessScreen customer={newCustomer} navigate={navigate} />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/customers')}
          style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <ArrowLeft size={14} /> Customers
        </button>
        <span style={{ color: '#444' }}>/</span>
        <span style={{ fontSize: 13, color: '#fff' }}>Add Customer</span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853', marginBottom: 24 }}>Add Customer</h1>

      {/* Step indicator */}
      <StepIndicator steps={STEPS} current={step} />

      {/* Form card */}
      <div className="moov-card" style={{ padding: 32, marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#7B2FBE', marginBottom: 4 }}>
          {STEPS[step].label}
        </h2>
        <p style={{ fontSize: 13, color: '#AAAAAA', marginBottom: 28 }}>
          {stepSubtitle(step)}
        </p>

        {step === 0 && <StepBusiness   form={form} set={set} errors={errors} />}
        {step === 1 && <StepStaff      form={form} set={set} salespeople={salespeople} accountManagers={accountManagers} onboarders={onboarders} />}
        {step === 2 && <StepAccount    form={form} set={set} errors={errors} />}
        {step === 3 && <StepContact    form={form} set={set} errors={errors} />}

        {createCustomer.isError && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(233,30,140,0.1)', border: '1px solid #E91E8C', borderRadius: 8, fontSize: 13, color: '#E91E8C' }}>
            Something went wrong. Please try again.
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            className="btn-ghost"
            onClick={step === 0 ? () => navigate('/customers') : back}
          >
            <ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            className="btn-primary"
            onClick={next}
            disabled={createCustomer.isPending}
          >
            {createCustomer.isPending
              ? 'Creating…'
              : step === STEPS.length - 1
                ? <><Check size={14} /> Create Customer</>
                : <>Next <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step subtitles ──────────────────────────────────────────
function stepSubtitle(step) {
  return [
    'Enter the core details for this business account.',
    'Assign the internal team responsible for this customer. All fields are optional.',
    'Set the customer\'s pricing tier, credit limit, and payment terms.',
    'Add the primary contact for this account. You can add more contacts from the customer record.',
  ][step];
}

// ─── Step 1: Business Details ────────────────────────────────
function StepBusiness({ form, set, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Row2>
        <Field label="Business Name" required error={errors.business_name}>
          <PillInput value={form.business_name} onChange={v => set('business_name', v)} placeholder="Acme Logistics Ltd" error={errors.business_name} />
        </Field>
        <Field label="Company Reg. Number" error={errors.company_reg_number}>
          <PillInput value={form.company_reg_number} onChange={v => set('company_reg_number', v)} placeholder="12345678 (optional)" />
        </Field>
      </Row2>

      <Field label="Registered Address" required error={errors.registered_address}>
        <textarea
          value={form.registered_address}
          onChange={e => set('registered_address', e.target.value)}
          placeholder="123 High Street, Birmingham"
          style={{
            width: '100%', minHeight: 80,
            background: '#1A1D35', border: `1px solid ${errors.registered_address ? '#E91E8C' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14,
            resize: 'vertical', fontFamily: 'inherit',
          }}
        />
        {errors.registered_address && <ErrMsg>{errors.registered_address}</ErrMsg>}
      </Field>

      <Row2>
        <Field label="Postcode" required error={errors.postcode}>
          <PillInput value={form.postcode} onChange={v => set('postcode', v.toUpperCase())} placeholder="B1 1BB" error={errors.postcode} />
        </Field>
        <Field label="Phone Number" required error={errors.phone_number}>
          <PillInput value={form.phone_number} onChange={v => set('phone_number', v)} placeholder="0121 000 0000" type="tel" error={errors.phone_number} />
        </Field>
      </Row2>

      <Field label="Primary Email" required error={errors.primary_email}>
        <PillInput value={form.primary_email} onChange={v => set('primary_email', v)} placeholder="accounts@acmelogistics.co.uk" type="email" error={errors.primary_email} />
      </Field>
    </div>
  );
}

// ─── Step 2: Assign Staff ────────────────────────────────────
function StepStaff({ form, set, salespeople, accountManagers, onboarders }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StaffSelect
        label="Salesperson"
        hint="The sales team member who won or is managing this deal."
        value={form.salesperson_id}
        onChange={v => set('salesperson_id', v)}
        options={salespeople}
        emptyLabel="No salesperson assigned"
      />
      <StaffSelect
        label="Account Manager"
        hint="Responsible for the ongoing relationship after onboarding."
        value={form.account_manager_id}
        onChange={v => set('account_manager_id', v)}
        options={accountManagers}
        emptyLabel="Unmanaged"
      />
      <StaffSelect
        label="Onboarding Person"
        hint="Who will guide this customer through the setup process."
        value={form.onboarding_person_id}
        onChange={v => set('onboarding_person_id', v)}
        options={onboarders}
        emptyLabel="Not assigned"
      />
    </div>
  );
}

function StaffSelect({ label, hint, value, onChange, options, emptyLabel }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 8 }}>{hint}</p>}
      <div className="pill-input-wrap">
        <select value={value} onChange={e => onChange(e.target.value)} style={{ paddingLeft: 16 }}>
          <option value="">{emptyLabel}</option>
          {options.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <div className="green-cap">▾</div>
      </div>
    </div>
  );
}

// ─── Step 3: Account Setup ───────────────────────────────────
function StepAccount({ form, set, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tier */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Customer Tier</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TIERS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('tier', t.value)}
              style={{
                padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: form.tier === t.value ? '2px solid #00C853' : '1px solid rgba(255,255,255,0.1)',
                background: form.tier === t.value ? 'rgba(0,200,83,0.08)' : '#1A1D35',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: form.tier === t.value ? '#00C853' : '#fff' }}>{t.label}</div>
              <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Row2>
        {/* Credit limit */}
        <Field label="Credit Limit" required error={errors.credit_limit}>
          <div className="pill-input-wrap">
            <div className="green-cap" style={{ borderRight: '1px solid rgba(0,200,83,0.3)' }}>£</div>
            <input
              type="number"
              min="0"
              step="100"
              value={form.credit_limit}
              onChange={e => set('credit_limit', e.target.value)}
              placeholder="5000"
              style={{ border: errors.credit_limit ? '1px solid #E91E8C' : undefined }}
            />
          </div>
          {errors.credit_limit && <ErrMsg>{errors.credit_limit}</ErrMsg>}
        </Field>

        {/* Payment terms */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Payment Terms</label>
          <div className="pill-input-wrap">
            <select
              value={form.payment_terms_days}
              onChange={e => set('payment_terms_days', parseInt(e.target.value))}
              style={{ paddingLeft: 16 }}
            >
              {PAYMENT_TERMS.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label} — {pt.note}</option>
              ))}
            </select>
            <div className="green-cap">▾</div>
          </div>
          {form.payment_terms_days > 7 && (
            <p style={{ fontSize: 12, color: '#FFC107', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ This requires manager or director approval before the account goes live.
            </p>
          )}
        </div>
      </Row2>
    </div>
  );
}

// ─── Step 4: First Contact ───────────────────────────────────
function StepContact({ form, set, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Row2>
        <Field label="Full Name" required error={errors.contact_full_name}>
          <PillInput value={form.contact_full_name} onChange={v => set('contact_full_name', v)} placeholder="Jane Smith" error={errors.contact_full_name} />
        </Field>
        <Field label="Job Title">
          <PillInput value={form.contact_job_title} onChange={v => set('contact_job_title', v)} placeholder="Finance Director" />
        </Field>
      </Row2>
      <Row2>
        <Field label="Email Address" required error={errors.contact_email}>
          <PillInput value={form.contact_email} onChange={v => set('contact_email', v)} placeholder="jane@acmelogistics.co.uk" type="email" error={errors.contact_email} />
        </Field>
        <Field label="Phone Number">
          <PillInput value={form.contact_phone} onChange={v => set('contact_phone', v)} placeholder="07700 000000" type="tel" />
        </Field>
      </Row2>

      {/* Contact flags */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Toggle
          label="Main Contact"
          hint="Primary point of contact for all communications"
          checked={form.contact_is_main}
          onChange={v => set('contact_is_main', v)}
          color="#00C853"
        />
        <Toggle
          label="Finance Contact"
          hint="Receives invoices and billing communications"
          checked={form.contact_is_finance}
          onChange={v => set('contact_is_finance', v)}
          color="#7B2FBE"
        />
      </div>
    </div>
  );
}

// ─── Success screen ──────────────────────────────────────────
function SuccessScreen({ customer, navigate }) {
  return (
    <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(0,200,83,0.15)', border: '2px solid #00C853',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Check size={32} style={{ color: '#00C853' }} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Customer Created</h2>
      <p style={{ color: '#AAAAAA', fontSize: 14, marginBottom: 4 }}>
        <span style={{ color: '#00BCD4', fontWeight: 600 }}>{customer.account_number}</span> — {customer.business_name}
      </p>
      <p style={{ color: '#AAAAAA', fontSize: 13, marginBottom: 32 }}>
        The account is active and ready. Next step: set up their rate card.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn-ghost" onClick={() => navigate('/customers')}>
          Back to Customers
        </button>
        <button className="btn-primary" onClick={() => navigate(`/customers/${customer.id}`)}>
          View Customer Record →
        </button>
      </div>
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        const color   = done ? '#00C853' : active ? '#00C853' : '#AAAAAA';
        const bgColor = done ? 'rgba(0,200,83,0.15)' : active ? 'rgba(0,200,83,0.08)' : 'rgba(255,255,255,0.04)';

        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9999, background: bgColor, border: `1px solid ${active || done ? color : 'transparent'}` }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: done ? '#00C853' : active ? 'rgba(0,200,83,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: done ? '#000' : color,
              }}>
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < current ? '#00C853' : 'rgba(255,255,255,0.08)', margin: '0 4px', minWidth: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#E91E8C', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <ErrMsg>{error}</ErrMsg>}
    </div>
  );
}

function PillInput({ value, onChange, placeholder, type = 'text', error }) {
  return (
    <div className="pill-input-wrap" style={error ? { borderColor: '#E91E8C' } : {}}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Toggle({ label, hint, checked, onChange, color }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        flex: 1, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
        border: checked ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        background: checked ? `rgba(${color === '#00C853' ? '0,200,83' : '123,47,190'},0.08)` : '#1A1D35',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: checked ? color : '#fff' }}>{label}</span>
        <div style={{
          width: 36, height: 20, borderRadius: 10,
          background: checked ? color : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 2,
            left: checked ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
          }} />
        </div>
      </div>
      {hint && <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function Row2({ children }) {
  return <div style={{ display: 'flex', gap: 16 }}>{children}</div>;
}

function ErrMsg({ children }) {
  return <p style={{ fontSize: 12, color: '#E91E8C', marginTop: 4 }}>{children}</p>;
}
