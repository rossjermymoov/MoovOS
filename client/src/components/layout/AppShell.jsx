import { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import KatanaWidget from '../katana/KatanaWidget';

// Routes that render full-height (no padding, no scroll on main)
const FULL_HEIGHT_ROUTES = ['/queries'];

export default function AppShell() {
  const scrollRef = useRef(null);
  const location  = useLocation();

  const isFullHeight = FULL_HEIGHT_ROUTES.some(r => location.pathname.startsWith(r));

  // Reset scroll position on every route change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A0B1E' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        {/*
          main is a fixed flex column that fills the remaining height.
          It never changes style — the children handle their own layout.
          This avoids the browser inconsistency where a flex child using
          height:100% against a flex-1 parent resolves to 0.
        */}
        <main style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {isFullHeight ? (
            // Full-height pages (queries inbox + ticket detail):
            // render directly so they can fill with flex:1 / minHeight:0
            <Outlet />
          ) : (
            // Normal pages: scrollable padded wrapper
            <div
              ref={scrollRef}
              style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 24 }}
            >
              <Outlet />
            </div>
          )}
        </main>
      </div>
      <KatanaWidget />
    </div>
  );
}
