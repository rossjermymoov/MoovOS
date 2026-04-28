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

// Per-shipment surcharge rates — used post-lookup to allocate invoice-level surcharges
const HGV_RATE_PER_PARCEL = 0.13; // £0.13 per parcel — update when DHL changes rate

function parseDhlCsv(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const shipmentMap = {};   // reference → [{ reference, carrier_cost, carrier_surcharges, carrier_total, ... }]
  const surcharges  = [];   // invoice-level surcharge totals { description, value }
  let parsed = 0;
  let skipped = 0;

  // ── Step 1: find column indices from header row ──────────────────────────
  // DHL may add/remove columns between invoice versions — always derive
  // positions from the header rather than hardcoding index numbers.
  let colValue       = 5;   // fallback: "Value" (base freight)
  let colRef         = 11;  // fallback: "Reference"
  let colService     = 20;  // fallback: "Service Desc"
  let colConsignment = 2;   // fallback: column C = consignment/tracking number (outbound DHL tracking)
  let colServiceCode = 7;   // fallback: column H = service code (e.g. "1" for return)
  let colWeight      = -1;  // billed/chargeable weight — detected from header
  let colPieces      = -1;  // piece/item count per consignment — detected from header

  if (lines.length > 0) {
    const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const vi  = header.findIndex(h => h === 'value');
    const ri  = header.findIndex(h => h === 'reference');
    const si  = header.findIndex(h => h.includes('service desc') || h === 'service');
    const ci  = header.findIndex(h =>
      h.includes('consignment') || h.includes('tracking') || h === 'waybill' || h === 'awb'
    );
    const sci = header.findIndex(h =>
      h === 'service code' || h === 'service_code' || h === 'svc code' || h === 'svc'
    );
    // DHL uses various weight column names; prefer "chargeable weight", fall back to first "weight" match
    const wi = header.findIndex(h => h.includes('chargeable') && h.includes('weight'))
            ?? header.findIndex(h => h.includes('billed') && h.includes('weight'));
    const wi2 = header.findIndex(h => h.includes('weight') && !h.includes('over'));
    // Piece/item count column — DHL uses various names, detect as broadly as possible.
    // Log all headers to console so we can identify the exact column name from the actual CSV.
    console.log('[DHL CSV] headers:', header.map((h, i) => `${i}:${h}`).join(', '));
    const pi = header.findIndex(h =>
      h.includes('piece')   ||   // "pieces", "piece count", "no. pieces", "no of pieces"
      h.includes('parcel')  ||   // "parcels", "parcel count", "no. of parcels", "parcel qty"
      h.includes('item')    ||   // "items", "item count", "no. items"
      h.includes('unit')    ||   // "units", "unit count"
      h === 'qty'           ||
      h === 'quantity'      ||
      h === 'count'         ||
      h === 'no'            ||   // bare "no" (DHL sometimes uses this for piece count)
      h === 'num'
    );
    console.log('[DHL CSV] colPieces detected at index:', pi, pi >= 0 ? `("${header[pi]}")` : '(not found — HGV will use 1 per row)');
    if (vi  !== -1) colValue       = vi;
    if (ri  !== -1) colRef         = ri;
    if (si  !== -1) colService     = si;
    if (ci  !== -1) colConsignment = ci;
    if (sci !== -1) colServiceCode = sci;
    if (wi  !== -1) colWeight      = wi;
    else if (wi2 !== -1) colWeight = wi2;
    if (pi  !== -1) colPieces      = pi;
  }

  // Columns W–AE (0-indexed 22–30) contain per-shipment special surcharges:
  //   Z  (25) = long length surcharge
  //   AB (27) = weight surcharge per kg (the £/kg over threshold we bill)
  //   Others may be present (residential, remote area, etc.)
  // These ARE in the invoice line itself and must be summed per shipment.
  // Fuel and HGV surcharges are NOT here — they're invoice-level totals at the
  // bottom (no MP- ref) and are allocated post-lookup.
  const SURCHARGE_COL_START = 22; // W
  const SURCHARGE_COL_END   = 30; // AE

  // ── Step 2: process data rows ─────────────────────────────────────────────
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);

    const ref     = (cols[colRef]     || '').trim();
    const svcDesc = (cols[colService] || '').trim().toUpperCase();

    // ── Parse monetary value — handles £1,234.56, 1234.56, and bracket notation (1234.56) ──
    const rawVal     = (cols[colValue] || '').replace(/[£,\s]/g, '');
    const isBracketed = rawVal.startsWith('(') && rawVal.endsWith(')');
    const value      = isBracketed
      ? -parseFloat(rawVal.slice(1, -1))
      : parseFloat(rawVal);

    // ── Invoice-level surcharge rows ─────────────────────────────────────────────
    // DHL surcharge rows have an empty reference AND columns G–O (indices 6–14)
    // are all blank. The surcharge name is always in column U (index 20).
    // Shipment rows always have a non-empty reference.
    if (!ref) {
      const colsGtoO = cols.slice(6, 15);
      const isSurchargeRow = colsGtoO.every(c => !c.trim()) && !isNaN(value) && value !== 0;
      if (isSurchargeRow) {
        const desc = (cols[20] || '').trim() || 'Surcharge';
        surcharges.push({ description: desc, value: Math.abs(value) });
        parsed++;
      } else {
        skipped++;
      }
      continue;
    }

    // DHL sometimes emits a £0 second line for the same reference on multi-parcel
    // shipments. Don't skip it — merge its piece count into the existing entry.
    if (value === 0 || isNaN(value)) {
      if (shipmentMap[ref] && colPieces >= 0) {
        const piecesRaw = (cols[colPieces] || '').replace(/[,\s]/g, '');
        const extraPieces = parseInt(piecesRaw, 10);
        if (!isNaN(extraPieces) && extraPieces > 0) {
          const existing = shipmentMap[ref][shipmentMap[ref].length - 1];
          existing.csv_piece_count = (existing.csv_piece_count || 1) + extraPieces;
        }
      }
      skipped++;
      continue;
    }

    // Normal shipment row
    const invoiceServiceName = (cols[colService]     || '').trim();
    const consignmentNumber  = (cols[colConsignment] || '').trim();
    const invoiceServiceCode = (cols[colServiceCode] || '').trim();
    // Column A (index 0) always contains the DHL account number — every DHL
    // customer has a unique account number so this identifies the customer even
    // when the shipment reference doesn't match anything in our DB (e.g. returns).
    const accountNumber      = (cols[0]              || '').trim();

    // Sum per-shipment surcharges from columns W–AE (weight, length, etc.)
    // Fuel and HGV are NOT in these columns — those are invoice-level totals.
    let csvSurcharges = 0;
    for (let col = SURCHARGE_COL_START; col <= SURCHARGE_COL_END; col++) {
      const raw = (cols[col] || '').replace(/[£,\s]/g, '');
      const n   = parseFloat(raw);
      if (!isNaN(n) && n !== 0) csvSurcharges += Math.abs(n);
    }

    // Billed (chargeable) weight from invoice — may differ from declared weight
    const billedWeightRaw = colWeight >= 0 ? (cols[colWeight] || '').replace(/[,\s]/g, '') : '';
    const billedWeightKg  = billedWeightRaw !== '' ? parseFloat(billedWeightRaw) : null;

    // Piece count per consignment — DHL charge HGV per piece, not per line.
    // If the column wasn't detected (colPieces === -1), OR the cell is empty,
    // use null so the fallback to bestCharge.parcel_count kicks in.
    // IMPORTANT: do NOT default to 1 when the cell is empty — that would mask
    // the correct DB parcel_count (e.g. 31 would become 1).
    const piecesRaw   = colPieces >= 0 ? (cols[colPieces] || '').replace(/[,\s]/g, '') : '';
    const csvPieces   = piecesRaw !== '' && !isNaN(parseInt(piecesRaw, 10))
      ? parseInt(piecesRaw, 10)
      : null;  // empty cell OR column not found → null, fall back to DB parcel_count

    shipmentMap[ref] = shipmentMap[ref] || [];
    shipmentMap[ref].push({
      reference:              ref,
      consignment_number:     consignmentNumber  || null,
      invoice_service_code:   invoiceServiceCode || null,
      account_number:         accountNumber      || null,
      carrier_cost:           value,
      carrier_csv_surcharges: csvSurcharges,
      carrier_surcharges:     0,
      carrier_total:          value,
      billed_weight_kg:       isNaN(billedWeightKg) ? null : billedWeightKg,
      csv_piece_count:        csvPieces,
      invoice_service_name:   invoiceServiceName,
    });
    parsed++;
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

// Per-shipment comparison uses carrier_total (base + columns W–AE surcharges) vs our
// total_cost_price (base + stored fuel/surcharge charges). This gives a true like-for-like
// match — both sides include the same surcharge components.
// Invoice-level FUEL/HGV rows at the bottom are reconciled separately.
const TOLERANCE_ABS = 0.005;

// carrierTotal   = row.carrier_total (base + W-AE surcharges from invoice)
// charge         = bestCharge from DB (has base_cost_price, total_cost_price)
// overrideCost   = row.effective_cost — pass when per-kg overage has been added so the
//                  comparison is against the adjusted expected cost, not the stored total.
function getStatus(carrierTotal, charge, overrideCost = null) {
  if (!charge) {
    return { code: 'red', label: 'Not Found', color: '#F44336', icon: 'x' };
  }
  const compareCost = overrideCost ?? charge.total_cost_price;
  if (compareCost == null) {
    return { code: 'amber', label: 'No Cost Recorded', color: '#FFC107', icon: 'warn' };
  }
  const diff = Math.abs(parseFloat(carrierTotal) - compareCost);
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
        setError('No shipment rows found in this CSV. Check the file is a DHL Parcel UK invoice.');
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
              DHL Parcel UK invoice CSV
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

function ServiceMappingManager({ courier, carrierLabel, unmappedNames, onClose }) {
  const [mappings,    setMappings]    = useState([]);
  const [services,    setServices]    = useState([]);   // our internal services for this courier
  const [loadingMap,  setLoadingMap]  = useState(true);
  const [addInvoice,  setAddInvoice]  = useState(unmappedNames?.[0] || '');
  const [addInternal, setAddInternal] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  async function loadMappings() {
    setLoadingMap(true);
    try {
      const r = await api.get('/reconciliation/service-mappings', { params: { courier } });
      setMappings(r.data);
    } catch { /* ignore */ }
    setLoadingMap(false);
  }

  useEffect(() => {
    loadMappings();
    // Fetch our services for this courier (filter by courier name keyword)
    api.get('/carriers/services').then(r => {
      const all = r.data || [];
      const keyword = (carrierLabel || '').split(' ')[0].toLowerCase(); // e.g. "dhl"
      const filtered = all.filter(s =>
        s.courier_name?.toLowerCase().includes(keyword) ||
        s.courier_code?.toLowerCase().includes(keyword)
      );
      setServices(filtered.length > 0 ? filtered : all);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!addInvoice.trim() || !addInternal.trim()) return;
    setSaving(true); setError(null);
    try {
      await api.post('/reconciliation/service-mappings', {
        courier, invoice_name: addInvoice.trim(), internal_name: addInternal.trim(),
      });
      setAddInvoice('');
      setAddInternal('');
      await loadMappings();
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

  const mappedInvoiceNames = new Set(mappings.map(m => m.invoice_name));
  const stillUnmapped = (unmappedNames || []).filter(n => !mappedInvoiceNames.has(n));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: 28, width: 600, maxHeight: '85vh',
        overflow: 'auto', position: 'relative',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Settings size={16} style={{ color: '#00BCD4' }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#CCC' }}>Service Name Mappings</span>
          <span style={{ fontSize: 12, color: '#555', marginLeft: 4 }}>— {carrierLabel}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
          Map the service names on the carrier invoice to your internal services.
          Mappings are saved and applied automatically to future reconciliations.
        </p>

        {/* Unmapped names from this invoice — quick-select chips */}
        {stillUnmapped.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              From this invoice — click to map
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stillUnmapped.map(n => (
                <button key={n} onClick={() => { setAddInvoice(n); setAddInternal(''); }}
                  style={{
                    background: addInvoice === n ? 'rgba(0,188,212,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${addInvoice === n ? 'rgba(0,188,212,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
                    fontSize: 12, color: addInvoice === n ? '#00BCD4' : '#888',
                    fontFamily: 'monospace',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add mapping form */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Add mapping
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 10, alignItems: 'center' }}>

            {/* Invoice name — editable, pre-filled from chip selection */}
            <div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>Invoice service name (exact)</div>
              <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.04)', padding: '0 10px' }}>
                <input
                  value={addInvoice} onChange={e => setAddInvoice(e.target.value)}
                  placeholder="e.g. HomeServe Sign Mand"
                  style={{ background: 'none', border: 'none', color: '#CCC', fontSize: 12, width: '100%', height: 34, outline: 'none', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <ArrowRight size={14} style={{ color: '#444' }} />

            {/* Internal name — dropdown of our services */}
            <div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
                Your service{services.length === 0 ? ' (loading…)' : ''}
              </div>
              <select
                value={addInternal} onChange={e => setAddInternal(e.target.value)}
                style={{
                  width: '100%', height: 34,
                  background: '#0E0E1A', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, color: addInternal ? '#CCC' : '#555',
                  fontSize: 12, padding: '0 10px', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">— Select service —</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.service_code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={save} disabled={saving || !addInvoice.trim() || !addInternal.trim()}
              style={{
                background: '#00C853', border: 'none', borderRadius: 8, color: '#000',
                fontWeight: 700, fontSize: 12, padding: '0 16px', height: 34, cursor: 'pointer',
                opacity: !addInvoice.trim() || !addInternal.trim() ? 0.4 : 1, marginTop: 20,
              }}
            >
              {saving ? '…' : 'Save'}
            </button>
          </div>
          {error && <div style={{ fontSize: 12, color: '#F44336', marginTop: 8 }}>{error}</div>}
        </div>

        {/* Existing mappings */}
        <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Saved mappings
        </div>
        {loadingMap ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#555', fontSize: 13 }}>Loading…</div>
        ) : mappings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#444', fontSize: 13 }}>No mappings yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: '#555', fontWeight: 600, padding: '6px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Invoice Name</th>
                <th style={{ width: 24 }}></th>
                <th style={{ textAlign: 'left', color: '#555', fontWeight: 600, padding: '6px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Internal Service</th>
                <th style={{ width: 32, borderBottom: '1px solid rgba(255,255,255,0.07)' }}></th>
              </tr>
            </thead>
            <tbody>
              {mappings.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 0', color: '#888', fontFamily: 'monospace' }}>{m.invoice_name}</td>
                  <td style={{ textAlign: 'center' }}><ArrowRight size={11} style={{ color: '#444' }} /></td>
                  <td style={{ padding: '9px 0', color: '#00BCD4', fontWeight: 600 }}>{m.internal_name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => del(m.id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 0 }}
                      title="Remove mapping">
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
  const [mappings,          setMappings]          = useState({});  // invoice_name → internal_name (manual)
  const [serviceCodeMap,    setServiceCodeMap]    = useState({});  // service_code → service_name (auto, for display)
  const [serviceNameToCode, setServiceNameToCode] = useState({});  // service_name → service_code (reverse, for charge matching)
  const [carrierRates,      setCarrierRates]      = useState({});  // service_code → price_first (for returns etc.)

  // Refs so async closures (doLookup) always read the latest values
  // rather than the stale empty {} captured at mount time.
  const mappingsRef      = useRef({});
  const svcNameToCodeRef = useRef({});
  const carrierRatesRef  = useRef({});
  const [showMappings,      setShowMappings]      = useState(false);
  const [acceptedSurcharges, setAcceptedSurcharges] = useState(new Set()); // accepted known-variance surcharges

  const { shipments, surcharges } = parseResult;

  // Count how many invoice lines share each reference (for the return badge)
  const byRef = {};
  for (const s of shipments) {
    byRef[s.reference] = (byRef[s.reference] || 0) + 1;
  }

  // Collect distinct invoice service names from this CSV
  const invoiceServiceNames = [...new Set(shipments.map(s => s.invoice_service_name).filter(Boolean))];

  // ── Load service mappings + build service code lookup ────────────────────
  useEffect(() => {
    api.get('/reconciliation/service-mappings', { params: { courier: carrier.code } })
      .then(r => {
        const map = {};
        for (const m of r.data) map[m.invoice_name] = m.internal_name;
        mappingsRef.current = map;
        setMappings(map);
      })
      .catch(e => {
        console.error('[ReconciliationTab] Failed to load service mappings:', e?.response?.data || e.message);
      });
  }, [carrier.code, showMappings]); // reload after mappings modal closes

  // Fetch all carrier services and build two maps:
  //   serviceCodeMap:    service_code → service_name  (used for display: auto-resolve invoice code to friendly name)
  //   serviceNameToCode: service_name → service_code  (used for charge matching: resolve friendly name back to code)
  // Both are needed because service mappings store the friendly name ("DHL Return") but
  // DB charges are stored by service code ("DHL-1"). We must match on the code, not the name.
  useEffect(() => {
    api.get('/carriers/services').then(r => {
      const codeMap    = {};
      const nameToCode = {};
      for (const s of (r.data || [])) {
        const code = (s.service_code || '').trim();
        const name = (s.name        || '').trim();
        if (code) codeMap[code]    = name;
        if (name) nameToCode[name] = code;
      }
      svcNameToCodeRef.current = nameToCode;
      setServiceCodeMap(codeMap);
      setServiceNameToCode(nameToCode);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch carrier cost rates (used for return service comparison — service code "1" etc.)
  useEffect(() => {
    const courierKeyword = carrier.label.split(' ')[0]; // e.g. "DHL"
    api.get('/reconciliation/carrier-service-rates', { params: { courier: courierKeyword } })
      .then(r => {
        const rateMap = {};
        for (const row of (r.data || [])) {
          if (row.service_code) rateMap[row.service_code.trim()] = row;
        }
        carrierRatesRef.current = rateMap;
        setCarrierRates(rateMap);
      })
      .catch(() => {}); // non-critical — silently skip if endpoint not available
  }, [carrier.code]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const refs           = shipments.map(s => s.reference);
        const trackingNumbers = shipments
          .map(s => s.consignment_number)
          .filter(Boolean);
        // Unique DHL account numbers from column A — lets us identify customers
        // for return rows that have no matching shipment reference in the DB.
        const accountNumbers = [...new Set(
          shipments.map(s => s.account_number).filter(Boolean)
        )];

        const resp = await api.post('/reconciliation/bulk-lookup', {
          courier:          carrier.code,
          references:       refs,
          tracking_numbers: trackingNumbers,
          account_numbers:  accountNumbers,
        });
        if (cancelled) return;
        const { matched, customers_by_account, charges_by_customer, carrier_service_costs, carrier_per_kg_rates, customer_rates_by_customer } = resp.data;

        // Build a map from reference → group (contains array of DB charges)
        const groupMap = {};
        for (const g of matched) groupMap[g.reference] = g;

        // Build a map from tracking code → group for primary-key matching.
        // If a consignment number matches, it takes priority over the reference.
        const trackingMap = {};
        for (const g of matched) {
          for (const tc of (g.tracking_codes || [])) {
            if (tc) trackingMap[tc] = g;
          }
        }

        // Build account number → customer map from the MATCHED outbound rows on
        // this invoice. Every shipment on a DHL invoice has the customer's DHL
        // account number in column A. For outbound rows that DID match we already
        // know the customer — so we derive the mapping from the invoice itself
        // rather than waiting for account numbers to be entered in the UI.
        // This lets returns (same account number, no matching reference) resolve
        // their customer immediately with no extra DB data required.
        const localAccountMap = {};
        for (const s of shipments) {
          if (!s.account_number) continue;
          if (localAccountMap[s.account_number]) continue; // already resolved
          const g = (s.consignment_number && trackingMap[s.consignment_number])
            || groupMap[s.reference]
            || null;
          if (g && g.customer_name) {
            localAccountMap[s.account_number] = {
              customer_id:   g.customer_id,
              customer_name: g.customer_name,
            };
          }
        }

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

        // ── Post-lookup surcharge allocation ──────────────────────────────────
        // DHL invoice surcharges are invoice-level totals with no per-shipment breakdown.
        // Fuel is allocated proportionally to each shipment's share of the total net cost.
        // HGV is calculated as parcel_count × £0.13 per shipment (from DB).
        const invoiceFuelTotal = surcharges
          .filter(s => s.description.toUpperCase().includes('FUEL'))
          .reduce((sum, s) => sum + s.value, 0);
        const invoiceHgvTotal = surcharges
          .filter(s => s.description.toUpperCase().includes('HGV'))
          .reduce((sum, s) => sum + s.value, 0);

        // Total base cost across ALL invoice shipments (denominator for proportional fuel)
        const totalInvoiceBase = shipments.reduce((sum, s) => sum + s.carrier_cost, 0);

        // First pass: assign bestCharge (matching against base cost for now)
        // Tracking number (column C) is the primary key — more reliable than reference
        // because it uniquely identifies the outbound shipment even when references repeat.
        const rows = shipments.map(s => {
          // Resolve which DB group this invoice line belongs to:
          // 1. Match by consignment number (outbound tracking) — most reliable
          // 2. Fall back to reference (order_id)
          // 3. For returns/unmatched: account number tells us the customer
          const group = (s.consignment_number && trackingMap[s.consignment_number])
            || groupMap[s.reference]
            || null;
          // Customer info for rows that don't match any charge (e.g. DHL returns):
          // 1. localAccountMap — derived from matched outbound rows on this invoice
          //    (works immediately, no manual data entry required)
          // 2. customers_by_account — from backend DB lookup (works once account
          //    numbers have been entered in the carrier pricing UI)
          const accountCustomer = (!group && s.account_number)
            ? (localAccountMap[s.account_number] || customers_by_account?.[s.account_number] || null)
            : null;

          let bestCharge = null;
          if (group) {
            const pool = available[group.reference];
            if (pool && pool.length > 0) {
              pool.sort((a, b) =>
                Math.abs((a.base_cost_price ?? Infinity) - s.carrier_cost) -
                Math.abs((b.base_cost_price ?? Infinity) - s.carrier_cost)
              );
              bestCharge = pool.shift();
            }
          }
          return { ...s, group, bestCharge, accountCustomer };
        });

        // ── Second match pass: exact service-code match for unmatched rows ─────
        // For invoice rows that identified a customer but have no bestCharge,
        // look for a DB charge for that customer with the exact matching service.
        //
        // Matching rule: invoice service code → mapping → friendly name →
        //   svcNameToCode → internal service code → charge.dc_service_id (exact).
        // Service names are display labels only and must never be used for matching.
        // No guessing — if nothing matches exactly, bestCharge stays null.
        for (const row of rows) {
          if (row.bestCharge) continue;
          const cid = row.accountCustomer?.customer_id;
          if (!cid) continue;

          const liveMappings   = mappingsRef.current;
          const liveNameToCode = svcNameToCodeRef.current;

          const invoiceSvcCode = (row.invoice_service_code || '').trim();
          const invoiceSvcName = (row.invoice_service_name || '').trim();
          // invoice code → mapping → friendly name → service code
          const mappedName    = liveMappings[invoiceSvcCode] || liveMappings[invoiceSvcName] || invoiceSvcName;
          const resolvedCode  = (liveNameToCode[mappedName] || '').trim();

          // Without a resolved service code we cannot match safely — skip.
          if (!resolvedCode) continue;

          // Match exclusively on dc_service_id (the unique carrier service code).
          const matches = (c) => {
            const sid = (c.dc_service_id || '').trim();
            return sid !== '' && sid.toLowerCase() === resolvedCode.toLowerCase();
          };

          // First: search charges_by_customer — charges for this customer whose
          // order_id was NOT in the invoice refs (e.g. return bookings stored
          // under their own MP- reference, not on the DHL invoice).
          const customerPool = charges_by_customer?.[String(cid)];
          if (customerPool?.length) {
            const idx = customerPool.findIndex(matches);
            if (idx !== -1) {
              row.bestCharge = customerPool.splice(idx, 1)[0];
              continue;
            }
          }

          // Fallback: search available pools (charges already fetched by reference).
          for (const [ref, pool] of Object.entries(available)) {
            if (!pool.length) continue;
            const g = groupMap[ref];
            if (!g || String(g.customer_id) !== String(cid)) continue;

            const idx = pool.findIndex(matches);
            if (idx === -1) continue;

            row.bestCharge = pool.splice(idx, 1)[0];
            if (!row.group) row.group = g;
            break;
          }
        }

        // Third pass: add fuel/HGV allocation to each shipment row.
        // carrier_csv_surcharges = W-AE breakdown columns — these are ALREADY inside carrier_cost
        //                          (the invoice Value column is the total; W-AE just show what makes it up)
        //                          Store for informational display only — do NOT add to total.
        // carrier_fuel_alloc     = proportional share of invoice FUEL SURCHARGE total
        // carrier_hgv_alloc      = parcel_count × £0.13
        // carrier_total          = carrier_cost + fuel_alloc + hgv_alloc   (W-AE already inside carrier_cost)
        rows.forEach(row => {
          // Round fuel allocation to 2dp — raw float division introduces sub-penny
          // errors that break the 0.5p tolerance when summed against the DB value.
          const fuelAlloc = totalInvoiceBase > 0
            ? Math.round((row.carrier_cost / totalInvoiceBase) * invoiceFuelTotal * 100) / 100
            : 0;
          // Piece count priority: csv_piece_count (from invoice, what DHL actually charged HGV on)
          // → bestCharge.parcel_count (DB fallback) → 1.
          const pieceCount = row.csv_piece_count ?? row.bestCharge?.parcel_count ?? 1;
          const hgvAlloc = invoiceHgvTotal > 0
            ? pieceCount * HGV_RATE_PER_PARCEL
            : 0;
          row.carrier_fuel_alloc = fuelAlloc;
          row.carrier_hgv_alloc  = hgvAlloc;
          // W-AE (carrier_csv_surcharges) intentionally excluded — already in carrier_cost
          row.carrier_surcharges = fuelAlloc + hgvAlloc;
          row.carrier_total      = row.carrier_cost + row.carrier_surcharges;

          // Return service detection — service code "1" only.
          // We do not infer return status from service name substrings.
          // Service code "1" is DHL's return service; it is configured in our
          // services table and must be mapped explicitly if DHL uses a different code.
          const isReturn = row.invoice_service_code === '1';

          if (isReturn) {
            row.is_return = true;
            // Return to sender — never booked in our system, no DB charge exists or ever will.
            // Resolve via the mapping chain: invoice code → friendly name → service code.
            const svcCode      = (row.invoice_service_code || '').trim();
            const svcName      = (row.invoice_service_name || '').trim();
            const mappedName   = mappingsRef.current[svcCode] || mappingsRef.current[svcName] || svcName;
            const resolvedCode = svcNameToCodeRef.current[mappedName] || null;

            // Cost price = what we pay the carrier (from carrier rate card, e.g. £14.21 for DHL-1).
            // This is the correct comparison target against the DHL invoice amount.
            const costPrice   = resolvedCode ? (carrier_service_costs?.[resolvedCode] ?? null) : null;

            // Sell price = what we charge the customer (from customer_rates, e.g. £14.91 for DHL-1).
            // Stored separately for billing — not used for the invoice comparison.
            const cid         = row.accountCustomer?.customer_id;
            const custRates   = cid ? (customer_rates_by_customer?.[String(cid)] || {}) : {};
            const rateEntry   = resolvedCode ? (custRates[resolvedCode] || null) : null;
            row.customer_sell = rateEntry?.price ?? null;

            // Expected carrier total = cost × (1 + fuel%) + HGV per parcel
            // Matches the same fuel/HGV methodology applied to outbound rows.
            const effectiveFuelRate  = totalInvoiceBase > 0 ? invoiceFuelTotal / totalInvoiceBase : 0;
            const rateFuelAlloc      = costPrice != null
              ? parseFloat((costPrice * effectiveFuelRate).toFixed(2))
              : null;
            row.carrier_rate_base    = costPrice;           // bare cost (e.g. £14.21)
            row.carrier_rate_fuel    = rateFuelAlloc;       // fuel component (e.g. £1.09)
            row.carrier_rate_hgv     = HGV_RATE_PER_PARCEL; // HGV component (£0.13)
            row.carrier_rate_cost    = costPrice != null
              ? parseFloat((costPrice + (rateFuelAlloc ?? 0) + HGV_RATE_PER_PARCEL).toFixed(2))
              : null;

            if (row.carrier_rate_cost != null) {
              // Compare carrier_total (what DHL billed, incl. fuel+HGV) vs carrier_rate_cost
              // (our expected total incl. fuel+HGV) — apples to apples.
              const diff = row.carrier_total - row.carrier_rate_cost;
              row.status = Math.abs(diff) <= 0.01
                ? { code: 'green', label: 'Matched',     color: '#00C853', icon: 'check'    }
                : diff > 0
                ? { code: 'red',   label: 'Overcharged', color: '#F44336', icon: 'x'        }
                : { code: 'amber', label: 'Credit',       color: '#FF9800', icon: 'triangle' };
            } else {
              row.status = { code: 'red', label: 'No Rate Found', color: '#F44336', icon: 'x' };
            }
          } else {
            row.is_return = false;
            const bc = row.bestCharge || null;
            // Per-kg overage: if DHL billed above the contracted threshold weight
            // (e.g. 46 kg on a 0–30 kg rate card), add the excess at the carrier's
            // per-kg rate so the comparison is done at the invoiced weight.
            if (bc) {
              // Use dc_service_id (the unique carrier service code, e.g. "DHLPUKC-220") for
              // all carrier rate lookups. service_name is a display label and must not be used.
              const bcSvcCode = (bc.dc_service_id || '').trim() || null;
              const pkrList   = bcSvcCode ? (carrier_per_kg_rates?.[bcSvcCode] || []) : [];
              const pkr       = pkrList.find(e => Math.abs(e.zone_base_price - bc.base_cost_price) < 0.01) || null;
              if (pkr && row.billed_weight_kg != null) {
                const threshold  = pkr.threshold_kg || 30;
                const overageKg  = Math.max(0, row.billed_weight_kg - threshold);
                row.per_kg_extra = overageKg > 0
                  ? parseFloat((overageKg * pkr.cost_per_kg).toFixed(2))
                  : 0;
              } else {
                row.per_kg_extra = 0;
              }
              if (row.per_kg_extra > 0 && bc.base_cost_price != null) {
                // The stored fuel charge was calculated at booking time on the flat band
                // rate, but DHL's invoice fuel is proportional to the full freight including
                // per-kg overage. Recalculate fuel on the adjusted freight base so both
                // sides use the same proportional rate and the comparison is exact.
                const effectiveFuelRate = totalInvoiceBase > 0 ? invoiceFuelTotal / totalInvoiceBase : 0;
                const freightBase       = bc.base_cost_price + row.per_kg_extra;
                const recalcFuel        = parseFloat((freightBase * effectiveFuelRate).toFixed(2));
                row.effective_fuel      = recalcFuel;
                row.effective_cost      = parseFloat((freightBase + recalcFuel + (bc.hgv_cost_price || 0)).toFixed(2));
              } else {
                row.effective_fuel = null;
                row.effective_cost = bc.total_cost_price != null
                  ? parseFloat((bc.total_cost_price + row.per_kg_extra).toFixed(2))
                  : null;
              }
            } else {
              row.per_kg_extra   = 0;
              row.effective_cost = null;
            }
            row.status = getStatus(row.carrier_total, bc, row.effective_cost);
          }
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

  // ── Surcharge reconciliation totals ──
  // FUEL: compare invoice fuel total vs sum of stored fuel charge cost_prices across matched.
  // HGV: compare invoice HGV total vs total_parcels × HGV_RATE_PER_PARCEL (defined above).
  const matchedWithCost = results
    ? results.filter(r => r.bestCharge?.base_cost_price != null)
    : [];

  const ourFuelCostTotal   = matchedWithCost.reduce((s, r) => s + (r.bestCharge.fuel_cost_price || 0), 0);
  // HGV: total parcel count across all matched shipments.
  // Use same priority as the per-row hgvAlloc calculation:
  //   1. csv_piece_count  — from the invoice itself (what DHL actually charged HGV on)
  //   2. bestCharge.parcel_count — from shipments.parcel_count in DB (set by webhook)
  //   3. 1 — safe fallback
  // Include return rows (no DB charge, never booked) as well as normal matched rows —
  // returns still attract the HGV surcharge and their parcel count must be accounted for.
  const totalMatchedPieces = results
    ? results.filter(r => r.bestCharge || r.is_return).reduce(
        (s, r) => s + (r.csv_piece_count ?? r.bestCharge?.parcel_count ?? 1),
        0
      )
    : 0;
  const ourHgvCalcTotal    = totalMatchedPieces * HGV_RATE_PER_PARCEL;
  const invoiceSurchargeTotal = surcharges.reduce((s, r) => s + r.value, 0);

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
        <ServiceMappingManager
          courier={carrier.code}
          carrierLabel={carrier.label}
          unmappedNames={invoiceServiceNames.filter(n => !mappings[n] && !serviceCodeMap[n?.trim()])}
          onClose={() => setShowMappings(false)}
        />
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

          {/* Unmapped service names warning — exclude names already auto-resolved via serviceCodeMap */}
          {invoiceServiceNames.some(n => !mappings[n] && !serviceCodeMap[n?.trim()]) && (
            <div style={{
              background: 'rgba(0,188,212,0.05)', border: '1px solid rgba(0,188,212,0.2)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <ArrowRight size={14} style={{ color: '#00BCD4', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#888' }}>
                Unmapped service names: {invoiceServiceNames.filter(n => !mappings[n] && !serviceCodeMap[n?.trim()]).map(n => (
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
                {gbp(shipments.reduce((s, r) => s + r.carrier_total, 0))}
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Base + per-shipment surcharges</div>
            </div>

            {/* Our cost total (matched only — base freight, excl. surcharges) */}
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
                  .filter(r => r.bestCharge?.base_cost_price != null)
                  .reduce((s, r) => s + r.bestCharge.base_cost_price, 0)
                )}
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Base freight, matched charges</div>
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
                    <th style={{ ...th, textAlign: 'right' }}>Weight</th>
                    <th style={{ ...th, textAlign: 'right' }}>Invoice Cost</th>
                    <th style={{ ...th, textAlign: 'right' }}>Our Cost</th>
                    <th style={{ ...th, textAlign: 'right' }}>Difference</th>
                    <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 && filter === 'all' && surcharges.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ ...td, textAlign: 'center', color: '#555', padding: '40px 12px' }}>
                        No results to show
                      </td>
                    </tr>
                  )}
                  {displayed.length === 0 && filter !== 'all' && (
                    <tr>
                      <td colSpan={9} style={{ ...td, textAlign: 'center', color: '#555', padding: '40px 12px' }}>
                        No results to show
                      </td>
                    </tr>
                  )}
                  {displayed.map(row => {
                    const isSelected = selected.has(row.lineKey);
                    const g    = row.group;
                    const bc   = row.bestCharge;
                    // carrier_total = base + per-shipment surcharges from invoice columns W–AE
                    // Returns with a matched DB charge compare like normal outbound rows.
                    // Returns with no DB charge compare carrier_cost vs static carrier rate.
                    const diff = (row.is_return && !bc)
                      ? (row.carrier_rate_cost != null ? row.carrier_total - row.carrier_rate_cost : null)
                      : (row.effective_cost != null ? row.carrier_total - row.effective_cost
                          : bc?.total_cost_price != null ? row.carrier_total - bc.total_cost_price : null);
                    const diffColor = diff == null ? '#555'
                      : diff > 0.005 ? '#F44336'
                      : diff < -0.005 ? '#00C853'
                      : '#888';
                    // Show breakdown sub-line if there are fuel/HGV allocs OR W-AE informational surcharges
                    const invoiceHasSurcharge = (row.carrier_surcharges || 0) > 0.005 || (row.carrier_csv_surcharges || 0) > 0.005;
                    // Show Our Cost breakdown if: stored surcharges present, OR per-kg extra applies
                    const ourHasSurcharge = (bc?.total_cost_price != null && bc?.base_cost_price != null
                      && Math.abs(bc.total_cost_price - bc.base_cost_price) > 0.005)
                      || (row.per_kg_extra > 0.005);

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
                            {row.is_return && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                background: 'rgba(156,39,176,0.12)',
                                border: '1px solid rgba(156,39,176,0.3)',
                                color: '#CE93D8', borderRadius: 20, padding: '1px 6px',
                              }}>
                                return
                              </span>
                            )}
                            {!row.is_return && byRef[row.reference] > 1 && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                background: 'rgba(0,188,212,0.12)',
                                border: '1px solid rgba(0,188,212,0.3)',
                                color: '#00BCD4', borderRadius: 20, padding: '1px 6px',
                              }}>
                                dup
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={td}>
                          {/* Customer: prefer matched DB group, fall back to account number lookup */}
                          {(() => {
                            const custName = g?.customer_name || row.accountCustomer?.customer_name;
                            const custAcct = g?.customer_account;
                            return (
                              <>
                                <span style={{ fontSize: 12, color: custName ? '#CCC' : '#555' }}>
                                  {custName || '—'}
                                </span>
                                {!g && row.accountCustomer && (
                                  <div style={{ fontSize: 9, color: '#B39DDB', marginTop: 1 }}>
                                    via account {row.account_number}
                                  </div>
                                )}
                                {custAcct && (
                                  <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                                    {custAcct}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </td>
                        <td style={td}>
                          {row.invoice_service_name ? (() => {
                            // Resolution priority:
                            // 1. serviceCodeMap — auto-resolve if invoice name is a service code (e.g. DHLPCUK220 → DHL Ecommerce Parcel)
                            // 2. mappings — manual mapping saved by user (e.g. "HomeServe Sign Mand" → our service)
                            // 3. Unmapped — show "+ map" link
                            const autoResolved  = serviceCodeMap[row.invoice_service_name.trim()];
                            const manualMapped  = mappings[row.invoice_service_name];
                            const resolvedName  = autoResolved || manualMapped;
                            return (
                              <div>
                                <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
                                  {row.invoice_service_name}
                                </span>
                                {resolvedName ? (
                                  <div style={{ fontSize: 11, color: autoResolved ? '#81C784' : '#00BCD4', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <ArrowRight size={9} /> {resolvedName}
                                    {autoResolved && (
                                      <span style={{ fontSize: 9, color: '#555', marginLeft: 3 }}>auto</span>
                                    )}
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
                            );
                          })() : (
                            <span style={{ fontSize: 12, color: '#555' }}>—</span>
                          )}
                        </td>
                        {/* Weight — billed (DHL invoice) vs service max weight band */}
                        <td style={{ ...td, textAlign: 'right' }}>
                          {(() => {
                            const billed         = row.billed_weight_kg;
                            const bandMax        = bc?.band_max_weight_kg;
                            const hasWeightBands = bc?.has_weight_bands;
                            // Flag only when:
                            //   • the service uses weight bands (not flat-rate)
                            //   • we have a band ceiling from the customer's rate card
                            //   • DHL invoiced MORE than that ceiling
                            const over = hasWeightBands && bandMax != null && billed != null && billed > bandMax;
                            return (
                              <div>
                                {billed != null ? (
                                  <span style={{ fontWeight: 600, color: over ? '#F44336' : '#CCC' }}>
                                    {billed.toFixed(2)} kg
                                  </span>
                                ) : (
                                  <span style={{ color: '#555' }}>—</span>
                                )}
                                {over && (
                                  <div style={{ fontSize: 11, marginTop: 2, color: '#FFC107', fontWeight: 700 }}>
                                    {bandMax.toFixed(2)} kg service max
                                    <span style={{ marginLeft: 5, color: '#F44336' }}>
                                      ▲{(billed - bandMax).toFixed(2)} over
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td style={{ ...td, textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#B39DDB' }}>
                            {gbp(row.carrier_total)}
                          </span>
                          {invoiceHasSurcharge && (
                            <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>
                              {gbp(row.carrier_cost)} freight
                              {(row.carrier_csv_surcharges || 0) > 0.005 && (
                                <span style={{ color: '#555' }}> (incl. {gbp(row.carrier_csv_surcharges)} surcharges)</span>
                              )}
                              {row.carrier_fuel_alloc > 0.005 && ` + ${gbp(row.carrier_fuel_alloc)} fuel`}
                              {row.carrier_hgv_alloc  > 0.005 && ` + ${gbp(row.carrier_hgv_alloc)} HGV`}
                            </div>
                          )}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          {row.is_return && !bc ? (
                            // Return with no DB charge — show carrier rate with base+fuel+HGV breakdown
                            row.carrier_rate_cost != null ? (
                              <>
                                <span style={{ color: '#CCC' }}>{gbp(row.carrier_rate_cost)}</span>
                                <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                                  {gbp(row.carrier_rate_base)} base
                                  {row.carrier_rate_fuel > 0.005 && ` + ${gbp(row.carrier_rate_fuel)} fuel`}
                                  {` + ${gbp(row.carrier_rate_hgv)} HGV`}
                                </div>
                              </>
                            ) : (
                              <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic' }}>no rate found</span>
                            )
                          ) : (
                            // Normal outbound OR return that matched a DB charge
                            <>
                              <span style={{ color: (row.effective_cost ?? bc?.total_cost_price) != null ? '#CCC' : '#555' }}>
                                {row.effective_cost != null
                                  ? gbp(row.effective_cost)
                                  : bc?.total_cost_price != null ? gbp(bc.total_cost_price) : '—'}
                              </span>
                              {ourHasSurcharge && (
                                <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                                  base {gbp(bc.base_cost_price)}
                                  {row.per_kg_extra > 0.005 && (
                                    <span style={{ color: '#81C784' }}>{` + ${gbp(row.per_kg_extra)} per-kg`}</span>
                                  )}
                                  {row.effective_fuel != null
                                    ? ` + ${gbp(row.effective_fuel)} fuel`
                                    : (bc.total_cost_price != null && bc.base_cost_price != null
                                        && Math.abs(bc.total_cost_price - bc.base_cost_price) > 0.005
                                        && ` + ${gbp(bc.total_cost_price - bc.base_cost_price)}`)
                                  }
                                  {` + ${gbp(bc.hgv_cost_price || 0)} HGV`}
                                </div>
                              )}
                            </>
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

                  {/* ── Surcharge rows — shown when filter is 'all' ── */}
                  {filter === 'all' && surcharges.length > 0 && (() => {
                    return (
                      <>
                        {/* Section divider */}
                        <tr>
                          <td colSpan={9} style={{
                            padding: '8px 12px 6px',
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.07em', color: '#555',
                            background: 'rgba(255,255,255,0.02)',
                            borderTop: '2px solid rgba(255,255,255,0.08)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}>
                            Invoice Surcharges — reconciled at invoice level
                          </td>
                        </tr>

                        {surcharges.map((sc, i) => {
                          const descUpper = sc.description.toUpperCase();
                          const isFuel = descUpper.includes('FUEL');
                          const isHgv  = descUpper.includes('HGV');

                          // Determine our comparison value and how we calculated it
                          let ourValue = null;
                          let ourNote  = null;
                          if (isFuel) {
                            ourValue = ourFuelCostTotal;
                            ourNote  = 'stored fuel charges';
                          } else if (isHgv) {
                            ourValue = ourHgvCalcTotal;
                            ourNote  = `${totalMatchedPieces} parcel${totalMatchedPieces !== 1 ? 's' : ''} × £${HGV_RATE_PER_PARCEL.toFixed(2)}`;
                          }

                          const scKey = `${sc.description}-${i}`;
                          const isAccepted = acceptedSurcharges.has(scKey);

                          const diff = ourValue != null ? sc.value - ourValue : null;
                          const diffColor = diff == null ? '#555'
                            : Math.abs(diff) <= TOLERANCE_ABS ? '#888'
                            : diff > 0 ? '#F44336'
                            : '#00C853';
                          const surchargeStatus = isAccepted
                            ? { code: 'amber', label: 'Accepted',     color: '#FFC107', icon: 'warn' }
                            : ourValue == null
                              ? { code: 'amber', label: 'No Comparison', color: '#FFC107', icon: 'warn' }
                              : Math.abs(diff) <= TOLERANCE_ABS
                                ? { code: 'green', label: 'Match',       color: '#00C853', icon: 'check' }
                                : { code: 'red',   label: 'Discrepancy', color: '#F44336', icon: 'x'     };

                          return (
                            <tr key={`sc-${i}`} style={{ background: isAccepted ? 'rgba(255,193,7,0.03)' : 'rgba(255,193,7,0.02)' }}>
                              {/* Checkbox placeholder */}
                              <td style={{ ...td, textAlign: 'center', width: 36 }}>
                                <input type="checkbox" disabled style={{ opacity: 0.2 }} />
                              </td>

                              {/* Reference — surcharge type badge */}
                              <td style={td}>
                                <span style={{
                                  fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                                  textTransform: 'uppercase',
                                  background: isFuel ? 'rgba(255,152,0,0.12)' : isHgv ? 'rgba(156,39,176,0.12)' : 'rgba(255,193,7,0.12)',
                                  border: `1px solid ${isFuel ? 'rgba(255,152,0,0.3)' : isHgv ? 'rgba(156,39,176,0.3)' : 'rgba(255,193,7,0.3)'}`,
                                  color: isFuel ? '#FF9800' : isHgv ? '#CE93D8' : '#FFC107',
                                  borderRadius: 20, padding: '2px 8px',
                                }}>
                                  {isFuel ? 'FUEL' : isHgv ? 'HGV' : 'SURCHARGE'}
                                </span>
                              </td>

                              {/* Customer — n/a */}
                              <td style={{ ...td, color: '#444' }}>—</td>

                              {/* Service — surcharge description */}
                              <td style={td}>
                                <span style={{ fontSize: 12, color: '#888' }}>{sc.description}</span>
                              </td>

                              {/* Weight — n/a for invoice-level surcharges */}
                              <td style={{ ...td, textAlign: 'right', color: '#444' }}>—</td>

                              {/* Invoice Cost */}
                              <td style={{ ...td, textAlign: 'right' }}>
                                <span style={{ fontWeight: 700, color: '#B39DDB' }}>
                                  {gbp(sc.value)}
                                </span>
                              </td>

                              {/* Our Cost */}
                              <td style={{ ...td, textAlign: 'right' }}>
                                {ourValue != null ? (
                                  <>
                                    <span style={{ color: isAccepted ? '#FFC107' : '#CCC' }}>{gbp(ourValue)}</span>
                                    {ourNote && (
                                      <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                                        {ourNote}
                                      </div>
                                    )}
                                    {isAccepted && isFuel && (
                                      <div style={{ fontSize: 9, color: '#FFC107', marginTop: 2, fontStyle: 'italic' }}>
                                        known variance
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic' }}>
                                    no comparison
                                  </span>
                                )}
                              </td>

                              {/* Difference */}
                              <td style={{ ...td, textAlign: 'right' }}>
                                {diff != null ? (
                                  <span style={{
                                    color: diffColor,
                                    fontWeight: Math.abs(diff) > TOLERANCE_ABS ? 700 : 400,
                                  }}>
                                    {diff > 0 ? '+' : ''}{gbp(diff)}
                                  </span>
                                ) : (
                                  <span style={{ color: '#444' }}>—</span>
                                )}
                              </td>

                              {/* Status + Accept */}
                              <td style={{ ...td, textAlign: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <StatusBadge status={surchargeStatus} />
                                  {surchargeStatus.code === 'red' && !isAccepted && (
                                    <button
                                      onClick={() => setAcceptedSurcharges(prev => new Set([...prev, scKey]))}
                                      title="Accept this as a known variance (e.g. fuel discrepancy due to underdeclared weights)"
                                      style={{
                                        fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        background: 'rgba(255,193,7,0.1)',
                                        border: '1px solid rgba(255,193,7,0.35)',
                                        color: '#FFC107',
                                        borderRadius: 20, padding: '2px 7px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Accept
                                    </button>
                                  )}
                                  {isAccepted && (
                                    <button
                                      onClick={() => setAcceptedSurcharges(prev => { const s = new Set(prev); s.delete(scKey); return s; })}
                                      title="Undo — revert to Discrepancy"
                                      style={{
                                        fontSize: 9, fontWeight: 600, letterSpacing: '0.04em',
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#555',
                                        borderRadius: 20, padding: '2px 7px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Undo
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })()}
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
