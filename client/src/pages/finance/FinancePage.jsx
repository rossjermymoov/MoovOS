import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, CheckCircle, XCircle, AlertCircle,
  Edit2, Check, X, RefreshCw, Download, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { billingApi } from '../../api/billing';
import { customersApi } from '../../api/customers';
import { format, parseISO } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const gbp = (n) =>
  n == null ? '—' : `£${parseFloat(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function fmt(dt) {
  if (!dt) return '—';
  try { return format(parseISO(dt), 'd MMM yyyy'); } catch { return dt; }
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#AAAAAA', bg = 'rgba(255,255,255,0.04)' }) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${color}33`,
      borderRadius: 10,
      padding: '14px 18px',
      minWidth: 140,
      flex: 1,
    }}>
      <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Flag badge ───────────────────────────────────────────────────────────────

function FlagBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  if (value) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.3)',
        color: '#00C853', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
        <Check size={10} /> {trueLabel}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      color: '#666', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {falseLabel}
    </span>
  );
}

// ─── Inline price editor ──────────────────────────────────────────────────────

function PriceCell({ charge, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function startEdit() {
    setVal(charge.price != null ? String(charge.price) : '');
    setEditing(true);
  }

  function commit() {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) onSave(n);
    setEditing(false);
  }

  function cancel() { setEditing(false); }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#AAAAAA', fontSize: 13 }}>£</span>
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          style={{
            width: 72, background: 'rgba(255,255,255,0.08)', border: '1px solid #00C853',
            borderRadius: 5, color: '#fff', padding: '3px 6px', fontSize: 13, fontWeight: 700,
          }}
        />
        <button onClick={commit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C853', padding: 2 }}>
          <Check size={13} />
        </button>
        <button onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 2 }}>
          <X size={13} />
        </button>
      </div>
    );
  }

  if (charge.price == null) {
    return (
      <button onClick={startEdit} style={{
        background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.4)',
        borderRadius: 5, color: '#FFC107', padding: '3px 10px', fontSize: 12, fontWeight: 700,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        <AlertCircle size={11} /> Set Price
      </button>
    );
  }

  return (
    <button onClick={startEdit} style={{
      background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.25)',
      borderRadius: 5, color: '#00C853', padding: '3px 10px', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {gbp(charge.price)}
      <Edit2 size={10} style={{ opacity: 0.6 }} />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [25, 50, 100];
const BILLED_OPTS = [
  { value: '', label: 'All' },
  { value: 'false', label: 'Unbilled' },
  { value: 'true', label: 'Billed' },
];

export default function FinancePage() {
  const qc = useQueryClient();

  const [filters, setFilters] = useState({
    search: '',
    customer_id: '',
    billed: '',
    date_from: '',
    date_to: '',
  });
  const [showUnpriced, setShowUnpriced] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Customer dropdown data
  const { data: custData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list({ limit: 500 }),
    staleTime: 60_000,
  });
  const customers = custData?.data || [];

  // Stats
  const statsParams = {
    customer_id: filters.customer_id || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  };
  const { data: stats } = useQuery({
    queryKey: ['billing-stats', statsParams],
    queryFn: () => billingApi.getStats(statsParams),
    staleTime: 10_000,
  });

  // Charges list
  const chargesParams = {
    charge_type: 'courier',
    customer_id: filters.customer_id || undefined,
    search: filters.search || undefined,
    billed: filters.billed || undefined,
    cancelled: 'false',
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    limit,
    offset,
  };
  const { data: chargesData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['billing-charges', chargesParams],
    queryFn: () => billingApi.getCharges(chargesParams),
    staleTime: 5_000,
    keepPreviousData: true,
  });

  const charges = chargesData?.charges || [];
  const total   = chargesData?.total   || 0;
  const totalPages  = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  // Filter to unpriced locally if toggle is on
  const displayCharges = showUnpriced ? charges.filter(c => c.price == null) : charges;

  // Mutations
  const patch = useMutation({
    mutationFn: ({ id, data }) => billingApi.updateCharge(id, data),
    onSuccess: () => { qc.invalidateQueries(['billing-charges']); qc.invalidateQueries(['billing-stats']); },
  });

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
    setOffset(0);
  }

  function toggleBilled(charge) {
    patch.mutate({ id: charge.id, data: { billed: !charge.billed } });
  }

  function toggleVerified(charge) {
    patch.mutate({ id: charge.id, data: { verified: !charge.verified } });
  }

  function savePrice(charge, price) {
    patch.mutate({ id: charge.id, data: { price } });
  }

  function cancelCharge(charge) {
    if (!confirm(`Cancel charge for order ${charge.order_id || charge.id.slice(0, 8)}?`)) return;
    patch.mutate({ id: charge.id, data: { cancelled: true } });
  }

  const th = { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '10px 12px', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' };

  const td = { padding: '10px 12px', fontSize: 13, color: '#CCC', verticalAlign: 'middle',
    borderBottom: '1px solid rgba(255,255,255,0.04)' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853' }}>Finance & Billing</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-ghost"
            onClick={() => refetch()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <StatCard
          label="Total Charges"
          value={stats?.total_charges ?? '—'}
          color="#AAAAAA"
        />
        <StatCard
          label="Unpriced"
          value={stats?.unpriced ?? '—'}
          sub="Needs manual price"
          color="#FFC107"
          bg="rgba(255,193,7,0.05)"
        />
        <StatCard
          label="Pending Billing"
          value={stats?.pending ?? '—'}
          sub="Priced, not yet billed"
          color="#FFC107"
          bg="rgba(255,193,7,0.05)"
        />
        <StatCard
          label="Billed"
          value={stats?.billed ?? '—'}
          color="#00C853"
          bg="rgba(0,200,83,0.05)"
        />
        <StatCard
          label="Total Value"
          value={gbp(stats?.total_value)}
          color="#AAAAAA"
        />
        <StatCard
          label="Unbilled Value"
          value={gbp(stats?.unbilled_value)}
          sub="Not yet invoiced"
          color="#FFC107"
          bg="rgba(255,193,7,0.05)"
        />
      </div>

      {/* Filter bar */}
      <div className="moov-card" style={{ padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div className="pill-input-wrap" style={{ minWidth: 240, flex: 1 }}>
            <Search size={14} style={{ marginLeft: 14, color: '#AAAAAA', flexShrink: 0 }} />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search customer, order ID, service…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#fff', fontSize: 13, padding: '8px 14px 8px 8px' }}
            />
            {filters.search && (
              <button onClick={() => setFilter('search', '')}
                style={{ marginRight: 8, background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2 }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Customer */}
          <select
            value={filters.customer_id}
            onChange={e => setFilter('customer_id', e.target.value)}
            className="pill-select"
            style={{ minWidth: 180 }}
          >
            <option value="">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Billed filter */}
          {BILLED_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setFilter('billed', o.value)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1px solid',
                borderColor: filters.billed === o.value ? '#00C853' : 'rgba(255,255,255,0.12)',
                background: filters.billed === o.value ? 'rgba(0,200,83,0.12)' : 'transparent',
                color: filters.billed === o.value ? '#00C853' : '#888',
                cursor: 'pointer',
              }}
            >
              {o.label}
            </button>
          ))}

          {/* Unpriced toggle */}
          <button
            onClick={() => setShowUnpriced(v => !v)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: '1px solid',
              borderColor: showUnpriced ? '#FFC107' : 'rgba(255,255,255,0.12)',
              background: showUnpriced ? 'rgba(255,193,7,0.12)' : 'transparent',
              color: showUnpriced ? '#FFC107' : '#888',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            <AlertCircle size={12} /> Unpriced Only
          </button>

          {/* Date range */}
          <input
            type="date"
            value={filters.date_from}
            onChange={e => setFilter('date_from', e.target.value)}
            className="pill-select"
            style={{ width: 140 }}
            title="From date"
          />
          <span style={{ color: '#555', fontSize: 12 }}>–</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={e => setFilter('date_to', e.target.value)}
            className="pill-select"
            style={{ width: 140 }}
            title="To date"
          />

          {/* Clear filters */}
          {(filters.search || filters.customer_id || filters.billed || filters.date_from || filters.date_to || showUnpriced) && (
            <button
              onClick={() => { setFilters({ search: '', customer_id: '', billed: '', date_from: '', date_to: '' }); setShowUnpriced(false); setOffset(0); }}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}
            >
              Clear
            </button>
          )}

        </div>
      </div>

      {/* Table */}
      <div className="moov-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={th}>Date</th>
                <th style={th}>Customer</th>
                <th style={th}>Order ID</th>
                <th style={{ ...th, textAlign: 'center' }}>Qty</th>
                <th style={th}>Service</th>
                <th style={{ ...th, textAlign: 'right' }}>Price (ex. VAT)</th>
                <th style={{ ...th, textAlign: 'right' }}>VAT</th>
                <th style={{ ...th, textAlign: 'center' }}>Billed</th>
                <th style={{ ...th, textAlign: 'center' }}>Verified</th>
                <th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: 'center', padding: 40, color: '#555' }}>
                    Loading charges…
                  </td>
                </tr>
              )}
              {!isLoading && displayCharges.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: 'center', padding: 40, color: '#555' }}>
                    No charges found
                  </td>
                </tr>
              )}
              {displayCharges.map(charge => (
                <tr key={charge.id}
                  style={{
                    opacity: charge.cancelled ? 0.45 : 1,
                    background: charge.price == null ? 'rgba(255,193,7,0.03)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Date */}
                  <td style={{ ...td, color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmt(charge.created_at)}
                  </td>

                  {/* Customer */}
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{charge.customer_name || '—'}</div>
                    {charge.customer_account && (
                      <div style={{ fontSize: 11, color: '#666' }}>{charge.customer_account}</div>
                    )}
                  </td>

                  {/* Order ID */}
                  <td style={td}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#CCC' }}>
                      {charge.order_id || '—'}
                    </span>
                    {charge.reference_2 && (
                      <div style={{ fontSize: 11, color: '#666' }}>{charge.reference_2}</div>
                    )}
                  </td>

                  {/* Qty */}
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.06)', borderRadius: 5,
                      padding: '2px 8px', fontSize: 12, fontWeight: 700, color: '#CCC',
                    }}>
                      {charge.parcel_qty}
                    </span>
                  </td>

                  {/* Service */}
                  <td style={td}>
                    <div style={{ fontSize: 12, color: '#CCC' }}>{charge.service_name || '—'}</div>
                    {charge.courier && (
                      <div style={{ fontSize: 11, color: '#666' }}>{charge.courier}</div>
                    )}
                    {charge.zone_name && (
                      <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                        {charge.zone_name}{charge.weight_class_name ? ` · ${charge.weight_class_name}` : ''}
                        {charge.price_auto && <span style={{ color: '#00C853', marginLeft: 4 }}>●</span>}
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td style={{ ...td, textAlign: 'right' }}>
                    {charge.cancelled ? (
                      <span style={{ color: '#555', textDecoration: 'line-through', fontSize: 12 }}>
                        {gbp(charge.price)}
                      </span>
                    ) : (
                      <PriceCell charge={charge} onSave={(price) => savePrice(charge, price)} />
                    )}
                  </td>

                  {/* VAT */}
                  <td style={{ ...td, textAlign: 'right', color: '#666', fontSize: 12 }}>
                    {charge.price != null ? gbp(charge.vat_amount) : '—'}
                  </td>

                  {/* Billed */}
                  <td style={{ ...td, textAlign: 'center' }}>
                    {charge.cancelled ? <FlagBadge value={false} falseLabel="Cancelled" /> : (
                      <button
                        onClick={() => !charge.cancelled && toggleBilled(charge)}
                        title={charge.billed ? 'Mark as unbilled' : 'Mark as billed'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      >
                        <FlagBadge value={charge.billed} trueLabel="Billed" falseLabel="Pending" />
                      </button>
                    )}
                  </td>

                  {/* Verified */}
                  <td style={{ ...td, textAlign: 'center' }}>
                    {!charge.cancelled && (
                      <button
                        onClick={() => toggleVerified(charge)}
                        title={charge.verified ? 'Mark as unverified' : 'Mark as verified'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      >
                        <FlagBadge value={charge.verified} trueLabel="Verified" falseLabel="Unverified" />
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ ...td, textAlign: 'center' }}>
                    {!charge.cancelled && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {/* Mark billed quick-action */}
                        {!charge.billed && charge.price != null && (
                          <button
                            onClick={() => toggleBilled(charge)}
                            title="Mark as billed"
                            style={{
                              background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)',
                              borderRadius: 5, color: '#00C853', padding: '4px 8px',
                              cursor: 'pointer', fontSize: 11, fontWeight: 600,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <CheckCircle size={11} /> Bill
                          </button>
                        )}
                        {/* Cancel */}
                        <button
                          onClick={() => cancelCharge(charge)}
                          title="Cancel charge"
                          style={{
                            background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.25)',
                            borderRadius: 5, color: '#F44336', padding: '4px 8px',
                            cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <XCircle size={11} /> Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10,
          }}>
            <span style={{ fontSize: 12, color: '#666' }}>
              {offset + 1}–{Math.min(offset + limit, total)} of {total} charges
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={limit}
                onChange={e => { setLimit(parseInt(e.target.value)); setOffset(0); }}
                className="pill-select"
                style={{ width: 80 }}
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
              <button
                className="btn-ghost"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 12, color: '#888' }}>{currentPage} / {totalPages}</span>
              <button
                className="btn-ghost"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer: record count when no pagination */}
        {total <= limit && total > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 12, color: '#555' }}>{total} charge{total !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
