/**
 * CommsTemplates — /settings/comms-templates
 *
 * "Top-and-Tail" carrier communication templates. Pick a carrier, edit the
 * hardcoded header/footer boilerplate for both courier and customer mail; the
 * automation engine drops Gemini's dynamic analysis into the middle.
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

const FIELDS = [
  { key: 'courier_header_template',  label: 'Courier Header',  hint: 'Top of emails sent to the carrier.' },
  { key: 'courier_footer_template',  label: 'Courier Footer',  hint: 'Sign-off on carrier emails.' },
  { key: 'customer_header_template', label: 'Customer Header', hint: 'Top of updates sent to the customer. Supports {{customer_name}}.' },
  { key: 'customer_footer_template', label: 'Customer Footer', hint: 'Sign-off on customer emails.' },
];

const taSt = {
  width: '100%', boxSizing: 'border-box', background: '#fff',
  border: '1px solid #E2E8F0', borderRadius: 10, color: '#0F172A',
  fontSize: 13, lineHeight: 1.5, padding: '12px 14px', outline: 'none',
  fontFamily: 'inherit', resize: 'vertical', minHeight: 96,
};

export default function CommsTemplates() {
  const [couriers, setCouriers] = useState([]);
  const [code, setCode]         = useState('');
  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    api.get('/settings/couriers')
      .then(r => {
        setCouriers(r.data || []);
        if (r.data?.length) { setCode(r.data[0].courier_code); setForm(r.data[0]); }
      })
      .catch(() => setCouriers([]))
      .finally(() => setLoading(false));
  }, []);

  function selectCourier(c) {
    setCode(c);
    setForm(couriers.find(x => x.courier_code === c) || {});
    setSaved(false);
  }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  async function save() {
    setSaving(true); setSaved(false);
    try {
      const payload = Object.fromEntries(FIELDS.map(f => [f.key, form[f.key] ?? '']));
      const r = await api.put(`/settings/couriers/${code}/templates`, payload);
      setCouriers(list => list.map(x => x.courier_code === code ? r.data : x));
      setSaved(true);
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <SettingsNav />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: 0 }}>✉️ Carrier Communication Templates</h2>
          <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 5, maxWidth: 620, lineHeight: 1.5 }}>
            Top-and-Tail boilerplate per carrier. Gemini's dynamic analysis is dropped between your header and footer when drafting outbound mail.
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: 5 }}>Carrier</label>
          <select value={code} onChange={e => selectCourier(e.target.value)}
            style={{ ...taSt, minHeight: 0, padding: '8px 12px', minWidth: 160 }}>
            {couriers.map(c => (
              <option key={c.courier_code} value={c.courier_code}>
                {(c.courier_name || c.courier_code || '').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div style={{ padding: 28, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading carriers…</div>}
      {!loading && couriers.length === 0 && (
        <div style={{ padding: 28, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          No carriers found. Add a courier routing rule first.
        </div>
      )}

      {!loading && couriers.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 7px' }}>{f.hint}</p>
                <textarea value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} style={taSt} rows={4} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button onClick={save} disabled={saving} className="btn-primary"
              style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save templates'}
            </button>
            {saved && <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>✓ Saved</span>}
          </div>
        </>
      )}
    </div>
  );
}
