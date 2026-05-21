import { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import KatanaWidget from '../katana/KatanaWidget';

// Routes that need the full height with no padding/scrolling
const FULL_HEIGHT_ROUTES = ['/queries'];

export default function AppShell() {
  const mainRef = useRef(null);
  const location = useLocation();

  const isFullHeight = FULL_HEIGHT_ROUTES.some(r => location.pathname.startsWith(r));

  // Always reset scroll on route change — scrollTop persists on the DOM node
  // and shifts content even with overflow:hidden, breaking full-height pages
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A0B1E' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <main
          ref={mainRef}
          style={{
            flex: 1,
            padding: isFullHeight ? 0 : 24,
            overflowY: isFullHeight ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </main>
      </div>
      <KatanaWidget />
    </div>
  );
}
