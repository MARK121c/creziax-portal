import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getWorkspacesAPI, 
  getUsersAPI, 
  getPhaseTasksAPI, 
  updateWorkspaceTaskAPI 
} from '../../store/api';
import { 
  Plus, X, Trash2, Layout, Search, Briefcase, Calendar, Loader2, 
  CheckCircle2, Clock, PlayCircle, FileText, ExternalLink, Filter, 
  ChevronRight, Activity, ShieldCheck, MessageSquare, AlertCircle,
  CheckCircle, ListTodo, User, SlidersHorizontal, ArrowUpDown
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

const TasksPage = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    projectId: 'ALL',
    assigneeId: 'ALL',
    stage: 'ALL', // script, shoot, edit, publish
    status: 'ALL', // DONE, NOT_STARTED
    search: ''
  });
  const [sortOrder, setSortOrder] = useState('ASC'); // ASC, DESC

  // Modals
  const [showNotes, setShowNotes] = useState(null);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, uRes] = await Promise.all([
        getWorkspacesAPI(),
        getUsersAPI()
      ]);
      
      const allWorkspaces = wRes.data.data || wRes.data || [];
      const allUsers = (uRes.data.data || uRes.data || []).filter(u => u.role === 'TEAM');
      
      setWorkspaces(allWorkspaces);
      setTeamMembers(allUsers);

      // Aggregate tasks from all phases of all workspaces
      let allTasks = [];
      for (const ws of allWorkspaces) {
        if (ws.phases && ws.phases.length > 0) {
          for (const ph of ws.phases) {
            try {
              const tRes = await getPhaseTasksAPI(ph.id);
              const phaseTasks = tRes.data.data || tRes.data || [];
              const tasksWithMeta = phaseTasks.map(task => ({
                ...task,
                workspaceName: ws.name,
                workspaceId: ws.id,
                phaseName: ph.name,
                phaseId: ph.id
              }));
              allTasks = [...allTasks, ...tasksWithMeta];
            } catch (err) {
              console.error(`Failed to load tasks for phase ${ph.id}`);
            }
          }
        }
      }
      setTasks(allTasks);

    } catch (err) {
      toast.error(t('error_general'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTaskUpdate = async (taskId, phaseId, updates) => {
    try {
      const res = await updateWorkspaceTaskAPI(taskId, updates);
      const updatedTask = res.data?.data || res.data;
      
      if (updatedTask && updatedTask.id) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
      } else {
        // Fallback: update matching tasks in state with local data
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      }
    } catch (err) {
      toast.error(t('error_general'));
    }
  };

  const toggleSubStatus = async (task, field) => {
    const meta = parseTaskMeta(task.description);
    const newVal = meta[field] === 'DONE' ? 'NOT_STARTED' : 'DONE';
    const newMeta = { ...meta, [field]: newVal };
    
    // Optimistic Update
    const optimisticTask = { ...task, description: JSON.stringify(newMeta) };
    setTasks(prev => prev.map(t => t.id === task.id ? optimisticTask : t));

    try {
      await updateWorkspaceTaskAPI(task.id, { description: JSON.stringify(newMeta) });
    } catch (err) {
      toast.error('فشل تحديث الحالة');
      fetchData(); // Rollback to source of truth
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      const meta = parseTaskMeta(task.description);
      const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                            task.workspaceName.toLowerCase().includes(filters.search.toLowerCase());
      const matchesProject = filters.projectId === 'ALL' || task.workspaceId === filters.projectId;
      const matchesAssignee = filters.assigneeId === 'ALL' || task.assignedToId === filters.assigneeId;
      
      let matchesStage = true;
      if (filters.stage !== 'ALL') {
        // If stage is selected, we might want to filter tasks where THAT stage is NOT DONE yet (pending)
        // or just focus on that stage's status. User said "Filter by Stage: script, edit, etc."
        // Let's assume they want to see tasks that HAVE that stage in a certain status.
        if (filters.status !== 'ALL') {
          matchesStage = meta[filters.stage] === filters.status;
        }
      } else if (filters.status !== 'ALL') {
        // Global status filter: if "DONE", show only fully finished videos?
        // Let's assume if status is "DONE" and no stage selected, show fully done.
        const isFullyDone = meta.script === 'DONE' && meta.shoot === 'DONE' && meta.edit === 'DONE' && meta.publish === 'DONE';
        matchesStage = filters.status === 'DONE' ? isFullyDone : !isFullyDone;
      }

      return matchesSearch && matchesProject && matchesAssignee && matchesStage;
    });

    // Sorting
    result.sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline) : new Date(0);
      const dateB = b.deadline ? new Date(b.deadline) : new Date(0);
      return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [tasks, filters, sortOrder]);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <Loader2 size={64} className="animate-spin text-brand-500 mb-8 opacity-20" />
        <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">جاري تجميع المهام من جميع المشاريع...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans pb-20">
      
      {/* Header & Smart Filters */}
      <div className="max-w-[1600px] mx-auto p-10 md:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-5">
              <ListTodo size={32} className="text-brand-500" />
              مركز المهام الشامل
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 opacity-60">Global Tasks Hub V3.3 - Unified Workflow</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="بحث في المهام..." 
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                className="pl-12 pr-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all w-64 shadow-sm"
              />
            </div>
            
            <select 
              value={filters.projectId}
              onChange={e => setFilters({...filters, projectId: e.target.value})}
              className="px-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm cursor-pointer"
            >
              <option value="ALL">كل المشاريع</option>
              {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
            </select>

            <select 
              value={filters.assigneeId}
              onChange={e => setFilters({...filters, assigneeId: e.target.value})}
              className="px-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm cursor-pointer"
            >
              <option value="ALL">كل المسؤولين</option>
              {teamMembers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>

            <select 
              value={filters.stage}
              onChange={e => setFilters({...filters, stage: e.target.value})}
              className="px-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm cursor-pointer"
            >
              <option value="ALL">كل المراحل</option>
              <option value="script">الاسكربت</option>
              <option value="shoot">التصوير</option>
              <option value="edit">المونتاج</option>
              <option value="publish">النشر</option>
            </select>

            <select 
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
              className="px-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm cursor-pointer"
            >
              <option value="ALL">كل الحالات</option>
              <option value="NOT_STARTED">قيد الانتظار</option>
              <option value="DONE">تم الانتهاء</option>
            </select>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
              <button 
                onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                className="p-3 bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                title="ترتيب حسب التاريخ"
              >
                <ArrowUpDown size={16} className={sortOrder === 'DESC' ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            </div>
          </div>
        </div>

        {/* Global Task Table */}
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                <th className="px-8 py-6">المشروع</th>
                <th className="px-8 py-6">عنوان الفيديو</th>
                <th className="px-4 py-6 text-center w-24">المسؤول</th>
                <th className="px-4 py-6 text-center w-20">الاسكربت</th>
                <th className="px-4 py-6 text-center w-20">التصوير</th>
                <th className="px-4 py-6 text-center w-20">المونتاج</th>
                <th className="px-4 py-6 text-center w-20">النشر</th>
                <th className="px-8 py-6 text-center w-40">تاريخ النشر</th>
                <th className="px-4 py-6 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Layout size={48} className="mb-6 text-slate-300" />
                      <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">All caught up!</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">لا توجد مهام معلقة حالياً تطابق الفلتر</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.map(task => {
                const meta = parseTaskMeta(task.description);
                const isUrgent = task.deadline && (new Date(task.deadline) - new Date()) < (48 * 60 * 60 * 1000) && (new Date(task.deadline) - new Date()) > 0;
                
                return (
                  <tr key={task.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/5 text-brand-600 dark:text-brand-400 border border-brand-500/10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                        <Briefcase size={10} />
                        {task.workspaceName}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{task.title}</span>
                            <div className="flex items-center gap-3">
                               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">{task.phaseName}</div>
                               {task.privateNotes && <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={10} /> ملاحظات</div>}
                            </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden mx-auto shadow-sm group-hover:scale-110 transition-transform">
                        {task.assignedTo?.avatarUrl ? (
                          <img src={getFormattedUrl(task.assignedTo.avatarUrl)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                            {task.assignedTo?.firstName?.[0] || <User size={14} />}
                          </div>
                        )}
                      </div>
                    </td>
                    {['script', 'shoot', 'edit', 'publish'].map(field => (
                       <td key={field} className="px-4 py-6">
                         <button 
                           onClick={() => toggleSubStatus(task, field)}
                           className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all shadow-sm active:scale-90 border-2 ${taskStatusConfig[meta[field] || 'NOT_STARTED'].bg} ${taskStatusConfig[meta[field] || 'NOT_STARTED'].color} border-transparent hover:border-current/20`}
                         >
                           {(() => {
                             const Icon = taskStatusConfig[meta[field] || 'NOT_STARTED'].icon;
                             return <Icon size={16} strokeWidth={3} />;
                           })()}
                         </button>
                       </td>
                    ))}
                    <td className="px-8 py-6 text-center whitespace-nowrap">
                       <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`}>
                          {isUrgent && <Clock size={12} className="animate-pulse" />}
                          {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase() : '--'}
                          {isUrgent && <span className="text-[8px] px-1.5 py-0.5 bg-rose-500/10 rounded-md ml-1">Urgent</span>}
                       </div>
                    </td>
                    <td className="px-4 py-6 text-right">
                       <button onClick={() => setShowNotes(task.id)} className="p-3 text-slate-300 hover:text-brand-500 bg-slate-50 dark:bg-white/5 rounded-xl transition-all shadow-sm"><MessageSquare size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Performance Footer */}
        {filteredTasks.length > 0 && (
          <div className="mt-10 flex items-center justify-between px-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Showing {filteredTasks.length} tasks matching criteria</p>
            {tasks.length > 50 && (
              <button className="px-8 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-500/10 hover:text-brand-500 transition-all">Load More Tasks</button>
            )}
          </div>
        )}
      </div>

      {/* Shared Notes Modal */}
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
                    id="notes-textarea-global"
                    className="w-full flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] p-8 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 resize-none leading-relaxed"
                    placeholder="اكتب ملاحظاتك هنا (سكريبت، تعديلات، تعليمات للمصمم...)"
                    defaultValue={tasks.find(t => t.id === showNotes)?.privateNotes || ''}
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={async () => {
                        const val = document.getElementById('notes-textarea-global').value;
                        const task = tasks.find(t => t.id === showNotes);
                        await handleTaskUpdate(showNotes, task.phaseId, { privateNotes: val });
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

export default TasksPage;
