/**
 * OnboardingBoard — /onboarding
 *
 * The Moov OS Onboarding Pipeline Board, built to docs/design-rules.md and moov.css.
 * Displays live multi-track customer onboarding, courier depot negotiation, and SLA monitoring.
 * Features:
 *   - Architectural Process Tree Map banner (Core Trunk → Courier Branches → Go-Live Canopy)
 *   - Multi-track filter chips (DPD Master, DPD Sub, UPS Direct) and SLA status chips
 *   - Kanban stage columns with zero-radius cards, proportion bars, and SLA indicators
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Clock, AlertTriangle, ArrowUpRight, User, Truck,
  Layers, ChevronDown, ChevronUp, Search, Plus, ArrowRight
} from 'lucide-react';
import { onboardingApi } from '../../api/onboarding';

// SLA states mapped to Moov OS status marks
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

const TRACK_LABELS = {
  core:       'Core',
  dpd_master: 'DPD Master',
  dpd_sub:    'DPD Sub-Acc',
  ups:        'UPS Direct',
  yodel:      'Yodel',
};

export default function OnboardingBoard() {
  const navigate = useNavigate();
  const [nowMs, setNowMs] = useState(Date.now());
  const [showMap, setShowMap] = useState(false);
  const [trackFilter, setTrackFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1-second ticker for live SLA countdowns
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-board'],
    queryFn: onboardingApi.getBoard,
    refetchInterval: 15_000,
  });

  const columns = data?.columns || [];
  const total = data?.total || 0;

  // Flatten all cards for KPI calculation
  const allCards = columns.flatMap(c => c.cards || []);

  const onTrackCount = allCards.filter(c => slaState(c.next_due_at, nowMs) === 'standard').length;
  const dueSoonCount = allCards.filter(c => slaState(c.next_due_at, nowMs) === 'impending').length;
  const overdueCount = allCards.filter(c => slaState(c.next_due_at, nowMs) === 'breached').length;
  const attentionCount = dueSoonCount + overdueCount;

  // Filter cards per column
  const filteredColumns = columns.map(col => {
    const cards = (col.cards || []).filter(card => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (card.business_name || '').toLowerCase().includes(q);
        const matchAcc = (card.account_number || '').toLowerCase().includes(q);
        if (!matchName && !matchAcc) return false;
      }
      // Track filter
      if (trackFilter !== 'all') {
        const trks = card.active_tracks || ['core', 'dpd_master'];
        if (!trks.includes(trackFilter)) return false;
      }
      // SLA filter
      if (slaFilter !== 'all') {
        const st = slaState(card.next_due_at, nowMs);
        if (slaFilter === 'standard' && st !== 'standard') return false;
        if (slaFilter === 'impending' && st !== 'impending') return false;
        if (slaFilter === 'breached' && st !== 'breached') return false;
      }
      return true;
    });
    return { ...col, cards };
  });

  // Summary colleague voice
  const summaryText = (() => {
    if (total === 0) return 'No customers are currently in the onboarding pipeline. New onboardings will appear here.';
    const parts = [];
    parts.push(`${total} customer${total === 1 ? ' is' : 's are'} active in onboarding`);
    if (overdueCount > 0) parts.push(`${overdueCount} past SLA target`);
    else if (dueSoonCount > 0) parts.push(`${dueSoonCount} due within 24 hours`);
    else parts.push('all courier tracks on schedule');
    return parts.join(', ') + '.';
  })();

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        {/* ── Page Header ── */}
        <div className="mv-head">
          <div>
            <div className="mv-kicker">Onboarding</div>
            <h1 className="mv-title">Onboarding Engine</h1>
            <p className="mv-blurb">{summaryText}</p>
          </div>
          <div className="mv-actions">
            <button className="mv-btn mv-btn--secondary" onClick={() => setShowMap(!showMap)}>
              <Layers size={14} /> {showMap ? 'Hide Process Map' : 'Process Tree Map'}
            </button>
          </div>
        </div>
        <div className="mv-rule" />

        {/* ── KPI Figure Strip ── */}
        <div className="mv-kpis">
          <div className="mv-kpi">
            <div className="mv-kpi-label">Active Onboardings</div>
            <div className="mv-kpi-value">{total}</div>
            <div className="mv-kpi-sub">across active courier tracks</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">On Track</div>
            <div className="mv-kpi-value" style={{ color: 'var(--mv-green-deep)' }}>{onTrackCount}</div>
            <div className="mv-kpi-sub">meeting courier SLA targets</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Needs Attention</div>
            <div className={`mv-kpi-value ${attentionCount > 0 ? 'is-attention' : ''}`}>{attentionCount}</div>
            <div className="mv-kpi-sub">{overdueCount} overdue · {dueSoonCount} due soon</div>
          </div>
          <div className="mv-kpi">
            <div className="mv-kpi-label">Courier Tracks</div>
            <div className="mv-kpi-value" style={{ fontSize: 20, paddingTop: 6 }}>DPD · UPS · Yodel</div>
            <div className="mv-kpi-sub">multi-carrier parallel flow</div>
          </div>
        </div>

        {/* ── Visual Process Tree Map Reference Banner (Expandable) ── */}
        {showMap && <ProcessTreeMap />}

        {/* ── Filter & Search Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 24, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Left: Track & SLA Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div className="mv-chips">
              <span className="mv-filter-label">Track:</span>
              {[
                { id: 'all', label: 'All Tracks' },
                { id: 'dpd_master', label: 'DPD Master' },
                { id: 'dpd_sub', label: 'DPD Sub-Acc' },
                { id: 'ups', label: 'UPS Direct' },
              ].map(t => (
                <button key={t.id} className={`mv-chip ${trackFilter === t.id ? 'is-on' : ''}`} onClick={() => setTrackFilter(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mv-chips">
              <span className="mv-filter-label">SLA:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'standard', label: 'On track', mark: 'settled' },
                { id: 'impending', label: 'Due soon', mark: 'flight' },
                { id: 'breached', label: 'Overdue', mark: 'attention' },
              ].map(s => (
                <button key={s.id} className={`mv-chip ${slaFilter === s.id ? 'is-on' : ''}`} onClick={() => setSlaFilter(s.id)}>
                  {s.mark && <span className={`mv-mark mv-mark--${s.mark}`} style={{ marginRight: 5 }} />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--mv-divider)', paddingBottom: 4, width: 220 }}>
            <Search size={14} color="var(--mv-ink-45)" />
            <input
              type="text"
              placeholder="Search customer…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: 'var(--mv-ink)', width: '100%' }}
            />
          </div>
        </div>

        {/* ── Kanban Columns ── */}
        {isLoading ? (
          <div className="mv-blurb" style={{ padding: '30px 0' }}>Reading the onboarding pipeline…</div>
        ) : filteredColumns.length === 0 || allCards.length === 0 ? (
          <div style={{ padding: '40px 0', borderTop: '1px solid var(--mv-hairline)' }}>
            <div className="mv-section">No Active Onboardings</div>
            <p className="mv-blurb">
              No customer onboardings matched your filter criteria. Open any customer record from the <strong>Customers</strong> directory to start a multi-track onboarding pipeline.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${filteredColumns.length}, minmax(280px, 1fr))`, gap: 20, alignItems: 'start', overflowX: 'auto', paddingBottom: 24 }}>
            {filteredColumns.map(col => (
              <div key={col.stage} style={{ minWidth: 280 }}>
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 8 }}>
                  <span className="mv-section" style={{ margin: 0, color: 'var(--mv-ink)' }}>{col.stage}</span>
                  <span className="mv-num" style={{ fontSize: 11, color: 'var(--mv-ink-52)', fontWeight: 600 }}>
                    {col.cards.length} {col.cards.length === 1 ? 'account' : 'accounts'}
                  </span>
                </div>
                <div className="mv-rule" style={{ marginBottom: 14 }} />

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.cards.map(card => (
                    <BoardCard
                      key={card.onboarding_id}
                      card={card}
                      nowMs={nowMs}
                      onOpen={() => navigate(`/customers/${card.customer_id}?tab=onboarding`)}
                    />
                  ))}
                  {col.cards.length === 0 && (
                    <div style={{ padding: '24px 12px', border: '1px dashed var(--mv-hairline)', textAlign: 'center', fontSize: 12, color: 'var(--mv-ink-45)' }}>
                      No accounts in this stage
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOARD CARD (Zero radius, Modernist Moov OS design) ───
function BoardCard({ card, nowMs, onOpen }) {
  const state = slaState(card.next_due_at, nowMs);
  const breached = state === 'breached';
  const impending = state === 'impending';

  // Left accent mark based on SLA state
  const leftAccent = breached ? 'var(--mv-magenta)' : impending ? 'var(--mv-purple)' : 'var(--mv-green)';
  const statusMark = breached ? 'attention' : impending ? 'flight' : 'settled';
  const statusLabel = breached ? 'Overdue' : impending ? 'Due soon' : 'On track';

  const pct = card.tasks_total ? Math.round((card.tasks_done / card.tasks_total) * 100) : 0;
  const activeTracks = card.active_tracks || ['core', 'dpd_master'];
  const colDetails = card.collection_details || {};

  return (
    <div
      onClick={onOpen}
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--mv-hairline)',
        borderLeft: `3px solid ${leftAccent}`,
        padding: '13px 14px',
        cursor: 'pointer',
        transition: 'box-shadow .12s, border-color .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Top row: Account number & SLA status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="mv-num" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mv-ink-62)' }}>
          {card.account_number || '—'}
        </span>
        <span className={`mv-state mv-state--${statusMark}`}>
          <span className={`mv-mark mv-mark--${statusMark}`} />
          <span className="mv-state-label" style={{ fontSize: 10 }}>{statusLabel}</span>
        </span>
      </div>

      {/* Business Name */}
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--mv-ink)', marginBottom: 8, letterSpacing: '-.01em' }}>
        {card.business_name}
      </div>

      {/* Courier Track Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {activeTracks.filter(tr => tr !== 'golive').map(tr => (
          <span key={tr} style={{
            fontSize: 9.5, fontWeight: 600, padding: '2px 6px',
            background: 'var(--mv-surface)', color: 'var(--mv-ink-78)',
            border: '1px solid var(--mv-hairline-2)', textTransform: 'uppercase', letterSpacing: '.05em'
          }}>
            {TRACK_LABELS[tr] || tr}
          </span>
        ))}
      </div>

      {/* Next Action Box */}
      <div style={{ background: 'var(--mv-surface)', padding: '7px 9px', marginBottom: 10, borderLeft: '2px solid var(--mv-divider)' }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mv-ink-52)', marginBottom: 2 }}>
          Next action
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mv-ink)' }}>
          {card.next_action || 'All tasks complete'}
        </div>
      </div>

      {/* DPD Collection slot if negotiated */}
      {colDetails.preferred_window && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--mv-green-deep)', marginBottom: 8 }}>
          <Truck size={13} color="var(--mv-green)" />
          <span>Slot: <strong>{colDetails.dpd_depot_slot || colDetails.preferred_window}</strong></span>
        </div>
      )}

      {/* SLA Countdown Timer */}
      {card.next_due_at && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <Clock size={12} color={breached ? 'var(--mv-magenta)' : 'var(--mv-ink-45)'} />
          <span className="mv-num" style={{ fontSize: 13, fontWeight: 700, color: breached ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)' }}>
            {fmtRemaining(card.next_due_at, nowMs)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--mv-ink-45)' }}>{breached ? 'overdue' : 'remaining'}</span>
        </div>
      )}

      {/* Progress Proportion Bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--mv-ink-52)', marginBottom: 4 }}>
          <span>Progress</span>
          <span className="mv-num">{card.tasks_done}/{card.tasks_total} ({pct}%)</span>
        </div>
        <div className="mv-bar" style={{ width: '100%', height: 3 }}>
          <span className={pct === 100 ? '' : 'is-warn'} style={{ width: `${pct}%`, background: pct === 100 ? 'var(--mv-green)' : 'var(--mv-purple)' }} />
        </div>
      </div>

      {/* Card Footer: Owner & Open Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--mv-hairline)', paddingTop: 8, fontSize: 11.5 }}>
        <span style={{ color: 'var(--mv-ink-52)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <User size={12} /> {card.owner_name || 'Unassigned'}
        </span>
        <span style={{ color: 'var(--mv-purple)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          Open <ArrowUpRight size={12} />
        </span>
      </div>
    </div>
  );
}

// ─── PROCESS TREE MAP REFERENCE BANNER ───
function ProcessTreeMap() {
  return (
    <div style={{ background: 'var(--mv-surface)', borderTop: '2px solid var(--mv-divider)', padding: '18px 20px', marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="mv-section" style={{ margin: 0 }}>Standard Multi-Track Flow (Tree Architecture)</span>
        <span className="mv-blurb" style={{ margin: 0, fontSize: 11.5 }}>Trunk & Branch Process Reference</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr auto 1.4fr auto 1.1fr', gap: 14, alignItems: 'center' }}>
        {/* Node 1: Core Trunk */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--mv-hairline)', borderLeft: '3px solid var(--mv-purple)', padding: 12 }}>
          <div className="mv-section" style={{ marginBottom: 4 }}>1. Intake & Verification (Trunk)</div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-78)' }}>JotForm / Sheet Ingest · Credit Check · Sensei Sync · Welcome Email</div>
        </div>

        {/* Arrow */}
        <div style={{ color: 'var(--mv-ink-45)' }}><ArrowRight size={16} /></div>

        {/* Node 2: Courier Branches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--mv-hairline)', borderLeft: '3px solid var(--mv-green)', padding: '7px 10px', fontSize: 11.5 }}>
            <strong style={{ color: 'var(--mv-green-deep)' }}>DPD Master:</strong> Collection Form · Slot Negotiation · Label Setup
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--mv-hairline)', borderLeft: '3px solid #3B82F6', padding: '7px 10px', fontSize: 11.5 }}>
            <strong style={{ color: '#2563EB' }}>DPD Sub:</strong> Sub-Account Request · Direct Carrier Link
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--mv-hairline)', borderLeft: '3px solid #F59E0B', padding: '7px 10px', fontSize: 11.5 }}>
            <strong style={{ color: '#B45309' }}>UPS Direct:</strong> DC ID Link · Collection Schedule · Customs
          </div>
        </div>

        {/* Arrow */}
        <div style={{ color: 'var(--mv-ink-45)' }}><ArrowRight size={16} /></div>

        {/* Node 3: Go-Live Canopy */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--mv-hairline)', borderLeft: '3px solid var(--mv-green)', padding: 12 }}>
          <div className="mv-section" style={{ marginBottom: 4, color: 'var(--mv-green-deep)' }}>3. Go-Live & Care (Canopy)</div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-78)' }}>Confirm Go-Live · CS Intro · Day 1 Care · Invoicing Handover</div>
        </div>
      </div>
    </div>
  );
}
