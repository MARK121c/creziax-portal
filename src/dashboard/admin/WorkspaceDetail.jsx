import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getWorkspaceAPI, 
  getUsersAPI, 
  getPhaseTasksAPI, 
  updateWorkspaceTaskAPI, 
  createPhaseAPI, 
  deletePhaseAPI, 
  createWorkspaceTaskAPI, 
  deleteWorkspaceTaskAPI,
  uploadImageAPI
} from '../../store/api';
import { 
  Plus, X, Trash2, Layout, Search, Briefcase, Calendar, Loader2, 
  CheckCircle2, Clock, PlayCircle, FileText, ExternalLink, Filter, 
  ChevronRight, Activity, ShieldCheck, MessageSquare, AlertCircle,
  FileCode, Scissors, Palette, Settings, MoreVertical, Edit2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const taskStatusConfig = {
  NOT_STARTED: { label: 'انتظار', color: 'text-slate-300', bg: 'bg-slate-50 dark:bg-white/5', icon: Clock },
  DONE: { label: 'تم', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
};

const getFormattedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const WorkspaceDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Phase handling
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: '', startDate: '', endDate: '' });
  const [expandedPhases, setExpandedPhases] = useState({});
  const [phaseTasks, setPhaseTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});

  // Task handling
  const [showAddTask, setShowAddTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', deadline: '', assignedToId: '' });
  const [showNotes, setShowNotes] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, uRes] = await Promise.all([
        getWorkspaceAPI(id),
        getUsersAPI()
      ]);
      const data = wRes.data.data || wRes.data;
      setWorkspace(data);
      setTeamMembers((uRes.data.data || uRes.data || []).filter(u => u.role === 'TEAM'));
      
      if (data?.phases && data.phases.length > 0) {
        const sorted = [...data.phases].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestId = sorted[0]?.id;
        if (latestId && !expandedPhases[latestId]) {
          setExpandedPhases({ [latestId]: true });
          loadPhaseTasks(latestId);
        }
      }
    } catch (err) {
      toast.error(t('loading'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
  }, [id, fetchData]);

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => {
      const isExpanding = !prev[phaseId];
      if (isExpanding && !phaseTasks[phaseId]) {
        loadPhaseTasks(phaseId);
      }
      return { ...prev, [phaseId]: isExpanding };
    });
  };

  const handleAddPhase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createPhaseAPI(id, phaseForm);
      const newPhase = res.data?.data || res.data;
      
      toast.success(t('saved_successfully'));
      setShowAddPhase(false);
      setPhaseForm({ name: '', startDate: '', endDate: '' });
      
      // Update local state to show new phase immediately
      setWorkspace(prev => ({
        ...prev,
        phases: [newPhase, ...(prev.phases || [])]
      }));
      
      // If the new phase is a month (e.g. "March 2024"), expand it
      if (newPhase?.id) {
        setExpandedPhases(prev => ({ ...prev, [newPhase.id]: true }));
        setPhaseTasks(prev => ({ ...prev, [newPhase.id]: [] }));
      }
    } catch (err) { toast.error(t('error_general')); }
    finally { setSubmitting(false); }
  };

  const handleDeletePhase = async (phaseId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشهر؟ سيتم حذف جميع المهام بداخله.')) return;
    try {
      await deletePhaseAPI(phaseId);
      toast.success('تم حذف الشهر بنجاح');
      fetchData();
    } catch (err) {
      toast.error('فشل حذف الشهر');
    }
  };

  const loadPhaseTasks = useCallback(async (phaseId) => {
    setLoadingTasks(prev => ({ ...prev, [phaseId]: true }));
    try {
      const res = await getPhaseTasksAPI(phaseId);
      const tasks = res.data.data || res.data;
      setPhaseTasks(prev => ({ ...prev, [phaseId]: tasks }));
    } catch (err) {
      toast.error(t('failed_load_tasks'));
    } finally {
      setLoadingTasks(prev => ({ ...prev, [phaseId]: false }));
    }
  }, [t]);

  const handleTaskUpdate = async (taskId, phaseId, updates) => {
    try {
      const res = await updateWorkspaceTaskAPI(taskId, updates);
      const updatedTask = res.data?.data || res.data;
      if (updatedTask && updatedTask.id) {
        setPhaseTasks(prev => ({
          ...prev,
          [phaseId]: (prev[phaseId] || []).map(t => t.id === taskId ? updatedTask : t)
        }));
      } else {
        await loadPhaseTasks(phaseId);
      }
    } catch (err) {
      toast.error(t('error_general'));
    }
  };

  const toggleSubStatus = async (task, phaseId, field) => {
    const meta = parseTaskMeta(task.description);
    const newVal = meta[field] === 'DONE' ? 'NOT_STARTED' : 'DONE';
    const newMeta = { ...meta, [field]: newVal };
    
    // Optimistic Update
    const optimisticTask = { ...task, description: JSON.stringify(newMeta) };
    setPhaseTasks(prev => ({
      ...prev,
      [phaseId]: (prev[phaseId] || []).map(t => t.id === task.id ? optimisticTask : t)
    }));

    try {
      await updateWorkspaceTaskAPI(task.id, { description: JSON.stringify(newMeta) });
    } catch (err) {
      toast.error('فشل تحديث الحالة');
      loadPhaseTasks(phaseId);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const initialMeta = JSON.stringify({ script: 'NOT_STARTED', shoot: 'NOT_STARTED', edit: 'NOT_STARTED', publish: 'NOT_STARTED' });
      await createWorkspaceTaskAPI(showAddTask, { ...taskForm, description: initialMeta });
      toast.success(t('saved_successfully'));
      loadPhaseTasks(showAddTask);
      setShowAddTask(null);
      setTaskForm({ title: '', deadline: '', assignedToId: '' });
    } catch (err) { toast.error(t('error_general')); }
    finally { setSubmitting(false); }
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
    try { 
      const parsed = JSON.parse(desc); 
      return {
        script: parsed.script || 'NOT_STARTED',
        shoot: parsed.shoot || 'NOT_STARTED',
        edit: parsed.edit || 'NOT_STARTED',
        publish: parsed.publish || 'NOT_STARTED'
      };
    } catch (e) { 
      return { script: 'NOT_STARTED', shoot: 'NOT_STARTED', edit: 'NOT_STARTED', publish: 'NOT_STARTED' }; 
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <Loader2 size={64} className="animate-spin text-brand-500 mb-8 opacity-20" />
        <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">{t('syncing_workspace')}</p>
      </div>
    );
  }

  if (!workspace) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
       <AlertCircle size={48} className="text-rose-500 mb-8" />
       <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">المشروع غير موجود</h2>
       <Link to="/admin/projects" className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">العودة للمشاريع</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans pb-20">
      
      {/* Sticky Premium Header */}
      <div className="sticky top-0 z-[50] bg-white/90 dark:bg-[#050505]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin/projects" className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-brand-500 border border-slate-100 dark:border-white/10 shadow-sm">
              <ChevronRight className="rotate-180" size={24} />
            </Link>
            <div className="flex items-center gap-5">
              {/* Logo Removed as per V3.2 Clean UI Request */}
              <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase leading-none">{workspace.name}</h1>
                <div className="flex items-center gap-2">
                   <div className="px-2.5 py-0.5 bg-brand-500/10 text-brand-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-brand-500/20">V3.2 ENGINE</div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{workspace.client?.user?.firstName} {workspace.client?.user?.lastName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             {/* Team Members Avatars Removed as per V3.2 Clean UI Request */}
             
             <div className="flex items-center gap-4">
               {workspace.notionUrl && (
                 <a 
                   href={workspace.notionUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-brand-500 hover:bg-brand-500/5 rounded-[1.5rem] transition-all border border-slate-200 dark:border-white/10 hover:border-brand-500/30 shadow-sm active:scale-95 group"
                   title="Notion Workspace"
                 >
                   <FileText size={18} className="group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">نـوشـن</span>
                 </a>
               )}
               <a 
                 href={workspace.clientChannelLink || '#'} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 active:scale-95 whitespace-nowrap"
               >
                 <PlayCircle size={18} />
                 قناة التواصل
               </a>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-10 md:p-12">
        
        {/* Production Engine Header */}
        <div className="flex items-center justify-between mb-16 border-b border-slate-100 dark:border-white/5 pb-10">
          <div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-5">
              <Activity size={32} className="text-brand-500" />
              محرك التشغيل الشهري
            </h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 opacity-60">Engine for High-Performance Youtube Operations</p>
          </div>
          <button 
            onClick={() => setShowAddPhase(true)}
            className="flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={20} />
             إضافة شهر جديد
          </button>
        </div>

        {/* Monthly Accordion Grid */}
        <div className="space-y-12">
          {(workspace.phases || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((p, idx) => (
            <div key={p.id} className="relative">
              <div 
                onClick={() => togglePhase(p.id)}
                className={`flex items-center gap-10 p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer group ${expandedPhases[p.id] ? 'bg-white dark:bg-[#0a0a0c] border-brand-500 shadow-2xl shadow-brand-500/10' : 'bg-white/40 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
              >
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl transition-all duration-500 ${expandedPhases[p.id] ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/40' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                  {(workspace.phases || []).length - idx}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Layout size={14} className="text-brand-500" />
                       {(phaseTasks[p.id] || []).length} فيديو
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">
                       Started {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 transition-all">
                   <button onClick={(e) => { e.stopPropagation(); setShowAddTask(p.id); }} className="p-4 bg-emerald-500/10 text-emerald-500 rounded-[1.25rem] hover:bg-emerald-500 hover:text-white transition-all"><Plus size={22} /></button>
                   <button onClick={(e) => { e.stopPropagation(); handleDeletePhase(p.id); }} className="p-4 bg-rose-500/10 text-rose-500 rounded-[1.25rem] hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={22} /></button>
                </div>
              </div>

              {expandedPhases[p.id] && (
                <div className="mt-6 ml-10 p-4 bg-white dark:bg-[#0a0a0c]/60 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                        <th className="px-8 py-6">عنوان الفيديو</th>
                        <th className="px-4 py-6 text-center w-24">الاسكربت</th>
                        <th className="px-4 py-6 text-center w-24">التصوير</th>
                        <th className="px-4 py-6 text-center w-24">المونتاج</th>
                        <th className="px-4 py-6 text-center w-24">النشر</th>
                        <th className="px-8 py-6 text-center w-40">تاريخ النشر</th>
                        <th className="px-8 py-6 text-center w-40">الحالة النهائية</th>
                        <th className="px-4 py-6 text-right w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {loadingTasks[p.id] ? (
                        <tr><td colSpan="8" className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-brand-500 opacity-20" /></td></tr>
                      ) : (phaseTasks[p.id] || []).length === 0 ? (
                        <tr><td colSpan="8" className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic opacity-50">قائمة المهام فارغة حالياً</td></tr>
                      ) : phaseTasks[p.id].map(task => {
                        const meta = parseTaskMeta(task.description);
                        const isFullyDone = meta.script === 'DONE' && meta.shoot === 'DONE' && meta.edit === 'DONE' && meta.publish === 'DONE';
                        
                        return (
                          <tr key={task.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="space-y-0.5">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{task.title}</span>
                                    <div className="flex items-center gap-3">
                                       {task.privateNotes && <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={10} /> يوجد ملاحظات</div>}
                                    </div>
                                  </div>
                                  <button onClick={() => setShowNotes(task.id)} className="p-2 ml-4 text-slate-300 hover:text-brand-500 transition-all opacity-0 group-hover:opacity-100 bg-slate-50 dark:bg-white/5 rounded-lg"><MessageSquare size={14} /></button>
                               </div>
                            </td>
                            {['script', 'shoot', 'edit', 'publish'].map(field => (
                               <td key={field} className="px-4 py-6">
                                 <button 
                                   onClick={() => toggleSubStatus(task, p.id, field)}
                                   className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all shadow-sm active:scale-90 border-2 ${taskStatusConfig[meta[field] || 'NOT_STARTED'].bg} ${taskStatusConfig[meta[field] || 'NOT_STARTED'].color} border-transparent hover:border-current/20`}
                                   title={taskStatusConfig[meta[field] || 'NOT_STARTED'].label}
                                 >
                                   {(() => {
                                     const Icon = taskStatusConfig[meta[field] || 'NOT_STARTED'].icon;
                                     return <Icon size={18} strokeWidth={3} />;
                                   })()}
                                 </button>
                               </td>
                            ))}
                            <td className="px-8 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                               {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase() : '--'}
                            </td>
                            <td className="px-8 py-6 text-center">
                               {isFullyDone ? (
                                 <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                   <CheckCircle2 size={12} strokeWidth={3} />
                                   تم الانتهاء
                                 </div>
                               ) : (
                                 <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                                   تحت العمل
                                 </div>
                               )}
                            </td>
                            <td className="px-4 py-6 text-right">
                               <button onClick={() => handleDeleteTask(task.id, p.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
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

      {/* Modals */}
      {showAddPhase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowAddPhase(false)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-400">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">إضافة شهر جديد</h3>
                <button onClick={() => setShowAddPhase(false)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddPhase} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70 italic">اسم الشهر (مثال: مارس 2024)</label>
                    <input value={phaseForm.name} onChange={e => setPhaseForm({...phaseForm, name: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20" />
                 </div>
                 <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30 transition-all text-xs uppercase tracking-widest active:scale-95">{submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'حـفـظ الـبـيـانـات'}</button>
              </form>
           </div>
        </div>
      )}

      {showAddTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowAddTask(null)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-400">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">إضافة فيديو جديد</h3>
                <button onClick={() => setShowAddTask(null)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70 italic">عنوان الفيديو</label>
                    <input value={taskForm?.title || ''} onChange={e => setTaskForm(prev => ({...prev, title: e.target.value}))} required placeholder="مثال: كيف تصنع فيديو احترافي؟" className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70 italic">تاريخ النشر المتوقع</label>
                    <input type="date" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20" />
                 </div>
                 <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30 transition-all text-xs uppercase tracking-widest active:scale-95">{submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'إضـافـة لـلـقـائـمـة'}</button>
              </form>
           </div>
        </div>
      )}

      {showNotes && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowNotes(null)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] w-full max-w-lg h-full shadow-[-20px_0_60px_rgba(0,0,0,0.1)] relative z-10 flex flex-col animate-in slide-in-from-right duration-500">
              <div className="px-10 py-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">ملاحظات الإنتاج</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">Creative Brief & Asset Documentation</p>
                </div>
                <button onClick={() => setShowNotes(null)} className="p-4 text-slate-400 hover:text-rose-500 bg-white dark:bg-white/5 shadow-xl rounded-[1.25rem] transition-all active:scale-95"><X size={24} /></button>
              </div>
              <div className="p-10 flex-1 flex flex-col space-y-8 overflow-y-auto">
                <div className="space-y-4 flex-1 flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FileText size={14} className="text-brand-500" />
                    المسودة الإبداعية للمحتوى
                  </label>
                  <textarea 
                    id="notes-textarea"
                    className="w-full flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] p-8 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 resize-none leading-relaxed"
                    placeholder="اكتب ملاحظاتك هنا (سكريبت، تعديلات، تعليمات للمصمم...)"
                    defaultValue={(workspace.phases || []).flatMap(p => phaseTasks[p.id] || []).find(t => t.id === showNotes)?.privateNotes || ''}
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => {
                        const val = document.getElementById('notes-textarea').value;
                        const phaseId = (workspace.phases || []).find(p => (phaseTasks[p.id] || []).some(t => t.id === showNotes))?.id;
                        handleTaskUpdate(showNotes, phaseId, { privateNotes: val });
                        toast.success('تم نشر الملاحظات بنجاح');
                      }}
                      className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                    >
                      نشر الملاحظات
                    </button>
                  </div>
                </div>
                <div className="p-8 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] flex items-start gap-4">
                   <ShieldCheck size={20} className="text-emerald-500 mt-1" />
                   <div>
                     <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">تشفير وحفظ آمن</p>
                     <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">يتم مزامنة الملاحظات مع الفريق المسؤول مباشرة وبشكل آمن تماماً.</p>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;
