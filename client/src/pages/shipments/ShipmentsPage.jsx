import { useState, useEffect } from 'react';
import {
  Package, Search, Filter, RefreshCw, Plus, ArrowRight,
  CheckCircle2, XCircle, Clock, Eye, Trash2, Layers, AlertCircle
} from 'lucide-react';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  
  // Modals
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [injecting, setInjecting] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [page, search, courierFilter, customerFilter]);

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : data.customers || []);
      }
    } catch (e) {
      console.error('Failed to load customers', e);
    }
  }

  async function fetchShipments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
        search,
        courier: courierFilter,
        customer_id: customerFilter,
      });
      const res = await fetch(`/api/shipments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setShipments(data.shipments || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
      }
    } catch (e) {
      console.error('Failed to load shipments', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleInjectSample() {
    if (!selectedCustomerId) {
      alert('Please select a customer to assign the test shipments to.');
      return;
    }
    setInjecting(true);
    try {
      const res = await fetch('/api/shipments/simulate-dpd-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: selectedCustomerId }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowInjectModal(false);
        fetchShipments();
        alert(`Successfully injected ${data.count} test shipments for ${data.customer_name}!`);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to inject sample shipments'}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setInjecting(false);
    }
  }

  async function handleDeleteShipment(id) {
    if (!confirm('Are you sure you want to delete this shipment record?')) return;
    try {
      const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShipments(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleClearSimulated() {
    if (!confirm('Clear all simulated test shipments?')) return;
    try {
      const res = await fetch('/api/shipments/clear-simulated', { method: 'POST' });
      if (res.ok) {
        fetchShipments();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const simulatedCount = shipments.filter(s => s.raw_payload?.simulated).length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto' }}>
      {/* ── Level 1 Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mv-state settled" />
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>
              Shipments & Ingested Parcels
            </h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--mv-ink-60)', marginTop: 4 }}>
            Live stream of parcel webhooks, tracking barcodes, weight declarations, and linked billing charges.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {simulatedCount > 0 && (
            <button
              onClick={handleClearSimulated}
              className="mv-btn-danger"
              style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={14} /> Clear Test Shipments ({simulatedCount})
            </button>
          )}
          <button
            onClick={() => setShowInjectModal(true)}
            className="mv-btn"
            style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Inject DPD Test Shipments
          </button>
          <button
            onClick={fetchShipments}
            className="mv-btn-ghost"
            style={{ padding: '8px 12px' }}
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────── */}
      <div className="mv-kpis" style={{ marginBottom: 24 }}>
        <div className="mv-kpi">
          <div className="mv-kpi-label">Total Webhooked Parcels</div>
          <div className="mv-kpi-value mv-num">{pagination.total}</div>
        </div>
        <div className="mv-kpi">
          <div className="mv-kpi-label">Active Carrier Services</div>
          <div className="mv-kpi-value mv-num">DPD, DHL, UPS</div>
        </div>
        <div className="mv-kpi">
          <div className="mv-kpi-label">Simulated Test Shipments</div>
          <div className="mv-kpi-value mv-num">{simulatedCount}</div>
        </div>
        <div className="mv-kpi">
          <div className="mv-kpi-label">Awaiting Reconciliation</div>
          <div className="mv-kpi-value mv-num">
            {shipments.filter(s => s.charges?.some(c => !c.verified)).length}
          </div>
        </div>
      </div>

      <div className="mv-rule" style={{ marginBottom: 20 }} />

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--mv-ink-40)' }} />
          <input
            type="text"
            placeholder="Search tracking, reference, customer, or postcode..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="mv-input"
            style={{ width: '100%', paddingLeft: 34, height: 36, fontSize: 13 }}
          />
        </div>

        <select
          value={courierFilter}
          onChange={e => { setCourierFilter(e.target.value); setPage(1); }}
          className="mv-input"
          style={{ width: 160, height: 36, fontSize: 13 }}
        >
          <option value="">All Couriers</option>
          <option value="DPD">DPD</option>
          <option value="DHL">DHL</option>
          <option value="UPS">UPS</option>
          <option value="Evri">Evri</option>
          <option value="Yodel">Yodel</option>
        </select>

        <select
          value={customerFilter}
          onChange={e => { setCustomerFilter(e.target.value); setPage(1); }}
          className="mv-input"
          style={{ width: 220, height: 36, fontSize: 13 }}
        >
          <option value="">All Customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.company_name || c.trading_name || c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Shipments Table ─────────────────────────────────────────────── */}
      <table className="mv-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>State</th>
            <th>Created / Date</th>
            <th>Tracking / Consignment</th>
            <th>Customer</th>
            <th>Courier & Service</th>
            <th>Weight (kg)</th>
            <th>Destination</th>
            <th>Sender Ref</th>
            <th className="tar">Cost Price</th>
            <th className="tar">Sell Price</th>
            <th style={{ width: 70, textAlign: 'center' }}>Payload</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={12} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--mv-ink-50)' }}>
                Loading shipments...
              </td>
            </tr>
          ) : shipments.length === 0 ? (
            <tr>
              <td colSpan={12} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mv-ink-50)' }}>
                <Package size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                No webhooked shipments found. Click <strong>"Inject DPD Test Shipments"</strong> to load sample parcels for matching.
              </td>
            </tr>
          ) : (
            shipments.map(s => {
              const mainCharge = s.charges?.[0];
              const isSim = Boolean(s.raw_payload?.simulated);

              return (
                <tr key={s.id}>
                  <td>
                    <span
                      className={`mv-state ${s.cancelled ? 'attention' : mainCharge?.verified ? 'settled' : 'waiting'}`}
                      title={s.cancelled ? 'Cancelled' : mainCharge?.verified ? 'Audited & Reconciled' : 'Awaiting Reconciliation'}
                    />
                  </td>
                  <td className="mv-num" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {new Date(s.created_at).toLocaleDateString('en-GB')}
                    <div style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>
                      {new Date(s.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }} className="mv-num">
                      {s.tracking_codes?.[0] || '—'}
                    </div>
                    {s.tracking_codes?.[1] && (
                      <div style={{ fontSize: 11, color: 'var(--mv-ink-50)' }} className="mv-num">
                        Cons: {s.tracking_codes[1]}
                      </div>
                    )}
                    {isSim && (
                      <span className="mv-chip" style={{ fontSize: 10, padding: '1px 4px', marginTop: 2 }}>
                        Simulated
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.customer_display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>
                      Acct: {s.customer_account || '—'}
                    </div>
                  </td>
                  <td>
                    <span className="mv-chip" style={{ marginRight: 6 }}>{s.courier || 'DPD'}</span>
                    <span style={{ fontSize: 12.5 }}>{s.service_name || s.dc_service_id || 'Next Day'}</span>
                  </td>
                  <td className="mv-num" style={{ fontSize: 13 }}>
                    {s.total_weight_kg ? `${Number(s.total_weight_kg).toFixed(1)} kg` : '—'}
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                      {s.ship_to_postcode || '—'} ({s.ship_to_country_iso || 'GB'})
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mv-ink-50)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.ship_to_name || '—'}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }} className="mv-num">
                    {s.reference || '—'}
                    {s.reference_2 && (
                      <div style={{ fontSize: 10.5, color: 'var(--mv-ink-50)' }}>
                        Ref2: {s.reference_2}
                      </div>
                    )}
                  </td>
                  <td className="tar mv-num" style={{ fontWeight: 500 }}>
                    {mainCharge?.cost_price != null ? `£${Number(mainCharge.cost_price).toFixed(2)}` : '—'}
                  </td>
                  <td className="tar mv-num" style={{ fontWeight: 600 }}>
                    {mainCharge?.price != null ? `£${Number(mainCharge.price).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedPayload(s.raw_payload || s)}
                      className="mv-btn-ghost"
                      style={{ padding: '4px 6px' }}
                      title="View Payload"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteShipment(s.id)}
                      className="mv-btn-ghost"
                      style={{ padding: '4px 6px', color: 'var(--mv-ink-40)' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* ── Inject Sample Modal ─────────────────────────────────────────── */}
      {showInjectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', width: 560, border: '2px solid var(--mv-divider)',
            padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
              Inject DPD Invoice Test Shipments
            </h2>
            <p style={{ fontSize: 13, color: 'var(--mv-ink-60)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              This tool creates the 7 sample parcel shipments matching the DPD invoice lines (tracking barcodes <code>15503768550431</code>, <code>15504393671903</code>, etc.) and assigns them to a chosen customer.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                Select Customer Account
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="mv-input"
                style={{ width: '100%', height: 38, fontSize: 13 }}
              >
                <option value="">-- Pick Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company_name || c.trading_name || c.name} ({c.account_number || 'No Account #'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ background: 'var(--mv-surface)', padding: 12, fontSize: 12, marginBottom: 20, borderLeft: '3px solid var(--mv-ink)' }}>
              <strong>Shipments to be injected:</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                <li><code>15503768550431</code> — DPD Next Day (1.0kg to B19 3QP, Base £3.76)</li>
                <li><code>15503768550577</code> — DPD Next Day (1.0kg to SW12 8DH, Base £3.76)</li>
                <li><code>15503768550729</code> — DPD Next Day (1.0kg to SW7 5DZ, Base £3.76)</li>
                <li><code>15503801421919</code> — DPD Next Day (2.0kg to SW1X 7DA London Congestion)</li>
                <li><code>15503801422304</code> — DPD Next Day (1.0kg from WC2E 8NA 4th Party Collection)</li>
                <li><code>15504393671903</code> — DPD Air Classic (10.5kg to US 98105 Seattle)</li>
                <li><code>15503948379168</code> — DPD Two Day (1.0kg to BT18 0PA Northern Ireland)</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowInjectModal(false)}
                className="mv-btn-ghost"
                disabled={injecting}
              >
                Cancel
              </button>
              <button
                onClick={handleInjectSample}
                className="mv-btn"
                disabled={injecting || !selectedCustomerId}
              >
                {injecting ? 'Injecting...' : 'Inject 7 Test Shipments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payload Viewer Modal ────────────────────────────────────────── */}
      {selectedPayload && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', width: 680, maxHeight: '80vh', border: '2px solid var(--mv-divider)',
            padding: 24, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Webhook Raw Payload</h3>
              <button onClick={() => setSelectedPayload(null)} className="mv-btn-ghost" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>
            <pre style={{
              flex: 1, overflow: 'auto', background: 'var(--mv-surface)', padding: 14,
              fontSize: 12, fontFamily: 'monospace', margin: 0
            }}>
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
