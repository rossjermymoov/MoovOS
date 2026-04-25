/**
 * Carrier Management — 3-level hierarchy
 *
 * Level 1: Carrier grid (contacts at a glance, editable)
 * Level 2: Carrier detail — services list for that carrier
 * Level 3: Service detail — zones, weight bands, surcharges, dim weight
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, ChevronRight, ChevronDown, ChevronUp, Trash2, X, Check, Phone, Mail,
  User, Building2, Edit2, Zap, AlertTriangle, ArrowLeft, GripVertical,
  Upload, Download, Copy, TrendingUp, Calendar, FileText, CheckCircle, Save, RefreshCw,
} from 'lucide-react';
import { carriersApi } from '../../api/carriers';
import { getCourierLogo } from '../../utils/courierLogos';
import { carrierRateCardsApi } from '../../api/carrierRateCards';
import carrierDataApi from '../../api/carrierData';
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

function ContactRow({ contact, onDelete, onUpdate, onMakePrimary }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...contact });

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
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary" style={{ height:28, padding:'0 12px', fontSize:12 }}><Check size={11}/> Save</button>
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
      {onMakePrimary && (
        <button
          onClick={() => onMakePrimary(contact)}
          title="Make primary contact"
          style={{ background:'none', border:'1px solid rgba(255,193,7,0.3)', borderRadius:5, color:'#FFC107', cursor:'pointer', fontSize:11, fontWeight:700, padding:'2px 8px' }}
        >
          ★ Primary
        </button>
      )}
      <button onClick={() => setEditing(true)} style={{ background:'none', border:'none', color:'#AAAAAA', cursor:'pointer' }}><Edit2 size={12}/></button>
      <button onClick={() => del.mutate()} style={{ background:'none', border:'none', color:'#555', cursor:'pointer' }}><Trash2 size={12}/></button>
    </div>
  );
}

// ─── Courier logo component ───────────────────────────────────────────────────
// Shows the carrier's logo on a white background; falls back to the coloured
// letter badge if no logo is available in the Voila API map.

function CourierLogo({ code, color, size = 46, radius = 10 }) {
  const logo = getCourierLogo(code);
  if (logo) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: '#fff', border: `2px solid rgba(255,255,255,0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        <img
          src={logo}
          alt={code}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
          onError={e => {
            // If the image fails to load, swap to a text badge
            e.currentTarget.parentElement.innerHTML =
              `<span style="font-size:${Math.round(size*0.22)}px;font-weight:900;color:${color};letter-spacing:0.03em">${code.slice(0,4)}</span>`;
          }}
        />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: `${color}22`, border: `2px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.22), fontWeight: 900, color, letterSpacing: '0.03em', flexShrink: 0,
    }}>
      {code.slice(0, 4)}
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

  const makePrimary = useMutation({
    mutationFn: (contact) => api.patch(`/carriers/couriers/${carrier.id}`, {
      primary_contact_name:  contact.name  || '',
      primary_contact_phone: contact.phone || '',
      primary_contact_email: contact.email || '',
    }).then(r => r.data),
    onSuccess: onRefresh,
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
        {/* Carrier logo / badge */}
        <CourierLogo code={carrier.code} color={color} size={46} radius={10} />
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
            <ContactRow key={c.id} contact={c} onDelete={onRefresh} onUpdate={onRefresh} onMakePrimary={c => makePrimary.mutate(c)} />
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
            <button onClick={() => addContact.mutate()} disabled={addContact.isPending || !newContact.name.trim()} className="btn-primary" style={{ height:28, padding:'0 12px', fontSize:12 }}><Check size={11}/> {addContact.isPending ? 'Saving…' : 'Add'}</button>
            <button onClick={() => setAddingContact(false)} className="btn-ghost" style={{ height:28, padding:'0 10px', fontSize:12 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fuel group card ──────────────────────────────────────────────────────────

function FuelGroupCard({ group, onRefresh }) {
  const [editing, setEditing]           = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [confirmDel, setConfirmDel]     = useState(false);
  const [form, setForm]                 = useState({});

  function startEdit() {
    setForm({
      name:                     group.name,
      fuel_surcharge_pct:       String(group.fuel_surcharge_pct ?? ''),
      standard_sell_pct:        String(group.standard_sell_pct  ?? ''),
      next_sell_pct:            String(group.next_sell_pct       ?? ''),
      next_sell_effective_date: group.next_sell_effective_date
        ? group.next_sell_effective_date.substring(0, 10) : '',
    });
    setEditing(true);
  }

  const updateGroup = useMutation({
    mutationFn: () => api.patch(`/carriers/fuel-groups/${group.id}`, {
      name:                    form.name,
      fuel_surcharge_pct:      parseFloat(form.fuel_surcharge_pct)  || 0,
      standard_sell_pct:       form.standard_sell_pct  !== '' ? parseFloat(form.standard_sell_pct)  : null,
      next_sell_pct:           form.next_sell_pct       !== '' ? parseFloat(form.next_sell_pct)       : null,
      next_sell_effective_date: form.next_sell_effective_date || null,
    }).then(r => r.data),
    onSuccess: () => { setEditing(false); setShowSchedule(false); onRefresh(); },
  });
  const deleteGroup = useMutation({
    mutationFn: () => api.delete(`/carriers/fuel-groups/${group.id}`).then(r => r.data),
    onSuccess: onRefresh,
  });

  const hasScheduled = group.next_sell_pct != null && group.next_sell_effective_date;

  return (
    <div style={{ border:'1px solid rgba(255,193,7,0.2)', borderRadius:10, overflow:'hidden', background:'rgba(255,193,7,0.03)' }}>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <Zap size={14} color="#FFC107" style={{ flexShrink:0 }}/>
        {editing ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
            {/* Name + save/cancel */}
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div className="pill-input-wrap" style={{ height:30, flex:1 }}>
                <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  placeholder="Group name" autoFocus style={{ fontSize:12 }}/>
              </div>
              <button onClick={() => updateGroup.mutate()} disabled={updateGroup.isPending}
                className="btn-primary" style={{ height:30, padding:'0 12px', fontSize:12 }}>
                <Check size={11}/> Save
              </button>
              <button onClick={() => { setEditing(false); setShowSchedule(false); }}
                className="btn-ghost" style={{ height:30, padding:'0 8px', fontSize:12 }}>✕</button>
            </div>
            {/* Cost % + standard sell % */}
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'#888', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>Our cost %</div>
                <div className="pill-input-wrap" style={{ height:28 }}>
                  <input type="number" step="0.01" value={form.fuel_surcharge_pct}
                    onChange={e => setForm(f=>({...f,fuel_surcharge_pct:e.target.value}))}
                    placeholder="0.00" style={{ fontSize:12 }}/>
                  <div className="green-cap" style={{ fontSize:11 }}>%</div>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'#888', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>Standard sell %</div>
                <div className="pill-input-wrap" style={{ height:28 }}>
                  <input type="number" step="0.01" value={form.standard_sell_pct}
                    onChange={e => setForm(f=>({...f,standard_sell_pct:e.target.value}))}
                    placeholder="0.00" style={{ fontSize:12 }}/>
                  <div className="green-cap" style={{ fontSize:11 }}>%</div>
                </div>
              </div>
              <button
                onClick={() => setShowSchedule(s => !s)}
                style={{ background:'none', border:'1px solid rgba(255,193,7,0.3)', borderRadius:6,
                  color:'#FFC107', fontSize:11, padding:'5px 10px', cursor:'pointer', whiteSpace:'nowrap' }}>
                {showSchedule ? '— Hide' : '+ Schedule'}
              </button>
            </div>
            {/* Scheduled future rate */}
            {showSchedule && (
              <div style={{ display:'flex', gap:10, alignItems:'flex-end', padding:'8px 10px',
                background:'rgba(255,193,7,0.04)', border:'1px solid rgba(255,193,7,0.15)', borderRadius:6 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'#888', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>Next sell %</div>
                  <div className="pill-input-wrap" style={{ height:28 }}>
                    <input type="number" step="0.01" value={form.next_sell_pct}
                      onChange={e => setForm(f=>({...f,next_sell_pct:e.target.value}))}
                      placeholder="0.00" style={{ fontSize:12 }}/>
                    <div className="green-cap" style={{ fontSize:11 }}>%</div>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'#888', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>Effective from</div>
                  <div className="pill-input-wrap" style={{ height:28 }}>
                    <input type="date" value={form.next_sell_effective_date}
                      onChange={e => setForm(f=>({...f,next_sell_effective_date:e.target.value}))}
                      style={{ fontSize:12, colorScheme:'dark' }}/>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#fff', fontSize:14 }}>{group.name}</div>
              {hasScheduled && (
                <div style={{ fontSize:11, color:'rgba(255,193,7,0.6)', marginTop:2 }}>
                  ↗ {parseFloat(group.next_sell_pct).toFixed(2)}% from{' '}
                  {new Date(group.next_sell_effective_date).toLocaleDateString('en-GB',
                    { day:'numeric', month:'short', year:'numeric' })}
                </div>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span style={{ fontSize:10, color:'#666' }}>cost</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#555',
                  background:'rgba(255,255,255,0.05)', padding:'1px 8px',
                  borderRadius:9999, fontFamily:'monospace' }}>
                  {parseFloat(group.fuel_surcharge_pct || 0).toFixed(2)}%
                </span>
              </div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span style={{ fontSize:10, color:'#666' }}>sell</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#FFC107',
                  background:'rgba(255,193,7,0.12)', padding:'1px 8px',
                  borderRadius:9999, fontFamily:'monospace' }}>
                  {group.standard_sell_pct != null
                    ? `${parseFloat(group.standard_sell_pct).toFixed(2)}%`
                    : '—'}
                </span>
              </div>
            </div>
            <button onClick={startEdit}
              style={{ background:'none', border:'none', color:'#AAAAAA', cursor:'pointer' }}>
              <Edit2 size={12}/>
            </button>
            <button onClick={() => setConfirmDel(true)}
              style={{ background:'none', border:'none', color:'#555', cursor:'pointer' }}>
              <Trash2 size={12}/>
            </button>
          </>
        )}
      </div>

      {confirmDel && (
        <div style={{ padding:'8px 14px' }}>
          <Confirm message={`Delete "${group.name}"? Services using it will be unaffected until reassigned.`}
            onConfirm={() => deleteGroup.mutate()} onCancel={() => setConfirmDel(false)}/>
        </div>
      )}
    </div>
  );
}

// ─── CARRIER RATE CARDS TAB ───────────────────────────────────────────────────

function CarrierRateCardsTab({ courierId, courierCode }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId]   = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [showClone, setShowClone]     = useState(null);   // card to clone
  const [showIncrease, setShowIncrease] = useState(null); // card to apply % to
  const [showImport, setShowImport]   = useState(false);
  const [createForm, setCreateForm]   = useState({ name: '', effective_date: '', notes: '' });
  const [cloneForm, setCloneForm]     = useState({ name: '', effective_date: '', notes: '' });
  const [incForm, setIncForm]         = useState({ name: '', pct: '', effective_date: '', notes: '' });
  const [importForm, setImportForm]   = useState({ name: '', effective_date: '', notes: '', csv: '' });
  const fileInputRef                  = useRef(null);
  const [importError, setImportError] = useState('');
  const [editingAcct, setEditingAcct] = useState(null);  // card id being edited
  const [acctDraft, setAcctDraft]     = useState('');

  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['carrier-rate-cards', courierId],
    queryFn: () => carrierRateCardsApi.list(courierId),
    enabled: !!courierId,
  });

  const { data: bandsData, isLoading: bandsLoading } = useQuery({
    queryKey: ['carrier-rate-card-bands', expandedId],
    queryFn: () => carrierRateCardsApi.getBands(expandedId),
    enabled: !!expandedId,
  });

  const createCard = useMutation({
    mutationFn: (data) => carrierRateCardsApi.create({ ...data, courier_id: courierId }),
    onSuccess: () => { setShowCreate(false); setCreateForm({ name:'', effective_date:'', notes:'' }); refetch(); },
  });
  const cloneCard = useMutation({
    mutationFn: (data) => carrierRateCardsApi.clone(showClone?.id, data),
    onSuccess: () => { setShowClone(null); setCloneForm({ name:'', effective_date:'', notes:'' }); refetch(); },
  });
  const applyIncrease = useMutation({
    mutationFn: (data) => carrierRateCardsApi.applyIncrease(showIncrease?.id, data),
    onSuccess: () => { setShowIncrease(null); setIncForm({ name:'', pct:'', effective_date:'', notes:'' }); refetch(); },
  });
  const importCsv = useMutation({
    mutationFn: (data) => carrierRateCardsApi.importCsv({ ...data, courier_id: courierId }),
    onSuccess: (res) => {
      setShowImport(false); setImportForm({ name:'', effective_date:'', notes:'', csv:'' }); setImportError('');
      refetch();
      alert(`✅ Imported ${res.imported} bands${res.skipped ? `, ${res.skipped} rows skipped` : ''}.`);
    },
    onError: (err) => setImportError(err.response?.data?.error || 'Import failed'),
  });
  const activateCard = useMutation({
    mutationFn: (id) => carrierRateCardsApi.activate(id),
    onSuccess: () => refetch(),
  });
  const deleteCard = useMutation({
    mutationFn: (id) => carrierRateCardsApi.delete(id),
    onSuccess: () => { if (expandedId === deleteCard.variables) setExpandedId(null); refetch(); },
  });
  const updateBand = useMutation({
    mutationFn: ({ bandId, ...data }) => carrierRateCardsApi.updateBand(bandId, data),
    onSuccess: () => qc.invalidateQueries(['carrier-rate-card-bands', expandedId]),
  });
  const updateCardAcct = useMutation({
    mutationFn: ({ id, customer_account_number }) =>
      api.patch(`/carrier-rate-cards/${id}`, { customer_account_number }).then(r => r.data),
    onSuccess: () => { setEditingAcct(null); refetch(); },
  });

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportForm(f => ({ ...f, csv: ev.target.result, name: f.name || file.name.replace('.csv','') }));
    reader.readAsText(file);
  }

  const statusBadge = (card) => {
    if (card.is_master)  return { label: 'Master', color: '#00BCD4', bg: 'rgba(0,188,212,0.12)' };
    if (card.is_active)  return { label: 'Active',  color: '#00C853', bg: 'rgba(0,200,83,0.12)' };
    const eff = card.effective_date ? new Date(card.effective_date) : null;
    if (eff && eff > new Date()) return { label: `Effective ${eff.toLocaleDateString('en-GB')}`, color: '#FFC107', bg: 'rgba(255,193,7,0.12)' };
    return { label: 'Pending', color: '#AAAAAA', bg: 'rgba(255,255,255,0.07)' };
  };

  if (isLoading) return <div style={{ padding:40, textAlign:'center', color:'#555' }}>Loading rate cards…</div>;

  const formRow = (label, node) => (
    <div key={label}>
      <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>{label}</label>
      {node}
    </div>
  );

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        <button onClick={() => setShowCreate(c => !c)} className="btn-primary" style={{ fontSize:13 }}>
          <Plus size={13}/> New Rate Card
        </button>
        <button onClick={() => setShowImport(c => !c)} className="btn-ghost" style={{ fontSize:13 }}>
          <Upload size={13}/> Import CSV
        </button>
      </div>

      {/* ── Create form ── */}
      {showCreate && (
        <div className="moov-card" style={{ padding:18, marginBottom:16, border:'1px solid rgba(0,200,83,0.3)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#00C853', marginBottom:14 }}>New Rate Card</h3>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12, marginBottom:14 }}>
            {formRow('Name *', <div className="pill-input-wrap" style={{ height:34 }}><input value={createForm.name} onChange={e => setCreateForm(f=>({...f,name:e.target.value}))} placeholder="e.g. 2026 Standard"/></div>)}
            {formRow('Effective Date', <div className="pill-input-wrap" style={{ height:34 }}><input type="date" value={createForm.effective_date} onChange={e => setCreateForm(f=>({...f,effective_date:e.target.value}))}/></div>)}
            {formRow('Notes', <div className="pill-input-wrap" style={{ height:34 }}><input value={createForm.notes} onChange={e => setCreateForm(f=>({...f,notes:e.target.value}))} placeholder="Optional"/></div>)}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => createCard.mutate(createForm)} disabled={!createForm.name.trim() || createCard.isPending} className="btn-primary" style={{ fontSize:13 }}>
              <Check size={13}/> Create
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Import CSV form ── */}
      {showImport && (
        <div className="moov-card" style={{ padding:18, marginBottom:16, border:'1px solid rgba(0,188,212,0.3)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#00BCD4', marginBottom:6 }}>Import Rate Card from CSV</h3>
          <p style={{ fontSize:12, color:'#888', marginBottom:14 }}>
            CSV columns: <code style={{ color:'#00BCD4' }}>service_code, zone_name, min_weight_kg, max_weight_kg, price_first[, price_sub]</code>
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:12 }}>
            {formRow('Rate Card Name *', <div className="pill-input-wrap" style={{ height:34 }}><input value={importForm.name} onChange={e => setImportForm(f=>({...f,name:e.target.value}))} placeholder="e.g. DPD 2026 Imported"/></div>)}
            {formRow('Effective Date', <div className="pill-input-wrap" style={{ height:34 }}><input type="date" value={importForm.effective_date} onChange={e => setImportForm(f=>({...f,effective_date:e.target.value}))}/></div>)}
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Upload CSV file</label>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileUpload}
              style={{ fontSize:12, color:'#fff', padding:'6px 0' }}/>
          </div>
          {importForm.csv && (
            <div style={{ marginBottom:12, padding:10, background:'rgba(0,200,83,0.06)', border:'1px solid rgba(0,200,83,0.2)', borderRadius:8, fontSize:12, color:'#00C853' }}>
              ✓ {importForm.csv.trim().split('\n').length} rows loaded
            </div>
          )}
          {importError && <div style={{ marginBottom:12, color:'#E91E8C', fontSize:12 }}>{importError}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => importCsv.mutate(importForm)}
              disabled={!importForm.name.trim() || !importForm.csv.trim() || importCsv.isPending}
              className="btn-primary" style={{ fontSize:13, background:'#00BCD4', color:'#000' }}>
              <Upload size={13}/> {importCsv.isPending ? 'Importing…' : 'Import'}
            </button>
            <button onClick={() => { setShowImport(false); setImportError(''); }} className="btn-ghost" style={{ fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Clone dialog ── */}
      {showClone && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="moov-card" style={{ padding:24, width:420, border:'1px solid rgba(0,200,83,0.3)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#00C853', marginBottom:16 }}>Clone "{showClone.name}"</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
              {formRow('New Name *', <div className="pill-input-wrap" style={{ height:38 }}><input value={cloneForm.name} onChange={e => setCloneForm(f=>({...f,name:e.target.value}))} placeholder="e.g. 2026 Revised" autoFocus/></div>)}
              {formRow('Effective Date', <div className="pill-input-wrap" style={{ height:38 }}><input type="date" value={cloneForm.effective_date} onChange={e => setCloneForm(f=>({...f,effective_date:e.target.value}))}/></div>)}
              {formRow('Notes', <div className="pill-input-wrap" style={{ height:38 }}><input value={cloneForm.notes} onChange={e => setCloneForm(f=>({...f,notes:e.target.value}))} placeholder="Optional"/></div>)}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => cloneCard.mutate(cloneForm)} disabled={!cloneForm.name.trim() || cloneCard.isPending} className="btn-primary">
                <Copy size={13}/> Clone
              </button>
              <button onClick={() => setShowClone(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply % increase dialog ── */}
      {showIncrease && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="moov-card" style={{ padding:24, width:440, border:'1px solid rgba(255,193,7,0.35)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#FFC107', marginBottom:6 }}>Apply Rate Increase</h3>
            <p style={{ fontSize:12, color:'#888', marginBottom:16 }}>
              Clones "{showIncrease.name}" and multiplies all prices by the uplift percentage.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              {formRow('New Card Name *', <div className="pill-input-wrap" style={{ height:38 }}><input value={incForm.name} onChange={e => setIncForm(f=>({...f,name:e.target.value}))} placeholder="e.g. 2026 Rate Increase" autoFocus/></div>)}
              {formRow('Uplift % *', <div className="pill-input-wrap" style={{ height:38 }}>
                <input type="number" step="0.1" value={incForm.pct} onChange={e => setIncForm(f=>({...f,pct:e.target.value}))} placeholder="4.0"/>
                <span style={{ padding:'0 14px 0 4px', color:'#FFC107', fontSize:13, fontWeight:700 }}>%</span>
              </div>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {formRow('Effective Date', <div className="pill-input-wrap" style={{ height:38 }}><input type="date" value={incForm.effective_date} onChange={e => setIncForm(f=>({...f,effective_date:e.target.value}))}/></div>)}
              {formRow('Notes', <div className="pill-input-wrap" style={{ height:38 }}><input value={incForm.notes} onChange={e => setIncForm(f=>({...f,notes:e.target.value}))} placeholder="Optional"/></div>)}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => applyIncrease.mutate(incForm)}
                disabled={!incForm.name.trim() || !incForm.pct || applyIncrease.isPending}
                className="btn-primary" style={{ background:'rgba(255,193,7,0.2)', border:'1px solid rgba(255,193,7,0.5)', color:'#FFC107' }}>
                <TrendingUp size={13}/> Apply
              </button>
              <button onClick={() => setShowIncrease(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate card list ── */}
      {cards.length === 0 && (
        <div className="moov-card" style={{ padding:40, textAlign:'center', color:'#555', fontSize:13 }}>
          No rate cards yet — create one or import a CSV
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {cards.map(card => {
          const badge = statusBadge(card);
          const isOpen = expandedId === card.id;

          return (
            <div key={card.id} className="moov-card" style={{ overflow:'hidden', border: card.is_active || card.is_master ? '1px solid rgba(0,200,83,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
              {/* Card header */}
              <div
                onClick={() => setExpandedId(isOpen ? null : card.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', cursor:'pointer', background: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent' }}
              >
                {isOpen ? <ChevronDown size={15} color="#AAAAAA"/> : <ChevronRight size={15} color="#AAAAAA"/>}

                <CourierLogo code={courierCode} color={carrierColor(courierCode)} size={32} radius={7} />

                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{card.name}</span>
                    <span style={{ ...pill(badge.bg, badge.color), fontSize:11 }}>{badge.label}</span>
                    {card.is_master && <span style={{ ...pill('rgba(123,47,190,0.15)', '#7B2FBE'), fontSize:10 }}>MASTER</span>}
                    {card.customer_account_number && (
                      <span style={{ ...pill('rgba(0,188,212,0.12)', '#00BCD4'), fontSize:11, fontFamily:'monospace' }}>
                        {card.customer_account_number}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color:'#555', marginTop:3 }}>
                    {card.band_count} bands
                    {card.effective_date && ` · Effective: ${new Date(card.effective_date).toLocaleDateString('en-GB')}`}
                    {card.notes && ` · ${card.notes}`}
                    {card.created_at && ` · Created: ${new Date(card.created_at).toLocaleDateString('en-GB')}`}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:6, alignItems:'center' }} onClick={e => e.stopPropagation()}>
                  {/* Customer account link */}
                  {editingAcct === card.id ? (
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <div className="pill-input-wrap" style={{ height:28, width:130 }}>
                        <input
                          autoFocus
                          value={acctDraft}
                          onChange={e => setAcctDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') updateCardAcct.mutate({ id: card.id, customer_account_number: acctDraft || null });
                            if (e.key === 'Escape') setEditingAcct(null);
                          }}
                          placeholder="Account no."
                          style={{ fontSize:11 }}
                        />
                      </div>
                      <button onClick={() => updateCardAcct.mutate({ id: card.id, customer_account_number: acctDraft || null })}
                        style={{ background:'none', border:'none', color:'#00C853', cursor:'pointer', padding:'2px 4px' }}>
                        <Check size={12}/>
                      </button>
                      <button onClick={() => setEditingAcct(null)}
                        style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:'2px 4px' }}>
                        <X size={12}/>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingAcct(card.id); setAcctDraft(card.customer_account_number || ''); }}
                      title="Link to customer account number"
                      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:9999, fontSize:11, fontWeight:700,
                        background: card.customer_account_number ? 'rgba(0,188,212,0.1)' : 'rgba(255,255,255,0.05)',
                        color: card.customer_account_number ? '#00BCD4' : '#555',
                        border: `1px solid ${card.customer_account_number ? 'rgba(0,188,212,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        cursor:'pointer', fontFamily: card.customer_account_number ? 'monospace' : 'inherit' }}>
                      {card.customer_account_number || '+ Account'}
                    </button>
                  )}
                  {/* Export */}
                  <a href={carrierRateCardsApi.exportCsvUrl(card.id)} download
                    style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(0,188,212,0.1)', color:'#00BCD4', border:'1px solid rgba(0,188,212,0.3)', textDecoration:'none', cursor:'pointer' }}>
                    <Download size={11}/> Export
                  </a>
                  {/* Clone */}
                  <button onClick={() => { setShowClone(card); setCloneForm({ name: card.name + ' (Copy)', effective_date:'', notes:'' }); }}
                    style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.06)', color:'#AAAAAA', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer' }}>
                    <Copy size={11}/> Clone
                  </button>
                  {/* Apply % increase */}
                  <button onClick={() => { setShowIncrease(card); setIncForm({ name:'', pct:'', effective_date:'', notes:'' }); }}
                    style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(255,193,7,0.1)', color:'#FFC107', border:'1px solid rgba(255,193,7,0.3)', cursor:'pointer' }}>
                    <TrendingUp size={11}/> Rate Increase
                  </button>
                  {/* Activate (non-master, inactive) */}
                  {!card.is_master && !card.is_active && (
                    <button onClick={() => activateCard.mutate(card.id)}
                      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(0,200,83,0.1)', color:'#00C853', border:'1px solid rgba(0,200,83,0.3)', cursor:'pointer' }}>
                      <CheckCircle size={11}/> Activate Now
                    </button>
                  )}
                  {/* Delete (non-master only) */}
                  {!card.is_master && (
                    <button onClick={() => { if (window.confirm(`Delete "${card.name}"?`)) deleteCard.mutate(card.id); }}
                      style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:'4px 6px' }}>
                      <Trash2 size={12}/>
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded: service/band breakdown */}
              {isOpen && (
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'0 18px 18px' }}>
                  {bandsLoading ? (
                    <div style={{ padding:24, textAlign:'center', color:'#555', fontSize:13 }}>Loading bands…</div>
                  ) : !bandsData?.services?.length ? (
                    <div style={{ padding:24, textAlign:'center', color:'#555', fontSize:13, fontStyle:'italic' }}>
                      No bands in this rate card yet. Clone an existing card or import a CSV to populate.
                    </div>
                  ) : (
                    <div style={{ marginTop:16 }}>
                      {/* Domestic services — inline */}
                      {bandsData.services.filter(s => s.service_type === 'domestic').length > 0 && (
                        <div style={{ marginBottom:24 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#00C853', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                            Domestic Services
                          </div>
                          {bandsData.services.filter(s => s.service_type === 'domestic').map(svc => (
                            <DomesticServiceBands key={svc.service_id} svc={svc} cardId={card.id}
                              onUpdateBand={updateBand} />
                          ))}
                        </div>
                      )}
                      {/* International services — compact summary */}
                      {bandsData.services.filter(s => s.service_type === 'international').length > 0 && (
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:'#7B2FBE', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                            International Services
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:8 }}>
                            {bandsData.services.filter(s => s.service_type === 'international').map(svc => (
                              <IntlServiceCard key={svc.service_id} svc={svc} cardId={card.id}
                                onUpdateBand={updateBand} />
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Unclassified services */}
                      {bandsData.services.filter(s => !s.service_type).length > 0 && (
                        <div style={{ marginTop:16 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                            Other Services
                          </div>
                          {bandsData.services.filter(s => !s.service_type).map(svc => (
                            <DomesticServiceBands key={svc.service_id} svc={svc} cardId={card.id}
                              onUpdateBand={updateBand} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Domestic service with inline editable bands ─────────────────────────────

function DomesticServiceBands({ svc, cardId, onUpdateBand }) {
  const [open, setOpen] = useState(false);
  const totalBands = svc.zones.reduce((a, z) => a + z.bands.length, 0);

  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, marginBottom:8, overflow:'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', background: open ? 'rgba(255,255,255,0.03)' : 'transparent' }}
      >
        {open ? <ChevronDown size={13} color="#AAAAAA"/> : <ChevronRight size={13} color="#AAAAAA"/>}
        <span style={{ fontWeight:600, fontSize:13, color:'#fff', flex:1 }}>{svc.service_name}</span>
        <span style={{ fontFamily:'monospace', fontSize:11, color:'#00C853', background:'rgba(0,200,83,0.08)', padding:'1px 8px', borderRadius:9999 }}>{svc.service_code}</span>
        <span style={{ fontSize:11, color:'#555' }}>{totalBands} band{totalBands!==1?'s':''}</span>
      </div>

      {open && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:12 }}>
          {svc.zones.map(zone => (
            <div key={zone.zone_id} style={{ marginBottom:12 }}>
              {svc.zones.length > 1 && (
                <div style={{ fontSize:11, color:'#7B2FBE', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
                  {zone.zone_name}
                </div>
              )}
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ textAlign:'left', padding:'4px 8px', color:'#555', fontWeight:600, fontSize:11 }}>Min kg</th>
                    <th style={{ textAlign:'left', padding:'4px 8px', color:'#555', fontWeight:600, fontSize:11 }}>Max kg</th>
                    <th style={{ textAlign:'right', padding:'4px 8px', color:'#00C853', fontWeight:600, fontSize:11 }}>1st Item</th>
                    <th style={{ textAlign:'right', padding:'4px 8px', color:'#FFC107', fontWeight:600, fontSize:11 }}>Sub Items</th>
                  </tr>
                </thead>
                <tbody>
                  {zone.bands.sort((a,b) => a.min_weight_kg - b.min_weight_kg).map(band => (
                    <BandRow key={band.band_id} band={band} onUpdate={(data) => onUpdateBand.mutate({ bandId: band.band_id, ...data })} />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BandRow({ band, onUpdate }) {
  const [editFirst, setEditFirst] = useState(false);
  const [editSub,   setEditSub]   = useState(false);
  const [valFirst,  setValFirst]  = useState(parseFloat(band.price_first).toFixed(2));
  const [valSub,    setValSub]    = useState(band.price_sub ? parseFloat(band.price_sub).toFixed(2) : '');

  function commitFirst() {
    const v = parseFloat(valFirst);
    if (!isNaN(v) && v >= 0) onUpdate({ price_first: v });
    else setValFirst(parseFloat(band.price_first).toFixed(2));
    setEditFirst(false);
  }
  function commitSub() {
    const v = parseFloat(valSub);
    if (!isNaN(v) && v >= 0) onUpdate({ price_sub: v });
    else setValSub(band.price_sub ? parseFloat(band.price_sub).toFixed(2) : '');
    setEditSub(false);
  }

  return (
    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
      <td style={{ padding:'5px 8px', color:'#AAAAAA', fontFamily:'monospace' }}>{parseFloat(band.min_weight_kg).toFixed(3)}</td>
      <td style={{ padding:'5px 8px', color:'#AAAAAA', fontFamily:'monospace' }}>{parseFloat(band.max_weight_kg).toFixed(3)}</td>
      <td style={{ padding:'5px 8px', textAlign:'right' }}>
        {editFirst ? (
          <input value={valFirst} onChange={e => setValFirst(e.target.value)}
            onBlur={commitFirst} onKeyDown={e => { if (e.key==='Enter') commitFirst(); if (e.key==='Escape') { setValFirst(parseFloat(band.price_first).toFixed(2)); setEditFirst(false); }}}
            autoFocus style={{ width:80, textAlign:'right', fontFamily:'monospace', fontSize:12, color:'#00C853', fontWeight:700, background:'rgba(0,200,83,0.08)', border:'1px solid rgba(0,200,83,0.4)', borderRadius:9999, padding:'2px 8px' }}/>
        ) : (
          <span onClick={() => setEditFirst(true)} title="Click to edit"
            style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#00C853', cursor:'pointer', padding:'2px 8px', borderRadius:9999, border:'1px solid rgba(0,200,83,0.2)', background:'rgba(0,200,83,0.06)' }}>
            £{parseFloat(band.price_first).toFixed(2)}
          </span>
        )}
      </td>
      <td style={{ padding:'5px 8px', textAlign:'right' }}>
        {editSub ? (
          <input value={valSub} onChange={e => setValSub(e.target.value)}
            onBlur={commitSub} onKeyDown={e => { if (e.key==='Enter') commitSub(); if (e.key==='Escape') { setValSub(band.price_sub ? parseFloat(band.price_sub).toFixed(2):''); setEditSub(false); }}}
            autoFocus style={{ width:80, textAlign:'right', fontFamily:'monospace', fontSize:12, color:'#FFC107', fontWeight:700, background:'rgba(255,193,7,0.08)', border:'1px solid rgba(255,193,7,0.4)', borderRadius:9999, padding:'2px 8px' }}/>
        ) : (
          <span onClick={() => setEditSub(true)} title="Click to edit"
            style={{ fontFamily:'monospace', fontSize:12, color: band.price_sub ? '#FFC107' : '#333', cursor:'pointer', padding:'2px 8px', borderRadius:9999, border:'1px solid rgba(255,255,255,0.06)' }}>
            {band.price_sub ? `£${parseFloat(band.price_sub).toFixed(2)}` : '—'}
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── International service summary card ─────────────────────────────────────

function IntlServiceCard({ svc, onUpdateBand }) {
  const [showModal, setShowModal] = useState(false);
  const totalBands = svc.zones.reduce((a, z) => a + z.bands.length, 0);

  return (
    <>
      <div style={{ border:'1px solid rgba(123,47,190,0.2)', borderRadius:10, padding:'12px 14px', background:'rgba(123,47,190,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ fontWeight:600, fontSize:13, color:'#fff', flex:1 }}>{svc.service_name}</span>
          <span style={{ fontFamily:'monospace', fontSize:10, color:'#7B2FBE', background:'rgba(123,47,190,0.12)', padding:'1px 7px', borderRadius:9999 }}>{svc.service_code}</span>
        </div>
        <div style={{ fontSize:12, color:'#555', marginBottom:10 }}>
          {svc.zones.length} zone{svc.zones.length!==1?'s':''} · {totalBands} band{totalBands!==1?'s':''}
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:9999, fontSize:11, fontWeight:700, background:'rgba(123,47,190,0.12)', color:'#7B2FBE', border:'1px solid rgba(123,47,190,0.3)', cursor:'pointer' }}>
          <FileText size={11}/> View / Edit Rates
        </button>
      </div>

      {showModal && (
        <IntlRateCardModal svc={svc} onClose={() => setShowModal(false)} onUpdateBand={onUpdateBand} />
      )}
    </>
  );
}

function IntlRateCardModal({ svc, onClose, onUpdateBand }) {
  const totalBands = svc.zones.reduce((a, z) => a + z.bands.length, 0);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9100, background:'rgba(8,9,26,0.97)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:16, background:'#0A0B1E', flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:700, color:'#fff' }}>{svc.service_name}</div>
          <div style={{ fontSize:12, color:'#AAAAAA', marginTop:2 }}>
            <span style={{ color:'#7B2FBE', fontFamily:'monospace', fontWeight:700, marginRight:10 }}>{svc.service_code}</span>
            {svc.zones.length} zones · {totalBands} bands
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#AAAAAA', cursor:'pointer', fontSize:20 }}>×</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:24 }}>
        {svc.zones.map(zone => (
          <div key={zone.zone_id} style={{ marginBottom:24 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:'#7B2FBE', marginBottom:10 }}>{zone.zone_name}</h3>
            <table style={{ width:'100%', maxWidth:600, borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign:'left', padding:'4px 10px', color:'#555', fontWeight:600, fontSize:11 }}>Min kg</th>
                  <th style={{ textAlign:'left', padding:'4px 10px', color:'#555', fontWeight:600, fontSize:11 }}>Max kg</th>
                  <th style={{ textAlign:'right', padding:'4px 10px', color:'#00C853', fontWeight:600, fontSize:11 }}>1st Item</th>
                  <th style={{ textAlign:'right', padding:'4px 10px', color:'#FFC107', fontWeight:600, fontSize:11 }}>Sub Items</th>
                </tr>
              </thead>
              <tbody>
                {zone.bands.sort((a,b) => a.min_weight_kg - b.min_weight_kg).map(band => (
                  <BandRow key={band.band_id} band={band} onUpdate={(data) => onUpdateBand.mutate({ bandId: band.band_id, ...data })} />
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AddConditionRow — reusable condition builder row ────────────────────────

const SEL = { height:32, background:'#13131F', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#ccc', fontSize:12, padding:'0 8px', cursor:'pointer' };

function AddConditionRow({ onAdd }) {
  const [field, setField] = useState('total_weight_kg');
  const [op,    setOp   ] = useState('gte');
  const [val,   setVal  ] = useState('');

  const ops = opsFor(field);

  const handleFieldChange = (newField) => {
    setField(newField);
    const validOps = opsFor(newField).map(o => o.key);
    if (!validOps.includes(op)) setOp(validOps[0]);
    setVal('');
  };

  const commit = () => {
    if (!val.trim()) return;
    const isListOp = op === 'in' || op === 'not_in';
    const value = isListOp
      ? val.split(',').map(s => s.trim()).filter(Boolean)
      : (SURCHARGE_FIELDS.find(f => f.key === field)?.type === 'number' ? parseFloat(val) : val.trim());
    onAdd({ field, op, value });
    setVal('');
  };

  const isListOp = op === 'in' || op === 'not_in';
  const placeholder = isListOp ? 'e.g. GB, IE, FR' : (SURCHARGE_FIELDS.find(f=>f.key===field)?.type==='number' ? 'e.g. 30' : 'value');

  return (
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <select value={field} onChange={e => handleFieldChange(e.target.value)} style={{ ...SEL, flex:'0 0 auto', minWidth:170 }}>
        {SURCHARGE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
      <select value={op} onChange={e => setOp(e.target.value)} style={{ ...SEL, flex:'0 0 auto', minWidth:120 }}>
        {ops.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <input
        value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && commit()}
        placeholder={placeholder}
        style={{ ...SEL, color:'#fff', flex:'1 1 90px', minWidth:80, maxWidth:160 }}
      />
      <button
        onClick={commit} disabled={!val.trim()}
        style={{ height:32, padding:'0 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color: val.trim() ? '#fff' : '#555', fontSize:12, cursor: val.trim() ? 'pointer' : 'default', whiteSpace:'nowrap', flexShrink:0 }}
      >+ Add</button>
    </div>
  );
}

// ─── Surcharge rules engine constants ────────────────────────────────────────

const SURCHARGE_FIELDS = [
  { key:'total_weight_kg',      label:'Total Weight (kg)',        type:'number' },
  { key:'parcel_weight_kg',     label:'Per-Parcel Weight (kg)',   type:'number' },
  { key:'parcel_count',         label:'Parcel Count',             type:'number' },
  { key:'dim_length_cm',        label:'Length (cm)',              type:'number' },
  { key:'dim_width_cm',         label:'Width (cm)',               type:'number' },
  { key:'dim_height_cm',        label:'Height (cm)',              type:'number' },
  { key:'total_declared_value', label:'Declared Value (£)',       type:'number' },
  { key:'parcel_declared_value',label:'Per-Parcel Value (£)',     type:'number' },
  { key:'dc_service_id',        label:'DC Service ID',            type:'number' },
  { key:'ship_to_country_iso',  label:'Destination Country ISO',  type:'string' },
  { key:'ship_to_postcode',     label:'Destination Postcode',     type:'string' },
  { key:'ship_from_country_iso',label:'Origin Country ISO',       type:'string' },
  { key:'service_name',         label:'Service Name',             type:'string' },
  { key:'courier',              label:'Courier Code',             type:'string' },
];

const OPS_NUMBER = [
  { key:'gte',    label:'≥ at least' },
  { key:'lte',    label:'≤ at most' },
  { key:'gt',     label:'> greater than' },
  { key:'lt',     label:'< less than' },
  { key:'eq',     label:'= equals' },
  { key:'not_eq', label:'≠ not equals' },
];

const OPS_STRING = [
  { key:'eq',          label:'= equals' },
  { key:'not_eq',      label:'≠ not equals' },
  { key:'in',          label:'in (comma list)' },
  { key:'not_in',      label:'not in (comma list)' },
  { key:'contains',    label:'contains' },
  { key:'starts_with', label:'starts with' },
];

function opsFor(fieldKey) {
  const f = SURCHARGE_FIELDS.find(x => x.key === fieldKey);
  return f?.type === 'number' ? OPS_NUMBER : OPS_STRING;
}

function fieldLabel(key) {
  return SURCHARGE_FIELDS.find(f => f.key === key)?.label || key;
}

function opLabel(op) {
  return [...OPS_NUMBER, ...OPS_STRING].find(o => o.key === op)?.label || op;
}

function formatCondValue(op, val) {
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

function condToValue(op, raw) {
  if (op === 'in' || op === 'not_in') {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  const num = parseFloat(raw);
  return isNaN(num) ? raw : num;
}

// ─── Customer Rate Card Templates Tab ─────────────────────────────────────────

function CustomerRcTemplatesTab({ courierCode, courierName }) {
  const qc = useQueryClient();
  const [expanded, setExpanded]   = useState(null);   // template id being viewed
  const [creating, setCreating]   = useState(false);
  const [cloneTarget, setClone]   = useState(null);   // template to clone
  const [editing, setEditing]     = useState(null);   // id being name-edited
  const [editName, setEditName]   = useState('');
  const [newName, setNewName]     = useState('');
  const [confirmDel, setConfirmDel] = useState(null); // template id to delete
  const [rateEdits, setRateEdits] = useState({});     // { [templateId]: rate[] }
  const [loadingCarrier, setLoadingCarrier] = useState(null); // template id being loaded
  const [openSvcs,      setOpenSvcs]      = useState(new Set()); // domestic service keys expanded
  const [openIntlSvcs,  setOpenIntlSvcs]  = useState(new Set()); // intl service keys expanded
  const [globalIntlPct, setGlobalIntlPct] = useState('');        // "apply to all intl" input
  const [includeBespoke, setIncludeBespoke] = useState(false);   // load bespoke services too

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['pricing-templates', courierCode],
    queryFn:  () => fetch(`/api/pricing/templates?courier_code=${courierCode}&active=true`).then(r => r.json()),
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['pricing-categories'],
    queryFn:  () => fetch('/api/pricing/categories').then(r => r.json()),
  });

  const apiFetch = (url, opts = {}) =>
    fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(r => r.json().then(d => { if (!r.ok) throw new Error(d.error || 'Error'); return d; }));

  const createMut = useMutation({
    mutationFn: (name) => apiFetch('/api/pricing/templates', { method: 'POST',
      body: { name, courier_code: courierCode, rates: [], surcharge_markups: [] } }),
    onSuccess: () => { qc.invalidateQueries(['pricing-templates', courierCode]); setCreating(false); setNewName(''); },
  });

  const cloneMut = useMutation({
    mutationFn: ({ id, name }) => apiFetch('/api/pricing/templates', { method: 'POST',
      body: { ...cloneTarget, name, courier_code: courierCode, id: undefined, created_at: undefined, updated_at: undefined, created_by: undefined } }),
    onSuccess: () => { qc.invalidateQueries(['pricing-templates', courierCode]); setClone(null); setNewName(''); },
  });

  const renameMut = useMutation({
    mutationFn: ({ id, name }) => apiFetch(`/api/pricing/templates/${id}`, { method: 'PUT', body: { name } }),
    onSuccess: () => { qc.invalidateQueries(['pricing-templates', courierCode]); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => apiFetch(`/api/pricing/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries(['pricing-templates', courierCode]); setConfirmDel(null); },
  });

  const saveRatesMut = useMutation({
    mutationFn: ({ id, rates }) => apiFetch(`/api/pricing/templates/${id}`, { method: 'PUT', body: { rates } }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(['pricing-templates', courierCode]);
      setRateEdits(p => { const n = { ...p }; delete n[id]; return n; });
    },
  });

  const getRates = (t) => rateEdits[t.id] !== undefined ? rateEdits[t.id] : (t.rates || []);
  const setRates = (id, rates) => setRateEdits(p => ({ ...p, [id]: rates }));
  const isDirty  = (id) => rateEdits[id] !== undefined;

  const addRow = (tpl, intl) => {
    const current = getRates(tpl);
    setRates(tpl.id, [...current, { service_code: '', service_name: '', zone_name: '', price: '', price_sub: '', cost_price: null, is_international: intl }]);
  };

  // Apply a % markup to cost_price and write the result into price
  const applyMarkup = (tpl, idx, pct) => {
    const rows = getRates(tpl);
    const row  = rows[idx];
    const cost = parseFloat(row.cost_price);
    const mkp  = parseFloat(pct);
    const newPrice = (!isNaN(cost) && !isNaN(mkp)) ? (cost * (1 + mkp / 100)).toFixed(2) : row.price;
    setRates(tpl.id, rows.map((r, i) => i === idx ? { ...r, markup_pct: pct, price: newPrice } : r));
  };

  // Apply one markup % across every international zone in a template
  const applyGlobalIntlMarkup = (tpl, pct) => {
    const mkp = parseFloat(pct);
    if (isNaN(mkp)) return;
    const updated = getRates(tpl).map(r => {
      if (!r.is_international) return r;
      const cost = parseFloat(r.cost_price);
      const newPrice = !isNaN(cost) ? (cost * (1 + mkp / 100)).toFixed(2) : r.price;
      return { ...r, markup_pct: pct, price: newPrice };
    });
    setRates(tpl.id, updated);
  };

  const toggleSvc = (key) => setOpenSvcs(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleIntl = (key) => setOpenIntlSvcs(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const loadFromCarrier = async (tpl) => {
    setLoadingCarrier(tpl.id);
    try {
      const url = `/api/pricing/carrier-services?courier_code=${courierCode}${includeBespoke ? '&include_bespoke=true' : ''}`;
      const svc = await fetch(url).then(r => r.json());
      const current = getRates(tpl);
      const existing = new Set(current.map(r => `${r.service_code}__${r.zone_name}`));
      const newRows = svc
        .filter(s => !existing.has(`${s.service_code}__${s.zone_name}`))
        .map(s => ({
          service_code:    s.service_code,
          service_name:    s.service_name,
          zone_name:       s.zone_name,
          price:           '',
          price_sub:       '',
          cost_price:      s.cost_price,
          cost_price_sub:  s.cost_price_sub,
          is_international: s.is_international,
        }));
      setRates(tpl.id, [...current, ...newRows]);
    } finally {
      setLoadingCarrier(null);
    }
  };
  const removeRow = (tpl, idx) => setRates(tpl.id, getRates(tpl).filter((_, i) => i !== idx));
  const updateRow = (tpl, idx, field, val) =>
    setRates(tpl.id, getRates(tpl).map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const inputSt = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 5, padding: '4px 8px', color: '#fff', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  const markupPct = (sell, cost) => {
    if (!sell || !cost || parseFloat(cost) === 0) return null;
    return ((parseFloat(sell) - parseFloat(cost)) / parseFloat(cost)) * 100;
  };

  if (isLoading) return <div style={{ padding: 32, color: '#555', fontSize: 13 }}>Loading templates…</div>;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#A5B4FC' }}>
            Customer Rate Card Templates — {courierName}
          </h2>
          <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
            Build sell-price templates here, then pick them when creating a prospect rate card.
          </div>
        </div>
        <button onClick={() => setCreating(p => !p)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 8, color: '#A5B4FC', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={13} /> New Template
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9, padding: '12px 16px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Template name, e.g. Standard DPD 2025"
            style={{ ...inputSt, flex: 1, padding: '7px 11px', fontSize: 13 }}
            onKeyDown={e => e.key === 'Enter' && newName.trim() && createMut.mutate(newName.trim())} />
          <button onClick={() => createMut.mutate(newName.trim())} disabled={!newName.trim() || createMut.isPending}
            style={{ padding: '7px 16px', background: 'rgba(99,102,241,0.2)', border: '1px solid #6366F1',
              borderRadius: 7, color: '#A5B4FC', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !newName.trim() ? 0.5 : 1 }}>
            Create
          </button>
          <button onClick={() => { setCreating(false); setNewName(''); }}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 6 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Clone form */}
      {cloneTarget && (
        <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center',
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 9, padding: '12px 16px' }}>
          <span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>Clone "{cloneTarget.name}" as:</span>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="New template name"
            style={{ ...inputSt, flex: 1, padding: '7px 11px', fontSize: 13 }} />
          <button onClick={() => cloneMut.mutate({ id: cloneTarget.id, name: newName.trim() })}
            disabled={!newName.trim() || cloneMut.isPending}
            style={{ padding: '7px 16px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 7, color: '#F59E0B', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !newName.trim() ? 0.5 : 1 }}>
            Clone
          </button>
          <button onClick={() => { setClone(null); setNewName(''); }}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 6 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Templates list */}
      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#444', fontSize: 14 }}>
          No templates yet for {courierName}. Click <strong style={{ color: '#A5B4FC' }}>New Template</strong> to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map(tpl => {
            const isOpen = expanded === tpl.id;
            const rates  = getRates(tpl);
            const domestic = rates.filter(r => !r.is_international);
            const intl     = rates.filter(r => r.is_international);
            const groupByCode = (rows) => Object.values(rows.reduce((acc, r) => {
              const k = r.service_code || r.service_name || '?';
              if (!acc[k]) acc[k] = { service_code: r.service_code, service_name: r.service_name, zones: [] };
              acc[k].zones.push(r);
              return acc;
            }, {}));
            const domesticServices = groupByCode(domestic);
            const intlServices     = groupByCode(intl);

            return (
              <div key={tpl.id} style={{ border: `1px solid ${isOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, overflow: 'hidden',
                background: isOpen ? 'rgba(99,102,241,0.03)' : 'rgba(255,255,255,0.02)' }}>

                {/* Template header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer' }}
                  onClick={() => setExpanded(p => p === tpl.id ? null : tpl.id)}>
                  {editing === tpl.id ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)} onClick={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key === 'Enter') renameMut.mutate({ id: tpl.id, name: editName }); if (e.key === 'Escape') setEditing(null); }}
                      style={{ ...inputSt, flex: 1, padding: '5px 9px', fontSize: 13, fontWeight: 700 }} autoFocus />
                  ) : (
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#DDD' }}>{tpl.name}</div>
                  )}

                  <div style={{ fontSize: 11, color: '#555' }}>
                    {domestic.length} domestic · {intl.length} intl
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {editing === tpl.id ? (
                      <>
                        <button onClick={() => renameMut.mutate({ id: tpl.id, name: editName })}
                          style={{ background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 5, padding: '3px 10px', color: '#00C853', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Save
                        </button>
                        <button onClick={() => setEditing(null)}
                          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditing(tpl.id); setEditName(tpl.name); }}
                          title="Rename"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '3px 9px', color: '#888', fontSize: 11, cursor: 'pointer' }}>
                          Rename
                        </button>
                        <button onClick={() => { setClone(tpl); setNewName(`${tpl.name} (copy)`); }}
                          title="Clone"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 5, padding: '3px 9px', color: '#F59E0B', fontSize: 11, cursor: 'pointer' }}>
                          Clone
                        </button>
                        <button onClick={() => setConfirmDel(tpl.id)}
                          title="Delete"
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, padding: '3px 9px', color: '#EF4444', fontSize: 11, cursor: 'pointer' }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  <div style={{ color: '#444', marginLeft: 4 }}>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Delete confirm */}
                {confirmDel === tpl.id && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', borderTop: '1px solid rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#F87171' }}>
                    <span>Delete "{tpl.name}"? This cannot be undone.</span>
                    <button onClick={() => deleteMut.mutate(tpl.id)} disabled={deleteMut.isPending}
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: '4px 14px', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Yes, Delete
                    </button>
                    <button onClick={() => setConfirmDel(null)}
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                )}

                {/* Expanded rate editor */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 14px 16px' }}>

                    {/* Load from carrier */}
                    <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <button onClick={() => loadFromCarrier(tpl)} disabled={loadingCarrier === tpl.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.35)',
                          borderRadius: 7, padding: '7px 14px', color: '#A5B4FC',
                          fontSize: 12, fontWeight: 600, cursor: loadingCarrier === tpl.id ? 'wait' : 'pointer',
                          opacity: loadingCarrier === tpl.id ? 0.6 : 1 }}>
                        <RefreshCw size={12} style={{ animation: loadingCarrier === tpl.id ? 'spin 1s linear infinite' : 'none' }} />
                        {loadingCarrier === tpl.id ? 'Loading…' : `Load all ${courierName} services`}
                      </button>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={includeBespoke}
                          onChange={e => setIncludeBespoke(e.target.checked)}
                          style={{ accentColor: '#FB923C', width: 14, height: 14 }}
                        />
                        <span style={{ fontSize: 12, color: includeBespoke ? '#FB923C' : '#555', fontWeight: includeBespoke ? 600 : 400 }}>
                          Include bespoke services
                        </span>
                      </label>
                      <span style={{ fontSize: 11, color: '#444' }}>
                        Existing rows are preserved.
                      </span>
                    </div>

                    {rates.length === 0 && (
                      <div style={{ padding: '28px 0', textAlign: 'center', color: '#444', fontSize: 13, fontStyle: 'italic' }}>
                        No services yet — click the button above to populate from the master rate card.
                      </div>
                    )}

                    {/* ── DOMESTIC SERVICES ────────────────────────────────────── */}
                    {domesticServices.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#00C853', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                          Domestic Services
                        </div>
                        {domesticServices.map(svc => {
                          const svcKey = `${tpl.id}__${svc.service_code}`;
                          const svcOpen = openSvcs.has(svcKey);
                          return (
                            <div key={svcKey} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                              <div onClick={() => toggleSvc(svcKey)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                  cursor: 'pointer', background: svcOpen ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                                {svcOpen ? <ChevronDown size={13} color="#AAAAAA"/> : <ChevronRight size={13} color="#AAAAAA"/>}
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#fff', flex: 1 }}>{svc.service_name}</span>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#00C853', background: 'rgba(0,200,83,0.08)', padding: '1px 8px', borderRadius: 9999 }}>{svc.service_code}</span>
                                <span style={{ fontSize: 11, color: '#555' }}>{svc.zones.length} zone{svc.zones.length !== 1 ? 's' : ''}</span>
                              </div>
                              {svcOpen && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ textAlign: 'left',   padding: '4px 8px', color: '#555', fontWeight: 600, fontSize: 11 }}>Zone</th>
                                        <th style={{ textAlign: 'right',  padding: '4px 8px', color: '#555', fontWeight: 600, fontSize: 11 }}>Cost (1st)</th>
                                        <th style={{ textAlign: 'right',  padding: '4px 8px', color: '#A5B4FC', fontWeight: 600, fontSize: 11 }}>Markup %</th>
                                        <th style={{ textAlign: 'right',  padding: '4px 8px', color: '#00C853', fontWeight: 600, fontSize: 11 }}>Sell (1st)</th>
                                        <th style={{ textAlign: 'right',  padding: '4px 8px', color: '#FFC107', fontWeight: 600, fontSize: 11 }}>Sell (sub)</th>
                                        <th style={{ width: 28 }}></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {svc.zones.map(r => {
                                        const origIdx = rates.indexOf(r);
                                        return (
                                          <tr key={origIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '5px 8px', color: '#AAAAAA' }}>{r.zone_name || '—'}</td>
                                            <td style={{ padding: '5px 8px', textAlign: 'right', color: '#555', fontFamily: 'monospace' }}>
                                              {r.cost_price ? `£${parseFloat(r.cost_price).toFixed(2)}` : '—'}
                                            </td>
                                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                              <input value={r.markup_pct ?? ''} type="number" step="0.1" placeholder="—"
                                                onChange={e => applyMarkup(tpl, origIdx, e.target.value)}
                                                style={{ width: 64, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                                  color: '#A5B4FC', background: 'rgba(99,102,241,0.08)',
                                                  border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                            </td>
                                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                              <input value={r.price ?? ''} type="number" step="0.01" placeholder="0.00"
                                                onChange={e => updateRow(tpl, origIdx, 'price', e.target.value)}
                                                style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                                  color: '#00C853', fontWeight: 700, background: 'rgba(0,200,83,0.08)',
                                                  border: '1px solid rgba(0,200,83,0.3)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                            </td>
                                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                              <input value={r.price_sub ?? ''} type="number" step="0.01" placeholder="0.00"
                                                onChange={e => updateRow(tpl, origIdx, 'price_sub', e.target.value)}
                                                style={{ width: 72, textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                                                  color: '#FFC107', background: 'rgba(255,193,7,0.08)',
                                                  border: '1px solid rgba(255,193,7,0.3)', borderRadius: 9999, padding: '2px 8px', outline: 'none' }} />
                                            </td>
                                            <td style={{ padding: '5px 8px' }}>
                                              <button onClick={() => removeRow(tpl, origIdx)}
                                                style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 3 }}>
                                                <Trash2 size={11} />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── INTERNATIONAL SERVICES ───────────────────────────────── */}
                    {intlServices.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                          International Services
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                          {intlServices.map(svc => {
                            const svcKey = `${tpl.id}__intl__${svc.service_code}`;
                            const svcOpen = openIntlSvcs.has(svcKey);
                            const filledZones = svc.zones.filter(z => z.markup_pct || z.price).length;
                            return (
                              <div key={svcKey} style={{ border: '1px solid rgba(123,47,190,0.2)', borderRadius: 10,
                                background: 'rgba(123,47,190,0.04)', overflow: 'hidden' }}>
                                <div style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <span style={{ fontWeight: 600, fontSize: 13, color: '#fff', flex: 1 }}>{svc.service_name}</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#7B2FBE', background: 'rgba(123,47,190,0.12)', padding: '1px 7px', borderRadius: 9999 }}>{svc.service_code}</span>
                                  </div>
                                  <div style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
                                    {svc.zones.length} zone{svc.zones.length !== 1 ? 's' : ''}
                                    {filledZones > 0 && <span style={{ color: '#00C853', marginLeft: 8 }}>· {filledZones} priced</span>}
                                  </div>

                                  {/* Single markup % input — applies to all zones in this service */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                    <input
                                      type="number" step="0.1" placeholder="Markup %"
                                      defaultValue={svc.zones[0]?.markup_pct ?? ''}
                                      onBlur={e => {
                                        const pct = e.target.value;
                                        if (!pct) return;
                                        const updated = getRates(tpl).map(r => {
                                          if (r.service_code !== svc.service_code || !r.is_international) return r;
                                          const cost = parseFloat(r.cost_price);
                                          const mkp  = parseFloat(pct);
                                          return { ...r, markup_pct: pct, price: !isNaN(cost) && !isNaN(mkp) ? (cost * (1 + mkp / 100)).toFixed(2) : r.price };
                                        });
                                        setRates(tpl.id, updated);
                                      }}
                                      style={{ width: 80, textAlign: 'right', fontFamily: 'monospace', fontSize: 13,
                                        color: '#C084FC', fontWeight: 700, background: 'rgba(123,47,190,0.12)',
                                        border: '1px solid rgba(123,47,190,0.45)', borderRadius: 8, padding: '5px 10px', outline: 'none' }} />
                                    <span style={{ fontSize: 13, color: '#7B2FBE', fontWeight: 700 }}>%</span>
                                    <span style={{ fontSize: 11, color: '#555' }}>all zones</span>
                                  </div>

                                  <button onClick={() => toggleIntl(svcKey)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px',
                                      borderRadius: 9999, fontSize: 11, fontWeight: 700,
                                      background: svcOpen ? 'rgba(123,47,190,0.2)' : 'rgba(123,47,190,0.12)',
                                      color: '#9B59E8', border: '1px solid rgba(123,47,190,0.3)', cursor: 'pointer' }}>
                                    <FileText size={11}/> {svcOpen ? 'Hide Rates' : 'Edit Rates'}
                                  </button>
                                </div>
                                {svcOpen && (
                                  <div style={{ borderTop: '1px solid rgba(123,47,190,0.15)', padding: '10px 14px', maxHeight: 320, overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                          <th style={{ textAlign: 'left',  padding: '4px 6px', color: '#555', fontWeight: 600, fontSize: 10 }}>Zone</th>
                                          <th style={{ textAlign: 'right', padding: '4px 6px', color: '#555', fontWeight: 600, fontSize: 10 }}>Cost</th>
                                          <th style={{ textAlign: 'right', padding: '4px 6px', color: '#A5B4FC', fontWeight: 700, fontSize: 10 }}>Markup %</th>
                                          <th style={{ textAlign: 'right', padding: '4px 6px', color: '#00C853', fontWeight: 600, fontSize: 10 }}>Sell</th>
                                          <th style={{ width: 24 }}></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {svc.zones.map(r => {
                                          const origIdx = rates.indexOf(r);
                                          return (
                                            <tr key={origIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                              <td style={{ padding: '4px 6px', color: '#AAAAAA', fontSize: 11, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.zone_name || '—'}</td>
                                              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#555', fontFamily: 'monospace', fontSize: 11 }}>
                                                {r.cost_price ? `£${parseFloat(r.cost_price).toFixed(2)}` : '—'}
                                              </td>
                                              <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                                <input value={r.markup_pct ?? ''} type="number" step="0.1" placeholder="%"
                                                  onChange={e => applyMarkup(tpl, origIdx, e.target.value)}
                                                  style={{ width: 56, textAlign: 'right', fontFamily: 'monospace', fontSize: 11,
                                                    color: '#A5B4FC', fontWeight: 700, background: 'rgba(99,102,241,0.1)',
                                                    border: '1px solid rgba(99,102,241,0.4)', borderRadius: 9999, padding: '2px 6px', outline: 'none' }} />
                                              </td>
                                              <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                                <input value={r.price ?? ''} type="number" step="0.01" placeholder="0.00"
                                                  onChange={e => updateRow(tpl, origIdx, 'price', e.target.value)}
                                                  style={{ width: 60, textAlign: 'right', fontFamily: 'monospace', fontSize: 11,
                                                    color: '#00C853', background: 'rgba(0,200,83,0.08)',
                                                    border: '1px solid rgba(0,200,83,0.25)', borderRadius: 9999, padding: '2px 6px', outline: 'none' }} />
                                              </td>
                                              <td style={{ padding: '4px 6px' }}>
                                                <button onClick={() => removeRow(tpl, origIdx)}
                                                  style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 2 }}>
                                                  <Trash2 size={10} />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Save bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {isDirty(tpl.id) && (
                        <button onClick={() => setRateEdits(p => { const n = { ...p }; delete n[tpl.id]; return n; })}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 7, padding: '7px 14px', color: '#777', fontSize: 12, cursor: 'pointer' }}>
                          Discard
                        </button>
                      )}
                      <button onClick={() => saveRatesMut.mutate({ id: tpl.id, rates: getRates(tpl) })}
                        disabled={!isDirty(tpl.id) || saveRatesMut.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: 6,
                          background: isDirty(tpl.id) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isDirty(tpl.id) ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 7, padding: '7px 16px',
                          color: isDirty(tpl.id) ? '#A5B4FC' : '#444',
                          fontSize: 12, fontWeight: 700, cursor: isDirty(tpl.id) ? 'pointer' : 'default' }}>
                        <Save size={12} /> Save Rates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LEVEL 2 — Carrier detail (services list) ─────────────────────────────────

function CarrierDetail({ carrierId, onBack, onDrillService }) {
  const qc = useQueryClient();
  const [addingService, setAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ service_code:'', name:'', fuel_surcharge_pct:'' });
  const [addingGroup, setAddingGroup]   = useState(false);
  const [groupForm, setGroupForm]       = useState({ name:'', fuel_surcharge_pct:'' });
  const [carrierTab, setCarrierTab]     = useState('services'); // 'services' | 'rate-cards' | 'fuel' | 'surcharges'
  const [addingSurcharge, setAddingSurcharge] = useState(false);
  const [surchargeForm, setSurchargeForm] = useState({ code:'', name:'', description:'', calc_type:'flat', calc_base:'fixed', default_value:'', applies_when:'reconciliation', charge_per:'shipment' });
  const [expandedSurcharge, setExpandedSurcharge] = useState(null);
  const [editingSurcharge, setEditingSurcharge]   = useState(null);
  const [editSForm, setEditSForm]                 = useState({});
  const [addingRuleTo, setAddingRuleTo]           = useState(null);
  const [newRuleName, setNewRuleName]             = useState('');
  const [newRuleLogic, setNewRuleLogic]           = useState('AND');
  const [newRuleConditions, setNewRuleConditions] = useState([]);
  const [newCondField, setNewCondField]           = useState('total_weight_kg');
  const [newCondOp, setNewCondOp]                 = useState('gte');
  const [newCondVal, setNewCondVal]               = useState('');

  const { data: carrier, isLoading, refetch } = useQuery({
    queryKey: ['carrier-detail', carrierId],
    queryFn: () => api.get(`/carriers/couriers/${carrierId}`).then(r => r.data),
  });

  const { data: fuelGroups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['fuel-groups', carrierId],
    queryFn: () => api.get(`/carriers/couriers/${carrierId}/fuel-groups`).then(r => r.data),
  });

  const { data: surcharges = [], refetch: refetchSurcharges } = useQuery({
    queryKey: ['surcharges-carrier', carrierId],
    queryFn: () => api.get(`/surcharges?courier_id=${carrierId}`).then(r => r.data),
    enabled: !!carrierId,
  });

  const triggerBackfill = (courierCode) => {
    if (!courierCode) return;
    api.post(`/billing/batch-apply-surcharges?courier_code=${encodeURIComponent(courierCode)}`)
      .then(() => {
        // Invalidate Finance page stats so Total Value / Unbilled Value refresh
        qc.invalidateQueries(['billing-stats']);
        qc.invalidateQueries(['billing-charges']);
      })
      .catch(err => console.warn('[backfill] surcharge backfill error:', err.message));
  };

  const addSurcharge = useMutation({
    mutationFn: () => api.post('/surcharges', { ...surchargeForm, courier_id: carrierId, default_value: parseFloat(surchargeForm.default_value) || 0 }).then(r => r.data),
    onSuccess: (data) => {
      setAddingSurcharge(false);
      setSurchargeForm({ code:'', name:'', description:'', calc_type:'flat', calc_base:'fixed', default_value:'', applies_when:'reconciliation', charge_per:'shipment' });
      refetchSurcharges();
      if (data.applies_when === 'always') triggerBackfill(carrier.code);
    },
  });

  const patchSurcharge = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/surcharges/${id}`, data).then(r => r.data),
    onSuccess: (data) => {
      setEditingSurcharge(null);
      refetchSurcharges();
      if (data.applies_when === 'always') triggerBackfill(carrier.code);
    },
  });

  const delSurcharge = useMutation({
    mutationFn: (id) => api.delete(`/surcharges/${id}`).then(r => r.data),
    onSuccess: refetchSurcharges,
  });

  const addRule = useMutation({
    mutationFn: ({ surchargeId, name, logic, filters }) =>
      api.post(`/surcharges/${surchargeId}/rules`, { name, logic, filters }).then(r => r.data),
    onSuccess: () => {
      setAddingRuleTo(null); setNewRuleName(''); setNewRuleLogic('AND');
      setNewRuleConditions([]); setNewCondField('total_weight_kg'); setNewCondOp('gte'); setNewCondVal('');
      refetchSurcharges();
    },
  });

  const delRule = useMutation({
    mutationFn: ({ surchargeId, ruleId }) => api.delete(`/surcharges/${surchargeId}/rules/${ruleId}`).then(r => r.data),
    onSuccess: refetchSurcharges,
  });

  const patchRuleFilters = useMutation({
    mutationFn: ({ surchargeId, ruleId, filters }) =>
      api.patch(`/surcharges/${surchargeId}/rules/${ruleId}`, { filters }).then(r => r.data),
    onSuccess: refetchSurcharges,
  });

  const refetchAll = () => { refetch(); refetchGroups(); refetchSurcharges(); };

  const createGroup = useMutation({
    mutationFn: () => api.post(`/carriers/couriers/${carrierId}/fuel-groups`, {
      name: groupForm.name,
      fuel_surcharge_pct: parseFloat(groupForm.fuel_surcharge_pct) || 0,
    }).then(r => r.data),
    onSuccess: () => { setAddingGroup(false); setGroupForm({ name:'', fuel_surcharge_pct:'' }); refetchAll(); },
  });

  const updateServiceField = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/carriers/services/${id}`, data).then(r => r.data),
    onSuccess: refetchAll,
  });

  const addService = useMutation({
    mutationFn: () => carriersApi.createService({ ...serviceForm, courier_id: carrierId }),
    onSuccess: () => { setAddingService(false); setServiceForm({ service_code:'', name:'', fuel_surcharge_pct:'' }); refetch(); },
  });

  const delService = useMutation({
    mutationFn: (id) => carriersApi.deleteService(id),
    onSuccess: refetch,
  });

  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const reorder = useMutation({
    mutationFn: (ids) => api.put(`/carriers/couriers/${carrierId}/services/reorder`, { service_ids: ids }).then(r => r.data),
    onSuccess: refetch,
  });

  const onDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== overIdx) setOverIdx(idx);
  };
  const onDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const ids = carrier.services.map(s => s.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(idx, 0, moved);
    reorder.mutate(ids);
    setDragIdx(null);
    setOverIdx(null);
  };
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); };

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
        <CourierLogo code={carrier.code} color={color} size={40} radius={10} />
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

      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        {[
          { key:'services',   label:'Services' },
          { key:'rate-cards',   label:'Cost Rate Cards' },
          { key:'crc-templates', label:'Customer Rate Card Templates' },
          { key:'fuel',         label:'Fuel Groups' },
          { key:'surcharges',   label:`Surcharges${surcharges.length ? ` (${surcharges.length})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setCarrierTab(t.key)} style={{
            background:'none', border:'none', cursor:'pointer',
            padding:'10px 20px', fontSize:13, fontWeight:600,
            color: carrierTab===t.key ? '#00C853' : '#AAAAAA',
            borderBottom: carrierTab===t.key ? '2px solid #00C853' : '2px solid transparent',
            marginBottom:-1, transition:'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Services ── */}
      {carrierTab === 'services' && <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:'#7B2FBE', margin:0 }}>Services</h2>
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

      <div className="moov-card" style={{ overflow:'hidden', marginBottom: 32 }}>
        {(!carrier.services || carrier.services.length === 0) ? (
          <div style={{ padding:40, textAlign:'center', color:'#555', fontSize:13 }}>No services yet — add one above</div>
        ) : (
          <table className="moov-table">
            <thead>
              <tr>
                <th style={{ width:32 }}></th>
                <th>Service</th>
                <th>Code</th>
                <th>Type</th>
                <th>Bespoke</th>
                <th>Fuel Group</th>
                <th>Zones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrier.services.map((svc, idx) => {
                const typeColors = {
                  domestic:      { bg:'rgba(0,200,83,0.1)',    fg:'#00C853', label:'DOM' },
                  international: { bg:'rgba(123,47,190,0.12)', fg:'#7B2FBE', label:'INT' },
                };
                const tc = typeColors[svc.service_type];
                const nextType = svc.service_type === 'domestic' ? 'international'
                               : svc.service_type === 'international' ? null : 'domestic';

                return (
                  <tr
                    key={svc.id}
                    draggable
                    onDragStart={e => onDragStart(e, idx)}
                    onDragOver={e => onDragOver(e, idx)}
                    onDrop={e => onDrop(e, idx)}
                    onDragEnd={onDragEnd}
                    onClick={() => onDrillService(svc.id)}
                    style={{
                      cursor: dragIdx === idx ? 'grabbing' : 'pointer',
                      opacity: dragIdx === idx ? 0.4 : 1,
                      borderTop: overIdx === idx && dragIdx !== idx
                        ? '2px solid #7B2FBE' : '2px solid transparent',
                      transition: 'opacity 0.1s, border-color 0.1s',
                    }}
                    onMouseEnter={e => { if (dragIdx === null) e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                  >
                    {/* Drag handle */}
                    <td style={{ padding:'8px 10px', color:'#333', cursor:'grab' }}>
                      <GripVertical size={14}/>
                    </td>

                    <td style={{ fontWeight:600 }}>{svc.name}</td>
                    <td><span style={{ ...pill('rgba(0,200,83,0.08)','#00C853'), fontFamily:'monospace' }}>{svc.service_code}</span></td>

                    {/* Type badge — click to cycle DOM → INT → unset */}
                    <td onClick={e => e.stopPropagation()}>
                      <span
                        onClick={() => updateServiceField.mutate({ id: svc.id, service_type: nextType })}
                        title="Click to toggle type"
                        style={{
                          display:'inline-block', padding:'2px 9px', borderRadius:9999,
                          fontSize:11, fontWeight:700, cursor:'pointer', userSelect:'none',
                          background: tc ? tc.bg : 'rgba(255,255,255,0.04)',
                          color: tc ? tc.fg : '#555',
                        }}>
                        {tc ? tc.label : '—'}
                      </span>
                    </td>

                    {/* Bespoke toggle */}
                    <td onClick={e => e.stopPropagation()}>
                      <span
                        onClick={() => updateServiceField.mutate({ id: svc.id, is_bespoke: !svc.is_bespoke })}
                        title={svc.is_bespoke ? 'Bespoke — excluded from standard templates. Click to make standard.' : 'Standard — click to mark as bespoke'}
                        style={{
                          display: 'inline-block', padding: '2px 9px', borderRadius: 9999,
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', userSelect: 'none',
                          background: svc.is_bespoke ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.04)',
                          color: svc.is_bespoke ? '#FB923C' : '#444',
                          border: svc.is_bespoke ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        }}>
                        {svc.is_bespoke ? 'Bespoke' : '—'}
                      </span>
                    </td>

                    {/* Fuel group — inline dropdown */}
                    <td onClick={e => e.stopPropagation()} style={{ minWidth: 160 }}>
                      <select
                        value={svc.fuel_group_id ?? ''}
                        onChange={e => updateServiceField.mutate({
                          id: svc.id,
                          fuel_group_id: e.target.value ? parseInt(e.target.value) : null,
                        })}
                        style={{
                          background: '#0D0E2A',
                          border: '1px solid rgba(255,193,7,0.25)',
                          borderRadius: 9999,
                          color: svc.fuel_group_id ? '#FFC107' : '#555',
                          fontSize: 12,
                          fontWeight: svc.fuel_group_id ? 700 : 400,
                          padding: '3px 12px',
                          cursor: 'pointer',
                          outline: 'none',
                          width: '100%',
                        }}
                      >
                        <option value="">— None —</option>
                        {fuelGroups.map(fg => (
                          <option key={fg.id} value={fg.id}>
                            {fg.name} ({parseFloat(fg.fuel_surcharge_pct).toFixed(1)}%)
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ color:'#AAAAAA' }}>{svc.zone_count} zone{svc.zone_count!==1?'s':''}</td>
                    <td style={{ textAlign:'right', display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end' }}>
                      <span style={{ fontSize:12, color:'#AAAAAA' }}>View rate card</span>
                      <ChevronRight size={14} color="#AAAAAA"/>
                      <button onClick={e => { e.stopPropagation(); delService.mutate(svc.id); }}
                        style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:0 }}>
                        <Trash2 size={13}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      </> /* end carrierTab === 'services' */ }

      {/* ── Tab: Cost Rate Cards ── */}
      {carrierTab === 'rate-cards' && carrier && (
        <CarrierRateCardsTab courierId={carrier.id} courierCode={carrier.code} />
      )}

      {/* ── Tab: Customer Rate Card Templates ── */}
      {carrierTab === 'crc-templates' && carrier && (
        <CustomerRcTemplatesTab courierCode={carrier.code} courierName={carrier.name} />
      )}

      {/* ── Tab: Fuel Groups ── */}
      {carrierTab === 'fuel' && <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#FFC107', margin:0, display:'flex', alignItems:'center', gap:8 }}>
            <Zap size={16}/> Fuel Groups
          </h2>
          <button
            onClick={() => setAddingGroup(a => !a)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, height:34, padding:'0 16px', background:'rgba(255,193,7,0.12)', border:'1px solid rgba(255,193,7,0.35)', borderRadius:8, color:'#FFC107', fontSize:13, fontWeight:700, cursor:'pointer' }}
          >
            <Plus size={13}/> Add Fuel Group
          </button>
        </div>

        {addingGroup && (
          <div className="moov-card" style={{ padding:18, marginBottom:16, border:'1px solid rgba(255,193,7,0.3)', background:'rgba(255,193,7,0.03)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr auto auto', gap:10, alignItems:'flex-end' }}>
              <div>
                <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Group Name</label>
                <div className="pill-input-wrap" style={{ height:34 }}>
                  <input
                    value={groupForm.name}
                    onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. International Express"
                    autoFocus
                    style={{ fontSize:13 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Fuel Surcharge %</label>
                <div className="pill-input-wrap" style={{ height:34 }}>
                  <input
                    type="number" step="0.01" min="0"
                    value={groupForm.fuel_surcharge_pct}
                    onChange={e => setGroupForm(f => ({ ...f, fuel_surcharge_pct: e.target.value }))}
                    placeholder="0.00"
                    style={{ fontSize:13 }}
                  />
                  <div className="green-cap" style={{ fontSize:11, color:'#FFC107', background:'rgba(255,193,7,0.15)' }}>%</div>
                </div>
              </div>
              <button
                onClick={() => createGroup.mutate()}
                disabled={createGroup.isPending || !groupForm.name.trim()}
                className="btn-primary"
                style={{ height:34, background:'rgba(255,193,7,0.2)', border:'1px solid rgba(255,193,7,0.4)', color:'#FFC107' }}
              >
                <Check size={13}/>
              </button>
              <button onClick={() => setAddingGroup(false)} className="btn-ghost" style={{ height:34, padding:'0 10px' }}>✕</button>
            </div>
          </div>
        )}

        {fuelGroups.length === 0 && !addingGroup ? (
          <div className="moov-card" style={{ padding:32, textAlign:'center', color:'#555', fontSize:13, fontStyle:'italic' }}>
            No fuel groups yet — click Add Fuel Group to create one
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {fuelGroups.map(group => (
              <FuelGroupCard
                key={group.id}
                group={group}
                onRefresh={refetchAll}
              />
            ))}
          </div>
        )}
      </div>}  {/* end carrierTab === 'fuel' */}

      {/* ── Tab: Surcharges ── */}
      {carrierTab === 'surcharges' && <div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#E91E8C', margin:'0 0 4px' }}>Surcharges</h2>
            <p style={{ fontSize:12, color:'#888', margin:0 }}>Additional charges on top of base rate. Rules use AND/OR conditions on shipment fields to control when each fires.</p>
          </div>
          <button onClick={() => setAddingSurcharge(a => !a)} style={{ display:'inline-flex', alignItems:'center', gap:6, height:34, padding:'0 16px', background:'rgba(233,30,140,0.12)', border:'1px solid rgba(233,30,140,0.35)', borderRadius:8, color:'#E91E8C', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <Plus size={13}/> Add Surcharge
          </button>
        </div>

        {/* Create form */}
        {addingSurcharge && (
          <div className="moov-card" style={{ padding:18, marginBottom:16, border:'1px solid rgba(233,30,140,0.3)', background:'rgba(233,30,140,0.03)' }}>
            <h4 style={{ fontSize:13, fontWeight:700, color:'#E91E8C', margin:'0 0 14px' }}>New Surcharge</h4>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Code</label>
                <div className="pill-input-wrap"><input value={surchargeForm.code} onChange={e => setSurchargeForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="REMOTE_AREA" style={{ fontSize:13 }}/></div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Name</label>
                <div className="pill-input-wrap"><input value={surchargeForm.name} onChange={e => setSurchargeForm(f=>({...f,name:e.target.value}))} placeholder="Remote Area Delivery" style={{ fontSize:13 }}/></div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
              {[
                ['Type', <select value={surchargeForm.calc_type} onChange={e => setSurchargeForm(f=>({...f,calc_type:e.target.value}))} style={{ width:'100%', height:34, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, padding:'0 10px' }}><option value="flat">Flat £</option><option value="percentage">Percentage %</option></select>],
                ['Default Value', <div className="pill-input-wrap"><input type="number" step="0.01" value={surchargeForm.default_value} onChange={e => setSurchargeForm(f=>({...f,default_value:e.target.value}))} placeholder="0.00" style={{ fontSize:13 }}/><div className="green-cap" style={{ fontSize:11, color:'#E91E8C', background:'rgba(233,30,140,0.15)' }}>{surchargeForm.calc_type==='percentage'?'%':'£'}</div></div>],
                ['Fires when', <select value={surchargeForm.applies_when} onChange={e => setSurchargeForm(f=>({...f,applies_when:e.target.value}))} style={{ width:'100%', height:34, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, padding:'0 10px' }}><option value="always">Auto (always)</option><option value="reconciliation">Reconciliation only</option></select>],
                ['Charge Per', <select value={surchargeForm.charge_per} onChange={e => setSurchargeForm(f=>({...f,charge_per:e.target.value}))} style={{ width:'100%', height:34, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, padding:'0 10px' }}><option value="shipment">Per Shipment</option><option value="parcel">Per Parcel</option></select>],
              ].map(([l, el]) => <div key={l}><label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>{l}</label>{el}</div>)}
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Description (optional)</label>
              <div className="pill-input-wrap"><input value={surchargeForm.description} onChange={e => setSurchargeForm(f=>({...f,description:e.target.value}))} placeholder="e.g. Applied for deliveries to remote postcodes" style={{ fontSize:13 }}/></div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => addSurcharge.mutate()} disabled={addSurcharge.isPending || !surchargeForm.code.trim() || !surchargeForm.name.trim()} className="btn-primary" style={{ background:'rgba(233,30,140,0.2)', border:'1px solid rgba(233,30,140,0.4)', color:'#E91E8C' }}><Check size={13}/> Create</button>
              <button onClick={() => setAddingSurcharge(false)} className="btn-ghost" style={{ padding:'0 12px' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Surcharge list */}
        {surcharges.length === 0 && !addingSurcharge ? (
          <div className="moov-card" style={{ padding:32, textAlign:'center', color:'#555', fontSize:13, fontStyle:'italic' }}>No surcharges yet — click Add Surcharge to create one</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {surcharges.map(s => {
              const isExpanded    = expandedSurcharge === s.id;
              const isEditing     = editingSurcharge === s.id;
              const isAddingRule  = addingRuleTo === s.id;
              const sym = s.calc_type === 'percentage' ? '%' : '£';
              const valStr = s.calc_type === 'percentage'
                ? `${parseFloat(s.default_value||0).toFixed(2)}%`
                : `£${parseFloat(s.default_value||0).toFixed(2)}`;

              return (
                <div key={s.id} className="moov-card" style={{ padding:0, overflow:'hidden', opacity: s.active ? 1 : 0.6, border: s.active ? '1px solid rgba(233,30,140,0.18)' : '1px solid rgba(255,255,255,0.05)' }}>

                  {/* ── Surcharge header row ── */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{s.name}</span>
                        <span style={{ ...pill('rgba(233,30,140,0.15)', '#E91E8C'), fontSize:10 }}>{s.code}</span>
                        <span style={{ ...pill(s.active ? 'rgba(0,200,83,0.1)' : 'rgba(255,255,255,0.04)', s.active ? '#00C853' : '#555'), fontSize:10 }}>{s.active ? 'Active' : 'Inactive'}</span>
                      </div>
                      {s.description && <div style={{ fontSize:11, color:'#777', marginTop:2 }}>{s.description}</div>}
                    </div>

                    {/* Value + firing mode — click to edit */}
                    <div
                      onClick={() => { if (!isEditing) { setEditingSurcharge(s.id); setEditSForm({ default_value: String(s.default_value||0), applies_when: s.applies_when, charge_per: s.charge_per, calc_type: s.calc_type, active: s.active }); } }}
                      style={{ cursor:'pointer', textAlign:'right', padding:'4px 8px', borderRadius:6, background: isEditing ? 'rgba(233,30,140,0.08)' : 'transparent', border: isEditing ? '1px solid rgba(233,30,140,0.25)' : '1px solid transparent' }}
                      title="Click to edit"
                    >
                      <div style={{ fontSize:14, fontWeight:700, color:'#E91E8C', fontFamily:'monospace' }}>{valStr}</div>
                      <div style={{ fontSize:10, color:'#888' }}>per {s.charge_per} · {s.applies_when === 'always' ? '⚡ auto' : '📋 reconciliation'}</div>
                    </div>

                    {/* Controls */}
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <button onClick={() => patchSurcharge.mutate({ id:s.id, active:!s.active })} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, border:'none', cursor:'pointer', background: s.active ? 'rgba(255,200,0,0.1)' : 'rgba(0,200,83,0.1)', color: s.active ? '#FFC107' : '#00C853', fontWeight:700 }}>{s.active ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => setExpandedSurcharge(isExpanded ? null : s.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888', padding:'4px 6px' }} title="Rules">{isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button>
                      <button onClick={() => { if (window.confirm(`Delete "${s.name}"?`)) delSurcharge.mutate(s.id); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#444', padding:'4px 6px' }}><Trash2 size={13}/></button>
                    </div>
                  </div>

                  {/* ── Inline edit panel ── */}
                  {isEditing && (
                    <div style={{ borderTop:'1px solid rgba(233,30,140,0.15)', padding:'12px 14px', background:'rgba(233,30,140,0.04)' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                        {[
                          ['Type', <select value={editSForm.calc_type} onChange={e => setEditSForm(f=>({...f,calc_type:e.target.value}))} style={{ width:'100%', height:30, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#fff', fontSize:12, padding:'0 8px' }}><option value="flat">Flat £</option><option value="percentage">Percentage %</option></select>],
                          ['Value', <div className="pill-input-wrap" style={{ height:30 }}><input type="number" step="0.01" value={editSForm.default_value} onChange={e => setEditSForm(f=>({...f,default_value:e.target.value}))} style={{ fontSize:12 }}/><div className="green-cap" style={{ fontSize:10, color:'#E91E8C', background:'rgba(233,30,140,0.15)' }}>{editSForm.calc_type==='percentage'?'%':'£'}</div></div>],
                          ['Fires when', <select value={editSForm.applies_when} onChange={e => setEditSForm(f=>({...f,applies_when:e.target.value}))} style={{ width:'100%', height:30, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#fff', fontSize:12, padding:'0 8px' }}><option value="always">Auto (always)</option><option value="reconciliation">Reconciliation only</option></select>],
                          ['Charge Per', <select value={editSForm.charge_per} onChange={e => setEditSForm(f=>({...f,charge_per:e.target.value}))} style={{ width:'100%', height:30, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#fff', fontSize:12, padding:'0 8px' }}><option value="shipment">Per Shipment</option><option value="parcel">Per Parcel</option></select>],
                        ].map(([l, el]) => <div key={l}><label style={{ fontSize:10, color:'#AAAAAA', display:'block', marginBottom:3 }}>{l}</label>{el}</div>)}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => patchSurcharge.mutate({ id:s.id, ...editSForm, default_value: parseFloat(editSForm.default_value)||0 })} disabled={patchSurcharge.isPending} className="btn-primary" style={{ height:28, fontSize:12, background:'rgba(233,30,140,0.2)', border:'1px solid rgba(233,30,140,0.4)', color:'#E91E8C' }}><Check size={11}/> Save</button>
                        <button onClick={() => setEditingSurcharge(null)} className="btn-ghost" style={{ height:28, fontSize:12, padding:'0 10px' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* ── Rules panel (expanded) ── */}
                  {isExpanded && (
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'14px', background:'rgba(0,0,0,0.22)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#AAAAAA', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          Trigger Rules <span style={{ fontSize:10, fontWeight:400, color:'#555', textTransform:'none' }}>— if ANY rule matches, this surcharge fires</span>
                        </div>
                        <button onClick={() => setAddingRuleTo(isAddingRule ? null : s.id)} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'1px solid rgba(233,30,140,0.3)', background:'rgba(233,30,140,0.1)', color:'#E91E8C', cursor:'pointer', fontWeight:700 }}>
                          {isAddingRule ? 'Cancel' : '+ Add Rule'}
                        </button>
                      </div>

                      {/* Existing rules */}
                      {(s.rules || []).length === 0 && !isAddingRule && (
                        <p style={{ fontSize:12, color:'#444', fontStyle:'italic', margin:'0 0 8px' }}>
                          No rules yet. {s.applies_when === 'always' ? 'Surcharge fires on every shipment.' : 'Add a rule with conditions to auto-fire, or leave empty for manual reconciliation.'}
                        </p>
                      )}

                      {(s.rules || []).map((r, rIdx) => (
                        <div key={r.id} style={{ marginBottom:8, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:'#ddd' }}>{r.name}</span>
                            <span style={{ ...pill(r.logic==='AND' ? 'rgba(0,188,212,0.12)' : 'rgba(123,47,190,0.15)', r.logic==='AND' ? '#00BCD4' : '#7B2FBE'), fontSize:10 }}>{r.logic}</span>
                            {r.service_codes?.length > 0 && (
                              <span style={{ fontSize:10, color:'#888' }}>· services: {r.service_codes.join(', ')}</span>
                            )}
                            <button onClick={() => delRule.mutate({ surchargeId:s.id, ruleId:r.id })} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#444', padding:'2px 4px' }}><Trash2 size={11}/></button>
                          </div>
                          {/* Conditions */}
                          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            {(r.filters || []).map((cond, ci) => (
                              <div key={ci} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                {ci > 0 && <span style={{ fontSize:10, color: r.logic==='AND' ? '#00BCD4' : '#7B2FBE', fontWeight:700, minWidth:24 }}>{r.logic}</span>}
                                {ci === 0 && <span style={{ minWidth:24 }}/>}
                                <span style={{ fontSize:11, color:'#aaa' }}>{fieldLabel(cond.field)}</span>
                                <span style={{ fontSize:11, color:'#E91E8C', fontWeight:600 }}>{opLabel(cond.op)}</span>
                                <span style={{ fontSize:11, color:'#fff', fontFamily:'monospace', background:'rgba(255,255,255,0.06)', padding:'1px 6px', borderRadius:4 }}>{formatCondValue(cond.op, cond.value)}</span>
                                <button
                                  onClick={() => {
                                    const newFilters = (r.filters||[]).filter((_,i) => i !== ci);
                                    patchRuleFilters.mutate({ surchargeId:s.id, ruleId:r.id, filters:newFilters });
                                  }}
                                  style={{ background:'none', border:'none', cursor:'pointer', color:'#444', padding:'1px 3px', marginLeft:'auto' }}
                                ><X size={10}/></button>
                              </div>
                            ))}
                            {/* Add condition to existing rule */}
                            <AddConditionRow
                              onAdd={(cond) => {
                                const newFilters = [...(r.filters||[]), cond];
                                patchRuleFilters.mutate({ surchargeId:s.id, ruleId:r.id, filters:newFilters });
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* New rule builder */}
                      {isAddingRule && (
                        <div style={{ marginTop:10, padding:'14px', background:'rgba(0,0,0,0.2)', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)' }}>

                          {/* Row 1: name + logic toggle */}
                          <div style={{ display:'flex', gap:10, alignItems:'flex-end', marginBottom:14 }}>
                            <div style={{ flex:1 }}>
                              <label style={{ fontSize:10, color:'#888', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Rule name</label>
                              <input
                                value={newRuleName} onChange={e => setNewRuleName(e.target.value)}
                                placeholder="e.g. Large parcel — over 30kg"
                                autoFocus
                                style={{ width:'100%', height:32, background:'#13131F', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, color:'#fff', fontSize:12, padding:'0 10px', boxSizing:'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize:10, color:'#888', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Conditions match</label>
                              <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)', height:32 }}>
                                {['AND','OR'].map((l, i) => (
                                  <button
                                    key={l} onClick={() => setNewRuleLogic(l)}
                                    style={{
                                      width:52, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                                      borderRight: i===0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                      background: newRuleLogic===l
                                        ? (l==='AND' ? 'rgba(0,188,212,0.2)' : 'rgba(123,47,190,0.25)')
                                        : '#13131F',
                                      color: newRuleLogic===l
                                        ? (l==='AND' ? '#00BCD4' : '#9C57E0')
                                        : '#555',
                                    }}
                                  >{l}</button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Conditions added so far */}
                          {newRuleConditions.length > 0 && (
                            <div style={{ marginBottom:10, display:'flex', flexDirection:'column', gap:5 }}>
                              {newRuleConditions.map((cond, ci) => (
                                <div key={ci} style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <span style={{ fontSize:10, fontWeight:700, minWidth:28, textAlign:'center', color: newRuleLogic==='AND'?'#00BCD4':'#9C57E0', opacity: ci===0?0:1 }}>{newRuleLogic}</span>
                                  <div style={{ flex:1, display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'rgba(255,255,255,0.04)', borderRadius:6, border:'1px solid rgba(255,255,255,0.07)' }}>
                                    <span style={{ fontSize:11, color:'#aaa' }}>{fieldLabel(cond.field)}</span>
                                    <span style={{ fontSize:11, color:'#E91E8C', fontWeight:600 }}>{opLabel(cond.op)}</span>
                                    <span style={{ fontSize:11, color:'#fff', fontFamily:'monospace', background:'rgba(255,255,255,0.08)', padding:'1px 7px', borderRadius:4 }}>{formatCondValue(cond.op, cond.value)}</span>
                                  </div>
                                  <button onClick={() => setNewRuleConditions(cs => cs.filter((_,i)=>i!==ci))} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:'2px 4px', flexShrink:0 }}><X size={11}/></button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add condition */}
                          <AddConditionRow onAdd={(cond) => setNewRuleConditions(cs => [...cs, cond])} />

                          {/* Actions */}
                          <div style={{ display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                            <button
                              onClick={() => { if (newRuleName.trim()) addRule.mutate({ surchargeId:s.id, name:newRuleName, logic:newRuleLogic, filters:newRuleConditions }); }}
                              disabled={addRule.isPending || !newRuleName.trim()}
                              style={{ height:32, padding:'0 16px', borderRadius:6, border:'1px solid rgba(0,200,83,0.35)', background:'rgba(0,200,83,0.12)', color:'#00C853', fontSize:12, cursor:'pointer', fontWeight:700 }}
                            ><Check size={11}/> Save Rule</button>
                            <button onClick={() => { setAddingRuleTo(null); setNewRuleName(''); setNewRuleLogic('AND'); setNewRuleConditions([]); }} style={{ height:32, padding:'0 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'none', color:'#888', fontSize:12, cursor:'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>}  {/* end carrierTab === 'surcharges' */}
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

      {/* ── Fuel Groups section ── */}
      <div style={{ marginTop:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#FFC107', margin:0, display:'flex', alignItems:'center', gap:8 }}>
              <Zap size={16}/> Fuel Groups
            </h2>
            <p style={{ fontSize:13, color:'#AAAAAA', margin:'4px 0 0' }}>
              Group services by fuel rate — assign services using the dropdown on each card
            </p>
          </div>
          <button onClick={() => setAddingGroup(a => !a)} className="btn-primary"><Plus size={13}/> New Group</button>
        </div>

        {addingGroup && (
          <div className="moov-card" style={{ padding:16, marginBottom:14, border:'1px solid rgba(255,193,7,0.25)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr auto auto', gap:10, alignItems:'flex-end' }}>
              <div>
                <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Group Name</label>
                <div className="pill-input-wrap" style={{ height:34 }}>
                  <input value={groupForm.name} onChange={e => setGroupForm(f=>({...f,name:e.target.value}))}
                    placeholder="e.g. Domestic Fuel, International Fuel" autoFocus style={{ fontSize:13 }}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#AAAAAA', display:'block', marginBottom:4 }}>Fuel Surcharge %</label>
                <div className="pill-input-wrap" style={{ height:34 }}>
                  <input type="number" step="0.01" value={groupForm.fuel_surcharge_pct}
                    onChange={e => setGroupForm(f=>({...f,fuel_surcharge_pct:e.target.value}))}
                    placeholder="5.50" style={{ fontSize:13 }}/>
                  <div className="green-cap" style={{ fontSize:12 }}>%</div>
                </div>
              </div>
              <button onClick={() => createGroup.mutate()} className="btn-primary" style={{ height:34, alignSelf:'flex-end' }}>
                <Check size={13}/> Create
              </button>
              <button onClick={() => setAddingGroup(false)} className="btn-ghost" style={{ height:34, alignSelf:'flex-end' }}>Cancel</button>
            </div>
          </div>
        )}

        {fuelGroups.length === 0 ? (
          <div className="moov-card" style={{ padding:32, textAlign:'center', color:'#555', fontSize:13 }}>
            No fuel groups yet — create one above, then assign services to it.
          </div>
        ) : (() => {
          // Services not in any group = available to assign
          const assignedIds = new Set(fuelGroups.flatMap(g => (g.services||[]).map(s => s.id)));
          return (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:14 }}>
              {fuelGroups.map(group => {
                const available = (carrier.services || []).filter(s => !assignedIds.has(s.id));
                return (
                  <FuelGroupCard
                    key={group.id}
                    group={group}
                    carrierId={carrierId}
                    availableServices={available}
                    onRefresh={refetchAll}
                  />
                );
              })}
            </div>
          );
        })()}
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
              <td style={{ color:'#00C853' }}>£{parseFloat(b.price_first).toFixed(2)}</td>
              <td style={{ color:'#FFC107' }}>{b.price_sub ? `£${parseFloat(b.price_sub).toFixed(2)}` : <span style={{ color:'#555' }}>—</span>}</td>
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

          {/* DC reference data — authoritative postcode lists & weight bounds from DC platform */}
          <DcZoneViewer serviceCode={svc.service_code} />

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

// ─── Lightweight CSV parser (handles quoted fields with commas/newlines) ──────

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i+1] === '\n')) {
        if (ch === '\r') i++;
        row.push(field); field = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
      } else field += ch;
    }
  }
  if (field || row.length) { row.push(field); if (row.some(c => c !== '')) rows.push(row); }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
    return obj;
  });
}

// ─── DC Data Import Modal ─────────────────────────────────────────────────────

function DcImportModal({ onClose }) {
  const [wFile, setWFile]     = useState(null);
  const [zFile, setZFile]     = useState(null);
  const [status, setStatus]   = useState(null); // null | 'running' | { wResult, zResult } | 'error'
  const [errMsg, setErrMsg]   = useState('');
  const wRef = useRef(null);
  const zRef = useRef(null);

  const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });

  const runImport = async () => {
    if (!wFile && !zFile) return;
    setStatus('running');
    setErrMsg('');
    try {
      const results = {};

      if (wFile) {
        const text = await readFile(wFile);
        const rows = csvToObjects(text);
        results.wResult = await carrierDataApi.importWeightClasses(rows);
      }
      if (zFile) {
        const text = await readFile(zFile);
        const rows = csvToObjects(text);
        results.zResult = await carrierDataApi.importZones(rows);
      }

      setStatus(results);
    } catch (err) {
      setErrMsg(err.response?.data?.error || err.message || 'Import failed');
      setStatus('error');
    }
  };

  const done = status && status !== 'running' && status !== 'error';

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div style={{
        background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14,
        padding:28, width:500, maxWidth:'90vw',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#00C853' }}>Import DC Reference Data</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#AAAAAA', cursor:'pointer', fontSize:20 }}>×</button>
        </div>

        <p style={{ fontSize:12, color:'#888', margin:'0 0 20px' }}>
          Import the weight_classes and zones CSV exports from the DC platform.
          Existing records are updated; new ones are inserted.
        </p>

        {/* Weight classes */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#AAAAAA', display:'block', marginBottom:6 }}>
            Weight Classes CSV
          </label>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input ref={wRef} type="file" accept=".csv" style={{ display:'none' }}
              onChange={e => setWFile(e.target.files[0] || null)} />
            <button onClick={() => wRef.current?.click()} className="btn-ghost" style={{ height:32, padding:'0 14px', fontSize:12 }}>
              <Upload size={12}/> Choose file
            </button>
            {wFile
              ? <span style={{ fontSize:12, color:'#00C853' }}>✓ {wFile.name}</span>
              : <span style={{ fontSize:12, color:'#555' }}>No file selected</span>
            }
          </div>
        </div>

        {/* Zones */}
        <div style={{ marginBottom:24 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#AAAAAA', display:'block', marginBottom:6 }}>
            Zones CSV
          </label>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input ref={zRef} type="file" accept=".csv" style={{ display:'none' }}
              onChange={e => setZFile(e.target.files[0] || null)} />
            <button onClick={() => zRef.current?.click()} className="btn-ghost" style={{ height:32, padding:'0 14px', fontSize:12 }}>
              <Upload size={12}/> Choose file
            </button>
            {zFile
              ? <span style={{ fontSize:12, color:'#00C853' }}>✓ {zFile.name}</span>
              : <span style={{ fontSize:12, color:'#555' }}>No file selected</span>
            }
          </div>
        </div>

        {/* Result / error */}
        {done && (
          <div style={{ background:'rgba(0,200,83,0.08)', border:'1px solid rgba(0,200,83,0.25)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#00C853' }}>
            {status.wResult && <div>Weight classes: {status.wResult.inserted} inserted, {status.wResult.updated} updated</div>}
            {status.zResult && <div>Zones: {status.zResult.inserted} inserted, {status.zResult.updated} updated</div>}
          </div>
        )}
        {status === 'error' && (
          <div style={{ background:'rgba(233,30,140,0.08)', border:'1px solid rgba(233,30,140,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#E91E8C' }}>
            {errMsg}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn-ghost" style={{ height:34, padding:'0 16px' }}>
            {done ? 'Close' : 'Cancel'}
          </button>
          {!done && (
            <button
              onClick={runImport}
              disabled={(!wFile && !zFile) || status === 'running'}
              className="btn-primary"
              style={{ height:34, padding:'0 20px' }}
            >
              {status === 'running' ? 'Importing…' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DC Zone Postcode Viewer ──────────────────────────────────────────────────
// Shown in ServiceDetail > Zone Config tab — displays the authoritative
// postcode coverage pulled from dc_zones for this service.

function DcZoneViewer({ serviceCode }) {
  const { data: dcZones = [], isLoading } = useQuery({
    queryKey: ['dc-zones', serviceCode],
    queryFn: () => carrierDataApi.getZones(serviceCode),
    enabled: !!serviceCode,
  });
  const { data: dcBands = [], isLoading: bandsLoading } = useQuery({
    queryKey: ['dc-weight-classes', serviceCode],
    queryFn: () => carrierDataApi.getWeightClasses(serviceCode),
    enabled: !!serviceCode,
  });

  if (isLoading || bandsLoading) return <div style={{ color:'#AAAAAA', fontSize:12, padding:8 }}>Loading DC reference data…</div>;
  if (!dcZones.length && !dcBands.length) {
    return (
      <div style={{ color:'#555', fontSize:12, padding:'10px 0' }}>
        No DC reference data imported yet. Use the Import DC Data button in the page header.
      </div>
    );
  }

  // Group zones by zone_name
  const byZone = {};
  dcZones.forEach(z => {
    if (!byZone[z.zone_name]) byZone[z.zone_name] = [];
    byZone[z.zone_name].push(z);
  });

  return (
    <div style={{ marginTop:20 }}>
      {/* Weight bands */}
      {dcBands.length > 0 && (
        <div className="moov-card" style={{ padding:16, marginBottom:14 }}>
          <h4 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 12px' }}>
            DC Weight Bands <span style={{ fontSize:11, color:'#555', fontWeight:400 }}>({dcBands.length} bands)</span>
          </h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:6 }}>
            {dcBands.map(b => (
              <div key={b.id} style={{
                background:'rgba(0,200,83,0.04)', border:'1px solid rgba(0,200,83,0.12)',
                borderRadius:6, padding:'5px 10px', display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <span style={{ fontSize:11, color:'#888' }}>{b.weight_class_name || '—'}</span>
                <span style={{ fontSize:11, color:'#00C853', fontFamily:'monospace', fontWeight:700 }}>
                  {b.min_weight_kg}–{b.max_weight_kg} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone postcode coverage */}
      {Object.keys(byZone).length > 0 && (
        <div className="moov-card" style={{ padding:16 }}>
          <h4 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 12px' }}>
            DC Zone Coverage
          </h4>
          {Object.entries(byZone).map(([zoneName, rows]) => (
            <div key={zoneName} style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#7B2FBE', marginBottom:6 }}>{zoneName}</div>
              {rows.map(z => (
                <div key={`${z.dc_zone_id}-${z.iso}`} style={{ marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#FFC107', marginRight:8 }}>{z.iso}</span>
                  {z.included_postcodes?.length > 0 && (
                    <div style={{ marginTop:4 }}>
                      <span style={{ fontSize:10, color:'#00C853', fontWeight:700, marginRight:6 }}>INCLUDED:</span>
                      <span style={{ fontSize:10, color:'#888', fontFamily:'monospace', lineHeight:1.8 }}>
                        {z.included_postcodes.join(', ')}
                      </span>
                    </div>
                  )}
                  {z.excluded_postcodes?.length > 0 && (
                    <div style={{ marginTop:4 }}>
                      <span style={{ fontSize:10, color:'#E91E8C', fontWeight:700, marginRight:6 }}>EXCLUDED:</span>
                      <span style={{ fontSize:10, color:'#888', fontFamily:'monospace', lineHeight:1.8 }}>
                        {z.excluded_postcodes.join(', ')}
                      </span>
                    </div>
                  )}
                  {!z.included_postcodes?.length && !z.excluded_postcodes?.length && (
                    <span style={{ fontSize:11, color:'#555' }}>All postcodes for {z.iso}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [showDcImport, setShowDcImport]       = useState(false);

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
      {showDcImport && <DcImportModal onClose={() => setShowDcImport(false)} />}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#00C853', margin:0 }}>Carrier Management</h1>
          <p style={{ fontSize:13, color:'#AAAAAA', marginTop:4 }}>Contacts, rate cards, zones, weight bands and pricing rules</p>
        </div>
        <button onClick={() => setShowDcImport(true)} className="btn-ghost" style={{ height:34, padding:'0 14px', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
          <Upload size={13}/> Import DC Data
        </button>
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
