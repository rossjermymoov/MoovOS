/**
 * VolumetricSettings  —  /settings/volumetric
 *
 * Manage named volumetric weight rules (name + divisor).
 * Each rule can be assigned to one or more courier services.
 *
 * The pricing engine checks: if volumetric weight > actual weight,
 * the volumetric weight is used for band lookup and billing.
 * Volumetric weight = (L × W × H) / divisor.
 *
 * Common divisors: 4000 (DPD domestic), 5000 (DHL international)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, X, Divide, Package } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputSt = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--mv-bg)',
  border: '1px solid var(--mv-hairline-2)',
  borderRadius: 0, color: 'var(--mv-ink)', fontSize: 13,
  padding: '8px 12px', outline: 'none',
};

// ─── Formula preview ──────────────────────────────────────────────────────────
function FormulaBox({ divisor }) {
  const eg_l = 30, eg_w = 30, eg_h = 30;
  const vol = eg_l * eg_w * eg_h;
  const dimKg = divisor > 0 ? (vol / divisor).toFixed(2) : '—';
  return (
    <div style={{
      background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
      borderRadius: 0, padding: '10px 14px', fontSize: 12, color: 'var(--mv-ink-62)',
    }}>
      <span style={{ color: 'var(--mv-purple)', fontWeight: 700 }}>Formula: </span>
      (L × W × H) ÷ {divisor > 0 ? divisor : '?'} = volumetric kg
      {divisor > 0 && (
        <span style={{ marginLeft: 16, color: 'var(--mv-ink)' }}>
          Example: {eg_l} × {eg_w} × {eg_h} = {vol.toLocaleString()} cm³ ÷ {divisor} = <strong style={{ color: 'var(--mv-purple)' }}>{dimKg} kg</strong>
        </span>
      )}
    </div>
  );
}

// ─── Create / Edit rule form ──────────────────────────────────────────────────
function RuleForm({ initial, onSave, onCancel }) {
  const [name, setName]       = useState(initial?.name    || '');
  const [divisor, setDivisor] = useState(initial?.divisor || '');

  const valid = name.trim().length > 0 && parseInt(divisor) > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>
            Rule Name
          </label>
          <input
            style={inputSt}
            placeholder='e.g. DPD Standard 4000'
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>
            Divisor
          </label>
          <input
            style={inputSt}
            type='number'
            min='1'
            placeholder='e.g. 4000'
            value={divisor}
            onChange={e => setDivisor(e.target.value)}
          />
        </div>
      </div>

      {parseInt(divisor) > 0 && (
        <FormulaBox divisor={parseInt(divisor)} />
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
        <button className="mv-btn-ghost" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={onCancel}>
          Cancel
        </button>
        <button
          className="mv-btn-primary"
          style={{ padding: '6px 16px', fontSize: 12.5, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}
          disabled={!valid}
          onClick={() => onSave({ name: name.trim(), divisor: parseInt(divisor) })}
        >
          <Check size={13} /> Save Rule
        </button>
      </div>
    </div>
  );
}

// ─── Service badge ────────────────────────────────────────────────────────────
function ServiceBadge({ service, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
      borderRadius: 0, padding: '4px 10px', fontSize: 12, color: 'var(--mv-ink)',
    }}>
      <span style={{ color: 'var(--mv-ink-52)', fontSize: 11 }}>{service.carrier_name} /</span>
      <span style={{ fontWeight: 600 }}>{service.name}</span>
      <span style={{ color: 'var(--mv-ink-52)', fontSize: 11 }}>({service.service_code})</span>
      {onRemove && (
        <button
          onClick={() => onRemove(service.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', padding: 0, display: 'flex', marginLeft: 2 }}
          title="Remove service"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

// ─── Rule card ────────────────────────────────────────────────────────────────
function RuleCard({ rule, allServices, onUpdate, onDelete, onAssign, onUnassign }) {
  const [editing, setEditing]         = useState(false);
  const [showAssign, setShowAssign]   = useState(false);
  const [selectedSvc, setSelectedSvc] = useState('');

  const assignedIds = new Set(rule.assigned_services.map(s => s.id));
  const available   = allServices.filter(s => !assignedIds.has(s.id));

  function handleSave(data) {
    onUpdate(rule.id, data);
    setEditing(false);
  }

  function handleAssign() {
    if (!selectedSvc) return;
    onAssign(rule.id, parseInt(selectedSvc));
    setSelectedSvc('');
    setShowAssign(false);
  }

  return (
    <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: '20px 24px', marginBottom: 18 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Divide size={16} color='var(--mv-purple)' />
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--mv-ink)' }}>{rule.name}</span>
          <span style={{
            background: 'var(--mv-bg)', border: '1px solid var(--mv-purple)',
            borderRadius: 0, padding: '2px 8px', fontSize: 11.5, color: 'var(--mv-purple)', fontWeight: 800,
          }}>
            ÷ {rule.divisor.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="mv-btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setEditing(e => !e)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            className="mv-btn-ghost"
            style={{ padding: '5px 10px', fontSize: 12, color: 'var(--mv-magenta-deep)' }}
            onClick={() => onDelete(rule.id)}
            title={rule.assigned_services.length > 0 ? 'Remove all service assignments first' : 'Delete rule'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ marginBottom: 16 }}>
          <RuleForm
            initial={rule}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Formula preview (when not editing) */}
      {!editing && (
        <div style={{ marginBottom: 14 }}>
          <FormulaBox divisor={rule.divisor} />
        </div>
      )}

      {/* Assigned services */}
      <div style={{ paddingTop: 8, borderTop: '1px solid var(--mv-hairline)' }}>
        <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Assigned Services ({rule.assigned_services.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {rule.assigned_services.length === 0 ? (
            <span style={{ fontSize: 12.5, color: 'var(--mv-ink-52)', fontStyle: 'italic' }}>No services assigned</span>
          ) : (
            rule.assigned_services.map(svc => (
              <ServiceBadge
                key={svc.id}
                service={svc}
                onRemove={(id) => onUnassign(id)}
              />
            ))
          )}
        </div>

        {/* Assign service dropdown */}
        {showAssign ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              style={{ ...inputSt, flex: 1, height: 34 }}
              value={selectedSvc}
              onChange={e => setSelectedSvc(e.target.value)}
            >
              <option value=''>— Select a service —</option>
              {available.map(s => (
                <option key={s.id} value={s.id}>
                  {s.carrier_name} / {s.name} ({s.service_code})
                  {s.volumetric_rule_id ? ' ⚠ already has a rule' : ''}
                </option>
              ))}
            </select>
            <button className="mv-btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={handleAssign} disabled={!selectedSvc}>
              <Check size={13} /> Assign
            </button>
            <button className="mv-btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => { setShowAssign(false); setSelectedSvc(''); }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <button className="mv-btn-ghost" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => setShowAssign(true)}>
            <Plus size={12} style={{ display: 'inline', marginRight: 4 }} />
            Assign service to this rule
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VolumetricSettings() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError]           = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['volumetric-rules'],
    queryFn: () => api.get('/carriers/volumetric-rules').then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['volumetric-rules'] });

  const createRule = useMutation({
    mutationFn: body => api.post('/carriers/volumetric-rules', body),
    onSuccess: () => { invalidate(); setShowCreate(false); setError(''); },
    onError: e => setError(e.response?.data?.error || 'Error creating rule'),
  });

  const updateRule = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/carriers/volumetric-rules/${id}`, body),
    onSuccess: invalidate,
    onError: e => setError(e.response?.data?.error || 'Error updating rule'),
  });

  const deleteRule = useMutation({
    mutationFn: id => api.delete(`/carriers/volumetric-rules/${id}`),
    onSuccess: invalidate,
    onError: e => setError(e.response?.data?.error || 'Error deleting rule'),
  });

  const assignSvc = useMutation({
    mutationFn: ({ ruleId, serviceId }) =>
      api.put(`/carriers/volumetric-rules/${ruleId}/services/${serviceId}`),
    onSuccess: invalidate,
    onError: e => setError(e.response?.data?.error || 'Error assigning service'),
  });

  const unassignSvc = useMutation({
    mutationFn: serviceId => api.delete(`/carriers/volumetric-rules/services/${serviceId}`),
    onSuccess: invalidate,
    onError: e => setError(e.response?.data?.error || 'Error removing service'),
  });

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        <SettingsNav />

        <div className="mv-head">
          <div>
            <div className="mv-kicker">Settings &amp; Rating Engine</div>
            <h1 className="mv-title">Volumetric Weight Rules</h1>
            <p className="mv-blurb">
              Define named divisor formulas and assign them to carrier services. The pricing engine bills by volumetric weight when it exceeds actual deadweight.
            </p>
          </div>
          <div className="mv-actions">
            <button className="mv-btn-primary" onClick={() => { setShowCreate(s => !s); setError(''); }}>
              <Plus size={14} /> New Rule
            </button>
          </div>
        </div>

        <div className="mv-rule" style={{ marginBottom: 20 }} />

        {/* How it works box */}
        <div style={{
          background: 'var(--mv-surface)',
          border: '1px solid var(--mv-hairline-2)',
          borderRadius: 0, padding: '14px 18px', marginBottom: 20,
          fontSize: 12.5, color: 'var(--mv-ink-62)', lineHeight: 1.6,
        }}>
          <Package size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--mv-purple)' }} />
          <strong style={{ color: 'var(--mv-ink)' }}>How it works: </strong>
          When a shipment arrives, the engine calculates volumetric weight as
          <span style={{ color: 'var(--mv-purple)', fontFamily: 'monospace', margin: '0 4px', fontWeight: 700 }}>(L × W × H) ÷ divisor</span>
          for each parcel. If the volumetric weight is greater than declared deadweight, the volumetric
          weight is used for weight band selection and billing.
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(233,30,140,0.08)', border: '1px solid var(--mv-magenta)',
            borderRadius: 0, padding: '10px 14px', marginBottom: 16, color: 'var(--mv-magenta-deep)', fontSize: 12.5,
          }}>
            {error}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', borderRadius: 0, padding: 20, marginBottom: 20 }}>
            <div className="mv-kicker">New Formula</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--mv-ink)', marginBottom: 14 }}>
              Create New Volumetric Rule
            </div>
            <RuleForm
              onSave={data => createRule.mutate(data)}
              onCancel={() => { setShowCreate(false); setError(''); }}
            />
          </div>
        )}

        {/* Rule list */}
        {isLoading ? (
          <div style={{ color: 'var(--mv-ink-52)', fontSize: 13, textAlign: 'center', padding: 32 }}>Loading…</div>
        ) : data?.rules?.length === 0 ? (
          <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', textAlign: 'center', color: 'var(--mv-ink-52)', fontSize: 13, padding: 40 }}>
            No volumetric rules defined yet. Create one above.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
            {data?.rules?.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                allServices={data?.services || []}
                onUpdate={(id, body) => updateRule.mutate({ id, ...body })}
                onDelete={id => {
                  if (!window.confirm(`Delete "${rule.name}"? This will remove it from all assigned services.`)) return;
                  deleteRule.mutate(id);
                }}
                onAssign={(ruleId, serviceId) => assignSvc.mutate({ ruleId, serviceId })}
                onUnassign={serviceId => unassignSvc.mutate(serviceId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
