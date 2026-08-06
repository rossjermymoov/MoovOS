/**
 * TasksPage — /tasks  (native)
 *
 * The Moov OS Tasks module. Reads live staff / customers / carriers / queries /
 * tracking into every picker, and persists tasks + links + comments + attachments
 * through /api/tasks. Gated by the per-user 'tasks' page permission.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useMe, setViewAs } from '../../hooks/useMe';
import { tasksApi } from '../../api/tasks';
import { taskConfigApi } from '../../api/taskConfig';
import {
  Plus, X, ChevronDown, Calendar, MessageSquare, Paperclip, Link2,
  List as ListIcon, LayoutGrid, User, ExternalLink, AlertCircle,
  AlertTriangle, Clock, CheckCircle2, CircleDashed,
  Settings, Trash2, ArrowUp, ArrowDown, Check,
} from 'lucide-react';
import './tasks.css';

const api = axios.create({ baseURL: '/api' });

// Spaces and statuses are user-configurable (edited in board Settings, persisted
// server-side). Keys are stable — renaming only changes the label, so existing
// tasks keep working. These defaults seed a board that has never been configured.
const DEFAULT_SPACES = [
  { key: 'cs',      label: 'Customer Service', colour: '#00BCD4' },
  { key: 'sales',   label: 'Sales',            colour: '#E91E8C' },
  { key: 'ops',     label: 'Operations',       colour: '#F59E0B' },
  { key: 'product', label: 'Product & Data',   colour: '#7B2FBE' },
];
const DEFAULT_STATUSES = [
  { key: 'todo',     label: 'To do',       colour: '#94A3B8', isComplete: false },
  { key: 'progress', label: 'In progress', colour: '#F59E0B', isComplete: false },
  { key: 'review',   label: 'In review',   colour: '#7B2FBE', isComplete: false },
  { key: 'done',     label: 'Complete',    colour: '#00C853', isComplete: true },
];
const PRIORITY = {
  urgent: { label: 'Urgent', colour: '#EF4444', soft: '#FDECEC', text: '#B91C1C' },
  high:   { label: 'High',   colour: '#F59E0B', soft: '#FEF3E2', text: '#B45309' },
  medium: { label: 'Medium', colour: '#2563EB', soft: '#E7EEFD', text: '#1D4ED8' },
  low:    { label: 'Low',    colour: '#94A3B8', soft: '#EEF2F6', text: '#64748B' },
};

// ── colour helpers — derive a soft background + readable text from any base hex ──
function hexToRgb(hex) { const h = String(hex || '#000').replace('#', ''); const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h; const n = parseInt(f, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
function softBg(hex) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},0.15)`; }
function darken(hex, amt) { const { r, g, b } = hexToRgb(hex); const f = x => Math.round(x * (1 - amt)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function chipColours(hex) { return { colour: hex, soft: softBg(hex), text: darken(hex, 0.4) }; }

// Live board config — rebuilt from server config by applyConfig(); all render
// code reads these module bindings, so a config change re-colours the whole board.
let SPACES = {};
let STATUS = {};
let COLUMNS = [];
let SPACE_ORDER = [];
let COMPLETE = new Set();
let FIRST_STATUS = 'todo';

function applyConfig(data) {
  const spaces   = (Array.isArray(data?.spaces)   && data.spaces.length)   ? data.spaces   : DEFAULT_SPACES;
  const statuses = (Array.isArray(data?.statuses) && data.statuses.length) ? data.statuses : DEFAULT_STATUSES;
  SPACES = {}; SPACE_ORDER = [];
  spaces.forEach(s => { SPACES[s.key] = { label: s.label, colour: s.colour }; SPACE_ORDER.push(s.key); });
  STATUS = {}; COLUMNS = []; COMPLETE = new Set();
  statuses.forEach(s => { STATUS[s.key] = { label: s.label, ...chipColours(s.colour) }; COLUMNS.push([s.key, s.label]); if (s.isComplete) COMPLETE.add(s.key); });
  if (COMPLETE.size === 0 && statuses.length) COMPLETE.add(statuses[statuses.length - 1].key);
  FIRST_STATUS = statuses[0]?.key || 'todo';
}
applyConfig(null); // seed defaults at load
const AV_PALETTE = ['#7B2FBE', '#00BCD4', '#E91E8C', '#00C853', '#F59E0B', '#2563EB', '#EA4335', '#0F9D58', '#B45309', '#6B4423'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── helpers ───────────────────────────────────────────────────────────────────
const initials = (n) => ((n || '?').split(' ').filter(w => /[A-Za-z0-9]/.test(w)).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?');
function colourFor(id) { const s = String(id || ''); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return AV_PALETTE[h % AV_PALETTE.length]; }
const shortId = (id) => 'TSK-' + String(id || '').replace(/-/g, '').slice(0, 5).toUpperCase();
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); const now = new Date(); return dt.getDate() + ' ' + MONTHS[dt.getMonth()] + (dt.getFullYear() !== now.getFullYear() ? ' ' + dt.getFullYear() : ''); }
function toISO(d) { if (!d) return ''; const dt = new Date(d); if (isNaN(dt)) return ''; return dt.toISOString().slice(0, 10); }
function isOverdue(t) { return !COMPLETE.has(t.status) && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString()); }
function fmtSize(b) { b = +b || 0; return b < 1024 ? b + ' B' : (b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB'); }

function Avatar({ name, id, size = 26 }) {
  return <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: colourFor(id || name) }} title={name || ''}>{initials(name)}</span>;
}
function Pill({ map, k }) { const s = map[k]; if (!s) return null; return <span className="mt-pill" style={{ background: s.soft, color: s.text }}><span className="dot" style={{ width: 6, height: 6, background: s.colour }} />{s.label}</span>; }
function StatusTag({ k }) { const s = STATUS[k]; if (!s) return null; return <span className="mt-status-tag" style={{ background: s.soft, color: s.text }}><span className="dot" style={{ width: 6, height: 6, background: s.colour }} />{s.label}</span>; }

// ── record chip (renders both a picked draft link and a saved API link) ─────────
function RecChip({ link, navigate, onRemove }) {
  const clickable = !!link.route && !!navigate;
  const go = () => { if (clickable) navigate(link.route); };
  let lead = null;
  if (link.type === 'customer') lead = <span className="mt-sq" style={{ background: '#1D4ED8' }}>{initials(link.label)}</span>;
  else if (link.type === 'carrier') lead = <span className="mt-sq" style={{ background: colourFor(link.sub || link.label), fontSize: 8 }}>{String(link.sub || link.label || '').slice(0, 3).toUpperCase()}</span>;
  else if (link.type === 'tracking') lead = <span className="mt-sq" style={{ background: colourFor(link.label), fontSize: 8 }}>PKG</span>;
  const mono = link.type === 'query' || link.type === 'tracking';
  return (
    <span className={'mt-rec' + (clickable ? ' link' : '')} onClick={go} title={clickable ? 'Open ' + link.route : ''}>
      {lead}
      <span className={mono ? 'mono' : ''} style={mono ? { fontWeight: 700 } : {}}>{link.label || link.ref}</span>
      {link.sub ? <span className="sub">{link.sub}</span> : null}
      {link.status ? <span className="mt-badge" style={{ background: '#EEF2F6', color: '#475569' }}>{String(link.status).replace(/_/g, ' ')}</span> : null}
      {clickable ? <ExternalLink size={12} style={{ color: '#94A3B8' }} /> : null}
      {onRemove ? <span className="mt-recx" onClick={(e) => { e.stopPropagation(); onRemove(link); }}><X size={12} /></span> : null}
    </span>
  );
}

// ── live-data pickers ──────────────────────────────────────────────────────────
function normList(d) { return Array.isArray(d) ? d : (d?.data || d?.rows || d?.parcels || []); }
const PICKERS = {
  staff: {
    ph: 'Search team members…', noun: 'in the team', empty: 'No matching team member.',
    search: (q) => api.get('/staff').then(r => normList(r.data)).then(rows => q ? rows.filter(s => (s.full_name + ' ' + (s.role || '') + ' ' + (s.email || '')).toLowerCase().includes(q.toLowerCase())) : rows),
    key: (s) => s.id,
    row: (s) => (<><Avatar name={s.full_name} id={s.id} size={24} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{s.full_name}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>{(s.role || '—').replace(/_/g, ' ')}</div></div></>),
    norm: (s) => ({ kind: 'staff', id: s.id, name: s.full_name, role: s.role }),
  },
  customer: {
    ph: 'Search customers by name or account…', noun: 'in Moov', empty: 'No matching customer in Moov. You can only link a customer that already exists — create the customer record first.',
    search: (q) => api.get('/customers', { params: { search: q, limit: 8 } }).then(r => normList(r.data)),
    key: (c) => c.id,
    row: (c) => (<><span className="mt-sq" style={{ background: '#1D4ED8' }}>{initials(c.business_name)}</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{c.business_name}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>{c.account_number}{c.city ? ' · ' + c.city : ''}</div></div>{c.tier ? <span className="mt-badge" style={{ background: '#F1E9F8', color: '#7B2FBE' }}>{c.tier}</span> : null}</>),
    norm: (c) => ({ type: 'customer', ref: c.id, label: c.business_name, sub: c.account_number }),
  },
  carrier: {
    ph: 'Search carriers…', noun: 'in Moov', empty: 'No matching carrier in Moov.',
    search: (q) => api.get('/carriers/couriers').then(r => normList(r.data)).then(rows => q ? rows.filter(c => (c.name + ' ' + (c.code || '')).toLowerCase().includes(q.toLowerCase())) : rows),
    key: (c) => c.id,
    row: (c) => (<><span className="mt-sq" style={{ background: colourFor(c.code || c.name), fontSize: 8 }}>{String(c.code || c.name).slice(0, 3).toUpperCase()}</span><div style={{ fontWeight: 600 }}>{c.name}</div></>),
    norm: (c) => ({ type: 'carrier', ref: c.id, label: c.name, sub: c.code }),
  },
  query: {
    ph: 'Search queries by reference or subject…', noun: 'in Moov', empty: 'No matching query in Moov.',
    search: (q) => api.get('/queries', { params: { search: q, limit: 8 } }).then(r => normList(r.data)),
    key: (x) => x.id,
    row: (x) => (<><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{x.subject || '(no subject)'}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>{x.customer_name || '—'}</div></div><span className="mt-badge" style={{ background: '#FEF3E2', color: '#B45309' }}>{String(x.status || '').replace(/_/g, ' ')}</span></>),
    norm: (x) => ({ type: 'query', ref: x.id, label: x.subject, sub: x.customer_name, status: x.status }),
  },
  tracking: {
    ph: 'Search by tracking number, customer or postcode…', noun: 'parcels', empty: 'No parcels found in Moov for that number, customer or postcode.',
    search: (q) => api.get('/tracking', { params: { search: q, limit: 8 } }).then(r => normList(r.data)),
    key: (p) => p.id,
    row: (p) => (<><span className="mt-sq" style={{ background: colourFor(p.courier_code || p.courier_name), fontSize: 8 }}>{String(p.courier_code || p.courier_name || '?').slice(0, 3).toUpperCase()}</span><div style={{ flex: 1, minWidth: 0 }}><div className="mono" style={{ fontWeight: 600 }}>{p.consignment_number}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>{(p.customer_name || p.recipient_name || '—')}{p.recipient_postcode ? ' · ' + p.recipient_postcode : ''}</div></div><span className="mt-badge" style={{ background: '#EEF2F6', color: '#475569' }}>{String(p.status || '').replace(/_/g, ' ')}</span></>),
    norm: (p) => ({ type: 'tracking', ref: p.id, label: p.consignment_number, sub: p.recipient_postcode || p.customer_name, status: p.status }),
  },
};

function Picker({ type, onPick, exclude = [], autoFocus }) {
  const cfg = PICKERS[type];
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useQuery({
    queryKey: ['picker', type, q], queryFn: () => cfg.search(q), enabled: open, keepPreviousData: true,
  });
  const rows = normList(data).filter(r => !exclude.includes(String(cfg.key(r))));
  return (
    <div className="mt-lookup">
      <input className="mt-input" placeholder={cfg.ph} value={q} autoFocus={autoFocus}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
      {open && (
        <div className="mt-drop">
          {isFetching && !data ? <div className="mt-loading">Searching Moov…</div>
            : rows.length === 0 && q ? <div className="mt-drop-none"><AlertCircle />{cfg.empty}</div>
              : (<>
                <div className="mt-drop-head">{rows.length} {cfg.noun}{q ? ` matching “${q}”` : ''}</div>
                {rows.slice(0, 8).map(r => (
                  <div key={cfg.key(r)} className="mt-drop-row" onMouseDown={(e) => { e.preventDefault(); onPick(cfg.norm(r)); setQ(''); setOpen(false); }}>{cfg.row(r)}</div>
                ))}
              </>)}
        </div>
      )}
    </div>
  );
}

// ── side property with an inline menu (status / priority / space) ───────────────
function SideSelect({ label, current, options, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-prop">
      <div className="mt-plabel">{label}</div>
      <div className="mt-control" onClick={() => setOpen(o => !o)}>{current}<span className="chev"><ChevronDown size={14} /></span></div>
      {open && <div className="mt-menu">{options.map(o => <div key={o.key} className="mt-opt" onMouseDown={() => { onPick(o.key); setOpen(false); }}>{o.render}</div>)}</div>}
    </div>
  );
}

// ── task detail (full-screen) ───────────────────────────────────────────────────
function TaskDetail({ taskId, me, onClose, navigate }) {
  const qc = useQueryClient();
  const { data: task, isLoading } = useQuery({ queryKey: ['task', taskId], queryFn: () => tasksApi.get(taskId), enabled: !!taskId });
  const [assignOpen, setAssignOpen] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [lkUrl, setLkUrl] = useState(''); const [lkName, setLkName] = useState('');
  const [comment, setComment] = useState('');
  const fileRef = useRef(null);

  const refresh = () => { qc.invalidateQueries(['task', taskId]); qc.invalidateQueries(['tasks']); };
  const mUpdate = useMutation({ mutationFn: (body) => tasksApi.update(taskId, body), onSuccess: refresh });
  const mComment = useMutation({ mutationFn: (body) => tasksApi.addComment(taskId, body), onSuccess: () => { setComment(''); refresh(); } });
  const mLink = useMutation({ mutationFn: (body) => tasksApi.addLink(taskId, body), onSuccess: refresh });
  const mUnlink = useMutation({ mutationFn: (linkId) => tasksApi.removeLink(taskId, linkId), onSuccess: refresh });
  const mAttach = useMutation({ mutationFn: (body) => tasksApi.addAttachment(taskId, body), onSuccess: () => { setShowLink(false); setLkUrl(''); setLkName(''); refresh(); } });
  const mUnattach = useMutation({ mutationFn: (attId) => tasksApi.removeAttachment(taskId, attId), onSuccess: refresh });

  if (!task) {
    return (<><div className="mt-scrim open" onClick={onClose} /><div className="mt-drawer open"><div className="mt-loading" style={{ margin: 'auto' }}>{isLoading ? 'Loading task…' : 'Task not found'}</div></div></>);
  }

  const od = isOverdue(task);
  const links = task.links || [];
  const linksByType = (t) => links.filter(l => l.type === t);
  const set = (patch) => mUpdate.mutate(patch);

  return (
    <>
      <div className="mt-scrim open" onClick={onClose} />
      <div className="mt-drawer open">
        <div className="mt-dhead">
          <div className="mt-dhead-left"><span className="mt-card-id">{shortId(task.id)}</span><StatusTag k={task.status} /></div>
          <div className="mt-iconbtn" onClick={onClose} title="Close"><X size={16} /></div>
        </div>
        <div className="mt-dbody">
          {/* main */}
          <div className="mt-main">
            <div className="mt-sheet">
            <input className="mt-title-input" defaultValue={task.title} placeholder="Task title"
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== task.title) set({ title: v }); }} />

            <div className="mt-sec"><MessageSquare size={14} />Description</div>
            <textarea className="mt-desc" defaultValue={task.description || ''} placeholder="Add a description…"
              onBlur={(e) => { const v = e.target.value; if (v !== (task.description || '')) set({ description: v }); }} />

            <div className="mt-sec"><Link2 size={14} />Linked Moov records</div>
            {links.length === 0 && <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10 }}>No linked records yet.</div>}
            {[['customer', 'Customer'], ['carrier', 'Carrier'], ['query', 'Queries'], ['tracking', 'Tracking']].map(([t, lbl]) => {
              const items = linksByType(t); if (!items.length) return null;
              return <div className="mt-recline" key={t}><span className="mt-recline-lbl">{lbl}</span><span className="mt-recchips">{items.map(l => <RecChip key={l.id} link={l} navigate={navigate} onRemove={(x) => mUnlink.mutate(x.id)} />)}</span></div>;
            })}
            <details style={{ marginTop: 4 }}>
              <summary className="mt-attach-btn" style={{ display: 'inline-flex', listStyle: 'none' }}><Plus size={14} />Link a record</summary>
              <div className="mt-link-panel" style={{ marginTop: 8 }}>
                {['customer', 'carrier', 'query', 'tracking'].map(t => (
                  <div key={t} style={{ marginBottom: 10 }}>
                    <div className="mt-fld-label" style={{ textTransform: 'capitalize' }}>{t}</div>
                    <Picker type={t} exclude={linksByType(t).map(l => String(l.ref))} onPick={(n) => mLink.mutate({ link_type: n.type, ref: n.ref })} />
                  </div>
                ))}
              </div>
            </details>

            <div className="mt-sec"><Paperclip size={14} />Attachments{task.attachments?.length ? ' · ' + task.attachments.length : ''}</div>
            {(task.attachments || []).length === 0 && <div style={{ fontSize: 13, color: '#94A3B8' }}>No attachments yet.</div>}
            {(task.attachments || []).map(a => (
              <div className="mt-doc" key={a.id}>
                <div className="mt-doc-ico"><Paperclip size={16} color="#64748B" /></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="mt-doc-name">{a.name}</div>
                  <div className="mt-doc-sub">{a.url || (a.size_bytes ? fmtSize(a.size_bytes) : a.kind)}</div>
                </div>
                {a.url ? <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#64748B' }} onClick={e => e.stopPropagation()}><ExternalLink size={15} /></a> : null}
                <span className="mt-recx" onClick={() => mUnattach.mutate(a.id)}><X size={14} /></span>
              </div>
            ))}
            <div className="mt-attach-actions">
              <label className="mt-attach-btn"><input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => { Array.from(e.target.files || []).forEach(f => mAttach.mutate({ kind: 'file', name: f.name, size_bytes: f.size })); e.target.value = ''; }} /><Plus size={14} />Attach file</label>
              <button className="mt-attach-btn" onClick={() => setShowLink(s => !s)}><Link2 size={14} />Add link / Google Drive</button>
            </div>
            {showLink && (
              <div className="mt-link-panel" style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="mt-input" style={{ flex: 2, minWidth: 180 }} placeholder="Paste a link (Google Drive, Doc, URL…)" value={lkUrl} onChange={e => setLkUrl(e.target.value)} />
                <input className="mt-input" style={{ flex: 1, minWidth: 120 }} placeholder="Label (optional)" value={lkName} onChange={e => setLkName(e.target.value)} />
                <button className="mt-btn primary" disabled={!lkUrl.trim()} onClick={() => { const u = lkUrl.trim(); mAttach.mutate({ kind: /drive\.google|docs\.google/.test(u) ? 'drive' : 'link', name: lkName.trim() || u, url: u }); }}>Add</button>
              </div>
            )}

            <div className="mt-sec"><MessageSquare size={14} />Comments · {task.comments?.length || 0}</div>
            {(task.comments || []).length === 0 && <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>No comments yet. Start the conversation.</div>}
            {(task.comments || []).map(c => (
              <div className="mt-comment" key={c.id}>
                <Avatar name={c.author_name || 'You'} id={c.author_id} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}><span className="mt-comment-name">{c.author_name || 'You'}</span><span className="mt-comment-time">{fmtDate(c.created_at)}</span></div>
                  <div className="mt-comment-text">{c.body}</div>
                </div>
              </div>
            ))}
            <div className="mt-comment-box">
              <Avatar name={'You'} id={'me'} size={32} />
              <textarea className="mt-input" placeholder="Write a comment…" value={comment} onChange={e => setComment(e.target.value)} />
              <button className="mt-btn primary" disabled={!comment.trim()} style={{ alignSelf: 'stretch' }} onClick={() => mComment.mutate({ body: comment.trim(), author_id: me })}>Send</button>
            </div>
            </div>
          </div>

          {/* side */}
          <div className="mt-side">
            <SideSelect label="Status" current={<StatusTag k={task.status} />}
              options={Object.keys(STATUS).map(k => ({ key: k, render: <StatusTag k={k} /> }))}
              onPick={(k) => set({ status: k })} />

            <div className="mt-prop">
              <div className="mt-plabel">Assignee</div>
              <div className="mt-control" onClick={() => setAssignOpen(o => !o)}>
                {task.assignee_id ? <><Avatar name={task.assignee_name} id={task.assignee_id} size={20} /><span>{task.assignee_name}</span></> : <span style={{ color: '#94A3B8' }}>Unassigned</span>}
                <span className="chev"><ChevronDown size={14} /></span>
              </div>
              {assignOpen && <div style={{ marginTop: 6 }}><Picker type="staff" autoFocus onPick={(s) => { set({ assignee_id: s.id, actor_id: me }); setAssignOpen(false); }} /></div>}
            </div>

            <SideSelect label="Priority" current={<Pill map={PRIORITY} k={task.priority} />}
              options={Object.keys(PRIORITY).map(k => ({ key: k, render: <Pill map={PRIORITY} k={k} /> }))}
              onPick={(k) => set({ priority: k })} />

            <SideSelect label="Space" current={<><span className="dot" style={{ width: 8, height: 8, background: SPACES[task.space]?.colour }} />{SPACES[task.space]?.label || task.space}</>}
              options={Object.keys(SPACES).map(k => ({ key: k, render: <><span className="dot" style={{ width: 8, height: 8, background: SPACES[k].colour }} />{SPACES[k].label}</> }))}
              onPick={(k) => set({ space: k })} />

            <div className="mt-prop">
              <div className="mt-plabel">Dates</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1 }}><span className="mt-minilbl">Start</span><input type="date" className="mt-date" defaultValue={toISO(task.start_date)} onChange={e => set({ start_date: e.target.value || null })} /></label>
                <label style={{ flex: 1 }}><span className="mt-minilbl">Due</span><input type="date" className={'mt-date' + (od ? ' overdue' : '')} defaultValue={toISO(task.due_date)} onChange={e => set({ due_date: e.target.value || null })} /></label>
              </div>
              {od && <div style={{ fontSize: 11.5, color: '#EF4444', fontWeight: 600, marginTop: 5 }}>Overdue</div>}
            </div>

            {task.created_by_name && (
              <div className="mt-prop"><div className="mt-plabel">Created by</div><div className="mt-control" style={{ cursor: 'default' }}><Avatar name={task.created_by_name} id={task.created_by} size={20} />{task.created_by_name}</div></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── create task modal ───────────────────────────────────────────────────────────
function CreateModal({ defaultSpace, currentUserId, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [space, setSpace] = useState(defaultSpace === 'all' ? (SPACE_ORDER[0] || 'cs') : defaultSpace);
  const [priority, setPriority] = useState('medium');
  const [due, setDue] = useState('');
  const [assignee, setAssignee] = useState(null);
  const [picked, setPicked] = useState({ customer: null, carrier: null, query: [], tracking: [] });

  const mCreate = useMutation({ mutationFn: (body) => tasksApi.create(body), onSuccess: (t) => onCreated(t) });

  const needCustomer = space === 'cs' && !picked.customer;
  const canCreate = title.trim() && !needCustomer;

  const addPick = (n) => {
    if (n.type === 'customer' || n.type === 'carrier') setPicked(p => ({ ...p, [n.type]: n }));
    else setPicked(p => ({ ...p, [n.type]: [...p[n.type].filter(x => x.ref !== n.ref), n] }));
  };
  const removePick = (n) => {
    if (n.type === 'customer' || n.type === 'carrier') setPicked(p => ({ ...p, [n.type]: null }));
    else setPicked(p => ({ ...p, [n.type]: p[n.type].filter(x => x.ref !== n.ref) }));
  };

  const submit = () => {
    if (!canCreate) return;
    const links = [];
    if (picked.customer) links.push({ link_type: 'customer', ref: picked.customer.ref });
    if (picked.carrier) links.push({ link_type: 'carrier', ref: picked.carrier.ref });
    picked.query.forEach(q => links.push({ link_type: 'query', ref: q.ref }));
    picked.tracking.forEach(t => links.push({ link_type: 'tracking', ref: t.ref }));
    mCreate.mutate({
      title: title.trim(), description: description.trim() || null, status: FIRST_STATUS, priority, space,
      assignee_id: assignee?.id || null, created_by: currentUserId || null,
      start_date: toISO(new Date()), due_date: due || null, links,
    });
  };

  const seg = (val, setVal, map) => (
    <div className="mt-seg">{Object.keys(map).map(k => (
      <div key={k} className={'mt-seg-opt' + (val === k ? ' sel' : '')} onClick={() => setVal(k)}>
        <span className="dot" style={{ width: 8, height: 8, background: map[k].colour }} />{map[k].label}
      </div>))}</div>
  );

  return (
    <div className="mt-modal-scrim open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mt-modal">
        <div className="mt-modal-head"><h3>New task</h3><div className="mt-iconbtn" onClick={onClose}><X size={16} /></div></div>
        <div className="mt-modal-body">
          <div className="mt-fld"><label className="mt-fld-label">Task title<span className="req">*</span></label><input className="mt-input" placeholder="What needs doing?" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
          <div className="mt-fld"><label className="mt-fld-label">Description</label><textarea className="mt-input" style={{ minHeight: 56, resize: 'vertical' }} placeholder="Add any detail…" value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div className="mt-row2">
            <div className="mt-fld"><label className="mt-fld-label">Space</label>{seg(space, setSpace, SPACES)}</div>
            <div className="mt-fld"><label className="mt-fld-label">Priority</label>{seg(priority, setPriority, PRIORITY)}</div>
          </div>
          <div className="mt-row2">
            <div className="mt-fld"><label className="mt-fld-label">Assignee</label>
              {assignee ? <div className="mt-sel-chips"><span className="mt-rec"><Avatar name={assignee.name} id={assignee.id} size={20} />{assignee.name}<span className="mt-recx" onClick={() => setAssignee(null)}><X size={12} /></span></span></div>
                : <Picker type="staff" onPick={setAssignee} />}
            </div>
            <div className="mt-fld"><label className="mt-fld-label">Due date</label><input type="date" className="mt-input" value={due} onChange={e => setDue(e.target.value)} /></div>
          </div>

          <label className="mt-fld-label" style={{ marginTop: 4 }}>Link to Moov records</label>
          <div className="mt-link-panel">
            <div className="mt-hint">Search runs against your live Moov databases — you can only link records that already exist.</div>
            {[['customer', 'Customer', false], ['carrier', 'Carrier', false], ['query', 'Queries', true], ['tracking', 'Tracking', true]].map(([t, lbl, multi]) => {
              const chips = multi ? picked[t] : (picked[t] ? [picked[t]] : []);
              const showInput = multi || !picked[t];
              return (
                <div className="mt-lookup" key={t}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{lbl}{t === 'customer' && space === 'cs' ? <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span> : null}{multi ? <span style={{ color: '#94A3B8', fontWeight: 500 }}> (add one or more)</span> : null}</label>
                  {chips.length ? <div className="mt-sel-chips">{chips.map(c => <RecChip key={c.ref} link={c} onRemove={removePick} />)}</div> : null}
                  {showInput ? <Picker type={t} exclude={chips.map(c => String(c.ref))} onPick={addPick} /> : null}
                  {t === 'customer' && needCustomer ? <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}><AlertCircle size={13} />A customer is required for Customer Service tasks.</div> : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-modal-foot">
          <span style={{ fontSize: 12, color: '#94A3B8' }}>Linking is optional — add what's relevant.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="mt-btn" onClick={onClose}>Cancel</button>
            <button className="mt-btn primary" disabled={!canCreate || mCreate.isLoading} onClick={submit}>{mCreate.isLoading ? 'Creating…' : 'Create task'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── card ────────────────────────────────────────────────────────────────────────
function TaskCard({ task, onOpen, navigate }) {
  const od = isOverdue(task);
  const custom = (task.links || []).find(l => l.type === 'customer');
  const carrier = (task.links || []).find(l => l.type === 'carrier');
  const chip = custom
    ? <span className="mt-gchip" onClick={(e) => { e.stopPropagation(); custom.route && navigate(custom.route); }}><span className="mt-sq" style={{ width: 14, height: 14, fontSize: 7, background: '#1D4ED8' }}>{initials(custom.label)}</span>{custom.label}</span>
    : carrier
      ? <span className="mt-gchip" onClick={(e) => { e.stopPropagation(); carrier.route && navigate(carrier.route); }}><span className="mt-sq" style={{ width: 14, height: 14, fontSize: 7, background: colourFor(carrier.sub || carrier.label) }}>{String(carrier.sub || carrier.label || '').slice(0, 3).toUpperCase()}</span>{carrier.label}</span>
      : null;
  return (
    <div className="mt-card" onClick={() => onOpen(task.id)}>
      <div className="mt-card-top"><Pill map={PRIORITY} k={task.priority} /><span className="mt-card-id">{shortId(task.id)}</span></div>
      <div className="mt-card-title">{task.title}</div>
      {chip ? <div className="mt-card-meta">{chip}</div> : null}
      <div className="mt-card-foot">
        <div className="mt-foot-left">
          <span className="mt-ico"><MessageSquare size={14} />{task.comment_count || 0}</span>
          <span className="mt-ico"><Paperclip size={14} />{task.attachment_count || 0}</span>
          <span className={'mt-due' + (od ? ' overdue' : '')}><Calendar size={13} />{fmtDate(task.due_date)}</span>
        </div>
        {task.assignee_id ? <Avatar name={task.assignee_name} id={task.assignee_id} size={26} /> : <span className="avatar" style={{ width: 26, height: 26, fontSize: 10, background: '#CBD5E1' }} title="Unassigned">–</span>}
      </div>
    </div>
  );
}

// ── my tasks (personal RAG view) ────────────────────────────────────────────────
function MyTasksView({ myTasks, me, bypass, staffList, onOpen, onNew }) {
  // Bypass mode has no real identity — let the user pick who they're viewing as.
  const viewAsControl = bypass ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontSize: 12.5, color: '#64748B' }}>
      <User size={14} />
      <span>Viewing as</span>
      <select value={me || ''} onChange={(e) => setViewAs(e.target.value)} className="mt-date" style={{ width: 'auto', fontWeight: 600 }}>
        <option value="">— choose a team member —</option>
        {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
      </select>
      <span style={{ color: '#94A3B8' }}>(passwords aren’t set yet, so pick who “you” are to preview your tasks)</span>
    </div>
  ) : null;

  if (!me) {
    return (
      <div className="mt-list-wrap">
        {viewAsControl}
        <div className="mt-empty" style={{ padding: 60 }}>
          <User size={26} style={{ opacity: .5 }} /><br />
          Sign in as a team member to see the tasks assigned to you.
        </div>
      </div>
    );
  }

  const today = new Date(new Date().toDateString());
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
  const dayOf = (d) => new Date(new Date(d).toDateString());
  const notDone = myTasks.filter(t => !COMPLETE.has(t.status));
  const overdue = notDone.filter(isOverdue);
  const dueToday = notDone.filter(t => t.due_date && dayOf(t.due_date).getTime() === today.getTime());
  const thisWeek = notDone.filter(t => t.due_date && dayOf(t.due_date) > today && dayOf(t.due_date) <= in7);
  const later = notDone.filter(t => !overdue.includes(t) && !dueToday.includes(t) && !thisWeek.includes(t));
  const done = myTasks.filter(t => COMPLETE.has(t.status));
  const inProgress = notDone.filter(t => t.status !== FIRST_STATUS).length;

  const Tile = ({ label, count, colour, soft, icon }) => (
    <div style={{ flex: 1, minWidth: 160, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 1px 2px rgba(15,23,42,.03)' }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: soft, color: colour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: count > 0 ? colour : '#0F172A' }}>{count}</div>
        <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );

  const Row = ({ t }) => {
    const od = isOverdue(t);
    return (
      <div className="mt-myrow" onClick={() => onOpen(t.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 11, cursor: 'pointer', marginBottom: 8, boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 1px 2px rgba(15,23,42,.03)', transition: 'box-shadow .14s, border-color .14s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#D3DBE3'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,.08), 0 2px 5px rgba(15,23,42,.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,.05), 0 1px 2px rgba(15,23,42,.03)'; }}>
        <span className="dot" style={{ width: 9, height: 9, background: STATUS[t.status]?.colour }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{shortId(t.id)} · {SPACES[t.space]?.label}</div>
        </div>
        <Pill map={PRIORITY} k={t.priority} />
        <span className={'mt-due' + (od ? ' overdue' : '')} style={{ fontSize: 12.5, minWidth: 96, justifyContent: 'flex-end' }}><Calendar size={13} />{fmtDate(t.due_date)}</span>
        <StatusTag k={t.status} />
      </div>
    );
  };

  const groups = [
    { key: 'overdue', label: 'Overdue', colour: '#EF4444', items: overdue },
    { key: 'today', label: 'Due today', colour: '#F59E0B', items: dueToday },
    { key: 'week', label: 'Due this week', colour: '#F59E0B', items: thisWeek },
    { key: 'later', label: 'Later & no date', colour: '#94A3B8', items: later },
    { key: 'done', label: 'Completed', colour: '#00C853', items: done },
  ];

  return (
    <div className="mt-list-wrap">
      {viewAsControl}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
        <Tile label="Overdue" count={overdue.length} colour="#EF4444" soft="#FDECEC" icon={<AlertTriangle size={20} />} />
        <Tile label="Due this week" count={dueToday.length + thisWeek.length} colour="#F59E0B" soft="#FEF3E2" icon={<Clock size={20} />} />
        <Tile label="In progress" count={inProgress} colour="#2563EB" soft="#E7EEFD" icon={<CircleDashed size={20} />} />
        <Tile label="Completed" count={done.length} colour="#00C853" soft="#E7F8EE" icon={<CheckCircle2 size={20} />} />
      </div>

      {overdue.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FDECEC', color: '#B91C1C', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          <AlertTriangle size={15} />
          You have {overdue.length} overdue task{overdue.length === 1 ? '' : 's'}. These are past their due date — worth clearing first.
        </div>
      )}

      {myTasks.length === 0 ? (
        <div className="mt-empty" style={{ padding: 50 }}>
          Nothing assigned to you yet.
          <div style={{ marginTop: 12 }}><button className="mt-btn primary" onClick={onNew} style={{ display: 'inline-flex' }}><Plus size={15} />Create a task</button></div>
        </div>
      ) : groups.filter(g => g.items.length).map(g => (
        <div key={g.key} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <span className="dot" style={{ width: 10, height: 10, background: g.colour }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{g.label}</span>
            <span className="mt-count">{g.items.length}</span>
          </div>
          {g.items.map(t => <Row key={t.id} t={t} />)}
        </div>
      ))}
    </div>
  );
}

// ── board settings (edit spaces & statuses) ─────────────────────────────────────
function SettingsModal({ initSpaces, initStatuses, spaceCounts, statusCounts, saving, onSave, onClose }) {
  const [spaces, setSpaces] = useState(() => initSpaces.map(s => ({ ...s })));
  const [statuses, setStatuses] = useState(() => initStatuses.map(s => ({ ...s })));
  const [err, setErr] = useState('');

  const move = (arr, setArr, i, dir) => { const j = i + dir; if (j < 0 || j >= arr.length) return; const c = arr.slice(); [c[i], c[j]] = [c[j], c[i]]; setArr(c); };
  const upd = (arr, setArr, i, patch) => setArr(arr.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const del = (arr, setArr, i) => setArr(arr.filter((_, idx) => idx !== i));
  const slug = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20);

  const finalise = (arr) => {
    const used = new Set(); const out = [];
    for (const it of arr) {
      const label = (it.label || '').trim();
      if (!label) return { error: 'Every row needs a name.' };
      let key = it.key || slug(label) || ('k' + (used.size + 1));
      let base = key, n = 2; while (used.has(key)) key = base + '_' + n++;
      used.add(key); out.push({ ...it, key, label });
    }
    return { list: out };
  };

  const save = () => {
    setErr('');
    if (!spaces.length) return setErr('You need at least one space.');
    if (!statuses.length) return setErr('You need at least one status column.');
    const s = finalise(spaces); if (s.error) return setErr('Spaces: ' + s.error);
    const st = finalise(statuses); if (st.error) return setErr('Statuses: ' + st.error);
    if (!st.list.some(x => x.isComplete)) return setErr('Mark at least one status as “Complete” — that’s the column that means the work is finished (used for overdue and progress).');
    onSave({ spaces: s.list, statuses: st.list });
  };

  const swatch = (colour, onChange) => (
    <input type="color" value={colour || '#2563EB'} onChange={e => onChange(e.target.value)}
      style={{ width: 34, height: 32, border: '1px solid #E2E8F0', borderRadius: 8, padding: 2, background: '#fff', cursor: 'pointer', flexShrink: 0 }} title="Pick a colour" />
  );
  const iconBtn = (child, onClick, disabled, title) => (
    <button onClick={onClick} disabled={disabled} title={title} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#CBD5E1' : '#64748B', flexShrink: 0 }}>{child}</button>
  );

  const renderSection = ({ title, hint, arr, setArr, counts, isStatus }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label className="mt-fld-label" style={{ marginBottom: 0 }}>{title}</label>
        <button className="mt-btn" style={{ padding: '5px 10px' }} onClick={() => setArr([...arr, isStatus ? { key: '', label: '', colour: '#2563EB', isComplete: false } : { key: '', label: '', colour: '#2563EB' }])}><Plus size={13} />Add {isStatus ? 'status' : 'space'}</button>
      </div>
      <div className="mt-hint" style={{ marginBottom: 10 }}>{hint}</div>
      {arr.map((it, i) => {
        const inUse = it.key ? (counts[it.key] || 0) : 0;
        const canDelete = arr.length > 1 && inUse === 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {swatch(it.colour, v => upd(arr, setArr, i, { colour: v }))}
            <input className="mt-input" value={it.label} placeholder={isStatus ? 'Status name' : 'Space name'} onChange={e => upd(arr, setArr, i, { label: e.target.value })} style={{ flex: 1 }} />
            {isStatus && (
              <button onClick={() => upd(arr, setArr, i, { isComplete: !it.isComplete })} title="Tasks in this column count as complete"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', flexShrink: 0, border: '1px solid ' + (it.isComplete ? '#00C853' : '#E2E8F0'), background: it.isComplete ? '#E7F8EE' : '#fff', color: it.isComplete ? '#047857' : '#94A3B8' }}>
                <Check size={12} />Complete
              </button>
            )}
            {iconBtn(<ArrowUp size={13} />, () => move(arr, setArr, i, -1), i === 0)}
            {iconBtn(<ArrowDown size={13} />, () => move(arr, setArr, i, 1), i === arr.length - 1)}
            {iconBtn(<Trash2 size={13} />, () => del(arr, setArr, i), !canDelete, inUse > 0 ? 'In use by existing tasks — reassign them first' : (arr.length <= 1 ? 'Keep at least one' : 'Remove'))}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="mt-modal-scrim open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mt-modal" style={{ width: 680 }}>
        <div className="mt-modal-head"><h3>Board settings</h3><div className="mt-iconbtn" onClick={onClose}><X size={16} /></div></div>
        <div className="mt-modal-body">
          {renderSection({ title: 'Spaces', isStatus: false, arr: spaces, setArr: setSpaces, counts: spaceCounts,
            hint: 'Spaces group your work (teams, functions, projects). Rename, recolour, reorder, add or remove them — renaming keeps existing tasks intact.' })}
          {renderSection({ title: 'Status columns', isStatus: true, arr: statuses, setArr: setStatuses, counts: statusCounts,
            hint: 'These are your board columns, left to right. Mark the column(s) that mean “done” as Complete — that drives overdue flags, progress and the My Tasks view.' })}
          {err && <div style={{ fontSize: 12.5, color: '#B91C1C', background: '#FDECEC', border: '1px solid #FCA5A5', borderRadius: 9, padding: '9px 12px', display: 'flex', gap: 7, alignItems: 'flex-start' }}><AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}
        </div>
        <div className="mt-modal-foot">
          <span style={{ fontSize: 12, color: '#94A3B8' }}>Changes apply for the whole team.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="mt-btn" onClick={onClose}>Cancel</button>
            <button className="mt-btn primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save settings'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { canAccess, bypass } = useAuth();
  const { id: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('board');     // board | list | mine
  const [space, setSpace] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const allowed = bypass || canAccess('tasks');
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.list() });
  const staffQuery = useQuery({ queryKey: ['staff-directory'], queryFn: () => api.get('/staff').then(r => normList(r.data)) });
  const configQuery = useQuery({ queryKey: ['task-config'], queryFn: () => taskConfigApi.get() });
  const staffList = staffQuery.data || [];

  // Rebuild the live board maps whenever server config changes.
  useMemo(() => applyConfig(configQuery.data), [configQuery.data]);
  const curSpaces = (Array.isArray(configQuery.data?.spaces) && configQuery.data.spaces.length) ? configQuery.data.spaces : DEFAULT_SPACES;
  const curStatuses = (Array.isArray(configQuery.data?.statuses) && configQuery.data.statuses.length) ? configQuery.data.statuses : DEFAULT_STATUSES;
  const mSaveConfig = useMutation({ mutationFn: (data) => taskConfigApi.update(data), onSuccess: () => { qc.invalidateQueries(['task-config']); setShowSettings(false); } });

  // Deep-link: /tasks?task=<id> opens that task (used by the notification bell)
  useEffect(() => { const t = searchParams.get('task'); if (t) setOpenId(t); }, [searchParams]);
  const closeDetail = () => {
    setOpenId(null);
    if (searchParams.get('task')) { searchParams.delete('task'); setSearchParams(searchParams, { replace: true }); }
  };

  if (!allowed) return <Navigate to="/" replace />;

  const tasks = tasksQuery.data || [];
  const spaceTasks = space === 'all' ? tasks : tasks.filter(t => t.space === space);
  const viewTasks = spaceTasks;
  const myTasks = me ? tasks.filter(t => t.assignee_id === me) : [];
  const myOverdue = myTasks.filter(isOverdue).length;

  const spaceCounts = {}; const statusCounts = {};
  tasks.forEach(t => { spaceCounts[t.space] = (spaceCounts[t.space] || 0) + 1; statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  const spacePills = [['all', 'All spaces', null], ...Object.entries(SPACES).map(([k, v]) => [k, v.label, v.colour])];
  const sub = view === 'mine' ? 'My tasks · everything assigned to you' : (space === 'all' ? 'Team overview · all active work across Moov' : (SPACES[space]?.label || space) + ' space · this team’s board');

  return (
    <div className="moov-tasks">
      <div className="mt-head">
        <div className="mt-title-row">
          <div><div className="mt-title">Tasks</div><div className="mt-sub">{sub}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mt-btn" onClick={() => setShowSettings(true)} title="Board settings — edit spaces & statuses"><Settings size={15} /></button>
            <button className="mt-btn primary" onClick={() => setCreating(true)}><Plus size={15} />New task</button>
          </div>
        </div>
        <div className="mt-spaces">
          {spacePills.map(([k, label, colour]) => {
            const count = k === 'all' ? tasks.length : tasks.filter(t => t.space === k).length;
            return <div key={k} className={'mt-space' + (space === k ? ' active' : '')} onClick={() => setSpace(k)}>
              {colour ? <span className="dot" style={{ width: 8, height: 8, background: colour }} /> : <LayoutGrid size={14} />}
              {label}<span className="mt-count">{count}</span>
            </div>;
          })}
        </div>
        <div className="mt-controls">
          <div className="mt-tabs">
            <div className={'mt-tab' + (view === 'board' ? ' active' : '')} onClick={() => setView('board')}><LayoutGrid size={14} />Board</div>
            <div className={'mt-tab' + (view === 'list' ? ' active' : '')} onClick={() => setView('list')}><ListIcon size={14} />List</div>
            <div className={'mt-tab' + (view === 'mine' ? ' active' : '')} onClick={() => setView('mine')}><User size={14} />My tasks{myOverdue > 0 && <span style={{ marginLeft: 2, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px' }}>{myOverdue}</span>}</div>
          </div>
        </div>
      </div>

      {tasksQuery.isLoading ? <div className="mt-loading" style={{ marginTop: 60 }}>Loading tasks…</div>
        : tasksQuery.isError ? <div className="mt-loading" style={{ marginTop: 60, color: '#EF4444' }}>Couldn’t load tasks. Is the API deployed?</div>
          : view === 'mine' ? (
            <MyTasksView myTasks={myTasks} me={me} bypass={bypass} staffList={staffList} onOpen={setOpenId} onNew={() => setCreating(true)} />
          ) : view === 'list' ? (
            <div className="mt-list-wrap">
              <table>
                <thead><tr><th style={{ width: '34%' }}>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th><th style={{ textAlign: 'center' }}>Activity</th></tr></thead>
                <tbody>
                  {viewTasks.map(t => {
                    const od = isOverdue(t);
                    return <tr key={t.id} onClick={() => setOpenId(t.id)}>
                      <td><div style={{ fontWeight: 600, color: '#0F172A' }}>{t.title}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>{shortId(t.id)} · {SPACES[t.space]?.label}</div></td>
                      <td>{t.assignee_id ? <div className="mt-assignee-cell"><Avatar name={t.assignee_name} id={t.assignee_id} size={24} /><span>{t.assignee_name}</span></div> : <span style={{ color: '#94A3B8' }}>Unassigned</span>}</td>
                      <td><Pill map={PRIORITY} k={t.priority} /></td>
                      <td><StatusTag k={t.status} /></td>
                      <td><span className={'mt-due' + (od ? ' overdue' : '')} style={{ fontSize: 12.5 }}>{fmtDate(t.due_date)}{od ? ' · overdue' : ''}</span></td>
                      <td style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 600, fontSize: 12 }}>{t.comment_count || 0} · {t.attachment_count || 0}</td>
                    </tr>;
                  })}
                  {viewTasks.length === 0 && <tr><td colSpan={6}><div className="mt-empty" style={{ padding: 40 }}>No tasks yet. Hit “New task” to create one.</div></td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-board-wrap">
              <div className="mt-board">
                {COLUMNS.map(([key, label]) => {
                  const items = viewTasks.filter(t => t.status === key);
                  const s = STATUS[key];
                  return <div className="mt-col" key={key}>
                    <div className="mt-col-head"><div className="mt-col-title"><span className="dot" style={{ width: 9, height: 9, background: s.colour }} />{label}</div><span className="mt-count">{items.length}</span></div>
                    <div className="mt-col-body">
                      {items.map(t => <TaskCard key={t.id} task={t} onOpen={setOpenId} navigate={navigate} />)}
                      {items.length === 0 && <div className="mt-empty">Nothing here</div>}
                    </div>
                  </div>;
                })}
              </div>
            </div>
          )}

      {openId && <TaskDetail taskId={openId} me={me} navigate={navigate} onClose={closeDetail} />}
      {creating && <CreateModal defaultSpace={space} currentUserId={me} onClose={() => setCreating(false)} onCreated={(t) => { setCreating(false); if (t?.id) setOpenId(t.id); }} />}
      {showSettings && <SettingsModal initSpaces={curSpaces} initStatuses={curStatuses} spaceCounts={spaceCounts} statusCounts={statusCounts} saving={mSaveConfig.isLoading} onSave={(d) => mSaveConfig.mutate(d)} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
