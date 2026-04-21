/**
 * Carrier Management — 3-level hierarchy
 *
 * Level 1: Carrier grid (contacts at a glance, editable)
 * Level 2: Carrier detail — services list for that carrier
 * Level 3: Service detail — zones, weight bands, surcharges, dim weight
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, ChevronRight, Trash2, X, Check, Phone, Mail,
  User, Building2, Edit2, Zap, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { carriersApi } from '../../api/carriers';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Tiny style helpers ───────────────────────────────────────────────────────

const pill = (bg, text) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 9999,
  fontSize: 11, fontWeight: 700, background: bg, color: text,
});

const CARRIER_COLORS = {
  DPD:    '#E91E8C', UPS:  '#FFC107', DHL:    '#FFC107',
  EvRi:   '#7B2FBE', PC:   '#00BCD4', AGL:    '#00C853',
  YODC2C: '#00C853', PPI:  '#AAAAAA',
};

function carrierColor(code) {
  return CARRIER_COLORS[code] || '#7B2FBE';
}

function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{ background:'rgba(233,30,140,0.08)', border:'1px solid rgba(233,30,140,0.3)', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
      <AlertTriangle size={14} color="#E91E8C" />
      <span style={{ fontSize:13, color:'#fff', flex:1 }}>{message}</span>
      <button onClick={onCancel} style={{ background:'none', border:'none', color:'#AAAAAA', cursor:'pointer', fontSize:12 }}>Cancel</button>
      <button onClick={onConfirm} style={{ background:'#E91E8C', border:'none', borderRadius:6, color:'#fff', padding:'4px 12px', fontSize:12, cursor:'pointer', fontWeight:700 }}>Delete</button>
    </div>
  );
}

// ─── Contact row ─────────────────────────────────────────────────────────────

function ContactRow({ contact, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...contact });
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: () => api.patch(`/carriers/couriers/contacts/${contact.id}`, form).then(r => r.data),
    onSuccess: () => { setEditing(false); onUpdate(); },
  });
  const del = useMutation({
    mutationFn: () => api.delete(`/carriers/couriers/contacts/${contact.id}`).then(r => r.data),
    onSuccess: onDelete,
  });

  if (editing) {
    return (
      <div style={{ background:'rgba(0,200,83,0.05)', border:'1px solid rgba(0,200,83,0.2)', borderRadius:8, padding:12, marginBottom:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
          {[['Name','name'],['Phone','phone'],['Email','email'],['Department','department'],['Role','role']].map(([ph,k]) => (
            <div key={k} className="pill-input-wrap" style={{ height:32 }}>
              <input value={form[k]||''} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={{ fontSize:12 }} />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => save.mutate()} className="btn-primary" style={{ height:28, padding:'0 12px', fontSize:12 }}><Check size={11}/> Save</button>
          <button onClick={() => setEditing(false)} className="btn-ghost" style={{ height:28, padding:'0 10px', fontSize:12 }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{contact.name}</div>
        <div style={{ fontSize:12, color:'#AAAAAA', marginTop:2 }}>
          {[contact.department, contact.role].filter(Boolean).join(' · ')}
        </div>
      </div>
      {contact.phone && <a href={`tel:${contact.phone}`} style={{ fontSize:12, color:'#00BCD4', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}><Phone size={11}/>{contact.phone}</a>}
      {contact.email && <a href={`mailto:${contact.email}`} style={{ fontSize:12, color:'#00C853', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}><Mail size={11}/>{contact.email}</a>}
      <button onClick={() => setEditing(true)} style={{ background:'none', border:'none', color:'#AAAAAA', cursor:'pointer' }}><Edit2 size={12}/></button>
      <button onClick={() => del.mutate()} style={{ background:'none', border:'none', color:'#555', cursor:'pointer' }}><Trash2 size={12}/></button>
    </div>
  );
}

// ─── LEVEL 1 — Carrier card ───────────────────────────────────────────────────

function CarrierCard({ carrier, onDrill, onRefresh }) {
  const [editContact, setEditContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    primary_contact_name:  carrier.primary_contact_name  || '',
    primary_contact_phone: carrier.primary_contact_phone || '',
    primary_contact_email: carrier.primary_contact_email || '',
    account_number:        carrier.account_number        || '',
    notes:                 carrier.notes                 || '',
  });
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name:'', phone:'', email:'', department:'', role:'' });
  const [showContacts, setShowContacts] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const color = carrierColor(carrier.code);

  const savePrimary = useMutation({
    mutationFn: () => api.patch(`/carriers/couriers/${carrier.id}`, contactForm).then(r => r.data),
    onSuccess: () => { setEditContact(false); onRefresh(); },
  });

  const addContact = useMutation({
    mutationFn: () => api.post(`/carriers/couriers/${carrier.id}/contacts`, newContact).then(r => r.data),
    onSuccess: () => { setAddingContact(false); setNewContact({ name:'', phone:'', email:'', department:'', role:'' }); onRefresh(); },
  });

  const delCarrier = useMutation({
    mutationFn: () => carriersApi.deleteCourier(carrier.id),
    onSuccess: onRefresh,
  });

  const additional = carrier.additional_contacts || [];

  return (
    <div className="moov-card" style={{ overflow:'hidden', marginBottom:0 }}>
      {/* Header strip */}
      <div style={{ background:`linear-gradient(135deg, ${color}18, transparent)`, borderBottom:`1px solid ${color}30`, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
        {/* Carrier badge */}
        <div style={{ width:46, height:46, borderRadius:10, background:`${color}22`, border:`2px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color, letterSpacing:'0.03em', flexShrink:0 }}>
          {carrier.code.slice(0,4)}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{carrier.name}</div>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <span style={pill(`${color}18`, color)}>{carrier.code}</span>
            <span style={pill('rgba(255,255,255,0.06)','#AAAAAA')}>{carrier.service_count} service{carrier.service_count!==1?'s':''}</span>
            {carrier.account_number && <span style={pill('rgba(0,188,212,0.12)','#00BCD4')}>Acct: {carrier.account_number}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => onDrill(carrier.id)} className="btn-primary" style={{ height:32, padding:'0 14px', fontSize:12 }}>
            Rate Cards <ChevronRight size={12}/>
          </button>
          <button onClick={() => setEditContact(e=>!e)} className="btn-ghost" style={{ height:32, padding:'0 12px', fontSize:12 }}>
            <Edit2 size={12}/> Edit
          </button>
          <button onClick={() => setConfirmDel(true)} style={{ background:'none', border:'none', color:'#555', cursor:'pointer' }}><Trash2 size={14}/></button>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDel && (
        <div style={{ padding:'10px 20px' }}>
          <Confirm message={`Delete ${carrier.name}? This removes all services and rate cards.`} onConfirm={() => delCarrier.mutate()} onCancel={() => setConfirmDel(false)} />
        </div>
      )}

      {/* Primary contact — view */}
      {!editContact && (
        <div style={{ padding:'12px 20px', display:'flex', flexWrap:'wrap', gap:20, alignItems:'center' }}>
          {carrier.primary_contact_name ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <User size={13} color="#AAAAAA"/>
                <span style={{ fontSize:13, color:'#fff', fontWeight:600 }}>{carrier.primary_contact_name}</span>
              </div>
              {carrier.primary_contact_phone && (
                <a href={`tel:${carrier.primary_contact_phone}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#00BCD4', textDecoration:'none' }}>
                  <Phone size={12}/>{carrier.primary_contact_phone}
                </a>
              )}
              {carrier.primary_contact_email && (
                <a href={`mailto:${carrier.primary_contact_email}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#00C853', textDecoration:'none' }}>
                  <Mail size={12}/>{carrier.primary_contact_email}
                </a>
              )}
            </>
          ) : (
            <span style={{ fontSize:13, color:'#555', fontStyle:'italic' }}>No primary contact — click Edit to add one</span>
          )}

          {additional.length > 0 && (
            <button onClick={() => setShowContacts(s=>!s)} style={{ background:'none', border:'none', color:'#7B2FBE', cursor:'pointer', fontSize:12, marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
              <Building2 size={12}/> {additional.length} additional contact{additional.length!==1?'s':''}
              <ChevronRight size={11} style={{ transform: showContacts ? 'rotate(90deg)':'none', transition:'0.15s' }}/>
            </button>
          )}
          {additional.length === 0 && (
            <button onClick={() => setAddingContact(true)} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:12, marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={11}/> Add contact
            </button>
          )}
        </div>
      )}

      {/* Primary contact — edit form */}
      {editContact && (
        <div style={{ padding:'14px 20px', background:'rgba(0,200,83,0.04)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
            {[
              ['Contact Name','primary_contact_name'],
              ['Phone','primary_contact_phone'],
              ['Email','primary_contact_email'],
              ['Account Number','account_number'],
            ].map(([ph,k]) => (
              <div key={k}>
                <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:3 }}>{ph}</label>
                <div className="pill-input-wrap" style={{ height:32 }}>
                  <input value={contactForm[k]} onChange={e => setContactForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={{ fontSize:12 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:3 }}>Notes</label>
            <div className="pill-input-wrap" style={{ height:32 }}>
              <input value={contactForm.notes} onChange={e => setContactForm(f=>({...f,notes:e.target.value}))} placeholder="Any notes…" style={{ fontSize:12 }} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => savePrimary.mutate()} className="btn-primary" style={{ height:30, padding:'0 14px', fontSize:12 }}><Check size={11}/> Save</button>
            <button onClick={() => setEditContact(false)} className="btn-ghost" style={{ height:30, padding:'0 10px', fontSize:12 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Additional contacts */}
      {showContacts && additional.length > 0 && (
        <div style={{ padding:'0 20px 12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0 6px' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.05em' }}>Additional Contacts</span>
            <button onClick={() => setAddingContact(a=>!a)} style={{ background:'none', border:'none', color:'#00C853', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={11}/> Add
            </button>
          </div>
          {additional.map(c => (
            <ContactRow key={c.id} contact={c} onDelete={onRefresh} onUpdate={onRefresh} />
          ))}
        </div>
      )}

      {/* Add contact form */}
      {addingContact && (
        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,200,83,0.04)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:8, marginBottom:8 }}>
            {[['Name*','name'],['Phone','phone'],['Email','email'],['Department','department'],['Role','role']].map(([ph,k]) => (
              <div key={k} className="pill-input-wrap" style={{ height:30 }}>
                <input value={newContact[k]} onChange={e => setNewContact(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={{ fontSize:12 }} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => addContact.mutate()} className="btn-primary" style={{ height:28, padding:'0 12px', fontSize:12 }}><Check size={11}/> Add</button>
            <button onClick={() => setAddingContact(false)} className="btn-ghost" style={{ height:28, padding:'0 10px', fontSize:12 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEVEL 2 — Carrier detail (services list) ─────────────────────────────────

function CarrierDetail({ carrierId, onBack, onDrillService }) {
  const [addingService, setAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ service_code:'', name:'', fuel_surcharge_pct:'' });

  const { data: carrier, isLoading, refetch } = useQuery({
    queryKey: ['carrier-detail', carrierId],
    queryFn: () => api.get(`/carriers/couriers/${carrierId}`).then(r => r.data),
  });

  const addService = useMutation({
    mutationFn: () => carriersApi.createService({ ...serviceForm, courier_id: carrierId }),
    onSuccess: () => { setAddingService(false); setServiceForm({ service_code:'', name:'', fuel_surcharge_pct:'' }); refetch(); },
  });

  const delService = useMutation({
    mutationFn: (id) => carriersApi.deleteService(id),
    onSuccess: refetch,
  });

  if (isLoading) return <div style={{ padding:40, textAlign:'center', color:'#AAAAAA' }}>Loading…</div>;
  if (!carrier) return null;

  const color = carrierColor(carrier.code);

  return (
    <div>
      {/* Back + header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding:'6px 14px', fontSize:13 }}>
          <ArrowLeft size={13}/> All Carriers
        </button>
        <div style={{ width:40, height:40, borderRadius:10, background:`${color}22`, border:`2px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color }}>
          {carrier.code.slice(0,4)}
        </div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', margin:0 }}>{carrier.name}</h1>
          <div style={{ display:'flex', gap:10, marginTop:4, fontSize:12, color:'#AAAAAA' }}>
            {carrier.account_number && <span>Acct: {carrier.account_number}</span>}
            {carrier.primary_contact_name && <><span>·</span><span>{carrier.primary_contact_name}</span></>}
            {carrier.primary_contact_phone && <><span>·</span><a href={`tel:${carrier.primary_contact_phone}`} style={{ color:'#00BCD4', textDecoration:'none' }}>{carrier.primary_contact_phone}</a></>}
            {carrier.primary_contact_email && <><span>·</span><a href={`mailto:${carrier.primary_contact_email}`} style={{ color:'#00C853', textDecoration:'none' }}>{carrier.primary_contact_email}</a></>}
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:'#7B2FBE', margin:0 }}>Services & Rate Cards</h2>
        <button onClick={() => setAddingService(a=>!a)} className="btn-primary"><Plus size={13}/> Add Service</button>
      </div>

      {addingService && (
        <div className="moov-card" style={{ padding:18, marginBottom:16, border:'1px solid rgba(0,200,83,0.3)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr auto', gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Service Code</label>
              <div className="pill-input-wrap" style={{ height:34 }}>
                <input value={serviceForm.service_code} onChange={e => setServiceForm(f=>({...f,service_code:e.target.value}))} placeholder="DPD-12" style={{ fontSize:13 }}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Service Name</label>
              <div className="pill-input-wrap" style={{ height:34 }}>
                <input value={serviceForm.name} onChange={e => setServiceForm(f=>({...f,name:e.target.value}))} placeholder="DPD Next Day" style={{ fontSize:13 }}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Fuel Surcharge %</label>
              <div className="pill-input-wrap" style={{ height:34 }}>
                <input type="number" step="0.01" value={serviceForm.fuel_surcharge_pct} onChange={e => setServiceForm(f=>({...f,fuel_surcharge_pct:e.target.value}))} placeholder="5.00" style={{ fontSize:13 }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'flex-end' }}>
              <button onClick={() => addService.mutate()} className="btn-primary" style={{ height:34 }}><Check size={13}/></button>
              <button onClick={() => setAddingService(false)} className="btn-ghost" style={{ height:34, padding:'0 10px' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="moov-card" style={{ overflow:'hidden' }}>
        {(!carrier.services || carrier.services.length === 0) ? (
          <div style={{ padding:40, textAlign:'center', color:'#555', fontSize:13 }}>No services yet — add one above</div>
        ) : (
          <table className="moov-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Code</th>
                <th>Zones</th>
                <th>Fuel Surcharge</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrier.services.map(svc => (
                <tr key={svc.id} onClick={() => onDrillService(svc.id)} style={{ cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  <td style={{ fontWeight:600 }}>{svc.name}</td>
                  <td><span style={{ ...pill('rgba(0,200,83,0.08)','#00C853'), fontFamily:'monospace' }}>{svc.service_code}</span></td>
                  <td style={{ color:'#AAAAAA' }}>{svc.zone_count} zone{svc.zone_count!==1?'s':''}</td>
                  <td>{svc.fuel_surcharge_pct
                    ? <span style={pill('rgba(255,193,7,0.12)','#FFC107')}>{parseFloat(svc.fuel_surcharge_pct).toFixed(2)}%</span>
                    : <span style={{ color:'#555' }}>—</span>}
                  </td>
                  <td style={{ textAlign:'right', display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end' }}>
                    <span style={{ fontSize:12, color:'#AAAAAA' }}>View rate card</span>
                    <ChevronRight size={14} color="#AAAAAA"/>
                    <button onClick={e => { e.stopPropagation(); delService.mutate(svc.id); }}
                      style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:0 }}>
                      <Trash2 size={13}/>
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

// ─── LEVEL 3 — Service rate card detail ──────────────────────────────────────
// (reused from before — zones, weight bands, congestion, dim weight)

function WeightBandsTable({ zoneId, bands, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ min_weight_kg:'', max_weight_kg:'', price_first:'', price_sub:'' });
  const [confirmId, setConfirmId] = useState(null);

  const addBand = useMutation({
    mutationFn: () => carriersApi.createWeightBand({ ...form, zone_id: zoneId }),
    onSuccess: () => { setAdding(false); setForm({ min_weight_kg:'', max_weight_kg:'', price_first:'', price_sub:'' }); onRefresh(); },
  });
  const delBand = useMutation({
    mutationFn: (id) => carriersApi.deleteWeightBand(id),
    onSuccess: () => { setConfirmId(null); onRefresh(); },
  });

  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.05em' }}>Cost Price Bands</span>
        <button onClick={() => setAdding(a=>!a)} style={{ background:'none', border:'none', color:'#00C853', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
          <Plus size={12}/> Add Band
        </button>
      </div>
      {adding && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:8, marginBottom:10 }}>
          {[['Min kg','min_weight_kg'],['Max kg','max_weight_kg'],['Cost 1st £','price_first'],['Cost Sub £','price_sub']].map(([ph,key]) => (
            <div key={key} className="pill-input-wrap" style={{ height:32 }}>
              <input type="number" step="0.001" placeholder={ph} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} style={{ fontSize:12 }}/>
            </div>
          ))}
          <button onClick={() => addBand.mutate()} className="btn-primary" style={{ height:32 }}><Check size={12}/></button>
        </div>
      )}
      {confirmId && <div style={{ marginBottom:8 }}><Confirm message="Delete weight band?" onConfirm={() => delBand.mutate(confirmId)} onCancel={() => setConfirmId(null)}/></div>}
      <table className="moov-table" style={{ fontSize:12 }}>
        <thead><tr><th>Min kg</th><th>Max kg</th><th>Cost 1st</th><th>Cost Sub</th><th></th></tr></thead>
        <tbody>
          {bands.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', color:'#555' }}>No bands</td></tr>}
          {bands.map(b => (
            <tr key={b.id}>
              <td>{parseFloat(b.min_weight_kg).toFixed(3)}</td>
              <td>{parseFloat(b.max_weight_kg).toFixed(3)}</td>
              <td style={{ color:'#00C853' }}>£{parseFloat(b.price_first).toFixed(4)}</td>
              <td style={{ color:'#FFC107' }}>{b.price_sub ? `£${parseFloat(b.price_sub).toFixed(4)}` : <span style={{ color:'#555' }}>—</span>}</td>
              <td style={{ textAlign:'right' }}>
                <button onClick={() => setConfirmId(b.id)} style={{ background:'none', border:'none', color:'#555', cursor:'pointer' }}><Trash2 size={11}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ZoneCard({ zone, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [countryInput, setCountryInput] = useState('');
  const [postcodeInput, setPostcodeInput] = useState('');
  const [postcodeType, setPostcodeType] = useState('include');

  const delZone     = useMutation({ mutationFn: () => carriersApi.deleteZone(zone.id), onSuccess: onRefresh });
  const addCountry  = useMutation({ mutationFn: () => carriersApi.addCountry(zone.id, { country_iso: countryInput.toUpperCase() }), onSuccess: () => { setCountryInput(''); onRefresh(); }});
  const delCountry  = useMutation({ mutationFn: (id) => carriersApi.removeCountry(id), onSuccess: onRefresh });
  const addPostcode = useMutation({ mutationFn: () => carriersApi.addPostcodeRule(zone.id, { postcode_prefix: postcodeInput.toUpperCase(), rule_type: postcodeType }), onSuccess: () => { setPostcodeInput(''); onRefresh(); }});
  const delPostcode = useMutation({ mutationFn: (id) => carriersApi.removePostcodeRule(id), onSuccess: onRefresh });

  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, marginBottom:8 }}>
      <div onClick={() => setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', padding:'10px 14px', cursor:'pointer', userSelect:'none' }}>
        <ChevronRight size={13} style={{ marginRight:8, transform: open?'rotate(90deg)':'none', transition:'0.15s', color:'#00C853' }}/>
        <span style={{ fontWeight:600, color:'#fff', flex:1, fontSize:13 }}>{zone.name}</span>
        <span style={{ fontSize:11, color:'#AAAAAA', marginRight:10 }}>
          {(zone.country_codes||[]).length} countries · {(zone.weight_bands||[]).length} bands
        </span>
        <button onClick={e => { e.stopPropagation(); setConfirmDel(true); }} style={{ background:'none', border:'none', color:'#555', cursor:'pointer' }}><Trash2 size={12}/></button>
      </div>
      {confirmDel && <div style={{ padding:'0 14px 10px' }}><Confirm message={`Delete zone "${zone.name}"?`} onConfirm={() => delZone.mutate()} onCancel={() => setConfirmDel(false)}/></div>}
      {open && (
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {/* Country codes */}
          <div style={{ marginTop:12, marginBottom:10 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.05em' }}>Country Codes</span>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
              {(zone.country_codes||[]).map(cc => (
                <span key={cc.id} style={{ ...pill('rgba(0,200,83,0.1)','#00C853'), display:'inline-flex', alignItems:'center', gap:4, fontSize:11 }}>
                  {cc.country_iso}
                  <button onClick={() => delCountry.mutate(cc.id)} style={{ background:'none', border:'none', color:'#00C853', cursor:'pointer', padding:0 }}><X size={9}/></button>
                </span>
              ))}
              <div style={{ display:'flex', gap:6 }}>
                <div className="pill-input-wrap" style={{ height:26, width:70 }}>
                  <input value={countryInput} onChange={e => setCountryInput(e.target.value)} placeholder="GB" maxLength={3} style={{ fontSize:11 }}/>
                </div>
                <button onClick={() => addCountry.mutate()} className="btn-primary" style={{ height:26, padding:'0 8px', fontSize:11 }}>Add</button>
              </div>
            </div>
          </div>
          {/* Postcode rules */}
          <div style={{ marginBottom:12 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.05em' }}>Postcode Rules</span>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
              {(zone.postcode_rules||[]).map(pr => (
                <span key={pr.id} style={{ ...pill(pr.rule_type==='include'?'rgba(0,188,212,0.12)':'rgba(233,30,140,0.12)', pr.rule_type==='include'?'#00BCD4':'#E91E8C'), display:'inline-flex', alignItems:'center', gap:4, fontSize:11 }}>
                  {pr.rule_type==='include'?'✓':'✗'} {pr.postcode_prefix}
                  <button onClick={() => delPostcode.mutate(pr.id)} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', padding:0 }}><X size={9}/></button>
                </span>
              ))}
              <div style={{ display:'flex', gap:6 }}>
                <div className="pill-input-wrap" style={{ height:26, width:70 }}>
                  <input value={postcodeInput} onChange={e => setPostcodeInput(e.target.value)} placeholder="BT" style={{ fontSize:11 }}/>
                </div>
                <div className="pill-input-wrap" style={{ height:26, width:90 }}>
                  <select value={postcodeType} onChange={e => setPostcodeType(e.target.value)} style={{ fontSize:11, paddingLeft:8 }}>
                    <option value="include">Include</option>
                    <option value="exclude">Exclude</option>
                  </select>
                </div>
                <button onClick={() => addPostcode.mutate()} className="btn-primary" style={{ height:26, padding:'0 8px', fontSize:11 }}>Add</button>
              </div>
            </div>
          </div>
          <WeightBandsTable zoneId={zone.id} bands={zone.weight_bands||[]} onRefresh={onRefresh}/>
        </div>
      )}
    </div>
  );
}

function ServiceDetail({ serviceId, carrierName, onBack }) {
  const [addingZone, setAddingZone] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [fuelPct, setFuelPct] = useState('');
  const [editFuel, setEditFuel] = useState(false);

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
    onSuccess: () => { setEditFuel(false); refetch(); },
  });

  if (isLoading) return <div style={{ padding:40, textAlign:'center', color:'#AAAAAA' }}>Loading…</div>;
  if (!svc) return null;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding:'6px 14px', fontSize:13 }}>
          <ArrowLeft size={13}/> {carrierName}
        </button>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#7B2FBE', margin:0 }}>{svc.name}</h1>
          <span style={{ fontSize:13, color:'#AAAAAA' }}>{svc.courier_name} · <span style={{ fontFamily:'monospace', color:'#00C853' }}>{svc.service_code}</span></span>
        </div>
      </div>

      {/* Fuel surcharge */}
      <div className="moov-card" style={{ padding:'14px 20px', marginBottom:14, display:'flex', alignItems:'center', gap:16 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'#fff', flex:1 }}>Fuel Surcharge</span>
        {editFuel ? (
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div className="pill-input-wrap" style={{ height:32, width:110 }}>
              <input type="number" step="0.01" value={fuelPct} onChange={e => setFuelPct(e.target.value)} placeholder="5.00" style={{ fontSize:13 }}/>
              <div className="green-cap" style={{ fontSize:12 }}>%</div>
            </div>
            <button onClick={() => updateFuel.mutate(fuelPct)} className="btn-primary" style={{ height:32, padding:'0 14px', fontSize:12 }}>Save</button>
            <button onClick={() => setEditFuel(false)} className="btn-ghost" style={{ height:32, padding:'0 10px', fontSize:12 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:15, fontWeight:700, color: svc.fuel_surcharge_pct ? '#FFC107':'#555' }}>
              {svc.fuel_surcharge_pct ? `${parseFloat(svc.fuel_surcharge_pct).toFixed(2)}%` : 'Not set'}
            </span>
            <button onClick={() => { setFuelPct(svc.fuel_surcharge_pct||''); setEditFuel(true); }} className="btn-ghost" style={{ height:28, padding:'0 12px', fontSize:12 }}>Edit</button>
          </div>
        )}
      </div>

      {/* Zones */}
      <div className="moov-card" style={{ padding:18, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Zones & Weight Bands</h3>
          <button onClick={() => setAddingZone(a=>!a)} className="btn-primary" style={{ height:30, padding:'0 12px', fontSize:12 }}><Plus size={12}/> Add Zone</button>
        </div>
        {addingZone && (
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <div className="pill-input-wrap" style={{ flex:1, height:34 }}>
              <input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="Zone name — e.g. Mainland, Northern Ireland"/>
            </div>
            <button onClick={() => addZone.mutate()} className="btn-primary" style={{ height:34 }}><Check size={13}/> Add</button>
            <button onClick={() => setAddingZone(false)} className="btn-ghost" style={{ height:34 }}>Cancel</button>
          </div>
        )}
        {(svc.zones||[]).length === 0
          ? <p style={{ color:'#555', fontSize:13, margin:0 }}>No zones yet. Add one above.</p>
          : (svc.zones||[]).map(z => <ZoneCard key={z.id} zone={z} onRefresh={refetch}/>)
        }
      </div>

      {/* Congestion surcharges */}
      <div className="moov-card" style={{ padding:18, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Congestion Surcharges</h3>
        </div>
        {(svc.congestion_surcharges||[]).length === 0
          ? <p style={{ color:'#555', fontSize:13, margin:0 }}>No congestion surcharges.</p>
          : <table className="moov-table" style={{ fontSize:12 }}>
              <thead><tr><th>Postcode</th><th>Fee</th></tr></thead>
              <tbody>{(svc.congestion_surcharges||[]).map(cs => (
                <tr key={cs.id}><td><span style={pill('rgba(255,193,7,0.12)','#FFC107')}>{cs.postcode_prefix}</span></td><td style={{ color:'#E91E8C' }}>£{parseFloat(cs.fee).toFixed(4)}</td></tr>
              ))}</tbody>
            </table>
        }
      </div>
    </div>
  );
}

// ─── ROOT — main page ─────────────────────────────────────────────────────────

const TABS = ['Carriers & Contacts', 'Rules Engine'];
const OPERATORS = ['equals','not_equals','greater_than','less_than','greater_than_or_equal','less_than_or_equal','in','not_in','starts_with','contains'];
const CHARGE_METHOD_LABELS = { fixed:'Fixed £', percentage:'Percentage %', per_kg:'Per kg', per_parcel:'Per parcel' };

function RulesEngine({ services }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:'', courier_service_id:'', charge_method:'fixed', charge_value:'', is_active:true });
  const [expandedRule, setExpandedRule] = useState(null);
  const [condForm, setCondForm] = useState({ logic_operator:'AND', json_field_path:'', operator:'equals', value:'' });

  const { data: rules = [], refetch } = useQuery({ queryKey:['carrier-rules'], queryFn: carriersApi.getRules });
  const addRule     = useMutation({ mutationFn: () => carriersApi.createRule({ ...form, courier_service_id: form.courier_service_id||null }), onSuccess: () => { setAdding(false); refetch(); }});
  const toggleRule  = useMutation({ mutationFn: ({id,is_active}) => carriersApi.updateRule(id,{is_active}), onSuccess: refetch });
  const delRule     = useMutation({ mutationFn: (id) => carriersApi.deleteRule(id), onSuccess: refetch });
  const addCond     = useMutation({ mutationFn: (ruleId) => carriersApi.addCondition(ruleId, condForm), onSuccess: () => { setCondForm({ logic_operator:'AND', json_field_path:'', operator:'equals', value:'' }); refetch(); }});
  const delCond     = useMutation({ mutationFn: (id) => carriersApi.removeCondition(id), onSuccess: refetch });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#7B2FBE', margin:0 }}>Rules Engine</h2>
          <p style={{ fontSize:13, color:'#AAAAAA', marginTop:4 }}>Custom charge rules triggered by conditions on any shipment field</p>
        </div>
        <button onClick={() => setAdding(a=>!a)} className="btn-primary"><Plus size={13}/> Add Rule</button>
      </div>
      {adding && (
        <div className="moov-card" style={{ padding:18, marginBottom:14, border:'1px solid rgba(0,200,83,0.3)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            {[['Rule Name','name','text','EU Demand Surcharge'],['Value','charge_value','number','5.00']].map(([l,k,t,ph]) => (
              <div key={k}>
                <label style={{ fontSize:12, color:'#AAAAAA', display:'block', marginBottom:4 }}>{l}</label>
                <div className="pill-input-wrap"><input type={t} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}/></div>
              </div>
            ))}
            <div>
              <label style={{ fontSize:12, color:'#AAAAAA', display:'block', marginBottom:4 }}>Service (opt)</label>
              <div className="pill-input-wrap">
                <select value={form.courier_service_id} onChange={e => setForm(f=>({...f,courier_service_id:e.target.value}))} style={{ paddingLeft:14 }}>
                  <option value="">All services</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select><div className="green-cap">▾</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#AAAAAA', display:'block', marginBottom:4 }}>Charge Method</label>
              <div className="pill-input-wrap">
                <select value={form.charge_method} onChange={e => setForm(f=>({...f,charge_method:e.target.value}))} style={{ paddingLeft:14 }}>
                  {Object.entries(CHARGE_METHOD_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select><div className="green-cap">▾</div>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => addRule.mutate()} className="btn-primary"><Check size={13}/> Create Rule</button>
            <button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}
      {rules.length === 0
        ? <div className="moov-card" style={{ padding:32, textAlign:'center', color:'#555' }}>No rules configured yet</div>
        : rules.map(rule => (
          <div key={rule.id} className="moov-card" style={{ marginBottom:10, border:`1px solid ${rule.is_active?'rgba(0,200,83,0.15)':'rgba(255,255,255,0.06)'}`, opacity:rule.is_active?1:0.6 }}>
            <div style={{ display:'flex', alignItems:'center', padding:'13px 16px', cursor:'pointer' }} onClick={() => setExpandedRule(expandedRule===rule.id?null:rule.id)}>
              <Zap size={13} color={rule.is_active?'#00C853':'#555'} style={{ marginRight:10 }}/>
              <span style={{ fontWeight:700, color:'#fff', flex:1 }}>{rule.name}</span>
              {rule.service_name && <span style={{ ...pill('rgba(123,47,190,0.15)','#7B2FBE'), marginRight:10 }}>{rule.service_name}</span>}
              <span style={{ ...pill('rgba(255,193,7,0.12)','#FFC107'), marginRight:10 }}>{CHARGE_METHOD_LABELS[rule.charge_method]} {parseFloat(rule.charge_value).toFixed(2)}</span>
              <button onClick={e => { e.stopPropagation(); toggleRule.mutate({id:rule.id,is_active:!rule.is_active}); }} className="btn-ghost" style={{ height:26, padding:'0 10px', fontSize:11, marginRight:8 }}>{rule.is_active?'Disable':'Enable'}</button>
              <button onClick={e => { e.stopPropagation(); delRule.mutate(rule.id); }} style={{ background:'none', border:'none', color:'#555', cursor:'pointer' }}><Trash2 size={13}/></button>
            </div>
            {expandedRule === rule.id && (
              <div style={{ padding:'0 16px 14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize:12, color:'#AAAAAA', margin:'10px 0 8px' }}>CONDITIONS</p>
                {(rule.conditions||[]).map((c,idx) => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, fontSize:12 }}>
                    {idx>0 && <span style={{ ...pill('rgba(255,255,255,0.05)','#AAAAAA'), minWidth:32, textAlign:'center' }}>{c.logic_operator}</span>}
                    <span style={{ color:'#00BCD4', fontFamily:'monospace' }}>{c.json_field_path}</span>
                    <span style={pill('rgba(123,47,190,0.12)','#7B2FBE')}>{c.operator}</span>
                    <span style={{ color:'#FFC107', fontFamily:'monospace' }}>{c.value}</span>
                    <button onClick={() => delCond.mutate(c.id)} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', marginLeft:'auto' }}><X size={11}/></button>
                  </div>
                ))}
                <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 160px 1fr auto', gap:8, marginTop:12 }}>
                  <div className="pill-input-wrap" style={{ height:30 }}>
                    <select value={condForm.logic_operator} onChange={e => setCondForm(f=>({...f,logic_operator:e.target.value}))} style={{ fontSize:12, paddingLeft:8 }}>
                      <option>AND</option><option>OR</option>
                    </select>
                  </div>
                  <div className="pill-input-wrap" style={{ height:30 }}><input value={condForm.json_field_path} onChange={e => setCondForm(f=>({...f,json_field_path:e.target.value}))} placeholder="ship_to.country_iso" style={{ fontSize:12 }}/></div>
                  <div className="pill-input-wrap" style={{ height:30 }}>
                    <select value={condForm.operator} onChange={e => setCondForm(f=>({...f,operator:e.target.value}))} style={{ fontSize:12, paddingLeft:8 }}>
                      {OPERATORS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="pill-input-wrap" style={{ height:30 }}><input value={condForm.value} onChange={e => setCondForm(f=>({...f,value:e.target.value}))} placeholder="GB,FR,DE" style={{ fontSize:12 }}/></div>
                  <button onClick={() => addCond.mutate(rule.id)} className="btn-primary" style={{ height:30, padding:'0 12px' }}><Check size={12}/></button>
                </div>
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

export default function CarrierManagement() {
  const [tab, setTab]                 = useState(0);
  const [selectedCarrier, setSelectedCarrier] = useState(null); // carrier id
  const [selectedService, setSelectedService] = useState(null); // service id
  const [addingCourier, setAddingCourier]     = useState(false);
  const [courierForm, setCourierForm]         = useState({ code:'', name:'' });

  const { data: couriers = [], isLoading, refetch } = useQuery({
    queryKey: ['couriers'],
    queryFn: carriersApi.getCouriers,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['carrier-services-all'],
    queryFn: () => carriersApi.getServices(),
  });

  // Store carrier name for breadcrumb when drilling into service
  const selectedCarrierData = couriers.find(c => c.id === selectedCarrier);

  const addCourier = useMutation({
    mutationFn: () => carriersApi.createCourier(courierForm),
    onSuccess: () => { setAddingCourier(false); setCourierForm({ code:'', name:'' }); refetch(); },
  });

  // ── Drill: service detail (level 3)
  if (selectedService) {
    return (
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <ServiceDetail
          serviceId={selectedService}
          carrierName={selectedCarrierData?.name || 'Carrier'}
          onBack={() => setSelectedService(null)}
        />
      </div>
    );
  }

  // ── Drill: carrier services (level 2)
  if (selectedCarrier) {
    return (
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <CarrierDetail
          carrierId={selectedCarrier}
          onBack={() => setSelectedCarrier(null)}
          onDrillService={(id) => setSelectedService(id)}
        />
      </div>
    );
  }

  // ── Level 1: carrier grid + tabs
  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#00C853', margin:0 }}>Carrier Management</h1>
          <p style={{ fontSize:13, color:'#AAAAAA', marginTop:4 }}>Contacts, rate cards, zones, weight bands and pricing rules</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background:'none', border:'none', cursor:'pointer',
            padding:'10px 18px', fontSize:14, fontWeight:600,
            color: tab===i ? '#00C853':'#AAAAAA',
            borderBottom: tab===i ? '2px solid #00C853':'2px solid transparent',
            marginBottom:-1, transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button onClick={() => setAddingCourier(a=>!a)} className="btn-primary"><Plus size={13}/> Add Carrier</button>
          </div>

          {addingCourier && (
            <div className="moov-card" style={{ padding:18, marginBottom:16, border:'1px solid rgba(0,200,83,0.3)' }}>
              <h4 style={{ color:'#7B2FBE', marginBottom:14, margin:'0 0 14px' }}>New Carrier</h4>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:12, color:'#AAAAAA', display:'block', marginBottom:4 }}>Carrier Code</label>
                  <div className="pill-input-wrap"><input value={courierForm.code} onChange={e => setCourierForm(f=>({...f,code:e.target.value}))} placeholder="DPD"/></div>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#AAAAAA', display:'block', marginBottom:4 }}>Display Name</label>
                  <div className="pill-input-wrap"><input value={courierForm.name} onChange={e => setCourierForm(f=>({...f,name:e.target.value}))} placeholder="DPD"/></div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => addCourier.mutate()} className="btn-primary"><Check size={13}/> Add Carrier</button>
                <button onClick={() => setAddingCourier(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {isLoading
            ? <div style={{ textAlign:'center', color:'#AAAAAA', padding:60 }}>Loading carriers…</div>
            : couriers.length === 0
              ? <div className="moov-card" style={{ padding:48, textAlign:'center', color:'#555' }}>No carriers yet. Add one above.</div>
              : <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
                  {couriers.map(carrier => (
                    <CarrierCard
                      key={carrier.id}
                      carrier={carrier}
                      onDrill={(id) => setSelectedCarrier(id)}
                      onRefresh={refetch}
                    />
                  ))}
                </div>
          }
        </div>
      )}

      {tab === 1 && <RulesEngine services={services}/>}
    </div>
  );
}
