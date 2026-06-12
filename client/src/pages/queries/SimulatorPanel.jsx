/**
 * SimulatorPanel.jsx — Closed-Loop Testing Simulator (developer helper)
 *
 * Drop this anywhere (e.g. a dev/settings route) to drive the courier automation
 * loop against a ticket WITHOUT sending real email. Pick a ticket, choose the
 * simulated sender role, type a body, and execute — the backend runs the exact
 * state-loop mechanics on the database so you can watch Gemini's triage and the
 * drafts/SLA it produces.
 *
 *   import SimulatorPanel from './SimulatorPanel';
 *   <SimulatorPanel />
 */
import { useState } from 'react';

export default function SimulatorPanel() {
  const [ticket, setTicket] = useState('');
  const [role, setRole]     = useState('customer');
  const [subject, setSubject] = useState('Parcel not delivered');
  const [body, setBody]     = useState('Hi, my DPD parcel 15504366834818 has not scanned in over a day. Please chase.');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  const run = async () => {
    if (!ticket.trim()) { setError('Enter a ticket number or id'); return; }
    setRunning(true); setError(null); setResult(null);
    try {
      const r = await fetch(`/api/queries/${encodeURIComponent(ticket.trim())}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, subject, body }),
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

      <label className="mb-1 block text-xs font-medium text-slate-500">Subject</label>
      <input value={subject} onChange={e => setSubject(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

      <label className="mb-1 block text-xs font-medium text-slate-500">Body</label>
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
        className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

      <button onClick={run} disabled={running}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {running ? 'Running…' : 'Execute loop'}
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
