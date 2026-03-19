import { useEffect, useState, useMemo } from 'react';
import { getInvoicesAPI, getExpensesAPI, getBonusesAPI } from '../../store/api';
import { 
  Search, 
  Calendar, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  History, 
  CheckCircle2, 
  User,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Building2,
  Receipt
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const PaymentsPage = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' or 'expenses'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'thisMonth', 'lastMonth'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, expensesRes, bonusesRes] = await Promise.all([
        getInvoicesAPI(),
        getExpensesAPI(),
        getBonusesAPI().catch(() => ({ data: [] }))
      ]);
      setInvoices(invoicesRes.data || []);
      setExpenses(expensesRes.data || []);
      setBonuses(bonusesRes.data || []);
    } catch (err) {
      toast.error(t('error_general'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logic for Revenue (PAID Invoices)
  const revenueData = useMemo(() => {
    return invoices.filter(inv => {
      const isPaid = inv.status === 'PAID';
      if (!isPaid) return false;

      const clientName = `${inv.client?.user?.firstName || ''} ${inv.client?.user?.lastName || ''}`.toLowerCase();
      const matchesSearch = clientName.includes(searchQuery.toLowerCase()) || 
                           inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           inv.service?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (dateFilter === 'all') return true;
      const date = new Date(inv.createdAt);
      const now = new Date();
      if (dateFilter === 'thisMonth') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'lastMonth') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return date.getMonth() === lastMonth && date.getFullYear() === year;
      }
      return true;
    });
  }, [invoices, searchQuery, dateFilter]);

  // Combined Expense Data (Dues + Operational + Bonuses)
  const expenseData = useMemo(() => {
    // 1. Map Expenses (Dues & Operational)
    const mappedExpenses = expenses.map(exp => ({
      ...exp,
      type: exp.userId ? 'DUE' : 'OPERATIONAL',
      name: exp.user ? `${exp.user.firstName} ${exp.user.lastName}` : `${t('agency_portal')} / ${exp.category}`,
      purpose: exp.description || exp.category,
      color: exp.userId ? 'amber' : 'rose',
      icon: exp.userId ? TrendingDown : Building2,
      date: exp.createdAt
    }));

    // 2. Map Bonuses
    const mappedBonuses = bonuses.map(bonus => ({
      ...bonus,
      type: 'BONUS',
      name: bonus.user ? `${bonus.user.firstName} ${bonus.user.lastName}` : t('member'),
      purpose: bonus.reason || t('bonus_reason'),
      color: 'sky',
      icon: Gift,
      date: bonus.date || bonus.createdAt,
      transferMethod: 'Direct Payment'
    }));

    const allExpenses = [...mappedExpenses, ...mappedBonuses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return allExpenses.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.purpose?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (dateFilter === 'all') return true;
      const date = new Date(item.date);
      const now = new Date();
      if (dateFilter === 'thisMonth') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'lastMonth') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return date.getMonth() === lastMonth && date.getFullYear() === year;
      }
      return true;
    });
  }, [expenses, bonuses, searchQuery, dateFilter]);

  // Statistics (Aggregated)
  const stats = useMemo(() => {
    const totalRev = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amount || 0), 0);
    
    // Expenses include: Sent Dues + Operational Expenses + Bonuses
    const expTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const bonusTotal = bonuses.reduce((sum, b) => sum + (b.amount || 0), 0);
    
    const totalExp = expTotal + bonusTotal;
    
    return {
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netProfit: totalRev - totalExp
    };
  }, [invoices, expenses, bonuses]);

  return (
    <div className="space-y-8 md:space-y-12 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {t('ledger_title').split(' ')[0]} <span className="text-brand-500">{t('ledger_title').split(' ')[1]}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg border-l-4 border-brand-500/30 pl-4 uppercase tracking-tighter">
            V 2.5 — <span className="text-brand-600">Unified Financial Hub</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-grow sm:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_ledger_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-64 md:w-80 shadow-sm font-bold"
            />
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
             <button onClick={() => setDateFilter('all')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dateFilter === 'all' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>{t('filter_all')}</button>
             <button onClick={() => setDateFilter('thisMonth')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dateFilter === 'thisMonth' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>{t('filter_this_month')}</button>
             <button onClick={() => setDateFilter('lastMonth')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dateFilter === 'lastMonth' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>{t('filter_last_month')}</button>
          </div>
        </div>
      </div>

      {/* Stats Widgets - High End Dash Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0c0c0e]/80 p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-xl shadow-emerald-500/5 dark:shadow-none relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="absolute top-6 right-6 p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
             <TrendingUp size={24} />
          </div>
          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.25em] mb-4">{t('stat_gross_revenue')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">${stats.totalRevenue.toLocaleString()}</h3>
            <span className="text-xs font-bold text-emerald-500/60 uppercase">USD</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-2">
             <CheckCircle2 size={12} className="text-emerald-500" />
             {t('rev_sub_detail')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0c0c0e]/80 p-8 rounded-[2.5rem] border border-rose-500/20 shadow-xl shadow-rose-500/5 dark:shadow-none relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="absolute top-6 right-6 p-4 rounded-2xl bg-rose-500/10 text-rose-500">
             <TrendingDown size={24} />
          </div>
          <p className="text-[10px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-[0.25em] mb-4">{t('total_expenses')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">${stats.totalExpenses.toLocaleString()}</h3>
            <span className="text-xs font-bold text-rose-500/60 uppercase">USD</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-2">
             <ArrowDownRight size={12} className="text-rose-500" />
             {t('exp_sub_detail')}
          </p>
        </div>

        <div className={`p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl transition-all ${
          stats.netProfit >= 0 
          ? 'bg-gradient-to-br from-brand-600 to-indigo-700 shadow-brand-600/30' 
          : 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-600/30'
        }`}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="absolute top-6 right-6 p-4 rounded-2xl bg-white/10 text-white">
             <Wallet size={24} />
          </div>
          <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.25em] mb-4">{t('stat_net_profit')}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">${stats.netProfit.toLocaleString()}</h3>
            <span className="text-xs font-bold text-white/60 uppercase">USD</span>
          </div>
          <p className="text-[10px] font-bold text-white/40 mt-4 flex items-center gap-2">
             <CheckCircle2 size={12} />
             {t('profit_sub_detail')}
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-[1.8rem] w-fit border border-slate-200 dark:border-white/10 shadow-inner">
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'revenue' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-xl' : 'text-slate-500'}`}
          >
            {t('tab_collections')} <span className="opacity-40 ml-2 font-mono">({revenueData.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-xl' : 'text-slate-500'}`}
          >
            {t('tab_payments')} <span className="opacity-40 ml-2 font-mono">({expenseData.length})</span>
          </button>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/20 dark:shadow-none backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7">
                    {activeTab === 'revenue' ? t('col_source_category') : t('col_recipient_purpose')}
                  </th>
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7 hidden md:table-cell">
                    {t('tier')}
                  </th>
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7">
                    {t('amount')}
                  </th>
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7 hidden sm:table-cell">
                    {t('col_execution_date')}
                  </th>
                  <th className="text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7">
                    {t('status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <Loader2 size={40} className="animate-spin text-brand-500 mx-auto mb-6" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{t('ledger_loading_msg')}</p>
                    </td>
                  </tr>
                ) : (activeTab === 'revenue' ? revenueData : expenseData).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
                        <History size={40} className="text-slate-200 dark:text-slate-700" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">{t('no_ledger_title')}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('no_ledger_desc')}</p>
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'revenue' ? revenueData : expenseData).map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-300">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border ${
                            activeTab === 'revenue' 
                            ? 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-400/20' 
                            : item.type === 'BONUS'
                            ? 'bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-400/20'
                            : item.type === 'OPERATIONAL'
                            ? 'bg-rose-50 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-400/20'
                            : 'bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-400/20'
                          }`}>
                            {activeTab === 'revenue' ? <Receipt size={20} /> : <item.icon size={20} />}
                          </div>
                          <div>
                            <div className="text-base font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors tracking-tighter uppercase">
                              {activeTab === 'revenue' ? (item.client?.user ? `${item.client.user.firstName} ${item.client.user.lastName}` : 'Client') : item.name}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                              {activeTab === 'revenue' ? item.service : item.purpose}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                            {activeTab === 'revenue' ? 'INVOICE' : item.type}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                             {activeTab === 'revenue' ? (item.paymentMethod || 'Wire Transfer') : (item.transferMethod || 'Agency Account')}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className={`text-2xl font-black tracking-tighter ${activeTab === 'revenue' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {activeTab === 'revenue' ? '+' : '-'}${item.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-10 py-8 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <Calendar size={14} className="opacity-40" />
                          {new Date(activeTab === 'revenue' ? item.createdAt : item.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-2xl w-fit ml-auto border border-emerald-500/20">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t('status_confirmed')}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
