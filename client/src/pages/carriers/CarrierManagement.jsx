/**
 * CarrierManagement — The courier & carrier directory rebuilt on the MoovOS design system.
 * Prominent carrier branding logos, accurate service counts, contacts with people icons,
 * perfectly aligned actions, and zero obsolete single account numbers.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, ArrowRight, Phone, Mail, Edit2, Trash2,
  Check, X, Users, Sliders, ArrowLeft, Layers, ShieldCheck,
  Building2, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { carriersApi } from '../../api/carriers';
import CarrierLogo from '../../components/common/CourierLogo';
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
  const [search, setSearch] = useState('');
  const [courierForm, setCourierForm] = useState({
    code: '',
    name: '',
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
        primary_contact_name: '',
        primary_contact_phone: '',
        primary_contact_email: '',
      });
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
      (c.primary_contact_name || '').toLowerCase().includes(q) ||
      (c.primary_contact_email || '').toLowerCase().includes(q)
    );
  });

  const totalServices = couriers.reduce((sum, c) => sum + (parseInt(c.service_count, 10) || 0), 0) || services.length;
  const totalSurcharges = surcharges.length;

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        {/* Header */}
        <div className="mv-head">
          <div>
            <div className="mv-kicker">NETWORK & LOGISTICS</div>
            <h1 className="mv-title">Carriers & Suppliers</h1>
            <p className="mv-blurb">
              {isLoading
                ? 'Loading network couriers…'
                : `${couriers.length} connected carriers, ${totalServices} configured service routes, and ${totalSurcharges} surcharge rules.`}
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
                    primary_contact_name: '',
                    primary_contact_phone: '',
                    primary_contact_email: '',
                  });
                  setAddingCourier(true);
                }}
              >
                <Plus size={14} /> Add Carrier
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
            <div className="mv-kpi-sub">Direct & reseller integrations</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Configured Services</div>
            <div className="mv-kpi-value mv-num">{totalServices}</div>
            <div className="mv-kpi-sub">Active delivery routing options</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Surcharge Rules</div>
            <div className="mv-kpi-value mv-num">{totalSurcharges}</div>
            <div className="mv-kpi-sub">Fuel, energy & out-of-area</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Primary Ledger</div>
            <div className="mv-kpi-value mv-num" style={{ color: 'var(--mv-purple)' }}>DPD</div>
            <div className="mv-kpi-sub">Automated reconciliation</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mv-tabs" style={{ marginTop: 24 }}>
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
          <div style={{ marginTop: 20 }}>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="mv-search" style={{ width: 320, height: 36 }}>
                <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by carrier name, code, contact…"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="mv-search-clear"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Create Carrier Drawer / Form */}
            {addingCourier && (
              <div
                style={{
                  background: 'var(--mv-surface)',
                  padding: '22px 24px',
                  marginBottom: 24,
                  borderRadius: 8,
                  border: '1px solid var(--mv-hairline-2)',
                  borderLeft: '4px solid var(--mv-purple)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={16} style={{ color: 'var(--mv-purple)' }} />
                  <span>Add New Carrier Integration</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div className="mv-field">
                    <label className="mv-label">Carrier Code <span className="req">*</span></label>
                    <input
                      className="mv-input"
                      value={courierForm.code}
                      onChange={(e) => setCourierForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. DPD"
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
                    <label className="mv-label">Contact Name</label>
                    <input
                      className="mv-input"
                      value={courierForm.primary_contact_name}
                      onChange={(e) => setCourierForm((f) => ({ ...f, primary_contact_name: e.target.value }))}
                      placeholder="e.g. Account Manager"
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
                    <Check size={14} /> Create Carrier
                  </button>
                </div>
              </div>
            )}

            {/* Ruled Carriers Table */}
            <table className="mv-table">
              <thead>
                <tr>
                  <th style={{ width: 4 }}></th>
                  <th style={{ minWidth: 260 }}>Carrier</th>
                  <th style={{ minWidth: 220 }}>Contacts</th>
                  <th style={{ minWidth: 150 }}>Services Configured</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th className="is-right" style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                      Reading carrier registry…
                    </td>
                  </tr>
                ) : filteredCouriers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                      No carriers found matching "{search}".
                    </td>
                  </tr>
                ) : (
                  filteredCouriers.map((c) => {
                    const svcCount = parseInt(c.service_count, 10) || (c.services || []).length || 0;
                    const additionalCount = (c.additional_contacts || []).length;
                    const totalContacts = (c.primary_contact_name ? 1 : 0) + additionalCount;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCarrier(c.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Hover tick */}
                        <td style={{ padding: 0 }}>
                          <div className="mv-row-tick" />
                        </td>

                        {/* Carrier Logo, Name & Code */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div
                              style={{
                                width: 52,
                                height: 38,
                                background: '#ffffff',
                                border: '1px solid var(--mv-hairline-2, #e5e7eb)',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 4,
                                flexShrink: 0,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                              }}
                            >
                              <CarrierLogo courier={c.code || c.name} size={28} />
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--mv-ink)' }}>
                                  {c.name}
                                </span>
                                <span
                                  className="mv-chip"
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    color: 'var(--mv-purple)',
                                    background: 'rgba(99, 102, 241, 0.08)',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                  }}
                                >
                                  {c.code}
                                </span>
                              </div>
                              <div className="mv-cell-sub" style={{ marginTop: 2, fontSize: 11.5 }}>
                                {c.notes || 'Integrated Carrier Network'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contacts with People Icon */}
                        <td>
                          {c.primary_contact_name ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12.5 }}>
                                <Users size={14} style={{ color: 'var(--mv-purple)', flexShrink: 0 }} />
                                <span>{c.primary_contact_name}</span>
                                {additionalCount > 0 && (
                                  <span className="mv-chip" style={{ fontSize: 10, padding: '1px 5px' }}>
                                    +{additionalCount} more
                                  </span>
                                )}
                              </div>
                              <div className="mv-cell-sub" style={{ display: 'flex', gap: 10, marginTop: 2, fontSize: 11 }}>
                                {c.primary_contact_email && (
                                  <span style={{ color: 'var(--mv-ink-60)' }}>{c.primary_contact_email}</span>
                                )}
                                {c.primary_contact_phone && (
                                  <span style={{ color: 'var(--mv-teal-deep)' }}>{c.primary_contact_phone}</span>
                                )}
                              </div>
                            </div>
                          ) : additionalCount > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12.5 }}>
                              <Users size={14} style={{ color: 'var(--mv-purple)', flexShrink: 0 }} />
                              <span>{c.additional_contacts[0].name}</span>
                              {additionalCount > 1 && (
                                <span className="mv-chip" style={{ fontSize: 10, padding: '1px 5px' }}>
                                  +{additionalCount - 1} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--mv-ink-40)', fontSize: 12 }}>
                              <Users size={13} style={{ opacity: 0.5 }} />
                              <span>No contacts listed</span>
                            </div>
                          )}
                        </td>

                        {/* Services Count */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                            <span className="mv-num" style={{ fontWeight: 800, fontSize: 14, color: svcCount > 0 ? 'var(--mv-purple)' : 'var(--mv-ink-40)' }}>
                              {svcCount}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--mv-ink-60)' }}>
                              service{svcCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="mv-cell-sub" style={{ fontSize: 11 }}>
                            {svcCount > 0 ? 'Routes & weight classes active' : 'No services added yet'}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <div className="mv-state mv-state--settled">
                            <div className="mv-mark mv-mark--settled" />
                            <span className="mv-state-label">Active</span>
                          </div>
                        </td>

                        {/* Actions — Perfectly Aligned */}
                        <td className="is-right" onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                              className="mv-btn-primary"
                              onClick={() => setSelectedCarrier(c.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span>Configure Services</span>
                              <ArrowRight size={13} />
                            </button>
                            <button
                              className="mv-btn-ghost"
                              onClick={() => {
                                if (confirm(`Delete carrier "${c.name}" and all associated rate cards?`)) {
                                  deleteCourierMut.mutate(c.id);
                                }
                              }}
                              style={{
                                padding: '6px 8px',
                                color: 'var(--mv-magenta-deep, #dc2626)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete Carrier"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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
          <div style={{ marginTop: 20 }}>
            <RulesEngine services={services} />
          </div>
        )}
      </div>
    </div>
  );
}
