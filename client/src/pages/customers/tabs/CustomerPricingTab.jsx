/**
 * CustomerPricingTab
 * Appears as the "Pricing" tab inside the Customer Record page.
 *
 * Shows:
 *  - Customer sell rate cards (per service / zone / weight band)
 *  - Volume tiers
 *  - Billing settings (billing cycle, VAT, multi-box, DC ID, Xero ID)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, X, Settings } from 'lucide-react';
import { customerPricingApi } from '../../../api/customerPricing';
import { carriersApi } from '../../../api/carriers';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pill = {
  display: 'inline-block', padding: '2px 10px', borderRadius: 9999,
  fontSize: 11, fontWeight: 700,
};

const METHOD_COLORS = {
  fixed:      { bg: 'rgba(0,200,83,0.12)',   text: '#00C853',  label: 'Fixed' },
  markup_pct: { bg: 'rgba(123,47,190,0.15)', text: '#7B2FBE',  label: 'Markup %' },
  margin_pct: { bg: 'rgba(0,188,212,0.12)',  text: '#00BCD4',  label: 'Margin %' },
};

const TIER_COLORS = {
  flat:       { bg: 'rgba(0,200,83,0.12)',   text: '#00C853' },
  graduated:  { bg: 'rgba(255,193,7,0.12)',  text: '#FFC107' },
};

function formatPrice(method, row) {
  if (method === 'fixed')      return `£${parseFloat(row.fixed_price).toFixed(4)}`;
  if (method === 'markup_pct') return `${parseFloat(row.markup_pct).toFixed(2)}% markup`;
  if (method === 'margin_pct') return `${parseFloat(row.margin_pct).toFixed(2)}% margin`;
  return '—';
}

// ─── Rate cards by service ────────────────────────────────────────────────────

function RateCardGroup({ serviceName, serviceCode, zoneGroups, customerId, services, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    courier_service_id: '', zone_id: '', min_weight_kg: '', max_weight_kg: '',
    pricing_method: 'fixed', fixed_price: '', markup_pct: '', margin_pct: '',
  });
  const [zones, setZones] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  const add = useMutation({
    mutationFn: () => customerPricingApi.createPricing({ ...form, customer_id: customerId }),
    onSuccess: () => { setAdding(false); setForm({ courier_service_id: '', zone_id: '', min_weight_kg: '', max_weight_kg: '', pricing_method: 'fixed', fixed_price: '', markup_pct: '', margin_pct: '' }); onRefresh(); },
  });

  const del = useMutation({
    mutationFn: (id) => customerPricingApi.deletePricing(id),
    onSuccess: () => { setConfirmId(null); onRefresh(); },
  });

  async function handleServiceChange(serviceId) {
    setForm(f => ({ ...f, courier_service_id: serviceId, zone_id: '' }));
    if (!serviceId) return setZones([]);
    const svc = await carriersApi.getService(serviceId);
    setZones(svc.zones || []);
  }

  return (
    <div className="moov-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>{serviceName}</span>
        <span style={{ ...pill, background: 'rgba(0,200,83,0.08)', color: '#00C853', fontFamily: 'monospace' }}>{serviceCode}</span>
      </div>

      {Object.entries(zoneGroups).map(([zoneName, rows]) => (
        <div key={zoneName}>
          <div style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.02)', fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {zoneName}
          </div>
          <table className="moov-table" style={{ fontSize: 12 }}>
            <thead><tr><th>Min kg</th><th>Max kg</th><th>Method</th><th>Price / Rate</th><th></th></tr></thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td>{parseFloat(row.min_weight_kg).toFixed(3)}</td>
                  <td>{parseFloat(row.max_weight_kg).toFixed(3)}</td>
                  <td>
                    <span style={{ ...pill, background: METHOD_COLORS[row.pricing_method]?.bg, color: METHOD_COLORS[row.pricing_method]?.text }}>
                      {METHOD_COLORS[row.pricing_method]?.label}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{formatPrice(row.pricing_method, row)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {confirmId === row.id
                      ? <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => del.mutate(row.id)} style={{ background: '#E91E8C', border: 'none', borderRadius: 5, color: '#fff', padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>Delete</button>
                          <button onClick={() => setConfirmId(null)} style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: 11 }}>Cancel</button>
                        </div>
                      : <button onClick={() => setConfirmId(row.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={11} /></button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Add rate form */}
      {adding ? (
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,200,83,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Service</label>
              <div className="pill-input-wrap" style={{ height: 32 }}>
                <select value={form.courier_service_id} onChange={e => handleServiceChange(e.target.value)} style={{ fontSize: 12, paddingLeft: 10 }}>
                  <option value="">Select service…</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Zone</label>
              <div className="pill-input-wrap" style={{ height: 32 }}>
                <select value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))} style={{ fontSize: 12, paddingLeft: 10 }}>
                  <option value="">Select zone…</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Min kg</label>
              <div className="pill-input-wrap" style={{ height: 32 }}><input type="number" step="0.001" value={form.min_weight_kg} onChange={e => setForm(f => ({ ...f, min_weight_kg: e.target.value }))} style={{ fontSize: 12 }} /></div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Max kg</label>
              <div className="pill-input-wrap" style={{ height: 32 }}><input type="number" step="0.001" value={form.max_weight_kg} onChange={e => setForm(f => ({ ...f, max_weight_kg: e.target.value }))} style={{ fontSize: 12 }} /></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Pricing Method</label>
              <div className="pill-input-wrap" style={{ height: 32 }}>
                <select value={form.pricing_method} onChange={e => setForm(f => ({ ...f, pricing_method: e.target.value }))} style={{ fontSize: 12, paddingLeft: 10 }}>
                  <option value="fixed">Fixed Price £</option>
                  <option value="markup_pct">Markup %</option>
                  <option value="margin_pct">Margin %</option>
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>
                {form.pricing_method === 'fixed' ? 'Price £' : form.pricing_method === 'markup_pct' ? 'Markup %' : 'Margin %'}
              </label>
              <div className="pill-input-wrap" style={{ height: 32 }}>
                <input type="number" step="0.01"
                  value={form.pricing_method === 'fixed' ? form.fixed_price : form.pricing_method === 'markup_pct' ? form.markup_pct : form.margin_pct}
                  onChange={e => {
                    const key = form.pricing_method === 'fixed' ? 'fixed_price' : form.pricing_method === 'markup_pct' ? 'markup_pct' : 'margin_pct';
                    setForm(f => ({ ...f, [key]: e.target.value }));
                  }}
                  style={{ fontSize: 12 }} />
                <div className="green-cap">{form.pricing_method === 'fixed' ? '£' : '%'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button onClick={() => add.mutate()} className="btn-primary" style={{ height: 32, padding: '0 14px' }}><Check size={12} /></button>
              <button onClick={() => setAdding(false)} className="btn-ghost" style={{ height: 32, padding: '0 10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 18px' }}>
          <button onClick={() => setAdding(true)} style={{ background: 'none', border: 'none', color: '#00C853', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={12} /> Add rate band
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Volume tiers ─────────────────────────────────────────────────────────────

function VolumeTiersSection({ customerId, services }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ courier_service_id: '', zone_id: '', min_parcels: '', max_parcels: '', tier_type: 'flat', price: '' });
  const [zones, setZones] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  const { data: tiers = [], refetch } = useQuery({
    queryKey: ['volume-tiers', customerId],
    queryFn: () => customerPricingApi.getVolumeTiers(customerId),
  });

  const add = useMutation({
    mutationFn: () => customerPricingApi.createVolumeTier({ ...form, customer_id: customerId }),
    onSuccess: () => { setAdding(false); setForm({ courier_service_id: '', zone_id: '', min_parcels: '', max_parcels: '', tier_type: 'flat', price: '' }); refetch(); },
  });

  const del = useMutation({
    mutationFn: (id) => customerPricingApi.deleteVolumeTier(id),
    onSuccess: () => { setConfirmId(null); refetch(); },
  });

  async function handleServiceChange(serviceId) {
    setForm(f => ({ ...f, courier_service_id: serviceId, zone_id: '' }));
    if (!serviceId) return setZones([]);
    const svc = await carriersApi.getService(serviceId);
    setZones(svc.zones || []);
  }

  return (
    <div className="moov-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>Volume Tiers</span>
        <button onClick={() => setAdding(a => !a)} className="btn-primary" style={{ height: 30, padding: '0 12px', fontSize: 12 }}><Plus size={11} /> Add Tier</button>
      </div>

      {adding && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,200,83,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Service</label>
              <div className="pill-input-wrap" style={{ height: 32 }}>
                <select value={form.courier_service_id} onChange={e => handleServiceChange(e.target.value)} style={{ fontSize: 12, paddingLeft: 10 }}>
                  <option value="">Select…</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Zone (opt)</label>
              <div className="pill-input-wrap" style={{ height: 32 }}>
                <select value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))} style={{ fontSize: 12, paddingLeft: 10 }}>
                  <option value="">All zones</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Min parcels</label>
              <div className="pill-input-wrap" style={{ height: 32 }}><input type="number" value={form.min_parcels} onChange={e => setForm(f => ({ ...f, min_parcels: e.target.value }))} style={{ fontSize: 12 }} /></div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Max (opt)</label>
              <div className="pill-input-wrap" style={{ height: 32 }}><input type="number" value={form.max_parcels} onChange={e => setForm(f => ({ ...f, max_parcels: e.target.value }))} placeholder="∞" style={{ fontSize: 12 }} /></div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Type</label>
              <div className="pill-input-wrap" style={{ height: 32 }}>
                <select value={form.tier_type} onChange={e => setForm(f => ({ ...f, tier_type: e.target.value }))} style={{ fontSize: 12, paddingLeft: 10 }}>
                  <option value="flat">Flat</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>£/parcel</label>
              <div className="pill-input-wrap" style={{ height: 32 }}><input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={{ fontSize: 12 }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <button onClick={() => add.mutate()} className="btn-primary" style={{ height: 32 }}><Check size={12} /></button>
              <button onClick={() => setAdding(false)} className="btn-ghost" style={{ height: 32, padding: '0 8px' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {tiers.length === 0
        ? <div style={{ padding: 28, textAlign: 'center', color: '#555', fontSize: 13 }}>No volume tiers configured</div>
        : <table className="moov-table" style={{ fontSize: 12 }}>
            <thead><tr><th>Service</th><th>Zone</th><th>Min</th><th>Max</th><th>Type</th><th>£/parcel</th><th></th></tr></thead>
            <tbody>
              {tiers.map(t => (
                <tr key={t.id}>
                  <td>{t.service_name}</td>
                  <td>{t.zone_name || <span style={{ color: '#555' }}>All zones</span>}</td>
                  <td>{t.min_parcels.toLocaleString()}</td>
                  <td>{t.max_parcels ? t.max_parcels.toLocaleString() : <span style={{ color: '#555' }}>∞</span>}</td>
                  <td><span style={{ ...pill, background: TIER_COLORS[t.tier_type]?.bg, color: TIER_COLORS[t.tier_type]?.text }}>{t.tier_type}</span></td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>£{parseFloat(t.price).toFixed(4)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {confirmId === t.id
                      ? <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => del.mutate(t.id)} style={{ background: '#E91E8C', border: 'none', borderRadius: 5, color: '#fff', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Delete</button>
                          <button onClick={() => setConfirmId(null)} style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: 11 }}>Cancel</button>
                        </div>
                      : <button onClick={() => setConfirmId(t.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={11} /></button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}

// ─── Billing settings panel ───────────────────────────────────────────────────

function BillingSettings({ customer, onUpdate }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    dc_id: customer.dc_id || '',
    billing_cycle: customer.billing_cycle || 'monthly',
    vat_enabled: customer.vat_enabled || false,
    multi_box_pricing: customer.multi_box_pricing || false,
    xero_contact_id: customer.xero_contact_id || '',
  });

  const save = useMutation({
    mutationFn: () => api.patch(`/customers/${customer.id}`, form).then(r => r.data),
    onSuccess: (data) => { onUpdate(data); setEdit(false); },
  });

  const ROW = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 13, color: '#AAAAAA', width: 160 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div className="moov-card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Settings size={15} color="#7B2FBE" style={{ marginRight: 8 }} />
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7B2FBE', margin: 0, flex: 1 }}>Billing Settings</h3>
        <button onClick={() => setEdit(e => !e)} className="btn-ghost" style={{ height: 30, padding: '0 14px', fontSize: 12 }}>
          {edit ? 'Cancel' : 'Edit'}
        </button>
        {edit && <button onClick={() => save.mutate()} className="btn-primary" style={{ height: 30, padding: '0 14px', fontSize: 12, marginLeft: 8 }}><Check size={12} /> Save</button>}
      </div>

      {edit ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['DC ID (dispatch code)', 'dc_id', 'text', 'MOOV-0147'],
            ['Xero Contact ID', 'xero_contact_id', 'text', 'abc-123'],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>{label}</label>
              <div className="pill-input-wrap"><input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} /></div>
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Billing Cycle</label>
            <div className="pill-input-wrap">
              <select value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))} style={{ paddingLeft: 14 }}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
              <div className="green-cap">▾</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['VAT Enabled', 'vat_enabled'], ['Multi-box Pricing', 'multi_box_pricing']].map(([label, key]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))} style={{ width: 36, height: 20, borderRadius: 10, background: form[key] ? '#00C853' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', top: 2, left: form[key] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 13, color: '#fff' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <ROW label="DC ID" value={customer.dc_id || <span style={{ color: '#E91E8C' }}>Not set — required for billing</span>} />
          <ROW label="Billing Cycle" value={({ weekly: 'Weekly', biweekly: 'Fortnightly', monthly: 'Monthly' })[customer.billing_cycle] || 'Monthly'} />
          <ROW label="VAT" value={customer.vat_enabled ? <span style={{ color: '#00C853' }}>Enabled</span> : <span style={{ color: '#AAAAAA' }}>Disabled</span>} />
          <ROW label="Multi-box Pricing" value={customer.multi_box_pricing ? <span style={{ color: '#7B2FBE' }}>Enabled (sub-rate applied)</span> : <span style={{ color: '#AAAAAA' }}>Disabled</span>} />
          <ROW label="Xero Contact ID" value={customer.xero_contact_id || <span style={{ color: '#AAAAAA' }}>Not linked</span>} />
        </div>
      )}
    </div>
  );
}

// ─── Main tab component ───────────────────────────────────────────────────────

export default function CustomerPricingTab({ customer, onCustomerUpdate }) {
  const { data: pricing = [], refetch } = useQuery({
    queryKey: ['customer-pricing', customer.id],
    queryFn: () => customerPricingApi.getPricing(customer.id),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['carrier-services-all'],
    queryFn: () => carriersApi.getServices(),
  });

  // Group pricing by service → zone
  const byService = {};
  for (const row of pricing) {
    if (!byService[row.service_name]) byService[row.service_name] = { serviceCode: row.service_code, zones: {} };
    if (!byService[row.service_name].zones[row.zone_name]) byService[row.service_name].zones[row.zone_name] = [];
    byService[row.service_name].zones[row.zone_name].push(row);
  }

  return (
    <div>
      {/* Billing settings */}
      <BillingSettings customer={customer} onUpdate={onCustomerUpdate} />

      {/* Rate cards */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 12px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Sell Rate Cards</h3>
      </div>

      {pricing.length === 0 && services.length === 0 && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#555', marginBottom: 16 }}>
          No carrier services configured yet. Set up carriers first in <strong style={{ color: '#AAAAAA' }}>Carrier Management</strong>.
        </div>
      )}

      {Object.entries(byService).map(([serviceName, { serviceCode, zones }]) => (
        <RateCardGroup
          key={serviceName}
          serviceName={serviceName}
          serviceCode={serviceCode}
          zoneGroups={zones}
          customerId={customer.id}
          services={services}
          onRefresh={refetch}
        />
      ))}

      {/* Add rate card for a new service */}
      <RateCardGroup
        key="__new__"
        serviceName="Add rate for a new service"
        serviceCode=""
        zoneGroups={{}}
        customerId={customer.id}
        services={services}
        onRefresh={refetch}
      />

      {/* Volume tiers */}
      <div style={{ margin: '24px 0 12px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Volume Tiers</h3>
        <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 4 }}>Evaluated at invoice generation time — once total parcel count for the period is known</p>
      </div>
      <VolumeTiersSection customerId={customer.id} services={services} />
    </div>
  );
}
