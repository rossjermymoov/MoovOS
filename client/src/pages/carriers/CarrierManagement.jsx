import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronRight, Trash2, X, Check, AlertTriangle, Zap } from 'lucide-react';
import { carriersApi } from '../../api/carriers';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const pill = {
  display: 'inline-block', padding: '2px 10px', borderRadius: 9999,
  fontSize: 11, fontWeight: 700,
};

const CHARGE_METHOD_LABELS = {
  fixed: 'Fixed £', percentage: 'Percentage %', per_kg: 'Per kg', per_parcel: 'Per parcel',
};

const PRICING_METHOD_COLORS = {
  fixed:      { bg: 'rgba(0,200,83,0.12)',   text: '#00C853' },
  markup_pct: { bg: 'rgba(123,47,190,0.15)', text: '#7B2FBE' },
  margin_pct: { bg: 'rgba(0,188,212,0.12)',  text: '#00BCD4' },
};

function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{ background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <AlertTriangle size={14} color="#E91E8C" />
      <span style={{ fontSize: 13, color: '#fff', flex: 1 }}>{message}</span>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
      <button onClick={onConfirm} style={{ background: '#E91E8C', border: 'none', borderRadius: 6, color: '#fff', padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Delete</button>
    </div>
  );
}

// ─── Weight bands table ───────────────────────────────────────────────────────

function WeightBandsTable({ zoneId, bands, onRefresh }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ min_weight_kg: '', max_weight_kg: '', price_first: '', price_sub: '' });
  const [confirmId, setConfirmId] = useState(null);

  const addBand = useMutation({
    mutationFn: (data) => carriersApi.createWeightBand({ ...data, zone_id: zoneId }),
    onSuccess: () => { setAdding(false); setForm({ min_weight_kg: '', max_weight_kg: '', price_first: '', price_sub: '' }); onRefresh(); },
  });

  const delBand = useMutation({
    mutationFn: (id) => carriersApi.deleteWeightBand(id),
    onSuccess: () => { setConfirmId(null); onRefresh(); },
  });

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight Bands (Cost Price)</span>
        <button onClick={() => setAdding(a => !a)} style={{ background: 'none', border: 'none', color: '#00C853', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Add Band
        </button>
      </div>

      {adding && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 10 }}>
          {[['Min kg','min_weight_kg'],['Max kg','max_weight_kg'],['Cost 1st £','price_first'],['Cost Sub £','price_sub']].map(([ph, key]) => (
            <div key={key} className="pill-input-wrap" style={{ height: 36 }}>
              <input type="number" step="0.001" placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ fontSize: 13 }} />
            </div>
          ))}
          <button onClick={() => addBand.mutate(form)} className="btn-primary" style={{ height: 36, whiteSpace: 'nowrap' }}>
            <Check size={12} />
          </button>
        </div>
      )}

      {confirmId && <div style={{ marginBottom: 8 }}><Confirm message="Delete this weight band?" onConfirm={() => delBand.mutate(confirmId)} onCancel={() => setConfirmId(null)} /></div>}

      <table className="moov-table" style={{ fontSize: 12 }}>
        <thead><tr><th>Min kg</th><th>Max kg</th><th>Cost 1st</th><th>Cost Sub</th><th></th></tr></thead>
        <tbody>
          {bands.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#555' }}>No weight bands yet</td></tr>}
          {bands.map(b => (
            <tr key={b.id}>
              <td>{parseFloat(b.min_weight_kg).toFixed(3)}</td>
              <td>{parseFloat(b.max_weight_kg).toFixed(3)}</td>
              <td style={{ color: '#00C853' }}>£{parseFloat(b.price_first).toFixed(4)}</td>
              <td style={{ color: '#FFC107' }}>{b.price_sub ? `£${parseFloat(b.price_sub).toFixed(4)}` : <span style={{ color: '#555' }}>—</span>}</td>
              <td style={{ textAlign: 'right' }}>
                <button onClick={() => setConfirmId(b.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={11} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Zone card ────────────────────────────────────────────────────────────────

function ZoneCard({ zone, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [countryInput, setCountryInput] = useState('');
  const [postcodeInput, setPostcodeInput] = useState('');
  const [postcodeType, setPostcodeType] = useState('include');

  const delZone     = useMutation({ mutationFn: () => carriersApi.deleteZone(zone.id), onSuccess: onRefresh });
  const addCountry  = useMutation({ mutationFn: () => carriersApi.addCountry(zone.id, { country_iso: countryInput.toUpperCase() }), onSuccess: () => { setCountryInput(''); onRefresh(); } });
  const delCountry  = useMutation({ mutationFn: (id) => carriersApi.removeCountry(id), onSuccess: onRefresh });
  const addPostcode = useMutation({ mutationFn: () => carriersApi.addPostcodeRule(zone.id, { postcode_prefix: postcodeInput.toUpperCase(), rule_type: postcodeType }), onSuccess: () => { setPostcodeInput(''); onRefresh(); } });
  const delPostcode = useMutation({ mutationFn: (id) => carriersApi.removePostcodeRule(id), onSuccess: onRefresh });

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 10 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <ChevronRight size={14} style={{ marginRight: 8, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', color: '#00C853' }} />
        <span style={{ fontWeight: 600, color: '#fff', flex: 1 }}>{zone.name}</span>
        <span style={{ fontSize: 11, color: '#AAAAAA', marginRight: 12 }}>
          {(zone.country_codes || []).length} countries · {(zone.weight_bands || []).length} bands
        </span>
        <button onClick={e => { e.stopPropagation(); setConfirmDel(true); }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={13} /></button>
      </div>

      {confirmDel && (
        <div style={{ padding: '0 16px 12px' }}>
          <Confirm message={`Delete zone "${zone.name}"? This will remove all weight bands.`} onConfirm={() => delZone.mutate()} onCancel={() => setConfirmDel(false)} />
        </div>
      )}

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Country codes */}
          <div style={{ marginTop: 14, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country Codes</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {(zone.country_codes || []).map(cc => (
                <span key={cc.id} style={{ ...pill, background: 'rgba(0,200,83,0.1)', color: '#00C853', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {cc.country_iso}
                  <button onClick={() => delCountry.mutate(cc.id)} style={{ background: 'none', border: 'none', color: '#00C853', cursor: 'pointer', padding: 0, lineHeight: 1 }}><X size={10} /></button>
                </span>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="pill-input-wrap" style={{ height: 28, width: 80 }}>
                  <input value={countryInput} onChange={e => setCountryInput(e.target.value)} placeholder="GB" maxLength={3} style={{ fontSize: 12 }} />
                </div>
                <button onClick={() => addCountry.mutate()} className="btn-primary" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>Add</button>
              </div>
            </div>
          </div>

          {/* Postcode rules */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postcode Rules</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {(zone.postcode_rules || []).map(pr => (
                <span key={pr.id} style={{ ...pill, background: pr.rule_type === 'include' ? 'rgba(0,188,212,0.12)' : 'rgba(233,30,140,0.12)', color: pr.rule_type === 'include' ? '#00BCD4' : '#E91E8C', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {pr.rule_type === 'include' ? '✓' : '✗'} {pr.postcode_prefix}
                  <button onClick={() => delPostcode.mutate(pr.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                </span>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="pill-input-wrap" style={{ height: 28, width: 80 }}>
                  <input value={postcodeInput} onChange={e => setPostcodeInput(e.target.value)} placeholder="BT" style={{ fontSize: 12 }} />
                </div>
                <div className="pill-input-wrap" style={{ height: 28, width: 100 }}>
                  <select value={postcodeType} onChange={e => setPostcodeType(e.target.value)} style={{ fontSize: 12, paddingLeft: 10 }}>
                    <option value="include">Include</option>
                    <option value="exclude">Exclude</option>
                  </select>
                </div>
                <button onClick={() => addPostcode.mutate()} className="btn-primary" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>Add</button>
              </div>
            </div>
          </div>

          <WeightBandsTable zoneId={zone.id} bands={zone.weight_bands || []} onRefresh={onRefresh} />
        </div>
      )}
    </div>
  );
}

// ─── Service detail panel ─────────────────────────────────────────────────────

function ServiceDetail({ serviceId, onBack }) {
  const qc = useQueryClient();
  const [addingZone, setAddingZone] = useState(false);
  const [zoneName, setZoneName] = useState('');

  const { data: svc, isLoading, refetch } = useQuery({
    queryKey: ['carrier-service', serviceId],
    queryFn: () => carriersApi.getService(serviceId),
  });

  const addZone = useMutation({
    mutationFn: () => carriersApi.createZone({ courier_service_id: serviceId, name: zoneName }),
    onSuccess: () => { setAddingZone(false); setZoneName(''); refetch(); },
  });

  const updateFuel = useMutation({
    mutationFn: (pct) => carriersApi.updateService(serviceId, { fuel_surcharge_pct: pct }),
    onSuccess: () => refetch(),
  });

  const [fuelPct, setFuelPct] = useState('');
  const [editFuel, setEditFuel] = useState(false);

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center', color: '#AAAAAA' }}>Loading…</div>;
  if (!svc) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>← Back</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#7B2FBE', margin: 0 }}>{svc.name}</h1>
          <span style={{ fontSize: 13, color: '#AAAAAA' }}>{svc.courier_name} · {svc.service_code}</span>
        </div>
      </div>

      {/* Fuel surcharge */}
      <div className="moov-card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>Fuel Surcharge</span>
        {editFuel ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="pill-input-wrap" style={{ height: 32, width: 100 }}>
              <input type="number" step="0.01" value={fuelPct} onChange={e => setFuelPct(e.target.value)} placeholder="5.00" style={{ fontSize: 13 }} />
              <div className="green-cap" style={{ fontSize: 12 }}>%</div>
            </div>
            <button onClick={() => { updateFuel.mutate(fuelPct); setEditFuel(false); }} className="btn-primary" style={{ height: 32, padding: '0 14px', fontSize: 12 }}>Save</button>
            <button onClick={() => setEditFuel(false)} className="btn-ghost" style={{ height: 32, padding: '0 10px', fontSize: 12 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: svc.fuel_surcharge_pct ? '#FFC107' : '#555' }}>
              {svc.fuel_surcharge_pct ? `${parseFloat(svc.fuel_surcharge_pct).toFixed(2)}%` : 'Not set'}
            </span>
            <button onClick={() => { setFuelPct(svc.fuel_surcharge_pct || ''); setEditFuel(true); }} className="btn-ghost" style={{ height: 28, padding: '0 12px', fontSize: 12 }}>Edit</button>
          </div>
        )}
      </div>

      {/* Zones */}
      <div className="moov-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Zones & Weight Bands</h3>
          <button onClick={() => setAddingZone(a => !a)} className="btn-primary" style={{ height: 32, padding: '0 14px', fontSize: 12 }}>
            <Plus size={12} /> Add Zone
          </button>
        </div>

        {addingZone && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div className="pill-input-wrap" style={{ flex: 1, height: 36 }}>
              <input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="Zone name — e.g. Mainland, Northern Ireland, EU West" />
            </div>
            <button onClick={() => addZone.mutate()} className="btn-primary" style={{ height: 36, whiteSpace: 'nowrap' }}><Check size={13} /> Add</button>
            <button onClick={() => setAddingZone(false)} className="btn-ghost" style={{ height: 36 }}>Cancel</button>
          </div>
        )}

        {(svc.zones || []).length === 0
          ? <p style={{ color: '#555', fontSize: 13 }}>No zones configured yet. Add a zone to start building rate cards.</p>
          : (svc.zones || []).map(z => <ZoneCard key={z.id} zone={z} onRefresh={refetch} />)
        }
      </div>

      {/* Congestion Surcharges */}
      <CongestionPanel serviceId={serviceId} data={svc.congestion_surcharges || []} onRefresh={refetch} />

      {/* Dimensional Weight Rules */}
      <DimWeightPanel serviceId={serviceId} data={svc.dimensional_weight_rules || []} onRefresh={refetch} />
    </div>
  );
}

// ─── Congestion surcharges panel ──────────────────────────────────────────────

function CongestionPanel({ serviceId, data, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ postcode_prefix: '', fee: '' });
  const [confirmId, setConfirmId] = useState(null);

  const add = useMutation({
    mutationFn: () => carriersApi.createCongestion({ courier_service_id: serviceId, ...form }),
    onSuccess: () => { setAdding(false); setForm({ postcode_prefix: '', fee: '' }); onRefresh(); },
  });
  const del = useMutation({ mutationFn: (id) => carriersApi.deleteCongestion(id), onSuccess: () => { setConfirmId(null); onRefresh(); } });

  return (
    <div className="moov-card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Congestion Surcharges</h3>
        <button onClick={() => setAdding(a => !a)} className="btn-primary" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div className="pill-input-wrap" style={{ width: 120, height: 34 }}><input value={form.postcode_prefix} onChange={e => setForm(f => ({ ...f, postcode_prefix: e.target.value }))} placeholder="E1, W1A…" style={{ fontSize: 13 }} /></div>
          <div className="pill-input-wrap" style={{ width: 120, height: 34 }}><input type="number" step="0.01" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} placeholder="Fee £" style={{ fontSize: 13 }} /></div>
          <button onClick={() => add.mutate()} className="btn-primary" style={{ height: 34 }}><Check size={13} /></button>
          <button onClick={() => setAdding(false)} className="btn-ghost" style={{ height: 34 }}>Cancel</button>
        </div>
      )}
      {confirmId && <div style={{ marginBottom: 10 }}><Confirm message="Delete this surcharge?" onConfirm={() => del.mutate(confirmId)} onCancel={() => setConfirmId(null)} /></div>}
      {data.length === 0
        ? <p style={{ color: '#555', fontSize: 13, margin: 0 }}>No congestion surcharges configured.</p>
        : <table className="moov-table" style={{ fontSize: 12 }}>
            <thead><tr><th>Postcode Prefix</th><th>Fee</th><th></th></tr></thead>
            <tbody>{data.map(cs => (
              <tr key={cs.id}>
                <td><span style={{ ...pill, background: 'rgba(255,193,7,0.12)', color: '#FFC107' }}>{cs.postcode_prefix}</span></td>
                <td style={{ color: '#E91E8C' }}>£{parseFloat(cs.fee).toFixed(4)}</td>
                <td style={{ textAlign: 'right' }}><button onClick={() => setConfirmId(cs.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={11} /></button></td>
              </tr>
            ))}</tbody>
          </table>
      }
    </div>
  );
}

// ─── Dimensional weight rules panel ───────────────────────────────────────────

function DimWeightPanel({ serviceId, data, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', divisor: '5000' });
  const [confirmId, setConfirmId] = useState(null);

  const add = useMutation({
    mutationFn: () => carriersApi.createDimRule({ courier_service_id: serviceId, ...form }),
    onSuccess: () => { setAdding(false); setForm({ name: '', divisor: '5000' }); onRefresh(); },
  });
  const del = useMutation({ mutationFn: (id) => carriersApi.deleteDimRule(id), onSuccess: () => { setConfirmId(null); onRefresh(); } });

  return (
    <div className="moov-card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Dimensional Weight Rules</h3>
        <button onClick={() => setAdding(a => !a)} className="btn-primary" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>
          <Plus size={11} /> Add
        </button>
      </div>
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div className="pill-input-wrap" style={{ flex: 1, height: 34 }}><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Rule name — e.g. UPS Volumetric Weight" style={{ fontSize: 13 }} /></div>
          <div className="pill-input-wrap" style={{ width: 120, height: 34 }}><input type="number" value={form.divisor} onChange={e => setForm(f => ({ ...f, divisor: e.target.value }))} placeholder="Divisor" style={{ fontSize: 13 }} /></div>
          <button onClick={() => add.mutate()} className="btn-primary" style={{ height: 34 }}><Check size={13} /></button>
          <button onClick={() => setAdding(false)} className="btn-ghost" style={{ height: 34 }}>Cancel</button>
        </div>
      )}
      {confirmId && <div style={{ marginBottom: 10 }}><Confirm message="Delete this rule?" onConfirm={() => del.mutate(confirmId)} onCancel={() => setConfirmId(null)} /></div>}
      {data.length === 0
        ? <p style={{ color: '#555', fontSize: 13, margin: 0 }}>No dimensional weight rules configured.</p>
        : <table className="moov-table" style={{ fontSize: 12 }}>
            <thead><tr><th>Rule Name</th><th>Divisor</th><th>Formula</th><th></th></tr></thead>
            <tbody>{data.map(dr => (
              <tr key={dr.id}>
                <td style={{ fontWeight: 600 }}>{dr.name}</td>
                <td style={{ color: '#7B2FBE' }}>{dr.divisor.toLocaleString()}</td>
                <td style={{ color: '#AAAAAA', fontFamily: 'monospace', fontSize: 11 }}>(L × W × H) / {dr.divisor.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}><button onClick={() => setConfirmId(dr.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={11} /></button></td>
              </tr>
            ))}</tbody>
          </table>
      }
    </div>
  );
}

// ─── Rules engine page ────────────────────────────────────────────────────────

function RulesEngine({ services }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', courier_service_id: '', charge_method: 'fixed', charge_value: '', is_active: true });
  const [expandedRule, setExpandedRule] = useState(null);
  const [condForm, setCondForm] = useState({ logic_operator: 'AND', json_field_path: '', operator: 'equals', value: '' });

  const { data: rules = [], refetch } = useQuery({
    queryKey: ['carrier-rules'],
    queryFn: carriersApi.getRules,
  });

  const addRule = useMutation({
    mutationFn: () => carriersApi.createRule({ ...form, courier_service_id: form.courier_service_id || null }),
    onSuccess: () => { setAdding(false); setForm({ name: '', courier_service_id: '', charge_method: 'fixed', charge_value: '', is_active: true }); refetch(); },
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, is_active }) => carriersApi.updateRule(id, { is_active }),
    onSuccess: () => refetch(),
  });

  const delRule = useMutation({
    mutationFn: (id) => carriersApi.deleteRule(id),
    onSuccess: () => refetch(),
  });

  const addCond = useMutation({
    mutationFn: (ruleId) => carriersApi.addCondition(ruleId, condForm),
    onSuccess: () => { setCondForm({ logic_operator: 'AND', json_field_path: '', operator: 'equals', value: '' }); refetch(); },
  });

  const delCond = useMutation({
    mutationFn: (id) => carriersApi.removeCondition(id),
    onSuccess: () => refetch(),
  });

  const OPERATORS = ['equals','not_equals','greater_than','less_than','greater_than_or_equal','less_than_or_equal','in','not_in','starts_with','contains'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#7B2FBE', margin: 0 }}>Rules Engine</h2>
          <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 4 }}>Custom charge rules triggered by conditions on any shipment field</p>
        </div>
        <button onClick={() => setAdding(a => !a)} className="btn-primary"><Plus size={13} /> Add Rule</button>
      </div>

      {adding && (
        <div className="moov-card" style={{ padding: 20, marginBottom: 16, border: '1px solid rgba(0,200,83,0.3)' }}>
          <h4 style={{ color: '#7B2FBE', marginBottom: 16 }}>New Rule</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Rule Name</label>
              <div className="pill-input-wrap"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="EU Demand Surcharge" /></div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Service (optional)</label>
              <div className="pill-input-wrap">
                <select value={form.courier_service_id} onChange={e => setForm(f => ({ ...f, courier_service_id: e.target.value }))} style={{ paddingLeft: 14 }}>
                  <option value="">All services</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Charge Method</label>
              <div className="pill-input-wrap">
                <select value={form.charge_method} onChange={e => setForm(f => ({ ...f, charge_method: e.target.value }))} style={{ paddingLeft: 14 }}>
                  {Object.entries(CHARGE_METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Value</label>
              <div className="pill-input-wrap"><input type="number" step="0.01" value={form.charge_value} onChange={e => setForm(f => ({ ...f, charge_value: e.target.value }))} placeholder="5.00" /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => addRule.mutate()} className="btn-primary"><Check size={13} /> Create Rule</button>
            <button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {rules.length === 0
        ? <div className="moov-card" style={{ padding: 32, textAlign: 'center', color: '#555' }}>No rules configured yet</div>
        : rules.map(rule => (
          <div key={rule.id} className="moov-card" style={{ marginBottom: 12, border: `1px solid ${rule.is_active ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.06)'}`, opacity: rule.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer' }} onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}>
              <Zap size={14} color={rule.is_active ? '#00C853' : '#555'} style={{ marginRight: 10 }} />
              <span style={{ fontWeight: 700, color: '#fff', flex: 1 }}>{rule.name}</span>
              {rule.service_name && <span style={{ ...pill, background: 'rgba(123,47,190,0.15)', color: '#7B2FBE', marginRight: 10 }}>{rule.service_name}</span>}
              <span style={{ ...pill, background: 'rgba(255,193,7,0.12)', color: '#FFC107', marginRight: 10 }}>{CHARGE_METHOD_LABELS[rule.charge_method]} {parseFloat(rule.charge_value).toFixed(2)}</span>
              <span style={{ ...pill, background: rule.is_active ? 'rgba(0,200,83,0.12)' : 'rgba(255,255,255,0.06)', color: rule.is_active ? '#00C853' : '#AAAAAA', marginRight: 10 }}>{rule.is_active ? 'Active' : 'Inactive'}</span>
              <button onClick={e => { e.stopPropagation(); toggleRule.mutate({ id: rule.id, is_active: !rule.is_active }); }} className="btn-ghost" style={{ height: 26, padding: '0 10px', fontSize: 11, marginRight: 8 }}>
                {rule.is_active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={e => { e.stopPropagation(); delRule.mutate(rule.id); }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={13} /></button>
            </div>

            {expandedRule === rule.id && (
              <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 12, color: '#AAAAAA', margin: '12px 0 8px' }}>CONDITIONS — all must be true (AND) / any (OR)</p>
                {(rule.conditions || []).map((c, idx) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
                    {idx > 0 && <span style={{ ...pill, background: 'rgba(255,255,255,0.05)', color: '#AAAAAA', minWidth: 32, textAlign: 'center' }}>{c.logic_operator}</span>}
                    <span style={{ color: '#00BCD4', fontFamily: 'monospace' }}>{c.json_field_path}</span>
                    <span style={{ ...pill, background: 'rgba(123,47,190,0.12)', color: '#7B2FBE' }}>{c.operator}</span>
                    <span style={{ color: '#FFC107', fontFamily: 'monospace' }}>{c.value}</span>
                    <button onClick={() => delCond.mutate(c.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', marginLeft: 'auto' }}><X size={11} /></button>
                  </div>
                ))}
                {/* Add condition form */}
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 1fr auto', gap: 8, marginTop: 12 }}>
                  <div className="pill-input-wrap" style={{ height: 32 }}>
                    <select value={condForm.logic_operator} onChange={e => setCondForm(f => ({ ...f, logic_operator: e.target.value }))} style={{ fontSize: 12, paddingLeft: 8 }}>
                      <option>AND</option><option>OR</option>
                    </select>
                  </div>
                  <div className="pill-input-wrap" style={{ height: 32 }}><input value={condForm.json_field_path} onChange={e => setCondForm(f => ({ ...f, json_field_path: e.target.value }))} placeholder="ship_to.country_iso" style={{ fontSize: 12 }} /></div>
                  <div className="pill-input-wrap" style={{ height: 32 }}>
                    <select value={condForm.operator} onChange={e => setCondForm(f => ({ ...f, operator: e.target.value }))} style={{ fontSize: 12, paddingLeft: 8 }}>
                      {OPERATORS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="pill-input-wrap" style={{ height: 32 }}><input value={condForm.value} onChange={e => setCondForm(f => ({ ...f, value: e.target.value }))} placeholder="GB,FR,DE" style={{ fontSize: 12 }} /></div>
                  <button onClick={() => addCond.mutate(rule.id)} className="btn-primary" style={{ height: 32, padding: '0 12px' }}><Check size={12} /></button>
                </div>
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

// ─── Main carrier management page ─────────────────────────────────────────────

const TABS = ['Carriers & Rate Cards', 'Rules Engine'];

export default function CarrierManagement() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [addingCourier, setAddingCourier] = useState(false);
  const [addingService, setAddingService] = useState(null); // courier id
  const [courierForm, setCourierForm] = useState({ code: '', name: '' });
  const [serviceForm, setServiceForm] = useState({ service_code: '', name: '', fuel_surcharge_pct: '' });

  const { data: couriers = [], isLoading, refetch: refetchCouriers } = useQuery({
    queryKey: ['couriers'],
    queryFn: carriersApi.getCouriers,
  });

  const { data: services = [], refetch: refetchServices } = useQuery({
    queryKey: ['carrier-services-all'],
    queryFn: () => carriersApi.getServices(),
  });

  const addCourier = useMutation({
    mutationFn: () => carriersApi.createCourier(courierForm),
    onSuccess: () => { setAddingCourier(false); setCourierForm({ code: '', name: '' }); refetchCouriers(); },
  });

  const addService = useMutation({
    mutationFn: () => carriersApi.createService({ ...serviceForm, courier_id: addingService }),
    onSuccess: () => { setAddingService(null); setServiceForm({ service_code: '', name: '', fuel_surcharge_pct: '' }); refetchCouriers(); refetchServices(); },
  });

  const delCourier = useMutation({ mutationFn: (id) => carriersApi.deleteCourier(id), onSuccess: () => refetchCouriers() });

  if (selectedService) {
    return <ServiceDetail serviceId={selectedService} onBack={() => setSelectedService(null)} />;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853', margin: 0 }}>Carrier Management</h1>
          <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 4 }}>Configure carriers, services, rate cards, and pricing rules</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 18px', fontSize: 14, fontWeight: 600,
            color: tab === i ? '#00C853' : '#AAAAAA',
            borderBottom: tab === i ? '2px solid #00C853' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Carriers & Rate Cards ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => setAddingCourier(a => !a)} className="btn-primary">
              <Plus size={13} /> Add Carrier
            </button>
          </div>

          {addingCourier && (
            <div className="moov-card" style={{ padding: 20, marginBottom: 16, border: '1px solid rgba(0,200,83,0.3)' }}>
              <h4 style={{ color: '#7B2FBE', marginBottom: 14 }}>New Carrier</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Carrier Code</label>
                  <div className="pill-input-wrap"><input value={courierForm.code} onChange={e => setCourierForm(f => ({ ...f, code: e.target.value }))} placeholder="DPD" /></div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Display Name</label>
                  <div className="pill-input-wrap"><input value={courierForm.name} onChange={e => setCourierForm(f => ({ ...f, name: e.target.value }))} placeholder="DPD" /></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => addCourier.mutate()} className="btn-primary"><Check size={13} /> Add Carrier</button>
                <button onClick={() => setAddingCourier(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {isLoading
            ? <div style={{ textAlign: 'center', color: '#AAAAAA', padding: 40 }}>Loading…</div>
            : couriers.length === 0
              ? <div className="moov-card" style={{ padding: 40, textAlign: 'center', color: '#555' }}>No carriers configured yet. Add your first carrier above.</div>
              : couriers.map(courier => (
                <div key={courier.id} className="moov-card" style={{ marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{courier.name}</span>
                      <span style={{ ...pill, background: 'rgba(0,200,83,0.1)', color: '#00C853', marginLeft: 10, fontSize: 11 }}>{courier.code}</span>
                      <span style={{ fontSize: 12, color: '#AAAAAA', marginLeft: 12 }}>{courier.service_count} service{courier.service_count !== 1 ? 's' : ''}</span>
                    </div>
                    <button onClick={() => setAddingService(courier.id)} className="btn-ghost" style={{ height: 30, padding: '0 14px', fontSize: 12, marginRight: 10 }}>
                      <Plus size={11} /> Add Service
                    </button>
                    <button onClick={() => delCourier.mutate(courier.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>

                  {addingService === courier.id && (
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,200,83,0.04)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Service Code</label>
                          <div className="pill-input-wrap" style={{ height: 34 }}><input value={serviceForm.service_code} onChange={e => setServiceForm(f => ({ ...f, service_code: e.target.value }))} placeholder="DPD-12" style={{ fontSize: 13 }} /></div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Service Name</label>
                          <div className="pill-input-wrap" style={{ height: 34 }}><input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder="DPD Next Day" style={{ fontSize: 13 }} /></div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: '#AAAAAA', display: 'block', marginBottom: 4 }}>Fuel Surcharge %</label>
                          <div className="pill-input-wrap" style={{ height: 34 }}><input type="number" step="0.01" value={serviceForm.fuel_surcharge_pct} onChange={e => setServiceForm(f => ({ ...f, fuel_surcharge_pct: e.target.value }))} placeholder="5.00" style={{ fontSize: 13 }} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                          <button onClick={() => addService.mutate()} className="btn-primary" style={{ height: 34, padding: '0 14px' }}><Check size={13} /></button>
                          <button onClick={() => setAddingService(null)} className="btn-ghost" style={{ height: 34, padding: '0 10px' }}>✕</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Services list */}
                  {services.filter(s => s.courier_id === courier.id).map(svc => (
                    <div key={svc.id} onClick={() => setSelectedService(svc.id)} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <span style={{ flex: 1, fontSize: 14, color: '#fff' }}>{svc.name}</span>
                      <span style={{ ...pill, background: 'rgba(0,200,83,0.08)', color: '#00C853', marginRight: 12, fontFamily: 'monospace' }}>{svc.service_code}</span>
                      {svc.fuel_surcharge_pct && <span style={{ ...pill, background: 'rgba(255,193,7,0.1)', color: '#FFC107', marginRight: 12 }}>Fuel {parseFloat(svc.fuel_surcharge_pct).toFixed(1)}%</span>}
                      <span style={{ fontSize: 12, color: '#AAAAAA', marginRight: 12 }}>{svc.zone_count} zone{svc.zone_count !== 1 ? 's' : ''}</span>
                      <ChevronRight size={14} color="#AAAAAA" />
                    </div>
                  ))}
                </div>
              ))
          }
        </div>
      )}

      {/* ── Tab 1: Rules Engine ── */}
      {tab === 1 && <RulesEngine services={services} />}
    </div>
  );
}
