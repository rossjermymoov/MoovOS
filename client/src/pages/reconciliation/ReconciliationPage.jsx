/**
 * ReconciliationPage  —  /reconciliation
 *
 * Lists all reconciliation runs. Lets staff upload a new carrier invoice CSV
 * and kick off an automated reconciliation run.
 *
 * CSV Column Profiles: saved per-carrier column mappings so users don't have
 * to re-map columns on every run. Profiles are managed from the main page
 * or within the upload wizard.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, RefreshCw, CheckCircle2, AlertTriangle, Clock,
  ChevronRight, TrendingUp, X, Plus, FileText, Trash2,
  BookOpen, Save, Star, Pencil, Check,
} from 'lucide-react';
import axios from 'axios';
import { getCourierLogo } from '../../utils/courierLogos';

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
const btnRed = {
  background: 'rgba(213,0,0,0.08)', border: '1px solid rgba(213,0,0,0.25)',
  borderRadius: 7, color: '#FF5252', padding: '5px 10px', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
};
const inputSt = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, color: '#E6EDF3', fontSize: 13,
  padding: '8px 12px', outline: 'none',
};

// ─── Couriers with a fully configured reconciliation process ─────────────────
// Add a courier's normalised name here once its rate card, zone logic, service
// code mappings and surcharge rules have been set up and verified.
// Everything else is greyed out and non-interactive in the upload wizard.
const RECONCILIATION_READY = new Set(['dhl']);

function isReconciliationReady(courier) {
  const name = (courier.name || '').toLowerCase().trim();
  const code = (courier.code || '').toLowerCase().trim();
  return RECONCILIATION_READY.has(name) || RECONCILIATION_READY.has(code);
}

// ─── Carrier tile ─────────────────────────────────────────────────────────────
function CarrierTile({ courier, selected, onSelect }) {
  const logoUrl  = getCourierLogo(courier.code) || getCourierLogo(courier.name);
  const ready    = isReconciliationReady(courier);

  // Fallback initials badge when no logo is found
  const initials = (courier.name || '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <button
      onClick={() => ready && onSelect(courier.id)}
      title={ready ? courier.name : `${courier.name} — reconciliation not yet configured`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '12px 8px', borderRadius: 10,
        cursor: ready ? 'pointer' : 'not-allowed',
        background: selected ? 'rgba(0,200,83,0.08)' : 'rgba(255,255,255,0.03)',
        border: `2px solid ${selected ? '#00C853' : 'rgba(255,255,255,0.08)'}`,
        transition: 'border-color 0.15s, background 0.15s',
        minWidth: 0, position: 'relative',
        opacity: ready ? 1 : 0.35,
        filter: ready ? 'none' : 'grayscale(1)',
      }}
    >
      {/* Logo or fallback initials badge */}
      <div style={{
        width: 56, height: 40, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
        background: logoUrl ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? '0 0 0 2px #00C853' : 'none',
        transition: 'box-shadow 0.15s',
      }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={courier.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <span style={{
          display: logoUrl ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%',
          fontWeight: 800, fontSize: 13, color: '#AAAAAA', letterSpacing: 0.5,
        }}>
          {initials}
        </span>
      </div>
      {/* Name */}
      <span style={{
        fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.2,
        color: selected ? '#00C853' : '#CCCCCC',
        wordBreak: 'break-word', maxWidth: 72,
      }}>
        {courier.name}
      </span>
      {/* "Soon" badge on unsupported couriers */}
      {!ready && (
        <span style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
          background: 'rgba(255,255,255,0.08)', color: '#666',
          borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap',
        }}>
          SOON
        </span>
      )}
      {/* Selected tick */}
      {selected && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          width: 15, height: 15, borderRadius: '50%', background: '#00C853',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  );
}

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
/**
 * RFC 4180-compliant CSV parser.
 *
 * Handles:
 *  • Quoted fields — "Smith, Jones Ltd" is ONE field, not two
 *  • Escaped quotes — "" inside a quoted field becomes a literal "
 *  • CRLF, CR, and LF line endings
 *  • Fields that are not quoted (bare fields)
 *
 * The previous implementation used a naive `line.split(',')` which caused
 * column shifting whenever a field (e.g. a company name) contained a comma.
 * That made DHL tracking numbers land on the wrong column and appear as
 * account numbers or dates instead.
 */
function parseCSV(text) {
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }   // escaped quote ""
        else                     inQuotes = false;         // closing quote
      } else {
        field += ch;
      }
    } else {
      if      (ch === '"')  { inQuotes = true; }
      else if (ch === ',')  { row.push(field.trim()); field = ''; }
      else if (ch === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; }
      else                  { field += ch; }
    }
  }
  // flush last field / row
  row.push(field.trim());
  if (row.some(c => c)) rows.push(row);

  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  return rows.slice(1).filter(r => r.some(c => c)).map(rowArr => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = rowArr[i] ?? ''; });
    return obj;
  });
}

function mapToInvoiceLine(row, colMap) {
  const get = (field) => {
    const key = colMap[field];
    if (!key) return '';
    const val = row[key];
    return val !== undefined && val !== null ? String(val) : '';
  };

  // Extract surcharge column amounts.
  // surcharge_columns = [{ col: '<csv header>', surcharge_id: '<uuid>' }, ...]
  // The engine will sum these across multi-parcel groups and insert corrected lines.
  const surcharge_amounts = {};
  if (Array.isArray(colMap.surcharge_columns)) {
    for (const { col, surcharge_id } of colMap.surcharge_columns) {
      if (!col || !surcharge_id) continue;
      const val = row[col];
      const amt = parseFloat(String(val || '').replace(/[£,]/g, '')) || 0;
      if (amt > 0) surcharge_amounts[surcharge_id] = amt;
    }
  }

  return {
    // ── Tracking number: ALWAYS a string ─────────────────────────────────────
    // DHL consignment numbers (e.g. "600123456789") look like integers but MUST
    // be treated as opaque strings. The custom parseCSV() function is character-
    // level and never performs numeric coercion, so values are already strings.
    // The explicit String() call below is a hard guard against any future change
    // that might return a non-string (e.g. swapping in Papa.parse with
    // dynamicTyping enabled — that would silently lose leading zeros and cause
    // "600" prefix numbers to become wrong values via float64 precision loss).
    tracking_number:  String(get('tracking_number')).trim(),
    account_number:   get('account_number').trim(),
    service_code:     get('service_code').trim(),
    charge_type:      get('charge_type').trim() || 'base',
    carrier_amount:   parseFloat(get('carrier_amount').replace(/[£,]/g, '')) || 0,
    billed_weight_kg: parseFloat(get('billed_weight_kg')) || null,
    // DHL column J — piece/item count per line. Used to calculate the HGV
    // aggregate total (sum of parcel_count × HGV rate per parcel).
    parcel_count:     parseInt(get('parcel_count'), 10) || null,
    ...(Object.keys(surcharge_amounts).length > 0 && { surcharge_amounts }),
  };
}

const BLANK_MAP = {
  tracking_number: '', account_number: '', service_code: '',
  charge_type: '', carrier_amount: '', billed_weight_kg: '',
  parcel_count: '',
  invoice_ref: '', invoice_date: '',
  surcharge_columns: [],   // [{ col: '<csv header>', surcharge_id: '<uuid>' }]
};

// ─── Date normalisation ───────────────────────────────────────────────────────
function toISODate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(s)) return s.slice(0, 10).replace(/\//g, '-');
  const ukMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ukMatch) {
    const [, d, m, y] = ukMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
  return null;
}

// ─── Profile Manager Modal ────────────────────────────────────────────────────
function ProfileManagerModal({ couriers, onClose }) {
  const qc = useQueryClient();
  const [selectedCarrier, setSelectedCarrier] = useState(couriers[0]?.id || '');
  const [editingId,  setEditingId]  = useState(null);
  const [editName,   setEditName]   = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { data: profiles = [], refetch } = useQuery({
    queryKey: ['csv-profiles', selectedCarrier],
    queryFn:  () => selectedCarrier
      ? api.get(`/reconciliation/csv-profiles?carrier_id=${selectedCarrier}`).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!selectedCarrier,
  });

  async function handleRename(id) {
    if (!editName.trim()) return;
    await api.put(`/reconciliation/csv-profiles/${id}`, { profile_name: editName });
    setEditingId(null);
    refetch();
  }

  async function handleSetDefault(id) {
    await api.put(`/reconciliation/csv-profiles/${id}`, { is_default: true });
    refetch();
  }

  async function handleDelete(id) {
    await api.delete(`/reconciliation/csv-profiles/${id}`);
    setDeletingId(null);
    refetch();
    qc.invalidateQueries({ queryKey: ['csv-profiles'] });
  }

  const FIELD_LABELS = {
    tracking_number: 'Tracking Number', account_number: 'Account Number',
    service_code: 'Service Code', charge_type: 'Charge Type',
    carrier_amount: 'Amount (£)', billed_weight_kg: 'Weight (kg)',
    parcel_count: 'Piece Count', invoice_ref: 'Invoice Ref', invoice_date: 'Invoice Date',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0D0F2B', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, width: 660, maxHeight: '80vh', overflow: 'auto', padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>Column Profiles</h2>
            <p style={{ fontSize: 12, color: '#888', marginTop: 4, margin: 0 }}>Saved CSV column mappings per carrier</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Carrier selector */}
        <div style={{ marginBottom: 20 }}>
          <select style={inputSt} value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)}>
            <option value=''>— Select carrier —</option>
            {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Profile list */}
        {profiles.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', fontSize: 13, padding: '30px 0' }}>
            No saved profiles for this carrier yet. Upload a CSV and save the column mapping to create one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profiles.map(p => (
              <div key={p.id} style={{
                ...card,
                border: p.is_default ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.08)',
                padding: '14px 16px',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {editingId === p.id ? (
                    <input
                      style={{ ...inputSt, fontSize: 13, fontWeight: 700 }}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(p.id)}
                      autoFocus
                    />
                  ) : (
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#E6EDF3' }}>
                      {p.profile_name}
                      {p.is_default && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: '#00C853', background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 9999, padding: '1px 7px', fontWeight: 700 }}>
                          Default
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    {editingId === p.id ? (
                      <>
                        <button style={{ ...btnGreen, padding: '4px 10px', fontSize: 11 }} onClick={() => handleRename(p.id)}>
                          <Check size={12} />Save
                        </button>
                        <button style={{ ...btnGhost, padding: '4px 10px', fontSize: 11 }} onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {!p.is_default && (
                          <button
                            style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}
                            title='Set as default for this carrier'
                            onClick={() => handleSetDefault(p.id)}
                          >
                            <Star size={11} />Default
                          </button>
                        )}
                        <button
                          style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}
                          onClick={() => { setEditingId(p.id); setEditName(p.profile_name); }}
                        >
                          <Pencil size={11} />Rename
                        </button>
                        {deletingId === p.id ? (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button style={{ ...btnRed, padding: '4px 8px', fontSize: 11 }} onClick={() => handleDelete(p.id)}>
                              Confirm Delete
                            </button>
                            <button style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }} onClick={() => setDeletingId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            style={{ ...btnRed, padding: '4px 8px', fontSize: 11 }}
                            onClick={() => setDeletingId(p.id)}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Column mapping preview */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(p.column_map || {}).filter(([, v]) => v).map(([field, col]) => (
                    <span key={field} style={{
                      fontSize: 10, color: '#888', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '2px 7px',
                    }}>
                      <span style={{ color: '#555' }}>{FIELD_LABELS[field] || field}:</span>{' '}
                      <span style={{ color: '#AAA' }}>{col}</span>
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: '#444', marginTop: 8 }}>
                  Updated {new Date(p.updated_at).toLocaleDateString('en-GB')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────
function UploadModal({ couriers, onClose, onSuccess }) {
  const qc = useQueryClient();
  const [carrierId,           setCarrierId]           = useState('');
  const [invoiceRefOverride,  setInvoiceRefOverride]  = useState('');
  const [csvRows,             setCsvRows]             = useState([]);
  const [headers,             setHeaders]             = useState([]);
  const [colMap,              setColMap]              = useState({ ...BLANK_MAP });
  const [step,                setStep]                = useState(1);
  const [error,               setError]               = useState('');

  // Profile state
  const [loadedProfileId,  setLoadedProfileId]  = useState(null);  // profile that was loaded
  const [saveProfileName,  setSaveProfileName]  = useState('');    // name to save as
  const [saveAsDefault,    setSaveAsDefault]    = useState(false);
  const [showSaveSection,  setShowSaveSection]  = useState(false);
  const [profileSaving,    setProfileSaving]    = useState(false);

  const fileRef = useRef();

  // Load saved profiles when carrier changes
  const { data: profiles = [] } = useQuery({
    queryKey: ['csv-profiles', carrierId],
    queryFn:  () => carrierId
      ? api.get(`/reconciliation/csv-profiles?carrier_id=${carrierId}`).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!carrierId,
  });

  // Load surcharges for this carrier (used in surcharge column mapping UI)
  const { data: surchargesList = [] } = useQuery({
    queryKey: ['recon-surcharges', carrierId],
    queryFn:  () => api.get('/reconciliation/surcharges', { params: { carrier_id: carrierId } }).then(r => r.data),
    enabled:  !!carrierId,
  });

  // New-row state for the "add surcharge column" form
  const [newSurchargeCol, setNewSurchargeCol] = useState('');
  const [newSurchargeId,  setNewSurchargeId]  = useState('');

  // Auto-apply default profile when carrier is selected (and no file loaded yet)
  useEffect(() => {
    if (carrierId && profiles.length > 0 && csvRows.length === 0) {
      const defaultProfile = profiles.find(p => p.is_default);
      if (defaultProfile) {
        setColMap({ ...BLANK_MAP, ...defaultProfile.column_map });
        setLoadedProfileId(defaultProfile.id);
        setSaveProfileName(defaultProfile.profile_name);
      }
    }
  }, [profiles, carrierId]);

  const inferredRef  = colMap.invoice_ref  && csvRows[0] ? csvRows[0][colMap.invoice_ref]  || '' : '';
  const inferredDate = colMap.invoice_date && csvRows[0] ? csvRows[0][colMap.invoice_date] || '' : '';
  const effectiveRef  = invoiceRefOverride || inferredRef;
  const effectiveDate = inferredDate;

  function applyProfile(profile) {
    setColMap({ ...BLANK_MAP, ...profile.column_map });
    setLoadedProfileId(profile.id);
    setSaveProfileName(profile.profile_name);
  }

  function addSurchargeCol() {
    if (!newSurchargeCol || !newSurchargeId) return;
    // Prevent duplicate: same column mapped to the same surcharge
    const existing = colMap.surcharge_columns || [];
    if (existing.some(s => s.col === newSurchargeCol && s.surcharge_id === newSurchargeId)) return;
    setColMap(m => ({
      ...m,
      surcharge_columns: [...existing, { col: newSurchargeCol, surcharge_id: newSurchargeId }],
    }));
    setNewSurchargeCol('');
    setNewSurchargeId('');
  }

  function removeSurchargeCol(idx) {
    setColMap(m => ({
      ...m,
      surcharge_columns: (m.surcharge_columns || []).filter((_, i) => i !== idx),
    }));
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      if (!rows.length) { setError('CSV appears empty or invalid'); return; }
      const hdrs = Object.keys(rows[0]);
      setHeaders(hdrs);
      setCsvRows(rows);

      // Start with loaded profile's map (if any), then auto-map unset fields.
      // Always preserve the current in-memory surcharge_columns — they are never
      // auto-detectable from CSV headers and must survive file re-uploads.
      const autoMap = { ...BLANK_MAP, ...(loadedProfileId
        ? (profiles.find(p => p.id === loadedProfileId)?.column_map || {})
        : {}), surcharge_columns: colMap.surcharge_columns?.length
          ? colMap.surcharge_columns
          : ((profiles.find(p => p.id === loadedProfileId)?.column_map?.surcharge_columns) || []) };

      const AUTO_RULES = {
        tracking_number:  h => h.includes('tracking') || h.includes('consignment') || h.includes('waybill'),
        account_number:   h => h.includes('account') || h.includes('acct'),
        service_code:     h => h.includes('service') || h.includes('product'),
        charge_type:      h => h.includes('charge') && h.includes('type'),
        carrier_amount:   h => h.includes('amount') || h.includes('value') || h.includes('nett') || h.includes('price'),
        billed_weight_kg: h => h.includes('weight'),
        parcel_count:     h => h.includes('piece') || h.includes('parcel') || h.includes('qty') || h.includes('quantity') || h === 'j',
        invoice_ref:      h => h.includes('invoice') && (h.includes('ref') || h.includes('num') || h.includes('no')),
        invoice_date:     h => h.includes('invoice') && (h.includes('date') || h.includes('dt')),
      };
      for (const [field, test] of Object.entries(AUTO_RULES)) {
        // Only auto-map if the field isn't already set from a profile,
        // or if the profile's value doesn't exist in this CSV's headers
        const currentVal = autoMap[field];
        if (!currentVal || !hdrs.includes(currentVal)) {
          const found = hdrs.find(h => test(h.toLowerCase()));
          if (found) autoMap[field] = found;
          else if (!hdrs.includes(currentVal)) autoMap[field] = '';
        }
      }
      setColMap(autoMap);
      setStep(2);
    };
    reader.readAsText(file);
  }

  async function saveProfile() {
    if (!saveProfileName.trim() || !carrierId) return;
    setProfileSaving(true);
    try {
      if (loadedProfileId) {
        // Update existing profile
        await api.put(`/reconciliation/csv-profiles/${loadedProfileId}`, {
          profile_name: saveProfileName.trim(),
          column_map:   colMap,
          is_default:   saveAsDefault || undefined,
        });
      } else {
        // Create new profile
        const res = await api.post('/reconciliation/csv-profiles', {
          carrier_id:   parseInt(carrierId),
          profile_name: saveProfileName.trim(),
          column_map:   colMap,
          is_default:   saveAsDefault,
        });
        setLoadedProfileId(res.data.id);
      }
      qc.invalidateQueries({ queryKey: ['csv-profiles'] });
      setShowSaveSection(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
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
    { key: 'parcel_count',     label: 'Piece Count (col J)', required: false, hint: 'Used for HGV total' },
    { key: 'invoice_ref',      label: 'Invoice Reference', required: false, hint: 'Read from CSV' },
    { key: 'invoice_date',     label: 'Invoice Date',      required: false, hint: 'Read from CSV' },
  ];

  const canProceed = carrierId && FIELDS.filter(f => f.required).every(f => colMap[f.key]);
  const lines = step === 3 ? buildLines() : [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0D0F2B', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, width: 640, maxHeight: '88vh', overflow: 'auto', padding: 28,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>New Reconciliation Run</h2>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Step {step} of 3</div>
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

        {/* ── Step 1 — Carrier + file ───────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 10 }}>
                Select Carrier <span style={{ color: '#FF5252' }}>*</span>
              </label>
              {couriers.length === 0 ? (
                <p style={{ fontSize: 12, color: '#555' }}>No carriers configured — contact your administrator.</p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
                  gap: 10,
                }}>
                  {couriers.map(c => (
                    <CarrierTile
                      key={c.id}
                      courier={c}
                      selected={String(carrierId) === String(c.id)}
                      onSelect={id => { setCarrierId(String(id)); setLoadedProfileId(null); setColMap({ ...BLANK_MAP }); }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Saved profiles for this carrier */}
            {carrierId && profiles.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 8 }}>SAVED COLUMN PROFILES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => applyProfile(p)}
                      style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                        background: loadedProfileId === p.id ? 'rgba(0,200,83,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${loadedProfileId === p.id ? 'rgba(0,200,83,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: loadedProfileId === p.id ? '#00C853' : '#E6EDF3' }}>
                          {p.profile_name}
                          {p.is_default && (
                            <span style={{ marginLeft: 8, fontSize: 10, color: '#888' }}>Default</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                          {Object.entries(p.column_map || {}).filter(([k, v]) => k !== 'surcharge_columns' && v).length} columns mapped
                          {(p.column_map?.surcharge_columns?.length > 0) && (
                            <span style={{ marginLeft: 6, color: '#666' }}>· {p.column_map.surcharge_columns.length} surcharge col{p.column_map.surcharge_columns.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      {loadedProfileId === p.id && <Check size={14} color='#00C853' />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>
                Upload Carrier Invoice CSV <span style={{ color: '#FF5252' }}>*</span>
                {loadedProfileId && <span style={{ color: '#00C853', marginLeft: 8 }}>· Profile loaded — columns will be auto-applied</span>}
              </label>
              <input ref={fileRef} type='file' accept='.csv,.txt' style={{ display: 'none' }} onChange={handleFile} />
              <button
                style={{ ...btnGhost, width: '100%', justifyContent: 'center', padding: '20px 16px' }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} />
                {csvRows.length > 0 ? `✓ ${csvRows.length} rows loaded — click to replace` : 'Click to upload carrier invoice CSV'}
              </button>
              <p style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
                Invoice reference and date will be read from the CSV in the next step.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2 — Map columns ──────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
              We found <strong style={{ color: '#E6EDF3' }}>{csvRows.length} rows</strong> and <strong style={{ color: '#E6EDF3' }}>{headers.length} columns</strong>. Map the columns below.
              {loadedProfileId && <span style={{ color: '#00C853', marginLeft: 8 }}>Profile applied — check mappings are correct for this file.</span>}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, color: f.required ? '#E6EDF3' : '#888', fontWeight: f.required ? 600 : 400 }}>
                    {f.label}
                    {f.required && <span style={{ color: '#FF5252' }}> *</span>}
                    {f.hint && <span style={{ color: '#555', fontSize: 10, display: 'block' }}>{f.hint}</span>}
                  </label>
                  <select
                    style={inputSt}
                    value={colMap[f.key]}
                    onChange={e => setColMap(m => ({ ...m, [f.key]: e.target.value }))}
                  >
                    <option value=''>— Not in CSV —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Surcharge column mappings */}
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
                paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                SURCHARGE COLUMN MAPPINGS
                <span style={{ fontWeight: 400, fontSize: 10, color: '#555' }}>
                  — columns in this carrier&#x2019;s CSV that carry named surcharge amounts
                </span>
              </div>

              {/* Existing mapped surcharges */}
              {(colMap.surcharge_columns || []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                  {(colMap.surcharge_columns || []).map((sc, idx) => {
                    const sur = surchargesList.find(s => String(s.id) === String(sc.surcharge_id));
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 11, color: '#E6EDF3',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 5, padding: '4px 10px', minWidth: 120, textAlign: 'center',
                        }}>
                          {sc.col}
                        </span>
                        <span style={{ fontSize: 11, color: '#555' }}>→</span>
                        <span style={{ fontSize: 12, color: '#00C853', flex: 1, fontWeight: 500 }}>
                          {sur?.name || sc.surcharge_id}
                        </span>
                        <button onClick={() => removeSurchargeCol(idx)} style={{ ...btnRed, padding: '3px 8px', fontSize: 11 }}>
                          <X size={11} /> Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add new surcharge column row */}
              {surchargesList.length > 0 ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select
                    style={{ ...inputSt, flex: '0 0 180px' }}
                    value={newSurchargeCol}
                    onChange={e => setNewSurchargeCol(e.target.value)}
                  >
                    <option value=''>— CSV column —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>→</span>
                  <select
                    style={{ ...inputSt, flex: 1 }}
                    value={newSurchargeId}
                    onChange={e => setNewSurchargeId(e.target.value)}
                  >
                    <option value=''>— Surcharge type —</option>
                    {surchargesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button
                    onClick={addSurchargeCol}
                    disabled={!newSurchargeCol || !newSurchargeId}
                    style={{
                      ...btnGreen, padding: '8px 12px', flexShrink: 0,
                      opacity: (!newSurchargeCol || !newSurchargeId) ? 0.4 : 1,
                    }}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              ) : carrierId ? (
                <p style={{ fontSize: 11, color: '#555', margin: 0 }}>No surcharges configured for this carrier.</p>
              ) : (
                <p style={{ fontSize: 11, color: '#555', margin: 0 }}>Select a carrier first.</p>
              )}
            </div>

            {/* Invoice ref manual override */}
            {!colMap.invoice_ref && (
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '170px 1fr', gap: 10, alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#888' }}>
                  Invoice Ref (manual)
                  <span style={{ color: '#555', fontSize: 10, display: 'block' }}>If not in CSV</span>
                </label>
                <input
                  style={inputSt}
                  placeholder='e.g. INV-2024-001'
                  value={invoiceRefOverride}
                  onChange={e => setInvoiceRefOverride(e.target.value)}
                />
              </div>
            )}

            {/* Preview */}
            {csvRows[0] && colMap.tracking_number && (
              <div style={{ marginTop: 14, ...card, fontSize: 11, color: '#888' }}>
                <div style={{ color: '#00C853', fontWeight: 700, marginBottom: 8 }}>Preview — first row</div>
                <div>Tracking: <span style={{ color: '#E6EDF3' }}>{csvRows[0][colMap.tracking_number]}</span></div>
                {colMap.service_code   && <div>Service code: <span style={{ color: '#E6EDF3' }}>{csvRows[0][colMap.service_code]}</span></div>}
                {colMap.carrier_amount && <div>Amount: <span style={{ color: '#E6EDF3' }}>£{parseFloat(csvRows[0][colMap.carrier_amount] || 0).toFixed(2)}</span></div>}
                {inferredRef           && <div>Invoice ref: <span style={{ color: '#E6EDF3' }}>{inferredRef}</span></div>}
                {inferredDate          && <div>Invoice date: <span style={{ color: '#E6EDF3' }}>{inferredDate}</span></div>}
              </div>
            )}

            {/* Save profile section */}
            <div style={{
              marginTop: 20, padding: '14px 16px', borderRadius: 8,
              background: showSaveSection ? 'rgba(0,200,83,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${showSaveSection ? 'rgba(0,200,83,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={14} color={showSaveSection ? '#00C853' : '#666'} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: showSaveSection ? '#00C853' : '#AAA' }}>
                    {loadedProfileId ? 'Update saved profile' : 'Save as column profile'}
                  </span>
                  <span style={{ fontSize: 11, color: '#555' }}>
                    — reuse this mapping on future runs
                  </span>
                </div>
                <button
                  style={{ ...btnGhost, padding: '4px 10px', fontSize: 11 }}
                  onClick={() => setShowSaveSection(s => !s)}
                >
                  {showSaveSection ? 'Hide' : 'Show'}
                </button>
              </div>

              {showSaveSection && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                    <input
                      style={inputSt}
                      placeholder={loadedProfileId ? 'Profile name' : 'e.g. DHL Standard, DHL Weekly Express'}
                      value={saveProfileName}
                      onChange={e => setSaveProfileName(e.target.value)}
                    />
                    <button
                      style={{ ...btnGreen, opacity: (profileSaving || !saveProfileName.trim()) ? 0.5 : 1 }}
                      onClick={saveProfile}
                      disabled={profileSaving || !saveProfileName.trim()}
                    >
                      {profileSaving ? <RefreshCw size={13} /> : <Save size={13} />}
                      {loadedProfileId ? 'Update' : 'Save'}
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#888' }}>
                    <input
                      type='checkbox'
                      checked={saveAsDefault}
                      onChange={e => setSaveAsDefault(e.target.checked)}
                      style={{ accentColor: '#00C853' }}
                    />
                    Set as default profile for {couriers.find(c => String(c.id) === String(carrierId))?.name || 'this carrier'}
                    <span style={{ fontSize: 11, color: '#555' }}>(auto-applies on future uploads)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3 — Confirm ──────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div><span style={{ color: '#888' }}>Carrier:</span> <span style={{ color: '#E6EDF3' }}>{couriers.find(c => String(c.id) === String(carrierId))?.name}</span></div>
                <div><span style={{ color: '#888' }}>Invoice Ref:</span> <span style={{ color: '#E6EDF3' }}>{effectiveRef || <em style={{ color: '#555' }}>None</em>}</span></div>
                <div><span style={{ color: '#888' }}>Invoice Date:</span> <span style={{ color: '#E6EDF3' }}>{effectiveDate || '—'}</span></div>
                <div><span style={{ color: '#888' }}>Total lines:</span> <span style={{ color: '#00C853', fontWeight: 700 }}>{lines.length}</span></div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888' }}>
              The engine will process all {lines.length} lines automatically. Lines that can't be resolved will be flagged for your review.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          {step > 1 && (
            <button style={btnGhost} onClick={() => setStep(s => s - 1)}>Back</button>
          )}
          {step < 3 && (
            <button
              style={{ ...btnGreen, opacity: (step === 1 ? (carrierId && csvRows.length > 0) : canProceed) ? 1 : 0.4 }}
              disabled={step === 1 ? !(carrierId && csvRows.length > 0) : !canProceed}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </button>
          )}
          {step === 3 && (
            <StartRunButton
              carrierId={carrierId} invoiceRef={effectiveRef} invoiceDate={effectiveDate}
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
        invoice_date: toISODate(invoiceDate),
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
      {loading ? <RefreshCw size={14} /> : <Upload size={14} />}
      {loading ? 'Starting…' : 'Start Reconciliation'}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const navigate     = useNavigate();
  const qc           = useQueryClient();
  const [showUpload,  setShowUpload]  = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState(null);

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['recon-runs'],
    queryFn:  () => api.get('/reconciliation/runs').then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: couriers = [] } = useQuery({
    queryKey: ['recon-couriers'],
    queryFn:  () => api.get('/reconciliation/couriers').then(r => r.data),
  });

  const runs = runsData?.runs || [];

  const totalRuns     = runs.length;
  const avgAutomation = runs.length
    ? Math.round(runs.reduce((s, r) => s + (parseFloat(r.automation_rate) || 0), 0) / runs.length)
    : 0;
  const openItems   = runs.reduce((s, r) => s + (r.unmatched_count || 0), 0);
  const needsReview = runs.filter(r => r.status === 'needs_review').length;

  function handleRunSuccess(runId) {
    setShowUpload(false);
    qc.invalidateQueries({ queryKey: ['recon-runs'] });
    setTimeout(() => navigate(`/reconciliation/${runId}`), 800);
  }

  async function handleDeleteRun(e, runId) {
    e.stopPropagation();
    if (deletingRunId !== runId) { setDeletingRunId(runId); return; }
    try {
      await api.delete(`/reconciliation/runs/${runId}`);
      qc.invalidateQueries({ queryKey: ['recon-runs'] });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete run');
    } finally {
      setDeletingRunId(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E6EDF3', margin: 0 }}>Invoice Reconciliation</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Automated courier invoice matching engine</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnGhost} onClick={() => navigate('/reconciliation/margin-report')}>
            <TrendingUp size={15} />Margin Report
          </button>
          <button style={btnGhost} onClick={() => setShowProfiles(true)}>
            <BookOpen size={15} />Column Profiles
          </button>
          <button style={btnGreen} onClick={() => setShowUpload(true)}>
            <Plus size={16} />New Run
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Runs',     value: totalRuns,     color: '#79AAFF', icon: FileText },
          { label: 'Avg. Automation', value: `${avgAutomation}%`, color: '#00C853', icon: TrendingUp },
          { label: 'Open Unmatched', value: openItems,     color: openItems > 0 ? '#FFB300' : '#00C853', icon: AlertTriangle },
          { label: 'Needs Review',   value: needsReview,   color: needsReview > 0 ? '#FF5252' : '#00C853', icon: CheckCircle2 },
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
                  <td style={{ padding: '10px 10px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ChevronRight size={14} color='#555' />
                      {deletingRunId === run.id ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            style={{ ...btnRed, padding: '3px 8px', fontSize: 10, whiteSpace: 'nowrap' }}
                            onClick={e => handleDeleteRun(e, run.id)}
                          >
                            Confirm
                          </button>
                          <button
                            style={{ ...btnGhost, padding: '3px 6px', fontSize: 10 }}
                            onClick={e => { e.stopPropagation(); setDeletingRunId(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
                          title='Delete this run'
                          onClick={e => handleDeleteRun(e, run.id)}
                          onMouseEnter={e => e.currentTarget.style.color = '#FF5252'}
                          onMouseLeave={e => e.currentTarget.style.color = '#444'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showUpload && (
        <UploadModal
          couriers={couriers}
          onClose={() => setShowUpload(false)}
          onSuccess={handleRunSuccess}
        />
      )}

      {showProfiles && (
        <ProfileManagerModal
          couriers={couriers}
          onClose={() => setShowProfiles(false)}
        />
      )}
    </div>
  );
}
