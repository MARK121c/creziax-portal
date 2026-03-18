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
      
      {/* Sticky Business Header */}
      <div className="sticky top-0 z-[50] bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin/projects" className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-brand-500">
              <ChevronRight className="rotate-180" size={20} />
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden shadow-inner flex-shrink-0">
                {workspace.client?.logoUrl ? (
                  <img src={getFormattedLogoUrl(workspace.client.logoUrl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Briefcase size={20} className="m-auto text-slate-300" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight line-clamp-1">{workspace.name}</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{workspace.client?.user?.firstName} {workspace.client?.user?.lastName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden lg:flex -space-x-3 mr-4">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-sm" />
               ))}
             </div>
             
             <a 
               href={workspace.client?.phone ? `https://wa.me/${workspace.client.phone.replace(/\D/g, '')}` : '#'} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-2.5 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 whitespace-nowrap"
             >
               <ExternalLink size={14} />
               {t('open_client_channel')}
             </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-12">
        
        {/* Quick Command Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Notion Hub', url: workspace.notionUrl || workspace.client?.notionLink, icon: BookOpen, color: 'text-slate-800 dark:text-white', bg: 'bg-slate-100 dark:bg-white/5' },
            { label: 'Cloud Drive', url: workspace.driveUrl, icon: HardDrive, color: 'text-brand-500', bg: 'bg-brand-500/10' },
            { label: 'Brand Book', url: workspace.brandUrl, icon: Palette, color: 'text-amber-500', bg: 'bg-amber-500/10' }
          ].map((asset, i) => (
            <a 
              key={i}
              href={asset.url || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`group p-6 rounded-2xl border transition-all duration-300 flex items-center gap-5 ${asset.url ? 'bg-white dark:bg-[#0a0a0c]/40 border-slate-200 dark:border-white/10 hover:border-brand-500 shadow-sm' : 'opacity-40 grayscale cursor-not-allowed border-dashed border-slate-200 dark:border-white/10'}`}
            >
              <div className={`w-12 h-12 rounded-xl ${asset.bg} flex items-center justify-center ${asset.color} group-hover:scale-110 transition-transform`}>
                <asset.icon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white tracking-tight uppercase text-[11px]">{asset.label}</h4>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{asset.url ? 'Active Connection' : 'Link Pending'}</p>
              </div>
              {asset.url && <ArrowUpRight size={14} className="ml-auto text-slate-300 group-hover:text-brand-500 transition-all" />}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-12">
            <div className="flex items-center justify-between px-2 pb-4 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <Layout size={20} className="text-brand-500" />
                {t('editorial_timeline')}
              </h2>
              <button 
                onClick={() => setShowAddPhase(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                <Plus size={16} />
                {t('new_month')}
              </button>
            </div>

            <div className="space-y-10">
              {(workspace.phases || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((p, idx) => (
                <div key={p.id} className="relative">
                  <div className="absolute left-6 top-16 bottom-0 w-px bg-slate-100 dark:bg-white/5 hidden md:block" />
                  
                  <div 
                    onClick={() => togglePhase(p.id)}
                    className="flex items-center gap-6 mb-6 group cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm z-10 transition-all ${expandedPhases[p.id] ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/30 border-brand-500' : 'bg-white dark:bg-[#0a0a0c] border border-slate-100 dark:border-white/5 text-slate-400'}`}>
                      {(workspace.phases || []).length - idx}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={(e) => { e.stopPropagation(); setShowAddTask(p.id); }} className="p-2 hover:bg-brand-500/10 text-brand-500 rounded-lg"><Plus size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDeletePhase(p.id); }} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  {expandedPhases[p.id] && (
                    <div className="md:ml-20 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-black/20 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                            <th className="px-6 py-4">{t('video_title')}</th>
                            <th className="px-4 py-4 text-center w-24">{t('script')}</th>
                            <th className="px-4 py-4 text-center w-24">{t('edit')}</th>
                            <th className="px-4 py-4 text-center w-24">{t('thumbnail')}</th>
                            <th className="px-6 py-4 text-center w-36">{t('publish_date')}</th>
                            <th className="px-4 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {loadingTasks[p.id] ? (
                            <tr><td colSpan="6" className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-brand-500" size={24} /></td></tr>
                          ) : (phaseTasks[p.id] || []).length === 0 ? (
                            <tr><td colSpan="6" className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest italic">{t('tasks_empty')}</td></tr>
                          ) : phaseTasks[p.id].map(task => {
                            const meta = parseTaskMeta(task.description);
                            const deadline = task.deadline ? new Date(task.deadline) : null;
                            const isUrgent = deadline && (deadline - new Date()) / (3600000) <= 24 && (deadline - new Date()) > 0;

                            return (
                              <tr key={task.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{task.title}</span>
                                    {isUrgent && <span className="text-sm animate-pulse" title="Due in <24h">⏳</span>}
                                  </div>
                                </td>

                                {['script', 'edit', 'thumb'].map(field => (
                                  <td key={field} className="px-4 py-5">
                                    <button 
                                      onClick={() => toggleSubStatus(task, p.id, field)}
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all active:scale-90 ${taskStatusConfig[meta[field] || 'NOT_STARTED'].bg} ${taskStatusConfig[meta[field] || 'NOT_STARTED'].color}`}
                                    >
                                      {(() => {
                                        const Icon = taskStatusConfig[meta[field] || 'NOT_STARTED'].icon;
                                        return <Icon size={14} strokeWidth={3} />;
                                      })()}
                                    </button>
                                  </td>
                                ))}

                                <td className="px-6 py-5 text-center">
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    {deadline ? deadline.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '--'}
                                  </span>
                                </td>

                                <td className="px-4 py-5 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => setShowNotes(task.id)} className="p-2 text-slate-400 hover:text-brand-500 transition-all"><MessageSquare size={14} /></button>
                                    <button onClick={() => handleDeleteTask(task.id, p.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
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
              ))}
            </div>
          </div>

          <div className="space-y-10">
            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                 <Activity size={16} className="text-emerald-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('stats')}</h4>
               </div>
               <div className="space-y-6">
                 <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Health</p>
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Operational Mode</span>
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Partner Details</h4>
               <div className="space-y-6">
                 <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400"><Users size={16} /></div>
                   <div>
                     <p className="text-xs font-bold text-slate-800 dark:text-white">{workspace.client?.user?.firstName} {workspace.client?.user?.lastName}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase">Primary Contact</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400"><Globe size={16} /></div>
                   <div>
                     <p className="text-xs font-bold text-slate-800 dark:text-white">{workspace.client?.company || 'Organization'}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase">Partner</p>
                   </div>
                 </div>
               </div>
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
