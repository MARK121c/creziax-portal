import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import { Toaster } from 'react-hot-toast';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Login from './pages/Login';

// Admin Dashboard Pages
import AdminDashboard from './dashboard/admin/AdminDashboard';
import ClientsPage from './dashboard/admin/ClientsPage';
import TeamPage from './dashboard/admin/TeamPage';
import ProjectsPage from './dashboard/admin/ProjectsPage';
import TasksPage from './dashboard/admin/TasksPage';
import InvoicesPage from './dashboard/admin/InvoicesPage';
import FilesPage from './dashboard/admin/FilesPage';
import MessagesPage from './dashboard/admin/MessagesPage';
import PaymentsPage from './dashboard/admin/PaymentsPage';

// Shared Pages
import ProfilePage from './dashboard/shared/ProfilePage';

// Team Dashboard Pages
import TeamDashboard from './dashboard/team/TeamDashboard';

// Client Dashboard Pages
import ClientDashboard from './dashboard/client/ClientDashboard';

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

function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <>
      <ThemeInitializer />
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
          <Route path="team" element={<TeamPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
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
          <Route path="files" element={<FilesPage />} />
          <Route path="tasks" element={<ClientDashboard />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="invoices" element={<ClientDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
