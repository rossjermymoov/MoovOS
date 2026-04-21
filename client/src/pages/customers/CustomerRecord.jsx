import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, AlertTriangle, Phone, Mail, MapPin, Building2,
  Users, MessageSquare, TrendingUp, DollarSign, Zap, Info
} from 'lucide-react';
import { customersApi } from '../../api/customers';
import { HealthBadge, AccountStatusBadge, TierBadge, CreditUtilisationBar } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const TABS = [
  { key: 'overview',   label: 'Overview',     icon: Building2 },
  { key: 'contacts',   label: 'Contacts',     icon: Users },
  { key: 'comms',      label: 'Communications', icon: MessageSquare },
  { key: 'volume',     label: 'Performance',  icon: TrendingUp },
  { key: 'financial',  label: 'Financial',    icon: DollarSign },
];

// ─── Currency formatter ──────────────────────────────────────
const gbp = (n) => `£${parseFloat(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [onStopModal, setOnStopModal] = useState(null); // 'apply' | 'remove'
  const [onStopInput, setOnStopInput] = useState('');

  // Guard: "new" is a reserved path, not a customer ID
  useEffect(() => {
    if (id === 'new') navigate('/customers/new', { replace: true });
  }, [id, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id),
    enabled: id !== 'new', // never fire the API call for the reserved "new" path
  });

  const applyOnStop = useMutation({
    mutationFn: ({ reason }) => customersApi.applyOnStop(id, { reason, staff_id: 'CURRENT_USER_ID' }),
    onSuccess: () => { queryClient.invalidateQueries(['customer', id]); setOnStopModal(null); setOnStopInput(''); },
  });

  const removeOnStop = useMutation({
    mutationFn: ({ note }) => customersApi.removeOnStop(id, { note, staff_id: 'CURRENT_USER_ID' }),
    onSuccess: () => { queryClient.invalidateQueries(['customer', id]); setOnStopModal(null); setOnStopInput(''); },
  });

  // While redirecting away from the reserved "new" path, render nothing
  if (id === 'new') return null;

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#AAAAAA' }}>
      Loading customer record…
    </div>
  );

  if (!data) return (
    <div style={{ color: '#E91E8C', padding: 32 }}>Customer not found.</div>
  );

  const { customer: c, contacts, comm_summary, volume_snapshots, active_volume_alert } = data;
  const creditPct = parseFloat(c.credit_utilisation_pct) || 0;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/customers')}
        style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> All Customers
      </button>

      {/* ON STOP BANNER (Section 1.11) */}
      {c.is_on_stop && (
        <div style={{
          background: 'rgba(233,30,140,0.12)',
          border: '1.5px solid #E91E8C',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <AlertTriangle size={20} style={{ color: '#E91E8C', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: '#E91E8C', fontWeight: 700, fontSize: 15 }}>Account On Stop</span>
            <span style={{ color: '#AAAAAA', fontSize: 13, marginLeft: 12 }}>
              Shipment access blocked · Reason: {c.on_stop_reason}
            </span>
          </div>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setOnStopModal('remove')}>
            Remove On Stop
          </button>
        </div>
      )}

      {/* Volume drop alert */}
      {active_volume_alert && (
        <div style={{
          background: 'rgba(255,193,7,0.1)',
          border: '1px solid #FFC107',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <AlertTriangle size={16} style={{ color: '#FFC107' }} />
          <span style={{ color: '#FFC107', fontSize: 13 }}>
            Volume alert: {active_volume_alert.drop_percentage?.toFixed(0)}% below 13-week baseline
            ({active_volume_alert.actual_daily_count} parcels vs {active_volume_alert.baseline_daily_avg} avg)
          </span>
        </div>
      )}

      {/* Header card */}
      <div className="moov-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #7B2FBE, #00C853)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
          }}>
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
                <MapPin size={12} /> {c.postcode}
              </span>
            </div>
          </div>

          {/* Right side: health + status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <HealthBadge score={c.health_score} />
            <AccountStatusBadge status={c.account_status} />
            {!c.is_on_stop && (
              <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px', color: '#E91E8C', borderColor: '#E91E8C' }} onClick={() => setOnStopModal('apply')}>
                Place On Stop
              </button>
            )}
          </div>
        </div>

        {/* Key metrics strip */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          {[
            { label: 'Outstanding', value: gbp(c.outstanding_balance), warn: parseFloat(c.outstanding_balance) > 0 },
            { label: 'Credit Limit', value: gbp(c.credit_limit) },
            { label: 'Payment Terms', value: `${c.payment_terms_days} days` },
            { label: 'Onboarded', value: c.date_onboarded ? format(new Date(c.date_onboarded), 'dd MMM yyyy') : '—' },
            { label: 'Account Manager', value: c.account_manager_name || 'Unmanaged' },
            { label: 'Salesperson', value: c.salesperson_name || '—' },
          ].map(({ label, value, warn }) => (
            <div key={label} style={{ flex: 1, padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: warn ? '#E91E8C' : '#fff' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary (Section 1.4) */}
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
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1, padding: '9px 12px',
              background: activeTab === key ? '#00C853' : 'transparent',
              color: activeTab === key ? '#000' : '#AAAAAA',
              border: 'none', borderRadius: 9, cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'overview' && <OverviewTab c={c} />}
      {activeTab === 'contacts' && <ContactsTab contacts={contacts} />}
      {activeTab === 'volume'   && <VolumeTab snapshots={volume_snapshots} />}
      {activeTab === 'financial' && <FinancialTab c={c} creditPct={creditPct} />}
      {activeTab === 'comms'    && <CommsPlaceholder />}

      {/* On Stop Modal */}
      {onStopModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="moov-card" style={{ width: 480, padding: 28, border: '2px solid #00C853' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: onStopModal === 'apply' ? '#E91E8C' : '#00C853' }}>
              {onStopModal === 'apply' ? 'Place Account On Stop' : 'Remove On Stop'}
            </h3>
            <p style={{ color: '#AAAAAA', fontSize: 13, marginBottom: 20 }}>
              {onStopModal === 'apply'
                ? 'This will block all shipment access for this customer. A reason is required and will be logged.'
                : 'A note is required confirming the reason for removal. This will be logged in the audit trail.'}
            </p>
            <textarea
              value={onStopInput}
              onChange={e => setOnStopInput(e.target.value)}
              placeholder={onStopModal === 'apply' ? 'Reason for placing On Stop…' : 'Reason for removal (e.g. Payment received)…'}
              style={{
                width: '100%', minHeight: 100, background: '#1A1D35', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setOnStopModal(null); setOnStopInput(''); }}>Cancel</button>
              <button
                className={onStopModal === 'apply' ? 'btn-danger' : 'btn-primary'}
                disabled={!onStopInput.trim()}
                onClick={() => {
                  if (onStopModal === 'apply') applyOnStop.mutate({ reason: onStopInput });
                  else removeOnStop.mutate({ note: onStopInput });
                }}
              >
                {onStopModal === 'apply' ? 'Confirm On Stop' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────
function OverviewTab({ c }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <InfoCard title="Business Details">
        <Row label="Registered Address" value={c.registered_address} />
        <Row label="Postcode"           value={c.postcode} />
        <Row label="Phone"              value={c.phone_number} />
        <Row label="Email"              value={c.primary_email} />
        {c.company_reg_number && <Row label="Company Reg." value={c.company_reg_number} />}
      </InfoCard>
      <InfoCard title="Account Settings">
        <Row label="Tier"              value={<TierBadge tier={c.tier} />} />
        <Row label="Status"            value={<AccountStatusBadge status={c.account_status} />} />
        <Row label="Health Score"      value={<HealthBadge score={c.health_score} />} />
        <Row label="Payment Terms"     value={`${c.payment_terms_days} days`} />
        <Row label="Account Manager"   value={c.account_manager_name || 'Unmanaged'} />
        <Row label="Salesperson"       value={c.salesperson_name || '—'} />
        <Row label="Onboarding Person" value={c.onboarding_person_name || '—'} />
      </InfoCard>
      {c.health_score_summary && (
        <div className="moov-card" style={{ padding: 20, gridColumn: '1 / -1' }}>
          <SectionTitle>Health Score Detail</SectionTitle>
          <p style={{ fontSize: 13, color: '#DDDDDD', lineHeight: 1.6 }}>{c.health_score_summary}</p>
          {c.health_score_updated && (
            <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 8 }}>
              Last calculated: {format(new Date(c.health_score_updated), 'dd MMM yyyy, HH:mm')}
            </p>
          )}
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
        <SectionTitle>Contacts</SectionTitle>
        <button className="btn-ghost" style={{ fontSize: 13 }}>+ Add Contact</button>
      </div>
      {contacts.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>No contacts added yet</div>
      ) : (
        <table className="moov-table">
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Flags</th>
            </tr>
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
                    {ct.is_main_contact    && <span style={{ background: 'rgba(0,200,83,0.15)', color: '#00C853', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Main</span>}
                    {ct.is_finance_contact && <span style={{ background: 'rgba(123,47,190,0.2)', color: '#7B2FBE', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Finance</span>}
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

// ─── Volume / Performance tab ────────────────────────────────
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
          { label: 'Last 7 Days', value: total7.toLocaleString(), unit: 'parcels' },
          { label: 'Last 30 Days', value: total30.toLocaleString(), unit: 'parcels' },
          { label: '13-Wk Daily Avg', value: avg13wk, unit: 'parcels/day' },
          { label: 'Snapshots Available', value: snapshots.length, unit: 'days of data' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="moov-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#00C853' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 2 }}>{unit}</div>
          </div>
        ))}
      </div>
      <div className="moov-card" style={{ padding: 20 }}>
        <SectionTitle>Daily Volume — Last 30 Days</SectionTitle>
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
        <div
          key={i}
          title={`${format(new Date(s.snapshot_date), 'dd MMM')}: ${s.parcel_count} parcels`}
          style={{
            flex: 1, borderRadius: '3px 3px 0 0',
            height: `${Math.max((s.parcel_count / max) * 100, 4)}%`,
            background: `rgba(0,200,83,${0.3 + (s.parcel_count / max) * 0.7})`,
            cursor: 'default', transition: 'opacity 0.15s',
          }}
        />
      ))}
    </div>
  );
}

function daysAgo(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

// ─── Financial tab ───────────────────────────────────────────
function FinancialTab({ c, creditPct }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <InfoCard title="Credit Position">
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#AAAAAA' }}>Credit Utilisation</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: creditPct >= 90 ? '#E91E8C' : creditPct >= 80 ? '#FFC107' : '#00C853' }}>
              {creditPct.toFixed(1)}%
            </span>
          </div>
          <CreditUtilisationBar pct={creditPct} />
          {creditPct >= 80 && (
            <div style={{ marginTop: 8, fontSize: 12, color: creditPct >= 90 ? '#E91E8C' : '#FFC107', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Info size={12} />
              {creditPct >= 100 ? 'Credit limit reached — On Stop recommended' : creditPct >= 90 ? 'Escalated alert — urgent review recommended' : 'Approaching credit limit — finance team alerted'}
            </div>
          )}
        </div>
        <Row label="Outstanding Balance" value={<span style={{ color: parseFloat(c.outstanding_balance) > 0 ? '#E91E8C' : '#00C853', fontWeight: 700 }}>{`£${parseFloat(c.outstanding_balance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}</span>} />
        <Row label="Credit Limit"        value={`£${parseFloat(c.credit_limit).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`} />
        <Row label="Payment Terms"       value={`${c.payment_terms_days} days`} />
      </InfoCard>

      <InfoCard title="Account Status">
        <Row label="Account Status" value={<AccountStatusBadge status={c.account_status} />} />
        {c.is_on_stop && (
          <>
            <Row label="On Stop Since"  value={c.on_stop_applied_at ? format(new Date(c.on_stop_applied_at), 'dd MMM yyyy, HH:mm') : '—'} />
            <Row label="Reason"         value={c.on_stop_reason || '—'} />
          </>
        )}
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12, color: '#AAAAAA', lineHeight: 1.6 }}>
          Invoices, credits, and payment history are pulled from Xero via API.{' '}
          <span style={{ color: '#00BCD4', cursor: 'pointer' }}>View in Finance module →</span>
        </div>
      </InfoCard>
    </div>
  );
}

function CommsPlaceholder() {
  return (
    <div className="moov-card" style={{ padding: 32, textAlign: 'center' }}>
      <MessageSquare size={32} style={{ color: '#AAAAAA', margin: '0 auto 12px' }} />
      <p style={{ color: '#AAAAAA', fontSize: 14 }}>
        Communications hub — email, WhatsApp, and tickets will appear here.<br />
        <span style={{ fontSize: 12 }}>WhatsApp Business API + Freshdesk migration required.</span>
      </p>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────
function InfoCard({ title, children }) {
  return (
    <div className="moov-card" style={{ padding: 20 }}>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>{children}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 16, fontWeight: 600, color: '#7B2FBE' }}>{children}</h3>;
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#AAAAAA', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#fff', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
