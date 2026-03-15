import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
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
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/admin/clients', icon: Users, labelKey: 'clients' },
  { to: '/admin/team', icon: UserCircle, labelKey: 'team' },
  { to: '/admin/projects', icon: FolderKanban, labelKey: 'projects' },
  { to: '/admin/tasks', icon: CheckSquare, labelKey: 'tasks' },
  { to: '/admin/files', icon: FileText, labelKey: 'files' },
  { to: '/admin/messages', icon: MessageSquare, labelKey: 'messages' },
  { to: '/admin/invoices', icon: Receipt, labelKey: 'invoices' },
  { to: '/admin/payments', icon: CreditCard, labelKey: 'payments' },
  { to: '/admin/profile', icon: UserRound, labelKey: 'my_profile' },
];

const teamLinks = [
  { to: '/team', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/team/tasks', icon: CheckSquare, labelKey: 'my_tasks' },
  { to: '/team/files', icon: FileText, labelKey: 'files' },
  { to: '/team/profile', icon: UserRound, labelKey: 'my_profile' },
];

const clientLinks = [
  { to: '/client', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/client/files', icon: FileText, labelKey: 'files' },
  { to: '/client/tasks', icon: CheckSquare, labelKey: 'tasks' },
  { to: '/client/messages', icon: MessageSquare, labelKey: 'messages' },
  { to: '/client/invoices', icon: Receipt, labelKey: 'invoices' },
  { to: '/client/profile', icon: UserRound, labelKey: 'my_profile' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const getLinks = () => {
    switch (user?.role) {
      case 'ADMIN': return adminLinks;
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
    <aside className={`fixed top-0 z-40 h-screen w-64 bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${
      isRTL 
        ? `right-0 border-l ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}` 
        : `left-0 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`
    }`}>
      {/* Brand Section - Professional & Minimal */}
      <div className="flex items-center gap-3 px-8 h-20 border-b border-slate-100 dark:border-white/5">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <span className="text-sm font-black text-white tracking-tighter">X</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-800 dark:text-white">
            Creziax
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] -mt-0.5">
            {t('agency_portal')}
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
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-500 dark:text-slate-500 hover:text-brand-600 dark:hover:text-slate-200 hover:bg-brand-50/50 dark:hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} className={`transition-transform group-hover:scale-110 ${isRTL ? 'ml-0.5' : ''}`} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* User Area - Clean Border Box */}
      <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-3 px-2 py-3 rounded-2xl">
          <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider mt-0.5">
              {t(user?.role?.toLowerCase() || '')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 text-xs font-black text-rose-500 hover:text-white bg-rose-500/5 hover:bg-rose-500 rounded-2xl transition-all duration-300 border border-rose-500/10 hover:border-rose-500 shadow-sm"
        >
          <LogOut size={14} className={isRTL ? 'ml-1' : ''} />
          {t('sign_out')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
