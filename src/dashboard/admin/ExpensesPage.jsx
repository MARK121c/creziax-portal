import { useEffect, useState } from 'react';
import { getExpensesAPI, createExpenseAPI, deleteExpenseAPI, getBonusesAPI, createBonusAPI, deleteBonusAPI, getUsersAPI } from '../../store/api';
import { Plus, X, Trash2, Receipt, Loader2, DollarSign, Gift, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const EXPENSE_CATEGORIES = ['SERVER', 'ADS', 'SOFTWARE', 'RENT', 'EQUIPMENT', 'TRAVEL', 'OTHER'];

const ExpensesPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('expenses');

  // Expenses state
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'SERVER', description: '' });

  // Bonuses state
  const [bonuses, setBonuses] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingBonuses, setLoadingBonuses] = useState(true);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [submittingBonus, setSubmittingBonus] = useState(false);
  const [bonusForm, setBonusForm] = useState({ amount: '', userId: '', reason: '' });

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const res = await getExpensesAPI();
      setExpenses(res.data);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchBonuses = async () => {
    setLoadingBonuses(true);
    try {
      const [bRes, uRes] = await Promise.all([getBonusesAPI(), getUsersAPI()]);
      setBonuses(bRes.data);
      setTeamMembers(uRes.data.filter(u => u.role === 'TEAM' || u.role === 'ADMIN'));
    } catch (err) {
      toast.error('Failed to load bonuses');
    } finally {
      setLoadingBonuses(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchBonuses();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setSubmittingExpense(true);
    const loadingToast = toast.loading(t('syncing'));
    try {
      await createExpenseAPI({ ...expenseForm, amount: parseFloat(expenseForm.amount) });
      toast.success(t('saved_successfully'), { id: loadingToast });
      setShowExpenseModal(false);
      setExpenseForm({ amount: '', category: 'SERVER', description: '' });
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || t('error_general'), { id: loadingToast });
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('حذف هذه النفقة؟')) return;
    try {
      await deleteExpenseAPI(id);
      toast.success(t('client_removed'));
      fetchExpenses();
    } catch (err) {
      toast.error(t('error_general'));
    }
  };

  const handleCreateBonus = async (e) => {
    e.preventDefault();
    setSubmittingBonus(true);
    const loadingToast = toast.loading(t('syncing'));
    try {
      await createBonusAPI({ ...bonusForm, amount: parseFloat(bonusForm.amount) });
      toast.success(t('saved_successfully'), { id: loadingToast });
      setShowBonusModal(false);
      setBonusForm({ amount: '', userId: '', reason: '' });
      fetchBonuses();
    } catch (err) {
      toast.error(err.response?.data?.message || t('error_general'), { id: loadingToast });
    } finally {
      setSubmittingBonus(false);
    }
  };

  const handleDeleteBonus = async (id) => {
    if (!confirm('حذف هذه المكافأة؟')) return;
    try {
      await deleteBonusAPI(id);
      toast.success(t('client_removed'));
      fetchBonuses();
    } catch (err) {
      toast.error(t('error_general'));
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {t('add_manual_expense')} & {t('add_team_bonus')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">إدارة النفقات التشغيلية ومكافآت الفريق</p>
        </div>
        <button
          onClick={() => activeTab === 'expenses' ? setShowExpenseModal(true) : setShowBonusModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={18} />
          {activeTab === 'expenses' ? t('add_manual_expense') : t('add_team_bonus')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-rose-500/10 rounded-3xl p-6">
          <p className="text-xs font-black text-rose-500 uppercase tracking-wider mb-2">{t('add_manual_expense')}</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">${totalExpenses.toLocaleString()}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">{expenses.length} عملية</p>
        </div>
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-amber-500/10 rounded-3xl p-6">
          <p className="text-xs font-black text-amber-500 uppercase tracking-wider mb-2">{t('add_team_bonus')}</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">${totalBonuses.toLocaleString()}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">{bonuses.length} مكافأة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-[#0a0a0c] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Receipt size={16} />
          النفقات التشغيلية
        </button>
        <button
          onClick={() => setActiveTab('bonuses')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'bonuses' ? 'bg-white dark:bg-[#0a0a0c] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Gift size={16} />
          مكافآت الفريق
        </button>
      </div>

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
          {loadingExpenses ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={36} className="animate-spin text-brand-500" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-24">
              <Receipt size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <p className="font-bold text-slate-500">لا توجد نفقات مسجلة</p>
              <p className="text-sm text-slate-400 mt-1">اضغط على "إضافة نفقات تشغيلية" لإضافة أول نفقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-bold">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">التصنيف</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الوصف</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">المبلغ</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-black uppercase tracking-wider">{exp.category}</span>
                      </td>
                      <td className="px-8 py-5 text-slate-600 dark:text-slate-300 text-sm">{exp.description || '—'}</td>
                      <td className="px-8 py-5 text-lg font-black text-slate-800 dark:text-white">${exp.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-sm text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bonuses Table */}
      {activeTab === 'bonuses' && (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
          {loadingBonuses ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={36} className="animate-spin text-brand-500" />
            </div>
          ) : bonuses.length === 0 ? (
            <div className="text-center py-24">
              <Gift size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <p className="font-bold text-slate-500">لا توجد مكافآت مسجلة</p>
              <p className="text-sm text-slate-400 mt-1">اضغط على "إضافة مكافأة للفريق" لإضافة أول مكافأة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-bold">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">عضو الفريق</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">السبب</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">المبلغ</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {bonuses.map(bon => (
                    <tr key={bon.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <ShieldCheck size={16} className="text-amber-500" />
                          </div>
                          <span className="text-slate-800 dark:text-white">{bon.user?.firstName} {bon.user?.lastName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-600 dark:text-slate-300 text-sm">{bon.reason || '—'}</td>
                      <td className="px-8 py-5 text-lg font-black text-amber-500">${bon.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-sm text-slate-400">{new Date(bon.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleDeleteBonus(bon.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowExpenseModal(false)} />
          <div className="relative z-10 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('add_manual_expense')}</h2>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('expense_category')}</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('label_amount')}</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                  <input type="number" step="0.01" min="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required className="w-full pl-11 pr-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-black" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('expense_description')}</label>
                <textarea value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all">{t('cancel')}</button>
                <button type="submit" disabled={submittingExpense} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50">
                  {submittingExpense ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('add_manual_expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowBonusModal(false)} />
          <div className="relative z-10 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('add_team_bonus')}</h2>
              <button onClick={() => setShowBonusModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBonus} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('select_team_member')}</label>
                <select value={bonusForm.userId} onChange={e => setBonusForm({...bonusForm, userId: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold">
                  <option value="">اختر عضو...</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('label_amount')}</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input type="number" step="0.01" min="0" value={bonusForm.amount} onChange={e => setBonusForm({...bonusForm, amount: e.target.value})} required className="w-full pl-11 pr-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-black" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('bonus_reason')}</label>
                <textarea value={bonusForm.reason} onChange={e => setBonusForm({...bonusForm, reason: e.target.value})} rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBonusModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all">{t('cancel')}</button>
                <button type="submit" disabled={submittingBonus} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50">
                  {submittingBonus ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('add_team_bonus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
