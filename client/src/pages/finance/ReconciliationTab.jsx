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

import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Upload, X, CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronRight, FileText, ArrowRight, Settings, Plus, Trash2 } from 'lucide-react';
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

  // ── Step 1: find column indices from header row ──────────────────────────
  // DHL may add/remove columns between invoice versions — always derive
  // positions from the header rather than hardcoding index numbers.
  let colValue    = 5;   // fallback: "Value"
  let colRef      = 11;  // fallback: "Reference"
  let colService  = 20;  // fallback: "Service Desc"

  if (lines.length > 0) {
    const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const vi = header.findIndex(h => h === 'value');
    const ri = header.findIndex(h => h === 'reference');
    const si = header.findIndex(h => h.includes('service desc') || h === 'service');
    if (vi !== -1) colValue   = vi;
    if (ri !== -1) colRef     = ri;
    if (si !== -1) colService = si;
  }

  // ── Step 2: process data rows ─────────────────────────────────────────────
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);

    const valueRaw = (cols[colValue] || '').replace(/[£,\s]/g, '');
    const value    = parseFloat(valueRaw);
    const ref      = (cols[colRef]     || '').trim();
    const svcDesc  = (cols[colService] || '').trim().toUpperCase();

    if (isNaN(value) || value === 0) { skipped++; continue; }

    // Surcharge rows — no MP- reference and service description contains "SURCHARGE"
    // (DHL always puts fuel/HGV surcharges at the bottom but we detect by content,
    // not position, so the row number doesn't matter)
    if (!ref.startsWith('MP-') && svcDesc.includes('SURCHARGE')) {
      surcharges.push({ description: (cols[colService] || '').trim(), value });
      parsed++;
      continue;
    }

    // Normal shipment row — must have MP- reference.
    // DHL bills outbound and return as SEPARATE lines with the same reference,
    // so we keep every row individually (no summing).
    if (ref.startsWith('MP-')) {
      const invoiceServiceName = (cols[colService] || '').trim();
      shipmentMap[ref] = shipmentMap[ref] || [];
      shipmentMap[ref].push({ reference: ref, carrier_cost: value, invoice_service_name: invoiceServiceName });
      parsed++;
    } else {
      skipped++;
    }
  }

  // Flatten to array, preserving duplicates — each invoice line is one result row.
  // Attach a lineKey (reference + line index within that reference) so the
  // matching algorithm can tell the two rows apart.
  const shipments = [];
  for (const [ref, lines] of Object.entries(shipmentMap)) {
    lines.forEach((line, i) => {
      shipments.push({ ...line, lineKey: lines.length > 1 ? `${ref}::${i}` : ref });
    });
  }

  return { shipments, surcharges, parsed, skipped };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

// Exact match only — carrier invoice must equal our total cost price to the penny.
// A half-penny tolerance (0.005) guards against floating-point rounding.
// `group` is the server response object: { total_cost_price, has_null_cost, has_return, ... }
const TOLERANCE_ABS = 0.005;

// charge here is a single bestCharge object from the server
function getStatus(carrierCost, charge) {
  if (!charge) {
    return { code: 'red', label: 'Not Found', color: '#F44336', icon: 'x' };
  }
  if (charge.total_cost_price == null) {
    return { code: 'amber', label: 'No Cost Recorded', color: '#FFC107', icon: 'warn' };
  }
  const diff = Math.abs(parseFloat(carrierCost) - charge.total_cost_price);
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

// ─── Service Mapping Manager ──────────────────────────────────────────────────

function ServiceMappingManager({ courier, onClose }) {
  const [mappings,   setMappings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [addInvoice, setAddInvoice] = useState('');
  const [addInternal,setAddInternal]= useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/reconciliation/service-mappings', { params: { courier } });
      setMappings(r.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!addInvoice.trim() || !addInternal.trim()) return;
    setSaving(true); setError(null);
    try {
      await api.post('/reconciliation/service-mappings', {
        courier, invoice_name: addInvoice.trim(), internal_name: addInternal.trim(),
      });
      setAddInvoice(''); setAddInternal('');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setSaving(false);
  }

  async function del(id) {
    try {
      await api.delete(`/reconciliation/service-mappings/${id}`);
      setMappings(m => m.filter(x => x.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: 28, width: 560, maxHeight: '80vh',
        overflow: 'auto', position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Settings size={16} style={{ color: '#00BCD4' }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#CCC' }}>Service Name Mappings</span>
          <span style={{ fontSize: 12, color: '#555', marginLeft: 4 }}>— {courier}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
          Carrier invoice service names (e.g. "HomeServe Sign Mand") rarely match your internal service names.
          Map them here — mappings are saved and applied automatically to all future reconciliations for this carrier.
        </p>

        {/* Add row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.04)', padding: '0 10px' }}>
            <input
              value={addInvoice} onChange={e => setAddInvoice(e.target.value)}
              placeholder="Invoice service name (exact)"
              style={{ background: 'none', border: 'none', color: '#CCC', fontSize: 12, width: '100%', height: 34, outline: 'none' }}
            />
          </div>
          <ArrowRight size={14} style={{ color: '#555' }} />
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.04)', padding: '0 10px' }}>
            <input
              value={addInternal} onChange={e => setAddInternal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="Your internal name"
              style={{ background: 'none', border: 'none', color: '#CCC', fontSize: 12, width: '100%', height: 34, outline: 'none' }}
            />
          </div>
          <button
            onClick={save} disabled={saving || !addInvoice.trim() || !addInternal.trim()}
            style={{
              background: '#00C853', border: 'none', borderRadius: 8, color: '#000',
              fontWeight: 700, fontSize: 12, padding: '0 14px', height: 34, cursor: 'pointer',
              opacity: !addInvoice.trim() || !addInternal.trim() ? 0.4 : 1,
            }}
          >
            {saving ? '…' : <Plus size={14} />}
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: '#F44336', marginBottom: 12 }}>{error}</div>}

        {/* Existing mappings */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#555', fontSize: 13 }}>Loading…</div>
        ) : mappings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#444', fontSize: 13 }}>No mappings yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: '#666', fontWeight: 600, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Invoice Name</th>
                <th style={{ width: 24 }}></th>
                <th style={{ textAlign: 'left', color: '#666', fontWeight: 600, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Internal Name</th>
                <th style={{ width: 32, borderBottom: '1px solid rgba(255,255,255,0.07)' }}></th>
              </tr>
            </thead>
            <tbody>
              {mappings.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 0', color: '#888', fontFamily: 'monospace' }}>{m.invoice_name}</td>
                  <td style={{ textAlign: 'center' }}><ArrowRight size={11} style={{ color: '#444' }} /></td>
                  <td style={{ padding: '8px 0', color: '#CCC', fontWeight: 600 }}>{m.internal_name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => del(m.id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Results table ────────────────────────────────────────────────────

function ResultsTable({ carrier, parseResult, fileName, onBack }) {
  const [results,      setResults]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [filter,       setFilter]       = useState('all');
  const [selected,     setSelected]     = useState(new Set());
  const [refreshCount, setRefreshCount] = useState(0);
  const [mappings,     setMappings]     = useState({});  // invoice_name → internal_name
  const [showMappings, setShowMappings] = useState(false);

  const { shipments, surcharges } = parseResult;

  // Count how many invoice lines share each reference (for the return badge)
  const byRef = {};
  for (const s of shipments) {
    byRef[s.reference] = (byRef[s.reference] || 0) + 1;
  }

  // Collect distinct invoice service names from this CSV
  const invoiceServiceNames = [...new Set(shipments.map(s => s.invoice_service_name).filter(Boolean))];

  // ── Load service mappings ─────────────────────────────────────────────────
  useEffect(() => {
    api.get('/reconciliation/service-mappings', { params: { courier: carrier.code } })
      .then(r => {
        const map = {};
        for (const m of r.data) map[m.invoice_name] = m.internal_name;
        setMappings(map);
      })
      .catch(() => {});
  }, [carrier.code, showMappings]); // reload after mappings modal closes

  // ── Lookup — runs on mount and whenever refreshCount increments ──────────
  // useEffect (not an inline call) ensures the fetch is never stale and the
  // Refresh button always hits the DB fresh (important after cost price edits).
  useEffect(() => {
    let cancelled = false;
    async function doLookup() {
      setLoading(true);
      setError(null);
      setResults(null);
      try {
        const refs = shipments.map(s => s.reference);
        const resp = await api.post('/reconciliation/bulk-lookup', { courier: carrier.code, references: refs });
        if (cancelled) return;
        const { matched } = resp.data;

        // Build a map from reference → group (contains array of DB charges)
        const groupMap = {};
        for (const g of matched) groupMap[g.reference] = g;

        // For each reference that has multiple invoice lines AND multiple DB charges,
        // greedily assign each invoice line to its best-matching (closest cost_price)
        // DB charge, so that outbound→outbound and return→return even when both
        // appear on the same invoice.
        //
        // "Available" charges per reference — clone so we can remove matched ones.
        const available = {};
        for (const g of matched) {
          available[g.reference] = [...g.charges];
        }

        // Sort invoice lines per reference by carrier_cost so we assign cheapest
        // to cheapest DB charge (consistent, avoids ambiguity).
        const invoiceByRef = {};
        for (const s of shipments) {
          invoiceByRef[s.reference] = invoiceByRef[s.reference] || [];
          invoiceByRef[s.reference].push(s);
        }
        for (const lines of Object.values(invoiceByRef)) {
          lines.sort((a, b) => a.carrier_cost - b.carrier_cost);
        }

        const rows = shipments.map(s => {
          const group = groupMap[s.reference] || null;

          let bestCharge = null;
          if (group) {
            const pool = available[s.reference];
            if (pool && pool.length > 0) {
              // Pick the charge whose total_cost_price is closest to this invoice line
              pool.sort((a, b) =>
                Math.abs((a.total_cost_price ?? Infinity) - s.carrier_cost) -
                Math.abs((b.total_cost_price ?? Infinity) - s.carrier_cost)
              );
              bestCharge = pool.shift(); // claim it — can't be used by another line
            }
          }

          const status = getStatus(s.carrier_cost, bestCharge || null);
          return { ...s, group, bestCharge, status };
        });

        setResults(rows);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    doLookup();
    return () => { cancelled = true; };
  }, [refreshCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowMappings(true)}
            style={{
              background: 'rgba(0,188,212,0.08)',
              border: '1px solid rgba(0,188,212,0.25)',
              borderRadius: 8, color: '#00BCD4', padding: '6px 12px',
              cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Settings size={13} /> Service Mappings
          </button>
          {!loading && results && (
            <button
              onClick={() => setRefreshCount(c => c + 1)}
              style={{
                background: 'none',
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
            onClick={() => setRefreshCount(c => c + 1)}
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
      {showMappings && (
        <ServiceMappingManager courier={carrier.code} onClose={() => setShowMappings(false)} />
      )}

      {results && counts && !loading && (
        <>
          {/* Stale cost warning — shown when any matched charge has no cost or when the
              user may have recently updated rate cards without repricing */}
          {counts.red + counts.amber > 0 && (
            <div style={{
              background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.2)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertTriangle size={14} style={{ color: '#FFC107', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#888', flex: 1 }}>
                Costs shown are from <strong style={{ color: '#CCC' }}>stored charges</strong> at the time of dispatch.
                If you have updated rate cards since these shipments were processed, run <strong style={{ color: '#CCC' }}>Full Reprice</strong> from the Finance tab before reconciling.
              </span>
            </div>
          )}

          {/* Unmapped service names warning */}
          {invoiceServiceNames.some(n => !mappings[n]) && (
            <div style={{
              background: 'rgba(0,188,212,0.05)', border: '1px solid rgba(0,188,212,0.2)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <ArrowRight size={14} style={{ color: '#00BCD4', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#888' }}>
                Unmapped service names: {invoiceServiceNames.filter(n => !mappings[n]).map(n => (
                  <span key={n} style={{ background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.25)', color: '#00BCD4', borderRadius: 4, padding: '1px 6px', marginLeft: 6, fontFamily: 'monospace', fontSize: 11 }}>{n}</span>
                ))}
              </span>
              <button
                onClick={() => setShowMappings(true)}
                style={{ marginLeft: 'auto', background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.3)', borderRadius: 6, color: '#00BCD4', fontSize: 11, fontWeight: 700, padding: '3px 10px', cursor: 'pointer' }}
              >
                Map now
              </button>
            </div>
          )}

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
                  .filter(r => r.bestCharge?.total_cost_price != null)
                  .reduce((s, r) => s + r.bestCharge.total_cost_price, 0)
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
                    const isSelected = selected.has(row.lineKey);
                    const g    = row.group;
                    const bc   = row.bestCharge;
                    const diff = bc?.total_cost_price != null
                      ? parseFloat(row.carrier_cost) - bc.total_cost_price
                      : null;
                    const diffColor = diff == null ? '#555'
                      : diff > 0.005 ? '#F44336'
                      : diff < -0.005 ? '#00C853'
                      : '#888';
                    const hasSurcharge = bc?.total_cost_price != null && bc?.base_cost_price != null
                      && Math.abs(bc.total_cost_price - bc.base_cost_price) > 0.005;

                    return (
                      <tr
                        key={row.lineKey}
                        style={{
                          background: isSelected ? 'rgba(0,200,83,0.04)' : undefined,
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleRow(row.lineKey)}
                      >
                        <td style={{ ...td, textAlign: 'center', width: 36 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(row.lineKey)}
                            onClick={e => e.stopPropagation()}
                            style={{ cursor: 'pointer', accentColor: '#00C853' }}
                          />
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontFamily: 'monospace', fontSize: 12,
                              color: '#00C853', fontWeight: 700,
                            }}>
                              {row.reference}
                            </span>
                            {byRef[row.reference] > 1 && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                background: 'rgba(0,188,212,0.12)',
                                border: '1px solid rgba(0,188,212,0.3)',
                                color: '#00BCD4', borderRadius: 20, padding: '1px 6px',
                              }}>
                                return
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 12, color: g?.customer_name ? '#CCC' : '#555' }}>
                            {g?.customer_name || '—'}
                          </span>
                          {g?.customer_account && (
                            <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                              {g.customer_account}
                            </div>
                          )}
                        </td>
                        <td style={td}>
                          {/* Show invoice service name + mapped internal name */}
                          {row.invoice_service_name ? (
                            <div>
                              <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
                                {row.invoice_service_name}
                              </span>
                              {mappings[row.invoice_service_name] ? (
                                <div style={{ fontSize: 11, color: '#00BCD4', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <ArrowRight size={9} /> {mappings[row.invoice_service_name]}
                                </div>
                              ) : (
                                <div
                                  onClick={e => { e.stopPropagation(); setShowMappings(true); }}
                                  style={{ fontSize: 10, color: '#444', marginTop: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                                  title="Click to add mapping"
                                >
                                  <Plus size={9} /> map
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#555' }}>—</span>
                          )}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#B39DDB' }}>
                            {gbp(row.carrier_cost)}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <span style={{ color: bc?.total_cost_price != null ? '#CCC' : '#555' }}>
                            {bc?.total_cost_price != null ? gbp(bc.total_cost_price) : '—'}
                          </span>
                          {hasSurcharge && (
                            <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                              base {gbp(bc.base_cost_price)} + surcharges
                            </div>
                          )}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          {diff != null ? (
                            <span style={{ color: diffColor, fontWeight: Math.abs(diff) > 0.005 ? 700 : 400 }}>
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
          key={fileName}
          carrier={carrier}
          parseResult={parseResult}
          fileName={fileName}
          onBack={backToUpload}
        />
      )}
    </div>
  );
}
