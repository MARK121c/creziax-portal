import { useEffect, useState, useCallback } from 'react';
import { getProjectsAPI, getContractsAPI } from '../../store/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { FolderKanban, Loader2, CheckCircle2, PlayCircle, Clock, Film, AlertCircle, Calendar } from 'lucide-react';

const STAGE_LABELS_AR = {
  EDITING: 'قيد المونتاج',
  REVIEW: 'مراجعة',
  COMPLETED: 'منجز',
};

const STAGE_LABELS_EN = {
  EDITING: 'Editing',
  REVIEW: 'Review',
  COMPLETED: 'Done',
};

const getClientTaskStatus = (status) => {
  if (status === 'COMPLETED' || status === 'DELIVERED') return 'COMPLETED';
  if (status === 'REVIEW') return 'REVIEW';
  return 'EDITING'; // Default for IDEA, SCRIPTING, SHOOTING, EDITING
};

const TaskMinimalRow = ({ task, isRTL }) => {
  const clientStatusKey = getClientTaskStatus(task.status);
  const label = isRTL ? STAGE_LABELS_AR[clientStatusKey] : STAGE_LABELS_EN[clientStatusKey];
  const isDone = clientStatusKey === 'COMPLETED';
  const isReview = clientStatusKey === 'REVIEW';

  let dotColor = 'bg-brand-500';
  let badgeClasses = 'bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20';

  if (isDone) {
    dotColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    badgeClasses = 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  } else if (isReview) {
    dotColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    badgeClasses = 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  }

  return (
    <div className={`group flex items-center justify-between p-5 md:p-6 rounded-[2rem] border transition-all duration-300 ${
      isDone ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10' 
             : 'bg-white dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.05] hover:border-slate-200 dark:hover:border-white/10'
    }`}>
      <div className="flex items-center gap-5 w-full">
        {/* Animated dot indicator */}
        <div className="relative flex items-center justify-center flex-shrink-0 w-4 h-4">
          {!isDone && <span className={`absolute w-full h-full rounded-full opacity-40 animate-ping ${dotColor}`} />}
          <span className={`relative w-2.5 h-2.5 rounded-full ${dotColor}`} />
        </div>
        
        {/* Video Icon */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
          isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
        }`}>
          {isReview ? <PlayCircle size={20} /> : isDone ? <CheckCircle2 size={20} /> : <Film size={20} />}
        </div>
        
        {/* Task Title */}
        <div className="flex-1 min-w-0 mx-2">
          <p className="text-sm md:text-base font-bold text-slate-800 dark:text-white truncate">
            {task.title}
          </p>
        </div>

        {/* Status Badge */}
        <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex-shrink-0 transition-all shadow-sm ${badgeClasses}`}>
          {label}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ClientProjects = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContract, setActiveContract] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([getProjectsAPI(), getContractsAPI()]);
      setProjects(pRes.data?.data || pRes.data || []);
      const myContracts = cRes.data?.data || cRes.data || [];
      if (myContracts.length > 0) {
        // Find latest contract
        const latest = myContracts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setActiveContract(latest);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', { transports: ['websocket'] });
    socket.on('task_updated', () => {
      fetchData(true);
      toast.success(t('video_status_updated'));
    });
    socket.on('workspace_updated', () => {
      fetchData(true);
      toast.info(t('syncing'));
    });
    return () => socket.disconnect();
  }, [fetchData, t]);

  // Compute total stats
  const totalTasks = projects.reduce((a, p) => a + (p.phases?.reduce((b, ph) => b + (ph.tasks?.length || 0), 0) || 0), 0);
  const doneTasks = projects.reduce((a, p) => a + (p.phases?.reduce((b, ph) => b + (ph.tasks?.filter(t => t.status === 'DELIVERED').length || 0), 0) || 0), 0);

  return (
    <div className="space-y-16 md:space-y-24 animate-in fade-in duration-1000 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-12 md:py-20 border-b border-slate-100 dark:border-white/[0.05]">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[2rem] bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-xl shadow-brand-500/5 transition-transform hover:rotate-3">
              <FolderKanban size={32} />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">
                {isRTL ? 'مشاريعي ومسار الإنتاج' : 'My Projects & Production'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold mt-2 opacity-80 italic">
                {isRTL ? 'تتبع حالة كل فيديو في الوقت الفعلي' : 'Track every video in real-time'}
              </p>
            </div>
          </div>

          {/* Quick stats bar */}
          {!loading && projects.length > 0 && (
            <div className="flex flex-wrap items-center gap-6 mt-4 px-1">
              <div className="flex items-center gap-2.5 text-sm font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-2xl">
                <FolderKanban size={16} className="text-brand-500" />
                <span>{projects.length} {isRTL ? 'مشروع' : 'Projects'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-2xl">
                <Film size={16} className="text-indigo-500" />
                <span>{totalTasks} {isRTL ? 'فيديو' : 'Videos'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                <CheckCircle2 size={16} />
                <span>{doneTasks} {isRTL ? 'منجز' : 'Done'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Contract Period Badge */}
        {activeContract && (
          <div className="flex-shrink-0">
             <div className="bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] p-6 shadow-2xl flex flex-col gap-2 min-w-[240px]">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                   <Calendar size={12} />
                   {t('contract_period')}
                </div>
                <div className="text-lg font-black tracking-tighter">
                   {new Date(activeContract.startDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                   <span className="mx-2 opacity-40">→</span>
                   {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '∞'}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-500">
                   {t('active_since')} {new Date(activeContract.createdAt).getFullYear()}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={44} className="animate-spin text-brand-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
            {isRTL ? 'جارٍ التزامن...' : 'Syncing...'}
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <AlertCircle size={36} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white">
            {isRTL ? 'لا توجد مشاريع بعد' : 'No Projects Yet'}
          </h3>
          <p className="text-slate-400 text-sm max-w-xs">
            {isRTL ? 'سيتم إضافة مشاريعك وفيديوهاتك هنا فور أن تبدأ الإنتاج.' : 'Your projects and videos will appear here once production starts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-14">
          {projects.map((project, pIdx) => {
            const total = project.phases?.reduce((a, ph) => a + (ph.tasks?.length || 0), 0) || 0;
            const done = project.phases?.reduce((a, ph) => a + (ph.tasks?.filter(t => t.status === 'DELIVERED').length || 0), 0) || 0;
            const overallPct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div key={project.id} className="space-y-6">
                {/* Project header card */}
                <div className="bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-white/[0.06] rounded-[2.5rem] p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                          {isRTL ? 'مشروع' : 'PROJECT'} {String(pIdx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {project.name}
                      </h2>
                      {project.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                          {project.description}
                        </p>
                      )}
                    </div>
                    {/* Overall progress ring */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6"
                            className="text-slate-100 dark:text-white/[0.05]" />
                          <circle cx="40" cy="40" r="34" fill="none"
                            stroke={overallPct === 100 ? '#10b981' : '#6366f1'}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - overallPct / 100)}`}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-lg font-black leading-none ${overallPct === 100 ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                            {overallPct}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{done}/{total}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {isRTL ? 'فيديو منجز' : 'Videos Done'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Videos / Tasks List */}
                <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/[0.06] rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Film size={18} className="text-slate-400" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-widest uppercase">
                      {isRTL ? 'فيديوهات المشروع' : 'Project Videos'}
                    </h3>
                  </div>

                  {project.phases && project.phases.some(ph => ph.tasks?.length > 0) ? (
                    <div className="space-y-4">
                      {project.phases
                        .sort((a,b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt))
                        .map(phase => (
                          <div key={phase.id} className="space-y-4">
                            {phase.tasks?.map(task => (
                              <TaskMinimalRow key={task.id} task={task} isRTL={isRTL} />
                            ))}
                          </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-sm font-medium">
                      {isRTL ? 'لا توجد فيديوهات في هذا المشروع بعد' : 'No videos in this project yet'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientProjects;
