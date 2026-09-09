import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Play, CheckCircle, AlertCircle, Clock, BarChart2 } from 'lucide-react';
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
    billing_day_of_week:       6,
    billing_hour:              0,
    billing_minute:            0,
    fortnightly_parity:        0,
    monthly_billing_date:      1,
    enabled:                   true,
    volume_mix_refresh_day:    6,
    volume_mix_refresh_hour:   8,
  });

  useEffect(() => {
    if (settings) setForm({
      billing_day_of_week:       settings.billing_day_of_week      ?? 6,
      billing_hour:              settings.billing_hour             ?? 0,
      billing_minute:            settings.billing_minute           ?? 0,
      fortnightly_parity:        settings.fortnightly_parity       ?? 0,
      monthly_billing_date:      settings.monthly_billing_date     ?? 1,
      enabled:                   settings.enabled                  ?? true,
      volume_mix_refresh_day:    settings.volume_mix_refresh_day   ?? 6,
      volume_mix_refresh_hour:   settings.volume_mix_refresh_hour  ?? 8,
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

  if (isLoading) return <div style={{ color: '#64748B', padding: 24 }}>Loading…</div>;

  const inputStyle = {
    background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
    borderRadius: 0, padding: '7px 11px', color: 'var(--mv-ink)', fontSize: 13,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' };
  const sectionStyle = { background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: '20px 22px', marginBottom: 16 };

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        <SettingsNav />

        <div className="mv-head">
          <div>
            <div className="mv-kicker">Settings &amp; Finance</div>
            <h1 className="mv-title">Billing Schedules</h1>
            <p className="mv-blurb">
              Configure automated invoice batching, reconciliation run frequency, and volume mix refresh cycles.
            </p>
          </div>
          <div className="mv-actions">
            <button
              onClick={() => { setRunResult(null); setRunError(null); runNowMutation.mutate(); }}
              disabled={runNowMutation.isPending}
              className="mv-btn-ghost"
            >
              <Play size={14} />
              {runNowMutation.isPending ? 'Running…' : 'Run Cycle Now'}
            </button>
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="mv-btn-primary"
            >
              {saved ? <CheckCircle size={14} /> : <Save size={14} />}
              {saved ? 'Saved' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="mv-rule" style={{ marginBottom: 20 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Enabled toggle */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: 'var(--mv-ink)', fontWeight: 800, fontSize: 14 }}>Automatic Billing Run</div>
                  <div style={{ color: 'var(--mv-ink-52)', fontSize: 12, marginTop: 3 }}>When enabled, the server runs the billing cycle on the schedule below.</div>
                </div>
                <button
                  onClick={() => field('enabled', !form.enabled)}
                  className={form.enabled ? 'mv-btn-primary' : 'mv-btn-ghost'}
                  style={{ padding: '6px 16px', fontSize: 12 }}
                >
                  {form.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            {/* Weekly / fortnightly schedule */}
            <div style={sectionStyle}>
              <div style={{ color: 'var(--mv-ink)', fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Weekly &amp; Fortnightly Billing</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Billing Day</label>
                  <select value={form.billing_day_of_week} onChange={e => field('billing_day_of_week', parseInt(e.target.value))} style={inputStyle}>
                    {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Billing Time</label>
                  <select value={form.billing_hour} onChange={e => field('billing_hour', parseInt(e.target.value))} style={inputStyle}>
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Fortnightly parity — which week runs for fortnightly customers?</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[0, 1].map(p => (
                    <button key={p} onClick={() => field('fortnightly_parity', p)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 0, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      background: form.fortnightly_parity === p ? 'var(--mv-ink)' : 'var(--mv-bg)',
                      border: `1px solid ${form.fortnightly_parity === p ? 'var(--mv-ink)' : 'var(--mv-hairline-2)'}`,
                      color: form.fortnightly_parity === p ? 'var(--mv-bg)' : 'var(--mv-ink)',
                    }}>
                      Week {p === 0 ? 'A' : 'B'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly schedule */}
            <div style={sectionStyle}>
              <div style={{ color: 'var(--mv-ink)', fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Monthly Billing</div>
              <div style={{ maxWidth: 220 }}>
                <label style={labelStyle}>Day of Month</label>
                <select value={form.monthly_billing_date} onChange={e => field('monthly_billing_date', parseInt(e.target.value))} style={inputStyle}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of the month</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Next run preview */}
            <div style={{ ...sectionStyle, background: 'var(--mv-surface)', border: '1px solid var(--mv-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--mv-purple)' }}>
                <Clock size={15} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Next weekly run: {nextRunDate(form.billing_day_of_week, form.billing_hour, form.billing_minute)}
                </span>
              </div>
              {settings?.last_run_at && (
                <div style={{ color: 'var(--mv-ink-52)', fontSize: 12, marginTop: 6 }}>
                  Last run: {new Date(settings.last_run_at).toLocaleString('en-GB')}
                </div>
              )}
            </div>

            {/* Volume mix refresh */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <BarChart2 size={15} style={{ color: 'var(--mv-purple)' }} />
                <div style={{ color: 'var(--mv-ink)', fontWeight: 800, fontSize: 14 }}>Volume Mix Refresh</div>
              </div>
              <div style={{ color: 'var(--mv-ink-52)', fontSize: 12, marginBottom: 16, lineHeight: 1.55 }}>
                Controls when rate card projection volume mixes are automatically updated from actual billing data.
                The DPD-ND2KG service is always counted as DPD-32 in the mix.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Refresh Day</label>
                  <select value={form.volume_mix_refresh_day} onChange={e => field('volume_mix_refresh_day', parseInt(e.target.value))} style={inputStyle}>
                    {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Refresh Time</label>
                  <select value={form.volume_mix_refresh_hour} onChange={e => field('volume_mix_refresh_hour', parseInt(e.target.value))} style={inputStyle}>
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--mv-ink-52)' }}>
                Next refresh: {nextRunDate(form.volume_mix_refresh_day, form.volume_mix_refresh_hour, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Run result */}
        {runResult && (
          <div style={{ marginTop: 16, background: 'rgba(0,200,83,0.08)', border: '1px solid var(--mv-green)', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--mv-green)', fontWeight: 800, marginBottom: 8 }}>
              <CheckCircle size={15} /> Billing Run Complete
            </div>
            <div style={{ color: 'var(--mv-ink)', fontSize: 13 }}>
              <div>{runResult.charges_queued} charges moved to Awaiting Reconciliation</div>
              <div style={{ color: 'var(--mv-ink-52)', fontSize: 12, marginTop: 4 }}>
                {runResult.customers_processed} customers processed · Cycles: {runResult.due_cycles?.join(', ') || 'none due'}
              </div>
            </div>
          </div>
        )}

        {runError && (
          <div style={{ marginTop: 16, background: 'rgba(233,30,140,0.08)', border: '1px solid var(--mv-magenta)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--mv-magenta-deep)', fontSize: 13 }}>
            <AlertCircle size={15} /> {runError}
          </div>
        )}
      </div>
    </div>
  );
}
