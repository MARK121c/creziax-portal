import { useEffect, useState } from 'react';
import { 
  Users, FolderKanban, Briefcase, Monitor, Receipt, Shield, 
  TrendingUp, Activity, Plus, Rocket, Wallet, Download 
} from 'lucide-react';
import { getDashboardStatsAPI, getRecentActivityAPI } from '../../store/api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const StatCard = ({ icon: Icon, label, value, color, loading, subtitle }) => (
  <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-500">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-${color}-500/20 bg-gradient-to-tr ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
    <div>
      <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-end gap-3 min-h-[40px]">
        {loading ? (
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
        )}
      </div>
      {subtitle && !loading && (
        <p className="text-xs font-bold text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  </div>
);

const FinanceCard = ({ icon: Icon, label, amount, color }) => (
  <div className="bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-brand-500/10 rounded-3xl p-6 flex items-center gap-6">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr ${color} shadow-lg`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-800 dark:text-white">${amount?.toLocaleString()}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check user permissions
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = currentUser.role === 'OWNER';
  const hasFinancialAccess = isOwner || (currentUser.permissions && currentUser.permissions.includes('FINANCIAL_ACCESS'));

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, logsRes] = await Promise.all([
          getDashboardStatsAPI().catch(() => ({ data: null })),
          getRecentActivityAPI(5).catch(() => ({ data: [] }))
        ]);

        if (statsRes.data) {
          setStats(statsRes.data);
        }
        if (logsRes.data) {
          setActivityLogs(logsRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleExportExcel = () => {
    if (!stats) return;
    const ws = XLSX.utils.json_to_sheet([
      { Metric: t('stat_clients'), Value: stats.users?.clients },
      { Metric: t('stat_team'), Value: stats.users?.team },
      { Metric: t('stat_admins'), Value: stats.users?.admins },
      { Metric: t('stat_active_projects'), Value: stats.projects?.active },
      { Metric: t('stat_managed_channels'), Value: stats.channels?.total },
      ...(hasFinancialAccess ? [
        { Metric: t('stat_gross_revenue'), Value: stats.financials?.grossRevenue },
        { Metric: t('stat_net_profit'), Value: stats.financials?.netProfit }
      ] : [])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
    XLSX.writeFile(wb, "Agency_Report.xlsx");
  };

  // Fake chart data for UI if stats aren't tracking historical tasks yet
  const chartData = [
    { name: 'Mon', tasks: 12 }, { name: 'Tue', tasks: 19 }, { name: 'Wed', tasks: 15 },
    { name: 'Thu', tasks: 22 }, { name: 'Fri', tasks: 30 }, { name: 'Sat', tasks: 10 }, { name: 'Sun', tasks: 8 }
  ];

  return (
    <div className="space-y-8 md:space-y-12 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
            {t('overview_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-base md:text-lg italic mt-2">
            {t('overview_subtitle')}
          </p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/20 w-full md:w-auto"
        >
          <Download size={18} />
          {t('export_excel')}
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <StatCard icon={Users} label={t('stat_clients')} value={stats?.users?.clients || 0} loading={loading} color="from-sky-500 to-blue-600" />
        <StatCard icon={Briefcase} label={t('stat_team')} value={stats?.users?.team || 0} loading={loading} color="from-violet-500 to-purple-600" />
        <StatCard icon={Shield} label={t('stat_admins')} value={stats?.users?.admins || 0} loading={loading} color="from-rose-500 to-red-600" />
        <StatCard icon={FolderKanban} label={t('stat_active_projects')} value={stats?.projects?.active || 0} loading={loading} color="from-emerald-500 to-teal-600" />
        <StatCard icon={Monitor} label={t('stat_managed_channels')} value={stats?.channels?.total || 0} loading={loading} color="from-amber-500 to-orange-600" />
      </div>

      {/* Financial Section (Owner Only) */}
      {hasFinancialAccess && (
        <div className="bg-slate-50 dark:bg-[#0a0a0c]/20 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-brand-500" size={24} />
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('financial_overview')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FinanceCard icon={TrendingUp} label={t('stat_gross_revenue')} amount={stats?.financials?.grossRevenue || 0} color="from-emerald-400 to-emerald-600" />
            <FinanceCard icon={Receipt} label={t('stat_net_profit')} amount={stats?.financials?.netProfit || 0} color="from-brand-500 to-brand-700" />
          </div>
          {/* Action buttons for manual expenses could go here */}
          <div className="mt-6 flex flex-wrap gap-4">
             <Link to="/admin/expenses" className="px-5 py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-500/20 transition-colors text-sm">
                + {t('add_manual_expense')}
             </Link>
             <Link to="/admin/team" className="px-5 py-2.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold rounded-xl hover:bg-brand-500/20 transition-colors text-sm">
                + {t('add_team_bonus')}
             </Link>
          </div>
        </div>
      )}

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Activity Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">{t('activity_analysis')}</h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }} />
                <Area type="monotone" dataKey="tasks" stroke="#7c3aed" strokeWidth={3} fill="url(#colorTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Log / Recent Activity */}
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('audit_log')}</h3>
            <Activity className="text-slate-400" size={20} />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activityLogs.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-10">{t('no_recent_activity')}</div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500' :
                      log.action === 'DELETE' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{log.entityType}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-white">
                      {log.user?.firstName} {log.user?.lastName}
                    </span> {t('performed_action')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
