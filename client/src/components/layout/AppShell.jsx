import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import KatanaWidget from '../katana/KatanaWidget';

export default function AppShell() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0B1E' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
      <KatanaWidget />
    </div>
  );
}
