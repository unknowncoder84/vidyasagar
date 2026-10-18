import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TenantProvider } from './contexts/TenantContext';
import { DataProvider } from './contexts/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SubscriptionGate from './components/SubscriptionGate';
import DashboardPage from './pages/DashboardPage';
import CasesPage from './pages/CasesPage';
import CreateCasePage from './pages/CreateCasePage';
import EditCasePage from './pages/EditCasePage';
import CaseDetailsPage from './pages/CaseDetailsPage';
import TasksPage from './pages/TasksPage';
import AttendancePage from './pages/AttendancePage';
import ExpensesPage from './pages/ExpensesPage';
import ClientsPage from './pages/ClientsPage';
import CounselPage from './pages/CounselPage';
import CreateCounsellorPage from './pages/CreateCounsellorPage';
import CounselCasesPage from './pages/CounselCasesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import DateEventsPage from './pages/DateEventsPage';
import RemindersPage from './pages/RemindersPage';
import LibraryPage from './pages/LibraryPage';
import StoragePage from './pages/StoragePage';
import LoginPage from './pages/LoginPage';
import SubscriptionPage from './pages/SubscriptionPage';
import InstallPWA from './components/InstallPWA';
import ExpiryWarning from './components/ExpiryWarning';
import TaskPopupNotifier from './components/TaskPopupNotifier';

import './index.css';

// Inner component — reads tenantId from live auth context (not static localStorage)
function AppWithTenant() {
  const { user } = useAuth();
  // Use user.tenant_id when logged in; fall back to localStorage for page refreshes
  const tenantId = user?.tenant_id || localStorage.getItem('tenant_id') || undefined;

  return (
    <TenantProvider tenantId={tenantId} key={tenantId || 'no-tenant'}>
      <DataProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><SubscriptionGate><DashboardPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/cases" element={<ProtectedRoute><SubscriptionGate><CasesPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/cases/create" element={<ProtectedRoute><SubscriptionGate><CreateCasePage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/cases/:id/edit" element={<AdminRoute><SubscriptionGate><EditCasePage /></SubscriptionGate></AdminRoute>} />
            <Route path="/cases/:id" element={<ProtectedRoute><SubscriptionGate><CaseDetailsPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><SubscriptionGate><TasksPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><SubscriptionGate><AttendancePage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><SubscriptionGate><ExpensesPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><SubscriptionGate><ClientsPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/counsel" element={<ProtectedRoute><SubscriptionGate><CounselPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/counsel/create" element={<ProtectedRoute><SubscriptionGate><CreateCounsellorPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/counsel/cases" element={<ProtectedRoute><SubscriptionGate><CounselCasesPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><SubscriptionGate><AppointmentsPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SubscriptionGate><SettingsPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><SubscriptionGate><AdminPage /></SubscriptionGate></AdminRoute>} />
            <Route path="/reminders" element={<AdminRoute><SubscriptionGate><RemindersPage /></SubscriptionGate></AdminRoute>} />
            <Route path="/subscription" element={<AdminRoute><SubscriptionPage /></AdminRoute>} />
            <Route path="/events/:date" element={<ProtectedRoute><SubscriptionGate><DateEventsPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><SubscriptionGate><LibraryPage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/storage" element={<ProtectedRoute><SubscriptionGate><StoragePage /></SubscriptionGate></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <TaskPopupNotifier />
          <ExpiryWarning />
          <InstallPWA />
        </Router>
      </DataProvider>
    </TenantProvider>
  );
}

function App() {
  // DEMO MODE: when no real Supabase project is connected, the app still
  // renders fully (instead of blocking behind a "Configuration Required"
  // screen) so it can be browsed/shown with built-in demo data. Login
  // falls back to a demo account automatically (see AuthContext). Once
  // real credentials are set, this has no effect — the real backend
  // takes over everywhere.
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppWithTenant />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
