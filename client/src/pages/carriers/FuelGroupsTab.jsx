/**
 * FuelGroupsTab — Carrier fuel groups & scheduled adjustments on moov.css.
 * Ruled tables, zero box cards, Archivo typography, tabular numerals.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Edit2, Trash2, Calendar } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function FuelGroupsTab({ carrierId }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    fuel_surcharge_pct: '',
    standard_sell_pct: '',
    next_sell_pct: '',
    next_sell_effective_date: '',
  });

  const { data: groups = [], isLoading, refetch } = useQuery({
    queryKey: ['fuel-groups', carrierId],
    queryFn: () => api.get(`/carriers/couriers/${carrierId}/fuel-groups`).then((r) => r.data),
    enabled: !!carrierId,
  });

  const addGroupMut = useMutation({
    mutationFn: () =>
      api
        .post(`/carriers/couriers/${carrierId}/fuel-groups`, {
          name: form.name,
          fuel_surcharge_pct: parseFloat(form.fuel_surcharge_pct) || 0,
          standard_sell_pct:
            form.standard_sell_pct !== '' ? parseFloat(form.standard_sell_pct) : null,
          next_sell_pct:
            form.next_sell_pct !== '' ? parseFloat(form.next_sell_pct) : null,
          next_sell_effective_date: form.next_sell_effective_date || null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      setAdding(false);
      setForm({
        name: '',
        fuel_surcharge_pct: '',
        standard_sell_pct: '',
        next_sell_pct: '',
        next_sell_effective_date: '',
      });
      refetch();
    },
  });

  const updateGroupMut = useMutation({
    mutationFn: ({ id, data }) =>
      api.patch(`/carriers/fuel-groups/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      setEditId(null);
      refetch();
    },
  });

  const deleteGroupMut = useMutation({
    mutationFn: (id) => api.delete(`/carriers/fuel-groups/${id}`).then((r) => r.data),
    onSuccess: () => refetch(),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="mv-section" style={{ margin: 0 }}>
            Fuel Surcharge Groups ({groups.length})
          </div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-62)', marginTop: 2 }}>
            Manage carrier base cost fuel % vs customer standard sell fuel % schedules.
          </div>
        </div>
        {!adding && (
          <button className="mv-btn mv-btn--primary" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add fuel group
          </button>
        )}
      </div>

      {/* Add Fuel Group Drawer */}
      {adding && (
        <div
          style={{
            background: 'var(--mv-surface)',
            padding: '20px 24px',
            marginBottom: 24,
            borderBottom: '2px solid var(--mv-purple)',
          }}
        >
          <div className="mv-section">New Fuel Surcharge Group</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr', gap: 14, marginBottom: 16 }}>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Group Name <span className="req">*</span></label>
              <input
                className="mv-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Domestic Road, Air Express"
                autoFocus
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Carrier Cost % <span className="req">*</span></label>
              <input
                className="mv-input"
                type="number"
                step="0.01"
                value={form.fuel_surcharge_pct}
                onChange={(e) => setForm((f) => ({ ...f, fuel_surcharge_pct: e.target.value }))}
                placeholder="3.70"
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Standard Sell %</label>
              <input
                className="mv-input"
                type="number"
                step="0.01"
                value={form.standard_sell_pct}
                onChange={(e) => setForm((f) => ({ ...f, standard_sell_pct: e.target.value }))}
                placeholder="7.50"
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Scheduled Next %</label>
              <input
                className="mv-input"
                type="number"
                step="0.01"
                value={form.next_sell_pct}
                onChange={(e) => setForm((f) => ({ ...f, next_sell_pct: e.target.value }))}
                placeholder="8.00"
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Effective Date</label>
              <input
                className="mv-input"
                type="date"
                value={form.next_sell_effective_date}
                onChange={(e) => setForm((f) => ({ ...f, next_sell_effective_date: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="mv-btn" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button
              className="mv-btn mv-btn--primary"
              disabled={!form.name.trim() || form.fuel_surcharge_pct === '' || addGroupMut.isPending}
              onClick={() => addGroupMut.mutate()}
            >
              <Check size={14} /> Create group
            </button>
          </div>
        </div>
      )}

      {/* Ruled Table */}
      <table className="mv-table">
        <thead>
          <tr>
            <th>Group Name</th>
            <th className="is-right">Carrier Cost Fuel %</th>
            <th className="is-right">Standard Sell Fuel %</th>
            <th>Scheduled Rate Change</th>
            <th className="is-right" style={{ width: 100 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                Loading fuel groups…
              </td>
            </tr>
          ) : groups.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                No fuel groups configured. Click <strong>Add fuel group</strong> to create one.
              </td>
            </tr>
          ) : (
            groups.map((g) => {
              const isEditing = editId === g.id;
              const hasScheduled = g.next_sell_pct != null && g.next_sell_effective_date;

              if (isEditing) {
                return (
                  <tr key={g.id} style={{ background: 'var(--mv-surface)' }}>
                    <td>
                      <input
                        className="mv-input"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        style={{ fontSize: 13 }}
                      />
                    </td>
                    <td className="is-right">
                      <input
                        className="mv-input"
                        type="number"
                        step="0.01"
                        value={form.fuel_surcharge_pct}
                        onChange={(e) => setForm((f) => ({ ...f, fuel_surcharge_pct: e.target.value }))}
                        style={{ width: 70, textAlign: 'right' }}
                      />
                    </td>
                    <td className="is-right">
                      <input
                        className="mv-input"
                        type="number"
                        step="0.01"
                        value={form.standard_sell_pct}
                        onChange={(e) => setForm((f) => ({ ...f, standard_sell_pct: e.target.value }))}
                        style={{ width: 70, textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="mv-input"
                          type="number"
                          step="0.01"
                          placeholder="Next %"
                          value={form.next_sell_pct}
                          onChange={(e) => setForm((f) => ({ ...f, next_sell_pct: e.target.value }))}
                          style={{ width: 65 }}
                        />
                        <input
                          className="mv-input"
                          type="date"
                          value={form.next_sell_effective_date}
                          onChange={(e) => setForm((f) => ({ ...f, next_sell_effective_date: e.target.value }))}
                          style={{ width: 130 }}
                        />
                      </div>
                    </td>
                    <td className="is-right">
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          className="mv-btn mv-btn--sm mv-btn--primary"
                          onClick={() =>
                            updateGroupMut.mutate({
                              id: g.id,
                              data: {
                                name: form.name,
                                fuel_surcharge_pct: parseFloat(form.fuel_surcharge_pct) || 0,
                                standard_sell_pct:
                                  form.standard_sell_pct !== '' ? parseFloat(form.standard_sell_pct) : null,
                                next_sell_pct:
                                  form.next_sell_pct !== '' ? parseFloat(form.next_sell_pct) : null,
                                next_sell_effective_date: form.next_sell_effective_date || null,
                              },
                            })
                          }
                          style={{ padding: '0 8px' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          className="mv-btn mv-btn--sm"
                          onClick={() => setEditId(null)}
                          style={{ padding: '0 8px' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={g.id}>
                  {/* Name */}
                  <td>
                    <div className="mv-cell-strong">{g.name}</div>
                  </td>

                  {/* Cost Fuel % */}
                  <td className="is-right">
                    <span
                      className="mv-num"
                      style={{
                        fontWeight: 700,
                        color: 'var(--mv-teal-deep)',
                      }}
                    >
                      {parseFloat(g.fuel_surcharge_pct || 0).toFixed(2)}%
                    </span>
                  </td>

                  {/* Standard Sell Fuel % */}
                  <td className="is-right">
                    {g.standard_sell_pct != null ? (
                      <span
                        className="mv-num"
                        style={{
                          fontWeight: 800,
                          color: 'var(--mv-green-deep)',
                        }}
                      >
                        {parseFloat(g.standard_sell_pct).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="mv-cell-dim">—</span>
                    )}
                  </td>

                  {/* Scheduled */}
                  <td>
                    {hasScheduled ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <Calendar size={12} style={{ color: 'var(--mv-purple)' }} />
                        <span className="mv-num" style={{ fontWeight: 700, color: 'var(--mv-purple)' }}>
                          {parseFloat(g.next_sell_pct).toFixed(2)}%
                        </span>
                        <span className="mv-cell-dim">from {g.next_sell_effective_date.substring(0, 10)}</span>
                      </div>
                    ) : (
                      <span className="mv-cell-dim">None scheduled</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="is-right">
                    <button
                      className="mv-btn mv-btn--sm"
                      onClick={() => {
                        setForm({
                          name: g.name,
                          fuel_surcharge_pct: String(g.fuel_surcharge_pct ?? ''),
                          standard_sell_pct: String(g.standard_sell_pct ?? ''),
                          next_sell_pct: String(g.next_sell_pct ?? ''),
                          next_sell_effective_date: g.next_sell_effective_date
                            ? g.next_sell_effective_date.substring(0, 10)
                            : '',
                        });
                        setEditId(g.id);
                      }}
                      style={{ padding: '0 8px', marginRight: 4 }}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      className="mv-btn mv-btn--sm mv-btn--danger"
                      onClick={() => {
                        if (confirm(`Delete fuel group "${g.name}"?`)) {
                          deleteGroupMut.mutate(g.id);
                        }
                      }}
                      style={{ padding: '0 8px' }}
                    >
                      <Trash2 size={11} />
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
