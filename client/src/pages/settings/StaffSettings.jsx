import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Check, X } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <SettingsNav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853' }}>Staff</h1>
          <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 4 }}>
            Manage internal team members. Staff appear in dropdowns across the system.
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
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                Full Name <span style={{ color: '#E91E8C' }}>*</span>
              </label>
              <div className="pill-input-wrap" style={errors.full_name ? { borderColor: '#E91E8C' } : {}}>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Smith" />
              </div>
              {errors.full_name && <p style={{ fontSize: 12, color: '#E91E8C', marginTop: 4 }}>{errors.full_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                Email <span style={{ color: '#E91E8C' }}>*</span>
              </label>
              <div className="pill-input-wrap" style={errors.email ? { borderColor: '#E91E8C' } : {}}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@moov.co.uk" />
              </div>
              {errors.email && <p style={{ fontSize: 12, color: '#E91E8C', marginTop: 4 }}>{errors.email}</p>}
            </div>

            {/* Role */}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map(s => (
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
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => toggleActive.mutate({ id: s.id, is_active: false })}
                      style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}
                    >
                      <X size={12} /> Deactivate
                    </button>
                  </td>
                </tr>
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
              <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
            </thead>
            <tbody>
              {inactive.map(s => (
                <tr key={s.id} style={{ opacity: 0.5 }}>
                  <td>{s.full_name}</td>
                  <td style={{ color: '#AAAAAA' }}>{s.email}</td>
                  <td style={{ color: '#AAAAAA' }}>{ROLES.find(r => r.value === s.role)?.label || s.role}</td>
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
