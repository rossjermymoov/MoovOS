/**
 * EmailSettings — /settings/email
 *
 * Sections:
 *  1. SendGrid connection (API key, from address, test send)
 *  2. Alert types — toggle, threshold settings, recipients per alert
 *  3. Date-range backfill (disaster recovery)
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Plus, Trash2, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

const S = {
  page:        { padding: '32px 40px', maxWidth: 860, margin: '0 auto' },
  card:        { background: '#12132a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '24px 28px', marginBottom: 20 },
  cardTitle:   { fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 },
  cardSub:     { fontSize: 13, color: '#888', marginBottom: 20 },
  row:         { display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 },
  label:       { fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input:       { background: '#0d0e21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: 13, width: '100%', outline: 'none' },
  btn:         { padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnPrimary:  { background: '#00C853', color: '#000' },
  btnSecondary:{ background: 'rgba(255,255,255,0.07)', color: '#ccc' },
  btnDanger:   { background: 'rgba(255,60,60,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,60,60,0.2)' },
  toggle:      { width: 38, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  pill:        { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  divider:     { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0' },
};

// ─── Alert type display config ────────────────────────────────────────────────

const ALERT_META = {
  webhook_gap:         { icon: '📡', colour: '#ff9800' },
  backfill_triggered:  { icon: 'ℹ️',  colour: '#2196f3' },
  billing_run_complete:{ icon: '✅',  colour: '#00C853' },
};

// ─── SendGrid Connection Card ─────────────────────────────────────────────────

function ConnectionCard({ config, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm]     = useState({ api_key: '', from_address: '', from_name: '', enabled: false });
  const [showKey, setShowKey] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [status, setStatus] = useState(null); // 'saving' | 'saved' | 'error' | 'testing' | 'test_ok' | 'test_err'
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (config) {
      setForm({
        api_key:      '',  // never pre-fill the key
        from_address: config.from_address || '',
        from_name:    config.from_name    || 'Moov OS',
        enabled:      config.enabled      ?? false,
      });
    }
  }, [config]);

  async function handleSave() {
    setStatus('saving');
    setErrMsg('');
    try {
      const body = {
        from_address: form.from_address,
        from_name:    form.from_name,
        enabled:      form.enabled,
      };
      if (form.api_key) body.api_key = form.api_key;
      await api.put('/email/config', body);
      qc.invalidateQueries(['email-config']);
      setStatus('saved');
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus('error');
      setErrMsg(e.response?.data?.error || e.message);
    }
  }

  async function handleTest() {
    if (!testTo) return;
    setStatus('testing');
    try {
      const body = {
        api_key:      form.api_key || config?.has_api_key ? form.api_key || '__use_stored__' : '',
        from_address: form.from_address,
        from_name:    form.from_name,
        to:           testTo,
      };
      // If the user hasn't typed a new key, send the stored one via a special flag
      if (!form.api_key && config?.has_api_key) {
        // Ask the server to use the stored key
        await api.post('/email/config/test', { ...body, use_stored_key: true });
      } else {
        await api.post('/email/config/test', body);
      }
      setStatus('test_ok');
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus('test_err');
      setErrMsg(e.response?.data?.error || e.message);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div style={{ flex: 1 }}>
      <label style={S.label}>{label}</label>
      <input
        style={S.input} type={type} placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={S.cardTitle}>SendGrid Connection</div>
          <div style={S.cardSub}>Emails are sent via SendGrid. Enter your API key and sending address below.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#888' }}>{form.enabled ? 'Enabled' : 'Disabled'}</span>
          <button
            style={{ ...S.toggle, background: form.enabled ? '#00C853' : 'rgba(255,255,255,0.1)' }}
            onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
          >
            <span style={{
              position: 'absolute', top: 3, left: form.enabled ? 20 : 3,
              width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
            }} />
          </button>
        </div>
      </div>

      <div style={S.row}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>SendGrid API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...S.input, paddingRight: 36 }}
              type={showKey ? 'text' : 'password'}
              placeholder={config?.has_api_key ? '●●●●●●●● (key saved — leave blank to keep)' : 'SG.xxxxxxxxxxxx'}
              value={form.api_key}
              onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
            />
            <button
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 2 }}
              onClick={() => setShowKey(v => !v)}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        {field('from_name', 'From Name', 'text', 'Moov OS')}
      </div>

      <div style={S.row}>
        {field('from_address', 'From Address', 'email', 'alerts@yourdomain.com')}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={handleSave} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save Connection'}
        </button>

        {status === 'saved'    && <span style={{ color: '#00C853', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Saved</span>}
        {status === 'error'    && <span style={{ color: '#ff6b6b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={14} /> {errMsg}</span>}
        {status === 'test_ok'  && <span style={{ color: '#00C853', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Test email sent</span>}
        {status === 'test_err' && <span style={{ color: '#ff6b6b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={14} /> {errMsg}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            style={{ ...S.input, width: 200 }}
            type="email" placeholder="Send test to…"
            value={testTo}
            onChange={e => setTestTo(e.target.value)}
          />
          <button
            style={{ ...S.btn, ...S.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleTest}
            disabled={!testTo || status === 'testing'}
          >
            <Send size={13} />
            {status === 'testing' ? 'Sending…' : 'Test'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single Alert Type Card ────────────────────────────────────────────────────

function AlertCard({ alert }) {
  const qc = useQueryClient();
  const meta = ALERT_META[alert.code] || { icon: '🔔', colour: '#888' };
  const [addEmail, setAddEmail] = useState('');
  const [addName,  setAddName]  = useState('');
  const [saving, setSaving]     = useState(false);

  async function toggleEnabled() {
    await api.put(`/email/alerts/${alert.code}`, { enabled: !alert.enabled });
    qc.invalidateQueries(['email-alerts']);
  }

  async function updateSettings(settings) {
    await api.put(`/email/alerts/${alert.code}`, { settings });
    qc.invalidateQueries(['email-alerts']);
  }

  async function addRecipient() {
    if (!addEmail) return;
    setSaving(true);
    try {
      await api.post(`/email/alerts/${alert.code}/recipients`, { email: addEmail, name: addName });
      setAddEmail(''); setAddName('');
      qc.invalidateQueries(['email-alerts']);
    } finally { setSaving(false); }
  }

  async function removeRecipient(id) {
    await api.delete(`/email/alerts/${alert.code}/recipients/${id}`);
    qc.invalidateQueries(['email-alerts']);
  }

  const s = alert.settings || {};

  return (
    <div style={{ ...S.card, borderLeft: `3px solid ${meta.colour}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{meta.icon}</span>
            <span style={{ ...S.cardTitle, marginBottom: 0 }}>{alert.name}</span>
            <span style={{
              ...S.pill,
              background: alert.enabled ? 'rgba(0,200,83,0.12)' : 'rgba(255,255,255,0.05)',
              color: alert.enabled ? '#00C853' : '#666'
            }}>
              {alert.enabled ? 'Active' : 'Off'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#777', maxWidth: 560 }}>{alert.description}</div>
        </div>
        <button
          style={{ ...S.toggle, background: alert.enabled ? '#00C853' : 'rgba(255,255,255,0.1)', marginTop: 4 }}
          onClick={toggleEnabled}
        >
          <span style={{
            position: 'absolute', top: 3, left: alert.enabled ? 20 : 3,
            width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
          }} />
        </button>
      </div>

      {/* Settings row — only show fields relevant to this alert */}
      {alert.code === 'webhook_gap' && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={S.label}>Gap threshold (minutes)</label>
            <input
              style={{ ...S.input, width: 120 }} type="number" min={1} max={120}
              defaultValue={s.threshold_minutes ?? 10}
              onBlur={e => updateSettings({ ...s, threshold_minutes: parseInt(e.target.value) || 10 })}
            />
          </div>
          <div>
            <label style={S.label}>Business hours start</label>
            <input
              style={{ ...S.input, width: 80 }} type="number" min={0} max={23}
              defaultValue={s.business_hours_start ?? 8}
              onBlur={e => updateSettings({ ...s, business_hours_start: parseInt(e.target.value) ?? 8 })}
            />
          </div>
          <div>
            <label style={S.label}>Business hours end</label>
            <input
              style={{ ...S.input, width: 80 }} type="number" min={0} max={23}
              defaultValue={s.business_hours_end ?? 17}
              onBlur={e => updateSettings({ ...s, business_hours_end: parseInt(e.target.value) ?? 17 })}
            />
          </div>
          <div>
            <label style={S.label}>Cooldown (minutes)</label>
            <input
              style={{ ...S.input, width: 100 }} type="number" min={5}
              defaultValue={s.cooldown_minutes ?? 30}
              onBlur={e => updateSettings({ ...s, cooldown_minutes: parseInt(e.target.value) || 30 })}
            />
          </div>
        </div>
      )}

      {alert.code === 'backfill_triggered' && (
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Cooldown (minutes — max alerts per hour)</label>
          <input
            style={{ ...S.input, width: 120 }} type="number" min={5}
            defaultValue={s.cooldown_minutes ?? 60}
            onBlur={e => updateSettings({ ...s, cooldown_minutes: parseInt(e.target.value) || 60 })}
          />
        </div>
      )}

      <div style={S.divider} />

      {/* Recipients */}
      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
        Recipients
      </div>

      {alert.recipients?.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {alert.recipients.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '5px 10px 5px 12px', fontSize: 13 }}>
              <Mail size={12} style={{ color: '#888' }} />
              <span style={{ color: '#ddd' }}>{r.name ? `${r.name} <${r.email}>` : r.email}</span>
              <button
                onClick={() => removeRecipient(r.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0, marginLeft: 4, display: 'flex' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>No recipients — add one below to activate this alert.</div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <input style={S.input} type="email" placeholder="Email address" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <input style={S.input} type="text" placeholder="Name (optional)" value={addName} onChange={e => setAddName(e.target.value)} />
        </div>
        <button
          style={{ ...S.btn, ...S.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={addRecipient} disabled={!addEmail || saving}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── Bulk Backfill Card ───────────────────────────────────────────────────────

function BackfillCard() {
  const [start, setStart]   = useState('');
  const [end,   setEnd]     = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function runBackfill() {
    if (!start || !end) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/v1/webhooks/voila-backfill', { start, end });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Date Range Backfill</div>
      <div style={S.cardSub}>
        If a webhook outage occurred, use this to recover missed shipments. Moov OS will fetch all shipments from Voila for the given window, price any that are missing, and mark them verified.
      </div>

      <div style={S.row}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>From (UTC)</label>
          <input style={S.input} type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>To (UTC)</label>
          <input style={S.input} type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
        <button
          style={{ ...S.btn, ...S.btnPrimary, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}
          onClick={runBackfill} disabled={!start || !end || loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Running…' : 'Run Backfill'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: '14px 18px', fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: result.errors?.length ? 10 : 0 }}>
            {[
              ['Fetched from Voila',  result.fetched],
              ['Charges created',    result.charges_created, '#00C853'],
              ['Already existed',    result.shipments_skipped],
              ['Failed',             result.shipments_failed, result.shipments_failed > 0 ? '#ff9800' : null],
            ].map(([label, val, col]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: col || '#fff' }}>{val ?? 0}</div>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ color: '#ff9800', cursor: 'pointer', fontSize: 12 }}>Show {result.errors.length} error(s)</summary>
              <pre style={{ fontSize: 11, color: '#aaa', marginTop: 6, overflow: 'auto' }}>
                {JSON.stringify(result.errors, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmailSettings() {
  const { data: config, isLoading: cfgLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn:  () => api.get('/email/config').then(r => r.data),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['email-alerts'],
    queryFn:  () => api.get('/email/alerts').then(r => r.data),
  });

  return (
    <div style={S.page}>
      <SettingsNav />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Mail size={22} style={{ color: '#00C853' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>Email Settings</h2>
      </div>

      {cfgLoading ? (
        <div style={{ color: '#888', fontSize: 14 }}>Loading…</div>
      ) : (
        <ConnectionCard config={config} />
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '28px 0 14px' }}>
        Alert Types
      </h3>

      {alertsLoading ? (
        <div style={{ color: '#888', fontSize: 14 }}>Loading alerts…</div>
      ) : (
        alerts?.map(a => <AlertCard key={a.id} alert={a} />)
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '28px 0 14px' }}>
        Disaster Recovery
      </h3>

      <BackfillCard />
    </div>
  );
}
