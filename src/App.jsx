import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ToastContainer, toast as rToast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { SocketProvider, useSocket } from './context/SocketContext';
import useAuthStore from './store/authStore';
import useNotificationStore from './store/notificationStore';
import useThemeStore from './store/themeStore';
import useBroadcastStore from './store/broadcastStore';
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
import FinancePage from './dashboard/admin/FinancePage';
import ProfilePage from './dashboard/shared/ProfilePage';
import NotificationsPage from './dashboard/shared/NotificationsPage';
import ExpensesPage from './dashboard/admin/ExpensesPage';
import ContractsPage from './dashboard/admin/ContractsPage';
import SalesPage from './dashboard/admin/SalesPage';
import usePresenceStore from './store/presenceStore';

import TeamDashboard from './dashboard/team/TeamDashboard';
import TeamWorkspaceDetail from './dashboard/team/TeamWorkspaceDetail';
import TeamTasksPage from './dashboard/team/TeamTasksPage';

import ClientDashboard from './dashboard/client/ClientDashboard';
import ClientFiles from './dashboard/client/ClientFiles';
import ClientMessages from './dashboard/client/ClientMessages';
import ClientInvoices from './dashboard/client/ClientInvoices';
import ClientContracts from './dashboard/client/ClientContracts';
import ClientProfile from './dashboard/client/ClientProfile';
import ClientProjects from './dashboard/client/ClientProjects';
import ClientSplashScreen from './components/ClientSplashScreen';
import CustomErrorPage from './components/CustomErrorPage';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const ThemeInitializer = () => {
  const { theme } = useThemeStore();
  
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

import { 
  getProfileAPI,
  markAllAsReadAPI 
} from './store/api';

function AppContent() {
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const fetchProfile = useAuthStore(state => state.fetchProfile);
  const fetchPresence = usePresenceStore(state => state.fetchPresence);
  const isInitializing = useAuthStore(state => state.isInitializing);
  
  const fetchActiveBroadcasts = useBroadcastStore(state => state.fetchActiveBroadcasts);
  
  const addNotification = useNotificationStore(state => state.addNotification);
  const activeThreadId = useNotificationStore(state => state.activeThreadId);
  const incrementUnreadMessages = useNotificationStore(state => state.incrementUnreadMessages);
  const resetUnreadMessages = useNotificationStore(state => state.resetUnreadMessages);
  const setGlobalCountVisible = useNotificationStore(state => state.setGlobalCountVisible);
  const globalCountVisible = useNotificationStore(state => state.globalCountVisible);
  const resetAllGlobalUnread = useNotificationStore(state => state.resetAllGlobalUnread);
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);
  const playTin = useNotificationStore(state => state.playTin);
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
    
    lastSoundTriggerRef.current = now; // v17.7 Immediate Sync Lock BEFORE promise
    try {
      const audio = new Audio('/sounds/notification.mp3'); 
      audio.volume = 1.0; 
      audio.play().catch(() => {});
    } catch(e) {}
  };

  const fetchActiveBroadcastsRef = useRef(fetchActiveBroadcasts);
  useEffect(() => { fetchActiveBroadcastsRef.current = fetchActiveBroadcasts; });

  useEffect(() => {
    console.log("%c Creziax Portal v20.6-MASTER %c Ready ", "background: #1e293b; color: #fff; border-radius: 5px 0 0 5px; padding: 2px 5px; font-weight: bold;", "background: #00E7FF; color: #000; border-radius: 0 5px 5px 0; padding: 2px 5px;");
    if (token) {
      fetchProfile();
      fetchPresence();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // v17.6-SUPREME: Immediate Global Reset on navigation
    const messagesPaths = ['/admin/messages', '/team/messages', '/client/messages'];
    if (messagesPaths.includes(location.pathname)) {
      console.log("🛠️ Supreme Reset: Clearing global unread count on navigation.");
      if (typeof resetAllGlobalUnread === 'function') resetAllGlobalUnread();
    }
  }, [location.pathname]); // Removed function from deps to avoid re-render loops

  useEffect(() => {
    if (!token || !user || !socket) return;
    
    // v18.0 Elite: Baseline sync from Database
    fetchNotifications();
    fetchUnreadCount();

    const notifyClickable = (msg, icon, path, customId) => {
      // FIXED TOAST ID FOR ALL INCOMING CHAT NOTIFICATIONS
      const finalId = 'global-chat-toast'; 
      
      playNotificationSound();
      rToast(msg, {
        icon: icon,
        toastId: finalId, // v17.6 Single Toast Hardening
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        onClick: () => {
          navigate(path);
          rToast.dismiss(finalId);
        }
      });
    };

    const handleNotificationCreated = (notif) => {
      // v21.4 Elite Sync: Universal Alert Dispatcher
      if (notif.senderId === user.id && (!notif.senderSocketId || notif.senderSocketId === socket?.id)) return;
      
      const isMessage = notif.type?.toUpperCase() === 'MESSAGE';
      const currentThreadId = activeThreadRef.current;
      
      // 1. Determine if we should show a Toast / Increment Badge
      let shouldAlert = true;
      if (isMessage && notif.threadId) {
        // If user is looking at this EXACT thread, don't show toast/add to history
        // activeThreadRef might be an object { id, ... } or just ID depending on role
        const targetId = currentThreadId?.id || currentThreadId?.userId || currentThreadId;
        if (targetId === notif.threadId) {
          shouldAlert = false;
        }
      }

      if (isMessage && notif.senderId !== user.id) {
        playNotificationSound();
      }

      if (shouldAlert) {
        // PERSIST TO LOCAL STORE (History + Badge)
        addNotification(notif.content, notif.type || 'info', {
           id: notif.id,
           senderId: notif.senderId,
           senderName: notif.senderName,
           threadId: notif.threadId
        });

        // UI Toast with precise navigation
        let targetPath = user.role === 'CLIENT' ? '/client/notifications' : (user.role === 'TEAM' ? '/team/notifications' : '/admin/notifications');
        
        if (isMessage) {
           const threadKey = notif.threadId || notif.senderId;
           incrementUnreadMessages(threadKey);
           targetPath = user.role === 'CLIENT' ? '/client/messages' : (user.role === 'TEAM' ? '/team/messages' : '/admin/messages');
        } else if (notif.type === 'TASK_UPDATE') {
           targetPath = user.role === 'CLIENT' ? '/client/projects' : (user.role === 'TEAM' ? '/team/tasks' : '/admin/tasks');
        }

        // Format notification message for display
        const formatNotifContent = (content, senderName) => {
          const name = senderName || 'مستخدم';
          if (!content) return `${name}: رسالة جديدة`;
          if (content.startsWith('[VOICE]')) return `${name}: 🎙️ رسالة صوتية`;
          if (content.startsWith('[FILE]')) return `${name}: 📎 ملف`;
          if (content.startsWith('[DRIVE_LINK]')) return `${name}: 🔗 رابط Drive`;
          if (content.startsWith('[MEETING_BOOKING]')) return `${name}: 📅 طلب موعد`;
          if (content.startsWith('[BOT]')) return `${name}: ${content.replace('[BOT]','').trim()}`;
          return `${name}: ${content}`;
        };

        notifyClickable(
           isMessage ? formatNotifContent(notif.content, notif.senderName) : (notif.content || 'إشعار جديد'),
           isMessage ? '💬' : '🔔', 
           targetPath
        );
      }
    };

    const handleChatDeletedGlobal = ({ threadId }) => {
       console.log(`[Wipeout] Thread ${threadId} deleted. Syncing UI...`);
       resetUnreadMessages(threadId);
    };

    const handleBonusReceived = (bonus) => {
      playTin();
      rToast(`💰 ${t('bonus_received_msg', 'مكافأة جديدة:')} ${bonus.amount} ر.س - ${bonus.reason || 'اداء ممتاز'}`, {
        icon: '✨',
        toastId: `bonus-${bonus.id || Date.now()}`,
        position: "top-right",
        autoClose: 10000,
        theme: "dark",
        style: { border: '1px solid #00E7FF', padding: '16px', color: '#00E7FF', fontWeight: 'bold', background: '#0a0a0c' }
      });
      // v21.4: Persistent log for bonuses too
      addNotification(`💰 مكافأة جديدة: ${bonus.amount} ر.س`, 'SUCCESS');
      fetchNotifications();
    };

    const handleReceiveMessage = (data) => {
       // Live chat UI updates are handled in MessagesPage.jsx
       // but we ensure counters are updated if not viewing
       const currentThreadId = activeThreadRef.current;
       const targetId = currentThreadId?.id || currentThreadId?.userId || currentThreadId;
       
       if (data.senderId !== user.id && targetId !== (data.threadId || data.senderId)) {
          // If NOT in history yet (via notification_created), this covers it
          // Note: our new backend logic emits 'notification_created' for all messages,
          // so this might be redundant, but keeps it robust.
          fetchUnreadCount();
       }
    };

    socket.on('notification_created', handleNotificationCreated);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('chat_deleted', handleChatDeletedGlobal);
    socket.on('bonus_received', handleBonusReceived);
    const handleBroadcastUpdated = () => fetchActiveBroadcastsRef.current();
    socket.on('broadcast_updated', handleBroadcastUpdated);
    const handlePresenceChange = ({ userId, isOnline, lastActiveAt }) => usePresenceStore.getState().updatePresence(userId, isOnline, lastActiveAt);
    socket.on('user_presence_change', handlePresenceChange);

    return () => {
      socket.off('notification_created', handleNotificationCreated);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('chat_deleted', handleChatDeletedGlobal);
      socket.off('bonus_received', handleBonusReceived);
      socket.off('broadcast_updated', handleBroadcastUpdated);
      socket.off('user_presence_change', handlePresenceChange);
    };
  }, [token, user?.id, user?.role, incrementUnreadMessages, t, navigate, socket]); // fetchActiveBroadcasts removed - using stable ref

  return (
    <div className="app-root">
      <ThemeInitializer />
      <LanguageInitializer />
      <Toaster position="top-center" reverseOrder={false} />
      <ToastContainer limit={3} />
      
      {/* 🧩 V20.6-MASTER: 3-WAY INIT GUARD - No more white screen on refresh */}
      {isInitializing ? (
        // Show premium loader while fetchProfile runs after page refresh
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0c] gap-6">
          <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-[#00E7FF] via-violet-500 to-black flex items-center justify-center shadow-2xl shadow-[#00E7FF]/20 animate-pulse">
            <span className="text-2xl font-black text-white">X</span>
          </div>
          <div className="w-10 h-10 border-4 border-[#00E7FF]/30 border-t-[#00E7FF] rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Syncing Session...</p>
        </div>
      ) : user ? (
        <SocketProvider user={user} token={token}>
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
              <Route path="finance" element={<FinancePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>


            {/* Team Routes */}
            <Route
              path="/team"
              element={
                <ProtectedRoute allowedRoles={['TEAM']}>
                  {!token ? (
                    <Navigate to="/login" replace />
                  ) : user ? (
                    <DashboardLayout />
                  ) : isTimedOut ? (
                    <Navigate to="/login" replace />
                  ) : (
                    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-[#0a0a0c] gap-6">
                       <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing Command Center...</p>
                    </div>
                  )}
                </ProtectedRoute>
              }
            >
              <Route index element={<TeamDashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<TeamWorkspaceDetail />} />
              <Route path="tasks" element={<TeamTasksPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
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
                  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a0c] gap-6">
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
        </SocketProvider>
      ) : (
        <Routes>
           <Route path="/login" element={<Login />} />
           <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
