import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Check, X, ChevronDown, ChevronUp, Shield, Key, Lock, Unlock } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';
import { NAV_ITEMS } from '../../components/layout/Sidebar';
import { teamsApi } from '../../api/teams';

const api = axios.create({ baseURL: '/api' });

const ROLES = [
  { value: 'sales',              label: 'Sales' },
  { value: 'account_management', label: 'Account Management' },
  { value: 'onboarding',         label: 'Onboarding' },
  { value: 'finance',            label: 'Finance' },
  { value: 'customer_service',   label: 'Customer Service' },
  { value: 'manager',            label: 'Manager' },
  { value: 'director',           label: 'Director' },
];

const ROLE_COLORS = {
  sales:              { bg: 'var(--mv-purple-100)',    text: 'var(--mv-green)' },
  account_management: { bg: 'var(--mv-purple-100)',  text: 'var(--mv-purple)' },
  onboarding:         { bg: 'var(--mv-teal-100)',   text: 'var(--mv-teal)' },
  finance:            { bg: 'var(--mv-amber-100)',   text: 'var(--mv-amber-deep)' },
  customer_service:   { bg: 'var(--mv-magenta-100)', text: 'var(--mv-magenta)' },
  manager:            { bg: 'color-mix(in srgb, var(--mv-ink) 8%, transparent)', text: 'var(--mv-ink-52)' },
  director:           { bg: 'color-mix(in srgb, var(--mv-ink) 8%, transparent)', text: 'var(--mv-ink)' },
};

const EMPTY = { full_name: '', email: '', role: 'sales', team_id: '' };

// Page keys from sidebar — used to label permission toggles
const PAGE_KEYS = NAV_ITEMS.map(n => ({ key: n.key, label: n.label }));

// ─── PermissionsPanel ────────────────────────────────────────────────────────

function PermissionsPanel({ staffMember, onClose }) {
  const queryClient = useQueryClient();

  // Local state — initialised from server data
  const [permissions, setPermissions] = useState(staffMember.page_permissions || []);
  const [isAdmin, setIsAdmin]         = useState(staffMember.is_admin || false);
  const [password, setPassword]       = useState('');
  const [pwError, setPwError]         = useState('');
  const [pwSuccess, setPwSuccess]     = useState('');
  const [savingPerms, setSavingPerms] = useState(false);
  const [permsSaved, setPermsSaved]   = useState(false);
  const [savingPw, setSavingPw]       = useState(false);
  const [removingPw, setRemovingPw]   = useState(false);

  function togglePerm(key) {
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setPermsSaved(false);
  }

  function grantAll() {
    setPermissions(PAGE_KEYS.map(p => p.key));
    setPermsSaved(false);
  }

  function revokeAll() {
    setPermissions([]);
    setPermsSaved(false);
  }

  async function savePermissions() {
    setSavingPerms(true);
    try {
      await api.patch(`/staff/${staffMember.id}`, {
        page_permissions: permissions,
        is_admin: isAdmin,
      });
      queryClient.invalidateQueries(['staff']);
      setPermsSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPerms(false);
    }
  }

  async function setPasswordFn() {
    setPwError('');
    setPwSuccess('');
    if (!password || password.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await api.post(`/staff/${staffMember.id}/set-password`, { password });
      setPassword('');
      setPwSuccess('Password set successfully');
      queryClient.invalidateQueries(['staff']);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to set password');
    } finally {
      setSavingPw(false);
    }
  }

  async function removePasswordFn() {
    setRemovingPw(true);
    try {
      await api.delete(`/staff/${staffMember.id}/password`);
      setPwSuccess('Password removed — this person can no longer log in');
      queryClient.invalidateQueries(['staff']);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to remove password');
    } finally {
      setRemovingPw(false);
    }
  }

  return (
    <div
      style={{
        background: 'var(--mv-bg)',
        border: '1px solid var(--mv-purple-200)',
        borderRadius: 10,
        padding: 20,
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

        {/* Left: Permissions */}
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Shield size={14} style={{ color: 'var(--mv-purple)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)' }}>Page Access</span>
          </div>

          {/* Admin toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
            <div
              onClick={() => { setIsAdmin(v => !v); setPermsSaved(false); }}
              style={{
                width: 40, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer',
                background: isAdmin ? 'var(--mv-purple)' : 'color-mix(in srgb, var(--mv-ink) 8%, transparent)',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: 'var(--mv-bg)',
                position: 'absolute', top: 3, transition: 'left 0.2s',
                left: isAdmin ? 21 : 3,
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: isAdmin ? 'var(--mv-purple)' : 'var(--mv-ink-52)' }}>
              Administrator — access to all pages
            </span>
          </label>

          {/* Per-page toggles (only shown when not admin) */}
          {!isAdmin && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  onClick={grantAll}
                  style={{ fontSize: 11, color: 'var(--mv-green)', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: 'var(--mv-purple-100)' }}
                >
                  Grant all
                </button>
                <button
                  onClick={revokeAll}
                  style={{ fontSize: 11, color: 'var(--mv-magenta)', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: 'var(--mv-magenta-100)' }}
                >
                  Revoke all
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PAGE_KEYS.map(({ key, label }) => {
                  const enabled = permissions.includes(key);
                  return (
                    <label
                      key={key}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: enabled ? 'color-mix(in srgb, var(--mv-purple) 6%, transparent)' : 'transparent' }}
                    >
                      <div
                        onClick={() => togglePerm(key)}
                        style={{
                          width: 34, height: 18, borderRadius: 9, position: 'relative', cursor: 'pointer',
                          background: enabled ? 'var(--mv-green)' : 'color-mix(in srgb, var(--mv-ink) 8%, transparent)',
                          transition: 'background 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%', background: 'var(--mv-bg)',
                          position: 'absolute', top: 3, transition: 'left 0.15s',
                          left: enabled ? 18 : 4,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: enabled ? 'var(--mv-ink)' : 'var(--mv-ink-52)', fontWeight: enabled ? 600 : 400 }}>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={savePermissions}
              disabled={savingPerms}
              style={{
                background: 'linear-gradient(135deg, var(--mv-purple) 0%, var(--mv-magenta) 100%)',
                color: 'var(--mv-ink)', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {savingPerms ? 'Saving…' : 'Save permissions'}
            </button>
            {permsSaved && <span style={{ fontSize: 12, color: 'var(--mv-green)' }}>✓ Saved</span>}
          </div>
        </div>

        {/* Right: Password */}
        <div style={{ flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Key size={14} style={{ color: 'var(--mv-amber)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-ink)' }}>Login Password</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              background: staffMember.has_password ? 'var(--mv-purple-100)' : 'var(--mv-magenta-100)',
              color: staffMember.has_password ? 'var(--mv-green)' : 'var(--mv-magenta)',
            }}>
              {staffMember.has_password ? 'Set' : 'Not set'}
            </span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginBottom: 12, lineHeight: 1.5 }}>
            {staffMember.has_password
              ? 'Change or remove this person\'s password. Removing it will prevent them from logging in.'
              : 'Set a password so this person can log in to Moov OS.'}
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div className="pill-input-wrap" style={{ flex: 1 }}>
              <input
                type="password"
                placeholder={staffMember.has_password ? 'New password…' : 'Set password…'}
                value={password}
                onChange={e => { setPassword(e.target.value); setPwError(''); setPwSuccess(''); }}
                style={{ minWidth: 0 }}
              />
            </div>
            <button
              onClick={setPasswordFn}
              disabled={savingPw}
              style={{
                background: 'var(--mv-amber)', color: '#000', border: 'none', borderRadius: 8,
                padding: '0 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {savingPw ? '…' : staffMember.has_password ? 'Change' : 'Set'}
            </button>
          </div>

          {pwError   && <p style={{ fontSize: 12, color: 'var(--mv-magenta)', marginBottom: 6 }}>{pwError}</p>}
          {pwSuccess && <p style={{ fontSize: 12, color: 'var(--mv-green)', marginBottom: 6 }}>{pwSuccess}</p>}

          {staffMember.has_password && (
            <button
              onClick={removePasswordFn}
              disabled={removingPw}
              style={{
                background: 'none', border: '1px solid var(--mv-magenta-200)',
                color: 'var(--mv-magenta)', borderRadius: 8, padding: '6px 12px',
                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Lock size={12} /> {removingPw ? 'Removing…' : 'Remove password'}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, textAlign: 'right' }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', fontSize: 12 }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── TeamsCard ───────────────────────────────────────────────────────────────

function TeamsCard({ teams = [] }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: ({ id, inbox_email }) => teamsApi.update(id, { inbox_email }),
    onSuccess: () => queryClient.invalidateQueries(['teams']),
  });
  return (
    <div className="moov-card" style={{ padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mv-ink)', marginBottom: 4 }}>Teams & shared inboxes</div>
      <p style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginBottom: 14 }}>
        Onboarding tasks are assigned to a team. The shared inbox is where team notifications can be sent.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teams.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mv-purple)', width: 110 }}>{t.name}</span>
            <span style={{ fontSize: 11, color: 'var(--mv-ink-52)', width: 60 }}>{(t.members || []).length} member{(t.members || []).length === 1 ? '' : 's'}</span>
            <input
              defaultValue={t.inbox_email || ''}
              placeholder="team@yourdomain.com"
              onBlur={e => { if (e.target.value !== (t.inbox_email || '')) save.mutate({ id: t.id, inbox_email: e.target.value }); }}
              style={{ flex: 1, fontSize: 13, padding: '7px 11px', borderRadius: 8, border: '1px solid var(--mv-hairline)', background: 'var(--mv-surface)', color: 'var(--mv-ink)' }}
            />
          </div>
        ))}
        {!teams.length && <span style={{ fontSize: 12, color: 'var(--mv-ink-45)' }}>Teams will appear here once the database migration has run.</span>}
      </div>
    </div>
  );
}

// ─── StaffRow ────────────────────────────────────────────────────────────────

function StaffRow({ s, teams = [], onToggleActive, onChangeTeam }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr key={s.id}>
        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
        <td style={{ color: 'var(--mv-teal)' }}>{s.email}</td>
        <td>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 700,
            background: ROLE_COLORS[s.role]?.bg || 'color-mix(in srgb, var(--mv-ink) 8%, transparent)',
            color: ROLE_COLORS[s.role]?.text || 'var(--mv-ink-52)',
          }}>
            {ROLES.find(r => r.value === s.role)?.label || s.role}
          </span>
        </td>
        <td>
          <select value={s.team_id || ''} onChange={e => onChangeTeam(s.id, e.target.value || null)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--mv-hairline)', background: 'var(--mv-surface)', color: 'var(--mv-ink)' }}>
            <option value="">No team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </td>
        <td>
          {/* Permission status badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: s.is_admin
              ? 'var(--mv-purple-100)'
              : s.has_password
                ? 'var(--mv-purple-100)'
                : 'var(--mv-magenta-100)',
            color: s.is_admin ? 'var(--mv-purple)' : s.has_password ? 'var(--mv-green)' : 'var(--mv-magenta)',
          }}>
            {s.is_admin ? 'Admin' : s.has_password ? `${(s.page_permissions || []).length} pages` : 'No login'}
          </span>
        </td>
        <td style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--mv-purple)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Access
            </button>
            <button
              onClick={() => onToggleActive(s.id, false)}
              style={{ background: 'none', border: 'none', color: 'var(--mv-ink-52)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <X size={12} /> Deactivate
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: '0 16px 16px' }}>
            <PermissionsPanel staffMember={s} onClose={() => setExpanded(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── StaffSettings ───────────────────────────────────────────────────────────

export default function StaffSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: () => api.get('/staff/all').then(r => r.data),
  });

  const addStaff = useMutation({
    mutationFn: (data) => api.post('/staff', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setForm(EMPTY);
      setErrors({});
      setShowForm(false);
    },
    onError: (err) => {
      setErrors({ api: err.response?.data?.error || 'Something went wrong' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/staff/${id}`, { is_active }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries(['staff']),
  });

  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list });
  const changeTeam = useMutation({
    mutationFn: ({ id, team_id }) => api.patch(`/staff/${id}`, { team_id }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries(['staff']); queryClient.invalidateQueries(['teams']); },
  });

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  function submit() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email.trim())     errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    addStaff.mutate(form);
  }

  const active   = staff.filter(s => s.is_active);
  const inactive = staff.filter(s => !s.is_active);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <SettingsNav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--mv-green)' }}>Staff</h1>
          <p style={{ fontSize: 13, color: 'var(--mv-ink-52)', marginTop: 4 }}>
            Manage team members, set login passwords, and control which pages each person can access.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(f => !f)}>
          <UserPlus size={14} /> Add Staff Member
        </button>
      </div>

      {/* Add staff form */}
      {showForm && (
        <div className="moov-card" style={{ padding: 24, marginBottom: 24, border: '1px solid var(--mv-purple-200)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--mv-purple)', marginBottom: 20 }}>New Staff Member</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--mv-ink)', marginBottom: 6 }}>
                Full Name <span style={{ color: 'var(--mv-magenta)' }}>*</span>
              </label>
              <div className="pill-input-wrap" style={errors.full_name ? { borderColor: 'var(--mv-magenta)' } : {}}>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Smith" />
              </div>
              {errors.full_name && <p style={{ fontSize: 12, color: 'var(--mv-magenta)', marginTop: 4 }}>{errors.full_name}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--mv-ink)', marginBottom: 6 }}>
                Email <span style={{ color: 'var(--mv-magenta)' }}>*</span>
              </label>
              <div className="pill-input-wrap" style={errors.email ? { borderColor: 'var(--mv-magenta)' } : {}}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@moov.co.uk" />
              </div>
              {errors.email && <p style={{ fontSize: 12, color: 'var(--mv-magenta)', marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--mv-ink)', marginBottom: 6 }}>Role</label>
              <div className="pill-input-wrap">
                <select value={form.role} onChange={e => set('role', e.target.value)} style={{ paddingLeft: 16 }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--mv-ink)', marginBottom: 6 }}>Team</label>
              <div className="pill-input-wrap">
                <select value={form.team_id} onChange={e => set('team_id', e.target.value)} style={{ paddingLeft: 16 }}>
                  <option value="">No team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
          </div>

          {errors.api && (
            <div style={{ padding: 10, background: 'var(--mv-magenta-100)', border: '1px solid var(--mv-magenta)', borderRadius: 8, fontSize: 13, color: 'var(--mv-magenta)', marginBottom: 12 }}>
              {errors.api}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setErrors({}); setForm(EMPTY); }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={addStaff.isPending}>
              {addStaff.isPending ? 'Adding…' : <><Check size={14} /> Add Staff Member</>}
            </button>
          </div>
        </div>
      )}

      {/* Teams + shared inboxes */}
      <TeamsCard teams={teams} />

      {/* Active staff */}
      <div className="moov-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--mv-ink)' }}>Active Staff</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--mv-ink-52)' }}>{active.length} member{active.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--mv-ink-52)', fontSize: 13 }}>Loading…</div>
        ) : active.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--mv-ink-52)', fontSize: 13 }}>
            No staff added yet. Use the button above to add your first team member.
          </div>
        ) : (
          <table className="moov-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Access</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map(s => (
                <StaffRow
                  key={s.id}
                  s={s}
                  teams={teams}
                  onToggleActive={(id, val) => toggleActive.mutate({ id, is_active: val })}
                  onChangeTeam={(id, team_id) => changeTeam.mutate({ id, team_id })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inactive staff */}
      {inactive.length > 0 && (
        <div className="moov-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid color-mix(in srgb, var(--mv-ink) 6%, transparent)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--mv-ink-52)' }}>Inactive Staff</span>
          </div>
          <table className="moov-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {inactive.map(s => (
                <tr key={s.id} style={{ opacity: 0.5 }}>
                  <td>{s.full_name}</td>
                  <td style={{ color: 'var(--mv-ink-52)' }}>{s.email}</td>
                  <td style={{ color: 'var(--mv-ink-52)' }}>{ROLES.find(r => r.value === s.role)?.label || s.role}</td>
                  <td></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => toggleActive.mutate({ id: s.id, is_active: true })}
                      style={{ background: 'none', border: 'none', color: 'var(--mv-green)', cursor: 'pointer', fontSize: 12 }}
                    >
                      Reactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
