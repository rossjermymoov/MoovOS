import { useState, useEffect, useRef } from 'react';
import { Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(new Date());
  const searchInputRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter' && search.trim()) {
      const q = search.trim();
      navigate(`/shipments?search=${encodeURIComponent(q)}`);
    }
  }

  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = user?.full_name?.split(' ')[0] || 'Ross';

  return (
    <header className="mv-top">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mv-greet">Good {getGreeting()}, {firstName}</div>
        <div className="mv-greet-sub">{dateStr}</div>
      </div>

      <div className="mv-search">
        <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
        <input
          ref={searchInputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search consignment, customer…"
        />
        <kbd className="mv-kbd">⌘K</kbd>
      </div>

      <NotificationBell />
      <button className="mv-icon-btn" onClick={() => navigate('/settings')} title="Settings"><Settings size={17} /></button>
    </header>
  );
}
