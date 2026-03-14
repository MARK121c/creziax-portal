import { useEffect, useState } from 'react';
import { getTasksAPI, createTaskAPI, updateTaskAPI, deleteTaskAPI, getProjectsAPI } from '../../store/api';
import { Plus, X, Trash2, CheckCircle2, Clock, AlertCircle, Calendar, Search, Loader2, ListTodo, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const TasksPage = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ title: '', description: '', projectId: '', deadline: '' });
  const addNotification = useNotificationStore(state => state.addNotification);

  const taskStatusConfig = {
    PENDING: { color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-white/5', border: 'border-slate-200 dark:border-white/10', icon: Clock, labelKey: 'status_pending' },
    IN_PROGRESS: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', icon: AlertCircle, labelKey: 'status_in_progress' },
    REVIEW: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', icon: Search, labelKey: 'status_review' },
    COMPLETED: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', icon: CheckCircle2, labelKey: 'status_completed' },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([getTasksAPI(), getProjectsAPI()]);
      setTasks(tRes.data);
      setProjects(pRes.data);
    } catch (err) {
      toast.error(t('loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const loadingToast = toast.loading(t('syncing'));
    try {
      await createTaskAPI({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      toast.success(t('assign_task'), { id: loadingToast });
      addNotification(`تم إنشاء مهمة جديدة: ${form.title}`, 'success');
      setShowModal(false);
      setForm({ title: '', description: '', projectId: '', deadline: '' });
      fetchData();
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
      addNotification(`خطأ في إنشاء المهمة`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await updateTaskAPI(id, { status }); 
      toast.success(t('status'), { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`${t('delete_task_confirm')} ${title}?`)) return;
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await deleteTaskAPI(id); 
      toast.success(t('client_removed'), { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error(t('failed_remove_client'), { id: loadingToast });
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
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('tasks_management')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">{t('manage_workflows')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('filter_tasks')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
            <Plus size={18} />
            <span>{t('new_task')}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-[10px] text-slate-400">{t('tasks_loading')}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] py-24 md:py-32 text-center shadow-xl">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
              <ListTodo size={36} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3">{t('no_tasks')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">{t('tasks_empty')}</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-5 md:p-8 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-brand-500/30 transition-all duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border flex-shrink-0 ${taskStatusConfig[task.status].bg} ${taskStatusConfig[task.status].color} ${taskStatusConfig[task.status].border}`}>
                    {(() => { const Icon = taskStatusConfig[task.status].icon; return <Icon size={22} />; })()}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-brand-500 transition-colors uppercase tracking-tight">{task.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                        <Briefcase size={12} />
                        {task.project?.name}
                      </div>
                      {task.deadline && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/5 text-rose-500 rounded-lg border border-rose-500/10">
                          <Calendar size={12} />
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="flex items-center gap-1 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    {Object.keys(taskStatusConfig).map(s => (
                      <button key={s} onClick={() => handleStatusUpdate(task.id, s)}
                        title={t(taskStatusConfig[s].labelKey)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          task.status === s 
                            ? `${taskStatusConfig[s].bg} ${taskStatusConfig[s].color} ${taskStatusConfig[s].border} shadow-sm` 
                            : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-400'
                        }`}
                      >
                        {(() => { const Icon = taskStatusConfig[s].icon; return <Icon size={15} />; })()}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => handleDelete(task.id, task.title)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-500/20">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {task.description && (
                <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed border-l-2 border-slate-100 dark:border-white/5 pl-6">
                  {task.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('new_task')}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('new_task_desc')}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 md:p-10 space-y-6 md:space-y-7">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_task_title')}</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_project')}</label>
                <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all appearance-none font-bold">
                  <option value="" className="dark:bg-slate-900">{t('select_project')}</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_deadline')}</label>
                <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_requirements')}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder={t('task_details')} rows={3} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold resize-none" />
              </div>

              <div className="pt-6 flex gap-5 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-4 px-6 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('assign_task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
