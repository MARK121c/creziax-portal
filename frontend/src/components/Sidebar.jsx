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
];

const teamLinks = [
  { to: '/team', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/team/tasks', icon: CheckSquare, labelKey: 'my_tasks' },
  { to: '/team/files', icon: FileText, labelKey: 'files' },
];

const clientLinks = [
  { to: '/client', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/client/files', icon: FileText, labelKey: 'files' },
  { to: '/client/tasks', icon: CheckSquare, labelKey: 'tasks' },
  { to: '/client/messages', icon: MessageSquare, labelKey: 'messages' },
  { to: '/client/invoices', icon: Receipt, labelKey: 'invoices' },
];

const Sidebar = () => {
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

  return (
    <aside className={`fixed top-0 z-40 h-screen w-64 glass-panel border-white/5 flex flex-col transition-transform duration-300 ${
      isRTL 
        ? 'right-0 border-l lg:translate-x-0 translate-x-full' 
        : 'left-0 border-r lg:-translate-x-0 -translate-x-full'
    }`}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-7 py-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <span className="text-lg font-black text-white tracking-tighter">C</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-white">
            Creziax
          </span>
          <span className="text-[10px] font-medium text-violet-400/80 uppercase tracking-[0.2em] -mt-1">
            {t('agency_portal')}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        {getLinks().map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/team' || to === '/client'}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13.5px] font-medium transition-all duration-300 group ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={19} className={`transition-transform group-hover:scale-110 ${isRTL ? 'ml-1' : ''}`} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 mt-auto">
        <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate uppercase tracking-wider mt-0.5">
                {t(user?.role?.toLowerCase() || '')}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all duration-300 border border-white/5 hover:border-red-500/20"
          >
            <LogOut size={14} className={isRTL ? 'ml-1' : ''} />
            {t('sign_out')}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
