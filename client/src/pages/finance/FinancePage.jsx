import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, CheckCircle, XCircle, AlertCircle,
  Edit2, Check, X, RefreshCw, ChevronLeft, ChevronRight, Bell,
  Bug, FileJson, RotateCcw, Zap, MoreHorizontal,
} from 'lucide-react';
import { billingApi } from '../../api/billing';
import { customersApi } from '../../api/customers';
import { format, parseISO } from 'date-fns';
import { getCourierLogo } from '../../utils/courierLogos';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const gbp = (n) =>
  n == null ? '—' : `£${parseFloat(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function fmt(dt) {
  if (!dt) return '—';
  try { return format(parseISO(dt), 'd MMM yyyy'); } catch { return dt; }
}
function fmtTime(dt) {
  if (!dt) return '';
  try { return format(parseISO(dt), 'HH:mm'); } catch { return ''; }
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'var(--mv-ink-52)', bg = 'color-mix(in srgb, var(--mv-ink) 3%, transparent)', onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: bg || 'var(--mv-surface)',
        border: `1px solid var(--mv-purple-200)`,
        boxShadow: '0 0 12px color-mix(in srgb, var(--mv-green) 7%, transparent)',
        borderRadius: 10,
        padding: '14px 18px',
        minWidth: 140,
        flex: 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Flag badge ───────────────────────────────────────────────────────────────

function FlagBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  if (value) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)',
        color: 'var(--mv-green)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
        <Check size={10} /> {trueLabel}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'color-mix(in srgb, var(--mv-ink) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
      color: 'var(--mv-ink-52)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {falseLabel}
    </span>
  );
}

// ─── Price breakdown tooltip ──────────────────────────────────────────────────
// Uses position:fixed so it escapes overflow:hidden on the table container.
// rect is the DOMRect of the trigger element.

function BreakdownTooltip({ charge, mode, anchorRect }) {
  // mode: 'sell' | 'cost'
  const base      = mode === 'sell' ? parseFloat(charge.price || 0) : parseFloat(charge.cost_price || 0);
  const lines     = Array.isArray(charge.charge_lines) ? charge.charge_lines : [];
  const total     = base + lines.reduce((s, l) => s + parseFloat(mode === 'sell' ? (l.price || 0) : (l.cost_price || l.price || 0)), 0);
  const accentCol = mode === 'sell' ? 'var(--mv-green)' : 'var(--mv-purple)';

  if (!anchorRect) return null;

  const TOOLTIP_WIDTH  = 240;
  const TOOLTIP_HEIGHT = 120; // approx
  const GAP            = 6;

  // Try below first; flip above if not enough room
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const top  = spaceBelow > TOOLTIP_HEIGHT + GAP
    ? anchorRect.bottom + GAP
    : anchorRect.top - TOOLTIP_HEIGHT - GAP;
  // Right-align with the trigger; clamp so it doesn't go off the left edge
  const left = Math.max(8, anchorRect.right - TOOLTIP_WIDTH);

  return (
    <div style={{
      position: 'fixed',
      top,
      left,
      width: TOOLTIP_WIDTH,
      background: 'var(--mv-surface)', border: `1px solid var(--mv-hairline)`,
      borderRadius: 8, padding: '10px 14px', zIndex: 9999,
      boxShadow: '0 8px 28px rgba(0,0,0,0.35)', pointerEvents: 'none',
      fontFamily: 'monospace', fontSize: 12,
    }}>
      {/* Base */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <span style={{ color: 'var(--mv-ink-52)' }}>Base rate</span>
        <span style={{ color: 'var(--mv-ink)' }}>
          {base > 0 ? `£${base.toFixed(2)}` : <span style={{ color: 'var(--mv-magenta)' }}>not set</span>}
        </span>
      </div>
      {/* Surcharge / fuel lines */}
      {lines.map((l, i) => {
        const val = mode === 'sell' ? parseFloat(l.price || 0) : parseFloat(l.cost_price ?? l.price ?? 0);
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
            <span style={{ color: 'var(--mv-ink-52)' }}>{l.name || (l.type === 'fuel' ? 'Fuel' : 'Surcharge')}</span>
            <span style={{ color: 'var(--mv-ink)' }}>
              {l.cost_price == null && mode === 'cost'
                ? <span style={{ color: 'var(--mv-ink-52)' }}>—</span>
                : `£${val.toFixed(2)}`}
            </span>
          </div>
        );
      })}
      {/* Divider + total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', gap: 16,
        marginTop: 6, paddingTop: 6, borderTop: `1px solid var(--mv-hairline)`,
        fontWeight: 700,
      }}>
        <span style={{ color: 'var(--mv-ink-52)' }}>Total</span>
        <span style={{ color: accentCol }}>£{total.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Charge cell with hover breakdown ────────────────────────────────────────

function ChargeCellSell({ charge, onSave, onDebug }) {
  const [anchorRect, setAnchorRect] = useState(null);
  const wrapRef = useRef(null);
  const hasPrice = charge.price != null;
  return (
    <div ref={wrapRef} style={{ display: 'inline-block' }}
      onMouseEnter={() => {
        if (hasPrice) setAnchorRect(wrapRef.current?.getBoundingClientRect() || null);
      }}
      onMouseLeave={() => setAnchorRect(null)}>
      <PriceCell charge={charge} onSave={onSave} onDebug={onDebug} />
      {anchorRect && <BreakdownTooltip charge={charge} mode="sell" anchorRect={anchorRect} />}
    </div>
  );
}

function ChargeCellCost({ charge }) {
  const [anchorRect, setAnchorRect] = useState(null);
  const wrapRef = useRef(null);
  const hasCost = charge.cost_price != null;
  const lines = Array.isArray(charge.charge_lines) ? charge.charge_lines : [];
  const totalCost = hasCost
    ? parseFloat(charge.cost_price || 0) + lines.reduce((s, l) => s + parseFloat(l.cost_price ?? l.price ?? 0), 0)
    : null;
  return (
    <div ref={wrapRef} style={{ display: 'inline-block' }}
      onMouseEnter={() => {
        if (hasCost) setAnchorRect(wrapRef.current?.getBoundingClientRect() || null);
      }}
      onMouseLeave={() => setAnchorRect(null)}>
      <span style={{ color: hasCost ? 'var(--mv-purple)' : 'var(--mv-ink-62)', fontWeight: hasCost ? 700 : 400, fontSize: 13 }}>
        {totalCost != null ? gbp(totalCost) : '—'}
      </span>
      {anchorRect && <BreakdownTooltip charge={charge} mode="cost" anchorRect={anchorRect} />}
    </div>
  );
}

// ─── Row actions hamburger menu ───────────────────────────────────────────────

function MoreMenu({ charge, onBill, onReprice, onLog, onDebug, onCancel }) {
  const [open, setOpen]         = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClose(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('scroll', () => setOpen(false), { capture: true, once: true });
    return () => document.removeEventListener('mousedown', handleClose);
  }, [open]);

  const items = [
    charge.price != null && !charge.billed && { label: 'Bill', action: onBill, color: 'var(--mv-green)' },
    { label: 'Reprice', action: onReprice, color: 'var(--mv-ink-52)' },
    { label: 'View payload', action: onLog, color: 'var(--mv-ink-52)' },
    { label: 'Diagnose', action: onDebug, color: 'var(--mv-amber-deep)' },
    { label: 'Cancel', action: onCancel, color: 'var(--mv-magenta)' },
  ].filter(Boolean);

  function handleToggle() {
    const rect = btnRef.current?.getBoundingClientRect();
    setMenuRect(rect || null);
    setOpen(v => !v);
  }

  // position: fixed so it escapes overflow:hidden on the table container
  const menuStyle = menuRect ? {
    position: 'fixed',
    top: menuRect.bottom + 4,
    right: window.innerWidth - menuRect.right,
    background: 'var(--mv-surface)',
    border: '1px solid color-mix(in srgb, var(--mv-ink) 12%, transparent)',
    borderRadius: 8,
    minWidth: 150,
    zIndex: 9999,
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  } : null;

  return (
    <div ref={btnRef} style={{ display: 'inline-block' }}>
      <button
        onClick={handleToggle}
        style={{
          background: open ? 'color-mix(in srgb, var(--mv-ink) 8%, transparent)' : 'none',
          border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
          borderRadius: 6, color: 'var(--mv-ink-52)', cursor: 'pointer',
          padding: '4px 7px', display: 'flex', alignItems: 'center',
        }}
      >
        <MoreHorizontal size={14} />
      </button>
      {open && menuStyle && (
        <div style={menuStyle}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none',
                padding: '9px 14px', fontSize: 13,
                color: item.color, cursor: 'pointer',
                borderBottom: i < items.length - 1 ? '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--mv-ink) 4%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline price editor ──────────────────────────────────────────────────────

function PriceCell({ charge, onSave, onDebug }) {
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
        <span style={{ color: 'var(--mv-ink-52)', fontSize: 13 }}>£</span>
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          style={{
            width: 72, background: 'color-mix(in srgb, var(--mv-ink) 8%, transparent)', border: '1px solid var(--mv-green)',
            borderRadius: 9999, color: 'var(--mv-ink)', padding: '3px 10px', fontSize: 13, fontWeight: 700,
          }}
        />
        <button onClick={commit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-green)', padding: 2 }}>
          <Check size={13} />
        </button>
        <button onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-52)', padding: 2 }}>
          <X size={13} />
        </button>
      </div>
    );
  }

  if (charge.price == null) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
        <button onClick={startEdit} style={{
          background: 'var(--mv-amber-100)', border: '1px solid var(--mv-amber-200)',
          borderRadius: 5, color: 'var(--mv-amber-deep)', padding: '3px 10px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <AlertCircle size={11} /> Set Price
        </button>
        {charge.price_failure_reason && (
          <span style={{ fontSize: 10, color: 'var(--mv-magenta)', fontWeight: 600, textAlign: 'right', lineHeight: 1.3 }}>
            {charge.price_failure_reason}
          </span>
        )}
      </div>
    );
  }

  const displayLines = Array.isArray(charge.charge_lines) ? charge.charge_lines : [];
  const displayTotal = parseFloat(charge.price || 0) + displayLines.reduce((s, l) => s + parseFloat(l.price || 0), 0);

  return (
    <button onClick={startEdit} style={{
      background: 'var(--mv-purple-100)', border: '1px solid var(--mv-purple-200)',
      borderRadius: 5, color: 'var(--mv-green)', padding: '3px 10px', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {gbp(displayTotal)}
      <Edit2 size={10} style={{ opacity: 0.6 }} />
    </button>
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
      // Always refresh the charge list so the UI reflects the updated price
      // (or cleared price + failure reason) regardless of whether reprice succeeded.
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
      if (result.ok) {
        onRepriced(result.price);
      }
    },
  });

  const stepColor = (step) => {
    if (!trace) return 'var(--mv-ink-62)';
    const t = step.title || '';
    // Rate card search — red if zone/band not resolved
    if (t === 'Rate card search' && (step.error || !step.resolved_zone || !step.resolved_band)) return 'var(--mv-magenta)';
    // Base price — red if no price found
    if (t === 'Base price' && step.error) return 'var(--mv-magenta)';
    // Surcharges — grey if none (not an error, just informational)
    if (t === 'Surcharges' && !step.surcharges?.length && !step.fuel) return 'var(--mv-ink-62)';
    // Volumetric — amber if no dims available (can't calculate)
    if (t === 'Volumetric weight' && step.volumetric_divisor == null) return 'var(--mv-ink-52)';
    return 'var(--mv-green)';
  };

  // Conclusion is green if the charge already has a price OR the engine would price it
  const alreadyPriced = charge.price != null;
  // Use the server-provided stored_total (base + all fuel/surcharge rows) for accurate comparison.
  // Falls back to client-side sum if the trace hasn't loaded yet.
  const currentTotal = trace?.stored?.stored_total != null
    ? parseFloat(trace.stored.stored_total)
    : alreadyPriced
      ? parseFloat(charge.price) + (Array.isArray(charge.charge_lines) ? charge.charge_lines : [])
          .reduce((s, l) => s + parseFloat(l.price || 0), 0)
      : null;
  // Are the current total and the engine total effectively the same? (within 1p rounding)
  const pricesMatch = alreadyPriced && trace?.conclusion?.priced &&
    currentTotal != null &&
    Math.abs(currentTotal - (trace.conclusion.total ?? 0)) < 0.015;
  const conclusionColor = (alreadyPriced || trace?.conclusion?.priced) ? 'var(--mv-green)' : 'var(--mv-magenta)';

  // Shared row style for ✓/✗ check lists
  const checkRow = (matched) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 8px', marginTop: 3, borderRadius: 5,
    background: matched ? 'color-mix(in srgb, var(--mv-green) 7%, transparent)' : 'color-mix(in srgb, var(--mv-ink) 2%, transparent)',
    borderLeft: `2px solid ${matched ? 'var(--mv-green)' : 'color-mix(in srgb, var(--mv-ink) 8%, transparent)'}`,
  });

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  };

  const box = {
    background: 'var(--mv-surface)', border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
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
          borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Bug size={16} style={{ color: 'var(--mv-amber)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--mv-ink)', fontSize: 15 }}>
              Pricing Diagnostic
            </div>
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>
              {charge.order_id || charge.id.slice(0, 8)} · {charge.customer_name || 'Unknown customer'}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          {isLoading && (
            <div style={{ color: 'var(--mv-ink-52)', fontSize: 13, padding: 20, textAlign: 'center' }}>
              Running diagnostics…
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--mv-magenta)', fontSize: 13, padding: 20 }}>
              Error loading diagnostics: {error.message}
            </div>
          )}
          {trace && (
            <>
              {/* Already-priced banner */}
              {alreadyPriced && (
                <div style={{
                  background: 'color-mix(in srgb, var(--mv-green) 9%, transparent)',
                  border: '1px solid var(--mv-purple-200)',
                  borderRadius: 8, padding: '10px 14px',
                  marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ color: 'var(--mv-green)', fontWeight: 700, fontSize: 14 }}>✓</span>
                  <div>
                    <div style={{ color: 'var(--mv-green)', fontWeight: 700, fontSize: 13 }}>
                      Already priced — £{currentTotal != null ? currentTotal.toFixed(2) : parseFloat(charge.price).toFixed(2)}
                    </div>
                    <div style={{ color: 'var(--mv-ink-52)', fontSize: 11, marginTop: 1 }}>
                      The trace below shows what the engine would set if re-priced now.
                    </div>
                  </div>
                </div>
              )}

              {/* Steps */}
              {trace.steps.map(step => (
                <div key={step.step} style={{
                  background: 'color-mix(in srgb, var(--mv-ink) 3%, transparent)',
                  border: `1px solid color-mix(in srgb, ${stepColor(step)} 13%, transparent)`,
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
                      background: `color-mix(in srgb, ${stepColor(step)} 13%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${stepColor(step)} 33%, transparent)`,
                      color: stepColor(step),
                      borderRadius: 20, padding: '1px 8px',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      Step {step.step}
                    </span>
                    <span style={{ color: 'var(--mv-ink-78)', fontWeight: 600, fontSize: 13 }}>{step.title}</span>
                  </div>

                  {/* Render key fields */}
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--mv-ink-62)', lineHeight: 1.7 }}>

                    {/* ── Step 1: Field extraction ── */}
                    {step.step === 1 && <>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>account_number:</span> <span style={{ color: step.account_number ? 'var(--mv-ink)' : 'var(--mv-magenta)' }}>{step.account_number || 'null — not in webhook payload'}</span></div>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>dc_service_id:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.dc_service_id || 'null'}</span></div>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>service_name:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.service_name || 'null'}</span></div>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>parcel_count:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.parcel_count}</span></div>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>total_weight_kg:</span> <span style={{ color: step.total_weight_kg != null ? 'var(--mv-ink)' : 'var(--mv-amber-deep)' }}>{step.total_weight_kg != null ? `${step.total_weight_kg} kg` : 'null — not in webhook'}</span></div>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>weight_per_parcel:</span> <span style={{ color: step.weight_per_parcel != null ? 'var(--mv-ink)' : 'var(--mv-amber-deep)' }}>{step.weight_per_parcel != null ? `${step.weight_per_parcel} kg` : 'null'}</span></div>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>postcode:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.postcode || 'null'}{step.outward_code ? ` → outward: ${step.outward_code}` : ''}</span></div>
                    </>}

                    {/* ── Step 1.5: Volumetric weight ── */}
                    {step.step === 1.5 && <>
                      {/* Divisor */}
                      {step.volumetric_divisor == null ? (
                        <div style={{ color: 'var(--mv-ink-52)' }}>No volumetric divisor configured for this service — physical weight used as-is.</div>
                      ) : (
                        <>
                          <div><span style={{ color: 'var(--mv-ink-52)' }}>physical weight:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.physical_kg != null ? `${step.physical_kg} kg` : 'null'}</span></div>
                          <div>
                            <span style={{ color: 'var(--mv-ink-52)' }}>dims (L × W × H):</span>{' '}
                            {step.dim_length_cm != null && step.dim_width_cm != null && step.dim_height_cm != null ? (
                              <span style={{ color: 'var(--mv-ink)' }}>
                                {step.dim_length_cm} × {step.dim_width_cm} × {step.dim_height_cm} cm
                              </span>
                            ) : (
                              <span style={{ color: 'var(--mv-amber-deep)' }}>null — dims not in webhook payload</span>
                            )}
                          </div>
                          <div><span style={{ color: 'var(--mv-ink-52)' }}>divisor:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.volumetric_divisor} cm³/kg</span></div>
                          {step.volumetric_kg != null ? (
                            <>
                              <div>
                                <span style={{ color: 'var(--mv-ink-52)' }}>volumetric weight:</span>{' '}
                                <span style={{ color: 'var(--mv-ink)' }}>
                                  ({step.dim_length_cm} × {step.dim_width_cm} × {step.dim_height_cm}) ÷ {step.volumetric_divisor} = {step.volumetric_kg} kg
                                </span>
                              </div>
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
                                <span style={{ color: 'var(--mv-ink-52)' }}>charged weight:</span>{' '}
                                <span style={{ color: 'var(--mv-green)', fontWeight: 700 }}>
                                  {step.charged_kg} kg
                                </span>{' '}
                                <span style={{ color: 'var(--mv-ink-52)', fontSize: 11 }}>
                                  ({step.weight_basis === 'volumetric'
                                    ? `volumetric ${step.volumetric_kg} kg > physical ${step.physical_kg} kg`
                                    : `physical ${step.physical_kg} kg ≥ volumetric ${step.volumetric_kg} kg`})
                                </span>
                              </div>
                            </>
                          ) : (
                            <div style={{ color: 'var(--mv-amber-deep)' }}>Cannot calculate volumetric weight — dimensions missing in payload.</div>
                          )}
                        </>
                      )}
                    </>}

                    {/* ── Step 2: Customer resolution ── */}
                    {step.step === 2 && <>
                      <div><span style={{ color: 'var(--mv-ink-52)' }}>customer_found:</span> <span style={{ color: step.customer_found ? 'var(--mv-green)' : 'var(--mv-magenta)', fontWeight: 700 }}>{step.customer_found ? 'YES' : 'NO'}</span></div>
                      {step.customer_found && (
                        <div><span style={{ color: 'var(--mv-ink-52)' }}>customer_name:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.customer_name}</span></div>
                      )}
                    </>}

                    {/* ── Step 3: Rate card search — zones + weight bands ── */}
                    {step.step === 3 && <>
                      {step.error && (
                        <div style={{ color: 'var(--mv-magenta)', marginBottom: 6 }}>✗ {step.error}</div>
                      )}
                      {!step.error && <>
                        {/* Zones */}
                        {step.zones?.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ color: 'var(--mv-ink-52)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Zones</div>
                            {step.zones.map((z, i) => (
                              <div key={i} style={checkRow(z.matched)}>
                                <span style={{ color: z.matched ? 'var(--mv-green)' : 'var(--mv-magenta)', fontWeight: 700, minWidth: 14 }}>{z.matched ? '✓' : '✗'}</span>
                                <span style={{ color: z.matched ? 'var(--mv-ink)' : 'var(--mv-ink-52)' }}>{z.zone_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Weight bands */}
                        {step.weight_bands?.length > 0 && (
                          <div>
                            <div style={{ color: 'var(--mv-ink-52)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Weight bands</div>
                            {step.weight_bands.map((b, i) => (
                              <div key={i} style={checkRow(b.matched)}>
                                <span style={{ color: b.matched ? 'var(--mv-green)' : 'var(--mv-magenta)', fontWeight: 700, minWidth: 14 }}>{b.matched ? '✓' : '✗'}</span>
                                <span style={{ color: b.matched ? 'var(--mv-ink)' : 'var(--mv-ink-52)' }}>{b.weight_class_name}</span>
                                {b.min_weight_kg != null && b.max_weight_kg != null && (
                                  <span style={{ color: 'var(--mv-ink-52)', marginLeft: 6 }}>
                                    {b.max_weight_kg >= 9999
                                      ? '(flat rate)'
                                      : `(${b.min_weight_kg}–${b.max_weight_kg} kg)`}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {step.weight_bands?.length === 0 && (
                          <div style={{ color: 'var(--mv-magenta)' }}>✗ no weight band found in carrier rate card</div>
                        )}
                      </>}
                    </>}

                    {/* ── Step 4: Base price ── */}
                    {step.step === 4 && <>
                      {step.error && (
                        <div style={{ color: 'var(--mv-magenta)' }}>✗ {step.error}</div>
                      )}
                      {!step.error && <>
                        <div><span style={{ color: 'var(--mv-ink-52)' }}>zone:</span> <span style={{ color: 'var(--mv-green)' }}>{step.zone}</span></div>
                        <div><span style={{ color: 'var(--mv-ink-52)' }}>weight_band:</span> <span style={{ color: 'var(--mv-green)' }}>{step.weight_band}</span></div>
                        <div><span style={{ color: 'var(--mv-ink-52)' }}>price_per_parcel:</span> <span style={{ color: 'var(--mv-ink)' }}>£{step.price_per_parcel?.toFixed(2)}</span></div>
                        {step.price_sub != null && (
                          <div><span style={{ color: 'var(--mv-ink-52)' }}>price_sub (per additional parcel):</span> <span style={{ color: 'var(--mv-ink)' }}>£{step.price_sub.toFixed(2)}</span></div>
                        )}
                        {step.parcel_count > 1 && (
                          <div><span style={{ color: 'var(--mv-ink-52)' }}>parcel_count:</span> <span style={{ color: 'var(--mv-ink)' }}>{step.parcel_count} × ({step.pricing_mode === 'sub' ? 'first + subsequent' : 'all at sub rate'})</span></div>
                        )}
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
                          <span style={{ color: 'var(--mv-ink-52)' }}>total_base:</span> <span style={{ color: 'var(--mv-ink)', fontWeight: 700 }}>£{step.total_base?.toFixed(2)}</span>
                        </div>
                      </>}
                    </>}

                    {/* ── Step 5: Surcharges ── */}
                    {step.step === 5 && <>
                      {/* Regular surcharges */}
                      {step.surcharges?.length > 0 && (
                        <div style={{ marginBottom: step.fuel ? 12 : 0 }}>
                          <div style={{ color: 'var(--mv-ink-52)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Rules</div>
                          {step.surcharges.map((s, i) => (
                            <div key={i} style={checkRow(s.matched)}>
                              <span style={{ color: s.matched ? 'var(--mv-green)' : 'var(--mv-magenta)', fontWeight: 700, minWidth: 14 }}>{s.matched ? '✓' : '✗'}</span>
                              <span style={{ color: s.matched ? 'var(--mv-ink)' : 'var(--mv-ink-52)', flex: 1 }}>{s.name}</span>
                              {s.matched && <>
                                <span style={{ color: 'var(--mv-ink-52)', fontSize: 11 }}>{s.calc}</span>
                                <span style={{ color: 'var(--mv-green)', fontWeight: 700, marginLeft: 8 }}>+£{s.price?.toFixed(2)}</span>
                              </>}
                              {!s.matched && (
                                <span style={{ color: 'var(--mv-ink-62)', fontSize: 11 }}>{s.reason}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Fuel surcharge */}
                      {step.fuel && (
                        <div>
                          <div style={{ color: 'var(--mv-ink-52)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Fuel surcharge</div>
                          <div style={checkRow(true)}>
                            <span style={{ color: 'var(--mv-green)', fontWeight: 700, minWidth: 14 }}>✓</span>
                            <span style={{ color: 'var(--mv-ink)', flex: 1 }}>{step.fuel.fuel_group}</span>
                            <span style={{ color: 'var(--mv-ink-52)', fontSize: 11 }}>
                              {step.fuel.pct}% of £{step.fuel.base?.toFixed(2)}
                              {step.fuel.rate_type === 'customer-specific' ? ' (customer rate)' : ' (standard rate)'}
                            </span>
                            <span style={{ color: 'var(--mv-green)', fontWeight: 700, marginLeft: 8 }}>+£{step.fuel.price?.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      {!step.surcharges?.length && !step.fuel && (
                        <div style={{ color: 'var(--mv-ink-52)' }}>No surcharges apply to this shipment</div>
                      )}
                      {step.total_surcharges > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
                          <span style={{ color: 'var(--mv-ink-52)' }}>total_surcharges:</span> <span style={{ color: 'var(--mv-ink)', fontWeight: 700 }}>+£{step.total_surcharges?.toFixed(2)}</span>
                        </div>
                      )}
                    </>}

                  </div>
                </div>
              ))}

              {/* Conclusion */}
              {trace.conclusion && (
                <div style={{
                  background: (alreadyPriced || trace.conclusion.priced) ? 'color-mix(in srgb, var(--mv-green) 7%, transparent)' : 'color-mix(in srgb, var(--mv-magenta) 7%, transparent)',
                  border: `1px solid color-mix(in srgb, ${conclusionColor} 20%, transparent)`,
                  borderRadius: 10, padding: '14px 16px',
                  fontFamily: 'monospace', fontSize: 13,
                }}>
                  <div style={{ fontWeight: 700, color: conclusionColor, fontSize: 14, marginBottom: 10 }}>
                    {alreadyPriced && trace.conclusion.priced && pricesMatch
                      ? `✓ Price correct — £${currentTotal.toFixed(2)} matches engine`
                      : alreadyPriced && trace.conclusion.priced && !pricesMatch
                        ? `⚠ Currently £${currentTotal.toFixed(2)} — re-price would set £${trace.conclusion.total?.toFixed(2)}`
                        : alreadyPriced && !trace.conclusion.priced
                          ? `⚠ Currently £${currentTotal.toFixed(2)} — engine can no longer find a rate`
                          : trace.conclusion.priced
                            ? '✓ Rate found — ready to apply'
                            : '✗ No rate — manual price needed'}
                  </div>

                  {trace.conclusion.priced && <>
                    {/* Base price row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mv-ink-52)', marginBottom: 4 }}>
                      <span>Base rate <span style={{ color: 'var(--mv-ink-52)' }}>({trace.conclusion.zone_name} · {trace.conclusion.weight_class_name})</span></span>
                      <span style={{ color: 'var(--mv-ink)' }}>£{trace.conclusion.base_price?.toFixed(2)}</span>
                    </div>
                    {/* Surcharge lines */}
                    {trace.conclusion.surcharge_lines?.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mv-ink-52)', marginBottom: 4 }}>
                        <span>{s.name}</span>
                        <span style={{ color: 'var(--mv-ink)' }}>+£{s.price?.toFixed(2)}</span>
                      </div>
                    ))}
                    {/* Total */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginTop: 8, paddingTop: 8, borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
                      fontWeight: 700,
                    }}>
                      <span style={{ color: 'var(--mv-ink-78)' }}>Total</span>
                      <span style={{ color: 'var(--mv-green)', fontSize: 15 }}>£{trace.conclusion.total?.toFixed(2)}</span>
                    </div>
                  </>}

                  {!trace.conclusion.priced && trace.conclusion.reason && (
                    <div style={{ color: 'var(--mv-magenta)', fontSize: 12 }}>{trace.conclusion.reason}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose}
            style={{ background: 'none', border: '1px solid color-mix(in srgb, var(--mv-ink) 12%, transparent)',
              borderRadius: 8, color: 'var(--mv-ink-52)', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            Close
          </button>
          {trace?.conclusion?.priced && !pricesMatch && (
            <button
              onClick={() => repriceMut.mutate()}
              disabled={repriceMut.isLoading}
              style={{
                background: alreadyPriced ? 'var(--mv-purple-100)' : 'var(--mv-purple-100)',
                border: `1px solid ${alreadyPriced ? 'var(--mv-purple-200)' : 'var(--mv-purple-200)'}`,
                borderRadius: 8,
                color: alreadyPriced ? 'var(--mv-purple)' : 'var(--mv-green)',
                padding: '8px 18px',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <RotateCcw size={13} />
              {repriceMut.isLoading
                ? 'Applying…'
                : alreadyPriced
                  ? `Re-price to £${trace.conclusion.total?.toFixed(2)}`
                  : `Apply £${trace.conclusion.total?.toFixed(2)}`}
            </button>
          )}
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
    background: 'var(--mv-surface)', border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
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
          borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <FileJson size={16} style={{ color: 'var(--mv-teal)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--mv-ink)', fontSize: 15 }}>Webhook Payload</div>
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>
              {charge.order_id || charge.id.slice(0, 8)} · {charge.customer_name || 'Unknown'}
              {data?.received_at && ` · received ${format(parseISO(data.received_at), 'd MMM yyyy HH:mm')}`}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          {isLoading && <div style={{ color: 'var(--mv-ink-52)', fontSize: 13, textAlign: 'center', padding: 20 }}>Loading payload…</div>}
          {error && <div style={{ color: 'var(--mv-magenta)', fontSize: 13 }}>Error: {error.message}</div>}
          {data && (
            <pre style={{
              background: 'var(--mv-surface)',
              border: '1px solid color-mix(in srgb, var(--mv-ink) 12%, transparent)',
              borderRadius: 8,
              padding: '14px 16px',
              fontSize: 11,
              color: 'var(--mv-ink-45)',
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
        <div style={{ padding: '12px 20px', borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ background: 'none', border: '1px solid color-mix(in srgb, var(--mv-ink) 12%, transparent)',
              borderRadius: 8, color: 'var(--mv-ink-52)', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder tab ─────────────────────────────────────────────────────────

function PlaceholderTab({ title, description, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 320, gap: 16, opacity: 0.6,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: `color-mix(in srgb, ${color} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 27%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 18, height: 18, borderRadius: 3, background: color, opacity: 0.7 }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--mv-ink)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--mv-ink-52)', maxWidth: 380 }}>{description}</div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color, background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        borderRadius: 20, padding: '4px 14px',
      }}>
        Coming soon
      </div>
    </div>
  );
}

// ─── Awaiting Reconciliation tab ─────────────────────────────────────────────

function AwaitingReconciliationTab({ customers, gbp, fmt, getCourierLogo }) {
  const [custFilter, setCustFilter] = useState('');
  const [search, setSearch]         = useState('');
  const [limit, setLimit]           = useState(50);
  const [offset, setOffset]         = useState(0);

  const params = {
    charge_type:              'courier',
    awaiting_reconciliation:  'true',
    cancelled:                'false',
    customer_id:              custFilter || undefined,
    search:                   search    || undefined,
    limit,
    offset,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['billing-charges-awaiting', params],
    queryFn:  () => billingApi.getCharges(params),
    staleTime: 10_000,
    keepPreviousData: true,
  });

  const charges    = data?.charges    || [];
  const total      = data?.total      || 0;
  const totalSell  = data?.total_sell ?? null;
  const totalCost  = data?.total_cost ?? null;
  const totalPages  = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const th = { fontSize: 11, fontWeight: 700, color: 'var(--mv-ink-52)', textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '10px 12px', whiteSpace: 'nowrap',
    borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' };
  const td = { padding: '10px 12px', fontSize: 13, color: 'var(--mv-ink-78)', verticalAlign: 'middle',
    borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 3%, transparent)' };

  const margin = totalSell > 0 ? ((totalSell - totalCost) / totalSell * 100).toFixed(1) : null;

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{
          background: 'color-mix(in srgb, var(--mv-amber) 5%, transparent)', border: '1px solid var(--mv-amber-200)',
          borderRadius: 10, padding: '14px 18px', minWidth: 140, flex: 1,
        }}>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Awaiting</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--mv-amber-deep)' }}>{total}</div>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 4 }}>Charges pending reconciliation</div>
        </div>
        <div style={{
          background: 'color-mix(in srgb, var(--mv-green) 4%, transparent)', border: '1px solid var(--mv-purple-200)',
          borderRadius: 10, padding: '14px 18px', minWidth: 140, flex: 1,
        }}>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Sell</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--mv-green)' }}>{totalSell != null ? gbp(totalSell) : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 4 }}>All charges (excl. surcharges)</div>
        </div>
        <div style={{
          background: 'color-mix(in srgb, var(--mv-purple) 4%, transparent)', border: '1px solid var(--mv-purple-200)',
          borderRadius: 10, padding: '14px 18px', minWidth: 140, flex: 1,
        }}>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Cost</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--mv-purple)' }}>{totalCost != null ? gbp(totalCost) : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 4 }}>All charges (excl. surcharges)</div>
        </div>
        {margin != null && (
          <div style={{
            background: 'color-mix(in srgb, var(--mv-ink) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
            borderRadius: 10, padding: '14px 18px', minWidth: 140, flex: 1,
          }}>
            <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Margin</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(margin) >= 15 ? 'var(--mv-green)' : parseFloat(margin) >= 5 ? 'var(--mv-amber-deep)' : 'var(--mv-magenta)' }}>{margin}%</div>
            <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 4 }}>Base courier charges</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mv-ink-52)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Search order, customer…"
            style={{
              width: '100%', paddingLeft: 30, paddingRight: 10, height: 34,
              background: 'color-mix(in srgb, var(--mv-ink) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
              borderRadius: 8, color: 'var(--mv-ink)', fontSize: 13,
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setOffset(0); }}
              className="mv-search-clear"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={custFilter}
          onChange={e => { setCustFilter(e.target.value); setOffset(0); }}
          className="pill-select"
          style={{ minWidth: 180 }}
        >
          <option value="">All customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.business_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'color-mix(in srgb, var(--mv-ink) 2%, transparent)', border: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={th}>Carrier</th>
                <th style={th}>Order Ref</th>
                <th style={th}>Customer</th>
                <th style={th}>Destination</th>
                <th style={th}>Job Date</th>
                <th style={th}>Zone</th>
                <th style={{ ...th, textAlign: 'right' }}>Sell</th>
                <th style={{ ...th, textAlign: 'right' }}>Cost</th>
                <th style={{ ...th, textAlign: 'right' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: 'var(--mv-ink-52)', padding: 40 }}>Loading…</td></tr>
              ) : charges.length === 0 ? (
                <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: 'var(--mv-ink-52)', padding: 40 }}>No charges awaiting reconciliation</td></tr>
              ) : charges.map(charge => {
                const lines     = Array.isArray(charge.charge_lines) ? charge.charge_lines : [];
                const sellTotal = parseFloat(charge.price || 0) + lines.reduce((s, l) => s + parseFloat(l.price || 0), 0);
                const costTotal = parseFloat(charge.cost_price || 0) + lines.reduce((s, l) => s + parseFloat(l.cost_price ?? l.price ?? 0), 0);
                const margin    = sellTotal > 0 ? ((sellTotal - costTotal) / sellTotal * 100).toFixed(1) : null;
                const logo      = getCourierLogo(charge.courier);
                return (
                  <tr key={charge.id} style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--mv-ink) 2%, transparent)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {logo
                          ? <img src={logo} alt="" style={{ height: 18, width: 'auto', maxWidth: 40, objectFit: 'contain', opacity: 0.9 }} />
                          : <span style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{charge.courier || '—'}</span>}
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{ color: 'var(--mv-purple)', fontWeight: 600, fontSize: 12 }}>{charge.order_id || '—'}</span>
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: 12, color: 'var(--mv-ink-78)' }}>{charge.customer_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{charge.customer_account || ''}</div>
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: 12 }}>{charge.ship_to_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{charge.ship_to_postcode || ''}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--mv-ink-52)' }}>
                      <div>{fmt(charge.created_at)}</div>
                      <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{fmtTime(charge.created_at)}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--mv-ink-52)' }}>
                      {charge.zone_name || '—'}
                      {charge.weight_class_name && <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{charge.weight_class_name}</div>}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--mv-green)', fontWeight: 700 }}>{gbp(sellTotal)}</td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--mv-purple)', fontWeight: 600 }}>{gbp(costTotal)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {margin != null
                        ? <span style={{ color: parseFloat(margin) >= 15 ? 'var(--mv-green)' : parseFloat(margin) >= 5 ? 'var(--mv-amber-deep)' : 'var(--mv-magenta)', fontWeight: 700 }}>{margin}%</span>
                        : <span style={{ color: 'var(--mv-ink-52)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <span style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>{offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={limit} onChange={e => { setLimit(parseInt(e.target.value)); setOffset(0); }} className="pill-select" style={{ width: 80 }}>
                {[25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
              <button className="btn-ghost" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0} style={{ padding: '6px 10px' }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>{currentPage} / {totalPages}</span>
              <button className="btn-ghost" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total} style={{ padding: '6px 10px' }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
        {total <= limit && total > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
            <span style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>{total} charge{total !== 1 ? 's' : ''}</span>
          </div>
        )}
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
  });
  const [showAlerts, setShowAlerts] = useState(true);
  const [showUnpriced, setShowUnpriced] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [debugCharge, setDebugCharge] = useState(null);
  const [payloadCharge, setPayloadCharge] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [fullRepriceRunning, setFullRepriceRunning] = useState(false);
  const [fullRepriceResult, setFullRepriceResult] = useState(null);
  const [fixCostsRunning, setFixCostsRunning] = useState(false);
  const [fixCostsResult, setFixCostsResult] = useState(null);
  const [purgeRunning, setPurgeRunning] = useState(false);
  const [relinkRunning, setRelinkRunning] = useState(false);
  const [customerRepriceRunning, setCustomerRepriceRunning] = useState(false);
  const [customerRepriceResult, setCustomerRepriceResult] = useState(null);
  const [activeTab, setActiveTab] = useState('created');

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
    customer_id: filters.customer_id || undefined,
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
    customer_id: filters.customer_id || undefined,
    search: filters.search || undefined,
    billed: filters.billed || undefined,
    verified: filters.verified || undefined,
    cancelled: 'false',
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    unpriced: showUnpriced ? 'true' : undefined, // server-side filter so all pages are unpriced
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

  // Server already filters to unpriced when showUnpriced is true — no local filter needed
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
    setFilters({ search: '', customer_id: '', billed: '', verified: '', date_from: '', date_to: '' });
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

  async function repriceCharge(charge) {
    try {
      const result = await billingApi.repriceCharge(charge.id);
      // Always refresh — even a failed reprice clears the stale price in the DB
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
      if (!result.ok) {
        alert(`Reprice: ${result.message || 'No matching rate found'}`);
      }
    } catch (err) {
      alert(`Reprice error: ${err.message}`);
    }
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

  async function repriceForCustomer() {
    const cust = customers.find(c => c.id === filters.customer_id);
    const name = cust?.business_name || 'this customer';
    if (!confirm(`Reprice all courier charges for ${name}? This will update prices and recalculate fuel using current rate cards. Billed charges will also be updated.`)) return;
    setCustomerRepriceRunning(true);
    setCustomerRepriceResult(null);
    try {
      const result = await billingApi.fullRepriceCustomer(filters.customer_id);
      setCustomerRepriceResult(result);
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
    } catch (err) {
      setCustomerRepriceResult({ error: err.message });
    } finally {
      setCustomerRepriceRunning(false);
    }
  }

  async function runFullReprice() {
    if (!confirm('This will reprice ALL courier charges (including billed) using your current rate cards, and recalculate fuel on each one. This cannot be undone. Continue?')) return;
    setFullRepriceRunning(true);
    setFullRepriceResult(null);
    try {
      const result = await billingApi.fullReprice();
      setFullRepriceResult(result);
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
    } catch (err) {
      setFullRepriceResult({ error: err.message });
    } finally {
      setFullRepriceRunning(false);
    }
  }

  async function runFixCosts() {
    if (!confirm('This will recalculate cost prices on ALL courier charges (including already-billed ones) without changing sell prices or invoices. Use this to fix profit figures after a carrier pricing correction. Continue?')) return;
    setFixCostsRunning(true);
    setFixCostsResult(null);
    try {
      const result = await billingApi.fullRepriceCostsOnly();
      setFixCostsResult(result);
      qc.invalidateQueries(['billing-charges']);
      qc.invalidateQueries(['billing-stats']);
    } catch (err) {
      setFixCostsResult({ error: err.message });
    } finally {
      setFixCostsRunning(false);
    }
  }

  const th = { fontSize: 11, fontWeight: 700, color: 'var(--mv-ink-52)', textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '10px 12px', whiteSpace: 'nowrap', borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' };

  const td = { padding: '10px 12px', fontSize: 13, color: 'var(--mv-ink-78)', verticalAlign: 'middle',
    borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 3%, transparent)' };

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--mv-green)' }}>Finance & Billing</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={runRelink}
            disabled={relinkRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'color-mix(in srgb, var(--mv-teal) 8%, transparent)',
              border: '1px solid var(--mv-teal-200)',
              borderRadius: 8, color: 'var(--mv-teal)',
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
              background: 'color-mix(in srgb, var(--mv-magenta) 8%, transparent)',
              border: '1px solid var(--mv-magenta-200)',
              borderRadius: 8, color: 'var(--mv-magenta)',
              padding: '7px 14px', cursor: purgeRunning ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <XCircle size={14} />
            {purgeRunning ? 'Purging…' : 'Remove tracking events'}
          </button>
          <button
            onClick={runBatchReprice}
            disabled={batchRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: batchRunning ? 'color-mix(in srgb, var(--mv-amber) 8%, transparent)' : 'color-mix(in srgb, var(--mv-amber) 12%, transparent)',
              border: '1px solid var(--mv-amber-200)',
              borderRadius: 8, color: 'var(--mv-amber-deep)',
              padding: '7px 14px', cursor: batchRunning ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <Zap size={14} />
            {batchRunning ? 'Pricing…' : `Price Unpriced${stats?.unpriced > 0 ? ` (${stats.unpriced})` : ''}`}
          </button>
          <button
            onClick={runFullReprice}
            disabled={fullRepriceRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: fullRepriceRunning ? 'color-mix(in srgb, var(--mv-purple) 8%, transparent)' : 'color-mix(in srgb, var(--mv-purple) 12%, transparent)',
              border: '1px solid var(--mv-purple-200)',
              borderRadius: 8, color: 'var(--mv-purple)',
              padding: '7px 14px', cursor: fullRepriceRunning ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <RefreshCw size={14} style={fullRepriceRunning ? { animation: 'spin 1s linear infinite' } : {}} />
            {fullRepriceRunning ? 'Repricing all…' : 'Reprice All'}
          </button>
          <button
            onClick={runFixCosts}
            disabled={fixCostsRunning}
            title="Recalculate cost prices on all charges (including billed) without changing sell prices or invoices"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: fixCostsRunning ? 'color-mix(in srgb, var(--mv-green) 8%, transparent)' : 'color-mix(in srgb, var(--mv-green) 12%, transparent)',
              border: '1px solid var(--mv-purple-200)',
              borderRadius: 8, color: 'var(--mv-green)',
              padding: '7px 14px', cursor: fixCostsRunning ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <RefreshCw size={14} style={fixCostsRunning ? { animation: 'spin 1s linear infinite' } : {}} />
            {fixCostsRunning ? 'Fixing costs…' : 'Fix Costs'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => refetch()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24,
        borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 8%, transparent)',
      }}>
        {[
          { key: 'created',          label: 'Created' },
          { key: 'awaiting',         label: 'Awaiting Reconciliation' },
          { key: 'billed',           label: 'Billed' },
          { key: 'credits',          label: 'Credits' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 18px', fontSize: 13, fontWeight: 600,
              color: activeTab === tab.key ? 'var(--mv-green)' : 'var(--mv-ink-52)',
              borderBottom: activeTab === tab.key
                ? '2px solid var(--mv-green)'
                : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Created ───────────────────────────────────────────────── */}
      {activeTab === 'created' && (<>

      {/* Batch reprice result banner */}
      {batchResult && (
        <div style={{
          background: batchResult.error ? 'color-mix(in srgb, var(--mv-magenta) 8%, transparent)' : 'color-mix(in srgb, var(--mv-green) 8%, transparent)',
          border: `1px solid ${batchResult.error ? 'var(--mv-magenta-200)' : 'var(--mv-purple-200)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {batchResult.error ? (
            <span style={{ color: 'var(--mv-magenta)', fontSize: 13 }}>Error: {batchResult.error}</span>
          ) : batchResult.purge ? (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--mv-green)', fontWeight: 700 }}>✓ Purge complete</span>
              <span style={{ color: 'var(--mv-magenta)' }}>{batchResult.charges_deleted} charges removed</span>
              <span style={{ color: 'var(--mv-ink-52)' }}>{batchResult.shipments_deleted} shipment records removed</span>
            </div>
          ) : batchResult.relink ? (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--mv-green)', fontWeight: 700 }}>✓ {batchResult.linked} shipments relinked</span>
              {batchResult.not_found > 0 && (
                <span style={{ color: 'var(--mv-amber-deep)' }}>{batchResult.not_found} account IDs not matched</span>
              )}
              <span style={{ color: 'var(--mv-ink-52)' }}>of {batchResult.total_unlinked} unlinked total</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--mv-green)', fontWeight: 700 }}>
                ✓ {batchResult.priced} charges priced
              </span>
              {batchResult.no_customer > 0 && (
                <span style={{ color: 'var(--mv-amber-deep)' }}>
                  {batchResult.no_customer} customer not matched
                </span>
              )}
              {batchResult.no_rate > 0 && (
                <span style={{ color: 'var(--mv-amber-deep)' }}>
                  {batchResult.no_rate} no rate found
                </span>
              )}
              {batchResult.errors > 0 && (
                <span style={{ color: 'var(--mv-magenta)' }}>
                  {batchResult.errors} errors
                </span>
              )}
              <span style={{ color: 'var(--mv-ink-52)' }}>of {batchResult.total} total</span>
            </div>
          )}
          <button onClick={() => setBatchResult(null)}
            style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Full reprice result banner */}
      {fullRepriceResult && (
        <div style={{
          background: fullRepriceResult.error ? 'color-mix(in srgb, var(--mv-magenta) 8%, transparent)' : 'color-mix(in srgb, var(--mv-purple) 8%, transparent)',
          border: `1px solid ${fullRepriceResult.error ? 'var(--mv-magenta-200)' : 'var(--mv-purple-200)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {fullRepriceResult.error ? (
            <span style={{ color: 'var(--mv-magenta)', fontSize: 13 }}>Error: {fullRepriceResult.error}</span>
          ) : fullRepriceResult.started ? (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--mv-purple)', fontWeight: 700 }}>⟳ Reprice started</span>
              <span style={{ color: 'var(--mv-purple)' }}>{fullRepriceResult.total} charges queued — refresh in a moment to see updates</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--mv-purple)', fontWeight: 700 }}>✓ Full reprice complete</span>
              <span style={{ color: 'var(--mv-green)' }}>{fullRepriceResult.repriced} courier charges updated</span>
              {fullRepriceResult.changed > 0 && (
                <span style={{ color: 'var(--mv-amber-deep)' }}>{fullRepriceResult.changed} prices actually changed</span>
              )}
              {fullRepriceResult.fuel_updated > 0 && (
                <span style={{ color: 'var(--mv-green)' }}>{fullRepriceResult.fuel_updated} fuel charges recalculated</span>
              )}
              {fullRepriceResult.no_rate > 0 && (
                <span style={{ color: 'var(--mv-amber-deep)' }}>{fullRepriceResult.no_rate} no rate found</span>
              )}
              {fullRepriceResult.errors > 0 && (
                <span style={{ color: 'var(--mv-magenta)' }}>{fullRepriceResult.errors} errors</span>
              )}
              <span style={{ color: 'var(--mv-ink-52)' }}>of {fullRepriceResult.total} total</span>
            </div>
          )}
          <button onClick={() => setFullRepriceResult(null)}
            style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Fix Costs result banner */}
      {fixCostsResult && (
        <div style={{
          background: fixCostsResult.error ? 'color-mix(in srgb, var(--mv-magenta) 8%, transparent)' : 'color-mix(in srgb, var(--mv-green) 8%, transparent)',
          border: `1px solid ${fixCostsResult.error ? 'var(--mv-magenta-200)' : 'var(--mv-purple-200)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {fixCostsResult.error ? (
            <span style={{ color: 'var(--mv-magenta)', fontSize: 13 }}>Error: {fixCostsResult.error}</span>
          ) : fixCostsResult.started ? (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--mv-green)', fontWeight: 700 }}>⟳ Cost fix started</span>
              <span style={{ color: 'var(--mv-green)' }}>{fixCostsResult.total} charges queued — refresh in a moment to see updated profit figures</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--mv-green)', fontWeight: 700 }}>✓ Cost fix complete</span>
              <span style={{ color: 'var(--mv-green)' }}>{fixCostsResult.repriced} cost prices corrected</span>
              {fixCostsResult.fuel_updated > 0 && (
                <span style={{ color: 'var(--mv-green)' }}>{fixCostsResult.fuel_updated} fuel costs recalculated</span>
              )}
              {fixCostsResult.no_rate > 0 && (
                <span style={{ color: 'var(--mv-amber-deep)' }}>{fixCostsResult.no_rate} no rate found</span>
              )}
              {fixCostsResult.errors > 0 && (
                <span style={{ color: 'var(--mv-magenta)' }}>{fixCostsResult.errors} errors</span>
              )}
              <span style={{ color: 'var(--mv-ink-52)' }}>of {fixCostsResult.total} total</span>
            </div>
          )}
          <button onClick={() => setFixCostsResult(null)}
            style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Aged unbilled alert banner */}
      {showAlerts && agedAlerts.length > 0 && (
        <div style={{
          background: 'color-mix(in srgb, var(--mv-amber) 8%, transparent)',
          border: '1px solid var(--mv-amber-200)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <Bell size={18} style={{ color: 'var(--mv-amber)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--mv-amber-deep)', fontSize: 14, marginBottom: 4 }}>
              {agedAlerts.length} verified charge{agedAlerts.length !== 1 ? 's' : ''} unbilled for over 14 days
            </div>
            <div style={{ fontSize: 12, color: 'var(--mv-amber-deep)', lineHeight: 1.5 }}>
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
                  background: 'var(--mv-amber-100)', borderRadius: 20,
                  padding: '2px 10px', marginRight: 6, marginBottom: 4,
                  border: '1px solid var(--mv-amber-200)', color: 'var(--mv-amber-deep)',
                }}>
                  {name} · {count}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setFilter('verified', 'true'); setFilter('billed', 'false'); }}
            style={{
              background: 'var(--mv-amber-100)', border: '1px solid var(--mv-amber-200)',
              borderRadius: 6, color: 'var(--mv-amber-deep)', padding: '5px 12px',
              cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            View all
          </button>
          <button onClick={() => setShowAlerts(false)}
            style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <StatCard
          label="Total Charges"
          value={stats?.total_charges ?? '—'}
          color="var(--mv-ink-52)"
        />
        <StatCard
          label="Unpriced"
          value={stats?.unpriced ?? '—'}
          sub={showUnpriced ? 'Showing unpriced only' : 'Click to filter'}
          color="var(--mv-amber-deep)"
          bg={showUnpriced ? 'var(--mv-amber-100)' : 'color-mix(in srgb, var(--mv-amber) 5%, transparent)'}
          onClick={() => { setShowUnpriced(v => !v); setOffset(0); }}
        />
        <StatCard
          label="Pending Billing"
          value={stats?.pending ?? '—'}
          sub="Priced, not yet billed"
          color="var(--mv-amber-deep)"
          bg="color-mix(in srgb, var(--mv-amber) 5%, transparent)"
        />
        <StatCard
          label="Total Value"
          value={gbp(stats?.total_value)}
          color="var(--mv-ink-52)"
        />
        <StatCard
          label="Unbilled Value"
          value={gbp(stats?.unbilled_value)}
          sub="Not yet invoiced"
          color="var(--mv-amber-deep)"
          bg="color-mix(in srgb, var(--mv-amber) 5%, transparent)"
        />
        <StatCard
          label="Profit"
          value={gbp(stats?.profit)}
          sub={stats?.profit_pct != null ? `${stats.profit_pct}% margin` : undefined}
          color={stats?.profit > 0 ? 'var(--mv-green)' : stats?.profit < 0 ? 'var(--mv-magenta)' : 'var(--mv-ink-52)'}
          bg={stats?.profit > 0 ? 'color-mix(in srgb, var(--mv-green) 5%, transparent)' : stats?.profit < 0 ? 'color-mix(in srgb, var(--mv-magenta) 5%, transparent)' : 'color-mix(in srgb, var(--mv-ink) 3%, transparent)'}
        />
        <StatCard
          label="Awaiting Reconciliation"
          value={stats?.awaiting_reconciliation ?? '—'}
          sub="Queued for invoice"
          color="var(--mv-teal)"
          bg="color-mix(in srgb, var(--mv-teal) 5%, transparent)"
        />
        <StatCard
          label="Billed"
          value={stats?.billed ?? '—'}
          color="var(--mv-green)"
          bg="color-mix(in srgb, var(--mv-green) 5%, transparent)"
        />
      </div>

      {/* Filter bar */}
      <div className="moov-card" style={{ padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div className="pill-input-wrap" style={{ minWidth: 240, flex: 1 }}>
            <Search size={14} style={{ marginLeft: 14, color: 'var(--mv-ink-52)', flexShrink: 0 }} />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search customer, order ID, service…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--mv-ink)', fontSize: 13, padding: '8px 14px 8px 8px' }}
            />
            {filters.search && (
              <button onClick={() => setFilter('search', '')}
                style={{ marginRight: 8, background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', padding: 2 }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Customer */}
          <select
            value={filters.customer_id}
            onChange={e => { setFilter('customer_id', e.target.value); setCustomerRepriceResult(null); }}
            className="pill-select"
            style={{ minWidth: 180 }}
          >
            <option value="">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>

          {/* Per-customer reprice button — only shown when a customer is selected */}
          {filters.customer_id && (
            <button
              onClick={repriceForCustomer}
              disabled={customerRepriceRunning}
              title={`Reprice all charges for ${customers.find(c => c.id === filters.customer_id)?.business_name}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: '1px solid var(--mv-purple-200)',
                background: customerRepriceRunning ? 'color-mix(in srgb, var(--mv-purple) 6%, transparent)' : 'var(--mv-purple-100)',
                color: 'var(--mv-purple)',
                cursor: customerRepriceRunning ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <RefreshCw size={11} style={customerRepriceRunning ? { animation: 'spin 1s linear infinite' } : {}} />
              {customerRepriceRunning ? 'Repricing…' : 'Reprice Customer'}
            </button>
          )}

          {/* Verified filter */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified</span>
            {VERIFIED_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setFilter('verified', o.value)}
                style={{
                  padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: '1px solid',
                  borderColor: filters.verified === o.value ? 'var(--mv-teal)' : 'color-mix(in srgb, var(--mv-ink) 10%, transparent)',
                  background: filters.verified === o.value ? 'var(--mv-teal-100)' : 'transparent',
                  color: filters.verified === o.value ? 'var(--mv-teal)' : 'var(--mv-ink-52)',
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
                borderColor: filters.billed === o.value ? 'var(--mv-green)' : 'color-mix(in srgb, var(--mv-ink) 10%, transparent)',
                background: filters.billed === o.value ? 'var(--mv-purple-100)' : 'transparent',
                color: filters.billed === o.value ? 'var(--mv-green)' : 'var(--mv-ink-52)',
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
              borderColor: showUnpriced ? 'var(--mv-amber)' : 'color-mix(in srgb, var(--mv-ink) 10%, transparent)',
              background: showUnpriced ? 'var(--mv-amber-100)' : 'transparent',
              color: showUnpriced ? 'var(--mv-amber-deep)' : 'var(--mv-ink-52)',
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
          <span style={{ color: 'var(--mv-ink-52)', fontSize: 12 }}>–</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={e => setFilter('date_to', e.target.value)}
            className="pill-select"
            style={{ width: 140 }}
            title="To date"
          />

          {/* Clear filters */}
          {(filters.search || filters.customer_id || filters.billed || filters.verified || filters.date_from || filters.date_to || showUnpriced) && (
            <button
              onClick={clearAll}
              style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', fontSize: 12 }}
            >
              Clear
            </button>
          )}

        </div>
      </div>

      {/* Customer reprice result banner */}
      {customerRepriceResult && (
        <div style={{
          background: customerRepriceResult.error ? 'color-mix(in srgb, var(--mv-magenta) 8%, transparent)' : 'color-mix(in srgb, var(--mv-purple) 8%, transparent)',
          border: `1px solid ${customerRepriceResult.error ? 'var(--mv-magenta-200)' : 'var(--mv-purple-200)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {customerRepriceResult.error ? (
            <span style={{ color: 'var(--mv-magenta)', fontSize: 13 }}>Reprice error: {customerRepriceResult.error}</span>
          ) : (
            <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--mv-purple)', fontWeight: 700 }}>✓ Customer reprice complete</span>
              <span style={{ color: 'var(--mv-green)' }}>{customerRepriceResult.repriced} charges updated</span>
              {customerRepriceResult.changed > 0 && (
                <span style={{ color: 'var(--mv-amber-deep)' }}>{customerRepriceResult.changed} prices changed</span>
              )}
              {customerRepriceResult.no_rate > 0 && (
                <span style={{ color: 'var(--mv-magenta)' }}>{customerRepriceResult.no_rate} no rate found</span>
              )}
              {customerRepriceResult.errors > 0 && (
                <span style={{ color: 'var(--mv-magenta)' }}>{customerRepriceResult.errors} errors</span>
              )}
            </div>
          )}
          <button onClick={() => setCustomerRepriceResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-52)', padding: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="moov-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: 'color-mix(in srgb, var(--mv-ink) 2%, transparent)' }}>
                <th style={th}>Date</th>
                <th style={th}>Customer</th>
                <th style={th}>Order ID</th>
                <th style={{ ...th, textAlign: 'center' }}>Qty</th>
                <th style={th}>Service</th>
                <th style={{ ...th, textAlign: 'right' }}>Charge (ex. VAT)</th>
                <th style={{ ...th, textAlign: 'right' }}>Carrier Cost</th>
                <th style={{ ...th, textAlign: 'right' }}>Profit</th>
                <th style={{ ...th, textAlign: 'center' }}>Billed</th>
                <th style={{ ...th, textAlign: 'center' }}>Verified</th>
                <th style={{ ...th, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={11} style={{ ...td, textAlign: 'center', padding: 40, color: 'var(--mv-ink-52)' }}>
                    Loading charges…
                  </td>
                </tr>
              )}
              {!isLoading && displayCharges.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ ...td, textAlign: 'center', padding: 40, color: 'var(--mv-ink-52)' }}>
                    No charges found
                  </td>
                </tr>
              )}
              {displayCharges.map(charge => (
                <tr key={charge.id}
                  style={{
                    opacity: charge.cancelled ? 0.45 : 1,
                    background: charge.price == null ? 'color-mix(in srgb, var(--mv-amber) 3%, transparent)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Date */}
                  <td style={{ ...td, color: 'var(--mv-ink-52)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    <div>{fmt(charge.created_at)}</div>
                    <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{fmtTime(charge.created_at)}</div>
                  </td>

                  {/* Customer */}
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: 'var(--mv-ink)', fontSize: 13 }}>{charge.customer_name || '—'}</div>
                    {charge.customer_account && (
                      <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{charge.customer_account}</div>
                    )}
                  </td>

                  {/* Order ID + Tracking */}
                  <td style={td}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--mv-ink-78)' }}>
                      {charge.order_id || '—'}
                    </span>
                    {charge.tracking_codes?.length > 0 && (
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--mv-teal)', marginTop: 2 }}>
                        {charge.tracking_codes[0]}
                        {charge.tracking_codes.length > 1 && (
                          <span style={{ color: 'var(--mv-ink-52)', marginLeft: 4 }}>+{charge.tracking_codes.length - 1}</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Qty */}
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={{
                      background: 'color-mix(in srgb, var(--mv-ink) 6%, transparent)', borderRadius: 5,
                      padding: '2px 8px', fontSize: 12, fontWeight: 700, color: 'var(--mv-ink-78)',
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
                          <div style={{ width: 20, height: 20, borderRadius: 4, background: '#fff', flexShrink: 0, overflow: 'hidden', border: '1px solid color-mix(in srgb, var(--mv-ink) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={logo} alt={charge.courier} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} onError={e => { e.currentTarget.style.display='none'; }} />
                          </div>
                        ) : null;
                      })()}
                      <div style={{ fontSize: 12, color: 'var(--mv-ink-78)' }}>{charge.service_name || '—'}</div>
                    </div>
                    {charge.courier && (
                      <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 2 }}>{charge.courier}</div>
                    )}
                    {charge.zone_name && (
                      <div style={{ fontSize: 10, color: 'var(--mv-ink-52)', marginTop: 2 }}>
                        {charge.zone_name}{charge.weight_class_name ? ` · ${charge.weight_class_name}` : ''}
                        {charge.price_auto && <span style={{ color: 'var(--mv-green)', marginLeft: 4 }}>●</span>}
                      </div>
                    )}
                  </td>

                  {/* Charge (ex. VAT) — hover shows breakdown */}
                  <td style={{ ...td, textAlign: 'right' }}>
                    {charge.cancelled ? (
                      <span style={{ color: 'var(--mv-ink-52)', textDecoration: 'line-through', fontSize: 12 }}>
                        {(() => {
                          const cls = Array.isArray(charge.charge_lines) ? charge.charge_lines : [];
                          const tot = parseFloat(charge.price || 0) + cls.reduce((s, l) => s + parseFloat(l.price || 0), 0);
                          return gbp(tot);
                        })()}
                      </span>
                    ) : (
                      <ChargeCellSell
                        charge={charge}
                        onSave={(price) => savePrice(charge, price)}
                        onDebug={() => setDebugCharge(charge)}
                      />
                    )}
                  </td>

                  {/* Carrier Cost — hover shows breakdown */}
                  <td style={{ ...td, textAlign: 'right' }}>
                    <ChargeCellCost charge={charge} />
                  </td>

                  {/* Profit */}
                  <td style={{ ...td, textAlign: 'right' }}>
                    {charge.price != null && charge.cost_price != null ? (() => {
                      const lines     = Array.isArray(charge.charge_lines) ? charge.charge_lines : [];
                      const sellTotal = parseFloat(charge.price) + lines.reduce((s, l) => s + parseFloat(l.price || 0), 0);
                      const costTotal = parseFloat(charge.cost_price) + lines.reduce((s, l) => s + parseFloat(l.cost_price ?? l.price ?? 0), 0);
                      const profit    = sellTotal - costTotal;
                      const color     = profit > 0 ? 'var(--mv-green)' : profit < 0 ? 'var(--mv-magenta)' : 'var(--mv-ink-52)';
                      return <span style={{ color, fontWeight: 700, fontSize: 13 }}>{gbp(profit)}</span>;
                    })() : <span style={{ color: 'var(--mv-ink-52)' }}>—</span>}
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

                  {/* Hamburger menu */}
                  <td style={{ ...td, textAlign: 'center' }}>
                    {!charge.cancelled && (
                      <MoreMenu
                        charge={charge}
                        onBill={() => toggleBilled(charge)}
                        onReprice={() => repriceCharge(charge)}
                        onLog={() => setPayloadCharge(charge)}
                        onDebug={() => setDebugCharge(charge)}
                        onCancel={() => cancelCharge(charge)}
                      />
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
            borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10,
          }}>
            <span style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>
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
              <span style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>{currentPage} / {totalPages}</span>
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
          <div style={{ padding: '10px 16px', borderTop: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
            <span style={{ fontSize: 12, color: 'var(--mv-ink-52)' }}>{total} charge{total !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      </>)}

      {/* ── Tab: Awaiting Reconciliation ───────────────────────────────── */}
      {activeTab === 'awaiting' && (
        <AwaitingReconciliationTab customers={customers} gbp={gbp} fmt={fmt} getCourierLogo={getCourierLogo} />
      )}


      {/* ── Tab: Billed ────────────────────────────────────────────────── */}
      {activeTab === 'billed' && (
        <PlaceholderTab
          title="Billed"
          description="All completed invoices sent to customers."
          color="var(--mv-teal)"
        />
      )}

      {/* ── Tab: Credits ───────────────────────────────────────────────── */}
      {activeTab === 'credits' && (
        <PlaceholderTab
          title="Credits"
          description="Credit requests raised against billed invoices, awaiting approval."
          color="var(--mv-amber-deep)"
        />
      )}

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
