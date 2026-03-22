import { useEffect, useState } from 'react';
import { getContractsAPI } from '../../store/api';
import { FileText, Search, Loader2, Link as LinkIcon, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Helper: convert Google Drive share link → direct preview link
const getDrivePreviewUrl = (url) => {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return url;
};

const calculateRemainingDays = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = end - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const ClientContracts = () => {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await getContractsAPI();
      setContracts(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Contracts fail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleViewContract = (contract) => {
    const url = contract.pdfUrl;
    if (!url) return;
    const previewUrl = getDrivePreviewUrl(url);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const filtered = contracts.filter(c => 
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            {t('my_contracts', 'عقودي')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 md:mt-4 font-bold text-sm md:text-lg uppercase tracking-widest flex items-center gap-3 italic">
            <span className="w-8 md:w-12 h-[2px] bg-brand-500 rounded-full" />
            {t('my_contracts_desc', 'استعرض عقودك ومسوداتك القانونية')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-[2.5rem] md:rounded-[3rem] shadow-sm overflow-hidden backdrop-blur-3xl">
        <div className="p-6 md:p-10 border-b border-slate-100 dark:border-white/5">
          <div className="relative max-w-md w-full">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={t('search_contracts_placeholder', "البحث في العقود...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 pr-14 pl-6 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-32 md:py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-brand-500" size={48} />
            <p className="text-slate-400 font-bold animate-pulse">{t('loading_contracts', 'جاري تحميل العقود...')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 md:py-32 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-200 dark:border-white/10">
              <FileText size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t('no_contracts', 'لا يوجد عقود حالياً')}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 md:px-10 py-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{t('contract_title', 'عنوان العقد')}</th>
                  <th className="px-6 md:px-10 py-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{t('contract_status', 'حالة العقد')}</th>
                  <th className="px-6 md:px-10 py-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{t('contract_duration', 'المدة')}</th>
                  <th className="px-6 md:px-10 py-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-left">{t('file_label', 'الملف')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map(contract => {
                  const daysLeft = calculateRemainingDays(contract.endDate);
                  const isEndingSoon = daysLeft !== null && daysLeft <= 14 && daysLeft > 0;
                  const isExpired = daysLeft !== null && daysLeft <= 0;

                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                      <td className="px-6 md:px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-xs">{contract.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {new Date(contract.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-6">
                        {isExpired ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-500/20">
                            <X size={12} /> {t('expired', 'منتهي')}
                          </div>
                        ) : isEndingSoon ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                            <AlertTriangle size={12} /> {t('ending_soon', 'ينتهي قريباً')}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                            <CheckCircle2 size={12} /> {t('active', 'ساري')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 md:px-10 py-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <Calendar size={14} />
                          {contract.startDate 
                            ? `${new Date(contract.startDate).toLocaleDateString()} - ${contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '∞'}`
                            : '---'
                          }
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-6 text-left">
                        {contract.pdfUrl ? (
                          <button
                            onClick={() => handleViewContract(contract)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                          >
                            <LinkIcon size={14} />
                            {t('view_contract', 'عرض العقد')}
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">{t('no_file', 'لا يوجد ملف')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientContracts;
