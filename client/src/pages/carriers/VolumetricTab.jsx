/**
 * VolumetricTab — Volumetric divisor rules built on moov.css design system.
 * Ruled tables, zero cards/boxes, clean typography, tabular numerals.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Edit2, Trash2, X } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function VolumetricTab({ courierId }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    divisor: 5000,
    service_type: 'all',
    service_codes: [],
    notes: '',
  });

  const { data: carrier } = useQuery({
    queryKey: ['carrier-detail', courierId],
    queryFn: () => api.get(`/carriers/couriers/${courierId}`).then((r) => r.data),
    enabled: !!courierId,
  });

  const { data: rules = [], isLoading, refetch } = useQuery({
    queryKey: ['volumetric-rules', courierId],
    queryFn: () => api.get(`/carriers/volumetric-rules?courier_id=${courierId}`).then((r) => r.data),
    enabled: !!courierId,
  });

  const addRuleMut = useMutation({
    mutationFn: () =>
      api.post('/carriers/volumetric-rules', {
        courier_id: courierId,
        divisor: parseInt(form.divisor) || 5000,
        service_type: form.service_type,
        service_codes: form.service_codes,
        notes: form.notes,
      }).then((r) => r.data),
    onSuccess: () => {
      setAdding(false);
      setForm({ divisor: 5000, service_type: 'all', service_codes: [], notes: '' });
      refetch();
    },
  });

  const deleteRuleMut = useMutation({
    mutationFn: (id) => api.delete(`/carriers/volumetric-rules/${id}`).then((r) => r.data),
    onSuccess: () => refetch(),
  });

  const services = carrier?.services || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="mv-section" style={{ margin: 0 }}>
            Volumetric Weight Rules ({rules.length})
          </div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-62)', marginTop: 2 }}>
            Formula: <code>(L × W × H) ÷ Divisor</code>. Billable weight evaluates to <code>max(actual_kg, volumetric_kg)</code>.
          </div>
        </div>
        {!adding && (
          <button className="mv-btn mv-btn--primary" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add volumetric rule
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
          <div className="mv-section">New Volumetric Rule</div>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 180px 1fr', gap: 16, marginBottom: 16 }}>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Divisor <span className="req">*</span></label>
              <input
                className="mv-input"
                type="number"
                value={form.divisor}
                onChange={(e) => setForm((f) => ({ ...f, divisor: e.target.value }))}
                placeholder="5000"
                autoFocus
              />
            </div>

            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Service Scope</label>
              <div className="mv-chips" style={{ marginTop: 4 }}>
                {['all', 'domestic', 'international'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`mv-chip ${form.service_type === t ? 'is-on' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, service_type: t }))}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Notes / Description</label>
              <input
                className="mv-input"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Standard international air divisor"
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="mv-label">Assign Specific Services (optional)</label>
            <div className="mv-chips" style={{ marginTop: 4 }}>
              {services.map((s) => {
                const on = form.service_codes.includes(s.service_code);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`mv-chip ${on ? 'is-on' : ''}`}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        service_codes: on
                          ? f.service_codes.filter((c) => c !== s.service_code)
                          : [...f.service_codes, s.service_code],
                      }))
                    }
                  >
                    {s.name} ({s.service_code})
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="mv-btn" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button
              className="mv-btn mv-btn--primary"
              disabled={!form.divisor || addRuleMut.isPending}
              onClick={() => addRuleMut.mutate()}
            >
              <Check size={14} /> Create rule
            </button>
          </div>
        </div>
      )}

      {/* Ruled Table */}
      <table className="mv-table">
        <thead>
          <tr>
            <th>Divisor</th>
            <th>Formula Calculation</th>
            <th>Service Scope</th>
            <th>Assigned Services</th>
            <th>Notes</th>
            <th className="is-right" style={{ width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                Loading volumetric rules…
              </td>
            </tr>
          ) : rules.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                No volumetric rules configured for this carrier. Defaults to actual physical weight.
              </td>
            </tr>
          ) : (
            rules.map((r) => {
              const assigned = r.service_codes || [];
              return (
                <tr key={r.id}>
                  {/* Divisor */}
                  <td>
                    <span
                      className="mv-num"
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--mv-purple)',
                      }}
                    >
                      ÷ {r.divisor}
                    </span>
                  </td>

                  {/* Formula */}
                  <td>
                    <span className="mv-num" style={{ fontSize: 12, color: 'var(--mv-ink-62)' }}>
                      (L × W × H cm) ÷ {r.divisor} = kg
                    </span>
                  </td>

                  {/* Service Scope */}
                  <td>
                    <span className="mv-cell-strong">
                      {(r.service_type || 'all').toUpperCase()}
                    </span>
                  </td>

                  {/* Assigned Services */}
                  <td>
                    {assigned.length === 0 ? (
                      <span className="mv-cell-dim">All matching services</span>
                    ) : (
                      <div className="mv-chips">
                        {assigned.map((code) => (
                          <span key={code} className="mv-chip is-on" style={{ fontSize: 10, padding: '1px 6px' }}>
                            {code}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Notes */}
                  <td>
                    <span className="mv-cell-dim">{r.notes || '—'}</span>
                  </td>

                  {/* Delete */}
                  <td className="is-right">
                    <button
                      className="mv-btn mv-btn--sm mv-btn--danger"
                      onClick={() => {
                        if (confirm(`Delete volumetric divisor ÷ ${r.divisor}?`)) {
                          deleteRuleMut.mutate(r.id);
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
