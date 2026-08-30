import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Clock, AlertTriangle, ArrowUpRight, User, Truck,
  Layers, ChevronDown, ChevronUp, Search, Filter, ArrowRight
} from 'lucide-react';
import { onboardingApi } from '../../api/onboarding';

/* ──────────────────────────────────────────────────────────────────
 * Moov OS — Onboarding Engine Board (Cyber-dark)
 * Visual Multi-Track Pipeline & Process Tree Map
 * ────────────────────────────────────────────────────────────────── */

const T = {
  charcoal: '#0B0E11', offBlack: '#15191E', offBlack2: '#1B2026',
  border: 'rgba(255,255,255,0.06)', textHi: '#E8EEF4', textLo: '#7C8794',
  cyan: '#22D3EE', orange: '#FB923C', red: '#FF2D55', green: '#34D399',
  purple: '#A78BFA',
};

const SLA = {
  standard:  { color: T.cyan,   glow: 'rgba(34,211,238,0.30)', label: 'On track'  },
  impending: { color: T.orange, glow: 'rgba(251,146,60,0.40)', label: 'Due soon'  },
  breached:  { color: T.red,    glow: 'rgba(255,45,85,0.55)',  label: 'Overdue'   },
  none:      { color: T.textLo, glow: 'rgba(0,0,0,0)',         label: 'No due date' },
};

const TRACK_BADGES = {
  core:       { label: 'Core',         color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  dpd_master: { label: 'DPD Master',   color: '#00C853', bg: 'rgba(0,200,83,0.14)' },
  dpd_sub:    { label: 'DPD Sub-Acc',  color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  ups:        { label: 'UPS Direct',   color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  yodel:      { label: 'Yodel',        color: '#EC4899', bg: 'rgba(236,72,153,0.14)' },
};

function slaState(dueIso, nowMs) {
  if (!dueIso) return 'none';
  const remaining = new Date(dueIso).getTime() - nowMs;
  if (remaining <= 0) return 'breached';
  if (remaining <= 24 * 3600e3) return 'impending';
  return 'standard';
}

function fmtRemaining(dueIso, nowMs) {
  if (!dueIso) return '—';
  const ms = new Date(dueIso).getTime() - nowMs;
  const overdue = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600);  s -= h * 3600;
  const m = Math.floor(s / 60);    s -= m * 60;
  const txt = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  return `${overdue ? '+' : ''}${txt}`;
}

function Card({ card, nowMs, onOpen }) {
  const state = slaState(card.next_due_at, nowMs);
  const s = SLA[state];
  const breached = state === 'breached';
  const pct = card.tasks_total ? Math.round((card.tasks_done / card.tasks_total) * 100) : 0;

  const activeTracks = card.active_tracks || ['core', 'dpd_master'];
  const colDetails = card.collection_details || {};

  return (
    <div onClick={onOpen} style={{
      background: T.offBlack, border: `1px solid ${s.color}`, borderLeft: `3px solid ${s.color}`,
      borderRadius: 12, padding: '12px 13px', cursor: 'pointer',
      boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 0 18px ${s.glow}`,
      animation: breached ? 'moovPulse 1.4s ease-in-out infinite' : 'none',
    }}>
      {/* Top Header: Account number & SLA tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, fontWeight: 800, color: s.color }}>
          {card.account_number || '—'}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: 0.5, color: s.color, background: `${s.color}1A`,
          border: `1px solid ${s.color}55`, borderRadius: 999, padding: '2px 8px'
        }}>
          {breached ? <AlertTriangle size={11} /> : <Clock size={11} />}{s.label}
        </span>
      </div>

      {/* Business Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Building2 size={15} color={T.textLo} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.textHi }}>{card.business_name}</span>
      </div>

      {/* Courier Track Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {activeTracks.filter(tr => tr !== 'golive').map(tr => {
          const b = TRACK_BADGES[tr] || { label: tr, color: T.textLo, bg: 'rgba(255,255,255,0.05)' };
          return (
            <span key={tr} style={{
              fontSize: 9.5, fontWeight: 800, padding: '1.5px 6px', borderRadius: 4,
              color: b.color, background: b.bg, border: `1px solid ${b.color}44`, textTransform: 'uppercase'
            }}>
              {b.label}
            </span>
          );
        })}
      </div>

      {/* Next Action Box */}
      <div style={{ background: T.offBlack2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 9px', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.textLo, marginBottom: 2 }}>Next action</div>
        <div style={{ fontSize: 12.5, color: T.textHi, fontWeight: 600 }}>{card.next_action || 'All tasks complete'}</div>
      </div>

      {/* DPD Collection pill if present */}
      {colDetails.preferred_window && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#00C853', marginBottom: 8 }}>
          <Truck size={12} />
          <span>Slot: <strong>{colDetails.dpd_depot_slot || colDetails.preferred_window}</strong></span>
        </div>
      )}

      {card.next_due_at && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 10 }}>
          <Clock size={13} color={s.color} />
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 15, fontWeight: 800, color: s.color }}>
            {fmtRemaining(card.next_due_at, nowMs)}
          </span>
          <span style={{ fontSize: 10, color: T.textLo }}>{breached ? 'overdue' : 'to due'}</span>
        </div>
      )}

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? T.green : s.color }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: T.textLo }}>{card.tasks_done}/{card.tasks_total}</span>
      </div>

      {/* Footer: Owner & Open Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 9 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textLo }}>
          <User size={11} /> {card.owner_name || 'Unassigned'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: s.color, fontWeight: 700 }}>
          Open <ArrowUpRight size={12} />
        </span>
      </div>
    </div>
  );
}

export default function OnboardingBoard() {
  const navigate = useNavigate();
  const [nowMs, setNowMs] = useState(Date.now());
  const [showTreeMap, setShowTreeMap] = useState(true);
  const [trackFilter, setTrackFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-board'],
    queryFn: onboardingApi.board,
    refetchInterval: 30_000
  });

  const rawColumns = data?.columns || [];
  const total = data?.total || 0;

  // Apply filters to cards
  const filteredColumns = rawColumns.map(col => {
    const matchingCards = col.cards.filter(c => {
      // Track filter
      if (trackFilter !== 'all') {
        const trs = c.active_tracks || ['core', 'dpd_master'];
        if (!trs.includes(trackFilter)) return false;
      }
      // SLA filter
      if (slaFilter !== 'all') {
        const st = slaState(c.next_due_at, nowMs);
        if (st !== slaFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.business_name || '').toLowerCase().includes(q);
        const matchesAcc = (c.account_number || '').toLowerCase().includes(q);
        if (!matchesName && !matchesAcc) return false;
      }
      return true;
    });
    return { ...col, cards: matchingCards };
  });

  return (
    <div style={{ background: T.charcoal, minHeight: 'calc(100vh - 64px)', margin: -24, padding: 24, color: T.textHi }}>
      <style>{`
        @keyframes moovPulse {
          0%,100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 10px ${SLA.breached.glow}; }
          50%     { box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 26px ${SLA.breached.color}; }
        }
        .moov-col::-webkit-scrollbar { width: 6px; }
        .moov-col::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 3px; }
      `}</style>

      {/* Top Title & SLA Summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.textHi, margin: 0 }}>Onboarding Engine</h1>
            <button onClick={() => setShowTreeMap(!showTreeMap)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6,
              background: 'rgba(0,200,83,0.12)', color: '#00C853', border: '1px solid rgba(0,200,83,0.3)',
              fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}>
              <Layers size={13} /> {showTreeMap ? 'Hide Process Tree' : 'View Process Tree'} {showTreeMap ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: T.textLo, margin: '4px 0 0' }}>
            {total} customer{total === 1 ? '' : 's'} onboarding · live multi-track SLA monitoring
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['standard', 'impending', 'breached'].map(k => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textLo }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: SLA[k].color, boxShadow: `0 0 8px ${SLA[k].glow}` }} />{SLA[k].label}
            </span>
          ))}
        </div>
      </div>

      {/* ─── VISUAL PROCESS TREE MAP REFERENCE BANNER ─── */}
      {showTreeMap && (
        <div style={{
          background: '#15191E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
          padding: '14px 18px', marginBottom: 18, color: '#E8EEF4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: '#00C853' }}>
              Standard Multi-Track Flow (Tree Architecture)
            </span>
            <span style={{ fontSize: 11, color: '#7C8794' }}>Trunk & Branch Process</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1.3fr auto 1fr', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#0B0E11', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#3B82F6' }}>1. INTAKE & VERIFICATION (Trunk)</div>
              <div style={{ fontSize: 10, color: '#7C8794', marginTop: 2 }}>Jotform / Sheet Ingest · Credit Check · Sensei Sync · Welcome Email</div>
            </div>
            <ArrowRight size={16} color="rgba(255,255,255,0.25)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ background: '#0B0E11', border: '1px solid rgba(0,200,83,0.4)', borderRadius: 6, padding: '5px 8px', fontSize: 10.5 }}>
                <span style={{ color: '#00C853', fontWeight: 700 }}>DPD Master:</span> Collection Form · Slot Negotiation · Label Setup
              </div>
              <div style={{ background: '#0B0E11', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 6, padding: '5px 8px', fontSize: 10.5 }}>
                <span style={{ color: '#3B82F6', fontWeight: 700 }}>DPD Sub:</span> Sub-Account Request · Direct Carrier Link
              </div>
              <div style={{ background: '#0B0E11', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6, padding: '5px 8px', fontSize: 10.5 }}>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>UPS Direct:</span> DC ID Link · Collection Schedule · Customs
              </div>
            </div>
            <ArrowRight size={16} color="rgba(255,255,255,0.25)" />
            <div style={{ background: '#0B0E11', border: '1px solid rgba(0,200,83,0.4)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#00C853' }}>3. GO-LIVE & CARE (Canopy)</div>
              <div style={{ fontSize: 10, color: '#7C8794', marginTop: 2 }}>Confirm Go-Live · CS Intro · Day 1 Care · Invoicing Handover</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FILTERS & SEARCH BAR ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
        background: T.offBlack, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', marginBottom: 18
      }}>
        {/* Track Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.textLo, textTransform: 'uppercase', marginRight: 4 }}>Track:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'dpd_master', label: 'DPD Master' },
            { id: 'dpd_sub', label: 'DPD Sub-Acc' },
            { id: 'ups', label: 'UPS Direct' },
          ].map(t => (
            <button key={t.id} onClick={() => setTrackFilter(t.id)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${trackFilter === t.id ? '#00C853' : 'rgba(255,255,255,0.08)'}`,
              background: trackFilter === t.id ? 'rgba(0,200,83,0.18)' : 'transparent',
              color: trackFilter === t.id ? '#00C853' : T.textLo
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* SLA Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.textLo, textTransform: 'uppercase', marginRight: 4 }}>SLA:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'standard', label: 'On Track' },
            { id: 'impending', label: 'Due Soon' },
            { id: 'breached', label: 'Overdue' },
          ].map(s => (
            <button key={s.id} onClick={() => setSlaFilter(s.id)} style={{
              padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${slaFilter === s.id ? '#22D3EE' : 'rgba(255,255,255,0.08)'}`,
              background: slaFilter === s.id ? 'rgba(34,211,238,0.18)' : 'transparent',
              color: slaFilter === s.id ? '#22D3EE' : T.textLo
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.offBlack2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px' }}>
          <Search size={13} color={T.textLo} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter customers…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: T.textHi, fontSize: 12, width: 140 }}
          />
        </div>
      </div>

      {/* ─── KANBAN COLUMNS ─── */}
      {isLoading ? (
        <div style={{ color: T.textLo, fontSize: 13, padding: 40 }}>Loading pipeline…</div>
      ) : !filteredColumns.length ? (
        <div style={{ color: T.textLo, fontSize: 13, padding: 40, textAlign: 'center' }}>
          No active onboardings found matching criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${filteredColumns.length}, minmax(260px, 1fr))`, gap: 14, alignItems: 'start' }}>
          {filteredColumns.map(col => (
            <div key={col.stage} style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${T.border}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: T.textHi }}>{col.stage}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: T.textLo, background: T.offBlack2, borderRadius: 999, padding: '1px 8px' }}>
                  {col.cards.length}
                </span>
              </div>
              <div className="moov-col" style={{ display: 'flex', flexDirection: 'column', gap: 11, maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
                {col.cards.map(card => (
                  <Card key={card.onboarding_id} card={card} nowMs={nowMs} onOpen={() => navigate(`/customers/${card.customer_id}`)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
