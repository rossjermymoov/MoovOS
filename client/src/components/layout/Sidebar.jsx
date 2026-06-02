import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, Tag, Truck, BarChart2, FileText,
  AlertTriangle, BookOpen, Settings, LayoutDashboard,
  UserCheck, LogOut, GitCompare, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',  key: 'dashboard'      },
  { to: '/customers',    icon: Users,           label: 'Customers',  key: 'customers'      },
  { to: '/tracking',     icon: Truck,           label: 'Tracking',   key: 'tracking'       },
  { to: '/queries',      icon: MessageSquare,   label: 'Queries',    key: 'queries'        },
  { to: '/carriers',     icon: Truck,           label: 'Carriers',   key: 'carriers'       },
  { to: '/settings',     icon: Settings,        label: 'Settings',   key: 'settings'       },
];

const MUTED = '#94A3B8';
const TEXT  = '#0F172A';
const HOVER = 'rgba(0,0,0,0.04)';
const ACTIVE_BG = 'rgba(0,0,0,0.06)';
const BORDER = 'rgba(0,0,0,0.06)';

export default function Sidebar() {
  const { user, bypass, canAccess, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => canAccess(item.key));

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside style={{
      width: 200,
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: '#FFFFFF',
      borderRight: `0.5px solid ${BORDER}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', color: TEXT }}>
          Moov<span style={{ color: MUTED, fontWeight: 400 }}> OS</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 8px' }}>
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: isActive ? ACTIVE_BG : 'transparent',
                transition: 'background 0.1s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = HOVER; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ color: isActive ? TEXT : MUTED, flexShrink: 0 }}
                />
                <span style={{
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? TEXT : MUTED,
                }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      {!bypass && user && (
        <div style={{ padding: '8px 8px 20px', borderTop: `0.5px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 8,
            marginBottom: 2,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500, color: TEXT, flexShrink: 0,
            }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.full_name?.split(' ')[0]}
            </span>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', width: '100%', borderRadius: 8,
            border: 'none', background: 'transparent', cursor: 'pointer',
            textAlign: 'left',
          }}
            onMouseEnter={e => e.currentTarget.style.background = HOVER}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} strokeWidth={1.5} style={{ color: MUTED, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: MUTED }}>Sign out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
