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
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Automation Simulator</h2>
      <p className="mb-4 text-sm text-slate-500">Run the courier loop against a ticket — no real email is sent.</p>

      {/* Quick-fill presets */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">
            {p.label}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-500">Ticket number or id</label>
      <input value={ticket} onChange={e => setTicket(e.target.value)} placeholder="e.g. 236"
        className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

      <label className="mb-1 block text-xs font-medium text-slate-500">Simulated sender</label>
      <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-1">
        {['customer', 'courier'].map(r => (
          <button key={r} onClick={() => setRole(r)}
            className={`rounded-md px-3 py-1 text-sm font-medium capitalize ${role === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {r}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-500">Sender handle (optional)</label>
      <input value={sender} onChange={e => setSender(e.target.value)} placeholder="investigations@dpd.co.uk"
        className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

      <label className="mb-1 block text-xs font-medium text-slate-500">Subject</label>
      <input value={subject} onChange={e => setSubject(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

      <label className="mb-1 block text-xs font-medium text-slate-500">Body</label>
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
        className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

      <button onClick={run} disabled={running}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {running ? 'Running…' : 'Submit Simulation'}
      </button>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {result && (
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
