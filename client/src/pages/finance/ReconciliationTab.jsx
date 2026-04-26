/**
 * ReconciliationTab — Tab 3 of the Finance page.
 *
 * Flow:
 *   1. Pick a carrier (DHL active, others coming soon)
 *   2. Drop or browse for the carrier invoice CSV
 *   3. CSV is parsed client-side; references are sent to /api/reconciliation/bulk-lookup
 *   4. Results table shows RAG status per shipment
 *   5. Bulk approve / flag actions
 */

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Upload, X, CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronRight, FileText } from 'lucide-react';
import { getCourierLogo } from '../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const gbp = (n) =>
  n == null ? '—' : `£${parseFloat(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function diffLabel(carrierCost, ourCost) {
  if (ourCost == null) return null;
  const diff = parseFloat(carrierCost) - parseFloat(ourCost);
  const sign = diff > 0 ? '+' : '';
  return `${sign}${gbp(diff)}`;
}

// ─── Carrier config ───────────────────────────────────────────────────────────

const CARRIERS = [
  { code: 'DHLParcelUKCloud', label: 'DHL Parcel UK', active: true  },
  { code: 'DPD',              label: 'DPD',           active: false },
  { code: 'Evri',             label: 'Evri',          active: false },
  { code: 'AGL',              label: 'AGL',           active: false },
  { code: 'UPS',              label: 'UPS',           active: false },
  { code: 'PPI',              label: 'PPI',           active: false },
  { code: 'ProCarrier',       label: 'ProCarrier',    active: false },
  { code: 'YodelC2C',         label: 'Yodel C2C',     active: false },
];

// ─── DHL CSV parser ───────────────────────────────────────────────────────────
// DHL Parcel UK invoice CSV format:
//   Column 5  (index 5)  — Net charge value
//   Column 12 (index 11) — Customer reference (MP-XXXXXXXX)
//   Description rows containing "SURCHARGE" are captured separately.

function parseCsvLine(line) {
  const cols = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (c === ',' && !inQ) {
      cols.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  cols.push(cur);
  return cols;
}

function parseDhlCsv(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const shipmentMap = {};   // reference → { reference, carrier_cost, line_count }
  const surcharges  = [];   // { description, value }
  let parsed = 0;
  let skipped = 0;

  for (const line of lines) {
    const cols = parseCsvLine(line);
    if (cols.length < 12) { skipped++; continue; }

    const valueRaw = (cols[5] || '').replace(/[£,\s]/g, '');
    const value    = parseFloat(valueRaw);
    const ref      = (cols[11] || '').trim();
    const desc     = ((cols[3] || cols[2] || cols[1] || '')).trim().toUpperCase();

    if (isNaN(value) || value === 0) { skipped++; continue; }

    // Surcharge rows (no MP- reference or description contains SURCHARGE)
    if (desc.includes('SURCHARGE') && !ref.startsWith('MP-')) {
      surcharges.push({ description: (cols[3] || cols[2] || cols[1] || '').trim(), value });
      parsed++;
      continue;
    }

    // Normal shipment row — must have MP- reference
    if (ref.startsWith('MP-')) {
      if (shipmentMap[ref]) {
        shipmentMap[ref].carrier_cost += value;
        shipmentMap[ref].line_count++;
      } else {
        shipmentMap[ref] = { reference: ref, carrier_cost: value, line_count: 1 };
      }
      parsed++;
    } else {
      skipped++;
    }
  }

  const shipments = Object.values(shipmentMap);
  return { shipments, surcharges, parsed, skipped };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

// Exact match only — carrier invoice must equal our cost price to the penny.
// A half-penny tolerance (0.005) guards against floating-point rounding of
// database numeric values, but anything ≥ 1p is a discrepancy.
const TOLERANCE_ABS = 0.005;

function getStatus(carrierCost, charge) {
  if (!charge) {
    return { code: 'red', label: 'Not Found', color: '#F44336', icon: 'x' };
  }
  if (charge.cost_price == null) {
    return { code: 'amber', label: 'No Cost Recorded', color: '#FFC107', icon: 'warn' };
  }
  const diff = Math.abs(parseFloat(carrierCost) - parseFloat(charge.cost_price));
  if (diff <= TOLERANCE_ABS) {
    return { code: 'green', label: 'Match', color: '#00C853', icon: 'check' };
  }
  return { code: 'red', label: 'Discrepancy', color: '#F44336', icon: 'x' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const Icon = status.icon === 'check'
    ? CheckCircle
    : status.icon === 'warn'
    ? AlertTriangle
    : XCircle;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `${status.color}15`,
      border: `1px solid ${status.color}44`,
      color: status.color,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
    }}>
      <Icon size={11} />
      {status.label}
    </span>
  );
}

// ─── Step 1: Carrier picker ───────────────────────────────────────────────────

function CarrierPicker({ onSelect }) {
  return (
    <div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
        Select the carrier whose invoice you want to reconcile.
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
      }}>
        {CARRIERS.map(carrier => {
          const logo = getCourierLogo(carrier.code);
          return (
            <button
              key={carrier.code}
              onClick={() => carrier.active && onSelect(carrier)}
              disabled={!carrier.active}
              style={{
                position: 'relative',
                background: carrier.active
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${carrier.active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12,
                padding: '20px 16px',
                cursor: carrier.active ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                transition: 'border-color 0.15s, background 0.15s, transform 0.1s',
                opacity: carrier.active ? 1 : 0.5,
              }}
              onMouseEnter={e => {
                if (carrier.active) {
                  e.currentTarget.style.borderColor = 'rgba(0,200,83,0.5)';
                  e.currentTarget.style.background = 'rgba(0,200,83,0.06)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = carrier.active
                  ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
                e.currentTarget.style.background = carrier.active
                  ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Logo */}
              <div style={{
                width: 80, height: 48,
                background: '#FFF',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                opacity: carrier.active ? 1 : 0.4,
              }}>
                {logo ? (
                  <img
                    src={logo}
                    alt={carrier.label}
                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: '#999', fontWeight: 700 }}>
                    {carrier.label.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Label */}
              <div style={{ fontSize: 12, fontWeight: 700, color: carrier.active ? '#CCC' : '#555' }}>
                {carrier.label}
              </div>

              {/* Coming soon badge */}
              {!carrier.active && (
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#444',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '2px 8px',
                }}>
                  Coming soon
                </div>
              )}

              {/* Active indicator */}
              {carrier.active && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#00C853',
                  boxShadow: '0 0 6px #00C853',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: File upload ──────────────────────────────────────────────────────

function FileDropZone({ carrier, onParsed, onBack }) {
  const [dragging, setDragging]   = useState(false);
  const [fileName, setFileName]   = useState(null);
  const [error, setError]         = useState(null);
  const [parsing, setParsing]     = useState(false);
  const inputRef = useRef(null);

  const logo = getCourierLogo(carrier.code);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setError(null);
    setFileName(file.name);
    setParsing(true);
    try {
      const text   = await file.text();
      const result = parseDhlCsv(text);
      if (result.shipments.length === 0) {
        setError('No MP- references found in this CSV. Check the file is a DHL Parcel UK invoice.');
        setParsing(false);
        return;
      }
      onParsed(result, file.name);
    } catch (e) {
      setError(`Failed to parse CSV: ${e.message}`);
    } finally {
      setParsing(false);
    }
  }, [onParsed]);

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const onDragOver  = e => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);

  return (
    <div>
      {/* Back + carrier header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: '#888', padding: '6px 12px',
            cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>
        <div style={{
          background: '#FFF', borderRadius: 8, padding: '4px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 36,
        }}>
          {logo && (
            <img
              src={logo}
              alt={carrier.label}
              style={{ maxHeight: 28, maxWidth: 72, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#CCC' }}>{carrier.label}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Upload your carrier invoice CSV to begin reconciliation</div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'rgba(0,200,83,0.6)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 16,
          background: dragging ? 'rgba(0,200,83,0.04)' : 'rgba(255,255,255,0.02)',
          padding: '60px 40px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: dragging ? 'rgba(0,200,83,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${dragging ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {parsing ? (
            <RefreshCw size={22} style={{ color: '#00C853', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={22} style={{ color: dragging ? '#00C853' : '#666' }} />
          )}
        </div>

        {parsing ? (
          <div style={{ fontSize: 14, color: '#888' }}>Parsing {fileName}…</div>
        ) : fileName ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
              <FileText size={16} style={{ color: '#00C853' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#00C853' }}>{fileName}</span>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>Click or drop to replace</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#CCC', marginBottom: 6 }}>
              Drop your CSV here, or click to browse
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              DHL Parcel UK invoice CSV — shipment references must start with <code style={{ color: '#888', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>MP-</code>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 14,
          background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#F44336', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

// ─── Step 3: Results table ────────────────────────────────────────────────────

function ResultsTable({ carrier, parseResult, fileName, onBack }) {
  const [results,   setResults]   = useState(null);   // null = not yet fetched
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [filter,    setFilter]    = useState('all');  // 'all' | 'green' | 'amber' | 'red'
  const [selected,  setSelected]  = useState(new Set());

  const { shipments, surcharges } = parseResult;

  // ── Lookup on mount ──
  const hasLookedUp = useRef(false);
  const runLookup = useCallback(async () => {
    if (hasLookedUp.current) return;
    hasLookedUp.current = true;
    setLoading(true);
    setError(null);
    try {
      const refs = shipments.map(s => s.reference);
      const resp = await api.post('/reconciliation/bulk-lookup', { courier: carrier.code, references: refs });
      const { matched, unmatched } = resp.data;

      // Build a map from reference → charge
      const chargeMap = {};
      for (const ch of matched) chargeMap[ch.reference] = ch;

      // Merge carrier invoice rows with charge data
      const rows = shipments.map(s => {
        const charge = chargeMap[s.reference] || null;
        const status = getStatus(s.carrier_cost, charge);
        return { ...s, charge, status };
      });

      // Also add rows for unmatched (shouldn't happen often — these are in the DB but not in invoice)
      setResults(rows);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      hasLookedUp.current = false;
    } finally {
      setLoading(false);
    }
  }, [carrier.code, shipments]);

  // Run lookup automatically
  if (!hasLookedUp.current && !loading && !error) {
    runLookup();
  }

  // ── Stats ──
  const counts = results
    ? {
        green: results.filter(r => r.status.code === 'green').length,
        amber: results.filter(r => r.status.code === 'amber').length,
        red:   results.filter(r => r.status.code === 'red').length,
      }
    : null;

  // ── Filter ──
  const displayed = results
    ? (filter === 'all' ? results : results.filter(r => r.status.code === filter))
    : [];

  // ── Select helpers ──
  function toggleRow(ref) {
    setSelected(s => {
      const n = new Set(s);
      n.has(ref) ? n.delete(ref) : n.add(ref);
      return n;
    });
  }
  function toggleAll() {
    if (selected.size === displayed.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayed.map(r => r.reference)));
    }
  }

  const th = {
    fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '10px 12px', whiteSpace: 'nowrap',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  };
  const td = {
    padding: '10px 12px', fontSize: 13, color: '#CCC', verticalAlign: 'middle',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  };

  const logo = getCourierLogo(carrier.code);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: '#888', padding: '6px 12px',
            cursor: 'pointer', fontSize: 12,
          }}
        >
          ← Change file
        </button>
        <div style={{
          background: '#FFF', borderRadius: 8, padding: '4px 10px',
          display: 'flex', alignItems: 'center', height: 36,
        }}>
          {logo && (
            <img src={logo} alt={carrier.label}
              style={{ maxHeight: 28, maxWidth: 72, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#CCC' }}>{carrier.label} — {fileName}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {shipments.length} shipment{shipments.length !== 1 ? 's' : ''} in invoice
            {surcharges.length > 0 && ` · ${surcharges.length} surcharge row${surcharges.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        {!loading && results && (
          <button
            onClick={() => { hasLookedUp.current = false; setResults(null); runLookup(); }}
            style={{
              marginLeft: 'auto', background: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, color: '#888', padding: '6px 12px',
              cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, padding: '60px 0',
        }}>
          <RefreshCw size={28} style={{ color: '#00C853', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, color: '#888' }}>Looking up {shipments.length} charges…</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.3)',
          borderRadius: 10, padding: '16px 20px', color: '#F44336',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <XCircle size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>Lookup failed</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{error}</div>
          </div>
          <button
            onClick={() => { hasLookedUp.current = false; runLookup(); }}
            style={{
              marginLeft: 'auto', background: 'rgba(244,67,54,0.12)',
              border: '1px solid rgba(244,67,54,0.3)', borderRadius: 8,
              color: '#F44336', padding: '6px 14px', cursor: 'pointer', fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {results && counts && !loading && (
        <>
          {/* Surcharges banner */}
          {surcharges.length > 0 && (
            <div style={{
              background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.25)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <AlertTriangle size={14} style={{ color: '#FFC107', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#FFC107', fontWeight: 600 }}>
                {surcharges.length} surcharge row{surcharges.length !== 1 ? 's' : ''} detected in CSV
              </span>
              <span style={{ fontSize: 12, color: '#888' }}>—</span>
              {surcharges.map((s, i) => (
                <span key={i} style={{ fontSize: 12, color: '#999' }}>
                  {s.description}: <span style={{ color: '#FFC107', fontWeight: 700 }}>{gbp(s.value)}</span>
                </span>
              ))}
              <span style={{ fontSize: 11, color: '#666', marginLeft: 4 }}>
                (surcharges are shown for reference — not matched to individual shipments)
              </span>
            </div>
          )}

          {/* Summary stat cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { code: 'all',   label: 'Total',       count: results.length,  color: '#888',    bg: 'rgba(255,255,255,0.03)' },
              { code: 'green', label: 'Matched',      count: counts.green,    color: '#00C853', bg: 'rgba(0,200,83,0.04)'   },
              { code: 'amber', label: 'No Cost',      count: counts.amber,    color: '#FFC107', bg: 'rgba(255,193,7,0.04)'  },
              { code: 'red',   label: 'Problem',      count: counts.red,      color: '#F44336', bg: 'rgba(244,67,54,0.04)'  },
            ].map(stat => (
              <button
                key={stat.code}
                onClick={() => { setFilter(stat.code); setSelected(new Set()); }}
                style={{
                  flex: 1, minWidth: 120,
                  background: filter === stat.code ? `${stat.color}18` : stat.bg,
                  border: `1px solid ${filter === stat.code ? `${stat.color}55` : `${stat.color}22`}`,
                  borderRadius: 10, padding: '14px 18px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{
                  fontSize: 11, color: '#888', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
                }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>
                  {stat.count}
                </div>
              </button>
            ))}

            {/* Total carrier invoice value */}
            <div style={{
              flex: 1, minWidth: 140,
              background: 'rgba(179,157,219,0.04)',
              border: '1px solid rgba(179,157,219,0.2)',
              borderRadius: 10, padding: '14px 18px',
            }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Invoice Total
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#B39DDB' }}>
                {gbp(shipments.reduce((s, r) => s + r.carrier_cost, 0))}
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Carrier charges (excl. surcharges)</div>
            </div>

            {/* Our cost total (matched only) */}
            <div style={{
              flex: 1, minWidth: 140,
              background: 'rgba(0,200,83,0.04)',
              border: '1px solid rgba(0,200,83,0.15)',
              borderRadius: 10, padding: '14px 18px',
            }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Our Cost Total
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#00C853' }}>
                {gbp(results
                  .filter(r => r.charge?.cost_price != null)
                  .reduce((s, r) => s + parseFloat(r.charge.cost_price), 0)
                )}
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>From matched charges</div>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div style={{
              background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.25)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#00C853' }}>
                {selected.size} selected
              </span>
              <span style={{ color: '#444', fontSize: 13 }}>—</span>
              <span style={{ fontSize: 12, color: '#888' }}>
                Bulk actions coming soon
              </span>
              <button
                onClick={() => setSelected(new Set())}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#666', padding: 4,
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { code: 'all',   label: `All (${results.length})` },
              { code: 'red',   label: `Problems (${counts.red})`,   color: '#F44336' },
              { code: 'amber', label: `No Cost (${counts.amber})`,  color: '#FFC107' },
              { code: 'green', label: `Matched (${counts.green})`,  color: '#00C853' },
            ].map(f => (
              <button
                key={f.code}
                onClick={() => { setFilter(f.code); setSelected(new Set()); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 16px', fontSize: 12, fontWeight: 600,
                  color: filter === f.code ? (f.color || '#CCC') : '#555',
                  borderBottom: filter === f.code
                    ? `2px solid ${f.color || '#CCC'}`
                    : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 36 }}>
                      <input
                        type="checkbox"
                        checked={displayed.length > 0 && selected.size === displayed.length}
                        onChange={toggleAll}
                        style={{ cursor: 'pointer', accentColor: '#00C853' }}
                      />
                    </th>
                    <th style={{ ...th, textAlign: 'left' }}>Reference</th>
                    <th style={{ ...th, textAlign: 'left' }}>Customer</th>
                    <th style={{ ...th, textAlign: 'left' }}>Service</th>
                    <th style={{ ...th, textAlign: 'right' }}>Invoice Cost</th>
                    <th style={{ ...th, textAlign: 'right' }}>Our Cost</th>
                    <th style={{ ...th, textAlign: 'right' }}>Difference</th>
                    <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ ...td, textAlign: 'center', color: '#555', padding: '40px 12px' }}>
                        No results to show
                      </td>
                    </tr>
                  )}
                  {displayed.map(row => {
                    const isSelected = selected.has(row.reference);
                    const diff = row.charge?.cost_price != null
                      ? parseFloat(row.carrier_cost) - parseFloat(row.charge.cost_price)
                      : null;
                    const diffColor = diff == null ? '#555'
                      : diff > 0.05 ? '#F44336'
                      : diff < -0.05 ? '#00C853'
                      : '#888';

                    return (
                      <tr
                        key={row.reference}
                        style={{
                          background: isSelected ? 'rgba(0,200,83,0.04)' : undefined,
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleRow(row.reference)}
                      >
                        <td style={{ ...td, textAlign: 'center', width: 36 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(row.reference)}
                            onClick={e => e.stopPropagation()}
                            style={{ cursor: 'pointer', accentColor: '#00C853' }}
                          />
                        </td>
                        <td style={td}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 12,
                            color: '#00C853', fontWeight: 700,
                          }}>
                            {row.reference}
                          </span>
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 12, color: row.charge?.customer_name ? '#CCC' : '#555' }}>
                            {row.charge?.customer_name || '—'}
                          </span>
                          {row.charge?.customer_account && (
                            <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                              {row.charge.customer_account}
                            </div>
                          )}
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 12, color: '#888' }}>
                            {row.charge?.service_name || '—'}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#B39DDB' }}>
                            {gbp(row.carrier_cost)}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <span style={{ color: row.charge?.cost_price != null ? '#CCC' : '#555' }}>
                            {gbp(row.charge?.cost_price)}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          {diff != null ? (
                            <span style={{ color: diffColor, fontWeight: Math.abs(diff) > 0.05 ? 700 : 400 }}>
                              {diff > 0 ? '+' : ''}{gbp(diff)}
                            </span>
                          ) : (
                            <span style={{ color: '#444' }}>—</span>
                          )}
                        </td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {displayed.length > 0 && (
              <div style={{
                padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, color: '#555' }}>
                  {displayed.length} of {results.length} row{results.length !== 1 ? 's' : ''}
                </span>
                {selected.size > 0 && (
                  <span style={{ fontSize: 12, color: '#00C853' }}>
                    {selected.size} selected
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ReconciliationTab ───────────────────────────────────────────────────

export default function ReconciliationTab() {
  // step: 'pick' → 'upload' → 'results'
  const [step,         setStep]        = useState('pick');
  const [carrier,      setCarrier]     = useState(null);
  const [parseResult,  setParseResult] = useState(null);
  const [fileName,     setFileName]    = useState(null);

  function handleCarrierSelect(c) {
    setCarrier(c);
    setStep('upload');
  }

  function handleParsed(result, name) {
    setParseResult(result);
    setFileName(name);
    setStep('results');
  }

  function backToCarrier() {
    setCarrier(null);
    setParseResult(null);
    setFileName(null);
    setStep('pick');
  }

  function backToUpload() {
    setParseResult(null);
    setFileName(null);
    setStep('upload');
  }

  return (
    <div>
      {/* Breadcrumb strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 28, fontSize: 12, color: '#555',
      }}>
        <span
          onClick={step !== 'pick' ? backToCarrier : undefined}
          style={{ cursor: step !== 'pick' ? 'pointer' : 'default', color: step === 'pick' ? '#CCC' : '#00C853' }}
        >
          Select carrier
        </span>
        <ChevronRight size={13} />
        <span style={{ color: step === 'upload' ? '#CCC' : step === 'results' ? '#00C853' : '#444' }}>
          Upload CSV
        </span>
        <ChevronRight size={13} />
        <span style={{ color: step === 'results' ? '#CCC' : '#444' }}>
          Review results
        </span>
      </div>

      {step === 'pick' && (
        <CarrierPicker onSelect={handleCarrierSelect} />
      )}

      {step === 'upload' && carrier && (
        <FileDropZone
          carrier={carrier}
          onParsed={handleParsed}
          onBack={backToCarrier}
        />
      )}

      {step === 'results' && carrier && parseResult && (
        <ResultsTable
          carrier={carrier}
          parseResult={parseResult}
          fileName={fileName}
          onBack={backToUpload}
        />
      )}
    </div>
  );
}
