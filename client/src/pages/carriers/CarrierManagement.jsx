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
  ChevronUp, ChevronDown,
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

  const reorder = useMutation({
    mutationFn: (ids) => api.put(`/carriers/couriers/${carrierId}/services/reorder`, { service_ids: ids }).then(r => r.data),
    onSuccess: refetch,
  });

  const moveService = (idx, dir) => {
    if (!carrier?.services) return;
    const ids = carrier.services.map(s => s.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    reorder.mutate(ids);
  };

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
                <th style={{ width:64 }}>Order</th>
                <th>Service</th>
                <th>Code</th>
                <th>Zones</th>
                <th>Fuel Surcharge</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrier.services.map((svc, idx) => (
                <tr key={svc.id} onClick={() => onDrillService(svc.id)} style={{ cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>

                  {/* ── Order controls ── */}
                  <td onClick={e => e.stopPropagation()} style={{ padding:'6px 8px' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:1, alignItems:'center' }}>
                      <button
                        onClick={() => moveService(idx, -1)}
                        disabled={idx === 0}
                        style={{
                          background:'none', border:'none', cursor: idx===0 ? 'default':'pointer',
                          color: idx===0 ? '#2A2A3A':'#7B2FBE', padding:'1px 4px', lineHeight:1,
                        }}>
                        <ChevronUp size={13}/>
                      </button>
                      <button
                        onClick={() => moveService(idx, 1)}
                        disabled={idx === carrier.services.length - 1}
                        style={{
                          background:'none', border:'none', cursor: idx===carrier.services.length-1 ? 'default':'pointer',
                          color: idx===carrier.services.length-1 ? '#2A2A3A':'#7B2FBE', padding:'1px 4px', lineHeight:1,
                        }}>
                        <ChevronDown size={13}/>
                      </button>
                    </div>
                  </td>

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

// ─── Country data ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  { iso:'AD', name:'Andorra' }, { iso:'AE', name:'United Arab Emirates' },
  { iso:'AF', name:'Afghanistan' }, { iso:'AG', name:'Antigua and Barbuda' },
  { iso:'AI', name:'Anguilla' }, { iso:'AL', name:'Albania' },
  { iso:'AM', name:'Armenia' }, { iso:'AO', name:'Angola' },
  { iso:'AR', name:'Argentina' }, { iso:'AS', name:'American Samoa' },
  { iso:'AT', name:'Austria' }, { iso:'AU', name:'Australia' },
  { iso:'AW', name:'Aruba' }, { iso:'AZ', name:'Azerbaijan' },
  { iso:'BA', name:'Bosnia and Herzegovina' }, { iso:'BB', name:'Barbados' },
  { iso:'BD', name:'Bangladesh' }, { iso:'BE', name:'Belgium' },
  { iso:'BF', name:'Burkina Faso' }, { iso:'BG', name:'Bulgaria' },
  { iso:'BH', name:'Bahrain' }, { iso:'BI', name:'Burundi' },
  { iso:'BJ', name:'Benin' }, { iso:'BM', name:'Bermuda' },
  { iso:'BN', name:'Brunei' }, { iso:'BO', name:'Bolivia' },
  { iso:'BR', name:'Brazil' }, { iso:'BS', name:'Bahamas' },
  { iso:'BT', name:'Bhutan' }, { iso:'BW', name:'Botswana' },
  { iso:'BY', name:'Belarus' }, { iso:'BZ', name:'Belize' },
  { iso:'CA', name:'Canada' }, { iso:'CD', name:'DR Congo' },
  { iso:'CF', name:'Central African Republic' }, { iso:'CG', name:'Republic of the Congo' },
  { iso:'CH', name:'Switzerland' }, { iso:'CI', name:"Côte d'Ivoire" },
  { iso:'CK', name:'Cook Islands' }, { iso:'CL', name:'Chile' },
  { iso:'CM', name:'Cameroon' }, { iso:'CN', name:'China' },
  { iso:'CO', name:'Colombia' }, { iso:'CR', name:'Costa Rica' },
  { iso:'CU', name:'Cuba' }, { iso:'CV', name:'Cape Verde' },
  { iso:'CW', name:'Curaçao' }, { iso:'CY', name:'Cyprus' },
  { iso:'CZ', name:'Czech Republic' }, { iso:'DE', name:'Germany' },
  { iso:'DJ', name:'Djibouti' }, { iso:'DK', name:'Denmark' },
  { iso:'DM', name:'Dominica' }, { iso:'DO', name:'Dominican Republic' },
  { iso:'DZ', name:'Algeria' }, { iso:'EC', name:'Ecuador' },
  { iso:'EE', name:'Estonia' }, { iso:'EG', name:'Egypt' },
  { iso:'ER', name:'Eritrea' }, { iso:'ES', name:'Spain' },
  { iso:'ET', name:'Ethiopia' }, { iso:'FI', name:'Finland' },
  { iso:'FJ', name:'Fiji' }, { iso:'FK', name:'Falkland Islands' },
  { iso:'FM', name:'Micronesia' }, { iso:'FO', name:'Faroe Islands' },
  { iso:'FR', name:'France' }, { iso:'GA', name:'Gabon' },
  { iso:'GB', name:'United Kingdom' }, { iso:'GD', name:'Grenada' },
  { iso:'GE', name:'Georgia' }, { iso:'GF', name:'French Guiana' },
  { iso:'GG', name:'Guernsey' }, { iso:'GH', name:'Ghana' },
  { iso:'GI', name:'Gibraltar' }, { iso:'GL', name:'Greenland' },
  { iso:'GM', name:'Gambia' }, { iso:'GN', name:'Guinea' },
  { iso:'GP', name:'Guadeloupe' }, { iso:'GQ', name:'Equatorial Guinea' },
  { iso:'GR', name:'Greece' }, { iso:'GT', name:'Guatemala' },
  { iso:'GU', name:'Guam' }, { iso:'GW', name:'Guinea-Bissau' },
  { iso:'GY', name:'Guyana' }, { iso:'HK', name:'Hong Kong' },
  { iso:'HN', name:'Honduras' }, { iso:'HR', name:'Croatia' },
  { iso:'HT', name:'Haiti' }, { iso:'HU', name:'Hungary' },
  { iso:'ID', name:'Indonesia' }, { iso:'IE', name:'Ireland' },
  { iso:'IL', name:'Israel' }, { iso:'IM', name:'Isle of Man' },
  { iso:'IN', name:'India' }, { iso:'IQ', name:'Iraq' },
  { iso:'IR', name:'Iran' }, { iso:'IS', name:'Iceland' },
  { iso:'IT', name:'Italy' }, { iso:'JE', name:'Jersey' },
  { iso:'JM', name:'Jamaica' }, { iso:'JO', name:'Jordan' },
  { iso:'JP', name:'Japan' }, { iso:'KE', name:'Kenya' },
  { iso:'KG', name:'Kyrgyzstan' }, { iso:'KH', name:'Cambodia' },
  { iso:'KI', name:'Kiribati' }, { iso:'KM', name:'Comoros' },
  { iso:'KN', name:'Saint Kitts and Nevis' }, { iso:'KP', name:'North Korea' },
  { iso:'KR', name:'South Korea' }, { iso:'KW', name:'Kuwait' },
  { iso:'KY', name:'Cayman Islands' }, { iso:'KZ', name:'Kazakhstan' },
  { iso:'LA', name:'Laos' }, { iso:'LB', name:'Lebanon' },
  { iso:'LC', name:'Saint Lucia' }, { iso:'LI', name:'Liechtenstein' },
  { iso:'LK', name:'Sri Lanka' }, { iso:'LR', name:'Liberia' },
  { iso:'LS', name:'Lesotho' }, { iso:'LT', name:'Lithuania' },
  { iso:'LU', name:'Luxembourg' }, { iso:'LV', name:'Latvia' },
  { iso:'LY', name:'Libya' }, { iso:'MA', name:'Morocco' },
  { iso:'MC', name:'Monaco' }, { iso:'MD', name:'Moldova' },
  { iso:'ME', name:'Montenegro' }, { iso:'MG', name:'Madagascar' },
  { iso:'MH', name:'Marshall Islands' }, { iso:'MK', name:'North Macedonia' },
  { iso:'ML', name:'Mali' }, { iso:'MM', name:'Myanmar' },
  { iso:'MN', name:'Mongolia' }, { iso:'MO', name:'Macau' },
  { iso:'MQ', name:'Martinique' }, { iso:'MR', name:'Mauritania' },
  { iso:'MS', name:'Montserrat' }, { iso:'MT', name:'Malta' },
  { iso:'MU', name:'Mauritius' }, { iso:'MV', name:'Maldives' },
  { iso:'MW', name:'Malawi' }, { iso:'MX', name:'Mexico' },
  { iso:'MY', name:'Malaysia' }, { iso:'MZ', name:'Mozambique' },
  { iso:'NA', name:'Namibia' }, { iso:'NC', name:'New Caledonia' },
  { iso:'NE', name:'Niger' }, { iso:'NG', name:'Nigeria' },
  { iso:'NI', name:'Nicaragua' }, { iso:'NL', name:'Netherlands' },
  { iso:'NO', name:'Norway' }, { iso:'NP', name:'Nepal' },
  { iso:'NR', name:'Nauru' }, { iso:'NZ', name:'New Zealand' },
  { iso:'OM', name:'Oman' }, { iso:'PA', name:'Panama' },
  { iso:'PE', name:'Peru' }, { iso:'PF', name:'French Polynesia' },
  { iso:'PG', name:'Papua New Guinea' }, { iso:'PH', name:'Philippines' },
  { iso:'PK', name:'Pakistan' }, { iso:'PL', name:'Poland' },
  { iso:'PR', name:'Puerto Rico' }, { iso:'PS', name:'Palestine' },
  { iso:'PT', name:'Portugal' }, { iso:'PW', name:'Palau' },
  { iso:'PY', name:'Paraguay' }, { iso:'QA', name:'Qatar' },
  { iso:'RE', name:'Réunion' }, { iso:'RO', name:'Romania' },
  { iso:'RS', name:'Serbia' }, { iso:'RU', name:'Russia' },
  { iso:'RW', name:'Rwanda' }, { iso:'SA', name:'Saudi Arabia' },
  { iso:'SB', name:'Solomon Islands' }, { iso:'SC', name:'Seychelles' },
  { iso:'SD', name:'Sudan' }, { iso:'SE', name:'Sweden' },
  { iso:'SG', name:'Singapore' }, { iso:'SH', name:'Saint Helena' },
  { iso:'SI', name:'Slovenia' }, { iso:'SK', name:'Slovakia' },
  { iso:'SL', name:'Sierra Leone' }, { iso:'SM', name:'San Marino' },
  { iso:'SN', name:'Senegal' }, { iso:'SO', name:'Somalia' },
  { iso:'SR', name:'Suriname' }, { iso:'SS', name:'South Sudan' },
  { iso:'ST', name:'São Tomé and Príncipe' }, { iso:'SV', name:'El Salvador' },
  { iso:'SY', name:'Syria' }, { iso:'SZ', name:'Eswatini' },
  { iso:'TC', name:'Turks and Caicos Islands' }, { iso:'TD', name:'Chad' },
  { iso:'TG', name:'Togo' }, { iso:'TH', name:'Thailand' },
  { iso:'TJ', name:'Tajikistan' }, { iso:'TL', name:'Timor-Leste' },
  { iso:'TM', name:'Turkmenistan' }, { iso:'TN', name:'Tunisia' },
  { iso:'TO', name:'Tonga' }, { iso:'TR', name:'Turkey' },
  { iso:'TT', name:'Trinidad and Tobago' }, { iso:'TV', name:'Tuvalu' },
  { iso:'TW', name:'Taiwan' }, { iso:'TZ', name:'Tanzania' },
  { iso:'UA', name:'Ukraine' }, { iso:'UG', name:'Uganda' },
  { iso:'US', name:'United States' }, { iso:'UY', name:'Uruguay' },
  { iso:'UZ', name:'Uzbekistan' }, { iso:'VA', name:'Vatican City' },
  { iso:'VC', name:'Saint Vincent and the Grenadines' }, { iso:'VE', name:'Venezuela' },
  { iso:'VG', name:'British Virgin Islands' }, { iso:'VI', name:'US Virgin Islands' },
  { iso:'VN', name:'Vietnam' }, { iso:'VU', name:'Vanuatu' },
  { iso:'WS', name:'Samoa' }, { iso:'XK', name:'Kosovo' },
  { iso:'YE', name:'Yemen' }, { iso:'YT', name:'Mayotte' },
  { iso:'ZA', name:'South Africa' }, { iso:'ZM', name:'Zambia' },
  { iso:'ZW', name:'Zimbabwe' },
];

const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map(c => [c.iso, c.name]));
const getCountryName = iso => COUNTRY_MAP[iso] || iso;

// ─── Country picker modal ─────────────────────────────────────────────────────

function CountryPickerModal({ zone, onClose, onRefresh }) {
  const [search, setSearch] = useState('');

  const addCountry = useMutation({
    mutationFn: iso => carriersApi.addCountry(zone.id, { country_iso: iso }),
    onSuccess: onRefresh,
  });
  const delCountry = useMutation({
    mutationFn: id => carriersApi.removeCountry(id),
    onSuccess: onRefresh,
  });

  const addedSet  = new Set((zone.country_codes || []).map(cc => cc.country_iso));
  const addedList = COUNTRIES.filter(c => addedSet.has(c.iso));
  const q = search.toLowerCase();
  const filtered  = COUNTRIES.filter(c =>
    !addedSet.has(c.iso) &&
    (c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q))
  );

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.72)', zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div style={{
        background:'#0F1128', borderRadius:14, padding:24,
        width:580, maxHeight:'82vh', display:'flex', flexDirection:'column',
        border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ margin:0, color:'#fff', fontSize:16, fontWeight:700 }}>
            Select a Country — <span style={{ color:'#7B2FBE' }}>{zone.name}</span>
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:20, lineHeight:1 }}>✕</button>
        </div>

        {/* Already added */}
        {addedList.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Added to this zone</p>
            {addedList.map(c => {
              const cc = (zone.country_codes||[]).find(x => x.country_iso === c.iso);
              return (
                <div key={c.iso} style={{ display:'flex', alignItems:'center', padding:'6px 10px', borderRadius:7, background:'rgba(0,200,83,0.07)', marginBottom:4, border:'1px solid rgba(0,200,83,0.15)' }}>
                  <span style={{ fontSize:13, color:'#fff', fontWeight:500 }}>{c.name}</span>
                  <span style={{ fontSize:12, color:'#00C853', fontFamily:'monospace', fontWeight:700, marginLeft:10, marginRight:'auto' }}>{c.iso}</span>
                  <button
                    onClick={() => cc && delCountry.mutate(cc.id)}
                    style={{ background:'rgba(233,30,140,0.12)', border:'1px solid rgba(233,30,140,0.25)', borderRadius:6, color:'#E91E8C', cursor:'pointer', fontSize:11, fontWeight:600, padding:'3px 10px' }}
                  >Remove</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Search */}
        <p style={{ fontSize:11, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>Full country list</p>
        <div className="pill-input-wrap" style={{ height:36, marginBottom:10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ISO code…" autoFocus style={{ fontSize:13 }}/>
        </div>

        {/* Country list */}
        <div style={{ overflowY:'auto', flex:1, borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, background:'#0F1128', zIndex:1 }}>
              <tr>
                <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11, color:'#AAAAAA', fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>Country</th>
                <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11, color:'#AAAAAA', fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.07)', width:55 }}>ISO</th>
                <th style={{ padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)', width:70 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.iso} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.012)' }}>
                  <td style={{ padding:'7px 12px', fontSize:13, color:'#fff' }}>{c.name}</td>
                  <td style={{ padding:'7px 12px', fontSize:12, color:'#00C853', fontFamily:'monospace', fontWeight:700 }}>{c.iso}</td>
                  <td style={{ padding:'7px 12px', textAlign:'right' }}>
                    <button onClick={() => addCountry.mutate(c.iso)}
                      style={{ background:'rgba(0,200,83,0.1)', border:'1px solid rgba(0,200,83,0.3)', borderRadius:6, color:'#00C853', cursor:'pointer', fontSize:11, fontWeight:600, padding:'3px 10px', display:'inline-flex', alignItems:'center', gap:3 }}>
                      <Plus size={10}/> Add
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} style={{ padding:'24px', textAlign:'center', color:'#555', fontSize:13 }}>
                  No countries match "{search}"
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop:14, textAlign:'right' }}>
          <button onClick={onClose} className="btn-ghost" style={{ height:32, padding:'0 16px', fontSize:13 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── LEVEL 3 — Rate card matrix ──────────────────────────────────────────────

function formatBandLabel(min, max) {
  const mn = parseFloat(min);
  const mx = parseFloat(max);
  if (mn === 0) {
    const mxFmt = mx % 1 === 0 ? mx : mx.toFixed(1);
    return `Up to ${mxFmt}kg`;
  }
  const mnFmt = mn % 1 === 0 ? mn : mn.toFixed(1);
  const mxFmt = mx % 1 === 0 ? mx : mx.toFixed(1);
  return `${mnFmt} – ${mxFmt}kg`;
}

function RateMatrix({ zones }) {
  // Collect all unique weight bands across zones, keyed by "min|max"
  const bandMap = new Map();
  zones.forEach(z => {
    (z.weight_bands || []).forEach(b => {
      const key = `${b.min_weight_kg}|${b.max_weight_kg}`;
      if (!bandMap.has(key)) bandMap.set(key, b);
    });
  });

  const sortedBands = [...bandMap.values()]
    .sort((a, b) => parseFloat(a.min_weight_kg) - parseFloat(b.min_weight_kg));

  // Per-zone lookup: zone_id → { "min|max" → band }
  const lookup = {};
  zones.forEach(z => {
    lookup[z.id] = {};
    (z.weight_bands || []).forEach(b => {
      lookup[z.id][`${b.min_weight_kg}|${b.max_weight_kg}`] = b;
    });
  });

  if (zones.length === 0) {
    return (
      <div style={{ padding:'48px 0', textAlign:'center', color:'#555', fontSize:13 }}>
        No zones configured — go to Zone Config to add zones and weight bands.
      </div>
    );
  }

  if (sortedBands.length === 0) {
    return (
      <div style={{ padding:'48px 0', textAlign:'center', color:'#555', fontSize:13 }}>
        No weight bands found. Go to Zone Config to add them.
      </div>
    );
  }

  const hasSub = zones.some(z =>
    (z.weight_bands || []).some(b => b.price_sub && parseFloat(b.price_sub) > 0)
  );

  return (
    <div>
      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginBottom:14, alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#AAAAAA' }}>
          <span style={{ width:10, height:10, borderRadius:2, background:'#00C853', display:'inline-block' }}/>
          1st parcel cost price
        </div>
        {hasSub && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#AAAAAA' }}>
            <span style={{ width:10, height:10, borderRadius:2, background:'#FFC107', display:'inline-block' }}/>
            Each subsequent parcel
          </div>
        )}
        <span style={{ marginLeft:'auto', fontSize:12, color:'#555' }}>
          {sortedBands.length} weight {sortedBands.length === 1 ? 'band' : 'bands'} · {zones.length} {zones.length === 1 ? 'zone' : 'zones'}
        </span>
      </div>

      {/* Matrix table */}
      <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
        <table style={{ borderCollapse:'collapse', width:'100%' }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.025)' }}>
              {/* Sticky weight column header */}
              <th style={{
                position:'sticky', left:0, zIndex:3,
                background:'#0D0F28',
                padding:'10px 16px',
                textAlign:'left', fontSize:11, fontWeight:700,
                color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.06em',
                borderBottom:'2px solid rgba(255,255,255,0.07)',
                borderRight:'1px solid rgba(255,255,255,0.07)',
                whiteSpace:'nowrap', minWidth:140,
              }}>Weight</th>
              {zones.map(z => (
                <th key={z.id} style={{
                  padding:'10px 16px',
                  textAlign:'center', fontSize:11, fontWeight:700,
                  color:'#7B2FBE', textTransform:'uppercase', letterSpacing:'0.04em',
                  borderBottom:'2px solid rgba(123,47,190,0.3)',
                  borderLeft:'1px solid rgba(255,255,255,0.04)',
                  whiteSpace:'nowrap', minWidth:120,
                }}>{z.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBands.map((band, i) => {
              const key = `${band.min_weight_kg}|${band.max_weight_kg}`;
              const label = formatBandLabel(band.min_weight_kg, band.max_weight_kg);
              const isEven = i % 2 === 0;
              const rowBg = isEven ? 'transparent' : 'rgba(255,255,255,0.012)';
              const stickyBg = isEven ? '#0A0B1E' : '#0C0D20';

              return (
                <tr key={key}>
                  {/* Sticky weight label */}
                  <td style={{
                    position:'sticky', left:0, zIndex:1,
                    background: stickyBg,
                    padding:'9px 16px',
                    fontSize:12, fontWeight:600, color:'#CCCCCC',
                    borderRight:'1px solid rgba(255,255,255,0.06)',
                    whiteSpace:'nowrap',
                  }}>{label}</td>

                  {zones.map(z => {
                    const b = lookup[z.id]?.[key];
                    return (
                      <td key={z.id} style={{
                        padding:'9px 16px', textAlign:'center',
                        background: rowBg,
                        borderLeft:'1px solid rgba(255,255,255,0.03)',
                      }}>
                        {b ? (
                          <div>
                            <div style={{
                              fontSize:13, fontWeight:700, color:'#00C853',
                              fontFamily:'monospace', letterSpacing:'0.02em',
                            }}>
                              £{parseFloat(b.price_first).toFixed(2)}
                            </div>
                            {b.price_sub && parseFloat(b.price_sub) > 0 && (
                              <div style={{
                                fontSize:10, color:'#FFC107',
                                fontFamily:'monospace', marginTop:2,
                              }}>
                                +£{parseFloat(b.price_sub).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color:'#2A2A3A', fontSize:14 }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── LEVEL 3 — Zone config (accordion per zone) ───────────────────────────────

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
  const [open, setOpen]                     = useState(false);
  const [confirmDel, setConfirmDel]         = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [inclInput, setInclInput]           = useState('');
  const [exclInput, setExclInput]           = useState('');

  const delZone     = useMutation({ mutationFn: () => carriersApi.deleteZone(zone.id), onSuccess: onRefresh });
  const delCountry  = useMutation({ mutationFn: id => carriersApi.removeCountry(id), onSuccess: onRefresh });
  const addPostcode = useMutation({
    mutationFn: ({ prefix, type }) => carriersApi.addPostcodeRule(zone.id, { postcode_prefix: prefix.toUpperCase().trim(), rule_type: type }),
    onSuccess: (_, { type }) => { type === 'include' ? setInclInput('') : setExclInput(''); onRefresh(); },
  });
  const delPostcode = useMutation({ mutationFn: id => carriersApi.removePostcodeRule(id), onSuccess: onRefresh });

  const inclRules = (zone.postcode_rules || []).filter(r => r.rule_type === 'include');
  const exclRules = (zone.postcode_rules || []).filter(r => r.rule_type === 'exclude');

  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, marginBottom:8, overflow:'hidden' }}>

      {/* Zone header row */}
      <div onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', padding:'11px 14px', cursor:'pointer', userSelect:'none',
          background: open ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
        <ChevronRight size={13} style={{ marginRight:8, color:'#00C853', transition:'0.15s',
          transform: open ? 'rotate(90deg)' : 'none' }}/>
        <span style={{ fontWeight:600, color:'#fff', flex:1, fontSize:13 }}>{zone.name}</span>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginRight:10 }}>
          <span style={{ fontSize:11, color:'#AAAAAA' }}>
            {(zone.country_codes||[]).length} {(zone.country_codes||[]).length === 1 ? 'country' : 'countries'}
          </span>
          {inclRules.length > 0 && (
            <span style={{ fontSize:11, color:'#00BCD4' }}>✓ {inclRules.length} incl</span>
          )}
          {exclRules.length > 0 && (
            <span style={{ fontSize:11, color:'#E91E8C' }}>✗ {exclRules.length} excl</span>
          )}
          <span style={{ fontSize:11, color:'#555' }}>
            {(zone.weight_bands||[]).length} bands
          </span>
        </div>
        <button onClick={e => { e.stopPropagation(); setConfirmDel(true); }}
          style={{ background:'none', border:'none', color:'#444', cursor:'pointer' }}>
          <Trash2 size={12}/>
        </button>
      </div>

      {confirmDel && (
        <div style={{ padding:'0 14px 10px' }}>
          <Confirm message={`Delete zone "${zone.name}"? This removes all weight bands and rules.`}
            onConfirm={() => delZone.mutate()} onCancel={() => setConfirmDel(false)}/>
        </div>
      )}

      {open && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'14px 14px 16px' }}>

          {/* ── Countries section ── */}
          <div style={{ marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.06em' }}>Countries</span>
              <button onClick={() => setShowCountryPicker(true)}
                style={{ background:'rgba(0,200,83,0.1)', border:'1px solid rgba(0,200,83,0.25)',
                  borderRadius:6, color:'#00C853', cursor:'pointer',
                  fontSize:11, fontWeight:600, padding:'3px 10px',
                  display:'inline-flex', alignItems:'center', gap:4 }}>
                <Plus size={10}/> Add Country
              </button>
            </div>

            {(zone.country_codes||[]).length === 0 ? (
              <p style={{ color:'#555', fontSize:12, margin:0, fontStyle:'italic' }}>
                No countries — click Add Country to assign coverage.
              </p>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding:'6px 10px', textAlign:'left', color:'#AAAAAA', fontWeight:600, fontSize:11, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Country</th>
                    <th style={{ padding:'6px 10px', textAlign:'left', color:'#AAAAAA', fontWeight:600, fontSize:11, borderBottom:'1px solid rgba(255,255,255,0.06)', width:50 }}>ISO</th>
                    <th style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', width:36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(zone.country_codes||[]).map((cc, i) => (
                    <tr key={cc.id} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.012)' }}>
                      <td style={{ padding:'7px 10px', color:'#ddd' }}>{getCountryName(cc.country_iso)}</td>
                      <td style={{ padding:'7px 10px', color:'#00C853', fontFamily:'monospace', fontWeight:700 }}>{cc.country_iso}</td>
                      <td style={{ padding:'7px 10px', textAlign:'right' }}>
                        <button onClick={() => delCountry.mutate(cc.id)}
                          style={{ background:'none', border:'none', color:'#444', cursor:'pointer' }}>
                          <X size={11}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Postcode Rules section ── */}
          <div style={{ marginBottom:18, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:12 }}>
              Postcode Rules
            </span>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {/* Include column */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#00BCD4', textTransform:'uppercase' }}>✓ Included</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, minHeight:28, marginBottom:8 }}>
                  {inclRules.length === 0
                    ? <span style={{ fontSize:12, color:'#444', fontStyle:'italic' }}>None — all postcodes included</span>
                    : inclRules.map(pr => (
                        <span key={pr.id} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'3px 9px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(0,188,212,0.12)', color:'#00BCD4' }}>
                          {pr.postcode_prefix}
                          <button onClick={() => delPostcode.mutate(pr.id)} style={{ background:'none', border:'none', color:'#00BCD4', cursor:'pointer', padding:0 }}><X size={8}/></button>
                        </span>
                      ))
                  }
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <div className="pill-input-wrap" style={{ height:28, flex:1 }}>
                    <input value={inclInput} onChange={e => setInclInput(e.target.value)}
                      placeholder="AB, BT, SW…"
                      onKeyDown={e => e.key==='Enter' && inclInput.trim() && addPostcode.mutate({ prefix: inclInput, type:'include' })}
                      style={{ fontSize:11, textTransform:'uppercase' }}/>
                  </div>
                  <button onClick={() => inclInput.trim() && addPostcode.mutate({ prefix: inclInput, type:'include' })}
                    style={{ background:'rgba(0,188,212,0.12)', border:'1px solid rgba(0,188,212,0.3)', borderRadius:6, color:'#00BCD4', cursor:'pointer', fontSize:11, fontWeight:600, padding:'0 10px', height:28 }}>
                    + Add
                  </button>
                </div>
              </div>

              {/* Exclude column */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#E91E8C', textTransform:'uppercase' }}>✗ Excluded</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, minHeight:28, marginBottom:8 }}>
                  {exclRules.length === 0
                    ? <span style={{ fontSize:12, color:'#444', fontStyle:'italic' }}>None excluded</span>
                    : exclRules.map(pr => (
                        <span key={pr.id} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'3px 9px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(233,30,140,0.12)', color:'#E91E8C' }}>
                          {pr.postcode_prefix}
                          <button onClick={() => delPostcode.mutate(pr.id)} style={{ background:'none', border:'none', color:'#E91E8C', cursor:'pointer', padding:0 }}><X size={8}/></button>
                        </span>
                      ))
                  }
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <div className="pill-input-wrap" style={{ height:28, flex:1 }}>
                    <input value={exclInput} onChange={e => setExclInput(e.target.value)}
                      placeholder="FK17, IV1, HS…"
                      onKeyDown={e => e.key==='Enter' && exclInput.trim() && addPostcode.mutate({ prefix: exclInput, type:'exclude' })}
                      style={{ fontSize:11, textTransform:'uppercase' }}/>
                  </div>
                  <button onClick={() => exclInput.trim() && addPostcode.mutate({ prefix: exclInput, type:'exclude' })}
                    style={{ background:'rgba(233,30,140,0.1)', border:'1px solid rgba(233,30,140,0.25)', borderRadius:6, color:'#E91E8C', cursor:'pointer', fontSize:11, fontWeight:600, padding:'0 10px', height:28 }}>
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Weight Bands section ── */}
          <div style={{ paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <WeightBandsTable zoneId={zone.id} bands={zone.weight_bands||[]} onRefresh={onRefresh}/>
          </div>
        </div>
      )}

      {/* Country picker modal — rendered outside the card so it overlays everything */}
      {showCountryPicker && (
        <CountryPickerModal zone={zone} onClose={() => setShowCountryPicker(false)} onRefresh={onRefresh}/>
      )}
    </div>
  );
}

function ServiceDetail({ serviceId, carrierName, onBack }) {
  const [innerTab, setInnerTab]   = useState(0); // 0 = Rate Card, 1 = Zone Config
  const [addingZone, setAddingZone] = useState(false);
  const [zoneName, setZoneName]   = useState('');
  const [fuelPct, setFuelPct]     = useState('');
  const [editFuel, setEditFuel]   = useState(false);

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

  const INNER_TABS = ['Rate Card', 'Zone Config'];

  return (
    <div>
      {/* ── Breadcrumb header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding:'6px 14px', fontSize:13 }}>
          <ArrowLeft size={13}/> {carrierName}
        </button>
        <span style={{ color:'#333', fontSize:16 }}>/</span>
        <h1 style={{ fontSize:20, fontWeight:700, color:'#7B2FBE', margin:0 }}>{svc.name}</h1>
        <span style={{
          display:'inline-block', padding:'2px 9px', borderRadius:9999,
          fontSize:11, fontWeight:700, fontFamily:'monospace',
          background:'rgba(0,200,83,0.08)', color:'#00C853',
        }}>{svc.service_code}</span>

        {/* Fuel surcharge pill / edit */}
        {!editFuel ? (
          <span
            onClick={() => { setFuelPct(svc.fuel_surcharge_pct||''); setEditFuel(true); }}
            style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'3px 11px', borderRadius:9999, cursor:'pointer',
              fontSize:12, fontWeight:700,
              background: svc.fuel_surcharge_pct ? 'rgba(255,193,7,0.12)' : 'rgba(255,255,255,0.05)',
              color: svc.fuel_surcharge_pct ? '#FFC107' : '#555',
              border: '1px solid transparent',
            }}
          >
            <Zap size={11}/>
            {svc.fuel_surcharge_pct
              ? `Fuel: ${parseFloat(svc.fuel_surcharge_pct).toFixed(2)}%`
              : 'Set fuel surcharge'}
          </span>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="pill-input-wrap" style={{ height:30, width:110 }}>
              <input type="number" step="0.01" value={fuelPct}
                onChange={e => setFuelPct(e.target.value)} placeholder="5.00"
                style={{ fontSize:12 }} autoFocus/>
              <div className="green-cap" style={{ fontSize:11 }}>%</div>
            </div>
            <button onClick={() => updateFuel.mutate(fuelPct)} className="btn-primary" style={{ height:30, padding:'0 12px', fontSize:12 }}>Save</button>
            <button onClick={() => setEditFuel(false)} className="btn-ghost" style={{ height:30, padding:'0 8px', fontSize:12 }}>✕</button>
          </div>
        )}

        {/* Congestion surcharge count */}
        {(svc.congestion_surcharges||[]).length > 0 && (
          <span style={{
            display:'inline-block', padding:'3px 11px', borderRadius:9999,
            fontSize:12, fontWeight:700,
            background:'rgba(233,30,140,0.10)', color:'#E91E8C',
          }}>
            {(svc.congestion_surcharges||[]).length} congestion zone{(svc.congestion_surcharges||[]).length!==1?'s':''}
          </span>
        )}
      </div>

      {/* ── Inner tabs ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {INNER_TABS.map((t, i) => (
          <button key={t} onClick={() => setInnerTab(i)} style={{
            background:'none', border:'none', cursor:'pointer',
            padding:'9px 18px', fontSize:13, fontWeight:600,
            color: innerTab===i ? '#00C853':'#AAAAAA',
            borderBottom: innerTab===i ? '2px solid #00C853':'2px solid transparent',
            marginBottom:-1, transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab: Rate Card matrix ── */}
      {innerTab === 0 && (
        <RateMatrix zones={svc.zones || []} />
      )}

      {/* ── Tab: Zone Config ── */}
      {innerTab === 1 && (
        <div>
          {/* Zones */}
          <div className="moov-card" style={{ padding:18, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Zones & Coverage</h3>
              <button onClick={() => setAddingZone(a=>!a)} className="btn-primary" style={{ height:30, padding:'0 12px', fontSize:12 }}>
                <Plus size={12}/> Add Zone
              </button>
            </div>
            {addingZone && (
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <div className="pill-input-wrap" style={{ flex:1, height:34 }}>
                  <input value={zoneName} onChange={e => setZoneName(e.target.value)}
                    placeholder="Zone name — e.g. Mainland, Northern Ireland" autoFocus/>
                </div>
                <button onClick={() => addZone.mutate()} className="btn-primary" style={{ height:34 }}><Check size={13}/> Add</button>
                <button onClick={() => setAddingZone(false)} className="btn-ghost" style={{ height:34 }}>Cancel</button>
              </div>
            )}
            {(svc.zones||[]).length === 0
              ? <p style={{ color:'#555', fontSize:13, margin:0 }}>No zones yet — add one above.</p>
              : (svc.zones||[]).map(z => <ZoneCard key={z.id} zone={z} onRefresh={refetch}/>)
            }
          </div>

          {/* Congestion surcharges */}
          {(svc.congestion_surcharges||[]).length > 0 && (
            <div className="moov-card" style={{ padding:18 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 12px' }}>Congestion Surcharges</h3>
              <table className="moov-table" style={{ fontSize:12 }}>
                <thead><tr><th>Postcode Prefix</th><th>Fee</th></tr></thead>
                <tbody>
                  {(svc.congestion_surcharges||[]).map(cs => (
                    <tr key={cs.id}>
                      <td><span style={{ display:'inline-block', padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(255,193,7,0.12)', color:'#FFC107' }}>{cs.postcode_prefix}</span></td>
                      <td style={{ color:'#E91E8C', fontFamily:'monospace' }}>£{parseFloat(cs.fee).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
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
