import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, AlertTriangle, Phone, Mail, MapPin, Building2,
  Users, MessageSquare, TrendingUp, DollarSign, Zap, Info,
  Pencil, X, Check, ShieldCheck, Trash2, Plus, Tag,
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

// ─── Billing Aliases ─────────────────────────────────────────
function BillingAliasesEditor({ customerId, aliases, onRefresh }) {
  const [newAlias, setNewAlias] = useState('');

  const addAlias = useMutation({
    mutationFn: () => customersApi.addBillingAlias(customerId, newAlias),
    onSuccess: () => { setNewAlias(''); onRefresh(); },
  });

  const removeAlias = useMutation({
    mutationFn: (alias) => customersApi.removeBillingAlias(customerId, alias),
    onSuccess: onRefresh,
  });

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Tag size={11} style={{ color: '#7B2FBE' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Billing Aliases
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
        Short names the billing engine will match as a last resort (e.g. "europa" for "Europa Worldwide Ltd")
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {aliases.length === 0 && (
          <span style={{ fontSize: 12, color: '#444', fontStyle: 'italic' }}>No aliases set</span>
        )}
        {aliases.map(alias => (
          <span key={alias} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 9999,
            fontSize: 11, fontWeight: 700,
            background: 'rgba(123,47,190,0.15)', color: '#B39DDB',
            border: '1px solid rgba(123,47,190,0.3)',
          }}>
            {alias}
            <button onClick={() => removeAlias.mutate(alias)}
              style={{ background: 'none', border: 'none', color: '#B39DDB', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
              <X size={9} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        <input
          value={newAlias}
          onChange={e => setNewAlias(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && newAlias.trim() && addAlias.mutate()}
          placeholder="e.g. europa"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(123,47,190,0.3)', borderRadius: 6,
            color: '#fff', padding: '4px 10px', fontSize: 12,
          }}
        />
        <button onClick={() => newAlias.trim() && addAlias.mutate()}
          disabled={addAlias.isPending || !newAlias.trim()}
          style={{
            background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.35)',
            borderRadius: 6, color: '#B39DDB', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, padding: '4px 12px',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
          <Plus size={10} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── Rate Card Assignments per carrier ───────────────────────
function CustomerRateCardAssignments({ customerId }) {
  const qc = useQueryClient();

  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ['customer-rate-card-assignments', customerId],
    queryFn: () => customerRateCardsApi.forCustomer(customerId),
    enabled: !!customerId,
  });

  const setAssignment = useMutation({
    mutationFn: ({ courierId, rateCardId }) =>
      rateCardId === 'master'
        ? customerRateCardsApi.clearAssignment(customerId, courierId)
        : customerRateCardsApi.setAssignment(customerId, courierId, rateCardId),
    onSuccess: () => qc.invalidateQueries(['customer-rate-card-assignments', customerId]),
  });

  if (isLoading) return null;
  if (!carriers.length) return (
    <InfoCard title="Rate Cards">
      <span style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>No rate cards configured yet — go to Carriers to create them.</span>
    </InfoCard>
  );

  return (
    <InfoCard title="Rate Cards">
      {carriers.map(row => {
        const currentId = row.assigned_card_id ?? 'master';
        return (
          <div key={row.courier_id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, minHeight:26 }}>
            <span style={{ fontSize:12, color:'#AAAAAA', flexShrink:0, whiteSpace:'nowrap', minWidth:110 }}>
              {row.courier_name}
            </span>
            <select
              value={String(currentId)}
              onChange={e => setAssignment.mutate({ courierId: row.courier_id, rateCardId: e.target.value === 'master' ? 'master' : parseInt(e.target.value) })}
              style={inp({ width: 180, flexShrink: 0, fontSize: 11 })}
            >
              {(row.available_cards || []).map(card => (
                <option key={card.id} value={card.id}>
                  {card.name}{card.is_master ? ' (Master)' : ''}
                </option>
              ))}
            </select>
          </div>
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
  const qc = useQueryClient();
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
              <BillingAliasesEditor customerId={c.id} aliases={c.billing_aliases || []} onRefresh={() => qc.invalidateQueries(['customer', c.id])} />
          </InfoCard>

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
function ContactsTab({ contacts = [] }) {
  return (
    <div className="moov-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#7B2FBE' }}>Contacts</h3>
        <button className="btn-ghost" style={{ fontSize: 13 }}>+ Add Contact</button>
      </div>
      {contacts.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>No contacts added yet</div>
      ) : (
        <table className="moov-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Flags</th></tr>
          </thead>
          <tbody>
            {contacts.map(ct => (
              <tr key={ct.id}>
                <td style={{ fontWeight: 600 }}>{ct.full_name}</td>
                <td style={{ color: '#AAAAAA' }}>{ct.job_title || '—'}</td>
                <td style={{ color: '#AAAAAA' }}>{ct.phone_number || '—'}</td>
                <td style={{ color: '#00BCD4' }}>{ct.email_address}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ct.is_main_contact    && <span style={{ background: 'rgba(0,200,83,0.15)',    color: '#00C853', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Main</span>}
                    {ct.is_finance_contact && <span style={{ background: 'rgba(123,47,190,0.2)',   color: '#7B2FBE', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Finance</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Volume tab ───────────────────────────────────────────────
function VolumeTab({ snapshots = [] }) {
  const total7  = snapshots.filter(s => daysAgo(s.snapshot_date) <= 7).reduce((a, s) => a + s.parcel_count, 0);
  const total30 = snapshots.filter(s => daysAgo(s.snapshot_date) <= 30).reduce((a, s) => a + s.parcel_count, 0);
  const avg13wk = snapshots.length
    ? (snapshots.reduce((a, s) => a + s.parcel_count, 0) / Math.max(snapshots.length, 1)).toFixed(1)
    : '—';
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Last 7 Days',        value: total7.toLocaleString(),  unit: 'parcels' },
          { label: 'Last 30 Days',       value: total30.toLocaleString(), unit: 'parcels' },
          { label: '13-Wk Daily Avg',    value: avg13wk,                  unit: 'parcels/day' },
          { label: 'Data Available',     value: snapshots.length,         unit: 'days' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="moov-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#00C853' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 2 }}>{unit}</div>
          </div>
        ))}
      </div>
      <div className="moov-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Daily Volume — Last 30 Days</h3>
        <MiniBarChart snapshots={snapshots.slice(0, 30)} />
      </div>
    </div>
  );
}

function MiniBarChart({ snapshots }) {
  if (!snapshots.length) return <p style={{ color: '#AAAAAA', fontSize: 13 }}>No data yet</p>;
  const max = Math.max(...snapshots.map(s => s.parcel_count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 12 }}>
      {[...snapshots].reverse().map((s, i) => (
        <div key={i}
          title={`${format(new Date(s.snapshot_date), 'dd MMM')}: ${s.parcel_count} parcels`}
          style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${Math.max((s.parcel_count / max) * 100, 4)}%`, background: `rgba(0,200,83,${0.3 + (s.parcel_count / max) * 0.7})`, cursor: 'default' }}
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

function CommsPlaceholder() {
  return (
    <div className="moov-card" style={{ padding: 32, textAlign: 'center' }}>
      <MessageSquare size={32} style={{ color: '#AAAAAA', margin: '0 auto 12px' }} />
      <p style={{ color: '#AAAAAA', fontSize: 14 }}>
        Communications hub — email, WhatsApp, and tickets will appear here.<br />
        <span style={{ fontSize: 12 }}>WhatsApp Business API + Freshdesk integration required.</span>
      </p>
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

  const { data, isLoading } = useQuery({
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
      {activeTab === 'contacts'  && <ContactsTab contacts={contacts} />}
      {activeTab === 'volume'    && <VolumeTab snapshots={volume_snapshots} />}
      {activeTab === 'financial' && <FinancialTab c={c} creditPct={creditPct} />}
      {activeTab === 'comms'     && <CommsPlaceholder />}
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
