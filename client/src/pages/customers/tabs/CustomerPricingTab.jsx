/**
 * CustomerPricingTab
 * Courier links, fuel groups, surcharge overrides, service selector, rate card view
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Globe, Search, X, ChevronDown, ChevronRight, Package, Check, Zap, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getCourierLogo } from '../../../utils/courierLogos';

const api = axios.create({ baseURL: '/api' });

const gbp = (n) => `£${parseFloat(n || 0).toFixed(2)}`;

const inp = {
  background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 9999, padding: '4px 12px', color: '#fff', fontSize: 12,
  outline: 'none', boxSizing: 'border-box',
};

// ─── Inline editable price cell (first parcel — green) ────────
function PriceCell({ rateId, initialPrice, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(parseFloat(initialPrice).toFixed(2)));
  const [confirm, setConfirm] = useState(false);
  const inputRef = useRef(null);

  function startEdit() { setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }

  function commit() {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) { setVal(String(parseFloat(initialPrice).toFixed(2))); setEditing(false); return; }
    onSaved(rateId, parsed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(String(parseFloat(initialPrice).toFixed(2))); setEditing(false); } }}
        style={{ ...inp, width: 80, textAlign: 'right', color: '#00C853', fontWeight: 700, fontFamily: 'monospace', border: '1px solid rgba(0,200,83,0.6)', background: 'rgba(0,200,83,0.08)' }}
      />
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        onClick={startEdit}
        title="Click to edit"
        style={{
          fontSize: 13, fontWeight: 700, color: '#00C853',
          cursor: 'pointer', padding: '3px 10px', borderRadius: 5,
          border: '1px solid rgba(0,200,83,0.35)',
          background: 'rgba(0,200,83,0.08)',
          fontFamily: 'monospace', display: 'inline-block',
          transition: 'border-color 0.12s, background 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,83,0.7)'; e.currentTarget.style.background = 'rgba(0,200,83,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,200,83,0.35)'; e.currentTarget.style.background = 'rgba(0,200,83,0.08)'; }}
      >
        {gbp(initialPrice)}
      </span>
      {confirm
        ? <>
            <button onClick={() => onDelete(rateId)} style={{ background: '#E91E8C', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>Delete</button>
            <button onClick={() => setConfirm(false)} style={{ background: 'none', border: 'none', color: '#AAAAAA', fontSize: 10, cursor: 'pointer' }}>✕</button>
          </>
        : <button onClick={() => setConfirm(true)} style={{ background: 'none', border: 'none', color: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <Trash2 size={11} color="#333" />
          </button>
      }
    </span>
  );
}

// ─── Inline editable sub-price cell (2nd+ parcels — amber) ────
function SubPriceCell({ rateId, initialSubPrice, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(initialSubPrice != null ? String(parseFloat(initialSubPrice).toFixed(2)) : '');
  const inputRef = useRef(null);

  const hasValue = initialSubPrice != null;

  function startEdit() { setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }

  function commit() {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === '-') {
      // Clear sub price
      onSaved(rateId, null, true);
      setEditing(false);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || parsed < 0) {
      setVal(hasValue ? String(parseFloat(initialSubPrice).toFixed(2)) : '');
      setEditing(false);
      return;
    }
    onSaved(rateId, parsed, true);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        placeholder="sub £"
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setVal(hasValue ? String(parseFloat(initialSubPrice).toFixed(2)) : ''); setEditing(false); }
        }}
        style={{ ...inp, width: 72, textAlign: 'right', color: '#FFC107', fontWeight: 700, fontFamily: 'monospace', border: '1px solid rgba(255,193,7,0.6)', background: 'rgba(255,193,7,0.08)' }}
      />
    );
  }

  if (hasValue) {
    return (
      <span
        onClick={startEdit}
        title="Sub-parcel rate — click to edit, clear to remove"
        style={{
          fontSize: 12, fontWeight: 700, color: '#FFC107',
          cursor: 'pointer', padding: '2px 8px', borderRadius: 5,
          border: '1px solid rgba(255,193,7,0.35)',
          background: 'rgba(255,193,7,0.08)',
          fontFamily: 'monospace', display: 'inline-block',
          transition: 'border-color 0.12s, background 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,193,7,0.7)'; e.currentTarget.style.background = 'rgba(255,193,7,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,193,7,0.35)'; e.currentTarget.style.background = 'rgba(255,193,7,0.08)'; }}
      >
        {gbp(initialSubPrice)}
      </span>
    );
  }

  // No sub price set — show a faint add button
  return (
    <span
      onClick={startEdit}
      title="Add sub-parcel rate (2nd+ boxes)"
      style={{
        fontSize: 11, color: '#444', cursor: 'pointer',
        padding: '2px 7px', borderRadius: 5,
        border: '1px dashed rgba(255,193,7,0.2)',
        fontFamily: 'monospace',
        transition: 'color 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#FFC107'; e.currentTarget.style.borderColor = 'rgba(255,193,7,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = 'rgba(255,193,7,0.2)'; }}
    >
      + sub
    </span>
  );
}

// ─── NL search parser ─────────────────────────────────────────
function parseNLQuery(query) {
  const q = query.toLowerCase();
  let weightKg = null;
  const weightMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms|kilo|kilos)\b/);
  if (weightMatch) {
    weightKg = parseFloat(weightMatch[1]);
  } else {
    const gramsMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/);
    if (gramsMatch) weightKg = parseFloat(gramsMatch[1]) / 1000;
  }
  let zoneTerm = q
    .replace(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms|kilo|kilos|g|gram|grams)\b/g, '')
    .replace(/\b(tell|me|the|price|for|to|from|a|an|find|get|what|is|how|much|does|it|cost|package|parcel|shipment|shipping|send|sending|weight)\b/g, '')
    .replace(/\s+/g, ' ').trim();
  if (!zoneTerm) zoneTerm = null;
  return { weightKg, zoneTerm };
}

function weightClassCoversKg(weightClassName, weightKg) {
  if (weightKg == null) return false;
  const s = weightClassName.toUpperCase().replace(/\s/g, '');
  const rangeMatch = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)KG?$/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]), hi = parseFloat(rangeMatch[2]);
    return weightKg > lo && weightKg <= hi;
  }
  const plusMatch = s.match(/^(\d+(?:\.\d+)?)\+KG?$/) || s.match(/^OVER(\d+(?:\.\d+)?)KG?$/);
  if (plusMatch) return weightKg > parseFloat(plusMatch[1]);
  const underMatch = s.match(/^(?:UNDER|<)(\d+(?:\.\d+)?)KG?$/);
  if (underMatch) return weightKg < parseFloat(underMatch[1]);
  return false;
}

// ─── International rate overlay ───────────────────────────────
function InternationalRateOverlay({ service, onClose, onRateUpdate, onRateDelete }) {
  const [searchText, setSearchText] = useState('');
  const [parsed, setParsed]         = useState({ weightKg: null, zoneTerm: null });
  const searchRef                   = useRef(null);

  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 50); }, []);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchText.trim()) setParsed(parseNLQuery(searchText));
      else setParsed({ weightKg: null, zoneTerm: null });
    }, 200);
    return () => clearTimeout(t);
  }, [searchText]);

  const rates = service.rates;

  function isMatch(rate) {
    if (!searchText.trim()) return false;
    const { weightKg, zoneTerm } = parsed;
    const zoneOk   = zoneTerm ? rate.zone_name.toLowerCase().includes(zoneTerm) : true;
    const weightOk = weightKg != null ? weightClassCoversKg(rate.weight_class_name, weightKg) : true;
    if (zoneTerm && weightKg != null) return zoneOk && weightOk;
    if (zoneTerm) return zoneOk;
    if (weightKg != null) return weightOk;
    return false;
  }

  const hasSearch   = searchText.trim().length > 0;
  const matchedRates = hasSearch ? rates.filter(isMatch) : rates;
  const matchCount   = hasSearch ? matchedRates.length : 0;

  // Rows to display: filtered when searching, all when not
  const displayRates = matchedRates;

  // Build matrix from displayRates
  const weightClasses = [...new Set(displayRates.map(r => r.weight_class_name))].sort();
  const zones         = [...new Set(displayRates.map(r => r.zone_name))].sort();
  const rateMap = {};
  for (const r of displayRates) {
    if (!rateMap[r.zone_name]) rateMap[r.zone_name] = {};
    rateMap[r.zone_name][r.weight_class_name] = r;
  }
  const multiWeight = [...new Set(rates.map(r => r.weight_class_name))].length > 1;
  const totalZones  = [...new Set(rates.map(r => r.zone_name))].length;

  // Single exact match: show big price card
  const exactMatch = hasSearch && matchCount === 1 ? matchedRates[0] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,9,26,0.97)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '20px 28px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16, background: '#0A0B1E' }}>
        <Globe size={20} color="#00BCD4" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{service.service_name}</div>
          <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 2 }}>
            <span style={{ color: '#00BCD4', fontFamily: 'monospace', fontWeight: 700, marginRight: 10 }}>{service.service_code}</span>
            {rates.length.toLocaleString()} rates · {totalZones} zones
            {multiWeight && ` · ${[...new Set(rates.map(r => r.weight_class_name))].length} weight classes`}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 440px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#AAAAAA', pointerEvents: 'none' }} />
          <input
            ref={searchRef}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder='e.g. "Jamaica"  or  "1kg to France"'
            style={{ width: '100%', boxSizing: 'border-box', background: '#0D0E2A', border: '1px solid rgba(0,188,212,0.5)', borderRadius: 8, padding: '10px 36px 10px 36px', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#AAAAAA', fontSize: 12, padding: '7px 14px', cursor: 'pointer', flexShrink: 0 }}>
          Close  <span style={{ opacity: 0.5, fontSize: 11 }}>esc</span>
        </button>
      </div>

      {/* Search status bar */}
      {hasSearch && (
        <div style={{ flexShrink: 0, padding: '7px 28px', background: 'rgba(0,188,212,0.05)', borderBottom: '1px solid rgba(0,188,212,0.10)', display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
          <span style={{ color: matchCount === 0 ? '#E91E8C' : '#00BCD4', fontWeight: 700 }}>
            {matchCount === 0 ? 'No matches found' : matchCount === 1 ? '1 match' : `${matchCount} matches`}
          </span>
          {parsed.zoneTerm   && <span style={{ color: '#AAAAAA' }}>Zone: <span style={{ color: '#fff' }}>{parsed.zoneTerm}</span></span>}
          {parsed.weightKg != null && <span style={{ color: '#AAAAAA' }}>Weight: <span style={{ color: '#fff' }}>{parsed.weightKg} kg</span></span>}
          <button onClick={() => setSearchText('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12 }}>Clear ✕</button>
        </div>
      )}

      {/* ── Exact match: big price display ───────────────────── */}
      {exactMatch && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 28px', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#AAAAAA', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {service.service_name} · {exactMatch.zone_name}
            {multiWeight && <> · {exactMatch.weight_class_name}</>}
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, color: '#00C853', fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {gbp(exactMatch.price)}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <PriceCell rateId={exactMatch.id} initialPrice={exactMatch.price} onSaved={onRateUpdate} onDelete={onRateDelete} />
            <SubPriceCell rateId={exactMatch.id} initialSubPrice={exactMatch.price_sub} onSaved={onRateUpdate} />
          </div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>Click a price to edit · amber = 2nd+ parcels</div>
        </div>
      )}

      {/* ── Multiple matches or no search: table ─────────────── */}
      {!exactMatch && (
        <div style={{ flex: 1, overflow: 'auto', padding: '0 0 40px' }}>
          {rates.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555', fontSize: 14, fontStyle: 'italic' }}>No pricing found for this service</div>
          ) : hasSearch && matchCount === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, color: '#555', fontWeight: 600 }}>No rates match your search</div>
              <div style={{ fontSize: 13, color: '#444', marginTop: 8 }}>Try a different zone name or weight</div>
            </div>
          ) : multiWeight ? (
            /* Matrix: zones × weight classes */
            <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0A0B1E', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ textAlign: 'left', padding: '12px 20px 12px 28px', color: '#AAAAAA', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)', minWidth: 220 }}>Zone</th>
                  {weightClasses.map(wc => (
                    <th key={wc} style={{ textAlign: 'right', padding: '12px 20px', color: '#AAAAAA', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)', minWidth: 120 }}>{wc}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((zone, zi) => (
                  <tr key={zone} style={{ background: zi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '8px 20px 8px 28px', color: '#DDD', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{zone}</td>
                    {weightClasses.map(wc => {
                      const rate = rateMap[zone]?.[wc];
                      return (
                        <td key={wc} style={{ textAlign: 'right', padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          {rate
                            ? <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                <PriceCell rateId={rate.id} initialPrice={rate.price} onSaved={onRateUpdate} onDelete={onRateDelete} />
                                <SubPriceCell rateId={rate.id} initialSubPrice={rate.price_sub} onSaved={onRateUpdate} />
                              </div>
                            : <span style={{ color: '#333', fontSize: 12 }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Simple list */
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0A0B1E', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ textAlign: 'left', padding: '12px 20px 12px 28px', color: '#AAAAAA', fontWeight: 600, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Zone</th>
                  <th style={{ textAlign: 'right', padding: '12px 20px', color: '#00C853', fontWeight: 600, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>1st parcel</th>
                  <th style={{ textAlign: 'right', padding: '12px 28px 12px 20px', color: '#FFC107', fontWeight: 600, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>2nd+</th>
                </tr>
              </thead>
              <tbody>
                {displayRates.map((rate, ri) => (
                  <tr key={rate.id} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '8px 20px 8px 28px', color: '#DDD', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{rate.zone_name}</td>
                    <td style={{ textAlign: 'right', padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <PriceCell rateId={rate.id} initialPrice={rate.price} onSaved={onRateUpdate} onDelete={onRateDelete} />
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 28px 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <SubPriceCell rateId={rate.id} initialSubPrice={rate.price_sub} onSaved={onRateUpdate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inline add-rate form ─────────────────────────────────────
// Renders zone rows with empty price inputs. Used when a service has no
// pricing yet, and as an expandable "add zone" row on existing services.
function AddRateForm({ service, customerId, onSaved, onCancel }) {
  const emptyRow = () => ({ zone_name: '', weight_class_name: 'Parcel', price: '', price_sub: '' });
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const addRow    = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const validRows = rows.filter(r => r.zone_name.trim() && r.price !== '' && !isNaN(parseFloat(r.price)));

  async function save() {
    if (!validRows.length) return;
    setSaving(true); setError(null);
    try {
      await Promise.all(validRows.map(r =>
        api.post(`/customer-rates/${customerId}`, {
          courier_id:        service.courier_id || 0,
          courier_code:      service.courier_code || '',
          courier_name:      service.courier_name || '',
          service_id:        service.service_id,
          service_code:      service.service_code,
          service_name:      service.service_name,
          zone_name:         r.zone_name.trim(),
          weight_class_name: r.weight_class_name.trim() || 'Parcel',
          price:             parseFloat(r.price),
          price_sub:         r.price_sub !== '' && !isNaN(parseFloat(r.price_sub)) ? parseFloat(r.price_sub) : null,
        })
      ));
      setRows([emptyRow()]);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const fi = (extra = {}) => ({
    background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '5px 9px', color: '#fff',
    fontSize: 12, outline: 'none', boxSizing: 'border-box', ...extra,
  });

  return (
    <div style={{ padding: '8px 0 4px' }}>
      {/* Column headers */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
        <div style={{ width: 110, fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zone</div>
        <div style={{ width: 90,  fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weight class</div>
        <div style={{ width: 82,  fontSize: 10, color: '#00C853', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>1st parcel</div>
        <div style={{ width: 82,  fontSize: 10, color: '#FFC107', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>2nd+</div>
      </div>

      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
          <input
            placeholder="Zone A"
            value={row.zone_name}
            onChange={e => updateRow(i, 'zone_name', e.target.value)}
            style={fi({ width: 110 })}
          />
          <input
            placeholder="Parcel"
            value={row.weight_class_name}
            onChange={e => updateRow(i, 'weight_class_name', e.target.value)}
            style={fi({ width: 90 })}
          />
          <input
            placeholder="£"
            value={row.price}
            onChange={e => updateRow(i, 'price', e.target.value)}
            style={fi({ width: 82, textAlign: 'right', color: '#00C853', fontFamily: 'monospace', border: '1px solid rgba(0,200,83,0.3)' })}
          />
          <input
            placeholder="£ sub"
            value={row.price_sub}
            onChange={e => updateRow(i, 'price_sub', e.target.value)}
            style={fi({ width: 82, textAlign: 'right', color: '#FFC107', fontFamily: 'monospace', border: '1px solid rgba(255,193,7,0.2)' })}
          />
          {rows.length > 1 && (
            <button onClick={() => removeRow(i)}
              style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '2px 4px', flexShrink: 0, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = '#E91E8C'}
              onMouseLeave={e => e.currentTarget.style.color = '#444'}>
              <X size={12} />
            </button>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <button onClick={addRow}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#AAAAAA', fontSize: 11, padding: '3px 10px', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
          + Add row
        </button>
        <button onClick={save} disabled={saving || !validRows.length}
          style={{
            background: validRows.length ? 'rgba(0,200,83,0.12)' : 'transparent',
            border: `1px solid ${validRows.length ? '#00C853' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 5, color: validRows.length ? '#00C853' : '#444',
            fontSize: 11, fontWeight: 700, padding: '3px 14px',
            cursor: validRows.length ? 'pointer' : 'default',
          }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {onCancel && (
          <button onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#444', fontSize: 11, cursor: 'pointer', padding: '3px 8px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#AAAAAA'}
            onMouseLeave={e => e.currentTarget.style.color = '#444'}>
            Cancel
          </button>
        )}
        {error && <span style={{ fontSize: 11, color: '#E91E8C' }}>{error}</span>}
      </div>
    </div>
  );
}

// ─── Service block — horizontal zone layout ───────────────────
function ServiceBlock({ service, customerId, onRateUpdate, onRateDelete, onRateCreated }) {
  const [overlayOpen, setOverlay]   = useState(false);
  const [addingZone, setAddingZone] = useState(false);

  const isEmpty     = service.rates.length === 0;
  const isIntl      = service.service_type === 'international';
  const multiWeight = [...new Set(service.rates.map(r => r.weight_class_name))].length > 1;

  // ── International: collapsed row → fullscreen overlay ───────
  if (isIntl) {
    return (
      <>
        <div
          onClick={() => setOverlay(true)}
          style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: 'rgba(0,188,212,0.03)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,188,212,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,188,212,0.03)'}
        >
          <Globe size={12} color="#00BCD4" style={{ marginRight: 8, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{service.service_name}</span>
          <span style={{ fontSize: 11, color: '#AAAAAA', marginRight: 16 }}>{service.rate_count.toLocaleString()} rates</span>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#00BCD4', background: 'rgba(0,188,212,0.1)', padding: '2px 8px', borderRadius: 4, marginRight: 12 }}>{service.service_code}</span>
          <span style={{ fontSize: 11, color: '#00BCD4', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Search size={11} /> Search →</span>
        </div>
        {overlayOpen && (
          <InternationalRateOverlay
            service={service}
            onClose={() => setOverlay(false)}
            onRateUpdate={onRateUpdate}
            onRateDelete={onRateDelete}
          />
        )}
      </>
    );
  }

  // ── Domestic: zone chips ─────────────────────────────────────
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 18px 14px' }}>
      {/* Service name header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isEmpty ? 8 : 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
          {service.service_name}
        </span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#555', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)' }}>
          {service.service_code}
        </span>
        {/* "Add zone" toggle — only shown when service already has rates */}
        {!isEmpty && !addingZone && (
          <button onClick={() => setAddingZone(true)}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#555', fontSize: 10, fontWeight: 700, padding: '2px 8px', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,83,0.4)'; e.currentTarget.style.color = '#00C853'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#555'; }}>
            + zone
          </button>
        )}
      </div>

      {/* Existing zone chips */}
      {!isEmpty && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: addingZone ? 12 : 0 }}>
          {service.rates.map((rate) => (
            <div key={rate.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 8px 5px 10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 7,
            }}>
              <span style={{ fontSize: 11, color: '#666', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {rate.zone_name}
                {multiWeight && <span style={{ color: '#444', marginLeft: 5 }}>· {rate.weight_class_name}</span>}
              </span>
              <PriceCell rateId={rate.id} initialPrice={rate.price} onSaved={onRateUpdate} onDelete={onRateDelete} />
              <SubPriceCell rateId={rate.id} initialSubPrice={rate.price_sub} onSaved={onRateUpdate} />
            </div>
          ))}
        </div>
      )}

      {/* No pricing yet — always show form. Existing service — show form when + zone clicked */}
      {(isEmpty || addingZone) && (
        <>
          {isEmpty && (
            <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic', marginBottom: 10 }}>
              No pricing found — enter rates below
            </div>
          )}
          <AddRateForm
            service={service}
            customerId={customerId}
            onSaved={() => { setAddingZone(false); onRateCreated(); }}
            onCancel={isEmpty ? null : () => setAddingZone(false)}
          />
        </>
      )}
    </div>
  );
}

// ─── Courier group ────────────────────────────────────────────
function CourierGroup({ courierName, services, customerId, onRateUpdate, onRateDelete, onRateCreated }) {
  const [open, setOpen] = useState(true);
  const totalRates = services.reduce((a, s) => a + s.rate_count, 0);
  const hasIntl    = services.some(s => s.service_type === 'international');

  return (
    <div className="moov-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', padding: '13px 18px', cursor: 'pointer', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        {open ? <ChevronDown size={14} style={{ color: '#00C853', marginRight: 8 }} /> : <ChevronRight size={14} style={{ color: '#555', marginRight: 8 }} />}
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>{courierName}</span>
        {hasIntl && <span style={{ fontSize: 10, color: '#00BCD4', background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.25)', borderRadius: 5, padding: '2px 7px', fontWeight: 700, marginRight: 10 }}>INTL</span>}
        <span style={{ fontSize: 11, color: '#AAAAAA' }}>{services.length} service{services.length !== 1 ? 's' : ''} · {totalRates.toLocaleString()} rates</span>
      </div>
      {open && services.map(svc => (
        <ServiceBlock
          key={svc.service_id}
          service={svc}
          customerId={customerId}
          onRateUpdate={onRateUpdate}
          onRateDelete={onRateDelete}
          onRateCreated={onRateCreated}
        />
      ))}
    </div>
  );
}

// ─── Service selector (filtered to active carriers) ───────────
function ServiceSelector({ customerId, activeCourierIds }) {
  const queryClient = useQueryClient();

  const { data: allServices = [] } = useQuery({
    queryKey: ['all-carrier-services'],
    queryFn:  () => api.get('/carriers/services').then(r => r.data),
  });
  const { data: selected = [] } = useQuery({
    queryKey: ['customer-services', customerId],
    queryFn:  () => api.get(`/customers/${customerId}/services`).then(r => r.data),
  });

  const selectedIds = new Set(selected.map(s => s.courier_service_id));

  const addSvc = useMutation({
    mutationFn: (id) => api.post(`/customers/${customerId}/services`, { courier_service_id: id }),
    onSuccess:  () => queryClient.invalidateQueries(['customer-services', customerId]),
  });
  const delSvc = useMutation({
    mutationFn: (id) => api.delete(`/customers/${customerId}/services/${id}`),
    onSuccess:  () => queryClient.invalidateQueries(['customer-services', customerId]),
  });

  function toggle(serviceId) {
    if (selectedIds.has(serviceId)) delSvc.mutate(serviceId);
    else addSvc.mutate(serviceId);
  }

  // Filter services to active carriers only (if any are active)
  const filteredServices = activeCourierIds.size > 0
    ? allServices.filter(svc => activeCourierIds.has(svc.courier_id))
    : allServices;

  // Group by courier
  const byCourier = {};
  for (const svc of filteredServices) {
    const cn = svc.courier_name || 'Unknown';
    if (!byCourier[cn]) byCourier[cn] = { courier_id: svc.courier_id, services: [] };
    byCourier[cn].services.push(svc);
  }

  const [openCouriers, setOpenCouriers] = useState({});
  function toggleCourier(name) { setOpenCouriers(o => ({ ...o, [name]: !o[name] })); }

  const totalSelected = selectedIds.size;
  const couriers = Object.entries(byCourier);

  if (!couriers.length) return null;

  return (
    <div className="moov-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Package size={14} color="#7B2FBE" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#7B2FBE', margin: 0, flex: 1 }}>Service Selection</h3>
        {totalSelected > 0
          ? <span style={{ fontSize: 12, color: '#00C853', fontWeight: 700 }}>{totalSelected} active</span>
          : <span style={{ fontSize: 12, color: '#AAAAAA', fontStyle: 'italic' }}>None selected — all rates shown</span>
        }
      </div>

      {couriers.map(([courierName, { services }]) => {
        const isOpen       = openCouriers[courierName] === true;
        const countInGroup = services.filter(s => selectedIds.has(s.id)).length;
        return (
          <div key={courierName} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div
              onClick={() => toggleCourier(courierName)}
              style={{ display: 'flex', alignItems: 'center', padding: '9px 18px', cursor: 'pointer', background: 'rgba(255,255,255,0.01)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
            >
              {isOpen ? <ChevronDown size={12} color="#555" style={{ marginRight: 8 }} /> : <ChevronRight size={12} color="#555" style={{ marginRight: 8 }} />}
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{courierName}</span>
              {countInGroup > 0 && (
                <span style={{ fontSize: 11, color: '#00C853', fontWeight: 700, marginRight: 8 }}>{countInGroup}/{services.length}</span>
              )}
              <button onClick={e => { e.stopPropagation(); services.forEach(s => { if (!selectedIds.has(s.id)) addSvc.mutate(s.id); }); }}
                style={{ background: 'none', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 5, color: '#00C853', fontSize: 11, fontWeight: 700, padding: '2px 8px', cursor: 'pointer', marginRight: 6 }}>All</button>
              <button onClick={e => { e.stopPropagation(); services.forEach(s => { if (selectedIds.has(s.id)) delSvc.mutate(s.id); }); }}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#AAAAAA', fontSize: 11, fontWeight: 700, padding: '2px 8px', cursor: 'pointer' }}>None</button>
            </div>
            {isOpen && services.map(svc => {
              const active = selectedIds.has(svc.id);
              return (
                <div key={svc.id} onClick={() => toggle(svc.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '7px 18px 7px 40px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.03)', background: active ? 'rgba(0,200,83,0.04)' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = active ? 'rgba(0,200,83,0.07)' : 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = active ? 'rgba(0,200,83,0.04)' : 'transparent'}
                >
                  <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${active ? '#00C853' : 'rgba(255,255,255,0.2)'}`, background: active ? '#00C853' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0, transition: 'all 0.15s' }}>
                    {active && <Check size={9} color="#000" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 13, color: active ? '#fff' : '#AAAAAA', fontWeight: active ? 600 : 400, flex: 1 }}>{svc.name}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: active ? '#00C853' : '#444', background: active ? 'rgba(0,200,83,0.08)' : 'transparent', padding: '1px 6px', borderRadius: 3 }}>{svc.service_code}</span>
                  {svc.service_type === 'international' && (
                    <span style={{ fontSize: 10, color: '#00BCD4', fontWeight: 700, marginLeft: 8 }}>INTL</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Thin courier toggle strip ────────────────────────────────
function CourierToggleStrip({ carriers, customerId }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: ({ courier_id, active }) =>
      active
        ? api.delete(`/customer-carrier-links/${customerId}/${courier_id}`)
        : api.post(`/customer-carrier-links/${customerId}`, { courier_id }),
    onSuccess: () => qc.invalidateQueries(['customer-carrier-links', customerId]),
  });

  if (!carriers.length) return null;

  return (
    <div className="moov-card" style={{ marginBottom: 14, padding: '9px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Carriers</span>
        {carriers.map(carrier => {
          const logo = getCourierLogo(carrier.courier_code);
          const isActive = carrier.active;
          return (
            <button
              key={carrier.courier_id}
              onClick={() => toggle.mutate({ courier_id: carrier.courier_id, active: isActive })}
              title={`${carrier.courier_name} — click to ${isActive ? 'deactivate' : 'activate'}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 9999, cursor: 'pointer',
                border: `1.5px solid ${isActive ? 'rgba(0,200,83,0.5)' : 'rgba(255,255,255,0.07)'}`,
                background: isActive ? 'rgba(0,200,83,0.07)' : 'transparent',
                transition: 'all 0.15s', outline: 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              {logo
                ? <img src={logo} alt={carrier.courier_name} style={{ height: 15, objectFit: 'contain', opacity: isActive ? 1 : 0.3, transition: 'opacity 0.15s' }} />
                : <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#00C853' : '#555' }}>{carrier.courier_name}</span>
              }
              {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C853', flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Customer fuel group row ──────────────────────────────────
function CustomerFuelRow({ fg, customerId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState('');
  const inputRef              = useRef(null);

  const setFuel = useMutation({
    mutationFn: ({ fuelGroupId, sell_pct }) =>
      sell_pct === null
        ? api.delete(`/customer-carrier-links/${customerId}/fuel/${fuelGroupId}`)
        : api.put(`/customer-carrier-links/${customerId}/fuel/${fuelGroupId}`, { sell_pct }),
    onSuccess: () => qc.invalidateQueries(['customer-carrier-links', customerId]),
  });

  function startEdit() {
    setVal(fg.customer_pct != null ? String(fg.customer_pct) : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const trimmed = val.trim();
    if (trimmed === '') { setFuel.mutate({ fuelGroupId: fg.id, sell_pct: null }); setEditing(false); return; }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || parsed < 0) { setEditing(false); return; }
    setFuel.mutate({ fuelGroupId: fg.id, sell_pct: parsed });
    setEditing(false);
  }

  const hasOverride = fg.customer_pct != null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px 6px 26px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: 12, color: '#999', flex: 1 }}>{fg.name}</span>
      <span style={{ fontSize: 10, color: '#444', fontFamily: 'monospace' }}>cost {parseFloat(fg.cost_pct || 0).toFixed(2)}%</span>
      <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace' }}>
        std {fg.standard_sell_pct != null ? `${parseFloat(fg.standard_sell_pct).toFixed(2)}%` : '—'}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          placeholder="% (clear = reset to std)"
          style={{ ...inp, width: 110, textAlign: 'right', color: '#FFC107', fontFamily: 'monospace', border: '1px solid rgba(255,193,7,0.6)', background: 'rgba(255,193,7,0.08)', fontSize: 11 }}
        />
      ) : (
        <span
          onClick={startEdit}
          title={hasOverride ? 'Custom rate — click to edit, clear to revert to standard' : 'Click to set a customer-specific rate'}
          style={{
            fontSize: 12, fontWeight: hasOverride ? 700 : 400,
            color: hasOverride ? '#FFC107' : '#444',
            cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
            border: `1px solid ${hasOverride ? 'rgba(255,193,7,0.35)' : 'rgba(255,255,255,0.06)'}`,
            background: hasOverride ? 'rgba(255,193,7,0.08)' : 'transparent',
            fontFamily: 'monospace',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,193,7,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = hasOverride ? 'rgba(255,193,7,0.35)' : 'rgba(255,255,255,0.06)'}
        >
          {hasOverride ? `${parseFloat(fg.customer_pct).toFixed(2)}%` : '+ Override'}
        </span>
      )}
    </div>
  );
}

// ─── Per-surcharge override row ───────────────────────────────
function SurchargeOverrideRow({ surcharge, override, customerId, onChanged }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState('');
  const inputRef              = useRef(null);

  const upsert = useMutation({
    mutationFn: (override_value) =>
      api.post(`/surcharges/customer-overrides/${customerId}`, { surcharge_id: surcharge.id, override_value }),
    onSuccess: () => { qc.invalidateQueries(['surcharge-overrides', customerId]); onChanged?.(); },
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/surcharges/customer-overrides/${customerId}/${override.id}`),
    onSuccess: () => { qc.invalidateQueries(['surcharge-overrides', customerId]); onChanged?.(); },
  });

  function startEdit() {
    setVal(override ? String(override.override_value) : String(parseFloat(surcharge.default_value || 0).toFixed(2)));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) { setEditing(false); return; }
    upsert.mutate(parsed);
    setEditing(false);
  }

  const hasOverride = !!override;
  const isPct = surcharge.calc_type === 'percentage';
  const fmt = (v) => isPct ? `${parseFloat(v).toFixed(2)}%` : `£${parseFloat(v).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 5, background: hasOverride ? 'rgba(255,193,7,0.03)' : 'transparent' }}>
      <span style={{ fontSize: 12, color: hasOverride ? '#DDD' : '#888', flex: 1 }}>{surcharge.name}</span>
      <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>{fmt(surcharge.default_value || 0)}</span>
      <span style={{ fontSize: 10, color: '#333' }}>→</span>
      {editing ? (
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          style={{ ...inp, width: 72, textAlign: 'right', color: '#FFC107', fontFamily: 'monospace', border: '1px solid rgba(255,193,7,0.6)', background: 'rgba(255,193,7,0.08)', fontSize: 11 }}
        />
      ) : (
        <span
          onClick={startEdit}
          style={{
            fontSize: 12, fontWeight: hasOverride ? 700 : 400,
            color: hasOverride ? '#FFC107' : '#444',
            cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
            border: `1px solid ${hasOverride ? 'rgba(255,193,7,0.35)' : 'rgba(255,255,255,0.06)'}`,
            background: hasOverride ? 'rgba(255,193,7,0.08)' : 'transparent',
            fontFamily: 'monospace',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,193,7,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = hasOverride ? 'rgba(255,193,7,0.35)' : 'rgba(255,255,255,0.06)'}
        >
          {hasOverride ? fmt(override.override_value) : '+ Override'}
        </span>
      )}
      {hasOverride && !editing && (
        <button onClick={() => remove.mutate()} title="Remove override"
          style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => e.currentTarget.style.color = '#E91E8C'}
          onMouseLeave={e => e.currentTarget.style.color = '#333'}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Per-active-carrier section (fuel + surcharges) ───────────
function ActiveCarrierSection({ carrier, customerId, allOverrides, onOverridesChange }) {
  const [fuelOpen,  setFuelOpen]  = useState(false);
  const [surchOpen, setSurchOpen] = useState(true);  // open by default so surcharges are visible

  const logo    = getCourierLogo(carrier.courier_code);
  // Only show fuel section for active (linked) carriers
  const hasFuel = carrier.active && carrier.fuel_groups?.length > 0;

  const { data: surcharges = [] } = useQuery({
    queryKey: ['surcharges', carrier.courier_id],
    queryFn:  () => api.get(`/surcharges?courier_id=${carrier.courier_id}`).then(r => r.data),
    staleTime: 0,           // always re-fetch — surcharges change in carrier management
    refetchOnWindowFocus: true,
  });

  const hasSurcharges    = surcharges.length > 0;
  const carrierOverrides = allOverrides.filter(o => surcharges.some(s => s.id === o.surcharge_id));

  const qc = useQueryClient();
  const changeCard = useMutation({
    mutationFn: (cardId) => api.patch(`/customer-carrier-links/${customerId}/${carrier.courier_id}`, { carrier_rate_card_id: cardId }),
    onSuccess:  () => qc.invalidateQueries(['customer-carrier-links', customerId]),
  });

  // Don't render section at all if nothing to show
  if (!hasFuel && !hasSurcharges && (carrier.available_cards?.length ?? 0) <= 1) return null;

  return (
    <div className="moov-card" style={{ marginBottom: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(0,200,83,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {logo && <img src={logo} alt={carrier.courier_name} style={{ height: 15, objectFit: 'contain', flexShrink: 0 }} />}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{carrier.courier_name}</span>
        {carrier.available_cards?.length > 1 ? (
          <select
            value={String(carrier.active_card_id || '')}
            onChange={e => changeCard.mutate(e.target.value)}
            style={{ ...inp, fontSize: 11, width: 180 }}
          >
            {carrier.available_cards.map(card => (
              <option key={card.id} value={String(card.id)}>{card.name}{card.is_master ? ' (Master)' : ''}</option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: 11, color: '#555' }}>{carrier.available_cards?.[0]?.name || 'Master'}</span>
        )}
      </div>

      {/* Fuel Groups */}
      {hasFuel && (
        <>
          <div onClick={() => setFuelOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer',
              borderBottom: fuelOpen ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: fuelOpen ? 'rgba(255,193,7,0.04)' : 'transparent' }}>
            {fuelOpen ? <ChevronDown size={11} color="#FFC107" /> : <ChevronRight size={11} color="#555" />}
            <Zap size={11} color={fuelOpen ? '#FFC107' : '#555'} />
            <span style={{ fontSize: 12, fontWeight: 600, color: fuelOpen ? '#FFC107' : '#777', flex: 1 }}>
              Fuel Groups ({carrier.fuel_groups.length})
            </span>
            {carrier.fuel_groups.some(fg => fg.customer_pct != null) && (
              <span style={{ fontSize: 10, color: '#FFC107', fontWeight: 700 }}>Custom rates</span>
            )}
          </div>
          {fuelOpen && carrier.fuel_groups.map(fg => (
            <CustomerFuelRow key={fg.id} fg={fg} customerId={customerId} />
          ))}
        </>
      )}

      {/* Surcharge Overrides */}
      {hasSurcharges && (
        <>
          <div onClick={() => setSurchOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer',
              borderTop: hasFuel ? '1px solid rgba(255,255,255,0.04)' : 'none',
              borderBottom: surchOpen ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: surchOpen ? 'rgba(123,47,190,0.04)' : 'transparent' }}>
            {surchOpen ? <ChevronDown size={11} color="#7B2FBE" /> : <ChevronRight size={11} color="#555" />}
            <AlertCircle size={11} color={surchOpen ? '#7B2FBE' : '#555'} />
            <span style={{ fontSize: 12, fontWeight: 600, color: surchOpen ? '#7B2FBE' : '#777', flex: 1 }}>
              Surcharge Overrides ({surcharges.length})
            </span>
            {carrierOverrides.length > 0 && (
              <span style={{ fontSize: 10, color: '#FFC107', fontWeight: 700 }}>{carrierOverrides.length} custom</span>
            )}
          </div>
          {surchOpen && (
            <div style={{ padding: '6px 14px 10px' }}>
              {surcharges.map(s => (
                <SurchargeOverrideRow
                  key={s.id}
                  surcharge={s}
                  override={allOverrides.find(o => o.surcharge_id === s.id)}
                  customerId={customerId}
                  onChanged={onOverridesChange}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────
export default function CustomerPricingTab({ customer }) {
  const qc = useQueryClient();

  // Carrier links — drives everything
  const { data: carriers = [] } = useQuery({
    queryKey: ['customer-carrier-links', customer.id],
    queryFn:  () => api.get(`/customer-carrier-links/${customer.id}`).then(r => r.data),
  });

  // Surcharge overrides — loaded once, passed to per-carrier sections
  const { data: surchargeOverrides = [] } = useQuery({
    queryKey: ['surcharge-overrides', customer.id],
    queryFn:  () => api.get(`/surcharges/customer-overrides/${customer.id}`).then(r => r.data),
  });

  // Rate data
  const { data: rateData, isLoading: ratesLoading } = useQuery({
    queryKey: ['customer-rates', customer.id],
    queryFn:  () => api.get(`/customer-rates/${customer.id}`).then(r => r.data),
  });

  // Service selections (used for rate card filtering)
  const { data: selectedServices = [] } = useQuery({
    queryKey: ['customer-services', customer.id],
    queryFn:  () => api.get(`/customers/${customer.id}/services`).then(r => r.data),
  });

  // All carrier services — for metadata when building placeholder rate rows.
  // Shared cache key with ServiceSelector so no extra network request.
  const { data: allCarrierServices = [] } = useQuery({
    queryKey: ['all-carrier-services'],
    queryFn:  () => api.get('/carriers/services').then(r => r.data),
  });

  const activeCarriers    = carriers.filter(c => c.active);
  const activeCourierIds  = new Set(activeCarriers.map(c => c.courier_id));
  // Use courier_code for rate filtering — customer_rates stores old billing-system
  // courier_id (e.g. 150) which is different from couriers.id (e.g. 3). Both APIs
  // expose courier_code ('DPD', 'DHL') so that's the safe cross-reference key.
  const activeCourierCodes = new Set(activeCarriers.map(c => c.courier_code));

  // Use service_code for comparison — selectedServices has new courier_services.id (e.g. 12)
  // while customer_rates.service_id is the old billing system ID (e.g. 764). Both share
  // service_code ('DPD_NEXT_DAY') as the safe cross-reference key.
  const selectedCodes = new Set(selectedServices.map(s => s.service_code).filter(Boolean));

  // Lookup: service_code → full service metadata (from /carriers/services)
  const allServicesMeta = Object.fromEntries(allCarrierServices.map(s => [s.service_code, s]));

  // Lookup: service_code → rate data (from /customer-rates/:id)
  const rateServiceMap = Object.fromEntries((rateData?.services || []).map(s => [s.service_code, s]));

  // Rate cards:
  // When services are selected, use selectedServices as the primary list so every
  // selected service gets a block — even those with no rate rows yet.
  // When nothing is selected, fall back to whatever rate data exists.
  let visibleServices;
  if (selectedCodes.size === 0) {
    // No services selected: show all rate data filtered to active carriers
    visibleServices = (rateData?.services || []).filter(s =>
      activeCourierCodes.size === 0 || activeCourierCodes.has(s.courier_code)
    );
  } else {
    visibleServices = selectedServices
      .filter(s => {
        const meta = allServicesMeta[s.service_code];
        if (!meta) return false;
        return activeCourierIds.size === 0 || activeCourierIds.has(meta.courier_id);
      })
      .map(s => {
        // Prefer real rate data if it exists for this service
        if (rateServiceMap[s.service_code]) return rateServiceMap[s.service_code];
        // Otherwise build a placeholder so the user sees the row and can add rates
        const meta    = allServicesMeta[s.service_code];
        const carrier = activeCarriers.find(c => c.courier_id === meta?.courier_id);
        return {
          service_id:   s.courier_service_id,
          service_code: s.service_code,
          service_name: meta?.name || s.service_code,
          courier_id:   meta?.courier_id || 0,
          courier_code: carrier?.courier_code || '',
          courier_name: meta?.courier_name || carrier?.courier_name || '',
          service_type: meta?.service_type || 'domestic',
          rate_count:   0,
          rates:        [],
        };
      });
  }

  const byCourier = {};
  for (const s of visibleServices) {
    if (!byCourier[s.courier_name]) byCourier[s.courier_name] = [];
    byCourier[s.courier_name].push(s);
  }

  const visibleRates = visibleServices.reduce((a, s) => a + s.rate_count, 0);

  async function handlePriceUpdate(rateId, price, isSub = false) {
    if (isSub) await api.patch(`/customer-rates/rate/${rateId}`, { price_sub: price });
    else        await api.patch(`/customer-rates/rate/${rateId}`, { price });
    qc.invalidateQueries(['customer-rates', customer.id]);
  }
  async function handlePriceDelete(rateId) {
    await api.delete(`/customer-rates/rate/${rateId}`);
    qc.invalidateQueries(['customer-rates', customer.id]);
  }

  return (
    <div>
      {/* 1 — Thin carrier toggle strip */}
      <CourierToggleStrip carriers={carriers} customerId={customer.id} />

      {/* 2 — Per-carrier: fuel groups + surcharge overrides (active carriers only) */}
      {activeCarriers.map(carrier => (
        <ActiveCarrierSection
          key={carrier.courier_id}
          carrier={carrier}
          customerId={customer.id}
          allOverrides={surchargeOverrides}
          onOverridesChange={() => qc.invalidateQueries(['surcharge-overrides', customer.id])}
        />
      ))}

      {/* 3 — Service selection (filtered to active carriers) */}
      <ServiceSelector customerId={customer.id} activeCourierIds={activeCourierIds} />

      {/* 4 — Rate cards */}
      {visibleServices.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, flex: 1 }}>
            Rate Cards
            <span style={{ fontSize: 13, color: '#AAAAAA', fontWeight: 400, marginLeft: 10 }}>
              {visibleServices.length} service{visibleServices.length !== 1 ? 's' : ''}
              {visibleRates > 0 && ` · ${visibleRates.toLocaleString()} rates`}
            </span>
          </h3>
        </div>
      )}

      {ratesLoading && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#AAAAAA' }}>Loading rates…</div>
      )}

      {!ratesLoading && visibleServices.length === 0 && activeCourierIds.size > 0 && (
        <div className="moov-card" style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 13 }}>
          No rate data for the selected carriers yet.
        </div>
      )}

      {Object.entries(byCourier).map(([courierName, svcs]) => (
        <CourierGroup
          key={courierName}
          courierName={courierName}
          services={svcs}
          customerId={customer.id}
          onRateUpdate={handlePriceUpdate}
          onRateDelete={handlePriceDelete}
          onRateCreated={() => qc.invalidateQueries(['customer-rates', customer.id])}
        />
      ))}
    </div>
  );
}
