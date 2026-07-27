import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Plus,
  ChevronDown,
  MinusCircle,
  Gift,
  Wallet,
  Briefcase,
  Activity,
  Receipt
} from 'lucide-react';
import { getDashboardStatsAPI } from '../../store/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// ── Finance Card — large visual ───────────────────────────────────────────────
const FinCard = ({ label, amount, loading, variant = 'default', sub }) => {
  const variants = {
    revenue: 'bg-white dark:bg-[#0a0a0c] border border-emerald-500/25',
    expenses: 'bg-white dark:bg-[#0a0a0c] border border-rose-500/25',
    profit: amount >= 0 
      ? 'bg-gradient-to-br from-brand-600 to-violet-700 text-white border-0 shadow-2xl shadow-brand-600/30'
      : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-0 shadow-2xl shadow-rose-600/30',
    default: 'bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/5'
  };
  const isPrimary = variant === 'profit';
  const labelColor = variant === 'revenue' ? 'text-emerald-600 dark:text-emerald-400' :
                     variant === 'expenses' ? 'text-rose-500' : 
                     isPrimary ? 'text-white/70' : 'text-slate-500';
  const amountColor = isPrimary ? 'text-white' : 'text-slate-800 dark:text-white';

  return (
    <div className={`rounded-[2.5rem] p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${variants[variant]}`}>
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
          {sub && <p className={`text-[10px] font-bold mt-4 ${isPrimary ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>}
        </>
      )}
    </div>
  );
};

// ── Breakdown Card ────────────────────────────────────────────────────────────
const BreakdownCard = ({ icon: Icon, label, amount, loading, iconColor, borderColor }) => (
  <div className={`bg-white dark:bg-[#0a0a0c] border ${borderColor} rounded-[2rem] p-6 flex items-center gap-4 transition-all hover:-translate-y-1`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] truncate">{label}</p>
      {loading ? (
        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mt-1" />
      ) : (
        <p className="text-2xl font-black text-slate-800 dark:text-white">${(amount ?? 0).toLocaleString()}</p>
      )}
    </div>
  </div>
);

const FinancePage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStats();
  }, [exportMonth]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await getDashboardStatsAPI(exportMonth);
      setStats(data);
    } catch (err) {
      toast.error(t('error_general', 'فشل في تحميل البيانات المالية'));
    } finally {
      setLoading(false);
    }
  };

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

  const fin = stats?.financials;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ─── Header Section ─────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter uppercase whitespace-nowrap">
            {t('executive_finance_hub')}
          </h1>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-[0.4em]">
            {t('financial_oversight')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Picker */}
          <div className="relative flex items-center group">
            <div className="absolute left-3 pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
              <Calendar size={15} />
            </div>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="pl-9 pr-4 py-3 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500 transition-all cursor-pointer uppercase tracking-widest"
            />
          </div>

          {/* Action Menu */}
          <div className="relative" ref={actionMenuRef}>
            <button
              onClick={() => setShowActionMenu(v => !v)}
              className="flex items-center gap-3 px-6 py-3 bg-amber-600 dark:bg-[#FFD700] text-white dark:text-[#0A0A0A] font-black rounded-2xl shadow-xl shadow-amber-600/20 dark:shadow-[#FFD700]/10 transition-all hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-widest"
            >
              <Plus size={16} />
              {t('add_expense_bonus')}
              <ChevronDown size={14} className={`transition-transform duration-200 ${showActionMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showActionMenu && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <Link
                  to="/admin/expenses"
                  className="flex items-center gap-3 px-4 py-4 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <MinusCircle size={15} className="text-rose-500" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">{t('manual_expense')}</span>
                </Link>
                <div className="h-px bg-slate-100 dark:bg-white/5 mx-3" />
                <Link
                  to="/admin/expenses?tab=bonuses"
                  className="flex items-center gap-3 px-4 py-4 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Gift size={15} className="text-amber-500" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">{t('team_bonus')}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Financial Performance Grid ─────────────────── */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ─── Master Unified Ledger ─────────────────── */}
      <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-10 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('master_ledger')}</h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-[0.3em]">{t('comprehensive_audit_trail')}</p>
          </div>
          <button 
            onClick={() => {/* Excel export logic */}}
            className="px-8 py-3.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3"
          >
            <FileText size={16} /> {t('export_financials')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right rtl">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('transaction_details', 'التفاصيل')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('party_partner', 'الجهة / الشريك')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('transaction_type', 'النوع')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('amount')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {stats?.ledger?.map((item) => {
                const isIncome = item.type === 'INCOME';
                const isPending = item.type === 'PENDING_INCOME';
                const isExpense = item.type === 'EXPENSE';
                const isBonus = item.type === 'BONUS';

                return (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-emerald-500/10 text-emerald-500' :
                          isPending ? 'bg-amber-500/10 text-amber-500' :
                          isExpense ? 'bg-rose-500/10 text-rose-500' :
                          'bg-sky-500/10 text-sky-500'
                        }`}>
                          {isIncome || isPending ? <Wallet size={16} /> : isExpense ? <TrendingDown size={16} /> : <Gift size={16} />}
                        </div>
                        <span className="font-black text-slate-800 dark:text-white text-sm tracking-tight">{item.label}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-sm">{item.entity}</span>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
                        isIncome || isPending ? 'text-emerald-500 bg-emerald-500/10' :
                        isExpense ? 'text-rose-500 bg-rose-500/10' :
                        'text-sky-500 bg-sky-500/10'
                      }`}>
                        {item.type === 'INCOME' ? t('income_label') : item.type === 'PENDING_INCOME' ? t('pending_invoice_label') : item.type === 'BONUS' ? t('bonus_label') : t('expense_label')}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-center">
                      {item.status === 'PAID' ? (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={12} /> {t('paid')}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                          <Clock size={12} /> {t('pending')}
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-7">
                      <span className={`text-base font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                        {isExpense ? '-' : ''}${item.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!stats?.ledger?.length && (
                <tr>
                  <td colSpan="6" className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Activity size={48} className="text-slate-400" />
                      <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No transactions found for this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
