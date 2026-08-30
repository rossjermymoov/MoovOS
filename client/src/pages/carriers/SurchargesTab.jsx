/**
 * SurchargesTab
 *
 * Table layout matching the carrier surcharge schedule:
 *   CODE | NAME | CALC / RATE | ALWAYS? | EFFECTIVE
 *
 * applies_when:
 *   'always'         → green YES  — auto-applied on every matching shipment
 * Rebuilt on the Moov OS design system with ruled tables, zero border-radius,
 * and semantic status marks.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Check, X, AlertTriangle,
} from 'lucide-react';
import { surchargesApi } from '../../api/surcharges';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Filter fields available for rule conditions ────────────────────────────────

const FILTER_FIELDS = [
  { value: 'ship_from_country_iso', label: 'Ship From Country',   type: 'text',   hint: 'ISO code e.g. GB, DE' },
  { value: 'ship_to_country_iso',   label: 'Ship To Country',     type: 'text',   hint: 'ISO code e.g. GB, FR, DE' },
  { value: 'ship_to_postcode',      label: 'Ship To Postcode',    type: 'text',   hint: 'Outward code e.g. EC1A, SW1' },
  { value: 'dim_length_cm',         label: 'Length (cm)',         type: 'number', hint: 'e.g. 60' },
  { value: 'dim_width_cm',          label: 'Width (cm)',          type: 'number', hint: 'e.g. 40' },
  { value: 'dim_height_cm',         label: 'Height (cm)',         type: 'number', hint: 'e.g. 30' },
  { value: 'parcel_weight_kg',      label: 'Parcel Weight (kg)',  type: 'number', hint: 'Per parcel e.g. 2.5' },
  { value: 'total_weight_kg',       label: 'Total Weight (kg)',   type: 'number', hint: 'All parcels combined' },
  { value: 'parcel_declared_value', label: 'Parcel Value (£)',    type: 'number', hint: 'Declared value per parcel' },
  { value: 'total_declared_value',  label: 'Total Value (£)',     type: 'number', hint: 'Total declared shipment value' },
  { value: 'parcel_count',          label: 'Number of Parcels',   type: 'number', hint: 'Integer' },
  { value: 'dc_service_id',         label: 'Service Code',        type: 'text',   hint: 'e.g. DPD-12' },
  { value: 'service_name',          label: 'Service Name',        type: 'text',   hint: 'e.g. DPD Next Day' },
  { value: 'courier',               label: 'Courier',             type: 'text',   hint: 'e.g. DPD, EvRi' },
];

const TEXT_OPS = [
  { value: 'eq',          label: 'equals' },
  { value: 'not_eq',      label: 'does not equal' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with',   label: 'ends with' },
  { value: 'contains',    label: 'contains' },
  { value: 'in',          label: 'is any of' },
  { value: 'not_in',      label: 'is none of' },
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

const inp = (extra = {}) => ({
  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
  borderRadius: 0, color: 'var(--mv-ink)', fontSize: 13, padding: '6px 10px',
  fontFamily: 'inherit', outline: 'none', ...extra,
});

const sel = (extra = {}) => ({
  background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
  borderRadius: 0, color: 'var(--mv-ink)', fontSize: 13, padding: '6px 10px',
  fontFamily: 'inherit', outline: 'none', ...extra,
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
    <div style={{ border: '1px solid var(--mv-hairline-2)', borderRadius: 0, background: 'var(--mv-bg)', padding: '4px 8px', minHeight: 36, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)', borderRadius: 0, padding: '2px 8px', fontSize: 11, color: 'var(--mv-purple-700)', fontWeight: 600 }}>
          {item}
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', padding: 0, display: 'flex' }}><X size={10} /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); add(draft); } if (e.key === 'Backspace' && !draft && items.length) onChange(items.slice(0, -1)); }}
        onBlur={() => { if (draft.trim()) add(draft); }}
        placeholder={items.length ? '' : (placeholder || 'Type and press Enter…')}
        style={{ background: 'none', border: 'none', color: 'var(--mv-ink)', fontSize: 12, outline: 'none', flex: 1, minWidth: 100, padding: '2px 0', fontFamily: 'inherit' }}
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
    <div className="mv-chips">
      {services.map(svc => {
        const on = selected.includes(svc.service_code);
        return (
          <button
            key={svc.id}
            type="button"
            onClick={() => onChange(on ? selected.filter(s => s !== svc.service_code) : [...selected, svc.service_code])}
            className={`mv-chip ${on ? 'is-on' : ''}`}
          >
            {svc.name} ({svc.service_code})
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          style={{ background: 'none', border: 'none', color: 'var(--mv-magenta-deep)', fontSize: 11, cursor: 'pointer', padding: '4px 6px', fontWeight: 600 }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── Condition row ──────────────────────────────────────────────────────────────

function ConditionRow({ filter, onChange, onRemove, isFirst, logic }) {
  const isMulti = filter.op === 'in' || filter.op === 'not_in';
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
      <div style={{ width: 34, flexShrink: 0, paddingTop: 8, textAlign: 'center', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: isFirst ? 'var(--mv-ink-45)' : 'var(--mv-purple)' }}>
        {isFirst ? 'IF' : logic}
      </div>
      <select value={filter.field} onChange={e => { const f = e.target.value; onChange({ ...filter, field: f, op: opsFor(f)[0].value, value: '' }); }} style={{ ...sel(), width: 180, flexShrink: 0 }}>
        {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select value={filter.op} onChange={e => onChange({ ...filter, op: e.target.value, value: '' })} style={{ ...sel(), width: 130, flexShrink: 0 }}>
        {opsFor(filter.field).map(o => <option key={o.value} value={o.label}>{o.label}</option>)}
      </select>
      <div style={{ flex: 1 }}>
        {isMulti
          ? <ChipInput value={filter.value} onChange={v => onChange({ ...filter, value: v })} placeholder={fieldDef(filter.field).hint} />
          : <input value={Array.isArray(filter.value) ? filter.value.join(',') : (filter.value ?? '')} onChange={e => onChange({ ...filter, value: e.target.value })} placeholder={fieldDef(filter.field).hint || 'Value'} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} type={fieldDef(filter.field).type === 'number' ? 'number' : 'text'} />
        }
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-magenta-deep)', padding: 6, display: 'flex', alignItems: 'center' }}><X size={13} /></button>
    </div>
  );
}

// ── Rule editor ────────────────────────────────────────────────────────────────

function RuleEditor({ surchargeId, courierId, rule, onSave, onCancel }) {
  const [name, setName]                 = useState(rule?.name || '');
  const [logic, setLogic]               = useState(rule?.logic || 'AND');
  const [serviceCodes, setServiceCodes] = useState(rule?.service_codes || []);
  const [filters, setFilters]           = useState(rule?.filters || []);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: () => {
      const payload = { name, logic, service_codes: serviceCodes, filters };
      return rule?.id ? surchargesApi.updateRule(surchargeId, rule.id, payload) : surchargesApi.addRule(surchargeId, payload);
    },
    onSuccess: () => { qc.invalidateQueries(['surcharges']); onSave(); },
  });

  return (
    <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 16, marginBottom: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 9, letterSpacing: '.15em', color: 'var(--mv-purple)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Rule name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. EU countries" style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 9, letterSpacing: '.15em', color: 'var(--mv-purple)', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
          Apply to services <span style={{ color: 'var(--mv-ink-45)', fontWeight: 400, textTransform: 'none' }}>— leave blank for all</span>
        </label>
        <ServicePicker courierId={courierId} selected={serviceCodes} onChange={setServiceCodes} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 9, letterSpacing: '.15em', color: 'var(--mv-purple)', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Conditions</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {['AND', 'OR'].map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLogic(l)}
                className={`mv-chip ${logic === l ? 'is-on' : ''}`}
                style={{ fontSize: 10, padding: '2px 8px' }}
              >
                {l}
              </button>
            ))}
            <span style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginLeft: 4 }}>{logic === 'AND' ? 'all match' : 'any matches'}</span>
            <button
              type="button"
              onClick={() => setFilters(f => [...f, { field: 'ship_to_country_iso', op: 'in', value: [] }])}
              className="mv-btn mv-btn-secondary"
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              <Plus size={11} /> Add condition
            </button>
          </div>
        </div>
        {filters.length === 0 && <div style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>No conditions — fires for all matching shipments on selected services.</div>}
        {filters.map((f, i) => (
          <ConditionRow
            key={i}
            filter={f}
            index={i}
            isFirst={i === 0}
            logic={logic}
            onChange={next => setFilters(fs => fs.map((x, j) => j === i ? next : x))}
            onRemove={() => setFilters(fs => fs.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--mv-hairline)' }}>
        <button type="button" onClick={onCancel} className="mv-btn mv-btn-secondary" style={{ padding: '5px 12px' }}>Cancel</button>
        <button type="button" onClick={() => save.mutate()} disabled={!name || save.isPending} className="mv-btn mv-btn-primary" style={{ padding: '5px 14px' }}>
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
    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--mv-hairline)', background: 'rgba(32,30,29,.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 9, letterSpacing: '.15em', color: 'var(--mv-purple)', fontWeight: 700, textTransform: 'uppercase' }}>
          Trigger Rules {surcharge.applies_when === 'always' ? '— controls auto-apply conditions' : '— conditions for invoice reconciliation matching'}
        </span>
        <button
          type="button"
          onClick={() => { setAddingRule(true); setEditingRule(null); }}
          className="mv-btn mv-btn-secondary"
          style={{ padding: '3px 9px', fontSize: 11 }}
        >
          <Plus size={10} /> Add rule
        </button>
      </div>

      {rules.length === 0 && !addingRule && (
        <div style={{ fontSize: 12, color: 'var(--mv-magenta-deep)', background: 'rgba(233,30,140,.06)', border: '1px solid rgba(233,30,140,.2)', padding: '8px 12px', marginBottom: 8 }}>
          <AlertTriangle size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {surcharge.applies_when === 'always' ? 'No rules — surcharge will never auto-fire. Add at least one rule.' : 'No rules — surcharge will match any shipment during reconciliation.'}
        </div>
      )}

      {rules.map(rule => {
        const svcCodes = rule.service_codes || [];
        const filters  = rule.filters || [];
        return (
          <div key={rule.id}>
            {editingRule === rule.id
              ? <RuleEditor surchargeId={surcharge.id} courierId={courierId} rule={rule} onSave={() => setEditingRule(null)} onCancel={() => setEditingRule(null)} />
              : (
                <div style={{ background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline)', padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: svcCodes.length || filters.length ? 7 : 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)', flex: 1 }}>{rule.name}</span>
                    <span style={{ fontSize: 9, letterSpacing: '.12em', fontWeight: 800, padding: '1px 6px', background: 'var(--mv-purple-100)', color: 'var(--mv-purple-700)', flexShrink: 0 }}>
                      {rule.logic || 'AND'}
                    </span>
                    <button type="button" onClick={() => setEditingRule(rule.id)} className="mv-btn mv-btn-secondary" style={{ padding: '2px 6px', fontSize: 11 }}>Edit</button>
                    <button type="button" onClick={() => deleteRule.mutate(rule.id)} className="mv-btn mv-btn-danger" style={{ padding: '2px 6px' }}><Trash2 size={11} /></button>
                  </div>

                  {svcCodes.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap', marginBottom: filters.length ? 6 : 0 }}>
                      <span style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--mv-ink-45)', textTransform: 'uppercase', flexShrink: 0 }}>Services:</span>
                      {svcCodes.map(sc => (
                        <span key={sc} style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', background: 'var(--mv-purple-100)', color: 'var(--mv-purple-700)', border: '1px solid var(--mv-purple-200)' }}>{sc}</span>
                      ))}
                    </div>
                  )}

                  {filters.length > 0
                    ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {filters.map((f, i) => {
                          const fl  = FILTER_FIELDS.find(x => x.value === f.field)?.label || f.field;
                          const op  = [...TEXT_OPS, ...NUM_OPS].find(o => o.value === f.op)?.label || f.op;
                          const val = Array.isArray(f.value) ? f.value.join(', ') : f.value;
                          return (
                            <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', color: 'var(--mv-ink-78)' }}>
                              {i > 0 && <span style={{ opacity: 0.45, marginRight: 4, fontSize: 10, fontWeight: 700 }}>{rule.logic}</span>}
                              {fl} <span style={{ opacity: 0.6 }}>{op}</span> <strong>{val}</strong>
                            </span>
                          );
                        })}
                      </div>
                    : !svcCodes.length && <span className="mv-status"><span className="mv-status-mark is-settled" /> FIRES FOR ALL SHIPMENTS</span>
                  }
                </div>
              )
            }
          </div>
        );
      })}

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
    <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: 18, marginBottom: 16 }}>
      <div className="mv-section">New Carrier Surcharge</div>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--mv-ink-52)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Code</label>
          <input maxLength={4} value={form.code} onChange={e => f('code', e.target.value.toUpperCase())} placeholder="A" style={{ ...inp(), width: '100%', boxSizing: 'border-box', textAlign: 'center', fontWeight: 700, fontSize: 15 }} />
        </div>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--mv-ink-52)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Name</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Fuel and Energy Charge" style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--mv-ink-52)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Charge type</label>
          <select value={form.calc_type} onChange={e => { f('calc_type', e.target.value); if (e.target.value === 'percentage') f('charge_per', 'shipment'); }} style={{ ...sel(), width: '100%' }}>
            <option value="flat">Flat amount (£)</option>
            <option value="percentage">% of base rate</option>
          </select>
        </div>

        {form.calc_type === 'flat' && (
          <div>
            <label style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--mv-ink-52)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Per</label>
            <select value={form.charge_per} onChange={e => f('charge_per', e.target.value)} style={{ ...sel(), width: '100%' }}>
              <option value="shipment">Shipment</option>
              <option value="parcel">Parcel</option>
            </select>
          </div>
        )}

        <div>
          <label style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--mv-ink-52)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{form.calc_type === 'percentage' ? 'Rate (%)' : 'Amount (£)'}</label>
          <input type="number" step="0.01" value={form.default_value} onChange={e => f('default_value', e.target.value)} placeholder="0.00" style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--mv-ink-52)', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Applies when</label>
          <div className="mv-chips">
            {[['always', 'Always (Auto)'], ['reconciliation', 'Code-only (Reconcile)']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => f('applies_when', val)}
                className={`mv-chip ${form.applies_when === val ? 'is-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--mv-ink-52)', fontWeight: 700, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Effective from</label>
          <input type="date" value={form.effective_date} onChange={e => f('effective_date', e.target.value)} style={{ ...inp(), width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--mv-hairline)' }}>
        <button type="button" onClick={onDone} className="mv-btn mv-btn-secondary" style={{ padding: '6px 14px' }}>Cancel</button>
        <button type="button" onClick={() => create.mutate()} disabled={!form.code || !form.name || !form.default_value || create.isPending} className="mv-btn mv-btn-primary" style={{ padding: '6px 16px' }}>
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

  if (isLoading) return <div style={{ color: 'var(--mv-ink-52)', fontSize: 13, padding: '24px 0' }}>Loading surcharges…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div className="mv-section">SURCHARGE SCHEDULE · {courierCode}</div>
          <p className="mv-blurb" style={{ margin: 0 }}>
            Automatic surcharges apply on every matching shipment. Code-only surcharges match against weekly carrier invoices during reconciliation.
          </p>
        </div>
        <button onClick={() => setAdding(a => !a)} className="mv-btn mv-btn-primary">
          <Plus size={12} /> Add surcharge
        </button>
      </div>

      {adding && <AddSurchargeForm courierId={courierId} onDone={() => setAdding(false)} />}

      {surcharges.length === 0 && !adding && (
        <div style={{ textAlign: 'center', color: 'var(--mv-ink-45)', padding: '48px 0', fontSize: 13 }}>No surcharges configured yet for {courierCode}.</div>
      )}

      {/* Table */}
      {surcharges.length > 0 && (
        <table className="mv-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Code</th>
              <th>Name</th>
              <th style={{ width: 180 }}>Calc / Rate</th>
              <th style={{ width: 140 }}>Application</th>
              <th style={{ width: 120 }}>Effective</th>
              <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {surcharges.map(s => (
              <>
                {/* Main row */}
                <tr key={s.id} style={{ opacity: s.active ? 1 : 0.45, cursor: 'pointer' }} onClick={() => { if (editing !== s.id) toggleExpand(s.id); }}>
                  <td>
                    <span className="mv-num" style={{ fontWeight: 800, fontSize: 13, color: 'var(--mv-purple)' }}>
                      {s.code}
                    </span>
                  </td>

                  <td>
                    {editing === s.id ? (
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} onClick={e => e.stopPropagation()} style={{ ...inp(), width: 220 }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mv-ink)' }}>{s.name}</span>
                        {(s.rules || []).length > 0 && (
                          <span style={{ fontSize: 9.5, letterSpacing: '.1em', fontWeight: 800, padding: '1px 6px', background: 'var(--mv-purple-100)', color: 'var(--mv-purple-700)' }}>
                            {s.rules.length} RULE{s.rules.length > 1 ? 'S' : ''}
                          </span>
                        )}
                        {(s.rules || []).length === 0 && s.applies_when === 'always' && (
                          <span className="mv-status"><span className="mv-status-mark is-settled" /> ALL</span>
                        )}
                      </div>
                    )}
                  </td>

                  <td>
                    {editing === s.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <select value={editForm.calc_type} onChange={e => setEditForm(f => ({ ...f, calc_type: e.target.value }))} style={{ ...sel(), width: 110 }}>
                          <option value="flat">£ flat</option>
                          <option value="percentage">% base</option>
                        </select>
                        {editForm.calc_type === 'flat' && (
                          <select value={editForm.charge_per} onChange={e => setEditForm(f => ({ ...f, charge_per: e.target.value }))} style={{ ...sel(), width: 90 }}>
                            <option value="shipment">/ ship</option>
                            <option value="parcel">/ pcl</option>
                          </select>
                        )}
                        <input type="number" step="0.01" value={editForm.default_value} onChange={e => setEditForm(f => ({ ...f, default_value: e.target.value }))} style={{ ...inp(), width: 65 }} />
                      </div>
                    ) : (
                      <span className="mv-num" style={{ fontSize: 13, color: 'var(--mv-ink-78)', fontWeight: 600 }}>{formatRate(s)}</span>
                    )}
                  </td>

                  <td onClick={e => e.stopPropagation()}>
                    {editing === s.id ? (
                      <select value={editForm.applies_when} onChange={e => setEditForm(f => ({ ...f, applies_when: e.target.value }))} style={{ ...sel(), width: 120 }}>
                        <option value="always">Always</option>
                        <option value="reconciliation">Code-only</option>
                      </select>
                    ) : s.applies_when === 'always' ? (
                      <span className="mv-status"><span className="mv-status-mark is-settled" /> ALWAYS</span>
                    ) : (
                      <span className="mv-status"><span className="mv-status-mark is-waiting" /> CODE-ONLY</span>
                    )}
                  </td>

                  <td>
                    {editing === s.id ? (
                      <input type="date" value={editForm.effective_date} onChange={e => setEditForm(f => ({ ...f, effective_date: e.target.value }))} onClick={e => e.stopPropagation()} style={{ ...inp(), width: 120 }} />
                    ) : (
                      <span className="mv-num" style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>{formatDate(s.effective_date)}</span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      {editing === s.id ? (
                        <>
                          <button type="button" onClick={() => update.mutate(s.id)} disabled={update.isPending} className="mv-btn mv-btn-primary" style={{ padding: '2px 8px', fontSize: 11 }}>Save</button>
                          <button type="button" onClick={() => setEditing(null)} className="mv-btn mv-btn-secondary" style={{ padding: '2px 6px', fontSize: 11 }}>✕</button>
                        </>
                      ) : (
                        <>
                          {expanded.has(s.id)
                            ? <ChevronDown size={14} color="var(--mv-ink-45)" />
                            : <ChevronRight size={14} color="var(--mv-ink-45)" />
                          }
                          <button onClick={e => { e.stopPropagation(); startEdit(s); }} className="mv-btn mv-btn-secondary" style={{ padding: '3px 7px', fontSize: 11 }}>Edit</button>
                          <button onClick={e => { e.stopPropagation(); toggleActive.mutate(s); }} className="mv-btn mv-btn-secondary" style={{ padding: '3px 7px', fontSize: 11 }} title={s.active ? 'Disable' : 'Enable'}>
                            {s.active ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={e => { e.stopPropagation(); del.mutate(s.id); }} className="mv-btn mv-btn-danger" style={{ padding: '3px 7px' }}><Trash2 size={11} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded rules panel */}
                {expanded.has(s.id) && editing !== s.id && (
                  <tr key={`${s.id}-rules`}>
                    <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
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
