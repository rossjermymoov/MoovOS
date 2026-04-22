/**
 * CustomerPricingTab
 * Service selector (which services the customer has) + rate card view
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Globe, Search, X, ChevronDown, ChevronRight, Package, Check } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const gbp = (n) => `£${parseFloat(n || 0).toFixed(2)}`;

const inp = {
  background: '#0D0E2A', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 9999, padding: '4px 12px', color: '#fff', fontSize: 12,
  outline: 'none', boxSizing: 'border-box',
};

// ─── Inline editable price cell ───────────────────────────────
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
          <div style={{ marginTop: 8 }}>
            <PriceCell rateId={exactMatch.id} initialPrice={exactMatch.price} onSaved={onRateUpdate} onDelete={onRateDelete} />
          </div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>Click the price above to edit</div>
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
                            ? <PriceCell rateId={rate.id} initialPrice={rate.price} onSaved={onRateUpdate} onDelete={onRateDelete} />
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
                  <th style={{ textAlign: 'right', padding: '12px 28px 12px 20px', color: '#AAAAAA', fontWeight: 600, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {displayRates.map((rate, ri) => (
                  <tr key={rate.id} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '8px 20px 8px 28px', color: '#DDD', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{rate.zone_name}</td>
                    <td style={{ textAlign: 'right', padding: '8px 28px 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <PriceCell rateId={rate.id} initialPrice={rate.price} onSaved={onRateUpdate} onDelete={onRateDelete} />
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

// ─── Service block — horizontal zone layout ───────────────────
function ServiceBlock({ service, onRateUpdate, onRateDelete }) {
  const [overlayOpen, setOverlay] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
          {service.service_name}
        </span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#555', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)' }}>
          {service.service_code}
        </span>
      </div>

      {/* Zone chips */}
      {service.rates.length === 0 ? (
        <div style={{ fontSize: 12, color: '#444', fontStyle: 'italic' }}>No pricing found</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Courier group ────────────────────────────────────────────
function CourierGroup({ courierName, services, onRateUpdate, onRateDelete }) {
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
        <ServiceBlock key={svc.service_id} service={svc} onRateUpdate={onRateUpdate} onRateDelete={onRateDelete} />
      ))}
    </div>
  );
}

// ─── Service selector ─────────────────────────────────────────
function ServiceSelector({ customerId }) {
  const queryClient = useQueryClient();

  // All carrier services grouped by courier
  const { data: allServices = [] } = useQuery({
    queryKey: ['all-carrier-services'],
    queryFn:  () => api.get('/carriers/services').then(r => r.data),
  });

  // This customer's selections
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

  // Group all services by courier
  const byCourier = {};
  for (const svc of allServices) {
    const cn = svc.courier_name || 'Unknown';
    if (!byCourier[cn]) byCourier[cn] = { courier_id: svc.courier_id, services: [] };
    byCourier[cn].services.push(svc);
  }

  const [openCouriers, setOpenCouriers] = useState({});
  // default: all collapsed — only open when explicitly toggled
  function toggleCourier(name) { setOpenCouriers(o => ({ ...o, [name]: !o[name] })); }

  const totalSelected = selectedIds.size;

  return (
    <div className="moov-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Package size={15} color="#7B2FBE" />
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7B2FBE', margin: 0, flex: 1 }}>Service Selection</h3>
        {totalSelected > 0
          ? <span style={{ fontSize: 12, color: '#00C853', fontWeight: 700 }}>{totalSelected} service{totalSelected !== 1 ? 's' : ''} active</span>
          : <span style={{ fontSize: 12, color: '#AAAAAA', fontStyle: 'italic' }}>No services selected — showing all rates</span>
        }
      </div>

      {/* Courier groups */}
      {Object.entries(byCourier).map(([courierName, { services }]) => {
        const isOpen       = openCouriers[courierName] === true; // default collapsed
        const countInGroup = services.filter(s => selectedIds.has(s.id)).length;
        return (
          <div key={courierName} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Courier row */}
            <div
              onClick={() => toggleCourier(courierName)}
              style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', cursor: 'pointer', background: 'rgba(255,255,255,0.01)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
            >
              {isOpen
                ? <ChevronDown size={13} style={{ color: '#555', marginRight: 8 }} />
                : <ChevronRight size={13} style={{ color: '#555', marginRight: 8 }} />}
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{courierName}</span>
              {countInGroup > 0 && (
                <span style={{ fontSize: 11, color: '#00C853', fontWeight: 700, marginRight: 8 }}>{countInGroup}/{services.length}</span>
              )}
              {/* Select all / clear all for this courier */}
              <button
                onClick={e => { e.stopPropagation(); services.forEach(s => { if (!selectedIds.has(s.id)) addSvc.mutate(s.id); }); }}
                style={{ background: 'none', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 5, color: '#00C853', fontSize: 11, fontWeight: 700, padding: '2px 8px', cursor: 'pointer', marginRight: 6 }}
              >All</button>
              <button
                onClick={e => { e.stopPropagation(); services.forEach(s => { if (selectedIds.has(s.id)) delSvc.mutate(s.id); }); }}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: '#AAAAAA', fontSize: 11, fontWeight: 700, padding: '2px 8px', cursor: 'pointer' }}
              >None</button>
            </div>

            {/* Service rows */}
            {isOpen && services.map(svc => {
              const active = selectedIds.has(svc.id);
              return (
                <div
                  key={svc.id}
                  onClick={() => toggle(svc.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 8px 42px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.03)', background: active ? 'rgba(0,200,83,0.04)' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = active ? 'rgba(0,200,83,0.07)' : 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = active ? 'rgba(0,200,83,0.04)' : 'transparent'}
                >
                  {/* Checkbox */}
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${active ? '#00C853' : 'rgba(255,255,255,0.2)'}`, background: active ? '#00C853' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0, transition: 'all 0.15s' }}>
                    {active && <Check size={10} color="#000" strokeWidth={3} />}
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

// ─── Main tab ─────────────────────────────────────────────────
export default function CustomerPricingTab({ customer }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customer-rates', customer.id],
    queryFn:  () => api.get(`/customer-rates/${customer.id}`).then(r => r.data),
  });

  const { data: selectedServices = [] } = useQuery({
    queryKey: ['customer-services', customer.id],
    queryFn:  () => api.get(`/customers/${customer.id}/services`).then(r => r.data),
  });

  const services   = data?.services   || [];
  const totalRates = data?.total_rates || 0;

  function refresh() { queryClient.invalidateQueries(['customer-rates', customer.id]); }

  async function handlePriceUpdate(rateId, price) {
    await api.patch(`/customer-rates/rate/${rateId}`, { price });
    refresh();
  }
  async function handlePriceDelete(rateId) {
    await api.delete(`/customer-rates/rate/${rateId}`);
    refresh();
  }

  // Filter: if customer has explicit service selections, only show those services
  const selectedIds = new Set(selectedServices.map(s => s.courier_service_id));
  const visibleServices = selectedIds.size > 0
    ? services.filter(s => selectedIds.has(s.service_id))
    : services; // no selections yet → show all (backwards compat for imported customers)

  // Group visible services by courier
  const byCourier = {};
  for (const s of visibleServices) {
    if (!byCourier[s.courier_name]) byCourier[s.courier_name] = [];
    byCourier[s.courier_name].push(s);
  }

  const visibleRates = visibleServices.reduce((a, s) => a + s.rate_count, 0);

  return (
    <div>
      <ServiceSelector customerId={customer.id} />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, flex: 1 }}>
          Rate Cards
          {visibleRates > 0 && (
            <span style={{ fontSize: 13, color: '#AAAAAA', fontWeight: 400, marginLeft: 10 }}>
              {visibleServices.length} services · {visibleRates.toLocaleString()} rates
            </span>
          )}
        </h3>
      </div>

      {isLoading && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#AAAAAA' }}>Loading rates…</div>
      )}

      {!isLoading && visibleServices.length === 0 && (
        <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#555' }}>
          {selectedIds.size > 0
            ? 'No rate data found for the selected services yet.'
            : 'No rates imported for this customer yet.'}
        </div>
      )}

      {Object.entries(byCourier).map(([courierName, svcs]) => (
        <CourierGroup
          key={courierName}
          courierName={courierName}
          services={svcs}
          onRateUpdate={handlePriceUpdate}
          onRateDelete={handlePriceDelete}
        />
      ))}
    </div>
  );
}
