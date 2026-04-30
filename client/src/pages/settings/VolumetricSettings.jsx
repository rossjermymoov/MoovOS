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
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, color: '#E6EDF3', fontSize: 12,
  padding: '7px 10px', outline: 'none',
};
const btnGreen = {
  background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)',
  borderRadius: 6, color: '#00C853', padding: '7px 10px', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
};
const btnRed = {
  background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)',
  borderRadius: 6, color: '#FF5252', padding: '5px 8px', cursor: 'pointer',
  fontSize: 12,
};
const btnGhost = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6, color: '#AAAAAA', padding: '5px 8px', cursor: 'pointer',
  fontSize: 12,
};
const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '18px 20px', marginBottom: 16,
};

// ─── Formula preview ──────────────────────────────────────────────────────────
function FormulaBox({ divisor }) {
  const eg_l = 30, eg_w = 30, eg_h = 30;
  const vol = eg_l * eg_w * eg_h;
  const dimKg = divisor > 0 ? (vol / divisor).toFixed(2) : '—';
  return (
    <div style={{
      background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#AAAAAA',
    }}>
      <span style={{ color: '#00C853', fontWeight: 700 }}>Formula: </span>
      (L × W × H) ÷ {divisor > 0 ? divisor : '?'} = volumetric kg
      {divisor > 0 && (
        <span style={{ marginLeft: 16, color: '#E6EDF3' }}>
          Example: {eg_l} × {eg_w} × {eg_h} = {vol.toLocaleString()} cm³ ÷ {divisor} = <strong style={{ color: '#00C853' }}>{dimKg} kg</strong>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
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
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
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

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button style={btnGhost} onClick={onCancel}>
          <X size={13} style={{ display: 'inline', marginRight: 4 }} />Cancel
        </button>
        <button
          style={{ ...btnGreen, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}
          disabled={!valid}
          onClick={() => onSave({ name: name.trim(), divisor: parseInt(divisor) })}
        >
          <Check size={13} />Save Rule
        </button>
      </div>
    </div>
  );
}

// ─── Service badge ────────────────────────────────────────────────────────────
function ServiceBadge({ service, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)',
      borderRadius: 9999, padding: '3px 10px', fontSize: 11, color: '#E6EDF3',
    }}>
      <span style={{ color: '#777', fontSize: 10 }}>{service.carrier_name} /</span>
      {service.name}
      <span style={{ color: '#555', fontSize: 10 }}>({service.service_code})</span>
      {onRemove && (
        <button
          onClick={() => onRemove(service.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5252', padding: '0 0 0 2px', display: 'flex' }}
        >
          <X size={11} />
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
    <div style={card}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Divide size={16} color='#00C853' />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#E6EDF3' }}>{rule.name}</span>
          <span style={{
            background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.3)',
            borderRadius: 6, padding: '2px 9px', fontSize: 12, color: '#00C853', fontWeight: 700,
          }}>
            ÷ {rule.divisor.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btnGhost} onClick={() => setEditing(e => !e)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            style={btnRed}
            onClick={() => onDelete(rule.id)}
            title={rule.assigned_services.length > 0 ? 'Remove all service assignments first' : 'Delete rule'}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ marginBottom: 14 }}>
          <RuleForm
            initial={rule}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Formula preview (when not editing) */}
      {!editing && (
        <div style={{ marginBottom: 12 }}>
          <FormulaBox divisor={rule.divisor} />
        </div>
      )}

      {/* Assigned services */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Assigned Services ({rule.assigned_services.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {rule.assigned_services.length === 0 ? (
            <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>No services assigned</span>
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
              style={{ ...inputSt, flex: 1 }}
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
            <button style={btnGreen} onClick={handleAssign} disabled={!selectedSvc}>
              <Check size={13} />Assign
            </button>
            <button style={btnGhost} onClick={() => { setShowAssign(false); setSelectedSvc(''); }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <button style={{ ...btnGhost, fontSize: 11 }} onClick={() => setShowAssign(true)}>
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
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <SettingsNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>
            Volumetric Weight Rules
          </h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            Define named rules (divisor) and assign them to carrier services.
            The pricing engine uses volumetric weight when it exceeds actual weight.
          </p>
        </div>
        <button style={btnGreen} onClick={() => { setShowCreate(s => !s); setError(''); }}>
          <Plus size={14} />New Rule
        </button>
      </div>

      {/* How it works box */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontSize: 12, color: '#888', lineHeight: 1.7,
      }}>
        <Package size={13} style={{ display: 'inline', marginRight: 6, color: '#00C853' }} />
        <strong style={{ color: '#E6EDF3' }}>How it works: </strong>
        When a shipment arrives, the engine calculates volumetric weight as
        <span style={{ color: '#00C853', fontFamily: 'monospace', margin: '0 4px' }}>(L × W × H) ÷ divisor</span>
        for each parcel. If the volumetric weight is greater than the declared weight, the volumetric
        weight is used for weight band selection and billing. Services with no rule assigned use
        actual weight only.
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(213,0,0,0.12)', border: '1px solid rgba(213,0,0,0.3)',
          borderRadius: 7, padding: '10px 14px', marginBottom: 16, color: '#FF5252', fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ ...card, border: '1px solid rgba(0,200,83,0.25)', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#00C853', marginBottom: 12 }}>
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
        <div style={{ color: '#666', fontSize: 13 }}>Loading...</div>
      ) : data?.rules?.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#666', fontSize: 13, padding: 40 }}>
          No volumetric rules defined yet. Create one above.
        </div>
      ) : (
        data?.rules?.map(rule => (
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
        ))
      )}
    </div>
  );
}
