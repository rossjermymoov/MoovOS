import { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import KatanaWidget from '../katana/KatanaWidget';

const FULL_HEIGHT_ROUTES = ['/queries', '/tasks'];

export default function AppShell() {
  const scrollRef = useRef(null);
  const location = useLocation();

  const isFullHeight = FULL_HEIGHT_ROUTES.some(r => location.pathname.startsWith(r));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="mv-app">
      <Sidebar />
      <div className="mv-main">
        <TopBar />
        <main style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {isFullHeight ? (
            <Outlet />
          ) : (
            <div ref={scrollRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
              <Outlet />
            </div>
          )}
        </main>
      </div>
      <KatanaWidget />
    </div>
  );
}
