import { useEffect, useState, useRef } from 'react';
import { 
  Users, FolderKanban, Briefcase, Monitor, Receipt, Shield, 
  TrendingUp, TrendingDown, Activity, Plus, Rocket, Wallet, Download, 
  ArrowUpRight, ChevronDown, DollarSign, MinusCircle, Gift, Bell, Building2
} from 'lucide-react';
import { getDashboardStatsAPI, getRecentActivityAPI, getClientsAPI, getContractsAPI } from '../../store/api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-[2rem] p-5 md:p-6 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between gap-4">
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
    revenue: 'bg-white dark:bg-[#111111] border border-emerald-500/25',
    expenses: 'bg-white dark:bg-[#111111] border border-rose-500/25',
    profit: amount >= 0 
      ? 'bg-gradient-to-br from-brand-600 to-violet-700 text-white border-0 shadow-2xl shadow-brand-600/30'
      : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-0 shadow-2xl shadow-rose-600/30',
    default: 'bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5'
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
  <div className={`bg-white dark:bg-[#111111] border ${borderColor} rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5`}>
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
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [exportMonth, setExportMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const actionMenuRef = useRef(null);

  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';
  const hasFinancialAccess = isOwner || (user?.permissions?.includes('FINANCIAL_ACCESS') || user?.permissions?.includes('FINANCES'));

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, logsRes, clientsRes, contractsRes] = await Promise.all([
          getDashboardStatsAPI(exportMonth).catch(() => ({ data: null })),
          getRecentActivityAPI(5).catch(() => ({ data: [] })),
          getClientsAPI().catch(() => ({ data: [] })),
          getContractsAPI().catch(() => ({ data: [] }))
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (logsRes.data) setActivityLogs(logsRes.data);
        if (clientsRes.data) setClients(clientsRes.data);
        if (contractsRes.data) setContracts(contractsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [exportMonth]);

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
      { [t('stat_label', 'المؤشر')]: t('stat_clients'), [t('value_label', 'القيمة')]: stats.users?.clients || 0 },
      { [t('stat_label', 'المؤشر')]: t('stat_team'), [t('value_label', 'القيمة')]: stats.users?.team || 0 },
      { [t('stat_label', 'المؤشر')]: t('stat_admins'), [t('value_label', 'القيمة')]: stats.users?.admins || 0 },
      { [t('stat_label', 'المؤشر')]: t('stat_active_projects'), [t('value_label', 'القيمة')]: stats.projects?.active || 0 },
      { [t('stat_label', 'المؤشر')]: t('stat_managed_channels'), [t('value_label', 'القيمة')]: stats.channels?.total || 0 },
      ...(hasFinancialAccess ? [
        { [t('stat_label', 'المؤشر')]: t('stat_gross_revenue'), [t('value_label', 'القيمة')]: `$${stats.financials?.grossRevenue || 0}` },
        { [t('stat_label', 'المؤشر')]: t('total_expenses'), [t('value_label', 'القيمة')]: `$${stats.financials?.totalExpenses || 0}` },
        { [t('stat_label', 'المؤشر')]: t('total_salaries'), [t('value_label', 'القيمة')]: `$${stats.financials?.salaries || 0}` },
        { [t('stat_label', 'المؤشر')]: t('operational_expenses'), [t('value_label', 'القيمة')]: `$${stats.financials?.operationalExpenses || 0}` },
        { [t('stat_label', 'المؤشر')]: t('total_bonuses'), [t('value_label', 'القيمة')]: `$${stats.financials?.bonuses || 0}` },
        { [t('stat_label', 'المؤشر')]: t('stat_net_profit'), [t('value_label', 'القيمة')]: `$${stats.financials?.netProfit || 0}` },
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
            {t('system_overview')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-base md:text-lg italic mt-2">
            {t('system_overview_sub')}
          </p>
        </div>

        {/* Export Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          {/* Modern Month Picker */}
          <div className="relative flex items-center group">
            <div className="absolute left-3 pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
              <Receipt size={15} />
            </div>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              title={t('select_report_month')}
              className="pl-9 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all w-full sm:w-44 cursor-pointer"
            />
          </div>
          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-95"
          >
            <Download size={16} />
            {t('export_excel_report')}
          </button>
        </div>
      </div>

      {/* ─── Top Stats Grid (Restored) ─────────────────── */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 md:gap-6 mt-8">
        <StatCard icon={Users} label={t('total_clients')} value={stats?.users?.clients || 0} color="from-sky-500 to-blue-600" loading={loading} />
        <StatCard icon={Monitor} label={t('managed_channels_total')} value={stats?.channels?.total || 0} color="from-violet-500 to-purple-600" loading={loading} />
        <StatCard icon={Briefcase} label={t('team_size')} value={stats?.users?.team || 0} color="from-emerald-500 to-teal-600" loading={loading} />
        <StatCard icon={Shield} label={t('admins_count')} value={stats?.users?.admins || 0} color="from-amber-500 to-orange-500" loading={loading} />
        <StatCard icon={FolderKanban} label={t('active_contracts')} value={stats?.projects?.active || 0} color="from-brand-500 to-brand-700" loading={loading} />
        {hasFinancialAccess && (
          <StatCard icon={Receipt} label={t('pending_invoices_stat')} value={stats?.invoices?.pending || 0} color="from-rose-500 to-red-600" loading={loading} />
        )}
        <StatCard icon={Activity} label={t('total_tasks_stat')} value={stats?.tasks?.total || 0} color="from-slate-600 to-slate-800" loading={loading} />
      </div>

      {/* ─── Financial Section ─────────────────── */}
      {hasFinancialAccess && (
        <div className="bg-slate-200/20 dark:bg-[#111111]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden mt-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0">
                <Wallet size={22} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {t('financial_summary')}
              </h2>
            </div>

            {/* Merged Action Button with Dropdown */}
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setShowActionMenu(v => !v)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all hover:-translate-y-0.5 active:scale-95 text-sm"
              >
                <Plus size={16} />
                {t('add_expense_bonus')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${showActionMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showActionMenu && (
                <div className="absolute top-full mt-2 left-0 w-52 bg-white dark:bg-[#111118] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    to="/admin/expenses"
                    onClick={() => setShowActionMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <MinusCircle size={15} className="text-rose-500" />
                    </div>
                    <span className="font-bold text-sm">{t('manual_expense')}</span>
                  </Link>
                  <div className="h-px bg-slate-100 dark:bg-white/5 mx-3" />
                  <Link
                    to="/admin/expenses?tab=bonuses"
                    onClick={() => setShowActionMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Gift size={15} className="text-amber-500" />
                    </div>
                    <span className="font-bold text-sm">{t('team_bonus')}</span>
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
              sub={`${stats?.invoices?.paid ?? 0} ${t('paid_amount')} · ${t('remaining_amount')}: $${(fin?.pendingRevenue ?? 0).toLocaleString()}`}
            />
            <FinCard
              label={t('total_expenses')}
              amount={fin?.totalExpenses ?? 0}
              loading={loading}
              variant="expenses"
              sub={t('exp_sub_detail')}
            />
            <FinCard
              label={t('stat_net_profit')}
              amount={fin?.netProfit ?? 0}
              loading={loading}
              variant="profit"
              sub={(fin?.netProfit ?? 0) >= 0 ? t('revenue_gt_expenses') : t('expenses_gt_revenue')}
            />
          </div>

          {/* Bottom Row: 4 Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BreakdownCard
              icon={Briefcase}
              label={t('total_salaries_stat')}
              amount={fin?.salaries ?? 0}
              loading={loading}
              iconColor="bg-gradient-to-tr from-violet-500 to-purple-600"
              borderColor="border-violet-500/15 dark:border-violet-500/10"
            />
            <BreakdownCard
              icon={Gift}
              label={t('team_dues_stat')}
              amount={fin?.teamDues ?? 0}
              loading={loading}
              iconColor="bg-gradient-to-tr from-amber-500 to-orange-500"
              borderColor="border-amber-500/15 dark:border-amber-500/10"
            />
            <BreakdownCard
              icon={TrendingDown}
              label={t('operational_expenses_stat')}
              amount={fin?.operationalExpenses ?? 0}
              loading={loading}
              iconColor="bg-gradient-to-tr from-rose-500 to-red-600"
              borderColor="border-rose-500/15 dark:border-rose-500/10"
            />
            <BreakdownCard
              icon={TrendingUp}
              label={t('total_bonuses_stat')}
              amount={fin?.bonuses ?? 0}
              loading={loading}
              iconColor="bg-gradient-to-tr from-sky-500 to-blue-600"
              borderColor="border-sky-500/15 dark:border-sky-500/10"
            />
          </div>
        </div>
      )}



      {/* ─── Charts & Activity ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Activity Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col min-h-[380px]">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">{t('daily_activity')}</h3>
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
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('system_activity_log')}</h3>
            <Activity className="text-slate-400" size={20} />
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {activityLogs.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-10">{t('no_recent_activity_found')}</div>
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
                    <span className="font-bold text-slate-800 dark:text-white">{log.user?.firstName} {log.user?.lastName}</span> {t('user_performed_action')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(log.createdAt).toLocaleString(t('dashboard') === 'لوحة التحكم' ? 'ar-EG' : 'en-US')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contract Alerts Widget */}
        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Bell size={20} className="animate-swing" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('contract_alerts')}</h3>
            </div>
            <Link to="/admin/clients" className="text-xs font-black text-brand-500 hover:text-brand-400 uppercase tracking-widest border-b-2 border-brand-500/20 pb-0.5 transition-all">
              {t('view_all_clients_link')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contracts
              .filter(c => c.endDate)
              .map(c => {
                const end = new Date(c.endDate);
                const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
                return { ...c, daysLeft: diff };
              })
              .sort((a, b) => a.daysLeft - b.daysLeft)
              .slice(0, 4)
              .map(contract => {
                const isCritical = contract.daysLeft <= 7;
                const isExpired = contract.daysLeft < 0;
                
                // Get display logic based on whether it's a client or member
                const logo = contract.client?.clientInfo?.logoUrl || null;
                const company = contract.client?.clientInfo?.company || contract.member?.firstName || contract.title;
                const name = contract.client ? `${contract.client.user?.firstName || ''} ${contract.client.user?.lastName || ''}` : 
                             contract.member ? `${contract.member.firstName} ${contract.member.lastName}` : '---';

                return (
                  <Link 
                    key={contract.id} 
                    to={`/admin/contracts`}
                    className={`group relative overflow-hidden p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                      isExpired ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-500/20' :
                      isCritical ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-500/20' :
                      'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm flex-shrink-0 ${
                        isExpired ? 'bg-rose-500 text-white' :
                        isCritical ? 'bg-amber-500 text-white' :
                        'bg-white dark:bg-white/10 dark:text-white text-slate-800 border dark:border-white/10 border-slate-100'
                      }`}>
                        {logo ? (
                          <img src={logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          company?.charAt(0) || <Building2 size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 dark:text-white truncate">{company}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="space-y-0.5">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('expires_in_label')}</p>
                         <p className={`text-xs font-black ${isExpired ? 'text-rose-500' : isCritical ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                           {new Date(contract.endDate).toLocaleDateString(t('dashboard') === 'لوحة التحكم' ? 'ar-EG' : 'en-US')}
                         </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter ${
                        isExpired ? 'bg-rose-500 text-white animate-pulse' :
                        isCritical ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40' :
                        'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isExpired ? t('expired_label') : isCritical ? t('days_left_critical', { days: contract.daysLeft }) : t('days_left_normal', { days: contract.daysLeft })}
                      </div>
                    </div>

                    {/* Hover Glow */}
                    <div className={`absolute -right-4 -bottom-4 w-16 h-16 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none rounded-full ${
                      isExpired ? 'bg-rose-400' : isCritical ? 'bg-amber-400' : 'bg-brand-400'
                    }`} />
                  </Link>
                );
              })}
            {contracts.filter(c => c.endDate).length === 0 && (
                <p className="text-slate-400 font-bold text-sm">{t('no_active_contracts_alerts')}</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">{t('quick_actions_title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to={'/admin/clients'} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2rem] hover:border-brand-500/30 group transition-all duration-300">
               <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg`}>
                   <Plus size={22} className="flex-shrink-0" />
                 </div>
                 <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors uppercase tracking-wider text-sm">{t('add_client_btn')}</span>
               </div>
               <ArrowUpRight size={20} className="text-slate-300 group-hover:text-brand-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            <Link to={'/admin/projects'} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2rem] hover:border-brand-500/30 group transition-all duration-300">
               <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg`}>
                   <Rocket size={22} className="flex-shrink-0" />
                 </div>
                 <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors uppercase tracking-wider text-sm">{t('new_project_btn')}</span>
               </div>
               <ArrowUpRight size={20} className="text-slate-300 group-hover:text-brand-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            {hasFinancialAccess && (
              <Link to={'/admin/invoices'} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2rem] hover:border-brand-500/30 group transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg`}>
                    <Wallet size={22} className="flex-shrink-0" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors uppercase tracking-wider text-sm">{t('create_invoice_btn')}</span>
                </div>
                <ArrowUpRight size={20} className="text-slate-300 group-hover:text-brand-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
