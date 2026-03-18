import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getWorkspaceAPI, 
  getPhaseTasksAPI, 
  updateWorkspaceTaskAPI, 
  createPhaseAPI, 
  deletePhaseAPI,
  createWorkspaceTaskAPI,
  deleteWorkspaceTaskAPI,
  getUsersAPI
} from '../../store/api';
import { 
  Plus, X, Briefcase, Calendar, Loader2, CheckCircle2, Clock, 
  PlayCircle, FileText, ChevronDown, ChevronRight, ExternalLink, 
  Users, AlertCircle, Edit2, Layout, BookOpen, 
  HardDrive, Palette, Globe, ShieldCheck, ArrowUpRight, MessageSquare,
  Search, Filter, MoreVertical, Trash2, Activity, Check, Circle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const taskStatusConfig = {
  NOT_STARTED: { color: 'text-rose-500', icon: X, label: 'not_started', bg: 'bg-rose-500/10' },
  IN_PROGRESS: { color: 'text-amber-500', icon: Circle, label: 'in_progress', bg: 'bg-amber-500/10' },
  DONE: { color: 'text-emerald-500', icon: Check, label: 'done', bg: 'bg-emerald-500/10' },
};

const getTaskStatusStyle = (status) => {
  return taskStatusConfig[status] || { 
    color: 'text-slate-400', 
    bg: 'bg-slate-400/10', 
    label: status?.replace('_', ' ') || 'TASK', 
    dot: 'bg-slate-400' 
  };
};

const getFormattedLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const WorkspaceDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [phaseTasks, setPhaseTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [showAddTask, setShowAddTask] = useState(null);
  const [showNotes, setShowNotes] = useState(null); // taskId
  const [submitting, setSubmitting] = useState(false);

  const [phaseForm, setPhaseForm] = useState({ name: '', startDate: '', endDate: '' });
  const [taskForm, setTaskForm] = useState({ title: '', deadline: '', assignedToId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, uRes] = await Promise.all([
        getWorkspaceAPI(id),
        getUsersAPI()
      ]);
      setWorkspace(wRes.data);
      setTeamMembers((uRes.data || []).filter(u => u.role === 'TEAM'));
      
      if (wRes.data?.phases && wRes.data.phases.length > 0) {
        const sortedPhases = [...wRes.data.phases].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestPhaseId = sortedPhases[0]?.id;
        if (latestPhaseId) {
          setExpandedPhases({ [latestPhaseId]: true });
          loadPhaseTasks(latestPhaseId);
        }
      }
    } catch (err) {
      toast.error(t('failed_load_workspace'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const togglePhase = async (phaseId) => {
    const isExpanded = !!expandedPhases[phaseId];
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !isExpanded }));
    if (!isExpanded && !phaseTasks[phaseId]) {
      loadPhaseTasks(phaseId);
    }
  };

  const loadPhaseTasks = async (phaseId) => {
    setLoadingTasks(prev => ({ ...prev, [phaseId]: true }));
    try {
      const { data } = await getPhaseTasksAPI(phaseId);
      setPhaseTasks(prev => ({ ...prev, [phaseId]: data }));
    } catch (err) {
      toast.error(t('failed_load_tasks'));
    } finally {
      setLoadingTasks(prev => ({ ...prev, [phaseId]: false }));
    }
  };

  const handleTaskUpdate = async (taskId, phaseId, updates) => {
    try {
      const { data } = await updateWorkspaceTaskAPI(taskId, updates);
      setPhaseTasks(prev => ({
        ...prev,
        [phaseId]: prev[phaseId].map(t => t.id === taskId ? data : t)
      }));
      toast.success(t('saved_successfully'));
    } catch (err) {
      toast.error(t('error_general'));
    }
  };

  const handleAddPhase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPhaseAPI(id, phaseForm);
      toast.success(t('saved_successfully'));
      setShowAddPhase(false);
      setPhaseForm({ name: '', startDate: '', endDate: '' });
      fetchData();
    } catch (err) {
      toast.error(t('error_general'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const initialMeta = JSON.stringify({ script: 'NOT_STARTED', edit: 'NOT_STARTED', thumb: 'NOT_STARTED' });
      await createWorkspaceTaskAPI(showAddTask, { ...taskForm, description: initialMeta });
      toast.success(t('saved_successfully'));
      setShowAddTask(null);
      setTaskForm({ title: '', deadline: '', assignedToId: '' });
      loadPhaseTasks(showAddTask);
    } catch (err) {
      toast.error(t('error_general'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePhase = async (phaseId) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await deletePhaseAPI(phaseId);
      toast.success(t('saved_successfully'));
      fetchData();
    } catch (err) { toast.error(t('error_general')); }
  };

  const handleDeleteTask = async (taskId, phaseId) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await deleteWorkspaceTaskAPI(taskId);
      toast.success(t('saved_successfully'));
      loadPhaseTasks(phaseId);
    } catch (err) { toast.error(t('error_general')); }
  };

  const parseTaskMeta = (desc) => {
    try { return JSON.parse(desc); } catch (e) { return { script: 'NOT_STARTED', edit: 'NOT_STARTED', thumb: 'NOT_STARTED' }; }
  };

  const toggleSubStatus = async (task, phaseId, field) => {
    const meta = parseTaskMeta(task.description);
    const cycle = ['NOT_STARTED', 'IN_PROGRESS', 'DONE'];
    const currentIdx = cycle.indexOf(meta[field] || 'NOT_STARTED');
    const nextIdx = (currentIdx + 1) % cycle.length;
    meta[field] = cycle[nextIdx];
    
    await handleTaskUpdate(task.id, phaseId, { description: JSON.stringify(meta) });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 bg-white dark:bg-[#0a0a0c]">
        <Loader2 size={80} className="animate-spin text-brand-500 mb-8" />
        <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">{t('syncing_workspace')}</p>
      </div>
    );
  }

  if (!workspace) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
       <AlertCircle size={48} className="text-rose-500 mb-8" />
       <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">{t('no_projects')}</h2>
       <Link to="/admin/projects" className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">{t('back_to_directory')}</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500/30">
      
      {/* Supreme Business Header */}
      <div className="sticky top-0 z-[50] bg-white/90 dark:bg-[#050505]/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/admin/projects" className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-brand-500 border border-slate-100 dark:border-white/10 shadow-sm active:scale-95">
              <ChevronRight className="rotate-180" size={24} />
            </Link>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 overflow-hidden shadow-2xl flex-shrink-0 transition-transform hover:scale-105">
                {workspace.logoUrl ? (
                  <img src={getFormattedLogoUrl(workspace.logoUrl)} alt="" className="w-full h-full object-cover" />
                ) : workspace.client?.logoUrl ? (
                  <img src={getFormattedLogoUrl(workspace.client.logoUrl)} alt="" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <Briefcase size={28} className="m-auto text-slate-300" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase leading-none">{workspace.name}</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{workspace.client?.user?.firstName} {workspace.client?.user?.lastName} • PARTNER WORKSPACE</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden lg:flex -space-x-3 mr-4">
               {[1,2,3].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-[#050505] shadow-lg" />
               ))}
             </div>
             
             <a 
               href={workspace.notionUrl || (workspace.client?.phone ? `https://wa.me/${workspace.client.phone.replace(/\D/g, '')}` : '#')} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-brand-600/30 active:scale-95 whitespace-nowrap"
             >
               <ExternalLink size={16} />
               {t('open_client_channel')}
             </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-10 md:p-12 space-y-16">
        <div className="w-full">
          {/* Timeline Engine */}
          <div className="space-y-16">
            <div className="flex items-center justify-between px-4 pb-6 border-b border-slate-100 dark:border-white/5">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-4">
                  <Layout size={24} className="text-brand-500" />
                  {t('editorial_timeline')}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 opacity-60">Production Schedule & Asset Management</p>
              </div>
              <button 
                onClick={() => setShowAddPhase(true)}
                className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95"
              >
                <Plus size={18} />
                {t('new_month')}
              </button>
            </div>

            <div className="space-y-12">
              {(workspace.phases || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((p, idx) => (
                <div key={p.id} className="relative">
                  <div className="absolute left-8 top-20 bottom-0 w-px bg-slate-100 dark:bg-white/5 hidden md:block" />
                  
                  <div 
                    onClick={() => togglePhase(p.id)}
                    className="flex items-center gap-10 mb-8 group cursor-pointer"
                  >
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-lg z-10 transition-all duration-500 border-2 ${expandedPhases[p.id] ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30 border-brand-500 scale-110' : 'bg-white dark:bg-[#0a0a0c] border-slate-100 dark:border-white/5 text-slate-300'}`}>
                      {(workspace.phases || []).length - idx}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} PRODUCTION CYCLE</p>
                    </div>
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={(e) => { e.stopPropagation(); setShowAddTask(p.id); }} className="p-3 bg-brand-500/10 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all"><Plus size={20} /></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDeletePhase(p.id); }} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                    </div>
                  </div>

                  {expandedPhases[p.id] && (
                    <div className="md:ml-24 bg-white dark:bg-[#0a0a0c]/60 border border-slate-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                      <div className="p-1">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 dark:bg-black/40 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 dark:border-white/5">
                              <th className="px-10 py-6">{t('video_title')}</th>
                              <th className="px-4 py-6 text-center w-28">{t('script')}</th>
                              <th className="px-4 py-6 text-center w-28">{t('edit')}</th>
                              <th className="px-4 py-6 text-center w-28">{t('thumbnail')}</th>
                              <th className="px-10 py-6 text-center w-48">{t('publish_date')}</th>
                              <th className="px-6 py-6 text-right w-20"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {loadingTasks[p.id] ? (
                              <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-brand-500" size={32} /></td></tr>
                            ) : (phaseTasks[p.id] || []).length === 0 ? (
                              <tr><td colSpan="6" className="py-20 text-center text-xs font-black text-slate-300 uppercase tracking-[0.3em] italic">{t('tasks_empty')}</td></tr>
                            ) : phaseTasks[p.id].map(task => {
                              const meta = parseTaskMeta(task.description);
                              const deadline = task.deadline ? new Date(task.deadline) : null;
                              const isUrgent = deadline && (deadline - new Date()) / (3600000) <= 24 && (deadline - new Date()) > 0;
  
                              return (
                                <tr key={task.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                      <div className="flex flex-col">
                                        <span className="text-base font-bold text-slate-700 dark:text-slate-200 tracking-tight">{task.title}</span>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          {task.privateNotes && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10} /> {t('notes_panel')}</span>}
                                          {isUrgent && <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">URGENT</span>}
                                        </div>
                                      </div>
                                      <button onClick={() => setShowNotes(task.id)} className="p-2.5 text-slate-300 hover:text-brand-500 bg-slate-50 dark:bg-white/5 rounded-xl transition-all ml-auto opacity-0 group-hover:opacity-100"><MessageSquare size={16} /></button>
                                    </div>
                                  </td>
  
                                  {['script', 'edit', 'thumb'].map(field => (
                                    <td key={field} className="px-4 py-8">
                                      <button 
                                        onClick={() => toggleSubStatus(task, p.id, field)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all shadow-sm active:scale-90 ${taskStatusConfig[meta[field] || 'NOT_STARTED'].bg} ${taskStatusConfig[meta[field] || 'NOT_STARTED'].color} border border-transparent hover:border-current/20`}
                                      >
                                        {(() => {
                                          const Icon = taskStatusConfig[meta[field] || 'NOT_STARTED'].icon;
                                          return <Icon size={18} strokeWidth={3} />;
                                        })()}
                                      </button>
                                    </td>
                                  ))}
  
                                  <td className="px-10 py-8 text-center text-sm font-black text-slate-500 dark:text-slate-400 tracking-widest">
                                    {deadline ? deadline.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase() : '--'}
                                  </td>
  
                                  <td className="px-6 py-8 text-right">
                                    <button onClick={() => handleDeleteTask(task.id, p.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showAddPhase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="absolute inset-0 bg-slate-950/40" onClick={() => setShowAddPhase(false)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('new_month')}</h3>
                <button onClick={() => setShowAddPhase(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddPhase} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('phase_name')}</label>
                    <input name="name" value={phaseForm.name} onChange={e => setPhaseForm({...phaseForm, name: e.target.value})} required placeholder="e.g. March 2024" className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                 </div>
                 <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-600 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest">{submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('save')}</button>
              </form>
           </div>
        </div>
      )}

      {showAddTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="absolute inset-0 bg-slate-950/40" onClick={() => setShowAddTask(null)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('add_video')}</h3>
                <button onClick={() => setShowAddTask(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('video_title')}</label>
                    <input name="title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('publish_date')}</label>
                    <input type="date" name="deadline" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                 </div>
                 <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-600 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest">{submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('save')}</button>
              </form>
           </div>
        </div>
      )}

      {showNotes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="absolute inset-0 bg-slate-950/40" onClick={() => setShowNotes(null)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('notes_panel')}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Asset Production Documentation</p>
                </div>
                <button onClick={() => setShowNotes(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                <textarea 
                  className="w-full h-64 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-3xl p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                  placeholder={t('type_note')}
                  defaultValue={(workspace.phases || []).flatMap(p => phaseTasks[p.id] || []).find(t => t.id === showNotes)?.privateNotes || ''}
                  onBlur={(e) => {
                    const phaseId = (workspace.phases || []).find(p => (phaseTasks[p.id] || []).some(t => t.id === showNotes))?.id;
                    handleTaskUpdate(showNotes, phaseId, { privateNotes: e.target.value });
                  }}
                />
                <div className="flex items-center gap-3 px-2">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('saved_successfully')}</p>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;
