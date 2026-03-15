import { useEffect, useState } from 'react';
import { getProjectsAPI, getTasksAPI, getInvoicesAPI } from '../../store/api';
import { FolderKanban, CheckSquare, Receipt, TrendingUp, Calendar, ArrowUpRight, Loader2, CreditCard, Briefcase, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const statusConfig = {
  CHANNEL_SETUP: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
  EDITING: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
  THUMBNAIL: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20' },
  SCRIPT: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-100 dark:border-cyan-500/20' },
  PUBLISHING: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
  COMPLETED: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
};

const ClientDashboard = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, tRes, iRes] = await Promise.all([getProjectsAPI(), getTasksAPI(), getInvoicesAPI()]);
        setProjects(pRes.data);
        setTasks(tRes.data);
        setInvoices(iRes.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-10">
          <div className="xl:col-span-2 space-y-8 md:space-y-12">
            
            <section>
              <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 md:gap-4 uppercase tracking-tight">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                    <Briefcase size={18} />
                  </div>
                  {t('project_status')}
                </h2>
                <div className="h-0.5 flex-1 bg-slate-100 dark:bg-white/5 mx-4 md:mx-6 hidden sm:block"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                {projects.map(p => (
                  <div key={p.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-brand-500/30 transition-all duration-500">
                    <div className="flex items-start justify-between mb-6 gap-3">
                      <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors uppercase">{p.name}</h3>
                      <div className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex-shrink-0 ${statusConfig[p.status]?.bg} ${statusConfig[p.status]?.color} ${statusConfig[p.status]?.border}`}>
                        {p.status?.replace('_', ' ')}
                      </div>
                    </div>
                    {p.description && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 line-clamp-2 leading-relaxed">{p.description}</p>}
                    
                    <div className="space-y-3 pt-6 border-t border-slate-50 dark:border-white/5">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <span>{t('pipeline_velocity')}</span>
                        <span className="text-brand-500">
                          {Math.round((Object.keys(statusConfig).indexOf(p.status) + 1) / Object.keys(statusConfig).length * 100)}%
                        </span>
                      </div>
                      <div className="flex gap-1.5 h-2">
                        {Object.keys(statusConfig).map((s, i) => (
                          <div key={s} className={`flex-1 rounded-full transition-all duration-1000 ${Object.keys(statusConfig).indexOf(p.status) >= i ? 'bg-brand-500' : 'bg-slate-100 dark:bg-white/5'}`} />
                        ))}
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

            <section>
              <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 md:gap-4 uppercase tracking-tight">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Receipt size={18} />
                  </div>
                  {t('my_invoices')}
                </h2>
                <div className="h-0.5 flex-1 bg-slate-100 dark:bg-white/5 mx-4 md:mx-6 hidden sm:block"></div>
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
                      {invoices.map(inv => (
                        <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-300">
                          <td className="px-6 md:px-10 py-5 md:py-7 font-black text-slate-800 dark:text-white font-mono tracking-tighter group-hover:text-brand-500 transition-colors uppercase text-sm">#{inv.invoiceNumber}</td>
                          <td className="px-6 md:px-10 py-5 md:py-7 text-sm font-bold text-slate-500 dark:text-slate-400 hidden sm:table-cell">{inv.service}</td>
                          <td className="px-6 md:px-10 py-5 md:py-7">
                            <span className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tighter">${inv.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                            <span className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${inv.status === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'}`}>
                              {inv.status === 'PAID' ? t('status_completed') : t('status_pending')}
                            </span>
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

          <div className="space-y-8 md:space-y-10">
            <div className="bg-brand-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-brand-600/40 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500">
              <TrendingUp size={100} className="absolute -bottom-4 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-6 md:mb-8">{t('production_insight')}</p>
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 leading-tight">{t('vision_in_motion')}</h3>
                <p className="text-sm font-bold opacity-80 leading-relaxed mb-8 md:mb-10 border-l-2 border-white/20 pl-4">{t('vision_desc')}</p>
                <button className="w-full py-4 md:py-5 bg-white text-brand-600 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-colors shadow-xl">{t('contact_support')}</button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/20 dark:shadow-none">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-6 md:mb-8 flex items-center justify-between uppercase tracking-tight">
                {t('recent_milestones')}
                <ListChecks size={20} className="text-brand-500" />
              </h3>
              <div className="space-y-6 md:space-y-8">
                {tasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex gap-4 md:gap-6 group">
                    <div className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-brand-500'}`}></div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white text-sm leading-tight uppercase tracking-tight group-hover:text-brand-500 transition-colors">{task.title}</h4>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : t('no_deadline')}
                      </p>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-slate-400 font-bold text-xs py-8 md:py-10 text-center border-t border-slate-50 dark:border-white/5">{t('no_active_milestones')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
