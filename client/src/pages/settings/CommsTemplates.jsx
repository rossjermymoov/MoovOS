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

// Human-readable description of a sample's shape, e.g. "2 letters + 10 digits".
function describeSample(sample) {
  const t = String(sample || '').replace(/\s+/g, '').toUpperCase();
  if (!t) return '—';
  const runs = t.match(/(\d+|[A-Z]+|[^0-9A-Z]+)/g) || [];
  return runs.map(r =>
    /^\d+$/.test(r)        ? `${r.length} digit${r.length === 1 ? '' : 's'}` :
    /^[A-Z]+$/.test(r)     ? `${r.length} letter${r.length === 1 ? '' : 's'}` :
                             `"${r}"`
  ).join(' + ');
}

const taSt = {
  width: '100%', boxSizing: 'border-box', background: 'var(--mv-bg)',
  border: '1px solid var(--mv-hairline-2)', borderRadius: 0, color: 'var(--mv-ink)',
  fontSize: 13, lineHeight: 1.5, padding: '10px 12px', outline: 'none',
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
      const payload = {
        queries_email:    form.queries_email ?? '',
        claims_email:     form.claims_email ?? '',
        tracking_samples: form.tracking_samples ?? '',
        ...Object.fromEntries(FIELDS.map(f => [f.key, form[f.key] ?? ''])),
      };
      const r = await api.put(`/settings/couriers/${code}/templates`, payload);
      setCouriers(list => list.map(x => x.courier_code === code ? r.data : x));
      setSaved(true);
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    } finally { setSaving(false); }
  }

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        <SettingsNav />

        <div className="mv-head">
          <div>
            <div className="mv-kicker">Settings &amp; Templates</div>
            <h1 className="mv-title">Carrier Communication Templates</h1>
            <p className="mv-blurb">
              Top-and-Tail boilerplate per carrier. Gemini dynamic analysis is dropped between your header and footer when drafting outbound mail.
            </p>
          </div>
          <div className="mv-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mv-ink-52)' }}>Carrier:</span>
              <select value={code} onChange={e => selectCourier(e.target.value)}
                style={{ background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: '6px 10px', fontSize: 13, color: 'var(--mv-ink)', minWidth: 140 }}>
                {couriers.map(c => (
                  <option key={c.courier_code} value={c.courier_code}>
                    {(c.courier_name || c.courier_code || '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mv-rule" />

        {loading && <div style={{ padding: 28, textAlign: 'center', color: 'var(--mv-ink-52)', fontSize: 13 }}>Loading carriers…</div>}
        {!loading && couriers.length === 0 && (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--mv-ink-52)', fontSize: 13 }}>
            No carriers found. Add a courier routing rule first.
          </div>
        )}

        {!loading && couriers.length > 0 && (
          <>
            {/* Routing endpoints */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
              <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--mv-ink)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Queries Ingestion Email</label>
                <p style={{ fontSize: 11, color: 'var(--mv-ink-52)', margin: '0 0 8px' }}>For delays, missing scans, POD searches, etc.</p>
                <input type="email" value={form.queries_email ?? ''} onChange={e => set('queries_email', e.target.value)}
                  placeholder="queries@dpd.co.uk" style={{ ...taSt, minHeight: 0, padding: '8px 10px' }} />
              </div>
              <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--mv-ink)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claims Ingestion Email</label>
                <p style={{ fontSize: 11, color: 'var(--mv-ink-52)', margin: '0 0 8px' }}>Only targeted when manually hitting ‘Raise Formal Claim’.</p>
                <input type="email" value={form.claims_email ?? ''} onChange={e => set('claims_email', e.target.value)}
                  placeholder="claims@dpd.co.uk" style={{ ...taSt, minHeight: 0, padding: '8px 10px' }} />
              </div>
            </div>

            {/* Sample tracking numbers */}
            <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 18, marginBottom: 22 }}>
              <div className="mv-kicker">Format Detection</div>
              <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--mv-ink)', display: 'block', marginBottom: 4 }}>Sample Tracking Number(s)</label>
              <p style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', margin: '0 0 10px' }}>
                Paste one real tracking number per line. We learn the format automatically; anything non-matching triggers a customer request.
              </p>
              <textarea value={form.tracking_samples ?? ''} onChange={e => set('tracking_samples', e.target.value)}
                style={{ ...taSt, fontFamily: 'monospace', fontSize: 12 }} rows={3}
                placeholder={'9753172394\nJD0002345678901'} />
              {/* Live derived-shape preview */}
              {(form.tracking_samples ?? '').trim() && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--mv-ink-62)' }}>
                  {(form.tracking_samples).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).map((s, i) => (
                    <div key={i} style={{ marginTop: 3 }}>
                      <code style={{ background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', padding: '1px 6px' }}>{s}</code>
                      <span style={{ color: 'var(--mv-ink-52)' }}> → detected: </span>
                      <strong style={{ color: 'var(--mv-ink)' }}>{describeSample(s)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top-and-Tail boilerplate templates */}
            <div className="mv-kicker" style={{ marginBottom: 12 }}>
              Header &amp; Footer Boilerplate
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {FIELDS.map(f => (
                <div key={f.key} style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--mv-ink)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <p style={{ fontSize: 11, color: 'var(--mv-ink-52)', margin: '0 0 8px' }}>{f.hint}</p>
                  <textarea value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} style={taSt} rows={4} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
              <button onClick={save} disabled={saving} className="mv-btn-primary">
                {saving ? 'Saving…' : 'Save Templates'}
              </button>
              {saved && (
                <span className="mv-state mv-state--settled">
                  <span className="mv-mark mv-mark--settled" />
                  <span className="mv-state-label">Saved</span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
