/**
 * RunDetailPage  —  /reconciliation/:id
 *
 * Shows the full results for a single reconciliation run.
 * Tabs: Overview | Matched | Corrected | Unmatched (human review queue) | Mappings
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle,
  X, Check, Lock, Send, Download, ChevronRight, Info,
} from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Styles ───────────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(0,0,0,0.03)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10, padding: '16px 20px',
};
const inputSt = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: 7, color: '#0F172A', fontSize: 12,
  padding: '7px 10px', outline: 'none',
};
const btnGreen = {
  background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)',
  borderRadius: 7, color: '#00C853', padding: '7px 14px', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
};
const btnGhost = {
  background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 7, color: '#64748B', padding: '7px 14px', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
};
const btnRed = {
  background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)',
  borderRadius: 7, color: '#FF5252', padding: '7px 14px', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    matched:      { color: '#00C853', bg: 'rgba(0,200,83,0.12)',   border: 'rgba(0,200,83,0.3)',   label: 'Matched' },
    corrected:    { color: '#FF8F00', bg: 'rgba(255,143,0,0.12)',  border: 'rgba(255,143,0,0.3)',  label: 'Corrected' },
    unmatched:    { color: '#FFB300', bg: 'rgba(255,160,0,0.12)',  border: 'rgba(255,160,0,0.3)',  label: 'Unmatched' },
    processing:   { color: '#64748B',   bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.08)', label: 'Processing' },
  }[status] || { color: '#64748B', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.08)', label: status };
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 9999,
      fontSize: 10, fontWeight: 700,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Unmatched reason label ───────────────────────────────────────────────────
function ReasonLabel({ reason, correctedBy }) {
  // Warning: carrier billed a surcharge but customer was not charged
  if (reason === 'sell_surcharge_missing') {
    return <span style={{ fontSize: 10, color: '#92400E', background: 'rgba(255,179,0,0.2)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>⚠ Customer not billed</span>;
  }
  // corrected_by values from the engine
  if (correctedBy === 'surcharge_mapping') {
    return <span style={{ fontSize: 10, color: '#00C853', fontWeight: 600 }}>Surcharge mapping</span>;
  }
  if (correctedBy === 'weight_correction') {
    return <span style={{ fontSize: 10, color: '#92400E', background: '#FEF3C7', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>⚖ Weight corrected</span>;
  }
  if (correctedBy === 'carrier_undercharge') {
    return <span style={{ fontSize: 10, color: '#1E40AF', background: '#DBEAFE', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>↓ Carrier undercharge</span>;
  }
  const labels = {
    unknown_service_code:    { text: 'Unknown service code',  color: '#FF5252' },
    no_account_mapping:      { text: 'Account not mapped',    color: '#FFB300' },
    not_in_verified_pool:    { text: 'Not verified',          color: '#FF5252' },
    no_pricing_rules:        { text: 'No pricing rules',      color: '#FFB300' },
    unexplained_delta:       { text: 'Unexplained delta',     color: '#FFB300' },
    external_booking_review: { text: 'External booking',      color: '#79AAFF' },
    fuel_aggregate_mismatch: { text: 'Fuel mismatch',         color: '#FFB300' },
    hgv_aggregate_mismatch:  { text: 'HGV mismatch',         color: '#FFB300' },
    no_hgv_rate:             { text: 'No HGV rate on file',   color: '#FF5252' },
    aggregate_mismatch:      { text: 'Aggregate mismatch',    color: '#FFB300' },
    parcel_count_mismatch:        { text: '⚠ Parcel count overbill',      color: '#FF5252' },
    weight_sell_lookup_failed:    { text: '⚖ Weight corrected — sell rate missing', color: '#FF5252' },
    cancelled_unshipped:          { text: '🚫 Cancelled — dispute with DPD', color: '#FF5252' },
    cancelled_shipped:            { text: '⚠ Cancelled — parcel was shipped', color: '#FFB300' },
    cancelled_booking_invoiced:   { text: '🚫 Cancelled booking — credit DPD',  color: '#FF5252' },
    hash_continuation:            { text: '# Split row — continuation parcel',  color: '#64748B' },
    processing_error:             { text: '⚡ Processing error — re-import', color: '#FF5252' },
  };
  const cfg = labels[reason] || { text: reason || '—', color: '#64748B' };
  return <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.text}</span>;
}

// ─── Correction detail — plain-English "why corrected" explanation ────────────
// Shows inline in the Corrected tab's Reason column so operators can see exactly
// which surcharge was applied, which mapping rule fired, or why the engine
// accepted a delta without further action.
function CorrectionDetail({ line, surchargeLookup }) {
  const cb   = line.corrected_by;
  const meta = line.correction_metadata;

  // column_surcharge: carrier applied named per-shipment surcharges from the CSV.
  // This is a legacy corrected_by value — current engine matches these lines (delta=0)
  // since the expected already includes the surcharge. Legacy DB rows with this value
  // will have correction_metadata.col_surcharges with the breakdown.
  if (cb === 'column_surcharge') {
    const surcharges = meta?.col_surcharges || [];
    if (surcharges.length === 0) {
      return <span style={{ fontSize: 10, color: '#FFB300', fontWeight: 600 }}>Column surcharge</span>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {surcharges.map((s, i) => {
          const name = surchargeLookup[s.surcharge_id]?.name || s.surcharge_id;
          return (
            <span key={i} style={{ fontSize: 10, color: '#FFB300', fontWeight: 600 }}>
              {name}: +£{parseFloat(s.amount).toFixed(2)}
            </span>
          );
        })}
      </div>
    );
  }

  // pricing_rules: legacy engine value — rate card confirmed the carrier's charge
  if (cb === 'pricing_rules') {
    return <span style={{ fontSize: 10, color: '#79AAFF', fontWeight: 600 }}>Rate card confirmed</span>;
  }

  // mapping: a saved reconciliation mapping rule explained the delta
  if (cb === 'mapping') {
    const mappingLabels = {
      delta_acceptance:  'Delta accepted',
      service_code:      'Service code rule',
      account_number:    'Account number rule',
      surcharge_code:    'Surcharge code rule',
      weight_adjustment: 'Weight adjustment rule',
      map_to_surcharge:  'Mapped to surcharge',
    };
    const mappingLabel = mappingLabels[line.mapping_type_applied] || 'Saved rule applied';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 10, color: '#79AAFF', fontWeight: 600 }}>{mappingLabel}</span>
        {line.mapping_match_field && line.mapping_match_value && (
          <span style={{ fontSize: 10, color: '#64748B' }}>
            {line.mapping_match_field}: {line.mapping_match_value}
          </span>
        )}
      </div>
    );
  }

  // carrier_direct: shipment not booked through OMS — priced from rate card at reconciliation.
  // Show mapped surcharges (col_surcharges, looked up by UUID) and any remaining unmapped
  // monetary columns (raw_col_values) so the operator can see what the carrier applied.
  if (cb === 'carrier_direct') {
    const mappedSurcharges = meta?.col_surcharges || [];
    const rawCols = Object.entries(meta?.raw_col_values || {}).filter(([, v]) => parseFloat(v) !== 0);
    const hasBreakdown = mappedSurcharges.length > 0 || rawCols.length > 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, color: '#79AAFF', fontWeight: 600 }}>External booking — rate card</span>
        {mappedSurcharges.map((s, i) => {
          const name = surchargeLookup[s.surcharge_id]?.name || s.surcharge_id;
          return (
            <span key={`ms-${i}`} style={{ fontSize: 10, color: '#FFB300', fontWeight: 600 }}>
              {name}: +£{parseFloat(s.amount).toFixed(2)}
            </span>
          );
        })}
        {rawCols.map(([col, val], i) => (
          <span key={`rc-${i}`} style={{ fontSize: 10, color: '#FFB300', fontWeight: 600 }}>
            {col.replace(/ Charge$/i, '')}: +£{parseFloat(val).toFixed(2)}
          </span>
        ))}
        {!hasBreakdown && (
          <span style={{ fontSize: 10, color: '#64748B' }}>No surcharge breakdown available</span>
        )}
      </div>
    );
  }

  // weight_correction: carrier billed at higher weight — charge repriced upward
  if (cb === 'weight_correction') {
    const declared = meta?.declared_weight_kg;
    const billed   = meta?.billed_weight_kg;
    const diff     = meta?.weight_diff_kg;
    const oldCost  = meta?.old_cost_price;
    const newCost  = meta?.new_cost_price;
    const band     = meta?.band_label;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, color: '#92400E', fontWeight: 600 }}>⚖ Weight corrected & recharged</span>
        {declared != null && billed != null && (
          <span style={{ fontSize: 10, color: '#64748B' }}>
            {parseFloat(declared).toFixed(2)}kg → {parseFloat(billed).toFixed(2)}kg (+{parseFloat(diff ?? 0).toFixed(2)}kg)
          </span>
        )}
        {oldCost != null && newCost != null && (
          <span style={{ fontSize: 10, color: '#64748B' }}>
            Cost £{parseFloat(oldCost).toFixed(2)} → £{parseFloat(newCost).toFixed(2)}
            {band ? ` · ${band}` : ''}
          </span>
        )}
      </div>
    );
  }

  // carrier_undercharge: carrier billed less than expected — flagged only, NOT downgraded
  if (cb === 'carrier_undercharge') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 10, color: '#1E40AF', fontWeight: 600 }}>↓ Carrier undercharge</span>
        <span style={{ fontSize: 10, color: '#64748B' }}>Highlighted only — charge not reduced</span>
      </div>
    );
  }

  // surcharge_mapping: overhead or surcharge row auto-accepted
  if (cb === 'surcharge_mapping') {
    return <span style={{ fontSize: 10, color: '#00C853', fontWeight: 600 }}>Auto-accepted surcharge</span>;
  }

  // carrier_overhead: DPD-style overhead row (fuel/carriage) auto-accepted
  if (cb === 'carrier_overhead') {
    return <span style={{ fontSize: 10, color: '#00C853', fontWeight: 600 }}>Carrier overhead</span>;
  }

  // human: manually resolved by a staff member
  if (cb === 'human') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Manually approved</span>
        {line.resolved_by_name && (
          <span style={{ fontSize: 10, color: '#64748B' }}>by {line.resolved_by_name}</span>
        )}
      </div>
    );
  }

  // fallback for any future corrected_by values
  if (cb) {
    return <span style={{ fontSize: 10, color: '#64748B' }}>via {cb}</span>;
  }

  return null;
}

// ─── Resolve drawer ───────────────────────────────────────────────────────────
function ResolveDrawer({ line, courierId, onClose, onResolved, defaultResolutionType }) {
  const isUnknownCode        = line.unmatched_reason === 'unknown_service_code';
  const isCancelledBooking   = line.unmatched_reason === 'cancelled_booking_invoiced';
  const isNoAccountMapping   = line.unmatched_reason === 'no_account_mapping';

  // For unknown service code lines default straight into the mapping flow.
  // defaultResolutionType lets callers (e.g. the DeltaCell tooltip) pre-select
  // a resolution type without the operator having to pick it manually.
  const [scope,           setScope]           = useState('once');
  const [saveRule,        setSaveRule]        = useState(isUnknownCode || isNoAccountMapping);
  const [ruleScope,       setRuleScope]       = useState('global');        // 'global' | 'customer'
  const [resolutionType,  setResolutionType]  = useState(
    defaultResolutionType
    || (isUnknownCode    ? 'map_to_service'   : '')
    || (isCancelledBooking ? 'credit_request' : '')
    || (isNoAccountMapping ? 'map_to_customer': '')
  );
  const [resolutionValue, setResolutionValue] = useState(
    // Pre-populate with suggested service if the engine found one
    isUnknownCode && line.suggested_service_id
      ? String(line.suggested_service_id)
      // Pre-populate surcharge for warning lines (sell_surcharge_missing) where we already know the surcharge
      : (defaultResolutionType === 'map_to_surcharge' && line.surcharge_id)
        ? String(line.surcharge_id)
        : ''
  );
  const [notes,           setNotes]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [fuelRate,        setFuelRate]        = useState(null);
  // Customer search state for map_to_customer
  const [custSearch,      setCustSearch]      = useState('');
  const [custResults,     setCustResults]     = useState([]);
  const [custSearching,   setCustSearching]   = useState(false);
  const [selectedCust,    setSelectedCust]    = useState(null); // { id, business_name, account_number }

  const isSurchargeMapping  = resolutionType === 'map_to_surcharge';
  const isManualPrice       = resolutionType === 'manual_price';
  const isMapToCustomer     = resolutionType === 'map_to_customer';

  // Customer search for map_to_customer
  useEffect(() => {
    if (!isMapToCustomer || custSearch.length < 2) { setCustResults([]); return; }
    setCustSearching(true);
    const timer = setTimeout(() => {
      api.get(`/customers?search=${encodeURIComponent(custSearch)}&limit=10`)
        .then(r => setCustResults(r.data?.customers || r.data || []))
        .catch(() => setCustResults([]))
        .finally(() => setCustSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [custSearch, isMapToCustomer]);

  // Fetch fuel rate when manual_price is selected
  useEffect(() => {
    if (!isManualPrice) return;
    api.get(`/reconciliation/runs/${line.run_id}/lines/${line.id}/fuel-rate`)
      .then(r => setFuelRate(r.data))
      .catch(() => setFuelRate({ fuel_pct: 0, fuel_group_name: null }));
  }, [isManualPrice, line.run_id, line.id]);

  // Derived: total sell when manual_price is active
  const manualBase  = parseFloat(resolutionValue) || 0;
  const fuelPct     = fuelRate?.fuel_pct ?? 0;
  const manualTotal = manualBase > 0 ? Math.round(manualBase * (1 + fuelPct / 100) * 100) / 100 : 0;

  const { data: services = [] } = useQuery({
    queryKey: ['recon-services', courierId],
    queryFn:  () => api.get(`/reconciliation/courier-services?carrier_id=${courierId}`).then(r => r.data),
    enabled:  !!courierId,
  });

  const { data: surcharges = [] } = useQuery({
    queryKey: ['recon-surcharges', courierId],
    queryFn:  () => api.get(`/reconciliation/surcharges?carrier_id=${courierId}`).then(r => r.data),
    enabled:  !!courierId && (isUnknownCode || resolutionType === 'map_to_surcharge'),
  });

  const suggestedMappingType = {
    unknown_service_code:       'service_code',
    no_account_mapping:         'account_number',
    no_pricing_rules:           null,
    unexplained_delta:          'delta_acceptance',
    external_booking_review:    'account_number',
    cancelled_booking_invoiced: 'credit_request',  // triggers bulk-apply in server
  }[line.unmatched_reason];

  async function handleResolve() {
    const noValueNeeded = resolutionType === 'credit_request';
    const customerValueNeeded = isMapToCustomer;
    if (!resolutionType || (!noValueNeeded && !customerValueNeeded && !resolutionValue)) {
      setError('Please fill in all required fields');
      return;
    }
    if (isMapToCustomer && !selectedCust) {
      setError('Select a customer from the dropdown');
      return;
    }
    if (resolutionType === 'manual_price' && (parseFloat(resolutionValue) || 0) <= 0) {
      setError('Enter a base freight price greater than £0');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const effectiveScope = saveRule ? 'always' : 'once';
      const customerId = isMapToCustomer
        ? selectedCust.id
        : (saveRule && ruleScope === 'customer') ? (line.customer_id || null) : null;

      await api.post(`/reconciliation/runs/${line.run_id}/lines/${line.id}/resolve`, {
        resolution_type:  resolutionType,
        resolution_value: isMapToCustomer ? selectedCust.id : resolutionValue,
        scope:            effectiveScope,
        mapping_type:     effectiveScope === 'always' ? suggestedMappingType : null,
        customer_id:      customerId,
        notes,
      });
      onResolved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve');
      setLoading(false);
    }
  }

  // Find the suggested service object for display
  const suggestedService = line.suggested_service_id
    ? services.find(s => s.id === line.suggested_service_id)
    : null;
  const hasSuggestion = isUnknownCode && (line.suggested_service_name || suggestedService);
  const suggestionLabel = line.suggested_service_name
    ? `${line.suggested_service_name} (${line.suggested_service_code})`
    : suggestedService ? `${suggestedService.name} (${suggestedService.service_code})` : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
    }}>
      <div style={{
        width: 460, height: '100vh', background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        padding: 24, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Resolve Line</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Line context */}
        <div style={{ ...card, fontSize: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            {line.tracking_number && (
              <div><span style={{ color: '#64748B' }}>Tracking:</span> <span style={{ color: '#0F172A', fontFamily: 'monospace' }}>{line.tracking_number}</span></div>
            )}
            <div><span style={{ color: '#64748B' }}>Raw service code:</span> <span style={{ color: '#79AAFF', fontFamily: 'monospace', fontWeight: 700 }}>{line.raw_service_code || '—'}</span></div>
            <div><span style={{ color: '#64748B' }}>Carrier amount:</span> <span style={{ color: '#0F172A', fontWeight: 700 }}>£{parseFloat(line.carrier_amount || 0).toFixed(2)}</span></div>
            {line.expected_amount != null && (
              <div><span style={{ color: '#64748B' }}>Expected:</span> <span style={{ color: '#0F172A' }}>£{parseFloat(line.expected_amount).toFixed(2)}</span></div>
            )}
            {line.delta != null && (
              <div><span style={{ color: '#64748B' }}>Delta:</span>
                <span style={{ color: parseFloat(line.delta) > 0 ? '#FF5252' : '#00C853', fontWeight: 700, marginLeft: 4 }}>
                  {parseFloat(line.delta) > 0 ? '+' : ''}£{parseFloat(line.delta).toFixed(2)}
                </span>
              </div>
            )}
            <div><span style={{ color: '#64748B' }}>Reason:</span> <span style={{ marginLeft: 4 }}><ReasonLabel reason={line.unmatched_reason} /></span></div>
            {line.unmatched_reason === 'parcel_count_mismatch' && line.correction_metadata && (
              <div style={{
                marginTop: 6, padding: '8px 12px',
                background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.3)',
                borderRadius: 6, fontSize: 11,
              }}>
                <span style={{ color: '#FF5252', fontWeight: 700 }}>DPD invoiced {line.correction_metadata.invoice_parcel_count} parcel{line.correction_metadata.invoice_parcel_count !== 1 ? 's' : ''} — booking was for {line.correction_metadata.booked_parcel_count} parcel{line.correction_metadata.booked_parcel_count !== 1 ? 's' : ''}</span>
                <span style={{ color: '#64748B', marginLeft: 8 }}>Dispute this charge with DPD before finalising.</span>
              </div>
            )}
            {line.aged && (
              <div style={{ marginTop: 4 }}>
                <span style={{ background: 'rgba(213,0,0,0.15)', border: '1px solid rgba(213,0,0,0.3)', borderRadius: 9999, padding: '2px 8px', fontSize: 10, color: '#FF5252', fontWeight: 700 }}>
                  ⚠ AGED — appeared Unmatched on 2+ runs
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Smart suggestion banner — only for unknown_service_code */}
        {hasSuggestion && (
          <div style={{
            background: 'rgba(121,170,255,0.08)', border: '1px solid rgba(121,170,255,0.25)',
            borderRadius: 8, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 11, color: '#79AAFF', fontWeight: 700, marginBottom: 4 }}>
              ✦ Smart Suggestion
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              The tracking number was found in the Verified Pool. The shipment was booked as:
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {suggestionLabel}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
              The dropdown below is pre-selected with this match.
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)', borderRadius: 7, padding: '10px 14px', color: '#FF5252', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Resolution type — for unknown_service_code show tile grid + manual price option */}
        {isUnknownCode ? (
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>RESOLUTION TYPE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { val: 'map_to_service',   label: 'Delivery Service', desc: 'Map code to a service, price from rate card' },
                { val: 'map_to_surcharge', label: 'Surcharge',        desc: 'Named fee (e.g. congestion, remote area)' },
                { val: 'manual_price',     label: 'Manual Price',     desc: 'Enter a sell price directly for this line' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => { setResolutionType(opt.val); setResolutionValue(''); }}
                  style={{
                    padding: '9px 11px', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                    background: resolutionType === opt.val ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${resolutionType === opt.val ? 'rgba(0,200,83,0.35)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: resolutionType === opt.val ? '#00C853' : '#0F172A' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>RESOLUTION TYPE</label>
            <select style={inputSt} value={resolutionType} onChange={e => setResolutionType(e.target.value)}>
              <option value=''>— Select type —</option>
              <option value='accept'>Accept charge as-is</option>
              <option value='accept_delta'>Accept delta as tolerance</option>
              <option value='manual_price'>Set manual sell price</option>
              <option value='credit_request'>Applying for credit with Courier</option>
              <option value='map_to_surcharge'>Map to surcharge</option>
              <option value='map_to_service'>Map to internal service</option>
              <option value='map_to_customer'>Map account to customer</option>
              <option value='reject'>Reject / dispute charge</option>
            </select>
          </div>
        )}

        {/* Service mapping dropdown */}
        {(resolutionType === 'map_to_service') && (
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>
              MAP "{line.raw_service_code}" TO INTERNAL SERVICE *
            </label>
            <select
              style={inputSt}
              value={resolutionValue}
              onChange={e => setResolutionValue(e.target.value)}
            >
              <option value=''>— Select service —</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.service_code})
                  {s.id === line.suggested_service_id ? ' ✦ Suggested' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Surcharge mapping dropdown */}
        {(resolutionType === 'map_to_surcharge') && (() => {
          const selectedSurcharge = surcharges.find(s => s.id === resolutionValue);
          return (
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                MAP "{line.raw_service_code}" TO SURCHARGE *
              </label>
              <select
                style={inputSt}
                value={resolutionValue}
                onChange={e => setResolutionValue(e.target.value)}
              >
                <option value=''>— Select surcharge —</option>
                {surcharges.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              {surcharges.length === 0 && (
                <div style={{ fontSize: 10, color: '#FFB300', marginTop: 4 }}>
                  No surcharges configured for this carrier yet. Add them in Carriers → Surcharges first.
                </div>
              )}
              {selectedSurcharge && (
                <div style={{
                  marginTop: 8, padding: '9px 12px',
                  background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.18)',
                  borderRadius: 7, fontSize: 11,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Standard sell price</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>
                      {selectedSurcharge.calc_type === 'percentage'
                        ? `${parseFloat(selectedSurcharge.default_value).toFixed(2)}% of base`
                        : `£${parseFloat(selectedSurcharge.default_value || 0).toFixed(2)} / ${selectedSurcharge.charge_per || 'shipment'}`}
                    </span>
                  </div>
                  <div style={{ color: '#64748B', marginTop: 4 }}>
                    Override this customer's sell price in their Pricing tab if needed.
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Delta tolerance input */}
        {resolutionType === 'accept_delta' && (
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>TOLERANCE % *</label>
            <input
              style={inputSt}
              type='number' step='0.1' min='0' max='100'
              placeholder='e.g. 5 (means ±5%)'
              value={resolutionValue}
              onChange={e => setResolutionValue(e.target.value)}
            />
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>±% delta that will auto-correct in future runs</div>
          </div>
        )}

        {/* Manual price input */}
        {isManualPrice && (
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>
              BASE FREIGHT SELL PRICE (£) *
            </label>
            <input
              style={inputSt}
              type='number' step='0.01' min='0.01'
              placeholder='e.g. 45.00'
              value={resolutionValue}
              onChange={e => setResolutionValue(e.target.value)}
            />
            {fuelRate === null && manualBase > 0 && (
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>Loading fuel rate…</div>
            )}
            {fuelRate !== null && manualBase > 0 && (
              <div style={{
                marginTop: 8, padding: '10px 12px',
                background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)',
                borderRadius: 7, fontSize: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748B' }}>Base freight</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>£{manualBase.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748B' }}>
                    Fuel {fuelRate.fuel_group_name ? `(${fuelRate.fuel_group_name})` : ''} {fuelPct}%
                  </span>
                  <span style={{ color: '#0F172A' }}>£{(manualTotal - manualBase).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 6, marginTop: 4 }}>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>Total to bill customer</span>
                  <span style={{ color: '#00C853', fontWeight: 700, fontSize: 13 }}>£{manualTotal.toFixed(2)}</span>
                </div>
                {fuelPct === 0 && (
                  <div style={{ fontSize: 10, color: '#FFB300', marginTop: 6 }}>
                    ⚠ No fuel rate found for this customer — total equals base freight
                  </div>
                )}
                {fuelPct > 0 && fuelRate?.source === 'carrier_standard' && (
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>
                    Using carrier standard rate (no billing history yet for this customer)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Customer search for map_to_customer */}
        {isMapToCustomer && (
          <div>
            {line.carrier_account_no && (
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                Carrier account: <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 700 }}>{line.carrier_account_no}</span>
              </div>
            )}
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>ASSIGN TO CUSTOMER *</label>
            {selectedCust ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{selectedCust.business_name}</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Account: {selectedCust.account_number || '—'}</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 16 }} onClick={() => { setSelectedCust(null); setCustSearch(''); }}>×</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  style={inputSt}
                  placeholder='Type customer name or account number…'
                  value={custSearch}
                  onChange={e => setCustSearch(e.target.value)}
                  autoFocus
                />
                {custSearching && <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Searching…</div>}
                {custResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#FFF', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginTop: 2, maxHeight: 200, overflowY: 'auto' }}>
                    {custResults.map(c => (
                      <div
                        key={c.id}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                        onMouseDown={() => { setSelectedCust(c); setResolutionValue(c.id); setCustResults([]); setCustSearch(''); }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{c.business_name}</div>
                        <div style={{ fontSize: 10, color: '#64748B' }}>Account: {c.account_number || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>
              Tick "Save as Permanent Rule" below to auto-assign all future lines from this DPD account to this customer.
            </div>
          </div>
        )}

        {/* Generic value input for other types */}
        {!isUnknownCode && !isMapToCustomer && resolutionType !== 'map_to_service' && resolutionType !== 'accept_delta' && resolutionType !== 'credit_request' && !isManualPrice && resolutionType && (
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>RESOLUTION VALUE *</label>
            <input
              style={inputSt}
              placeholder={resolutionType === 'reject' ? 'Reason for rejection' : 'Resolution value'}
              value={resolutionValue}
              onChange={e => setResolutionValue(e.target.value)}
            />
          </div>
        )}

        {/* Save as Permanent Rule / Apply to all */}
        <div style={{
          background: saveRule ? 'rgba(0,200,83,0.06)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${saveRule ? 'rgba(0,200,83,0.3)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 8, padding: '12px 14px',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type='checkbox'
              checked={saveRule}
              onChange={e => setSaveRule(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: '#00C853', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: saveRule ? '#00C853' : '#0F172A' }}>
                {isCancelledBooking ? 'Apply to all cancelled lines in this run' :
                 isMapToCustomer   ? 'Save account → customer mapping permanently' :
                 'Save as Permanent Rule'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                {isCancelledBooking ? 'Marks all other cancelled booking lines in this run for credit' :
                 isMapToCustomer   ? `Always assign DPD account ${line.carrier_account_no || '—'} to this customer` :
                 'Auto-resolve this code on all future runs for this carrier'}
              </div>
            </div>
          </label>

          {/* Rule scope — visible when saving a service code OR surcharge mapping */}
          {saveRule && (isUnknownCode || resolutionType === 'map_to_surcharge') && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>APPLIES TO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { val: 'global',   label: 'All Customers',    desc: 'Standard code used by all' },
                  { val: 'customer', label: 'This Customer Only', desc: line.customer_name ? `${line.customer_name} only` : 'Customer-specific contract code' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setRuleScope(opt.val)}
                    style={{
                      padding: '9px 11px', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                      background: ruleScope === opt.val ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${ruleScope === opt.val ? 'rgba(0,200,83,0.35)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: ruleScope === opt.val ? '#00C853' : '#0F172A' }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
              {ruleScope === 'customer' && !line.customer_id && (
                <div style={{ fontSize: 11, color: '#FFB300', marginTop: 8 }}>
                  ⚠ No customer identified on this line — rule will be saved as global
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600 }}>NOTES (OPTIONAL)</label>
          <textarea
            style={{ ...inputSt, minHeight: 56, resize: 'vertical' }}
            placeholder='Any context for this resolution…'
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
          <button style={{ ...btnGhost, flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
          <button
            style={{ ...btnGreen, flex: 2, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            onClick={handleResolve}
            disabled={loading}
          >
            {loading ? <RefreshCw size={13} /> : <Check size={13} />}
            {loading ? 'Saving…' : saveRule ? 'Resolve & Save Rule' : 'Resolve Once'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Service code mapping banner ─────────────────────────────────────────────
// Appears above the Unmatched table when there are unknown_service_code lines.
// Groups them by raw code, lets the user pick a mapping for each, then bulk-saves.
function ServiceCodeMappingBanner({ unmatchedLines, runId, courierId, onMapped }) {
  const unknownLines = unmatchedLines.filter(l => l.unmatched_reason === 'unknown_service_code');
  if (!unknownLines.length) return null;

  // Group by raw_service_code — preserve insertion order
  const groups = new Map();
  for (const line of unknownLines) {
    const code = line.raw_service_code || '(blank)';
    if (!groups.has(code)) {
      groups.set(code, { code, count: 0, suggested_service_id: null, suggested_label: null });
    }
    const g = groups.get(code);
    g.count++;
    if (!g.suggested_service_id && line.suggested_service_id) {
      g.suggested_service_id = line.suggested_service_id;
      const name = line.suggested_service_name
        ? `${line.suggested_service_name} (${line.suggested_service_code})`
        : null;
      g.suggested_label = name;
    }
  }

  // Mapping state: code → service_id string
  const [selections, setSelections] = useState(() => {
    const init = {};
    for (const [code, g] of groups) {
      init[code] = g.suggested_service_id ? String(g.suggested_service_id) : '';
    }
    return init;
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['recon-services', courierId],
    queryFn:  () => api.get(`/reconciliation/courier-services?carrier_id=${courierId}`).then(r => r.data),
    enabled:  !!courierId,
  });

  const allSet = [...groups.keys()].every(code => !!selections[code]);

  async function handleApply() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const mappings = [...groups.keys()]
        .filter(code => !!selections[code])
        .map(code => ({ raw_service_code: code, service_id: parseInt(selections[code]) }));

      const res = await api.post(`/reconciliation/runs/${runId}/bulk-map-service-codes`, { mappings });
      setSuccess(`Mapped ${res.data.total_lines_updated} line${res.data.total_lines_updated !== 1 ? 's' : ''} — refreshing…`);
      setTimeout(onMapped, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply mappings');
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: 'rgba(255,160,0,0.04)',
      border: '1px solid rgba(255,160,0,0.25)',
      borderRadius: 10, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFB300', display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={15} />
            {groups.size} unknown service code{groups.size !== 1 ? 's' : ''} — map before finalizing
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
            Map each raw carrier code to an internal service. Saves as a permanent rule so future runs auto-resolve.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...groups.values()].map(g => (
          <div key={g.code} style={{
            display: 'grid', gridTemplateColumns: '140px 50px 1fr 120px', gap: 12,
            alignItems: 'center', padding: '10px 14px',
            background: 'rgba(0,0,0,0.03)', borderRadius: 8,
            border: selections[g.code] ? '1px solid rgba(0,200,83,0.2)' : '1px solid rgba(0,0,0,0.06)',
          }}>
            {/* Raw code */}
            <div>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Raw Code</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#79AAFF' }}>{g.code}</div>
            </div>
            {/* Line count */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Lines</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>{g.count}</div>
            </div>
            {/* Service dropdown */}
            <div>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                Maps To{g.suggested_label && <span style={{ color: '#79AAFF', marginLeft: 5 }}>✦ Suggestion available</span>}
              </div>
              <select
                style={inputSt}
                value={selections[g.code] || ''}
                onChange={e => setSelections(prev => ({ ...prev, [g.code]: e.target.value }))}
              >
                <option value=''>— Select internal service —</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.service_code})
                    {s.id === g.suggested_service_id ? ' ✦' : ''}
                  </option>
                ))}
              </select>
            </div>
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {selections[g.code] ? (
                <span style={{ fontSize: 11, color: '#00C853', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={13} />Ready
                </span>
              ) : (
                <span style={{ fontSize: 11, color: '#FFB300' }}>Needs mapping</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error / success feedback */}
      {error && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#FF5252', background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)', borderRadius: 7, padding: '8px 12px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#00C853', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 7, padding: '8px 12px' }}>
          {success}
        </div>
      )}

      {/* Apply button */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          style={{
            ...btnGreen,
            opacity: (saving || !allSet) ? 0.6 : 1,
            cursor: (saving || !allSet) ? 'not-allowed' : 'pointer',
          }}
          onClick={handleApply}
          disabled={saving || !allSet}
          title={!allSet ? 'Map all codes before applying' : ''}
        >
          {saving ? <RefreshCw size={13} /> : <Check size={13} />}
          {saving ? 'Applying…' : `Apply ${[...groups.keys()].filter(c => selections[c]).length} Mapping${groups.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

// ─── Shipment lookup panel ────────────────────────────────────────────────────
function ShipmentLookupPanel() {
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [err,           setErr]           = useState(null);
  const [backfillRef,    setBackfillRef]    = useState('');
  const [backfillTracking, setBackfillTracking] = useState('');
  const [backfilling,    setBackfilling]   = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [backfillErr,    setBackfillErr]   = useState('');

  async function handleBackfill(e) {
    e.preventDefault();
    const ref      = backfillRef.trim();
    const tracking = backfillTracking.trim();
    if (!ref && !tracking) return;
    setBackfilling(true); setBackfillResult(null); setBackfillErr('');
    try {
      const r = await api.post('/reconciliation/backfill-shipment', {
        reference:      ref      || undefined,
        tracking_number: tracking || undefined,
      });
      setBackfillResult(r.data);
    } catch (ex) {
      setBackfillErr(ex.response?.data?.error || 'Backfill failed');
    } finally {
      setBackfilling(false);
    }
  }

  async function handleLookup(e) {
    e.preventDefault();
    const tracking = input.trim();
    if (!tracking) return;
    setLoading(true); setResult(null); setErr(null);
    try {
      const r = await api.get(`/reconciliation/shipment-lookup`, { params: { tracking } });
      setResult(r.data);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }

  const statusColor = v => v ? '#00C853' : '#FF5252';

  return (
    <div style={card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
        Shipment Lookup
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>
        Search for any tracking / consignment number across all shipments — no reconciliation gates applied.
        Shows verified status, courier match, pool eligibility, and what's blocking the pool if anything.
      </div>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          style={{ ...inputSt, flex: 1 }}
          placeholder="e.g. 60120241068230"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" style={{ ...btnGhost, whiteSpace: 'nowrap' }} disabled={loading}>
          {loading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Info size={12} />}
          {loading ? 'Searching…' : 'Look up'}
        </button>
      </form>

      {err && <div style={{ color: '#FF5252', fontSize: 12 }}>{err}</div>}

      {result && (
        <div>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>
            Searched: <span style={{ fontFamily: 'monospace', color: '#64748B' }}>{result.tracking_searched}</span>
            {' '}·{' '}
            Variants tried: <span style={{ fontFamily: 'monospace', color: '#64748B' }}>{result.variants_tried.join(', ')}</span>
          </div>

          {result.shipments_found === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
                fontSize: 12, color: '#FF5252', fontWeight: 600,
              }}>
                ✗ No shipment found — the shipment-created webhook may never have fired for this tracking number.
              </div>

              {/* Manual backfill — recover a missed shipment using sender ref + tracking */}
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFB300', marginBottom: 4 }}>
                  Recover missed shipment
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, lineHeight: 1.5 }}>
                  Enter the <strong style={{ color: '#64748B' }}>sender reference</strong> (the customer ref used when booking — visible in DC) and the
                  tracking number. We'll search DC for that booking and pull it in.
                </div>
                <form onSubmit={handleBackfill} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    style={{ ...inputSt, width: 130 }}
                    placeholder="Sender ref e.g. 472393"
                    value={backfillRef}
                    onChange={e => setBackfillRef(e.target.value)}
                  />
                  <input
                    style={{ ...inputSt, width: 160, fontFamily: 'monospace' }}
                    placeholder="Tracking number"
                    value={backfillTracking || input}
                    onChange={e => setBackfillTracking(e.target.value)}
                  />
                  <button
                    type="submit"
                    style={{ ...btnGhost, whiteSpace: 'nowrap', opacity: backfilling ? 0.7 : 1 }}
                    disabled={backfilling || !backfillRef.trim()}
                  >
                    {backfilling ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />}
                    {backfilling ? 'Recovering…' : 'Recover shipment'}
                  </button>
                </form>
                {backfillErr && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#FF5252' }}>{backfillErr}</div>
                )}
                {backfillResult && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 6,
                    background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.25)',
                    fontSize: 11, color: '#00C853',
                  }}>
                    ✓ Created and verified {backfillResult.created} charge{backfillResult.created !== 1 ? 's' : ''} for ref{' '}
                    <span style={{ fontFamily: 'monospace' }}>{backfillResult.shipment_ref}</span>.
                    {backfillResult.warnings?.length > 0 && (
                      <div style={{ color: '#FFB300', marginTop: 4 }}>
                        Warnings: {backfillResult.warnings.join(', ')}
                      </div>
                    )}
                    <div style={{ marginTop: 4, color: '#64748B' }}>
                      Search the tracking number above again to confirm it is now in the pool.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {result.results.map((r, i) => (
            <div key={i} style={{
              marginBottom: 12, padding: '12px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${r.pool_eligible ? 'rgba(0,200,83,0.2)' : 'rgba(255,143,0,0.2)'}`,
            }}>
              {/* Pool eligibility banner */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                  Shipment {r.shipment.id}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                  background: r.pool_eligible ? 'rgba(0,200,83,0.12)' : 'rgba(255,143,0,0.12)',
                  border: `1px solid ${r.pool_eligible ? 'rgba(0,200,83,0.3)' : 'rgba(255,143,0,0.3)'}`,
                  color: r.pool_eligible ? '#00C853' : '#FF8F00',
                }}>
                  {r.pool_eligible ? '✓ Pool eligible' : '✗ Not in pool'}
                </span>
              </div>

              {/* Shipment details grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px', marginBottom: 10,
              }}>
                {[
                  ['Courier in OMS',   r.shipment.courier || '—'],
                  ['Booked',           r.shipment.created_at ? new Date(r.shipment.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'],
                  ['Reference',        r.shipment.reference || '—'],
                  ['dc_service_id',    r.shipment.dc_service_id || '(none)'],
                  ['tracking_codes',   r.shipment.tracking_codes.length ? r.shipment.tracking_codes.join(', ') : '(empty)'],
                  ['Weight',           r.shipment.total_weight_kg ? `${r.shipment.total_weight_kg} kg` : '—'],
                  ['Parcels (booked)', r.shipment.parcel_count ?? '—'],
                  ['Postcode',         r.shipment.ship_to_postcode || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10 }}>
                    <span style={{ color: '#475569' }}>{k}: </span>
                    <span style={{ color: '#64748B', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Reconciliation expected_amount summary */}
              {r.total_cost_price != null && (
                <div style={{
                  marginBottom: 10, padding: '7px 10px', borderRadius: 6,
                  background: 'rgba(88,166,255,0.07)', border: '1px solid rgba(88,166,255,0.2)',
                  fontSize: 11,
                }}>
                  <span style={{ color: '#58A6FF', fontWeight: 700 }}>Reconciliation expected_amount: £{r.total_cost_price.toFixed(2)}</span>
                  <span style={{ color: '#64748B', marginLeft: 8 }}>(base cost + fuel + surcharges — this is what the engine compares against the carrier invoice)</span>
                </div>
              )}

              {/* Pool blockers */}
              {r.pool_blockers.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {r.pool_blockers.map((b, j) => (
                    <div key={j} style={{
                      fontSize: 11, color: '#FF8F00', fontWeight: 600,
                      padding: '4px 8px', background: 'rgba(255,143,0,0.08)',
                      borderRadius: 5, marginBottom: 3,
                    }}>
                      ⚠ {b}
                    </div>
                  ))}
                </div>
              )}

              {/* Charges */}
              {r.charges.length === 0 ? (
                <div style={{ fontSize: 11, color: '#FF5252', fontWeight: 600 }}>
                  ✗ No charges found for this shipment — processShipment may have failed silently
                </div>
              ) : (
                <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      {['Type', 'Service', 'V', 'X', 'Cost (our cost)', 'Sell (customer)', 'Zone', 'Source', 'Customer'].map(h => (
                        <th key={h} style={{ padding: '4px 6px', textAlign: 'left', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: 9 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.charges.map((c, j) => (
                      <tr key={j} style={{
                        borderBottom: '1px solid rgba(0,0,0,0.03)',
                        opacity: c.cancelled ? 0.4 : 1,
                      }}>
                        <td style={{ padding: '4px 6px', color: '#64748B' }}>{c.charge_type}</td>
                        <td style={{ padding: '4px 6px', color: '#64748B', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.service_name}>{c.service_code || c.service_name || '—'}</td>
                        <td style={{ padding: '4px 6px', color: statusColor(c.verified), fontWeight: 700, fontSize: 9 }}>{c.verified ? '✓' : '✗'}</td>
                        <td style={{ padding: '4px 6px', color: c.cancelled ? '#FF5252' : '#333', fontWeight: c.cancelled ? 700 : 400, fontSize: 9 }}>{c.cancelled ? '✗' : '—'}</td>
                        <td style={{ padding: '4px 6px', color: '#0F172A', fontWeight: 600 }}>
                          {c.cost_price != null ? `£${parseFloat(c.cost_price).toFixed(2)}` : '—'}
                          {c.recon_corrected && <span title="Updated by reconciliation" style={{ marginLeft: 4, color: '#FFB300', fontSize: 8 }}>●R</span>}
                        </td>
                        <td style={{ padding: '4px 6px', color: '#00C853', fontWeight: 600 }}>{c.sell_price != null ? `£${parseFloat(c.sell_price).toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '4px 6px', color: '#64748B' }}>{c.zone_name || '—'}</td>
                        <td style={{ padding: '4px 6px', color: '#64748B', fontSize: 9 }}>{c.source || '—'}</td>
                        <td style={{ padding: '4px 6px', color: '#64748B' }}>{c.customer_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Trace modal ──────────────────────────────────────────────────────────────
function TraceModal({ runId, lineId, trackingNumber, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get(`/reconciliation/runs/${runId}/lines/${lineId}/trace`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setErr(e.response?.data?.error || 'Failed to load trace'); setLoading(false); });
  }, [runId, lineId]);

  const stepColor = s => s === 'ok' ? '#00C853' : s === 'warn' ? '#FF8F00' : s === 'error' ? '#FF5252' : '#64748B';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#0d1117', border: '1px solid rgba(0,0,0,0.10)',
        borderRadius: 12, padding: 24, width: 640, maxHeight: '80vh',
        overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
              Reconciliation Trace
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
              {trackingNumber || `line #${lineId}`}
            </div>
          </div>
          <button style={{ ...btnGhost, padding: '4px 8px' }} onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: 12, padding: '30px 0' }}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div>Loading trace…</div>
          </div>
        )}

        {err && (
          <div style={{ color: '#FF5252', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
            {err}
          </div>
        )}

        {data && data.steps && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.steps.map((step, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.03)',
                border: `1px solid rgba(255,255,255,${step.status === 'error' ? '0.15' : '0.06'})`,
                borderRadius: 8, padding: '10px 14px',
                borderLeft: `3px solid ${stepColor(step.status)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                    {i + 1}. {step.label}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: stepColor(step.status),
                  }}>
                    {step.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
                  {step.detail}
                </div>
                {step.value != null && (
                  <div style={{
                    marginTop: 6, fontSize: 12, fontWeight: 700,
                    color: step.status === 'error' ? '#FF5252' : step.status === 'warn' ? '#FF8F00' : '#0F172A',
                  }}>
                    {step.value}
                  </div>
                )}
                {step.meta && Object.keys(step.meta).length > 0 && (
                  <div style={{
                    marginTop: 8, padding: '6px 10px',
                    background: 'rgba(0,0,0,0.03)', borderRadius: 6,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px',
                  }}>
                    {Object.entries(step.meta).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 10, color: '#64748B' }}>
                        <span style={{ color: '#475569' }}>{k}: </span>
                        <span style={{ color: '#64748B', fontFamily: 'monospace' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Delta tooltip cell ───────────────────────────────────────────────────────
// For price_mismatch lines: hover reveals a breakdown popover with a quick
// "Map to surcharge" shortcut so the operator doesn't have to open the full
// Resolve drawer just to identify what a carrier surcharge is.
function DeltaCell({ line, onResolveAsSurcharge }) {
  const [tooltipPos, setTooltipPos] = useState(null);
  const ref = useRef(null);

  const delta    = parseFloat(line.delta           || 0);
  const carrier  = parseFloat(line.carrier_amount  || 0);
  const expected = parseFloat(line.expected_amount || 0);

  if (line.delta == null) return <span style={{ color: '#64748B' }}>—</span>;

  const isPriceMismatch = line.unmatched_reason === 'price_mismatch';
  const isPositive = delta > 0.01;
  const color = isPositive ? '#FF5252' : delta < -0.01 ? '#00C853' : '#475569';

  function handleMouseEnter() {
    if (!isPriceMismatch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
  }

  return (
    <>
      <span
        ref={ref}
        style={{ color, fontWeight: 600, cursor: isPriceMismatch ? 'help' : 'default', display: 'inline-block' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipPos(null)}
      >
        {delta > 0 ? '+' : ''}£{delta.toFixed(2)}
      </span>

      {tooltipPos && createPortal(
        <div
          style={{
            position: 'fixed',
            top:  tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-50%, calc(-100% - 10px))',
            zIndex: 9999,
            background: '#0D1117',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 8, padding: '12px 14px', width: 230,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            pointerEvents: 'all',
          }}
          onMouseEnter={() => {/* keep visible */}}
          onMouseLeave={() => setTooltipPos(null)}
        >
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 10, height: 10, background: '#0D1117',
            borderRight: '1px solid rgba(0,0,0,0.12)',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
            transform: 'translateX(-50%) rotate(45deg)',
          }} />

          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Price Mismatch
          </div>

          {/* Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#64748B' }}>Carrier charged</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>£{carrier.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#64748B' }}>Expected</span>
              <span style={{ color: '#64748B' }}>£{expected.toFixed(2)}</span>
            </div>
            <div style={{
              borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 5,
              display: 'flex', justifyContent: 'space-between', fontSize: 11,
            }}>
              <span style={{ color: '#64748B' }}>{isPositive ? 'Carrier surplus' : 'Carrier deficit'}</span>
              <span style={{ color, fontWeight: 700 }}>{delta > 0 ? '+' : ''}£{delta.toFixed(2)}</span>
            </div>
          </div>

          {/* Show raw CSV column values — only those close to the delta */}
          {(() => {
            const rawCols = line.correction_metadata?.raw_col_values || {};
            const absDelta = Math.abs(delta);
            // Sort all entries by proximity to the delta, closest first.
            // Only show entries within 20% of the delta (or ±£0.10, whichever is larger)
            // so that unrelated numeric columns (overhead charges already in cost_price,
            // etc.) don't create noise.
            const tolerance = Math.max(absDelta * 0.20, 0.10);
            const relevant = Object.entries(rawCols)
              .filter(([, v]) => v > 0)
              .map(([col, amt]) => ({ col, amt, diff: Math.abs(amt - absDelta) }))
              .filter(e => e.diff <= tolerance)
              .sort((a, b) => a.diff - b.diff);

            if (!relevant.length) return (
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 10, lineHeight: 1.5 }}>
                No CSV column closely matches this delta — may be a relabel, credit, zone correction, or a column not yet in the profile.
              </div>
            );
            return (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Likely source column{relevant.length > 1 ? 's' : ''}
                </div>
                {relevant.map(({ col, amt, diff }) => {
                  const isExact = diff < 0.02;
                  return (
                    <div key={col} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 11, padding: '3px 6px', borderRadius: 4, marginBottom: 2,
                      background: isExact ? 'rgba(0,200,83,0.08)' : 'rgba(0,0,0,0.03)',
                      border: isExact ? '1px solid rgba(0,200,83,0.2)' : '1px solid rgba(0,0,0,0.06)',
                    }}>
                      <span style={{ color: isExact ? '#0F172A' : '#64748B', fontWeight: isExact ? 700 : 400 }}>
                        {isExact && <span style={{ color: '#00C853', marginRight: 4 }}>✓</span>}
                        {col}
                      </span>
                      <span style={{ color: isExact ? '#00C853' : '#64748B', fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>
                        £{parseFloat(amt).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <button
            onClick={() => { setTooltipPos(null); onResolveAsSurcharge(line); }}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
              background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.35)',
              color: '#00C853', fontSize: 11, fontWeight: 700,
            }}
          >
            Map to surcharge →
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Lines table ──────────────────────────────────────────────────────────────
function exportLinesToCSV(lines, filename) {
  const esc = v => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = [
    'Tracking Number', 'Service (Raw)', 'Service', 'Customer',
    'Type', 'Carrier £', 'Expected £', 'Delta £',
    'Status', 'Reason', 'Corrected By',
    'Postcode', 'Shipment Date', 'Parcels', 'Account No',
  ];
  const rows = lines.map(l => [
    l.tracking_number          || '',
    l.raw_service_code         || '',
    l.service_name             || '',
    l.customer_name            || '',
    l.charge_type              || 'base',
    l.carrier_amount  != null  ? parseFloat(l.carrier_amount).toFixed(2)  : '',
    l.expected_amount != null  ? parseFloat(l.expected_amount).toFixed(2) : '',
    l.delta           != null  ? parseFloat(l.delta).toFixed(2)           : '',
    l.status                   || '',
    l.unmatched_reason         || '',
    l.corrected_by             || '',
    l.ship_to_postcode         || '',
    l.shipment_date ? new Date(l.shipment_date).toLocaleDateString('en-GB') : '',
    l.parcel_count             || '',
    l.carrier_account_no       || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// ─── Re-open button ───────────────────────────────────────────────────────────
function ReopenButton({ lineId, runId }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/reconciliation/runs/${runId}/lines/${lineId}/reopen`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-lines', runId] });
      queryClient.invalidateQueries({ queryKey: ['recon-run', runId] });
      setConfirming(false);
    },
  });

  if (confirming) {
    return (
      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          style={{ ...btnRed, padding: '4px 8px', fontSize: 10 }}
          onClick={() => mutate()}
          disabled={isPending}
        >
          {isPending ? '…' : 'Confirm re-open'}
        </button>
        <button
          style={{ ...btnGhost, padding: '4px 8px', fontSize: 10 }}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      title="Revert this correction back to unmatched so it can be resolved again"
      style={{ ...btnGhost, padding: '4px 8px', fontSize: 10 }}
      onClick={() => setConfirming(true)}
    >
      Re-open
    </button>
  );
}

function LinesTable({ lines, showResolve, onResolve, onResolveAsSurcharge, onRaiseQuery, runId, courierId, exportFilename }) {
  const [traceLine,      setTraceLine]      = useState(null);
  const [surchargeFilter, setSurchargeFilter] = useState('all'); // 'all' | 'freight' | surcharge_id

  // Load surcharges for this carrier so CorrectionDetail can show names next to amounts.
  // Keyed by surcharge UUID so correction_metadata.col_surcharges can look them up.
  const { data: surcharges = [] } = useQuery({
    queryKey: ['recon-surcharges', courierId],
    queryFn:  () => api.get(`/reconciliation/surcharges?carrier_id=${courierId}`).then(r => r.data),
    enabled:  !!courierId,
    staleTime: 5 * 60 * 1000,
  });
  const surchargeLookup = Object.fromEntries(surcharges.map(s => [String(s.id), s]));

  // Build list of surcharge types present in this set of lines (for filter chips).
  const surchargeTypes = [];
  const seen = new Set();
  for (const l of lines) {
    if (l.surcharge_id && !seen.has(l.surcharge_id)) {
      seen.add(l.surcharge_id);
      surchargeTypes.push({ id: String(l.surcharge_id), name: l.surcharge_name || l.raw_service_code || 'Surcharge' });
    }
  }

  // Apply filter.
  const filteredLines = surchargeFilter === 'all'     ? lines
    : surchargeFilter === 'freight' ? lines.filter(l => !l.surcharge_id)
    : lines.filter(l => String(l.surcharge_id) === surchargeFilter);

  const pillBase = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', userSelect: 'none', transition: 'all 0.1s' };
  const pill = (active, color = '#79AAFF') => ({
    ...pillBase,
    background: active ? `${color}22` : 'transparent',
    borderColor: active ? `${color}66` : 'rgba(0,0,0,0.08)',
    color:       active ? color        : '#475569',
  });

  return (
    <div>
      {/* Toolbar: surcharge filter (when present) + CSV export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 4 }}>
        {surchargeTypes.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Show</span>
            <span style={pill(surchargeFilter === 'all')} onClick={() => setSurchargeFilter('all')}>All lines</span>
            <span style={pill(surchargeFilter === 'freight', '#00C853')} onClick={() => setSurchargeFilter('freight')}>Freight only</span>
            {surchargeTypes.map(s => (
              <span key={s.id} style={pill(surchargeFilter === s.id, '#00BCD4')} onClick={() => setSurchargeFilter(s.id)}>
                {s.name}
              </span>
            ))}
            {surchargeFilter !== 'all' && (
              <span style={{ fontSize: 10, color: '#64748B', marginLeft: 6 }}>
                {filteredLines.length} line{filteredLines.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 10, color: '#64748B' }}>{filteredLines.length} line{filteredLines.length !== 1 ? 's' : ''}</span>
        )}
        <button
          style={{ ...btnGhost, padding: '4px 10px', fontSize: 11 }}
          onClick={() => exportLinesToCSV(filteredLines, exportFilename || 'reconciliation.csv')}
          title="Download visible lines as CSV"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {['Tracking', 'Service (raw)', 'Service', 'Customer', 'Type', 'Carrier £', 'Expected £', 'Billed kg', 'Delta £', 'Status', 'Reason', ''].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredLines.map(line => (
            <tr key={line.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
              <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: '#64748B', fontSize: 10 }}>
                {line.aged && <span title='Aged' style={{ color: '#FF5252', marginRight: 4 }}>⚠</span>}
                {line.tracking_number || '—'}
              </td>
              <td style={{ padding: '9px 10px', color: '#79AAFF', fontFamily: 'monospace', fontSize: 10 }}>{line.raw_service_code || '—'}</td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>
                {line.service_name || (
                  line.suggested_service_name
                    ? <span style={{ color: '#79AAFF', fontStyle: 'italic' }}>
                        ✦ {line.suggested_service_name}
                      </span>
                    : '—'
                )}
              </td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>{line.customer_name || '—'}</td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>{line.charge_type || 'base'}</td>
              <td style={{ padding: '9px 10px', color: '#0F172A', fontWeight: 600 }}>
                {line.carrier_amount != null ? `£${parseFloat(line.carrier_amount).toFixed(2)}` : '—'}
              </td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>
                {line.expected_amount != null ? `£${parseFloat(line.expected_amount).toFixed(2)}` : '—'}
              </td>
              <td style={{ padding: '9px 10px' }}>
                {line.carrier_billed_weight_kg != null ? (() => {
                  const billed   = parseFloat(line.carrier_billed_weight_kg);
                  const declared = parseFloat(line.declared_weight_kg ?? line.weight_charged_kg ?? 0);
                  const diff     = declared > 0 ? billed - declared : 0;
                  const flagged  = diff > 0.01; // carrier billed heavier than declared
                  return (
                    <span title={flagged ? `Declared ${declared.toFixed(2)}kg · billed ${billed.toFixed(2)}kg` : `${billed.toFixed(2)}kg`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontWeight: flagged ? 700 : 400,
                      color: flagged ? '#92400E' : '#475569',
                      background: flagged ? '#FEF3C7' : 'transparent',
                      padding: flagged ? '1px 5px' : 0,
                      borderRadius: 4,
                      fontSize: 11,
                    }}>
                      {flagged && <span style={{ fontSize: 9 }}>⚠</span>}
                      {billed.toFixed(2)}kg
                      {flagged && <span style={{ fontSize: 9, color: '#92400E' }}>+{diff.toFixed(2)}</span>}
                    </span>
                  );
                })() : '—'}
              </td>
              <td style={{ padding: '9px 10px', fontWeight: 600 }}>
                <DeltaCell
                  line={line}
                  onResolveAsSurcharge={onResolveAsSurcharge || (() => {})}
                />
              </td>
              <td style={{ padding: '9px 10px' }}><StatusBadge status={line.status} /></td>
              <td style={{ padding: '9px 10px' }}>
                {line.status === 'corrected' && line.corrected_by
                  ? <CorrectionDetail line={line} surchargeLookup={surchargeLookup} />
                  : <ReasonLabel reason={line.unmatched_reason} correctedBy={line.corrected_by} />
                }
              </td>
              <td style={{ padding: '9px 10px' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {showResolve && (line.status === 'unmatched' || line.status === 'warning') && (
                    <button style={{ ...btnGhost, padding: '4px 8px', fontSize: 10 }} onClick={() => onResolve(line)}>
                      Resolve
                    </button>
                  )}
                  {line.status === 'corrected' && line.corrected_by === 'human' && runId && (
                    <ReopenButton lineId={line.id} runId={runId} />
                  )}
                  {onRaiseQuery && line.status === 'unmatched' && (
                    <button
                      title="Raise a query with the carrier about this line"
                      style={{ ...btnRed, padding: '4px 8px', fontSize: 10 }}
                      onClick={() => onRaiseQuery(line)}
                    >
                      Raise Query
                    </button>
                  )}
                  {runId && (
                    <button
                      title="Show reconciliation decision trace"
                      style={{ ...btnGhost, padding: '4px 7px', fontSize: 10 }}
                      onClick={() => setTraceLine(line)}
                    >
                      <Info size={11} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredLines.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748B', fontSize: 12, padding: '30px 0' }}>
          {surchargeFilter === 'all' ? 'No lines in this category' : 'No lines match this filter'}
        </div>
      )}
    </div>{/* end overflowX wrapper */}
      {traceLine && runId && (
        <TraceModal
          runId={runId}
          lineId={traceLine.id}
          trackingNumber={traceLine.tracking_number}
          onClose={() => setTraceLine(null)}
        />
      )}
    </div>
  );
}

// ─── Customer summary panel (post-finalization) ───────────────────────────────
// ─── Customer preview — line-level drill-down ─────────────────────────────────
function CustomerLinesDrilldown({ runId, customerId }) {
  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['recon-preview-lines', runId, customerId],
    queryFn:  () => api.get(`/reconciliation/runs/${runId}/customers/preview/lines`, {
      // Pass 'null' string explicitly so the backend knows to filter for unattributed lines,
      // rather than omitting the param (which would return all lines with no filter).
      params: { customer_id: customerId ?? 'null' },
    }).then(r => r.data),
    staleTime: 30_000,
  });

  if (isLoading) return (
    <tr><td colSpan={9} style={{ padding: '12px 16px', color: '#64748B', fontSize: 11 }}>Loading lines…</td></tr>
  );
  if (!lines.length) return (
    <tr><td colSpan={9} style={{ padding: '12px 16px', color: '#64748B', fontSize: 11 }}>No lines found</td></tr>
  );

  const thStyle = { padding: '6px 10px', textAlign: 'left', color: '#475569', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F1F5F9' };
  const tdStyle = { padding: '7px 10px', fontSize: 11, borderBottom: '1px solid rgba(0,0,0,0.05)', color: '#0F172A' };

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, background: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <th style={thStyle}>Tracking</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Service</th>
              <th style={thStyle}>Parcels</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Our Cost</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Sell Base</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Fuel</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Surcharges</th>
              <th style={{ ...thStyle, textAlign: 'right', color: '#00C853' }}>Total Sell</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Margin</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(l => {
              const cost      = parseFloat(l.cost_total || 0);
              const sell      = parseFloat(l.sell_total || 0);
              const margin    = sell - cost;
              const hasCorrectedSurcharge = !!l.has_warning_correction;
              const rowBg     = hasCorrectedSurcharge ? 'rgba(255,143,0,0.04)' : 'transparent';
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)', background: rowBg }}>
                  <td style={{ ...tdStyle, color: '#79AAFF', fontFamily: 'monospace', fontSize: 10 }}>
                    {l.tracking_number || '—'}
                  </td>
                  <td style={{ ...tdStyle, color: '#64748B' }}>{l.shipment_date ? new Date(l.shipment_date).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ ...tdStyle, color: '#64748B' }}>
                    {l.service_name || '—'}
                    {hasCorrectedSurcharge && (
                      <span
                        title={`Surcharge added: ${l.corrected_surcharge_names || 'manual correction'}`}
                        style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#FF8F00', background: 'rgba(255,143,0,0.15)', border: '1px solid rgba(255,143,0,0.4)', borderRadius: 3, padding: '1px 5px', verticalAlign: 'middle', cursor: 'help' }}
                      >
                        +SURCHARGE
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: '#64748B' }}>{l.parcel_count || 1}</td>
                  <td style={{ ...tdStyle, color: '#64748B', textAlign: 'right' }}>£{cost.toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: '#64748B', textAlign: 'right' }}>£{parseFloat(l.sell_base || 0).toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: '#64748B', textAlign: 'right' }}>£{parseFloat(l.sell_fuel || 0).toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: hasCorrectedSurcharge ? '#FF8F00' : '#64748B', textAlign: 'right', fontWeight: hasCorrectedSurcharge ? 700 : 400 }}>£{parseFloat(l.sell_surcharge || 0).toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: '#00C853', fontWeight: 700, textAlign: 'right' }}>£{sell.toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: margin >= 0 ? '#00C853' : '#FF5252', fontWeight: 600, textAlign: 'right' }}>£{margin.toFixed(2)}</td>
                  <td style={{ ...tdStyle }}><StatusBadge status={l.status} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <td colSpan={4} style={{ ...tdStyle, color: '#64748B', fontWeight: 700, fontSize: 10 }}>SUBTOTAL ({lines.length} lines)</td>
              <td style={{ ...tdStyle, color: '#64748B', fontWeight: 700, textAlign: 'right' }}>
                £{lines.reduce((s, l) => s + parseFloat(l.cost_total || 0), 0).toFixed(2)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }} />
              <td style={{ ...tdStyle, textAlign: 'right' }} />
              <td style={{ ...tdStyle, textAlign: 'right' }} />
              <td style={{ ...tdStyle, color: '#00C853', fontWeight: 800, textAlign: 'right' }}>
                £{lines.reduce((s, l) => s + parseFloat(l.sell_total || 0), 0).toFixed(2)}
              </td>
              <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'right', color: (() => { const m = lines.reduce((s, l) => s + parseFloat(l.sell_total || 0) - parseFloat(l.cost_total || 0), 0); return m >= 0 ? '#00C853' : '#FF5252'; })() }}>
                £{lines.reduce((s, l) => s + parseFloat(l.sell_total || 0) - parseFloat(l.cost_total || 0), 0).toFixed(2)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </td>
    </tr>
  );
}

// ─── Customer preview panel (pre-finalization) ────────────────────────────────
function CustomerPreviewPanel({ runId }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [repairing,  setRepairing]  = useState(false);
  const [repairMsg,  setRepairMsg]  = useState(null);

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ['recon-customers-preview', runId],
    queryFn:  () => api.get(`/reconciliation/runs/${runId}/customers/preview`).then(r => r.data),
    staleTime: 30_000,
  });

  async function handleRepairAndRefresh() {
    setRepairing(true);
    setRepairMsg(null);
    try {
      const res = await api.post('/reconciliation/backfill-carrier-direct-surcharges');
      const { found, repriced, processed, errors } = res.data;
      setRepairMsg(
        repriced > 0 || processed > 0
          ? `✓ ${repriced} charge(s) repriced · ${processed} surcharge(s) inserted`
          : found === 0
            ? '✓ No missing surcharges found — data already correct'
            : errors > 0
              ? `⚠ ${errors} error(s) — check server logs`
              : '✓ Checked — no changes needed'
      );
      await refetch();
    } catch (err) {
      setRepairMsg(`✗ ${err.response?.data?.error || err.message}`);
    } finally {
      setRepairing(false);
    }
  }

  if (isLoading) return <div style={{ color: '#64748B', fontSize: 12, padding: 20 }}>Loading preview…</div>;
  if (!customers.length) return (
    <div style={{ ...card, color: '#64748B', fontSize: 12, textAlign: 'center', padding: 30 }}>
      No matched or corrected lines yet — process lines first to see a billing preview
    </div>
  );

  const totalSell   = customers.reduce((s, c) => s + parseFloat(c.total_sell     || 0), 0);
  const totalCost   = customers.reduce((s, c) => s + parseFloat(c.total_our_cost || 0), 0);
  const totalMargin = totalSell - totalCost;

  function toggleExpand(customerId) {
    setExpandedId(prev => prev === customerId ? null : customerId);
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Customer Billing Preview</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {customers.length} customer{customers.length !== 1 ? 's' : ''} · {customers.reduce((s, c) => s + (c.line_count || 0), 0)} shipments · Click a row to see line detail · Finalise to push to Xero
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {repairMsg && (
            <span style={{
              fontSize: 11, color: repairMsg.startsWith('✓') ? '#00C853' : repairMsg.startsWith('⚠') ? '#FFB300' : '#FF5252',
              fontWeight: 600,
            }}>
              {repairMsg}
            </span>
          )}
          <button
            onClick={handleRepairAndRefresh}
            disabled={repairing}
            title="Re-price and insert missing fuel &amp; surcharges for carrier-direct shipments, then refresh this preview"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, cursor: repairing ? 'default' : 'pointer',
              background: repairing ? 'rgba(0,0,0,0.04)' : 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: repairing ? '#94A3B8' : '#3B82F6',
              borderRadius: 5, padding: '5px 10px',
            }}
          >
            {repairing ? '⟳ Repairing…' : '⟳ Repair & Refresh'}
          </button>
          <span style={{ fontSize: 11, color: '#FFB300', fontWeight: 600 }}>
            ⏳ Preview — not yet finalised
          </span>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <th style={{ width: 24, padding: '7px 6px' }} />
            {['Customer', 'Shipments', 'Sell Base', 'Fuel', 'Surcharges', 'Total Sell', 'Our Cost', 'Margin', 'CSV'].map(h => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map(c => {
            const sell      = parseFloat(c.total_sell     || 0);
            const cost      = parseFloat(c.total_our_cost || 0);
            const margin    = sell - cost;
            const expanded  = expandedId === (c.customer_id || 'null');
            const rowKey    = c.customer_id || 'null';
            return (
              <>
                <tr
                  key={rowKey}
                  onClick={() => toggleExpand(rowKey)}
                  style={{
                    borderBottom: expanded ? 'none' : '1px solid rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    background: expanded ? 'rgba(0,0,0,0.03)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '9px 6px', color: '#64748B', textAlign: 'center', fontSize: 10 }}>
                    {expanded ? '▾' : '▸'}
                  </td>
                  <td style={{ padding: '9px 10px', color: '#0F172A', fontWeight: 600 }}>{c.customer_name || '—'}</td>
                  <td style={{ padding: '9px 10px', color: '#64748B' }}>{c.line_count}</td>
                  <td style={{ padding: '9px 10px', color: '#64748B' }}>£{parseFloat(c.total_base || 0).toFixed(2)}</td>
                  <td style={{ padding: '9px 10px', color: '#64748B' }}>£{parseFloat(c.total_fuel || 0).toFixed(2)}</td>
                  <td style={{ padding: '9px 10px', color: '#64748B' }}>£{(parseFloat(c.total_surcharge || 0) + parseFloat(c.total_recon_surcharge || 0)).toFixed(2)}</td>
                  <td style={{ padding: '9px 10px', color: '#00C853', fontWeight: 700 }}>£{sell.toFixed(2)}</td>
                  <td style={{ padding: '9px 10px', color: '#64748B' }}>£{cost.toFixed(2)}</td>
                  <td style={{ padding: '9px 10px', color: margin >= 0 ? '#00C853' : '#FF5252', fontWeight: 600 }}>
                    £{margin.toFixed(2)}
                  </td>
                  <td style={{ padding: '9px 6px' }} onClick={e => e.stopPropagation()}>
                    <a
                      href={`/api/reconciliation/runs/${runId}/export/preview-csv?customer_id=${c.customer_id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 10, fontWeight: 600, color: '#58A6FF',
                        background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.25)',
                        borderRadius: 4, padding: '3px 7px', textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ↓ CSV
                    </a>
                  </td>
                </tr>
                {expanded && (
                  <CustomerLinesDrilldown
                    key={`lines-${rowKey}`}
                    runId={runId}
                    customerId={c.customer_id}
                  />
                )}
              </>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid rgba(0,0,0,0.08)' }}>
            <td />
            <td style={{ padding: '9px 10px', color: '#64748B', fontSize: 12, fontWeight: 700 }}>TOTAL</td>
            <td style={{ padding: '9px 10px', color: '#64748B' }}>{customers.reduce((s, c) => s + (c.line_count || 0), 0)}</td>
            <td colSpan={3} />
            <td style={{ padding: '9px 10px', color: '#00C853', fontWeight: 800, fontSize: 14 }}>£{totalSell.toFixed(2)}</td>
            <td style={{ padding: '9px 10px', color: '#64748B', fontWeight: 700 }}>£{totalCost.toFixed(2)}</td>
            <td style={{ padding: '9px 10px', color: totalMargin >= 0 ? '#00C853' : '#FF5252', fontWeight: 800 }}>£{totalMargin.toFixed(2)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function CustomerSummaryPanel({ runId, run }) {
  const qc = useQueryClient();
  const [pushing,    setPushing]    = useState(null); // customer_id being pushed
  const [refreshing, setRefreshing] = useState(null); // customer_id being re-snapshotted

  const { data: customers = [], refetch } = useQuery({
    queryKey: ['recon-customers', runId],
    queryFn:  () => api.get(`/reconciliation/runs/${runId}/customers`).then(r => r.data),
    enabled:  !!run?.finalized,
  });

  async function handleRefreshSnapshot(customerId, customerName) {
    if (!window.confirm(
      `Refresh billing snapshot for ${customerName}?\n\nThis deletes and re-builds their finalized billing lines from the current state of the charges table. Use this after running charge corrections (e.g. cancelled surcharges, repriced parcels).`
    )) return;
    setRefreshing(customerId);
    try {
      const res = await api.post(`/reconciliation/runs/${runId}/re-snapshot-customer/${customerId}`);
      refetch();
      alert(`Snapshot refreshed: ${res.data.deleted} line(s) replaced with ${res.data.inserted} fresh line(s).`);
    } catch (err) {
      alert(err.response?.data?.error || 'Refresh failed — check server logs');
    } finally {
      setRefreshing(null);
    }
  }

  async function handleXeroPush(customerId) {
    setPushing(customerId);
    try {
      const res = await api.post(`/xero/reconciliation-runs/${runId}/push`, { customer_id: customerId });
      const { pushed = [], skipped = [], errors = [] } = res.data;
      refetch();
      if (pushed.length > 0) {
        // Success — no alert needed, UI will update to show ✓ Pushed
      } else if (errors.length > 0) {
        alert(`Xero push failed: ${errors[0]?.error || 'Unknown error'}`);
      } else if (skipped.length > 0) {
        alert(`Not pushed — customer is not linked to a Xero contact.\nGo to Settings → Xero to link them.`);
      } else {
        alert('Push returned no result — check server logs.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Xero push failed');
    } finally {
      setPushing(null);
    }
  }

  async function handlePushAll() {
    setPushing('all');
    try {
      const res = await api.post(`/xero/reconciliation-runs/${runId}/push`);
      const { pushed, skipped, errors } = res.data;
      refetch();
      const msg = [
        pushed.length  ? `✓ ${pushed.length} invoice(s) pushed`   : null,
        skipped.length ? `— ${skipped.length} skipped (not linked to Xero)` : null,
        errors.length  ? `✗ ${errors.length} error(s)` : null,
      ].filter(Boolean).join('\n');
      alert(msg || 'Done');
    } catch (err) {
      alert(err.response?.data?.error || 'Xero push failed');
    } finally {
      setPushing(null);
    }
  }

  function handleCSV(customerId) {
    window.open(`/api/reconciliation/runs/${runId}/export/csv?customer_id=${customerId}`, '_blank');
  }

  if (!customers.length) return (
    <div style={{ ...card, color: '#64748B', fontSize: 12, textAlign: 'center', padding: 30 }}>
      No finalized billing lines found
    </div>
  );

  const unlinkedCount = customers.filter(c => !c.xero_linked).length;
  const allPushed     = customers.every(c => c.xero_pushed_count > 0);

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Customer Billing Summary</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {customers.length} customers · {customers.reduce((s, c) => s + c.line_count, 0)} shipments
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unlinkedCount > 0 && (
            <span style={{ fontSize: 11, color: '#FFB300', alignSelf: 'center' }}>
              ⚠ {unlinkedCount} customer{unlinkedCount > 1 ? 's' : ''} not linked to Xero
            </span>
          )}
          {!allPushed && (
            <button
              style={{ ...btnGreen, opacity: pushing === 'all' ? 0.7 : 1 }}
              onClick={handlePushAll}
              disabled={!!pushing}
            >
              {pushing === 'all' ? <RefreshCw size={13} /> : <Send size={13} />}
              Push All to Xero
            </button>
          )}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {['Customer', 'Shipments', 'Base', 'Fuel', 'Surcharges', 'Total Sell', 'Margin', 'Xero', 'CSV', ''].map(h => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr
              key={c.customer_id}
              style={{
                borderBottom: '1px solid rgba(0,0,0,0.03)',
                background: c.xero_pushed_count > 0 ? 'rgba(0,200,83,0.05)' : 'transparent',
              }}
            >
              <td style={{ padding: '9px 10px', color: '#0F172A', fontWeight: 600 }}>{c.customer_name || '—'}</td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>{c.line_count}</td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>£{parseFloat(c.total_base || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>£{parseFloat(c.total_fuel || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>£{parseFloat(c.total_surcharge || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: '#00C853', fontWeight: 700 }}>£{parseFloat(c.total_sell || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: parseFloat(c.total_margin || 0) > 0 ? '#00C853' : '#FF5252' }}>
                £{parseFloat(c.total_margin || 0).toFixed(2)}
              </td>
              <td style={{ padding: '9px 10px' }}>
                {c.xero_linked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.xero_pushed_count > 0 && (
                      <span style={{ color: '#00C853', fontSize: 11, fontWeight: 700 }}>✓ Pushed</span>
                    )}
                    <button
                      style={{ ...btnGhost, padding: '3px 8px', fontSize: 10, opacity: pushing === c.customer_id ? 0.7 : 1 }}
                      onClick={() => handleXeroPush(c.customer_id)}
                      disabled={!!pushing}
                      title={c.xero_pushed_count > 0 ? 'Re-push to Xero (void the existing invoice in Xero first)' : 'Push to Xero'}
                    >
                      {pushing === c.customer_id ? <RefreshCw size={11} /> : <Send size={11} />}
                      {c.xero_pushed_count > 0 ? 'Re-push' : 'Push'}
                    </button>
                  </div>
                ) : (
                  <span style={{ color: '#64748B', fontSize: 10 }}>Not linked</span>
                )}
              </td>
              <td style={{ padding: '9px 10px' }}>
                <button
                  style={{ ...btnGhost, padding: '3px 8px', fontSize: 10 }}
                  onClick={() => handleCSV(c.customer_id)}
                  title='Download itemized CSV'
                >
                  <Download size={11} />CSV
                </button>
              </td>
              <td style={{ padding: '9px 10px', color: '#64748B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {c.xero_push_error && <span style={{ color: '#FF5252', fontSize: 10 }} title={c.xero_push_error}>⚠ Error</span>}
                  <button
                    style={{ ...btnGhost, padding: '3px 8px', fontSize: 10, opacity: refreshing === c.customer_id ? 0.6 : 1 }}
                    onClick={() => handleRefreshSnapshot(c.customer_id, c.customer_name)}
                    disabled={!!pushing || !!refreshing}
                    title="Refresh billing snapshot — re-builds from current charges (use after charge corrections)"
                  >
                    <RefreshCw size={11} />
                    {refreshing === c.customer_id ? '…' : 'Refresh'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid rgba(0,0,0,0.08)' }}>
            <td colSpan={5} style={{ padding: '9px 10px', color: '#64748B', fontSize: 12, fontWeight: 700 }}>TOTAL</td>
            <td style={{ padding: '9px 10px', color: '#00C853', fontWeight: 800, fontSize: 14 }}>
              £{customers.reduce((s, c) => s + parseFloat(c.total_sell || 0), 0).toFixed(2)}
            </td>
            <td style={{ padding: '9px 10px', color: '#00C853', fontWeight: 700 }}>
              £{customers.reduce((s, c) => s + parseFloat(c.total_margin || 0), 0).toFixed(2)}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Raise Query modal ───────────────────────────────────────────────────────
// Pre-fills a new courier query from a reconciliation line.
// query_type is inferred from unmatched_reason but the operator can change it.
const QUERY_TYPE_OPTS = [
  { value: 'parcel_count_overbill',  label: 'Parcel count overbill' },
  { value: 'consolidation_mismatch', label: 'Consolidation mismatch' },
  { value: 'rate_dispute',           label: 'Rate dispute' },
  { value: 'unrecognised_charge',    label: 'Unrecognised charge' },
  { value: 'other',                  label: 'Other' },
];

function inferQueryType(reason) {
  if (reason === 'parcel_count_mismatch')  return 'parcel_count_overbill';
  if (reason === 'cancelled_unshipped')    return 'unrecognised_charge';
  if (reason === 'cancelled_shipped')      return 'unrecognised_charge';
  if (reason === 'unexplained_delta' || reason === 'aggregate_mismatch') return 'rate_dispute';
  return 'other';
}

function RaiseQueryModal({ line, runId, carrierId, invoiceRef, onClose, onRaised }) {
  const [queryType,   setQueryType]   = useState(inferQueryType(line.unmatched_reason));
  const [details,     setDetails]     = useState(() => {
    if (line.unmatched_reason === 'parcel_count_mismatch' && line.correction_metadata) {
      const m = line.correction_metadata;
      return `DPD invoiced ${m.invoice_parcel_count} parcel${m.invoice_parcel_count !== 1 ? 's' : ''} but booking was for ${m.booked_parcel_count} parcel${m.booked_parcel_count !== 1 ? 's' : ''}. Disputed amount: £${Math.abs(parseFloat(line.carrier_amount || 0) - parseFloat(line.expected_amount || 0)).toFixed(2)}.`;
    }
    if (line.unmatched_reason === 'cancelled_unshipped') {
      return `Tracking number ${line.tracking_number} was invoiced by DPD at £${parseFloat(line.carrier_amount || 0).toFixed(2)} but this booking was cancelled in our system and the parcel was never collected/despatched. Please credit this charge.`;
    }
    if (line.unmatched_reason === 'cancelled_shipped') {
      return `Tracking number ${line.tracking_number} was invoiced by DPD at £${parseFloat(line.carrier_amount || 0).toFixed(2)}. The booking was cancelled in our system but the parcel appears to have been despatched. Please confirm delivery status.`;
    }
    return '';
  });
  const [carrierRef,  setCarrierRef]  = useState('');
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState('');

  const disputed = (parseFloat(line.carrier_amount || 0) - parseFloat(line.expected_amount || 0)).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = {
        run_id:                runId,
        reconciliation_line_id: line.id,
        carrier_id:            carrierId,
        invoice_ref:           invoiceRef || null,
        tracking_number:       line.tracking_number || null,
        query_type:            queryType,
        carrier_charged:       parseFloat(line.carrier_amount) || null,
        expected_charged:      parseFloat(line.expected_amount) || null,
        details:               details.trim() || null,
        carrier_reference:     carrierRef.trim() || null,
        charge_ids:            line.charge_id ? [line.charge_id] : [],
      };
      await api.post('/reconciliation/queries', payload);
      onRaised();
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Failed to raise query');
    } finally {
      setSaving(false);
    }
  }

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modal = {
    background: '#0d1117', border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 12, padding: 24, width: 500, maxHeight: '90vh',
    overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Raise Carrier Query</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Log a dispute to follow up with the carrier</div>
          </div>
          <button style={{ ...btnGhost, padding: '4px 8px' }} onClick={onClose}><X size={14} /></button>
        </div>

        {/* Line summary */}
        <div style={{
          marginBottom: 20, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,82,82,0.06)', border: '1px solid rgba(255,82,82,0.2)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Tracking</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{line.tracking_number || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Carrier charged</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FF5252' }}>£{parseFloat(line.carrier_amount || 0).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Disputed</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFB300' }}>{parseFloat(disputed) > 0 ? '+' : ''}£{disputed}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Query type */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              QUERY TYPE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {QUERY_TYPE_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQueryType(opt.value)}
                  style={{
                    padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                    textAlign: 'left', fontSize: 11, fontWeight: 600,
                    background: queryType === opt.value ? 'rgba(255,179,0,0.12)' : 'rgba(0,0,0,0.03)',
                    border: queryType === opt.value ? '1px solid rgba(255,179,0,0.5)' : '1px solid rgba(0,0,0,0.08)',
                    color: queryType === opt.value ? '#FFB300' : '#666',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              DETAILS
            </label>
            <textarea
              style={{ ...inputSt, minHeight: 80, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              placeholder="Describe the discrepancy…"
              value={details}
              onChange={e => setDetails(e.target.value)}
            />
          </div>

          {/* Carrier ref (optional) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              CARRIER CASE REFERENCE <span style={{ color: '#64748B', fontWeight: 400 }}>(optional — add after raising with carrier)</span>
            </label>
            <input
              style={inputSt}
              placeholder="e.g. DPD case number"
              value={carrierRef}
              onChange={e => setCarrierRef(e.target.value)}
            />
          </div>

          {err && (
            <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 6, background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)', color: '#FF5252', fontSize: 12 }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" style={{ ...btnRed, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? <RefreshCw size={13} /> : null}
              {saving ? 'Saving…' : 'Raise Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Status badge for courier queries ────────────────────────────────────────
const QUERY_STATUS_CFG = {
  open:         { color: '#FFB300', bg: 'rgba(255,179,0,0.12)',  border: 'rgba(255,179,0,0.3)',  label: 'Open' },
  raised:       { color: '#79AAFF', bg: 'rgba(121,170,255,0.12)', border: 'rgba(121,170,255,0.3)', label: 'Raised' },
  acknowledged: { color: '#FF8F00', bg: 'rgba(255,143,0,0.12)',  border: 'rgba(255,143,0,0.3)',  label: 'Acknowledged' },
  credited:     { color: '#00C853', bg: 'rgba(0,200,83,0.12)',   border: 'rgba(0,200,83,0.3)',   label: 'Credited' },
  rejected:     { color: '#FF5252', bg: 'rgba(213,0,0,0.12)',    border: 'rgba(213,0,0,0.3)',    label: 'Rejected' },
  written_off:  { color: '#64748B',    bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.08)', label: 'Written off' },
};

function QueryStatusBadge({ status }) {
  const cfg = QUERY_STATUS_CFG[status] || { color: '#64748B', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.08)', label: status };
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 9999,
      fontSize: 10, fontWeight: 700,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Courier Queries panel ────────────────────────────────────────────────────
function CourierQueriesPanel({ runId, carrierId }) {
  const qc = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);
  const [editingId,  setEditingId]  = useState(null); // ID of query being edited inline
  const [editRef,    setEditRef]    = useState('');
  const [editCredit, setEditCredit] = useState('');
  const [editNotes,  setEditNotes]  = useState('');

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['courier-queries', runId],
    queryFn: () => api.get(`/reconciliation/queries`, { params: { run_id: runId, limit: 200 } }).then(r => r.data),
    staleTime: 30_000,
  });

  const queries = result?.queries || [];

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.patch(`/reconciliation/queries/${id}`, { status });
      qc.invalidateQueries({ queryKey: ['courier-queries', runId] });
    } finally {
      setUpdatingId(null);
    }
  }

  function startEdit(q) {
    setEditingId(q.id);
    setEditRef(q.carrier_reference || '');
    setEditCredit(q.credit_amount != null ? String(parseFloat(q.credit_amount).toFixed(2)) : '');
    setEditNotes(q.resolution_notes || '');
  }

  async function saveEdit(id) {
    setUpdatingId(id);
    try {
      await api.patch(`/reconciliation/queries/${id}`, {
        carrier_reference: editRef.trim() || null,
        credit_amount:     editCredit ? parseFloat(editCredit) : null,
        resolution_notes:  editNotes.trim() || null,
      });
      qc.invalidateQueries({ queryKey: ['courier-queries', runId] });
      setEditingId(null);
    } finally {
      setUpdatingId(null);
    }
  }

  if (isLoading) return <div style={{ color: '#64748B', fontSize: 12, padding: 20 }}>Loading queries…</div>;
  if (error) return <div style={{ color: '#FF5252', fontSize: 12, padding: 20 }}>Failed to load queries</div>;

  const totalDisputed = queries.reduce((s, q) => s + parseFloat(q.disputed_amount || 0), 0);
  const totalCredited = queries.reduce((s, q) => s + parseFloat(q.credit_amount || 0), 0);
  const activeCount   = queries.filter(q => !['credited','rejected','written_off'].includes(q.status)).length;

  return (
    <div style={card}>
      {/* Summary header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Carrier Queries</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            Disputes and queries raised with the carrier for this run
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: activeCount > 0 ? '#FFB300' : '#475569' }}>{activeCount}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total disputed</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FF5252' }}>£{totalDisputed.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Credited back</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: totalCredited > 0 ? '#00C853' : '#475569' }}>£{totalCredited.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {queries.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748B', fontSize: 12, padding: '30px 0' }}>
          No queries raised for this run yet. Use the Needs Review tab to raise a query against a specific line.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                {['Tracking', 'Type', 'Carrier £', 'Expected £', 'Disputed', 'Carrier Ref', 'Status', 'Raised', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queries.map(q => {
                const isEditing = editingId === q.id;
                const isUpdating = updatingId === q.id;
                const disputed = parseFloat(q.disputed_amount || 0);
                return (
                  <tr key={q.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: '#64748B', fontSize: 10 }}>{q.tracking_number || '—'}</td>
                    <td style={{ padding: '9px 10px', color: '#64748B' }}>
                      {QUERY_TYPE_OPTS.find(o => o.value === q.query_type)?.label || q.query_type}
                    </td>
                    <td style={{ padding: '9px 10px', color: '#0F172A', fontWeight: 600 }}>
                      {q.carrier_charged != null ? `£${parseFloat(q.carrier_charged).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '9px 10px', color: '#64748B' }}>
                      {q.expected_charged != null ? `£${parseFloat(q.expected_charged).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '9px 10px', fontWeight: 700, color: disputed > 0 ? '#FF5252' : '#00C853' }}>
                      {disputed > 0 ? '+' : ''}£{disputed.toFixed(2)}
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      {isEditing ? (
                        <input
                          style={{ ...inputSt, width: 120, padding: '3px 6px', fontSize: 10 }}
                          value={editRef}
                          onChange={e => setEditRef(e.target.value)}
                          placeholder="Carrier case #"
                        />
                      ) : (
                        <span style={{ color: q.carrier_reference ? '#0F172A' : '#333', fontFamily: q.carrier_reference ? 'monospace' : 'inherit', fontSize: 10 }}>
                          {q.carrier_reference || 'Not yet raised'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '9px 10px' }}><QueryStatusBadge status={q.status} /></td>
                    <td style={{ padding: '9px 10px', color: '#64748B', fontSize: 10 }}>
                      {q.raised_at ? new Date(q.raised_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ padding: '9px 6px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 4, flexDirection: 'column', minWidth: 200 }}>
                          <input
                            style={{ ...inputSt, padding: '3px 6px', fontSize: 10 }}
                            value={editCredit}
                            onChange={e => setEditCredit(e.target.value)}
                            placeholder="Credit amount £"
                            type="number" step="0.01"
                          />
                          <input
                            style={{ ...inputSt, padding: '3px 6px', fontSize: 10 }}
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            placeholder="Resolution notes"
                          />
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button style={{ ...btnGhost, padding: '3px 8px', fontSize: 10, flex: 1 }} onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                            <button style={{ ...btnGreen, padding: '3px 8px', fontSize: 10, flex: 1, opacity: isUpdating ? 0.7 : 1 }} onClick={() => saveEdit(q.id)} disabled={isUpdating}>
                              {isUpdating ? <RefreshCw size={10} /> : <Check size={10} />} Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Status progression buttons */}
                          {q.status === 'open' && (
                            <button
                              style={{ ...btnGhost, padding: '3px 8px', fontSize: 10, opacity: isUpdating ? 0.7 : 1 }}
                              onClick={() => updateStatus(q.id, 'raised')}
                              disabled={isUpdating}
                              title="Mark as raised with carrier"
                            >
                              <Send size={10} /> Raised
                            </button>
                          )}
                          {q.status === 'raised' && (
                            <button
                              style={{ ...btnGhost, padding: '3px 8px', fontSize: 10, opacity: isUpdating ? 0.7 : 1 }}
                              onClick={() => updateStatus(q.id, 'acknowledged')}
                              disabled={isUpdating}
                            >
                              <Check size={10} /> Acknowledged
                            </button>
                          )}
                          {q.status === 'acknowledged' && (
                            <>
                              <button
                                style={{ ...btnGreen, padding: '3px 8px', fontSize: 10, opacity: isUpdating ? 0.7 : 1 }}
                                onClick={() => updateStatus(q.id, 'credited')}
                                disabled={isUpdating}
                              >
                                <Check size={10} /> Credited
                              </button>
                              <button
                                style={{ ...btnRed, padding: '3px 8px', fontSize: 10, opacity: isUpdating ? 0.7 : 1 }}
                                onClick={() => updateStatus(q.id, 'rejected')}
                                disabled={isUpdating}
                              >
                                <X size={10} /> Rejected
                              </button>
                            </>
                          )}
                          {!['credited','rejected','written_off'].includes(q.status) && (
                            <button
                              style={{ ...btnGhost, padding: '3px 7px', fontSize: 10 }}
                              onClick={() => startEdit(q)}
                              title="Edit carrier reference or credit amount"
                            >
                              ✎
                            </button>
                          )}
                          {!['credited','rejected','written_off'].includes(q.status) && (
                            <button
                              style={{ ...btnGhost, padding: '3px 8px', fontSize: 10, opacity: isUpdating ? 0.7 : 1 }}
                              onClick={() => updateStatus(q.id, 'written_off')}
                              disabled={isUpdating}
                              title="Write off — not worth pursuing"
                            >
                              Write off
                            </button>
                          )}
                          {/* Show credit amount if credited */}
                          {q.status === 'credited' && q.credit_amount != null && (
                            <span style={{ fontSize: 10, color: '#00C853', fontWeight: 700 }}>
                              ✓ £{parseFloat(q.credit_amount).toFixed(2)} credited
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── BulkSurchargeResolver ────────────────────────────────────────────────────
// When the Needs Review tab has price-mismatch lines that are all the same
// surcharge type, this banner lets the operator pick the surcharge once and
// apply it to every line in one click.

function BulkSurchargeResolver({ unmatchedLines, runId, courierId, onResolved }) {
  // Only show for lines that have a carrier delta (price mismatch / weight corrected)
  const deltaLines = unmatchedLines.filter(l =>
    ['unexplained_delta', 'weight_correction', 'parcel_count_mismatch'].includes(l.unmatched_reason)
    || (l.delta && parseFloat(l.delta) !== 0)
  );

  const [open,        setOpen]        = useState(false);
  const [surchargeId, setSurchargeId] = useState('');
  const [applying,    setApplying]    = useState(false);
  const [done,        setDone]        = useState(null);   // { resolved, skipped }
  const [error,       setError]       = useState('');

  const { data: surcharges = [] } = useQuery({
    queryKey: ['recon-surcharges', courierId],
    queryFn:  () => api.get(`/reconciliation/surcharges?carrier_id=${courierId}`).then(r => r.data),
    enabled:  !!courierId && open,
  });

  if (deltaLines.length === 0) return null;

  async function applyAll() {
    if (!surchargeId) { setError('Select a surcharge first'); return; }
    setApplying(true);
    setError('');
    try {
      const res = await api.post(`/reconciliation/runs/${runId}/bulk-resolve-as-surcharge`, {
        surcharge_id: surchargeId,
      });
      setDone(res.data);
      onResolved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setApplying(false);
    }
  }

  const selectedSur = surcharges.find(s => s.id === surchargeId);

  return (
    <div style={{
      background: 'rgba(121,170,255,0.08)', border: '1px solid rgba(121,170,255,0.3)',
      borderRadius: 8, padding: '12px 16px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#1E3A5F' }}>
            {deltaLines.length} price mismatch line{deltaLines.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>
            — Are these all the same surcharge? Resolve them all at once:
          </span>
        </div>
        {!open && !done && (
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
              background: 'rgba(121,170,255,0.15)', border: '1px solid rgba(121,170,255,0.4)',
              color: '#1E40AF', fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}
          >
            Bulk Resolve…
          </button>
        )}
        {done && (
          <span style={{ fontSize: 12, color: '#00A040', fontWeight: 700 }}>
            ✓ {done.resolved} resolved{done.skipped > 0 ? `, ${done.skipped} skipped` : ''}
          </span>
        )}
      </div>

      {open && !done && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={surchargeId}
            onChange={e => { setSurchargeId(e.target.value); setError(''); }}
            style={{
              padding: '7px 10px', borderRadius: 6, fontSize: 12,
              border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#0F172A',
              minWidth: 200,
            }}
          >
            <option value=''>— Which surcharge? —</option>
            {surcharges.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          {selectedSur && (
            <span style={{ fontSize: 11, color: '#64748B' }}>
              Standard sell: <strong>
                {selectedSur.calc_type === 'percentage'
                  ? `${parseFloat(selectedSur.default_value).toFixed(2)}% of base`
                  : `£${parseFloat(selectedSur.default_value || 0).toFixed(2)} / ${selectedSur.charge_per || 'shipment'}`
                }
              </strong> — added on top of each line's existing freight sell price
            </span>
          )}

          <button
            onClick={applyAll}
            disabled={applying || !surchargeId}
            style={{
              padding: '7px 18px', borderRadius: 6, cursor: applying ? 'wait' : 'pointer',
              background: applying || !surchargeId ? '#e2e8f0' : '#00C853',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 12,
            }}
          >
            {applying ? 'Applying…' : `Apply to all ${deltaLines.length} lines`}
          </button>

          <button
            onClick={() => setOpen(false)}
            style={{
              padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
              color: '#64748B', fontSize: 12,
            }}
          >
            Cancel
          </button>

          {error && <span style={{ fontSize: 12, color: '#C62828' }}>{error}</span>}
        </div>
      )}
    </div>
  );
}

// ─── WarningTab ───────────────────────────────────────────────────────────────
// Simplified one-click acceptance UI for sell_surcharge_missing warning lines.
// Each row shows the carrier cost, the surcharge name, and the customer's
// configured sell price, with a single "Accept £X.XX" button.
// Lines without a known surcharge_id still have a "Manual Resolve" button.

function WarningTab({ lines, runId, onResolved, onOpenDrawer }) {
  const [acceptingId,   setAcceptingId]   = useState(null);   // line id being accepted
  const [acceptingAll,  setAcceptingAll]  = useState(false);
  const [error,         setError]         = useState('');

  // Lines that can be auto-accepted (have a surcharge_id + positive suggested_sell_price)
  const autoLines   = lines.filter(l => l.surcharge_id && parseFloat(l.suggested_sell_price || 0) > 0);
  const manualLines = lines.filter(l => !l.surcharge_id || parseFloat(l.suggested_sell_price || 0) <= 0);

  async function acceptOne(line) {
    setAcceptingId(line.id);
    setError('');
    try {
      await api.post(`/reconciliation/runs/${runId}/lines/${line.id}/resolve`, {
        resolution_type:  'map_to_surcharge',
        resolution_value: line.surcharge_id,
        scope:            'once',
      });
      onResolved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept');
    } finally {
      setAcceptingId(null);
    }
  }

  async function acceptAll() {
    setAcceptingAll(true);
    setError('');
    try {
      const res = await api.post(`/reconciliation/runs/${runId}/resolve-all-warnings`);
      onResolved();
      if (res.data?.skipped > 0) {
        setError(`${res.data.resolved} accepted. ${res.data.skipped} lines skipped (no price configured).`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept all');
    } finally {
      setAcceptingAll(false);
    }
  }

  const thSt = { padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#64748B',
                 textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', whiteSpace: 'nowrap' };
  const tdSt = { padding: '9px 12px', fontSize: 12, color: '#0F172A', verticalAlign: 'middle' };

  return (
    <div>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E' }}>
            ⚠ {lines.length} unbilled surcharge{lines.length !== 1 ? 's' : ''} — carrier charged, customer not billed
          </div>
          <div style={{ fontSize: 12, color: '#78350F', marginTop: 3 }}>
            Click "Accept" on each row to add the surcharge to the customer's invoice at the standard price.
          </div>
        </div>
        {autoLines.length > 1 && (
          <button
            onClick={acceptAll}
            disabled={acceptingAll}
            style={{
              padding: '9px 18px', borderRadius: 7, cursor: acceptingAll ? 'wait' : 'pointer',
              background: acceptingAll ? '#e2e8f0' : '#00C853',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 12,
              flexShrink: 0, marginLeft: 16,
            }}
          >
            {acceptingAll ? 'Accepting…' : `✓ Accept All ${autoLines.length} at Standard Price`}
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background: 'rgba(213,0,0,0.08)', border: '1px solid rgba(213,0,0,0.25)',
          borderRadius: 7, padding: '9px 14px', fontSize: 12, color: '#C62828', marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {lines.length === 0 && (
        <div style={{ ...card, textAlign: 'center', color: '#64748B', padding: '32px 20px' }}>
          No warning lines — all surcharges accounted for.
        </div>
      )}

      {lines.length > 0 && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,179,0,0.08)' }}>
                <th style={thSt}>TRACKING</th>
                <th style={thSt}>DATE</th>
                <th style={thSt}>CUSTOMER</th>
                <th style={thSt}>SURCHARGE</th>
                <th style={{ ...thSt, textAlign: 'right' }}>CARRIER COST</th>
                <th style={{ ...thSt, textAlign: 'right' }}>SELL PRICE</th>
                <th style={{ ...thSt, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const sellPrice = parseFloat(line.suggested_sell_price || 0);
                const canAuto   = !!line.surcharge_id && sellPrice > 0;
                const isLoading = acceptingId === line.id;
                return (
                  <tr key={line.id} style={{
                    borderBottom: idx < lines.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    background: isLoading ? 'rgba(0,200,83,0.04)' : 'rgba(255,179,0,0.04)',
                  }}>
                    <td style={{ ...tdSt, fontFamily: 'monospace', fontSize: 10, color: '#79AAFF' }}>
                      {line.tracking_number || '—'}
                    </td>
                    <td style={{ ...tdSt, color: '#64748B', fontSize: 11 }}>
                      {line.shipment_date ? new Date(line.shipment_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ ...tdSt, color: '#475569' }}>
                      {line.customer_name || '—'}
                    </td>
                    <td style={{ ...tdSt }}>
                      {line.surcharge_name
                        ? <span style={{ background: 'rgba(255,179,0,0.15)', color: '#92400E',
                            borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                            {line.surcharge_name}
                          </span>
                        : <span style={{ color: '#94A3B8', fontSize: 11 }}>Unknown</span>
                      }
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 600 }}>
                      £{parseFloat(line.carrier_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 700,
                      color: canAuto ? '#00C853' : '#94A3B8' }}>
                      {canAuto ? `£${sellPrice.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right' }}>
                      {canAuto ? (
                        <button
                          onClick={() => acceptOne(line)}
                          disabled={isLoading || acceptingAll}
                          style={{
                            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                            background: isLoading ? '#e2e8f0' : 'rgba(0,200,83,0.12)',
                            border: '1px solid rgba(0,200,83,0.35)',
                            color: '#00A040', fontWeight: 700, fontSize: 11,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isLoading ? '…' : `✓ Accept £${sellPrice.toFixed(2)}`}
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenDrawer(line)}
                          style={{
                            padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                            background: 'rgba(0,0,0,0.05)',
                            border: '1px solid rgba(0,0,0,0.12)',
                            color: '#475569', fontWeight: 600, fontSize: 11,
                          }}
                        >
                          Set Price…
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RunDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [activeTab,         setActiveTab]         = useState('overview');
  const [resolvingLine,     setResolvingLine]     = useState(null);
  const [defaultResolveType, setDefaultResolveType] = useState(null);
  const [finalizing,        setFinalizing]        = useState(false);
  const [finalizeError,     setFinalizeError]     = useState('');
  const [unfinalizing,      setUnfinalizing]      = useState(false);
  const [raisingQueryLine,  setRaisingQueryLine]  = useState(null);

  const { data: run, isLoading: runLoading, refetch: refetchRun } = useQuery({
    queryKey: ['recon-run', id],
    queryFn:  () => api.get(`/reconciliation/runs/${id}`).then(r => r.data),
    refetchInterval: (data) => data?.status === 'processing' ? 3000 : false,
  });

  async function handleUnfinalize() {
    if (!window.confirm('Reset this run back to editable? This will delete the billing snapshot so you can fix lines and re-finalize. Any Xero invoices already pushed will need to be voided in Xero manually.')) return;
    setUnfinalizing(true);
    try {
      await api.post(`/reconciliation/runs/${id}/unfinalize`);
      qc.invalidateQueries({ queryKey: ['recon-run', id] });
      qc.invalidateQueries({ queryKey: ['recon-customers', id] });
      refetchRun();
    } catch (err) {
      alert(err.response?.data?.error || 'Reset failed');
    } finally {
      setUnfinalizing(false);
    }
  }

  async function handleFinalize() {
    if (!window.confirm('Finalize this run? This will lock all Matched and Corrected lines and create the billing snapshot. This cannot be undone.')) return;
    setFinalizing(true);
    setFinalizeError('');
    try {
      await api.post(`/reconciliation/runs/${id}/finalize`);
      qc.invalidateQueries({ queryKey: ['recon-run', id] });
      qc.invalidateQueries({ queryKey: ['recon-customers', id] });
      refetchRun();
    } catch (err) {
      setFinalizeError(err.response?.data?.error || 'Finalization failed');
    } finally {
      setFinalizing(false);
    }
  }

  const linesQuery = (status) => useQuery({
    queryKey: ['recon-lines', id, status],
    queryFn:  () => api.get(`/reconciliation/runs/${id}/lines?${status ? `status=${status}&` : ''}limit=500`).then(r => r.data),
    enabled:  activeTab !== 'overview',
  });

  const allLines       = linesQuery('').data?.lines       || [];
  const unmatchedLines = linesQuery('unmatched').data?.lines || [];
  const warningLines   = linesQuery('warning').data?.lines   || [];
  const matchedLines   = linesQuery('matched').data?.lines   || [];
  const correctedLines = linesQuery('corrected').data?.lines || [];

  const { data: queriesData } = useQuery({
    queryKey: ['courier-queries', parseInt(id)],
    queryFn: () => api.get(`/reconciliation/queries`, { params: { run_id: id, limit: 200 } }).then(r => r.data),
    staleTime: 60_000,
  });
  const activeQueryCount = (queriesData?.queries || []).filter(q =>
    !['credited','rejected','written_off'].includes(q.status)
  ).length;

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'unmatched',  label: `Needs Review (${run?.unmatched_count || 0})`, alert: (run?.unmatched_count || 0) > 0 },
    { key: 'warning',    label: `Warnings (${run?.warning_count || 0})`, warn: (run?.warning_count || 0) > 0 },
    { key: 'matched',    label: `Matched (${run?.matched_count || 0})` },
    { key: 'corrected',  label: `Corrected (${run?.corrected_count || 0})` },
    { key: 'all',        label: 'All Lines' },
    { key: 'customers',  label: run?.finalized ? 'Customers ✓' : 'Customers' },
    { key: 'queries',    label: 'Carrier Queries', alert: activeQueryCount > 0 },
  ];

  const currentLines = {
    unmatched: unmatchedLines,
    warning:   warningLines,
    matched:   matchedLines,
    corrected: correctedLines,
    all:       allLines,
  }[activeTab] || [];

  if (runLoading) {
    return <div style={{ color: '#64748B', fontSize: 13, padding: 40 }}>Loading…</div>;
  }
  if (!run) {
    return <div style={{ color: '#FF5252', fontSize: 13, padding: 40 }}>Run not found</div>;
  }

  const total        = run.total_lines || 0;
  const matchedPct   = total > 0 ? Math.round(((run.matched_count || 0) / total) * 100) : 0;
  const correctedPct = total > 0 ? Math.round(((run.corrected_count || 0) / total) * 100) : 0;
  const unmatchedPct = total > 0 ? Math.round(((run.unmatched_count || 0) / total) * 100) : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate('/reconciliation')} style={{ ...btnGhost, padding: '7px 10px' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {run.carrier_name} — {run.invoice_ref || `Run #${run.id}`}
          </h1>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            {run.invoice_date ? new Date(run.invoice_date).toLocaleDateString('en-GB') : '—'} · Started {new Date(run.created_at).toLocaleDateString('en-GB')}
            {run.status === 'processing' && <span style={{ color: '#79AAFF', marginLeft: 10 }}><RefreshCw size={11} style={{ display: 'inline' }} /> Processing…</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {run.finalized && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#00C853', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={13} />Finalized
              </span>
              <button
                style={{ ...btnRed, padding: '4px 10px', fontSize: 11, opacity: unfinalizing ? 0.7 : 1 }}
                onClick={handleUnfinalize}
                disabled={unfinalizing}
                title='Reset run — deletes the billing snapshot so you can fix lines and re-finalize'
              >
                {unfinalizing ? <RefreshCw size={11} /> : <X size={11} />}
                {unfinalizing ? 'Resetting…' : 'Reset Run'}
              </button>
            </div>
          )}
          {run.status === 'failed' && (
            <span style={{ color: '#FF5252', fontSize: 12, fontWeight: 700 }}>✗ Run Failed</span>
          )}
          {!run.finalized && (run.unmatched_count || 0) > 0 && (
            <span style={{ color: '#FF5252', fontSize: 12, fontWeight: 700 }}>✗ Needs Review</span>
          )}
          {!run.finalized && (run.unmatched_count || 0) === 0 && (run.warning_count || 0) > 0 && (
            <span style={{ color: '#FFB300', fontSize: 12, fontWeight: 700 }}>⚠ {run.warning_count} Unbilled Surcharge{(run.warning_count || 0) > 1 ? 's' : ''}</span>
          )}
          {!run.finalized && run.unmatched_count === 0 && (run.status === 'complete' || run.status === 'needs_review') && (
            <button
              style={{ ...btnGreen, opacity: finalizing ? 0.7 : 1 }}
              onClick={handleFinalize}
              disabled={finalizing}
            >
              {finalizing ? <RefreshCw size={13} /> : <Lock size={13} />}
              {finalizing ? 'Finalizing…' : 'Finalize Run'}
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        {/* Pool size — first tile, most diagnostic value */}
        {(() => {
          const ps = run.pool_size;
          const psColor  = ps == null ? '#475569' : ps === 0 ? '#FF5252' : '#00C853';
          const psValue  = ps == null ? 'Pending…' : ps.toLocaleString();
          const psBorder = ps === 0 ? '1px solid rgba(213,0,0,0.4)' : card.border;
          return (
            <div key="pool" style={{ ...card, border: psBorder }}>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Verified Pool</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: psColor }}>{psValue}</div>
              {ps === 0 && <div style={{ fontSize: 10, color: '#FF5252', marginTop: 4 }}>Carrier name mismatch?</div>}
            </div>
          );
        })()}
        {[
          { label: 'Total Lines', value: total.toLocaleString(), color: '#0F172A' },
          { label: 'Matched', value: `${run.matched_count || 0} (${matchedPct}%)`, color: '#00C853' },
          { label: 'Corrected', value: `${run.corrected_count || 0} (${correctedPct}%)`, color: '#FF8F00' },
          { label: 'Unmatched', value: `${run.unmatched_count || 0} (${unmatchedPct}%)`, color: (run.unmatched_count || 0) > 0 ? '#FF5252' : '#475569' },
          { label: 'Warnings', value: `${run.warning_count || 0}`, color: (run.warning_count || 0) > 0 ? '#FFB300' : '#475569' },
          { label: 'Automation Rate', value: run.automation_rate != null ? `${run.automation_rate}%` : '—', color: parseFloat(run.automation_rate) >= 80 ? '#00C853' : '#FFB300' },
        ].map(({ label, value, color }) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              color: activeTab === tab.key ? '#0F172A' : '#666',
              borderBottom: `2px solid ${activeTab === tab.key ? (tab.warn ? '#FFB300' : '#00C853') : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.alert && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF5252', display: 'inline-block' }} />}
            {tab.warn  && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB300', display: 'inline-block' }} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Breakdown chart */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Result breakdown</div>
            {[
              { label: 'Matched',   count: run.matched_count   || 0, color: '#00C853' },
              { label: 'Corrected', count: run.corrected_count || 0, color: '#FF8F00' },
              { label: 'Unmatched', count: run.unmatched_count || 0, color: '#FFB300' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: '#64748B' }}>{label}</span>
                  <span style={{ color, fontWeight: 700 }}>{count.toLocaleString()} / {total.toLocaleString()}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 99 }}>
                  <div style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Run details */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Run details</div>
            {[
              ['Carrier',       run.carrier_name],
              ['Invoice ref',   run.invoice_ref || '—'],
              ['Invoice date',  run.invoice_date ? new Date(run.invoice_date).toLocaleDateString('en-GB') : '—'],
              ['Started',       new Date(run.created_at).toLocaleString('en-GB')],
              ['Completed',     run.completed_at ? new Date(run.completed_at).toLocaleString('en-GB') : '—'],
              ['Created by',    run.created_by_name || 'System'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: 12 }}>
                <span style={{ color: '#64748B' }}>{label}</span>
                <span style={{ color: '#0F172A' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Finalize error */}
          {finalizeError && (
            <div style={{ ...card, border: '1px solid rgba(213,0,0,0.3)', background: 'rgba(213,0,0,0.08)', gridColumn: 'span 2', color: '#FF5252', fontSize: 12 }}>
              ✗ {finalizeError}
            </div>
          )}

          {/* Quick action — unmatched */}
          {(run.unmatched_count || 0) > 0 && (
            <div style={{ ...card, border: '1px solid rgba(255,160,0,0.3)', background: 'rgba(255,160,0,0.06)', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFB300' }}>
                  {run.unmatched_count} line{run.unmatched_count !== 1 ? 's' : ''} need manual review
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                  Resolve all Unmatched lines before finalizing
                </div>
              </div>
              <button style={btnGreen} onClick={() => setActiveTab('unmatched')}>
                <AlertTriangle size={14} />Go to Review Queue
              </button>
            </div>
          )}

          {/* Failed run banner */}
          {run.status === 'failed' && (
            <div style={{ ...card, border: '1px solid rgba(213,0,0,0.4)', background: 'rgba(213,0,0,0.06)', gridColumn: 'span 2' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FF5252', marginBottom: 4 }}>✗ Run Failed</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                The reconciliation engine encountered an error during processing. Check Railway logs for details, then delete this run and re-upload the CSV.
              </div>
            </div>
          )}

          {/* Finalize CTA — show when no unmatched, run completed successfully, not yet finalized */}
          {(run.unmatched_count || 0) === 0 && !run.finalized && (run.status === 'complete' || run.status === 'needs_review') && (
            <div style={{ ...card, border: '1px solid rgba(0,200,83,0.25)', background: 'rgba(0,200,83,0.06)', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#00C853' }}>Ready to finalize</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                  All lines resolved. Finalize to create the immutable billing snapshot and enable Xero push.
                </div>
              </div>
              <button style={{ ...btnGreen, opacity: finalizing ? 0.7 : 1 }} onClick={handleFinalize} disabled={finalizing}>
                {finalizing ? <RefreshCw size={14} /> : <Lock size={14} />}
                {finalizing ? 'Finalizing…' : 'Finalize Run'}
              </button>
            </div>
          )}
        </div>

        {/* Customer billing summary — shown after finalization */}
        {run.finalized && (
          <div style={{ marginTop: 20 }}>
            <CustomerSummaryPanel runId={parseInt(id)} run={run} />
          </div>
        )}

        {/* Shipment lookup — diagnose missing / unmatched tracking numbers */}
        <div style={{ marginTop: 20 }}>
          <ShipmentLookupPanel />
        </div>
        </>
      )}

      {/* Unmatched tab — service code mapping banner + lines table */}
      {activeTab === 'unmatched' && (
        <>
          {/* Bulk surcharge resolver — shown when there are price-mismatch lines */}
          <BulkSurchargeResolver
            unmatchedLines={unmatchedLines}
            runId={parseInt(id)}
            courierId={run.carrier_id}
            onResolved={() => {
              qc.invalidateQueries({ queryKey: ['recon-run', id] });
              qc.invalidateQueries({ queryKey: ['recon-lines', id] });
            }}
          />

          {/* Cancelled booking notice — download is on the main reconciliation page */}
          {unmatchedLines.some(l => l.unmatched_reason === 'cancelled_booking_invoiced') && (
            <div style={{
              background: 'rgba(213,0,0,0.07)', border: '1px solid rgba(213,0,0,0.25)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>🚫</span>
              <div style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 1.5 }}>
                <strong style={{ color: '#B71C1C' }}>
                  {unmatchedLines.filter(l => l.unmatched_reason === 'cancelled_booking_invoiced').length} cancelled booking{unmatchedLines.filter(l => l.unmatched_reason === 'cancelled_booking_invoiced').length !== 1 ? 's' : ''} invoiced by DPD
                </strong>
                {' '}— DPD charged for these but the parcel was never sent. They will not be billed to the customer.
                Resolve each line using <strong>Applying for credit with Courier</strong> once you have claimed the refund from DPD,
                or use <strong>Download DPD Credit Request</strong> on the reconciliation home page to export all outstanding lines as a CSV.
              </div>
            </div>
          )}
          <ServiceCodeMappingBanner
            unmatchedLines={unmatchedLines}
            runId={parseInt(id)}
            courierId={run.carrier_id}
            onMapped={() => {
              qc.invalidateQueries({ queryKey: ['recon-run', id] });
              qc.invalidateQueries({ queryKey: ['recon-lines', id] });
              refetchRun();
            }}
          />
          <div style={card}>
            <LinesTable
              lines={unmatchedLines}
              showResolve
              onResolve={(line) => { setDefaultResolveType(null); setResolvingLine(line); }}
              onResolveAsSurcharge={(line) => { setDefaultResolveType('map_to_surcharge'); setResolvingLine(line); }}
              onRaiseQuery={(line) => setRaisingQueryLine(line)}
              runId={id}
              courierId={run.carrier_id}
              exportFilename={`${run.carrier_name || 'recon'}_${run.invoice_ref || id}_unmatched.csv`}
            />
          </div>
        </>
      )}

      {/* Customers tab — preview before finalization, full panel after */}
      {activeTab === 'customers' && (
        run.finalized
          ? <CustomerSummaryPanel runId={parseInt(id)} run={run} />
          : <CustomerPreviewPanel runId={parseInt(id)} />
      )}

      {/* Warning tab — carrier surcharges with no sell-side customer charge */}
      {activeTab === 'warning' && (
        <WarningTab
          lines={warningLines}
          runId={id}
          onResolved={() => {
            qc.invalidateQueries({ queryKey: ['recon-run', id] });
            qc.invalidateQueries({ queryKey: ['recon-lines', id] });
          }}
          onOpenDrawer={(line) => { setDefaultResolveType('map_to_surcharge'); setResolvingLine(line); }}
        />
      )}

      {/* Carrier Queries tab */}
      {activeTab === 'queries' && (
        <CourierQueriesPanel runId={parseInt(id)} carrierId={run.carrier_id} />
      )}

      {/* Line tables for other tabs */}
      {activeTab !== 'overview' && activeTab !== 'unmatched' && activeTab !== 'warning' && activeTab !== 'customers' && activeTab !== 'queries' && (
        <div style={card}>
          <LinesTable
            lines={currentLines}
            showResolve={false}
            onResolve={(line) => { setDefaultResolveType(null); setResolvingLine(line); }}
            onResolveAsSurcharge={(line) => { setDefaultResolveType('map_to_surcharge'); setResolvingLine(line); }}
            runId={id}
            courierId={run.carrier_id}
            exportFilename={`${run.carrier_name || 'recon'}_${run.invoice_ref || id}_${activeTab}.csv`}
          />
        </div>
      )}

      {/* Resolve drawer */}
      {resolvingLine && (
        <ResolveDrawer
          line={resolvingLine}
          courierId={run.carrier_id}
          defaultResolutionType={defaultResolveType}
          onClose={() => { setResolvingLine(null); setDefaultResolveType(null); }}
          onResolved={() => {
            qc.invalidateQueries({ queryKey: ['recon-run', id] });
            qc.invalidateQueries({ queryKey: ['recon-lines', id] });
            setResolvingLine(null);
            setDefaultResolveType(null);
          }}
        />
      )}

      {/* Raise Query modal */}
      {raisingQueryLine && (
        <RaiseQueryModal
          line={raisingQueryLine}
          runId={parseInt(id)}
          carrierId={run.carrier_id}
          invoiceRef={run.invoice_ref}
          onClose={() => setRaisingQueryLine(null)}
          onRaised={() => {
            qc.invalidateQueries({ queryKey: ['courier-queries', parseInt(id)] });
            qc.invalidateQueries({ queryKey: ['courier-queries-summary', id] });
          }}
        />
      )}
    </div>
  );
}
