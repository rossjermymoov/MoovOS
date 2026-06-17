/**
 * CustomerOnboardingTab — the onboarding plan inside a customer record.
 *
 * No active onboarding → "Start onboarding" (pick a template).
 * Active onboarding   → stages + tasks with RAG status, assignee, due/target,
 *                        sub-task checklist, notes, attachments, send-email, and
 *                        a "Complete onboarding" action (flips customer → active).
 *
 * RAG convention: red = blocked/overdue, amber = in progress, green = complete.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rocket, Clock, CheckCircle2, Circle, AlertOctagon, Loader, Mail, Paperclip,
  MessageSquarePlus, Plus, ChevronDown, ChevronRight, Send, CheckCheck, Trash2, Phone,
} from 'lucide-react';
import { onboardingApi } from '../../../api/onboarding';
import { onboardingTemplatesApi } from '../../../api/onboardingTemplates';
import { staffApi } from '../../../api/staff';
import { teamsApi } from '../../../api/teams';

const STATUS = {
  not_started: { label: 'Not started', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: Circle },
  in_progress: { label: 'In progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Loader },
  blocked:     { label: 'Blocked',     color: '#E91E8C', bg: 'rgba(233,30,140,0.12)', icon: AlertOctagon },
  complete:    { label: 'Complete',    color: '#00C853', bg: 'rgba(0,200,83,0.12)',  icon: CheckCircle2 },
  skipped:     { label: 'Skipped',     color: '#64748B', bg: 'rgba(100,116,139,0.10)', icon: Circle },
};
const NEXT = { not_started: 'in_progress', in_progress: 'complete', complete: 'not_started', blocked: 'in_progress', skipped: 'not_started' };

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 };
const input = { width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 11px', fontSize: 13, color: '#0F172A', outline: 'none' };

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

  if (isLoading) return <div style={{ color: '#64748B', padding: 24 }}>Loading…</div>;
  if (isError || !onb) return <StartPanel customerId={customerId} customer={customer} onStarted={refresh} />;

  return <ActivePlan onb={onb} customer={customer} onChange={refresh} />;
}

// ─── Start panel ────────────────────────────────────────────────────
function StartPanel({ customerId, customer, onStarted }) {
  const { data: templates = [] } = useQuery({ queryKey: ['onb-templates'], queryFn: onboardingTemplatesApi.list });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list });
  const [templateId, setTemplateId] = useState(customer?.onboarding_template_id || '');
  const [goLive, setGoLive] = useState('');
  const [members, setMembers] = useState({}); // { team_id: staff_id }

  const start = useMutation({
    mutationFn: () => onboardingApi.start(customerId, {
      template_id: templateId, target_go_live: goLive || null, team_members: members,
    }),
    onSuccess: onStarted,
  });

  const active = templates.filter(t => t.is_active);
  return (
    <div style={{ ...card, maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Rocket size={20} color="#00C853" />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Start onboarding</h3>
      </div>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Pick a template and the person on each team for this client. Tasks are copied onto the customer,
        assigned to the right people, and their status switches to <strong>Onboarding</strong>.
      </p>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Template</label>
      <select style={{ ...input, marginTop: 5, marginBottom: 14 }} value={templateId} onChange={e => setTemplateId(e.target.value)}>
        <option value="">Select a template…</option>
        {active.map(t => <option key={t.id} value={t.id}>{t.name} ({t.task_count} tasks)</option>)}
      </select>

      <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Who's doing each role?</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '6px 0 14px' }}>
        {teams.map(team => (
          <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7B2FBE', width: 110 }}>{team.name}</span>
            <select style={{ ...input, flex: 1 }} value={members[team.id] || ''}
              onChange={e => setMembers(m => ({ ...m, [team.id]: e.target.value }))}>
              <option value="">Select {team.name.toLowerCase()} member…</option>
              {(team.members || []).map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
        ))}
        {!teams.length && <span style={{ fontSize: 12, color: '#94A3B8' }}>No teams set up yet — add them in Settings → Staff & Teams.</span>}
      </div>

      <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Target go-live</label>
      <input type="date" style={{ ...input, marginTop: 5, maxWidth: 200, display: 'block' }} value={goLive} onChange={e => setGoLive(e.target.value)} />

      {start.isError && <div style={{ color: '#E91E8C', fontSize: 12, marginTop: 10 }}>{start.error?.response?.data?.error || 'Could not start onboarding'}</div>}
      <button className="btn-primary" style={{ marginTop: 16 }} disabled={!templateId || start.isPending} onClick={() => start.mutate()}>
        <Rocket size={14} /> {start.isPending ? 'Starting…' : 'Start onboarding'}
      </button>
    </div>
  );
}

// ─── Active plan ────────────────────────────────────────────────────
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={18} color="#00C853" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{onb.template_name}</h3>
            </div>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Started {fmtDuration(onb.started_at)} ago{onb.owner_name ? ` · Owner: ${onb.owner_name}` : ''}
              {onb.target_go_live ? ` · Target go-live: ${onb.target_go_live}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" disabled={cancel.isPending}
              onClick={() => { if (confirm('Cancel this onboarding and remove its milestones & tasks? The customer stays in onboarding so you can start a new plan.')) cancel.mutate(); }}
              style={{ color: '#E91E8C' }}>
              <Trash2 size={14} /> Cancel
            </button>
            <button className="btn-primary" disabled={complete.isPending}
              onClick={() => {
                if (requiredOpen > 0) { if (confirm(`${requiredOpen} required task(s) still open. Force-complete anyway?`)) complete.mutate(true); }
                else complete.mutate(false);
              }}>
              <CheckCheck size={14} /> Complete onboarding
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#00C853' : '#F59E0B', transition: 'width .3s' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{done}/{total} · {pct}%</span>
        </div>
      </div>

      {/* Onboarding call */}
      <CallPanel onb={onb} onChange={onChange} />

      {/* Milestones */}
      {onb.stages.map(stage => (
        <StageBlock key={stage.id} stage={stage} onChange={onChange} />
      ))}
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
    <div style={{ ...card, borderColor: booked ? '#00C853' : '#E2E8F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Phone size={16} color={booked ? '#00C853' : '#64748B'} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Onboarding call</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', marginLeft: 8 }}>
          <input type="checkbox" checked={booked} onChange={e => setBooked(e.target.checked)} /> Call booked
        </label>
        {booked && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
            for <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...input, width: 'auto', padding: '5px 9px' }} />
          </label>
        )}
        {dirty && <button className="btn-primary" style={{ marginLeft: 'auto' }} disabled={save.isPending || (booked && !date)} onClick={() => save.mutate()}>Save</button>}
      </div>
      <p style={{ fontSize: 11.5, color: '#64748B', margin: '8px 0 0' }}>
        Tasks set to start <strong>after the onboarding call</strong> have their SLA dates calculated from this date.
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
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: stageComplete ? '#00C853' : '#7B2FBE' }}>{stage.name}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{done}/{tasks.length}</span>
        {stage.started_at && <span style={{ fontSize: 11, color: '#94A3B8' }}>· {fmtDuration(stage.started_at, stage.completed_at)}{stage.completed_at ? '' : ' elapsed'}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map(t => <TaskRow key={t.id} task={t} onChange={onChange} />)}
      </div>
    </div>
  );
}

function TaskRow({ task, onChange }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => staffApi.list() });

  const s = STATUS[task.status] || STATUS.not_started;
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

  const StatusIcon = s.icon;
  const checklistDone = (task.checklist || []).filter(c => c.is_done).length;

  return (
    <div style={{ border: '1px solid #EEF2F6', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: '#F8FAFC' }}>
        {/* Status toggle */}
        <button onClick={cycleStatus} title={`${s.label} — click to advance`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${s.color}`,
          background: s.bg, color: s.color, borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>
          <StatusIcon size={13} /> {s.label}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{task.title}</span>
          {!task.is_required && <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 6 }}>(optional)</span>}
          {task.team_name && <span style={{ fontSize: 10, color: '#7B2FBE', marginLeft: 6, fontWeight: 700 }}>{task.team_name}</span>}
        </div>

        {task.due_at ? (
          <span style={{ fontSize: 11, color: overdue ? '#E91E8C' : '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {overdue ? 'Overdue' : new Date(task.due_at).toLocaleDateString('en-GB')}
          </span>
        ) : task.sla_basis === 'post_call' ? (
          <span style={{ fontSize: 11, color: '#7B2FBE', display: 'inline-flex', alignItems: 'center', gap: 4 }} title="SLA starts after the onboarding call">
            <Clock size={12} /> After call
          </span>
        ) : null}

        {/* Assignee */}
        <select value={task.assignee_id || ''} onChange={e => update.mutate({ assignee_id: e.target.value || null })}
          style={{ ...input, width: 130, padding: '4px 8px', fontSize: 12 }}>
          <option value="">Unassigned</option>
          {staff.map(st => <option key={st.id} value={st.id}>{st.full_name}</option>)}
        </select>

        {task.comms_template_id && (
          <button title="Send linked email" onClick={() => { if (confirm('Send the linked email to this customer?')) onboardingApi.sendComms(task.id).then(onChange).catch(err => alert(err?.response?.data?.error || 'Send failed')); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.comms_sent_at ? '#00C853' : '#00BCD4' }}>
            <Send size={15} />
          </button>
        )}

        <button onClick={() => setExpanded(x => !x)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Meta strip */}
      <div style={{ display: 'flex', gap: 14, padding: '4px 11px', fontSize: 11, color: '#94A3B8' }}>
        {task.started_at && <span>{task.completed_at ? `Took ${fmtDuration(task.started_at, task.completed_at)}` : `Running ${fmtDuration(task.started_at)}`}</span>}
        {(task.checklist?.length > 0) && <span>{checklistDone}/{task.checklist.length} sub-tasks</span>}
        {(task.notes?.length > 0) && <span>{task.notes.length} notes</span>}
        {(task.attachments?.length > 0) && <span>{task.attachments.length} files</span>}
      </div>

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
    <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid #EEF2F6' }}>
      {/* Checklist + attachments */}
      <div>
        <Label>Sub-tasks</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
          {(task.checklist || []).map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: c.is_done ? '#94A3B8' : '#0F172A' }}>
              <input type="checkbox" checked={c.is_done} onChange={e => toggle.mutate({ id: c.id, done: e.target.checked })} />
              <span style={{ flex: 1, textDecoration: c.is_done ? 'line-through' : 'none' }}>{c.label}</span>
              <button onClick={() => delChk.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 14 }}>×</button>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...input, padding: '5px 9px', fontSize: 12 }} value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add sub-task…" onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) addChk.mutate(); }} />
          <button className="btn-ghost" style={{ padding: '4px 8px' }} disabled={!newItem.trim()} onClick={() => addChk.mutate()}><Plus size={13} /></button>
        </div>

        <Label style={{ marginTop: 14 }}>Attachments</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {(task.attachments || []).map(a => (
            <div key={a.id} style={{ fontSize: 12, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={12} color="#64748B" />
              {a.url ? <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#00BCD4' }}>{a.filename}</a> : a.filename}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...input, padding: '5px 9px', fontSize: 12 }} value={fileName} onChange={e => setFileName(e.target.value)} placeholder="Filename" />
          <input style={{ ...input, padding: '5px 9px', fontSize: 12 }} value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="URL (optional)" />
          <button className="btn-ghost" style={{ padding: '4px 8px' }} disabled={!fileName.trim()} onClick={() => addFile.mutate()}><Plus size={13} /></button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Notes</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {(task.notes || []).map(n => (
            <div key={n.id} style={{ fontSize: 12, color: '#334155', background: '#F8FAFC', borderRadius: 8, padding: '7px 9px' }}>
              <div>{n.body}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>{n.author_name || 'Someone'} · {new Date(n.created_at).toLocaleString('en-GB')}</div>
            </div>
          ))}
          {!task.notes?.length && <span style={{ fontSize: 12, color: '#94A3B8' }}>No notes yet.</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...input, padding: '5px 9px', fontSize: 12 }} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note…" onKeyDown={e => { if (e.key === 'Enter' && newNote.trim()) addNote.mutate(); }} />
          <button className="btn-ghost" style={{ padding: '4px 8px' }} disabled={!newNote.trim()} onClick={() => addNote.mutate()}><MessageSquarePlus size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function Label({ children, style }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7, ...style }}>{children}</div>;
}
