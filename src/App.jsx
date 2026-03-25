import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ToastContainer, toast as rToast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { SocketProvider, useSocket } from './context/SocketContext';
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

  return null;
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

function AppContent() {
  const navigate = useNavigate();
  const { token, user, fetchProfile } = useAuthStore();
  const { addNotification, activeThreadId, incrementUnreadMessages, resetUnreadMessages, setGlobalCountVisible, globalCountVisible } = useNotificationStore();
  const { t } = useTranslation();
  const activeThreadRef = useRef(null);
  
  const socket = useSocket(); // v14.0 Singleton Socket
  const processedMessagesRef = useRef(new Set()); 
  const lastSoundTriggerRef = useRef(0); 

  
  // SESSION PERSISTENCE: Only show splash once per browser session
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('creziax_splash_seen');
  });
  
  const [isTimedOut, setIsTimedOut] = useState(false);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('creziax_splash_seen', 'true');
    setShowSplash(false);
  }, []);

  const playNotificationSound = () => {
    const now = Date.now();
    // Throttle sound to once every 2.5s to prevent "machine gun" sounds
    if (now - lastSoundTriggerRef.current < 2500) return; 
    
    try {
      const audio = new Audio('/sounds/notification.mp3'); 
      audio.volume = 1.0; 
      audio.play().then(() => { lastSoundTriggerRef.current = now; }).catch(() => {});
    } catch(e) {}
  };

  useEffect(() => {
    console.log("%c Creziax Portal v17.5.2-ELITE %c Loaded ", "background: #1e293b; color: #fff; border-radius: 5px 0 0 5px; padding: 2px 5px; font-weight: bold;", "background: #22c55e; color: #fff; border-radius: 0 5px 5px 0; padding: 2px 5px;");
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
    activeThreadRef.current = activeThreadId;
  }, [activeThreadId, token, user]);

  const location = useLocation();

  useEffect(() => {
    // Hide global unread badge on sidebar when entering any messages page
    const messagesPaths = ['/admin/messages', '/team/messages', '/client/messages'];
    if (messagesPaths.includes(location.pathname)) {
      setGlobalCountVisible(false); 
    }
  }, [location.pathname, setGlobalCountVisible]);

  useEffect(() => {
    if (!token || !user || !socket) return;

    const notifyClickable = (msg, icon, path) => {
      playNotificationSound();
      rToast(msg, {
        icon: icon,
        toastId: `global-${msg.substring(0, 15)}`, // Strict ID to prevent duplicate toasts
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        onClick: () => {
          navigate(path);
          rToast.dismiss();
        }
      });
    };

    const handleReceiveMessage = (data) => {
      if (data.senderId === user.id) return; 
      if (processedMessagesRef.current.has(data.id)) return;
      processedMessagesRef.current.add(data.id);
      
      const isGroup = data.type === 'GROUP';
      let targetId = isGroup ? data.threadId : (user.role === 'CLIENT' ? user.id : data.senderId);

      const currentViewedThreadId = activeThreadRef.current;
      let isViewingThis = false;

      if (currentViewedThreadId) {
         isViewingThis = isGroup ? (currentViewedThreadId === data.threadId) : (currentViewedThreadId === targetId);
      }

      if (!isViewingThis) {
         if (targetId) incrementUnreadMessages(targetId);
         let targetPath = '/client/messages';
         if (user.role === 'ADMIN' || user.role === 'OWNER') {
            targetPath = isGroup ? '/admin/projects' : '/admin/messages';
         } else if (user.role === 'TEAM') {
            targetPath = isGroup ? '/team/projects' : '/team/messages';
         } else {
            targetPath = isGroup ? '/client/projects' : '/client/messages';
         }
         notifyClickable(`رسالة جديدة من ${data.senderName || 'مجهول'}`, '💬', targetPath);
      }
    };

    const handleSmartNotification = (notif) => {
      if (notif.senderId === user.id) return;
      if (notif.id && processedMessagesRef.current.has(notif.id)) return;
      if (notif.id) processedMessagesRef.current.add(notif.id);

      const isGroup = notif.threadId != null;
      let targetId = isGroup ? notif.threadId : notif.senderId;
      
      const currentViewedThreadId = activeThreadRef.current;
      let isViewing = false;
      if (currentViewedThreadId) {
         isViewing = isGroup ? (currentViewedThreadId === notif.threadId) : (currentViewedThreadId === targetId);
      }
      
      if (!isViewing) {
         if (targetId) incrementUnreadMessages(targetId);
         let targetPath = '/admin/messages';
         if (user.role === 'ADMIN' || user.role === 'OWNER') {
            targetPath = isGroup ? '/admin/projects' : '/admin/messages';
         } else if (user.role === 'TEAM') {
            targetPath = isGroup ? '/team/projects' : '/team/messages';
         } else {
            targetPath = isGroup ? '/client/projects' : '/client/messages';
         }
         notifyClickable(`رسالة جديدة من ${notif.senderName || 'مجهول'}`, '💬', targetPath);
      }
    };

    const handleTaskUpdate = (data) => {
      if (data?.userId === user.id) return;
      notifyClickable(t('task_updated_global', 'تم تحديث حالة فيديو المشروع'), '🎥', '/client');
    };

    socket.on('smart_notification', handleSmartNotification);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('task_updated', handleTaskUpdate);
    socket.on('workspace_updated', handleTaskUpdate);

    return () => {
      socket.off('smart_notification', handleSmartNotification);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('task_updated', handleTaskUpdate);
      socket.off('workspace_updated', handleTaskUpdate);
    };
  }, [token, user?.id, user?.role, incrementUnreadMessages, t, navigate, socket]);

  return (
    <>
      <ThemeInitializer />
      <LanguageInitializer />
      <Toaster position="top-center" reverseOrder={false} />
      <ToastContainer limit={3} />
      <Routes>
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
                   <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Establishing Connection...</p>
                </div>
              )}
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="projects" element={<ClientProjects />} />
          <Route path="files" element={<ClientFiles />} />
          <Route path="messages" element={<ClientMessages />} />
          <Route path="invoices" element={<ClientInvoices />} />
          <Route path="contracts" element={<ClientContracts />} />
          <Route path="profile" element={<ClientProfile />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<CustomErrorPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  const { user, token } = useAuthStore();
  
  return (
    <SocketProvider user={user} token={token}>
      <AppContent />
    </SocketProvider>
  );
}
