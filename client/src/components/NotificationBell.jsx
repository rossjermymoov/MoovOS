/**
 * NotificationBell — universal, lives in the TopBar on every page.
 *
 * Shows a red badge with the number of things needing attention: unread event
 * notifications (assigned to you, comments) plus live "nudges" for tasks of
 * yours that are overdue or due soon. Polls every 60s.
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, Clock, MessageSquare, UserPlus, Check, Dot, AtSign } from 'lucide-react';
import { useMe } from '../hooks/useMe';
import { notificationsApi } from '../api/notifications';

const MUTED = 'rgba(32,30,29,0.55)';

// RAG-aligned severities: red = overdue/bad, amber = due soon / in progress, green = good, slate = info
const SEV = {
  red:   { colour: '#E91E8C', soft: '#FDECEC' },
  amber: { colour: '#F59E0B', soft: '#FEF3E2' },
  green: { colour: '#00C853', soft: '#E7F8EE' },
  info:  { colour: '#2563EB', soft: '#E7EEFD' },
};
function relTime(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 604800) return Math.floor(s / 86400) + 'd ago';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function dueLabel(due) {
  const days = Math.round((new Date(new Date(due).toDateString()) - new Date(new Date().toDateString())) / 86400000);
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
function typeIcon(type) {
  if (type === 'assigned') return <UserPlus size={15} />;
  if (type === 'mention') return <AtSign size={15} />;
  if (type === 'comment') return <MessageSquare size={15} />;
  return <Dot size={15} />;
}

export default function NotificationBell() {
  const { id: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 56, right: 16 });
  const panelRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['notifications', me],
    queryFn: () => notificationsApi.list(me),
    enabled: !!me,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const items = data?.items || [];
  const nudges = data?.nudges || [];
  const count = data?.unread_count || 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const inBtn = btnRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inBtn && !inPanel) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: Math.max(12, window.innerWidth - r.right) });
    }
    setOpen(o => !o);
  };

  const go = (n) => {
    setOpen(false);
    if (n.id && !String(n.id).startsWith('nudge-')) notificationsApi.markRead(n.id).then(() => qc.invalidateQueries(['notifications', me]));
    if (n.route) navigate(n.route);
  };
  const markAll = () => notificationsApi.markAllRead(me).then(() => qc.invalidateQueries(['notifications', me]));

  const panel = (
    <div ref={panelRef} style={{
      position: 'fixed', top: pos.top, right: pos.right, width: 380, maxHeight: '70vh',
      background: 'var(--mv-bg)', borderRadius: 0, boxShadow: '0 12px 32px rgba(32,30,29,0.18)',
      border: '2px solid var(--mv-divider)', zIndex: 1000, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--mv-font)', color: 'var(--mv-ink)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '2px solid var(--mv-divider)', background: 'var(--mv-surface)' }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-.01em', textTransform: 'uppercase' }}>Notifications</span>
        {items.some(i => !i.read_at) && (
          <button onClick={markAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--mv-purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Check size={13} />Mark all read
          </button>
        )}
      </div>

      <div style={{ overflowY: 'auto' }}>
        {/* live urgency nudges */}
        {nudges.length > 0 && (
          <div style={{ padding: '6px 0' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mv-magenta-deep)', padding: '6px 16px' }}>Needs your attention</div>
            {nudges.map(n => {
              const sev = SEV[n.severity] || SEV.amber;
              return (
                <button key={n.id} onClick={() => go(n)} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', borderLeft: `3px solid ${sev.colour}`, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--mv-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ width: 24, height: 24, borderRadius: 0, background: sev.soft, color: sev.colour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {n.kind === 'overdue' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: sev.colour }}>{dueLabel(n.due_date)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* event notifications */}
        {items.length > 0 && (
          <div style={{ padding: '6px 0', borderTop: nudges.length ? '1px solid var(--mv-hairline)' : 'none' }}>
            {nudges.length > 0 && <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', padding: '6px 16px' }}>Activity</div>}
            {items.map(n => {
              const sev = SEV[n.severity] || SEV.info;
              return (
                <button key={n.id} onClick={() => go(n)} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: '10px 16px', background: n.read_at ? 'none' : 'rgba(123,47,190,0.04)', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--mv-surface)'} onMouseLeave={e => e.currentTarget.style.background = n.read_at ? 'none' : 'rgba(123,47,190,0.04)'}>
                  <span style={{ width: 24, height: 24, borderRadius: 0, background: sev.soft, color: sev.colour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{typeIcon(n.type)}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{n.title}</span>
                    {n.body && <span style={{ display: 'block', fontSize: 12, color: 'var(--mv-ink-62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</span>}
                    <span style={{ fontSize: 11, color: 'var(--mv-ink-45)' }}>{n.actor_name ? n.actor_name + ' · ' : ''}{relTime(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span style={{ width: 6, height: 6, borderRadius: 0, background: 'var(--mv-purple)', flexShrink: 0, marginTop: 5 }} />}
                </button>
              );
            })}
          </div>
        )}

        {nudges.length === 0 && items.length === 0 && (
          <div style={{ padding: '38px 20px', textAlign: 'center', color: 'var(--mv-ink-45)' }}>
            <Bell size={24} strokeWidth={1.4} style={{ opacity: .5 }} />
            <div style={{ fontSize: 13, marginTop: 10, fontWeight: 500 }}>{me ? 'You’re all caught up' : 'Sign in as a team member to see your alerts'}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={btnRef} style={{ position: 'relative' }}>
      <button onClick={toggle} className="mv-icon-btn" style={{
        background: open ? 'rgba(32,30,29,0.08)' : 'transparent',
        position: 'relative',
      }}>
        <Bell size={16} strokeWidth={1.5} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, minWidth: 14, height: 14, padding: '0 3px',
            borderRadius: 0, background: 'var(--mv-magenta)', color: '#fff', fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{count > 99 ? '99+' : count}</span>
        )}
      </button>
      {open && createPortal(panel, document.body)}
    </div>
  );
}
