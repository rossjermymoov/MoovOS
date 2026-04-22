/**
 * SurchargesTab — per-carrier surcharge definitions + rule builder
 *
 * Surcharge: code, name, calc_type (flat/percentage), calc_base (fixed/base_rate), default_value
 * Rules:     a named set of filter conditions (AND within rule, OR across rules)
 * Filters:   field + op + value targeting shipment fields
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronRight, Check, X, AlertTriangle, Zap, Percent } from 'lucide-react';
import { surchargesApi } from '../../api/surcharges';

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTER_FIELDS = [
  { value: 'ship_to_country_iso', label: 'Destination Country (ISO)', type: 'text',
    hint: 'e.g. GB, DE, FR, US — use comma for multiple when op is "is in"' },
  { value: 'courier',             label: 'Courier',                    type: 'text' },
  { value: 'dc_service_id',       label: 'Service Code',               type: 'text' },
  { value: 'service_name',        label: 'Service Name',               type: 'text' },
  { value: 'ship_to_postcode',    label: 'Postcode',                   type: 'text' },
  { value: 'parcel_count',        label: 'Parcel Count',               type: 'number' },
  { value: 'total_weight_kg',     label: 'Weight (kg)',                type: 'number' },
];

const TEXT_OPS = [
  { value: 'eq',       label: 'equals' },
  { value: 'not_eq',   label: 'does not equal' },
  { value: 'in',       label: 'is in (comma-separated)' },
  { value: 'not_in',   label: 'is not in (comma-separated)' },
  { value: 'contains', label: 'contains' },
];

const NUM_OPS = [
  { value: 'eq',  label: 'equals' },
  { value: 'gt',  label: 'greater than' },
  { value: 'lt',  label: 'less than' },
  { value: 'gte', label: 'at least' },
  { value: 'lte', label: 'at most' },
];

function fieldType(fieldValue) {
  return FILTER_FIELDS.find(f => f.value === fieldValue)?.type || 'text';
}

function opsFor(fieldValue) {
  return fieldType(fieldValue) === 'number' ? NUM_OPS : TEXT_OPS;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const S = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 10,
  },
  label: { fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    padding: '6px 10px',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    background: 'rgba(30,30,40,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    padding: '6px 10px',
    width: '100%',
    boxSizing: 'border-box',
  },
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 9999,
    fontSize: 11, fontWeight: 700,
    background: color + '22', color,
  }),
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  iconBtn: (color = '#AAAAAA') => ({
    background: 'none', border: 'none', cursor: 'pointer', color, padding: '4px', borderRadius: 4,
    display: 'flex', alignItems: 'center',
  }),
  btn: (variant = 'primary') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', border: 'none',
    background: variant === 'primary' ? '#00C853' : variant === 'danger' ? '#E91E8C' : 'rgba(255,255,255,0.08)',
    color: variant === 'ghost' ? '#AAAAAA' : '#fff',
  }),
};

// ── FilterRow ─────────────────────────────────────────────────────────────────

function FilterRow({ filter, onChange, onRemove }) {
  const ops = opsFor(filter.field);
  const hint = FILTER_FIELDS.find(f => f.value === filter.field)?.hint;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 160px 1fr 28px', gap: 6, alignItems: 'start', marginBottom: 6 }}>
      <select value={filter.field} onChange={e => onChange({ ...filter, field: e.target.value, op: opsFor(e.target.value)[0].value, value: '' })} style={S.select}>
        {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select value={filter.op} onChange={e => onChange({ ...filter, op: e.target.value })} style={S.select}>
        {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div>
        <input
          value={Array.isArray(filter.value) ? filter.value.join(',') : filter.value}
          onChange={e => onChange({ ...filter, value: e.target.value })}
          placeholder={hint || 'Value'}
          style={S.input}
          type={fieldType(filter.field) === 'number' ? 'number' : 'text'}
        />
      </div>
      <button onClick={onRemove} style={S.iconBtn('#E91E8C')} title="Remove condition">
        <X size={13} />
      </button>
    </div>
  );
}

// ── RuleEditor ────────────────────────────────────────────────────────────────

function RuleEditor({ surchargeId, rule, onSave, onCancel }) {
  const [name, setName] = useState(rule?.name || '');
  const [filters, setFilters] = useState(rule?.filters || []);
  const qc = useQueryClient();

  const addFilter = () => setFilters(f => [...f, { field: 'ship_to_country_iso', op: 'not_in', value: 'GB' }]);
  const updateFilter = (i, next) => setFilters(f => f.map((x, j) => j === i ? next : x));
  const removeFilter = (i) => setFilters(f => f.filter((_, j) => j !== i));

  const save = useMutation({
    mutationFn: () => {
      // Normalise in/not_in values to array
      const normalised = filters.map(f => ({
        ...f,
        value: (f.op === 'in' || f.op === 'not_in') && typeof f.value === 'string'
          ? f.value.split(',').map(s => s.trim()).filter(Boolean)
          : f.value,
      }));
      if (rule?.id) {
        return surchargesApi.updateRule(surchargeId, rule.id, { name, filters: normalised });
      }
      return surchargesApi.addRule(surchargeId, { name, filters: normalised });
    },
    onSuccess: () => { qc.invalidateQueries(['surcharges']); onSave(); },
  });

  return (
    <div style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: 14, marginTop: 8 }}>
      <div style={{ marginBottom: 10 }}>
        <label style={S.label}>Rule name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. All European countries" style={S.input} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ ...S.row, marginBottom: 6, justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
            CONDITIONS — all must match (AND). Empty = always fire.
          </span>
          <button onClick={addFilter} style={S.btn('ghost')}>
            <Plus size={11} /> Add condition
          </button>
        </div>
        {filters.length === 0 && (
          <div style={{ fontSize: 12, color: '#888', padding: '6px 0' }}>
            No conditions — this rule will fire for every shipment on this carrier.
          </div>
        )}
        {filters.map((f, i) => (
          <FilterRow key={i} filter={f} onChange={next => updateFilter(i, next)} onRemove={() => removeFilter(i)} />
        ))}
      </div>

      <div style={{ ...S.row, justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} style={S.btn('ghost')}>Cancel</button>
        <button onClick={() => save.mutate()} disabled={!name || save.isPending} style={S.btn()}>
          <Check size={12} /> {rule?.id ? 'Save rule' : 'Add rule'}
        </button>
      </div>
    </div>
  );
}

// ── SurchargeRow ──────────────────────────────────────────────────────────────

function SurchargeRow({ surcharge, courierId, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingRule, setAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({
    code: surcharge.code,
    name: surcharge.name,
    description: surcharge.description || '',
    calc_type: surcharge.calc_type,
    calc_base: surcharge.calc_base,
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
  const isFuel = surcharge.calc_base === 'base_rate';

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
            {isFuel && ' of base'}
          </span>
        )}

        <span style={{ fontSize: 11, color: rules.length ? '#00C853' : '#888' }}>
          {rules.length} rule{rules.length !== 1 ? 's' : ''}
        </span>

        <div style={S.row} onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditing(e => !e)} style={S.iconBtn('#AAAAAA')} title="Edit">✏️</button>
          <button onClick={() => toggleActive.mutate()} style={S.iconBtn(surcharge.active ? '#00C853' : '#888')} title={surcharge.active ? 'Disable' : 'Enable'}>
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
            <div>
              <label style={S.label}>Code</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" style={S.input} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={S.label}>Type</label>
              <select value={form.calc_type} onChange={e => setForm(f => ({ ...f, calc_type: e.target.value }))} style={S.select}>
                <option value="flat">Flat £ amount</option>
                <option value="percentage">Percentage %</option>
              </select>
            </div>
            {form.calc_type === 'percentage' && (
              <div>
                <label style={S.label}>Applied to</label>
                <select value={form.calc_base} onChange={e => setForm(f => ({ ...f, calc_base: e.target.value }))} style={S.select}>
                  <option value="base_rate">Base rate only</option>
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
            <button onClick={() => update.mutate()} disabled={update.isPending} style={S.btn()}>
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Expanded: rules */}
      {expanded && !editing && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {surcharge.description && (
            <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{surcharge.description}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA' }}>TRIGGER RULES</span>
            <button onClick={() => { setAddingRule(true); setEditingRule(null); }} style={S.btn('ghost')}>
              <Plus size={11} /> Add rule
            </button>
          </div>

          {rules.length === 0 && !addingRule && (
            <div style={{ fontSize: 12, color: '#888', background: 'rgba(255,150,0,0.07)', border: '1px solid rgba(255,150,0,0.2)', borderRadius: 6, padding: '8px 12px' }}>
              <AlertTriangle size={12} style={{ marginRight: 6, color: '#F59E0B', verticalAlign: 'middle' }} />
              No rules — surcharge will never fire. Add at least one rule.
            </div>
          )}

          {rules.map(rule => (
            <div key={rule.id}>
              {editingRule === rule.id ? (
                <RuleEditor
                  surchargeId={surcharge.id}
                  rule={rule}
                  onSave={() => setEditingRule(null)}
                  onCancel={() => setEditingRule(null)}
                />
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '8px 12px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{rule.name}</span>
                    <span style={{ fontSize: 11, color: rule.active ? '#00C853' : '#888' }}>
                      {(rule.filters || []).length} condition{(rule.filters || []).length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => setEditingRule(rule.id)} style={S.iconBtn()} title="Edit rule">✏️</button>
                    <button onClick={() => deleteRule.mutate(rule.id)} style={S.iconBtn('#E91E8C')} title="Delete rule">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {(rule.filters || []).length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {rule.filters.map((f, i) => {
                        const fieldLabel = FILTER_FIELDS.find(x => x.value === f.field)?.label || f.field;
                        const opLabel = [...TEXT_OPS, ...NUM_OPS].find(o => o.value === f.op)?.label || f.op;
                        const valDisplay = Array.isArray(f.value) ? f.value.join(', ') : f.value;
                        return (
                          <span key={i} style={S.badge('#7B2FBE')}>
                            {fieldLabel} {opLabel} <strong>{valDisplay}</strong>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {(rule.filters || []).length === 0 && (
                    <span style={{ fontSize: 11, color: '#00C853' }}>Always fires</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {addingRule && (
            <RuleEditor
              surchargeId={surcharge.id}
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

// ── New surcharge form ────────────────────────────────────────────────────────

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
        <div>
          <label style={S.label}>Code</label>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="FUEL" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Fuel Surcharge" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Description</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" style={S.input} />
        </div>
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
              <option value="base_rate">Base rate only</option>
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
        <button onClick={() => create.mutate()} disabled={!form.code || !form.name || !form.default_value || create.isPending} style={S.btn()}>
          <Check size={12} /> Add surcharge
        </button>
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#7B2FBE', margin: 0 }}>Surcharges</h2>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
            Define surcharges for {courierCode}. Add rules to control when each one fires.
            Fuel surcharges (% of base rate) are applied before any flat additions.
          </p>
        </div>
        <button onClick={() => setAdding(a => !a)} style={S.btn()}>
          <Plus size={13} /> Add surcharge
        </button>
      </div>

      {adding && <NewSurchargeForm courierId={courierId} onDone={() => setAdding(false)} />}

      {surcharges.length === 0 && !adding && (
        <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 13 }}>
          No surcharges yet. Add a fuel surcharge, clearance charge, or any other carrier surcharge.
        </div>
      )}

      {active.map(s => (
        <SurchargeRow key={s.id} surcharge={s} courierId={courierId} />
      ))}

      {inactive.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Inactive
          </div>
          {inactive.map(s => (
            <SurchargeRow key={s.id} surcharge={s} courierId={courierId} />
          ))}
        </div>
      )}
    </div>
  );
}
