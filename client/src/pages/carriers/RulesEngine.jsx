/**
 * RulesEngine — Dynamic routing and surcharge conditions on moov.css.
 * Ruled tables, zero cards/boxes, Archivo typography, tabular numerals.
 */
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Check, Trash2, X, ChevronRight } from 'lucide-react';
import { carriersApi } from '../../api/carriers';

const CHARGE_METHOD_LABELS = {
  fixed: 'Fixed £',
  percentage: 'Percentage %',
  per_kg: 'Per kg £',
  per_parcel: 'Per parcel £',
};

const OPERATORS = [
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'in',
  'not_in',
  'starts_with',
  'contains',
];

export default function RulesEngine({ services = [] }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    courier_service_id: '',
    charge_method: 'fixed',
    charge_value: '',
    is_active: true,
  });
  const [expandedRule, setExpandedRule] = useState(null);
  const [condForm, setCondForm] = useState({
    logic_operator: 'AND',
    json_field_path: '',
    operator: 'equals',
    value: '',
  });

  const { data: rules = [], refetch } = useQuery({
    queryKey: ['carrier-rules'],
    queryFn: carriersApi.getRules,
  });

  const addRule = useMutation({
    mutationFn: () =>
      carriersApi.createRule({
        ...form,
        courier_service_id: form.courier_service_id || null,
        charge_value: parseFloat(form.charge_value) || 0,
      }),
    onSuccess: () => {
      setAdding(false);
      setForm({
        name: '',
        courier_service_id: '',
        charge_method: 'fixed',
        charge_value: '',
        is_active: true,
      });
      refetch();
    },
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, is_active }) => carriersApi.updateRule(id, { is_active }),
    onSuccess: refetch,
  });

  const delRule = useMutation({
    mutationFn: (id) => carriersApi.deleteRule(id),
    onSuccess: refetch,
  });

  const addCond = useMutation({
    mutationFn: (ruleId) => carriersApi.addCondition(ruleId, condForm),
    onSuccess: () => {
      setCondForm({ logic_operator: 'AND', json_field_path: '', operator: 'equals', value: '' });
      refetch();
    },
  });

  const delCond = useMutation({
    mutationFn: (id) => carriersApi.removeCondition(id),
    onSuccess: refetch,
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="mv-section" style={{ margin: 0 }}>
            Routing & Charge Rules ({rules.length})
          </div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-62)', marginTop: 2 }}>
            Evaluate shipment metadata (weight, length, destination, parcels) against customizable charge actions.
          </div>
        </div>
        {!adding && (
          <button className="mv-btn mv-btn--primary" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add rule
          </button>
        )}
      </div>

      {/* Add Rule Drawer */}
      {adding && (
        <div
          style={{
            background: 'var(--mv-surface)',
            padding: '20px 24px',
            marginBottom: 24,
            borderBottom: '2px solid var(--mv-purple)',
          }}
        >
          <div className="mv-section">New Routing / Charge Rule</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Rule Name <span className="req">*</span></label>
              <input
                className="mv-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Overlength > 100cm Surcharge"
                autoFocus
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Target Service</label>
              <select
                className="mv-input"
                value={form.courier_service_id}
                onChange={(e) => setForm((f) => ({ ...f, courier_service_id: e.target.value }))}
              >
                <option value="">All Services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.service_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Charge Method</label>
              <select
                className="mv-input"
                value={form.charge_method}
                onChange={(e) => setForm((f) => ({ ...f, charge_method: e.target.value }))}
              >
                {Object.entries(CHARGE_METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Charge Value <span className="req">*</span></label>
              <input
                className="mv-input"
                type="number"
                step="0.01"
                value={form.charge_value}
                onChange={(e) => setForm((f) => ({ ...f, charge_value: e.target.value }))}
                placeholder="5.00"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="mv-btn" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button
              className="mv-btn mv-btn--primary"
              disabled={!form.name.trim() || form.charge_value === '' || addRule.isPending}
              onClick={() => addRule.mutate()}
            >
              <Check size={14} /> Create rule
            </button>
          </div>
        </div>
      )}

      {/* Ruled Rules Table */}
      <table className="mv-table">
        <thead>
          <tr>
            <th>Rule Name</th>
            <th>Target Service</th>
            <th>Charge Method</th>
            <th className="is-right">Value</th>
            <th>Conditions</th>
            <th>Status</th>
            <th className="is-right" style={{ width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                No custom routing or charge rules configured.
              </td>
            </tr>
          ) : (
            rules.map((rule) => {
              const condCount = (rule.conditions || []).length;
              const isExpanded = expandedRule === rule.id;

              return (
                <tr
                  key={rule.id}
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                  style={{ background: isExpanded ? 'var(--mv-surface)' : undefined }}
                >
                  {/* Name */}
                  <td>
                    <div className="mv-cell-strong" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ChevronRight
                        size={13}
                        style={{
                          color: 'var(--mv-purple)',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.15s',
                        }}
                      />
                      <span>{rule.name}</span>
                    </div>
                  </td>

                  {/* Service */}
                  <td>
                    <span className="mv-cell-dim">
                      {rule.courier_service_name || 'All Services'}
                    </span>
                  </td>

                  {/* Charge Method */}
                  <td>
                    <span className="mv-cell-strong" style={{ textTransform: 'uppercase', fontSize: 11 }}>
                      {CHARGE_METHOD_LABELS[rule.charge_method] || rule.charge_method}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="is-right">
                    <span
                      className="mv-num"
                      style={{
                        fontWeight: 800,
                        color: 'var(--mv-purple)',
                      }}
                    >
                      {rule.charge_method === 'percentage'
                        ? `${parseFloat(rule.charge_value).toFixed(2)}%`
                        : `£${parseFloat(rule.charge_value).toFixed(2)}`}
                    </span>
                  </td>

                  {/* Conditions count */}
                  <td>
                    <span className="mv-num" style={{ fontWeight: 600 }}>
                      {condCount}
                    </span>{' '}
                    <span className="mv-cell-dim">
                      condition{condCount !== 1 ? 's' : ''}
                    </span>
                  </td>

                  {/* Active Switch */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`mv-switch ${rule.is_active ? 'is-on' : ''}`}
                      onClick={() => toggleRule.mutate({ id: rule.id, is_active: !rule.is_active })}
                      title="Toggle active"
                    >
                      <span />
                    </button>
                  </td>

                  {/* Delete */}
                  <td className="is-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="mv-btn mv-btn--sm mv-btn--danger"
                      onClick={() => {
                        if (confirm(`Delete rule "${rule.name}"?`)) {
                          delRule.mutate(rule.id);
                        }
                      }}
                      style={{ padding: '0 6px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
