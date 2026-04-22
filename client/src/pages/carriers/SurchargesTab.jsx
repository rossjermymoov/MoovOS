/**
 * SurchargesTab
 *
 * Table layout matching the carrier surcharge schedule:
 *   CODE | NAME | CALC / RATE | ALWAYS? | EFFECTIVE
 *
 * applies_when:
 *   'always'         → green YES  — auto-applied on every matching shipment
 *   'reconciliation' → grey CODE-ONLY — added manually when invoice arrives
 *
 * charge_per (flat rates only):
 *   'shipment' → £X / shipment
 *   'parcel'   → £X / parcel  (× parcel count)
 *
 * calc_type = 'percentage' → X% of base rate (fuel-style)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Check, X, AlertTriangle, Percent,
} from 'lucide-react';
import { surchargesApi } from '../../api/surcharges';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Filter fields available for rule conditions ────────────────────────────────

const FILTER_FIELDS = [
  { value: 'ship_from_country_iso', label: 'Ship From Country',   type: 'text',   hint: 'ISO code e.g. GB, DE' },
  { value: 'ship_to_country_iso',   label: 'Ship To Country',     type: 'text',   hint: 'ISO code e.g. GB, FR, DE' },
  { value: 'ship_to_postcode',      label: 'Ship To Postcode',    type: 'text',   hint: 'Outward code e.g. EC1A, SW1' },
  { value: 'dim_length_cm',         label: 'Length (cm)',          type: 'number', hint: 'e.g. 60' },
  { value: 'dim_width_cm',          label: 'Width (cm)',           type: 'number', hint: 'e.g. 40' },
  { value: 'dim_height_cm',         label: 'Height (cm)',          type: 'number', hint: 'e.g. 30' },
  { value: 'parcel_weight_kg',      label: 'Parcel Weight (kg)',   type: 'number', hint: 'Per parcel e.g. 2.5' },
  { value: 'total_weight_kg',       label: 'Total Weight (kg)',    type: 'number', hint: 'All parcels combined' },
  { value: 'parcel_declared_value', label: 'Parcel Value (£)',     type: 'number', hint: 'Declared value per parcel' },
  { value: 'total_declared_value',  label: 'Total Value (£)',      type: 'number', hint: 'Total declared shipment value' },
  { value: 'parcel_count',          label: 'Number of Parcels',   type: 'number', hint: 'Integer' },
  { value: 'dc_service_id',         label: 'Service Code',         type: 'text',   hint: 'e.g. DPD-12' },
  { value: 'service_name',          label: 'Service Name',         type: 'text',   hint: 'e.g. DPD Next Day' },
  { value: 'courier',               label: 'Courier',              type: 'text',   hint: 'e.g. DPD, EvRi' },
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

function fieldDef(v) { return FILTER_FIELDS.find(f => f.value === v) || FILTER_FIELDS[0]; }
function opsFor(v)    { return fieldDef(v).type === 'number' ? NUM_OPS : TEXT_OPS; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRate(s) {
  if (s.calc_type === 'percentage') return `${parseFloat(s.default_value).toFixed(2)}% of base`;
  const per = s.charge_per === 'parcel' ? 'parcel' : 'shipment';
  return `£${parseFloat(s.default_value).toFixed(2)} / ${per}`;
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const col = {
  header: { fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 12px 10px' },
  cell:   { padding: '14px 12px', verticalAlign: 'middle', borderBottom: '1px solid rgba(255,255,255,0.05)' },
};

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6, color: '#fff', fontSize: 13, padding: '6px 10px', ...extra,
});

const sel = (extra = {}) => ({
  background: 'rgba(30,30,40,0.95)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6, color: '#fff', fontSize: 13, padding: '6px 10px', ...extra,
});

// ── Chip input ─────────────────────────────────────────────────────────────────

function ChipInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const items = Array.isArray(value) ? value : (value ? String(value).split(',').map(s => s.trim()).filter(Boolean) : []);

  function add(raw) {
    const parts = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    onChange([...new Set([...items, ...parts])]);
    setDraft('');
  }

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, background: 'rgba(255,255,255,0.06)', padding: '4px 8px', minHeight: 36, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(123,47,190,0.3)', border: '1px solid rgba(123,47,190,0.5)', borderRadius: 9999, padding: '2px 8px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
          {item}
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: 0, display: 'flex' }}><X size={10} /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); add(draft); } if (e.key === 'Backspace' && !draft && items.length) onChange(items.slice(0, -1)); }}
        onBlur={() => { if (draft.trim()) add(draft); }}
        placeholder={items.length ? '' : (placeholder || 'Type and press Enter…')}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12, outline: 'none', flex: 1, minWidth: 100, padding: '2px 0' }}
      />
    </div>
  );
}

// ── Service picker ─────────────────────────────────────────────────────────────

function ServicePicker({ courierId, selected = [], onChange }) {
  const { data: carrier } = useQuery({
    queryKey: ['carrier-detail', courierId],
    queryFn: () => api.get(`/carriers/couriers/${courierId}`).then(r => r.data),
    enabled: !!courierId,
  });
  const services = carrier?.services || [];
  if (!services.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {services.map(svc => {
        const on = selected.includes(svc.service_code);
        return (
          <button key={svc.id} onClick={() => onChange(on ? selected.filter(s => s !== svc.service_code) : [...selected, svc.service_code])}
            style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: on ? 'rgba(0,200,83,0.2)' : 'rgba(255,255,255,0.06)', color: on ? '#00C853' : '#888', outline: on ? '1px solid rgba(0,200,83,0.35)' : '1px solid rgba(255,255,255,0.1)' }}>
            {on && <Check size={10} style={{ marginRight: 4 }} />}
            {svc.name}
          </button>
        );
      })}
      {selected.length > 0 && <button onClick={() => onChange([])} style={{ padding: '3px 8px', borderRadius: 9999, fontSize: 11, cursor: 'pointer', border: 'none', background: 'none', color: '#E91E8C' }}>Clear</button>}
    </div>
  );
}

// ── Condition row ──────────────────────────────────────────────────────────────

function ConditionRow({ filter, onChange, onRemove, isFirst, logic }) {
  const isMulti = filter.op === 'in' || filter.op === 'not_in';
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
      <div style={{ width: 34, flexShrink: 0, paddingTop: 8, textAlign: 'center', fontSize: 10, fontWeight: 700, color: isFirst ? '#888' : logic === 'OR' ? '#F59E0B' : '#7B2FBE' }}>
        {isFirst ? 'IF' : logic}
      </div>
      <select value={filter.field} onChange={e => { const f = e.target.value; onChange({ ...filter, field: f, op: opsFor(f)[0].value, value: '' }); }} style={{ ...sel(), width: 180, flexShrink: 0 }}>
        {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select value={filter.op} onChange={e => onChange({ ...filter, op: e.target.value, value: '' })} style={{ ...sel(), width: 130, flexShrink: 0 }}>
        {opsFor(filter.field).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div style={{ flex: 1 }}>
        {isMulti
          ? <ChipInput value={filter.value} onChange={v => onChange({ ...filter, value: v })} placeholder={fieldDef(filter.field).hint} />
          : <input value={Array.isArray(filter.value) ? filter.value.join(',') : (filter.value ?? '')} onChange={e => onChange({ ...filter, value: e.target.value })} placeholder={fieldDef(filter.field).hint || 'Value'} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} type={fieldDef(filter.field).type === 'number' ? 'number' : 'text'} />
        }
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E91E8C', padding: 4, display: 'flex', alignItems: 'center' }}><X size={13} /></button>
    </div>
  );
}

// ── Rule editor ────────────────────────────────────────────────────────────────

function RuleEditor({ surchargeId, courierId, rule, onSave, onCancel }) {
  const [name, setName]               = useState(rule?.name || '');
  const [logic, setLogic]             = useState(rule?.logic || 'AND');
  const [serviceCodes, setServiceCodes] = useState(rule?.service_codes || []);
  const [filters, setFilters]         = useState(rule?.filters || []);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: () => {
      const payload = { name, logic, service_codes: serviceCodes, filters };
      return rule?.id ? surchargesApi.updateRule(surchargeId, rule.id, payload) : surchargesApi.addRule(surchargeId, payload);
    },
    onSuccess: () => { qc.invalidateQueries(['surcharges']); onSave(); },
  });

  return (
    <div style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: 16, marginBottom: 8 }}>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Rule name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. EU countries" style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
          Apply to services <span style={{ color: '#555', fontWeight: 400, textTransform: 'none' }}>— leave blank for all</span>
        </label>
        <ServicePicker courierId={courierId} selected={serviceCodes} onChange={setServiceCodes} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Conditions</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {['AND', 'OR'].map(l => (
              <button key={l} type="button" onClick={() => setLogic(l)} style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: logic === l ? (l === 'AND' ? 'rgba(123,47,190,0.35)' : 'rgba(245,158,11,0.25)') : 'rgba(255,255,255,0.06)', color: logic === l ? (l === 'AND' ? '#C4B5FD' : '#F59E0B') : '#888' }}>
                {l}
              </button>
            ))}
            <span style={{ fontSize: 11, color: '#555' }}>{logic === 'AND' ? 'all match' : 'any matches'}</span>
            <button onClick={() => setFilters(f => [...f, { field: 'ship_to_country_iso', op: 'in', value: [] }])} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, color: '#AAAAAA', cursor: 'pointer', fontSize: 12, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={11} /> Add condition
            </button>
          </div>
        </div>
        {filters.length === 0 && <div style={{ fontSize: 12, color: '#888' }}>No conditions — fires for all matching shipments on selected services.</div>}
        {filters.map((f, i) => <ConditionRow key={i} filter={f} index={i} isFirst={i === 0} logic={logic} onChange={next => setFilters(fs => fs.map((x, j) => j === i ? next : x))} onRemove={() => setFilters(fs => fs.filter((_, j) => j !== i))} />)}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11 }}>Cancel</button>
        <button type="button" onClick={() => save.mutate()} disabled={!name || save.isPending} style={{ background: '#00C853', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Check size={11} /> {rule?.id ? 'Save rule' : 'Add rule'}
        </button>
      </div>
    </div>
  );
}

// ── Expanded rules panel ───────────────────────────────────────────────────────

function RulesPanel({ surcharge, courierId }) {
  const [addingRule, setAddingRule]   = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const qc = useQueryClient();
  const rules = surcharge.rules || [];

  const deleteRule = useMutation({
    mutationFn: (ruleId) => surchargesApi.deleteRule(surcharge.id, ruleId),
    onSuccess: () => qc.invalidateQueries(['surcharges']),
  });

  return (
    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Trigger Rules {surcharge.applies_when === 'always' ? '— controls when this auto-fires' : '— conditions for matching on invoice reconciliation'}
        </span>
        <button type="button" onClick={() => { setAddingRule(true); setEditingRule(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, color: '#AAAAAA', cursor: 'pointer', fontSize: 11, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={10} /> Add rule
        </button>
      </div>

      {rules.length === 0 && !addingRule && (
        <div style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '8px 12px' }}>
          <AlertTriangle size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {surcharge.applies_when === 'always' ? 'No rules — surcharge will never auto-fire. Add at least one rule.' : 'No rules — surcharge will match any shipment during reconciliation.'}
        </div>
      )}

      {rules.map(rule => (
        <div key={rule.id}>
          {editingRule === rule.id
            ? <RuleEditor surchargeId={surcharge.id} courierId={courierId} rule={rule} onSave={() => setEditingRule(null)} onCancel={() => setEditingRule(null)} />
            : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '8px 12px', marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{rule.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: rule.logic === 'OR' ? 'rgba(245,158,11,0.2)' : 'rgba(123,47,190,0.2)', color: rule.logic === 'OR' ? '#F59E0B' : '#C4B5FD' }}>{rule.logic || 'AND'}</span>
                    {(rule.service_codes || []).length > 0 && rule.service_codes.map(sc => <span key={sc} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 9999, background: 'rgba(0,188,212,0.15)', color: '#00BCD4' }}>{sc}</span>)}
                  </div>
                  {(rule.filters || []).length > 0
                    ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {rule.filters.map((f, i) => {
                          const fl = FILTER_FIELDS.find(x => x.value === f.field)?.label || f.field;
                          const op = [...TEXT_OPS, ...NUM_OPS].find(o => o.value === f.op)?.label || f.op;
                          const val = Array.isArray(f.value) ? f.value.join(', ') : f.value;
                          return <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: 'rgba(123,47,190,0.2)', color: '#C4B5FD' }}>{i > 0 && <span style={{ opacity: 0.5, marginRight: 4 }}>{rule.logic}</span>}{fl} {op} <strong>{val}</strong></span>;
                        })}
                      </div>
                    : <span style={{ fontSize: 11, color: '#00C853' }}>Always fires{(rule.service_codes || []).length ? ' for selected services' : ''}</span>
                  }
                </div>
                <button onClick={() => setEditingRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4, fontSize: 13 }}>✏️</button>
                <button onClick={() => deleteRule.mutate(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E91E8C', padding: 4, display: 'flex' }}><Trash2 size={13} /></button>
              </div>
            )
          }
        </div>
      ))}

      {addingRule && <RuleEditor surchargeId={surcharge.id} courierId={courierId} rule={null} onSave={() => setAddingRule(false)} onCancel={() => setAddingRule(false)} />}
    </div>
  );
}

// ── Add surcharge form ─────────────────────────────────────────────────────────

const BLANK = { code: '', name: '', calc_type: 'flat', charge_per: 'shipment', default_value: '', applies_when: 'reconciliation', effective_date: new Date().toISOString().slice(0, 10) };

function AddSurchargeForm({ courierId, onDone }) {
  const [form, setForm] = useState(BLANK);
  const qc = useQueryClient();
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const create = useMutation({
    mutationFn: () => surchargesApi.create({ ...form, courier_id: courierId }),
    onSuccess: () => { qc.invalidateQueries(['surcharges']); onDone(); },
  });

  return (
    <div style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 10, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Code</label>
          <input maxLength={4} value={form.code} onChange={e => f('code', e.target.value.toUpperCase())} placeholder="A" style={{ ...inp(), width: '100%', boxSizing: 'border-box', textAlign: 'center', fontWeight: 700, fontSize: 16, letterSpacing: '0.05em' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Name</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Fuel and Energy Charge" style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Charge type</label>
          <select value={form.calc_type} onChange={e => { f('calc_type', e.target.value); if (e.target.value === 'percentage') f('charge_per', 'shipment'); }} style={{ ...sel(), width: '100%' }}>
            <option value="flat">Flat amount (£)</option>
            <option value="percentage">% of base rate</option>
          </select>
        </div>

        {form.calc_type === 'flat' && (
          <div>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Per</label>
            <select value={form.charge_per} onChange={e => f('charge_per', e.target.value)} style={{ ...sel(), width: '100%' }}>
              <option value="shipment">Shipment</option>
              <option value="parcel">Parcel</option>
            </select>
          </div>
        )}

        <div>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>{form.calc_type === 'percentage' ? 'Rate (%)' : 'Amount (£)'}</label>
          <input type="number" step="0.01" value={form.default_value} onChange={e => f('default_value', e.target.value)} placeholder="0.00" style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Applies when</label>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: 7, padding: 3, gap: 2 }}>
            {[['always', '● Always', '#00C853'], ['reconciliation', '◎ Code-only', '#888']].map(([val, label, clr]) => (
              <button key={val} type="button" onClick={() => f('applies_when', val)}
                style={{ padding: '4px 12px', borderRadius: 5, cursor: 'pointer', border: 'none', fontSize: 12, fontWeight: form.applies_when === val ? 700 : 400,
                  background: form.applies_when === val ? (val === 'always' ? 'rgba(0,200,83,0.25)' : 'rgba(255,255,255,0.1)') : 'transparent',
                  color: form.applies_when === val ? clr : '#555' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Effective from</label>
          <input type="date" value={form.effective_date} onChange={e => f('effective_date', e.target.value)} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onDone} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11 }}>Cancel</button>
        <button type="button" onClick={() => create.mutate()} disabled={!form.code || !form.name || !form.default_value || create.isPending} style={{ background: '#00C853', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 14px', cursor: 'pointer' }}>
          Add surcharge
        </button>
      </div>
    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export default function SurchargesTab({ courierId, courierCode }) {
  const [adding, setAdding]       = useState(false);
  const [expanded, setExpanded]   = useState(new Set());
  const [editing, setEditing]     = useState(null);
  const [editForm, setEditForm]   = useState({});
  const qc = useQueryClient();

  const { data: surcharges = [], isLoading } = useQuery({
    queryKey: ['surcharges', courierId],
    queryFn: () => surchargesApi.list({ courier_id: courierId }),
    enabled: !!courierId,
  });

  const toggleExpand = (id) => setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const startEdit = (s) => { setEditing(s.id); setEditForm({ code: s.code, name: s.name, calc_type: s.calc_type, charge_per: s.charge_per || 'shipment', default_value: s.default_value, applies_when: s.applies_when || 'reconciliation', effective_date: s.effective_date ? s.effective_date.slice(0, 10) : '' }); };

  const update = useMutation({
    mutationFn: (id) => surchargesApi.update(id, editForm),
    onSuccess: () => { setEditing(null); qc.invalidateQueries(['surcharges']); },
  });

  const del = useMutation({
    mutationFn: (id) => surchargesApi.delete(id),
    onSuccess: () => qc.invalidateQueries(['surcharges']),
  });

  const toggleActive = useMutation({
    mutationFn: (s) => surchargesApi.update(s.id, { active: !s.active }),
    onSuccess: () => qc.invalidateQueries(['surcharges']),
  });

  if (isLoading) return <div style={{ color: '#888', fontSize: 13 }}>Loading surcharges…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#7B2FBE', margin: '0 0 4px' }}>Surcharges — {courierCode}</h2>
          <p style={{ fontSize: 12, color: '#555', margin: 0 }}>
            <span style={{ color: '#00C853', fontWeight: 700 }}>YES</span> surcharges auto-apply on every matching shipment.
            <span style={{ color: '#888', fontWeight: 700, marginLeft: 8 }}>CODE-ONLY</span> are matched against invoices during reconciliation.
          </p>
        </div>
        <button onClick={() => setAdding(a => !a)} style={{ background: '#00C853', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus size={11} /> Add surcharge
        </button>
      </div>

      {adding && <AddSurchargeForm courierId={courierId} onDone={() => setAdding(false)} />}

      {surcharges.length === 0 && !adding && (
        <div style={{ textAlign: 'center', color: '#555', padding: '48px 0', fontSize: 13 }}>No surcharges yet for {courierCode}.</div>
      )}

      {/* Table */}
      {surcharges.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Code', 'Name', 'Calc / Rate', 'Always?', 'Effective', ''].map(h => (
                <th key={h} style={{ ...col.header, textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {surcharges.map(s => (
              <>
                {/* Main row */}
                <tr key={s.id} style={{ opacity: s.active ? 1 : 0.45, cursor: 'pointer' }} onClick={() => { if (editing !== s.id) toggleExpand(s.id); }}>
                  <td style={col.cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B', fontWeight: 800, fontSize: 13 }}>
                      {s.code?.charAt(0) || '?'}
                    </span>
                    {s.code?.length > 1 && <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>{s.code}</span>}
                  </td>

                  <td style={col.cell}>
                    {editing === s.id ? (
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} onClick={e => e.stopPropagation()} style={{ ...inp(), width: 220 }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.name}</span>
                    )}
                  </td>

                  <td style={col.cell}>
                    {editing === s.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <select value={editForm.calc_type} onChange={e => setEditForm(f => ({ ...f, calc_type: e.target.value }))} style={{ ...sel(), width: 130 }}>
                          <option value="flat">£ flat</option>
                          <option value="percentage">% of base</option>
                        </select>
                        {editForm.calc_type === 'flat' && (
                          <select value={editForm.charge_per} onChange={e => setEditForm(f => ({ ...f, charge_per: e.target.value }))} style={{ ...sel(), width: 110 }}>
                            <option value="shipment">/ shipment</option>
                            <option value="parcel">/ parcel</option>
                          </select>
                        )}
                        <input type="number" step="0.01" value={editForm.default_value} onChange={e => setEditForm(f => ({ ...f, default_value: e.target.value }))} style={{ ...inp(), width: 80 }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: '#AAAAAA', fontFamily: 'monospace' }}>{formatRate(s)}</span>
                    )}
                  </td>

                  <td style={col.cell} onClick={e => e.stopPropagation()}>
                    {editing === s.id ? (
                      <select value={editForm.applies_when} onChange={e => setEditForm(f => ({ ...f, applies_when: e.target.value }))} style={{ ...sel(), width: 130 }}>
                        <option value="always">Always</option>
                        <option value="reconciliation">Code-only</option>
                      </select>
                    ) : s.applies_when === 'always' ? (
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 9999, background: 'rgba(0,200,83,0.2)', color: '#00C853', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>YES</span>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 9999, background: 'rgba(255,255,255,0.06)', color: '#888', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em' }}>CODE-ONLY</span>
                    )}
                  </td>

                  <td style={col.cell}>
                    {editing === s.id ? (
                      <input type="date" value={editForm.effective_date} onChange={e => setEditForm(f => ({ ...f, effective_date: e.target.value }))} onClick={e => e.stopPropagation()} style={{ ...inp(), width: 130 }} />
                    ) : (
                      <span style={{ fontSize: 12, color: '#888' }}>{formatDate(s.effective_date)}</span>
                    )}
                  </td>

                  <td style={{ ...col.cell, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      {editing === s.id ? (
                        <>
                          <button type="button" onClick={() => update.mutate(s.id)} disabled={update.isPending} style={{ background: '#00C853', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '3px 10px' }}>Save</button>
                          <button type="button" onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11 }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {expanded.has(s.id)
                            ? <ChevronDown size={14} color="#555" />
                            : <ChevronRight size={14} color="#555" />
                          }
                          <button onClick={e => { e.stopPropagation(); startEdit(s); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', fontSize: 13 }}>✏️</button>
                          <button onClick={e => { e.stopPropagation(); toggleActive.mutate(s); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.active ? '#00C853' : '#555', padding: '4px', fontSize: 12 }} title={s.active ? 'Disable' : 'Enable'}>{s.active ? '●' : '○'}</button>
                          <button onClick={e => { e.stopPropagation(); del.mutate(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E91E8C', padding: '4px', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded rules panel */}
                {expanded.has(s.id) && editing !== s.id && (
                  <tr key={`${s.id}-rules`}>
                    <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <RulesPanel surcharge={s} courierId={courierId} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
