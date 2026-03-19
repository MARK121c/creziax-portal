import { useEffect, useState, useMemo } from 'react';
import { getInvoicesAPI, getExpensesAPI } from '../../store/api';
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
  Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const PaymentsPage = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' or 'expenses'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'thisMonth', 'lastMonth'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, expensesRes] = await Promise.all([
        getInvoicesAPI(),
        getExpensesAPI()
      ]);
      setInvoices(invoicesRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (err) {
      toast.error(t('error_loading_financials') || 'Failed to load financial data');
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
                           inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

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

  // Filter logic for Expenses (SENT Team Dues)
  const expenseData = useMemo(() => {
    return expenses.filter(exp => {
      const isSent = exp.status === 'SENT';
      if (!isSent) return false;

      const teamName = `${exp.user?.firstName || ''} ${exp.user?.lastName || ''}`.toLowerCase();
      const matchesSearch = teamName.includes(searchQuery.toLowerCase()) || 
                           exp.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (dateFilter === 'all') return true;
      const date = new Date(exp.createdAt);
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
  }, [expenses, searchQuery, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalRev = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalExp = expenses.filter(e => e.status === 'SENT').reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netProfit: totalRev - totalExp
    };
  }, [invoices, expenses]);

  return (
    <div className="space-y-8 md:space-y-12 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Financial <span className="text-brand-500">Ledger</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg border-l-4 border-brand-500/30 pl-4">
            Unified Revenue & Expenditure Tracking
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-grow sm:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search Client or Team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-64 md:w-80 shadow-sm font-bold"
            />
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
             <button onClick={() => setDateFilter('all')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dateFilter === 'all' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>All</button>
             <button onClick={() => setDateFilter('thisMonth')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dateFilter === 'thisMonth' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>This Month</button>
             <button onClick={() => setDateFilter('lastMonth')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${dateFilter === 'lastMonth' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>Last Month</button>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0c0c0e] p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} className="text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Total Revenue</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</h3>
            <div className="mb-1 flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg text-[10px] font-black">
              <ArrowUpRight size={12} />
              COLLECTED
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0e] p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingDown size={80} className="text-rose-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Total Expenses</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">${stats.totalExpenses.toLocaleString()}</h3>
            <div className="mb-1 flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg text-[10px] font-black">
              <ArrowDownRight size={12} />
              OUTFLOW
            </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-brand-600 p-8 rounded-[2.5rem] shadow-2xl shadow-brand-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
            <Wallet size={80} className="text-white" />
          </div>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Net Profit</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-white">${stats.netProfit.toLocaleString()}</h3>
            <div className="mb-1 flex items-center gap-1 text-white bg-white/10 px-2 py-1 rounded-lg text-[10px] font-black">
              <CheckCircle2 size={12} />
              SETTLED
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-[1.5rem] w-fit border border-slate-200 dark:border-white/10">
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'revenue' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-md' : 'text-slate-500'}`}
          >
            Revenue <span className="opacity-40 ml-2 font-mono">{revenueData.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-md' : 'text-slate-500'}`}
          >
            Expenses <span className="opacity-40 ml-2 font-mono">{expenseData.length}</span>
          </button>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/30 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7">
                    {activeTab === 'revenue' ? 'Client / Service' : 'Team Member / Purpose'}
                  </th>
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7 hidden md:table-cell">
                    Method
                  </th>
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7">
                    Amount
                  </th>
                  <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7 hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-10 py-7">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <Loader2 size={40} className="animate-spin text-brand-500 mx-auto mb-6" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Ledger...</p>
                    </td>
                  </tr>
                ) : (activeTab === 'revenue' ? revenueData : expenseData).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
                        <History size={40} className="text-slate-200 dark:text-slate-700" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">No Records Found</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-bold">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'revenue' ? revenueData : expenseData).map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-300">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border ${
                            activeTab === 'revenue' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                          }`}>
                            {activeTab === 'revenue' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          </div>
                          <div>
                            <div className="text-base font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors tracking-tight">
                              {activeTab === 'revenue' 
                                ? `${item.client?.user?.firstName || 'Unknown'} ${item.client?.user?.lastName || ''}` 
                                : `${item.user?.firstName || 'Unknown'} ${item.user?.lastName || ''}`
                              }
                            </div>
                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-2">
                              {activeTab === 'revenue' ? item.service : item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-white/10">
                            {activeTab === 'revenue' ? item.paymentMethod : item.transferMethod}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className={`text-xl font-black tracking-tighter ${activeTab === 'revenue' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {activeTab === 'revenue' ? '+' : '-'}${item.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-10 py-8 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-xs font-bold font-mono">
                          <Calendar size={14} className="opacity-40" />
                          {new Date(item.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-2xl w-fit ml-auto border border-emerald-500/20">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Confirmed</span>
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
