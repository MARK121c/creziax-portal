import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import useAuthStore from './store/authStore';
import useNotificationStore from './store/notificationStore';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminDashboard from './dashboard/admin/AdminDashboard';
import ClientsPage from './dashboard/admin/ClientsPage';
import ClientProfilePage from './dashboard/admin/ClientProfilePage';
import TeamPage from './dashboard/admin/TeamPage';
import TeamMemberProfilePage from './dashboard/admin/TeamMemberProfilePage';
import ProjectsPage from './dashboard/admin/ProjectsPage';
import WorkspaceDetail from './dashboard/admin/WorkspaceDetail';
import TasksPage from './dashboard/admin/TasksPage';
import FilesPage from './dashboard/admin/FilesPage';
import MessagesPage from './dashboard/admin/MessagesPage';
import InvoicesPage from './dashboard/admin/InvoicesPage';
import PaymentsPage from './dashboard/admin/PaymentsPage';
import ProfilePage from './dashboard/shared/ProfilePage';
import NotificationsPage from './dashboard/shared/NotificationsPage';
import ExpensesPage from './dashboard/admin/ExpensesPage';
import ContractsPage from './dashboard/admin/ContractsPage';

import TeamDashboard from './dashboard/team/TeamDashboard';

import ClientDashboard from './dashboard/client/ClientDashboard';
import ClientFiles from './dashboard/client/ClientFiles';
import ClientMessages from './dashboard/client/ClientMessages';
import ClientInvoices from './dashboard/client/ClientInvoices';
import ClientContracts from './dashboard/client/ClientContracts';
import ClientProfile from './dashboard/client/ClientProfile';
import ClientProjects from './dashboard/client/ClientProjects';
import ClientSplashScreen from './components/ClientSplashScreen';
import CustomErrorPage from './components/CustomErrorPage';

const ThemeInitializer = () => {
  const theme = localStorage.getItem('theme') || 'dark';
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
  const navigate = useNavigate();
  const { token, user, fetchProfile } = useAuthStore();
  const { addNotification, activeThreadId, incrementUnreadMessages, resetUnreadMessages } = useNotificationStore();
  const { t } = useTranslation();
  const activeThreadRef = useRef(null);
  
  // SESSION PERSISTENCE: Only show splash once per browser session
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('creziax_splash_seen');
  });
  
  const [isTimedOut, setIsTimedOut] = useState(false);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('creziax_splash_seen', 'true');
    setShowSplash(false);
  }, []);

  const playGlobalDing = useCallback(() => {
    try {
      // Local stable notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch(e) {}
  }, []);

  useEffect(() => {
    console.log("%c Creziax Portal v8.0.0-AbsolutePrivacy %c Loaded ", "background: #f59e0b; color: #fff; border-radius: 5px 0 0 5px; padding: 2px 5px; font-weight: bold;", "background: #1e293b; color: #fff; border-radius: 0 5px 5px 0; padding: 2px 5px;");
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  // Fail-safe: If profile takes too long after splash, allow entry or redirect
  useEffect(() => {
    if (!showSplash && token && !user) {
      const timer = setTimeout(() => {
        setIsTimedOut(true);
        console.warn("Backend unresponsive. Entering recovery mode.");
      }, 3000); // 3s total buffer
      return () => clearTimeout(timer);
    }
  }, [showSplash, token, user]);

  // REAL-TIME SMART LISTENERS (Clickable Toasts)
  useEffect(() => {
    if (!token || !user) return;
    
    // TRACK ACTIVE THREAD REF TO AVOID STALE CLOSURES IN SOCKET LISTENER
    activeThreadRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    if (!token || !user) return;

    // Use a single socket instance for the lifetime of the session/user
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log("🌐 Global Pulse Connected:", socket.id);
      socket.emit('authenticate', { userId: user.id, role: user.role });
    });

    const notifyClickable = (msg, icon, path) => {
      playGlobalDing();
      toast(msg, {
        icon,
        duration: 5000,
        style: { cursor: 'pointer', background: '#0a0a0c', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', fontWeight: 'bold' },
        onClick: () => {
          navigate(path);
          toast.dismiss();
        }
      });
      addNotification(msg, 'info');
    };

    socket.on('smart_notification', (data) => {
      if (data.senderId === user.id) return;

      if (data.type === 'message') {
        let path = '/client/messages';
        if (user.role === 'ADMIN' || user.role === 'OWNER') path = '/admin/messages';
        else if (user.role === 'TEAM') path = '/team/messages';

        // ABSOLUTE PRIVACY LOGIC (v8.0): 
        // threadId is the SUPREME key. 
        // 1. If data.threadId exists, it's a Project/Group. Match ONLY by threadId.
        // 2. If data.threadId is null, it's a DM. Match by senderId.
        let targetId = data.threadId; 
        
        if (!targetId) {
           // Fallback for DMs
           if (user.role === 'CLIENT') targetId = user.id;
           else targetId = data.senderId;
        }

        // Strict Thread Isolation Check (v8.0)
        // Ensure no "leakage" even if senderId matches a different open thread
        const isCurrentlyViewingThisSpecificThread = activeThreadRef.current && (
           (data.threadId && data.threadId === activeThreadRef.current) || // Strict Group match
           (!data.threadId && targetId === activeThreadRef.current) // Strict DM match
        );

        if (isCurrentlyViewingThisSpecificThread) {
           // Silence: User is already in this specific thread
        } else {
           if (targetId) incrementUnreadMessages(targetId);
           notifyClickable(t('new_message_received_global', '🔊 لديك رسالة جديدة'), '💬', path);
        }
      }
    });

    socket.on('task_updated', (data) => {
      // Only notify if someone else updated it
      if (data?.userId && data.userId === user.id) return;

      let path = '/client';
      if (user.role === 'ADMIN' || user.role === 'OWNER') path = '/admin/projects';
      else if (user.role === 'TEAM') path = '/team/tasks';
      notifyClickable(t('task_updated_global', 'تم تحديث حالة فيديو المشروع'), '🎥', path);
    });

    socket.on('workspace_updated', (data) => {
      if (data?.userId && data.userId === user.id) return;

      let path = '/client';
      if (user.role === 'ADMIN' || user.role === 'OWNER') path = '/admin/projects';
      else if (user.role === 'TEAM') path = '/team/tasks';
      notifyClickable(t('timeline_updated_global', 'تحديث في مسار المشروع الذكي'), '🔄', path);
    });

    socket.on('new_ticket', (data) => {
      if (data?.userId && data.userId === user.id) return;

      let path = '/client/messages';
      if (user.role === 'ADMIN' || user.role === 'OWNER') path = '/admin/messages';
      else if (user.role === 'TEAM') path = '/team/messages';
      notifyClickable(t('new_meeting_global', 'لديك ميعاد اجتماع جديد'), '📅', path);
    });

    return () => {
      console.log("🌐 Global Pulse Disconnecting...");
      socket.disconnect();
    };
  }, [token, user?.id, user?.role, addNotification, t, playGlobalDing, navigate]);

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
          <Route path="notifications" element={<NotificationsPage />} />
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
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Client Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              {showSplash ? (
                <ClientSplashScreen onComplete={handleSplashComplete} />
              ) : !token ? (
                <Navigate to="/login" replace />
              ) : user ? (
                <DashboardLayout />
              ) : isTimedOut ? (
                <Navigate to="/login" replace />
              ) : (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-6">
                   <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Establishing Connection...</p>
                </div>
              )}
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="projects" element={<ClientProjects />} />
          <Route path="files" element={<ClientFiles />} />
          <Route path="tasks" element={<Navigate to="/client" replace />} />
          <Route path="messages" element={<ClientMessages />} />
          <Route path="invoices" element={<ClientInvoices />} />
          <Route path="contracts" element={<ClientContracts />} />
          <Route path="profile" element={<ClientProfile />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Catch-all Branded Error Page */}
        <Route path="*" element={<CustomErrorPage />} />
      </Routes>
    </>
  );
}

export default App;
