import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getWorkspaceAPI, 
  getPhaseTasksAPI, 
  updateWorkspaceTaskAPI, 
  createPhaseAPI, 
  createWorkspaceTaskAPI,
  getUsersAPI,
  downloadInvoicePDFAPI
} from '../../store/api';
import { 
  Plus, X, Briefcase, Calendar, Loader2, CheckCircle2, Clock, 
  PlayCircle, FileText, ChevronDown, ChevronRight, ExternalLink, 
  DollarSign, Users, AlertCircle, MoreVertical, Edit2, UserPlus,
  Layout, BookOpen, HardDrive, Palette, Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const taskStatusConfig = {
  IDEA: { color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Idea' },
  SCRIPTING: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Scripting' },
  SHOOTING: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Shooting' },
  EDITING: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Editing' },
  REVIEW: { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Review' },
  DELIVERED: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Delivered' },
};

const WorkspaceDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [phaseTasks, setPhaseTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [showAddTask, setShowAddTask] = useState(null); // phaseId
  const [submitting, setSubmitting] = useState(false);
  const addNotification = useNotificationStore(state => state.addNotification);

  const [phaseForm, setPhaseForm] = useState({ name: '', startDate: '', endDate: '', amount: '' });
  const [taskForm, setTaskForm] = useState({ title: '', deadline: '', assignedToId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, uRes] = await Promise.all([
        getWorkspaceAPI(id),
        getUsersAPI()
      ]);
      setWorkspace(wRes.data);
      setTeamMembers(uRes.data.filter(u => u.role === 'TEAM'));
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
      setPhaseForm({ name: '', startDate: '', endDate: '', amount: '' });
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
      await createWorkspaceTaskAPI(showAddTask, taskForm);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
        <p className="font-bold tracking-widest uppercase text-xs text-slate-400">{t('syncing_workspaces')}</p>
      </div>
    );
  }

  if (!workspace) return <div>Workspace not found</div>;

  const currentPhase = workspace.phases?.[0]; // Assuming newest is latest
  const financialStatus = currentPhase?.invoice;
  const isOverdue = financialStatus?.status === 'PENDING' && 
                    new Date(financialStatus.dueDate) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
            <Link to="/admin/projects" className="hover:text-brand-500 transition-colors uppercase">Projects</Link>
            <ChevronRight size={12} />
            <span className="text-slate-800 dark:text-white uppercase">Workspace</span>
          </nav>
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                <Briefcase size={32} />
             </div>
             <div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                  {workspace.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                     <Users size={12} className="text-slate-400" />
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                       {workspace.client?.user?.firstName} {workspace.client?.user?.lastName} (Client)
                     </span>
                   </div>
                   {workspace.annualContractDate && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                        <Calendar size={12} className="text-blue-500" />
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                          Renewal: {new Date(workspace.annualContractDate).toLocaleDateString()}
                        </span>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-600/20">
            <Plus size={18} />
            <span>Project Action</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Pinned Assets Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <a href={workspace.notionUrl || '#'} target="_blank" rel="noopener noreferrer" className={`group p-6 rounded-[2rem] border transition-all duration-300 flex flex-col gap-4 ${workspace.notionUrl ? 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-800/20' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.05] grayscale cursor-not-allowed'}`}>
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-800 dark:text-white group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white tracking-tight uppercase text-sm">Notion Workspace</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{workspace.notionUrl ? 'Connected' : 'Not Linked'}</p>
              </div>
            </a>
            <a href={workspace.driveUrl || '#'} target="_blank" rel="noopener noreferrer" className={`group p-6 rounded-[2rem] border transition-all duration-300 flex flex-col gap-4 ${workspace.driveUrl ? 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-brand-500/20' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.05] grayscale cursor-not-allowed'}`}>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                <HardDrive size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white tracking-tight uppercase text-sm">Asset Drive</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{workspace.driveUrl ? 'Connected' : 'Not Linked'}</p>
              </div>
            </a>
            <a href={workspace.brandUrl || '#'} target="_blank" rel="noopener noreferrer" className={`group p-6 rounded-[2rem] border transition-all duration-300 flex flex-col gap-4 ${workspace.brandUrl ? 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-amber-500/20' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.05] grayscale cursor-not-allowed'}`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Palette size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white tracking-tight uppercase text-sm">Brand Guidelines</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{workspace.brandUrl ? 'Connected' : 'Not Linked'}</p>
              </div>
            </a>
          </div>

          {/* Phases Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <Layout size={24} className="text-brand-500" />
                Project Phases (Months)
              </h2>
              <button 
                onClick={() => setShowAddPhase(true)}
                className="p-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 rounded-2xl transition-all border border-brand-500/10 group active:scale-95"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {workspace.phases?.length === 0 ? (
              <div className="bg-white dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] py-20 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No phases created yet</p>
                <button 
                  onClick={() => setShowAddPhase(true)}
                  className="mt-4 text-brand-500 font-black uppercase text-xs hover:underline tracking-widest"
                >
                  Create first phase
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {workspace.phases.map(p => (
                  <div key={p.id} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm">
                    {/* Phase Header */}
                    <div 
                      onClick={() => togglePhase(p.id)}
                      className="p-6 md:p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${expandedPhases[p.id] ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                           {expandedPhases[p.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</h3>
                           <div className="flex items-center gap-3 mt-1">
                             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                               <Calendar size={12} />
                               {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'TBD'}
                             </div>
                             {p.invoice && (
                               <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border tracking-tighter ${p.invoice.status === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                 <DollarSign size={10} />
                                 {p.invoice.status}
                               </div>
                             )}
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowAddTask(p.id); }}
                          className="px-4 py-2 bg-slate-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Add Video
                        </button>
                      </div>
                    </div>

                    {/* Phase Tasks (Lazy Loaded) */}
                    {expandedPhases[p.id] && (
                      <div className="px-6 md:px-8 pb-8 border-t border-slate-50 dark:border-white/[0.02] bg-slate-50/30 dark:bg-white/[0.005]">
                        {loadingTasks[p.id] ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-brand-500" />
                          </div>
                        ) : phaseTasks[p.id]?.length === 0 ? (
                          <div className="py-12 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No videos in this month</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto mt-6">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                                  <th className="pb-4 pl-2">Video Title</th>
                                  <th className="pb-4 text-center">Employee</th>
                                  <th className="pb-4 text-center">Deadline</th>
                                  <th className="pb-4 text-center">Status Pipeline</th>
                                  <th className="pb-4 text-right pr-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50 dark:divide-white/[0.03]">
                                {phaseTasks[p.id]?.map(task => (
                                  <tr key={task.id} className="group hover:bg-white dark:hover:bg-white/5 transition-colors">
                                    <td className="py-5 pl-2">
                                      <div className="flex flex-col">
                                        <input 
                                          type="text" 
                                          defaultValue={task.title}
                                          onBlur={(e) => handleTaskUpdate(task.id, p.id, { title: e.target.value })}
                                          className="text-sm font-black text-slate-800 dark:text-white bg-transparent border-none focus:ring-0 w-full p-0 py-0.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded px-1 transition-all"
                                        />
                                        <p className="text-[10px] items-center gap-1.5 font-bold text-slate-400 uppercase tracking-widest flex mt-1">
                                          <AlertCircle size={10} className="text-brand-500" />
                                          {task.privateNotes || 'No internal notes'}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="py-5 text-center">
                                      <select 
                                        defaultValue={task.assignedToId || ''}
                                        onChange={(e) => handleTaskUpdate(task.id, p.id, { assignedToId: e.target.value })}
                                        className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 border-none focus:ring-0 p-0 text-center cursor-pointer hover:text-brand-500 transition-colors"
                                      >
                                        <option value="">Unassigned</option>
                                        {teamMembers.map(m => (
                                          <option key={m.id} value={m.teamMemberInfo?.id}>{m.firstName} {m.lastName}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="py-5 text-center">
                                      <input 
                                        type="date"
                                        defaultValue={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleTaskUpdate(task.id, p.id, { deadline: e.target.value })}
                                        className="bg-transparent text-[11px] font-black text-slate-600 dark:text-slate-400 border-none focus:ring-0 p-0 text-center cursor-pointer font-mono"
                                      />
                                    </td>
                                    <td className="py-5 text-center">
                                      <div className="flex items-center justify-center">
                                        <select 
                                          defaultValue={task.status}
                                          onChange={(e) => handleTaskUpdate(task.id, p.id, { status: e.target.value })}
                                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-none focus:ring-0 cursor-pointer ${taskStatusConfig[task.status].bg} ${taskStatusConfig[task.status].color}`}
                                        >
                                          {Object.keys(taskStatusConfig).map(s => (
                                            <option key={s} value={s}>{taskStatusConfig[s].label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </td>
                                    <td className="py-5 text-right pr-2">
                                       <div className="flex items-center justify-end gap-2">
                                         {task.reviewUrl && (
                                           <a href={task.reviewUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-brand-500 transition-colors">
                                              <PlayCircle size={18} />
                                           </a>
                                         )}
                                         <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                                            <Edit2 size={16} />
                                         </button>
                                       </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          
          {/* Stats Bar */}
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
             <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Workspace Activity</h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={18} />
                         </div>
                         <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Completed Videos</span>
                      </div>
                      <span className="text-lg font-black text-slate-800 dark:text-white">{workspace.stats?.completedTasks || 0}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                            <Clock size={18} />
                         </div>
                         <span className="text-xs font-bold text-slate-500 dark:text-slate-400">In Progress</span>
                      </div>
                      <span className="text-lg font-black text-slate-800 dark:text-white">{workspace.stats?.pendingTasks || 0}</span>
                   </div>
                </div>
             </div>

             <div className="pt-8 border-t border-slate-50 dark:border-white/5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Team Workload</h3>
                <div className="space-y-4">
                  {workspace.stats?.teamLoad?.map(load => (
                    <div key={load.id} className="space-y-2">
                       <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-700 dark:text-slate-300">{load.name}</span>
                          <span className="text-slate-400 uppercase">{load.activeTasks} Videos</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 rounded-full" 
                            style={{ width: `${Math.min(100, (load.activeTasks / 5) * 100)}%` }}
                          ></div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Financial Widget */}
          <div className={`rounded-[2.5rem] p-8 border transition-all duration-500 ${isOverdue ? 'bg-rose-500/5 border-rose-500/20 shadow-xl shadow-rose-500/10' : 'bg-white dark:bg-[#0a0a0c]/40 border-slate-200 dark:border-white/5'}`}>
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Finance Ops</h3>
                <DollarSign size={18} className={isOverdue ? 'text-rose-500' : 'text-emerald-500'} />
             </div>
             
             {financialStatus ? (
               <div className="space-y-6">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Monthly Retainer</p>
                     <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">${financialStatus.amount.toLocaleString()}</p>
                  </div>
                  
                  <div className={`p-4 rounded-2xl flex items-center justify-between border ${financialStatus.status === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/20 mt-4' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-500/20'}`}>
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${financialStatus.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                        <span className={`text-[11px] font-black uppercase tracking-wider ${financialStatus.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {financialStatus.status}
                        </span>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Due: {new Date(financialStatus.dueDate).toLocaleDateString()}</p>
                  </div>

                  {isOverdue && (
                     <div className="p-4 bg-rose-500 text-white rounded-2xl flex items-center gap-3 animate-bounce shadow-lg shadow-rose-500/40 mt-4">
                        <AlertCircle size={20} />
                        <p className="text-[11px] font-black uppercase tracking-tight">Payment Overdue {'>'} 1 Week</p>
                     </div>
                  )}

                  <div className="flex items-center gap-3 pt-4">
                     <button 
                       onClick={async () => {
                         const loadingToast = toast.loading('Downloading...');
                         try {
                           const res = await downloadInvoicePDFAPI(financialStatus.id);
                           const url = window.URL.createObjectURL(new Blob([res.data]));
                           const link = document.createElement('a');
                           link.href = url;
                           link.setAttribute('download', `Invoice-${financialStatus.invoiceNumber}.pdf`);
                           document.body.appendChild(link);
                           link.click();
                           toast.success('Downloaded', { id: loadingToast });
                         } catch (e) { toast.error('Failed', { id: loadingToast }); }
                       }}
                       className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                     >
                       <FileText size={14} />
                       Receipt
                     </button>
                     <Link to="/admin/payments" className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-brand-500 rounded-xl transition-all">
                        <ExternalLink size={16} />
                     </Link>
                  </div>
               </div>
             ) : (
               <div className="py-6 text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest underline cursor-pointer hover:text-brand-500" onClick={() => setShowAddPhase(true)}>Link monthly invoice</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Add Phase Modal */}
      {showAddPhase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={() => setShowAddPhase(false)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95">
              <div className="px-6 md:px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Next Phase (Month)</h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">Start a new project cycle</p>
                </div>
                <button onClick={() => setShowAddPhase(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPhase} className="p-6 md:p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phase Title (e.g. March 2024)</label>
                    <input name="name" value={phaseForm.name} onChange={e => setPhaseForm({...phaseForm, name: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Start Date</label>
                       <input type="date" name="startDate" value={phaseForm.startDate} onChange={e => setPhaseForm({...phaseForm, startDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">End Date</label>
                       <input type="date" name="endDate" value={phaseForm.endDate} onChange={e => setPhaseForm({...phaseForm, endDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Monthly Billing Amount ($)</label>
                    <input type="number" name="amount" value={phaseForm.amount} onChange={e => setPhaseForm({...phaseForm, amount: e.target.value})} placeholder="0.00 (Optional)" className="w-full px-5 py-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-black" />
                 </div>

                 <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 transition-all active:scale-95">
                   {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Initialize Phase'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={() => setShowAddTask(null)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95">
              <div className="px-6 md:px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Add New Video</h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">Define requirements and deadline</p>
                </div>
                <button onClick={() => setShowAddTask(null)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="p-6 md:p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Video Title</label>
                    <input name="title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assign to Employee</label>
                    <select name="assignedToId" value={taskForm.assignedToId} onChange={e => setTaskForm({...taskForm, assignedToId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold">
                       <option value="">Select Employee</option>
                       {teamMembers.map(m => (
                         <option key={m.id} value={m.teamMemberInfo?.id}>{m.firstName} {m.lastName}</option>
                       ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Deadline Date</label>
                    <input type="date" name="deadline" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                 </div>

                 <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 transition-all active:scale-95">
                   {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Add Task to Pipeline'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;
