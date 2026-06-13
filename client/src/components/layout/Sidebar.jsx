import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, Tag, Truck, BarChart2, FileText,
  AlertTriangle, BookOpen, Settings, LayoutDashboard,
  UserCheck, LogOut, GitCompare, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',  key: 'dashboard' },
  { to: '/customers', icon: Users,           label: 'Customers',  key: 'customers' },
  { to: '/tracking',  icon: Truck,           label: 'Tracking',   key: 'tracking'  },
  { to: '/queries',   icon: MessageSquare,   label: 'Queries',    key: 'queries'   },
  { to: '/carriers',  icon: Truck,           label: 'Carriers',   key: 'carriers'  },
  { to: '/settings',  icon: Settings,        label: 'Settings',   key: 'settings'  },
];

// Section groupings — operational workspace vs. system/config.
const GROUPS = [
  { label: 'Workspace', keys: ['dashboard', 'customers', 'tracking', 'queries', 'carriers'] },
  { label: 'System',    keys: ['settings'] },
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

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-800 bg-slate-900 p-5 text-slate-400">

      {/* Top — brand + grouped nav */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2 px-2 text-xl font-black tracking-wider text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">M</span>
          Moov <span className="font-light text-slate-500">OS</span>
        </div>

        {/* Grouped navigation */}
        {groups.map(group => (
          <div key={group.label} className="mb-6">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {group.label}
            </div>
            <div className="space-y-1.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'} className="block no-underline">
                  {({ isActive }) => (
                    <div
                      className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-semibold tracking-wide transition-all duration-150 ${
                        isActive
                          ? 'bg-slate-800/70 text-white'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      {isActive && <span className="absolute left-0 h-5 w-1 rounded-r-md bg-blue-500" />}
                      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                      {label}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom — profile + sign out pinned to the base */}
      {!bypass && user && (
        <div className="mt-auto flex flex-col gap-1 border-t border-slate-800/60 pt-6">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-200">{user.full_name?.split(' ')[0]}</div>
              <div className="truncate text-[11px] text-slate-500">{user.email || 'Signed in'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-semibold tracking-wide text-slate-400 transition-all duration-150 hover:bg-slate-800/40 hover:text-slate-200"
          >
            <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
