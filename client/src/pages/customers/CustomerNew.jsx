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

const COMPANY_TYPES = [
  { value: 'limited_company', label: 'Limited Company (Ltd)' },
  { value: 'partnership',     label: 'Partnership / LLP' },
  { value: 'sole_trader',     label: 'Sole Trader' },
];

const TIERS = [
  { value: 'bronze',     label: 'Bronze',     desc: 'Low volume, higher margin target' },
  { value: 'silver',     label: 'Silver',     desc: 'Mid-tier accounts' },
  { value: 'gold',       label: 'Gold',       desc: 'High-value accounts' },
  { value: 'enterprise', label: 'Enterprise', desc: 'High volume, negotiated rates' },
];

const BILLING_PERIODS = [
  { value: 'weekly',      label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly',     label: 'Monthly' },
];

const PAYMENT_TERMS = [
  { value: 7,  label: '7 days',  note: 'Default' },
  { value: 14, label: '14 days', note: '' },
  { value: 28, label: '28 days', note: '' },
  { value: 30, label: '30 days', note: '' },
];

const EMPTY_FORM = {
  // Step 1 — Business Details
  business_name:      '',
  company_type:       'limited_company',
  company_reg_number: '',
  vat_number:         '',
  address_line_1:     '',
  address_line_2:     '',
  city:               '',
  county:             '',
  postcode:           '',
  country:            'United Kingdom',
  phone_number:       '',
  primary_email:      '',
  accounts_email:     '',
  eori_number:        '',
  ioss_number:        '',
  // Step 2 — Staff
  salesperson_id:       '',
  account_manager_id:   '',
  onboarding_person_id: '',
  // Step 3 — Account Setup
  tier:               'bronze',
  credit_limit:       '',
  billing_cycle:      'monthly',
  payment_terms_days: 7,
  // Step 4 — First Contact
  contact_full_name:  '',
  contact_job_title:  '',
  contact_phone:      '',
  contact_email:      '',
  contact_is_main:    true,
  contact_is_finance: false,
};

// ─── Validation ──────────────────────────────────────────────
function validate(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.business_name.trim())  errors.business_name = 'Business name is required';
    if (!form.postcode.trim())       errors.postcode = 'Postcode is required';
    if (!form.phone_number.trim())   errors.phone_number = 'Phone number is required';
    if (!form.primary_email.trim())  errors.primary_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.primary_email)) errors.primary_email = 'Enter a valid email';
    if (form.accounts_email && !/\S+@\S+\.\S+/.test(form.accounts_email))
      errors.accounts_email = 'Enter a valid email';
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

// ─── Field helpers ────────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#AAAAAA', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#E91E8C', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: '#E91E8C', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (error) => ({
  width: '100%', boxSizing: 'border-box',
  background: '#0D0E2A', border: `1px solid ${error ? '#E91E8C' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none',
});

const selectStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none',
};

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };

const sectionHeading = { fontSize: 11, color: '#7B2FBE', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 };

// ─── Step 1: Business Details ─────────────────────────────────
function StepBusiness({ form, set, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={grid2}>
        <Field label="Business / Company Name" required error={errors.business_name}>
          <input style={inputStyle(errors.business_name)} value={form.business_name}
            onChange={e => set('business_name', e.target.value)} placeholder="Acme Ltd" />
        </Field>
        <Field label="Company Type">
          <select style={selectStyle} value={form.company_type} onChange={e => set('company_type', e.target.value)}>
            {COMPANY_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
          </select>
        </Field>
      </div>

      <div style={grid2}>
        <Field label="Company Registration Number">
          <input style={inputStyle()} value={form.company_reg_number}
            onChange={e => set('company_reg_number', e.target.value)} placeholder="12345678" />
        </Field>
        <Field label="VAT Number">
          <input style={inputStyle()} value={form.vat_number}
            onChange={e => set('vat_number', e.target.value)} placeholder="GB123456789" />
        </Field>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
        <p style={sectionHeading}>Address</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Address Line 1">
            <input style={inputStyle()} value={form.address_line_1}
              onChange={e => set('address_line_1', e.target.value)} placeholder="Unit 4, Business Park" />
          </Field>
          <Field label="Address Line 2">
            <input style={inputStyle()} value={form.address_line_2}
              onChange={e => set('address_line_2', e.target.value)} placeholder="Optional" />
          </Field>
          <div style={grid3}>
            <Field label="City / Town">
              <input style={inputStyle()} value={form.city}
                onChange={e => set('city', e.target.value)} placeholder="Manchester" />
            </Field>
            <Field label="County">
              <input style={inputStyle()} value={form.county}
                onChange={e => set('county', e.target.value)} placeholder="Greater Manchester" />
            </Field>
            <Field label="Postcode" required error={errors.postcode}>
              <input style={inputStyle(errors.postcode)} value={form.postcode}
                onChange={e => set('postcode', e.target.value.toUpperCase())} placeholder="M1 1AB" />
            </Field>
          </div>
          <Field label="Country">
            <input style={inputStyle()} value={form.country}
              onChange={e => set('country', e.target.value)} />
          </Field>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
        <p style={sectionHeading}>Contact Details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid2}>
            <Field label="Main Phone Number" required error={errors.phone_number}>
              <input style={inputStyle(errors.phone_number)} value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)} placeholder="+44 7700 900000" />
            </Field>
            <Field label="Main Email Address" required error={errors.primary_email}>
              <input style={inputStyle(errors.primary_email)} value={form.primary_email}
                onChange={e => set('primary_email', e.target.value)} placeholder="info@company.co.uk" />
            </Field>
          </div>
          <Field label="Accounts / Billing Email" error={errors.accounts_email}>
            <input style={inputStyle(errors.accounts_email)} value={form.accounts_email}
              onChange={e => set('accounts_email', e.target.value)}
              placeholder="accounts@company.co.uk — leave blank if same as above" />
          </Field>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
        <p style={sectionHeading}>International Trade</p>
        <div style={grid2}>
          <Field label="EORI Number">
            <input style={inputStyle()} value={form.eori_number}
              onChange={e => set('eori_number', e.target.value)} placeholder="GB123456789000" />
          </Field>
          <Field label="IOSS Number">
            <input style={inputStyle()} value={form.ioss_number}
              onChange={e => set('ioss_number', e.target.value)} placeholder="IM1234567890" />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Assign Staff ─────────────────────────────────────
function StepStaff({ form, set, salespeople, accountManagers, onboarders }) {
  const staffSelect = (field, options, placeholder) => (
    <select style={selectStyle} value={form[field]} onChange={e => set(field, e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
    </select>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Salesperson">{staffSelect('salesperson_id', salespeople, 'Select salesperson (optional)')}</Field>
      <Field label="Account Manager">{staffSelect('account_manager_id', accountManagers, 'Select account manager (optional)')}</Field>
      <Field label="Onboarding Person">{staffSelect('onboarding_person_id', onboarders, 'Select onboarding person (optional)')}</Field>
    </div>
  );
}

// ─── Step 3: Account Setup ────────────────────────────────────
function StepAccount({ form, set, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#AAAAAA', marginBottom: 10 }}>Account Tier</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TIERS.map(t => (
            <button key={t.value} onClick={() => set('tier', t.value)} style={{
              padding: '12px 16px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              background: form.tier === t.value ? 'rgba(123,47,190,0.2)' : 'rgba(255,255,255,0.03)',
              border: form.tier === t.value ? '1px solid #7B2FBE' : '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Field label="Credit Limit (£)" required error={errors.credit_limit}>
        <input style={inputStyle(errors.credit_limit)} value={form.credit_limit} type="number" min="0"
          onChange={e => set('credit_limit', e.target.value)} placeholder="0.00" />
      </Field>

      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#AAAAAA', marginBottom: 10 }}>Billing Period</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {BILLING_PERIODS.map(bp => (
            <button key={bp.value} onClick={() => set('billing_cycle', bp.value)} style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: form.billing_cycle === bp.value ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.03)',
              border: form.billing_cycle === bp.value ? '1px solid #00C853' : '1px solid rgba(255,255,255,0.08)',
              color: form.billing_cycle === bp.value ? '#00C853' : '#AAAAAA',
            }}>
              {bp.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#AAAAAA', marginBottom: 10 }}>Billing Terms</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {PAYMENT_TERMS.map(pt => (
            <button key={pt.value} onClick={() => set('payment_terms_days', pt.value)} style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: form.payment_terms_days === pt.value ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.03)',
              border: form.payment_terms_days === pt.value ? '1px solid #00C853' : '1px solid rgba(255,255,255,0.08)',
              color: form.payment_terms_days === pt.value ? '#00C853' : '#AAAAAA',
            }}>
              <div>{pt.label}</div>
              {pt.note && <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{pt.note}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: First Contact ────────────────────────────────────
function StepContact({ form, set, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={grid2}>
        <Field label="Full Name" required error={errors.contact_full_name}>
          <input style={inputStyle(errors.contact_full_name)} value={form.contact_full_name}
            onChange={e => set('contact_full_name', e.target.value)} placeholder="Jane Smith" />
        </Field>
        <Field label="Job Title">
          <input style={inputStyle()} value={form.contact_job_title}
            onChange={e => set('contact_job_title', e.target.value)} placeholder="Operations Manager" />
        </Field>
      </div>
      <div style={grid2}>
        <Field label="Email Address" required error={errors.contact_email}>
          <input style={inputStyle(errors.contact_email)} value={form.contact_email}
            onChange={e => set('contact_email', e.target.value)} placeholder="jane@company.co.uk" />
        </Field>
        <Field label="Phone Number">
          <input style={inputStyle()} value={form.contact_phone}
            onChange={e => set('contact_phone', e.target.value)} placeholder="+44 7700 900000" />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#AAAAAA' }}>
          <input type="checkbox" checked={form.contact_is_main}
            onChange={e => set('contact_is_main', e.target.checked)} style={{ accentColor: '#7B2FBE' }} />
          Main contact
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#AAAAAA' }}>
          <input type="checkbox" checked={form.contact_is_finance}
            onChange={e => set('contact_is_finance', e.target.checked)} style={{ accentColor: '#7B2FBE' }} />
          Finance contact
        </label>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = s.icon;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#00C853' : active ? '#7B2FBE' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? '#00C853' : active ? '#7B2FBE' : 'rgba(255,255,255,0.1)'}`,
                color: done || active ? '#fff' : '#666',
              }}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span style={{ fontSize: 11, color: active ? '#fff' : '#666', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#00C853' : 'rgba(255,255,255,0.08)', margin: '0 8px', marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function stepSubtitle(step) {
  return [
    "Enter the company's registration details, address, and contact information.",
    'Assign internal team members to this account.',
    'Set the account tier, credit limit, billing period and payment terms.',
    'Add the primary contact person for this company.',
  ][step];
}

// ─── Success screen ───────────────────────────────────────────
function SuccessScreen({ customer, navigate }) {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,200,83,0.15)', border: '2px solid #00C853', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Check size={28} color="#00C853" />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Customer Created</h2>
      <p style={{ color: '#AAAAAA', marginBottom: 4 }}>{customer.business_name}</p>
      <p style={{ color: '#00C853', fontWeight: 600, marginBottom: 28 }}>{customer.account_number}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate(`/customers/${customer.id}`)}>View Customer</button>
        <button className="btn-ghost" onClick={() => navigate('/customers/new')}>Add Another</button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function CustomerNew() {
  const navigate = useNavigate();
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [errors, setErrors]           = useState({});
  const [done, setDone]               = useState(false);
  const [newCustomer, setNewCustomer] = useState(null);

  const { data: salespeople = [] }     = useQuery({ queryKey: ['staff', 'sales'],              queryFn: () => staffApi.list('sales') });
  const { data: accountManagers = [] } = useQuery({ queryKey: ['staff', 'account_management'], queryFn: () => staffApi.list('account_management') });
  const { data: onboarders = [] }      = useQuery({ queryKey: ['staff', 'onboarding'],         queryFn: () => staffApi.list('onboarding') });

  const createCustomer = useMutation({
    mutationFn: async () => {
      const customer = await customersApi.create({
        business_name:        form.business_name,
        company_type:         form.company_type || undefined,
        company_reg_number:   form.company_reg_number || undefined,
        vat_number:           form.vat_number || undefined,
        address_line_1:       form.address_line_1 || undefined,
        address_line_2:       form.address_line_2 || undefined,
        city:                 form.city || undefined,
        county:               form.county || undefined,
        postcode:             form.postcode,
        country:              form.country || 'United Kingdom',
        phone_number:         form.phone_number,
        primary_email:        form.primary_email,
        accounts_email:       form.accounts_email || undefined,
        eori_number:          form.eori_number || undefined,
        ioss_number:          form.ioss_number || undefined,
        salesperson_id:       form.salesperson_id || undefined,
        account_manager_id:   form.account_manager_id || undefined,
        onboarding_person_id: form.onboarding_person_id || undefined,
        tier:                 form.tier,
        credit_limit:         parseFloat(form.credit_limit) || 0,
        billing_cycle:        form.billing_cycle,
        payment_terms_days:   form.payment_terms_days,
      });
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
    onSuccess: (customer) => { setNewCustomer(customer); setDone(true); },
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

  function back() { setErrors({}); setStep(s => s - 1); }

  if (done && newCustomer) return <SuccessScreen customer={newCustomer} navigate={navigate} />;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate('/customers')}
          style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={14} /> Customers
        </button>
        <span style={{ color: '#444' }}>/</span>
        <span style={{ fontSize: 13, color: '#fff' }}>Add Customer</span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853', marginBottom: 24 }}>Add Customer</h1>

      <StepIndicator steps={STEPS} current={step} />

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

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button className="btn-ghost" onClick={step === 0 ? () => navigate('/customers') : back}>
            <ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button className="btn-primary" onClick={next} disabled={createCustomer.isPending}>
            {createCustomer.isPending
              ? 'Saving…'
              : step === STEPS.length - 1
                ? <><Check size={14} /> Create Customer</>
                : <>Next <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
