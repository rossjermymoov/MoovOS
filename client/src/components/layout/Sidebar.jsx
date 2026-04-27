import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, Tag, Truck, BarChart2, FileText,
  AlertTriangle, BookOpen, Settings, LayoutDashboard, UserCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// page_key must match what's stored in staff.page_permissions[]
export const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',  key: 'dashboard' },
  { to: '/customers',    icon: Users,           label: 'Customers',  key: 'customers' },
  { to: '/pricing',      icon: Tag,             label: 'Pricing',    key: 'pricing' },
  { to: '/tracking',     icon: Truck,           label: 'Tracking',   key: 'tracking' },
  { to: '/finance',      icon: FileText,        label: 'Finance',    key: 'finance' },
  { to: '/queries',      icon: AlertTriangle,   label: 'Queries',    key: 'queries' },
  { to: '/customer-sim', icon: UserCheck,       label: 'Cust. Sim',  key: 'customer_sim' },
  { to: '/carriers',     icon: Truck,           label: 'Carriers',   key: 'carriers' },
  { to: '/reports',      icon: BarChart2,       label: 'Reports',    key: 'reports' },
  { to: '/knowledge',    icon: BookOpen,        label: 'Knowledge',  key: 'knowledge' },
  { to: '/settings',     icon: Settings,        label: 'Settings',   key: 'settings' },
];

export default function Sidebar() {
  const { user, bypass, canAccess, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => canAccess(item.key));

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      style={{ width: 140, minHeight: '100vh', background: '#0A0B1E', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      className="flex flex-col py-6 shrink-0"
    >
      {/* Logo */}
      <div className="px-4 mb-6">
        <span style={{ color: '#00C853', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>
          MOOV<span style={{ color: '#fff' }}> OS</span>
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 flex-1">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 px-2 mx-2 rounded-xl text-center transition-all ${
                isActive
                  ? 'text-[#00C853] bg-[rgba(0,200,83,0.12)]'
                  : 'text-[#AAAAAA] hover:text-white hover:bg-white/5'
              }`
            }
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  style={{ color: isActive ? '#00C853' : undefined, filter: isActive ? 'drop-shadow(0 0 6px rgba(0,200,83,0.6))' : undefined }}
                />
                <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User info + logout — only shown when actually logged in */}
      {!bypass && user && (
        <div className="mx-2 mt-2">
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 12,
            }}
          >
            <div style={{ color: '#AAAAAA', fontSize: 10, fontWeight: 600, textAlign: 'center', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>
              {user.full_name?.split(' ')[0]}
            </div>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-2 px-2 w-full rounded-xl text-center transition-all text-[#AAAAAA] hover:text-white hover:bg-white/5"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}
              title="Sign out"
            >
              <LogOut size={18} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
