import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Loader2, AlertCircle, Trash2, Plus, Upload, FileText, X } from 'lucide-react';
import axios from 'axios';
import { customersApi } from '../../api/customers';

const api = axios.create({ baseURL: '/api' });

// ─── Shared styles ─────────────────────────────────────────────
// Underline-style field (.ds-field), red bottom border on error
const fieldErrorStyle = (error) => (error ? { borderBottomColor: 'var(--mv-magenta)' } : undefined);
const textareaStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--color-surface)', border: '1px solid var(--color-divider)',
  padding: '14px 18px', color: 'var(--color-text)', fontSize: 13, outline: 'none',
  resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6,
};
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };
const sectionH = { fontSize: 11, color: 'var(--mv-purple)', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 };

function Field({ label, error, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--ds-muted)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--mv-magenta)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: 'var(--mv-magenta)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ─── PDF / Text input panel ────────────────────────────────────
// Handles both PDF upload and paste-text, triggering onReady(text) when content is ready.
function DocumentInput({ label, hint, onReady, loading, loadingMsg }) {
  const [mode, setMode]       = useState('upload'); // 'upload' | 'paste'
  const [pasteText, setPaste] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') return;
    setFileName(file.name);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/customers/parse-pdf', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onReady(data.text || '');
    } catch (e) {
      alert('Could not read PDF — ' + (e.response?.data?.error || e.message));
      setFileName('');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '40px 0' }}>
        <Loader2 size={32} color="var(--mv-purple)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--mv-purple)', margin: 0 }}>{loadingMsg || 'Processing…'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 0, border: '1px solid var(--color-divider)', alignSelf: 'flex-start' }}>
        {[['upload', 'Upload PDF'], ['paste', 'Paste Text']].map(([m, lbl]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '7px 16px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === m ? 'var(--color-accent-100)' : 'var(--color-bg)',
              color: mode === m ? 'var(--color-accent)' : 'var(--ds-muted)',
              borderRight: m === 'upload' ? '1px solid var(--color-divider)' : 'none',
            }}
          >
            {m === 'upload' ? <><Upload size={11} style={{ marginRight: 5 }} />{lbl}</> : lbl}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--mv-purple)' : fileName ? 'var(--mv-green)' : 'var(--color-divider)'}`,
              padding: '36px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, cursor: 'pointer',
              background: dragOver ? 'var(--color-accent-100)' : fileName ? 'color-mix(in srgb, var(--mv-green) 6%, transparent)' : 'var(--color-bg)',
              transition: 'all 0.15s',
            }}
          >
            {fileName ? (
              <>
                <FileText size={28} color="var(--mv-green)" />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--mv-green)', fontWeight: 600, margin: 0 }}>{fileName}</p>
                  <p style={{ fontSize: 12, color: 'var(--ds-muted)', margin: '4px 0 0' }}>PDF uploaded — AI will extract the data</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setFileName(''); fileRef.current.value = ''; }}
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-divider)', color: 'var(--ds-muted)', padding: '4px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <X size={11} /> Remove
                </button>
              </>
            ) : (
              <>
                <Upload size={28} color="var(--ds-muted)" />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--ds-muted)', fontWeight: 600, margin: 0 }}>Drop PDF here or click to browse</p>
                  <p style={{ fontSize: 12, color: 'var(--ds-muted)', margin: '4px 0 0' }}>{hint}</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
        </>
      ) : (
        <div>
          <textarea
            style={{ ...textareaStyle, minHeight: 220 }}
            value={pasteText}
            onChange={e => setPaste(e.target.value)}
            placeholder={hint}
          />
          <button
            onClick={() => pasteText.trim() && onReady(pasteText)}
            disabled={!pasteText.trim()}
            className="ds-btn ds-btn-primary"
            style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={13} /> Extract with AI
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 0: Moov Account Number ──────────────────────────────
function StepDcId({ moovAccountNumber, setMoovAccountNumber, moovAccountError }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        padding: '16px 20px',
        background: 'var(--color-accent-100)', borderLeft: '3px solid var(--color-accent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Sparkles size={16} color="var(--mv-purple)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mv-purple)' }}>AI-Assisted Onboarding</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ds-muted)', lineHeight: 1.6, margin: 0 }}>
          Provide the Moov account number, upload (or paste) the customer's application form PDF, then upload their rate card PDF.
          AI will extract all the details and pre-fill the forms — you just review and confirm.
        </p>
      </div>
      <Field label="Moov Account Number" required error={moovAccountError}>
        <input
          className="ds-field"
          style={fieldErrorStyle(moovAccountError)}
          value={moovAccountNumber}
          onChange={e => setMoovAccountNumber(e.target.value.trim().toUpperCase())}
          placeholder="e.g. MOOV-0187"
        />
      </Field>
      <p style={{ fontSize: 12, color: 'var(--ds-muted)', marginTop: -8 }}>
        The Moov account number (MOOV-xxxx) is used as the customer's identifier throughout the system, including for incoming webhook data from the delivery carrier.
      </p>
    </div>
  );
}

// ─── Customer editable fields (shown after extraction) ─────────
function CustomerFields({ customer, setCustomer, contact, setContact }) {
  function sc(f, v) { setCustomer(c => ({ ...c, [f]: v })); }
  function sco(f, v) { setContact(c => ({ ...c, [f]: v })); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '10px 14px', background: 'var(--color-accent-100)', borderLeft: '3px solid var(--mv-green)', fontSize: 13, color: 'var(--mv-green)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Check size={14} /> AI extracted the details below — review and correct anything that needs changing.
      </div>

      <div>
        <p style={sectionH}>Business Details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid2}>
            <Field label="Business Name" required>
              <input className="ds-field" value={customer.business_name || ''} onChange={e => sc('business_name', e.target.value)} />
            </Field>
            <Field label="Company Type">
              <select className="ds-field" value={customer.company_type || 'limited_company'} onChange={e => sc('company_type', e.target.value)}>
                <option value="limited_company">Limited Company (Ltd)</option>
                <option value="partnership">Partnership / LLP</option>
                <option value="sole_trader">Sole Trader</option>
              </select>
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Company Reg Number">
              <input className="ds-field" value={customer.company_reg_number || ''} onChange={e => sc('company_reg_number', e.target.value)} />
            </Field>
            <Field label="VAT Number">
              <input className="ds-field" value={customer.vat_number || ''} onChange={e => sc('vat_number', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div>
        <p style={sectionH}>Address</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Address Line 1">
            <input className="ds-field" value={customer.address_line_1 || ''} onChange={e => sc('address_line_1', e.target.value)} />
          </Field>
          <Field label="Address Line 2">
            <input className="ds-field" value={customer.address_line_2 || ''} onChange={e => sc('address_line_2', e.target.value)} />
          </Field>
          <div style={grid3}>
            <Field label="City">
              <input className="ds-field" value={customer.city || ''} onChange={e => sc('city', e.target.value)} />
            </Field>
            <Field label="County">
              <input className="ds-field" value={customer.county || ''} onChange={e => sc('county', e.target.value)} />
            </Field>
            <Field label="Postcode">
              <input className="ds-field" value={customer.postcode || ''} onChange={e => sc('postcode', e.target.value.toUpperCase())} />
            </Field>
          </div>
        </div>
      </div>

      <div>
        <p style={sectionH}>Contact Details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid2}>
            <Field label="Main Phone">
              <input className="ds-field" value={customer.phone_number || ''} onChange={e => sc('phone_number', e.target.value)} />
            </Field>
            <Field label="Main Email">
              <input className="ds-field" value={customer.primary_email || ''} onChange={e => sc('primary_email', e.target.value)} />
            </Field>
          </div>
          <Field label="Accounts / Billing Email">
            <input className="ds-field" value={customer.accounts_email || ''} onChange={e => sc('accounts_email', e.target.value)} />
          </Field>
        </div>
      </div>

      <div>
        <p style={sectionH}>Account Settings</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid3}>
            <Field label="Credit Limit (£)">
              <input className="ds-field" type="number" value={customer.credit_limit ?? ''} onChange={e => sc('credit_limit', e.target.value)} />
            </Field>
            <Field label="Billing Cycle">
              <select className="ds-field" value={customer.billing_cycle || 'monthly'} onChange={e => sc('billing_cycle', e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>
            <Field label="Payment Terms">
              <select className="ds-field" value={customer.payment_terms_days || 30} onChange={e => sc('payment_terms_days', parseInt(e.target.value))}>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={28}>28 days</option>
                <option value={30}>30 days</option>
              </select>
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Account Tier">
              <select className="ds-field" value={customer.tier || 'bronze'} onChange={e => sc('tier', e.target.value)}>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Field>
            <div style={grid2}>
              <Field label="EORI Number">
                <input className="ds-field" value={customer.eori_number || ''} onChange={e => sc('eori_number', e.target.value)} />
              </Field>
              <Field label="IOSS Number">
                <input className="ds-field" value={customer.ioss_number || ''} onChange={e => sc('ioss_number', e.target.value)} />
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
              <input className="ds-field" value={contact.full_name || ''} onChange={e => sco('full_name', e.target.value)} />
            </Field>
            <Field label="Job Title">
              <input className="ds-field" value={contact.job_title || ''} onChange={e => sco('job_title', e.target.value)} />
            </Field>
          </div>
          <div style={grid2}>
            <Field label="Email">
              <input className="ds-field" value={contact.email_address || ''} onChange={e => sco('email_address', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className="ds-field" value={contact.phone_number || ''} onChange={e => sco('phone_number', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Application Form ─────────────────────────────────
function StepApplicationForm({ customer, setCustomer, contact, setContact, formExtracted, setFormExtracted, extractingForm, setExtractingForm, setFormError }) {

  async function handleReady(text) {
    setExtractingForm(true);
    setFormError('');
    try {
      const data = await customersApi.aiExtract({ application_form_text: text });
      setCustomer(data.customer || {});
      setContact(data.contact || {});
      setFormExtracted(true);
    } catch (e) {
      setFormError('AI extraction failed — ' + (e.response?.data?.error || e.message));
    } finally {
      setExtractingForm(false);
    }
  }

  if (formExtracted) {
    return <CustomerFields customer={customer} setCustomer={setCustomer} contact={contact} setContact={setContact} />;
  }

  return (
    <DocumentInput
      label="Application Form"
      hint="Upload or paste the customer's application form — company name, address, VAT number, contact details, credit limit, payment terms etc."
      onReady={handleReady}
      loading={extractingForm}
      loadingMsg="Reading PDF and extracting customer details…"
    />
  );
}

// ─── Step 2: Rate Card ─────────────────────────────────────────
function StepRateCard({ rates, setRates, ratesExtracted, setRatesExtracted, extractingRates, setExtractingRates, setRateError }) {

  async function handleReady(text) {
    setExtractingRates(true);
    setRateError('');
    try {
      const data = await customersApi.aiExtractRates({ rate_card_text: text });
      setRates(data.rates || []);
      setRatesExtracted(true);
    } catch (e) {
      setRateError('Rate extraction failed — ' + (e.response?.data?.error || e.message));
    } finally {
      setExtractingRates(false);
    }
  }

  function updateRate(i, field, value) {
    setRates(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  function removeRate(i) { setRates(rs => rs.filter((_, idx) => idx !== i)); }
  function addRate() {
    setRates(rs => [...rs, { service_code: '', service_name: '', courier_name: '', zone_name: '', weight_class_name: '', min_weight_kg: null, max_weight_kg: null, price: '', price_sub: null }]);
  }

  const cellInput = (val, onChange, placeholder = '') => (
    <input
      value={val ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="ds-field"
      style={{ fontSize: 12, padding: '6px 4px' }}
    />
  );

  if (!ratesExtracted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DocumentInput
          label="Rate Card"
          hint="Upload or paste the customer's rate card — service names, zones, weight bands, prices."
          onReady={handleReady}
          loading={extractingRates}
          loadingMsg="Reading PDF and extracting pricing rows…"
        />
        <button
          className="ds-btn ds-btn-secondary"
          onClick={() => { setRates([]); setRatesExtracted(true); }}
          style={{ alignSelf: 'flex-start', fontSize: 13 }}
        >
          Skip — add rates later
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', background: 'var(--color-accent-100)', borderLeft: '3px solid var(--mv-green)', fontSize: 13, color: 'var(--mv-green)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Check size={14} /> {rates.length} rate{rates.length !== 1 ? 's' : ''} extracted — review, correct service codes, and remove any incorrect rows.
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: 'var(--ds-rule)' }}>
              {['Service Code', 'Service Name', 'Carrier', 'Zone', 'Weight Class', 'Min kg', 'Max kg', 'Price £', 'Sub £', ''].map(h => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--ds-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rates.map((r, i) => (
              <tr key={i} style={{ borderBottom: 'var(--ds-hairline)' }}>
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
                  <button onClick={() => removeRate(i)} style={{ background: 'none', border: 'none', color: 'var(--mv-magenta)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addRate} className="ds-btn ds-btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <Plus size={13} /> Add Row
      </button>

      {rates.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--ds-muted)' }}>No rates — customer will be created without pricing. You can add rates later from the customer record.</p>
      )}
    </div>
  );
}

// ─── Step 3: Review & Confirm ──────────────────────────────────
function StepConfirm({ dcId, moovAccountNumber, customer, contact, rates }) {
  const validRates = rates.filter(r => r.service_code && r.zone_name && r.price !== '' && r.price != null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ borderTop: '2px solid var(--color-divider)', paddingTop: 12 }}>
          <p style={sectionH}>Customer</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ReviewRow label="Business" value={customer.business_name} />
            <ReviewRow label="Moov No." value={moovAccountNumber} />
            <ReviewRow label="Postcode" value={customer.postcode} />
            <ReviewRow label="Email" value={customer.primary_email} />
            <ReviewRow label="Phone" value={customer.phone_number} />
            <ReviewRow label="VAT" value={customer.vat_number} />
            <ReviewRow label="Tier" value={customer.tier} />
            <ReviewRow label="Credit Limit" value={customer.credit_limit != null ? `£${parseFloat(customer.credit_limit).toFixed(2)}` : '—'} />
            <ReviewRow label="Billing" value={`${customer.billing_cycle} / ${customer.payment_terms_days} days`} />
          </div>
        </div>
        <div style={{ borderTop: '2px solid var(--color-divider)', paddingTop: 12 }}>
          <p style={sectionH}>Primary Contact</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ReviewRow label="Name" value={contact.full_name} />
            <ReviewRow label="Title" value={contact.job_title} />
            <ReviewRow label="Email" value={contact.email_address} />
            <ReviewRow label="Phone" value={contact.phone_number} />
          </div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid var(--color-divider)', paddingTop: 12 }}>
        <p style={sectionH}>Rates — {validRates.length} rows to import</p>
        {validRates.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ds-muted)' }}>No rates — will be added later.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {validRates.map((r, i) => (
              <span key={i} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--color-accent-100)', border: '1px solid var(--mv-green)', color: 'var(--mv-green)' }}>
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
      <span style={{ fontSize: 12, color: 'var(--ds-muted)', minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{value || '—'}</span>
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
        const done = i < current, active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--mv-green)' : active ? 'var(--mv-purple)' : 'var(--color-bg)',
                border: `2px solid ${done ? 'var(--mv-green)' : active ? 'var(--mv-purple)' : 'var(--color-divider)'}`,
                color: done || active ? 'var(--color-on-accent)' : 'var(--ds-muted)', fontSize: 13, fontWeight: 700,
              }}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, color: active ? 'var(--color-text)' : 'var(--ds-muted)', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--mv-green)' : 'var(--color-divider)', margin: '0 8px', marginBottom: 20 }} />
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
      <div style={{ width: 64, height: 64, background: 'var(--color-accent-100)', border: '2px solid var(--mv-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Check size={28} color="var(--mv-green)" />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Customer Created</h2>
      <p style={{ color: 'var(--ds-muted)', marginBottom: 4 }}>{customer.business_name}</p>
      <p style={{ color: 'var(--mv-green)', fontWeight: 600, marginBottom: 8 }}>{customer.account_number}</p>
      {rateResults && (
        <p style={{ fontSize: 13, color: 'var(--ds-muted)', marginBottom: 20 }}>
          {rateResults.inserted} rate{rateResults.inserted !== 1 ? 's' : ''} imported
          {rateResults.skipped?.length > 0 && `, ${rateResults.skipped.length} skipped (service codes not found)`}
        </p>
      )}
      {rateResults?.skipped?.length > 0 && (
        <div style={{ padding: 12, background: 'var(--mv-amber-100)', border: '1px solid var(--mv-amber)', marginBottom: 20, textAlign: 'left' }}>
          <p style={{ fontSize: 12, color: 'var(--mv-amber-deep)', marginBottom: 6, fontWeight: 600 }}>Skipped rates — service codes not in DB:</p>
          {rateResults.skipped.map((s, i) => (
            <p key={i} style={{ fontSize: 11, color: 'var(--ds-muted)', margin: '2px 0' }}>
              {s.rate?.service_code} · {s.rate?.zone_name} — {s.reason}
            </p>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="ds-btn ds-btn-primary" onClick={() => navigate(`/customers/${customer.id}`)}>View Customer</button>
        <button className="ds-btn ds-btn-secondary" onClick={() => navigate('/customers/ai-new')}>Add Another</button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function CustomerAI() {
  const navigate = useNavigate();

  const [step, setStep]   = useState(0);
  const [done, setDone]   = useState(false);
  const [result, setResult] = useState(null);

  // Step 0
  const [moovAccountNumber, setMoovAccountNumber] = useState('');
  const [moovAccountError, setMoovAccountError] = useState('');

  // Step 1
  const [customer, setCustomer]         = useState({});
  const [contact, setContact]           = useState({});
  const [formExtracted, setFormExtracted] = useState(false);
  const [extractingForm, setExtractingForm] = useState(false);
  const [formError, setFormError]       = useState('');

  // Step 2
  const [rates, setRates]               = useState([]);
  const [ratesExtracted, setRatesExtracted] = useState(false);
  const [extractingRates, setExtractingRates] = useState(false);
  const [rateError, setRateError]       = useState('');

  // Step 3
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');

  async function confirmCreate() {
    setSaving(true);
    setSaveError('');
    try {
      const validRates = rates.filter(r => r.service_code && r.zone_name && r.price !== '' && r.price != null);
      const customerPayload = { ...customer, account_number: moovAccountNumber };
      const data = await customersApi.aiOnboard({ customer: customerPayload, contact, rates: validRates });
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
      if (!moovAccountNumber.trim()) { setMoovAccountError('Moov account number is required (e.g. MOOV-0187)'); return; }
      setMoovAccountError('');
      setStep(1);
    } else if (step === 1) {
      if (!formExtracted) { setFormError('Please upload or paste the application form first'); return; }
      if (!customer.business_name) { setFormError('Business name is required — check the extracted data'); return; }
      setFormError('');
      setStep(2);
    } else if (step === 2) {
      if (!ratesExtracted) { setRateError('Please upload or paste the rate card (or click "Skip")'); return; }
      setRateError('');
      setStep(3);
    } else if (step === 3) {
      confirmCreate();
    }
  }

  function back() { if (step > 0) setStep(s => s - 1); }

  const stepTitles = ['DC Account Number', 'Application Form', 'Rate Card', 'Review & Confirm'];
  const stepSubtitles = [
    'Enter the Moov account number (MOOV-xxxx) for this customer.',
    'Upload the PDF or paste the text of the customer application form.',
    'Upload the PDF or paste the text of the customer rate card.',
    'Review everything and create the customer record.',
  ];

  if (done && result) return <SuccessScreen customer={result.customer} rateResults={result.rates} navigate={navigate} />;

  return (
    <div className="moov-ds" style={{ padding: '8px 0 48px', maxWidth: 880, margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate('/customers')}
          style={{ background: 'none', border: 'none', color: 'var(--ds-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={14} /> Customers
        </button>
        <span style={{ color: 'var(--ds-muted)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--color-text)' }}>AI-Assisted Onboarding</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Sparkles size={20} color="var(--mv-purple)" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--mv-purple)', margin: 0 }}>AI-Assisted Add Customer</h1>
      </div>

      <StepIndicator current={step} />

      <div style={{ paddingTop: 28, paddingBottom: 8, borderTop: '2px solid var(--color-divider)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--mv-purple)', marginBottom: 4 }}>{stepTitles[step]}</h2>
        <p style={{ fontSize: 13, color: 'var(--ds-muted)', marginBottom: 28 }}>{stepSubtitles[step]}</p>

        {step === 0 && <StepDcId moovAccountNumber={moovAccountNumber} setMoovAccountNumber={setMoovAccountNumber} moovAccountError={moovAccountError} />}

        {step === 1 && (
          <StepApplicationForm
            customer={customer} setCustomer={setCustomer}
            contact={contact} setContact={setContact}
            formExtracted={formExtracted} setFormExtracted={setFormExtracted}
            extractingForm={extractingForm} setExtractingForm={setExtractingForm}
            setFormError={setFormError}
          />
        )}

        {step === 2 && (
          <StepRateCard
            rates={rates} setRates={setRates}
            ratesExtracted={ratesExtracted} setRatesExtracted={setRatesExtracted}
            extractingRates={extractingRates} setExtractingRates={setExtractingRates}
            setRateError={setRateError}
          />
        )}

        {step === 3 && <StepConfirm moovAccountNumber={moovAccountNumber} customer={customer} contact={contact} rates={rates} />}

        {(formError || rateError || saveError) && (
          <div style={{ marginTop: 16, padding: 12, background: 'color-mix(in srgb, var(--mv-magenta) 12%, transparent)', border: '1px solid var(--mv-magenta)', fontSize: 13, color: 'var(--mv-magenta)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            {formError || rateError || saveError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: 'var(--ds-hairline)' }}>
          <button className="ds-btn ds-btn-secondary" onClick={step === 0 ? () => navigate('/customers') : back}>
            <ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            className="ds-btn ds-btn-primary"
            onClick={next}
            disabled={saving || extractingForm || extractingRates}
          >
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
