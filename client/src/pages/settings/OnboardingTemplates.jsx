/**
 * OnboardingTemplates — /settings/onboarding-templates
 *
 * Two views:
 *   • Templates  — build reusable onboarding plans (stages → tasks, durations,
 *                  required flags, linked comms templates).
 *   • Email Library — manage the onboarding comms templates tasks can send.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronRight, ChevronDown, Mail, Clock, Layers, X } from 'lucide-react';
import { SettingsNav } from './RulesSettings';
import { onboardingTemplatesApi } from '../../api/onboardingTemplates';
import { staffApi } from '../../api/staff';

const CUSTOMER_TYPES = [
  { value: 'standard_api',  label: 'Standard API' },
  { value: 'dpd_drop_shop', label: 'DPD Drop Shop' },
  { value: 'non_api',       label: 'Non-API' },
  { value: 'custom',        label: 'Custom' },
];

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 };
const input = { width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0F172A', outline: 'none' };
const label = { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5, display: 'block' };

export default function OnboardingTemplates() {
  const [view, setView] = useState('templates');
  return (
    <div>
      <SettingsNav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853' }}>Onboarding Templates</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Toggle active={view === 'templates'} onClick={() => setView('templates')} icon={Layers} label="Templates" />
          <Toggle active={view === 'library'}   onClick={() => setView('library')}   icon={Mail}   label="Email Library" />
        </div>
      </div>
      {view === 'templates' ? <TemplatesView /> : <LibraryView />}
    </div>
  );
}

function Toggle({ active, onClick, icon: Icon, label: l }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
      border: `1px solid ${active ? '#00C853' : '#E2E8F0'}`, cursor: 'pointer',
      background: active ? 'rgba(0,200,83,0.10)' : '#fff', color: active ? '#00C853' : '#64748B',
      fontSize: 13, fontWeight: 700,
    }}>
      <Icon size={15} /> {l}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
// TEMPLATES VIEW
// ════════════════════════════════════════════════════════════════════
function TemplatesView() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data: templates = [] } = useQuery({ queryKey: ['onb-templates'], queryFn: onboardingTemplatesApi.list });

  const createTmpl = useMutation({
    mutationFn: onboardingTemplatesApi.create,
    onSuccess: (t) => { qc.invalidateQueries(['onb-templates']); setSelectedId(t.id); setCreating(false); },
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
      {/* List */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Templates</span>
          <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setCreating(true)}>
            <Plus size={13} /> New
          </button>
        </div>
        {creating && <NewTemplateForm onCancel={() => setCreating(false)} onCreate={(d) => createTmpl.mutate(d)} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {templates.map(t => (
            <button key={t.id} onClick={() => setSelectedId(t.id)} style={{
              textAlign: 'left', padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${selectedId === t.id ? '#00C853' : '#E2E8F0'}`,
              background: selectedId === t.id ? 'rgba(0,200,83,0.06)' : '#fff',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                {t.stage_count} stages · {t.task_count} tasks {t.is_default && '· default'}
              </div>
            </button>
          ))}
          {!templates.length && <span style={{ fontSize: 12, color: '#94A3B8' }}>No templates yet.</span>}
        </div>
      </div>

      {/* Detail */}
      <div>
        {selectedId
          ? <TemplateEditor key={selectedId} templateId={selectedId} onDeleted={() => setSelectedId(null)} />
          : <div style={{ ...card, color: '#94A3B8', fontSize: 13 }}>Select a template to edit, or create a new one.</div>}
      </div>
    </div>
  );
}

function NewTemplateForm({ onCancel, onCreate }) {
  const [name, setName] = useState('');
  const [customer_type, setType] = useState('custom');
  return (
    <div style={{ ...card, marginBottom: 12, background: '#F8FAFC' }}>
      <label style={label}>Name</label>
      <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Enterprise API" />
      <label style={{ ...label, marginTop: 10 }}>Customer type</label>
      <select style={input} value={customer_type} onChange={e => setType(e.target.value)}>
        {CUSTOMER_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn-primary" disabled={!name.trim()} onClick={() => onCreate({ name: name.trim(), customer_type })}>Create</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function TemplateEditor({ templateId, onDeleted }) {
  const qc = useQueryClient();
  const invalidate = () => { qc.invalidateQueries(['onb-template', templateId]); qc.invalidateQueries(['onb-templates']); };

  const { data: tmpl, isLoading } = useQuery({ queryKey: ['onb-template', templateId], queryFn: () => onboardingTemplatesApi.get(templateId) });
  const { data: comms = [] } = useQuery({ queryKey: ['onb-comms'], queryFn: onboardingTemplatesApi.comms });
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => staffApi.list() });

  const addStage = useMutation({ mutationFn: (name) => onboardingTemplatesApi.addStage(templateId, { name }), onSuccess: invalidate });
  const delStage = useMutation({ mutationFn: (sid) => onboardingTemplatesApi.deleteStage(sid), onSuccess: invalidate });
  const addTask  = useMutation({ mutationFn: (d) => onboardingTemplatesApi.addTask(templateId, d), onSuccess: invalidate });
  const delTask  = useMutation({ mutationFn: (tid) => onboardingTemplatesApi.deleteTask(tid), onSuccess: invalidate });
  const delTmpl  = useMutation({ mutationFn: () => onboardingTemplatesApi.remove(templateId), onSuccess: () => { invalidate(); onDeleted(); } });

  const [newStage, setNewStage] = useState('');

  if (isLoading || !tmpl) return <div style={{ ...card, color: '#94A3B8' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{tmpl.name}</h2>
          <span style={{ fontSize: 12, color: '#64748B' }}>{tmpl.description || tmpl.customer_type}</span>
        </div>
        <button className="btn-ghost" style={{ color: '#E91E8C' }} onClick={() => { if (confirm('Delete this template?')) delTmpl.mutate(); }}>
          <Trash2 size={14} /> Delete template
        </button>
      </div>

      {tmpl.stages.map(stage => (
        <div key={stage.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#7B2FBE' }}>{stage.name}</span>
            <button className="btn-ghost" style={{ fontSize: 12, color: '#94A3B8' }} onClick={() => delStage.mutate(stage.id)}>
              <X size={13} /> Remove stage
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stage.tasks.filter(t => !t.parent_task_id).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{t.title}</span>
                  {!t.is_required && <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 8 }}>(optional)</span>}
                </div>
                {t.target_duration_hours != null && (
                  <span style={{ fontSize: 11, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {t.target_duration_hours}h
                  </span>
                )}
                {t.comms_template_id && <Mail size={13} color="#00BCD4" title="Linked email" />}
                <button onClick={() => delTask.mutate(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <AddTaskRow stageId={stage.id} comms={comms} staff={staff} onAdd={(d) => addTask.mutate(d)} />
          </div>
        </div>
      ))}

      {/* Add stage */}
      <div style={{ ...card, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input style={input} value={newStage} onChange={e => setNewStage(e.target.value)} placeholder="New stage name…" />
        <button className="btn-primary" disabled={!newStage.trim()} onClick={() => { addStage.mutate(newStage.trim()); setNewStage(''); }}>
          <Plus size={14} /> Stage
        </button>
      </div>
    </div>
  );
}

function AddTaskRow({ stageId, comms, staff, onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', target_duration_hours: '', comms_template_id: '', default_assignee_id: '', is_required: true });
  function submit() {
    if (!form.title.trim()) return;
    onAdd({
      stage_id: stageId,
      title: form.title.trim(),
      target_duration_hours: form.target_duration_hours ? Number(form.target_duration_hours) : null,
      comms_template_id: form.comms_template_id || null,
      default_assignee_id: form.default_assignee_id || null,
      is_required: form.is_required,
      auto_send_comms: false,
    });
    setForm({ title: '', target_duration_hours: '', comms_template_id: '', default_assignee_id: '', is_required: true });
    setOpen(false);
  }
  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#00C853', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
      <Plus size={13} /> Add task
    </button>
  );
  return (
    <div style={{ ...card, background: '#F8FAFC', marginTop: 6 }}>
      <input style={input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" autoFocus />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <div>
          <label style={label}>Target (hours)</label>
          <input style={input} type="number" value={form.target_duration_hours} onChange={e => setForm(f => ({ ...f, target_duration_hours: e.target.value }))} />
        </div>
        <div>
          <label style={label}>Assignee</label>
          <select style={input} value={form.default_assignee_id} onChange={e => setForm(f => ({ ...f, default_assignee_id: e.target.value }))}>
            <option value="">—</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
      </div>
      <label style={{ ...label, marginTop: 8 }}>Linked email (optional)</label>
      <select style={input} value={form.comms_template_id} onChange={e => setForm(f => ({ ...f, comms_template_id: e.target.value }))}>
        <option value="">No email</option>
        {comms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginTop: 10 }}>
        <input type="checkbox" checked={form.is_required} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))} /> Required for go-live
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn-primary" onClick={submit}>Add task</button>
        <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// EMAIL LIBRARY VIEW
// ════════════════════════════════════════════════════════════════════
function LibraryView() {
  const qc = useQueryClient();
  const { data: comms = [] } = useQuery({ queryKey: ['onb-comms'], queryFn: onboardingTemplatesApi.comms });
  const [editing, setEditing] = useState(null); // template object or 'new'

  const save = useMutation({
    mutationFn: (d) => d.id ? onboardingTemplatesApi.updateComms(d.id, d) : onboardingTemplatesApi.createComms(d),
    onSuccess: () => { qc.invalidateQueries(['onb-comms']); setEditing(null); },
  });
  const del = useMutation({ mutationFn: (id) => onboardingTemplatesApi.deleteComms(id), onSuccess: () => qc.invalidateQueries(['onb-comms']) });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Email templates</span>
          <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditing('new')}><Plus size={13} /> New</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {comms.map(c => (
            <button key={c.id} onClick={() => setEditing(c)} style={{
              textAlign: 'left', padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${editing?.id === c.id ? '#00C853' : '#E2E8F0'}`, background: '#fff',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject}</div>
            </button>
          ))}
          {!comms.length && <span style={{ fontSize: 12, color: '#94A3B8' }}>No templates yet.</span>}
        </div>
      </div>
      <div>
        {editing
          ? <CommsEditor key={editing.id || 'new'} initial={editing === 'new' ? null : editing} onSave={(d) => save.mutate(d)} onDelete={editing !== 'new' ? () => { if (confirm('Delete this email template?')) { del.mutate(editing.id); setEditing(null); } } : null} onCancel={() => setEditing(null)} />
          : <div style={{ ...card, color: '#94A3B8', fontSize: 13 }}>Select a template, or create a new one. Use {'{{customer_name}}'}, {'{{account_number}}'}, {'{{owner_name}}'} as placeholders.</div>}
      </div>
    </div>
  );
}

function CommsEditor({ initial, onSave, onDelete, onCancel }) {
  const [f, setF] = useState(initial || { name: '', subject: '', body_html: '', description: '' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div><label style={label}>Name</label><input style={input} value={f.name} onChange={e => set('name', e.target.value)} /></div>
      <div><label style={label}>Subject</label><input style={input} value={f.subject} onChange={e => set('subject', e.target.value)} placeholder="Welcome to Moov, {{customer_name}}" /></div>
      <div><label style={label}>Body (HTML)</label>
        <textarea style={{ ...input, minHeight: 200, fontFamily: 'ui-monospace, Menlo, monospace', resize: 'vertical' }} value={f.body_html} onChange={e => set('body_html', e.target.value)} placeholder="<p>Hi {{customer_name}},</p>" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn-primary" disabled={!f.name?.trim() || !f.subject?.trim() || !f.body_html?.trim()} onClick={() => onSave(f)}>Save</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        {onDelete && <button className="btn-ghost" style={{ color: '#E91E8C', marginLeft: 'auto' }} onClick={onDelete}><Trash2 size={14} /> Delete</button>}
      </div>
    </div>
  );
}
