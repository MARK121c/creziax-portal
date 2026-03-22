import { useEffect, useState, useRef, useCallback } from 'react';
import { getProjectsAPI, getInvoicesAPI, updateInvoiceAPI } from '../../store/api';
import { FolderKanban, Receipt, CheckCircle2, PlayCircle, Loader2, CreditCard, Briefcase, DollarSign, Clock, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import useAuthStore from '../../store/authStore';

const WHATSAPP_NUMBER = '201069804568';

const InvoiceStatusBadge = ({ status }) => {
  if (status === 'PAID') return (
    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20">
      مدفوعة ✓
    </span>
  );
  if (status === 'PENDING') return (
    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20">
      قيد الانتظار ⏳
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
      const [pRes, iRes] = await Promise.all([getProjectsAPI(), getInvoicesAPI()]);
      const myProjects = pRes.data?.data || pRes.data || [];
      const myInvoices = iRes.data?.data || iRes.data || [];
      
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
              doneTasks += ph.tasks.filter(t => t.status === 'COMPLETED').length;
            }
          });
        }
      });

      // Calculate Contract End Date based on latest paid invoice
      const activeContracts = invoicesList.filter(inv => inv && inv.status === 'PAID' && inv.contractEnd);
      let daysLeft = 0;
      if (activeContracts.length > 0) {
        const latestDate = new Date(Math.max(...activeContracts.map(c => new Date(c.contractEnd))));
        const diff = latestDate - new Date();
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
    socket.on('task_updated', () => fetchData(true));
    socket.on('workspace_updated', () => fetchData(true));
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

  const getProgressPercentage = (stage) => {
    if (stage === 4) return 100;
    if (stage === 3) return 85;
    if (stage === 2) return 50;
    return 15;
  };

  const getTimelineStage = (status) => {
    switch(status) {
      case 'CHANNEL_SETUP': case 'SCRIPT': return 1;
      case 'EDITING': case 'THUMBNAIL': case 'IN_PROGRESS': return 2;
      case 'PUBLISHING': return 3;
      case 'COMPLETED': return 4;
      default: return 1;
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. Hero Section */}
      <div className="flex flex-col gap-5 md:gap-6 py-10 md:py-16 transform transition-all duration-1000 ease-out translate-y-0 opacity-100">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes textReveal { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        `}} />
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-800 dark:text-white tracking-tighter leading-[1.1] relative z-10">
          <span className="block opacity-0" style={{ animation: 'textReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards' }}>
            {isRTL ? 'أهلاً بك في عالم Creziax' : 'Welcome to the world of Creziax'}
          </span>
          <span className="block mt-2 opacity-0 text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600 dark:from-brand-400 dark:via-indigo-400 dark:to-purple-500 bg-300% animate-gradient" style={{ animation: 'textReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards' }}>
            {clientName}
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xl md:text-3xl mt-2 max-w-4xl leading-relaxed opacity-0" style={{ animation: 'textReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards' }}>
          {isRTL ? 'رؤيتك تتحول الآن إلى واقع' : 'Your vision is now becoming a reality'}
        </p>
      </div>

      {loading && projectData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={50} className="animate-spin text-brand-500 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('syncing_workspace', 'جاري المزامنة...')}</p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* 2. Elite 4-Card Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] p-5 shadow-sm relative overflow-hidden group">
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center"><Briefcase size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{isRTL ? 'القنوات المدارة' : 'Managed Channels'}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{projectData.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] p-5 shadow-sm relative overflow-hidden group">
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center"><Receipt size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{isRTL ? 'حالة الفواتير' : 'Invoices Status'}</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white leading-none flex items-center gap-2">
                    <span className="text-emerald-500">{stats.paidInvoices} {isRTL ? 'مدفوعة' : 'Paid'}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-amber-500">{stats.pendingInvoices} {isRTL ? 'معلقة' : 'Pend'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] p-5 shadow-sm relative overflow-hidden group">
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center"><CheckCircle2 size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{isRTL ? 'فيديوهات منجزة' : 'Completed Videos'}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats.done}</p>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-[#0a0a0c]/40 border rounded-[1.5rem] p-5 shadow-sm relative overflow-hidden transition-colors ${stats.daysLeft <= 10 ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-200 dark:border-white/5'}`}>
               <div className="flex flex-col gap-2">
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.daysLeft <= 10 ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}><Clock size={18} /></div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{isRTL ? 'مدة العقد المتبقية' : 'Contract Duration'}</p>
                   <div className="flex items-center gap-2">
                     <p className={`text-2xl font-black leading-none ${stats.daysLeft <= 10 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>{stats.daysLeft} {isRTL ? 'يوم' : 'Days'}</p>
                     {stats.daysLeft <= 10 && <span className="px-2 py-0.5 rounded-md bg-rose-500 text-[8px] text-white font-black animate-pulse">{isRTL ? 'يرجى التجديد' : 'RENEWAL'}</span>}
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* 3. Projects & Deep Timeline */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20"><Briefcase size={20} /></div>
                {isRTL ? 'المشاريع والجدول الزمني العميق' : 'Projects & Deep Timeline'}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {projectData.map(p => (
                <div key={p.id} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">{p.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.phases?.length || 0} PHASES / MONTHS</p>
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                    {p.phases?.map(ph => (
                      <div key={ph.id} className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{ph.name}</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {ph.tasks?.map(task => {
                            const currentStage = getTimelineStage(task.status);
                            return (
                              <div key={task.id} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl p-6">
                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">{task.title}</p>
                                <div className="relative pt-2 pb-2">
                                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full mb-4 overflow-hidden relative">
                                     <div 
                                      className={`h-full transition-all duration-1000 ease-out rounded-full ${currentStage === 4 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-brand-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}
                                      style={{ width: `${getProgressPercentage(currentStage)}%` }}
                                     ></div>
                                  </div>
                                  <div className="relative flex justify-between">
                                    {['Rec', 'Proc', 'Rev', 'Del'].map((label, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border-2 ${currentStage >= idx + 1 ? 'border-brand-500 bg-brand-500' : 'border-slate-200 dark:border-white/10'}`}></div>
                                        <span className={`text-[8px] font-black uppercase tracking-tighter ${currentStage >= idx + 1 ? 'text-brand-500' : 'text-slate-400'}`}>{label}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-6">{t('invoice_number')}</th>
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-6">{t('total_due')}</th>
                      <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-6">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                        <td className="px-10 py-7 font-black text-slate-800 dark:text-white font-mono uppercase text-sm">#{inv.invoiceNumber}</td>
                        <td className="px-10 py-7 text-lg font-black text-slate-800 dark:text-white tracking-tighter">
                          {inv.currency !== 'USD' && inv.exchangeRate ? `${Number(inv.amount * inv.exchangeRate).toLocaleString()} ${inv.currency}` : `$${inv.amount?.toLocaleString()}`}
                        </td>
                        <td className="px-10 py-7 text-right">
                          {inv.status === 'PAID' || inv.status === 'PENDING' ? <InvoiceStatusBadge status={inv.status} /> : (
                            <button onClick={() => handlePayNow(inv)} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-600/10 flex items-center gap-2 ml-auto">
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
