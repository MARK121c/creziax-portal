import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  MessageSquare,
  Receipt,
  CreditCard,
  LogOut,
  UserCircle,
  UserRound,
  ExternalLink,
  ShieldAlert,
  FileBadge,
  FileSignature,
  Bell,
  BarChart3,
  ArchiveIcon
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/admin/clients', icon: Users, labelKey: 'clients' },
  { to: '/admin/team', icon: UserCircle, labelKey: 'team' },
  { to: '/admin/projects', icon: FolderKanban, labelKey: 'projects' },
  { to: '/admin/files', icon: FileText, labelKey: 'files' },
  { to: '/admin/tasks', icon: CheckSquare, labelKey: 'tasks' },
  { to: '/admin/messages', icon: MessageSquare, labelKey: 'messages' },
  { to: '/admin/invoices', icon: Receipt, labelKey: 'invoices' },
  { to: '/admin/contracts', icon: FileBadge, labelKey: 'contracts' },
  { to: '/admin/finance', icon: BarChart3, labelKey: 'finance_hub' },
  { to: '/admin/profile', icon: UserRound, labelKey: 'my_profile' },
  { to: '/admin/notifications', icon: Bell, labelKey: 'notifications' },
];

const teamLinks = [
  { to: '/team', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/team/projects', icon: FolderKanban, labelKey: 'projects' },
  { to: '/team/files', icon: FileText, labelKey: 'files' },
  { to: '/team/tasks', icon: CheckSquare, labelKey: 'tasks' },
  { to: '/team/messages', icon: MessageSquare, labelKey: 'messages' },
  { to: '/team/contracts', icon: FileBadge, labelKey: 'contracts' },
  { to: '/team/invoices', icon: Receipt, labelKey: 'invoices' },
  { to: '/team/profile', icon: UserRound, labelKey: 'my_profile' },
  { to: '/team/notifications', icon: Bell, labelKey: 'notifications' },
];

const clientLinks = [
  { to: '/client', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/client/projects', icon: FolderKanban, labelKey: 'projects' }, // Restored Projects link
  { to: '/client/files', icon: FileText, labelKey: 'files' },
  { to: '/client/messages', icon: MessageSquare, labelKey: 'messages' },
  { to: '/client/contracts', icon: FileSignature, labelKey: 'contracts' },
  { to: '/client/invoices', icon: Receipt, labelKey: 'invoices' },
  { to: '/client/profile', icon: UserRound, labelKey: 'my_profile' },
  { to: '/client/notifications', icon: Bell, labelKey: 'notifications' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const unreadMessagesCount = useNotificationStore(state => state.unreadMessagesCount);
  const unreadNotificationsCount = useNotificationStore(state => state.unreadNotificationsCount);
  const globalCountVisible = useNotificationStore(state => state.globalCountVisible);
  const addNotification = useNotificationStore(state => state.addNotification);
  const activeThreadId = useNotificationStore(state => state.activeThreadId);
  const incrementUnreadMessages = useNotificationStore(state => state.incrementUnreadMessages);
  const resetUnreadMessages = useNotificationStore(state => state.resetUnreadMessages);
  const resetUnreadNotifications = useNotificationStore(state => state.resetUnreadNotifications);
  const setGlobalCountVisible = useNotificationStore(state => state.setGlobalCountVisible);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const getLinks = () => {
    switch (user?.role) {
      case 'OWNER':
        return adminLinks;
      case 'ADMIN':
        return adminLinks.filter(link => {
          if (link.to === '/admin/profile' || link.to === '/admin' || link.to === '/admin/notifications') return true;
          if (link.to === '/admin/clients' && user?.permissions?.includes('CLIENTS')) return true;
          if (link.to === '/admin/team' && user?.permissions?.includes('TEAM')) return true;
          if (link.to === '/admin/projects' && user?.permissions?.includes('PROJECTS')) return true;
          if (link.to === '/admin/tasks' && user?.permissions?.includes('TASKS')) return true;
          if (link.to === '/admin/files' && user?.permissions?.includes('FILES')) return true;
          if (link.to === '/admin/messages' && user?.permissions?.includes('MESSAGES')) return true;
          if ((link.to === '/admin/invoices' || link.to === '/admin/payments') && user?.permissions?.includes('FINANCES')) return true;
          return false;
        });
      case 'TEAM': return teamLinks;
      case 'CLIENT': return clientLinks;
      default: return [];
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <aside className={`fixed top-0 z-[100] h-screen w-64 bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/5 flex flex-col transition-all duration-500 ease-in-out ${
      isRTL 
        ? `right-0 border-l ${isOpen ? 'translate-x-0 opacity-100 shadow-2xl shadow-black/50' : 'translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100'}` 
        : `left-0 border-r ${isOpen ? 'translate-x-0 opacity-100 shadow-2xl shadow-black/50' : '-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100'}`
    }`}>
      {/* Brand Section - Professional Elite Design */}
      <div className="flex items-center gap-3 px-8 h-24 border-b border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.01]">
        <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/30 transform rotate-45 group-hover:rotate-0 transition-transform duration-500">
          <span className="text-sm font-black text-white tracking-tighter -rotate-45">X</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tighter text-slate-800 dark:text-white italic">
            CREZIAX
          </span>
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] -mt-1 leading-none shadow-brand-500/20">
            MASTERPIECE
          </span>
        </div>
      </div>

      {/* Navigation - Better Spacing & Subtle Hovers */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-1.5 custom-scrollbar">
        {getLinks().map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/team' || to === '/client'}
            onClick={() => {
              closeMobileMenu();
              if (to.includes('notifications')) resetUnreadNotifications();
            }}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-500 dark:text-slate-500 hover:text-brand-600 dark:hover:text-slate-200 hover:bg-brand-50/50 dark:hover:bg-white/5'
              }`
            }
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="relative">
                <Icon size={18} className={`transition-transform group-hover:scale-110 ${unreadNotificationsCount > 0 && to.includes('notifications') ? 'animate-bounce text-cyan-500' : ''}`} />
                {unreadNotificationsCount > 0 && to.includes('notifications') && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                )}
              </div>
              <span className="truncate">{t(labelKey)}</span>
            </div>
            
            {unreadMessagesCount > 0 && globalCountVisible && to.includes('messages') && (
              <span className="ml-auto flex items-center justify-center bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full shadow-lg shadow-rose-500/20 animate-pulse">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}

            {unreadNotificationsCount > 0 && to.includes('notifications') && (
              <span className="ml-auto flex items-center justify-center bg-cyan-500 text-white text-[10px] font-black w-5 h-5 rounded-full shadow-lg shadow-cyan-500/20">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </NavLink>
        ))}
        {user?.clientInfo?.notionLink && (
           <a
             href={user.clientInfo.notionLink}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-500 dark:text-slate-500 hover:text-brand-600 dark:hover:text-slate-200 hover:bg-brand-50/50 dark:hover:bg-white/5 transition-all duration-300 group"
           >
             <img src="https://www.notion.so/images/favicon.ico" className="w-[18px] h-[18px] grayscale group-hover:grayscale-0 transition-all" alt="Notion" />
             {t('notion_project')}
           </a>
        )}
      </nav>

      {/* User Area - Clean Border Box */}
      <div className="p-3 md:p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-2 md:gap-3 px-1 md:px-2 py-2 md:py-3 rounded-2xl">
          <div className="relative group/avatar">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Profile" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-sm" 
              />
            ) : null}
            <div 
              style={{ display: user?.avatarUrl ? 'none' : 'flex' }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00E7FF] via-[#6A00FF] to-black flex items-center justify-center text-[10px] font-black text-white shadow-lg border border-white/10 uppercase tracking-tighter"
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            {user?.role === 'OWNER' ? (
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-0.5">
                {t('owner')}
              </p>
            ) : (
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider mt-0.5">
                {t(user?.role?.toLowerCase() || '')}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full mt-1 md:mt-2 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 text-xs font-black text-rose-500 hover:text-white bg-rose-500/5 hover:bg-rose-500 rounded-2xl transition-all duration-300 border border-rose-500/10 hover:border-rose-500 shadow-sm"
        >
          <LogOut size={14} className={isRTL ? 'ml-1' : ''} />
          {t('sign_out')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
