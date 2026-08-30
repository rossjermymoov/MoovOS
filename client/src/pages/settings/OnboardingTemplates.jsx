/**
 * OnboardingTemplates — /settings/onboarding-templates
 *
 * Full template configuration & email library built to docs/design-rules.md and moov.css:
 *   - Edit template name, description, and tier/method tags
 *   - Edit milestone / stage names and reorder / remove stages
 *   - Add, edit, and remove tasks with track codes (Core, DPD Master, DPD Sub, UPS, Yodel, Go-Live),
 *     SLA duration targets, SLA basis, assigned team, and linked comms
 *   - Manage email library with merge placeholders
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Edit2, Check, X, Mail, Clock, Layers,
  ChevronRight, ChevronDown, CheckSquare, Save, ArrowRight
} from 'lucide-react';
import { SettingsNav } from './RulesSettings';
import { onboardingTemplatesApi } from '../../api/onboardingTemplates';
import { staffApi } from '../../api/staff';
import { teamsApi } from '../../api/teams';

const TIERS = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' }
];

const METHODS = [
  { value: 'moov_ninja', label: 'Moov Ninja' },
  { value: 'moov_api', label: 'Moov API' },
  { value: 'third_party', label: 'Third-party' }
];

const TRACKS = [
  { value: 'core', label: 'Core Trunk' },
  { value: 'dpd_master', label: 'DPD Master' },
  { value: 'dpd_sub', label: 'DPD Sub-Account' },
  { value: 'ups', label: 'UPS Direct' },
  { value: 'yodel', label: 'Yodel' },
  { value: 'golive', label: 'Go-Live Canopy' },
];

export default function OnboardingTemplates() {
  const [view, setView] = useState('templates');

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        <SettingsNav />

        <div className="mv-head" style={{ marginTop: 10 }}>
          <div>
            <div className="mv-kicker">Settings</div>
            <h1 className="mv-title">Onboarding Templates</h1>
            <p className="mv-blurb">
              Configure repeatable multi-track onboarding templates, milestone stages, courier tracks, and automated communications.
            </p>
          </div>
          <div className="mv-actions">
            <div className="mv-chips">
              <button
                className={`mv-chip ${view === 'templates' ? 'is-on' : ''}`}
                onClick={() => setView('templates')}
              >
                <Layers size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Templates
              </button>
              <button
                className={`mv-chip ${view === 'library' ? 'is-on' : ''}`}
                onClick={() => setView('library')}
              >
                <Mail size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Email Library
              </button>
            </div>
          </div>
        </div>
        <div className="mv-rule" style={{ marginBottom: 20 }} />

        {view === 'templates' ? <TemplatesView /> : <LibraryView />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TEMPLATES VIEW
// ════════════════════════════════════════════════════════════════════
function TemplatesView() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['onb-templates'],
    queryFn: onboardingTemplatesApi.list
  });

  // Auto-select first template if none selected
  if (!selectedId && templates.length > 0 && !creating) {
    setSelectedId(templates[0].id);
  }

  const createTmpl = useMutation({
    mutationFn: onboardingTemplatesApi.create,
    onSuccess: (t) => {
      qc.invalidateQueries(['onb-templates']);
      setSelectedId(t.id);
      setCreating(false);
    },
    onError: (e) => alert(e?.response?.data?.error || 'Could not create template'),
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
      {/* Templates Sidebar */}
      <div style={{ background: 'var(--mv-surface)', padding: 16, borderTop: '2px solid var(--mv-divider)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="mv-section" style={{ margin: 0, color: 'var(--mv-ink)' }}>Templates</span>
          <button className="mv-btn mv-btn--primary mv-btn--sm" onClick={() => { setCreating(true); setSelectedId(null); }}>
            <Plus size={13} /> New
          </button>
        </div>

        {creating && (
          <NewTemplateForm
            onCancel={() => setCreating(false)}
            onCreate={(d) => createTmpl.mutate(d)}
            isPending={createTmpl.isPending}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {templates.map(t => {
            const isSel = selectedId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setSelectedId(t.id); setCreating(false); }}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  border: '1px solid var(--mv-hairline)',
                  borderLeft: `3px solid ${isSel ? 'var(--mv-purple)' : 'transparent'}`,
                  background: isSel ? '#FFFFFF' : 'transparent',
                  transition: 'background .12s',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? 'var(--mv-ink)' : 'var(--mv-ink-78)' }}>
                  {t.name}
                </div>
                <div className="mv-num" style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 3 }}>
                  {t.stage_count} stages · {t.task_count} tasks {t.is_default && '· default'}
                </div>
              </button>
            );
          })}
          {!templates.length && !isLoading && (
            <span className="mv-blurb" style={{ padding: '10px 0' }}>No templates yet.</span>
          )}
        </div>
      </div>

      {/* Main Template Editor */}
      <div>
        {selectedId ? (
          <TemplateEditor key={selectedId} templateId={selectedId} onDeleted={() => setSelectedId(null)} />
        ) : (
          <div style={{ background: 'var(--mv-surface)', padding: 24, borderTop: '2px solid var(--mv-divider)' }}>
            <span className="mv-blurb">Select a template to edit its names, stages, and tasks, or create a new one.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NewTemplateForm({ onCancel, onCreate, isPending }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div style={{ background: '#FFFFFF', padding: 14, border: '1px solid var(--mv-hairline)', marginBottom: 12 }}>
      <div className="mv-field" style={{ marginBottom: 10 }}>
        <label className="mv-label">Template Name</label>
        <input
          className="mv-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. DPD High Volume"
          autoFocus
        />
      </div>
      <div className="mv-field" style={{ marginBottom: 12 }}>
        <label className="mv-label">Description (optional)</label>
        <input
          className="mv-input"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Brief description…"
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="mv-btn mv-btn--primary mv-btn--sm"
          disabled={!name.trim() || isPending}
          onClick={() => onCreate({ name: name.trim(), description: desc.trim() || null })}
        >
          {isPending ? 'Creating…' : 'Create'}
        </button>
        <button className="mv-btn mv-btn--sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TEMPLATE EDITOR (Full Name, Stage, & Task editing)
// ════════════════════════════════════════════════════════════════════
function TemplateEditor({ templateId, onDeleted }) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries(['onb-template', templateId]);
    qc.invalidateQueries(['onb-templates']);
  };

  const { data: tmpl, isLoading } = useQuery({
    queryKey: ['onb-template', templateId],
    queryFn: () => onboardingTemplatesApi.get(templateId)
  });
  const { data: comms = [] } = useQuery({ queryKey: ['onb-comms'], queryFn: onboardingTemplatesApi.comms });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list });

  const updateTmpl = useMutation({
    mutationFn: (d) => onboardingTemplatesApi.update(templateId, d),
    onSuccess: invalidate
  });
  const delTmpl = useMutation({
    mutationFn: () => onboardingTemplatesApi.remove(templateId),
    onSuccess: () => { invalidate(); onDeleted(); }
  });

  const addStage = useMutation({
    mutationFn: (name) => onboardingTemplatesApi.addStage(templateId, { name }),
    onSuccess: invalidate
  });
  const updateStage = useMutation({
    mutationFn: ({ stageId, data }) => onboardingTemplatesApi.updateStage(stageId, data),
    onSuccess: invalidate
  });
  const delStage = useMutation({
    mutationFn: (sid) => onboardingTemplatesApi.deleteStage(sid),
    onSuccess: invalidate
  });

  const addTask = useMutation({
    mutationFn: (d) => onboardingTemplatesApi.addTask(templateId, d),
    onSuccess: invalidate
  });
  const updateTask = useMutation({
    mutationFn: ({ taskId, data }) => onboardingTemplatesApi.updateTask(taskId, data),
    onSuccess: invalidate
  });
  const delTask = useMutation({
    mutationFn: (tid) => onboardingTemplatesApi.deleteTask(tid),
    onSuccess: invalidate
  });

  const [editingHeader, setEditingHeader] = useState(false);
  const [headerName, setHeaderName] = useState('');
  const [headerDesc, setHeaderDesc] = useState('');
  const [newStageName, setNewStageName] = useState('');

  if (isLoading || !tmpl) return <div className="mv-blurb" style={{ padding: '20px 0' }}>Loading template details…</div>;

  const startEditHeader = () => {
    setHeaderName(tmpl.name || '');
    setHeaderDesc(tmpl.description || '');
    setEditingHeader(true);
  };

  const saveHeader = () => {
    if (!headerName.trim()) return;
    updateTmpl.mutate({
      name: headerName.trim(),
      description: headerDesc.trim() || null,
    });
    setEditingHeader(false);
  };

  function toggleTag(field, value) {
    const cur = tmpl[field] || [];
    const next = cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value];
    updateTmpl.mutate({ [field]: next });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Template Header Card */}
      <div style={{ background: 'var(--mv-surface)', padding: 18, borderTop: '2px solid var(--mv-divider)' }}>
        {!editingHeader ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="mv-section" style={{ marginBottom: 4 }}>Template Configuration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="mv-title" style={{ fontSize: 22 }}>{tmpl.name}</h2>
                  <button
                    className="mv-btn mv-btn--sm"
                    style={{ padding: '2px 8px', height: 26, fontSize: 11 }}
                    onClick={startEditHeader}
                    title="Edit template name & description"
                  >
                    <Edit2 size={12} /> Edit Name
                  </button>
                </div>
                {tmpl.description && (
                  <p className="mv-blurb" style={{ marginTop: 4, fontSize: 13 }}>{tmpl.description}</p>
                )}
              </div>
              <button
                className="mv-btn mv-btn--danger mv-btn--sm"
                onClick={() => { if (confirm(`Delete template "${tmpl.name}"?`)) delTmpl.mutate(); }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>

            {/* Tags & Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, borderTop: '1px solid var(--mv-hairline)', paddingTop: 14 }}>
              <div>
                <label className="mv-label">Applies to customer tiers</label>
                <div className="mv-chips" style={{ marginTop: 4 }}>
                  {TIERS.map(o => {
                    const on = (tmpl.applicable_tiers || []).includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => toggleTag('applicable_tiers', o.value)}
                        className={`mv-chip ${on ? 'is-on' : ''}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mv-label">Integration methods</label>
                <div className="mv-chips" style={{ marginTop: 4 }}>
                  {METHODS.map(o => {
                    const on = (tmpl.applicable_methods || []).includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => toggleTag('applicable_methods', o.value)}
                        className={`mv-chip ${on ? 'is-on' : ''}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Inline Header Edit Form */
          <div>
            <div className="mv-section">Edit Template Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
              <div className="mv-field">
                <label className="mv-label">Template Name</label>
                <input
                  className="mv-input"
                  value={headerName}
                  onChange={e => setHeaderName(e.target.value)}
                  placeholder="Template Name"
                  autoFocus
                />
              </div>
              <div className="mv-field">
                <label className="mv-label">Description</label>
                <input
                  className="mv-input"
                  value={headerDesc}
                  onChange={e => setHeaderDesc(e.target.value)}
                  placeholder="Template description…"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="mv-btn mv-btn--primary mv-btn--sm"
                disabled={!headerName.trim() || updateTmpl.isPending}
                onClick={saveHeader}
              >
                <Save size={13} /> Save Name
              </button>
              <button className="mv-btn mv-btn--sm" onClick={() => setEditingHeader(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Milestone Stages & Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {tmpl.stages.map(stage => (
          <StageEditor
            key={stage.id}
            stage={stage}
            comms={comms}
            teams={teams}
            onUpdateStage={(data) => updateStage.mutate({ stageId: stage.id, data })}
            onDeleteStage={() => { if (confirm(`Remove milestone "${stage.name}" and all its tasks?`)) delStage.mutate(stage.id); }}
            onAddTask={(d) => addTask.mutate(d)}
            onUpdateTask={(taskId, data) => updateTask.mutate({ taskId, data })}
            onDeleteTask={(tid) => delTask.mutate(tid)}
          />
        ))}

        {/* Add Stage Form */}
        <div style={{ background: 'var(--mv-surface)', padding: 14, borderTop: '2px solid var(--mv-divider)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="mv-field" style={{ flex: 1, margin: 0 }}>
            <label className="mv-label">New Milestone / Stage</label>
            <input
              className="mv-input"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              placeholder="e.g. Courier Account Link & Depot Negotiation…"
              onKeyDown={e => {
                if (e.key === 'Enter' && newStageName.trim()) {
                  addStage.mutate(newStageName.trim());
                  setNewStageName('');
                }
              }}
            />
          </div>
          <button
            className="mv-btn mv-btn--primary mv-btn--sm"
            disabled={!newStageName.trim() || addStage.isPending}
            onClick={() => {
              addStage.mutate(newStageName.trim());
              setNewStageName('');
            }}
          >
            <Plus size={13} /> Add Milestone
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// STAGE EDITOR (Edit Stage Name + Tasks List)
// ════════════════════════════════════════════════════════════════════
function StageEditor({ stage, comms, teams, onUpdateStage, onDeleteStage, onAddTask, onUpdateTask, onDeleteTask }) {
  const [editingStage, setEditingStage] = useState(false);
  const [stageName, setStageName] = useState(stage.name);

  const saveStageName = () => {
    if (!stageName.trim()) return;
    onUpdateStage({ name: stageName.trim() });
    setEditingStage(false);
  };

  const tasks = stage.tasks.filter(t => !t.parent_task_id);

  return (
    <div style={{ background: 'var(--mv-surface)', padding: 16, borderTop: '2px solid var(--mv-divider)' }}>
      {/* Stage Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        {!editingStage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mv-section" style={{ margin: 0, color: 'var(--mv-purple)', fontSize: 13, textTransform: 'none', fontWeight: 800 }}>
              {stage.name}
            </span>
            <span className="mv-num" style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>
              ({tasks.length} task{tasks.length === 1 ? '' : 's'})
            </span>
            <button
              className="mv-btn mv-btn--sm"
              style={{ padding: '2px 6px', height: 22, fontSize: 10, border: 'none' }}
              onClick={() => { setStageName(stage.name); setEditingStage(true); }}
              title="Edit milestone name"
            >
              <Edit2 size={11} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 400 }}>
            <input
              className="mv-input"
              value={stageName}
              onChange={e => setStageName(e.target.value)}
              placeholder="Milestone Name"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') saveStageName(); }}
            />
            <button className="mv-btn mv-btn--primary mv-btn--sm" onClick={saveStageName}><Check size={12} /></button>
            <button className="mv-btn mv-btn--sm" onClick={() => setEditingStage(false)}><X size={12} /></button>
          </div>
        )}

        <button
          className="mv-btn mv-btn--danger mv-btn--sm"
          style={{ fontSize: 11, padding: '2px 8px', height: 24 }}
          onClick={onDeleteStage}
        >
          <Trash2 size={11} /> Remove Milestone
        </button>
      </div>

      <div className="mv-rule" style={{ marginBottom: 12 }} />

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.map(t => (
          <TaskRowEditor
            key={t.id}
            task={t}
            comms={comms}
            teams={teams}
            onUpdate={(data) => onUpdateTask(t.id, data)}
            onDelete={() => { if (confirm(`Delete task "${t.title}"?`)) onDeleteTask(t.id); }}
          />
        ))}

        {tasks.length === 0 && (
          <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--mv-ink-45)' }}>
            No tasks in this milestone. Click "Add Task" below to create one.
          </div>
        )}

        {/* Add Task Form */}
        <AddTaskRow stageId={stage.id} comms={comms} teams={teams} onAdd={onAddTask} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TASK ROW EDITOR (Inline Name & Property Editing)
// ════════════════════════════════════════════════════════════════════
function TaskRowEditor({ task, comms, teams, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  // Form states for editing
  const [title, setTitle] = useState(task.title || '');
  const [trackCode, setTrackCode] = useState(task.track_code || 'core');
  const [slaDays, setSlaDays] = useState(
    task.target_duration_hours != null ? (task.target_duration_hours / 24).toString() : ''
  );
  const [slaBasis, setSlaBasis] = useState(task.sla_basis || 'onboarding_start');
  const [teamId, setTeamId] = useState(task.team_id || '');
  const [commsId, setCommsId] = useState(task.comms_template_id || '');
  const [isRequired, setIsRequired] = useState(task.is_required ?? true);

  const startEdit = () => {
    setTitle(task.title || '');
    setTrackCode(task.track_code || 'core');
    setSlaDays(task.target_duration_hours != null ? (task.target_duration_hours / 24).toString() : '');
    setSlaBasis(task.sla_basis || 'onboarding_start');
    setTeamId(task.team_id || '');
    setCommsId(task.comms_template_id || '');
    setIsRequired(task.is_required ?? true);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!title.trim()) return;
    onUpdate({
      title: title.trim(),
      track_code: trackCode,
      target_duration_hours: slaDays ? Math.round(Number(slaDays) * 24) : null,
      sla_basis: slaBasis,
      team_id: teamId || null,
      comms_template_id: commsId || null,
      is_required: isRequired,
    });
    setEditing(false);
  };

  const trackLabel = TRACKS.find(t => t.value === (task.track_code || 'core'))?.label || 'Core Trunk';

  if (editing) {
    return (
      <div style={{ background: '#FFFFFF', padding: 14, border: '1px solid var(--mv-purple)', marginTop: 4, marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="mv-section" style={{ margin: 0, color: 'var(--mv-purple)' }}>Edit Task Details</span>
          <button className="mv-btn mv-btn--sm" onClick={() => setEditing(false)}><X size={12} /> Cancel</button>
        </div>

        <div className="mv-field" style={{ marginBottom: 10 }}>
          <label className="mv-label">Task Name (Title)</label>
          <input
            className="mv-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task Title"
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 10 }}>
          <div className="mv-field">
            <label className="mv-label">Courier Track</label>
            <select className="mv-input" value={trackCode} onChange={e => setTrackCode(e.target.value)}>
              {TRACKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="mv-field">
            <label className="mv-label">SLA Target (Days)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="mv-input"
              value={slaDays}
              onChange={e => setSlaDays(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>

          <div className="mv-field">
            <label className="mv-label">SLA Starts From</label>
            <select className="mv-input" value={slaBasis} onChange={e => setSlaBasis(e.target.value)}>
              <option value="onboarding_start">Onboarding Start</option>
              <option value="post_call">After Onboarding Call</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="mv-field">
            <label className="mv-label">Responsible Team</label>
            <select className="mv-input" value={teamId} onChange={e => setTeamId(e.target.value)}>
              <option value="">— Unassigned —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="mv-field">
            <label className="mv-label">Linked Email Template</label>
            <select className="mv-input" value={commsId} onChange={e => setCommsId(e.target.value)}>
              <option value="">No Email</option>
              {comms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--mv-hairline)', paddingTop: 10 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isRequired}
              onChange={e => setIsRequired(e.target.checked)}
              style={{ accentColor: 'var(--mv-purple)' }}
            />
            Required for customer go-live
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="mv-btn mv-btn--primary mv-btn--sm"
              disabled={!title.trim()}
              onClick={saveEdit}
            >
              <Save size={13} /> Save Task
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      background: '#FFFFFF',
      border: '1px solid var(--mv-hairline)',
      borderLeft: `3px solid ${task.is_required ? 'var(--mv-purple)' : 'var(--mv-divider)'}`,
    }}>
      {/* Track Badge */}
      <span style={{
        fontSize: 9.5,
        fontWeight: 700,
        padding: '2px 6px',
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        background: 'var(--mv-surface)',
        color: 'var(--mv-ink-78)',
        border: '1px solid var(--mv-hairline-2)',
        flexShrink: 0
      }}>
        {trackLabel}
      </span>

      {/* Title & info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: 'var(--mv-ink)', fontWeight: 600 }}>
          {task.title}
        </span>
        {!task.is_required && (
          <span style={{ fontSize: 10.5, color: 'var(--mv-ink-45)', marginLeft: 8 }}>(optional)</span>
        )}
        {task.team_name && (
          <span style={{ fontSize: 10.5, color: 'var(--mv-purple)', marginLeft: 8, fontWeight: 700 }}>
            {task.team_name}
          </span>
        )}
      </div>

      {/* Duration */}
      {task.target_duration_hours != null && (
        <span className="mv-num" style={{ fontSize: 11.5, color: 'var(--mv-ink-62)', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Clock size={12} /> {(task.target_duration_hours / 24).toLocaleString(undefined, { maximumFractionDigits: 1 })}d
          {task.sla_basis === 'post_call' && <span style={{ color: 'var(--mv-purple)', fontSize: 10 }}>· post-call</span>}
        </span>
      )}

      {/* Comms indicator */}
      {task.comms_template_id && (
        <Mail size={13} color="var(--mv-teal-deep)" title="Linked automated email" style={{ flexShrink: 0 }} />
      )}

      {/* Action buttons: Edit Name & Delete */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={startEdit}
          title="Edit task title & properties"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-62)', padding: 4 }}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={onDelete}
          title="Delete task"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-magenta-deep)', padding: 4 }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ADD TASK ROW
// ════════════════════════════════════════════════════════════════════
function AddTaskRow({ stageId, comms, teams, onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    track_code: 'core',
    sla_days: '1',
    sla_basis: 'onboarding_start',
    comms_template_id: '',
    team_id: '',
    is_required: true
  });

  function submit() {
    if (!form.title.trim()) return;
    onAdd({
      stage_id: stageId,
      title: form.title.trim(),
      track_code: form.track_code,
      target_duration_hours: form.sla_days ? Math.round(Number(form.sla_days) * 24) : null,
      sla_basis: form.sla_basis,
      comms_template_id: form.comms_template_id || null,
      team_id: form.team_id || null,
      is_required: form.is_required,
      auto_send_comms: false,
    });
    setForm({
      title: '',
      track_code: 'core',
      sla_days: '1',
      sla_basis: 'onboarding_start',
      comms_template_id: '',
      team_id: '',
      is_required: true
    });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          color: 'var(--mv-purple)',
          cursor: 'pointer',
          fontSize: 12.5,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 6,
          padding: '4px 0',
          fontFamily: 'inherit'
        }}
      >
        <Plus size={14} /> Add Task
      </button>
    );
  }

  return (
    <div style={{ background: '#FFFFFF', padding: 14, border: '1px solid var(--mv-hairline)', marginTop: 8 }}>
      <div className="mv-section" style={{ marginBottom: 8, color: 'var(--mv-purple)' }}>Add New Task</div>

      <div className="mv-field" style={{ marginBottom: 10 }}>
        <label className="mv-label">Task Name (Title)</label>
        <input
          className="mv-input"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. DPD Collection Slot Negotiation with Depot"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div className="mv-field">
          <label className="mv-label">Courier Track</label>
          <select
            className="mv-input"
            value={form.track_code}
            onChange={e => setForm(f => ({ ...f, track_code: e.target.value }))}
          >
            {TRACKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="mv-field">
          <label className="mv-label">SLA Target (Days)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            className="mv-input"
            value={form.sla_days}
            onChange={e => setForm(f => ({ ...f, sla_days: e.target.value }))}
            placeholder="e.g. 1"
          />
        </div>

        <div className="mv-field">
          <label className="mv-label">SLA Starts From</label>
          <select
            className="mv-input"
            value={form.sla_basis}
            onChange={e => setForm(f => ({ ...f, sla_basis: e.target.value }))}
          >
            <option value="onboarding_start">Onboarding Start</option>
            <option value="post_call">After Onboarding Call</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="mv-field">
          <label className="mv-label">Assigned Team</label>
          <select
            className="mv-input"
            value={form.team_id}
            onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
          >
            <option value="">— Unassigned —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="mv-field">
          <label className="mv-label">Linked Email Template (Optional)</label>
          <select
            className="mv-input"
            value={form.comms_template_id}
            onChange={e => setForm(f => ({ ...f, comms_template_id: e.target.value }))}
          >
            <option value="">No Email</option>
            {comms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--mv-hairline)', paddingTop: 10 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.is_required}
            onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
            style={{ accentColor: 'var(--mv-purple)' }}
          />
          Required for customer go-live
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="mv-btn mv-btn--primary mv-btn--sm" onClick={submit}>
            Add Task
          </button>
          <button className="mv-btn mv-btn--sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
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
  const [editing, setEditing] = useState(null);

  const save = useMutation({
    mutationFn: (d) => d.id ? onboardingTemplatesApi.updateComms(d.id, d) : onboardingTemplatesApi.createComms(d),
    onSuccess: () => { qc.invalidateQueries(['onb-comms']); setEditing(null); },
  });
  const del = useMutation({
    mutationFn: (id) => onboardingTemplatesApi.deleteComms(id),
    onSuccess: () => qc.invalidateQueries(['onb-comms'])
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
      <div style={{ background: 'var(--mv-surface)', padding: 16, borderTop: '2px solid var(--mv-divider)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="mv-section" style={{ margin: 0, color: 'var(--mv-ink)' }}>Email Templates</span>
          <button className="mv-btn mv-btn--primary mv-btn--sm" onClick={() => setEditing('new')}>
            <Plus size={13} /> New
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {comms.map(c => {
            const isSel = editing?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  border: '1px solid var(--mv-hairline)',
                  borderLeft: `3px solid ${isSel ? 'var(--mv-purple)' : 'transparent'}`,
                  background: isSel ? '#FFFFFF' : 'transparent',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.subject}
                </div>
              </button>
            );
          })}
          {!comms.length && <span className="mv-blurb" style={{ padding: '10px 0' }}>No email templates yet.</span>}
        </div>
      </div>

      <div>
        {editing ? (
          <CommsEditor
            key={editing.id || 'new'}
            initial={editing === 'new' ? null : editing}
            onSave={(d) => save.mutate(d)}
            onDelete={editing !== 'new' ? () => { if (confirm('Delete this email template?')) { del.mutate(editing.id); setEditing(null); } } : null}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div style={{ background: 'var(--mv-surface)', padding: 24, borderTop: '2px solid var(--mv-divider)' }}>
            <span className="mv-blurb">
              Select an email template or create a new one. Available merge placeholders: <code style={{ color: 'var(--mv-purple)', fontWeight: 700 }}>{'{{customer_name}}'}</code>, <code style={{ color: 'var(--mv-purple)', fontWeight: 700 }}>{'{{account_number}}'}</code>, <code style={{ color: 'var(--mv-purple)', fontWeight: 700 }}>{'{{owner_name}}'}</code>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CommsEditor({ initial, onSave, onDelete, onCancel }) {
  const [f, setF] = useState(initial || { name: '', subject: '', body_html: '', description: '' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  return (
    <div style={{ background: 'var(--mv-surface)', padding: 18, borderTop: '2px solid var(--mv-divider)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="mv-section" style={{ margin: 0 }}>
        {initial ? 'Edit Email Template' : 'New Email Template'}
      </div>

      <div className="mv-field">
        <label className="mv-label">Template Name</label>
        <input className="mv-input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Welcome Pack & Call Booking" />
      </div>

      <div className="mv-field">
        <label className="mv-label">Subject Line</label>
        <input className="mv-input" value={f.subject} onChange={e => set('subject', e.target.value)} placeholder="Welcome to Moov, {{customer_name}}" />
      </div>

      <div className="mv-field">
        <label className="mv-label">Body (HTML)</label>
        <textarea
          className="mv-input"
          style={{ minHeight: 220, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, lineHeight: 1.6 }}
          value={f.body_html}
          onChange={e => set('body_html', e.target.value)}
          placeholder="<p>Hi {{customer_name}},</p><p>Welcome to Moov OS...</p>"
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          className="mv-btn mv-btn--primary mv-btn--sm"
          disabled={!f.name?.trim() || !f.subject?.trim() || !f.body_html?.trim()}
          onClick={() => onSave(f)}
        >
          <Save size={13} /> Save Email Template
        </button>
        <button className="mv-btn mv-btn--sm" onClick={onCancel}>Cancel</button>
        {onDelete && (
          <button className="mv-btn mv-btn--danger mv-btn--sm" style={{ marginLeft: 'auto' }} onClick={onDelete}>
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
