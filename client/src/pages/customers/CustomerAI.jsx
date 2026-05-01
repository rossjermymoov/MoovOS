import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Loader2, AlertCircle, Trash2, Plus } from 'lucide-react';
import { customersApi } from '../../api/customers';

// ─── Shared styles ─────────────────────────────────────────────
const inputStyle = (error) => ({
  width: '100%', boxSizing: 'border-box',
  background: '#0D0E2A', border: `1px solid ${error ? '#E91E8C' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 9999, padding: '10px 18px', color: '#fff', fontSize: 14, outline: 'none',
});
const selectStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 9999, padding: '10px 18px', color: '#fff', fontSize: 14, outline: 'none',
};
const textareaStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12, padding: '14px 18px', color: '#fff', fontSize: 13, outline: 'none',
  resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6,
};
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };
const sectionH = { fontSize: 11, color: '#7B2FBE', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 };

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

// ─── Step 0: DC Account Number ─────────────────────────────────
function StepDcId({ dcId, setDcId, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        padding: '16px 20px', borderRadius: 10,
        background: 'rgba(123,47,190,0.1)', border: '1px solid rgba(123,47,190,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Sparkles size={16} color="#7B2FBE" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7B2FBE' }}>AI-Assisted Onboarding</span>
        </div>
        <p style={{ fontSize: 13, color: '#AAAAAA', lineHeight: 1.6, margin: 0 }}>
          Provide the DC account number, paste the customer's application form, and paste their rate card.
          AI will extract all the details and pre-fill the forms — you just review and confirm.
        </p>
      </div>

      <Field label="DC Account Number" required error={error}>
        <input
          style={inputStyle(error)}
          value={dcId}
          onChange={e => setDcId(e.target.value.trim())}
          placeholder="e.g. 12345 — the account number already configured in the DC webhook"
        />
      </Field>
      <p style={{ fontSize: 12, color: '#666', marginTop: -8 }}>
        This is the external account number used in the delivery carrier webhook system. It links incoming shipment data to this customer.
      </p>
    </div>
  );
}

// ─── Step 1: Application Form ─────────────────────────────────
function StepApplicationForm({ formText, setFormText, customer, setCustomer, contact, setContact, extracting, onExtract, extracted }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!extracted ? (
        <>
          <Field label="Paste Application Form">
            <textarea
              style={{ ...textareaStyle, minHeight: 260 }}
              value={formText}
              onChange={e => setFormText(e.target.value)}
              placeholder="Paste the customer's application form text here — any format is fine. Include company name, address, VAT number, contact details, credit limit, payment terms etc."
            />
          </Field>
          <button
            className="btn-primary"
            onClick={onExtract}
            disabled={extracting || !formText.trim()}
            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {extracting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Extracting…</> : <><Sparkles size={14} /> Extract with AI</>}
          </button>
          {extracting && (
            <p style={{ fontSize: 13, color: '#7B2FBE' }}>AI is reading the form and extracting customer details…</p>
          )}
        </>
      ) : (
        <CustomerFields customer={customer} setCustomer={setCustomer} contact={contact} setContact={setContact} />
      )}
    </div>
  );
}

function CustomerFields({ customer, setCustomer, contact, setContact }) {
  function sc(f, v) { setCustomer(c => ({ ...c, [f]: v })); }
  function sco(f, v) { setContact(c => ({ ...c, [f]: v })); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '10px 14px', background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 8, fontSize: 13, color: '#00C853', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Check size={14} /> AI extracted the details below — review and correct anything that needs changing.
      </div>

      <div>
        <p style={sectionH}>Business Details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid2}>
            <Field label="Business Name" required>
              <input style={inputStyle()} value={customer.business_name || ''} onChange={e => sc('business_name', e.target.value)} />
            </Field>
            <Field label="Company Type">
              <select style={selectStyle} value={customer.company_type || 'limited_company'} onChange={e => sc('company_type', e.target.value)}>
                <option value="limited_company">Limited Company (Ltd)</option>
                <option value="partnership">Partnership / LLP</option>
                <option value="sole_trader">Sole Trader</option>
              </select>
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Company Reg Number">
              <input style={inputStyle()} value={customer.company_reg_number || ''} onChange={e => sc('company_reg_number', e.target.value)} />
            </Field>
            <Field label="VAT Number">
              <input style={inputStyle()} value={customer.vat_number || ''} onChange={e => sc('vat_number', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div>
        <p style={sectionH}>Address</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Address Line 1">
            <input style={inputStyle()} value={customer.address_line_1 || ''} onChange={e => sc('address_line_1', e.target.value)} />
          </Field>
          <Field label="Address Line 2">
            <input style={inputStyle()} value={customer.address_line_2 || ''} onChange={e => sc('address_line_2', e.target.value)} />
          </Field>
          <div style={grid3}>
            <Field label="City">
              <input style={inputStyle()} value={customer.city || ''} onChange={e => sc('city', e.target.value)} />
            </Field>
            <Field label="County">
              <input style={inputStyle()} value={customer.county || ''} onChange={e => sc('county', e.target.value)} />
            </Field>
            <Field label="Postcode">
              <input style={inputStyle()} value={customer.postcode || ''} onChange={e => sc('postcode', e.target.value.toUpperCase())} />
            </Field>
          </div>
        </div>
      </div>

      <div>
        <p style={sectionH}>Contact Details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid2}>
            <Field label="Main Phone">
              <input style={inputStyle()} value={customer.phone_number || ''} onChange={e => sc('phone_number', e.target.value)} />
            </Field>
            <Field label="Main Email">
              <input style={inputStyle()} value={customer.primary_email || ''} onChange={e => sc('primary_email', e.target.value)} />
            </Field>
          </div>
          <Field label="Accounts / Billing Email">
            <input style={inputStyle()} value={customer.accounts_email || ''} onChange={e => sc('accounts_email', e.target.value)} />
          </Field>
        </div>
      </div>

      <div>
        <p style={sectionH}>Account Settings</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid3}>
            <Field label="Credit Limit (£)">
              <input style={inputStyle()} type="number" value={customer.credit_limit ?? ''} onChange={e => sc('credit_limit', e.target.value)} />
            </Field>
            <Field label="Billing Cycle">
              <select style={selectStyle} value={customer.billing_cycle || 'monthly'} onChange={e => sc('billing_cycle', e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>
            <Field label="Payment Terms">
              <select style={selectStyle} value={customer.payment_terms_days || 30} onChange={e => sc('payment_terms_days', parseInt(e.target.value))}>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={28}>28 days</option>
                <option value={30}>30 days</option>
              </select>
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Account Tier">
              <select style={selectStyle} value={customer.tier || 'bronze'} onChange={e => sc('tier', e.target.value)}>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Field>
            <div style={grid2}>
              <Field label="EORI Number">
                <input style={inputStyle()} value={customer.eori_number || ''} onChange={e => sc('eori_number', e.target.value)} />
              </Field>
              <Field label="IOSS Number">
                <input style={inputStyle()} value={customer.ioss_number || ''} onChange={e => sc('ioss_number', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p style={sectionH}>Primary Contact Person</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid2}>
            <Field label="Full Name">
              <input style={inputStyle()} value={contact.full_name || ''} onChange={e => sco('full_name', e.target.value)} />
            </Field>
            <Field label="Job Title">
              <input style={inputStyle()} value={contact.job_title || ''} onChange={e => sco('job_title', e.target.value)} />
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Email">
              <input style={inputStyle()} value={contact.email_address || ''} onChange={e => sco('email_address', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input style={inputStyle()} value={contact.phone_number || ''} onChange={e => sco('phone_number', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Rate Card ─────────────────────────────────────────
function StepRateCard({ rateText, setRateText, rates, setRates, extracting, onExtract, extracted }) {
  function updateRate(i, field, value) {
    setRates(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  function removeRate(i) {
    setRates(rs => rs.filter((_, idx) => idx !== i));
  }
  function addRate() {
    setRates(rs => [...rs, {
      service_code: '', service_name: '', courier_name: '',
      zone_name: '', weight_class_name: '', min_weight_kg: null, max_weight_kg: null,
      price: '', price_sub: null,
    }]);
  }

  const cellInput = (val, onChange, placeholder = '') => (
    <input
      value={val ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box', background: '#0D0E2A',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
        padding: '6px 10px', color: '#fff', fontSize: 12, outline: 'none',
      }}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!extracted ? (
        <>
          <Field label="Paste Rate Card">
            <textarea
              style={{ ...textareaStyle, minHeight: 280 }}
              value={rateText}
              onChange={e => setRateText(e.target.value)}
              placeholder="Paste the customer's rate card here — any format works (PDF text, spreadsheet paste, table, etc). Include service names, zones, weight bands, and prices."
            />
          </Field>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              className="btn-primary"
              onClick={onExtract}
              disabled={extracting || !rateText.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {extracting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Extracting…</> : <><Sparkles size={14} /> Extract Rates with AI</>}
            </button>
            <button
              className="btn-ghost"
              onClick={() => { setRates([]); onExtract(true); }}
              style={{ fontSize: 13 }}
            >
              Skip — add rates later
            </button>
          </div>
          {extracting && (
            <p style={{ fontSize: 13, color: '#7B2FBE' }}>AI is reading the rate card and extracting pricing rows…</p>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '10px 14px', background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 8, fontSize: 13, color: '#00C853', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={14} /> {rates.length} rate{rates.length !== 1 ? 's' : ''} extracted — review, correct service codes, and remove any incorrect rows.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['Service Code', 'Service Name', 'Carrier', 'Zone', 'Weight Class', 'Min kg', 'Max kg', 'Price £', 'Sub Price £', ''].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#AAAAAA', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '5px 4px', minWidth: 90 }}>{cellInput(r.service_code, v => updateRate(i, 'service_code', v), 'DPD-NX')}</td>
                    <td style={{ padding: '5px 4px', minWidth: 130 }}>{cellInput(r.service_name, v => updateRate(i, 'service_name', v), 'DPD Next Day')}</td>
                    <td style={{ padding: '5px 4px', minWidth: 70 }}>{cellInput(r.courier_name, v => updateRate(i, 'courier_name', v), 'DPD')}</td>
                    <td style={{ padding: '5px 4px', minWidth: 80 }}>{cellInput(r.zone_name, v => updateRate(i, 'zone_name', v), 'Mainland')}</td>
                    <td style={{ padding: '5px 4px', minWidth: 90 }}>{cellInput(r.weight_class_name, v => updateRate(i, 'weight_class_name', v), '0-5kg')}</td>
                    <td style={{ padding: '5px 4px', width: 60 }}>{cellInput(r.min_weight_kg, v => updateRate(i, 'min_weight_kg', v === '' ? null : parseFloat(v)), '')}</td>
                    <td style={{ padding: '5px 4px', width: 60 }}>{cellInput(r.max_weight_kg, v => updateRate(i, 'max_weight_kg', v === '' ? null : parseFloat(v)), '')}</td>
                    <td style={{ padding: '5px 4px', width: 70 }}>{cellInput(r.price, v => updateRate(i, 'price', v), '0.00')}</td>
                    <td style={{ padding: '5px 4px', width: 70 }}>{cellInput(r.price_sub, v => updateRate(i, 'price_sub', v === '' ? null : parseFloat(v)), '')}</td>
                    <td style={{ padding: '5px 4px' }}>
                      <button onClick={() => removeRate(i)} style={{ background: 'none', border: 'none', color: '#E91E8C', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addRate} className="btn-ghost" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Plus size={13} /> Add Row
          </button>

          {rates.length === 0 && (
            <p style={{ fontSize: 13, color: '#666' }}>No rates — customer will be created without any pricing. You can add rates later from the customer record.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Review & Confirm ──────────────────────────────────
function StepConfirm({ dcId, customer, contact, rates }) {
  const validRates = rates.filter(r => r.service_code && r.zone_name && r.price !== '' && r.price != null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16 }}>
          <p style={sectionH}>Customer</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ReviewRow label="Business" value={customer.business_name} />
            <ReviewRow label="DC Account" value={dcId} />
            <ReviewRow label="Postcode" value={customer.postcode} />
            <ReviewRow label="Email" value={customer.primary_email} />
            <ReviewRow label="Phone" value={customer.phone_number} />
            <ReviewRow label="VAT" value={customer.vat_number} />
            <ReviewRow label="Tier" value={customer.tier} />
            <ReviewRow label="Credit Limit" value={customer.credit_limit != null ? `£${parseFloat(customer.credit_limit).toFixed(2)}` : '—'} />
            <ReviewRow label="Billing" value={`${customer.billing_cycle} / ${customer.payment_terms_days} days`} />
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16 }}>
          <p style={sectionH}>Primary Contact</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ReviewRow label="Name" value={contact.full_name} />
            <ReviewRow label="Title" value={contact.job_title} />
            <ReviewRow label="Email" value={contact.email_address} />
            <ReviewRow label="Phone" value={contact.phone_number} />
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16 }}>
        <p style={sectionH}>Rates — {validRates.length} rows to import</p>
        {validRates.length === 0 ? (
          <p style={{ fontSize: 13, color: '#666' }}>No rates — will be added later.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {validRates.map((r, i) => (
              <span key={i} style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 999, color: '#00C853' }}>
                {r.service_code} · {r.zone_name} · {r.weight_class_name || 'flat'} · £{parseFloat(r.price).toFixed(2)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#666', minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 12, color: value ? '#fff' : '#444' }}>{value || '—'}</span>
    </div>
  );
}

// ─── Step indicator ────────────────────────────────────────────
const STEPS = [
  { label: 'Account ID' },
  { label: 'Application Form' },
  { label: 'Rate Card' },
  { label: 'Confirm' },
];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#00C853' : active ? '#7B2FBE' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? '#00C853' : active ? '#7B2FBE' : 'rgba(255,255,255,0.1)'}`,
                color: done || active ? '#fff' : '#666', fontSize: 13, fontWeight: 700,
              }}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, color: active ? '#fff' : '#666', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#00C853' : 'rgba(255,255,255,0.08)', margin: '0 8px', marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────
function SuccessScreen({ customer, rateResults, navigate }) {
  return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,200,83,0.15)', border: '2px solid #00C853', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Check size={28} color="#00C853" />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Customer Created</h2>
      <p style={{ color: '#AAAAAA', marginBottom: 4 }}>{customer.business_name}</p>
      <p style={{ color: '#00C853', fontWeight: 600, marginBottom: 8 }}>{customer.account_number}</p>
      {rateResults && (
        <p style={{ fontSize: 13, color: '#AAAAAA', marginBottom: 20 }}>
          {rateResults.inserted} rate{rateResults.inserted !== 1 ? 's' : ''} imported
          {rateResults.skipped?.length > 0 && `, ${rateResults.skipped.length} skipped (service codes not found)`}
        </p>
      )}
      {rateResults?.skipped?.length > 0 && (
        <div style={{ padding: 12, background: 'rgba(255,160,0,0.1)', border: '1px solid rgba(255,160,0,0.3)', borderRadius: 8, marginBottom: 20, textAlign: 'left' }}>
          <p style={{ fontSize: 12, color: '#FFA000', marginBottom: 6, fontWeight: 600 }}>Skipped rates — service codes not in DB:</p>
          {rateResults.skipped.map((s, i) => (
            <p key={i} style={{ fontSize: 11, color: '#AAAAAA', margin: '2px 0' }}>
              {s.rate?.service_code} · {s.rate?.zone_name} — {s.reason}
            </p>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate(`/customers/${customer.id}`)}>View Customer</button>
        <button className="btn-ghost" onClick={() => navigate('/customers/ai-new')}>Add Another</button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function CustomerAI() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [done, setDone]   = useState(false);
  const [result, setResult] = useState(null);

  // Step 0
  const [dcId, setDcId] = useState('');
  const [dcIdError, setDcIdError] = useState('');

  // Step 1
  const [formText, setFormText]     = useState('');
  const [customer, setCustomer]     = useState({});
  const [contact, setContact]       = useState({});
  const [formExtracted, setFormExtracted] = useState(false);
  const [extractingForm, setExtractingForm] = useState(false);
  const [formError, setFormError]   = useState('');

  // Step 2
  const [rateText, setRateText]     = useState('');
  const [rates, setRates]           = useState([]);
  const [ratesExtracted, setRatesExtracted] = useState(false);
  const [extractingRates, setExtractingRates] = useState(false);
  const [rateError, setRateError]   = useState('');

  // Step 3
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');

  async function extractForm() {
    if (!formText.trim()) return;
    setExtractingForm(true);
    setFormError('');
    try {
      const data = await customersApi.aiExtract({ application_form_text: formText });
      setCustomer(data.customer || {});
      setContact(data.contact || {});
      setFormExtracted(true);
    } catch (e) {
      setFormError('AI extraction failed — ' + (e.response?.data?.error || e.message));
    } finally {
      setExtractingForm(false);
    }
  }

  async function extractRates(skip = false) {
    if (skip) { setRates([]); setRatesExtracted(true); return; }
    if (!rateText.trim()) return;
    setExtractingRates(true);
    setRateError('');
    try {
      const data = await customersApi.aiExtractRates({ rate_card_text: rateText });
      setRates(data.rates || []);
      setRatesExtracted(true);
    } catch (e) {
      setRateError('Rate extraction failed — ' + (e.response?.data?.error || e.message));
    } finally {
      setExtractingRates(false);
    }
  }

  async function confirmCreate() {
    setSaving(true);
    setSaveError('');
    try {
      const validRates = rates.filter(r => r.service_code && r.zone_name && r.price !== '' && r.price != null);
      const data = await customersApi.aiOnboard({ dc_id: dcId, customer, contact, rates: validRates });
      setResult(data);
      setDone(true);
    } catch (e) {
      setSaveError('Failed to create customer — ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (step === 0) {
      if (!dcId.trim()) { setDcIdError('DC account number is required'); return; }
      setDcIdError('');
      setStep(1);
    } else if (step === 1) {
      if (!formExtracted) { setFormError('Please extract the application form first'); return; }
      if (!customer.business_name) { setFormError('Business name is required — check the extracted data'); return; }
      setFormError('');
      setStep(2);
    } else if (step === 2) {
      if (!ratesExtracted) { setRateError('Please extract the rate card (or click "Skip")'); return; }
      setRateError('');
      setStep(3);
    } else if (step === 3) {
      confirmCreate();
    }
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
  }

  const stepTitles = ['DC Account Number', 'Application Form', 'Rate Card', 'Review & Confirm'];
  const stepSubtitles = [
    'Provide the DC account number that is already configured in the webhook system.',
    'Paste the customer application form and let AI extract the details.',
    'Paste the rate card and let AI extract all pricing rows.',
    'Review everything and create the customer record.',
  ];

  if (done && result) return <SuccessScreen customer={result.customer} rateResults={result.rates} navigate={navigate} />;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate('/customers')}
          style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={14} /> Customers
        </button>
        <span style={{ color: '#444' }}>/</span>
        <span style={{ fontSize: 13, color: '#fff' }}>AI-Assisted Onboarding</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Sparkles size={20} color="#7B2FBE" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#7B2FBE', margin: 0 }}>AI-Assisted Add Customer</h1>
      </div>

      <StepIndicator current={step} />

      <div className="moov-card" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#7B2FBE', marginBottom: 4 }}>{stepTitles[step]}</h2>
        <p style={{ fontSize: 13, color: '#AAAAAA', marginBottom: 28 }}>{stepSubtitles[step]}</p>

        {step === 0 && <StepDcId dcId={dcId} setDcId={setDcId} error={dcIdError} />}
        {step === 1 && (
          <StepApplicationForm
            formText={formText} setFormText={setFormText}
            customer={customer} setCustomer={setCustomer}
            contact={contact} setContact={setContact}
            extracting={extractingForm} onExtract={extractForm}
            extracted={formExtracted}
          />
        )}
        {step === 2 && (
          <StepRateCard
            rateText={rateText} setRateText={setRateText}
            rates={rates} setRates={setRates}
            extracting={extractingRates} onExtract={extractRates}
            extracted={ratesExtracted}
          />
        )}
        {step === 3 && <StepConfirm dcId={dcId} customer={customer} contact={contact} rates={rates} />}

        {(formError || rateError || saveError) && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(233,30,140,0.1)', border: '1px solid #E91E8C', borderRadius: 8, fontSize: 13, color: '#E91E8C', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            {formError || rateError || saveError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button className="btn-ghost" onClick={step === 0 ? () => navigate('/customers') : back}>
            <ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button className="btn-primary" onClick={next} disabled={saving || extractingForm || extractingRates}>
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
              : step === 3
                ? <><Check size={14} /> Create Customer</>
                : <>Next <ArrowRight size={14} /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
