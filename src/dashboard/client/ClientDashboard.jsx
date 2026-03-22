import { useEffect, useState } from 'react';
import { getProjectsAPI, getInvoicesAPI, updateInvoiceAPI } from '../../store/api';
import { FolderKanban, Receipt, TrendingUp, ArrowUpRight, Loader2, CreditCard, Briefcase, DollarSign, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const WHATSAPP_NUMBER = '201069804568';

// Map backend statuses to 4 visual stages for the client timeline
const getTimelineStage = (status) => {
  switch(status) {
    case 'CHANNEL_SETUP':
    case 'SCRIPT':
      return 1; // Stage 1: Received
    case 'EDITING':
    case 'THUMBNAIL':
    case 'IN_PROGRESS':
      return 2; // Stage 2: In Progress
    case 'PUBLISHING':
      return 3; // Stage 3: Final Review
    case 'COMPLETED':
      return 4; // Stage 4: Delivered
    default:
      return 1;
  }
};

const statusConfig = {
  CHANNEL_SETUP: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
  EDITING: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
  IN_PROGRESS: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
  THUMBNAIL: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20' },
  SCRIPT: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-100 dark:border-cyan-500/20' },
  PUBLISHING: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
  COMPLETED: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
};

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
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvoice, setProcessingInvoice] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, iRes] = await Promise.all([getProjectsAPI(), getInvoicesAPI()]);
        setProjects(pRes.data?.data || pRes.data || []);
        setInvoices(iRes.data?.data || iRes.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePayNow = async (inv) => {
    if (processingInvoice === inv.id) return;
    setProcessingInvoice(inv.id);
    try {
      await updateInvoiceAPI(inv.id, { status: 'PENDING' });
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'PENDING' } : i));
      toast.success('تم تسجيل طلب الدفع، جاري فتح واتساب...');
    } catch (err) {
      console.warn('Could not update invoice status:', err);
    } finally {
      setProcessingInvoice(null);
    }
    const amount = inv.currency !== 'USD' && inv.exchangeRate && inv.exchangeRate > 1
      ? `${Number(inv.amount * inv.exchangeRate).toLocaleString()} ${inv.currency}`
      : `$${inv.amount?.toLocaleString()} USD`;
    const msg = `أريد دفع الفاتورة رقم ${inv.invoiceNumber}، قيمتها ${amount}. يرجى تزويدي ببيانات التحويل.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Summary stats
  const totalDue = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
  const paidCount = invoices.filter(i => i.status === 'PAID').length;

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
          {t('client_dashboard_title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-base md:text-lg mt-2 md:mt-4 max-w-2xl leading-relaxed border-l-4 border-brand-500/20 pl-4 md:pl-6">
          {t('client_dashboard_subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 md:py-40">
          <Loader2 size={50} className="animate-spin text-brand-500 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('syncing_workspace')}</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* — Summary Cards — */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                label: 'المشاريع النشطة',
                value: projects.filter(p => p.status !== 'COMPLETED').length,
                icon: Briefcase,
                color: 'brand',
              },
              {
                label: 'إجمالي المشاريع',
                value: projects.length,
                icon: FolderKanban,
                color: 'indigo',
              },
              {
                label: 'فواتير مدفوعة',
                value: paidCount,
                icon: Receipt,
                color: 'emerald',
              },
              {
                label: 'مجموع المستحق',
                value: `$${totalDue.toLocaleString()}`,
                icon: DollarSign,
                color: 'amber',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-3xl p-5 md:p-7 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className={`w-10 h-10 rounded-2xl mb-4 flex items-center justify-center bg-${card.color}-500/10 text-${card.color}-500`}>
                  <card.icon size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{card.value}</p>
              </div>
            ))}
          </div>

          {/* — Projects & Timeline — */}
          <section>
            <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 md:gap-4 uppercase tracking-tight">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                  <Briefcase size={18} />
                </div>
                {t('project_status')}
              </h2>
              <div className="h-0.5 flex-1 bg-slate-100 dark:bg-white/5 mx-4 md:mx-6 hidden sm:block"></div>
              <Link to="/client/files" className="flex items-center gap-2 text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">
                {t('view_all', 'عرض الكل')} <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              {projects.map(p => (
                <div key={p.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-brand-500/30 transition-all duration-500">
                  <div className="flex items-start justify-between mb-6 gap-3">
                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors uppercase">{p.name}</h3>
                    <div className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex-shrink-0 ${statusConfig[p.status]?.bg || 'bg-slate-50 dark:bg-white/5'} ${statusConfig[p.status]?.color || 'text-slate-500'} ${statusConfig[p.status]?.border || 'border-slate-100 dark:border-white/10'}`}>
                      {p.status?.replace(/_/g, ' ')}
                    </div>
                  </div>
                  {p.description && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 line-clamp-2 leading-relaxed">{p.description}</p>}
                  
                  <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project_timeline')}</span>
                    </div>
                    
                    <div className="relative">
                      {/* Connecting Line */}
                      <div className="absolute top-2.5 left-4 right-4 h-0.5 bg-slate-100 dark:bg-white/5 z-0" dir="ltr"></div>
                      <div
                        className="absolute top-2.5 left-4 h-0.5 bg-brand-500 transition-all duration-1000 z-0"
                        dir="ltr"
                        style={{ width: `${((getTimelineStage(p.status) - 1) / 3) * 100}%` }}
                      ></div>

                      <div className="relative z-10 flex justify-between">
                        {[
                          { step: 1, label: t('timeline_received', 'تم الاستلام') },
                          { step: 2, label: t('timeline_in_progress', 'قيد التنفيذ') },
                          { step: 3, label: t('timeline_review', 'المراجعة النهائية') },
                          { step: 4, label: t('timeline_delivered', 'تم التسليم') }
                        ].map((stage, idx) => {
                          const currentStage = getTimelineStage(p.status);
                          const isCompleted = currentStage >= stage.step;
                          const isActive = currentStage === stage.step;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white dark:bg-[#0a0a0c] ${isCompleted ? 'border-brand-500' : 'border-slate-200 dark:border-white/10'}`}>
                                {isCompleted && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                              </div>
                              <span className={`text-[10px] font-bold text-center ${isActive ? 'text-brand-500' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] py-16 md:py-20 text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('awaiting_projects')}</p>
                </div>
              )}
            </div>
          </section>

          {/* — Invoices — */}
          <section>
            <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 md:gap-4 uppercase tracking-tight">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Receipt size={18} />
                </div>
                {t('my_invoices')}
              </h2>
              <div className="h-0.5 flex-1 bg-slate-100 dark:bg-white/5 mx-4 md:mx-6 hidden sm:block"></div>
              <Link to="/client/invoices" className="flex items-center gap-2 text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">
                {t('view_all', 'عرض الكل')} <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('invoice_number')}</th>
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6 hidden sm:table-cell">{t('service_rendered')}</th>
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('total_due')}</th>
                      <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {invoices.slice(0, 5).map(inv => (
                      <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-300">
                        <td className="px-6 md:px-10 py-5 md:py-7 font-black text-slate-800 dark:text-white font-mono tracking-tighter group-hover:text-brand-500 transition-colors uppercase text-sm">#{inv.invoiceNumber}</td>
                        <td className="px-6 md:px-10 py-5 md:py-7 text-sm font-bold text-slate-500 dark:text-slate-400 hidden sm:table-cell">{inv.service}</td>
                        <td className="px-6 md:px-10 py-5 md:py-7">
                          <div className="flex flex-col">
                            <span className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tighter" dir="ltr">
                              {inv.currency !== 'USD' && inv.exchangeRate && inv.exchangeRate > 1 
                                ? `${Number(inv.amount * inv.exchangeRate).toLocaleString()} ${inv.currency}` 
                                : `$${inv.amount?.toLocaleString()}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                          {inv.status === 'PAID' || inv.status === 'PENDING' ? (
                            <InvoiceStatusBadge status={inv.status} />
                          ) : (
                            <button 
                              onClick={() => handlePayNow(inv)}
                              disabled={processingInvoice === inv.id}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-600/10 disabled:opacity-60 flex items-center gap-2 ml-auto"
                            >
                              {processingInvoice === inv.id ? <Loader2 size={12} className="animate-spin" /> : null}
                              {t('pay')} 💬
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && (
                  <div className="py-20 md:py-24 text-center">
                    <CreditCard size={36} className="text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('no_invoices_found')}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
