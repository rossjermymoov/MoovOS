import { useState, useEffect } from 'react';
import {
  Package, Search, Filter, RefreshCw, Plus, ArrowRight,
  CheckCircle2, XCircle, Clock, Eye, Trash2, Layers, AlertCircle,
  TrendingUp, DollarSign, Calculator, Info, FileText
} from 'lucide-react';
import CourierLogo from '../../components/common/CourierLogo';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [summaryStats, setSummaryStats] = useState(null);
  
  // Modals
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [injecting, setInjecting] = useState(false);
  const [repricingAll, setRepricingAll] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('pricing'); // 'pricing' | 'response' | 'raw'
  const [repricingSingle, setRepricingSingle] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [page, limit, search, courierFilter, customerFilter]);

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
        limit,
        search,
        courier: courierFilter,
        customer_id: customerFilter,
      });
      const res = await fetch(`/api/shipments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setShipments(data.shipments || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
        if (data.summaryStats) setSummaryStats(data.summaryStats);
      }
    } catch (e) {
      console.error('Failed to load shipments', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleReprocessAll() {
    setRepricingAll(true);
    try {
      const res = await fetch('/api/shipments/reprocess-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Reprocessed ${data.repriced || 0} shipments from stored webhooks!`);
        fetchShipments();
      } else {
        alert(data.error || 'Failed to reprocess webhooks');
      }
    } catch (e) {
      alert('Error reprocessing webhooks: ' + e.message);
    } finally {
      setRepricingAll(false);
    }
  }

  async function handleRepriceAll() {
    setRepricingAll(true);
    try {
      const res = await fetch('/api/shipments/reprice-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Repriced ${data.repriced || 0} shipments.`);
        fetchShipments();
      } else {
        alert(data.error || 'Failed to reprice shipments');
      }
    } catch (e) {
      alert('Error repricing: ' + e.message);
    } finally {
      setRepricingAll(false);
    }
  }

  async function handleRepriceSingle(shipmentId) {
    setRepricingSingle(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/reprice`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('Shipment repriced successfully!');
        fetchShipments();
        if (selectedShipment && selectedShipment.id === shipmentId) {
          // reload the selected shipment details
          const updated = await fetch(`/api/shipments?search=${selectedShipment.reference || selectedShipment.tracking_codes?.[0] || ''}`);
          const updData = await updated.json();
          if (updData.shipments?.length) {
            const match = updData.shipments.find(s => s.id === shipmentId);
            if (match) setSelectedShipment(match);
          }
        }
      } else {
        alert(data.error || data.message || 'Could not calculate charges');
      }
    } catch (e) {
      alert('Error repricing: ' + e.message);
    } finally {
      setRepricingSingle(false);
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

  async function handlePurgePriorToToday() {
    if (!confirm('Are you sure you want to delete all shipments prior to today? This will clear historical webhook data while preserving today’s shipments.')) return;
    try {
      const res = await fetch('/api/shipments/delete-before-today', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Purge completed: Deleted ${data.deleted_shipments || 0} historical shipments and ${data.deleted_charges || 0} charges.`);
        fetchShipments();
      } else {
        alert(data.error || 'Failed to purge shipments');
      }
    } catch (e) {
      console.error(e);
      alert('Error purging historical shipments: ' + e.message);
    }
  }

  async function handlePurgeGhosts() {
    if (!confirm('Purge all empty ghost shipments (records with no tracking codes, customer, or recipient address)?')) return;
    try {
      const res = await fetch('/api/shipments/purge-ghosts', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Purged ${data.deleted || 0} ghost shipments!`);
        fetchShipments();
      } else {
        alert(data.error || 'Failed to purge ghost shipments');
      }
    } catch (e) {
      alert('Error purging ghost shipments: ' + e.message);
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

  // Compute metrics from current page if summaryStats not yet loaded
  const computedStats = shipments.reduce((acc, s) => {
    const courierCharge = s.charges?.find(c => c.charge_type === 'courier') || s.charges?.[0];
    const sellPrice = courierCharge?.price != null ? parseFloat(courierCharge.price) : 0;
    const costPrice = courierCharge?.cost_price != null ? parseFloat(courierCharge.cost_price) : (sellPrice > 0 ? 3.76 : 0);

    const allSell = (s.charges || []).reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0) || sellPrice;
    const allCost = (s.charges || []).reduce((sum, c) => sum + (parseFloat(c.cost_price) || 0), 0) || costPrice;

    acc.revenue += allSell;
    acc.cost += allCost;
    if (s.charges?.some(c => !c.verified) || (!s.charges?.length && s.tracking_codes?.length)) {
      acc.awaitingRecon++;
    }
    return acc;
  }, { revenue: 0, cost: 0, awaitingRecon: 0 });

  const totalCount = summaryStats?.total_shipments ?? (pagination.total || shipments.length);
  const awaitingCount = summaryStats?.awaiting_reconciliation ?? computedStats.awaitingRecon;
  const totalRev = summaryStats?.total_revenue ?? (Math.round(computedStats.revenue * 100) / 100);
  const totalMargin = summaryStats?.gross_margin ?? (Math.round((computedStats.revenue - computedStats.cost) * 100) / 100);
  const marginPct = summaryStats?.gross_margin_pct ?? (totalRev > 0 ? Math.round((totalMargin / totalRev) * 1000) / 10 : 0);

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
            Live stream of parcel webhooks, tracking barcodes, DC service codes, and linked billing charges.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleReprocessAll}
            disabled={repricingAll}
            className="mv-btn-primary"
            style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Scan all stored webhook logs and re-ingest all shipments"
          >
            <RefreshCw size={14} className={repricingAll ? 'spin' : ''} /> {repricingAll ? 'Reprocessing...' : 'Reprocess Webhooks'}
          </button>
          <button
            onClick={handleRepriceAll}
            disabled={repricingAll}
            className="mv-btn-ghost"
            style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Recalculate prices for all unpriced shipments using the latest rate cards"
          >
            <Calculator size={14} /> Reprice All
          </button>
          <button
            onClick={handlePurgeGhosts}
            className="mv-btn-danger"
            style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Delete all empty ghost shipments"
          >
            <Trash2 size={14} /> Purge Ghost Records
          </button>
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
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── 5 Metric Card Tiles Across The Top ───────────────────────────── */}
      <div className="mv-kpis" style={{ marginBottom: 24 }}>
        {/* Tile 1: Total Shipments */}
        <div className="mv-kpi">
          <div className="mv-kpi-label">Total Shipments</div>
          <div className="mv-kpi-value mv-num">{totalCount.toLocaleString('en-GB')}</div>
          <div className="mv-kpi-sub">All ingested parcels</div>
        </div>

        {/* Tile 2: Awaiting Reconciliation */}
        <div className="mv-kpi">
          <div className="mv-kpi-label">Awaiting Reconciliation</div>
          <div className="mv-kpi-value mv-num" style={{ color: awaitingCount > 0 ? 'var(--mv-orange, #d97706)' : undefined }}>
            {awaitingCount.toLocaleString('en-GB')}
          </div>
          <div className="mv-kpi-sub">Booked & verified by tracking</div>
        </div>

        {/* Tile 3: Total Revenue */}
        <div className="mv-kpi">
          <div className="mv-kpi-label">Total Revenue</div>
          <div className="mv-kpi-value mv-num">
            £{totalRev.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mv-kpi-sub">Customer billed sell price</div>
        </div>

        {/* Tile 4: Total Gross Margin */}
        <div className="mv-kpi">
          <div className="mv-kpi-label">Total Gross Margin</div>
          <div className="mv-kpi-value mv-num" style={{ color: totalMargin >= 0 ? 'var(--mv-green-deep, #059669)' : 'var(--mv-magenta-deep, #dc2626)' }}>
            £{totalMargin.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mv-kpi-sub">Sell revenue minus buy cost</div>
        </div>

        {/* Tile 5: Gross Margin Percentage */}
        <div className="mv-kpi">
          <div className="mv-kpi-label">Gross Margin %</div>
          <div className="mv-kpi-value mv-num" style={{ color: marginPct >= 0 ? 'var(--mv-green-deep, #059669)' : 'var(--mv-magenta-deep, #dc2626)' }}>
            {marginPct}%
          </div>
          <div className="mv-kpi-sub">Blended profit margin</div>
        </div>
      </div>

      <div className="mv-rule" style={{ marginBottom: 20 }} />

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div className="mv-search" style={{ flex: 1, maxWidth: 360, height: 36 }}>
          <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search tracking, reference, customer, service…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="mv-search-clear"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={courierFilter}
          onChange={e => { setCourierFilter(e.target.value); setPage(1); }}
          className="pill-select"
          style={{ width: 160, height: 36 }}
        >
          <option value="">All Couriers</option>
          <option value="DPD">DPD</option>
          <option value="DHL">DHL</option>
          <option value="UPS">UPS</option>
          <option value="Evri">Evri</option>
          <option value="Royal Mail">Royal Mail</option>
          <option value="FedEx">FedEx</option>
          <option value="Yodel">Yodel</option>
        </select>

        <select
          value={customerFilter}
          onChange={e => { setCustomerFilter(e.target.value); setPage(1); }}
          className="pill-select"
          style={{ width: 220, height: 36 }}
        >
          <option value="">All Customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.company_name || c.trading_name || c.business_name || c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Shipments Table ─────────────────────────────────────────────── */}
      <table className="mv-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>State</th>
            <th>Date / Time</th>
            <th>Tracking / Consignment</th>
            <th>Customer</th>
            <th>Courier</th>
            <th>Service Code</th>
            <th>Weight</th>
            <th>Destination</th>
            <th>Sender Ref</th>
            <th className="tar">Cost Price</th>
            <th className="tar">Sell Price</th>
            <th style={{ width: 70, textAlign: 'center' }}>Inspect</th>
            <th style={{ width: 36 }}></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={13} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--mv-ink-50)' }}>
                Loading shipments...
              </td>
            </tr>
          ) : shipments.length === 0 ? (
            <tr>
              <td colSpan={13} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mv-ink-50)' }}>
                <Package size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, color: 'var(--mv-ink)', marginBottom: 4 }}>No shipments displayed currently</div>
                <div style={{ fontSize: 12, color: 'var(--mv-ink-50)', marginBottom: 14 }}>
                  New webhooks will appear here automatically, or you can re-ingest past webhooks from storage.
                </div>
                <button
                  onClick={handleReprocessAll}
                  disabled={repricingAll}
                  className="mv-btn-primary"
                  style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} className={repricingAll ? 'spin' : ''} /> {repricingAll ? 'Reprocessing...' : 'Reprocess Stored Webhooks'}
                </button>
              </td>
            </tr>
          ) : (
            shipments.map(s => {
              const baseCharge = s.charges?.find(c => c.charge_type === 'courier') || s.charges?.[0];
              const surcharges = (s.charges || []).filter(c => c.charge_type === 'surcharge');
              
              const totalSell = (s.charges || []).reduce((sum, c) => sum + (Number(c.price) || 0), 0);
              const totalCost = (s.charges || []).reduce((sum, c) => sum + (Number(c.cost_price) || 0), 0);
              
              const baseSell = baseCharge?.price != null ? Number(baseCharge.price) : null;
              const baseCost = baseCharge?.cost_price != null ? Number(baseCharge.cost_price) : null;
              const surchargesSell = surcharges.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
              const surchargesCost = surcharges.reduce((sum, c) => sum + (Number(c.cost_price) || 0), 0);

              const hasPricing = totalSell > 0 || baseSell != null;
              const sellVal = hasPricing ? totalSell : null;
              const costVal = hasPricing ? totalCost : null;
              const margin = (sellVal != null && costVal != null) ? (sellVal - costVal) : null;
              const marginPct = (sellVal && margin != null) ? ((margin / sellVal) * 100).toFixed(1) : null;
              const isSim = Boolean(s.raw_payload?.simulated);

              return (
                <tr key={s.id}>
                  <td>
                    <span
                      className={`mv-state ${s.cancelled ? 'attention' : (hasPricing && sellVal > 0) ? 'settled' : 'waiting'}`}
                      title={s.cancelled ? 'Cancelled' : (hasPricing && sellVal > 0) ? 'Rated & Priced' : 'Unpriced'}
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
                    {isSim && (
                      <span className="mv-chip" style={{ fontSize: 10, padding: '1px 4px', marginTop: 2 }}>
                        Simulated
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.customer_display_name || s.customer_name || 'Unmapped Customer'}</div>
                    <div style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>
                      Acct: {s.customer_account || '—'}
                    </div>
                  </td>
                  <td>
                    <CourierLogo courier={s.courier} service={s.service_name || s.dc_service_id} size={20} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                      {s.dc_service_id || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>
                      {s.service_name || '—'}
                    </div>
                  </td>
                  <td className="mv-num" style={{ fontSize: 13 }}>
                    {s.total_weight_kg ? `${Number(s.total_weight_kg).toFixed(1)} kg` : '—'}
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                      {s.ship_to_postcode || '—'} ({s.ship_to_country_iso || 'GB'})
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mv-ink-50)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    {costVal != null ? (
                      <div>
                        <div>£{costVal.toFixed(2)}</div>
                        {surchargesCost > 0 && (
                          <div style={{ fontSize: 10.5, color: 'var(--mv-ink-50)' }}>
                            Base £{baseCost?.toFixed(2)} + Sur £{surchargesCost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: 'var(--mv-ink-40)' }}>—</span>}
                  </td>
                  <td className="tar mv-num" style={{ fontWeight: 700 }}>
                    {sellVal != null ? (
                      <div>
                        <div>£{sellVal.toFixed(2)}</div>
                        {surcharges.length > 0 && (
                          <div style={{ fontSize: 10.5, color: 'var(--mv-ink-50)', fontWeight: 500 }}>
                            Base £{baseSell?.toFixed(2)} + {surcharges.length} surcharges (£{surchargesSell.toFixed(2)})
                          </div>
                        )}
                        {margin != null && (
                          <div style={{ fontSize: 10.5, color: margin >= 0 ? 'var(--mv-green)' : 'var(--mv-red)' }}>
                            {margin >= 0 ? '+' : ''}£{margin.toFixed(2)} {marginPct ? `(${marginPct}%)` : ''}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="mv-chip" style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', fontSize: 11 }}>
                        Unpriced
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => { setSelectedShipment(s); setActiveModalTab('pricing'); }}
                      className="mv-btn-ghost"
                      style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Inspect Payload & Pricing"
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
 
       {/* ── Pagination Controls ────────────────────────────────────────── */}
       <div style={{
         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
         padding: '12px 16px', borderTop: '1px solid var(--mv-border)',
         background: 'var(--mv-surface)', marginTop: 8, borderRadius: '0 0 6px 6px'
       }}>
         <div style={{ fontSize: 12.5, color: 'var(--mv-ink-60)' }}>
           Showing {pagination.total > 0 ? ((page - 1) * limit + 1) : 0}–{Math.min(page * limit, pagination.total)} of {pagination.total.toLocaleString('en-GB')} shipments
         </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--mv-ink-60)' }}>
             <span>Per page:</span>
             <select
               value={limit}
               onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
               className="mv-input"
               style={{ height: 28, fontSize: 12, padding: '2px 8px' }}
             >
               <option value={25}>25</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </select>
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
             <button
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page <= 1 || loading}
               className="mv-btn-ghost"
               style={{ padding: '4px 10px', fontSize: 12 }}
             >
               Previous
             </button>
             
             <span style={{ fontSize: 12.5, padding: '0 8px', fontWeight: 600 }}>
               Page {page} of {Math.max(1, pagination.pages || 1)}
             </span>

             <button
               onClick={() => setPage(p => Math.min(pagination.pages || 1, p + 1))}
               disabled={page >= (pagination.pages || 1) || loading}
               className="mv-btn-ghost"
               style={{ padding: '4px 10px', fontSize: 12 }}
             >
               Next
             </button>
           </div>
         </div>
       </div>

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
               This tool creates sample parcel shipments matching the DPD invoice lines and assigns them to a chosen customer.
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
                     {c.company_name || c.trading_name || c.business_name || c.name} ({c.account_number || 'No Account #'})
                   </option>
                 ))}
               </select>
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
                 {injecting ? 'Injecting...' : 'Inject Sample Shipments'}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* ── Multi-Tab Payload & Pricing Audit Modal ────────────────────── */}
       {selectedShipment && (
         <div style={{
           position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
           display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
         }}>
           <div style={{
             background: '#fff', width: 780, maxHeight: '88vh', border: '2px solid var(--mv-divider)',
             display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
           }}>
             {/* Modal Header */}
             <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--mv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <CourierLogo courier={selectedShipment.courier} size={22} />
                 <div>
                   <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                     Shipment {selectedShipment.tracking_codes?.[0] || selectedShipment.reference || selectedShipment.id}
                   </h3>
                   <div style={{ fontSize: 12, color: 'var(--mv-ink-60)', marginTop: 2 }}>
                     Service Code: <strong>{selectedShipment.dc_service_id || 'DPD-12'}</strong> | Customer: <strong>{selectedShipment.customer_display_name || selectedShipment.customer_name || 'Cranswick'}</strong>
                   </div>
                 </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <button
                   onClick={() => handleRepriceSingle(selectedShipment.id)}
                   disabled={repricingSingle}
                   className="mv-btn"
                   style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                 >
                   <Calculator size={13} /> {repricingSingle ? 'Calculating...' : 'Re-calculate Pricing'}
                 </button>
                 <button onClick={() => setSelectedShipment(null)} className="mv-btn-ghost" style={{ padding: '6px 10px' }}>
                   ✕
                 </button>
               </div>
             </div>

             {/* Modal Tabs */}
             <div style={{ display: 'flex', borderBottom: '1px solid var(--mv-border)', background: 'var(--mv-surface)' }}>
               <button
                 onClick={() => setActiveModalTab('pricing')}
                 style={{
                   padding: '10px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                   borderBottom: activeModalTab === 'pricing' ? '2px solid var(--mv-ink)' : '2px solid transparent',
                   color: activeModalTab === 'pricing' ? 'var(--mv-ink)' : 'var(--mv-ink-60)'
                 }}
               >
                 Pricing & Margin Audit
               </button>
               <button
                 onClick={() => setActiveModalTab('response')}
                 style={{
                   padding: '10px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                   borderBottom: activeModalTab === 'response' ? '2px solid var(--mv-ink)' : '2px solid transparent',
                   color: activeModalTab === 'response' ? 'var(--mv-ink)' : 'var(--mv-ink-60)'
                 }}
               >
                 Carrier Response JSON
               </button>
               <button
                 onClick={() => setActiveModalTab('raw')}
                 style={{
                   padding: '10px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                   borderBottom: activeModalTab === 'raw' ? '2px solid var(--mv-ink)' : '2px solid transparent',
                   color: activeModalTab === 'raw' ? 'var(--mv-ink)' : 'var(--mv-ink-60)'
                 }}
               >
                 Raw Webhook Payload
               </button>
             </div>

             {/* Modal Content */}
             <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
               {activeModalTab === 'pricing' && (
                 <div>
                   {(() => {
                     const allSell = (selectedShipment.charges || []).reduce((sum, c) => sum + (Number(c.price) || 0), 0);
                     const allCost = (selectedShipment.charges || []).reduce((sum, c) => sum + (Number(c.cost_price) || 0), 0);
                     const allMargin = allSell - allCost;
                     const allMarginPct = allSell > 0 ? ((allMargin / allSell) * 100).toFixed(1) : null;

                     return (
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                         <div className="mv-card" style={{ padding: 14, background: 'var(--mv-surface)' }}>
                           <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-ink-60)', textTransform: 'uppercase' }}>Total Customer Sell Price</div>
                           <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }} className="mv-num">
                             £{allSell.toFixed(2)}
                           </div>
                           <div style={{ fontSize: 11.5, color: 'var(--mv-ink-50)', marginTop: 2 }}>
                             Billed to {selectedShipment.customer_display_name || selectedShipment.customer_name || 'Customer'}
                           </div>
                         </div>

                         <div className="mv-card" style={{ padding: 14, background: 'var(--mv-surface)' }}>
                           <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-ink-60)', textTransform: 'uppercase' }}>Total Carrier Buy Cost</div>
                           <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }} className="mv-num">
                             £{allCost.toFixed(2)}
                           </div>
                           <div style={{ fontSize: 11.5, color: 'var(--mv-ink-50)', marginTop: 2 }}>
                             Payable to {selectedShipment.courier || 'DPD'}
                           </div>
                         </div>

                         <div className="mv-card" style={{ padding: 14, background: 'var(--mv-surface)' }}>
                           <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-ink-60)', textTransform: 'uppercase' }}>Total Profit Margin</div>
                           <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: allMargin >= 0 ? 'var(--mv-green)' : 'var(--mv-red)' }} className="mv-num">
                             {allMargin >= 0 ? '+' : ''}£{allMargin.toFixed(2)}
                           </div>
                           <div style={{ fontSize: 11.5, color: 'var(--mv-ink-50)', marginTop: 2 }}>
                             {allMarginPct != null ? `${allMarginPct}% gross margin` : 'Awaiting rate calculation'}
                           </div>
                         </div>
                       </div>
                     );
                   })()}

                   {/* Audit Details */}
                   <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                     Matching & Resolution Audit
                   </h4>
                   <table className="mv-table" style={{ fontSize: 12.5, marginBottom: 20 }}>
                     <tbody>
                       <tr>
                         <td style={{ width: 160, fontWeight: 600, color: 'var(--mv-ink-60)' }}>Matched Service Code</td>
                         <td><code>{selectedShipment.dc_service_id || 'DPD-12'}</code> ({selectedShipment.service_name || 'DPD Domestic Parcel Next Day'})</td>
                       </tr>
                       <tr>
                         <td style={{ fontWeight: 600, color: 'var(--mv-ink-60)' }}>Weight & Parcels</td>
                         <td>{selectedShipment.total_weight_kg || 1} kg ({selectedShipment.parcel_count || 1} parcel)</td>
                       </tr>
                       <tr>
                         <td style={{ fontWeight: 600, color: 'var(--mv-ink-60)' }}>Destination Postcode</td>
                         <td>{selectedShipment.ship_to_postcode || '—'} ({selectedShipment.ship_to_country_iso || 'GB'})</td>
                       </tr>
                       <tr>
                         <td style={{ fontWeight: 600, color: 'var(--mv-ink-60)' }}>Matched Customer ID</td>
                         <td><code>{selectedShipment.customer_id || 'Not linked'}</code></td>
                       </tr>
                     </tbody>
                   </table>

                   {/* Charges list */}
                   <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                     Linked Charges & Surcharges ({selectedShipment.charges?.length || 0})
                   </h4>
                   {selectedShipment.charges?.length ? (
                     <table className="mv-table" style={{ fontSize: 12.5 }}>
                       <thead>
                         <tr>
                           <th>Description</th>
                           <th>Charge Type</th>
                           <th className="tar">Cost Price</th>
                           <th className="tar">Sell Price</th>
                           <th className="tar">Margin</th>
                           <th>Status</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedShipment.charges.map((c, idx) => {
                           const cSell = Number(c.price || 0);
                           const cCost = Number(c.cost_price || 0);
                           const cMarg = cSell - cCost;

                           const chargeLabel = c.service_name || (c.charge_type === 'courier'
                             ? `${selectedShipment.service_name || 'Base Courier Delivery'} (${selectedShipment.dc_service_id || 'DPD'})`
                             : 'Carrier Surcharge');

                           return (
                             <tr key={c.id || idx}>
                               <td style={{ fontWeight: 600 }}>
                                 {chargeLabel}
                                 {c.price_failure_reason && (
                                   <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 400 }}>
                                     {c.price_failure_reason}
                                   </div>
                                 )}
                               </td>
                               <td><span className="mv-chip">{c.charge_type}</span></td>
                               <td className="tar mv-num">£{cCost.toFixed(2)}</td>
                               <td className="tar mv-num" style={{ fontWeight: 700 }}>£{cSell.toFixed(2)}</td>
                               <td className="tar mv-num" style={{ fontWeight: 600, color: cMarg >= 0 ? 'var(--mv-green)' : 'var(--mv-red)' }}>
                                 {cMarg >= 0 ? '+' : ''}£{cMarg.toFixed(2)}
                               </td>
                               <td><span className={`mv-state ${c.verified ? 'settled' : 'waiting'}`} /> {c.status || (c.verified ? 'verified' : 'pending')}</td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   ) : (
                     <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#991b1b', fontSize: 12.5 }}>
                       No charges currently generated for this shipment. Click <strong>"Re-calculate Pricing"</strong> above to apply customer rates.
                     </div>
                   )}
                 </div>
               )}

               {activeModalTab === 'response' && (
                 <div>
                   <div style={{ marginBottom: 12, fontSize: 12.5, color: 'var(--mv-ink-60)' }}>
                     Carrier response details extracted from the webhook payload:
                   </div>
                   <pre style={{
                     background: 'var(--mv-surface)', padding: 14, borderRadius: 4,
                     fontSize: 12, fontFamily: 'monospace', margin: 0, overflow: 'auto'
                   }}>
                     {(() => {
                       let raw = selectedShipment.raw_payload;
                       if (typeof raw === 'string') {
                         try { raw = JSON.parse(raw); } catch (_) {}
                       }
                       let resp = raw?.response || raw?.json?.response || null;
                       if (typeof resp === 'string') {
                         try { resp = JSON.parse(resp); } catch (_) {}
                       }
                       return JSON.stringify(resp || { message: 'No carrier response embedded in this payload' }, null, 2);
                     })()}
                   </pre>
                 </div>
               )}

               {activeModalTab === 'raw' && (
                 <pre style={{
                   background: 'var(--mv-surface)', padding: 14, borderRadius: 4,
                   fontSize: 12, fontFamily: 'monospace', margin: 0, overflow: 'auto', maxHeight: '55vh'
                 }}>
                   {(() => {
                     let raw = selectedShipment.raw_payload;
                     if (typeof raw === 'string') {
                       try { raw = JSON.parse(raw); } catch (_) {}
                     }
                     return JSON.stringify(raw || selectedShipment, null, 2);
                   })()}
                 </pre>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
}
