import { useEffect, useState } from 'react';
import { getTasksAPI, updateTaskAPI } from '../../store/api';
import { CheckCircle2, Clock, Play, AlertCircle, Search, Loader2, Workflow, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const taskStatusColors = {
  PENDING: 'from-slate-400 to-slate-500 shadow-slate-200/50',
  IN_PROGRESS: 'from-brand-500 to-indigo-600 shadow-brand-500/30',
  REVIEW: 'from-violet-500 to-purple-600 shadow-violet-500/30',
  COMPLETED: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
};

const TeamDashboard = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try { 
      const { data } = await getTasksAPI(); 
      setTasks(data); 
    } catch (err) {
      toast.error(t('loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleStatusUpdate = async (id, status) => {
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await updateTaskAPI(id, { status }); 
      toast.success(t('status'), { id: loadingToast });
      fetchTasks(); 
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">{t('production_hub')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg border-l-4 border-brand-500/20 pl-4">{t('active_payloads')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_assignments')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 md:py-40 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem]">
            <Loader2 size={40} className="animate-spin text-brand-500 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('accessing_grid')}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] py-24 md:py-32 text-center text-slate-400">
             <Workflow size={50} className="mx-auto mb-6 opacity-20" />
             <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">{t('grid_clear')}</h3>
             <p className="text-sm font-medium mt-2">{t('awaiting_mandates')}</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-5 md:p-8 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-brand-500/30 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg flex-shrink-0 ${taskStatusColors[task.status] || 'from-slate-500 to-slate-600'}`}>
                    {task.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : 
                     task.status === 'IN_PROGRESS' ? <Play size={24} /> : 
                     task.status === 'REVIEW' ? <Target size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                      <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{task.project?.name || 'Internal'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.deadline ? `${t('deadline')}: ${new Date(task.deadline).toLocaleDateString()}` : t('no_deadline')}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-brand-600 transition-colors">{task.title}</h3>
                    {task.description && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">{task.description}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {Object.keys(taskStatusColors).map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleStatusUpdate(task.id, s)} 
                      className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${task.status === s ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-white/10'}`}
                    >
                      {t(`status_${s.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamDashboard;
