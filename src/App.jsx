import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Login from './pages/Login';

// Admin Dashboard Pages
import AdminDashboard from './dashboard/admin/AdminDashboard';
import ClientsPage from './dashboard/admin/ClientsPage';
import ClientProfilePage from './dashboard/admin/ClientProfilePage';
import TeamPage from './dashboard/admin/TeamPage';
import TeamMemberProfilePage from './dashboard/admin/TeamMemberProfilePage';
import ProjectsPage from './dashboard/admin/ProjectsPage';
import WorkspaceDetail from './dashboard/admin/WorkspaceDetail';
import TasksPage from './dashboard/admin/TasksPage';
import InvoicesPage from './dashboard/admin/InvoicesPage';
import FilesPage from './dashboard/admin/FilesPage';
import MessagesPage from './dashboard/admin/MessagesPage';
import PaymentsPage from './dashboard/admin/PaymentsPage';
import ExpensesPage from './dashboard/admin/ExpensesPage';
import ContractsPage from './dashboard/admin/ContractsPage';

// Shared Pages
import ProfilePage from './dashboard/shared/ProfilePage';

// Team Dashboard Pages
import TeamDashboard from './dashboard/team/TeamDashboard';

// Client Dashboard Pages
import ClientDashboard from './dashboard/client/ClientDashboard';
import ClientFiles from './dashboard/client/ClientFiles';
import ClientInvoices from './dashboard/client/ClientInvoices';
import ClientContracts from './dashboard/client/ClientContracts';
import ClientProfile from './dashboard/client/ClientProfile';
import ClientMessages from './dashboard/client/ClientMessages';

const ThemeInitializer = () => {
  const { theme } = useThemeStore();
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Toaster 
      position="top-center" 
      toastOptions={{
        className: 'border border-slate-200 dark:border-white/10 shadow-xl rounded-2xl font-medium text-sm',
        style: {
          background: theme === 'dark' ? '#18181b' : '#ffffff',
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: theme === 'dark' ? '#18181b' : '#ffffff',
          },
        },
      }}
    />
  );
};

const LanguageInitializer = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'en';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    
    if (lang === 'ar') {
      document.body.classList.add('rtl-active');
      document.body.classList.remove('ltr-active');
    } else {
      document.body.classList.add('ltr-active');
      document.body.classList.remove('rtl-active');
    }
  }, [i18n.language]);

  return null;
};

function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    console.log("%c Creziax Portal v1.2.1-final %c Loaded ", "background: #f59e0b; color: #fff; border-radius: 5px 0 0 5px; padding: 2px 5px; font-weight: bold;", "background: #1e293b; color: #fff; border-radius: 0 5px 5px 0; padding: 2px 5px;");
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <>
      <ThemeInitializer />
      <LanguageInitializer />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientProfilePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="team/:id" element={<TeamMemberProfilePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<WorkspaceDetail />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="contracts" element={<ContractsPage />} />
        </Route>

        {/* Team Routes */}
        <Route
          path="/team"
          element={
            <ProtectedRoute allowedRoles={['TEAM']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeamDashboard />} />
          <Route path="tasks" element={<TeamDashboard />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Client Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="files" element={<ClientFiles />} />
          <Route path="tasks" element={<Navigate to="/client" replace />} />
          <Route path="messages" element={<ClientMessages />} />
          <Route path="invoices" element={<ClientInvoices />} />
          <Route path="contracts" element={<ClientContracts />} />
          <Route path="profile" element={<ClientProfile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
