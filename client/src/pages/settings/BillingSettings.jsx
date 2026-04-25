import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}));

function nextRunDate(dayOfWeek, hour, minute) {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);
  const diff = (dayOfWeek - now.getDay() + 7) % 7;
  result.setDate(now.getDate() + (diff === 0 && result <= now ? 7 : diff));
  return result.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BillingSettings() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => api.get('/billing/settings').then(r => r.data),
  });

  const [form, setForm] = useState({
    billing_day_of_week:  6,
    billing_hour:         0,
    billing_minute:       0,
    fortnightly_parity:   0,
    monthly_billing_date: 1,
    enabled:              true,
  });

  useEffect(() => {
    if (settings) setForm({
      billing_day_of_week:  settings.billing_day_of_week  ?? 6,
      billing_hour:         settings.billing_hour         ?? 0,
      billing_minute:       settings.billing_minute       ?? 0,
      fortnightly_parity:   settings.fortnightly_parity   ?? 0,
      monthly_billing_date: settings.monthly_billing_date ?? 1,
      enabled:              settings.enabled              ?? true,
    });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/billing/settings', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['billing-settings']);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const runNowMutation = useMutation({
    mutationFn: () => api.post('/billing/billing/run-cycle', {}).then(r => r.data),
    onSuccess: (data) => {
      setRunResult(data);
      setRunError(null);
      queryClient.invalidateQueries(['billing-settings']);
      queryClient.invalidateQueries(['charges-stats']);
    },
    onError: (err) => {
      setRunError(err.response?.data?.error || 'Run failed');
      setRunResult(null);
    },
  });

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  if (isLoading) return <div style={{ color: '#888', padding: 24 }}>Loading…</div>;

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#fff', fontSize: 13, padding: '8px 12px',
    outline: 'none', width: '100%',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' };
  const sectionStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 };

  return (
    <div style={{ maxWidth: 700 }}>
      <SettingsNav />

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Billing Settings</h2>
        <p style={{ color: '#888', fontSize: 13, margin: '6px 0 0' }}>
          Configure when verified charges are automatically moved to <em>Awaiting Reconciliation</em>.
        </p>
      </div>

      {/* Enabled toggle */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Automatic billing run</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 3 }}>When enabled, the server runs the billing cycle on the schedule below.</div>
          </div>
          <button
            onClick={() => field('enabled', !form.enabled)}
            style={{
              background: form.enabled ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${form.enabled ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20, padding: '6px 18px', fontSize: 13, fontWeight: 700,
              color: form.enabled ? '#00C853' : '#888', cursor: 'pointer',
            }}
          >
            {form.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Weekly / fortnightly schedule */}
      <div style={sectionStyle}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Weekly &amp; fortnightly billing</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Billing day</label>
            <select value={form.billing_day_of_week} onChange={e => field('billing_day_of_week', parseInt(e.target.value))} style={inputStyle}>
              {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Billing time</label>
            <select value={form.billing_hour} onChange={e => field('billing_hour', parseInt(e.target.value))} style={inputStyle}>
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Fortnightly parity — which week runs for fortnightly customers?</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[0, 1].map(p => (
              <button key={p} onClick={() => field('fortnightly_parity', p)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: form.fortnightly_parity === p ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.fortnightly_parity === p ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: form.fortnightly_parity === p ? '#00C853' : '#888',
              }}>
                Week {p === 0 ? 'A' : 'B'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly schedule */}
      <div style={sectionStyle}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Monthly billing</div>
        <div style={{ maxWidth: 200 }}>
          <label style={labelStyle}>Day of month</label>
          <select value={form.monthly_billing_date} onChange={e => field('monthly_billing_date', parseInt(e.target.value))} style={inputStyle}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of the month</option>
            ))}
          </select>
        </div>
      </div>

      {/* Next run preview */}
      <div style={{ ...sectionStyle, background: 'rgba(66,165,245,0.05)', border: '1px solid rgba(66,165,245,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#42A5F5' }}>
          <Clock size={15} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Next weekly run: {nextRunDate(form.billing_day_of_week, form.billing_hour, form.billing_minute)}
          </span>
        </div>
        {settings?.last_run_at && (
          <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
            Last run: {new Date(settings.last_run_at).toLocaleString('en-GB')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: saved ? 'rgba(0,200,83,0.15)' : 'rgba(0,200,83,0.12)',
            border: `1px solid ${saved ? 'rgba(0,200,83,0.5)' : 'rgba(0,200,83,0.3)'}`,
            borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700,
            color: '#00C853', cursor: 'pointer',
          }}
        >
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? 'Saved' : 'Save settings'}
        </button>

        <button
          onClick={() => { setRunResult(null); setRunError(null); runNowMutation.mutate(); }}
          disabled={runNowMutation.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(66,165,245,0.1)', border: '1px solid rgba(66,165,245,0.3)',
            borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700,
            color: '#42A5F5', cursor: 'pointer',
          }}
        >
          <Play size={14} />
          {runNowMutation.isPending ? 'Running…' : 'Run now'}
        </button>
      </div>

      {/* Run result */}
      {runResult && (
        <div style={{ marginTop: 16, background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00C853', fontWeight: 700, marginBottom: 8 }}>
            <CheckCircle size={15} /> Billing run complete
          </div>
          <div style={{ color: '#ccc', fontSize: 13 }}>
            <div>{runResult.charges_queued} charges moved to Awaiting Reconciliation</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
              {runResult.customers_processed} customers processed · Cycles: {runResult.due_cycles?.join(', ') || 'none due'}
            </div>
          </div>
          {runResult.details?.length > 0 && (
            <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
              {runResult.details.map((d, i) => (
                <div key={i} style={{ fontSize: 12, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{d.name} ({d.account})</span>
                  <span style={{ color: '#00C853' }}>{d.charges_queued} charges</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {runError && (
        <div style={{ marginTop: 16, background: 'rgba(244,67,54,0.07)', border: '1px solid rgba(244,67,54,0.2)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#F44336', fontSize: 13 }}>
          <AlertCircle size={15} /> {runError}
        </div>
      )}
    </div>
  );
}
