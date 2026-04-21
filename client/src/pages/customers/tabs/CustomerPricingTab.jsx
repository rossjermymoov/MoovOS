/**
 * CustomerPricingTab
 * Shows:
 *  - Billing settings (account ID, billing cycle, VAT, Xero)
 *  - Imported customer rate cards from the billing system,
 *    grouped by courier → service, with zone/weight/price table
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Search, Settings } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const gbp = (n) => `£${parseFloat(n || 0).toFixed(2)}`;

// ─── Billing settings ─────────────────────────────────────────
function BillingSettings({ customer, onUpdate }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    billing_cycle:     customer.billing_cycle || 'monthly',
    vat_enabled:       customer.vat_enabled || false,
    multi_box_pricing: customer.multi_box_pricing || false,
    xero_contact_id:   customer.xero_contact_id || '',
  });

  const save = useMutation({
    mutationFn: () => api.patch(`/customers/${customer.id}`, form).then(r => r.data),
    onSuccess: (data) => { onUpdate(data); setEdit(false); },
  });

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 13, color: '#AAAAAA', width: 160 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div className="moov-card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Settings size={15} color="#7B2FBE" style={{ marginRight: 8 }} />
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7B2FBE', margin: 0, flex: 1 }}>Billing Settings</h3>
        <button onClick={() => setEdit(e => !e)} className="btn-ghost" style={{ height: 30, padding: '0 14px', fontSize: 12 }}>
          {edit ? 'Cancel' : 'Edit'}
        </button>
        {edit && (
          <button onClick={() => save.mutate()} className="btn-primary" style={{ height: 30, padding: '0 14px', fontSize: 12, marginLeft: 8 }}>
            <Check size={12} /> Save
          </button>
        )}
      </div>

      {edit ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Xero Contact ID</label>
            <div className="pill-input-wrap">
              <input type="text" value={form.xero_contact_id} onChange={e => setForm(f => ({ ...f, xero_contact_id: e.target.value }))} placeholder="abc-123" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Billing Cycle</label>
            <div className="pill-input-wrap">
              <select value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))} style={{ paddingLeft: 14 }}>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
              <div className="green-cap">▾</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['VAT Enabled', 'vat_enabled'], ['Multi-box Pricing', 'multi_box_pricing']].map(([label, key]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))} style={{ width: 36, height: 20, borderRadius: 10, background: form[key] ? '#00C853' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', top: 2, left: form[key] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 13, color: '#fff' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <Row label="Account ID" value={<span style={{ color: '#00BCD4', fontFamily: 'monospace', fontWeight: 700 }}>{customer.account_number}</span>} />
          <Row label="Billing Cycle" value={({ weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly' })[customer.billing_cycle] || 'Monthly'} />
          <Row label="VAT" value={customer.vat_enabled ? <span style={{ color: '#00C853' }}>Enabled</span> : <span style={{ color: '#AAAAAA' }}>Disabled</span>} />
          <Row label="Multi-box Pricing" value={customer.multi_box_pricing ? <span style={{ color: '#7B2FBE' }}>Enabled</span> : <span style={{ color: '#AAAAAA' }}>Disabled</span>} />
          <Row label="Xero Contact ID" value={customer.xero_contact_id || <span style={{ color: '#AAAAAA' }}>Not linked</span>} />
        </div>
      )}
    </div>
  );
}

// ─── Single service rate table ────────────────────────────────
function ServiceRateTable({ service }) {
  const [open, setOpen] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('');

  const filtered = zoneFilter
    ? service.rates.filter(r => r.zone_name.toLowerCase().includes(zoneFilter.toLowerCase()))
    : service.rates;

  // Collect unique weight classes for this service
  const weightClasses = [...new Set(service.rates.map(r => r.weight_class_name))];
  const hasMultipleWeights = weightClasses.length > 1;

  // Build zone → { weight_class_name → price } map for matrix display
  const zoneMap = {};
  for (const r of filtered) {
    if (!zoneMap[r.zone_name]) zoneMap[r.zone_name] = {};
    zoneMap[r.zone_name][r.weight_class_name] = r.price;
  }
  const zoneNames = Object.keys(zoneMap).sort();

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Service header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', cursor: 'pointer', background: open ? 'rgba(0,200,83,0.04)' : 'transparent' }}
      >
        {open ? <ChevronDown size={13} style={{ color: '#00C853', marginRight: 8 }} /> : <ChevronRight size={13} style={{ color: '#555', marginRight: 8 }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{service.service_name}</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#00C853', background: 'rgba(0,200,83,0.08)', padding: '2px 8px', borderRadius: 4, marginRight: 10 }}>
          {service.service_code}
        </span>
        <span style={{ fontSize: 11, color: '#AAAAAA' }}>
          {service.rate_count} {service.rate_count === 1 ? 'rate' : 'rates'}
        </span>
      </div>

      {open && (
        <div style={{ background: 'rgba(0,0,0,0.15)' }}>
          {/* Zone search for services with many zones */}
          {service.rates.length > 20 && (
            <div style={{ padding: '8px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="pill-input-wrap" style={{ maxWidth: 280 }}>
                <Search size={12} style={{ marginLeft: 12, color: '#AAAAAA', flexShrink: 0 }} />
                <input
                  value={zoneFilter}
                  onChange={e => setZoneFilter(e.target.value)}
                  placeholder="Search zones…"
                  style={{ paddingLeft: 8, fontSize: 12 }}
                />
                {zoneFilter && (
                  <button onClick={() => setZoneFilter('')} className="green-cap" style={{ fontSize: 11 }}>✕</button>
                )}
              </div>
            </div>
          )}

          {zoneNames.length === 0 ? (
            <div style={{ padding: '12px 18px', color: '#555', fontSize: 12 }}>No zones match "{zoneFilter}"</div>
          ) : hasMultipleWeights ? (
            /* Matrix: zones as rows, weight classes as columns */
            <div style={{ overflowX: 'auto' }}>
              <table className="moov-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Zone</th>
                    {weightClasses.map(wc => <th key={wc} style={{ whiteSpace: 'nowrap' }}>{wc}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {zoneNames.map(zone => (
                    <tr key={zone}>
                      <td style={{ color: '#AAAAAA', whiteSpace: 'nowrap' }}>{zone}</td>
                      {weightClasses.map(wc => (
                        <td key={wc} style={{ fontWeight: 700, color: '#fff' }}>
                          {zoneMap[zone][wc] != null ? gbp(zoneMap[zone][wc]) : <span style={{ color: '#333' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Simple two-column: Zone | Price */
            <table className="moov-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Zone</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {zoneNames.map(zone => {
                  const price = Object.values(zoneMap[zone])[0];
                  return (
                    <tr key={zone}>
                      <td style={{ color: '#AAAAAA' }}>{zone}</td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{gbp(price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Courier group ────────────────────────────────────────────
function CourierGroup({ courierName, courierCode, services }) {
  const [open, setOpen] = useState(true);
  const totalRates = services.reduce((a, s) => a + s.rate_count, 0);

  return (
    <div className="moov-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      {/* Courier header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        {open ? <ChevronDown size={14} style={{ color: '#00C853', marginRight: 8 }} /> : <ChevronRight size={14} style={{ color: '#555', marginRight: 8 }} />}
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', flex: 1 }}>{courierName}</span>
        <span style={{ fontSize: 11, color: '#AAAAAA', marginRight: 16 }}>
          {services.length} service{services.length !== 1 ? 's' : ''} · {totalRates.toLocaleString()} rates
        </span>
      </div>

      {open && services.map(svc => (
        <ServiceRateTable key={svc.service_id} service={svc} />
      ))}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────
export default function CustomerPricingTab({ customer, onCustomerUpdate }) {
  const [serviceSearch, setServiceSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customer-rates', customer.id],
    queryFn: () => api.get(`/customer-rates/${customer.id}`).then(r => r.data),
  });

  const services = data?.services || [];
  const totalRates = data?.total_rates || 0;

  // Filter services by search
  const filtered = serviceSearch
    ? services.filter(s =>
        s.service_name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.service_code.toLowerCase().includes(serviceSearch.toLowerCase())
      )
    : services;

  // Group by courier
  const byCourier = {};
  for (const s of filtered) {
    if (!byCourier[s.courier_name]) byCourier[s.courier_name] = { code: s.courier_code, services: [] };
    byCourier[s.courier_name].services.push(s);
  }

  return (
    <div>
      <BillingSettings customer={customer} onUpdate={onCustomerUpdate} />

      {/* Rates header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, flex: 1 }}>
          Rate Cards
          {totalRates > 0 && (
            <span style={{ fontSize: 13, color: '#AAAAAA', fontWeight: 400, marginLeft: 10 }}>
              {services.length} services · {totalRates.toLocaleString()} rates
            </span>
          )}
        </h3>
        {services.length > 5 && (
          <div className="pill-input-wrap" style={{ width: 240 }}>
            <Search size={12} style={{ marginLeft: 12, color: '#AAAAAA', flexShrink: 0 }} />
            <input
              value={serviceSearch}
              onChange={e => setServiceSearch(e.target.value)}
              placeholder="Search services…"
              style={{ paddingLeft: 8, fontSize: 12 }}
            />
            {serviceSearch && <button onClick={() => setServiceSearch('')} className="green-cap" style={{ fontSize: 11 }}>✕</button>}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#AAAAAA' }}>
          Loading rates…
        </div>
      )}

      {!isLoading && services.length === 0 && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#555' }}>
          No rates imported for this customer yet.
          <div style={{ marginTop: 8, fontSize: 12, color: '#AAAAAA' }}>
            Rates are imported from the billing system export. Contact the admin team to add rates.
          </div>
        </div>
      )}

      {Object.entries(byCourier).map(([courierName, { code, services: svcs }]) => (
        <CourierGroup
          key={courierName}
          courierName={courierName}
          courierCode={code}
          services={svcs}
        />
      ))}
    </div>
  );
}
