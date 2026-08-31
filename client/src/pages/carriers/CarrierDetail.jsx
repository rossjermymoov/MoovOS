/**
 * CarrierDetail — Level 2 Carrier View rebuilt on moov.css design system.
 * Ruled tables, zero cards/boxes, clean typography, underline inputs, chip pickers.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Check, Trash2, GripVertical, ArrowRight,
  Phone, Mail, Users,
} from 'lucide-react';
import axios from 'axios';
import { carriersApi } from '../../api/carriers';
import CourierLogo from '../../components/common/CourierLogo';
import SurchargesTab from './SurchargesTab';
import FuelGroupsTab from './FuelGroupsTab';
import VolumetricTab from './VolumetricTab';
import CarrierRateCardsTab from './CarrierRateCardsTab';
import CustomerRcTemplatesTab from './CustomerRcTemplatesTab';

const api = axios.create({ baseURL: '/api' });

export default function CarrierDetail({ carrierId, onBack, onDrillService }) {
  const qc = useQueryClient();
  const [addingService, setAddingService] = useState(false);
  const [carrierTab, setCarrierTab] = useState('services');
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    service_code: '',
    name: '',
    service_type: 'domestic',
    fuel_surcharge_pct: '',
  });

  const { data: carrier, isLoading, refetch } = useQuery({
    queryKey: ['carrier-detail', carrierId],
    queryFn: () => api.get(`/carriers/couriers/${carrierId}`).then((r) => r.data),
    enabled: !!carrierId,
  });

  const { data: fuelGroups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['fuel-groups', carrierId],
    queryFn: () => api.get(`/carriers/couriers/${carrierId}/fuel-groups`).then((r) => r.data),
    enabled: !!carrierId,
  });

  const { data: surcharges = [], refetch: refetchSurcharges } = useQuery({
    queryKey: ['surcharges-carrier', carrierId],
    queryFn: () => api.get(`/surcharges?courier_id=${carrierId}`).then((r) => r.data),
    enabled: !!carrierId,
  });

  const refetchAll = () => {
    refetch();
    refetchGroups();
    refetchSurcharges();
  };

  const addServiceMut = useMutation({
    mutationFn: () => carriersApi.createService({ ...serviceForm, courier_id: carrierId }),
    onSuccess: () => {
      setAddingService(false);
      setServiceForm({ service_code: '', name: '', service_type: 'domestic', fuel_surcharge_pct: '' });
      refetch();
    },
  });

  const updateServiceField = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/carriers/services/${id}`, data).then((r) => r.data),
    onSuccess: refetchAll,
  });

  const delServiceMut = useMutation({
    mutationFn: (id) => carriersApi.deleteService(id),
    onSuccess: refetch,
  });

  const reorderMut = useMutation({
    mutationFn: (ids) =>
      api.put(`/carriers/couriers/${carrierId}/services/reorder`, { service_ids: ids }).then((r) => r.data),
    onSuccess: refetch,
  });

  const onDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== overIdx) setOverIdx(idx);
  };
  const onDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const ids = carrier.services.map((s) => s.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(idx, 0, moved);
    reorderMut.mutate(ids);
    setDragIdx(null);
    setOverIdx(null);
  };
  const onDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  if (isLoading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-45)' }}>Loading carrier profile…</div>;
  }
  if (!carrier) return null;

  const services = carrier.services || [];

  const tabs = [
    { key: 'services', label: `Services (${services.length})` },
    { key: 'rate-cards', label: 'Cost Rate Cards' },
    { key: 'crc-templates', label: 'Customer Rate Card Templates' },
    { key: 'fuel', label: `Fuel Groups (${fuelGroups.length})` },
    { key: 'surcharges', label: `Surcharges (${surcharges.length})` },
    { key: 'volumetric', label: 'Volumetric Rules' },
  ];

  return (
    <div>
      {/* Top Breadcrumbs & Actions */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="mv-btn mv-btn--sm"
          onClick={onBack}
          style={{ marginBottom: 14 }}
        >
          <ArrowLeft size={13} /> Back to Carriers
        </button>

        <div className="mv-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 58,
                height: 44,
                background: '#ffffff',
                border: '1px solid var(--mv-hairline-2, #e5e7eb)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <CourierLogo courier={carrier.code || carrier.name} size={34} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 className="mv-title" style={{ margin: 0 }}>{carrier.name}</h1>
                <span
                  className="mv-chip"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    color: 'var(--mv-purple)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  {carrier.code}
                </span>
              </div>
              <p className="mv-blurb" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {carrier.primary_contact_name ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Users size={13} style={{ color: 'var(--mv-purple)' }} />
                    <strong>{carrier.primary_contact_name}</strong>
                    {carrier.primary_contact_email && <span style={{ color: 'var(--mv-ink-50)' }}>({carrier.primary_contact_email})</span>}
                    {carrier.primary_contact_phone && <span style={{ color: 'var(--mv-teal-deep)' }}>· {carrier.primary_contact_phone}</span>}
                  </span>
                ) : (
                  <span style={{ color: 'var(--mv-ink-40)' }}>Direct Courier Integration</span>
                )}
              </p>
            </div>
          </div>
          <div className="mv-actions">
            {carrierTab === 'services' && (
              <button
                className="mv-btn mv-btn--primary"
                onClick={() => setAddingService((a) => !a)}
              >
                <Plus size={14} /> Add service
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mv-rule" />

      {/* Tabs */}
      <div className="mv-tabs" style={{ marginTop: 14, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setCarrierTab(t.key)}
            className={`mv-tab ${carrierTab === t.key ? 'is-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Services ── */}
      {carrierTab === 'services' && (
        <div style={{ marginTop: 20 }}>
          {/* Add Service Drawer */}
          {addingService && (
            <div
              style={{
                background: 'var(--mv-surface)',
                padding: '20px 24px',
                marginBottom: 24,
                borderBottom: '2px solid var(--mv-purple)',
              }}
            >
              <div className="mv-section">New Service Route</div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 2fr 140px 140px', gap: 16, marginBottom: 16 }}>
                <div className="mv-field">
                  <label className="mv-label">Service Code <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    value={serviceForm.service_code}
                    onChange={(e) => setServiceForm((f) => ({ ...f, service_code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. DPD-12"
                    autoFocus
                  />
                </div>
                <div className="mv-field">
                  <label className="mv-label">Service Name <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. DPD Next Day (Standard)"
                  />
                </div>
                <div className="mv-field">
                  <label className="mv-label">Type</label>
                  <div className="mv-chips" style={{ marginTop: 4 }}>
                    <button
                      type="button"
                      className={`mv-chip ${serviceForm.service_type === 'domestic' ? 'is-on' : ''}`}
                      onClick={() => setServiceForm((f) => ({ ...f, service_type: 'domestic' }))}
                    >
                      Domestic
                    </button>
                    <button
                      type="button"
                      className={`mv-chip ${serviceForm.service_type === 'international' ? 'is-on' : ''}`}
                      onClick={() => setServiceForm((f) => ({ ...f, service_type: 'international' }))}
                    >
                      Intl
                    </button>
                  </div>
                </div>
                <div className="mv-field">
                  <label className="mv-label">Fuel Surcharge %</label>
                  <input
                    className="mv-input"
                    type="number"
                    step="0.01"
                    value={serviceForm.fuel_surcharge_pct}
                    onChange={(e) => setServiceForm((f) => ({ ...f, fuel_surcharge_pct: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="mv-btn" onClick={() => setAddingService(false)}>
                  Cancel
                </button>
                <button
                  className="mv-btn mv-btn--primary"
                  disabled={!serviceForm.service_code.trim() || !serviceForm.name.trim() || addServiceMut.isPending}
                  onClick={() => addServiceMut.mutate()}
                >
                  <Check size={14} /> Create service
                </button>
              </div>
            </div>
          )}

          {/* Ruled Services Table */}
          <table className="mv-table">
            <thead>
              <tr>
                <th style={{ width: 4 }}></th>
                <th style={{ width: 30 }}></th>
                <th>Service Name</th>
                <th>Service Code</th>
                <th>Type</th>
                <th>Classification</th>
                <th>Fuel Surcharge Group</th>
                <th>Zones Configured</th>
                <th className="is-right" style={{ width: 160 }}>Rate Card</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                    No services configured yet for {carrier.name}. Click <strong>Add service</strong> above.
                  </td>
                </tr>
              ) : (
                services.map((svc, idx) => {
                  const nextType =
                    svc.service_type === 'domestic'
                      ? 'international'
                      : svc.service_type === 'international'
                      ? null
                      : 'domestic';

                  return (
                    <tr
                      key={svc.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, idx)}
                      onDragOver={(e) => onDragOver(e, idx)}
                      onDrop={(e) => onDrop(e, idx)}
                      onDragEnd={onDragEnd}
                      onClick={() => onDrillService(svc.id)}
                      style={{
                        opacity: dragIdx === idx ? 0.35 : 1,
                        borderTop:
                          overIdx === idx && dragIdx !== idx
                            ? '2px solid var(--mv-purple)'
                            : undefined,
                      }}
                    >
                      {/* Hover Tick */}
                      <td style={{ padding: 0 }}>
                        <div className="mv-row-tick" />
                      </td>

                      {/* Drag Handle */}
                      <td
                        style={{ padding: '12px 4px', color: 'var(--mv-ink-45)', cursor: 'grab' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical size={13} />
                      </td>

                      {/* Service Name */}
                      <td>
                        <div className="mv-cell-strong">{svc.name}</div>
                        <div className="mv-cell-sub">
                          {svc.zone_count || 0} routing {svc.zone_count === 1 ? 'zone' : 'zones'}
                        </div>
                      </td>

                      {/* Code */}
                      <td>
                        <span
                          className="mv-num"
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '.05em',
                            color: 'var(--mv-purple)',
                          }}
                        >
                          {svc.service_code}
                        </span>
                      </td>

                      {/* Type Toggle Chip */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`mv-chip ${svc.service_type ? 'is-on' : ''}`}
                          style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => updateServiceField.mutate({ id: svc.id, service_type: nextType })}
                          title="Click to cycle: Domestic / International / None"
                        >
                          {svc.service_type === 'domestic'
                            ? 'DOMESTIC'
                            : svc.service_type === 'international'
                            ? 'INTERNATIONAL'
                            : '—'}
                        </button>
                      </td>

                      {/* Bespoke Toggle Chip */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`mv-chip ${svc.is_bespoke ? 'is-on' : ''}`}
                          style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => updateServiceField.mutate({ id: svc.id, is_bespoke: !svc.is_bespoke })}
                          title="Toggle standard vs bespoke pricing"
                        >
                          {svc.is_bespoke ? 'BESPOKE' : 'STANDARD'}
                        </button>
                      </td>

                      {/* Fuel Group select */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={svc.fuel_group_id ?? ''}
                          onChange={(e) =>
                            updateServiceField.mutate({
                              id: svc.id,
                              fuel_group_id: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--mv-hairline-2)',
                            fontSize: 12,
                            color: 'var(--mv-ink)',
                            padding: '3px 0',
                            fontFamily: 'inherit',
                          }}
                        >
                          <option value="">— None —</option>
                          {fuelGroups.map((fg) => (
                            <option key={fg.id} value={fg.id}>
                              {fg.name} ({parseFloat(fg.fuel_surcharge_pct).toFixed(1)}%)
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Zones */}
                      <td>
                        <span className="mv-num" style={{ fontWeight: 600 }}>
                          {svc.zone_count || 0}
                        </span>{' '}
                        <span className="mv-cell-dim">
                          zone{svc.zone_count !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Rate Card Matrix Drill */}
                      <td className="is-right">
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--mv-purple)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          View rate card <ArrowRight size={13} />
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="is-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="mv-btn mv-btn--sm mv-btn--danger"
                          onClick={() => {
                            if (confirm(`Delete service "${svc.name}" and all weight bands?`)) {
                              delServiceMut.mutate(svc.id);
                            }
                          }}
                          style={{ padding: '0 6px' }}
                          title="Delete Service"
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
      )}

      {/* ── TAB: Cost Rate Cards ── */}
      {carrierTab === 'rate-cards' && (
        <div style={{ marginTop: 20 }}>
          <CarrierRateCardsTab courierId={carrier.id} courierCode={carrier.code} />
        </div>
      )}

      {/* ── TAB: Customer Rate Card Templates ── */}
      {carrierTab === 'crc-templates' && (
        <div style={{ marginTop: 20 }}>
          <CustomerRcTemplatesTab courierCode={carrier.code} courierName={carrier.name} />
        </div>
      )}

      {/* ── TAB: Fuel Groups ── */}
      {carrierTab === 'fuel' && (
        <div style={{ marginTop: 20 }}>
          <FuelGroupsTab carrierId={carrier.id} />
        </div>
      )}

      {/* ── TAB: Surcharges ── */}
      {carrierTab === 'surcharges' && (
        <div style={{ marginTop: 20 }}>
          <SurchargesTab courierId={carrier.id} courierCode={carrier.code} />
        </div>
      )}

      {/* ── TAB: Volumetric Rules ── */}
      {carrierTab === 'volumetric' && (
        <div style={{ marginTop: 20 }}>
          <VolumetricTab courierId={carrier.id} />
        </div>
      )}
    </div>
  );
}
