/**
 * RunDetailPage  —  /reconciliation/:id
 *
 * Shows the full results for a single reconciliation run.
 * Tabs: Overview | Matched | Corrected | Unmatched (human review queue) | Mappings
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle,
  X, Check, Lock, Send, Download, ChevronRight,
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
    corrected:    { color: '#79AAFF', bg: 'rgba(30,100,200,0.15)', border: 'rgba(30,100,200,0.4)', label: 'Corrected' },
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
function ReasonLabel({ reason }) {
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
function ResolveDrawer({ line, courierId, onClose, onResolved }) {
  const isUnknownCode = line.unmatched_reason === 'unknown_service_code';

  // For unknown service code lines default straight into the mapping flow
  const [scope,           setScope]           = useState('once');
  const [saveRule,        setSaveRule]        = useState(isUnknownCode);   // "Save as Permanent Rule" checkbox
  const [ruleScope,       setRuleScope]       = useState('global');        // 'global' | 'customer'
  const [resolutionType,  setResolutionType]  = useState(isUnknownCode ? 'map_to_service' : '');
  const [resolutionValue, setResolutionValue] = useState(
    // Pre-populate with suggested service if the engine found one
    isUnknownCode && line.suggested_service_id ? String(line.suggested_service_id) : ''
  );
  const [notes,    setNotes]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['recon-services', courierId],
    queryFn:  () => api.get(`/reconciliation/courier-services?carrier_id=${courierId}`).then(r => r.data),
    enabled:  !!courierId,
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

        {/* Resolution type — hidden for unknown_service_code (always map_to_service) */}
        {!isUnknownCode && (
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, fontWeight: 600 }}>RESOLUTION TYPE</label>
            <select style={inputSt} value={resolutionType} onChange={e => setResolutionType(e.target.value)}>
              <option value=''>— Select type —</option>
              <option value='accept'>Accept charge as-is</option>
              <option value='map_to_service'>Map to internal service</option>
              <option value='map_to_customer'>Map account to customer</option>
              <option value='accept_delta'>Accept delta as tolerance</option>
              <option value='reject'>Reject / dispute charge</option>
            </select>
          </div>
        )}

        {/* Service mapping dropdown */}
        {(isUnknownCode || resolutionType === 'map_to_service') && (
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

          {/* Rule scope — only visible when saving a service code mapping */}
          {saveRule && isUnknownCode && (
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

// ─── Lines table ──────────────────────────────────────────────────────────────
function LinesTable({ lines, showResolve, onResolve }) {
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
                {line.tracking_number ? line.tracking_number.slice(-12) : '—'}
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
                {line.delta != null ? (
                  <span style={{ color: parseFloat(line.delta) > 0.01 ? '#FF5252' : parseFloat(line.delta) < -0.01 ? '#00C853' : '#555' }}>
                    {parseFloat(line.delta) > 0 ? '+' : ''}£{parseFloat(line.delta).toFixed(2)}
                  </span>
                ) : '—'}
              </td>
              <td style={{ padding: '9px 10px' }}><StatusBadge status={line.status} /></td>
              <td style={{ padding: '9px 10px' }}>
                <ReasonLabel reason={line.unmatched_reason} />
                {line.corrected_by && <span style={{ fontSize: 10, color: '#666' }}>via {line.corrected_by}</span>}
              </td>
              <td style={{ padding: '9px 10px' }}>
                {showResolve && line.status === 'unmatched' && (
                  <button style={{ ...btnGhost, padding: '4px 8px', fontSize: 10 }} onClick={() => onResolve(line)}>
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lines.length === 0 && (
        <div style={{ textAlign: 'center', color: '#555', fontSize: 12, padding: '30px 0' }}>No lines in this category</div>
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
  const [activeTab,     setActiveTab]     = useState('overview');
  const [resolvingLine, setResolvingLine] = useState(null);
  const [finalizing,    setFinalizing]    = useState(false);
  const [finalizeError, setFinalizeError] = useState('');

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
          {!run.finalized && run.status === 'needs_review' && (
            <span style={{ color: '#FFB300', fontSize: 12, fontWeight: 700 }}>⚠ Needs Review</span>
          )}
          {!run.finalized && run.unmatched_count === 0 && run.status !== 'processing' && (
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Lines', value: total.toLocaleString(), color: '#E6EDF3' },
          { label: 'Matched', value: `${run.matched_count || 0} (${matchedPct}%)`, color: '#00C853' },
          { label: 'Corrected', value: `${run.corrected_count || 0} (${correctedPct}%)`, color: '#79AAFF' },
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
              { label: 'Corrected', count: run.corrected_count || 0, color: '#79AAFF' },
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

          {/* Finalize CTA — show when no unmatched and not yet finalized */}
          {(run.unmatched_count || 0) === 0 && !run.finalized && run.status !== 'processing' && (
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
        </>
      )}

      {/* Line tables */}
      {activeTab !== 'overview' && (
        <div style={card}>
          <LinesTable
            lines={currentLines}
            showResolve={activeTab === 'unmatched'}
            onResolve={setResolvingLine}
          />
        </div>
      )}

      {/* Resolve drawer */}
      {resolvingLine && (
        <ResolveDrawer
          line={resolvingLine}
          courierId={run.carrier_id}
          onClose={() => setResolvingLine(null)}
          onResolved={() => {
            qc.invalidateQueries({ queryKey: ['recon-run', id] });
            qc.invalidateQueries({ queryKey: ['recon-lines', id] });
            setResolvingLine(null);
          }}
        />
      )}
    </div>
  );
}
