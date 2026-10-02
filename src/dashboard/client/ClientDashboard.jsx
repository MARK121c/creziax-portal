import { useEffect, useState, useRef, useCallback } from 'react';
import { getProjectsAPI, getInvoicesAPI, updateInvoiceAPI, getContractsAPI } from '../../store/api';
import { 
  FolderKanban, 
  Receipt, 
  CheckCircle2, 
  PlayCircle, 
  Loader2, 
  CreditCard, 
  Briefcase, 
  DollarSign, 
  Clock, 
  ArrowUpRight,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import useAuthStore from '../../store/authStore';

const WHATSAPP_NUMBER = '201069804568';

const InvoiceStatusBadge = ({ status }) => {
  if (status === 'PAID') return (
    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20">
      مكتملة ✓
    </span>
  );
  if (status === 'PENDING') return (
    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20">
      قيد المعالجة ⏳
    </span>
  );
  return null;
};

const ClientDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuthStore();
  const clientName = user?.firstName || 'Valued Client';

  const [projectData, setProjectData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvoice, setProcessingInvoice] = useState(null);
  const [stats, setStats] = useState({
    done: 0,
    pending: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    daysLeft: 0,
    totalValue: 0
  });

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [pRes, iRes, cRes] = await Promise.all([getProjectsAPI(), getInvoicesAPI(), getContractsAPI()]);
      const myProjects = pRes.data?.data || pRes.data || [];
      const myInvoices = iRes.data?.data || iRes.data || [];
      const myContracts = cRes.data?.data || cRes.data || [];
      
      setProjectData(myProjects);
      setInvoices(myInvoices);

      const invoicesList = Array.isArray(myInvoices) ? myInvoices : [];
      let totalTasks = 0;
      let doneTasks = 0;
      
      myProjects.forEach(p => {
        if (p.phases) {
          p.phases.forEach(ph => {
            if (ph.tasks) {
              totalTasks += ph.tasks.length;
              doneTasks += ph.tasks.filter(t => ['DELIVERED', 'COMPLETED'].includes(t.status)).length;
            }
          });
        }
      });

      // Calculate Contract End Date based on actual Contracts
      let daysLeft = 0;
      let targetEndDate = null;

      if (myContracts.length > 0) {
        // Find latest contract with an end date
        const datedContracts = myContracts.filter(c => c.endDate).sort((a,b) => new Date(b.endDate) - new Date(a.endDate));
        if (datedContracts.length > 0) {
          targetEndDate = new Date(datedContracts[0].endDate);
        }
      }

      if (!targetEndDate && user?.clientInfo?.contractEnd) {
        targetEndDate = new Date(user.clientInfo.contractEnd);
      }

      if (targetEndDate && !isNaN(targetEndDate.getTime())) {
        const diff = targetEndDate - new Date();
        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      setStats({
        done: doneTasks,
        pending: totalTasks - doneTasks,
        paidInvoices: invoicesList.filter(inv => inv && inv.status === 'PAID').length,
        pendingInvoices: invoicesList.filter(inv => inv && inv.status !== 'PAID').length,
        daysLeft: daysLeft,
        totalValue: invoicesList.reduce((acc, inv) => acc + (inv.amount || 0), 0)
      });

    } catch (err) {
      console.error('Masterpiece Sync Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', { transports: ['websocket'] });
    socket.on('task_updated', (data) => {
      fetchData(true);
      if (data?.userId !== user?.id) {
        toast.success(t('video_status_updated'));
      }
    });
    socket.on('workspace_updated', () => {
      fetchData(true);
      toast.info(t('syncing'));
    });
    socket.on('new_ticket', () => fetchData(true));
    return () => socket.disconnect();
  }, [fetchData]);

  const handlePayNow = async (inv) => {
    if (processingInvoice === inv.id) return;
    setProcessingInvoice(inv.id);
    try {
      await updateInvoiceAPI(inv.id, { status: 'PENDING' });
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'PENDING' } : i));
      toast.success(isRTL ? 'تم تسجيل طلب الدفع، جاري فتح واتساب...' : 'Payment request logged, opening WhatsApp...');
    } catch (err) {
      console.warn('Could not update invoice status:', err);
    } finally {
      setProcessingInvoice(null);
    }
    const amount = inv.currency !== 'USD' && inv.exchangeRate && inv.exchangeRate > 1
      ? `${Number(inv.amount * inv.exchangeRate).toLocaleString()} ${inv.currency}`
      : `$${inv.amount?.toLocaleString()} USD`;
    const msg = isRTL 
      ? `أريد دفع الفاتورة رقم ${inv.invoiceNumber}، قيمتها ${amount}. يرجى تزويدي ببيانات التحويل.`
      : `I'd like to pay invoice #${inv.invoiceNumber} for ${amount}. Please share transfer details.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const totalDue = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.amount || 0), 0);

  const getProgressPercentage = (status) => {
    if (['COMPLETED', 'DELIVERED'].includes(status)) return 100;
    if (status === 'REVIEW') return 80;
    return 30; // In Progress
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. Hero Section */}
      <div className="flex flex-col gap-5 md:gap-6 py-6 sm:py-10 md:py-16 transform transition-all duration-1000 ease-out translate-y-0 opacity-100">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes textReveal { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        `}} />
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-slate-800 dark:text-white tracking-tighter leading-[1.1] relative z-10">
          <span className="block opacity-0" style={{ animation: 'textReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards' }}>
            {isRTL ? 'أهلاً بك في عالم Creziax' : 'Welcome to the world of Creziax'}
          </span>
          <span className="block mt-2 opacity-0 text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600 dark:from-brand-400 dark:via-indigo-400 dark:to-purple-500 bg-300% animate-gradient" style={{ animation: 'textReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards' }}>
            {clientName}
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-xl md:text-3xl mt-2 max-w-4xl leading-relaxed opacity-0" style={{ animation: 'textReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards' }}>
          {isRTL ? 'رؤيتك تتحول الآن إلى واقع' : 'Your vision is now becoming a reality'}
        </p>
      </div>

      {loading && projectData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={50} className="animate-spin text-brand-500 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('syncing_workspace', 'جاري المزامنة...')}</p>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-12">
          
          {/* Contract Expiration Alert (7-Day Proactive Warning) */}
          {stats.daysLeft <= 7 && (
            <div className="relative group bg-rose-500/10 border border-rose-500/30 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 overflow-hidden animate-in slide-in-from-top-4 duration-500">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700 hidden md:block">
                <ShieldAlert size={120} className="text-rose-500" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 text-right">
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-black text-rose-500 uppercase tracking-tight">
                    {stats.daysLeft === 0 ? (isRTL ? 'لقد انتهى عقدك!' : 'Your contract has expired!') : (isRTL ? 'تنبيه: اقترب موعد انتهاء العقد' : 'Alert: Contract Expiration Soon')}
                  </h2>
                  <p className="text-xs md:text-sm font-bold text-rose-500/70 max-w-2xl">
                    {isRTL 
                      ? `باقٍ ${stats.daysLeft} أيام فقط على انتهاء فترة التعاقد. يرجى التواصل مع الإدارة لضمان استمرارية العمل دون انقطاع.`
                      : `Only ${stats.daysLeft} days remaining. Contact management now to ensure uninterrupted service flow.`}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(isRTL ? 'أريد تجديد العقد الخاص بي.' : 'I want to renew my contract.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto px-6 py-3 md:py-4 bg-rose-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl shadow-rose-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  {isRTL ? 'تجديد العقد الآن' : 'RENEW CONTRACT NOW'}
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            <div className="bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none font-bold group hover:-translate-y-1 transition-all overflow-hidden relative">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-500/10 text-brand-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm"><Briefcase size={20} /></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isRTL ? 'القنوات المدارة' : 'Managed Channels'}</p>
               <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{projectData.length}</h3>
            </div>

            <div className="bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none font-bold group hover:-translate-y-1 transition-all overflow-hidden relative">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 text-indigo-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm"><Receipt size={20} /></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isRTL ? 'حالة الفواتير' : 'Invoices Status'}</p>
               <div className="flex items-center gap-2">
                 <span className="text-xl md:text-lg font-black text-emerald-500">{stats.paidInvoices}</span>
                 <span className="w-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full" />
                 <span className="text-xl md:text-lg font-black text-amber-500">{stats.pendingInvoices}</span>
               </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none font-bold group hover:-translate-y-1 transition-all overflow-hidden relative">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm"><CheckCircle2 size={20} /></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isRTL ? 'فيديوهات منجزة' : 'Completed Videos'}</p>
               <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{stats.done}</h3>
            </div>

            <div className={`rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl font-bold group hover:-translate-y-1 transition-all overflow-hidden relative border ${stats.daysLeft <= 10 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white dark:bg-[#0a0a0c]/60 border-slate-200 dark:border-white/5'}`}>
               <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm ${stats.daysLeft <= 10 ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}><Clock size={20} /></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isRTL ? 'نهاية العقد' : 'Contract Expiry'}</p>
               <div className="flex items-center gap-3">
                 <h3 className={`text-2xl md:text-3xl font-black tracking-tighter ${stats.daysLeft <= 10 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>{stats.daysLeft} {isRTL ? 'يوم' : 'Days'}</h3>
                 {stats.daysLeft <= 10 && <span className="px-2 md:px-3 py-1 bg-rose-500/20 text-rose-500 rounded-full text-[8px] font-black animate-pulse">RENEW NOW</span>}
               </div>
            </div>
          </div>

          {/* 3. Projects Quick Access */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20"><Briefcase size={20} /></div>
                {isRTL ? 'المشاريع النشطة' : 'Active Projects'}
              </h2>
              <Link to="/client/projects" className="text-xs font-black text-brand-500 uppercase tracking-widest hover:underline">
                {isRTL ? 'عرض التفاصيل ←' : 'View Details ←'}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectData.slice(0, 4).map(p => (
                <Link key={p.id} to="/client/projects" className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 hover:border-brand-500/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-brand-500 transition-colors">{p.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {p.phases?.length || 0} {isRTL ? 'شهور إنتاج' : 'Production Months'}
                      </p>
                    </div>
                    <ArrowUpRight size={20} className="text-slate-300 dark:text-white/10 group-hover:text-brand-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 4. Invoices */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><Receipt size={20} /></div>
                {isRTL ? 'الفواتير والمدفوعات' : 'Invoices & Payments'}
              </h2>
            </div>
            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                      <th className="text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 md:px-10 py-4 md:py-6">{t('invoice_number')}</th>
                      <th className="text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 md:px-10 py-4 md:py-6">{t('total_due')}</th>
                      <th className="text-right text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 md:px-10 py-4 md:py-6">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                        <td className="px-4 md:px-10 py-5 md:py-7 font-black text-slate-800 dark:text-white font-mono uppercase text-xs md:text-sm">#{inv.invoiceNumber}</td>
                        <td className="px-4 md:px-10 py-5 md:py-7 text-base md:text-lg font-black text-slate-800 dark:text-white tracking-tighter">
                          {inv.currency !== 'USD' && inv.exchangeRate ? `${Number(inv.amount * inv.exchangeRate).toLocaleString()} ${inv.currency}` : `$${inv.amount?.toLocaleString()}`}
                        </td>
                        <td className="px-4 md:px-10 py-5 md:py-7 text-right">
                          {inv.status === 'PAID' || inv.status === 'PENDING' ? <InvoiceStatusBadge status={inv.status} /> : (
                            <button onClick={() => handlePayNow(inv)} className="px-3 md:px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-600/10 flex items-center gap-1.5 md:gap-2 ml-auto">
                              {processingInvoice === inv.id && <Loader2 size={12} className="animate-spin" />} {t('pay')} 💬
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
