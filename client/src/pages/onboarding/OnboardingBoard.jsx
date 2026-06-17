import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Clock, AlertTriangle, ArrowUpRight, User } from 'lucide-react';
import { onboardingApi } from '../../api/onboarding';

/* ──────────────────────────────────────────────────────────────────
 * Moov OS — Onboarding Engine board (cyber-dark).
 * Columns are the live stages customers are currently sitting in.
 * SLA accent comes from each card's next-due task:
 *   cyan = on track · orange = due soon · pulsing red = overdue.
 * ────────────────────────────────────────────────────────────────── */

const T = {
  charcoal: '#0B0E11', offBlack: '#15191E', offBlack2: '#1B2026',
  border: 'rgba(255,255,255,0.06)', textHi: '#E8EEF4', textLo: '#7C8794',
  cyan: '#22D3EE', orange: '#FB923C', red: '#FF2D55', green: '#34D399',
};
const SLA = {
  standard:  { color: T.cyan,   glow: 'rgba(34,211,238,0.30)', label: 'On track'  },
  impending: { color: T.orange, glow: 'rgba(251,146,60,0.40)', label: 'Due soon'  },
  breached:  { color: T.red,    glow: 'rgba(255,45,85,0.55)',  label: 'Overdue'   },
  none:      { color: T.textLo, glow: 'rgba(0,0,0,0)',         label: 'No due date' },
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

  return (
    <div onClick={onOpen} style={{
      background: T.offBlack, border: `1px solid ${s.color}`, borderLeft: `3px solid ${s.color}`,
      borderRadius: 12, padding: '12px 13px', cursor: 'pointer',
      boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 0 18px ${s.glow}`,
      animation: breached ? 'moovPulse 1.4s ease-in-out infinite' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, fontWeight: 800, color: s.color }}>
          {card.account_number || '—'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: s.color, background: `${s.color}1A`, border: `1px solid ${s.color}55`, borderRadius: 999, padding: '2px 8px' }}>
          {breached ? <AlertTriangle size={11} /> : <Clock size={11} />}{s.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Building2 size={15} color={T.textLo} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.textHi }}>{card.business_name}</span>
      </div>

      <div style={{ background: T.offBlack2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 9px', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: T.textLo, marginBottom: 2 }}>Next action</div>
        <div style={{ fontSize: 12.5, color: T.textHi, fontWeight: 600 }}>{card.next_action || 'All tasks complete'}</div>
      </div>

      {card.next_due_at && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 10 }}>
          <Clock size={13} color={s.color} />
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 15, fontWeight: 800, color: s.color }}>{fmtRemaining(card.next_due_at, nowMs)}</span>
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
  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 1000); return () => clearInterval(t); }, []);

  const { data, isLoading } = useQuery({ queryKey: ['onboarding-board'], queryFn: onboardingApi.board, refetchInterval: 30_000 });
  const columns = data?.columns || [];
  const total = data?.total || 0;

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.textHi, margin: 0 }}>Onboarding Engine</h1>
          <p style={{ fontSize: 12.5, color: T.textLo, margin: '4px 0 0' }}>{total} customer{total === 1 ? '' : 's'} onboarding · live SLA tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['standard', 'impending', 'breached'].map(k => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textLo }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: SLA[k].color, boxShadow: `0 0 8px ${SLA[k].glow}` }} />{SLA[k].label}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: T.textLo, fontSize: 13, padding: 40 }}>Loading pipeline…</div>
      ) : !columns.length ? (
        <div style={{ color: T.textLo, fontSize: 13, padding: 40, textAlign: 'center' }}>
          No active onboardings. Start one from a customer record → Onboarding tab.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, minmax(252px, 1fr))`, gap: 14, alignItems: 'start' }}>
          {columns.map(col => (
            <div key={col.stage} style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${T.border}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: T.textHi }}>{col.stage}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: T.textLo, background: T.offBlack2, borderRadius: 999, padding: '1px 8px' }}>{col.cards.length}</span>
              </div>
              <div className="moov-col" style={{ display: 'flex', flexDirection: 'column', gap: 11, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
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
