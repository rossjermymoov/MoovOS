/**
 * RulesSettings  —  /settings/rules
 *
 * Manage SLA Policies and SLA Rules.
 * Policies define SLA hours per courier/query-type.
 * Rules override default matching by keyword, courier, or type.
 */

import { useState, Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, X } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Settings sub-nav (shared with StaffSettings) ─────────────
export function SettingsNav() {
  const { pathname } = useLocation();
  const isRules = pathname.includes('/rules');
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {[
        { to: '/settings/staff', label: 'Staff',            active: !isRules },
        { to: '/settings/rules', label: 'SLA Rules Engine', active: isRules  },
      ].map(t => (
        <NavLink
          key={t.to} to={t.to}
          style={{
            padding: '8px 22px', fontSize: 13, fontWeight: 600,
            color: t.active ? '#00C853' : '#AAAAAA',
            borderBottom: t.active ? '2px solid #00C853' : '2px solid transparent',
            textDecoration: 'none', transition: 'color 0.12s',
            marginBottom: -1,
          }}
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────
const QUERY_TYPES = [
  { value: '',               label: '— Any query type —' },
  { value: 'whereabouts',   label: 'Whereabouts (WISMO)' },
  { value: 'not_delivered', label: 'Not Delivered' },
  { value: 'damaged',       label: 'Damaged' },
  { value: 'missing_items', label: 'Missing Items' },
  { value: 'failed_delivery',label:'Failed Delivery' },
  { value: 'returned',      label: 'Returned' },
  { value: 'delay',         label: 'Delay' },
  { value: 'claim',         label: 'Claim' },
  { value: 'other',         label: 'Other' },
];

const CONDITION_TYPES = [
  { value: 'keyword',    label: 'Subject contains keyword' },
  { value: 'query_type', label: 'Query type equals' },
  { value: 'courier',    label: 'Courier code equals' },
  { value: 'status',     label: 'Status equals' },
];

// ─── Shared styles ────────────────────────────────────────────
const inputSt = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, color: '#E6EDF3', fontSize: 12,
  padding: '7px 10px', outline: 'none',
};
const btnGreen = {
  background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)',
  borderRadius: 6, color: '#00C853', padding: '7px 10px', cursor: 'pointer',
  display: 'flex', alignItems: 'center',
};
const btnGhost = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6, color: '#AAAAAA', padding: '6px 12px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', fontSize: 11,
};

const thSt = {
  padding: '8px 14px', fontSize: 10, fontWeight: 700,
  color: '#7D8590', textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left',
};
const tdSt = {
  padding: '10px 14px', fontSize: 12, color: '#C9D1D9',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

// ─── Policy inline form ───────────────────────────────────────
function PolicyForm({ initial = {}, onSave, onCancel, saving }) {
  const [f, setF] = useState({
    name:           initial.name           || '',
    courier_code:   initial.courier_code   || '',
    query_type:     initial.query_type     || '',
    duration_hours: initial.duration_hours ?? '',
    priority:       initial.priority       ?? 0,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 90px 80px auto', gap: 10, alignItems: 'end', padding: '14px 0 4px' }}>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Policy Name *</label>
        <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. DPD Claim SLA" style={inputSt} />
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Courier Code</label>
        <input value={f.courier_code} onChange={e => set('courier_code', e.target.value.toLowerCase())} placeholder="dpd" style={inputSt} />
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Query Type</label>
        <select value={f.query_type} onChange={e => set('query_type', e.target.value)} style={inputSt}>
          {QUERY_TYPES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hours *</label>
        <input type="number" value={f.duration_hours} onChange={e => set('duration_hours', e.target.value)} placeholder="4" style={inputSt} min="1" />
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</label>
        <input type="number" value={f.priority} onChange={e => set('priority', e.target.value)} placeholder="0" style={inputSt} min="0" />
      </div>
      <div style={{ display: 'flex', gap: 6, paddingTop: 18 }}>
        <button onClick={() => onSave(f)} disabled={saving} style={btnGreen}>{saving ? '…' : <Check size={13} />}</button>
        <button onClick={onCancel} style={{ ...btnGhost, padding: '7px 10px' }}><X size={13} /></button>
      </div>
    </div>
  );
}

// ─── Rule inline form ─────────────────────────────────────────
function RuleForm({ initial = {}, policies = [], onSave, onCancel, saving }) {
  const [f, setF] = useState({
    name:            initial.name            || '',
    condition_type:  initial.condition_type  || 'query_type',
    condition_value: initial.condition_value || '',
    policy_id:       initial.policy_id       || (policies[0]?.id ?? ''),
    priority:        initial.priority        ?? 0,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 140px 1fr 80px auto', gap: 10, alignItems: 'end', padding: '14px 0 4px' }}>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rule Name *</label>
        <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Urgent keyword override" style={inputSt} />
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Condition Type</label>
        <select value={f.condition_type} onChange={e => set('condition_type', e.target.value)} style={inputSt}>
          {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Match Value *</label>
        <input value={f.condition_value} onChange={e => set('condition_value', e.target.value)} placeholder="urgent" style={inputSt} />
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Apply Policy</label>
        <select value={f.policy_id} onChange={e => set('policy_id', e.target.value)} style={inputSt}>
          {policies.map(p => <option key={p.id} value={p.id}>{p.name} ({p.duration_hours}h)</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 10, color: '#7D8590', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</label>
        <input type="number" value={f.priority} onChange={e => set('priority', e.target.value)} style={inputSt} min="0" />
      </div>
      <div style={{ display: 'flex', gap: 6, paddingTop: 18 }}>
        <button onClick={() => onSave(f)} disabled={saving} style={btnGreen}>{saving ? '…' : <Check size={13} />}</button>
        <button onClick={onCancel} style={{ ...btnGhost, padding: '7px 10px' }}><X size={13} /></button>
      </div>
    </div>
  );
}

// ─── Active/Inactive toggle pill ──────────────────────────────
function ActivePill({ active, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      background: active ? 'rgba(0,200,83,0.12)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: 5, color: active ? '#00C853' : '#7D8590',
      fontSize: 11, fontWeight: 700, padding: '2px 9px', cursor: 'pointer',
    }}>
      {active ? '● Active' : '○ Off'}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function RulesSettings() {
  const qc = useQueryClient();
  const [showPolForm,  setShowPolForm]  = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editPolId,    setEditPolId]    = useState(null);
  const [editRuleId,   setEditRuleId]   = useState(null);

  const { data: policies = [], isLoading: polLoad } = useQuery({
    queryKey: ['sla-policies'],
    queryFn:  () => api.get('/sla/policies').then(r => r.data),
  });

  const { data: rules = [], isLoading: ruleLoad } = useQuery({
    queryKey: ['sla-rules'],
    queryFn:  () => api.get('/sla/rules').then(r => r.data),
  });

  const inv = (...keys) => ({ onSuccess: () => keys.forEach(k => qc.invalidateQueries([k])) });

  const createPol  = useMutation({ mutationFn: d => api.post('/sla/policies', d).then(r => r.data), ...inv('sla-policies') });
  const updatePol  = useMutation({ mutationFn: ({ id, ...d }) => api.patch(`/sla/policies/${id}`, d).then(r => r.data), ...inv('sla-policies') });
  const deletePol  = useMutation({ mutationFn: id => api.delete(`/sla/policies/${id}`).then(r => r.data), ...inv('sla-policies', 'sla-rules') });
  const createRule = useMutation({ mutationFn: d => api.post('/sla/rules', d).then(r => r.data), ...inv('sla-rules') });
  const updateRule = useMutation({ mutationFn: ({ id, ...d }) => api.patch(`/sla/rules/${id}`, d).then(r => r.data), ...inv('sla-rules') });
  const deleteRule = useMutation({ mutationFn: id => api.delete(`/sla/rules/${id}`).then(r => r.data), ...inv('sla-rules') });

  async function savePolicy(form, id) {
    const payload = {
      name:           form.name,
      courier_code:   form.courier_code   || null,
      query_type:     form.query_type     || null,
      duration_hours: parseInt(form.duration_hours),
      priority:       parseInt(form.priority) || 0,
    };
    if (id) await updatePol.mutateAsync({ id, ...payload });
    else    await createPol.mutateAsync(payload);
    setShowPolForm(false);
    setEditPolId(null);
  }

  async function saveRule(form, id) {
    const payload = { ...form, priority: parseInt(form.priority) || 0 };
    if (id) await updateRule.mutateAsync({ id, ...payload });
    else    await createRule.mutateAsync(payload);
    setShowRuleForm(false);
    setEditRuleId(null);
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <SettingsNav />

      {/* ── SLA Policies ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#00C853', margin: 0 }}>SLA Policies</h2>
          <p style={{ fontSize: 12, color: '#7D8590', marginTop: 5 }}>
            Define SLA targets per courier and/or query type. The highest-priority matching policy is applied when a ticket is created.
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setShowPolForm(f => !f); setEditPolId(null); }}>
          <Plus size={13} /> New Policy
        </button>
      </div>

      {showPolForm && !editPolId && (
        <div className="moov-card" style={{ padding: '4px 16px 16px', marginBottom: 12, border: '1px solid rgba(0,200,83,0.25)' }}>
          <PolicyForm
            onSave={form => savePolicy(form, null)}
            onCancel={() => setShowPolForm(false)}
            saving={createPol.isPending}
          />
        </div>
      )}

      <div className="moov-card" style={{ overflow: 'hidden', marginBottom: 36 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thSt}>Name</th>
              <th style={thSt}>Courier</th>
              <th style={thSt}>Query Type</th>
              <th style={thSt}>SLA Hours</th>
              <th style={thSt}>Priority</th>
              <th style={thSt}>Status</th>
              <th style={thSt}></th>
            </tr>
          </thead>
          <tbody>
            {polLoad && (
              <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', color: '#7D8590', padding: 32 }}>Loading…</td></tr>
            )}
            {!polLoad && policies.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', color: '#7D8590', padding: 32 }}>No policies yet. Click New Policy to add one.</td></tr>
            )}
            {policies.map(p => (
              <Fragment key={p.id}>
                <tr>
                  <td style={{ ...tdSt, fontWeight: 600, color: '#E6EDF3' }}>{p.name}</td>
                  <td style={tdSt}>
                    {p.courier_code
                      ? <code style={{ fontSize: 11, color: '#00BCD4', background: 'rgba(0,188,212,0.1)', padding: '2px 6px', borderRadius: 4 }}>{p.courier_code.toUpperCase()}</code>
                      : <span style={{ color: '#7D8590' }}>Any</span>}
                  </td>
                  <td style={tdSt}>
                    {p.query_type
                      ? <span style={{ textTransform: 'capitalize' }}>{p.query_type.replace(/_/g, ' ')}</span>
                      : <span style={{ color: '#7D8590' }}>Any</span>}
                  </td>
                  <td style={{ ...tdSt, fontWeight: 700, color: '#D29922' }}>{p.duration_hours}h</td>
                  <td style={{ ...tdSt, color: '#7D8590' }}>{p.priority}</td>
                  <td style={tdSt}>
                    <ActivePill active={p.is_active} onToggle={() => updatePol.mutate({ id: p.id, is_active: !p.is_active })} />
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditPolId(id => id === p.id ? null : p.id)} style={btnGhost}>
                        {editPolId === p.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete policy "${p.name}"? Any rules using it will also be removed.`)) deletePol.mutate(p.id); }}
                        style={{ background: 'none', border: 'none', color: 'rgba(248,81,73,0.6)', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
                {editPolId === p.id && (
                  <tr>
                    <td colSpan={7} style={{ background: 'rgba(0,200,83,0.03)', padding: '4px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <PolicyForm
                        initial={p}
                        onSave={form => savePolicy(form, p.id)}
                        onCancel={() => setEditPolId(null)}
                        saving={updatePol.isPending}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── SLA Rules ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#00C853', margin: 0 }}>SLA Rules</h2>
          <p style={{ fontSize: 12, color: '#7D8590', marginTop: 5 }}>
            Rules override default policy matching. When a ticket is created, the highest-priority matching rule sets the SLA clock.
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setShowRuleForm(f => !f); setEditRuleId(null); }} disabled={policies.length === 0}>
          <Plus size={13} /> New Rule
        </button>
      </div>

      {policies.length === 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.3)', borderRadius: 8, fontSize: 12, color: '#D29922', marginBottom: 16 }}>
          Create at least one SLA Policy before adding rules.
        </div>
      )}

      {showRuleForm && !editRuleId && policies.length > 0 && (
        <div className="moov-card" style={{ padding: '4px 16px 16px', marginBottom: 12, border: '1px solid rgba(0,200,83,0.25)' }}>
          <RuleForm
            policies={policies}
            onSave={form => saveRule(form, null)}
            onCancel={() => setShowRuleForm(false)}
            saving={createRule.isPending}
          />
        </div>
      )}

      <div className="moov-card" style={{ overflow: 'hidden', marginBottom: 40 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thSt}>Rule Name</th>
              <th style={thSt}>Condition</th>
              <th style={thSt}>Match Value</th>
              <th style={thSt}>Applies Policy</th>
              <th style={thSt}>Priority</th>
              <th style={thSt}>Status</th>
              <th style={thSt}></th>
            </tr>
          </thead>
          <tbody>
            {ruleLoad && (
              <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', color: '#7D8590', padding: 32 }}>Loading…</td></tr>
            )}
            {!ruleLoad && rules.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', color: '#7D8590', padding: 32 }}>No rules yet. Rules let you override default SLA matching based on keyword, courier, or query type.</td></tr>
            )}
            {rules.map(r => (
              <Fragment key={r.id}>
                <tr>
                  <td style={{ ...tdSt, fontWeight: 600, color: '#E6EDF3' }}>{r.name}</td>
                  <td style={{ ...tdSt, color: '#7D8590' }}>
                    {CONDITION_TYPES.find(c => c.value === r.condition_type)?.label || r.condition_type}
                  </td>
                  <td style={tdSt}>
                    <code style={{ fontSize: 11, color: '#58A6FF', background: 'rgba(88,166,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                      {r.condition_value}
                    </code>
                  </td>
                  <td style={tdSt}>
                    <span style={{ color: '#D29922', fontWeight: 600 }}>{r.policy_name}</span>
                    <span style={{ color: '#7D8590', fontSize: 11 }}> ({r.policy_hours}h)</span>
                  </td>
                  <td style={{ ...tdSt, color: '#7D8590' }}>{r.priority}</td>
                  <td style={tdSt}>
                    <ActivePill active={r.is_active} onToggle={() => updateRule.mutate({ id: r.id, is_active: !r.is_active })} />
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditRuleId(id => id === r.id ? null : r.id)} style={btnGhost}>
                        {editRuleId === r.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete rule "${r.name}"?`)) deleteRule.mutate(r.id); }}
                        style={{ background: 'none', border: 'none', color: 'rgba(248,81,73,0.6)', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
                {editRuleId === r.id && (
                  <tr>
                    <td colSpan={7} style={{ background: 'rgba(0,200,83,0.03)', padding: '4px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <RuleForm
                        initial={r}
                        policies={policies}
                        onSave={form => saveRule(form, r.id)}
                        onCancel={() => setEditRuleId(null)}
                        saving={updateRule.isPending}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
