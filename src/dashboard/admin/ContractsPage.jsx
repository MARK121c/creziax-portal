import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getClientsAPI } from '../../store/api';
import { 
  FileText, Search, Filter, Loader2, Download, ExternalLink, 
  Building2, Calendar, ShieldCheck, AlertCircle, ChevronRight,
  Plus, History
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const ContractsPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await getClientsAPI();
        // Assume clients come back with clientInfo
        const clientsWithContracts = data.filter(c => c.clientInfo?.contractEndDate);
        setClients(clientsWithContracts);
      } catch (err) {
        toast.error(t('failed_load_contracts') || 'Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredContracts = clients.filter(c => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    const company = (c.clientInfo?.company || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || company.includes(query);
  });

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {t('contracts_vault') || 'Contracts Vault'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">
            {t('manage_legal_docs') || 'Manage and audit client legal agreements'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_contracts') || 'Search by client or company...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
            <Plus size={18} />
            <span>{t('new_contract') || 'New Contract'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-xs text-slate-400">{t('accessing_vault')}</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-24 md:py-32">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
              <FileText size={36} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3">No Contracts Found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">Any client with an active contract end date will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Client / Partner</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Validity Period</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredContracts.map(c => {
                  const end = new Date(c.clientInfo.contractEndDate);
                  const start = c.clientInfo.contractStartDate ? new Date(c.clientInfo.contractStartDate) : null;
                  const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
                  const isCritical = diff <= 7 && diff >= 0;
                  const isExpired = diff < 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                      <td className="px-6 md:px-10 py-5 md:py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover:border-brand-500/30 transition-colors">
                            {c.clientInfo?.logoUrl ? (
                              <img src={c.clientInfo.logoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <Building2 size={20} />
                            )}
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-800 dark:text-white leading-none">{c.clientInfo?.company}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{c.firstName} {c.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-8">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">From</span>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{start ? start.toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 mt-4" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Until</span>
                            <span className={`text-sm font-bold ${isExpired ? 'text-rose-500' : isCritical ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>
                              {end.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-8">
                        {isExpired ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Expired</span>
                          </div>
                        ) : isCritical ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                            <History size={14} className="animate-spin-slow" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Renewal Due</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Active</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button className="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all border border-slate-200 dark:border-white/10" title="View Digital Contract">
                            <ExternalLink size={18} />
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-brand-600 hover:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold transition-all group/dl">
                            <Download size={14} className="group-hover/dl:translate-y-0.5 transition-transform" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-gradient-to-br from-brand-600 to-violet-700 rounded-[2.5rem] text-white shadow-2xl shadow-brand-600/20">
          <h3 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
             <ShieldCheck size={24} />
             Legal Compliance
          </h3>
          <p className="text-white/70 text-sm leading-relaxed font-medium">
             Every contract in this vault is digitally signed and audited. You can track renewal dates and legal statuses for all active agency partners.
          </p>
          <div className="mt-8 flex items-center gap-6">
             <div className="flex flex-col">
                <span className="text-2xl font-black">{clients.length}</span>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Active Agreements</span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col">
                <span className="text-2xl font-black">{clients.filter(c => Math.ceil((new Date(c.clientInfo.contractEndDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 7).length}</span>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Due for Renewal</span>
             </div>
          </div>
        </div>
        
        <div className="p-8 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col justify-center">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Contract Renewal Alerts</h3>
           </div>
           <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              System will automatically notify admins 7 days before any contract expiration to ensure continuity of service.
           </p>
           <button className="mt-6 text-brand-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
              Configure Notification Settings <ChevronRight size={14} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
