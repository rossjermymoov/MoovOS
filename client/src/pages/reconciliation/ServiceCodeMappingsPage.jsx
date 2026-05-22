/**
 * ServiceCodeMappingsPage  —  /reconciliation/service-code-mappings
 *
 * Manage carrier invoice service code → Moov OS service mappings.
 * These mappings tell the reconciliation engine which of our services a given
 * carrier invoice code (e.g. DPD "4", DHL "P") corresponds to so it can price
 * the line correctly.
 *
 * Layout:
 *   ┌─ Header + Back button ──────────────────────────────────────────────────┐
 *   │ Carrier picker (tiles)                                                  │
 *   │ Existing mappings table (code → service → notes, delete)               │
 *   │ Add new mapping form (code input, service dropdown, notes, save)        │
 *   └─────────────────────────────────────────────────────────────────────────┘
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Hash, Tag, StickyNote, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ─── Style tokens ─────────────────────────────────────────────────────────────

const PAGE_BG   = { minHeight: '100vh', background: '#F8FAFC', padding: '28px 32px', color: '#0F172A' };
const CARD       = { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '20px 24px' };
const INPUT      = { background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 7, color: '#0F172A', fontSize: 13, padding: '8px 12px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const SELECT_ST  = { ...INPUT, cursor: 'pointer' };
const BTN_GREEN  = { background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.4)', borderRadius: 7, color: '#00C853', padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' };
const BTN_GHOST  = { background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 7, color: '#AAA', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 };
const BTN_RED    = { background: 'rgba(213,0,0,0.08)', border: '1px solid rgba(213,0,0,0.25)', borderRadius: 7, color: '#FF5252', padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 };
const TH         = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(0,0,0,0.07)', textAlign: 'left', whiteSpace: 'nowrap' };
const TD         = { padding: '12px 14px', fontSize: 13, color: '#0F172A', borderBottom: '1px solid rgba(0,0,0,0.03)', verticalAlign: 'middle' };

// Carrier tiles — limited to reconciliation-ready carriers
const RECON_READY = new Set(['dpd', 'dhl']);

// ─── Carrier tile ─────────────────────────────────────────────────────────────

function CarrierTile({ courier, selected, onSelect }) {
  const ready = RECON_READY.has((courier.name || '').toLowerCase()) || RECON_READY.has((courier.code || '').toLowerCase());
  return (
    <button
      onClick={() => ready && onSelect(courier.id)}
      disabled={!ready}
      title={ready ? courier.name : `${courier.name} — not yet configured for reconciliation`}
      style={{
        padding: '10px 18px', borderRadius: 8, cursor: ready ? 'pointer' : 'not-allowed',
        background: selected ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.03)',
        border: `2px solid ${selected ? '#00C853' : 'rgba(0,0,0,0.08)'}`,
        color: selected ? '#00C853' : ready ? '#0F172A' : '#555',
        fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
        opacity: ready ? 1 : 0.4,
      }}
    >
      {courier.name}
    </button>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return active
    ? <span style={{ background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 20, color: '#00C853', fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>Active</span>
    : <span style={{ background: 'rgba(213,0,0,0.1)', border: '1px solid rgba(213,0,0,0.3)', borderRadius: 20, color: '#FF5252', fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>Inactive</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ServiceCodeMappingsPage() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();

  const [selectedCarrierId, setSelectedCarrierId] = useState(null);
  const [newCode,    setNewCode]    = useState('');
  const [newService, setNewService] = useState('');
  const [newNotes,   setNewNotes]   = useState('');
  const [formError,  setFormError]  = useState('');
  const [saveOk,     setSaveOk]     = useState(false);

  // ── Data fetches ─────────────────────────────────────────────────────────────

  const { data: couriers = [] } = useQuery({
    queryKey: ['couriers'],
    queryFn: () => api.get('/carriers/couriers').then(r => r.data),
  });

  const { data: mappings = [], isLoading: loadingMappings } = useQuery({
    queryKey: ['service-code-mappings', selectedCarrierId],
    queryFn: () => {
      const params = selectedCarrierId ? `?carrier_id=${selectedCarrierId}` : '';
      return api.get(`/reconciliation/service-code-mappings${params}`).then(r => r.data);
    },
    enabled: true,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['carrier-services', selectedCarrierId],
    queryFn: () => api.get(`/carriers/services?courier_id=${selectedCarrierId}`).then(r => r.data),
    enabled: !!selectedCarrierId,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (body) => api.post('/reconciliation/service-code-mappings', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-code-mappings'] });
      setNewCode('');
      setNewService('');
      setNewNotes('');
      setFormError('');
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    },
    onError: (err) => setFormError(err.response?.data?.error || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reconciliation/service-code-mappings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-code-mappings'] }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleSave() {
    setFormError('');
    if (!selectedCarrierId) return setFormError('Select a carrier first.');
    if (!newCode.trim())    return setFormError('Carrier code is required.');
    if (!newService)        return setFormError('Service is required.');
    saveMutation.mutate({
      carrier_id:   selectedCarrierId,
      courier_code: newCode.trim(),
      service_id:   parseInt(newService),
      notes:        newNotes.trim() || undefined,
    });
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const visibleMappings = mappings.filter(m => m.is_active !== false);
  const selectedCarrier = couriers.find(c => c.id === selectedCarrierId);

  // Group inactive mappings separately so they don't pollute the main table
  const activeMappings   = mappings.filter(m => m.is_active !== false);
  const inactiveMappings = mappings.filter(m => m.is_active === false);

  return (
    <div style={PAGE_BG}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate('/reconciliation')} style={BTN_GHOST}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Service Code Mappings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Map carrier invoice service codes to Moov OS services so the reconciliation engine can price each line correctly.
          </p>
        </div>
      </div>

      {/* ── Carrier picker ──────────────────────────────────────────────────── */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Select Carrier
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCarrierId(null)}
            style={{
              padding: '10px 18px', borderRadius: 8, cursor: 'pointer',
              background: selectedCarrierId === null ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.03)',
              border: `2px solid ${selectedCarrierId === null ? '#00C853' : 'rgba(0,0,0,0.08)'}`,
              color: selectedCarrierId === null ? '#00C853' : '#0F172A',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            }}
          >
            All carriers
          </button>
          {couriers.map(c => (
            <CarrierTile
              key={c.id}
              courier={c}
              selected={selectedCarrierId === c.id}
              onSelect={setSelectedCarrierId}
            />
          ))}
        </div>
      </div>

      {/* ── Mappings table ──────────────────────────────────────────────────── */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {selectedCarrier ? `${selectedCarrier.name} mappings` : 'All mappings'}
            {!loadingMappings && (
              <span style={{ marginLeft: 8, fontWeight: 400, color: '#64748B', textTransform: 'none' }}>
                — {activeMappings.length} active{inactiveMappings.length > 0 ? `, ${inactiveMappings.length} inactive` : ''}
              </span>
            )}
          </p>
        </div>

        {loadingMappings ? (
          <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>Loading…</p>
        ) : activeMappings.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#FF9800' }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: 13 }}>
              No active mappings{selectedCarrier ? ` for ${selectedCarrier.name}` : ''}. Unmapped codes will block reconciliation.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 110 }} />
                <col style={{ width: 60 }} />
                <col />
                <col />
                <col style={{ width: 100 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={TH}>Carrier</th>
                  <th style={TH}>Invoice Code</th>
                  <th style={TH}>Maps to Service</th>
                  <th style={TH}>Notes</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeMappings.map(m => (
                  <tr key={m.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={TD}>
                      <span style={{ fontSize: 12, color: '#AAA' }}>{m.carrier_name || '—'}</span>
                    </td>
                    <td style={TD}>
                      <span style={{
                        background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)',
                        borderRadius: 6, color: '#00C853', fontSize: 12, fontWeight: 700,
                        padding: '3px 8px', fontFamily: 'monospace',
                      }}>
                        {m.courier_code}
                      </span>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ChevronRight size={14} style={{ color: '#64748B', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{m.service_name || <span style={{ color: '#FF5252' }}>Unknown service</span>}</span>
                        {m.service_code && (
                          <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>({m.service_code})</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...TD, color: '#64748B', fontSize: 12 }}>
                      {m.notes || <span style={{ color: '#475569' }}>—</span>}
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button
                        onClick={() => deleteMutation.mutate(m.id)}
                        disabled={deleteMutation.isPending}
                        style={BTN_RED}
                        title="Remove this mapping"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add new mapping ─────────────────────────────────────────────────── */}
      <div style={CARD}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Add New Mapping
        </p>

        {!selectedCarrierId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.25)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#FF9800' }}>
            <AlertTriangle size={15} />
            Select a carrier above before adding a mapping.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 14, alignItems: 'end', maxWidth: 700 }}>

          {/* Carrier code */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
              <Hash size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Invoice Code
            </label>
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="e.g. 4"
              maxLength={20}
              disabled={!selectedCarrierId}
              style={{ ...INPUT, opacity: selectedCarrierId ? 1 : 0.45, fontFamily: 'monospace', fontWeight: 700 }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Service picker */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
              <Tag size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Maps to Service
            </label>
            <select
              value={newService}
              onChange={e => setNewService(e.target.value)}
              disabled={!selectedCarrierId}
              style={{ ...SELECT_ST, opacity: selectedCarrierId ? 1 : 0.45 }}
            >
              <option value="">— pick a service —</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.service_code ? `(${s.service_code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
              <StickyNote size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Notes <span style={{ fontWeight: 400, color: '#64748B' }}>(optional)</span>
            </label>
            <input
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="e.g. Saturday delivery"
              disabled={!selectedCarrierId}
              style={{ ...INPUT, opacity: selectedCarrierId ? 1 : 0.45 }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>

        {/* Error / success feedback */}
        {formError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: '#FF5252' }}>
            <AlertTriangle size={14} /> {formError}
          </div>
        )}
        {saveOk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: '#00C853' }}>
            <CheckCircle2 size={14} /> Mapping saved.
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button
            onClick={handleSave}
            disabled={!selectedCarrierId || saveMutation.isPending}
            style={{ ...BTN_GREEN, opacity: (!selectedCarrierId || saveMutation.isPending) ? 0.5 : 1 }}
          >
            <Plus size={15} />
            {saveMutation.isPending ? 'Saving…' : 'Add mapping'}
          </button>
        </div>
      </div>

    </div>
  );
}
