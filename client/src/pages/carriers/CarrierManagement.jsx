/**
 * CarrierManagement — The courier & carrier directory rebuilt on the MoovOS design system (moov.css).
 * Ruled tables, one status language, KPI figures, Archivo typography, zero boxes/cards.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, ArrowRight, Phone, Mail, Edit2, Trash2,
  Check, X, Users, Sliders, ArrowLeft,
} from 'lucide-react';
import axios from 'axios';
import { carriersApi } from '../../api/carriers';
import CarrierDetail from './CarrierDetail';
import ServiceDetail from './ServiceDetail';
import RulesEngine from './RulesEngine';

const api = axios.create({ baseURL: '/api' });

export default function CarrierManagement() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0); // 0 = Carriers & Contacts, 1 = Routing Rules Engine
  const [selectedCarrier, setSelectedCarrier] = useState(null); // carrier id
  const [selectedService, setSelectedService] = useState(null); // service id
  const [addingCourier, setAddingCourier] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [search, setSearch] = useState('');
  const [courierForm, setCourierForm] = useState({
    code: '',
    name: '',
    account_number: '',
    primary_contact_name: '',
    primary_contact_phone: '',
    primary_contact_email: '',
  });

  const { data: couriers = [], isLoading, refetch } = useQuery({
    queryKey: ['couriers'],
    queryFn: carriersApi.getCouriers,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['carrier-services-all'],
    queryFn: () => carriersApi.getServices(),
  });

  const { data: surcharges = [] } = useQuery({
    queryKey: ['surcharges-all'],
    queryFn: () => api.get('/surcharges').then((r) => r.data),
  });

  const addCourierMut = useMutation({
    mutationFn: () => carriersApi.createCourier(courierForm),
    onSuccess: () => {
      setAddingCourier(false);
      setCourierForm({
        code: '',
        name: '',
        account_number: '',
        primary_contact_name: '',
        primary_contact_phone: '',
        primary_contact_email: '',
      });
      refetch();
    },
  });

  const updateCourierMut = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/carriers/couriers/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      setEditingCourier(null);
      refetch();
    },
  });

  const deleteCourierMut = useMutation({
    mutationFn: (id) => carriersApi.deleteCourier(id),
    onSuccess: () => {
      refetch();
    },
  });

  const selectedCarrierData = couriers.find((c) => c.id === selectedCarrier);

  // ── Drill: Level 3 (Service Detail) ──
  if (selectedService) {
    return (
      <div className="mv-page">
        <div className="mv-page-inner">
          <ServiceDetail
            serviceId={selectedService}
            carrierName={selectedCarrierData?.name || 'Carrier'}
            onBack={() => setSelectedService(null)}
          />
        </div>
      </div>
    );
  }

  // ── Drill: Level 2 (Carrier Detail) ──
  if (selectedCarrier) {
    return (
      <div className="mv-page">
        <div className="mv-page-inner">
          <CarrierDetail
            carrierId={selectedCarrier}
            onBack={() => setSelectedCarrier(null)}
            onDrillService={(id) => setSelectedService(id)}
          />
        </div>
      </div>
    );
  }

  const filteredCouriers = couriers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q) ||
      (c.account_number || '').toLowerCase().includes(q) ||
      (c.primary_contact_name || '').toLowerCase().includes(q)
    );
  });

  const totalServices = services.length;
  const totalSurcharges = surcharges.length;

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        {/* Header */}
        <div className="mv-head">
          <div>
            <div className="mv-kicker">NETWORK</div>
            <h1 className="mv-title">Carriers</h1>
            <p className="mv-blurb">
              {isLoading
                ? 'Loading network couriers…'
                : `${couriers.length} connected carriers, ${totalServices} active service routes, and ${totalSurcharges} surcharge rules.`}
            </p>
          </div>
          <div className="mv-actions">
            {tab === 0 && (
              <button
                className="mv-btn mv-btn--primary"
                onClick={() => {
                  setCourierForm({
                    code: '',
                    name: '',
                    account_number: '',
                    primary_contact_name: '',
                    primary_contact_phone: '',
                    primary_contact_email: '',
                  });
                  setAddingCourier(true);
                }}
              >
                <Plus size={14} /> Add carrier
              </button>
            )}
          </div>
        </div>

        <div className="mv-rule" />

        {/* Figure Strip */}
        <div className="mv-kpis" style={{ marginTop: 20 }}>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Connected Carriers</div>
            <div className="mv-kpi-value mv-num">{couriers.length}</div>
            <div className="mv-kpi-sub">Direct & AGL suppliers</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Active Services</div>
            <div className="mv-kpi-value mv-num">{totalServices}</div>
            <div className="mv-kpi-sub">Domestic & International</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Surcharge Rules</div>
            <div className="mv-kpi-value mv-num">{totalSurcharges}</div>
            <div className="mv-kpi-sub">Fuel, congestion & out-of-area</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Reconciliation</div>
            <div className="mv-kpi-value mv-num">DPD</div>
            <div className="mv-kpi-sub">Primary invoice ledger</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mv-tabs">
          <button
            className={`mv-tab ${tab === 0 ? 'is-active' : ''}`}
            onClick={() => setTab(0)}
          >
            Carriers & Contacts
            <span className="mv-tab-count">({couriers.length})</span>
          </button>
          <button
            className={`mv-tab ${tab === 1 ? 'is-active' : ''}`}
            onClick={() => setTab(1)}
          >
            Routing Rules Engine
          </button>
        </div>

        {/* Tab 0: Carriers Table */}
        {tab === 0 && (
          <div style={{ marginTop: 24 }}>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="mv-search" style={{ width: 280 }}>
                <Search size={14} style={{ color: 'var(--mv-ink-45)' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search carrier, code, or account…"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} style={{ color: 'var(--mv-ink-45)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Create Carrier Drawer / Form */}
            {addingCourier && (
              <div
                style={{
                  background: 'var(--mv-surface)',
                  padding: '20px 24px',
                  marginBottom: 24,
                  borderBottom: '2px solid var(--mv-purple)',
                }}
              >
                <div className="mv-section">New Carrier Integration</div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="mv-field">
                    <label className="mv-label">Code <span className="req">*</span></label>
                    <input
                      className="mv-input"
                      value={courierForm.code}
                      onChange={(e) => setCourierForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="DPD"
                      autoFocus
                    />
                  </div>
                  <div className="mv-field">
                    <label className="mv-label">Display Name <span className="req">*</span></label>
                    <input
                      className="mv-input"
                      value={courierForm.name}
                      onChange={(e) => setCourierForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. DPD (UK)"
                    />
                  </div>
                  <div className="mv-field">
                    <label className="mv-label">Account Number</label>
                    <input
                      className="mv-input"
                      value={courierForm.account_number}
                      onChange={(e) => setCourierForm((f) => ({ ...f, account_number: e.target.value }))}
                      placeholder="e.g. 098234"
                    />
                  </div>
                  <div className="mv-field">
                    <label className="mv-label">Contact Name</label>
                    <input
                      className="mv-input"
                      value={courierForm.primary_contact_name}
                      onChange={(e) => setCourierForm((f) => ({ ...f, primary_contact_name: e.target.value }))}
                      placeholder="Account manager"
                    />
                  </div>
                  <div className="mv-field">
                    <label className="mv-label">Contact Email</label>
                    <input
                      className="mv-input"
                      value={courierForm.primary_contact_email}
                      onChange={(e) => setCourierForm((f) => ({ ...f, primary_contact_email: e.target.value }))}
                      placeholder="rep@carrier.com"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="mv-btn" onClick={() => setAddingCourier(false)}>
                    Cancel
                  </button>
                  <button
                    className="mv-btn mv-btn--primary"
                    disabled={!courierForm.code.trim() || !courierForm.name.trim() || addCourierMut.isPending}
                    onClick={() => addCourierMut.mutate()}
                  >
                    <Check size={14} /> Create carrier
                  </button>
                </div>
              </div>
            )}

            {/* Ruled Carriers Table */}
            <table className="mv-table">
              <thead>
                <tr>
                  <th style={{ width: 4 }}></th>
                  <th>Carrier</th>
                  <th>Account Number</th>
                  <th>Primary Contact</th>
                  <th>Services</th>
                  <th>Status</th>
                  <th className="is-right" style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                      Reading carrier registry…
                    </td>
                  </tr>
                ) : filteredCouriers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                      No carriers matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCouriers.map((c) => {
                    const svcCount = (c.services || []).length;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCarrier(c.id)}
                      >
                        {/* Hover tick */}
                        <td style={{ padding: 0 }}>
                          <div className="mv-row-tick" />
                        </td>

                        {/* Carrier Name & Code */}
                        <td>
                          <div className="mv-cell-strong" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{c.name}</span>
                            <span
                              className="mv-num"
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '.05em',
                                color: 'var(--mv-purple)',
                              }}
                            >
                              {c.code}
                            </span>
                          </div>
                          <div className="mv-cell-sub">
                            {c.notes || 'Direct Courier Integration'}
                          </div>
                        </td>

                        {/* Account Number */}
                        <td>
                          {c.account_number ? (
                            <span className="mv-num" style={{ fontWeight: 600 }}>
                              {c.account_number}
                            </span>
                          ) : (
                            <span className="mv-cell-dim">—</span>
                          )}
                        </td>

                        {/* Primary Contact */}
                        <td>
                          {c.primary_contact_name ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{c.primary_contact_name}</div>
                              <div className="mv-cell-sub" style={{ display: 'flex', gap: 8 }}>
                                {c.primary_contact_phone && (
                                  <span style={{ color: 'var(--mv-teal-deep)' }}>
                                    {c.primary_contact_phone}
                                  </span>
                                )}
                                {c.primary_contact_email && (
                                  <span>{c.primary_contact_email}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="mv-cell-dim">No contact assigned</span>
                          )}
                        </td>

                        {/* Services Count */}
                        <td>
                          <span className="mv-num" style={{ fontWeight: 700, color: 'var(--mv-purple)' }}>
                            {svcCount}
                          </span>{' '}
                          <span className="mv-cell-dim">
                            service{svcCount !== 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <div className="mv-state mv-state--settled">
                            <div className="mv-mark mv-mark--settled" />
                            <span className="mv-state-label">Active</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="is-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="mv-btn mv-btn--sm"
                            onClick={() => setSelectedCarrier(c.id)}
                            style={{ padding: '0 10px', marginRight: 6 }}
                          >
                            Services →
                          </button>
                          <button
                            className="mv-btn mv-btn--sm mv-btn--danger"
                            onClick={() => {
                              if (confirm(`Delete carrier "${c.name}" and all associated rate cards?`)) {
                                deleteCourierMut.mutate(c.id);
                              }
                            }}
                            style={{ padding: '0 8px' }}
                            title="Delete Carrier"
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

        {/* Tab 1: Rules Engine */}
        {tab === 1 && (
          <div style={{ marginTop: 24 }}>
            <RulesEngine services={services} />
          </div>
        )}
      </div>
    </div>
  );
}
