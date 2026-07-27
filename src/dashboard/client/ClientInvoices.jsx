import { useEffect, useState, useRef } from 'react';
import { getInvoicesAPI, updateInvoiceAPI } from '../../store/api';
import { Receipt, Loader2, CreditCard, MessageCircle, DollarSign, Activity, Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import UniversalFinancialTemplate from '../admin/components/UniversalFinancialTemplate';

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
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const invoiceRef = useRef();

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
  
  const handleDownloadInvoice = async (inv) => {
    console.log('Starting PDF generation for:', inv.invoiceNumber);
    const loadingToast = toast.loading(`${t('generating_pdf', 'جاري تجهيز الفاتورة...')} #${inv.invoiceNumber}`);
    try {
      setPrintingInvoice(inv);
      // Wait for React to render the component (matching Admin's 800ms)
      setTimeout(() => {
        const element = invoiceRef.current;
        if (!element) {
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
          toast.success(t('download_success', 'تم تحميل الفاتورة بنجاح'), { id: loadingToast });
        }).catch(err => {
          console.error('PDF Error:', err);
          toast.error(t('download_failed', 'فشل تحميل الفاتورة'), { id: loadingToast });
          setPrintingInvoice(null);
        });
      }, 800);
    } catch (err) {
      console.error('Download error:', err);
      toast.error(t('download_failed', 'فشل تحميل الفاتورة'), { id: loadingToast });
      setPrintingInvoice(null);
    }
  };

  // Summary Metrics
  const totalDue = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
  const pendingCount = invoices.filter(i => i.status !== 'PAID').length;

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-10">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            {t('my_invoices', 'السجل المالي')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 md:mt-4 font-bold text-sm md:text-lg uppercase tracking-widest flex items-center gap-3">
            <span className="w-8 md:w-12 h-[2px] bg-brand-500 rounded-full" />
            {t('manage_payments_desc', 'إدارة الفواتير والمدفوعات الخاصة بك')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-brand-500/10 text-brand-500 border border-brand-500/20 rounded-2xl flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('live_sync')}</span>
          </div>
        </div>
      </div>

      {/* ─── Summary Cards (Supreme Redesign) ─── */}
      {!loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden group">
             <div className="relative z-10">
               <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-8 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                 <DollarSign size={28} />
               </div>
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{t('total_investment', 'إجمالي الاستثمار')}</p>
               <h3 className="text-5xl font-black text-white tracking-tighter">${totalDue.toLocaleString()}</h3>
               <div className="mt-6 flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                 <p className="text-xs font-bold text-rose-500/80 uppercase tracking-tight italic">
                   {pendingCount} {t('pending_invoices', 'فواتير معلقة حالياً')}
                 </p>
               </div>
             </div>
          </div>

          <div className="bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden group">
             <div className="relative z-10">
               <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                 <Receipt size={28} />
               </div>
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{t('total_paid_investment', 'إجمالي المدفوعات')}</p>
               <h3 className="text-5xl font-black text-white tracking-tighter">${totalPaid.toLocaleString()}</h3>
               <div className="mt-6 flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">{t('verified_account', 'حساب موثق')}</div>
               </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-[2.5rem] p-10 shadow-2xl shadow-brand-500/20 text-white relative overflow-hidden group">
             <div className="relative z-10 h-full flex flex-col justify-between">
               <div>
                  <h3 className="text-3xl font-black tracking-tight leading-tight mb-4">
                      {totalDue === 0 ? t('all_settled', 'الحساب مستقر') : t('outstanding_dues', 'مدفوعات مطلوبة')}
                  </h3>
                  <p className="text-sm font-bold opacity-80 leading-relaxed italic">
                    {totalDue === 0 
                      ? 'لقد قمت بتسوية كافة المستحقات بنجاح.' 
                      : 'لديك فواتير معلقة بانتظار التأكيد لضمان استمرار الخدمة.'}
                  </p>
               </div>
               <div className="mt-8 flex gap-2">
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                     <div className="h-full bg-white w-2/3 animate-pulse" />
                  </div>
               </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={48} />
        </div>
      )}

      {/* ─── List Section ─── */}
      {!loading && (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] md:rounded-[3rem] shadow-sm overflow-hidden backdrop-blur-3xl">
          {invoices.length === 0 ? (
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
                      <td className="px-6 md:px-10 py-6 text-left flex items-center justify-end gap-3">
                        {inv.status === 'PAID' || inv.status === 'PENDING' ? (
                          <>
                            <InvoiceStatusBadge status={inv.status} />
                            <button 
                              onClick={() => handleDownloadInvoice(inv)}
                              className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
                              title={t('download_pdf', 'تحميل PDF')}
                            >
                              <Download size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => handlePayNow(inv)}
                              disabled={processingInvoice === inv.id}
                              className="px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 inline-flex"
                            >
                              {processingInvoice === inv.id ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                              تأكيد ودفع
                            </button>
                            <button 
                              onClick={() => handleDownloadInvoice(inv)}
                              className="p-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
                              title={t('download_pdf', 'تحميل PDF')}
                            >
                              <FileText size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* HIDDEN TEMPLATES FOR PDF GENERATION (Copy-Paste from Admin) */}
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
      </div>
    </div>
  );
};

export default ClientInvoices;
