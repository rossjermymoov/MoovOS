import { NavLink } from 'react-router-dom';
import {
  Users, Tag, Truck, BarChart2, FileText,
  AlertTriangle, BookOpen, Settings, LayoutDashboard,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers',  icon: Users,           label: 'Customers' },
  { to: '/pricing',    icon: Tag,             label: 'Pricing' },
  { to: '/tracking',   icon: Truck,           label: 'Tracking' },
  { to: '/finance',    icon: FileText,        label: 'Finance' },
  { to: '/queries',    icon: AlertTriangle,   label: 'Queries' },
  { to: '/carriers',   icon: Truck,           label: 'Carriers' },
  { to: '/reports',    icon: BarChart2,       label: 'Reports' },
  { to: '/knowledge',  icon: BookOpen,        label: 'Knowledge' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside
      style={{ width: 140, minHeight: '100vh', background: '#0A0B1E', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      className="flex flex-col py-6 gap-1 shrink-0"
    >
      {/* Logo */}
      <div className="px-4 mb-6">
        <span style={{ color: '#00C853', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>
          MOOV<span style={{ color: '#fff' }}> OS</span>
        </span>
      </div>

      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
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
    </aside>
  );
}
