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

const lbl = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block' };
const inp = { width: '100%', padding: '7px 9px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#fff' };

function RuleCard({ rule, trustCap, onSave, onDelete }) {
  const [d, setD] = useState(rule);
  useEffect(() => setD(rule), [rule.id]);
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <GripVertical size={16} color="#CBD5E1" />
        <input value={d.name || ''} onChange={e => set('name', e.target.value)}
          style={{ ...inp, fontWeight: 600, fontSize: 14, flex: 1 }} placeholder="Rule name" />
        <label style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
          Order
          <input type="number" value={d.position ?? 100} onChange={e => set('position', +e.target.value)}
            style={{ ...inp, width: 64 }} />
        </label>
        <label style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={d.is_active !== false} onChange={e => set('is_active', e.target.checked)} />
          Active
        </label>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>WHEN <span style={{ color: '#94A3B8', fontWeight: 500 }}>(all set conditions must match)</span></div>
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

      <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>THEN</div>
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
        <label style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <input type="checkbox" checked={d.scream_to_google_chat !== false} onChange={e => set('scream_to_google_chat', e.target.checked)} />
          Escalate to Google Chat on breach
        </label>
      </div>

      {d.autopilot_mode === 'full' && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#92400E', background: '#FEF3C7', borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} /> Full autopilot still only auto-sends once that courier + intent has earned {trustCap} clean approvals. Claims & complaints never auto-send.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={() => onDelete(d.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid #FECACA', background: '#fff', color: '#B91C1C', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Trash2 size={14} /> Delete
        </button>
        <button onClick={() => onSave(d)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', background: '#00C853', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Save size={14} /> Save
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
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SettingsNav />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Automation Rules</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, maxWidth: 620 }}>
            One ordered list — the first rule whose conditions match a ticket sets its priority,
            SLA window, escalation and autopilot behaviour. Drag order matters: lower order numbers run first.
          </p>
        </div>
        <button onClick={addRule}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 'none', background: '#0F172A', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Add rule
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {isLoading ? (
          <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading rules…</p>
        ) : rules.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: 14 }}>No rules yet — add your first one.</p>
        ) : (
          rules.map(r => (
            <RuleCard key={r.id} rule={r} trustCap={trustCap}
              onSave={(rule) => save.mutate(rule)} onDelete={(id) => del.mutate(id)} />
          ))
        )}
      </div>
    </div>
  );
}
