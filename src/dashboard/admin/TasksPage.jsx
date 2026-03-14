import { useEffect, useState } from 'react';
import { getTasksAPI, createTaskAPI, updateTaskAPI, deleteTaskAPI, getProjectsAPI } from '../../store/api';
import { Plus, X, Trash2, CheckCircle2, Clock, AlertCircle, Calendar, Search, Loader2, ListTodo, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const taskStatusConfig = {
  PENDING: { color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-white/5', border: 'border-slate-200 dark:border-white/10', icon: Clock, label: 'Pending' },
  IN_PROGRESS: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', icon: AlertCircle, label: 'In Progress' },
  REVIEW: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', icon: Search, label: 'Under Review' },
  COMPLETED: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', icon: CheckCircle2, label: 'Completed' },
};

const TasksPage = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ title: '', description: '', projectId: '', deadline: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([getTasksAPI(), getProjectsAPI()]);
      setTasks(tRes.data);
      setProjects(pRes.data);
    } catch (err) {
      toast.error('Failed to sync tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const loadingToast = toast.loading('Assigning task...');
    try {
      await createTaskAPI({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      toast.success('Task successfully assigned.', { id: loadingToast });
      setShowModal(false);
      setForm({ title: '', description: '', projectId: '', deadline: '' });
      fetchData();
    } catch (err) {
      toast.error('Assignment failed.', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const loadingToast = toast.loading(`Transitioning to ${status.replace('_', ' ')}...`);
    try { 
      await updateTaskAPI(id, { status }); 
      toast.success('Status transitioned.', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Transition failed.', { id: loadingToast });
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Revoke task: ${title}?`)) return;
    const loadingToast = toast.loading('Revoking task...');
    try { 
      await deleteTaskAPI(id); 
      toast.success('Task revoked.', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Revocation failed.', { id: loadingToast });
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('tasks_management')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg italic">{t('manage_workflows')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-80 shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t('new_task')}</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-[10px] text-slate-400">Loading Pipeline...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] py-32 text-center shadow-xl shadow-slate-200/40 dark:shadow-none">
            <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 transform rotate-12 border border-slate-100 dark:border-white/5">
              <ListTodo size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{t('no_tasks')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium italic">The workflow is currently clear. Excellent momentum.</p>
          </div>
        ) : (
          filteredTasks.map(t => (
            <div key={t.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-brand-500/30 transition-all duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${taskStatusConfig[t.status].bg} ${taskStatusConfig[t.status].color} ${taskStatusConfig[t.status].border}`}>
                    {(() => {
                      const Icon = taskStatusConfig[t.status].icon;
                      return <Icon size={24} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-brand-500 transition-colors uppercase tracking-tight">{t.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                        <Briefcase size={12} />
                        {t.project?.name}
                      </div>
                      {t.deadline && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/5 text-rose-500 rounded-lg border border-rose-500/10">
                          <Calendar size={12} />
                          {new Date(t.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    {Object.keys(taskStatusConfig).map(s => (
                      <button 
                        key={s} 
                        onClick={() => handleStatusUpdate(t.id, s)} 
                        title={taskStatusConfig[s].label}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          t.status === s 
                            ? `${taskStatusConfig[s].bg} ${taskStatusConfig[s].color} ${taskStatusConfig[s].border} shadow-sm px-4 w-auto` 
                            : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-400'
                        }`}
                      >
                         {(() => {
                          const Icon = taskStatusConfig[s].icon;
                          return <Icon size={16} />;
                        })()}
                        {t.status === s && <span className="ml-2 text-[10px] font-black uppercase tracking-widest">{t.status.replace('_', ' ')}</span>}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleDelete(t.id, t.title)} 
                    className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-500/20"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              {t.description && (
                <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400 italic max-w-3xl leading-relaxed border-l-2 border-slate-100 dark:border-white/5 pl-6">
                  "{t.description}"
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('new_task')}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Initialize a new workflow item for your team.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-10 space-y-7">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Objective Title</label>
                <input 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  placeholder="Review edit #3..." 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Parent Pipeline</label>
                <select 
                  value={form.projectId} 
                  onChange={e => setForm({...form, projectId: e.target.value})} 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all appearance-none font-bold"
                >
                  <option value="" className="dark:bg-slate-900">Select Linked Project</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                 <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Target Deadline</label>
                  <input 
                    type="date" 
                    value={form.deadline} 
                    onChange={e => setForm({...form, deadline: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Detailed Requirements</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Outline the specific deliverables for this task..." 
                  rows={3} 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold resize-none" 
                />
              </div>

              <div className="pt-8 flex gap-5 border-t border-slate-100 dark:border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4.5 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-4.5 px-6 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-white/5 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all duration-300 active:scale-95"
                >
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Assign Task'}
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
