import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, AlertTriangle, Phone, Mail, MapPin, Building2,
  Users, MessageSquare, TrendingUp, DollarSign, Zap, Info,
  Pencil, X, Check, ShieldCheck, Trash2, Bug, ChevronDown, ChevronRight,
} from 'lucide-react';
import { customersApi } from '../../api/customers';
import { customerRateCardsApi } from '../../api/customerRateCards';
import { HealthBadge, AccountStatusBadge, TierBadge, CreditUtilisationBar } from '../../components/ui/StatusBadge';
import CustomerPricingTab from './tabs/CustomerPricingTab';
import { format } from 'date-fns';

const TABS = [
  { key: 'overview',  label: 'Overview',        icon: Building2 },
  { key: 'contacts',  label: 'Contacts',         icon: Users },
  { key: 'comms',     label: 'Communications',   icon: MessageSquare },
  { key: 'volume',    label: 'Performance',      icon: TrendingUp },
  { key: 'financial', label: 'Financial',        icon: DollarSign },
  { key: 'pricing',   label: 'Pricing',          icon: Zap },
];

const COMPANY_TYPE_LABELS = {
  limited_company: 'Limited Company (Ltd)',
  partnership:     'Partnership / LLP',
  sole_trader:     'Sole Trader',
};

const BILLING_PERIOD_LABELS = {
  weekly:      'Weekly',
  fortnightly: 'Fortnightly',
  monthly:     'Monthly',
};

const gbp = (n) => `£${parseFloat(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Shared field components ─────────────────────────────────
const inp = (extra = {}) => ({
  background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 9999, padding: '5px 14px', color: '#fff', fontSize: 12,
  outline: 'none', width: '100%', boxSizing: 'border-box', ...extra,
});
const sel = () => inp({ cursor: 'pointer' });

function Row({ label, value, edit, editNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 26 }}>
      <span style={{ fontSize: 12, color: '#AAAAAA', flexShrink: 0, whiteSpace: 'nowrap', minWidth: 110 }}>{label}</span>
      {edit
        ? <div style={{ width: 180, flexShrink: 0 }}>{editNode}</div>
        : <span style={{ fontSize: 12, color: '#fff', textAlign: 'right', wordBreak: 'break-word' }}>{value || '—'}</span>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 11, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{children}</h3>;
}

function InfoCard({ title, children }) {
  return (
    <div className="moov-card" style={{ padding: '16px 18px' }}>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

// ─── Rate Card Assignments per carrier ───────────────────────
function CustomerRateCardAssignments({ customerId }) {
  const qc = useQueryClient();

  const { data: carrierLinks = [], isLoading, isError } = useQuery({
    queryKey: ['customer-carrier-links', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customer-carrier-links/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch carrier links');
      return response.json();
    },
    enabled: !!customerId,
  });

  const setAssignment = useMutation({
    mutationFn: ({ courierId, cardId }) =>
      fetch(`/api/customer-carrier-links/${customerId}/${courierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier_rate_card_id: cardId }),
      }).then(r => r.ok ? r.json() : Promise.reject('Failed to update assignment')),
    onSuccess: () => qc.invalidateQueries(['customer-carrier-links', customerId]),
  });

  if (isLoading) return null;
  if (isError) return (
    <InfoCard title="Rate Cards">
      <span style={{ fontSize: 12, color: '#E91E8C', fontStyle: 'italic' }}>Error loading carrier links.</span>
    </InfoCard>
  );

  const activeCarriers = carrierLinks.filter(link => link.active === true);

  if (!activeCarriers.length) return (
    <InfoCard title="Rate Cards">
      <span style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>No active carrier links — link carriers to assign rate cards.</span>
    </InfoCard>
  );

  return (
    <InfoCard title="Rate Cards">
      {activeCarriers.map(link => {
        const currentCardId = link.active_card_id ?? link.master_card_id;
        return (
          <Row
            key={link.courier_id}
            label={link.courier_name}
            value={link.active_card_name || link.master_card_name || '—'}
            edit={true}
            editNode={
              <select
                value={String(currentCardId || '')}
                onChange={e => setAssignment.mutate({ courierId: link.courier_id, cardId: parseInt(e.target.value) })}
                style={inp({ width: 180, flexShrink: 0, fontSize: 11 })}
              >
                {(link.available_cards || []).map(card => (
                  <option key={card.id} value={card.id}>
                    {card.name}{card.is_master ? ' (Master)' : ''}
                  </option>
                ))}
              </select>
            }
          />
        );
      })}
      <p style={{ fontSize:11, color:'#555', marginTop:6, fontStyle:'italic' }}>
        Master is the default rate card. Select an alternative to use custom pricing for this customer.
      </p>
    </InfoCard>
  );
}

// ─── Overview Tab ────────────────────────────────────────────
function OverviewTab({ c, onSaved, onDeleteRequest }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});

  function startEdit() {
    setForm({
      business_name:      c.business_name || '',
      company_type:       c.company_type || 'limited_company',
      company_reg_number: c.company_reg_number || '',
      vat_number:         c.vat_number || '',
      address_line_1:     c.address_line_1 || '',
      address_line_2:     c.address_line_2 || '',
      city:               c.city || '',
      county:             c.county || '',
      postcode:           c.postcode || '',
      country:            c.country || 'United Kingdom',
      phone_number:       c.phone_number || '',
      primary_email:      c.primary_email || '',
      accounts_email:     c.accounts_email || '',
      eori_number:        c.eori_number || '',
      ioss_number:        c.ioss_number || '',
      billing_cycle:      c.billing_cycle || 'monthly',
      payment_terms_days: c.payment_terms_days ?? 7,
      credit_limit:       c.credit_limit ?? 0,
      bond_amount_held:   c.bond_amount_held ?? 0,
      tier:               c.tier || 'bronze',
      manual_billing:     c.manual_billing ?? false,
      dc_customer_id:     c.dc_customer_id || '',
    });
    setEdit(true);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const save = useMutation({
    mutationFn: () => customersApi.update(c.id, {
      ...form,
      payment_terms_days: parseInt(form.payment_terms_days),
      credit_limit:       parseFloat(form.credit_limit) || 0,
      bond_amount_held:   parseFloat(form.bond_amount_held) || 0,
      company_reg_number: form.company_reg_number || null,
      vat_number:         form.vat_number || null,
      address_line_1:     form.address_line_1 || null,
      address_line_2:     form.address_line_2 || null,
      city:               form.city || null,
      county:             form.county || null,
      accounts_email:     form.accounts_email || null,
      eori_number:        form.eori_number || null,
      ioss_number:        form.ioss_number || null,
      dc_customer_id:     form.dc_customer_id || null,
    }),
    onSuccess: (updated) => { onSaved(updated); setEdit(false); },
  });

  return (
    <div>
      {/* Edit / Save bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 8 }}>
        {edit ? (
          <>
            <button className="btn-ghost" onClick={() => setEdit(false)} style={{ fontSize: 12 }}><X size={12} /> Cancel</button>
            <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending} style={{ fontSize: 12 }}>
              <Check size={12} /> {save.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        ) : (
          <button className="btn-ghost" onClick={startEdit} style={{ fontSize: 12 }}><Pencil size={12} /> Edit Details</button>
        )}
      </div>

      {save.isError && (
        <div style={{ marginBottom: 10, padding: 8, background: 'rgba(233,30,140,0.1)', border: '1px solid #E91E8C', borderRadius: 6, fontSize: 12, color: '#E91E8C' }}>
          Failed to save. Please try again.
        </div>
      )}

      {/* Two-column grid — same as before */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <InfoCard title="Business Details">
            <Row label="Business Name" value={c.business_name} edit={edit}
              editNode={<input style={inp()} value={form.business_name} onChange={e => set('business_name', e.target.value)} />} />
            <Row label="Company Type" value={COMPANY_TYPE_LABELS[c.company_type]} edit={edit}
              editNode={
                <select style={sel()} value={form.company_type} onChange={e => set('company_type', e.target.value)}>
                  <option value="limited_company">Limited Company (Ltd)</option>
                  <option value="partnership">Partnership / LLP</option>
                  <option value="sole_trader">Sole Trader</option>
                </select>
              } />
            <Row label="Company Reg. No." value={c.company_reg_number} edit={edit}
              editNode={<input style={inp()} value={form.company_reg_number} onChange={e => set('company_reg_number', e.target.value)} placeholder="12345678" />} />
            <Row label="VAT Number" value={c.vat_number} edit={edit}
              editNode={<input style={inp()} value={form.vat_number} onChange={e => set('vat_number', e.target.value)} placeholder="GB123456789" />} />
            <Row label="Phone" value={c.phone_number} edit={edit}
              editNode={<input style={inp()} value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />} />
            <Row label="Main Email" value={c.primary_email} edit={edit}
              editNode={<input style={inp()} value={form.primary_email} onChange={e => set('primary_email', e.target.value)} />} />
            <Row label="Accounts Email" value={c.accounts_email} edit={edit}
              editNode={<input style={inp()} value={form.accounts_email} onChange={e => set('accounts_email', e.target.value)} placeholder="(same as main)" />} />
          </InfoCard>

          <InfoCard title="Address">
            <Row label="Address Line 1" value={c.address_line_1} edit={edit}
              editNode={<input style={inp()} value={form.address_line_1} onChange={e => set('address_line_1', e.target.value)} />} />
            <Row label="Address Line 2" value={c.address_line_2} edit={edit}
              editNode={<input style={inp()} value={form.address_line_2} onChange={e => set('address_line_2', e.target.value)} />} />
            <Row label="City / Town" value={c.city} edit={edit}
              editNode={<input style={inp()} value={form.city} onChange={e => set('city', e.target.value)} />} />
            <Row label="County" value={c.county} edit={edit}
              editNode={<input style={inp()} value={form.county} onChange={e => set('county', e.target.value)} />} />
            <Row label="Postcode" value={c.postcode} edit={edit}
              editNode={<input style={inp()} value={form.postcode} onChange={e => set('postcode', e.target.value.toUpperCase())} />} />
            <Row label="Country" value={c.country} edit={edit}
              editNode={<input style={inp()} value={form.country} onChange={e => set('country', e.target.value)} />} />
          </InfoCard>

          {(c.eori_number || c.ioss_number || edit) && (
            <InfoCard title="International Trade">
              <Row label="EORI Number" value={c.eori_number} edit={edit}
                editNode={<input style={inp()} value={form.eori_number} onChange={e => set('eori_number', e.target.value)} placeholder="GB123456789000" />} />
              <Row label="IOSS Number" value={c.ioss_number} edit={edit}
                editNode={<input style={inp()} value={form.ioss_number} onChange={e => set('ioss_number', e.target.value)} placeholder="IM1234567890" />} />
            </InfoCard>
          )}

          {(c.dc_customer_id || edit) && (
            <InfoCard title="API Integration">
              <Row
                label="DC Customer ID"
                value={c.dc_customer_id}
                edit={edit}
                editNode={
                  <input
                    style={inp()}
                    value={form.dc_customer_id}
                    onChange={e => set('dc_customer_id', e.target.value)}
                    placeholder="e.g. Europa"
                  />
                }
              />
              {edit && (
                <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 4, paddingLeft: 2 }}>
                  Set this to the identifier the customer sends as their account ID in API webhooks.
                  Billing will fall back to this if no standard account number is matched.
                </div>
              )}
            </InfoCard>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <InfoCard title="Account Settings">
            <Row label="Tier" value={c.tier ? c.tier.charAt(0).toUpperCase() + c.tier.slice(1) : '—'} edit={edit}
              editNode={
                <select style={sel()} value={form.tier} onChange={e => set('tier', e.target.value)}>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              } />
            <Row label="Credit Limit" value={gbp(c.credit_limit)} edit={edit}
              editNode={<input style={inp()} type="number" min="0" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} />} />
            <Row label="Bond Held" value={parseFloat(c.bond_amount_held) > 0 ? gbp(c.bond_amount_held) : 'None'} edit={edit}
              editNode={<input style={inp()} type="number" min="0" step="0.01" value={form.bond_amount_held} onChange={e => set('bond_amount_held', e.target.value)} placeholder="0.00" />} />
            <Row label="Billing Period" value={BILLING_PERIOD_LABELS[c.billing_cycle] || c.billing_cycle} edit={edit}
              editNode={
                <select style={sel()} value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)}>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              } />
            <Row label="Payment Terms" value={`${c.payment_terms_days} days`} edit={edit}
              editNode={
                <select style={sel()} value={form.payment_terms_days} onChange={e => set('payment_terms_days', e.target.value)}>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={28}>28 days</option>
                  <option value={30}>30 days</option>
                </select>
              } />
            <Row label="Manual Billing" value={c.manual_billing ? (
                <span style={{ color: '#FFC107', fontWeight: 600, fontSize: 12 }}>● Manual — no webhook expected</span>
              ) : (
                <span style={{ color: '#00C853', fontWeight: 600, fontSize: 12 }}>● Platform — webhooks active</span>
              )} edit={edit}
              editNode={
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.manual_billing}
                    onChange={e => set('manual_billing', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#FFC107' }} />
                  <span style={{ fontSize: 13, color: form.manual_billing ? '#FFC107' : '#888' }}>
                    {form.manual_billing ? 'Manual — suppress aged alerts' : 'Platform — expect webhooks'}
                  </span>
                </label>
              } />
            <Row label="Account Status"    value={<AccountStatusBadge status={c.account_status} />} />
            <Row label="Health Score"      value={<HealthBadge score={c.health_score} />} />
          </InfoCard>

          <InfoCard title="Team">
            <Row label="Account Manager"   value={c.account_manager_name || 'Unmanaged'} />
            <Row label="Salesperson"       value={c.salesperson_name || '—'} />
            <Row label="Onboarding Person" value={c.onboarding_person_name || '—'} />
            <Row label="Customer Since"    value={c.date_onboarded ? format(new Date(c.date_onboarded), 'dd MMM yyyy') : '—'} />
          </InfoCard>

          <CustomerRateCardAssignments customerId={c.id} />

          {c.health_score_summary && (
            <InfoCard title="Health Score Detail">
              <p style={{ fontSize: 12, color: '#DDDDDD', lineHeight: 1.6 }}>{c.health_score_summary}</p>
              {c.health_score_updated && (
                <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 4 }}>
                  Last calculated: {format(new Date(c.health_score_updated), 'dd MMM yyyy, HH:mm')}
                </p>
              )}
            </InfoCard>
          )}

        </div>
      </div>

      {/* Danger zone */}
      {!edit && (
        <div style={{ marginTop: 24, padding: '16px 18px', border: '1px solid rgba(233,30,140,0.25)', borderRadius: 10, background: 'rgba(233,30,140,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E91E8C' }}>Delete Customer</div>
              <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 2 }}>
                Permanently removes this customer and all associated data. This cannot be undone.
              </div>
            </div>
            <button
              onClick={onDeleteRequest}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, background: 'rgba(233,30,140,0.12)', border: '1px solid #E91E8C', color: '#E91E8C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              <Trash2 size={13} /> Delete Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contacts tab ────────────────────────────────────────────
const BLANK_CONTACT = { full_name: '', job_title: '', phone_number: '', email_address: '', is_main_contact: false, is_finance_contact: false };

function ContactsTab({ customerId, contacts = [], onRefresh }) {
  const [editingId, setEditingId]   = useState(null);
  const [editForm,  setEditForm]    = useState({});
  const [adding,    setAdding]      = useState(false);
  const [addForm,   setAddForm]     = useState(BLANK_CONTACT);
  const [delConfirm, setDelConfirm] = useState(null); // contact id pending delete

  const qc = useQueryClient();
  const invalidate = () => { qc.invalidateQueries(['customer', customerId]); onRefresh?.(); };

  const patchContact = useMutation({
    mutationFn: ({ id, data }) => fetch(`/api/customers/${customerId}/contacts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { setEditingId(null); invalidate(); },
  });

  const deleteContact = useMutation({
    mutationFn: (id) => fetch(`/api/customers/${customerId}/contacts/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { setDelConfirm(null); invalidate(); },
  });

  const addContact = useMutation({
    mutationFn: (data) => fetch(`/api/customers/${customerId}/contacts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => { setAdding(false); setAddForm(BLANK_CONTACT); invalidate(); },
  });

  const startEdit = (ct) => { setEditingId(ct.id); setEditForm({ full_name: ct.full_name, job_title: ct.job_title || '', phone_number: ct.phone_number || '', email_address: ct.email_address, is_main_contact: ct.is_main_contact, is_finance_contact: ct.is_finance_contact }); };

  const inputStyle = { background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 13, padding: '5px 10px', width: '100%' };
  const flagBtn = (active, label) => ({
    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
    background: active ? 'rgba(0,200,83,0.2)' : 'rgba(255,255,255,0.06)',
    border: active ? '1px solid rgba(0,200,83,0.4)' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#00C853' : '#888',
  });

  return (
    <div className="moov-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#7B2FBE' }}>Contacts</h3>
        {!adding && <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setAdding(true)}>+ Add Contact</button>}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(123,47,190,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            {[['full_name','Full Name *'],['job_title','Job Title'],['phone_number','Phone'],['email_address','Email *']].map(([k,lbl]) => (
              <div key={k}><label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input style={inputStyle} value={addForm[k]} onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))} placeholder={lbl.replace(' *','')} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={flagBtn(addForm.is_main_contact, 'Main')} onClick={() => setAddForm(f => ({ ...f, is_main_contact: !f.is_main_contact }))}>Main Contact</button>
            <button style={flagBtn(addForm.is_finance_contact, 'Finance')} onClick={() => setAddForm(f => ({ ...f, is_finance_contact: !f.is_finance_contact }))}>Finance Contact</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => addContact.mutate(addForm)} disabled={addContact.isPending || !addForm.full_name || !addForm.email_address} className="btn-primary" style={{ fontSize: 12, height: 30, padding: '0 14px' }}><Check size={12} style={{ marginRight: 4 }} />Save</button>
            <button onClick={() => { setAdding(false); setAddForm(BLANK_CONTACT); }} className="btn-ghost" style={{ fontSize: 12, height: 30, padding: '0 12px' }}>Cancel</button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !adding ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>No contacts added yet</div>
      ) : (
        <table className="moov-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Flags</th><th style={{ width: 80 }}></th></tr>
          </thead>
          <tbody>
            {contacts.map(ct => {
              const isEditing = editingId === ct.id;
              const isPendingDelete = delConfirm === ct.id;
              return (
                <tr key={ct.id}>
                  {isEditing ? (
                    <>
                      <td><input style={inputStyle} value={editForm.full_name}    onChange={e => setEditForm(f=>({...f, full_name: e.target.value}))} /></td>
                      <td><input style={inputStyle} value={editForm.job_title}    onChange={e => setEditForm(f=>({...f, job_title: e.target.value}))} placeholder="Job title" /></td>
                      <td><input style={inputStyle} value={editForm.phone_number} onChange={e => setEditForm(f=>({...f, phone_number: e.target.value}))} placeholder="Phone" /></td>
                      <td><input style={inputStyle} value={editForm.email_address} onChange={e => setEditForm(f=>({...f, email_address: e.target.value}))} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button style={flagBtn(editForm.is_main_contact)} onClick={() => setEditForm(f=>({...f, is_main_contact: !f.is_main_contact}))}>Main</button>
                          <button style={flagBtn(editForm.is_finance_contact)} onClick={() => setEditForm(f=>({...f, is_finance_contact: !f.is_finance_contact}))}>Finance</button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => patchContact.mutate({ id: ct.id, data: editForm })} disabled={patchContact.isPending} title="Save" style={{ background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', color: '#00C853' }}><Check size={13} /></button>
                          <button onClick={() => setEditingId(null)} title="Cancel" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', color: '#AAAAAA' }}><X size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : isPendingDelete ? (
                    <>
                      <td colSpan={5} style={{ color: '#E91E8C', fontSize: 13 }}>Delete <strong>{ct.full_name}</strong>? This cannot be undone.</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => deleteContact.mutate(ct.id)} disabled={deleteContact.isPending} style={{ background: 'rgba(233,30,140,0.2)', border: '1px solid rgba(233,30,140,0.4)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', color: '#E91E8C', fontSize: 12, fontWeight: 700 }}>Delete</button>
                          <button onClick={() => setDelConfirm(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', color: '#AAAAAA' }}><X size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 600 }}>{ct.full_name}</td>
                      <td style={{ color: '#AAAAAA' }}>{ct.job_title || '—'}</td>
                      <td style={{ color: '#AAAAAA' }}>{ct.phone_number || '—'}</td>
                      <td style={{ color: '#00BCD4' }}>{ct.email_address}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {ct.is_main_contact    && <span style={{ background: 'rgba(0,200,83,0.15)',  color: '#00C853', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Main</span>}
                          {ct.is_finance_contact && <span style={{ background: 'rgba(123,47,190,0.2)', color: '#7B2FBE', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Finance</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => startEdit(ct)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: '4px 5px' }}><Pencil size={13} /></button>
                          <button onClick={() => setDelConfirm(ct.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E91E8C', padding: '4px 5px' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Performance tab ───────────────────────────────────────────────
function PerformanceTab({ customerId }) {
  const [showPerfDebug, setShowPerfDebug] = useState(false);

  const { data: perfData, isLoading, isError } = useQuery({
    queryKey: ['customer-perf', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/billing/charges/customer-perf?customerId=${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
      return response.json();
    },
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', color: '#AAAAAA', padding: 32 }}>
        Loading performance data…
      </div>
    );
  }

  if (isError || !perfData) {
    return (
      <div className="moov-card" style={{ padding: 24, color: '#E91E8C' }}>
        Could not load performance data.
      </div>
    );
  }

  const profit30 = parseFloat(perfData.last30?.profit || 0);
  const revenue30 = parseFloat(perfData.last30?.revenue || 0);
  const profitMargin = revenue30 > 0 ? ((profit30 / revenue30) * 100).toFixed(1) : '—';

  return (
    <div>
      {/* Debug toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={() => setShowPerfDebug(d => !d)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px',
            borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: showPerfDebug ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showPerfDebug ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.1)'}`,
            color: showPerfDebug ? '#F59E0B' : '#555' }}>
          <Bug size={11} /> {showPerfDebug ? 'Hide debug' : 'Debug numbers'}
        </button>
      </div>

      {/* Debug panel */}
      {showPerfDebug && (
        <div style={{ marginBottom: 20, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, overflow: 'hidden', fontSize: 11 }}>
          <div style={{ padding: '8px 14px', background: 'rgba(245,158,11,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bug size={12} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Performance debug — source &amp; assumptions
            </span>
          </div>

          {/* Assumptions */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: '#888', marginBottom: 4, fontSize: 10, textTransform: 'uppercase' }}>Data source</div>
            <div style={{ color: '#AAA' }}>Table: <code style={{ color: '#00C853' }}>charges</code> WHERE <code style={{ color: '#F59E0B' }}>charge_type = 'courier'</code> AND <code style={{ color: '#F59E0B' }}>cancelled = false</code></div>
            <div style={{ color: '#AAA', marginTop: 4 }}>
              <span style={{ color: '#A5B4FC' }}>Revenue</span> = SUM(price) &nbsp;·&nbsp;
              <span style={{ color: '#B39DDB' }}>Cost</span> = SUM(cost_price) &nbsp;·&nbsp;
              <span style={{ color: '#34D399' }}>Profit</span> = revenue − cost &nbsp;·&nbsp;
              <span style={{ color: '#00BCD4' }}>Parcels</span> = SUM(parcel_qty)
            </div>
          </div>

          {/* Period summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { label: 'Last 7 days', d: perfData.last7 },
              { label: 'Last 30 days', d: perfData.last30 },
              { label: 'All time', d: perfData.all },
            ].map(({ label, d }) => (
              <div key={label} style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: 700, color: '#888', fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                {[
                  { k: 'charges',  v: d?.charges,  c: '#AAA' },
                  { k: 'parcels',  v: d?.parcels,  c: '#00BCD4' },
                  { k: 'revenue',  v: d?.revenue != null ? `£${parseFloat(d.revenue).toFixed(2)}` : '—',  c: '#A5B4FC' },
                  { k: 'cost',     v: d?.cost     != null ? `£${parseFloat(d.cost).toFixed(2)}`    : '—',  c: '#B39DDB' },
                  { k: 'profit',   v: d?.profit   != null ? `£${parseFloat(d.profit).toFixed(2)}`  : '—',
                    c: parseFloat(d?.profit || 0) >= 0 ? '#34D399' : '#EF4444' },
                  ...(d?.missing_cost_count > 0 ? [{ k: '⚠ missing cost', v: `${d.missing_cost_count} charges`, c: '#EF4444' }] : []),
                ].map(({ k, v, c }) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: '#555' }}>{k}</span>
                    <span style={{ color: c, fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Full by-service breakdown including null cost rows */}
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontWeight: 700, color: '#888', fontSize: 10, textTransform: 'uppercase', marginBottom: 8 }}>
              All-time by service — {perfData.by_courier?.length ?? 0} services
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Service name', 'Charges', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => (
                    <th key={h} style={{ padding: '3px 6px', textAlign: h === 'Service name' ? 'left' : 'right',
                      color: '#555', fontWeight: 600, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(perfData.by_courier || []).map((row, i) => {
                  const rev = parseFloat(row.revenue || 0);
                  const cst = parseFloat(row.cost    || 0);
                  const pft = parseFloat(row.profit  || 0);
                  const mgn = rev > 0 ? (pft / rev * 100).toFixed(1) : '—';
                  const noCost = cst === 0 && rev > 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '3px 6px', color: '#CCC' }}>{row.service_name || '—'}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', color: '#888', fontFamily: 'monospace' }}>{row.charges}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', color: '#A5B4FC', fontFamily: 'monospace' }}>£{parseFloat(row.revenue).toFixed(2)}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', fontFamily: 'monospace',
                        color: noCost ? '#EF4444' : '#B39DDB' }}>
                        £{parseFloat(row.cost).toFixed(2)}
                        {noCost && <span style={{ marginLeft: 4, fontSize: 9, color: '#EF4444' }}>⚠ null</span>}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', fontFamily: 'monospace',
                        color: pft >= 0 ? '#34D399' : '#EF4444' }}>£{pft.toFixed(2)}</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', fontFamily: 'monospace',
                        color: mgn === '—' ? '#555' : parseFloat(mgn) < 0 ? '#EF4444' : parseFloat(mgn) < 15 ? '#F59E0B' : '#34D399' }}>
                        {mgn === '—' ? '—' : `${mgn}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 8, fontSize: 10, color: '#555' }}>
              ⚠ Red cost = £0.00 cost_price on those charges — profit will be inflated. Check carrier rate card linkage.
            </div>
          </div>
        </div>
      )}

      {/* Top stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Last 7 Days Revenue', value: gbp(perfData.last7?.revenue || 0), unit: '', color: '#00C853' },
          { label: 'Last 30 Days Revenue', value: gbp(perfData.last30?.revenue || 0), unit: '', color: '#00C853' },
          { label: 'Last 30 Days Profit', value: gbp(profit30), unit: '', color: profit30 >= 0 ? '#00C853' : '#E91E8C' },
          { label: 'Total Charges', value: (perfData.all?.charges || 0).toLocaleString(), unit: '', color: '#00BCD4' },
        ].map(({ label, value, color }) => (
          <div key={label} className="moov-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Last 7 Days Charges', value: (perfData.last7?.charges || 0).toLocaleString() },
          { label: 'Last 30 Days Parcels', value: (perfData.last30?.parcels || 0).toLocaleString() },
          { label: 'Profit Margin (30d)', value: profitMargin + '%' },
        ].map(({ label, value }) => (
          <div key={label} className="moov-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#DDDDDD' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="moov-card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Daily Revenue — Last 30 Days</h3>
        <MiniBarChart dailyData={perfData.daily || []} />
      </div>

      {/* Courier breakdown table */}
      {(perfData.by_courier || []).length > 0 && (
        <div className="moov-card" style={{ padding: 20, overflow: 'hidden' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Breakdown by Courier</h3>
          <table className="moov-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Service</th>
                <th style={{ textAlign: 'right' }}>Charges</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {perfData.by_courier.map(row => (
                <tr key={row.service_name}>
                  <td style={{ color: '#DDDDDD', fontWeight: 500 }}>{row.service_name}</td>
                  <td style={{ textAlign: 'right', color: '#AAAAAA' }}>{row.charges}</td>
                  <td style={{ textAlign: 'right', color: '#00C853', fontWeight: 600 }}>{gbp(row.revenue)}</td>
                  <td style={{ textAlign: 'right', color: '#AAAAAA' }}>{gbp(row.cost)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: parseFloat(row.profit) >= 0 ? '#00C853' : '#E91E8C' }}>{gbp(row.profit)}</td>
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
  if (!dailyData || !dailyData.length) {
    return <p style={{ color: '#AAAAAA', fontSize: 13 }}>No data yet</p>;
  }
  const max = Math.max(...dailyData.map(d => parseFloat(d.revenue || 0)), 1);
  const sortedData = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 12 }}>
      {sortedData.map((d, i) => (
        <div key={i}
          title={`${format(new Date(d.date), 'dd MMM')}: ${gbp(d.revenue)}`}
          style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${Math.max((parseFloat(d.revenue) / max) * 100, 4)}%`, background: `rgba(0,200,83,${0.3 + (parseFloat(d.revenue) / max) * 0.7})`, cursor: 'default' }}
        />
      ))}
    </div>
  );
}

function daysAgo(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

// ─── Financial tab ────────────────────────────────────────────
function FinancialTab({ c, creditPct }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="moov-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Credit Position</h3>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#AAAAAA' }}>Credit Utilisation</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: creditPct >= 90 ? '#E91E8C' : creditPct >= 80 ? '#FFC107' : '#00C853' }}>{creditPct.toFixed(1)}%</span>
          </div>
          <CreditUtilisationBar pct={creditPct} />
          {creditPct >= 80 && (
            <div style={{ marginTop: 8, fontSize: 12, color: creditPct >= 90 ? '#E91E8C' : '#FFC107', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Info size={12} />
              {creditPct >= 100 ? 'Credit limit reached — On Stop recommended' : creditPct >= 90 ? 'Escalated alert — urgent review recommended' : 'Approaching credit limit'}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ERow label="Outstanding Balance" value={<span style={{ color: parseFloat(c.outstanding_balance) > 0 ? '#E91E8C' : '#00C853', fontWeight: 700 }}>{gbp(c.outstanding_balance)}</span>} />
          <ERow label="Credit Limit"        value={gbp(c.credit_limit)} />
          <ERow label="Payment Terms"       value={`${c.payment_terms_days} days`} />
        </div>
      </div>
      <div className="moov-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Account Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ERow label="Account Status" value={<AccountStatusBadge status={c.account_status} />} />
          {c.is_on_stop && (
            <>
              <ERow label="On Stop Since" value={c.on_stop_applied_at ? format(new Date(c.on_stop_applied_at), 'dd MMM yyyy, HH:mm') : '—'} />
              <ERow label="Reason"        value={c.on_stop_reason || '—'} />
            </>
          )}
        </div>
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12, color: '#AAAAAA', lineHeight: 1.6 }}>
          Invoices, credits, and payment history are pulled from Xero via API.{' '}
          <span style={{ color: '#00BCD4', cursor: 'pointer' }}>View in Finance module →</span>
        </div>
      </div>
    </div>
  );
}

// ─── Direction colours / labels ──────────────────────────────────────────────
const DIR_CFG = {
  inbound_customer:  { label: 'From Customer',  color: '#2979FF', bg: 'rgba(41,121,255,0.10)' },
  outbound_customer: { label: 'To Customer',    color: '#00C853', bg: 'rgba(0,200,83,0.10)'   },
  inbound_courier:   { label: 'From Courier',   color: '#FFC107', bg: 'rgba(255,193,7,0.10)'  },
  outbound_courier:  { label: 'To Courier',     color: '#FF9800', bg: 'rgba(255,152,0,0.10)'  },
  internal_note:     { label: 'Internal Note',  color: '#9E9E9E', bg: 'rgba(158,158,158,0.10)'},
  inbound:           { label: 'Inbound',        color: '#2979FF', bg: 'rgba(41,121,255,0.10)' },
  outbound:          { label: 'Outbound',       color: '#00C853', bg: 'rgba(0,200,83,0.10)'   },
};

function CustomerCommsTab({ customerId }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers/${customerId}/correspondence`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => { setItems(data); setError(null); })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return (
    <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#777' }}>
      <MessageSquare size={24} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
      Loading correspondence…
    </div>
  );

  if (error) return (
    <div className="moov-card" style={{ padding: 24, color: '#E53935' }}>
      Could not load correspondence: {error}
    </div>
  );

  if (!items.length) return (
    <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#777' }}>
      <MessageSquare size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
      No correspondence yet.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(item => {
        const dir    = DIR_CFG[item.direction] || { label: item.direction || '—', color: '#9E9E9E', bg: 'rgba(158,158,158,0.08)' };
        const isOpen = expanded === item.id;
        const preview = (item.body_text || '').substring(0, 160);
        const date    = item.created_at
          ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—';

        return (
          <div key={item.id}
            className="moov-card"
            style={{ padding: 0, overflow: 'hidden', cursor: 'pointer',
              border: `1px solid rgba(255,255,255,0.06)`,
              borderLeft: `3px solid ${dir.color}` }}
            onClick={() => setExpanded(isOpen ? null : item.id)}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent' }}>

              {/* Direction badge */}
              <span style={{ fontSize: 10, fontWeight: 700, color: dir.color,
                background: dir.bg, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {dir.label}
              </span>

              {/* Source / query context */}
              {item.source === 'query_email' && item.consignment_number && (
                <span style={{ fontSize: 10, color: '#888', background: 'rgba(255,255,255,0.05)',
                  padding: '2px 7px', borderRadius: 3, fontFamily: 'monospace', flexShrink: 0 }}>
                  {item.consignment_number}
                </span>
              )}
              {item.source === 'query_email' && item.query_type && (
                <span style={{ fontSize: 10, color: '#777', flexShrink: 0, textTransform: 'capitalize' }}>
                  {item.query_type.replace(/_/g,' ')}
                </span>
              )}

              {/* Subject */}
              <span style={{ flex: 1, fontSize: 13, color: '#DDD', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.subject || '(no subject)'}
              </span>

              {/* Date */}
              <span style={{ fontSize: 11, color: '#666', flexShrink: 0 }}>{date}</span>
            </div>

            {/* Expanded body */}
            {isOpen && (
              <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {item.from_address && (
                  <div style={{ fontSize: 11, color: '#666', padding: '8px 0 6px' }}>
                    From: <span style={{ color: '#999' }}>{item.from_address}</span>
                    {item.to_address && <> · To: <span style={{ color: '#999' }}>{item.to_address}</span></>}
                  </div>
                )}
                <pre style={{ margin: 0, fontSize: 12, color: '#CCC', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
                  {item.body_text || '(no body)'}
                </pre>
                {item.source === 'query_email' && item.query_id && (
                  <div style={{ marginTop: 10 }}>
                    <a href={`/queries?id=${item.query_id}`}
                      style={{ fontSize: 11, color: '#2979FF', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      Open in Queries inbox →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Collapsed preview */}
            {!isOpen && item.body_text && (
              <div style={{ padding: '0 14px 10px', fontSize: 11, color: '#555',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preview}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function CustomerRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab]     = useState('overview');
  const [onStopModal, setOnStopModal] = useState(null);
  const [onStopInput, setOnStopInput] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDebug, setShowDebug]     = useState(false);
  const [debugSection, setDebugSection] = useState(new Set(['customer']));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn:  () => customersApi.get(id),
  });

  const applyOnStop = useMutation({
    mutationFn: ({ reason }) => customersApi.applyOnStop(id, { reason, staff_id: 'CURRENT_USER_ID' }),
    onSuccess: () => { queryClient.invalidateQueries(['customer', id]); setOnStopModal(null); setOnStopInput(''); },
  });
  const removeOnStop = useMutation({
    mutationFn: ({ note }) => customersApi.removeOnStop(id, { note, staff_id: 'CURRENT_USER_ID' }),
    onSuccess: () => { queryClient.invalidateQueries(['customer', id]); setOnStopModal(null); setOnStopInput(''); },
  });

  function handleCustomerSaved(updated) {
    queryClient.setQueryData(['customer', id], d => ({ ...d, customer: { ...d.customer, ...updated } }));
  }

  const deleteCustomer = useMutation({
    mutationFn: () => customersApi.delete(id),
    onSuccess: () => navigate('/customers'),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#AAAAAA' }}>
      Loading customer record…
    </div>
  );
  if (!data) return <div style={{ color: '#E91E8C', padding: 32 }}>Customer not found.</div>;

  const { customer: c, contacts, comm_summary, volume_snapshots, active_volume_alert } = data;
  const creditPct = parseFloat(c.credit_utilisation_pct) || 0;

  // Build full address string for header
  const addressParts = [c.address_line_1, c.city, c.postcode].filter(Boolean);
  const addressDisplay = addressParts.length ? addressParts.join(', ') : c.postcode;

  return (
    <div>
      <button onClick={() => navigate('/customers')}
        style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}>
        <ArrowLeft size={14} /> All Customers
      </button>

      {c.is_on_stop && (
        <div style={{ background: 'rgba(233,30,140,0.12)', border: '1.5px solid #E91E8C', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} style={{ color: '#E91E8C', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: '#E91E8C', fontWeight: 700, fontSize: 15 }}>Account On Stop</span>
            <span style={{ color: '#AAAAAA', fontSize: 13, marginLeft: 12 }}>Shipment access blocked · Reason: {c.on_stop_reason}</span>
          </div>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setOnStopModal('remove')}>Remove On Stop</button>
        </div>
      )}

      {parseFloat(c.bond_amount_held) > 0 && (
        <div style={{ background: 'rgba(255,193,7,0.08)', border: '1.5px solid #FFC107', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={20} style={{ color: '#FFC107', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: '#FFC107', fontWeight: 700, fontSize: 15 }}>Bond Held</span>
            <span style={{ color: '#AAAAAA', fontSize: 13, marginLeft: 12 }}>
              Amount: {gbp(c.bond_amount_held)}
            </span>
          </div>
        </div>
      )}

      {active_volume_alert && (
        <div style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid #FFC107', borderRadius: 12, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={16} style={{ color: '#FFC107' }} />
          <span style={{ color: '#FFC107', fontSize: 13 }}>
            Volume alert: {active_volume_alert.drop_percentage?.toFixed(0)}% below 13-week baseline
          </span>
        </div>
      )}

      {/* Header card */}
      <div className="moov-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #7B2FBE, #00C853)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
            {c.business_name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>{c.business_name}</h2>
              <span style={{ color: '#00BCD4', fontSize: 13, fontWeight: 600 }}>{c.account_number}</span>
              <TierBadge tier={c.tier} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ color: '#AAAAAA', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={12} /> {c.primary_email}
              </span>
              <span style={{ color: '#AAAAAA', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={12} /> {c.phone_number}
              </span>
              <span style={{ color: '#AAAAAA', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {addressDisplay}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <HealthBadge score={c.health_score} />
            <AccountStatusBadge status={c.account_status} />
            {!c.is_on_stop ? (
              <button onClick={() => setOnStopModal('apply')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 22, padding: '0 9px', borderRadius: 11,
                background: 'rgba(233,30,140,0.15)', border: '1px solid #E91E8C',
                fontSize: 11, fontWeight: 700, color: '#E91E8C',
                cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
              }}>
                Place On Stop
              </button>
            ) : (
              <button onClick={() => setOnStopModal('remove')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 22, padding: '0 9px', borderRadius: 11,
                background: 'rgba(0,200,83,0.12)', border: '1px solid #00C853',
                fontSize: 11, fontWeight: 700, color: '#00C853',
                cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
              }}>
                Remove On Stop
              </button>
            )}
          </div>
        </div>

        {/* Metrics strip */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          {[
            { label: 'Outstanding',     value: gbp(c.outstanding_balance), warn: parseFloat(c.outstanding_balance) > 0 },
            { label: 'Credit Limit',    value: gbp(c.credit_limit) },
            { label: 'Billing Period',  value: BILLING_PERIOD_LABELS[c.billing_cycle] || c.billing_cycle || '—' },
            { label: 'Payment Terms',   value: `${c.payment_terms_days} days` },
            { label: 'Account Manager', value: c.account_manager_name || 'Unmanaged' },
            { label: 'Salesperson',     value: c.salesperson_name || '—' },
          ].map(({ label, value, warn }) => (
            <div key={label} style={{ flex: 1, padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: warn ? '#E91E8C' : '#fff' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI summary */}
      {/* Debug toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={() => setShowDebug(d => !d)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px',
            borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: showDebug ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showDebug ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.1)'}`,
            color: showDebug ? '#F59E0B' : '#555' }}>
          <Bug size={11} /> {showDebug ? 'Hide debug' : 'Debug data'}
        </button>
      </div>

      {/* Debug panel */}
      {showDebug && (() => {
        const sections = [
          {
            key: 'customer',
            label: 'Customer record',
            color: '#00C853',
            rows: Object.entries(c).map(([k, v]) => ({ k, v })),
          },
          {
            key: 'contacts',
            label: `Contacts (${contacts?.length ?? 0})`,
            color: '#42A5F5',
            rows: contacts?.map((ct, i) => ({ k: `[${i}]`, v: ct })) ?? [],
          },
          {
            key: 'comm_summary',
            label: 'Comm summary',
            color: '#AB47BC',
            rows: comm_summary ? Object.entries(comm_summary).map(([k, v]) => ({ k, v })) : [{ k: '—', v: 'null' }],
          },
          {
            key: 'volume_snapshots',
            label: `Volume snapshots (${volume_snapshots?.length ?? 0})`,
            color: '#F59E0B',
            rows: volume_snapshots?.slice(0, 10).map((s, i) => ({ k: `[${i}]`, v: s })) ?? [],
            note: volume_snapshots?.length > 10 ? `…${volume_snapshots.length - 10} more rows` : null,
          },
          {
            key: 'active_volume_alert',
            label: 'Active volume alert',
            color: '#EF4444',
            rows: active_volume_alert ? Object.entries(active_volume_alert).map(([k, v]) => ({ k, v })) : [{ k: '—', v: 'none' }],
          },
        ];

        const toggleSection = (key) => setDebugSection(s => {
          const n = new Set(s);
          n.has(key) ? n.delete(key) : n.add(key);
          return n;
        });

        const renderVal = (v) => {
          if (v === null || v === undefined) return <span style={{ color: '#555' }}>null</span>;
          if (typeof v === 'boolean') return <span style={{ color: v ? '#00C853' : '#EF4444', fontWeight: 700 }}>{String(v)}</span>;
          if (typeof v === 'object') return <span style={{ color: '#888', fontFamily: 'monospace', fontSize: 10 }}>{JSON.stringify(v)}</span>;
          if (String(v).length > 80) return <span style={{ color: '#CCC', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 11 }}>{String(v)}</span>;
          return <span style={{ color: '#CCC', fontFamily: 'monospace', fontSize: 11 }}>{String(v)}</span>;
        };

        return (
          <div style={{ marginBottom: 20, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: 'rgba(245,158,11,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bug size={12} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Debug — raw API data for {c.account_number}
              </span>
            </div>
            {sections.map(sec => (
              <div key={sec.key} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  onClick={() => toggleSection(sec.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                  {debugSection.has(sec.key)
                    ? <ChevronDown size={12} color="#555" />
                    : <ChevronRight size={12} color="#555" />}
                  <span style={{ fontSize: 12, fontWeight: 700, color: sec.color }}>{sec.label}</span>
                </div>
                {debugSection.has(sec.key) && (
                  <div style={{ padding: '0 0 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <tbody>
                        {sec.rows.map(({ k, v }, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '3px 14px 3px 22px', color: '#666', fontFamily: 'monospace',
                              width: 200, flexShrink: 0, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{k}</td>
                            <td style={{ padding: '3px 14px', verticalAlign: 'top' }}>{renderVal(v)}</td>
                          </tr>
                        ))}
                        {sec.note && (
                          <tr><td colSpan={2} style={{ padding: '4px 22px', color: '#555', fontStyle: 'italic', fontSize: 10 }}>{sec.note}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {comm_summary && (
        <div className="moov-card" style={{ padding: 16, marginBottom: 20, border: '1px solid rgba(0,200,83,0.2)', background: 'rgba(0,200,83,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={14} style={{ color: '#00C853' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#00C853' }}>AI SUMMARY</span>
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>Updated {format(new Date(comm_summary.generated_at), 'dd MMM, HH:mm')}</span>
          </div>
          <p style={{ fontSize: 13, color: '#DDDDDD', lineHeight: 1.6, fontStyle: 'italic' }}>{comm_summary.summary_text}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#14162A', borderRadius: 12, padding: 4 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            flex: 1, padding: '9px 12px',
            background: activeTab === key ? '#00C853' : 'transparent',
            color: activeTab === key ? '#000' : '#AAAAAA',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'  && <OverviewTab c={c} onSaved={handleCustomerSaved} onDeleteRequest={() => { setDeleteModal(true); setDeleteConfirm(''); }} />}
      {activeTab === 'contacts'  && <ContactsTab customerId={id} contacts={contacts} onRefresh={refetch} />}
      {activeTab === 'volume'    && <PerformanceTab customerId={c.id} />}
      {activeTab === 'financial' && <FinancialTab c={c} creditPct={creditPct} />}
      {activeTab === 'comms'     && <CustomerCommsTab customerId={id} />}
      {activeTab === 'pricing'   && (
        <CustomerPricingTab customer={c}
          onCustomerUpdate={(updated) => queryClient.setQueryData(['customer', id], d => ({ ...d, customer: { ...d.customer, ...updated } }))}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="moov-card" style={{ width: 460, padding: 28, border: '2px solid #E91E8C' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Trash2 size={18} style={{ color: '#E91E8C' }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#E91E8C', margin: 0 }}>Delete {c.business_name}?</h3>
            </div>
            <p style={{ color: '#AAAAAA', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently delete this customer and all associated contacts, rates, and communications.
              This action <strong style={{ color: '#fff' }}>cannot be undone</strong>.
            </p>
            <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 6 }}>
              Type <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{c.account_number}</strong> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={c.account_number}
              style={{ width: '100%', background: '#0D0E2A', border: '1px solid rgba(233,30,140,0.4)', borderRadius: 6, padding: '9px 12px', color: '#fff', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }}>Cancel</button>
              <button
                disabled={deleteConfirm !== c.account_number || deleteCustomer.isPending}
                onClick={() => deleteCustomer.mutate()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, background: deleteConfirm === c.account_number ? '#E91E8C' : 'rgba(233,30,140,0.2)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleteConfirm === c.account_number ? 'pointer' : 'not-allowed' }}
              >
                <Trash2 size={13} /> {deleteCustomer.isPending ? 'Deleting…' : 'Delete Customer'}
              </button>
            </div>
            {deleteCustomer.isError && (
              <p style={{ marginTop: 10, fontSize: 12, color: '#E91E8C' }}>Failed to delete. Please try again.</p>
            )}
          </div>
        </div>
      )}

      {/* On Stop Modal */}
      {onStopModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="moov-card" style={{ width: 480, padding: 28, border: '2px solid #00C853' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: onStopModal === 'apply' ? '#E91E8C' : '#00C853' }}>
              {onStopModal === 'apply' ? 'Place Account On Stop' : 'Remove On Stop'}
            </h3>
            <p style={{ color: '#AAAAAA', fontSize: 13, marginBottom: 20 }}>
              {onStopModal === 'apply'
                ? 'This will block all shipment access for this customer. A reason is required and will be logged.'
                : 'A note is required confirming the reason for removal. This will be logged in the audit trail.'}
            </p>
            <textarea value={onStopInput} onChange={e => setOnStopInput(e.target.value)}
              placeholder={onStopModal === 'apply' ? 'Reason for placing On Stop…' : 'Reason for removal…'}
              style={{ width: '100%', minHeight: 100, background: '#1A1D35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setOnStopModal(null); setOnStopInput(''); }}>Cancel</button>
              <button className={onStopModal === 'apply' ? 'btn-danger' : 'btn-primary'}
                disabled={!onStopInput.trim()}
                onClick={() => { if (onStopModal === 'apply') applyOnStop.mutate({ reason: onStopInput }); else removeOnStop.mutate({ note: onStopInput }); }}>
                {onStopModal === 'apply' ? 'Confirm On Stop' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
