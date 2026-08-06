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
import { Bell, AlertTriangle, Clock, MessageSquare, UserPlus, Check, Dot } from 'lucide-react';
import { useMe } from '../hooks/useMe';
import { notificationsApi } from '../api/notifications';

const MUTED = 'rgba(255,255,255,0.40)';

// RAG-aligned severities: red = overdue/bad, amber = due soon / in progress, green = good, slate = info
const SEV = {
  red:   { colour: '#EF4444', soft: '#FDECEC' },
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
    const onDoc = (e) => { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); };
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
    <div style={{
      position: 'fixed', top: pos.top, right: pos.right, width: 380, maxHeight: '70vh',
      background: '#fff', borderRadius: 14, boxShadow: '0 18px 50px rgba(0,0,0,.22)',
      border: '1px solid #E2E8F0', zIndex: 1000, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter',system-ui,sans-serif", color: '#0F172A',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Notifications</span>
        {items.some(i => !i.read_at) && (
          <button onClick={markAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Check size={13} />Mark all read
          </button>
        )}
      </div>

      <div style={{ overflowY: 'auto' }}>
        {/* live urgency nudges */}
        {nudges.length > 0 && (
          <div style={{ padding: '6px 0' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#94A3B8', padding: '6px 16px' }}>Needs your attention</div>
            {nudges.map(n => {
              const sev = SEV[n.severity] || SEV.amber;
              return (
                <button key={n.id} onClick={() => go(n)} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', borderLeft: `3px solid ${sev.colour}`, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: sev.soft, color: sev.colour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {n.kind === 'overdue' ? <AlertTriangle size={15} /> : <Clock size={15} />}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: sev.colour }}>{dueLabel(n.due_date)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* event notifications */}
        {items.length > 0 && (
          <div style={{ padding: '6px 0', borderTop: nudges.length ? '1px solid #F1F5F9' : 'none' }}>
            {nudges.length > 0 && <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#94A3B8', padding: '6px 16px' }}>Activity</div>}
            {items.map(n => {
              const sev = SEV[n.severity] || SEV.info;
              return (
                <button key={n.id} onClick={() => go(n)} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: '10px 16px', background: n.read_at ? 'none' : '#F5F9FF', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = n.read_at ? 'none' : '#F5F9FF'}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: sev.soft, color: sev.colour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{typeIcon(n.type)}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{n.title}</span>
                    {n.body && <span style={{ display: 'block', fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</span>}
                    <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{n.actor_name ? n.actor_name + ' · ' : ''}{relTime(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 5 }} />}
                </button>
              );
            })}
          </div>
        )}

        {nudges.length === 0 && items.length === 0 && (
          <div style={{ padding: '38px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Bell size={26} strokeWidth={1.4} style={{ opacity: .5 }} />
            <div style={{ fontSize: 13, marginTop: 10, fontWeight: 500 }}>{me ? 'You’re all caught up' : 'Sign in as a team member to see your alerts'}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={btnRef} style={{ position: 'relative' }}>
      <button onClick={toggle} style={{
        width: 32, height: 32, borderRadius: 8, background: open ? 'rgba(255,255,255,0.10)' : 'transparent',
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MUTED, position: 'relative',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
        onMouseLeave={e => e.currentTarget.style.background = open ? 'rgba(255,255,255,0.10)' : 'transparent'}>
        <Bell size={16} strokeWidth={1.5} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, minWidth: 15, height: 15, padding: '0 4px',
            borderRadius: 99, background: '#EF4444', color: '#fff', fontSize: 9.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #1A1A1F',
          }}>{count > 99 ? '99+' : count}</span>
        )}
      </button>
      {open && createPortal(panel, document.body)}
    </div>
  );
}
