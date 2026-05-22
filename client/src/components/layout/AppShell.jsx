import { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import KatanaWidget from '../katana/KatanaWidget';

const FULL_HEIGHT_ROUTES = ['/queries'];

export default function AppShell() {
  const scrollRef = useRef(null);
  const location  = useLocation();

  const isFullHeight = FULL_HEIGHT_ROUTES.some(r => location.pathname.startsWith(r));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A0B1E' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        {/*
          position:relative so that full-height pages can use
          position:absolute inset:0 to fill exactly this area.
          No conditional styles — same node, same style, always.
        */}
        <main style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {isFullHeight ? (
            <Outlet />
          ) : (
            <div
              ref={scrollRef}
              style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 24 }}
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
