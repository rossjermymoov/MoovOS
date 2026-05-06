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
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '16px 20px',
};
const inputSt = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, color: '#E6EDF3', fontSize: 12,
  padding: '7px 10px', outline: 'none',
};
const btnGreen = {
  background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)',
  borderRadius: 7, color: '#00C853', padding: '7px 14px', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
};
const btnGhost = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, color: '#AAA', padding: '7px 14px', cursor: 'pointer',
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
    processing:   { color: '#888',   bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', label: 'Processing' },
  }[status] || { color: '#AAA', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', label: status };
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
  // corrected_by values from the engine
  if (correctedBy === 'surcharge_mapping') {
    return <span style={{ fontSize: 10, color: '#00C853', fontWeight: 600 }}>Surcharge mapping</span>;
  }
  const labels = {
    unknown_service_code:    { text: 'Unknown service code', color: '#FF5252' },
    no_account_mapping:      { text: 'Account not mapped',   color: '#FFB300' },
    not_in_verified_pool:    { text: 'Not verified',         color: '#FF5252' },
    no_pricing_rules:        { text: 'No pricing rules',     color: '#FFB300' },
    unexplained_delta:       { text: 'Unexplained delta',    color: '#FFB300' },
    external_booking_review: { text: 'External booking',     color: '#79AAFF' },
    fuel_aggregate_mismatch: { text: 'Fuel mismatch',        color: '#FFB300' },
    hgv_aggregate_mismatch:  { text: 'HGV mismatch',         color: '#FFB300' },
    no_hgv_rate:             { text: 'No HGV rate on file',  color: '#FF5252' },
    aggregate_mismatch:      { text: 'Aggregate mismatch',   color: '#FFB300' },
  };
  const cfg = labels[reason] || { text: reason || '—', color: '#888' };
  return <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.text}</span>;
}

// ─── Resolve drawer ───────────────────────────────────────────────────────────
function ResolveDrawer({ line, courierId, onClose, onResolved, defaultResolutionType }) {
  const isUnknownCode = line.unmatched_reason === 'unknown_service_code';

  // For unknown service code lines default straight into the mapping flow.
  // defaultResolutionType lets callers (e.g. the DeltaCell tooltip) pre-select
  // a resolution type without the operator having to pick it manually.
  const [scope,           setScope]           = useState('once');
  const [saveRule,        setSaveRule]        = useState(isUnknownCode);   // "Save as Permanent Rule" checkbox
  const [ruleScope,       setRuleScope]       = useState('global');        // 'global' | 'customer'
  const [resolutionType,  setResolutionType]  = useState(
    defaultResolutionType || (isUnknownCode ? 'map_to_service' : '')
  );
  const [resolutionValue, setResolutionValue] = useState(
    // Pre-populate with suggested service if the engine found one
    isUnknownCode && line.suggested_service_id ? String(line.suggested_service_id) : ''
  );
  const [notes,    setNotes]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const isSurchargeMapping = resolutionType === 'map_to_surcharge';

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
    unknown_service_code:    'service_code',
    no_account_mapping:      'account_number',
    no_pricing_rules:        null,
    unexplained_delta:       'delta_acceptance',
    external_booking_review: 'account_number',
  }[line.unmatched_reason];

  async function handleResolve() {
    if (!resolutionType || !resolutionValue) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const effectiveScope = saveRule ? 'always' : 'once';
      const customerId     = (saveRule && ruleScope === 'customer') ? (line.customer_id || null) : null;

      await api.post(`/reconciliation/runs/${line.run_id}/lines/${line.id}/resolve`, {
        resolution_type:  resolutionType,
        resolution_value: resolutionValue,
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
        width: 460, height: '100vh', background: '#0D0F2B',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        padding: 24, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>Resolve Line</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Line context */}
        <div style={{ ...card, fontSize: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            {line.tracking_number && (
              <div><span style={{ color: '#888' }}>Tracking:</span> <span style={{ color: '#E6EDF3', fontFamily: 'monospace' }}>{line.tracking_number}</span></div>
            )}
            <div><span style={{ color: '#888' }}>Raw service code:</span> <span style={{ color: '#79AAFF', fontFamily: 'monospace', fontWeight: 700 }}>{line.raw_service_code || '—'}</span></div>
            <div><span style={{ color: '#888' }}>Carrier amount:</span> <span style={{ color: '#E6EDF3', fontWeight: 700 }}>£{parseFloat(line.carrier_amount || 0).toFixed(2)}</span></div>
            {line.expected_amount != null && (
              <div><span style={{ color: '#888' }}>Expected:</span> <span style={{ color: '#E6EDF3' }}>£{parseFloat(line.expected_amount).toFixed(2)}</span></div>
            )}
            {line.delta != null && (
              <div><span style={{ color: '#888' }}>Delta:</span>
                <span style={{ color: parseFloat(line.delta) > 0 ? '#FF5252' : '#00C853', fontWeight: 700, marginLeft: 4 }}>
                  {parseFloat(line.delta) > 0 ? '+' : ''}£{parseFloat(line.delta).toFixed(2)}
                </span>
              </div>
            )}
            <div><span style={{ color: '#888' }}>Reason:</span> <span style={{ marginLeft: 4 }}><ReasonLabel reason={line.unmatched_reason} /></span></div>
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
            <div style={{ fontSize: 12, color: '#C8D8EF' }}>
              The tracking number was found in the Verified Pool. The shipment was booked as:
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: '#E6EDF3' }}>
              {suggestionLabel}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              The dropdown below is pre-selected with this match.
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)', borderRadius: 7, padding: '10px 14px', color: '#FF5252', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Resolution type — for unknown_service_code show both service and surcharge mapping options */}
        {isUnknownCode ? (
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>RESOLUTION TYPE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { val: 'map_to_service',   label: 'Delivery Service', desc: 'Base freight service (e.g. DHL Next Day)' },
                { val: 'map_to_surcharge', label: 'Surcharge',        desc: 'Named fee (e.g. congestion, remote area)' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => { setResolutionType(opt.val); setResolutionValue(''); }}
                  style={{
                    padding: '9px 11px', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                    background: resolutionType === opt.val ? 'rgba(0,200,83,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${resolutionType === opt.val ? 'rgba(0,200,83,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: resolutionType === opt.val ? '#00C853' : '#E6EDF3' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>RESOLUTION TYPE</label>
            <select style={inputSt} value={resolutionType} onChange={e => setResolutionType(e.target.value)}>
              <option value=''>— Select type —</option>
              <option value='accept'>Accept charge as-is</option>
              <option value='map_to_service'>Map to internal service</option>
              <option value='map_to_surcharge'>Map to surcharge</option>
              <option value='map_to_customer'>Map account to customer</option>
              <option value='accept_delta'>Accept delta as tolerance</option>
              <option value='reject'>Reject / dispute charge</option>
            </select>
          </div>
        )}

        {/* Service mapping dropdown */}
        {(resolutionType === 'map_to_service') && (
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>
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
        {(resolutionType === 'map_to_surcharge') && (
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>
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
                No surcharges configured for this carrier yet. Add them in Settings → Surcharges first.
              </div>
            )}
          </div>
        )}

        {/* Delta tolerance input */}
        {resolutionType === 'accept_delta' && (
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>TOLERANCE % *</label>
            <input
              style={inputSt}
              type='number' step='0.1' min='0' max='100'
              placeholder='e.g. 5 (means ±5%)'
              value={resolutionValue}
              onChange={e => setResolutionValue(e.target.value)}
            />
            <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>±% delta that will auto-correct in future runs</div>
          </div>
        )}

        {/* Generic value input for other types */}
        {!isUnknownCode && resolutionType !== 'map_to_service' && resolutionType !== 'accept_delta' && resolutionType && (
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>RESOLUTION VALUE *</label>
            <input
              style={inputSt}
              placeholder={
                resolutionType === 'map_to_customer' ? 'Customer name or account number' :
                resolutionType === 'reject'           ? 'Reason for rejection' :
                'Resolution value'
              }
              value={resolutionValue}
              onChange={e => setResolutionValue(e.target.value)}
            />
          </div>
        )}

        {/* Save as Permanent Rule */}
        <div style={{
          background: saveRule ? 'rgba(0,200,83,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${saveRule ? 'rgba(0,200,83,0.3)' : 'rgba(255,255,255,0.08)'}`,
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
              <div style={{ fontSize: 13, fontWeight: 700, color: saveRule ? '#00C853' : '#E6EDF3' }}>
                Save as Permanent Rule
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                Auto-resolve this code on all future runs for this carrier
              </div>
            </div>
          </label>

          {/* Rule scope — visible when saving a service code OR surcharge mapping */}
          {saveRule && (isUnknownCode || resolutionType === 'map_to_surcharge') && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 8 }}>APPLIES TO</div>
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
                      background: ruleScope === opt.val ? 'rgba(0,200,83,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${ruleScope === opt.val ? 'rgba(0,200,83,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: ruleScope === opt.val ? '#00C853' : '#E6EDF3' }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{opt.desc}</div>
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
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>NOTES (OPTIONAL)</label>
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
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            Map each raw carrier code to an internal service. Saves as a permanent rule so future runs auto-resolve.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...groups.values()].map(g => (
          <div key={g.code} style={{
            display: 'grid', gridTemplateColumns: '140px 50px 1fr 120px', gap: 12,
            alignItems: 'center', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            border: selections[g.code] ? '1px solid rgba(0,200,83,0.2)' : '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Raw code */}
            <div>
              <div style={{ fontSize: 10, color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Raw Code</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#79AAFF' }}>{g.code}</div>
            </div>
            {/* Line count */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Lines</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#AAA' }}>{g.count}</div>
            </div>
            {/* Service dropdown */}
            <div>
              <div style={{ fontSize: 10, color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
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
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [err,     setErr]     = useState(null);

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
      <div style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3', marginBottom: 12 }}>
        Shipment Lookup
      </div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
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
          <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
            Searched: <span style={{ fontFamily: 'monospace', color: '#AAA' }}>{result.tracking_searched}</span>
            {' '}·{' '}
            Variants tried: <span style={{ fontFamily: 'monospace', color: '#666' }}>{result.variants_tried.join(', ')}</span>
          </div>

          {result.shipments_found === 0 && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
              fontSize: 12, color: '#FF5252', fontWeight: 600,
            }}>
              ✗ No shipment found with this tracking number. The webhook may never have fired, or the shipment was created under a different reference.
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
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3', fontFamily: 'monospace' }}>
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
                  ['dc_service_id',     r.shipment.dc_service_id || '(none)'],
                  ['tracking_codes',    r.shipment.tracking_codes.length ? r.shipment.tracking_codes.join(', ') : '(empty)'],
                  ['Reference',         r.shipment.reference || '—'],
                  ['Weight',            r.shipment.total_weight_kg ? `${r.shipment.total_weight_kg} kg` : '—'],
                  ['Postcode',          r.shipment.ship_to_postcode || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10 }}>
                    <span style={{ color: '#444' }}>{k}: </span>
                    <span style={{ color: '#888', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>

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
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Type', 'Status', 'Verified', 'Cancelled', 'Cost', 'Zone', 'Customer'].map(h => (
                        <th key={h} style={{ padding: '4px 6px', textAlign: 'left', color: '#444', fontWeight: 700, textTransform: 'uppercase', fontSize: 9 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.charges.map((c, j) => (
                      <tr key={j} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '4px 6px', color: '#AAA' }}>{c.charge_type}</td>
                        <td style={{ padding: '4px 6px', color: '#888' }}>{c.status}</td>
                        <td style={{ padding: '4px 6px', color: statusColor(c.verified), fontWeight: 700 }}>{c.verified ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '4px 6px', color: c.cancelled ? '#FF5252' : '#555' }}>{c.cancelled ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '4px 6px', color: '#E6EDF3' }}>{c.cost_price != null ? `£${parseFloat(c.cost_price).toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '4px 6px', color: '#666' }}>{c.zone_name || '—'}</td>
                        <td style={{ padding: '4px 6px', color: '#AAA' }}>{c.customer_name || '—'}</td>
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

  const stepColor = s => s === 'ok' ? '#00C853' : s === 'warn' ? '#FF8F00' : s === 'error' ? '#FF5252' : '#AAA';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12, padding: 24, width: 640, maxHeight: '80vh',
        overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E6EDF3', marginBottom: 4 }}>
              Reconciliation Trace
            </div>
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
              {trackingNumber || `line #${lineId}`}
            </div>
          </div>
          <button style={{ ...btnGhost, padding: '4px 8px' }} onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: '#555', fontSize: 12, padding: '30px 0' }}>
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
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,${step.status === 'error' ? '0.15' : '0.06'})`,
                borderRadius: 8, padding: '10px 14px',
                borderLeft: `3px solid ${stepColor(step.status)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3' }}>
                    {i + 1}. {step.label}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: stepColor(step.status),
                  }}>
                    {step.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
                  {step.detail}
                </div>
                {step.value != null && (
                  <div style={{
                    marginTop: 6, fontSize: 12, fontWeight: 700,
                    color: step.status === 'error' ? '#FF5252' : step.status === 'warn' ? '#FF8F00' : '#E6EDF3',
                  }}>
                    {step.value}
                  </div>
                )}
                {step.meta && Object.keys(step.meta).length > 0 && (
                  <div style={{
                    marginTop: 8, padding: '6px 10px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 6,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px',
                  }}>
                    {Object.entries(step.meta).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 10, color: '#555' }}>
                        <span style={{ color: '#444' }}>{k}: </span>
                        <span style={{ color: '#888', fontFamily: 'monospace' }}>{String(v)}</span>
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

  if (line.delta == null) return <span style={{ color: '#555' }}>—</span>;

  const isPriceMismatch = line.unmatched_reason === 'price_mismatch';
  const isPositive = delta > 0.01;
  const color = isPositive ? '#FF5252' : delta < -0.01 ? '#00C853' : '#555';

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
            border: '1px solid rgba(255,255,255,0.15)',
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
            borderRight: '1px solid rgba(255,255,255,0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            transform: 'translateX(-50%) rotate(45deg)',
          }} />

          <div style={{ fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Price Mismatch
          </div>

          {/* Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#888' }}>Carrier charged</span>
              <span style={{ color: '#E6EDF3', fontWeight: 600 }}>£{carrier.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#888' }}>Expected</span>
              <span style={{ color: '#888' }}>£{expected.toFixed(2)}</span>
            </div>
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 5,
              display: 'flex', justifyContent: 'space-between', fontSize: 11,
            }}>
              <span style={{ color: '#888' }}>{isPositive ? 'Carrier surplus' : 'Carrier deficit'}</span>
              <span style={{ color, fontWeight: 700 }}>{delta > 0 ? '+' : ''}£{delta.toFixed(2)}</span>
            </div>
          </div>

          {/* Show raw CSV column values — highlight any that match the delta */}
          {(() => {
            const rawCols = line.correction_metadata?.raw_col_values || {};
            const entries = Object.entries(rawCols).filter(([, v]) => v > 0);
            if (!entries.length) return (
              <div style={{ fontSize: 10, color: '#555', marginBottom: 10, lineHeight: 1.5 }}>
                {isPositive ? 'No unmapped column values found — may be an out-of-zone or address correction fee.' : 'Carrier charged less than expected.'}
              </div>
            );
            const absDelta = Math.abs(delta);
            return (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Unmapped CSV columns
                </div>
                {entries.map(([col, amt]) => {
                  const isMatch = Math.abs(amt - absDelta) < 0.02;
                  return (
                    <div key={col} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 11, padding: '3px 6px', borderRadius: 4, marginBottom: 2,
                      background: isMatch ? 'rgba(0,200,83,0.08)' : 'transparent',
                      border: isMatch ? '1px solid rgba(0,200,83,0.2)' : '1px solid transparent',
                    }}>
                      <span style={{ color: isMatch ? '#E6EDF3' : '#888', fontWeight: isMatch ? 700 : 400 }}>
                        {isMatch && <span style={{ color: '#00C853', marginRight: 4 }}>✓</span>}
                        {col}
                      </span>
                      <span style={{ color: isMatch ? '#00C853' : '#888', fontWeight: 600 }}>
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
function LinesTable({ lines, showResolve, onResolve, onResolveAsSurcharge, runId }) {
  const [traceLine, setTraceLine] = useState(null);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Tracking', 'Service (raw)', 'Service', 'Customer', 'Type', 'Carrier £', 'Expected £', 'Delta £', 'Status', 'Reason', ''].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map(line => (
            <tr key={line.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: '#AAA', fontSize: 10 }}>
                {line.aged && <span title='Aged' style={{ color: '#FF5252', marginRight: 4 }}>⚠</span>}
                {line.tracking_number || '—'}
              </td>
              <td style={{ padding: '9px 10px', color: '#79AAFF', fontFamily: 'monospace', fontSize: 10 }}>{line.raw_service_code || '—'}</td>
              <td style={{ padding: '9px 10px', color: '#AAA' }}>
                {line.service_name || (
                  line.suggested_service_name
                    ? <span style={{ color: '#79AAFF', fontStyle: 'italic' }}>
                        ✦ {line.suggested_service_name}
                      </span>
                    : '—'
                )}
              </td>
              <td style={{ padding: '9px 10px', color: '#AAA' }}>{line.customer_name || '—'}</td>
              <td style={{ padding: '9px 10px', color: '#666' }}>{line.charge_type || 'base'}</td>
              <td style={{ padding: '9px 10px', color: '#E6EDF3', fontWeight: 600 }}>
                {line.carrier_amount != null ? `£${parseFloat(line.carrier_amount).toFixed(2)}` : '—'}
              </td>
              <td style={{ padding: '9px 10px', color: '#888' }}>
                {line.expected_amount != null ? `£${parseFloat(line.expected_amount).toFixed(2)}` : '—'}
              </td>
              <td style={{ padding: '9px 10px', fontWeight: 600 }}>
                <DeltaCell
                  line={line}
                  onResolveAsSurcharge={onResolveAsSurcharge || (() => {})}
                />
              </td>
              <td style={{ padding: '9px 10px' }}><StatusBadge status={line.status} /></td>
              <td style={{ padding: '9px 10px' }}>
                <ReasonLabel reason={line.unmatched_reason} correctedBy={line.corrected_by} />
                {line.corrected_by && line.corrected_by !== 'surcharge_mapping' && (
                  <span style={{ fontSize: 10, color: '#666' }}>via {line.corrected_by}</span>
                )}
              </td>
              <td style={{ padding: '9px 10px' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {showResolve && line.status === 'unmatched' && (
                    <button style={{ ...btnGhost, padding: '4px 8px', fontSize: 10 }} onClick={() => onResolve(line)}>
                      Resolve
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
      {lines.length === 0 && (
        <div style={{ textAlign: 'center', color: '#555', fontSize: 12, padding: '30px 0' }}>No lines in this category</div>
      )}
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
function CustomerSummaryPanel({ runId, run }) {
  const qc = useQueryClient();
  const [pushing, setPushing] = useState(null); // customer_id being pushed

  const { data: customers = [], refetch } = useQuery({
    queryKey: ['recon-customers', runId],
    queryFn:  () => api.get(`/reconciliation/runs/${runId}/customers`).then(r => r.data),
    enabled:  !!run?.finalized,
  });

  async function handleXeroPush(customerId) {
    setPushing(customerId);
    try {
      await api.post(`/xero/reconciliation-runs/${runId}/push`, { customer_id: customerId });
      refetch();
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
    <div style={{ ...card, color: '#555', fontSize: 12, textAlign: 'center', padding: 30 }}>
      No finalized billing lines found
    </div>
  );

  const unlinkedCount = customers.filter(c => !c.xero_linked).length;
  const allPushed     = customers.every(c => c.xero_pushed_count > 0);

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#E6EDF3' }}>Customer Billing Summary</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
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
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Customer', 'Shipments', 'Base', 'Fuel', 'Surcharges', 'Total Sell', 'Margin', 'Xero', 'CSV', ''].map(h => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#555', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.customer_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '9px 10px', color: '#E6EDF3', fontWeight: 600 }}>{c.customer_name || '—'}</td>
              <td style={{ padding: '9px 10px', color: '#AAA' }}>{c.line_count}</td>
              <td style={{ padding: '9px 10px', color: '#888' }}>£{parseFloat(c.total_base || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: '#888' }}>£{parseFloat(c.total_fuel || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: '#888' }}>£{parseFloat(c.total_surcharge || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: '#00C853', fontWeight: 700 }}>£{parseFloat(c.total_sell || 0).toFixed(2)}</td>
              <td style={{ padding: '9px 10px', color: parseFloat(c.total_margin || 0) > 0 ? '#00C853' : '#FF5252' }}>
                £{parseFloat(c.total_margin || 0).toFixed(2)}
              </td>
              <td style={{ padding: '9px 10px' }}>
                {c.xero_pushed_count > 0 ? (
                  <span style={{ color: '#00C853', fontSize: 11, fontWeight: 700 }}>✓ Pushed</span>
                ) : c.xero_linked ? (
                  <button
                    style={{ ...btnGhost, padding: '3px 8px', fontSize: 10, opacity: pushing === c.customer_id ? 0.7 : 1 }}
                    onClick={() => handleXeroPush(c.customer_id)}
                    disabled={!!pushing}
                  >
                    {pushing === c.customer_id ? <RefreshCw size={11} /> : <Send size={11} />}
                    Push
                  </button>
                ) : (
                  <span style={{ color: '#555', fontSize: 10 }}>Not linked</span>
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
              <td style={{ padding: '9px 10px', color: '#555' }}>
                {c.xero_push_error && <span style={{ color: '#FF5252', fontSize: 10 }} title={c.xero_push_error}>⚠ Error</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
            <td colSpan={5} style={{ padding: '9px 10px', color: '#888', fontSize: 12, fontWeight: 700 }}>TOTAL</td>
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

  const { data: run, isLoading: runLoading, refetch: refetchRun } = useQuery({
    queryKey: ['recon-run', id],
    queryFn:  () => api.get(`/reconciliation/runs/${id}`).then(r => r.data),
    refetchInterval: (data) => data?.status === 'processing' ? 3000 : false,
  });

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
    queryFn:  () => api.get(`/reconciliation/runs/${id}/lines${status ? `?status=${status}` : ''}&limit=500`).then(r => r.data),
    enabled:  activeTab !== 'overview',
  });

  const allLines       = linesQuery('').data?.lines       || [];
  const unmatchedLines = linesQuery('unmatched').data?.lines || [];
  const matchedLines   = linesQuery('matched').data?.lines   || [];
  const correctedLines = linesQuery('corrected').data?.lines || [];

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'unmatched',  label: `Needs Review (${run?.unmatched_count || 0})`, alert: (run?.unmatched_count || 0) > 0 },
    { key: 'matched',    label: `Matched (${run?.matched_count || 0})` },
    { key: 'corrected',  label: `Corrected (${run?.corrected_count || 0})` },
    { key: 'all',        label: 'All Lines' },
  ];

  const currentLines = {
    unmatched: unmatchedLines,
    matched:   matchedLines,
    corrected: correctedLines,
    all:       allLines,
  }[activeTab] || [];

  if (runLoading) {
    return <div style={{ color: '#666', fontSize: 13, padding: 40 }}>Loading…</div>;
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>
            {run.carrier_name} — {run.invoice_ref || `Run #${run.id}`}
          </h1>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {run.invoice_date ? new Date(run.invoice_date).toLocaleDateString('en-GB') : '—'} · Started {new Date(run.created_at).toLocaleDateString('en-GB')}
            {run.status === 'processing' && <span style={{ color: '#79AAFF', marginLeft: 10 }}><RefreshCw size={11} style={{ display: 'inline' }} /> Processing…</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {run.finalized && (
            <span style={{ color: '#00C853', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={13} />Finalized
            </span>
          )}
          {run.status === 'failed' && (
            <span style={{ color: '#FF5252', fontSize: 12, fontWeight: 700 }}>✗ Run Failed</span>
          )}
          {!run.finalized && run.status === 'needs_review' && (
            <span style={{ color: '#FFB300', fontSize: 12, fontWeight: 700 }}>⚠ Needs Review</span>
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
          const psColor  = ps == null ? '#555' : ps === 0 ? '#FF5252' : '#00C853';
          const psValue  = ps == null ? 'Pending…' : ps.toLocaleString();
          const psBorder = ps === 0 ? '1px solid rgba(213,0,0,0.4)' : card.border;
          return (
            <div key="pool" style={{ ...card, border: psBorder }}>
              <div style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Verified Pool</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: psColor }}>{psValue}</div>
              {ps === 0 && <div style={{ fontSize: 10, color: '#FF5252', marginTop: 4 }}>Carrier name mismatch?</div>}
            </div>
          );
        })()}
        {[
          { label: 'Total Lines', value: total.toLocaleString(), color: '#E6EDF3' },
          { label: 'Matched', value: `${run.matched_count || 0} (${matchedPct}%)`, color: '#00C853' },
          { label: 'Corrected', value: `${run.corrected_count || 0} (${correctedPct}%)`, color: '#FF8F00' },
          { label: 'Unmatched', value: `${run.unmatched_count || 0} (${unmatchedPct}%)`, color: (run.unmatched_count || 0) > 0 ? '#FFB300' : '#555' },
          { label: 'Automation Rate', value: run.automation_rate != null ? `${run.automation_rate}%` : '—', color: parseFloat(run.automation_rate) >= 80 ? '#00C853' : '#FFB300' },
        ].map(({ label, value, color }) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              color: activeTab === tab.key ? '#E6EDF3' : '#666',
              borderBottom: `2px solid ${activeTab === tab.key ? '#00C853' : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.alert && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB300', display: 'inline-block' }} />}
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
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3', marginBottom: 16 }}>Result breakdown</div>
            {[
              { label: 'Matched',   count: run.matched_count   || 0, color: '#00C853' },
              { label: 'Corrected', count: run.corrected_count || 0, color: '#FF8F00' },
              { label: 'Unmatched', count: run.unmatched_count || 0, color: '#FFB300' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: '#AAA' }}>{label}</span>
                  <span style={{ color, fontWeight: 700 }}>{count.toLocaleString()} / {total.toLocaleString()}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                  <div style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Run details */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3', marginBottom: 16 }}>Run details</div>
            {[
              ['Carrier',       run.carrier_name],
              ['Invoice ref',   run.invoice_ref || '—'],
              ['Invoice date',  run.invoice_date ? new Date(run.invoice_date).toLocaleDateString('en-GB') : '—'],
              ['Started',       new Date(run.created_at).toLocaleString('en-GB')],
              ['Completed',     run.completed_at ? new Date(run.completed_at).toLocaleString('en-GB') : '—'],
              ['Created by',    run.created_by_name || 'System'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                <span style={{ color: '#888' }}>{label}</span>
                <span style={{ color: '#E6EDF3' }}>{value}</span>
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
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
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
              <div style={{ fontSize: 12, color: '#888' }}>
                The reconciliation engine encountered an error during processing. Check Railway logs for details, then delete this run and re-upload the CSV.
              </div>
            </div>
          )}

          {/* Finalize CTA — show when no unmatched, run completed successfully, not yet finalized */}
          {(run.unmatched_count || 0) === 0 && !run.finalized && (run.status === 'complete' || run.status === 'needs_review') && (
            <div style={{ ...card, border: '1px solid rgba(0,200,83,0.25)', background: 'rgba(0,200,83,0.06)', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#00C853' }}>Ready to finalize</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
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
              runId={id}
            />
          </div>
        </>
      )}

      {/* Line tables for other tabs */}
      {activeTab !== 'overview' && activeTab !== 'unmatched' && (
        <div style={card}>
          <LinesTable
            lines={currentLines}
            showResolve={false}
            onResolve={(line) => { setDefaultResolveType(null); setResolvingLine(line); }}
            onResolveAsSurcharge={(line) => { setDefaultResolveType('map_to_surcharge'); setResolvingLine(line); }}
            runId={id}
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
    </div>
  );
}
