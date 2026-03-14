import { useEffect, useState } from 'react';
import { Users, FolderKanban, CheckSquare, Receipt, MessageSquare, UserCircle, TrendingUp, ArrowUpRight, Plus, Rocket, Wallet } from 'lucide-react';
import { getUsersAPI, getProjectsAPI, getTasksAPI, getInvoicesAPI } from '../../store/api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none group hover:-translate-y-1 transition-all duration-500">
    <div className="flex items-start justify-between mb-6">
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-${color}-500/20 bg-gradient-to-tr ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black tracking-widest uppercase">
          <TrendingUp size={12} />
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-end gap-3">
        <p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ users: 0, projects: 0, tasks: 0, invoices: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, projectsRes, tasksRes, invoicesRes] = await Promise.all([
          getUsersAPI(), getProjectsAPI(), getTasksAPI(), getInvoicesAPI(),
        ]);
        setStats({
          users: usersRes.data.length,
          projects: projectsRes.data.length,
          tasks: tasksRes.data.length,
          invoices: invoicesRes.data.length,
        });
      } catch {}
    };
    fetchStats();
  }, []);

  const quickActions = [
    { label: t('add_client'), icon: Plus, path: '/admin/clients', color: 'from-brand-600 to-brand-400' },
    { label: t('new_project'), icon: Rocket, path: '/admin/projects', color: 'from-violet-600 to-violet-400' },
    { label: t('create_invoice'), icon: Wallet, path: '/admin/invoices', color: 'from-rose-600 to-rose-400' },
  ];

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
          {t('overview_title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-base md:text-lg italic">
          {t('overview_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8">
        <StatCard icon={Users} label={t('stat_users')} value={stats.users} color="from-brand-600 to-brand-500" trend="+24%" />
        <StatCard icon={FolderKanban} label={t('stat_projects')} value={stats.projects} color="from-emerald-600 to-teal-500" trend="+12%" />
        <StatCard icon={CheckSquare} label={t('stat_tasks')} value={stats.tasks} color="from-amber-600 to-orange-500" />
        <StatCard icon={Receipt} label={t('stat_invoices')} value={stats.invoices} color="from-rose-600 to-pink-500" trend="+8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 min-h-[350px] md:h-[450px] bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/30 dark:shadow-none relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('activity_analysis')}</h3>
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-full -mt-10">
              <div className="w-full max-w-md h-48 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] flex items-center justify-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('visualizing')}</p>
              </div>
            </div>
        </div>

        <div className="min-h-[350px] md:h-[450px] bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col">
          <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-6 md:mb-8">{t('quick_actions')}</h3>
          <div className="space-y-4">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={action.path} className="flex items-center justify-between p-4 md:p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-3xl hover:border-brand-500/30 group transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-lg shadow-brand-500/10`}>
                    <action.icon size={18} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors uppercase tracking-wider text-xs">{action.label}</span>
                </div>
                <ArrowUpRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
          <div className="mt-auto p-4 md:p-6 bg-brand-500/5 border border-brand-500/20 rounded-3xl">
            <p className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">{t('pro_tip')}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{t('system_ok')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
