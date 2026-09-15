/**
 * RulesSettings  —  /settings/rules
 *
 * Freshdesk-style SLA engine, two layers:
 *   1. SLA Targets   — named policy profiles with a per-priority response/resolution grid.
 *   2. SLA Triggers  — IF (field/operator/value) THEN (set priority + link policy) rules,
 *                      evaluated on ticket ingest, highest weight first.
 */

import { useState, Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, X, ArrowRight, Zap, Target } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Settings sub-nav (shared across all Settings pages) ──────
export function SettingsNav() {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/settings/staff',                label: 'Staff' },
    { to: '/settings/automation-rules',     label: 'Automation Rules' },
    { to: '/settings/onboarding-templates', label: 'Onboarding Templates' },
    { to: '/settings/comms-templates',      label: 'Comms Templates' },
    { to: '/settings/volumetric',           label: 'Volumetric Weight' },
    { to: '/settings/billing',              label: 'Billing' },
    { to: '/settings/xero',                 label: 'Xero' },
    { to: '/settings/email',                label: 'Email' },
    { to: '/settings/gmail',                label: 'Gmail' },
  ];
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
      {tabs.map(t => {
        const active = pathname.startsWith(t.to);
        return (
          <NavLink
            key={t.to} to={t.to}
            style={{
              padding: '8px 22px', fontSize: 13, fontWeight: 600,
              color: active ? 'var(--mv-green)' : 'var(--mv-ink-52)',
              borderBottom: active ? '2px solid var(--mv-green)' : '2px solid transparent',
              textDecoration: 'none', transition: 'color 0.12s', marginBottom: -1,
            }}
          >
            {t.label}
          </NavLink>
        );
      })}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: 'var(--mv-magenta)', bg: 'var(--mv-magenta-100)', border: 'var(--mv-magenta-200)' },
  { value: 'high',   label: 'High',   color: 'var(--mv-amber-deep)', bg: 'var(--mv-amber-100)', border: 'var(--mv-amber-200)' },
  { value: 'medium', label: 'Medium', color: 'var(--mv-teal)', bg: 'var(--mv-teal-100)', border: 'var(--mv-teal-200)' },
  { value: 'low',    label: 'Low',    color: 'var(--mv-ink-52)', bg: 'var(--mv-bg)', border: 'var(--mv-hairline)' },
];
const PRI = Object.fromEntries(PRIORITIES.map(p => [p.value, p]));

const CONDITION_FIELDS = [
  { value: 'subject',       label: 'Subject' },
  { value: 'sender_email',  label: 'Sender Email' },
  { value: 'courier_code',  label: 'Courier Code' },
  { value: 'body_text',     label: 'Body Text' },
  { value: 'customer_tier', label: 'Customer Tier' },
];
const CUSTOMER_TIERS = [
  { value: 'bronze',     label: 'Bronze' },
  { value: 'silver',     label: 'Silver' },
  { value: 'gold',       label: 'Gold' },
  { value: 'enterprise', label: 'Enterprise' },
];
const OPERATORS = [
  { value: 'contains',    label: 'Contains' },
  { value: 'equals',      label: 'Equals' },
  { value: 'starts_with', label: 'Starts With' },
];
const lbl = (list, v) => list.find(x => x.value === v)?.label || v;

// ─── Shared styles ────────────────────────────────────────────
const inputSt = {
  width: '100%', boxSizing: 'border-box', background: 'var(--mv-surface)',
  border: '1px solid var(--mv-hairline)', borderRadius: 8, color: 'var(--mv-ink)',
  fontSize: 13, padding: '8px 11px', outline: 'none',
};
const labelSt = {
  fontSize: 10, color: 'var(--mv-ink-45)', display: 'block', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700,
};
const btnGreen = {
  background: 'var(--mv-green)', border: 'none', borderRadius: 8, color: 'var(--mv-on-brand)',
  padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
  gap: 6, fontSize: 13, fontWeight: 600,
};
const btnGhost = {
  background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline)', borderRadius: 8, color: 'var(--mv-ink-52)',
  padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
  gap: 5, fontSize: 12, fontWeight: 600,
};
const card = {
  background: 'var(--mv-surface)', border: '1px solid var(--mv-divider)', borderRadius: 14,
  boxShadow: '0 1px 2px color-mix(in srgb, var(--mv-ink) 4%, transparent)', marginBottom: 16,
};

// ─── Active / inactive pill ───────────────────────────────────
function ActivePill({ active, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      background: active ? 'var(--mv-purple-100)' : 'var(--mv-bg)',
      border: `1px solid ${active ? 'var(--mv-purple-200)' : 'var(--mv-hairline)'}`,
      borderRadius: 20, color: active ? 'var(--mv-green-deep)' : 'var(--mv-ink-45)',
      fontSize: 11, fontWeight: 700, padding: '3px 11px', cursor: 'pointer',
    }}>
      {active ? '● Active' : '○ Off'}
    </button>
  );
}

function PriBadge({ priority }) {
  const p = PRI[priority] || PRI.medium;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: p.color, background: p.bg,
      border: `1px solid ${p.border}`, borderRadius: 6, padding: '2px 9px', textTransform: 'capitalize' }}>
      {p.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SLA Target (Policy) profile form
// ═══════════════════════════════════════════════════════════════
function blankTargets(initial = []) {
  const map = Object.fromEntries((initial || []).map(t => [t.priority, t]));
  return Object.fromEntries(PRIORITIES.map(p => [p.value, {
    response_hours:   map[p.value]?.response_hours   ?? '',
    resolution_hours: map[p.value]?.resolution_hours ?? '',
  }]));
}

function PolicyForm({ initial = {}, onSave, onCancel, saving }) {
  const [name, setName]       = useState(initial.name || '');
  const [desc, setDesc]       = useState(initial.description || '');
  const [grid, setGrid]       = useState(blankTargets(initial.targets));
  const setCell = (pri, key, v) => setGrid(g => ({ ...g, [pri]: { ...g[pri], [key]: v } }));

  function submit() {
    const targets = PRIORITIES.map(p => ({
      priority: p.value,
      response_hours:   grid[p.value].response_hours,
      resolution_hours: grid[p.value].resolution_hours,
    }));
    onSave({ name, description: desc, targets });
  }

  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 18 }}>
        <div>
          <label style={labelSt}>Policy Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DPD Claims Policy" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Description</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="When this profile should apply…" style={inputSt} />
        </div>
      </div>

      {/* Per-priority target grid */}
      <label style={labelSt}>Targets by Priority (hours)</label>
      <div style={{ border: '1px solid var(--mv-hairline)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', background: 'var(--mv-bg)',
          fontSize: 10, fontWeight: 700, color: 'var(--mv-ink-45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <div style={{ padding: '9px 14px' }}>Priority</div>
          <div style={{ padding: '9px 14px' }}>Response (h)</div>
          <div style={{ padding: '9px 14px' }}>Resolution (h)</div>
        </div>
        {PRIORITIES.map((p, i) => (
          <div key={p.value} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr',
            alignItems: 'center', borderTop: i ? '1px solid var(--mv-hairline)' : 'none' }}>
            <div style={{ padding: '9px 14px' }}><PriBadge priority={p.value} /></div>
            <div style={{ padding: '7px 14px' }}>
              <input type="number" min="0" value={grid[p.value].response_hours}
                onChange={e => setCell(p.value, 'response_hours', e.target.value)}
                placeholder="—" style={{ ...inputSt, padding: '6px 9px' }} />
            </div>
            <div style={{ padding: '7px 14px' }}>
              <input type="number" min="0" value={grid[p.value].resolution_hours}
                onChange={e => setCell(p.value, 'resolution_hours', e.target.value)}
                placeholder="—" style={{ ...inputSt, padding: '6px 9px' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnGhost}><X size={14} /> Cancel</button>
        <button onClick={submit} disabled={saving || !name.trim()} style={{ ...btnGreen, opacity: (!name.trim() || saving) ? 0.5 : 1 }}>
          {saving ? 'Saving…' : <><Check size={14} /> Save Policy</>}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SLA Trigger (IF / THEN) builder
// ═══════════════════════════════════════════════════════════════
function TriggerForm({ initial = {}, policies = [], onSave, onCancel, saving }) {
  const [f, setF] = useState({
    name:            initial.name            || '',
    condition_field: initial.condition_field || 'subject',
    operator:        initial.operator        || 'contains',
    match_value:     initial.match_value     || '',
    set_priority:    initial.set_priority     || 'urgent',
    policy_id:       initial.policy_id        || '',
    priority:        initial.priority        ?? 0,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isTier = f.condition_field === 'customer_tier';
  const valid = f.name.trim() && f.match_value.trim();

  // Switching to/from Customer Tier swaps the free-text value for a bounded list.
  function changeCondition(v) {
    setF(p => {
      const next = { ...p, condition_field: v };
      if (v === 'customer_tier') {
        next.operator = 'equals';
        if (!CUSTOMER_TIERS.some(t => t.value === p.match_value)) next.match_value = 'bronze';
      } else if (p.condition_field === 'customer_tier') {
        next.match_value = '';
      }
      return next;
    });
  }

  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 14, marginBottom: 18 }}>
        <div>
          <label style={labelSt}>Trigger Name *</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. P1 escalation" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Weight</label>
          <input type="number" min="0" value={f.priority} onChange={e => set('priority', e.target.value)} style={inputSt} title="Higher weight is evaluated first" />
        </div>
      </div>

      {/* IF — match criteria */}
      <div style={{ background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-teal)', background: 'var(--mv-teal-100)',
            border: '1px solid var(--mv-teal-200)', borderRadius: 6, padding: '2px 8px', letterSpacing: '0.08em' }}>IF</span>
          <span style={{ fontSize: 12, color: 'var(--mv-ink-52)', fontWeight: 600 }}>incoming email matches…</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 12 }}>
          <div>
            <label style={labelSt}>Condition</label>
            <select value={f.condition_field} onChange={e => changeCondition(e.target.value)} style={inputSt}>
              {CONDITION_FIELDS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>Operator</label>
            <select value={f.operator} onChange={e => set('operator', e.target.value)} style={inputSt}>
              {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>Value *</label>
            {isTier ? (
              <select value={f.match_value || 'bronze'} onChange={e => set('match_value', e.target.value)} style={inputSt}>
                {CUSTOMER_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            ) : (
              <input value={f.match_value} onChange={e => set('match_value', e.target.value)} placeholder="P1 · claims · @dpd.co.uk" style={inputSt} />
            )}
          </div>
        </div>
      </div>

      {/* THEN — actions */}
      <div style={{ background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-green-deep)', background: 'var(--mv-purple-100)',
            border: '1px solid var(--mv-purple-200)', borderRadius: 6, padding: '2px 8px', letterSpacing: '0.08em' }}>THEN</span>
          <span style={{ fontSize: 12, color: 'var(--mv-ink-52)', fontWeight: 600 }}>apply these actions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelSt}>Set Priority</label>
            <select value={f.set_priority} onChange={e => set('set_priority', e.target.value)} style={inputSt}>
              <option value="">— Leave unchanged —</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>Link to Policy</label>
            <select value={f.policy_id} onChange={e => set('policy_id', e.target.value)} style={inputSt}>
              <option value="">— No SLA clock —</option>
              {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnGhost}><X size={14} /> Cancel</button>
        <button onClick={() => onSave(f)} disabled={saving || !valid} style={{ ...btnGreen, opacity: (!valid || saving) ? 0.5 : 1 }}>
          {saving ? 'Saving…' : <><Check size={14} /> Save Trigger</>}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Main page
// ═══════════════════════════════════════════════════════════════
export default function RulesSettings() {
  const qc = useQueryClient();
  const [showPolForm,  setShowPolForm]  = useState(false);
  const [showTrigForm, setShowTrigForm] = useState(false);
  const [editPolId,    setEditPolId]    = useState(null);
  const [editTrigId,   setEditTrigId]   = useState(null);

  const { data: policies = [], isLoading: polLoad } = useQuery({
    queryKey: ['sla-policies'], queryFn: () => api.get('/sla/policies').then(r => r.data),
  });
  const { data: triggers = [], isLoading: trigLoad } = useQuery({
    queryKey: ['sla-rules'], queryFn: () => api.get('/sla/rules').then(r => r.data),
  });

  const inv = (...keys) => ({ onSuccess: () => keys.forEach(k => qc.invalidateQueries([k])) });
  const createPol  = useMutation({ mutationFn: d => api.post('/sla/policies', d).then(r => r.data), ...inv('sla-policies') });
  const updatePol  = useMutation({ mutationFn: ({ id, ...d }) => api.patch(`/sla/policies/${id}`, d).then(r => r.data), ...inv('sla-policies') });
  const deletePol  = useMutation({ mutationFn: id => api.delete(`/sla/policies/${id}`).then(r => r.data), ...inv('sla-policies', 'sla-rules') });
  const createTrig = useMutation({ mutationFn: d => api.post('/sla/rules', d).then(r => r.data), ...inv('sla-rules') });
  const updateTrig = useMutation({ mutationFn: ({ id, ...d }) => api.patch(`/sla/rules/${id}`, d).then(r => r.data), ...inv('sla-rules') });
  const deleteTrig = useMutation({ mutationFn: id => api.delete(`/sla/rules/${id}`).then(r => r.data), ...inv('sla-rules') });

  async function savePolicy(form, id) {
    if (id) await updatePol.mutateAsync({ id, ...form });
    else    await createPol.mutateAsync(form);
    setShowPolForm(false); setEditPolId(null);
  }
  async function saveTrigger(form, id) {
    const payload = { ...form, priority: parseInt(form.priority) || 0, set_priority: form.set_priority || null, policy_id: form.policy_id || null };
    if (id) await updateTrig.mutateAsync({ id, ...payload });
    else    await createTrig.mutateAsync(payload);
    setShowTrigForm(false); setEditTrigId(null);
  }

  const hdr = { fontSize: 12.5, fontWeight: 700, color: 'var(--mv-ink-45)', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <SettingsNav />

      {/* ═══ SLA TARGETS ═══════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--mv-teal-100)', border: '1px solid var(--mv-teal-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Target size={18} color="var(--mv-teal)" />
          </div>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--mv-ink)', margin: 0 }}>SLA Targets</h2>
            <p style={{ fontSize: 12.5, color: 'var(--mv-ink-52)', marginTop: 4, maxWidth: 620, lineHeight: 1.5 }}>
              Named SLA profiles. Each profile sets response and resolution time targets across the four priorities.
            </p>
          </div>
        </div>
        <button onClick={() => { setShowPolForm(v => !v); setEditPolId(null); }} style={btnGreen}>
          <Plus size={15} /> New Policy
        </button>
      </div>

      {showPolForm && !editPolId && (
        <div style={{ ...card, border: '1px solid var(--mv-teal-200)' }}>
          <PolicyForm onSave={form => savePolicy(form, null)} onCancel={() => setShowPolForm(false)} saving={createPol.isPending} />
        </div>
      )}

      {polLoad && <div style={{ ...card, padding: 28, textAlign: 'center', color: 'var(--mv-ink-45)', fontSize: 13 }}>Loading policies…</div>}
      {!polLoad && policies.length === 0 && (
        <div style={{ ...card, padding: 28, textAlign: 'center', color: 'var(--mv-ink-45)', fontSize: 13 }}>
          No SLA targets yet. Click <strong>New Policy</strong> to create your first profile.
        </div>
      )}

      {policies.map(p => (
        <div key={p.id} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: editPolId === p.id ? '1px solid var(--mv-hairline)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--mv-ink)' }}>{p.name}</span>
              {p.description && <span style={{ fontSize: 12, color: 'var(--mv-ink-45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <ActivePill active={p.is_active} onToggle={() => updatePol.mutate({ id: p.id, is_active: !p.is_active })} />
              <button onClick={() => { setEditPolId(id => id === p.id ? null : p.id); setShowPolForm(false); }} style={btnGhost}>
                {editPolId === p.id ? 'Close' : 'Edit'}
              </button>
              <button onClick={() => { if (window.confirm(`Delete policy "${p.name}"? Triggers linked to it will lose their SLA clock.`)) deletePol.mutate(p.id); }}
                style={{ background: 'none', border: 'none', color: 'var(--mv-magenta)', cursor: 'pointer', padding: 4 }}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {editPolId === p.id ? (
            <PolicyForm initial={p} onSave={form => savePolicy(form, p.id)} onCancel={() => setEditPolId(null)} saving={updatePol.isPending} />
          ) : (
            // Compact read-only grid summary
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, padding: '4px 18px 16px' }}>
              {PRIORITIES.map(pr => {
                const t = (p.targets || []).find(x => x.priority === pr.value) || {};
                return (
                  <div key={pr.value} style={{ padding: '10px 12px', borderRight: pr.value !== 'low' ? '1px solid var(--mv-hairline)' : 'none' }}>
                    <PriBadge priority={pr.value} />
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--mv-ink-62)' }}>
                      <div>Response: <strong style={{ color: 'var(--mv-ink)' }}>{t.response_hours != null ? `${t.response_hours}h` : '—'}</strong></div>
                      <div style={{ marginTop: 2 }}>Resolution: <strong style={{ color: 'var(--mv-ink)' }}>{t.resolution_hours != null ? `${t.resolution_hours}h` : '—'}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* ═══ SLA TRIGGERS ══════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', margin: '38px 0 16px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--mv-amber-100)', border: '1px solid var(--mv-amber-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="var(--mv-amber)" />
          </div>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--mv-ink)', margin: 0 }}>SLA Triggers</h2>
            <p style={{ fontSize: 12.5, color: 'var(--mv-ink-52)', marginTop: 4, maxWidth: 620, lineHeight: 1.5 }}>
              IF / THEN routing rules. On ingest, triggers run highest-weight first; the first match sets the ticket priority and starts the linked policy's SLA clock.
            </p>
          </div>
        </div>
        <button onClick={() => { setShowTrigForm(v => !v); setEditTrigId(null); }} style={btnGreen}>
          <Plus size={15} /> New Trigger
        </button>
      </div>

      {showTrigForm && !editTrigId && (
        <div style={{ ...card, border: '1px solid var(--mv-amber-200)' }}>
          <TriggerForm policies={policies} onSave={form => saveTrigger(form, null)} onCancel={() => setShowTrigForm(false)} saving={createTrig.isPending} />
        </div>
      )}

      {trigLoad && <div style={{ ...card, padding: 28, textAlign: 'center', color: 'var(--mv-ink-45)', fontSize: 13 }}>Loading triggers…</div>}
      {!trigLoad && triggers.length === 0 && (
        <div style={{ ...card, padding: 28, textAlign: 'center', color: 'var(--mv-ink-45)', fontSize: 13 }}>
          No triggers yet. Create one to auto-route incoming tickets by subject, sender, courier or body text.
        </div>
      )}

      {triggers.map(t => (
        <div key={t.id} style={card}>
          {editTrigId === t.id ? (
            <TriggerForm initial={t} policies={policies} onSave={form => saveTrigger(form, t.id)} onCancel={() => setEditTrigId(null)} saving={updateTrig.isPending} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--mv-ink-52)', background: 'var(--mv-bg)', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }} title="Execution weight">
                {t.priority}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mv-ink)', marginBottom: 6 }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--mv-ink-62)' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--mv-teal)', background: 'var(--mv-teal-100)', border: '1px solid var(--mv-teal-200)', borderRadius: 5, padding: '1px 6px' }}>IF</span>
                  <span><strong style={{ color: 'var(--mv-ink)' }}>{lbl(CONDITION_FIELDS, t.condition_field)}</strong> {lbl(OPERATORS, t.operator)?.toLowerCase()} </span>
                  <code style={{ fontSize: 11.5, color: 'var(--mv-ink)', background: 'var(--mv-bg)', padding: '2px 7px', borderRadius: 5 }}>{t.match_value}</code>
                  <ArrowRight size={13} color="var(--mv-ink-45)" />
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--mv-green-deep)', background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)', borderRadius: 5, padding: '1px 6px' }}>THEN</span>
                  {t.set_priority && <PriBadge priority={t.set_priority} />}
                  {t.policy_name && <span>SLA: <strong style={{ color: 'var(--mv-amber-deep)' }}>{t.policy_name}</strong></span>}
                  {!t.set_priority && !t.policy_name && <span style={{ color: 'var(--mv-ink-45)' }}>no action</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <ActivePill active={t.is_active} onToggle={() => updateTrig.mutate({ id: t.id, is_active: !t.is_active })} />
                <button onClick={() => { setEditTrigId(id => id === t.id ? null : t.id); setShowTrigForm(false); }} style={btnGhost}>Edit</button>
                <button onClick={() => { if (window.confirm(`Delete trigger "${t.name}"?`)) deleteTrig.mutate(t.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--mv-magenta)', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
