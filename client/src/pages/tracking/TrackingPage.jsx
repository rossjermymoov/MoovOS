/**
 * TrackingPage — Global parcel tracking view
 * Stats · Filters · Search · Live parcel table · Event timeline drawer
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, X, Truck, PackageCheck, Clock, AlertTriangle,
  ShieldAlert, RotateCcw, Package, ChevronRight, MapPin,
  RefreshCw, Store, Calendar, Plane, PackageX,
  Warehouse, OctagonX, Navigation,
} from 'lucide-react';
import axios from 'axios';
import { startOfDay, endOfDay, startOfMonth, subDays, format } from 'date-fns';
import { getCourierLogo } from '../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });

// Small inline logo for table rows / drawer
function CourierBadge({ name, code }) {
  const logo = getCourierLogo(code) || getCourierLogo(name);
  if (logo) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 4, background: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <img src={logo} alt={name || code} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        </span>
        <span>{name || code}</span>
      </span>
    );
  }
  return <span>{name || code || '—'}</span>;
}

// ─── Status config ────────────────────────────────────────────
const STATUS = {
  booked:              { label: 'Booked',                      color: '#00BCD4', bg: 'rgba(0,188,212,0.12)',    icon: Package },
  collected:           { label: 'Collected',                   color: '#2196F3', bg: 'rgba(33,150,243,0.12)',   icon: Package },
  at_depot:            { label: 'At Hub',                      color: '#5C6BC0', bg: 'rgba(92,107,192,0.12)',   icon: Package },
  in_transit:          { label: 'In Transit',                  color: '#7B2FBE', bg: 'rgba(123,47,190,0.12)',   icon: Truck },
  out_for_delivery:    { label: 'Out for Delivery',            color: '#FFC107', bg: 'rgba(255,193,7,0.12)',    icon: Truck },
  failed_delivery:     { label: 'Failed Attempt',              color: '#F44336', bg: 'rgba(244,67,54,0.12)',    icon: AlertTriangle },
  delivered:           { label: 'Delivered',                   color: '#00C853', bg: 'rgba(0,200,83,0.12)',     icon: PackageCheck },
  on_hold:             { label: 'On Hold',                     color: '#FF9800', bg: 'rgba(255,152,0,0.12)',    icon: Clock },
  exception:           { label: 'Address Issue',               color: '#F44336', bg: 'rgba(244,67,54,0.12)',    icon: AlertTriangle },
  returned:            { label: 'Return to Sender',            color: '#607D8B', bg: 'rgba(96,125,139,0.12)',   icon: RotateCcw },
  tracking_expired:    { label: 'Tracking Expired',            color: '#757575', bg: 'rgba(117,117,117,0.12)',  icon: Clock },
  cancelled:           { label: 'Cancelled',                   color: '#757575', bg: 'rgba(117,117,117,0.12)',  icon: AlertTriangle },
  awaiting_collection: { label: 'Awaiting Customer Collection',color: '#FF6F00', bg: 'rgba(255,111,0,0.12)',    icon: Store },
  damaged:             { label: 'Damaged',                     color: '#E91E8C', bg: 'rgba(233,30,140,0.12)',   icon: PackageX },
  customs_hold:        { label: 'Customs Hold',                color: '#9C27B0', bg: 'rgba(156,39,176,0.12)',   icon: ShieldAlert },
  unknown:             { label: 'Unknown',                     color: '#555555', bg: 'rgba(255,255,255,0.05)',  icon: Package },
};

function StatusBadge({ status, label, size = 'sm' }) {
  const cfg = STATUS[status] || STATUS.unknown;
  const Icon = cfg.icon;
  const isLg = size === 'lg';
  // Use the label passed in (from Dispatch Cloud's own status description) if provided,
  // otherwise fall back to our internal display label.
  const displayLabel = label || cfg.label;
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
      {displayLabel}
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
function KpiCard({ label, value, color, icon: Icon, active, onClick }) {
  const hasValue = (value || 0) > 0;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 18px',
        background: active
          ? `linear-gradient(135deg, ${color}30 0%, ${color}14 100%)`
          : hasValue
            ? `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`
            : 'rgba(255,255,255,0.02)',
        border: `2px solid ${active ? color + 'AA' : hasValue ? color + '44' : color + '1A'}`,
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        boxShadow: active
          ? `0 0 24px ${color}44, inset 0 0 20px ${color}10`
          : hasValue ? `0 0 12px ${color}22` : 'none',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Background glow orb */}
      <div style={{
        position: 'absolute', right: -10, top: -10,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}${hasValue ? '22' : '0A'} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon box */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}22`,
        border: `1.5px solid ${color}${hasValue ? '55' : '22'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
        boxShadow: hasValue ? `0 0 12px ${color}33` : 'none',
      }}>
        <Icon size={20} color={color} strokeWidth={2.2} />
      </div>

      {/* Number */}
      <div style={{
        fontSize: 30, fontWeight: 900, lineHeight: 1, marginBottom: 5,
        color: hasValue ? color : '#333',
        textShadow: hasValue && active ? `0 0 16px ${color}88` : 'none',
      }}>
        {(value || 0).toLocaleString()}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: hasValue ? color + 'CC' : '#333',
        lineHeight: 1.3,
      }}>
        {label}
      </div>
    </button>
  );
}

// Keep these aliases so nothing else breaks
const StatCard     = KpiCard;
const BoldStatCard = KpiCard;

// ─── Event timeline ───────────────────────────────────────────
// Events arrive newest-first from the API (ORDER BY event_at DESC).
// The vertical line runs downward from each dot to the next older event.
function EventTimeline({ events }) {
  if (!events?.length) return <p style={{ color: '#555', fontSize: 13, fontStyle: 'italic' }}>No events yet</p>;
  return (
    <div style={{ position: 'relative' }}>
      {events.map((ev, i) => {
        const cfg = STATUS[ev.status] || STATUS.unknown;
        const isLast = i === events.length - 1;
        return (
          <div key={ev.id} style={{ display: 'flex', gap: 16, position: 'relative',
            paddingBottom: isLast ? 0 : 20 }}>
            {/* Dot + line downward to older event */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: cfg.bg,
                border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 1, flexShrink: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
              </div>
              {/* Line going down to next (older) event */}
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 16,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.03))' }} />
              )}
            </div>
            <div style={{ flex: 1, paddingTop: 2, paddingBottom: isLast ? 0 : 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <StatusBadge status={ev.status} label={ev.description} />
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
            {/* Delivery address */}
            {(data.recipient_name || data.recipient_address || data.recipient_postcode) && (
              <div style={{ marginBottom: 20, padding: 14, background: 'rgba(0,188,212,0.05)', borderRadius: 10, border: '1px solid rgba(0,188,212,0.15)' }}>
                <div style={{ fontSize: 11, color: '#00BCD4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={11} /> Delivery Address
                </div>
                {data.recipient_name && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{data.recipient_name}</div>
                )}
                {data.recipient_address && (
                  <div style={{ fontSize: 13, color: '#CCC', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{data.recipient_address}</div>
                )}
                {data.recipient_postcode && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#CCC', marginTop: data.recipient_address ? 2 : 0 }}>{data.recipient_postcode}</div>
                )}
                {data.estimated_delivery && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#AAAAAA' }}>Estimated delivery</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFC107' }}>{fmtDate(data.estimated_delivery)}</span>
                  </div>
                )}
                {data.delivered_at && (
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#AAAAAA' }}>Delivered</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00C853' }}>{new Date(data.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            )}

            {/* Event timeline — newest first */}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Event History ({data.events?.length || 0})
            </div>
            <EventTimeline events={data.events} />

            {/* Parcel details */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                ['Courier',    data.courier_name ? <CourierBadge name={data.courier_name} code={data.courier_code} /> : null],
                ['Service',    data.service_name || null],
                ['Customer',   data.customer_name || data.customer_account || null],
                ['Account',    data.customer_account || null],
                ['Weight',     data.weight_kg ? `${parseFloat(data.weight_kg).toFixed(2)} kg` : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, color: '#AAAAAA', width: 120, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Not found</div>
        )}
      </div>
    </>
  );
}

// ─── Date range helpers ───────────────────────────────────────
const isoDay = d => format(d, 'yyyy-MM-dd');
const TODAY  = new Date();

const DATE_PRESETS = [
  { label: 'Today',        get: () => ({ from: isoDay(startOfDay(TODAY)), to: isoDay(endOfDay(TODAY)) }) },
  { label: 'Last 7 days',  get: () => ({ from: isoDay(subDays(TODAY, 7)),  to: isoDay(endOfDay(TODAY)) }) },
  { label: 'Last 30 days', get: () => ({ from: isoDay(subDays(TODAY, 30)), to: isoDay(endOfDay(TODAY)) }) },
  { label: 'Month to date',get: () => ({ from: isoDay(startOfMonth(TODAY)),to: isoDay(endOfDay(TODAY)) }) },
  { label: 'Custom',       get: null },
];

// ─── Shared dark select style ─────────────────────────────────
const darkSelect = {
  background: '#0D0E2A',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  padding: '8px 12px',
  outline: 'none',
  cursor: 'pointer',
  height: 38,
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: 28,
};

// ─── Main tracking page ───────────────────────────────────────

export default function TrackingPage() {
  const [search,          setSearch]        = useState('');
  const [debouncedSearch, setDebounced]     = useState('');
  const [statusFilter,    setStatusFilter]  = useState('');
  const [courierFilter,   setCourierFilter] = useState('');
  const [customerFilter,  setCustomerFilter]= useState('');
  const [datePreset,      setDatePreset]    = useState('');   // label of active preset, '' = all time
  const [dateFrom,        setDateFrom]      = useState('');
  const [dateTo,          setDateTo]        = useState('');
  const [showCustomDate,  setShowCustomDate]= useState(false);
  const [page,            setPage]          = useState(0);
  const [selected,        setSelected]      = useState(null);
  const searchRef = useRef(null);
  const LIMIT = 50;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter, courierFilter, customerFilter, dateFrom, dateTo]);

  function applyPreset(preset) {
    if (!preset.get) {
      setDatePreset('Custom');
      setShowCustomDate(true);
      return;
    }
    const { from, to } = preset.get();
    setDatePreset(preset.label);
    setDateFrom(from);
    setDateTo(to);
    setShowCustomDate(false);
  }

  function clearDateRange() {
    setDatePreset('');
    setDateFrom('');
    setDateTo('');
    setShowCustomDate(false);
  }

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['tracking-stats'],
    queryFn:  () => api.get('/tracking/stats').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: list, isLoading, refetch: refetchList } = useQuery({
    queryKey: ['tracking-list', debouncedSearch, statusFilter, courierFilter, customerFilter, dateFrom, dateTo, page],
    queryFn:  () => api.get('/tracking', { params: {
      search:       debouncedSearch  || undefined,
      status:       statusFilter     || undefined,
      courier_code: courierFilter    || undefined,
      customer_id:  customerFilter   || undefined,
      date_from:    dateFrom         || undefined,
      date_to:      dateTo           || undefined,
      limit:  LIMIT,
      offset: page * LIMIT,
    }}).then(r => r.data),
    refetchInterval: 60000,
  });

  function refresh() { refetchStats(); refetchList(); }
  function clearAll() {
    setStatusFilter(''); setCourierFilter(''); setCustomerFilter(''); setSearch('');
    clearDateRange();
  }

  // Data-driven filter options from stats
  const customers    = stats?.by_customer || [];
  const couriers     = stats?.by_courier  || [];
  const activeStatuses = Object.entries(stats?.by_status || {})
    .filter(([, count]) => count > 0)
    .map(([status]) => status);

  const parcels = list?.parcels || [];
  const total   = list?.total   || 0;
  const pages   = Math.ceil(total / LIMIT);
  const bs = stats?.by_status || {};
  const hasFilters = statusFilter || courierFilter || customerFilter || search || dateFrom || dateTo;

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

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
        <KpiCard label="In Transit"                  value={bs.in_transit}           color="#FF9800" icon={Truck}         active={statusFilter==='in_transit'}          onClick={() => toggleStatus('in_transit')} />
        <KpiCard label="At Hub"                      value={bs.at_depot}             color="#1976D2" icon={Warehouse}     active={statusFilter==='at_depot'}            onClick={() => toggleStatus('at_depot')} />
        <KpiCard label="Out for Delivery"            value={bs.out_for_delivery}     color="#FFC107" icon={Navigation}    active={statusFilter==='out_for_delivery'}    onClick={() => toggleStatus('out_for_delivery')} />
        <KpiCard label="On Hold"                     value={bs.on_hold}              color="#F44336" icon={OctagonX}      active={statusFilter==='on_hold'}             onClick={() => toggleStatus('on_hold')} />
        <KpiCard label="Awaiting Collection"         value={bs.awaiting_collection}  color="#FF9800" icon={Store}         active={statusFilter==='awaiting_collection'} onClick={() => toggleStatus('awaiting_collection')} />
        <KpiCard label="Delivered Today"             value={stats?.delivered_today}  color="#00C853" icon={PackageCheck}  active={statusFilter==='delivered'}           onClick={() => toggleStatus('delivered')} />
        <KpiCard label="Address Issue"               value={(bs.exception||0)}       color="#F44336" icon={AlertTriangle} active={statusFilter==='exception'}           onClick={() => toggleStatus('exception')} />
        <KpiCard label="Failed Attempt"              value={(bs.failed_delivery||0)} color="#F44336" icon={AlertTriangle} active={statusFilter==='failed_delivery'}     onClick={() => toggleStatus('failed_delivery')} />
        <KpiCard label="Customs Hold"                value={bs.customs_hold}         color="#9C27B0" icon={Plane}         active={statusFilter==='customs_hold'}        onClick={() => toggleStatus('customs_hold')} />
        <KpiCard label="Return to Sender"            value={bs.returned}             color="#F44336" icon={RotateCcw}     active={statusFilter==='returned'}            onClick={() => toggleStatus('returned')} />
        <KpiCard label="Damaged"                     value={(bs.damaged||0)}         color="#9C27B0" icon={PackageX}      active={statusFilter==='damaged'}             onClick={() => toggleStatus('damaged')} />
      </div>

      {/* ── Date range ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Calendar size={14} color="#AAAAAA" />
        {DATE_PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)} style={{
            padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: '1px solid',
            borderColor: datePreset === p.label ? '#00C853' : 'rgba(255,255,255,0.1)',
            background: datePreset === p.label ? 'rgba(0,200,83,0.12)' : 'transparent',
            color: datePreset === p.label ? '#00C853' : '#888',
            cursor: 'pointer',
          }}>
            {p.label}
          </button>
        ))}
        {datePreset && (
          <button onClick={clearDateRange} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>
            <X size={12} />
          </button>
        )}
        {/* Custom date inputs */}
        {showCustomDate && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ ...darkSelect, width: 140 }} />
            <span style={{ color: '#444', fontSize: 12 }}>–</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ ...darkSelect, width: 140 }} />
          </div>
        )}
      </div>

      {/* ── Filters row ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none' }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Consignment, postcode, recipient…"
            style={{ width: '100%', boxSizing: 'border-box', background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 36px', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Customer — only shows customers who have parcels */}
        {customers.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} style={{ ...darkSelect, minWidth: 170 }}>
              <option value="">All customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none', fontSize: 10 }}>▾</span>
          </div>
        )}

        {/* Status — only shows statuses that exist in the table */}
        <div style={{ position: 'relative' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...darkSelect, minWidth: 160 }}>
            <option value="">All statuses</option>
            {activeStatuses.map(s => (
              <option key={s} value={s}>{STATUS[s]?.label || s}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none', fontSize: 10 }}>▾</span>
        </div>

        {/* Courier — only shows couriers that exist in the table */}
        {couriers.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select value={courierFilter} onChange={e => setCourierFilter(e.target.value)} style={{ ...darkSelect, minWidth: 155 }}>
              <option value="">All couriers</option>
              {couriers.map(c => (
                <option key={c.courier_code || c.courier_name} value={c.courier_code || c.courier_name}>
                  {c.courier_name} ({c.count})
                </option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none', fontSize: 10 }}>▾</span>
          </div>
        )}

        {/* Clear all */}
        {hasFilters && (
          <button onClick={clearAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(233,30,140,0.1)', border: '1px solid rgba(233,30,140,0.3)', borderRadius: 7, color: '#E91E8C', fontSize: 12, fontWeight: 700, padding: '7px 14px', cursor: 'pointer' }}>
            <X size={12} /> Clear
          </button>
        )}

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
                    <div style={{ fontSize: 13, color: '#DDD' }}>
                      <CourierBadge name={p.courier_name} code={p.courier_code} />
                    </div>
                    {p.service_name && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{p.service_name}</div>}
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
