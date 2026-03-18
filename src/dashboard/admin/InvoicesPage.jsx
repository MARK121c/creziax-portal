import { useEffect, useState } from 'react';
import { getInvoicesAPI, createInvoiceAPI, updateInvoiceAPI, deleteInvoiceAPI, getClientsAPI, downloadInvoicePDFAPI, getExpensesAPI, createExpenseAPI, updateExpenseAPI, deleteExpenseAPI, getUsersAPI } from '../../store/api';
import { Plus, X, Trash2, Receipt, Search, Loader2, DollarSign, FileText, Gift, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const InvoicesPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('client');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamDues, setTeamDues] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Forms
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);
  
  const [submittingDue, setSubmittingDue] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [dueError, setDueError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [invoiceForm, setInvoiceForm] = useState({ 
    invoiceNumber: '', clientId: '', service: '', amount: '', paymentMethod: '', dueDate: '' 
  });

  const [dueForm, setDueForm] = useState({
    userId: '', description: '', amount: '', transferMethod: ''
  });

  const paymentMethods = ['PayPal', 'Payoneer', 'Barq', 'InstaPay', 'Bank Transfer', 'Vodafone Cash'];
  const transferMethods = ['Vodafone Cash', 'InstaPay', 'PayPal', 'Binance', 'Bank Transfer'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iRes, cRes, eRes, uRes] = await Promise.all([
        getInvoicesAPI(), 
        getClientsAPI(), 
        getExpensesAPI().catch(() => ({ data: [] })),
        getUsersAPI().catch(() => ({ data: [] }))
      ]);
      setInvoices(iRes.data);
      setClients(cRes.data);
      setTeamDues(eRes.data);
      // Filter out clients from team dropdown
      setTeamMembers(uRes.data?.filter(u => u.role !== 'CLIENT') || []);
    } catch (err) {
      toast.error(t('loading') || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- CLIENT INVOICES LOGIC ---
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setSubmittingInvoice(true);
    setInvoiceError(null);
    const loadingToast = toast.loading(t('syncing') || 'Syncing...');
    try {
      await createInvoiceAPI({ ...invoiceForm, amount: parseFloat(invoiceForm.amount), dueDate: invoiceForm.dueDate || undefined });
      toast.success(t('confirm_issue') || 'Created successfully!', { id: loadingToast });
      addNotification(`${t('confirm_issue')}: ${invoiceForm.invoiceNumber}`, 'success');
      setShowInvoiceModal(false);
      setInvoiceForm({ invoiceNumber: '', clientId: '', service: '', amount: '', paymentMethod: '', dueDate: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || t('loading');
      setInvoiceError(msg);
      toast.error(msg, { id: loadingToast });
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const toggleInvoiceStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    const loadingToast = toast.loading('Updating...');
    try { 
      await updateInvoiceAPI(id, { status: newStatus }); 
      toast.success('Updated successfully', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Failed to update', { id: loadingToast });
    }
  };

  const handleDeleteInvoice = async (id, num) => {
    if (!confirm(`Are you sure you want to delete Invoice ${num}?`)) return;
    const loadingToast = toast.loading('Deleting...');
    try { 
      await deleteInvoiceAPI(id); 
      toast.success('Deleted successfully', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Failed to delete', { id: loadingToast });
    }
  };

  const handleDownloadPDF = async (id, invoiceNumber) => {
    const loadingToast = toast.loading('Generating premium PDF...');
    try {
      const response = await downloadInvoicePDFAPI(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('PDF Downloaded!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: loadingToast });
    }
  };

  // --- TEAM DUES LOGIC ---
  const handleCreateDue = async (e) => {
    e.preventDefault();
    setSubmittingDue(true);
    setDueError(null);
    const loadingToast = toast.loading('Syncing...');
    try {
      await createExpenseAPI({ 
        amount: parseFloat(dueForm.amount), 
        category: 'TEAM_DUE', 
        description: dueForm.description, 
        transferMethod: dueForm.transferMethod, 
        userId: dueForm.userId 
      });
      toast.success('Due created successfully!', { id: loadingToast });
      addNotification(`New Team Due created for $${dueForm.amount}`, 'success');
      setShowDueModal(false);
      setDueForm({ userId: '', description: '', amount: '', transferMethod: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving due';
      setDueError(msg);
      toast.error(msg, { id: loadingToast });
    } finally {
      setSubmittingDue(false);
    }
  };

  const toggleDueStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SENT' ? 'PENDING' : 'SENT';
    const loadingToast = toast.loading('Updating...');
    try { 
      await updateExpenseAPI(id, { status: newStatus }); 
      toast.success('Updated successfully', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Failed to update', { id: loadingToast });
    }
  };

  const handleDeleteDue = async (id) => {
    if (!confirm('Are you sure you want to delete this Team Due?')) return;
    const loadingToast = toast.loading('Deleting...');
    try { 
      await deleteExpenseAPI(id); 
      toast.success('Deleted successfully', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Failed to delete', { id: loadingToast });
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${inv.client?.user?.firstName} ${inv.client?.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDues = teamDues.filter(due => 
    due.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${due.user?.firstName} ${due.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">المالية والفواتير</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">إدارة التحصيل ومستحقات فريق العمل</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="البحث في السجلات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          {activeTab === 'client' && (
            <button onClick={() => setShowInvoiceModal(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
              <Plus size={18} />
              <span>إصدار فاتورة</span>
            </button>
          )}
          {activeTab === 'team' && (
            <button onClick={() => setShowDueModal(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
              <Plus size={18} />
              <span>تسجيل مستحق</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'client' ? 'bg-white dark:bg-[#0a0a0c] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Receipt size={16} />
          فواتير العملاء (التحصيل)
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'team' ? 'bg-white dark:bg-[#0a0a0c] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Gift size={16} />
          مستحقات الفريق (الإنفاق)
        </button>
      </div>

      {/* CLIENT INVOICES TAB */}
      {activeTab === 'client' && (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
              <p className="font-bold tracking-widest uppercase text-xs text-slate-400">جاري التحميل...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-24 md:py-32">
              <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
                <Receipt size={36} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">لا توجد فواتير</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">لا توجد فواتير تم إصدارها للعملاء حتى الآن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto font-bold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الخدمة / الوصف</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">العميل</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">طريقة الدفع</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">المبلغ</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الحالة</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
                            <Receipt size={18} />
                          </div>
                          <div>
                            <p className="text-sm md:text-base font-black text-slate-800 dark:text-white">{inv.service}</p>
                            <p className="text-[11px] font-bold text-brand-400 mt-1 uppercase tracking-widest">{inv.invoiceNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 hidden md:table-cell">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.client?.user?.firstName} {inv.client?.user?.lastName}</p>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold font-mono">
                          {inv.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <div className="inline-flex items-center gap-1 text-lg font-black text-slate-800 dark:text-white">
                          <span className="text-brand-500 text-sm">$</span>
                          {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <button 
                          onClick={() => toggleInvoiceStatus(inv.id, inv.status)}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border ${
                            inv.status === 'PAID' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20' 
                              : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                          {inv.status === 'PAID' ? 'مكتمل PAID' : 'قيد الانتظار PENDING'}
                        </button>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDownloadPDF(inv.id, inv.invoiceNumber)} className="p-3 text-brand-500 bg-brand-500/10 hover:bg-brand-500/20 rounded-2xl transition-all">
                            <FileText size={18} />
                          </button>
                          <button onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)} className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TEAM DUES TAB */}
      {activeTab === 'team' && (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 size={44} className="animate-spin text-amber-500 mb-6" />
              <p className="font-bold tracking-widest uppercase text-xs text-slate-400">جاري التحميل...</p>
            </div>
          ) : filteredDues.length === 0 ? (
            <div className="text-center py-24 md:py-32">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-amber-100 dark:border-amber-500/20">
                <Gift size={36} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">دفتر المستحقات فارغ</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">سجل التزاماتك المالية ومستحقات فريق العمل هنا لسهولة التتبع.</p>
            </div>
          ) : (
            <div className="overflow-x-auto font-bold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">العضو المرتبط</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الوصف</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">المبلغ</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">طريقة التحويل</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الحالة</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredDues.map(due => (
                    <tr key={due.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <div className="flex items-center gap-4">
                          {due.user?.avatarUrl ? (
                            <img src={due.user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-2xl object-cover border-2 border-slate-100 dark:border-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold flex-shrink-0">
                              {due.user?.firstName?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-sm md:text-base font-black text-slate-800 dark:text-white">
                            {due.user ? `${due.user.firstName} ${due.user.lastName}` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{due.description || '—'}</p>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <div className="inline-flex items-center gap-1 text-lg font-black text-slate-800 dark:text-white">
                          <span className="text-amber-500 text-sm">$</span>
                          {due.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold font-mono">
                          {due.transferMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <button 
                          onClick={() => toggleDueStatus(due.id, due.status)}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border ${
                            due.status === 'SENT' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20' 
                              : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${due.status === 'SENT' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                          {due.status === 'SENT' ? 'تم الإرسال SENT' : 'قيد المعالجة PENDING'}
                        </button>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDeleteDue(due.id)} className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={() => setShowInvoiceModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01] sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">إصدار فاتورة جديدة</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">توليد PDF عالي الجودة لعملائك</p>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-8 space-y-6">
              {invoiceError && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold">{invoiceError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">رقم الفاتورة (تلقائي/يدوي)</label>
                  <input value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono font-bold" placeholder="INV-2026-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">العميل المرتبط</label>
                  <select value={invoiceForm.clientId} onChange={e => setInvoiceForm({...invoiceForm, clientId: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                    <option value="">اختر العميل المعني...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">الخدمة / الوصف</label>
                <textarea value={invoiceForm.service} onChange={e => setInvoiceForm({...invoiceForm, service: e.target.value})} required rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold resize-none" placeholder="مثال: إدارة السوشيال ميديا لشهر مارس..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">المبلغ (بـ USD)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <input type="number" step="0.01" min="0" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} required className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-black" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">طريقة الدفع (Payment Method)</label>
                  <select value={invoiceForm.paymentMethod} onChange={e => setInvoiceForm({...invoiceForm, paymentMethod: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                    <option value="">اختر بوابة الدفع...</option>
                    {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">إلغاء</button>
                <button type="submit" disabled={submittingInvoice} className="flex-1 py-4 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                  {submittingInvoice ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'تأكيد وإصدار الفاتورة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DUE MODAL (Team Dues) */}
      {showDueModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={() => setShowDueModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01] sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">تسجيل مستحق مالي</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">توثيق رواتب ومستحقات فريق العمل</p>
              </div>
              <button onClick={() => setShowDueModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDue} className="p-8 space-y-6">
              {dueError && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold">{dueError}</div>}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">العضو المرتبط</label>
                <select value={dueForm.userId} onChange={e => setDueForm({...dueForm, userId: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                  <option value="">اختر العضو من الفريق...</option>
                  {teamMembers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">وصف المستحق</label>
                <textarea value={dueForm.description} onChange={e => setDueForm({...dueForm, description: e.target.value})} required rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold resize-none" placeholder="مثال: راتب شهر مارس / حساب فيديو كذا..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">المبلغ المالي</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input type="number" step="0.01" min="0" value={dueForm.amount} onChange={e => setDueForm({...dueForm, amount: e.target.value})} required className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-black" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">طريقة التحويل (Transfer Method)</label>
                  <select value={dueForm.transferMethod} onChange={e => setDueForm({...dueForm, transferMethod: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                    <option value="">كيف ستقوم بالدفع له...</option>
                    {transferMethods.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowDueModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">إلغاء</button>
                <button type="submit" disabled={submittingDue} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95">
                  {submittingDue ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'تسجيل وتوثيق المستحق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
