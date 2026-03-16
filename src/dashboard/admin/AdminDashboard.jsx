import { useEffect, useState, useRef } from 'react';
import { 
  Users, FolderKanban, Briefcase, Monitor, Receipt, Shield, 
  TrendingUp, TrendingDown, Activity, Plus, Rocket, Wallet, Download, 
  ArrowUpRight, ChevronDown, DollarSign, MinusCircle, Gift
} from 'lucide-react';
import { getDashboardStatsAPI, getRecentActivityAPI } from '../../store/api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-5 md:p-6 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between gap-4">
    <div className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg shadow-${color}-500/20 bg-gradient-to-tr ${color}`}>
      <Icon size={20} className="text-white flex-shrink-0" />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      {loading ? (
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
      )}
    </div>
  </div>
);

// ── Finance Card — large visual ───────────────────────────────────────────────
const FinCard = ({ label, amount, loading, variant = 'default', sub }) => {
  const variants = {
    revenue: 'bg-white dark:bg-[#0a0a0c]/60 border border-emerald-500/25',
    expenses: 'bg-white dark:bg-[#0a0a0c]/60 border border-rose-500/25',
    profit: amount >= 0 
      ? 'bg-gradient-to-br from-brand-600 to-violet-700 text-white border-0 shadow-2xl shadow-brand-600/30'
      : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-0 shadow-2xl shadow-rose-600/30',
    default: 'bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-white/5'
  };
  const isPrimary = variant === 'profit';
  const labelColor = variant === 'revenue' ? 'text-emerald-600 dark:text-emerald-400' :
                     variant === 'expenses' ? 'text-rose-500' : 
                     isPrimary ? 'text-white/70' : 'text-slate-500';
  const amountColor = isPrimary ? 'text-white' : 'text-slate-800 dark:text-white';

  return (
    <div className={`rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${variants[variant]}`}>
      {/* Glow blob */}
      {!isPrimary && <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl pointer-events-none opacity-40 ${variant === 'revenue' ? 'bg-emerald-400' : variant === 'expenses' ? 'bg-rose-400' : 'bg-slate-300'}`} />}
      {isPrimary && <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-3xl pointer-events-none" />}
      
      <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-3 ${labelColor}`}>{label}</p>
      {loading ? (
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
      ) : (
        <>
          <p className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${amountColor}`}>
            ${Math.abs(amount ?? 0).toLocaleString()}
            {amount < 0 && <span className="text-2xl ml-1 opacity-70">-</span>}
          </p>
          {sub && <p className={`text-[10px] font-bold mt-3 ${isPrimary ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>}
        </>
      )}
    </div>
  );
};

// ── Breakdown Card ────────────────────────────────────────────────────────────
const BreakdownCard = ({ icon: Icon, label, amount, loading, iconColor, borderColor }) => (
  <div className={`bg-white dark:bg-[#0a0a0c]/40 border ${borderColor} rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">{label}</p>
      {loading ? (
        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mt-1" />
      ) : (
        <p className="text-xl font-black text-slate-800 dark:text-white">${(amount ?? 0).toLocaleString()}</p>
      )}
    </div>
  </div>
);

// ── Admin Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [exportMonth, setExportMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const actionMenuRef = useRef(null);

  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';
  const hasFinancialAccess = isOwner || user?.role === 'ADMIN' || (user?.permissions?.includes('FINANCIAL_ACCESS'));

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, logsRes] = await Promise.all([
          getDashboardStatsAPI().catch(() => ({ data: null })),
          getRecentActivityAPI(5).catch(() => ({ data: [] }))
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (logsRes.data) setActivityLogs(logsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Close action menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExportExcel = () => {
    if (!stats) return;
    const rows = [
      { المؤشر: t('stat_clients'), القيمة: stats.users?.clients },
      { المؤشر: t('stat_team'), القيمة: stats.users?.team },
      { المؤشر: t('stat_admins'), القيمة: stats.users?.admins },
      { المؤشر: t('stat_active_projects'), القيمة: stats.projects?.active },
      { المؤشر: t('stat_managed_channels'), القيمة: stats.channels?.total },
      ...(hasFinancialAccess ? [
        { المؤشر: t('stat_gross_revenue'), القيمة: `$${stats.financials?.grossRevenue}` },
        { المؤشر: t('total_expenses'), القيمة: `$${stats.financials?.totalExpenses}` },
        { المؤشر: t('total_salaries'), القيمة: `$${stats.financials?.salaries}` },
        { المؤشر: t('operational_expenses'), القيمة: `$${stats.financials?.operationalExpenses}` },
        { المؤشر: t('total_bonuses'), القيمة: `$${stats.financials?.bonuses}` },
        { المؤشر: t('stat_net_profit'), القيمة: `$${stats.financials?.netProfit}` },
      ] : [])
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Report-${exportMonth}`);
    XLSX.writeFile(wb, `Agency_Report_${exportMonth}.xlsx`);
  };

  const chartData = [
    { name: 'Mon', tasks: 12 }, { name: 'Tue', tasks: 19 }, { name: 'Wed', tasks: 15 },
    { name: 'Thu', tasks: 22 }, { name: 'Fri', tasks: 30 }, { name: 'Sat', tasks: 10 }, { name: 'Sun', tasks: 8 }
  ];

  const quickActions = [
    { label: t('add_client'), icon: Plus, path: '/admin/clients', color: 'from-sky-500 to-blue-600' },
    { label: t('new_project'), icon: Rocket, path: '/admin/projects', color: 'from-violet-500 to-purple-600' },
    { label: t('create_invoice'), icon: Wallet, path: '/admin/invoices', color: 'from-emerald-500 to-teal-600' },
  ];

  const fin = stats?.financials;

  return (
    <div className="space-y-8 md:space-y-12 pb-12">

      {/* ─── Header ─────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
            {t('overview_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-base md:text-lg italic mt-2">
            {t('overview_subtitle')}
          </p>
        </div>

        {/* Export Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          {/* Modern Month Picker */}
          <div className="relative flex items-center group">
            <div className="absolute left-3 pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
              <Receipt size={15} />
            </div>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              title="اختر شهر التقرير"
              className="pl-9 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all w-full sm:w-44 cursor-pointer"
            />
          </div>
          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-95"
          >
            <Download size={16} />
            {t('export_excel')}
          </button>
        </div>
      </div>

      {/* ─── Stat Cards Row ──────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
        <StatCard icon={Users} label={t('stat_clients')} value={stats?.users?.clients ?? 0} loading={loading} color="from-sky-500 to-blue-600" />
        <StatCard icon={Briefcase} label={t('stat_team')} value={stats?.users?.team ?? 0} loading={loading} color="from-violet-500 to-purple-600" />
        <StatCard icon={Shield} label={t('stat_admins')} value={stats?.users?.admins ?? 0} loading={loading} color="from-rose-500 to-red-600" />
        <StatCard icon={FolderKanban} label={t('stat_active_projects')} value={stats?.projects?.active ?? 0} loading={loading} color="from-emerald-500 to-teal-600" />
        <StatCard icon={Monitor} label={t('stat_managed_channels')} value={stats?.channels?.total ?? 0} loading={loading} color="from-amber-500 to-orange-600" />
      </div>

      {/* ─── Financial Section ─────────────────── */}
      {hasFinancialAccess && (
        <div className="bg-slate-50 dark:bg-[#0a0a0c]/20 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0">
                <Wallet size={22} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {t('financial_overview')}
              </h2>
            </div>

            {/* Merged Action Button with Dropdown */}
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setShowActionMenu(v => !v)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all hover:-translate-y-0.5 active:scale-95 text-sm"
              >
                <Plus size={16} />
                إضافة نفقة / مكافأة
                <ChevronDown size={14} className={`transition-transform duration-200 ${showActionMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showActionMenu && (
                <div className="absolute top-full mt-2 left-0 w-52 bg-white dark:bg-[#14141a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    to="/admin/expenses"
                    onClick={() => setShowActionMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <MinusCircle size={15} className="text-rose-500" />
                    </div>
                    <span className="font-bold text-sm">{t('add_manual_expense')}</span>
                  </Link>
                  <div className="h-px bg-slate-100 dark:bg-white/5 mx-3" />
                  <Link
                    to="/admin/expenses"
                    onClick={() => setShowActionMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Gift size={15} className="text-amber-500" />
                    </div>
                    <span className="font-bold text-sm">{t('add_team_bonus')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Top Row: 3 Main Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <FinCard
              label={t('stat_gross_revenue')}
              amount={fin?.grossRevenue ?? 0}
              loading={loading}
              variant="revenue"
              sub={`من ${stats?.invoices?.total ?? 0} فاتورة`}
            />
            <FinCard
              label={t('total_expenses')}
              amount={fin?.totalExpenses ?? 0}
              loading={loading}
              variant="expenses"
              sub={t('total_salaries') + " + " + t('operational_expenses') + " + " + t('total_bonuses')}
            />
            <FinCard
              label={t('stat_net_profit')}
              amount={fin?.netProfit ?? 0}
              loading={loading}
              variant="profit"
              sub={(fin?.netProfit ?? 0) >= 0 ? '↑ إيرادات تتجاوز النفقات' : '↓ النفقات تتجاوز الإيرادات'}
            />
          </div>

          {/* Bottom Row: 3 Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BreakdownCard
              icon={Briefcase}
              label={t('total_salaries')}
              amount={fin?.salaries ?? 0}
              loading={loading}
              iconColor="bg-gradient-to-tr from-violet-500 to-purple-600"
              borderColor="border-violet-500/15 dark:border-violet-500/10"
            />
            <BreakdownCard
              icon={TrendingDown}
              label={t('operational_expenses')}
              amount={fin?.operationalExpenses ?? 0}
              loading={loading}
              iconColor="bg-gradient-to-tr from-rose-500 to-red-600"
              borderColor="border-rose-500/15 dark:border-rose-500/10"
            />
            <BreakdownCard
              icon={Gift}
              label={t('total_bonuses')}
              amount={fin?.bonuses ?? 0}
              loading={loading}
              iconColor="bg-gradient-to-tr from-amber-500 to-orange-600"
              borderColor="border-amber-500/15 dark:border-amber-500/10"
            />
          </div>
        </div>
      )}

      {/* ─── Charts & Activity ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Activity Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col min-h-[380px]">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">{t('activity_analysis')}</h3>
          <div className="flex-1 w-full">
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
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('audit_log')}</h3>
            <Activity className="text-slate-400" size={20} />
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
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
                    }`}>{log.action}</span>
                    <span className="text-xs font-bold text-slate-400">{log.entityType}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-white">{log.user?.firstName} {log.user?.lastName}</span> {t('performed_action')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">{t('quick_actions')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={action.path} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2rem] hover:border-brand-500/30 group transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-lg`}>
                    <action.icon size={22} className="flex-shrink-0" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors uppercase tracking-wider text-sm">{action.label}</span>
                </div>
                <ArrowUpRight size={20} className="text-slate-300 group-hover:text-brand-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
