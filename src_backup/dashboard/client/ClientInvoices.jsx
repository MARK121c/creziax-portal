import { useEffect, useState } from 'react';
import { getInvoicesAPI, updateInvoiceAPI } from '../../store/api';
import { Receipt, Loader2, CreditCard, MessageCircle, DollarSign, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const WHATSAPP_NUMBER = '201069804568';

const InvoiceStatusBadge = ({ status }) => {
  if (status === 'PAID') return (
    <span className="px-4 py-2 flex items-center gap-2 w-max rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> مدفوعة
    </span>
  );
  if (status === 'PENDING') return (
    <span className="px-4 py-2 flex items-center gap-2 w-max rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20">
      <Loader2 size={12} className="animate-spin" /> قيد المراجعة
    </span>
  );
  return null;
};

const ClientInvoices = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvoice, setProcessingInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await getInvoicesAPI();
      setInvoices(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
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
    const msg = `أريد دفع الفاتورة رقم ${inv.invoiceNumber}، قيمتها ${amount}. يرجى تزويدي ببيانات الدفع والتحويل.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Summary Metrics
  const totalDue = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
  const pendingCount = invoices.filter(i => i.status !== 'PAID').length;

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            {t('my_invoices', 'السجل المالي')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 md:mt-4 font-bold text-sm md:text-lg uppercase tracking-widest flex items-center gap-3">
            <span className="w-8 md:w-12 h-[2px] bg-emerald-500 rounded-full" />
            فواتير ومستحقات المشاريع
          </p>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 md:p-8 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المستحق دفعه</p>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">${totalDue.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">{pendingCount} فواتير غير مدفوعة</p>
          </div>
          
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 md:p-8 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المدفوعات السابقة</p>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Receipt size={20} />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">${totalPaid.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">عن كافة فترات العمل</p>
          </div>

          <div className="bg-brand-600 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-brand-600/30 text-white relative overflow-hidden flex flex-col justify-center items-center text-center">
            <Activity size={100} className="absolute -right-4 -bottom-4 opacity-10" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">حالة الحساب</p>
              <h3 className="text-2xl font-black tracking-tight">{totalDue === 0 ? 'مُسدد بالكامل ✓' : 'يوجد مستحقات'}</h3>
            </div>
          </div>
        </div>
      )}

      {/* ─── List ─── */}
      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] md:rounded-[3rem] shadow-sm overflow-hidden backdrop-blur-3xl">
        {loading ? (
          <div className="py-32 md:py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-brand-500" size={48} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">جاري تحميل السجل المالي...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-32 md:py-40 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 dark:border-white/10">
              <CreditCard size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{t('no_invoices_found', 'لا توجد فواتير حالياً')}</h3>
            <p className="text-sm font-bold text-slate-500 mt-2">لا توجد أي معاملات مالية مسجلة في حسابك بعد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                  <th className="text-right text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-6 md:px-10 py-5 md:py-6">{t('invoice_number', 'رقم الفاتورة')}</th>
                  <th className="text-right text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-6 md:px-10 py-5 md:py-6">{t('service_rendered', 'وصف الخدمة / الدفعة')}</th>
                  <th className="text-right text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-6 md:px-10 py-5 md:py-6">{t('total_due', 'المبلغ المستحق')}</th>
                  <th className="text-left text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-6 md:px-10 py-5 md:py-6">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {invoices.map(inv => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 md:px-10 py-6 font-black text-slate-800 dark:text-white font-mono tracking-tighter group-hover:text-brand-500 transition-colors uppercase text-sm md:text-base">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="px-6 md:px-10 py-6">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.service}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 md:px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none" dir="ltr">
                          {inv.currency !== 'USD' && inv.exchangeRate && inv.exchangeRate > 1 
                            ? `${Number(inv.amount * inv.exchangeRate).toLocaleString()} ${inv.currency}` 
                            : `$${inv.amount.toLocaleString()}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-6 text-left">
                      {inv.status === 'PAID' || inv.status === 'PENDING' ? (
                        <InvoiceStatusBadge status={inv.status} />
                      ) : (
                        <button 
                          onClick={() => handlePayNow(inv)}
                          disabled={processingInvoice === inv.id}
                          className="px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 inline-flex"
                        >
                          {processingInvoice === inv.id ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                          تأكيد ودفع
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientInvoices;
