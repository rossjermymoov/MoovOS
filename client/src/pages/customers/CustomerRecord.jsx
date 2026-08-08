import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, AlertTriangle, Phone, Mail, X, Check, Trash2, Bug, RefreshCw, Plus,
  FlaskConical, Upload, Pencil, Download, Bell, FileText, GitCompare, History,
} from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
import { customersApi } from '../../api/customers';
import { customerRateCardsApi } from '../../api/customerRateCards';
import CustomerPricingTab from './tabs/CustomerPricingTab';
import HappinessScore from './tabs/HappinessScore';
import CustomerOnboardingTab from './tabs/CustomerOnboardingTab';
import { onboardingTemplatesApi } from '../../api/onboardingTemplates';
import { integrationSoftwareApi } from '../../api/integrationSoftware';
import { format } from 'date-fns';

const TABS = [
  { key: 'overview',   label: 'Overview' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'contacts',   label: 'Contacts' },
  { key: 'comms',      label: 'Communications' },
  { key: 'volume',     label: 'Performance' },
  { key: 'financial',  label: 'Financial' },
  { key: 'pricing',    label: 'Pricing' },
  { key: 'happiness',  label: 'Happiness' },
];

const COMPANY_TYPE_LABELS = {
  limited_company: 'Limited Company (Ltd)',
  partnership:     'Partnership / LLP',
  sole_trader:     'Sole Trader',
};
const BILLING_PERIOD_LABELS = { weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly' };
const INTEGRATION_LABELS = { moov_ninja: 'Moov Ninja', moov_api: 'Moov API', third_party: 'Third-party software' };

const gbp = (n) => `£${parseFloat(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const gbp0 = (n) => `£${parseFloat(n || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

const STATUS_MARK = {
  active:     ['settled',   'Active'],
  onboarding: ['waiting',   'Onboarding'],
  on_stop:    ['attention', 'On stop'],
  suspended:  ['attention', 'Suspended'],
  churned:    ['waiting',   'Churned'],
};
function StateMark({ status }) {
  const [mk, label] = STATUS_MARK[status] || ['waiting', (status || '').replace(/_/g, ' ')];
  return (
    <span className={`mv-state mv-state--${mk}`}>
      <span className={`mv-mark mv-mark--${mk}`} />
      <span className="mv-state-label">{label}</span>
    </span>
  );
}

// ─── Section + fact list (edit form) ─────────────────────────
function Section({ title, children, style }) {
  return (
    <div style={{ marginBottom: 22, ...style }}>
      <div className="mv-section">{title}</div>
      <div className="mv-rule" style={{ marginBottom: 2 }} />
      <div className="mv-facts">{children}</div>
    </div>
  );
}
function Row({ label, value, edit, editNode }) {
  return (
    <div className="mv-fact">
      <span className="mv-fact-k">{label}</span>
      {edit
        ? <span style={{ width: 220, flexShrink: 0 }}>{editNode}</span>
        : <span className="mv-fact-v" style={{ textAlign: 'right', wordBreak: 'break-word' }}>{value ?? '—'}</span>}
    </div>
  );
}

// ─── Prototype fact grid (read mode): label on top, bold value below ───
function FactGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
      {items.map((it, i) => (
        <div key={i} style={{ padding: '14px 20px 14px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{it.k}</div>
          <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 4, letterSpacing: '-.005em', wordBreak: 'break-word' }}>
            {it.v == null || it.v === '' ? <span style={{ color: 'var(--mv-ink-45)', fontWeight: 400 }}>—</span> : it.v}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Carrier accounts (kept, restyled) ───────────────────────
function CustomerRateCardAssignments({ customerId }) {
  const { data: carrierLinks = [], isLoading, isError } = useQuery({
    queryKey: ['customer-carrier-links', customerId],
    queryFn: async () => {
      const r = await fetch(`/api/customer-carrier-links/${customerId}`);
      if (!r.ok) throw new Error('Failed to fetch carrier links');
      return r.json();
    },
    enabled: !!customerId,
  });
  if (isLoading) return <Section title="Carrier accounts"><div className="mv-blurb" style={{ marginTop: 0 }}>Loading…</div></Section>;
  if (isError) return <Section title="Carrier accounts"><div className="mv-blurb" style={{ marginTop: 0, color: 'var(--mv-magenta-deep)' }}>Could not load carrier accounts.</div></Section>;
  return (
    <Section title="Carrier accounts">
      {carrierLinks.length === 0 && <div className="mv-fact"><span className="mv-fact-k">No carriers linked yet.</span></div>}
      {carrierLinks.map(link => (
        <div className="mv-fact" key={link.link_id || link.id}>
          <span className="mv-fact-k">{link.carrier_name || link.courier_name}{link.label ? ` · ${link.label}` : ''}</span>
          <span className="mv-fact-v mv-num">{link.account_number || '—'}</span>
        </div>
      ))}
    </Section>
  );
}

function TestAccountSection({ customer, onToggle }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(!!customer.is_test_account);
  useEffect(() => { setEnabled(!!customer.is_test_account); }, [customer.is_test_account]);
  async function toggle() {
    const nv = !enabled; setEnabled(nv); setBusy(true);
    try { await api.put(`/customers/${customer.id}/test-account`, { enabled: nv }); qc.invalidateQueries(['customer', customer.id]); onToggle?.(); }
    catch (err) { setEnabled(!nv); console.error('Test account toggle failed:', err.response?.data || err.message); }
    finally { setBusy(false); }
  }
  return (
    <div style={{ marginBottom: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `3px solid ${enabled ? 'var(--mv-magenta)' : 'var(--mv-divider)'}`, background: enabled ? 'rgba(233,30,140,.06)' : 'transparent' }}>
      <FlaskConical size={18} color={enabled ? 'var(--mv-magenta)' : 'var(--mv-ink-45)'} strokeWidth={1.5} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>Test account</span>
          {enabled && <span className="mv-state-label" style={{ color: 'var(--mv-magenta-deep)' }}>All charges £0</span>}
        </div>
        <p className="mv-blurb" style={{ margin: '3px 0 0', maxWidth: 620 }}>When enabled, all incoming shipment charges are forced to £0 and surcharges are skipped. Add Moov IDs or DCIDs below to route multiple test accounts here.</p>
      </div>
      <div className={'mv-switch' + (enabled ? ' is-on' : '')} onClick={busy ? undefined : toggle} style={{ opacity: busy ? 0.5 : 1 }}><span /></div>
    </div>
  );
}

function LinkedIdsSection({ customer }) {
  const qc = useQueryClient();
  const [aliases, setAliases] = useState(customer.billing_aliases || []);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  useEffect(() => { setAliases(customer.billing_aliases || []); }, [customer.billing_aliases]);
  async function addAlias() {
    const t = input.trim(); if (!t) return; setAdding(true);
    try { const res = await api.post(`/customers/${customer.id}/billing-aliases`, { alias: t }); setAliases(res.data.billing_aliases); setInput(''); qc.invalidateQueries(['customer', customer.id]); }
    catch (err) { console.error('Add alias failed:', err.response?.data || err.message); }
    finally { setAdding(false); }
  }
  async function removeAlias(alias) {
    try { const res = await api.delete(`/customers/${customer.id}/billing-aliases`, { data: { alias } }); setAliases(res.data.billing_aliases); qc.invalidateQueries(['customer', customer.id]); }
    catch (err) { console.error('Remove alias failed:', err.response?.data || err.message); }
  }
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="mv-section">Linked Moov IDs / DCIDs</div>
      <div className="mv-rule" style={{ marginBottom: 10 }} />
      <p className="mv-blurb" style={{ marginTop: 0, maxWidth: 620 }}>Any Moov ID or DCID added here will route incoming shipments to this account.</p>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0', alignItems: 'flex-end' }}>
        <input className="mv-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAlias()} placeholder="e.g. MOOV-0042 or DC-00123" style={{ fontFamily: 'monospace', maxWidth: 300 }} />
        <button className="mv-btn mv-btn--sm" onClick={addAlias} disabled={adding || !input.trim()} style={adding || !input.trim() ? { opacity: 0.5, pointerEvents: 'none' } : undefined}><Plus size={12} /> Add</button>
      </div>
      {aliases.length === 0 ? <span className="mv-blurb" style={{ marginTop: 0 }}>No linked IDs yet.</span> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {aliases.map(alias => (
            <span key={alias} className="mv-chip" style={{ cursor: 'default', gap: 6, fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center' }}>
              {alias}
              <button onClick={() => removeAlias(alias)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--mv-ink-45)' }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function IntegrationOnboardingCard({ c, edit, form, set }) {
  const { data: templates = [] } = useQuery({ queryKey: ['onb-templates'], queryFn: onboardingTemplatesApi.list });
  const { data: software = [] } = useQuery({ queryKey: ['integration-software'], queryFn: integrationSoftwareApi.list });
  const method = edit ? form.integration_method : c.integration_method;
  const activeTemplates = templates.filter(t => t.is_active);
  const tier = edit ? form.tier : c.tier;
  const suggested = activeTemplates.find(t => (t.applicable_methods || []).includes(method) || (t.applicable_tiers || []).includes(tier));
  const chosenId = edit ? form.onboarding_template_id : c.onboarding_template_id;
  const showSuggest = edit && suggested && suggested.id !== chosenId;
  return (
    <Section title="Integration & Onboarding">
      <Row label="Integration" value={INTEGRATION_LABELS[c.integration_method] || '—'} edit={edit}
        editNode={<select className="mv-input" value={form.integration_method} onChange={e => set('integration_method', e.target.value)}><option value="moov_ninja">Moov Ninja</option><option value="moov_api">Moov API</option><option value="third_party">Third-party software</option></select>} />
      {method === 'third_party' && (
        <Row label="Software" value={c.third_party_software} edit={edit}
          editNode={<><input className="mv-input" list="moov-software-list" value={form.third_party_software} onChange={e => set('third_party_software', e.target.value)} placeholder="e.g. ShipStation" /><datalist id="moov-software-list">{software.map(s => <option key={s.id} value={s.name} />)}</datalist></>} />
      )}
      <Row label="Template" value={c.onboarding_template_name || 'Not set'} edit={edit}
        editNode={<select className="mv-input" value={form.onboarding_template_id} onChange={e => set('onboarding_template_id', e.target.value)}><option value="">Not set</option>{activeTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>} />
      {showSuggest && <div style={{ fontSize: 11, color: 'var(--mv-purple)', marginTop: 6, cursor: 'pointer' }} onClick={() => set('onboarding_template_id', suggested.id)}>Suggested: <strong>{suggested.name}</strong> — click to apply</div>}
    </Section>
  );
}

// ─── Happiness signals rail (Overview right) ─────────────────
function SignalsRail({ c }) {
  const onStopScore = c.is_on_stop ? 15 : 80;
  const rows = [
    { label: 'Sentiment', score: null, note: 'Awaiting ticket analysis', source: 'Pending — ticket analysis' },
    { label: 'On-stop pattern', score: onStopScore, note: c.is_on_stop ? 'Currently on stop' : 'Not on stop · history pending', source: 'Live from account events' },
    { label: 'Delivery', score: null, note: 'Awaiting tracking data', source: 'Pending — tracking' },
  ];
  return (
    <div>
      <div className="mv-section">Happiness signals</div>
      <div className="mv-rule" style={{ marginBottom: 12 }} />
      {rows.map((r, i) => {
        const pending = r.score == null;
        const colour = pending ? 'var(--mv-ink-45)' : (r.score >= 71 ? 'var(--mv-green-deep)' : 'var(--mv-magenta-deep)');
        return (
          <div key={r.label} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{r.label}</span>
              <span className="mv-num" style={{ fontWeight: 800, fontSize: 14, color: colour }}>{pending ? '—' : r.score}</span>
            </div>
            <div className="mv-bar" style={{ width: '100%', height: 3, margin: '7px 0 8px' }}>
              {pending ? <span style={{ width: '100%', background: 'rgba(32,30,29,.12)' }} /> : <span className={r.score >= 71 ? '' : 'is-over'} style={{ width: `${r.score}%` }} />}
            </div>
            <p className="mv-blurb" style={{ marginTop: 0, fontSize: 12 }}>{r.note}</p>
          </div>
        );
      })}
    </div>
  );
}

function RecentActivityRail({ items }) {
  return (
    <div style={{ marginTop: 26 }}>
      <div className="mv-section">Recent activity</div>
      <div className="mv-rule" style={{ marginBottom: 12 }} />
      {(!items || items.length === 0) && <p className="mv-blurb" style={{ marginTop: 0, fontSize: 12 }}>No recent activity yet.</p>}
      {(items || []).slice(0, 4).map((it, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
          <div className="mv-cell-dim" style={{ fontSize: 11, marginTop: 1 }}>{it.when}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────
function OverviewTab({ c, recent, onSaved, onDeleteRequest }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});

  function startEdit() {
    setForm({
      business_name: c.business_name || '', company_type: c.company_type || 'limited_company',
      company_reg_number: c.company_reg_number || '', vat_number: c.vat_number || '',
      address_line_1: c.address_line_1 || '', address_line_2: c.address_line_2 || '', city: c.city || '',
      county: c.county || '', postcode: c.postcode || '', country: c.country || 'United Kingdom',
      phone_number: c.phone_number || '', primary_email: c.primary_email || '', accounts_email: c.accounts_email || '',
      eori_number: c.eori_number || '', ioss_number: c.ioss_number || '', billing_cycle: c.billing_cycle || 'monthly',
      payment_terms_days: c.payment_terms_days ?? 7, credit_limit: c.credit_limit ?? 0, bond_amount_held: c.bond_amount_held ?? 0,
      tier: c.tier || 'bronze', manual_billing: c.manual_billing ?? false, dc_customer_id: c.dc_customer_id || '',
      integration_method: c.integration_method || 'moov_ninja', third_party_software: c.third_party_software || '',
      onboarding_template_id: c.onboarding_template_id || '',
    });
    setEdit(true);
  }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  const save = useMutation({
    mutationFn: () => customersApi.update(c.id, {
      ...form, payment_terms_days: parseInt(form.payment_terms_days), credit_limit: parseFloat(form.credit_limit) || 0,
      bond_amount_held: parseFloat(form.bond_amount_held) || 0, company_reg_number: form.company_reg_number || null,
      vat_number: form.vat_number || null, address_line_1: form.address_line_1 || null, address_line_2: form.address_line_2 || null,
      city: form.city || null, county: form.county || null, accounts_email: form.accounts_email || null,
      eori_number: form.eori_number || null, ioss_number: form.ioss_number || null, dc_customer_id: form.dc_customer_id || null,
      third_party_software: form.integration_method === 'third_party' ? (form.third_party_software || null) : null,
      onboarding_template_id: form.onboarding_template_id || null,
    }),
    onSuccess: (updated) => { onSaved(updated); setEdit(false); },
  });

  const businessItems = [
    { k: 'Trading name', v: c.business_name },
    { k: 'Business type', v: COMPANY_TYPE_LABELS[c.company_type] },
    { k: 'Company number', v: c.company_reg_number },
    { k: 'VAT number', v: c.vat_number },
    { k: 'Sector', v: c.sector || c.industry },
    { k: 'Started with Moov', v: c.date_onboarded ? format(new Date(c.date_onboarded), 'dd MMM yyyy') : null },
  ];
  const addressItems = [
    { k: 'Line 1', v: c.address_line_1 }, { k: 'Line 2', v: c.address_line_2 }, { k: 'Town', v: c.city },
    { k: 'Postcode', v: c.postcode }, { k: 'Country', v: c.country }, { k: 'Collection window', v: c.collection_window },
  ];
  const settingsItems = [
    { k: 'Account manager', v: c.account_manager_name || 'Unmanaged' },
    { k: 'Salesperson', v: c.salesperson_name },
    { k: 'Integration', v: INTEGRATION_LABELS[c.integration_method] },
    { k: 'Tier', v: c.tier ? c.tier.charAt(0).toUpperCase() + c.tier.slice(1) : null },
    { k: 'Credit limit', v: gbp0(c.credit_limit) },
    { k: 'Billing', v: BILLING_PERIOD_LABELS[c.billing_cycle] || c.billing_cycle },
  ];

  return (
    <div>
      {/* Edit toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
        {edit ? (
          <>
            <button className="mv-btn mv-btn--sm" onClick={() => setEdit(false)}><X size={13} /> Cancel</button>
            <button className="mv-btn mv-btn--sm mv-btn--primary" onClick={() => save.mutate()} disabled={save.isPending}><Check size={13} /> {save.isPending ? 'Saving…' : 'Save changes'}</button>
          </>
        ) : <button className="mv-btn mv-btn--sm" onClick={startEdit}><Pencil size={13} /> Edit details</button>}
      </div>

      {save.isError && <div className="mv-banner" style={{ marginBottom: 16 }}><div className="mv-banner-title">Couldn’t save</div><div className="mv-banner-sub">Something went wrong saving these changes. Please try again.</div></div>}

      {edit ? (
        /* EDIT MODE — the full form */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <Section title="Business details">
              <Row label="Business name" value={c.business_name} edit editNode={<input className="mv-input" value={form.business_name} onChange={e => set('business_name', e.target.value)} />} />
              <Row label="Company type" value={COMPANY_TYPE_LABELS[c.company_type]} edit editNode={<select className="mv-input" value={form.company_type} onChange={e => set('company_type', e.target.value)}><option value="limited_company">Limited Company (Ltd)</option><option value="partnership">Partnership / LLP</option><option value="sole_trader">Sole Trader</option></select>} />
              <Row label="Company reg. no." value={c.company_reg_number} edit editNode={<input className="mv-input" value={form.company_reg_number} onChange={e => set('company_reg_number', e.target.value)} placeholder="12345678" />} />
              <Row label="VAT number" value={c.vat_number} edit editNode={<input className="mv-input" value={form.vat_number} onChange={e => set('vat_number', e.target.value)} placeholder="GB123456789" />} />
              <Row label="Phone" value={c.phone_number} edit editNode={<input className="mv-input" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />} />
              <Row label="Main email" value={c.primary_email} edit editNode={<input className="mv-input" value={form.primary_email} onChange={e => set('primary_email', e.target.value)} />} />
              <Row label="Accounts email" value={c.accounts_email} edit editNode={<input className="mv-input" value={form.accounts_email} onChange={e => set('accounts_email', e.target.value)} placeholder="(same as main)" />} />
            </Section>
            <Section title="Address">
              <Row label="Address line 1" value={c.address_line_1} edit editNode={<input className="mv-input" value={form.address_line_1} onChange={e => set('address_line_1', e.target.value)} />} />
              <Row label="Address line 2" value={c.address_line_2} edit editNode={<input className="mv-input" value={form.address_line_2} onChange={e => set('address_line_2', e.target.value)} />} />
              <Row label="City / town" value={c.city} edit editNode={<input className="mv-input" value={form.city} onChange={e => set('city', e.target.value)} />} />
              <Row label="County" value={c.county} edit editNode={<input className="mv-input" value={form.county} onChange={e => set('county', e.target.value)} />} />
              <Row label="Postcode" value={c.postcode} edit editNode={<input className="mv-input" value={form.postcode} onChange={e => set('postcode', e.target.value.toUpperCase())} />} />
              <Row label="Country" value={c.country} edit editNode={<input className="mv-input" value={form.country} onChange={e => set('country', e.target.value)} />} />
            </Section>
          </div>
          <div>
            <Section title="Account settings">
              <Row label="Tier" value={c.tier} edit editNode={<select className="mv-input" value={form.tier} onChange={e => set('tier', e.target.value)}><option value="bronze">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option><option value="enterprise">Enterprise</option></select>} />
              <Row label="Credit limit" value={gbp(c.credit_limit)} edit editNode={<input className="mv-input" type="number" min="0" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} />} />
              <Row label="Bond held" value={parseFloat(c.bond_amount_held) > 0 ? gbp(c.bond_amount_held) : 'None'} edit editNode={<input className="mv-input" type="number" min="0" step="0.01" value={form.bond_amount_held} onChange={e => set('bond_amount_held', e.target.value)} placeholder="0.00" />} />
              <Row label="Billing period" value={BILLING_PERIOD_LABELS[c.billing_cycle] || c.billing_cycle} edit editNode={<select className="mv-input" value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)}><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option></select>} />
              <Row label="Payment terms" value={`${c.payment_terms_days} days`} edit editNode={<select className="mv-input" value={form.payment_terms_days} onChange={e => set('payment_terms_days', e.target.value)}><option value={7}>7 days</option><option value={14}>14 days</option><option value={28}>28 days</option><option value={30}>30 days</option></select>} />
            </Section>
            <IntegrationOnboardingCard c={c} edit={edit} form={form} set={set} />
          </div>
        </div>
      ) : (
        /* READ MODE — the prototype layout: grids + rail */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48, alignItems: 'start' }}>
          <div>
            <div className="mv-section">Business details</div><div className="mv-rule" /><div style={{ marginBottom: 26 }}><FactGrid items={businessItems} /></div>
            <div className="mv-section">Address</div><div className="mv-rule" /><div style={{ marginBottom: 26 }}><FactGrid items={addressItems} /></div>
            <div className="mv-section">Account settings &amp; API</div><div className="mv-rule" /><div><FactGrid items={settingsItems} /></div>
          </div>
          <div>
            <SignalsRail c={c} />
            <RecentActivityRail items={recent} />
          </div>
        </div>
      )}

      {/* App controls kept, restyled — below the record */}
      <div style={{ marginTop: 34, borderTop: '2px solid var(--mv-divider)', paddingTop: 24 }}>
        <TestAccountSection customer={c} onToggle={onSaved} />
        <LinkedIdsSection customer={c} />
        <CustomerRateCardAssignments customerId={c.id} />
      </div>

      {!edit && (
        <div className="mv-banner" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <div><div className="mv-banner-title">Delete customer</div><div className="mv-banner-sub">Permanently removes this customer and all associated data. This cannot be undone.</div></div>
          <button className="mv-btn mv-btn--danger mv-btn--sm" onClick={onDeleteRequest} style={{ flexShrink: 0 }}><Trash2 size={13} /> Delete customer</button>
        </div>
      )}
    </div>
  );
}

// ─── Contacts ────────────────────────────────────────────────
const BLANK_CONTACT = { full_name: '', job_title: '', phone_number: '', email_address: '', is_main_contact: false, is_finance_contact: false };
function ContactsTab({ customerId, contacts = [], onRefresh, adding, setAdding }) {
  const [addForm, setAddForm] = useState(BLANK_CONTACT);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [delConfirm, setDelConfirm] = useState(null);
  const qc = useQueryClient();
  const invalidate = () => { qc.invalidateQueries(['customer', customerId]); onRefresh?.(); };
  const addContact = useMutation({ mutationFn: (data) => fetch(`/api/customers/${customerId}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()), onSuccess: () => { setAdding(false); setAddForm(BLANK_CONTACT); invalidate(); } });
  const patchContact = useMutation({ mutationFn: ({ id, data }) => fetch(`/api/customers/${customerId}/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()), onSuccess: () => { setEditingId(null); invalidate(); } });
  const deleteContact = useMutation({ mutationFn: (id) => fetch(`/api/customers/${customerId}/contacts/${id}`, { method: 'DELETE' }).then(r => r.json()), onSuccess: () => { setDelConfirm(null); invalidate(); } });
  const startEdit = (ct) => { setEditingId(ct.id); setEditForm({ full_name: ct.full_name, job_title: ct.job_title || '', phone_number: ct.phone_number || '', email_address: ct.email_address, is_main_contact: ct.is_main_contact, is_finance_contact: ct.is_finance_contact }); };
  const gets = (ct) => ct.is_main_contact ? 'All updates' : ct.is_finance_contact ? 'Invoices' : 'Nothing automated';
  const primary = (ct) => ct.is_main_contact ? ['settled', 'Primary'] : ct.is_finance_contact ? ['flight', 'Finance'] : ['waiting', '—'];
  const fld = (v, on, ph) => <input className="mv-input" value={v} placeholder={ph} onChange={e => on(e.target.value)} />;
  return (
    <div style={{ maxWidth: 1040 }}>
      {adding && (
        <div style={{ borderTop: '2px solid var(--mv-divider)', padding: '16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          {[['full_name', 'Name'], ['job_title', 'Role'], ['email_address', 'Email'], ['phone_number', 'Phone']].map(([k, l]) => (
            <div key={k}><div className="mv-label">{l}</div>{fld(addForm[k], v => setAddForm(f => ({ ...f, [k]: v })), l)}</div>
          ))}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <button className={'mv-chip' + (addForm.is_main_contact ? ' is-on' : '')} onClick={() => setAddForm(f => ({ ...f, is_main_contact: !f.is_main_contact }))}>Primary contact</button>
            <button className={'mv-chip' + (addForm.is_finance_contact ? ' is-on' : '')} onClick={() => setAddForm(f => ({ ...f, is_finance_contact: !f.is_finance_contact }))}>Finance contact</button>
            <div style={{ flex: 1 }} />
            <button className="mv-btn mv-btn--sm" onClick={() => { setAdding(false); setAddForm(BLANK_CONTACT); }}>Cancel</button>
            <button className="mv-btn mv-btn--primary mv-btn--sm" disabled={!addForm.full_name || !addForm.email_address || addContact.isPending} onClick={() => addContact.mutate(addForm)}>Save contact</button>
          </div>
        </div>
      )}
      <table className="mv-table" style={{ marginTop: adding ? 8 : 0 }}>
        <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Gets</th><th>Primary</th><th style={{ width: 66 }}></th></tr></thead>
        <tbody>
          {contacts.length === 0 && !adding && <tr><td colSpan={7} className="mv-cell-dim" style={{ padding: '24px 0' }}>No contacts yet. Add the person who signs and the person you ring.</td></tr>}
          {contacts.map(ct => {
            if (editingId === ct.id) return (
              <tr key={ct.id}>
                <td>{fld(editForm.full_name, v => setEditForm(f => ({ ...f, full_name: v })), 'Name')}</td>
                <td>{fld(editForm.job_title, v => setEditForm(f => ({ ...f, job_title: v })), 'Role')}</td>
                <td>{fld(editForm.email_address, v => setEditForm(f => ({ ...f, email_address: v })), 'Email')}</td>
                <td>{fld(editForm.phone_number, v => setEditForm(f => ({ ...f, phone_number: v })), 'Phone')}</td>
                <td colSpan={2}><div style={{ display: 'flex', gap: 6 }}><button className={'mv-chip' + (editForm.is_main_contact ? ' is-on' : '')} onClick={() => setEditForm(f => ({ ...f, is_main_contact: !f.is_main_contact }))}>Primary</button><button className={'mv-chip' + (editForm.is_finance_contact ? ' is-on' : '')} onClick={() => setEditForm(f => ({ ...f, is_finance_contact: !f.is_finance_contact }))}>Finance</button></div></td>
                <td><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}><button className="mv-btn mv-btn--sm mv-btn--primary" style={{ padding: '0 8px' }} onClick={() => patchContact.mutate({ id: ct.id, data: editForm })}><Check size={13} /></button><button className="mv-btn mv-btn--sm" style={{ padding: '0 8px' }} onClick={() => setEditingId(null)}><X size={13} /></button></div></td>
              </tr>
            );
            if (delConfirm === ct.id) return (
              <tr key={ct.id}>
                <td colSpan={5} style={{ fontSize: 13, color: 'var(--mv-magenta-deep)', fontWeight: 600 }}>Delete {ct.full_name}? This can’t be undone.</td>
                <td colSpan={2}><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}><button className="mv-btn mv-btn--danger mv-btn--sm" onClick={() => deleteContact.mutate(ct.id)}>Delete</button><button className="mv-btn mv-btn--sm" onClick={() => setDelConfirm(null)}>Keep</button></div></td>
              </tr>
            );
            const pr = primary(ct);
            return (
              <tr key={ct.id}>
                <td className="mv-cell-strong">{ct.full_name}</td>
                <td className="mv-cell-dim">{ct.job_title || '—'}</td>
                <td>{ct.email_address}</td>
                <td className="mv-num mv-cell-dim">{ct.phone_number || '—'}</td>
                <td className="mv-cell-dim">{gets(ct)}</td>
                <td><span className={`mv-state mv-state--${pr[0]}`}><span className={`mv-mark mv-mark--${pr[0]}`} /><span className="mv-state-label">{pr[1]}</span></span></td>
                <td><div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button title="Edit" onClick={() => startEdit(ct)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mv-ink-45)' }}>Edit</button><button title="Delete" onClick={() => setDelConfirm(ct.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mv-magenta-deep)' }}><Trash2 size={14} /></button></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Performance ─────────────────────────────────────────────
function PerformanceTab({ customerId }) {
  const [showPerfDebug, setShowPerfDebug] = useState(false);
  const { data: perfData, isLoading, isError } = useQuery({
    queryKey: ['customer-perf', customerId],
    queryFn: async () => { const r = await fetch(`/api/billing/charges/customer-perf?customerId=${customerId}`); if (!r.ok) throw new Error('Failed'); return r.json(); },
    enabled: !!customerId,
  });
  if (isLoading) return <div className="mv-blurb" style={{ padding: 24 }}>Loading performance data…</div>;
  if (isError || !perfData) return <div className="mv-banner"><div className="mv-banner-title">Couldn’t load performance</div></div>;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="mv-btn mv-btn--sm" onClick={() => setShowPerfDebug(d => !d)}><Bug size={12} /> {showPerfDebug ? 'Hide debug' : 'Debug numbers'}</button>
      </div>
      {showPerfDebug && (
        <div style={{ marginBottom: 20, border: '1px solid var(--mv-hairline-2)', fontSize: 11 }}>
          <div style={{ padding: '8px 14px', background: 'var(--mv-purple-100)' }}><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mv-purple-700)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Performance debug</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[{ label: 'Last 7 days', d: perfData.last7 }, { label: 'Last 30 days', d: perfData.last30 }, { label: 'All time', d: perfData.all }].map(({ label, d }) => (
              <div key={label} style={{ padding: '10px 14px', borderRight: '1px solid var(--mv-hairline)' }}>
                <div style={{ fontWeight: 700, color: 'var(--mv-ink-62)', fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                {[{ k: 'charges', v: d?.charges }, { k: 'parcels', v: d?.parcels }, { k: 'revenue', v: d?.revenue != null ? `£${parseFloat(d.revenue).toFixed(2)}` : '—' }, { k: 'profit', v: d?.profit != null ? `£${parseFloat(d.profit).toFixed(2)}` : '—' }].map(({ k, v }) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mv-ink-62)' }}><span>{k}</span><span className="mv-num" style={{ fontWeight: 600 }}>{v}</span></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="mv-section" style={{ marginBottom: 0 }}>Daily revenue — last 30 days</div>
        <div className="mv-rule" style={{ margin: '10px 0 0' }} />
        <MiniBarChart dailyData={perfData.daily || []} />
      </div>
      {(perfData.by_courier || []).length > 0 && (
        <div style={{ marginTop: 26 }}>
          <table className="mv-table">
            <thead><tr><th>Service</th><th className="is-right">Charges</th><th className="is-right">Revenue</th><th className="is-right">Cost</th><th className="is-right">Profit</th></tr></thead>
            <tbody>
              {perfData.by_courier.map(row => (
                <tr key={row.service_name}>
                  <td className="mv-cell-strong">{row.service_name}</td>
                  <td className="is-right mv-num mv-cell-dim">{row.charges}</td>
                  <td className="is-right mv-num">{gbp(row.revenue)}</td>
                  <td className="is-right mv-num mv-cell-dim">{gbp(row.cost)}</td>
                  <td className="is-right mv-num" style={{ color: parseFloat(row.profit) >= 0 ? 'var(--mv-green-deep)' : 'var(--mv-magenta-deep)', fontWeight: 600 }}>{gbp(row.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function MiniBarChart({ dailyData }) {
  if (!dailyData || !dailyData.length) return <p className="mv-blurb">No data yet</p>;
  const max = Math.max(...dailyData.map(d => parseFloat(d.revenue || 0)), 1);
  const sorted = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const peak = Math.max(...sorted.map(d => parseFloat(d.revenue || 0)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, marginTop: 16 }}>
      {sorted.map((d, i) => { const v = parseFloat(d.revenue || 0); return <div key={i} title={`${format(new Date(d.date), 'dd MMM')}: ${gbp(d.revenue)}`} style={{ flex: 1, height: `${Math.max((v / max) * 100, 3)}%`, background: v >= peak * 0.98 ? 'var(--mv-green)' : 'rgba(32,30,29,.22)' }} />; })}
    </div>
  );
}

// ─── Financial ───────────────────────────────────────────────
function FinancialTab({ c }) {
  const queryClient = useQueryClient();
  const [stopReason, setStopReason] = useState('');
  const [showStopForm, setShowStopForm] = useState(false);
  const { data: credit, refetch: refetchCredit } = useQuery({
    queryKey: ['xero-credit-status', c.id],
    queryFn: () => fetch(`/api/xero/customers/${c.id}/credit-status`).then(r => r.json()),
    refetchInterval: 5 * 60 * 1000,
  });
  const onStopMutation = useMutation({ mutationFn: ({ reason }) => fetch(`/api/customers/${c.id}/on-stop`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) }).then(r => r.json()), onSuccess: () => { queryClient.invalidateQueries(['customer', c.id]); queryClient.invalidateQueries(['xero-credit-status', c.id]); setShowStopForm(false); setStopReason(''); } });
  const liftStopMutation = useMutation({ mutationFn: () => fetch(`/api/customers/${c.id}/on-stop`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: 'Lifted via Financial tab' }) }).then(r => r.json()), onSuccess: () => { queryClient.invalidateQueries(['customer', c.id]); queryClient.invalidateQueries(['xero-credit-status', c.id]); } });
  const pct = credit?.utilisation_pct ?? 0;
  const status = credit?.credit_status ?? 'ok';
  const barCls = status === 'over_limit' ? 'is-over' : status === 'warning' ? 'is-warn' : '';
  return (
    <div>
      {credit?.credit_limit > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="mv-kpi-label">Credit utilisation</span>
            <span className="mv-num" style={{ fontWeight: 700, color: barCls === 'is-over' ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)' }}>{pct.toFixed(1)}%</span>
          </div>
          <div className="mv-bar" style={{ width: '100%', height: 4 }}><span className={barCls} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
        </div>
      )}
      {status === 'over_limit' && <div className="mv-banner" style={{ marginBottom: 16 }}><AlertTriangle size={16} style={{ color: 'var(--mv-magenta-deep)', flexShrink: 0 }} /><div><div className="mv-banner-title">Credit limit exceeded</div><div className="mv-banner-sub">This customer should be placed on stop.</div></div></div>}
      {status === 'warning' && <div className="mv-banner mv-banner--note" style={{ marginBottom: 16 }}><AlertTriangle size={16} style={{ color: 'var(--mv-purple-700)', flexShrink: 0 }} /><div><div className="mv-banner-title">Approaching credit limit</div><div className="mv-banner-sub">{(100 - pct).toFixed(1)}% remaining.</div></div></div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12 }}>
          <span className="mv-kpi-label" style={{ marginBottom: 0 }}>Status</span><StateMark status={c.account_status} />
          {c.is_on_stop && c.on_stop_applied_at && <span className="mv-cell-dim">since {format(new Date(c.on_stop_applied_at), 'dd MMM yyyy')}</span>}
          {c.is_on_stop && c.on_stop_reason && <span className="mv-cell-dim" style={{ fontStyle: 'italic' }}>“{c.on_stop_reason}”</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {c.is_on_stop ? <button className="mv-btn mv-btn--sm" onClick={() => liftStopMutation.mutate()} disabled={liftStopMutation.isPending}>Lift on stop</button> : (status !== 'ok' && !showStopForm && <button className="mv-btn mv-btn--danger mv-btn--sm" onClick={() => setShowStopForm(true)}>Apply on stop</button>)}
          <button className="mv-btn mv-btn--sm" onClick={() => refetchCredit()} title="Refresh"><RefreshCw size={13} /></button>
        </div>
      </div>
      {showStopForm && (
        <div style={{ marginBottom: 20, borderLeft: '3px solid var(--mv-magenta)', background: 'rgba(233,30,140,.05)', padding: 16 }}>
          <div className="mv-label">Reason for placing on stop</div>
          <textarea className="mv-input" value={stopReason} onChange={e => setStopReason(e.target.value)} rows={2} placeholder="e.g. Credit limit exceeded — awaiting payment of overdue invoices" style={{ minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button className="mv-btn mv-btn--sm" onClick={() => { setShowStopForm(false); setStopReason(''); }}>Cancel</button>
            <button className="mv-btn mv-btn--danger mv-btn--sm" onClick={() => onStopMutation.mutate({ reason: stopReason })} disabled={!stopReason.trim() || onStopMutation.isPending}>{onStopMutation.isPending ? 'Applying…' : 'Confirm on stop'}</button>
          </div>
        </div>
      )}
      {credit?.xero_linked && (
        <div>
          <div className="mv-section">Outstanding invoices</div><div className="mv-rule" style={{ marginBottom: 2 }} />
          {!credit.xero_connected && <div className="mv-blurb" style={{ marginTop: 8 }}>Xero not connected — go to Settings → Xero to connect.</div>}
          {credit.xero_connected && credit.invoices?.length === 0 && <div className="mv-blurb" style={{ marginTop: 8 }}>No outstanding invoices in Xero.</div>}
          {credit.xero_connected && credit.invoices?.length > 0 && (
            <table className="mv-table" style={{ marginTop: 8 }}>
              <thead><tr><th>Invoice</th><th>Date</th><th>Due</th><th className="is-right">Amount due</th><th>State</th></tr></thead>
              <tbody>
                {credit.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="mv-cell-strong mv-num">{inv.number || '—'}</td>
                    <td className="mv-num mv-cell-dim">{inv.date || '—'}</td>
                    <td className="mv-num" style={{ color: inv.is_overdue ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-62)' }}>{inv.due_date || '—'}</td>
                    <td className="is-right mv-num" style={{ fontWeight: 700, color: inv.is_overdue ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)' }}>{gbp(inv.amount_due)}</td>
                    <td>{inv.is_overdue ? <span className="mv-state mv-state--attention"><span className="mv-mark mv-mark--attention" /><span className="mv-state-label">Overdue</span></span> : <span className="mv-state mv-state--waiting"><span className="mv-mark mv-mark--waiting" /><span className="mv-state-label">Open</span></span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Communications ──────────────────────────────────────────
const DIR_CFG = {
  inbound_customer: { label: 'From Customer', color: 'var(--mv-green-deep)' },
  outbound_customer: { label: 'To Customer', color: 'var(--mv-green-deep)' },
  inbound_courier: { label: 'From Courier', color: 'var(--mv-teal-deep)' },
  outbound_courier: { label: 'To Courier', color: 'var(--mv-teal-deep)' },
  internal_note: { label: 'Internal Note', color: 'var(--mv-purple)' },
  inbound: { label: 'Inbound', color: 'var(--mv-green-deep)' },
  outbound: { label: 'Outbound', color: 'var(--mv-green-deep)' },
};
function CustomerCommsTab({ customerId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers/${customerId}/correspondence`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)).then(data => { setItems(data); setError(null); }).catch(e => setError(String(e))).finally(() => setLoading(false));
  }, [customerId]);
  const isNote = (it) => /note|internal/i.test(it.direction || '') || it.source === 'internal_note';
  const tagOf = (it) => {
    if (isNote(it)) return ['Internal note', 'var(--mv-purple)'];
    const inbound = /in/i.test(it.direction || '') && !/internal/i.test(it.direction || '');
    if (inbound) return [(DIR_CFG[it.direction]?.label) || 'Inbound', DIR_CFG[it.direction]?.color || 'var(--mv-green-deep)'];
    return [(DIR_CFG[it.direction]?.label) || 'Outbound', DIR_CFG[it.direction]?.color || 'var(--mv-ink-62)'];
  };
  const who = (it) => it.from_address || it.to_address || '—';
  const when = (it) => it.created_at ? new Date(it.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  return (
    <div style={{ maxWidth: 860 }}>
      {loading && <div className="mv-blurb" style={{ padding: '18px 0' }}>Reading the thread…</div>}
      {error && <div className="mv-blurb" style={{ padding: '18px 0', color: 'var(--mv-magenta-deep)' }}>Could not load correspondence: {error}</div>}
      {!loading && !error && !items.length && <div className="mv-blurb" style={{ padding: '18px 0' }}>Nothing said yet. Emails, courier replies and internal notes will appear here.</div>}
      {items.map(it => {
        const t = tagOf(it); const note = isNote(it); const open = expanded === it.id;
        return (
          <div key={it.id} onClick={() => setExpanded(open ? null : it.id)} style={{ padding: note ? '17px 0 19px 16px' : '17px 0 19px', borderBottom: '1px solid var(--mv-hairline)', borderLeft: note ? '3px solid var(--mv-purple)' : 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: t[1], flexShrink: 0 }}>{t[0]}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.subject || who(it)}</span>
              <span className="mv-cell-dim" style={{ fontSize: 10.5, whiteSpace: 'nowrap', flexShrink: 0 }}>{when(it)}</span>
            </div>
            {open ? (
              <div style={{ marginTop: 8 }}>
                {(it.from_address || it.to_address) && <div className="mv-cell-dim" style={{ fontSize: 11, marginBottom: 6 }}>{it.from_address ? `From ${it.from_address}` : ''}{it.to_address ? ` · To ${it.to_address}` : ''}</div>}
                <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{it.body_text || '(no body)'}</div>
              </div>
            ) : (it.body_text && <div className="mv-cell-dim" style={{ fontSize: 13, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(it.body_text || '').slice(0, 160)}</div>)}
          </div>
        );
      })}
    </div>
  );
}

// ─── Per-tab header meta ─────────────────────────────────────
const TAB_BLURB = {
  overview:   null,
  onboarding: null,
  contacts:   'Who to ring, and who signs. The primary contact gets every automated update.',
  comms:      'Everything said to and about this account, in one thread — customer, courier and internal.',
  volume:     'Thirty days of parcels and revenue, and which carrier carried them.',
  financial:  'Credit exposure first, then the invoices behind it. Exposure counts what is billed and what is not yet billed.',
  pricing:    'Turn carriers on, choose the services they may use, then set the markup we take over carrier cost.',
  happiness:  null,
};

// ─── Main component ──────────────────────────────────────────
export default function CustomerRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [onStopModal, setOnStopModal] = useState(null);
  const [onStopInput, setOnStopInput] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [contactsAdding, setContactsAdding] = useState(false);

  const { data, isLoading, refetch } = useQuery({ queryKey: ['customer', id], queryFn: () => customersApi.get(id) });

  // Contextual data for KPIs / activity (shared react-query keys, so tab bodies reuse the cache)
  const { data: perf } = useQuery({ queryKey: ['customer-perf', id], queryFn: () => fetch(`/api/billing/charges/customer-perf?customerId=${id}`).then(r => r.ok ? r.json() : null), enabled: !!id });
  const { data: credit } = useQuery({ queryKey: ['xero-credit-status', id], queryFn: () => fetch(`/api/xero/customers/${id}/credit-status`).then(r => r.json()), enabled: !!id, refetchInterval: 5 * 60 * 1000 });
  const { data: openQueries } = useQuery({ queryKey: ['customer-open-queries', id], queryFn: () => fetch(`/api/queries?customer_id=${id}&limit=1`).then(r => r.ok ? r.json() : null), enabled: !!id });
  const { data: recentCorr } = useQuery({ queryKey: ['customer-correspondence', id], queryFn: () => fetch(`/api/customers/${id}/correspondence`).then(r => r.ok ? r.json() : []), enabled: !!id });

  const applyOnStop = useMutation({ mutationFn: ({ reason }) => customersApi.applyOnStop(id, { reason, staff_id: 'CURRENT_USER_ID' }), onSuccess: () => { queryClient.invalidateQueries(['customer', id]); setOnStopModal(null); setOnStopInput(''); } });
  const removeOnStop = useMutation({ mutationFn: ({ note }) => customersApi.removeOnStop(id, { note, staff_id: 'CURRENT_USER_ID' }), onSuccess: () => { queryClient.invalidateQueries(['customer', id]); setOnStopModal(null); setOnStopInput(''); } });
  function handleCustomerSaved(updated) { queryClient.setQueryData(['customer', id], d => ({ ...d, customer: { ...d.customer, ...updated } })); }
  const deleteCustomer = useMutation({ mutationFn: () => customersApi.delete(id), onSuccess: () => navigate('/customers') });

  if (isLoading) return <div className="mv-page-inner" style={{ color: 'var(--mv-ink-62)' }}>Loading customer record…</div>;
  if (!data) return <div className="mv-page-inner" style={{ color: 'var(--mv-magenta-deep)' }}>Customer not found.</div>;

  const { customer: c, contacts, comm_summary, active_volume_alert } = data;
  const addressParts = [c.address_line_1, c.city, c.postcode].filter(Boolean);
  const addressDisplay = addressParts.length ? addressParts.join(', ') : c.postcode;
  const onboardedStr = c.date_onboarded ? format(new Date(c.date_onboarded), 'dd MMM yyyy').toUpperCase() : null;

  // Recent activity from correspondence
  const recent = (recentCorr || []).slice(0, 4).map(it => ({
    title: it.subject || (it.body_text || '').slice(0, 60) || 'Message',
    when: it.created_at ? new Date(it.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
  }));

  // Export the performance breakdown as CSV
  function exportPerfCsv() {
    const rows = (perf?.by_courier || []).map(r => [r.service_name, r.charges, r.revenue, r.cost, r.profit]);
    const csv = ['Service,Charges,Revenue,Cost,Profit', ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${c.account_number}-performance.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const onStopBtn = !c.is_on_stop
    ? <button className="mv-btn mv-btn--danger" onClick={() => setOnStopModal('apply')}>Place on stop</button>
    : <button className="mv-btn" onClick={() => setOnStopModal('remove')}>Remove on stop</button>;

  // Per-tab header actions (prototype). Some are wired; visual-only ones marked in code.
  const ACTIONS = {
    overview:   <><button className="mv-btn" onClick={() => setActiveTab('comms')}><Phone size={14} />Log a call</button>{onStopBtn}</>,
    onboarding: <><button className="mv-btn" title="Coming soon">Apply template</button><button className="mv-btn mv-btn--primary" title="Coming soon">Send chaser</button></>,
    contacts:   <><button className="mv-btn" title="Coming soon"><Upload size={14} />Import</button><button className="mv-btn mv-btn--primary" onClick={() => setContactsAdding(true)}><Plus size={14} />Add contact</button></>,
    comms:      <><button className="mv-btn"><Pencil size={14} />Internal note</button><button className="mv-btn mv-btn--primary"><Mail size={14} />Write email</button></>,
    volume:     <><button className="mv-btn" onClick={exportPerfCsv}><Download size={14} />Export CSV</button><button className="mv-btn mv-btn--primary" title="Coming soon"><Bell size={14} />Volume alert</button></>,
    financial:  <>{onStopBtn}<button className="mv-btn mv-btn--primary" title="Coming soon"><FileText size={14} />Raise invoice</button></>,
    pricing:    <><button className="mv-btn" title="Coming soon"><GitCompare size={14} />Compare to card</button><button className="mv-btn mv-btn--primary" title="Coming soon"><Check size={14} />Publish changes</button></>,
    happiness:  <><button className="mv-btn" title="Coming soon"><History size={14} />Signal history</button><button className="mv-btn mv-btn--primary" title="Coming soon"><Phone size={14} />Log a check-in</button></>,
  };

  // Contextual KPI strip (only overview / performance / financial)
  const marginPct = perf?.last30?.revenue > 0 ? ((parseFloat(perf.last30.profit || 0) / parseFloat(perf.last30.revenue)) * 100).toFixed(1) : null;
  const KPIS = {
    overview: [
      { label: 'Charges, 30 days', value: perf ? (perf.last30?.charges || 0).toLocaleString('en-GB') : '—', sub: perf ? `${gbp0(perf.last30?.revenue)} sell` : '' },
      { label: 'Margin', value: marginPct != null ? `${marginPct}%` : '—', sub: perf ? `${gbp0(perf.last30?.profit)} profit` : '' },
      { label: 'Credit used', value: `${Math.round(parseFloat(c.credit_utilisation_pct) || 0)}%`, sub: `${gbp0(c.outstanding_balance)} of ${gbp0(c.credit_limit)}` },
      { label: 'Open queries', value: openQueries?.total != null ? String(openQueries.total) : '—', attention: (openQueries?.total || 0) > 0, sub: openQueries?.total ? 'need a look' : 'none open' },
    ],
    volume: [
      { label: 'Parcels, 30 days', value: perf ? (perf.last30?.parcels || 0).toLocaleString('en-GB') : '—', sub: perf ? `${(perf.last7?.parcels || 0).toLocaleString('en-GB')} in the last 7` : '' },
      { label: 'Revenue, 30 days', value: perf ? gbp0(perf.last30?.revenue) : '—', sub: perf ? `${gbp0(perf.last7?.revenue)} in the last 7` : '' },
      { label: 'On-time', value: '—', sub: 'pending tracking' },
      { label: 'Claims', value: '—', sub: 'pending tracking' },
    ],
    financial: [
      { label: 'Total exposure', value: gbp0(credit?.total_exposure ?? 0), attention: (credit?.credit_status && credit.credit_status !== 'ok'), sub: credit?.utilisation_pct ? `${credit.utilisation_pct.toFixed(0)}% of ${gbp0(credit?.credit_limit)}` : '' },
      { label: 'Xero outstanding', value: gbp0(credit?.xero_outstanding ?? 0), sub: credit?.invoices?.length ? `${credit.invoices.length} invoices open` : 'nothing open' },
      { label: 'Unbilled charges', value: gbp0(credit?.moovos_unbilled ?? 0), sub: `${credit?.moovos_unbilled_count ?? 0} charges` },
      { label: 'Days to pay', value: c.payment_terms_days ?? '—', sub: c.billing_cycle ? `billed ${c.billing_cycle}` : '' },
    ],
  };
  const kpis = KPIS[activeTab];
  const blurb = TAB_BLURB[activeTab];

  return (
    <div className="mv-page-inner">
      <button onClick={() => navigate('/customers')} style={{ background: 'none', border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--mv-purple)', fontSize: 10, fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', padding: 0, fontFamily: 'inherit' }}>
        <ArrowLeft size={13} /> All customers
      </button>

      {c.is_on_stop && (
        <div className="mv-banner" style={{ margin: '14px 0 0' }}>
          <div style={{ flex: 1 }}><div className="mv-banner-title">Account on stop</div><div className="mv-banner-sub">Shipment access blocked · {c.on_stop_reason}</div></div>
          <button className="mv-btn mv-btn--sm" onClick={() => setOnStopModal('remove')}>Remove on stop</button>
        </div>
      )}
      {active_volume_alert && <div className="mv-banner" style={{ margin: '12px 0 0' }}><div className="mv-banner-title">Volume {active_volume_alert.drop_percentage != null ? active_volume_alert.drop_percentage.toFixed(0) : '?'}% below the 13-week baseline</div></div>}

      {/* header */}
      <div className="mv-head" style={{ marginTop: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div className="mv-kicker mv-num">{c.account_number} · {(c.tier || '').toUpperCase()} TIER{onboardedStr ? ` · ONBOARDED ${onboardedStr}` : ''}</div>
          <h1 className="mv-title">{c.business_name}</h1>
          <div className="mv-blurb" style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Mail size={13} />{c.primary_email}</span>
            {c.phone_number && <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Phone size={13} />{c.phone_number}</span>}
          </div>
          {blurb && <p className="mv-blurb" style={{ maxWidth: 620 }}>{blurb}</p>}
        </div>
        <div className="mv-actions" style={{ flexShrink: 0 }}>{ACTIONS[activeTab]}</div>
      </div>

      {/* contextual KPI strip */}
      {kpis && (
        <div className="mv-kpis" style={{ marginTop: 4 }}>
          {kpis.map(f => (
            <div className="mv-kpi" key={f.label}>
              <div className="mv-kpi-label">{f.label}</div>
              <div className={'mv-kpi-value' + (f.attention ? ' is-attention' : '')} style={{ fontSize: 26 }}>{f.value}</div>
              {f.sub ? <div className="mv-kpi-sub">{f.sub}</div> : null}
            </div>
          ))}
        </div>
      )}

      {comm_summary && activeTab === 'overview' && (
        <div style={{ padding: '16px 0 0' }}>
          <div className="mv-kicker" style={{ marginBottom: 6 }}>AI summary · {format(new Date(comm_summary.generated_at), 'd MMM, HH:mm')}</div>
          <p className="mv-blurb" style={{ marginTop: 0 }}>{comm_summary.summary_text}</p>
        </div>
      )}

      {/* tabs */}
      <div className="mv-tabs">
        {TABS.map(({ key, label }) => (
          <button key={key} className={'mv-tab' + (activeTab === key ? ' is-active' : '')} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {/* body */}
      <div style={{ paddingTop: 26 }}>
        {activeTab === 'overview' && <OverviewTab c={c} recent={recent} onSaved={handleCustomerSaved} onDeleteRequest={() => { setDeleteModal(true); setDeleteConfirm(''); }} />}
        {activeTab === 'onboarding' && <CustomerOnboardingTab customerId={id} customer={c} />}
        {activeTab === 'contacts' && <ContactsTab customerId={id} contacts={contacts} onRefresh={refetch} adding={contactsAdding} setAdding={setContactsAdding} />}
        {activeTab === 'volume' && <PerformanceTab customerId={c.id} />}
        {activeTab === 'financial' && <FinancialTab c={c} />}
        {activeTab === 'comms' && <CustomerCommsTab customerId={id} />}
        {activeTab === 'happiness' && <HappinessScore customer={c} />}
        {activeTab === 'pricing' && <CustomerPricingTab customer={c} onCustomerUpdate={(updated) => queryClient.setQueryData(['customer', id], d => ({ ...d, customer: { ...d.customer, ...updated } }))} />}
      </div>

      {/* delete modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(32,30,29,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--mv-bg)', width: 460, maxWidth: '100%', boxShadow: '0 22px 60px rgba(0,0,0,.32)', padding: '24px 26px 20px', borderTop: '3px solid var(--mv-magenta)' }}>
            <div className="mv-kicker" style={{ color: 'var(--mv-magenta-deep)' }}>Destructive</div>
            <h3 className="mv-title" style={{ fontSize: 22, margin: '6px 0 8px' }}>Delete {c.business_name}?</h3>
            <p className="mv-blurb" style={{ marginTop: 0 }}>This permanently deletes the account and all its contacts, rates and communications. It cannot be undone.</p>
            <div className="mv-field" style={{ marginTop: 16 }}><div className="mv-label">Type {c.account_number} to confirm</div><input className="mv-input mv-num" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={c.account_number} /></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 }}>
              <span className="mv-cell-dim" style={{ fontSize: 12 }}>{deleteConfirm === c.account_number ? 'Recorded against your name.' : 'Type the account number to enable delete.'}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="mv-btn mv-btn--sm" onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }}>Cancel</button>
                <button className="mv-btn mv-btn--danger mv-btn--sm" disabled={deleteConfirm !== c.account_number || deleteCustomer.isPending} onClick={() => deleteCustomer.mutate()}>{deleteCustomer.isPending ? 'Deleting…' : 'Delete customer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* on-stop modal */}
      {onStopModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(32,30,29,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--mv-bg)', width: 480, maxWidth: '100%', boxShadow: '0 22px 60px rgba(0,0,0,.32)', padding: '24px 26px 20px', borderTop: `3px solid ${onStopModal === 'apply' ? 'var(--mv-magenta)' : 'var(--mv-green)'}` }}>
            <div className="mv-kicker" style={{ color: onStopModal === 'apply' ? 'var(--mv-magenta-deep)' : 'var(--mv-green-deep)' }}>{onStopModal === 'apply' ? 'Needs a decision' : 'Lift the stop'}</div>
            <h3 className="mv-title" style={{ fontSize: 22, margin: '6px 0 8px' }}>{onStopModal === 'apply' ? 'Place account on stop' : 'Remove on stop'}</h3>
            <p className="mv-blurb" style={{ marginTop: 0 }}>{onStopModal === 'apply' ? 'This blocks all shipment access for this customer. The reason is logged against your name.' : 'Confirm why the stop is being lifted. This is logged in the audit trail.'}</p>
            <div className="mv-field" style={{ marginTop: 16 }}><textarea className="mv-input" style={{ minHeight: 90, resize: 'vertical' }} value={onStopInput} onChange={e => setOnStopInput(e.target.value)} placeholder={onStopModal === 'apply' ? 'Why is this account going on stop?' : 'Why is the stop being lifted?'} /></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 }}>
              <span className="mv-cell-dim" style={{ fontSize: 12 }}>{onStopInput.trim() ? 'Recorded against your name.' : 'A reason is required.'}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="mv-btn mv-btn--sm" onClick={() => { setOnStopModal(null); setOnStopInput(''); }}>Cancel</button>
                <button className={'mv-btn mv-btn--sm ' + (onStopModal === 'apply' ? 'mv-btn--danger' : 'mv-btn--primary')} disabled={!onStopInput.trim()} onClick={() => { if (onStopModal === 'apply') applyOnStop.mutate({ reason: onStopInput }); else removeOnStop.mutate({ note: onStopInput }); }}>{onStopModal === 'apply' ? 'Confirm on stop' : 'Confirm removal'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
