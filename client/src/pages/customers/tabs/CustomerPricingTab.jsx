/**
 * CustomerPricingTab — Markup / Fixed Fee pricing model
 *
 * A customer is priced per service using either:
 *   markup    — sell price = carrier cost × (1 + markup%)
 *   fixed_fee — sell price = carrier cost + flat fee
 *
 * Zones and weight bands live on the carrier rate card and never appear here.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, X, TrendingUp, DollarSign, ChevronDown } from 'lucide-react';
import cspApi from '../../../api/customerServicePricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const gbp = n => `£${parseFloat(n || 0).toFixed(2)}`;

function PricingTypePill({ type }) {
  if (type === 'markup') {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:9999,
        fontSize:11, fontWeight:700, background:'rgba(0,200,83,0.10)', color:'#00C853' }}>
        <TrendingUp size={10}/> Markup
      </span>
    );
  }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:9999,
      fontSize:11, fontWeight:700, background:'rgba(255,193,7,0.10)', color:'#FFC107' }}>
      <DollarSign size={10}/> Fixed fee
    </span>
  );
}

// ─── Add / Edit row ───────────────────────────────────────────────────────────

function AddPricingRow({ customerId, availableCards, existingServiceIds, onDone }) {
  const qc = useQueryClient();

  // Group available cards by courier for the picker
  const couriers = useMemo(() => {
    const map = {};
    (availableCards || []).forEach(row => {
      const key = `${row.courier_id}__${row.rate_card_id}`;
      if (!map[key]) map[key] = { courierId: row.courier_id, courierName: row.courier_name, courierCode: row.courier_code, rateCardId: row.rate_card_id, rateCardName: row.rate_card_name, services: [] };
      if (!map[key].services.find(s => s.service_id === row.service_id)) {
        map[key].services.push({ service_id: row.service_id, service_name: row.service_name, service_code: row.service_code });
      }
    });
    return Object.values(map);
  }, [availableCards]);

  const [selectedKey, setSelectedKey] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [pricingType, setPricingType] = useState('markup');
  const [markupPct, setMarkupPct]     = useState('');
  const [fixedFee, setFixedFee]       = useState('');

  const selectedGroup = couriers.find(c => `${c.courierId}__${c.rateCardId}` === selectedKey);
  const availableServices = (selectedGroup?.services || []).filter(s => !existingServiceIds.includes(s.service_id));

  const save = useMutation({
    mutationFn: () => cspApi.upsert(customerId, {
      carrier_rate_card_id: selectedGroup?.rateCardId,
      service_id:           parseInt(selectedServiceId),
      pricing_type:         pricingType,
      markup_pct:  pricingType === 'markup'    ? parseFloat(markupPct) : null,
      fixed_fee:   pricingType === 'fixed_fee' ? parseFloat(fixedFee)  : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['customer-service-pricing', customerId]);
      onDone();
    },
  });

  const canSave = selectedKey && selectedServiceId
    && (pricingType === 'markup' ? markupPct !== '' : fixedFee !== '');

  return (
    <div style={{ background:'rgba(0,200,83,0.04)', border:'1px solid rgba(0,200,83,0.2)',
      borderRadius:10, padding:16, marginBottom:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        {/* Rate card picker */}
        <div>
          <label style={{ fontSize:11, color:'#888', fontWeight:700, display:'block', marginBottom:5 }}>Carrier rate card</label>
          <div style={{ position:'relative' }}>
            <select
              value={selectedKey}
              onChange={e => { setSelectedKey(e.target.value); setSelectedServiceId(''); }}
              style={{ width:'100%', background:'#0D0E2A', border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:8, padding:'7px 32px 7px 12px', color: selectedKey ? '#fff' : '#555',
                fontSize:13, appearance:'none', cursor:'pointer', outline:'none' }}
            >
              <option value="">Select rate card…</option>
              {couriers.map(c => (
                <option key={`${c.courierId}__${c.rateCardId}`} value={`${c.courierId}__${c.rateCardId}`}>
                  {c.courierName} — {c.rateCardName}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#555', pointerEvents:'none' }}/>
          </div>
        </div>

        {/* Service picker */}
        <div>
          <label style={{ fontSize:11, color:'#888', fontWeight:700, display:'block', marginBottom:5 }}>Service</label>
          <div style={{ position:'relative' }}>
            <select
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              disabled={!selectedKey}
              style={{ width:'100%', background:'#0D0E2A', border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:8, padding:'7px 32px 7px 12px', color: selectedServiceId ? '#fff' : '#555',
                fontSize:13, appearance:'none', cursor: selectedKey ? 'pointer':'default', outline:'none',
                opacity: selectedKey ? 1 : 0.4 }}
            >
              <option value="">Select service…</option>
              {availableServices.map(s => (
                <option key={s.service_id} value={s.service_id}>
                  {s.service_name} ({s.service_code})
                </option>
              ))}
              {selectedKey && availableServices.length === 0 && (
                <option disabled>All services already priced</option>
              )}
            </select>
            <ChevronDown size={13} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#555', pointerEvents:'none' }}/>
          </div>
        </div>
      </div>

      {/* Pricing type + value */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        {/* Toggle */}
        <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
          {[['markup','Markup %'],['fixed_fee','Fixed fee']].map(([t, label]) => (
            <button key={t} onClick={() => setPricingType(t)} style={{
              padding:'7px 14px', fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
              background: pricingType === t ? '#7B2FBE' : 'transparent',
              color: pricingType === t ? '#fff' : '#888',
              transition:'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Value input */}
        {pricingType === 'markup' ? (
          <div className="pill-input-wrap" style={{ height:34, width:130 }}>
            <input
              type="number" step="0.01" min="0" max="9999"
              value={markupPct} onChange={e => setMarkupPct(e.target.value)}
              placeholder="30.00" style={{ fontSize:13 }} autoFocus
            />
            <div className="green-cap" style={{ fontSize:12 }}>%</div>
          </div>
        ) : (
          <div className="pill-input-wrap" style={{ height:34, width:130 }}>
            <div className="green-cap" style={{ fontSize:12, paddingLeft:10 }}>£</div>
            <input
              type="number" step="0.01" min="0"
              value={fixedFee} onChange={e => setFixedFee(e.target.value)}
              placeholder="2.50" style={{ fontSize:13 }} autoFocus
            />
          </div>
        )}

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={onDone} className="btn-ghost" style={{ height:34, padding:'0 14px', fontSize:12 }}>
            <X size={12}/> Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!canSave || save.isPending}
            className="btn-primary"
            style={{ height:34, padding:'0 16px', fontSize:12 }}
          >
            <Check size={12}/> Add pricing
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing row (view + inline edit) ────────────────────────────────────────

function PricingRow({ config, customerId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [pricingType, setPricingType] = useState(config.pricing_type);
  const [markupPct, setMarkupPct]     = useState(String(config.markup_pct ?? ''));
  const [fixedFee, setFixedFee]       = useState(String(config.fixed_fee ?? ''));
  const [confirmDel, setConfirmDel]   = useState(false);

  const update = useMutation({
    mutationFn: () => cspApi.update(customerId, config.id, {
      pricing_type: pricingType,
      markup_pct:  pricingType === 'markup'    ? parseFloat(markupPct) : null,
      fixed_fee:   pricingType === 'fixed_fee' ? parseFloat(fixedFee)  : null,
    }),
    onSuccess: () => { qc.invalidateQueries(['customer-service-pricing', customerId]); setEditing(false); },
  });

  const remove = useMutation({
    mutationFn: () => cspApi.remove(customerId, config.id),
    onSuccess: () => qc.invalidateQueries(['customer-service-pricing', customerId]),
  });

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:10, padding:'12px 16px', marginBottom:8 }}>

      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        {/* Courier + service */}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:2 }}>
            {config.courier_name}
            <span style={{ fontSize:11, fontWeight:400, color:'#888', marginLeft:8 }}>via</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#7B2FBE', marginLeft:6 }}>{config.service_name}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:10, fontFamily:'monospace', color:'#00C853', background:'rgba(0,200,83,0.08)', padding:'1px 7px', borderRadius:9999 }}>
              {config.service_code}
            </span>
            <span style={{ fontSize:10, color:'#555' }}>Rate card: {config.rate_card_name}</span>
          </div>
        </div>

        {/* Pricing display / edit */}
        {editing ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
              {[['markup','Markup %'],['fixed_fee','Fixed fee']].map(([t, label]) => (
                <button key={t} onClick={() => setPricingType(t)} style={{
                  padding:'5px 12px', fontSize:11, fontWeight:700, border:'none', cursor:'pointer',
                  background: pricingType === t ? '#7B2FBE' : 'transparent',
                  color: pricingType === t ? '#fff' : '#888',
                }}>{label}</button>
              ))}
            </div>
            {pricingType === 'markup' ? (
              <div className="pill-input-wrap" style={{ height:30, width:110 }}>
                <input type="number" step="0.01" min="0" value={markupPct}
                  onChange={e => setMarkupPct(e.target.value)} placeholder="30.00" style={{ fontSize:12 }}/>
                <div className="green-cap" style={{ fontSize:11 }}>%</div>
              </div>
            ) : (
              <div className="pill-input-wrap" style={{ height:30, width:110 }}>
                <div className="green-cap" style={{ fontSize:11, paddingLeft:10 }}>£</div>
                <input type="number" step="0.01" min="0" value={fixedFee}
                  onChange={e => setFixedFee(e.target.value)} placeholder="2.50" style={{ fontSize:12 }}/>
              </div>
            )}
            <button onClick={() => update.mutate()} className="btn-primary" style={{ height:30, padding:'0 12px', fontSize:11 }}>
              <Check size={11}/> Save
            </button>
            <button onClick={() => { setEditing(false); setPricingType(config.pricing_type); setMarkupPct(String(config.markup_pct??'')); setFixedFee(String(config.fixed_fee??'')); }}
              className="btn-ghost" style={{ height:30, padding:'0 10px', fontSize:11 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <PricingTypePill type={config.pricing_type} />
            <span style={{ fontSize:16, fontWeight:700, color:'#00C853', fontFamily:'monospace' }}>
              {config.pricing_type === 'markup'
                ? `+${parseFloat(config.markup_pct || 0).toFixed(2)}%`
                : `+${gbp(config.fixed_fee)} per shipment`
              }
            </span>
            <button onClick={() => setEditing(true)} className="btn-ghost"
              style={{ height:28, padding:'0 10px', fontSize:11, marginLeft:4 }}>
              Edit
            </button>
          </div>
        )}

        {/* Delete */}
        {!editing && (
          confirmDel ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#E91E8C' }}>Remove?</span>
              <button onClick={() => remove.mutate()} className="btn-ghost"
                style={{ height:26, padding:'0 10px', fontSize:11, color:'#E91E8C', borderColor:'rgba(233,30,140,0.3)' }}>
                Yes
              </button>
              <button onClick={() => setConfirmDel(false)} className="btn-ghost" style={{ height:26, padding:'0 8px', fontSize:11 }}>No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:4 }}>
              <Trash2 size={14}/>
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function CustomerPricingTab({ customerId }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['customer-service-pricing', customerId],
    queryFn: () => cspApi.list(customerId),
    enabled: !!customerId,
  });

  const { data: availableCards = [] } = useQuery({
    queryKey: ['csp-available-rate-cards'],
    queryFn: cspApi.availableRateCards,
  });

  const existingServiceIds = configs.map(c => c.service_id);

  // Group by courier for display
  const byCourier = useMemo(() => {
    const map = {};
    configs.forEach(c => {
      if (!map[c.courier_code]) map[c.courier_code] = { name: c.courier_name, code: c.courier_code, configs: [] };
      map[c.courier_code].configs.push(c);
    });
    return Object.values(map);
  }, [configs]);

  if (isLoading) return <div style={{ padding:40, textAlign:'center', color:'#AAAAAA' }}>Loading…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Service Pricing</h3>
          <p style={{ fontSize:12, color:'#888', margin:'4px 0 0' }}>
            Set a markup % or fixed fee per service. Zones and weight bands come from the carrier rate card.
          </p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary" style={{ height:32, padding:'0 14px', fontSize:12 }}>
            <Plus size={12}/> Add service
          </button>
        )}
      </div>

      {/* Add row */}
      {adding && (
        <AddPricingRow
          customerId={customerId}
          availableCards={availableCards}
          existingServiceIds={existingServiceIds}
          onDone={() => setAdding(false)}
        />
      )}

      {/* Existing configs */}
      {configs.length === 0 && !adding ? (
        <div className="moov-card" style={{ padding:32, textAlign:'center' }}>
          <p style={{ color:'#555', fontSize:13, margin:'0 0 12px' }}>No services priced yet.</p>
          <button onClick={() => setAdding(true)} className="btn-primary" style={{ height:32, padding:'0 16px', fontSize:12 }}>
            <Plus size={12}/> Add first service
          </button>
        </div>
      ) : (
        byCourier.map(courier => (
          <div key={courier.code} style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#7B2FBE', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {courier.name}
            </div>
            {courier.configs.map(cfg => (
              <PricingRow key={cfg.id} config={cfg} customerId={customerId} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
