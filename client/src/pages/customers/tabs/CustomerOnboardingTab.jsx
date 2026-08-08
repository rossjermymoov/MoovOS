/**
 * CustomerOnboardingTab — the onboarding plan inside a customer record,
 * rebuilt on the moov.css design system. Grouped checklist by stage with the
 * four-mark status language, plus a "where it stands" rail. All data + logic
 * unchanged; presentation only.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rocket, Clock, Paperclip, MessageSquarePlus, Plus, ChevronDown, ChevronRight,
  Send, CheckCheck, Trash2, Phone,
} from 'lucide-react';
import { onboardingApi } from '../../../api/onboarding';
import { onboardingTemplatesApi } from '../../../api/onboardingTemplates';
import { staffApi } from '../../../api/staff';
import { teamsApi } from '../../../api/teams';

// status → one of the four marks + label
const STATUS = {
  not_started: ['waiting',   'Not started'],
  in_progress: ['flight',    'In progress'],
  blocked:     ['attention', 'Blocked'],
  complete:    ['settled',   'Complete'],
  skipped:     ['waiting',   'Skipped'],
};
const NEXT = { not_started: 'in_progress', in_progress: 'complete', complete: 'not_started', blocked: 'in_progress', skipped: 'not_started' };

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
  const refresh = () => { qc.invalidateQueries(key); qc.invalidateQueries(['customer', customerId]); qc.invalidateQueries(['onboarding-board']); };

  if (isLoading) return <div className="mv-blurb" style={{ padding: 24 }}>Loading…</div>;
  if (isError || !onb) return <StartPanel customerId={customerId} customer={customer} onStarted={refresh} />;

  return <ActivePlan onb={onb} customer={customer} onChange={refresh} />;
}

// ─── Start panel ─────────────────────────────────────────────
function StartPanel({ customerId, customer, onStarted }) {
  const { data: templates = [] } = useQuery({ queryKey: ['onb-templates'], queryFn: onboardingTemplatesApi.list });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list });
  const [templateId, setTemplateId] = useState(customer?.onboarding_template_id || '');
  const [goLive, setGoLive] = useState('');
  const [members, setMembers] = useState({});

  const start = useMutation({
    mutationFn: () => onboardingApi.start(customerId, {
      template_id: templateId, target_go_live: goLive || null, team_members: members,
    }),
    onSuccess: onStarted,
  });

  const active = templates.filter(t => t.is_active);
  return (
    <div style={{ maxWidth: 560 }}>
      <div className="mv-section">Start onboarding</div>
      <div className="mv-rule" style={{ marginBottom: 12 }} />
      <p className="mv-blurb" style={{ marginTop: 0, marginBottom: 18 }}>
        Pick a template and the person on each team for this client. Tasks are copied onto the customer,
        assigned to the right people, and their status switches to Onboarding.
      </p>

      <div className="mv-field">
        <label className="mv-label">Template</label>
        <select className="mv-input" value={templateId} onChange={e => setTemplateId(e.target.value)}>
          <option value="">Select a template…</option>
          {active.map(t => <option key={t.id} value={t.id}>{t.name} ({t.task_count} tasks)</option>)}
        </select>
      </div>

      <div className="mv-field">
        <label className="mv-label">Who’s doing each role?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {teams.map(team => (
            <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--mv-purple)', width: 110, flexShrink: 0 }}>{team.name}</span>
              <select className="mv-input" style={{ flex: 1 }} value={members[team.id] || ''}
                onChange={e => setMembers(m => ({ ...m, [team.id]: e.target.value }))}>
                <option value="">Select {team.name.toLowerCase()} member…</option>
                {(team.members || []).map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          ))}
          {!teams.length && <span className="mv-blurb" style={{ marginTop: 0 }}>No teams set up yet — add them in Settings → Staff & Teams.</span>}
        </div>
      </div>

      <div className="mv-field">
        <label className="mv-label">Target go-live</label>
        <input type="date" className="mv-input" style={{ maxWidth: 200 }} value={goLive} onChange={e => setGoLive(e.target.value)} />
      </div>

      {start.isError && <div className="mv-err">{start.error?.response?.data?.error || 'Could not start onboarding'}</div>}
      <button className="mv-btn mv-btn--primary" style={{ marginTop: 8 }} disabled={!templateId || start.isPending} onClick={() => start.mutate()}>
        <Rocket size={14} /> {start.isPending ? 'Starting…' : 'Start onboarding'}
      </button>
    </div>
  );
}

// ─── Active plan ─────────────────────────────────────────────
function ActivePlan({ onb, customer, onChange }) {
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 8 }}>
        <p className="mv-blurb" style={{ marginTop: 0 }}>
          {total} task{total === 1 ? '' : 's'} across {onb.stages.length} stage{onb.stages.length === 1 ? '' : 's'}.
          Started {fmtDuration(onb.started_at)} ago{onb.owner_name ? ` · owner ${onb.owner_name}` : ''}{onb.target_go_live ? ` · target go-live ${onb.target_go_live}` : ''}.
        </p>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="mv-btn mv-btn--danger mv-btn--sm" disabled={cancel.isPending}
            onClick={() => { if (confirm('Cancel this onboarding and remove its milestones & tasks? The customer stays in onboarding so you can start a new plan.')) cancel.mutate(); }}>
            <Trash2 size={13} /> Cancel
          </button>
          <button className="mv-btn mv-btn--primary mv-btn--sm" disabled={complete.isPending}
            onClick={() => {
              if (requiredOpen > 0) { if (confirm(`${requiredOpen} required task(s) still open. Force-complete anyway?`)) complete.mutate(true); }
              else complete.mutate(false);
            }}>
            <CheckCheck size={13} /> Complete onboarding
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, alignItems: 'start' }}>
        {/* Left — call panel + stages */}
        <div>
          <CallPanel onb={onb} onChange={onChange} />
          {onb.stages.map(stage => (
            <StageBlock key={stage.id} stage={stage} onChange={onChange} />
          ))}
        </div>

        {/* Right — where it stands */}
        <div>
          <div className="mv-section">Where it stands</div>
          <div className="mv-rule" style={{ marginBottom: 14 }} />
          <div style={{ fontWeight: 800, fontSize: 40, letterSpacing: '-.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
          <div className="mv-kpi-sub" style={{ marginTop: 8 }}>{done} of {total} tasks done{requiredOpen ? ` · ${requiredOpen} required still open` : ''}</div>
          <div className="mv-bar" style={{ width: '100%', height: 4, marginTop: 12 }}>
            <span className={pct === 100 ? '' : 'is-warn'} style={{ width: `${pct}%` }} />
          </div>
          <div className="mv-section" style={{ marginTop: 26, color: 'var(--mv-ink-45)' }}>How the clock works</div>
          <p className="mv-blurb" style={{ marginTop: 8 }}>
            The SLA starts after the onboarding call, not at signature. A blocked task stops the clock and names what it is waiting on.
          </p>
        </div>
      </div>
    </div>
  );
}

function CallPanel({ onb, onChange }) {
  const [booked, setBooked] = useState(!!onb.call_booked);
  const [date, setDate] = useState(onb.call_booked_for ? onb.call_booked_for.slice(0, 10) : '');
  const save = useMutation({
    mutationFn: () => onboardingApi.setCall(onb.id, { call_booked: booked, call_booked_for: booked ? (date || null) : null }),
    onSuccess: onChange,
  });
  const dirty = booked !== !!onb.call_booked || (date || '') !== (onb.call_booked_for ? onb.call_booked_for.slice(0, 10) : '');

  return (
    <div style={{ marginBottom: 26, padding: '14px 16px', borderLeft: `3px solid ${booked ? 'var(--mv-green)' : 'var(--mv-divider)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Phone size={16} color={booked ? 'var(--mv-green-deep)' : 'var(--mv-ink-45)'} />
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>Onboarding call</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--mv-ink-62)', marginLeft: 6 }}>
          <input type="checkbox" checked={booked} onChange={e => setBooked(e.target.checked)} style={{ accentColor: 'var(--mv-purple)' }} /> Call booked
        </label>
        {booked && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--mv-ink-62)' }}>
            for <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mv-input" style={{ width: 'auto' }} />
          </label>
        )}
        {dirty && <button className="mv-btn mv-btn--sm mv-btn--primary" style={{ marginLeft: 'auto' }} disabled={save.isPending || (booked && !date)} onClick={() => save.mutate()}>Save</button>}
      </div>
      <p className="mv-blurb" style={{ margin: '8px 0 0' }}>
        Tasks set to start after the onboarding call have their SLA dates calculated from this date.
        {booked && date ? ` Post-call SLAs run from ${new Date(date).toLocaleDateString('en-GB')}.` : ' Set a date to schedule them.'}
      </p>
    </div>
  );
}

function StageBlock({ stage, onChange }) {
  const tasks = stage.tasks.filter(t => !t.parent_task_id);
  const done = tasks.filter(t => t.status === 'complete').length;
  const stageComplete = tasks.length && done === tasks.length;
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div className="mv-section" style={{ marginBottom: 0, color: stageComplete ? 'var(--mv-green-deep)' : 'var(--mv-purple)' }}>{stage.name}</div>
        <span className="mv-num" style={{ fontSize: 11.5, color: 'var(--mv-ink-52)' }}>
          {done}/{tasks.length}{stage.started_at ? ` · ${fmtDuration(stage.started_at, stage.completed_at)}${stage.completed_at ? '' : ' elapsed'}` : ''}
        </span>
      </div>
      <div className="mv-rule" style={{ marginTop: 10 }} />
      <div>
        {tasks.map(t => <TaskRow key={t.id} task={t} onChange={onChange} />)}
      </div>
    </div>
  );
}

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        {/* Status toggle — a clickable mark + label, never a pill */}
        <button onClick={cycleStatus} title={`${label} — click to advance`}
          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, flexShrink: 0, width: 118, textAlign: 'left', fontFamily: 'inherit' }}>
          <span className={`mv-state mv-state--${mk}`}>
            <span className={`mv-mark mv-mark--${mk}`} />
            <span className="mv-state-label">{label}</span>
          </span>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{task.title}</span>
          {!task.is_required && <span style={{ fontSize: 10, color: 'var(--mv-ink-45)', marginLeft: 6 }}>(optional)</span>}
          {task.team_name && <span style={{ fontSize: 10, color: 'var(--mv-purple)', marginLeft: 6, fontWeight: 700 }}>{task.team_name}</span>}
        </div>

        {task.due_at ? (
          <span style={{ fontSize: 11, color: overdue ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-62)', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Clock size={12} /> {overdue ? 'Overdue' : new Date(task.due_at).toLocaleDateString('en-GB')}
          </span>
        ) : task.sla_basis === 'post_call' ? (
          <span style={{ fontSize: 11, color: 'var(--mv-purple)', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }} title="SLA starts after the onboarding call">
            <Clock size={12} /> After call
          </span>
        ) : null}

        <select value={task.assignee_id || ''} onChange={e => update.mutate({ assignee_id: e.target.value || null })}
          className="mv-input" style={{ width: 130, fontSize: 12, flexShrink: 0 }}>
          <option value="">Unassigned</option>
          {staff.map(st => <option key={st.id} value={st.id}>{st.full_name}</option>)}
        </select>

        {task.comms_template_id && (
          <button title="Send linked email" onClick={() => { if (confirm('Send the linked email to this customer?')) onboardingApi.sendComms(task.id).then(onChange).catch(err => alert(err?.response?.data?.error || 'Send failed')); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.comms_sent_at ? 'var(--mv-green-deep)' : 'var(--mv-teal-deep)', flexShrink: 0 }}>
            <Send size={15} />
          </button>
        )}

        <button onClick={() => setExpanded(x => !x)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', flexShrink: 0 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {(task.started_at || task.checklist?.length > 0 || task.notes?.length > 0 || task.attachments?.length > 0) && (
        <div style={{ display: 'flex', gap: 14, padding: '0 0 8px', fontSize: 11, color: 'var(--mv-ink-45)' }}>
          {task.started_at && <span>{task.completed_at ? `Took ${fmtDuration(task.started_at, task.completed_at)}` : `Running ${fmtDuration(task.started_at)}`}</span>}
          {(task.checklist?.length > 0) && <span>{checklistDone}/{task.checklist.length} sub-tasks</span>}
          {(task.notes?.length > 0) && <span>{task.notes.length} notes</span>}
          {(task.attachments?.length > 0) && <span>{task.attachments.length} files</span>}
        </div>
      )}

      {expanded && <TaskDetail task={task} onChange={onChange} />}
    </div>
  );
}

function TaskDetail({ task, onChange }) {
  const [newItem, setNewItem] = useState('');
  const [newNote, setNewNote] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const addChk  = useMutation({ mutationFn: () => onboardingApi.addChecklist(task.id, newItem.trim()), onSuccess: () => { setNewItem(''); onChange(); } });
  const toggle  = useMutation({ mutationFn: ({ id, done }) => onboardingApi.toggleChecklist(id, done), onSuccess: onChange });
  const delChk  = useMutation({ mutationFn: (id) => onboardingApi.deleteChecklist(id), onSuccess: onChange });
  const addNote = useMutation({ mutationFn: () => onboardingApi.addNote(task.id, newNote.trim()), onSuccess: () => { setNewNote(''); onChange(); } });
  const addFile = useMutation({ mutationFn: () => onboardingApi.addAttachment(task.id, { filename: fileName.trim(), url: fileUrl.trim() || null }), onSuccess: () => { setFileName(''); setFileUrl(''); onChange(); } });

  return (
    <div style={{ padding: '4px 0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Checklist + attachments */}
      <div>
        <Label>Sub-tasks</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
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

        <Label style={{ marginTop: 16 }}>Attachments</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {(task.attachments || []).map(a => (
            <div key={a.id} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={12} color="var(--mv-ink-45)" />
              {a.url ? <a href={a.url} target="_blank" rel="noreferrer" style={{ color: 'var(--mv-purple)' }}>{a.filename}</a> : a.filename}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <input className="mv-input" style={{ fontSize: 12 }} value={fileName} onChange={e => setFileName(e.target.value)} placeholder="Filename" />
          <input className="mv-input" style={{ fontSize: 12 }} value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="URL (optional)" />
          <button className="mv-btn mv-btn--sm" style={{ padding: '0 8px' }} disabled={!fileName.trim()} onClick={() => addFile.mutate()}><Plus size={13} /></button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Notes</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {(task.notes || []).map(n => (
            <div key={n.id} style={{ fontSize: 12, color: 'var(--mv-ink-78)', background: 'var(--mv-surface)', padding: '7px 9px' }}>
              <div>{n.body}</div>
              <div style={{ fontSize: 10, color: 'var(--mv-ink-45)', marginTop: 3 }}>{n.author_name || 'Someone'} · {new Date(n.created_at).toLocaleString('en-GB')}</div>
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

function Label({ children, style }) {
  return <div className="mv-label" style={style}>{children}</div>;
}
