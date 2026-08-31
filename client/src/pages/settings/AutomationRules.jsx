/**
 * AutomationRules — /settings/automation-rules
 *
 * The single unified engine (replaces the old "SLA Rules Engine" + "SLA & Autopilot
 * Switchboard"). One ordered list of rules; first match wins.
 *   WHEN: subject/body contains · courier · query type/intent · customer tier
 *   THEN: set priority · SLA response & resolution mins · scream on breach · autopilot mode
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical, Save, Zap } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

const COURIERS = ['', 'dpd', 'dhl', 'evri', 'yodel', 'yodel_c2c', 'ups', 'parcelforce', 'royalmail', 'fedex'];
const TYPES    = ['', 'courier_chase', 'tracking', 'claim', 'billing', 'complaint', 'ticket_closure', 'other'];
const TIERS    = ['', 'bronze', 'silver', 'gold', 'platinum', 'enterprise'];
const PRIOS    = ['', 'urgent', 'high', 'medium', 'low'];
const MODES    = ['off', 'draft', 'full'];

const lbl = { fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' };
const inp = { width: '100%', boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, fontSize: 13, background: 'var(--mv-bg)', color: 'var(--mv-ink)', outline: 'none' };

function RuleCard({ rule, trustCap, onSave, onDelete }) {
  const [d, setD] = useState(rule);
  useEffect(() => setD(rule), [rule.id]);
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 18, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <GripVertical size={16} color="var(--mv-ink-45)" />
        <input value={d.name || ''} onChange={e => set('name', e.target.value)}
          style={{ ...inp, fontWeight: 700, fontSize: 14, flex: 1 }} placeholder="Rule name" />
        <label style={{ fontSize: 12, color: 'var(--mv-ink-52)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          Order
          <input type="number" value={d.position ?? 100} onChange={e => set('position', +e.target.value)}
            style={{ ...inp, width: 64 }} />
        </label>
        <label style={{ fontSize: 12, color: 'var(--mv-ink)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <input type="checkbox" checked={d.is_active !== false} onChange={e => set('is_active', e.target.checked)} />
          Active
        </label>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--mv-ink)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>WHEN <span style={{ color: 'var(--mv-ink-45)', fontWeight: 500, textTransform: 'none' }}>(all set conditions must match)</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={lbl}>Subject / body contains</label>
          <input value={d.cond_subject_contains || ''} onChange={e => set('cond_subject_contains', e.target.value)}
            style={inp} placeholder="e.g. on stop  (blank = any)" />
        </div>
        <div>
          <label style={lbl}>Courier</label>
          <select value={d.cond_courier_code || ''} onChange={e => set('cond_courier_code', e.target.value)} style={inp}>
            {COURIERS.map(c => <option key={c} value={c}>{c || 'Any courier'}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Query type / intent</label>
          <select value={d.cond_query_type || ''} onChange={e => set('cond_query_type', e.target.value)} style={inp}>
            {TYPES.map(t => <option key={t} value={t}>{t || 'Any type'}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Customer tier</label>
          <select value={d.cond_customer_tier || ''} onChange={e => set('cond_customer_tier', e.target.value)} style={inp}>
            {TIERS.map(t => <option key={t} value={t}>{t || 'Any tier'}</option>)}
          </select>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--mv-ink)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>THEN</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={lbl}>Set priority</label>
          <select value={d.set_priority || ''} onChange={e => set('set_priority', e.target.value)} style={inp}>
            {PRIOS.map(p => <option key={p} value={p}>{p || 'Leave as triaged'}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Response (mins)</label>
          <input type="number" value={d.response_minutes ?? ''} onChange={e => set('response_minutes', e.target.value === '' ? null : +e.target.value)}
            style={inp} placeholder="e.g. 120" />
        </div>
        <div>
          <label style={lbl}>Resolution (mins)</label>
          <input type="number" value={d.resolution_minutes ?? ''} onChange={e => set('resolution_minutes', e.target.value === '' ? null : +e.target.value)}
            style={inp} placeholder="e.g. 1440" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, alignItems: 'center' }}>
        <div>
          <label style={lbl}>Autopilot</label>
          <select value={d.autopilot_mode || 'draft'} onChange={e => set('autopilot_mode', e.target.value)} style={inp}>
            <option value="off">Off — no AI drafting</option>
            <option value="draft">Draft only — review in QA Bay</option>
            <option value="full">Full — auto-send (after trust earned)</option>
          </select>
        </div>
        <label style={{ fontSize: 12.5, color: 'var(--mv-ink)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, fontWeight: 600 }}>
          <input type="checkbox" checked={d.scream_to_google_chat !== false} onChange={e => set('scream_to_google_chat', e.target.checked)} />
          Escalate to Google Chat on breach
        </label>
      </div>

      {d.autopilot_mode === 'full' && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--mv-magenta-deep)', background: 'rgba(233,30,140,0.08)', border: '1px solid var(--mv-magenta)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} /> Full autopilot still only auto-sends once that courier + intent has earned {trustCap} clean approvals. Claims &amp; complaints never auto-send.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={() => onDelete(d.id)} className="mv-btn-ghost" style={{ padding: '6px 12px', fontSize: 12, color: 'var(--mv-magenta-deep)' }}>
          <Trash2 size={13} /> Delete
        </button>
        <button onClick={() => onSave(d)} className="mv-btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
          <Save size={13} /> Save Rule
        </button>
      </div>
    </div>
  );
}

export default function AutomationRules() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => api.get('/automation-rules').then(r => r.data),
  });

  const save = useMutation({
    mutationFn: (rule) => rule.id
      ? api.patch(`/automation-rules/${rule.id}`, rule).then(r => r.data)
      : api.post('/automation-rules', rule).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['automation-rules']),
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/automation-rules/${id}`),
    onSuccess: () => qc.invalidateQueries(['automation-rules']),
  });

  const addRule = () => save.mutate({
    name: 'New rule', position: 100, is_active: true,
    autopilot_mode: 'draft', scream_to_google_chat: true,
    response_minutes: 240, resolution_minutes: 1440,
  });

  const rules    = data?.rules || [];
  const trustCap = data?.trust_cap ?? 20;

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        <SettingsNav />

        <div className="mv-head">
          <div>
            <div className="mv-kicker">Settings &amp; Workflows</div>
            <h1 className="mv-title">Automation Rules</h1>
            <p className="mv-blurb">
              Ordered triage rules — the first rule whose conditions match a ticket sets its priority,
              SLA window, escalation route and autopilot behaviour.
            </p>
          </div>
          <div className="mv-actions">
            <button onClick={addRule} className="mv-btn-primary">
              <Plus size={14} /> Add Rule
            </button>
          </div>
        </div>

        <div className="mv-rule" />

        <div style={{ marginTop: 20 }}>
          {isLoading ? (
            <p style={{ color: 'var(--mv-ink-52)', fontSize: 13, textAlign: 'center', padding: 32 }}>Loading rules…</p>
          ) : rules.length === 0 ? (
            <p style={{ color: 'var(--mv-ink-52)', fontSize: 13, textAlign: 'center', padding: 32 }}>No rules yet — add your first one.</p>
          ) : (
            rules.map(r => (
              <RuleCard key={r.id} rule={r} trustCap={trustCap}
                onSave={(rule) => save.mutate(rule)} onDelete={(id) => del.mutate(id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
