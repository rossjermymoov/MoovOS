/**
 * Today — the operator's landing screen, rebuilt to design direction 1c
 * ("Command Console"). Structural change from the previous version: the page
 * is ordered by what needs a decision rather than by figure-then-list.
 *
 *   1. Decide first   — overdue work, promoted ABOVE the figures, as tiles
 *                       with the action on them. Previously these were rows
 *                       four scrolls down with red text and nothing to click.
 *   2. Figures         — unchanged set, now cards; unassigned leads because it
 *                       is the only one that is nobody's job yet.
 *   3. Waiting on an owner — the remainder of the board, overdue excluded
 *                       (it is already handled above, and showing it twice
 *                       taught people to ignore the red).
 *
 * Data flow, query keys and endpoints are IDENTICAL to the previous version —
 * this is a presentation change only. Requires moov-v2.css.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtNum = (v) => (v == null ? '—' : new Intl.NumberFormat('en-GB').format(v));
const fmtDate = (d) => { if (!d) return '—'; const dt = new Date(d); return dt.getDate() + ' ' + MONTHS[dt.getMonth()]; };
const isOverdue = (t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString());

const daysLate = (d) => {
  if (!d) return null;
  const diff = Math.floor((new Date(new Date().toDateString()) - new Date(d)) / 86400000);
  if (diff <= 0) return null;
  return diff === 1 ? '1 day late' : diff + ' days late';
};

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
    { label: 'Unassigned', value: unassigned.length || null, sub: unassigned.length ? 'no owner yet' : 'everything has an owner', to: '/tasks', go: 'Assign them', tone: unassigned.length ? 'attention' : null },
    { label: 'Open tickets', value: ticketTotal, sub: ticketTotal ? 'waiting for a reply' : 'inbox is clear', to: '/queries', go: 'Show me the inbox' },
    { label: 'Accounts on stop', value: onStopTotal, sub: onStopTotal ? 'awaiting a credit decision' : 'none right now', to: '/customers', go: 'Show me', tone: onStopTotal ? 'attention' : null },
    { label: 'Parcels tracked', value: trackTotal, sub: 'across every carrier', to: '/tracking', go: 'Open tracking' },
  ];

  // Overdue is handled in "Decide first", so it is excluded here rather than
  // repeated. Sorted soonest-due first, as before.
  const waiting = openTasks
    .filter(t => !isOverdue(t))
    .sort((a, b) => {
      const ad = a.due_date ? +new Date(a.due_date) : Infinity;
      const bd = b.due_date ? +new Date(b.due_date) : Infinity;
      return ad - bd;
    })
    .slice(0, 6);

  const mark = (t) => {
    if (isOverdue(t)) return ['attention', 'Overdue'];
    if (!t.assignee_id) return ['waiting', 'Unassigned'];
    return ['progress', 'In progress'];
  };

  const collapsed = Math.max(0, openTasks.length - overdue.length - waiting.length);

  return (
    <div className="moov-ds" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '26px 26px 48px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1600 }}>

        {/* header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 660 }}>
          <div className="ds-kicker">Moov OS · triage</div>
          <h1 className="ds-h1" style={{ margin: 0 }}>Today</h1>
          <div className="ds-blurb">{summary}</div>
        </div>

        {/* 1. decide first */}
        {overdue.length > 0 && (
          <section className="v2-panel v2-panel--alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <span className="ds-mark ds-mark--attention" />
              <span className="ds-kicker" style={{ color: 'var(--moov-magenta-deep)' }}>Decide first</span>
              <span className="ds-num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--moov-magenta-deep)' }}>
                {overdue.length} past due
              </span>
            </div>

            <div className="v2-grid v2-grid--tiles">
              {overdue.slice(0, 4).map(t => (
                <div className="v2-tile v2-tile--alert" key={t.id}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t.title}</span>
                    <span className="ds-num" style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--moov-magenta-deep)' }}>
                      {daysLate(t.due_date) || 'past due'}
                    </span>
                  </div>
                  <div className="ds-blurb" style={{ fontSize: 12.5 }}>
                    {t.space ? `${t.space} · ` : ''}
                    {t.assignee_name ? `${t.assignee_name} owns it` : 'nobody owns it yet'}
                    {t.due_date ? ` · was due ${fmtDate(t.due_date)}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                    <button className="ds-btn ds-btn-primary" onClick={() => navigate('/tasks?task=' + t.id)}>
                      Open task
                    </button>
                    <button className="ds-btn ds-btn-secondary" onClick={() => navigate('/tasks?task=' + t.id + '&assign=1')}>
                      Reassign
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {overdue.length > 4 && (
              <div className="ds-blurb" style={{ fontSize: 12.5 }}>
                {overdue.length - 4} more past due · <a href="/tasks" onClick={e => { e.preventDefault(); navigate('/tasks'); }}>open the board</a>
              </div>
            )}
          </section>
        )}

        {/* 2. figures */}
        <div className="v2-grid v2-grid--figures">
          {figures.map((f, i) => (
            <div
              className="v2-panel is-clickable"
              key={i}
              onClick={() => f.to && navigate(f.to)}
              style={{ gap: 4, borderTop: '2px solid ' + (f.tone === 'attention' ? 'var(--moov-magenta)' : 'var(--color-divider)') }}
            >
              <div className="ds-label" style={f.tone === 'attention' ? { color: 'var(--moov-magenta-deep)' } : undefined}>{f.label}</div>
              <div
                className="ds-num"
                style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 30, letterSpacing: '-.025em', color: f.tone === 'attention' ? 'var(--moov-magenta-deep)' : 'var(--color-text)' }}
              >
                {fmtNum(f.value)}
              </div>
              <div style={{ fontSize: 11.5, color: f.tone === 'attention' ? 'var(--moov-magenta-deep)' : 'var(--ds-muted)' }}>{f.sub}</div>
              <div className="go" style={{ marginTop: 9, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.11em', color: 'var(--color-accent)' }}>
                {f.go} →
              </div>
            </div>
          ))}
        </div>

        {/* 3. waiting on an owner */}
        <section className="v2-panel v2-panel--flush">
          <div style={{ padding: '15px 19px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="ds-kicker" style={{ color: 'var(--ds-muted)' }}>Waiting on an owner</span>
            <span className="ds-num" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ds-muted)' }}>
              {waiting.length} of {openTasks.length} open
            </span>
          </div>

          {tasksQ.isLoading ? (
            <div className="ds-blurb" style={{ padding: '0 19px 19px' }}>Reading the board…</div>
          ) : waiting.length === 0 ? (
            <div className="ds-blurb" style={{ padding: '0 19px 19px' }}>
              Nothing else is waiting on a person right now. New work will appear here as it comes in.
            </div>
          ) : (
            <>
              <div className="v2-table-wrap" style={{ boxShadow: 'none', borderRadius: 0 }}>
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Task</th>
                      <th>Space</th>
                      <th>Owner</th>
                      <th style={{ textAlign: 'right' }}>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waiting.map(t => {
                      const [m, label] = mark(t);
                      return (
                        <tr key={t.id} className={m === 'waiting' ? 'is-waiting' : undefined} onClick={() => navigate('/tasks?task=' + t.id)}>
                          <td style={{ fontWeight: 600 }}>{t.title}</td>
                          <td className="ds-muted">{t.space}</td>
                          <td>{t.assignee_name || <span className="ds-muted">Unassigned</span>}</td>
                          <td className="ds-num-cell">{fmtDate(t.due_date)}</td>
                          <td>
                            <span className={'ds-status ds-status--' + m}>
                              <span className={'ds-mark ds-mark--' + m} />{label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '13px 19px', borderTop: 'var(--ds-hairline)', fontSize: 12.5, color: 'var(--ds-muted)' }}>
                {collapsed > 0 ? `${collapsed} task${collapsed === 1 ? '' : 's'} collapsed · ` : ''}
                <a href="/tasks" onClick={e => { e.preventDefault(); navigate('/tasks'); }}>show everything</a>
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
}
