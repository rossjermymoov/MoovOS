import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import CustomerList from './pages/customers/CustomerList';
import CustomerRecord from './pages/customers/CustomerRecord';
import CustomerNew from './pages/customers/CustomerNew';
import StaffSettings from './pages/settings/StaffSettings';
import CarrierManagement from './pages/carriers/CarrierManagement';
import TrackingPage from './pages/tracking/TrackingPage';
import FinancePage from './pages/finance/FinancePage';
import QueriesPage from './pages/queries/QueriesPage';
import TicketDetailPage from './pages/queries/TicketDetailPage';
import CustomerSimPage from './pages/customer/CustomerSimPage';

// Placeholder pages for other sections (to be built)
const Placeholder = ({ name }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#AAAAAA' }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{name}</div>
    <div style={{ fontSize: 13 }}>This section is coming soon</div>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Placeholder name="Dashboard" />} />

        {/* Customers — nested so "new" is always resolved before ":id" */}
        <Route path="customers">
          <Route index element={<CustomerList />} />
          <Route path="new" element={<CustomerNew />} />
          <Route path=":id" element={<CustomerRecord />} />
        </Route>

        <Route path="pricing"   element={<Placeholder name="Pricing & Rate Cards" />} />
        <Route path="tracking"  element={<TrackingPage />} />
        <Route path="finance"   element={<FinancePage />} />
        <Route path="queries">
          <Route index element={<QueriesPage />} />
          <Route path=":id" element={<TicketDetailPage />} />
        </Route>
        <Route path="customer-sim"  element={<CustomerSimPage />} />
        <Route path="carriers"      element={<CarrierManagement />} />
        <Route path="reports"   element={<Placeholder name="Dashboards & Reporting" />} />
        <Route path="knowledge" element={<Placeholder name="Knowledge Base & AI" />} />
        <Route path="settings">
          <Route index element={<StaffSettings />} />
          <Route path="staff" element={<StaffSettings />} />
        </Route>
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
