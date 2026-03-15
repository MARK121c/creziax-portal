import { useEffect, useState } from 'react';
import { getPaymentsAPI } from '../../store/api';
import { Search, Calendar, Loader2, Landmark, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const PaymentsPage = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try { 
        const { data } = await getPaymentsAPI(''); 
        setPayments(data); 
      } catch (err) {
        toast.error(t('loading'));
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => 
    p.invoice?.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">{t('payment_registry')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg border-l-4 border-brand-500/20 pl-4">{t('audit_transactions')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('filter_transactions')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('reference')}</th>
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6 hidden md:table-cell">{t('method')}</th>
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('amount')}</th>
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6 hidden sm:table-cell">{t('date')}</th>
                <th className="text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('payments_loading')}</p>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 md:py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                      <History size={32} className="text-slate-200 dark:text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('no_transactions')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{t('payments_empty')}</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-black text-xs font-mono flex-shrink-0">
                          INV
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800 dark:text-white group-hover:text-brand-600 transition-colors uppercase tracking-tight font-mono">
                            #{p.invoice?.invoiceNumber}
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1 md:hidden flex items-center gap-1">
                            <Landmark size={11} />
                            {p.method}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <Landmark size={14} className="text-slate-300 dark:text-slate-600" />
                        {p.method}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <div className="text-base md:text-lg font-black text-slate-800 dark:text-white tracking-tighter">
                        ${p.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-tight">
                        <Calendar size={14} />
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                      <span className="px-3 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                        {t('status_success')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
