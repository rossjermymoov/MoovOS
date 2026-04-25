import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, CheckCircle, XCircle, AlertCircle,
  Edit2, Check, X, RefreshCw, ChevronLeft, ChevronRight, Bell,
  Bug, FileJson, RotateCcw, Zap,
} from 'lucide-react';
import { billingApi } from '../../api/billing';
import { customersApi } from '../../api/customers';
import { format, parseISO } from 'date-fns';
import { getCourierLogo } from '../../utils/courierLogos';

// ─── CustomerPicker ───────────────────────────────────────────────────────────
// Custom dark-themed dropdown — native <select> uses OS chrome which ignores
// CSS colour on macOS, making options invisible on the light system dropdown.

function CustomerPicker({ customers, value, onChange }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const ref                   = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const FIXED = [
    { value: '',            label: 'All Customers' },
    { value: 'unassigned',  label: '⚠ Unassigned' },
  ];
  const filtered = search
    ? customers.filter(c => c.business_name?.toLowerCase().includes(search.toLowerCase()))
    : customers;

  const selectedLabel =
    value === ''           ? 'All Customers' :
    value === 'unassigned' ? '⚠ Unassigned'  :
    customers.find(c => c.id === value)?.business_name || 'All Customers';

  function pick(v) { onChange(v); setOpen(false); setSearch(''); }

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 180 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 9999, padding: '5px 14px', color: '#fff', fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
        <span style={{ marginLeft: 6, color: '#555', flexShrink: 0 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 200,
          background: '#1A1D35', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          minWidth: 220, maxHeight: 320, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers…"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
                color: '#fff', fontSize: 12, padding: '5px 10px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Options */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {!search && FIXED.map(o => (
              <button key={o.value} type="button" onClick={() => pick(o.value)} style={{
                width: '100%', textAlign: 'left', background: value === o.value ? 'rgba(0,200,83,0.12)' : 'none',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                color: value === o.value ? '#00C853' : o.value === 'unassigned' ? '#FFC107' : '#AAAAAA',
                padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {o.label}
              </button>
            ))}
            {filtered.map(c => (
              <button key={c.id} type="button" onClick={() => pick(c.id)} style={{
                width: '100%', textAlign: 'left', background: value === c.id ? 'rgba(0,200,83,0.12)' : 'none',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                color: value === c.id ? '#00C853' : '#fff',
                padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {c.business_name}
              </button>
            ))}
            {search && filtered.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#555', fontStyle: 'italic' }}>No match</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

// ─── Inline price editor + surcharge hover ───────────────────────────────────

function PriceCell({ charge, onSave, onDebug }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const [hovering, setHovering] = useState(false);
  const [surcharges, setSurcharges] = useState(null); // null = not yet loaded
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  // Lazy-load surcharges when hovering a priced charge that has a shipment
  useEffect(() => {
    if (!hovering || !charge.shipment_id || charge.price == null || surcharges !== null) return;
    billingApi.getShipmentCharges(charge.shipment_id)
      .then(rows => setSurcharges(rows))
      .catch(() => setSurcharges([]));
  }, [hovering, charge.shipment_id, charge.price, surcharges]);

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
        <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          style={{ width: 72, background: 'rgba(255,255,255,0.08)', border: '1px solid #00C853',
            borderRadius: 9999, color: '#fff', padding: '3px 10px', fontSize: 13, fontWeight: 700 }} />
        <button onClick={commit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C853', padding: 2 }}><Check size={13} /></button>
        <button onClick={cancel}  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888',    padding: 2 }}><X size={13} /></button>
      </div>
    );
  }

  if (charge.price == null) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <button onClick={startEdit} style={{
          background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.4)',
          borderRadius: 5, color: '#FFC107', padding: '3px 10px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <AlertCircle size={11} /> Set Price
        </button>
        {charge.price_failure_reason && (
          <button onClick={onDebug} title="Click to run full diagnostic" style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: 10, color: '#F44336', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 3, textAlign: 'right', lineHeight: 1.3,
          }}>
            <Bug size={9} style={{ flexShrink: 0 }} />{charge.price_failure_reason}
          </button>
        )}
      </div>
    );
  }

  // Priced — surcharge total comes from the API immediately; hover loads line-item names
  const basePrice      = parseFloat(charge.price);
  const surchargeTotal = parseFloat(charge.surcharge_total || 0);
  const surchargeCount = parseInt(charge.surcharge_count || 0);
  const totalCharge    = basePrice + surchargeTotal;
  const hasSurcharges  = surchargeCount > 0;
  const detailLoaded   = Array.isArray(surcharges);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Surcharge summary — always visible when surcharges exist */}
      {hasSurcharges && (
        <div style={{ fontSize: 11, color: '#FFC107' }}>
          +{surchargeCount} surcharge{surchargeCount > 1 ? 's' : ''}: {gbp(surchargeTotal)}
        </div>
      )}

      {/* Total (base + surcharges) — always shows correct total */}
      <button onClick={startEdit} style={{
        background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.25)',
        borderRadius: 5, color: '#00C853', padding: '3px 10px', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        {gbp(totalCharge)}
        <Edit2 size={10} style={{ opacity: 0.6 }} />
      </button>

      {/* Hover tooltip — lazy-loads surcharge line items for detail */}
      {hovering && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
          background: '#1A1D35', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '10px 14px', minWidth: 220,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Charge breakdown</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#AAAAAA', marginBottom: 4 }}>
            <span>Base charge</span>
            <span style={{ fontFamily: 'monospace', color: '#ccc' }}>{gbp(basePrice)}</span>
          </div>
          {!detailLoaded && hasSurcharges && (
            <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>Loading…</div>
          )}
          {detailLoaded && surcharges.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 3 }}>
              <span>+ {s.name || 'Surcharge'}</span>
              <span style={{ fontFamily: 'monospace', color: '#FFC107' }}>{gbp(s.price)}</span>
            </div>
          ))}
          {hasSurcharges && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: '#fff' }}>Total</span>
              <span style={{ fontFamily: 'monospace', color: '#00C853' }}>{gbp(totalCharge)}</span>
            </div>
          )}
          {!hasSurcharges && (
            <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>No surcharges applied</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pricing Debug Modal ──────────────────────────────────────────────────────

function PriceDebugModal({ charge, onClose, onRepriced }) {
  const qc = useQueryClient();

  const { data: trace, isLoading, error } = useQuery({
    queryKey: ['charge-debug', charge.id],
    queryFn: () => billingApi.debugCharge(charge.id),
  });

  const repriceMut = useMutation({
    mutationFn: () => billingApi.repriceCharge(charge.id),
    onSuccess: (result) => {
      if (result.ok) {
        qc.invalidateQueries(['billing-charges']);
        qc.invalidateQueries(['billing-stats']);
        onRepriced(result.price);
      }
    },
  });

  const stepColor = (step) => {
    if (!trace) return '#555';
    if (step.step === '3a') {
      if (!step.pricing_model_found) return '#555';            // no new-model rows — neutral
      if (!step.will_use_new_model) return '#FFC107';          // rows exist but match failed — amber
      return step.result?.startsWith('MATCH') ? '#00C853' : '#FFC107';
    }
    if (step.step === 3) {
      if (step.will_skip_legacy) return '#555';                // new model won — show as inactive
      return step.matched_rows > 0 ? '#00C853' : '#F44336';
    }
    if (step.step === 4) {
      if (step.skipped) return '#555';
      return step.selected_band ? '#00C853' : '#F44336';
    }
    if (step.step === 2 && !step.resolved) return '#F44336';
    return '#00C853';
  };

  const conclusionColor = trace?.conclusion?.priced ? '#00C853' : '#F44336';

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  };

  const box = {
    background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, width: '100%', maxWidth: 780,
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Bug size={16} style={{ color: '#FFC107' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>
              Pricing Diagnostic
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {charge.order_id || charge.id.slice(0, 8)} · {charge.customer_name || 'Unknown customer'}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          {isLoading && (
            <div style={{ color: '#888', fontSize: 13, padding: 20, textAlign: 'center' }}>
              Running diagnostics…
            </div>
          )}
          {error && (
            <div style={{ color: '#F44336', fontSize: 13, padding: 20 }}>
              Error loading diagnostics: {error.message}
            </div>
          )}
          {trace && (
            <>
              {/* Steps */}
              {trace.steps.map(step => (
                <div key={step.step} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${stepColor(step)}22`,
                  borderLeft: `3px solid ${stepColor(step)}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 10,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 8,
                  }}>
                    <span style={{
                      background: stepColor(step) + '22',
                      border: `1px solid ${stepColor(step)}55`,
                      color: stepColor(step),
                      borderRadius: 20, padding: '1px 8px',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      Step {step.step}
                    </span>
                    <span style={{ color: '#ccc', fontWeight: 600, fontSize: 13 }}>{step.title}</span>
                  </div>

                  {/* Render key fields */}
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#aaa', lineHeight: 1.7 }}>
                    {step.step === 1 && <>
                      <div><span style={{ color: '#888' }}>account_number:</span> <span style={{ color: step.account_number ? '#fff' : '#F44336' }}>{step.account_number || 'null — not in webhook payload'}</span></div>
                      <div><span style={{ color: '#888' }}>dc_service_id:</span> <span style={{ color: '#fff' }}>{step.dc_service_id || 'null'}</span></div>
                      <div><span style={{ color: '#888' }}>service_name:</span> <span style={{ color: '#fff' }}>{step.service_name || 'null'}</span></div>
                      <div><span style={{ color: '#888' }}>parcel_count:</span> <span style={{ color: '#fff' }}>{step.parcel_count}</span></div>
                      <div><span style={{ color: '#888' }}>total_weight_kg:</span> <span style={{ color: step.total_weight_kg != null ? '#fff' : '#FFC107' }}>{step.total_weight_kg != null ? `${step.total_weight_kg} kg` : 'null — not in webhook'}</span></div>
                      <div><span style={{ color: '#888' }}>weight_per_parcel:</span> <span style={{ color: step.weight_per_parcel != null ? '#fff' : '#FFC107' }}>{step.weight_per_parcel != null ? `${step.weight_per_parcel} kg` : 'null'}</span></div>
                      {step.postcode && <div><span style={{ color: '#888' }}>postcode:</span> <span style={{ color: '#fff' }}>{step.postcode}</span> <span style={{ color: '#666' }}>→ outward: {step.outward_code || '?'}</span></div>}
                    </>}

                    {step.step === 2 && <>
                      <div><span style={{ color: '#888' }}>customer_found:</span> <span style={{ color: step.resolved ? '#00C853' : '#F44336', fontWeight: 700 }}>{step.resolved ? 'YES' : 'NO'}</span></div>
                      {step.resolved && <>
                        <div><span style={{ color: '#888' }}>customer_name:</span> <span style={{ color: '#fff' }}>{step.customer_name}</span></div>
                        <div><span style={{ color: '#888' }}>resolved_via:</span> <span style={{ color: '#00BCD4' }}>{step.resolved_via}</span></div>
                      </>}
                      {(step.lookup_attempts || []).length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {(step.lookup_attempts || []).map((a, i) => (
                            <div key={i} style={{ padding: '2px 0' }}>
                              <span style={{ color: a.found ? '#00C853' : '#555' }}>{a.found ? '✓' : '✗'}</span>
                              <span style={{ color: '#666', marginLeft: 6 }}>{a.tried}</span>
                              {a.found && a.row && <span style={{ color: '#aaa', marginLeft: 6 }}>→ {a.row.business_name}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </>}

                    {step.step === '3a' && <>
                      <div>
                        <span style={{ color: '#888' }}>pricing_model_found:</span>{' '}
                        <span style={{ color: step.pricing_model_found ? '#00C853' : '#555', fontWeight: 700 }}>
                          {step.pricing_model_found ? 'YES' : 'NO — customer has no customer_service_pricing entry for this service'}
                        </span>
                      </div>
                      {step.pricing_model_found && <>
                        <div style={{ marginTop: 4 }}>
                          <span style={{ color: '#888' }}>result:</span>{' '}
                          <span style={{ color: step.result?.startsWith('MATCH') ? '#00C853' : '#FFC107', fontWeight: 700 }}>
                            {step.result}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#888' }}>will_use_new_model:</span>{' '}
                          <span style={{ color: step.will_use_new_model ? '#00C853' : '#F44336', fontWeight: 700 }}>
                            {step.will_use_new_model ? 'YES — legacy customer_rates will NOT be used' : 'NO — legacy fallback will run'}
                          </span>
                        </div>
                        {(step.bands_in_db || []).length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>Rate bands in carrier rate card:</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                              <thead>
                                <tr>
                                  {['zone','weight range','cost price','pricing type','markup / fee'].map(h => (
                                    <th key={h} style={{ color: '#555', fontWeight: 700, padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {step.bands_in_db.map((b, i) => (
                                  <tr key={i}>
                                    <td style={{ padding: '3px 8px', color: '#aaa' }}>{b.zone}</td>
                                    <td style={{ padding: '3px 8px', color: '#aaa' }}>{b.range}</td>
                                    <td style={{ padding: '3px 8px', color: '#888' }}>£{parseFloat(b.cost_price || 0).toFixed(2)}</td>
                                    <td style={{ padding: '3px 8px', color: '#888' }}>{b.pricing_type || '—'}</td>
                                    <td style={{ padding: '3px 8px', color: '#00C853' }}>
                                      {b.pricing_type === 'markup' ? `+${b.markup_pct}%` : b.pricing_type === 'fixed_fee' ? `+£${parseFloat(b.fixed_fee || 0).toFixed(2)}` : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>}
                    </>}

                    {step.step === 3 && <>
                      {step.will_skip_legacy && (
                        <div style={{ color: '#555', fontStyle: 'italic' }}>⚡ New model resolved a price — legacy customer_rates not used by live engine.</div>
                      )}
                      <div><span style={{ color: '#888' }}>searched_for:</span> <span style={{ color: '#fff' }}>{step.searched_for?.service_code || '—'} / {step.searched_for?.service_name || '—'}</span></div>
                      <div><span style={{ color: '#888' }}>rows_matched:</span> <span style={{ color: step.matched_rows > 0 ? '#00C853' : step.will_skip_legacy ? '#555' : '#F44336', fontWeight: 700 }}>{step.matched_rows ?? 0}</span></div>
                      {(step.matched_rates || []).length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                            <thead>
                              <tr>
                                {['service_code','service_name','zone','weight_class','price'].map(h => (
                                  <th key={h} style={{ color: '#555', fontWeight: 700, padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(step.matched_rates || []).map((r, i) => (
                                <tr key={i}>
                                  <td style={{ padding: '3px 8px', color: '#aaa' }}>{r.service_code || '—'}</td>
                                  <td style={{ padding: '3px 8px', color: '#aaa' }}>{r.service_name || '—'}</td>
                                  <td style={{ padding: '3px 8px', color: '#aaa' }}>{r.zone_name || '—'}</td>
                                  <td style={{ padding: '3px 8px', color: '#aaa' }}>{r.weight_class_name || '—'}</td>
                                  <td style={{ padding: '3px 8px', color: '#00C853' }}>£{parseFloat(r.price || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {(step.all_services_on_customer || []).length > 0 && step.matched_rows === 0 && (
                        <div style={{ marginTop: 8, color: '#666' }}>
                          Customer has {step.all_services_on_customer.length} other service(s): {step.all_services_on_customer.map(s => s.service_name).join(', ')}
                        </div>
                      )}
                    </>}

                    {step.step === 4 && <>
                      {step.skipped && (
                        <div style={{ color: '#555', fontStyle: 'italic' }}>⚡ New model resolved a price — legacy not used.</div>
                      )}
                      {!step.skipped && <>
                        <div>
                          <span style={{ color: '#888' }}>weight_per_parcel:</span>{' '}
                          <span style={{ color: '#fff' }}>{step.weight_per_parcel_kg != null ? `${step.weight_per_parcel_kg} kg` : 'null'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#888' }}>zone_resolved:</span>{' '}
                          <span style={{ color: step.zone_resolved ? '#00C853' : '#F44336', fontWeight: 700 }}>
                            {step.zone_resolved || 'none'}
                          </span>
                        </div>
                        {step.error && (
                          <div style={{ color: '#F44336', marginTop: 4 }}>✗ {step.error}</div>
                        )}
                        {(step.zone_rows || []).length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                              <thead>
                                <tr>
                                  {['zone','weight class','min kg','max kg','price','covers weight?'].map(h => (
                                    <th key={h} style={{ color: '#555', fontWeight: 700, padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {step.zone_rows.map((r, i) => (
                                  <tr key={i} style={{ background: r.covers ? 'rgba(0,200,83,0.06)' : 'transparent' }}>
                                    <td style={{ padding: '3px 8px', color: '#aaa' }}>{r.zone_name}</td>
                                    <td style={{ padding: '3px 8px', color: '#aaa' }}>{r.weight_class_name}</td>
                                    <td style={{ padding: '3px 8px', color: '#666' }}>{r.min_weight_kg ?? 'any'}</td>
                                    <td style={{ padding: '3px 8px', color: '#666' }}>{r.max_weight_kg ?? 'any'}</td>
                                    <td style={{ padding: '3px 8px', color: '#00C853' }}>£{parseFloat(r.price || 0).toFixed(2)}</td>
                                    <td style={{ padding: '3px 8px', color: r.covers ? '#00C853' : '#555', fontWeight: 700 }}>{r.covers ? '✓ yes' : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {step.selected_band && (
                          <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(0,200,83,0.07)', borderRadius: 5, borderLeft: '2px solid #00C853' }}>
                            <span style={{ color: '#00C853' }}>✓ Selected: </span>
                            <span style={{ color: '#fff' }}>{step.selected_band.zone} · {step.selected_band.weight_class}</span>
                            <span style={{ color: '#aaa' }}> @ £{parseFloat(step.selected_band.price || 0).toFixed(2)}</span>
                          </div>
                        )}
                      </>}
                    </>}
                  </div>
                </div>
              ))}

              {/* Conclusion */}
              {trace.conclusion && (
                <div style={{
                  background: trace.conclusion.priced ? 'rgba(0,200,83,0.07)' : 'rgba(244,67,54,0.07)',
                  border: `1px solid ${conclusionColor}33`,
                  borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ fontWeight: 700, color: conclusionColor, fontSize: 14, marginBottom: 6 }}>
                    {trace.conclusion.priced ? '✓ Rate found' : '✗ No rate — manual price needed'}
                  </div>
                  {trace.conclusion.price != null && (
                    <div style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>
                      Price: <strong>£{trace.conclusion.price.toFixed(2)}</strong>
                      {trace.conclusion.zone_name && ` · ${trace.conclusion.zone_name}`}
                      {trace.conclusion.weight_class_name && ` · ${trace.conclusion.weight_class_name}`}
                    </div>
                  )}
                  {trace.conclusion.note && (
                    <div style={{ color: '#aaa', fontSize: 12 }}>{trace.conclusion.note}</div>
                  )}
                  {trace.conclusion.reason && (
                    <div style={{ color: '#F44336', fontSize: 12, marginBottom: 6 }}>{trace.conclusion.reason}</div>
                  )}
                  {trace.conclusion.fix && (
                    <div style={{
                      background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)',
                      borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#FFC107', marginTop: 8,
                    }}>
                      <strong>Fix:</strong> {trace.conclusion.fix}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        }}>
          {/* Left: error or current price context */}
          <div style={{ fontSize: 12 }}>
            {repriceMut.isError && (
              <span style={{ color: '#F44336' }}>
                ✗ Reprice failed — {repriceMut.error?.message || 'unknown error'}
              </span>
            )}
            {repriceMut.isSuccess && !repriceMut.data?.ok && (
              <span style={{ color: '#F44336' }}>
                ✗ {repriceMut.data?.message || 'No rate found'}
              </span>
            )}
            {repriceMut.isSuccess && repriceMut.data?.ok && (
              <span style={{ color: '#00C853' }}>✓ Price updated</span>
            )}
            {!repriceMut.isError && !repriceMut.isSuccess && charge.price != null && (
              <span style={{ color: '#555' }}>
                Current stored price: £{parseFloat(charge.price).toFixed(2)}
              </span>
            )}
          </div>
          {/* Right: buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, color: '#888', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
              Close
            </button>
            {trace?.conclusion?.priced && (
              <button
                onClick={() => repriceMut.mutate()}
                disabled={repriceMut.isPending}
                style={{
                  background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)',
                  borderRadius: 8, color: '#00C853', padding: '8px 18px',
                  cursor: repriceMut.isPending ? 'wait' : 'pointer',
                  fontSize: 13, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: repriceMut.isPending ? 0.6 : 1,
                }}
              >
                <RotateCcw size={13} />
                {repriceMut.isPending ? 'Applying…' : `Apply £${trace.conclusion.price?.toFixed(2)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Webhook Payload Modal ─────────────────────────────────────────────────────

function WebhookPayloadModal({ charge, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['charge-payload', charge.id],
    queryFn: () => billingApi.getPayload(charge.id),
  });

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  };

  const box = {
    background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, width: '100%', maxWidth: 860,
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <FileJson size={16} style={{ color: '#00BCD4' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Webhook Payload</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {charge.order_id || charge.id.slice(0, 8)} · {charge.customer_name || 'Unknown'}
              {data?.received_at && ` · received ${format(parseISO(data.received_at), 'd MMM yyyy HH:mm')}`}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          {isLoading && <div style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: 20 }}>Loading payload…</div>}
          {error && <div style={{ color: '#F44336', fontSize: 13 }}>Error: {error.message}</div>}
          {data && (
            <pre style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '14px 16px',
              fontSize: 11,
              color: '#aaa',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {JSON.stringify(data.payload, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, color: '#888', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [25, 50, 100];
const BILLED_OPTS = [
  { value: '', label: 'All' },
  { value: 'false', label: 'Unbilled' },
  { value: 'true', label: 'Billed' },
];
const VERIFIED_OPTS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
];

export default function FinancePage() {
  const qc = useQueryClient();

  const [filters, setFilters] = useState({
    search: '',
    customer_id: '',
    billed: '',
    verified: '',
    date_from: '',
    date_to: '',
    parcel_type: '',
  });
  const [showAlerts, setShowAlerts] = useState(true);
  const [showUnpriced, setShowUnpriced] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [debugCharge, setDebugCharge] = useState(null);
  const [payloadCharge, setPayloadCharge] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [surchargeRunning, setSurchargeRunning] = useState(false);
  const [purgeRunning, setPurgeRunning] = useState(false);
  const [relinkRunning, setRelinkRunning] = useState(false);

  // Customer dropdown data
  const { data: custData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list({ limit: 500 }),
    staleTime: 60_000,
  });
  const customers = custData?.data || [];

  // Aged alerts
  const { data: agedData } = useQuery({
    queryKey: ['billing-aged-alerts'],
    queryFn: () => billingApi.getAgedAlerts(14),
    staleTime: 30_000,
  });
  const agedAlerts = agedData?.alerts || [];

  // Stats
  const statsParams = {
    customer_id: filters.customer_id === 'unassigned' ? undefined : (filters.customer_id || undefined),
    unassigned: filters.customer_id === 'unassigned' ? 'true' : undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  };
  const { data: stats } = useQuery({
    queryKey: ['billing-stats', statsParams],
    queryFn: () => billingApi.getStats(statsParams),
    staleTime: 0,               // always re-fetch on mount/focus so backfill totals are current
    refetchOnWindowFocus: true,
  });

  // Charges list
  const chargesParams = {
    charge_type: 'courier',
    customer_id: filters.customer_id === 'unassigned' ? undefined : (filters.customer_id || undefined),
    unassigned: filters.customer_id === 'unassigned' ? 'true' : undefined,
    search: filters.search || undefined,
    billed: filters.billed || undefined,
    verified: filters.verified || undefined,
    // Unassigned charges may be cancelled — don't hard-filter when looking for them
    cancelled: filters.customer_id === 'unassigned' ? undefined : 'false',
    unpriced: showUnpriced ? 'true' : undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    parcel_type: filters.parcel_type || undefined,
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

  // Unpriced is now server-side — displayCharges is just the API result
  const displayCharges = charges;

  // Mutations
  const patch = useMutation({
    mutationFn: ({ id, data }) => billingApi.updateCharge(id, data),
    onSuccess: () => { qc.invalidateQueries(['billing-charges']); qc.invalidateQueries(['billing-stats']); },
  });

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
    setOffset(0);
  }

  function clearAll() {
    setFilters({ search: '', customer_id: '', billed: '', verified: '', date_from: '', date_to: '', parcel_type: '' });
    setShowUnpriced(false);
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

  async function runPurgeTracking() {
    if (!confirm('This will permanently delete all charges and shipments that were created by tracking webhooks (not shipment.created events). Continue?')) return;
    setPurgeRunning(true);
    try {
      const result = await billingApi.purgeTrackingEvents();
      setBatchResult({ purge: true, ...result });
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
    } catch (err) {
      setBatchResult({ error: err.message });
    } finally {
      setPurgeRunning(false);
    }
  }

  async function runRelink() {
    setRelinkRunning(true);
    setBatchResult(null);
    try {
      const result = await billingApi.relinkCustomers();
      setBatchResult({ relink: true, ...result });
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
    } catch (err) {
      setBatchResult({ error: err.message });
    } finally {
      setRelinkRunning(false);
    }
  }

  async function runBatchReprice() {
    if (!confirm('This will attempt to auto-price all unpriced charges by re-parsing their webhook payloads. Continue?')) return;
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const result = await billingApi.batchReprice();
      setBatchResult(result);
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
    } catch (err) {
      setBatchResult({ error: err.message });
    } finally {
      setBatchRunning(false);
    }
  }

  async function runBatchSurcharges() {
    const customerId = filters.customer_id || null;
    const scope = customerId ? 'the selected customer' : 'all customers';
    if (!confirm(`Apply surcharges to all priced charges for ${scope}? This is safe to re-run — existing surcharges are skipped.`)) return;
    setSurchargeRunning(true);
    setBatchResult(null);
    try {
      const result = await billingApi.batchApplySurcharges(customerId);
      setBatchResult({ surcharge: true, ...result });
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
    } catch (err) {
      setBatchResult({ error: err.message });
    } finally {
      setSurchargeRunning(false);
    }
  }

  const th = { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '10px 12px', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' };

  const td = { padding: '10px 12px', fontSize: 13, color: '#CCC', verticalAlign: 'middle',
    borderBottom: '1px solid rgba(255,255,255,0.04)' };

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853' }}>Finance & Billing</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={runRelink}
            disabled={relinkRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,188,212,0.08)',
              border: '1px solid rgba(0,188,212,0.3)',
              borderRadius: 8, color: '#00BCD4',
              padding: '7px 14px', cursor: relinkRunning ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <RotateCcw size={14} />
            {relinkRunning ? 'Relinking…' : 'Relink customers'}
          </button>
          <button
            onClick={runPurgeTracking}
            disabled={purgeRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(244,67,54,0.08)',
              border: '1px solid rgba(244,67,54,0.3)',
              borderRadius: 8, color: '#F44336',
              padding: '7px 14px', cursor: purgeRunning ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <XCircle size={14} />
            {purgeRunning ? 'Purging…' : 'Remove tracking events'}
          </button>
          <button
            onClick={runBatchSurcharges}
            disabled={surchargeRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: surchargeRunning ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 8, color: '#F59E0B',
              padding: '7px 14px', cursor: surchargeRunning ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <Zap size={14} />
            {surchargeRunning ? 'Applying…' : filters.customer_id ? 'Apply surcharges (customer)' : 'Apply surcharges (all)'}
          </button>
          {stats?.unpriced > 0 && (
            <button
              onClick={runBatchReprice}
              disabled={batchRunning}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: batchRunning ? 'rgba(255,193,7,0.08)' : 'rgba(255,193,7,0.12)',
                border: '1px solid rgba(255,193,7,0.4)',
                borderRadius: 8, color: '#FFC107',
                padding: '7px 14px', cursor: batchRunning ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 700,
              }}
            >
              <Zap size={14} />
              {batchRunning ? 'Pricing…' : `Auto-price ${stats.unpriced} charges`}
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={() => refetch()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Batch reprice result banner */}
      {batchResult && (
        <div style={{
          background: batchResult.error ? 'rgba(244,67,54,0.08)' : 'rgba(0,200,83,0.08)',
          border: `1px solid ${batchResult.error ? 'rgba(244,67,54,0.3)' : 'rgba(0,200,83,0.3)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {batchResult.error ? (
            <span style={{ color: '#F44336', fontSize: 13 }}>Error: {batchResult.error}</span>
          ) : batchResult.purge ? (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ color: '#00C853', fontWeight: 700 }}>✓ Purge complete</span>
              <span style={{ color: '#F44336' }}>{batchResult.charges_deleted} charges removed</span>
              <span style={{ color: '#888' }}>{batchResult.shipments_deleted} shipment records removed</span>
            </div>
          ) : batchResult.relink ? (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ color: '#00C853', fontWeight: 700 }}>✓ {batchResult.linked} shipments relinked</span>
              {batchResult.not_found > 0 && (
                <span style={{ color: '#FFC107' }}>{batchResult.not_found} account IDs not matched</span>
              )}
              <span style={{ color: '#555' }}>of {batchResult.total_unlinked} unlinked total</span>
            </div>
          ) : batchResult.surcharge ? (
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ color: '#00C853', fontWeight: 700 }}>⛽ {batchResult.surcharges_applied} surcharge rows added</span>
                {batchResult.already_had_surcharges > 0 && <span style={{ color: '#555' }}>{batchResult.already_had_surcharges} already had surcharges</span>}
                {batchResult.errors > 0 && <span style={{ color: '#F44336', fontWeight: 700 }}>{batchResult.errors} errors</span>}
                <span style={{ color: '#555' }}>of {batchResult.total_charges} charges processed</span>
              </div>
              {batchResult.first_error && (
                <div style={{ fontSize: 11, color: '#F44336', fontFamily: 'monospace' }}>
                  First error: {batchResult.first_error}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ color: '#00C853', fontWeight: 700 }}>
                ✓ {batchResult.priced} charges priced
              </span>
              {batchResult.no_customer > 0 && (
                <span style={{ color: '#FFC107' }}>
                  {batchResult.no_customer} customer not matched
                </span>
              )}
              {batchResult.no_rate > 0 && (
                <span style={{ color: '#FFC107' }}>
                  {batchResult.no_rate} no rate found
                </span>
              )}
              {batchResult.errors > 0 && (
                <span style={{ color: '#F44336' }}>
                  {batchResult.errors} errors
                </span>
              )}
              <span style={{ color: '#555' }}>of {batchResult.total} total</span>
            </div>
          )}
          <button onClick={() => setBatchResult(null)}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Aged unbilled alert banner */}
      {showAlerts && agedAlerts.length > 0 && (
        <div style={{
          background: 'rgba(255,193,7,0.08)',
          border: '1px solid rgba(255,193,7,0.35)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <Bell size={18} style={{ color: '#FFC107', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#FFC107', fontSize: 14, marginBottom: 4 }}>
              {agedAlerts.length} verified charge{agedAlerts.length !== 1 ? 's' : ''} unbilled for over 14 days
            </div>
            <div style={{ fontSize: 12, color: '#AA8800', lineHeight: 1.5 }}>
              {/* Group by customer */}
              {Object.entries(
                agedAlerts.reduce((acc, a) => {
                  const key = a.customer_name || 'Unknown customer';
                  if (!acc[key]) acc[key] = 0;
                  acc[key]++;
                  return acc;
                }, {})
              ).map(([name, count]) => (
                <span key={name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(255,193,7,0.12)', borderRadius: 20,
                  padding: '2px 10px', marginRight: 6, marginBottom: 4,
                  border: '1px solid rgba(255,193,7,0.25)', color: '#FFC107',
                }}>
                  {name} · {count}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setFilter('verified', 'true'); setFilter('billed', 'false'); }}
            style={{
              background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.4)',
              borderRadius: 6, color: '#FFC107', padding: '5px 12px',
              cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            View all
          </button>
          <button onClick={() => setShowAlerts(false)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

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

          {/* Customer — custom dropdown (native select unusable on macOS) */}
          <CustomerPicker
            customers={customers}
            value={filters.customer_id}
            onChange={v => setFilter('customer_id', v)}
          />

          {/* Parcel type */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parcels</span>
            {[['', 'All'], ['single', 'Single'], ['multi', 'Multi']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter('parcel_type', val)}
                style={{
                  padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: '1px solid',
                  borderColor: filters.parcel_type === val ? '#F59E0B' : 'rgba(255,255,255,0.12)',
                  background: filters.parcel_type === val ? 'rgba(245,158,11,0.12)' : 'transparent',
                  color: filters.parcel_type === val ? '#F59E0B' : '#888',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Verified filter */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified</span>
            {VERIFIED_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setFilter('verified', o.value)}
                style={{
                  padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: '1px solid',
                  borderColor: filters.verified === o.value ? '#00BCD4' : 'rgba(255,255,255,0.12)',
                  background: filters.verified === o.value ? 'rgba(0,188,212,0.12)' : 'transparent',
                  color: filters.verified === o.value ? '#00BCD4' : '#888',
                  cursor: 'pointer',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>

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
          {(filters.search || filters.customer_id || filters.billed || filters.verified || filters.date_from || filters.date_to || filters.parcel_type || showUnpriced) && (
            <button
              onClick={clearAll}
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
                <th style={th}>Service · Zone · Band</th>
                <th style={{ ...th, textAlign: 'right' }}>Charges (ex. VAT)</th>
                <th style={{ ...th, textAlign: 'center' }}>Billed</th>
                <th style={{ ...th, textAlign: 'center' }}>Verified</th>
                <th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: 'center', padding: 40, color: '#555' }}>
                    Loading charges…
                  </td>
                </tr>
              )}
              {!isLoading && displayCharges.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: 'center', padding: 40, color: '#555' }}>
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

                  {/* Order ID + Tracking */}
                  <td style={td}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#CCC' }}>
                      {charge.order_id || '—'}
                    </span>
                    {charge.tracking_codes?.length > 0 && (
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#00BCD4', marginTop: 2 }}>
                        {charge.tracking_codes[0]}
                        {charge.tracking_codes.length > 1 && (
                          <span style={{ color: '#555', marginLeft: 4 }}>+{charge.tracking_codes.length - 1}</span>
                        )}
                      </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {charge.courier && (() => {
                        const logo = getCourierLogo(charge.courier);
                        return logo ? (
                          <div style={{ width: 20, height: 20, borderRadius: 4, background: '#fff', flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={logo} alt={charge.courier} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} onError={e => { e.currentTarget.style.display='none'; }} />
                          </div>
                        ) : null;
                      })()}
                      <div style={{ fontSize: 12, color: '#CCC' }}>{charge.service_name || '—'}</div>
                    </div>
                    {charge.courier && (
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{charge.courier}</div>
                    )}
                    {charge.zone_name && (
                      <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                        {charge.zone_name}{charge.weight_class_name ? ` · ${charge.weight_class_name}` : ''}
                        {charge.price_auto && <span style={{ color: '#00C853', marginLeft: 4 }}>●</span>}
                      </div>
                    )}
                  </td>

                  {/* Charges: base + surcharges + total */}
                  <td style={{ ...td, textAlign: 'right' }}>
                    {charge.cancelled ? (
                      <span style={{ color: '#555', textDecoration: 'line-through', fontSize: 12 }}>
                        {gbp(charge.price)}
                      </span>
                    ) : (
                      <PriceCell charge={charge} onSave={(price) => savePrice(charge, price)} onDebug={() => setDebugCharge(charge)} />
                    )}
                    {charge.price != null && (
                      <div style={{ fontSize: 10, color: '#555', marginTop: 2, textAlign: 'right' }}>
                        VAT {gbp(charge.vat_amount)}
                      </div>
                    )}
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
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                        {/* Debug / Reprice — always available */}
                        <button
                          onClick={() => setDebugCharge(charge)}
                          title={charge.price == null ? 'Diagnose why no price was set' : 'Debug / Reprice this charge'}
                          style={{
                            background: charge.price == null ? 'rgba(255,193,7,0.1)' : 'rgba(123,47,190,0.1)',
                            border: `1px solid ${charge.price == null ? 'rgba(255,193,7,0.35)' : 'rgba(123,47,190,0.35)'}`,
                            borderRadius: 5,
                            color: charge.price == null ? '#FFC107' : '#B39DDB',
                            padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <Bug size={11} /> {charge.price == null ? 'Debug' : 'Reprice'}
                        </button>
                        {/* Webhook payload viewer */}
                        <button
                          onClick={() => setPayloadCharge(charge)}
                          title="View raw webhook payload"
                          style={{
                            background: 'rgba(0,188,212,0.08)', border: '1px solid rgba(0,188,212,0.25)',
                            borderRadius: 5, color: '#00BCD4', padding: '4px 8px',
                            cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <FileJson size={11} />
                        </button>
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

      {/* Pricing debug modal */}
      {debugCharge && (
        <PriceDebugModal
          charge={debugCharge}
          onClose={() => setDebugCharge(null)}
          onRepriced={(price) => {
            setDebugCharge(null);
            qc.invalidateQueries(['billing-charges']);
            qc.invalidateQueries(['billing-stats']);
          }}
        />
      )}

      {/* Webhook payload modal */}
      {payloadCharge && (
        <WebhookPayloadModal
          charge={payloadCharge}
          onClose={() => setPayloadCharge(null)}
        />
      )}
    </div>
  );
}
