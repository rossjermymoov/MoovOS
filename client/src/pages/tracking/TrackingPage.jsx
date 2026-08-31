/**
 * TrackingPage — Global parcel tracking view
 * Rebuilt on the Moov OS design system (moov.css)
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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

// Inline courier badge
function CourierBadge({ name, code }) {
  const logo = getCourierLogo(code) || getCourierLogo(name);
  if (logo) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 20, height: 20, borderRadius: 0, background: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden', border: '1px solid var(--mv-hairline-2)',
        }}>
          <img src={logo} alt={name || code} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        </span>
        <span style={{ fontWeight: 600 }}>{name || code}</span>
      </span>
    );
  }
  return <span style={{ fontWeight: 600 }}>{name || code || '—'}</span>;
}

// ─── Status mapping to 4-mark status language ──────────────────
// settled = green square, flight = purple triangle, attention = magenta square, waiting = hollow square
function getStatusState(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'delivered') return { mark: 'settled', label: 'Delivered' };
  if (['in_transit', 'out_for_delivery', 'collected', 'at_depot'].includes(s)) {
    const labels = {
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      collected: 'Collected',
      at_depot: 'At Hub',
    };
    return { mark: 'flight', label: labels[s] || 'In Progress' };
  }
  if (['failed_delivery', 'exception', 'damaged', 'returned', 'customs_hold', 'on_hold'].includes(s)) {
    const labels = {
      failed_delivery: 'Failed Attempt',
      exception: 'Address Issue',
      damaged: 'Damaged',
      returned: 'Returned',
      customs_hold: 'Customs Hold',
      on_hold: 'On Hold',
    };
    return { mark: 'attention', label: labels[s] || 'Needs Action' };
  }
  if (['booked', 'awaiting_collection', 'cancelled', 'tracking_expired'].includes(s)) {
    const labels = {
      booked: 'Booked',
      awaiting_collection: 'Awaiting Collection',
      cancelled: 'Cancelled',
      tracking_expired: 'Expired',
    };
    return { mark: 'waiting', label: labels[s] || 'Waiting' };
  }
  return { mark: 'waiting', label: status || 'Unknown' };
}

function StatusBadge({ status, label }) {
  const st = getStatusState(status);
  const displayLabel = label || st.label;
  return (
    <span className={`mv-state mv-state--${st.mark}`}>
      <span className={`mv-mark mv-mark--${st.mark}`} />
      <span className="mv-state-label">{displayLabel}</span>
    </span>
  );
}

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

// ─── Claims window logic ──────────────────────────────────────
const CLAIM_RULES = {
  dpd:             { windowDays: 14, windowFrom: 'network entry',   action: 'email',  actionLabel: 'Email DPD Platinum',  actionTo: 'platinum@dpd.co.uk',              note: 'Email DPD Platinum support to kick off the investigation. DPD will invite you to raise a formal claim once the investigation closes.' },
  dpd_local:       { windowDays: 14, windowFrom: 'network entry',   action: 'email',  actionLabel: 'Email DPD Platinum',  actionTo: 'platinum@dpd.co.uk',              note: 'Email DPD Platinum support to kick off the investigation. DPD will invite you to raise a formal claim once the investigation closes.' },
  dpdlocal:        { windowDays: 14, windowFrom: 'network entry',   action: 'email',  actionLabel: 'Email DPD Platinum',  actionTo: 'platinum@dpd.co.uk',              note: 'Email DPD Platinum support to kick off the investigation. DPD will invite you to raise a formal claim once the investigation closes.' },
  dhlparcelukcloud:{ windowDays: 14, windowFrom: 'expected delivery',action: 'email', actionLabel: 'Email DHL Support',   actionTo: 'parcel.uk@dhl.com',               note: 'Email DHL support to open an investigation. DHL should invite you to raise a formal claim within 21 days of the delivery date.' },
  dhl:             { windowDays: 14, windowFrom: 'expected delivery',action: 'email', actionLabel: 'Email DHL Support',   actionTo: 'parcel.uk@dhl.com',               note: 'Email DHL support to open an investigation. DHL should invite you to raise a formal claim within 21 days of the delivery date.' },
  yodel:           { windowDays: 7,  windowFrom: 'label generation', action: 'portal', actionLabel: 'Raise on AGL Portal', actionUrl: 'https://agl.yodel.co.uk',        note: 'Yodel claims must be raised via the AGL portal within 7 days of label generation (portal may accept up to 10 days). Act immediately.' },
  agl:             { windowDays: 7,  windowFrom: 'label generation', action: 'portal', actionLabel: 'Raise on AGL Portal', actionUrl: 'https://agl.yodel.co.uk',        note: 'Yodel claims must be raised via the AGL portal within 7 days of label generation (portal may accept up to 10 days). Act immediately.' },
  ups:             { windowDays: 14, windowFrom: 'network entry',   action: 'email',  actionLabel: 'Email UPS Claims',    actionTo: 'ukparcelclaims@ups.com',           note: 'Submit a UPS claim by email within 14 days of the parcel entering the network. Include shipment details and supporting evidence.' },
};

function getClaimInfo(parcel, consignmentNumber) {
  if (!parcel) return null;
  const code = (parcel.courier_code || '').toLowerCase();
  const isYodel = (consignmentNumber || '').toUpperCase().startsWith('JJD') || code === 'yodel' || code === 'agl';
  const rule = isYodel ? CLAIM_RULES.yodel : CLAIM_RULES[code];
  if (!rule) return null;

  const refDate = (code.startsWith('dhl') && (parcel.delivered_at || parcel.estimated_delivery))
    ? (parcel.delivered_at || parcel.estimated_delivery)
    : parcel.created_at;
  if (!refDate) return null;

  const deadline     = new Date(new Date(refDate).getTime() + rule.windowDays * 86400000);
  const msRemaining  = deadline.getTime() - Date.now();
  const daysRemaining = Math.ceil(msRemaining / 86400000);
  const expired       = daysRemaining < 0;
  const urgent        = !expired && daysRemaining <= 2;
  const warning       = !expired && !urgent && daysRemaining <= 5;

  return { ...rule, deadline, daysRemaining, expired, urgent, warning, refDate };
}

function ClaimsTab({ data, consignment }) {
  const info = getClaimInfo(data, consignment);

  if (!info) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--mv-ink-52)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)', marginBottom: 6 }}>No claims window data</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          Claims window rules are not configured for this carrier.<br />Check directly with {data?.courier_name || 'the carrier'}.
        </div>
      </div>
    );
  }

  const statusLabel = info.expired
    ? `Window closed ${Math.abs(info.daysRemaining)} day${Math.abs(info.daysRemaining) !== 1 ? 's' : ''} ago`
    : info.urgent
    ? `URGENT — ${info.daysRemaining} day${info.daysRemaining !== 1 ? 's' : ''} remaining`
    : info.warning
    ? `${info.daysRemaining} days remaining — act soon`
    : `${info.daysRemaining} days remaining`;

  const consignmentRef = consignment || '';
  const courierName    = data?.courier_name || '';
  const customerName   = data?.customer_name || data?.customer_account || '';
  let actionUrl;
  if (info.action === 'portal') {
    actionUrl = info.actionUrl;
  } else {
    const subject = encodeURIComponent(`Claims enquiry — ${courierName} — ${consignmentRef}`);
    const body = encodeURIComponent(
      `Dear ${courierName} Claims Team,\n\n` +
      `I am writing regarding consignment ${consignmentRef}.\n` +
      `Customer: ${customerName}\n` +
      `Carrier: ${courierName}\n\n` +
      `[Please describe the issue and attach supporting evidence here]\n\n` +
      `Kind regards,\nMoov Parcel`
    );
    actionUrl = `mailto:${info.actionTo}?subject=${subject}&body=${body}`;
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{
        background: info.expired || info.urgent ? 'rgba(233,30,140,0.06)' : 'var(--mv-surface)',
        border: `1px solid ${info.expired || info.urgent ? 'var(--mv-magenta)' : 'var(--mv-divider)'}`,
        padding: '14px 16px',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: info.expired || info.urgent ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)', marginBottom: 2 }}>
          {statusLabel}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--mv-ink-52)' }}>
          Deadline: {info.deadline.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="mv-section" style={{ marginBottom: 8 }}>Claims Window Rules</div>
        {[
          ['Carrier',       data?.courier_name || '—'],
          ['Window',        `${info.windowDays} days from ${info.windowFrom}`],
          ['Reference date',new Date(info.refDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
          ['Deadline',      info.deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 120, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 12.5, color: 'var(--mv-ink)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--mv-surface)',
        border: '1px solid var(--mv-hairline-2)',
        padding: '12px 14px',
        marginBottom: 20,
        fontSize: 12.5,
        color: 'var(--mv-ink)',
        lineHeight: 1.55,
      }}>
        {info.note}
      </div>

      {!info.expired && (
        <a
          href={actionUrl}
          target={info.action === 'portal' ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="mv-btn-primary"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px 16px', fontSize: 13, textDecoration: 'none',
          }}
        >
          {info.actionLabel} →
        </a>
      )}
    </div>
  );
}

// ─── Event timeline ───────────────────────────────────────────
function EventTimeline({ events }) {
  if (!events?.length) return <p style={{ color: 'var(--mv-ink-52)', fontSize: 13, fontStyle: 'italic' }}>No events yet</p>;
  return (
    <div style={{ position: 'relative' }}>
      {events.map((ev, i) => {
        const st = getStatusState(ev.status);
        const isLast = i === events.length - 1;
        return (
          <div key={ev.id || i} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: isLast ? 0 : 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span className={`mv-mark mv-mark--${st.mark}`} style={{ marginTop: 4 }} />
              {!isLast && (
                <div style={{ width: 1, flex: 1, minHeight: 20, background: 'var(--mv-divider)', marginTop: 6 }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <StatusBadge status={ev.status} />
                <span className="mv-num" style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{timeAgo(ev.event_at)}</span>
              </div>
              {ev.description && <p style={{ fontSize: 13, color: 'var(--mv-ink)', margin: '3px 0', fontWeight: 500 }}>{ev.description}</p>}
              {ev.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--mv-ink-52)' }}>
                  <MapPin size={11} /> {ev.location}
                </span>
              )}
              <div className="mv-num" style={{ fontSize: 10.5, color: 'var(--mv-ink-45)', marginTop: 2 }}>
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
  const [activeTab, setActiveTab] = useState('events');
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(32,30,29,0.3)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 500, background: 'var(--mv-bg)',
        borderLeft: '2px solid var(--mv-divider)',
        boxShadow: '0 12px 32px rgba(32,30,29,0.18)',
        zIndex: 500, display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--mv-font)',
      }}>
        {/* Drawer Header */}
        <div style={{ padding: '18px 24px', background: 'var(--mv-surface)', borderBottom: '2px solid var(--mv-divider)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="mv-kicker">Consignment Telemetry</div>
              <div className="mv-num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--mv-ink)', letterSpacing: '-.02em' }}>
                {consignment}
              </div>
            </div>
            <button onClick={onClose} className="mv-icon-btn" title="Close"><X size={16} /></button>
          </div>

          {data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <StatusBadge status={data.status} />
              <CourierBadge name={data.courier_name} code={data.courier_code} />
              {data.customer_name && (
                <span style={{ fontSize: 12, color: 'var(--mv-ink-62)', fontWeight: 600 }}>
                  {data.customer_name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mv-tabs" style={{ margin: '0 24px', borderBottom: '1px solid var(--mv-divider)' }}>
          <button className={`mv-tab ${activeTab === 'events' ? 'is-active' : ''}`} onClick={() => setActiveTab('events')}>
            Timeline Events {data?.events?.length ? `(${data.events.length})` : ''}
          </button>
          <button className={`mv-tab ${activeTab === 'details' ? 'is-active' : ''}`} onClick={() => setActiveTab('details')}>
            Parcel Details
          </button>
          <button className={`mv-tab ${activeTab === 'claims' ? 'is-active' : ''}`} onClick={() => setActiveTab('claims')}>
            Claims Window
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-52)' }}>Loading telemetry events…</div>
          ) : activeTab === 'events' ? (
            <EventTimeline events={data?.events} />
          ) : activeTab === 'details' ? (
            <div>
              {[
                ['Customer Account', data?.customer_account || '—'],
                ['Customer Name',    data?.customer_name || '—'],
                ['Recipient',        data?.recipient_name || '—'],
                ['Address',          data?.recipient_address || '—'],
                ['Postcode',         data?.recipient_postcode || '—'],
                ['Country',          data?.country_code || 'GB'],
                ['Service',          data?.service_name || '—'],
                ['Weight',           data?.weight ? `${data.weight} kg` : '—'],
                ['Despatch Date',    data?.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : '—'],
                ['Estimated Delivery', data?.estimated_delivery ? new Date(data.estimated_delivery).toLocaleDateString('en-GB') : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 130, flexShrink: 0 }}>{label}</span>
                  <span className="mv-num" style={{ fontSize: 13, color: 'var(--mv-ink)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <ClaimsTab data={data} consignment={consignment} />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Tracking Page ───────────────────────────────────────
const DATE_PRESETS = [
  { label: 'Today',      getFrom: () => startOfDay(new Date()),                     getTo: () => endOfDay(new Date()) },
  { label: 'Yesterday',  getFrom: () => startOfDay(subDays(new Date(), 1)),         getTo: () => endOfDay(subDays(new Date(), 1)) },
  { label: '7 Days',     getFrom: () => startOfDay(subDays(new Date(), 7)),         getTo: () => endOfDay(new Date()) },
  { label: '30 Days',    getFrom: () => startOfDay(subDays(new Date(), 30)),        getTo: () => endOfDay(new Date()) },
  { label: 'This Month', getFrom: () => startOfMonth(new Date()),                   getTo: () => endOfDay(new Date()) },
];

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch]                 = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [courierFilter, setCourierFilter]   = useState('');
  const [page, setPage]                     = useState(0);
  const [selected, setSelected]             = useState(null);
  const [datePreset, setDatePreset]         = useState('');
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');
  const [staleRunning, setStaleRunning]     = useState(false);
  const [staleResult, setStaleResult]       = useState(null);

  const searchRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Query stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['tracking-stats'],
    queryFn:  () => api.get('/tracking/stats').then(r => r.data),
    refetchInterval: 30000,
  });

  // Query parcel list
  const { data: listData, isLoading, refetch: refetchList } = useQuery({
    queryKey: ['tracking-parcels', debouncedSearch, customerFilter, statusFilter, courierFilter, dateFrom, dateTo, page],
    queryFn: () => {
      const p = new URLSearchParams({
        page,
        limit: 50,
        ...(debouncedSearch && { q: debouncedSearch }),
        ...(customerFilter  && { customer_id: customerFilter }),
        ...(statusFilter    && { status: statusFilter }),
        ...(courierFilter   && { courier: courierFilter }),
        ...(dateFrom        && { from: dateFrom }),
        ...(dateTo          && { to: dateTo }),
      });
      return api.get(`/tracking?${p}`).then(r => r.data);
    },
    refetchInterval: 30000,
  });

  function refresh() {
    refetchStats();
    refetchList();
  }

  async function refreshStale() {
    setStaleRunning(true);
    setStaleResult(null);
    try {
      const res = await api.post('/tracking/refresh-stale');
      setStaleResult({ ok: true, msg: `Updated ${res.data?.updated || 0} stale parcels` });
      refresh();
    } catch (e) {
      setStaleResult({ ok: false, msg: 'Failed to refresh stale parcels' });
    } finally {
      setStaleRunning(false);
    }
  }

  function applyPreset(p) {
    if (datePreset === p.label) {
      setDatePreset('');
      setDateFrom('');
      setDateTo('');
    } else {
      setDatePreset(p.label);
      setDateFrom(format(p.getFrom(), 'yyyy-MM-dd'));
      setDateTo(format(p.getTo(), 'yyyy-MM-dd'));
    }
    setPage(0);
  }

  function toggleStatus(st) {
    setStatusFilter(prev => prev === st ? '' : st);
    setPage(0);
  }

  const parcels  = listData?.parcels || [];
  const total    = listData?.total || 0;
  const pages    = Math.ceil(total / 50);
  const bs       = stats?.by_status || {};
  const customers= listData?.filter_options?.customers || [];
  const couriers = listData?.filter_options?.couriers || [];

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="mv-head">
          <div>
            <div className="mv-kicker">Network & Telemetry</div>
            <h1 className="mv-title">Tracking</h1>
            <p className="mv-blurb">
              Global live parcel telemetry, courier webhook ingest, automated SLA exception monitoring, and claims window tracking.
            </p>
          </div>
          <div className="mv-actions">
            <button onClick={refresh} className="mv-btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={refreshStale}
              disabled={staleRunning}
              className="mv-btn-ghost"
              style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCcw size={13} style={{ animation: staleRunning ? 'spin 1s linear infinite' : 'none' }} />
              {staleRunning ? 'Refreshing…' : 'Refresh Stale'}
            </button>
          </div>
        </div>

        <div className="mv-rule" />

        {/* ── KPI Figure Strip ───────────────────────────────────── */}
        <div className="mv-kpis">
          <div
            className={`mv-kpi is-clickable ${statusFilter === 'in_transit' ? 'is-active' : ''}`}
            onClick={() => toggleStatus('in_transit')}
          >
            <div className="mv-kpi-label">In Transit</div>
            <div className="mv-kpi-value mv-num">{(bs.in_transit || 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Active in network</div>
            <div className="mv-kpi-go">Filter status →</div>
          </div>

          <div
            className={`mv-kpi is-clickable ${statusFilter === 'out_for_delivery' ? 'is-active' : ''}`}
            onClick={() => toggleStatus('out_for_delivery')}
          >
            <div className="mv-kpi-label">Out For Delivery</div>
            <div className="mv-kpi-value mv-num">{(bs.out_for_delivery || 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">On courier vans</div>
            <div className="mv-kpi-go">Filter status →</div>
          </div>

          <div
            className={`mv-kpi is-clickable ${statusFilter === 'exception' ? 'is-active' : ''}`}
            onClick={() => toggleStatus('exception')}
          >
            <div className="mv-kpi-label">Exceptions & Issues</div>
            <div className="mv-kpi-value mv-num is-attention">{((bs.exception || 0) + (bs.failed_delivery || 0) + (bs.damaged || 0)).toLocaleString()}</div>
            <div className="mv-kpi-sub">Needs human review</div>
            <div className="mv-kpi-go">Show exceptions →</div>
          </div>

          <div
            className={`mv-kpi is-clickable ${statusFilter === 'delivered' ? 'is-active' : ''}`}
            onClick={() => toggleStatus('delivered')}
          >
            <div className="mv-kpi-label">Delivered Today</div>
            <div className="mv-kpi-value mv-num" style={{ color: 'var(--mv-green-deep)' }}>{(stats?.delivered_today || 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Successfully settled</div>
            <div className="mv-kpi-go">View delivered →</div>
          </div>

          <div className="mv-kpi">
            <div className="mv-kpi-label">Total Monitored</div>
            <div className="mv-kpi-value mv-num">{(stats?.total_active || 0).toLocaleString()}</div>
            <div className="mv-kpi-sub">Live telemetry tracking</div>
          </div>
        </div>

        {/* ── Filters & Search ───────────────────────────────────── */}
        <div className="mv-chips" style={{ marginTop: 22 }}>
          <span className="mv-filter-label">Timeframe</span>
          {DATE_PRESETS.map(p => (
            <button
              key={p.label}
              className={`mv-chip ${datePreset === p.label ? 'is-on' : ''}`}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}

          {statusFilter && (
            <button className="mv-chip is-on" onClick={() => setStatusFilter('')}>
              Status: {statusFilter} <X size={11} style={{ marginLeft: 4 }} />
            </button>
          )}

          <span style={{ flex: 1 }} />

          <div className="mv-search" style={{ width: 280, height: 34 }}>
            <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Consignment, postcode, recipient…"
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

          <span className="mv-num" style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', whiteSpace: 'nowrap' }}>
            {total.toLocaleString()} parcel{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Parcel Table ───────────────────────────────────────── */}
        <div style={{ marginTop: 18, overflowX: 'auto' }}>
          <table className="mv-table">
            <thead>
              <tr>
                <th style={{ width: 170 }}>Consignment</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Last Telemetry Event</th>
                <th style={{ width: 110, textAlign: 'right' }}>Est. Delivery</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-52)' }}>Loading parcels…</td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-52)' }}>
                    No parcels found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                parcels.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p.consignment_number)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="mv-num" style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--mv-ink)' }}>
                        {p.consignment_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.customer_name || '—'}</div>
                      {p.customer_account && <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{p.customer_account}</div>}
                    </td>
                    <td>
                      <CourierBadge name={p.courier_name} code={p.courier_code} />
                      {p.service_name && <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 2 }}>{p.service_name}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.recipient_name || '—'}</div>
                      {p.recipient_postcode && (
                        <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>
                          {p.recipient_postcode}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{p.status_description?.slice(0, 45) || p.last_location || '—'}</div>
                      <div className="mv-num" style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{timeAgo(p.last_event_at)}</div>
                    </td>
                    <td className="mv-num" style={{ textAlign: 'right', fontSize: 12 }}>
                      {p.status === 'delivered'
                        ? <span style={{ color: 'var(--mv-green-deep)', fontWeight: 700 }}>Settled</span>
                        : fmtDate(p.estimated_delivery)}
                    </td>
                    <td><ChevronRight size={14} style={{ color: 'var(--mv-ink-45)' }} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────── */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 24 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="mv-btn-ghost"
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              ← Prev
            </button>
            <span className="mv-num" style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>
              Page {page + 1} of {pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="mv-btn-ghost"
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── Detail Drawer ──────────────────────────────────────── */}
        {selected && <ParcelDrawer consignment={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
