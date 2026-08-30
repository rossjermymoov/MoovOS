/**
 * WeightBandsTable — Zone Weight Bands & Tier Rates built on moov.css design system.
 * Ruled tables, zero cards/boxes, tabular numerals, inline editing.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Check, Trash2, X, Edit2 } from 'lucide-react';
import { carriersApi } from '../../api/carriers';

export default function WeightBandsTable({ zoneId, bands = [], onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [bandType, setBandType] = useState(null); // null | 'flat' | 'per_kg'
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [form, setForm] = useState({
    name: '',
    min_weight_kg: '',
    max_weight_kg: '',
    price_first: '',
    price_sub: '',
    cost_per_kg: '',
  });

  function openAdding() {
    setAdding(true);
    setBandType(null);
    setForm({
      name: '',
      min_weight_kg: '',
      max_weight_kg: '',
      price_first: '',
      price_sub: '',
      cost_per_kg: '',
    });
  }

  function cancelAdding() {
    setAdding(false);
    setBandType(null);
  }

  const addBand = useMutation({
    mutationFn: () => {
      const payload = { zone_id: zoneId, name: form.name?.trim() || null };
      payload.min_weight_kg = parseFloat(form.min_weight_kg);
      payload.max_weight_kg = parseFloat(form.max_weight_kg);
      if (bandType === 'per_kg') {
        payload.price_first = 0;
        payload.price_sub = null;
        payload.cost_per_kg = parseFloat(form.cost_per_kg);
        payload.cost_per_kg_threshold_kg = parseFloat(form.min_weight_kg);
      } else {
        payload.price_first = parseFloat(form.price_first);
        payload.price_sub = form.price_sub !== '' ? parseFloat(form.price_sub) : null;
        payload.cost_per_kg = form.cost_per_kg !== '' ? parseFloat(form.cost_per_kg) : null;
        payload.cost_per_kg_threshold_kg = form.cost_per_kg !== '' ? parseFloat(form.max_weight_kg) : null;
      }
      return carriersApi.createWeightBand(payload);
    },
    onSuccess: () => {
      cancelAdding();
      onRefresh();
    },
  });

  const renameBand = useMutation({
    mutationFn: ({ id, name }) => carriersApi.updateWeightBand(id, { name }),
    onSuccess: () => {
      setEditId(null);
      setEditVal('');
      onRefresh();
    },
  });

  const delBand = useMutation({
    mutationFn: (id) => carriersApi.deleteWeightBand(id),
    onSuccess: onRefresh,
  });

  const sortedBands = [...bands].sort(
    (a, b) => parseFloat(a.min_weight_kg) - parseFloat(b.min_weight_kg)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="mv-section" style={{ margin: 0 }}>
          Weight Bands & Rates ({bands.length})
        </div>
        {!adding && (
          <button className="mv-btn mv-btn--sm" onClick={openAdding}>
            <Plus size={12} /> Add weight band
          </button>
        )}
      </div>

      {/* Add band wizard */}
      {adding && (
        <div
          style={{
            background: 'var(--mv-surface)',
            padding: '16px 20px',
            marginBottom: 16,
            borderBottom: '2px solid var(--mv-purple)',
          }}
        >
          {bandType === null ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mv-ink)', marginBottom: 10 }}>
                Select Rate Structure:
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="mv-btn mv-btn--primary"
                  onClick={() => setBandType('flat')}
                >
                  Flat Rate (e.g. Up to 5kg: £4.50)
                </button>
                <button
                  type="button"
                  className="mv-btn mv-btn--secondary"
                  onClick={() => setBandType('per_kg')}
                >
                  Pure Per-KG (e.g. 0–30kg @ £0.25/kg)
                </button>
                <button type="button" className="mv-btn" onClick={cancelAdding}>
                  Cancel
                </button>
              </div>
            </div>
          ) : bandType === 'flat' ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-purple)', textTransform: 'uppercase', marginBottom: 12 }}>
                New Flat Rate Band
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Name / Label</label>
                  <input
                    className="mv-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Standard 0-5kg"
                    autoFocus
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Min Wt (kg) <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.1"
                    value={form.min_weight_kg}
                    onChange={(e) => setForm((f) => ({ ...f, min_weight_kg: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Max Wt (kg) <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.1"
                    value={form.max_weight_kg}
                    onChange={(e) => setForm((f) => ({ ...f, max_weight_kg: e.target.value }))}
                    placeholder="5.0"
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">1st Parcel (£) <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.01"
                    value={form.price_first}
                    onChange={(e) => setForm((f) => ({ ...f, price_first: e.target.value }))}
                    placeholder="4.50"
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Sub Parcel (£)</label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.01"
                    value={form.price_sub}
                    onChange={(e) => setForm((f) => ({ ...f, price_sub: e.target.value }))}
                    placeholder="3.75"
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">£/kg Overage</label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.01"
                    value={form.cost_per_kg}
                    onChange={(e) => setForm((f) => ({ ...f, cost_per_kg: e.target.value }))}
                    placeholder="0.20"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="mv-btn" onClick={cancelAdding}>
                  Cancel
                </button>
                <button
                  className="mv-btn mv-btn--primary"
                  disabled={
                    form.min_weight_kg === '' ||
                    form.max_weight_kg === '' ||
                    form.price_first === '' ||
                    addBand.isPending
                  }
                  onClick={() => addBand.mutate()}
                >
                  <Check size={14} /> Save Flat Band
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-teal-deep)', textTransform: 'uppercase', marginBottom: 12 }}>
                New Pure Per-KG Rate
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Name / Label</label>
                  <input
                    className="mv-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Heavy Freight Per-KG"
                    autoFocus
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Min Wt (kg) <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.1"
                    value={form.min_weight_kg}
                    onChange={(e) => setForm((f) => ({ ...f, min_weight_kg: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Max Wt (kg) <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.1"
                    value={form.max_weight_kg}
                    onChange={(e) => setForm((f) => ({ ...f, max_weight_kg: e.target.value }))}
                    placeholder="100.0"
                  />
                </div>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Rate Per KG (£) <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.01"
                    value={form.cost_per_kg}
                    onChange={(e) => setForm((f) => ({ ...f, cost_per_kg: e.target.value }))}
                    placeholder="0.35"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="mv-btn" onClick={cancelAdding}>
                  Cancel
                </button>
                <button
                  className="mv-btn mv-btn--primary"
                  disabled={
                    form.min_weight_kg === '' ||
                    form.max_weight_kg === '' ||
                    form.cost_per_kg === '' ||
                    addBand.isPending
                  }
                  onClick={() => addBand.mutate()}
                >
                  <Check size={14} /> Save Per-KG Rate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ruled Table */}
      {sortedBands.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--mv-ink-45)', fontStyle: 'italic' }}>
          No weight bands defined for this zone yet.
        </div>
      ) : (
        <table className="mv-table">
          <thead>
            <tr>
              <th>Band / Tier Name</th>
              <th>Weight Range</th>
              <th className="is-right">1st Parcel</th>
              <th className="is-right">Subsequent</th>
              <th className="is-right">£/kg Overage</th>
              <th className="is-right" style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedBands.map((b) => {
              const pFirst = parseFloat(b.price_first || 0);
              const pSub = parseFloat(b.price_sub || 0);
              const pKg = parseFloat(b.cost_per_kg || 0);

              return (
                <tr key={b.id}>
                  {/* Name */}
                  <td>
                    {editId === b.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="mv-input"
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          autoFocus
                          onKeyDown={(e) =>
                            e.key === 'Enter' && renameBand.mutate({ id: b.id, name: editVal })
                          }
                          style={{ fontSize: 13 }}
                        />
                        <button
                          className="mv-btn mv-btn--sm mv-btn--primary"
                          onClick={() => renameBand.mutate({ id: b.id, name: editVal })}
                          style={{ padding: '0 6px' }}
                        >
                          <Check size={11} />
                        </button>
                        <button
                          className="mv-btn mv-btn--sm"
                          onClick={() => setEditId(null)}
                          style={{ padding: '0 6px' }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                        onClick={() => {
                          setEditId(b.id);
                          setEditVal(b.name || '');
                        }}
                      >
                        <span className="mv-cell-strong">{b.name || 'Unnamed Band'}</span>
                        <Edit2 size={11} style={{ color: 'var(--mv-ink-45)', opacity: 0.6 }} />
                      </div>
                    )}
                  </td>

                  {/* Weight Range */}
                  <td>
                    <span className="mv-num">
                      {parseFloat(b.min_weight_kg).toFixed(1)} – {parseFloat(b.max_weight_kg).toFixed(1)} kg
                    </span>
                  </td>

                  {/* 1st Parcel Price */}
                  <td className="is-right">
                    <span
                      className="mv-num"
                      style={{
                        fontWeight: 800,
                        color: pFirst > 0 ? 'var(--mv-green-deep)' : 'var(--mv-ink-45)',
                      }}
                    >
                      £{pFirst.toFixed(2)}
                    </span>
                  </td>

                  {/* Sub Parcel Price */}
                  <td className="is-right">
                    {pSub > 0 ? (
                      <span className="mv-num" style={{ color: 'var(--mv-purple)' }}>
                        £{pSub.toFixed(2)}
                      </span>
                    ) : (
                      <span className="mv-cell-dim">—</span>
                    )}
                  </td>

                  {/* Per-KG Overage */}
                  <td className="is-right">
                    {pKg > 0 ? (
                      <span className="mv-num" style={{ color: 'var(--mv-teal-deep)' }}>
                        £{pKg.toFixed(2)}/kg
                      </span>
                    ) : (
                      <span className="mv-cell-dim">—</span>
                    )}
                  </td>

                  {/* Delete */}
                  <td className="is-right">
                    <button
                      className="mv-btn mv-btn--sm mv-btn--danger"
                      onClick={() => {
                        if (confirm('Delete this weight band?')) {
                          delBand.mutate(b.id);
                        }
                      }}
                      style={{ padding: '0 6px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
