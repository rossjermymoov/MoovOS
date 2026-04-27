import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Check, X, ChevronDown, ChevronUp, Shield, Key, Lock, Unlock } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';
import { NAV_ITEMS } from '../../components/layout/Sidebar';

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
  sales:              { bg: 'rgba(0,200,83,0.12)',    text: '#00C853' },
  account_management: { bg: 'rgba(123,47,190,0.15)',  text: '#7B2FBE' },
  onboarding:         { bg: 'rgba(0,188,212,0.12)',   text: '#00BCD4' },
  finance:            { bg: 'rgba(255,193,7,0.12)',   text: '#FFC107' },
  customer_service:   { bg: 'rgba(233,30,140,0.12)', text: '#E91E8C' },
  manager:            { bg: 'rgba(255,255,255,0.08)', text: '#AAAAAA' },
  director:           { bg: 'rgba(255,255,255,0.08)', text: '#ffffff' },
};

const EMPTY = { full_name: '', email: '', role: 'sales' };

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
        background: '#1A1D35',
        border: '1px solid rgba(123,47,190,0.3)',
        borderRadius: 10,
        padding: 20,
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

        {/* Left: Permissions */}
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Shield size={14} style={{ color: '#7B2FBE' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Page Access</span>
          </div>

          {/* Admin toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
            <div
              onClick={() => { setIsAdmin(v => !v); setPermsSaved(false); }}
              style={{
                width: 40, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer',
                background: isAdmin ? '#7B2FBE' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, transition: 'left 0.2s',
                left: isAdmin ? 21 : 3,
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: isAdmin ? '#7B2FBE' : '#AAAAAA' }}>
              Administrator — access to all pages
            </span>
          </label>

          {/* Per-page toggles (only shown when not admin) */}
          {!isAdmin && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  onClick={grantAll}
                  style={{ fontSize: 11, color: '#00C853', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: 'rgba(0,200,83,0.1)' }}
                >
                  Grant all
                </button>
                <button
                  onClick={revokeAll}
                  style={{ fontSize: 11, color: '#E91E8C', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: 'rgba(233,30,140,0.1)' }}
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
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: enabled ? 'rgba(0,200,83,0.06)' : 'transparent' }}
                    >
                      <div
                        onClick={() => togglePerm(key)}
                        style={{
                          width: 34, height: 18, borderRadius: 9, position: 'relative', cursor: 'pointer',
                          background: enabled ? '#00C853' : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 3, transition: 'left 0.15s',
                          left: enabled ? 18 : 4,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: enabled ? '#fff' : '#AAAAAA', fontWeight: enabled ? 600 : 400 }}>
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
                background: 'linear-gradient(135deg, #7B2FBE 0%, #E91E8C 100%)',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {savingPerms ? 'Saving…' : 'Save permissions'}
            </button>
            {permsSaved && <span style={{ fontSize: 12, color: '#00C853' }}>✓ Saved</span>}
          </div>
        </div>

        {/* Right: Password */}
        <div style={{ flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Key size={14} style={{ color: '#FFC107' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Login Password</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              background: staffMember.has_password ? 'rgba(0,200,83,0.15)' : 'rgba(220,38,38,0.15)',
              color: staffMember.has_password ? '#00C853' : '#f87171',
            }}>
              {staffMember.has_password ? 'Set' : 'Not set'}
            </span>
          </div>

          <p style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 12, lineHeight: 1.5 }}>
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
                background: '#FFC107', color: '#000', border: 'none', borderRadius: 8,
                padding: '0 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {savingPw ? '…' : staffMember.has_password ? 'Change' : 'Set'}
            </button>
          </div>

          {pwError   && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 6 }}>{pwError}</p>}
          {pwSuccess && <p style={{ fontSize: 12, color: '#00C853', marginBottom: 6 }}>{pwSuccess}</p>}

          {staffMember.has_password && (
            <button
              onClick={removePasswordFn}
              disabled={removingPw}
              style={{
                background: 'none', border: '1px solid rgba(220,38,38,0.4)',
                color: '#f87171', borderRadius: 8, padding: '6px 12px',
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
          style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: 12 }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── StaffRow ────────────────────────────────────────────────────────────────

function StaffRow({ s, onToggleActive }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr key={s.id}>
        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
        <td style={{ color: '#00BCD4' }}>{s.email}</td>
        <td>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 700,
            background: ROLE_COLORS[s.role]?.bg || 'rgba(255,255,255,0.08)',
            color: ROLE_COLORS[s.role]?.text || '#fff',
          }}>
            {ROLES.find(r => r.value === s.role)?.label || s.role}
          </span>
        </td>
        <td>
          {/* Permission status badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: s.is_admin
              ? 'rgba(123,47,190,0.15)'
              : s.has_password
                ? 'rgba(0,200,83,0.12)'
                : 'rgba(220,38,38,0.1)',
            color: s.is_admin ? '#7B2FBE' : s.has_password ? '#00C853' : '#f87171',
          }}>
            {s.is_admin ? 'Admin' : s.has_password ? `${(s.page_permissions || []).length} pages` : 'No login'}
          </span>
        </td>
        <td style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{ background: 'none', border: 'none', color: '#7B2FBE', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Access
            </button>
            <button
              onClick={() => onToggleActive(s.id, false)}
              style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <X size={12} /> Deactivate
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: '0 16px 16px' }}>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853' }}>Staff</h1>
          <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 4 }}>
            Manage team members, set login passwords, and control which pages each person can access.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(f => !f)}>
          <UserPlus size={14} /> Add Staff Member
        </button>
      </div>

      {/* Add staff form */}
      {showForm && (
        <div className="moov-card" style={{ padding: 24, marginBottom: 24, border: '1px solid rgba(0,200,83,0.3)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#7B2FBE', marginBottom: 20 }}>New Staff Member</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                Full Name <span style={{ color: '#E91E8C' }}>*</span>
              </label>
              <div className="pill-input-wrap" style={errors.full_name ? { borderColor: '#E91E8C' } : {}}>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Smith" />
              </div>
              {errors.full_name && <p style={{ fontSize: 12, color: '#E91E8C', marginTop: 4 }}>{errors.full_name}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                Email <span style={{ color: '#E91E8C' }}>*</span>
              </label>
              <div className="pill-input-wrap" style={errors.email ? { borderColor: '#E91E8C' } : {}}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@moov.co.uk" />
              </div>
              {errors.email && <p style={{ fontSize: 12, color: '#E91E8C', marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Role</label>
              <div className="pill-input-wrap">
                <select value={form.role} onChange={e => set('role', e.target.value)} style={{ paddingLeft: 16 }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div className="green-cap">▾</div>
              </div>
            </div>
          </div>

          {errors.api && (
            <div style={{ padding: 10, background: 'rgba(233,30,140,0.1)', border: '1px solid #E91E8C', borderRadius: 8, fontSize: 13, color: '#E91E8C', marginBottom: 12 }}>
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

      {/* Active staff */}
      <div className="moov-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Active Staff</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#AAAAAA' }}>{active.length} member{active.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>Loading…</div>
        ) : active.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#AAAAAA', fontSize: 13 }}>
            No staff added yet. Use the button above to add your first team member.
          </div>
        ) : (
          <table className="moov-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Access</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map(s => (
                <StaffRow
                  key={s.id}
                  s={s}
                  onToggleActive={(id, val) => toggleActive.mutate({ id, is_active: val })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inactive staff */}
      {inactive.length > 0 && (
        <div className="moov-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#AAAAAA' }}>Inactive Staff</span>
          </div>
          <table className="moov-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {inactive.map(s => (
                <tr key={s.id} style={{ opacity: 0.5 }}>
                  <td>{s.full_name}</td>
                  <td style={{ color: '#AAAAAA' }}>{s.email}</td>
                  <td style={{ color: '#AAAAAA' }}>{ROLES.find(r => r.value === s.role)?.label || s.role}</td>
                  <td></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => toggleActive.mutate({ id: s.id, is_active: true })}
                      style={{ background: 'none', border: 'none', color: '#00C853', cursor: 'pointer', fontSize: 12 }}
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
