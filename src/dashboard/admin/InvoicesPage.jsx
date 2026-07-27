import { useEffect, useState, useRef } from 'react';
import { getInvoicesAPI, createInvoiceAPI, updateInvoiceAPI, deleteInvoiceAPI, getClientsAPI, getExpensesAPI, createExpenseAPI, updateExpenseAPI, deleteExpenseAPI, getUsersAPI, getTeamDashboardStatsAPI } from '../../store/api';
import { Plus, X, Trash2, Receipt, Search, Loader2, DollarSign, FileText, Gift, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';
import useAuthStore from '../../store/authStore';
import html2pdf from 'html2pdf.js';
import UniversalFinancialTemplate from './components/UniversalFinancialTemplate';

const InvoicesPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [activeTab, setActiveTab] = useState('client');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamDues, setTeamDues] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Role Detection
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'OWNER';
  const isTeam = role === 'TEAM';
  
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
    invoiceNumber: '', clientId: '', service: '', amount: '', paymentMethod: '', paymentDetails: '', dueDate: '', currency: 'USD', exchangeRate: '' 
  });

  // Printing state
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [printingDue, setPrintingDue] = useState(null);
  const invoiceRef = useRef();
  const dueRef = useRef();

  const [dueForm, setDueForm] = useState({
    userId: '', description: '', amount: '', transferMethod: '', transferDetails: ''
  });

  const paymentMethods = ['PayPal', 'Payoneer', 'Barq', 'InstaPay', 'Bank Transfer', 'Vodafone Cash'];
  const transferMethods = ['Vodafone Cash', 'InstaPay', 'PayPal', 'Binance', 'Bank Transfer'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const calls = [];
      
      // All authenticated users can attempt to fetch invoices (backend handles filtering)
      calls.push(getInvoicesAPI().catch(() => ({ data: [] })));
      
      // Admin specific data
      if (isAdmin) {
        calls.push(getClientsAPI().catch(() => ({ data: [] })));
        calls.push(getUsersAPI().catch(() => ({ data: [] })));
      }
      
      // Both Admin and Team can fetch expenses/dues
      if (isAdmin || isTeam) {
        calls.push(getExpensesAPI().catch(() => ({ data: [] })));
      }
      
      const results = await Promise.all(calls);
      
      let resIdx = 0;
      const invRes = results[resIdx++];
      setInvoices(invRes.data?.data || invRes.data || []);

      if (isAdmin) {
        const cRes = results[resIdx++];
        const uRes = results[resIdx++];
        setClients(cRes.data?.data || cRes.data || []);
        setTeamMembers((uRes.data?.data || uRes.data || []).filter(u => u.role !== 'CLIENT'));
      }

      if (isAdmin || isTeam) {
        const eRes = results[resIdx++];
        const allDues = eRes.data?.data || eRes.data || [];
        
        if (isTeam) {
          // Fetch team dashboard stats for the cards and recent payments
          try {
            const statsRes = await getTeamDashboardStatsAPI();
            const statsData = statsRes.data?.stats || statsRes.data || {};
            setStats(statsData);
            
            // Merge sources: allDues (standard) and recentPayments (dashboard accurate)
            const rp = statsRes.data?.recentPayments || [];
            const merged = [...allDues];
            
            // Add any from recentPayments not in allDues (by description/amount or ID)
            rp.forEach(payment => {
              if (!merged.find(d => d.id === payment.id || (d.amount === payment.amount && d.description === payment.description))) {
                merged.push({
                   ...payment,
                   status: payment.status || 'SENT',
                   description: payment.description || 'Earnings'
                });
              }
            });
            
            // Sort by date/created_at descending
            setTeamDues(merged.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)));

          } catch (e) {
            console.error("Failed to fetch team stats:", e);
            setTeamDues(allDues);
          }
        } else {
          setTeamDues(allDues);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error(t('error_general'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isTeam) setActiveTab('team');
    fetchData(); 
  }, [role, isTeam]); // Re-run when roles are detected

  // Auto-fill Payment Details for Invoices
  useEffect(() => {
    if (invoiceForm.paymentMethod) {
      const method = invoiceForm.paymentMethod;
      let details = '';
      if (method === 'PayPal') details = localStorage.getItem('creziax_pay_paypal') || '';
      else if (method === 'Vodafone Cash') details = localStorage.getItem('creziax_pay_vodafone') || '';
      else if (method === 'InstaPay' || method === 'Barq') details = localStorage.getItem('creziax_pay_instapay') || '';
      else if (method === 'Bank Transfer') details = localStorage.getItem('creziax_pay_bank') || '';
      
      if (details) {
        setInvoiceForm(prev => ({ ...prev, paymentDetails: details }));
      }
    }
  }, [invoiceForm.paymentMethod]);

  // Auto-fill Transfer Details for Team Dues
  useEffect(() => {
    if (dueForm.transferMethod) {
      const method = dueForm.transferMethod;
      let details = '';
      if (method === 'Vodafone Cash') details = localStorage.getItem('creziax_pay_vodafone') || '';
      else if (method === 'InstaPay' || method === 'Barq') details = localStorage.getItem('creziax_pay_instapay') || '';
      else if (method === 'Bank Transfer') details = localStorage.getItem('creziax_pay_bank') || '';
      
      if (details) {
        setDueForm(prev => ({ ...prev, transferDetails: details }));
      }
    }
  }, [dueForm.transferMethod]);

  // --- CLIENT INVOICES LOGIC ---
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setSubmittingInvoice(true);
    setInvoiceError(null);
    const loadingToast = toast.loading(t('syncing') || 'Syncing...');
    try {
      await createInvoiceAPI({ 
        ...invoiceForm, 
        amount: Number(invoiceForm.amount), 
        exchangeRate: invoiceForm.exchangeRate ? parseFloat(invoiceForm.exchangeRate) : 1, 
        dueDate: invoiceForm.dueDate || undefined 
      });
      toast.success(t('confirm_issue') || 'Created successfully!', { id: loadingToast });
      addNotification(`${t('confirm_issue')}: ${invoiceForm.invoiceNumber}`, 'success');
      setShowInvoiceModal(false);
      setInvoiceForm({ invoiceNumber: '', clientId: '', service: '', amount: '', paymentMethod: '', paymentDetails: '', dueDate: '', currency: 'USD', exchangeRate: '' });
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
    const loadingToast = toast.loading('جاري التحديث...');
    try { 
      await updateInvoiceAPI(id, { status: newStatus }); 
      toast.success('تم التحديث بنجاح', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('فشل التحديث', { id: loadingToast });
    }
  };

  const handleDeleteInvoice = async (id, num) => {
    if (!confirm(`هل أنت متأكد من حذف الفاتورة ${num}؟`)) return;
    const loadingToast = toast.loading('جاري الحذف...');
    try { 
      await deleteInvoiceAPI(id); 
      toast.success('تم الحذف بنجاح', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('فشل الحذف', { id: loadingToast });
    }
  };

  const handleDownloadPDF = async (inv) => {
    console.log('Starting PDF generation for:', inv.invoiceNumber);
    const loadingToast = toast.loading('جاري تجهيز ملف الـ PDF...');
    try {
      setPrintingInvoice(inv);
      // Wait for React to render the component
      setTimeout(() => {
        console.log('React rendered template, capturing element...');
        const element = invoiceRef.current;
        if (!element) {
          console.error('Invoice element not found!');
          toast.error('خطأ داخلي: القالب غير موجود', { id: loadingToast });
          return;
        }
        
        const opt = {
          margin: 0,
          filename: `Invoice-${inv.invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            windowWidth: 800,
            width: 800
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
          setPrintingInvoice(null);
          toast.success('تم تحميل ملف الـ PDF بنجاح!', { id: loadingToast });
        }).catch(err => {
          console.error('PDF Error:', err);
          toast.error('فشل تجهيز الملف', { id: loadingToast });
          setPrintingInvoice(null);
        });
      }, 800);
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('خطأ في تحميل ملف الـ PDF', { id: loadingToast });
      setPrintingInvoice(null);
    }
  };

  // --- TEAM DUES LOGIC ---
  const handleCreateDue = async (e) => {
    e.preventDefault();
    setSubmittingDue(true);
    setDueError(null);
    const loadingToast = toast.loading('جاري حفظ المستحق...');
    try {
      await createExpenseAPI({ 
        amount: Number(dueForm.amount), 
        category: 'TEAM_DUE', 
        description: dueForm.description, 
        transferMethod: dueForm.transferMethod, 
        transferDetails: dueForm.transferDetails,
        userId: dueForm.userId 
      });
      toast.success('تم تسجيل المستحق بنجاح!', { id: loadingToast });
      addNotification(`تم تسجيل مستحق جديد بقيمة $${dueForm.amount}`, 'success');
      setShowDueModal(false);
      setDueForm({ userId: '', description: '', amount: '', transferMethod: '', transferDetails: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'خطأ في الحفظ';
      setDueError(msg);
      toast.error(msg, { id: loadingToast });
    } finally {
      setSubmittingDue(false);
    }
  };

  const toggleDueStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SENT' ? 'PENDING' : 'SENT';
    const loadingToast = toast.loading('جاري التحديث...');
    try { 
      await updateExpenseAPI(id, { status: newStatus }); 
      toast.success('تم التحديث بنجاح', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('فشل التحديث', { id: loadingToast });
    }
  };

  const handleDeleteDue = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستحق؟')) return;
    const loadingToast = toast.loading('جاري الحذف...');
    try { 
      await deleteExpenseAPI(id); 
      toast.success('تم الحذف بنجاح', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('فشل الحذف', { id: loadingToast });
    }
  };

  const handleDownloadDuePDF = async (due) => {
    console.log('Starting Team Due PDF generation...');
    const loadingToast = toast.loading('جاري تجهيز إيصال الدفع...');
    try {
      setPrintingDue(due);
      // Wait for React to render the component
      setTimeout(() => {
        console.log('React rendered template, capturing element...');
        const element = dueRef.current;
        if (!element) {
          console.error('Due element not found!');
          toast.error('خطأ داخلي: القالب غير موجود', { id: loadingToast });
          return;
        }

        const opt = {
          margin: 0,
          filename: `TeamDue-${due.id?.slice(0, 8)}.pdf`,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            windowWidth: 800,
            width: 800
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
          setPrintingDue(null);
          toast.success('تم تحميل الإيصال بنجاح!', { id: loadingToast });
        }).catch(err => {
          console.error('PDF Error:', err);
          toast.error('فشل تجهيز الإيصال', { id: loadingToast });
          setPrintingDue(null);
        });
      }, 800);
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('خطأ في تحميل الإيصال', { id: loadingToast });
      setPrintingDue(null);
    }
  };

  const filteredInvoices = (invoices || []).filter(inv => 
    (inv.invoiceNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (inv.service || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    `${inv.client?.user?.firstName || ''} ${inv.client?.user?.lastName || ''}`.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const filteredDues = (teamDues || []).filter(due => 
    (due.description || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    `${due.user?.firstName || ''} ${due.user?.lastName || ''}`.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            {isTeam ? 'السجل المالي للمستحقات' : t('finance_invoices_title', 'المالية والفواتير')}
            {isTeam && <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded-full border border-brand-500/20 font-black tracking-widest uppercase animate-pulse">v21.1-ELITE</span>}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">
            {isTeam ? 'متابعة الأرباح والتحويلات الخاصة بك' : t('finance_invoices_desc', 'إدارة التحصيل ومستحقات فريق العمل')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_records', "البحث في السجلات...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          {isAdmin && activeTab === 'client' && (
            <button onClick={() => setShowInvoiceModal(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
              <Plus size={18} />
              <span>{t('issue_invoice', 'إصدار فاتورة')}</span>
            </button>
          )}
          {isAdmin && activeTab === 'team' && (
            <button onClick={() => setShowDueModal(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
              <Plus size={18} />
              <span>{t('record_due', 'تسجيل مستحق')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Team Specific Summary Cards */}
      {isTeam && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm backdrop-blur-md relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('approved_earnings', 'إجمالي الأرباح المعتمدة')}</p>
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter relative z-10">
              ${stats.totalEarnings?.toLocaleString() || teamDues.filter(d => d.status === 'SENT').reduce((acc, d) => acc + (Number(d.amount) || 0), 0).toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 relative z-10">{t('payouts_completed', 'صافي المسحوبات التي تم تحويلها')}</p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm backdrop-blur-md relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('pending_dues_label', 'مستحقات قيد الانتظار')}</p>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter relative z-10">
              ${stats.pendingDues?.toLocaleString() || teamDues.filter(d => d.status !== 'SENT').reduce((acc, d) => acc + (Number(d.amount) || 0), 0).toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 relative z-10">{t('awaiting_transfer_msg', 'سيتم تحويلها قريباً بإذن الله')}</p>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-slate-900/40 text-white relative overflow-hidden flex flex-col justify-center border border-white/5">
            <CheckCircle size={100} className="absolute -right-6 -bottom-6 opacity-5" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{t('total_recorded_history', 'إجمالي عدد العمليات')}</p>
              <h3 className="text-3xl font-black tracking-tight">{teamDues.length} <span className="text-sm font-bold opacity-60">{isRTL ? 'عملية مالية' : 'Financial Transactions'}</span></h3>
              <div className="mt-4 flex gap-2">
                <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest">{t('live_sync')}</div>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">{t('verified')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isTeam && (
        <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'client' ? 'bg-white dark:bg-[#0a0a0c] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Receipt size={16} />
            {t('client_invoices_tab', 'فواتير العملاء (التحصيل)')}
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'team' ? 'bg-white dark:bg-[#0a0a0c] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Gift size={16} />
            {t('team_dues_tab', 'مستحقات الفريق (الإنفاق)')}
          </button>
        </div>
      )}

      {/* CLIENT INVOICES TAB */}
      {activeTab === 'client' && (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
              <p className="font-bold tracking-widest uppercase text-xs text-slate-400">{t('loading_dots', 'جاري التحميل...')}</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-24 md:py-32">
              <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
                <Receipt size={36} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('no_invoices', 'لا توجد فواتير')}</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">{t('no_invoices_desc', 'لا توجد فواتير تم إصدارها للعملاء حتى الآن.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto font-bold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('service_col', 'الخدمة / الوصف')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">{t('client_col', 'العميل')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('payment_method_col', 'طريقة الدفع')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('amount_col', 'المبلغ')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('status_col', 'الحالة')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">{t('actions', 'الإجراءات')}</th>
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
                        <div className="flex flex-col">
                          <div className="inline-flex items-center justify-start gap-1 text-lg font-black text-slate-800 dark:text-white" dir="ltr">
                            <span className="text-brand-500 text-sm">
                              {inv.currency !== 'USD' && inv.exchangeRate && inv.exchangeRate > 1 ? inv.currency : 'USD'}
                            </span>
                            {inv.currency !== 'USD' && inv.exchangeRate && inv.exchangeRate > 1 
                              ? Number(inv.amount * inv.exchangeRate) 
                              : Number(inv.amount)}
                          </div>
                          {inv.currency !== 'USD' && inv.exchangeRate && inv.exchangeRate > 1 && (
                            <div className="text-xs font-bold text-slate-400 mt-1" dir="ltr">
                              Base: {Number(inv.amount)} USD
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        {isAdmin ? (
                          <button 
                            onClick={() => toggleInvoiceStatus(inv.id, inv.status)}
                            className="transition-all active:scale-95"
                          >
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                              {inv.status === 'PAID' ? 'مكتمل PAID' : 'قيد الانتظار PENDING'}
                            </div>
                          </button>
                        ) : (
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                            {inv.status === 'PAID' ? 'مكتمل PAID' : 'قيد الانتظار PENDING'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDownloadPDF(inv)} className="p-3 text-brand-500 bg-brand-500/10 hover:bg-brand-500/20 rounded-2xl transition-all">
                            <FileText size={18} />
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)} className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all">
                              <Trash2 size={18} />
                            </button>
                          )}
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
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('empty_dues_title', 'دفتر المستحقات فارغ')}</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">{t('empty_dues_desc', 'سجل التزاماتك المالية ومستحقات فريق العمل هنا لسهولة التتبع.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto font-bold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('linked_member_col', 'العضو المرتبط')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('description_col', 'الوصف')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('amount_col', 'المبلغ')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('date_col', 'التاريخ')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('transfer_method_col', 'طريقة التحويل')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('status_col', 'الحالة')}</th>
                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">{t('actions', 'الإجراءات')}</th>
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
                          {Number(due.amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <p className="text-sm font-bold text-slate-400">
                          {due.date || due.created_at ? new Date(due.date || due.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: '2-digit', month: 'short' }) : '—'}
                        </p>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold font-mono">
                          {due.transferMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        {isAdmin ? (
                          <button 
                            onClick={() => toggleDueStatus(due.id, due.status)}
                            className="transition-all active:scale-95"
                          >
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border ${
                                due.status === 'SENT' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20' 
                                  : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${due.status === 'SENT' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                              {due.status === 'SENT' ? 'تم الإرسال SENT' : 'قيد المعالجة PENDING'}
                            </div>
                          </button>
                        ) : (
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] border ${
                                due.status === 'SENT' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20' 
                                  : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${due.status === 'SENT' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                              {due.status === 'SENT' ? 'تم الإرسال SENT' : 'قيد المعالجة PENDING'}
                            </div>
                        )}
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDownloadDuePDF(due)} className="p-3 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-2xl transition-all" title={t('download_receipt', 'تحميل إيصال الدفع')}>
                            <FileText size={18} />
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDeleteDue(due.id)} className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all">
                              <Trash2 size={18} />
                            </button>
                          )}
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
                <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('issue_new_invoice_title', 'إصدار فاتورة جديدة')}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">{t('issue_new_invoice_desc', 'توليد PDF عالي الجودة لعملائك')}</p>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-8 space-y-6">
              {invoiceError && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold">{invoiceError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('invoice_number_label', 'رقم الفاتورة (تلقائي/يدوي)')}</label>
                  <input value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono font-bold" placeholder="INV-2026-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('linked_client_label', 'العميل المرتبط')}</label>
                  <select value={invoiceForm.clientId} onChange={e => {
                    const selectedClient = clients.find(c => c.id === e.target.value);
                    const clientCurrency = selectedClient?.clientInfo?.preferredCurrency || 'USD';
                    setInvoiceForm({...invoiceForm, clientId: e.target.value, currency: clientCurrency});
                  }} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                    <option value="">{t('select_client_placeholder', 'اختر العميل المعني...')}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('service_type_label', 'نوع الخدمة / Service Type')}</label>
                <select 
                  value={invoiceForm.service} 
                  onChange={e => setInvoiceForm({...invoiceForm, service: e.target.value})} 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold appearance-none cursor-pointer"
                >
                  <option value="">{t('select_service_placeholder', 'اختر نوع الخدمة...')}</option>
                  <option value="Service Execution / تنفيذ خدمة">Service Execution / تنفيذ خدمة</option>
                  <option value="Business Management / إدارة أعمال">Business Management / إدارة أعمال</option>
                  <option value="Graphic Design / تصميم جرافيك">Graphic Design / تصميم جرافيك</option>
                  <option value="Voice Over / تعليق صوتي">Voice Over / تعليق صوتي</option>
                  <option value="Consultation / استشارة">Consultation / استشارة</option>
                  <option value="Online Service">{t('online_service', 'خدمات أونلاين')}</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('base_amount_usd', 'المبلغ الأساسي (USD)')}</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-500" />
                    <input type="number" step="0.01" min="0" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} required className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-black" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('parallel_currency_label', 'العملة الموازية (للفاتورة)')}</label>
                  <select value={invoiceForm.currency} onChange={e => {
                    const newCurrency = e.target.value;
                    // Reset exchange rate to 1 if switched back to USD
                    setInvoiceForm({
                      ...invoiceForm, 
                      currency: newCurrency, 
                      exchangeRate: newCurrency === 'USD' ? '' : invoiceForm.exchangeRate
                    });
                  }} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold appearance-none cursor-pointer">
                    <option value="USD">USD ($)</option>
                    <option value="EGP">EGP</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                    <option value="KWD">KWD</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('exchange_rate_label', 'سعر الصرف (Exchange Rate)')}</label>
                  <input type="number" step="0.0001" min="0" value={invoiceForm.exchangeRate} onChange={e => setInvoiceForm({...invoiceForm, exchangeRate: e.target.value})} disabled={invoiceForm.currency === 'USD'} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 disabled:opacity-50 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-black" placeholder={invoiceForm.currency === 'USD' ? '1.00' : "مثال: 50.5"} />
                </div>
              </div>

              {/* LIVE CALCULATION PREVIEW */}
              {invoiceForm.amount && invoiceForm.currency !== 'USD' && (
                <div className="p-5 rounded-2xl bg-brand-500/5 border border-brand-500/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('math_preview', 'معاينة الحساب الرياضي (Math Preview)')}</p>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {Number(invoiceForm.amount)} USD × {invoiceForm.exchangeRate || 1}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-brand-500 uppercase">{t('final_estimated_value', 'القيمة النهائية المقدرة')}</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">
                      {Number(Number(invoiceForm.amount) * (invoiceForm.exchangeRate || 1)).toLocaleString()} {invoiceForm.currency}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('payment_method_label', 'طريقة الدفع (Payment Method)')}</label>
                  <select value={invoiceForm.paymentMethod} onChange={e => setInvoiceForm({...invoiceForm, paymentMethod: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                    <option value="">{t('select_payment_gateway', 'اختر بوابة الدفع...')}</option>
                    {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
              </div>
              {/* Dynamic payment details field */}
              {invoiceForm.paymentMethod && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                    تفاصيل التحويل لـ {invoiceForm.paymentMethod} — <span className="text-brand-400">اختياري (بيظهر في الـ PDF)</span>
                  </label>
                  <textarea
                    value={invoiceForm.paymentDetails}
                    onChange={e => setInvoiceForm({...invoiceForm, paymentDetails: e.target.value})}
                    rows={2}
                    className="w-full px-5 py-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold resize-none placeholder:text-slate-400"
                    placeholder={`مثال: ${invoiceForm.paymentMethod === 'PayPal' ? 'PayPal: ahmed@gmail.com' : invoiceForm.paymentMethod === 'Vodafone Cash' || invoiceForm.paymentMethod === 'InstaPay' || invoiceForm.paymentMethod === 'Barq' ? `${invoiceForm.paymentMethod}: 010XXXXXXXX (اسم الحساب)` : invoiceForm.paymentMethod === 'Bank Transfer' ? 'بنك QNB | حساب: 12345 | IBAN: EG...' : `${invoiceForm.paymentMethod}: ادخل التفاصيل`}`}
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">💡 لو خليته فاضي، مش هيظهر أي تعليمات دفع في الـ PDF</p>
                </div>
              )}
              <div className="pt-4 flex gap-4 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">{t('cancel', 'إلغاء')}</button>
                <button type="submit" disabled={submittingInvoice} className="flex-1 py-4 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                  {submittingInvoice ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('confirm_issue_invoice', 'تأكيد وإصدار الفاتورة')}
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
                <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('record_financial_due_title', 'تسجيل مستحق مالي')}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">{t('record_financial_due_desc', 'توثيق رواتب ومستحقات فريق العمل')}</p>
              </div>
              <button onClick={() => setShowDueModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDue} className="p-8 space-y-6">
              {dueError && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold">{dueError}</div>}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('linked_member_label', 'العضو المرتبط')}</label>
                <select value={dueForm.userId} onChange={e => setDueForm({...dueForm, userId: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                  <option value="">{t('select_member_placeholder', 'اختر العضو من الفريق...')}</option>
                  {teamMembers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('due_description_label', 'وصف المستحق')}</label>
                <textarea value={dueForm.description} onChange={e => setDueForm({...dueForm, description: e.target.value})} required rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold resize-none" placeholder={t('due_description_placeholder', 'راتب شهر مارس / تنفيذ خدمة كذا...')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('amount_label', 'المبلغ المالي')}</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input type="number" step="0.01" min="0" value={dueForm.amount} onChange={e => setDueForm({...dueForm, amount: e.target.value})} required className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-black" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{t('transfer_method_label', 'طريقة التحويل (Transfer Method)')}</label>
                  <select value={dueForm.transferMethod} onChange={e => setDueForm({...dueForm, transferMethod: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none font-bold">
                    <option value="">{t('select_transfer_method_placeholder', 'كيف ستقوم بالدفع له...')}</option>
                    {transferMethods.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
              </div>
              {/* Dynamic transfer details field */}
              {dueForm.transferMethod && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                    تفاصيل التحويل لـ {dueForm.transferMethod} — <span className="text-amber-400">اختياري (سيبدأ في إيصال الـ PDF)</span>
                  </label>
                  <textarea
                    value={dueForm.transferDetails}
                    onChange={e => setDueForm({...dueForm, transferDetails: e.target.value})}
                    rows={2}
                    className="w-full px-5 py-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold resize-none placeholder:text-slate-400"
                    placeholder={`مثال: ${dueForm.transferMethod === 'Vodafone Cash' || dueForm.transferMethod === 'InstaPay' ? `تم التحويل على رقم: 010XXXXXXXX` : dueForm.transferMethod === 'Bank Transfer' ? 'رقم الحساب: 12345 | البنك: الأهلي' : `تفاصيل التحويل لـ ${dueForm.transferMethod}`}`}
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">💡 لإضافة توثيق ورقم مرجعي للتحويل في ملف الـ PDF.</p>
                </div>
              )}
              <div className="pt-4 flex gap-4 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowDueModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">{t('cancel', 'إلغاء')}</button>
                <button type="submit" disabled={submittingDue} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95">
                  {submittingDue ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('confirm_record_due', 'تسجيل وتوثيق المستحق')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* HIDDEN TEMPLATES FOR PDF GENERATION */}
      <div className="absolute top-[100%] left-[-9999px] opacity-0 pointer-events-none" style={{ width: '800px', backgroundColor: '#fff', margin: 0, padding: 0 }}>
        <div ref={invoiceRef} style={{ width: '800px', backgroundColor: '#fff', margin: 0, padding: 0 }}>
          {printingInvoice && <UniversalFinancialTemplate data={{
            document_type: 'INVOICE / PAYMENT REQUEST',
            transaction_id: printingInvoice.invoiceNumber,
            date: new Date(printingInvoice.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            party_label: 'BILLED TO',
            party_name: `${printingInvoice.client?.user?.firstName || ''} ${printingInvoice.client?.user?.lastName || ''}`.trim() || 'Valued Client',
            status_bg: printingInvoice.status === 'PAID' ? '#dcfce7' : '#fef3c7',
            status_color: printingInvoice.status === 'PAID' ? '#166534' : '#92400e',
            status_label: printingInvoice.status === 'PAID' ? 'PAID' : 'PENDING',
            service_name: printingInvoice.service ? printingInvoice.service.split(' / ')[0] : 'Professional Service',
            amount: Number(printingInvoice.amount),
            local_amount: printingInvoice.currency !== 'USD' && printingInvoice.exchangeRate ? Number(printingInvoice.amount * printingInvoice.exchangeRate) : null,
            currency: printingInvoice.currency || 'USD',
            payment_method: printingInvoice.paymentMethod,
            payment_details: printingInvoice.paymentDetails
          }} />}
        </div>
        <div ref={dueRef} style={{ width: '800px', backgroundColor: '#fff', margin: 0, padding: 0 }}>
          {printingDue && <UniversalFinancialTemplate data={{
            document_type: 'PAYMENT RECEIPT',
            transaction_id: printingDue.id?.slice(0, 8).toUpperCase(),
            date: new Date(printingDue.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            party_label: 'ISSUED TO / TEAM MEMBER',
            party_name: `${printingDue.user?.firstName || ''} ${printingDue.user?.lastName || ''}`.trim() || 'Team Member',
            status_bg: printingDue.status === 'SENT' ? '#dcfce7' : '#fef3c7',
            status_color: printingDue.status === 'SENT' ? '#166534' : '#92400e',
            status_label: printingDue.status === 'SENT' ? 'SENT' : 'PROCESSING',
            service_name: printingDue.description ? printingDue.description.split(' / ')[0] : 'Team Due',
            amount: Number(printingDue.amount),
            payment_method: printingDue.transferMethod,
            payment_details: printingDue.transferDetails
          }} />}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
