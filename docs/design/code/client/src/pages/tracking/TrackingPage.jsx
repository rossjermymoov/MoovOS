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
  Warehouse, OctagonX, Navigation, Copy, Check, ExternalLink,
  Globe, Scale, Building2
} from 'lucide-react';
import axios from 'axios';
import { startOfDay, endOfDay, startOfMonth, subDays, format } from 'date-fns';
import { getCourierLogo } from '../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });

// Country ISO to Full Name lookup
const COUNTRY_MAP = {
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  US: 'United States',
  USA: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  IE: 'Ireland',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  NZ: 'New Zealand',
  CH: 'Switzerland',
  AT: 'Austria',
  DK: 'Denmark',
  SE: 'Sweden',
  NO: 'Norway',
  FI: 'Finland',
  PL: 'Poland',
  PT: 'Portugal',
  INTL: 'International',
};

function formatCountryName(code) {
  if (!code) return '—';
  const c = code.toUpperCase();
  const name = COUNTRY_MAP[c];
  return name ? `${c} — ${name}` : c;
}

function getCountryFlag(isoCode) {
  if (!isoCode) return '🇬🇧';
  const code = isoCode.trim().toUpperCase();
  if (code === 'UK' || code === 'GB') return '🇬🇧';
  if (code === 'US' || code === 'USA') return '🇺🇸';
  if (code === 'CA') return '🇨🇦';
  if (code === 'AU') return '🇦🇺';
  if (code === 'DE') return '🇩🇪';
  if (code === 'FR') return '🇫🇷';
  if (code === 'IE') return '🇮🇪';
  if (code === 'ES') return '🇪🇸';
  if (code === 'IT') return '🇮🇹';
  if (code === 'NL') return '🇳🇱';
  if (code === 'BE') return '🇧🇪';
  if (code === 'NZ') return '🇳🇿';
  if (code === 'CH') return '🇨🇭';
  if (code === 'AT') return '🇦🇹';
  if (code === 'DK') return '🇩🇰';
  if (code === 'SE') return '🇸🇪';
  if (code === 'NO') return '🇳🇴';
  if (code === 'FI') return '🇫🇮';
  if (code === 'PL') return '🇵🇱';
  if (code === 'PT') return '🇵🇹';
  if (code === 'INTL') return '🌐';

  if (code.length === 2) {
    const codePoints = code
      .split('')
      .map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  return '🌐';
}

// Inline courier badge
function CourierBadge({ name, code }) {
  const logo = getCourierLogo(code) || getCourierLogo(name);
  if (logo) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 20, height: 20, borderRadius: 'var(--v2-r-sm)', background: 'var(--v2-logo-plate)',
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

// ─── Event icon resolver ──────────────────────────────────────
function getEventVisual(status, isInternational, description = '', location = '') {
  const s = String(status || '').toLowerCase();
  const desc = String(description || '').toLowerCase();
  const loc = String(location || '').toLowerCase();

  // Delivered
  if (s === 'delivered' || desc.includes('delivered')) {
    return {
      Icon: PackageCheck,
      mark: 'settled',
      color: 'var(--mv-green-deep)',
      bg: 'rgba(0,200,83,0.12)',
      border: 'var(--mv-green)',
    };
  }

  // Failed delivery / Problem / Exception
  if (['failed_delivery', 'exception', 'damaged', 'returned', 'on_hold', 'customs_hold'].includes(s) ||
      desc.includes('failed') || desc.includes('missed') || desc.includes('undelivered') || desc.includes('held') || desc.includes('delay')) {
    if (s === 'customs_hold' || desc.includes('customs')) {
      return {
        Icon: ShieldAlert,
        mark: 'attention',
        color: 'var(--mv-magenta-deep)',
        bg: 'rgba(233,30,140,0.1)',
        border: 'var(--mv-magenta)',
        isAlert: true,
      };
    }
    return {
      Icon: AlertTriangle,
      mark: 'attention',
      color: 'var(--mv-magenta-deep)',
      bg: 'rgba(233,30,140,0.1)',
      border: 'var(--mv-magenta)',
      isAlert: true,
    };
  }

  // At hub / sorting center / depot
  if (s === 'at_depot' || desc.includes('hub') || desc.includes('depot') || desc.includes('sorting center') || desc.includes('facility') || loc.includes('hub') || loc.includes('depot')) {
    return {
      Icon: Warehouse,
      mark: 'flight',
      color: 'var(--mv-purple)',
      bg: 'rgba(123,47,190,0.1)',
      border: 'rgba(123,47,190,0.3)',
    };
  }

  // Out for delivery
  if (s === 'out_for_delivery' || desc.includes('out for delivery') || desc.includes('with courier') || desc.includes('van')) {
    return {
      Icon: Navigation,
      mark: 'flight',
      color: 'var(--mv-purple)',
      bg: 'rgba(123,47,190,0.1)',
      border: 'rgba(123,47,190,0.3)',
    };
  }

  // In transit
  if (s === 'in_transit' || desc.includes('transit') || desc.includes('departed') || desc.includes('arrived') || desc.includes('linehaul')) {
    if (isInternational || desc.includes('plane') || desc.includes('flight') || desc.includes('air') || desc.includes('customs') || desc.includes('overseas') || desc.includes('export')) {
      return {
        Icon: Plane,
        mark: 'flight',
        color: 'var(--mv-purple)',
        bg: 'rgba(123,47,190,0.1)',
        border: 'rgba(123,47,190,0.3)',
      };
    }
    return {
      Icon: Truck,
      mark: 'flight',
      color: 'var(--mv-purple)',
      bg: 'rgba(123,47,190,0.1)',
      border: 'rgba(123,47,190,0.3)',
    };
  }

  // Booked / Collected
  if (s === 'collected' || s === 'booked' || desc.includes('collected') || desc.includes('manifested') || desc.includes('created')) {
    return {
      Icon: Package,
      mark: 'waiting',
      color: 'var(--mv-ink)',
      bg: 'rgba(32,30,29,0.06)',
      border: 'var(--mv-hairline-2)',
    };
  }

  return {
    Icon: Package,
    mark: 'waiting',
    color: 'var(--mv-ink-62)',
    bg: 'rgba(32,30,29,0.06)',
    border: 'var(--mv-hairline-2)',
  };
}

// ─── Journey Route Stages ─────────────────────────────────────
function JourneyProgress({ status, isInternational }) {
  const s = String(status || '').toLowerCase();

  const stages = [
    { key: 'booked', label: 'Booked', Icon: Package },
    { key: 'at_depot', label: 'At Hub', Icon: Warehouse },
    { key: 'in_transit', label: isInternational ? 'Air Transit' : 'In Transit', Icon: isInternational ? Plane : Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', Icon: Navigation },
    { key: 'delivered', label: 'Delivered', Icon: PackageCheck },
  ];

  let currentIdx = 0;
  if (s === 'booked' || s === 'awaiting_collection') currentIdx = 0;
  else if (s === 'collected' || s === 'at_depot') currentIdx = 1;
  else if (s === 'in_transit' || s === 'customs_hold' || s === 'on_hold') currentIdx = 2;
  else if (s === 'out_for_delivery' || s === 'failed_delivery') currentIdx = 3;
  else if (s === 'delivered') currentIdx = 4;

  const isFailed = ['failed_delivery', 'exception', 'damaged', 'returned'].includes(s);

  return (
    <div style={{
      background: 'var(--mv-surface)',
      border: '1px solid var(--mv-hairline-2)',
      padding: '12px 16px',
      margin: '14px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {stages.map((stage, i) => {
          const isDone = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const StageIcon = stage.Icon;

          let color = 'var(--mv-ink-45)';
          let bg = 'var(--mv-bg)';
          let border = 'var(--mv-hairline-2)';

          if (isCurrent) {
            if (s === 'delivered') {
              color = 'var(--mv-green-deep)';
              bg = 'rgba(0,200,83,0.15)';
              border = 'var(--mv-green)';
            } else if (isFailed) {
              color = 'var(--mv-magenta-deep)';
              bg = 'rgba(233,30,140,0.15)';
              border = 'var(--mv-magenta)';
            } else {
              color = 'var(--mv-purple)';
              bg = 'rgba(123,47,190,0.15)';
              border = 'var(--mv-purple)';
            }
          } else if (isDone) {
            color = 'var(--mv-purple)';
            bg = 'rgba(123,47,190,0.08)';
            border = 'rgba(123,47,190,0.25)';
          }

          return (
            <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
              <div style={{
                width: 28, height: 28,
                background: bg, border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color, marginBottom: 4,
              }}>
                <StageIcon size={14} />
              </div>
              <span style={{
                fontSize: 10, fontWeight: isCurrent ? 800 : 600,
                color: isCurrent ? 'var(--mv-ink)' : 'var(--mv-ink-52)',
                textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center',
              }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
    <div style={{ padding: '4px 0' }}>
      <div style={{
        background: info.expired || info.urgent ? 'rgba(233,30,140,0.06)' : 'var(--mv-surface)',
        border: `1px solid ${info.expired || info.urgent ? 'var(--mv-magenta)' : 'var(--mv-divider)'}`,
        padding: '14px 16px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: info.expired || info.urgent ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)', marginBottom: 2 }}>
          {statusLabel}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--mv-ink-52)' }}>
          Deadline: {info.deadline.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: '14px 16px', marginBottom: 16 }}>
        <div className="mv-kicker" style={{ marginBottom: 8 }}>Claims Window Policy</div>
        {[
          ['Carrier',       data?.courier_name || '—'],
          ['Window',        `${info.windowDays} days from ${info.windowFrom}`],
          ['Reference Date',new Date(info.refDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
          ['Hard Deadline', info.deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 120, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 12.5, color: 'var(--mv-ink)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--mv-bg)',
        border: '1px solid var(--mv-hairline-2)',
        padding: '12px 14px',
        marginBottom: 16,
        fontSize: 12,
        color: 'var(--mv-ink-62)',
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
            width: '100%', padding: '10px 16px', fontSize: 13, textDecoration: 'none', boxSizing: 'border-box',
          }}
        >
          {info.actionLabel} →
        </a>
      )}
    </div>
  );
}

// ─── Event timeline ───────────────────────────────────────────
function EventTimeline({ events, isInternational }) {
  if (!events?.length) return <p style={{ color: 'var(--mv-ink-52)', fontSize: 13, fontStyle: 'italic', padding: 20 }}>No tracking events recorded yet</p>;

  return (
    <div style={{ position: 'relative', paddingLeft: 4 }}>
      {events.map((ev, i) => {
        const vis = getEventVisual(ev.status, isInternational, ev.description, ev.location);
        const EvIcon = vis.Icon;
        const isLast = i === events.length - 1;

        return (
          <div key={ev.id || i} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: isLast ? 0 : 22 }}>
            {/* Timeline track + Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28,
                background: vis.bg,
                border: `1px solid ${vis.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: vis.color, flexShrink: 0,
              }}>
                <EvIcon size={14} />
              </div>
              {!isLast && (
                <div style={{ width: 1, flex: 1, minHeight: 24, background: 'var(--mv-divider)', marginTop: 4 }} />
              )}
            </div>

            {/* Event info */}
            <div style={{
              flex: 1, minWidth: 0,
              background: vis.isAlert ? 'rgba(233,30,140,0.04)' : 'transparent',
              border: vis.isAlert ? '1px solid rgba(233,30,140,0.2)' : 'none',
              padding: vis.isAlert ? '10px 12px' : '0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <StatusBadge status={ev.status} />
                <span className="mv-num" style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{timeAgo(ev.event_at)}</span>
              </div>

              {ev.description && (
                <p style={{
                  fontSize: 13,
                  color: vis.isAlert ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)',
                  margin: '4px 0 6px',
                  fontWeight: vis.isAlert ? 700 : 600,
                  lineHeight: 1.4,
                }}>
                  {ev.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                {ev.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--mv-ink-52)' }}>
                    <MapPin size={11} style={{ color: 'var(--mv-purple)' }} /> {ev.location}
                  </span>
                )}
                <span className="mv-num" style={{ fontSize: 11, color: 'var(--mv-ink-45)' }}>
                  {new Date(ev.event_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Courier tracking-URL fallback ─────────────────────────────
// When a parcel has no stored tracking_url (older webhooks, some couriers
// never send one), build a best-effort deep link to the courier's own
// tracking page from the consignment number so the drawer link still works.
function getFallbackTrackingUrl(consignment, courierCode, postcode) {
  const code = (courierCode || '').toLowerCase();
  const post = encodeURIComponent((postcode || '').trim());
  const isYodel = consignment?.toUpperCase().startsWith('JJD') || code === 'yodel' || code === 'agl';
  if (isYodel) return `https://www.yodel.co.uk/tracking/${consignment}/${post}`;
  if (code === 'dpd' || code === 'dpd_local' || code === 'dpdlocal') return `https://www.dpd.co.uk/apps/tracking/?reference=${consignment}`;
  if (code.startsWith('dhl')) return `https://track.dhlparcel.co.uk/?con=${consignment}`;
  if (code === 'evri' || code === 'hermes') return `https://www.evri.com/track-a-parcel/${consignment}`;
  if (code === 'royal_mail' || code === 'royalmail') return `https://www.royalmail.com/track-your-item#/tracking-results/${consignment}`;
  if (code === 'parcelforce') return `https://www.parcelforce.com/track-trace?trackNumber=${consignment}`;
  if (code === 'ups') return `https://www.ups.com/track?loc=en_GB&tracknum=${consignment}`;
  if (code === 'fedex') return `https://www.fedex.com/en-gb/tracking.html?tracknumbers=${consignment}`;
  return null;
}

// ─── Parcel drawer ────────────────────────────────────────────
function ParcelDrawer({ consignment, onClose }) {
  const [activeTab, setActiveTab] = useState('events');
  const [copied, setCopied] = useState(false);

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

  const copyConsignment = () => {
    if (!consignment) return;
    navigator.clipboard.writeText(consignment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIntl = data?.is_international || (data?.country_code && data.country_code !== 'GB' && data.country_code !== 'UK');
  const trackingUrl = data?.tracking_url || getFallbackTrackingUrl(consignment, data?.courier_code, data?.recipient_postcode);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(32,30,29,0.3)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 540, background: 'var(--mv-bg)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mv-num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--mv-ink)', letterSpacing: '-.02em' }}>
                  {consignment}
                </span>
                <button
                  onClick={copyConsignment}
                  className="mv-btn-ghost"
                  style={{ padding: '3px 7px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  title="Copy consignment number"
                >
                  {copied ? <Check size={12} color="var(--mv-green-deep)" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <button onClick={onClose} className="mv-icon-btn" title="Close"><X size={16} /></button>
          </div>

          {data && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <StatusBadge status={data.status} />
                <CourierBadge name={data.courier_name} code={data.courier_code} />
                {isIntl ? (
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, padding: '2px 7px',
                    background: 'rgba(123,47,190,0.08)', border: '1px solid var(--mv-purple)',
                    color: 'var(--mv-purple)', display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Plane size={11} /> International Air
                  </span>
                ) : (
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, padding: '2px 7px',
                    background: 'rgba(32,30,29,0.05)', border: '1px solid var(--mv-hairline-2)',
                    color: 'var(--mv-ink-62)', display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Truck size={11} /> Domestic UK
                  </span>
                )}
                {data.customer_name && (
                  <span style={{ fontSize: 12, color: 'var(--mv-ink-62)', fontWeight: 600 }}>
                    {data.customer_name}
                  </span>
                )}
              </div>

              {/* Journey progress route */}
              <JourneyProgress status={data.status} isInternational={isIntl} />
            </>
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
          <button className={`mv-tab ${activeTab === 'raw' ? 'is-active' : ''}`} onClick={() => setActiveTab('raw')}>
            Raw Webhook JSON
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-52)' }}>Loading telemetry events…</div>
          ) : activeTab === 'events' ? (
            <EventTimeline events={data?.events} isInternational={isIntl} />
          ) : activeTab === 'details' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Destination Card */}
              <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: '16px 18px' }}>
                <div className="mv-kicker" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} color="var(--mv-purple)" /> Recipient &amp; Delivery Destination
                </div>
                
                <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 130, flexShrink: 0 }}>Recipient</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--mv-ink)', fontWeight: 700 }}>{data?.recipient_name || '—'}</span>
                    {data?.ship_to?.phone && (
                      <span style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 2 }}>📞 {data.ship_to.phone}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 130, flexShrink: 0 }}>Delivery Address</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {data?.street_line_1 && (
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--mv-ink)', lineHeight: 1.35 }}>
                        {data.street_line_1}
                      </span>
                    )}
                    {data?.street_line_2 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mv-ink-70)', lineHeight: 1.35 }}>
                        {data.street_line_2}
                      </span>
                    )}
                    {!data?.street_line_1 && !data?.street_line_2 && (
                      <span style={{ fontSize: 12.5, color: 'var(--mv-ink)', fontWeight: 600 }}>
                        {data?.recipient_address || data?.recipient_postcode || '—'}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 130, flexShrink: 0 }}>Destination Country</span>
                  <span style={{ fontSize: 12.5, color: 'var(--mv-ink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15 }}>{getCountryFlag(data?.country_code)}</span>
                    {formatCountryName(data?.country_code)}
                  </span>
                </div>
              </div>

              {/* Weight & Physical Specs Card */}
              <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: '16px 18px' }}>
                <div className="mv-kicker" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Scale size={12} color="var(--mv-purple)" /> Weight &amp; Volumetric Specifications
                </div>
                {[
                  ['Declared Weight',     data?.weight_kg != null ? `${Number(data.weight_kg).toFixed(2)} kg` : '—'],
                  ['Dimensional Weight',  data?.dimensional_weight_kg != null ? `${Number(data.dimensional_weight_kg).toFixed(2)} kg` : '—'],
                  ['Dimensions (L×W×H)',  data?.dimensions ? `${data.dimensions.length} × ${data.dimensions.width} × ${data.dimensions.height} cm` : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 130, flexShrink: 0 }}>{label}</span>
                    <span className="mv-num" style={{ fontSize: 12.5, color: 'var(--mv-ink)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Carrier & Service Card */}
              <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: '16px 18px' }}>
                <div className="mv-kicker" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Truck size={12} color="var(--mv-purple)" /> Carrier &amp; Service Telemetry
                </div>
                {[
                  ['Carrier',           data?.courier_name || data?.courier_code || '—'],
                  ['Service Name',      data?.service_name || '—'],
                  ['Consignment Ref',   data?.consignment_number || '—'],
                  ['Despatch Date',     data?.created_at ? new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
                  ['Estimated Delivery',data?.estimated_delivery ? new Date(data.estimated_delivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--mv-hairline)' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', width: 130, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--mv-ink)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
                {trackingUrl && (
                  <div style={{ marginTop: 12 }}>
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mv-btn-ghost"
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> Open Carrier Tracking Portal
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'claims' ? (
            <ClaimsTab data={data} consignment={consignment} />
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="mv-kicker">Raw Ingested Webhook Payload</div>
                <button
                  onClick={() => {
                    const str = JSON.stringify(data?.raw_webhook || data?.charge_raw_payload || data, null, 2);
                    navigator.clipboard.writeText(str);
                    alert('Raw webhook JSON copied to clipboard');
                  }}
                  className="mv-btn-ghost"
                  style={{ fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Copy size={12} /> Copy JSON
                </button>
              </div>
              <pre style={{
                background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)',
                padding: '14px 16px', fontSize: 11.5, color: 'var(--mv-ink)',
                fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                maxHeight: 'calc(100vh - 280px)', lineHeight: 1.5,
              }}>
                {JSON.stringify(data?.raw_webhook || data?.charge_raw_payload || { message: 'No raw webhook captured for this parcel' }, null, 2)}
              </pre>
            </div>
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

const selectStyle = {
  fontSize: 11.5, height: 28, padding: '0 10px',
  border: '1px solid var(--mv-hairline-2)', color: 'var(--mv-ink-78)',
  background: 'var(--mv-bg)', fontFamily: 'inherit', borderRadius: 'var(--v2-r-sm)', cursor: 'pointer',
};

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';

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
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [staleRunning, setStaleRunning]     = useState(false);
  const [staleResult, setStaleResult]       = useState(null);

  const searchRef = useRef(null);
  const LIMIT = 50;

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

  // Query parcel list — params must match the /api/tracking GET route exactly
  const { data: listData, isLoading, refetch: refetchList } = useQuery({
    queryKey: ['tracking-parcels', debouncedSearch, customerFilter, statusFilter, courierFilter, dateFrom, dateTo, page],
    queryFn: () => api.get('/tracking', { params: {
      search:       debouncedSearch || undefined,
      status:       statusFilter    || undefined,
      courier_code: courierFilter   || undefined,
      customer_id:  customerFilter  || undefined,
      date_from:    dateFrom        || undefined,
      date_to:      dateTo          || undefined,
      limit:  LIMIT,
      offset: page * LIMIT,
    }}).then(r => r.data),
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
      setStaleResult({ ok: true, msg: res.data?.message || `Queued ${res.data?.queued || 0} stale parcels for refresh` });
      refresh();
    } catch (err) {
      setStaleResult({ ok: false, msg: err?.response?.data?.error || 'Failed to refresh stale parcels' });
    } finally {
      setStaleRunning(false);
    }
  }

  async function handlePurgePriorToday() {
    if (!window.confirm('Delete all tracking events and parcel records from before today?')) return;
    try {
      const res = await api.post('/tracking/delete-before-today');
      alert(`Purged ${res.data.events_deleted || 0} events and ${res.data.parcels_deleted || 0} parcels from before today.`);
      refresh();
    } catch (err) {
      alert('Failed to purge tracking data: ' + (err.response?.data?.error || err.message));
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
      setShowCustomDate(false);
    }
    setPage(0);
  }

  function toggleCustomDate() {
    if (datePreset === 'Custom') {
      setDatePreset('');
      setDateFrom('');
      setDateTo('');
      setShowCustomDate(false);
    } else {
      setDatePreset('Custom');
      setShowCustomDate(true);
    }
    setPage(0);
  }

  function toggleStatus(st) {
    setStatusFilter(prev => prev === st ? '' : st);
    setPage(0);
  }

  function clearAll() {
    setStatusFilter(''); setCourierFilter(''); setCustomerFilter(''); setSearch('');
    setDatePreset(''); setDateFrom(''); setDateTo(''); setShowCustomDate(false);
    setPage(0);
  }

  const parcels  = listData?.parcels || [];
  const total    = listData?.total || 0;
  const pages    = Math.ceil(total / LIMIT);
  const bs       = stats?.by_status || {};
  const customers= stats?.by_customer || [];
  const couriers = stats?.by_courier  || [];
  const activeStatuses = Object.entries(bs).filter(([, count]) => count > 0).map(([status]) => status);
  const hasFilters = statusFilter || courierFilter || customerFilter || search || dateFrom || dateTo;

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
            <button
              onClick={handlePurgePriorToday}
              className="mv-btn-ghost"
              style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--mv-magenta-deep)', borderColor: 'var(--mv-magenta)' }}
              title="Delete all tracking events and parcels from before today"
            >
              <X size={13} /> Purge Prior to Today
            </button>
          </div>
        </div>

        {staleResult && (
          <div style={{
            marginBottom: 10, fontSize: 12, padding: '7px 12px',
            border: `1px solid ${staleResult.ok ? 'var(--mv-green)' : 'var(--mv-magenta)'}`,
            color: staleResult.ok ? 'var(--mv-green-deep)' : 'var(--mv-magenta-deep)',
          }}>
            {staleResult.msg}
          </div>
        )}

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
          <button
            className={`mv-chip ${datePreset === 'Custom' ? 'is-on' : ''}`}
            onClick={toggleCustomDate}
          >
            Custom
          </button>
          {showCustomDate && (
            <>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setDatePreset('Custom'); setPage(0); }} style={selectStyle} />
              <span style={{ color: 'var(--mv-ink-45)', fontSize: 12 }}>–</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setDatePreset('Custom'); setPage(0); }} style={selectStyle} />
            </>
          )}

          {statusFilter && (
            <button className="mv-chip is-on" onClick={() => setStatusFilter('')}>
              Status: {getStatusState(statusFilter).label} <X size={11} style={{ marginLeft: 4 }} />
            </button>
          )}

          {customers.length > 0 && (
            <select value={customerFilter} onChange={e => { setCustomerFilter(e.target.value); setPage(0); }} style={selectStyle}>
              <option value="">All customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} style={selectStyle}>
            <option value="">All statuses</option>
            {activeStatuses.map(s => (
              <option key={s} value={s}>{getStatusState(s).label}</option>
            ))}
          </select>

          {couriers.length > 0 && (
            <select value={courierFilter} onChange={e => { setCourierFilter(e.target.value); setPage(0); }} style={selectStyle}>
              <option value="">All couriers</option>
              {couriers.map(c => (
                <option key={c.courier_code || c.courier_name} value={c.courier_code || c.courier_name}>
                  {c.courier_name} ({c.count})
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button className="mv-chip" onClick={clearAll} style={{ color: 'var(--mv-magenta-deep)', borderColor: 'var(--mv-magenta)' }}>
              <X size={11} style={{ marginRight: 4 }} /> Clear all
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
                <th style={{ width: 85 }}>ISO</th>
                <th>Status</th>
                <th>Last Telemetry Event</th>
                <th style={{ width: 110, textAlign: 'right' }}>Est. Delivery</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-52)' }}>Loading parcels…</td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-52)' }}>
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
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }} title={formatCountryName(p.country_code)}>
                          {getCountryFlag(p.country_code)}
                        </span>
                        <span className="mv-num" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mv-ink)' }}>
                          {p.country_code || 'GB'}
                        </span>
                      </div>
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
