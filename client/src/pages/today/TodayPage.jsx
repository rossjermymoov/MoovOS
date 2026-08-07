/**
 * Today — the operator's landing screen, first screen built to the new design
 * system (docs/design-rules.md). No boxes: structure comes from 2px rules,
 * hairlines and whitespace. Four figures, each a way in. One status language.
 * Everything flush left, Archivo, tabular numerals.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtNum = (v) => (v == null ? '—' : new Intl.NumberFormat('en-GB').format(v));
const fmtDate = (d) => { if (!d) return '—'; const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; };
const isOverdue = (t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString());

export default function TodayPage() {
  const navigate = useNavigate();

  const tasksQ = useQuery({ queryKey: ['today', 'tasks'], queryFn: () => api.get('/tasks').then(r => (Array.isArray(r.data) ? r.data : [])), staleTime: 60_000 });
  const queriesQ = useQuery({ queryKey: ['today', 'queries'], queryFn: () => api.get('/queries', { params: { limit: 1 } }).then(r => r.data).catch(() => null), staleTime: 60_000 });
  const stopQ = useQuery({ queryKey: ['today', 'onstop'], queryFn: () => api.get('/customers', { params: { is_on_stop: true, limit: 1 } }).then(r => r.data).catch(() => null), staleTime: 60_000 });
  const trackQ = useQuery({ queryKey: ['today', 'tracking'], queryFn: () => api.get('/tracking', { params: { limit: 1 } }).then(r => r.data).catch(() => null), staleTime: 60_000 });

  const allTasks = tasksQ.data || [];
  const openTasks = allTasks.filter(t => t.status !== 'done' && !t.parent_id);
  const overdue = openTasks.filter(isOverdue);
  const unassigned = openTasks.filter(t => !t.assignee_id);

  const ticketTotal = queriesQ.data?.total ?? queriesQ.data?.data?.length ?? null;
  const onStopTotal = stopQ.data?.total ?? null;
  const trackTotal = trackQ.data?.total ?? trackQ.data?.data?.length ?? trackQ.data?.rows?.length ?? null;

  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // Colleague-voice summary — say what happened and what it means.
  const summary = (() => {
    const parts = [];
    if (ticketTotal) parts.push(`${ticketTotal} ticket${ticketTotal === 1 ? ' is' : 's are'} in the inbox`);
    if (overdue.length) parts.push(`${overdue.length} task${overdue.length === 1 ? ' is' : 's are'} past due`);
    if (onStopTotal) parts.push(`${onStopTotal} account${onStopTotal === 1 ? ' is' : 's are'} on stop`);
    if (!parts.length) return 'Nothing is waiting on a person this morning. New work will surface here as it comes in.';
    return parts.join(', ').replace(/,([^,]*)$/, ' and$1') + '.';
  })();

  const figures = [
    { label: 'Open tickets', value: ticketTotal, sub: ticketTotal ? 'waiting for a reply' : 'inbox is clear', to: '/queries', go: 'Show me the inbox' },
    { label: 'Tasks in flight', value: openTasks.length, sub: overdue.length ? `${overdue.length} past their due date` : 'all on track', to: '/tasks', go: 'Open the board' },
    { label: 'Accounts on stop', value: onStopTotal, sub: onStopTotal ? 'awaiting a credit decision' : 'none right now', to: '/customers', go: 'Show me' },
    { label: 'Parcels tracked', value: trackTotal, sub: 'across every carrier', to: '/tracking', go: 'Open tracking' },
  ];

  const mark = (t) => {
    if (isOverdue(t)) return ['attention', 'Overdue'];
    if (!t.assignee_id) return ['waiting', 'Unassigned'];
    return ['progress', 'In progress'];
  };
  const attention = openTasks.slice().sort((a, b) => {
    const ad = a.due_date ? +new Date(a.due_date) : Infinity;
    const bd = b.due_date ? +new Date(b.due_date) : Infinity;
    return ad - bd;
  }).slice(0, 6);

  return (
    <div className="moov-ds" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '34px 40px 56px' }}>
      {/* header */}
      <div className="ds-pagehead">
        <div style={{ maxWidth: 640 }}>
          <div className="ds-kicker">Moov OS</div>
          <h1 className="ds-h1" style={{ margin: '7px 0 10px' }}>Today</h1>
          <div className="ds-blurb">{summary}</div>
        </div>
        <div className="ds-label" style={{ paddingTop: 6, whiteSpace: 'nowrap' }}>{todayLabel}</div>
      </div>
      <hr className="ds-rule" />

      {/* figure strip — each figure is a way in */}
      <div className="ds-figures" style={{ padding: '28px 0' }}>
        {figures.map((f, i) => (
          <div key={i} className={'ds-figure' + (f.to ? ' clickable' : '')} onClick={() => f.to && navigate(f.to)}>
            <div className="ds-label">{f.label}</div>
            <div className="val" style={{ margin: '10px 0 5px' }}>{fmtNum(f.value)}</div>
            <div className="sub">{f.sub}</div>
            {f.to && <div className="go" style={{ marginTop: 12 }}>{f.go} →</div>}
          </div>
        ))}
      </div>
      <hr className="ds-rule" />

      {/* needs a person */}
      <div style={{ marginTop: 28 }}>
        <div className="ds-kicker" style={{ marginBottom: 16 }}>Needs a person</div>
        {tasksQ.isLoading ? (
          <div className="ds-blurb">Reading the board…</div>
        ) : attention.length === 0 ? (
          <div className="ds-blurb">Nothing is waiting on a person right now. New work will appear here as it comes in.</div>
        ) : (
          <table className="ds-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Task</th>
                <th>Space</th>
                <th>Owner</th>
                <th style={{ textAlign: 'right' }}>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attention.map(t => {
                const [m, label] = mark(t);
                return (
                  <tr key={t.id} onClick={() => navigate('/tasks?task=' + t.id)}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td className="ds-muted">{t.space}</td>
                    <td>{t.assignee_name || <span className="ds-muted">Unassigned</span>}</td>
                    <td className="ds-num-cell" style={m === 'attention' ? { color: 'var(--moov-magenta-deep)', fontWeight: 600 } : undefined}>{fmtDate(t.due_date)}</td>
                    <td><span className={'ds-status ds-status--' + m}><span className={'ds-mark ds-mark--' + m} />{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
