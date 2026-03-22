import { useEffect, useState, useCallback } from 'react';
import { getProjectsAPI } from '../../store/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { FolderKanban, Loader2, CheckCircle2, PlayCircle, Clock, Film, AlertCircle } from 'lucide-react';

// ── Progress + Stage helpers ──────────────────────────────────────────────────
const getTimelineStage = (status) => {
  switch (status) {
    case 'SCRIPT': return 1;
    case 'EDITING': case 'IN_PROGRESS': return 2;
    case 'THUMBNAIL': return 3;
    case 'PUBLISHING': return 4;
    case 'COMPLETED': return 5;
    default: return 1;
  }
};

const getProgressPercent = (stage) => {
  const map = { 1: 10, 2: 40, 3: 65, 4: 85, 5: 100 };
  return map[stage] || 10;
};

const STAGE_LABELS = ['Script', 'Editing', 'Thumbnail', 'Publishing', 'Done'];
const STAGE_LABELS_AR = ['سكريبت', 'مونتاج', 'ثمبنيل', 'نشر', 'منجز'];

const TaskProgressCard = ({ task, isRTL }) => {
  const stage = getTimelineStage(task.status);
  const progress = getProgressPercent(stage);
  const isDone = stage === 5;
  const labels = isRTL ? STAGE_LABELS_AR : STAGE_LABELS;

  return (
    <div className={`rounded-3xl p-6 border transition-all duration-300 ${isDone
      ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
      : 'bg-white dark:bg-white/[0.025] border-slate-100 dark:border-white/[0.06]'}`}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-500 text-white' : 'bg-brand-500/15 text-brand-500'}`}>
            {isDone ? <CheckCircle2 size={14} /> : <Film size={14} />}
          </div>
          <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">
            {task.title}
          </p>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0 ${
          isDone
            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400'
        }`}>
          {labels[stage - 1]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            isDone
              ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'bg-gradient-to-r from-brand-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage dots */}
      <div className="flex justify-between items-center">
        {labels.map((label, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
              stage > idx
                ? 'border-brand-500 bg-brand-500 shadow-[0_0_6px_rgba(99,102,241,0.4)]'
                : stage === idx + 1
                  ? 'border-brand-400 bg-white dark:bg-slate-900 animate-pulse'
                  : 'border-slate-200 dark:border-white/10 bg-transparent'
            }`} />
            <span className={`text-[8px] font-black uppercase tracking-tighter leading-none ${stage > idx ? 'text-brand-500' : 'text-slate-400 dark:text-slate-600'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress percentage label */}
      <div className="flex justify-end mt-3">
        <span className={`text-[10px] font-black ${isDone ? 'text-emerald-500' : 'text-slate-400'}`}>
          {progress}%
        </span>
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

  const fetchProjects = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getProjectsAPI();
      setProjects(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Projects fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', { transports: ['websocket'] });
    socket.on('task_updated', () => fetchProjects(true));
    socket.on('workspace_updated', () => fetchProjects(true));
    return () => socket.disconnect();
  }, [fetchProjects]);

  // Compute total stats
  const totalTasks = projects.reduce((a, p) => a + (p.phases?.reduce((b, ph) => b + (ph.tasks?.length || 0), 0) || 0), 0);
  const doneTasks = projects.reduce((a, p) => a + (p.phases?.reduce((b, ph) => b + (ph.tasks?.filter(t => t.status === 'COMPLETED').length || 0), 0) || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 py-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            <FolderKanban size={24} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
              {isRTL ? 'مشاريعي ومسار الإنتاج' : 'My Projects & Production'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
              {isRTL ? 'تتبع حالة كل فيديو في الوقت الفعلي' : 'Track every video in real-time'}
            </p>
          </div>
        </div>

        {/* Quick stats bar */}
        {!loading && projects.length > 0 && (
          <div className="flex items-center gap-6 mt-4 px-1">
            <div className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-300">
              <FolderKanban size={15} className="text-brand-500" />
              <span>{projects.length} {isRTL ? 'مشروع' : 'Projects'}</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-300">
              <Film size={15} className="text-indigo-500" />
              <span>{totalTasks} {isRTL ? 'فيديو' : 'Videos'}</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} />
              <span>{doneTasks} {isRTL ? 'منجز' : 'Done'}</span>
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
            const done = project.phases?.reduce((a, ph) => a + (ph.tasks?.filter(t => t.status === 'COMPLETED').length || 0), 0) || 0;
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

                {/* Phases */}
                {project.phases?.map((phase) => (
                  <div key={phase.id} className="space-y-4 px-2">
                    {/* Phase label */}
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                      <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">
                        {phase.name}
                      </h3>
                      <div className="flex-1 h-px bg-slate-100 dark:bg-white/[0.05]" />
                      <span className="text-[10px] font-black text-slate-400">
                        {phase.tasks?.filter(t => t.status === 'COMPLETED').length || 0} / {phase.tasks?.length || 0}
                      </span>
                    </div>

                    {/* Task cards grid */}
                    {phase.tasks && phase.tasks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {phase.tasks.map((task) => (
                          <TaskProgressCard key={task.id} task={task} isRTL={isRTL} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        {isRTL ? 'لا توجد فيديوهات في هذه المرحلة بعد' : 'No videos in this phase yet'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientProjects;
