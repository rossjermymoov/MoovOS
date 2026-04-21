/**
 * CustomerPricingTab
 * Billing settings + editable customer rate cards
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Trash2, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const gbp = (n) => `£${parseFloat(n || 0).toFixed(2)}`;

const inp = {
  background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 5, padding: '4px 8px', color: '#fff', fontSize: 12,
  outline: 'none', boxSizing: 'border-box',
};

// ─── Inline editable price cell ───────────────────────────────
function PriceCell({ rateId, initialPrice, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(parseFloat(initialPrice).toFixed(2)));
  const [confirm, setConfirm] = useState(false);
  const inputRef = useRef(null);

  function startEdit() { setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }

  function commit() {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) { setVal(String(parseFloat(initialPrice).toFixed(2))); setEditing(false); return; }
    onSaved(rateId, parsed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(String(parseFloat(initialPrice).toFixed(2))); setEditing(false); } }}
        style={{ ...inp, width: 80, textAlign: 'right' }}
      />
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        onClick={startEdit}
        title="Click to edit"
        style={{ fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, border: '1px solid transparent', fontFamily: 'monospace', minWidth: 60, textAlign: 'right', display: 'inline-block' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,200,83,0.4)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
      >
        {gbp(initialPrice)}
      </span>
      {confirm
        ? <>
            <button onClick={() => onDelete(rateId)} style={{ background: '#E91E8C', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>Delete</button>
            <button onClick={() => setConfirm(false)} style={{ background: 'none', border: 'none', color: '#AAAAAA', fontSize: 10, cursor: 'pointer' }}>✕</button>
          </>
        : <button onClick={() => setConfirm(true)} style={{ background: 'none', border: 'none', color: 'transparent', cursor: 'pointer', padding: 0 }} className="rate-delete-btn">
            <Trash2 size={11} color="#555" />
          </button>
      }
    </span>
  );
}

// ─── Add rate inline form ─────────────────────────────────────
function AddRateForm({ service, customerId, onAdded, onCancel }) {
  const [zone, setZone]     = useState('');
  const [weight, setWeight] = useState('Parcel');
  const [price, setPrice]   = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  async function submit() {
    if (!zone.trim() || !price) { setErr('Zone and price are required'); return; }
    setSaving(true);
    try {
      await api.post(`/customer-rates/${customerId}`, {
        courier_id:        service.courier_id,
        courier_code:      service.courier_code,
        courier_name:      service.courier_name,
        service_id:        service.service_id,
        service_code:      service.service_code,
        service_name:      service.service_name,
        zone_name:         zone.trim(),
        weight_class_name: weight.trim() || 'Parcel',
        price:             parseFloat(price),
      });
      onAdded();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '10px 18px', background: 'rgba(0,200,83,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 3 }}>Zone</div>
        <input value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Mainland" style={{ ...inp, width: 160 }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 3 }}>Weight class</div>
        <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="Parcel" style={{ ...inp, width: 120 }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 3 }}>Price £</div>
        <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={{ ...inp, width: 90 }} />
      </div>
      <button onClick={submit} disabled={saving} className="btn-primary" style={{ height: 30, padding: '0 14px', fontSize: 12 }}>
        <Check size={12} /> {saving ? 'Saving…' : 'Add'}
      </button>
      <button onClick={onCancel} className="btn-ghost" style={{ height: 30, padding: '0 10px', fontSize: 12 }}>Cancel</button>
      {err && <span style={{ fontSize: 12, color: '#E91E8C', width: '100%' }}>{err}</span>}
    </div>
  );
}

// ─── Service block ────────────────────────────────────────────
const PREVIEW = 3;

function ServiceBlock({ service, customerId, onRateUpdate, onRateDelete, onRefresh }) {
  const [showAll, setShowAll]   = useState(false);
  const [adding, setAdding]     = useState(false);
  const multiWeight = [...new Set(service.rates.map(r => r.weight_class_name))].length > 1;

  const display = showAll ? service.rates : service.rates.slice(0, PREVIEW);
  const extra   = service.rates.length - PREVIEW;

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Service header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '9px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{service.service_name}</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#00C853', background: 'rgba(0,200,83,0.08)', padding: '2px 8px', borderRadius: 4, marginRight: 12 }}>
          {service.service_code}
        </span>
        <button
          onClick={() => setAdding(a => !a)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 5, color: '#00C853', fontSize: 11, fontWeight: 700, padding: '3px 10px', cursor: 'pointer' }}
        >
          <Plus size={11} /> Add rate
        </button>
      </div>

      {/* Rate rows */}
      {service.rates.length === 0 ? (
        <div style={{ padding: '10px 18px', fontSize: 12, color: '#555', fontStyle: 'italic' }}>No pricing found</div>
      ) : (
        <>
          {display.map(rate => (
            <div key={rate.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 12, color: '#DDDDDD', flex: 1 }}>
                {rate.zone_name}
                {multiWeight && <span style={{ color: '#AAAAAA', marginLeft: 8, fontSize: 11 }}>· {rate.weight_class_name}</span>}
              </span>
              <span style={{ minWidth: 110, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <PriceCell
                  rateId={rate.id}
                  initialPrice={rate.price}
                  onSaved={onRateUpdate}
                  onDelete={onRateDelete}
                />
              </span>
            </div>
          ))}

          {/* Show more / less */}
          {extra > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              style={{ width: '100%', padding: '7px 18px', background: 'none', border: 'none', color: '#00C853', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.03)' }}
            >
              + {extra} more zone{extra !== 1 ? 's' : ''}…
            </button>
          )}
          {showAll && extra > 0 && (
            <button
              onClick={() => setShowAll(false)}
              style={{ width: '100%', padding: '7px 18px', background: 'none', border: 'none', color: '#AAAAAA', fontSize: 12, cursor: 'pointer', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.03)' }}
            >
              Show less
            </button>
          )}
        </>
      )}

      {adding && (
        <AddRateForm
          service={service}
          customerId={customerId}
          onAdded={() => { setAdding(false); onRefresh(); }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

// ─── Courier group ────────────────────────────────────────────
function CourierGroup({ courierName, services, customerId, onRateUpdate, onRateDelete, onRefresh }) {
  const [open, setOpen] = useState(true);
  const totalRates = services.reduce((a, s) => a + s.rate_count, 0);

  return (
    <div className="moov-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', padding: '13px 18px', cursor: 'pointer', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        {open
          ? <ChevronDown size={14} style={{ color: '#00C853', marginRight: 8 }} />
          : <ChevronRight size={14} style={{ color: '#555', marginRight: 8 }} />}
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>{courierName}</span>
        <span style={{ fontSize: 11, color: '#AAAAAA' }}>
          {services.length} service{services.length !== 1 ? 's' : ''} · {totalRates.toLocaleString()} rates
        </span>
      </div>

      {open && services.map(svc => (
        <ServiceBlock
          key={svc.service_id}
          service={svc}
          customerId={customerId}
          onRateUpdate={onRateUpdate}
          onRateDelete={onRateDelete}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

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
    onSuccess:  (data) => { onUpdate(data); setEdit(false); },
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
        <button onClick={() => setEdit(e => !e)} className="btn-ghost" style={{ height: 30, padding: '0 14px', fontSize: 12 }}>{edit ? 'Cancel' : 'Edit'}</button>
        {edit && <button onClick={() => save.mutate()} className="btn-primary" style={{ height: 30, padding: '0 14px', fontSize: 12, marginLeft: 8 }}><Check size={12} /> Save</button>}
      </div>

      {edit ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Xero Contact ID</label>
            <div className="pill-input-wrap"><input type="text" value={form.xero_contact_id} onChange={e => setForm(f => ({ ...f, xero_contact_id: e.target.value }))} placeholder="abc-123" /></div>
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

// ─── Main tab ─────────────────────────────────────────────────
export default function CustomerPricingTab({ customer, onCustomerUpdate }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customer-rates', customer.id],
    queryFn:  () => api.get(`/customer-rates/${customer.id}`).then(r => r.data),
  });

  const services    = data?.services    || [];
  const totalRates  = data?.total_rates || 0;

  function refresh() {
    queryClient.invalidateQueries(['customer-rates', customer.id]);
  }

  async function handlePriceUpdate(rateId, price) {
    await api.patch(`/customer-rates/rate/${rateId}`, { price });
    refresh();
  }

  async function handlePriceDelete(rateId) {
    await api.delete(`/customer-rates/rate/${rateId}`);
    refresh();
  }

  // Group by courier
  const byCourier = {};
  for (const s of services) {
    if (!byCourier[s.courier_name]) byCourier[s.courier_name] = [];
    byCourier[s.courier_name].push(s);
  }

  return (
    <div>
      <BillingSettings customer={customer} onUpdate={onCustomerUpdate} />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, flex: 1 }}>
          Rate Cards
          {totalRates > 0 && (
            <span style={{ fontSize: 13, color: '#AAAAAA', fontWeight: 400, marginLeft: 10 }}>
              {services.length} services · {totalRates.toLocaleString()} rates
            </span>
          )}
        </h3>
      </div>

      {isLoading && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#AAAAAA' }}>Loading rates…</div>
      )}

      {!isLoading && services.length === 0 && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#555' }}>
          No rates imported for this customer yet.
        </div>
      )}

      {Object.entries(byCourier).map(([courierName, svcs]) => (
        <CourierGroup
          key={courierName}
          courierName={courierName}
          services={svcs}
          customerId={customer.id}
          onRateUpdate={handlePriceUpdate}
          onRateDelete={handlePriceDelete}
          onRefresh={refresh}
        />
      ))}
    </div>
  );
}
