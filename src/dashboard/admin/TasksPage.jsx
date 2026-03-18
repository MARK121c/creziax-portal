import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getWorkspacesAPI, 
  getWorkspaceAPI,
  getUsersAPI, 
  getPhaseTasksAPI, 
  updateWorkspaceTaskAPI,
  createWorkspaceTaskAPI,
  getTasksAPI,
  createTaskAPI,
  updateTaskAPI,
  deleteTaskAPI
} from '../../store/api';
import { 
  Plus, X, Trash2, Layout, Search, Briefcase, Calendar, Loader2, 
  CheckCircle2, Clock, PlayCircle, FileText, ExternalLink, Filter, 
  ChevronRight, Activity, ShieldCheck, MessageSquare, AlertCircle,
  CheckCircle, ListTodo, User, SlidersHorizontal, ArrowUpDown,
  UserCheck, ShieldAlert, Zap, Target, Timer
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
  const [activeTab, setActiveTab] = useState('production'); // 'production' | 'team'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data
  const [productionTasks, setProductionTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    projectId: 'ALL',
    assigneeId: 'ALL',
    stage: 'ALL', 
    status: 'ALL', 
    search: ''
  });
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modals
  const [showNotes, setShowNotes] = useState(null);
  const [showAddProdTask, setShowAddProdTask] = useState(false);
  const [showAddTeamTask, setShowAddTeamTask] = useState(false);
  const [prodTaskForm, setProdTaskForm] = useState({ title: '', deadline: '', workspaceId: '', phaseId: '', assignedToId: '' });
  const [teamTaskForm, setTeamTaskForm] = useState({ title: '', description: '', deadline: '', assignedToId: '', workspaceId: '' });

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

  const isTaskOverdue = (task) => {
    if (task.status === 'DELIVERED') return false; // Map DELIVERED to COMPLETED
    if (!task.deadline) return false;
    return new Date() > new Date(task.deadline);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, uRes, tRes] = await Promise.all([
        getWorkspacesAPI(),
        getUsersAPI(),
        getTasksAPI()
      ]);
      
      const allWorkspacesShort = wRes.data.data || wRes.data || [];
      const allUsers = (uRes.data.data || uRes.data || []).filter(u => u.role === 'TEAM' || u.role === 'ADMIN');
      const allTeamTasks = tRes.data.data || tRes.data || [];
      
      setWorkspaces(allWorkspacesShort);
      setTeamMembers(allUsers);
      setTeamTasks(allTeamTasks);

      let aggregatedProdTasks = [];
      for (const wsShort of allWorkspacesShort) {
        try {
          const wsRes = await getWorkspaceAPI(wsShort.id);
          const wsDetail = wsRes.data.data || wsRes.data;
          if (wsDetail.phases && wsDetail.phases.length > 0) {
            for (const ph of wsDetail.phases) {
              const ptRes = await getPhaseTasksAPI(ph.id);
              const phaseTasks = ptRes.data.data || ptRes.data || [];
              aggregatedProdTasks = [...aggregatedProdTasks, ...phaseTasks.map(t => ({
                ...t,
                workspaceName: wsDetail.name,
                workspaceId: wsDetail.id,
                phaseName: ph.name,
                phaseId: ph.id
              }))];
            }
          }
        } catch (err) {}
      }
      setProductionTasks(aggregatedProdTasks);

    } catch (err) {
      toast.error(t('error_general'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Production Logic
  const handleProdTaskUpdate = async (taskId, updates) => {
    try {
      const res = await updateWorkspaceTaskAPI(taskId, updates);
      const updated = res.data?.data || res.data;
      setProductionTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    } catch (err) { toast.error(t('error_general')); }
  };

  const toggleProdSubStatus = async (task, field) => {
    const meta = parseTaskMeta(task.description);
    const newVal = meta[field] === 'DONE' ? 'NOT_STARTED' : 'DONE';
    const newMeta = { ...meta, [field]: newVal };
    const optimistic = { ...task, description: JSON.stringify(newMeta) };
    setProductionTasks(prev => prev.map(t => t.id === task.id ? optimistic : t));
    try { await updateWorkspaceTaskAPI(task.id, { description: JSON.stringify(newMeta) }); } 
    catch (err) { fetchData(); }
  };

  const handleAddProdTask = async (e) => {
    e.preventDefault();
    if (!prodTaskForm.phaseId) return toast.error('يرجى اختيار الشهر');
    setSubmitting(true);
    try {
      const initialMeta = JSON.stringify({ script: 'NOT_STARTED', shoot: 'NOT_STARTED', edit: 'NOT_STARTED', publish: 'NOT_STARTED' });
      await createWorkspaceTaskAPI(prodTaskForm.phaseId, { ...prodTaskForm, description: initialMeta });
      toast.success(t('saved_successfully'));
      setShowAddProdTask(false);
      setProdTaskForm({ title: '', deadline: '', workspaceId: '', phaseId: '', assignedToId: '' });
      fetchData();
    } catch (err) { toast.error(t('error_general')); }
    finally { setSubmitting(false); }
  };

  // Team Logic
  const handleTeamStatusToggle = async (task) => {
    // Map internal Pending/Done to backend IDEA/DELIVERED
    const newStatus = task.status === 'DELIVERED' ? 'IDEA' : 'DELIVERED';
    const optimistic = { ...task, status: newStatus };
    setTeamTasks(prev => prev.map(t => t.id === task.id ? optimistic : t));
    try { 
      await updateTaskAPI(task.id, { status: newStatus }); 
    } catch (err) { 
      console.error('Task status update failed:', err);
      fetchData(); 
    }
  };

  const handleAddTeamTask = async (e) => {
    e.preventDefault();
    if (!teamTaskForm.workspaceId) {
      toast.error('يرجى اختيار المشروع المرتبط (لأسباب إدارية)');
      return;
    }
    setSubmitting(true);
    try {
      // Find the selected user's TeamMember ID
      const selectedUser = teamMembers.find(u => u.id === teamTaskForm.assignedToId);
      const tmId = selectedUser?.teamMemberInfo?.id || teamTaskForm.assignedToId;

      const taskData = {
        title: teamTaskForm.title,
        description: teamTaskForm.description,
        assignedToId: tmId,
        deadline: teamTaskForm.deadline,
        projectId: teamTaskForm.workspaceId,
        status: 'IDEA' // Pending
      };
      
      await createTaskAPI(taskData);
      toast.success(t('saved_successfully'));
      setShowAddTeamTask(false);
      setTeamTaskForm({ title: '', description: '', deadline: '', assignedToId: '', workspaceId: '' });
      fetchData();
    } catch (err) { 
      console.error('Team task creation failed:', err);
      toast.error('حدث خطأ أثناء إنشاء المهمة. تأكد من إدخال جميع البيانات.'); 
    }
    finally { setSubmitting(false); }
  };

  const handleDeleteTeamTask = async (id) => {
    if (!confirm(t('confirm_delete'))) return;
    try { await deleteTaskAPI(id); fetchData(); } catch (err) {}
  };

  // Filtering & Stats
  const filteredProduction = useMemo(() => {
    return productionTasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(filters.search.toLowerCase()) || t.workspaceName.toLowerCase().includes(filters.search.toLowerCase());
      const matchesProject = filters.projectId === 'ALL' || t.workspaceId === filters.projectId;
      const matchesAssignee = filters.assigneeId === 'ALL' || t.assignedToId === filters.assigneeId;
      return matchesSearch && matchesProject && matchesAssignee;
    }).sort((a,b) => sortOrder === 'ASC' ? new Date(a.deadline) - new Date(b.deadline) : new Date(b.deadline) - new Date(a.deadline));
  }, [productionTasks, filters, sortOrder]);

  const filteredTeam = useMemo(() => {
    return teamTasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(filters.search.toLowerCase()) || (t.description || '').toLowerCase().includes(filters.search.toLowerCase());
      const matchesAssignee = filters.assigneeId === 'ALL' || t.assignedToId === filters.assigneeId;
      
      let matchesStatus = true;
      if (filters.status !== 'ALL') {
        if (filters.status === 'OVERDUE') {
           matchesStatus = (t.status === 'IDEA' && isTaskOverdue(t));
        } else if (filters.status === 'PENDING') {
           matchesStatus = (t.status === 'IDEA');
        } else if (filters.status === 'COMPLETED') {
           matchesStatus = (t.status === 'DELIVERED');
        }
      }
      return matchesSearch && matchesAssignee && matchesStatus;
    }).sort((a,b) => sortOrder === 'ASC' ? new Date(a.deadline) - new Date(b.deadline) : new Date(b.deadline) - new Date(a.deadline));
  }, [teamTasks, filters, sortOrder]);

  const teamStats = useMemo(() => {
    const overdue = teamTasks.filter(t => t.status === 'IDEA' && isTaskOverdue(t));
    const counts = {};
    overdue.forEach(t => {
      const name = t.assignedTo?.firstName || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return { 
      totalOverdue: overdue.length,
      userBreaks: Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 3)
    };
  }, [teamTasks]);

  if (loading && productionTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <Loader2 size={64} className="animate-spin text-brand-500 mb-8 opacity-20" />
        <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">جاري مزامنة محرك الالتزام والإنتاج...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans pb-20">
      
      <div className="max-w-[1600px] mx-auto p-10 md:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-5">
              <ListTodo size={32} className="text-brand-500" />
              مركز المهام الشامل
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 opacity-60">محرك الالتزام الموحد - إصدار 3.4</p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
             <button onClick={() => setActiveTab('production')} className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'production' ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>توجيه الإنتاج</button>
             <button onClick={() => setActiveTab('team')} className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'team' ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-400 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>مهام الفريق</button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             {activeTab === 'production' ? (
                <button onClick={() => setShowAddProdTask(true)} className="flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 active:scale-95"><Plus size={18} />إضافة فيديو جديد</button>
             ) : (
                <button onClick={() => setShowAddTeamTask(true)} className="flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 active:scale-95"><Plus size={18} />مهمة إدارية جديدة</button>
             )}
          </div>
        </div>

        {/* Accountability Stats (Only for Team Tab) */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 p-8 rounded-[2rem] shadow-xl flex items-center gap-6">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center"><ShieldAlert size={32} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 text-right">إجمالي المخالفات</p>
                   <p className="text-3xl font-black text-slate-800 dark:text-white uppercase text-right">{teamStats.totalOverdue}</p>
                </div>
             </div>
             {teamStats.userBreaks.map(([name, count]) => (
                <div key={name} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 p-8 rounded-[2rem] shadow-xl flex items-center gap-6">
                   <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-black text-xl">{count}</div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 text-right">تحذيرات: {name}</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white uppercase text-right">Overdue: {count}</p>
                   </div>
                </div>
             ))}
          </div>
        )}

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              <input type="text" placeholder="بحث سريع..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="pl-12 pr-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none w-64 shadow-sm" />
            </div>
            {activeTab === 'production' && (
              <select value={filters.projectId} onChange={e => setFilters({...filters, projectId: e.target.value})} className="px-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer">
                <option value="ALL">كل المشاريع</option>
                {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
            )}
            <select value={filters.assigneeId} onChange={e => setFilters({...filters, assigneeId: e.target.value})} className="px-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer">
              <option value="ALL">كل المسؤولين</option>
              {teamMembers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
            {activeTab === 'team' && (
              <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="px-6 py-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer">
                <option value="ALL">كل الحالات</option>
                <option value="PENDING">قيد التنفيذ</option>
                <option value="COMPLETED">تم الانتهاء</option>
                <option value="OVERDUE">متأخر (Penalty)</option>
              </select>
            )}
            <button onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')} className="p-4 bg-white dark:bg-white/5 text-slate-400 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm transition-all hover:text-brand-500"><ArrowUpDown size={18} className={sortOrder === 'DESC' ? 'rotate-180' : ''} /></button>
        </div>

        {/* View Content */}
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
          {activeTab === 'production' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                  <th className="px-8 py-6">المشروع</th>
                  <th className="px-8 py-6 text-right rtl">عنوان الفيديو</th>
                  <th className="px-4 py-6 text-center">المسؤول</th>
                  <th className="px-4 py-6 text-center w-20">الاسكربت</th>
                  <th className="px-4 py-6 text-center w-20">التصوير</th>
                  <th className="px-4 py-6 text-center w-20">المونتاج</th>
                  <th className="px-4 py-6 text-center w-20">النشر</th>
                  <th className="px-8 py-6 text-center">تاريخ النشر</th>
                  <th className="px-4 py-6 text-right w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filteredProduction.length === 0 ? (
                  <tr><td colSpan="9" className="py-32 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic opacity-50">قائمة الإنتاج فارغة حالياً</td></tr>
                ) : filteredProduction.map(t => {
                  const meta = parseTaskMeta(t.description);
                  return (
                    <tr key={t.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 text-brand-600 rounded-xl text-[9px] font-black uppercase tracking-widest">{t.workspaceName}</div>
                      </td>
                      <td className="px-8 py-6 text-right rtl">
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.title}</span>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{t.phaseName}</p>
                      </td>
                      <td className="px-4 py-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden mx-auto shadow-sm">
                          {t.assignedTo?.user?.avatarUrl ? <img src={getFormattedUrl(t.assignedTo.user.avatarUrl)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">{t.assignedTo?.user?.firstName?.[0] || <User size={14} />}</div>}
                        </div>
                      </td>
                      {['script', 'shoot', 'edit', 'publish'].map(f => (
                         <td key={f} className="px-4 py-6 text-center">
                           <button onClick={() => toggleProdSubStatus(t, f)} className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all shadow-sm border-2 ${taskStatusConfig[meta[f] || 'NOT_STARTED'].bg} ${taskStatusConfig[meta[f] || 'NOT_STARTED'].color} border-transparent`}>
                             {(() => { const Icon = taskStatusConfig[meta[f] || 'NOT_STARTED'].icon; return <Icon size={16} strokeWidth={3} />; })()}
                           </button>
                         </td>
                      ))}
                      <td className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         {t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase() : '--'}
                      </td>
                      <td className="px-4 py-6 text-right">
                         <button onClick={() => setShowNotes(t.id)} className="p-3 text-slate-300 hover:text-brand-500 transition-all"><MessageSquare size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-right rtl">
                  <th className="px-8 py-6 text-left">المسؤول</th>
                  <th className="px-8 py-6">المهمة المطلوبة</th>
                  <th className="px-8 py-6 text-center">الالتزام (Deadline)</th>
                  <th className="px-8 py-6 text-center w-32">الحالة</th>
                  <th className="px-8 py-6 text-center">الجزاءات (Penalty)</th>
                  <th className="px-4 py-6 text-right w-16 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5 text-right rtl">
                {filteredTeam.length === 0 ? (
                  <tr><td colSpan="6" className="py-32 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic opacity-50">لا توجد مهام إدارية حالياً</td></tr>
                ) : filteredTeam.map(t => {
                  const overdue = isTaskOverdue(t);
                  return (
                    <tr key={t.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6 text-left">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                             {t.assignedTo?.user?.avatarUrl ? <img src={getFormattedUrl(t.assignedTo.user.avatarUrl)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-400">{t.assignedTo?.user?.firstName?.[0] || 'U'}</div>}
                           </div>
                           <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{t.assignedTo?.user?.firstName} {t.assignedTo?.user?.lastName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.title}</span>
                         <p className="text-[10px] text-slate-400 font-medium mt-1 line-clamp-1">{t.description || 'بدون وصف إضافي'}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${overdue ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                            <Timer size={12} />
                            {t.deadline ? new Date(t.deadline).toLocaleString('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase() : '--'}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <button onClick={() => handleTeamStatusToggle(t)} className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-all shadow-xl active:scale-90 ${t.status === 'DELIVERED' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-500 border border-slate-200 dark:border-white/10'}`}>
                            {t.status === 'DELIVERED' ? <CheckCircle size={24} strokeWidth={3} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-40"></div>}
                         </button>
                      </td>
                      <td className="px-8 py-6 text-center">
                         {t.status === 'IDEA' && overdue ? (
                           <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-sm">
                              <ShieldAlert size={14} />
                              ⚠️ تحذير: -3% خصم أداء
                           </div>
                         ) : t.status === 'DELIVERED' ? (
                           <div className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-60">
                              <Zap size={14} /> التزام ممتاز
                           </div>
                         ) : (
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic opacity-40">-- لا توجد مخالفات --</span>
                         )}
                      </td>
                      <td className="px-4 py-6 text-right">
                         <button onClick={() => handleDeleteTeamTask(t.id)} className="p-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddProdTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/95 backdrop-blur-md animate-in fade-in" onClick={() => setShowAddProdTask(false)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 text-right rtl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">إضافة فيديو جديد</h3>
                <button onClick={() => setShowAddProdTask(false)} className="p-4 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-white/5 rounded-2xl"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddProdTask} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المشروع / العميل</label>
                    <select value={prodTaskForm.workspaceId} onChange={async (e) => {
                      const id = e.target.value;
                      setProdTaskForm({...prodTaskForm, workspaceId: id, phaseId: ''});
                      if(id) {
                        const r = await getWorkspaceAPI(id); 
                        setWorkspaces(prev => prev.map(w => w.id === id ? (r.data.data || r.data) : w));
                      }
                    }} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                      <option value="">اختر المشروع...</option>
                      {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  {prodTaskForm.workspaceId && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الشهر (Phase)</label>
                        <select value={prodTaskForm.phaseId} onChange={e => setProdTaskForm({...prodTaskForm, phaseId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                          <option value="">اختر الشهر...</option>
                          {(workspaces.find(w => w.id === prodTaskForm.workspaceId)?.phases || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                  )}
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عنوان الفيديو</label>
                     <input value={prodTaskForm.title} onChange={e => setProdTaskForm({...prodTaskForm, title: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المسؤول</label>
                     <select value={prodTaskForm.assignedToId} onChange={e => setProdTaskForm({...prodTaskForm, assignedToId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                        <option value="">اختر المسؤول...</option>
                        {teamMembers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ النشر</label>
                    <input type="date" value={prodTaskForm.deadline} onChange={e => setProdTaskForm({...prodTaskForm, deadline: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30 uppercase tracking-[0.2em] text-xs transition-all active:scale-95">{submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'إضـافـة الـفـيـديـو'}</button>
              </form>
           </div>
        </div>
      )}

      {showAddTeamTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/95 backdrop-blur-md animate-in fade-in" onClick={() => setShowAddTeamTask(false)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 text-right rtl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">مهمة إدارية جديدة</h3>
                <button onClick={() => setShowAddTeamTask(false)} className="p-4 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-white/5 rounded-2xl"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddTeamTask} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block">اسم المهمة</label>
                     <input value={teamTaskForm.title} onChange={e => setTeamTaskForm({...teamTaskForm, title: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block">وصف المهمة المطلوبة</label>
                    <textarea value={teamTaskForm.description} onChange={e => setTeamTaskForm({...teamTaskForm, description: e.target.value})} rows={3} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block">المشروع المرتبط (للتنظيم)</label>
                    <select value={teamTaskForm.workspaceId} onChange={e => setTeamTaskForm({...teamTaskForm, workspaceId: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                        <option value="">اختر المشروع/العميل...</option>
                        {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block">الشخص المسؤول</label>
                     <select value={teamTaskForm.assignedToId} onChange={e => setTeamTaskForm({...teamTaskForm, assignedToId: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                        <option value="">اختر الشخص...</option>
                        {teamMembers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block">تاريخ ووقت الاستحقاق (Deadline)</label>
                    <input type="datetime-local" value={teamTaskForm.deadline} onChange={e => setTeamTaskForm({...teamTaskForm, deadline: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30 uppercase tracking-[0.2em] text-xs transition-all active:scale-95">{submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'إصـدار الـمـهـمـة الـآن'}</button>
              </form>
           </div>
        </div>
      )}

      {/* Production Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 z-[110] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowNotes(null)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] w-full max-w-lg h-full shadow-[-20px_0_60px_rgba(0,0,0,0.1)] relative z-10 flex flex-col animate-in slide-in-from-right duration-500">
              <div className="px-10 py-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">ملاحظات الإنتاج</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">توجيهات إبداعية وتوثيق الملفات</p>
                </div>
                <button onClick={() => setShowNotes(null)} className="p-4 text-slate-400 hover:text-rose-500 bg-white dark:bg-white/5 shadow-xl rounded-[1.25rem] transition-all"><X size={24} /></button>
              </div>
              <div className="p-10 flex-1 flex flex-col space-y-8 overflow-y-auto">
                <textarea id="notes-ta-global" className="w-full flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-[2rem] p-8 text-sm font-medium outline-none resize-none" defaultValue={productionTasks.find(t => t.id === showNotes)?.privateNotes || ''} />
                <button onClick={async () => {
                  const val = document.getElementById('notes-ta-global').value;
                  const t = productionTasks.find(x => x.id === showNotes);
                  await handleProdTaskUpdate(showNotes, { privateNotes: val });
                  toast.success('تم الحفظ');
                }} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">نشر الملاحظات</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default TasksPage;
