import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  DollarSign, Users, AlertCircle, Edit2, Layout, BookOpen, 
  HardDrive, Palette, Globe, ShieldCheck, ArrowUpRight, Wallet,
  Search, Filter, MoreVertical, Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const taskStatusConfig = {
  IDEA: { color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Idea', dot: 'bg-slate-500' },
  SCRIPTING: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Scripting', dot: 'bg-indigo-500' },
  SHOOTING: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Shooting', dot: 'bg-amber-500' },
  EDITING: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Editing', dot: 'bg-blue-500' },
  REVIEW: { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Review', dot: 'bg-purple-500' },
  DELIVERED: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Delivered', dot: 'bg-emerald-500' },
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
  const [submitting, setSubmitting] = useState(false);

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
      
      // Auto-expand latest phase
      if (wRes.data.phases?.length > 0) {
        const latestPhaseId = wRes.data.phases[0].id;
        setExpandedPhases({ [latestPhaseId]: true });
        loadPhaseTasks(latestPhaseId);
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
        <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Syncing Workspace Portal...</p>
      </div>
    );
  }

  if (!workspace) return <div>Workspace not found</div>;

  const currentPhase = workspace.phases?.[0]; 
  const financialStatus = currentPhase?.invoice;
  const isOverdue = financialStatus?.status === 'PENDING' && 
                    new Date(financialStatus.dueDate) < new Date();

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20">
      
      {/* Premium Hero Header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/5 to-indigo-600/5 dark:from-brand-500/10 dark:to-indigo-500/10 rounded-[3rem] -z-10 blur-xl transition-all group-hover:blur-2xl opacity-60"></div>
        <div className="bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 md:p-12 shadow-sm backdrop-blur-md">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Client Logo Wrap */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border-4 border-white dark:border-slate-900 shadow-2xl flex items-center justify-center overflow-hidden">
                  {workspace.client?.logoUrl ? (
                    <img src={getFormattedLogoUrl(workspace.client.logoUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Briefcase size={32} className="text-slate-300" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-lg">
                  <ShieldCheck size={20} />
                </div>
              </div>

              <div className="space-y-4 text-center md:text-left">
                <nav className="flex items-center justify-center md:justify-start gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <Link to="/admin/projects" className="hover:text-brand-500 transition-colors">Projects</Link>
                  <ChevronRight size={10} />
                  <span className="text-slate-800 dark:text-white">Workspace Detail</span>
                </nav>
                <h1 className="text-3xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">
                  {workspace.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                    V2.1 Premium Active
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/5">
                    <Users size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {workspace.client?.user?.firstName} {workspace.client?.user?.lastName} (Client)
                    </span>
                  </div>
                  {workspace.annualContractDate && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <Calendar size={14} className="text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                        Contract Renewal: {new Date(workspace.annualContractDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Quickview Banner */}
            {financialStatus && (
              <div className={`xl:w-80 p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${isOverdue ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500/20'}`}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Phase Ops</p>
                  <DollarSign size={16} className={isOverdue ? 'text-rose-500' : 'text-emerald-500'} />
                </div>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">${financialStatus.amount.toLocaleString()}</p>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${financialStatus.status === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                      {financialStatus.status}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Monthly Retainer</p>
                    <Link to="/admin/payments" className="text-brand-500 hover:underline">
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        
        {/* Main Work Area */}
        <div className="xl:col-span-3 space-y-10">
          
          {/* Quick Assets Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Notion Hub', url: workspace.notionUrl, icon: BookOpen, color: 'text-slate-800 dark:text-white', bg: 'bg-slate-100 dark:bg-white/5' },
              { label: 'Asset Drive', url: workspace.driveUrl, icon: HardDrive, color: 'text-brand-500', bg: 'bg-brand-500/10' },
              { label: 'Brand Book', url: workspace.brandUrl, icon: Palette, color: 'text-amber-500', bg: 'bg-amber-500/10' }
            ].map((asset, i) => (
              <a 
                key={i}
                href={asset.url || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`group p-6 rounded-[2rem] border transition-all duration-300 flex items-center gap-5 ${asset.url ? 'bg-white dark:bg-[#0a0a0c]/40 border-slate-200 dark:border-white/5 hover:border-brand-500/30' : 'opacity-40 grayscale cursor-not-allowed border-dashed border-slate-200 dark:border-white/5'}`}
              >
                <div className={`w-14 h-14 rounded-2xl ${asset.bg} flex items-center justify-center ${asset.color} group-hover:scale-110 transition-transform`}>
                  <asset.icon size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white tracking-tight uppercase text-sm">{asset.label}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">{asset.url ? 'Connected' : 'Not Linked'}</p>
                </div>
                {asset.url && <ArrowUpRight size={14} className="ml-auto text-slate-300 group-hover:text-brand-500 transition-all" />}
              </a>
            ))}
          </div>

          {/* Monthly Phases Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <Layout size={24} className="text-brand-500" />
                Editorial Timeline
              </h2>
              <button 
                onClick={() => setShowAddPhase(true)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-600/20 transition-all active:scale-95"
              >
                <Plus size={16} />
                New Month
              </button>
            </div>

            {workspace.phases?.length === 0 ? (
              <div className="bg-white dark:bg-[#0a0a0c]/40 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] py-24 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Calendar size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Active Phases</h3>
                <p className="text-slate-400 text-sm mt-2">Initialize your first month to start managing content.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workspace.phases.map(p => (
                  <div key={p.id} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden transition-all shadow-sm">
                    {/* Phase Header */}
                    <div 
                      onClick={() => togglePhase(p.id)}
                      className="p-8 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all gap-6"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${expandedPhases[p.id] ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                           {expandedPhases[p.id] ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{p.name}</h3>
                           <div className="flex items-center gap-3 mt-1.5">
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                               <Calendar size={12} className="text-brand-500/60" />
                               {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'TBD'}
                             </div>
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 pl-20 md:pl-0">
                        {p.invoice && (
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black border tracking-widest shadow-sm ${p.invoice.status === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                            <DollarSign size={12} />
                            BILLING: {p.invoice.status}
                          </div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowAddTask(p.id); }}
                          className="px-6 py-2.5 bg-slate-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
                        >
                          + Add Video
                        </button>
                      </div>
                    </div>

                    {/* Table View (Lazy Loaded) */}
                    {expandedPhases[p.id] && (
                      <div className="px-8 pb-10 border-t border-slate-50 dark:border-white/[0.02] bg-slate-50/50 dark:bg-white/[0.005]">
                        {loadingTasks[p.id] ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={32} className="animate-spin text-brand-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Production Queue...</p>
                          </div>
                        ) : phaseTasks[p.id]?.length === 0 ? (
                          <div className="py-20 text-center">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Production Queue Empty</p>
                            <button onClick={() => setShowAddTask(p.id)} className="mt-4 text-brand-500 font-black uppercase text-[10px] tracking-widest hover:underline">+ New Entry</button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto mt-8 relative">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-200 dark:border-white/5">
                                  <th className="pb-6 pl-2">Creative Asset / Video Title</th>
                                  <th className="pb-6 text-center">In Charge</th>
                                  <th className="pb-6 text-center">Deadline</th>
                                  <th className="pb-6 text-center">Status Pipeline</th>
                                  <th className="pb-6 text-right pr-2">Vault</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50 dark:divide-white/[0.03]">
                                {phaseTasks[p.id]?.map(task => (
                                  <tr key={task.id} className="group hover:bg-white dark:hover:bg-white/5 transition-all duration-300">
                                    <td className="py-7 pl-2">
                                      <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${taskStatusConfig[task.status].dot} shadow-[0_0_8px_rgba(var(--status-color),0.4)] transition-all`} />
                                        <div className="flex flex-col flex-1">
                                          <input 
                                            type="text" 
                                            defaultValue={task.title}
                                            onBlur={(e) => handleTaskUpdate(task.id, p.id, { title: e.target.value })}
                                            className="text-sm font-black text-slate-800 dark:text-white bg-transparent border-none focus:ring-0 w-full p-0 py-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg px-2 transition-all outline-none"
                                          />
                                          <div className="flex items-center gap-3 mt-1.5 pl-2">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                              <PlayCircle size={10} className="text-indigo-500" />
                                              Internal Note: {task.privateNotes || 'Ref. Primary Script'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-7 text-center">
                                      <div className="flex items-center justify-center">
                                        <div className="relative group/user">
                                          <select 
                                            defaultValue={task.assignedToId || ''}
                                            onChange={(e) => handleTaskUpdate(task.id, p.id, { assignedToId: e.target.value })}
                                            className="appearance-none bg-slate-100 dark:bg-white/5 text-[11px] font-black text-slate-700 dark:text-slate-300 px-4 py-2 rounded-2xl border-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:bg-brand-500/10 hover:text-brand-500 transition-all text-center min-w-[140px]"
                                          >
                                            <option value="">No Assignee</option>
                                            {teamMembers.map(m => (
                                              <option key={m.id} value={m.teamMemberInfo?.id}>{m.firstName} {m.lastName}</option>
                                            ))}
                                          </select>
                                          {task.assignedTo?.user?.avatarUrl && (
                                              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-md">
                                                <img src={getFormattedLogoUrl(task.assignedTo.user.avatarUrl)} className="w-full h-full object-cover rounded-full" />
                                              </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-7 text-center">
                                      <div className="inline-flex items-center gap-2 group/date">
                                        <input 
                                          type="date"
                                          defaultValue={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
                                          onChange={(e) => handleTaskUpdate(task.id, p.id, { deadline: e.target.value })}
                                          className="bg-transparent text-[11px] font-black text-slate-700 dark:text-slate-400 border-none focus:ring-0 p-0 text-center cursor-pointer font-mono group-hover/date:text-brand-500 transition-colors"
                                        />
                                        {!task.deadline && <Clock size={12} className="text-slate-300" />}
                                      </div>
                                    </td>
                                    <td className="py-7 text-center">
                                      <div className="flex items-center justify-center">
                                        <select 
                                          defaultValue={task.status}
                                          onChange={(e) => handleTaskUpdate(task.id, p.id, { status: e.target.value })}
                                          className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer shadow-sm transition-all text-center min-w-[120px] ${taskStatusConfig[task.status].bg} ${taskStatusConfig[task.status].color}`}
                                        >
                                          {Object.keys(taskStatusConfig).map(s => (
                                            <option key={s} value={s}>{taskStatusConfig[s].label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </td>
                                    <td className="py-7 text-right pr-2">
                                       <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                         {task.reviewUrl && (
                                           <a href={task.reviewUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20 hover:scale-110 active:scale-95 transition-all">
                                              <ExternalLink size={16} />
                                           </a>
                                         )}
                                         <button className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all">
                                            <MoreVertical size={16} />
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

        {/* Premium Sidebar Widgets */}
        <div className="space-y-10">
          
          {/* Production Performance Card */}
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Production Health</h3>
                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                      <div className="flex items-center gap-3 mb-2">
                         <CheckCircle2 size={16} className="text-emerald-500" />
                         <span className="text-[10px] font-black text-emerald-600/60 uppercase">Done</span>
                      </div>
                      <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{workspace.stats?.completedTasks || 0}</p>
                   </div>
                   <div className="p-6 bg-brand-500/5 border border-brand-500/10 rounded-3xl">
                      <div className="flex items-center gap-3 mb-2">
                         <Clock size={16} className="text-brand-500" />
                         <span className="text-[10px] font-black text-brand-500/60 uppercase">Queue</span>
                      </div>
                      <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{workspace.stats?.pendingTasks || 0}</p>
                   </div>
                </div>
             </div>

             <div className="pt-10 border-t border-slate-50 dark:border-white/5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Execution Workload</h3>
                <div className="space-y-6">
                  {workspace.stats?.teamLoad?.map((load, idx) => (
                    <div key={idx} className="space-y-2.5 group">
                       <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tight">
                          <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                            {load.name}
                          </span>
                          <span className="text-slate-400 font-mono">{load.activeTasks}</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-1000 group-hover:from-indigo-500 group-hover:to-brand-500" 
                            style={{ width: `${Math.min(100, (load.activeTasks / 5) * 100)}%` }}
                          ></div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Detailed Finance Ops Widget */}
          <div className={`rounded-[2.5rem] p-10 border-2 transition-all duration-500 relative overflow-hidden ${isOverdue ? 'bg-rose-500 text-white border-rose-600 shadow-2xl shadow-rose-500/40' : 'bg-white dark:bg-[#0a0a0c]/40 border-slate-200 dark:border-white/5'}`}>
             {!isOverdue && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
             
             <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                   <h3 className={`text-sm font-black uppercase tracking-tight ${isOverdue ? 'text-white' : 'text-slate-800 dark:text-white'}`}>Finance Guard</h3>
                   <p className={`text-[10px] font-bold uppercase tracking-widest ${isOverdue ? 'text-white/60' : 'text-slate-400'}`}>Operational Billing</p>
                </div>
                <Wallet size={24} className={isOverdue ? 'text-white animate-pulse' : 'text-slate-200'} />
             </div>
             
             {financialStatus ? (
               <div className="space-y-8">
                  <div>
                     <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isOverdue ? 'text-white/40' : 'text-slate-400'}`}>Current Retainer</p>
                     <p className="text-4xl font-black tracking-tighter">${financialStatus.amount.toLocaleString()}</p>
                  </div>
                  
                  <div className={`p-5 rounded-3xl flex items-center justify-between border-2 ${isOverdue ? 'bg-white/10 border-white/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                     <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${isOverdue ? 'bg-white' : 'bg-emerald-500'}`}></div>
                        <span className="text-[11px] font-black uppercase tracking-widest">
                          {financialStatus.status}
                        </span>
                     </div>
                     <p className={`text-[10px] font-black uppercase tracking-tighter ${isOverdue ? 'text-white/70' : 'text-slate-400'}`}>Due: {new Date(financialStatus.dueDate).toLocaleDateString()}</p>
                  </div>

                  {isOverdue && (
                     <div className="flex items-center gap-3 p-5 bg-black/20 rounded-3xl border border-white/20 animate-in slide-in-from-bottom-2">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-[11px] font-black uppercase tracking-tight leading-snug">Payment overdue by more than 7 days. Action required.</p>
                     </div>
                  )}

                  <div className="flex items-center gap-3 pt-6">
                     <button 
                       onClick={async () => {
                         const loadingToast = toast.loading('Exporting Factura...');
                         try {
                           const res = await downloadInvoicePDFAPI(financialStatus.id);
                           const url = window.URL.createObjectURL(new Blob([res.data]));
                           const link = document.createElement('a');
                           link.href = url;
                           link.setAttribute('download', `Factura-${financialStatus.invoiceNumber}.pdf`);
                           document.body.appendChild(link);
                           link.click();
                           toast.success('Generated Successfully', { id: loadingToast });
                         } catch (e) { toast.error('Export Failed', { id: loadingToast }); }
                       }}
                       className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isOverdue ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02]'}`}
                     >
                       <FileText size={16} />
                       Get Invoice
                     </button>
                  </div>
               </div>
             ) : (
               <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl group cursor-pointer hover:border-brand-500 transition-colors" onClick={() => setShowAddPhase(true)}>
                  <DollarSign size={32} className="mx-auto text-slate-200 mb-4 group-hover:text-brand-500 transition-colors" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No Monthly Invoice Link<br/><span className="text-brand-500">Initialize Month Now</span></p>
               </div>
             )}
          </div>

          {/* Internal Management History */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
             <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                   <ShieldCheck size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wider">Project Audit</h3>
                <p className="text-sm font-medium text-white/50 leading-relaxed">View all internal changes, asset overrides, and payment authorizations in the master log.</p>
                <Link to="/admin/projects" className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                  Access Master Log
                  <ChevronRight size={14} />
                </Link>
             </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      {/* Add Phase Modal overhaul */}
      {showAddPhase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md transition-all">
           <div className="absolute inset-0 bg-slate-950/40" onClick={() => setShowAddPhase(false)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[3rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-10 py-10 flex items-center justify-between border-b border-slate-50 dark:border-white/5">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Phase Initialization</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wide">Prepare project billing & timeline</p>
                </div>
                <button onClick={() => setShowAddPhase(false)} className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all active:scale-90">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddPhase} className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Phase Identifier (e.g. MARCH 2024 Retainer)</label>
                    <input name="name" value={phaseForm.name} onChange={e => setPhaseForm({...phaseForm, name: e.target.value})} required className="w-full px-6 py-5 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-3xl text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-black text-lg" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Period Start</label>
                       <input type="date" name="startDate" value={phaseForm.startDate} onChange={e => setPhaseForm({...phaseForm, startDate: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-bold" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Period End</label>
                       <input type="date" name="endDate" value={phaseForm.endDate} onChange={e => setPhaseForm({...phaseForm, endDate: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-bold" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Auto-Invoice Retainer Amount ($)</label>
                    <div className="relative">
                       < DollarSign size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" />
                       <input type="number" name="amount" value={phaseForm.amount} onChange={e => setPhaseForm({...phaseForm, amount: e.target.value})} placeholder="0.00" className="w-full pl-14 pr-6 py-5 bg-emerald-500/[0.05] border-2 border-emerald-500/20 rounded-3xl text-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-2xl" />
                    </div>
                 </div>

                 <button type="submit" disabled={submitting} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-[0.2em]">
                   {submitting ? <Loader2 className="animate-spin mx-auto" size={28} /> : 'Sync Phase to Database'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Add Video Task Modal overhaul */}
      {showAddTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="absolute inset-0 bg-slate-950/40" onClick={() => setShowAddTask(null)}></div>
           <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[3rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-10 py-10 flex items-center justify-between border-b border-slate-50 dark:border-white/5">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Stage New Video</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wide">Deploy task to production pipeline</p>
                </div>
                <button onClick={() => setShowAddTask(null)} className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Asset Title / Identifier</label>
                    <input name="title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required className="w-full px-6 py-5 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-3xl text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-black text-lg" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Assign Expert</label>
                       <select name="assignedToId" value={taskForm.assignedToId} onChange={e => setTaskForm({...taskForm, assignedToId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-bold">
                          <option value="">Select Pro</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.teamMemberInfo?.id}>{m.firstName} {m.lastName}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Hard Deadline</label>
                       <input type="date" name="deadline" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:border-brand-500 transition-all font-bold" />
                    </div>
                 </div>

                 <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-3xl shadow-2xl shadow-brand-600/30 transition-all hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-[0.2em]">
                   {submitting ? <Loader2 className="animate-spin mx-auto" size={28} /> : 'Deploy Asset to Pipeline'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;
