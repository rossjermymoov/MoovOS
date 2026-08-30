/**
 * CustomerRcTemplatesTab — Customer sell-rate templates built on moov.css design system.
 * Ruled tables, zero cards/boxes, markup margin calculation, tabular figures.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, ArrowRight, RefreshCw, Edit2 } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function CustomerRcTemplatesTab({ courierCode, courierName }) {
  const qc = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    tier: 'standard',
    default_markup_pct: '25.0',
  });

  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-rc-templates', courierCode],
    queryFn: () => api.get(`/customer-rate-cards/templates?courier=${courierCode}`).then((r) => r.data),
    enabled: !!courierCode,
  });

  const { data: templateDetail, isLoading: loadingDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['customer-rc-template-detail', selectedTemplateId],
    queryFn: () => api.get(`/customer-rate-cards/templates/${selectedTemplateId}`).then((r) => r.data),
    enabled: !!selectedTemplateId,
  });

  const addTemplateMut = useMutation({
    mutationFn: () =>
      api.post('/customer-rate-cards/templates', {
        courier_code: courierCode,
        name: form.name,
        description: form.description,
        tier: form.tier,
        default_markup_pct: parseFloat(form.default_markup_pct) || 20,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setAddingTemplate(false);
      setForm({ name: '', description: '', tier: 'standard', default_markup_pct: '25.0' });
      refetch();
      if (data?.id) setSelectedTemplateId(data.id);
    },
  });

  const deleteTemplateMut = useMutation({
    mutationFn: (id) => api.delete(`/customer-rate-cards/templates/${id}`).then((r) => r.data),
    onSuccess: () => {
      setSelectedTemplateId(null);
      refetch();
    },
  });

  const syncCostsMut = useMutation({
    mutationFn: (templateId) =>
      api.post(`/customer-rate-cards/templates/${templateId}/sync-costs`).then((r) => r.data),
    onSuccess: () => refetchDetail(),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="mv-section" style={{ margin: 0 }}>
            Customer Rate Card Templates ({templates.length})
          </div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-62)', marginTop: 2 }}>
            Predefined sell-rate cards with profit margin markups for quick client onboarding.
          </div>
        </div>
        {!addingTemplate && (
          <button className="mv-btn mv-btn--primary" onClick={() => setAddingTemplate(true)}>
            <Plus size={14} /> New template
          </button>
        )}
      </div>

      {/* Add Template Drawer */}
      {addingTemplate && (
        <div
          style={{
            background: 'var(--mv-surface)',
            padding: '20px 24px',
            marginBottom: 24,
            borderBottom: '2px solid var(--mv-purple)',
          }}
        >
          <div className="mv-section">New Customer Pricing Template</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Template Name <span className="req">*</span></label>
              <input
                className="mv-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Standard High-Volume 25% Markup"
                autoFocus
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Tier</label>
              <div className="mv-chips" style={{ marginTop: 4 }}>
                {['standard', 'growth', 'enterprise'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`mv-chip ${form.tier === t ? 'is-on' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, tier: t }))}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Default Markup %</label>
              <input
                className="mv-input"
                type="number"
                step="0.1"
                value={form.default_markup_pct}
                onChange={(e) => setForm((f) => ({ ...f, default_markup_pct: e.target.value }))}
                placeholder="25.0"
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Description</label>
              <input
                className="mv-input"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Standard rates for 500+ shipments/mo"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="mv-btn" onClick={() => setAddingTemplate(false)}>
              Cancel
            </button>
            <button
              className="mv-btn mv-btn--primary"
              disabled={!form.name.trim() || addTemplateMut.isPending}
              onClick={() => addTemplateMut.mutate()}
            >
              <Check size={14} /> Create template
            </button>
          </div>
        </div>
      )}

      {/* Ruled Templates Table */}
      <table className="mv-table">
        <thead>
          <tr>
            <th>Template Name</th>
            <th>Tier</th>
            <th className="is-right">Markup %</th>
            <th>Description</th>
            <th className="is-right" style={{ width: 140 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                Loading customer templates…
              </td>
            </tr>
          ) : templates.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                No customer rate card templates configured for {courierName}.
              </td>
            </tr>
          ) : (
            templates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <tr
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(isSelected ? null : tpl.id)}
                  style={{ background: isSelected ? 'var(--mv-surface)' : undefined }}
                >
                  {/* Name */}
                  <td>
                    <div className="mv-cell-strong">{tpl.name}</div>
                  </td>

                  {/* Tier */}
                  <td>
                    <span
                      className="mv-chip is-on"
                      style={{
                        fontSize: 10,
                        padding: '2px 7px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      {tpl.tier || 'STANDARD'}
                    </span>
                  </td>

                  {/* Markup % */}
                  <td className="is-right">
                    <span
                      className="mv-num"
                      style={{
                        fontWeight: 800,
                        color: 'var(--mv-green-deep)',
                      }}
                    >
                      +{parseFloat(tpl.default_markup_pct || 0).toFixed(1)}%
                    </span>
                  </td>

                  {/* Description */}
                  <td>
                    <span className="mv-cell-dim">{tpl.description || '—'}</span>
                  </td>

                  {/* Actions */}
                  <td className="is-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="mv-btn mv-btn--sm"
                      onClick={() => syncCostsMut.mutate(tpl.id)}
                      title="Sync base carrier costs"
                      style={{ padding: '0 8px', marginRight: 4 }}
                    >
                      <RefreshCw size={11} /> Sync
                    </button>
                    <button
                      className="mv-btn mv-btn--sm mv-btn--danger"
                      onClick={() => {
                        if (confirm(`Delete template "${tpl.name}"?`)) {
                          deleteTemplateMut.mutate(tpl.id);
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
