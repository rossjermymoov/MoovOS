import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, Tag, Truck, Settings, LayoutDashboard,
  LogOut, MessageSquare, Rocket, CheckSquare, Package, FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NAV_ITEMS = [
  { to: '/',                     icon: LayoutDashboard, label: 'Today',                  key: 'dashboard' },
  { to: '/customers',            icon: Users,           label: 'Customers',              key: 'customers' },
  { to: '/shipments',            icon: Package,         label: 'Shipments',              key: 'shipments' },
  { to: '/invoice-reconciliation', icon: FileCheck,     label: 'Invoice Reconciliation', key: 'reconciliation' },
  { to: '/onboarding',           icon: Rocket,          label: 'Onboarding',             key: 'onboarding' },
  { to: '/tracking',             icon: Truck,           label: 'Tracking',               key: 'tracking' },
  { to: '/queries',              icon: MessageSquare,   label: 'Queries',                key: 'queries' },
  { to: '/tasks',                icon: CheckSquare,     label: 'Tasks',                  key: 'tasks' },
  { to: '/pricing',              icon: Tag,             label: 'Pricing',                key: 'pricing' },
  { to: '/carriers',             icon: Truck,           label: 'Carriers',               key: 'carriers' },
  { to: '/settings',             icon: Settings,        label: 'Settings',               key: 'settings' },
];

// Workspace = day-to-day operations · Network = configuration
const GROUPS = [
  { label: 'Workspace', keys: ['dashboard', 'customers', 'shipments', 'reconciliation', 'onboarding', 'tracking', 'queries', 'tasks', 'pricing'] },
  { label: 'Network',   keys: ['carriers', 'settings'] },
];

export default function Sidebar() {
  const { user, bypass, canAccess, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const groups = GROUPS
    .map(g => ({ ...g, items: NAV_ITEMS.filter(i => g.keys.includes(i.key) && canAccess(i.key)) }))
    .filter(g => g.items.length);

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MO';

  return (
    <aside className="mv-rail">
      <div className="mv-rail-brand">
        <div className="mv-rail-wordmark">MOOV<span className="mv-rail-dot" /></div>
        <div className="mv-rail-sub">Operations System</div>
      </div>

      <div className="mv-rail-scroll">
        {groups.map(group => (
          <div className="mv-rail-group" key={group.label}>
            <div className="mv-rail-group-label">{group.label}</div>
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'mv-rail-item' + (isActive ? ' is-active' : '')}>
                <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {!bypass && user && (
        <div className="mv-rail-foot">
          <div className="mv-avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name || 'Signed in'}</div>
            <div style={{ fontSize: 11, color: 'var(--mv-ink-52)' }}>{user.role ? user.role.replace(/_/g, ' ') : 'Operations'}</div>
          </div>
          <button onClick={handleLogout} className="mv-icon-btn" title="Sign out"><LogOut size={16} /></button>
        </div>
      )}
    </aside>
  );
}
