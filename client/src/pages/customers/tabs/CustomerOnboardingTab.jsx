/**
 * CustomerOnboardingTab — Visual Multi-Track Onboarding System
 *
 * Built strictly to docs/design-rules.md and moov.css:
 *   - No boxes / zero border-radius everywhere
 *   - One status language: four marks (settled, progress, attention, waiting)
 *   - Archivo typography, flush left, tabular numerals
 *   - Interactive Process Tree Stepper (Core Trunk → Courier Branches → Go-Live Canopy)
 *   - DPD Collection Setup & Depot Negotiation drawer
 *   - Sensei System Bridge payload exporter modal
 *   - Multi-track parallel carrier checklist with sub-tasks and notes
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rocket, Clock, Paperclip, MessageSquarePlus, Plus, ChevronDown, ChevronRight,
  Send, CheckCheck, Trash2, Phone, Truck, Box, CheckCircle2, AlertTriangle,
  ArrowRight, Copy, Share2, Layers, ShieldCheck, Sparkles, ExternalLink, X
} from 'lucide-react';
import { onboardingApi } from '../../../api/onboarding';
import { onboardingTemplatesApi } from '../../../api/onboardingTemplates';
import { staffApi } from '../../../api/staff';
import { teamsApi } from '../../../api/teams';

// status → mark + label (4 fixed marks)
const STATUS = {
  not_started: ['waiting',   'Not started'],
  in_progress: ['flight',    'In progress'],
  blocked:     ['attention', 'Blocked'],
  complete:    ['settled',   'Complete'],
  skipped:     ['waiting',   'Skipped'],
};
const NEXT = {
  not_started: 'in_progress',
  in_progress: 'complete',
  complete: 'not_started',
  blocked: 'in_progress',
  skipped: 'not_started'
};

const TRACK_LABELS = {
  core:       'Core Intake',
  dpd_master: 'DPD Master',
  dpd_sub:    'DPD Sub-Account',
  ups:        'UPS Direct',
  yodel:      'Yodel Track',
  golive:     'Go-Live Canopy',
};

function fmtDuration(start, end) {
  if (!start) return null;
  const ms = (end ? new Date(end) : new Date()) - new Date(start);
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(ms / 60000))}m`;
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function CustomerOnboardingTab({ customerId, customer }) {
  const qc = useQueryClient();
  const key = ['customer-onboarding', customerId];
  const { data: onb, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => onboardingApi.getForCustomer(customerId),
    retry: false,
  });
  const refresh = () => {
    qc.invalidateQueries(key);
    qc.invalidateQueries(['customer', customerId]);
    qc.invalidateQueries(['onboarding-board']);
  };

  if (isLoading) return <div className="mv-blurb" style={{ padding: '24px 0' }}>Reading onboarding pipeline…</div>;
  if (isError || !onb) return <StartPanel customerId={customerId} customer={customer} onStarted={refresh} />;

  return <ActivePlan onb={onb} customer={customer} onChange={refresh} />;
}

// ─── START PANEL ─────────────────────────────────────────────
function StartPanel({ customerId, customer, onStarted }) {
  const { data: templates = [] } = useQuery({ queryKey: ['onb-templates'], queryFn: onboardingTemplatesApi.list });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list });
  const [templateId, setTemplateId] = useState(customer?.onboarding_template_id || '');
  const [goLive, setGoLive] = useState('');
  const [members, setMembers] = useState({});
  const [selectedTracks, setSelectedTracks] = useState(['core', 'dpd_master', 'golive']);

  const active = templates.filter(t => t.is_active);
  if (!templateId && active.length > 0) {
    const defaultTmpl = active.find(t => t.code === 'dpd_moov_master') || active[0];
    if (defaultTmpl) setTemplateId(defaultTmpl.id);
  }

  const start = useMutation({
    mutationFn: () => onboardingApi.start(customerId, {
      template_id: templateId,
      target_go_live: goLive || null,
      team_members: members,
      active_tracks: selectedTracks,
      collection_details: {
        preferred_window: '15:00 - 17:00',
        daily_parcels: 25,
        weekly_parcels: 125,
        avg_weight_kg: 2.5,
        dimensions_cm: '30x20x15',
        product_type: 'Retail Goods',
        negotiation_status: 'pending_depot',
        negotiation_notes: 'Requested 15:00 - 17:00 collection window.'
      }
    }),
    onSuccess: onStarted,
  });

  const toggleTrack = (code) => {
    setSelectedTracks(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  return (
    <div style={{ maxWidth: 640, background: 'var(--mv-surface)', padding: 24, borderTop: '2px solid var(--mv-divider)' }}>
      <div className="mv-section">Start Multi-Track Onboarding</div>
      <p className="mv-blurb" style={{ marginTop: 4, marginBottom: 20 }}>
        Enroll <strong>{customer?.business_name || 'this customer'}</strong> into a multi-track process tree. Tasks and SLA targets will be instantiated across Core Trunk and assigned Courier Tracks.
      </p>

      <div className="mv-field">
        <label className="mv-label">Primary Onboarding Template</label>
        <select className="mv-input" value={templateId} onChange={e => setTemplateId(e.target.value)}>
          <option value="">Select a template…</option>
          {active.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.task_count} tasks)</option>
          ))}
        </select>
      </div>

      <div className="mv-field" style={{ marginTop: 16 }}>
        <label className="mv-label">Active Courier Tracks (Multi-Carrier)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {[
            { id: 'core', label: 'Core Intake Trunk', req: true },
            { id: 'dpd_master', label: 'DPD Moov Master (<150 pkts/wk)' },
            { id: 'dpd_sub', label: 'DPD Sub-Account' },
            { id: 'ups', label: 'UPS Direct' },
            { id: 'yodel', label: 'Yodel' },
            { id: 'golive', label: 'Go-Live Canopy', req: true },
          ].map(tr => (
            <label key={tr.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px',
              fontSize: 12, fontWeight: 600, cursor: tr.req ? 'default' : 'pointer',
              background: selectedTracks.includes(tr.id) ? 'var(--mv-ink)' : 'transparent',
              color: selectedTracks.includes(tr.id) ? 'var(--mv-bg)' : 'var(--mv-ink-78)',
              border: '1px solid var(--mv-hairline-2)'
            }}>
              <input type="checkbox" checked={selectedTracks.includes(tr.id)} disabled={tr.req}
                onChange={() => !tr.req && toggleTrack(tr.id)} style={{ accentColor: 'var(--mv-purple)' }} />
              {tr.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mv-field" style={{ marginTop: 16 }}>
        <label className="mv-label">Assigned Team Roles</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          {teams.map(team => (
            <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--mv-purple)', width: 120, flexShrink: 0 }}>{team.name}</span>
              <select className="mv-input" style={{ flex: 1 }} value={members[team.id] || ''}
                onChange={e => setMembers(m => ({ ...m, [team.id]: e.target.value }))}>
                <option value="">Select {team.name.toLowerCase()} member…</option>
                {(team.members || []).map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="mv-field" style={{ marginTop: 16 }}>
        <label className="mv-label">Target Go-Live Date</label>
        <input type="date" className="mv-input" style={{ maxWidth: 220 }} value={goLive} onChange={e => setGoLive(e.target.value)} />
      </div>

      {start.isError && <div className="mv-err" style={{ marginTop: 10 }}>{start.error?.response?.data?.error || 'Could not start onboarding'}</div>}
      <button className="mv-btn mv-btn--primary" style={{ marginTop: 20 }} disabled={!templateId || start.isPending} onClick={() => start.mutate()}>
        <Rocket size={14} /> {start.isPending ? 'Starting…' : 'Start Multi-Track Onboarding'}
      </button>
    </div>
  );
}

// ─── ACTIVE PLAN ─────────────────────────────────────────────
function ActivePlan({ onb, customer, onChange }) {
  const [activeFilterTrack, setActiveFilterTrack] = useState('all');
  const [showSenseiModal, setShowSenseiModal] = useState(false);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);

  const complete = useMutation({
    mutationFn: (force) => onboardingApi.complete(onb.id, { force }),
    onSuccess: onChange,
  });
  const cancel = useMutation({
    mutationFn: () => onboardingApi.cancel(onb.id),
    onSuccess: onChange,
  });

  const allTasks = onb.stages.flatMap(s => s.tasks);
  const done = allTasks.filter(t => t.status === 'complete').length;
  const total = allTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const requiredOpen = allTasks.filter(t => t.is_required && !['complete', 'skipped'].includes(t.status)).length;

  const activeTracks = onb.active_tracks || ['core', 'dpd_master', 'golive'];

  // Calculate track progress
  const trackStats = {};
  for (const tr of activeTracks) {
    const tTasks = allTasks.filter(t => (t.track_code || 'core') === tr);
    const tDone = tTasks.filter(t => t.status === 'complete').length;
    trackStats[tr] = { total: tTasks.length, done: tDone, pct: tTasks.length ? Math.round((tDone / tTasks.length) * 100) : 0 };
  }

  // Filter tasks if track filter is set
  const filteredStages = onb.stages.map(s => ({
    ...s,
    tasks: s.tasks.filter(t => activeFilterTrack === 'all' || (t.track_code || 'core') === activeFilterTrack)
  })).filter(s => s.tasks.length > 0);

  return (
    <div>
      {/* Top action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
        <div>
          <div className="mv-section" style={{ margin: 0 }}>Onboarding Pipeline: {onb.template_name}</div>
          <div className="mv-blurb" style={{ margin: 0, fontSize: 12 }}>
            Started {fmtDuration(onb.started_at)} ago {onb.target_go_live ? ` · Target Go-Live: ${onb.target_go_live}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="mv-btn mv-btn--sm" onClick={() => setShowSenseiModal(true)}>
            <Share2 size={13} /> Sensei Bridge
          </button>
          <button className="mv-btn mv-btn--sm" onClick={() => setShowAddTrackModal(true)}>
            <Plus size={13} /> Add Track
          </button>
          <button className="mv-btn mv-btn--danger mv-btn--sm" disabled={cancel.isPending}
            onClick={() => { if (confirm('Cancel this onboarding?')) cancel.mutate(); }}>
            <Trash2 size={13} /> Cancel
          </button>
          <button className="mv-btn mv-btn--primary mv-btn--sm" disabled={complete.isPending}
            onClick={() => {
              if (requiredOpen > 0) { if (confirm(`${requiredOpen} required task(s) still open. Force-complete anyway?`)) complete.mutate(true); }
              else complete.mutate(false);
            }}>
            <CheckCheck size={13} /> Complete
          </button>
        </div>
      </div>
      <div className="mv-rule" style={{ marginBottom: 16 }} />

      {/* ─── VISUAL PROCESS TREE STEPPER ─── */}
      <ProcessTreeStepper
        onb={onb}
        activeTracks={activeTracks}
        trackStats={trackStats}
        activeFilter={activeFilterTrack}
        onSelectTrack={setActiveFilterTrack}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start', marginTop: 24 }}>
        {/* Left column — DPD Collection Card + Call Panel + Tasks Checklist */}
        <div>
          {/* DPD Collection Negotiation Panel if customer has DPD tracks */}
          {(activeTracks.includes('dpd_master') || activeTracks.includes('dpd_sub')) && (
            <DpdCollectionCard onb={onb} onChange={onChange} />
          )}

          <CallPanel onb={onb} onChange={onChange} />

          {/* Filter Track Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--mv-hairline)', paddingBottom: 10 }}>
            <span className="mv-filter-label">Filter Track:</span>
            <div className="mv-chips">
              <button className={`mv-chip ${activeFilterTrack === 'all' ? 'is-on' : ''}`} onClick={() => setActiveFilterTrack('all')}>
                All Tasks ({total})
              </button>
              {activeTracks.map(tKey => {
                const st = trackStats[tKey] || { total: 0, done: 0 };
                return (
                  <button key={tKey} className={`mv-chip ${activeFilterTrack === tKey ? 'is-on' : ''}`} onClick={() => setActiveFilterTrack(tKey)}>
                    {TRACK_LABELS[tKey] || tKey} ({st.done}/{st.total})
                  </button>
                );
              })}
            </div>
          </div>

          {filteredStages.map(stage => (
            <StageBlock key={stage.id} stage={stage} onChange={onChange} />
          ))}
        </div>

        {/* Right column — Overall Progress & Track Breakdown */}
        <div>
          {/* Overall Progress Panel */}
          <div style={{ background: 'var(--mv-surface)', padding: 18, borderTop: '2px solid var(--mv-divider)', marginBottom: 20 }}>
            <div className="mv-section">Overall Progress</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
              <div className="mv-num" style={{ fontWeight: 800, fontScale: 1, fontSize: 32, letterSpacing: '-.03em', lineHeight: 1 }}>{pct}%</div>
              <div className="mv-num" style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? 'var(--mv-green-deep)' : 'var(--mv-ink-62)' }}>
                {done} / {total} Done
              </div>
            </div>
            <div className="mv-bar" style={{ width: '100%', height: 4, marginTop: 12 }}>
              <span className={pct === 100 ? '' : 'is-warn'} style={{ width: `${pct}%`, background: pct === 100 ? 'var(--mv-green)' : 'var(--mv-purple)' }} />
            </div>
            {requiredOpen > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: 'var(--mv-magenta-deep)', fontWeight: 600 }}>
                <span className="mv-mark mv-mark--attention" /> {requiredOpen} required task{requiredOpen === 1 ? '' : 's'} open
              </div>
            )}
          </div>

          {/* Active Courier Tracks Summary */}
          <div style={{ background: 'var(--mv-surface)', padding: 18, borderTop: '2px solid var(--mv-divider)' }}>
            <div className="mv-section">Courier Tracks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              {activeTracks.map(tKey => {
                const st = trackStats[tKey] || { total: 0, done: 0, pct: 0 };
                return (
                  <div key={tKey} style={{ borderBottom: '1px solid var(--mv-hairline)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--mv-ink)' }}>{TRACK_LABELS[tKey] || tKey}</span>
                      <span className="mv-num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-ink-62)' }}>{st.done}/{st.total} ({st.pct}%)</span>
                    </div>
                    <div className="mv-bar" style={{ width: '100%', height: 3 }}>
                      <span style={{ width: `${st.pct}%`, background: st.pct === 100 ? 'var(--mv-green)' : 'var(--mv-purple)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSenseiModal && <SenseiBridgeModal customer={customer} onb={onb} onClose={() => setShowSenseiModal(false)} />}
      {showAddTrackModal && <AddTrackModal onb={onb} onClose={() => setShowAddTrackModal(false)} onAdded={onChange} />}
    </div>
  );
}

// ─── VISUAL PROCESS TREE STEPPER ───
function ProcessTreeStepper({ onb, activeTracks, trackStats, activeFilter, onSelectTrack }) {
  const coreStats = trackStats['core'] || { done: 0, total: 0, pct: 0 };
  const goliveStats = trackStats['golive'] || { done: 0, total: 0, pct: 0 };
  const courierTracks = activeTracks.filter(t => t !== 'core' && t !== 'golive');

  return (
    <div style={{ background: 'var(--mv-surface)', borderTop: '2px solid var(--mv-divider)', padding: '16px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="mv-section" style={{ margin: 0 }}>Process Tree & Courier Track Stepper</span>
        <span className="mv-blurb" style={{ margin: 0, fontSize: 11.5 }}>Click any branch to filter tasks</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1.4fr auto 1fr', alignItems: 'center', gap: 12 }}>
        {/* Node 1: Core Trunk */}
        <div onClick={() => onSelectTrack(activeFilter === 'core' ? 'all' : 'core')} style={{
          background: '#FFFFFF',
          border: '1px solid var(--mv-hairline)',
          borderLeft: `3px solid ${activeFilter === 'core' ? 'var(--mv-purple)' : 'var(--mv-divider)'}`,
          padding: 12, cursor: 'pointer',
          boxShadow: activeFilter === 'core' ? '0 0 0 1px var(--mv-purple)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="mv-section" style={{ margin: 0, fontSize: 9 }}>1. Core Trunk</span>
            <span className="mv-num" style={{ fontSize: 11, fontWeight: 700, color: coreStats.pct === 100 ? 'var(--mv-green-deep)' : 'var(--mv-ink-62)' }}>
              {coreStats.done}/{coreStats.total}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--mv-ink)' }}>Intake & Verification</div>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 2 }}>Credit check · Sensei · Welcome</div>
        </div>

        {/* Arrow */}
        <div style={{ color: 'var(--mv-ink-45)' }}><ArrowRight size={16} /></div>

        {/* Node 2: Courier Branches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {courierTracks.map(trKey => {
            const st = trackStats[trKey] || { done: 0, total: 0, pct: 0 };
            const isAct = activeFilter === trKey;
            return (
              <div key={trKey} onClick={() => onSelectTrack(isAct ? 'all' : trKey)} style={{
                background: '#FFFFFF',
                border: '1px solid var(--mv-hairline)',
                borderLeft: `3px solid ${isAct ? 'var(--mv-purple)' : 'var(--mv-green)'}`,
                padding: '8px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: isAct ? '0 0 0 1px var(--mv-purple)' : 'none'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mv-ink)' }}>{TRACK_LABELS[trKey] || trKey} Branch</div>
                  <div style={{ fontSize: 10.5, color: 'var(--mv-ink-52)' }}>Collection & Depot Setup</div>
                </div>
                <span className="mv-num" style={{ fontSize: 11, fontWeight: 800, color: st.pct === 100 ? 'var(--mv-green-deep)' : 'var(--mv-ink)' }}>
                  {st.done}/{st.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* Arrow */}
        <div style={{ color: 'var(--mv-ink-45)' }}><ArrowRight size={16} /></div>

        {/* Node 3: Go-Live Canopy */}
        <div onClick={() => onSelectTrack(activeFilter === 'golive' ? 'all' : 'golive')} style={{
          background: '#FFFFFF',
          border: '1px solid var(--mv-hairline)',
          borderLeft: `3px solid ${activeFilter === 'golive' ? 'var(--mv-purple)' : 'var(--mv-green)'}`,
          padding: 12, cursor: 'pointer',
          boxShadow: activeFilter === 'golive' ? '0 0 0 1px var(--mv-purple)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="mv-section" style={{ margin: 0, fontSize: 9, color: 'var(--mv-green-deep)' }}>3. Canopy</span>
            <span className="mv-num" style={{ fontSize: 11, fontWeight: 700, color: goliveStats.pct === 100 ? 'var(--mv-green-deep)' : 'var(--mv-ink-62)' }}>
              {goliveStats.done}/{goliveStats.total}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--mv-ink)' }}>Go-Live & Post-Care</div>
          <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 2 }}>CS Intro · 1st Invoicing · Care</div>
        </div>
      </div>
    </div>
  );
}

// ─── DPD COLLECTION & NEGOTIATION CARD ───
function DpdCollectionCard({ onb, onChange }) {
  const [editing, setEditing] = useState(false);
  const details = onb.collection_details || {};

  const [window, setWindow] = useState(details.preferred_window || '15:00 - 17:00');
  const [daily, setDaily] = useState(details.daily_parcels || 25);
  const [weekly, setWeekly] = useState(details.weekly_parcels || 125);
  const [weight, setWeight] = useState(details.avg_weight_kg || 2.5);
  const [dims, setDims] = useState(details.dimensions_cm || '30x20x15');
  const [product, setProduct] = useState(details.product_type || 'Retail Goods');
  const [depotSlot, setDepotSlot] = useState(details.dpd_depot_slot || '');
  const [status, setStatus] = useState(details.negotiation_status || 'pending_depot');
  const [notes, setNotes] = useState(details.negotiation_notes || '');

  const save = useMutation({
    mutationFn: () => onboardingApi.updateCollectionDetails(onb.id, {
      preferred_window: window,
      daily_parcels: Number(daily),
      weekly_parcels: Number(weekly),
      avg_weight_kg: Number(weight),
      dimensions_cm: dims,
      product_type: product,
      dpd_depot_slot: depotSlot,
      negotiation_status: status,
      negotiation_notes: notes,
    }),
    onSuccess: () => { setEditing(false); onChange(); }
  });

  const STATUS_MARKS = {
    pending_depot:  ['waiting',   'Awaiting Depot Review'],
    in_negotiation: ['flight',    'In Negotiation (Slot Clash)'],
    confirmed:      ['settled',   'Approved & Booked'],
    rejected:       ['attention', 'Slot Rejected'],
  };

  const [mMark, mLabel] = STATUS_MARKS[status] || STATUS_MARKS.pending_depot;

  return (
    <div style={{ background: 'var(--mv-surface)', borderTop: '2px solid var(--mv-divider)', padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={16} color="var(--mv-purple)" />
          <span className="mv-section" style={{ margin: 0, color: 'var(--mv-ink)' }}>DPD Collection Setup & Depot Negotiation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`mv-state mv-state--${mMark}`}>
            <span className={`mv-mark mv-mark--${mMark}`} />
            <span className="mv-state-label">{mLabel}</span>
          </span>
          <button className="mv-btn mv-btn--sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Collection'}
          </button>
        </div>
      </div>

      {!editing ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, fontSize: 12 }}>
          <div style={{ background: '#FFFFFF', padding: '9px 12px', border: '1px solid var(--mv-hairline)' }}>
            <div className="mv-label">Requested Window</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{window}</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '9px 12px', border: '1px solid var(--mv-hairline)' }}>
            <div className="mv-label">Parcels / Day</div>
            <div className="mv-num" style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{daily} pkts ({weekly}/wk)</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '9px 12px', border: '1px solid var(--mv-hairline)' }}>
            <div className="mv-label">Avg Weight & Dims</div>
            <div className="mv-num" style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{weight}kg · {dims}cm</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '9px 12px', border: '1px solid var(--mv-hairline)' }}>
            <div className="mv-label">Agreed Depot Slot</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: depotSlot ? 'var(--mv-green-deep)' : 'var(--mv-ink-45)', marginTop: 3 }}>
              {depotSlot || 'Pending agree'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
          <div className="mv-field">
            <label className="mv-label">Requested Collection Window</label>
            <input className="mv-input" value={window} onChange={e => setWindow(e.target.value)} placeholder="e.g. 15:00 - 17:00" />
          </div>
          <div className="mv-field">
            <label className="mv-label">Negotiation Status</label>
            <select className="mv-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending_depot">Awaiting Depot Review</option>
              <option value="in_negotiation">In Negotiation (Slot Clash)</option>
              <option value="confirmed">Collection Approved & Booked</option>
              <option value="rejected">Slot Rejected</option>
            </select>
          </div>
          <div className="mv-field">
            <label className="mv-label">Daily / Weekly Volume</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="number" className="mv-input" value={daily} onChange={e => setDaily(e.target.value)} placeholder="Daily" />
              <input type="number" className="mv-input" value={weekly} onChange={e => setWeekly(e.target.value)} placeholder="Weekly" />
            </div>
          </div>
          <div className="mv-field">
            <label className="mv-label">Agreed Depot Slot (if counter-offered)</label>
            <input className="mv-input" value={depotSlot} onChange={e => setDepotSlot(e.target.value)} placeholder="e.g. 14:30 - 15:30" />
          </div>
          <div className="mv-field" style={{ gridColumn: 'span 2' }}>
            <label className="mv-label">Negotiation / Depot Notes</label>
            <input className="mv-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Driver arrives at 16:15" />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="mv-btn mv-btn--primary mv-btn--sm" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save Collection Details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SENSEI BRIDGE MODAL ───
function SenseiBridgeModal({ customer, onb, onClose }) {
  const [copied, setCopied] = useState(false);
  const [pushed, setPushed] = useState(false);

  const payload = {
    customer_id: customer?.id,
    account_number: customer?.account_number,
    business_name: customer?.business_name,
    email: customer?.primary_email,
    phone: customer?.phone_number,
    address: {
      line1: customer?.address_line_1,
      city: customer?.city,
      county: customer?.county,
      postcode: customer?.postcode,
      country: customer?.country || 'GB',
    },
    active_tracks: onb.active_tracks,
    collection_details: onb.collection_details,
    target_go_live: onb.target_go_live,
    exported_at: new Date().toISOString()
  };

  const jsonStr = JSON.stringify(payload, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulatePush = () => {
    setPushed(true);
    setTimeout(() => setPushed(false), 3000);
  };

  return (
    <div className="ds-modal-scrim">
      <div className="ds-modal" style={{ width: '100%', maxWidth: 580 }}>
        <div className="ds-modal-head">
          <div className="ds-kicker">Integration Bridge</div>
          <h2 className="ds-h1" style={{ fontSize: 20, margin: '6px 0 4px' }}>Sensei System Payload Exporter</h2>
          <div className="ds-blurb">Push structured account data to Sensei for Ninja activation and carrier links.</div>
        </div>
        <div className="ds-modal-body">
          <pre style={{
            background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline)',
            padding: 12, fontSize: 11, fontFamily: 'ui-monospace, monospace', maxHeight: 220, overflowY: 'auto',
            color: 'var(--mv-ink)'
          }}>
            {jsonStr}
          </pre>
        </div>
        <div className="ds-modal-foot">
          <button className="mv-btn mv-btn--sm" onClick={copy}>
            <Copy size={13} /> {copied ? 'Copied Payload!' : 'Copy JSON'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mv-btn mv-btn--sm" onClick={onClose}>Close</button>
            <button className="mv-btn mv-btn--primary mv-btn--sm" onClick={simulatePush}>
              <Rocket size={13} /> {pushed ? 'Pushed Successfully' : 'Push to Sensei'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADD TRACK MODAL ───
function AddTrackModal({ onb, onClose, onAdded }) {
  const [selectedTrack, setSelectedTrack] = useState('ups');
  const add = useMutation({
    mutationFn: () => onboardingApi.addTrack(onb.id, selectedTrack),
    onSuccess: () => { onAdded(); onClose(); }
  });

  const available = [
    { id: 'dpd_master', label: 'DPD Moov Master (<150 pkts/wk)' },
    { id: 'dpd_sub',    label: 'DPD Sub-Account (Dedicated Collection)' },
    { id: 'ups',        label: 'UPS Direct Track' },
    { id: 'yodel',      label: 'Yodel Carrier Track' },
  ].filter(t => !(onb.active_tracks || []).includes(t.id));

  return (
    <div className="ds-modal-scrim">
      <div className="ds-modal" style={{ width: '100%', maxWidth: 440 }}>
        <div className="ds-modal-head">
          <div className="ds-kicker">Courier Branch</div>
          <h2 className="ds-h1" style={{ fontSize: 20, margin: '6px 0 4px' }}>Attach Courier Track</h2>
          <div className="ds-blurb">Add a parallel courier branch to this customer’s onboarding board.</div>
        </div>
        <div className="ds-modal-body">
          {available.length === 0 ? (
            <div className="mv-blurb">All standard courier tracks are already active.</div>
          ) : (
            <div className="mv-field">
              <label className="mv-label">Courier Track</label>
              <select className="mv-input" value={selectedTrack} onChange={e => setSelectedTrack(e.target.value)}>
                {available.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="ds-modal-foot">
          <button className="mv-btn mv-btn--sm" onClick={onClose}>Cancel</button>
          <button className="mv-btn mv-btn--primary mv-btn--sm" disabled={!available.length || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? 'Attaching…' : 'Attach Track'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CALL PANEL ───
function CallPanel({ onb, onChange }) {
  const [booked, setBooked] = useState(!!onb.call_booked);
  const [date, setDate] = useState(onb.call_booked_for ? onb.call_booked_for.slice(0, 10) : '');
  const save = useMutation({
    mutationFn: () => onboardingApi.setCall(onb.id, { call_booked: booked, call_booked_for: booked ? (date || null) : null }),
    onSuccess: onChange,
  });
  const dirty = booked !== !!onb.call_booked || (date || '') !== (onb.call_booked_for ? onb.call_booked_for.slice(0, 10) : '');

  return (
    <div style={{ marginBottom: 20, padding: '12px 14px', background: 'var(--mv-surface)', borderLeft: `3px solid ${booked ? 'var(--mv-green)' : 'var(--mv-divider)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Phone size={15} color={booked ? 'var(--mv-green)' : 'var(--mv-ink-45)'} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>Onboarding Call</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--mv-ink-78)', marginLeft: 6 }}>
          <input type="checkbox" checked={booked} onChange={e => setBooked(e.target.checked)} style={{ accentColor: 'var(--mv-purple)' }} /> Call booked
        </label>
        {booked && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--mv-ink-78)' }}>
            for <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mv-input" style={{ width: 'auto', padding: '3px 6px' }} />
          </label>
        )}
        {dirty && <button className="mv-btn mv-btn--sm mv-btn--primary" style={{ marginLeft: 'auto' }} disabled={save.isPending || (booked && !date)} onClick={() => save.mutate()}>Save</button>}
      </div>
    </div>
  );
}

// ─── STAGE BLOCK ───
function StageBlock({ stage, onChange }) {
  const tasks = stage.tasks.filter(t => !t.parent_task_id);
  const done = tasks.filter(t => t.status === 'complete').length;
  const stageComplete = tasks.length && done === tasks.length;
  return (
    <div style={{ marginBottom: 24, background: 'var(--mv-surface)', borderTop: '2px solid var(--mv-divider)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div className="mv-section" style={{ marginBottom: 0, color: stageComplete ? 'var(--mv-green-deep)' : 'var(--mv-purple)' }}>
          {stage.name}
        </div>
        <span className="mv-num" style={{ fontSize: 11.5, color: 'var(--mv-ink-52)' }}>
          {done}/{tasks.length}{stage.started_at ? ` · ${fmtDuration(stage.started_at, stage.completed_at)}${stage.completed_at ? '' : ' elapsed'}` : ''}
        </span>
      </div>
      <div className="mv-rule" style={{ marginTop: 8, marginBottom: 8 }} />
      <div>
        {tasks.map(t => <TaskRow key={t.id} task={t} onChange={onChange} />)}
      </div>
    </div>
  );
}

// ─── TASK ROW ───
function TaskRow({ task, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => staffApi.list() });

  const [mk, label] = STATUS[task.status] || STATUS.not_started;
  const overdue = task.due_at && task.status !== 'complete' && new Date(task.due_at) < new Date();

  const update = useMutation({
    mutationFn: (patch) => onboardingApi.updateTask(task.id, patch),
    onSuccess: onChange,
    onError: (e) => {
      const b = e?.response?.data;
      if (b?.blockers) alert(`Blocked by: ${b.blockers.join(', ')}`);
      else alert(b?.error || 'Update failed');
    },
  });

  function cycleStatus() {
    const next = NEXT[task.status] || 'in_progress';
    update.mutate({ status: next });
  }

  const checklistDone = (task.checklist || []).filter(c => c.is_done).length;

  return (
    <div style={{ borderBottom: '1px solid var(--mv-hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
        {/* Status toggle mark */}
        <button onClick={cycleStatus} title={`${label} — click to advance`}
          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, flexShrink: 0, width: 110, textAlign: 'left', fontFamily: 'inherit' }}>
          <span className={`mv-state mv-state--${mk}`}>
            <span className={`mv-mark mv-mark--${mk}`} />
            <span className="mv-state-label">{label}</span>
          </span>
        </button>

        {/* Track Badge */}
        <span style={{
          fontSize: 9.5, fontWeight: 700, padding: '2px 6px', textTransform: 'uppercase',
          background: 'var(--mv-bg)', color: 'var(--mv-ink-78)', border: '1px solid var(--mv-hairline-2)', flexShrink: 0
        }}>
          {TRACK_LABELS[task.track_code] || 'Core'}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{task.title}</span>
          {!task.is_required && <span style={{ fontSize: 10, color: 'var(--mv-ink-45)', marginLeft: 6 }}>(optional)</span>}
        </div>

        {task.due_at && (
          <span className="mv-num" style={{ fontSize: 11, color: overdue ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-62)', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Clock size={12} /> {overdue ? 'Overdue' : new Date(task.due_at).toLocaleDateString('en-GB')}
          </span>
        )}

        <select value={task.assignee_id || ''} onChange={e => update.mutate({ assignee_id: e.target.value || null })}
          className="mv-input" style={{ width: 120, fontSize: 11.5, flexShrink: 0, padding: '2px 4px' }}>
          <option value="">Unassigned</option>
          {staff.map(st => <option key={st.id} value={st.id}>{st.full_name}</option>)}
        </select>

        {task.comms_template_id && (
          <button title="Send linked email" onClick={() => { if (confirm('Send the linked email to this customer?')) onboardingApi.sendComms(task.id).then(onChange).catch(err => alert(err?.response?.data?.error || 'Send failed')); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.comms_sent_at ? 'var(--mv-green-deep)' : 'var(--mv-purple)', flexShrink: 0 }}>
            <Send size={14} />
          </button>
        )}

        <button onClick={() => setExpanded(x => !x)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', flexShrink: 0 }}>
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {(task.started_at || task.checklist?.length > 0 || task.notes?.length > 0) && (
        <div style={{ display: 'flex', gap: 14, padding: '0 0 8px', fontSize: 11, color: 'var(--mv-ink-45)' }}>
          {task.started_at && <span>{task.completed_at ? `Took ${fmtDuration(task.started_at, task.completed_at)}` : `Running ${fmtDuration(task.started_at)}`}</span>}
          {(task.checklist?.length > 0) && <span className="mv-num">{checklistDone}/{task.checklist.length} sub-tasks</span>}
          {(task.notes?.length > 0) && <span>{task.notes.length} notes</span>}
        </div>
      )}

      {expanded && <TaskDetail task={task} onChange={onChange} />}
    </div>
  );
}

// ─── TASK DETAIL (Sub-tasks, notes) ───
function TaskDetail({ task, onChange }) {
  const [newItem, setNewItem] = useState('');
  const [newNote, setNewNote] = useState('');

  const addChk  = useMutation({ mutationFn: () => onboardingApi.addChecklist(task.id, newItem.trim()), onSuccess: () => { setNewItem(''); onChange(); } });
  const toggle  = useMutation({ mutationFn: ({ id, done }) => onboardingApi.toggleChecklist(id, done), onSuccess: onChange });
  const delChk  = useMutation({ mutationFn: (id) => onboardingApi.deleteChecklist(id), onSuccess: onChange });
  const addNote = useMutation({ mutationFn: () => onboardingApi.addNote(task.id, newNote.trim()), onSuccess: () => { setNewNote(''); onChange(); } });

  return (
    <div style={{ padding: '6px 0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderTop: '1px dashed var(--mv-hairline)', marginTop: 4 }}>
      {/* Sub-tasks */}
      <div>
        <div className="mv-label">Sub-tasks</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {(task.checklist || []).map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: c.is_done ? 'var(--mv-ink-45)' : 'var(--mv-ink)' }}>
              <input type="checkbox" checked={c.is_done} onChange={e => toggle.mutate({ id: c.id, done: e.target.checked })} style={{ accentColor: 'var(--mv-purple)' }} />
              <span style={{ flex: 1, textDecoration: c.is_done ? 'line-through' : 'none' }}>{c.label}</span>
              <button onClick={() => delChk.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', fontSize: 14 }}>×</button>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <input className="mv-input" style={{ fontSize: 12 }} value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add sub-task…" onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) addChk.mutate(); }} />
          <button className="mv-btn mv-btn--sm" style={{ padding: '0 8px' }} disabled={!newItem.trim()} onClick={() => addChk.mutate()}><Plus size={13} /></button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="mv-label">Notes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {(task.notes || []).map(n => (
            <div key={n.id} style={{ fontSize: 12, color: 'var(--mv-ink-78)', background: '#FFFFFF', padding: '7px 9px', border: '1px solid var(--mv-hairline)' }}>
              <div>{n.body}</div>
              <div style={{ fontSize: 10, color: 'var(--mv-ink-45)', marginTop: 3 }}>{n.author_name || 'Team member'} · {new Date(n.created_at).toLocaleString('en-GB')}</div>
            </div>
          ))}
          {!task.notes?.length && <span className="mv-blurb" style={{ marginTop: 0 }}>No notes yet.</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <input className="mv-input" style={{ fontSize: 12 }} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note…" onKeyDown={e => { if (e.key === 'Enter' && newNote.trim()) addNote.mutate(); }} />
          <button className="mv-btn mv-btn--sm" style={{ padding: '0 8px' }} disabled={!newNote.trim()} onClick={() => addNote.mutate()}><MessageSquarePlus size={14} /></button>
        </div>
      </div>
    </div>
  );
}
