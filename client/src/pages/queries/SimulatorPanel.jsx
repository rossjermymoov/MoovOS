/**
 * SimulatorPanel.jsx — Closed-Loop Testing Simulator (developer helper)
 *
 * Drive the courier automation loop against a ticket WITHOUT sending real email.
 * Pick a ticket, choose the simulated sender role + handle, type a body, and
 * execute — the backend runs the exact state-loop mechanics on the database so
 * you can watch Gemini's triage / translation and the drafts it produces.
 *
 *   import SimulatorPanel from './SimulatorPanel';
 *   <SimulatorPanel />
 */
import { useState } from 'react';

// Real-world quick-fill presets for risk-free testing.
const PRESETS = [
  {
    label: '📋 Preset: DPD Lost Investigation',
    role: 'courier',
    sender: 'investigations@dpd.co.uk',
    subject: 'DPD Lost Property Investigation — update',
    body:
      "Hope you're well. Thank you for providing us with the requested details. I have performed some pre-checks and can confirm that this parcel was not relabeled and was not returned to you under a different parcel number. I have also checked our lost property, but this parcel is not located there. As there is no progressive tracking over 24 hours, I have raised an investigation for this parcel, we would usually expect to provide an update within 3 working days, however it is taking a little longer to conclude this investigation. Our depot will initiate a search for this parcel with the sorting centre. Any updates on this investigation will be shared with you. Our depot will do all they can to locate the parcel and get this delivered to your customer. I appreciate your patience while we look into this further for you. Regards, Asiya - DPD Platinum Team",
  },
];

export default function SimulatorPanel() {
  const [ticket, setTicket] = useState('');
  const [role, setRole]     = useState('customer');
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('Parcel not delivered');
  const [body, setBody]     = useState('Hi, my DPD parcel 15504366834818 has not scanned in over a day. Please chase.');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  const applyPreset = (p) => {
    setRole(p.role);
    setSender(p.sender || '');
    setSubject(p.subject || '');
    setBody(p.body || '');
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (!ticket.trim()) { setError('Enter a ticket number or id'); return; }
    setRunning(true); setError(null); setResult(null);
    try {
      const r = await fetch(`/api/queries/${encodeURIComponent(ticket.trim())}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, sender, subject, body }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setResult(json);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  return (
    <div className="mv-page">
      <div className="mv-page-inner" style={{ maxWidth: 720 }}>
        <div className="mv-head">
          <div>
            <div className="mv-kicker">Developer Testing</div>
            <h1 className="mv-title">Automation Simulator</h1>
            <p className="mv-blurb">Run the courier loop against a ticket without dispatching real emails.</p>
          </div>
        </div>

        <div className="mv-rule" />

        <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 24 }}>
          {/* Quick-fill presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} className="mv-btn-ghost" style={{ fontSize: 12 }}>
                {p.label}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Ticket number or id</label>
          <input value={ticket} onChange={e => setTicket(e.target.value)} placeholder="e.g. 236"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: '8px 12px', fontSize: 13, color: 'var(--mv-ink)', marginBottom: 14 }} />

          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Simulated sender</label>
          <div style={{ display: 'inline-flex', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', padding: 2, marginBottom: 14 }}>
            {['customer', 'courier'].map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', border: 'none',
                  background: role === r ? 'var(--mv-purple)' : 'transparent',
                  color: role === r ? '#fff' : 'var(--mv-ink-52)',
                }}>
                {r}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Sender handle (optional)</label>
          <input value={sender} onChange={e => setSender(e.target.value)} placeholder="investigations@dpd.co.uk"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: '8px 12px', fontSize: 13, color: 'var(--mv-ink)', marginBottom: 14 }} />

          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: '8px 12px', fontSize: 13, color: 'var(--mv-ink)', marginBottom: 14 }} />

          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: '8px 12px', fontSize: 13, color: 'var(--mv-ink)', marginBottom: 18 }} />

          <button onClick={run} disabled={running} className="mv-btn-primary">
            {running ? 'Running…' : 'Submit Simulation'}
          </button>

          {error && <p style={{ marginTop: 14, background: 'rgba(233,30,140,0.08)', border: '1px solid var(--mv-magenta)', padding: '8px 12px', fontSize: 12.5, color: 'var(--mv-magenta-deep)' }}>{error}</p>}
          {result && (
            <pre style={{ marginTop: 16, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', padding: 12, fontSize: 12, color: 'var(--mv-ink)' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
