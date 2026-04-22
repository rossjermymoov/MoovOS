/**
 * SurchargesTab — per-carrier surcharge definitions + rule builder
 *
 * Surcharge: code, name, calc_type (flat/percentage), calc_base (fixed/base_rate), default_value
 * Rules:     named filter sets — AND or OR logic, optional service scope, condition rows
 * Conditions: field + op + value drawn from all available shipment fields
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Check, X,
  AlertTriangle, Percent, Tag,
} from 'lucide-react';
import { surchargesApi } from '../../api/surcharges';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Field definitions ─────────────────────────────────────────────────────────

const FILTER_FIELDS = [
  { value: 'ship_to_country_iso', label: 'Destination Country',  type: 'text',   hint: 'ISO codes e.g. FR, DE, ES, IT' },
  { value: 'ship_to_postcode',    label: 'Destination Postcode', type: 'text',   hint: 'Outward code e.g. EX1, SW1A' },
  { value: 'courier',             label: 'Courier',              type: 'text',   hint: 'e.g. DPD, EvRi, DHL' },
  { value: 'dc_service_id',       label: 'Service Code',         type: 'text',   hint: 'e.g. DPD-12' },
  { value: 'service_name',        label: 'Service Name',         type: 'text',   hint: 'e.g. DPD Next Day' },
  { value: 'parcel_count',        label: 'Number of Parcels',    type: 'number', hint: 'Integer' },
  { value: 'total_weight_kg',     label: 'Total Weight (kg)',    type: 'number', hint: 'Decimal, e.g. 2.5' },
];

const TEXT_OPS = [
  { value: 'eq',       label: 'equals' },
  { value: 'not_eq',   label: 'does not equal' },
  { value: 'in',       label: 'is any of' },
  { value: 'not_in',   label: 'is none of' },
  { value: 'contains', label: 'contains' },
];

const NUM_OPS = [
  { value: 'eq',  label: 'equals' },
  { value: 'gt',  label: 'greater than' },
  { value: 'lt',  label: 'less than' },
  { value: 'gte', label: 'at least' },
  { value: 'lte', label: 'at most' },
];

function fieldDef(fieldValue) {
  return FILTER_FIELDS.find(f => f.value === fieldValue) || FILTER_FIELDS[0];
}
function opsFor(fieldValue) {
  return fieldDef(fieldValue).type === 'number' ? NUM_OPS : TEXT_OPS;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const S = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '14px 16px', marginBottom: 10,
  },
  label: {
    fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4,
    display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  input: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: '#fff', fontSize: 13, padding: '6px 10px',
    width: '100%', boxSizing: 'border-box',
  },
  select: {
    background: 'rgba(30,30,40,0.95)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: '#fff', fontSize: 13, padding: '6px 10px',
    width: '100%', boxSizing: 'border-box',
  },
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 9999,
    fontSize: 11, fontWeight: 700,
    background: color + '22', color,
  }),
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  iconBtn: (color = '#AAAAAA') => ({
    background: 'none', border: 'none', cursor: 'pointer', color,
    padding: '4px', borderRadius: 4, display: 'flex', alignItems: 'center',
  }),
  btn: (variant = 'primary') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', border: 'none',
    background: variant === 'primary' ? '#00C853'
               : variant === 'danger'  ? '#E91E8C'
               : 'rgba(255,255,255,0.08)',
    color: variant === 'ghost' ? '#AAAAAA' : '#fff',
  }),
};

// ── Chip multi-select for "is any of" / "is none of" ─────────────────────────

function ChipInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const items = Array.isArray(value) ? value : (value ? String(value).split(',').map(s => s.trim()).filter(Boolean) : []);

  function addItem(raw) {
    const parts = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const next = [...new Set([...items, ...parts])];
    onChange(next);
    setDraft('');
  }

  function removeItem(i) {
    onChange(items.filter((_, j) => j !== i));
  }

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, background: 'rgba(255,255,255,0.06)', padding: '4px 8px', minHeight: 36, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(123,47,190,0.3)', border: '1px solid rgba(123,47,190,0.5)', borderRadius: 9999, padding: '2px 8px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
          {item}
          <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: 0, lineHeight: 1, display: 'flex' }}>
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
            e.preventDefault(); addItem(draft);
          }
          if (e.key === 'Backspace' && !draft && items.length) removeItem(items.length - 1);
        }}
        onBlur={() => { if (draft.trim()) addItem(draft); }}
        placeholder={items.length ? '' : placeholder || 'Type and press Enter or comma…'}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12, outline: 'none', flex: 1, minWidth: 120, padding: '2px 0' }}
      />
    </div>
  );
}

// ── Service picker (checkboxes for a carrier's services) ──────────────────────

function ServicePicker({ courierId, selected = [], onChange }) {
  const { data: carrier } = useQuery({
    queryKey: ['carrier-detail', courierId],
    queryFn: () => api.get(`/carriers/couriers/${courierId}`).then(r => r.data),
    enabled: !!courierId,
  });

  const services = carrier?.services || [];

  if (!services.length) return <span style={{ fontSize: 12, color: '#888' }}>No services found for this carrier.</span>;

  function toggle(code) {
    if (selected.includes(code)) onChange(selected.filter(s => s !== code));
    else onChange([...selected, code]);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {services.map(svc => {
        const active = selected.includes(svc.service_code);
        return (
          <button
            key={svc.id}
            onClick={() => toggle(svc.service_code)}
            style={{
              padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: active ? 'rgba(0,200,83,0.25)' : 'rgba(255,255,255,0.06)',
              color: active ? '#00C853' : '#888',
              outline: active ? '1px solid rgba(0,200,83,0.4)' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {active && <Check size={10} style={{ marginRight: 4 }} />}
            {svc.name} <span style={{ opacity: 0.6 }}>({svc.service_code})</span>
          </button>
        );
      })}
      {selected.length > 0 && (
        <button onClick={() => onChange([])} style={{ padding: '4px 10px', borderRadius: 9999, fontSize: 11, cursor: 'pointer', border: 'none', background: 'none', color: '#E91E8C' }}>
          Clear all
        </button>
      )}
    </div>
  );
}

// ── Single condition row ───────────────────────────────────────────────────────

function ConditionRow({ filter, onChange, onRemove, index, logic, isFirst }) {
  const ops = opsFor(filter.field);
  const isMulti = filter.op === 'in' || filter.op === 'not_in';

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
      {/* AND / OR label */}
      <div style={{ width: 32, flexShrink: 0, paddingTop: 8, textAlign: 'center' }}>
        {isFirst ? (
          <span style={{ fontSize: 10, color: '#888', fontWeight: 700 }}>IF</span>
        ) : (
          <span style={{ fontSize: 10, color: logic === 'OR' ? '#F59E0B' : '#7B2FBE', fontWeight: 700 }}>{logic}</span>
        )}
      </div>

      {/* Field */}
      <select
        value={filter.field}
        onChange={e => {
          const newField = e.target.value;
          const newOps = opsFor(newField);
          onChange({ ...filter, field: newField, op: newOps[0].value, value: '' });
        }}
        style={{ ...S.select, width: 170, flexShrink: 0 }}
      >
        {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      {/* Op */}
      <select
        value={filter.op}
        onChange={e => onChange({ ...filter, op: e.target.value, value: isMulti ? [] : '' })}
        style={{ ...S.select, width: 140, flexShrink: 0 }}
      >
        {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Value */}
      <div style={{ flex: 1 }}>
        {isMulti ? (
          <ChipInput
            value={filter.value}
            onChange={v => onChange({ ...filter, value: v })}
            placeholder={fieldDef(filter.field).hint}
          />
        ) : (
          <input
            value={Array.isArray(filter.value) ? filter.value.join(',') : (filter.value ?? '')}
            onChange={e => onChange({ ...filter, value: e.target.value })}
            placeholder={fieldDef(filter.field).hint || 'Value'}
            style={S.input}
            type={fieldDef(filter.field).type === 'number' ? 'number' : 'text'}
            step={fieldDef(filter.field).type === 'number' ? '0.001' : undefined}
          />
        )}
      </div>

      <button onClick={onRemove} style={S.iconBtn('#E91E8C')} title="Remove condition">
        <X size={13} />
      </button>
    </div>
  );
}

// ── Rule editor ───────────────────────────────────────────────────────────────

function RuleEditor({ surchargeId, courierId, rule, onSave, onCancel }) {
  const [name, setName]               = useState(rule?.name || '');
  const [logic, setLogic]             = useState(rule?.logic || 'AND');
  const [serviceCodes, setServiceCodes] = useState(rule?.service_codes || []);
  const [filters, setFilters]         = useState(
    (rule?.filters || []).map(f => ({ ...f, value: f.value ?? '' }))
  );
  const qc = useQueryClient();

  const addCondition = () => setFilters(f => [
    ...f, { field: 'ship_to_country_iso', op: 'in', value: [] },
  ]);
  const updateCondition = (i, next) => setFilters(f => f.map((x, j) => j === i ? next : x));
  const removeCondition = (i)       => setFilters(f => f.filter((_, j) => j !== i));

  const save = useMutation({
    mutationFn: () => {
      const payload = { name, logic, service_codes: serviceCodes, filters };
      return rule?.id
        ? surchargesApi.updateRule(surchargeId, rule.id, payload)
        : surchargesApi.addRule(surchargeId, payload);
    },
    onSuccess: () => { qc.invalidateQueries(['surcharges']); onSave(); },
  });

  return (
    <div style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: 16, marginTop: 8 }}>
      {/* Name */}
      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Rule name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. EU Countries" style={S.input} />
      </div>

      {/* Service scope */}
      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>
          Apply to services
          <span style={{ color: '#555', fontWeight: 400, marginLeft: 6, textTransform: 'none' }}>— leave blank to apply to all services on this carrier</span>
        </label>
        <ServicePicker courierId={courierId} selected={serviceCodes} onChange={setServiceCodes} />
      </div>

      {/* AND / OR toggle + conditions */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={S.label} style={{ margin: 0 }}>Conditions</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#888' }}>Logic:</span>
            {['AND', 'OR'].map(l => (
              <button
                key={l}
                onClick={() => setLogic(l)}
                style={{
                  padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: logic === l
                    ? (l === 'AND' ? 'rgba(123,47,190,0.4)' : 'rgba(245,158,11,0.3)')
                    : 'rgba(255,255,255,0.06)',
                  color: logic === l ? (l === 'AND' ? '#7B2FBE' : '#F59E0B') : '#888',
                }}
              >
                {l}
              </button>
            ))}
            <span style={{ fontSize: 11, color: '#555' }}>
              {logic === 'AND' ? '— all must match' : '— any one matches'}
            </span>
            <button onClick={addCondition} style={S.btn('ghost')}>
              <Plus size={11} /> Add condition
            </button>
          </div>
        </div>

        {filters.length === 0 && (
          <div style={{ fontSize: 12, color: '#888', padding: '6px 0' }}>
            No conditions — rule fires for every shipment on the selected services.
          </div>
        )}

        {filters.map((f, i) => (
          <ConditionRow
            key={i}
            filter={f}
            index={i}
            isFirst={i === 0}
            logic={logic}
            onChange={next => updateCondition(i, next)}
            onRemove={() => removeCondition(i)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={S.btn('ghost')}>Cancel</button>
        <button
          onClick={() => save.mutate()}
          disabled={!name || save.isPending}
          style={S.btn()}
        >
          <Check size={12} /> {rule?.id ? 'Save rule' : 'Add rule'}
        </button>
      </div>
    </div>
  );
}

// ── Surcharge row (one surcharge definition + its rules) ──────────────────────

function SurchargeRow({ surcharge, courierId, onRefresh }) {
  const [expanded, setExpanded]     = useState(false);
  const [editing, setEditing]       = useState(false);
  const [addingRule, setAddingRule]  = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({
    code: surcharge.code, name: surcharge.name, description: surcharge.description || '',
    calc_type: surcharge.calc_type, calc_base: surcharge.calc_base,
    default_value: surcharge.default_value,
  });
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: () => surchargesApi.update(surcharge.id, form),
    onSuccess: () => { setEditing(false); qc.invalidateQueries(['surcharges']); },
  });
  const del = useMutation({
    mutationFn: () => surchargesApi.delete(surcharge.id),
    onSuccess: () => qc.invalidateQueries(['surcharges']),
  });
  const deleteRule = useMutation({
    mutationFn: (ruleId) => surchargesApi.deleteRule(surcharge.id, ruleId),
    onSuccess: () => qc.invalidateQueries(['surcharges']),
  });
  const toggleActive = useMutation({
    mutationFn: () => surchargesApi.update(surcharge.id, { active: !surcharge.active }),
    onSuccess: () => qc.invalidateQueries(['surcharges']),
  });

  const rules = surcharge.rules || [];
  const isFlat = surcharge.calc_type === 'flat';
  const isFuelStyle = surcharge.calc_base === 'base_rate';

  return (
    <div style={{ ...S.card, opacity: surcharge.active ? 1 : 0.5 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        {expanded ? <ChevronDown size={14} color="#888" /> : <ChevronRight size={14} color="#888" />}
        <span style={S.badge('#F59E0B')}>{surcharge.code}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>{surcharge.name}</span>
        {isFlat ? (
          <span style={S.badge('#00BCD4')}>£{parseFloat(surcharge.default_value).toFixed(2)} flat</span>
        ) : (
          <span style={S.badge('#7B2FBE')}>
            <Percent size={10} />
            {parseFloat(surcharge.default_value).toFixed(2)}%
            {isFuelStyle && ' of base rate'}
          </span>
        )}
        <span style={{ fontSize: 11, color: rules.length ? '#00C853' : '#E91E8C' }}>
          {rules.length} rule{rules.length !== 1 ? 's' : ''}
        </span>
        <div style={S.row} onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditing(e => !e)} style={S.iconBtn()} title="Edit">✏️</button>
          <button
            onClick={() => toggleActive.mutate()}
            style={S.iconBtn(surcharge.active ? '#00C853' : '#888')}
            title={surcharge.active ? 'Disable' : 'Enable'}
          >
            {surcharge.active ? '●' : '○'}
          </button>
          <button onClick={() => del.mutate()} style={S.iconBtn('#E91E8C')} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label style={S.label}>Code</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} style={S.input} /></div>
            <div><label style={S.label}>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={S.input} /></div>
            <div><label style={S.label}>Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" style={S.input} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={S.label}>Type</label>
              <select value={form.calc_type} onChange={e => setForm(f => ({ ...f, calc_type: e.target.value, calc_base: e.target.value === 'flat' ? 'fixed' : 'base_rate' }))} style={S.select}>
                <option value="flat">Flat £ amount</option>
                <option value="percentage">Percentage %</option>
              </select>
            </div>
            {form.calc_type === 'percentage' && (
              <div>
                <label style={S.label}>Applied to</label>
                <select value={form.calc_base} onChange={e => setForm(f => ({ ...f, calc_base: e.target.value }))} style={S.select}>
                  <option value="base_rate">Base rate only (fuel-style)</option>
                  <option value="fixed">Total charge</option>
                </select>
              </div>
            )}
            <div>
              <label style={S.label}>{form.calc_type === 'percentage' ? 'Rate (%)' : 'Amount (£)'}</label>
              <input type="number" step="0.01" value={form.default_value} onChange={e => setForm(f => ({ ...f, default_value: e.target.value }))} style={S.input} />
            </div>
          </div>
          <div style={{ ...S.row, justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setEditing(false)} style={S.btn('ghost')}>Cancel</button>
            <button onClick={() => update.mutate()} disabled={update.isPending} style={S.btn()}><Check size={12} /> Save</button>
          </div>
        </div>
      )}

      {/* Expanded rules list */}
      {expanded && !editing && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {surcharge.description && <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{surcharge.description}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA' }}>TRIGGER RULES</span>
            <button onClick={() => { setAddingRule(true); setEditingRule(null); }} style={S.btn('ghost')}>
              <Plus size={11} /> Add rule
            </button>
          </div>

          {rules.length === 0 && !addingRule && (
            <div style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6, padding: '8px 12px' }}>
              <AlertTriangle size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              No rules — this surcharge will never fire. Add at least one rule.
            </div>
          )}

          {rules.map(rule => (
            <div key={rule.id}>
              {editingRule === rule.id ? (
                <RuleEditor
                  surchargeId={surcharge.id}
                  courierId={courierId}
                  rule={rule}
                  onSave={() => setEditingRule(null)}
                  onCancel={() => setEditingRule(null)}
                />
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '10px 12px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{rule.name}</span>
                    <span style={S.badge(rule.logic === 'OR' ? '#F59E0B' : '#7B2FBE')}>{rule.logic || 'AND'}</span>
                    <button onClick={() => setEditingRule(rule.id)} style={S.iconBtn()} title="Edit rule">✏️</button>
                    <button onClick={() => deleteRule.mutate(rule.id)} style={S.iconBtn('#E91E8C')} title="Delete rule"><Trash2 size={12} /></button>
                  </div>

                  {/* Service scope */}
                  {(rule.service_codes || []).length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#888', marginRight: 6 }}>Services:</span>
                      {rule.service_codes.map(sc => (
                        <span key={sc} style={{ ...S.badge('#00BCD4'), marginRight: 4 }}>{sc}</span>
                      ))}
                    </div>
                  )}

                  {/* Conditions */}
                  {(rule.filters || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {rule.filters.map((f, i) => {
                        const fl = FILTER_FIELDS.find(x => x.value === f.field)?.label || f.field;
                        const op = [...TEXT_OPS, ...NUM_OPS].find(o => o.value === f.op)?.label || f.op;
                        const val = Array.isArray(f.value) ? f.value.join(', ') : f.value;
                        return (
                          <span key={i} style={S.badge('#7B2FBE')}>
                            {i > 0 && <span style={{ opacity: 0.6, marginRight: 4 }}>{rule.logic || 'AND'}</span>}
                            {fl} <em style={{ fontWeight: 400, marginLeft: 4 }}>{op}</em> <strong style={{ marginLeft: 4 }}>{val}</strong>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#00C853' }}>
                      {(rule.service_codes || []).length ? 'Always fires for selected services' : 'Always fires for all shipments'}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {addingRule && (
            <RuleEditor
              surchargeId={surcharge.id}
              courierId={courierId}
              rule={null}
              onSave={() => setAddingRule(false)}
              onCancel={() => setAddingRule(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── New surcharge form ─────────────────────────────────────────────────────────

function NewSurchargeForm({ courierId, onDone }) {
  const [form, setForm] = useState({ code: '', name: '', description: '', calc_type: 'flat', calc_base: 'fixed', default_value: '' });
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () => surchargesApi.create({ ...form, courier_id: courierId }),
    onSuccess: () => { qc.invalidateQueries(['surcharges']); onDone(); },
  });

  return (
    <div style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><label style={S.label}>Code</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="FUEL" style={S.input} /></div>
        <div><label style={S.label}>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Fuel Surcharge" style={S.input} /></div>
        <div><label style={S.label}>Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" style={S.input} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          <label style={S.label}>Type</label>
          <select value={form.calc_type} onChange={e => setForm(f => ({ ...f, calc_type: e.target.value, calc_base: e.target.value === 'flat' ? 'fixed' : 'base_rate' }))} style={S.select}>
            <option value="flat">Flat £ amount</option>
            <option value="percentage">Percentage %</option>
          </select>
        </div>
        {form.calc_type === 'percentage' && (
          <div>
            <label style={S.label}>Applied to</label>
            <select value={form.calc_base} onChange={e => setForm(f => ({ ...f, calc_base: e.target.value }))} style={S.select}>
              <option value="base_rate">Base rate only (fuel-style)</option>
              <option value="fixed">Total charge</option>
            </select>
          </div>
        )}
        <div>
          <label style={S.label}>{form.calc_type === 'percentage' ? 'Rate (%)' : 'Amount (£)'}</label>
          <input type="number" step="0.01" value={form.default_value} onChange={e => setForm(f => ({ ...f, default_value: e.target.value }))} placeholder="0.00" style={S.input} />
        </div>
      </div>
      <div style={{ ...S.row, justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onDone} style={S.btn('ghost')}>Cancel</button>
        <button onClick={() => create.mutate()} disabled={!form.code || !form.name || !form.default_value || create.isPending} style={S.btn()}><Check size={12} /> Add surcharge</button>
      </div>
    </div>
  );
}

// ── SurchargesTab (main export) ───────────────────────────────────────────────

export default function SurchargesTab({ courierId, courierCode }) {
  const [adding, setAdding] = useState(false);

  const { data: surcharges = [], isLoading } = useQuery({
    queryKey: ['surcharges', courierId],
    queryFn: () => surchargesApi.list({ courier_id: courierId }),
    enabled: !!courierId,
  });

  if (isLoading) return <div style={{ color: '#888', fontSize: 13 }}>Loading surcharges…</div>;

  const active   = surcharges.filter(s => s.active);
  const inactive = surcharges.filter(s => !s.active);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#7B2FBE', margin: 0 }}>Surcharges</h2>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
            Define surcharges for {courierCode}. Click a surcharge to add rules controlling when it fires.
            Fuel surcharges (% of base rate) are applied before flat additions.
          </p>
        </div>
        <button onClick={() => setAdding(a => !a)} style={S.btn()}><Plus size={13} /> Add surcharge</button>
      </div>

      {adding && <NewSurchargeForm courierId={courierId} onDone={() => setAdding(false)} />}

      {surcharges.length === 0 && !adding && (
        <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 13 }}>
          No surcharges yet. Add a fuel surcharge, clearance charge, or any other surcharge.
        </div>
      )}

      {active.map(s => <SurchargeRow key={s.id} surcharge={s} courierId={courierId} />)}

      {inactive.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Inactive</div>
          {inactive.map(s => <SurchargeRow key={s.id} surcharge={s} courierId={courierId} />)}
        </div>
      )}
    </div>
  );
}
