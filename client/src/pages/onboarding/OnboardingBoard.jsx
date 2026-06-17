import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Clock, ShieldCheck, Boxes, Cpu, Cable, Rocket,
  ArrowRightLeft, MessageSquare, AlertTriangle,
} from 'lucide-react';
import { onboardingApi } from '../../api/onboarding';

/* ──────────────────────────────────────────────────────────────────
 * Moov OS — Onboarding Engine: high-contrast cyber-dark Kanban board.
 *
 * Self-contained dark theme (inline styles) so it stands apart from the
 * light app shell. SLA states drive the card accent:
 *   • Standard         → cyan
 *   • Impending breach → bright orange
 *   • Overdue/breached → pulsing neon red
 * ────────────────────────────────────────────────────────────────── */

// ─── Theme ──────────────────────────────────────────────────────────
const T = {
  charcoal:   '#0B0E11',   // deep charcoal board background
  offBlack:   '#15191E',   // off-black card wrapper
  offBlack2:  '#1B2026',   // raised surface
  border:     'rgba(255,255,255,0.06)',
  textHi:     '#E8EEF4',
  textLo:     '#7C8794',
  cyan:       '#22D3EE',
  orange:     '#FB923C',
  red:        '#FF2D55',
};

// SLA accent per state.
const SLA = {
  standard:  { color: T.cyan,   glow: 'rgba(34,211,238,0.30)',  label: 'On track' },
  impending: { color: T.orange, glow: 'rgba(251,146,60,0.40)',  label: 'Breach soon' },
  breached:  { color: T.red,    glow: 'rgba(255,45,85,0.55)',   label: 'Overdue' },
};

// "Last reply by" colour-coded tracker.
const PARTY = {
  client:  { color: '#A78BFA', label: 'Client'  },
  team:    { color: T.cyan,    label: 'Team'     },
  carrier: { color: '#34D399', label: 'Carrier'  },
};

// Pipeline column definitions.
const COLUMNS = {
  verification:         { label: 'Verification',         icon: ShieldCheck },
  carrier_provisioning: { label: 'Carrier Provisioning', icon: Boxes       },
  tech_integration:     { label: 'Tech Integration',     icon: Cpu         },
  hardware_checklist:   { label: 'Hardware Checklist',   icon: Cable       },
  go_live_ready:        { label: 'Go-Live Ready',        icon: Rocket      },
};
const ORDER = Object.keys(COLUMNS);

// ─── SLA maths ──────────────────────────────────────────────────────
function slaState(card, nowMs) {
  if (!card.sla_due_at) return 'standard';
  const due   = new Date(card.sla_due_at).getTime();
  const start = card.status_entered_at ? new Date(card.status_entered_at).getTime() : due - 24 * 3600e3;
  const total = Math.max(due - start, 1);
  const remaining = due - nowMs;
  if (remaining <= 0) return 'breached';
  if (remaining / total <= 0.25) return 'impending';
  return 'standard';
}

function formatRemaining(due, nowMs) {
  if (!due) return '—';
  const ms = new Date(due).getTime() - nowMs;
  const overdue = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600);  s -= h * 3600;
  const m = Math.floor(s / 60);    s -= m * 60;
  const parts = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  return `${overdue ? '+' : ''}${parts}`;
}

function timeAgo(ts) {
  if (!ts) return 'No replies yet';
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Card ───────────────────────────────────────────────────────────
function Card({ card, nowMs, onMove }) {
  const state = slaState(card, nowMs);
  const s = SLA[state];
  const party = PARTY[card.last_reply_by] || null;
  const breached = state === 'breached';

  return (
    <div
      style={{
        background: T.offBlack,
        border: `1px solid ${s.color}`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 12,
        padding: '12px 13px',
        boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 0 18px ${s.glow}`,
        animation: breached ? 'moovPulse 1.4s ease-in-out infinite' : 'none',
      }}
    >
      {/* Top row — Moov ID + SLA chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12, fontWeight: 800, letterSpacing: 0.5, color: s.color,
        }}>
          {card.moov_id}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6,
          color: s.color, background: `${s.color}1A`,
          border: `1px solid ${s.color}55`, borderRadius: 999, padding: '2px 8px',
        }}>
          {breached ? <AlertTriangle size={11} /> : <Clock size={11} />}
          {s.label}
        </span>
      </div>

      {/* Trading name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Building2 size={15} color={T.textLo} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.textHi, lineHeight: 1.2 }}>
          {card.trading_name || card.legal_name}
        </span>
      </div>

      {/* Active action item */}
      <div style={{
        background: T.offBlack2, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: '7px 9px', marginBottom: 10,
      }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.textLo, marginBottom: 2 }}>
          Active Action
        </div>
        <div style={{ fontSize: 12.5, color: T.textHi, fontWeight: 600 }}>
          {card.active_action_item || '—'}
        </div>
      </div>

      {/* SLA countdown */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 10 }}>
        <Clock size={13} color={s.color} />
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 16, fontWeight: 800, color: s.color, letterSpacing: 0.5,
        }}>
          {formatRemaining(card.sla_due_at, nowMs)}
        </span>
        <span style={{ fontSize: 10, color: T.textLo, fontWeight: 600 }}>
          {breached ? 'overdue' : 'remaining'}
        </span>
      </div>

      {/* Last-reply tracker (colour-coded by party) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${T.border}`, paddingTop: 9,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: party ? party.color : T.textLo,
            boxShadow: party ? `0 0 7px ${party.color}` : 'none', flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: party ? party.color : T.textLo }}>
            {party ? party.label : 'Awaiting'}
          </span>
          <span style={{ fontSize: 11, color: T.textLo }}>· {timeAgo(card.last_reply_at)}</span>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.textLo }}>
          <MessageSquare size={11} /> {card.interaction_count ?? 0}
        </span>
      </div>

      {/* Advance control */}
      {card.status !== 'go_live_ready' && (
        <button
          onClick={() => onMove(card)}
          style={{
            marginTop: 10, width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, background: 'transparent',
            border: `1px solid ${T.border}`, color: T.textLo, borderRadius: 8,
            padding: '6px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.color = s.color; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textLo; }}
        >
          <ArrowRightLeft size={12} /> Advance stage
        </button>
      )}
    </div>
  );
}

// ─── Board ──────────────────────────────────────────────────────────
export default function OnboardingBoard() {
  const qc = useQueryClient();
  const [nowMs, setNowMs] = useState(Date.now());

  // Tick the SLA countdown every second.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-board'],
    queryFn: onboardingApi.board,
    refetchInterval: 30_000,
  });

  async function handleMove(card) {
    const idx = ORDER.indexOf(card.status);
    const next = ORDER[Math.min(idx + 1, ORDER.length - 1)];
    if (next === card.status) return;
    await onboardingApi.setStatus(card.id, next);
    qc.invalidateQueries({ queryKey: ['onboarding-board'] });
  }

  const columns = data?.columns || ORDER.map(status => ({ status, cards: [] }));
  const total = data?.total || 0;

  return (
    <div style={{ background: T.charcoal, minHeight: 'calc(100vh - 64px)', margin: -24, padding: 24, color: T.textHi }}>
      {/* Keyframes for the breached pulse */}
      <style>{`
        @keyframes moovPulse {
          0%,100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 10px ${SLA.breached.glow}; }
          50%     { box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 26px ${SLA.breached.color}; }
        }
        .moov-col::-webkit-scrollbar { width: 6px; }
        .moov-col::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.textHi, letterSpacing: 0.3, margin: 0 }}>
            Onboarding Engine
          </h1>
          <p style={{ fontSize: 12.5, color: T.textLo, margin: '4px 0 0' }}>
            {total} active onboarding{total === 1 ? '' : 's'} · live SLA tracking
          </p>
        </div>
        {/* SLA legend */}
        <div style={{ display: 'flex', gap: 14 }}>
          {Object.entries(SLA).map(([k, v]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textLo }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: v.color, boxShadow: `0 0 8px ${v.glow}` }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Columns */}
      {isLoading ? (
        <div style={{ color: T.textLo, fontSize: 13, padding: 40 }}>Loading pipeline…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ORDER.length}, minmax(248px, 1fr))`, gap: 14, alignItems: 'start' }}>
          {columns.map(col => {
            const meta = COLUMNS[col.status] || { label: col.status, icon: Boxes };
            const Icon = meta.icon;
            return (
              <div key={col.status} style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${T.border}`, borderRadius: 14, padding: 12 }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon size={15} color={T.cyan} />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.textHi, letterSpacing: 0.3 }}>{meta.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: T.textLo, background: T.offBlack2, borderRadius: 999, padding: '1px 8px' }}>
                    {col.cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="moov-col" style={{ display: 'flex', flexDirection: 'column', gap: 11, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                  {col.cards.length === 0 ? (
                    <div style={{ fontSize: 11.5, color: T.textLo, textAlign: 'center', padding: '18px 0', opacity: 0.6 }}>Empty</div>
                  ) : (
                    col.cards.map(card => (
                      <Card key={card.id} card={card} nowMs={nowMs} onMove={handleMove} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
