/**
 * TrackingPage — Global parcel tracking view
 * Stats · Filters · Search · Live parcel table · Event timeline drawer
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, X, Truck, PackageCheck, Clock, AlertTriangle,
  ShieldAlert, RotateCcw, Package, ChevronRight, MapPin,
  RefreshCw, Filter,
} from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Status config ────────────────────────────────────────────
const STATUS = {
  booked:           { label: 'Booked',           color: '#00BCD4', bg: 'rgba(0,188,212,0.12)',    icon: Package },
  collected:        { label: 'Collected',         color: '#2196F3', bg: 'rgba(33,150,243,0.12)',   icon: Package },
  in_transit:       { label: 'In Transit',        color: '#7B2FBE', bg: 'rgba(123,47,190,0.12)',   icon: Truck },
  out_for_delivery: { label: 'Out for Delivery',  color: '#FFC107', bg: 'rgba(255,193,7,0.12)',    icon: Truck },
  delivered:        { label: 'Delivered',         color: '#00C853', bg: 'rgba(0,200,83,0.12)',     icon: PackageCheck },
  failed_delivery:  { label: 'Failed Delivery',   color: '#F44336', bg: 'rgba(244,67,54,0.12)',    icon: AlertTriangle },
  on_hold:          { label: 'On Hold',           color: '#FF9800', bg: 'rgba(255,152,0,0.12)',    icon: Clock },
  customs_hold:     { label: 'Customs Hold',      color: '#E91E8C', bg: 'rgba(233,30,140,0.12)',   icon: ShieldAlert },
  exception:        { label: 'Exception',         color: '#E91E8C', bg: 'rgba(233,30,140,0.12)',   icon: AlertTriangle },
  returned:         { label: 'Returned',          color: '#607D8B', bg: 'rgba(96,125,139,0.12)',   icon: RotateCcw },
  unknown:          { label: 'Unknown',           color: '#555555', bg: 'rgba(255,255,255,0.05)',  icon: Package },
};

function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS[status] || STATUS.unknown;
  const Icon = cfg.icon;
  const isLg = size === 'lg';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: isLg ? 7 : 5,
      padding: isLg ? '5px 12px' : '3px 9px',
      borderRadius: 9999,
      background: cfg.bg,
      border: `1px solid ${cfg.color}44`,
      color: cfg.color,
      fontSize: isLg ? 13 : 11,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={isLg ? 13 : 10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

// ─── Relative time ────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 120,
        padding: '14px 18px',
        background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 11, color: active ? color : '#AAAAAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: active ? color : '#fff', lineHeight: 1 }}>
        {(value || 0).toLocaleString()}
      </div>
    </button>
  );
}

// ─── Event timeline ───────────────────────────────────────────
function EventTimeline({ events }) {
  if (!events?.length) return <p style={{ color: '#555', fontSize: 13, fontStyle: 'italic' }}>No events yet</p>;
  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical line */}
      <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)' }} />
      {events.map((ev, i) => {
        const cfg = STATUS[ev.status] || STATUS.unknown;
        return (
          <div key={ev.id} style={{ display: 'flex', gap: 16, marginBottom: 18, position: 'relative' }}>
            {/* Dot */}
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <StatusBadge status={ev.status} />
                <span style={{ fontSize: 11, color: '#555' }}>{timeAgo(ev.event_at)}</span>
              </div>
              {ev.description && <p style={{ fontSize: 13, color: '#DDD', margin: '3px 0' }}>{ev.description}</p>}
              {ev.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#AAAAAA' }}>
                  <MapPin size={11} /> {ev.location}
                </span>
              )}
              <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>
                {new Date(ev.event_at).toLocaleString('en-GB')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Parcel drawer ────────────────────────────────────────────
function ParcelDrawer({ consignment, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['parcel', consignment],
    queryFn:  () => api.get(`/tracking/${encodeURIComponent(consignment)}`).then(r => r.data),
    enabled:  !!consignment,
  });

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 480, background: '#0F1128',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 401, display: 'flex', flexDirection: 'column',
        boxShadow: '-32px 0 80px rgba(0,0,0,0.5)',
      }}>
        {/* Drawer header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#AAAAAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Consignment</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{consignment}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#AAAAAA' }}>Loading…</div>
        ) : data ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {/* Current status */}
            <div style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <StatusBadge status={data.status} size="lg" />
              {data.status_description && <p style={{ fontSize: 13, color: '#DDD', marginTop: 8, marginBottom: 0 }}>{data.status_description}</p>}
              {data.last_location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#AAAAAA', marginTop: 6 }}>
                  <MapPin size={12} /> {data.last_location}
                </div>
              )}
            </div>

            {/* Parcel details */}
            <div style={{ marginBottom: 20 }}>
              {[
                ['Courier',    [data.courier_name, data.service_name].filter(Boolean).join(' · ')],
                ['Customer',   data.customer_name || data.customer_account],
                ['Recipient',  data.recipient_name],
                ['Postcode',   data.recipient_postcode],
                ['Weight',     data.weight_kg ? `${data.weight_kg} kg` : null],
                ['Est. delivery', data.estimated_delivery ? fmtDate(data.estimated_delivery) : null],
                ['Delivered',  data.delivered_at ? new Date(data.delivered_at).toLocaleString('en-GB') : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, color: '#AAAAAA', width: 120, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Event timeline */}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Event History ({data.events?.length || 0})
            </div>
            <EventTimeline events={data.events} />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Not found</div>
        )}
      </div>
    </>
  );
}

// ─── Main tracking page ───────────────────────────────────────
const ACTIVE_STATUSES = ['booked','collected','in_transit','out_for_delivery','failed_delivery','on_hold','customs_hold','exception'];

export default function TrackingPage() {
  const [search,       setSearch]       = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courierFilter,setCourierFilter]= useState('');
  const [page,         setPage]         = useState(0);
  const [selected,     setSelected]     = useState(null);
  const searchRef = useRef(null);
  const LIMIT = 50;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter, courierFilter]);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['tracking-stats'],
    queryFn:  () => api.get('/tracking/stats').then(r => r.data),
    refetchInterval: 60000, // auto-refresh every minute
  });

  const { data: list, isLoading, refetch: refetchList } = useQuery({
    queryKey: ['tracking-list', debouncedSearch, statusFilter, courierFilter, page],
    queryFn:  () => api.get('/tracking', { params: {
      search: debouncedSearch || undefined,
      status: statusFilter    || undefined,
      courier_code: courierFilter || undefined,
      limit: LIMIT,
      offset: page * LIMIT,
    }}).then(r => r.data),
    refetchInterval: 60000,
  });

  function refresh() { refetchStats(); refetchList(); }

  const parcels = list?.parcels || [];
  const total   = list?.total   || 0;
  const pages   = Math.ceil(total / LIMIT);

  const bs = stats?.by_status || {};

  // Stat card click toggles status filter
  function toggleStatus(s) { setStatusFilter(f => f === s ? '' : s); }

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Tracking</h1>
          <p style={{ fontSize: 13, color: '#AAAAAA', margin: '4px 0 0' }}>
            {stats ? `${(stats.total_active || 0).toLocaleString()} active parcels` : 'Loading…'}
          </p>
        </div>
        <button onClick={refresh} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: '#AAAAAA', fontSize: 12, padding: '7px 14px', cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="In Transit"       value={(bs.in_transit||0)+(bs.collected||0)+(bs.booked||0)} color="#7B2FBE" icon={Truck}        active={statusFilter==='in_transit'}       onClick={() => toggleStatus('in_transit')} />
        <StatCard label="Out for Delivery" value={bs.out_for_delivery}  color="#FFC107" icon={Truck}        active={statusFilter==='out_for_delivery'} onClick={() => toggleStatus('out_for_delivery')} />
        <StatCard label="Failed"           value={bs.failed_delivery}   color="#F44336" icon={AlertTriangle} active={statusFilter==='failed_delivery'}  onClick={() => toggleStatus('failed_delivery')} />
        <StatCard label="On Hold"          value={bs.on_hold}           color="#FF9800" icon={Clock}         active={statusFilter==='on_hold'}           onClick={() => toggleStatus('on_hold')} />
        <StatCard label="Customs Hold"     value={bs.customs_hold}      color="#E91E8C" icon={ShieldAlert}   active={statusFilter==='customs_hold'}      onClick={() => toggleStatus('customs_hold')} />
        <StatCard label="Exception"        value={bs.exception}         color="#E91E8C" icon={AlertTriangle} active={statusFilter==='exception'}         onClick={() => toggleStatus('exception')} />
        <StatCard label="Delivered Today"  value={stats?.delivered_today} color="#00C853" icon={PackageCheck} active={statusFilter==='delivered'}        onClick={() => toggleStatus('delivered')} />
      </div>

      {/* ── Filters row ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none' }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by consignment, postcode, customer or recipient…"
            style={{ width: '100%', boxSizing: 'border-box', background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 36px', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Courier filter */}
        {stats?.by_courier?.length > 0 && (
          <div className="pill-input-wrap" style={{ height: 38, width: 180 }}>
            <select
              value={courierFilter}
              onChange={e => setCourierFilter(e.target.value)}
              style={{ fontSize: 13, paddingLeft: 12, color: courierFilter ? '#fff' : '#AAAAAA' }}
            >
              <option value="">All couriers</option>
              {stats.by_courier.map(c => (
                <option key={c.courier_code || c.courier_name} value={c.courier_code || c.courier_name}>
                  {c.courier_name} ({c.count})
                </option>
              ))}
            </select>
            <div className="green-cap">▾</div>
          </div>
        )}

        {/* Active filter chips */}
        {(statusFilter || courierFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setCourierFilter(''); setSearch(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(233,30,140,0.1)', border: '1px solid rgba(233,30,140,0.3)', borderRadius: 7, color: '#E91E8C', fontSize: 12, fontWeight: 700, padding: '7px 14px', cursor: 'pointer' }}>
            <X size={12} /> Clear filters
          </button>
        )}

        {/* Count */}
        <span style={{ fontSize: 12, color: '#555', marginLeft: 'auto' }}>
          {total.toLocaleString()} parcel{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Parcel table ─────────────────────────────────────────── */}
      <div className="moov-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#AAAAAA' }}>Loading…</div>
        ) : parcels.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, color: '#555', fontWeight: 600 }}>
              {debouncedSearch || statusFilter || courierFilter ? 'No parcels match your filters' : 'No tracking data yet'}
            </div>
            {!debouncedSearch && !statusFilter && (
              <div style={{ fontSize: 13, color: '#444', marginTop: 8 }}>
                Tracking events will appear here as webhooks arrive
              </div>
            )}
          </div>
        ) : (
          <table className="moov-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Consignment</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Last Event</th>
                <th style={{ width: 90, textAlign: 'center' }}>Est. Del.</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {parcels.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p.consignment_number)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00BCD4', fontSize: 12 }}>
                      {p.consignment_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{p.customer_name || '—'}</div>
                    {p.customer_account && <div style={{ fontSize: 11, color: '#555' }}>{p.customer_account}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: '#DDD' }}>{p.courier_name || '—'}</div>
                    {p.service_name && <div style={{ fontSize: 11, color: '#555' }}>{p.service_name}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: '#DDD' }}>{p.recipient_name || '—'}</div>
                    {p.recipient_postcode && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#AAAAAA' }}>
                        <MapPin size={10} /> {p.recipient_postcode}
                      </span>
                    )}
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div style={{ fontSize: 12, color: '#DDD' }}>{p.status_description?.slice(0, 40) || p.last_location || '—'}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>{timeAgo(p.last_event_at)}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: 12, color: '#AAAAAA' }}>
                    {p.status === 'delivered'
                      ? <span style={{ color: '#00C853', fontWeight: 700 }}>✓ Done</span>
                      : fmtDate(p.estimated_delivery)}
                  </td>
                  <td><ChevronRight size={14} color="#333" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────── */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="btn-ghost" style={{ height: 32, padding: '0 14px', fontSize: 12 }}>← Prev</button>
          <span style={{ fontSize: 13, color: '#AAAAAA' }}>Page {page + 1} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
            className="btn-ghost" style={{ height: 32, padding: '0 14px', fontSize: 12 }}>Next →</button>
        </div>
      )}

      {/* ── Parcel detail drawer ─────────────────────────────────── */}
      {selected && <ParcelDrawer consignment={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
