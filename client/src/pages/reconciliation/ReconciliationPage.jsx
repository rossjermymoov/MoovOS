/**
 * ReconciliationPage  —  /reconciliation
 *
 * Lists all reconciliation runs. Lets staff upload a new carrier invoice CSV
 * and kick off an automated reconciliation run.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, RefreshCw, CheckCircle2, AlertTriangle, Clock,
  ChevronRight, TrendingUp, X, Plus, FileText,
} from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Styles ───────────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '18px 20px',
};
const btnGreen = {
  background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)',
  borderRadius: 7, color: '#00C853', padding: '9px 16px', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, color: '#AAA', padding: '9px 16px', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
};
const inputSt = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, color: '#E6EDF3', fontSize: 13,
  padding: '8px 12px', outline: 'none',
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    complete:     { color: '#00C853', bg: 'rgba(0,200,83,0.12)',  border: 'rgba(0,200,83,0.3)',  label: 'Complete' },
    needs_review: { color: '#FFB300', bg: 'rgba(255,160,0,0.12)', border: 'rgba(255,160,0,0.3)', label: 'Needs Review' },
    processing:   { color: '#79AAFF', bg: 'rgba(30,100,200,0.15)',border: 'rgba(30,100,200,0.4)', label: 'Processing' },
    failed:       { color: '#FF5252', bg: 'rgba(213,0,0,0.12)',   border: 'rgba(213,0,0,0.3)',   label: 'Failed' },
  }[status] || { color: '#AAA', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', label: status };

  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 9999,
      fontSize: 11, fontWeight: 700,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Automation rate bar ──────────────────────────────────────────────────────
function AutoBar({ rate }) {
  const pct = parseFloat(rate) || 0;
  const color = pct >= 80 ? '#00C853' : pct >= 50 ? '#FFB300' : '#FF5252';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
// Parse a carrier CSV into InvoiceLine objects.
// Column mapping: configurable per carrier via the UI.

function parseCSV(text) {
  const rows = text.trim().split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  return rows.slice(1).filter(r => r.some(c => c)).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  });
}

// Map raw CSV row to InvoiceLine using the column map the user configured
function mapToInvoiceLine(row, colMap) {
  const get = (field) => row[colMap[field]] || '';
  return {
    tracking_number:  get('tracking_number'),
    account_number:   get('account_number'),
    service_code:     get('service_code'),
    charge_type:      get('charge_type') || 'base',
    carrier_amount:   parseFloat(get('carrier_amount')) || 0,
    billed_weight_kg: parseFloat(get('billed_weight_kg')) || null,
  };
}

// ─── Upload modal ─────────────────────────────────────────────────────────────
function UploadModal({ couriers, onClose, onSuccess }) {
  const [carrierId,   setCarrierId]   = useState('');
  const [invoiceRef,  setInvoiceRef]  = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [csvRows,     setCsvRows]     = useState([]);
  const [headers,     setHeaders]     = useState([]);
  const [colMap,      setColMap]      = useState({
    tracking_number: '', account_number: '', service_code: '',
    charge_type: '', carrier_amount: '', billed_weight_kg: '',
  });
  const [step,  setStep]  = useState(1); // 1=setup 2=map columns 3=confirm
  const [error, setError] = useState('');
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      if (!rows.length) { setError('CSV appears empty or invalid'); return; }
      setHeaders(Object.keys(rows[0]));
      setCsvRows(rows);
      // Auto-map common column names
      const autoMap = { ...colMap };
      for (const field of Object.keys(colMap)) {
        const found = Object.keys(rows[0]).find(h =>
          h.includes(field.replace('_', '')) ||
          h.includes(field.split('_')[0]) ||
          (field === 'carrier_amount' && (h.includes('amount') || h.includes('charge') || h.includes('price'))) ||
          (field === 'tracking_number' && (h.includes('tracking') || h.includes('consignment') || h.includes('waybill'))) ||
          (field === 'service_code' && (h.includes('service') || h.includes('product'))) ||
          (field === 'account_number' && (h.includes('account') || h.includes('acct')))
        );
        if (found) autoMap[field] = found;
      }
      setColMap(autoMap);
      setStep(2);
    };
    reader.readAsText(file);
  }

  function buildLines() {
    return csvRows.map(row => mapToInvoiceLine(row, colMap)).filter(l => l.carrier_amount > 0);
  }

  const FIELDS = [
    { key: 'tracking_number',  label: 'Tracking Number',  required: true },
    { key: 'account_number',   label: 'Account Number',   required: false },
    { key: 'service_code',     label: 'Service Code',     required: true },
    { key: 'charge_type',      label: 'Charge Type',      required: false },
    { key: 'carrier_amount',   label: 'Amount (£)',        required: true },
    { key: 'billed_weight_kg', label: 'Weight (kg)',       required: false },
  ];

  const canProceed = carrierId && invoiceRef &&
    FIELDS.filter(f => f.required).every(f => colMap[f.key]);
  const lines = step === 3 ? buildLines() : [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0D0F2B', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, width: 600, maxHeight: '85vh', overflow: 'auto',
        padding: 28,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>
              New Reconciliation Run
            </h2>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Step {step} of 3
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)', borderRadius: 7, padding: '10px 14px', marginBottom: 16, color: '#FF5252', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Step 1 — Setup */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Carrier</label>
              <select style={inputSt} value={carrierId} onChange={e => setCarrierId(e.target.value)}>
                <option value=''>— Select carrier —</option>
                {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Invoice Reference</label>
                <input style={inputSt} placeholder='e.g. INV-2024-001' value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Invoice Date</label>
                <input style={inputSt} type='date' value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Upload CSV</label>
              <input ref={fileRef} type='file' accept='.csv,.txt' style={{ display: 'none' }} onChange={handleFile} />
              <button
                style={{ ...btnGhost, width: '100%', justifyContent: 'center', padding: '20px 16px' }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} />
                Click to upload carrier invoice CSV
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Map columns */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
              We found <strong style={{ color: '#E6EDF3' }}>{csvRows.length} rows</strong> and <strong style={{ color: '#E6EDF3' }}>{headers.length} columns</strong>. Map the columns below.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, color: f.required ? '#E6EDF3' : '#888', fontWeight: f.required ? 600 : 400 }}>
                    {f.label} {f.required && <span style={{ color: '#FF5252' }}>*</span>}
                  </label>
                  <select
                    style={inputSt}
                    value={colMap[f.key]}
                    onChange={e => setColMap(m => ({ ...m, [f.key]: e.target.value }))}
                  >
                    <option value=''>— Not mapped —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {/* Preview */}
            {csvRows[0] && colMap.tracking_number && (
              <div style={{ marginTop: 16, ...card, fontSize: 11, color: '#888' }}>
                <div style={{ color: '#00C853', fontWeight: 700, marginBottom: 8 }}>Preview — first row</div>
                <div>Tracking: <span style={{ color: '#E6EDF3' }}>{csvRows[0][colMap.tracking_number]}</span></div>
                <div>Service code: <span style={{ color: '#E6EDF3' }}>{csvRows[0][colMap.service_code]}</span></div>
                <div>Amount: <span style={{ color: '#E6EDF3' }}>£{parseFloat(csvRows[0][colMap.carrier_amount] || 0).toFixed(2)}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div><span style={{ color: '#888' }}>Carrier:</span> <span style={{ color: '#E6EDF3' }}>{couriers.find(c => String(c.id) === String(carrierId))?.name}</span></div>
                <div><span style={{ color: '#888' }}>Invoice Ref:</span> <span style={{ color: '#E6EDF3' }}>{invoiceRef}</span></div>
                <div><span style={{ color: '#888' }}>Invoice Date:</span> <span style={{ color: '#E6EDF3' }}>{invoiceDate || '—'}</span></div>
                <div><span style={{ color: '#888' }}>Total lines:</span> <span style={{ color: '#00C853', fontWeight: 700 }}>{lines.length}</span></div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888' }}>
              The engine will process all {lines.length} lines automatically. Lines that can't be resolved will be flagged for your review. This typically takes a few seconds.
            </p>
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          {step > 1 && (
            <button style={btnGhost} onClick={() => setStep(s => s - 1)}>Back</button>
          )}
          {step < 3 && (
            <button
              style={{ ...btnGreen, opacity: (step === 1 ? (carrierId && invoiceRef && csvRows.length > 0) : canProceed) ? 1 : 0.4 }}
              disabled={step === 1 ? !(carrierId && invoiceRef && csvRows.length > 0) : !canProceed}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </button>
          )}
          {step === 3 && (
            <StartRunButton
              carrierId={carrierId} invoiceRef={invoiceRef} invoiceDate={invoiceDate}
              lines={buildLines()} onSuccess={onSuccess} setError={setError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Start Run Button (mutation) ──────────────────────────────────────────────
function StartRunButton({ carrierId, invoiceRef, invoiceDate, lines, onSuccess, setError }) {
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await api.post('/reconciliation/runs', {
        carrier_id:   parseInt(carrierId),
        invoice_ref:  invoiceRef,
        invoice_date: invoiceDate || null,
        lines,
      });
      onSuccess(res.data.run_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start run');
      setLoading(false);
    }
  }

  return (
    <button style={{ ...btnGreen, opacity: loading ? 0.7 : 1 }} onClick={handleStart} disabled={loading}>
      {loading ? <RefreshCw size={14} className='animate-spin' /> : <Upload size={14} />}
      {loading ? 'Starting…' : 'Start Reconciliation'}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const navigate     = useNavigate();
  const qc           = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['recon-runs'],
    queryFn:  () => api.get('/reconciliation/runs').then(r => r.data),
    refetchInterval: 5000, // poll for processing updates
  });

  const { data: couriers = [] } = useQuery({
    queryKey: ['recon-couriers'],
    queryFn:  () => api.get('/reconciliation/couriers').then(r => r.data),
  });

  const runs = runsData?.runs || [];

  // Summary stats
  const totalRuns       = runs.length;
  const avgAutomation   = runs.length
    ? Math.round(runs.reduce((s, r) => s + (parseFloat(r.automation_rate) || 0), 0) / runs.length)
    : 0;
  const openItems       = runs.reduce((s, r) => s + (r.unmatched_count || 0), 0);
  const needsReview     = runs.filter(r => r.status === 'needs_review').length;

  function handleRunSuccess(runId) {
    setShowUpload(false);
    qc.invalidateQueries({ queryKey: ['recon-runs'] });
    setTimeout(() => navigate(`/reconciliation/${runId}`), 800);
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>
            Invoice Reconciliation
          </h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            Automated courier invoice matching engine
          </p>
        </div>
        <button style={btnGreen} onClick={() => setShowUpload(true)}>
          <Plus size={16} />New Run
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Runs', value: totalRuns, color: '#79AAFF', icon: FileText },
          { label: 'Avg. Automation', value: `${avgAutomation}%`, color: '#00C853', icon: TrendingUp },
          { label: 'Open Unmatched', value: openItems, color: openItems > 0 ? '#FFB300' : '#00C853', icon: AlertTriangle },
          { label: 'Needs Review', value: needsReview, color: needsReview > 0 ? '#FF5252' : '#00C853', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
              </div>
              <Icon size={18} color='#333' />
            </div>
          </div>
        ))}
      </div>

      {/* Runs table */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3', marginBottom: 16 }}>All Runs</div>

        {runsLoading ? (
          <div style={{ color: '#666', fontSize: 13, padding: '20px 0' }}>Loading…</div>
        ) : runs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', fontSize: 13, padding: '40px 0' }}>
            No reconciliation runs yet. Upload a carrier invoice CSV to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Carrier', 'Invoice Ref', 'Date', 'Lines', 'Matched', 'Corrected', 'Unmatched', 'Automation', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr
                  key={run.id}
                  onClick={() => navigate(`/reconciliation/${run.id}`)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 10px', color: '#E6EDF3', fontWeight: 600 }}>{run.carrier_name || '—'}</td>
                  <td style={{ padding: '10px 10px', color: '#AAA' }}>{run.invoice_ref || '—'}</td>
                  <td style={{ padding: '10px 10px', color: '#888' }}>{run.invoice_date ? new Date(run.invoice_date).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ padding: '10px 10px', color: '#E6EDF3' }}>{(run.total_lines || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 10px', color: '#00C853' }}>{run.matched_count || 0}</td>
                  <td style={{ padding: '10px 10px', color: '#79AAFF' }}>{run.corrected_count || 0}</td>
                  <td style={{ padding: '10px 10px', color: (run.unmatched_count || 0) > 0 ? '#FFB300' : '#555' }}>
                    {run.unmatched_count || 0}
                  </td>
                  <td style={{ padding: '10px 10px', minWidth: 100 }}>
                    {run.automation_rate != null ? <AutoBar rate={run.automation_rate} /> : <span style={{ color: '#555' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 10px' }}><StatusBadge status={run.status} /></td>
                  <td style={{ padding: '10px 10px', color: '#555' }}><ChevronRight size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          couriers={couriers}
          onClose={() => setShowUpload(false)}
          onSuccess={handleRunSuccess}
        />
      )}
    </div>
  );
}
