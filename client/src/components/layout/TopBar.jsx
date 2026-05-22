import { useState, useEffect } from 'react';
import { Search, Bell, Calendar, Settings } from 'lucide-react';

export default function TopBar({ userName = 'Ross' }) {
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 24,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Welcome */}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
          Good {getGreeting()}, {userName}
        </span>
        <span style={{ fontSize: 13, color: '#64748B', marginLeft: 12 }}>
          {dateStr} · {timeStr}
        </span>
      </div>

      {/* Global search — pill style */}
      <div className="pill-input-wrap" style={{ width: 280 }}>
        <Search size={14} style={{ marginLeft: 14, color: '#64748B', flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers, accounts…"
          style={{ paddingLeft: 8 }}
        />
        <div className="green-cap" style={{ fontSize: 12 }}>⌘K</div>
      </div>

      {/* Utility icons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[Bell, Calendar, Settings].map((Icon, i) => (
          <button
            key={i}
            style={{
              background: 'rgba(0,0,0,0.04)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00C853, #7B2FBE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer',
        }}
      >
        {userName.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
